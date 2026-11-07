"""Public read-only discovery. No account, bid, credits or submission endpoints."""
import json
import urllib.request
import urllib.error
from urllib.parse import urlencode

ENDPOINT='https://www.freelancer.com/api/projects/0.1/projects/active/'

def parse_projects(data):
    if data.get('status')!='success' or not isinstance(data.get('result',{}).get('projects'),list):
        return {'status':'parser_error','jobs':[],'reason':'بنية استجابة غير متوقعة'}
    result=[]
    for p in data['result']['projects']:
        if not p.get('seo_url') or not p.get('title'):continue
        currency=p.get('currency') or {}; budget=p.get('budget') or {}
        result.append({'title':p['title'],'url':'https://www.freelancer.com/projects/'+p['seo_url'],
                       'company':str(p.get('owner_id','')),'description':p.get('description') or p.get('preview_description',''),
                       'pay_min':budget.get('minimum'),'pay_max':budget.get('maximum'),
                       'currency':currency.get('code'),'pay_unit':'hour' if p.get('type')=='hourly' else 'fixed',
                       'location':'','eligibility':'unknown','source':'freelancer-public-api-v1',
                       'platform_job_id':str(p['id'])})
    if data['result']['projects'] and not result:return {'status':'parser_error','jobs':[],'reason':'حقول الإعلان المطلوبة ناقصة'}
    return {'status':'ok','jobs':result,'total':data['result'].get('total_count')}

def discover(query,offset=0,limit=20,cancel=None):
    if cancel and cancel.is_set():return {'status':'cancelled','jobs':[]}
    limit=max(1,min(int(limit),100)); offset=max(0,int(offset))
    url=ENDPOINT+'?'+urlencode({'query':query,'limit':limit,'offset':offset,'full_description':'true','compact':'false'})
    try:
        request=urllib.request.Request(url,headers={'User-Agent':'AhmedHatemJobs/0.1','Accept':'application/json'})
        with urllib.request.urlopen(request,timeout=20) as response:
            body=response.read(8*1024*1024+1)
            if len(body)>8*1024*1024:return {'status':'parser_error','jobs':[],'reason':'استجابة أكبر من الحد'}
            result=parse_projects(json.loads(body))
        if cancel and cancel.is_set():return {'status':'cancelled','jobs':[]}
        result['next_cursor']=offset+len(result['jobs']) if len(result['jobs'])==limit else None
        return result
    except urllib.error.HTTPError as e:
        return {'status':'blocked' if e.code in (401,403,429,470) else 'failed','jobs':[],'reason':f'HTTP {e.code}'}
    except urllib.error.URLError as e:
        blocked='403' in str(e.reason) or '407' in str(e.reason)
        return {'status':'blocked' if blocked else 'failed','jobs':[],'reason':'رفض الوكيل الاتصال' if blocked else type(e.reason).__name__}
    except (OSError,ValueError) as e:return {'status':'failed','jobs':[],'reason':type(e).__name__}
