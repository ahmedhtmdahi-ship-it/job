"""Scheduled read-only detail refresh. There is no scheduled submit path."""
import threading
from .storage import Store,packed
from .discovery import fetch_detail

def refresh_saved_urls(root,cancel=None):
    cancel=cancel or threading.Event()
    store=Store(root)
    try:
        settings=store.get('schedule'); urls=settings.get('urls',[])
        cursor=min(settings.get('cursor',0),len(urls)); results=[]
        for index in range(cursor,len(urls)):
            if cancel.is_set():break
            result=fetch_detail(urls[index],cancel)
            if result['status']=='cancelled':break
            for j in result.get('jobs',[]):store.add_job(j)
            store.event('scheduled_detail',{'url':urls[index],'status':result['status'],'reason':result.get('reason'),'jobs':len(result.get('jobs',[]))})
            settings['cursor']=index+1;store.put('schedule',settings);results.append(result)
        if settings.get('cursor',0)==len(urls):
            settings['cursor']=0;store.put('schedule',settings)
        if settings.get('include_search') and not cancel.is_set():
            from .search import run_search,install_schema
            install_schema(store)
            cfg=store.get('search_config')
            if cfg:
                run_id=settings.get('search_run_id')
                row=store.db.execute('SELECT config,status FROM search_runs WHERE id=?',(run_id,)).fetchone() if run_id else None
                if not row or row['status'] not in ('paused','running') or row['config']!=packed(cfg):run_id=None
                result=run_search(root,cfg,run_id,cancel)
                settings['search_run_id']=result['run_id'] if result['status']=='paused' else None
                store.put('schedule',settings);results.append(result)
            else:store.event('scheduled_search',{'status':'needs_setup','reason':'احفظ إعدادات البحث متعدد المصادر أولًا'})
        return results
    finally:store.close()
