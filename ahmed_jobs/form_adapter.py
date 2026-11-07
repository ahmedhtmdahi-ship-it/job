"""Exact-payload final form review and submission for explicitly configured forms.

Unverified live platforms stay manual_required. This module is exercised against
local browser fixtures; importing a file cannot grant live-adapter trust.
"""
from dataclasses import dataclass
import hashlib
import json
import re
import time
from urllib.parse import urlsplit,urlunsplit,parse_qsl,urlencode
from .storage import packed
from .safety import safe_url
from .safety import sha256
from collections import Counter

class FormBlocked(ValueError):
    def __init__(self,state,reason):self.state=state;super().__init__(reason)

@dataclass(frozen=True)
class FormSpec:
    key:str
    version:str
    host:str
    form_selector:str
    submit_selector:str
    receipt_selector:str
    receipt_pattern:str
    receipt_url_pattern:str
    free_submission_verified:bool=False
    live_verified:bool=False

    def validate(self):
        if not self.key or not self.version or not self.host:raise FormBlocked('needs_setup','إعداد الموصل غير مكتمل')
        if not self.receipt_selector or not self.receipt_pattern or not self.receipt_url_pattern:
            raise FormBlocked('manual_required','يلزم تعريف إيصال خاص بالموقع؛ عبارات الشكر لا تكفي')
        for pattern in (self.receipt_pattern,self.receipt_url_pattern):re.compile(pattern)

def public_url(url):
    p=urlsplit(safe_url(url));secret=re.compile(r'token|secret|password|csrf|session|authorization|^code$|^state$',re.I)
    pairs=[(k,v) for k,v in parse_qsl(p.query,keep_blank_values=True) if not secret.search(k)]
    return urlunsplit((p.scheme,p.netloc,p.path,urlencode(pairs),''))

def capture(page,spec,*,fixture=False,inspection=False):
    """Capture visible values and actual browser file hashes; never hidden tokens."""
    if fixture and not (spec.host.endswith('.invalid') or spec.host in ('localhost','127.0.0.1')):
        raise FormBlocked('manual_required','وضع الاختبار محصور في نطاقات اختبار محلية؛ لا يعمل على مواقع حقيقية')
    if not inspection:spec.validate()
    if not fixture and not inspection and not spec.live_verified:raise FormBlocked('manual_required','هذا الموصل لم يجتز تحققًا حيًا بعد')
    if urlsplit(safe_url(page.url)).hostname!=spec.host:raise FormBlocked('manual_required','تغير نطاق الوجهة')
    from .browser import security_pending
    if security_pending(page):
        raise FormBlocked('needs_security','يلزم إكمال التحقق الأمني يدويًا ثم إعادة المعاينة')
    form=page.locator(spec.form_selector)
    if form.count()!=1 or not form.is_visible():raise FormBlocked('manual_required','النموذج غير موجود أو ملتبس')
    result=form.evaluate('''async form => {
      const visible = e => !!(e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
      const fields=[];
      for (const e of form.querySelectorAll('input,textarea,select,[role="combobox"]')) {
        const type=(e.type||'').toLowerCase();
        if (!visible(e) || e.disabled || ['hidden','submit','button','reset'].includes(type)) continue;
        if (type==='password') { fields.push({name:e.name||e.id,type:'password',required:!!e.required}); continue; }
        const files=[];
        if (type==='file') for (const f of e.files) {
          const hash=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());
          files.push({name:f.name,bytes:f.size,sha256:Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')});
        }
        fields.push({name:e.name||e.id||'',label:Array.from(e.labels||[]).map(x=>x.innerText).join(' '),
          type:type||e.tagName.toLowerCase(),required:!!e.required,
          value:type==='file'?'':(e.value||''),checked:['checkbox','radio'].includes(type)?e.checked:null,
          files,custom:e.getAttribute('role')==='combobox'});
      }
      return {action:form.action,method:form.method.toLowerCase(),fields};
    }''')
    action=safe_url(result['action'])
    if urlsplit(action).hostname!=spec.host:raise FormBlocked('manual_required','وجهة النموذج تقع خارج نطاق الموصل')
    if result['method']!='post' and not inspection:raise FormBlocked('manual_required','طريقة الإرسال غير متحقق منها')
    if any(f['type']=='password' for f in result['fields']):raise FormBlocked('needs_login','أكمل تسجيل الدخول بنفسك')
    unknown=[]
    for f in result['fields']:
        radio_missing=f['type']=='radio' and not any(x.get('checked') and x['type']=='radio' and x['name']==f['name'] for x in result['fields'])
        if f.get('required') and ((f['type']=='file' and not f['files']) or (f['type']=='checkbox' and not f['checked']) or radio_missing or (f['type'] not in ('checkbox','radio','file') and not f.get('value'))):
            unknown.append(f.get('label') or f['name'] or 'حقل مطلوب')
        if f.get('custom'):unknown.append(f.get('label') or f['name'] or 'حقل مخصص')
    if unknown and not inspection:raise FormBlocked('needs_answers','حقول تتطلب إجابة أو موافقة صريحة: '+', '.join(unknown))
    body=page.locator('body').inner_text()
    # Never treat owned credits as free; an unverified zero cost also blocks execution.
    paid=bool(re.search(r'\b(?:costs?|requires?|use|spend)\s*[:=]?\s*[1-9]\d*\s*(?:connects?|credits?)\b|\b[1-9]\d*\s+connects?\s+(?:required|to apply)\b',body,re.I))
    if paid and not inspection:
        raise FormBlocked('payment_required','الصفحة تعلن تكلفة أرصدة؛ الميزانية صفر')
    if not spec.free_submission_verified and not inspection:raise FormBlocked('payment_required','تكلفة العملية لم يُتحقق أنها صفر')
    return {'adapter':spec.key,'adapter_version':spec.version,'page_url':public_url(page.url),
            'page_url_digest':hashlib.sha256(page.url.encode()).hexdigest(),'action':public_url(action),
            'action_digest':hashlib.sha256(action.encode()).hexdigest(),'method':result['method'],'fields':result['fields'],
            'cost':0 if spec.free_submission_verified else None,'credits':0 if spec.free_submission_verified else None,
            'inspection_only':inspection,'missing_questions':unknown,'payment_detected':paid}

def check_attachments(store,draft,snapshot):
    p=draft['payload']
    chosen=Counter(sha256(path) for path in p.get('attachments',[]))
    actual=Counter(f['sha256'] for field in snapshot['fields'] for f in field.get('files',[]))
    if chosen!=actual:
        store.save_draft(p,draft['opportunity_id'],draft['id'])
        raise FormBlocked('needs_asset_review','مرفقات النموذج الفعلية تختلف عن الملفات المختارة في الطلب')

def stage_review(store,draft_id,snapshot):
    if snapshot.get('inspection_only'):raise FormBlocked('manual_required','المعاينة العامة لا تمنح صلاحية إرسال آلي')
    d=store.draft(draft_id);p=d['payload'];check_attachments(store,d,snapshot)
    p['remote_snapshot']=snapshot;p['adapter_version']=snapshot['adapter_version'];p['adapter_key']=snapshot['adapter']
    store.save_draft(p,d['opportunity_id'],draft_id)
    store.event('final_form_review_required',{'draft':draft_id,'adapter':snapshot['adapter']})
    return store.draft(draft_id)

def execute_reviewed(page,store,draft_id,spec,*,fixture=False,receipt_timeout_ms=10000):
    """No approval creation here. Journal first; any click ambiguity is uncertain."""
    current=capture(page,spec,fixture=fixture);d=store.draft(draft_id)
    check_attachments(store,d,current)
    if not fixture and not spec.live_verified:raise FormBlocked('manual_required','موصل غير متحقق حيًا')
    if current!=d['payload'].get('remote_snapshot'):
        stage_review(store,draft_id,current)
        raise FormBlocked('needs_review','تغير النموذج بعد المراجعة؛ الموافقة السابقة أُبطلت')
    button=page.locator(spec.form_selector).locator(spec.submit_selector)
    if button.count()!=1 or not button.is_visible() or not button.is_enabled():
        raise FormBlocked('manual_required','زر الإرسال النهائي غير متحقق منه')
    previous_receipt=page.locator(spec.receipt_selector)
    if previous_receipt.count()==1 and previous_receipt.is_visible() and re.fullmatch(spec.receipt_pattern,previous_receipt.inner_text().strip()):
        raise FormBlocked('manual_required','إيصال سابق ظاهر بالفعل؛ راجع سجل الطلبات قبل محاولة جديدة')
    aid=store.begin_attempt(draft_id)
    try:
        button.click(timeout=10000)
        deadline=time.monotonic()+max(0,receipt_timeout_ms)/1000
        while True:
            if urlsplit(page.url).hostname==spec.host and re.search(spec.receipt_url_pattern,page.url):
                receipt=page.locator(spec.receipt_selector)
                if receipt.count()==1 and receipt.is_visible():
                    match=re.fullmatch(spec.receipt_pattern,receipt.inner_text().strip())
                    if match and re.search(r'\d',match[0]) and not re.search(r'thank|شكر',match[0],re.I):
                        evidence={'adapter':spec.key,'adapter_version':spec.version,'receipt_id':match[0],
                                  'receipt_url':public_url(page.url),'verification':'site-specific adapter receipt'}
                        store.finish_attempt(aid,'submitted',evidence)
                        return {'state':'submitted','attempt':aid,'evidence':evidence}
            if time.monotonic()>=deadline:break
            page.wait_for_timeout(100)
    except Exception:
        # Once the click can have occurred, a timeout/disconnect cannot safely be retried.
        store.finish_attempt(aid,'uncertain',{'reason':'click or receipt verification interrupted'})
        return {'state':'uncertain','attempt':aid}
    store.finish_attempt(aid,'uncertain',{'reason':'no site-specific receipt before timeout'})
    return {'state':'uncertain','attempt':aid}
