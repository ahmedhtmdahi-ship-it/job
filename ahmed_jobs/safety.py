"""Bounded file import. No imported script or macro is executed."""
import hashlib
import os
import stat
import zipfile
import re
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

MAX_FILES = 3000
MAX_FILE = 60 * 1024 * 1024
MAX_TOTAL = 300 * 1024 * 1024

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def safe_url(url):
    p = urlsplit(url.strip())
    if p.scheme not in ('https', 'http') or not p.hostname or p.username or p.password:
        raise ValueError('يلزم رابط HTTP/HTTPS صالح دون بيانات دخول')
    if any(ord(c) < 32 for c in url) or p.port not in (None, 80, 443):
        raise ValueError('رابط غير مسموح')
    return urlunsplit((p.scheme.lower(), p.netloc.lower(), p.path or '/', p.query, ''))

def canonical(url):
    p = urlsplit(safe_url(url))
    host=p.hostname or ''
    if host=='linkedin.com' or host.endswith('.linkedin.com'):
        match=re.search(r'/jobs/view/(?:[^/?]*-)?(\d+)(?:/|$)',p.path)
        if match:return urlunsplit(('https','www.linkedin.com',f'/jobs/view/{match[1]}/','',''))
    pairs = [(k,v) for k,v in parse_qsl(p.query, keep_blank_values=True)
             if not k.lower().startswith('utm_') and k.lower() not in ('fbclid','gclid')]
    return urlunsplit((p.scheme, p.netloc, p.path, urlencode(sorted(pairs)), ''))

def inspect_zip(path):
    with zipfile.ZipFile(path) as z:
        members = z.infolist()
        if len(members) > MAX_FILES or sum(x.file_size for x in members) > MAX_TOTAL:
            raise ValueError('الأرشيف أكبر من حدود الاستيراد')
        names = set()
        for i in members:
            p = PurePosixPath(i.filename)
            mode = i.external_attr >> 16
            if (not p.parts or p.is_absolute() or '..' in p.parts or '\\' in i.filename
                    or ':' in i.filename or stat.S_ISLNK(mode) or i.flag_bits & 1
                    or any(part.rstrip(' .') != part for part in p.parts)):
                raise ValueError('مسار أو نوع غير آمن في الأرشيف')
            reserved={'CON','PRN','AUX','NUL'}|{f'COM{n}' for n in range(1,10)}|{f'LPT{n}' for n in range(1,10)}
            if any(part.split('.')[0].upper() in reserved or any(c in part for c in '<>"|?*') for part in p.parts):
                raise ValueError('اسم ملف غير آمن على Windows')
            key = str(p).casefold()
            if key in names:
                raise ValueError('مسارات مكررة في الأرشيف')
            names.add(key)
            if i.file_size > MAX_FILE or (i.file_size > 1024*1024 and i.file_size > max(1,i.compress_size)*300):
                raise ValueError('ملف مضغوط أكبر من الحدود')
        return [{'name':i.filename, 'bytes':i.file_size} for i in members if not i.is_dir()]

def extract_zip(path, destination):
    inspect_zip(path)
    root = Path(destination).resolve()
    root.mkdir(parents=True, exist_ok=False)
    try:
        with zipfile.ZipFile(path) as z:
            for i in z.infolist():
                target = root.joinpath(*PurePosixPath(i.filename).parts)
                if not target.resolve().is_relative_to(root):
                    raise ValueError('مسار خارج مجلد الاستيراد')
                if i.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with z.open(i) as src, target.open('xb') as dst:
                    copied = 0
                    while block := src.read(1024*1024):
                        copied += len(block)
                        if copied > MAX_FILE or copied > i.file_size:
                            raise ValueError('حجم غير صالح')
                        dst.write(block)
    except Exception:
        import shutil
        shutil.rmtree(root)
        raise
    return root

def csv_safe(value):
    value = str(value)
    return "'" + value if value.lstrip().startswith(('=', '+', '-', '@')) else value
