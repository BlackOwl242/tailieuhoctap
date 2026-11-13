# Hướng dẫn tương tác và quy trình xử lý hồ sơ theo tài khoản

Tài liệu này hướng dẫn thao tác trên phiên bản hệ thống trong kho mã. Chức năng xuất hiện tùy vai trò, cơ quan, hiệu lực tài khoản, người được phân công, trạng thái hồ sơ và cấu hình thủ tục. Tên nút có thể thay đổi theo trạng thái; nếu không thấy thao tác, xem mục xử lý vướng mắc cuối tài liệu.

**Phạm vi thực hành:** đăng nhập công dân bằng email và mật khẩu; chưa tích hợp VNeID thật. Thanh toán là ghi nhận chứng từ và đối soát nội bộ, không khẳng định đã kết nối cổng thanh toán. Chữ ký Ed25519 là **ký thử nghiệm cục bộ**, không phải chữ ký số công vụ hay văn bản đã được cơ quan ban hành chính thức. Các mẫu in và dữ liệu thử nghiệm cần được kiểm tra trước khi sử dụng trong nghiệp vụ thực tế.

## 1. Chuẩn bị và nguyên tắc bàn giao

1. Khởi động theo [README](README.md), mở cổng công dân hoặc **Bàn làm việc cán bộ**. Tài khoản thực hành và phạm vi cơ quan xem trong [danh sách tài khoản](DANH_SACH_TAI_KHOAN_DUOC_PHAN_QUYEN.md), [tài khoản cấp xã](TAI_KHOAN_UBND_CAP_XA_HANOI_2026.md) và [tài khoản công dân](TAI_KHOAN_CONG_DAN.md). Chỉ dùng tài khoản còn hiệu lực và đúng cơ quan; không chia sẻ mật khẩu.
2. Chọn thủ tục có hỗ trợ nộp trực tuyến; kiểm tra cơ quan tiếp nhận, thành phần và yêu cầu cụ thể. Không phải thủ tục nào cũng có cùng bộ bước và điều kiện tài chính.
3. Mỗi lần đổi vai, đăng xuất rồi đăng nhập bằng tài khoản tương ứng. Giữ lại **mã hồ sơ** để tìm đúng hồ sơ qua các bước. Người nộp giữ riêng khóa tra cứu nếu được cấp; không gửi khóa trong kênh công khai.
4. Trên chi tiết hồ sơ, xem trạng thái, người được phân công, phần **Xử lý hồ sơ**, quy trình và nhật ký. Đọc điều kiện, nhập đầy đủ nội dung và lưu trước khi chuyển bước. Nếu có thông báo xung đột phiên bản, tải lại và kiểm tra trạng thái trước khi thao tác tiếp.

## 1A. Thực hành một hồ sơ từ đầu đến cuối: cấp bản sao từ sổ gốc

Kịch bản dưới đây dùng **một hồ sơ mới**, thủ tục **Cấp bản sao từ sổ gốc — 2.000908**, cơ quan ví dụ **UBND phường Tây Hồ**. Đây là dữ liệu thực hành, không phải hồ sơ hay kết quả có giá trị pháp lý. Mã hồ sơ được hệ thống sinh sau khi gửi: trong các bước dưới đây ký hiệu là **[MÃ HỒ SƠ]**; phải dùng chính mã vừa nhận, không gõ nguyên chữ trong ngoặc.

| Vai trò     | Tài khoản thực hành ví dụ       | Việc chính trên cùng hồ sơ                                 |
| ----------- | ------------------------------- | ---------------------------------------------------------- |
| Người dân   | `congdan@example.test`          | Lập, gửi, bổ sung và theo dõi                              |
| Một cửa     | `intake.tayho@example.test`     | Kiểm tra, tiếp nhận, phân công                             |
| Chuyên viên | `specialist.tayho@example.test` | Đối chiếu sổ gốc, lập dự thảo và trình                     |
| Lãnh đạo    | `leader.tayho@example.test`     | Phê duyệt và ký thử nghiệm                                 |
| Văn thư     | `registrar.tayho@example.test`  | Phát hành và ghi nhận trả kết quả                          |
| Tài chính   | `finance.tayho@example.test`    | Chỉ tham gia nếu thực sự phát sinh khoản thu được cấu hình |

Danh sách trên là tài khoản mẫu của dữ liệu thực hành; tài khoản thực tế, hiệu lực và quyền ký cần kiểm tra trên hệ thống. Đăng xuất trước khi đổi vai; dùng mật khẩu được cấp theo tài liệu tài khoản, không giả định mật khẩu ban đầu còn hiệu lực. Có thể chọn cơ quan khác nếu có đủ tài khoản và chuyên viên cùng phạm vi, và cơ quan đó quản lý sổ gốc tương ứng.

### Bước 1 — Người dân tạo và gửi hồ sơ

1. Mở cổng công dân → **Đăng nhập** bằng tài khoản công dân → **Nộp hồ sơ mới**. Ở bước **Thủ tục và cơ quan**, tìm mã `2.000908`, chọn thủ tục và chọn cơ quan đang lưu sổ gốc. Bấm **Tiếp tục**.
2. Ở bước **Người yêu cầu**, kiểm tra thông tin chủ hồ sơ, liên hệ và loại người yêu cầu; khai đúng tư cách, địa chỉ và thông tin bắt buộc. Nếu nộp thay tổ chức, khai người đại diện theo biểu mẫu.
3. Ở bước **Tờ khai**, chọn loại giấy tờ nhận dạng và tư cách yêu cầu; nhập số giấy tờ, tên người/tổ chức được cấp bản chính, tên giấy tờ đề nghị cấp bản sao, cơ quan lưu sổ gốc và số bản sao. Điền số, ngày cấp bản chính và thông tin tra sổ nếu biết. Không dùng dữ liệu định danh thật cho hồ sơ thử nghiệm.
4. Ở bước **Thành phần hồ sơ**, đính kèm giấy tờ nhận dạng. Nếu tư cách không phải người được cấp bản chính, bổ sung giấy tờ chứng minh tư cách đại diện hoặc quan hệ theo yêu cầu trên màn hình; thông tin bản chính là tài liệu tham khảo nếu có. Chọn phương thức nhận kết quả phù hợp.
5. Ở bước **Kiểm tra và gửi**, rà soát các thông tin và tài liệu, gửi hồ sơ. Ghi **[MÃ HỒ SƠ]** và giữ khóa tra cứu được cấp nếu có. Mở **Dịch vụ công của tôi** hoặc **Tra cứu hồ sơ**: hồ sơ mới phải hiển thị trạng thái **Chờ tiếp nhận**. Nếu chưa muốn gửi, dùng chức năng lưu nháp và tiếp tục sau.

### Bước 2 — Một cửa kiểm tra và tiếp nhận

1. Đăng xuất công dân → đăng nhập `intake.tayho@example.test` → **Hộp xử lý hồ sơ**. Tìm **[MÃ HỒ SƠ]**, mở chi tiết; kiểm tra đúng thủ tục, cơ quan và trạng thái **Chờ tiếp nhận**.
2. Trong tab **Tờ khai & Thành phần hồ sơ**, đối chiếu thông tin người yêu cầu, tư cách và tài liệu. Hệ thống chưa tự tra cứu được sổ gốc hoặc cơ sở dữ liệu căn cước; việc đối chiếu thực tế phải do cán bộ thực hiện.
3. Nếu hồ sơ đủ điều kiện tiếp nhận, tại **Xử lý hồ sơ** chọn thao tác tiếp nhận và xác nhận. Kiểm tra trạng thái **Đã tiếp nhận**, thông tin hẹn và chức năng in Mẫu 01. Hạn hiển thị phụ thuộc thời điểm hồ sơ hợp lệ, kết quả đối chiếu và lịch làm việc; kiểm tra trong hồ sơ thay vì tự suy từ thời điểm gửi.
4. Trên chính hồ sơ chọn thao tác **phân công**, chọn chuyên viên thụ lý Tây Hồ đang hoạt động, xác nhận. Kiểm tra người phụ trách, trạng thái **Đang thụ lý** và sự kiện phân công trong **Nhật ký xử lý**. Nếu thiếu hoặc sai tài liệu, xử lý theo nhánh A bên dưới thay vì tiếp nhận ngay.

### Bước 3 — Chuyên viên đối chiếu và trình

1. Đăng xuất → đăng nhập `specialist.tayho@example.test` → **Hộp xử lý hồ sơ** → tìm **[MÃ HỒ SƠ]**. Mở tab **Thẩm định, Tài chính & Kết quả**; xác nhận hồ sơ đã được giao cho mình và đang thụ lý.
2. Trong phần quy trình/chuyển bước, chọn **Ghi kết quả đối chiếu sổ gốc**. Chọn đúng kết quả; nhập **Sổ, trang hoặc bản ghi đã đối chiếu** và **Căn cứ xác định quyền yêu cầu**, rồi lưu/ghi nhận. Với ví dụ đi tiếp nhánh thành công, chọn **Khớp sổ gốc và đủ quyền yêu cầu** sau khi đã đối chiếu dữ liệu thực hành.
3. Trong phần **Dự thảo, Phê duyệt & Phát hành kết quả**, nhập nội dung dự thảo phản ánh kết quả đối chiếu, lưu dự thảo; kiểm tra các điều kiện bắt buộc và thông báo tài chính nếu có. Dự thảo phải có ít nhất 10 ký tự.
4. Chọn thao tác trình lãnh đạo. Kiểm tra trạng thái **Chờ phê duyệt** và nhật ký ghi đã trình. Nếu chọn kết quả không tìm thấy bản ghi hoặc người yêu cầu không đủ quyền, hệ thống chuyển theo nhánh đề xuất không giải quyết; không dùng kết quả khớp chỉ để vượt bước.

### Bước 4 — Lãnh đạo phê duyệt và ký thử nghiệm

1. Đăng xuất → đăng nhập `leader.tayho@example.test` → **Hộp xử lý hồ sơ** → mở **[MÃ HỒ SƠ]** đang chờ phê duyệt. Xem kết quả đối chiếu, căn cứ, dự thảo và điều kiện chuyển bước.
2. Nếu đạt, chọn **Phê duyệt**; kiểm tra trạng thái **Đã phê duyệt**. Sau đó thực hiện riêng thao tác **Ký số nội dung đã duyệt** nếu tài khoản đã được cấu hình quyền ký thử nghiệm. Kiểm tra thông tin và xác minh chữ ký trên hồ sơ trước khi bàn giao.
3. Nếu cần chỉnh sửa, chọn trả lại, nhập ý kiến; chuyên viên mở lại hồ sơ, sửa, lưu và trình lại. Nếu kết luận không đủ điều kiện, lãnh đạo xem xét nhánh **Không giải quyết** với lý do và căn cứ; không tiếp tục như nhánh cấp kết quả.

### Bước 5 — Văn thư phát hành và trả kết quả

1. Đăng xuất → đăng nhập `registrar.tayho@example.test` → tìm **[MÃ HỒ SƠ]** đã phê duyệt. Kiểm tra nội dung đã duyệt và chữ ký thử nghiệm hợp lệ. Nếu có khoản thu được cấu hình, kiểm tra đã đối soát hoặc miễn trước khi phát hành.
2. Chọn **Phát hành kết quả**, nhập số hiệu văn bản kết quả ít nhất 3 ký tự; đính kèm tệp kết quả nếu cần theo màn hình và xác nhận. Kiểm tra trạng thái **Đã phát hành**, số hiệu và tệp kết quả. Nếu chưa có tệp, hệ thống tạo tệp kết quả thử nghiệm.
3. Khi đã có căn cứ giao kết quả, chọn ghi nhận trả kết quả; nhập người nhận, chứng cứ giao/biên nhận và chọn đúng kênh trực tiếp, bưu chính hoặc điện tử thử nghiệm. Xác nhận và kiểm tra **Đã trả kết quả**. Cán bộ Một cửa cũng có thể ghi nhận trả ở bước này nếu được phép.
4. Đăng xuất → công dân đăng nhập lại → mở **Dịch vụ công của tôi**, chọn **[MÃ HỒ SƠ]**, đối chiếu trạng thái, kết quả và lịch sử. Như vậy cùng một mã đã đi qua các tài khoản đến trạng thái cuối.

### Nhánh A — Hồ sơ thiếu giấy tờ

1. Tại bước 2, Một cửa chọn yêu cầu bổ sung, nhập rõ giấy tờ cần bổ sung và căn cứ; kiểm tra Mẫu 02 và trạng thái **Chờ người dân bổ sung**.
2. Đổi sang công dân → mở **[MÃ HỒ SƠ]** → đọc yêu cầu → nhập nội dung và chọn tệp bổ sung → gửi. Kiểm tra lịch sử và trạng thái sau gửi.
3. Đổi lại đúng cán bộ phụ trách → mở cùng mã → kiểm tra tài liệu mới và tiếp tục theo trạng thái hiển thị. Trường hợp yêu cầu trong giai đoạn thụ lý do chuyên viên thực hiện và tiếp tục theo luồng thụ lý; hệ thống giới hạn số lần yêu cầu theo giai đoạn.

### Nhánh B — Có yêu cầu rút hồ sơ

1. Công dân mở cùng hồ sơ khi chức năng còn khả dụng → gửi đề nghị rút Mẫu 05 và theo dõi trạng thái.
2. Một cửa kiểm tra yêu cầu, lập dự thảo thông báo dừng Mẫu 06 theo điều kiện hệ thống; lãnh đạo có thẩm quyền xem xét, ký và phát hành theo các thao tác được mở. Đọc thông báo và nhật ký để xác định đã hoàn tất, không coi việc gửi Mẫu 05 là dừng ngay.
3. Nếu có giao dịch đã đối soát cần hoàn, chuyển tài chính/lãnh đạo xử lý nhánh hoàn phí dưới đây. Nếu hồ sơ đã trả kết quả hoặc không còn đủ điều kiện, không giả định hệ thống cho rút.

### Nhánh C — Khoản thu và hoàn phí (áp dụng khi thủ tục có cấu hình thu)

Thủ tục `2.000908` trong dữ liệu hiện tại **không tự xác định khoản thu**; không tự tạo phí cho ví dụ để thử nhánh này. Có thể thực hành riêng với hồ sơ thủ tục `1.004237` tại cơ quan phù hợp nếu màn hình và cấu hình cho phép, dùng một mã hồ sơ mới.

1. Một cửa hoặc chuyên viên cấu hình khoản thu khi hồ sơ ở trạng thái được phép; ghi số tiền và căn cứ theo công bố/thông báo hợp lệ. Người dân mở khoản thu của đúng hồ sơ, tạo giao dịch và khai hình thức đã nộp cùng mã giao dịch hoặc số biên lai.
2. Tài chính hoặc lãnh đạo vào **Tài chính & Tích hợp**, tìm giao dịch, kiểm tra chứng từ thực tế, nhập tham chiếu và đối soát. Kiểm tra trạng thái giao dịch đã đối soát trước khi phát hành kết quả.
3. Nếu đủ căn cứ hoàn, người có quyền lập đề nghị hoàn, một người khác có quyền phê duyệt/từ chối; sau khi duyệt, ghi chứng từ thực hiện hoàn. Kiểm tra lịch sử giao dịch và chứng từ thực tế. Các thao tác trong ứng dụng không tự chuyển hoặc hoàn tiền.

## 2. Sơ đồ bàn giao chính

| Thứ tự | Người thực hiện | Việc và kết quả bàn giao |
|---|---|---|
| 1 | Công dân/tổ chức | Chọn thủ tục, cơ quan, kê khai, đính kèm và gửi; lưu mã hồ sơ. Hồ sơ chờ tiếp nhận. |
| 2 | Một cửa (`intake`) | Kiểm tra; tiếp nhận và xem/in Mẫu 01, hoặc yêu cầu bổ sung Mẫu 02, hoặc từ chối Mẫu 03 có lý do. |
| 3 | Một cửa hoặc lãnh đạo | Phân công chuyên viên đúng cơ quan trên hồ sơ đã tiếp nhận; chuyên viên nhận hồ sơ thụ lý. |
| 4 | Chuyên viên (`specialist`) | Kiểm tra điều kiện quy trình, lưu dự thảo và trình duyệt; xử lý bổ sung, khoản thu hoặc gia hạn khi phù hợp. |
| 5 | Lãnh đạo (`leader`) | Xem xét, trả lại để sửa hoặc phê duyệt; sau phê duyệt thực hiện ký thử nghiệm nếu đủ thẩm quyền/cấu hình. |
| 6 | Văn thư (`registrar`) | Kiểm tra kết quả đã phê duyệt và chữ ký thử nghiệm hợp lệ; phát hành hoặc chuyển lại lãnh đạo khi cần. |
| 7 | Văn thư hoặc Một cửa | Ghi nhận người nhận, chứng từ và cách trả kết quả; hồ sơ chuyển sang đã trả kết quả. |
| 8 | Công dân/tổ chức | Theo dõi trạng thái, xem kết quả/thông báo và kiểm tra hồ sơ trong tài khoản hoặc mục tra cứu. |

Tài chính (`finance`) và lãnh đạo tham gia nhánh đối soát khi hồ sơ có khoản thu; quản trị (`admin`) duy trì tài khoản, cấu hình và giám sát. Không mặc định mọi hồ sơ đều phát sinh thu phí.

## 3. Thao tác theo từng tài khoản

### 3.1. Công dân, tổ chức

1. Vào **Nộp hồ sơ**, đăng nhập, chọn thủ tục và cơ quan. Đi qua các bước: thủ tục và cơ quan, người yêu cầu, tờ khai, thành phần hồ sơ, kiểm tra và gửi. Có thể lưu nháp vào tài khoản khi cần.
2. Sau khi gửi, ghi lại mã hồ sơ; mở **Dịch vụ công của tôi** hoặc **Tra cứu hồ sơ** để xem tiến độ. Bản tra cứu công khai và thông tin chi tiết có phạm vi truy cập khác nhau.
3. Nếu nhận yêu cầu bổ sung, mở hồ sơ, đọc yêu cầu, nhập nội dung và chọn tài liệu bổ sung rồi gửi. Kiểm tra trạng thái và lịch sử sau khi gửi; nhân viên Một cửa cũng có thể ghi nhận tài liệu bổ sung theo trường hợp tại quầy.
4. Nếu có khoản thu, mở khoản thu, tạo giao dịch và khai hình thức nộp cùng mã giao dịch/số biên lai theo biểu mẫu. Chờ tài chính hoặc lãnh đạo đối soát; khai chứng từ không đồng nghĩa đã đối soát.
5. Khi cần dừng/rút, gửi đề nghị Mẫu 05 trong hồ sơ và theo dõi kết quả xử lý Mẫu 06. Sau khi hoàn tất, kiểm tra kết quả, thông báo, lịch sử và phản ánh/đánh giá nếu giao diện cung cấp.
6. Nếu nộp trực tiếp: cung cấp thông tin và giấy tờ tại quầy; cán bộ lập hồ sơ, tiếp nhận và hướng dẫn tra cứu, nhận kết quả theo kênh đã đăng ký.

### 3.2. Cán bộ tiếp nhận (`intake`)

1. Vào **Hộp xử lý hồ sơ**, lọc hồ sơ chờ tiếp nhận và mở theo mã; đối chiếu thủ tục, cơ quan, người nộp, tờ khai và thành phần.
2. Đủ điều kiện: chọn **Tiếp nhận**, kiểm tra ngày hẹn và Mẫu 01; sau đó phân công chuyên viên thuộc phạm vi cơ quan. Tại quầy, dùng **Quầy một cửa & Lịch hẹn** để lập hồ sơ trực tiếp và ghi nhận tài liệu số hóa thực tế.
3. Thiếu thành phần: chọn yêu cầu bổ sung, nêu rõ nội dung và căn cứ để tạo Mẫu 02. Kiểm tra hồ sơ sau khi người dân bổ sung; hệ thống giới hạn yêu cầu bổ sung theo giai đoạn.
4. Không đủ điều kiện tiếp nhận: chọn từ chối, ghi lý do/căn cứ để tạo Mẫu 03. Không nhầm với kết luận không giải quyết sau thẩm định.
5. Khi có kết quả đã phát hành, phối hợp trả kết quả và ghi nhận người nhận/chứng từ theo phương thức thực tế. Với hồ sơ chờ bổ sung quá hạn, chỉ dùng thao tác đóng khi điều kiện hệ thống cho phép.

### 3.3. Chuyên viên (`specialist`)

1. Mở hồ sơ đã phân công trong **Hộp xử lý hồ sơ**. Kiểm tra điều kiện chuyển bước, tờ khai, thành phần và tài liệu; ghi nhận kết quả kiểm tra theo cấu hình quy trình.
2. Nếu cần, yêu cầu bổ sung trong quá trình giải quyết, hoặc chuyển lại Một cửa kèm lý do để xử lý sai sót đầu vào. Theo dõi hồ sơ quay lại thay vì tạo hồ sơ trùng.
3. Khi thủ tục có căn cứ thu, nhập khoản thu và căn cứ theo công bố; Một cửa cũng có thể cấu hình khoản thu trong trạng thái cho phép. Theo dõi công dân khai chứng từ và cán bộ có quyền đối soát. Không tự xác nhận việc chuyển tiền thực tế nếu chưa có chứng từ.
4. Lưu dự thảo kết quả, hoàn tất các điều kiện bắt buộc rồi **Trình phê duyệt**. Nếu lãnh đạo trả lại, xem ý kiến, chỉnh sửa, lưu và trình lại.
5. Khi cần gia hạn, dùng chức năng Mẫu 04 nếu hồ sơ và điều kiện cho phép; nhập căn cứ, hạn mới và kiểm tra thông báo. Thẩm định không đủ điều kiện thì trình theo nhánh đề xuất không giải quyết để lãnh đạo kết luận.

### 3.4. Lãnh đạo (`leader`)

1. Mở hồ sơ chờ phê duyệt; kiểm tra nội dung thẩm định, dự thảo, khoản thu và ý kiến trước đó.
2. Chưa đạt: trả chuyên viên kèm ý kiến. Đủ điều kiện: **Phê duyệt**, sau đó thực hiện **Ký số kết quả** ở trạng thái đã phê duyệt nếu tài khoản có quyền ký thử nghiệm. Đây là hai thao tác riêng; việc phê duyệt không tự chứng minh đã ký.
3. Đề xuất không giải quyết: xem xét, ghi kết luận/căn cứ hoặc trả lại. Có thể phân công hồ sơ và gia hạn trong trạng thái được phép; miễn/điều chỉnh khoản thu theo điều kiện trên màn hình.
4. Với đề nghị dừng/rút, xem xét Mẫu 06 và chỉ ký khi được cấp thẩm quyền tương ứng. Theo dõi nhánh tài chính nếu có khoản cần hoàn.

### 3.5. Văn thư / trả kết quả (`registrar`)

1. Mở hồ sơ đã phê duyệt. Kiểm tra chữ ký thử nghiệm, nội dung và thông tin phát hành. Nếu cần sửa, chuyển lại lãnh đạo trước khi phát hành.
2. Khi đủ điều kiện, thực hiện **Phát hành kết quả**. Hệ thống kiểm tra chữ ký thử nghiệm và tính toàn vẹn trước bước này.
3. Sau khi phát hành, ghi nhận trả kết quả: phương thức, người nhận và bằng chứng theo yêu cầu. Kiểm tra trạng thái **Đã trả kết quả** và nhật ký. Một cửa cũng có thể thực hiện trả kết quả trong phạm vi cho phép.

### 3.6. Tài chính (`finance`) và lãnh đạo tham gia đối soát

1. Mở **Tài chính & Tích hợp**, tìm khoản thu theo hồ sơ và xem lịch sử giao dịch. Sau khi người nộp khai chứng từ, kiểm tra chứng từ ngoài hệ thống, nhập tham chiếu đối soát và ghi nhận đối soát.
2. Nếu cần hoàn, lập đề nghị và ghi căn cứ. Người khác có quyền xem xét phê duyệt hoặc từ chối; người lập không tự duyệt đề nghị của mình. Sau phê duyệt, ghi chứng từ thực hiện hoàn và kiểm tra lịch sử.
3. Trạng thái trong ứng dụng là ghi nhận nghiệp vụ; việc chuyển tiền, đối chiếu ngân hàng và hoàn tiền thực tế phải được thực hiện/kiểm tra qua kênh tương ứng.

### 3.7. Quản trị hệ thống (`admin`) và người được giao quản lý tài khoản cơ quan

1. Vào phần quản lý tài khoản để kiểm tra vai trò, phạm vi, thời hạn và trạng thái kích hoạt; xử lý yêu cầu cấp quyền theo thẩm quyền. Người được giao quản lý tài khoản cơ quan chỉ quản lý trong phạm vi được phép.
2. Quản trị viên kiểm tra cấu hình tích hợp, thẩm quyền ký thử nghiệm, danh mục và báo cáo; không dùng tài khoản quản trị thay thế các vai trò xử lý hồ sơ. Theo dõi nhật ký, báo cáo, Bộ chỉ số 766 và dữ liệu theo phạm vi hiển thị.
3. Khi tài khoản hết hiệu lực, sai cơ quan hoặc thiếu quyền, điều chỉnh/duyệt theo quy trình quản trị trước khi tiếp tục. Không công bố mật khẩu và khóa thử nghiệm.

## 4. Các nhánh cần khép kín

| Tình huống | Bàn giao và kiểm tra tiếp theo |
|---|---|
| Bổ sung | Một cửa/chuyên viên ghi yêu cầu → người dân hoặc Một cửa gửi bổ sung → người xử lý kiểm tra lại và tiếp tục đúng giai đoạn; kiểm tra Mẫu 02, thời hạn và nhật ký. |
| Trả lại để sửa | Lãnh đạo trả chuyên viên, hoặc văn thư chuyển lại lãnh đạo trước phát hành → đọc ý kiến → sửa, phê duyệt/ký lại theo điều kiện → phát hành. |
| Từ chối / không giải quyết | Một cửa từ chối tiếp nhận bằng Mẫu 03; sau thẩm định, lãnh đạo có thể kết luận không giải quyết. Đọc lý do, thông báo và trạng thái cuối tương ứng. |
| Rút / dừng | Công dân gửi Mẫu 05 → cán bộ xử lý yêu cầu → lãnh đạo có thẩm quyền ký Mẫu 06 theo điều kiện → kiểm tra trạng thái dừng và thông báo; xem nhánh hoàn phí nếu cần. |
| Khoản thu / hoàn | Khai khoản thu → người nộp khai chứng từ → tài chính/lãnh đạo đối soát → nếu cần hoàn, người khác duyệt → ghi chứng từ thực hiện hoàn. Kiểm tra lịch sử và chứng từ thực tế. |
| Quá hạn / gia hạn | Chuyên viên hoặc lãnh đạo xem hạn và điều kiện Mẫu 04, ghi căn cứ, cập nhật hạn khi được phép; kiểm tra lịch sử và thông báo cho người nộp. |

## 5. Kiểm tra sau cùng và xử lý vướng mắc

- Đối chiếu cùng mã hồ sơ ở tài khoản công dân và cán bộ; xem trạng thái cuối, lịch sử, biểu mẫu, thời hạn, kết quả và khoản thu liên quan. Hồ sơ hoàn tất thông thường đi đến **Đã trả kết quả**; hồ sơ từ chối, không giải quyết hoặc dừng có trạng thái kết thúc riêng.
- Không thấy nút: kiểm tra đúng vai trò, cơ quan, thời hạn tài khoản, người được giao, trạng thái và các điều kiện nghiệp vụ. Hồ sơ đang chờ ký/phát hành thông báo dừng có thể chặn thao tác xung đột.
- Chữ ký không hợp lệ hoặc thiếu: lãnh đạo có quyền kiểm tra lại dự thảo và thao tác ký thử nghiệm; văn thư không phát hành khi kiểm tra không đạt.
- Dữ liệu thay đổi bởi người khác: tải lại hồ sơ và xem nhật ký trước khi thao tác lại. Không tạo giao dịch hoặc nộp lại chỉ vì màn hình cũ.
- Xuất báo cáo từ menu **Xuất / In báo cáo**: chọn Excel, PDF hoặc in. Báo cáo là dữ liệu trích xuất theo bộ lọc, không tự trở thành văn bản đã ký ban hành.

Đối chiếu thực hiện: `app.py` (trạng thái, kiểm tra vai trò và chuyển bước), `workflow_extensions.py` (tiếp nhận tại quầy/lịch hẹn), `frontend/src/StaffCaseDetail.tsx`, `frontend/src/StaffAdminModules.tsx`, `frontend/src/CitizenSubmission.tsx` và `frontend/src/CitizenTracking.tsx`. Tài liệu mô tả cách vận hành phần mềm, không thay thế quy trình chính thức của cơ quan hoặc kiểm tra pháp lý của từng thủ tục.
