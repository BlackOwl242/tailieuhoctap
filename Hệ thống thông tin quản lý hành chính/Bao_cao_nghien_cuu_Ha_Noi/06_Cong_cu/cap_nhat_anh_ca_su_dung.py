from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile,ZIP_DEFLATED
from PIL import Image
from lxml import etree
import runpy
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'
files=list(F.glob('ca_su_dung_*.png'))+[F/'phan_cap_tac_nhan.png']
before={sha256(p.read_bytes()).hexdigest():p for p in files}
runpy.run_path(str(ROOT/'06_Cong_cu/bo_sung_uml_chuyen_sau.py'));runpy.run_path(str(ROOT/'06_Cong_cu/them_so_do_quy_trinh.py'))
file=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
with ZipFile(file) as z:
 data={n:z.read(n) for n in z.namelist()};changed={}
 for n,b in list(data.items()):
  h=sha256(b).hexdigest()
  if n.startswith('word/media/') and h in before:data[n]=before[h].read_bytes();changed[n]=Image.open(before[h]).size
ns={'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','a':'http://schemas.openxmlformats.org/drawingml/2006/main','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}
rels={x.get('Id'):'word/'+x.get('Target') for x in etree.fromstring(data['word/_rels/document.xml.rels'])};doc=etree.fromstring(data['word/document.xml'])
for inline in doc.findall('.//wp:inline',ns):
 b=inline.find('.//a:blip',ns);part=rels.get(b.get('{'+ns['r']+'}embed'))
 if part in changed:
  w,h=changed[part];extent=inline.find('wp:extent',ns);cx=int(extent.get('cx'));cy=round(cx*h/w);extent.set('cy',str(cy))
  for ex in inline.findall('.//a:xfrm/a:ext',ns):ex.set('cy',str(cy))
data['word/document.xml']=etree.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
tmp=file.with_suffix('.layout.docx')
with ZipFile(tmp,'w',ZIP_DEFLATED) as z:
 for n,b in data.items():z.writestr(n,b)
tmp.replace(file);print('Cập nhật',len(changed),'hình Use case và tác nhân; giữ đúng tỷ lệ hình.')
