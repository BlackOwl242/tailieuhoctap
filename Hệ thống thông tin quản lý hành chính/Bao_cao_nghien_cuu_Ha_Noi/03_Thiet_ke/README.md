# Bộ thiết kế hệ thống giải quyết thủ tục hành chính Hà Nội

Đối tượng thực tế là Hệ thống thông tin giải quyết thủ tục hành chính thành phố Hà Nội. Phạm vi gồm chín nhóm, 31 chức năng và hai mươi khía cạnh. Hai trường hợp đối chiếu là nhánh hộ tịch theo Quyết định 1811 và cấp bản sao từ sổ gốc theo Quyết định 663. Các địa chỉ công khai và nhánh hoạt động được giải thích tại mục 2.10 của báo cáo.

Các lược đồ và giao tiếp ở đây là phương án thiết kế nghiên cứu, không phải bản sao thiết kế nội bộ. Chưa có phần mềm chạy hoặc kết quả kiểm thử trên hệ thống vận hành.

* `So_do`: sơ đồ PNG để chèn báo cáo và SVG để chỉnh sửa; ảnh giao diện năm 2023 được trích từ tài liệu công khai, ghi rõ là phiên bản lịch sử.
* `Tu_dien_du_lieu.md`, `Tu_dien_du_lieu.json`: 35 bảng với kiểu dữ liệu, quan hệ, ràng buộc và diễn giải.
* `Mo_hinh_du_lieu.sql`: lược đồ tham chiếu PostgreSQL; cần kiểm tra khi lựa chọn công nghệ thực tế.
* `Giao_tiep_OpenAPI.json`: 10 thao tác, cấu trúc yêu cầu và phản hồi tham chiếu.
* `Giao_tiep_mo_rong_OpenAPI.json`: 7 thao tác về tuyến, liên thông, phối hợp, nộp lưu, phản ánh và báo cáo.
* `Kich_ban_kiem_thu.csv`: 95 ca, gồm 31 ca CF tương ứng 31 chức năng CN; tất cả chưa thực hiện.

Quy trình, quyền và nguyên tắc chuyển bước ở các chương III, IV, VII trong `02_Noi_dung`. Điều kiện khảo sát bổ sung ở phụ lục A.
