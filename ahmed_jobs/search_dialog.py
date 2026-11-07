from PySide6.QtWidgets import (QDialog,QVBoxLayout,QHBoxLayout,QFormLayout,QCheckBox,
    QPlainTextEdit,QSpinBox,QLabel,QLineEdit,QDialogButtonBox)
from .search import SOURCES

class SearchDialog(QDialog):
    def __init__(self,config,parent=None):
        super().__init__(parent);self.setWindowTitle('البحث عن فرص — جمع فقط دون تقديم');self.resize(800,700)
        layout=QVBoxLayout(self);layout.addWidget(QLabel('اختر المصادر والكلمات. فشل مصدر لا يوقف المصادر الأخرى.\nالكلمات في أسطر مستقلة، والحدود التالية تخص جمع النتائج فقط.'))
        self.sources={};row=None
        for n,(key,label) in enumerate(SOURCES.items()):
            if n%2==0:row=QHBoxLayout();layout.addLayout(row)
            w=QCheckBox(label);w.setChecked(key in config.get('sources',[]));row.addWidget(w);self.sources[key]=w
        self.queries=QPlainTextEdit();self.queries.setPlainText('\n'.join(config.get('queries',[])));layout.addWidget(self.queries)
        form=QFormLayout();layout.addLayout(form)
        self.size=QSpinBox();self.size.setRange(1,100);self.size.setValue(config.get('page_size',20));form.addRow('النتائج في الصفحة',self.size)
        self.pages=QSpinBox();self.pages.setRange(1,10);self.pages.setValue(config.get('max_pages',1));form.addRow('الصفحات لكل بحث',self.pages)
        self.company=QLineEdit(config.get('workable_company',''));form.addRow('معرف الشركة في Workable عند اختياره',self.company)
        buttons=QDialogButtonBox(QDialogButtonBox.Ok|QDialogButtonBox.Cancel);buttons.accepted.connect(self.accept);buttons.rejected.connect(self.reject);layout.addWidget(buttons)
    def config(self):
        return {'sources':[k for k,w in self.sources.items() if w.isChecked()],
                'queries':[q.strip() for q in self.queries.toPlainText().splitlines() if q.strip()],
                'page_size':self.size.value(),'max_pages':self.pages.value(),'workable_company':self.company.text().strip()}
