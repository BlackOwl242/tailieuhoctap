# Xây dựng hệ thống thông tin quản lý tiếp nhận và giải quyết thủ tục hành chính theo cơ chế một cửa tại thành phố Hà Nội

Dự án xây dựng phần mềm hỗ trợ người dân nộp và theo dõi hồ sơ hành chính; hỗ trợ cán bộ tiếp nhận, phân công, thụ lý, phê duyệt và trả kết quả; đồng thời giúp lãnh đạo giám sát tiến độ, thời hạn và trách nhiệm xử lý theo từng cơ quan.

Báo cáo hiện hành: [Word](04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx) và [PDF](04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.pdf). Tên tệp được giữ để các liên kết cũ tiếp tục dùng được; tên đề tài trong tài liệu đã cập nhật. Tên học phần “Hệ thống thông tin quản lý hành chính” giữ theo chương trình học.

## Phạm vi đã thực hiện

Ứng dụng React, TypeScript, Python và SQLite có cổng người dân, bàn cán bộ, danh mục và chi tiết thủ tục, luồng nộp năm bước, tra cứu bằng mã/khóa, lịch hẹn, phản ánh, quản trị và báo cáo. Hiện chỉ mở tiếp nhận hai mã `2.000908` và `1.004237`; 2.075 dòng danh mục không đồng nghĩa 2.075 quy trình đã hoàn thành. Quy trình có bản chụp cấu hình theo hồ sơ, kiểm tra nghiệp vụ riêng, thẩm quyền và hạn riêng. Quản trị viên không đọc hồ sơ cá nhân; tài khoản nghiệp vụ chỉ làm việc trong cơ quan cụ thể.

Đã chạy 46 kiểm thử hồi quy trên dữ liệu tạm ngày 20/10/2026; chưa chạy đầy đủ hai bộ thiết kế gồm 180 ca hướng đối tượng và 101 ca tổng hợp. Chưa kết nối định danh, chữ ký công vụ, thanh toán, dữ liệu chuyên ngành hoặc hệ thống hồ sơ nhà nước. Quy trình liên cơ quan và nhiều cấp duyệt chưa được cấu hình đầy đủ.

## Các tài liệu dùng để kiểm tra

- [Đối chiếu thủ tục với DVCQG ngày 20/10/2026](05_Doi_chieu/Doi_chieu_thu_tuc_DVCQG_20261020.md).
- [Bảng so sánh đủ 2.075 dòng danh mục](05_Doi_chieu/Doi_chieu_danh_muc_DVCQG_20261020.csv), theo bản nguồn đã lưu, chưa phải rà soát hiệu lực trực tiếp toàn bộ.
- [Hướng dẫn theo vai trò và thủ tục](07_Huong_dan/README.md).
- `02_Noi_dung`: bản thảo nghiên cứu và phần cập nhật triển khai hiện tại; mô hình đề xuất được phân biệt với chức năng đã chạy.
- `03_Thiet_ke`: UML, từ điển dữ liệu, hợp đồng tham chiếu và ảnh giao diện. Các ảnh cũ giữ ngày chụp thực tế; không đổi ngày để coi là ảnh mới.
- `01_Nguon_tham_khao`: bản nguồn và văn bản công khai. `05_Doi_chieu` giữ các biên bản lịch sử theo ngày. `06_Cong_cu` chứa các nguồn tạo tài liệu đã có từ trước.

Word và PDF dùng trang A4 dọc, bảng nền trắng chữ đen và đường kẻ đơn giản. Số trang, hình và bảng được ghi trong biên bản kết xuất hiện hành sau khi cập nhật mục lục.

Bộ ảnh hiện có 47 màn hình. Các hình 4.64–4.72 được cập nhật ngày 20/10/2026; ảnh cẩm nang thể hiện hai thủ tục đang mở và hướng dẫn theo trách nhiệm. Hai ảnh bổ sung giải thích thời hạn, khoản thu trên trang chi tiết. Mỗi ảnh giữ ngày chụp thực tế trong danh mục, không coi ảnh ngày 19/10 là ảnh mới.

Bản kết xuất ngày 21/10/2026 có **201 trang PDF**, **172 hình**, **104 bảng có số hiệu**, một bảng từ viết tắt và một bảng quy ước phản hồi API. Đã biên tập cách diễn đạt, rút các đoạn lặp và thống nhất thuật ngữ “use case”. PDF được xuất trực tiếp từ Word đã lưu, đã cập nhật mục lục và danh mục. [Biên bản kết xuất](05_Doi_chieu/Ket_qua_dong_bo_20261020.json) lưu số lượng, phạm vi kiểm tra và mã băm hai tệp.
