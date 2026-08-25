# KẾ HOẠCH CHI TIẾT XÂY DỰNG HỆ THỐNG QUẢN LÝ TRI THỨC NỘI BỘ (KMS)

**Dạng sản phẩm:** Web-app nội bộ cho doanh nghiệp
**Bối cảnh nghiệp vụ:** Kế thừa phân tích tình huống Công ty Cổ phần Phần mềm Saigon Technology (từ `doc/Plan.md` và `doc/PTTK_OOP_HR.md`)
**Mục đích sử dụng:** Demo học phần — nhưng chất lượng xây dựng đạt chuẩn production
**Yêu cầu bao trùm:** Clone-and-run tuyệt đối — `git clone` → `docker compose up` → dùng ngay, không chỉnh sửa gì thêm
**Bổ sung theo yêu cầu:** Hỗ trợ điểm danh bằng mã QR, khuôn mặt và kết nối máy chấm công; frontend dùng Next.js

> **CẬP NHẬT QUAN TRỌNG (bản hiện hành):** Hệ thống đã mở rộng từ KMS thuần thành **HRMIS — Hệ thống thông tin quản trị nhân lực** (branding "HRMIS Saigon Technology"), trong đó KMS trở thành nhóm phân hệ "Tri thức nội bộ". Toàn bộ chuỗi nghiệp vụ nhân sự theo `doc/PTTK_OOP_HR.md` và `doc/Plan.md` đã được triển khai thật: hồ sơ nhân viên – hợp đồng – văn bằng, nghỉ phép, làm thêm giờ, kỳ lương, tuyển dụng, đánh giá hiệu suất, đào tạo, biến động nhân sự (bộ máy duyệt dùng chung), kho tài liệu quy trình, in phiếu/báo cáo. Chi tiết trạng thái triển khai và kết quả nghiệm thu xem **mục 11**.

---

## MỤC LỤC

1. [Đánh giá tổng quan tài liệu nguồn và phạm vi hệ thống](#1-đánh-giá-tổng-quan-tài-liệu-nguồn-và-phạm-vi-hệ-thống)
2. [Danh sách chức năng chính theo mức độ ưu tiên](#2-danh-sách-chức-năng-chính-theo-mức-độ-ưu-tiên)
3. [Đề xuất stack công nghệ và lý do chọn](#3-đề-xuất-stack-công-nghệ-và-lý-do-chọn)
4. [Kiến trúc tổng thể và luồng dữ liệu](#4-kiến-trúc-tổng-thể-và-luồng-dữ-liệu)
5. [Kế hoạch triển khai theo giai đoạn](#5-kế-hoạch-triển-khai-theo-giai-đoạn)
6. [Cấu trúc thư mục repository đề xuất](#6-cấu-trúc-thư-mục-repository-đề-xuất)
7. [Chiến lược dữ liệu mẫu và tài khoản demo](#7-chiến-lược-dữ-liệu-mẫu-và-tài-khoản-demo)
8. [Checklist tiêu chí "Clone-and-Run"](#8-checklist-tiêu-chí-clone-and-run)
9. [Rủi ro và biện pháp giảm thiểu](#9-rủi-ro-và-biện-pháp-giảm-thiểu)
10. [Hướng phát triển sau demo](#10-hướng-phát-triển-sau-demo)
11. [Nhật ký mở rộng HRMIS — đã triển khai & nghiệm thu](#11-nhật-ký-mở-rộng-hrmis--đã-triển-khai--nghiệm-thu-bản-hiện-hành)

---

## 1. ĐÁNH GIÁ TỔNG QUAN TÀI LIỆU NGUỒN VÀ PHẠM VI HỆ THỐNG

### 1.1. Đánh giá hai tài liệu nguồn

| Tiêu chí                        | `doc/Plan.md`                                                                                                                                                                       | `doc/PTTK_OOP_HR.md`                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bản chất                        | Đặc tả hệ thống và thiết kế phần mềm HRMIS ở cấp độ nghiệp vụ – kiến trúc                                                                                                           | Báo cáo kết thúc học phần với thiết kế OOAD/UML đầy đủ                                                                                                                                                   |
| Giá trị chính                   | Cơ cấu tổ chức thật của Saigon Technology; 6 thẻ chức năng bộ phận; ma trận tác động quy trình; mô hình luồng duyệt ba tầng; chiến lược 3 mức độ (tác nghiệp → tính toán → AI)      | 11 tác nhân; 25 use case chia 6 nhóm; đặc tả chi tiết kèm bảng tham số pháp lý; biểu đồ trạng thái 5 vòng đời; mô hình 30 bảng; kiến trúc 3 tầng với 2 bộ máy dùng chung (ApprovalEngine, PayrollEngine) |
| Điểm mạnh                       | Phân tích "vì sao" rất chặt: nghịch lý 430 nhân sự / 18 nhân sự HR; nguyên tắc "cây tổ chức là dữ liệu"; "cất hồ sơ — cần tìm thì tìm ra"; cưỡng chế tuân thủ thủ tục bằng phần mềm | Độ bao phủ use case gần như hoàn chỉnh; ràng buộc bất biến rõ ràng (audit log chỉ thêm, bảng lương khóa không sửa); tham số pháp lý là dữ liệu kèm ngày hiệu lực                                         |
| Hạn chế so với nhu cầu hiện tại | Hai tài liệu đều tập trung vào **HRMIS**, chưa phải hệ thống quản lý tri thức                                                                                                       | Chưa có thiết kế cho nội dung phi cấu trúc (bài viết tri thức), tìm kiếm toàn văn, cộng tác nội dung                                                                                                     |

**Kết luận đánh giá:** Hai tài liệu là nền phân tích nghiệp vụ chất lượng cao về một công ty phần mềm điển hình (lao động trí tuệ trẻ, turnover cao, tổ chức theo dòng chảy dự án). Chúng không mô tả sẵn một hệ thống quản lý tri thức, nhưng cung cấp **đầy đủ nguyên liệu thiết kế**: bối cảnh bài toán thất thoát tri thức, mô hình tổ chức – phân quyền, mẫu hình luồng duyệt, kỷ luật dữ liệu (truy vết – bất biến), mô hình chấm công đa nguồn, và triết lý kiến trúc 3 tầng. Kế hoạch này **kế thừa các nguyên lý đó và ánh xạ sang miền quản lý tri thức**, chứ không sao chép chức năng nhân sự.

### 1.2. Ranh giới giữa KMS và HRMIS _(đã cập nhật theo bản hiện hành)_

- **Bản gốc:** KMS chỉ giữ tri thức phi cấu trúc; dữ liệu nhân sự có tính pháp lý thuộc HRMIS "bên ngoài".
- **Bản hiện hành:** hai miền đã **hợp nhất trong một hệ thống HRMIS duy nhất**:
  - **Nhóm phân hệ Nhân sự (mới):** hồ sơ nhân viên – hợp đồng – văn bằng chứng chỉ, nghỉ phép (quỹ phép theo năm), làm thêm giờ, kỳ lương (tính → đối chiếu → khóa bất biến), tuyển dụng (phiếu đề xuất + danh sách ứng viên), đánh giá hiệu suất, đào tạo, biến động nhân sự (một bộ máy duyệt dùng chung 5 loại), kho tài liệu quy trình, in phiếu/báo cáo;
  - **Nhóm phân hệ Tri thức nội bộ (KMS cũ):** Space, bài viết, luồng duyệt bản thảo, tìm kiếm toàn văn, hội nhập, bàn giao công việc, tìm chuyên gia;
  - **Chấm công đa nguồn** là điểm nối tự nhiên giữa hai miền: sự kiện điểm danh sinh bảng công ngày, bảng công đã khóa là đầu vào của bộ máy tính lương.
- **Điểm nối tương lai (vẫn giữ nguyên):** SSO/đồng bộ từ HRMIS doanh nghiệp thật qua API khi mở rộng.
- **Bổ sung theo yêu cầu của người giao việc:** phân hệ **Chấm công nhẹ** — điểm danh mã QR, khuôn mặt, máy chấm công (webhook HMAC/CSV/mô phỏng) — đã vận hành và được tính lương tiêu thụ trực tiếp.

### 1.3. Insight cốt lõi từ tài liệu và ánh xạ thành chức năng KMS

Bảng dưới đây là cầu nối trực tiếp "tài liệu → chức năng": mỗi dòng trả lời câu hỏi _insight nào từ tài liệu sinh ra chức năng nào của hệ thống_.

| #   | Insight từ tài liệu                                                                                                       | Bằng chứng trong tài liệu                                 | Ánh xạ thành chức năng KMS                                                                                                                                 | Module thực hiện        |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | Lao động trí tuệ, kỹ năng biến đổi nhanh, tỷ lệ nghỉ việc cao → tri thức nằm trong đầu cá nhân, mất người là mất tri thức | Plan.md — Phần Một mục 4; PTTK mục 1.2.4                  | Sứ mệnh hệ thống: kho tri thức tập trung, chống thất thoát khi nghỉ việc — toàn bộ bài viết có tác giả, phiên bản, trạng thái                              | Toàn hệ thống           |
| 2   | "Một nguồn dữ liệu gốc dùng chung" — xóa cảnh 3 bảng Excel 3 con số                                                       | Plan.md — Phần Năm mục 1                                  | Single source of truth: mỗi chủ đề một bài viết hiện hành, mọi người đọc cùng một phiên bản đã duyệt                                                       | Articles                |
| 3   | Cây cơ cấu tổ chức phải là **dữ liệu cấu hình**, không cài cứng mã nguồn                                                  | Plan.md — Phần Hai mục 1; PTTK mục 1.2.5                  | Quản trị cây đơn vị + cây Space trên màn hình admin; gắn Space vào đơn vị; mở phòng ban mới không cần lập trình                                            | OrgUnits, Spaces        |
| 4   | Phân quyền RBAC hai chiều: **quyền chức năng × phạm vi dữ liệu** (bản thân / nhóm / cây đơn vị / toàn công ty)            | PTTK mục 2.2.2 (VaiTro); Plan.md — Hình 4                 | Vai toàn cục (ADMIN, KM_MANAGER, USER) + vai theo từng Space (MANAGER, EDITOR, CONTRIBUTOR, VIEWER) + visibility PUBLIC/RESTRICTED/PRIVATE                 | Auth, Spaces            |
| 5   | Luồng chuẩn ba tầng **đề xuất → thẩm định → phê duyệt**; ApprovalEngine dùng chung cho mọi loại đề xuất                   | Plan.md — Hình 5; PTTK mục 2.4.1                          | Workflow xuất bản bản thảo: DRAFT → PENDING_REVIEW → PUBLISHED/REQUEST_CHANGES, ghi vết từng bước (ai, lúc nào, ý kiến gì); thêm loại luồng mới = cấu hình | ReviewWorkflow          |
| 6   | Nguyên tắc vàng "cất hồ sơ — cần tìm thì tìm ra"; sổ mục kê tra cứu vài phút                                              | Plan.md — Phần Bốn mục 2                                  | Tìm kiếm toàn văn (tiêu đề + nội dung + tag) trả kết quả < 1 giây; lọc theo Space/danh mục/tag/tác giả/trạng thái                                          | Search                  |
| 7   | Nhắc hạn tự động: mượn – trả bản gốc nhắc hạn trả; hợp đồng cảnh báo trước 45/30 ngày                                     | UC10, UC12 (PTTK Bảng 2.3–2.4)                            | Nhắc tái xem lại bài viết cũ (review reminder theo chu kỳ); trạng thái hiệu lực PUBLISHED/ARCHIVED; thông báo hết hạn nội dung                             | Articles, Notifications |
| 8   | Hội nhập: ngày nhận việc **3 bộ phận đồng loạt** với nhiệm vụ song song                                                   | Plan.md — Hình 6 bước (9); UC08                           | Onboarding path: lộ trình đọc bắt buộc cho nhân viên mới theo vị trí, theo dõi tiến độ hoàn thành từng mục                                                 | Onboarding              |
| 9   | Thôi việc: checklist **4 xác nhận bắt buộc** trước khi phát hành quyết định                                               | UC17 (PTTK Bảng 2.5)                                      | Knowledge handover: checklist chuyển giao tri thức trước ngày nghỉ (bài viết đã bàn giao? mật khẩu/runbook đã ghi?), đủ xác nhận mới đóng hồ sơ            | Onboarding, People      |
| 10  | Ma trận kỹ năng + kế hoạch đào tạo + tư vấn chuyên gia ("ai giỏi gì")                                                     | Plan.md — Mức độ thứ ba (a, c)                            | People directory: hồ sơ chuyên môn, danh sách bài viết theo tác giả, tìm "ai biết về X"                                                                    | People                  |
| 11  | Tham số pháp lý là **dữ liệu kèm ngày hiệu lực**, không cài cứng                                                          | PTTK — Bảng 2.6 (THAMSO)                                  | Bảng settings key–value do admin chỉnh; bài viết có ngày xuất bản/hiệu lực hiển thị rõ                                                                     | AdminSettings           |
| 12  | Nhật ký kiểm toán **chỉ thêm, không sửa/xóa**; bảng lương khóa là bất biến                                                | PTTK mục 2.4.2 (3 ràng buộc bắt buộc)                     | Version history bất biến (không sửa bản cũ, chỉ thêm bản mới + rollback); audit log append-only mọi thao tác quan trọng                                    | Versions, Audit         |
| 13  | Mỗi quy trình kéo 4–5 bộ phận → bắt buộc thông báo tự động liên phòng ban                                                 | Plan.md — Phần Ba (3 nhận xét)                            | Notification in-app: được mời duyệt, bài viết mới của Space đang theo dõi, bình luận mới, nhắc hạn                                                         | Notifications           |
| 14  | Bảng điều khiển điều hành theo vai, số liệu thời gian thực                                                                | Plan.md — Mức độ thứ hai (c)                              | Dashboard theo vai: bài chờ mình duyệt, bài mới nhất, xem nhiều nhất, thống kê đóng góp                                                                    | Dashboard               |
| 15  | Cam kết ISO/IEC 27001; Nghị định 13/2023/NĐ-CP về dữ liệu cá nhân                                                         | Plan.md — Phần Một mục 3; PTTK Tài liệu tham khảo [7]     | Bảo mật: JWT + bcrypt, khóa tài khoản sau 5 lần sai, rate limit, whitelist loại tệp, audit đầy đủ                                                          | Security (chéo cắt)     |
| 16  | Kênh tự phục vụ — tối giản thao tác, không phải "ra quầy văn thư"                                                         | Plan.md — mục 2.4.3; UC25                                 | UX search-first, responsive web, tự phục vụ toàn trình soạn – duyệt – tìm                                                                                  | Frontend                |
| 17  | Kiến trúc 3 tầng; lớp Biên – Điều khiển – Thực thể (MVC/OOAD)                                                             | PTTK mục 2.2.1, 2.4.4                                     | Backend phân tầng Controller → Service → Repository (Prisma), module hóa đúng các nhóm nghiệp vụ                                                           | Backend toàn cục        |
| 18  | Sai mật khẩu 5 lần liên tiếp → khóa tài khoản 15 phút                                                                     | UC01 (PTTK Bảng 2.4)                                      | Login lockout + rate limit đúng tham số này (cấu hình qua settings)                                                                                        | Auth                    |
| 19  | Chấm công **đa nguồn**: máy vân tay/khuôn mặt hai văn phòng + ứng dụng di động                                            | Plan.md — Phần Bốn mục 2, Mức độ thứ hai (a); UC18        | Điểm danh đa kênh: mã QR xoay vòng tại kiosk, nhận diện khuôn mặt ngay trên trình duyệt, webhook/CSV từ máy chấm công                                      | Attendance              |
| 20  | Sự kiện điểm danh thô **bất biến**, ghi rõ nguồn (máy/ứng dụng), đánh dấu bản ghi lệch                                    | PTTK mục 2.2.2 (SUKIEN_DIEMDANH); ràng buộc (i) mục 2.4.2 | Bảng `attendance_events` append-only; tự tổng hợp thành `attendance_days`; hàng đợi xử lý bản ghi lệch                                                     | Attendance              |
| 21  | Ghép ca, tính đi muộn/về sớm; Trưởng dự án xác nhận, xử lý bản ghi lệch                                                   | UC18, UC21 (PTTK Bảng 2.3–2.5)                            | Tự tính phút đi muộn/về sớm theo ca cấu hình; bảng công cá nhân tự phục vụ; màn hình hiệu chỉnh có lý do và có vết                                         | Attendance              |

### 1.4. Phạm vi hệ thống

**Trong phạm vi (in scope) — demo học phần:**

- Ứng dụng web responsive xây bằng **Next.js** (desktop-first, dùng tốt trên máy chiếu và trình duyệt điện thoại);
- Xác thực JWT (access + refresh), phân quyền RBAC hai mức (toàn cục + theo Space);
- Quản lý người dùng, cây đơn vị, hồ sơ chuyên môn tối giản;
- Space (không gian tri thức) phân cấp, thành viên và vai theo Space;
- Bài viết rich-text (Markdown), tệp đính kèm, phiên bản bất biến + rollback;
- Luồng duyệt bản thảo có ghi vết; lưu trữ (archive);
- Tìm kiếm toàn văn bằng PostgreSQL FTS + pg_trgm;
- Danh mục (category) và thẻ (tag); bình luận/Q&A; đánh giá "hữu ích"; lượt xem;
- Thông báo in-app; bookmark; theo dõi Space;
- Onboarding path + knowledge handover checklist;
- **Phân hệ chấm công:** điểm danh bằng mã QR xoay vòng (trang kiosk), điểm danh khuôn mặt ngay trên trình duyệt (WASM, không cần phần cứng đặc biệt), tiếp nhận sự kiện từ máy chấm công qua webhook/CSV kèm **bộ mô phỏng thiết bị**, bảng công ngày tự tổng hợp và hàng đợi xử lý bản ghi lệch;
- Dashboard theo vai; audit log; trang admin cấu hình;
- Seed data mô phỏng Saigon Technology + tài khoản demo cho từng vai.

**Ngoài phạm vi (out of scope) — ghi nhận là hướng phát triển:**

- Ứng dụng di động riêng (Flutter như tài liệu gốc);
- Tìm kiếm ngữ nghĩa/AI, chatbot hỏi đáp tri thức (tầng "Mức độ 3" của tài liệu);
- Soạn thảo đồng thời nhiều người thời gian thực (CRDT/OT);
- SSO/LDAP thật, chữ ký số, email server thật;
- Kết nối trực tiếp phần cứng máy chấm công thật qua SDK độc quyền trong lúc demo (dùng bộ mô phỏng; adapter ZKTeco là hướng phát triển — xem mục 10);
- Phát hiện người giả (liveness detection) cho điểm danh khuôn mặt; tính lương từ dữ liệu công;
- Đa ngôn ngữ runtime (giao diện tiếng Việt là chính).

---

## 2. DANH SÁCH CHỨC NĂNG CHÍNH THEO MỨC ĐỘ ƯU TIÊN

### 2.1. Danh sách use case hệ thống (ký hiệu KC — Knowledge Case, kế thừa khuôn UC của tài liệu gốc)

**Nhóm A — Quản trị hệ thống**

| Mã   | Use case                                   | Tác nhân | Ưu tiên |
| ---- | ------------------------------------------ | -------- | ------- |
| KC01 | Đăng nhập / đăng xuất / làm mới token      | Toàn bộ  | P0      |
| KC02 | Quản lý người dùng (tạo, gán vai, khóa/mở) | ADMIN    | P0      |
| KC03 | Quản lý cây đơn vị tổ chức                 | ADMIN    | P0      |
| KC04 | Cấu hình tham số hệ thống (settings)       | ADMIN    | P1      |

**Nhóm B — Nội dung tri thức**

| Mã   | Use case                                        | Tác nhân            | Ưu tiên |
| ---- | ----------------------------------------------- | ------------------- | ------- |
| KC05 | Quản lý Space và thành viên theo Space          | KM_MANAGER, ADMIN   | P0      |
| KC06 | Soạn bài viết (Markdown + tệp đính kèm)         | CONTRIBUTOR trở lên | P0      |
| KC07 | Phiên bản bài viết: lịch sử, so sánh, khôi phục | EDITOR trở lên      | P0      |
| KC08 | Lưu trữ / khôi phục bài viết                    | MANAGER Space       | P1      |

**Nhóm C — Xuất bản và phê duyệt**

| Mã   | Use case                                                    | Tác nhân                  | Ưu tiên |
| ---- | ----------------------------------------------------------- | ------------------------- | ------- |
| KC09 | Trình duyệt bản thảo                                        | Tác giả bài viết          | P0      |
| KC10 | Thẩm định: duyệt / yêu cầu chỉnh sửa / từ chối (kèm ý kiến) | MANAGER Space, KM_MANAGER | P0      |
| KC11 | Hộp phê duyệt cá nhân (danh sách chờ xử lý)                 | Người duyệt               | P0      |

**Nhóm D — Khám phá tri thức**

| Mã   | Use case                          | Tác nhân | Ưu tiên |
| ---- | --------------------------------- | -------- | ------- |
| KC12 | Tìm kiếm toàn văn + bộ lọc        | Toàn bộ  | P0      |
| KC13 | Duyệt theo Space / danh mục / thẻ | Toàn bộ  | P0      |
| KC14 | Bookmark bài viết; theo dõi Space | Toàn bộ  | P1      |

**Nhóm E — Tương tác**

| Mã   | Use case                                                    | Tác nhân | Ưu tiên |
| ---- | ----------------------------------------------------------- | -------- | ------- |
| KC15 | Bình luận / hỏi đáp trên bài viết (có đánh dấu đã giải đáp) | Toàn bộ  | P0      |
| KC16 | Đánh giá "hữu ích"; đếm lượt xem                            | Toàn bộ  | P1      |
| KC17 | Nhận thông báo in-app (duyệt, bình luận, bài mới, nhắc hạn) | Toàn bộ  | P0      |

**Nhóm F — Con người và vòng đời tri thức**

| Mã   | Use case                                                  | Tác nhân                    | Ưu tiên |
| ---- | --------------------------------------------------------- | --------------------------- | ------- |
| KC18 | Hồ sơ chuyên môn (lĩnh vực, bio, bài viết theo tác giả)   | Toàn bộ                     | P1      |
| KC19 | Onboarding path: lộ trình đọc cho nhân viên mới + tiến độ | KM_MANAGER, nhân viên mới   | P1      |
| KC20 | Knowledge handover: checklist chuyển giao khi nghỉ việc   | KM_MANAGER, người liên quan | P1      |
| KC21 | Dashboard theo vai + thống kê đóng góp                    | Toàn bộ                     | P1      |
| KC22 | Tra cứu nhật ký kiểm toán                                 | ADMIN                       | P0      |

**Nhóm G — Chấm công (bổ sung theo yêu cầu)**

| Mã   | Use case                                                                                                                                             | Tác nhân                          | Ưu tiên |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------- |
| KC23 | Điểm danh bằng mã QR: kiosk hiển thị mã xoay vòng 30 giây, nhân viên quét bằng điện thoại (có nút "giả lập quét" để demo khi không có máy cùng mạng) | Toàn bộ                           | P0      |
| KC24 | Đăng ký mẫu khuôn mặt (enroll 3–5 mẫu, có đồng thuận) và điểm danh khuôn mặt ngay trên trình duyệt                                                   | Toàn bộ                           | P1      |
| KC25 | Kết nối máy chấm công: nhận sự kiện qua webhook ký HMAC, import CSV, chạy bộ mô phỏng thiết bị                                                       | ADMIN, KM_MANAGER                 | P1      |
| KC26 | Bảng công cá nhân (vào/ra, đi muộn, về sớm); hàng đợi bản ghi lệch; hiệu chỉnh có lý do                                                              | Toàn bộ (xem); ADMIN (hiệu chỉnh) | P1      |

**Nhóm H — Quản trị nhân lực (mở rộng HRMIS — đã triển khai, xem mục 11)**

| Mã   | Use case                                                                                                                                                                            | Tác nhân                         | Ưu tiên | Trang/API chính                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------- | -------------------------------------- |
| HR01 | Hồ sơ nhân sự: mã NV, ngày vào, trạng thái vòng đời (thử việc → chính thức → thôi/nghỉ hưu)                                                                                         | ADMIN, KM_MANAGER                | P0      | `/employees` · `/employees/:id`        |
| HR02 | Hợp đồng lao động + văn bằng chứng chỉ (kho lưu trữ kép: bản quét + vị trí tủ bản gốc)                                                                                              | ADMIN, KM_MANAGER                | P0      | `/employees/:id`                       |
| HR03 | Đơn nghỉ phép: kiểm quỹ trước khi trình, duyệt trừ quỹ NGAY, thâm niên +1 ngày/5 năm                                                                                                | Toàn bộ; duyệt: HR               | P0      | `/leave`                               |
| HR04 | Đăng ký làm thêm giờ: duyệt trước, chưa duyệt không tính tiền                                                                                                                       | Toàn bộ; duyệt: HR               | P0      | `/overtime`                            |
| HR05 | Kỳ lương: Tính (từ công + OT đã duyệt, BHXH 10,5% trần 20×lương cơ sở, thuế TNCN lũy tiến 7 bậc) → Đối chiếu → Khóa bất biến                                                        | HR tính; ADMIN khóa              | P0      | `/payroll`                             |
| HR06 | Phiếu lương điện tử cá nhân + in ấn                                                                                                                                                 | Toàn bộ                          | P0      | `/payroll` (tab cá nhân)               |
| HR07 | Tuyển dụng: phiếu đề xuất → duyệt chỉ tiêu → danh sách ứng viên 6 giai đoạn                                                                                                         | Trưởng nhóm; duyệt: HR           | P1      | `/recruitment`                         |
| HR08 | Đánh giá hiệu suất chu kỳ 6 tháng (tạo → nộp → nhân viên xác nhận)                                                                                                                  | HR; xác nhận: nhân viên          | P1      | `/performance`                         |
| HR09 | Đào tạo: khóa học, ghi danh có giới hạn chỗ, hoàn thành                                                                                                                             | HR tạo; toàn bộ ghi danh         | P1      | `/training`                            |
| HR10 | Biến động nhân sự: 1 bộ máy duyệt dùng chung 5 loại (thuyên chuyển/điều chỉnh lương/khen thưởng/kỷ luật/thôi việc); duyệt thôi việc tự sinh checklist bàn giao công việc 4 xác nhận | Toàn bộ (thôi việc); ADMIN duyệt | P0      | `/personnel`                           |
| HR11 | Kho tài liệu quy trình nhân sự (chính sách/biểu mẫu/quyết định/quy trình/báo cáo) + upload tập tin                                                                                  | HR quản lý; toàn bộ đọc          | P1      | `/documents`                           |
| HR12 | In phiếu/báo cáo cho từng chức năng (A4, khung tiêu đề công ty)                                                                                                                     | Toàn bộ                          | P1      | Nút "In phiếu" trên mọi trang quản trị |

### 2.2. Nguyên tắc ưu tiên

- **P0 (Must-have)** tạo nên vòng đời khép kín _soạn → duyệt → xuất bản → tìm thấy → tương tác_, cộng thêm **điểm danh QR** vì đây là tính năng ổn định, ấn tượng khi trình diễn và không phụ thuộc phần cứng. Tổng effort P0 ≈ 55% thời gian.
- **P1 (Should-have)** là điểm nhấn kể chuyện khi demo (onboarding, handover, dashboard, khuôn mặt, máy chấm công) — trực tiếp chứng minh các insight #7, #8, #9, #10, #14, #19–21 của tài liệu. Riêng nhóm chấm công đặt QR ở P0 còn khuôn mặt/máy ở P1 vì phụ thuộc điều kiện ánh sáng, webcam và mạng LAN — nếu gặp sự cố thì QR luôn là phương án dự phòng của chính demo.
- **P2 (Nice-to-have)** chỉ làm nếu dư thời gian: xuất PDF, dark mode, thông báo email (Mailpit), thống kê khoảng trống tri thức (chủ đề được yêu cầu chưa có bài).

### 2.3. Tiêu chí nghiệm thu mức P0 (rút gọn)

1. 4 tài khoản demo đăng nhập được, mỗi vai thấy đúng màn hình và đúng phạm vi dữ liệu;
2. Một bài viết đi trọn DRAFT → PENDING_REVIEW → PUBLISHED với ít nhất 2 tài khoản khác nhau, mỗi bước để lại vết trong timeline;
3. Từ khóa xuất hiện trong nội dung bài viết tìm ra được bài viết đúng trong < 1 giây;
4. Sửa bài viết đã xuất bản sinh version mới; rollback về version cũ hoạt động; audit log ghi đủ;
5. Người ngoài Space PRIVATE không thấy bài viết dù gọi thẳng API (kiểm tra bằng Swagger/curl);
6. Kiosk sinh mã QR mới mỗi 30 giây; điểm danh qua nút "giả lập quét" (hoặc điện thoại thật) ghi sự kiện thành công và bảng công ngày cập nhật tức thì; bản ghi thiếu vào/ra xuất hiện trong hàng đợi lệch.

---

## 3. ĐỀ XUẤT STACK CÔNG NGHỆ VÀ LÝ DO CHỌN

### 3.1. Stack đề xuất

| Tầng                  | Công nghệ                                                                                             | Phiên bản | Lý do chọn                                                                                                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend framework     | **NestJS (TypeScript)**                                                                               | 10.x      | Kiến trúc module – controller – service sẵn có đúng yêu cầu "phân tầng rõ ràng"; DI, ValidationPipe, ExceptionFilter, Guard, Interceptor là cơ chế chuẩn hóa validation/lỗi/phân quyền/logging; cộng đồng rất lớn, tài liệu phong phú                              |
| ORM                   | **Prisma**                                                                                            | 5.x       | Schema khai báo rõ ràng, migration tự chạy (`prisma migrate deploy`) trong container — chìa khóa của clone-and-run; type-safe end-to-end                                                                                                                           |
| CSDL                  | **PostgreSQL**                                                                                        | 16-alpine | Ảnh Docker ~80MB nhẹ hơn nhiều SQL Server (~1,5GB+); có sẵn FTS + pg_trgm cho tìm kiếm tiếng Việt mà không cần thêm dịch vụ; JSONB cho metadata linh hoạt; miễn phí, cộng đồng mạnh nhất trong CSDL mã nguồn mở                                                    |
| Frontend framework    | **Next.js 14 (App Router) + TypeScript**                                                              | 14.x      | Theo yêu cầu của người giao việc; hệ sinh thái React lớn nhất hiện nay, routing theo thư mục, Server Components giảm lượng JS tải về; `output: 'standalone'` đóng gói Docker cực gọn (1 tiến trình Node); `rewrites` thay thế nginx — proxy `/api` ngay trong Next |
| UI kit                | **Ant Design 5** (trong Client Components)                                                            | 5.x       | Component dạng bảng điều hành chuyên nghiệp (Table, Form, Layout, Upload, Timeline, Statistic) giúp đạt chất lượng UI production-grade trong thời gian ngắn; rất phổ biến tại Việt Nam; tương thích Next.js qua directive `'use client'`                           |
| Quản lý state/data FE | **TanStack Query + Zustand**                                                                          | 5.x / 4.x | Query cache + retry + invalidation chuẩn cho ứng dụng CRUD; Zustand nhẹ cho state UI (auth, theme)                                                                                                                                                                 |
| Editor                | **TipTap**                                                                                            | 2.x       | Rich-text trên nền ProseMirror, hỗ trợ Markdown, phổ biến nhất trong các KB open-source hiện đại (gần với trải nghiệm Notion/Confluence)                                                                                                                           |
| QR điểm danh          | **qrcode** (sinh ảnh) + **html5-qrcode** (quét camera)                                                | —         | Thuần JavaScript, chạy trên mọi trình duyệt có camera (kể cả trình duyệt điện thoại), không cần app riêng — giữ trọn tiêu chí clone-and-run                                                                                                                        |
| Nhận diện khuôn mặt   | **MediaPipe Tasks Vision (WASM)** hoặc face-api.js — trích vector 128 chiều **ngay trên trình duyệt** | —         | Không cần GPU, không cần dịch vụ Python riêng; server chỉ nhận vector và so khớp cosine similarity → thêm khuôn mặt mà không phá kiến trúc 3 service nhẹ                                                                                                           |
| Xác thực              | JWT access (15 phút) + refresh (7 ngày, xoay vòng), bcrypt                                            | —         | Không cần dịch vụ ngoài; refresh token lưu hash trong DB để thu hồi được                                                                                                                                                                                           |
| Logging               | **pino** (+ interceptor gắn requestId)                                                                | 8.x       | JSON structured log, hiệu năng cao, dễ lọc                                                                                                                                                                                                                         |
| API docs              | **@nestjs/swagger (OpenAPI)**                                                                         | 7.x       | Swagger UI tự sinh tại `/api/docs` — công cụ demo và kiểm thử không cần Postman                                                                                                                                                                                    |
| Container             | **Docker + docker-compose v2**                                                                        | —         | Chuẩn hóa môi trường; 3 service core (db, api, web); multi-stage build                                                                                                                                                                                             |
| Proxy / phục vụ web   | **Next.js standalone server** với `rewrites: /api/:path* → http://api:3001/:path*`                    | —         | Bỏ hẳn container nginx: web là một tiến trình Node duy nhất phục vụ cả UI và reverse proxy — ít service hơn, cấu hình ít hơn, vẫn một cổng duy nhất 8080                                                                                                           |
| CI                    | GitHub Actions                                                                                        | —         | Lint + test + build image mỗi push; đảm bảo repo trên GitHub luôn ở trạng thái chạy được                                                                                                                                                                           |

### 3.2. Vì sao không chọn phương án khác (so sánh ngắn)

| Phương án                                      | Ưu điểm                                                               | Vì sao không chọn làm phương án chính                                                                                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spring Boot 3 (Java)**                       | Chuẩn enterprise, đúng tinh thần OOP cổ điển của học phần PTTK_OOP    | Ảnh và RAM lớn hơn hẳn (500MB–1GB vs ~150MB), cold start chậm, boilerplate nhiều hơn → tăng thời gian dev và rủi ro chạy ì trên laptop sinh viên. **Giữ là phương án thay thế số 1** nếu môn học yêu cầu bắt buộc Java |
| **.NET 8 + EF Core**                           | Liên tục với tech stack nêu trong tài liệu gốc (.NET Core, C#, React) | Chất lượng tương đương NestJS nhưng một người dev solo sẽ chậm hơn khi phải nhảy hai hệ sinh thái ngôn ngữ; ảnh base lớn hơn Node alpine                                                                               |
| **Vite SPA + nginx tĩnh**                      | Đơn giản, nhẹ nhất                                                    | Đổi sang Next.js theo yêu cầu; Next standalone vẫn chỉ ~1 tiến trình Node (~150MB RAM), không mất tính portable, đổi lại có SSR và routing tích hợp                                                                    |
| **SQL Server (như tài liệu gốc)**              | Trung thành với thiết kế gốc                                          | Ảnh container nặng, cần chấp nhận EULA, cấu hình SA_PASSWORD phức tạp hơn — đi ngược tiêu chí portability tối đa. Schema thiết kế ánh xạ 1-1 sang PostgreSQL không mất gì                                              |
| **Elasticsearch/Meilisearch**                  | Tìm kiếm mạnh                                                         | Thêm 1 service + RAM; PostgreSQL FTS + pg_trgm đủ cho demo. Meilisearch để trong compose profile tùy chọn cho hướng phát triển                                                                                         |
| **InsightFace (service Python) cho khuôn mặt** | Độ chính xác cao hơn                                                  | Thêm container Python + model hàng trăm MB, phá vỡ mục tiêu 3 service nhẹ; MediaPipe/face-api.js đủ cho demo trong nhà. Ghi nhận là nâng cấp lộ trình                                                                  |

### 3.3. Quy ước công nghệ xuyên suốt

- Một ngôn ngữ duy nhất (**TypeScript**) cho cả backend và frontend → một người phụ trách vẫn kiểm soát được toàn bộ codebase;
- Mọi biến cấu hình đi qua `.env` (validate bằng schema khi khởi động — thiếu biến bắt buộc thì fail-fast với thông báo rõ ràng);
- Giao tiếp nội bộ compose qua tên service (`db`, `api`), không hardcode IP;
- Mọi ảnh pin version cụ thể (không dùng `latest`) để clone-and-run ổn định theo thời gian;
- **Dữ liệu sinh trắc học (vector khuôn mặt)** được mã hóa **AES-256-GCM** trước khi lưu, chỉ thu thập sau khi người dùng tick đồng ý rõ ràng (tuân thủ tinh thần Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân), không lưu ảnh gốc sau khi trích vector, và tự xóa khi nhân viên hoàn tất offboarding (gắn vào checklist handover).

---

## 4. KIẾN TRÚC TỔNG THỂ VÀ LUỒNG DỮ LIỆU

### 4.1. Sơ đồ triển khai (deployment view)

```
                     ┌──────────────────────────────────────────────┐
                     │            TRÌNH DUYỆT / ĐIỆN THOẠI          │
                     │      http://localhost:8080 (cổng duy nhất)   │
                     │  (điện thoại quét QR truy cập qua PUBLIC_BASE_URL,
                     │   ví dụ http://192.168.x.x:8080 trong mạng LAN)│
                     └───────────────────────┬──────────────────────┘
                                             │
                     ┌───────────────────────▼──────────────────────┐
                     │  SERVICE web (Next.js 14 · node:20-alpine)   │
                     │  • output:'standalone' — 1 tiến trình Node   │
                     │  • App Router + AntD 5 (Client Components)   │
                     │  • rewrites: /api/:path* → http://api:3001/* │
                     │  • Trang kiosk điểm danh QR full-screen      │
                     │  • Component QrScanner / FaceCapture (WASM)  │
                     └───────────────────────┬──────────────────────┘
                                             │ HTTP nội mạng docker
┌────────────────────────────────────────────▼──────────────────────────────────────────────┐
│                       SERVICE api  (node:20-alpine + NestJS)                              │
│                                                                                           │
│  ┌─ Giao tiếp: REST Controllers · DTO + ValidationPipe toàn cục · Swagger (/api/docs) ───┐ │
│  ├─ Bảo mật chéo: JwtAuthGuard → RolesGuard → SpaceScopeGuard · ThrottlerModule          │ │
│  ├─ Nghiệp vụ (module): Auth · Users · OrgUnits · Spaces · Articles · ReviewWorkflow      │ │
│  │                       Comments · Search · Notifications · Onboarding · People          │ │
│  │                       Attendance (QR · Face · DeviceSync · DailyBoard)                 │ │
│  │                       Dashboard · AdminSettings · Audit · Health                       │ │
│  ├─ Hạ tầng: PrismaService · FileStorageService (volume uploads) · PinoLogger             │ │
│  │             CryptoService (mã hóa vector khuôn mặt) · QrTokenService (HMAC)            │ │
│  └─ Chéo cắt: AllExceptionsFilter (lỗi tập trung) · AuditInterceptor · LoggingInterceptor │ │
└───────────────────────────────┬─────────────────────────────────┬───────────────────────────┘
                                │                                 │
              ┌─────────────────▼──────────────┐   ┌──────────────▼───────────────────┐
              │ SERVICE db (postgres:16-alpine)│   │ Volume kms_uploads (named volume)│
              │ • 30 bảng nghiệp vụ            │   │ • Tệp đính kèm, ảnh trong bài    │
              │ • FTS: tsvector + pg_trgm + GIN│   └──────────────────────────────────┘
              │ • Healthcheck: pg_isready      │
              │ • Volume kms_db_data           │
              └────────────────────────────────┘
                                   ▲
                                   │ webhook HMAC / CSV / mô phỏng
                     ┌─────────────┴───────────────┐
                     │  MÁY CHẤM CÔNG / THIẾT BỊ   │
                     │  (thật qua LAN, hoặc bộ     │
                     │   mô phỏng đi kèm hệ thống) │
                     └─────────────────────────────┘
```

**Nguyên tắc triển khai:** người dùng cuối chỉ tiếp xúc **một cổng** (8080); cổng API 3001 chỉ mở tùy chọn để xem Swagger; PostgreSQL **không expose** ra host mặc định (mở qua `.env` khi cần debug). Máy chấm công thật (nếu có) đẩy sự kiện vào `POST /api/v1/attendance/devices/:id/events` kèm chữ ký HMAC — không cần mở kết nối ngược vào container.

### 4.2. Phân tầng backend (application view) — đối chiếu lớp Biên/Điều khiển/Thực thể của tài liệu gốc

| Tầng tài liệu gốc (OOAD)  | Tầng NestJS tương ứng                                                 | Ví dụ                                                            |
| ------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Lớp Biên (Boundary)       | Controller + DTO                                                      | `ArticlesController`, `CreateArticleDto`, `CheckInDto`           |
| Lớp Điều khiển (Control)  | Service (business logic)                                              | `ReviewWorkflowService.approve()`, `AttendanceService.checkIn()` |
| Lớp Thực thể (Entity)     | Prisma models + repositories                                          | `Article`, `ArticleVersion`, `AttendanceEvent`                   |
| ApprovalEngine dùng chung | `ReviewWorkflowModule` tái sử dụng cho bài viết và handover checklist | —                                                                |
| NotificationService       | `NotificationsModule` (event emitter nội tiến trình)                  | —                                                                |

Quy tắc phụ thuộc: Controller → Service → PrismaService; **Service không import Controller**, module nghiệp vụ không gọi chéo mà phát event (`article.published`, `attendance.event.created`) cho module khác đăng ký — đúng tinh thần "các khối giao tiếp bằng truyền thông điệp" ở mục 2.4.4 của tài liệu gốc.

### 4.3. Mô hình dữ liệu (30 bảng, 7 miền)

> Con số 30 bảng trùng khớp với mô hình 30 bảng của tài liệu gốc — một sự trùng hợp có chủ đích: KMS kế thừa đúng kỷ luật thiết kế dữ liệu của HRMIS.

**Miền 1 — Định danh & tổ chức**

| Bảng             | Trường chính                                                                                                                                                                                                                                             | Ghi chú thiết kế                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `users`          | id (uuid), email (unique), password_hash, full_name, org_unit_id → org_units, job_title, expertise text[], bio, avatar_url, face_consent_at, status (ACTIVE/LOCKED/DISABLED), failed_login_attempts, locked_until, last_login_at, timestamps, deleted_at | Soft delete; khóa tạm theo UC01 (5 lần sai → 15 phút); cờ đồng thuận sinh trắc học |
| `roles`          | code (PK: ADMIN/KM_MANAGER/USER), name, description                                                                                                                                                                                                      | Bộ vai cố định, seed sẵn                                                           |
| `user_roles`     | user_id, role_code                                                                                                                                                                                                                                       | N-n                                                                                |
| `refresh_tokens` | id, user_id, token_hash, expires_at, revoked_at, ip, user_agent                                                                                                                                                                                          | Cho phép thu hồi phiên                                                             |
| `org_units`      | id, name, code (unique), parent_id → org_units, path (materialized "/1/5/12/"), sort_order                                                                                                                                                               | Cây tự tham chiếu — hiện thực hóa "cây tổ chức là dữ liệu"                         |

**Miền 2 — Space & nội dung**

| Bảng               | Trường chính                                                                                                                                                                                                                  | Ghi chú                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `spaces`           | id, slug (unique), name, description, icon, color, parent_id → spaces (nullable), org_unit_id (nullable), visibility (PUBLIC/RESTRICTED/PRIVATE), created_by, timestamps, deleted_at                                          | Space phân cấp; PUBLIC = cả công ty đọc; RESTRICTED = thành viên đọc; PRIVATE = thành viên mới thấy tồn tại |
| `space_members`    | space_id, user_id, space_role (MANAGER/EDITOR/CONTRIBUTOR/VIEWER), unique(space_id, user_id)                                                                                                                                  | RBAC chiều "phạm vi dữ liệu"                                                                                |
| `categories`       | id, name, slug (unique), parent_id nullable                                                                                                                                                                                   | Taxonomy toàn cục                                                                                           |
| `tags`             | id, name, slug (unique)                                                                                                                                                                                                       |                                                                                                             |
| `articles`         | id, space_id, category_id, author_id, title, slug, summary, status (DRAFT/PENDING_REVIEW/PUBLISHED/ARCHIVED), current_version_id, published_at, archived_at, review_due_at, view_count, helpful_count, timestamps, deleted_at | Trường denormalize đếm nhanh cho dashboard                                                                  |
| `article_versions` | id, article_id, version_no, title, content_md, change_note, author_id, created_at; unique(article_id, version_no)                                                                                                             | **Bất biến — chỉ INSERT** (insight #12)                                                                     |
| `article_tags`     | article_id, tag_id                                                                                                                                                                                                            |                                                                                                             |
| `attachments`      | id, article_version_id, uploader_id, file_name, storage_key, mime_type, size_bytes, checksum_sha256                                                                                                                           | Whitelist loại tệp + giới hạn dung lượng                                                                    |

**Miền 3 — Xuất bản & phê duyệt**

| Bảng              | Trường chính                                                                                     | Ghi chú                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `article_reviews` | id, article_id, reviewer_id, action (SUBMIT/APPROVE/REQUEST_CHANGES/REJECT), comment, created_at | Event-log luồng duyệt — timeline hiển thị thẳng từ bảng này |

**Miền 4 — Tương tác**

| Bảng            | Trường chính                                                                                                  | Ghi chú                        |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `comments`      | id, article_id, author_id, parent_id (self, nullable), body, is_question, resolved_at, timestamps, deleted_at | Q&A hai cấp                    |
| `reactions`     | article_id, user_id, value ('HELPFUL'), unique(article_id, user_id)                                           |                                |
| `article_views` | id, article_id, user_id (nullable), viewed_at                                                                 | Ghi thô + job tổng hợp         |
| `bookmarks`     | user_id, article_id                                                                                           |                                |
| `space_follows` | user_id, space_id                                                                                             | Nguồn phát thông báo "bài mới" |

**Miền 5 — Vòng đời con người & tri thức**

| Bảng                       | Trường chính                                                                                                                       | Ghi chú                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `onboarding_paths`         | id, title, description, target_job_title, org_unit_id, created_by                                                                  | Lộ trình đọc theo vị trí                          |
| `onboarding_path_items`    | id, path_id, article_id, sort_order, is_required                                                                                   |                                                   |
| `onboarding_assignments`   | id, path_id, user_id, due_date, status (IN_PROGRESS/COMPLETED)                                                                     |                                                   |
| `onboarding_item_progress` | assignment_id, item_id, completed_at                                                                                               | unique(assignment_id, item_id)                    |
| `handover_checklists`      | id, owner_user_id, leaving_date, status (OPEN/CLOSED), closed_at                                                                   | Mirror UC17; có item mặc định "xóa mẫu khuôn mặt" |
| `handover_items`           | id, checklist_id, title, article_id (nullable — tri thức đã được viết thành bài), assignee_id, status (PENDING/DONE), completed_at | Đủ DONE mới đóng checklist                        |

**Miền 6 — Hệ thống**

| Bảng            | Trường chính                                                                                                  | Ghi chú                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `notifications` | id, user_id, type, title, body, link_path, read_at, created_at                                                | In-app                                           |
| `audit_logs`    | id bigserial, actor_id, action, entity_type, entity_id, before jsonb, after jsonb, ip, request_id, created_at | **APPEND-ONLY** — không UPDATE/DELETE ở mọi tầng |
| `settings`      | key (PK), value jsonb, updated_by, updated_at                                                                 | Tham số runtime kiểu THAMSO                      |

**Miền 7 — Chấm công (bổ sung theo yêu cầu)**

| Bảng                     | Trường chính                                                                                                                                                                           | Ghi chú                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `attendance_devices`     | id, name, type (QR_KIOSK/FACE/MACHINE_WEBHOOK/MACHINE_CSV/SIMULATOR), location, secret_hash, status, last_seen_at                                                                      | Mỗi kiosk/máy một định danh + khóa HMAC riêng                                      |
| `attendance_events`      | id, user_id, device_id, source (QR/FACE/MACHINE/WEB/MANUAL), occurred_at, payload jsonb, anomaly_reason nullable                                                                       | **APPEND-ONLY** — sự kiện thô bất biến, mirror SUKIEN_DIEMDANH của tài liệu gốc    |
| `attendance_days`        | user_id + work_date (PK composite), first_in_at, last_out_at, worked_minutes, late_minutes, early_minutes, status (PRESENT/LATE/EARLY_LEAVE/MISSING_PAIR/ON_LEAVE/HOLIDAY), updated_at | Tổng hợp 1 dòng/người/ngày — mirror BANGCONG_NGAY; tính lại mỗi khi có sự kiện mới |
| `attendance_corrections` | id, user_id, work_date, field, old_value, new_value, reason, corrected_by, created_at                                                                                                  | Vết hiệu chỉnh — không sửa ngầm dữ liệu công                                       |

**Miền 8 — Quản trị nhân lực HRMIS (bổ sung bản hiện hành — 16 bảng, migration `20260824000000_hrm_processes`)**

| Bảng                   | Trường chính                                                                                                                                    | Ghi chú thiết kế                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `users` (mở rộng)      | + employee_code (unique), hire_date, employment_status (PROBATION/ACTIVE/RESIGNED/RETIRED), base_salary, birth_date, phone, address             | Mã NV tự sinh NV0001…; base_salary là nguồn tính lương, đồng bộ từ hợp đồng ACTIVE     |
| `contracts`            | user_id, contract_no (unique), type (PROBATION/FIXED_TERM/INDEFINITE/INTERNSHIP), start/end_date, base_salary, insurance_salary, status         | Mirror UC10; tạo hợp đồng ACTIVE tự cập nhật lương hồ sơ                               |
| `certificates`         | user_id, name, cert_no, issued_by, issued/expiry_date, file_url, storage_spot                                                                   | Mirror UC11 — kho lưu trữ kép                                                          |
| `leave_requests`       | user_id, type (ANNUAL/SICK/UNPAID/MATERNITY), start/end_date, days (ngày làm việc), reason, status, approver_id, decision_note                  | Mirror UC20 — kiểm quỹ trước khi trình                                                 |
| `leave_balances`       | user_id + year (PK), entitled (12 + thâm niên), used                                                                                            | Duyệt là trừ quỹ NGAY                                                                  |
| `overtime_requests`    | user_id, work_date, hours, reason, status, approver_id                                                                                          | Mirror UC19 — chỉ giờ APPROVED được tính tiền                                          |
| `payroll_periods`      | month + year (unique), status (OPEN/CALCULATED/REVIEWED/LOCKED), calculated_at, locked_at/by                                                    | Mirror UC23–UC24; LOCKED = bất biến, chặn tính lại                                     |
| `payslips`             | period_id + user_id (unique), working_days, ot_hours, base_salary, ot_amount (150%), insurance (10,5%), income_tax (lũy tiến 7 bậc), net_salary | Mirror PHIEU_LUONG; tính lại = xóa phiếu cũ của kỳ chưa khóa, giữ vết qua audit        |
| `job_requisitions`     | title, position, headcount, reason, status (DRAFT/PENDING_REVIEW/APPROVED/REJECTED/CLOSED), requested/decided_by                                | Mirror UC04–UC06                                                                       |
| `candidates`           | requisition_id, full_name, email, phone, source, stage (NEW/SCREENING/INTERVIEW/OFFER/HIRED/REJECTED), rating, notes                            | Mirror UC07–UC08 — danh sách ứng viên theo giai đoạn tuyển                             |
| `performance_reviews`  | user_id, reviewer_id, period, score (0–100), strengths, improvements, status (DRAFT/SUBMITTED/ACKNOWLEDGED)                                     | Căn cứ tăng lương định kỳ (QP5)                                                        |
| `training_courses`     | title, description, start/end_date, capacity, status (PLANNED/ONGOING/DONE)                                                                     |                                                                                        |
| `training_enrollments` | course_id + user_id (PK), status (ENROLLED/COMPLETED/DROPPED)                                                                                   | Chặn ghi danh khi hết chỗ                                                              |
| `personnel_actions`    | type (TRANSFER/SALARY_ADJUST/AWARD/DISCIPLINE/RESIGNATION), subject_id, requested/decided_by, payload jsonb, status, decision_note              | **ApprovalEngine dùng chung** — duyệt thôi việc tự sinh handover_checklist 4+ xác nhận |
| `hr_documents`         | title, category (POLICY/FORM/DECISION/PROCESS/REPORT/OTHER), process_area, version, content_md, file_url, tags[]                                | Kho tài liệu quy trình — tập tin lưu volume uploads, tên ngẫu nhiên chống đè           |

**Hai máy trạng thái trung tâm (kế thừa kỷ luật biểu đồ trạng thái của tài liệu gốc):**

```
Article:  DRAFT ──submit──▶ PENDING_REVIEW ──approve──▶ PUBLISHED ──archive──▶ ARCHIVED
            ▲                      │                          ▲                   │
            └── request_changes ───┘                          └──── un-archive ───┘
   (mọi chuyển trạng thái phải ghi 1 dòng article_reviews + audit_log; PUBLISHED chỉ sửa bằng version mới)

User:  ACTIVE ◀──unlock── LOCKED(temporary, locked_until) ; ACTIVE ──disable──▶ DISABLED
```

### 4.4. Thiết kế API RESTful (tiền tố `/api/v1`)

| Nhóm              | Endpoint                                                           | Method                | Vai được phép                                            | Mô tả                                                                                    |
| ----------------- | ------------------------------------------------------------------ | --------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Auth              | `/auth/login`                                                      | POST                  | công khai                                                | Đổi credential → access + refresh; sai 5 lần khóa 15'                                    |
| Auth              | `/auth/refresh` · `/auth/logout`                                   | POST                  | authenticated                                            | Xoay vòng / thu hồi refresh token                                                        |
| Auth              | `/auth/me`                                                         | GET                   | authenticated                                            | Hồ sơ + vai + quyền hiệu lực                                                             |
| Users             | `/users` · `/users/:id`                                            | GET/POST/PATCH/DELETE | ADMIN                                                    | Danh sách (phân trang, lọc), tạo, sửa vai/trạng thái                                     |
| OrgUnits          | `/org-units/tree` · `/org-units`                                   | GET/POST/PATCH/DELETE | ADMIN (ghi)                                              | Cây tổ chức dạng JSON                                                                    |
| Spaces            | `/spaces` · `/spaces/:id`                                          | GET/POST/PATCH/DELETE | KM_MANAGER/ADMIN (ghi)                                   | Lọc theo quyền nhìn thấy                                                                 |
| Spaces            | `/spaces/:id/members`                                              | GET/POST/PATCH/DELETE | MANAGER Space                                            | Thành viên + vai theo Space                                                              |
| Articles          | `/spaces/:id/articles` · `/articles/:id`                           | GET/POST/PATCH        | theo vai Space                                           | Danh sách, tạo (DRAFT), cập nhật (sinh version mới)                                      |
| Articles          | `/articles/:id/versions` · `/versions/:versionId/restore`          | GET/POST              | EDITOR trở lên                                           | Lịch sử bất biến, khôi phục                                                              |
| Workflow          | `/articles/:id/submit`                                             | POST                  | tác giả                                                  | DRAFT → PENDING_REVIEW                                                                   |
| Workflow          | `/reviews/pending` · `/articles/:id/review`                        | GET/POST              | MANAGER Space, KM_MANAGER                                | Hộp phê duyệt; action: approve/request_changes/reject + ý kiến                           |
| Comments          | `/articles/:id/comments`                                           | GET/POST/PATCH        | authenticated                                            | Hai cấp; đánh dấu resolved                                                               |
| Reactions/Views   | `/articles/:id/reaction` · `/articles/:id/view`                    | PUT/POST              | authenticated/công khai                                  | Helpful toggle; đếm xem (debounce)                                                       |
| Search            | `/search?q=&space=&tag=&status=`                                   | GET                   | authenticated                                            | FTS toàn văn + bộ lọc, phân trang                                                        |
| Bookmarks/Follows | `/me/bookmarks` · `/spaces/:id/follow`                             | GET/PUT/DELETE        | authenticated                                            |                                                                                          |
| Notifications     | `/notifications` · `/notifications/:id/read`                       | GET/PATCH             | authenticated                                            |                                                                                          |
| Onboarding        | `/onboarding/paths` · `/assignments/:id/progress`                  | CRUD/PATCH            | KM_MANAGER/nhân viên                                     | Lộ trình + tiến độ                                                                       |
| Handover          | `/handovers` · `/handovers/:id/items/:itemId`                      | CRUD/PATCH            | KM_MANAGER + người xác nhận                              | Checklist chuyển giao                                                                    |
| People            | `/people?q=` · `/people/:id`                                       | GET                   | authenticated                                            | Directory chuyên môn                                                                     |
| Attendance        | `/attendance/kiosk/token`                                          | GET                   | ADMIN, KM_MANAGER                                        | Sinh token QR ký HMAC cho kiosk (TTL 30s, jti one-time)                                  |
| Attendance        | `/attendance/check-in`                                             | POST                  | authenticated                                            | Body `{method: QR\|FACE\|WEB, qr_token?, face_embedding?}`; chống replay, dedupe ±2 phút |
| Attendance        | `/attendance/face/enroll` · `/attendance/face/enrollments`         | POST/GET/DELETE       | authenticated (sau đồng thuận)                           | Lưu 3–5 vector mã hóa AES; xem/xóa mẫu của mình                                          |
| Attendance        | `/attendance/devices` · `/attendance/devices/:id/events`           | CRUD/POST             | ADMIN; webhook dùng device key (HMAC header)             | Quản lý thiết bị; máy chấm công đẩy sự kiện                                              |
| Attendance        | `/attendance/import/csv` · `/attendance/simulator/run`             | POST                  | ADMIN, KM_MANAGER                                        | Import CSV từ máy; chạy bộ mô phỏng sinh sự kiện                                         |
| Attendance        | `/attendance/me` · `/attendance/days?date=&unit=`                  | GET                   | authenticated (cá nhân); ADMIN/KM_MANAGER (toàn công ty) | Bảng công cá nhân / tổng hợp                                                             |
| Attendance        | `/attendance/days/:userId/:date/correction`                        | POST                  | ADMIN                                                    | Hiệu chỉnh có lý do — ghi `attendance_corrections` + audit                               |
| Employees         | `/employees` · `/employees/:id`                                    | GET                   | authenticated                                            | Danh sách hồ sơ NV; chi tiết kèm hợp đồng + chứng chỉ + quỹ phép                         |
| Employees         | `/employees/:id/profile` · `/:id/contracts` · `/:id/certificates`  | PATCH/POST/DELETE     | ADMIN, KM_MANAGER                                        | Sửa hồ sơ (mã NV tự sinh); hợp đồng; văn bằng (kho lưu trữ kép)                          |
| Leave             | `/leave` · `/leave/mine` · `/leave/balance`                        | GET/POST              | authenticated; danh sách tất cả: HR                      | Tạo đơn (kiểm quỹ, chặn vượt); quỹ phép theo năm                                         |
| Leave             | `/leave/:id/approve` · `/reject` · `/cancel`                       | POST                  | HR duyệt; hủy: người tạo                                 | Duyệt = trừ quỹ NGAY; từ chối kèm lý do                                                  |
| Overtime          | `/overtime` · `/overtime/mine` · `/:id/approve` · `/reject`        | GET/POST              | authenticated; duyệt: HR                                 | Chỉ giờ APPROVED được tính vào bảng lương                                                |
| Payroll           | `/payroll/periods` · `/:id/calculate` · `/review` · `/lock`        | GET/POST              | HR tính/đối chiếu; ADMIN khóa                            | Chu trình kỳ lương; LOCKED chặn tính lại (409)                                           |
| Payroll           | `/payroll/periods/:id/payslips` · `/payroll/payslips/mine`         | GET                   | HR (toàn công ty); cá nhân (của mình)                    | Bảng lương kỳ; phiếu lương điện tử                                                       |
| Recruitment       | `/recruitment/requisitions` (+ approve/reject/close)               | GET/POST              | tạo: mọi người; duyệt: HR                                | Phiếu đề xuất tuyển dụng                                                                 |
| Recruitment       | `/recruitment/candidates`                                          | GET/POST/PATCH        | HR                                                       | Danh sách ứng viên 6 giai đoạn + điểm phỏng vấn                                          |
| Performance       | `/performance/mine` · `/team` · `/:id/submit` · `/:id/acknowledge` | GET/POST              | HR tạo/nộp; nhân viên xác nhận                           | Đánh giá hiệu suất chu kỳ 6 tháng                                                        |
| Training          | `/training/courses` (+ `/mine`, enroll/drop/complete)              | GET/POST              | HR tạo; toàn bộ ghi danh                                 | Chặn ghi danh khi hết chỗ                                                                |
| PersonnelActions  | `/personnel-actions` (+ `/mine`, approve/reject)                   | GET/POST              | tạo: mọi người (thôi việc của mình); duyệt: ADMIN        | 5 loại đề xuất — duyệt thôi việc tự sinh checklist bàn giao                              |
| Documents         | `/documents` (+ `/:id`)                                            | GET/POST/PUT/DELETE   | đọc: mọi người; ghi: HR                                  | Kho tài liệu quy trình; upload base64 ≤ 8MB, whitelist đuôi file                         |
| Auth (mở rộng)    | `/auth/logout-all`                                                 | POST                  | authenticated                                            | Thu hồi TOÀN BỘ refresh token — đăng xuất khỏi mọi thiết bị                              |
| Dashboard         | `/dashboard/stats`                                                 | GET                   | authenticated                                            | Số liệu theo vai (gồm thống kê công tuần)                                                |
| Admin             | `/admin/settings` · `/audit-logs`                                  | GET/PATCH/GET         | ADMIN                                                    | Tham số; audit (chỉ đọc)                                                                 |
| Health            | `/healthz` · `/readyz`                                             | GET                   | công khai                                                | Cho Docker healthcheck                                                                   |

**Quy ước:** tài nguyên danh từ số nhiều; lọc `?page=&limit=&sort=`; mã HTTP chuẩn (200/201/204/400/401/403/404/409/422/429/500); mọi response lỗi theo một shape:

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

### 4.5. Bốn luồng dữ liệu điển hình

**Luồng 1 — Xuất bản bài viết (số hóa luồng ba tầng của Hình 5):**

```
Tác giả soạn (TipTap) ──PUT /articles/:id──▶ sinh ArticleVersion (n+1), status=DRAFT
   ──POST /submit──▶ status=PENDING_REVIEW + review(SUBMIT) + notify(MANAGER Space, KM_MANAGER)
Reviewer mở hộp duyệt ──GET /reviews/pending──▶ POST /review {action}
   ├─ APPROVE         ─▶ status=PUBLISHED, published_at=now, notify(tác giả), audit(APPROVE)
   └─ REQUEST_CHANGES ─▶ status=DRAFT + comment, notify(tác giả), audit(REQUEST_CHANGES)
Mọi bước ghi article_reviews + audit_logs → timeline hiển thị "ai, lúc nào, ý kiến gì"
```

**Luồng 2 — Tìm kiếm (nguyên tắc "cần tìm thì tìm ra"):**

```
Gõ từ khóa ──GET /search?q=java+runbook──▶ SearchService
   ──▶ PostgreSQL: WHERE visibility-ok AND (title_trgm % q OR content_tsv @@ q::tsquery)
       ORDER BY rank (ts_rank + trọng số tiêu đề) LIMIT 20
   ──▶ trả DTO rút gọn (highlight đoạn khớp) ──▶ FE render danh sách < 1s
Phạm vi: chỉ index bài PUBLISHED + Space mà người dùng được nhìn thấy (lọc SQL, không lọc FE)
```

**Luồng 3 — Xác thực:**

```
login ──▶ bcrypt.compare → sai: failed_login_attempts++ (≥5 → LOCKED 15')
      └─▶ đúng: reset counter, cấp access(15') + refresh(7', lưu hash DB)
FE axios interceptor: 401 → POST /auth/refresh (1 lần) → retry request gốc
logout/admin khóa → revoked_at hoặc status≠ACTIVE → mọi token kế tiếp bị chặn ở Guard
```

**Luồng 4 — Điểm danh QR chống giả mạo (mirror UC18):**

```
Kiosk ──GET /attendance/kiosk/token──▶ token ký HMAC {kiosk_id, iat, jti}, TTL 30s → render QR
   (kiosk tự gọi lại mỗi 30s → mã trên màn hình luôn xoay, chặn chụp ảnh tái sử dụng)
Nhân viên quét bằng camera điện thoại → mở deep-link /check-in?token=... → FE xác nhận
   ──POST /attendance/check-in {qr_token}──▶ API:
      verify chữ ký + TTL ≤ 60s + jti chưa dùng + chưa check-in trong ±2 phút
      → INSERT attendance_events(source=QR, device=kiosk) [append-only]
      → event handler tổng hợp attendance_days (first_in/late_minutes...)
      → phản hồi "Chấm công 08:02 ✓" + hiện trên bảng công và dashboard
Sự kiện từ máy chấm công đi cùng đường: MACHINE_WEBHOOK (HMAC header) hoặc CSV import
   → cùng đổ vào attendance_events → cùng một bộ tổng hợp → một nguồn sự thật
```

### 4.6. Yêu cầu phi chức năng (chuẩn production cho demo)

| Hạng mục                       | Thiết kế                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validation                     | `ValidationPipe` toàn cục (`whitelist`, `forbidNonWhitelisted`, `transform`); DTO class-validator cho 100% endpoint ghi                                                                                                                                                                                    |
| Xử lý lỗi tập trung            | `AllExceptionsFilter` bắt mọi exception → shape JSON thống nhất (mục 4.4); exception nghiệp vụ riêng (`BusinessException` + code); prod không lộ stack trace                                                                                                                                               |
| Logging                        | pino JSON; `LoggingInterceptor` ghi method-path-status-duration-requestId; redact trường nhạy cảm (password, face_embedding); level theo `LOG_LEVEL`                                                                                                                                                       |
| Bảo mật                        | bcrypt cost 12; JWT secret ≥ 32 ký tự (bắt buộc cấu hình khi `NODE_ENV=production`); helmet; CORS từ env; throttler toàn cục + riêng login; upload whitelist (pdf/png/jpg/jpeg/webp/md/txt/docx/xlsx/pptx) ≤ 10MB, kiểm magic-number; ID uuid không đoán được; render Markdown phía client có sanitize XSS |
| Sinh trắc học & quyền riêng tư | Vector khuôn mặt mã hóa AES-256-GCM (khóa từ env), chỉ thu thập sau đồng thuận rõ ràng, không lưu ảnh gốc, xóa mẫu khi offboarding; log không bao giờ ghi nội dung vector                                                                                                                                  |
| Chống gian lận điểm danh       | QR xoay 30s + TTL 60s + jti one-time; webhook thiết bị bắt buộc HMAC + timestamp; rate limit check-in per-user; khung giờ hợp lệ cấu hình qua settings                                                                                                                                                     |
| Hiệu năng                      | Phân trang mọi danh sách; index: GIN pg_trgm (title, content_md), btree (status, space_id, published_at), composite (user_id, work_date); tránh N+1 bằng `include` của Prisma                                                                                                                              |
| Kiểm thử                       | Jest unit test cho service nghiệp vụ trọng yếu (workflow, permission, search scope, attendance aggregation, QR token verify); Supertest e2e cho 4 luồng: auth, publish, cross-space forbidden, check-in QR; FE smoke test Vitest; mục tiêu phủ logic P0                                                    |
| Khả dụng                       | Healthcheck cả 3 service; `depends_on: condition: service_healthy`; restart policy `unless-stopped`                                                                                                                                                                                                        |

---

## 5. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN

Giả định nguồn lực: **1 sinh viên, part-time ~10–12 giờ/tuần, tổng 6 tuần (~70 giờ)**. Mốc demo: cuối tuần 6. Kèm phương án rút 3 tuần ở mục 5.2.

### 5.1. Sáu giai đoạn

| Giai đoạn                                      | Thời gian    | Nội dung chính                                                                                                                                                                                                                                                                                                                                                               | Kết quả milestone (checkpoint demo được)                                                                     | Effort |
| ---------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------ |
| **G0 — Nền móng & clone-and-run từ ngày đầu**  | Tuần 1 (10h) | Scaffold monorepo (Next.js + NestJS); docker-compose (db/api/web) + healthcheck; entrypoint tự `migrate deploy` + seed khi rỗng; `.env.example` đầy đủ; NestJS bootstrap: config validate, Swagger, exception filter, logging, health; Next.js bootstrap: App Router, AntD, rewrites `/api`, layout, trang đăng nhập; module Auth hoàn chỉnh (JWT + refresh + lockout 5/15') | `git clone && docker compose up` → mở `localhost:8080` đăng nhập được bằng tài khoản seed; Swagger xanh      | 10h    |
| **G1 — Lõi tổ chức & nội dung**                | Tuần 2 (14h) | OrgUnits (cây), Users admin, Spaces + members + visibility, Articles CRUD + TipTap editor + attachments, ArticleVersions bất biến + rollback                                                                                                                                                                                                                                 | Tạo Space → soạn bài → sửa (sinh version) → xem lịch sử → rollback; quyền đọc theo visibility đúng           | 14h    |
| **G2 — Luồng duyệt & cộng tác**                | Tuần 3 (12h) | ReviewWorkflow (submit/approve/request_changes/reject + timeline), hộp phê duyệt, Comments Q&A, Notifications in-app, AuditInterceptor append-only                                                                                                                                                                                                                           | E2E 2 tài khoản: soạn → trình → duyệt → xuất bản; audit log đầy đủ; notification đến đúng người              | 12h    |
| **G3 — Khám phá tri thức + điểm danh QR**      | Tuần 4 (12h) | PostgreSQL FTS + pg_trgm + ranking; trang search-first; categories/tags + bộ lọc; bookmarks/follows; reactions/views; **phân hệ QR: trang kiosk xoay mã 30s, QrTokenService (HMAC + jti), check-in + dedupe, tổng hợp attendance_days, bảng công cá nhân**                                                                                                                   | Trang chủ search trả đúng kết quả trong phạm vi quyền; **quét/giả lập quét QR → bảng công cập nhật tức thì** | 12h    |
| **G4 — Khuôn mặt, máy chấm công & hoàn thiện** | Tuần 5 (13h) | **Face enroll + check-in (MediaPipe WASM, mã hóa vector, đồng thuận); webhook HMAC + import CSV + bộ mô phỏng thiết bị; hàng đợi bản ghi lệch + hiệu chỉnh có vết;** onboarding paths + progress; knowledge handover checklist; admin settings; polish UX (empty/loading/error states, responsive); seed data phong phú + kịch bản demo                                      | Demo chạy trọn kịch bản 10 phút (mục 5.3) không vấp; khuôn mặt nhận diện đúng người đã đăng ký               | 13h    |
| **G5 — Cứng hóa & bàn giao**                   | Tuần 6 (9h)  | Unit + e2e test các luồng P0 (gồm QR token verify, attendance aggregation); chuẩn hóa log; README hoàn chỉnh (quickstart, bảng env, tài khoản, troubleshooting, reset, kiến trúc, screenshot); kiểm thử clone-and-run trên máy sạch + Windows/macOS nếu được; freeze code, tag `v1.0.0`                                                                                      | Checklist mục 8 pass 100% trên máy chưa từng cài project                                                     | 9h     |

### 5.2. Phương án rút ngắn (fast-track 3 tuần, ~full-time)

- Gộp G0+G1 thành tuần 1 (auth + spaces + articles, bỏ CI chi tiết);
- Tuần 2: G2+G3 (workflow + search + comments + QR; bỏ people directory, reactions);
- Tuần 3: khuôn mặt rút xuống "hậu demo" nếu kẹt thời gian; giữ webhook/mô phỏng máy ở mức tối thiểu; onboarding path rút gọn (chỉ xem, không track progress) + test e2e happy-path + README + kiểm thử máy sạch.
- **Nguyên tắc cắt giảm theo thứ tự:** khuôn mặt → CSV import → people directory → reactions. **Không bao giờ cắt:** G0, G5, luồng duyệt, tìm kiếm, điểm danh QR — đây là bộ xương sống của demo.

### 5.3. Kịch bản demo 10 phút (dùng ngay khi bảo vệ)

| Phút | Hành động                                                                                                                                                                                                | Insight tài liệu đang chứng minh                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 0–1  | Mở terminal sạch: `git clone … && docker compose up -d` → trình bày 3 service healthy                                                                                                                    | Portability tuyệt đối                                       |
| 1–2  | Đăng nhập ADMIN → dashboard tổng quan; chỉ ra cây tổ chức Saigon Technology trong menu                                                                                                                   | "Cây tổ chức là dữ liệu"                                    |
| 2–4  | Vào Space "Quy trình phát triển" → tạo bài "Runbook triển khai Java" → đính kèm file → lưu DRAFT                                                                                                         | Single source of truth                                      |
| 4–6  | Trình duyệt → đổi tài khoản KM_MANAGER → hộp phê duyệt → yêu cầu chỉnh sửa → tác giả sửa (version 2) → duyệt → PUBLISHED                                                                                 | Luồng ba tầng đề xuất→thẩm định→phê duyệt; version bất biến |
| 6–7  | Tìm kiếm "runbook java" → kết quả tức thì; mở bài → bình luận hỏi đáp → đánh giá hữu ích                                                                                                                 | "Cần tìm thì tìm ra"                                        |
| 7–8  | **Mở trang kiosk QR trên màn hình phụ → quét bằng điện thoại (hoặc bấm "giả lập quét") → "Chấm công 08:02 ✓" → mở bảng công ngày; (dự phòng ấn tượng) đăng ký + điểm danh khuôn mặt bằng webcam laptop** | Chấm công đa nguồn — UC18                                   |
| 8–9  | Đăng nhập nhân viên mới → onboarding path → tick hoàn thành mục đọc; mở knowledge handover của nhân viên nghỉ việc → checklist (có mục "xóa mẫu khuôn mặt")                                              | Hội nhập 3 bộ phận; thôi việc 4 xác nhận UC17               |
| 9–10 | Audit log + timeline duyệt + hàng đợi bản ghi lệch do bộ mô phỏng máy sinh; chốt: mọi thao tác để lại vết — ISO 27001 mindset                                                                            | Truy vết – bất biến                                         |

---

## 6. CẤU TRÚC THƯ MỤC REPOSITORY ĐỀ XUẤT

```
kms-saigon-technology/
├── README.md                     # Quickstart ≤ 5 bước, bảng .env, tài khoản demo, troubleshooting
├── docker-compose.yml            # 3 service: db, api, web — giá trị mặc định an toàn (${VAR:-default})
├── docker-compose.override.yml   # Ghi đè cho dev: hot-reload, expose cổng db (không ảnh hưởng prod)
├── .env.example                  # Toàn bộ biến cấu hình + chú thích từng biến
├── .editorconfig  .gitattributes  .gitignore
├── Makefile                      # make up / down / logs / reset / seed / simulate (wrapper cho compose)
├── docs/
│   ├── KMS_PLAN.md               # Chính là tài liệu kế hoạch này
│   ├── DEMO_SCRIPT.md            # Kịch bản demo 10 phút
│   ├── api/                      # Ghi chú bổ sung cho OpenAPI (ví dụ curl, định dạng webhook/CSV)
│   └── adr/                      # Architecture Decision Records ngắn (chọn stack, FTS, auth, face…)
├── backend/
│   ├── Dockerfile                # Multi-stage: deps → build → runner (node:20-alpine, non-root user)
│   ├── package.json  tsconfig.json  nest-cli.json  .eslintrc.cjs
│   ├── prisma/
│   │   ├── schema.prisma         # 30 bảng như mục 4.3
│   │   ├── migrations/           # Migration versioned — tự chạy khi container khởi động
│   │   └── seed.ts               # Idempotent: chỉ seed khi DB rỗng (SEED_ON_FIRST_RUN=true)
│   ├── scripts/
│   │   └── simulate-device.ts    # Bộ mô phỏng máy chấm công: sinh sự kiện 14 ngày (có bản ghi lệch)
│   ├── src/
│   │   ├── main.ts               # Bootstrap: global pipes/filters/interceptors, swagger, shutdown hooks
│   │   ├── app.module.ts
│   │   ├── config/               # env.validation.ts (fail-fast), configuration.ts
│   │   ├── common/               # guards/ decorators/ filters/ interceptors/ dto/ utils/
│   │   └── modules/
│   │       ├── auth/  users/  org-units/
│   │       ├── spaces/ articles/ review-workflow/
│   │       ├── comments/ search/ notifications/
│   │       ├── attendance/       # kiosk-token, check-in, face-enroll, device-sync, daily-board
│   │       ├── onboarding/ people/ dashboard/
│   │       └── admin-settings/ audit/ health/
│   └── test/                     # unit/ + e2e/ (supertest)
├── frontend/
│   ├── Dockerfile                # Multi-stage: deps → build → runner (node:20-alpine, output standalone)
│   ├── next.config.mjs           # output:'standalone'; rewrites /api/:path* → http://api:3001/:path*
│   ├── package.json  tsconfig.json  .eslintrc.json
│   ├── public/                   # icon, manifest
│   └── src/
│       ├── app/                  # App Router: (auth)/login · (main)/spaces/[slug] · kiosk/page.tsx · check-in/page.tsx
│       ├── api/                  # axios client + interceptor refresh + typed fetchers
│       ├── stores/               # zustand (auth, ui)
│       ├── features/
│       │   ├── spaces/ articles/ review/ search/
│       │   ├── attendance/       # KioskScreen, QrScanner, FaceCapture, DayBoard, CorrectionQueue
│       │   └── onboarding/ people/ admin/
│       ├── components/           # layout/ common/ (Editor, PermissionGate, EmptyState…)
│       └── styles/
└── .github/workflows/ci.yml      # lint + test + docker build (backend, frontend)
```

**Nguyên tắc tổ chức:** monorepo 2 ứng dụng (backend/frontend) + hạ tầng ở gốc; mỗi module backend tự chứa `controller/service/service.spec/dto/module` (feature-sliced); frontend Next.js chia theo feature, các trang tương tác nặng (editor, kiosk, face) đặt `'use client'`, trang đọc bài tận dụng Server Components.

---

## 7. CHIẾN LƯỢC DỮ LIỆU MẪU VÀ TÀI KHOẢN DEMO

### 7.1. Tài khoản demo (seed tự tạo lần đầu)

| Email                    | Mật khẩu      | Vai toàn cục | Vai theo Space                                    | Dùng để demo gì                                    |
| ------------------------ | ------------- | ------------ | ------------------------------------------------- | -------------------------------------------------- |
| `admin@demo.local`       | `Admin@123`   | ADMIN        | MANAGER mọi Space                                 | Quản trị, cây tổ chức, audit, hiệu chỉnh công      |
| `km.manager@demo.local`  | `Manager@123` | KM_MANAGER   | MANAGER Space chính                               | Hộp phê duyệt, onboarding, handover, import CSV    |
| `pm.java@demo.local`     | `Pm@123456`   | USER         | MANAGER Space "Nhóm Java", CONTRIBUTOR Space khác | Trưởng dự án đề xuất/soạn bài                      |
| `dev.fresher@demo.local` | `Fresher@123` | USER         | VIEWER + assignment onboarding                    | Nhân viên mới: đọc, onboarding progress, điểm danh |
| `editor.qa@demo.local`   | `Editor@123`  | USER         | EDITOR Space "QA & Kiểm thử"                      | Soạn và trình duyệt bài                            |

> Mật khẩu chỉ dùng trong demo; README ghi rõ đây là seed data, bắt buộc đổi khi dùng thật (admin có màn hình đổi mật khẩu).

### 7.2. Dữ liệu mẫu mô phỏng Saigon Technology (seed idempotent)

- **Cây tổ chức** đúng Hình 1 của tài liệu: Ban Giám đốc → 5 khối/ban; Ban TC–HC–NS gồm 4 tổ; Khối Delivery gồm 2 trung tâm (TP.HCM, Đà Nẵng) mỗi trung tâm 5 nhóm dự án (Java, .NET, PHP/NodeJS, Mobile, QA, DevOps);
- **6 Space:** "Quy trình phát triển" (PUBLIC), "DevOps Runbook" (RESTRICTED), "Chính sách nhân sự" (PUBLIC), "Kiến thức dự án — Fintech AU" (PRIVATE), "QA & Kiểm thử" (PUBLIC), "Onboarding" (PUBLIC);
- **~30 bài viết** tiếng Việt có nội dung thật sự đọc được (runbook deploy, quy trình code review, chính sách phép năm theo BLĐ 2019 — ăn khớp Bảng 2.6 của tài liệu gốc, checklist release, bài học dự án…), rải đều trạng thái: 60% PUBLISHED, 15% PENDING_REVIEW (để hộp duyệt có việc), 15% DRAFT, 10% ARCHIVED;
- **Tag/danh mục:** java, dotnet, devops, qa, quy-trình, onboarding, bảo-mật…
- **Tương tác:** ~50 bình luận (có 1 thread Q&A resolved), reactions, view counts lệch nhau để dashboard có xếp hạng;
- **1 onboarding path** "Lộ trình fresher Java — 2 tuần đầu" (5 bài bắt buộc) + 1 assignment đang dở cho `dev.fresher`;
- **1 handover checklist** đang OPEN (3/5 DONE) để minh họa trạng thái chờ — gồm item mặc định "xóa mẫu khuôn mặt";
- **Thiết bị chấm công:** 1 kiosk QR "Kiosk Tầng 3 — TP.HCM" + 1 thiết bị SIMULATOR; chạy `make simulate` sinh ~200 sự kiện trong 14 ngày qua (có chủ đích vài bản ghi đi muộn, thiếu giờ ra) để bảng công và hàng đợi lệch có nội dung thật khi demo;
- **Không seed vector khuôn mặt** (dữ liệu sinh trắc học): thao tác đăng ký khuôn mặt thực hiện trực tiếp trong demo ~30 giây — vừa minh bạch, vừa đúng nguyên tắc đồng thuận.

---

## 8. CHECKLIST TIÊU CHÍ "CLONE-AND-RUN"

> Định nghĩa Done: trên **máy sạch** (chỉ có Docker Desktop/Engine + Git), thực hiện đúng 2 lệnh `git clone …` và `docker compose up -d` (hoặc `make up`) thì trong ≤ 5 phút (tùy tốc độ pull ảnh lần đầu) hệ thống usable đầy đủ, **không tạo/sửa bất kỳ tệp nào**.

**A. Khởi động & cấu hình**

- [ ] `docker compose up -d` không yêu cầu bước nào khác; không cần `npm install`, không cần tạo DB tay;
- [ ] Compose có giá trị mặc định `${VAR:-default}` cho mọi biến → chạy được **kể cả khi chưa có `.env`**; `.env.example` vẫn đầy đủ kèm chú thích cho ai muốn tùy biến;
- [ ] Khi `NODE_ENV=production` mà thiếu `JWT_SECRET` mạnh → API fail-fast với thông báo rõ ràng (chống chạy "nguy hiểm mà im lặng");
- [ ] Cả 3 service có healthcheck; `web` chỉ báo ready khi `api` ready (`depends_on: condition: service_healthy`);
- [ ] Cổng mặc định không đụng độ phổ biến (8080/3001); hướng dẫn đổi cổng chỉ qua `.env`;
- [ ] `PUBLIC_BASE_URL` mặc định `http://localhost:8080`; README có mục riêng "demo QR bằng điện thoại": đổi sang IP LAN + mở firewall;
- [ ] Chạy được trên Windows (WSL2), macOS, Linux; không bind-mount đường dẫn host bắt buộc (dùng named volume); không phụ thuộc ký tự xuống dòng (`.gitattributes` chuẩn).

**B. Dữ liệu & migration**

- [ ] `prisma migrate deploy` tự chạy trong entrypoint của `api` trước khi mở port;
- [ ] Seed tự chạy đúng một lần khi DB rỗng (`SEED_ON_FIRST_RUN=true`), idempotent khi restart;
- [ ] Sau up: 5 tài khoản demo đăng nhập được bằng mật khẩu trong README; dữ liệu mẫu (Space, bài viết, onboarding, handover, thiết bị) hiện diện;
- [ ] `make simulate` sinh dữ liệu chấm công 14 ngày (kèm bản ghi lệch) chỉ bằng một lệnh;
- [ ] Lệnh reset sạch được tài liệu: `docker compose down -v && docker compose up -d` (hoặc `make reset`).

**C. Chức năng tối thiểu sau khi chạy**

- [ ] Đăng nhập 4 vai → mỗi vai thấy đúng menu và đúng phạm vi dữ liệu;
- [ ] Tạo Space → soạn bài → trình duyệt → duyệt bằng 2 tài khoản → tìm thấy bằng search;
- [ ] **QR:** kiosk xoay mã mỗi 30s; check-in qua nút "giả lập quét" HOẶC điện thoại thật đều ghi sự kiện và cập nhật bảng công ngày; check-in lần 2 trong 2 phút bị từ chối dedupe;
- [ ] **Khuôn mặt:** đăng ký 3 mẫu (có tick đồng thuận) → check-in nhận diện đúng người đã đăng ký; người chưa đăng ký nhận thông báo từ chối rõ ràng; vector lưu dạng mã hóa (kiểm bằng query DB);
- [ ] **Máy chấm công:** chạy bộ mô phỏng → sự kiện đổ vào `attendance_events` → bảng công cập nhật; bản ghi thiếu vào/ra nằm trong hàng đợi lệch; hiệu chỉnh của ADMIN để lại vết trong `attendance_corrections`;
- [ ] Swagger UI mở được tại `/api/docs`; `/healthz`, `/readyz` trả 200;
- [ ] Upload tệp hợp lệ thành công; tệp sai loại/vượt dung lượng bị chặn với thông báo lỗi thân thiện (shape lỗi thống nhất).

**D. Chất lượng & bàn giao**

- [ ] CI xanh trên GitHub: lint + unit/e2e test + build 2 image thành công;
- [ ] Ảnh pin version cụ thể; lần pull đầu cần internet — README ghi rõ yêu cầu này;
- [ ] README có: quickstart ≤ 5 bước, bảng biến `.env`, bảng tài khoản demo, sơ đồ kiến trúc, troubleshooting (port bận, WSL2, pull chậm, điện thoại không thấy máy demo), hướng dẫn reset, hướng dẫn đổi mật khẩu demo;
- [ ] `docs/DEMO_SCRIPT.md` khớp 1-1 với dữ liệu seed (không có bước "nhớ tự tạo dữ liệu trước khi demo");
- [ ] Tag git `v1.0.0` + ghi chú release.

---

## 9. RỦI RO VÀ BIỆN PHÁP GIẢM THIỂU

| #   | Rủi ro                                                                       | Khả năng   | Ảnh hưởng  | Giảm thiểu                                                                                                               |
| --- | ---------------------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Máy demo yếu, Docker Desktop/WSL2 chậm hoặc lỗi                              | Trung bình | Cao        | Stack nhẹ (Postgres alpine + Node alpine, không ES/Redis); backup phương án: quay video demo + export DB dump kèm repo   |
| 2   | Cổng 8080/3001 bị chiếm trên máy trình chiếu                                 | Trung bình | Thấp       | Đổi cổng chỉ bằng `.env`; README có mục troubleshooting                                                                  |
| 3   | FTS tiếng Việt kém chất lượng (không có word-splitter tiếng Việt)            | Trung bình | Trung bình | pg_trgm similarity bắt được từ con/substring; trọng số tiêu đề; ghi nhận Meilisearch là nâng cấp lộ trình                |
| 4   | Scope creep — làm quá chức năng trước hạn                                    | Cao        | Cao        | Chốt P0/P1 ở mục 2; fast-track 5.2 với thứ tự cắt rõ ràng; mọi tính năng mới đưa vào mục 10                              |
| 5   | TipTap + AntD + Next.js App Router mất thời gian hơn dự kiến (SSR/hydration) | Trung bình | Trung bình | Các trang tương tác đặt `'use client'` toàn bộ; phương án dự phòng editor: Markdown textarea + preview                   |
| 6   | Quên đồng bộ kịch bản demo với seed data khi sửa code                        | Trung bình | Cao        | DEMO_SCRIPT.md là đầu vào bắt buộc của checklist G5; seed cố định ID cho các đối tượng chính của kịch bản                |
| 7   | Secret mặc định bị dùng thật khi đem ra ngoài demo                           | Thấp       | Trung bình | Fail-fast khi production thiếu secret; README cảnh báo + màn hình đổi mật khẩu                                           |
| 8   | Webcam không sẵn hoặc ánh sáng kém khiến demo khuôn mặt trục trặc            | Trung bình | Trung bình | QR là phương án chính (P0, không cần phần cứng); khuôn mặt chỉ là điểm nhấn P1; thử trước 1 ngày tại phòng demo          |
| 9   | Điện thoại không cùng mạng LAN với máy demo → quét QR không tới được         | Trung bình | Thấp       | `PUBLIC_BASE_URL` cấu hình qua `.env`; nút "giả lập quét" ngay trên kiosk; README hướng dẫn tắt cách ly AP               |
| 10  | SDK độc quyền máy chấm công (ZKTeco…) không chạy được trong container demo   | Cao        | Thấp       | Chuẩn hóa adapter: webhook HMAC + CSV + simulator đi kèm; kết nối thiết bị thật là hướng phát triển có tài liệu (mục 10) |

---

## 10. HƯỚNG PHÁT TRIỂN SAU DEMO

1. **Tầng AI (kế thừa "Mức độ 3" của tài liệu gốc):** gợi ý bài viết liên quan khi soạn; hỏi đáp tri thức RAG trên nội dung đã duyệt; phát hiện "khoảng trống tri thức" từ câu hỏi chưa resolved — nguyên tắc giữ nguyên: _máy chỉ khuyến nghị, con người quyết định_;
2. **Meilisearch** qua compose profile `--profile search` khi dữ liệu lớn;
3. **Adapter máy chấm công thật:** ZKTeco PULL/PUSH qua LAN, chuẩn hóa dữ liệu đa hãng; **liveness detection** chống giả mạo khuôn mặt; geofencing Wi-Fi nội bộ cho điểm danh web;
4. **SSO/LDAP + đồng bộ người dùng từ HRMIS** qua API — xóa nhập kép, đúng tinh thần "một nguồn dữ liệu gốc"; đẩy dữ liệu công sang HRMIS tính lương qua API;
5. **Thông báo email/Teams/Slack webhook**; digest tuần;
6. **Soạn thảo cộng tác thời gian thực** (Yjs/CRDT) và review inline theo đoạn;
7. **Ứng dụng di động Flutter** kênh tự phục vụ đọc – tìm – hỏi – điểm danh, khớp định hướng đa kênh của tài liệu gốc;
8. **Đa ngôn ngữ VI/EN** và dark mode.

---

## PHỤ LỤC A — MA TRẬN QUYỀN RÚT GỌN (tham chiếu triển khai Guard)

| Hành động                                  | USER          | CONTRIBUTOR (Space) | EDITOR (Space) | MANAGER (Space) | KM_MANAGER | ADMIN |
| ------------------------------------------ | ------------- | ------------------- | -------------- | --------------- | ---------- | ----- |
| Đọc Space PUBLIC                           | ✔             | ✔                   | ✔              | ✔               | ✔          | ✔     |
| Đọc Space RESTRICTED/PRIVATE               | nếu là member | member              | member         | member          | ✔          | ✔     |
| Soạn bài DRAFT                             | ✖             | ✔                   | ✔              | ✔               | ✔          | ✔     |
| Sửa bài của người khác                     | ✖             | ✖                   | ✔              | ✔               | ✔          | ✔     |
| Trình duyệt bài của mình                   | ✖             | ✔                   | ✔              | ✔               | ✔          | ✔     |
| Duyệt / yêu cầu chỉnh sửa                  | ✖             | ✖                   | ✖              | ✔               | ✔          | ✔     |
| Archive / khôi phục                        | ✖             | ✖                   | ✖              | ✔               | ✔          | ✔     |
| Quản lý thành viên Space                   | ✖             | ✖                   | ✖              | ✔               | ✔          | ✔     |
| Quản lý Space (tạo/sửa toàn cục)           | ✖             | ✖                   | ✖              | ✖               | ✔          | ✔     |
| Điểm danh (QR / khuôn mặt / web)           | ✔             | ✔                   | ✔              | ✔               | ✔          | ✔     |
| Xem bảng công cá nhân                      | ✔             | ✔                   | ✔              | ✔               | ✔          | ✔     |
| Xem bảng công toàn công ty                 | ✖             | ✖                   | ✖              | ✖               | ✔          | ✔     |
| Sinh token kiosk / import CSV máy          | ✖             | ✖                   | ✖              | ✖               | ✔          | ✔     |
| Quản lý thiết bị + hiệu chỉnh bản ghi lệch | ✖             | ✖                   | ✖              | ✖               | ✖          | ✔     |
| Quản lý user, cây tổ chức, settings, audit | ✖             | ✖                   | ✖              | ✖               | ✖          | ✔     |

## PHỤ LỤC B — BẢNG BIẾN `.env.example` (khung)

| Biến                                                  | Mặc định an toàn cho demo                                | Ghi chú                                                                |
| ----------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `NODE_ENV`                                            | `production`                                             | `development` bật hot-reload qua override file                         |
| `WEB_PORT`                                            | `8080`                                                   | Cổng duy nhất người dùng cần nhớ                                       |
| `API_PORT`                                            | `3001`                                                   | Expose để xem Swagger; có thể đóng                                     |
| `PUBLIC_BASE_URL`                                     | `http://localhost:8080`                                  | Host nhúng vào mã QR kiosk — đổi thành IP LAN khi demo bằng điện thoại |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `kms` / `kms_demo_pw` / `kms`                            | Chỉ dùng trong mạng nội bộ compose                                     |
| `DATABASE_URL`                                        | `postgresql://kms:kms_demo_pw@db:5432/kms?schema=public` | Prisma dùng                                                            |
| `JWT_SECRET`                                          | `change-me-in-real-deployment-32chars-min`               | Production thiếu biến mạnh → fail-fast                                 |
| `JWT_EXPIRES_IN` / `REFRESH_EXPIRES_IN`               | `15m` / `7d`                                             | Theo thiết kế mục 4.5                                                  |
| `CORS_ORIGIN`                                         | `http://localhost:8080`                                  |                                                                        |
| `UPLOAD_MAX_MB` / `UPLOAD_DIR`                        | `10` / `/app/uploads`                                    | Named volume `kms_uploads`                                             |
| `LOG_LEVEL`                                           | `info`                                                   | `debug` khi điều tra sự cố                                             |
| `SEED_ON_FIRST_RUN`                                   | `true`                                                   | Tắt khi nối DB có sẵn                                                  |
| `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`      | `admin@demo.local` / `Admin@123`                         | Chỉ dùng lúc seed                                                      |
| `QR_TOKEN_TTL_SEC`                                    | `30`                                                     | Chu kỳ xoay mã QR trên kiosk (TTL chấp nhận ≤ 60s)                     |
| `FACE_EMBEDDING_KEY`                                  | `change-me-base64-32-bytes`                              | Khóa AES-256-GCM mã hóa vector khuôn mặt                               |
| `FACE_MATCH_THRESHOLD`                                | `0.55`                                                   | Ngưỡng cosine similarity chấp nhận                                     |
| `ATTENDANCE_WORK_START` / `ATTENDANCE_WORK_END`       | `08:00` / `17:30`                                        | Ca chuẩn để tính đi muộn/về sớm (ghi đè được bằng settings)            |
| `TZ`                                                  | `Asia/Ho_Chi_Minh`                                       | Thống nhất múi giờ log, bảng công và hiển thị                          |

---

_Tài liệu kế hoạch này là đầu vào duy nhất cần thiết để bắt đầu Giai đoạn G0. Mọi quyết định kiến trúc phát sinh trong quá trình code nên được ghi bổ sung vào `docs/adr/` theo format ADR ngắn._

---

## 11. NHẬT KÝ MỞ RỘNG HRMIS — ĐÃ TRIỂN KHAI & NGHIỆM THU (bản hiện hành)

Giai đoạn mở rộng chuyển KMS thành **HRMIS hoàn chỉnh** đã hoàn tất, bám sát 8 nhóm yêu cầu. Trạng thái: **build + lint + type-check 0 lỗi (backend & frontend)**; kiểm chứng E2E trên stack Docker chạy thật bằng `backend/scripts/verify-hr.mjs`: **39 PASS / 0 FAIL**.

### 11.1. Kết quả theo 8 nhóm yêu cầu

| #   | Yêu cầu                                                      | Kết quả | Bằng chứng chính                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Chuẩn hóa khoảng cách card/topcard bằng design token         | **ĐẠT** | Token `card/card-lg/stack/section` trong `tailwind.config.ts`; họ Card chuẩn hóa trong `components/ui/primitives.tsx`; `PageHeader` chuẩn `mb-stack`                                                             |
| 2   | Mở màn hình điểm danh từ trang đăng nhập                     | **ĐẠT** | `GET /attendance/kiosk/token` chuyển PUBLIC (token HMAC TTL 30s + jti one-time nên an toàn); kiosk/check-in có thông báo lỗi thân thiện + tự thử lại; login hỗ trợ `?next=` giữ mã QR                            |
| 3   | Đăng xuất & đổi tài khoản                                    | **ĐẠT** | Logout: thu hồi token server → xóa state + localStorage `kms-auth` → hủy request + clear React Query cache → hard-reload; thêm `POST /auth/logout-all`; login có banner phiên cũ + clear cache khi đổi tài khoản |
| 4   | Bổ sung nghiệp vụ còn thiếu theo PTTK_OOP_HR.md + Plan.md    | **ĐẠT** | 9 module mới (employees, leave, overtime, payroll, recruitment, performance, training, personnel-actions, documents) + 16 bảng (Miền 8) + 9 trang frontend; use case HR01–HR12 mục 2.1                           |
| 5   | Chuẩn hóa thuật ngữ                                          | **ĐẠT** | "Chuyển giao tri thức" → **"Bàn giao công việc"**; "Hộp duyệt" → "Phê duyệt"; "Chuyên gia" → "Tìm chuyên gia"; "Thoát" → "Đăng xuất"; branding KMS → HRMIS; nhãn tập trung tại `frontend/src/lib/hr.ts`          |
| 6   | Layout chuẩn + data table đầy đủ                             | **ĐẠT** | `PageContainer` max-w-7xl thống nhất; `components/ui/data-table.tsx` (tìm kiếm, lọc, sắp xếp, phân trang, hành động dòng) áp dụng cho 12+ trang                                                                  |
| 7   | Cơ cấu tổ chức: sửa/xóa/xem chi tiết + nhiều chế độ hiển thị | **ĐẠT** | `/admin/org-units`: thêm/sửa (đổi tên + di chuyển, chặn vòng lặp)/xóa (chặn khi còn ràng buộc)/chi tiết (danh sách NV); 3 chế độ: Cây · Sơ đồ · Bảng                                                             |
| 8   | In phiếu/báo cáo + quản lý tài liệu quy trình                | **ĐẠT** | `PrintButton`/`PrintFrame` + CSS `@media print` A4 trên mọi trang quản trị; `/documents` kho tài liệu phân loại + upload ≤ 8MB + tải xuống                                                                       |

### 11.2. Các luồng đã kiểm chứng E2E (39/39 PASS)

- Kiosk token công khai (200 không cần đăng nhập); đăng nhập 2 tài khoản;
- Hồ sơ NV: danh sách, mã NV, trạng thái thử việc, chi tiết kèm hợp đồng + chứng chỉ;
- Nghỉ phép: xem quỹ → **chặn đơn vượt quỹ (400)** → tạo đơn 2 ngày làm việc → HR duyệt → **quỹ trừ NGAY**;
- Làm thêm giờ: tạo → duyệt; Tuyển dụng: phiếu → duyệt → ứng viên → chuyển stage;
- Đánh giá: tạo → nộp → nhân viên xác nhận; Đào tạo: danh sách → ghi danh;
- Kỳ lương: tạo → tính (có BHXH + thuế + thực lĩnh) → đối chiếu → **khóa bất biến (chặn tính lại 409)** → nhân viên xem phiếu của mình;
- Biến động: đơn thôi việc → duyệt → **tự sinh checklist bàn giao công việc 5 mục**;
- Tài liệu: đọc kho tài liệu; Đăng xuất: refresh token bị thu hồi (401), đăng nhập tài khoản khác đúng danh tính, logout-all thu hồi đủ phiên.

### 11.3. Quy ước kỹ thuật mới cần biết khi bảo trì

- **Design token spacing:** chỉ dùng `p-card`, `gap-stack`… — cấm giá trị tùy tiện (mục 1);
- **DataTable dùng chung:** mọi bảng quản lý mới kế thừa `components/ui/data-table.tsx` thay vì tự viết `<table>`;
- **Nhãn nghiệp vụ:** map trạng thái qua `lib/hr.ts` — không hardcode chuỗi tiếng Việt rải rác;
- **In ấn:** nội dung in bọc trong `.print-area`, nút in dùng `PrintButton`; CSS in tại `globals.css`;
- **Bộ máy duyệt biến động:** thêm loại đề xuất mới = thêm giá trị enum + nhánh hiệu lực trong `personnel-actions.module.ts`, không viết luồng duyệt mới;
- **Migration:** schema hiện 46 bảng / 8 miền; migration HR chạy tự động qua `prisma migrate deploy` trong entrypoint.

### 11.4. Hạn chế đã biết & hướng phát triển tiếp theo

1. Tham số pháp lý (BHXH, biểu thuế, lương cơ sở) đang neo hằng số trong `payroll.module.ts` — cần chuyển sang bảng THAMSO theo hiệu lực ngày (đúng Bảng 2.6 tài liệu gốc);
2. Thưởng từ quyết định khen thưởng và tạm ứng chưa tự nạp vào phiếu lương;
3. Vai "KM_MANAGER" đang kiêm vai chuyên viên nhân sự — có thể tách chi tiết theo 11 tác nhân của tài liệu gốc;
4. Khuôn mặt dùng vector mô tả rút gọn 16×16 (demo) — hướng phát triển: MediaPipe/face-api.js WASM thật + liveness detection;
5. Thông báo tự động cho luồng HR (đơn chờ duyệt, nhắc hạn hợp đồng 45/30 ngày) chưa gắn vào `notifications`.
