"""Read-only JSON-LD detail import; no inferred success for unsupported sources."""
import json
import re
import threading
import urllib.error
import urllib.request
from html import unescape
from html.parser import HTMLParser
from .safety import safe_url

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.inside=False; self.blocks=[]; self.current=''
    def handle_starttag(self,tag,attrs):
        if tag=='script' and dict(attrs).get('type','').lower()=='application/ld+json':
            self.inside=True; self.current=''
    def handle_data(self,data):
        if self.inside: self.current+=data
    def handle_endtag(self,tag):
        if tag=='script' and self.inside:
            self.blocks.append(self.current); self.inside=False

def flatten(node):
    if isinstance(node,list):
        for v in node: yield from flatten(v)
    elif isinstance(node,dict):
        yield node
        if '@graph' in node: yield from flatten(node['@graph'])

def parse_detail(html,url):
    parser=Page(); parser.feed(html); jobs=[]; invalid=0
    for block in parser.blocks:
        try: nodes=list(flatten(json.loads(block)))
        except ValueError: invalid+=1; continue
        for n in nodes:
            typ=n.get('@type',[])
            if 'JobPosting' not in (typ if isinstance(typ,list) else [typ]): continue
            org=n.get('hiringOrganization') or {}; org=org if isinstance(org,dict) else {}
            salary=n.get('baseSalary') or {}; salary=salary if isinstance(salary,dict) else {}
            value=salary.get('value') or {}; value=value if isinstance(value,dict) else {}
            places=n.get('jobLocation') or []; places=places if isinstance(places,list) else [places]
            location=[]
            for p in places:
                if isinstance(p,dict):
                    a=p.get('address') or {}
                    location.append(' '.join(str(a.get(k,'')) for k in ('addressLocality','addressRegion','addressCountry')) if isinstance(a,dict) else str(a))
            jobs.append({'url':safe_url(n.get('url') or url),'title':n.get('title',''),
                         'company':org.get('name',''),'description':unescape(re.sub('<[^>]+>',' ',n.get('description',''))),
                         'location':'; '.join(location),'remote':n.get('jobLocationType')=='TELECOMMUTE',
                         'posted':n.get('datePosted'),'expires':n.get('validThrough'),
                         'currency':salary.get('currency'),'pay_unit':str(value.get('unitText','')).lower(),
                         'pay_min':value.get('minValue',value.get('value')),'pay_max':value.get('maxValue',value.get('value')),
                         'eligibility':'unknown','source':'jsonld-detail-v1'})
    if jobs: return {'status':'ok','jobs':jobs}
    return {'status':'parser_error' if invalid else 'manual_required','jobs':[],
            'reason':'لا يوجد إعلان JobPosting قابل للاستخراج؛ الاستيراد اليدوي متاح'}

class Redirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        safe_url(newurl)
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def fetch_detail(url,cancel=None):
    if cancel and cancel.is_set(): return {'status':'cancelled','jobs':[]}
    try:
        req=urllib.request.Request(safe_url(url),headers={'User-Agent':'AhmedHatemJobs/0.1 (manual job detail import)'})
        with urllib.request.build_opener(Redirects()).open(req,timeout=20) as response:
            data=response.read(3*1024*1024+1)
            if len(data)>3*1024*1024: return {'status':'parser_error','jobs':[],'reason':'صفحة أكبر من الحد'}
            result=parse_detail(data.decode('utf-8',errors='replace'),response.url)
        if cancel and cancel.is_set(): return {'status':'cancelled','jobs':[]}
        return result
    except urllib.error.HTTPError as e:
        return {'status':'blocked' if e.code in (401,403,429) else 'failed','jobs':[],'reason':f'HTTP {e.code}'}
    except urllib.error.URLError as e:
        blocked='403' in str(e.reason) or '407' in str(e.reason)
        return {'status':'blocked' if blocked else 'failed','jobs':[],'reason':'رفض الوكيل الاتصال' if blocked else type(e.reason).__name__}
    except (OSError,ValueError) as e:
        return {'status':'failed','jobs':[],'reason':type(e).__name__}
