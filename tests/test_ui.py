import os
os.environ.setdefault('QT_QPA_PLATFORM','offscreen')
from PySide6.QtWidgets import QApplication
from ahmed_jobs.ui import Window

def test_desktop_import_review_and_persistence(tmp_path):
    app=QApplication.instance() or QApplication([])
    w=Window(tmp_path/'عربي')
    assert w.tabs.count()==10 and w.platforms.rowCount()==24
    w.store.add_job({'title':'legal assistant','url':'https://example.org/jobs/1','description':'document preparation'})
    w.refresh();w.tabs.setCurrentIndex(2);w.jobtable.setCurrentCell(0,0);w.make_draft()
    assert len(w.store.drafts())==1
    w.store.confirm_identity();w.close()
    reopened=Window(tmp_path/'عربي')
    assert len(reopened.jobs)==1 and len(reopened.drafts)==1
    assert reopened.store.get('confirmations')['same_person_all_names']
    reopened.close()

def test_review_editor_roundtrip_and_template(tmp_path):
    import json
    app=QApplication.instance() or QApplication([])
    w=Window(tmp_path/'data')
    w.store.add_job({'title':'Excel dashboard','url':'https://example.org/a','eligibility':'eligible'})
    w.refresh();w.tabs.setCurrentIndex(2);w.jobtable.setCurrentCell(0,0);w.make_draft()
    w.drafttable.setCurrentCell(0,0);w.select_draft()
    p=json.loads(w.editor.toPlainText())
    assert p==w.selected_draft()['payload']
    w.set_template('en');assert 'Dear' in json.loads(w.editor.toPlainText())['text']
    w.save_selected();assert w.store.drafts()[0]['state']=='needs_review'
    w.close()
