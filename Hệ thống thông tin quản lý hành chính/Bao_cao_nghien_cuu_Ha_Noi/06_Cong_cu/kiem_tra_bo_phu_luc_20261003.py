from pathlib import Path
from zipfile import ZipFile
from hashlib import sha256
import json,sys,re
from lxml import etree
from PIL import Image,ImageDraw,ImageChops
import pypdfium2 as pdfium
import ket_xuat_va_doi_chieu_oo as qa
ROOT=Path(__file__).resolve().parents[1]
Q=ROOT/'05_Doi_chieu/Bo_phu_luc_20261003'
F=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
qa.Q=Q
if sys.argv[1]=='restore':
 qa.restore(F);raise SystemExit
pages=qa.render(Q/'Bao_cao_cuoi.pdf',Q/'Trang')
qa.check(F)
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
def blocks(path):
 with ZipFile(path) as z:r=etree.fromstring(z.read('word/document.xml'))
 body=r.find('w:body',ns);out=[];active=False
 for el in body:
  t=''.join(el.xpath('.//w:t/text()',namespaces=ns))
  if t.startswith('CHƯƠNG 1. TỔNG QUAN') and not re.search(r'\d+$',t):active=True
  if t=='PHỤ LỤC. TỆP BÀN GIAO VÀ NỘI DUNG CÒN THIẾU':break
  if active and not el.tag.endswith('}sectPr'):out.append(t.replace(' và phần thiết kế của báo cáo nghiên cứu tổng hợp',''))
 return out
with ZipFile(F) as a,ZipFile(Q/'Ban_truoc_sua.docx') as b:
 parts=[n for n in b.namelist() if n.startswith(('word/media/','word/styles','word/header','word/footer','word/numbering','word/theme/','word/fontTable'))]
 same=all(a.read(n)==b.read(n) for n in parts)
text='\n'.join(p['text'] for p in pages)
oldpdf=pdfium.PdfDocument(str(ROOT/'05_Doi_chieu/Ten_chuong_20261003/Bao_cao.pdf'))
changed=[]
images=sorted((Q/'Trang').glob('trang_*.png'))
for i,file in enumerate(images):
 old=oldpdf[i].render(scale=1.5).to_pil().convert('RGB')
 new=Image.open(file).convert('RGB')
 if old.size!=new.size or ImageChops.difference(old,new).getbbox():changed.append(i+1)
out=Q/'Trang_doi_chieu';out.mkdir(exist_ok=True)
for i in range(0,len(changed),4):
 ims=[Image.open(images[n-1]).convert('RGB') for n in changed[i:i+4]]
 w,h=ims[0].size;sheet=Image.new('RGB',(w*2,(h+30)*2),'#dddddd');d=ImageDraw.Draw(sheet)
 for j,(im,n) in enumerate(zip(ims,changed[i:i+4])):
  x=j%2*w;y=j//2*(h+30);d.text((x+15,y+5),f'TRANG {n}',fill='black');sheet.paste(im,(x,y+30))
 sheet.save(out/f'doi_{i//4+1:02}.png')
checks={'Đã bỏ phụ lục và mục danh mục liên quan':'TỆP BÀN GIAO VÀ NỘI DUNG CÒN THIẾU' not in text and 'Bảng A.1:' not in text,'Các phần từ chương 1 đến tài liệu tham khảo được giữ nguyên':blocks(F)==blocks(Q/'Ban_truoc_sua.docx'),'Hình và định dạng giữ nguyên':same,'Không có chữ vượt trang hoặc lỗi trường':not any(p['overflow'] or 'Error!' in p['text'] or 'Lỗi!' in p['text'] for p in pages)}
result={'pages':len(pages),'sha256':sha256(F.read_bytes()).hexdigest(),'checks':checks,'changed_pages':changed,'pixel_identical_pages':len(pages)-len(changed),'diagram_review':{'full_system_class_diagram':False,'full_system_erd':False,'existing_class_diagrams':'Biểu đồ miền cốt lõi và 10 biểu đồ lớp theo nhóm','data_tables':35,'foreign_keys':62}}
(Q/'Ket_qua_kiem_tra.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(result,ensure_ascii=False))
if not all(checks.values()):raise SystemExit(1)

