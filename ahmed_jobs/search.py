"""Deterministic multi-source discovery and resumable search runs. No send APIs."""
import json
import re
import threading
import uuid
from html import unescape
from urllib.parse import urlencode, urljoin
from .network import read,read_json,FetchError
from .matching import phrase
from .storage import Store,packed,now
from .safety import safe_url

VERSION='discovery-0.2.0'
SOURCES={
 'freelancer': 'Freelancer', 'remotive':'Remotive (مصدر إضافي)',
 'jobicy':'Jobicy (مصدر إضافي)','remoteok':'RemoteOK (مصدر إضافي)',
 'arbeitnow':'Arbeitnow (مصدر إضافي)','linkedin':'LinkedIn',
 'wuzzuf':'Wuzzuf','bayt':'Bayt','breezy':'20four7VA','workable':'Workable (شركة محددة)'}

def plain(value):
    value=re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', str(value or ''),flags=re.I|re.S)
    return re.sub(r'\s+',' ',unescape(re.sub(r'<[^>]*>',' ',value))).strip()

def base(source,title,url,**fields):
    return {'title':plain(title),'url':safe_url(url),'source':source,'eligibility':'unknown',**fields}

def parse_feed(source,data,query=''):
    jobs=[]
    def keep(j):
        text=' '.join(str(j.get(k,'') or '') for k in ('title','description','tags'))
        if not query or phrase(text,query):jobs.append(j)
    if source=='remotive':
        if not isinstance(data,dict) or not isinstance(data.get('jobs'),list):raise FetchError('parser_error','حقول Remotive غير متوقعة')
        for j in data['jobs']:
            keep(base(source,j['title'],j['url'],company=j.get('company_name',''),description=plain(j.get('description')),
                 location=j.get('candidate_required_location',''),posted=j.get('publication_date'),salary_raw=j.get('salary'),
                 tags=j.get('tags',[]),platform_job_id=str(j['id']),remote=True))
    elif source=='jobicy':
        if not isinstance(data,dict) or not isinstance(data.get('jobs'),list):raise FetchError('parser_error','حقول Jobicy غير متوقعة')
        for j in data['jobs']:
            keep(base(source,j['jobTitle'],j['url'],company=j.get('companyName',''),description=plain(j.get('jobDescription')),
                 location=j.get('jobGeo',''),posted=j.get('pubDate'),pay_min=j.get('annualSalaryMin'),pay_max=j.get('annualSalaryMax'),
                 currency=j.get('salaryCurrency'),pay_unit='year',platform_job_id=str(j['id']),remote=True))
    elif source=='remoteok':
        if not isinstance(data,list):raise FetchError('parser_error','حقول RemoteOK غير متوقعة')
        for j in data:
            if 'position' not in j:continue # metadata/terms record
            keep(base(source,j['position'],j['url'],company=j.get('company',''),description=plain(j.get('description')),
                 location=j.get('location',''),posted=j.get('date'),pay_min=j.get('salary_min') or None,
                 pay_max=j.get('salary_max') or None,currency=j.get('salary_currency'),pay_unit='year',
                 tags=j.get('tags',[]),platform_job_id=str(j['id']),remote=True))
    elif source=='arbeitnow':
        if not isinstance(data,dict) or not isinstance(data.get('data'),list):raise FetchError('parser_error','حقول Arbeitnow غير متوقعة')
        for j in data['data']:
            keep(base(source,j['title'],j['url'],company=j.get('company_name',''),description=plain(j.get('description')),
                 location=j.get('location',''),posted_epoch=j.get('created_at'),remote=j.get('remote',False),
                 tags=j.get('tags',[]),platform_job_id=j['slug']))
    elif source=='breezy':
        if not isinstance(data,list):raise FetchError('parser_error','حقول Breezy غير متوقعة')
        for j in data:
            loc=j.get('location') or {}
            keep(base(source,j['name'],j['url'],company='20four7VA',description=plain(j.get('description')),
                 location=loc.get('name','') if isinstance(loc,dict) else str(loc),platform_job_id=str(j.get('id',j['url']))))
    elif source=='workable':
        if not isinstance(data,dict) or not isinstance(data.get('jobs'),list):raise FetchError('parser_error','حقول Workable غير متوقعة')
        for j in data['jobs']:
            loc=j.get('location') or {}
            keep(base(source,j['title'],j['url'],company=data.get('name',''),description=plain(j.get('description')),
                 location=', '.join(str(loc.get(k,'') or '') for k in ('city','country')),
                 remote=j.get('telecommuting',False),platform_job_id=j.get('shortcode',j['url'])))
    else:raise FetchError('unsupported','مصدر غير مدعوم')
    return jobs

def parse_listing(source,html):
    jobs=[]
    if any(x in html.lower() for x in ('captcha','security verification','authwall','access denied')):
        raise FetchError('blocked','المصدر يطلب تسجيل دخول أو تحققًا أمنيًا')
    if source=='linkedin':
        for card in re.findall(r'<li\b[^>]*>(.*?)</li>',html,re.S|re.I):
            link=re.search(r'href=["\x27](https://[^"\x27]*linkedin\.com/jobs/view/[^"\x27]+)',card)
            title=re.search(r'base-search-card__title[^>]*>(.*?)</h\d>',card,re.S)
            if not link or not title:continue
            company=re.search(r'base-search-card__subtitle[^>]*>(.*?)</h\d>',card,re.S)
            loc=re.search(r'job-search-card__location[^>]*>(.*?)</span>',card,re.S)
            date=re.search(r'datetime=["\x27]([^"\x27]+)',card)
            jobs.append(base(source,plain(title[1]),unescape(link[1]),company=plain(company[1]) if company else '',
                        location=plain(loc[1]) if loc else '',posted=date[1] if date else None,description='',detail_status='needs_fetch'))
    elif source=='wuzzuf':
        for match in re.finditer(r'<h2\b[^>]*>(.*?)</h2>',html,re.S|re.I):
            a=re.search(r'<a\b[^>]*href=["\x27](/jobs/p/[^"\x27]+)["\x27][^>]*>(.*?)</a>',match[1],re.S|re.I)
            if a:jobs.append(base(source,plain(a[2]),urljoin('https://wuzzuf.net',unescape(a[1])),description='',detail_status='needs_fetch',location=''))
    elif source=='bayt':
        for card in re.findall(r'<li\b[^>]*data-js-job[^>]*>(.*?)</li>',html,re.S|re.I):
            a=re.search(r'<h2[^>]*>\s*<a\b[^>]*href=["\x27]([^"\x27]+)["\x27][^>]*>(.*?)</a>',card,re.S|re.I)
            if a:jobs.append(base(source,plain(a[2]),urljoin('https://www.bayt.com',unescape(a[1])),description='',detail_status='needs_fetch',location=''))
    if not jobs and not (not html.strip() or re.search(r'no (?:matching )?(?:jobs|results)|لم (?:يتم العثور|نجد)',plain(html),re.I)):
        raise FetchError('parser_error','لم تُعرف بنية قائمة الوظائف؛ متاح البحث اليدوي')
    return jobs

def discover(source,query,cursor=0,limit=20,cancel=None,company=''):
    cursor=int(cursor);limit=max(1,min(100,int(limit)))
    try:
        if source=='freelancer':
            from .freelancer import discover as fetch
            return fetch(query,cursor,limit,cancel)
        if source in ('linkedin','wuzzuf','bayt'):
            if source=='linkedin':url='https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?'+urlencode({'keywords':query,'location':'Egypt','f_WT':'2','start':cursor})
            elif source=='wuzzuf':url='https://wuzzuf.net/search/jobs/?'+urlencode({'q':query,'start':cursor})
            else:url='https://www.bayt.com/en/egypt/jobs/'+re.sub(r'[^a-z0-9]+','-',query.lower()).strip('-')+'-jobs/?page='+str(cursor+1)
            jobs=parse_listing(source,read(url,cancel))
            return {'status':'ok','jobs':jobs,'next_cursor':(cursor+1 if source=='bayt' else cursor+len(jobs)) if len(jobs)>=limit else None}
        if source=='remotive':url='https://remotive.com/api/remote-jobs?'+urlencode({'search':query,'limit':limit})
        elif source=='jobicy':url='https://jobicy.com/api/v2/remote-jobs?count=100'
        elif source=='remoteok':url='https://remoteok.com/api'
        elif source=='arbeitnow':url='https://www.arbeitnow.com/api/job-board-api?page='+str(cursor//100+1)
        elif source=='breezy':url='https://20four7va.breezy.hr/json'
        elif source=='workable':
            if not re.fullmatch('[a-zA-Z0-9_-]+',company):raise FetchError('needs_setup','أدخل معرف شركة Workable أولًا')
            url=f'https://apply.workable.com/api/v1/widget/accounts/{company}'
        else:raise FetchError('unsupported','المصدر يحتاج بحثًا يدويًا')
        data=read_json(url,cancel);jobs=parse_feed(source,data,query)
        if source=='arbeitnow':
            start=cursor%100
            next_cursor=cursor+limit if start+limit<len(jobs) else (cursor//100+1)*100 if data.get('links',{}).get('next') else None
            return {'status':'ok','jobs':jobs[start:start+limit], 'next_cursor':next_cursor}
        return {'status':'ok','jobs':jobs[:limit], 'next_cursor':None}
    except FetchError as e:return {'status':e.status,'reason':e.reason,'jobs':[]}
    except (KeyError,TypeError,ValueError) as e:return {'status':'parser_error','reason':type(e).__name__,'jobs':[]}

def install_schema(store):
    store.db.executescript('''
    CREATE TABLE IF NOT EXISTS search_runs(id TEXT PRIMARY KEY,config TEXT NOT NULL,cursor INTEGER NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL,updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS source_runs(id INTEGER PRIMARY KEY,run_id TEXT NOT NULL,source TEXT NOT NULL,query TEXT NOT NULL,cursor INTEGER NOT NULL,status TEXT NOT NULL,count INTEGER NOT NULL,reason TEXT,adapter_version TEXT NOT NULL,created TEXT NOT NULL);
    ''')
    if 'next_cursor' not in {r[1] for r in store.db.execute('PRAGMA table_info(source_runs)')}:
        with store.db:store.db.execute('ALTER TABLE source_runs ADD COLUMN next_cursor INTEGER')

def run_search(root,config=None,run_id=None,cancel=None,progress=None):
    cancel=cancel or threading.Event();s=Store(root);install_schema(s)
    try:
        if run_id:
            r=s.db.execute('SELECT * FROM search_runs WHERE id=?',(run_id,)).fetchone()
            if not r:raise ValueError('بحث محفوظ غير موجود')
            config=json.loads(r['config']);cursor=r['cursor']
        else:
            config=config or {};run_id=uuid.uuid4().hex;cursor=0
            with s.db:s.db.execute('INSERT INTO search_runs VALUES (?,?,?,?,?,?)',(run_id,packed(config),0,'running',now(),now()))
        queries=[q.strip() for q in config.get('queries',[]) if q.strip()]
        sources=config.get('sources',[]);limit=max(1,min(100,int(config.get('page_size',20))))
        pages=max(1,min(10,int(config.get('max_pages',1))))
        tasks=[(source,query,page*limit) for source in sources for query in queries for page in range(pages if source in ('freelancer','linkedin','wuzzuf','bayt','arbeitnow') else 1)]
        blocked_sources={};finished_queries=set()
        with s.db:s.db.execute("UPDATE search_runs SET status='running' WHERE id=?",(run_id,))
        for index in range(cursor,len(tasks)):
            if cancel.is_set():break
            source,query,offset=tasks[index]
            if (source,query) in finished_queries:
                with s.db:s.db.execute('UPDATE search_runs SET cursor=?,updated=? WHERE id=?',(index+1,now(),run_id))
                continue
            if offset:
                previous=s.db.execute('SELECT next_cursor FROM source_runs WHERE run_id=? AND source=? AND query=? ORDER BY id DESC LIMIT 1',(run_id,source,query)).fetchone()
                if previous:
                    if previous[0] is None:
                        with s.db:s.db.execute('UPDATE search_runs SET cursor=?,updated=? WHERE id=?',(index+1,now(),run_id))
                        continue
                    offset=previous[0]
            result=blocked_sources.get(source) or discover(source,query,offset,limit,cancel,config.get('workable_company',''))
            if result['status']=='blocked':blocked_sources[source]={**result,'reason':result.get('reason','')+'؛ توقف المصدر لباقي هذا التشغيل'}
            if result['status']=='cancelled':break
            if result['status']=='ok' and result.get('next_cursor') is None:finished_queries.add((source,query))
            count=0;invalid=0
            for j in result.get('jobs',[]):
                try:s.add_job(j);count+=1
                except (ValueError,TypeError):invalid+=1
            if invalid:result={**result,'status':'parser_partial' if count else 'parser_error','reason':f'{invalid} سجل غير صالح؛ حُفظت السجلات الصالحة'}
            with s.db:
                s.db.execute('INSERT INTO source_runs(run_id,source,query,cursor,status,count,reason,adapter_version,created,next_cursor) VALUES (?,?,?,?,?,?,?,?,?,?)',
                             (run_id,source,query,offset,result['status'],count,result.get('reason'),VERSION,now(),result.get('next_cursor')))
                s.db.execute('UPDATE search_runs SET cursor=?,updated=? WHERE id=?',(index+1,now(),run_id))
            if progress:progress({'run_id':run_id,'done':index+1,'total':len(tasks),'source':source,'status':result['status'],'count':count})
        final_cursor=s.db.execute('SELECT cursor FROM search_runs WHERE id=?',(run_id,)).fetchone()[0]
        failures=s.db.execute("SELECT COUNT(*) FROM source_runs WHERE run_id=? AND status!='ok'",(run_id,)).fetchone()[0]
        status='paused' if final_cursor<len(tasks) else 'completed_with_errors' if failures else 'completed'
        with s.db:s.db.execute('UPDATE search_runs SET status=?,updated=? WHERE id=?',(status,now(),run_id))
        s.event('search_completed',{'run_id':run_id,'status':status,'tasks':final_cursor,'failures':failures})
        return {'run_id':run_id,'status':status,'tasks':final_cursor,'total':len(tasks),'failures':failures}
    finally:s.close()
