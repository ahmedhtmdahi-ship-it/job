import shutil
from dataclasses import replace
import pytest
from playwright.sync_api import sync_playwright
from ahmed_jobs.storage import Store
from ahmed_jobs.form_adapter import FormSpec,FormBlocked,capture,stage_review,execute_reviewed

SPEC=FormSpec('fixture-application','1','fixture.invalid','form','#send','#receipt',r'APP-\d+',r'/confirmation$',True,False)
FORM='''<form action="/apply?csrf=PRIVATE-HIDDEN" method="post">
<input type="hidden" name="csrf" value="PRIVATE-HIDDEN"><input name="name" value="Ahmed Hatem Dahi" required>
<textarea name="cover_letter" required>Reviewed application</textarea><button id="send" type="submit">Apply</button></form>'''

@pytest.fixture
def setup(tmp_path):
    with sync_playwright() as p:
        options={'headless':True}
        if shutil.which('chromium'):options['executable_path']=shutil.which('chromium')
        browser=p.chromium.launch(**options);page=browser.new_page();s=Store(tmp_path/'data')
        page.route('https://fixture.invalid/**',lambda route:route.fulfill(content_type='text/html',body=FORM))
        page.goto('https://fixture.invalid/job')
        did=s.save_draft({'action':'application','destination':'https://fixture.invalid/job','text':'Reviewed application','eligibility':'eligible','attachments':[],'cost':0,'credits':0})
        yield page,s,did
        s.close();browser.close()

def review(page,s,did):
    snap=capture(page,SPEC,fixture=True);stage_review(s,did,snap);s.approve(did);return snap

def test_hidden_tokens_never_saved_and_all_visible_fields_reviewed(setup):
    page,s,did=setup;snapshot=review(page,s,did)
    import json
    assert 'PRIVATE-HIDDEN' not in json.dumps(s.draft(did))
    assert snapshot['action']=='https://fixture.invalid/apply'
    assert [f['name'] for f in snapshot['fields']]==['name','cover_letter']

def test_actual_form_edit_invalidates_approval_before_click(setup):
    page,s,did=setup;review(page,s,did);page.locator('[name=name]').fill('Changed')
    with pytest.raises(FormBlocked,match='الموافقة السابقة'):execute_reviewed(page,s,did,SPEC,fixture=True)
    assert s.draft(did)['state']=='needs_review'
    assert s.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0]==0

def test_journal_precedes_post_and_specific_receipt_required(setup):
    page,s,did=setup;review(page,s,did);observed=[]
    def route(r):
        if r.request.method=='POST':
            observed.append(s.draft(did)['state'])
            r.fulfill(content_type='text/html',body='<script>history.replaceState({},"","/confirmation")</script><p id="receipt">APP-12345</p>')
        elif r.request.url.endswith('/confirmation'):r.fulfill(content_type='text/html',body='<p id="receipt">APP-12345</p>')
        else:r.fulfill(content_type='text/html',body=FORM)
    page.unroute('https://fixture.invalid/**');page.route('https://fixture.invalid/**',route)
    result=execute_reviewed(page,s,did,SPEC,fixture=True,receipt_timeout_ms=200)
    assert observed==['submitting'] and result['state']=='submitted'
    with pytest.raises(ValueError):s.begin_attempt(did)

def test_generic_thank_you_is_uncertain_and_not_retried(setup):
    page,s,did=setup;review(page,s,did)
    page.unroute('https://fixture.invalid/**')
    page.route('https://fixture.invalid/**',lambda r:r.fulfill(content_type='text/html',body='<p>Thank you for applying</p>'))
    assert execute_reviewed(page,s,did,SPEC,fixture=True,receipt_timeout_ms=10)['state']=='uncertain'
    with pytest.raises(ValueError):s.begin_attempt(did)

def test_network_failure_after_post_is_uncertain(setup):
    page,s,did=setup;review(page,s,did)
    page.unroute('https://fixture.invalid/**');page.route('https://fixture.invalid/**',lambda r:r.abort('failed'))
    assert execute_reviewed(page,s,did,SPEC,fixture=True,receipt_timeout_ms=10)['state']=='uncertain'

def test_unknown_required_question_and_consent_block(setup):
    page,s,did=setup;page.locator('form').evaluate('(f)=>f.insertAdjacentHTML("beforeend",\'<input name="rights" required><input type="checkbox" name="consent" required>\')')
    with pytest.raises(FormBlocked) as e:capture(page,SPEC,fixture=True)
    assert e.value.state=='needs_answers'

def test_paid_credits_and_unverified_live_adapter_block(setup):
    page,s,did=setup
    with pytest.raises(FormBlocked) as e:capture(page,SPEC)
    assert e.value.state=='manual_required'
    page.locator('body').evaluate('(e)=>e.insertAdjacentHTML("beforeend","<p>Requires 12 Connects</p>")')
    with pytest.raises(FormBlocked) as e:capture(page,SPEC,fixture=True)
    assert e.value.state=='payment_required'

def test_changed_form_destination_is_blocked(setup):
    page,s,did=setup;page.locator('form').evaluate('(f)=>f.action="https://evil.invalid/submit"')
    with pytest.raises(FormBlocked) as e:capture(page,SPEC,fixture=True)
    assert e.value.state=='manual_required'

def test_uploaded_file_bytes_must_match_selected_assets(setup,tmp_path):
    page,s,did=setup;good=tmp_path/'cv.txt';good.write_text('Original resume');bad=tmp_path/'other.txt';bad.write_text('Unreviewed')
    d=s.draft(did);d['payload']['attachments']=[str(good)];s.save_draft(d['payload'],draft_id=did)
    page.locator('form').evaluate('(f)=>f.insertAdjacentHTML("beforeend",\'<input type="file" name="resume" required>\')')
    page.locator('[type=file]').set_input_files(str(bad))
    with pytest.raises(FormBlocked) as e:stage_review(s,did,capture(page,SPEC,fixture=True))
    assert e.value.state=='needs_asset_review'
    page.locator('[type=file]').set_input_files(str(good));review(page,s,did)
    good.write_text('Changed after approval')
    with pytest.raises(ValueError):s.begin_attempt(did)

def test_required_radio_group_accepts_only_explicit_selected_choice(setup):
    page,s,did=setup
    page.locator('form').evaluate('(f)=>f.insertAdjacentHTML("beforeend",\'<input type="radio" name="remote" value="yes" required checked><input type="radio" name="remote" value="no" required>\')')
    assert len(capture(page,SPEC,fixture=True)['fields'])==4

def test_fixture_switch_cannot_enable_real_domain_submission(setup):
    page,s,did=setup
    with pytest.raises(FormBlocked,match='وضع الاختبار'):
        capture(page,replace(SPEC,host='www.linkedin.com'),fixture=True)
