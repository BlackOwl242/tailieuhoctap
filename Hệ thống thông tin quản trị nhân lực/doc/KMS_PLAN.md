# HRMIS — KIẾN TRÚC KỸ THUẬT & KẾ HOẠCH TRIỂN KHAI

> **Tài liệu này trả lời câu hỏi: "Hệ thống được XÂY bằng gì và đã đi đến đâu?"**
> - Kiến trúc 3 service chạy Docker, stack công nghệ và lý do chọn;
> - Bản đồ module backend, mô hình dữ liệu, API RESTful;
> - Các luồng kỹ thuật điển hình (đăng nhập, duyệt bài, điểm danh QR, tính lương);
> - Quy ước bảo mật, quy ước frontend, kế hoạch triển khai và kết quả nghiệm thu.
>
> **Muốn hiểu hệ thống LÀM GÌ (nghiệp vụ, đối tượng sử dụng, quy trình, chức năng từng trang)?** Đọc [`doc/Plan.md`](Plan.md) trước — tài liệu này là phần kỹ thuật đi kèm.

---

## MỤC LỤC

1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể)
2. [Stack công nghệ & lý do chọn](#2-stack-công-nghệ--lý-do-chọn)
3. [Backend — bản đồ module nghiệp vụ](#3-backend--bản-đồ-module-nghiệp-vụ)
4. [Mô hình dữ liệu — các miền chính](#4-mô-hình-dữ-liệu--các-miền-chính)
5. [API RESTful — quy ước & nhóm endpoint chính](#5-api-restful--quy-ước--nhóm-endpoint-chính)
6. [Bốn luồng kỹ thuật điển hình](#6-bốn-luồng-kỹ-thuật-điển-hình)
7. [Bảo mật & yêu cầu phi chức năng](#7-bảo-mật--yêu-cầu-phi-chức-năng)
8. [Frontend — cấu trúc & quy ước](#8-frontend--cấu-trúc--quy-ước)
9. [Kế hoạch triển khai & kết quả nghiệm thu](#9-kế-hoạch-triển-khai--kết-quả-nghiệm-thu)
10. [Hạn chế đã biết & lộ trình phát triển](#10-hạn-chế-đã-biết--lộ-trình-phát-triển)
11. [Phụ lục A — Biến môi trường](#11-phụ-lục-a--biến-môi-trường)
12. [Phụ lục B — Ma trận quyền chi tiết](#12-phụ-lục-b--ma-trận-quyền-chi-tiết)

---

## 1. Kiến trúc tổng thể

### 1.1. Ba service trong một `docker-compose.yml`

```
Trình duyệt / Điện thoại
        │  http://localhost:8080  (cổng DUY NHẤT người dùng cần nhớ)
        ▼
┌─────────────────────────────────────────────┐
│  web — Next.js 14 (node:20-alpine)          │
│  • output 'standalone' — 1 tiến trình Node  │
│  • rewrites /api/:path* → http://api:3001   │
│    (web vừa phục vụ UI vừa làm reverse      │
│     proxy → không cần nginx riêng)          │
└──────────────────┬──────────────────────────┘
                   │ HTTP nội mạng docker
┌──────────────────▼──────────────────────────┐
│  api — NestJS (node:20-alpine)              │
│  • REST + Swagger tại /api/docs             │
│  • JwtAuthGuard → RolesGuard                │
│  • 35 module nghiệp vụ (mục 3)              │
│  • Entrypoint tự chạy prisma migrate deploy │
│    + seed khi DB rỗng                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  db — PostgreSQL 16-alpine                  │
│  • FTS: tsvector + pg_trgm + index GIN      │
│  • Healthcheck pg_isready; volume kms_db_data│
└─────────────────────────────────────────────┘

Máy chấm công thật ──webhook HMAC / CSV──▶ api (không cần mở kết nối ngược)
Volume kms_uploads ── tệp đính kèm, tài liệu
```

**Nguyên tắc triển khai:** người dùng cuối chỉ chạm một cổng (8080); cổng API 3001 mở tùy chọn để xem Swagger; PostgreSQL không expose ra host mặc định. Toàn bộ biến cấu hình qua `.env` với giá trị mặc định an toàn `${VAR:-default}` — chạy được kể cả khi chưa có file `.env`.

### 1.2. Phân tầng backend (đối chiếu lớp Biên – Điều khiển – Thực thể)

| Lớp (OOAD) | Hiện thực trong NestJS | Ví dụ |
| --- | --- | --- |
| Biên (Boundary) | Controller + DTO + ValidationPipe | `LeaveController`, `CreateLeaveDto` |
| Điều khiển (Control) | Service nghiệp vụ | `PayrollService.calculate()`, `AttendanceService.checkIn()` |
| Thực thể (Entity) | Prisma models | `Employee`, `Payslip`, `AttendanceEvent` |

Quy tắc phụ thuộc: **Controller → Service → PrismaService**; module nghiệp vụ không gọi chéo mà phát sự kiện (`article.published`, `attendance.event.created`) cho module khác đăng ký.

---

## 2. Stack công nghệ & lý do chọn

| Tầng | Công nghệ | Lý do chọn |
| --- | --- | --- |
| Backend | **NestJS 10 (TypeScript)** | Phân tầng module–controller–service sẵn có; Guard/Pipe/Filter/Interceptor chuẩn hóa validation – lỗi – phân quyền – logging |
| ORM | **Prisma 5** | Schema khai báo rõ ràng; migration tự chạy trong container — chìa khóa clone-and-run; type-safe end-to-end |
| CSDL | **PostgreSQL 16-alpine** | Nhẹ (~80MB); có sẵn FTS + pg_trgm cho tìm kiếm tiếng Việt không cần dịch vụ thêm; JSONB linh hoạt |
| Frontend | **Next.js 14 App Router + TypeScript** | Routing theo thư mục; standalone output cho Docker; một ngôn ngữ TS chung cả hai đầu |
| UI | Tailwind CSS + design tokens tự định nghĩa | Nhẹ, kiểm soát tốt spacing/màu; token hóa để đồng bộ toàn app |
| State FE | TanStack Query + Zustand | Query cache/retry/invalidation chuẩn CRUD; Zustand nhẹ cho auth/UI state |
| Xác thực | JWT access 15' + refresh 7' (xoay vòng), bcrypt cost 12 | Không cần dịch vụ ngoài; refresh token lưu hash để thu hồi được |
| QR điểm danh | qrcode (sinh) + quét camera trình duyệt | Thuần JS, mọi trình duyệt có camera, không cần app riêng |
| Khuôn mặt | Trích vector ngay trên trình duyệt (WASM), mã hóa AES-256-GCM trước khi lưu | Không cần GPU/dịch vụ Python; tuân thủ bảo vệ dữ liệu sinh trắc học |
| Logging | pino JSON + requestId interceptor | Structured log, dễ lọc |
| API docs | @nestjs/swagger | Swagger UI tự sinh tại `/api/docs` |
| Container | Docker Compose v2, multi-stage build | Chuẩn hóa môi trường; 3 service core |

**Vì sao không chọn phương án khác (tóm tắt):** Spring Boot/.NET nặng hơn nhiều lần cho demo solo-dev; SQL Server ảnh container nặng + EULA; Elasticsearch/Meilisearch thêm service trong khi Postgres FTS đủ cho demo; InsightFace (Python) phá mục tiêu 3 service nhẹ.

---

## 3. Backend — bản đồ module nghiệp vụ

Toàn bộ module đăng ký trong [`backend/src/app.module.ts`](../backend/src/app.module.ts). Nhóm theo miền nghiệp vụ:

| Nhóm | Module | Nghiệp vụ đảm nhiệm |
| --- | --- | --- |
| **Nền tảng** | `AuthModule` | Đăng nhập JWT + refresh xoay vòng, khóa tài khoản sai 5 lần/15', logout-all |
| | `UsersModule` · `OrgUnitsModule` | Tài khoản & vai; cây tổ chức tự tham chiếu |
| | `SettingsModule` · `AuditModule` · `HealthModule` | Tham số key–value; audit log append-only; healthcheck |
| | `DashboardModule` · `NotificationsModule` · `SearchModule` | Số liệu theo vai; thông báo in-app; tìm kiếm toàn văn FTS |
| **Tri thức (KMS)** | `SpacesModule` · `ArticlesModule` · `CommentsModule` | Space phân cấp + vai theo Space; bài viết + phiên bản bất biến; bình luận Q&A |
| | `OnboardingModule` · `PeopleModule` | Lộ trình hội nhập + tiến độ; directory "tìm chuyên gia" |
| **Chấm công** | `AttendanceModule` | Token QR HMAC, check-in đa nguồn, enroll khuôn mặt, thiết bị webhook/CSV/simulator, bảng công ngày, hiệu chỉnh có vết |
| | `HrmsShiftsModule` | Loại ca, dung sai, bảng phân ca |
| | `HrmsRegularizationModule` | Đơn giải trình bổ sung giờ công + duyệt bù công |
| **Nhân sự lõi** | `EmployeesModule` | Hồ sơ NV, mã NV tự sinh, hợp đồng, văn bằng chứng chỉ (kho lưu trữ kép) |
| | `LeaveModule` · `OvertimeModule` | Quỹ phép năm + thâm niên, duyệt trừ quỹ NGAY; OT duyệt trước mới tính tiền |
| | `PayrollModule` | Chu trình kỳ lương OPEN→CALCULATED→REVIEWED→LOCKED; phiếu lương điện tử |
| | `RecruitmentModule` | Phiếu đề xuất + ứng viên theo giai đoạn |
| | `PerformanceModule` · `TrainingModule` | Đánh giá chu kỳ 6 tháng; khóa học + ghi danh giới hạn chỗ |
| | `PersonnelActionsModule` | **Một bộ máy duyệt dùng chung 5 loại biến động** (thuyên chuyển/lương/khen/kỷ luật/thôi việc); duyệt thôi việc tự sinh checklist bàn giao |
| | `DocumentsModule` | Kho tài liệu quy trình + upload |
| **Chuẩn BNV** | `PersonnelProfilesModule` | Hồ sơ 2C-BNV/2008: 111 thuộc tính + 8 bảng quá trình |
| | `PersonnelRanksModule` | Danh mục 184 ngạch NĐ 204; hệ số, chu kỳ giữ bậc |
| | `PersonnelReportsModule` | Quét nâng bậc; xuất PDF 2C 4 trang; Biểu 01/02/03 Excel |
| **Mở rộng chuẩn Frappe (v16)** | `HrmsPayrollModule` | Cấu trúc lương đa thành phần, chạy kỳ 1-click, breakdown phiếu |
| | `HrmsLoansModule` | Vay/tạm ứng phúc lợi, EMI ≤ 30% net, nạp vào bảng lương |
| | `HrmsAssetsModule` | Cấp phát/thu hồi tài sản kèm biên bản BLLĐ 129–130 |
| | `HrmsExpensesModule` | Công tác phí: chuyến đi, tạm ứng, quyết toán |
| | `HrmsLifecycleModule` | Onboarding checklist, bổ nhiệm, điều chuyển, thôi việc |
| | `HrmsPerformanceModule` · `HrmsTrainingModule` · `HrmsRecruitmentModule` | KRA/KPI + phản hồi 360; chương trình đào tạo + khiếu nại; ATS Kanban |

---

## 4. Mô hình dữ liệu — các miền chính

Schema đầy đủ tại [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). Các bảng nhóm thành 9 miền:

| Miền | Bảng tiêu biểu | Điểm thiết kế đáng nhớ |
| --- | --- | --- |
| ① Định danh & tổ chức | `users`, `roles`, `user_roles`, `refresh_tokens`, `org_units` | `org_units` cây tự tham chiếu (parent_id + path) — "cây tổ chức là dữ liệu"; user có employee_code tự sinh NV0001… |
| ② Space & nội dung | `spaces`, `space_members`, `articles`, `article_versions`, `attachments` | `article_versions` **bất biến chỉ INSERT**; visibility PUBLIC/RESTRICTED/PRIVATE |
| ③ Xuất bản & phê duyệt | `article_reviews` | Event-log luồng duyệt — timeline hiển thị thẳng từ bảng này |
| ④ Tương tác | `comments`, `reactions`, `article_views`, `bookmarks`, `space_follows` | Bình luận 2 cấp có đánh dấu resolved |
| ⑤ Vòng đời con người | `onboarding_paths/_items/_assignments/_progress`, `handover_checklists/_items` | Checklist handover đủ DONE mới đóng; có item mặc định "xóa mẫu khuôn mặt" |
| ⑥ Hệ thống | `notifications`, `audit_logs`, `settings` | `audit_logs` **APPEND-ONLY** ở mọi tầng |
| ⑦ Chấm công | `attendance_devices`, `attendance_events`, `attendance_days`, `attendance_corrections` | Sự kiện thô append-only ghi rõ nguồn; tổng hợp 1 dòng/người/ngày; hiệu chỉnh luôn kèm lý do |
| ⑧ HR doanh nghiệp | `contracts`, `certificates`, `leave_requests`, `leave_balances`, `overtime_requests`, `payroll_periods`, `payslips`, `job_requisitions`, `candidates`, `performance_reviews`, `training_courses/_enrollments`, `personnel_actions`, `hr_documents` | Duyệt phép = trừ quỹ NGAY; kỳ lương LOCKED chặn tính lại (409); personnel_actions là ApprovalEngine dùng chung |
| ⑨ Cán bộ BNV | `civil_servant_ranks`, `civil_servant_profiles` + 8 bảng quá trình (salary_histories, appointments, educations, work_histories, reward_disciplines, family_relations, appraisals, social_activities) | Profile 111 trường liên kết 1-1 với user; ranks chứa coefficients jsonb theo NĐ 204 |
| ⑩ Mở rộng v16 | `hrms_employee_loans`, `hrms_asset_allocations`, `hrms_attendance_regularizations`, ca kíp, cấu trúc lương… | EMI ≤ 30% net kiểm tra ở tầng service |

### Hai máy trạng thái trung tâm

```
Article:   DRAFT ──submit──▶ PENDING_REVIEW ──approve──▶ PUBLISHED ──archive──▶ ARCHIVED
             ▲                    │                          ▲                    │
             └── request_changes ─┘                          └──── un-archive ───┘
           (mọi chuyển trạng thái ghi 1 dòng article_reviews + audit_log)

Employee:  PROBATION ──đánh giá đạt──▶ ACTIVE ──┬──▶ RESIGNED / RETIRED ──▶ ARCHIVED (bất biến)
                 │                              └── biến động (TRANSFER/SALARY_ADJUST/
                 └─ không đạt ─▶ TERMINATED_PROBATION            AWARD/DISCIPLINE) rồi quay về ACTIVE

PayrollPeriod: OPEN ──calculate──▶ CALCULATED ──review──▶ REVIEWED ──lock──▶ LOCKED (chặn tính lại)
```

---

## 5. API RESTful — quy ước & nhóm endpoint chính

Tiền tố `/api/v1`; tài nguyên danh từ số nhiều; lọc `?page=&limit=&sort=`; mã HTTP chuẩn; mọi lỗi theo một shape thống nhất:

```json
{
  "statusCode": 403,
  "code": "SPACE_FORBIDDEN",
  "message": "Bạn không có quyền đọc Space này",
  "path": "/api/v1/articles/9f2c...",
  "requestId": "req_a1b2c3",
  "timestamp": "2026-08-23T12:00:00.000Z"
}
```

Nhóm endpoint chính (chi tiết đầy đủ xem Swagger `/api/docs`):

| Nhóm | Endpoint đại diện | Ai được phép |
| --- | --- | --- |
| Auth | `POST /auth/login` · `/auth/refresh` · `/auth/logout` · `/auth/logout-all` · `GET /auth/me` | công khai / authenticated |
| Người dùng & tổ chức | `/users` · `/org-units/tree` | ADMIN (ghi) |
| Tri thức | `/spaces` · `/spaces/:id/articles` · `/articles/:id/submit` · `/reviews/pending` · `/search?q=` | theo vai Space |
| Chấm công | `GET /attendance/kiosk/token` (PUBLIC, TTL 30s) · `POST /attendance/check-in` · `/attendance/face/enroll` · `/attendance/devices/:id/events` (HMAC) · `/attendance/import/csv` · `/attendance/days` | authenticated / ADMIN |
| Nhân sự lõi | `/employees` · `/leave` (+approve) · `/overtime` (+approve) · `/payroll/periods` (+calculate/review/lock) · `/payroll/payslips/mine` | authenticated; duyệt: HR; khóa: ADMIN |
| Tuyển dụng – hiệu suất – đào tạo | `/recruitment/requisitions` · `/recruitment/candidates` · `/performance` · `/training/courses` | tạo: mọi người; duyệt: HR |
| Biến động | `/personnel-actions` (+approve/reject) | tạo: mọi người; duyệt: ADMIN |
| Mở rộng v16 | `/hrms/payroll-runs` · `/hrms/loans` · `/hrms/assets` · `/hrms/expenses` · `/hrms/attendance-regularizations` | nhân viên (của mình); HR (duyệt) |
| Cán bộ BNV | `/civil-servants` · `/civil-servants/ranks` · `/civil-servants/salary/scan-progression` · `/civil-servants/:id/export-2c-pdf` · `/civil-servants/reports/bieu-0{1,2,3}-xlsx` | ADMIN, HR |
| Hệ thống | `/dashboard/stats` · `/admin/settings` · `/admin/audit-logs` · `/healthz` · `/readyz` | theo vai |

---

## 6. Bốn luồng kỹ thuật điển hình

### Luồng 1 — Xác thực

```
login ──▶ bcrypt.compare → sai: failed_login_attempts++ (≥5 → LOCKED 15')
       └─▶ đúng: reset counter, cấp access(15') + refresh(7 ngày, lưu hash DB)
FE axios interceptor: gặp 401 → POST /auth/refresh (1 lần) → retry request gốc
logout / admin khóa → revoked_at hoặc status≠ACTIVE → mọi token kế tiếp bị chặn ở Guard
```

### Luồng 2 — Xuất bản bài viết (luồng ba tầng đề xuất → thẩm định → phê duyệt)

```
Tác giả soạn ──PUT /articles/:id──▶ sinh ArticleVersion(n+1), status=DRAFT
   ──POST /submit──▶ status=PENDING_REVIEW + review(SUBMIT) + notify(MANAGER Space)
Reviewer ──GET /reviews/pending──▶ POST /review {action}
   ├─ APPROVE         ─▶ PUBLISHED + notify(tác giả) + audit
   └─ REQUEST_CHANGES ─▶ về DRAFT + comment + notify(tác giả) + audit
Sửa bài PUBLISHED = version mới; rollback khôi phục bản cũ; không bao giờ sửa đè.
```

### Luồng 3 — Điểm danh QR chống giả mạo

```
Kiosk ──GET /attendance/kiosk/token──▶ token ký HMAC {kiosk_id, iat, jti}, TTL 30s → render QR
   (kiosk tự gọi lại mỗi 30s → mã luôn xoay, chặn chụp ảnh tái sử dụng)
Nhân viên quét → deep-link /check-in?token=... → xác nhận
   ──POST /attendance/check-in {qr_token}──▶ verify chữ ký + TTL ≤60s + jti chưa dùng
   + chưa check-in ±2 phút → INSERT attendance_events (append-only)
   → event handler tổng hợp attendance_days → phản hồi "Chấm công 08:02 ✓"
Sự kiện máy chấm công (webhook HMAC header / CSV import) đổ cùng một bảng → một nguồn sự thật.
```

### Luồng 4 — Chu kỳ tính lương

```
Đầu vào: attendance_days (đã chốt) + overtime APPROVED + leave đã duyệt
        + base_salary từ hợp đồng ACTIVE + salary structure + khoản vay EMI
1-Click Run ──▶ gross = lương cơ bản + phụ cấp + OT(hệ số 150/200/300%)
            ──▶ khấu trừ BHXH 10,5% (NLĐ) → thuế TNCN lũy tiến 7 bậc
                (giảm trừ 11tr + 4,4tr/người phụ thuộc) → EMI vay (≤30% net)
            ──▶ net_pay + breakdown từng khoản → payslip per employee
Khóa kỳ (ADMIN) ──▶ LOCKED: mọi lời gọi calculate lại bị chặn 409; điều chỉnh sau khóa qua quyết định riêng.
```

---

## 7. Bảo mật & yêu cầu phi chức năng

| Hạng mục | Thiết kế |
| --- | --- |
| Validation | ValidationPipe toàn cục (`whitelist`, `forbidNonWhitelisted`, `transform`); DTO class-validator cho 100% endpoint ghi |
| Xử lý lỗi tập trung | AllExceptionsFilter → shape JSON thống nhất; BusinessException kèm code; prod không lộ stack trace |
| Logging | pino JSON; gắn requestId; redact trường nhạy cảm (password, face_embedding) |
| Xác thực | bcrypt cost 12; JWT secret ≥ 32 ký tự bắt buộc khi production; khóa tài khoản 5 lần sai/15 phút; rate limit login |
| Ủy quyền | JwtAuthGuard → RolesGuard; quyền hai chiều: vai toàn cục × phạm vi dữ liệu (bản thân/nhóm/Space/toàn công ty); lọc phạm vi ngay trong SQL, không lọc phía FE |
| Sinh trắc học | Vector khuôn mặt mã hóa AES-256-GCM; chỉ thu thập sau đồng thuận rõ ràng; không lưu ảnh gốc; xóa mẫu khi offboarding |
| Chống gian lận điểm danh | QR xoay 30s + TTL 60s + jti one-time; webhook thiết bị bắt buộc HMAC + timestamp; dedupe ±2 phút; rate limit per-user |
| Upload | Whitelist loại tệp (pdf/png/jpg/jpeg/webp/md/txt/docx/xlsx/pptx) ≤ 10MB, kiểm magic-number; tên lưu ngẫu nhiên chống đè |
| Hiệu năng | Phân trang mọi danh sách; index GIN pg_trgm (title, content), btree (status, space_id), composite (user_id, work_date); tránh N+1 bằng include của Prisma |
| Khả dụng | Healthcheck cả 3 service; `depends_on: condition: service_healthy`; restart `unless-stopped` |
| Kiểm thử | Jest unit test service trọng yếu (workflow, permission, QR token verify, attendance aggregation); e2e Supertest 4 luồng chính; script nghiệm thu `backend/scripts/verify-hr.mjs` |

---

## 8. Frontend — cấu trúc & quy ước

### 8.1. Cấu trúc thư mục

```
frontend/src/
├── app/
│   ├── login/ · kiosk/ · check-in/     # trang ngoài khung đăng nhập
│   └── (app)/                          # route group có AppShell (sidebar + topbar)
│       ├── dashboard/ ess/ profile/ notifications/
│       ├── employees/ org-chart/ personnel-profiles/ assets/ lifecycle/ salary-ranks/ salary-progression/
│       ├── shifts/ attendance/ leave/ overtime/
│       ├── payroll-engine/ loans/ expense-claims/ payroll/
│       ├── recruitment-ats/ performance-360/ training-grievance/
│       ├── personnel-reports/ spaces/ documents/ review/
│       └── admin/{users,org-units,attendance,settings,audit}/
├── components/layout/app-shell.tsx     # NAV_GROUPS — nguồn chân truth của menu
├── components/ui/data-table.tsx        # DataTable dùng chung (tìm kiếm, lọc, sắp xếp, phân trang)
├── lib/hr.ts                           # NHÃN NGHIỆP VỤ tập trung (map trạng thái → tiếng Việt)
├── lib/api.ts                          # axios client + interceptor refresh
└── lib/auth-store.ts                   # Zustand auth state
```

> Danh sách trang đầy đủ kèm chức năng và đối tượng sử dụng từng trang: xem [`doc/Plan.md`](Plan.md) mục 6.

### 8.2. Quy ước bắt buộc khi bảo trì

1. **Menu:** thêm trang mới = thêm dòng vào `NAV_GROUPS` trong [`app-shell.tsx`](../frontend/src/components/layout/app-shell.tsx); hạn chế trang hiện theo vai dùng prop `roles`.
2. **Design token spacing:** chỉ dùng `p-card`, `gap-stack`, `card-lg`… — cấm giá trị tùy tiện.
3. **DataTable:** mọi bảng quản lý mới kế thừa `components/ui/data-table.tsx`, không tự viết `<table>`.
4. **Nhãn trạng thái:** map qua `lib/hr.ts` — không hardcode chuỗi tiếng Việt rải rác trong page.
5. **In ấn:** nội dung in bọc `.print-area` + `PrintFrame`; nút in dùng `PrintButton`; CSS in A4 tại `globals.css`.
6. **Command Palette (Ctrl+K):** điều hướng nhanh đến mọi màn hình, tra cứu nhân viên, mở form tạo đơn — thêm màn hình mới phải đăng ký vào palette.
7. **Mobile:** bottom-nav 5 mục (Tổng quan · Tổ chức · Cá nhân · Chấm công · Lương); drawer menu cho nhóm còn lại.

---

## 9. Kế hoạch triển khai & kết quả nghiệm thu

### 9.1. Các giai đoạn đã hoàn tất

| Giai đoạn | Nội dung | Trạng thái |
| --- | --- | --- |
| G0 — Nền móng | Monorepo + compose 3 service + Auth JWT + seed idempotent | ✅ |
| G1 — Lõi tổ chức & nội dung | OrgUnits, Users, Spaces, Articles + versions bất biến | ✅ |
| G2 — Luồng duyệt & cộng tác | ReviewWorkflow, Comments, Notifications, Audit | ✅ |
| G3 — Khám phá tri thức + QR | FTS/pg_trgm, search-first, kiosk QR xoay 30s, bảng công ngày | ✅ |
| G4 — Khuôn mặt, máy chấm công, hội nhập/handover | Face enroll, webhook/CSV/simulator, onboarding, handover | ✅ |
| G5 — HRMIS lõi | Employees, Leave, Overtime, Payroll, Recruitment, Performance, Training, PersonnelActions, Documents (16 bảng) | ✅ |
| G6 — Chuẩn BNV | Hồ sơ 2C 111 trường, 184 ngạch NĐ 204, quét nâng bậc, xuất PDF/Biểu Excel | ✅ |
| G7 — Nâng cấp v16 chuẩn Frappe | Shifts, Payroll Engine, Loans, Assets, Expenses, Regularization, ATS Kanban, 360, Org Chart tương tác, ESS, Command Palette | ✅ |

### 9.2. Kết quả nghiệm thu

- **Build + lint + type-check: 0 lỗi** cả backend và frontend (46/46 pages build thành công).
- **E2E trên Docker chạy thật** bằng `backend/scripts/verify-hr.mjs`: **39 PASS / 0 FAIL**, phủ các luồng:
  - Kiosk token công khai; đăng nhập 2 tài khoản; đăng xuất thu hồi token (401);
  - Hồ sơ NV: danh sách, mã NV, chi tiết kèm hợp đồng + chứng chỉ;
  - Nghỉ phép: chặn đơn vượt quỹ (400) → tạo đơn → HR duyệt → **quỹ trừ NGAY**;
  - OT: tạo → duyệt; Tuyển dụng: phiếu → duyệt → ứng viên → chuyển stage;
  - Đánh giá: tạo → nộp → nhân viên xác nhận; Đào tạo: ghi danh;
  - Kỳ lương: tạo → tính (BHXH + thuế + thực lĩnh) → đối chiếu → **khóa bất biến (chặn tính lại 409)** → nhân viên xem phiếu;
  - Biến động: đơn thôi việc → duyệt → **tự sinh checklist bàn giao 5 mục**;
  - Tài liệu: đọc kho tài liệu; logout-all thu hồi đủ phiên.

### 9.3. Tiêu chí "Clone-and-Run"

Trên máy sạch chỉ cần Docker + Git:

```bash
git clone <repo> && cd <repo>
docker compose up -d     # ≤ 5 phút (tùy tốc độ pull lần đầu) → usable tại :8080
make simulate            # (tùy chọn) sinh ~200 sự kiện chấm công 14 ngày, có bản ghi lệch
docker compose down -v && docker compose up -d   # reset sạch
```

Checklist rút gọn: compose chạy được không cần `.env`; migration + seed tự chạy; 5 tài khoản demo đăng nhập được; luồng soạn→duyệt→xuất bản→tìm thấy hoạt động; QR check-in cập nhật bảng công tức thì; Swagger `/api/docs` mở được; upload sai loại bị chặn thân thiện.

---

## 10. Hạn chế đã biết & lộ trình phát triển

### Hạn chế đã biết (thứ tự ưu tiên xử lý)

1. Tham số pháp lý (BHXH, biểu thuế, lương cơ sở) đang neo hằng số trong `payroll.module.ts` — cần chuyển sang bảng THAMSO theo hiệu lực ngày;
2. Thưởng từ quyết định khen thưởng và tạm ứng chưa tự nạp vào phiếu lương;
3. Vai `KM_MANAGER` đang kiêm cả chuyên viên nhân sự — có thể tách chi tiết theo 11 tác nhân của tài liệu gốc;
4. Khuôn mặt dùng vector mô tả rút gọn (demo) — hướng tới MediaPipe WASM thật + liveness detection;
5. Thông báo tự động cho luồng HR (đơn chờ duyệt, nhắc hạn hợp đồng 45/30 ngày) chưa gắn vào `notifications`.

### Lộ trình phát triển

1. **Tầng AI:** gợi ý bài viết liên quan; hỏi đáp tri thức RAG trên nội dung đã duyệt; dự đoán rủi ro nghỉ việc — nguyên tắc: *máy chỉ khuyến nghị, con người quyết định*;
2. **Meilisearch** (compose profile) khi dữ liệu lớn;
3. **Adapter máy chấm công thật** (ZKTeco PULL/PUSH qua LAN) + geofencing Wi-Fi cho điểm danh web;
4. **SSO/LDAP** đồng bộ người dùng từ HRMIS doanh nghiệp khác qua API;
5. **Thông báo email/Teams/Slack** + digest tuần;
6. **Soạn thảo cộng tác thời gian thực** (Yjs/CRDT);
7. **Ứng dụng di động Flutter** kênh tự phục vụ;
8. **Đa ngôn ngữ VI/EN** + dark mode.

---

## 11. Phụ lục A — Biến môi trường

| Biến | Mặc định demo | Ghi chú |
| --- | --- | --- |
| `NODE_ENV` | `production` | `development` bật hot-reload qua override file |
| `WEB_PORT` / `API_PORT` | `8080` / `3001` | 8080 là cổng duy nhất người dùng cần nhớ |
| `PUBLIC_BASE_URL` | `http://localhost:8080` | Host nhúng vào mã QR kiosk — đổi IP LAN khi demo bằng điện thoại |
| `POSTGRES_*` / `DATABASE_URL` | `kms` / `kms_demo_pw` / `kms` | Chỉ trong mạng nội bộ compose |
| `JWT_SECRET` | `change-me-...` | Production thiếu secret mạnh → fail-fast |
| `JWT_EXPIRES_IN` / `REFRESH_EXPIRES_IN` | `15m` / `7d` | |
| `UPLOAD_MAX_MB` / `UPLOAD_DIR` | `10` / `/app/uploads` | Volume `kms_uploads` |
| `SEED_ON_FIRST_RUN` | `true` | Seed idempotent, chỉ chạy khi DB rỗng |
| `DEFAULT_ADMIN_EMAIL` / `_PASSWORD` | `admin@demo.local` / `Admin@123` | Chỉ dùng lúc seed |
| `QR_TOKEN_TTL_SEC` | `30` | Chu kỳ xoay mã QR kiosk |
| `FACE_EMBEDDING_KEY` | base64 32 bytes | Khóa AES-256-GCM mã hóa vector khuôn mặt |
| `FACE_MATCH_THRESHOLD` | `0.55` | Ngưỡng cosine similarity |
| `ATTENDANCE_WORK_START/END` | `08:00` / `17:30` | Ca chuẩn tính đi muộn/về sớm |
| `TZ` | `Asia/Ho_Chi_Minh` | Thống nhất múi giờ log + bảng công |

---

## 12. Phụ lục B — Ma trận quyền chi tiết

### 12.1. Vai toàn cục × hành động hệ thống

| Hành động | USER | KM_MANAGER | ADMIN |
| --- | :-: | :-: | :-: |
| Điểm danh (QR/khuôn mặt/web) · xem bảng công cá nhân | ✔ | ✔ | ✔ |
| Xem bảng công toàn công ty | ✖ | ✔ | ✔ |
| Sinh token kiosk / import CSV máy | ✖ | ✔ | ✔ |
| Quản lý thiết bị + hiệu chỉnh bản ghi lệch | ✖ | ✖ | ✔ |
| Duyệt leave/overtime/recruitment/personnel-actions/loans/expense | ✖ | ✔ | ✔ |
| Tính lương, quản lý hợp đồng/tài sản/đào tạo/tài liệu | ✖ | ✔ | ✔ |
| Khóa kỳ lương | ✖ | ✖ | ✔ |
| Quản lý user, cây tổ chức, settings, audit log | ✖ | ✖ | ✔ |
| Xuất báo cáo BNV, quét nâng bậc | ✖ | ✔ | ✔ |

### 12.2. Vai theo Space (miền tri thức)

| Hành động | VIEWER | CONTRIBUTOR | EDITOR | MANAGER |
| --- | :-: | :-: | :-: | :-: |
| Đọc Space PUBLIC | ✔ | ✔ | ✔ | ✔ |
| Đọc Space RESTRICTED/PRIVATE | nếu là member | member | member | member |
| Soạn bài DRAFT | ✖ | ✔ | ✔ | ✔ |
| Sửa bài của người khác | ✖ | ✖ | ✔ | ✔ |
| Trình duyệt bài của mình | ✖ | ✔ | ✔ | ✔ |
| Duyệt / yêu cầu chỉnh sửa | ✖ | ✖ | ✖ | ✔ |
| Archive / khôi phục · quản lý thành viên Space | ✖ | ✖ | ✖ | ✔ |

---

*Tài liệu kỹ thuật này đi kèm [`doc/Plan.md`](Plan.md) (tổng quan nghiệp vụ – đối tượng sử dụng – quy trình – danh mục trang). Mọi quyết định kiến trúc phát sinh nên ghi bổ sung dạng ADR ngắn.*
