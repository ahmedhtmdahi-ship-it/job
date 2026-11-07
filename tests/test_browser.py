"""Local DOM fixtures only: never contacts job platforms or sends applications."""
import shutil
import pytest
from playwright.sync_api import sync_playwright
from ahmed_jobs.browser import preview_fields,fill_preview
from ahmed_jobs.config import seed

@pytest.fixture
def page():
    with sync_playwright() as p:
        chromium=shutil.which('chromium')
        options={'headless':True}
        if chromium:options['executable_path']=chromium
        browser=p.chromium.launch(**options)
        page=browser.new_page();yield page;browser.close()

def test_multistep_select_files_unknown_consent_and_no_submit(page,tmp_path):
    resume=tmp_path/'سيرة.txt';resume.write_text('Resume')
    cover=tmp_path/'cover.txt';cover.write_text('Letter')
    page.set_content('''<form onsubmit="window.sent=true;return false">
      <section id="first"><input name="name" required><input name="email" type="email" required>
      <select id="country"><option value="">Choose</option><option value="EG">Egypt</option></select>
      <button type="button" onclick="document.querySelector('#first').hidden=true;document.querySelector('#second').hidden=false">Next</button></section>
      <section id="second" hidden><input id="city" role="combobox" required><input id="cv" type="file">
      <input id="letter" type="file"><input id="remote" type="radio"><input id="consent" type="checkbox">
      <input id="workrights" required><button type="submit">Submit</button></section></form>''')
    result=fill_preview(page,seed('applicant_profile'),{'text':'Reviewed letter'})
    assert set(result['filled'])=={'name','email'}
    result=preview_fields(page,[{'selector':'#country','value':'EG'}])
    assert result['filled']==['#country']
    page.get_by_role('button',name='Next',exact=True).click()
    result=preview_fields(page,[{'selector':'#city','value':'Assiut'},
             {'selector':'#cv','value':str(resume)},{'selector':'#letter','value':str(cover)},
             {'selector':'#remote','value':True},{'selector':'#consent','value':True,'consent':True},
             {'selector':'#workrights','value':None}])
    assert result['manual_required']==['#city','#consent','#workrights']
    assert page.locator('#cv').evaluate('(e)=>e.files[0].name')=='سيرة.txt'
    assert page.locator('#letter').evaluate('(e)=>e.files.length')==1
    assert not page.locator('#consent').is_checked()
    assert page.evaluate('window.sent === undefined')

def test_visible_fill_uses_only_selected_resume_and_known_answers(page,tmp_path):
    cv=tmp_path/'cv.pdf';cv.write_bytes(b'%PDF-test')
    other=tmp_path/'private.txt';other.write_text('not selected for upload')
    page.set_content('''<form onsubmit="window.sent=true;return false"><input name="full_name" required>
      <select name="country"><option value="US">US</option><option value="EG">Egypt</option></select>
      <input name="resume" type="file" accept=".pdf"><input name="workrights" required>
      <input name="unknown" required><input name="terms" type="checkbox"><button type="submit">Submit</button></form>''')
    result=fill_preview(page,seed('applicant_profile'),{'text':'Reviewed','attachments':[str(cv),str(other)],'resume':str(cv),'answers':{'workrights':'No'}})
    assert set(result['filled'])=={'full_name','country','resume','workrights'}
    assert 'unknown' in result['manual_required'] and 'terms' in result['manual_required']
    assert page.locator('[name=resume]').evaluate('(e)=>e.files.length')==1
    assert page.locator('[name=country]').input_value()=='EG'
    assert not page.locator('[name=terms]').is_checked() and page.evaluate('window.sent===undefined')
