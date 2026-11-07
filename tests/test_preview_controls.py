import shutil
from playwright.sync_api import sync_playwright
from ahmed_jobs.browser import review_controls,security_pending,fill_preview
from ahmed_jobs.form_adapter import capture,FormSpec,stage_review,FormBlocked
from ahmed_jobs.storage import Store
from ahmed_jobs.config import seed
import pytest

def test_review_buttons_are_non_submitting_and_inspection_never_authorizes(tmp_path):
    with sync_playwright() as p:
        options={'headless':True}
        if shutil.which('chromium'):options['executable_path']=shutil.which('chromium')
        browser=p.chromium.launch(**options);page=browser.new_page()
        page.route('https://fixture.invalid/**',lambda r:r.fulfill(content_type='text/html',body='<form action="/send" method="post" onsubmit="window.sent=true;return false"><input name="email" required><button type="submit">Send</button></form>'))
        page.goto('https://fixture.invalid/job');flags={};review_controls(page,flags)
        page.get_by_role('button',name='حفظ الحقول المعروضة للمراجعة داخل البرنامج').click()
        assert flags.get('capture') and page.evaluate('window.sent===undefined')
        snap=capture(page,FormSpec('inspection','1','fixture.invalid','form','','','',''),inspection=True)
        assert snap['inspection_only'] and snap['missing_questions']==['email'] and snap['cost'] is None
        s=Store(tmp_path);did=s.save_draft({'destination':'https://fixture.invalid/job','text':'Draft'})
        with pytest.raises(FormBlocked):stage_review(s,did,snap)
        s.close();browser.close()

def test_security_pause_checks_token_presence_only_and_can_resume():
    with sync_playwright() as p:
        options={'headless':True}
        if shutil.which('chromium'):options['executable_path']=shutil.which('chromium')
        browser=p.chromium.launch(**options);page=browser.new_page()
        page.route('https://captcha.invalid/**',lambda r:r.fulfill(content_type='text/html',body='security fixture'))
        page.set_content('<iframe src="https://captcha.invalid/captcha"></iframe><textarea name="g-recaptcha-response" hidden></textarea><input name="email" required>')
        assert security_pending(page)
        assert fill_preview(page,seed('applicant_profile'),{'text':'Reviewed'})['status']=='needs_security'
        page.locator('textarea').evaluate('(e)=>e.value="TEST-USER-COMPLETED"')
        assert not security_pending(page)
        result=fill_preview(page,seed('applicant_profile'),{'text':'Reviewed'})
        assert result['filled']==['email']
        browser.close()
