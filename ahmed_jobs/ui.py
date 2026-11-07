import json
import sys
import threading
from pathlib import Path
from PySide6.QtCore import Qt, QThread, Signal, QLockFile, QTimer
from PySide6.QtWidgets import (QApplication,QMainWindow,QWidget,QVBoxLayout,QHBoxLayout,
    QTabWidget,QLabel,QPushButton,QPlainTextEdit,QTableWidget,QTableWidgetItem,
    QFileDialog,QMessageBox,QLineEdit,QDialog,QFormLayout,QDialogButtonBox,QComboBox)
from .config import data_dir,seed
from .storage import Store,packed
from .documents import proposal
from .discovery import fetch_detail
from .editors import PayloadEditor,ProfileEditor

class Worker(QThread):
    result=Signal(object)
    progress=Signal(object)
    def __init__(self,fn): super().__init__(); self.fn=fn
    def run(self):
        try: self.result.emit({'value':self.fn()})
        except Exception as e: self.result.emit({'error':str(e)})

class Window(QMainWindow):
    scheduled_scan=Signal()
    def __init__(self,root=None,smoke=False):
        super().__init__(); self.store=Store(root or data_dir()); self.store.recover()
        self.workers=[]; self.cancel=threading.Event();self.closing=False
        self.scheduler=None; self.scan_running=False
        self.scheduled_scan.connect(self.scan_urls)
        self.setWindowTitle('أحمد حاتم — الوظائف والبورتفليو'); self.resize(1250,850)
        self.setLayoutDirection(Qt.RightToLeft)
        self.tabs=QTabWidget(); self.setCentralWidget(self.tabs)
        self.overview,self.overlayout=self.tab('ملخص التشغيل')
        self.summary=QLabel(); self.overlayout.addWidget(self.summary)
        self.overlayout.addWidget(QLabel('برنامج محلي • دون AI • الحد الأدنى 5 USD/ساعة • ميزانية التقديم صفر'))
        self.buttons(self.overlayout,[('استيراد حزمة ZIP',self.import_zip),('استيراد CSV',self.import_csv),('نسخ احتياطي',self.backup),('استعادة نسخة',self.restore)])
        guide=QLabel('ابدأ من هنا\n\n١. استورد حزمة ملفاتك مرة واحدة؛ الأصول محفوظة دون تعديل.\n\n٢. أضف فرصة أو اقرأ إعلانًا من رابط، ثم راجع الأجر والموقع وأسباب الترشيح.\n\n٣. جهّز الطلب واختر السيرة والمرفقات والإجابات، ثم احفظ النسخة للمراجعة.\n\n٤. راجع المحتوى واعتمده، وافتح الموقع للتسليم اليدوي. لا يحدث إرسال تلقائي.\n\nالبورتفليو والشهادات متاحان في شاشتين مستقلتين للاختيار والتجهيز.\nالجدولة اختيارية للقراءة فقط، وتعمل عندما يكون البرنامج والجهاز يعملان.')
        guide.setWordWrap(True);guide.setStyleSheet('QLabel { background: #edf3fc; padding: 24px; border-radius: 10px; line-height: 1.7; }');self.overlayout.addWidget(guide)
        self.overlayout.addStretch()
        _,layout=self.tab('المصادر والحسابات'); self.platforms=self.table(layout,['الموقع','الرابط','البحث','التقديم','البورتفليو','الخدمات','معرض الخدمة','الشهادات'])
        self.buttons(layout,[('إعداد المواقع والحسابات',lambda:self.edit_setting('platforms','إعداد المواقع')),
                             ('فتح جلسة مستقلة للموقع',self.open_platform),('مسح جلسة الموقع',self.reset_session)])
        _,layout=self.tab('الفرص'); self.jobtable=self.table(layout,['العنوان','الشركة','الدرجة','الحالة','سبب الترشيح/الاستبعاد'])
        self.buttons(layout,[('إضافة فرصة يدويًا',self.manual_job),('قراءة إعلان من رابط',self.fetch_job),
                             ('بحث Freelancer',self.search_freelancer),
                             ('إيقاف القراءة',lambda:self.cancel.set()),('تجهيز طلب',self.make_draft),('عرض التفاصيل',self.show_job)])
        self.buttons(layout,[('بحث متعدد المصادر',self.search_all),('استئناف آخر بحث متوقف',self.resume_search),('سجل نتائج المصادر',self.source_history),('تصدير الفرص CSV',self.export_jobs)])
        self.search_label=QLabel('لا يوجد بحث جارٍ');layout.addWidget(self.search_label)
        _,layout=self.tab('طابور المراجعة'); self.drafttable=self.table(layout,['المعرف','الوجهة','الحالة'])
        self.editor=PayloadEditor();layout.addWidget(self.editor)
        self.drafttable.itemSelectionChanged.connect(self.select_draft)
        self.buttons(layout,[('حفظ التعديل وإلغاء الموافقة',self.save_selected),('اعتماد النسخة الحالية',self.approve),
                             ('نسخ النص',self.copy_text),('فتح المتصفح للمعاينة اليدوية',self.preview)])
        self.buttons(layout,[('تعبئة قالب عربي',lambda:self.set_template('ar')),('تعبئة قالب إنجليزي',lambda:self.set_template('en')),('استخدام إجابات محفوظة',self.use_answers),('تصدير النص والمرفقات المختارة',self.export_draft)])
        self.buttons(layout,[('بدء تسليم يدوي بعد الاعتماد',self.start_manual),('تسجيل إيصال أو مراجعة نتيجة معلقة',self.reconcile_manual),('تجاهل الطلب',self.ignore_draft)])
        _,layout=self.tab('المتقدم والسير الذاتية'); self.profiletext=ProfileEditor(); layout.addWidget(self.profiletext)
        self.buttons(layout,[('حفظ بيانات المتقدم',self.save_profile),('تأكيد أن الأسماء تخص الشخص نفسه',self.confirm_identity),('عرض ملفات CV',lambda:self.show_assets('cv')),('إنشاء نسخة CV بالهاتف المعتمد',self.working_cv)])
        _,layout=self.tab('البورتفليو'); self.portfolio=self.table(layout,['المشروع','نوع العمل','مراجعة المصدر/الترخيص'])
        self.buttons(layout,[('عرض الأصول المستوردة',lambda:self.show_assets('all')),('تجهيز نشر للمراجعة',lambda:self.publication('portfolio'))])
        _,layout=self.tab('الشهادات'); self.certs=self.table(layout,['الصفحة','الشهادة','حالة الاسم'])
        self.buttons(layout,[('تقسيم PDF إلى شهادات منفصلة',self.split_certs),('تجهيز شهادة للنشر',lambda:self.publication('certificate'))])
        _,layout=self.tab('الأسئلة والإجابات'); self.answertext=QPlainTextEdit(); layout.addWidget(self.answertext)
        self.buttons(layout,[('إضافة إجابة بنطاق محدد',self.add_answer)])
        _,layout=self.tab('سجل المحاولات'); self.historytext=QPlainTextEdit(); self.historytext.setReadOnly(True); layout.addWidget(self.historytext)
        _,layout=self.tab('الإعدادات والجدولة')
        self.buttons(layout,[('تعديل الكلمات والأوزان',lambda:self.edit_setting('tracks','المسارات والكلمات')),
                             ('تعديل الفلاتر',lambda:self.edit_setting('filters','الفلاتر')),
                             ('إعداد جدولة قراءة الروابط',lambda:self.edit_setting('schedule','الجدولة: قراءة فقط')),
                             ('قراءة الروابط المحفوظة الآن',self.scan_urls)])
        self.buttons(layout,[('تعديل قوالب الطلبات',self.edit_templates),('تحويل نسخة CV إلى PDF',self.cv_pdf),('معاينة تغيير حجم صورة',self.resize_image)])
        layout.addWidget(QLabel('الجدولة للقراءة فقط عندما يكون البرنامج والجهاز يعملان. لا يوجد إرسال تلقائي.\nالتقديم والنشر بتسليم يدوي مع سجل محاولات وإيصال تؤكده بنفسك.\nيمكن استخدام Edge/Chrome المثبتين أو تشغيل SetupBrowser.cmd لتثبيت متصفح مستقل.'))
        layout.addStretch()
        self.statusBar().showMessage('جاهز — البيانات محلية')
        self.refresh()
        if not smoke:
            self.configure_schedule()
            QTimer.singleShot(0,self.bootstrap_inputs)

    def tab(self,name):
        w=QWidget(); l=QVBoxLayout(w); self.tabs.addTab(w,name); return w,l
    def buttons(self,layout,items):
        row=QHBoxLayout(); layout.addLayout(row)
        for title,fn in items:
            b=QPushButton(title); row.addWidget(b); b.clicked.connect(lambda checked=False,f=fn:self.guard(f))
    def table(self,layout,headers):
        t=QTableWidget(0,len(headers)); t.setHorizontalHeaderLabels(headers)
        t.setSelectionBehavior(QTableWidget.SelectRows); t.setSelectionMode(QTableWidget.SingleSelection)
        t.setEditTriggers(QTableWidget.NoEditTriggers); t.horizontalHeader().setStretchLastSection(True)
        layout.addWidget(t); return t
    def populate(self,t,rows):
        t.setRowCount(len(rows))
        for n,row in enumerate(rows):
            for c,v in enumerate(row): t.setItem(n,c,QTableWidgetItem(str(v)))
        t.resizeColumnsToContents()
    def guard(self,fn):
        try: fn()
        except Exception as e: QMessageBox.warning(self,'تعذر الإجراء',str(e))
    def refresh(self):
        self.jobs=self.store.jobs(); self.drafts=self.store.drafts()
        self.summary.setText(f'الفرص المحفوظة: {len(self.jobs)} | الطلبات: {len(self.drafts)} | الأصول: {len(self.store.assets())}\nمجلد البيانات: {self.store.root}')
        self.platformlist=self.store.get('platforms')
        from .search import install_schema
        install_schema(self.store)
        source_map={'Freelancer':'freelancer','LinkedIn':'linkedin','Wuzzuf':'wuzzuf','Bayt':'bayt','20four7VA':'breezy','Workable':'workable'}
        platform_rows=[]
        for p in self.platformlist:
            source=source_map.get(p['name'])
            last=self.store.db.execute('SELECT status FROM source_runs WHERE source=? ORDER BY id DESC LIMIT 1',(source,)).fetchone() if source else None
            status='needs_url' if not p.get('candidate_base_url') else ('المصدر محجوب' if last and last[0]=='blocked' else 'آخر جمع ناجح' if last and last[0]=='ok' else 'موصل بحث؛ لم ينجح التحقق الحي' if source else 'بحث يدوي')
            capabilities=p.get('requested_capabilities',[])
            platform_rows.append((p['name'],p.get('candidate_base_url') or 'needs_url',status,'يدوي مع سجل وإيصال',
                'تجهيز محلي؛ نشر يدوي' if any(c in capabilities for c in ('portfolio','featured')) else 'غير متحقق',
                'تجهيز محلي؛ نشر يدوي' if 'service' in capabilities else 'غير متحقق',
                'تجهيز محلي؛ نشر يدوي' if 'service_gallery' in capabilities else 'غير متحقق',
                'تجهيز محلي؛ نشر يدوي' if 'certificates' in capabilities else 'غير متحقق'))
        self.populate(self.platforms,platform_rows)
        self.populate(self.jobtable,[(j['title'],j.get('company',''),j['assessment']['score'],j['assessment']['status'],
            ' | '.join(j['assessment']['reasons'])+' | '+', '.join(w for m in j['assessment']['matches'] for w in m['words'])) for j in self.jobs])
        self.populate(self.drafttable,[(d['id'],d['payload']['destination'],d['state']) for d in self.drafts])
        self.profiletext.confirmations=self.store.get('confirmations')
        self.profiletext.setPlainText(json.dumps(self.store.get('profile'),ensure_ascii=False,indent=2))
        self.populate(self.portfolio,[(p['title'],p['project_type'],p['provenance_status']) for p in self.store.get('portfolio_catalog')])
        confirmed=self.store.get('confirmations').get('same_person_all_names')
        self.populate(self.certs,[(p['page'],p['title'],'أكد المستخدم وحدة الشخص' if confirmed else p['name_status']) for p in self.store.get('certificates_catalog')])
        from datetime import datetime
        from zoneinfo import ZoneInfo,ZoneInfoNotFoundError
        try:zone=ZoneInfo('Africa/Cairo')
        except ZoneInfoNotFoundError:zone=ZoneInfo('UTC')
        lines=[]
        for e in self.store.history():
            time=datetime.fromisoformat(e['created']).astimezone(zone).strftime('%Y-%m-%d %H:%M %Z')
            lines.append(time+' | '+e['kind']+' | '+e['payload'])
        attempts=[dict(r) for r in self.store.db.execute('SELECT * FROM attempts ORDER BY created DESC')]
        self.historytext.setPlainText('\n'.join(lines)+'\n\nمحاولات الإرسال المسجلة:\n'+'\n'.join(packed(a) for a in attempts))
        self.answertext.setPlainText('\n'.join(packed(dict(r)) for r in self.store.db.execute('SELECT * FROM answers')))
    def selected_job(self):
        n=self.jobtable.currentRow()
        if n<0: raise ValueError('اختر فرصة أولًا')
        return self.jobs[n]
    def selected_draft(self):
        n=self.drafttable.currentRow()
        if n<0: raise ValueError('اختر طلبًا أولًا')
        return self.drafts[n]
    def json_dialog(self,title,value):
        d=QDialog(self); d.setWindowTitle(title); d.resize(850,650); l=QVBoxLayout(d)
        t=QPlainTextEdit(); t.setPlainText(json.dumps(value,ensure_ascii=False,indent=2)); l.addWidget(t)
        b=QDialogButtonBox(QDialogButtonBox.Ok|QDialogButtonBox.Cancel); l.addWidget(b); b.accepted.connect(d.accept); b.rejected.connect(d.reject)
        if d.exec(): return json.loads(t.toPlainText())
    def record_dialog(self,title,value):
        d=QDialog(self);d.setWindowTitle(title);d.resize(750,650);layout=QVBoxLayout(d);form=QFormLayout();layout.addLayout(form);fields={}
        labels={'title':'العنوان','company':'الشركة / العميل','url':'الرابط','description':'الوصف الكامل','location':'الموقع وقيود الإقامة',
                'currency':'رمز العملة (USD مثلًا)','pay_unit':'وحدة الأجر','pay_min':'أقل أجر معلن','pay_max':'أقصى أجر معلن',
                'eligibility':'أهلية العمل من مصر','query':'كلمات البحث','offset':'بدء النتائج من','limit':'عدد النتائج في الصفحة',
                'question':'السؤال','answer':'الإجابة المؤكدة','scope':'نطاق الإجابة','scope_id':'الدولة / الشركة / معرف السؤال'}
        choices={'eligibility':[('غير معروفة','unknown'),('مؤهل','eligible'),('غير مؤهل','ineligible')],
                 'pay_unit':[('غير معروف',None),('ساعة','hour'),('شهري','month'),('مشروع ثابت','fixed')],
                 'scope':[('دولة محددة','country'),('شركة محددة','employer'),('سؤال محدد','exact'),('عام لجميع الطلبات','global')]}
        for k,v in value.items():
            if k in choices:
                w=QComboBox()
                for label,code in choices[k]:w.addItem(label,code)
                w.setCurrentIndex(max(0,w.findData(v)))
            elif k=='description':w=QPlainTextEdit();w.setPlainText(v or '')
            else:w=QLineEdit('' if v is None else str(v))
            fields[k]=w;form.addRow(labels.get(k,k),w)
        buttons=QDialogButtonBox(QDialogButtonBox.Ok|QDialogButtonBox.Cancel);layout.addWidget(buttons);buttons.accepted.connect(d.accept);buttons.rejected.connect(d.reject)
        if not d.exec():return None
        result={}
        for k,w in fields.items():
            v=w.currentData() if isinstance(w,QComboBox) else w.toPlainText() if isinstance(w,QPlainTextEdit) else w.text().strip()
            if k in ('pay_min','pay_max'):v=float(v) if v else None
            if k in ('limit','offset'):v=int(v)
            if k=='currency' and not v:v=None
            result[k]=v
        return result
    def edit_setting(self,key,title):
        if key in ('platforms','schedule'):
            from .settings_dialogs import SourcesDialog,ScheduleDialog
            dialog=(SourcesDialog if key=='platforms' else ScheduleDialog)(self.store.get(key),self)
            value=dialog.value() if dialog.exec() else None
        else:value=self.json_dialog(title,self.store.get(key))
        if value is not None:
            self.store.put(key,value)
            if key in ('tracks','filters'):
                for j in self.store.jobs(): self.store.add_job(j)
            self.refresh()
            if key=='schedule':self.configure_schedule()
    def manual_job(self):
        value=self.record_dialog('فرصة جديدة',{'title':'','company':'','url':'https://','description':'','location':'','currency':None,'pay_unit':None,'pay_min':None,'pay_max':None,'eligibility':'unknown'})
        if value: self.store.add_job(value); self.refresh()
    def background(self,fn,done):
        worker=Worker(fn); self.workers.append(worker)
        def result(r):
            if 'error' in r: QMessageBox.warning(self,'تعذر الإجراء',r['error'])
            else: self.guard(lambda:done(r['value']))
        worker.result.connect(result); worker.finished.connect(lambda:self.workers.remove(worker)); worker.start()
    def import_zip(self):
        path,_=QFileDialog.getOpenFileName(self,'حزمة مدخلات','','ZIP (*.zip)')
        if not path:return
        root=self.store.root
        def work():
            s=Store(root)
            try:return s.import_handoff(path)
            finally:s.close()
        self.background(work,lambda r:(self.statusBar().showMessage(str(r)),self.refresh()))
    def bootstrap_inputs(self):
        from .config import bundled_input
        if self.closing:return
        if self.store.assets():return
        path=bundled_input()
        if not path:return
        root=self.store.root;self.statusBar().showMessage('جارٍ تجهيز ملفاتك المرفقة لأول تشغيل…')
        def work():
            s=Store(root)
            try:return s.import_handoff(path)
            finally:s.close()
        self.background(work,lambda r:(self.refresh(),self.statusBar().showMessage('ملفاتك جاهزة؛ ابدأ البحث عن الفرص')))
    def import_csv(self):
        path,_=QFileDialog.getOpenFileName(self,'استيراد فرص','','CSV (*.csv)')
        if path:self.store.import_csv(path); self.refresh()
    def backup(self):
        path,_=QFileDialog.getSaveFileName(self,'نسخة محلية خاصة','','ZIP (*.zip)')
        if path:self.store.backup(path); self.statusBar().showMessage('تم النسخ دون جلسات المتصفح')
    def restore(self):
        if self.workers:raise ValueError('أوقف البحث وأغلق جلسات المتصفح قبل استعادة قاعدة البيانات')
        path,_=QFileDialog.getOpenFileName(self,'استعادة نسخة احتياطية','','ZIP (*.zip)')
        if path and QMessageBox.question(self,'الاستعادة','سيتم حفظ نسخة من الحالة الحالية ثم استعادة البيانات. هل تتابع؟')==QMessageBox.Yes:
            saved=self.store.restore(path);self.refresh();self.configure_schedule()
            self.statusBar().showMessage('تمت الاستعادة؛ النسخة السابقة: '+str(saved))
    def fetch_job(self):
        value=self.record_dialog('قراءة إعلان من رابط (دون إرسال)',{'url':'https://'})
        if not value:return
        self.cancel.clear(); self.statusBar().showMessage('جارٍ قراءة الإعلان…')
        def done(result):
            for j in result.get('jobs',[]):self.store.add_job(j)
            self.store.event('detail_import',result)
            self.statusBar().showMessage(result['status']+' '+result.get('reason','')); self.refresh()
        self.background(lambda:fetch_detail(value['url'],self.cancel),done)
    def search_freelancer(self):
        from .freelancer import discover
        previous=self.store.get('freelancer_search') or {'query':'Excel','offset':0,'limit':20}
        cfg=self.record_dialog('بحث Freelancer — حدود النتائج ظاهرة، لا تقديم',previous)
        if not cfg:return
        self.cancel.clear();self.statusBar().showMessage('جارٍ البحث دون تقديم…')
        def done(result):
            for j in result.get('jobs',[]):self.store.add_job(j)
            self.store.event('freelancer_search',{'query':cfg['query'],'status':result['status'],
                             'count':len(result.get('jobs',[])),'reason':result.get('reason')})
            self.store.put('freelancer_search',{**cfg,'offset':result.get('next_cursor') or 0})
            self.statusBar().showMessage(result['status']+' — '+str(len(result.get('jobs',[])))+' نتائج '+result.get('reason',''))
            self.refresh()
        self.background(lambda:discover(cfg['query'],cfg.get('offset',0),cfg.get('limit',20),self.cancel),done)
    def show_job(self):self.json_dialog('تفاصيل الفرصة — العرض فقط',self.selected_job())
    def search_all(self):
        from .search_dialog import SearchDialog
        default={'sources':['freelancer','remotive','jobicy','remoteok','arbeitnow','linkedin','wuzzuf','bayt','breezy'],
                 'queries':['operations coordinator','virtual assistant','junior data analyst','legal assistant','Excel'],
                 'page_size':20,'max_pages':1}
        dialog=SearchDialog(self.store.get('search_config') or default,self)
        if not dialog.exec():return
        cfg=dialog.config()
        if not cfg['sources'] or not cfg['queries']:raise ValueError('اختر مصدرًا وكلمة بحث واحدة على الأقل')
        self.store.put('search_config',cfg);self._start_search(cfg)
    def _start_search(self,config=None,run_id=None):
        if self.scan_running:raise ValueError('يوجد بحث يعمل؛ أوقفه أو انتظر اكتماله')
        from .search import run_search
        root=self.store.root;self.cancel.clear();self.scan_running=True
        worker=Worker(lambda:run_search(root,config,run_id,self.cancel,worker.progress.emit));self.workers.append(worker)
        worker.progress.connect(self.search_progress)
        worker.result.connect(self.search_finished)
        worker.finished.connect(lambda:self.workers.remove(worker));worker.start()
        self.search_label.setText('بدأ البحث؛ يمكنك إيقافه واستئنافه لاحقًا')
    def search_progress(self,p):
        self.search_label.setText(f"{p['done']}/{p['total']} — {p['source']} — {p['status']} — {p['count']} نتيجة")
    def search_finished(self,result):
        self.scan_running=False
        if 'error' in result:self.search_label.setText('فشل البحث: '+result['error'])
        else:
            r=result['value'];self.search_label.setText(f"{r['status']} — اكتملت {r['tasks']}/{r['total']} خطوة، تعذرت {r['failures']} خطوة")
        self.refresh()
    def resume_search(self):
        from .search import install_schema
        install_schema(self.store)
        r=self.store.db.execute("SELECT id FROM search_runs WHERE status IN ('paused','running') ORDER BY created DESC LIMIT 1").fetchone()
        if not r:raise ValueError('لا يوجد بحث متوقف للاستئناف')
        self._start_search(run_id=r[0])
    def source_history(self):
        from .search import install_schema
        install_schema(self.store)
        rows=[dict(r) for r in self.store.db.execute('SELECT * FROM source_runs ORDER BY id DESC LIMIT 300')]
        d=QDialog(self);d.resize(1000,600);d.setWindowTitle('نتائج المصادر: الصفر يختلف عن الفشل');layout=QVBoxLayout(d)
        table=self.table(layout,['المصدر','كلمات البحث','الحالة','عدد النتائج','السبب','التاريخ'])
        self.populate(table,[(r['source'],r['query'],r['status'],r['count'],r['reason'] or '',r['created']) for r in rows]);d.exec()
    def make_draft(self):
        from .publishing import suggest_projects
        j=self.selected_job()
        if j['assessment']['status']=='filtered': raise ValueError('الفرصة مستبعدة؛ راجع بياناتها والفلاتر')
        attachments,selection_reason=self.store.cv_for(j)
        projects=suggest_projects(j,self.store.get('portfolio_catalog'))
        catalog={p['id']:p for p in self.store.get('portfolio_catalog')}
        candidates=[f for project in projects for f in self.store.project_files(catalog[project['id']])]
        p={'action':'application','destination':j['url'],'title':j['title'],'company':j.get('company',''),
           'text':proposal(j,self.store.get('profile'),tracks=self.store.get('tracks'),templates=self.store.get('templates')),'answers':{},'unknown_questions':[],
           'attachments':attachments,'selection_reason':selection_reason,'quote':None,'quote_currency':None,'quote_unit':None,
           'resume':attachments[0] if attachments else None,
           'suggested_projects':projects,'candidate_files':candidates,
           'duration':None,'cost':0,'credits':0,'eligibility':j['assessment']['eligibility'],
           'expires':j.get('expires'),'description':j.get('description',''),'location':j.get('location',''),
           'adapter_version':'manual-v1'}
        self.store.save_draft(p,j['id']); self.refresh(); self.tabs.setCurrentIndex(3)
    def select_draft(self):
        if self.drafttable.currentRow()>=0:
            self.editor.setPlainText(json.dumps(self.selected_draft()['payload'],ensure_ascii=False,indent=2))
    def save_selected(self):
        d=self.selected_draft(); self.store.save_draft(json.loads(self.editor.toPlainText()),d['opportunity_id'],d['id']); self.refresh()
    def approve(self):
        d=self.selected_draft(); p=json.loads(self.editor.toPlainText())
        if p!=d['payload']: raise ValueError('احفظ التعديلات أولًا ثم راجع النسخة المحفوظة')
        if QMessageBox.question(self,'اعتماد المحتوى','هل راجعت الوجهة والنص والإجابات والمرفقات والتكلفة للنسخة المعروضة؟')==QMessageBox.Yes:
            self.store.approve(d['id']); self.refresh()
    def copy_text(self): QApplication.clipboard().setText(json.loads(self.editor.toPlainText())['text'])
    def export_draft(self):
        d=self.selected_draft()
        if json.loads(self.editor.toPlainText())!=d['payload']:raise ValueError('احفظ التعديلات قبل تصدير النسخة')
        path,_=QFileDialog.getSaveFileName(self,'حزمة مراجعة محلية — لم تُرسل','','ZIP (*.zip)')
        if path:
            self.store.export_draft(d['id'],path);self.statusBar().showMessage('تم تصدير مسودة محلية بالمرفقات المختارة؛ لم تُرسل')
    def set_template(self,language):
        d=self.selected_draft();p=json.loads(self.editor.toPlainText())
        if p['action']!='application':raise ValueError('هذا القالب مخصص لطلبات الوظائف')
        p['text']=proposal({'title':p.get('title',''),'company':p.get('company','')},self.store.get('profile'),language,self.store.get('tracks'),self.store.get('templates'))
        self.editor.setPlainText(packed(p));self.statusBar().showMessage('القالب في المحرر؛ احفظه وراجع النسخة قبل الاعتماد')
    def use_answers(self):
        self.selected_draft();p=json.loads(self.editor.toPlainText())
        questions=list(dict.fromkeys(p.get('unknown_questions',[])+list(p.get('answers',{}))))
        answers=self.store.reusable_answers(questions,p['destination'],p.get('company',''),p.get('question_country',''))
        p.setdefault('answers',{}).update(answers)
        p['unknown_questions']=[q for q in p.get('unknown_questions',[]) if q not in answers]
        self.editor.setPlainText(packed(p));self.statusBar().showMessage(f'تمت إضافة {len(answers)} إجابة بالنطاق المطابق؛ راجعها واحفظ التعديلات')
    def ignore_draft(self):
        d=self.selected_draft()
        if d['state'] in ('submitting','submitted','uncertain'):raise ValueError('راجع المحاولة المعلقة أولًا؛ لا تُحذف نتيجتها')
        with self.store.db:self.store.db.execute("UPDATE drafts SET state='ignored',approval=NULL WHERE id=?",(d['id'],))
        self.store.event('draft_ignored',{'draft':d['id']});self.refresh()
    def start_manual(self):
        from .browser import handoff
        d=self.selected_draft()
        if json.loads(self.editor.toPlainText())!=d['payload']:raise ValueError('احفظ التعديلات وأعد اعتمادها أولًا')
        if QMessageBox.question(self,'بدء تسليم يدوي',
             'سيُسجل بدء المحاولة قبل فتح الموقع. راجع النموذج النهائي بنفسك، ولا تنفق أي أرصدة. البرنامج لا يضغط إرسال.\nإذا أرسلت، احفظ رقم الطلب ورابط إيصال واضح. هل تبدأ للنسخة المعتمدة؟')!=QMessageBox.Yes:return
        aid=self.store.begin_attempt(d['id']);self.refresh();root=self.store.root;profile=self.store.get('profile')
        def work():
            try:
                result=handoff(root,d['payload']['destination'],profile,d['payload'])
                return {'attempt':aid,'browser':result}
            except Exception as e:
                return {'attempt':aid,'browser_error':type(e).__name__}
        def done(result):
            # The app never infers success from a closed window or a thank-you string.
            self.store.finish_attempt(aid,'uncertain',{'reason':'Manual browser session ended; site-specific receipt not yet reconciled'})
            self.store.event('manual_handoff_closed',{'attempt':aid,'result':'uncertain'})
            self.refresh();self.statusBar().showMessage('المحاولة معلقة؛ سجل إيصال النتيجة أو راجع سجل الموقع. لن نعيدها تلقائيًا.')
        self.background(work,done)
    def reconcile_manual(self):
        from .outcomes import reconcile
        rows=list(self.store.db.execute("SELECT a.id,a.draft_id FROM attempts a WHERE a.state IN ('submitting','uncertain') ORDER BY a.created DESC"))
        if not rows:raise ValueError('لا توجد محاولة معلقة')
        d=QDialog(self);d.setWindowTitle('مراجعة نتيجة محاولة يدوية');layout=QVBoxLayout(d);form=QFormLayout();layout.addLayout(form)
        choice=QComboBox()
        for r in rows:choice.addItem(self.store.draft(r['draft_id'])['payload'].get('title','')+' — '+r['id'][:12],r['id'])
        form.addRow('المحاولة',choice)
        outcome=QComboBox();outcome.addItem('أرسلت ومعي إيصال خاص بالطلب','submitted');outcome.addItem('راجعت سجل الموقع ولم يتم الإرسال','not_submitted');form.addRow('النتيجة التي تحققت منها',outcome)
        reference=QLineEdit();url=QLineEdit();form.addRow('رقم الطلب / مرجع الإيصال',reference);form.addRow('رابط الإيصال في الموقع',url)
        from PySide6.QtWidgets import QCheckBox
        confirmed=QCheckBox('أؤكد أنني راجعت إيصال الطلب أو سجل الموقع، وليس مجرد صفحة شكر عامة');layout.addWidget(confirmed)
        buttons=QDialogButtonBox(QDialogButtonBox.Ok|QDialogButtonBox.Cancel);layout.addWidget(buttons);buttons.accepted.connect(d.accept);buttons.rejected.connect(d.reject)
        if d.exec():
            reconcile(self.store,choice.currentData(),outcome.currentData(),{'receipt_id':reference.text(),'receipt_url':url.text(),'confirmed':confirmed.isChecked()},confirmed.isChecked())
            self.refresh()
    def preview(self):
        from .browser import handoff
        d=self.selected_draft(); root=self.store.root; profile=self.store.get('profile')
        if json.loads(self.editor.toPlainText())!=d['payload']:raise ValueError('احفظ التعديلات أولًا حتى تُعاين النسخة الحالية')
        def done(result):
            unknown=result.get('manual_required',[])
            current=self.store.draft(d['id'])
            if (unknown or result.get('remote_snapshot')) and current['state'] not in ('submitting','submitted','uncertain'):
                p=current['payload'];p['unknown_questions']=list(dict.fromkeys(p.get('unknown_questions',[])+unknown))
                if result.get('remote_snapshot'):p['remote_snapshot']=result['remote_snapshot']
                self.store.save_draft(p,current['opportunity_id'],current['id'])
                self.refresh()
            self.store.event('browser_preview',{'draft':d['id'],'status':result['status'],'unresolved_fields':unknown})
            self.statusBar().showMessage('معاينة فقط؛ حقول تحتاج مراجعة: '+', '.join(unknown))
        self.background(lambda:handoff(root,d['payload']['destination'],profile,d['payload']),done)
    def open_platform(self):
        from .browser import handoff
        n=self.platforms.currentRow()
        if n<0: raise ValueError('اختر موقعًا')
        p=self.platformlist[n]; url=p.get('candidate_base_url')
        if not url:raise ValueError('needs_url: أدخل الرابط في إعداد المواقع')
        root=self.store.root; profile=self.store.get('profile')
        self.background(lambda:handoff(root,url,profile),lambda r:self.statusBar().showMessage(str(r)))
    def reset_session(self):
        from urllib.parse import urlsplit
        from .safety import safe_url
        import shutil
        if self.workers:raise ValueError('أغلق جلسات المتصفح وانتظر انتهاء المهام أولًا')
        n=self.platforms.currentRow()
        if n<0:raise ValueError('اختر موقعًا')
        url=self.platformlist[n].get('candidate_base_url')
        if not url:raise ValueError('أدخل رابط الموقع أولًا')
        root=(self.store.root/'browser_profiles').resolve();folder=root/urlsplit(safe_url(url)).hostname
        if not folder.exists():return
        if folder.is_symlink() or not folder.resolve().is_relative_to(root):raise ValueError('مسار جلسة غير صالح')
        if QMessageBox.question(self,'مسح جلسة محلية','سيتم حذف cookies وبيانات تسجيل الدخول المحلية لهذا الموقع فقط. ستحتاج تسجيل الدخول مجددًا. هل تتابع؟')==QMessageBox.Yes:
            shutil.rmtree(folder);self.store.event('browser_session_reset',{'host':folder.name})
    def save_profile(self):self.store.put('profile',json.loads(self.profiletext.toPlainText())); self.refresh()
    def confirm_identity(self):self.store.confirm_identity(); self.refresh()
    def show_assets(self,kind):
        from .documents import text
        assets=[a for a in self.store.assets() if kind=='all' or a['kind']==kind]
        d=QDialog(self);d.setWindowTitle('الأصول — قراءة فقط دون رفع');d.resize(1000,700);layout=QVBoxLayout(d)
        table=self.table(layout,['اسم الملف','النوع','المسار'])
        self.populate(table,[(Path(a['path']).name,a['kind'],a['path']) for a in assets])
        preview=QPlainTextEdit();preview.setReadOnly(True);layout.addWidget(preview)
        def display():
            n=table.currentRow()
            if n<0:return
            path=assets[n]['path']
            if Path(path).suffix.lower() not in ('.docx','.pdf','.xlsx','.txt'):
                preview.setPlainText('الأصل محفوظ: '+path+'\nهذا النوع يحتاج عارض ملفات محلي؛ لن يتم تشغيله هنا.');return
            self.background(lambda:text(path),lambda value:preview.setPlainText(value))
        self.buttons(layout,[('استخراج نص الملف المحدد للمعاينة',display)])
        d.exec()
    def split_certs(self):
        from .documents import split_certificates
        path,_=QFileDialog.getOpenFileName(self,'ملف الشهادات','','PDF (*.pdf)')
        if not path:return
        folder=QFileDialog.getExistingDirectory(self,'مجلد الحفظ')
        if folder:
            import uuid
            self.background(lambda:len(split_certificates(path,Path(folder)/('certificates_'+uuid.uuid4().hex[:8]))),lambda n:self.statusBar().showMessage(f'تم فصل {n} شهادة دون تعديل المحتوى'))
    def publication(self,action):
        value={'action':action,'destination':'https://','title':'','text':'',
                'attachments':[],'answers':{},'unknown_questions':[],'cost':0,'credits':0,
                'asset_reviewed':False,'alternate_name':False,'adapter_version':'manual-v1'}
        if action=='portfolio':
            row=self.portfolio.currentRow()
            if row>=0:
                project=self.store.get('portfolio_catalog')[row];value['title']=project['title'];value['text']=project.get('upload_text',project['title']);value['candidate_files']=self.store.project_files(project)
        if action=='certificate':
            row=self.certs.currentRow()
            if row>=0:
                cert=self.store.get('certificates_catalog')[row];value['title']=cert['title'];value['text']=cert['title'];value['alternate_name']=cert['page'] in (11,12,13);value['candidate_files']=[self.store.certificate_file(cert['page'])]
        self.store.save_draft(value);self.refresh();self.tabs.setCurrentIndex(3)
    def add_answer(self):
        value=self.record_dialog('إجابة محفوظة بنطاق واضح',{'question':'','answer':'','scope':'country','scope_id':''})
        if value:self.store.save_answer(**value); self.refresh()
    def working_cv(self):
        from .documents import corrected_cv
        source,_=QFileDialog.getOpenFileName(self,'اختر أصل CV','','DOCX (*.docx)')
        if not source:return
        output,_=QFileDialog.getSaveFileName(self,'نسخة عمل مستقلة','','DOCX (*.docx)')
        if output:
            corrected_cv(source,output);self.store.event('working_cv_created',{'source':source,'working_copy':output})
            self.statusBar().showMessage('تم إنشاء نسخة بالهاتف المعتمد؛ الأصل محفوظ')
    def export_jobs(self):
        path,_=QFileDialog.getSaveFileName(self,'تصدير الفرص','','CSV (*.csv)')
        if path:self.store.export_jobs(path);self.statusBar().showMessage('تم تصدير الفرص دون تنفيذ أي تقديم')
    def edit_templates(self):
        d=QDialog(self);d.resize(850,650);d.setWindowTitle('قوالب عربية وإنجليزية قابلة للتعديل');layout=QVBoxLayout(d)
        layout.addWidget(QLabel('الحقول المتاحة: {name} {title} {company} {role_evidence} — النص حتمي، دون AI.'))
        tabs=QTabWidget();layout.addWidget(tabs);editors={}
        for lang,label in [('ar','العربية'),('en','English')]:
            e=QPlainTextEdit();e.setPlainText(self.store.get('templates')[lang]);tabs.addTab(e,label);editors[lang]=e
        buttons=QDialogButtonBox(QDialogButtonBox.Ok|QDialogButtonBox.Cancel);layout.addWidget(buttons);buttons.accepted.connect(d.accept);buttons.rejected.connect(d.reject)
        if d.exec():
            templates={lang:e.toPlainText() for lang,e in editors.items()}
            for lang in templates:proposal({'title':'Example'},self.store.get('profile'),lang,templates=templates)
            self.store.put('templates',templates)
    def cv_pdf(self):
        from .documents import pdf_working_copy
        source,_=QFileDialog.getOpenFileName(self,'نسخة CV المراد تحويلها','','DOCX (*.docx)')
        if not source:return
        path,_=QFileDialog.getSaveFileName(self,'PDF مستقل — راجع تنسيقه قبل الرفع','','PDF (*.pdf)')
        if path:pdf_working_copy(source,path);self.statusBar().showMessage('تم إنشاء PDF نصي؛ راجع تنسيقه قبل استخدامه')
    def resize_image(self):
        from .publishing import resize_preview
        source,_=QFileDialog.getOpenFileName(self,'الصورة الأصلية','','Images (*.png *.jpg *.jpeg *.webp)')
        if not source:return
        cfg=self.record_dialog('أبعاد قصوى لنسخة مستقلة',{'width':'1280','height':'960'})
        if not cfg:return
        path,_=QFileDialog.getSaveFileName(self,'نسخة صورة مستقلة','','PNG (*.png)')
        if path:
            resize_preview(source,path,int(cfg['width']),int(cfg['height']))
            d=QDialog(self);layout=QVBoxLayout(d);label=QLabel();from PySide6.QtGui import QPixmap
            label.setPixmap(QPixmap(path).scaled(1000,650,Qt.KeepAspectRatio,Qt.SmoothTransformation));layout.addWidget(label);d.exec()
    def configure_schedule(self):
        if self.scheduler:self.scheduler.shutdown(wait=False);self.scheduler=None
        cfg=self.store.get('schedule')
        if cfg.get('enabled'):
            from apscheduler.schedulers.qt import QtScheduler
            self.scheduler=QtScheduler()
            self.scheduler.add_job(self.scheduled_scan.emit,'interval',minutes=max(1,float(cfg.get('minutes',60))),max_instances=1,coalesce=True)
            self.scheduler.start()
    def scan_urls(self):
        if self.scan_running:return
        from .scheduler import refresh_saved_urls
        root=self.store.root;self.cancel.clear();self.scan_running=True
        def work():
            try:return refresh_saved_urls(root,self.cancel)
            finally:self.scan_running=False
        self.background(work,lambda r:(self.refresh(),self.statusBar().showMessage(f'انتهت قراءة {len(r)} رابط')))
    def closeEvent(self,event):
        if self.workers:
            QMessageBox.information(self,'مهام قائمة','أغلق المتصفح وانتظر انتهاء القراءة قبل إغلاق البرنامج.'); event.ignore(); return
        if self.scheduler:self.scheduler.shutdown(wait=False)
        self.closing=True;self.store.close(); event.accept()

def run():
    app=QApplication(sys.argv); app.setLayoutDirection(Qt.RightToLeft)
    smoke='--smoke-test' in sys.argv
    import os
    root=Path(os.environ['AHMED_JOBS_SMOKE_DIR']) if smoke and os.environ.get('AHMED_JOBS_SMOKE_DIR') else data_dir()
    root.mkdir(parents=True,exist_ok=True)
    lock=QLockFile(str(root/'desktop.lock')); lock.setStaleLockTime(30000)
    if not lock.tryLock(100):
        QMessageBox.warning(None,'البرنامج مفتوح','يوجد تشغيل آخر يستخدم البيانات نفسها.'); return 1
    app.setStyle('Fusion')
    app.setStyleSheet('QWidget { font-size: 14px; } QTabWidget::pane { border: 1px solid #ccd4df; } QPushButton { padding: 8px; } QHeaderView::section { padding: 7px; background: #e8eef8; }')
    w=Window(root,smoke=smoke)
    if '--minimized' in sys.argv:w.showMinimized()
    else:w.show()
    if smoke:
        def smoke_done():
            report={'tabs':w.tabs.count(),'platforms':w.platforms.rowCount(),'version':__import__('ahmed_jobs').__version__,'network_started':False}
            w.grab().save(str(root/'smoke-desktop.png'))
            (root/'smoke-result.json').write_text(json.dumps(report),encoding='utf-8')
            code=0 if report['tabs']==10 and report['platforms']==24 else 1
            w.close();app.exit(code)
        QTimer.singleShot(500,smoke_done)
    result=app.exec(); lock.unlock(); return result
