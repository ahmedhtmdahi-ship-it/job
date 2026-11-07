import csv
import hashlib
import json
import shutil
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path,PureWindowsPath,PurePosixPath
from .config import seed
from .safety import canonical, sha256, inspect_zip, extract_zip
from .matching import assess

def now():
    return datetime.now(timezone.utc).isoformat()

def packed(value):
    return json.dumps(value,ensure_ascii=False,sort_keys=True)

def relocate_path(value,old,new):
    if not value:return value
    flavor=PureWindowsPath if PureWindowsPath(str(old)).drive else PurePosixPath
    try:relative=flavor(str(value)).relative_to(flavor(str(old)))
    except ValueError:return value
    if '..' in relative.parts:raise ValueError('مسار مرفق غير آمن في النسخة')
    return str(Path(new).joinpath(*relative.parts))

def relocate_draft(payload,old,new):
    for key in ('attachments','candidate_files'):
        if key in payload:payload[key]=[relocate_path(f,old,new) for f in payload[key]]
    for key in ('resume','cover_letter_file'):
        if payload.get(key):payload[key]=relocate_path(payload[key],old,new)
    return payload

class Store:
    def __init__(self, root):
        self.root=Path(root); self.root.mkdir(parents=True,exist_ok=True)
        self.path=self.root/'jobs.sqlite3'
        self.db=sqlite3.connect(self.path,timeout=20)
        self.db.row_factory=sqlite3.Row
        self.db.executescript('''
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;
        CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS opportunities(id TEXT PRIMARY KEY,url TEXT UNIQUE NOT NULL,payload TEXT NOT NULL,assessment TEXT NOT NULL,created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS drafts(id TEXT PRIMARY KEY,opportunity_id TEXT,payload TEXT NOT NULL,state TEXT NOT NULL,approval TEXT,updated TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,draft_id TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,evidence TEXT,created TEXT NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS one_pending ON attempts(draft_id) WHERE state IN ('submitting','uncertain','submitted');
        CREATE UNIQUE INDEX IF NOT EXISTS one_payload ON attempts(digest) WHERE state IN ('submitting','uncertain','submitted');
        CREATE TABLE IF NOT EXISTS imports(digest TEXT PRIMARY KEY,path TEXT NOT NULL,created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,path TEXT NOT NULL,kind TEXT NOT NULL,digest TEXT NOT NULL,metadata TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS answers(question TEXT NOT NULL,scope TEXT NOT NULL,scope_id TEXT NOT NULL,answer TEXT NOT NULL,confirmed TEXT NOT NULL,PRIMARY KEY(question,scope,scope_id));
        CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,payload TEXT NOT NULL,created TEXT NOT NULL);
        PRAGMA user_version=1;
        ''')
        for key,value in {'profile':seed('applicant_profile'),'tracks':seed('career_tracks'),
                          'platforms':seed('platform_registry'),'filters':{'minimum_hourly_usd':5,'weights':{},'excluded_phrases':[]},
                          'schedule':{'enabled':False,'minutes':60,'urls':[],'cursor':0},
                          'confirmations':seed('user_confirmations')}.items():
            self.db.execute('INSERT OR IGNORE INTO settings VALUES (?,?)',(key,packed(value)))
        self.db.commit()
        for key in ('templates','portfolio_catalog','certificates_catalog'):
            with self.db:self.db.execute('INSERT OR IGNORE INTO settings VALUES (?,?)',(key,packed(seed(key))))

    def close(self): self.db.close()

    def get(self,key):
        r=self.db.execute('SELECT value FROM settings WHERE key=?',(key,)).fetchone()
        return json.loads(r[0]) if r else None

    def put(self,key,value):
        self.validate_setting(key,value)
        with self.db:
            self.db.execute('INSERT OR REPLACE INTO settings VALUES (?,?)',(key,packed(value)))
            if key=='profile':
                self.db.execute("UPDATE drafts SET state=CASE WHEN state IN ('submitting','submitted','uncertain') THEN state ELSE 'needs_review' END,approval=NULL")

    def validate_setting(self,key,value):
        import math
        if key=='filters':
            minimum=float(value.get('minimum_hourly_usd',5))
            if not math.isfinite(minimum) or minimum<5:raise ValueError('الحد الأدنى لا يقل عن 5 USD/ساعة')
            for w in value.get('weights',{}).values():
                if not math.isfinite(float(w)) or float(w)<0:raise ValueError('وزن غير صالح')
            if not all(isinstance(x,str) for x in value.get('excluded_phrases',[])):raise ValueError('عبارات الاستبعاد غير صالحة')
        if key=='tracks':
            if not isinstance(value,list) or not value:raise ValueError('يلزم مسار عمل واحد على الأقل')
            ids=set()
            for t in value:
                if not t.get('id') or t['id'] in ids:raise ValueError('معرف مسار مفقود أو مكرر')
                ids.add(t['id'])
                if not all(isinstance(w,str) and w.strip() for w in t.get('keywords_en',[])+t.get('keywords_ar',[])):
                    raise ValueError('الكلمات يجب أن تكون نصوصًا غير فارغة')
        if key=='schedule':
            if float(value.get('minutes',60))<1:raise ValueError('فاصل الجدولة دقيقة واحدة على الأقل')
            for url in value.get('urls',[]):canonical(url)
        if key=='profile' and not all(value.get('identity',{}).get(k) for k in ('full_name','email','phone')):
            raise ValueError('الاسم والبريد والهاتف مطلوبة')

    def event(self,kind,payload):
        with self.db:
            self.db.execute('INSERT INTO events(kind,payload,created) VALUES (?,?,?)',(kind,packed(payload),now()))

    def confirm_identity(self):
        value=self.get('confirmations')
        value.update({'same_person_all_names':True,'source':'explicit user confirmation in chat',
                      'confirmed_at':now(),'note':'User states all supplied records belong to the same person. Originals preserved.'})
        self.put('confirmations',value)
        self.event('identity_confirmed',value)

    def add_job(self,job):
        import math
        job={k:v for k,v in job.items() if k not in ('id','assessment','created')}; url=canonical(job['url']); job['url']=url
        if not job.get('title','').strip(): raise ValueError('عنوان الفرصة مطلوب')
        for key in ('pay_min','pay_max'):
            if job.get(key) not in (None,''): job[key]=float(job[key])
            else: job[key]=None
            if job[key] is not None and (not math.isfinite(job[key]) or job[key]<0):raise ValueError('قيمة أجر غير صالحة')
        if job['pay_min'] is not None and job['pay_max'] is not None and job['pay_min']>job['pay_max']:
            raise ValueError('نطاق الأجر غير صالح')
        by_url=self.db.execute('SELECT id FROM opportunities WHERE url=?',(url,)).fetchone()
        by_source=None
        if job.get('platform_job_id') and job.get('source'):
            by_source=self.db.execute("SELECT id FROM opportunities WHERE json_extract(payload,'$.source')=? AND json_extract(payload,'$.platform_job_id')=? LIMIT 1",(job['source'],str(job['platform_job_id']))).fetchone()
        identity=(str(job['source'])+':'+str(job['platform_job_id'])) if job.get('source') and job.get('platform_job_id') else url
        jid=(by_url or by_source)[0] if by_url or by_source else hashlib.sha256(identity.encode()).hexdigest()
        old=self.db.execute('SELECT payload FROM opportunities WHERE id=?',(jid,)).fetchone()
        if old:
            previous=json.loads(old[0])
            incoming=job;job={**previous,**incoming}
            for key in ('description','company','location'):
                if not incoming.get(key) and previous.get(key):job[key]=previous[key]
            if incoming.get('source')=='jsonld-detail-v1' and previous.get('source'):
                job['detail_source']=incoming['source'];job['source']=previous['source']
            if job.get('eligibility','unknown')=='unknown' and previous.get('eligibility') in ('eligible','ineligible'):
                job['eligibility']=previous['eligibility']
        result=assess(job,self.get('tracks'),self.get('filters'))
        from rapidfuzz.fuzz import token_sort_ratio
        probable=[]
        for r in self.db.execute('SELECT id,payload FROM opportunities WHERE id!=? ORDER BY created DESC LIMIT 2000',(jid,)):
            other=json.loads(r['payload'])
            if job.get('company') and other.get('company') and token_sort_ratio(job['company'].lower(),other['company'].lower())>=90 and token_sort_ratio(job['title'].lower(),other['title'].lower())>=90:
                probable.append({'id':r['id'],'url':other['url'],'reason':'تشابه العنوان والشركة؛ لم تُحذف الفرصة'})
        result['probable_duplicates']=probable
        with self.db:
            self.db.execute('INSERT INTO opportunities VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET url=excluded.url,payload=excluded.payload,assessment=excluded.assessment',
                            (jid,url,packed(job),packed(result),now()))
            if old and json.loads(old[0])!=job:
                self.db.execute("UPDATE drafts SET approval=NULL,state='needs_review' WHERE opportunity_id=? AND state NOT IN ('submitting','submitted','uncertain')",(jid,))
        return jid

    def jobs(self):
        return [dict(id=r['id'],**json.loads(r['payload']),assessment=json.loads(r['assessment']))
                for r in self.db.execute('SELECT * FROM opportunities ORDER BY created DESC')]

    def import_csv(self,path):
        count=0
        with open(path,encoding='utf-8-sig',newline='') as f:
            rows=list(csv.DictReader(f))
        for row in rows:
            self.add_job(row); count+=1
        self.event('csv_import',{'rows':count})
        return count

    def import_bundle(self,path):
        digest=sha256(path)
        if self.db.execute('SELECT 1 FROM imports WHERE digest=?',(digest,)).fetchone():
            return {'duplicate':True,'files':0}
        listing=inspect_zip(path)
        parent=self.root/'imports'; parent.mkdir(exist_ok=True)
        target=extract_zip(path,parent/digest)
        with self.db:
            for item in listing:
                p=target/item['name']; suffix=p.suffix.lower()
                kind={'.docx':'cv','.pdf':'document','.xlsx':'workbook','.png':'image','.zip':'archive'}.get(suffix,'reference')
                aid=hashlib.sha256((digest+item['name']).encode()).hexdigest()
                self.db.execute('INSERT INTO assets VALUES (?,?,?,?,?)',
                    (aid,str(p),kind,sha256(p),packed({'name':p.name,'bytes':p.stat().st_size,'reviewed':False})))
            self.db.execute('INSERT INTO imports VALUES (?,?,?)',(digest,str(target),now()))
        self.event('bundle_import',{'digest':digest,'files':len(listing)})
        return {'duplicate':False,'files':len(listing)}

    def assets(self):
        return [dict(r) for r in self.db.execute('SELECT * FROM assets ORDER BY kind,path')]

    def import_handoff(self,path):
        result=self.import_bundle(path)
        # Only explicit portfolio ZIP assets are expanded, once; no arbitrary recursion.
        nested=[a for a in self.assets() if a['kind']=='archive' and '/assets/portfolio/' in a['path'].replace('\\','/')]
        result['portfolio_files']=sum(self.import_bundle(a['path'])['files'] for a in nested)
        return result

    def cv_for(self,job):
        from .documents import corrected_cv
        tracks=self.get('tracks');result=assess(job,tracks,self.get('filters'))
        selected=max(result['matches'],key=lambda m:m['score']) if result['matches'] else None
        track=next((t for t in tracks if selected and t['id']==selected['track']),None)
        candidate=track['candidate_cv'] if track else 'assets/cv/master.docx'
        source=next((Path(a['path']) for a in self.assets() if a['path'].replace('\\','/').endswith(candidate)),None)
        if not source:return [],'لا توجد نسخة CV مستوردة؛ اختر المرفق يدويًا'
        working=self.root/'working_cvs';working.mkdir(exist_ok=True)
        dest=working/(sha256(source)[:12]+'_'+source.stem+'_v2_working.docx')
        if not dest.exists():corrected_cv(source,dest)
        return [str(dest)],'اختير CV وفق المسار '+(track['name'] if track else 'الأساسي')+'؛ راجع المحتوى قبل الاعتماد'

    def certificate_file(self,page):
        from pypdf import PdfReader,PdfWriter
        if not 1<=int(page)<=14:raise ValueError('صفحة شهادة غير صالحة')
        source=next((a for a in self.assets() if a['path'].replace('\\','/').endswith('assets/certificates/all_certificates.pdf')),None)
        if not source:raise ValueError('استورد حزمة المدخلات أولًا')
        if sha256(source['path'])!=source['digest']:raise ValueError('الأصل تغير؛ أعد استيراده كإصدار جديد')
        folder=self.root/'working_cvs'/'certificates';folder.mkdir(parents=True,exist_ok=True)
        dest=folder/f'certificate_{int(page):02}.pdf'
        if not dest.exists():
            writer=PdfWriter();writer.add_page(PdfReader(source['path']).pages[int(page)-1])
            with dest.open('xb') as f:writer.write(f)
        return str(dest)

    def project_files(self,project):
        names=project.get('members',[]) or [project.get('file','')]
        found=[]
        for name in names:
            if not name or Path(name).name.upper()=='UPLOAD_TEXT.TXT':continue
            match=next((a['path'] for a in self.assets() if a['path'].replace('\\','/').endswith(name)),None)
            if match:found.append(match)
        return found

    def save_draft(self,payload,opportunity_id=None,draft_id=None):
        did=draft_id or uuid.uuid4().hex
        with self.db:
            existing=self.db.execute('SELECT state FROM drafts WHERE id=?',(did,)).fetchone()
            if existing and existing[0] in ('submitting','uncertain','submitted'):
                raise ValueError('محاولة قائمة أو غير مؤكدة؛ لا يمكن تغييرها أو تكرارها')
            self.db.execute('INSERT INTO drafts VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,state=excluded.state,approval=NULL,updated=excluded.updated',
                            (did,opportunity_id,packed(payload),'needs_review',None,now()))
        return did

    def draft(self,did):
        r=self.db.execute('SELECT * FROM drafts WHERE id=?',(did,)).fetchone()
        if not r: raise ValueError('طلب غير موجود')
        return dict(r, payload=json.loads(r['payload']))

    def drafts(self):
        return [self.draft(r[0]) for r in self.db.execute('SELECT id FROM drafts ORDER BY updated DESC')]

    def digest(self,payload):
        p=dict(payload)
        p['attachment_hashes']=[{'path':str(Path(f).resolve()),'sha256':sha256(f)} for f in p.get('attachments',[])]
        p['profile']=self.get('profile')
        return hashlib.sha256(packed(p).encode()).hexdigest()

    def validate_draft(self,p):
        import math
        canonical(p['destination'])
        if not p.get('text','').strip(): raise ValueError('نص الطلب مطلوب')
        if p.get('unknown_questions'): raise ValueError('يلزم الإجابة عن الأسئلة المطلوبة')
        if p.get('remote_snapshot',{}).get('payment_detected'):raise ValueError('payment_required: النموذج المرصود يعلن تكلفة مدفوعة')
        if float(p.get('cost',0))!=0 or float(p.get('credits',0))!=0:
            raise ValueError('payment_required: ميزانية التقديم صفر، بما فيها الأرصدة')
        if p.get('quote_unit')=='hour':
            rate=float(p.get('quote') or 0)
            if p.get('quote_currency')!='USD' or not math.isfinite(rate) or rate<5:
                raise ValueError('العرض بالساعة يحتاج USD بقيمة 5 أو أكثر')
        for filename in p.get('attachments',[]):
            path=Path(filename)
            if path.suffix.lower() not in ('.pdf','.docx','.xlsx','.png','.jpg','.jpeg','.webp','.csv','.txt'):
                raise ValueError('نوع مرفق غير مسموح: لا تُرفق حزمة التكليف أو الكود أو ملفات التشغيل')
            if not path.is_file() or path.stat().st_size>60*1024*1024:
                raise ValueError('المرفق مفقود أو أكبر من الحد')
            if 'browser_profiles' in path.parts:
                raise ValueError('لا يمكن إرفاق بيانات جلسة المتصفح')
        if p.get('action')=='application' and p.get('eligibility')!='eligible':
            raise ValueError('يلزم تأكيد أهلية العمل من مصر')
        if p.get('expires'):
            from .matching import is_expired
            if is_expired(p['expires']): raise ValueError('الفرصة منتهية')
        if p.get('action') in ('portfolio','service','service_gallery','certificate') and not p.get('asset_reviewed'):
            raise ValueError('يلزم مراجعة الأصل وحقوق النشر والبيانات قبل الاعتماد')
        if p.get('alternate_name') and not self.get('confirmations').get('same_person_all_names'):
            raise ValueError('يلزم تأكيد الاسم')

    def approve(self,did):
        d=self.draft(did); p=d['payload']; self.validate_draft(p)
        self.validate_opportunity(d)
        if d['state'] in ('submitting','uncertain','submitted'): raise ValueError('لا يمكن إعادة اعتماد محاولة قائمة')
        digest=self.digest(p)
        with self.db: self.db.execute("UPDATE drafts SET state='approved',approval=? WHERE id=?",(digest,did))
        self.event('approved',{'draft':did,'digest':digest})
        return digest

    def begin_attempt(self,did):
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            d=self.draft(did); self.validate_draft(d['payload'])
            self.validate_opportunity(d)
            digest=self.digest(d['payload'])
            if d['state']!='approved' or d['approval']!=digest: raise ValueError('الموافقة مفقودة أو أُبطلت بعد تعديل المحتوى')
            if self.db.execute("SELECT 1 FROM attempts WHERE digest=? AND state IN ('submitted','submitting','uncertain')",(digest,)).fetchone():
                raise ValueError('يوجد تنفيذ سابق أو غير مؤكد للمحتوى نفسه')
            if d['opportunity_id'] and self.db.execute("SELECT 1 FROM attempts a JOIN drafts d ON a.draft_id=d.id WHERE d.opportunity_id=? AND a.state IN ('submitted','submitting','uncertain')",(d['opportunity_id'],)).fetchone():
                raise ValueError('يوجد إرسال سابق أو غير مؤكد لنفس الفرصة')
            aid=uuid.uuid4().hex
            self.db.execute('INSERT INTO attempts VALUES (?,?,?,?,?,?)',(aid,did,digest,'submitting',None,now()))
            self.db.execute("UPDATE drafts SET state='submitting' WHERE id=?",(did,))
        return aid

    def validate_opportunity(self,draft):
        if not draft.get('opportunity_id'):return
        row=self.db.execute('SELECT payload FROM opportunities WHERE id=?',(draft['opportunity_id'],)).fetchone()
        if not row:raise ValueError('الفرصة الأصلية غير موجودة')
        current=assess(json.loads(row[0]),self.get('tracks'),self.get('filters'))
        if current['status']=='filtered':raise ValueError('الفرصة الحالية مستبعدة أو منتهية؛ راجع الإعلان من جديد')

    def finish_attempt(self,aid,state,evidence=None):
        if state not in ('submitted','failed','uncertain'): raise ValueError('حالة غير صالحة')
        if state=='submitted' and not (evidence and evidence.get('receipt_id') and evidence.get('adapter')):
            raise ValueError('يلزم إيصال خاص بالموقع')
        with self.db:
            r=self.db.execute('SELECT draft_id,state FROM attempts WHERE id=?',(aid,)).fetchone()
            if not r or r['state']!='submitting': raise ValueError('محاولة غير قابلة للتحديث')
            self.db.execute('UPDATE attempts SET state=?,evidence=? WHERE id=?',(state,packed(evidence),aid))
            self.db.execute('UPDATE drafts SET state=? WHERE id=?',(state,r['draft_id']))

    def recover(self):
        with self.db:
            self.db.execute("UPDATE drafts SET state='uncertain' WHERE state='submitting'")
            self.db.execute("UPDATE attempts SET state='uncertain' WHERE state='submitting'")

    def save_answer(self,question,answer,scope,scope_id):
        if scope not in ('global','employer','country','exact'): raise ValueError('نطاق غير صالح')
        with self.db:
            self.db.execute('INSERT OR REPLACE INTO answers VALUES (?,?,?,?,?)',(question,scope,scope_id,answer,now()))

    def answer(self,question,scope,scope_id):
        r=self.db.execute('SELECT answer FROM answers WHERE question=? AND scope=? AND scope_id=?',(question,scope,scope_id)).fetchone()
        return r[0] if r else None

    def reusable_answers(self,questions,destination,employer='',country=''):
        import re
        found={}
        for question in questions:
            scopes=[('exact',canonical(destination))]
            if employer:scopes.append(('employer',employer))
            if country:scopes.append(('country',country))
            sensitive=bool(re.search(r'authoriz|visa|work.right|sponsor|تصريح|تأشير|حق العمل|موافقة|consent',question,re.I))
            if not sensitive:scopes.append(('global',''))
            for scope,scope_id in scopes:
                value=self.answer(question,scope,scope_id)
                if value is not None:found[question]=value;break
        return found

    def export_draft(self,did,destination):
        """Produce a local review package, never an outbound action or receipt."""
        import zipfile
        d=self.draft(did);p=dict(d['payload'])
        files=[]
        for filename in p.get('attachments',[]):
            f=Path(filename)
            if (f.suffix.lower() not in ('.pdf','.docx','.xlsx','.png','.jpg','.jpeg','.webp','.csv','.txt')
                    or 'browser_profiles' in f.parts or not f.is_file() or f.stat().st_size>60*1024*1024):
                raise ValueError('مرفق غير مسموح في حزمة المراجعة')
            if f.resolve()==Path(destination).resolve():raise ValueError('لا يمكن الكتابة فوق مرفق')
            files.append(f)
        p['attachments']=[f'attachments/{n:02}_{f.name}' for n,f in enumerate(files,1)]
        p['package_status']='LOCAL_DRAFT_NOT_SUBMITTED'
        # Do not export approval tokens, browser profiles, cookies or credential stores.
        with zipfile.ZipFile(destination,'x',zipfile.ZIP_DEFLATED) as z:
            z.writestr('review.json',packed(p))
            z.writestr('application.txt',p.get('text',''))
            for path,name in zip(files,p['attachments']):z.write(path,name)
        self.event('draft_exported',{'draft':did,'status':'local_draft_only'})

    def export_jobs(self,destination):
        from .safety import csv_safe
        fields=['title','company','url','description','location','currency','pay_unit','pay_min','pay_max','eligibility','source','status','reasons']
        with open(destination,'x',encoding='utf-8-sig',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
            for j in self.jobs():
                row={k:j.get(k,'') if j.get(k) is not None else '' for k in fields}
                row['status']=j['assessment']['status'];row['reasons']=' | '.join(j['assessment']['reasons'])
                writer.writerow({k:csv_safe(v) for k,v in row.items()})
        self.event('opportunities_exported',{'count':len(self.jobs())})

    def backup(self,destination):
        import tempfile,zipfile
        # Only business data/imported documents, never browser profiles, cookies, logs or passwords.
        with tempfile.TemporaryDirectory() as tmp:
            dbpath=Path(tmp)/'jobs.sqlite3'
            target=sqlite3.connect(dbpath)
            self.db.backup(target); target.close()
            with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as z:
                z.write(dbpath,'jobs.sqlite3')
                z.writestr('backup_manifest.json',packed({'format':1,'source_root':str(self.root)}))
                for name in ('imports','working_cvs'):
                    folder=self.root/name
                    if folder.exists():
                        for p in folder.rglob('*'):
                            if p.is_file(): z.write(p,p.relative_to(self.root).as_posix())

    def restore(self,source):
        """Validate in staging first; preserve the previous database in a backup."""
        import tempfile,zipfile
        from .safety import inspect_zip,extract_zip
        inspect_zip(source)
        with tempfile.TemporaryDirectory(dir=self.root.parent) as tmp:
            stage=extract_zip(source,Path(tmp)/'restored')
            manifest=json.loads((stage/'backup_manifest.json').read_text())
            if manifest.get('format')!=1:raise ValueError('إصدار النسخة غير مدعوم')
            source_root=Path(manifest['source_root'])
            dbpath=stage/'jobs.sqlite3'
            if not dbpath.is_file():raise ValueError('نسخة احتياطية غير صالحة')
            incoming=sqlite3.connect(dbpath)
            try:
                if incoming.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('قاعدة بيانات تالفة')
                tables={r[0] for r in incoming.execute("SELECT name FROM sqlite_master WHERE type='table'")}
                if not {'settings','opportunities','drafts','assets','imports','attempts','answers','events'}<=tables:
                    raise ValueError('نسخة من برنامج مختلف')
                if incoming.execute('PRAGMA user_version').fetchone()[0]!=1:raise ValueError('إصدار غير مدعوم')
                mappings={}
                for digest,old in incoming.execute('SELECT digest,path FROM imports'):
                    if not re_digest(digest):raise ValueError('مسار استيراد غير صالح')
                    new=self.root/'imports'/digest
                    folder=stage/'imports'/digest
                    if not folder.is_dir():raise ValueError('أصول النسخة الاحتياطية ناقصة')
                    mappings[str(old)]=str(new)
                old_backup=self.root.parent/('AhmedHatem_before_restore_'+uuid.uuid4().hex+'.zip')
                self.backup(old_backup)
                work=stage/'working_cvs'
                if work.exists():
                    for source_file in work.rglob('*'):
                        if not source_file.is_file():continue
                        dest=self.root/'working_cvs'/source_file.relative_to(work)
                        dest.parent.mkdir(parents=True,exist_ok=True)
                        if dest.exists() and sha256(dest)!=sha256(source_file):raise ValueError('تعارض نسخة CV')
                        if not dest.exists():shutil.copy2(source_file,dest)
                for old,new in mappings.items():
                    digest=Path(new).name; folder=stage/'imports'/digest
                    target=Path(new)
                    if not target.exists():
                        target.parent.mkdir(exist_ok=True); shutil.copytree(folder,target)
                    else:
                        for p in folder.rglob('*'):
                            if p.is_file() and (not (target/p.relative_to(folder)).is_file() or sha256(p)!=sha256(target/p.relative_to(folder))):
                                raise ValueError('تعارض بين الأصول الحالية والنسخة؛ لم تُستبدل قاعدة البيانات')
                    incoming.execute('UPDATE imports SET path=? WHERE path=?',(new,old))
                    for aid,asset_path in incoming.execute('SELECT id,path FROM assets').fetchall():
                        moved=relocate_path(asset_path,old,target)
                        if moved!=asset_path:incoming.execute('UPDATE assets SET path=? WHERE id=?',(moved,aid))
                    for did,payload in incoming.execute('SELECT id,payload FROM drafts').fetchall():
                        p=json.loads(payload)
                        p=relocate_draft(p,old,target)
                        incoming.execute("UPDATE drafts SET payload=?,approval=NULL,state=CASE WHEN state IN ('submitted','uncertain','submitting') THEN state ELSE 'needs_review' END WHERE id=?",(packed(p),did))
                for did,payload in incoming.execute('SELECT id,payload FROM drafts').fetchall():
                    p=json.loads(payload)
                    p=relocate_draft(p,source_root/'working_cvs',self.root/'working_cvs')
                    incoming.execute("UPDATE drafts SET payload=?,approval=NULL,state=CASE WHEN state IN ('submitted','uncertain','submitting') THEN state ELSE 'needs_review' END WHERE id=?",(packed(p),did))
                incoming.commit(); incoming.backup(self.db)
            finally:incoming.close()
        for key in ('templates','portfolio_catalog','certificates_catalog'):
            with self.db:self.db.execute('INSERT OR IGNORE INTO settings VALUES (?,?)',(key,packed(seed(key))))
        self.recover(); self.event('backup_restored',{'previous_backup':str(old_backup)})
        return old_backup

    def history(self):
        return [dict(r) for r in self.db.execute('SELECT * FROM events ORDER BY id DESC LIMIT 500')]

def re_digest(value):
    import re
    return bool(re.fullmatch('[a-f0-9]{64}',value))
