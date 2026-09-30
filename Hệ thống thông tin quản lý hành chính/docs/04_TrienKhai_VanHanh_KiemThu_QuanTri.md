V. TRIỂN KHAI, VẬN HÀNH, KIỂM THỬ VÀ QUẢN TRỊ HỆ THỐNG

5.1. Triển khai và cài đặt hệ thống trên hạ tầng Trung tâm dữ liệu

Hạ tầng kỹ thuật phục vụ triển khai Hệ thống thông tin giải quyết thủ tục hành chính cấp tỉnh được thiết lập tập trung tại Trung tâm tích hợp dữ liệu của tỉnh, bảo đảm các tiêu chuẩn quốc tế về trung tâm dữ liệu cấp độ ba và tuân thủ các quy định khắt khe về an toàn hệ thống thông tin theo cấp độ của Chính phủ.

Mô hình triển khai hạ tầng mạng được phân chia thành bốn vùng mạng độc lập, ngăn cách đa tầng bằng hệ thống tường lửa thế hệ mới (Hình 4.1):

Vùng 1: Kênh truy cập biên giới mạng. Tiếp nhận hai luồng kết nối chính:
Luồng kết nối công cộng từ Internet: Phục vụ công dân, doanh nghiệp truy cập Cổng Dịch vụ công thông qua giao thức truyền tải siêu văn bản an toàn với thuật toán mã hóa mạnh. Toàn bộ lưu lượng Internet được dẫn qua hệ thống chống tấn công từ chối dịch vụ phân tán và tường lửa ứng dụng web để thanh lọc mã độc trước khi vào mạng nội bộ.
Luồng kết nối mạng truyền số liệu chuyên dùng cấp hai: Mạng diện rộng độc lập của cơ quan Đảng và Nhà nước, kết nối liên thông trụ sở Ủy ban nhân dân tỉnh với các Sở, Ban, Ngành, Ủy ban nhân dân cấp huyện và Ủy ban nhân dân cấp xã, bảo đảm băng thông cao, ổn định và miễn nhiễm hoàn toàn với các nguy cơ tấn công từ không gian mạng công cộng.

Vùng 2: Vùng bán công khai DMZ. Nơi đặt các dịch vụ hướng ra bên ngoài nhưng được cô lập hoàn toàn với vùng cơ sở dữ liệu nội bộ:
Cụm máy chủ cổng web: Gồm bốn máy chủ ảo hóa hoạt động song song theo cơ chế cân bằng tải chủ động - chủ động, bảo đảm năng lực tiếp nhận hàng chục nghìn lượt truy cập đồng thời.
Cụm cổng kết nối giao diện lập trình ứng dụng LGSP: Kiểm soát các kết nối chia sẻ dữ liệu liên ngành, quản lý khóa bảo mật và giới hạn tần suất truy vấn để chống hiện tượng quá tải hệ thống.
Máy chủ tiếp nhận xác thực VNeID: Xử lý các yêu cầu đăng nhập và giải mã các gói tin dữ liệu nhân thân từ Trung tâm Dữ liệu quốc gia về Dân cư.

Vùng 3: Vùng ứng dụng nghiệp vụ nội bộ . Được bảo vệ phía sau tường lửa nội bộ nghiêm ngặt:
Cụm máy chủ Một cửa điện tử và Thụ lý chuyên môn: Gồm sáu máy chủ ảo hóa phân tán tải, chạy động cơ điều phối quy trình công vụ, xử lý toàn bộ logic nghiệp vụ kiểm tra hồ sơ, tính giờ hẹn trả, bóc tách dữ liệu số hóa và phân công công việc.
Máy chủ ký số tập trung phần cứng bảo mật chuyên dụng: Thiết bị phần cứng bảo mật chuyên dụng đạt chuẩn quốc tế FIPS 140-2 Cấp độ ba được lắp đặt trên tủ rack riêng, kết nối trực tiếp với cụm ứng dụng qua đường truyền mạng cục bộ mã hóa riêng biệt để thực hiện ký số công vụ tập trung và đóng dấu số cơ quan với tốc độ hàng nghìn văn bản trong một giây.
Máy chủ kết nối biên lai và kho bạc: Xử lý các gói tin hạch toán ngân sách, điều phối phát hành biên lai điện tử và vận hành tiến trình đối soát tài chính ba bên tự động cuối ngày.

Vùng 4: Vùng cơ sở dữ liệu cô lập . Đây là vùng mạng được bảo vệ ở cấp độ an ninh cao nhất:
Cụm máy chủ cơ sở dữ liệu chính: Triển khai theo mô hình cụm hoạt động và dự phòng nóng. Dữ liệu ghi nhận tại nút chính được đồng bộ tức thời sang nút dự phòng qua đường cáp quang chuyên dụng. Kích hoạt công nghệ mã hóa cơ sở dữ liệu trong suốt bảo đảm toàn bộ tệp dữ liệu lưu trên đĩa cứng đều được mã hóa bằng thuật toán mã hóa tiên tiến. Vùng này tuyệt đối không có kết nối trực tiếp ra Internet và chỉ tiếp nhận truy vấn dữ liệu từ các máy chủ thuộc Vùng ứng dụng nghiệp vụ nội bộ.
Hệ thống lưu trữ đối tượng số hóa: Lưu trữ tệp tin văn bản điện tử và giấy tờ quét, kích hoạt cơ chế chống ghi đè bảo đảm tính bất biến của chứng cứ hành chính điện tử.
Máy chủ quản lý nhật ký kiểm toán an ninh mạng SIEM: Tiếp nhận và lưu trữ toàn bộ nhật ký sự kiện, nhật ký truy cập và nhật ký thao tác của người dùng trên toàn hệ thống trong thời gian tối thiểu hai năm.

[[IMAGE: assets/diagrams/hinh_4_1_kien_truc_ha_tang_mang_an_toan_cap_3.png | Caption: Hình 4.1: Kiến trúc hạ tầng Trung tâm dữ liệu và phân vùng mạng an toàn thông tin cấp độ ba]]

Bảng 5.1: Thông số cấu hình hạ tầng máy chủ và phân vùng mạng tại Trung tâm dữ liệu

| Phân vùng mạng | Tên thành phần máy chủ | Số lượng | Cấu hình phần cứng tối thiểu | Vai trò và Cơ chế dự phòng |
| :--- | :--- | :---: | :--- | :--- |
| Vùng biên giới | Thiết bị Tường lửa thế hệ mới | 02 thiết bị | Thông lượng tường lửa 40 Gbps, IPS 20 Gbps | Cặp tường lửa hoạt động song song chủ động - chủ động |
| Vùng biên giới | Hệ thống Tường lửa ứng dụng web | 02 thiết bị | Băng thông lọc web 10 Gbps, xử lý 50.000 req/s | Ngăn chặn tấn công tầng ứng dụng, chống khai thác lỗ hổng web |
| Vùng bán công khai | Máy chủ Web Cổng DVC trực tuyến | 04 máy ảo | 16 nhân vi xử lý, 32 GB bộ nhớ truy xuất, 200 GB SSD | Cân bằng tải bằng giải pháp cân bằng tải chuyên dụng |
| Vùng bán công khai | Cổng giao tiếp chia sẻ dữ liệu LGSP | 02 máy ảo | 16 nhân vi xử lý, 32 GB bộ nhớ truy xuất, 200 GB SSD | Cân bằng tải, điều phối thông điệp kết nối NDXP |
| Vùng ứng dụng | Cụm máy chủ Một cửa và Thụ lý | 06 máy ảo | 32 nhân vi xử lý, 64 GB bộ nhớ truy xuất, 500 GB SSD | Phân cụm ứng dụng, tự động nhân bản tải khi quá 80% công suất |
| Vùng ứng dụng | Thiết bị Ký số tập trung phần cứng chuyên dụng | 02 thiết bị | Chuẩn FIPS 140-2 Level 3, tốc độ 1.500 chữ ký/s | Cặp thiết bị phần cứng bảo mật chạy dự phòng nóng 1:1 |
| Vùng ứng dụng | Máy chủ Kết nối Biên lai & Đối soát | 02 máy ảo | 16 nhân vi xử lý, 32 GB bộ nhớ truy xuất, 300 GB SSD | Tự động chạy tiến trình đối soát ngân sách cuối ngày |
| Vùng CSDL cô lập | Cụm Cơ sở dữ liệu chính quan hệ | 02 máy chủ vật lý | 64 nhân vi xử lý, 256 GB bộ nhớ, 10 TB SAN SSD | Cụm chuyển đổi dự phòng nóng tự động, mã hóa TDE toàn diện |
| Vùng CSDL cô lập | Kho lưu trữ đối tượng số hóa | 04 máy chủ lưu trữ | 32 nhân vi xử lý, 64 GB bộ nhớ, 100 TB đĩa cứng | Cơ chế chống ghi đè WORM, bảo toàn tính pháp lý văn bản số |
| Vùng CSDL cô lập | Máy chủ Nhật ký kiểm toán SIEM | 02 máy ảo | 32 nhân vi xử lý, 64 GB bộ nhớ, 20 TB lưu trữ | Thu thập vết kiểm toán tập trung, không thể chỉnh sửa, xóa |

5.2. Kế hoạch và quy trình kiểm thử hệ thống toàn diện

Trước khi đưa Hệ thống thông tin giải quyết thủ tục hành chính vào vận hành chính thức phục vụ nhân dân, toàn bộ phần mềm và hạ tầng phải trải qua một quy trình kiểm thử toàn diện, nghiêm ngặt bao gồm ba giai đoạn độc lập: Kiểm thử chức năng nghiệp vụ, Kiểm thử tải hiệu năng và Kiểm thử an toàn thông tin mạng.

5.2.1. Kiểm thử chức năng nghiệp vụ

Kiểm thử chức năng được thực hiện theo phương pháp kiểm thử hộp đen dựa trên ma trận các ca kiểm thử bám sát toàn bộ các quy trình công vụ quy định trong văn bản quy phạm pháp luật.

Bảng 5.2: Ma trận kịch bản kiểm thử chức năng nghiệp vụ trọng yếu của hệ thống

| Mã ca kiểm thử | Tên chức năng kiểm thử | Dữ liệu đầu vào và Thao tác thực hiện | Kết quả kỳ vọng đạt chuẩn | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| KT-CN-01 | Đăng nhập VNeID Mức độ hai | Quét mã phản hồi nhanh từ ứng dụng VNeID trên điện thoại của công dân. | Xác thực thành công dưới 03 giây, tạo phiên làm việc, hiển thị đúng họ tên và số CCCD. | Đạt |
| KT-CN-02 | Tự động điền dữ liệu biểu mẫu | Chọn thủ tục "Cấp bản sao trích lục hộ tịch" trực tuyến toàn trình. | Toàn bộ thông tin nhân thân được điền tự động chính xác; các trường này bị khóa cứng chỉ đọc. | Đạt |
| KT-CN-03 | Tái sử dụng giấy tờ số hóa | Chọn nộp hồ sơ có thành phần là Giấy đăng ký kinh doanh đã có trong kho cá nhân. | Hệ thống cho phép chọn tệp từ Kho cá nhân, kiểm tra chữ ký số công vụ hợp lệ, không bắt nộp lại. | Đạt |
| KT-CN-04 | Cấp mã số hồ sơ và hẹn giờ | Cán bộ Một cửa bấm tiếp nhận hồ sơ hợp lệ tại bàn làm việc điện tử. | Hệ thống sinh mã số duy nhất theo chuẩn quốc gia, in giấy hẹn tự động loại trừ thứ bảy, chủ nhật. | Đạt |
| KT-CN-05 | Phong tỏa chờ nộp lệ phí | Thẩm định hồ sơ đạt yêu cầu, chuyển trạng thái sang Chờ nộp phí, lệ phí. | Sinh mã định danh thanh toán; khóa bước duyệt tiếp theo cho đến khi hoàn thành nộp tiền. | Đạt |
| KT-CN-06 | Thanh toán trực tuyến đa kênh | Quét mã QR chuyển khoản nộp 150.000 VNĐ qua ứng dụng ngân hàng di động. | Tài khoản bị trừ tiền, hệ thống nhận bản tin tức thời, tự chuyển sang trạng thái Đã nộp tiền. | Đạt |
| KT-CN-07 | Tự động phát hành biên lai số | Nhận bản tin thanh toán trực tuyến thành công từ cổng trung gian thanh toán. | Hệ thống biên lai ký số tự động trong 05 giây, gửi bản điện tử vào Kho dữ liệu của người nộp. | Đạt |
| KT-CN-08 | Khóa yêu cầu bổ sung nhiều lần | Cán bộ đã ban hành văn bản hướng dẫn bổ sung hồ sơ lần một thành công. | Nút chức năng yêu cầu bổ sung bị vô hiệu hóa; không cho phép cán bộ ban hành lần hai. | Đạt |
| KT-CN-09 | Ký số công vụ tập trung | Lãnh đạo cơ quan thực hiện ký duyệt văn bản kết quả bằng chứng thư số công vụ. | Chữ ký số tích hợp hợp lệ, hiển thị đúng thông tin họ tên, chức vụ và cơ quan ban hành. | Đạt |
| KT-CN-10 | Đóng dấu số cơ quan nhà nước | Văn thư cơ quan cấp số văn bản đi và áp dụng con dấu số điện tử màu đỏ. | Hình ảnh con dấu màu đỏ trùm lên một phần ba chữ ký số cá nhân về phía bên trái theo NĐ 30/2020. | Đạt |
| KT-CN-11 | Bắt buộc thư xin lỗi khi trễ | Cán bộ cố tình hoàn thành hồ sơ đã bị quá hạn xử lý trên phần mềm. | Hệ thống ngăn chặn bấm hoàn thành; bắt buộc phải đính kèm tệp văn bản xin lỗi có ký số. | Đạt |
| KT-CN-12 | Đồng bộ số liệu Bộ chỉ số 766 | Kiểm tra tiến trình đồng bộ dữ liệu vào 24h00 hằng ngày về Cổng DVCQG. | Đồng bộ thành công 100% bản ghi hồ sơ phát sinh trong ngày; khớp điểm thành phần. | Đạt |

5.2.2. Kiểm thử tải hiệu năng và độ chịu đựng

Kiểm thử hiệu năng nhằm mục đích xác định giới hạn chịu đựng tối đa của hệ sinh thái phần mềm và hạ tầng máy chủ trong các điều kiện khắc nghiệt, bảo đảm hệ thống không bị đổ vỡ khi số lượng người dân truy cập tăng đột biến.

Bảng 5.3: Kế hoạch kiểm thử tải hiệu năng và sức chịu đựng của hệ thống với nhiều kịch bản

| Kịch bản kiểm thử | Mục đích kịch bản | Tải mô phỏng đồng thời | Thời gian duy trì | Tiêu chí đánh giá thành công | Kết quả thực tế |
| :---: | :--- | :---: | :---: | :--- | :---: |
| Kịch bản 1: Tải thông thường | Kiểm tra vận hành ổn định trong giờ hành chính ngày làm việc tiêu chuẩn. | 2.000 người dùng ảo đồng thời | 04 giờ liên tục | Thời gian phản hồi trang dưới 1.0 giây; tải vi xử lý cụm máy chủ ứng dụng dưới 35%. | Đạt chuẩn |
| Kịch bản 2: Tải giờ cao điểm | Mô phỏng lưu lượng truy cập cao nhất vào đầu giờ sáng và đầu giờ chiều. | 6.000 người dùng ảo đồng thời | 02 giờ liên tục | Thời gian phản hồi dưới 1.5 giây; không có lỗi kết nối cơ sở dữ liệu; tải vi xử lý dưới 60%. | Đạt chuẩn |
| Kịch bản 3: Tải đỉnh đột biến | Thử thách khả năng chịu tải cực đại khi có thông báo nộp hồ sơ chỉ tiêu lớn. | 12.000 người dùng ảo đồng thời | 30 phút liên tục | Cân bằng tải phân bổ đều; tỷ lệ phản hồi lỗi dưới 0.01%; thời gian phản hồi dưới 2.5 giây. | Đạt chuẩn |
| Kịch bản 4: Độ bền bỉ liên tục | Kiểm tra hiện tượng rò rỉ bộ nhớ và ổn định cơ sở dữ liệu sau thời gian dài. | 3.000 người dùng ảo liên tục | 72 giờ không nghỉ | Hệ thống vận hành liên tục không phải khởi động lại; mức tiêu thụ bộ nhớ ổn định phẳng. | Đạt chuẩn |
| Kịch bản 5: Tải ký số hàng loạt | Kiểm tra năng lực ký số công vụ qua thiết bị phần cứng bảo mật chuyên dụng. | 1.000 lệnh ký số trong một giây | 10 phút liên tục | Thiết bị HSM xử lý trơn tru không nghẽn lệnh; chữ ký số toàn vẹn, hợp lệ 100%. | Đạt chuẩn |

5.2.3. Kiểm thử an toàn thông tin mạng và rà quét lỗ hổng

Hệ thống được kiểm thử bảo mật chuyên sâu bởi đơn vị kiểm toán an toàn thông tin độc lập có giấy phép của Bộ Thông tin và Truyền thông theo các nội dung cốt lõi:

Rà quét mã nguồn và kiểm thử lỗ hổng ứng dụng web: Sử dụng các công cụ rà quét tự động kết hợp chuyên gia kiểm thử xâm nhập thực tế để rà quét toàn diện theo danh mục mười lỗ hổng bảo mật ứng dụng web nguy hiểm nhất thế giới. Kết quả kiểm thử bảo đảm hệ thống không tồn tại các lỗ hổng tiêm mã độc SQL, không có lỗ hổng thực thi mã từ xa, không bị lỗi phân quyền kiểm soát truy cập và không bị lộ lọt dữ liệu phiên làm việc.

Kiểm tra an toàn cấu hình hệ điều hành và cơ sở dữ liệu: Kiểm tra tính tuân thủ quy chuẩn đóng các cổng dịch vụ thừa trên máy chủ, kiểm tra chính sách mật khẩu phức tạp, kiểm tra tính hiệu quả của cơ chế mã hóa dữ liệu cơ sở dữ liệu trong suốt và rà soát quyền hạn quản trị viên máy chủ.

Chứng nhận an toàn hệ thống thông tin cấp độ ba: Toàn bộ hồ sơ thiết kế, phương án bảo đảm an toàn thông tin và báo cáo kết quả kiểm thử đánh giá được trình Cục An toàn thông tin thẩm định và phê duyệt phương án bảo đảm an toàn hệ thống thông tin cấp độ ba trước khi hệ thống chính thức hòa mạng diện rộng.

5.3. Quy trình vận hành và giám sát hệ thống thời gian thực

5.3.1. Quy trình vận hành hàng ngày của đội ngũ kỹ sư

Công tác quản trị, vận hành hệ thống được thực thi theo quy trình chuẩn hóa hằng ngày:

Đầu giờ làm việc (07h00 đến 07h30): Đội ngũ kỹ sư kiểm tra trạng thái hoạt động của toàn bộ cụm máy chủ ảo hóa trên bảng điều khiển hạ tầng; kiểm tra tình trạng kết nối đường truyền mạng truyền số liệu chuyên dùng; kiểm tra tính sẵn sàng của thiết bị ký số phần cứng chuyên dụng; rà soát dung lượng bộ nhớ và ổ đĩa lưu trữ.

Trong giờ làm việc (07h30 đến 17h00): Giám sát liên tục lưu lượng truy cập và hiệu năng hệ thống qua màn hình giám sát thời gian thực; theo dõi tiến độ xử lý hồ sơ và các cảnh báo nguy cơ quá hạn; hỗ trợ kỹ thuật trực tuyến cho công chức tại Bộ phận Một cửa và người dân khi gặp lỗi kỹ thuật trong quá trình nộp hồ sơ hoặc thanh toán trực tuyến.

Cuối ngày làm việc (17h00 đến 24h00):
Kiểm tra tiến trình đối soát tài chính ba bên tự động giữa Hệ thống Một cửa, Cổng thanh toán quốc gia và Kho bạc Nhà nước. Nếu phát hiện sai lệch số liệu, ghi nhận vào biên bản để xử lý ngay đầu giờ sáng hôm sau.
Giám sát tiến trình đồng bộ dữ liệu hồ sơ tự động sang Cổng Dịch vụ công Quốc gia vào lúc 24h00 để phục vụ công tác tính điểm Bộ chỉ số 766 của tỉnh.
Kích hoạt tiến trình sao lưu cơ sở dữ liệu tự động hằng ngày và kiểm tra tính toàn vẹn của tệp sao lưu.

5.3.2. Chiến lược sao lưu dữ liệu ba - hai - một và phục hồi sau thảm họa

Dữ liệu thủ tục hành chính là tài sản số quốc gia mang giá trị pháp lý vĩnh viễn, do đó hệ thống áp dụng chiến lược sao lưu dữ liệu tiêu chuẩn ba - hai - một kết hợp trung tâm dự phòng thảm họa độc lập (Hình 4.2):

Ba bản sao dữ liệu: Bản sao thứ nhất là cơ sở dữ liệu vận hành trực tiếp thời gian thực tại Trung tâm dữ liệu chính. Bản sao thứ hai là tệp sao lưu dữ liệu được thực hiện định kỳ hằng ngày lưu tại hệ thống lưu trữ cục bộ. Bản sao thứ ba là bản sao lưu ngoại vi được đồng bộ tự động sang Trung tâm dữ liệu dự phòng thảm họa cách biệt về mặt địa lý trên ba mươi kilômét.

Hai định dạng môi trường lưu trữ khác nhau: Kết hợp đồng thời giữa mảng đĩa cứng thể rắn tốc độ cao phục vụ truy vấn và khôi phục nhanh, với hệ thống băng từ chuyên dụng có cơ chế ngắt kết nối vật lý bảo đảm an toàn tuyệt đối trước các loại mã độc tống tiền mã hóa dữ liệu.

Một bản lưu ngoại vi: Đặt tại Trung tâm dữ liệu dự phòng đám mây của tỉnh, được mã hóa toàn diện trước khi truyền tải qua đường truyền cáp quang chuyên dùng bảo mật.

[[IMAGE: assets/diagrams/hinh_4_2_quy_trinh_van_hanh_sao_luu_du_phong.png | Caption: Hình 4.2: Quy trình vận hành, chiến lược sao lưu dữ liệu ba hai một và phục hồi sau thảm họa]]

Chỉ số cam kết phục hồi dịch vụ :
Thời gian phục hồi dịch vụ RTO: Dưới 30 phút trong trường hợp hỏng hóc toàn bộ máy chủ tại Trung tâm dữ liệu chính. Hệ thống tự động chuyển hướng truy cập tên miền sang Trung tâm dữ liệu dự phòng thảm họa.
Mức độ mất mát dữ liệu tối đa RPO: Dưới 05 phút giao dịch nhờ vào cơ chế đồng bộ nhật ký giao dịch cơ sở dữ liệu thời gian thực.
Định kỳ sáu tháng một lần, Sở Thông tin và Truyền thông chủ trì tổ chức diễn tập thực tế phương án phục hồi sau thảm họa, bảo đảm năng lực sẵn sàng ứng phó trong mọi tình huống thiên tai, hỏa hoạn hoặc tấn công phá hoại hạ tầng mạng.

5.3.3. Quy trình tiếp nhận và ứng cứu sự cố kỹ thuật

Sự cố kỹ thuật trong quá trình vận hành được phân loại thành ba cấp độ xử lý:

Sự cố Cấp độ một (Sự cố đặc biệt khẩn cấp): Hệ thống ngừng hoạt động hoàn toàn, người dân không thể truy cập Cổng Dịch vụ công hoặc toàn bộ cán bộ công chức không thể tiếp nhận hồ sơ. Thời hạn xử lý: Đội ứng cứu khẩn cấp phải có mặt và cô lập sự cố trong vòng 15 phút, khôi phục hoạt động chậm nhất trong vòng 60 phút.

Sự cố Cấp độ hai (Sự cố nghiêm trọng): Một phân hệ chức năng bị lỗi (như cổng thanh toán trực tuyến bị gián đoạn, dịch vụ ký số tập trung bị treo hoặc lỗi kết nối với Cơ sở dữ liệu quốc gia về dân cư). Thời hạn xử lý: Khắc phục triệt để trong vòng 02 giờ làm việc, đồng thời kích hoạt quy trình tác nghiệp dự phòng tạm thời để không làm gián đoạn việc tiếp nhận hồ sơ của dân.

Sự cố Cấp độ ba (Sự cố thông thường): Lỗi hiển thị giao diện cục bộ, tốc độ tải trang chậm tại một số thời điểm hoặc lỗi tài khoản người dùng cá biệt. Thời hạn xử lý: Khắc phục trong vòng 04 giờ làm việc.

5.4. Quản trị hệ thống và phương án an toàn thông tin cấp độ ba

5.4.1. Quản trị phân quyền dựa trên vai trò và vị trí công tác

Hệ thống áp dụng mô hình kiểm soát truy cập dựa trên vai trò kết hợp nguyên tắc đặc quyền tối thiểu: Người dùng chỉ được cấp các quyền hạn vừa đủ để hoàn thành chức năng, nhiệm vụ được giao theo đề án vị trí việc làm.

Bảng 5.4: Ma trận phân quyền kiểm soát truy cập dựa trên vai trò và vị trí công tác

| Quyền hạn trên hệ thống | Cán bộ Một cửa | Chuyên viên thụ lý | Trưởng phòng | Lãnh đạo cơ quan | Văn thư | Kế toán thu phí | Quản trị hệ thống |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tiếp nhận hồ sơ và Cấp mã | Toàn quyền | Không có quyền | Xem | Xem | Không | Không | Xem |
| Số hóa hồ sơ tại quầy | Toàn quyền | Không có quyền | Không | Không | Không | Không | Không |
| Phân công chuyên viên | Không có quyền | Không có quyền | Toàn quyền | Toàn quyền | Không | Không | Cấu hình luật |
| Thẩm định và Lập dự thảo | Xem | Toàn quyền | Xem | Xem | Không | Không | Không |
| Xin ý kiến phối hợp liên Sở | Không có quyền | Đề xuất | Phê duyệt | Chỉ đạo | Không | Không | Không |
| Ký nháy văn bản dự thảo | Không có quyền | Ký nháy | Ký nháy | Không | Không | Không | Không |
| Ký số chứng thư công vụ | Không có quyền | Không có quyền | Không | Toàn quyền | Không | Không | Không |
| Cấp số và Đóng dấu số | Không có quyền | Không có quyền | Không | Không | Toàn quyền | Không | Không |
| Xuất biên lai tài chính | Không có quyền | Không có quyền | Không | Không | Không | Toàn quyền | Xem |
| Cấu hình quy trình TTHC | Không có quyền | Không có quyền | Không | Không | Không | Không | Toàn quyền |
| Xem nhật ký kiểm toán hệ thống | Không có quyền | Không có quyền | Không | Không | Không | Không | Chỉ đọc SIEM |

5.4.2. Quản trị danh mục thủ tục hành chính và cấu hình quy trình động

Hệ thống cung cấp công cụ quản trị danh mục động cho phép cán bộ quản trị cập nhật kịp thời các thay đổi về thủ tục hành chính theo các quyết định công bố mới của Chủ tịch Ủy ban nhân dân tỉnh:

Thêm mới hoặc sửa đổi thủ tục hành chính: Cập nhật mã thủ tục, tên gọi, thành phần hồ sơ bắt buộc, mức phí, lệ phí, thời hạn giải quyết và biểu mẫu điện tử tương tác mà hoàn toàn không cần phải can thiệp sửa đổi mã nguồn phần mềm.

Thiết kế quy trình luân chuyển bằng giao diện kéo thả trực quan: Cho phép định cấu hình quy trình thẩm định phức tạp gồm nhiều bước song song hoặc tuần tự, gắn định mức thời gian xử lý cho từng bước và thiết lập thẩm quyền ký duyệt tương ứng với từng cấp hành chính.

5.4.3. Quản trị nhật ký kiểm toán hệ thống bất biến và an toàn thông tin

Hệ thống ghi vết toàn diện mọi hành vi tương tác trên phần mềm:

Cấu trúc bản ghi nhật ký kiểm toán bao gồm: Thời điểm chính xác đến phần nghìn giây; Mã định danh người dùng; Họ tên và chức vụ; Địa chỉ mạng nội bộ; Tên chức năng thao tác; Hành động thực hiện (Xem, Thêm mới, Sửa đổi, Xóa, Phê duyệt, Ký số); Mã hồ sơ liên quan; Dữ liệu trước khi sửa đổi và Dữ liệu sau khi sửa đổi.

Nhật ký kiểm toán được đồng bộ theo thời gian thực về máy chủ SIEM của Trung tâm giám sát và điều hành an toàn thông tin mạng SOC tỉnh. Hệ thống áp dụng thuật toán trí tuệ nhân tạo để tự động phân tích hành vi bất thường của người dùng nội bộ, ví dụ: cán bộ đăng nhập từ địa chỉ mạng lạ ngoài giờ hành chính, hành vi tải về hàng loạt dữ liệu hồ sơ công dân, hoặc thao tác can thiệp thay đổi trạng thái hồ sơ trái thẩm quyền. Khi phát hiện các dấu hiệu này, hệ thống lập tức khóa tài khoản vi phạm và gửi cảnh báo khẩn cấp cho Quản trị viên an ninh mạng xử lý.
