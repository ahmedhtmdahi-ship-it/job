"""Bounded HTTPS reads with normal trust, rate limiting and honest failures."""
import json
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from urllib.parse import urlsplit
from .safety import safe_url

@dataclass
class FetchError(Exception):
    status: str
    reason: str

_locks = {}
_last = {}
_guard = threading.Lock()

class Redirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        safe_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def read(url, cancel=None, limit=8*1024*1024, retries=1):
    url = safe_url(url); cancel = cancel or threading.Event()
    host = urlsplit(url).hostname
    with _guard: lock = _locks.setdefault(host, threading.Lock())
    with lock:
        delay = max(0, 1.0 - (time.monotonic() - _last.get(host, 0)))
        if cancel.wait(delay): raise FetchError('cancelled', 'تم إيقاف البحث')
        for attempt in range(retries+1):
            if cancel.is_set(): raise FetchError('cancelled', 'تم إيقاف البحث')
            try:
                req = urllib.request.Request(url, headers={'User-Agent':'AhmedHatemJobs/0.2 (+local personal job search)',
                                                          'Accept':'application/json,text/html;q=0.9'})
                _last[host] = time.monotonic()
                with urllib.request.build_opener(Redirects()).open(req, timeout=20) as response:
                    chunks=[]; size=0
                    while block := response.read(65536):
                        if cancel.is_set(): raise FetchError('cancelled','تم إيقاف البحث')
                        size += len(block)
                        if size > limit: raise FetchError('parser_error','الاستجابة أكبر من حدود القراءة')
                        chunks.append(block)
                    return b''.join(chunks).decode('utf-8',errors='replace')
            except urllib.error.HTTPError as e:
                if e.code in (429, 503) and attempt < retries:
                    try: wait=min(5,max(1,float(e.headers.get('Retry-After',2))))
                    except ValueError: wait=2
                    if cancel.wait(wait):raise FetchError('cancelled','تم إيقاف البحث')
                    continue
                raise FetchError('blocked' if e.code in (401,403,407,429) else 'failed',f'HTTP {e.code}') from None
            except urllib.error.URLError as e:
                denied = '403' in str(e.reason) or '407' in str(e.reason)
                raise FetchError('blocked' if denied else 'failed','رفض وكيل الشبكة الوصول إلى الموقع' if denied else type(e.reason).__name__) from None
            except (OSError,TimeoutError) as e:
                raise FetchError('failed', type(e).__name__) from None

def read_json(url, cancel=None):
    try: return json.loads(read(url,cancel))
    except (ValueError,TypeError): raise FetchError('parser_error','استجابة JSON غير صالحة') from None
