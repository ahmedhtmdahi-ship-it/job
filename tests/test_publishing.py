import csv
import pytest
from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QImage
from ahmed_jobs.publishing import Limits,validate_assets,resize_preview,suggest_projects
from ahmed_jobs.storage import Store
from ahmed_jobs.config import seed
from ahmed_jobs.documents import proposal

def test_image_limits_and_new_preview_preserve_original(tmp_path):
    app=QApplication.instance() or QApplication([])
    image=QImage(640,480,QImage.Format_RGB32);image.fill(0xffabcdef)
    src=tmp_path/'source.png';image.save(str(src));before=src.read_bytes()
    dest=tmp_path/'preview.png';resize_preview(src,dest,320,240)
    assert src.read_bytes()==before and QImage(str(dest)).size().width()==320
    limits=Limits(80,500,3,1024*1024,('.png',),600,400)
    assert validate_assets({'title':'Project','text':'Case study','attachments':[str(src)]},limits)['valid']
    assert not validate_assets({'title':'Project','attachments':[str(dest)]},limits)['valid']
    with pytest.raises(ValueError):resize_preview(src,src,100,100)

def test_deterministic_templates_and_no_unknown_placeholder():
    profile=seed('applicant_profile')
    job={'title':'legal assistant','company':'Example'}
    text=proposal(job,profile,'en')
    assert 'Bachelor of Laws' in text and 'unlimited' not in text.lower()
    assert proposal(job,profile,'en')==text
    with pytest.raises(ValueError):proposal(job,profile,'en',templates={'en':'{name.__class__}'})
    ranked=suggest_projects({'title':'Excel sales CRM dashboard'},seed('portfolio_catalog'))
    assert ranked and all('عميل مدفوع' in p['reason'] for p in ranked)

def test_export_csv_protects_excel_formulas(tmp_path):
    s=Store(tmp_path/'data');s.add_job({'title':'=HYPERLINK("https://evil.org")','url':'https://example.org/job'})
    out=tmp_path/'jobs.csv';s.export_jobs(out)
    with out.open(encoding='utf-8-sig',newline='') as f:row=next(csv.DictReader(f))
    assert row['title'].startswith("'=") and row['url']=='https://example.org/job'
    s.close()
