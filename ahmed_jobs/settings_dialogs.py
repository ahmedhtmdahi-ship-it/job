from PySide6.QtWidgets import (QDialog,QVBoxLayout,QFormLayout,QCheckBox,QSpinBox,QPlainTextEdit,
    QDialogButtonBox,QTableWidget,QTableWidgetItem,QLabel)
from .safety import safe_url

class SourcesDialog(QDialog):
    def __init__(self,platforms,parent=None):
        super().__init__(parent);self.platforms=platforms;self.setWindowTitle('روابط المواقع والحسابات — لا كلمات سر');self.resize(1000,650)
        layout=QVBoxLayout(self);layout.addWidget(QLabel('أدخل الروابط الناقصة هنا. لا يُفترض تسجيل الدخول؛ يتم داخل المتصفح بيدك.'))
        self.table=QTableWidget(len(platforms),3);self.table.setHorizontalHeaderLabels(['الموقع','رابط الموقع / الوظائف','رابط حسابك إن وجد']);layout.addWidget(self.table)
        from PySide6.QtCore import Qt
        for n,p in enumerate(platforms):
            item=QTableWidgetItem(p['name']);item.setFlags(item.flags() & ~Qt.ItemIsEditable);self.table.setItem(n,0,item)
            self.table.setItem(n,1,QTableWidgetItem(p.get('candidate_base_url') or ''))
            self.table.setItem(n,2,QTableWidgetItem(p.get('profile_url') or ''))
        self.table.resizeColumnsToContents();self.table.horizontalHeader().setStretchLastSection(True)
        buttons=QDialogButtonBox(QDialogButtonBox.Ok|QDialogButtonBox.Cancel);layout.addWidget(buttons);buttons.accepted.connect(self.accept);buttons.rejected.connect(self.reject)
    def value(self):
        result=[]
        for n,original in enumerate(self.platforms):
            p=dict(original)
            for col,key in [(1,'candidate_base_url'),(2,'profile_url')]:
                value=self.table.item(n,col).text().strip();p[key]=safe_url(value) if value else None
            result.append(p)
        return result

class ScheduleDialog(QDialog):
    def __init__(self,config,parent=None):
        super().__init__(parent);self.original=config;self.setWindowTitle('الجدولة المحلية — بحث وقراءة فقط');self.resize(700,550)
        layout=QVBoxLayout(self);layout.addWidget(QLabel('تعمل فقط والبرنامج مفتوح والجهاز يعمل ومتصل بالإنترنت. لا يوجد إرسال أو نشر مجدول.'))
        self.enabled=QCheckBox('تفعيل الجدولة');self.enabled.setChecked(config.get('enabled',False));layout.addWidget(self.enabled)
        self.search=QCheckBox('تشغيل البحث متعدد المصادر بالإعدادات المحفوظة');self.search.setChecked(config.get('include_search',False));layout.addWidget(self.search)
        form=QFormLayout();layout.addLayout(form);self.minutes=QSpinBox();self.minutes.setRange(1,10080);self.minutes.setValue(config.get('minutes',60));form.addRow('الفاصل بالدقائق',self.minutes)
        self.urls=QPlainTextEdit();self.urls.setPlainText('\n'.join(config.get('urls',[])));form.addRow('روابط إعلانات — رابط في كل سطر',self.urls)
        buttons=QDialogButtonBox(QDialogButtonBox.Ok|QDialogButtonBox.Cancel);layout.addWidget(buttons);buttons.accepted.connect(self.accept);buttons.rejected.connect(self.reject)
    def value(self):
        urls=[safe_url(u.strip()) for u in self.urls.toPlainText().splitlines() if u.strip()]
        return {**self.original,'enabled':self.enabled.isChecked(),'include_search':self.search.isChecked(),'minutes':self.minutes.value(),'urls':urls,'cursor':0}
