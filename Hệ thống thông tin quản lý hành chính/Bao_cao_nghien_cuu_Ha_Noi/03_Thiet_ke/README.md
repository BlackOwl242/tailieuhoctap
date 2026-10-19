# Bộ thiết kế hệ thống giải quyết thủ tục hành chính Hà Nội

Đối tượng thực tế là Hệ thống thông tin giải quyết thủ tục hành chính thành phố Hà Nội. Phạm vi gồm chín nhóm, 31 chức năng và hai mươi khía cạnh. Hai trường hợp đối chiếu là nhánh hộ tịch theo Quyết định 1811 và cấp bản sao từ sổ gốc theo Quyết định 663. Các địa chỉ công khai và nhánh hoạt động được giải thích tại mục 2.10 của báo cáo.

Các lược đồ và giao tiếp ở đây là phương án thiết kế nghiên cứu, không phải bản sao thiết kế nội bộ. Ứng dụng React/Python/SQLite chạy cục bộ; chưa kết nối, kiểm thử hoặc được cấp quyền trên hệ thống vận hành Hà Nội.

* `So_do`: sơ đồ PNG để chèn báo cáo và SVG để chỉnh sửa; ảnh giao diện năm 2023 được trích từ tài liệu công khai, ghi rõ là phiên bản lịch sử.
* `Tu_dien_du_lieu.md`, `Tu_dien_du_lieu.json`: 37 bảng với kiểu dữ liệu, quan hệ, ràng buộc và diễn giải.
* `Mo_hinh_du_lieu.sql`: lược đồ tham chiếu PostgreSQL; cần kiểm tra khi lựa chọn công nghệ thực tế.
* `Giao_tiep_OpenAPI.json`: 10 thao tác, cấu trúc yêu cầu và phản hồi tham chiếu.
* `Giao_tiep_mo_rong_OpenAPI.json`: 7 thao tác về tuyến, liên thông, phối hợp, nộp lưu, phản ánh và báo cáo.
* `Kich_ban_kiem_thu.csv`: 101 ca; tất cả chưa thực hiện.

Quy trình, quyền và nguyên tắc chuyển bước ở các chương III, IV, VII trong `02_Noi_dung`. Điều kiện khảo sát bổ sung ở phụ lục A.
Ảnh giao diện bàn cán bộ được cập nhật ngày 19/10/2026 tại `Anh_giao_dien_he_thong/can_bo_danh_muc_thu_tuc_20261019.jpg` và `Anh_giao_dien_he_thong/can_bo_chi_tiet_thu_tuc_20261019.jpg`. Danh sách có bộ lọc, tình trạng dữ liệu và quản lý lĩnh vực; trang chi tiết thể hiện nội dung công bố cùng cấu hình nội bộ, lịch sử và thao tác sửa theo quyền. Báo cáo Word/PDF đã thay các hình 4.58 và 4.59 bằng ảnh mới.
