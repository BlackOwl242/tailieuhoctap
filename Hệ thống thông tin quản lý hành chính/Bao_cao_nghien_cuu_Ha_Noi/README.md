# Hồ sơ nghiên cứu hệ thống thông tin giải quyết thủ tục hành chính Hà Nội

Bản chính là [Báo cáo phân tích và thiết kế hướng đối tượng](04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx). Bản hiện hành có 200 trang trong PDF, 136 hình, 97 bảng có số hiệu và một bảng từ viết tắt. Trích dẫn dùng số trong ngoặc vuông; Use case mang mã UC01 đến UC36.

## Nội dung bộ hồ sơ

- `01_Nguon_tham_khao`: nguồn công khai và văn bản của cơ quan có thẩm quyền.
- `02_Noi_dung`: bản thảo nội dung nghiên cứu.
- `03_Thiet_ke`: bản thiết kế, mô hình hướng đối tượng, sơ đồ và ảnh giao diện.
- `04_Bao_cao`: báo cáo Word hiện hành.
- `05_Doi_chieu`: hồ sơ các lần đối chiếu trước. Tệp Word trong `04_Bao_cao` là bản hiện hành; ảnh kết xuất phục vụ kiểm tra được lưu ngoài kho tài liệu.
- `06_Cong_cu`: công cụ phục vụ chỉnh sửa và kiểm tra tài liệu.
- `07_Huong_dan`: 36 hướng dẫn chức năng, thư viện 2.075 thủ tục theo danh mục ngày 14/04/2026 và hướng dẫn riêng cho hai thủ tục đã phân tích sâu.

Số 2.075 là số dòng thủ tục trong danh mục tại văn bản công bố. Thư viện này chưa xác minh đầy đủ thành phần, khoản thu, thời hạn và hiệu lực hiện hành của từng thủ tục. Cổng Dịch vụ công quốc gia đã được đối chiếu ở một tuyến cụ thể: mã 2.000908, Hà Nội → Phường Tây Hồ → UBND phường Tây Hồ. Tuyến đó không được áp dụng mặc định cho địa bàn khác. Phần mềm React/Python hiện thực luồng tác nghiệp cục bộ, quản lý tài khoản cán bộ và lưu trạng thái hồ sơ trong cơ sở dữ liệu. Chưa khảo sát mã nguồn hoặc giao diện sau đăng nhập của hệ thống cán bộ Hà Nội. Báo cáo có hai bộ kiểm thử thiết kế riêng: 180 ca hướng đối tượng và 101 ca tổng hợp; chưa bộ nào được chạy đầy đủ trên phần mềm. Năm bài kiểm tra HTTP hồi quy trên dữ liệu tạm đã đạt, gồm luồng tiếp nhận đến phê duyệt, quản trị hai người và thay đổi tài khoản có thu hồi phiên. Ứng dụng chưa kết nối cổng định danh, hồ sơ Hà Nội, ký số, thanh toán hoặc đồng bộ kết quả; cần tài khoản được cấp, hợp đồng tích hợp và môi trường kết nối để đưa vào vận hành chính thức.

Trong lượt rà soát gần nhất, năm bài kiểm tra HTTP hồi quy đã đạt trên cơ sở dữ liệu tạm. Các bài bao phủ quyền và phạm vi hồ sơ, cấp tài khoản qua hai quản trị viên, đổi mật khẩu lần đầu, quyền ký Mẫu 06, cùng đề nghị đổi vai trò/cơ quan/thời hạn hoặc tạm ngưng/khôi phục tài khoản, duyệt độc lập và thu hồi phiên cũ. Kiểm tra này không thay thế đầy đủ 101 ca thiết kế hay kiểm thử trên hệ thống nhà nước. Tài khoản quản trị phần mềm không thể đọc hoặc xuất hồ sơ công dân. Thay đổi tài khoản quản trị cần một người duyệt thứ ba.

## Dọn thư mục ngày 03/10/2026

Đã chuyển 4.416 tệp cũ và tệp tạm, tổng dung lượng khoảng 749 MB, ra ngoài kho học tập, vào thư mục tạm của hệ thống. Các nguồn, nội dung, thiết kế, hướng dẫn và báo cáo hiện hành được giữ nguyên. Chi tiết nằm trong `05_Doi_chieu/Ket_qua_don_dep_20261003.json`.


## Bố trí sơ đồ trên trang A4

Báo cáo có bảy chương và phần mở đầu riêng về lý do chọn đề tài, đối tượng, mục tiêu, phạm vi, phương pháp và cấu trúc. Đã bỏ 36 màn hình thiết kế đề xuất; sau các sơ đồ phân tích và thiết kế, mục 4.6 đưa vào ảnh chụp các giao diện hiện có của ứng dụng nghiên cứu để phân biệt rõ giao diện đã xây dựng với giao diện tham khảo từ cổng công khai.

Chương 3 trình bày biểu đồ Use Case cùng biểu đồ trình tự và hoạt động cho 36 Use case. Chương 4 trình bày kiến trúc, mô hình lớp và ERD; từ điển dữ liệu hiện có 37 thực thể cùng 74 khóa ngoại/quan hệ. Các sơ đồ được chia nhóm để giữ trên khổ A4, còn định nghĩa chi tiết nằm trong bảng và từ điển dữ liệu.

Danh mục bảng và hình căn cùng lề trái, số trang bên phải và có dấu chấm dẫn. Ảnh kết xuất và bản sao phục vụ kiểm tra được lưu trong thư mục tạm ngoài kho tài liệu.


Bộ ảnh giao diện đã được đối chiếu lại với bản ứng dụng đang chạy ngày 19/10/2026: đủ 45 ảnh cho các tuyến người dân, cán bộ, quản trị viên và hướng dẫn. Các bảng trong Word/PDF dùng nền trắng, chữ đen và đường kẻ lưới đơn giản. Danh mục ảnh hiện hành nằm tại `03_Thiet_ke/Anh_giao_dien_he_thong/Danh_muc_anh_giao_dien.json`.
