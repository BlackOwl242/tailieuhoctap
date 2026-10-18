# Kết quả bổ sung dự án hành chính sau khôi phục

Ngày thực hiện: 18/10/2026.

## Các phần đã bổ sung

1. Tiếp nhận hồ sơ trực tiếp tại quầy: giới hạn vai trò tiếp nhận và phạm vi cơ quan, xác nhận đối chiếu người nộp, danh mục giấy tờ, cấp mã hồ sơ và chống gửi trùng bằng mã phiên. Khóa tra cứu tiếp tục lưu mã hóa và được cán bộ lấy qua chức năng hiện có.
2. Số hóa tại quầy: nhận tệp quét thực tế, kiểm tra số trang và danh mục đối chiếu, giữ nguyên nội dung tệp, ghi người thực hiện và lịch sử. Không tự tạo giấy tờ giả thay tệp nộp.
3. Khoản thu: người nộp khai hình thức đã nộp và mã chứng từ; cán bộ tài chính nhập tham chiếu đối soát. Thông tin chứng từ đi cùng khoản thu ở API và giao diện.
4. Hoàn phí: người đề nghị không được tự duyệt. Duyệt đề nghị không đồng nghĩa đã chi hoàn. Chỉ cập nhật REFUNDED sau bước ghi nhận chứng từ thực hiện hoàn. Kiểm tra phiên bản và giao dịch SQLite bảo vệ tính nhất quán khi thao tác lỗi hoặc trùng.
5. Lịch hẹn: đặt theo ngày làm việc và khung giờ, giới hạn 10 lịch/cơ quan/khung giờ trong 30 ngày tới; tra cứu bằng mã và số điện thoại đã khai; cán bộ cùng cơ quan cập nhật theo các bước xác nhận, đến quầy, phục vụ hoặc hủy. Lưu lịch sử thao tác. Đây là cấu hình của ứng dụng môn học.
6. Phản ánh, kiến nghị: người gửi nhận mã theo dõi; cán bộ cùng cơ quan trả lời và lưu lịch sử. Ngăn ghi đè phản ánh đã trả lời. Quản trị hệ thống chỉ lấy số lượng tổng hợp qua API bàn dịch vụ.
7. Khởi động: bỏ thao tác tự xóa hồ sơ cũ và tự sinh hồ sơ mẫu. Giữ tài khoản, mật khẩu và dữ liệu đã phục hồi. Các thay đổi schema mới chỉ bổ sung bảng/cột khi chưa tồn tại.
8. Tài liệu & Tài khoản: cập nhật `README.md`, `DANH_SACH_TAI_KHOAN_DUOC_PHAN_QUYEN.md` và `TAI_KHOAN_SAU_KHOI_PHUC_20261018.md`. Toàn bộ **79 tài khoản** trong `data/hanoi-services.sqlite3` đều sử dụng **mật khẩu mặc định `123`** và đã tắt cờ buộc đổi mật khẩu lần đầu (`must_change_password = 0`) để thuận tiện kiểm thử và vận hành toàn bộ quy trình.
9. Rà soát và khắc phục đồng bộ Quy trình – Phân quyền – Giao diện:
   - Khôi phục tờ khai điện tử tương tác thứ 3 (`1.000477` — Sở Xây dựng) từ `procedure_catalog_edits.submission_json` và phân biệt rõ thủ tục có biểu mẫu điện tử tương tác (`hasInteractiveForm`) với thủ tục chỉ có danh mục thành phần hồ sơ tham chiếu trên giao diện.
   - Chuẩn hóa tên cơ quan (`normalize_agency_name` / `same_agency_scope`) để đồng bộ giữa danh mục TTHC, tài khoản cán bộ, lịch hẹn và phản ánh kiến nghị.
   - Thực thi giới hạn tối đa 01 lần yêu cầu bổ sung mỗi giai đoạn và tự động gia hạn `deadline` theo số ngày làm việc tạm dừng khi công dân hoặc cán bộ một cửa nộp bổ sung hồ sơ.
   - Cho phép Lãnh đạo cơ quan chỉ có 01 tài khoản lãnh đạo duy nhất đang hoạt động được ký số phát hành sau khi đã được cấp quyền ký thử nghiệm; cho phép Lãnh đạo đối soát/duyệt hoàn phí khi đơn vị chưa có cán bộ tài chính thứ hai; cho phép Cán bộ tiếp nhận một cửa nhận bổ sung và trả kết quả tại quầy.
   - Bổ sung menu **Quầy một cửa & Lịch hẹn** trực tiếp trên thanh điều hướng của Cán bộ tiếp nhận và Lãnh đạo; bổ sung nút in **Mẫu 01**, **Mẫu 02**, **Mẫu 03** và hiển thị đầy đủ thông tin **Mẫu 06**, phân công thụ lý, dự thảo kết quả, kết quả phát hành và biên nhận trả kết quả trên cả giao diện cán bộ và tra cứu công dân.

## Kiểm tra và bảo vệ dữ liệu

- Trước khi sửa đã tạo `source-before.zip` và `database-before.sqlite3` trong `recovery/evidence/admin_completion_20261018_143250/`.
- Bộ kiểm thử hiện tại: **31/31 đạt** (`tests/test_app_access.py`, `tests/test_procedure_workflow.py`, `tests/test_recovered_workflows.py`).
- TypeScript/Vite build (`frontend/dist`) đã được biên dịch mới từ `frontend/src` không còn độ trễ phiên bản.
- SQLite đang dùng (`data/hanoi-services.sqlite3`) có 79 tài khoản (100% mật khẩu `123`, `must_change_password = 0`), 213 hồ sơ, 11 lịch hẹn, 10 phản ánh và 82 bản ghi khoản thu.

## Cách dùng

Mở `MO_HE_THONG.bat` (hoặc `run.bat`) để chạy hệ thống tại `http://127.0.0.1:8766/`. Đăng nhập bàn cán bộ tại `http://127.0.0.1:8766/staff` với mật khẩu mặc định `123`. Cán bộ tiếp nhận/lãnh đạo mở **Quầy một cửa & Lịch hẹn** trên thanh bên để tiếp nhận hồ sơ tại quầy, quản lý lịch hẹn và trả lời phản ánh kiến nghị. Người dân mở mục **Đặt lịch hẹn, gửi phản ánh và tra cứu kết quả** trên trang chủ để đặt lịch, gửi phản ánh và tra cứu bằng mã (`LH-...`, `PA-...`, `PAKN-...`).
