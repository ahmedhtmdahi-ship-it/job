import json
import threading
import pytest
from ahmed_jobs.storage import Store
from ahmed_jobs.search import parse_feed,parse_listing,discover,run_search
from ahmed_jobs.network import FetchError

@pytest.mark.parametrize('source,payload',[
 ('remotive',{'jobs':[{'id':1,'title':'Excel reporting','url':'https://example.org/1','description':'<b>Full text</b>','salary':'$10','candidate_required_location':'Worldwide'}]}),
 ('jobicy',{'jobs':[{'id':2,'jobTitle':'Excel reporting','url':'https://example.org/2','jobDescription':'Full text','annualSalaryMin':20000,'annualSalaryMax':30000,'salaryCurrency':'USD'}]}),
 ('remoteok',[{'legal':'Attribution required'},{'id':3,'position':'Excel reporting','url':'https://example.org/3','description':'Full text','salary_min':20000,'salary_max':30000}]),
 ('arbeitnow',{'data':[{'slug':'excel','title':'Excel reporting','url':'https://example.org/4','description':'Full text','remote':True}]}),
 ('breezy',[{'id':5,'name':'Excel reporting','url':'https://example.org/5','description':'Full text','location':{'name':'Egypt'}}]),
 ('workable',{'jobs':[{'shortcode':'ABC','title':'Excel reporting','url':'https://example.org/6','description':'Full text','location':{'country':'Egypt'}}]})
])
def test_realistic_feed_shapes_preserve_description(source,payload):
    rows=parse_feed(source,payload,'Excel')
    assert len(rows)==1 and rows[0]['description']=='Full text'
    assert rows[0]['eligibility']=='unknown'
    if source=='remoteok':assert rows[0]['currency'] is None and rows[0]['pay_unit']=='year'
    if source=='jobicy':assert rows[0]['pay_unit']=='year'

@pytest.mark.parametrize('source',['remotive','jobicy','remoteok','arbeitnow','breezy','workable'])
def test_bad_response_is_not_zero_results(source):
    with pytest.raises((FetchError,TypeError)):parse_feed(source,{'error':'denied'})

def test_linkedin_listing_without_fake_egypt_eligibility():
    html='''<li><a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/123456789?trackingId=x">link</a>
     <h3 class="base-search-card__title">Operations coordinator</h3>
     <h4 class="base-search-card__subtitle"><a>Company &amp; Co</a></h4>
     <span class="job-search-card__location">Remote US only</span><time datetime="2026-11-04"></time></li>'''
    jobs=parse_listing('linkedin',html)
    assert len(jobs)==1 and jobs[0]['company']=='Company & Co'
    assert jobs[0]['location']=='Remote US only' and jobs[0]['detail_status']=='needs_fetch'

def test_wuzzuf_and_bayt_listing_fixtures():
    assert parse_listing('wuzzuf','<h2><a href="/jobs/p/abc-role">Legal assistant</a></h2>')[0]['title']=='Legal assistant'
    assert parse_listing('bayt','<li data-js-job><h2><a href="/en/egypt/jobs/legal-123/">Legal assistant</a></h2></li>')[0]['url'].startswith('https://www.bayt.com/')
    assert parse_listing('linkedin','')==[]
    with pytest.raises(FetchError):parse_listing('linkedin','<h1>CAPTCHA</h1>')
    with pytest.raises(FetchError):parse_listing('wuzzuf','<h1>Unknown page structure</h1>')

def test_search_pause_restart_no_lost_progress_and_failure_not_zero(tmp_path,monkeypatch):
    from ahmed_jobs import search
    cancel=threading.Event();calls=[]
    def fetch(source,query,*args):
        calls.append(source)
        if len(calls)==1:cancel.set()
        if source=='remotive':return {'status':'ok','jobs':[{'title':'Legal assistant','url':'https://example.org/role'}]}
        return {'status':'blocked','jobs':[],'reason':'HTTP 403'}
    monkeypatch.setattr(search,'discover',fetch)
    config={'sources':['remotive','linkedin'],'queries':['legal'],'page_size':10,'max_pages':1}
    first=run_search(tmp_path/'data',config,cancel=cancel)
    assert first['status']=='paused' and first['tasks']==1
    cancel.clear();second=run_search(tmp_path/'data',run_id=first['run_id'],cancel=cancel)
    assert calls==['remotive','linkedin'] and second['status']=='completed_with_errors'
    s=Store(tmp_path/'data')
    assert len(s.jobs())==1
    rows=list(s.db.execute('SELECT status,count FROM source_runs ORDER BY id'))
    assert [(r[0],r[1]) for r in rows]==[('ok',1),('blocked',0)]
    s.close()

def test_workable_requires_company_without_network(monkeypatch):
    from ahmed_jobs import search
    monkeypatch.setattr(search,'read_json',lambda *a:pytest.fail('Unexpected network'))
    assert discover('workable','Excel')['status']=='needs_setup'

def test_search_blocked_source_is_not_retried_for_every_query(tmp_path,monkeypatch):
    from ahmed_jobs import search
    calls=[]
    def fetch(*args):calls.append(args);return {'status':'blocked','jobs':[],'reason':'HTTP 403'}
    monkeypatch.setattr(search,'discover',fetch)
    r=run_search(tmp_path,{'sources':['linkedin'],'queries':['Excel','Operations'],'page_size':10,'max_pages':2})
    assert len(calls)==1 and r['tasks']==4 and r['failures']==2

def test_real_pagination_cursor_survives_restart(tmp_path,monkeypatch):
    from ahmed_jobs import search
    cancel=threading.Event();offsets=[]
    def fetch(source,query,cursor,*args):
        offsets.append(cursor)
        if len(offsets)==1:cancel.set()
        return {'status':'ok','jobs':[],'next_cursor':25 if cursor==0 else None}
    monkeypatch.setattr(search,'discover',fetch)
    first=run_search(tmp_path,{'sources':['linkedin'],'queries':['Excel'],'page_size':20,'max_pages':3},cancel=cancel)
    cancel.clear();run_search(tmp_path,run_id=first['run_id'],cancel=cancel)
    assert offsets==[0,25]
