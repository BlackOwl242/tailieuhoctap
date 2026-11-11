# Đối chiếu luồng thanh toán và ký kết quả trong bản cài đặt

**Phạm vi:** các thao tác cấu hình khoản thu, khai nộp phí, đối soát, hoàn phí kiểm soát 4 mắt, ký kết quả thử nghiệm Ed25519, phát hành kết quả điện tử và trả kết quả đang vận hành trong ứng dụng cục bộ.

## 1. Phân biệt mục tiêu nghiệp vụ và chế độ vận hành cục bộ

Các Use Case `UC10`, `UC16`, `UC32` và `UC33` mô tả đầy đủ quy trình kiểm soát nội bộ của cơ quan giải quyết thủ tục hành chính. Trong bản cài đặt cục bộ, toàn bộ luồng dữ liệu vận hành ở chế độ `LOCAL_SANDBOX` trên SQLite 3, không gọi cổng thanh toán ngân hàng/Kho bạc Nhà nước và không kết nối nhà cung cấp chứng thư số công vụ. Trạng thái thử nghiệm dùng để kiểm chứng chặt chẽ phân quyền và toàn vẹn dữ liệu, không thay thế chứng từ thu ngân sách hay văn bản hành chính pháp lý.

## 2. Luồng khoản thu, đối soát và hoàn phí kiểm soát 4 mắt

1. **Cấu hình hoặc miễn khoản thu:** Sau khi hồ sơ được tiếp nhận hợp lệ, cán bộ tiếp nhận (`intake`) cấu hình số tiền và căn cứ thu (`set_fee`) đúng theo chính sách phí của thủ tục (`FIXED` hoặc `CONDITIONAL`; chặn với thủ tục `NO_FEE` như `2.000908`). Trước khi phát sinh giao dịch, lãnh đạo cơ quan (`leader`) có thể quyết định miễn khoản thu kèm căn cứ (`waive_fee`).
2. **Xác thực người nộp và tạo giao dịch:** Chủ hồ sơ đăng nhập tài khoản công dân (`hni_citizen_session`; riêng tra cứu nhanh không đăng nhập tại `/api/public/status-check` chỉ xem tiến độ ẩn PII, không thao tác tài chính), sử dụng mã hồ sơ và khóa tra cứu để tạo giao dịch thử nghiệm (`create_payment`), sinh mã `HN-THU-*` ở trạng thái `PENDING`.
3. **Khai chứng từ nộp tiền:** Người nộp chọn hình thức đã nộp và nhập số biên lai/mã tham chiếu (`confirm_payment`) kèm `expectedVersion`. Giao dịch chuyển sang `PAID` và chờ kế toán kiểm tra.
4. **Đối soát nội bộ:** Cán bộ tài chính (`finance`) hoặc lãnh đạo (`leader`) thuộc đúng cơ quan kiểm tra chứng từ và nhập tham chiếu sổ quỹ/bảng kê (`POST /api/payments/{ref}/reconcile`), chuyển giao dịch từ `PAID` sang `RECONCILED`.
5. **Hoàn phí 2 bước theo nguyên tắc 4 mắt:** Khi hồ sơ kết thúc ở diện `DUNG`, `TU_CHOI`, `KHONG_GIAI_QUYET` (hoặc đã phát hành Thông báo dừng Mẫu 06), quy trình hoàn phí tách thành 3 mốc rõ ràng:
   - Lập đề nghị hoàn (`refund-request`): tạo bản ghi `payment_refunds` ở trạng thái `PENDING`.
   - Phê duyệt độc lập (`refund-review`): một cán bộ tài chính hoặc lãnh đạo khác xem xét duyệt (`APPROVED`) hoặc từ chối (`REJECTED`); máy chủ chặn người lập tự duyệt đề nghị của chính mình.
   - Ghi nhận chi hoàn (`refund-execute`): nhập số ủy nhiệm chi/chứng từ thực hiện hoàn, chuyển đề nghị hoàn sang `EXECUTED` và lúc này giao dịch gốc mới chuyển sang `REFUNDED`.

## 3. Luồng ký thử nghiệm Ed25519, phát hành điện tử và trả kết quả

1. **Thẩm tra, trình và phê duyệt:** Chuyên viên hoàn tất bước kiểm tra chuyên môn, lưu dự thảo và trình duyệt (`submit_review`); lãnh đạo phê duyệt (`approve`), yêu cầu sửa (`send_back`) hoặc kết luận không giải quyết (`decline`).
2. **Cấp quyền ký thử nghiệm độc lập:** Quản trị viên hệ thống (`admin`) cấp hoặc thu hồi thẩm quyền ký thử nghiệm (`sandbox_signing_authorities`) cho tài khoản lãnh đạo đang hiệu lực, kèm số văn bản phân công và lý do.
3. **Ký kết quả Ed25519 (`sign_result`):** Lãnh đạo được cấp quyền ký thực hiện ký trên thông điệp chuẩn hóa gồm mã hồ sơ, mã thủ tục, nội dung dự thảo đã duyệt và thời điểm phê duyệt. Khi cơ quan có nhiều lãnh đạo hoạt động, hệ thống tách biệt người phê duyệt và người ký; trường hợp cơ quan chỉ có duy nhất 01 tài khoản lãnh đạo đang hoạt động thì lãnh đạo đó được phép ký sau khi được quản trị viên cấp quyền ký riêng. Khóa riêng Ed25519 được lưu mã hóa Fernet tại `data/sandbox-signing-key.enc`.
4. **Phát hành sinh tệp kết quả điện tử (`issue`):** Văn thư (`registrar`) chỉ phát hành được sau khi hệ thống xác minh chữ ký Ed25519 hợp lệ và khoản thu (nếu có) đã ở trạng thái `RECONCILED` hoặc `WAIVED`. Khi cấp số phát hành, hệ thống tự động tạo tệp kết quả điện tử gắn mã băm chữ ký vào `result.files`, đồng bộ ngay sang Kho tài liệu điện tử trong không gian công dân (`/api/citizen/documents/{code}/{stored}`). Mọi thay đổi dù 1 byte trên dự thảo đã ký đều làm mất hiệu lực chữ ký và bị chặn phát hành.
5. **Trả kết quả (`deliver`):** Văn thư hoặc cán bộ tiếp nhận ghi nhận người nhận, kênh giao nhận và số biên nhận/vận đơn để chuyển hồ sơ sang `HOAN_THANH`.

## 4. Đối chiếu với tài liệu đặc tả

- Đặc tả Use Case và API hiện hành: [`10_Dac_ta_use_case_va_API_hien_hanh.md`](../02_Noi_dung/10_Dac_ta_use_case_va_API_hien_hanh.md) (`UC10`, `UC11`, `UC16`, `UC32`, `UC33`).
- Hợp đồng giao tiếp OpenAPI 3.1.0: [`Giao_tiep_OpenAPI.json`](../03_Thiet_ke/Giao_tiep_OpenAPI.json) và [`Giao_tiep_mo_rong_OpenAPI.json`](../03_Thiet_ke/Giao_tiep_mo_rong_OpenAPI.json).
- Tài liệu hướng dẫn thao tác: [UC10](../07_Huong_dan/Chuc_nang_dung_chung/UC10.md), [UC16](../07_Huong_dan/Chuc_nang_dung_chung/UC16.md), [UC32](../07_Huong_dan/Chuc_nang_dung_chung/UC32.md), [UC33](../07_Huong_dan/Chuc_nang_dung_chung/UC33.md).
