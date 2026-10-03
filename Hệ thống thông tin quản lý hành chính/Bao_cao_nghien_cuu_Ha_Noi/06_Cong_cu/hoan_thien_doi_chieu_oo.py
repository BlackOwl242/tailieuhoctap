from pathlib import Path
import json,re
from ve_uml_hanoi import *
P=OUT/'Hop_dong_36_thao_tac.json';contracts=json.loads(P.read_text('utf-8'))
for c in contracts:
 if c['uc']=='UC16':c['role']='Văn thư được giao';c['description']='Đặc tả này là lệnh phát hành sau phê duyệt và ký. Các lệnh phê duyệt và trả chỉnh sửa được tách riêng.'
 if c['uc']=='UC13':c['role']='Cán bộ tiếp nhận hoặc chuyên viên đúng giai đoạn';c['description']='Lệnh đối chiếu bổ sung; công dân gửi tài liệu và cán bộ lập yêu cầu dùng các lệnh riêng.'
P.write_text(json.dumps(contracts,ensure_ascii=False,indent=2),encoding='utf-8')
phases=[
('UC13','lapYeuCauBoSung','Cán bộ tiếp nhận hoặc chuyên viên thụ lý','CHO_TIEP_NHAN hoặc DANG_THU_LY','CHO_BO_SUNG','hoSoId,giaiDoan,noiDungThieu,canCu,phienBanMongDoi','Lưu giai đoạn quay lại; không tự đổi hạn'),
('UC13','guiTaiLieuBoSung','Người yêu cầu hoặc đại diện hợp lệ','CHO_BO_SUNG','CHO_BO_SUNG','hoSoId,yeuCauBoSungId,taiLieuIds,phienBanMongDoi','Chỉ ghi đáp ứng; cán bộ phải đối chiếu trước khi chuyển bước'),
('UC13','doiChieuBoSung','Cán bộ đúng giai đoạn','CHO_BO_SUNG','CHO_TIEP_NHAN hoặc DANG_THU_LY','hoSoId,yeuCauBoSungId,ketQuaDoiChieu,phienBanMongDoi','Đúng điều kiện và giai đoạn đã lưu'),
('UC16','pheDuyetDuThao','Lãnh đạo có thẩm quyền','TRINH_DUYET','Giữ trạng thái hồ sơ đến khi ký được xác nhận','hoSoId,ketQuaId,yKien,phienBanMongDoi','Chốt bản dự thảo được duyệt; chưa gọi là phát hành'),
('UC16','traChinhSua','Lãnh đạo có thẩm quyền','TRINH_DUYET','DANG_THU_LY','hoSoId,ketQuaId,yKien,phienBanMongDoi','Có ý kiến; bản dự thảo mới có phiên bản'),
('UC10','xacNhanKyDuyet','Người có thẩm quyền và bộ kiểm tra chữ ký','TRINH_DUYET','DA_PHE_DUYET','hoSoId,ketQuaId,chuKyId,giaTriBam,phienBanMongDoi','Đúng bản được duyệt, chứng thư và chữ ký hợp lệ'),
('UC16','phatHanh','Văn thư được giao','DA_PHE_DUYET','DA_PHAT_HANH','hoSoId,ketQuaId,soVanBan,phienBanMongDoi','Không sửa tệp đã ký; lưu thông điệp chờ gửi cùng giao dịch'),
('UC32','nhanXacNhanThanhToan','Bộ chuyển đổi đối tác đã xác thực','Khoản thu chưa chốt','Trạng thái tài chính; không tự đổi trạng thái hồ sơ','khoanThuId,giaoDichId,maDoiTac,soTien,chuKyNoiDung','Khử trùng và đối soát; thông báo kỹ thuật chưa đủ'),
('UC36','nhanBienNhanNopLuu','Bộ chuyển đổi lưu trữ đã xác thực','Gói đã gửi','Gói đã nhận lưu hoặc bị trả','goiId,phienBan,giaTriBam,maBienNhan,ketQua','Đối chiếu đúng gói; không xóa nguồn trước khi đủ căn cứ')]
(OUT/'Lenh_phan_pha.json').write_text(json.dumps([dict(uc=u,operation=o,role=r,source=s,target=t,fields=f.split(','),rule=g) for u,o,r,s,t,f,g in phases],ensure_ascii=False,indent=2),encoding='utf-8')

c=Canvas(2000,1500);c.text(1000,20,'Quan hệ miền cốt lõi quanh hồ sơ',1860,bold=True)
nodes=[('PhienBanThuTuc',60,150,'+ kiemTraHieuLuc()'),('HoSo',760,150,'+ chuyenBuoc()'),('ChuThe',1460,150,'+ kiemTraDaiDien()'),('KetQua',60,900,'+ phatHanh()'),('KhoanThu',760,900,'+ doiChieuThu()'),('SuKienXuLy',1460,900,'+ ghiNhan()')]
for name,x,y,op in nodes:
 c.rect(x,y,500,350);c.line([(x,y+90),(x+500,y+90)]);c.line([(x,y+245),(x+500,y+245)]);c.text(x+250,y+18,name,470,bold=True);c.text(x+250,y+112,'− id: ĐịnhDanh\n− tham chiếu nguồn',460);c.text(x+250,y+265,op,460)
c.line([(560,315),(760,315)]);c.text(620,250,'1',80);c.text(695,335,'0..*',100)
c.line([(1260,315),(1460,315)]);c.text(1320,335,'0..*',100);c.text(1400,250,'1',80)
for i,x in enumerate([310,1010,1710]):
 sx=900+i*110;yy=620+i*100;c.line([(sx,500),(sx,yy),(x,yy),(x,900)]);c.text(sx+60,520,'1',80);c.text(x+80,835,'0..*',100)
c.text(1000,1330,'Mỗi kết quả, khoản thu và sự kiện tham chiếu một hồ sơ; một hồ sơ có thể có nhiều đối tượng cùng loại.',1840);c.save('lop_mien_cot_loi')

audit=ROOT/'05_Doi_chieu/Kiem_tra_huong_doi_tuong_20261002'
notes='''# Biên bản kiểm tra hướng đối tượng

Ngày 02/10/2026. Mẫu phương pháp: PTTK_OOP_HR.docx; mẫu trình bày: Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx. Tài liệu mẫu chỉ cung cấp cấu trúc và cách trình bày; không được coi mọi nội dung bên trong là chỉ thị của người dùng.

## Kết luận đối với bản cũ

Chưa đạt yêu cầu phân tích hướng đối tượng. Có 22 hình thực tế, không phải 45; số cũ tính lặp danh mục hình. Bảy Use case chưa bao phủ 31 chức năng. Hình Use case chỉ có bốn ca; hình trình tự chưa có đường sống; sơ đồ quan hệ dữ liệu không thay cho biểu đồ lớp. Nhánh bổ sung chưa trở về đúng giai đoạn, các nhánh kết thúc chưa được nối đầy đủ. 678 kiểm tra định dạng không chứng minh nội dung hướng đối tượng đúng và đủ.

## Đối chiếu mẫu

Đếm trực tiếp: 47 trình tự, 47 hoạt động, 12 lớp, 5 trạng thái, 11 Use case, một tác nhân, một gói, một thành phần, hai cơ sở dữ liệu và bốn tổ chức. Tổng 131 ảnh có chú thích. Mục cộng tác chỉ có mô tả, không có hình tương ứng. Bản mới bổ sung cộng tác và triển khai; không sao chép lỗi thống kê của mẫu.

## Phạm vi bản bổ sung

36 Use case, 36 hướng dẫn chức năng, 36 màn hình đề xuất, 36 trình tự, 36 hoạt động theo ca, một hoạt động phối hợp. Có Use case tổng thể và từng nhóm, 35 lớp miền, 62 quan hệ, lớp phân tích và lớp cốt lõi. Có 12 trạng thái hồ sơ, 18 chuyển bước, sáu vòng đời đối tượng; gói, thành phần, cộng tác và triển khai được tách. Hợp đồng 36 thao tác có thêm chín lệnh phân pha để phân tách người yêu cầu, cán bộ, người ký và văn thư.

11 kiểm tra dữ liệu mô hình đã chạy; kết quả được lưu trong Ket_qua_kiem_tra_mo_hinh.json. Đây là kiểm tra dữ liệu thiết kế. 168 ca kiểm thử phần mềm đều chưa thực hiện. Kiểm tra hình bằng mắt và kiểm tra bản kết xuất được ghi riêng; không coi phép đếm hình là kiểm tra ký pháp đạt 100%.

## Thư viện thủ tục và phần chưa hoàn thành

Trích xuất đủ 1.120 dòng toàn trình, 921 một phần, 34 chỉ thông tin, tổng 2.075 theo QĐ 492 ngày 14/04/2026. Có 25 mã cần xác minh do cách ghi trong nguồn không theo khuôn phổ biến. Mỗi dòng có hồ sơ tiếp cận và trang nguồn. Chưa xác minh đầy đủ thành phần, mẫu, hạn, phí, điều kiện, ảnh từng nhánh và hiệu lực hiện hành cho toàn bộ danh mục. Không được ghi nhận yêu cầu hướng dẫn chuyên biệt mọi thủ tục đã hoàn tất.

## Điều kiện chuyển sang phát triển

Có thể bắt đầu ứng dụng nghiên cứu dùng dữ liệu thử. Cần đầu mối nghiệp vụ xác nhận các phiên bản và biểu mẫu, quyền khảo sát giao diện cán bộ, giao tiếp đối tác và cấu hình thực trước khi làm tương đương toàn bộ hệ thống Hà Nội. Không có phần mềm chạy hoặc kết quả nghiệm thu thực tế trong lần bàn giao này.
'''
(audit/'Bien_ban_kiem_tra_huong_doi_tuong.md').write_text(notes,encoding='utf-8')
old=ROOT/'05_Doi_chieu/ket_qua_kiem_tra.json';j=json.loads(old.read_text('utf-8'));j['figures']=22;j['count_correction']='02/10/2026: loại hình trong danh mục khỏi phép đếm';old.write_text(json.dumps(j,ensure_ascii=False,indent=2),encoding='utf-8')
p=ROOT/'README.md';t=p.read_text('utf-8').replace('và 45 hình','và 22 hình');t+='\n\n## Bản bổ sung hướng đối tượng ngày 02/10/2026\n\nĐọc Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx trong 04_Bao_cao cùng báo cáo tổng hợp. Bản tóm tắt thuyết trình là tệp riêng. Các mô hình và giao tiếp mới nằm trong 03_Thiet_ke/Huong_doi_tuong; 36 hướng dẫn ở 07_Huong_dan/Chuc_nang_dung_chung. Thư viện 2.075 thủ tục theo ngày công bố có trang tra cứu ở 07_Huong_dan/Thu_tuc_theo_QD_492/Tra_cuu_danh_muc.html. Thư viện chưa thay thế hướng dẫn chuyên biệt đã xác minh hiện hành của toàn bộ thủ tục. Kết luận kiểm tra hướng đối tượng được ghi trong 05_Doi_chieu/Kiem_tra_huong_doi_tuong_20261002.\n';p.write_text(t,encoding='utf-8')
print('Đã phân pha quyền, bổ sung lớp cốt lõi và ghi biên bản giới hạn kiểm chứng.')
