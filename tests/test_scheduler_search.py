import threading
from ahmed_jobs.storage import Store
from ahmed_jobs.scheduler import refresh_saved_urls

def test_scheduled_search_is_read_only_and_off_by_default(tmp_path,monkeypatch):
    from ahmed_jobs import search
    s=Store(tmp_path);assert s.get('schedule')['enabled'] is False
    s.put('search_config',{'sources':['remotive'],'queries':['Excel'],'max_pages':1,'page_size':10})
    s.put('schedule',{'enabled':True,'minutes':60,'urls':[],'include_search':True,'cursor':0})
    monkeypatch.setattr(search,'discover',lambda *args:{'status':'ok','jobs':[{'title':'Excel','url':'https://example.org/1'}]})
    result=refresh_saved_urls(tmp_path)
    assert result[0]['status']=='completed' and len(s.jobs())==1
    assert not s.drafts() and s.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0]==0
    s.close()
