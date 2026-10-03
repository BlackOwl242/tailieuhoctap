from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile
from collections import Counter
import sys,json,re
from lxml import etree as E
from PIL import Image,ImageDraw
from docx import Document
import ket_xuat_va_doi_chieu_oo as qa

ROOT=Path(__file__).resolve().parents[1]
Q=ROOT/'05_Doi_chieu/Gop_chuong_20261003'
DOC=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
qa.Q=Q
if sys.argv[1]=='restore':
    qa.restore(DOC)
    print('Restored template parts')
    raise SystemExit
if sys.argv[1]=='render':
    qa.render(Q/'Bao_cao.pdf',Q/'Trang')
    folder=Q/'Trang_doi_chieu';folder.mkdir(exist_ok=True)
    pages=sorted((Q/'Trang').glob('trang_*.png'))
    for i in range(0,len(pages),4):
        ims=[Image.open(p).convert('RGB') for p in pages[i:i+4]]
        w,h=ims[0].size
        sheet=Image.new('RGB',(w*2,(h+30)*2),'#dddddd');d=ImageDraw.Draw(sheet)
        for j,im in enumerate(ims):
            x=j%2*w;y=j//2*(h+30)
            d.text((x+15,y+5),f'TRANG {i+j+1}',fill='black');sheet.paste(im,(x,y+30))
        sheet.save(folder/f'bo_{i//4+1:02}.png')
    print('Review sheets',len(list(folder.glob('bo_*.png'))))
    raise SystemExit

qa.check(DOC)
plan=json.loads((Q/'Ban_do_gop_chuong.json').read_text('utf-8'))
N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
W=N['w']
def txt(e):return ''.join(e.xpath('.//w:t/text()',namespaces=N))
def sty(e):
    p=e.find('w:pPr/w:pStyle',N)
    return p.get('{'+W+'}val') if p is not None else ''
def load(path):
    with ZipFile(path) as z:return E.fromstring(z.read('word/document.xml'))
def body_start(tree):
    els=list(tree.find('w:body',N))
    return els[next(i for i,e in enumerate(els) if sty(e)=='Heading1' and txt(e).startswith('CHƯƠNG 1.')):]
def signature(e):return {'type':E.QName(e).localname,'text':txt(e),'style':sty(e) if e.tag=='{'+W+'}p' else '', 'images':e.xpath('.//a:blip/@r:embed',namespaces=N)}
def payload(tree):
    result=[]
    for e in body_start(tree):
        if sty(e)=='Heading1' and txt(e).startswith('CHƯƠNG '):continue
        s=txt(e)
        if sty(e)=='Heading2':s=re.sub(r'^\d+\.\d+\.', '',s)
        s=re.sub(r'^(Hình|Bảng) \d+\.\d+:',r'\1:',s)
        s=s.replace('Tất cả ảnh của mục 2.2','Tất cả ảnh của mục 1.5')
        result.append((E.QName(e).localname,s,tuple(e.xpath('.//a:blip/@r:embed',namespaces=N))))
    return Counter(result)
oldtree=load(Q/'Ban_truoc_gop.docx');newtree=load(DOC)
old=Document(Q/'Ban_truoc_gop.docx');new=Document(DOC)
with ZipFile(Q/'Ban_truoc_gop.docx') as zo,ZipFile(DOC) as zn:
    media=[n for n in zo.namelist() if n.startswith('word/media/')]
    media_ok=all(zo.read(n)==zn.read(n) for n in media)
    protected=[n for n in zo.namelist() if n.startswith(('word/theme/','word/styles','word/header','word/footer','word/numbering','word/fontTable'))]
    preserved=all(zo.read(n)==zn.read(n) for n in protected)
    rels_ok=zo.read('word/_rels/document.xml.rels')==zn.read('word/_rels/document.xml.rels')
chapters=[p.text for p in new.paragraphs if p.style.name=='Heading 1' and p.text.startswith('CHƯƠNG ')]
specs=[t for t in new.tables if len(t.rows)>1 and t.cell(1,0).text=='Mã và mục tiêu']
paragraphs=[p.text for p in new.paragraphs];alltext='\n'.join(paragraphs)+'\n'+'\n'.join(c.text for t in new.tables for row in t.rows for c in row.cells)
def table_payload(d):return Counter(tuple(tuple(c.text for c in row.cells) for row in t.rows) for t in d.tables)
caps=[p.text for p in new.paragraphs if re.match(r'^(Hình|Bảng) [0-9A-Z]+\.\d+:',p.text) and '\t' not in p.text]
capnumbers=[re.match(r'^(Hình|Bảng) ([0-9A-Z]+\.\d+):',x).groups() for x in caps]
continuous=True
for kind in ['Hình','Bảng']:
    for chapter in range(1,5):
        nums=[int(n.split('.')[1]) for k,n in capnumbers if k==kind and n.startswith(str(chapter)+'.')]
        continuous &= nums==list(range(1,len(nums)+1))
pages=json.loads((Q/'Trang/van_ban_theo_trang.json').read_text('utf-8'))
actual=[signature(e) for e in body_start(newtree)]
checks={
    'Gộp đúng bốn chương':chapters==list(plan['titles'].values()),
    'Toàn bộ đoạn, bảng và hình được bảo toàn sau đổi số':payload(oldtree)==payload(newtree),
    'Trình tự các khối đúng phương án gộp':actual==plan['expected_body'],
    'Đủ 98 bảng, giữ nguyên mọi nội dung trong ô':len(new.tables)==len(old.tables)==98 and table_payload(old)==table_payload(new),
    'Đủ 160 chú thích hình':sum(k=='Hình' for k,n in capnumbers)==160,
    'Đủ 36 đặc tả và các bước chi tiết':len(specs)==36 and all(len(t.cell(5,1).paragraphs)>=4 for t in specs),
    'Mọi hình ảnh giữ nguyên':media_ok,
    'Bảo toàn kiểu, số trang, đầu và chân trang':preserved,
    'Quan hệ tài liệu không thay đổi':rels_ok,
    'Chú thích liên tục, không trùng số':continuous and len(capnumbers)==len(set(capnumbers)),
    'Dẫn chiếu ảnh lịch sử đúng mục mới':'Tất cả ảnh của mục 1.5' in alltext and 'Tất cả ảnh của mục 2.2' not in alltext,
    'Lời cảm ơn và cam đoan giữ nguyên':paragraphs[paragraphs.index('LỜI CẢM ƠN'):paragraphs.index('MỤC LỤC')]==[p.text for p in old.paragraphs][[p.text for p in old.paragraphs].index('LỜI CẢM ƠN'):[p.text for p in old.paragraphs].index('MỤC LỤC')],
    'Nguồn trích dẫn giữ đủ mười':set(re.findall(r'\[(\d+)\]',alltext))==set(map(str,range(1,11))),
    'Không có thuật ngữ và mã đã yêu cầu bỏ':not re.search(r'\b(?:UCN|R)\d+\b',alltext) and not any(x in alltext.lower() for x in ['tài liệu mẫu','talentconnect','pttk_oop_hr']),
    'Không có lỗi trường hoặc chữ vượt trang':not any(p['overflow'] for p in pages) and not any('Error!' in p['text'] or 'Lỗi!' in p['text'] for p in pages),
}
result={'docx':str(DOC),'sha256':sha256(DOC.read_bytes()).hexdigest(),'pages':len(pages),'tables':len(new.tables),'numbered_figure_captions':160,'numbered_table_captions':sum(k=='Bảng' for k,n in capnumbers),'media_files':len(media),'checks':checks,'scope':'Kiểm tra bảo toàn nội dung và định dạng khi gộp chương, không kiểm thử phần mềm vận hành thực tế.'}
(Q/'Kiem_tra_gop_chuong.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
if not all(checks.values()):raise SystemExit(1)
