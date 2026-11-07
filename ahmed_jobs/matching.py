import re
import unicodedata
from datetime import date,datetime,timezone

def is_expired(value):
    if not value:return False
    if 'T' in value:
        parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
        if parsed.tzinfo is not None:return parsed<datetime.now(timezone.utc)
    return date.fromisoformat(value[:10])<datetime.now(timezone.utc).date()

def normalize(text):
    text = ''.join(c for c in unicodedata.normalize('NFKD', text.lower()) if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', text.translate(str.maketrans('أإآىة', 'ااايه'))).strip()

def phrase(text, word):
    return bool(re.search(r'(?<!\w)' + re.escape(normalize(word)) + r'(?!\w)', normalize(text)))

def assess(job, tracks, settings=None):
    settings = settings or {}
    minimum = max(5,float(settings.get('minimum_hourly_usd', 5)))
    text = job.get('title','') + '\n' + job.get('description','')
    matched = []
    for track in tracks:
        words = [w for w in track.get('keywords_en',[]) + track.get('keywords_ar',[]) if phrase(text,w)]
        if words:
            matched.append({'track':track['id'], 'name':track['name'], 'words':words,
                            'score':len(words)*float(settings.get('weights',{}).get(track['id'],10))})
    reasons, blocked = [], False
    if is_expired(job.get('expires')):
        blocked = True; reasons.append('الفرصة منتهية')
    currency, unit = job.get('currency'), job.get('pay_unit')
    high = job.get('pay_max')
    if currency == 'USD' and unit == 'hour' and high is not None:
        if float(high) < minimum:
            blocked = True; reasons.append('أقصى أجر أقل من الحد الأدنى')
        else:
            reasons.append('الأجر قابل للمراجعة؛ العرض لا يقل عن الحد الأدنى')
    else:
        reasons.append('الأجر يحتاج مراجعة؛ لا تحويل أو تقدير ساعات تلقائي')
    eligibility = job.get('eligibility', 'unknown')
    location = normalize(job.get('location','')+' '+job.get('description',''))
    if re.search(r'\b(us|usa|united states)[ -](only|residents only)\b|must (?:reside|be based) in (?:the )?(?:us|united states)\b',location):
        eligibility = 'ineligible'
    if eligibility == 'ineligible':
        blocked = True; reasons.append('قيد الإقامة يمنع التقديم من مصر')
    elif eligibility != 'eligible':
        reasons.append('أهلية العمل من مصر غير مؤكدة')
    if any(phrase(text,w) for w in settings.get('excluded_phrases',[])):
        blocked=True; reasons.append('استبعاد بإعدادات المستخدم')
    if re.search(r'\b(senior|lead|principal)\s+(data scientist|data analyst)\b', normalize(job.get('title',''))):
        reasons.append('مستوى متقدم: البورتفليو وحده لا يثبت الخبرة المطلوبة')
    breakdown=[{'kind':'role_skills','score':sum(m['score'] for m in matched),'reason':'الكلمات والعبارات المطابقة'}]
    if eligibility=='eligible':breakdown.append({'kind':'location','score':float(settings.get('weights',{}).get('location',5)),'reason':'أهلية الموقع مؤكدة للفرصة'})
    if currency=='USD' and unit=='hour' and high is not None and float(high)>=minimum:
        breakdown.append({'kind':'pay','score':float(settings.get('weights',{}).get('pay',5)),'reason':'الأجر المعلن يتضمن الحد الأدنى'})
    posted=job.get('posted')
    if posted:
        try:
            age=(datetime.now(timezone.utc).date()-date.fromisoformat(posted[:10])).days
            if 0<=age<=7:breakdown.append({'kind':'freshness','score':float(settings.get('weights',{}).get('freshness',5)),'reason':'إعلان مؤرخ خلال آخر سبعة أيام'})
        except (ValueError,TypeError):reasons.append('تاريخ الإعلان غير قابل للتحقق')
    return {'status':'filtered' if blocked else 'needs_review','matches':matched,'breakdown':breakdown,
            'score':sum(m['score'] for m in breakdown),'eligibility':eligibility,'reasons':reasons}
