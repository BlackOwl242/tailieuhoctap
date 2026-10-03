from ve_uml_hanoi import *
from math import ceil
# Giản đồ tổng thể chỉ thể hiện chức năng ở cấp mục tiêu, chi tiết 36 ca có ở từng nhóm.
c=Canvas(2000,1350);c.text(1000,20,'Phạm vi các Use case của hệ thống nghiên cứu',1850,bold=True);c.rect(600,110,1330,1170)
items=[('Người yêu cầu','Kê khai, bổ sung, thanh toán và nhận kết quả'),('Cán bộ xử lý','Tiếp nhận, phân công, thẩm định và phát hành'),('Quản trị được giao','Quyền, danh mục, quy trình và kho tài liệu'),('Lãnh đạo giám sát','Chỉ đạo, thống kê và kiểm tra trách nhiệm'),('Hệ thống đối tác','Xác thực, ký, thanh toán và trao đổi sự kiện')]
for i,(a,t) in enumerate(items):
 y=180+i*220;c.actor(230,y-55,a);c.d.ellipse((720,y,1840,y+150),outline='black',width=3);c.svg.append(f'<ellipse cx="1280" cy="{y+75}" rx="560" ry="75" fill="white" stroke="black" stroke-width="3"/>');c.text(1280,y+22,t,1010);c.line([(270,y+10),(720,y+75)])
c.save('ca_su_dung_tong_the')
# Tách nhóm dài để từng hình đọc được khi in.
for g in [2,4]:
 items=[u for u in MODEL if u['group']==g]
 for i in range(0,len(items),5):usecases(g,items[i:i+5],f'ca_su_dung_nhom_{g}_phan_{i//5+1}')

c=Canvas(2000,1310);c.text(1000,20,'Nhánh bổ sung theo giai đoạn đã ghi nhận',1850,bold=True)
for x,y,t in [(80,180,'CHO_TIEP_NHAN'),(1260,180,'DANG_THU_LY'),(670,690,'CHO_BO_SUNG')]:c.box(x,y,660,155,t,True)
c.line([(410,335),(410,767),(670,767)],arrow=True);c.text(235,385,'yêu cầu bổ sung\n[lưu giai đoạn tiếp nhận]',300)
c.line([(1590,335),(1590,767),(1330,767)],arrow=True);c.text(1750,385,'yêu cầu bổ sung\n[lưu giai đoạn thẩm định]',280)
c.line([(850,690),(850,520),(740,257)],arrow=True);c.text(570,345,'bổ sung đã đối chiếu\n[giai đoạn tiếp nhận]',290)
c.line([(1160,690),(1160,520),(1260,257)],arrow=True);c.text(1420,345,'bổ sung đã đối chiếu\n[giai đoạn thẩm định]',300)
c.text(1000,1040,'Hết hạn phản hồi không mặc nhiên từ chối. Hành động kết thúc phải có căn cứ của từng thủ tục và người có quyền.',1810);c.save('trang_thai_HoSo_bo_sung')

c=Canvas(2000,1430);c.text(1000,20,'Phê duyệt, phát hành và giao kết quả',1870,bold=True)
for x,y,t in [(100,160,'DANG_THU_LY'),(1160,160,'TRINH_DUYET'),(1160,620,'DA_PHE_DUYET'),(100,620,'DA_PHAT_HANH'),(100,1090,'HOAN_THANH')]:c.box(x,y,700,155,t,True)
c.line([(800,237),(1160,237)],arrow=True);c.text(970,345,'trình [đủ căn cứ]',350,size=34)
c.line([(1510,315),(1510,620)],arrow=True);c.text(1730,425,'ký duyệt\n[đúng quyền và bản]',400,size=34)
c.line([(1160,697),(800,697)],arrow=True);c.text(990,440,'phát hành\n[đã kiểm tra chữ ký]',600,size=34)
c.line([(450,775),(450,1090)],arrow=True);c.text(830,875,'xác nhận giao\n[có bằng chứng]',520,size=34)
c.line([(1510,160),(1510,140),(450,140),(450,160)],arrow=True);c.text(1020,75,'trả chỉnh sửa [có ý kiến]',1100,size=34)
c.final(1450,1167);c.line([(800,1167),(1424,1167)],arrow=True)
c.text(1550,900,'Bản đã ký bất biến.\nGửi thông báo chưa đủ\nđể xác nhận đã giao.',750,size=34);c.save('trang_thai_HoSo_phat_hanh')

c=Canvas(2000,1460);c.text(1000,20,'Phối hợp nhiều cơ quan và tổng hợp ý kiến',1870,bold=True);c.circle(1000,110,20,'black');c.line([(1000,130),(1000,180)],arrow=True);c.box(500,180,1000,135,'Lập danh sách ý kiến bắt buộc và hạn phản hồi',True)
c.line([(1000,315),(1000,380)],arrow=True);c.rect(370,380,1260,16,fill='black')
for x,t in [(400,'Nhiệm vụ cơ quan A'),(1200,'Nhiệm vụ cơ quan B')]:
 c.line([(x+200,396),(x+200,480)],arrow=True);c.box(x,480,400,175,t,True);c.line([(x+200,655),(x+200,735)],arrow=True);c.box(x,735,400,175,'Nhận và kiểm tra ý kiến',True);c.line([(x+200,910),(x+200,985)],arrow=True)
c.rect(370,985,1260,16,fill='black');c.line([(1000,1001),(1000,1060)],arrow=True);c.box(420,1060,1160,155,'Tổng hợp khi mọi nhánh bắt buộc hoàn tất hoặc đã xử lý ngoại lệ bằng căn cứ được duyệt',True);c.line([(1000,1215),(1000,1300)],arrow=True);c.final(1000,1325)
c.text(1000,1385,'Sự kiện quá hạn được giám sát riêng; không tự coi cơ quan im lặng là đồng ý.',1880,size=34);c.save('hoat_dong_phoi_hop_song_song')
print('Đã bổ sung tổng thể, nhánh quay lại, phát hành và phối hợp.')
