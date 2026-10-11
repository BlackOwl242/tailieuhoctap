# Tài khoản cục bộ được phân quyền

**Cơ sở dữ liệu:** `data/hanoi-services.sqlite3`
**Ngày tạo/kiểm tra:** 11/10/2026
**Trạng thái:** 11 tài khoản cục bộ đang hoạt động; 9 đề nghị cấp quyền nghiệp vụ đã được quản trị viên thứ hai phê duyệt. Đây không phải tài khoản do cơ quan Hà Nội cấp.

Các địa chỉ `example.test` là định danh dành riêng cho môi trường thử nghiệm, không phải hộp thư thật. Email chưa được xác minh. Tài khoản không có quyền ký Mẫu 06 vì chưa có căn cứ phân công thẩm quyền ký. Thời hạn các quyền nghiệp vụ: **11/10/2026–11/10/2027**.

## Quản trị viên

| Họ tên | Email đăng nhập | Phạm vi | Trạng thái |
|---|---|---|---|
| Quản trị viên cục bộ 01 | `admin01@example.test` | Toàn thành phố trong ứng dụng | Đang hoạt động |
| Quản trị viên cục bộ 02 | `admin02@example.test` | Toàn thành phố trong ứng dụng | Đang hoạt động |

Mật khẩu hiện tại của hai tài khoản quản trị đã được đặt ngẫu nhiên. Có thể giữ nguyên khi dùng trong môi trường cục bộ:

| Email | Mật khẩu hiện tại |
|---|---|
| `admin01@example.test` | `NuAhGUjZhlgOY6qWqLppjrCmHs` |
| `admin02@example.test` | `oFjj5dzWEWJU7HUn4PhoqN2aSG` |

## Cán bộ nghiệp vụ

| Họ tên hiển thị | Email đăng nhập | Vai trò | Phạm vi cơ quan | Phê duyệt |
|---|---|---|---|---|
| Cán bộ tiếp nhận hồ sơ — Sở Nông nghiệp và Môi trường | `intake.sotnmt@example.test` | `intake` | Sở Nông nghiệp và Môi trường Hà Nội | Quản trị viên 02 |
| Chuyên viên xử lý hồ sơ — Sở Nông nghiệp và Môi trường | `specialist.sotnmt@example.test` | `specialist` | Sở Nông nghiệp và Môi trường Hà Nội | Quản trị viên 02 |
| Lãnh đạo xem xét — Sở Nông nghiệp và Môi trường | `leader.sotnmt@example.test` | `leader` | Sở Nông nghiệp và Môi trường Hà Nội | Quản trị viên 02 |
| Cán bộ trả kết quả — Sở Nông nghiệp và Môi trường | `registrar.sotnmt@example.test` | `registrar` | Sở Nông nghiệp và Môi trường Hà Nội | Quản trị viên 02 |
| Cán bộ theo dõi tài chính — Sở Nông nghiệp và Môi trường | `finance.sotnmt@example.test` | `finance` | Sở Nông nghiệp và Môi trường Hà Nội | Quản trị viên 02 |
| Cán bộ tiếp nhận hồ sơ — UBND phường Tây Hồ | `intake.tayho@example.test` | `intake` | UBND phường Tây Hồ | Quản trị viên 02 |
| Chuyên viên xử lý hồ sơ — UBND phường Tây Hồ | `specialist.tayho@example.test` | `specialist` | UBND phường Tây Hồ | Quản trị viên 02 |
| Lãnh đạo xem xét — UBND phường Tây Hồ | `leader.tayho@example.test` | `leader` | UBND phường Tây Hồ | Quản trị viên 02 |
| Cán bộ trả kết quả — UBND phường Tây Hồ | `registrar.tayho@example.test` | `registrar` | UBND phường Tây Hồ | Quản trị viên 02 |

Mật khẩu dưới đây là mật khẩu khởi tạo. Mỗi cán bộ dùng mật khẩu trong bảng trực tiếp khi đăng nhập; ứng dụng không yêu cầu đổi mật khẩu lần đầu tại `/staff`.

| Email | Mật khẩu khởi tạo |
|---|---|
| `intake.sotnmt@example.test` | `4UsZJ1lQFLMomtAva5Atgsg4pQ` |
| `specialist.sotnmt@example.test` | `qgYS4XzLYjwvSzYvnMWt6ZP1Nx` |
| `leader.sotnmt@example.test` | `8HbDTeaPXehsqAgCY85vCbzod0` |
| `registrar.sotnmt@example.test` | `LgcGOU6zNOUzSJY29o09YdDaXn` |
| `finance.sotnmt@example.test` | `BhmnjnezorD022olnTpTk0NVBC` |
| `intake.tayho@example.test` | `Abtnt5qKx6FfIKFih7FcopvRRB` |
| `specialist.tayho@example.test` | `kO32N8GGV1mxORGxSuaMIsR4cj` |
| `leader.tayho@example.test` | `AbKcQ96eisrzubgSAZw7fqaDiR` |
| `registrar.tayho@example.test` | `KYTDdgDfV862n3QUUa54FoB2Gq` |

## Sử dụng và phạm vi

- Đăng nhập ở `http://127.0.0.1:8766/staff`; cán bộ dùng mật khẩu khởi tạo đã ghi trong danh sách; không bị buộc đổi mật khẩu khi đăng nhập.
- Hai cán bộ tiếp nhận giúp luồng gửi cục bộ hoạt động cho hai tuyến biểu mẫu đã cấu hình. Chuyên viên, lãnh đạo, trả kết quả và tài chính chỉ nhìn thấy dữ liệu trong phạm vi được cấp.
- Quản trị viên có thể tạo thêm tài khoản, nhưng tài khoản nghiệp vụ chỉ hoạt động sau khi quản trị viên khác duyệt. Tài khoản mẫu trên được cấp theo đúng luồng đó.
- Tài khoản `leader` không có quyền ký Mẫu 06. Chỉ cấp quyền ký khi có văn bản phân công đúng thẩm quyền và được phê duyệt riêng.
- Hiện chưa có tài khoản nào được bật quyền **Quản lý tài khoản tại cơ quan**. Quyền mới này được quản trị viên hệ thống đề nghị cho một cán bộ trong đúng cơ quan; quản trị viên hệ thống khác phải duyệt. Người được giao chỉ xem và lập đề nghị trong phạm vi cơ quan của mình, không tự duyệt và không xem hồ sơ công dân.
- Có thể in hoặc xuất CSV danh sách tài khoản theo cơ quan từ mục **Tài khoản cán bộ**. Tệp không chứa mật khẩu. Quyền xuất tuân theo cùng phạm vi tài khoản.
- Cán bộ nghiệp vụ in/xuất danh sách hồ sơ được phép xem theo vai trò và phạm vi cơ quan. Quản trị viên hệ thống chỉ xuất số liệu tổng hợp theo cơ quan, trạng thái và kỳ; không có quyền tải danh sách hồ sơ cá nhân.
- Báo cáo trong mục **Báo cáo theo cơ quan** là báo cáo vận hành nội bộ, không phải biểu mẫu pháp định. Không in Quốc hiệu, tiêu ngữ, tên cơ quan nhà nước hoặc khối ký/dấu lên bảng kê này. Chưa có biểu mẫu báo cáo theo Thông tư 09/2026/TT-BTP được dựng trong phần mềm.
- Không dùng các tài khoản hoặc dữ liệu cục bộ này để đăng nhập Cổng Dịch vụ công quốc gia hay hệ thống cán bộ Hà Nội. Không dùng phần mềm này để xử lý hồ sơ thật.

> Tệp có chứa mật khẩu dạng chữ. Giữ tệp riêng tư, chỉ dùng với ứng dụng cục bộ và không đưa lên nơi công khai.
