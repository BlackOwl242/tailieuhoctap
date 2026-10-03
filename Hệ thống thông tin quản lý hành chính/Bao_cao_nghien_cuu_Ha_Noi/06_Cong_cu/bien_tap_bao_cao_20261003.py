from noi_dung_ro_nghia import ROOT,DATA
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
from PIL import Image
from copy import deepcopy
import re,json,hashlib,shutil
DOC=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
QA=ROOT/'05_Doi_chieu/Bien_tap_lai_20261003';FIG=ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}
def tag(x):return '{'+NS['w']+'}'+x
def txt(x):return ''.join(x.xpath('.//w:t/text()',namespaces=NS))
def put(p,s):
 ts=p.xpath('.//w:t',namespaces=NS)
 if ts:
  ts[0].text=s
  for t in ts[1:]:t.text=''
 else:
  r=E.SubElement(p,tag('r'));E.SubElement(r,tag('t')).text=s
def cell(c,lines):
 ps=c.findall(tag('p'));proto=deepcopy(ps[0]);
 for p in ps:c.remove(p)
 for line in lines:
  p=deepcopy(proto);put(p,line);c.append(p)

REWRITE={
'1.2. Đơn vị đếm':'1.2. Phạm vi chức năng và số lượng thủ tục',
'1.3. Phương pháp và mức độ':'1.3. Phương pháp nghiên cứu và phạm vi khảo sát',
'Các nguồn được dẫn bằng số':'Tài liệu dẫn nguồn bằng số trong ngoặc vuông, chẳng hạn [1]. Mỗi số tương ứng với một mục trong danh mục tài liệu tham khảo. UC01 đến UC36 là mã của 36 Use case; MH là mã màn hình, CN là mã chức năng dùng chung. Các mã giúp tìm đúng phần đặc tả, hình minh họa và kịch bản kiểm thử của cùng một chức năng.',
'Một chức năng có thể phục vụ':'Cần phân biệt chức năng của phần mềm với thủ tục hành chính. Chẳng hạn, chức năng tiếp nhận hồ sơ được dùng cho nhiều thủ tục, nhưng mỗi thủ tục có thành phần hồ sơ, thẩm quyền và thời hạn riêng. Báo cáo phân tích 31 chức năng dùng chung và bổ sung 5 chức năng để hình thành 36 Use case. Danh mục 2.075 thủ tục được lấy theo quyết định công bố tại thời điểm ghi trong nguồn [4]; số này không cho biết có bao nhiêu nhánh xử lý đã được cấu hình trong phần mềm.',
'Nguồn được chia theo thời điểm':'Nghiên cứu sử dụng văn bản công bố thủ tục, tài liệu hướng dẫn và các trang có thể truy cập công khai. Với mỗi nguồn, báo cáo ghi thời điểm và nội dung có thể kiểm chứng. Ảnh trong hướng dẫn năm 2023 được dùng để tìm hiểu giao diện trước đây, còn ảnh quan sát năm 2026 thể hiện thông tin công khai tại thời điểm truy cập. Các mô hình lớp, màn hình và hạ tầng ở những chương sau là phương án thiết kế của nghiên cứu; chưa có khảo sát mã nguồn hoặc tài khoản cán bộ để xác nhận kiến trúc bên trong hệ thống.',
'Ký pháp được đối chiếu':'Các biểu đồ sử dụng ký pháp UML theo [8]. Trong biểu đồ trình tự, người hoặc hệ thống bên ngoài được vẽ bằng ký hiệu tác nhân. Các đối tượng giao diện, điều khiển và dữ liệu được phân biệt bằng biểu tượng trên đầu đường sống. Mũi tên liền thể hiện yêu cầu, mũi tên đứt thể hiện phản hồi; các yêu cầu được đọc từ trên xuống dưới. Khung alt chia hai trường hợp theo điều kiện ghi trong ngoặc vuông. Biểu đồ hoạt động dùng hình thoi để chọn nhánh và thanh ngang để tách hoặc hợp các công việc thực hiện đồng thời.',
'Biểu đồ tương tác của mỗi ca':'Mỗi biểu đồ trình tự cho biết ai gửi yêu cầu, bộ phận nào xử lý và kết quả nào được trả lại. UC13 mô tả cả việc cán bộ yêu cầu bổ sung và người nộp gửi tài liệu; UC16 thể hiện lần lượt việc lãnh đạo duyệt, người có thẩm quyền ký và văn thư phát hành. Các bước này có thể diễn ra ở những thời điểm khác nhau. Mỗi người chỉ thực hiện phần việc được giao; phần mềm lưu từng lần xử lý riêng. Khi một cơ quan phối hợp chưa trả lời, hồ sơ vẫn phải được theo dõi, không được coi sự im lặng là ý kiến đồng ý.',
'Thực thể giữ các bất biến':'Thiết kế chia trách nhiệm thành giao diện, xử lý yêu cầu, đối tượng nghiệp vụ và truy xuất dữ liệu. Giao diện nhận thông tin người dùng nhập và hiển thị kết quả. Bộ phận xử lý yêu cầu kiểm tra quyền rồi gọi đối tượng nghiệp vụ phù hợp. Đối tượng hồ sơ quyết định có được chuyển bước hay không; bộ phận truy xuất đọc và lưu dữ liệu. Cách chia này giúp việc đổi màn hình không làm thay đổi quy tắc giải quyết hồ sơ.',
'Các hình lớp trình bày':'Các biểu đồ lớp chọn những thuộc tính, thao tác và quan hệ cần thiết để giải thích thiết kế. Bảng phía sau liệt kê 62 khóa ngoại của mô hình dữ liệu. Ký hiệu 0..* nghĩa là một đối tượng có thể liên kết với nhiều đối tượng ở đầu bên kia, còn 1 nghĩa là phải có đúng một đối tượng. Ví dụ, một hồ sơ có nhiều tài liệu, nhưng mỗi tài liệu được gắn với một hồ sơ xác định. Khi bỏ một bản nháp trên giao diện, hệ thống vẫn phải giữ tài liệu đã ký và lịch sử xử lý theo quy định bảo quản.',
'Gói tổ chức mã theo nghiệp vụ':'Biểu đồ gói phân chia phần thiết kế theo các nhóm chức năng. Biểu đồ thành phần chỉ ra các phần mềm thực hiện những chức năng đó và cách trao đổi dữ liệu. Biểu đồ triển khai đặt các thành phần vào từng vùng hạ tầng. Việc ký số và thanh toán đi qua bộ kết nối riêng, để có thể thay đổi nhà cung cấp mà vẫn giữ quy tắc nghiệp vụ. Sơ đồ hạ tầng là phương án đề xuất, chưa được xác nhận là mô hình triển khai thực tế của Hà Nội.',
'Lõi miền và hợp đồng chung':'Những quy tắc chung về hồ sơ, thẩm quyền và trạng thái được đặt trong phần nghiệp vụ. Các màn hình và bộ kết nối gọi những quy tắc này qua giao diện được quy định trước. Chẳng hạn, bộ báo cáo chỉ đọc dữ liệu đã chốt, không được gọi thao tác chuyển bước hồ sơ. Bộ kết nối thanh toán chỉ cung cấp kết quả đối soát cho phần xử lý khoản thu. Bảng phụ thuộc ghi đầy đủ các quan hệ được phép; biểu đồ gói chỉ chọn một số đường nối để dễ đọc.',
'Trường đối tượng và danh sách cấu trúc':'Các bảng giao tiếp xác định tên thao tác, dữ liệu cần gửi, điều kiện thực hiện và kết quả trả về. Đối với trường chứa tờ khai hoặc danh sách tài liệu, người phát triển còn phải xây dựng cấu trúc chi tiết theo từng thủ tục. Trước khi kết nối dịch vụ thực, cần xác nhận giới hạn tệp, cách kiểm tra chữ ký và quy định trao đổi của đối tác. Các mã phản hồi trong bảng là yêu cầu thiết kế, chưa phải kết quả kiểm thử phần mềm.',
'UC13 và UC16 là mục tiêu':'UC13 và UC16 có nhiều người tham gia nên được chia thành các thao tác theo quyền. Trong UC13, người nộp gửi tài liệu, còn cán bộ kiểm tra tài liệu rồi quyết định tiếp tục xử lý. Trong UC16, lãnh đạo duyệt nội dung, người có thẩm quyền ký, sau đó văn thư phát hành. Bảng trên ghi chín thao tác chi tiết của những quy trình có nhiều bước; các thao tác này vẫn thuộc Use case đã xác định, không được cộng thêm vào tổng số 36 Use case.',
'Bước 1 xác thực người':'Khi nhận yêu cầu chuyển bước, hệ thống xác thực người gửi và kiểm tra quyền đối với hồ sơ. Tiếp theo, hệ thống kiểm tra mã yêu cầu để tránh xử lý hai lần khi người dùng bấm gửi lại. Nếu hồ sơ đã được người khác sửa sau khi màn hình được mở, hệ thống yêu cầu tải lại dữ liệu. Nếu quyền, phiên bản và điều kiện chuyển bước đều phù hợp, hệ thống lưu trạng thái mới cùng người thực hiện và nội dung xử lý. Chỉ khi lưu thành công, màn hình mới báo hoàn tất. Các thông báo cho hệ thống bên ngoài được gửi sau đó; hồ sơ không phải chờ trong một lần lưu dữ liệu cho đến khi đối tác trả lời.',
'Bộ hồ sơ đủ để bắt đầu':'Bản thiết kế có thể dùng làm cơ sở xây dựng các chức năng dùng chung và thử nghiệm bằng hồ sơ giả lập. Để áp dụng cho từng thủ tục thực tế, cần bổ sung tờ khai, quy trình hiện hành, quyền của cán bộ và quy định kết nối của đối tác. Danh mục 2.075 thủ tục mới cung cấp điểm bắt đầu cho việc tra cứu; chưa đủ để đưa toàn bộ danh mục vào vận hành. Việc triển khai phải thực hiện từng nhóm thủ tục đã được cơ quan phụ trách xác nhận.',
'Bộ kiểm thử hướng đối tượng gồm':'Kế hoạch kiểm thử gồm 168 tình huống gắn với 36 Use case. Các tình huống kiểm tra xử lý đúng, thiếu điều kiện, sai quyền, gửi lại yêu cầu và hai người cùng sửa một hồ sơ. Chưa có phần mềm để thực hiện các tình huống này. Nghiên cứu đã chạy 11 kiểm tra đối với dữ liệu mô hình, như mã không trùng, quan hệ tham chiếu hợp lệ và trạng thái có đường chuyển tiếp. Kết quả kiểm tra mô hình không được tính là kết quả kiểm thử phần mềm.',
'Giám sát tách thời gian phản hồi':'Việc vận hành cần theo dõi cả hoạt động phần mềm và tiến độ nghiệp vụ. Nhóm kỹ thuật theo dõi thời gian phản hồi, lỗi dịch vụ và thông tin còn chờ gửi. Nhóm nghiệp vụ theo dõi hồ sơ sắp đến hạn, ý kiến phối hợp chưa nhận và khoản thanh toán chưa đối soát. Máy chủ hoạt động bình thường không có nghĩa là mọi hồ sơ đều được xử lý đúng hạn. Khi kết nối đối tác bị lỗi, đầu mối phụ trách ghi nhận yêu cầu bị ảnh hưởng và tiếp tục xử lý theo phương án đã được phê duyệt.',
'Trạng thái cần tiếp tục:':'Trước khi xây dựng và thí điểm, cần xác minh hiệu lực và quy trình chi tiết của từng thủ tục được chọn. Nghiên cứu chưa khảo sát giao diện cán bộ, chưa thực hiện nộp hồ sơ, ký số hoặc thanh toán trên hệ thống đang vận hành. Các phần cần bổ sung gồm cấu trúc tờ khai, dữ liệu thử được phép sử dụng, quy định kết nối và kết quả kiểm thử phần mềm. Cơ quan phụ trách nghiệp vụ phải xác nhận các nội dung này trước khi nghiệm thu.',
}
SPECIAL={
1:'Người quản trị được giao; người có thẩm quyền duyệt quyền.',
13:'Cán bộ tiếp nhận hoặc chuyên viên thụ lý; người nộp hồ sơ hoặc đại diện hợp lệ.',
15:'Chuyên viên thụ lý; cán bộ của cơ quan được lấy ý kiến.',
16:'Lãnh đạo phê duyệt; người có thẩm quyền ký; văn thư được giao phát hành.',
10:'Người có thẩm quyền ký; dịch vụ ký số.',
32:'Người thanh toán; dịch vụ thanh toán và bộ phận đối soát.'}

REWRITE['Lớp giao diện tiếp nhận']=REWRITE['Thực thể giữ các bất biến']
REWRITE['Hợp đồng 36 thao tác']='Chương này quy định cách các phần của ứng dụng trao đổi dữ liệu qua 36 thao tác. Mỗi thao tác chỉ rõ ai được thực hiện, thông tin cần gửi và cách xử lý lỗi. GET dùng để đọc dữ liệu; POST dùng để yêu cầu thay đổi và phải kèm mã để tránh xử lý lặp. Các địa chỉ trong bảng là đề xuất cho ứng dụng nghiên cứu, chưa phải địa chỉ kết nối của hệ thống Hà Nội. Máy chủ kiểm tra quyền đối với từng yêu cầu, kể cả khi người dùng tự gửi yêu cầu ngoài màn hình.'
if not (QA/'Ban_truoc_bien_tap.docx').exists():shutil.copy2(DOC,QA/'Ban_truoc_bien_tap.docx')
with ZipFile(QA/'Ban_truoc_bien_tap.docx') as z:data={n:z.read(n) for n in z.namelist()}
root=E.fromstring(data['word/document.xml']);body=root.find(tag('body'));uc=None;specs=0;guides=0;remove_next=False
for child in list(body):
 t=txt(child)
 if child.tag==tag('p'):
  if remove_next:
   body.remove(child);remove_next=False;continue
  m=re.search(r'UC(\d{2})',t)
  if m and re.match(r'^UC\d{2}\.',t):uc='UC'+m[1]
  if t.startswith('Hướng dẫn thực hiện theo thiết kế:'):
   assert uc in DATA,(uc,t);put(child,DATA[uc]['explain']);guides+=1;remove_next=True;continue
  if uc in DATA and t==DATA[uc].get('exception','')+'.':body.remove(child);continue
  if not '\t' in t and not t.startswith(('Hình','Bảng')):
   for prefix,new in REWRITE.items():
    if t.startswith(prefix):put(child,new);break
 elif child.tag==tag('tbl'):
  rows=child.findall(tag('tr'))
  if len(rows)>=9 and 'Mã và mục tiêu' in txt(rows[1]):
   assert uc in DATA,(uc,txt(rows[1]));u=DATA[uc];specs+=1
   values={'Mã và mục tiêu':[uc+'. '+u['purpose']], 'Tác nhân chính':[SPECIAL.get(int(uc[2:]),u['actor']+'.')], 'Tiền điều kiện':[u['pre']], 'Luồng chính':[f'{i+1}. {s}' for i,s in enumerate(u['steps'])], 'Ngoại lệ':[u['exception']], 'Hậu điều kiện':[u['post']], 'Truy vết':[f"Màn hình {u['screen']}. Thao tác thiết kế: {u['operation']}. Kịch bản kiểm thử: OO{uc[2:]}A đến OO{uc[2:]}"+('D.' if u['read_only'] else 'E.')]}
   for row in rows:
    cs=row.findall(tag('tc'));k=txt(cs[0])
    if k in values:cell(cs[1],values[k])
assert specs==guides==36,(specs,guides)
# Làm rõ một số nhãn ngắn trong bảng, không sửa tên trường lập trình.
for node in root.xpath('.//w:t',namespaces=NS):
 if node.text:
  node.text=node.text.replace('cửa công dân','trang dành cho người dân').replace('Bốn phạm vi không được đếm lẫn','Phân biệt chức năng, Use case và thủ tục').replace('Mã Use case của bản thiết kế mới','Mã định danh Use case').replace('36 ca, 35 lớp','36 Use case, 35 lớp').replace('Kiểm thử bất biến','Kiểm thử các quy tắc dữ liệu bắt buộc').replace('Khử trùng và đối soát','Loại bỏ phản hồi trùng và đối soát')

fixed={'Phân cấp vai trò cán bộ':'phan_cap_tac_nhan','Use case tổng thể theo mục tiêu':'ca_su_dung_tong_the','Hai nhiệm vụ phối hợp bắt buộc trong UC15':'hoat_dong_phoi_hop_song_song','Phân tách giao diện, điều khiển, thực thể và truy xuất':'lop_phan_tich_tiep_nhan','Quan hệ miền cốt lõi quanh hồ sơ':'lop_mien_cot_loi','Các nhánh tiếp nhận và kết luận':'trang_thai_HoSo','Bổ sung quay lại đúng giai đoạn':'trang_thai_HoSo_bo_sung','Ký duyệt, phát hành và xác nhận giao':'trang_thai_HoSo_phat_hanh','Vòng đời kết quả':'trang_thai_KetQua','Vòng đời khoản thu':'trang_thai_KhoanThu','Vòng đời nhiệm vụ phối hợp':'trang_thai_NhiemVuPhoiHop','Vòng đời thông điệp kết nối':'trang_thai_ThongDiep','Vòng đời gói nộp lưu':'trang_thai_GoiNopLuu','Chín gói chức năng và phụ thuộc':'goi_he_thong','Các thành phần thực thi đề xuất':'thanh_phan_he_thong','Cộng tác đối tượng khi phát hành':'cong_tac_phat_hanh','Các nút triển khai và vùng truy cập đề xuất':'trien_khai_uml'}
rels=E.fromstring(data['word/_rels/document.xml.rels']);media={r.get('Id'):'word/'+r.get('Target') for r in rels if r.get('Type','').endswith('/image')}
replaced={};class_count={};pending=None
for p in body.findall(tag('p')):
 draws=p.xpath('.//w:drawing',namespaces=NS)
 if draws:pending=draws[0]
 t=txt(p)
 if not t.startswith('Hình ') or '\t' in t or pending is None:continue
 title=t.split(': ',1)[-1];name=fixed.get(title)
 m=re.search(r'Use case nhóm (\d)(?:, phần (\d))?',title)
 if m:name='ca_su_dung_nhom_'+m[1]+('_phan_'+m[2] if m[2] else '')
 m=re.search(r'^MH(\d{2})',title)
 if m:name='UC'+m[1]+'_man_hinh'
 m=re.search(r'Biểu đồ (trình tự|hoạt động) của Use case (UC\d{2})',title)
 if m:name=m[2]+('_trinh_tu' if m[1]=='trình tự' else '_hoat_dong')
 m=re.search(r'^Các lớp miền nhóm (\d)',title)
 if m:
  g=m[1];class_count[g]=class_count.get(g,0)+1;name='lop_nhom_'+g+'_'+str(class_count[g])
 if name:
  path=FIG/(name+'.png');assert path.exists(),path
  assert pending is not None,title
  rid=pending.xpath('.//a:blip/@r:embed',namespaces=NS)[0];data[media[rid]]=path.read_bytes();replaced[media[rid]]=name
  w,h=Image.open(path).size;cx=int(9072*635);cy=int(cx*h/w)
  if cy>11500*635:cy=11500*635;cx=int(cy*w/h)
  ex=pending.find('.//wp:extent',NS);ex.set('cx',str(cx));ex.set('cy',str(cy))
  for ext in pending.xpath('.//a:xfrm/a:ext',namespaces=NS):ext.set('cx',str(cx));ext.set('cy',str(cy))
 pending=None
assert len(replaced)==146,len(replaced)
data['word/document.xml']=E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
temp=DOC.with_suffix('.revised.docx')
with ZipFile(temp,'w',ZIP_DEFLATED) as z:
 for n,b in data.items():z.writestr(n,b)
temp.replace(DOC)
out=[{**u,'main':'; '.join(u['steps']),'guard':u['guard_short']} for u in DATA.values()]
(ROOT/'03_Thiet_ke/Huong_doi_tuong/Noi_dung_Use_case_20261003.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
for u in DATA.values():
 guide=ROOT/f"07_Huong_dan/Chuc_nang_dung_chung/{u['id']}.md"
 existing=list(guide.parent.glob(u['id']+'*.md'))
 if existing:guide=existing[0]
 guide.write_text('# '+u['id']+' '+u['name']+'\n\n'+u['explain']+'\n\nĐiều kiện bắt đầu: '+u['pre']+'\n\n'+'\n'.join(f'{i+1}. {s}' for i,s in enumerate(u['steps']))+'\n\nKết quả: '+u['post']+'\n\nTrường hợp cần xử lý: '+u['exception']+'\n',encoding='utf-8')
(QA/'Bien_tap_noi_dung.json').write_text(json.dumps({'specifications':specs,'explanations':guides,'media':replaced,'docx_sha256':hashlib.sha256(DOC.read_bytes()).hexdigest()},ensure_ascii=False,indent=2),encoding='utf-8')
print('Đã biên tập 36 đặc tả, 36 diễn giải và thay 146 hình.')
