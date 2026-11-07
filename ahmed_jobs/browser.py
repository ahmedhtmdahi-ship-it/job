"""Visible isolated browser for manual handoff. Never clicks submit."""
from pathlib import Path
import os
import shutil
from urllib.parse import urlsplit
from .safety import safe_url

def review_controls(page,flags):
    """Two local preview controls. Neither can click, submit or approve a form."""
    import uuid
    binding='__ahmed_review_'+uuid.uuid4().hex
    def command(_source,kind):
        if kind in ('capture','fill'):flags[kind]=True
    page.expose_binding(binding,command)
    page.evaluate('''binding=>{
      const old=document.getElementById('__ahmed_preview_controls');if(old)old.remove();
      const box=document.createElement('div');box.id='__ahmed_preview_controls';
      box.dir='rtl';Object.assign(box.style,{position:'fixed',bottom:'16px',right:'16px',zIndex:'2147483647',background:'#17375e',color:'white',padding:'14px',font:'14px sans-serif',borderRadius:'8px'});
      const label=document.createElement('div');label.textContent='أحمد حاتم — أدوات معاينة فقط؛ لا إرسال من هذه الأزرار';box.appendChild(label);
      for(const [kind,text] of [['fill','ملء الحقول المعروفة بعد تسجيل الدخول'],['capture','حفظ الحقول المعروضة للمراجعة داخل البرنامج']]){
        const button=document.createElement('button');button.type='button';button.textContent=text;
        button.style.margin='6px';button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window[binding](kind)});box.appendChild(button);
      }document.body.appendChild(box);
    }''',binding)

def security_pending(page):
    frames=page.locator('iframe[src*="captcha"],iframe[src*="challenges.cloudflare.com"]')
    if not frames.count():return False
    return not page.locator('textarea[name="g-recaptcha-response"],textarea[name="h-captcha-response"],input[name="cf-turnstile-response"]').evaluate_all('(els)=>els.some(e=>Boolean(e.value))')

def preview_fields(page,fields):
    """Explicit field mappings only. No next/submit clicks, consent or inferred answers."""
    unresolved=[];filled=[]
    for spec in fields:
        field=page.locator(spec['selector'])
        if field.count()!=1 or not field.is_visible() or not field.is_enabled():
            unresolved.append(spec['selector']);continue
        if spec.get('value') is None or spec.get('consent'):
            unresolved.append(spec['selector']);continue
        tag=field.evaluate('(e)=>e.tagName');typ=field.get_attribute('type') or ''
        try:
            if tag=='SELECT':field.select_option(value=str(spec['value']))
            elif typ=='file':
                paths=spec['value'] if isinstance(spec['value'],list) else [spec['value']]
                if not all(Path(p).is_file() for p in paths):raise ValueError('ملف مفقود')
                field.set_input_files(paths)
            elif typ in ('checkbox','radio'):field.set_checked(bool(spec['value']))
            elif field.get_attribute('role')=='combobox':
                unresolved.append(spec['selector']);continue
            elif typ in ('password','submit','button','hidden'):
                unresolved.append(spec['selector']);continue
            else:field.fill(str(spec['value']))
            filled.append(spec['selector'])
        except Exception:unresolved.append(spec['selector'])
    return {'status':'filled_for_preview','filled':filled,'manual_required':unresolved}

def fill_preview(page,profile,draft):
    """Only unambiguous identity fields, no consent or unknown screening answers."""
    if security_pending(page):return {'status':'needs_security','filled':[],'manual_required':['أكمل التحقق الأمني يدويًا ثم اضغط ملء الحقول مجددًا']}
    identity=profile['identity']
    mapping={'name':identity['full_name'],'full_name':identity['full_name'],'fullname':identity['full_name'],
             'email':identity['email'],'email_address':identity['email'],'phone':identity['phone'],'phone_number':identity['phone'],
             'city':identity.get('city','')}
    filled=[]; unresolved=[]
    for field in page.locator('input:not([type=hidden]):not([type=submit]):not([type=button]),textarea,select').all():
        if not field.is_visible() or not field.is_enabled(): continue
        name=(field.get_attribute('name') or '').lower()
        typ=(field.get_attribute('type') or '').lower()
        if typ in ('checkbox','radio','password'):
            unresolved.append(name or typ); continue
        if typ=='file':
            selected=draft.get('resume') if name in ('resume','cv','resume_file','candidate[resume]') else draft.get('cover_letter_file') if name in ('cover_letter_file','cover_letter_upload') else None
            if selected and selected in draft.get('attachments',[]) and Path(selected).is_file():
                accept=field.get_attribute('accept') or ''
                suffix=Path(selected).suffix.lower()
                mime={'.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
                if not accept or suffix in accept.lower() or mime.get(suffix,'---') in accept.lower():
                    field.set_input_files(selected);filled.append(name);continue
            unresolved.append(name or 'attachment'); continue
        if name in ('country','country_code') and field.evaluate('(e)=>e.tagName')=='SELECT':
            values=[('EG','Egypt'),('Egypt','Egypt')]
            for value,label in values:
                if field.locator('option').evaluate_all('(els,v)=>els.some(e=>e.value===v)',value):
                    field.select_option(value=value);filled.append(name);break
            else:unresolved.append(name)
            continue
        if field.get_attribute('role')=='combobox':
            unresolved.append(name or 'custom_combobox');continue
        if name in mapping and field.evaluate('(e)=>e.tagName')!='SELECT':
            field.fill(mapping[name]); filled.append(name)
        elif name in ('cover_letter','coverletter'):
            field.fill(draft['text']); filled.append(name)
        elif name in draft.get('answers',{}) and typ not in ('checkbox','radio') and field.evaluate('(e)=>e.tagName')!='SELECT':
            field.fill(str(draft['answers'][name]));filled.append(name)
        elif field.get_attribute('required') is not None:
            unresolved.append(name or 'required_field')
    return {'status':'filled_for_preview','filled':filled,'manual_required':unresolved}

def handoff(root,url,profile,draft=None):
    from playwright.sync_api import sync_playwright
    url=safe_url(url); host=urlsplit(url).hostname
    path=Path(root)/'browser_profiles'/host
    path.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        options={'headless':False}
        proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
        if proxy:options['proxy']={'server':proxy}
        if Path(p.chromium.executable_path).is_file():
            context=p.chromium.launch_persistent_context(str(path),**options)
        elif os.name=='nt':
            try:context=p.chromium.launch_persistent_context(str(path),channel='msedge',**options)
            except Exception:context=p.chromium.launch_persistent_context(str(path),channel='chrome',**options)
        elif shutil.which('chromium'):
            context=p.chromium.launch_persistent_context(str(path),executable_path=shutil.which('chromium'),**options)
        else:raise ValueError('ثبّت المتصفح من SetupBrowser.cmd أو python -m playwright install chromium')
        try:
            page=context.pages[0] if context.pages else context.new_page()
            page.goto(url,wait_until='domcontentloaded',timeout=30000)
            # Redirected origins require manual handling; never fill unknown destinations.
            if urlsplit(page.url).hostname!=host:
                result={'status':'manual_required','reason':'تغير نطاق الوجهة'}
            else:
                result=fill_preview(page,profile,draft) if draft else {'status':'manual_required'}
            flags={};latest=None
            page.on('framenavigated',lambda frame:flags.update(install=True) if frame==page.main_frame else None)
            if draft and urlsplit(page.url).hostname==host:review_controls(page,flags)
            # User can inspect/login; closing the visible browser returns to the app.
            while context.pages:
                try:
                    page.wait_for_timeout(150)
                    if flags.pop('install',False) and draft and urlsplit(page.url).hostname==host:review_controls(page,flags)
                    if flags.pop('fill',False) and urlsplit(page.url).hostname==host:
                        result=fill_preview(page,profile,draft)
                    if flags.pop('capture',False):
                        from .form_adapter import capture,FormSpec,FormBlocked
                        try:
                            spec=FormSpec('native-inspection','0.3',host,'form','','','','')
                            latest=capture(page,spec,inspection=True)
                            result['manual_required']=latest.get('missing_questions',[])
                        except FormBlocked as e:result['inspection_status']=e.state
                except Exception: break
            if latest:result['remote_snapshot']=latest
            return result
        finally:
            try: context.close()
            except Exception: pass
