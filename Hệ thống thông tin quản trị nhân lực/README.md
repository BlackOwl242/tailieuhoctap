# HRMIS — Hệ thống Thông tin Quản trị Nhân lực · Saigon Technology

Hệ thống thông tin quản trị nhân lực tích hợp xây dựng theo tài liệu thiết kế tại [`doc/PTTK_OOP_HR.md`](doc/PTTK_OOP_HR.md)
và bộ biểu đồ thiết kế UML 48 Use Case tại [`doc/PTTK_OOP_HR_DIAGRAMS.md`](doc/PTTK_OOP_HR_DIAGRAMS.md).

> **Clone-and-run:** `git clone` → `docker compose up -d` → mở **http://localhost:8080** → đăng nhập bằng tài khoản demo. Không cần tạo file hay sửa cấu hình gì thêm.


> **Cập nhật 04/10/2026:** các luồng quyền, chấm công/lương, nhân sự theo ngày hiệu lực, tài sản, hoàn ứng và phát triển năng lực đã được nối thêm. Migration mới đã thử trên DB sạch và áp dụng lên PostgreSQL đang chạy sau khi sao lưu. E2E DB cô lập đạt luồng ghi công → duyệt giải trình → chốt công → tính/duyệt/khóa/chi lương, xác nhận tài sản và hoàn ứng. Lương là baseline tham chiếu 2026 cho bài tập; các giới hạn trước vận hành thật được ghi trong [quy trình lương tham chiếu 2026](doc/QUY_TRINH_TINH_LUONG_VN_THAM_CHIEU_2026.md) và [báo cáo trạng thái](doc/BAO_CAO_TRANG_THAI_SAU_SUA_20261004.md).

---

## 1. Khởi động nhanh

```bash
# Yêu cầu duy nhất: Docker Desktop / Docker Engine + Git
git clone <repo-url> && cd <repo>
docker compose up -d          # build + khởi động db/api/web (lần đầu ~3-6 phút do pull ảnh)
```

Trên Windows, có thể nhấp đúp `Khoi_dong_HRMIS.bat`. File sẽ kiểm tra Docker Compose,
build và khởi động cùng stack `kms` trong thư mục này, đợi giao diện sẵn sàng rồi mở
trình duyệt. Nếu Docker Desktop chưa chạy, hãy mở ứng dụng đó và chạy lại file. Để dừng
hệ thống, chạy `docker compose down` trong thư mục dự án; dữ liệu vẫn được giữ.

Mở **http://localhost:8080** và đăng nhập (trong script `seed.cjs`, mật khẩu khởi tạo mặc định được đồng bộ là `123` cho toàn bộ 11 tài khoản demo để thuận tiện kiểm thử nhanh; cột bên phải ghi kèm mật khẩu phân vai tham chiếu):

| Vai trò                       | Họ tên & Chức danh / Đơn vị | Email                    | Mật khẩu seed (`seed.cjs`) | Mật khẩu phân vai tham chiếu |
| ----------------------------- | --------------------------- | ------------------------ | -------------------------- | ---------------------------- |
| Quản trị CNTT — `ADMIN` | Nguyễn Hoàng Nam, Phòng CNTT | `admin@demo.local` | `123` | `Admin@123` |
| Ban điều hành — `BOD` | Trần Minh Hoàng, Tổng Giám đốc | `ceo@saigontechnology.vn` | `123` | `Admin@123` |
| Cổ đông / HĐQT — `SHAREHOLDER` + `BOD` | Phạm Tiến Thành, Chủ tịch HĐQT | `chairman@saigontechnology.vn` | `123` | `Admin@123` |
| Quản lý nhân sự — `KM_MANAGER` | Dương Khánh Chi, Trưởng ban Nhân sự | `km.manager@demo.local` | `123` | `Manager@123` |
| Quản lý trực tiếp — `LINE_MANAGER` | Lê Minh Tuấn, Trưởng nhóm Java | `pm.java@demo.local` | `123` | `Pm@123456` |
| Chuyên viên C&B — `HR_CB` | Trần Thu Trang | `cb.demo@demo.local` | `123` | `Cb@123456` |
| Kế toán — `ACCOUNTANT` | Nguyễn Thị Hồng | `accountant.demo@demo.local` | `123` | `Acc@123456` |
| Tuyển dụng — `HR_RECRUITER` | Phạm Ngọc Mai | `recruiter.demo@demo.local` | `123` | `Recruit@123` |
| Đào tạo — `HR_TRAINER` | Lê Hoàng Anh | `trainer.demo@demo.local` | `123` | `Trainer@123` |
| Kiểm toán / Pháp chế — `AUDITOR` | Vũ Minh Đức | `auditor.demo@demo.local` | `123` | `Audit@123` |
| Nhân viên — `USER` | Đỗ Gia Hân, Lập trình viên Java | `dev.fresher@demo.local` | `123` | `Fresher@123` |

Tài khoản trình diễn thể hiện vai trò và đơn vị đại diện; quan hệ quản lý trực tiếp
giữa các hồ sơ chỉ được mô phỏng theo cây tổ chức vì mô hình người dùng hiện chưa lưu
trường người quản lý trực tiếp.

Lần đầu chạy, hệ thống **tự động** áp dụng migration và seed dữ liệu mô phỏng
(cây tổ chức Saigon Technology, 6 Space, ~12 bài viết tiếng Việt, onboarding path,
handover checklist, kiosk QR…). Muốn sinh thêm dữ liệu chấm công 14 ngày:

```bash
docker compose exec api node scripts/simulate-device.cjs 14
# hoặc: make simulate
```

### Lệnh hữu ích

| Lệnh                                       | Tác dụng                                      |
| ------------------------------------------ | --------------------------------------------- |
| `docker compose up -d --build`             | Build lại + khởi động toàn bộ                 |
| `docker compose logs -f api`               | Xem log API (JSON structured)                 |
| `docker compose down`                      | Dừng                                          |
| `docker compose down -v`                   | Dừng + **xóa sạch dữ liệu** (seed lại từ đầu) |
| `make up` / `make reset` / `make simulate` | Wrapper tiện lợi (nếu có make)                |
| Swagger UI                                 | http://localhost:3001/api/docs                |

---

## 2. Kiến trúc & công nghệ

```
Trình duyệt ──► web (Next.js 14 standalone, cổng 8080 duy nhất)
                 │  rewrites: /api/* → http://api:3001/*
                 ▼
               api (NestJS 10 + Prisma 5, Node 20-alpine)
                 ▼
               db (PostgreSQL 16-alpine, 102 model và 42 enum trong schema Prisma hiện tại, FTS pg_trgm)
```

- **Backend:** NestJS phân tầng Controller → Service → Prisma; JWT access 15' + refresh xoay vòng;
  validation toàn cục; lỗi tập trung một shape JSON; audit log append-only; RBAC hai chiều
  (vai toàn cục × vai theo Space); luồng duyệt bài DRAFT→PENDING_REVIEW→PUBLISHED ghi vết từng bước.
- **Frontend:** Next.js App Router + TailwindCSS + bộ component phong cách shadcn/ui + icon Lucide;
  mobile-first (sidebar desktop / bottom-nav mobile); token z-index cố định
  (content < sticky < dropdown < overlay < modal < toast); xử lý đầy đủ trạng thái loading/rỗng/lỗi.
- **Chấm công đa nguồn:** QR kiosk xoay 30s (token HMAC + jti one-time), khuôn mặt trên trình duyệt
  (thu phóng 64×64 điểm ảnh, trích xuất 128 chiều Spatial HOG + 128 chiều LBP Texture = vector 256 chiều, mã hóa AES-256-GCM), webhook HMAC + CSV import cho máy chấm công, bộ mô phỏng tích hợp và cơ chế tự động đồng bộ chấm công liên tục (Auto-Attendance Backfill) cho các ngày làm việc trong kỳ mở. Nhận diện khuôn mặt hiện chạy trên trình duyệt cho mục đích demo học phần; không có cảm biến IR/3D liveness hoặc kết nối SDK máy chấm công thật.

Chi tiết đầy đủ: [`doc/PTTK_OOP_HR.md`](doc/PTTK_OOP_HR.md) và [`plans/ke-hoach-cai-thien-hrms.md`](plans/ke-hoach-cai-thien-hrms.md).

---

## 3. Biến môi trường

Toàn bộ biến nằm trong [`.env.example`](.env.example). Compose có sẵn giá trị mặc định an toàn cho demo —
**không cần tạo `.env` cũng chạy được**. Khi triển khai thật, copy `.env.example` → `.env` và tối thiểu đổi:

| Biến                                | Bắt buộc đổi khi production | Ghi chú                                            |
| ----------------------------------- | --------------------------- | -------------------------------------------------- |
| `JWT_SECRET`                        | ✔ (≥ 32 ký tự)              | API từ chối khởi động nếu thiếu/yếu                |
| `POSTGRES_PASSWORD`, `DATABASE_URL` | ✔                           | Khớp nhau                                          |
| `DEFAULT_ADMIN_PASSWORD`            | ✔                           | Chỉ dùng lúc seed lần đầu                          |
| `PUBLIC_BASE_URL`                   | Khi demo QR bằng điện thoại | Đổi thành IP LAN, ví dụ `http://192.168.1.20:8080` |
| `WEB_PORT` / `API_PORT`             | Nếu trùng cổng              | Mặc định 8080 / 3001                               |

---

## 4. Kiểm thử

```bash
cd backend
npm test                 # unit test và hồi quy; bộ kiểm tra cô lập hiện tại gồm 68 bài kiểm thử (chi tiết tại báo cáo trạng thái)
RUN_E2E=1 DATABASE_URL=... npm run test:e2e   # e2e cần DB đang chạy
node scripts/smoke.mjs   # smoke 25 bước qua web proxy (stack phải đang chạy)
```

CI (GitHub Actions): `.github/workflows/ci.yml` — backend test/build với Postgres service + frontend build.

---

## 5. Troubleshooting

| Hiện tượng                                 | Xử lý                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Cổng 8080/3001 bị chiếm                    | Tạo `.env` đặt `WEB_PORT=8081`… rồi `docker compose up -d`                                                                                    |
| Quét QR bằng điện thoại không kết nối được | Điện thoại phải cùng mạng LAN; đặt `PUBLIC_BASE_URL=http://<IP-máy>:8080` rồi restart `web`; hoặc dùng nút **“Giả lập quét”** ngay trên kiosk |
| Lần đầu pull ảnh chậm                      | Bình thường (~1-2 GB lần đầu); các lần sau dùng cache                                                                                         |
| Muốn dữ liệu demo “sạch” hoàn toàn         | `docker compose down -v && docker compose up -d`                                                                                              |
| Windows: lỗi đường dẫn/volume              | Đảm bảo Docker Desktop dùng WSL2 backend                                                                                                      |

---

## 6. Giả định đã đưa ra (do tài liệu chưa chi tiết hóa)

1. **Editor Markdown** (textarea + preview) thay cho TipTap — phương án dự phòng đã ghi trong mục rủi ro của kế hoạch; tính năng không đổi.
2. **Nhận diện khuôn mặt & Tự động đồng bộ công (Auto-Attendance Backfill):** Bản demo thu phóng khung hình gương mặt về lưới **64×64 điểm ảnh**, trích xuất **128 chiều Spatial HOG + 128 chiều LBP Texture = vector đặc trưng 256 chiều** (chuẩn hóa L2 và mã hóa **AES-256-GCM**) để đối sánh Cosine Similarity thay vì model AI sâu nặng; đồng thời tích hợp cơ chế **Tự động đồng bộ chấm công liên tục (Auto-Attendance Backfill)** tự động điền đủ công cho các ngày làm việc từ đầu tháng đến ngày hiện tại khi kỳ chấm công đang `OPEN` để phục vụ kiểm thử và trình diễn học phần.
3. **Máy chấm công thật** chưa nối SDK độc quyền (ZKTeco…) — thay bằng webhook HMAC + CSV + simulator; adapter mở rộng đã chừa sẵn.
4. **Tệp đính kèm** phục vụ qua `/uploads` tĩnh với tên ngẫu nhiên uuid (không xác thực download) — chấp nhận cho demo nội bộ.
5. Mật khẩu demo trong `seed.cjs` được đặt mặc định là `123` để thuận tiện trình diễn học phần; bắt buộc đổi trước khi dùng thật.




