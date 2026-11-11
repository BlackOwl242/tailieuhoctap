# Từ điển dữ liệu thực tế của hệ thống (SQLite 3: 30 bảng)

Tài liệu đặc tả trực tiếp 30 bảng vật lý đang vận hành tại `data/hanoi-services.sqlite3` (chế độ `PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`, `PRAGMA busy_timeout = 15000`), khớp 1-1 với `Mo_hinh_du_lieu.sql` và `Tu_dien_du_lieu.json`.

---

## Nhóm 1. Định danh, Tài khoản & Phân quyền RBAC (5 bảng)

### 1.1. Bảng `users`: Tài khoản người dùng và phân quyền RBAC

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | PK | Không | Định danh tài khoản (UUID) |
| `email` | `TEXT` | UQ | Không | Địa chỉ email đăng nhập không phân biệt hoa thường |
| `phone` | `TEXT` |  | Không | Số điện thoại liên hệ |
| `full_name` | `TEXT` |  | Không | Họ và tên công dân hoặc cán bộ |
| `password_salt` | `TEXT` |  | Không | Muối ngẫu nhiên hệ thập lục phân dùng băm mật khẩu |
| `password_hash` | `TEXT` |  | Không | Giá trị băm mật khẩu PBKDF2-HMAC-SHA256 (600.000 vòng) |
| `role` | `TEXT` |  | Không | Vai trò: `citizen`, `intake`, `specialist`, `leader`, `registrar`, `finance`, `admin` |
| `active` | `INTEGER` |  | Không | Trạng thái kích hoạt tài khoản (`1`: hiệu lực, `0`: khóa/chờ duyệt) |
| `email_verified` | `INTEGER` |  | Không | Cờ trạng thái xác minh email (mặc định `0`) |
| `agency_scope` | `TEXT` |  | Không | Phạm vi cơ quan quản lý hoặc xử lý hồ sơ cụ thể |
| `valid_from` | `TEXT` |  | Không | Ngày bắt đầu hiệu lực quyền cán bộ (`YYYY-MM-DD`) |
| `valid_until` | `TEXT` |  | Không | Ngày kết thúc hiệu lực quyền cán bộ (`YYYY-MM-DD`) |
| `may_sign_stop` | `INTEGER` |  | Không | Thẩm quyền ký và phát hành Thông báo dừng Mẫu 06 (`0`/`1`) |
| `signing_authority_ref` | `TEXT` |  | Không | Số văn bản phân công thẩm quyền ký Mẫu 06 |
| `must_change_password` | `INTEGER` |  | Không | Cờ yêu cầu đổi mật khẩu khởi tạo (`0`/`1`) |
| `can_manage_agency_accounts` | `INTEGER` |  | Không | Quyền lập đề nghị quản lý tài khoản trong phạm vi cơ quan (`0`/`1`) |
| `created_at` | `TEXT` |  | Không | Thời điểm tạo tài khoản (ISO 8601 UTC+07:00) |
| `updated_at` | `TEXT` |  | Không | Thời điểm cập nhật gần nhất (ISO 8601 UTC+07:00) |

### 1.2. Bảng `sessions`: Phiên đăng nhập HttpOnly và khóa chống giả mạo CSRF

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `token_hash` | `TEXT` | PK | Không | Giá trị băm SHA-256 của mã phiên trong cookie (`hni_session` / `hni_citizen_session`) |
| `user_id` | `TEXT` | FK `users` | Không | Tài khoản sở hữu phiên đăng nhập |
| `csrf_token` | `TEXT` |  | Không | Mã bảo vệ phiên kiểm tra qua tiêu đề `X-CSRF-Token` |
| `expires_at` | `INTEGER` |  | Không | Thời điểm hết hạn phiên (Unix timestamp giây) |
| `created_at` | `TEXT` |  | Không | Thời điểm khởi tạo phiên |

### 1.3. Bảng `staff_access_requests`: Đề nghị cấp mới tài khoản cán bộ (phê duyệt độc lập)

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | PK | Không | Định danh đề nghị cấp quyền (UUID) |
| `user_id` | `TEXT` | FK `users` | Không | Tài khoản cán bộ được đề nghị kích hoạt |
| `requested_by` | `TEXT` | FK `users` | Không | Người lập đề nghị (quản trị viên hoặc quản lý cơ quan) |
| `role` | `TEXT` |  | Không | Vai trò nghiệp vụ đề nghị cấp |
| `agency_scope` | `TEXT` |  | Không | Cơ quan công tác cụ thể của cán bộ |
| `valid_from` | `TEXT` |  | Không | Ngày bắt đầu hiệu lực đề nghị |
| `valid_until` | `TEXT` |  | Không | Ngày kết thúc hiệu lực đề nghị |
| `requested_sign_stop` | `INTEGER` |  | Không | Đề nghị cấp kèm quyền ký Thông báo dừng Mẫu 06 (`0`/`1`) |
| `signing_authority_ref` | `TEXT` |  | Không | Số văn bản phân công thẩm quyền ký Mẫu 06 |
| `authorized_sign_stop` | `INTEGER` |  | Không | Xác nhận duyệt quyền ký Mẫu 06 của quản trị viên duyệt (`0`/`1`) |
| `reason` | `TEXT` |  | Không | Căn cứ lập đề nghị cấp tài khoản |
| `status` | `TEXT` |  | Không | Trạng thái: `PENDING`, `APPROVED`, `REJECTED` |
| `reviewed_by` | `TEXT` | FK `users` | Có | Quản trị viên hệ thống phê duyệt (khác người đề nghị) |
| `review_note` | `TEXT` |  | Không | Ý kiến hoặc lý do phê duyệt/từ chối |
| `created_at` | `TEXT` |  | Không | Thời điểm lập đề nghị |
| `reviewed_at` | `TEXT` |  | Có | Thời điểm hoàn tất xem xét đề nghị |

### 1.4. Bảng `staff_account_changes`: Đề nghị thay đổi quyền, phạm vi hoặc trạng thái tài khoản cán bộ

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | PK | Không | Định danh đề nghị thay đổi (UUID) |
| `user_id` | `TEXT` | FK `users` | Không | Tài khoản cán bộ cần điều chỉnh (tối đa 01 đề nghị `PENDING` mỗi tài khoản) |
| `requested_by` | `TEXT` | FK `users` | Không | Người lập đề nghị thay đổi |
| `before_json` | `TEXT` |  | Không | Bản chụp JSON cấu hình quyền trước khi sửa |
| `proposed_json` | `TEXT` |  | Không | Bản chụp JSON cấu hình quyền đề nghị áp dụng |
| `reason` | `TEXT` |  | Không | Căn cứ điều chỉnh quyền hoặc thu hồi tài khoản |
| `status` | `TEXT` |  | Không | Trạng thái: `PENDING`, `APPROVED`, `REJECTED` |
| `reviewed_by` | `TEXT` | FK `users` | Có | Quản trị viên phê duyệt độc lập |
| `review_note` | `TEXT` |  | Không | Ý kiến xem xét đề nghị |
| `created_at` | `TEXT` |  | Không | Thời điểm tạo đề nghị |
| `reviewed_at` | `TEXT` |  | Có | Thời điểm phê duyệt hoặc từ chối |

### 1.5. Bảng `staff_authority_events`: Nhật ký cấp và thu hồi thẩm quyền ký Thông báo dừng Mẫu 06

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng của sự kiện thẩm quyền |
| `user_id` | `TEXT` | FK `users` | Không | Tài khoản lãnh đạo được cấp hoặc thu hồi quyền |
| `changed_by` | `TEXT` | FK `users` | Không | Quản trị viên thực hiện thao tác |
| `action` | `TEXT` |  | Không | Loại thao tác: `GRANT_STOP_SIGNING` hoặc `REVOKE_STOP_SIGNING` |
| `authority_ref` | `TEXT` |  | Không | Số văn bản phân công thẩm quyền liên quan |
| `reason` | `TEXT` |  | Không | Căn cứ cấp hoặc thu hồi quyền ký |
| `created_at` | `TEXT` |  | Không | Thời điểm ghi nhận sự kiện |

---

## Nhóm 2. Danh mục Thủ tục & Tin tức Cổng thông tin (7 bảng)

### 2.1. Bảng `procedure_catalog_edits`: Bản ghi hiệu chỉnh cục bộ danh mục thủ tục hành chính

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `procedure_code` | `TEXT` | PK | Không | Mã thủ tục gốc trong danh mục tham chiếu |
| `local_code` | `TEXT` |  | Không | Mã hiển thị sau hiệu chỉnh (nếu đổi mã cục bộ) |
| `name` | `TEXT` |  | Không | Tên thủ tục hành chính |
| `field` | `TEXT` |  | Không | Tên lĩnh vực hiển thị |
| `category_key` | `TEXT` |  | Không | Khóa nhóm lĩnh vực liên kết |
| `level` | `TEXT` |  | Không | Mức độ dịch vụ: `Toàn trình`, `Một phần`, `Cung cấp thông tin` |
| `agency` | `TEXT` |  | Không | Cơ quan thực hiện công bố |
| `source_url` | `TEXT` |  | Không | Liên kết HTTPS nguồn chính thức (`.gov.vn` / `chinhphu.vn`) |
| `checked_at` | `TEXT` |  | Không | Ngày đối chiếu nguồn (`YYYY-MM-DD`) |
| `reason` | `TEXT` |  | Không | Căn cứ chỉnh sửa nội dung danh mục |
| `submission_json` | `TEXT` |  | Không | Cấu hình JSON biểu mẫu nộp đính kèm (nếu có) |
| `version` | `INTEGER` |  | Không | Số phiên bản kiểm soát cập nhật đồng thời |
| `updated_by` | `TEXT` |  | Không | Họ tên quản trị viên cập nhật cuối |
| `updated_at` | `TEXT` |  | Không | Thời điểm cập nhật gần nhất |

### 2.2. Bảng `procedure_catalog_audit`: Nhật ký kiểm toán chỉnh sửa danh mục thủ tục

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng của dòng nhật ký |
| `procedure_code` | `TEXT` |  | Không | Mã thủ tục được tác động |
| `actor_id` | `TEXT` |  | Không | Định danh quản trị viên thực hiện |
| `actor_name` | `TEXT` |  | Không | Họ tên quản trị viên thực hiện |
| `action` | `TEXT` |  | Không | Hành động: `UPDATED` hoặc `MOVED_CATEGORY` |
| `reason` | `TEXT` |  | Không | Căn cứ thay đổi hoặc chuyển nhóm |
| `before_json` | `TEXT` |  | Có | Trạng thái JSON trước khi sửa |
| `after_json` | `TEXT` |  | Không | Trạng thái JSON sau khi sửa |
| `created_at` | `TEXT` |  | Không | Thời điểm ghi nhật ký |

### 2.3. Bảng `procedure_category_edits`: Nhóm lĩnh vực thủ tục hành chính và hiệu chỉnh tên hiển thị

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `source_field` | `TEXT` | PK | Không | Khóa lĩnh vực gốc hoặc mã nhóm nội bộ (`local:*`) |
| `display_name` | `TEXT` |  | Không | Tên lĩnh vực hiển thị trên cổng và bàn cán bộ |
| `source_url` | `TEXT` |  | Không | Liên kết HTTPS nguồn công bố đối chiếu |
| `checked_at` | `TEXT` |  | Không | Ngày kiểm tra nguồn công bố |
| `reason` | `TEXT` |  | Không | Lý do tạo mới hoặc đổi tên lĩnh vực |
| `version` | `INTEGER` |  | Không | Phiên bản kiểm soát đồng thời |
| `updated_by` | `TEXT` |  | Không | Người cập nhật gần nhất |
| `updated_at` | `TEXT` |  | Không | Thời điểm cập nhật |

### 2.4. Bảng `procedure_category_audit`: Nhật ký kiểm toán thay đổi nhóm lĩnh vực thủ tục

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng của bản ghi kiểm toán |
| `source_field` | `TEXT` |  | Không | Khóa lĩnh vực được sửa |
| `actor_id` | `TEXT` |  | Không | Định danh quản trị viên thao tác |
| `actor_name` | `TEXT` |  | Không | Họ tên quản trị viên thao tác |
| `reason` | `TEXT` |  | Không | Căn cứ điều chỉnh lĩnh vực |
| `before_json` | `TEXT` |  | Có | Dữ liệu JSON trước khi cập nhật |
| `after_json` | `TEXT` |  | Không | Dữ liệu JSON sau khi cập nhật |
| `created_at` | `TEXT` |  | Không | Thời điểm ghi nhận |

### 2.5. Bảng `news_articles`: Tin tức và thông báo xuất bản trên cổng dịch vụ công

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | PK | Không | Mã định danh bài viết |
| `title` | `TEXT` |  | Không | Tiêu đề bài viết |
| `summary` | `TEXT` |  | Không | Tóm tắt nội dung hiển thị ngoài trang chủ |
| `body` | `TEXT` |  | Không | Nội dung chi tiết bài viết |
| `category` | `TEXT` |  | Không | Chuyên mục tin tức |
| `image_path` | `TEXT` |  | Không | Tên tệp ảnh minh họa trong thư viện ứng dụng |
| `source_url` | `TEXT` |  | Không | Liên kết HTTPS nguồn `.gov.vn` đối chiếu |
| `status` | `TEXT` |  | Không | Trạng thái: `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `featured` | `INTEGER` |  | Không | Đánh dấu tin nổi bật trên trang chủ (`0`/`1`) |
| `published_at` | `TEXT` |  | Có | Thời điểm xuất bản chính thức |
| `version` | `INTEGER` |  | Không | Số phiên bản chống ghi đè khi biên tập |
| `created_by` | `TEXT` | FK `users` | Có | Tài khoản khởi tạo bài viết |
| `updated_by` | `TEXT` | FK `users` | Có | Tài khoản biên tập gần nhất |
| `created_at` | `TEXT` |  | Không | Thời điểm tạo bản ghi |
| `updated_at` | `TEXT` |  | Không | Thời điểm sửa bản ghi |

### 2.6. Bảng `news_audit_log`: Nhật ký biên tập, xuất bản và lưu trữ tin tức

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng nhật ký biên tập |
| `news_id` | `TEXT` | FK `news_articles` | Không | Mã bài viết được tác động |
| `actor_id` | `TEXT` | FK `users` | Có | Quản trị viên thực hiện |
| `actor_name` | `TEXT` |  | Không | Họ tên người thực hiện |
| `action` | `TEXT` |  | Không | Thao tác: `CREATE_DRAFT`, `UPDATE`, `PUBLISH`, `ARCHIVE`, `DRAFT` |
| `before_json` | `TEXT` |  | Có | Nội dung bài viết trước thao tác |
| `after_json` | `TEXT` |  | Có | Nội dung bài viết sau thao tác |
| `created_at` | `TEXT` |  | Không | Thời điểm ghi nhật ký |

### 2.7. Bảng `app_data_versions`: Phiên bản gói dữ liệu khởi tạo của ứng dụng

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `data_key` | `TEXT` | PK | Không | Tên khóa gói dữ liệu (ví dụ: `training-cases`) |
| `version` | `INTEGER` |  | Không | Phiên bản dữ liệu đã áp dụng |
| `applied_at` | `TEXT` |  | Không | Thời điểm áp dụng vào cơ sở dữ liệu |

---

## Nhóm 3. Hồ sơ Một cửa, Biểu mẫu 01–06 & Khóa tra cứu Fernet (4 bảng)

### 3.1. Bảng `cases`: Hồ sơ giải quyết thủ tục hành chính theo cơ chế một cửa

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Định danh nội bộ tự tăng của hồ sơ |
| `code` | `TEXT` | UQ | Không | Mã hồ sơ giao dịch (định dạng `HN-YYYY-XXXXXXXX`) |
| `owner_id` | `TEXT` |  | Không | Mã băm SHA-256 của khóa tra cứu gắn với hồ sơ |
| `procedure_code` | `TEXT` |  | Không | Mã thủ tục hành chính áp dụng |
| `status` | `TEXT` |  | Không | Trạng thái máy trạng thái (`CHO_TIEP_NHAN`..`HOAN_THANH`/`TU_CHOI`/`KHONG_GIAI_QUYET`/`DUNG`) |
| `version` | `INTEGER` |  | Không | Số phiên bản kiểm soát đồng thời lạc quan (Optimistic Locking) |
| `idempotency_key` | `TEXT` | UQ | Có | Khóa chống gửi lặp khi nộp trực tuyến hoặc tiếp nhận tại quầy |
| `payload_json` | `TEXT` |  | Không | Toàn bộ dữ liệu nghiệp vụ hồ sơ, biểu mẫu 01–06, thẩm tra, phí và kết quả (JSON) |
| `created_at` | `TEXT` |  | Không | Thời điểm tạo hồ sơ |
| `updated_at` | `TEXT` |  | Không | Thời điểm chuyển trạng thái hoặc cập nhật gần nhất |

#### Cấu trúc tài liệu JSON bên trong `cases.payload_json`

| Nhánh khóa JSON | Kiểu | Nội dung nghiệp vụ lưu trữ |
| --- | --- | --- |
| `applicant`, `subject` | `object` | Thông tin người nộp (`name`, `citizenId`/`organizationId`, `phone`, `email`, `address`) và chủ thể thủ tục (`name`, `relation`). |
| `declaration`, `documentExemptions` | `object` | Dữ liệu tờ khai theo `schemaVersion` và giải trình thành phần được miễn nộp bản giấy. |
| `attachments` | `array` | Danh sách tệp đính kèm/bổ sung/số hóa (`name`, `stored`, `size`, `type`, `sha256`, `componentId`). |
| `workflow`, `milestones` | `object`, `array` | Bản chụp cấu hình quy trình ghim theo thời điểm nộp hồ sơ và các mốc kiểm tra trung gian. |
| `workflowEvidence`, `workflowEvidenceHistory` | `object`, `array` | Kết quả đối chiếu sổ gốc (`2.000908`), thẩm tra yêu cầu dữ liệu (`1.004237`) hoặc thẩm định hồ sơ công bố. |
| `assignment`, `assignmentHistory` | `object`, `array` | Chuyên viên đang thụ lý (`assigneeId`, `assigneeName`, `unit`, `assignedAt`) và lịch sử luân chuyển/trả lại. |
| `supplement`, `supplementHistory` | `object`, `array` | Yêu cầu bổ sung, danh mục mục thiếu, hạn và số ngày làm việc tạm dừng được cộng bù, tệp bổ sung của công dân. |
| `deadlineExtension` | `object` / `array` | Lịch sử gia hạn thời hạn giải quyết gắn với phiếu xin lỗi và hẹn lại ngày trả kết quả (**Mẫu 04**). |
| `fee` | `object` | Trạng thái nghĩa vụ tài chính (`NOT_CONNECTED`/`DUE`/`PAID`/`RECONCILED`/`WAIVED`/`REFUNDED`), số tiền, căn cứ và tham chiếu giao dịch. |
| `forms` | `object` | Dữ liệu xuất bản in các biểu mẫu một cửa `mau01`..`mau06` kèm mã QR tra cứu tiến độ hồ sơ. |
| `withdrawal` | `object` | Yêu cầu dừng thực hiện (**Mẫu 05** trực tiếp/bưu chính/trực tuyến), dự thảo và bản ký phát hành Thông báo dừng (**Mẫu 06**), theo dõi trả hồ sơ giấy và hoàn phí. |
| `result`, `delivery` | `object` | Kết quả đã phát hành (`number`, `content`, `issuedAt`, `signatureHash`, `files` tự động hiển thị tại Kho tài liệu điện tử công dân) và biên nhận trả kết quả. |

### 3.2. Bảng `case_events`: Sự kiện tiến trình và nhật ký xử lý hồ sơ một cửa

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng theo thứ tự thời gian sự kiện |
| `case_id` | `INTEGER` | FK `cases` | Không | Hồ sơ phát sinh sự kiện |
| `actor_role` | `TEXT` |  | Không | Vai trò tác nhân thực hiện (`citizen`, `intake`, `specialist`, `leader`, `registrar`, `finance`) |
| `actor_name` | `TEXT` |  | Không | Tên hiển thị của người thực hiện |
| `action` | `TEXT` |  | Không | Mã hành động nghiệp vụ (`submit`, `accept`, `assign`, `approve`, `sign_result`, `issue`...) |
| `title` | `TEXT` |  | Không | Tiêu đề mốc xử lý |
| `detail` | `TEXT` |  | Không | Diễn giải chi tiết hoặc căn cứ xử lý |
| `audience` | `TEXT` |  | Không | Phạm vi hiển thị: `public` (công dân xem được) hoặc `internal` (nội bộ cơ quan) |
| `created_at` | `TEXT` |  | Không | Thời điểm ghi sự kiện |

### 3.3. Bảng `case_lookup_secrets`: Kho khóa tra cứu hồ sơ mã hóa Fernet tách biệt

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `case_id` | `INTEGER` | PK, FK `cases` | Không | Hồ sơ gắn với khóa tra cứu |
| `encrypted_key` | `BLOB` |  | Không | Khóa tra cứu 64 ký tự hex được mã hóa đối xứng Fernet bằng `data/lookup-vault.key` |
| `submission_hash` | `TEXT` |  | Không | Băm SHA-256 của mã phiên nộp dùng đối chiếu chống gửi lặp |
| `updated_at` | `TEXT` |  | Không | Thời điểm khởi tạo hoặc cấp lại khóa tra cứu |

### 3.4. Bảng `feedback`: Đánh giá mức độ hài lòng của người dân sau khi kết thúc hồ sơ

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Định danh lượt đánh giá |
| `case_id` | `INTEGER` | FK `cases` | Không | Hồ sơ đã hoàn thành hoặc kết thúc được đánh giá |
| `owner_id` | `TEXT` |  | Không | Định danh chủ hồ sơ gửi đánh giá (mỗi hồ sơ tối đa 01 lần) |
| `score` | `INTEGER` |  | Không | Điểm hài lòng từ 1 đến 5 sao |
| `content` | `TEXT` |  | Không | Ý kiến nhận xét về chất lượng phục vụ |
| `created_at` | `TEXT` |  | Không | Thời điểm gửi đánh giá |

---

## Nhóm 4. Không gian Công dân số (4 bảng)

### 4.1. Bảng `citizen_profiles`: Thông tin cá nhân tự khai trong không gian tài khoản công dân

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `user_id` | `TEXT` | PK, FK `users` | Không | Tài khoản công dân sở hữu thông tin |
| `details_json` | `TEXT` |  | Không | Dữ liệu JSON: ngày sinh, giới tính, giấy tờ định danh, địa chỉ thường trú và liên hệ |
| `version` | `INTEGER` |  | Không | Phiên bản chống ghi đè khi cập nhật từ nhiều tab |
| `updated_at` | `TEXT` |  | Không | Thời điểm lưu thông tin cá nhân gần nhất |

### 4.2. Bảng `citizen_drafts`: Hồ sơ nháp lưu tờ khai trực tuyến của công dân

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | PK | Không | Mã hồ sơ nháp (32 ký tự hex) |
| `user_id` | `TEXT` | FK `users` | Không | Tài khoản công dân sở hữu bản nháp |
| `procedure_code` | `TEXT` |  | Không | Mã thủ tục đang kê khai dở dang |
| `details_json` | `TEXT` |  | Không | Nội dung các bước kê khai, thông tin liên hệ và giải trình miễn giấy tờ |
| `version` | `INTEGER` |  | Không | Phiên bản bản nháp (tự động xóa cùng giao dịch nộp thành công nếu khớp) |
| `updated_at` | `TEXT` |  | Không | Thời điểm lưu nháp gần nhất |

### 4.3. Bảng `citizen_record_owners`: Liên kết quyền sở hữu hồ sơ, lịch hẹn và phản ánh với tài khoản công dân

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `record_code` | `TEXT` | PK | Không | Mã bản ghi nghiệp vụ (`HN-*`, `LH-*`, `PA-*`, `PAKN-*`) |
| `user_id` | `TEXT` | FK `users` | Không | Tài khoản công dân tạo bản ghi |
| `created_at` | `TEXT` |  | Không | Thời điểm gắn quyền sở hữu |

### 4.4. Bảng `citizen_notification_reads`: Trạng thái đã đọc thông báo trong không gian công dân

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `user_id` | `TEXT` | PK, FK `users` | Không | Tài khoản công dân |
| `event_key` | `TEXT` | PK | Không | Khóa sự kiện thông báo (`case:*`, `appointment:*`, `feedback:*`) |
| `read_at` | `TEXT` |  | Không | Thời điểm đánh dấu đã đọc |

---

## Nhóm 5. Nghĩa vụ Tài chính & Hoàn phí Kiểm soát 4 mắt (3 bảng)

### 5.1. Bảng `payment_records`: Bản ghi nghĩa vụ tài chính, thanh toán và đối soát phí/lệ phí

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Định danh nội bộ khoản giao dịch |
| `case_id` | `INTEGER` | FK `cases` | Không | Hồ sơ phát sinh khoản thu |
| `transaction_ref` | `TEXT` | UQ | Không | Mã giao dịch duy nhất (`HN-THU-*`) |
| `amount` | `INTEGER` |  | Không | Số tiền thu tính bằng đồng Việt Nam (VND) |
| `status` | `TEXT` |  | Không | Trạng thái: `PENDING`, `PAID`, `RECONCILED`, `REFUNDED` |
| `basis` | `TEXT` |  | Không | Căn cứ pháp lý và nội dung xác định mức thu |
| `provider_mode` | `TEXT` |  | Không | Chế độ vận hành (`LOCAL_SANDBOX` / `LOCAL_RECONCILED`) |
| `payment_method` | `TEXT` |  | Không | Phương thức nộp: `SANDBOX`, `BANK_TRANSFER`, `COUNTER_RECEIPT`, `POSTAL_RECEIPT`, `OTHER` |
| `payer_reference` | `TEXT` |  | Không | Số biên lai hoặc mã tham chiếu chuyển khoản do người nộp khai |
| `reconciliation_reference` | `TEXT` |  | Không | Số chứng từ kế toán đối soát nội bộ |
| `created_at` | `TEXT` |  | Không | Thời điểm khởi tạo giao dịch |
| `reconciled_at` | `TEXT` |  | Có | Thời điểm cán bộ tài chính/lãnh đạo xác nhận đối soát |

### 5.2. Bảng `payment_events`: Nhật ký sự kiện giao dịch, đối soát và hoàn trả khoản thu

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng sự kiện thanh toán |
| `transaction_ref` | `TEXT` | FK `payment_records` | Không | Mã giao dịch liên quan |
| `actor_id` | `TEXT` |  | Không | Định danh tài khoản thực hiện |
| `actor_name` | `TEXT` |  | Không | Tên người thao tác |
| `action` | `TEXT` |  | Không | Hành động: `CREATED`, `PAID_DECLARED`, `RECONCILED`, `REFUND_REQUESTED`, `REFUND_APPROVED`, `REFUND_REJECTED`, `REFUND_EXECUTED` |
| `detail` | `TEXT` |  | Không | Chi tiết chứng từ hoặc ý kiến |
| `idempotency_key` | `TEXT` |  | Không | Khóa đối chiếu sự kiện giao dịch |
| `created_at` | `TEXT` |  | Không | Thời điểm phát sinh sự kiện |

### 5.3. Bảng `payment_refunds`: Đề nghị hoàn phí/lệ phí theo nguyên tắc kiểm soát 4 mắt

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Định danh đề nghị hoàn trả |
| `transaction_ref` | `TEXT` | FK `payment_records` | Không | Mã giao dịch đã đối soát cần hoàn |
| `reason` | `TEXT` |  | Không | Căn cứ lập đề nghị hoàn phí/lệ phí |
| `status` | `TEXT` |  | Không | Trạng thái: `PENDING`, `APPROVED`, `REJECTED`, `EXECUTED` |
| `requested_by` | `TEXT` |  | Không | Định danh cán bộ lập đề nghị hoàn |
| `requested_at` | `TEXT` |  | Không | Thời điểm lập đề nghị hoàn |
| `reviewed_by` | `TEXT` |  | Không | Định danh người phê duyệt độc lập (khác `requested_by`) |
| `reviewed_at` | `TEXT` |  | Có | Thời điểm phê duyệt hoặc từ chối đề nghị hoàn |
| `review_note` | `TEXT` |  | Không | Ý kiến phê duyệt hoặc từ chối |
| `executed_at` | `TEXT` |  | Có | Thời điểm ghi nhận chứng từ chi hoàn thực tế |
| `execution_reference` | `TEXT` |  | Không | Số ủy nhiệm chi hoặc chứng từ chi hoàn |

---

## Nhóm 6. Ký thử nghiệm Ed25519 & Quầy Dịch vụ / Lịch hẹn / PAKN (7 bảng)

### 6.1. Bảng `sandbox_signing_authorities`: Ủy quyền ký số thử nghiệm Ed25519 cho lãnh đạo cơ quan

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `user_id` | `TEXT` | PK, FK `users` | Không | Tài khoản lãnh đạo được cấp quyền ký |
| `granted_by` | `TEXT` | FK `users` | Không | Quản trị viên hệ thống cấp quyền |
| `authority_ref` | `TEXT` |  | Không | Số quyết định/văn bản phân công thẩm quyền ký |
| `reason` | `TEXT` |  | Không | Lý do cấp hoặc thu hồi quyền ký |
| `active` | `INTEGER` |  | Không | Trạng thái hiệu lực quyền ký (`1`: đang mở, `0`: đã thu hồi) |
| `granted_at` | `TEXT` |  | Không | Thời điểm cấp quyền |
| `revoked_at` | `TEXT` |  | Có | Thời điểm thu hồi quyền (nếu có) |

### 6.2. Bảng `sandbox_signing_authority_events`: Nhật ký cấp và thu hồi quyền ký số thử nghiệm Ed25519

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng sự kiện thẩm quyền ký |
| `user_id` | `TEXT` | FK `users` | Không | Tài khoản lãnh đạo được tác động |
| `actor_id` | `TEXT` | FK `users` | Không | Quản trị viên thực hiện cấp/thu hồi |
| `action` | `TEXT` |  | Không | Thao tác: `GRANT` hoặc `REVOKE` |
| `authority_ref` | `TEXT` |  | Không | Số văn bản thẩm quyền tham chiếu |
| `reason` | `TEXT` |  | Không | Lý do thực hiện |
| `created_at` | `TEXT` |  | Không | Thời điểm ghi nhật ký |

### 6.3. Bảng `sandbox_signatures`: Bằng chứng chữ ký số thử nghiệm Ed25519 trên dự thảo kết quả đã duyệt

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Định danh bản ghi chữ ký |
| `case_id` | `INTEGER` | FK `cases` | Không | Hồ sơ có dự thảo kết quả được ký |
| `document_hash` | `TEXT` |  | Không | Mã băm SHA-256 của thông điệp chuẩn hóa đã duyệt |
| `signature_b64` | `TEXT` |  | Không | Chữ ký Ed25519 mã hóa Base64 |
| `public_key_b64` | `TEXT` |  | Không | Khóa công khai Ed25519 (Base64) dùng kiểm tra tính toàn vẹn |
| `signer_id` | `TEXT` | FK `users` | Không | Tài khoản lãnh đạo thực hiện ký |
| `signer_name` | `TEXT` |  | Không | Họ tên người ký |
| `authority_ref` | `TEXT` |  | Không | Số văn bản ủy quyền ký tại thời điểm ký |
| `signed_at` | `TEXT` |  | Không | Thời điểm ký kết quả |
| `mode` | `TEXT` |  | Không | Chế độ chữ ký (`LOCAL_SANDBOX`) |

### 6.4. Bảng `public_appointments`: Lịch hẹn giao dịch trực tiếp tại Bộ phận Một cửa

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `code` | `TEXT` | PK | Không | Mã lịch hẹn (`LH-*`) |
| `citizen_name` | `TEXT` |  | Không | Họ tên người đặt lịch |
| `citizen_id` | `TEXT` |  | Không | Số định danh cá nhân (nếu khai) |
| `phone` | `TEXT` |  | Không | Số điện thoại đối chiếu khi tra cứu |
| `agency` | `TEXT` |  | Không | Cơ quan tiếp nhận được chọn |
| `procedure_code` | `TEXT` |  | Không | Mã thủ tục cần hướng dẫn/nộp |
| `procedure_name` | `TEXT` |  | Không | Tên thủ tục hành chính |
| `appointment_date` | `TEXT` |  | Không | Ngày hẹn làm việc (`YYYY-MM-DD`) |
| `time_slot` | `TEXT` |  | Không | Khung giờ hẹn (tối đa 10 lịch/cơ quan/khung giờ) |
| `queue_number` | `INTEGER` |  | Không | Số thứ tự phục vụ tại quầy trong ngày |
| `note` | `TEXT` |  | Không | Ghi chú nhu cầu hướng dẫn của công dân |
| `status` | `TEXT` |  | Không | Trạng thái: `BOOKED`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED` |
| `created_at` | `TEXT` |  | Không | Thời điểm đặt lịch |
| `counter_note` | `TEXT` |  | Không | Ghi chú tiếp đón/xử lý của cán bộ một cửa |

### 6.5. Bảng `public_appointment_events`: Nhật ký xử lý lịch hẹn tại quầy một cửa

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng sự kiện lịch hẹn |
| `appointment_code` | `TEXT` | FK `public_appointments` | Không | Mã lịch hẹn được cập nhật |
| `actor_id` | `TEXT` |  | Không | Tài khoản cán bộ cập nhật |
| `actor_name` | `TEXT` |  | Không | Họ tên cán bộ xử lý |
| `action` | `TEXT` |  | Không | Trạng thái chuyển tới |
| `detail` | `TEXT` |  | Không | Ghi chú hướng dẫn hoặc lý do hủy |
| `created_at` | `TEXT` |  | Không | Thời điểm cập nhật |

### 6.6. Bảng `public_pakn`: Phản ánh, kiến nghị của người dân và tổ chức theo cơ quan

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `code` | `TEXT` | PK | Không | Mã theo dõi phản ánh kiến nghị (`PA-*` / `PAKN-*`) |
| `sender_name` | `TEXT` |  | Không | Họ tên người gửi phản ánh |
| `phone` | `TEXT` |  | Không | Số điện thoại xác thực tra cứu kết quả trả lời |
| `email` | `TEXT` |  | Không | Địa chỉ email liên hệ (nếu có) |
| `agency` | `TEXT` |  | Không | Cơ quan nhận phản ánh kiến nghị |
| `topic` | `TEXT` |  | Không | Chủ đề phản ánh |
| `title` | `TEXT` |  | Không | Tiêu đề phản ánh kiến nghị |
| `content` | `TEXT` |  | Không | Nội dung phản ánh chi tiết |
| `status` | `TEXT` |  | Không | Trạng thái: `RECEIVED`, `REPLIED` |
| `reply` | `TEXT` |  | Không | Nội dung trả lời chính thức của cơ quan |
| `replied_by` | `TEXT` |  | Không | Định danh cán bộ/lãnh đạo trả lời |
| `replied_at` | `TEXT` |  | Có | Thời điểm trả lời phản ánh |
| `created_at` | `TEXT` |  | Không | Thời điểm tiếp nhận phản ánh |

### 6.7. Bảng `public_feedback_events`: Nhật ký tiếp nhận và trả lời phản ánh kiến nghị

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | PK | Không | Khóa tự tăng sự kiện phản ánh |
| `feedback_code` | `TEXT` | FK `public_pakn` | Không | Mã phản ánh kiến nghị liên quan |
| `actor_id` | `TEXT` |  | Không | Định danh cán bộ trả lời |
| `actor_name` | `TEXT` |  | Không | Họ tên cán bộ trả lời |
| `action` | `TEXT` |  | Không | Hành động xử lý (`REPLIED`) |
| `detail` | `TEXT` |  | Không | Nội dung phản hồi lưu vết |
| `created_at` | `TEXT` |  | Không | Thời điểm ghi nhật ký |

---

## Danh mục chỉ mục vật lý (25 chỉ mục)

| Chỉ mục | Bảng đích | Cột / Điều kiện |
| --- | --- | --- |
| `idx_users_role_active` | `users` | `(role, active)` |
| `idx_sessions_user` | `sessions` | `(user_id)` |
| `idx_sessions_expires` | `sessions` | `(expires_at)` |
| `idx_access_requests_status_created` | `staff_access_requests` | `(status, created_at DESC)` |
| `idx_staff_access_user` | `staff_access_requests` | `(user_id)` |
| `idx_account_changes_status_created` | `staff_account_changes` | `(status, created_at DESC)` |
| `idx_account_changes_one_pending_per_user` | `staff_account_changes` | `UNIQUE (user_id) WHERE status = 'PENDING'` |
| `idx_staff_authority_user` | `staff_authority_events` | `(user_id, id)` |
| `idx_procedure_catalog_audit_code` | `procedure_catalog_audit` | `(procedure_code, id DESC)` |
| `idx_procedure_category_audit_field` | `procedure_category_audit` | `(source_field, id DESC)` |
| `idx_news_public` | `news_articles` | `(status, featured DESC, published_at DESC)` |
| `idx_news_audit_article` | `news_audit_log` | `(news_id, id DESC)` |
| `idx_cases_status_created` | `cases` | `(status, created_at DESC)` |
| `idx_cases_owner` | `cases` | `(owner_id, created_at DESC)` |
| `idx_events_case` | `case_events` | `(case_id, id)` |
| `idx_feedback_case` | `feedback` | `(case_id)` |
| `idx_citizen_drafts_owner` | `citizen_drafts` | `(user_id, updated_at)` |
| `idx_citizen_records_user` | `citizen_record_owners` | `(user_id)` |
| `idx_payment_records_case` | `payment_records` | `(case_id)` |
| `idx_payment_events_ref` | `payment_events` | `(transaction_ref, id)` |
| `idx_payment_refunds_ref` | `payment_refunds` | `(transaction_ref, id DESC)` |
| `idx_sandbox_signatures_case` | `sandbox_signatures` | `(case_id, id DESC)` |
| `idx_appointments_date_agency` | `public_appointments` | `(appointment_date, agency)` |
| `idx_appointment_events_code` | `public_appointment_events` | `(appointment_code, id)` |
| `idx_public_feedback_events_code` | `public_feedback_events` | `(feedback_code, id)` |
