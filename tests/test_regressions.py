import zipfile
from pathlib import Path
import pytest
from ahmed_jobs.storage import Store
from ahmed_jobs.documents import corrected_cv,text
from ahmed_jobs.safety import sha256

def test_filter_edit_reassessment_never_embeds_duplicate_id(tmp_path):
    s=Store(tmp_path)
    s.add_job({'title':'Excel','url':'https://example.org/a'})
    s.put('filters',{'minimum_hourly_usd':5,'excluded_phrases':[]})
    for j in s.jobs():s.add_job(j)
    assert len(s.jobs())==1 and s.jobs()[0]['title']=='Excel'
    s.close()

def test_profile_edit_cannot_unlock_submitted_or_uncertain(tmp_path):
    s=Store(tmp_path)
    p={'destination':'https://example.org/a','text':'Application','action':'application','eligibility':'eligible','cost':0,'credits':0}
    did=s.save_draft(p);s.approve(did);s.begin_attempt(did);s.recover()
    s.put('profile',s.get('profile'))
    assert s.draft(did)['state']=='uncertain'
    with pytest.raises(ValueError):s.save_draft(p,draft_id=did)
    s.close()

def test_new_search_does_not_erase_full_description_and_flags_cross_site_duplicate(tmp_path):
    s=Store(tmp_path)
    a=s.add_job({'title':'Operations coordinator','url':'https://example.org/a','company':'Example','description':'Full details','eligibility':'eligible'})
    s.add_job({'title':'Operations coordinator','url':'https://example.org/a','description':'','eligibility':'unknown','company':'Example'})
    assert s.jobs()[0]['description']=='Full details' and s.jobs()[0]['eligibility']=='eligible'
    b=s.add_job({'title':'Operations coordinator','url':'https://other.org/a','company':'Example'})
    assert len(s.jobs())==2
    assert s.jobs()[0]['assessment']['probable_duplicates'][0]['id']==a
    s.close()

def test_working_cv_split_runs_and_only_ideaspace_end(tmp_path):
    p=tmp_path/'cv.docx';out=tmp_path/'working.docx'
    xml='''<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="urn:example"><w:body>
      <w:p><w:r><w:t>Phone +20 103 </w:t></w:r><w:r><w:t>077 9131</w:t></w:r></w:p>
      <w:p><w:r><w:t>IdeaSpace — Jun 2025 – Pre</w:t></w:r><w:r><w:t>sent</w:t></w:r></w:p>
      <w:p><w:r><w:t>Freelance Nov 2024 – Present</w:t></w:r></w:p></w:body></w:document>'''
    with zipfile.ZipFile(p,'w') as z:z.writestr('word/document.xml',xml)
    before=sha256(p);corrected_cv(p,out)
    result=text(out)
    assert '+201144064593' in result and 'IdeaSpace — Jun 2025 – Oct 2026' in result
    assert 'Freelance Nov 2024 – Present' in result and sha256(p)==before
    with zipfile.ZipFile(out) as z:assert b'xmlns:w14="urn:example"' in z.read('word/document.xml')

def test_platform_id_preserved_when_seo_url_changes(tmp_path):
    s=Store(tmp_path)
    first=s.add_job({'title':'Analyst','url':'https://example.org/old','source':'example','platform_job_id':'123'})
    second=s.add_job({'title':'Analyst updated','url':'https://example.org/new','source':'example','platform_job_id':'123'})
    assert first==second and len(s.jobs())==1
    s.close()

def test_reusable_answers_do_not_cross_country_or_global_rights(tmp_path):
    s=Store(tmp_path);q='Work authorization?'
    s.save_answer(q,'Yes','country','US');s.save_answer(q,'Unsafe global','global','')
    assert s.reusable_answers([q],'https://example.org/apply',country='UK')=={}
    assert s.reusable_answers([q],'https://example.org/apply',country='US')=={q:'Yes'}
    s.save_answer('Notice period?','Two weeks','global','')
    assert s.reusable_answers(['Notice period?'],'https://example.org/apply')=={'Notice period?':'Two weeks'}
    s.close()

def test_restored_file_roles_and_cross_platform_logical_paths(tmp_path):
    from ahmed_jobs.storage import relocate_draft
    p={'attachments':[r'C:\Users\Ahmed\imports\cv.pdf'],'resume':r'C:\Users\Ahmed\imports\cv.pdf',
       'cover_letter_file':r'C:\Users\Ahmed\imports\letter.pdf','candidate_files':[r'C:\Users\Ahmed\imports\project.xlsx']}
    moved=relocate_draft(p,r'C:\Users\Ahmed\imports',tmp_path/'imports')
    assert moved['resume']==moved['attachments'][0]==str(tmp_path/'imports/cv.pdf')
    assert moved['cover_letter_file']==str(tmp_path/'imports/letter.pdf')
    assert moved['candidate_files']==[str(tmp_path/'imports/project.xlsx')]
