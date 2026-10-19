from pathlib import Path
from io import BytesIO
from zipfile import ZipFile
from datetime import datetime
import json, re
from PIL import Image, ImageOps
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import white, black
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, NameObject, NumberObject, FloatObject

ROOT=Path(__file__).resolve().parents[1]
PDF=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.pdf'
ASSETS=ROOT/'03_Thiet_ke/Anh_giao_dien_he_thong'
MANIFEST=json.loads((ASSETS/'Danh_muc_anh_giao_dien.json').read_text(encoding='utf-8'))
OUT=Path(__import__('sys').argv[1]).resolve()
assert len(MANIFEST['captures'])==45 and not MANIFEST.get('errors')
assert all((ASSETS/x['file']).exists() for x in MANIFEST['captures'])
TITLES={26+i:x['title'] for i,x in enumerate(MANIFEST['captures'])}

# Figure pages preserve their original positions. Each index corresponds to Hình 4.(25+index).
PAGE_FIGURES={133:[1],134:[2],135:[3,4],136:[5,6],137:[7,8],138:[9,10],139:[11],140:[12,13],141:[14,15],142:[16],143:[17],144:[18,19],145:[20,21],146:[22,23],147:[24,25],148:[26,27],149:[28,29],150:[30,31],151:[32,33],152:[34],153:[35],154:[36],155:[37,38],156:[39,40],157:[41,42],158:[43,44],159:[45]}

def crop_jpeg(path,w,h):
    with Image.open(path) as im:
        im=ImageOps.fit(im.convert('RGB'),(w,h),method=Image.Resampling.LANCZOS,centering=(0.5,0.46))
        buff=BytesIO(); im.save(buff,format='JPEG',quality=94,optimize=True); return buff.getvalue()

def replace_img(obj,jpg,w,h):
    obj._data=jpg
    obj[NameObject('/Length')]=NumberObject(len(jpg))
    obj[NameObject('/Width')]=NumberObject(w);obj[NameObject('/Height')]=NumberObject(h)
    obj[NameObject('/ColorSpace')]=NameObject('/DeviceRGB');obj[NameObject('/BitsPerComponent')]=NumberObject(8)
    obj[NameObject('/Filter')]=NameObject('/DCTDecode')
    obj.pop(NameObject('/DecodeParms'),None);obj.pop(NameObject('/Decode'),None)

reader=PdfReader(str(PDF)); writer=PdfWriter();writer.clone_document_from_reader(reader)
replaced=0; colors=Counter() if False else None
for physical,indices in PAGE_FIGURES.items():
    page=writer.pages[physical-1]
    xobjects=page['/Resources']['/XObject'].get_object()
    image_names=[]
    for name,ref in xobjects.items():
        obj=ref.get_object()
        if obj.get('/Subtype')=='/Image' and not str(name).startswith('/FormXob.'):
            image_names.append(name)
    assert len(image_names)==len(indices),(physical,image_names,indices)
    for name,idx in zip(image_names,indices):
        obj=xobjects[name].get_object();w=int(obj['/Width']);h=int(obj['/Height'])
        img=crop_jpeg(ASSETS/MANIFEST['captures'][idx-1]['file'],w,h)
        replace_img(obj,img,w,h);replaced+=1
    # Re-synchronize the two earlier screenshot overlays as well as their underlying source images.
    overlay_idx=33 if physical==151 else 34 if physical==152 else None
    if overlay_idx:
        for name,ref in xobjects.items():
            if str(name).startswith('/FormXob.'):
                obj=ref.get_object()
                if obj.get('/Subtype')=='/Image':
                    w=int(obj['/Width']);h=int(obj['/Height'])
                    replace_img(obj,crop_jpeg(ASSETS/MANIFEST['captures'][overlay_idx-1]['file'],w,h),w,h)
                    replaced+=1

# Repaint the old navy and blue-gray table fills as white, and white text inside table header rows as black.
fill_colors={(0.953,0.965,0.98),(0.125,0.227,0.388)}
fill_ops=0;text_ops=0
for page in writer.pages:
    if page.get('/Contents') is None: continue
    cs=page.get_contents();inside_text=False
    for operands,operator in cs.operations:
        if operator==b'BT': inside_text=True
        elif operator==b'ET': inside_text=False
        if operator==b'rg' and len(operands)==3 and tuple(round(float(v),3) for v in operands) in fill_colors:
            operands[:]=[FloatObject(1),FloatObject(1),FloatObject(1)];fill_ops+=1
        elif operator==b'g' and inside_text and len(operands)==1 and round(float(operands[0]),3)==1.0:
            operands[:]=[FloatObject(0)];text_ops+=1
    page.replace_contents(cs)

# Remove the earlier duplicated page-wide overlay so figures 4.57 and 4.58 can appear as separate captures.
patch_page=writer.pages[150]
patch_stream=patch_page.get_contents()
patch_stream.operations=[(operands,operator) for operands,operator in patch_stream.operations if not (operator==b'Do' and operands and str(operands[0]).startswith('/FormXob.'))]
patch_page.replace_contents(patch_stream)

# Update the cached Table of Figures and the two body captions that became inaccurate after the redesign.
font_regular=Path('C:/Windows/Fonts/times.ttf');font_bold=Path('C:/Windows/Fonts/timesbd.ttf');font_italic=Path('C:/Windows/Fonts/timesi.ttf')
pdfmetrics.registerFont(TTFont('ReportTimes',str(font_regular)))
pdfmetrics.registerFont(TTFont('ReportTimesBold',str(font_bold)))
pdfmetrics.registerFont(TTFont('ReportTimesItalic',str(font_italic)))
source_words={}
with pdfplumber.open(str(PDF)) as pdf:
    # Cached List of Figures, currently on printed pages 10–11 (physical PDF pages 12–13).
    for physical in (12,13):
        page=pdf.pages[physical-1]; words=page.extract_words(); groups={}
        for word in words: groups.setdefault(round(word['top'],1),[]).append(word)
        for group in groups.values():
            group.sort(key=lambda x:x['x0']); line=' '.join(w['text'] for w in group)
            m=re.search(r'Hình\s+4\.(\d{2}):',line)
            if m and int(m.group(1)) in TITLES:
                n=int(m.group(1)); source_words.setdefault(('toc',n),[]).append((physical,min(w['top'] for w in group),max(w['bottom'] for w in group)))
    # Body figure captions between physical pages 133–159.
    for physical in range(133,160):
        page=pdf.pages[physical-1]; words=page.extract_words(); groups={}
        for word in words: groups.setdefault(round(word['top'],1),[]).append(word)
        for group in groups.values():
            group.sort(key=lambda x:x['x0']); line=' '.join(w['text'] for w in group)
            m=re.search(r'Hình\s+4\.(\d{2}):',line)
            if m and int(m.group(1)) in TITLES:
                n=int(m.group(1)); source_words.setdefault(('body',n),[]).append((physical,min(w['top'] for w in group),max(w['bottom'] for w in group)))
source_words[('toc',58)]=[(13,391.8,403.8)]
source_words[('toc',59)]=[(13,407.64,419.64)]
assert all(('toc',n) in source_words for n in TITLES),[k for k in TITLES if ('toc',k) not in source_words]
assert all(('body',n) in source_words for n in TITLES),[k for k in TITLES if ('body',k) not in source_words]

# Build one small overlay per page; white-out each stale line, then draw the current caption in plain black.
page_sizes={i+1:(float(p.mediabox.width),float(p.mediabox.height)) for i,p in enumerate(writer.pages)}
overlays={}
for kind in ('toc','body'):
    for n,title in TITLES.items():
        if kind=='body' and n in (58,59): continue
        entries=source_words[(kind,n)]
        # Older PDF patch inserted duplicate text at the same position; de-duplicate by physical page and line height.
        unique=[]
        for entry in entries:
            if not any(entry[0]==old[0] and abs(entry[1]-old[1])<1 for old in unique): unique.append(entry)
        for physical,top,bottom in unique:
            width,height=page_sizes[physical]
            buf=overlays.setdefault(physical,BytesIO())
            if not hasattr(buf,'_canvas'):
                c=canvas.Canvas(buf,pagesize=(width,height));buf._canvas=c
            c=buf._canvas
            y=height-bottom+1
            if kind=='toc':
                x=85.1; right=519.1; maxw=right-x
                label=f'Hình 4.{n}: {title}'
                size=12.0
                while pdfmetrics.stringWidth(label,'ReportTimesItalic',size)>maxw-35 and size>8.0:size-=0.25
                c.setFillColor(white);c.rect(84.2,height-bottom-1,maxw+1,(bottom-top)+2,stroke=0,fill=1)
                c.setFillColor(black);c.setFont('ReportTimesItalic',size);c.drawString(x,y,label)
                used=pdfmetrics.stringWidth(label,'ReportTimesItalic',size)
                dot='.'; dotw=pdfmetrics.stringWidth(dot,'ReportTimes',size)
                count=max(0,int((right-x-used-8)/dotw))
                if count:c.drawString(x+used+4,y,dot*count)
            else:
                label=f'Hình 4.{n}: {title}';size=11.0
                maxw=width-170
                while pdfmetrics.stringWidth(label,'ReportTimesItalic',size)>maxw and size>8.0:size-=0.25
                c.setFillColor(white);c.rect(0,height-bottom-1,width,(bottom-top)+2,stroke=0,fill=1)
                c.setFillColor(black);c.setFont('ReportTimesItalic',size);c.drawCentredString(width/2,y,label)
for physical,buf in overlays.items():
    c=buf._canvas;c.save();buf.seek(0);overlay=PdfReader(buf).pages[0];writer.pages[physical-1].merge_page(overlay)
# Rebuild page 151's two overlapping figures as separate, current captures.
width,height=page_sizes[151];buf=BytesIO();c=canvas.Canvas(buf,pagesize=(width,height))
slots=[(32,86.825,472.72,450.0,312.5,'Hình 4.57: Báo cáo hồ sơ theo cơ quan và trạng thái',457.9),
       (33,86.825,130.25,450.0,312.5,'Hình 4.58: Danh mục thủ tục trong bàn quản trị',115.4)]
for idx,x,y,w,h,label,baseline in slots:
    c.setFillColor(white);c.rect(72,y-15,w+20,h+30,stroke=0,fill=1)
    c.drawImage(ImageReader(str(ASSETS/MANIFEST['captures'][idx-1]['file'])),x,y,width=w,height=h,mask='auto')
    c.setFillColor(black);c.setFont('ReportTimesItalic',11);c.drawCentredString(width/2,baseline,label)
c.save();buf.seek(0);writer.pages[150].merge_page(PdfReader(buf).pages[0])
OUT.parent.mkdir(parents=True,exist_ok=True)
with OUT.open('wb') as f:writer.write(f)
print(json.dumps({'pages':len(writer.pages),'screenshotsReplaced':replaced,'tableFillsRemoved':fill_ops,'whiteTableHeaderTextChangedToBlack':text_ops,'figureCaptionsSynced':len(TITLES),'output':str(OUT),'bytes':OUT.stat().st_size},ensure_ascii=False))









