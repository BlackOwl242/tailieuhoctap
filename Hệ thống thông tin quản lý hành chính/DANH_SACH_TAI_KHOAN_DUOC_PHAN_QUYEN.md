# Danh sách tài khoản được phân quyền

**Cơ sở dữ liệu được kiểm tra:** `data/hanoi-services.sqlite3`  
**Ngày kiểm tra:** 11/10/2026

## Tài khoản hiện có

| Họ tên | Email đăng nhập | Vai trò | Phạm vi cơ quan | Hiệu lực |
|---|---|---|---|---|
| *Chưa có tài khoản cán bộ được tạo trong cơ sở dữ liệu này.* |  |  |  |  |

Kiểm tra tại thời điểm trên ghi nhận **0 tài khoản** trong bảng người dùng và **0 đề nghị cấp quyền đang chờ**. Vì vậy hiện chưa có email/mật khẩu cán bộ để đăng nhập. Người dân không cần tạo tài khoản ứng dụng; họ gửi và tra cứu hồ sơ bằng mã hồ sơ cùng khóa tra cứu.

## Các vai trò có thể được cấp

Đây là các loại quyền được phần mềm hỗ trợ, không phải tài khoản đã tồn tại:

| Vai trò | Mục đích trong phần mềm |
|---|---|
| `admin` — Quản trị hệ thống | Quản lý tài khoản, vai trò và cấu hình được phép; không xem nội dung chi tiết hồ sơ công dân. |
| `intake` — Tiếp nhận | Tiếp nhận, kiểm tra ban đầu và phân công hồ sơ trong phạm vi cơ quan được cấp. |
| `specialist` — Chuyên viên | Xử lý hồ sơ được phân công trong phạm vi cơ quan. |
| `leader` — Lãnh đạo | Xem xét, phê duyệt hoặc thực hiện quyền ký theo thẩm quyền được ghi nhận. |
| `registrar` — Trả kết quả | Thực hiện các thao tác trả/phát hành kết quả được phần mềm cho phép. |
| `finance` — Tài chính | Theo dõi thông tin nghĩa vụ phí trong phạm vi chức năng được cấp. |

Quyền thực tế còn phụ thuộc phạm vi cơ quan, thời hạn hiệu lực và trạng thái tài khoản. Đề nghị cấp tài khoản nghiệp vụ phải được quản trị viên khác duyệt trước khi có hiệu lực.

## Khởi tạo tài khoản quản trị

Hiện chưa có tài khoản nào được nạp sẵn. Người vận hành có thể mở PowerShell tại thư mục hệ thống và chạy `python app.py create-admin` để tạo quản trị viên; phần mềm sẽ hỏi họ tên, email và mật khẩu tương tác. README mô tả yêu cầu mật khẩu. Không ghi mật khẩu vào tài liệu danh sách này.

Sau khi có quản trị viên, tạo các tài khoản cán bộ trong bàn cán bộ, mục **Tài khoản**. Để vận hành phân quyền có kiểm soát, khởi tạo ít nhất hai quản trị viên để người thứ hai duyệt đề nghị.

> Danh sách này là ảnh chụp trạng thái của cơ sở dữ liệu nêu trên tại ngày kiểm tra. Cập nhật danh sách sau khi cấp, thu hồi hoặc thay đổi quyền; không gửi tệp này qua kênh công khai.
