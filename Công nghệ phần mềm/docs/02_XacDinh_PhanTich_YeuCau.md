III. Quy trình xây dựng phần mềm

3.1. Xác định yêu cầu hệ thống

3.1.1. Cơ sở lý thuyết và Quy trình thực hiện

Trong công nghệ phần mềm, xác định yêu cầu là giai đoạn mở đầu mang ý nghĩa quyết định sự thành bại của toàn bộ dự án. Đây là quá trình khám phá, phân tích, thu thập và ghi nhận lại các dịch vụ mong đợi mà hệ thống cần cung cấp cùng những ràng buộc vận hành mà hệ thống phải tuân thủ trong môi trường thực tế. Mục tiêu cốt lõi của giai đoạn này là giúp các kỹ sư phần mềm thấu hiểu thấu đáo bài toán nghiệp vụ, từ đó chuyển dịch những mong muốn ban đầu của các bên liên quan thành nền tảng kỹ thuật vững chắc, loại bỏ hoàn toàn các giả định thiếu căn cứ trước khi tiến hành thiết kế và lập trình.

Trong quá trình tiếp cận bài toán xây dựng nền tảng kết nối việc làm TalentConnect, nhóm nhận thấy một số thách thức đặc thù:
Thứ nhất, tính đa dạng và mâu thuẫn về lợi ích giữa các nhóm người dùng: Người tìm việc luôn kỳ vọng sự tiện lợi, nhanh chóng, có công cụ hỗ trợ tạo lập hồ sơ đẹp mắt và nhận được phản hồi kết quả minh bạch. Trong khi đó, nhà tuyển dụng lại đặt nặng yêu cầu sàng lọc hồ sơ chuẩn xác, quản trị ứng viên theo luồng nghiệp vụ tập trung và hạn chế tối đa các hồ sơ ảo. Ban quản trị hệ thống lại quan tâm hàng đầu đến an toàn thông tin, kiểm soát tính xác thực của doanh nghiệp và tuân thủ các quy định pháp luật.
Thứ hai, tính bất định của các tiêu chí tuyển dụng: Yêu cầu về chuyên môn, kỹ năng và mức đãi ngộ biến đổi nhanh chóng theo từng nhóm ngành nghề và quy mô tổ chức, đòi hỏi cấu trúc dữ liệu phải có tính mở và bộ lọc tìm kiếm phải có độ linh hoạt cao.
Thứ ba, nguy cơ về thông tin sai lệch: Tình trạng tin đăng tuyển dụng lừa đảo, đa cấp hoặc thu phí trái phép trên Internet gây tâm lý bất an cho người lao động, đòi hỏi hệ thống phải thiết lập cơ chế kiểm duyệt chặt chẽ ngay từ khâu tiếp nhận thông tin ban đầu.

Để vượt qua các thách thức trên, nhóm đã thiết lập quy trình xác định yêu cầu gồm bốn bước tuần tự:
Bước một, lập kế hoạch khảo sát: Xác định các nhóm đối tượng mục tiêu cần tiếp cận, phân chia câu hỏi khảo sát và xây dựng các biểu mẫu phỏng vấn phù hợp với từng chủ thể.
Bước hai, thu thập thông tin thực tế: Phối hợp đồng thời các phương pháp phỏng vấn sâu cá nhân, phát hành phiếu khảo sát trực tuyến trên diện rộng và phân tích đánh giá các hệ thống tuyển dụng đang hoạt động trên thị trường.
Bước ba, phân loại và tổng hợp yêu cầu: Tập hợp toàn bộ dữ liệu thô, loại bỏ các ý kiến trùng lặp hoặc không khả thi, phân loại thông tin thành các nhóm yêu cầu phần mềm, yêu cầu dữ liệu, yêu cầu phần cứng và yêu cầu con người.
Bước bốn, thẩm định và thống nhất phạm vi: Trao đổi kỹ thuật trong nội bộ nhóm và tham vấn ý kiến giảng viên hướng dẫn để chính thức chốt danh mục phạm vi thực hiện của bài tập lớn.

3.1.2. Phương pháp xác định yêu cầu

Nhằm bảo đảm tính xác thực và khoa học cho hệ thống, nhóm đã kết hợp ba phương pháp nghiên cứu thực nghiệm chính:

a. Phương pháp phỏng vấn chuyên sâu
Nhóm đã tiến hành phỏng vấn trực tiếp ba nhóm đối tượng đại diện cho các chủ thể tham gia vào hệ sinh thái tuyển dụng trên địa bàn thành phố Hà Nội:

| STT | Đối tượng phỏng vấn | Nội dung ghi nhận thực trạng | Mong muốn và Yêu cầu rút ra |
| :--- | :--- | :--- | :--- |
| 1 | Chuyên viên tuyển dụng (Chị Mai Phương - Công ty phần mềm) | Tiếp nhận hồ sơ qua email rất dễ thất lạc, mất nhiều thời gian tải từng CV về xem và nhập thủ công vào Excel, khó theo dõi tiến trình phản hồi ứng viên | Cần trang quản trị tập trung, đăng tin theo mẫu chuẩn, quản lý ứng viên theo các cột trạng thái phễu và gửi email thông báo tự động |
| 2 | Người tìm việc (Bạn Trần Quang - Sinh viên năm cuối) | Rất lúng túng khi tự soạn CV bằng Word, không biết cách trình bày kỹ năng chuyên nghiệp; khi nộp đơn không biết hồ sơ đã được mở xem hay chưa | Cần công cụ tạo CV trực tuyến đẹp mắt theo mẫu chuẩn, và tính năng cập nhật trạng thái ứng tuyển minh bạch theo thời gian thực |
| 3 | Cán bộ kiểm duyệt hệ thống (Anh Hoàng Tuấn - Vận hành cổng thông tin) | Xuất hiện nhiều doanh nghiệp ma đăng tin ảo, tin đa cấp lừa đảo người lao động; rủi ro người dùng tải lên file CV chứa mã độc | Cần cơ chế kiểm duyệt hồ sơ doanh nghiệp qua mã số thuế trước khi cấp quyền đăng tin, và kiểm tra tệp đính kèm an toàn phía máy chủ |

b. Phương pháp điều tra qua phiếu khảo sát trực tuyến
Nhóm đã xây dựng và phát hành phiếu khảo sát trực tuyến tới 150 người tham gia, thu về 142 phiếu trả lời hợp lệ từ sinh viên các trường đại học và người lao động trẻ. Kết quả ghi nhận như sau:
Về phương thức tìm kiếm việc làm ưa thích: 81% người được hỏi ưu tiên sử dụng các website việc làm chuyên biệt nhờ tính tập trung và độ tin cậy cao hơn so với các diễn đàn tự do. Kết quả này khẳng định nhu cầu hiện diện của một nền tảng ứng dụng web tối ưu hóa trên mọi thiết bị.
Về rào cản lớn nhất khi ứng tuyển: 68% người tham gia thừa nhận gặp khó khăn trong việc định dạng và trình bày hồ sơ năng lực cá nhân một cách chuẩn mực, đồng thời 74% bày tỏ sự thất vọng khi không nhận được bất kỳ phản hồi nào từ nhà tuyển dụng sau khi nộp đơn. Yêu cầu rút ra là hệ thống bắt buộc phải cung cấp công cụ tạo lập hồ sơ năng lực trực quan và cơ chế thông báo trạng thái xét duyệt tự động.
Về tiêu chí ưu tiên của nhà tuyển dụng: 85% đại diện nhân sự mong muốn hệ thống có bộ lọc ứng viên đa tiêu chí và bảng quản trị ứng viên theo trạng thái dạng phễu để tối ưu hóa năng suất làm việc nhóm.

c. Phương pháp phân tích đối chuẩn các hệ thống hiện hữu
Nhóm đã tiến hành nghiên cứu đối chuẩn hai nền tảng tuyển dụng lớn tại Việt Nam là TopCV và VietnamWorks nhằm chắt lọc các điểm mạnh và nhận diện những hạn chế cần khắc phục:
Đối với TopCV: Nền tảng sở hữu công cụ tạo lập hồ sơ cá nhân trực quan rất mạnh mẽ và thân thiện, tạo sức hút lớn đối với ứng viên trẻ. Tuy nhiên, luồng tương tác quản lý phễu tuyển dụng cho các doanh nghiệp quy mô nhỏ đôi khi quá phức tạp và xuất hiện nhiều thông tin quảng cáo gây phân tâm.
Đối với VietnamWorks: Nền tảng có bề dày dữ liệu việc làm chất lượng cao và uy tín doanh nghiệp lớn, nhưng trải nghiệm xây dựng hồ sơ cá nhân còn mang tính biểu mẫu cứng nhắc, chưa hỗ trợ khả năng xem trước trực tiếp và thiếu tính linh hoạt cho sinh viên mới ra trường.
Từ kết quả nghiên cứu đối chuẩn, TalentConnect định hướng kết hợp hoàn hảo hai thế mạnh cốt lõi: vừa cung cấp công cụ tạo hồ sơ năng lực trực tuyến nhanh chóng, vừa tối ưu hóa phễu quản trị ứng viên tinh gọn, minh bạch cho doanh nghiệp.

d. Đánh giá tổng quan hiện trạng và giải pháp
Tổng hợp các kết quả nghiên cứu cho thấy thực trạng công tác tuyển dụng hiện nay còn tồn tại nhiều điểm nghẽn: quy trình thủ công phân tán, dữ liệu rời rạc tiềm ẩn rủi ro mất an toàn thông tin, chi phí tuyển dụng tăng cao và thời gian phản hồi kéo dài. Việc xây dựng nền tảng số TalentConnect là giải pháp toàn diện để chuyển đổi sang mô hình vận hành hiện đại, khép kín và tin cậy.

3.1.3. Xác định phạm vi phần mềm (Scope)

Để bảo đảm tính khả thi của bài tập lớn trong khung thời gian học phần mười hai tuần với đội ngũ sáu thành viên, phạm vi đề tài được phân định minh bạch như sau:

a. Phạm vi đối tượng: Hệ thống phục vụ đối tượng ứng viên là sinh viên, người lao động trẻ có nhu cầu tìm việc làm; các doanh nghiệp vừa và nhỏ có nhu cầu tuyển dụng nhân sự thường xuyên; và đội ngũ quản trị viên, kiểm duyệt viên nội dung.

b. Phạm vi hệ thống: Nền tảng được xây dựng dưới dạng ứng dụng web đa nền tảng, có khả năng thích ứng linh hoạt trên cả trình duyệt máy tính để bàn và thiết bị di động thông minh thông qua mạng Internet.

c. Quy mô chức năng:
Phạm vi bao gồm trong đề tài (In-scope):
- Quản lý định danh tài khoản và phân quyền người dùng chặt chẽ theo từng vai trò.
- Công cụ tạo lập và quản lý hồ sơ năng lực trực tuyến với các biểu mẫu chuẩn hóa, hỗ trợ xuất bản tệp tài liệu số.
- Phân hệ đăng tải, kiểm duyệt và quản lý tin tuyển dụng nhiều trạng thái.
- Bộ lọc và tìm kiếm việc làm đa chiều dựa trên ngành nghề, địa điểm, mức lương và kinh nghiệm.
- Quản trị hồ sơ ứng viên nộp về theo mô hình phễu trực quan gồm các giai đoạn kế tiếp nhau.
- Trung tâm quản trị, kiểm duyệt nội dung phòng chống tin giả và báo cáo thống kê vận hành.
Phạm vi không thực hiện trong giai đoạn này (Out-scope):
- Chưa tích hợp cổng thanh toán trực tuyến liên ngân hàng (hệ thống vận hành chính sách hỗ trợ kết nối miễn phí trong giai đoạn bài tập lớn).
- Chưa xây dựng tính năng truyền hình hội nghị tích hợp trong trình duyệt web để phỏng vấn từ xa (doanh nghiệp và ứng viên chủ động phỏng vấn trực tiếp hoặc qua các công cụ chuyên dụng).
- Chưa áp dụng các giải pháp học máy chuyên sâu để trích xuất văn bản tự động từ các tệp hình ảnh hoặc tài liệu phi cấu trúc phức tạp.

---

3.2. Phân tích và đặc tả yêu cầu

3.2.1. Cơ sở lý thuyết

Giai đoạn phân tích và đặc tả yêu cầu là bước chuyển hóa quan trọng từ các mong muốn tự nhiên của người dùng thành tài liệu kỹ thuật có cấu trúc chuẩn mực, mạch lạc và phi mơ hồ. Nếu như quá trình xác định yêu cầu trả lời cho câu hỏi người dùng mong muốn điều gì, thì đặc tả yêu cầu trả lời cho câu hỏi hệ thống cần phải làm gì một cách tường minh để đáp ứng các mong muốn đó. Tài liệu đặc tả yêu cầu là cơ sở khoa học trực tiếp để đội ngũ kỹ thuật triển khai thiết kế kiến trúc tổng thể, mô hình hóa cơ sở dữ liệu và thiết lập các kịch bản kiểm thử nghiệm thu sau này.

3.2.2. Mục tiêu và Nội dung công việc chi tiết

Hệ thống TalentConnect được phân tích toàn diện nhằm xác định rõ ràng mục tiêu vận hành và đặc tả chi tiết bảy nhóm nội dung kỹ thuật cốt lõi theo đúng chuẩn mực công nghệ phần mềm:

1. Đối tượng đề tài sử dụng đến

Hệ thống phân định ranh giới rõ ràng giữa các chủ thể sử dụng trực tiếp các tiện ích nghiệp vụ và các chủ thể chịu trách nhiệm quản trị, vận hành hệ thống:

a. Đối tượng sử dụng hệ thống:
- Khách vãng lai: Người dùng chưa thực hiện đăng ký tài khoản, có quyền truy cập trang chủ, tra cứu danh mục việc làm công khai, xem thông tin giới thiệu doanh nghiệp và sử dụng các bộ lọc tìm kiếm cơ bản.
- Người tìm việc: Người dùng cá nhân đã hoàn tất đăng ký tài khoản và xác thực thư điện tử. Người tìm việc được cấp quyền sử dụng công cụ tạo lập hồ sơ năng lực cá nhân, tải lên tệp lý lịch cá nhân, lưu các tin tuyển dụng quan tâm, nộp hồ sơ ứng tuyển kèm thư giới thiệu và theo dõi tiến trình phản hồi từ nhà tuyển dụng theo thời gian thực.
- Nhà tuyển dụng: Đại diện các tổ chức, doanh nghiệp hoặc chuyên viên tuyển dụng nhân sự. Nhà tuyển dụng có quyền hoàn thiện hồ sơ thương hiệu công ty, nộp hồ sơ pháp lý để kiểm duyệt, soạn thảo và quản lý các bài đăng tuyển dụng, tiếp nhận và phân loại hồ sơ ứng viên theo phễu tuyển dụng, ghi chú đánh giá nội bộ và gửi thư phản hồi tự động cho ứng viên.

b. Đối tượng quản lý hệ thống:
- Cán bộ kiểm duyệt nội dung: Nhân sự thuộc ban quản trị chịu trách nhiệm thẩm định tính hợp pháp của doanh nghiệp thông qua việc đối soát mã số thuế và giấy phép kinh doanh; rà soát nội dung các bài đăng tuyển dụng trước khi cho phép hiển thị công khai; xử lý các khiếu nại, báo cáo vi phạm từ cộng đồng người dùng và thực hiện hạ tin bài vi phạm quy chuẩn đạo đức hoặc pháp luật.
- Quản trị viên hệ thống: Người giữ quyền hạn cao nhất trong hệ thống, chịu trách nhiệm quản trị toàn bộ danh mục tài khoản người dùng, phân quyền truy cập, cấu hình các tham số kỹ thuật toàn cục, quản lý danh mục dùng chung của hệ thống, theo dõi lưu lượng truy cập và trích xuất các báo cáo thống kê vận hành tổng thể.

c. Bảng ma trận phân định trách nhiệm và quyền hạn:

| Nghiệp vụ hệ thống | Khách vãng lai | Người tìm việc | Nhà tuyển dụng | Cán bộ kiểm duyệt | Quản trị viên hệ thống |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Tra cứu việc làm công khai | Thực hiện | Thực hiện | Thực hiện | Thực hiện | Toàn quyền |
| Tạo lập hồ sơ năng lực trực tuyến | Không | Toàn quyền | Không | Không | Giám sát |
| Đăng tải tin tuyển dụng | Không | Không | Toàn quyền | Kiểm duyệt | Toàn quyền |
| Quản lý phễu ứng viên | Không | Xem trạng thái | Toàn quyền | Không | Giám sát |
| Thẩm định hồ sơ doanh nghiệp | Không | Không | Gửi hồ sơ | Thẩm định | Toàn quyền |
| Cấu hình hệ thống và báo cáo | Không | Không | Báo cáo riêng | Không | Toàn quyền |

2. Phạm vi chức năng

Hệ thống TalentConnect được phân định ranh giới chức năng rõ ràng thành năm phân hệ nghiệp vụ độc lập nhưng có mối liên kết hữu cơ mật thiết:
- Phân hệ quản lý tài khoản và phân quyền: Đảm bảo công tác đăng ký, đăng nhập, bảo mật thông tin định danh và cấp phát quyền hạn chính xác cho từng vai trò người dùng.
- Phân hệ tạo lập và quản lý hồ sơ năng lực: Cung cấp bộ công cụ trực quan hỗ trợ ứng viên xây dựng bản lý lịch nghề nghiệp chuyên nghiệp, hỗ trợ đa dạng mẫu trình bày và đồng bộ dữ liệu hồ sơ cá nhân.
- Phân hệ đăng tin và kiểm duyệt việc làm: Cung cấp môi trường soạn thảo thông tin tuyển dụng chuẩn hóa, cơ chế quản lý trạng thái tin đăng và quy trình kiểm duyệt nội dung an toàn, minh bạch.
- Phân hệ tìm kiếm và gợi ý việc làm: Cung cấp bộ máy truy vấn dữ liệu đa chiều, cho phép lọc tin nhanh theo từ khóa kỹ năng, địa điểm làm việc, khoảng lương và hình thức làm việc.
- Phân hệ quản lý quy trình ứng tuyển và phễu tuyển dụng: Hỗ trợ nhà tuyển dụng tiếp nhận, phân loại và luân chuyển trạng thái hồ sơ ứng viên qua từng chặng tuyển dụng một cách trực quan, đồng thời tự động cập nhật kết quả cho ứng viên.

3. Yêu cầu chức năng

Yêu cầu chức năng của hệ thống được quy định cụ thể theo từng nhóm người dùng và các tiến trình xử lý tự động:

a. Nhóm chức năng dành cho Người tìm việc:
- Chức năng đăng ký, xác thực tài khoản và quản lý thông tin bảo mật cá nhân.
- Chức năng tạo lập và chỉnh sửa hồ sơ năng lực trực tuyến theo các phần mục chuẩn tắc gồm thông tin liên hệ, mục tiêu nghề nghiệp, kinh nghiệm làm việc, trình độ học vấn, kỹ năng chuyên môn, chứng chỉ và dự án cá nhân.
- Chức năng xem trước hồ sơ theo thời gian thực và trích xuất hồ sơ dưới dạng tệp tài liệu số chuẩn định dạng PDF để sử dụng độc lập.
- Chức năng tìm kiếm việc làm nâng cao với bộ lọc đa tiêu chí theo ngành nghề, vị trí công việc, mức lương kỳ vọng, địa điểm địa lý và loại hình làm việc toàn thời gian, bán thời gian hoặc làm việc từ xa.
- Chức năng nộp hồ sơ ứng tuyển trực tiếp vào vị trí việc làm mong muốn, cho phép lựa chọn sử dụng hồ sơ trực tuyến sẵn có hoặc tải lên tệp hồ sơ cá nhân đính kèm, hỗ trợ soạn thảo thư giới thiệu bản thân.
- Chức năng theo dõi tiến trình xét duyệt hồ sơ trực quan qua các trạng thái: Đã gửi hồ sơ, Đã được xem, Đạt yêu cầu sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp.
- Chức năng lưu lại các bài đăng tuyển dụng quan tâm vào danh mục việc làm yêu thích để theo dõi sau.

b. Nhóm chức năng dành cho Nhà tuyển dụng:
- Chức năng đăng ký tài khoản doanh nghiệp, hoàn thiện trang giới thiệu công ty gồm quy mô nhân sự, văn hóa làm việc, địa chỉ trụ sở và tải lên giấy phép đăng ký kinh doanh hoặc mã số thuế để xác thực định danh.
- Chức năng tạo mới, chỉnh sửa, lưu nháp, đăng tải và đóng tin tuyển dụng với các trường thông tin chuẩn mực về tiêu đề, số lượng cần tuyển, mô tả công việc, yêu cầu năng lực, quyền lợi đãi ngộ và hạn chót nhận hồ sơ.
- Chức năng quản lý danh sách hồ sơ ứng viên nộp về theo mô hình phễu tuyển dụng gồm năm cột trạng thái kế tiếp nhau: Hồ sơ mới tiếp nhận, Hồ sơ phù hợp, Đã lên lịch phỏng vấn, Đề xuất tuyển dụng và Từ chối hồ sơ.
- Chức năng thao tác nhanh kéo thả hoặc chuyển đổi trạng thái ứng viên giữa các cột trong phễu tuyển dụng.
- Chức năng chấm điểm đánh giá hồ sơ và ghi chú nhận xét nội bộ giữa các chuyên viên nhân sự đối với từng ứng viên.
- Chức năng gửi thư điện tử phản hồi tự động tới ứng viên theo các mẫu thư thiết lập sẵn tương ứng với từng giai đoạn tuyển dụng.

c. Nhóm chức năng dành cho Quản trị viên và Kiểm duyệt viên:
- Chức năng quản trị danh sách người dùng toàn hệ thống, hỗ trợ tìm kiếm, xem chi tiết và kích hoạt hoặc khóa tài khoản khi có hành vi vi phạm.
- Chức năng kiểm duyệt hồ sơ doanh nghiệp mới đăng ký, đối soát mã số thuế trước khi cấp quyền đăng tin tuyển dụng chính thức.
- Chức năng kiểm duyệt bài đăng tuyển dụng mới trước khi xuất bản lên trang chủ, từ chối đăng tải và phản hồi lý do nếu tin bài chứa nội dung không đúng sự thật hoặc vi phạm pháp luật.
- Chức năng quản trị danh mục dùng chung của toàn hệ thống gồm danh mục ngành nghề, danh mục bộ kỹ năng chuyên môn, danh mục tỉnh thành và các cấp bậc vị trí công việc.
- Chức năng theo dõi và trích xuất báo cáo thống kê trực quan về tổng số tài khoản hoạt động, số lượng tin đăng trong kỳ, số lượt nộp đơn và tỷ lệ tuyển dụng thành công.

d. Nhóm chức năng xử lý tự động ngầm của hệ thống:
- Tiến trình tự động quét và đối khớp từ khóa kỹ năng giữa hồ sơ ứng viên và yêu cầu bài đăng để hiển thị danh sách công việc gợi ý phù hợp trên trang chủ cá nhân của người tìm việc.
- Tiến trình tự động gửi thư điện tử thông báo tới ứng viên ngay khi nhà tuyển dụng mở xem hồ sơ hoặc thay đổi trạng thái xét duyệt trong phễu tuyển dụng.
- Tiến trình kiểm tra định kỳ hàng ngày để tự động chuyển trạng thái tin tuyển dụng từ đang hiển thị sang hết hạn khi quá ngày hết hạn nộp hồ sơ được thiết lập ban đầu.

4. Yêu cầu phi chức năng

Hệ thống TalentConnect tuân thủ nghiêm ngặt các tiêu chuẩn chất lượng công nghệ phần mềm đối với hệ thống thông tin phục vụ cộng đồng:

a. Yêu cầu về an toàn và bảo mật dữ liệu:
- Toàn bộ mật khẩu của người dùng khi lưu trữ vào cơ sở dữ liệu bắt buộc phải được băm mã hóa một chiều bằng thuật toán an toàn kết hợp chuỗi ngẫu nhiên chuẩn bcrypt, tuyệt đối không lưu trữ mật khẩu dưới dạng văn bản thô.
- Cơ chế xác thực và phân quyền truy cập giữa máy khách và máy chủ được quản lý chặt chẽ thông qua chuỗi khóa định danh an toàn có thiết lập thời hạn hiệu lực và chữ ký điện tử.
- Hệ thống áp dụng cơ chế phân quyền kiểm soát truy cập dựa trên vai trò ở mọi tầng xử lý dữ liệu, ngăn chặn triệt để hành vi can thiệp trái phép vào tài nguyên của tài khoản khác.
- Tuân thủ nghiêm ngặt các quy định về bảo vệ dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP của Chính phủ: thông tin cá nhân của người lao động chỉ được cung cấp cho nhà tuyển dụng khi có sự đồng thuận nộp đơn trực tiếp từ ứng viên.
- Toàn bộ dữ liệu đầu vào từ người dùng đều phải được kiểm tra tính hợp lệ và lọc khử mã độc phía máy chủ nhằm phòng ngừa các lỗ hổng bảo mật phổ biến như chèn mã cơ sở dữ liệu và chèn mã độc liên trang.

b. Yêu cầu về hiệu năng và khả năng đáp ứng:
- Thời gian phản hồi trang đối với các thao tác truy vấn dữ liệu thông thường như xem danh sách việc làm, tìm kiếm theo bộ lọc không được vượt quá 2 giây trong điều kiện kết nối mạng tiêu chuẩn.
- Hệ thống có năng lực phục vụ đồng thời tối thiểu 1.000 yêu cầu truy cập cùng lúc trong khung giờ cao điểm mà không xảy ra tình trạng nghẽn kết nối hoặc treo máy chủ.
- Tổng dung lượng tải về của các tệp mã nguồn giao diện, hình ảnh và tài nguyên tĩnh được tối ưu hóa dưới 2MB trên mỗi trang nhằm tiết kiệm băng thông và tăng tốc độ hiển thị cho người sử dụng.

c. Yêu cầu về độ tin cậy và tính sẵn sàng:
- Hệ thống bảo đảm thời gian duy trì hoạt động liên tục đạt tỷ lệ tối thiểu 99,9% trong suốt thời gian vận hành.
- Thiết lập quy trình tự động sao lưu dữ liệu toàn phần định kỳ hàng ngày vào các khung giờ thấp điểm ban đêm, lưu trữ tại các phân vùng độc lập nhằm phòng ngừa sự cố hỏng hóc vật lý.
- Cơ chế phục hồi thảm họa bảo đảm khả năng khôi phục toàn vẹn dữ liệu trong vòng 30 phút kể từ thời điểm phát sinh sự cố phần cứng hoặc phần mềm.

d. Yêu cầu về tính tương thích và trải nghiệm người dùng:
- Giao diện người dùng được thiết kế theo tiêu chuẩn thích ứng linh hoạt, hiển thị sắc nét và hoạt động trơn tru trên mọi kích thước màn hình phổ biến từ máy tính để bàn, máy tính xách tay đến máy tính bảng và điện thoại di động.
- Tương thích tối ưu và đồng nhất trên toàn bộ các trình duyệt web hiện đại thông dụng bao gồm Google Chrome, Microsoft Edge, Mozilla Firefox và Apple Safari.
- Bố cục giao diện đơn giản, hiện đại, phối màu hài hòa, phân cấp thông tin rõ ràng và dễ tiếp cận đối với cả người dùng không thành thạo công nghệ, hướng tới mục tiêu tối thiểu hóa số lần nhấp chuột để hoàn thành một tác vụ.

e. Yêu cầu về khả năng mở rộng và bảo trì:
- Kiến trúc phần mềm phân tầng rõ ràng, phân tách hoàn toàn giữa tầng giao diện người dùng và tầng dịch vụ nghiệp vụ phía máy chủ thông qua giao diện lập trình ứng dụng dạng chuẩn RESTful API, cho phép dễ dàng tích hợp thêm các dịch vụ bổ trợ trong tương lai mà không làm ảnh hưởng đến các phân hệ hiện có.
- Mã nguồn được cấu trúc theo các module độc lập, áp dụng các quy chuẩn đặt tên nhất quán và có tài liệu chú thích kỹ thuật đầy đủ, giúp các thành viên trong nhóm dễ dàng bàn giao, kiểm thử và khắc phục sự cố.

5. Dữ liệu đầu vào

Dữ liệu đầu vào của hệ thống TalentConnect bao gồm toàn bộ các luồng thông tin nghiệp vụ do người dùng và quản trị viên nạp vào hệ thống:

| STT | Luồng dữ liệu đầu vào | Các trường thông tin cụ thể | Kiểu dữ liệu | Nguồn cung cấp | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Tài khoản người dùng | Tên đăng nhập, mật khẩu, địa chỉ thư điện tử, số điện thoại, vai trò tài khoản | Chuỗi ký tự, Chuỗi mã hóa | Người dùng đăng ký | Xác thực danh tính và phân quyền truy cập hệ thống |
| 2 | Hồ sơ năng lực ứng viên | Họ và tên, ngày sinh, giới tính, địa chỉ, ảnh đại diện, mục tiêu nghề nghiệp, học vấn, kinh nghiệm, kỹ năng | Văn bản, Ngày tháng, Hình ảnh | Người tìm việc nhập liệu | Tạo lập hồ sơ cá nhân và xuất bản hồ sơ điện tử |
| 3 | Tệp lý lịch cá nhân đính kèm | Tệp tài liệu số chứa thông tin lý lịch cá nhân (định dạng PDF hoặc Word) | Tệp nhị phân số (dung lượng dưới 5MB) | Người tìm việc tải lên | Phục vụ nộp hồ sơ ứng tuyển trực tiếp tới doanh nghiệp |
| 4 | Hồ sơ định danh doanh nghiệp | Tên doanh nghiệp, mã số thuế, địa chỉ trụ sở, ảnh logo, đường dẫn trang thông tin, mô tả công ty, tệp đăng ký kinh doanh | Chuỗi ký tự, Hình ảnh, Tệp tài liệu số | Nhà tuyển dụng cung cấp | Thẩm định tính pháp lý và hiển thị thông tin thương hiệu |
| 5 | Tin tuyển dụng | Tiêu đề việc làm, vị trí chuyên môn, ngành nghề, số lượng cần tuyển, mức lương tối thiểu, mức lương tối đa, nơi làm việc, mô tả công việc, yêu cầu ứng viên, hạn nộp hồ sơ | Chuỗi ký tự, Số nguyên, Ngày tháng | Nhà tuyển dụng soạn thảo | Cung cấp thông tin việc làm và làm dữ liệu phục vụ tìm kiếm |
| 6 | Tương tác ứng tuyển | Mã tin tuyển dụng, mã hồ sơ ứng viên, thư giới thiệu bản thân, thời gian nộp đơn | Chuỗi ký tự, Khóa ngoại, Thời gian | Người tìm việc khởi tạo | Chuyển giao thông tin ứng tuyển vào phễu của nhà tuyển dụng |
| 7 | Tiêu chí tìm kiếm và lọc | Từ khóa tìm kiếm, mã ngành nghề, mức lương mong muốn, khu vực tỉnh thành, hình thức làm việc | Chuỗi ký tự, Mã định danh danh mục | Khách vãng lai và ứng viên | Truy vấn và lọc danh sách việc làm phù hợp |

6. Dữ liệu đầu ra

Dữ liệu đầu ra là các kết quả xử lý nghiệp vụ, thông tin số hóa và báo cáo trực quan do hệ thống tạo ra để cung cấp cho người dùng và cấp quản lý:

| STT | Dữ liệu đầu ra | Hình thức hiển thị / Định dạng | Đối tượng tiếp nhận | Nội dung chi tiết | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Tệp hồ sơ năng lực chuẩn hóa | Tệp tài liệu định dạng PDF theo mẫu thiết kế chuẩn | Người tìm việc, Nhà tuyển dụng | Toàn bộ dữ liệu hồ sơ cá nhân, học vấn, kinh nghiệm được định dạng chuyên nghiệp | Giúp ứng viên sở hữu bản lý lịch hoàn chỉnh để ứng tuyển |
| 2 | Kết quả tìm kiếm và gợi ý việc làm | Danh sách bài đăng việc làm trên giao diện web kèm bộ lọc | Khách vãng lai, Người tìm việc | Tiêu đề việc làm, tên doanh nghiệp, logo, mức lương, địa điểm, hạn nộp | Cung cấp cơ hội việc làm minh bạch và nhanh chóng |
| 3 | Bảng phễu ứng viên trực quan | Bảng điều khiển phân cột theo năm trạng thái phễu tuyển dụng | Nhà tuyển dụng | Danh sách ứng viên kèm điểm đánh giá, trạng thái xử lý và ghi chú nội bộ | Giúp doanh nghiệp quản trị khoa học quy trình tuyển dụng |
| 4 | Thư điện tử thông báo tự động | Thư điện tử gửi trực tiếp tới hòm thư cá nhân | Người tìm việc, Nhà tuyển dụng | Thông báo xác nhận ứng tuyển, thư mời phỏng vấn, thông báo trạng thái hồ sơ | Đảm bảo tính tương tác hai chiều và sự minh bạch thông tin |
| 5 | Bảng điều khiển kiểm duyệt | Giao diện danh sách kiểm duyệt tin bài và doanh nghiệp | Cán bộ kiểm duyệt, Quản trị viên | Danh sách bài đăng chờ duyệt, thông tin giấy phép doanh nghiệp kèm nút duyệt/hạ tin | Bảo đảm môi trường thông tin tuyển dụng an toàn, tin cậy |
| 6 | Báo cáo thống kê hiệu suất | Biểu đồ trực quan và bảng số liệu phân tích | Quản trị viên hệ thống, Doanh nghiệp | Thống kê số lượng truy cập, tin tuyển dụng, số lượt nộp đơn và tỷ lệ trúng tuyển | Hỗ trợ cấp quản lý đánh giá hiệu quả và ra quyết định |

7. Ràng buộc hệ thống

Để bảo đảm tính khả thi trong quá trình triển khai thực tế, hệ thống TalentConnect chịu các ràng buộc kỹ thuật, môi trường và tổ chức sau:

a. Ràng buộc về thời gian thực hiện:
Toàn bộ quy trình phát triển phần mềm bao gồm các pha xác định yêu cầu, phân tích và đặc tả, thiết kế kiến trúc và cơ sở dữ liệu, lập trình cài đặt các phân hệ, kiểm thử bảo đảm chất lượng và đóng gói hồ sơ báo cáo phải được hoàn thành trong khung thời gian quy định mười hai tuần của học kỳ môn học Công nghệ phần mềm.

b. Ràng buộc về công nghệ và môi trường kỹ thuật:
- Tầng giao diện phía máy khách được xây dựng bằng thư viện ReactJS kết hợp ngôn ngữ lập trình JavaScript/TypeScript và tiêu chuẩn định dạng CSS hiện đại.
- Tầng dịch vụ nghiệp vụ phía máy chủ được xây dựng trên môi trường thực thi NodeJS sử dụng bộ khung ứng dụng ExpressJS, cung cấp hệ thống giao diện lập trình ứng dụng chuẩn RESTful API.
- Hệ quản trị cơ sở dữ liệu quan hệ trung tâm sử dụng Microsoft SQL Server phiên bản 2022, bảo đảm các quy chuẩn toàn vẹn dữ liệu từ khóa chính, khóa ngoại đến các ràng buộc kiểm tra nghiệp vụ.
- Môi trường thử nghiệm được thiết lập trên máy chủ phát triển nội bộ kết hợp hạ tầng đám mây dùng thử miễn phí phục vụ mục đích nghiên cứu học thuật.

c. Ràng buộc về kinh phí và nguồn lực triển khai:
Dự án được thực hiện hoàn toàn trong khuôn khổ học phần sinh viên, sử dụng toàn bộ các công cụ phát triển mã nguồn mở hoặc phiên bản cộng đồng miễn phí, không phát sinh chi phí đầu tư mua sắm bản quyền phần mềm thương mại đắt tiền hay thuê bao máy chủ chuyên dụng quy mô lớn.

d. Ràng buộc về pháp lý và chuẩn mực nghề nghiệp:
- Hệ thống bắt buộc phải tuân thủ Luật An toàn thông tin mạng, Luật Công nghệ thông tin và Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân của người lao động.
- Tuyệt đối nghiêm cấm hành vi thương mại hóa trái phép hoặc chia sẻ dữ liệu liên hệ của ứng viên cho các bên thứ ba khi chưa có sự cho phép của chủ thể dữ liệu.
- Mọi thông tin tin tuyển dụng hiển thị trên hệ thống phải trải qua khâu kiểm duyệt nhằm ngăn ngừa hành vi lừa đảo, đa cấp bất hợp pháp, bảo vệ quyền và lợi ích hợp pháp của người tìm việc.

3.2.3. Mô hình hóa yêu cầu hệ thống

3.2.3.1. Sơ đồ luồng dữ liệu (Data Flow Diagram - DFD)

a. Sơ đồ ngữ cảnh:
Sơ đồ thể hiện trực quan phạm vi ranh giới của hệ thống TalentConnect và các luồng thông tin vào ra với ba thực thể ngoài chính là Người tìm việc, Nhà tuyển dụng và Ban quản trị.

[[IMAGE: assets/diagrams/hinh_3_1_dfd_context.png | Caption: Hình ảnh 3.2.3.1.a. Sơ đồ ngữ cảnh.]]

b. Sơ đồ DFD mức 0:
Toàn bộ hệ thống được phân rã thành năm tiến trình xử lý chính và bốn kho dữ liệu trung tâm:

[[IMAGE: assets/diagrams/hinh_3_2_dfd_level0.png | Caption: Hình ảnh 3.2.3.1.b. Sơ đồ DFD mức 0.]]

c. Sơ đồ DFD mức 1 cho các tiến trình trọng tâm:
Tiến trình 2.0 (Quản lý tin tuyển dụng) và Tiến trình 4.0 (Tìm kiếm và ứng tuyển) được phân rã chi tiết để làm rõ luồng dữ liệu nghiệp vụ:

[[IMAGE: assets/diagrams/hinh_3_3_dfd_level1_jobs.png | Caption: Hình ảnh 3.2.3.1.c. Sơ đồ DFD mức 1 - Tiến trình Đăng và duyệt tin tuyển dụng.]]

[[IMAGE: assets/diagrams/hinh_3_4_dfd_level1_apply.png | Caption: Hình ảnh 3.2.3.1.d. Sơ đồ DFD mức 1 - Tiến trình Tìm kiếm và ứng tuyển việc làm.]]

3.2.3.2. Đặc tả Use Case chi tiết

Hệ thống được mô hình hóa thành biểu đồ ca sử dụng tổng thể và các biểu đồ phân rã theo từng nhóm tác nhân:

[[IMAGE: assets/diagrams/hinh_3_5_usecase_general.png | Caption: Hình ảnh 3.2.3.2.a. Biểu đồ Use Case tổng thể hệ thống.]]

[[IMAGE: assets/diagrams/hinh_3_6_usecase_candidate.png | Caption: Hình ảnh 3.2.3.2.b. Biểu đồ Use Case phân hệ Người tìm việc.]]

[[IMAGE: assets/diagrams/hinh_3_7_usecase_employer.png | Caption: Hình ảnh 3.2.3.2.c. Biểu đồ Use Case phân hệ Nhà tuyển dụng.]]

[[IMAGE: assets/diagrams/hinh_3_8_usecase_admin.png | Caption: Hình ảnh 3.2.3.2.d. Biểu đồ Use Case phân hệ Quản trị viên.]]

Dưới đây là các bảng đặc tả ca sử dụng chi tiết cho năm nghiệp vụ cốt lõi của đề tài:

Bảng 3.1: Đặc tả ca sử dụng UC01 – Tạo hồ sơ năng lực trực tuyến

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC01 |
| Tên ca sử dụng | Tạo và chỉnh sửa hồ sơ năng lực trực tuyến |
| Tác nhân thực hiện | Người tìm việc đã đăng nhập hệ thống |
| Mô tả tóm tắt | Cho phép người tìm việc sử dụng công cụ biên soạn trực quan để điền thông tin học vấn, kinh nghiệm, kỹ năng, tùy biến màu sắc và kết xuất tệp tài liệu hoàn chỉnh |
| Tiền điều kiện | Người tìm việc đã đăng nhập thành công vào tài khoản cá nhân |
| Hậu điều kiện | Dữ liệu hồ sơ có cấu trúc được lưu trữ an toàn trong cơ sở dữ liệu và tệp tài liệu định dạng chuẩn được tạo sẵn sàng cho việc ứng tuyển |
| Luồng sự kiện chính | 1. Người dùng chọn chức năng Quản lý hồ sơ trên thanh điều hướng.<br>2. Hệ thống hiển thị giao diện soạn thảo trực quan với các khối thông tin tiêu chuẩn.<br>3. Người dùng nhập thông tin cá nhân, mục tiêu nghề nghiệp, học vấn, kinh nghiệm và kỹ năng.<br>4. Người dùng lựa chọn bảng màu chủ đạo và kiểu phông chữ phù hợp từ bảng điều khiển.<br>5. Hệ thống liên tục cập nhật khung hiển thị trực tiếp để người dùng quan sát diện mạo hồ sơ.<br>6. Người dùng nhấn nút Lưu hồ sơ.<br>7. Hệ thống kiểm tra tính hợp lệ của dữ liệu và lưu cấu trúc hồ sơ vào cơ sở dữ liệu.<br>8. Người dùng nhấn nút Tải tệp tài liệu; hệ thống kết xuất hồ sơ sang tệp định dạng chuẩn và gửi về máy tính của người dùng. |
| Luồng sự kiện thay thế | 7a. Nếu các trường thông tin bắt buộc như họ tên hoặc thông tin liên lạc bị bỏ trống, hệ thống hiển thị thông báo nhắc nhở tại trường dữ liệu tương ứng và yêu cầu người dùng hoàn thiện trước khi lưu. |

Bảng 3.2: Đặc tả ca sử dụng UC02 – Đăng tin tuyển dụng mới

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC02 |
| Tên ca sử dụng | Đăng tin tuyển dụng mới |
| Tác nhân thực hiện | Nhà tuyển dụng đã được kích hoạt tài khoản doanh nghiệp |
| Mô tả tóm tắt | Nhà tuyển dụng nhập các thông tin mô tả công việc, yêu cầu chuyên môn, quyền lợi đãi ngộ và thời hạn tuyển để gửi duyệt lên hệ thống |
| Tiền điều kiện | Nhà tuyển dụng đã đăng nhập và hồ sơ pháp lý của doanh nghiệp đã được quản trị viên phê duyệt |
| Hậu điều kiện | Bài đăng tuyển dụng mới được ghi nhận vào cơ sở dữ liệu ở trạng thái chờ duyệt và xuất hiện trong hàng đợi kiểm tra của ban quản trị |
| Luồng sự kiện chính | 1. Nhà tuyển dụng chọn chức năng Đăng bài tuyển dụng trên bảng điều khiển doanh nghiệp.<br>2. Hệ thống hiển thị biểu mẫu khởi tạo tin tuyển dụng chuẩn hóa.<br>3. Nhà tuyển dụng nhập tiêu đề công việc, chọn ngành nghề, nhập số lượng cần tuyển, mô tả công việc, yêu cầu kỹ năng, khoảng lương đãi ngộ, địa điểm làm việc và hạn chót nhận đơn.<br>4. Nhà tuyển dụng nhấn nút Gửi bài duyệt.<br>5. Hệ thống kiểm tra tính đầy đủ và hợp lệ của các trường dữ liệu.<br>6. Hệ thống lưu bản ghi bài đăng với trạng thái Chờ duyệt, ghi nhận thời điểm tạo và hiển thị thông báo gửi duyệt thành công cho nhà tuyển dụng. |
| Luồng sự kiện thay thế | 5a. Nếu ngày hết hạn nộp hồ sơ được chọn trước hoặc trùng với ngày hiện tại, hệ thống đưa ra cảnh báo yêu cầu chọn thời hạn tối thiểu sau ngày đăng bài ba ngày.<br>5b. Nếu mức lương tối đa được nhập nhỏ hơn mức lương tối thiểu, hệ thống yêu cầu nhà tuyển dụng điều chỉnh lại khoảng lương cho logic. |

Bảng 3.3: Đặc tả ca sử dụng UC03 – Tìm kiếm và lọc việc làm đa tiêu chí

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC03 |
| Tên ca sử dụng | Tìm kiếm và lọc việc làm đa tiêu chí |
| Tác nhân thực hiện | Khách vãng lai hoặc Người tìm việc |
| Mô tả tóm tắt | Người dùng tra cứu các cơ hội việc làm theo chuỗi từ khóa kết hợp các bộ lọc chuyên sâu để tìm ra các vị trí phù hợp nhất với năng lực bản thân |
| Tiền điều kiện | Người dùng truy cập vào trang chủ hoặc chuyên trang tìm việc của hệ thống |
| Hậu điều kiện | Hệ thống hiển thị danh sách các bài đăng tuyển dụng thỏa mãn đồng thời tất cả các điều kiện tra cứu |
| Luồng sự kiện chính | 1. Người dùng nhập chuỗi từ khóa cần tìm vào ô tìm kiếm chính.<br>2. Người dùng mở rộng bảng lọc nâng cao và chọn các tiêu chí: Danh mục ngành nghề, Tỉnh thành làm việc, Khoảng lương mong muốn và Hình thức hợp đồng.<br>3. Người dùng nhấn nút Tìm kiếm.<br>4. Hệ thống tiếp nhận các tham số, thực hiện truy vấn cơ sở dữ liệu đối với các bài đăng đang ở trạng thái hoạt động và còn thời hạn nhận đơn.<br>5. Hệ thống trả về danh sách kết quả dưới dạng thẻ thông tin công việc có phân trang rõ ràng kèm tổng số lượng việc làm tìm thấy.<br>6. Người dùng nhấn vào một thẻ công việc để chuyển hướng tới trang xem chi tiết. |
| Luồng sự kiện thay thế | 5a. Nếu không có bài đăng nào thỏa mãn tất cả các điều kiện lọc, hệ thống hiển thị thông báo Không tìm thấy công việc phù hợp và đưa ra các gợi ý nới lỏng bớt tiêu chí lọc. |

Bảng 3.4: Đặc tả ca sử dụng UC04 – Nộp hồ sơ ứng tuyển trực tuyến

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC04 |
| Tên ca sử dụng | Nộp hồ sơ ứng tuyển trực tuyến |
| Tác nhân thực hiện | Người tìm việc đã đăng nhập hệ thống |
| Mô tả tóm tắt | Người tìm việc sử dụng hồ sơ trực tuyến đã tạo hoặc tải tệp đính kèm để nộp đơn xin việc vào một bài tuyển dụng cụ thể |
| Tiền điều kiện | Người tìm việc đã đăng nhập và bài tuyển dụng đang ở trạng thái hoạt động công khai, chưa hết hạn nhận đơn |
| Hậu điều kiện | Hồ sơ ứng tuyển được ghi nhận vào danh sách tiếp nhận của nhà tuyển dụng và lịch sử nộp đơn của người dùng được cập nhật trạng thái Đã nộp |
| Luồng sự kiện chính | 1. Người tìm việc xem trang chi tiết của một bài tuyển dụng và nhấn nút Ứng tuyển ngay.<br>2. Hệ thống hiển thị cửa sổ nộp đơn ứng tuyển.<br>3. Người dùng lựa chọn bản hồ sơ trực tuyến đã lưu trên hệ thống hoặc chọn tải lên một tệp lý lịch mới từ máy tính.<br>4. Người dùng soạn thảo nội dung thư giới thiệu bản thân ngắn gọn gửi tới nhà tuyển dụng.<br>5. Người dùng nhấn nút Xác nhận nộp hồ sơ.<br>6. Hệ thống kiểm tra điều kiện ứng tuyển, lưu bản ghi nộp đơn vào kho dữ liệu với trạng thái Đã nộp.<br>7. Hệ thống hiển thị thông báo ứng tuyển thành công và cập nhật bài đăng này vào danh sách lịch sử nộp đơn của người dùng. |
| Luồng sự kiện thay thế | 6a. Nếu người dùng đã từng nộp hồ sơ vào chính bài đăng này trước đó và đơn cũ vẫn đang trong tiến trình xử lý, hệ thống đưa ra cảnh báo Bạn đã ứng tuyển vị trí này và ngăn chặn việc nộp đơn trùng lặp. |

Bảng 3.5: Đặc tả ca sử dụng UC05 – Quản lý ứng viên theo phễu tuyển dụng

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC05 |
| Tên ca sử dụng | Quản lý ứng viên theo phễu tuyển dụng |
| Tác nhân thực hiện | Nhà tuyển dụng sở hữu bài đăng |
| Mô tả tóm tắt | Nhà tuyển dụng theo dõi danh sách ứng viên nộp đơn dưới dạng các cột trạng thái phễu, xem hồ sơ, ghi chú và chuyển đổi trạng thái đánh giá |
| Tiền điều kiện | Nhà tuyển dụng đã đăng nhập và có bài đăng tuyển dụng đã phát sinh hồ sơ nộp về |
| Hậu điều kiện | Trạng thái của ứng viên trong cơ sở dữ liệu được cập nhật sang giai đoạn mới và hệ thống tự động gửi thông báo kết quả tới ứng viên |
| Luồng sự kiện chính | 1. Nhà tuyển dụng truy cập vào trang Quản lý ứng viên của một vị trí công việc cụ thể.<br>2. Hệ thống kết xuất giao diện bảng phễu gồm các cột trạng thái: Tiếp nhận mới, Đang xem xét, Hẹn phỏng vấn, Tiếp nhận chính thức và Từ chối.<br>3. Nhà tuyển dụng nhấp vào thẻ của một ứng viên để xem toàn bộ nội dung lý lịch và thư giới thiệu trực tiếp trên màn hình.<br>4. Nhà tuyển dụng nhập ghi chú đánh giá nội bộ của buổi sơ loại.<br>5. Nhà tuyển dụng thực hiện thao tác chuyển thẻ ứng viên sang cột trạng thái mới, ví dụ Hẹn phỏng vấn.<br>6. Hệ thống cập nhật trạng thái bản ghi trong cơ sở dữ liệu, ghi nhận thời điểm thay đổi và tự động tạo thông báo gửi tới tài khoản của ứng viên. |
| Luồng sự kiện thay thế | 5a. Khi nhà tuyển dụng chọn chuyển ứng viên sang cột Từ chối, hệ thống hiển thị biểu mẫu soạn thảo thư cảm ơn chuẩn mực để nhà tuyển dụng tùy chỉnh nội dung trước khi hệ thống phát đi thông báo chính thức. |

3.2.3.3. Biểu đồ thực thể quan hệ sơ bộ

Ở giai đoạn phân tích, các thực thể chính được nhận diện bao gồm Người dùng, Vai trò, Hồ sơ ứng viên, Hồ sơ công ty, Ngành nghề, Tin tuyển dụng và Đơn ứng tuyển. Chi tiết thiết kế toàn diện 28 bảng dữ liệu quan hệ được trình bày chi tiết tại mục 3.3 Thiết kế hệ thống.
