<div style="page-break-after: always;"></div>

III. QUY TRÌNH XÂY DỰNG PHẦN MỀM

3.1. Xác định yêu cầu hệ thống

3.1.1. Cơ sở lý thuyết và Quy trình thực hiện

Trong công nghệ phần mềm, xác định yêu cầu là giai đoạn mở đầu nhằm thu thập, phân tích và ghi nhận các chức năng mà hệ thống cần cung cấp cùng những ràng buộc vận hành trong môi trường thực tế. Mục tiêu của giai đoạn này là làm rõ bài toán nghiệp vụ, chuyển các nhu cầu sử dụng của các bên liên quan thành danh mục yêu cầu cụ thể và có thể kiểm tra được trước khi bước sang giai đoạn phân tích, thiết kế và lập trình.

Khi tiếp cận bài toán xây dựng website tuyển dụng và tìm kiếm việc làm TalentConnect, nhóm nhận thấy ba đặc điểm nghiệp vụ trực tiếp chi phối thiết kế hệ thống:
Trước hết là sự khác biệt về mục đích sử dụng giữa các nhóm tác nhân: người tìm việc cần công cụ chuẩn bị hồ sơ rõ ràng, tìm đúng vị trí phù hợp và nhận được phản hồi sau khi nộp đơn; nhà tuyển dụng cần công bố nhu cầu tuyển người, tiếp nhận hồ sơ theo từng vị trí và sàng lọc ứng viên tập trung; còn ban quản trị cần kiểm soát thông tin pháp lý của doanh nghiệp, duyệt nội dung tin đăng và bảo vệ dữ liệu.
Điểm đặc thù tiếp theo là sự đa dạng của điều kiện tuyển dụng: yêu cầu về ngành nghề, kỹ năng, mức lương, địa điểm và hình thức làm việc thay đổi theo từng vị trí, đòi hỏi cấu trúc lưu trữ và bộ lọc tìm kiếm phải biểu diễn được cả các khoảng lương cụ thể lẫn trường hợp lương thỏa thuận.
Ngoài ra, bài toán đặt ra yêu cầu cao về độ tin cậy của nguồn tin và an toàn thông tin cá nhân: hệ thống phải xác thực doanh nghiệp trước khi cho phép công bố tin tuyển dụng, đồng thời chỉ chia sẻ bản hồ sơ của ứng viên cho doanh nghiệp khi ứng viên chủ động xác nhận nộp đơn.

Để xác định đầy đủ các yêu cầu trên, nhóm triển khai quy trình khảo sát qua bốn bước:
Bước một, xác định nhóm người dùng và tiêu chí đối chiếu: Xác định các tác nhân tham gia hệ thống (khách vãng lai, người tìm việc, nhà tuyển dụng, người kiểm duyệt, quản trị viên) và lập khung tiêu chí nghiệp vụ cần khảo sát.
Bước hai, khảo sát và phân tích đối chuẩn các hệ thống tuyển dụng hiện có: Tìm hiểu quy trình hoạt động, giao diện và cách xử lý dữ liệu của các nền tảng tuyển dụng phổ biến ở trong nước và quốc tế để rút ra các chức năng cần thiết cho đề tài.
Bước ba, phân loại và tổng hợp yêu cầu: Tập hợp kết quả khảo sát, loại bỏ các tính năng vượt ngoài nguồn lực học phần, sau đó phân nhóm thành yêu cầu chức năng, yêu cầu phi chức năng, dữ liệu đầu vào, dữ liệu đầu ra và các ràng buộc hệ thống.
Bước bốn, rà soát và thống nhất phạm vi: Thảo luận trong nhóm và tiếp nhận góp ý của giảng viên hướng dẫn để chốt phạm vi chức năng thực hiện của bài tập lớn.

Theo đúng yêu cầu nội dung của học phần Công nghệ phần mềm, việc xác định yêu cầu cho hệ thống quản lý tuyển dụng và tìm kiếm việc làm TalentConnect phải làm rõ đầy đủ bốn nhóm yêu cầu nền tảng: (1) Yêu cầu phần cứng: Máy chủ ứng dụng và cơ sở dữ liệu trang bị bộ vi xử lý tối thiểu 4 nhân từ 2,4 GHz, bộ nhớ RAM tối thiểu 8 GB (khuyến nghị 16 GB), ổ cứng SSD tối thiểu 100 GB lưu trữ 28 bảng dữ liệu và kho tệp PDF; máy trạm của người tìm việc, nhà tuyển dụng và quản trị viên là máy tính cá nhân hoặc thiết bị di động có kết nối mạng Internet. (2) Yêu cầu phần mềm: Phía máy chủ vận hành trên hệ điều hành Windows Server hoặc Ubuntu Linux, môi trường thực thi Node.js kết hợp Express.js và hệ quản trị cơ sở dữ liệu quan hệ Microsoft SQL Server 2022; phía máy khách sử dụng trình duyệt web thông dụng như Google Chrome, Microsoft Edge, Firefox hoặc Safari. (3) Yêu cầu về dữ liệu: Hệ thống quản lý chặt chẽ các luồng dữ liệu đầu vào (thông tin tài khoản, hồ sơ pháp lý doanh nghiệp kèm mã số thuế, dữ liệu bài đăng tuyển dụng và trọng số kỹ năng, hồ sơ trực tuyến và tệp PDF tối đa 5 MB, đơn ứng tuyển) và dữ liệu đầu ra (tệp hồ sơ PDF khổ A4, danh sách việc làm kèm tỷ lệ khớp kỹ năng có giải thích, mã đơn tra cứu, bảng quản lý ứng viên 5 giai đoạn và báo cáo thống kê) đảm bảo toàn vẹn tham chiếu và bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. (4) Yêu cầu về con người: Phân định rõ vai trò, trình độ sử dụng và trách nhiệm của Người tìm việc, Nhà tuyển dụng và Ban quản trị hệ thống.

3.1.2. Phương pháp xác định yêu cầu: Phương pháp phân tích đối chuẩn các hệ thống hiện hữu

Đối với bài toán đã có nhiều sản phẩm vận hành thực tế như website tuyển dụng và quản lý hồ sơ ứng tuyển, việc kết hợp khảo sát nhu cầu sử dụng với phương pháp phân tích đối chuẩn các hệ thống hiện hữu giúp nhóm nắm bắt nhanh quy trình nghiệp vụ chuẩn. Qua việc quan sát trực tiếp cách thức tạo hồ sơ, đăng tin, tìm kiếm việc làm và tiếp nhận đơn trên những nền tảng phổ biến, nhóm xác định được các thành phần thông tin bắt buộc, cách tổ chức bộ lọc tra cứu cũng như những điểm còn bất cập đối với người tìm việc và doanh nghiệp vừa và nhỏ.

Nhóm đối chiếu các nền tảng dựa trên sáu tiêu chí nghiệp vụ và kỹ thuật:

Về công cụ tạo và quản lý hồ sơ trực tuyến, nhóm xem xét khả năng hỗ trợ người tìm việc nhập thông tin theo cấu trúc, xem trước nội dung và xuất tệp hồ sơ định dạng PDF.

Về quy trình đăng tin, xác thực doanh nghiệp và kiểm duyệt nội dung, nhóm xem xét biểu mẫu soạn tin tuyển dụng, bước kiểm tra mã số thuế, giấy chứng nhận đăng ký doanh nghiệp và cơ chế duyệt tin trước khi công bố.

Về tìm kiếm đa tiêu chí và gợi ý việc làm, nhóm xem xét khả năng kết hợp các điều kiện lọc theo từ khóa, ngành nghề, địa điểm, mức lương, hình thức làm việc cùng cách đối chiếu kỹ năng giữa hồ sơ ứng viên với yêu cầu của tin tuyển dụng.

Về ứng tuyển và quản lý ứng viên theo giai đoạn, nhóm xem xét cách ghi nhận đơn ứng tuyển, bảng theo dõi ứng viên qua từng bước xét tuyển, tính năng ghi chú nội bộ và gửi thông báo phản hồi kết quả cho ứng viên.

Về bảo vệ dữ liệu cá nhân và phân quyền truy cập, nhóm xem xét cơ chế kiểm soát quyền đọc hồ sơ theo vai trò và bước xác nhận đồng ý chia sẻ thông tin khi ứng viên gửi đơn theo Nghị định số 13/2023/NĐ-CP.

Về khả năng tiếp cận đối với doanh nghiệp vừa và nhỏ, nhóm xem xét mức độ thuận tiện khi đăng ký sử dụng, chi phí đăng tin và việc tích hợp sẵn công cụ quản lý ứng viên ngay trong tài khoản doanh nghiệp.

Bảng 3.1 dưới đây tổng hợp kết quả đối chiếu giữa bốn nền tảng tuyển dụng phổ biến gồm TopCV, VietnamWorks, LinkedIn và Indeed với định hướng xây dựng của hệ thống TalentConnect:

Bảng 3.1: Ma trận phân tích đối chuẩn các hệ thống tuyển dụng

| Tiêu chí đối chuẩn | TopCV | VietnamWorks | LinkedIn | Indeed | TalentConnect |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Công cụ tạo hồ sơ trực tuyến | Nhiều mẫu thiết kế, chia rõ các mục thông tin, hỗ trợ xuất tệp PDF | Nhập biểu mẫu cơ bản, ít tùy chọn trình bày | Sinh hồ sơ từ trang cá nhân, bố cục đơn giản | Hồ sơ dạng văn bản đơn giản, ít tùy chỉnh giao diện | Tạo hồ sơ theo cấu trúc, xem trước trực tiếp và xuất tệp PDF |
| Xác thực doanh nghiệp và duyệt tin | Kiểm duyệt kết hợp tự động và thủ công | Yêu cầu thông tin pháp lý doanh nghiệp rõ ràng | Xác thực qua tên miền email và trang tổ chức | Kiểm tra tự động là chính, ít đối soát giấy tờ pháp lý tại Việt Nam | Xác thực mã số thuế, giấy phép kinh doanh và duyệt tin trước khi công bố |
| Tìm kiếm và gợi ý việc làm | Tìm theo từ khóa, địa điểm, ngành nghề và gợi ý việc làm | Tìm kiếm đa tiêu chí, lọc theo mức lương và cấp bậc | Gợi ý theo mạng lưới nghề nghiệp và kỹ năng khai báo | Tìm kiếm từ khóa nhanh, bộ lọc ngắn gọn | Tìm kiếm đa tiêu chí, gợi ý theo trọng số kỹ năng kèm giải thích |
| Quản lý ứng viên theo giai đoạn | Có phân hệ quản lý riêng nhưng giới hạn theo gói dịch vụ | Quản lý danh sách ứng viên theo bảng phân trang | Công cụ quản lý chuyên sâu nhưng chi phí bản quyền cao | Danh sách ứng viên cơ bản theo từng tin đăng | Tích hợp bảng quản lý ứng viên qua 5 giai đoạn ngay trong hệ thống |
| Bảo vệ dữ liệu theo Nghị định 13/2023/NĐ-CP | Có tùy chọn bật/tắt cho phép nhà tuyển dụng tìm hồ sơ | Quản lý quyền riêng tư theo tài khoản ứng viên | Cài đặt quyền hiển thị hồ sơ chi tiết | Cho phép ẩn hoặc hiện hồ sơ trên hệ thống | Chỉ chia sẻ hồ sơ cho doanh nghiệp khi ứng viên xác nhận gửi đơn |
| Phù hợp với doanh nghiệp vừa và nhỏ | Giới hạn số tin miễn phí, tính phí các tính năng nâng cao | Chi phí đăng tin và mở hồ sơ cao so với doanh nghiệp nhỏ | Chi phí tài khoản tuyển dụng cao | Hỗ trợ đăng tin cơ bản nhưng ít công cụ theo dõi chi tiết | Hỗ trợ đăng tin và quản lý ứng viên theo vị trí trong phạm vi hệ thống |

Qua khảo sát hệ thống TopCV, điểm mạnh nổi bật là công cụ tạo hồ sơ trực tuyến giúp sinh viên và người mới đi làm dễ dàng sắp xếp thông tin học vấn, kinh nghiệm, kỹ năng và xuất ra tệp PDF. Cách bố trí danh sách việc làm và bộ lọc của TopCV cũng quen thuộc với người dùng tại Việt Nam. Tuy nhiên, trên giao diện tìm việc đôi khi có nhiều khối quảng cáo làm phân tán sự chú ý; đồng thời các tính năng quản lý ứng viên chi tiết thường tách riêng hoặc giới hạn theo gói trả phí đối với doanh nghiệp.

Đối với VietnamWorks, ưu thế nằm ở nguồn tin tuyển dụng từ các doanh nghiệp lớn và quy trình kiểm tra thông tin đơn vị tuyển dụng chặt chẽ. Dù vậy, biểu mẫu tạo hồ sơ trên nền tảng này thiên về nhập liệu hành chính, ít hỗ trợ tùy chỉnh bố cục cho sinh viên mới ra trường. Bên cạnh đó, mức phí đăng tin và tra cứu hồ sơ khá cao nên chưa thuận tiện cho các doanh nghiệp quy mô nhỏ có nhu cầu tuyển dụng số lượng ít.

Đối với LinkedIn, hệ thống có thế mạnh về mạng lưới nghề nghiệp và khả năng đối chiếu kỹ năng khai báo với yêu cầu công việc. Hạn chế khi áp dụng cho nhóm đối tượng sinh viên và doanh nghiệp nhỏ trong nước là giao diện thiên về mạng xã hội, chi phí gói tuyển dụng chuyên nghiệp cao và bộ lọc địa điểm chưa chi tiết theo từng khu vực tại Việt Nam.

Đối với Indeed, ưu điểm là giao diện tìm kiếm gọn nhẹ, tốc độ tải nhanh và thao tác nộp hồ sơ qua từng bước rõ ràng. Tuy nhiên, công cụ tạo hồ sơ của Indeed khá đơn giản, phần quản lý ứng viên chủ yếu hiển thị theo danh sách cơ bản và khâu đối soát giấy tờ pháp lý doanh nghiệp tại thị trường địa phương chưa chặt chẽ bằng các nền tảng trong nước.

Từ kết quả phân tích trên, nhóm xác định hướng thiết kế cho TalentConnect như sau:
Về mặt kế thừa, hệ thống tham khảo cách bố trí tìm kiếm việc làm của TopCV và quy trình chuẩn bị, kiểm tra hồ sơ nhiều bước của Indeed để người tìm việc dễ so sánh các vị trí, chọn đúng bản hồ sơ và kiểm tra thông tin trước khi xác nhận gửi.
Về mặt hoàn thiện nghiệp vụ trong phạm vi đề tài, hệ thống yêu cầu doanh nghiệp phải xác thực thông tin pháp lý gồm mã số thuế và giấy phép đăng ký doanh nghiệp trước khi gửi duyệt tin tuyển dụng để bảo đảm nguồn tin có đơn vị chịu trách nhiệm rõ ràng. Bên cạnh bộ lọc tìm kiếm, hệ thống bổ sung tính năng gợi ý việc làm dựa trên trọng số kỹ năng và chỉ rõ kỹ năng nào đã khớp, kỹ năng nào chưa khai báo để ứng viên hiểu căn cứ đề xuất. Phía nhà tuyển dụng được tích hợp sẵn bảng quản lý ứng viên theo năm giai đoạn gồm Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp gắn liền với lịch sử thao tác và thông báo tự động. Đồng thời, hệ thống giữ chặt nguyên tắc bảo vệ dữ liệu cá nhân: thao tác lưu tin hoặc mở biểu mẫu chưa tạo đơn và chưa chia sẻ dữ liệu; chỉ khi ứng viên chủ động đánh dấu đồng ý và xác nhận gửi thì bản hồ sơ được chọn mới gắn với đơn ứng tuyển gửi tới doanh nghiệp sở hữu tin đó.

3.1.3. Xác định phạm vi đề tài "Quy trình xây dựng Website tuyển dụng và tìm kiếm việc làm TalentConnect"

Về phạm vi đối tượng sử dụng, hệ thống phục vụ ba nhóm người dùng chính: ứng viên tìm việc (hướng tới sinh viên sắp tốt nghiệp và người lao động trẻ), doanh nghiệp tuyển dụng (đặc biệt là các doanh nghiệp vừa và nhỏ cần công cụ đăng tin và theo dõi hồ sơ ứng tuyển tập trung) và ban quản trị (gồm người kiểm duyệt nội dung và quản trị viên hệ thống).

Về phạm vi môi trường kỹ thuật, TalentConnect vận hành dưới dạng ứng dụng web qua giao thức HTTP/HTTPS, hiển thị thích ứng trên máy tính để bàn, máy tính xách tay và thiết bị di động.

Về quy mô chức năng, TalentConnect cung cấp dịch vụ kết nối người tìm việc với nhu cầu tuyển dụng của doanh nghiệp. Giá trị cốt lõi là giúp ứng viên tìm được vị trí phù hợp và gửi hồ sơ, đồng thời giúp doanh nghiệp tiếp nhận, lựa chọn ứng viên và phản hồi kết quả trên cùng hệ thống. Dịch vụ này được thực hiện qua ba chức năng nghiệp vụ chính gồm: công bố và quản lý nhu cầu tuyển dụng; tìm kiếm và gợi ý việc làm phù hợp; ứng tuyển và xử lý hồ sơ; cùng các chức năng hỗ trợ gồm tạo và quản lý hồ sơ trực tuyến, quản lý tài khoản và phân quyền, xác thực doanh nghiệp và kiểm duyệt, thông báo và thống kê vận hành. Các tính năng như cổng thanh toán trực tuyến, hội nghị truyền hình tích hợp sẵn trên trình duyệt hoặc mô hình học máy chuyên sâu trích xuất văn bản từ ảnh chụp không thuộc phạm vi thực hiện của bài tập lớn.

3.1.4. Xác định yêu cầu đề tài "Quy trình xây dựng Website tuyển dụng và tìm kiếm việc làm TalentConnect"

a. Đối tượng đề tài sử dụng đến:

Hệ thống TalentConnect phân định rõ quyền hạn giữa nhóm người dùng nghiệp vụ và nhóm quản trị, điều hành hệ thống.

Nhóm người sử dụng nghiệp vụ gồm ba đối tượng:

Khách vãng lai là người dùng truy cập website khi chưa đăng nhập tài khoản. Khách chưa đăng nhập được phép tìm kiếm và đọc các tin tuyển dụng công khai, xem thông tin giới thiệu doanh nghiệp, nhưng cần đăng nhập tài khoản người tìm việc khi muốn tạo hồ sơ trực tuyến, nhận gợi ý theo kỹ năng hoặc gửi đơn ứng tuyển.

Người tìm việc bao gồm sinh viên và người lao động đã đăng ký tài khoản ứng viên. Người tìm việc sử dụng hệ thống để tạo và lưu các bản hồ sơ trực tuyến hoặc tải tệp hồ sơ PDF, khai báo danh mục kỹ năng chuyên môn, tìm kiếm và lọc việc làm, xem mức khớp kỹ năng trên từng vị trí, chọn bản hồ sơ và gửi đơn ứng tuyển kèm thư giới thiệu, cũng như theo dõi trạng thái xử lý đơn và lịch phỏng vấn từ doanh nghiệp.

Nhà tuyển dụng đại diện cho doanh nghiệp có nhu cầu tuyển nhân sự. Nhà tuyển dụng cập nhật thông tin đơn vị, cung cấp mã số thuế và giấy chứng nhận đăng ký doanh nghiệp để xác thực pháp lý, soạn thảo và quản lý vòng đời các tin tuyển dụng, tiếp nhận danh sách đơn ứng tuyển theo từng vị trí, đánh giá và chuyển trạng thái ứng viên qua các giai đoạn xét tuyển, lập lịch phỏng vấn và gửi thông báo phản hồi cho ứng viên.

Nhóm quản trị và điều hành hệ thống gồm hai vai trò: Cán bộ kiểm duyệt nội dung phụ trách đối soát thông tin pháp lý của doanh nghiệp mới đăng ký, kiểm duyệt nội dung các tin tuyển dụng đang chờ duyệt để chấp thuận công bố hoặc từ chối kèm lý do chỉnh sửa, đồng thời xử lý các phản ánh vi phạm; Quản trị viên hệ thống phụ trách quản lý tài khoản và phân quyền theo vai trò, cập nhật các danh mục ngành nghề, kỹ năng, địa điểm dùng chung, theo dõi nhật ký hệ thống và xem báo cáo thống kê toàn nền tảng.

Bảng 3.2: Ma trận phân định trách nhiệm và quyền hạn

| Nghiệp vụ hệ thống | Khách vãng lai | Người tìm việc | Nhà tuyển dụng | Cán bộ kiểm duyệt | Quản trị viên hệ thống |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Tìm kiếm và đọc tin công khai | Trực tiếp thực hiện | Trực tiếp thực hiện | Trực tiếp thực hiện | Giám sát nội dung | Toàn quyền quản lý |
| Tạo và quản lý hồ sơ ứng viên | Không áp dụng | Trực tiếp thực hiện | Không áp dụng | Không áp dụng | Giám sát vận hành |
| Soạn và gửi duyệt tin tuyển dụng | Không áp dụng | Không áp dụng | Trực tiếp thực hiện | Kiểm duyệt nội dung | Giám sát vận hành |
| Ứng tuyển và xử lý hồ sơ theo giai đoạn | Không áp dụng | Nộp đơn và xem trạng thái | Tiếp nhận và xử lý đơn | Không áp dụng | Giám sát vận hành |
| Xác thực thông tin pháp lý doanh nghiệp | Không áp dụng | Không áp dụng | Cung cấp hồ sơ pháp lý | Trực tiếp đối soát | Toàn quyền phê duyệt |
| Kiểm duyệt tin tuyển dụng | Không áp dụng | Báo cáo tin vi phạm | Chỉnh sửa theo phản hồi | Trực tiếp phê duyệt | Toàn quyền phê duyệt |
| Quản lý danh mục và thống kê hệ thống | Không áp dụng | Không áp dụng | Xem thống kê của đơn vị | Xem thống kê kiểm duyệt | Toàn quyền điều hành |

b. Phạm vi chức năng:

Hệ thống bao gồm ba nhóm chức năng nghiệp vụ chính kết hợp với các chức năng hỗ trợ vận hành xuyên suốt từ nhu cầu tuyển người đến kết quả xét tuyển:

Nhóm chức năng chính thứ nhất là Công bố và quản lý nhu cầu tuyển dụng. Chức năng này chuyển nhu cầu tuyển người của doanh nghiệp thành tin tuyển dụng có đủ thông tin để ứng viên lựa chọn. Nhà tuyển dụng soạn chức danh, ngành nghề, số lượng cần tuyển, nhiệm vụ, yêu cầu kỹ năng, quyền lợi, mức lương, địa điểm và hạn nhận hồ sơ; những dữ liệu này vừa mô tả vị trí, vừa là căn cứ cho bộ lọc tìm kiếm và việc đối chiếu kỹ năng. Quy trình xử lý gồm soạn tin, lưu nháp, gửi duyệt và công bố. Doanh nghiệp cần được xác thực thông tin pháp lý trước khi gửi tin tuyển dụng. Khi gửi, hệ thống kiểm tra trường bắt buộc, thời hạn và khoảng lương; mức lương tối đa không được nhỏ hơn mức tối thiểu. Tin hợp lệ được chuyển sang Chờ duyệt; người kiểm duyệt xem nội dung và quyết định chấp thuận hoặc từ chối kèm lý do để doanh nghiệp chỉnh sửa. Chỉ tin được duyệt, đang hoạt động và còn hạn mới được đưa đến người tìm việc. Sau khi công bố, nhà tuyển dụng theo dõi và quản lý tin theo từng vị trí, có thể cập nhật nội dung, gia hạn hoặc đóng tin khi đã tuyển đủ; hệ thống kiểm tra hạn nhận hồ sơ để chuyển tin hết hạn và ngừng nhận đơn mới.

Nhóm chức năng chính thứ hai là Tìm kiếm và gợi ý việc làm phù hợp. Chức năng này giúp người tìm việc thu hẹp danh sách cơ hội theo nhu cầu và năng lực của mình. Người dùng nhập từ khóa rồi chọn các điều kiện như ngành nghề, địa điểm, mức lương và hình thức làm việc; hệ thống kết hợp những điều kiện đã chọn để tìm trong các tin đang hoạt động và còn hạn nhận hồ sơ. Khách chưa đăng nhập cũng được tìm và đọc tin công khai; việc khai báo hồ sơ, kỹ năng giúp người đã có tài khoản nhận thêm gợi ý phù hợp với bản thân. Quy trình tìm kiếm đi từ nhập điều kiện đến xem danh sách, đọc chi tiết và lựa chọn tin. Danh sách thể hiện tên vị trí, doanh nghiệp, lương và địa điểm để người dùng so sánh trước khi mở từng tin, kèm tổng số kết quả và phân trang. Gợi ý việc làm bổ sung căn cứ lựa chọn bằng cách đối chiếu kỹ năng ứng viên đã khai báo với kỹ năng mà tin tuyển dụng yêu cầu theo danh mục kỹ năng chung và trọng số ưu tiên của từng kỹ năng trong tin, đồng thời chỉ rõ kỹ năng nào đã khớp và kỹ năng nào chưa được khai báo để ứng viên hiểu vì sao một tin được đề xuất.

Nhóm chức năng chính thứ ba là Ứng tuyển và xử lý hồ sơ. Chức năng này ghi nhận hồ sơ gửi đến một vị trí cụ thể và hỗ trợ doanh nghiệp xử lý hồ sơ đó đến khi có phản hồi. Từ tin đã chọn, ứng viên nhấn Ứng tuyển ngay, chọn bản hồ sơ đã lưu hoặc tải tệp mới, bổ sung thư giới thiệu nếu cần rồi kiểm tra và xác nhận gửi. Hệ thống kiểm tra người gửi đã đăng nhập, hồ sơ đã lưu thuộc người đó, tin còn nhận đơn và không có đơn trùng đang xử lý. Đơn ứng tuyển gắn đúng người nộp, vị trí tuyển dụng và bản hồ sơ được chọn; việc lưu tin hoặc chỉ mở biểu mẫu chưa tạo đơn. Về phía doanh nghiệp, nhà tuyển dụng tiếp nhận các đơn theo từng vị trí trên bảng quản lý gồm năm giai đoạn: Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp. Khi mở thẻ ứng viên, người tuyển dụng xem hồ sơ, thư giới thiệu, ghi nhận xét hoặc chấm điểm nội bộ rồi chuyển sang giai đoạn phù hợp, lập lịch phỏng vấn hoặc gửi thư phản hồi kết quả.

Nhóm các chức năng hỗ trợ dịch vụ tuyển dụng bao gồm: Tạo và quản lý hồ sơ cung cấp tài liệu cấu trúc và tệp PDF để ứng tuyển; Quản lý tài khoản và phân quyền xác định danh tính và giới hạn quyền thao tác trên dữ liệu; Xác thực doanh nghiệp và kiểm duyệt bảo đảm điều kiện công bố tin hợp lệ; Thông báo và thống kê giúp hai bên nhận biết kịp thời tiến trình xử lý đơn và hỗ trợ ban quản trị theo dõi hoạt động hệ thống.

c. Yêu cầu chức năng:

Đối với Người tìm việc, hệ thống đáp ứng các yêu cầu chức năng từ chuẩn bị hồ sơ đến tra cứu và nộp đơn. Người tìm việc đăng ký tài khoản, đăng nhập, cập nhật thông tin liên hệ và khai báo học vấn, kinh nghiệm, kỹ năng, chứng chỉ, dự án để tạo các bản hồ sơ trực tuyến, xem trước và xuất tệp PDF hoặc tải lên tệp hồ sơ PDF từ máy tính. Khi tìm việc, ứng viên nhập từ khóa kết hợp bộ lọc ngành nghề, địa điểm, kinh nghiệm, mức lương và hình thức làm việc; xem danh sách kết quả, lưu tin để xem lại hoặc mở trang chi tiết công việc. Hệ thống hiển thị tỷ lệ khớp kỹ năng cùng danh sách các kỹ năng đã khớp và kỹ năng chưa khai báo; mức khớp kỹ năng là thông tin hỗ trợ lựa chọn, không bảo đảm ứng viên đáp ứng toàn bộ yêu cầu hay sẽ được tuyển, do ứng viên còn phải cân nhắc kinh nghiệm, địa điểm, thu nhập và nội dung công việc. Khi nhấn Ứng tuyển ngay, vị trí được chọn chuyển sang biểu mẫu nộp hồ sơ cùng thông tin doanh nghiệp và hạn nhận đơn; ứng viên chọn bản hồ sơ, nhập thư giới thiệu (tối đa 2.000 ký tự), xem trước tài liệu nếu cần, kiểm tra lại thông tin người gửi – người nhận, chủ động đánh dấu đồng ý chia sẻ dữ liệu và xác nhận gửi. Sau khi lưu đơn thành công, hệ thống cấp mã đơn tra cứu, đặt trạng thái ban đầu là Đã gửi hồ sơ và cập nhật lịch sử khi doanh nghiệp xử lý đơn qua các giai đoạn tiếp theo.

Đối với Nhà tuyển dụng, hệ thống cung cấp các chức năng quản lý nhu cầu tuyển người và xử lý ứng viên theo từng vị trí. Doanh nghiệp đăng ký tài khoản, cập nhật hồ sơ đơn vị, địa điểm làm việc và gửi mã số thuế cùng giấy chứng nhận đăng ký doanh nghiệp để xác thực pháp lý. Khi soạn tin tuyển dụng, nhà tuyển dụng nhập đầy đủ thông tin công việc, khoảng lương, hạn nhận đơn và chọn các kỹ năng yêu cầu kèm mức độ ưu tiên; có thể lưu nháp, gửi duyệt, cập nhật nội dung, gia hạn hoặc đóng tin khi đã tuyển đủ. Trong phần quản lý ứng viên, nhà tuyển dụng theo dõi các đơn nộp về theo năm giai đoạn (Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc, Chưa phù hợp). Khi mở từng đơn, nhà tuyển dụng đọc đúng bản hồ sơ ứng viên đã gửi kèm thư giới thiệu, ghi nhận xét hoặc chấm điểm đánh giá nội bộ và chuyển đơn sang giai đoạn phù hợp. Với hồ sơ được chọn phỏng vấn, nhà tuyển dụng lập lịch gắn với đơn (gồm thời gian, hình thức, người phỏng vấn và địa chỉ hoặc liên kết cuộc họp) để hệ thống gửi thư mời cho ứng viên. Sau phỏng vấn hoặc ngay từ bước sơ loại, nhà tuyển dụng ghi nhận kết quả đề xuất nhận việc hoặc từ chối kèm thư phản hồi mà không bắt buộc ứng viên phải đi qua tất cả các giai đoạn.

Đối với Quản trị viên và Cán bộ kiểm duyệt, hệ thống cung cấp chức năng kiểm soát điều kiện công bố tin và quản trị dữ liệu nền tảng. Cán bộ kiểm duyệt xem danh sách doanh nghiệp chờ xác thực pháp lý, kiểm tra mã số thuế và giấy phép kinh doanh để phê duyệt hoặc từ chối; xem hàng đợi các tin tuyển dụng ở trạng thái Chờ duyệt để chấp thuận công bố hoặc từ chối kèm lý do cụ thể. Quản trị viên quản lý danh sách tài khoản, phân quyền vai trò, khóa hoặc mở khóa tài khoản vi phạm, cập nhật danh mục ngành nghề và danh mục kỹ năng dùng chung, đồng thời xem báo cáo thống kê số lượng người dùng, tin tuyển dụng và đơn ứng tuyển trên hệ thống.

Đối với các tác vụ xử lý tự động, hệ thống tính toán mức khớp kỹ năng giữa hồ sơ ứng viên đã khai báo với danh sách kỹ năng yêu cầu và trọng số của từng tin tuyển dụng đang mở; tự động tạo thông báo trên hệ thống và gửi thư điện tử cho người nhận khi phát sinh đơn ứng tuyển mới, khi đơn chuyển giai đoạn xét tuyển hoặc khi có lịch phỏng vấn; rà soát hạn nhận hồ sơ hàng ngày để chuyển các tin quá hạn sang trạng thái hết hạn và ngừng tiếp nhận đơn mới; đồng thời dọn dẹp các phiên đăng nhập hoặc mã xác thực đã hết hiệu lực.

d. Yêu cầu phi chức năng:

Về an toàn và bảo mật thông tin, mật khẩu tài khoản phải được băm một chiều bằng thuật toán bcrypt trước khi lưu vào cơ sở dữ liệu, không lưu mật khẩu dạng văn bản thuần. Phiên đăng nhập được quản lý thông qua mã xác thực JWT và bảng quản lý phiên làm việc; danh tính người thao tác luôn được lấy từ phiên đăng nhập hợp lệ ở tầng máy chủ để ngăn việc sửa mã ứng viên hoặc mã doanh nghiệp trong yêu cầu gửi lên. Hệ thống kiểm soát quyền truy cập theo vai trò ở từng API: bản hồ sơ trong đơn ứng tuyển phải thuộc đúng ứng viên nộp đơn, và chỉ doanh nghiệp sở hữu tin tuyển dụng nhận đơn đó mới có quyền mở xem. Theo Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, ô đồng ý chia sẻ hồ sơ ở bước xác nhận không được đánh dấu sẵn mà phải do ứng viên chủ động chọn trước khi gửi. Nội dung bản hồ sơ đã nộp gắn với đơn được giữ nguyên để hai bên đối chiếu thống nhất ngay cả khi ứng viên chỉnh sửa hồ sơ cho những lần ứng tuyển sau.

Về hiệu năng xử lý, trong phạm vi thử nghiệm của dự án học phần, các thao tác tải trang danh sách, lọc việc làm và mở chi tiết tin cần phản hồi trong khoảng 2 giây ở điều kiện mạng thông thường. Nhóm tạo chỉ mục cho các truy vấn tìm kiếm đa tiêu chí trên cơ sở dữ liệu Microsoft SQL Server tại các cột trạng thái tin, hạn nộp, ngành nghề, địa điểm và mức lương để thời gian truy vấn đạt dưới 500 mili-giây với tập dữ liệu thử nghiệm của đề tài. Khi người dùng nhấn gửi đơn ứng tuyển, giao diện phải hiển thị trạng thái đang xử lý và tạm khóa nút xác nhận nhằm ngăn thao tác nhấn lặp tạo ra hai yêu cầu trùng nhau.

Về độ tin cậy và xử lý tình huống phát sinh, hệ thống phải phân biệt rõ trường hợp tìm kiếm không có kết quả phù hợp với trường hợp lỗi kết nối không tải được dữ liệu để thông báo đúng nguyên nhân cho người dùng. Trong quá trình ứng viên đang chuẩn bị hồ sơ, nếu tin tuyển dụng vừa chuyển sang trạng thái đóng hoặc hết hạn, hệ thống phải chặn việc tạo đơn mới nhưng vẫn giữ nguyên thông tin liên hệ, bản hồ sơ đã chọn và nội dung thư giới thiệu trên biểu mẫu để ứng viên không bị mất dữ liệu đã nhập. Nếu mất kết nối mạng ngay sau khi nhấn gửi, hệ thống cần kiểm tra xác minh đơn đã được ghi nhận trong cơ sở dữ liệu hay chưa trước khi cho phép gửi lại.

Về khả năng sử dụng và giao diện, các màn hình giữ bố cục, màu sắc và nhãn tiếng Việt thống nhất; mọi trạng thái quan trọng đều có nhãn chữ đi kèm thay vì chỉ phân biệt bằng màu sắc. Khi người dùng mở xem chi tiết một tin tuyển dụng rồi quay lại danh sách, hệ thống giữ nguyên từ khóa, các điều kiện lọc và vị trí trang đang tra cứu. Trên các biểu mẫu nhập liệu, thông báo lỗi được đặt ngay tại trường dữ liệu chưa hợp lệ và giữ lại các nội dung người dùng đã nhập đúng.

Về khả năng bảo trì và mở rộng, phần mềm phân tách rõ giữa giao diện phía máy khách dùng ReactJS và dịch vụ phía máy chủ dùng Node.js, Express giao tiếp qua RESTful API, kết nối với cơ sở dữ liệu quan hệ Microsoft SQL Server đạt dạng chuẩn 3. Cách tổ chức tách lớp giúp nhóm dễ kiểm tra riêng từng phần giao diện, quy tắc nghiệp vụ và câu lệnh truy vấn, đồng thời thuận tiện khi cần bổ sung chức năng mới.

e. Dữ liệu đầu vào:

Bảng 3.3: Đặc tả các luồng dữ liệu đầu vào của hệ thống

| Số thứ tự | Luồng dữ liệu đầu vào | Nguồn phát sinh | Cấu trúc và Định dạng dữ liệu | Quy tắc kiểm tra và Ràng buộc hợp lệ |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Thông tin đăng ký tài khoản | Người tìm việc, Nhà tuyển dụng | Chuỗi ký tự: Họ tên, Email, Mật khẩu, Số điện thoại, Vai trò | Email đúng định dạng và chưa tồn tại trong bảng Users; Mật khẩu tối thiểu 8 ký tự gồm chữ hoa, chữ thường và chữ số; Số điện thoại gồm 10 chữ số |
| 2 | Dữ liệu hồ sơ trực tuyến | Người tìm việc | Chuỗi ký tự và ngày tháng: Thông tin liên hệ, Mục tiêu nghề nghiệp, Học vấn, Kinh nghiệm, Kỹ năng, Dự án | Các trường bắt buộc không được để trống; thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu |
| 3 | Tệp tài liệu hồ sơ đính kèm | Người tìm việc | Tệp tài liệu định dạng .pdf | Chỉ chấp nhận định dạng .pdf, dung lượng tệp tối đa 5 MB; tệp phải tải lên hoàn tất và đọc được thông tin dung lượng, số trang trước khi chuyển sang bước kiểm tra |
| 4 | Hồ sơ pháp lý doanh nghiệp | Nhà tuyển dụng | Tên doanh nghiệp, Quy mô nhân sự, Mã số thuế, Giấy chứng nhận đăng ký doanh nghiệp, Địa chỉ, Logo | Mã số thuế gồm 10 hoặc 13 chữ số và duy nhất trên hệ thống; quy mô nhân sự thuộc các mức: dưới 50, từ 50 đến 200 hoặc trên 500 nhân sự |
| 5 | Dữ liệu bài đăng tuyển dụng | Nhà tuyển dụng | Tiêu đề, Ngành nghề, Số lượng tuyển, Mức lương, Địa điểm, Hình thức làm việc, Mô tả, Kỹ năng yêu cầu và trọng số, Hạn nộp | Doanh nghiệp phải ở trạng thái đã xác thực; mức lương tối đa lớn hơn hoặc bằng mức lương tối thiểu (hoặc đánh dấu lương thỏa thuận); hạn nộp hồ sơ phải lớn hơn ngày hiện tại (tối thiểu 3 ngày khi gửi duyệt tin mới) |
| 6 | Dữ liệu tương tác ứng tuyển | Người tìm việc | Mã tin tuyển dụng (JobID), Mã bản hồ sơ (ResumeID), Thông tin liên hệ, Thư giới thiệu (CoverLetter), Xác nhận đồng ý chia sẻ dữ liệu | Ứng viên đã đăng nhập; bản hồ sơ thuộc chính ứng viên đó; tin tuyển dụng đang hoạt động và còn hạn; chưa có đơn đang xử lý của cùng ứng viên cho cùng tin; thư giới thiệu không bắt buộc, tối đa 2.000 ký tự |
| 7 | Tiêu chí truy vấn tìm kiếm | Khách vãng lai, Người tìm việc | Từ khóa, Mã ngành nghề, Địa điểm làm việc, Mức lương tối thiểu, Kinh nghiệm, Hình thức làm việc | Làm sạch chuỗi ký tự tìm kiếm; kết hợp đồng thời các bộ lọc trên tập tin tuyển dụng đang hoạt động (Active) và còn hạn nhận hồ sơ |

Các luồng dữ liệu đầu vào đều được kiểm tra ở hai bước: kiểm tra định dạng, giới hạn ký tự và các trường bắt buộc ngay trên biểu mẫu giao diện để báo lỗi kịp thời cho người dùng; sau đó kiểm tra lại quyền sở hữu dữ liệu, trạng thái nghiệp vụ và ràng buộc toàn vẹn tại tầng máy chủ trước khi ghi vào cơ sở dữ liệu.

f. Dữ liệu đầu ra:

Bảng 3.4: Đặc tả các luồng dữ liệu đầu ra của hệ thống

| Số thứ tự | Luồng dữ liệu đầu ra | Hình thức thể hiện | Đối tượng tiếp nhận | Nội dung thông tin cung cấp | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Bản hồ sơ ứng tuyển | Tệp tài liệu định dạng .pdf và giao diện xem trước | Người tìm việc, Nhà tuyển dụng | Hồ sơ hoàn chỉnh trình bày thông tin liên hệ, học vấn, kinh nghiệm, kỹ năng, dự án của ứng viên | Cung cấp tài liệu thống nhất để ứng viên kiểm tra trước khi gửi và doanh nghiệp đọc khi xét tuyển |
| 2 | Danh sách việc làm và gợi ý kỹ năng | Giao diện danh sách có phân trang và thẻ gợi ý | Khách vãng lai, Người tìm việc | Chức danh, doanh nghiệp, mức lương, địa điểm, tổng số kết quả; tỷ lệ khớp kỹ năng kèm danh sách kỹ năng đã khớp và chưa khai báo | Giúp ứng viên so sánh các vị trí, hiểu căn cứ gợi ý và chọn đúng công việc muốn ứng tuyển |
| 3 | Bảng quản lý ứng viên | Bảng giao diện phân theo 5 giai đoạn xét tuyển | Nhà tuyển dụng | Danh sách đơn ứng tuyển theo vị trí gồm 5 giai đoạn: Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc, Chưa phù hợp | Giúp doanh nghiệp theo dõi, chấm điểm, ghi chú nội bộ và xử lý hồ sơ tập trung theo từng vị trí |
| 4 | Xác nhận đơn và thông báo phản hồi | Màn hình xác nhận, thông báo hệ thống và email | Người tìm việc, Nhà tuyển dụng | Mã đơn ứng tuyển, thời điểm gửi, bản hồ sơ đã nộp, trạng thái xử lý đơn, thư mời phỏng vấn hoặc thư phản hồi kết quả | Giúp hai bên tra cứu cùng một đơn ứng tuyển và nắm bắt kịp thời tiến trình xét tuyển |
| 5 | Hàng đợi kiểm duyệt | Giao diện danh sách đối soát và phê duyệt | Cán bộ kiểm duyệt, Quản trị viên | Hồ sơ pháp lý doanh nghiệp chờ xác thực và danh sách tin tuyển dụng ở trạng thái Chờ duyệt | Bảo đảm chỉ doanh nghiệp hợp lệ và tin tuyển dụng đạt yêu cầu mới được công bố |
| 6 | Báo cáo thống kê vận hành | Biểu đồ và bảng số liệu tổng hợp | Quản trị viên hệ thống, Nhà tuyển dụng | Số lượng tài khoản, số tin đang hoạt động, tổng số đơn ứng tuyển và kết quả xử lý theo từng giai đoạn | Hỗ trợ nhà tuyển dụng và ban quản trị theo dõi tình hình hoạt động của hệ thống |

Dữ liệu đầu ra được trình bày phù hợp với từng mục đích sử dụng: giao diện danh sách và bảng quản lý phục vụ thao tác trực tiếp trên trình duyệt, tệp PDF phục vụ xem trước và lưu trữ hồ sơ, cùng dữ liệu định dạng JSON trao đổi giữa máy chủ và máy khách.

g. Ràng buộc hệ thống:

Về thời gian thực hiện, dự án được triển khai trong 12 tuần của học phần Công nghệ phần mềm với sáu mốc kiểm soát: tuần 1 và 2 khảo sát, xác định yêu cầu; tuần 3 và 4 phân tích, mô hình hóa; tuần 5 và 6 thiết kế kiến trúc, dữ liệu và giao diện; tuần 7 đến 9 lập trình; tuần 10 và 11 kiểm thử, sửa lỗi; tuần 12 đóng gói và nghiệm thu.

Về công nghệ sử dụng, giao diện phía máy khách dùng thư viện ReactJS kết hợp JavaScript, TypeScript và CSS; phần xử lý phía máy chủ dùng Node.js và Express cung cấp các RESTful API; cơ sở dữ liệu quan hệ dùng Microsoft SQL Server với đầy đủ các ràng buộc khóa chính, khóa ngoại, kiểm tra giá trị và chỉ mục truy vấn.

Về nguồn lực và kinh phí, dự án do nhóm sáu sinh viên thực hiện, không có kinh phí mua bản quyền thương mại hoặc thuê máy chủ chuyên dụng. Nhóm sử dụng các công cụ phát triển miễn phí, máy chủ phát triển nội bộ và dịch vụ dùng thử để xây dựng và kiểm chứng sản phẩm.

Về pháp lý và quyền riêng tư dữ liệu, hệ thống tuân thủ các quy định của Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân: phân quyền chặt chẽ theo vai trò tài khoản, không công khai trái phép thông tin liên hệ của ứng viên và chỉ chia sẻ bản hồ sơ cho doanh nghiệp khi ứng viên chủ động xác nhận nộp đơn ứng tuyển; đồng thời yêu cầu xác thực thông tin pháp lý doanh nghiệp và kiểm duyệt nội dung trước khi công bố tin tuyển dụng.

---

3.2. Phân tích và đặc tả yêu cầu

3.2.1. Cơ sở lý thuyết của phương pháp phân tích có cấu trúc

Trong công nghệ phần mềm, phân tích và đặc tả yêu cầu là bước chuyển các yêu cầu người dùng đã thu thập ở giai đoạn khảo sát thành mô hình kỹ thuật rõ ràng, nhất quán để làm căn cứ cho thiết kế cơ sở dữ liệu và giao diện. Đối với đề tài xây dựng hệ thống TalentConnect, nhóm áp dụng phương pháp phân tích có cấu trúc nhằm làm rõ cả dữ liệu cần lưu trữ lẫn các bước xử lý nghiệp vụ.

Phương pháp phân tích có cấu trúc tiếp cận hệ thống theo nguyên tắc phân rã chức năng từ tổng quát đến chi tiết và theo dõi sự di chuyển, biến đổi của các luồng dữ liệu. Hệ thống được mô hình hóa thông qua mối liên hệ giữa các tác nhân bên ngoài, các tiến trình xử lý nghiệp vụ và các kho lưu trữ dữ liệu.

Để các sơ đồ luồng dữ liệu phản ánh đúng bài toán thực tế, quá trình phân tích kết hợp chặt chẽ giữa đặc tả thực thể dữ liệu và đặc tả quy tắc xử lý nghiệp vụ:

Ở phần đặc tả thực thể dữ liệu, nhóm xác định từng đối tượng thông tin cần quản lý, danh sách thuộc tính, kiểu dữ liệu, khóa chính, khóa ngoại và các ràng buộc toàn vẹn. Đây là cơ sở trực tiếp để tổ chức bốn kho dữ liệu từ D1 đến D4 trong sơ đồ luồng dữ liệu và thiết kế các bảng quan hệ ở giai đoạn sau.

Ở phần đặc tả quy tắc xử lý, nhóm làm rõ sự thay đổi trạng thái của dữ liệu qua từng chức năng. Mỗi tiến trình nhận dữ liệu đầu vào từ tác nhân hoặc đọc từ kho lưu trữ, kiểm tra điều kiện nghiệp vụ như quyền sở hữu hồ sơ, hạn nhận đơn, điều kiện chống nộp trùng rồi ghi kết quả mới vào kho dữ liệu và trả phản hồi cho người dùng. Mô tả rõ cấu trúc thuộc tính gắn liền với quy tắc xử lý giúp mọi luồng dữ liệu trên sơ đồ đều có nguồn gốc và đích đến xác định.

3.2.2. Đặc tả đối tượng của hệ thống

a. Đối tượng Người tìm việc:

Thông tin người tìm việc lưu trong bảng hồ sơ ứng viên, liên kết một - một với bảng tài khoản người dùng qua mã tài khoản duy nhất. Mỗi bản ghi ứng viên có mã định danh tự tăng, lưu họ và tên, ngày sinh, giới tính, số điện thoại liên hệ, địa chỉ, đường dẫn ảnh đại diện, mục tiêu nghề nghiệp và trạng thái sẵn sàng tìm việc. Cách tách bảng tài khoản và bảng ứng viên giúp hệ thống lấy danh tính người dùng trực tiếp từ phiên đăng nhập mà không yêu cầu ứng viên tự nhập mã nội bộ khi thao tác.

Trong quá trình sử dụng, người tìm việc cập nhật thông tin cá nhân và mục tiêu nghề nghiệp; khai báo học vấn, kinh nghiệm, kỹ năng, chứng chỉ và dự án; chuẩn bị các bản hồ sơ trực tuyến hoặc tải tệp PDF; tìm kiếm việc làm, xem gợi ý theo mức khớp kỹ năng và lưu tin quan tâm; chọn bản hồ sơ để nộp đơn ứng tuyển vào vị trí đang mở và theo dõi trạng thái xử lý đơn cùng lịch phỏng vấn từ doanh nghiệp.

b. Đối tượng Doanh nghiệp và Nhà tuyển dụng:

Đơn vị tuyển dụng được quản lý qua bảng thông tin doanh nghiệp, liên kết với tài khoản đại diện của nhà tuyển dụng và bảng địa điểm làm việc. Mỗi doanh nghiệp có mã định danh riêng cùng các thuộc tính gồm tên pháp nhân đầy đủ, mã số thuế 10 hoặc 13 chữ số duy nhất trên toàn hệ thống, lĩnh vực hoạt động, quy mô nhân sự, địa chỉ trang thông tin điện tử, mô tả giới thiệu đơn vị, đường dẫn biểu trưng, tệp giấy phép kinh doanh và trạng thái xác thực pháp lý gồm chờ xác thực, đã xác thực hoặc từ chối.

Doanh nghiệp cung cấp thông tin đơn vị và mã số thuế để ban quản trị đối soát pháp lý; thiết lập danh sách trụ sở và chi nhánh làm việc; soạn thảo, lưu nháp, gửi duyệt và quản lý vòng đời các tin tuyển dụng; tiếp nhận đơn ứng tuyển theo đúng vị trí thuộc quyền sở hữu của đơn vị; đánh giá hồ sơ, chuyển giai đoạn xét tuyển, lập lịch phỏng vấn và gửi phản hồi kết quả cho ứng viên.

c. Đối tượng Bài đăng tuyển dụng:

Mỗi nhu cầu tuyển người của doanh nghiệp biểu diễn thành một bản ghi trong bảng tin tuyển dụng, gắn với doanh nghiệp đăng tin, nhóm ngành nghề và địa điểm làm việc. Các thuộc tính chi tiết gồm chức danh công việc, mô tả nhiệm vụ, yêu cầu chuyên môn, quyền lợi, mức lương tối thiểu, mức lương tối đa, cờ đánh dấu lương thỏa thuận, yêu cầu kinh nghiệm, hình thức làm việc, số lượng cần tuyển, hạn nhận hồ sơ, trạng thái tin gồm năm giá trị nháp, chờ duyệt, đang hoạt động, hết hạn hoặc đã đóng, cùng số lượt xem và thời điểm tạo. Đi kèm với bảng tin tuyển dụng là bảng kỹ năng yêu cầu của tin, lưu danh sách mã kỹ năng, cờ bắt buộc và trọng số ưu tiên từ 1 đến 5 làm căn cứ tính mức khớp kỹ năng.

Theo quy tắc nghiệp vụ, nhà tuyển dụng chỉ gửi duyệt được tin khi doanh nghiệp đã xác thực pháp lý, mức lương tối đa không nhỏ hơn mức lương tối thiểu và hạn nhận hồ sơ lớn hơn ngày hiện tại tối thiểu 3 ngày. Khi được cán bộ kiểm duyệt chấp thuận, tin chuyển sang trạng thái đang hoạt động để hiển thị cho người tìm việc; khi quá hạn nhận đơn hoặc đã tuyển đủ người, tin chuyển sang trạng thái hết hạn hoặc đã đóng và ngừng nhận đơn ứng tuyển mới.

d. Đối tượng Hồ sơ năng lực trực tuyến:

Dữ liệu hồ sơ của ứng viên gồm bảng quản lý phiên bản hồ sơ và năm bảng thành phần gắn với mã ứng viên: quá trình học vấn, kinh nghiệm làm việc, kỹ năng chuyên môn liên kết với từ điển kỹ năng dùng chung, chứng chỉ chuyên môn và dự án đã thực hiện. Trong bảng quản lý phiên bản hồ sơ, mỗi bản ghi có mã hồ sơ, mã ứng viên sở hữu, tên bản hồ sơ, mã mẫu trình bày, đường dẫn tệp PDF, cờ đánh dấu bản mặc định cùng thời điểm tạo và cập nhật.

Một ứng viên có thể chuẩn bị và lưu nhiều bản hồ sơ khác nhau để sử dụng cho từng vị trí công việc. Hệ thống giữ nguyên nội dung hồ sơ đã nộp: khi một bản hồ sơ đã gắn vào đơn ứng tuyển, nếu sau đó ứng viên chỉnh sửa hồ sơ cho những lần ứng tuyển tiếp theo thì phần mềm lưu thành bản mới, còn đơn cũ vẫn giữ nguyên bản tài liệu đã gửi để nhà tuyển dụng và ứng viên đối chiếu thống nhất.

e. Đối tượng Đơn ứng tuyển và Lịch sử xử lý:

Bảng đơn ứng tuyển ghi nhận mỗi lần ứng viên gửi hồ sơ vào một vị trí tuyển dụng cụ thể. Cấu trúc bảng gồm 10 trường dữ liệu: mã đơn ứng tuyển làm khóa chính, mã tin tuyển dụng được chọn, mã ứng viên gửi đơn, mã bản hồ sơ đã gửi, nội dung thư giới thiệu tối đa 2.000 ký tự, trạng thái xử lý đơn, mức khớp kỹ năng tại thời điểm ứng tuyển, điểm đánh giá nội bộ của doanh nghiệp từ 1 đến 5, thời điểm gửi và thời điểm cập nhật.

Khi ứng viên gửi đơn hợp lệ, hệ thống kiểm tra bản hồ sơ thuộc đúng ứng viên đó và chưa có đơn đang xử lý cho cùng vị trí. Trạng thái ban đầu của đơn là Đã gửi hồ sơ; những bước xử lý sau của doanh nghiệp gồm Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc, Nhận việc hoặc Chưa phù hợp. Thao tác nộp đơn của ứng viên không tự gán kết quả tuyển chọn hay điểm đánh giá nội bộ. Mọi lần chuyển trạng thái trên bảng quản lý ứng viên đều ghi vết vào bảng lịch sử xử lý đơn gồm mã lịch sử, mã đơn, trạng thái cũ, trạng thái mới, người thao tác, ghi chú và thời điểm thay đổi, đồng thời gửi thông báo cho ứng viên.

f. Đối tượng Lịch phỏng vấn và Đánh giá:

Khi nhà tuyển dụng chuyển một đơn ứng tuyển sang bước phỏng vấn, thông tin tổ chức phỏng vấn được lưu vào bảng lịch phỏng vấn liên kết trực tiếp với mã đơn ứng tuyển. Các thuộc tính của bảng gồm mã lịch phỏng vấn, vòng phỏng vấn, thời điểm diễn ra, thời lượng dự kiến tính bằng phút, hình thức phỏng vấn trực tuyến hoặc trực tiếp, liên kết phòng họp hoặc địa chỉ văn phòng, tên người phỏng vấn, nhận xét đánh giá sau buổi phỏng vấn và kết quả phỏng vấn.

Dựa trên bản ghi lịch phỏng vấn vừa tạo, hệ thống gửi thông báo và thư mời chứa đầy đủ thời gian, hình thức và địa điểm hoặc liên kết phòng họp để ứng viên tham dự. Sau buổi phỏng vấn, nhà tuyển dụng ghi nhận kết quả đánh giá làm căn cứ chuyển đơn sang giai đoạn đề xuất nhận việc hoặc từ chối.

g. Đối tượng Thông báo và Nhật ký hệ thống:

Hệ thống quản lý thông báo người dùng và giám sát truy cập qua hai bảng độc lập. Bảng thông báo lưu các bản tin gửi tới từng tài khoản gồm mã thông báo, mã tài khoản nhận, tiêu đề, nội dung, phân loại thông báo, mã dữ liệu tham chiếu, trạng thái đã đọc và thời điểm tạo. Mã dữ liệu tham chiếu giúp người nhận mở đúng đơn ứng tuyển, tin tuyển dụng hoặc lịch phỏng vấn khi nhấn vào thông báo; do có thể trỏ đến nhiều loại dữ liệu khác nhau nên trường này không thiết lập thành khóa ngoại cứng chỉ dành cho bảng đơn ứng tuyển.

Bên cạnh đó, bảng nhật ký hệ thống ghi nhận các thao tác quản trị và bảo mật quan trọng gồm mã nhật ký, tài khoản thực hiện, hành động, bảng dữ liệu tác động, mã bản ghi tác động, địa chỉ mạng và thời điểm thực hiện, hỗ trợ quản trị viên tra cứu và kiểm tra an toàn vận hành.

3.2.3. Phân tích yêu cầu hệ thống bằng Sơ đồ ngữ cảnh và Sơ đồ mức không

Để mô hình hóa ranh giới hệ thống và sự luân chuyển thông tin giữa các chức năng của TalentConnect, nhóm sử dụng Sơ đồ ngữ cảnh (DFD mức ngữ cảnh) và Sơ đồ luồng dữ liệu mức 0, mức 1 theo phương pháp phân tích có cấu trúc.

a. Phân tích yêu cầu hệ thống qua Sơ đồ ngữ cảnh:

[[IMAGE: assets/diagrams/hinh_3_1_dfd_context.png | Caption: Hình ảnh 3.2.3.a. Sơ đồ ngữ cảnh.]]

Đối với tác nhân Người tìm việc:
Các luồng dữ liệu gửi vào hệ thống gồm: thông tin đăng ký và đăng nhập tài khoản; dữ liệu hồ sơ trực tuyến (học vấn, kinh nghiệm, kỹ năng, chứng chỉ, dự án) hoặc tệp hồ sơ PDF tải lên; từ khóa và các điều kiện lọc tìm kiếm việc làm (ngành nghề, địa điểm, mức lương, kinh nghiệm, hình thức làm việc); thông tin nộp đơn ứng tuyển (vị trí chọn ứng tuyển, bản hồ sơ sử dụng, thư giới thiệu, xác nhận đồng ý chia sẻ dữ liệu); và các báo cáo phản ánh tin đăng vi phạm.
Các luồng dữ liệu nhận từ hệ thống gồm: thông tin phiên làm việc sau khi xác thực; bản xem trước và tệp hồ sơ PDF đã xuất; danh sách việc làm thỏa mãn bộ lọc kèm các vị trí gợi ý và giải thích mức khớp kỹ năng; mã đơn ứng tuyển, trạng thái xử lý đơn cập nhật qua từng giai đoạn xét tuyển và thông tin chi tiết lịch phỏng vấn từ doanh nghiệp.

Đối với tác nhân Nhà tuyển dụng:
Các luồng dữ liệu gửi vào hệ thống gồm: thông tin hồ sơ doanh nghiệp, địa điểm làm việc, mã số thuế và giấy chứng nhận đăng ký doanh nghiệp; nội dung tin tuyển dụng, kỹ năng yêu cầu cùng trọng số ưu tiên; thao tác đánh giá, ghi chú nội bộ và chuyển giai đoạn ứng viên trên bảng quản lý; thông tin lập lịch phỏng vấn và nội dung phản hồi kết quả xét tuyển.
Các luồng dữ liệu nhận từ hệ thống gồm: kết quả xác thực pháp lý doanh nghiệp; kết quả kiểm duyệt tin tuyển dụng (được công bố hoặc cần chỉnh sửa kèm lý do); thông báo có đơn ứng tuyển mới cùng danh sách hồ sơ, thư giới thiệu và mức khớp kỹ năng của ứng viên theo từng vị trí; và số liệu thống kê tình hình tiếp nhận, xử lý hồ sơ của đơn vị.

Đối với tác nhân Ban quản trị hệ thống:
Các luồng dữ liệu gửi vào hệ thống gồm: quyết định phê duyệt hoặc từ chối xác thực doanh nghiệp sau khi đối soát thông tin pháp lý; quyết định chấp thuận công bố hoặc từ chối tin tuyển dụng chờ duyệt; thao tác phân quyền, khóa hoặc mở khóa tài khoản; và dữ liệu cập nhật danh mục ngành nghề, danh mục kỹ năng dùng chung.
Các luồng dữ liệu nhận từ hệ thống gồm: danh sách doanh nghiệp chờ xác thực pháp lý; hàng đợi các tin tuyển dụng chờ kiểm duyệt; danh sách phản ánh vi phạm từ người dùng; nhật ký thao tác hệ thống và báo cáo thống kê tổng hợp về tài khoản, tin đăng và đơn ứng tuyển.

b. Phân tích yêu cầu và phân rã chức năng qua Sơ đồ luồng dữ liệu mức 0:

[[IMAGE: assets/diagrams/hinh_3_2_dfd_level0.png | Caption: Hình ảnh 3.2.3.b. Sơ đồ luồng dữ liệu mức 0.]]

A. Phân tích cấu trúc bốn kho dữ liệu trung tâm (tổng cộng 28 bảng dữ liệu):

Kho dữ liệu D1 - Tài khoản và Phân quyền gồm 7 bảng Roles, Permissions, RolePermissions, Users, UserRoles, UserSessions, AuditLogs: lưu trữ thông tin định danh tài khoản, mật khẩu đã băm bằng bcrypt, trạng thái tài khoản, cấu trúc phân quyền theo vai trò, thông tin phiên đăng nhập và nhật ký hệ thống. Hệ thống truy xuất kho D1 để xác nhận danh tính người đang thao tác và kiểm tra quyền hạn trước khi chạy các chức năng nghiệp vụ.

Kho dữ liệu D2 - Hồ sơ và Ứng viên gồm 8 bảng Candidates, CandidateEducations, CandidateExperiences, CandidateSkills, CandidateCertificates, CandidateProjects, Resumes, SavedJobs: lưu trữ thông tin cá nhân của người tìm việc, các mục học vấn, kinh nghiệm, kỹ năng đã khai báo, chứng chỉ, dự án, các bản hồ sơ ứng tuyển và danh sách việc làm đã lưu. Kho D2 cung cấp dữ liệu kỹ năng cho bước tính mức khớp và cung cấp bản hồ sơ cho quá trình nộp đơn.

Kho dữ liệu D3 - Doanh nghiệp và Tin tuyển dụng gồm 6 bảng Employers, CompanyLocations, Categories, Skills, Jobs, JobSkills: lưu trữ thông tin pháp lý và trạng thái xác thực của doanh nghiệp, địa điểm làm việc, danh mục ngành nghề, danh mục kỹ năng dùng chung, thông tin chi tiết của các tin tuyển dụng và danh sách kỹ năng yêu cầu kèm trọng số của từng tin. Kho D3 phục vụ quản lý tin đăng, tra cứu tìm kiếm, đối chiếu kỹ năng và kiểm tra tình trạng nhận hồ sơ.

Kho dữ liệu D4 - Ứng tuyển và Vận hành gồm 7 bảng Applications, ApplicationHistories, Interviews, FollowedCompanies, CompanyReviews, JobAlerts, Notifications: lưu trữ các đơn ứng tuyển đã gửi, lịch sử chuyển trạng thái và ghi chú xử lý đơn, lịch phỏng vấn, thông tin theo dõi và đánh giá doanh nghiệp, cấu hình nhận gợi ý việc làm và danh sách thông báo gửi tới người dùng.

B. Phân tích năm tiến trình chức năng từ Tiến trình 1.0 đến Tiến trình 5.0:

Tiến trình 1.0 - Quản lý tài khoản, định danh và phân quyền:
Tiến trình tiếp nhận yêu cầu đăng ký, đăng nhập và quản lý phiên làm việc từ các tác nhân. Khi đăng ký, tiến trình kiểm tra định dạng email, số điện thoại và kiểm tra trùng lặp trên kho D1, sau đó băm mật khẩu bằng bcrypt và ghi bản ghi tài khoản cùng vai trò tương ứng vào D1. Khi đăng nhập, tiến trình đối chiếu thông tin xác thực với D1, khởi tạo phiên làm việc trong bảng UserSessions, cấp mã JWT và ghi nhận sự kiện vào bảng AuditLogs thuộc kho D1.

Tiến trình 2.0 - Quản lý hồ sơ năng lực trực tuyến:
Tiến trình tiếp nhận thông tin cá nhân, học vấn, kinh nghiệm, kỹ năng, chứng chỉ và dự án do người tìm việc nhập hoặc tệp PDF tải lên. Sau khi kiểm tra các trường bắt buộc và thứ tự thời gian hợp lệ, tiến trình cập nhật dữ liệu vào các bảng tương ứng trong kho D2. Khi ứng viên yêu cầu xem trước hoặc xuất tệp PDF, tiến trình đọc dữ liệu từ D2, kết xuất thành bản hồ sơ hoàn chỉnh và lưu đường dẫn tệp vào bảng Resumes để sẵn sàng sử dụng khi ứng tuyển.

Tiến trình 3.0 - Quản lý tin tuyển dụng và kiểm duyệt:
Tiến trình xử lý quy trình công bố và quản lý vòng đời tin tuyển dụng. Khi nhà tuyển dụng gửi duyệt tin, tiến trình đọc kho D3 để xác nhận doanh nghiệp đã xác thực pháp lý, kiểm tra khoảng lương và hạn nhận hồ sơ hợp lệ rồi lưu tin ở trạng thái chờ duyệt. Khi cán bộ kiểm duyệt xem hàng đợi và phê duyệt, tiến trình chuyển trạng thái tin trong D3 sang đang hoạt động và ghi thông báo vào kho D4 để báo cho doanh nghiệp; nếu từ chối thì lưu lý do để doanh nghiệp chỉnh sửa. Định kỳ hàng ngày, tiến trình kiểm tra hạn nhận hồ sơ trong D3 để chuyển các tin quá hạn sang trạng thái hết hạn.

Tiến trình 4.0 - Tìm kiếm, gợi ý và nộp đơn ứng tuyển:
Tiến trình kết nối người tìm việc với các cơ hội việc làm đang mở và tiếp nhận hồ sơ ứng tuyển. Khi người dùng tìm việc, tiến trình lọc các tin đang hoạt động và còn hạn trong kho D3 theo các điều kiện đã chọn, đồng thời đối chiếu kỹ năng ứng viên trong D2 với kỹ năng yêu cầu của tin trong D3 để tính tỷ lệ khớp kỹ năng. Khi ứng viên xác nhận gửi hồ sơ cho một vị trí, tiến trình xác nhận danh tính từ D1, kiểm tra quyền sở hữu bản hồ sơ trong D2, kiểm tra tình trạng nhận đơn của tin trong D3 và kiểm tra chống nộp trùng trong D4, sau đó ghi đơn mới vào bảng Applications thuộc kho D4 với trạng thái Đã gửi hồ sơ và tạo thông báo cho doanh nghiệp.

Tiến trình 5.0 - Quản lý ứng viên theo giai đoạn và thống kê vận hành:
Đối với nhà tuyển dụng, tiến trình đọc danh sách đơn ứng tuyển của từng vị trí từ kho D4 kết hợp thông tin hồ sơ từ kho D2 để hiển thị lên bảng quản lý gồm năm giai đoạn: Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp. Khi nhà tuyển dụng chấm điểm nội bộ, chuyển giai đoạn hoặc lập lịch phỏng vấn, tiến trình cập nhật bảng Applications, ghi lịch sử vào ApplicationHistories, lưu lịch phỏng vấn vào Interviews và tạo thông báo trong bảng Notifications thuộc kho D4 gửi tới ứng viên. Đối với ban quản trị, tiến trình tổng hợp dữ liệu từ cả bốn kho D1, D2, D3, D4 để xuất các báo cáo thống kê vận hành hệ thống.

c. Sơ đồ luồng dữ liệu mức 1 cho các tiến trình trọng tâm:

[[IMAGE: assets/diagrams/hinh_3_3_dfd_level1_jobs.png | Caption: Hình ảnh 3.2.3.c. Sơ đồ luồng dữ liệu mức 1 - Tiến trình Đăng và duyệt tin tuyển dụng.]]

Ở Tiến trình 3.0 về công bố và quản lý tin tuyển dụng, luồng xử lý phân rã thành ba bước liên tiếp: Tiểu tiến trình 3.1 tiếp nhận thông tin vị trí tuyển dụng và danh sách kỹ năng yêu cầu từ nhà tuyển dụng, kiểm tra trạng thái xác thực của doanh nghiệp cùng các ràng buộc về khoảng lương, hạn nhận đơn rồi ghi vào kho D3 ở trạng thái chờ duyệt; Tiểu tiến trình 3.2 cung cấp danh sách tin chờ duyệt cho cán bộ kiểm duyệt, tiếp nhận quyết định chấp thuận hoặc từ chối để cập nhật trạng thái tin trong D3 và tạo thông báo phản hồi qua kho D4; Tiểu tiến trình 3.3 kiểm tra hạn nhận hồ sơ định kỳ để chuyển các tin đã quá hạn sang trạng thái hết hạn và ngừng nhận đơn mới.

Đối với Tiến trình 4.0 (Tìm kiếm, gợi ý và nộp đơn ứng tuyển), nhóm đi sâu phân tích chi tiết vì đây là nơi người tìm việc trực tiếp tiếp cận nhu cầu tuyển dụng và gửi hồ sơ đến doanh nghiệp. Một lần sử dụng thành công phải giúp ứng viên hiểu công việc, chọn đúng bản hồ sơ, xác nhận đúng người nhận và nhận được mã đơn có thể tra cứu. Tình huống thiết kế xuyên suốt sử dụng ứng viên Nguyễn Minh Anh tìm vị trí Frontend Developer tại Hà Nội, mức lương từ 14 triệu đồng và hình thức toàn thời gian; ứng viên chọn tin của FPT Software, kiểm tra hồ sơ rồi xác nhận gửi.

[[IMAGE: assets/diagrams/hinh_3_4_a_dfd_apply_overview.png | Caption: Hình ảnh 3.2.3.d. Sơ đồ luồng dữ liệu tổng quát chức năng tìm kiếm, gợi ý và tiếp nhận đơn (Tiến trình 4.0).]]

Trên sơ đồ tổng quát của Tiến trình 4.0, hình chữ nhật biểu diễn người hoặc tổ chức trao đổi với phần mềm; khối bo góc biểu diễn xử lý; khối mở cạnh biểu diễn nơi lưu dữ liệu; mũi tên chỉ dữ liệu được gửi hoặc đọc theo hướng nào. Số 4.0 là mã của chức năng đang thiết kế và tên chức năng cho biết ý nghĩa nghiệp vụ.

Cụ thể, người tìm việc cung cấp tiêu chí để tìm tin, yêu cầu xem gợi ý hoặc gửi hồ sơ cho tin đã chọn; phần mềm trả danh sách việc làm, mức khớp kỹ năng hoặc kết quả tiếp nhận đơn. Với một lần nộp hồ sơ, dữ liệu cần có là tin được chọn, bản hồ sơ và thư giới thiệu nếu ứng viên muốn gửi kèm. Dữ liệu tài khoản và quyền truy cập được đọc từ kho Tài khoản và Phân quyền (D1) để xác nhận ai đang gửi; danh tính được lấy từ phiên đăng nhập, giúp ngăn việc đổi mã ứng viên rồi gửi thay người khác.

Kho Hồ sơ và Ứng viên (D2) cung cấp kỹ năng và bản hồ sơ đã chọn; khi ứng viên tải tệp mới, phần mềm kiểm tra và lưu bản hồ sơ vào kho này. Kho Doanh nghiệp và Tin tuyển dụng (D3) cung cấp công việc, lương, địa điểm, kỹ năng yêu cầu và tình trạng nhận đơn; dữ liệu này được dùng cả khi tìm kiếm và khi kiểm tra lần cuối trước lúc gửi. Kho Ứng tuyển và Vận hành (D4) lưu các đơn đã gửi để phát hiện nộp trùng; khi đủ điều kiện, phần mềm ghi đơn mới và thông báo cho doanh nghiệp sở hữu tin. Ứng viên nhận mã đơn, còn doanh nghiệp nhận thông báo có hồ sơ mới để mở đơn trong phần quản lý tuyển dụng.

Ví dụ cụ thể trên dữ liệu của đề tài: bản hồ sơ mã số 41 thuộc ứng viên mã số 17 được chọn để ứng tuyển vào tin tuyển dụng mã số 241. Phần mềm xác nhận hồ sơ thuộc người gửi, tin còn nhận đơn và chưa có đơn đang xử lý của ứng viên này cho cùng tin. Sau khi lưu đơn mã số 381, ứng viên nhận mã tra cứu TC-000381; doanh nghiệp đăng tin 241 nhận thông báo về đơn đó. Đây là kết quả cụ thể của các luồng ghi dữ liệu trên sơ đồ.

[[IMAGE: assets/diagrams/hinh_3_4_dfd_level1_apply.png | Caption: Hình ảnh 3.2.3.e. Sơ đồ luồng dữ liệu mức 1 - Ba bước xử lý tìm kiếm, gợi ý và tiếp nhận đơn (Tiến trình 4.1, 4.2, 4.3).]]

Khi phân rã chi tiết Tiến trình 4.0 ở mức 1, chức năng chia thành ba bước xử lý: tìm kiếm và lọc việc làm ở bước 4.1, đối chiếu kỹ năng để gợi ý ở bước 4.2, kiểm tra và ghi nhận đơn ở bước 4.3. Các kho dữ liệu và dữ liệu trao đổi với hai bên giữ thống nhất với sơ đồ tổng quát:

Về xử lý tìm kiếm và gợi ý việc làm tại Tiến trình 4.1 và 4.2:
Khi nhận từ khóa và điều kiện lọc, phần mềm lấy các tin đang hoạt động, còn hạn nhận hồ sơ rồi áp dụng đồng thời ngành nghề, địa điểm, kinh nghiệm, lương và hình thức làm việc. Địa điểm được xét theo nơi làm việc của tin. Nếu người dùng chọn mức lương tối thiểu 14 triệu đồng, khoảng lương của tin phải có phần đáp ứng ngưỡng này; các tin lương thỏa thuận được nhận biết riêng, không tự coi là đạt mức lương cụ thể.
Danh sách trả về gồm chức danh, doanh nghiệp, lương, địa điểm, thời điểm cập nhật và tổng số kết quả. Khi mở xem chi tiết một tin rồi quay lại, bộ lọc và vị trí danh sách được giữ nguyên. Trường hợp không có kết quả phù hợp thì giao diện cho phép bỏ từng điều kiện lọc để tìm lại; trường hợp lỗi tải dữ liệu thì báo lỗi kết nối và cho thử lại, vì hai tình huống này có bản chất khác nhau và cần cách xử lý khác nhau.
Để gợi ý việc làm, phần mềm đối chiếu các mã kỹ năng ứng viên đã khai báo trong D2 với kỹ năng yêu cầu của tin trong D3. Trong thiết kế này, mức khớp bằng tổng trọng số kỹ năng đã khớp chia cho tổng trọng số kỹ năng yêu cầu, sau đó nhân 100. Chẳng hạn, nếu tin tuyển dụng yêu cầu ReactJS có trọng số 3, TypeScript có trọng số 2, HTML/CSS có trọng số 1 và Git có trọng số 2 (tổng trọng số bằng 8), khi ứng viên đã khai báo ReactJS, TypeScript và Git thì tổng trọng số đạt được là 7/8, tương đương 87,5%, làm tròn hiển thị 88%. Giao diện giải thích rõ cả ba kỹ năng đã khớp và kỹ năng HTML/CSS chưa được khai báo. Thiếu khai báo một kỹ năng trên hồ sơ không đồng nghĩa ứng viên không có kỹ năng đó, và điểm khớp kỹ năng cũng không phải xác suất được tuyển. Nếu hồ sơ hoặc tin thiếu dữ liệu kỹ năng, phần mềm không đưa ra tỷ lệ phần trăm thiếu căn cứ; việc gợi ý vẫn tuân theo tình trạng nhận hồ sơ của tin và các điều kiện lọc mà người dùng đã chọn.

Về xử lý kiểm tra và tiếp nhận hồ sơ (Tiến trình 4.3):
Trước khi ghi đơn, phần mềm kiểm tra tài khoản người tìm việc từ phiên đăng nhập, kiểm tra tin tuyển dụng còn nhận hồ sơ và bản hồ sơ được chọn thuộc đúng người gửi. Nếu ứng viên tải tệp hồ sơ mới, tệp được kiểm tra định dạng .pdf, dung lượng tối đa 5 MB rồi lưu thành một bản hồ sơ trong D2 trước khi gắn mã vào đơn. Tiếp theo, phần mềm kiểm tra đơn trùng của cùng ứng viên và cùng tin trong D4; nếu đã có đơn đang xử lý, hệ thống không tạo đơn mới mà cho phép ứng viên mở lại đơn cũ đã ghi nhận.
Một lần gửi hợp lệ tạo bản ghi đơn ứng tuyển có trạng thái Đã gửi hồ sơ, lưu mã tin tuyển dụng, mã ứng viên, mã bản hồ sơ, thư giới thiệu, mức khớp kỹ năng và thời điểm gửi. Hệ thống chỉ hiển thị thông báo thành công sau khi thao tác lưu hoàn tất vào cơ sở dữ liệu. Hai yêu cầu gửi đến gần như đồng thời phải được kiểm soát để tạo đúng một đơn duy nhất. Nếu tin tuyển dụng vừa chuyển sang trạng thái đóng trong lúc ứng viên đang chuẩn bị, bản hồ sơ đã chọn và nội dung thư giới thiệu vẫn được giữ trên biểu mẫu để ứng viên chọn lại công việc khác; nếu mất kết nối mạng sau khi nhấn gửi, phần mềm xác minh đơn đã được lưu hay chưa trước khi cho phép gửi lại.

d. Mô hình hóa Use Case và Đặc tả ca sử dụng chi tiết:

Song song với sơ đồ luồng dữ liệu, nhóm sử dụng biểu đồ Use Case theo ngôn ngữ mô hình hóa thống nhất UML để biểu diễn sự tham gia của các tác nhân vào từng chức năng của hệ thống:

[[IMAGE: assets/diagrams/hinh_3_5_usecase_general.png | Caption: Hình ảnh 3.2.3.f. Biểu đồ Use Case tổng thể hệ thống.]]

Trên sơ đồ tổng quát, khung chữ nhật thể hiện phạm vi hệ thống TalentConnect; hình người biểu diễn tác nhân và hình elip biểu diễn chức năng (ca sử dụng). Đường nối cho biết tác nhân tham gia chức năng nào, không biểu diễn thứ tự xử lý. Nhà tuyển dụng công bố tin và xử lý hồ sơ; người tìm việc tìm tin, chuẩn bị hồ sơ và ứng tuyển; ban quản trị tham gia kiểm duyệt và quản lý hoạt động hệ thống. Ba nhóm chức năng chính được liên kết chặt chẽ qua tin tuyển dụng, đơn ứng tuyển và kết quả xét tuyển.

Ví dụ, doanh nghiệp đăng một vị trí lập trình viên giao diện; sau khi tin được duyệt, ứng viên tìm thấy tin và gửi một bản hồ sơ. Doanh nghiệp nhận đơn tại đúng vị trí đó, mở hồ sơ, đánh giá rồi lập lịch nếu chọn phỏng vấn. Hệ thống gửi thư mời cho đúng ứng viên và cập nhật trạng thái của chính đơn đó. Nếu hồ sơ chưa phù hợp, doanh nghiệp gửi phản hồi từ chối; ứng viên xem kết quả ngay trên hệ thống mà không cần liên hệ riêng để hỏi đơn đã được xử lý hay chưa. Trong toàn bộ quá trình này, chức năng tài khoản và phân quyền bảo đảm từng người chỉ thao tác trên dữ liệu được phép; hồ sơ trực tuyến cung cấp tài liệu để nộp; kiểm duyệt tạo nguồn tin hợp lệ; và thông báo nối các bước xử lý giữa hai bên.

[[IMAGE: assets/diagrams/hinh_3_6_usecase_candidate.png | Caption: Hình ảnh 3.2.3.g. Biểu đồ Use Case phân hệ Người tìm việc.]]

[[IMAGE: assets/diagrams/hinh_3_7_usecase_employer.png | Caption: Hình ảnh 3.2.3.h. Biểu đồ Use Case phân hệ Nhà tuyển dụng.]]

[[IMAGE: assets/diagrams/hinh_3_8_usecase_admin.png | Caption: Hình ảnh 3.2.3.i. Biểu đồ Use Case phân hệ Quản trị viên.]]

Dưới đây là các bảng đặc tả chi tiết cho năm ca sử dụng đại diện của hệ thống:

Bảng 3.5: Đặc tả ca sử dụng UC01 – Tạo hồ sơ năng lực trực tuyến

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC01 |
| Tên ca sử dụng | Tạo và chỉnh sửa hồ sơ năng lực trực tuyến |
| Tác nhân thực hiện | Người tìm việc đã đăng nhập hệ thống |
| Mô tả tóm tắt | Cho phép người tìm việc nhập thông tin học vấn, kinh nghiệm, kỹ năng, dự án theo cấu trúc, xem trước bố cục và xuất tệp hồ sơ định dạng .pdf |
| Tiền điều kiện | Người tìm việc đã đăng nhập hợp lệ vào tài khoản ứng viên |
| Hậu điều kiện | Dữ liệu hồ sơ được lưu vào kho D2 (Candidates, Resumes và các bảng thành phần) và tệp .pdf sẵn sàng để chọn khi ứng tuyển |
| Luồng sự kiện chính | 1. Người tìm việc chọn chức năng Quản lý hồ sơ trên thanh điều hướng.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin hồ sơ cùng vùng xem trước trực tiếp.<br>3. Người tìm việc nhập thông tin liên hệ, mục tiêu nghề nghiệp, học vấn, kinh nghiệm làm việc, kỹ năng chuyên môn và dự án.<br>4. Người tìm việc chọn mẫu trình bày (TemplateID) và đặt tên cho bản hồ sơ (ResumeTitle).<br>5. Hệ thống cập nhật nội dung trên khung xem trước để ứng viên kiểm tra bố cục.<br>6. Người tìm việc nhấn nút Lưu hồ sơ.<br>7. Hệ thống kiểm tra các trường bắt buộc, thứ tự thời gian và lưu dữ liệu vào cơ sở dữ liệu.<br>8. Người tìm việc chọn Xuất tệp PDF; hệ thống kết xuất tệp .pdf và lưu đường dẫn vào bản ghi Resumes. |
| Luồng sự kiện thay thế | 7a. Nếu trường bắt buộc (như họ tên, email liên hệ) bị bỏ trống hoặc ngày kết thúc nhỏ hơn ngày bắt đầu, hệ thống hiển thị thông báo lỗi ngay tại trường tương ứng và giữ nguyên các nội dung đã nhập để người dùng sửa lại. |

Bảng 3.6: Đặc tả ca sử dụng UC02 – Đăng tin tuyển dụng mới

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC02 |
| Tên ca sử dụng | Đăng tin tuyển dụng mới |
| Tác nhân thực hiện | Nhà tuyển dụng |
| Mô tả tóm tắt | Nhà tuyển dụng soạn thông tin vị trí cần tuyển, yêu cầu kỹ năng kèm trọng số, mức lương và hạn nhận hồ sơ để gửi kiểm duyệt |
| Tiền điều kiện | Nhà tuyển dụng đã đăng nhập và doanh nghiệp đã được xác thực pháp lý (VerificationStatus = Verified) |
| Hậu điều kiện | Tin tuyển dụng mới được lưu vào bảng Jobs và JobSkills ở trạng thái chờ duyệt (Pending) và chuyển vào hàng đợi của người kiểm duyệt |
| Luồng sự kiện chính | 1. Nhà tuyển dụng chọn chức năng Đăng tin tuyển dụng trên trang quản lý doanh nghiệp.<br>2. Hệ thống kiểm tra trạng thái xác thực doanh nghiệp và hiển thị biểu mẫu soạn tin.<br>3. Nhà tuyển dụng nhập chức danh, ngành nghề, số lượng cần tuyển, mô tả nhiệm vụ, yêu cầu, quyền lợi, khoảng lương, địa điểm làm việc, hạn nhận hồ sơ và chọn các kỹ năng yêu cầu kèm trọng số ưu tiên.<br>4. Nhà tuyển dụng nhấn nút Gửi duyệt.<br>5. Hệ thống kiểm tra các trường bắt buộc, khoảng lương và hạn nhận hồ sơ.<br>6. Hệ thống lưu bản ghi tin tuyển dụng với trạng thái Pending (Chờ duyệt), ghi thời điểm tạo và thông báo đã gửi duyệt thành công. |
| Luồng sự kiện thay thế | 4a. Nếu nhà tuyển dụng chọn Lưu nháp, hệ thống lưu tin ở trạng thái Draft để chỉnh sửa tiếp mà chưa chuyển sang hàng đợi kiểm duyệt.<br>5a. Nếu hạn nhận hồ sơ nhỏ hơn hoặc cách ngày hiện tại dưới 3 ngày, hệ thống báo lỗi tại trường hạn nộp và yêu cầu chọn lại.<br>5b. Nếu mức lương tối đa nhỏ hơn mức lương tối thiểu, hệ thống yêu cầu điều chỉnh lại khoảng lương hợp lệ. |

Bảng 3.7: Đặc tả ca sử dụng UC03 – Tìm kiếm và lọc việc làm đa tiêu chí

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC03 |
| Tên ca sử dụng | Tìm kiếm và lọc việc làm đa tiêu chí |
| Tác nhân thực hiện | Khách vãng lai hoặc Người tìm việc |
| Mô tả tóm tắt | Người dùng nhập từ khóa kết hợp bộ lọc ngành nghề, địa điểm, mức lương, kinh nghiệm, hình thức làm việc và xem gợi ý theo mức khớp kỹ năng |
| Tiền điều kiện | Người dùng truy cập màn hình tìm kiếm việc làm của hệ thống |
| Hậu điều kiện | Hệ thống hiển thị danh sách tin tuyển dụng đang hoạt động (Active) và còn hạn đáp ứng đồng thời các điều kiện đã chọn, giữ nguyên bộ lọc khi xem chi tiết rồi quay lại |
| Luồng sự kiện chính | 1. Người dùng nhập từ khóa công việc hoặc kỹ năng và chọn địa điểm làm việc.<br>2. Người dùng chọn thêm các điều kiện lọc gồm ngành nghề, mức lương tối thiểu, kinh nghiệm, hình thức làm việc và nhấn Áp dụng bộ lọc.<br>3. Hệ thống truy vấn các tin đang Active và còn hạn trong kho D3 thỏa mãn đồng thời các điều kiện lọc.<br>4. Nếu người dùng đã đăng nhập tài khoản ứng viên và có khai báo kỹ năng, hệ thống đối chiếu với JobSkills để tính tỷ lệ khớp kỹ năng và hiển thị kèm giải thích các kỹ năng đã khớp / chưa khai báo.<br>5. Hệ thống hiển thị tổng số kết quả, các nhãn điều kiện đang áp dụng và danh sách việc làm có phân trang.<br>6. Người dùng nhấn vào tên vị trí hoặc Xem chi tiết để mở trang chi tiết tin tuyển dụng. |
| Luồng sự kiện thay thế | 5a. Nếu không có tin nào thỏa mãn đồng thời các điều kiện lọc, hệ thống giữ nguyên các nhãn điều kiện trên màn hình và hỗ trợ nút bỏ từng điều kiện (như bỏ điều kiện mức lương) để mở rộng kết quả.<br>5b. Nếu xảy ra lỗi kết nối không tải được dữ liệu, hệ thống thông báo lỗi tải dữ liệu và hiển thị nút Thử lại, không hiển thị 0 kết quả như một lần tìm kiếm hợp lệ. |

Bảng 3.8: Đặc tả ca sử dụng UC04 – Nộp hồ sơ ứng tuyển trực tuyến

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC04 |
| Tên ca sử dụng | Nộp hồ sơ ứng tuyển trực tuyến |
| Tác nhân thực hiện | Người tìm việc đã đăng nhập hệ thống |
| Mô tả tóm tắt | Người tìm việc chọn bản hồ sơ đã lưu hoặc tải tệp .pdf mới, nhập thư giới thiệu, kiểm tra thông tin người nhận và xác nhận gửi đơn ứng tuyển |
| Tiền điều kiện | Người tìm việc đã đăng nhập; tin tuyển dụng đang ở trạng thái Active và còn hạn nhận hồ sơ |
| Hậu điều kiện | Bản ghi đơn ứng tuyển mới được lưu vào bảng Applications với trạng thái ban đầu là Đã gửi hồ sơ (Submitted), cấp mã đơn tra cứu và gửi thông báo cho doanh nghiệp sở hữu tin |
| Luồng sự kiện chính | 1. Tại trang chi tiết tin tuyển dụng, người tìm việc nhấn nút Ứng tuyển ngay.<br>2. Hệ thống mở biểu mẫu chuẩn bị hồ sơ gắn với vị trí và doanh nghiệp của tin đã chọn, điền sẵn thông tin liên hệ từ tài khoản.<br>3. Người tìm việc chọn một bản hồ sơ đã lưu hoặc tải lên tệp .pdf mới (tối đa 5 MB), nhập thư giới thiệu (không bắt buộc, tối đa 2.000 ký tự) và có thể mở xem trước tài liệu.<br>4. Người tìm việc nhấn Kiểm tra hồ sơ để chuyển sang màn hình kiểm tra thông tin người gửi, bản hồ sơ, thư giới thiệu và doanh nghiệp nhận.<br>5. Người tìm việc chủ động đánh dấu vào ô đồng ý chia sẻ thông tin hồ sơ cho doanh nghiệp và nhấn Xác nhận gửi hồ sơ.<br>6. Hệ thống kiểm tra lại tình trạng tin, quyền sở hữu bản hồ sơ và điều kiện chống nộp trùng, sau đó lưu đơn vào bảng Applications với trạng thái Đã gửi hồ sơ (Submitted).<br>7. Hệ thống hiển thị màn hình xác nhận thành công kèm mã đơn tra cứu, thời điểm gửi, tên bản hồ sơ đã nộp và gửi thông báo cho doanh nghiệp. |
| Luồng sự kiện thay thế | 6a. Nếu ứng viên đã có đơn đang xử lý cho cùng tin tuyển dụng này, hệ thống không tạo đơn mới mà hiển thị thông báo nộp trùng kèm thông tin đơn cũ và nút Mở đơn đã gửi.<br>6b. Nếu tin tuyển dụng vừa chuyển sang trạng thái đóng hoặc hết hạn trong lúc ứng viên đang chuẩn bị, hệ thống thông báo tin đã ngừng nhận hồ sơ, không tạo đơn nhưng vẫn giữ nguyên thông tin liên hệ, tệp hồ sơ và thư giới thiệu trên biểu mẫu để ứng viên chọn vị trí khác. |

Bảng 3.9: Đặc tả ca sử dụng UC05 – Quản lý ứng viên theo giai đoạn xét tuyển

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC05 |
| Tên ca sử dụng | Quản lý ứng viên theo giai đoạn xét tuyển |
| Tác nhân thực hiện | Nhà tuyển dụng sở hữu tin tuyển dụng |
| Mô tả tóm tắt | Nhà tuyển dụng tiếp nhận và xử lý các đơn ứng tuyển của một vị trí qua 5 giai đoạn xét tuyển, xem hồ sơ, chấm điểm nội bộ, lập lịch phỏng vấn và phản hồi kết quả |
| Tiền điều kiện | Nhà tuyển dụng đã đăng nhập và truy cập đúng tin tuyển dụng thuộc quyền sở hữu của doanh nghiệp mình |
| Hậu điều kiện | Trạng thái đơn ứng tuyển trong bảng Applications được cập nhật, lịch sử thao tác được ghi vào ApplicationHistories và thông báo phản hồi được gửi tới ứng viên |
| Luồng sự kiện chính | 1. Nhà tuyển dụng mở bảng quản lý ứng viên của một vị trí tuyển dụng.<br>2. Hệ thống hiển thị danh sách đơn ứng tuyển phân theo 5 giai đoạn: Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp.<br>3. Nhà tuyển dụng mở thẻ ứng viên để xem bản hồ sơ đã gắn với đơn, thư giới thiệu và mức khớp kỹ năng.<br>4. Nhà tuyển dụng nhập nhận xét hoặc chấm điểm đánh giá nội bộ (InternalRating).<br>5. Nhà tuyển dụng chuyển đơn ứng tuyển sang giai đoạn phù hợp (ví dụ chuyển sang Đạt sơ loại hoặc Mời phỏng vấn kèm thông tin lịch phỏng vấn).<br>6. Hệ thống cập nhật trạng thái đơn trong bảng Applications, ghi người thao tác và thời điểm vào bảng ApplicationHistories, đồng thời gửi thông báo và thư điện tử cho ứng viên. |
| Luồng sự kiện thay thế | 5a. Nếu hồ sơ chưa đáp ứng yêu cầu ngay từ bước sơ loại hoặc sau phỏng vấn, nhà tuyển dụng chuyển đơn sang giai đoạn Chưa phù hợp mà không bắt buộc phải đi qua tất cả các giai đoạn trung gian; hệ thống hỗ trợ nhập nội dung phản hồi từ chối trước khi gửi thông báo cho ứng viên. |
