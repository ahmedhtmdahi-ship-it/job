"""User-facing editors; persisted JSON stays an internal storage format."""
import json
from PySide6.QtWidgets import (QWidget,QFormLayout,QVBoxLayout,QHBoxLayout,QLineEdit,
    QPlainTextEdit,QComboBox,QCheckBox,QPushButton,QFileDialog,QListWidget,QTableWidget,QTableWidgetItem,QScrollArea)

class PayloadEditor(QWidget):
    def __init__(self):
        super().__init__();self.original={};self.fields={}
        outer=QVBoxLayout(self);scroll=QScrollArea();scroll.setWidgetResizable(True);outer.addWidget(scroll)
        body=QWidget();scroll.setWidget(body);form=QFormLayout(body)
        labels={'destination':'الوجهة الكاملة','title':'عنوان الوظيفة / المنشور','company':'الشركة / العميل',
                'description':'وصف الإعلان الكامل','location':'الموقع وشروط الإقامة',
                'question_country':'دولة السؤال القانوني إن كانت محددة — لا تُستنتج من Remote',
                'text':'النص الكامل للمراجعة','selection_reason':'سبب اختيار السيرة الذاتية','duration':'مدة التنفيذ — اتركها فارغة إن لم تتحدد',
                'quote':'قيمة العرض','quote_currency':'عملة العرض (مثل USD)',
                'cost':'تكلفة التقديم النقدية','credits':'تكلفة الأرصدة / Connects','expires':'تاريخ انتهاء الفرصة (YYYY-MM-DD)'}
        for key,label in labels.items():
            widget=QPlainTextEdit() if key in ('text','description') else QLineEdit()
            if key=='text':widget.setMinimumHeight(180)
            self.fields[key]=widget;form.addRow(label,widget)
            if key=='selection_reason':widget.setReadOnly(True)
            if key=='description':widget.setReadOnly(True);widget.setMaximumHeight(120)
        self.action=QComboBox()
        for label,value in [('طلب وظيفة','application'),('مشروع بورتفليو','portfolio'),('خدمة','service'),('صور معرض خدمة','service_gallery'),('شهادة','certificate')]:self.action.addItem(label,value)
        form.addRow('نوع العملية',self.action)
        self.unit=QComboBox()
        for label,value in [('غير محدد',None),('بالساعة','hour'),('مشروع ثابت','fixed'),('شهري','month')]:self.unit.addItem(label,value)
        form.addRow('وحدة العرض',self.unit)
        self.eligibility=QComboBox()
        for label,value in [('غير معروفة — تحتاج مراجعة','unknown'),('أؤكد الأهلية من مصر لهذه الفرصة','eligible'),('غير مؤهل','ineligible')]:self.eligibility.addItem(label,value)
        form.addRow('أهلية التقديم',self.eligibility)
        self.files=QListWidget();form.addRow('المرفقات المختارة فقط',self.files)
        self.candidates=QListWidget();self.candidates.setSelectionMode(QListWidget.MultiSelection);form.addRow('ملفات مقترحة — لن تُرفق دون اختيارك',self.candidates)
        choose=QPushButton('إضافة الملفات المقترحة المحددة');choose.clicked.connect(self.choose_candidates);form.addRow(choose)
        self.resume=QComboBox();self.cover_file=QComboBox();form.addRow('ملف السيرة الذاتية المراد رفعه',self.resume);form.addRow('ملف خطاب التقديم إن وجد',self.cover_file)
        row=QHBoxLayout();add=QPushButton('اختيار ملفات');remove=QPushButton('إزالة الملف المحدد');row.addWidget(add);row.addWidget(remove);form.addRow(row)
        add.clicked.connect(self.add_files);remove.clicked.connect(self.remove_file)
        self.answers=QTableWidget(0,2);self.answers.setHorizontalHeaderLabels(['السؤال','الإجابة المؤكدة']);self.answers.horizontalHeader().setStretchLastSection(True)
        form.addRow('كل الإجابات التي ستستخدم',self.answers)
        add_answer=QPushButton('إضافة سؤال وإجابة');add_answer.clicked.connect(lambda:self.answers.insertRow(self.answers.rowCount()));form.addRow(add_answer)
        self.unknown=QPlainTextEdit();self.unknown.setMaximumHeight(90);form.addRow('أسئلة لازالت بلا إجابة — سؤال في كل سطر',self.unknown)
        self.asset_reviewed=QCheckBox('راجعت محتوى الأصل واسم صاحبه ومصدر البيانات وترخيص النشر');form.addRow(self.asset_reviewed)
        self.remote=QPlainTextEdit();self.remote.setReadOnly(True);self.remote.setMinimumHeight(180);form.addRow('النموذج النهائي الفعلي — كل الحقول والملفات المرصودة',self.remote)
    def add_files(self):
        paths,_=QFileDialog.getOpenFileNames(self,'اختيار المرفقات ذات الصلة فقط')
        existing={self.files.item(n).text() for n in range(self.files.count())}
        for p in paths:
            if p not in existing:self.files.addItem(p);existing.add(p)
        self.update_file_roles()
    def choose_candidates(self):
        existing={self.files.item(n).text() for n in range(self.files.count())}
        for item in self.candidates.selectedItems():
            if item.text() not in existing:self.files.addItem(item.text());existing.add(item.text())
        self.update_file_roles()
    def remove_file(self):
        if self.files.currentRow()>=0:self.files.takeItem(self.files.currentRow())
        self.update_file_roles()
    def update_file_roles(self):
        from pathlib import Path
        for widget in (self.resume,self.cover_file):
            previous=widget.currentData();widget.clear();widget.addItem('لم أختر ملفًا للرفع',None)
            for i in range(self.files.count()):
                p=self.files.item(i).text()
                if Path(p).suffix.lower() in ('.pdf','.docx'):widget.addItem(Path(p).name,p)
            widget.setCurrentIndex(max(0,widget.findData(previous)))
    def setPlainText(self,text):
        self.original=json.loads(text);p=self.original
        for k,w in self.fields.items():
            value='' if p.get(k) is None else str(p[k])
            if isinstance(w,QPlainTextEdit):w.setPlainText(value)
            else:w.setText(value)
        for w,value in [(self.action,p.get('action','application')),(self.unit,p.get('quote_unit')),(self.eligibility,p.get('eligibility','unknown'))]:
            w.setCurrentIndex(max(0,w.findData(value)))
        self.files.clear();self.files.addItems(p.get('attachments',[]))
        self.candidates.clear();self.candidates.addItems(p.get('candidate_files',[]))
        self.update_file_roles()
        self.resume.setCurrentIndex(max(0,self.resume.findData(p.get('resume'))))
        self.cover_file.setCurrentIndex(max(0,self.cover_file.findData(p.get('cover_letter_file'))))
        answers=p.get('answers',{});self.answers.setRowCount(len(answers))
        for i,(q,a) in enumerate(answers.items()):
            self.answers.setItem(i,0,QTableWidgetItem(q));self.answers.setItem(i,1,QTableWidgetItem(str(a)))
        self.unknown.setPlainText('\n'.join(p.get('unknown_questions',[])))
        self.asset_reviewed.setChecked(p.get('asset_reviewed',False))
        snapshot=p.get('remote_snapshot')
        if snapshot:
            lines=['الصفحة: '+snapshot.get('page_url',''),'وجهة الإرسال: '+snapshot.get('action',''),
                   'الموصل: '+snapshot.get('adapter','')+' / '+snapshot.get('adapter_version',''),
                   'التكلفة: '+('غير مؤكدة' if snapshot.get('cost') is None else str(snapshot['cost']))+' | الأرصدة: '+('غير مؤكدة' if snapshot.get('credits') is None else str(snapshot['credits']))]
            if snapshot.get('inspection_only'):lines.insert(0,'معاينة عامة للحقول؛ لا تمنح صلاحية إرسال آلي')
            for field in snapshot.get('fields',[]):
                lines.append((field.get('label') or field.get('name') or 'حقل')+': '+str(field.get('checked') if field.get('checked') is not None else field.get('value','')))
                for file in field.get('files',[]):lines.append('ملف: '+file['name']+' | '+str(file['bytes'])+' bytes | SHA256 '+file['sha256'])
            self.remote.setPlainText('\n'.join(lines))
        else:self.remote.setPlainText('لم يتم التقاط نموذج نهائي بموصل متحقق. معاينة المتصفح والتسليم اليدوي متاحان؛ لا يوجد إرسال آلي مفترض.')
    def toPlainText(self):
        p=dict(self.original)
        for k,w in self.fields.items():
            value=w.toPlainText() if isinstance(w,QPlainTextEdit) else w.text()
            if k in ('quote','cost','credits'):value=float(value) if value.strip() else (0 if k in ('cost','credits') else None)
            if k in ('duration','expires','quote_currency') and value=='':value=None
            # Keep absent optional fields absent until the user enters a value.
            if k in self.original or value not in ('',None,0):p[k]=value
        p['action']=self.action.currentData()
        if 'quote_unit' in self.original or self.unit.currentData():p['quote_unit']=self.unit.currentData()
        if 'eligibility' in self.original or p['action']=='application':p['eligibility']=self.eligibility.currentData()
        p['attachments']=[self.files.item(i).text() for i in range(self.files.count())]
        for key,w in [('resume',self.resume),('cover_letter_file',self.cover_file)]:
            if key in self.original or w.currentData():p[key]=w.currentData()
        p['answers']={self.answers.item(i,0).text():self.answers.item(i,1).text()
                      for i in range(self.answers.rowCount()) if self.answers.item(i,0) and self.answers.item(i,1)}
        p['unknown_questions']=[q.strip() for q in self.unknown.toPlainText().splitlines() if q.strip()]
        if 'asset_reviewed' in self.original or self.asset_reviewed.isChecked():p['asset_reviewed']=self.asset_reviewed.isChecked()
        return json.dumps(p,ensure_ascii=False)
    def setPlaceholderText(self,text):pass

class ProfileEditor(QWidget):
    def __init__(self):
        super().__init__();self.original={};self.fields={};self.confirmations={};form=QFormLayout(self)
        for key,label in [('full_name','الاسم المعتمد'),('email','البريد'),('phone','الهاتف'),('city','المدينة'),('country','الدولة'),('linkedin','LinkedIn')]:
            self.fields[key]=QLineEdit();form.addRow(label,self.fields[key])
        self.notes=QPlainTextEdit();self.notes.setReadOnly(True);form.addRow('البيانات المرجعية والمعلومات التي لم تتحدد',self.notes)
    def setPlainText(self,text):
        self.original=json.loads(text)
        for k,w in self.fields.items():w.setText(self.original['identity'].get(k,''))
        unknowns=self.original.get('unknowns',[])
        if self.confirmations.get('same_person_all_names'):
            unknowns=[q for q in unknowns if 'alternate-name' not in q]
        if self.confirmations.get('supplied_records_confirmed_by_user'):
            unknowns=[q for q in unknowns if 'IdeaSpace title chronology' not in q]
        self.notes.setPlainText('\n'.join(unknowns))
    def toPlainText(self):
        p=json.loads(json.dumps(self.original))
        p['identity'].update({k:w.text().strip() for k,w in self.fields.items()})
        return json.dumps(p,ensure_ascii=False)
