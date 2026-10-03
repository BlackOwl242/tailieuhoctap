from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
import re,json,hashlib,sys
ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'05_Doi_chieu/Sua_bieu_do_va_bien_tap_20261002'
DOC=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
from mo_hinh_huong_doi_tuong import MODEL
models={u['id']:u for u in MODEL}
def txt(el):return ''.join(el.xpath('.//w:t/text()',namespaces=NS))
def settext(el,s):
 ts=el.xpath('.//w:t',namespaces=NS);ts[0].text=s
 for t in ts[1:]:t.text=''
if sys.argv[1]=='edit':
 reviewed=set([1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,18,20,22,23,24,25,26,27,28,30]+list(range(29,93)))
 (QA/'Trang_da_xem_v3.json').write_text(json.dumps({str(n):hashlib.sha256((QA/f'Trang/trang_{n:03}.png').read_bytes()).hexdigest() for n in sorted(reviewed)},indent=2),encoding='utf-8')
 with ZipFile(DOC) as z:data={n:z.read(n) for n in z.namelist()}
 root=E.fromstring(data['word/document.xml']);body=root.find('w:body',NS)
 rels={x.attrib['Id']:x.attrib['Target'] for x in E.fromstring(data['word/_rels/document.xml.rels'])}
 current=None;pending=False;fixed=[];images=[];previous=None
 for el in body:
  if el.tag!='{'+NS['w']+'}p':continue
  t=txt(el);m=re.match(r'^(UC\d{2})\.',t)
  if m and not el.xpath('.//w:tab',namespaces=NS):current=m[1]
  if pending:
   assert current in models,(current,t)
   settext(el,models[current]['exception']+'.');fixed.append(current);pending=False
  if t.startswith('Hướng dẫn thực hiện theo thiết kế:'):pending=True
  m=re.search(r'Biểu đồ hoạt động của Use case (UC13|UC16)$',t)
  if m and previous is not None:
   blips=previous.xpath('.//a:blip',namespaces=NS)
   if blips:
    rid=blips[0].attrib['{'+NS['r']+'}embed'];target=rels[rid]
    data['word/'+target]=(ROOT/f'03_Thiet_ke/Huong_doi_tuong/So_do/{m[1]}_hoat_dong.png').read_bytes();images.append(m[1])
  previous=el
 assert len(fixed)==36 and len(set(fixed))==36,fixed
 assert sorted(images)==['UC13','UC16'],images
 data['word/document.xml']=E.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
 with ZipFile(DOC,'w',ZIP_DEFLATED) as z:
  for n,v in data.items():z.writestr(n,v)
 print('Đã đối chiếu hướng dẫn của 36 UC và thay 2 biểu đồ hoạt động.')
elif sys.argv[1]=='check':
 with ZipFile(DOC) as z:root=E.fromstring(z.read('word/document.xml'))
 current=None;pending=False;checks=[]
 for el in root.find('w:body',NS):
  if el.tag!='{'+NS['w']+'}p':continue
  t=txt(el);m=re.match(r'^(UC\d{2})\.',t)
  if m and not el.xpath('.//w:tab',namespaces=NS):current=m[1]
  if pending:checks.append({'uc':current,'correct':t==models[current]['exception']+'.'});pending=False
  if t.startswith('Hướng dẫn thực hiện theo thiết kế:'):pending=True
 assert len(checks)==36 and all(x['correct'] for x in checks),checks
 old=json.loads((QA/'Trang_da_xem_v3.json').read_text('utf-8'))
 reused=[];unseen=[]
 for p in sorted((QA/'Trang').glob('trang_*.png')):
  n=int(p.stem.split('_')[1]);h=hashlib.sha256(p.read_bytes()).hexdigest()
  (reused if old.get(str(n))==h else unseen).append(n)
 (QA/'Rà_soát_cuối.json').write_text(json.dumps({'guide_checks':checks,'reused_review':reused,'needs_review':unseen},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'reused':len(reused),'needs_review':unseen},ensure_ascii=False))
elif sys.argv[1]=='figures':
 with ZipFile(DOC) as z:data={n:z.read(n) for n in z.namelist()}
 root=E.fromstring(data['word/document.xml']);rels={x.attrib['Id']:x.attrib['Target'] for x in E.fromstring(data['word/_rels/document.xml.rels'])}
 assets=ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'
 previous=None;count=0
 mapping={'Các nhánh tiếp nhận và kết luận':'trang_thai_HoSo','Vòng đời kết quả':'trang_thai_KetQua','Vòng đời khoản thu':'trang_thai_KhoanThu','Vòng đời nhiệm vụ phối hợp':'trang_thai_NhiemVuPhoiHop','Vòng đời thông điệp kết nối':'trang_thai_ThongDiep','Vòng đời gói nộp lưu':'trang_thai_GoiNopLuu','Các thành phần thực thi đề xuất':'thanh_phan_he_thong','Cộng tác đối tượng khi phát hành':'cong_tac_phat_hanh','Ký duyệt, phát hành và xác nhận giao':'trang_thai_HoSo_phat_hanh'}
 for p in root.find('w:body',NS):
  if p.tag!='{'+NS['w']+'}p':continue
  t=txt(p)
  if not p.xpath('.//w:tab',namespaces=NS):
   for label,name in mapping.items():
    if re.match(r'^Hình ',t) and t.endswith(label) and previous is not None:
     blips=previous.xpath('.//a:blip',namespaces=NS)
     if blips:
      data['word/'+rels[blips[0].attrib['{'+NS['r']+'}embed']]]=(assets/(name+'.png')).read_bytes();count+=1
  previous=p
 for row in root.xpath('.//w:tr',namespaces=NS):
  if 'Tom_tat_thuyet_trinh' in txt(row).replace('\u200b',''):row.getparent().remove(row)
 for p in root.find('w:body',NS):
  if p.tag!='{'+NS['w']+'}p':continue
  t=txt(p)
  if t.endswith('Biểu đồ hoạt động của Use case UC16') and previous is not None and not p.xpath('.//w:tab',namespaces=NS):
   blips=previous.xpath('.//a:blip',namespaces=NS)
   if blips:data['word/'+rels[blips[0].attrib['{'+NS['r']+'}embed']]]=(assets/'UC16_hoat_dong.png').read_bytes();count+=1
  previous=p
 assert count==10,count
 data['word/document.xml']=E.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
 with ZipFile(DOC,'w',ZIP_DEFLATED) as z:
  for n,v in data.items():z.writestr(n,v)
 print('Đã thay 9 hình trạng thái, kiến trúc và bỏ hàng tóm tắt trong phụ lục.')
