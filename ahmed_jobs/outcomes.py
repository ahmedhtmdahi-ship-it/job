"""Manual handoff journaling and user-verified receipts, not fake auto-success."""
from urllib.parse import urlsplit
import re
from .safety import safe_url
from .storage import now,packed

def receipt_evidence(destination,receipt_id,receipt_url,confirmed):
    if not confirmed:raise ValueError('يلزم تأكيد أنك راجعت إيصالًا خاصًا بالطلب')
    reference=receipt_id.strip()
    if len(reference)<3 or len(reference)>160 or re.search(r'thank.?you|success|شكرا|شكرًا',reference,re.I):
        raise ValueError('أدخل رقم طلب أو مرجع إيصال حقيقي؛ عبارة شكر عامة لا تكفي')
    url=safe_url(receipt_url)
    if urlsplit(url).hostname!=urlsplit(destination).hostname:
        raise ValueError('رابط الإيصال يجب أن يخص نطاق الوجهة نفسها')
    return {'adapter':'manual-user-reviewed-v1','receipt_id':reference,'receipt_url':url,
            'reviewed_by_user':True,'verification':'user reviewed site-specific receipt; not automatically verified','confirmed_at':now()}

def reconcile(store,attempt_id,outcome,receipt=None,confirmed_no_submission=False):
    row=store.db.execute('SELECT * FROM attempts WHERE id=?',(attempt_id,)).fetchone()
    if not row or row['state'] not in ('uncertain','submitting'):raise ValueError('هذه المحاولة ليست معلقة للمصالحة')
    d=store.draft(row['draft_id'])
    if outcome=='submitted':
        evidence=receipt_evidence(d['payload']['destination'],receipt['receipt_id'],receipt['receipt_url'],receipt.get('confirmed',False))
        state='submitted'
    elif outcome=='not_submitted':
        if not confirmed_no_submission:raise ValueError('راجع سجل الموقع وتأكد من عدم وجود الطلب أولًا')
        state='failed';evidence={'verification':'user checked platform history and confirms no submission','confirmed_at':now()}
    else:raise ValueError('اختر نتيجة مؤكدة؛ النتيجة المجهولة تظل uncertain')
    with store.db:
        store.db.execute('UPDATE attempts SET state=?,evidence=? WHERE id=?',(state,packed(evidence),attempt_id))
        store.db.execute('UPDATE drafts SET state=?,approval=NULL WHERE id=?',(state,d['id']))
    store.event('manual_reconciliation',{'attempt':attempt_id,'state':state,'verification':'user-confirmed'})
    return state
