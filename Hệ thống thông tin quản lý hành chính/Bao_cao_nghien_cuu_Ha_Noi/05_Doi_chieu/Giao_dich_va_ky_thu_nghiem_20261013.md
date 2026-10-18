# Đối chiếu luồng thanh toán và ký kết quả trong bản cài đặt

**Ngày cập nhật:** 13/10/2026  
**Phạm vi:** các thao tác khoản thu, ký kết quả, đối soát, hoàn, phát hành và trả kết quả đang có trong ứng dụng cục bộ.

## 1. Phân biệt mục tiêu nghiệp vụ và khả năng hiện tại

Các Use case UC10, UC16, UC32 và UC33 mô tả mục tiêu nghiệp vụ khi có thẩm quyền, chứng thư số và dịch vụ của cơ quan/nhà cung cấp. Bản ứng dụng đã có những luồng tương tác lưu được dữ liệu, nhưng chỉ ở chế độ `LOCAL_SANDBOX`. Không có kết nối tới Cổng Dịch vụ công quốc gia, ngân hàng, cổng thanh toán hoặc nhà cung cấp chứng thư số. Trạng thái sandbox không phải bằng chứng đã nộp tiền, đã ký văn bản hành chính hay đã hoàn tiền.

## 2. Luồng khoản thu và thanh toán sandbox

1. Cán bộ tiếp nhận, sau khi hồ sơ được tiếp nhận, ghi số tiền nguyên dương và căn cứ/nguồn xác định. Máy chủ từ chối thao tác sai vai trò, trạng thái, số tiền, căn cứ hoặc hồ sơ đã có giao dịch.
2. Người nộp không cần tài khoản. Họ tra cứu hồ sơ bằng mã hồ sơ và khóa tra cứu, chọn **Tạo giao dịch thử nghiệm**. Hệ thống tạo mã giao dịch duy nhất ở trạng thái `PENDING`, gắn với hồ sơ và khoản thu.
3. Người nộp chọn xác nhận sandbox. Hệ thống cập nhật giao dịch thành `PAID`, lưu sự kiện xác nhận và yêu cầu dùng phiên bản hồ sơ hiện hành để ngăn thao tác lặp trên dữ liệu cũ.
4. Cán bộ tài chính có quyền trong phạm vi cơ quan mở mục **Kết nối dịch vụ → Giao dịch, đối soát và hoàn thử nghiệm**, kiểm tra mã, số tiền, căn cứ, hồ sơ và lịch sử; chỉ giao dịch `PAID` mới có thể chuyển thành `RECONCILED`.
5. Nếu hồ sơ đã dừng, bị từ chối/không giải quyết hoặc có Thông báo dừng đã phát hành, cán bộ tài chính có thể lập đề nghị hoàn. Một tài khoản tài chính khác phải duyệt/từ chối, kèm ý kiến; người lập không được tự duyệt. Khi duyệt, giao dịch gốc chuyển `REFUNDED` trong cùng giao dịch cơ sở dữ liệu.

Các trạng thái hiện dùng là `PENDING → PAID → RECONCILED → REFUNDED`; đề nghị hoàn có lịch sử riêng `PENDING → APPROVED/REJECTED`. Hoàn sandbox chỉ đổi sổ nội bộ, không gọi đơn vị thu hoặc chuyển tiền. Quyền tài chính được kiểm tra phía máy chủ, giới hạn theo cơ quan, và nội dung giao dịch có nhật ký.

## 3. Luồng ký, phát hành và trả kết quả sandbox

1. Chuyên viên lập và trình dự thảo; lãnh đạo phê duyệt. Máy chủ ghi tài khoản và thời điểm phê duyệt.
2. Quản trị viên hệ thống cấp riêng quyền ký thử nghiệm cho tài khoản lãnh đạo đang hoạt động, có hiệu lực và có phạm vi cơ quan phù hợp; căn cứ và lý do được lưu. Có thể thu hồi quyền. Đây là quyền sandbox, không phải quyết định bổ nhiệm hoặc cấp chứng thư.
3. Một lãnh đạo được cấp quyền ký nội dung đã duyệt. Người phê duyệt không được tự ký. Khóa Ed25519 của ứng dụng ký thông điệp chuẩn hóa gồm mã hồ sơ, mã thủ tục, nội dung dự thảo, thời điểm phê duyệt và nhãn môi trường. Ứng dụng lưu chữ ký, khóa công khai, mã băm SHA-256, người ký và căn cứ; sau đó xác minh chữ ký khi hiển thị và trước phát hành.
4. Văn thư chỉ có thể phát hành sau khi xác minh chữ ký và khi khoản thu được đối soát hoặc miễn. Số kết quả được lưu ở chế độ thử nghiệm. Chỉnh sửa nội dung đã ký sẽ làm xác minh thất bại; muốn ký lại phải lập, trình duyệt phiên bản mới theo luồng.
5. Sau phát hành, văn thư ghi người nhận, kênh trả và mã chứng cứ giao. Hồ sơ chỉ thành `HOAN_THANH` sau bước ghi nhận này.

Chữ ký hiện gắn với nội dung dữ liệu kết quả đã duyệt, chưa ký lên tệp PDF được phát hành. Khóa riêng sandbox được lưu mã hóa bằng vault cục bộ. Chữ ký Ed25519 này chỉ xác minh tính toàn vẹn trong ứng dụng; không phải chứng thư số công vụ, chữ ký số đủ điều kiện hay xác nhận pháp lý.

## 4. Điểm đối chiếu với tài liệu

- UC10 vẫn giữ yêu cầu nghiệp vụ rằng chữ ký chính thức phải gắn với đúng tệp kết quả. Ghi chú cài đặt tại UC10 nêu rõ phiên bản hiện chỉ ký nội dung chuẩn hóa, không ký PDF.
- UC16 vẫn tách phê duyệt, ký, phát hành và giao kết quả. Ứng dụng đã có các bước cục bộ tương ứng nhưng không phát hành quyết định hành chính thật.
- UC32/UC33 giữ điều kiện tích hợp thực tế về phản hồi nhà cung cấp và dữ liệu đối soát; phần ghi chú hiện trạng mô tả chính xác thao tác sandbox.
- Mục **Kết nối dịch vụ** phải tiếp tục hiển thị riêng trạng thái API/nội bộ với trạng thái tích hợp bên ngoài. Không hiển thị sandbox như kết nối đã hoạt động với Chính phủ, ngân hàng hoặc nhà cung cấp ký số.

## 5. Còn thiếu trước khi triển khai thật

Để thay sandbox bằng dịch vụ thật cần được cơ quan có thẩm quyền xác nhận quy trình và phạm vi; có hợp đồng/API, tài khoản kỹ thuật, khóa và chứng thư theo chuẩn được duyệt; thiết lập môi trường kiểm thử; ký trên tệp kết quả chuẩn; nhận phản hồi có xác thực và xử lý webhook/idempotency; đối soát theo dữ liệu bên thu; quy định người đề nghị/duyệt hoàn; kiểm thử an toàn, bảo vệ dữ liệu, lưu trữ và sao lưu; sau đó nghiệm thu nghiệp vụ. Chưa có các điều kiện này thì không được coi trạng thái local là giao dịch chính thức.

## 6. Tệp hướng dẫn liên quan

- [UC10 — Ký kết quả theo thẩm quyền](../07_Huong_dan/Chuc_nang_dung_chung/UC10.md)
- [UC16 — Phê duyệt và phát hành](../07_Huong_dan/Chuc_nang_dung_chung/UC16.md)
- [UC32 — Thanh toán khoản thu](../07_Huong_dan/Chuc_nang_dung_chung/UC32.md)
- [UC33 — Đối soát thu và hoàn](../07_Huong_dan/Chuc_nang_dung_chung/UC33.md)
