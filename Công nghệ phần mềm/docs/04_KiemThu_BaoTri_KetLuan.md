3.5. Kiểm thử và triển khai phần mềm

3.5.1. Tổng quan về Kiểm thử

Kiểm thử phần mềm là quá trình thực thi chương trình một cách có hệ thống nhằm phát hiện lỗi, đối chiếu kết quả vận hành thực tế của phần mềm với các yêu cầu nghiệp vụ và phi chức năng đã xác định trong tài liệu đặc tả, từ đó bảo đảm sản phẩm đáp ứng điều kiện chất lượng trước khi bàn giao.

Trong quy trình phát triển hệ thống TalentConnect, kiểm thử không tách rời ở giai đoạn cuối mà được thực hiện xuyên suốt qua từng vòng phát triển của mô hình Xoắn ốc: từ kiểm tra ràng buộc dữ liệu và phân quyền ở vòng thứ nhất, kiểm tra tìm kiếm và tạo hồ sơ ở vòng thứ hai, đến kiểm tra tích hợp quy trình ứng tuyển, xử lý ứng viên và an toàn thông tin ở vòng thứ ba.

3.5.2. Quá trình kiểm thử

Theo đúng lý thuyết học phần Công nghệ phần mềm, nhóm triển khai kết hợp chặt chẽ hai phương pháp kiểm thử phần mềm cơ bản gồm phương pháp kiểm thử hộp trắng và phương pháp kiểm thử hộp đen. Đối với phương pháp kiểm thử hộp trắng, nhóm kiểm tra cấu trúc mã lệnh bên trong và các nhánh điều kiện rẽ nhánh của các hàm xử lý cốt lõi như hàm tính tỷ lệ khớp kỹ năng theo trọng số ưu tiên, hàm kiểm tra quyền sở hữu bản hồ sơ và tồn tại đơn ứng tuyển hợp lệ trước khi mở tệp PDF, cùng khối giao dịch kiểm tra chống nộp đơn trùng trên cơ sở dữ liệu, kết hợp kiểm thử tích hợp tự động 47 điểm cuối dịch vụ máy chủ bằng công cụ Postman. Đối với phương pháp kiểm thử hộp đen, nhóm đứng trên góc nhìn của người sử dụng cuối để kiểm tra các chức năng qua giao diện màn hình dựa trên kỹ thuật phân vùng tương đương và phân tích giá trị biên (như kiểm tra mật khẩu tối thiểu 8 ký tự, khoảng lương hợp lệ, giới hạn tệp PDF tối đa 5 MB tại màn hình MH04 và phản hồi tại các màn hình ngoại lệ từ MH08 đến MH10). Môi trường thử nghiệm được thiết lập độc lập trên máy chủ phát triển nội bộ chạy Node.js và Hệ quản trị cơ sở dữ liệu Microsoft SQL Server 2022.

Bảng 3.39: Thống kê kết quả kiểm thử tự động giao diện lập trình máy chủ

| Nhóm chức năng API | Điểm cuối dịch vụ | Phương thức | Số ca kiểm thử | Tỷ lệ đạt (%) | Thời gian TB | Đánh giá chất lượng |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Xác thực & Định danh | /api/v1/auth/login<br>/api/v1/auth/register<br>/api/v1/auth/refresh | POST | 8 | 100% | 38.4 ms | Đạt yêu cầu xác thực và phiên |
| Tin tuyển dụng & Tìm kiếm | /api/v1/jobs/search<br>/api/v1/jobs/{id}<br>/api/v1/jobs/create | GET, POST | 12 | 100% | 52.1 ms | Đạt yêu cầu truy vấn và lọc |
| Hồ sơ trực tuyến & Gợi ý việc làm | /api/v1/resumes/export-pdf<br>/api/v1/jobs/recommendations | GET, POST | 9 | 100% | 85.6 ms | Đạt yêu cầu xuất PDF và gợi ý |
| Ứng tuyển & Xử lý hồ sơ | /api/v1/applications/apply<br>/api/v1/applications/{id}/status | POST, PUT | 11 | 100% | 44.2 ms | Đạt yêu cầu lưu đơn và trạng thái |
| Quản trị hệ thống | /api/v1/admin/users<br>/api/v1/admin/audit-logs | GET, PUT | 7 | 100% | 35.0 ms | Đạt yêu cầu kiểm soát phân quyền |
| Tổng hợp toàn bộ hệ thống | Toàn bộ điểm cuối máy chủ | Tất cả | 47 | 100% | 46.8 ms | Đạt yêu cầu thiết kế (< 200ms) |

[[IMAGE: assets/diagrams/hinh_3_19_testing_api.png | Caption: Hình ảnh 3.5.2.a. Kết quả thực thi kiểm thử tích hợp tự động các điểm cuối API.]]

Song song với kiểm thử tự động tầng dịch vụ máy chủ, nhóm kiểm thử hộp đen chi tiết trên các luồng nghiệp vụ người dùng. Dưới đây là ma trận các kịch bản kiểm thử đại diện cho các chức năng trọng yếu của hệ thống:

Bảng 3.40: Kịch bản kiểm thử phân hệ Xác thực và Quản trị tài khoản

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| KT-01 | Đăng ký với thư điện tử đã tồn tại | Kiểm tra tính duy nhất của tài khoản trên hệ thống | Thư điện tử: nghiem@gmail.com, Mật khẩu: Matkhau@123 | 1. Mở trang đăng ký<br>2. Nhập thông tin tài khoản<br>3. Bấm Đăng ký | Hệ thống từ chối đăng ký, hiển thị thông báo Thư điện tử đã được sử dụng | Hiển thị cảnh báo màu đỏ đúng thông báo mong đợi | Đạt |
| KT-02 | Đăng ký với mật khẩu yếu | Kiểm tra ràng buộc độ an toàn của mật khẩu | Thư điện tử: user_moi@gmail.com, Mật khẩu: 12345 | 1. Mở trang đăng ký<br>2. Nhập mật khẩu dưới tám ký tự<br>3. Bấm Đăng ký | Hệ thống chặn thao tác, yêu cầu mật khẩu tối thiểu tám ký tự gồm chữ hoa, thường và số | Hệ thống chặn và hiển thị hướng dẫn bảo mật | Đạt |
| KT-03 | Đăng nhập với mật khẩu sai | Kiểm tra cơ chế chống đăng nhập trái phép | Thư điện tử: admin@talentconnect.vn, Mật khẩu: SaiMatKhau | 1. Mở trang đăng nhập<br>2. Nhập thông tin<br>3. Bấm Đăng nhập | Hệ thống không cấp phiên, hiển thị thông báo Tài khoản hoặc mật khẩu không chính xác | Không đăng nhập được, hiển thị thông báo chính xác | Đạt |

Bên cạnh các kịch bản kiểm thử chức năng cơ bản, phân hệ Xác thực và Quản trị tài khoản còn được kiểm tra về khả năng phòng vệ trước các hành vi truy cập trái phép và tấn công phổ biến trên ứng dụng web:

Bảng 3.41: Thống kê phân tích kiểm thử an toàn và bảo mật tài khoản

| Mã KT | Loại hình an ninh | Kịch bản thử nghiệm tấn công | Cơ chế phòng vệ của hệ thống | Phản hồi đo đạc thực tế | Mức độ an toàn |
| :--- | :--- | :--- | :--- | :--- | :---: |
| BM-01 | Chống dò quét mật khẩu | Thử đăng nhập sai mật khẩu liên tiếp 5 lần trong 60 giây | Giới hạn tần suất yêu cầu và tạm khóa đăng nhập 15 phút | HTTP 429 Too Many Requests, tạm khóa yêu cầu từ địa chỉ IP | Đạt yêu cầu |
| BM-02 | Chống tiêm mã độc SQL | Nhập chuỗi ký tự thoát ' OR '1'='1' -- vào biểu mẫu | Áp dụng truy vấn tham số hóa qua thư viện mssql | Xử lý chuỗi văn bản thuần, không lỗi cú pháp SQL | Đạt yêu cầu |
| BM-03 | Chống truy cập trái quyền | Thay đổi mã định danh số nguyên (CandidateID, ApplicationID) trên đường dẫn yêu cầu để truy cập hồ sơ hoặc đơn của tài khoản khác | Hệ thống lấy danh tính từ phiên đăng nhập JWT và kiểm tra quyền sở hữu bản hồ sơ hoặc tin tuyển dụng | Từ chối truy xuất trái phép, trả về HTTP 403 Forbidden | Đạt yêu cầu |
| BM-04 | Chống chiếm quyền phiên | Chèn mã kịch bản <script> vào trường dữ liệu nhập | Làm sạch dữ liệu đầu vào với DOMPurify, cấu hình HttpOnly và SameSite=Strict | Mã kịch bản bị loại bỏ, bảo vệ nguyên vẹn phiên đăng nhập | Đạt yêu cầu |

[[IMAGE: assets/diagrams/hinh_3_5_2_b_test_auth.png | Caption: Hình ảnh 3.5.2.b. Kiểm thử chức năng xác thực, phân quyền và bảo mật tài khoản.]]

Bảng 3.42: Kịch bản kiểm thử phân hệ Tạo lập hồ sơ và Quản lý tin tuyển dụng

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| KT-04 | Đăng tin có mức lương tối đa nhỏ hơn mức tối thiểu | Kiểm tra tính hợp lý của khoảng lương | Mức lương tối thiểu: 20,000,000, Mức lương tối đa: 15,000,000 | 1. Vào biểu mẫu Đăng tin<br>2. Nhập lương tối thiểu lớn hơn tối đa<br>3. Bấm Gửi duyệt | Hệ thống cảnh báo Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu | Hệ thống xuất hiện viền đỏ cảnh báo tại ô lương tối đa | Đạt |
| KT-05 | Đăng tin với hạn nộp trong quá khứ | Kiểm tra tính hợp lệ của thời hạn nhận đơn | Ngày hết hạn: Ngày hôm qua so với thời điểm đăng | 1. Chọn ngày hết hạn trong quá khứ<br>2. Bấm Gửi duyệt | Hệ thống ngăn chặn việc lưu tin và yêu cầu chọn ngày trong tương lai | Hệ thống chặn lưu và yêu cầu chọn lại ngày | Đạt |
| KT-06 | Xuất hồ sơ trực tuyến sang tệp PDF | Kiểm tra tính năng tạo tệp PDF hồ sơ | Dữ liệu lý lịch của Nguyễn Minh Anh đã điền đầy đủ, chọn mẫu trình bày | 1. Mở công cụ tạo hồ sơ<br>2. Nhập dữ liệu<br>3. Nhấn Xuất tệp PDF | Hệ thống tạo tệp CV_MinhAnh_Frontend_2026.pdf khổ A4, giữ đúng bố cục và tiếng Việt | Tệp PDF tải về hiển thị rõ ràng, đầy đủ thông tin tiếng Việt | Đạt |

Bảng 3.43: Thống kê đo lường hiệu năng và độ chính xác phân hệ Hồ sơ & Tin tuyển dụng

| Chỉ số đo lường kỹ thuật | Phương pháp kiểm thử | Tiêu chuẩn cam kết | Kết quả đo đạc thực tế | Mức độ tối ưu |
| :--- | :--- | :---: | :---: | :---: |
| Tốc độ kết xuất hồ sơ PDF | Thực thi công cụ tạo tệp PDF khổ A4 | < 1,500 mili-giây | 320 - 450 mili-giây | Đạt yêu cầu |
| Dung lượng tệp PDF tạo ra | Kiểm tra kích thước tệp PDF xuất từ mẫu hồ sơ | < 5,000 KB / tệp | 184 KB / tệp | Đạt yêu cầu |
| Độ chuẩn xác phông chữ tiếng Việt | Kiểm tra bảng mã Unicode dựng sẵn UTF-8 | 100% không lỗi ký tự | 100% hiển thị chuẩn nét | Đạt yêu cầu |
| Tính mức khớp kỹ năng gợi ý (MatchScore) | Đối chiếu mã kỹ năng ứng viên với trọng số kỹ năng yêu cầu của tin | Đúng công thức trọng số và liệt kê đúng kỹ năng thiếu | Khớp 100% với kết quả tính kiểm tra (VD: 7/8 trọng số = 87,5%, hiển thị 88%) | Đạt yêu cầu |
| Tốc độ lọc danh sách việc làm | Kiểm tra truy vấn lọc đa điều kiện trên bộ dữ liệu thử nghiệm | < 300 mili-giây | 65 mili-giây | Đạt yêu cầu |

[[IMAGE: assets/diagrams/hinh_3_5_2_c_test_job_cv.png | Caption: Hình ảnh 3.5.2.c. Kiểm thử chức năng tạo hồ sơ PDF, đăng tin tuyển dụng và đối chiếu kỹ năng.]]

Bảng 3.44: Kịch bản kiểm thử phân hệ Tìm kiếm, Ứng tuyển và Quản lý ứng viên

| Mã kịch bản | Tên ca kiểm thử | Mục đích kiểm tra | Dữ liệu đầu vào | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| KT-07 | Tìm kiếm kết hợp đa tiêu chí | Kiểm tra tính chính xác của câu truy vấn lọc | Từ khóa: Frontend Developer, Địa điểm: Hà Nội, Lương tối thiểu: 14 triệu, Hình thức: Toàn thời gian | 1. Nhập từ khóa và địa điểm<br>2. Chọn điều kiện lọc và nhấn Áp dụng bộ lọc | Trả về danh sách chỉ gồm các tin đang hoạt động, còn hạn và thỏa mãn đồng thời các điều kiện đã chọn (MH01) | Danh sách lọc chính xác các tin phù hợp và giữ nguyên nhãn điều kiện | Đạt |
| KT-08 | Thử nghiệm tiêm mã lệnh độc hại vào ô tìm kiếm | Kiểm tra khả năng chống tấn công SQL Injection | Từ khóa: ' OR '1'='1' -- | 1. Nhập chuỗi ký tự vào ô tìm kiếm<br>2. Nhấn Tìm kiếm | Hệ thống xử lý chuỗi dưới dạng văn bản thuần, không xảy ra lỗi cơ sở dữ liệu | Không phát sinh lỗi hệ thống, hiển thị màn hình không có kết quả phù hợp (MH08) | Đạt |
| KT-09 | Nộp hồ sơ ứng tuyển lần đầu | Kiểm tra chức năng nộp đơn hợp lệ | Ứng viên CandidateID = 17, tin JobID = 241, bản hồ sơ ResumeID = 41 (CV_MinhAnh_Frontend_2026.pdf) | 1. Bấm Ứng tuyển ngay tại MH02<br>2. Chọn hồ sơ ở MH03, kiểm tra ở MH06<br>3. Tích đồng ý và bấm Xác nhận gửi hồ sơ | Lưu bản ghi vào bảng Applications với trạng thái Submitted (Đã gửi hồ sơ), cấp mã đơn TC-000381 và mở MH07 | Đơn được lưu thành công, hiển thị MH07 với mã TC-000381 và gửi thông báo cho doanh nghiệp | Đạt |
| KT-10 | Nộp hồ sơ trùng lặp vào cùng một bài đăng | Kiểm tra cơ chế chống nộp đơn trùng đang xử lý | Ứng viên CandidateID = 17 gửi lại hồ sơ cho tin JobID = 241 khi đơn TC-000381 đang xử lý | 1. Mở lại tin đã nộp<br>2. Chọn hồ sơ và nhấn Xác nhận gửi hồ sơ | Hệ thống phát hiện đã có đơn đang xử lý, không tạo đơn mới, hiển thị hộp thông báo MH09 kèm mã đơn TC-000381 và nút Mở đơn đã gửi | Hiển thị đúng màn hình MH09 với thông tin đơn cũ và nút Mở đơn đã gửi, không sinh bản ghi trùng | Đạt |
| KT-11 | Chuyển trạng thái ứng viên trên bảng quản lý | Kiểm tra luồng xử lý hồ sơ của nhà tuyển dụng | Chuyển đơn TC-000381 từ giai đoạn Hồ sơ mới nộp sang Mời phỏng vấn | 1. Mở bảng quản lý ứng viên<br>2. Chuyển thẻ ứng viên sang giai đoạn Mời phỏng vấn<br>3. Xác nhận cập nhật | Trạng thái đơn trong bảng Applications đổi từ Submitted sang Interview, ghi lịch sử vào ApplicationHistories và gửi thông báo cho ứng viên | Trạng thái cập nhật chính xác, lưu lịch sử người thao tác và ứng viên nhận được thông báo | Đạt |

[[IMAGE: assets/diagrams/hinh_3_5_2_d_test_apply_kanban.png | Caption: Hình ảnh 3.5.2.d. Kiểm thử luồng nộp hồ sơ ứng tuyển, bắt lỗi nộp trùng (MH09) và cập nhật giai đoạn ứng viên.]]

Tổng hợp toàn bộ quá trình kiểm thử, nhóm đã thực hiện tổng cộng 100 ca kiểm thử trên toàn hệ thống, bao gồm 47 ca kiểm thử tích hợp tự động các điểm cuối API, 38 ca kiểm thử đơn vị cho các hàm xử lý dữ liệu và 15 ca kiểm thử hộp đen giao diện và bảo mật trọng tâm:

Bảng 3.45: Thống kê tổng hợp độ bao phủ kiểm thử và mức độ khắc phục khiếm khuyết toàn hệ thống

| Phân hệ chức năng phần mềm | Tổng ca kiểm thử | Độ bao phủ | Lỗi phát hiện | Lỗi đã sửa | Tỷ lệ sửa lỗi (%) | Kết luận nghiệm thu |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Xác thực & Quản trị tài khoản | 18 | 92.4% | 4 | 4 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Hồ sơ trực tuyến & Xuất PDF | 22 | 89.6% | 6 | 6 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Tìm kiếm, Gợi ý & Đăng tin tuyển dụng | 26 | 94.1% | 5 | 5 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Ứng tuyển & Quản lý ứng viên | 20 | 91.8% | 3 | 3 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Kiểm duyệt & Thống kê vận hành | 14 | 88.5% | 2 | 2 | 100% | Đạt tiêu chuẩn nghiệm thu |
| Tổng thể toàn bộ dự án phần mềm | 100 | 91.3% | 20 | 20 | 100% | Đủ điều kiện đóng gói & bàn giao triển khai |


3.5.3. Triển khai và Cài đặt

Quy trình đóng gói và triển khai hệ thống TalentConnect được thực hiện qua các bước tuần tự. Trước hết, nhóm chuẩn bị môi trường máy chủ chạy nền tảng Node.js cùng Hệ quản trị cơ sở dữ liệu quan hệ Microsoft SQL Server 2022. Tiếp theo, hệ thống được thiết lập các biến môi trường lưu trữ trong tệp cấu hình riêng (.env), bao gồm chuỗi kết nối cơ sở dữ liệu, giới hạn dung lượng tệp tải lên và khóa bí mật ký JWT. Sau đó, kịch bản khởi tạo cơ sở dữ liệu được thực thi để tạo đồng bộ 28 bảng dữ liệu quan hệ, các ràng buộc khóa ngoại và nạp dữ liệu danh mục ban đầu (vai trò, ngành nghề, kỹ năng chuyên môn). Kế tiếp, mã nguồn tầng giao diện ReactJS được biên dịch sang các tệp tĩnh để giảm dung lượng truyền tải. Cuối cùng, dịch vụ máy chủ được khởi chạy, kiểm tra kết nối với cơ sở dữ liệu và thư mục lưu trữ tệp PDF trước khi mở cổng phục vụ người dùng.

---

3.6. Bảo trì phần mềm

3.6.1. Khái niệm và Vai trò

Bảo trì phần mềm là tập hợp các hoạt động kiểm tra, sửa lỗi, điều chỉnh và nâng cấp hệ thống sau khi đã đưa vào vận hành, nhằm khắc phục các sai sót phát sinh trong thực tế sử dụng, thích ứng với thay đổi của môi trường kỹ thuật và cải thiện chất lượng phục vụ người tìm việc cùng doanh nghiệp.

3.6.2. Các loại hình bảo trì áp dụng

Hoạt động bảo trì hệ thống TalentConnect bao gồm bốn loại hình theo chuẩn công nghệ phần mềm: bảo trì sửa lỗi tập trung xử lý các sai sót về dữ liệu, giao diện hoặc phân quyền phát sinh trong quá trình người dùng thao tác; bảo trì thích nghi cập nhật cấu hình và thư viện để tương thích với các phiên bản mới của trình duyệt web, môi trường Node.js và hệ quản trị cơ sở dữ liệu; bảo trì hoàn thiện tối ưu tốc độ truy vấn tìm kiếm việc làm và cải thiện bố cục, thao tác trên các biểu mẫu theo góp ý thực tế; còn bảo trì phòng ngừa định kỳ rà soát nhật ký thao tác, kiểm tra an toàn thông tin, sao lưu dữ liệu và dọn dẹp các phiên làm việc đã hết hạn.

3.6.3. Phân tích lỗi và Phương án bảo trì cụ thể

Đối với hiện tượng chậm truy vấn khi số lượng tin tuyển dụng và đơn ứng tuyển tăng lên, nguyên nhân xuất phát từ việc thiếu chỉ mục trên các cột thường xuyên dùng để lọc và sắp xếp. Nhóm khắc phục bằng cách bổ sung chỉ mục tìm kiếm trên các cột trạng thái tin, hạn nhận đơn, mã ngành nghề, địa điểm làm việc và áp dụng phân trang ngay tại tầng cơ sở dữ liệu.

Đối với rủi ro tệp hồ sơ tải lên sai định dạng hoặc vượt quá dung lượng cho phép do chỉ kiểm tra phần mở rộng tên tệp ở trình duyệt, nhóm bổ sung bước kiểm tra định dạng MIME và chữ ký tệp PDF ở phía máy chủ, giới hạn dung lượng tối đa 5 MB đúng như thiết kế màn hình MH04 và tự động chuẩn hóa tên tệp lưu trữ trên máy chủ để tránh ghi đè tệp cũ.

Đối với tình huống xung đột trạng thái khi tin tuyển dụng bị đóng trong lúc ứng viên đang chuẩn bị hồ sơ hoặc khi có hai yêu cầu gửi đơn đồng thời, nguyên nhân nằm ở việc kiểm tra trạng thái tin và ghi nhận đơn tách rời nhau. Nhóm xử lý bằng cách gom bước kiểm tra tình trạng tin, kiểm tra đơn trùng và tạo bản ghi đơn mới vào cùng một giao dịch cơ sở dữ liệu, đồng thời giữ nguyên dữ liệu trên biểu mẫu và hiển thị thông báo rõ ràng tại màn hình MH09 hoặc MH10.

Đối với lỗi hiển thị sai dấu tiếng Việt khi xuất tệp PDF từ công cụ tạo hồ sơ trực tuyến do máy chủ thiếu phông chữ Unicode, nhóm nhúng trực tiếp bộ phông chữ chuẩn Unicode tiếng Việt vào công cụ kết xuất PDF để mọi bản hồ sơ xuất ra đều hiển thị rõ nét.

3.6.4. Quy trình thực hiện bảo trì

Quy trình bảo trì phần mềm của hệ thống diễn ra qua năm bước: tiếp nhận phản hồi và phân loại lỗi theo mức độ ảnh hưởng đến dữ liệu và quyền truy cập; tái hiện lỗi trên môi trường thử nghiệm độc lập; phân tích nguyên nhân và chỉnh sửa mã nguồn trên nhánh phát triển riêng; chạy lại bộ kịch bản kiểm thử hồi quy để bảo đảm việc sửa lỗi không làm ảnh hưởng đến các chức năng đã ổn định; và cập nhật phiên bản mới lên máy chủ kèm ghi nhận vào tài liệu kỹ thuật.

<div style="page-break-after: always;"></div>

IV. KẾT LUẬN

4.1. Tóm tắt nội dung

Bài tập lớn học phần Công nghệ phần mềm với đề tài "Quy trình xây dựng Website tuyển dụng và tìm kiếm việc làm TalentConnect" đã hoàn thành đầy đủ các nội dung từ khảo sát, phân tích yêu cầu đến thiết kế, lập trình và kiểm thử dưới sự hướng dẫn của giảng viên ThS. Bùi Thị Thanh.

Nhóm đã vận dụng quy trình phát triển phần mềm theo mô hình Xoắn ốc qua ba vòng lặp có kiểm soát rủi ro, xác định rõ phạm vi nghiệp vụ giữa người tìm việc, nhà tuyển dụng và ban quản trị, mô hình hóa các luồng xử lý bằng biểu đồ ca sử dụng và sơ đồ luồng dữ liệu, thiết kế kiến trúc ba tầng, xây dựng cơ sở dữ liệu quan hệ gồm 28 bảng đạt dạng chuẩn 3, thiết kế chi tiết 22 màn hình giao diện người dùng bao gồm cụm 10 màn hình từ MH01 đến MH10 cho luồng tìm kiếm, gợi ý kỹ năng và nộp hồ sơ ứng tuyển, lập trình các chức năng cốt lõi và kiểm thử 100 kịch bản trên toàn hệ thống.

4.2. Bài học rút ra

Qua 12 tuần làm đề tài, bài học rõ nhất với cả sáu thành viên là giá trị của việc chốt kỹ sơ đồ luồng dữ liệu, cấu trúc 28 bảng cơ sở dữ liệu và các ràng buộc toàn vẹn trước khi bắt tay vào viết mã nguồn, nhờ đó giảm hẳn tình trạng lệch tên trường hoặc phải sửa lại bảng khi ghép nối các phân hệ. Bên cạnh đó, cách chia dự án thành ba vòng xoắn ốc gắn với sản phẩm chạy thử ở từng chặng giúp nhóm phát hiện sớm những điểm bất cập về tốc độ truy vấn, phân quyền xem hồ sơ và bố cục biểu mẫu thay vì dồn rủi ro đến tuần cuối. Ở góc độ thiết kế giao diện, nhóm cũng nhận thấy mỗi màn hình và thông báo lỗi phải giải thích rõ nguyên nhân và giữ lại dữ liệu người dùng vừa nhập, đặc biệt ở các bước tải tệp PDF và xác nhận nộp đơn.

4.3. Hạn chế và hướng phát triển

Do nhóm sáu sinh viên thực hiện dự án trong 12 tuần với các công cụ miễn phí và thử nghiệm trên môi trường máy chủ phát triển nội bộ, hệ thống hiện tập trung giải quyết các luồng nghiệp vụ tuyển dụng, tìm kiếm, đối chiếu kỹ năng theo trọng số và nộp hồ sơ cốt lõi. Các tính năng đòi hỏi hạ tầng bên thứ ba hoặc chi phí vận hành lớn như cổng thanh toán trực tuyến cho gói dịch vụ doanh nghiệp, phòng họp phỏng vấn truyền hình trực tiếp tích hợp sẵn trên trình duyệt và mô hình học máy chuyên sâu phân tích ngữ nghĩa tự động toàn văn bản hồ sơ được giữ ngoài phạm vi học phần. Đây chính là các hướng phát triển tiếp theo để hoàn thiện và mở rộng quy mô hệ thống TalentConnect trong tương lai.

<div style="page-break-after: always;"></div>

V. TÀI LIỆU THAM KHẢO

1. Bùi Thị Thanh (2024), Bài giảng học phần Công nghệ phần mềm, Khoa Khoa học Liên ngành - Ngoại ngữ - Tin học, Học viện Hành chính và Quản trị công.
2. Roger S. Pressman, Bruce R. Maxim (2020), Software Engineering: A Practitioner's Approach, 9th Edition, McGraw-Hill Education.
3. Ian Sommerville (2016), Software Engineering, 10th Edition, Pearson Education.
4. Đặng Văn Đức (2008), Phân tích và thiết kế hướng đối tượng sử dụng UML, Nhà xuất bản Khoa học và Kỹ thuật, Hà Nội.
5. Abraham Silberschatz, Henry F. Korth, S. Sudarshan (2019), Database System Concepts, 7th Edition, McGraw-Hill.
6. Open Web Application Security Project (2021), Top 10 Web Application Security Risks, Tài liệu hướng dẫn an toàn ứng dụng web.
7. Bộ Thông tin và Truyền thông (2023), Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
8. TopCV (2026), *Trang tìm việc Frontend và trang chi tiết công việc*, https://www.topcv.vn/tim-viec-lam-frontend, truy cập ngày 05/10/2026.
9. Indeed (2026), *Applying for a Job on Indeed*, https://support.indeed.com/hc/en-us/articles/204652920-Applying-for-a-Job-Using-a-Resume-File, truy cập ngày 05/10/2026.
10. Nielsen Norman Group, *Ten Usability Heuristics for User Interface Design*, https://www.nngroup.com/articles/ten-usability-heuristics/, truy cập ngày 05/10/2026.
11. W3C Web Accessibility Initiative (WAI), *Notifications and Multi-page Forms Tutorials*, https://www.w3.org/WAI/tutorials/forms/, truy cập ngày 05/10/2026.
