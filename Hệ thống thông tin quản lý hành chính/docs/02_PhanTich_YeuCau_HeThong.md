III. PHÂN TÍCH VÀ ĐẶC TẢ YÊU CẦU HỆ THỐNG

3.1. Xác định các chủ thể và tác nhân tham gia hệ thống

Hệ thống thông tin giải quyết thủ tục hành chính cấp tỉnh là một hệ sinh thái phần mềm quy mô lớn, tương tác đa chiều giữa cơ quan công quyền, công dân, cộng đồng doanh nghiệp và các nền tảng kỹ thuật số của các Bộ, ngành trung ương. Để bảo đảm việc thiết kế kiến trúc và phân quyền nghiệp vụ chính xác, bước đầu tiên mang tính quyết định là nhận diện và xác lập quyền hạn, trách nhiệm pháp lý của từng chủ thể tham gia.

Các tác nhân người dùng trong hệ thống bao gồm:

Người nộp hồ sơ (Công dân và Người đại diện doanh nghiệp): Là chủ thể có nhu cầu thực hiện thủ tục hành chính. Người nộp sử dụng tài khoản định danh điện tử VNeID để đăng nhập vào Cổng Dịch vụ công, nộp hồ sơ trực tuyến, thanh toán phí, lệ phí qua mạng, theo dõi tiến độ giải quyết, nhận kết quả điện tử và thực hiện khảo sát đánh giá mức độ hài lòng đối với sự phục vụ của cơ quan nhà nước.

Công chức tiếp nhận và trả kết quả tại Trung tâm Phục vụ hành chính công: Đóng vai trò là đầu mối tiếp xúc trực tiếp hoặc trực tuyến đầu tiên với người dân. Công chức tiếp nhận có trách nhiệm kiểm tra tính đầy đủ, hợp lệ của thành phần hồ sơ theo đúng quyết định công bố thủ tục hành chính; thực hiện quét và số hóa giấy tờ giấy tại nguồn theo quy định của Nghị định số 107/2021/NĐ-CP; cấp mã định danh hồ sơ tự động; xuất Giấy tiếp nhận hồ sơ và hẹn trả kết quả điện tử; đồng thời bàn giao kết quả giải quyết cho người dân khi hoàn tất.

Công chức thụ lý chuyên môn tại các phòng, ban chuyên ngành: Là người trực tiếp thẩm định nội dung chuyên môn của hồ sơ. Chuyên viên nghiên cứu các điều kiện quy chuẩn, đối soát thực địa (nếu thủ tục có yêu cầu), gửi văn bản xin ý kiến phối hợp liên phòng hoặc liên cơ quan thông qua hệ thống; lập dự thảo văn bản kết quả giải quyết (như giấy phép, chứng chỉ, quyết định hành chính) và đề xuất phương án phê duyệt trình lãnh đạo phòng.

Lãnh đạo phòng chuyên môn: Thực hiện thẩm tra toàn bộ quá trình thẩm định của chuyên viên, ký nháy văn bản dự thảo điện tử và trình lên Lãnh đạo cơ quan hành chính có thẩm quyền quyết định.

Lãnh đạo cơ quan hành chính nhà nước (Giám đốc Sở, Chủ tịch Ủy ban nhân dân cấp huyện, Chủ tịch Ủy ban nhân dân cấp xã): Là chủ thể có thẩm quyền pháp lý cao nhất trong việc quyết định cấp phép hoặc từ chối giải quyết thủ tục hành chính. Lãnh đạo cơ quan sử dụng chứng thư số chuyên dùng công vụ do Ban Cơ yếu Chính phủ cấp để ký số phê duyệt kết quả giải quyết trên môi trường mạng.

Văn thư cơ quan: Tiếp nhận văn bản kết quả đã có chữ ký số của lãnh đạo, thực hiện cấp số văn bản chính thức, áp dụng chữ ký số con dấu của cơ quan nhà nước và chuyển giao kết quả điện tử về Bộ phận Một cửa để trả cho người dân.

Cán bộ quản trị hệ thống và kiểm soát an toàn thông tin: Chịu trách nhiệm cấu hình danh mục thủ tục hành chính, thiết lập quy trình luân chuyển động theo quyết định của Chủ tịch Ủy ban nhân dân tỉnh, quản lý danh sách tài khoản người dùng theo vị trí việc làm, giám sát tải hệ thống và bảo đảm an toàn thông tin cấp độ ba.

Bảng 3.1: Ma trận phân định trách nhiệm và quyền hạn giữa các chủ thể tham gia hệ thống

| Tác nhân người dùng | Tiếp nhận và Số hóa | Thẩm định nội dung | Lấy ý kiến liên ngành | Ký số phê duyệt | Thu phí, lệ phí | Trả kết quả |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Người nộp hồ sơ | Chủ động nộp | Không có quyền | Không có quyền | Không có quyền | Người nộp | Nhận kết quả |
| Công chức một cửa | Thực hiện chính | Xem tiến độ | Không có quyền | Không có quyền | Xác nhận thu | Bàn giao kết quả |
| Chuyên viên thụ lý | Nhận hồ sơ phân công | Thực hiện chính | Đề xuất phối hợp | Soạn dự thảo | Không có quyền | Không có quyền |
| Lãnh đạo phòng chuyên môn | Xem giám sát | Thẩm tra dự thảo | Phê duyệt phối hợp | Ký nháy dự thảo | Không có quyền | Không có quyền |
| Lãnh đạo cơ quan quyết định | Giám sát toàn diện | Giám sát toàn diện | Chỉ đạo xử lý | Ký số công vụ | Không có quyền | Không có quyền |
| Văn thư cơ quan | Không có quyền | Không có quyền | Không có quyền | Đóng dấu số | Không có quyền | Phát hành số |
| Cán bộ kế toán thu phí | Không có quyền | Không có quyền | Không có quyền | Không có quyền | Thực hiện chính | Xuất biên lai số |

Bên cạnh các tác nhân là con người, hệ thống tương tác tự động với các tác nhân kỹ thuật bên ngoài:

Hệ thống định danh và xác thực điện tử quốc gia VNeID: Tiếp nhận yêu cầu xác thực, kiểm tra danh tính điện tử của công dân qua dữ liệu sinh trắc học và hoàn trả gói tin dữ liệu nhân thân đã ký số.

Cơ sở dữ liệu quốc gia về dân cư: Cung cấp thông tin dân cư phục vụ việc làm sạch dữ liệu, tự động điền biểu mẫu và trích xuất thông tin giấy tờ tùy thân hợp pháp.

Cổng Dịch vụ công Quốc gia: Tiếp nhận đồng bộ trạng thái hồ sơ theo thời gian thực để phục vụ đánh giá Bộ chỉ số 766, tiếp nhận các hồ sơ nộp từ Cổng quốc gia điều phối về tỉnh và liên thông thanh toán tập trung.

Nền tảng tích hợp và chia sẻ dữ liệu cấp tỉnh LGSP và quốc gia NDXP: Đóng vai trò là trục truyền tải thông điệp an toàn, định tuyến các yêu cầu tra cứu sang các cơ sở dữ liệu chuyên ngành của các Bộ: Tư pháp, Kế hoạch và Đầu tư, Tài nguyên và Môi trường, Giao thông Vận tải.

Hệ thống Kho bạc Nhà nước và Đơn vị trung gian thanh toán: Phục vụ thu gom phí, lệ phí trực tuyến và đối soát dòng tiền nộp vào ngân sách nhà nước.

Hệ thống phát hành biên lai điện tử: Tự động khởi tạo và phát hành biên lai điện tử có mã của cơ quan thuế hoặc biên lai thu phí chuyên dùng có chữ ký số.

[[IMAGE: assets/diagrams/hinh_2_3_fdd_phan_ra_chuc_nang.png | Caption: Hình 2.3: Sơ đồ phân rã chức năng hệ thống thông tin giải quyết thủ tục hành chính]]

3.2. Đặc tả yêu cầu chức năng theo từng phân hệ nghiệp vụ

3.2.1. Phân hệ Cổng Dịch vụ công trực tuyến

Phân hệ Cổng Dịch vụ công trực tuyến là giao diện số phục vụ toàn diện cho người dân và doanh nghiệp với các chức năng trọng tâm:

Chức năng xác thực và đăng nhập một lần: Tích hợp dịch vụ xác thực của Hệ thống định danh và xác thực điện tử quốc gia. Hỗ trợ đăng nhập bằng tài khoản VNeID Mức độ một và Mức độ hai thông qua việc quét mã phản hồi nhanh trên ứng dụng di động hoặc xác thực khóa công khai qua thiết bị đọc thẻ căn cước. Sau khi xác thực thành công, hệ thống khởi tạo phiên làm việc bảo mật và duy trì trạng thái đăng nhập trên toàn bộ các dịch vụ công trực tuyến của tỉnh.

Chức năng tự động điền biểu mẫu tương tác điện tử: Khi người nộp lựa chọn một thủ tục hành chính trực tuyến toàn trình, hệ thống trích xuất gói dữ liệu nhân thân từ VNeID để tự động điền vào các trường: Họ tên, Số căn cước công dân, Ngày tháng năm sinh, Giới tính, Quê quán, Địa chỉ thường trú và Nơi ở hiện tại. Các trường dữ liệu này bị khóa ở chế độ chỉ đọc, không cho phép công dân tự ý chỉnh sửa nhằm loại trừ nguy cơ sai lệch thông tin và mạo danh.

Chức năng quản lý và khai thác Kho dữ liệu điện tử cá nhân: Mỗi công dân, tổ chức sau khi đăng nhập được hệ thống cấp một không gian lưu trữ số hóa an toàn. Khi nộp hồ sơ mới, nếu thủ tục yêu cầu nộp các giấy tờ đã từng là kết quả giải quyết của các thủ tục trước đó (ví dụ: Giấy chứng nhận đăng ký doanh nghiệp, Giấy phép xây dựng, Trích lục khai sinh), công dân chỉ cần chọn liên kết tài liệu từ Kho dữ liệu cá nhân mà không phải tải tệp tin lên từ máy tính cá nhân. Hệ thống tự động kiểm tra chữ ký số công vụ và hạn dùng của văn bản số để chấp thuận thành phần hồ sơ.

Chức năng nộp hồ sơ số và ký số người nộp: Cho phép người nộp đính kèm các thành phần hồ sơ theo định dạng tài liệu số chuẩn quốc gia PDF/A. Hỗ trợ ký số cá nhân thông qua chứng thư số công cộng hoặc ký số từ xa được tích hợp sẵn trên ứng dụng di động của công dân trước khi bấm lệnh gửi hồ sơ chính thức.

Chức năng theo dõi tiến độ và nhận kết quả trực tuyến: Cung cấp công cụ tra cứu dòng thời gian xử lý hồ sơ minh bạch theo thời gian thực. Mỗi khi hồ sơ có sự chuyển đổi trạng thái (chuyển phòng thẩm định, có yêu cầu nộp phí, trình ký số), hệ thống tự động gửi thông báo qua thư điện tử, tin nhắn điện thoại và thông báo ứng dụng di động cho công dân. Khi có kết quả chính thức, công dân có thể tải trực tiếp bản điện tử có chữ ký số của cơ quan hành chính về máy hoặc yêu cầu chuyển phát bản giấy tận nhà qua bưu chính công ích.

3.2.2. Phân hệ Một cửa điện tử

Phân hệ Một cửa điện tử là công cụ nghiệp vụ cốt lõi dành cho công chức làm việc tại Trung tâm Phục vụ hành chính công cấp tỉnh, Bộ phận Tiếp nhận và Trả kết quả cấp huyện và cấp xã:

Chức năng tiếp nhận hồ sơ đa kênh: Cung cấp bàn làm việc số hóa tập trung, cho phép công chức tiếp nhận song song cả hai nguồn hồ sơ: hồ sơ nộp trực tuyến từ Cổng Dịch vụ công và hồ sơ do người dân mang trực tiếp đến quầy giao dịch. Đối với hồ sơ nộp trực tuyến, phần mềm hỗ trợ rà soát nhanh tính hợp lệ trước khi bấm duyệt tiếp nhận chính thức.

Chức năng số hóa hồ sơ tại nguồn theo Nghị định số 107/2021/NĐ-CP: Đối với hồ sơ nộp trực tiếp bằng giấy, công chức Một cửa sử dụng máy quét chuyên dụng kết nối trực tiếp với phần mềm để thực hiện quét toàn bộ giấy tờ thành phần sang định dạng PDF/A có lớp văn bản nhận dạng quang học. Sau khi quét xong, công chức sử dụng chứng thư số cá nhân công vụ để ký số chứng thực số hóa lên từng tệp tin. Tệp tin số hóa này có giá trị thay thế hoàn toàn hồ sơ giấy trong toàn bộ các bước thẩm định nội bộ tiếp theo.

Chức năng cấp mã số hồ sơ điện tử tự động: Mỗi hồ sơ sau khi được chấp nhận tiếp nhận sẽ được hệ thống tự động sinh một Mã số hồ sơ duy nhất trên phạm vi toàn quốc theo cấu trúc chuẩn quy định của Văn phòng Chính phủ: Mã định danh cơ quan tiếp nhận kết hợp năm, tháng, ngày và số thứ tự tự tăng trong ngày. Mã số này được mã hóa dưới dạng mã phản hồi nhanh và mã vạch tuyến tính in trên Giấy tiếp nhận để thuận tiện cho việc tra cứu tự động.

Chức năng phát hành Giấy tiếp nhận hồ sơ và hẹn trả kết quả điện tử: Hệ thống tự động tính toán thời hạn giải quyết dựa trên biểu thời gian chuẩn của thủ tục, tự động loại trừ các ngày nghỉ thứ bảy, chủ nhật và ngày nghỉ lễ theo quy định của Bộ luật Lao động. Giấy tiếp nhận được ký số của cơ quan Một cửa, gửi trực tiếp vào tài khoản trực tuyến của người dân và in bản giấy trao cho người nộp trực tiếp.

Bảng 3.2: Bảng mã hóa các trạng thái nghiệp vụ trong vòng đời xử lý hồ sơ thủ tục hành chính

| Mã trạng thái | Tên trạng thái nghiệp vụ | Diễn giải quy trình | Thời hạn kiểm soát |
| :---: | :--- | :--- | :--- |
| TT01 | Mới nộp trực tuyến | Hồ sơ được công dân nộp qua mạng, đang chờ cán bộ Một cửa tiếp nhận kiểm tra thành phần. | Tối đa 08 giờ làm việc |
| TT02 | Đã tiếp nhận chính thức | Hồ sơ hợp lệ, đã cấp mã số hồ sơ, số hóa giấy tờ và phát hành giấy hẹn trả kết quả. | Tính mốc bắt đầu quy trình |
| TT03 | Chờ nộp phí, lệ phí | Hồ sơ đủ điều kiện giải quyết, hệ thống phát hành mã định danh thu tiền, tạm phong tỏa luồng. | Tối đa 48 giờ làm việc |
| TT04 | Đã hoàn thành nộp phí | Người dân đã thanh toán thành công, biên lai điện tử được sinh tự động, kích hoạt chuyển tiếp. | Thời gian thực (tức thời) |
| TT05 | Đang thẩm định chuyên môn | Hồ sơ được phân công cho chuyên viên thụ lý phòng ban chuyên ngành kiểm tra nội dung. | Chiếm 60% tổng thời gian TTHC |
| TT06 | Xin ý kiến phối hợp | Chuyên viên gửi yêu cầu thẩm tra sang Sở, ngành hoặc cơ quan liên quan để phối hợp. | Tối đa 03 ngày làm việc |
| TT07 | Yêu cầu hoàn thiện hồ sơ | Hồ sơ chưa đạt chuẩn, cán bộ ban hành văn bản thông báo hướng dẫn bổ sung duy nhất một lần. | Tạm dừng tính giờ giải quyết |
| TT08 | Chờ lãnh đạo ký số | Chuyên viên và lãnh đạo phòng đã duyệt dự thảo, hồ sơ đang chờ lãnh đạo cơ quan ký số công vụ. | Tối đa 08 giờ làm việc |
| TT09 | Đã có kết quả giải quyết | Văn thư đã đóng dấu số cơ quan, kết quả điện tử đã chuyển về Bộ phận Một cửa sẵn sàng trả. | Trước hạn hẹn trả |
| TT10 | Đã trả kết quả cho dân | Người dân đã nhận kết quả điện tử hoặc bản giấy tại quầy, hồ sơ đóng và lưu trữ vĩnh viễn. | Hoàn tất chu trình công vụ |

3.2.3. Phân hệ Thẩm định và Thụ lý chuyên môn

Phân hệ Thẩm định và Thụ lý chuyên môn là không gian làm việc số của các phòng chuyên môn thuộc các Sở, Ban, Ngành và Phòng chuyên môn cấp huyện:

Chức năng phân công hồ sơ tự động và thủ công: Hệ thống cho phép cấu hình quy tắc phân công hồ sơ tự động dựa trên địa bàn quản lý, lĩnh vực chuyên môn sâu hoặc thuật toán cân bằng tải số lượng hồ sơ giữa các chuyên viên trong phòng. Đồng thời, Trưởng phòng chuyên môn có quyền điều phối thủ công lại hồ sơ căn cứ vào tình hình công tác đột xuất của đơn vị.

Chức năng thẩm định nội dung trên hồ sơ số hóa: Chuyên viên thụ lý xem xét toàn bộ tài liệu hồ sơ trực tiếp trên phần mềm thông qua trình xem văn bản tích hợp, không cần in ấn giấy tờ. Phần mềm hỗ trợ các công cụ ghi chú trực tiếp lên văn bản số, kiểm tra tính hợp lệ của chữ ký số trên các giấy tờ đính kèm và tra cứu đối soát chéo với các cơ sở dữ liệu quốc gia (như kiểm tra trạng thái hoạt động của doanh nghiệp từ Cơ sở dữ liệu quốc gia về đăng ký kinh doanh).

Chức năng lấy ý kiến phối hợp liên phòng và liên cơ quan: Đối với các thủ tục hành chính có tính chất phức tạp, liên ngành (như cấp phép đầu tư, phê duyệt báo cáo đánh giá tác động môi trường), hệ thống cho phép chuyên viên khởi tạo luồng xin ý kiến phối hợp điện tử. Cơ quan được hỏi ý kiến nhận được thông báo tức thời và có trách nhiệm trả lời bằng văn bản điện tử có ký số đúng trong thời hạn quy định. Nếu quá thời hạn mà không có ý kiến phản hồi, hệ thống ghi nhận sự đồng thuận mặc định theo quy định của pháp luật và báo cáo lãnh đạo xử lý.

Chức năng kiểm soát nguyên tắc yêu cầu bổ sung hồ sơ chỉ một lần: Nhằm khắc phục triệt để tình trạng cán bộ hành chính nhũng nhiễu bắt người dân đi lại bổ sung giấy tờ nhiều lần, phần mềm áp dụng cơ chế khóa cưỡng bức: Mỗi hồ sơ chỉ được phép phát hành Thông báo yêu cầu sửa đổi, bổ sung hồ sơ duy nhất một lần trong suốt quá trình giải quyết. Văn bản thông báo bổ sung phải nêu rõ căn cứ pháp luật và liệt kê chi tiết, toàn diện tất cả các nội dung cần hoàn thiện. Sau khi phát hành, chức năng yêu cầu bổ sung sẽ bị hệ thống vô hiệu hóa đối với hồ sơ đó.

3.2.4. Phân hệ Phê duyệt và Ký số điện tử

Phân hệ Phê duyệt và Ký số điện tử bảo đảm tính pháp lý công quyền tối cao cho toàn bộ kết quả giải quyết:

Chức năng thẩm tra và trình ký nhiều cấp: Thiết lập luồng phê duyệt phân cấp từ Chuyên viên soạn thảo, Lãnh đạo phòng chuyên môn thẩm tra ký nháy đến Lãnh đạo cơ quan ký phê duyệt chính thức. Mỗi cấp duyệt đều hiển thị đầy đủ phiếu trình điện tử, tóm tắt nội dung hồ sơ, căn cứ pháp lý và dự thảo văn bản kết quả.

Chức năng tích hợp ký số tập trung bằng thiết bị phần cứng bảo mật chuyên dụng: Hệ thống kết nối trực tiếp với thiết bị phần cứng bảo mật chuyên dụng đạt chuẩn quốc gia đặt tại Trung tâm dữ liệu của tỉnh, hỗ trợ ký số chuyên dùng công vụ do Ban Cơ yếu Chính phủ cấp. Lãnh đạo có thể thực hiện ký số văn bản hàng loạt từ máy trạm làm việc hoặc ký số từ xa an toàn trên máy tính bảng, điện thoại di động thông qua ứng dụng xác thực bảo mật có kiểm soát sinh trắc học.

Chức năng đóng dấu số và phát hành kết quả điện tử theo Nghị định số 30/2020/NĐ-CP: Sau khi Lãnh đạo cơ quan ký số cá nhân, hồ sơ tự động chuyển sang tài khoản của Văn thư cơ quan. Văn thư kiểm tra thể thức, thực hiện lệnh cấp số văn bản đi tự động và áp dụng chữ ký số con dấu điện tử của cơ quan nhà nước. Hình ảnh con dấu màu đỏ được hệ thống tự động định vị chèn trùm lên một phần ba chữ ký số của người có thẩm quyền về phía bên trái theo đúng chuẩn thể thức văn bản hành chính quy định tại Nghị định số 30/2020/NĐ-CP. Văn bản kết quả điện tử được lưu trữ định dạng chuẩn và gửi đồng thời vào Kho dữ liệu điện tử cá nhân của công dân.

3.2.5. Phân hệ Quản lý nghĩa vụ tài chính và Biên lai điện tử

Phân hệ Quản lý nghĩa vụ tài chính và Biên lai điện tử giải quyết triệt để bài toán dòng tiền trong dịch vụ công trực tuyến:

Chức năng sinh Mã định danh thanh toán tập trung: Ngay sau khi hồ sơ được thẩm định đủ điều kiện giải quyết, hệ thống tự động tạo một Mã định danh thanh toán duy nhất gắn với mã hồ sơ. Mã này lưu trữ toàn bộ các thông tin tài chính: Mã cơ quan thụ hưởng, Mã tài khoản ngân quỹ mở tại Kho bạc Nhà nước, Mã chương, Mã tiểu mục nộp ngân sách nhà nước, định mức phí nộp ngân sách và định mức lệ phí.

Chức năng phong tỏa luồng nghiệp vụ khi chưa nộp phí: Trạng thái hồ sơ được cập nhật sang "Chờ nộp phí, lệ phí". Lúc này, luồng phân công chuyên môn sâu hoặc bước ký duyệt kết quả tự động bị khóa lại trên phần mềm. Điều này bảo đảm nguyên tắc kỷ cương ngân sách: Cơ quan nhà nước không cấp phép hoặc trả kết quả khi đối tượng thụ hưởng chưa hoàn thành nghĩa vụ nộp tiền vào ngân sách nhà nước theo luật định.

Chức năng thanh toán trực tuyến đa kênh: Người dân có thể thanh toán trực tiếp trên Cổng Dịch vụ công thông qua việc quét mã phản hồi nhanh trên ứng dụng ngân hàng di động, thanh toán bằng thẻ ATM nội địa, thẻ quốc tế hoặc trích nợ tự động qua ví điện tử. Giao dịch được bảo đảm an toàn qua cổng chuyển mạch thanh toán quốc gia.

Chức năng mở khóa luồng tự động sau thanh toán thành công: Ngay khi nhận được gói tin dữ liệu phản hồi xác nhận giao dịch thành công từ ngân hàng qua giao diện lập trình ứng dụng, hệ thống Một cửa lập tức tự động cập nhật trạng thái hồ sơ sang "Đã nộp phí, lệ phí" và mở khóa luân chuyển hồ sơ sang bước nghiệp vụ tiếp theo mà không cần bất kỳ sự can thiệp thủ công nào của cán bộ kế toán.

Chức năng tự động phát hành biên lai điện tử có ký số: Hệ thống chuyển gói tin giao dịch sang phần mềm Biên lai điện tử của cơ quan thu. Phần mềm tự động khởi tạo mẫu biên lai thu phí, lệ phí hợp pháp, áp dụng chữ ký số con dấu của cơ quan thu và đồng bộ tức thời tệp biên lai điện tử vào Kho dữ liệu cá nhân của người nộp, đồng thời truyền dữ liệu về cơ quan thuế theo quy định tại Nghị định số 123/2020/NĐ-CP.

Bảng 3.3: Bảng đối soát nghĩa vụ tài chính tập trung ba bên hằng ngày

| Bước thực hiện | Đơn vị chủ trì | Dữ liệu đầu vào | Thao tác kỹ thuật | Kết quả đầu ra |
| :---: | :--- | :--- | :--- | :--- |
| Bước 1 | Hệ thống Một cửa điện tử | Nhật ký giao dịch phát sinh trên phần mềm | Tự động kết xuất bảng kê tổng hợp các khoản thu phí, lệ phí theo từng mã hồ sơ vào lúc 23h30 hằng ngày. | Bảng kê giao dịch hồ sơ nội bộ điện tử |
| Bước 2 | Đơn vị trung gian thanh toán / Ngân hàng | Nhật ký giao dịch cổng thanh toán chuyển mạch | Tổng hợp toàn bộ các giao dịch thanh toán thành công đã trừ tiền tài khoản người nộp và chuyển mạch dòng tiền. | Bảng kê đối soát giao dịch thanh toán |
| Bước 3 | Kho bạc Nhà nước tỉnh / Ngân hàng chuyên thu | Sổ phụ tài khoản tiền gửi thu phí của cơ quan | Lập giấy báo Có xác nhận số tiền thực tế đã ghi nhận vào tài khoản tiền gửi mở tại Kho bạc Nhà nước. | Giấy báo Có ngân quỹ Kho bạc Nhà nước |
| Bước 4 | Module Đối soát tự động của hệ thống | Dữ liệu tổng hợp từ Bước 1, Bước 2 và Bước 3 | Thuật toán đối soát so khớp tự động từng dòng dữ liệu dựa trên Mã định danh thanh toán và số tiền thu. | Báo cáo đối soát khớp lệnh 100% hoặc cảnh báo lệch |
| Bước 5 | Kế toán cơ quan và Kỹ thuật ngân hàng | Danh sách các bản ghi bị lệch (nếu có) | Tra soát thủ công vết dữ liệu mạng trong vòng 24 giờ để xác định nguyên nhân và điều chỉnh số liệu. | Biên bản xử lý sai lệch tài chính thống nhất |

3.2.6. Phân hệ Báo cáo thống kê và Giám sát theo Bộ chỉ số 766

Phân hệ Báo cáo thống kê và Giám sát là công cụ chỉ đạo, điều hành của Lãnh đạo Ủy ban nhân dân tỉnh:

Chức năng đo lường Bộ chỉ số 766 theo thời gian thực: Căn cứ Quyết định số 766/QĐ-TTg của Thủ tướng Chính phủ, hệ thống tự động thu thập dữ liệu và chấm điểm phục vụ nhân dân trên thang điểm một trăm, phân bổ vào năm nhóm chỉ số thành phần:

Nhóm chỉ số về tính công khai, minh bạch (Tối đa 18 điểm): Đánh giá tỷ lệ thủ tục hành chính được công bố, công khai đúng thời hạn và đầy đủ các nội dung theo quy định; tỷ lệ hồ sơ đồng bộ lên Cổng Dịch vụ công Quốc gia.

Nhóm chỉ số về tiến độ và kết quả giải quyết (Tối đa 20 điểm): Đánh giá tỷ lệ hồ sơ giải quyết đúng hạn và trước hạn; tỷ lệ hồ sơ giải quyết quá hạn; việc thực hiện quy định gửi thư xin lỗi công dân khi trễ hạn.

Nhóm chỉ số về cung cấp dịch vụ công trực tuyến (Tối đa 12 điểm): Đánh giá tỷ lệ dịch vụ công trực tuyến toàn trình phát sinh hồ sơ; tỷ lệ hồ sơ nộp trực tuyến trên tổng số hồ sơ phát sinh; tỷ lệ hồ sơ thanh toán trực tuyến.

Nhóm chỉ số về số hóa hồ sơ (Tối đa 22 điểm): Đánh giá tỷ lệ hồ sơ được số hóa đầy đủ thành phần tại Bộ phận Một cửa; tỷ lệ kết quả giải quyết được số hóa và ký số; tỷ lệ hồ sơ tái sử dụng dữ liệu đã số hóa.

Nhóm chỉ số về mức độ hài lòng (Tối đa 18 điểm): Đánh giá tỷ lệ người dân, doanh nghiệp đánh giá hài lòng và rất hài lòng khi thực hiện thủ tục hành chính; tỷ lệ phản ánh, kiến nghị được xử lý dứt điểm đúng thời hạn.

Bảng 3.4: Khung tiêu chí đánh giá chất lượng phục vụ theo Bộ chỉ số 766 của Thủ tướng Chính phủ

| Nhóm chỉ số đánh giá | Điểm tối đa | Tiêu chí kỹ thuật đánh giá tự động trên hệ thống | Ngưỡng đạt chuẩn xuất sắc |
| :--- | :---: | :--- | :---: |
| 1. Tính công khai, minh bạch | 18 điểm | Đồng bộ 100% hồ sơ tiếp nhận lên Cổng DVCQG trong ngày; công khai toàn bộ tiến độ xử lý và danh mục TTHC. | Đạt từ 17 điểm trở lên |
| 2. Tiến độ giải quyết hồ sơ | 20 điểm | Tỷ lệ hồ sơ giải quyết đúng hạn và trước hạn đạt trên 98%; nghiêm cấm tình trạng quá hạn không có thư xin lỗi. | Đạt từ 19 điểm trở lên |
| 3. Cung cấp DVC trực tuyến | 12 điểm | Tỷ lệ hồ sơ trực tuyến toàn trình đạt trên 80%; tỷ lệ thanh toán trực tuyến trên tổng số hồ sơ có thu phí đạt trên 80%. | Đạt từ 11 điểm trở lên |
| 4. Mức độ số hóa hồ sơ | 22 điểm | Tỷ lệ số hóa hồ sơ tại nguồn đạt trên 95%; tỷ lệ cấp kết quả điện tử đạt 100%; tỷ lệ tái sử dụng giấy tờ số đạt trên 50%. | Đạt từ 20 điểm trở lên |
| 5. Mức độ hài lòng của dân | 18 điểm | Tỷ lệ đánh giá hài lòng và rất hài lòng đạt trên 98%; 100% phản ánh kiến nghị được xử lý đúng hạn trong 24 giờ. | Đạt từ 17 điểm trở lên |
| Tổng điểm chỉ số phục vụ | **90 điểm** | Căn cứ xếp hạng thi đua cải cách hành chính hằng quý của các Sở, Ban, Ngành và UBND cấp huyện. | **Đạt từ 84 điểm trở lên** |

Chức năng cảnh báo quá hạn sớm: Phần mềm thiết lập cơ chế đồng hồ đếm ngược thời gian thực cho từng hồ sơ. Khi thời gian xử lý còn lại dưới 24 giờ mà hồ sơ vẫn chưa hoàn thành thẩm định, hệ thống tự động phát cảnh báo màu vàng trên bàn làm việc của chuyên viên và gửi tin nhắn cảnh báo đến điện thoại của Trưởng phòng chuyên môn. Nếu hồ sơ bị quá hạn, hệ thống chuyển sang trạng thái cảnh báo màu đỏ, tự động ghi nhận vào sổ theo dõi vi phạm kỷ cương hành chính và bắt buộc cán bộ thụ lý phải khởi tạo văn bản xin lỗi công dân kèm theo ngày hẹn trả kết quả mới.

3.3. Đặc tả yêu cầu phi chức năng của hệ thống

Bên cạnh các yêu cầu nghiệp vụ chuyên môn, hệ thống thông tin quản lý hành chính nhà nước phải tuân thủ nghiêm ngặt các tiêu chuẩn kỹ thuật phi chức năng nhằm bảo đảm tính vận hành liên tục, ổn định và an toàn tuyệt đối.

3.3.1. Yêu cầu về hiệu năng và năng lực tải hệ thống

Thời gian phản hồi giao diện: Thời gian tải trang ban đầu của Cổng Dịch vụ công đối với người dùng không vượt quá 1.5 giây trong điều kiện mạng thông thường. Thời gian phản hồi cho các tác vụ nghiệp vụ nội bộ (như mở danh sách hồ sơ, tra cứu thông tin dân cư, chuyển bước thẩm định) không vượt quá 1.0 giây.

Năng lực chịu tải đồng thời: Hệ thống được thiết kế để phục vụ tối thiểu 10.000 người dùng truy cập đồng thời vào các giờ cao điểm mà không xảy ra hiện tượng nghẽn mạng, treo ứng dụng hay suy giảm hiệu năng quá 10%.

Khả năng xử lý giao dịch: Hệ thống có năng lực tiếp nhận và xử lý trơn tru tối thiểu 500.000 hồ sơ thủ tục hành chính trong một năm trên phạm vi toàn tỉnh, tương đương trung bình xử lý từ 2.000 đến 3.500 hồ sơ mỗi ngày làm việc.

Tốc độ xử lý chữ ký số: Năng lực ký số văn bản điện tử và đóng dấu số tập trung thông qua thiết bị phần cứng bảo mật chuyên dụng đạt tốc độ tối thiểu 500 chữ ký số trong một giây, bảo đảm phục vụ tốt nhu cầu phát hành văn bản và hóa đơn, biên lai hàng loạt.

Bảng 3.5: Bảng các chỉ số yêu cầu phi chức năng về hiệu năng và năng lực tải hệ thống

| Thông số kỹ thuật | Ngưỡng tiêu chuẩn cam kết | Phương pháp đo kiểm kỹ thuật |
| :--- | :--- | :--- |
| Thời gian phản hồi trang chủ Cổng DVC | Dưới 1.5 giây | Kiểm thử tải bằng công cụ đo kiểm đa luồng |
| Thời gian phản hồi truy vấn hồ sơ | Dưới 1.0 giây với tập dữ liệu 1 triệu bản ghi | Tối ưu hóa chỉ số cơ sở dữ liệu |
| Số lượng phiên truy cập đồng thời | 10.000 phiên đồng thời duy trì liên tục | Mô phỏng tải phân tán trên cụm máy chủ ảo hóa |
| Thông lượng xử lý giao dịch cơ sở dữ liệu | Tối thiểu 3.000 giao dịch trong một giây | Đo kiểm tốc độ đọc ghi đĩa SAN và bộ nhớ đệm |
| Tốc độ ký số tập trung qua thiết bị HSM | Tối thiểu 500 văn bản điện tử trong một giây | Đo kiểm trực tiếp trên thiết bị bảo mật phần cứng |
| Tỷ lệ lỗi hệ thống cho phép khi quá tải | Dưới 0.01% tổng số lượng yêu cầu | Giám sát qua hệ thống phân tích nhật ký tập trung |

3.3.2. Yêu cầu về độ sẵn sàng và tính liên tục của công vụ

Tính sẵn sàng của dịch vụ: Mức độ sẵn sàng vận hành của hệ thống phải đạt tối thiểu 99.9% thời gian trong năm (tương đương tổng thời gian gián đoạn dịch vụ đột xuất không vượt quá 8.76 giờ trong cả năm). Hệ thống duy trì hoạt động phục vụ người dân nộp hồ sơ trực tuyến và tra cứu tiến độ 24 giờ một ngày, 7 ngày một tuần kể cả ngày nghỉ lễ, tết.

Chỉ số phục hồi dữ liệu:
Mục tiêu thời gian phục hồi RTO: Thời gian tối đa để khôi phục toàn bộ hệ thống hoạt động trở lại bình thường sau sự cố thảm họa phần cứng hoặc đường truyền không vượt quá 30 phút.
Mục tiêu điểm phục hồi RPO: Lượng dữ liệu tối đa chấp nhận mất mát khi xảy ra sự cố nghiêm trọng không vượt quá 05 phút giao dịch, nhờ vào cơ chế đồng bộ dữ liệu thời gian thực sang Trung tâm dữ liệu dự phòng thảm họa.

3.3.3. Yêu cầu về bảo đảm an toàn thông tin cấp độ ba

Căn cứ theo quy định tại Nghị định số 85/2016/NĐ-CP và Thông tư số 12/2022/TT-BTTTT của Bộ Thông tin và Truyền thông, Hệ thống thông tin giải quyết thủ tục hành chính cấp tỉnh được phân loại thuộc Hệ thống thông tin cấp độ ba. Do đó, hệ thống phải đáp ứng đầy đủ các tiêu chuẩn kỹ thuật an toàn bắt buộc:

Kiểm soát xác thực và phân quyền: Áp dụng cơ chế xác thực đa yếu tố đối với toàn bộ tài khoản cán bộ, công chức truy cập vào mạng nội bộ. Thiết lập ma trận phân quyền kiểm soát truy cập dựa trên vai trò và vị trí công tác nghiêm ngặt. Nghiêm cấm chia sẻ tài khoản công vụ giữa các cán bộ.

Bảo vệ và mã hóa dữ liệu: Toàn bộ dữ liệu truyền nhận giữa người dùng với hệ thống phải được mã hóa bằng giao thức truyền tải siêu văn bản an toàn với thuật toán mã hóa mạnh. Toàn bộ cơ sở dữ liệu chứa dữ liệu nhân thân của công dân phải được mã hóa khi lưu trữ trên ổ đĩa bằng công nghệ mã hóa cơ sở dữ liệu trong suốt với khóa mã hóa bảo mật.

Nhật ký kiểm toán an toàn thông tin: Hệ thống phải tự động ghi vết toàn bộ các thao tác tạo mới, đọc, sửa đổi, xóa dữ liệu và các hành vi đăng nhập, đăng xuất của cán bộ kèm theo địa chỉ mạng, thời gian chính xác đến từng giây. Toàn bộ nhật ký kiểm toán phải được đẩy về máy chủ giám sát an ninh mạng tập trung và được lưu trữ an toàn tối thiểu 02 năm. Tuyệt đối không cho phép bất kỳ ai, kể cả quản trị viên hệ thống, được quyền chỉnh sửa hoặc xóa nhật ký kiểm toán.

Bảo vệ biên giới mạng: Triển khai hệ thống tường lửa thế hệ mới, tường lửa bảo vệ ứng dụng web để ngăn chặn các hình thức tấn công tiêm mã độc SQL, tấn công giả mạo yêu cầu chéo và các cuộc tấn công từ chối dịch vụ phân tán. Kết nối hệ thống liên tục 24/7 với Trung tâm giám sát và điều hành an toàn thông tin mạng SOC của tỉnh và Trung tâm Giám sát an toàn không gian mạng quốc gia.

3.4. Mô hình hóa chức năng và luồng dữ liệu nghiệp vụ

3.4.1. Sơ đồ phân rã chức năng hệ thống

Sơ đồ phân rã chức năng (Hình 2.3) thể hiện cấu trúc phân cấp từ mục tiêu tổng thể của Hệ thống thông tin giải quyết thủ tục hành chính cấp tỉnh xuống bảy phân hệ chức năng cấp một và ba mươi hai chức năng nghiệp vụ cấp hai. Cách tiếp cận phân rã chức năng bảo đảm tính bao trùm, không trùng lặp và phân định ranh giới nghiệp vụ rõ ràng giữa các bộ phận trong quy trình công vụ.

3.4.2. Sơ đồ luồng dữ liệu ngữ cảnh mức không

Sơ đồ luồng dữ liệu ngữ cảnh mức không (Hình 2.4) mô tả hệ thống như một tiến trình trung tâm số 0.0, bao quanh bởi năm thực thể ngoài chủ chốt: Công dân và Doanh nghiệp; Cán bộ, công chức cơ quan nhà nước; Cổng Dịch vụ công Quốc gia và Đề án 06; Kho bạc Nhà nước và Biên lai điện tử; Các cơ sở dữ liệu chuyên ngành của các Bộ.

Dòng thông tin vào hệ thống gồm: Hồ sơ thủ tục hành chính nộp trực tuyến hoặc nộp trực tiếp; Lệnh ủy quyền trích xuất dữ liệu định danh VNeID; Lệnh thanh toán nghĩa vụ tài chính; Ý kiến thẩm định nghiệp vụ của chuyên viên; Chữ ký số phê duyệt của lãnh đạo cơ quan; Dữ liệu xác thực từ CSDL Dân cư.

Dòng thông tin ra từ hệ thống gồm: Giấy tiếp nhận hồ sơ và hẹn trả kết quả điện tử; Mã định danh nộp phí và thông báo nộp tiền; Biên lai thu phí, lệ phí điện tử có ký số; Kết quả giải quyết thủ tục hành chính điện tử có ký số công quyền; Dữ liệu đồng bộ chỉ số phục vụ theo Bộ chỉ số 766 về Cổng Dịch vụ công Quốc gia.

[[IMAGE: assets/diagrams/hinh_2_4_dfd_ngu_canh_muc_0.png | Caption: Hình 2.4: Sơ đồ luồng dữ liệu ngữ cảnh mức không của hệ thống thông tin giải quyết thủ tục hành chính]]

3.4.3. Sơ đồ luồng dữ liệu phân rã mức một: Phân hệ tiếp nhận, số hóa và phân công hồ sơ

Sơ đồ luồng dữ liệu phân rã mức một (Hình 2.5) mổ xẻ chi tiết chu trình dữ liệu ở giai đoạn đầu của thủ tục hành chính, bao gồm bốn tiến trình thành phần:

Tiến trình 1.1: Tiếp nhận và kiểm tra tính hợp lệ của hồ sơ. Nhận hồ sơ từ người nộp, đối chiếu với danh mục thành phần hồ sơ quy định trong cơ sở dữ liệu danh mục thủ tục. Nếu hồ sơ thiếu hoặc không hợp lệ, hệ thống hỗ trợ phát hành văn bản từ chối hoặc hướng dẫn bổ sung duy nhất một lần. Nếu hợp lệ, chuyển sang tiến trình 1.2.

Tiến trình 1.2: Số hóa và ký số chứng thực số hóa. Tiếp nhận giấy tờ gốc, thực hiện quét quang học thành tệp PDF/A có lớp văn bản, bóc tách các trường dữ liệu siêu dữ liệu cốt lõi, cán bộ một cửa áp dụng chữ ký số công vụ để xác thực tính toàn vẹn. Dữ liệu tệp số hóa được lưu trữ an toàn vào Kho dữ liệu số hóa (Kho lưu trữ D2).

Tiến trình 1.3: Cấp mã số hồ sơ và hẹn ngày trả kết quả. Nhận thông tin hồ sơ đã hợp lệ, sinh mã số hồ sơ điện tử tự động, tính toán thời hạn trả kết quả, cập nhật bản ghi vào Cơ sở dữ liệu hồ sơ (Kho lưu trữ D1), đồng thời xuất Giấy tiếp nhận hồ sơ và hẹn trả kết quả điện tử gửi lại cho người nộp.

Tiến trình 1.4: Điều phối và phân công hồ sơ. Căn cứ vào thẩm quyền giải quyết của thủ tục, hệ thống tự động đẩy hồ sơ số hóa sang bàn làm việc của Trưởng phòng chuyên môn hoặc chuyên viên thụ lý theo quy tắc phân công định sẵn.

[[IMAGE: assets/diagrams/hinh_2_5_dfd_muc_1_tiep_nhan_xu_ly.png | Caption: Hình 2.5: Sơ đồ luồng dữ liệu phân rã mức một: Phân hệ tiếp nhận, số hóa và phân công hồ sơ]]

3.4.4. Sơ đồ luồng dữ liệu phân rã mức một: Phân hệ thẩm định, ký số và phát hành kết quả

Sơ đồ luồng dữ liệu phân rã mức một (Hình 2.6) mô tả chu trình dữ liệu tại các phòng chuyên môn và bộ phận lãnh đạo phê duyệt:

Tiến trình 2.1: Thẩm định nội dung thủ tục hành chính. Chuyên viên thụ lý truy cập Kho lưu trữ D1 và Kho lưu trữ D2 để trích xuất hồ sơ số hóa, tiến hành thẩm tra các điều kiện chuyên môn, soạn thảo dự thảo văn bản kết quả giải quyết.

Tiến trình 2.2: Phối hợp lấy ý kiến liên Sở, ngành. Đối với hồ sơ liên thông, chuyên viên gửi yêu cầu phối hợp qua mạng nội bộ. Cơ quan phối hợp truy cập dữ liệu hồ sơ, nhập văn bản ý kiến phản hồi có ký số, hệ thống ghi nhận vào quá trình xử lý hồ sơ.

Tiến trình 2.3: Lãnh đạo thẩm duyệt và ký số công vụ. Lãnh đạo phòng chuyên môn thẩm tra ký nháy dự thảo, Lãnh đạo cơ quan xem xét toàn bộ hồ sơ và thực hiện lệnh ký số bằng chứng thư số chuyên dùng công vụ.

Tiến trình 2.4: Đóng dấu số và phát hành kết quả điện tử. Văn thư cơ quan thực hiện cấp số văn bản đi chính thức, ký số con dấu cơ quan và phát hành văn bản kết quả vào Kho lưu trữ kết quả điện tử (Kho lưu trữ D4). Hệ thống tự động chuyển văn bản kết quả vào Kho dữ liệu cá nhân của người nộp và kích hoạt thông báo hoàn thành giải quyết hồ sơ.

[[IMAGE: assets/diagrams/hinh_2_6_dfd_muc_1_thu_ly_phe_duyet.png | Caption: Hình 2.6: Sơ đồ luồng dữ liệu phân rã mức một: Phân hệ thẩm định, ký số và phát hành kết quả]]
