import json
import zipfile
import pytest
from ahmed_jobs.config import seed
from ahmed_jobs.matching import assess,phrase
from ahmed_jobs.safety import canonical,inspect_zip,extract_zip
from ahmed_jobs.storage import Store
from ahmed_jobs.discovery import parse_detail

@pytest.fixture
def store(tmp_path):
    s=Store(tmp_path/'data'); yield s; s.close()

def job(**kw):return dict(title='Junior data analyst',url='https://example.org/jobs?jk=1',**kw)

@pytest.mark.parametrize('maximum,state',[(4,'filtered'),(5,'needs_review'),(8,'needs_review')])
def test_hourly_pay(maximum,state):
    result=assess(job(currency='USD',pay_unit='hour',pay_min=3,pay_max=maximum),seed('career_tracks'))
    assert result['status']==state

@pytest.mark.parametrize('currency,unit,maximum',[(None,'hour',1),('$','hour',1),('CAD','hour',1),('USD','month',1),('USD','fixed',1)])
def test_unknown_non_hourly_not_guessed(currency,unit,maximum):
    assert assess(job(currency=currency,pay_unit=unit,pay_max=maximum),[])['status']=='needs_review'

@pytest.mark.parametrize('description,state',[
 ('Remote US-only','filtered'),('Remote for US clients worldwide','needs_review'),
 ('Remote','needs_review'),('Must reside in the United States','filtered')])
def test_location(description,state):assert assess(job(description=description),[])['status']==state

def test_arabic_and_legal():
    result=assess({'title':'مُساعِد قَانوني','description':''},seed('career_tracks'))
    assert result['matches'][0]['track']=='legal'
    assert not phrase('illegality','legal')

def test_job_identity(store):
    a=store.add_job(job()); b=store.add_job(job())
    assert a==b and len(store.jobs())==1
    assert canonical('https://example.org/?jk=1&utm_source=x')=='https://example.org/?jk=1'
    assert canonical('https://example.org/?jk=1')!=canonical('https://example.org/?jk=2')

@pytest.mark.parametrize('name',['../escape','/absolute','a/../../b','C:/bad','a\\b'])
def test_zip_traversal(tmp_path,name):
    path=tmp_path/'bad.zip'
    with zipfile.ZipFile(path,'w') as z:z.writestr(name,'bad')
    with pytest.raises(ValueError):inspect_zip(path)
    assert not (tmp_path/'output').exists()

def test_import_duplicate_and_original(store,tmp_path):
    path=tmp_path/'input.zip'
    with zipfile.ZipFile(path,'w') as z:z.writestr('assets/file.txt','unchanged')
    original=path.read_bytes()
    assert store.import_bundle(path)['files']==1
    assert store.import_bundle(path)['duplicate']
    assert path.read_bytes()==original

def payload(tmp_path):
    f=tmp_path/'cv.txt'; f.write_text('resume')
    return dict(action='application',destination='https://example.org/apply',text='Application',answers={},
                unknown_questions=[],attachments=[str(f)],cost=0,credits=0,eligibility='eligible',adapter_version='test-v1')

@pytest.mark.parametrize('field,value',[('text','changed'),('destination','https://example.org/other'),('answers',{'a':'b'}),('cost',1),('credits',1),('adapter_version','test-v2')])
def test_tamper_invalidates(store,tmp_path,field,value):
    p=payload(tmp_path); did=store.save_draft(p); store.approve(did)
    # Simulate out-of-band edit, bypassing save_draft's explicit invalidation.
    p[field]=value
    with store.db:store.db.execute('UPDATE drafts SET payload=? WHERE id=?',(json.dumps(p),did))
    with pytest.raises(ValueError):store.begin_attempt(did)

def test_attachment_bytes_and_profile_invalidate(store,tmp_path):
    p=payload(tmp_path); did=store.save_draft(p); store.approve(did)
    from pathlib import Path
    Path(p['attachments'][0]).write_text('changed')
    with pytest.raises(ValueError):store.begin_attempt(did)
    store.approve(did); store.put('profile',store.get('profile'))
    with pytest.raises(ValueError):store.begin_attempt(did)

def test_approval_required_and_unknowns(store,tmp_path):
    p=payload(tmp_path); p['unknown_questions']=['work rights?']; did=store.save_draft(p)
    with pytest.raises(ValueError):store.approve(did)
    p['unknown_questions']=[]; store.save_draft(p,draft_id=did)
    with pytest.raises(ValueError):store.begin_attempt(did)

def test_attempt_journal_uncertainty(store,tmp_path):
    did=store.save_draft(payload(tmp_path));store.approve(did); aid=store.begin_attempt(did)
    assert store.draft(did)['state']=='submitting'
    store.recover(); assert store.draft(did)['state']=='uncertain'
    with pytest.raises(ValueError):store.begin_attempt(did)

def test_receipt_required_and_dedup_across_drafts(store,tmp_path):
    jid=store.add_job(job()); p=payload(tmp_path)
    did=store.save_draft(p,jid);store.approve(did);aid=store.begin_attempt(did)
    with pytest.raises(ValueError):store.finish_attempt(aid,'submitted',{'message':'thank you'})
    store.finish_attempt(aid,'submitted',{'adapter':'local-test','receipt_id':'123'})
    second=store.save_draft(p,jid);store.approve(second)
    with pytest.raises(ValueError):store.begin_attempt(second)

def test_scoped_answer(store):
    store.save_answer('Work rights?','No','country','US')
    assert store.answer('Work rights?','country','UK') is None
    assert store.answer('Work rights?','country','US')=='No'

def test_backup_excludes_browser(store,tmp_path):
    p=store.root/'browser_profiles';p.mkdir();(p/'cookies').write_text('private')
    out=tmp_path/'backup.zip';store.backup(out)
    with zipfile.ZipFile(out) as z:assert set(z.namelist())=={'jobs.sqlite3','backup_manifest.json'}

def test_registry():assert len(seed('platform_registry'))==24

def test_jsonld_detail():
    html='<script type="application/ld+json">'+json.dumps({'@type':'JobPosting','title':'Analyst','description':'<b>Excel</b>',
         'baseSalary':{'currency':'USD','value':{'unitText':'HOUR','minValue':3,'maxValue':8}}})+'</script>'
    result=parse_detail(html,'https://example.org/job')
    assert result['status']=='ok' and result['jobs'][0]['pay_max']==8
    assert result['jobs'][0]['description']==' Excel '
    assert parse_detail('<h1>Blocked</h1>','https://example.org')['status']=='manual_required'

def test_user_confirmation(store):
    store.confirm_identity()
    assert store.get('confirmations')['same_person_all_names'] is True

def test_backup_restore_remaps_assets(store,tmp_path):
    path=tmp_path/'original.zip'
    with zipfile.ZipFile(path,'w') as z:z.writestr('assets/resume.txt','resume')
    store.import_bundle(path)
    p=payload(tmp_path);p['attachments']=[store.assets()[0]['path']]
    did=store.save_draft(p);store.approve(did)
    backup=tmp_path/'backup.zip';store.backup(backup)
    restored=Store(tmp_path/'restored')
    try:
        previous=restored.restore(backup)
        assert previous.is_file()
        from pathlib import Path
        assert Path(restored.assets()[0]['path']).is_relative_to(restored.root)
        assert Path(restored.assets()[0]['path']).read_text()=='resume'
        assert restored.draft(did)['state']=='needs_review'
        assert restored.draft(did)['approval'] is None
    finally:restored.close()

def test_schedule_cancel_and_resume(store,monkeypatch):
    import threading
    from ahmed_jobs import scheduler
    store.put('schedule',{'urls':['https://example.org/1','https://example.org/2'],'cursor':0})
    cancel=threading.Event();visited=[]
    def fetch(url,c):
        visited.append(url)
        if len(visited)==1:cancel.set()
        return {'status':'ok','jobs':[job()]}
    monkeypatch.setattr(scheduler,'fetch_detail',fetch)
    scheduler.refresh_saved_urls(store.root,cancel)
    assert store.get('schedule')['cursor']==1
    cancel.clear();scheduler.refresh_saved_urls(store.root,cancel)
    assert visited==['https://example.org/1','https://example.org/2']
    assert store.get('schedule')['cursor']==0

def test_freelancer_parser_distinguishes_zero_failure_and_hourly():
    from ahmed_jobs.freelancer import parse_projects
    assert parse_projects({'status':'success','result':{'projects':[]}})=={'status':'ok','jobs':[],'total':None}
    assert parse_projects({'error':'blocked'})['status']=='parser_error'
    data={'status':'success','result':{'projects':[{'id':123,'seo_url':'excel/analysis','title':'Excel dashboard',
          'description':'Full description','type':'hourly','currency':{'code':'USD'},'budget':{'minimum':3,'maximum':8}}]}}
    result=parse_projects(data)
    assert result['jobs'][0]['pay_unit']=='hour'
    assert result['jobs'][0]['description']=='Full description'

def test_working_cv_backup_and_tamper(store,tmp_path):
    from pathlib import Path
    root=store.root/'working_cvs';root.mkdir()
    cv=root/'resume.txt';cv.write_text('resume')
    p=payload(tmp_path);p['attachments']=[str(cv)]
    did=store.save_draft(p);store.approve(did)
    out=tmp_path/'backup.zip';store.backup(out)
    restored=Store(tmp_path/'restored')
    try:
        restored.restore(out)
        f=Path(restored.draft(did)['payload']['attachments'][0])
        assert f.is_relative_to(restored.root) and f.read_text()=='resume'
    finally:restored.close()

@pytest.mark.parametrize('value',['nan','inf','-inf',4])
def test_invalid_hourly_quote(store,tmp_path,value):
    p=payload(tmp_path);p.update(quote_unit='hour',quote_currency='USD',quote=value)
    did=store.save_draft(p)
    with pytest.raises(ValueError):store.approve(did)

def test_expired_opportunity_and_draft(store,tmp_path):
    assert assess(job(expires='2000-01-01'),[])['status']=='filtered'
    p=payload(tmp_path);p['expires']='2000-01-01';did=store.save_draft(p)
    with pytest.raises(ValueError):store.approve(did)

def test_duplicate_publication_payload_and_revision(store,tmp_path):
    p=payload(tmp_path);p.update(action='portfolio',asset_reviewed=True)
    first=store.save_draft(p);store.approve(first);aid=store.begin_attempt(first)
    store.finish_attempt(aid,'submitted',{'adapter':'local-test','receipt_id':'xyz'})
    second=store.save_draft(p);store.approve(second)
    with pytest.raises(ValueError):store.begin_attempt(second)
    revised={**p,'text':'New revision'};third=store.save_draft(revised)
    with pytest.raises(ValueError):store.begin_attempt(third)

def test_certificate_split_preserves_content(tmp_path):
    from pypdf import PdfWriter,PdfReader
    from ahmed_jobs.documents import split_certificates
    from ahmed_jobs.safety import sha256
    source=tmp_path/'certs.pdf';writer=PdfWriter()
    writer.add_blank_page(300,400);writer.add_blank_page(500,600)
    with source.open('wb') as f:writer.write(f)
    before=sha256(source);pages=split_certificates(source,tmp_path/'pages')
    assert len(pages)==2 and sha256(source)==before
    assert PdfReader(pages[1]).pages[0].mediabox==PdfReader(source).pages[1].mediabox

def test_review_export_selected_attachments_only(store,tmp_path):
    p=payload(tmp_path);did=store.save_draft(p)
    private=store.root/'browser_profiles';private.mkdir();(private/'cookies').write_text('secret')
    out=tmp_path/'review.zip';store.export_draft(did,out)
    with zipfile.ZipFile(out) as z:
        assert set(z.namelist())=={'review.json','application.txt','attachments/01_cv.txt'}
        review=json.loads(z.read('review.json'))
        assert review['package_status']=='LOCAL_DRAFT_NOT_SUBMITTED'
        assert 'approval' not in review
