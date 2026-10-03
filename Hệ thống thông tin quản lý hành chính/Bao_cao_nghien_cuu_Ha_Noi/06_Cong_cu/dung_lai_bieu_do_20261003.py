"""Dựng hình với nhãn nghiệp vụ và cách trình bày thống nhất."""
from noi_dung_ro_nghia import DATA,ROOT
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import html,math,json,sys,types
FIG=ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'
AUDIT=[]
SHORT={
1:'Chọn tài khoản|Gửi đề nghị cấp quyền|Kiểm tra người duyệt|Đề nghị đã duyệt|Áp dụng quyền|Đã lưu quyền|Trả danh sách quyền|Hiển thị quyền mới',
2:'Nhập mã và hiệu lực|Gửi nội dung danh mục|Kiểm tra mã trùng|Trả kết quả kiểm tra|Lưu danh mục|Đã lưu danh mục|Trả danh mục mới|Hiển thị danh mục',
3:'Chọn bản cần công bố|Gửi phiên bản mới|Kiểm tra căn cứ|Trả kết quả kiểm tra|Công bố phiên bản|Đã công bố|Trả ngày áp dụng|Hiển thị phiên bản',
4:'Khai báo bước, vai trò|Gửi bản nháp|Kiểm tra quy trình|Trả danh sách lỗi|Lưu bản nháp|Đã lưu bản nháp|Xác nhận bản đã lưu|Hiển thị bản nháp',
5:'Kê khai và chọn tệp|Gửi hồ sơ|Kiểm tra hồ sơ|Trả lỗi hoặc xác nhận|Lưu hồ sơ đã gửi|Mã theo dõi|Trả xác nhận gửi|Hiển thị mã hồ sơ',
6:'Chọn nơi nhận hồ sơ|Gửi yêu cầu chuyển|Kiểm tra tuyến|Trả thông tin bàn giao|Lưu nơi nhận|Đã xác nhận bàn giao|Trả nơi đang xử lý|Hiển thị nơi nhận',
7:'Nhập ý kiến xử lý|Yêu cầu chuyển bước|Kiểm tra công việc|Trả bước được phép|Lưu bước xử lý mới|Đã chuyển bước|Trả trạng thái mới|Hiển thị công việc',
8:'Chọn hồ sơ cần xem|Yêu cầu xem tiến độ|Kiểm tra quyền xem|Trả quyền xem hồ sơ|Đọc lịch sử xử lý|Mốc và thông báo|Trả tiến độ|Hiển thị tiến độ',
9:'Thêm bước và nối nhánh|Gửi sơ đồ kiểm tra|Kiểm tra các nhánh|Trả danh sách lỗi|Lưu sơ đồ|Đã lưu sơ đồ|Trả bản để trình duyệt|Hiển thị sơ đồ',
10:'Chọn bản cần ký|Gửi yêu cầu ký|Đọc bản đã duyệt|Tệp cần ký|Lưu tệp đã ký|Đã lưu bản ký|Trả bản đã ký|Hiển thị bản ký',
11:'Chọn cấu hình ký|Yêu cầu thử kết nối|Đọc cấu hình ký|Thông tin kết nối|Ghi kết quả thử|Đã lưu kết quả thử|Trả kết quả kiểm tra|Hiển thị kết quả thử',
12:'Chọn tiếp nhận hồ sơ|Gửi xác nhận nhận|Kiểm tra hồ sơ|Trả kết quả kiểm tra|Lưu tiếp nhận|Mã hồ sơ, giấy hẹn|Trả giấy hẹn|Hiển thị giấy hẹn',
13:'Lập yêu cầu bổ sung|Gửi yêu cầu|Lưu giai đoạn|Đã lưu yêu cầu|Ghi tài liệu đã đạt|Đã ghi bổ sung|Trả bước tiếp tục|Hiển thị xác nhận',
14:'Chọn chuyên viên|Gửi phân công|Kiểm tra quyền nhận|Trả kết quả kiểm tra|Lưu phân công|Đã phân công|Trả người được giao|Hiển thị người nhận',
15:'Nhập ý kiến thẩm định|Gửi dự thảo|Kiểm tra ý kiến|Trả ý kiến đã nhận|Lưu dự thảo|Đã lưu dự thảo|Trả xác nhận trình|Hiển thị chờ duyệt',
16:'Chọn bản đã ký|Yêu cầu phát hành|Kiểm tra chữ ký|Trả kết quả kiểm tra|Lưu bản phát hành|Đã phát hành|Trả số văn bản|Hiển thị kết quả',
17:'Chọn quyết định dừng|Xác nhận dừng|Kiểm tra quyết định|Trả kết quả kiểm tra|Lưu quyết định dừng|Đã dừng hồ sơ|Trả thông báo dừng|Hiển thị quyết định',
18:'Nhập thông tin giao|Xác nhận đã giao|Kiểm tra người nhận|Trả kết quả kiểm tra|Lưu chứng từ giao|Đã xác nhận giao|Trả tình trạng giao|Hiển thị hoàn thành',
19:'Chọn tài liệu cần in|Yêu cầu xem trước|Lấy dữ liệu và mẫu|Dữ liệu tài liệu|Tạo bản đúng mẫu|Bản sẵn sàng in|Trả bản xem trước|Hiển thị tài liệu',
20:'Chọn người nhận|Yêu cầu gửi tin|Kiểm tra liên hệ|Trả thông tin nhận|Lưu thông báo|Mã thông báo|Trả tình trạng gửi|Hiển thị thông báo',
21:'Nhập từ khóa|Yêu cầu tìm hồ sơ|Kiểm tra quyền|Phạm vi tra cứu|Tìm theo bộ lọc|Hồ sơ phù hợp|Trả danh sách|Hiển thị hồ sơ',
22:'Chọn thủ tục|Yêu cầu tra cứu|Kiểm tra hiệu lực|Nguồn phù hợp|Đọc hướng dẫn|Nội dung văn bản|Trả tài liệu|Hiển thị hướng dẫn',
23:'Chọn mẫu và kỳ|Yêu cầu tổng hợp|Kiểm tra phạm vi|Quy tắc tính|Tổng hợp số liệu|Chỉ tiêu và hồ sơ|Trả báo cáo|Hiển thị số liệu',
24:'Khai báo công thức|Yêu cầu tính thử|Đối chiếu kết quả|Kết quả tính thử|Lưu mẫu đã duyệt|Đã công bố mẫu|Trả ngày áp dụng|Hiển thị mẫu',
25:'Chọn chỉ tiêu|Yêu cầu thống kê|Kiểm tra cách tính|Phạm vi tính|Thống kê hồ sơ|Số liệu cập nhật|Trả thống kê|Hiển thị số liệu',
26:'Chọn đơn vị|Yêu cầu theo dõi|Kiểm tra phạm vi|Cơ quan được xem|Lọc hồ sơ đến hạn|Hồ sơ và người xử lý|Trả công việc|Hiển thị trách nhiệm',
27:'Nhập nội dung chỉ đạo|Gửi chỉ đạo|Kiểm tra nơi nhận|Nơi nhận phù hợp|Lưu chỉ đạo|Mã chỉ đạo|Trả tình trạng nhận|Hiển thị chỉ đạo',
28:'Chọn quyền tài liệu|Yêu cầu đổi quyền|Kiểm tra chủ sở hữu|Căn cứ cho phép|Lưu quyền kho|Đã lưu quyền|Trả danh sách quyền|Hiển thị quyền',
29:'Chọn tài liệu|Yêu cầu dùng lại|Kiểm tra hiệu lực|Tài liệu phù hợp|Gắn vào hồ sơ|Đã thêm tài liệu|Trả thành phần|Hiển thị tệp đã chọn',
30:'Gửi mã và sự kiện|Chuyển thông tin|Kiểm tra mã và nguồn|Sự kiện hợp lệ|Áp dụng sự kiện|Đã ghi một lần|Trả kết quả nhận|Phản hồi bên gửi',
31:'Lấy thông tin chờ gửi|Yêu cầu gửi|Đọc nội dung đã lưu|Nội dung cần gửi|Ghi phản hồi|Tình trạng gửi|Trả kết quả gửi|Hiển thị lần gửi',
32:'Chọn phương thức trả|Yêu cầu thanh toán|Kiểm tra khoản thu|Số tiền phải trả|Lưu giao dịch|Mã và chứng từ|Trả kết quả trả tiền|Hiển thị khoản thu',
33:'Chọn kỳ đối soát|Yêu cầu đối chiếu|Ghép mã và số tiền|Danh sách chênh lệch|Lưu kết quả đối soát|Đã chốt giao dịch|Trả kết quả đối soát|Hiển thị chênh lệch',
34:'Tải tệp quét|Gửi tệp kiểm tra|Kiểm tra trang quét|Kết quả kiểm tra|Lưu tệp đã đối chiếu|Đã lưu tệp|Trả tệp và xác nhận|Hiển thị tài liệu',
35:'Nhập phản ánh|Gửi phản ánh|Kiểm tra nội dung|Nội dung phù hợp|Lưu phản ánh|Mã theo dõi|Trả nơi xử lý|Hiển thị mã phản ánh',
36:'Chọn hồ sơ nộp lưu|Yêu cầu kiểm tra|Đối chiếu danh mục|Kết quả kiểm tra|Lưu biên nhận|Đã nhận lưu|Trả tình trạng lưu|Hiển thị bàn giao'}
ACT={
1:'Quản trị chọn tài khoản|Lập đề nghị về quyền và cơ quan|Người có thẩm quyền xét duyệt|Áp dụng quyền đã được duyệt',
2:'Quản trị chọn danh mục|Nhập mã, tên và ngày áp dụng|Kiểm tra mã trùng và hiệu lực|Công bố danh mục được duyệt',
3:'Quản trị chọn mã thủ tục|Nhập căn cứ và yêu cầu thủ tục|Kiểm tra phiên bản đã được duyệt|Công bố từ ngày áp dụng',
4:'Quản trị mở bản nháp|Khai báo bước xử lý và vai trò|Kiểm tra đường đi và quyền|Lưu bản nháp để trình duyệt',
5:'Người nộp chọn thủ tục, cơ quan|Kê khai và đính kèm tài liệu|Kiểm tra người nộp và tờ khai|Gửi hồ sơ và nhận mã theo dõi',
6:'Cán bộ chọn hồ sơ cần chuyển|Chọn nơi nhận và căn cứ chuyển|Gửi gói và kiểm tra xác nhận|Ghi cơ quan nhận bàn giao',
7:'Chuyên viên mở công việc|Nhập ý kiến và tài liệu xử lý|Kiểm tra điều kiện chuyển bước|Lưu bước xử lý tiếp theo',
8:'Người nộp chọn mã hồ sơ|Xác thực người tra cứu|Kiểm tra quyền xem hồ sơ|Hiển thị tiến độ và thông báo',
9:'Quản trị thêm bước xử lý|Nối nhánh và khai báo điều kiện|Kiểm tra sơ đồ và nhánh đồng thời|Lưu bản nháp để trình duyệt',
10:'Người ký chọn bản đã duyệt|Đọc và xác nhận đúng nội dung|Ký và kiểm tra chữ ký trên tệp|Lưu tệp đã ký hợp lệ',
11:'Quản trị chọn dịch vụ ký|Khai báo cấu hình được cấp|Thử kết nối bằng tài liệu thử|Ghi kết quả và chuyển xét duyệt',
12:'Cán bộ mở hồ sơ chờ nhận|Kiểm tra thẩm quyền và thành phần|Xác nhận tiếp nhận|Cấp mã hồ sơ và giấy hẹn',
14:'Lãnh đạo chọn hồ sơ đã nhận|Chọn chuyên viên được giao|Kiểm tra quyền của chuyên viên|Lưu phân công và giao công việc',
15:'Chuyên viên đối chiếu hồ sơ|Gửi và nhận ý kiến phối hợp|Kiểm tra các ý kiến bắt buộc|Lập dự thảo và trình duyệt',
17:'Cán bộ mở đề nghị dừng|Kiểm tra căn cứ và việc còn lại|Người có thẩm quyền quyết định|Ghi quyết định dừng và thông báo',
18:'Cán bộ chọn kết quả chính thức|Kiểm tra người hoặc địa chỉ nhận|Giao kết quả và lấy chứng từ|Ghi nhận đã giao và hoàn thành',
19:'Cán bộ chọn tài liệu|Lấy dữ liệu và biểu mẫu áp dụng|Kiểm tra bản xem trước|In hoặc tải và ghi lịch sử',
20:'Cán bộ chọn sự kiện cần báo|Chọn người nhận và liên hệ|Kiểm tra nội dung và kênh gửi|Gửi thông báo và theo dõi kết quả',
21:'Người dùng nhập từ khóa|Chọn cơ quan và thời gian|Lọc quyền trước khi tìm hồ sơ|Hiển thị hồ sơ được phép xem',
22:'Cán bộ chọn thủ tục, thời điểm|Nhập nội dung cần tìm|Kiểm tra hiệu lực tài liệu|Đọc hướng dẫn và nguồn văn bản',
23:'Người dùng chọn mẫu và kỳ|Xác định hồ sơ và quy tắc tính|Đối chiếu số liệu tổng hợp|Kết xuất báo cáo có thời điểm lập',
24:'Quản trị tạo mẫu báo cáo|Khai báo cột và công thức|Tính thử và đối chiếu kết quả|Duyệt và công bố mẫu',
25:'Người dùng chọn chỉ tiêu|Chọn cơ quan và thời gian|Kiểm tra phạm vi và cách tính|Hiển thị số liệu kèm ngày cập nhật',
26:'Lãnh đạo chọn đơn vị|Chọn mốc và bộ lọc thời hạn|Kiểm tra phạm vi quản lý|Xem hồ sơ và người chịu trách nhiệm',
27:'Lãnh đạo nhập chỉ đạo|Chọn người nhận và hạn báo cáo|Kiểm tra nơi nhận|Gửi chỉ đạo và theo dõi trả lời',
28:'Quản trị kiểm tra tài liệu|Xác định chủ sở hữu và hiệu lực|Kiểm tra căn cứ cấp quyền|Lưu quyền và lịch sử thay đổi',
29:'Người nộp mở hồ sơ nháp|Chọn tài liệu được phép dùng|Kiểm tra hiệu lực và sự phù hợp|Gắn tài liệu kèm thông tin nguồn',
30:'Hệ thống đối tác gửi sự kiện|Kiểm tra nguồn và tính toàn vẹn|Kiểm tra mã trùng và thứ tự|Áp dụng sự kiện vào đúng hồ sơ',
31:'Lấy thông tin đang chờ gửi|Gửi kèm mã đối chiếu|Kiểm tra phản hồi bên nhận|Ghi kết quả hoặc lịch gửi lại',
32:'Người nộp xem khoản phải trả|Chọn phương thức và thanh toán|Kiểm tra phản hồi giao dịch|Ghi thanh toán và chứng từ',
33:'Tài chính lấy dữ liệu đối soát|Ghép mã giao dịch và khoản thu|Đối chiếu số tiền và trạng thái|Chốt đối soát hoặc đề nghị hoàn',
34:'Cán bộ chọn tài liệu giấy|Quét đủ trang và kiểm tra ảnh|Đối chiếu tệp với tài liệu giấy|Xác nhận và lưu vào hồ sơ',
35:'Người gửi chọn loại phản ánh|Nhập nội dung và liên hệ|Kiểm tra kênh và nội dung|Cấp mã và chuyển đơn vị xử lý',
36:'Lưu trữ chọn hồ sơ hoàn thành|Lập danh mục tệp nộp lưu|Kiểm tra đủ tệp và toàn vẹn|Gửi gói và lưu biên nhận'}
class Drawing:
 def __init__(self,w,h):
  self.w=w;self.h=h;self.im=Image.new('RGB',(w*3,h*3),'white');self.d=ImageDraw.Draw(self.im)
  self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w*3}" height="{h*3}" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="white"/>']
  self.areas=[]
 def line(self,pts,dash=False,arrow=False):
  self.svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in pts)+'" fill="none" stroke="#181818" stroke-width="1"'+(' stroke-dasharray="5 4"' if dash else '')+'/>')
  for (x,y),(xx,yy) in zip(pts,pts[1:]):
   if dash:
    dist=math.hypot(xx-x,yy-y)
    for s in range(0,int(dist),9):
     a=s/max(1,dist);b=min(s+5,dist)/max(1,dist);self.d.line([(3*(x+(xx-x)*a),3*(y+(yy-y)*a)),(3*(x+(xx-x)*b),3*(y+(yy-y)*b))],fill='#181818',width=3)
   else:self.d.line([(x*3,y*3),(xx*3,yy*3)],fill='#181818',width=3)
  if arrow:
   p,q=pts[-2:];ang=math.atan2(q[1]-p[1],q[0]-p[0]);a=(q[0]-10*math.cos(ang)+4*math.sin(ang),q[1]-10*math.sin(ang)-4*math.cos(ang));b=(q[0]-10*math.cos(ang)-4*math.sin(ang),q[1]-10*math.sin(ang)+4*math.cos(ang))
   self.line([a,q,b])
 def rect(self,x,y,w,h,fill='#F1F1F1',radius=0):
  self.d.rounded_rectangle((x*3,y*3,(x+w)*3,(y+h)*3),radius=radius*3,fill=fill,outline='#181818',width=3)
  self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="#181818"/>')
 def circle(self,x,y,r,fill='#E2E2EF'):
  self.d.ellipse(((x-r)*3,(y-r)*3,(x+r)*3,(y+r)*3),fill=fill,outline='#181818',width=3)
  self.svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="#181818"/>')
 def poly(self,pts,fill='#F1F1F1'):
  self.d.polygon([(x*3,y*3) for x,y in pts],fill=fill,outline='#181818',width=3)
  self.svg.append('<polygon points="'+' '.join(f'{x},{y}' for x,y in pts)+f'" fill="{fill}" stroke="#181818"/>')
 def wrap(self,text,width,size,bold=False):
  f=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf',round(size*3));lines=[]
  for raw in text.split('\n'):
   s=''
   for word in raw.split():
    assert self.d.textlength(word,font=f)<=width*3,('Không được bẻ tên hoặc từ',word,width,size)
    candidate=(s+' '+word).strip()
    if s and self.d.textlength(candidate,font=f)>width*3:lines.append(s);s=word
    else:s=candidate
   lines.append(s)
  return lines,f
 def text(self,x,y,text,width=500,size=18,bold=False,align='center',bg=False):
  lines,f=self.wrap(text,width,size,bold);lineh=size*1.25
  for i,s in enumerate(lines):
   ww=self.d.textlength(s,font=f)/3;xx=x-ww/2 if align=='center' else x;yy=y+i*lineh
   assert xx>=0 and xx+ww<=self.w and yy+size<=self.h,(text,xx,yy,self.w,self.h)
   if bg:
    self.d.rectangle(((xx-3)*3,(yy-1)*3,(xx+ww+3)*3,(yy+lineh)*3),fill='white')
    self.svg.append(f'<rect x="{xx-3}" y="{yy-1}" width="{ww+6}" height="{lineh+1}" fill="white"/>')
   self.d.text((xx*3,yy*3),s,font=f,fill='#111111',anchor='lt')
   self.svg.append(f'<text x="{x}" y="{yy+size*.83}" font-family="Arial" font-size="{size}" font-weight="{"bold" if bold else "normal"}" text-anchor="{"middle" if align=="center" else "start"}">{html.escape(s)}</text>')
   self.areas.append((xx,yy,xx+ww,yy+size,text))
  return len(lines)*lineh
 def participant(self,x,y,label,kind,size=18):
  if kind=='actor':
   self.circle(x,y+10,10);self.line([(x,y+20),(x,y+48)]);self.line([(x-17,y+30),(x+17,y+30)]);self.line([(x,y+48),(x-15,y+69)]);self.line([(x,y+48),(x+15,y+69)])
   self.text(x,y+74,label,185,size)
  else:
   yy=y+45;self.circle(x,yy,14)
   if kind=='boundary':self.line([(x-32,yy-16),(x-32,yy+16)]);self.line([(x-32,yy),(x-14,yy)])
   if kind=='control':self.line([(x-7,yy-13),(x-1,yy-17),(x+6,yy-14)],arrow=True)
   if kind=='entity':self.line([(x-18,yy+19),(x+18,yy+19)])
   self.text(x,y+74,label,190,size)
 def final(self,x,y):self.circle(x,y,10,'white');self.circle(x,y,6,'#222222')
 def save(self,name):
  self.im.save(FIG/(name+'.png'));(FIG/(name+'.svg')).write_text('\n'.join(self.svg+['</svg>']),encoding='utf-8')
  AUDIT.append({'name':name,'width':self.w,'height':self.h,'text_count':len(self.areas),'broken_words':0})

def standard_plan(u):
 m=u['messages'];return [(0,1,m[0],False),(1,2,m[1],False),(2,3,m[2],False),(3,2,m[3],True),('alt',u['guard_short']),(2,3,m[4],False),(3,2,m[5],True),(2,1,m[6],True),(1,0,m[7],True),('else',u['error_short']),(2,1,u['error_short'],True),(1,0,'Hiển thị nội dung cần xử lý',True),('end',)]

def plan(u):
 n=u['id'];labs=u['labels'];kinds=['actor','boundary','control','entity'];p=standard_plan(u)
 if n=='UC01':
  labs=['Người quản trị','Người duyệt','Quản lý tài khoản','Xử lý phân quyền','Tài khoản và quyền'];kinds=['actor','actor','boundary','control','entity']
  p=[(0,2,'Lập đề nghị cấp quyền',False),(2,3,'Gửi đề nghị cần xét duyệt',False),(3,4,'Lưu đề nghị và căn cứ',False),(4,3,'Mã đề nghị cấp quyền',True),(3,1,'Chuyển đề nghị đến người duyệt',False),(1,3,'Xác nhận duyệt đề nghị',False),('alt','Đề nghị được duyệt'),(3,4,'Áp dụng quyền đã duyệt',False),(4,3,'Đã lưu quyền mới',True),(3,2,'Trả danh sách quyền hiện tại',True),(2,0,'Hiển thị quyền đã cấp',True),('else','Không được duyệt'),(3,2,'Trả lý do không cấp quyền',True),(2,0,'Hiển thị lý do',True),('end',)]
 if n=='UC13':
  labs=['Cán bộ xử lý','Người nộp','Bổ sung hồ sơ','Xử lý bổ sung','Yêu cầu và tài liệu'];kinds=['actor','actor','boundary','control','entity']
  p=[(0,2,'Lập yêu cầu có căn cứ',False),(2,3,'Gửi nội dung cần bổ sung',False),(3,4,'Lưu yêu cầu và giai đoạn xử lý',False),(4,3,'Đã lưu yêu cầu',True),(3,1,'Thông báo tài liệu cần bổ sung',False),(1,2,'Gửi tài liệu theo yêu cầu',False),(2,3,'Chuyển tài liệu đến cán bộ',False),(3,0,'Yêu cầu kiểm tra tài liệu',False),(0,3,'Ghi kết quả kiểm tra',False),('alt','Tài liệu đáp ứng yêu cầu'),(3,4,'Lưu tài liệu và bước tiếp tục',False),(4,3,'Đã ghi nhận đủ bổ sung',True),(3,2,'Trả xác nhận tài liệu đã đạt',True),(2,1,'Hiển thị hồ sơ tiếp tục xử lý',True),('else','Tài liệu chưa đáp ứng'),(3,2,'Trả nội dung còn thiếu',True),(2,1,'Hiển thị yêu cầu làm rõ',True),('end',)]
 if n=='UC16':
  labs=['Người duyệt','Người ký','Văn thư','Duyệt và\nphát hành','Xử lý\nkết quả','Kết quả\nvà chữ ký'];kinds=['actor','actor','actor','boundary','control','entity']
  p=[(0,3,'Duyệt dự thảo',False),(3,4,'Gửi quyết định duyệt',False),(4,5,'Lưu bản được duyệt',False),(5,4,'Đã lưu phê duyệt',True),(1,3,'Ký bản đã duyệt',False),(3,4,'Gửi bản có chữ ký',False),(4,5,'Kiểm tra và lưu bản ký',False),(5,4,'Chữ ký hợp lệ',True),(2,3,'Cấp số và phát hành',False),(3,4,'Yêu cầu phát hành',False),('alt','Bản ký đủ điều kiện'),(4,5,'Lưu số và bản phát hành',False),(5,4,'Đã phát hành',True),(4,3,'Trả bản chính thức',True),(3,2,'Hiển thị số văn bản',True),('else','Bản ký chưa hợp lệ'),(4,3,'Chưa được phát hành',True),(3,2,'Hiển thị lý do',True),('end',)]
 if n in ['UC10','UC11','UC32','UC31','UC06']:
  partners={'UC10':'Dịch vụ ký số','UC11':'Dịch vụ ký số','UC32':'Đơn vị thanh toán','UC31':'Hệ thống nhận','UC06':'Cơ quan nhận'}
  labs=labs+[partners[n]];kinds+=['control'];m=u['messages']
  calls={'UC10':('Gửi đúng bản cần ký','Tệp đã ký'),'UC11':('Gửi tài liệu thử ký','Tệp thử và kết quả ký'),'UC32':('Tạo yêu cầu thanh toán','Phản hồi giao dịch'),'UC31':('Gửi thông tin và mã đối chiếu','Phản hồi của bên nhận'),'UC06':('Chuyển hồ sơ và tài liệu','Xác nhận đã nhận đủ')}
  a,b=calls[n]
  p=[(0,1,m[0],False),(1,2,m[1],False),(2,3,m[2],False),(3,2,m[3],True),(2,4,a,False),(4,2,b,True),('alt',u['guard_short']),(2,3,m[4],False),(3,2,m[5],True),(2,1,m[6],True),(1,0,m[7],True),('else',u['error_short']),(2,1,u['error_short'],True),(1,0,'Hiển thị tình trạng cần xử lý',True),('end',)]
 if n=='UC15':
  labs=labs+['Cơ quan phối hợp'];kinds+=['actor'];m=u['messages']
  p=[(0,1,'Mở hồ sơ được phân công',False),(1,2,'Yêu cầu dữ liệu thẩm định',False),(2,3,'Đọc hồ sơ và ý kiến đã có',False),(3,2,'Hồ sơ và căn cứ xử lý',True),(0,2,'Lập yêu cầu phối hợp khi cần',False),(2,4,'Gửi nội dung và hạn trả lời',False),(4,2,'Trả ý kiến có xác nhận',False),(0,1,'Lập dự thảo kết quả',False),(1,2,'Gửi dự thảo cần trình duyệt',False),('alt',u['guard_short']),(2,3,'Lưu ý kiến và dự thảo',False),(3,2,'Đã lưu hồ sơ chờ duyệt',True),(2,1,'Trả xác nhận trình duyệt',True),(1,0,'Hiển thị dự thảo đã trình',True),('else',u['error_short']),(2,1,'Trả danh sách ý kiến còn thiếu',True),(1,0,'Hiển thị nội dung cần hoàn thiện',True),('end',)]
 return labs,kinds,p

def sequence(u):
 u={**u,'messages':SHORT[int(u['id'][2:])].split('|')}
 labs,kinds,p=plan(u);count=len(labs);w=900 if count==4 else 1380 if count==6 else 1140;size=20 if count==4 else 24
 xs=[100+i*(w-200)/(count-1) for i in range(count)];probe=Drawing(w,3000);y=205;rows=[];start=end=sep=None
 for item in p:
  if isinstance(item[0],str):
   if item[0]=='alt':start=y;rows.append((y,item));y+=50
   elif item[0]=='else':sep=y;rows.append((y,item));y+=50
   else:end=y;rows.append((y,item));y+=30
  else:
   a,b,t,ret=item;width=abs(xs[a]-xs[b])-24;lines,_=probe.wrap(t,width,size);height=len(lines)*size*1.25;rows.append((y+height,item));y+=height+19
 h=int(y+155);c=Drawing(w,h)
 c.text(w/2,12,'Biểu đồ trình tự '+u['id']+' '+u['name'],w-35,size+3,True)
 for x,lab,kind in zip(xs,labs,kinds):c.participant(x,43,lab,kind,size)
 for x in xs:c.line([(x,188),(x,y+4)],True)
 if start is not None:
  c.rect(18,start-10,w-36,end-start+22,'white')
  # Vẽ đường sống xuyên suốt khung điều kiện.
  for x in xs:c.line([(x,start-10),(x,end+12)],True)
  c.poly([(18,start-10),(87,start-10),(87,start+10),(71,start+25),(18,start+25)],'#F1F1F1');c.text(52,start-4,'alt',58,size,True)
  c.line([(18,sep-5),(w-18,sep-5)],True)
 for yy,item in rows:
  if isinstance(item[0],str):
   if item[0]!='end':c.text(w/2,yy+3,'['+item[1]+']',w-180,size,True,bg=True)
  else:
   a,b,t,ret=item
   if t=='Hiển thị nội dung cần xử lý':t='Hiển thị lỗi cần sửa'
   width=abs(xs[a]-xs[b])-24;lines,_=c.wrap(t,width,size);height=len(lines)*size*1.25
   c.line([(xs[a],yy),(xs[b],yy)],ret,True)
   if not ret:
    direction=1 if xs[b]>xs[a] else -1
    c.poly([(xs[b],yy),(xs[b]-direction*10,yy-4),(xs[b]-direction*10,yy+4)],'#181818')
   c.text((xs[a]+xs[b])/2,yy-height-8,t,width,size,bg=False)
 for x,lab,kind in zip(xs,labs,kinds):c.participant(x,y+15,lab,kind,size)
 c.save(u['id']+'_trinh_tu')

def activity(u):
 # Hai hoạt động nhiều vai trò được dựng riêng bên dưới.
 if u['id']=='UC16':return release(u)
 if u['id']=='UC13':return supplement(u)
 w=950;size=21;cx=350;probe=Drawing(w,3000);steps=ACT[int(u['id'][2:])].split('|');after=2 if u['id']=='UC12' else len(steps)-1
 heights=[max(60,probe.text(500,0,s,530,size)+25) for s in steps];h=int(sum(heights)+len(steps)*35+390);c=Drawing(w,h)
 c.text(w/2,14,'Biểu đồ hoạt động '+u['id']+' '+u['name'],w-40,23,True);c.circle(cx,87,13,'#222222');y=120;prev=100;error_y=0
 for i,(s,bh) in enumerate(zip(steps,heights)):
  c.line([(cx,prev),(cx,y)],arrow=True);c.rect(70,y,560,bh);c.text(cx,y+13,s,530,size);prev=y+bh;y=prev+35
  if i+1==after:
   dy=y+47;c.line([(cx,prev),(cx,dy-50)],arrow=True)
   question={1:'Đã được duyệt?',2:'Mã hợp lệ?',3:'Đủ căn cứ?',4:'Quy trình đúng?',5:'Hồ sơ hợp lệ?',6:'Đúng tuyến?',7:'Được chuyển bước?',8:'Được xem hồ sơ?',9:'Các nhánh đúng?',10:'Chữ ký hợp lệ?',11:'Kết nối được?',12:'Đủ hồ sơ?',14:'Đúng người?',15:'Đủ ý kiến?',17:'Căn cứ hợp lệ?',18:'Đã giao đúng?',19:'Được kết xuất?',20:'Đúng người nhận?',21:'Được tra cứu?',22:'Còn hiệu lực?',23:'Đúng công thức?',24:'Kết quả đúng?',25:'Đúng phạm vi?',26:'Được quản lý?',27:'Có người nhận?',28:'Được cấp quyền?',29:'Được dùng lại?',30:'Sự kiện hợp lệ?',31:'Phản hồi đúng?',32:'Đã xác nhận?',33:'Khớp số liệu?',34:'Đủ trang?',35:'Đúng kênh?',36:'Đủ thành phần?'}[int(u['id'][2:])]
   question={'UC06':'Đã nhận đủ?','UC11':'Kết quả thử đạt?'}.get(u['id'],question)
   c.poly([(cx,dy-50),(cx+130,dy),(cx,dy+50),(cx-130,dy)]);c.text(cx,dy-9,question,210,18)
   c.line([(cx+130,dy),(800,dy),(800,dy+55)],arrow=True);c.text(635,dy-28,'không',85,19)
   error_y=dy+55;eh=max(75,probe.text(500,0,u['error_short'],210,19)+28)
   c.rect(680,error_y,240,eh);c.text(800,error_y+14,u['error_short'],210,19);error_y+=eh
   c.line([(cx,dy+50),(cx,dy+65)]);c.text(cx+34,dy+47,'có',60,19)
   prev=dy+65;y=prev+15
 endy=max(prev+60,error_y+45)
 c.line([(cx,prev),(cx,endy),(475-15,endy)],arrow=True);c.line([(800,error_y),(800,endy),(475+15,endy)],arrow=True)
 c.poly([(475,endy-15),(490,endy),(475,endy+15),(460,endy)],'white');c.line([(475,endy+15),(475,endy+40)],arrow=True);c.final(475,endy+52)
 c.save(u['id']+'_hoat_dong')

def supplement(u):
 c=Drawing(1100,850);c.text(550,15,'Biểu đồ hoạt động UC13 Yêu cầu và nhận bổ sung',1060,25,True)
 for x,lab in [(190,'Cán bộ xử lý'),(550,'Người nộp'),(910,'Hệ thống')]:c.text(x,66,lab,320,23,True)
 for x in [370,730]:c.line([(x,108),(x,817)],True)
 c.circle(190,118,11,'#222222');c.line([(190,129),(190,151)],arrow=True)
 c.rect(40,151,300,90);c.text(190,168,'Nêu nội dung thiếu và căn cứ bổ sung',275,23)
 c.line([(190,241),(190,270),(760,270)],arrow=True);c.rect(760,228,300,95);c.text(910,244,'Lưu giai đoạn xử lý và gửi yêu cầu',275,23)
 c.line([(910,323),(910,354),(567,354)],arrow=True);c.poly([(550,338),(566,354),(550,370),(534,354)],'white');c.line([(550,370),(550,402)],arrow=True)
 c.rect(400,402,300,100);c.text(550,419,'Gửi tài liệu theo yêu cầu đã nhận',275,23)
 c.line([(550,502),(190,502),(190,544)],arrow=True);c.rect(40,544,300,85);c.text(190,560,'Kiểm tra tài liệu bổ sung',270,23)
 c.line([(190,629),(190,660)],arrow=True);c.poly([(190,660),(273,707),(190,754),(107,707)]);c.text(190,694,'Đạt?',100,23)
 c.line([(273,707),(760,707)],arrow=True);c.text(520,675,'có',70,22)
 c.rect(760,665,300,100);c.text(910,684,'Lưu bổ sung và tiếp tục đúng giai đoạn',275,23)
 c.line([(107,707),(20,707),(20,370),(390,370),(390,354),(534,354)],arrow=True);c.text(180,341,'chưa đạt',150,22)
 c.line([(910,765),(910,797)],arrow=True);c.final(910,807);c.save('UC13_hoat_dong')

def release(u):
 c=Drawing(950,1000);c.text(475,15,'Biểu đồ hoạt động UC16 Phê duyệt và phát hành',910,23,True)
 c.circle(350,90,12,'#222222');c.line([(350,102),(350,127)],arrow=True)
 c.rect(70,127,560,65);c.text(350,146,'Lãnh đạo đọc dự thảo và căn cứ',530,22)
 c.line([(350,192),(350,220)],arrow=True);c.poly([(350,220),(445,266),(350,312),(255,266)]);c.text(350,253,'Duyệt?',140,22)
 c.line([(445,266),(800,266),(800,304)],arrow=True);c.text(612,235,'không',90,21)
 c.rect(690,304,225,100);c.text(802,320,'Trả chuyên viên sửa và nêu lý do',200,22)
 c.line([(350,312),(350,360)],arrow=True);c.text(385,320,'có',60,21)
 c.rect(70,360,560,85);c.text(350,377,'Người có thẩm quyền ký bản đã duyệt',530,22)
 c.line([(350,445),(350,478)],arrow=True);c.poly([(350,478),(460,540),(350,602),(240,540)]);c.text(350,529,'Chữ ký hợp lệ?',190,22)
 c.line([(460,540),(800,540),(800,583)],arrow=True);c.text(626,510,'không',90,21)
 c.rect(690,583,225,115);c.text(802,599,'Báo lỗi ký và giữ bản đã duyệt',200,22)
 c.line([(350,602),(350,643)],arrow=True);c.text(385,610,'có',60,21)
 c.rect(70,643,560,85);c.text(350,660,'Văn thư kiểm tra và cấp số văn bản',530,22)
 c.line([(350,728),(350,770)],arrow=True);c.rect(70,770,560,85);c.text(350,788,'Phát hành bản đã ký và lưu lịch sử',530,22)
 c.line([(350,855),(350,909),(465,909)],arrow=True);c.line([(802,404),(935,404),(935,909),(495,909)],arrow=True);c.line([(802,698),(802,872),(480,872),(480,894)],arrow=True)
 c.poly([(480,894),(495,909),(480,924),(465,909)],'white');c.line([(480,924),(480,953)],arrow=True);c.final(480,965);c.save('UC16_hoat_dong')

def wireframe(u):
 c=Drawing(950,520);c.rect(16,16,918,484,'white');c.rect(16,16,918,64);c.text(475,35,u['screen']+' '+u['name'],875,24,True)
 c.rect(36,108,190,335);c.text(131,128,'Thông tin hồ sơ\nCơ quan xử lý\nNgười được giao\nLịch sử thao tác',165,20)
 c.rect(248,108,664,174,'white');c.text(580,124,'Thông tin cần nhập hoặc xem',630,21,True);c.text(580,166,u['inputs'],615,22)
 c.rect(248,305,664,83);c.text(580,328,u['guard_short'],615,22)
 buttons=['Trình duyệt cấp quyền','Lưu danh mục','Công bố phiên bản','Lưu bản nháp','Gửi hồ sơ','Chuyển hồ sơ','Chuyển bước xử lý','Xem tiến độ','Kiểm tra sơ đồ','Ký bản đã duyệt','Thử kết nối ký','Tiếp nhận hồ sơ','Gửi tài liệu bổ sung','Giao công việc','Trình dự thảo','Phát hành bản đã ký','Xác nhận dừng','Xác nhận đã giao','Xem trước và in','Gửi thông báo','Tìm hồ sơ','Tìm hướng dẫn','Lập báo cáo','Trình duyệt mẫu','Xem thống kê','Xem hồ sơ đến hạn','Gửi chỉ đạo','Lưu quyền khai thác','Gắn tài liệu vào hồ sơ','Xem sự kiện đã nhận','Xem lần gửi và phản hồi','Chuyển đến thanh toán','Chốt kết quả đối soát','Xác nhận số hóa','Gửi phản ánh','Gửi gói nộp lưu']
 c.rect(248,410,414,55);c.text(455,425,buttons[int(u['id'][2:])-1],380,21,True)
 c.rect(684,410,228,55);c.text(798,425,'Quay lại',205,21)
 c.text(475,478,'Màn hình đề xuất cho bản thiết kế',865,18);c.save(u['id']+'_man_hinh')

def restyle_other_figures():
 # Nạp định nghĩa hàm, không chạy vòng lặp tự động tạo hình cũ.
 source=(ROOT/'06_Cong_cu/ve_uml_hanoi.py').read_text('utf-8').split('\nfor u in MODEL:')[0]
 source=source.replace("'C:/Windows/Fonts/timesbd.ttf' if bold else 'C:/Windows/Fonts/times.ttf'","'C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf'")
 source=source.replace('font-family="Times New Roman"','font-family="Arial"')
 source=source.replace("def rect(self,x,y,w,h,round=False,fill='white'):","def rect(self,x,y,w,h,round=False,fill='#F1F1F1'):")
 source=source.replace('  if edges:break','')
 source=source.replace(' if edges:\n  a,b,label,nullable=edges[0];x,y=pos[a];xx,yy=pos[b]',' for a,b,label,nullable in edges:\n  x,y=pos[a];xx,yy=pos[b]')
 module=types.ModuleType('ve_uml_hanoi');module.__file__=str(ROOT/'06_Cong_cu/ve_uml_hanoi.py');exec(compile(source,module.__file__,'exec'),module.__dict__)
 module.MODEL=list(DATA.values());module.CLASS_DIAGRAMS=[]
 # Không chèn diễn giải dài vào hình lớp; diễn giải nằm dưới hình trong báo cáo.
 oldtext=module.Canvas.text
 substitutions={'Bội số đặt ở phía đối tượng tương ứng; các quan hệ còn lại được đặc tả trong bảng ánh xạ.':'','Phạm vi các Use case của hệ thống nghiên cứu':'Use case tổng thể','Chuyên biệt hóa trỏ về tác nhân chung; từng quyền vẫn kiểm tra cơ quan và thời gian hiệu lực.':'','Lớp miền ':'Biểu đồ lớp ','HoSo các nhánh tiếp nhận và giải quyết':'Trạng thái tiếp nhận và giải quyết hồ sơ','Vòng đời KetQua':'Trạng thái kết quả','Vòng đời KhoanThu':'Trạng thái khoản thu','Vòng đời NhiemVuPhoiHop':'Trạng thái công việc phối hợp','Vòng đời ThongDiep':'Trạng thái thông tin trao đổi','Vòng đời GoiNopLuu':'Trạng thái gói nộp lưu','Bổ sung quay lại giai đoạn đã lưu. Sau TRINH_DUYET: ký duyệt, phát hành, xác nhận giao.':'','CHỜ THU':'CHỜ THANH TOÁN','phát hành\n[đã kiểm tra chữ ký]':'phát hành\n[chữ ký hợp lệ]','Bản đã ký bất biến.\nGửi thông báo chưa đủ\nđể xác nhận đã giao.':'Bản đã ký được giữ nguyên.\nGiao kết quả được xác nhận riêng.','Vùng tiếp xúc ngoài\nCổng kết nối và xác thực':'Vùng kết nối bên ngoài\nCổng kết nối và xác thực'}
 state_names={'NHAP':'Nháp','CHO_TIEP_NHAN':'Chờ tiếp nhận','CHO_BO_SUNG':'Chờ bổ sung','DA_TIEP_NHAN':'Đã tiếp nhận','DANG_THU_LY':'Đang thụ lý','TRINH_DUYET':'Chờ phê duyệt','TU_CHOI':'Từ chối tiếp nhận','KHONG_GIAI_QUYET':'Không giải quyết','DUNG':'Dừng giải quyết','DA_PHE_DUYET':'Đã ký duyệt','DA_PHAT_HANH':'Đã phát hành','HOAN_THANH':'Hoàn thành'}
 def natural_text(self,x,y,t,*args,**kwargs):
  if t.startswith(('Mũi tên nét đứt chỉ phụ thuộc','Hợp đồng xác thực, dữ liệu','Các kết nối ngoài được tách','Mỗi yêu cầu phối hợp','Các nhánh chạy song song')):return 0
  t=substitutions.get(t,t);t=state_names.get(t,t)
  if t.startswith('Lớp miền '):t=t.replace('Lớp miền ','Biểu đồ lớp ',1)
  if not t:return 0
  return oldtext(self,x,y,t,*args,**kwargs)
 module.Canvas.text=natural_text
 for g in module.GROUPS:module.usecases(g,[u for u in module.MODEL if u['group']==g],f'ca_su_dung_nhom_{g}')
 for g,ks in module.PARTS.items():
  for i in range(0,len(ks),4):module.classes(g,ks[i:i+4],i//4+1)
 sys.modules['ve_uml_hanoi']=module
 for script in ['bo_sung_uml_chuyen_sau.py','them_so_do_quy_trinh.py']:
  exec(compile((ROOT/'06_Cong_cu'/script).read_text('utf-8'),str(ROOT/'06_Cong_cu'/script),'exec'),{'__name__':'restyle','__file__':str(ROOT/'06_Cong_cu'/script)})
 core=(ROOT/'06_Cong_cu/hoan_thien_doi_chieu_oo.py').read_text('utf-8').split('c=Canvas(2000,1500);',1)[1].split('\naudit=',1)[0]
 exec('c=Canvas(2000,1500);'+core,module.__dict__)
 # Phân bố nhãn theo từng đường chuyển, tránh hai nhãn dùng cùng một vị trí.
 c=Drawing(1200,960);c.text(600,16,'Trạng thái tiếp nhận và giải quyết hồ sơ',1160,25,True)
 nodes=[(45,115,'Nháp'),(445,115,'Chờ tiếp nhận'),(845,115,'Chờ bổ sung'),(445,405,'Đã tiếp nhận'),(845,405,'Từ chối tiếp nhận'),(445,625,'Đang thụ lý'),(45,625,'Dừng giải quyết'),(845,625,'Không giải quyết'),(445,835,'Chờ phê duyệt')]
 for x,y,t in nodes:c.rect(x,y,310,70,radius=14);c.text(x+155,y+22,t,280,22)
 c.circle(100,82,11,'#222222');c.line([(100,93),(100,115)],arrow=True)
 for p,q,t,y in [((355,150),(445,150),'Gửi hồ sơ đủ trường',65),((755,150),(845,150),'Yêu cầu bổ sung',65),((445,660),(355,660),'Quyết định dừng',575),((755,660),(845,660),'Có căn cứ không giải quyết',555)]:
  c.line([p,q],arrow=True);c.text((p[0]+q[0])/2,y,t,330,20)
 c.line([(600,185),(600,405)],arrow=True);c.text(465,260,'Hồ sơ hợp lệ',220,21,bg=True)
 c.line([(1000,185),(1000,405)],arrow=True);c.text(1000,260,'Không đủ điều kiện\nCó căn cứ từ chối',300,21,bg=True)
 c.line([(600,475),(600,625)],arrow=True);c.text(660,530,'Đã phân công',240,21,bg=True)
 c.line([(600,695),(600,835)],arrow=True);c.text(710,757,'Đủ ý kiến và dự thảo',360,21,bg=True)
 c.save('trang_thai_HoSo')
 overview()
 # Xóa nhận xét dưới hình bằng cách không vẽ chúng, không xóa tệp nguồn.

def overview():
 c=Drawing(900,608);c.text(450,12,'Use case tổng thể',860,23,True);c.rect(270,49,605,545,'white')
 items=[('Người nộp','Kê khai, bổ sung, thanh toán và nhận kết quả'),('Cán bộ xử lý','Tiếp nhận, phân công, thẩm định và phát hành'),('Người quản trị','Quyền, danh mục, quy trình và kho tài liệu'),('Lãnh đạo','Chỉ đạo, thống kê và kiểm tra trách nhiệm'),('Hệ thống đối tác','Xác thực, ký, thanh toán và trao đổi dữ liệu')]
 for i,(a,t) in enumerate(items):
  y=56+i*106;x=130;c.circle(x,y+8,8);c.line([(x,y+16),(x,y+43)]);c.line([(x-15,y+25),(x+15,y+25)]);c.line([(x,y+43),(x-13,y+61)]);c.line([(x,y+43),(x+13,y+61)]);c.text(x,y+67,a,220,17)
  c.d.ellipse((315*3,(y+14)*3,850*3,(y+92)*3),fill='white',outline='#181818',width=3);c.svg.append(f'<ellipse cx="582.5" cy="{y+53}" rx="267.5" ry="39" fill="white" stroke="#181818"/>');c.text(582,y+29,t,500,19);c.line([(145,y+25),(315,y+53)])
 c.save('ca_su_dung_tong_the')

if __name__=='__main__':
 if len(sys.argv)>1 and sys.argv[1]=='restyle':restyle_other_figures()
 elif len(sys.argv)>1 and sys.argv[1]=='preview':
  sequence(DATA['UC04']);activity(DATA['UC04'])
 else:
  for u in DATA.values():sequence(u);activity(u);wireframe(u)
  restyle_other_figures()
  (ROOT/'05_Doi_chieu/Bien_tap_lai_20261003/Kiem_tra_hinh.json').write_text(json.dumps(AUDIT,ensure_ascii=False,indent=2),encoding='utf-8')
  print('Đã dựng lại',len(AUDIT),'hình của 36 Use case và thống nhất các hình UML còn lại.')
