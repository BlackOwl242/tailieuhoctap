# Tài khoản công dân được cấp sẵn

- Đăng nhập: http://127.0.0.1:8766/dang-nhap
- Email: `congdan@example.test`
- Mật khẩu ban đầu: `123`
- Vai trò: công dân (`citizen`). Chỉ dùng dịch vụ công dân; không được vào bàn cán bộ hoặc gọi API cán bộ.
- Đây là tài khoản cục bộ của ứng dụng, chưa liên kết VNeID.

## Cài đặt và cập nhật

Nhấp đúp `CAI_DAT.bat` để cài phụ thuộc, dựng giao diện, chuẩn bị tài khoản công dân và chạy hệ thống. `MO_HE_THONG.bat` vẫn dùng để mở hệ thống như trước; khi cần khởi động máy chủ, nó gọi `run.bat` có cùng bước chuẩn bị tài khoản.

Có thể chỉ tạo tài khoản bằng `python -X utf8 scripts/provision_citizen_account.py`. Lệnh đọc các biến `HANOI_DATA_DIR` và `HANOI_DB_PATH` như máy chủ. Lệnh chỉ tạo khi email chưa tồn tại, không đặt lại mật khẩu, kích hoạt lại hoặc đổi quyền của tài khoản hiện có.

Tài khoản không đi kèm hồ sơ, lịch hẹn hoặc phản ánh mẫu. Hồ sơ mới được gắn với tài khoản sau khi người dùng tự gửi.

## Khu vực sau đăng nhập

Mở [Tài khoản của tôi](http://127.0.0.1:8766/tai-khoan) để xem tổng quan, Dịch vụ công của tôi, Hồ sơ nháp, Tài liệu điện tử, Thông báo, Lịch hẹn, Phản ánh, Khoản thu và Bảo mật. Thông tin cá nhân nằm tại `/tai-khoan/thong-tin-ca-nhan`. Tài khoản mới chưa có hồ sơ sẽ hiện danh sách trống; chọn Nộp hồ sơ mới hoặc lưu nháp để bắt đầu.

## Dữ liệu minh họa trong tài khoản

Bổ sung theo yêu cầu ngày 27/10/2026. Các thông tin dưới đây là hư cấu phục vụ học phần.

- Hồ sơ cá nhân: Nguyễn Văn Minh; ngày sinh 15/03/1996; điện thoại 0900000000; số định danh minh họa 000000000001; địa chỉ Số 12, ngõ Minh Họa, phường Tây Hồ, Thành phố Hà Nội.
- 5 hồ sơ: chờ tiếp nhận `HN-2026-96900067`; chờ bổ sung `HN-2026-BBFF2071`; chờ chứng từ `HN-2026-C6D77A4D`; chờ đối chiếu `HN-2026-8AAE67A8`; đã hoàn thành `HN-2026-AC74BCE8`.
- 2 hồ sơ nháp để tiếp tục kê khai; 2 lịch hẹn; 2 phản ánh, gồm một phản ánh đã được trả lời.
- 6 tài liệu PDF minh họa, gồm giấy tờ đã nộp và kết quả giải quyết mẫu; có thể tải và dùng lại trong bước Thành phần hồ sơ.
- 2 khoản thu minh họa của thủ tục dữ liệu môi trường: một chờ khai chứng từ, một chờ kế toán đối chiếu. Không tạo khoản thu hành chính cho thủ tục cấp bản sao từ sổ gốc.

Không thay đổi mật khẩu và quyền tài khoản khi bổ sung dữ liệu. Các thông tin cá nhân đã có nội dung riêng được giữ lại, chỉ bổ sung những mục còn trống.
