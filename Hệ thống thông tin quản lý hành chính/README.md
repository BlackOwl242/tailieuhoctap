# Xây dựng hệ thống thông tin quản lý tiếp nhận và giải quyết thủ tục hành chính theo cơ chế một cửa tại thành phố Hà Nội

Phần mềm tại thư mục này là hệ thống thông tin tác nghiệp chạy cục bộ (máy chủ HTTP Python, cơ sở dữ liệu SQLite 3 chế độ WAL và giao diện React/TypeScript), mô phỏng đầy đủ cổng dịch vụ công cho người dân/tổ chức và bàn làm việc nội bộ theo mô hình chính quyền địa phương 2 cấp tại Hà Nội (cấp thành phố và 126 UBND phường, xã).

- **Báo cáo chính:** [Báo cáo xây dựng hệ thống quản lý tiếp nhận và giải quyết thủ tục hành chính](Bao_cao_nghien_cuu_Ha_Noi/04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx).
- **Tài liệu học tập được giữ nguyên:** Các tệp học tập `230926`, bài viết nghiên cứu `.md` ở thư mục gốc và mẫu trình chiếu `APAG` được bảo toàn nguyên trạng trong kho tài liệu.
- **Lưu ý phạm vi:** Hệ thống phục vụ nghiên cứu, thực hành và kiểm thử cục bộ; không cấp quyền truy cập hạ tầng mạng nhà nước, không thu phí thật và không phát hành chứng thư số công vụ.

---

## 1. Khởi chạy nhanh hệ thống

- **Yêu cầu môi trường:** Python 3.10+ và Node.js 20.19+.
- **Cài đặt lần đầu hoặc cập nhật:** Chạy `CAI_DAT.bat` để cài đặt thư viện Python (`requirements.txt`), biên dịch giao diện `frontend/dist`, khởi tạo dữ liệu cần thiết và mở hệ thống. Chạy lại tệp này an toàn, không đặt lại mật khẩu hay làm mất quyền của các tài khoản đã có.
- **Mở hệ thống hằng ngày:** Nhấp đúp `MO_HE_THONG.bat` để khởi động máy chủ (khởi động nhanh nhờ nạp trực tiếp gói đối chiếu nén `resources/official_catalog_reconciliation.json.gz` và SQLite WAL) rồi tự mở trình duyệt. Có thể dùng `run.bat` hoặc `python app.py` để chạy thủ công.
- **Địa chỉ truy cập:**
  - Cổng dịch vụ công (người dân/tổ chức): `http://127.0.0.1:8766`
  - Tra cứu nhanh tiến độ hồ sơ (không cần đăng nhập, ẩn PII): `http://127.0.0.1:8766/tra-cuu-ho-so`
  - Bàn làm việc cán bộ và quản trị: `http://127.0.0.1:8766/staff`
  - Hướng dẫn thao tác theo vai trò: `http://127.0.0.1:8766/huong-dan`
- **Chế độ phát triển giao diện:** Giữ `python app.py` chạy ở cổng `8766`, sau đó chạy `npm run dev` trong thư mục `frontend/` (Vite chạy tại cổng `5173` và chuyển tiếp `/api` về máy chủ Python).

---

## 2. Tài khoản thực hành và chấm thi (Mật khẩu mặc định: `123`)

Cơ sở dữ liệu `data/hanoi-services.sqlite3` đã chuẩn bị sẵn **705 tài khoản cán bộ/quản trị** cùng tài khoản công dân thực hành để kiểm tra ngay mọi luồng nghiệp vụ:

1. **Tài khoản Công dân thực hành** (đăng nhập tại `/dang-nhap` bằng email và mật khẩu; chưa kết nối VNeID thật):
   - Email: `congdan@example.test`
   - Mật khẩu: `123`
   - Chi tiết xem tại: [TAI_KHOAN_CONG_DAN.md](TAI_KHOAN_CONG_DAN.md).
2. **705 Tài khoản Cán bộ và Quản trị** (đăng nhập tại `/staff`, gồm **79 tài khoản gốc** cấp sở/ngành/trung tâm và **626 tài khoản cho 126 UBND phường, xã** trên địa bàn Hà Nội):
   - Mật khẩu ban đầu: `123` (các tài khoản thực hành không buộc đổi mật khẩu ở lần đăng nhập đầu).
   - Tra cứu danh sách email theo từng vai trò (`intake`, `specialist`, `leader`, `registrar`, `finance`, quản lý cơ quan, `admin`) tại:
     - [Danh sách phân quyền cốt lõi](DANH_SACH_TAI_KHOAN_DUOC_PHAN_QUYEN.md)
     - [Danh sách tài khoản 126 UBND phường, xã Hà Nội](TAI_KHOAN_UBND_CAP_XA_HANOI_2026.md)
     - [Danh sách 79 tài khoản gốc sau khôi phục](TAI_KHOAN_SAU_KHOI_PHUC_20261018.md)
   - Lệnh cấp bổ sung tài khoản cấp xã `python scripts/provision_hanoi_commune_accounts.py` có tính bất biến (giữ nguyên các tài khoản đã tồn tại). Người vận hành có thể tạo thêm quản trị viên qua `python app.py create-admin`.

---

## 3. Các chức năng nghiệp vụ trọng tâm đã hiện thực

Hướng dẫn thao tác theo từng tài khoản, các bước bàn giao và nhánh xử lý: [Quy trình tương tác nghiệp vụ](QUY_TRINH_NGHIEP_VU_VA_MA_TRAN_TUONG_TAC.md).

### 3.1. Cổng dịch vụ công và Không gian công dân số (`/tai-khoan`)
- **Danh mục 2.075 thủ tục tham chiếu:** Tra cứu theo lĩnh vực, cấp thực hiện, cơ quan tiếp nhận; xem chi tiết trình tự, thành phần hồ sơ, phí/lệ phí, căn cứ pháp lý và tải mẫu đơn gốc công bố (`/thu-tuc/<mã>`).
- **Nộp hồ sơ trực tuyến 5 bước & Lưu nháp:** Cấu hình tờ khai tương tác tinh gọn tại `procedure_forms.json` (`2.000908` cấp bản sao trích lục hộ tịch tại 126 UBND xã/phường và `1.004237` cung cấp dữ liệu tài nguyên môi trường) cùng luồng nộp hồ sơ công bố (`procedure_workflows.py`, `official_procedure_policy.py`), tự động điền sẵn từ hồ sơ cá nhân tự khai (`/tai-khoan/thong-tin-ca-nhan`).
- **Tra cứu hai lớp bảo vệ dữ liệu cá nhân:**
  - Tra cứu nhanh không cần đăng nhập tại `/tra-cuu-ho-so` (`/api/public/status-check`): chỉ hiển thị trạng thái, thủ tục, cơ quan và hạn giải quyết, ẩn toàn bộ thông tin định danh cá nhân (PII).
  - Tra cứu chi tiết và thao tác trực tuyến dành cho chủ tài khoản công dân hoặc người có khóa tra cứu 64 ký tự hex.
- **Kho tài liệu điện tử & Tiện ích công dân:** Quản lý tệp đã nộp, nhận **tệp kết quả giải quyết điện tử** sinh tự động ngay khi cơ quan phát hành, nộp bổ sung hồ sơ, gửi yêu cầu rút/dừng hồ sơ trực tuyến (**Mẫu 05**), đặt lịch hẹn quầy Một cửa (tối đa 10 lượt/khung giờ/cơ quan), gửi phản ánh kiến nghị (PAKN) và đánh giá mức độ hài lòng (1-5 sao).

### 3.2. Quy trình Một cửa không điểm bế tắc và Trọn bộ Biểu mẫu 01-06 kèm mã QR
- **Máy trạng thái 12 trạng thái không bế tắc (Deadlock-free):** Hỗ trợ đầy đủ luân chuyển xuôi và hoàn trả có căn cứ (`return_to_intake` trả lại bộ phận tiếp nhận, `send_back` lãnh đạo yêu cầu sửa dự thảo trước khi ký, `return_to_leader` văn thư trả lại rà soát trước phát hành, `decline` kết luận `KHONG_GIAI_QUYET` khi không đủ điều kiện chuyên ngành, `close_expired_supplement` đóng hồ sơ quá hạn bổ sung), kết hợp kiểm soát đồng thời lạc quan `expectedVersion` (HTTP `409`).
- **Trọn bộ 06 biểu mẫu nghiệp vụ Một cửa tích hợp mã QR tra cứu:**
  - **Mẫu 01:** Giấy tiếp nhận hồ sơ và hẹn trả kết quả (trực tuyến và tại quầy).
  - **Mẫu 02:** Phiếu yêu cầu bổ sung, hoàn thiện hồ sơ (kiểm soát tối đa 01 lần đầu vào và 01 lần trong quá trình thụ lý).
  - **Mẫu 03:** Phiếu từ chối tiếp nhận giải quyết hồ sơ.
  - **Mẫu 04:** Phiếu xin lỗi và hẹn lại ngày trả kết quả khi gia hạn thời hạn giải quyết (`extend_deadline`).
  - **Mẫu 05:** Phiếu yêu cầu rút/dừng thực hiện thủ tục (hỗ trợ cả nộp trực tuyến trên cổng và tiếp nhận tại quầy/bưu chính).
  - **Mẫu 06:** Thông báo dừng thực hiện thủ tục (hồ sơ giữ nguyên trạng thái đang xử lý khi chờ duyệt dừng và chỉ chuyển sang `DUNG` sau khi lãnh đạo có thẩm quyền ký phát hành).
- **Tính hạn giải quyết (SLA) theo ngày làm việc:** Áp dụng `working_calendar.json`, quy tắc cắt giờ 15:00 đối với thủ tục trong ngày (`2.000908`), tạm dừng và tự động cộng bù số ngày làm việc chờ người dân bổ sung hoặc hoàn thành nghĩa vụ phí.

### 3.3. Tài chính 4 mắt, Chữ ký Ed25519, Phân quyền RBAC và Báo cáo Bộ chỉ số 766
- **Cô lập 8 vai trò & phạm vi cơ quan (`agency_scope`):** Mọi tài khoản cán bộ chỉ truy cập đúng đơn vị mình; `finance` bị ẩn thông tin cá nhân và tệp tờ khai; `admin` quản trị tài khoản/danh mục/tin tức và xem báo cáo tổng hợp nhưng bị chặn tuyệt đối đọc chi tiết, tải tệp hoặc xuất CSV hồ sơ cá nhân. Cấp mới hoặc đổi quyền cán bộ bắt buộc phê duyệt độc lập (nguyên tắc 4 mắt).
- **Đối soát thu phí & Hoàn phí kiểm soát 4 mắt:** Tách bạch các bước tạo giao dịch (`PENDING`), người nộp khai chứng từ (`PAID`), kế toán đối soát (`RECONCILED`), lập đề nghị hoàn, người thứ hai phê duyệt hoàn độc lập (`APPROVED`/`REJECTED`) và ghi nhận chứng từ chi hoàn (`EXECUTED` -> `REFUNDED`).
- **Ký kết quả thử nghiệm Ed25519 & Phát hành điện tử:** Quản trị viên cấp riêng quyền ký thử nghiệm cho lãnh đạo; chữ ký Ed25519 bảo vệ toàn vẹn nội dung dự thảo đã duyệt (nếu đơn vị có nhiều lãnh đạo thì tách người duyệt và người ký; nếu chỉ có 01 lãnh đạo hoạt động thì lãnh đạo đó được phép ký sau khi được cấp quyền). Khi văn thư phát hành (`issue`), hệ thống tự động tạo tệp kết quả điện tử đồng bộ sang kho tài liệu của công dân.
- **Báo cáo điều hành Bộ chỉ số 766 & Cân đối kỳ:** Tích hợp đo lường 5 nhóm chỉ tiêu theo **Quyết định 766/QĐ-TTg** (công khai minh bạch, tiến độ giải quyết, dịch vụ trực tuyến, số hóa hồ sơ, mức độ hài lòng) và bảng cân đối hồ sơ theo kỳ báo cáo theo **Thông tư 09/2026/TT-BTP** (`kỳ trước chuyển sang + tiếp nhận trong kỳ = đã giải quyết + đang giải quyết cuối kỳ`), phân biệt rõ dữ liệu tình huống mô phỏng với hồ sơ phát sinh thực tế.

---

## 4. Kiến trúc lưu trữ, Bảo mật và Bộ tài liệu đặc tả đồng bộ

- **Cơ sở dữ liệu & Kho khóa mật mã:**
  - SQLite 3 tại `data/hanoi-services.sqlite3` vận hành ở chế độ `WAL` với **30 bảng vật lý** và **25 chỉ mục**.
  - Khóa tra cứu hồ sơ được mã hóa đối xứng Fernet bằng khóa tách rời tại `data/lookup-vault.key`; khóa ký thử nghiệm Ed25519 lưu mã hóa tại `data/sandbox-signing-key.enc` (không đưa các tệp khóa trong `data/` lên Git).
  - Mật khẩu băm `PBKDF2-HMAC-SHA256` (600.000 vòng); phiên đăng nhập tách riêng cookie `hni_session` và `hni_citizen_session` (`HttpOnly`, `SameSite=Strict`) kèm kiểm tra `X-CSRF-Token` (bật thêm `HANOI_COOKIE_SECURE=1` khi chạy sau HTTPS reverse proxy).
- **Bộ tài liệu kỹ thuật đồng bộ 100% với mã nguồn:**
  - Mô hình dữ liệu vật lý 30 bảng: [`Mo_hinh_du_lieu.sql`](Bao_cao_nghien_cuu_Ha_Noi/03_Thiet_ke/Mo_hinh_du_lieu.sql)
  - Từ điển dữ liệu chi tiết: [`Tu_dien_du_lieu.md`](Bao_cao_nghien_cuu_Ha_Noi/03_Thiet_ke/Tu_dien_du_lieu.md) và [`Tu_dien_du_lieu.json`](Bao_cao_nghien_cuu_Ha_Noi/03_Thiet_ke/Tu_dien_du_lieu.json)
  - Đặc tả giao tiếp OpenAPI 3.1.0: [`Giao_tiep_OpenAPI.json`](Bao_cao_nghien_cuu_Ha_Noi/03_Thiet_ke/Giao_tiep_OpenAPI.json) (cốt lõi) và [`Giao_tiep_mo_rong_OpenAPI.json`](Bao_cao_nghien_cuu_Ha_Noi/03_Thiet_ke/Giao_tiep_mo_rong_OpenAPI.json) (mở rộng)
  - Đặc tả 36 Use Case ánh xạ API thực tế: [`10_Dac_ta_use_case_va_API_hien_hanh.md`](Bao_cao_nghien_cuu_Ha_Noi/02_Noi_dung/10_Dac_ta_use_case_va_API_hien_hanh.md)
  - Ma trận 101 kịch bản kiểm thử: [`Kich_ban_kiem_thu.csv`](Bao_cao_nghien_cuu_Ha_Noi/03_Thiet_ke/Kich_ban_kiem_thu.csv)
- **Kiểm thử tự động:** Chạy `python -m unittest discover -s tests -v` cho tầng máy chủ và `npm run build` (gồm kiểm tra kiểu TypeScript `tsc`, `oxlint` và đóng gói Vite) trong thư mục `frontend/`.
