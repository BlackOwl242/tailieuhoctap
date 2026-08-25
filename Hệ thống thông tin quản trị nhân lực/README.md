# KMS — Hệ thống Quản lý Tri thức Nội bộ · Saigon Technology

Web-app quản lý tri thức nội bộ xây dựng theo tài liệu thiết kế tại [`doc/KMS_PLAN.md`](doc/KMS_PLAN.md)
(kế thừa phân tích nghiệp vụ HRMIS trong [`doc/Plan.md`](doc/Plan.md) và [`doc/PTTK_OOP_HR.md`](doc/PTTK_OOP_HR.md)).

> **Clone-and-run:** `git clone` → `docker compose up -d` → mở **http://localhost:8080** → đăng nhập bằng tài khoản demo. Không cần tạo file hay sửa cấu hình gì thêm.

---

## 1. Khởi động nhanh

```bash
# Yêu cầu duy nhất: Docker Desktop / Docker Engine + Git
git clone <repo-url> && cd <repo>
docker compose up -d          # build + khởi động db/api/web (lần đầu ~3-6 phút do pull ảnh)
```

Mở **http://localhost:8080** và đăng nhập:

| Vai                           | Email                    | Mật khẩu      |
| ----------------------------- | ------------------------ | ------------- |
| Quản trị viên (ADMIN)         | `admin@demo.local`       | `Admin@123`   |
| Quản lý tri thức (KM_MANAGER) | `km.manager@demo.local`  | `Manager@123` |
| Trưởng nhóm Java (USER)       | `pm.java@demo.local`     | `Pm@123456`   |
| Nhân viên mới (USER)          | `dev.fresher@demo.local` | `Fresher@123` |
| EDITOR Space QA (USER)        | `editor.qa@demo.local`   | `Editor@123`  |

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
               db (PostgreSQL 16-alpine, 32 bảng, FTS pg_trgm)
```

- **Backend:** NestJS phân tầng Controller → Service → Prisma; JWT access 15' + refresh xoay vòng;
  validation toàn cục; lỗi tập trung một shape JSON; audit log append-only; RBAC hai chiều
  (vai toàn cục × vai theo Space); luồng duyệt bài DRAFT→PENDING_REVIEW→PUBLISHED ghi vết từng bước.
- **Frontend:** Next.js App Router + TailwindCSS + bộ component phong cách shadcn/ui + icon Lucide;
  mobile-first (sidebar desktop / bottom-nav mobile); token z-index cố định
  (content < sticky < dropdown < overlay < modal < toast); xử lý đầy đủ trạng thái loading/rỗng/lỗi.
- **Chấm công đa nguồn:** QR kiosk xoay 30s (token HMAC + jti one-time), khuôn mặt trên trình duyệt
  (vector mã hóa AES-256-GCM), webhook HMAC + CSV import cho máy chấm công, bộ mô phỏng tích hợp.

Chi tiết đầy đủ: [`doc/KMS_PLAN.md`](doc/KMS_PLAN.md).

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
npm test                 # unit test (12 test: auth lockout UC01, QR token, face crypto)
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
2. **Nhận diện khuôn mặt** bản demo dùng vector mô tả ảnh 16×16 (grayscale block-mean) thay vì model AI đầy đủ — đủ để trình diễn cơ chế đồng thuận/mã hóa/so khớp; MediaPipe/model thật là hướng phát triển. Nhãn “chế độ demo” hiển thị thẳng trong UI.
3. **Máy chấm công thật** chưa nối SDK độc quyền (ZKTeco…) — thay bằng webhook HMAC + CSV + simulator; adapter mở rộng đã chừa sẵn.
4. **Tệp đính kèm** phục vụ qua `/uploads` tĩnh với tên ngẫu nhiên uuid (không xác thực download) — chấp nhận cho demo nội bộ.
5. Mật khẩu demo để nguyên trong seed phục vụ trình diễn; bắt buộc đổi trước khi dùng thật.
