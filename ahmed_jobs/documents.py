import json
import zipfile
import xml.etree.ElementTree as ET
import re
from html import unescape
from xml.sax.saxutils import escape
from pathlib import Path
from .safety import sha256

def text(path):
    p=Path(path)
    if p.suffix.lower()=='.docx':
        with zipfile.ZipFile(p) as z:
            return '\n'.join(''.join(n.itertext()) for n in ET.fromstring(z.read('word/document.xml')).iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'))
    if p.suffix.lower()=='.pdf':
        from pypdf import PdfReader
        return '\n'.join(page.extract_text() or '[صفحة مصورة تحتاج مراجعة بصرية]' for page in list(PdfReader(p).pages)[:100])[:200000]
    if p.suffix.lower()=='.xlsx':
        from openpyxl import load_workbook
        book=load_workbook(p,read_only=True,data_only=True)
        try:
            from itertools import islice
            return '\n'.join(f'[{s.title}]\n'+'\n'.join(' | '.join(str(v if v is not None else '') for v in row) for row in islice(s.iter_rows(values_only=True),100)) for s in book)[:200000]
        finally: book.close()
    return p.read_text(encoding='utf-8',errors='replace')[:200000]

def corrected_cv(original,destination):
    """Create a separate DOCX working copy; preserve source and formatting runs."""
    p=Path(original); out=Path(destination)
    if p.resolve()==out.resolve(): raise ValueError('لا يمكن استبدال الأصل')
    with zipfile.ZipFile(p) as src,zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data=src.read(item)
            if item.filename=='word/document.xml':
                ET.fromstring(data) # Validate; keep the original namespace declarations and formatting XML.
                xml=data.decode('utf-8')
                q='w:'
                for prefix,uri in re.findall(r'xmlns:([\w.-]+)=["\x27]([^"\x27]+)',xml):
                    if uri=='http://schemas.openxmlformats.org/wordprocessingml/2006/main':q=prefix+':'
                def rewrite(para):
                    xml_para=para.group(0)
                    pattern=rf'(<{re.escape(q)}t\b[^>]*>)(.*?)(</{re.escape(q)}t>)'
                    nodes=list(re.finditer(pattern,xml_para,re.S))
                    values=[unescape(n[2]) for n in nodes]
                    joined=''.join(values)
                    replacements=[(m.start(),m.end(),'+201144064593') for m in re.finditer(r'\+20\s*103\s*077\s*9131',joined)]
                    if 'ideaspace' in joined.lower():
                        replacements += [(m.start(),m.end(),'Oct 2026') for m in re.finditer(r'\bPresent\b',joined)]
                    for start,end,value in sorted(replacements,reverse=True):
                        offset=0
                        for index,original_text in enumerate(values):
                            length=len(original_text)
                            left=max(0,start-offset);right=min(length,end-offset)
                            if left<right:
                                values[index]=original_text[:left]+(value if offset<=start<offset+length else '')+original_text[right:]
                            offset+=length
                    for node,value in reversed(list(zip(nodes,values))):
                        xml_para=xml_para[:node.start(2)]+escape(value)+xml_para[node.end(2):]
                    return xml_para
                xml=re.sub(rf'<{re.escape(q)}p\b[^>]*>.*?</{re.escape(q)}p>',rewrite,xml,flags=re.S)
                data=xml.encode('utf-8')
            dst.writestr(item,data)
    if '103 077 9131' in text(out):
        out.unlink(); raise ValueError('الرقم موزع على أجزاء؛ يلزم تصحيح يدوي للنسخة')
    return out

def pdf_working_copy(original,destination):
    """Locally render readable CV text; original layout is not claimed identical."""
    from PySide6.QtGui import QTextDocument,QFont,QPageSize
    from PySide6.QtPrintSupport import QPrinter
    p=Path(destination)
    if p.exists():raise ValueError('اختر اسمًا جديدًا للحفاظ على الملف الموجود')
    doc=QTextDocument();doc.setDefaultFont(QFont('Arial',10));doc.setPlainText(text(original))
    printer=QPrinter(QPrinter.HighResolution);printer.setOutputFormat(QPrinter.PdfFormat)
    printer.setOutputFileName(str(p));printer.setPageSize(QPageSize(QPageSize.A4));doc.print_(printer)
    if not p.is_file() or p.stat().st_size<100:raise ValueError('تعذر إنشاء PDF')
    return p

def split_certificates(source,destination):
    from pypdf import PdfReader,PdfWriter
    root=Path(destination); root.mkdir(parents=True,exist_ok=False)
    result=[]
    for n,page in enumerate(PdfReader(source).pages,1):
        writer=PdfWriter(); writer.add_page(page)
        path=root/f'certificate_{n:02}.pdf'
        with path.open('xb') as f: writer.write(f)
        result.append(path)
    return result

def proposal(job,profile,language='ar',tracks=None,templates=None):
    from .config import seed
    from .matching import assess
    from string import Formatter
    snippets={
      'operations':('تشمل خبرتي الموضحة في السيرة تنسيق برامج التدريب، وتنظيم الجداول واللوجستيات، ومتابعة مؤشرات الأداء في IdeaSpace.',
                    'My CV documents programme coordination at IdeaSpace, including training logistics, scheduling and KPI reporting.'),
      'training':('تشمل خبرتي تنسيق البرامج التدريبية، والتواصل مع المدربين والمشاركين، ومتابعة الحضور والتقارير.',
                  'My experience includes training programme coordination, trainer and participant communication, attendance tracking and reporting.'),
      'assistant':('تشمل خبرتي تنظيم الوثائق، والتنسيق الإداري، وإعداد التقارير ومتابعة تنفيذ البرامج.',
                   'My experience includes document organisation, administrative coordination, reporting and programme execution tracking.'),
      'data':('تتضمن مهاراتي الموثقة Excel وSQL وPower BI، ويعرض البورتفليو دراسات حالة مستقلة للتحليل وإعداد التقارير.',
              'My documented skills include Excel, SQL and Power BI. My portfolio contains independent analysis and reporting case studies.'),
      'data_quality':('تتضمن مهاراتي تنظيف البيانات والتحقق منها باستخدام Excel وSQL، مع دراسات حالة مستقلة في البورتفليو.',
                      'My documented skills include data cleaning and validation using Excel and SQL, supported by independent portfolio case studies.'),
      'legal':('أنا خريج حقوق بالشعبة الإنجليزية من جامعة أسيوط، وتتضمن سيرتي خبرة مساعدة قانونية في Shield Law Firm.',
               'I hold a Bachelor of Laws from the English Section at Assiut University, and my CV includes legal assistance experience at Shield Law Firm.'),
      'hr':('تتضمن سيرتي خبرة تطوعية في تنسيق الموارد البشرية والإعلام في UCCD، تشمل توثيق الملفات وتنسيق البرامج.',
            'My CV includes volunteer HR and media coordination at UCCD, including documentation and programme coordination.'),
      'sales_ops':('تتضمن خبرتي عمليات المبيعات ومتابعة الأداء، ويحتوي البورتفليو على دراسات حالة مستقلة لتحليل CRM والمبيعات.',
                   'My experience includes sales operations and performance monitoring, with independent CRM and sales analysis case studies in my portfolio.')
    }
    name=profile['identity']['full_name']
    role=job['title']; company=job.get('company','')
    matches=assess(job,tracks or seed('career_tracks'))['matches']
    selected=max(matches,key=lambda m:m['score'])['track'] if matches else None
    evidence=snippets.get(selected,('',''))[1 if language=='en' else 0]
    values={'name':name,'title':role,'company':company or ('Hiring Team' if language=='en' else 'فريق التوظيف'),'role_evidence':evidence}
    template=(templates or seed('templates'))[language]
    for _,field,spec,conversion in Formatter().parse(template):
        if field is not None and (field not in values or spec or conversion):raise ValueError('حقل غير مدعوم في القالب')
    return template.format_map(values)
