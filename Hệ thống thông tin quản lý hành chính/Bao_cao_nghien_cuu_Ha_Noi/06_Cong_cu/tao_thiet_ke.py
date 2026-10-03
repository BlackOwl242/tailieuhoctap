from pathlib import Path
import json, csv, re, html
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'03_Thiet_ke'; OUT.mkdir(parents=True,exist_ok=True)
FIG=OUT/'So_do'; FIG.mkdir(exist_ok=True)
FONT=ImageFont.truetype('C:/Windows/Fonts/times.ttf',34)
BOLD=ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf',36)

tables={
'co_quan':('Cơ quan giải quyết',[
('id','uuid','PK','Không','Định danh cơ quan'),('ma','varchar(50)','UQ','Không','Mã theo danh mục quản lý'),('ten','text','','Không','Tên chính thức'),('cap','varchar(30)','','Không','Cấp hoặc loại cơ quan'),('hieu_luc_tu','date','','Không','Ngày có hiệu lực'),('hieu_luc_den','date','','Có','Kết thúc hiệu lực nếu có')]),
'thu_tuc':('Danh mục thủ tục',[
('id','uuid','PK','Không','Định danh thủ tục'),('ma_quoc_gia','varchar(50)','UQ','Không','Mã thủ tục quốc gia'),('ten','text','','Không','Tên thủ tục'),('linh_vuc','varchar(100)','','Không','Lĩnh vực quản lý')]),
'phien_ban_thu_tuc':('Phiên bản thủ tục',[
('id','uuid','PK','Không','Định danh phiên bản'),('thu_tuc_id','uuid','FK thu_tuc','Không','Thủ tục gốc'),('co_quan_id','uuid','FK co_quan','Không','Cơ quan có thẩm quyền'),('so_phien_ban','integer','','Không','Số phiên bản theo cơ quan'),('quyet_dinh','text','','Không','Quyết định và căn cứ công bố'),('hieu_luc_tu','timestamptz','','Không','Bắt đầu áp dụng'),('hieu_luc_den','timestamptz','','Có','Kết thúc áp dụng'),('quy_tac_han','jsonb','','Không','Kiểu hạn và tham số được duyệt'),('luoc_do_mau','jsonb','','Không','Trường biểu mẫu và phiên bản'),('trang_thai','varchar(30)','','Không','Nháp, duyệt hoặc hết hiệu lực')]),
'chu_the':('Chủ thể giao dịch và hộ tịch',[
('id','uuid','PK','Không','Định danh nội bộ'),('loai','varchar(30)','','Không','Cá nhân hoặc tổ chức'),('ho_ten','text','','Không','Tên chủ thể'),('dinh_danh_ma_hoa','text','','Có','Thông tin định danh đã bảo vệ'),('tham_chieu_dinh_danh','text','','Có','Tham chiếu từ nền tảng xác thực'),('lien_he','jsonb','','Có','Kênh liên hệ được sử dụng')]),
'tai_khoan':('Tài khoản cán bộ',[
('id','uuid','PK','Không','Định danh tài khoản'),('chu_the_id','uuid','FK chu_the','Không','Người sử dụng'),('co_quan_id','uuid','FK co_quan','Không','Cơ quan công tác'),('ma_dang_nhap','varchar(100)','UQ','Không','Tham chiếu danh tính'),('trang_thai','varchar(30)','','Không','Hoạt động hoặc khóa'),('tao_luc','timestamptz','','Không','Thời điểm cấp')]),
'quyen_pham_vi':('Quyền theo phạm vi',[
('id','uuid','PK','Không','Định danh lần cấp quyền'),('tai_khoan_id','uuid','FK tai_khoan','Không','Tài khoản được cấp'),('co_quan_id','uuid','FK co_quan','Không','Phạm vi cơ quan'),('vai_tro','varchar(50)','','Không','Vai trò nghiệp vụ'),('hieu_luc_tu','timestamptz','','Không','Bắt đầu quyền'),('hieu_luc_den','timestamptz','','Có','Hết quyền'),('can_cu','text','','Không','Căn cứ và người phê duyệt')]),
'ho_so':('Hồ sơ hành chính',[
('id','uuid','PK','Không','Định danh nội bộ'),('ma_yeu_cau','varchar(100)','UQ','Không','Khóa gửi lặp an toàn'),('ma_ho_so','varchar(100)','UQ','Có','Mã chính thức sau tiếp nhận'),('phien_ban_id','uuid','FK phien_ban_thu_tuc','Không','Phiên bản áp dụng'),('nguoi_yeu_cau_id','uuid','FK chu_the','Không','Người giao dịch'),('chu_the_ho_tich_id','uuid','FK chu_the','Không','Chủ thể sự kiện hộ tịch'),('trang_thai','varchar(40)','','Không','Trạng thái nghiệp vụ'),('nhan_luc','timestamptz','','Có','Tiếp nhận hợp lệ'),('han_goc','timestamptz','','Có','Hạn ban đầu'),('han_hien_hanh','timestamptz','','Có','Hạn đang áp dụng'),('du_lieu_khai','jsonb','','Không','Nội dung tờ khai có phiên bản'),('phien_ban','integer','','Không','Số kiểm soát cập nhật đồng thời')]),
'uy_quyen':('Căn cứ đại diện',[
('id','uuid','PK','Không','Định danh căn cứ'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ áp dụng'),('nguoi_uy_quyen_id','uuid','FK chu_the','Không','Người được đại diện'),('nguoi_dai_dien_id','uuid','FK chu_the','Không','Người giao dịch'),('quan_he','varchar(100)','','Không','Quan hệ hoặc căn cứ đại diện'),('tai_lieu_tham_chieu','text','','Có','Tài liệu chứng minh nếu áp dụng'),('pham_vi','text','','Không','Phạm vi đại diện'),('hieu_luc_den','timestamptz','','Có','Thời điểm hết hiệu lực')]),
'thanh_phan_ho_so':('Thành phần hồ sơ',[
('id','uuid','PK','Không','Định danh thành phần'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ chủ quản'),('loai','varchar(100)','','Không','Loại giấy tờ hoặc dữ liệu'),('khoa_doi_tuong','text','','Có','Khóa tệp trong kho'),('bam_sha256','char(64)','','Có','Kiểm tra tính toàn vẹn tệp'),('nguon_du_lieu','text','','Có','Nguồn khai thác thay thế giấy tờ'),('tham_chieu_nguon','text','','Có','Định danh bản ghi nguồn'),('trang_thai','varchar(40)','','Không','Cần cung cấp, hợp lệ hoặc chờ kiểm tra'),('phien_ban','integer','','Không','Phiên bản thành phần')]),
'phan_cong':('Phân công xử lý',[
('id','uuid','PK','Không','Định danh phân công'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ chịu trách nhiệm'),('tai_khoan_id','uuid','FK tai_khoan','Không','Cán bộ được giao'),('giao_luc','timestamptz','','Không','Bắt đầu trách nhiệm'),('ket_thuc_luc','timestamptz','','Có','Kết thúc lần phân công'),('nguoi_giao_id','uuid','FK tai_khoan','Không','Người quyết định'),('ly_do','text','','Không','Căn cứ phân công hoặc thay đổi')]),
'su_kien_xu_ly':('Sự kiện xử lý',[
('id','uuid','PK','Không','Định danh sự kiện'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ liên quan'),('tai_khoan_id','uuid','FK tai_khoan','Có','Cán bộ nếu có'),('hanh_dong','varchar(100)','','Không','Loại hành động'),('truoc','varchar(40)','','Có','Trạng thái trước'),('sau','varchar(40)','','Có','Trạng thái sau'),('thoi_diem','timestamptz','','Không','Thời điểm máy chủ'),('can_cu','text','','Có','Lý do và chứng từ tham chiếu'),('ma_tuong_quan','varchar(100)','','Không','Liên hệ giao dịch kỹ thuật')]),
'yeu_cau_bo_sung':('Yêu cầu bổ sung',[
('id','uuid','PK','Không','Định danh lần yêu cầu'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ liên quan'),('giai_doan','varchar(40)','','Không','Tiếp nhận hoặc thẩm định'),('noi_dung','text','','Không','Thông tin cần bổ sung cụ thể'),('can_cu','text','','Không','Cơ sở yêu cầu'),('nguoi_lap_id','uuid','FK tai_khoan','Không','Người lập'),('lap_luc','timestamptz','','Không','Thời điểm phát sinh'),('phan_hoi_luc','timestamptz','','Có','Nhận bổ sung'),('trang_thai_quay_lai','varchar(40)','','Không','Giai đoạn tiếp tục khi đủ')]),
'ket_qua':('Phiên bản kết quả',[
('id','uuid','PK','Không','Định danh bản kết quả'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ chủ quản'),('so_phien_ban','integer','','Không','Phiên bản kết quả'),('khoa_doi_tuong','text','','Không','Tệp dự thảo hoặc phát hành'),('bam_sha256','char(64)','','Không','Giá trị toàn vẹn'),('so_van_ban','varchar(100)','','Có','Số sau phát hành'),('trang_thai','varchar(40)','','Không','Dự thảo, ký hoặc phát hành'),('thay_the_id','uuid','FK ket_qua','Có','Bản được thay thế'),('phat_hanh_luc','timestamptz','','Có','Thời điểm phát hành')]),
'chu_ky':('Bằng chứng chữ ký',[
('id','uuid','PK','Không','Định danh bằng chứng'),('ket_qua_id','uuid','FK ket_qua','Không','Bản có chữ ký'),('nguoi_ky','text','','Không','Thông tin chủ thể chứng thư'),('tham_chieu_chung_thu','text','','Không','Chứng thư kiểm tra'),('ky_luc','timestamptz','','Có','Thời điểm được xác định từ bằng chứng'),('kiem_tra_luc','timestamptz','','Không','Thời điểm kiểm tra'),('ket_luan','varchar(40)','','Không','Hợp lệ hoặc cần xử lý'),('bang_chung','jsonb','','Không','Chuỗi kiểm tra và trạng thái liên quan')]),
'khoan_thu':('Khoản thu và miễn giảm',[
('id','uuid','PK','Không','Định danh khoản thu'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ liên quan'),('loai','varchar(100)','','Không','Phí, lệ phí hoặc khoản áp dụng'),('so_tien','numeric(18,2)','','Không','Số phải thu không âm'),('don_vi_tien','char(3)','','Không','Đơn vị tiền tệ'),('can_cu','text','','Không','Biểu phí, miễn hoặc giảm'),('trang_thai','varchar(40)','','Không','Chờ thu, đủ, miễn hoặc hoàn')]),
'giao_dich':('Giao dịch và đối soát',[
('id','uuid','PK','Không','Định danh giao dịch'),('khoan_thu_id','uuid','FK khoan_thu','Không','Khoản thu liên quan'),('doi_tac','varchar(100)','','Không','Nguồn thông báo'),('ma_ngoai','varchar(150)','','Không','Mã giao dịch bên ngoài'),('so_tien','numeric(18,2)','','Không','Số tiền không âm'),('thoi_diem','timestamptz','','Không','Thời điểm ghi nhận'),('trang_thai','varchar(40)','','Không','Nhận, đối soát hoặc hoàn'),('tham_chieu_bang_chung','text','','Không','Chứng từ hoặc thông báo đã xác minh')]),
'giao_nhan':('Chứng cứ giao kết quả',[
('id','uuid','PK','Không','Định danh giao nhận'),('ket_qua_id','uuid','FK ket_qua','Không','Kết quả được giao'),('nguoi_nhan_id','uuid','FK chu_the','Không','Chủ thể có quyền nhận'),('kenh','varchar(50)','','Không','Kho, trực tiếp hoặc bưu chính'),('trang_thai','varchar(40)','','Không','Chưa giao, đã giao hoặc lỗi'),('thoi_diem','timestamptz','','Có','Mốc giao xác nhận'),('bang_chung','text','','Có','Mã giao hoặc chứng từ liên quan')]),
'hang_doi_gui':('Hàng đợi tích hợp',[
('id','uuid','PK','Không','Định danh thông điệp'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ liên quan'),('ma_thong_diep','varchar(150)','UQ','Không','Mã giữ nguyên khi gửi lại'),('dich_nhan','varchar(150)','','Không','Đích tích hợp'),('noi_dung','jsonb','','Không','Dữ liệu cần gửi theo hợp đồng'),('trang_thai','varchar(40)','','Không','Chờ, đã gửi hoặc cần xử lý'),('so_lan_thu','integer','','Không','Số lần gửi không âm'),('thu_tiep_luc','timestamptz','','Có','Mốc gửi tiếp'),('ma_loi','varchar(100)','','Có','Lỗi đã chuẩn hóa')]),
'lich_lam_viec':('Lịch và ngoại lệ',[
('id','uuid','PK','Không','Định danh lịch'),('co_quan_id','uuid','FK co_quan','Không','Cơ quan áp dụng'),('ngay','date','','Không','Ngày lịch'),('la_ngay_lam','boolean','','Không','Có làm việc hay không'),('bat_dau','time','','Có','Giờ bắt đầu nếu có'),('ket_thuc','time','','Có','Giờ đóng ngày'),('can_cu','text','','Không','Căn cứ xác định lịch')]),
'nhat_ky':('Nhật ký quản trị',[
('id','uuid','PK','Không','Định danh sự kiện kiểm tra'),('tai_khoan_id','uuid','FK tai_khoan','Có','Tài khoản tác động'),('hanh_dong','varchar(100)','','Không','Loại thao tác'),('doi_tuong','text','','Không','Định danh đối tượng; không sao chép nội dung hồ sơ'),('thoi_diem','timestamptz','','Không','Thời điểm máy chủ'),('ket_qua','varchar(40)','','Không','Thành công hoặc bị từ chối'),('ma_tuong_quan','varchar(100)','','Không','Liên hệ giao dịch')])
}
tables['ho_so'] = (tables['ho_so'][0], [
 (name,typ,key,'Có','Chủ thể sự kiện hộ tịch khi thủ tục yêu cầu') if name=='chu_the_ho_tich_id' else (name,typ,key,null,desc)
 for name,typ,key,null,desc in tables['ho_so'][1]
] + [('kenh_tiep_nhan','varchar(30)','','Không','Trực tuyến, trực tiếp hoặc bưu chính'),('ma_diem_tiep_nhan','varchar(50)','','Có','Điểm tiếp nhận thực tế theo danh mục'),('nguoi_ho_tro_id','uuid','FK tai_khoan','Có','Người hỗ trợ; không thay người giao dịch')])
tables.update({
 'he_thong_ket_noi':('Hệ thống kết nối',[
 ('id','uuid','PK','Không','Định danh hệ thống'),('ma','varchar(50)','UQ','Không','Mã nguồn theo hợp đồng'),('ten','text','','Không','Tên nền tảng'),('loai','varchar(30)','','Không','Thành phố, bộ, quốc gia hoặc đối tác'),('chu_quan','text','','Không','Đơn vị chịu trách nhiệm'),('phien_ban_hop_dong','varchar(30)','','Không','Phiên bản giao tiếp'),('trang_thai','varchar(30)','','Không','Được phép, thử hoặc ngừng')]),
 'tuyen_xu_ly':('Tuyến tác nghiệp theo phiên bản',[
 ('id','uuid','PK','Không','Định danh tuyến'),('phien_ban_id','uuid','FK phien_ban_thu_tuc','Không','Phiên bản thủ tục'),('he_thong_id','uuid','FK he_thong_ket_noi','Không','Hệ thống được xử lý'),('hieu_luc_tu','timestamptz','','Không','Bắt đầu tuyến'),('hieu_luc_den','timestamptz','','Có','Kết thúc tuyến'),('can_cu','text','','Không','Quyết định áp dụng'),('phe_duyet_id','uuid','FK tai_khoan','Không','Người phê duyệt')]),
 'tham_chieu_lien_thong':('Tham chiếu hồ sơ liên thông',[
 ('id','uuid','PK','Không','Định danh tham chiếu'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ dùng chung'),('he_thong_id','uuid','FK he_thong_ket_noi','Không','Hệ thống nguồn'),('ma_ngoai','varchar(150)','','Không','Mã hồ sơ tại nguồn'),('trang_thai_nguon','varchar(40)','','Không','Trạng thái do nguồn công bố'),('su_kien_cuoi','varchar(150)','','Có','Mã sự kiện cuối áp dụng'),('thoi_diem_nguon','timestamptz','','Không','Mốc nghiệp vụ của nguồn'),('nhan_luc','timestamptz','','Không','Mốc nhận tại địa phương')]),
 'nhiem_vu_phoi_hop':('Nhiệm vụ phối hợp thẩm định',[
 ('id','uuid','PK','Không','Định danh nhiệm vụ'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ cần ý kiến'),('co_quan_id','uuid','FK co_quan','Không','Cơ quan được hỏi'),('noi_dung','text','','Không','Phạm vi yêu cầu'),('bat_buoc','boolean','','Không','Ý kiến bắt buộc theo quy trình'),('han_tra_loi','timestamptz','','Không','Hạn nhiệm vụ, không thay hạn hồ sơ'),('trang_thai','varchar(40)','','Không','Chờ nhận, xử lý, đã trả hoặc hủy'),('tham_chieu_y_kien','text','','Có','Tài liệu và phiên bản trả lời')]),
 'thong_bao':('Thông báo và trạng thái gửi',[
 ('id','uuid','PK','Không','Định danh thông báo'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ liên quan'),('nguoi_nhan_id','uuid','FK chu_the','Không','Chủ thể có quyền nhận'),('kenh','varchar(30)','','Không','Kênh đã được phép sử dụng'),('ma_mau','varchar(50)','','Không','Mẫu nội dung đã duyệt'),('tham_chieu_gui','text','','Có','Mã đối tác, không lưu bí mật truy cập'),('trang_thai','varchar(30)','','Không','Chờ, gửi, giao hoặc lỗi'),('gui_luc','timestamptz','','Có','Mốc gửi thực tế')]),
 'dot_nop_luu':('Đợt nộp lưu hồ sơ',[
 ('id','uuid','PK','Không','Định danh đợt'),('co_quan_id','uuid','FK co_quan','Không','Đơn vị nộp'),('lap_luc','timestamptz','','Không','Mốc lập danh mục'),('phe_duyet_id','uuid','FK tai_khoan','Có','Người duyệt nộp'),('kho_dich','text','','Không','Đầu mối lưu trữ nhận'),('trang_thai','varchar(30)','','Không','Nháp, gửi, nhận hoặc cần bổ sung')]),
 'ho_so_nop_luu':('Hồ sơ và bằng chứng nộp lưu',[
 ('id','uuid','PK','Không','Định danh lần nộp'),('dot_id','uuid','FK dot_nop_luu','Không','Đợt nộp lưu'),('ho_so_id','uuid','FK ho_so','Không','Hồ sơ được nộp'),('ma_goi','varchar(100)','UQ','Không','Mã gói có phiên bản'),('bam_danh_muc','char(64)','','Không','Toàn vẹn danh mục thành phần'),('tham_chieu_bien_nhan','text','','Có','Biên nhận của kho đích'),('trang_thai','varchar(30)','','Không','Chờ kiểm tra, được nhận hoặc trả lại'),('nhan_luc','timestamptz','','Có','Mốc được kho xác nhận')]),
 'phan_anh_kien_nghi':('Phản ánh và đánh giá phục vụ',[
 ('id','uuid','PK','Không','Định danh phản ánh'),('ho_so_id','uuid','FK ho_so','Có','Hồ sơ nếu có quan hệ'),('chu_the_id','uuid','FK chu_the','Có','Chủ thể nếu có thông tin hợp lệ'),('loai','varchar(40)','','Không','Phản ánh, đánh giá hoặc chuyển quy trình khác'),('noi_dung','text','','Không','Nội dung được bảo vệ'),('co_quan_id','uuid','FK co_quan','Có','Đơn vị được giao trả lời'),('trang_thai','varchar(30)','','Không','Nhận, phân loại, xử lý hoặc trả lời'),('tao_luc','timestamptz','','Không','Mốc nhận')]),
 'thong_diep_nhan':('Thông điệp nhận và chống lặp',[
 ('id','uuid','PK','Không','Định danh nội bộ'),('he_thong_id','uuid','FK he_thong_ket_noi','Không','Nguồn đã xác thực'),('ma_thong_diep','varchar(150)','','Không','Mã sự kiện bên ngoài'),('bam_noi_dung','char(64)','','Không','So sánh nội dung gửi lại'),('ho_so_id','uuid','FK ho_so','Có','Liên kết sau khi xác định hồ sơ'),('trang_thai','varchar(30)','','Không','Nhận, áp dụng, trùng hoặc cần đối chiếu'),('nhan_luc','timestamptz','','Không','Mốc nhận'),('ma_loi','varchar(100)','','Có','Lỗi xác thực hoặc nghiệp vụ')])
})
for entity,fields in {
 'phien_ban_thu_tuc':[('cau_hinh_quy_trinh','jsonb','','Không','Bước, quyền, điều kiện, nhánh và phiên bản được duyệt')],
 'thanh_phan_ho_so':[('kich_thuoc_byte','bigint','','Có','Kích thước nếu thành phần là tệp'),('loai_tep','varchar(100)','','Có','Loại tệp được kiểm tra từ nội dung')],
 'ket_qua':[('kich_thuoc_byte','bigint','','Không','Kích thước bản kết quả'),('loai_tep','varchar(100)','','Không','Loại tệp kết quả được kiểm tra')],
 'tham_chieu_lien_thong':[('thu_tu_cuoi','bigint','','Có','Thứ tự sự kiện cuối đã áp dụng theo hợp đồng')],
 'nhiem_vu_phoi_hop':[('phien_ban','integer','','Không','Kiểm soát cập nhật nhiệm vụ đồng thời')],
 'thong_diep_nhan':[('thu_tu_nguon','bigint','','Không','Thứ tự trong luồng hồ sơ tại nguồn'),('thoi_diem_nguon','timestamptz','','Không','Mốc phát sinh nghiệp vụ tại nguồn'),('loai_su_kien','varchar(40)','','Không','Loại sự kiện theo hợp đồng'),('ma_ho_so_ngoai','varchar(150)','','Không','Mã để xác định hồ sơ ở nguồn'),('tham_chieu_noi_dung','text','','Không','Nội dung được bảo vệ để áp dụng và kiểm chứng')]
}.items():tables[entity]=(tables[entity][0],tables[entity][1]+fields)
from bo_sung_mo_hinh_nhanh import extend
tables=extend(tables)
(OUT/'Tu_dien_du_lieu.json').write_text(json.dumps(tables,ensure_ascii=False,indent=2),encoding='utf-8')
md=[]; sql=['/* Thiết kế đề xuất. Không phải lược đồ nội bộ của Hà Nội. */','/* Cần xác nhận nghiệp vụ và an toàn trước triển khai. */']
for k,(title,fields) in tables.items():
 md += [f'Bảng 4.0: Từ điển dữ liệu {title.lower()}','', '| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |','| --- | --- | --- | --- | --- |']
 md += ['| '+' | '.join(f)+' |' for f in fields];md += ['']
 cols=[]
 for name,typ,key,null,desc in fields:
  s=f'    {name} {typ}'+(' NOT NULL' if null=='Không' else '')
  if key=='PK':s+=' PRIMARY KEY'
  if key=='UQ':s+=' UNIQUE'
  if key.startswith('FK '):s+=' REFERENCES '+key[3:]+'(id)'
  if name=='phien_ban' or name=='so_phien_ban':s+=f' CHECK ({name} > 0)'
  if name in ['thu_tu_cuoi','thu_tu_nguon']:s+=f' CHECK ({name} > 0)'
  if name in ['so_tien','so_lan_thu']:s+=f' CHECK ({name} >= 0)'
  if name=='kich_thuoc_byte':s+=f' CHECK ({name} >= 0)'
  cols.append(s)
 if k=='phien_ban_thu_tuc':cols+=['    UNIQUE (thu_tuc_id, co_quan_id, so_phien_ban)','    CHECK (hieu_luc_den IS NULL OR hieu_luc_den > hieu_luc_tu)']
 if k=='ket_qua':cols+=['    UNIQUE (ho_so_id, so_phien_ban)']
 if k=='giao_dich':cols+=['    UNIQUE (doi_tac, ma_ngoai)']
 if k=='lich_lam_viec':cols+=['    UNIQUE (co_quan_id, ngay)']
 if k=='tham_chieu_lien_thong':cols+=['    UNIQUE (he_thong_id, ma_ngoai)', '    UNIQUE (ho_so_id, he_thong_id)']
 if k=='thong_diep_nhan':cols+=['    UNIQUE (he_thong_id, ma_thong_diep)']
 if k=='tuyen_xu_ly':cols+=['    CHECK (hieu_luc_den IS NULL OR hieu_luc_den > hieu_luc_tu)']
 if k=='mau_bao_cao':cols+=['    UNIQUE (ma, so_phien_ban)']
 if k in ['diem_tiep_nhan','mau_bao_cao','tai_lieu_huong_dan','tai_lieu_kho','quyen_khai_thac_kho']:cols+=['    CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den > hieu_luc_tu)']
 sql+=['CREATE TABLE '+k+' (',',\n'.join(cols),');','']
sql+=['CREATE INDEX ix_ho_so_xu_ly ON ho_so (trang_thai, han_hien_hanh);','CREATE INDEX ix_su_kien ON su_kien_xu_ly (ho_so_id, thoi_diem);','CREATE UNIQUE INDEX uq_phan_cong_hien_hanh ON phan_cong (ho_so_id) WHERE ket_thuc_luc IS NULL;']
(OUT/'Tu_dien_du_lieu.md').write_text('\n'.join(md),encoding='utf-8')
(OUT/'Mo_hinh_du_lieu.sql').write_text('\n'.join(sql),encoding='utf-8')

def diagram(name,nodes,edges,title,size=(2000,1050)):
 im=Image.new('RGB',size,'white'); dr=ImageDraw.Draw(im)
 svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{size[0]}" height="{size[1]}" viewBox="0 0 {size[0]} {size[1]}">','<rect width="100%" height="100%" fill="white"/>','<defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="black"/></marker></defs>']
 def text(x,y,s,b=False):
  f=BOLD if b else FONT
  for j,line in enumerate(s.split('\n')):
   dr.text((x,y+j*43),line,font=f,fill='black',anchor='mt')
   svg.append(f'<text x="{x}" y="{y+j*43+31}" text-anchor="middle" font-family="Times New Roman" font-size="34" font-weight="'+('bold' if b else 'normal')+'">'+html.escape(line)+'</text>')
 text(size[0]/2,15,title,True)
 for a,b,label in edges:
  aa=nodes[a];bb=nodes[b]; ax=aa[0]+aa[2]/2;ay=aa[1]+aa[3]/2;bx=bb[0]+bb[2]/2;by=bb[1]+bb[3]/2
  if abs(bx-ax)>abs(by-ay):
   x1=aa[0]+aa[2] if bx>ax else aa[0];x2=bb[0] if bx>ax else bb[0]+bb[2];y1=ay;y2=by
  else:
   x1=ax;x2=bx;y1=aa[1]+aa[3] if by>ay else aa[1];y2=bb[1] if by>ay else bb[1]+bb[3]
  import math
  ang=math.atan2(y2-y1,x2-x1)
  paired=any(aa==b and bb==a for aa,bb,_ in edges)
  if paired:
   ox=-math.sin(ang)*38;oy=math.cos(ang)*38
   x1+=ox;x2+=ox;y1+=oy;y2+=oy
  dr.line((x1,y1,x2,y2),fill='black',width=3)
  pts=[(x2,y2),(x2-16*math.cos(ang-.4),y2-16*math.sin(ang-.4)),(x2-16*math.cos(ang+.4),y2-16*math.sin(ang+.4))];dr.polygon(pts,fill='black')
  svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="black" stroke-width="3" marker-end="url(#a)"/>')
  if label:
   lx=(x1+x2)/2;ly=(y1+y2)/2-50
   if name=='03_quy_trinh' and label=='Chưa đủ điều kiện':ly=aa[1]-65
   if paired:
    lx+=-math.sin(ang)*65;ly+=math.cos(ang)*65
   bounds=dr.textbbox((lx,ly),label,font=FONT,anchor='mt')
   dr.rectangle((bounds[0]-8,bounds[1]-4,bounds[2]+8,bounds[3]+4),fill='white')
   svg.append(f'<rect x="{bounds[0]-8}" y="{bounds[1]-4}" width="{bounds[2]-bounds[0]+16}" height="{bounds[3]-bounds[1]+8}" fill="white"/>')
   text(lx,ly,label)
 for x,y,w,h,label in nodes:
  if (name in ['05_du_lieu','14_tiep_nhan'] and re.match(r'\d\.',label)) or (name=='13_ca_su_dung' and label.startswith('UC')):
   dr.ellipse((x,y,x+w,y+h),fill='white',outline='black',width=3)
   svg.append(f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w/2}" ry="{h/2}" fill="white" stroke="black" stroke-width="3"/>')
  else:
   dr.rectangle((x,y,x+w,y+h),outline='black',width=3)
   svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="white" stroke="black" stroke-width="3"/>')
  text(x+w/2,y+(h-len(label.split('\n'))*43)/2,label)
 svg.append('</svg>')
 im.save(FIG/(name+'.png'));(FIG/(name+'.svg')).write_text('\n'.join(svg),encoding='utf-8')

diagram('01_nghien_cuu',[(60,180,480,150,'Nguồn công khai\nvà quy định'),(760,180,480,150,'Hiện trạng\nvà ranh giới'),(1460,180,480,150,'Yêu cầu\nvà quy tắc'),(60,680,480,150,'Quản trị\nvà đánh giá'),(760,680,480,150,'Triển khai, vận hành\nvà kiểm thử'),(1460,680,480,150,'Thiết kế\nvà truy vết')],[(0,1,''),(1,2,''),(2,5,''),(5,4,''),(4,3,'')],'Từ chứng cứ đến hồ sơ nghiên cứu')
diagram('02_ngu_canh',[(720,410,560,190,'Hệ thống giải quyết\nthủ tục hành chính Hà Nội'),(50,100,480,140,'Người yêu cầu\nqua cổng quốc gia'),(50,750,480,140,'Cán bộ\nđược giao nhiệm vụ'),(1460,100,480,140,'Dữ liệu dân cư\nvà hộ tịch'),(1460,750,480,140,'Thanh toán, kho kết quả\nvà chuyển phát')],[(1,0,'Yêu cầu'),(0,1,'Kết quả'),(2,0,'Tác nghiệp'),(0,3,'Tra cứu'),(3,0,'Phản hồi'),(0,4,'Trao đổi')],'Ranh giới nghiệp vụ và hệ thống bên ngoài')
diagram('03_quy_trinh',[(70,150,470,130,'Nộp yêu cầu'),(760,150,480,130,'Kiểm tra tiếp nhận'),(1460,150,470,130,'Bổ sung hoặc từ chối'),(760,470,480,130,'Thẩm định và dự thảo'),(70,790,470,130,'Giao và đồng bộ'),(760,790,480,130,'Ký và phát hành')],[(0,1,''),(1,2,'Chưa đủ điều kiện'),(1,3,'Đủ điều kiện'),(3,5,''),(5,4,'')],'Luồng phân tích từ phương án 1811')
diagram('04_chuc_nang',[(660,110,680,150,'Hệ thống quản lý hồ sơ'),(50,400,550,160,'Danh mục và tiếp nhận\nPhiên bản, tờ khai, mã'),(730,400,550,160,'Thụ lý và kết quả\nPhân công, ký, phát hành'),(1410,400,550,160,'Tài chính và giao nhận\nThu, đối soát, giao'),(380,800,550,160,'Tích hợp và thời hạn\nThông điệp, lịch, cảnh báo'),(1060,800,550,160,'Quản trị và giám sát\nQuyền, nhật ký, báo cáo')],[(0,1,''),(0,2,''),(0,3,''),(1,4,''),(3,5,'')],'Phân rã chức năng của thiết kế')
diagram('05_du_lieu',[(50,110,500,150,'Người yêu cầu'),(740,110,520,150,'1. Tiếp nhận'),(1440,110,500,150,'D1. Danh mục\nvà phiên bản'),(740,450,520,150,'2. Thụ lý'),(50,450,500,150,'D2. Hồ sơ\nvà thành phần'),(1440,450,500,150,'Dữ liệu hộ tịch'),(740,790,520,150,'3. Phát hành và giao'),(50,790,500,150,'D3. Kết quả\nvà giao nhận'),(1440,790,500,150,'Cổng và kho nhận')],[(0,1,'Yêu cầu'),(2,1,'Quy tắc'),(1,4,'Hồ sơ'),(4,3,'Hồ sơ'),(3,5,'Truy vấn'),(5,3,'Dữ liệu'),(3,6,'Dự thảo'),(6,7,'Bản phát hành'),(6,8,'Kết quả')],'Dòng thông tin giữa tiến trình và dữ liệu')
diagram('06_kien_truc',[(100,100,1800,150,'TẦNG TƯƠNG TÁC\nCổng quốc gia • Bàn làm việc cán bộ • Điều hành'),(100,350,1800,150,'TẦNG NGHIỆP VỤ\nTiếp nhận • Điều phối • Thẩm định • Kết quả • Tài chính'),(100,600,1800,150,'TẦNG TÍCH HỢP\nXác thực • Kiểm tra thông điệp • Hàng đợi • Đối soát'),(100,850,1800,150,'TẦNG DỮ LIỆU\nHồ sơ quan hệ • Kho tài liệu • Nhật ký • Cấu hình')],[(0,1,''),(1,2,''),(2,3,'')],'Kiến trúc logic đề xuất để hoàn thiện')
diagram('07_trang_thai',[(50,140,560,130,'Chờ tiếp nhận'),(720,140,560,130,'Đã tiếp nhận'),(1390,140,560,130,'Đang thụ lý'),(1390,470,560,130,'Trình duyệt'),(720,470,560,130,'Đã phê duyệt'),(50,470,560,130,'Đã phát hành'),(50,800,560,130,'Hoàn thành'),(720,800,560,130,'Bổ sung, từ chối, dừng\nNhánh có điều kiện'),(1390,800,560,130,'Theo dõi độc lập\nTài chính, giao, đồng bộ, hạn')],[(0,1,''),(1,2,''),(2,3,''),(3,4,''),(4,5,''),(5,6,'')],'Trạng thái chính và các chiều độc lập')
diagram('08_quan_he',[(70,140,500,160,'THỦ TỤC\nPHIÊN BẢN'),(750,140,500,160,'CHỦ THỂ\nNGƯỜI YÊU CẦU'),(1430,140,500,160,'CƠ QUAN\nTÀI KHOẢN'),(750,440,500,160,'HỒ SƠ'),(70,440,500,160,'THÀNH PHẦN\nBỔ SUNG'),(1430,440,500,160,'PHÂN CÔNG\nSỰ KIỆN'),(70,790,500,160,'KHOẢN THU\nGIAO DỊCH'),(750,790,500,160,'KẾT QUẢ\nCHỮ KÝ'),(1430,790,500,160,'GIAO NHẬN\nHÀNG ĐỢI')],[(0,3,'1 : nhiều'),(1,3,'1 : nhiều'),(2,5,'1 : nhiều'),(3,4,'1 : nhiều'),(3,5,'1 : nhiều'),(3,6,'1 : nhiều'),(3,7,'1 : nhiều'),(7,8,'1 : nhiều')],'Quan hệ giữa các nhóm thực thể thiết kế')
diagram('09_dong_bo',[(50,140,560,160,'Ký và kiểm tra bản'),(720,140,560,160,'Phát hành kết quả'),(1390,140,560,160,'Lưu hồ sơ và\nthông điệp cùng giao dịch'),(1390,470,560,160,'Tiến trình gửi nền'),(720,470,560,160,'Đích nhận xử lý\ntheo mã thông điệp'),(50,470,560,160,'Ghi trạng thái\nvà bằng chứng'),(720,810,560,160,'Lỗi hoặc mất phản hồi\nThử lại cùng mã')],[(0,1,''),(1,2,''),(2,3,''),(3,4,''),(4,5,''),(3,6,''),(6,4,'')],'Phát hành và gửi lại không lặp tác động')
diagram('10_giao_dien',[(50,100,1900,130,'BÀN LÀM VIỆC CÁN BỘ\nThiết kế đề xuất, sử dụng dữ liệu minh họa'),(50,320,750,160,'DANH SÁCH HỒ SƠ\nCơ quan • Người xử lý • Trạng thái'),(50,570,750,350,'Mã hồ sơ • Thủ tục • Hạn\nHồ sơ cần tiếp nhận\nHồ sơ đang thụ lý\nKết quả cần giao'),(970,320,980,160,'CHI TIẾT HỒ SƠ\nChủ thể • Thành phần • Thời hạn'),(970,570,980,350,'Ý kiến và nguồn tra cứu\nDự thảo và bản phát hành\nLịch sử và chứng cứ giao\nHành động theo quyền')],[(1,3,'')],'Bố cục giao diện phục vụ tác nghiệp')
diagram('11_trien_khai',[(100,110,1800,150,'VÙNG TIẾP XÚC NGOÀI\nCổng kết nối • Kiểm soát lưu lượng • Xác thực'),(100,350,1800,150,'VÙNG ỨNG DỤNG\nNghiệp vụ • Tiến trình nền • Tích hợp'),(100,590,1800,150,'VÙNG DỮ LIỆU\nCơ sở dữ liệu • Kho tài liệu • Bản sao'),(100,830,1800,150,'VÙNG QUẢN TRỊ\nTruy cập có kiểm soát • Giám sát • Nhật ký')],[(0,1,'Luồng được phép'),(1,2,'Luồng được phép')],'Phân vùng triển khai tham chiếu')
diagram('12_phuc_hoi',[(50,150,560,150,'Xác nhận sự cố\nvà bảo toàn bằng chứng'),(720,150,560,150,'Chọn thời điểm\nvà bản sao'),(1390,150,560,150,'Phục hồi trong\nmôi trường kiểm tra'),(1390,670,560,150,'Đối chiếu dữ liệu\ntài liệu và tài chính'),(720,670,560,150,'Nghiệp vụ xác nhận\nđủ điều kiện mở'),(50,670,560,150,'Mở dịch vụ\nvà theo dõi')],[(0,1,''),(1,2,''),(2,3,''),(3,4,''),(4,5,'')],'Phục hồi toàn bộ hồ sơ và xác nhận phục vụ')
diagram('13_ca_su_dung',[(30,100,430,140,'Người yêu cầu'),(760,100,560,140,'UC01\nNộp yêu cầu'),(1510,100,430,140,'Cán bộ tiếp nhận'),(760,340,560,140,'UC02\nTiếp nhận'),(30,580,430,140,'Chuyên viên'),(760,580,560,140,'UC03\nThẩm định'),(1510,580,430,140,'Lãnh đạo và văn thư'),(760,820,560,140,'UC04\nKý và phát hành')],[(0,1,''),(2,3,''),(4,5,''),(6,7,'')],'Các chủ thể và Use case trọng tâm')
diagram('14_tiep_nhan',[(40,100,470,150,'Yêu cầu đã gửi'),(770,100,470,150,'1. Kiểm tra\nthẩm quyền'),(1500,100,470,150,'D1. Phiên bản\nthủ tục'),(770,450,470,150,'2. Kiểm tra\nthành phần'),(40,450,470,150,'Phiếu bổ sung\nhoặc từ chối'),(1500,450,470,150,'D2. Thành phần\nvà căn cứ đại diện'),(770,800,470,150,'3. Tiếp nhận\nvà tính hạn'),(40,800,470,150,'Giấy tiếp nhận\nvà hẹn trả'),(1500,800,470,150,'D3. Hồ sơ\nvà lịch sử')],[(0,1,'Yêu cầu'),(2,1,'Thẩm quyền'),(1,3,'Đúng nơi'),(1,4,'Ngoài thẩm quyền'),(5,3,'Thông tin'),(3,4,'Chưa đầy đủ'),(3,6,'Hợp lệ'),(6,7,'Chứng từ'),(6,8,'Hồ sơ')],'Phân rã tiến trình tiếp nhận và dữ liệu kiểm tra')
diagram('15_quan_he_ho_so',[(40,110,520,170,'phien_ban_thu_tuc\nPK id\nFK thu_tuc, co_quan'),(740,110,520,170,'chu_the\nPK id'),(1440,110,520,170,'tai_khoan\nPK id\nFK chu_the, co_quan'),(740,420,520,210,'ho_so\nPK id\nFK phien_ban_thu_tuc\nFK hai chủ thể'),(40,790,520,170,'thanh_phan_ho_so\nPK id\nFK ho_so'),(740,790,520,170,'uy_quyen\nPK id\nFK ho_so, chu_the'),(1440,790,520,170,'phan_cong\nPK id\nFK ho_so, tai_khoan')],[(0,3,'1 : nhiều'),(1,3,'1 : nhiều'),(2,6,'1 : nhiều'),(3,4,'1 : nhiều'),(3,5,'1 : nhiều'),(3,6,'1 : nhiều')],'Khóa và quan hệ hồ sơ, đại diện, phân công')
diagram('16_quan_he_ket_qua',[(740,100,520,150,'ho_so\nPK id'),(40,410,520,180,'khoan_thu\nPK id\nFK ho_so'),(740,410,520,180,'ket_qua\nPK id\nFK ho_so, bản thay thế'),(1440,410,520,180,'hang_doi_gui\nPK id\nFK ho_so'),(40,790,520,180,'giao_dich\nPK id\nFK khoan_thu'),(740,790,520,180,'chu_ky\nPK id\nFK ket_qua'),(1440,790,520,180,'giao_nhan\nPK id\nFK ket_qua, chu_the')],[(0,1,'1 : nhiều'),(0,2,'1 : nhiều'),(0,3,'1 : nhiều'),(1,4,'1 : nhiều'),(2,5,'1 : nhiều'),(2,6,'1 : nhiều')],'Khóa và quan hệ kết quả, tài chính, giao nhận')

paths={}
operations=[('get','/v1/procedures/{id}/versions','Tra cứu phiên bản'),('post','/v1/applications','Tạo yêu cầu'),('post','/v1/cases/{id}/accept','Tiếp nhận'),('post','/v1/cases/{id}/supplements','Yêu cầu bổ sung'),('post','/v1/cases/{id}/assignments','Phân công'),('post','/v1/cases/{id}/approvals','Trình duyệt'),('post','/v1/cases/{id}/issuance','Phát hành'),('post','/v1/cases/{id}/deliveries','Giao kết quả'),('post','/v1/payments/notifications','Nhận thông báo thu'),('get','/v1/cases/{id}/events','Tra cứu lịch sử')]
for i,(method,path,title) in enumerate(operations):
 op={'operationId':f'operation{i+1}','summary':title,'security':[{'bearerAuth':[]}],'parameters':[],
 'responses':{'200':{'description':'Thành công','content':{'application/json':{'schema':{'$ref':'#/components/schemas/Response'}}}},'403':{'description':'Không đủ quyền'},'409':{'description':'Xung đột phiên bản hoặc trạng thái'},'422':{'description':'Không thỏa điều kiện nghiệp vụ'},'503':{'description':'Thành phần phụ thuộc chưa đáp ứng'}}}
 if '{id}' in path:op['parameters'].append({'name':'id','in':'path','required':True,'schema':{'type':'string','format':'uuid'}})
 if method=='post':
  op['parameters'].append({'name':'Idempotency-Key','in':'header','required':True,'schema':{'type':'string','maxLength':150}})
  schema='PaymentNotification' if 'notifications' in path else 'Application' if path=='/v1/applications' else 'Action'
  op['requestBody']={'required':True,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/'+schema}}}}
 paths[path]={method:op}
spec={'openapi':'3.0.3','info':{'title':'Giao tiếp thiết kế quản lý hồ sơ hành chính','version':'1.0.0','description':'Thiết kế đề xuất; không phải đặc tả điểm cuối hiện hữu của Hà Nội. Cần thống nhất hợp đồng với đơn vị quản lý trước phát triển.'},'paths':paths,'components':{'securitySchemes':{'bearerAuth':{'type':'http','scheme':'bearer'}},'schemas':{
 'Application':{'type':'object','required':['procedureVersionId','requesterId','formData','receptionChannel'],'properties':{'procedureVersionId':{'type':'string','format':'uuid'},'requesterId':{'type':'string','format':'uuid'},'subjectId':{'type':'string','format':'uuid','description':'Bắt buộc theo loại thủ tục khi có chủ thể chuyên biệt'},'receptionChannel':{'type':'string','enum':['ONLINE','DIRECT','POSTAL']},'formData':{'type':'object'},'representationEvidenceId':{'type':'string','format':'uuid'},'attachments':{'type':'array','items':{'type':'string','format':'uuid'}}}},
 'Action':{'type':'object','required':['version','reason'],'properties':{'version':{'type':'integer','minimum':1},'reason':{'type':'string'},'legalBasis':{'type':'string'},'assigneeId':{'type':'string','format':'uuid'},'documentVersionId':{'type':'string','format':'uuid'},'supplementPhase':{'type':'string','enum':['RECEPTION','ASSESSMENT']},'deliveryEvidence':{'type':'string'}}},
 'PaymentNotification':{'type':'object','required':['partner','transactionId','chargeId','amount','signature'],'properties':{'partner':{'type':'string'},'transactionId':{'type':'string'},'chargeId':{'type':'string','format':'uuid'},'amount':{'type':'number','minimum':0},'signature':{'type':'string'},'timestamp':{'type':'string','format':'date-time'}}},
 'Response':{'type':'object','required':['id','correlationId'],'properties':{'id':{'type':'string'},'version':{'type':'integer'},'correlationId':{'type':'string'},'status':{'type':'string'},'ruleCode':{'type':'string'}}}
}}}
(OUT/'Giao_tiep_OpenAPI.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
tests=[]
for file in (ROOT/'02_Noi_dung').glob('*.md'):
 for line in file.read_text(encoding='utf-8').splitlines():
  if re.match(r'\| (KT|AT|TC|PT|HT|CF)\d+',line):
   cells=[x.strip() for x in line.strip('|').split('|')];tests.append(cells+['Chưa thực hiện'])
with (OUT/'Kich_ban_kiem_thu.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['Mã','Điều kiện hoặc tình huống','Thao tác hoặc tiêu chí','Kết quả mong đợi','Trạng thái']);
 for cells in tests:
  if len(cells)==4:cells.insert(2,'Theo mô tả kịch bản')
  w.writerow(cells)
(OUT/'README.md').write_text('''# Bộ thiết kế hệ thống giải quyết thủ tục hành chính Hà Nội

Đối tượng thực tế là Hệ thống thông tin giải quyết thủ tục hành chính thành phố Hà Nội. Phạm vi gồm chín nhóm, 31 chức năng và hai mươi khía cạnh. Hai trường hợp đối chiếu là nhánh hộ tịch theo Quyết định 1811 và cấp bản sao từ sổ gốc theo Quyết định 663. Các địa chỉ công khai và nhánh hoạt động được giải thích tại mục 2.10 của báo cáo.

Các lược đồ và giao tiếp ở đây là phương án thiết kế nghiên cứu, không phải bản sao thiết kế nội bộ. Chưa có phần mềm chạy hoặc kết quả kiểm thử trên hệ thống vận hành.

* `So_do`: sơ đồ PNG để chèn báo cáo và SVG để chỉnh sửa; ảnh giao diện năm 2023 được trích từ tài liệu công khai, ghi rõ là phiên bản lịch sử.
* `Tu_dien_du_lieu.md`, `Tu_dien_du_lieu.json`: 35 bảng với kiểu dữ liệu, quan hệ, ràng buộc và diễn giải.
* `Mo_hinh_du_lieu.sql`: lược đồ tham chiếu PostgreSQL; cần kiểm tra khi lựa chọn công nghệ thực tế.
* `Giao_tiep_OpenAPI.json`: 10 thao tác, cấu trúc yêu cầu và phản hồi tham chiếu.
* `Giao_tiep_mo_rong_OpenAPI.json`: 7 thao tác về tuyến, liên thông, phối hợp, nộp lưu, phản ánh và báo cáo.
* `Kich_ban_kiem_thu.csv`: 95 ca, gồm 31 ca CF tương ứng 31 chức năng CN; tất cả chưa thực hiện.

Quy trình, quyền và nguyên tắc chuyển bước ở các chương III, IV, VII trong `02_Noi_dung`. Điều kiện khảo sát bổ sung ở phụ lục A.
''',encoding='utf-8')
print('Created',len(tables),'data tables, 16 diagrams,',len(operations),'operations and',len(tests),'test cases')
