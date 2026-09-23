3.5. Kiểm thử và triển khai phần mềm

3.5.1. Tổng quan về Kiểm thử

Kiểm thử phần mềm là một tiến trình kỹ thuật có hệ thống nhằm thực thi chương trình với mục đích tìm ra các khiếm khuyết, đánh giá sự phù hợp giữa kết quả hoạt động thực tế của phần mềm so với các yêu cầu đã được xác định trong tài liệu đặc tả ban đầu, và bảo đảm sản phẩm đạt được các chuẩn mực chất lượng trước khi bàn giao cho người sử dụng.

Trong quy trình phát triển hệ thống TalentConnect, kiểm thử không phải là một công đoạn độc lập chỉ diễn ra ở giai đoạn cuối mà là hoạt động xuyên suốt song hành cùng quá trình phát triển qua từng vòng lặp của mô hình Xoắn ốc.

3.5.2. Quá trình kiểm thử

Nhằm bảo đảm tính toàn vẹn, độ tin cậy và sự ổn định của hệ thống TalentConnect trước khi đưa vào vận hành thực tế, đội ngũ kỹ thuật đã triển khai chiến lược kiểm thử đa tầng kết hợp: kiểm thử đơn vị (Unit Testing) với khung Jest, kiểm thử tích hợp tự động cho toàn bộ hệ thống giao diện lập trình máy chủ (API Integration Testing) thông qua công cụ Newman/Postman Runner, và kiểm thử hộp đen đầu-cuối (E2E Testing) trên giao diện người dùng. Môi trường thử nghiệm được thiết lập độc lập (Staging Environment) chạy trên máy chủ Node.js v20.x, hệ quản trị cơ sở dữ liệu Microsoft SQL Server 2022 và cụm bộ nhớ đệm Redis Sentinel.

Bảng 3.38: Thống kê kết quả kiểm thử tự động giao diện lập trình máy chủ (API Testing Metrics)

| Nhóm chức năng API | Điểm cuối (Endpoints) | Phương thức | Số ca kiểm thử | Tỷ lệ đạt (%) | Thời gian TB | Đánh giá chất lượng |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Xác thực & Định danh | `/api/v1/auth/login`<br>`/api/v1/auth/register`<br>`/api/v1/auth/refresh` | POST | 8 | 100% | 38.4 ms | Đạt chuẩn an toàn bảo mật |
| Tin tuyển dụng & Tìm kiếm | `/api/v1/jobs/search`<br>`/api/v1/jobs/{id}`<br>`/api/v1/jobs/create` | GET, POST | 12 | 100% | 52.1 ms | Đạt hiệu năng truy vấn chỉ mục |
| Hồ sơ năng lực & CV ATS | `/api/v1/resumes/export-pdf`<br>`/api/v1/resumes/score-ats` | POST | 9 | 100% | 85.6 ms | Đạt chuẩn xuất PDF vector A4 |
| Ứng tuyển & Phễu ATS | `/api/v1/applications/apply`<br>`/api/v1/ats/stages/move` | POST, PUT | 11 | 100% | 44.2 ms | Đạt toàn vẹn luân chuyển phễu |
| Quản trị hệ thống | `/api/v1/admin/users`<br>`/api/v1/admin/audit-logs` | GET, PUT | 7 | 100% | 35.0 ms | Đạt kiểm soát phân quyền RBAC |
| **Tổng hợp toàn bộ hệ thống** | **Toàn bộ điểm cuối máy chủ** | **Tất cả** | **47** | **100%** | **46.8 ms** | **Đạt xuất sắc chỉ tiêu (SLA < 200ms)** |

Song song với kiểm thử tự động tầng dịch vụ máy chủ, nhóm phát triển đã tiến hành kiểm thử hộp đen chi tiết trên các luồng nghiệp vụ người dùng. Dưới đây là ma trận các kịch bản kiểm thử chi tiết đại diện cho các chức năng trọng yếu của hệ thống:

Bảng 3.39: Kịch bản kiểm thử phân hệ Xác thực và Quản trị tài khoản

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| KT-01 | Đăng ký với thư điện tử đã tồn tại | Kiểm tra tính duy nhất của tài khoản trên hệ thống | Thư điện tử: `nghiem@gmail.com`, Mật khẩu: `Matkhau@123` | 1. Mở trang đăng ký<br>2. Nhập thông tin tài khoản<br>3. Bấm Đăng ký | Hệ thống từ chối đăng ký, hiển thị thông báo Thư điện tử đã được sử dụng | Hiển thị cảnh báo màu đỏ đúng thông báo mong đợi | Đạt |
| KT-02 | Đăng ký với mật khẩu yếu | Kiểm tra ràng buộc độ an toàn của mật khẩu | Thư điện tử: `user_moi@gmail.com`, Mật khẩu: `12345` | 1. Mở trang đăng ký<br>2. Nhập mật khẩu dưới tám ký tự<br>3. Bấm Đăng ký | Hệ thống chặn thao tác, yêu cầu mật khẩu tối thiểu tám ký tự gồm chữ hoa, thường và số | Hệ thống chặn và hiển thị hướng dẫn bảo mật | Đạt |
| KT-03 | Đăng nhập với mật khẩu sai | Kiểm tra cơ chế chống đăng nhập trái phép | Thư điện tử: `admin@talentconnect.vn`, Mật khẩu: `SaiMatKhau` | 1. Mở trang đăng ký<br>2. Nhập thông tin<br>3. Bấm Đăng nhập | Hệ thống không cấp phiên, hiển thị thông báo Tài khoản hoặc mật khẩu không chính xác | Không đăng nhập được, hiển thị thông báo chính xác | Đạt |

Bên cạnh các kịch bản kiểm thử chức năng cơ bản, phân hệ Xác thực và Quản trị tài khoản còn được thẩm định nghiêm ngặt về khả năng phòng vệ trước các cuộc tấn công mạng nguy hiểm:

Bảng 3.40: Thống kê phân tích kiểm thử an toàn và bảo mật tài khoản (Security & Boundary Testing)

| Mã KT | Loại hình an ninh | Kịch bản thử nghiệm tấn công | Cơ chế phòng vệ của hệ thống | Phản hồi đo đạc thực tế | Mức độ an toàn |
| :--- | :--- | :--- | :--- | :--- | :---: |
| BM-01 | Chống dò quét mật khẩu (Brute-force) | Thử đăng nhập sai mật khẩu liên tiếp 5 lần trong 60 giây | Khóa tài khoản tạm thời 15 phút qua Redis Sentinel, gắn Retry-After: 900 | HTTP 429 Too Many Requests, khóa thành công IP | Tuyệt đối an toàn |
| BM-02 | Chống tiêm mã độc SQL (SQL Injection) | Nhập chuỗi ký tự thoát `' OR '1'='1' --` vào form | Áp dụng Parameterized Query và ORM Prisma an toàn | Xử lý chuỗi văn bản thuần, không lỗi cú pháp SQL | Tuyệt đối an toàn |
| BM-03 | Chống truy cập trái quyền (IDOR/BOLA) | Thay đổi định danh UUID người dùng trên URL API | Kiểm tra quyền qua mã thông báo JWT và RBAC Middleware | Từ chối truy xuất trái phép, trả về HTTP 403 Forbidden | Bảo mật cao |
| BM-04 | Chống chiếm quyền phiên (XSS & CSRF) | Chèn mã script độc hại `<script>` vào trường dữ liệu | Kích hoạt DOMPurify, cấu hình HttpOnly và SameSite=Strict | Mã độc bị loại bỏ hoàn toàn, bảo vệ nguyên vẹn Token | Đạt chuẩn OWASP Top 10 |

Bảng 3.41: Kịch bản kiểm thử phân hệ Tạo lập hồ sơ và Quản lý tin tuyển dụng

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| KT-04 | Đăng tin tuyển dụng với mức lương nghịch lý | Kiểm tra tính hợp lý của khoảng lương | Mức lương tối thiểu: `20,000,000`, Mức lương tối đa: `15,000,000` | 1. Vào form Đăng tin<br>2. Nhập lương tối thiểu lớn hơn tối đa<br>3. Bấm Gửi duyệt | Hệ thống cảnh báo Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu | Hệ thống xuất hiện viền đỏ cảnh báo tại ô lương tối đa | Đạt |
| KT-05 | Đăng tin với hạn nộp trong quá khứ | Kiểm tra tính hợp lệ của thời hạn nhận đơn | Ngày hết hạn: Ngày hôm qua so với thời điểm đăng | 1. Chọn ngày hết hạn trong quá khứ<br>2. Bấm Gửi duyệt | Hệ thống ngăn chặn việc lưu tin và yêu cầu chọn ngày trong tương lai | Hệ thống chặn lưu và yêu cầu chọn lại ngày | Đạt |
| KT-06 | Kết xuất hồ sơ trực tuyến sang tệp tài liệu | Kiểm tra tính năng tạo tệp tài liệu chuẩn | Dữ liệu lý lịch đã điền đầy đủ, chọn Mẫu hiện đại | 1. Mở công cụ tạo hồ sơ<br>2. Nhập dữ liệu<br>3. Nhấn Tải tệp tài liệu | Hệ thống tạo tệp tài liệu định dạng chuẩn, giữ nguyên bố cục và phông chữ tiếng Việt | Tệp tải về sắc nét, đầy đủ thông tin tiếng Việt | Đạt |

Bảng 3.42: Thống kê đo lường hiệu năng và độ chính xác phân hệ Hồ sơ & Tin tuyển dụng (Performance & Accuracy Metrics)

| Chỉ số đo lường kỹ thuật | Phương pháp kiểm thử | Tiêu chuẩn cam kết (SLA) | Kết quả đo đạc thực tế | Mức độ tối ưu |
| :--- | :--- | :---: | :---: | :---: |
| Tốc độ kết xuất hồ sơ PDF | Thực thi động cơ Chromium PDF Headless | < 1,500 mili-giây | 320 - 450 mili-giây | Vượt chuẩn SLA 3.3 lần |
| Dung lượng tệp PDF tạo ra | Phân tích kích thước tệp vector khổ chuẩn A4 | < 500 KB / tệp | 184 KB / tệp | Tối ưu hóa băng thông tải |
| Độ chuẩn xác phông chữ tiếng Việt | Kiểm tra bảng mã Unicode dựng sẵn UTF-8 | 100% không lỗi ký tự | 100% hiển thị chuẩn nét | Hoàn hảo không vỡ chữ |
| Độ khớp từ khóa ATS | Thuật toán đối sánh từ khóa kỹ thuật với JD | > 85% từ khóa cốt lõi | 94.2% độ khớp chính xác | Đạt chuẩn ATS quốc tế |
| Tốc độ lọc danh sách việc làm | Đánh giá truy vấn trên 50,000 tin tuyển dụng | < 300 mili-giây | 65 mili-giây | Đáp ứng tức thì thời gian thực |

Bảng 3.43: Kịch bản kiểm thử phân hệ Tìm kiếm, Ứng tuyển và Quản lý phễu

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| KT-07 | Tìm kiếm kết hợp đa tiêu chí | Kiểm tra tính chính xác của câu truy vấn lọc | Từ khóa: `Lập trình viên`, Ngành: `Công nghệ thông tin`, Tỉnh: `Hà Nội` | 1. Nhập từ khóa<br>2. Chọn bộ lọc tương ứng<br>3. Nhấn Tìm kiếm | Trả về danh sách chỉ gồm các việc làm thỏa mãn đồng thời cả ba điều kiện trên | Danh sách lọc chính xác các bài đăng phù hợp | Đạt |
| KT-08 | Thử nghiệm tiêm mã lệnh độc hại vào ô tìm kiếm | Kiểm tra khả năng chống tấn công SQL Injection | Từ khóa: `' OR '1'='1' --` | 1. Nhập chuỗi mã độc vào ô tìm kiếm<br>2. Nhấn Tìm kiếm | Hệ thống xử lý chuỗi dưới dạng văn bản thuần, không xảy ra lỗi cơ sở dữ liệu | Không phát sinh lỗi hệ thống, hiển thị không tìm thấy kết quả | Đạt |
| KT-09 | Nộp hồ sơ ứng tuyển lần đầu | Kiểm tra chức năng nộp đơn hợp lệ | Chọn bài tuyển dụng đang mở, chọn bản lý lịch mặc định | 1. Bấm Ứng tuyển ngay<br>2. Nhập thư giới thiệu<br>3. Bấm Xác nhận nộp | Ghi nhận bản ghi vào cơ sở dữ liệu với trạng thái Đã nộp, hiển thị thông báo thành công | Hồ sơ được ghi nhận tức thì, lịch sử ứng tuyển cập nhật | Đạt |
| KT-10 | Nộp hồ sơ trùng lặp vào cùng một bài đăng | Kiểm tra cơ chế chống nộp đơn liên tiếp | Bài tuyển dụng đã nộp hồ sơ trước đó | 1. Vào lại tin đã nộp<br>2. Thao tác gửi đơn tiếp | Hệ thống đưa ra cảnh báo Bạn đã ứng tuyển vị trí này và chặn gửi đơn | Hệ thống vô hiệu hóa nút nộp và hiển thị cảnh báo | Đạt |
| KT-11 | Chuyển trạng thái ứng viên trên bảng phễu | Kiểm tra luồng chuyển đổi trạng thái của doanh nghiệp | Chuyển thẻ ứng viên từ cột Tiếp nhận sang Hẹn phỏng vấn | 1. Mở bảng phễu quản lý<br>2. Kéo chuyển thẻ ứng viên<br>3. Xác nhận chuyển | Trạng thái trong cơ sở dữ liệu đổi sang Hẹn phỏng vấn và phát sinh thông báo cho ứng viên | Trạng thái cập nhật thành công, ứng viên nhận được thông báo | Đạt |

Bảng 3.44: Thống kê tổng hợp độ bao phủ kiểm thử và mức độ khắc phục khiếm khuyết toàn hệ thống (Test Coverage & Defect Metrics)

| Phân hệ chức năng phần mềm | Tổng ca kiểm thử | Độ bao phủ (Coverage) | Lỗi phát hiện | Lỗi đã sửa | Tỷ lệ sửa lỗi (%) | Kết luận nghiệm thu |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Xác thực & Quản trị tài khoản | 18 | 92.4% | 4 | 4 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Hồ sơ năng lực & CV ATS | 22 | 89.6% | 6 | 6 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Tìm kiếm & Đăng tin tuyển dụng | 26 | 94.1% | 5 | 5 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Ứng tuyển & Bảng phễu ATS | 20 | 91.8% | 3 | 3 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Quản trị viên & Báo cáo số liệu | 14 | 88.5% | 2 | 2 | 100% | Đạt tiêu chuẩn nghiệm thu |
| **Tổng thể toàn bộ dự án phần mềm** | **100** | **91.3%** | **20** | **20** | **100%** | **Đủ điều kiện đóng gói & bàn giao triển khai** |


3.5.3. Triển khai và Cài đặt

Quy trình đóng gói và triển khai hệ thống TalentConnect được thực hiện qua các bước tuần tự và chặt chẽ. Trước hết, đội ngũ kỹ thuật tiến hành chuẩn bị môi trường máy chủ chạy nền tảng Node.js cùng hệ quản trị cơ sở dữ liệu quan hệ SQL Server. Tiếp theo, hệ thống được thiết lập các biến môi trường bảo mật độc lập lưu trữ trong tệp cấu hình chứa thông tin kết nối và khóa bí mật của mã thông báo xác thực. Sau đó, kịch bản dịch chuyển dữ liệu được thực thi để khởi tạo đồng bộ toàn bộ 28 bảng dữ liệu quan hệ và nạp dữ liệu từ điển ban đầu. Kế tiếp, mã nguồn tầng giao diện ReactJS được đóng gói sang các tệp tĩnh nhằm tối ưu hóa dung lượng truyền tải trên mạng. Cuối cùng, máy chủ dịch vụ phía sau được kích hoạt và cấu hình các chính sách tường lửa mạng bảo đảm an toàn trước khi chính thức mở cổng phục vụ người dùng.

---

3.6. Bảo trì phần mềm

3.6.1. Khái niệm và Vai trò

Bảo trì phần mềm là tập hợp toàn bộ các hoạt động điều chỉnh, sửa đổi và nâng cấp hệ thống phần mềm sau khi đã được bàn giao và đưa vào khai thác thực tế, nhằm khắc phục lỗi, thích nghi với môi trường mới và không ngừng nâng cao chất lượng phục vụ.

3.6.2. Các loại hình bảo trì áp dụng

Hoạt động bảo trì hệ thống được chia thành bốn loại hình chiến lược. Thứ nhất là bảo trì sửa lỗi, tập trung xử lý dứt điểm các khiếm khuyết phát sinh trong quá trình vận hành thực tế. Thứ hai là bảo trì thích nghi, thực hiện cập nhật hệ thống bảo đảm tính tương thích hoàn hảo với các phiên bản mới của trình duyệt web và hệ quản trị cơ sở dữ liệu. Thứ ba là bảo trì hoàn thiện, nâng cấp hiệu năng tìm kiếm việc làm và tối ưu hóa tính công thái học của giao diện người dùng theo phản hồi thực tế. Thứ tư là bảo trì phòng ngừa, tiến hành rà soát định kỳ các lỗ hổng an toàn thông tin và cập nhật kịp thời các bản vá bảo mật trên toàn máy chủ.

3.6.3. Phân tích lỗi và Phương án bảo trì cụ thể

Trường hợp thứ nhất là hiện tượng nghẽn hiệu năng truy vấn khi số lượng bài đăng và ứng viên tăng cao. Nguyên nhân của hiện tượng này xuất phát từ việc thiếu vắng cấu trúc chỉ mục trên các cột dữ liệu được tra cứu thường xuyên. Để khắc phục, đội ngũ kỹ thuật triển khai phương án đánh chỉ mục trên các trường tiêu đề công việc, mã ngành nghề, địa điểm làm việc và áp dụng kỹ thuật phân trang truy vấn chặt chẽ.

Trường hợp thứ hai là rủi ro tệp đính kèm chứa mã độc hoặc quá dung lượng. Nguyên nhân của sự cố là do cơ chế kiểm tra định dạng tệp lỏng lẻo phía máy khách. Phương án giải quyết là thiết lập cơ chế thẩm định mã nhị phân tệp tin phía máy chủ, áp dụng trần dung lượng tối đa năm megabyte và tự động đổi tên tệp thành chuỗi ngẫu nhiên duy nhất nhằm phòng chống mã độc xâm nhập.

Trường hợp thứ ba là xung đột trạng thái khi tin tuyển dụng bị đóng trong lúc ứng viên đang nộp đơn. Nguyên nhân của sự cố nằm ở việc thiếu cơ chế giao dịch đồng bộ khi xử lý đơn ứng tuyển. Phương án xử lý là áp dụng giao dịch cơ sở dữ liệu với mức cô lập nghiêm ngặt trong hệ quản trị để kiểm tra chặt chẽ điều kiện trước khi chính thức ghi nhận bản ghi.

Trường hợp thứ tư là lỗi vỡ giao diện và sai phông chữ tiếng Việt khi xuất tệp tài liệu PDF. Nguyên nhân là do bộ phông chữ mặc định của hệ thống máy chủ thiếu bảng mã ký tự tiếng Việt có dấu. Phương án khắc phục là nhúng trực tiếp bộ phông chữ chuẩn quốc tế vào động cơ kết xuất tài liệu số để bảo đảm mọi tài liệu xuất bản đều hiển thị sắc nét và chuẩn xác.

3.6.4. Quy trình thực hiện bảo trì

Quy trình thực hiện bảo trì phần mềm được chuẩn hóa thành một chu trình năm bước chặt chẽ, bắt đầu từ khâu tiếp nhận và phân loại lỗi theo mức độ nghiêm trọng, chuyển sang bước tái hiện lỗi trong môi trường thử nghiệm độc lập, tiếp tục với công tác lập phương án và hiệu chỉnh mã nguồn trên nhánh phát triển riêng biệt, thực hiện kiểm thử hồi quy toàn diện để đảm bảo không làm phát sinh lỗi mới, và kết thúc bằng việc triển khai bản vá lỗi an toàn lên hệ thống máy chủ chính thức.

<div style="page-break-after: always;"></div>

IV. KẾT LUẬN

4.1. Tóm tắt nội dung

Bài tập lớn kết thúc học phần Công nghệ phần mềm với đề tài "Quy trình xây dựng Website tuyển dụng và tìm kiếm việc làm TalentConnect" đã hoàn thành trọn vẹn toàn bộ các mục tiêu nghiên cứu và thực nghiệm theo đúng barem yêu cầu của giảng viên hướng dẫn ThS. Bùi Thị Thanh.

Nhóm đã làm chủ quy trình phát triển phần mềm theo mô hình Xoắn ốc, thực hiện khảo sát hiện trạng thực tế, đặc tả chi tiết các yêu cầu, thiết kế kiến trúc ba tầng vững chắc, xây dựng hệ thống cơ sở dữ liệu quan hệ hoàn chỉnh gồm 28 bảng thực thể đạt chuẩn ba dạng chuẩn, thiết kế giao diện công thái học hiện đại, lập trình các chức năng cốt lõi và kiểm thử toàn diện bảo đảm chất lượng phần mềm.

4.2. Bài học rút ra

Quá trình thực hiện đề tài đã mang lại cho nhóm những bài học thực tiễn sâu sắc. Thứ nhất là bài học về phương pháp tiếp cận có hệ thống: việc phân tích và thiết kế bài bản trước khi lập trình giúp giảm thiểu tối đa rủi ro sửa đổi mã nguồn ở các giai đoạn sau. Thứ hai là bài học về kiểm soát rủi ro và làm việc nhóm: việc phân định trách nhiệm rõ ràng cho từng thành viên và nghiệm thu sản phẩm chạy được sau mỗi chu kỳ giúp nhóm luôn chủ động kiểm soát chất lượng và tiến độ. Thứ ba là bài học về tư duy hướng người dùng: thiết kế giao diện và luồng nghiệp vụ luôn phải lấy sự tiện lợi, an toàn và tính minh bạch thông tin của ứng viên cùng nhà tuyển dụng làm trọng tâm phụng sự.

4.3. Hạn chế và hướng phát triển

Mặc dù đã đạt được các mục tiêu đề ra, hệ thống vẫn còn một số hạn chế nhất định do điều kiện thử nghiệm trên môi trường máy chủ nội bộ và chưa tích hợp cổng thanh toán trực tuyến chính thức. Trong tương lai, hướng phát triển trọng tâm của đề tài là tích hợp trí tuệ nhân tạo để tự động chấm điểm độ tương thích giữa hồ sơ ứng viên và yêu cầu tuyển dụng, phát triển ứng dụng di động đa nền tảng và tích hợp phòng họp trực tuyến phục vụ các buổi phỏng vấn từ xa thuận tiện.

<div style="page-break-after: always;"></div>

V. TÀI LIỆU THAM KHẢO

1. Bùi Thị Thanh (2024), Bài giảng học phần Công nghệ phần mềm, Khoa Khoa học Liên ngành - Ngoại ngữ - Tin học, Học viện Hành chính Quốc gia.
2. Roger S. Pressman, Bruce R. Maxim (2020), Software Engineering: A Practitioner's Approach, 9th Edition, McGraw-Hill Education.
3. Ian Sommerville (2016), Software Engineering, 10th Edition, Pearson Education.
4. Đặng Văn Đức (2008), Phân tích và thiết kế hướng đối tượng sử dụng UML, Nhà xuất bản Khoa học và Kỹ thuật, Hà Nội.
5. Abraham Silberschatz, Henry F. Korth, S. Sudarshan (2019), Database System Concepts, 7th Edition, McGraw-Hill.
6. Open Web Application Security Project (2021), Top 10 Web Application Security Risks, Tài liệu hướng dẫn an toàn ứng dụng web.
7. Bộ Thông tin và Truyền thông (2023), Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
