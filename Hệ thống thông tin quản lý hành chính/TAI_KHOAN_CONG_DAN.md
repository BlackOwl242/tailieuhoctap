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
