3.5. Kiểm thử và triển khai phần mềm

3.5.1. Tổng quan về Kiểm thử

Kiểm thử phần mềm là một tiến trình kỹ thuật có hệ thống nhằm thực thi chương trình với mục đích tìm ra các khiếm khuyết, đánh giá sự phù hợp giữa kết quả hoạt động thực tế của phần mềm so với các yêu cầu đã được xác định trong tài liệu đặc tả ban đầu, và bảo đảm sản phẩm đạt được các chuẩn mực chất lượng trước khi bàn giao cho người sử dụng.

Trong quy trình phát triển hệ thống TalentConnect, kiểm thử không phải là một công đoạn độc lập chỉ diễn ra ở giai đoạn cuối mà là hoạt động xuyên suốt song hành cùng quá trình phát triển qua từng vòng lặp của mô hình Xoắn ốc (Spiral Model).

3.5.2. Quá trình kiểm thử

Nhóm áp dụng kết hợp kiểm thử hộp đen trên giao diện người dùng và kiểm thử tích hợp tự động cho toàn bộ hệ thống API máy chủ:

[[IMAGE: assets/diagrams/hinh_3_19_testing_api.png | Caption: Hình ảnh 3.5.2.a. Kiểm thử giao diện và API trên Postman.]]

Dưới đây là ma trận các kịch bản kiểm thử chi tiết đại diện cho các chức năng trọng yếu của hệ thống TalentConnect:

Bảng 3.34: Kịch bản kiểm thử phân hệ Xác thực và Quản trị tài khoản

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| TC-AUTH-01 | Đăng ký với thư điện tử đã tồn tại | Kiểm tra tính duy nhất của tài khoản trên hệ thống | Thư điện tử: `nghiem@gmail.com`, Mật khẩu: `Matkhau@123` | 1. Mở trang đăng ký<br>2. Nhập thông tin tài khoản<br>3. Bấm Đăng ký | Hệ thống từ chối đăng ký, hiển thị thông báo Thư điện tử đã được sử dụng | Hiển thị cảnh báo màu đỏ đúng thông báo mong đợi | Đạt |
| TC-AUTH-02 | Đăng ký với mật khẩu yếu | Kiểm tra ràng buộc độ an toàn của mật khẩu | Thư điện tử: `user_moi@gmail.com`, Mật khẩu: `12345` | 1. Mở trang đăng ký<br>2. Nhập mật khẩu dưới tám ký tự<br>3. Bấm Đăng ký | Hệ thống chặn thao tác, yêu cầu mật khẩu tối thiểu tám ký tự gồm chữ hoa, thường và số | Hệ thống chặn và hiển thị hướng dẫn bảo mật | Đạt |
| TC-AUTH-03 | Đăng nhập với mật khẩu sai | Kiểm tra cơ chế chống đăng nhập trái phép | Thư điện tử: `admin@talentconnect.vn`, Mật khẩu: `SaiMatKhau` | 1. Mở trang đăng nhập<br>2. Nhập thông tin<br>3. Bấm Đăng nhập | Hệ thống không cấp phiên, hiển thị thông báo Tài khoản hoặc mật khẩu không chính xác | Không đăng nhập được, hiển thị thông báo chính xác | Đạt |

Bảng 3.35: Kịch bản kiểm thử phân hệ Tạo lập hồ sơ và Quản lý tin tuyển dụng

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| TC-JOB-01 | Đăng tin tuyển dụng với mức lương nghịch lý | Kiểm tra tính hợp lý của khoảng lương | Mức lương tối thiểu: `20,000,000`, Mức lương tối đa: `15,000,000` | 1. Vào form Đăng tin<br>2. Nhập lương tối thiểu lớn hơn tối đa<br>3. Bấm Gửi duyệt | Hệ thống cảnh báo Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu | Hệ thống xuất hiện viền đỏ cảnh báo tại ô lương tối đa | Đạt |
| TC-JOB-02 | Đăng tin với hạn nộp trong quá khứ | Kiểm tra tính hợp lệ của thời hạn nhận đơn | Ngày hết hạn: Ngày hôm qua so với thời điểm đăng | 1. Chọn ngày hết hạn trong quá khứ<br>2. Bấm Gửi duyệt | Hệ thống ngăn chặn việc lưu tin và yêu cầu chọn ngày trong tương lai | Hệ thống chặn lưu và yêu cầu chọn lại ngày | Đạt |
| TC-CV-01 | Kết xuất hồ sơ trực tuyến sang tệp tài liệu | Kiểm tra tính năng tạo tệp tài liệu chuẩn | Dữ liệu lý lịch đã điền đầy đủ, chọn Mẫu hiện đại | 1. Mở công cụ tạo hồ sơ<br>2. Nhập dữ liệu<br>3. Nhấn Tải tệp tài liệu | Hệ thống tạo tệp tài liệu định dạng chuẩn, giữ nguyên bố cục và phông chữ tiếng Việt | Tệp tải về sắc nét, đầy đủ thông tin tiếng Việt | Đạt |

Bảng 3.36: Kịch bản kiểm thử phân hệ Tìm kiếm, Ứng tuyển và Quản lý phễu

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| TC-SRC-01 | Tìm kiếm kết hợp đa tiêu chí | Kiểm tra tính chính xác của câu truy vấn lọc | Từ khóa: `Lập trình viên`, Ngành: `Công nghệ thông tin`, Tỉnh: `Hà Nội` | 1. Nhập từ khóa<br>2. Chọn bộ lọc tương ứng<br>3. Nhấn Tìm kiếm | Trả về danh sách chỉ gồm các việc làm thỏa mãn đồng thời cả ba điều kiện trên | Danh sách lọc chính xác các bài đăng phù hợp | Đạt |
| TC-SRC-02 | Thử nghiệm tiêm mã lệnh độc hại vào ô tìm kiếm | Kiểm tra khả năng chống tấn công SQL Injection | Từ khóa: `' OR '1'='1' --` | 1. Nhập chuỗi mã độc vào ô tìm kiếm<br>2. Nhấn Tìm kiếm | Hệ thống xử lý chuỗi dưới dạng văn bản thuần, không xảy ra lỗi cơ sở dữ liệu | Không phát sinh lỗi hệ thống, hiển thị không tìm thấy kết quả | Đạt |
| TC-APP-01 | Nộp hồ sơ ứng tuyển lần đầu | Kiểm tra chức năng nộp đơn hợp lệ | Chọn bài tuyển dụng đang mở, chọn bản lý lịch mặc định | 1. Bấm Ứng tuyển ngay<br>2. Nhập thư giới thiệu<br>3. Bấm Xác nhận nộp | Ghi nhận bản ghi vào cơ sở dữ liệu với trạng thái Đã nộp, hiển thị thông báo thành công | Hồ sơ được ghi nhận tức thì, lịch sử ứng tuyển cập nhật | Đạt |
| TC-APP-02 | Nộp hồ sơ trùng lặp vào cùng một bài đăng | Kiểm tra cơ chế chống nộp đơn liên tiếp | Bài tuyển dụng đã nộp hồ sơ trước đó | 1. Vào lại tin đã nộp<br>2. Thao tác gửi đơn tiếp | Hệ thống đưa ra cảnh báo Bạn đã ứng tuyển vị trí này và chặn gửi đơn | Hệ thống vô hiệu hóa nút nộp và hiển thị cảnh báo | Đạt |
| TC-APP-03 | Chuyển trạng thái ứng viên trên bảng phễu | Kiểm tra luồng chuyển đổi trạng thái của doanh nghiệp | Chuyển thẻ ứng viên từ cột Tiếp nhận sang Hẹn phỏng vấn | 1. Mở bảng phễu quản lý<br>2. Kéo chuyển thẻ ứng viên<br>3. Xác nhận chuyển | Trạng thái trong cơ sở dữ liệu đổi sang Hẹn phỏng vấn và phát sinh thông báo cho ứng viên | Trạng thái cập nhật thành công, ứng viên nhận được thông báo | Đạt |

3.5.3. Triển khai và Cài đặt

Quy trình đóng gói và triển khai hệ thống TalentConnect được thực hiện qua các bước:
1. Chuẩn bị môi trường máy chủ chạy Node.js và hệ quản trị cơ sở dữ liệu SQL Server.
2. Cấu hình biến môi trường bảo mật độc lập (.env) chứa thông tin kết nối và khóa bí mật JWT.
3. Chạy kịch bản migration khởi tạo toàn bộ 28 bảng dữ liệu quan hệ và nạp dữ liệu ban đầu.
4. Đóng gói mã nguồn giao diện ReactJS sang các tệp tĩnh tối ưu hóa dung lượng.
5. Khởi chạy máy chủ dịch vụ backend và cấu hình cổng tường lửa mạng.

---

3.6. Bảo trì phần mềm (SOFTWARE MAINTENANCE)

3.6.1. Khái niệm và Vai trò

Bảo trì phần mềm là tập hợp toàn bộ các hoạt động điều chỉnh, sửa đổi và nâng cấp hệ thống phần mềm sau khi đã được bàn giao và đưa vào khai thác thực tế, nhằm khắc phục lỗi, thích nghi với môi trường mới và không ngừng nâng cao chất lượng phục vụ.

3.6.2. Các loại hình bảo trì áp dụng

- Bảo trì sửa lỗi: Xử lý các khiếm khuyết phát sinh trong quá trình vận hành thực tế.
- Bảo trì thích nghi: Cập nhật hệ thống tương thích với phiên bản mới của trình duyệt và hệ quản trị cơ sở dữ liệu.
- Bảo trì hoàn thiện: Nâng cấp hiệu năng tìm kiếm, tối ưu giao diện theo phản hồi người dùng.
- Bảo trì phòng ngừa: Rà soát định kỳ các lỗ hổng an toàn thông tin và cập nhật bản vá bảo mật.

3.6.3. Phân tích lỗi và Phương án bảo trì cụ thể

1. Hiện tượng nghẽn hiệu năng truy vấn khi số lượng bài đăng và ứng viên tăng cao:
- Nguyên nhân: Thiếu chỉ mục trên các cột tìm kiếm thường xuyên.
- Phương án: Đánh chỉ mục Indexing trên JobTitle, CategoryID, WorkingLocation và phân trang truy vấn.

2. Rủi ro tệp đính kèm chứa mã độc hoặc quá dung lượng:
- Nguyên nhân: Kiểm tra lỏng lẻo phía máy khách.
- Phương án: Thẩm định mã nhị phân MIME-type phía máy chủ, giới hạn 5MB và đổi tên tệp ngẫu nhiên UUID.

3. Xung đột trạng thái khi tin tuyển dụng bị đóng trong lúc ứng viên đang nộp đơn:
- Nguyên nhân: Thiếu cơ chế giao dịch đồng bộ.
- Phương án: Áp dụng Transaction trong SQL Server với mức cô lập phù hợp để kiểm tra trạng thái trước khi ghi nhận đơn.

4. Lỗi vỡ giao diện và sai phông chữ tiếng Việt khi xuất tệp tài liệu PDF:
- Nguyên nhân: Bộ phông mặc định máy chủ thiếu bảng mã ký tự tiếng Việt.
- Phương án: Nhúng trực tiếp bộ phông chữ Unicode chuẩn quốc tế vào động cơ kết xuất tệp tài liệu.

3.6.4. Quy trình thực hiện bảo trì

Quy trình 5 bước: Tiếp nhận và phân loại lỗi ➔ Tái hiện lỗi trong môi trường thử nghiệm ➔ Lập phương án sửa mã nguồn trên nhánh riêng ➔ Kiểm thử hồi quy toàn diện ➔ Triển khai bản vá lỗi lên hệ thống chính thức.

<div style="page-break-after: always;"></div>

IV. Kết luận

4.1. Tóm tắt nội dung

Bài tập lớn kết thúc học phần Công nghệ phần mềm với đề tài "Quy trình xây dựng Website tuyển dụng và tìm kiếm việc làm TalentConnect" đã hoàn thành trọn vẹn toàn bộ các mục tiêu nghiên cứu và thực nghiệm theo đúng barem yêu cầu của giảng viên hướng dẫn ThS. Bùi Thị Thanh.

Nhóm đã làm chủ quy trình phát triển phần mềm theo mô hình Xoắn ốc, thực hiện khảo sát hiện trạng thực tế, đặc tả chi tiết các yêu cầu, thiết kế kiến trúc ba tầng vững chắc, xây dựng hệ thống cơ sở dữ liệu quan hệ hoàn chỉnh gồm 28 bảng thực thể đạt chuẩn 3NF, thiết kế giao diện công thái học hiện đại, lập trình các chức năng cốt lõi và kiểm thử toàn diện bảo đảm chất lượng phần mềm.

4.2. Bài học rút ra

- Bài học về phương pháp tiếp cận có hệ thống: Phân tích và thiết kế bài bản trước khi lập trình giúp giảm thiểu tối đa rủi ro sửa đổi mã nguồn ở các giai đoạn sau.
- Bài học về kiểm soát rủi ro và làm việc nhóm: Phân định trách nhiệm rõ ràng cho sáu thành viên và nghiệm thu sản phẩm thử nghiệm chạy được sau mỗi vòng lặp xoắn ốc giúp nhóm luôn chủ động kiểm soát chất lượng và tiến độ.
- Bài học về tư duy người dùng: Thiết kế giao diện và luồng nghiệp vụ luôn phải lấy sự tiện lợi và minh bạch của ứng viên và nhà tuyển dụng làm trọng tâm.

4.3. Hạn chế và hướng phát triển

- Hạn chế: Hệ thống thử nghiệm trên môi trường máy chủ nội bộ, chưa tích hợp cổng thanh toán trực tuyến chính thức.
- Hướng phát triển: Tích hợp trí tuệ nhân tạo để tự động chấm điểm độ tương thích giữa CV và JD (Matching Score), phát triển ứng dụng di động đa nền tảng và tích hợp phòng họp trực tuyến cho các buổi phỏng vấn từ xa.

<div style="page-break-after: always;"></div>

V. Tài liệu tham khảo

1. Bùi Thị Thanh (2024), Bài giảng học phần Công nghệ phần mềm, Khoa Khoa học Liên ngành - Ngoại ngữ - Tin học, Học viện Hành chính Quốc gia.
2. Roger S. Pressman, Bruce R. Maxim (2020), Software Engineering: A Practitioner's Approach, 9th Edition, McGraw-Hill Education.
3. Ian Sommerville (2016), Software Engineering, 10th Edition, Pearson Education.
4. Đặng Văn Đức (2008), Phân tích và thiết kế hướng đối tượng sử dụng UML, Nhà xuất bản Khoa học và Kỹ thuật, Hà Nội.
5. Abraham Silberschatz, Henry F. Korth, S. Sudarshan (2019), Database System Concepts, 7th Edition, McGraw-Hill.
6. Open Web Application Security Project (OWASP) (2021), Top 10 Web Application Security Risks, Tài liệu hướng dẫn an toàn ứng dụng web.
7. Bộ Thông tin và Truyền thông (2023), Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
