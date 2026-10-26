# Cập nhật bản Docker đang chạy — 26/10/2026

Nguyên nhân giao diện chưa đổi: mã nguồn và bản build kiểm thử đã mới, nhưng `localhost:8080` vẫn phục vụ image Docker được tạo từ 7 ngày trước. Container không gắn trực tiếp thư mục mã nguồn nên build ngoài Docker không cập nhật trang đang chạy.

Đã hoàn tất:

- Build lại `kms-api` và `kms-web` từ workspace hiện tại, thay hai container đang phục vụ cổng 3001/8080.
- Sao lưu PostgreSQL trước triển khai tại `C:\Users\legen\.codex\backups\hrmis\before-ui-update-20261026-135645.dump`.
- Áp dụng hai migration `20261024000000_practical_hr_workflows` và `20261025000000_payroll_attendance_version`; tổng 33 migration, Prisma báo schema đã cập nhật đầy đủ.
- Đặt `SEED_ON_FIRST_RUN=false` khi khởi động lại API để không chạy lại bộ tạo/sync tài khoản mẫu.
- Kiểm tra API, web và PostgreSQL đều healthy. Xác minh trực tiếp các JavaScript bundle được phục vụ tại `localhost:8080`: khung lương thuộc menu Tiền lương, trang có bảng mới và hộp thoại tạo/sửa/chi tiết; trang hướng dẫn thao tác mới cũng đã có.

Sau triển khai, tab đã mở từ trước cần tải lại toàn bộ bằng **Ctrl+F5** để nạp JavaScript mới.

Lần sau, khi muốn cập nhật dịch vụ Docker sau sửa mã nguồn, chạy PowerShell tại thư mục dự án:

```powershell
$env:SEED_ON_FIRST_RUN = 'false'
docker compose build api web
docker compose up -d --no-deps --wait --wait-timeout 120 api web
docker compose ps
```

API tự chạy migration trước khi khởi động. Cần sao lưu dữ liệu trước các đợt có migration. Thay container không yêu cầu xóa volume dữ liệu.

## Bổ sung điều chỉnh khung lương đã duyệt

Quyền phê duyệt thông thường: Phụ trách quản trị nhân sự (`KM_MANAGER`), khác tài khoản lập/sửa bản nháp gần nhất. Ban Giám đốc (`BOD`) và Quản trị viên (`ADMIN`) vẫn được duyệt khi cần; không có bước bắt buộc chờ BOD duyệt thêm sau KM_MANAGER. Các role `HR_CB`, `HR_RECRUITER` không có quyền duyệt. Đã ghi rõ role, điều kiện và từng bước duyệt trong hướng dẫn ngay trên trang Khung lương, mô tả hộp thoại, thông báo lưu nháp, chi tiết bản nháp và trang Hướng dẫn tiền lương. Danh sách việc chờ xử lý của KM_MANAGER cũng hiển thị khung chờ duyệt, loại các bản do chính tài khoản lập/sửa gần nhất.

- Menu của khung đã duyệt có **Điều chỉnh khung lương** cho ADMIN, KM_MANAGER, HR_CB. Form điền sẵn thông tin; giữ mã gốc và chọn ngày áp dụng từ ngày mai, sau ngày bắt đầu bản gốc.
- Lưu tạo bản nháp liên kết bản gốc. Nếu đã có bản nháp, menu chuyển thành **Sửa bản điều chỉnh**. Người khác người lập/sửa gần nhất phải duyệt. Bản cũ giữ nguyên trong lúc chờ duyệt.
- Khi duyệt, giao dịch tự kết thúc bản gốc vào ngày trước ngày bản điều chỉnh có hiệu lực. Chặn trùng thời gian, trùng bản điều chỉnh và các thao tác đồng thời.
- Các tra cứu theo ngày của hồ sơ lương, thử việc và offer chọn đúng phiên bản. Bảng lương tiếp tục dùng cấu trúc phụ cấp đã cấu hình cho mã khung; mức lương hợp đồng không tự thay đổi.
- Migration mới: `20261026000000_salary_band_amendments`, tổng 34 migration. Sao lưu trước triển khai: `C:\Users\legen\.codex\backups\hrmis\before-salary-band-amendment-20261026-143425.dump`.
- Kiểm thử: 139 unit test nền đã qua; thêm kiểm thử kế thừa cấu trúc lương (14/14 test trong suite payroll); 12/12 E2E qua trên PostgreSQL tách biệt. Build Docker API và web thành công.
- Đã thay container API/web tại `localhost:3001`/`localhost:8080`, cả hai healthy; PostgreSQL 16 chính đã áp dụng đủ 34 migration. Kiểm thử trình duyệt trên web Docker với API giả lập tách biệt: 14 kiểm tra qua ở chiều rộng 1280/375, gồm mở khung đã duyệt, điền sẵn, tạo bản điều chỉnh, mở lại và sửa bản chờ duyệt; không có lỗi JavaScript. Kiểm tra ảnh giao diện hộp thoại trên màn hình nhỏ.
- Bổ sung kiểm thử phân quyền KM_MANAGER: duyệt bản HR lập, chặn tự duyệt bản tự lập và bản vừa sửa, chặn HR_CB/recruiter/kế toán/nhân viên duyệt, hiển thị đúng việc chờ xử lý. 13/13 E2E qua trên cơ sở dữ liệu tách biệt. Quyền ngừng áp dụng khung và phê duyệt kỳ lương giữ nguyên ADMIN/BOD.
- Đã triển khai quyền KM_MANAGER vào API và web Docker, cả hai healthy. Xác minh metadata quyền ngay trong API đang chạy: approve = ADMIN/KM_MANAGER/BOD, deactivate = ADMIN/BOD. Kiểm thử trình duyệt trên bản web Docker với API giả lập: 15 kiểm tra qua, gồm KM_MANAGER duyệt hồ sơ của người khác và nút tự duyệt bị khóa; không có lỗi JavaScript.
