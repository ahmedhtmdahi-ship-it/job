"""Local publication preparation with per-field/file validation and no uploads."""
from dataclasses import dataclass,asdict
from pathlib import Path
import re
from .matching import normalize
from .safety import sha256

@dataclass
class Limits:
    title_max: int
    description_max: int
    max_files: int
    file_bytes: int
    extensions: tuple
    image_min_width: int = 0
    image_min_height: int = 0

def validate_assets(payload,limits):
    """limits are supplied per actual operation; unknown site limits are never invented."""
    errors=[]
    if len(payload.get('title',''))>limits.title_max:errors.append('العنوان أطول من حدود العملية')
    if len(payload.get('text',''))>limits.description_max:errors.append('الوصف أطول من حدود العملية')
    files=payload.get('attachments',[])
    if len(files)>limits.max_files:errors.append('عدد المرفقات أكبر من الحد')
    checked=[]
    for filename in files:
        p=Path(filename)
        if not p.is_file():errors.append('مرفق مفقود: '+p.name);continue
        if p.suffix.lower() not in limits.extensions:errors.append('امتداد غير مقبول: '+p.name)
        if p.stat().st_size>limits.file_bytes:errors.append('مرفق أكبر من الحجم المسموح: '+p.name)
        if p.suffix.lower() in ('.png','.jpg','.jpeg','.webp'):
            from PySide6.QtGui import QImageReader
            size=QImageReader(str(p)).size()
            if size.width()<limits.image_min_width or size.height()<limits.image_min_height:errors.append('أبعاد الصورة أصغر من الحد: '+p.name)
        checked.append({'name':p.name,'bytes':p.stat().st_size,'sha256':sha256(p)})
    return {'valid':not errors,'errors':errors,'files':checked,'limits':asdict(limits)}

def resize_preview(source,destination,width,height):
    from PySide6.QtGui import QImageReader
    from PySide6.QtCore import Qt
    src=Path(source);dest=Path(destination)
    if src.resolve()==dest.resolve() or dest.exists():raise ValueError('يلزم مسار نسخة عمل جديدة')
    reader=QImageReader(str(src));size=reader.size()
    if size.width()*size.height()>60_000_000 or width*height>60_000_000:raise ValueError('الصورة أكبر من حدود المعالجة')
    image=reader.read()
    if image.isNull():raise ValueError('ملف صورة غير صالح')
    result=image.scaled(width,height,Qt.KeepAspectRatio,Qt.SmoothTransformation)
    if not result.save(str(dest)):raise ValueError('تعذر حفظ نسخة الصورة')
    return dest

def suggest_projects(job,catalog,limit=3):
    stop={'with','from','this','that','your','have','analysis','data','project','real'}
    words={w for w in re.findall(r'[\w]+',normalize(job.get('title','')+' '+job.get('description',''))) if len(w)>2 and w not in stop}
    ranked=[]
    for p in catalog:
        project_words=set(re.findall(r'[\w]+',normalize(p['title']+' '+p.get('upload_text',''))))
        matches=sorted(words & project_words)
        if matches:ranked.append({'id':p['id'],'title':p['title'],'score':len(matches),'matched_words':matches,
                                  'reason':'مهارات موضحة في دراسة حالة مستقلة؛ ليست إثبات عمل عميل مدفوع'})
    return sorted(ranked,key=lambda p:(-p['score'],p['id']))[:limit]
