from pathlib import Path
import re, json, hashlib, subprocess, sys
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
TOOLS=ROOT/'06_Cong_cu'
FIG=ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'
QA=ROOT/'05_Doi_chieu/Sua_bieu_do_va_bien_tap_20261002'
QA.mkdir(exist_ok=True)
DOC=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def wording(s):
 s=s.replace('UCN','UC')
 s=re.sub(r'ca sử dụng','Use case',s,flags=re.I)
 s=re.sub(r'\[R(\d+)\]',r'[\1]',s)
 s=re.sub(r'\bR(\d+)\b',r'[\1]',s)
 return s

if sys.argv[1]=='prepare':
 old={hashlib.sha256(p.read_bytes()).hexdigest():p.name for p in FIG.glob('*.png')}
 (QA/'anh_truoc_sua.json').write_text(json.dumps(old),encoding='utf-8')
 # Thống nhất mã trong dữ liệu và hướng dẫn; không sửa bản nguồn công bố.
 for folder in ['06_Cong_cu','03_Thiet_ke/Huong_doi_tuong','07_Huong_dan','02_Noi_dung']:
  for p in (ROOT/folder).rglob('*'):
   if p.suffix.lower() in {'.py','.md','.json','.csv','.html','.txt','.svg'} and p.name!=Path(__file__).name:
    s=p.read_text('utf-8');t=wording(s)
    if t!=s:p.write_text(t,encoding='utf-8')
 # Công cụ dựng báo cáo không tạo lại tài liệu tóm tắt đã được yêu cầu xóa.
 p=TOOLS/'tao_tai_lieu_huong_doi_tuong.py';s=p.read_text('utf-8')
 pos=s.find("b=Book('Tom_tat_thuyet_trinh")
 if pos>=0:s=s[:pos]+"\n# Chỉ xuất báo cáo phân tích và thiết kế.\n"
 p.write_text(s,encoding='utf-8')
 p=TOOLS/'ve_uml_hanoi.py';s=p.read_text('utf-8');start=s.index('def sequence(u):');end=s.index('\ndef activity(u):',start)
 new='''def sequence(u):
 c=Canvas(2400,3300);xs=[210,680,1160,1660,2160]
 c.text(1200,15,u['id']+' '+u['name'],2280,bold=True)
 actor='Văn thư được giao' if u['id']=='UC16' else u['actor']
 c.actor(xs[0],105,actor)
 labels=[u['screen']+' : Giao diện','dk : Điều khiển', 'dt : '+u['entity'],'kho : Kho dữ liệu']
 for x,lab in zip(xs[1:],labels):c.box(x-200,130,400,180,lab)
 for x in xs:c.line([(x,330),(x,3180)],dash=True)
 # Các thanh thực thi của lời gọi đồng bộ và phản hồi tương ứng.
 for i,a,b in [(1,470,2550),(2,650,2380),(4,850,1010),(3,1190,1350),(3,1670,1850),(4,2030,2190),(1,2860,3030),(2,2830,2860)]:
  c.rect(xs[i]-10,a,20,b-a)
 def msg(a,b,y,t,ret=False):
  width=abs(xs[a]-xs[b])-45
  h=Canvas(2400,3300).text((xs[a]+xs[b])/2,0,t,width,size=48)
  c.line([(xs[a]+(10 if a else 0),y),(xs[b]-(10 if b else 0),y)],dash=ret,arrow=not ret)
  if ret:
   end=xs[b]-(10 if b else 0);sgn=1 if end>xs[a] else -1
   c.line([(end-sgn*20,y-10),(end,y),(end-sgn*20,y+10)])
  c.text((xs[a]+xs[b])/2,y-h-16,t,width,size=48)
 msg(0,1,470,'1. '+('Nhập bộ lọc' if u['read_only'] else 'Gửi dữ liệu'))
 msg(1,2,650,'2. '+u['operation']+'()')
 msg(2,4,850,'3. Đọc dữ liệu trong phạm vi quyền')
 msg(4,2,1010,'4. Dữ liệu và phiên bản',True)
 msg(2,3,1190,'5. Kiểm tra điều kiện')
 msg(3,2,1350,'6. Kết quả kiểm tra',True)
 c.rect(450,1420,1850,1710);c.text(475,1435,'alt',100,bold=True,anchor='start')
 c.text(1400,1435,'['+u['guard']+']',1630,size=48)
 msg(2,3,1670,'7. '+u['operation']+'()')
 msg(3,2,1850,'8. '+('Dữ liệu đã lọc' if u['read_only'] else 'Thay đổi hợp lệ'),True)
 msg(2,4,2030,'9. '+('Ghi nhật ký truy cập' if u['read_only'] else 'Lưu thay đổi, nhật ký và thông điệp chờ gửi'))
 msg(4,2,2190,'10. Xác nhận giao dịch đã lưu',True)
 msg(2,1,2370,'11. '+('Kết quả tra cứu' if u['read_only'] else 'Kết quả và phiên bản'),True)
 msg(1,0,2550,'12. Hiển thị kết quả',True)
 c.line([(450,2610),(2300,2610)],dash=True)
 c.text(1400,2625,'[Điều kiện trên không được đáp ứng]',1630,size=48)
 msg(2,1,2860,'13. Lý do không thực hiện',True)
 msg(1,0,3030,'14. Hiển thị lỗi',True)
 c.text(1200,3200,'Tiền điều kiện: đã xác thực và được phép thực hiện thao tác. Lỗi lưu dữ liệu không được trả thành công.',2240,size=48)
 c.save(u['id']+'_trinh_tu')
'''
 s=s[:start]+new+s[end:]
 s=s.replace("c.text(680,605,'Đủ điều kiện?',275,size=36)","c.text(680,605,'Hợp lệ?',275,size=36)")
 s=s.replace("'Thông báo lý do\\nGiữ dữ liệu đầu vào\\nKhông ghi thay đổi'","'Thông báo lỗi\\nCho phép sửa dữ liệu\\nKhông ghi thay đổi'")
 p.write_text(s,encoding='utf-8')
 print('Chuẩn bị sửa nội dung và mô hình hoàn tất')

elif sys.argv[1]=='document':
 sys.path.insert(0,str(TOOLS));from mo_hinh_huong_doi_tuong import MODEL
 with ZipFile(DOC) as z:data={n:z.read(n) for n in z.namelist()}
 root=E.fromstring(data['word/document.xml']);body=root.find('w:body',NS)
 def text(el):return ''.join(el.xpath('.//w:t/text()',namespaces=NS))
 def settext(el,s):
  ts=el.xpath('.//w:t',namespaces=NS)
  if ts:
   ts[0].text=s
   for t in ts[1:]:t.text=''
 # Loại cả mục đối chiếu tài liệu mẫu, gồm bảng, thay vì chỉ xóa tên tệp.
 removing=False
 for child in list(body):
  t=text(child)
  if child.tag.endswith('}p') and t.startswith('1.3. Đối chiếu mẫu') and not '\t' in t:removing=True
  if removing:
   if child.tag.endswith('}p') and t.startswith('1.4. Phương pháp'):
    removing=False;settext(child,t.replace('1.4.','1.3.',1))
   else:body.remove(child)
 # Xóa hàng bàn giao liên quan đến tóm tắt và kiểm tra mẫu.
 for row in root.xpath('.//w:tr',namespaces=NS):
  if any(x in text(row) for x in ['Tom_tat_thuyet_trinh','Biên bản audit mẫu']):row.getparent().remove(row)
 gi=0
 for p in root.xpath('.//w:p',namespaces=NS):
  t=text(p)
  if t.startswith('Người thực hiện kiểm tra phạm vi cơ quan và phiên bản trước thao tác.'):
   settext(p,MODEL[gi]['exception']+'.');gi+=1;continue
  if any(x in t for x in ['PTTK_OOP_HR','TalentConnect','678 tiêu chí','audit mẫu']):
   p.getparent().remove(p);continue
  # Giữ các trường đánh số và định dạng của từng đoạn.
  ts=p.xpath('.//w:t',namespaces=NS)
  original=''.join(x.text or '' for x in ts)
  edits=[]
  for pattern,repl in [(r'UCN','UC'),(r'ca sử dụng','Use case'),(r'\[R(\d+)\]',lambda m:'['+m[1]+']'),(r'\bR(\d+)\b',lambda m:'['+m[1]+']')]:
   # Thay trên từng nút đủ để giữ trường, sau đó kiểm tra chuỗi nối.
   for node in ts:node.text=re.sub(pattern,repl,node.text or '',flags=re.I if pattern=='ca sử dụng' else 0)
  for node in ts:
   if node.text:node.text=node.text.replace('1.4. Phương pháp','1.3. Phương pháp').replace('tương tác một thao tác','luồng thực hiện')
 # Chèn quy ước một lần ở phần phương pháp.
 for p in root.xpath('.//w:p',namespaces=NS):
  if text(p).startswith('1.3. Phương pháp') and '\t' not in text(p):
   e=E.Element('{'+NS['w']+'}p');r=E.SubElement(e,'{'+NS['w']+'}r');t=E.SubElement(r,'{'+NS['w']+'}t')
   t.text='Các nguồn được dẫn bằng số trong ngoặc vuông, chẳng hạn [1]; số này tương ứng với danh mục tài liệu tham khảo. Mỗi Use case có mã UC và số thứ tự. Màn hình mang mã MH, chức năng dùng chung mang mã CN. Khi thực hiện thao tác, người dùng kiểm tra cơ quan, vai trò và phiên bản dữ liệu. Nếu chưa nhận được kết quả, cần tra cứu mã giao dịch trước khi gửi lại.'
   p.addnext(e);break
 # Đổi ảnh theo ánh xạ nội dung để giữ đúng hình và chú thích.
 old=json.loads((QA/'anh_truoc_sua.json').read_text('utf-8'))
 rel=E.fromstring(data['word/_rels/document.xml.rels']);media_ids={x.get('Id'):'word/'+x.get('Target') for x in rel if x.get('Type','').endswith('/image')}
 replaced={}
 for name,b in list(data.items()):
  if name.startswith('word/media/'):
   asset=old.get(hashlib.sha256(b).hexdigest())
   if asset:
    path=FIG/asset.replace('UCN','UC')
    if path.exists():data[name]=path.read_bytes();replaced[name]=path
 for drawing in root.xpath('.//w:drawing',namespaces=NS):
  ids=drawing.xpath('.//a:blip/@r:embed',namespaces=NS)
  if ids and media_ids.get(ids[0]) in replaced:
   path=replaced[media_ids[ids[0]]];w,h=Image.open(path).size
   ex=drawing.find('.//wp:extent',NS)
   if ex is not None:
    cx=min(int(ex.get('cx')),int(9072*635));cy=int(cx*h/w)
    if cy>10400*635:cy=10400*635;cx=int(cy*w/h)
    ex.set('cx',str(cx));ex.set('cy',str(cy))
    for a in drawing.xpath('.//a:xfrm/a:ext',namespaces=NS):a.set('cx',str(cx));a.set('cy',str(cy))
 data['word/document.xml']=E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
 tmp=DOC.with_suffix('.edited.docx')
 with ZipFile(tmp,'w',ZIP_DEFLATED) as z:
  for n,b in data.items():z.writestr(n,b)
 tmp.replace(DOC)
 # Les anciens fichiers restent hors du rapport; l'index ne propose plus le résumé.
 for p in [ROOT/'README.md',ROOT/'07_Huong_dan/README.md']:
  if p.exists():
   s=wording(p.read_text('utf-8'));s='\n'.join(line for line in s.splitlines() if 'Tom_tat' not in line and 'tóm tắt' not in line.lower());p.write_text(s+'\n',encoding='utf-8')
 (QA/'revision.json').write_text(json.dumps({'replaced_media':len(replaced),'specific_guides':gi,'sequence_count':36,'citation_form':'[1]','use_case_prefix':'UC'},indent=2),encoding='utf-8')
 print('Images remplacées:',len(replaced),'guides:',gi)
