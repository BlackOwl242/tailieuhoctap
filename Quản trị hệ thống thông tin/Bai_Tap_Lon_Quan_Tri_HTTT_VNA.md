HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH
HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG
__________________________________

[[IMAGE: assets/diagrams/logo_hoc_vien.png | Caption: ]]

TÊN ĐỀ TÀI:
Phân tích, đánh giá và đề xuất giải pháp nâng cấp, hoàn thiện Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)
---------------------------------------------------------
BÀI TẬP LỚN KẾT THÚC HỌC PHẦN
Học phần : Quản trị hệ thống thông tin
GVHD : ThS. Lê Hoàng Diệp
Sinh viên : Lê Quốc Huy – 2305HTTB011
Lớp : 2305HTTB

Hà Nội - 2026

<div style="page-break-after: always;"></div>

LỜI CẢM ƠN

Em xin gửi lời cảm ơn chân thành tới cô ThS. Lê Hoàng Diệp, giảng viên trực tiếp giảng dạy và hướng dẫn học phần Quản trị hệ thống thông tin tại Học viện Hành chính và Quản trị công. Trong suốt các buổi học trên lớp cũng như khi em làm bài tập lớn này, cô đã hướng dẫn rất kỹ cách nhìn một hệ thống thông tin từ giao diện người dùng bên ngoài xuống tới quy trình xử lý và cơ sở dữ liệu bên dưới, đồng thời chỉ ra những chỗ còn thiếu sót để em chỉnh sửa bài làm sát với thực tế hơn.

Em cũng xin cảm ơn Ban Giám đốc Học viện Hành chính và Quản trị công cùng các thầy, cô Khoa Khoa học Liên ngành, Ngoại ngữ, Tin học đã tạo điều kiện về tài liệu, giáo trình chuyên ngành trong thời gian em học tập tại trường.

Khi bắt tay vào tìm hiểu hệ thống đặt vé và làm thủ tục trực tuyến của Vietnam Airlines, dù em đã cố gắng tự thao tác kiểm chứng trên trang web và ứng dụng của hãng để đối chiếu với lý thuyết đã học, nhưng do kiến thức và kinh nghiệm thực tế với hệ thống ngành hàng không còn hạn chế nên bài làm chắc chắn vẫn còn thiếu sót. Em rất mong nhận được ý kiến nhận xét và chỉ dẫn thêm của cô.

Em xin chân thành cảm ơn!

<div style="page-break-after: always;"></div>

LỜI CAM ĐOAN

Em là Lê Quốc Huy (Mã sinh viên: 2305HTTB011, Lớp: 2305HTTB), sinh viên ngành Hệ thống thông tin tại Khoa Khoa học Liên ngành, Ngoại ngữ, Tin học, Học viện Hành chính và Quản trị công. Em xin cam đoan bài tập lớn kết thúc học phần Quản trị hệ thống thông tin với đề tài “Phân tích, đánh giá và đề xuất giải pháp nâng cấp, hoàn thiện Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)” là bài làm do tự bản thân em tìm hiểu, khảo sát và viết dưới sự hướng dẫn của cô ThS. Lê Hoàng Diệp.

Các sơ đồ phân tích, bảng thiết kế cơ sở dữ liệu, hình chụp màn hình giao diện, số liệu khảo sát người dùng và các giải pháp đề xuất trong báo cáo đều là kết quả làm việc cá nhân của em, không sao chép từ bất kỳ bài tập lớn, tiểu luận hay khóa luận nào khác. Những giáo trình, văn bản pháp luật và báo cáo thường niên dùng làm tài liệu tham khảo trong bài đều có ghi chú nguồn rõ ràng ở danh mục cuối bài theo quy định của Học viện.

Nếu có bất kỳ sự gian lận hay sao chép nào trái quy định, em xin chịu hoàn toàn trách nhiệm trước Bộ môn, Khoa và Học viện.

Em xin trân trọng cam đoan!

<div style="page-break-after: always;"></div>

Mục lục

<div style="page-break-after: always;"></div>

DANH MỤC TỪ/ THUẬT NGỮ VIẾT TẮT

| STT | Từ viết tắt | Thuật ngữ đầy đủ và Diễn giải |
| :---: | :---: | :--- |
| 1 | 3NF | Dạng chuẩn ba trong thiết kế cơ sở dữ liệu quan hệ (Third Normal Form) |
| 2 | API | Giao diện lập trình ứng dụng (Application Programming Interface) |
| 3 | BCBP | Thẻ lên máy bay có mã vạch hai chiều (Bar Coded Boarding Pass) |
| 4 | BCE | Mô hình lớp Biên giao diện - Điều khiển - Thực thể (Boundary - Control - Entity) |
| 5 | BSV | Chương trình khách hàng thân thiết Bông Sen Vàng (Lotusmiles) |
| 6 | CCCD | Căn cước công dân gắn chip điện tử |
| 7 | CDN | Mạng phân phối nội dung (Content Delivery Network) |
| 8 | CNTT | Công nghệ thông tin |
| 9 | CRM | Hệ thống quản trị quan hệ khách hàng (Customer Relationship Management) |
| 10 | CSDL | Cơ sở dữ liệu |
| 11 | DSS | Hệ thống hỗ trợ ra quyết định (Decision Support System) |
| 12 | EIS | Hệ thống thông tin điều hành cấp cao (Executive Information System) |
| 13 | ERD | Lược đồ thực thể - quan hệ cơ sở dữ liệu (Entity-Relationship Diagram) |
| 14 | ERP | Hệ thống hoạch định nguồn lực doanh nghiệp (Enterprise Resource Planning) |
| 15 | GTGT | Giá trị gia tăng |
| 16 | HTTPS | Giao thức truyền tải siêu văn bản bảo mật (HyperText Transfer Protocol Secure) |
| 17 | HTTT | Hệ thống thông tin |
| 18 | IATA | Hiệp hội Vận tải Hàng không Quốc tế (International Air Transport Association) |
| 19 | Kiosk | Quầy làm thủ tục tự động có màn hình cảm ứng tại sân bay (Kiosk Check-in) |
| 20 | MIS | Hệ thống thông tin quản lý (Management Information System) |
| 21 | OTP | Mã xác thực sử dụng một lần (One-Time Password) |
| 22 | PNR | Mã hồ sơ đặt chỗ của hành khách (Passenger Name Record) |
| 23 | QR | Mã phản hồi nhanh hai chiều dùng trong thanh toán điện tử (Quick Response) |
| 24 | RBAC | Cơ chế phân quyền truy cập dựa trên vai trò (Role-Based Access Control) |
| 25 | SEQ | Số thứ tự hành khách làm thủ tục lên tàu bay (Sequence Number) |
| 26 | TPS | Hệ thống xử lý giao dịch tác nghiệp hàng ngày (Transaction Processing System) |
| 27 | UC | Ca sử dụng chức năng của hệ thống (Use Case) |
| 28 | UML | Ngôn ngữ mô hình hóa thống nhất (Unified Modeling Language) |
| 29 | VNA | Tổng công ty Hàng không Việt Nam (Vietnam Airlines) |
| 30 | VNeID | Ứng dụng định danh điện tử quốc gia của Bộ Công an |

<div style="page-break-after: always;"></div>

I. MỞ ĐẦU

1.1. Lý do chọn đề tài

Trong những năm gần đây, thay vì phải trực tiếp ra phòng vé hay xếp hàng chờ đợi lâu tại quầy sân bay như trước, phần lớn hành khách đi máy bay đều đã chuyển sang tự mua vé và làm thủ tục trực tuyến trên điện thoại hoặc máy tính. Tại Việt Nam, Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Tổng công ty Hàng không Việt Nam (Vietnam Airlines), vận hành trên trang web chính thức https://www.vietnamairlines.com và ứng dụng di động Vietnam Airlines, là một trong những hệ thống giao dịch trực tuyến có quy mô lớn và phổ biến nhất của ngành giao thông vận tải. Mỗi năm hệ thống phục vụ hàng chục triệu lượt hành khách tra cứu lịch bay, đặt giữ chỗ, thanh toán tiền vé và chọn ghế ngồi trên hơn 100 đường bay nội địa và quốc tế. Đây cũng là một hệ thống đang hoạt động rộng rãi ngoài thực tế, bất kỳ người dùng nào cũng có thể trực tiếp truy cập để trải nghiệm và kiểm chứng các bước xử lý nghiệp vụ theo đúng yêu cầu của học phần Quản trị hệ thống thông tin.

Mặc dù đã mang lại nhiều thuận lợi cho hành khách và giúp hãng giảm tải đáng kể áp lực tại sân bay, nhưng trong quá trình vận hành thực tế với lượng người truy cập lớn, hệ thống vẫn còn bộc lộ một số hạn chế chung cần được khắc phục. Vào các đợt cao điểm đi lại như dịp lễ, Tết hoặc khi hãng mở chương trình khuyến mãi, việc truy cập tìm kiếm chuyến bay và đặt vé đôi khi còn chậm và xảy ra tình trạng nghẽn mạng. Bên cạnh đó, quá trình đồng bộ dữ liệu khi thanh toán trực tuyến, các thao tác tự đổi lịch bay hoặc hoàn vé trên ứng dụng di động cũng như việc bảo mật thông tin đặt chỗ của hành khách vẫn còn một số điểm chưa thật sự thuận tiện, đôi lúc gây lúng túng và mất thời gian chờ đợi cho người sử dụng.

Xuất phát từ thực tế đó, việc tìm hiểu cách thức hệ thống vận hành, đánh giá những mặt đã làm được và những hạn chế còn tồn tại để đề xuất phương án hoàn thiện là rất cần thiết. Vì vậy, em lựa chọn đề tài “Phân tích, đánh giá và đề xuất giải pháp nâng cấp, hoàn thiện Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)” làm bài tập lớn kết thúc học phần Quản trị hệ thống thông tin.

1.2. Tổng quan tình hình nghiên cứu

1.2.1. Tình hình nghiên cứu trong nước

Ở trong nước, các kiến thức nền tảng về hệ thống thông tin và cách quản lý hệ thống trong doanh nghiệp đã được trình bày rõ qua bài giảng học phần Quản trị hệ thống thông tin của cô ThS. Lê Hoàng Diệp tại Học viện Hành chính và Quản trị công cũng như trong các giáo trình đại học về hệ thống thông tin quản lý. Qua các tài liệu này, người học nắm được cách phân biệt dữ liệu với thông tin, năm thành phần cấu thành nên một hệ thống (phần cứng, phần mềm, cơ sở dữ liệu, mạng truyền thông, con người) và cách nhìn hệ thống qua ba góc độ từ giao diện bên ngoài vào tới quy trình xử lý và nơi lưu trữ dữ liệu bên trong.

Đối với hoạt động bán vé máy bay và làm thủ tục trực tuyến tại Việt Nam, các báo cáo hàng năm của ngành hàng không và của Vietnam Airlines chủ yếu thống kê số lượng hành khách vận chuyển, doanh thu bán vé và giới thiệu các tiện ích mới như làm thủ tục qua điện thoại hay nhận diện khuôn mặt tại sân bay. Tuy nhiên, các tài liệu công bố này mới dừng ở góc độ giới thiệu dịch vụ và tổng kết hoạt động kinh doanh, chứ chưa đi vào phân tích chi tiết xem hệ thống đặt vé và làm thủ tục trực tuyến của hãng đang phối hợp xử lý dữ liệu qua từng bước như thế nào và còn những điểm nghẽn nào gây bất tiện cho hành khách.

1.2.2. Tình hình nghiên cứu nước ngoài

Trên thế giới, do ngành hàng không phát triển thương mại điện tử từ sớm nên đã có nhiều tài liệu tìm hiểu về hệ thống bán vé trực tuyến của các hãng bay. Các tài liệu quốc tế về hệ thống thông tin quản lý thường tập trung làm rõ cách một hãng hàng không kết nối trang web bán vé với kho quản lý ghế ngồi để hàng nghìn hành khách ở nhiều nơi có thể cùng lúc tra cứu lịch bay, mua vé và chọn chỗ mà không bị trùng ghế của nhau. Bên cạnh đó, nhiều nghiên cứu về dịch vụ hàng không hiện đại cũng chỉ ra xu hướng giúp hành khách tự phục vụ từ lúc mua vé trên điện thoại cho tới lúc tự in thẻ lên máy bay ở sân bay, đồng thời nhấn mạnh việc phải bảo vệ an toàn thông tin cá nhân và xử lý nhanh các giao dịch thanh toán trực tuyến.

Nhìn chung, các tài liệu trong và ngoài nước đã giúp em có được phần khung lý thuyết và góc nhìn thực tế về hệ thống bán vé hàng không. Đây là cơ sở để em vận dụng những kiến thức đã học trên lớp vào việc tìm hiểu, đánh giá trực tiếp Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines, từ đó đề xuất một số giải pháp nâng cấp phù hợp trong bài tập lớn này.

1.3. Mục tiêu và nhiệm vụ nghiên cứu

1.3.1. Mục tiêu nghiên cứu

Bài tập lớn vận dụng lý thuyết học phần Quản trị hệ thống thông tin để phân tích cấu trúc, quy trình hoạt động và đánh giá thực trạng Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines, từ đó đề xuất các giải pháp nâng cấp nhằm giúp hệ thống vận hành ổn định, thuận tiện và an toàn hơn cho hành khách trong giai đoạn 2026 - 2030.

1.3.2. Nhiệm vụ nghiên cứu

Bám sát mục tiêu trên, bài làm tập trung giải quyết 4 nhiệm vụ:

- Hệ thống hóa các khái niệm lý thuyết của học phần gồm dữ liệu, thông tin, tri thức, tám đặc tính chất lượng thông tin, năm thành phần hệ thống thông tin, ba mô hình biểu diễn và phương pháp mô hình hóa bằng sơ đồ UML.
- Khảo sát và phân tích thực trạng hệ thống đặt vé, làm thủ tục trực tuyến của Vietnam Airlines theo năm thành phần và ba mô hình biểu diễn (ngoài, lô-gíc, vật lý), kèm theo nhận xét tại từng phần.
- Đánh giá vai trò, hiệu quả vận hành, mức độ phủ sóng của hệ thống và khảo sát ý kiến 30 người sử dụng bằng bảng hỏi để chỉ rõ những điểm hệ thống đã làm tốt, những hạn chế còn tồn tại và các rủi ro trong vận hành.
- Xây dựng định hướng phát triển giai đoạn 2026 - 2030 và đề xuất các giải pháp nâng cấp cụ thể cho từng mảng: phần mềm, cơ sở dữ liệu, phần cứng và mạng, quy trình nghiệp vụ và mô hình hệ thống.

1.4. Đối tượng và phạm vi nghiên cứu

1.4.1. Đối tượng nghiên cứu

Đối tượng nghiên cứu của đề tài là Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Tổng công ty Hàng không Việt Nam (Vietnam Airlines), xét trên cả năm thành phần cấu thành hệ thống, quy trình xử lý nghiệp vụ và ba mô hình biểu diễn hệ thống.

1.4.2. Phạm vi nghiên cứu

Về không gian: Tìm hiểu hệ thống đang vận hành trên cổng thông tin https://www.vietnamairlines.com, ứng dụng di động Vietnam Airlines cùng hệ thống quầy làm thủ tục tự động (Kiosk Check-in) và cổng kiểm soát tại các sân bay nội địa.

Về nội dung nghiệp vụ: Đi sâu vào 6 nhóm nghiệp vụ phục vụ hành khách gồm: đăng nhập tài khoản hội viên; tìm kiếm chuyến bay và đặt vé; kê khai và cập nhật thông tin hành khách; thanh toán trực tuyến và xuất vé điện tử; làm thủ tục trực tuyến (check-in) và kiểm soát lên tàu bay; quản lý hồ sơ đặt chỗ và hoàn, đổi vé.

Về thời gian: Em thu thập các số liệu báo cáo của hãng trong giai đoạn 2024 - 2026, trực tiếp kiểm chứng giao diện và khảo sát người dùng vào đầu năm 2026, từ đó đề xuất giải pháp nâng cấp cho giai đoạn 2026 - 2030.

1.5. Phương pháp nghiên cứu hệ thống

Bài làm kết hợp bốn phương pháp sau:

1.5.1. Phương pháp thu thập và phân tích tài liệu thứ cấp

Em tổng hợp cơ sở lý thuyết từ bài giảng học phần Quản trị hệ thống thông tin của cô ThS. Lê Hoàng Diệp và các giáo trình chuyên ngành trong danh mục tài liệu tham khảo. Song song đó, em tra cứu thêm các quy định về giao dịch điện tử, bảo vệ dữ liệu cá nhân cùng báo cáo thường niên và tài liệu hướng dẫn đặt vé, làm thủ tục công khai của Vietnam Airlines để lấy số liệu đối chiếu.

1.5.2. Phương pháp quan sát và kiểm chứng trực tiếp trên hệ thống thực tế

Em trực tiếp truy cập trang web https://www.vietnamairlines.com và ứng dụng Vietnam Airlines trên điện thoại, đóng vai hành khách thao tác qua từng màn hình tìm chuyến bay, chọn giá vé, điền thông tin, tạo mã giữ chỗ, tra cứu hồ sơ đặt chỗ và chọn ghế ngồi. Qua mỗi bước, em ghi chép lại các thông tin đầu vào, kết quả đầu ra và chụp lại màn hình giao diện thực tế để đưa vào bài phân tích.

1.5.3. Phương pháp phân tích và mô hình hóa hệ thống

Từ các luồng nghiệp vụ đã quan sát thực tế, em sử dụng bộ sơ đồ UML để dựng sơ đồ phân cấp tác nhân, biểu đồ ca sử dụng, bảng đặc tả ca sử dụng, biểu đồ hoạt động, biểu đồ trình tự và biểu đồ lớp. Ở tầng dữ liệu vật lý, em chuyển biểu đồ lớp sang lược đồ quan hệ cơ sở dữ liệu để làm rõ cách hệ thống lưu trữ và liên kết các bảng dữ liệu.

1.5.4. Phương pháp khảo sát bằng bảng hỏi và thống kê mô tả

Em phát phiếu khảo sát (thang điểm Likert từ 1 đến 5) cho 30 người đã từng đặt vé và làm thủ tục trên hệ thống của Vietnam Airlines, bao gồm hành khách đi công tác, khách đi du lịch, hội viên Bông Sen Vàng và nhân viên nghiệp vụ. Từ 30 phiếu thu về, em tính tần số, tỷ lệ phần trăm và điểm trung bình của từng tiêu chí để làm căn cứ đánh giá ở Phần IV, đồng thời đính kèm bảng tổng hợp số liệu ở phần Phụ lục.

1.6. Giả thuyết nghiên cứu và đóng góp mới của đề tài

1.6.1. Giả thuyết nghiên cứu

Nền tảng máy chủ và cơ sở dữ liệu hiện tại của Vietnam Airlines vốn đã đáp ứng tốt nhu cầu bán vé và quản lý chỗ ngồi hàng ngày của hãng, vì vậy không cần phải thay thế mới toàn bộ hệ thống. Những bất tiện mà hành khách gặp phải trong quá trình sử dụng chủ yếu nằm ở khâu phối hợp xử lý giữa các phân hệ khi lưu lượng truy cập tăng cao hoặc khi phát sinh nhu cầu thay đổi lịch trình sau mua vé. Do đó, việc nâng cấp các tính năng hỗ trợ tự phục vụ, cải thiện khâu đồng bộ thanh toán và bổ sung bước xác thực bảo mật sẽ giúp nâng cao chất lượng hệ thống ngay trên nền tảng sẵn có.

1.6.2. Đóng góp mới của đề tài

Về mặt lý luận, bài tập lớn vận dụng xuyên suốt lý thuyết năm thành phần và ba mô hình biểu diễn của học phần kết hợp bộ sơ đồ UML để phân tích một hệ thống thương mại điện tử hàng không thực tế từ lớp giao diện người dùng xuống đến cấu trúc bảng cơ sở dữ liệu.

Về mặt thực tiễn, từ kết quả kiểm chứng giao diện và khảo sát 30 người dùng thực tế, bài làm chỉ ra nguyên nhân của một số vướng mắc thường gặp khi hành khách đặt vé, làm thủ tục trực tuyến và đề xuất các giải pháp nâng cấp cụ thể, sát với điều kiện vận hành của hãng.

1.7. Kết cấu của bài tập lớn

Ngoài Trang bìa, Lời cảm ơn, Lời cam đoan, Mục lục, Danh mục từ viết tắt, Tài liệu tham khảo và Phụ lục, nội dung bài tập lớn gồm 5 phần:

Phần I - Mở đầu: Trình bày lý do chọn đề tài, tổng quan tình hình nghiên cứu, mục tiêu, nhiệm vụ, đối tượng, phạm vi, phương pháp nghiên cứu, giả thuyết và đóng góp của đề tài.

Phần II - Cơ sở lý luận về hệ thống thông tin và quản trị hệ thống thông tin: Trình bày các khái niệm dữ liệu, thông tin, tri thức, tám đặc tính của thông tin, năm thành phần hệ thống, ba mô hình biểu diễn, phương pháp phân tích hướng đối tượng và nội dung quản trị hệ thống thông tin.

Phần III - Phân tích thực trạng Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam: Phân tích tổng quan đơn vị, hiện trạng năm thành phần, luồng thông tin vào ra, bộ sơ đồ mô hình hóa lô-gíc, kiến trúc vật lý, cơ sở dữ liệu 9 bảng và giao diện thực tế.

Phần IV - Đánh giá thực trạng, xây dựng chiến lược phát triển và đề xuất giải pháp nâng cấp, hoàn thiện hệ thống: Đánh giá hiệu quả vận hành, phân tích kết quả khảo sát 30 người sử dụng, tổng hợp ưu điểm, hạn chế, rủi ro và đề xuất giải pháp nâng cấp giai đoạn 2026 - 2030.

Phần V - Kết luận: Tóm lược kết quả phân tích, đánh giá chính và hướng phát triển tiếp theo của hệ thống.
<div style="page-break-after: always;"></div>

II. CƠ SỞ LÝ LUẬN VỀ HỆ THỐNG THÔNG TIN VÀ QUẢN TRỊ HỆ THỐNG THÔNG TIN

2.1. Khái niệm dữ liệu, thông tin và hệ thống thông tin trong tổ chức

2.1.1. Phân biệt dữ liệu, thông tin, tri thức và tám đặc tính của thông tin có giá trị

Trong hoạt động quản lý của một cơ quan hay doanh nghiệp, dữ liệu và thông tin khác nhau ở mức độ xử lý và giá trị sử dụng. Dữ liệu là những con số, ký hiệu, chữ viết hoặc hình ảnh thô ghi lại các sự việc phát sinh nhưng chưa được sắp xếp, tính toán cho một mục đích cụ thể. Chẳng hạn, chuỗi ký tự VN213, ngày 15/06/2026, con số 1.850.000 hay họ tên một người đứng rời rạc chính là dữ liệu thô. Khi nhìn vào từng mẩu dữ liệu tách biệt này, cả hành khách lẫn người quản lý đều chưa thể đưa ra quyết định.

Thông tin là kết quả thu được sau khi tập hợp, lọc, phân loại và tính toán các dữ liệu thô trong một ngữ cảnh cụ thể. Ví dụ, từ các bản ghi đặt chỗ trong cơ sở dữ liệu, hệ thống tổng hợp được chuyến bay VN213 chặng Hà Nội đi Thành phố Hồ Chí Minh lúc 11 giờ 00 ngày 15/06/2026 đã bán 85% số ghế và chỉ còn 12 ghế hạng Phổ thông với giá 1.850.000 đồng. Con số tổng hợp đó là thông tin vì nó giúp hành khách quyết định có mua vé ngay hay không, đồng thời giúp bộ phận thương mại theo dõi tốc độ bán vé của chuyến bay. Ở mức cao hơn, khi người quản lý kết hợp thông tin qua nhiều năm với kinh nghiệm thực tế để rút ra quy luật như lượng khách đặt vé chặng Hà Nội đi Đà Nẵng thường tăng gấp ba lần trước kỳ nghỉ lễ 30/4 khoảng ba tuần, từ đó chủ động tăng chuyến và mở sớm các dải giá vé cao, thì sự đúc kết đó trở thành tri thức.

Theo tài liệu học phần Quản trị hệ thống thông tin, thông tin dùng trong giao dịch và quản lý cần bảo đảm tám đặc tính: chính xác, đầy đủ, kịp thời, phù hợp, dễ tiếp cận, an toàn bảo mật, có thể kiểm chứng và khách quan.

Đặt vào thực tế nghiệp vụ bán vé hàng không, tính chính xác và tính đầy đủ thể hiện ngay trên màn hình tra cứu chuyến bay của hành khách. Số lượng ghế trống còn lại, tổng số tiền phải trả và họ tên in trên vé điện tử không được phép sai lệch dù chỉ một ký tự (chính xác); đồng thời bảng giá hiển thị cho khách phải liệt kê đủ cả giá vé cơ bản, thuế giá trị gia tăng, phí sân bay, số cân hành lý xách tay, hành lý ký gửi kèm điều kiện hoàn hoặc đổi vé chứ không được ẩn bớt chi phí (đầy đủ). Bên cạnh đó, thông tin giá vé và tình trạng chỗ phải đạt tính kịp thời: ngay giây phút một hành khách vừa thanh toán xong chiếc ghế cuối cùng của hạng vé tiết kiệm, hệ thống phải khóa ngay hạng vé đó trên mọi màn hình đang truy cập để người vào sau không đặt trùng chỗ.

Tuy nhiên, không phải người dùng nào cũng cần nhận lượng thông tin giống nhau. Tính phù hợp đòi hỏi hệ thống chỉ cung cấp đúng phần thông tin gắn với vai trò của từng người: hành khách chỉ cần biết lịch bay, giá vé và cửa ra tàu bay của chuyến mình đi, trong khi nhân viên phục vụ mặt đất ở sân bay mới cần xem danh sách toàn bộ hành khách trên chuyến bay và sơ đồ cân bằng trọng tải tàu bay. Những thông tin dành cho người dùng cần được trình bày rõ ràng, dễ đọc và tra cứu thuận tiện trên cả máy tính lẫn điện thoại thông minh (tính dễ tiếp cận), nhưng các dữ liệu cá nhân nhạy cảm như số căn cước công dân, số hộ chiếu, số điện thoại, lịch trình bay hay số thẻ ngân hàng lại phải có cơ chế phân quyền bảo vệ để người lạ không xem trộm hoặc tự ý sửa đổi được (tính an toàn và bảo mật). Ngoài ra, mọi thông tin đầu ra như vé điện tử hay báo cáo doanh thu đều phải đối chiếu ngược lại được với chứng từ gốc và nhật ký giao dịch trong cơ sở dữ liệu khi xảy ra khiếu nại tài chính (tính có thể kiểm chứng), cũng như phải phản ánh trung thực số liệu thực tế theo công thức tính thống nhất của phần mềm mà không bị bóp méo theo ý muốn chủ quan của người lập báo cáo (tính khách quan).

Nhu cầu sử dụng các loại thông tin trên cũng phân hóa rõ theo ba cấp quản trị trong doanh nghiệp. Ở cấp tác nghiệp hàng ngày, nhân viên bán vé, thu ngân và nhân viên làm thủ tục sân bay làm việc trực tiếp với từng giao dịch lẻ nên cần thông tin chi tiết, cập nhật từng giây như trạng thái mã đặt chỗ hay số ghế vừa chọn. Lên tới cấp chiến thuật, các trưởng phòng thương mại hay trưởng chi nhánh khu vực không xem từng vé lẻ mà cần báo cáo tổng hợp theo tuần, tháng, quý về doanh thu từng đường bay và tỷ lệ lấp đầy ghế để điều chỉnh kế hoạch bán hàng. Ở cấp cao nhất là cấp chiến lược, Hội đồng quản trị và Ban Tổng giám đốc lại cần các chỉ số tổng hợp dài hạn theo năm kết hợp với dự báo thị trường quốc tế để quyết định đầu tư thêm tàu bay hay mở đường bay mới.

2.1.2. Năm thành phần cấu thành hệ thống thông tin và mối quan hệ với tổ chức

Hệ thống là một tập hợp các phần tử liên kết và tương tác với nhau theo quy tắc nhất định để đạt mục tiêu chung, vận hành theo chu trình bốn bước: nhận đầu vào, xử lý biến đổi, xuất đầu ra và thu nhận phản hồi để điều chỉnh. Trong môn Quản trị hệ thống thông tin, nhiều người mới tìm hiểu thường nhầm hệ thống thông tin chỉ là chương trình phần mềm cài trên máy tính. Thực tế, một hệ thống thông tin trong tổ chức luôn gồm năm thành phần phối hợp chặt chẽ với nhau:

a. Thành phần Phần cứng:

Phần cứng bao gồm toàn bộ các thiết bị vật lý dùng để nhập dữ liệu, tính toán, lưu trữ và hiển thị kết quả đầu ra. Trong hệ thống bán vé và làm thủ tục của hãng hàng không, phần cứng trải rộng từ cụm máy chủ và tủ đĩa lưu trữ đặt tại trung tâm dữ liệu, máy tính để bàn của nhân viên phòng vé, điện thoại thông minh của hành khách cho tới các quầy Kiosk làm thủ tục tự động, máy in thẻ lên máy bay và cổng quét mã vạch, camera sinh trắc học tại nhà ga sân bay.

b. Thành phần Phần mềm:

Phần mềm là tập hợp các chương trình điều khiển thiết bị phần cứng xử lý nghiệp vụ, chia làm phần mềm hệ thống và phần mềm ứng dụng. Phần mềm hệ thống gồm hệ điều hành máy chủ, nền tảng ảo hóa và hệ quản trị cơ sở dữ liệu đứng phía sau; còn phần mềm ứng dụng là những phân hệ trực tiếp giải quyết công việc hàng ngày như trang web đặt vé, ứng dụng di động, phân hệ quản lý chỗ và tính giá vé, phân hệ xuất vé điện tử và phân hệ làm thủ tục chuyến bay.

c. Thành phần Cơ sở dữ liệu:

Cơ sở dữ liệu là nơi lưu trữ tập trung toàn bộ dữ liệu có cấu trúc của hệ thống qua các bảng quan hệ gắn kết với nhau bằng khóa chính và khóa ngoại để tránh trùng lặp và tăng tốc độ truy vấn. Với nghiệp vụ hàng không, toàn bộ danh mục chuyến bay, số ghế trống, bảng giá vé, hồ sơ đặt chỗ (PNR), số vé điện tử, thông tin giấy tờ tùy thân của hành khách, lịch sử thanh toán và điểm thưởng hội viên đều nằm tại đây.

d. Thành phần Mạng truyền thông:

Hạ tầng mạng gồm đường truyền cáp quang, mạng di động 4G/5G, thiết bị định tuyến, cân bằng tải, tường lửa và các giao thức truyền dữ liệu nối kết các thiết bị phần cứng ở nhiều địa điểm cách xa nhau. Nhờ lớp mạng này, thao tác đặt vé của một hành khách đang ngồi ở nhà mới kết nối tức thời được với máy chủ của hãng bay, cổng thanh toán của ngân hàng và đồng bộ thẳng ra quầy làm thủ tục ở sân bay.

e. Thành phần Con người và quy trình nghiệp vụ:

Dù máy móc và phần mềm hiện đại đến đâu thì con người vẫn là chủ thể vận hành và quyết định hiệu quả của hệ thống. Thành phần con người bao gồm cả phía người sử dụng (hành khách, hội viên, nhân viên bán vé, nhân viên phục vụ mặt đất, cán bộ quản lý các cấp) lẫn đội ngũ kỹ thuật (người phân tích hệ thống, lập trình viên, quản trị cơ sở dữ liệu, kỹ sư an ninh mạng). Đi kèm với con người là các quy trình, quy định nghiệp vụ quy định rõ trình tự thao tác và giới hạn quyền hạn ở từng bước để hệ thống vận hành trật tự, an toàn.

Khi đặt vào trong doanh nghiệp, hệ thống thông tin và bộ máy tổ chức luôn ràng buộc lẫn nhau: cơ cấu phòng ban, chi nhánh quy định luồng đi của thông tin và quyền truy cập dữ liệu của từng chức danh; đổi lại, hệ thống thông tin giúp kết nối trực tiếp trụ sở chính với các sân bay và chi nhánh trên cả nước, giảm hẳn các khâu luân chuyển chứng từ giấy trung gian.

2.1.3. Phân loại các hệ thống thông tin tiêu biểu trong doanh nghiệp

Một doanh nghiệp quy mô lớn không dùng một phần mềm đơn lẻ cho mọi việc mà thường triển khai nhiều loại hệ thống thông tin phục vụ từng cấp quản lý và từng mảng nghiệp vụ. Bảng 2.1 tổng hợp các loại hệ thống thông tin chính theo lý thuyết học phần kèm ví dụ tại hãng hàng không:

Bảng 2.1: Phân loại các hệ thống thông tin chủ yếu trong doanh nghiệp

| Nhóm phân loại | Tên hệ thống thông tin | Cấp quản trị và Đối tượng phục vụ | Chức năng chính và Ví dụ thực tế tại hãng hàng không |
| :--- | :--- | :--- | :--- |
| Theo cấp độ quản trị | Hệ thống xử lý giao dịch (TPS) | Cấp tác nghiệp gồm hành khách, nhân viên bán vé, thu ngân, nhân viên sân bay | Ghi nhận và xử lý ngay các giao dịch phát sinh hàng ngày với số lượng lớn như đặt giữ chỗ, thanh toán tiền vé trực tuyến, xuất vé điện tử và làm thủ tục chọn ghế ngồi |
| Theo cấp độ quản trị | Hệ thống thông tin quản lý (MIS) | Cấp quản lý trung gian gồm trưởng phòng thương mại, trưởng chi nhánh khu vực | Tổng hợp dữ liệu từ hệ thống TPS để lập báo cáo định kỳ theo tuần, tháng, quý như báo cáo doanh thu bán vé trực tuyến theo từng đường bay và tỷ lệ lấp đầy ghế |
| Theo cấp độ quản trị | Hệ thống hỗ trợ ra quyết định (DSS) | Cấp quản lý trung và cao cấp gồm chuyên gia phân tích giá, kế hoạch khai thác bay | Dùng các mô hình phân tích dữ liệu để hỗ trợ các quyết định bán cấu trúc như dự báo nhu cầu khách để mở thêm hoặc đóng bớt các hạng giá vé tiết kiệm trên từng chuyến bay |
| Theo cấp độ quản trị | Hệ thống thông tin điều hành (EIS) | Cấp lãnh đạo chiến lược gồm Hội đồng quản trị và Ban Tổng giám đốc | Cung cấp bảng theo dõi trực quan các chỉ số toàn tổng công ty như tổng sản lượng vận chuyển, thị phần đường bay quốc tế và hiệu suất khai thác đội tàu bay |
| Theo ứng dụng tích hợp | Hoạch định nguồn lực doanh nghiệp (ERP) | Liên phòng ban gồm Tài chính kế toán, Nhân sự, Vật tư kỹ thuật tàu bay | Quản lý tập trung dòng tiền, hạch toán doanh thu bán vé, chi phí nhiên liệu, phụ tùng bảo dưỡng tàu bay và tiền lương nhân viên trên cùng một cơ sở dữ liệu |
| Theo ứng dụng tích hợp | Quản trị quan hệ khách hàng (CRM) | Khối thương mại, chăm sóc khách hàng và quản lý hội viên thân thiết | Lưu lịch sử bay, quản lý tích lũy và đổi dặm thưởng, phân hạng thẻ hội viên Bông Sen Vàng (Bạc, Titan, Vàng, Bạch Kim) và gửi ưu đãi theo từng nhóm khách |

2.2. Ba mô hình biểu diễn hệ thống và phương pháp phân tích hệ thống thông tin

2.2.1. Ba mô hình biểu diễn hệ thống thông tin gồm Mô hình ngoài, Mô hình lô-gíc và Mô hình vật lý

Khi khảo sát một hệ thống thông tin đang chạy hoặc thiết kế nâng cấp hệ thống mới, tài liệu học phần Quản trị hệ thống thông tin chia hệ thống thành ba mô hình biểu diễn: mô hình ngoài (vật lý ngoài), mô hình lô-gíc và mô hình vật lý (vật lý trong). Cách chia này giúp người phân tích nhìn rõ hệ thống từ lớp giao diện hiển thị trước mắt người dùng, qua tầng quy tắc nghiệp vụ ở giữa, cho tới cấu trúc bảng biểu và máy chủ lưu trữ bên dưới.

[[IMAGE: assets/diagrams/diag_1_1_quy_trinh_mo_hinh.png | Caption: Hình 2.1. Mối quan hệ giữa quy trình xử lý thông tin và ba mô hình biểu diễn hệ thống thông tin.]]

Ba mô hình này tách hệ thống thành ba lớp rõ rệt:

a. Mô hình ngoài (Mô hình vật lý ngoài):

Đây là bề mặt giao tiếp giữa hệ thống với hành khách và nhân viên nghiệp vụ. Ở lớp này, người phân tích xác định có những nhóm tác nhân nào truy cập vào hệ thống, bố cục các màn hình trang web hay ứng dụng nơi khách nhập điểm đi, điểm đến, ngày bay, cùng các chứng từ hệ thống trả ra như vé điện tử, thẻ lên máy bay, hóa đơn điện tử và bảng phân quyền thao tác.

b. Mô hình lô-gíc:

Nếu bỏ qua chuyện hệ thống cài trên máy chủ gì hay viết bằng ngôn ngữ lập trình nào, phần cốt lõi còn lại chính là mô hình lô-gíc. Mô hình này tập trung vào các quy tắc nghiệp vụ: hệ thống có những ca sử dụng nào, kiểm tra điều kiện ra sao (chuyến bay còn ghế trống không, giữ chỗ tạm trong bao lâu, khi nào mở cổng làm thủ tục) và các đối tượng dữ liệu như Chuyến bay, Hành khách, Hồ sơ đặt chỗ, Vé điện tử liên kết với nhau theo bội số nào.

c. Mô hình vật lý (Mô hình vật lý trong):

Dưới góc nhìn của kỹ sư công nghệ thông tin và người quản trị cơ sở dữ liệu, mô hình vật lý giải quyết bài toán triển khai kỹ thuật: hệ thống chia làm mấy tầng máy chủ, cơ sở dữ liệu gồm những bảng vật lý nào, tên cột, kiểu dữ liệu, khóa chính và khóa ngoại được khai báo ra sao, đường truyền mạng và tường lửa bố trí ở đâu.

2.2.2. Phương pháp phân tích hệ thống theo hướng đối tượng bằng ngôn ngữ mô hình hóa thống nhất

Để biểu diễn mô hình lô-gíc và mô hình vật lý thống nhất, phương pháp phân tích và thiết kế hướng đối tượng sử dụng ngôn ngữ mô hình hóa thống nhất UML kết hợp lược đồ thực thể quan hệ chân quạ (Crow's Foot ERD).

Khác với phương pháp hướng cấu trúc trước đây thường tách rời quy trình xử lý và kho dữ liệu, phương pháp hướng đối tượng gom cả thuộc tính dữ liệu (mã chuyến bay, giờ khởi hành, họ tên, số căn cước công dân) lẫn các thao tác xử lý (kiểm tra ghế trống, khóa chỗ tạm, phát hành vé) vào trong từng đối tượng như Chuyến bay, Hành khách, Hồ sơ đặt chỗ hay Vé điện tử. Trong bài tập lớn này, em dùng năm loại sơ đồ để mô hình hóa hệ thống:

a. Biểu đồ phân cấp tác nhân và Biểu đồ ca sử dụng:

Xác định ranh giới hệ thống, các tác nhân con người hoặc hệ thống liên thông bên ngoài (ký hiệu hình người que) và các chức năng nghiệp vụ bên trong (hình elip). Mũi tên tam giác rỗng giữa các tác nhân biểu thị quan hệ kế thừa quyền hạn; mũi tên nét đứt gắn nhãn include chỉ chức năng con bắt buộc chạy kèm, còn nhãn extend chỉ chức năng mở rộng tùy chọn.

b. Biểu đồ hoạt động:

Chia luồng quy trình thành các làn bơi dọc ứng với từng bên tham gia (Hành khách, Hệ thống đặt vé, Cổng thanh toán hoặc Hệ thống sân bay). Sơ đồ đi từ điểm bắt đầu (tròn đen đặc), qua các bước xử lý (chữ nhật bo góc), nút kiểm tra điều kiện rẽ nhánh (hình thoi), thanh ngang tách/gộp nhánh song song, đến điểm kết thúc (hai vòng tròn đồng tâm).

c. Biểu đồ trình tự:

Bóc tách thứ tự truyền bản tin gọi hàm giữa các lớp phần mềm theo trục thời gian từ trên xuống dưới. Các đối tượng xếp theo kiến trúc BCE (Tác nhân, Lớp biên giao diện, Lớp điều khiển nghiệp vụ, Lớp thực thể dữ liệu), kết hợp khung điều kiện rẽ nhánh để tách kịch bản giao dịch thành công với kịch bản lỗi hoặc quá hạn.

d. Biểu đồ lớp thực thể miền:

Thể hiện cấu trúc tĩnh của các lớp đối tượng trong nghiệp vụ hàng không. Mỗi lớp chia ba ngăn (tên lớp, thuộc tính dữ liệu và phương thức xử lý), nối với nhau bằng các đường quan hệ có ghi rõ bội số (một - một, một - nhiều), hình thoi đặc (quan hệ hợp thành) hoặc mũi tên tam giác rỗng (quan hệ kế thừa).

e. Lược đồ thực thể quan hệ cơ sở dữ liệu:

Ánh xạ biểu đồ lớp sang các bảng dữ liệu vật lý đạt dạng chuẩn 3 (3NF) theo ký hiệu chân quạ: hai vạch thẳng (duy nhất một), vòng tròn kèm một vạch (không hoặc một), một vạch kèm chân quạ (một hoặc nhiều), vòng tròn kèm chân quạ (không hoặc nhiều), kèm định nghĩa khóa chính và khóa ngoại của từng bảng.

2.3. Nội dung quản trị hệ thống thông tin trong doanh nghiệp

2.3.1. Quản trị hạ tầng phần cứng, phần mềm và mạng truyền thông

Với một hệ thống bán vé trực tuyến chạy xuyên suốt 24/7, quản trị hạ tầng kỹ thuật là khâu giữ cho dịch vụ không bị đứt quãng. Về phần cứng, cụm máy chủ tại trung tâm dữ liệu chính và trung tâm dự phòng phải đủ tài nguyên xử lý, còn thiết bị đầu cuối ở sân bay (máy tính quầy vé, Kiosk làm thủ tục, đầu đọc mã vạch tại cửa ra tàu bay) cần được bảo trì định kỳ. Bộ phận kỹ thuật phải theo dõi sát mức tải CPU, RAM và ổ cứng máy chủ để nâng cấp hoặc mở rộng ngay khi lượng truy cập tăng đột biến.

Về phần mềm, các bản cập nhật trên web và ứng dụng di động phải được kiểm thử kỹ để giao diện không bị vỡ trên các kích thước màn hình khác nhau. Đặc biệt, cổng kết nối API giữa phần mềm đặt vé với ngân hàng, ví điện tử và hệ thống định danh quốc gia phải được đo thời gian phản hồi theo từng giây để phát hiện sớm hiện tượng treo giao dịch.

Về mạng truyền thông, đường truyền cáp quang giữa trung tâm dữ liệu với các sân bay và chi nhánh cần có nhánh dự phòng tự động chuyển mạch khi đứt cáp. Trên kênh bán vé công khai, doanh nghiệp kết hợp mạng phân phối nội dung (CDN), thiết bị cân bằng tải và tường lửa ứng dụng web để vừa tăng tốc độ tải trang, vừa chặn các luồng truy cập tự động bất thường.

2.3.2. Quản trị cơ sở dữ liệu, phân quyền người dùng và kiểm soát rủi ro vận hành

Cơ sở dữ liệu là nơi giữ toàn bộ hồ sơ đặt chỗ và dòng tiền nên các bảng phải đạt dạng chuẩn 3 (3NF) ngay từ khâu thiết kế để không lưu trùng lặp và không bị lệch dữ liệu khi thêm, sửa, xóa. Mọi chuỗi thao tác giữ chỗ, trừ tiền và xuất vé điện tử phải tuân theo nguyên tắc giao dịch trọn gói: hoặc thành công cả chuỗi, hoặc nếu lỗi ở bất kỳ bước nào thì phải tự động hoàn tác về trạng thái ban đầu để khách không bị trừ tiền oan và chuyến bay không bị sai số ghế trống.

Song song với quản trị dữ liệu là kiểm soát quyền truy cập của con người theo vai trò (RBAC). Khách vãng lai chỉ xem được lịch bay và giá vé công khai; hành khách có mã đặt chỗ chỉ thao tác trên hồ sơ của mình; nhân viên sân bay chỉ xử lý chuyến bay được phân công; riêng quản trị viên hệ thống mới được chỉnh tham số và tra cứu nhật ký toàn hệ thống. Bên cạnh đó, đơn vị vận hành phải định kỳ rà soát lỗ hổng bảo mật dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP của Chính phủ, duy trì lịch sao lưu tự động và đối soát giao dịch hàng ngày để xử lý kịp thời các sự cố phát sinh.

<div style="page-break-after: always;"></div>

III. PHÂN TÍCH THỰC TRẠNG HỆ THỐNG THÔNG TIN ĐẶT VÉ VÀ LÀM THỦ TỤC TRỰC TUYẾN CỦA HÃNG HÀNG KHÔNG QUỐC GIA VIỆT NAM

3.1. Tổng quan về đơn vị, thực trạng năm thành phần và luồng xử lý thông tin của hệ thống

3.1.1. Giới thiệu khái quát về Tổng công ty Hàng không Việt Nam và cơ cấu quản lý hệ thống

Tổng công ty Hàng không Việt Nam – Công ty cổ phần (Vietnam Airlines) sử dụng mã định danh hãng hàng không quốc tế là VN và đầu số vé điện tử 738. Gia nhập Liên minh hàng không toàn cầu SkyTeam từ năm 2010, hãng hiện khai thác khoảng 100 tàu bay gồm các dòng thân rộng Boeing 787 Dreamliner, Airbus A350-900 và dòng thân hẹp Airbus A321. Mạng đường bay của hãng gồm hơn 100 tuyến, kết nối 22 sân bay nội địa và hơn 30 điểm đến quốc tế tại châu Á, châu Âu, châu Úc và Bắc Mỹ.

Theo báo cáo thường niên giai đoạn 2024 – 2025, Vietnam Airlines vận chuyển trên 25 triệu lượt khách mỗi năm, tổng doanh thu hợp nhất vượt 120.000 tỷ đồng với hơn 23.000 nhân sự. Trong lộ trình chuyển đổi số giai đoạn 2022 – 2026, hãng đã dịch chuyển mạnh mảng bán vé và phục vụ mặt đất từ phòng vé truyền thống sang kênh số. Website https://www.vietnamairlines.com, ứng dụng di động Vietnam Airlines và chương trình khách hàng thân thiết Bông Sen Vàng (Lotusmiles, hơn 7 triệu hội viên) hiện là kênh giao dịch chủ lực, xử lý hàng triệu lượt tra cứu, mua vé và làm thủ tục mỗi tháng.

Đứng sau trang web và ứng dụng di động này là bốn khối đơn vị phối hợp theo từng chặng của vòng đời chiếc vé. Đầu tiên, Khối Thương mại và Tiếp thị số lên lịch bay thương mại, xây dựng biểu giá vé, tung các đợt khuyến mãi trực tuyến và vận hành chương trình Bông Sen Vàng. Khi khách bấm mua vé và chuyển tiền, Khối Tài chính – Kế toán quản lý cổng kết nối với các ngân hàng, tổ chức thẻ và ví điện tử để đối soát dòng tiền, xuất hóa đơn giá trị gia tăng điện tử hoặc hoàn tiền khi khách hủy vé. Đến ngày bay, Khối Dịch vụ mặt đất và Khai thác sân bay (trực tiếp là Công ty Dịch vụ mặt đất sân bay Việt Nam - VIAGS và các chi nhánh cảng hàng không) tiếp nhận sơ đồ ghế của chuyến bay, mở cổng làm thủ tục trực tuyến, vận hành dàn máy Kiosk tại nhà ga và kiểm soát khách ra tàu bay ở cửa khởi hành. Toàn bộ hạ tầng máy chủ, cơ sở dữ liệu, đường truyền mạng và trực kỹ thuật 24/7 cho ba khâu trên do Khối Công nghệ thông tin và Chuyển đổi số cùng Công ty Cổ phần Tin học – Viễn thông Hàng không (AITS) đảm nhận.

3.1.2. Phân tích thực trạng năm thành phần cấu thành Hệ thống thông tin đặt vé và làm thủ tục trực tuyến

Trước khi đi vào từng thành phần ở Bảng 3.1, có bốn thông số nghiệp vụ xuất hiện xuyên suốt mọi bước xử lý của Vietnam Airlines mà em quy ước gọi gọn trong toàn bài:
- Mã PNR (hồ sơ đặt chỗ): mã định danh gồm 6 ký tự chữ in hoa và số (ví dụ: VN8K2P), sinh ra ngay khi khách giữ chỗ.
- Vé điện tử: dãy 13 chữ số chuẩn IATA, luôn bắt đầu bằng đầu số 738 của Vietnam Airlines, chỉ phát hành sau khi hệ thống nhận đủ tiền.
- Hạn giữ chỗ: 15 phút khóa ghế tạm thời tính từ lúc cấp mã PNR chờ khách thanh toán.
- Khung giờ mở thủ tục: từ 24 giờ đến 1 giờ trước giờ khởi hành dự kiến của chuyến bay.

Bảng 3.1: Tổng hợp thực trạng 5 thành phần của Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines

| STT | Thành phần hệ thống | Hiện trạng trang bị và vận hành thực tế tại Vietnam Airlines | Vai trò trong quy trình đặt vé và làm thủ tục |
| :---: | :--- | :--- | :--- |
| 1 | Phần cứng | Cụm máy chủ ứng dụng và CSDL đặt tại Trung tâm dữ liệu chính (Hà Nội), Trung tâm dự phòng (TP. Hồ Chí Minh) kết hợp hạ tầng đám mây; quầy Kiosk cảm ứng kèm máy in nhiệt tại sân bay Nội Bài, Tân Sơn Nhất, Đà Nẵng; đầu đọc mã vạch 2D và camera sinh trắc học tại cửa sân bay; máy tính, điện thoại của khách | Chịu tải xử lý và lưu trữ hàng triệu hồ sơ đặt chỗ; cung cấp thiết bị tại sân bay để khách tự in thẻ lên máy bay hoặc quét mã qua cửa an ninh |
| 2 | Phần mềm | Cổng thông tin https://www.vietnamairlines.com; ứng dụng di động Vietnam Airlines (iOS, Android) tích hợp ví Apple Wallet và Google Wallet; các phân hệ quản lý lịch bay, tính giá vé, giữ chỗ PNR, thanh toán xuất vé điện tử, làm thủ tục chọn ghế và quản lý hội viên Bông Sen Vàng | Tự động hóa chuỗi thao tác từ lúc khách tìm chuyến bay, chọn giá vé, trả tiền, nhận vé điện tử cho đến khi chọn ghế và lấy thẻ lên máy bay |
| 3 | Cơ sở dữ liệu | Hệ quản trị CSDL quan hệ tập trung lưu trữ các bảng: danh mục chuyến bay, sơ đồ ghế theo chuyến, bảng giá vé, hồ sơ PNR, vé điện tử, giao dịch thanh toán, dịch vụ bổ trợ, thẻ lên máy bay (BCBP), hồ sơ hành khách và tài khoản Bông Sen Vàng | Cập nhật tức thời số ghế trống và trạng thái vé, ngăn tình trạng hai hành khách đặt trùng một ghế trên cùng chuyến bay |
| 4 | Mạng truyền thông | Đường truyền Internet băng thông rộng tích hợp mạng phân phối nội dung CDN và giao thức HTTPS; kênh thuê riêng cùng mạng riêng ảo nối trung tâm dữ liệu với 22 sân bay nội địa và quốc tế; cổng API kết nối hơn 30 ngân hàng (VietQR, NAPAS), thẻ quốc tế, ví điện tử và hệ thống VNeID của Bộ Công an | Truyền tải tức thời thông tin giữ chỗ, kết quả trừ tiền ngân hàng và dữ liệu thẻ lên máy bay giữa thiết bị của khách, máy chủ hãng và sân bay |
| 5 | Con người và Quy trình | Người dùng bên ngoài (khách vãng lai, hành khách có mã PNR, hội viên Bông Sen Vàng); nhân sự nội bộ (nhân viên thương mại, tổng đài 1900 1100, nhân viên mặt đất VIAGS, quản trị viên CNTT); vận hành theo quy tắc giữ chỗ tạm thời, khung giờ mở thủ tục và quy định bảo vệ dữ liệu cá nhân | Vận hành, giám sát hệ thống, xử lý các ca phát sinh như đổi giờ bay, hoàn hủy vé, đối soát lỗi thanh toán và kiểm soát an toàn hàng không |

3.1.3. Phân tích quy trình xử lý thông tin và các luồng thông tin đầu vào, đầu ra của hệ thống

Mỗi giao dịch trên hệ thống là một vòng xử lý nhận dữ liệu thô từ hành khách hoặc cổng liên thông, kiểm tra ràng buộc rồi kết xuất thành chứng từ điện tử và báo cáo quản trị (Bảng 3.2 và Bảng 3.3).

Bảng 3.2: Đặc tả các luồng dữ liệu đầu vào của hệ thống

| STT | Luồng dữ liệu đầu vào | Nguồn phát sinh | Cấu trúc và Định dạng dữ liệu | Quy tắc kiểm tra và Ràng buộc hợp lệ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Tiêu chí tìm kiếm chuyến bay | Khách vãng lai, Hành khách, Hội viên | Mã sân bay đi (3 ký tự IATA), Mã sân bay đến (3 ký tự IATA), Ngày đi, Ngày về, Loại hành trình, Số lượng khách (Người lớn, Trẻ em, Em bé) | Điểm đi và điểm đến không trùng nhau; ngày khởi hành không nhỏ hơn ngày hiện tại; tối đa 9 khách trong một lần đặt trực tuyến; mỗi trẻ dưới 2 tuổi phải đi kèm ít nhất 1 người lớn |
| 2 | Thông tin cá nhân hành khách | Khách vãng lai, Hành khách, Hội viên | Danh xưng, Họ, Tên đệm và tên, Ngày sinh, Quốc tịch, Số CCCD hoặc Hộ chiếu, Số điện thoại, Email | Họ tên viết không dấu, khớp với giấy tờ tùy thân; số CCCD đủ 12 chữ số; số điện thoại 10 chữ số; email đúng định dạng để nhận vé điện tử |
| 3 | Lựa chọn dịch vụ hành lý và ghế ngồi | Hành khách, Hội viên | Mã gói hành lý ký gửi trả trước (kiện 23 kg hoặc 32 kg), Mã vị trí ghế trên sơ đồ khoang (ví dụ: 15A, 22C), Suất ăn đặc biệt | Chỉ chọn được ghế đang ở trạng thái Trống; khách đi cùng trẻ nhỏ hoặc cần trợ giúp đặc biệt không được chọn ghế hàng cửa thoát hiểm |
| 4 | Thông tin xác thực thanh toán trực tuyến | Hành khách, Cổng thanh toán ngân hàng | Mã PNR, Tổng tiền thanh toán, Phương thức thanh toán (VietQR, Thẻ nội địa, Thẻ quốc tế, Ví điện tử), Mã giao dịch ngân hàng | Giao dịch phải hoàn tất trước khi hết hạn giữ chỗ; bản tin phản hồi từ ngân hàng phải có chữ ký số hợp lệ và khớp đúng số tiền của hồ sơ |
| 5 | Yêu cầu làm thủ tục trực tuyến | Hành khách, Hội viên, Hệ thống VNeID | Mã PNR hoặc Số vé điện tử, Họ hành khách, Sân bay khởi hành, Xác nhận an ninh hàng không | Vé điện tử đang ở trạng thái Mở chờ bay; thời điểm gửi yêu cầu nằm trong khung giờ mở thủ tục; khách bắt buộc tích chọn cam kết không mang vật phẩm nguy hiểm |
| 6 | Thông tin tài khoản Hội viên Bông Sen Vàng | Hội viên Bông Sen Vàng | Số thẻ hội viên (9 – 16 chữ số) hoặc Email, Mật khẩu đăng nhập, Mã OTP (6 chữ số) | Tài khoản đang hoạt động; khi đổi dặm thưởng lấy vé hoặc nâng hạng ghế phải xác thực đúng mã OTP gửi về điện thoại hoặc email chính chủ |

Bảng 3.3: Đặc tả các luồng dữ liệu đầu ra của hệ thống

| STT | Luồng dữ liệu đầu ra | Hình thức thể hiện | Đối tượng tiếp nhận | Nội dung thông tin cung cấp | Ý nghĩa nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | Danh sách chuyến bay và Ma trận giá vé | Bảng trực quan trên Web và Ứng dụng di động | Khách vãng lai, Hành khách, Hội viên | Số hiệu chuyến bay, giờ cất/hạ cánh, loại tàu bay, số ghế trống còn lại và mức giá từng hạng vé (Phổ thông Tiết kiệm, Tiêu chuẩn, Linh hoạt, Thương gia) | Giúp khách so sánh giờ bay, tổng chi phí, tiêu chuẩn hành lý và điều kiện hoàn đổi trước khi đặt chỗ |
| 2 | Xác nhận hành trình và Vé điện tử | Màn hình xác nhận, Tệp PDF gửi qua email | Hành khách, Hội viên, Nhân viên bán vé | Mã PNR, Số vé điện tử, Họ tên khách, Chi tiết chặng bay, Tiêu chuẩn hành lý và Bảng thu chi tiết thuế phí | Chứng từ xác nhận hợp đồng vận chuyển hàng không, dùng để tra cứu hành trình và làm thủ tục bay |
| 3 | Thẻ lên máy bay điện tử (BCBP) | Thẻ điện tử trên màn hình, Apple/Google Wallet, Bản in nhiệt Kiosk | Hành khách, Hội viên, Cổng kiểm soát an ninh sân bay | Họ tên khách, Số hiệu chuyến bay, Ngày bay, Cửa ra tàu bay, Giờ lên tàu, Số ghế (ví dụ: 15A), Số thứ tự làm thủ tục (SEQ) và Mã vạch 2D chuẩn IATA | Giúp khách đi thẳng qua cửa an ninh, đối chiếu sinh trắc học VNeID và quét mã lên tàu bay |
| 4 | Hóa đơn giá trị gia tăng điện tử | Tệp PDF và XML có chữ ký số cơ quan thuế | Hành khách, Doanh nghiệp mua vé, Phòng Kế toán | Mã số thuế đơn vị, thông tin người mua, số vé điện tử, giá vận chuyển chưa thuế, thuế suất GTGT và tổng tiền thanh toán | Chứng từ để hành khách và doanh nghiệp hạch toán, quyết toán chi phí công tác |
| 5 | Báo cáo quản trị doanh thu và Khai thác chuyến bay | Bảng số liệu tổng hợp và Biểu đồ điều hành | Quản trị viên, Trưởng phòng thương mại, Điều hành bay | Tổng số vé đã bán, doanh thu theo đường bay, hệ số sử dụng ghế, danh sách khách đã làm thủ tục và nhật ký đối soát thanh toán | Phục vụ kiểm soát dòng tiền, điều chỉnh mở bán các dải giá vé và chốt tải trọng tàu bay trước giờ cất cánh |

Trên thực tế, điểm dễ trục trặc nhất trong luồng dữ liệu ở Bảng 3.2 nằm ở khâu nhận bản tin phản hồi từ hơn 30 ngân hàng đối tác (luồng vào số 4). Nếu khách quét mã VietQR sát phút cuối của hạn giữ chỗ mà đường truyền liên ngân hàng trả kết quả trễ vài giây, hệ thống đã tự động hủy mã PNR và thu hồi ghế dù tài khoản của khách vừa bị trừ tiền. Ngoài ra, ở đầu ra số 3 (Bảng 3.3), hình thức in thẻ lên máy bay tại quầy Kiosk hiện mới phủ ở Nội Bài, Tân Sơn Nhất và Đà Nẵng; hành khách bay từ nhiều sân bay địa phương nếu chưa kịp lưu thẻ điện tử trên điện thoại vẫn phải xếp hàng tại quầy truyền thống.

3.2. Phân tích các tác nhân, chức năng và quy trình nghiệp vụ của hệ thống

3.2.1. Phân tích các tác nhân tương tác và sơ đồ phân cấp tác nhân của hệ thống

Tương tác với hệ thống đặt vé và làm thủ tục của Vietnam Airlines có 6 tác nhân, chia làm hai nhánh rõ rệt trên Hình 3.1: nhánh người dùng bên ngoài và nhánh vận hành nội bộ – liên thông.

[[IMAGE: assets/diagrams/diag_2_1_phan_cap_tac_nhan.png | Caption: Hình 3.1. Sơ đồ phân cấp tác nhân của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines.]]

Điểm đáng chú ý trên Hình 3.1 nằm ở nhánh khách hàng bên ngoài với ba mức quyền hạn kế thừa nối tiếp nhau:

- Ở mức cơ bản nhất, Khách vãng lai truy cập vietnamairlines.com hoặc mở ứng dụng di động mà không cần đăng nhập. Nhóm này chỉ đọc được dữ liệu công khai (lịch bay, giá vé theo ngày, điều kiện hành lý) và khởi tạo lượt đặt chỗ mới.
- Ngay khi đặt chỗ thành công và có mã PNR kèm vé điện tử, người dùng chuyển thành tác nhân Hành khách. Kế thừa toàn bộ quyền tra cứu của Khách vãng lai, Hành khách được mở khóa các chức năng tác động trực tiếp vào hồ sơ đặt chỗ của mình: mua thêm hành lý ký gửi, chọn ghế, tải hóa đơn, yêu cầu đổi/hoàn vé và làm thủ tục trực tuyến.
- Ở tầng cao nhất là Hội viên Bông Sen Vàng (Lotusmiles). Sau khi đăng nhập bằng số thẻ và mật khẩu, ngoài đầy đủ quyền của một Hành khách, hội viên được hệ thống tự điền thông tin cá nhân khi mua vé, tự động cộng dặm sau chuyến bay, dùng dặm đổi vé thưởng hoặc mua vé kết hợp tiền và dặm (Cash & Miles), nâng hạng Thương gia và ưu tiên chọn ghế khu vực phía trước khi làm thủ tục.

Ở nhánh bên phải Hình 3.1, hai tác nhân con người nội bộ được tách biệt rõ theo phạm vi công việc: Nhân viên bán vé và phục vụ mặt đất (tổng đài 1900 1100, phòng vé chi nhánh, nhân viên mặt đất VIAGS) chỉ xử lý tác vụ theo từng hồ sơ khách hoặc từng chuyến bay tại sân bay; trong khi Quản trị viên hệ thống (chuyên viên thương mại và CNTT) nắm quyền cấu hình danh mục đường bay, mở kho ghế theo dải giá, phân quyền tài khoản và đối soát các giao dịch thanh toán treo. Riêng tác nhân thứ sáu là Hệ thống Thanh toán và Định danh VNeID đại diện cho các máy chủ bên ngoài kết nối tự động qua API để trừ tiền ngân hàng/ví điện tử và đối chiếu căn cước công dân, sinh trắc học khuôn mặt của khách tại cổng an ninh sân bay.

Bảng 3.4: Bảng tổng hợp danh sách và mô tả vai trò của các tác nhân tương tác với hệ thống

| STT | Tên tác nhân | Phân loại tác nhân | Mô tả vai trò và các hoạt động tương tác chính với hệ thống |
| :---: | :--- | :--- | :--- |
| 1 | Khách vãng lai | Người dùng bên ngoài (Mức cơ bản) | Truy cập web hoặc ứng dụng khi chưa có mã đặt chỗ; tra cứu lịch bay, xem giá vé theo ngày, đọc điều kiện hạng vé và khởi tạo lượt đặt vé mới |
| 2 | Hành khách | Người dùng bên ngoài (Kế thừa Khách vãng lai) | Khách đã có mã PNR và vé điện tử; tra cứu hồ sơ đặt chỗ, mua thêm hành lý, chọn ghế, đổi hoặc hoàn vé và làm thủ tục trực tuyến lấy thẻ lên máy bay |
| 3 | Hội viên Bông Sen Vàng | Người dùng bên ngoài (Kế thừa Hành khách) | Khách có tài khoản Lotusmiles; đăng nhập để tự điền thông tin cá nhân, tích lũy dặm, dùng dặm đổi vé thưởng hoặc nâng hạng Thương gia |
| 4 | Nhân viên bán vé và phục vụ mặt đất | Người dùng nghiệp vụ nội bộ | Nhân viên tổng đài và sân bay; kiểm tra trạng thái vé, hỗ trợ đổi/hoàn vé, nhận hành lý ký gửi và kiểm soát danh sách khách tại cửa khởi hành |
| 5 | Quản trị viên hệ thống | Người dùng quản trị nội bộ | Chuyên viên thương mại và CNTT; cập nhật danh mục chuyến bay, cấu hình kho ghế mở bán, phân quyền người dùng và đối soát giao dịch |
| 6 | Hệ thống Thanh toán và Định danh VNeID | Tác nhân hệ thống liên thông ngoài | Cổng ngân hàng, ví điện tử trừ tiền và trả kết quả giao dịch; hệ thống VNeID xác thực CCCD và sinh trắc học khuôn mặt khi làm thủ tục bay |

3.2.2. Phân tích chức năng hệ thống qua biểu đồ ca sử dụng tổng quát và phân rã

Chín ca sử dụng chính nằm trong biên hệ thống và mối liên hệ với 6 tác nhân trên được biểu diễn tại Hình 3.2.

[[IMAGE: assets/diagrams/diag_2_2_usecase_tong_quat.png | Caption: Hình 3.2. Biểu đồ ca sử dụng tổng quát của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines.]]

Trên Hình 3.2, các mũi tên phụ thuộc bắt buộc (include) và mở rộng tùy chọn (extend) thể hiện rõ ràng buộc nghiệp vụ của hãng. Khi khách chọn Đặt vé máy bay trực tuyến, hệ thống bắt buộc gọi kèm ca sử dụng Thanh toán tiền vé trực tuyến (liên thông với Cổng thanh toán ngân hàng/ví điện tử), bởi mã PNR chỉ được xuất thành vé điện tử khi đã trừ tiền thành công. Ngược lại, ca sử dụng Mua thêm hành lý và dịch vụ bổ trợ chỉ mang quan hệ mở rộng (extend): khách có thể mua thêm kiện hành lý 23 kg, chọn chỗ ngồi hoặc đặt suất ăn ngay lúc mua vé, hoặc bỏ qua để mua bổ sung sau.

Tương tự, ở ca sử dụng Làm thủ tục trực tuyến, hệ thống bắt buộc bao gồm (include) bước Chọn ghế ngồi trên sơ đồ khoang tàu bay để gán số ghế cụ thể lên thẻ lên máy bay điện tử; còn bước Xác thực giấy tờ sinh trắc học qua VNeID là nhánh mở rộng (extend) dành cho hành khách muốn đi qua cổng an ninh tự động mà không cần xuất trình căn cước vật lý.

Đi sâu vào hai phân hệ cốt lõi nhất là Đặt vé trực tuyến và Làm thủ tục chuyến bay, Hình 3.3 tách nhỏ từng bước xử lý bên trong:

[[IMAGE: assets/diagrams/diag_2_3_usecase_dat_ve_checkin.png | Caption: Hình 3.3. Biểu đồ ca sử dụng phân rã phân hệ Đặt vé trực tuyến và Làm thủ tục chuyến bay.]]

Ở nửa trên Hình 3.3 (phân hệ Đặt vé và Quản lý đặt chỗ), điểm mấu chốt về mặt kỹ thuật là ca sử dụng Khóa chỗ tạm thời và sinh mã PNR được gọi tự động (include) ngay khoảnh khắc khách xác nhận thông tin cá nhân. Cơ chế này giữ cứng ghế trong kho trong lúc chờ khách chuyển sang bước Thanh toán trực tuyến và xuất vé điện tử, tránh việc hai khách cùng trả tiền cho một chiếc ghế. Ở nửa dưới Hình 3.3 (phân hệ Làm thủ tục trực tuyến), sau khi Xác thực mã PNR và kiểm tra điều kiện bay, hành khách bắt buộc đi qua bước Chọn vị trí ghế ngồi và xác nhận quy định an ninh hàng không trước khi hệ thống Phát hành Thẻ lên máy bay điện tử có mã vạch 2D và đồng bộ sinh trắc học VNeID ra cửa sân bay.

Bảng 3.5: Tổng hợp danh mục các ca sử dụng chính của hệ thống

| Mã UC | Tên ca sử dụng | Tác nhân chính | Tác nhân phối hợp | Mô tả tóm tắt nội dung nghiệp vụ của ca sử dụng |
| :---: | :--- | :--- | :--- | :--- |
| UC01 | Tra cứu chuyến bay và so sánh giá vé | Khách vãng lai, Hành khách, Hội viên | Không áp dụng | Nhập sân bay đi/đến, ngày bay và số lượng khách; hệ thống truy vấn và trả về danh sách chuyến bay còn chỗ kèm các mức giá Phổ thông, Phổ thông đặc biệt và Thương gia |
| UC02 | Đặt vé máy bay và thanh toán trực tuyến | Khách vãng lai, Hành khách, Hội viên | Cổng thanh toán trực tuyến | Chọn chuyến bay, điền thông tin hành khách, khóa chỗ tạm thời để lấy mã PNR, thanh toán trực tuyến và nhận vé điện tử |
| UC03 | Quản lý hồ sơ đặt chỗ (Tra cứu mã PNR) | Hành khách, Hội viên | Cổng thanh toán trực tuyến | Nhập mã PNR và Họ tên để xem lại hành trình, kiểm tra trạng thái vé điện tử, mua thêm hành lý ký gửi, tải hóa đơn điện tử hoặc gửi yêu cầu đổi/hoàn vé |
| UC04 | Làm thủ tục trực tuyến | Hành khách, Hội viên | Hệ thống VNeID và Cửa sân bay | Xác thực mã PNR trong khung giờ mở thủ tục, chọn ghế trên sơ đồ tàu bay, cam kết quy định an ninh về vật phẩm nguy hiểm và nhận Thẻ lên máy bay điện tử |
| UC05 | Đăng nhập và sử dụng dặm Bông Sen Vàng | Hội viên Bông Sen Vàng | Không áp dụng | Đăng nhập tài khoản để xem số dư dặm, tự điền thông tin khi mua vé, đổi dặm lấy vé thưởng hoặc mua vé kết hợp tiền và dặm |
| UC06 | Quản trị lịch bay, kho ghế và đối soát | Nhân viên, Quản trị viên hệ thống | Cổng thanh toán trực tuyến | Cập nhật lịch bay thương mại, điều chỉnh số ghế mở bán theo hạng vé, xử lý giao dịch thanh toán treo và hỗ trợ khách đổi/hoàn vé tại quầy |

3.2.3. Phân tích và đặc tả chi tiết các ca sử dụng nghiệp vụ trọng tâm của hệ thống

Các Bảng 3.6 đến Bảng 3.10 đặc tả luồng sự kiện chính và các nhánh xử lý ngoại lệ của năm ca sử dụng từ UC01 đến UC05:

Bảng 3.6: Đặc tả ca sử dụng UC01 – Tra cứu chuyến bay và so sánh giá vé

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC01 |
| Tên ca sử dụng | Tra cứu chuyến bay và so sánh giá vé trực tuyến |
| Tác nhân thực hiện | Khách vãng lai, Hành khách hoặc Hội viên Bông Sen Vàng |
| Mô tả tóm tắt | Tra cứu danh sách chuyến bay đang mở bán, số ghế trống còn lại và bảng so sánh điều kiện các hạng giá vé theo hành trình, ngày bay người dùng chọn |
| Tiền điều kiện | Thiết bị có kết nối Internet và truy cập trang chủ https://www.vietnamairlines.com hoặc ứng dụng di động Vietnam Airlines |
| Hậu điều kiện | Hệ thống hiển thị danh sách chuyến bay thỏa điều kiện tìm kiếm kèm ma trận giá và điều kiện vé; lưu tiêu chí tìm kiếm trong phiên làm việc để chuyển sang bước đặt vé |
| Luồng sự kiện chính | 1. Người dùng chọn mục Mua vé trực tuyến tại màn hình trang chủ.<br>2. Người dùng chọn loại hành trình (Khứ hồi, Một chiều hoặc Nhiều chặng), sân bay đi (ví dụ: Hà Nội - HAN), sân bay đến (ví dụ: TP. Hồ Chí Minh - SGN), ngày đi, ngày về và số lượng khách (Người lớn, Trẻ em, Em bé).<br>3. Người dùng nhấn nút Tìm chuyến bay.<br>4. Hệ thống kiểm tra dữ liệu đầu vào (điểm đi khác điểm đến, ngày bay không nằm trong quá khứ, tổng số khách không quá 9 người).<br>5. Hệ thống truy vấn CSDL lịch bay và kho ghế để lọc các chuyến bay đang Mở bán và còn đủ số ghế trống.<br>6. Hệ thống tính toán và hiển thị danh sách chuyến bay trong ngày theo thứ tự giờ khởi hành, kèm mức giá của từng nhóm hạng vé (Phổ thông Tiết kiệm, Phổ thông Tiêu chuẩn, Phổ thông Linh hoạt, Thương gia).<br>7. Người dùng nhấn vào một mức giá vé; hệ thống mở bảng chi tiết hiển thị tổng tiền sau thuế phí, tiêu chuẩn hành lý xách tay, hành lý ký gửi và điều kiện hoàn/đổi vé. |
| Luồng sự kiện thay thế | 4a. Nếu sân bay đi trùng sân bay đến hoặc chưa chọn ngày bay, hệ thống báo lỗi ngay dưới ô nhập liệu và yêu cầu chọn lại.<br>5a. Nếu toàn bộ chuyến bay trong ngày được chọn đã hết ghế nhưng các ngày lân cận (trước/sau 3 ngày) vẫn còn chỗ, hệ thống báo hết chỗ trong ngày đó và hiển thị thanh giá vé của 7 ngày liền kề để khách chọn ngày bay thay thế. |

Bảng 3.7: Đặc tả ca sử dụng UC02 – Đặt vé máy bay và thanh toán trực tuyến

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC02 |
| Tên ca sử dụng | Đặt vé máy bay và thanh toán trực tuyến |
| Tác nhân thực hiện | Khách vãng lai, Hành khách, Hội viên Bông Sen Vàng và Cổng thanh toán trực tuyến |
| Mô tả tóm tắt | Xử lý quy trình chọn chuyến bay, kê khai thông tin hành khách, khóa ghế tạm thời để cấp mã PNR, thu tiền qua cổng thanh toán và phát hành vé điện tử |
| Tiền điều kiện | Người dùng đã tra cứu chuyến bay (UC01); chuyến bay và hạng giá vé được chọn vẫn còn đủ ghế trống tại thời điểm xác nhận |
| Hậu điều kiện | Nếu thanh toán thành công: Hệ thống trừ chính thức số ghế trong kho, chuyển trạng thái PNR sang Đã xuất vé, sinh bản ghi vé điện tử và gửi tệp PDF vé qua email. Nếu thất bại hoặc quá hạn giữ chỗ: Hệ thống hủy giữ chỗ và trả ghế về kho chỗ chuyến bay |
| Luồng sự kiện chính | 1. Từ kết quả tìm kiếm, hành khách chọn chuyến bay, chọn hạng giá vé và nhấn Tiếp tục.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin hành khách và thông tin liên hệ.<br>3. Hành khách nhập Danh xưng, Họ, Tên đệm và tên, Ngày sinh, Số CCCD/Hộ chiếu, Số thẻ Bông Sen Vàng (nếu có), Số điện thoại và Email nhận vé.<br>4. Hành khách chọn mua thêm hành lý ký gửi trả trước hoặc chọn trước ghế ngồi (nếu cần), sau đó nhấn Xác nhận thông tin.<br>5. Hệ thống kiểm tra định dạng dữ liệu, đối chiếu lại tồn kho ghế thực tế, khóa tạm thời số ghế đã chọn và tạo bản ghi Hồ sơ đặt chỗ kèm mã PNR.<br>6. Hệ thống mở màn hình Thanh toán hiển thị mã PNR, đồng hồ đếm ngược thời gian giữ chỗ và tổng số tiền phải trả (giá vé cơ bản, thuế GTGT, phí sân bay và phí dịch vụ bổ trợ).<br>7. Hành khách chọn phương thức thanh toán (ví dụ: quét mã VietQR hoặc thẻ quốc tế) và xác nhận chuyển tiền.<br>8. Cổng thanh toán ngân hàng trừ tiền và gửi bản tin xác nhận giao dịch thành công có chữ ký số về hệ thống Vietnam Airlines.<br>9. Hệ thống ghi nhận giao dịch thanh toán thành công, chuyển trạng thái ghế sang Đã bán, phát hành vé điện tử, hiển thị màn hình xác nhận và gửi email kèm tệp PDF vé điện tử cho khách. |
| Luồng sự kiện thay thế | 5a. Nếu ngay lúc khách nhấn xác nhận, ghế cuối cùng của hạng giá đó vừa bị một phiên giao dịch khác khóa trước vài giây, hệ thống báo hạng vé vừa hết chỗ và gợi ý mức giá kế tiếp còn trống trên chuyến bay.<br>8a. Nếu khách hủy thanh toán hoặc hết hạn giữ chỗ mà hệ thống chưa nhận được bản tin xác nhận từ ngân hàng, hệ thống chuyển trạng thái PNR sang Đã hủy và giải phóng ghế.<br>8b. Nếu tài khoản khách đã bị trừ tiền nhưng bản tin ngân hàng trả về muộn sau khi mã PNR đã hết hạn giữ chỗ, hệ thống đưa giao dịch vào danh sách Chờ đối soát để cấp lại vé (nếu chuyến bay còn ghế) hoặc hoàn trả 100% tiền về tài khoản khách. |

Bảng 3.8: Đặc tả ca sử dụng UC03 – Quản lý hồ sơ đặt chỗ (Tra cứu mã PNR)

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC03 |
| Tên ca sử dụng | Quản lý hồ sơ đặt chỗ và dịch vụ sau bán vé |
| Tác nhân thực hiện | Hành khách (đã có mã PNR), Hội viên Bông Sen Vàng và Cổng thanh toán trực tuyến |
| Mô tả tóm tắt | Tra cứu lại hồ sơ hành trình bằng mã PNR hoặc số vé điện tử, hỗ trợ mua bổ sung hành lý ký gửi, chọn lại ghế, tải hóa đơn điện tử hoặc gửi yêu cầu đổi/hoàn vé |
| Tiền điều kiện | Hành khách đã đặt chỗ thành công và có mã PNR hợp lệ lưu trong bảng hồ sơ đặt chỗ |
| Hậu điều kiện | Hệ thống hiển thị chi tiết hồ sơ đặt chỗ; nếu khách mua thêm dịch vụ bổ trợ hoặc đổi chuyến thành công thì cập nhật lại bản ghi vé điện tử và giao dịch thanh toán |
| Luồng sự kiện chính | 1. Tại màn hình trang chủ hoặc ứng dụng di động, hành khách chọn thẻ Quản lý đặt chỗ.<br>2. Hành khách nhập mã PNR hoặc số vé điện tử, nhập Họ hành khách và nhấn Tìm kiếm.<br>3. Hệ thống truy vấn CSDL, đối chiếu cặp thông tin Mã PNR và Họ hành khách.<br>4. Hệ thống hiển thị trang chi tiết Hồ sơ đặt chỗ gồm: trạng thái hồ sơ, thông tin các chặng bay, giờ khởi hành, danh sách khách, số vé điện tử, tiêu chuẩn hành lý hiện có và vị trí ghế ngồi.<br>5. Hành khách chọn Mua thêm dịch vụ bổ trợ (ví dụ: mua thêm 1 kiện hành lý 23 kg) hoặc chọn Tải hóa đơn điện tử.<br>6. Nếu mua thêm hành lý, hệ thống tính phí dịch vụ, gọi cổng thanh toán để trừ tiền, sau đó lưu bản ghi mới vào bảng dịch vụ bổ trợ và cập nhật hạn mức hành lý trên vé điện tử. |
| Luồng sự kiện thay thế | 3a. Nếu mã PNR không tồn tại hoặc Họ nhập vào không khớp với hành khách nào trong hồ sơ, hệ thống từ chối truy cập và báo Không tìm thấy hồ sơ đặt chỗ phù hợp.<br>5a. Nếu hành khách chọn Đổi chuyến bay hoặc Hoàn vé nhưng hạng vé đang giữ là Phổ thông Tiết kiệm (không cho phép hoàn đổi) hoặc chuyến bay đã khởi hành, hệ thống hiển thị điều kiện giá vé và từ chối thao tác. |

Bảng 3.9: Đặc tả ca sử dụng UC04 – Làm thủ tục trực tuyến

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC04 |
| Tên ca sử dụng | Làm thủ tục chuyến bay trực tuyến |
| Tác nhân thực hiện | Hành khách, Hội viên Bông Sen Vàng, Hệ thống định danh VNeID và Hệ thống kiểm soát sân bay |
| Mô tả tóm tắt | Xác nhận quy định an toàn hàng không, tự chọn ghế trên sơ đồ khoang tàu bay và cấp Thẻ lên máy bay điện tử (BCBP) trước giờ ra sân bay |
| Tiền điều kiện | Hành khách có mã PNR kèm vé điện tử ở trạng thái Mở chờ bay; thời điểm truy cập nằm trong khung giờ mở thủ tục trực tuyến |
| Hậu điều kiện | Ghế được chọn chuyển sang trạng thái Đã làm thủ tục; hệ thống tạo bản ghi Thẻ lên máy bay điện tử có số thứ tự SEQ, cửa ra tàu bay và mã vạch 2D, đồng thời đồng bộ dữ liệu ra cửa kiểm soát sân bay |
| Luồng sự kiện chính | 1. Hành khách chọn mục Làm thủ tục trên web hoặc ứng dụng, nhập mã PNR (hoặc số vé điện tử), Họ hành khách cùng Điểm khởi hành rồi nhấn Làm thủ tục.<br>2. Hệ thống kiểm tra mã PNR, đối chiếu họ tên, xác nhận vé điện tử hợp lệ và kiểm tra thời điểm hiện tại nằm trong khung giờ mở thủ tục.<br>3. Hệ thống hiển thị danh sách khách trong hồ sơ để chọn người làm thủ tục, kèm bảng danh mục vật phẩm nguy hiểm bị cấm mang lên tàu bay (chất nổ, khí gas, pin sạc dự phòng không được để trong hành lý ký gửi).<br>4. Hành khách tích chọn tên người làm thủ tục và nhấn xác nhận Đã đọc, hiểu rõ và tuân thủ quy định an toàn hàng không.<br>5. Hệ thống tải sơ đồ ghế thực tế theo đúng loại tàu bay khai thác chuyến đó, phân biệt rõ ghế còn trống và ghế đã có người ngồi.<br>6. Hành khách chọn vị trí ghế còn trống (ví dụ: ghế cửa sổ 15A) và nhấn Hoàn tất làm thủ tục.<br>7. Hệ thống khóa ghế 15A cho khách, cập nhật trạng thái vé sang Đã làm thủ tục, cấp số thứ tự SEQ, sinh mã vạch 2D và phát hành Thẻ lên máy bay điện tử.<br>8. Hành khách tải Thẻ lên máy bay về điện thoại (hoặc lưu vào Apple Wallet / Google Wallet) và có thể chọn xác thực sinh trắc học qua ứng dụng VNeID để đi thẳng qua cửa an ninh tự động tại sân bay. |
| Luồng sự kiện thay thế | 2a. Nếu khách truy cập ngoài khung giờ mở thủ tục (sớm hơn 24 giờ hoặc muộn hơn 1 giờ trước giờ bay), hệ thống thông báo khung giờ hợp lệ và hướng dẫn khách ra quầy sân bay.<br>4a. Nếu khách không đồng ý xác nhận quy định về vật phẩm nguy hiểm, hệ thống chặn chuyển bước và không cấp thẻ lên máy bay.<br>6a. Nếu khách đi cùng trẻ nhỏ dưới 2 tuổi hoặc có yêu cầu trợ giúp đặc biệt (như xe lăn), hệ thống khóa quyền chọn ghế hàng cửa thoát hiểm và hướng dẫn nhân viên sân bay bố trí trực tiếp. |

Bảng 3.10: Đặc tả ca sử dụng UC05 – Đăng nhập và sử dụng dặm Bông Sen Vàng

| Thuộc tính ca sử dụng | Nội dung chi tiết |
| :--- | :--- |
| Mã ca sử dụng | UC05 |
| Tên ca sử dụng | Đăng nhập tài khoản hội viên và quy đổi dặm thưởng Bông Sen Vàng |
| Tác nhân thực hiện | Hội viên Bông Sen Vàng |
| Mô tả tóm tắt | Xác thực tài khoản Lotusmiles để tra cứu lịch sử tích dặm và sử dụng số dư dặm thưởng (kèm mã OTP) đổi lấy vé máy bay hoặc nâng hạng ghế |
| Tiền điều kiện | Hành khách đã có tài khoản Hội viên Bông Sen Vàng và còn số dư dặm thưởng khả dụng trong bảng hội viên |
| Hậu điều kiện | Hệ thống thiết lập phiên đăng nhập hội viên; khi giao dịch đổi dặm hoàn tất, hệ thống trừ số dặm tương ứng trong tài khoản và xuất vé thưởng điện tử |
| Luồng sự kiện chính | 1. Người dùng nhấn nút Đăng nhập Lotusmiles trên trang chủ hoặc ứng dụng di động.<br>2. Hệ thống mở màn hình đăng nhập hội viên.<br>3. Hội viên nhập Số thẻ hội viên (hoặc email / số điện thoại đã đăng ký) cùng Mật khẩu và nhấn Đăng nhập.<br>4. Hệ thống đối chiếu thông tin với CSDL hội viên, hiển thị trang tổng quan tài khoản gồm: Họ tên, Hạng thẻ hiện tại (Bạc, Titan, Vàng, Bạch Kim), Số dặm xét hạng và Số dặm thưởng khả dụng.<br>5. Hội viên chọn Mua vé bằng dặm hoặc chọn kết hợp Tiền và Dặm ở bước thanh toán.<br>6. Hệ thống tính số dặm cần trừ và gửi mã OTP (6 chữ số) về số điện thoại hoặc email chính chủ của hội viên.<br>7. Hội viên nhập mã OTP lên màn hình xác nhận; hệ thống trừ số dặm thưởng tương ứng trong bảng hội viên và xuất vé điện tử. |
| Luồng sự kiện thay thế | 3a. Nếu hội viên nhập sai mật khẩu quá 5 lần liên tiếp, hệ thống khóa đăng nhập tạm thời trong 15 phút để chống dò mật khẩu.<br>7a. Nếu hội viên nhập sai mã OTP hoặc mã OTP đã quá hạn 3 phút, hệ thống từ chối trừ dặm và cho phép yêu cầu gửi lại mã mới. |

So sánh luồng kiểm tra giữa UC05 với UC03 và UC04 có một độ vênh rõ rệt về bảo mật: để tiêu dặm thưởng ở UC05, hội viên phải qua hai lớp mật khẩu và mã OTP 6 số; nhưng để mở hồ sơ đặt chỗ ở UC03 hoặc làm thủ tục ở UC04, hệ thống chỉ hỏi đúng Mã PNR và Họ hành khách. Thực tế nhiều hành khách có thói quen chụp ảnh vé hoặc thẻ lên máy bay đăng lên mạng xã hội; bất kỳ ai nhìn thấy mã PNR và họ tên trên ảnh đều có thể gõ vào màn hình UC03 để xem lịch trình, lấy số điện thoại, thư điện tử hoặc tự ý đổi chỗ ngồi của khách mà không gặp lớp chặn OTP nào.

3.2.4. Phân tích luồng quy trình nghiệp vụ qua biểu đồ hoạt động và biểu đồ trình tự

Hình 3.4 và Hình 3.5 chia hai quy trình Đặt vé – thanh toán và Làm thủ tục trực tuyến thành ba làn bơi dọc ứng với ba bên tham gia xử lý.

[[IMAGE: assets/diagrams/diag_2_4_activity_dat_ve.png | Caption: Hình 3.4. Biểu đồ hoạt động quy trình tìm chuyến bay, đặt vé và thanh toán trực tuyến.]]

Trên Hình 3.4, quy trình bắt đầu từ làn Hành khách khi người dùng nhập điểm đi, điểm đến, ngày bay và số lượng khách. Hệ thống truy vấn lịch bay cùng kho ghế trống rồi kiểm tra tại nút rẽ nhánh thứ nhất: nếu chuyến bay hết chỗ, luồng điều khiển quay lại để khách đổi ngày bay hoặc hành trình khác; nếu còn chỗ, màn hình hiển thị danh sách chuyến bay kèm giá từng hạng vé. Khi khách chọn chuyến, điền thông tin cá nhân và chọn hành lý bổ trợ, hệ thống kiểm tra định dạng, khóa ghế tạm thời và sinh mã PNR trước khi đẩy yêu cầu thanh toán sang làn Cổng thanh toán ngân hàng. Tại nút rẽ nhánh thứ hai kiểm tra kết quả trừ tiền: nếu giao dịch thất bại hoặc quá hạn giữ chỗ, hệ thống tự động hủy mã PNR và trả ghế về kho; nếu thành công, hệ thống trừ ghế chính thức và phát hành vé điện tử gửi cho khách.

[[IMAGE: assets/diagrams/diag_2_5_activity_checkin.png | Caption: Hình 3.5. Biểu đồ hoạt động quy trình làm thủ tục trực tuyến và đồng bộ sinh trắc học.]]

Ở quy trình làm thủ tục trực tuyến (Hình 3.5), ngay khi khách gửi yêu cầu, nút rẽ nhánh đầu tiên kiểm tra mã PNR và đối chiếu thời điểm truy cập với khung giờ mở thủ tục: nếu vé không hợp lệ hoặc ngoài giờ quy định, hệ thống từ chối và hướng dẫn khách ra quầy sân bay; nếu hợp lệ, hệ thống mở danh sách khách, yêu cầu cam kết quy định an toàn hàng không và tải sơ đồ ghế. Sau khi khóa ghế khách chọn và cấp Thẻ lên máy bay điện tử, luồng xử lý đi qua thanh tách nhánh ngang (Fork) để chạy song song hai luồng: bên làn Hành khách, người dùng lưu thẻ lên máy bay vào điện thoại hoặc ví Apple/Google Wallet; cùng lúc đó, bên làn Hệ thống VNeID và Cửa sân bay, hệ thống đẩy dữ liệu thẻ bay và mẫu sinh trắc học khuôn mặt ra cổng kiểm soát an ninh. Hai nhánh này gặp lại nhau tại thanh gộp nhánh (Join) khi khách quét mã qua cửa khởi hành.

Đi sâu vào tầng mã nguồn hướng đối tượng theo kiến trúc Biên giao diện – Điều khiển – Thực thể (BCE), Hình 3.6 và Hình 3.7 biểu diễn thứ tự gọi hàm giữa các lớp phần mềm theo trục thời gian:

[[IMAGE: assets/diagrams/diag_2_6_sequence_dat_ve.png | Caption: Hình 3.6. Biểu đồ trình tự ca sử dụng Đặt vé và thanh toán trực tuyến theo kiến trúc BCE.]]

Trên Hình 3.6, sáu đối tượng tham gia tương tác gồm tác nhân Hành khách, lớp biên Giao diện đặt vé, lớp điều khiển Đặt chỗ, hai lớp thực thể Chuyến bay và Hồ sơ đặt chỗ, cùng Cơ sở dữ liệu và Cổng thanh toán. Từ bước 1 đến bước 3, hành khách gửi tiêu chí tìm kiếm và lớp điều khiển truy vấn các chuyến bay còn ghế. Điểm chốt của biểu đồ nằm ở bước 7 đến bước 10: lớp điều khiển gọi hàm khóa chỗ tạm thời và sinh mã PNR trên lớp thực thể Hồ sơ đặt chỗ trước khi mở cổng thanh toán ở bước 11. Khung điều kiện rẽ nhánh (alt) phía dưới tách rõ hai trường hợp trả về từ ngân hàng:
- Nếu trừ tiền thành công (bước 13 – 16): lớp điều khiển cập nhật trạng thái đã thanh toán, trừ ghế chính thức trên lớp Chuyến bay, phát hành vé điện tử và trả kết quả ra màn hình.
- Nếu thanh toán lỗi hoặc hết hạn giữ chỗ (bước 17 – 18): lớp điều khiển kích hoạt hàm hủy giữ chỗ tạm thời để giải phóng ghế trống về lại chuyến bay và báo hủy mã PNR.

[[IMAGE: assets/diagrams/diag_2_7_sequence_checkin.png | Caption: Hình 3.7. Biểu đồ trình tự ca sử dụng Làm thủ tục trực tuyến theo kiến trúc BCE.]]

Biểu đồ trình tự Làm thủ tục trực tuyến (Hình 3.7) gồm 14 bước truyền thông điệp giữa tác nhân Hành khách, lớp biên Giao diện làm thủ tục, lớp điều khiển Thủ tục và ba lớp thực thể Hồ sơ đặt chỗ, Sơ đồ ghế tàu bay, Thẻ lên máy bay. Nhờ gom toàn bộ quy tắc kiểm tra vé và khóa ghế vào lớp điều khiển Thủ tục ở giữa, Vietnam Airlines tái sử dụng được cùng một lõi xử lý cho cả ba bề mặt giao diện: website, ứng dụng di động và quầy Kiosk tại sân bay.

3.2.5. Phân tích cấu trúc đối tượng nghiệp vụ qua biểu đồ lớp thực thể miền

Toàn bộ các đối tượng dữ liệu xuất hiện trong các luồng trình tự trên gắn kết với nhau thành cấu trúc tĩnh tại Biểu đồ lớp thực thể miền (Hình 3.8).

[[IMAGE: assets/diagrams/diag_2_8_class_diagram.png | Caption: Hình 3.8. Biểu đồ lớp thực thể miền của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines.]]

Thay vì gộp chung dữ liệu vào vài lớp lớn, 8 lớp thực thể trên Hình 3.8 tách theo đúng bản chất nghiệp vụ bán vé hàng không:

a. Quan hệ hợp thành giữa lớp Chuyến bay và lớp Ghế trên chuyến bay (Bội số một – nhiều):

Trong ngành hàng không, giá vé và tình trạng chỗ không gắn cố định vào đường bay mà biến động theo từng ghế trên từng chuyến bay cụ thể. Vì vậy, lớp Chuyến bay chỉ giữ thông tin chung của chuyến (số hiệu, sân bay đi/đến, giờ cất/hạ cánh, loại tàu bay), còn mỗi vị trí ghế trên chuyến đó tách thành một đối tượng Ghế trên chuyến bay để quản lý riêng hạng khoang, mức giá cơ bản và trạng thái ghế (Trống, Tạm khóa, Đã bán, Đã làm thủ tục). Hai lớp này nối bằng quan hệ hợp thành (hình thoi đen đặc ở đầu Chuyến bay): sơ đồ ghế theo chuyến không thể tồn tại độc lập nếu chuyến bay đó bị xóa.

b. Quan hệ kế thừa giữa lớp Hành khách và lớp Hội viên Bông Sen Vàng:

Lớp Hành khách lưu thông tin nhân thân bắt buộc khi đi tàu bay (họ tên, ngày sinh, số CCCD/Hộ chiếu, điện thoại, thư điện tử). Do mỗi hội viên Bông Sen Vàng trước hết cũng là một hành khách, lớp Hội viên Bông Sen Vàng kế thừa trực tiếp lớp Hành khách để dùng lại các trường nhân thân này, chỉ khai báo thêm số thẻ hội viên, hạng thẻ, số dặm tích lũy cùng hai phương thức cộng dặm và đổi dặm thưởng.

c. Quan hệ hợp thành giữa lớp Hồ sơ đặt chỗ và lớp Vé điện tử (Bội số một – nhiều):

Khi một nhóm khách đi cùng nhau đặt chỗ trong một lần giao dịch, hệ thống chỉ sinh một đối tượng Hồ sơ đặt chỗ (mang một mã PNR chung, một hạn giữ chỗ và tổng số tiền thanh toán của cả đoàn). Tuy nhiên, để kiểm soát hành lý và làm thủ tục cho từng người, bên trong Hồ sơ đặt chỗ đó phải chứa từ một đến nhiều đối tượng Vé điện tử riêng biệt tương ứng với từng hành khách trong đoàn.

d. Quan hệ kết hợp giữa lớp Hồ sơ đặt chỗ và lớp Giao dịch thanh toán (Bội số một – không hoặc nhiều):

Một Hồ sơ đặt chỗ có thể gắn với không hoặc nhiều Giao dịch thanh toán. Bội số 0..* này giải quyết hai tình huống thực tế: lúc mã PNR vừa mới tạo ở bước giữ chỗ thì số giao dịch thanh toán bằng 0; còn khi khách quét mã thanh toán lần đầu bị lỗi hạn mức thẻ phải quét lại lần hai, hoặc vài ngày sau khách vào mua thêm hành lý ký gửi, cùng một mã PNR đó sẽ lưu nhiều bản ghi giao dịch thanh toán nối tiếp nhau.

e. Quan hệ giữa lớp Ghế trên chuyến bay, lớp Vé điện tử và lớp Thẻ lên máy bay (Bội số một – không hoặc một):

Mỗi đối tượng Ghế trên chuyến bay tại một thời điểm chỉ gắn với tối đa một Vé điện tử đang hiệu lực (bội số 0..1, vì ghế có thể đang trống hoặc đã có chủ). Đến khi hành khách làm thủ tục trực tuyến, mỗi Vé điện tử sẽ sinh ra tối đa một đối tượng Thẻ lên máy bay (0..1) lưu số thứ tự làm thủ tục (SEQ), cửa ra tàu bay, giờ lên tàu và chuỗi mã vạch hai chiều BCBP.

3.3. Phân tích kiến trúc vật lý, sơ đồ mô tả cơ sở dữ liệu và giao diện thực tế của hệ thống

3.3.1. Phân tích kiến trúc triển khai vật lý ba tầng của hệ thống

Để chịu tải hàng chục nghìn phiên truy cập đồng thời mà vẫn cô lập an toàn vùng cơ sở dữ liệu lõi, hạ tầng kỹ thuật của hệ thống tách thành ba tầng vật lý (Hình 3.9).

[[IMAGE: assets/diagrams/diag_2_10_kien_truc_he_thong.png | Caption: Hình 3.9. Sơ đồ kiến trúc triển khai vật lý ba tầng của Hệ thống đặt vé và làm thủ tục trực tuyến.]]

Trên Hình 3.9, luồng yêu cầu đi từ ngoài vào trong qua ba lớp:

Tầng giao diện người dùng: Gồm trình duyệt web trên máy tính và điện thoại truy cập vietnamairlines.com, ứng dụng di động Vietnam Airlines (iOS và Android), màn hình cảm ứng tại quầy Kiosk và cổng kiểm soát sinh trắc học ở sân bay. Tầng này chỉ dựng giao diện, kiểm tra định dạng nhập liệu ban đầu và nhận thao tác của khách, hoàn toàn không có đường kết nối trực tiếp vào máy chủ cơ sở dữ liệu.

Tầng xử lý nghiệp vụ ứng dụng: Mọi gói tin HTTPS và lời gọi REST API từ thiết bị người dùng gửi về đều phải đi qua cổng điều phối (API Gateway) và thiết bị cân bằng tải trước khi chia vào ba cụm máy chủ dịch vụ. Cụm Đặt chỗ và Giá vé chuyên xử lý tìm kiếm chuyến bay, tính giá cộng thuế phí, khóa ghế tạm và cấp mã PNR. Cụm Xuất vé và Thanh toán nối với cổng ngân hàng để trừ tiền, cấp số vé điện tử và phát hành hóa đơn. Cụm Làm thủ tục và Hội viên phụ trách sơ đồ ghế khi làm thủ tục, sinh mã vạch 2D cho thẻ lên máy bay và tính dặm Bông Sen Vàng.

Tầng dữ liệu và liên thông: Nằm sâu trong vùng mạng máy chủ nội bộ sau tường lửa nhiều lớp, vận hành hệ quản trị cơ sở dữ liệu quan hệ lưu trữ cụm dữ liệu Đặt chỗ – Lịch bay và cụm dữ liệu Khách hàng – Hội viên. Từ tầng này có các kênh thuê riêng và VPN bảo mật nối ra cổng thanh toán ngân hàng, hệ thống định danh VNeID và hệ thống kiểm soát cửa khởi hành tại các cảng hàng không.

3.3.2. Phân tích sơ đồ mô tả cơ sở dữ liệu quan hệ và từ điển dữ liệu của hệ thống

a. Phân tích thực thể và chuẩn hóa dữ liệu đạt dạng chuẩn 3 (3NF):

Từ 8 lớp thực thể miền ở mục 3.2.5 và nhu cầu tách riêng bảng chứng từ dịch vụ bổ trợ (hành lý mua thêm, suất ăn, chọn ghế trả phí), cơ sở dữ liệu vật lý của hệ thống gồm 9 bảng quan hệ đạt dạng chuẩn 3 (3NF). Các bảng này thỏa dạng chuẩn 1 (1NF) vì mỗi ô dữ liệu chỉ lưu một giá trị đơn, không nhồi nhiều số vé hay nhiều mã ghế vào chung một cột; thỏa dạng chuẩn 2 (2NF) vì toàn bộ các cột không khóa đều phụ thuộc đầy đủ vào khóa chính. Ở mức dạng chuẩn 3 (3NF), các phụ thuộc bắc cầu đã tách triệt để: thông tin cá nhân của khách nằm riêng ở bảng Hành khách, thông tin tích dặm nằm ở bảng Hội viên Bông Sen Vàng và chỉ liên kết sang bảng Vé điện tử qua khóa ngoại `ma_hanh_khach`. Nhờ vậy, một hành khách bay nhiều chuyến trong năm không bị lưu lặp lại họ tên, số CCCD ở từng tờ vé và khi khách đổi số điện thoại chỉ cần cập nhật tại một bảng duy nhất.

b. Phân tích lược đồ thực thể quan hệ (ERD):

Hình 3.10 biểu diễn lược đồ thực thể quan hệ (ERD) của 9 bảng dữ liệu vật lý cùng khóa chính (PK), khóa ngoại (FK), kiểu dữ liệu và bội số quan hệ chân quạ:

[[IMAGE: assets/diagrams/diag_2_9_erd_csdl.png | Caption: Hình 3.10. Lược đồ thực thể quan hệ cơ sở dữ liệu đạt dạng chuẩn 3 gồm 9 bảng dữ liệu.]]

c. Bảng từ điển dữ liệu chi tiết gồm 9 bảng thực thể vật lý:

Cấu trúc trường dữ liệu, kiểu dữ liệu và ràng buộc của từng bảng trong Hình 3.10 quy định tại các Bảng 3.11 đến Bảng 3.19:

Bảng 3.11: Bảng Danh mục và lịch chuyến bay (CHUYEN_BAY)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| ma_chuyen_bay | VARCHAR(10) | Khóa chính | Bắt buộc | Mã định danh duy nhất của chuyến bay theo ngày khai thác (ví dụ: VN213_0615) |
| so_hieu_bay | VARCHAR(6) | | Bắt buộc | Số hiệu thương mại của chuyến bay bắt đầu bằng mã hãng VN (ví dụ: VN213, VN255) |
| san_bay_di | CHAR(3) | | Bắt buộc | Mã sân bay khởi hành gồm 3 chữ cái chuẩn IATA (ví dụ: HAN, SGN, DAD) |
| san_bay_den | CHAR(3) | | Bắt buộc | Mã sân bay hạ cánh gồm 3 chữ cái chuẩn IATA (ví dụ: SGN, CXR, NRT, CDG) |
| gio_khoi_hanh | DATETIME | | Bắt buộc | Ngày và giờ cất cánh dự kiến theo lịch bay thương mại |
| gio_ha_canh | DATETIME | | Bắt buộc | Ngày và giờ hạ cánh dự kiến tại sân bay đến |
| loai_tau_bay | VARCHAR(20) | | Bắt buộc | Dòng tàu bay khai thác (Boeing 787, Airbus A350-900, Airbus A321) |
| tong_so_ghe | INT | | Bắt buộc | Tổng số ghế vật lý thiết kế trên tàu bay khai thác chuyến đó |
| trang_thai | VARCHAR(20) | | Bắt buộc | Trạng thái vận hành: Đang mở bán, Đang làm thủ tục, Đóng quầy, Đã cất cánh, Hủy chuyến |

Bảng 3.12: Bảng Sơ đồ ghế ngồi và giá vé trên chuyến bay (GHE_CHUYEN_BAY)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| ma_ghe_chuyen | VARCHAR(16) | Khóa chính | Bắt buộc | Mã khóa phân biệt từng ghế trên một chuyến bay cụ thể (ghép từ mã chuyến bay và số ghế) |
| ma_chuyen_bay | VARCHAR(10) | Khóa ngoại | Bắt buộc | Liên kết sang bảng CHUYEN_BAY để biết vị trí ghế này thuộc chuyến bay nào |
| so_ghe | VARCHAR(5) | | Bắt buộc | Số hiệu hàng ghế và chữ cái vị trí ghế trên sơ đồ khoang (ví dụ: 02A, 15C, 28G) |
| hang_ghe | CHAR(1) | | Bắt buộc | Mã khoang dịch vụ: C (Thương gia), W (Phổ thông đặc biệt), Y (Phổ thông) |
| nhom_gia_ve | VARCHAR(30) | | Bắt buộc | Nhóm điều kiện giá vé: Thương gia Linh hoạt, Phổ thông Linh hoạt, Tiêu chuẩn, Tiết kiệm |
| dac_tinh_vi_tri | VARCHAR(20) | | Bắt buộc | Đặc tính vị trí ghế: Cửa sổ, Lối đi, Giữa, Cửa thoát hiểm |
| gia_co_ban | DECIMAL(12,0)| | Bắt buộc | Giá vé cơ bản niêm yết chưa gồm thuế phí của vị trí ghế đó (VNĐ) |
| trang_thai_ghe | VARCHAR(15) | | Bắt buộc | Trạng thái tức thời của ghế: Trống, Tạm khóa, Đã bán, Đã làm thủ tục |

Bảng 3.13: Bảng Hồ sơ thông tin hành khách (HANH_KHACH)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| ma_hanh_khach | VARCHAR(12) | Khóa chính | Bắt buộc | Mã quản lý nội bộ của từng hành khách trong cơ sở dữ liệu |
| danh_xung | NVARCHAR(10) | | Bắt buộc | Danh xưng: Ông, Bà/Cô, Trẻ em, Em bé |
| ho_va_ten | NVARCHAR(100)| | Bắt buộc | Họ, tên đệm và tên đầy đủ của hành khách khớp với giấy tờ tùy thân |
| ngay_sinh | DATE | | Bắt buộc | Ngày sinh dùng để phân nhóm tuổi Người lớn, Trẻ em (2 – 12 tuổi), Em bé (dưới 2 tuổi) |
| quoc_tich | VARCHAR(50) | | Bắt buộc | Quốc tịch hành khách phục vụ kiểm tra điều kiện giấy tờ bay nội địa và quốc tế |
| so_cccd_ho_chieu| VARCHAR(20) | | Bắt buộc | Số CCCD (12 chữ số) hoặc số Hộ chiếu còn hiệu lực |
| so_dien_thoai | VARCHAR(15) | | Bắt buộc | Số điện thoại di động nhận mã OTP và tin nhắn báo thay đổi giờ bay |
| email | VARCHAR(100) | | Bắt buộc | Địa chỉ thư điện tử nhận xác nhận hành trình, vé điện tử PDF và hóa đơn |

Bảng 3.14: Bảng Tài khoản Hội viên Bông Sen Vàng (HOI_VIEN_BSV)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| so_the_bsv | VARCHAR(16) | Khóa chính | Bắt buộc | Mã số thẻ Hội viên Bông Sen Vàng cấp cho khách hàng thân thiết |
| ma_hanh_khach | VARCHAR(12) | Khóa ngoại | Bắt buộc | Liên kết một – một với bảng HANH_KHACH để lấy thông tin nhân thân của chủ thẻ |
| mat_khau_bam | VARCHAR(255) | | Bắt buộc | Chuỗi mật khẩu đăng nhập đã mã hóa băm một chiều |
| hang_the | VARCHAR(20) | | Bắt buộc | Hạng thẻ hiện tại: Bạc, Titan, Vàng, Bạch Kim |
| so_dam_xet_hang | INT | | Bắt buộc | Tổng dặm xét hạng tích lũy trong kỳ 12 tháng để duy trì hoặc nâng hạng thẻ |
| so_dam_thuong | INT | | Bắt buộc | Số dư dặm thưởng khả dụng dùng để đổi vé máy bay hoặc nâng hạng ghế |
| ngay_gia_nhap | DATE | | Bắt buộc | Ngày đăng ký gia nhập chương trình Lotusmiles |
| trang_thai_the | VARCHAR(15) | | Bắt buộc | Trạng thái tài khoản: Đang hoạt động, Tạm khóa, Hết hạn |

Bảng 3.15: Bảng Hồ sơ đặt chỗ PNR (HO_SO_DAT_CHO)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| ma_pnr | CHAR(6) | Khóa chính | Bắt buộc | Mã hồ sơ đặt chỗ cấp cho đoàn khách hoặc khách lẻ (ví dụ: VN8K2P) |
| ma_hanh_khach_lh| VARCHAR(12) | Khóa ngoại | Bắt buộc | Trỏ tới bảng HANH_KHACH để xác định người đại diện nhận thông tin liên hệ của cả đoàn |
| kenh_dat_cho | VARCHAR(20) | | Bắt buộc | Kênh phát sinh giao dịch: Website VNA, Ứng dụng di động VNA, Phòng vé, Đại lý |
| ngay_tao | DATETIME | | Bắt buộc | Thời điểm khởi tạo hồ sơ đặt chỗ và bắt đầu khóa ghế tạm thời |
| han_giu_cho | DATETIME | | Bắt buộc | Mốc thời gian hết hạn giữ chỗ tạm thời của hồ sơ PNR |
| tong_tien | DECIMAL(12,0)| | Bắt buộc | Tổng tiền phải thanh toán của toàn bộ hồ sơ PNR (giá vé, thuế phí và hành lý) |
| trang_thai_pnr | VARCHAR(20) | | Bắt buộc | Trạng thái hồ sơ: Đang giữ chỗ, Đã xuất vé, Hủy do quá hạn, Chờ đối soát |

Bảng 3.16: Bảng Vé điện tử hành khách (VE_DIEN_TU)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| so_ve_13_so | CHAR(13) | Khóa chính | Bắt buộc | Số vé điện tử cấp riêng cho từng hành khách sau khi thanh toán thành công |
| ma_pnr | CHAR(6) | Khóa ngoại | Bắt buộc | Trỏ về bảng HO_SO_DAT_CHO mà tờ vé điện tử này trực thuộc |
| ma_hanh_khach | VARCHAR(12) | Khóa ngoại | Bắt buộc | Trỏ tới bảng HANH_KHACH đứng tên sở hữu tờ vé |
| ma_ghe_chuyen | VARCHAR(16) | Khóa ngoại | Bắt buộc | Gắn tờ vé với vị trí ghế và chuyến bay tương ứng trong bảng GHE_CHUYEN_BAY |
| gia_ve_net | DECIMAL(12,0)| | Bắt buộc | Giá vận chuyển cơ bản của riêng tờ vé điện tử này (VNĐ) |
| thue_phi_san_bay| DECIMAL(12,0)| | Bắt buộc | Tổng thuế GTGT, phí phục vụ hành khách và phí soi chiếu an ninh sân bay (VNĐ) |
| hanh_ly_xach_tay| INT | | Bắt buộc | Số cân hành lý xách tay miễn cước theo hạng vé (ví dụ: 12 kg hoặc 18 kg) |
| hanh_ly_kg | INT | | Bắt buộc | Tổng số cân hành lý ký gửi được mang theo trên vé (ví dụ: 0 kg, 23 kg, 32 kg) |
| ngay_phat_hanh | DATETIME | | Bắt buộc | Thời điểm phát hành số vé điện tử sau khi nhận đủ tiền thanh toán |
| trang_thai_ve | VARCHAR(20) | | Bắt buộc | Trạng thái tờ vé: Mở chờ bay, Đã làm thủ tục, Đã bay, Đã đổi, Đã hoàn |

Bảng 3.17: Bảng Giao dịch thanh toán trực tuyến (GIAO_DICH_THANH_TOAN)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| ma_giao_dich | VARCHAR(20) | Khóa chính | Bắt buộc | Mã giao dịch thanh toán dùng để tra soát với cổng ngân hàng hoặc ví điện tử |
| ma_pnr | CHAR(6) | Khóa ngoại | Bắt buộc | Gắn giao dịch thanh toán với hồ sơ đặt chỗ cần thu tiền tại bảng HO_SO_DAT_CHO |
| phuong_thuc | VARCHAR(30) | | Bắt buộc | Phương thức: Quét mã VietQR, Thẻ nội địa NAPAS, Thẻ quốc tế, Ví MoMo/VNPay |
| ma_tham_chieu_nh| VARCHAR(50) | | Tùy chọn | Mã giao dịch trả về từ ngân hàng hoặc ví điện tử khi trừ tiền |
| so_tien | DECIMAL(12,0)| | Bắt buộc | Số tiền thực tế của giao dịch thanh toán (VNĐ) |
| thoi_gian_tt | DATETIME | | Bắt buộc | Thời điểm cổng thanh toán xử lý và gửi bản tin phản hồi kết quả |
| ket_qua_tt | VARCHAR(20) | | Bắt buộc | Kết quả xử lý: Thành công, Thất bại, Quá hạn giữ chỗ, Chờ đối soát hoàn tiền |

Bảng 3.18: Bảng Dịch vụ hành lý và bổ trợ đi kèm vé (DICH_VU_BO_TRO)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| ma_dich_vu_bt | VARCHAR(16) | Khóa chính | Bắt buộc | Mã chứng từ dịch vụ bổ trợ điện tử phát hành kèm theo vé |
| so_ve_13_so | CHAR(13) | Khóa ngoại | Bắt buộc | Gắn chứng từ dịch vụ bổ trợ với số vé điện tử của hành khách mua thêm dịch vụ |
| loai_dich_vu | NVARCHAR(50) | | Bắt buộc | Tên dịch vụ: Hành lý trả trước 23kg, Hành lý 32kg, Chọn chỗ ngồi, Suất ăn |
| so_luong_kg | INT | | Tùy chọn | Trọng lượng tính bằng kg đối với dịch vụ mua thêm hành lý ký gửi trả trước |
| don_gia | DECIMAL(12,0)| | Bắt buộc | Phí dịch vụ bổ trợ hành khách đã thanh toán (VNĐ) |
| trang_thai_dv | VARCHAR(20) | | Bắt buộc | Trạng thái sử dụng: Đã xác nhận, Đã sử dụng tại quầy, Đã hoàn phí |

Bảng 3.19: Bảng Thẻ lên máy bay điện tử (THE_LEN_MAY_BAY)

| Trường dữ liệu | Kiểu dữ liệu | Ràng buộc khóa | Bắt buộc nhập | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| ma_the_bay | VARCHAR(16) | Khóa chính | Bắt buộc | Mã quản lý thẻ lên máy bay điện tử sinh ra sau khi khách hoàn tất thủ tục |
| so_ve_13_so | CHAR(13) | Khóa ngoại | Bắt buộc | Tham chiếu duy nhất (một – một) tới tờ vé điện tử được cấp thẻ lên máy bay |
| so_thu_tu_seq | INT | | Bắt buộc | Số thứ tự khách làm thủ tục trên chuyến bay (ví dụ: SEQ 001, SEQ 042) |
| cua_ra_tau_bay | VARCHAR(10) | | Bắt buộc | Số hiệu cửa khởi hành tại nhà ga sân bay (ví dụ: Cửa 06, Cửa 12) |
| gio_len_tau_bay | DATETIME | | Bắt buộc | Thời điểm mở cửa mời khách ra tàu bay (thường trước giờ cất cánh 40 phút) |
| kenh_lam_thu_tuc| VARCHAR(20) | | Bắt buộc | Kênh làm thủ tục: Website VNA, Ứng dụng di động, Quầy Kiosk sân bay, Định danh VNeID |
| ma_vach_bcbp | VARCHAR(255) | | Bắt buộc | Chuỗi dữ liệu mã hóa chuẩn IATA BCBP trong mã vạch 2D để quét tại cổng sân bay |
| trang_thai_len_tau| VARCHAR(20)| | Bắt buộc | Trạng thái kiểm soát tại cửa sân bay: Đã làm thủ tục, Đã qua an ninh, Đã lên tàu bay |

Từ thiết kế vật lý của bảng Hồ sơ đặt chỗ (Bảng 3.15) và bảng Giao dịch thanh toán (Bảng 3.17), có thể thấy nguyên nhân kỹ thuật gây ra lỗi rớt vé khi thanh toán QR sát giờ: trường `han_giu_cho` đang tính cố định từ `ngay_tao` mà chưa có thêm cột hoặc cơ chế cộng bù vài phút chờ khi trạng thái giao dịch đang treo ở cổng ngân hàng. Bên cạnh đó, bảng Giao dịch thanh toán mới ghi nhận kết quả `Chờ đối soát hoàn tiền` trong cột `ket_qua_tt`, chưa có trường lưu mốc thời gian và trạng thái hoàn tiền từng bước để hiển thị lại cho hành khách tra cứu.

3.3.3. Phân tích giao diện thực tế kiểm chứng trên hệ thống và cơ chế phân quyền truy cập

Khảo sát trực tiếp mô hình ngoài của hệ thống trên cổng thông tin https://www.vietnamairlines.com, em chụp lại 8 màn hình giao diện tương ứng với các ca sử dụng đã phân tích (Bảng 3.20).

Bảng 3.20: Bảng tổng hợp 8 màn hình giao diện thực tế của hệ thống Vietnam Airlines

| Ký hiệu | Tên màn hình giao diện thực tế | Nhóm tác nhân sử dụng | Mục đích và chức năng nghiệp vụ chính trên màn hình |
| :---: | :--- | :--- | :--- |
| Hình 3.11 | Màn hình Trang chủ và Mua vé trực tuyến | Khách vãng lai, Hành khách, Hội viên | Chọn hành trình Khứ hồi / Một chiều, nhập điểm đi, điểm đến, ngày bay, số khách để tìm chuyến bay và giá vé |
| Hình 3.12 | Màn hình Quản lý đặt chỗ (Tra cứu mã PNR) | Hành khách, Hội viên Bông Sen Vàng | Nhập mã PNR hoặc số vé điện tử kèm Họ hành khách để xem lại hành trình và mua thêm dịch vụ |
| Hình 3.13 | Màn hình Làm thủ tục trực tuyến | Hành khách, Hội viên Bông Sen Vàng | Nhập mã PNR, Họ hành khách và Điểm khởi hành trong khung giờ mở thủ tục để chọn ghế và lấy thẻ lên máy bay |
| Hình 3.14 | Màn hình Đăng nhập Hội viên Bông Sen Vàng | Hội viên Bông Sen Vàng | Xác thực hội viên bằng Số thẻ Lotusmiles / Email / Số điện thoại và mật khẩu để tích lũy và đổi dặm thưởng |
| Hình 3.15 | Màn hình Tra cứu lịch bay và Trạng thái chuyến | Khách vãng lai, Hành khách, Nhân viên | Tra cứu giờ cất cánh, hạ cánh thực tế theo Số hiệu chuyến bay (VN...) hoặc theo Đường bay và ngày khởi hành |
| Hình 3.16 | Màn hình Đặt mua Dịch vụ bổ trợ và Hành lý | Hành khách, Hội viên Bông Sen Vàng | Mua thêm hành lý ký gửi trả trước, giữ giá tốt, chọn dịch vụ ghế Sky Sofa, suất ăn LotusDeli và phiếu quà tặng |
| Hình 3.17 | Màn hình Tự nguyện Hoàn vé và Đổi vé trực tuyến | Hành khách, Hội viên Bông Sen Vàng | Tra cứu điều kiện giá vé và gửi yêu cầu tự nguyện đổi ngày giờ bay hoặc hoàn vé trực tuyến theo hạng vé |
| Hình 3.18 | Màn hình Trung tâm trợ giúp và Ứng dụng số | Toàn bộ người dùng | Truy cập nhanh tiện ích hỗ trợ mua vé, xuất hóa đơn điện tử, tra cứu hành lý thất lạc, giấy tờ tùy thân và trợ lý ảo NEO |

Dưới đây là cách bố trí trường nhập liệu và kiểm soát thao tác của người dùng trên từng màn hình:

a. Màn hình Trang chủ và khung công cụ Mua vé trực tuyến:

[[IMAGE: assets/screenshots/ui_01_trang_chu_tim_chuyen_bay.png | Caption: Hình 3.11. Giao diện thực tế chức năng Tìm kiếm chuyến bay và Mua vé trực tuyến trên trang chủ.]]

Không gian Trang chủ chia thành thanh điều hướng cố định dọc mép trái (màu xanh cổ vịt nhận diện của Vietnam Airlines) và vùng thao tác trung tâm. Giữa màn hình là khung biểu mẫu tích hợp năm thẻ nghiệp vụ: Mua vé, Quản lý đặt chỗ, Làm thủ tục, Trạng thái chuyến bay và Tra cứu lịch bay. Khi mở thẻ Mua vé, khách chọn loại hành trình, điểm đi (Từ), điểm đến (Đến), Ngày đi và Số lượng hành khách; ngay bên dưới là dải sáu biểu tượng lối tắt dẫn thẳng vào mục Hành lý trả trước, Nâng hạng ghế, Mua sắm, Khách sạn và Tour, Bảo hiểm và Dịch vụ khác.

b. Màn hình Quản lý đặt chỗ (Tra cứu hồ sơ PNR và Vé điện tử):

[[IMAGE: assets/screenshots/ui_02_quan_ly_dat_cho_pnr.png | Caption: Hình 3.12. Giao diện thực tế chức năng Quản lý đặt chỗ – Tra cứu hồ sơ PNR và Vé điện tử.]]

Chuyển sang thẻ Quản lý đặt chỗ, khách có thể chọn tra cứu bằng Mã đặt chỗ (PNR) hoặc Số vé điện tử, điền mã kèm Họ hành khách rồi bấm Tìm kiếm. Giao diện này kiểm tra định dạng ngay trên trình duyệt: nếu khách để trống ô hoặc gõ mã PNR chưa đủ 6 ký tự, màn hình lập tức chặn lại và báo lỗi đỏ dưới ô nhập mà chưa gửi lệnh truy vấn về máy chủ. Tuy nhiên, như đã chỉ ra ở UC03, biểu mẫu này không yêu cầu thêm mã OTP xác nhận chính chủ.

c. Màn hình Làm thủ tục trực tuyến:

[[IMAGE: assets/screenshots/ui_03_lam_thu_tuc_truc_tuyen.png | Caption: Hình 3.13. Giao diện thực tế chức năng Làm thủ tục trực tuyến trên cổng thông tin Vietnam Airlines.]]

Thẻ Làm thủ tục yêu cầu ba trường bắt buộc: Mã PNR (hoặc Số vé điện tử / Số thẻ Lotusmiles), Họ hành khách và Điểm đi chọn từ danh sách sân bay. Ngay dưới nút Làm thủ tục, giao diện đặt dòng lưu ý nhắc khách về khung giờ mở cổng làm thủ tục trực tuyến để tránh trường hợp khách vào quá sớm hoặc quá sát giờ đóng quầy.

d. Màn hình Đăng nhập dành cho Hội viên Bông Sen Vàng:

[[IMAGE: assets/screenshots/ui_04_dang_nhap_bong_sen_vang.png | Caption: Hình 3.14. Giao diện thực tế màn hình Đăng nhập dành cho Hội viên Bông Sen Vàng.]]

Bấm vào mục Đăng nhập ở góc dưới thanh điều hướng bên trái, cửa sổ xác thực hội viên Bông Sen Vàng sẽ bật lên. Ô định danh đầu tiên cho phép hội viên gõ linh hoạt Số thẻ Lotusmiles, Địa chỉ thư điện tử hoặc Số điện thoại đã đăng ký, đi kèm ô Mật khẩu có biểu tượng mắt ẩn/hiện ký tự và đường dẫn lấy lại mật khẩu qua OTP khi quên.

e. Màn hình Tra cứu lịch bay và Trạng thái chuyến bay thực tế:

[[IMAGE: assets/screenshots/ui_07_lich_bay_mang_duong_bay.png | Caption: Hình 3.15. Giao diện thực tế chức năng Tra cứu trạng thái chuyến bay và lịch bay.]]

Thẻ Trạng thái chuyến bay dùng để kiểm tra giờ cất/hạ cánh thực tế và cửa ra tàu bay của các chuyến bay trong vòng 48 giờ. Để giảm thao tác gõ phím, hệ thống đã gắn sẵn tiền tố mã hãng VN trong ô Số hiệu chuyến bay (khách chỉ cần điền phần số như 213) kèm Ngày bay, hoặc cho phép tìm theo cặp sân bay đi – đến.

f. Màn hình Đặt mua Dịch vụ bổ trợ và Hành lý ký gửi trả trước:

[[IMAGE: assets/screenshots/ui_05_thong_tin_hanh_ly_bo_tro.png | Caption: Hình 3.16. Giao diện thực tế phân hệ Dịch vụ bổ trợ và Mua thêm hành lý ký gửi trả trước.]]

Các dịch vụ bổ trợ gom thành lưới thẻ hình ảnh trực quan: Mua thêm hành lý ký gửi trả trước (rẻ hơn tới 50% so với mua quá cước tại sân bay), đặt thức uống và suất ăn LotusDeli, tính năng Giữ giá tốt (trả một khoản phí nhỏ để khóa mức giá vé ưu đãi khi chưa quyết định mua ngay), cùng dịch vụ ghế Sky Sofa và phiếu quà tặng điện tử.

g. Màn hình Tự nguyện Hoàn vé và Đổi vé trực tuyến:

[[IMAGE: assets/screenshots/ui_06_dieu_kien_gia_ve_hoan_doi.png | Caption: Hình 3.17. Giao diện thực tế chức năng Tự nguyện hoàn vé và đổi vé trực tuyến.]]

Khi khách cần đổi lịch trình, màn hình Tự nguyện hoàn và đổi vé tách thành hai luồng riêng: Hoàn vé tự nguyện (hoàn trong ngày xuất vé hoặc hoàn theo điều kiện hạng vé) và Đổi vé tự nguyện. Khách phải đọc qua bảng điều kiện áp dụng cho hạng vé của mình trước khi hệ thống mở biểu mẫu gửi yêu cầu đổi ngày bay hoặc hoàn tiền về tài khoản ban đầu.

h. Màn hình Trung tâm trợ giúp và Liên kết nhanh dịch vụ số:

[[IMAGE: assets/screenshots/ui_08_ung_dung_so_tro_giup.png | Caption: Hình 3.18. Giao diện thực tế Trung tâm trợ giúp và tích hợp Trợ lý ảo NEO.]]

Trung tâm trợ giúp chia các câu hỏi và tiện ích tra cứu thành sáu nhóm thẻ: Thông tin chuyến bay, Mua vé và Xuất hóa đơn, Dịch vụ bổ trợ và Dịch vụ đặc biệt, Hành lý (tra cứu hành lý thất lạc), Làm thủ tục và Giấy tờ tùy thân, Đổi và Hoàn vé. Ngoài ra, góc dưới thanh công cụ bên trái luôn ghim nút gọi trợ lý ảo NEO để trả lời tự động các thắc mắc thường gặp 24/7.

Quyền truy cập vào 8 màn hình giao diện và 9 bảng cơ sở dữ liệu trên được kiểm soát theo vai trò người dùng (RBAC) như tổng hợp tại Bảng 3.21:

Bảng 3.21: Ma trận phân quyền truy cập hệ thống theo vai trò người dùng (RBAC)

| Chức năng nghiệp vụ và Tài nguyên dữ liệu | Khách vãng lai | Hành khách (Có mã PNR) | Hội viên Bông Sen Vàng | Nhân viên bán vé và Mặt đất | Quản trị viên hệ thống |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tra cứu lịch bay, xem giá vé và điều kiện hạng vé | Xem công khai | Xem công khai | Xem công khai | Xem toàn bộ | Toàn quyền quản lý |
| Khởi tạo đặt chỗ mới và thanh toán trực tuyến | Tạo mới hồ sơ | Tạo mới hồ sơ | Tạo mới hồ sơ | Tạo hộ hành khách | Giám sát vận hành |
| Xem chi tiết hồ sơ đặt chỗ PNR và tải vé điện tử | Không được phép | Chỉ hồ sơ của mình | Chỉ hồ sơ của mình | Tra cứu theo chuyến | Toàn quyền quản lý |
| Mua thêm hành lý, chọn ghế ngồi, đổi chuyến bay | Không được phép | Sửa hồ sơ của mình | Sửa hồ sơ của mình | Xử lý tại quầy / Tổng đài | Toàn quyền quản lý |
| Làm thủ tục trực tuyến và lấy thẻ lên máy bay | Không được phép | Trong giờ mở thủ tục | Trong giờ mở thủ tục (Ưu tiên ghế) | Làm thủ tục tại sân bay | Giám sát vận hành |
| Tích lũy dặm, quy đổi dặm thưởng lấy vé máy bay | Không được phép | Không được phép | Có xác thực mã OTP | Hỗ trợ tra cứu | Cấu hình quy tắc |
| Cấu hình lịch bay, kho ghế mở bán và đối soát tiền | Không được phép | Không được phép | Không được phép | Xem báo cáo ca trực | Toàn quyền điều hành |

Trong Bảng 3.21, quyền "Mua thêm hành lý, chọn ghế ngồi, đổi chuyến bay" (dòng thứ 4) đang mở cho tác nhân Hành khách sửa trực tiếp hồ sơ chỉ bằng Mã PNR và Họ tên, trong khi quyền đổi dặm của Hội viên Bông Sen Vàng ở dòng thứ 6 lại khóa chặt bằng mã OTP. Sự thiếu nhất quán này khiến bất kỳ ai biết mã PNR và họ khách đều có thể can thiệp vào chỗ ngồi hoặc lịch trình của người khác mà chủ vé không nhận được tin nhắn xác nhận.

<div style="page-break-after: always;"></div>

IV. ĐÁNH GIÁ THỰC TRẠNG, XÂY DỰNG CHIẾN LƯỢC PHÁT TRIỂN VÀ ĐỀ XUẤT GIẢI PHÁP NÂNG CẤP, HOÀN THIỆN HỆ THỐNG

4.1. Đánh giá hiệu quả, chức năng, mức độ phủ sóng và khảo sát mức độ hài lòng của người sử dụng

4.1.1. Đánh giá vai trò, mức độ phủ sóng, hiệu quả vận hành và tám đặc tính chất lượng thông tin

Hơn 40% tổng sản lượng vé bán ra của Vietnam Airlines hiện đi qua trang thông tin điện tử https://www.vietnamairlines.com và ứng dụng di động của hãng, kết nối trực tiếp 22 cảng hàng không nội địa với hơn 30 sân bay quốc tế suốt 24/7. Riêng tại ba đầu mối Nội Bài, Tân Sơn Nhất và Đà Nẵng, tỷ lệ hành khách tự làm thủ tục trực tuyến trước khi ra sân bay đã vượt mốc 55%, giúp hãng giảm đáng kể số quầy thủ tục vật lý phải mở đồng thời và tiết kiệm chi phí in ấn thẻ giấy mỗi năm.

Đối chiếu hoạt động thực tế của hệ thống với tám đặc tính chất lượng thông tin đã trình bày ở Phần II, em tổng hợp các mặt làm được và hạn chế tại Bảng 4.1:

Bảng 4.1: Đánh giá thực trạng hệ thống đặt vé và làm thủ tục Vietnam Airlines theo 8 đặc tính chất lượng thông tin

| STT | Đặc tính thông tin | Biểu hiện đạt được trong thực tế tại Vietnam Airlines | Hạn chế còn tồn tại cần khắc phục | Mức đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Tính chính xác | Giá vé, thuế phí sân bay, giờ bay và tên hành khách trên vé điện tử khớp với biểu giá công bố | Khi đổi loại tàu bay sát giờ khởi hành, vị trí ghế khách chọn trước đôi khi bị xếp lệch sang hàng khác | Tốt |
| 2 | Tính đầy đủ | Hiển thị rõ giá vé cơ bản, thuế GTGT, phí sân bay, hạn mức hành lý và điều kiện hoàn đổi vé | Quy trình hoàn tiền trên ứng dụng chưa có mục theo dõi tiến độ xử lý từng bước | Khá - Tốt |
| 3 | Tính kịp thời | Ngày thường, mã PNR và vé điện tử gửi về thư điện tử sau 5 – 10 giây kể từ lúc thanh toán; thông báo đổi cửa ra tàu bay cập nhật nhanh | Dịp cao điểm Tết hoặc khuyến mãi lớn, phản hồi tra cứu chậm; xác nhận trừ tiền QR đôi khi trả về trễ sau mốc giữ chỗ 15 phút | Khá |
| 4 | Tính phù hợp | Lọc đúng chuyến bay theo hành trình khách chọn; tài khoản Bông Sen Vàng hiển thị đúng hạng thẻ, số dặm và quyền ưu tiên | Các mục gợi ý mua thêm bảo hiểm, dịch vụ đi kèm xuất hiện nhiều lần trong luồng đặt vé, dễ gây bấm nhầm | Khá - Tốt |
| 5 | Tính dễ tiếp cận | Hoạt động trên máy tính, điện thoại, máy tính bảng và quầy Kiosk sân bay; hỗ trợ tiếng Việt cùng nhiều ngôn ngữ quốc tế | Luồng đặt vé qua nhiều bước xác nhận; bảng điều kiện hoàn đổi vé trên màn hình điện thoại còn nhỏ | Khá |
| 6 | Tính an toàn và bảo mật | Đường truyền mã hóa HTTPS, thanh toán thẻ có xác thực bảo mật, đăng nhập hội viên và đổi dặm đều yêu cầu mã OTP | Mục Quản lý đặt chỗ và Làm thủ tục chỉ yêu cầu Mã PNR kèm Họ hành khách, chưa có lớp OTP thứ hai để bảo vệ thông tin | Khá |
| 7 | Tính có thể kiểm chứng | Mỗi vé gắn với mã PNR, số vé điện tử và hóa đơn điện tử có mã của cơ quan thuế | Khách chưa thể tự tra cứu tiến độ xử lý các giao dịch thanh toán lỗi trên ứng dụng mà phải gọi tổng đài | Tốt |
| 8 | Tính khách quan | Thứ tự hiển thị chuyến bay và mức giá mở bán tự động dựa trên quỹ ghế trống thực tế trong cơ sở dữ liệu | Khi hạng vé giá rẻ vừa bán hết, màn hình chưa báo rõ số ghế vừa hết nên khách dễ hiểu nhầm hệ thống tự tăng giá | Tốt |

4.1.2. Minh chứng khảo sát ý kiến 30 người sử dụng về sáu nghiệp vụ cốt lõi và năm thành phần hệ thống

Bên cạnh quá trình tự thao tác và kiểm thử trên giao diện, em đã khảo sát 30 người từng trực tiếp đặt vé, thanh toán và làm thủ tục trên hệ thống trong đầu năm 2026 (bảng phân phối tần số và toàn bộ 30 phiếu từ KS001 đến KS030 được trình bày tại Phụ lục). Trong 30 người trả lời có 13 hành khách đi công tác (43,3%), 11 hành khách đi du lịch, thăm thân (36,7%), 4 hội viên Bông Sen Vàng (13,3%) và 2 nhân viên bán vé, phục vụ mặt đất (6,7%).

Phiếu hỏi chấm điểm theo thang Likert từ 1 (Rất không hài lòng) đến 5 (Rất hài lòng) trên 6 chức năng nghiệp vụ và 15 tiêu chí thuộc 5 thành phần hệ thống thông tin. Kết quả tổng hợp từ 30 phiếu như sau:

Bảng 4.2: Kết quả khảo sát mức độ hài lòng của 30 người sử dụng theo 6 chức năng nghiệp vụ cốt lõi

| Mã nghiệp vụ | Chức năng nghiệp vụ khảo sát | Điểm TB (Thang 5,0) | Tỷ lệ Hài lòng (Mức 4 & 5) | Điểm thuận lợi ghi nhận từ người dùng | Vướng mắc thường gặp trong thực tế |
| :---: | :--- | :---: | :---: | :--- | :--- |
| NV1 | Đăng nhập và quản lý tài khoản Hội viên Bông Sen Vàng | 3,73 | 66,7% | Đăng nhập bằng số thẻ, thư điện tử hoặc số điện thoại; tự điền thông tin khách khi mua vé | Phiên đăng nhập trên trình duyệt web đôi khi tự thoát sớm khi mở so sánh giờ bay một lúc |
| NV2 | Tìm kiếm chuyến bay và Đặt vé trực tuyến | 3,90 | 80,0% | Bảng giá vé theo khung giờ rõ ràng; giữ chỗ tạm thời 15 phút giúp yên tâm nhập liệu | Tốc độ tải trang chậm vào đợt mở bán vé Tết hoặc khuyến mãi; hạng vé rẻ nhanh hết chỗ |
| NV3 | Kê khai, cập nhật thông tin hành khách và mua hành lý | 3,70 | 73,3% | Biểu mẫu bắt lỗi định dạng giấy tờ tốt; mua thêm hành lý ký gửi trên ứng dụng rẻ và tiện | Nhiều mục gợi ý mua thêm bảo hiểm đi kèm; khách gõ nhầm tên đệm không tự sửa trên web được |
| NV4 | Thanh toán trực tuyến đa kênh và nhận vé điện tử | 3,70 | 73,3% | Hỗ trợ quét mã QR ngân hàng, thẻ nội địa, thẻ quốc tế, ví điện tử; ngày thường nhận vé nhanh | Quét mã QR sát lúc hết hạn giữ chỗ 15 phút đôi khi bị trừ tiền nhưng hệ thống báo hết hạn |
| NV5 | Làm thủ tục trực tuyến và phục vụ vận chuyển | 3,70 | 70,0% | Mở làm thủ tục từ 24h đến 1h trước giờ bay; nhận thẻ lên máy bay điện tử và kết nối VNeID tiện lợi | Đổi máy bay khác sát giờ khởi hành làm ghế chọn trước của gia đình bị xếp tách ra |
| NV6 | Quản lý hồ sơ đặt chỗ, tự đổi chuyến và hoàn vé | 3,10 | 50,0% | Tra cứu nhanh hành trình, trạng thái vé điện tử và tải hóa đơn bằng mã đặt chỗ | Tự đổi giờ bay, hoàn vé trên ứng dụng còn bất tiện; tra cứu mã đặt chỗ chưa có OTP bảo vệ |

Bảng 4.3: Thống kê điểm trung bình chi tiết 15 tiêu chí khảo sát theo 5 thành phần hệ thống thông tin (N = 30)

| Mã tiêu chí | Thuộc thành phần HTTT | Nội dung tiêu chí khảo sát cụ thể | Điểm TB (Thang 5,0) | Tỷ lệ Hài lòng (Mức 4 & 5) | Đánh giá thực tế |
| :---: | :--- | :--- | :---: | :---: | :---: |
| PC1 | Phần cứng | Cụm máy chủ đáp ứng nhanh khi truy cập tìm chuyến bay vào ngày thường | 3,87 | 80,0% | Tốt |
| PC2 | Phần cứng | Quầy làm thủ tục tự động (Kiosk) tại sân bay có màn hình nhạy và in thẻ nhanh | 3,73 | 73,3% | Khá - Tốt |
| PC3 | Phần cứng | Thiết bị quét mã vạch và nhận diện khuôn mặt tại cửa sân bay hoạt động ổn định | 3,73 | 73,3% | Khá - Tốt |
| PM1 | Phần mềm | Giao diện tìm kiếm chuyến bay và chọn hạng giá vé trên Web và Ứng dụng rõ ràng, dễ hiểu | 3,67 | 73,3% | Khá - Tốt |
| PM2 | Phần mềm | Thao tác chọn ghế ngồi trên sơ đồ tàu bay khi làm thủ tục trực tuyến mượt mà | 3,73 | 73,3% | Khá - Tốt |
| PM3 | Phần mềm | Chức năng tự đổi chuyến bay, đổi ngày bay hoặc hoàn vé trực tuyến dễ thực hiện | 3,10 | 46,7% | Cần cải thiện |
| DL1 | Cơ sở dữ liệu | Dữ liệu lịch bay, số ghế trống và tổng số tiền vé cộng thuế phí hiển thị chính xác | 4,07 | 83,3% | Rất tốt |
| DL2 | Cơ sở dữ liệu | Mã đặt chỗ PNR và Vé điện tử cấp nhanh và khớp thông tin giữa các kênh | 3,87 | 76,7% | Tốt |
| DL3 | Cơ sở dữ liệu | Dữ liệu tài khoản và dặm thưởng Hội viên Bông Sen Vàng cập nhật chính xác | 3,80 | 70,0% | Tốt |
| MC1 | Mạng viễn thông | Đường truyền truy cập ổn định ngay cả vào dịp mở bán vé Tết hoặc khuyến mãi lớn | 3,43 | 63,3% | Cần cải thiện |
| MC2 | Mạng viễn thông | Kết nối thanh toán giữa ứng dụng VNA với mã QR ngân hàng và ví điện tử nhanh chóng | 3,67 | 73,3% | Khá - Tốt |
| MC3 | Mạng viễn thông | Kết nối xác thực giấy tờ và sinh trắc học liên thông với ứng dụng VNeID thuận lợi | 3,60 | 60,0% | Khá |
| CN1 | Con người & Quy trình | Quy định thời gian giữ chỗ thanh toán và khung giờ mở làm thủ tục (24h – 1h) hợp lý | 3,70 | 70,0% | Khá - Tốt |
| CN2 | Con người & Quy trình | Các hướng dẫn nghiệp vụ và cảnh báo bảo mật mã đặt chỗ trên màn hình dễ hiểu | 3,43 | 60,0% | Khá |
| CN3 | Con người & Quy trình | Tốc độ hỗ trợ xử lý sự cố thanh toán và thời gian hoàn tiền vé đáp ứng kỳ vọng | 3,23 | 50,0% | Cần cải thiện |

Bảng 4.4: Tổng hợp kết quả khảo sát 30 người dùng theo 5 thành phần cấu thành hệ thống

| Nhóm thành phần HTTT | Điểm trung bình (Thang 5,0) | Tỷ lệ đánh giá Tốt (Mức 4 & 5) | Tỷ lệ phàn nàn (Mức 1 & 2) | Nhận xét trọng tâm từ người sử dụng thực tế |
| :--- | :---: | :---: | :---: | :--- |
| 1. Hạ tầng phần cứng và thiết bị sân bay | 3,78 / 5,0 | 75,6% | 4,4% | Máy chủ ngày thường và thiết bị sân bay vận hành ổn định; giờ cao điểm sáng đôi khi máy in thẻ hết giấy |
| 2. Phần mềm ứng dụng (Web và App đặt vé) | 3,50 / 5,0 | 64,4% | 13,3% | Giao diện đặt vé dễ nhìn, nhưng tính năng tự đổi giờ bay và hoàn vé trên ứng dụng còn bất tiện |
| 3. Cơ sở dữ liệu (Lịch bay, PNR, Vé, Dặm) | 3,91 / 5,0 | 76,7% | 1,1% | Điểm cao nhất nhờ dữ liệu ghế và giá vé chính xác; đôi lúc còn trễ đồng bộ khi thanh toán sát hạn giữ chỗ |
| 4. Mạng viễn thông và kết nối liên thông | 3,57 / 5,0 | 65,6% | 8,9% | Ngày thường kết nối nhanh, nhưng đợt mở bán vé Tết hoặc khuyến mãi vẫn hay bị chậm và nghẽn mạng |
| 5. Con người và quy trình hỗ trợ nghiệp vụ | 3,46 / 5,0 | 60,0% | 13,3% | Quy trình ngày thường rõ ràng, nhưng gọi tổng đài giờ cao điểm phải chờ lâu và hoàn tiền vé mất hơn một tuần |
| Trung bình chung toàn hệ thống (N = 30) | 3,64 / 5,0 | 68,4% | 8,2% | Đạt mức Khá - Tốt; các vướng mắc tập trung ở khâu tự đổi/hoàn vé, nghẽn mạng dịp Tết và chờ hoàn tiền |

[[IMAGE: assets/diagrams/diag_3_1_bieu_do_khao_sat.png | Caption: Hình 4.1. Biểu đồ kết quả khảo sát đánh giá 5 thành phần hệ thống thông tin (Thang điểm 5, N = 30).]]

Nhìn vào số liệu tổng hợp từ 30 phiếu khảo sát, có sự chênh lệch khá rõ giữa khâu mua vé mới và khâu xử lý thay đổi sau bán hàng. Ở bước tìm chuyến bay và xem giá vé, 25/30 người (83,3%) đánh giá tốt về độ chính xác của lịch bay và tổng tiền hiển thị (tiêu chí DL1 đạt 4,07 điểm). Ngược lại, khi hành khách có việc đột xuất cần tự đổi giờ bay hoặc hoàn vé trên ứng dụng (tiêu chí PM3 và nghiệp vụ NV6), chỉ có một nửa số người khảo sát hài lòng, kéo điểm trung bình xuống mức thấp nhất là 3,10 điểm. Ý kiến phản hồi tại các phiếu KS003, KS004 và KS014 đều phản ánh điểm chung này: khi mua vé mới theo đúng trình tự thì hệ thống xử lý rất nhanh, nhưng khi khách muốn tự đổi giờ bay trên điện thoại hoặc gặp sự cố trừ tiền lúc quét mã QR sát hạn giữ chỗ thì ứng dụng chưa tự giải quyết được ngay mà khách vẫn phải gọi tổng đài và chờ hoàn tiền khá lâu.

4.2. Đánh giá điểm mạnh, điểm yếu, mức độ phù hợp với doanh nghiệp và nhận diện rủi ro

4.2.1. Đánh giá những mặt đã làm được, chưa làm được và sự phù hợp của hệ thống với doanh nghiệp

a. Những mặt hệ thống đã vận hành tốt:

Đối với hành khách đặt vé và đi lại theo lịch trình cố định, hệ thống đã nối thông suốt các bước từ chọn chuyến bay, giữ chỗ tạo mã PNR, thanh toán trực tuyến, xuất vé điện tử đầu số 738 cho đến làm thủ tục trực tuyến và qua cửa kiểm soát tại sân bay. Nền tảng giúp luồng giao dịch này chạy ổn định là cơ sở dữ liệu 9 bảng đạt dạng chuẩn 3 (đã phân tích ở mục 3.3.2) cùng cơ chế chuyển trạng thái `trang_thai_ghe` sang tạm khóa ngay khi tạo mã PNR, giữ cho hơn 100 đường bay mở bán cùng lúc trên web, ứng dụng và đại lý mà không xảy ra lỗi bán trùng một ghế cho hai người.

b. Nhận định điểm nghẽn kỹ thuật và quy trình nhìn từ cấu trúc hệ thống:

Khi đối chiếu những ý kiến phàn nàn trong 30 phiếu khảo sát với cấu trúc cơ sở dữ liệu và giao diện ở Phần III, em nhận thấy các trục trặc hiện tại không nằm ở lõi lưu trữ mà phát sinh tại điểm tiếp giáp giữa các phân hệ:

Trước hết là độ lệch nhịp giữa bộ đếm giữ chỗ của bảng `HO_SO_DAT_CHO` (Bảng 3.15) và bảng `GIAO_DICH_THANH_TOAN` (Bảng 3.17). Trường `han_giu_cho` hiện cộng cứng 15 phút kể từ `ngay_tao` mà chưa tính đến trường hợp ở phút cuối khách đang thực hiện chuyển khoản trên ứng dụng ngân hàng. Nếu bản tin xác nhận từ ngân hàng trả về muộn vài chục giây sau mốc 15 phút thì mã PNR đã tự chuyển sang hủy, dẫn tới việc khách bị trừ tiền nhưng hệ thống không xuất vé. Cùng ở tầng phần mềm và cơ sở dữ liệu, ứng dụng di động chưa tích hợp bộ tính chênh lệch giá vé tự động cho nhiều loại vé khứ hồi hoặc vé khuyến mãi, đồng thời thuật toán xếp lại ghế khi đổi máy bay chưa lấy cột `dac_tinh_vi_tri` trong bảng `GHE_CHUYEN_BAY` (Bảng 3.12) làm điều kiện ràng buộc nên dễ làm tách chỗ ngồi của các gia đình đi cùng nhau.

Ở phía hạ tầng mạng và thiết bị sân bay, hệ thống hiện dùng chung cụm máy chủ cho cả luồng tra cứu lẫn luồng thanh toán. Khi lượng người vào tìm vé Tết hoặc vé khuyến mãi tăng đột biến và thiếu hàng đợi điều tiết, trang web dễ bị chậm và báo lỗi kết nối. Tại nhà ga sân bay, máy in thẻ tự động (Kiosk) mới tập trung ở Nội Bài, Tân Sơn Nhất, Đà Nẵng và chưa có cảm biến tự báo về máy trạm khi sắp hết giấy in nhiệt. Riêng về quy trình bảo mật, như đã chỉ ra ở ma trận phân quyền Bảng 3.21, màn hình Quản lý đặt chỗ đang cho phép xem thông tin cá nhân và đổi ghế chỉ bằng Mã PNR và Họ tên mà thiếu lớp xác thực OTP thứ hai.

c. Bài toán giữ nguyên để nâng cấp hay thay thế mới hệ thống:

Với điểm khảo sát thành phần Cơ sở dữ liệu đạt 3,91/5,0 và Phần cứng đạt 3,78/5,0, hệ thống quản lý kho ghế và phát hành vé điện tử hiện tại của Vietnam Airlines vẫn đáp ứng tốt mô hình bốn khối nghiệp vụ của hãng cũng như chuẩn kết nối liên minh SkyTeam. Thay thế mới toàn bộ hệ thống sẽ tốn chi phí rất lớn và tiềm ẩn nguy cơ gián đoạn khai thác bay trong thời gian chuyển đổi dữ liệu. Tuy nhiên, nếu giữ lại lõi cũ thì các tính năng nâng cấp gắn thêm ở bên ngoài vẫn phải tương thích với giao diện lập trình của hệ thống đặt chỗ trung tâm. Do đó, phương án phù hợp nhất cho giai đoạn 2026 – 2030 là giữ nguyên nền tảng cơ sở dữ liệu lõi và nâng cấp bổ sung các mô-đun xử lý đối soát thanh toán, tự động tính tiền đổi vé, phòng chờ ảo và xác thực bảo mật OTP.

4.2.2. Nhận diện và đánh giá mức độ rủi ro dữ liệu, bảo mật và vận hành của hệ thống

Từ các điểm nghẽn trên, em lọc ra 5 rủi ro vận hành lớn nhất (R1 đến R5) và chấm điểm theo Khả năng xảy ra (P, thang 1 – 5) nhân với Mức độ tác động (I, thang 1 – 5). Ma trận rủi ro 5x5 tại Hình 4.2 và Bảng 4.5 dưới đây xếp hạng các rủi ro này theo mức điểm từ cao xuống thấp:

[[IMAGE: assets/diagrams/diag_3_2_ma_tran_rui_ro.png | Caption: Hình 4.2. Ma trận đánh giá rủi ro dữ liệu, bảo mật và vận hành hệ thống 5x5.]]

Bảng 4.5: Bảng phân tích chi tiết 5 rủi ro trọng yếu của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines

| Mã rủi ro | Tên rủi ro nhận diện | Thành phần liên quan | Khả năng (P) | Tác động (I) | Điểm (P x I) | Nguyên nhân kỹ thuật, quản trị và Hậu quả thực tế |
| :---: | :--- | :--- | :---: :---: | :---: | :--- |
| R1 | Khấu trừ tiền thành công nhưng chậm xuất vé điện tử (Treo giao dịch) | Cơ sở dữ liệu, Phần mềm và Mạng kết nối ngân hàng | 4 (Cao) | 4 (Nghiêm trọng) | 16 (Mức Cao) | Nguyên nhân: Trường `han_giu_cho` đóng cứng 15 phút, tự hủy PNR trước khi bản tin ngân hàng trả về ở phút cuối.<br>Hậu quả: Khách bị trừ tiền nhưng chưa có vé, phải chờ đối soát hoàn tiền nhiều ngày |
| R4 | Nghẽn mạch và chậm phản hồi vào dịp cao điểm săn vé Tết, khuyến mãi | Phần cứng máy chủ và Mạng viễn thông | 4 (Cao) | 3 (Trung bình) | 12 (Khá cao) | Nguyên nhân: Chưa tách cụm máy chủ tra cứu với cụm thanh toán; thiếu phòng chờ ảo điều tiết lượt truy cập.<br>Hậu quả: Khách mua vé thực bị ngắt kết nối giữa chừng, phải nhập lại thông tin từ đầu |
| R2 | Lệch sơ đồ ghế ngồi đã chọn khi thay đổi loại tàu bay khai thác | Cơ sở dữ liệu và Quy trình điều hành bay | 3 (Trung bình) | 4 (Nghiêm trọng) | 12 (Khá cao) | Nguyên nhân: Thuật toán xếp lại chỗ chỉ ánh xạ theo số thứ tự ghế mà chưa đối chiếu cột `dac_tinh_vi_tri`.<br>Hậu quả: Gia đình bị tách chỗ ngồi hoặc khách mất vị trí ghế đã chọn trước |
| R5 | Rò rỉ thông tin hành trình và bị can thiệp trái phép do lộ mã đặt chỗ PNR | Con người, Phần mềm và Bảo mật dữ liệu | 2 (Thấp) | 5 (Thảm họa / Pháp lý) | 10 (Trung bình) | Nguyên nhân: Khách đăng ảnh thẻ bay lộ mã PNR và Họ tên; màn hình tra cứu chưa bắt buộc xác thực OTP lớp thứ hai.<br>Hậu quả: Người lạ xem được thông tin cá nhân, tự ý đổi ghế hoặc hủy làm thủ tục của khách |
| R3 | Gián đoạn kết nối xác thực sinh trắc học VNeID và thiết bị sân bay | Phần cứng sân bay và Đường truyền mạng | 3 (Trung bình) | 3 (Trung bình) | 9 (Trung bình) | Nguyên nhân: Đường truyền hoặc camera cổng quét tại sân bay đôi lúc nhận diện chậm, máy Kiosk hết giấy in nhiệt.<br>Hậu quả: Khách phải quay lại xếp hàng kiểm tra giấy tờ thủ công vào giờ cao điểm |

4.3. Xây dựng chiến lược phát triển và đề xuất giải pháp nâng cấp, hoàn thiện hệ thống

4.3.1. Chiến lược phát triển tổng thể và giải pháp hoàn thiện mô hình kiến trúc hệ thống

Để xử lý 5 rủi ro ở Bảng 4.5 mà không làm xáo trộn cơ sở dữ liệu lõi, kiến trúc nâng cấp giai đoạn 2026 – 2030 (Hình 4.3) tập trung vào ba thay đổi kỹ thuật: (1) Tách riêng cụm máy chủ tra cứu lịch bay khỏi cụm máy chủ thanh toán trên đám mây lai, đặt Phòng chờ ảo ở phía trước để giảm nghẽn mạng dịp Tết; (2) Bổ sung mô-đun đối soát thanh toán hai chiều và bộ tính chênh lệch giá vé tự động để xử lý nhanh các giao dịch phát sinh; (3) Thêm lớp xác thực OTP cho hồ sơ PNR để bảo vệ dữ liệu cá nhân của hành khách.

[[IMAGE: assets/diagrams/diag_4_1_kien_truc_nang_cap.png | Caption: Hình 4.3. Mô hình kiến trúc giải pháp nâng cấp đồng bộ 5 thành phần hệ thống giai đoạn 2026 – 2030.]]

4.3.2. Đề xuất giải pháp nâng cấp chi tiết về phần mềm, cơ sở dữ liệu, phần cứng và quy trình nghiệp vụ

a. Nâng cấp Cơ sở dữ liệu, cơ chế đối soát thanh toán 30 giây và phân tầng bảo mật PNR (Xử lý R1, R2, R5):

Đây là nhóm can thiệp trực tiếp vào các bảng dữ liệu vật lý đã phân tích ở mục 3.3.2:
- Cơ chế đệm giữ chỗ 5 phút có điều kiện và truy vấn đối soát chủ động sau 30 giây (Xử lý R1): Khi hành khách bấm chuyển sang màn hình quét mã VietQR hoặc cổng thẻ và hệ thống đã sinh bản ghi `ma_giao_dich` trong bảng `GIAO_DICH_THANH_TOAN` ở phút thứ 11 – 15, trường `han_giu_cho` của bảng `HO_SO_DAT_CHO` sẽ tự cộng thêm 5 phút đệm. Để ngăn việc lợi dụng bấm tải lại màn hình thanh toán liên tục nhằm giữ ghế ảo, mỗi mã PNR chỉ được cộng đệm đúng 1 lần duy nhất. Nếu sau 30 giây kể từ lúc khách xác nhận đã chuyển khoản mà máy chủ Vietnam Airlines chưa nhận được bản tin từ ngân hàng, hệ thống sẽ chủ động gọi API truy vấn ngược sang cổng thanh toán để kiểm tra trạng thái thực tế: nếu tiền đã trừ thì lập tức cấp số vé `so_ve_13_so`, còn nếu chuyến bay đã hết ghế thì tự động kích hoạt lệnh hoàn tiền trong vòng 24 giờ.
- Thuật toán xếp lại ghế theo thuộc tính vị trí và thứ tự ưu tiên (Xử lý R2): Khi đổi loại tàu bay khai thác, hệ thống căn cứ vào cột `dac_tinh_vi_tri` (Cửa sổ, Lối đi, Giữa) của bảng `GHE_CHUYEN_BAY` và nhóm các hành khách có cùng `ma_pnr` để xếp ngồi liền kề nhau. Trong trường hợp đổi từ tàu thân rộng xuống tàu thân hẹp làm tổng số ghế cửa sổ giảm xuống không đủ chia cho mọi khách, thuật toán sẽ ưu tiên giữ vị trí cho khách đi cùng trẻ em (kiểm tra qua cột `ngay_sinh` bảng `HANH_KHACH`) và hội viên có `hang_the` Bạch Kim, Vàng (bảng `HOI_VIEN_BSV`). Những hành khách đã trả tiền mua chỗ ngồi trước nhưng bị đổi sang vị trí khác sẽ được hệ thống tự động chuyển cột `trang_thai_dv` trong bảng `DICH_VU_BO_TRO` sang hoàn trả phí chọn ghế.
- Bảo mật hai tầng cho hồ sơ PNR (Xử lý R5): Nếu bắt nhập mã OTP ngay từ bước gõ mã PNR, những hành khách đang vội ở sân bay hoặc khách quốc tế chuyển vùng không nhận được tin nhắn SMS sẽ gặp bất tiện. Vì vậy, em đề xuất chia làm hai tầng: khi nhập Mã PNR và Họ tên, màn hình chỉ hiển thị giờ khởi hành, cửa ra tàu bay (`cua_ra_tau_bay`) và che một phần số giấy tờ tùy thân (dạng `001099xxx456`). Chỉ khi người dùng bấm xem toàn bộ thông tin cá nhân, tải vé PDF, đổi ghế hoặc hủy làm thủ tục thì hệ thống mới bắt buộc nhập mã OTP 6 chữ số gửi về `so_dien_thoai` hoặc `email` gốc trong bảng `HANH_KHACH`.

b. Nâng cấp Phần mềm ứng dụng (Giao diện 4 bước, Phòng chờ ảo và tự động tính tiền đổi/hoàn vé):

Luồng đặt vé trên web và ứng dụng rút xuống 4 bước, báo tổng tiền gồm thuế phí ngay từ màn hình chọn giờ bay và gom các dịch vụ bảo hiểm, xe đưa đón vào một mục tùy chọn chung để hành khách không bấm nhầm. Để khắc phục điểm hạn chế ở tính năng đổi và hoàn vé (PM3 và NV6), ứng dụng tích hợp mô-đun đọc tự động điều kiện giá vé của từng mã PNR: khi khách chọn đổi chuyến hoặc hoàn vé, màn hình tự trừ phí hoàn/đổi, cộng chênh lệch giá vé ngày mới và báo rõ số tiền cần trả thêm (hoặc số tiền được nhận lại) để khách bấm xác nhận ngay trên điện thoại.

Vào đợt mở bán vé Tết hoặc khuyến mãi lớn, thay vì để người dùng nhấn tải lại trang liên tục gây nghẽn máy chủ, phần mềm kích hoạt Phòng chờ xếp hàng ảo (Virtual Waiting Room): khi lượng truy cập vượt ngưỡng, khách vào sau được cấp số thứ tự và đồng hồ đếm ngược thời gian chờ trên màn hình, giữ nguyên phiên làm việc cho tới lượt vào chọn ghế.

c. Mở rộng Phần cứng máy chủ đám mây lai và thiết bị Kiosk sân bay (Xử lý R3, R4):

Trên tầng máy chủ, hãng tách cụm máy chủ tra cứu lịch bay ra khỏi cụm máy chủ thanh toán và cài đặt co giãn tự động trên đám mây lai: khi mức tải của cụm tra cứu tăng cao, hệ thống tự động mở thêm các máy chủ phụ để giữ cho luồng trả tiền của khách đang thanh toán không bị ảnh hưởng bởi lượng người vào xem giá.

Dưới sân bay, hãng bổ sung thêm quầy Kiosk làm thủ tục tự động tại các sân bay địa phương có lượng khách lớn, đồng thời lắp cảm biến vào hộc chứa giấy của các máy Kiosk hiện có để tự động gửi cảnh báo về máy trực kỹ thuật ngay khi cuộn giấy in nhiệt sắp hết. Tại các cổng quét khuôn mặt VNeID ở sân bay, bộ phận kỹ thuật điều chỉnh lại góc camera và che chắn ánh sáng ngược để thiết bị nhận diện khuôn mặt nhanh và ổn định hơn.

d. Nâng cấp hạ tầng Mạng viễn thông:

Mỗi cảng hàng không duy trì hai đường cáp quang của hai nhà mạng độc lập kèm kết nối 5G dự phòng cho dàn máy Kiosk và cổng sinh trắc học để không bị gián đoạn khi có sự cố đường truyền; trên kênh web thì đẩy dữ liệu tĩnh lên mạng phân phối nội dung CDN và bật tường lửa chặn các công cụ tự động quét giá vé (Bot).

e. Hoàn thiện quy trình nghiệp vụ và thay đổi phân cấp phân quyền:

Hệ thống nối trực tiếp dữ liệu giao dịch lỗi giữa Khối Công nghệ thông tin, Khối Tài chính – Kế toán và Tổng đài chăm sóc khách hàng. Ngay khi phát sinh giao dịch trừ tiền lỗi, ứng dụng hiển thị mục theo dõi tiến độ hoàn tiền gồm 3 bước (Đã ghi nhận sự cố – Đang xử lý hoàn tiền – Ngân hàng đã hoàn tiền) để khách chủ động nắm được thông tin mà không phải gọi tổng đài nhiều lần. Dưới mỗi ảnh Thẻ lên máy bay điện tử cũng in sẵn dòng lưu ý nhắc hành khách che Mã PNR và mã vạch trước khi đăng ảnh lên mạng xã hội.

4.3.3. Lộ trình triển khai ba giai đoạn và các chỉ tiêu đánh giá hiệu quả kỳ vọng

Để phân bổ kinh phí hợp lý và không làm xáo trộn hoạt động bán vé hàng ngày, em đề xuất chia lộ trình nâng cấp thành 3 giai đoạn từ năm 2026 đến năm 2030 tại Bảng 4.6:

Bảng 4.6: Lộ trình triển khai 3 giai đoạn và các chỉ tiêu hiệu quả kỳ vọng sau khi nâng cấp hệ thống

| Giai đoạn triển khai | Thời gian thực hiện | Các hạng mục công việc trọng tâm theo 5 thành phần | Chỉ tiêu đo lường hiệu quả kỳ vọng (KPIs) |
| :--- | :---: | :--- | :--- |
| Giai đoạn 1: Xử lý điểm nghẽn thanh toán và bảo mật hồ sơ đặt chỗ | Quý II/2026 – Quý IV/2026 | Áp dụng cơ chế cộng 5 phút đệm giữ chỗ (tối đa 1 lần/PNR) và truy vấn đối soát thanh toán 2 chiều sau 30 giây; bật xác thực OTP khi xem chi tiết/sửa hồ sơ PNR; đưa Phòng chờ ảo vào vận hành trước đợt bán vé Tết Nguyên đán | Giảm tỷ lệ giao dịch bị trừ tiền nhưng trễ xuất vé xuống dưới 0,05%; rút ngắn thời gian hoàn tiền giao dịch lỗi xuống 24 – 48 giờ; ngăn chặn truy cập trái phép vào hồ sơ đặt chỗ |
| Giai đoạn 2: Nâng cấp phần mềm tự phục vụ và mở rộng thiết bị sân bay | Năm 2027 – Năm 2028 | Ra mắt giao diện đặt vé 4 bước và tính năng tự tính tiền chênh lệch đổi/hoàn vé trên ứng dụng; cập nhật thuật toán giữ vị trí ghế ngồi khi đổi tàu bay; lắp thêm máy Kiosk có báo hiệu sắp hết giấy in tại sân bay | Thời gian tải trang tìm kiếm chuyến bay trung bình dưới 1,5 giây; tỷ lệ hành khách tự làm thủ tục qua Web, App, Kiosk và VNeID đạt từ 70% trở lên; độ sẵn sàng của hệ thống đạt 99,95% |
| Giai đoạn 3: Đồng bộ hành trình sinh trắc học và tối ưu quản trị dữ liệu | Năm 2029 – Năm 2030 | Mở rộng quy trình làm thủ tục sinh trắc học VNeID không giấy tờ ra toàn bộ 22 cảng hàng không nội địa; nâng cấp phân hệ báo cáo quản trị và dự báo nhu cầu đặt chỗ theo thời gian thực | Rút ngắn thời gian làm thủ tục tại sân bay xuống còn 1/3 so với quầy truyền thống; điểm hài lòng trung bình của người sử dụng tăng từ 3,64/5,0 lên mức 4,35/5,0 trở lên |

<div style="page-break-after: always;"></div>

V. KẾT LUẬN

5.1. Vai trò thực tế của hệ thống và lý do cần phân tích từ cấu trúc bên dưới

Qua quá trình thực hiện bài tập lớn dưới sự hướng dẫn của cô ThS. Lê Hoàng Diệp, em có dịp tìm hiểu Hệ thống đặt vé và làm thủ tục trực tuyến của Vietnam Airlines từ cấu trúc xử lý bên trong thay vì chỉ nhìn ở bề mặt giao diện như một người mua vé thông thường. Khi phân tích hệ thống theo năm thành phần, ba mô hình biểu diễn (ngoài, lô-gíc, vật lý) và 9 bảng cơ sở dữ liệu quan hệ, những vướng mắc mà hành khách gặp phải trên màn hình điện thoại đều bộc lộ rõ nguyên nhân ở tầng dữ liệu và quy trình bên dưới. Chẳng hạn, sự cố khách quét mã QR thanh toán sát giờ bị trừ tiền nhưng mất chỗ thực chất bắt nguồn từ việc cột `han_giu_cho` 15 phút trong bảng `HO_SO_DAT_CHO` tự động hủy mã đặt chỗ trước khi bản tin xác nhận của ngân hàng kịp trả về. Việc phân tích kỹ từng bảng dữ liệu và từng bước xử lý giúp xác định đúng chỗ cần sửa thay vì chỉ thay đổi giao diện bên ngoài.

5.2. Tóm tắt kết quả khảo sát và hướng nâng cấp giai đoạn 2026 – 2030

Kết quả khảo sát 30 người sử dụng thực tế cho thấy nền tảng cơ sở dữ liệu và phần cứng máy chủ của hãng đang vận hành ổn định (đạt 3,91 và 3,78 / 5,0 điểm), giữ cho mức độ hài lòng chung của toàn hệ thống đạt 3,64 / 5,0 (68,4% đánh giá tốt). Điểm số chỉ giảm xuống quanh mức 3,10 – 3,43 ở các khâu tự đổi hoặc hoàn vé trên ứng dụng, chờ hoàn tiền giao dịch lỗi và truy cập mạng vào đợt cao điểm mở bán vé Tết.

Từ thực tế đó, trong giai đoạn 2026 – 2030, Vietnam Airlines không cần thay mới toàn bộ hệ thống lõi mà chỉ cần tập trung nâng cấp các khâu đang gây bất tiện cho khách hàng: bổ sung 5 phút đệm giữ chỗ một lần duy nhất kèm cơ chế tự kiểm tra lại giao dịch với ngân hàng sau 30 giây; tích hợp tính năng tự tính tiền chênh lệch khi đổi hoặc hoàn vé trên ứng dụng; giữ nguyên nhóm ghế ngồi cạnh nhau cho gia đình khi đổi máy bay; tách riêng máy chủ tra cứu khỏi máy chủ thanh toán và yêu cầu mã OTP khi xem chi tiết hoặc chỉnh sửa hồ sơ đặt chỗ.

5.3. Triển vọng mở rộng và những bài toán vận hành tiếp theo

Khi lộ trình nâng cấp kết hợp cùng định danh sinh trắc học VNeID được triển khai đồng bộ tại 22 cảng hàng không nội địa vào năm 2030, hành khách sẽ có thể tự thực hiện trọn vẹn hành trình từ lúc mua vé trên điện thoại đến lúc đi qua cửa lên máy bay mà không cần dùng thẻ giấy. Dù vậy, trong quá trình vận hành thực tế, đơn vị quản lý hệ thống vẫn cần lưu ý giải quyết linh hoạt các tình huống phát sinh: việc thêm bước nhập mã OTP giúp bảo mật mã đặt chỗ tốt hơn nhưng cần có phương án gửi mã qua thư điện tử hoặc ứng dụng cho khách quốc tế không nhận được tin nhắn SMS khi chuyển vùng; đồng thời phối hợp chặt với đơn vị quản lý cảng hàng không để bảo đảm đường truyền và thiết bị quét khuôn mặt tại các sân bay địa phương luôn hoạt động thông suốt.

<div style="page-break-after: always;"></div>

VI. TÀI LIỆU THAM KHẢO

a. Tài liệu tiếng Việt:

1. Bộ Chính trị (2024), Nghị quyết số 57-NQ/TW ngày 22/12/2024 về đột phá phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số quốc gia, Hà Nội.
2. Chính phủ (2023), Nghị định số 13/2023/NĐ-CP ngày 17/4/2023 của Chính phủ về bảo vệ dữ liệu cá nhân, Hà Nội.
3. Cục Hàng không Việt Nam (2025), Báo cáo tổng kết công tác vận tải hàng không và triển khai xác thực sinh trắc học tại các cảng hàng không giai đoạn 2024 – 2025, Hà Nội.
4. Đặng Văn Đức (2018), Phân tích và thiết kế hướng đối tượng sử dụng UML, Nhà xuất bản Khoa học và Kỹ thuật, Hà Nội.
5. Lê Hoàng Diệp (2025), Bài giảng và Tài liệu hướng dẫn học phần Quản trị hệ thống thông tin, Khoa Khoa học Liên ngành – Ngoại ngữ – Tin học, Học viện Hành chính và Quản trị công, Hà Nội.
6. Trần Thị Song Minh (2020), Giáo trình Hệ thống thông tin quản lý, Nhà xuất bản Đại học Kinh tế Quốc dân, Hà Nội.
7. Quốc hội (2023), Luật Giao dịch điện tử số 20/2023/QH15 thông qua ngày 22/6/2023, Hà Nội.
8. Tổng công ty Hàng không Việt Nam (2025), Báo cáo thường niên năm 2025 và Tài liệu hướng dẫn đặt vé, làm thủ tục trực tuyến trên cổng thương mại điện tử, https://www.vietnamairlines.com, cập nhật ngày 15/12/2025.
9. Nguyễn Văn Vỵ (2019), Giáo trình Phân tích và thiết kế hệ thống phần mềm theo hướng đối tượng bằng UML, Nhà xuất bản Giáo dục Việt Nam, Hà Nội.

b. Tài liệu tiếng Anh:

10. Laudon, K. C., & Laudon, J. P. (2022), Management Information Systems: Managing the Digital Firm, 17th Edition, Pearson Education, London.
11. Object Management Group (2017), OMG Unified Modeling Language (OMG UML) Specification, Version 2.5.1, Object Management Group, Needham.
12. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019), Database System Concepts, 7th Edition, McGraw-Hill Education, New York.

<div style="page-break-after: always;"></div>

PHỤ LỤC

Để có thêm số liệu thực tế phục vụ đánh giá hệ thống tại Phần IV, đầu năm 2026 em đã gửi bảng hỏi khảo sát (qua biểu mẫu trực tuyến Google Forms kết hợp hỏi trực tiếp) tới những người từng đặt vé, thanh toán và làm thủ tục trên website hoặc ứng dụng Vietnam Airlines, thu về 30 phiếu hợp lệ (mã số từ KS001 đến KS030). Bảng hỏi gồm các câu hỏi chấm điểm mức độ hài lòng đối với 6 nhóm nghiệp vụ (NV1 – NV6) và 15 tiêu chí thuộc 5 thành phần hệ thống (PC1 – CN3) theo thang điểm từ 1 đến 5 (1 = Rất không hài lòng; 2 = Không hài lòng; 3 = Bình thường; 4 = Hài lòng; 5 = Rất hài lòng), kèm mục ý kiến đóng góp tự do ở cuối phiếu. Bảng PL.1 và Bảng PL.2 dưới đây tổng hợp phân phối tần số của 21 chỉ tiêu và kết quả 30 phiếu khảo sát thu về.

Bảng PL.1: Bảng phân phối tần số và tỷ lệ phần trăm 21 chỉ tiêu khảo sát trên 30 phiếu hợp lệ (N = 30)

| Mã tiêu chí | Nội dung tiêu chí khảo sát (N = 30) | Mức 1 | Mức 2 | Mức 3 | Mức 4 | Mức 5 | Điểm TB |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| NV1 | Nghiệp vụ Đăng nhập tài khoản Bông Sen Vàng | 0 (0,0%) | 2 (6,7%) | 8 (26,7%) | 16 (53,3%) | 4 (13,3%) | 3,73 |
| NV2 | Nghiệp vụ Tìm chuyến bay và Đặt vé trực tuyến | 1 (3,3%) | 2 (6,7%) | 3 (10,0%) | 17 (56,7%) | 7 (23,3%) | 3,90 |
| NV3 | Nghiệp vụ Cập nhật thông tin và mua hành lý | 1 (3,3%) | 1 (3,3%) | 6 (20,0%) | 20 (66,7%) | 2 (6,7%) | 3,70 |
| NV4 | Nghiệp vụ Thanh toán trực tuyến và nhận vé | 1 (3,3%) | 2 (6,7%) | 5 (16,7%) | 19 (63,3%) | 3 (10,0%) | 3,70 |
| NV5 | Nghiệp vụ Làm thủ tục trực tuyến và vận chuyển | 1 (3,3%) | 2 (6,7%) | 6 (20,0%) | 17 (56,7%) | 4 (13,3%) | 3,70 |
| NV6 | Nghiệp vụ Quản lý đặt chỗ, tự đổi và hoàn vé | 3 (10,0%) | 6 (20,0%) | 6 (20,0%) | 15 (50,0%) | 0 (0,0%) | 3,10 |
| PC1 | Máy chủ đáp ứng nhanh vào ngày thường | 1 (3,3%) | 1 (3,3%) | 4 (13,3%) | 19 (63,3%) | 5 (16,7%) | 3,87 |
| PC2 | Quầy Kiosk sân bay cảm ứng nhạy, in thẻ rõ | 0 (0,0%) | 1 (3,3%) | 7 (23,3%) | 21 (70,0%) | 1 (3,3%) | 3,73 |
| PC3 | Thiết bị quét mã và nhận diện khuôn mặt sân bay | 0 (0,0%) | 1 (3,3%) | 7 (23,3%) | 21 (70,0%) | 1 (3,3%) | 3,73 |
| PM1 | Giao diện tìm kiếm chuyến bay và giá vé dễ nhìn | 0 (0,0%) | 3 (10,0%) | 5 (16,7%) | 21 (70,0%) | 1 (3,3%) | 3,67 |
| PM2 | Sơ đồ chọn ghế ngồi trực tuyến dễ thao tác | 0 (0,0%) | 1 (3,3%) | 7 (23,3%) | 21 (70,0%) | 1 (3,3%) | 3,73 |
| PM3 | Tính năng tự đổi chuyến, hoàn vé trên ứng dụng | 3 (10,0%) | 5 (16,7%) | 8 (26,7%) | 14 (46,7%) | 0 (0,0%) | 3,10 |
| DL1 | Dữ liệu lịch bay, ghế trống, giá vé chính xác | 0 (0,0%) | 0 (0,0%) | 5 (16,7%) | 18 (60,0%) | 7 (23,3%) | 4,07 |
| DL2 | Mã đặt chỗ PNR và Vé điện tử đồng bộ nhanh | 0 (0,0%) | 1 (3,3%) | 6 (20,0%) | 19 (63,3%) | 4 (13,3%) | 3,87 |
| DL3 | Dữ liệu tài khoản và dặm Bông Sen Vàng đúng | 0 (0,0%) | 0 (0,0%) | 9 (30,0%) | 18 (60,0%) | 3 (10,0%) | 3,80 |
| MC1 | Đường truyền mạng dịp mở bán vé Tết, khuyến mãi | 2 (6,7%) | 2 (6,7%) | 7 (23,3%) | 19 (63,3%) | 0 (0,0%) | 3,43 |
| MC2 | Kết nối thanh toán QR ngân hàng, ví điện tử | 1 (3,3%) | 2 (6,7%) | 5 (16,7%) | 20 (66,7%) | 2 (6,7%) | 3,67 |
| MC3 | Kết nối xác thực định danh điện tử VNeID | 0 (0,0%) | 1 (3,3%) | 11 (36,7%) | 17 (56,7%) | 1 (3,3%) | 3,60 |
| CN1 | Thời gian giữ chỗ 15 phút và mở thủ tục 24h – 1h | 0 (0,0%) | 2 (6,7%) | 7 (23,3%) | 19 (63,3%) | 2 (6,7%) | 3,70 |
| CN2 | Hướng dẫn nghiệp vụ và lưu ý bảo mật mã đặt chỗ | 1 (3,3%) | 3 (10,0%) | 8 (26,7%) | 18 (60,0%) | 0 (0,0%) | 3,43 |
| CN3 | Tốc độ hỗ trợ sự cố thanh toán và hoàn tiền vé | 2 (6,7%) | 4 (13,3%) | 9 (30,0%) | 15 (50,0%) | 0 (0,0%) | 3,23 |

Bảng PL.2: Tổng hợp kết quả 30 phiếu khảo sát người sử dụng hệ thống Vietnam Airlines (Mã phiếu KS001 – KS030)

| Mã phiếu | Nhóm người dùng | NV1 | NV2 | NV3 | NV4 | NV5 | NV6 | Điểm TB | Ý kiến đóng góp trên phiếu khảo sát |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| KS001 | Hành khách đi công tác | 4 | 5 | 4 | 4 | 5 | 3 | 4,00 | App dễ dùng, làm thủ tục online nhanh nên ra sân bay đỡ phải xếp hàng. |
| KS002 | Hành khách đi du lịch, thăm thân | 4 | 5 | 4 | 4 | 4 | 4 | 4,05 | Giao diện dễ nhìn, giá vé hiện rõ cả thuế phí từ đầu. |
| KS003 | Hành khách đi công tác | 4 | 4 | 4 | 4 | 4 | 1 | 3,43 | Muốn đổi giờ bay trên app mà không tự đổi được, vẫn phải gọi tổng đài hơi bất tiện. |
| KS004 | Hành khách đi du lịch, thăm thân | 3 | 3 | 3 | 1 | 3 | 2 | 2,43 | Lúc chuyển khoản quét mã QR bị trừ tiền rồi mà web báo hết thời gian giữ chỗ, phải chờ hơn tuần mới được hoàn lại tiền. |
| KS005 | Hội viên Bông Sen Vàng | 5 | 4 | 4 | 4 | 4 | 2 | 3,86 | Mục tra cứu vé chỉ cần nhập mã đặt chỗ với họ tên là xem được hết thông tin, nên có thêm mã OTP cho an toàn. |
| KS006 | Hành khách đi công tác | 4 | 4 | 4 | 4 | 4 | 4 | 4,00 | Ổn. |
| KS007 | Nhân viên bán vé, phục vụ mặt đất | 5 | 4 | 4 | 4 | 2 | 4 | 3,76 | Giờ cao điểm buổi sáng khách đông, máy in thẻ tự động ở sân bay thỉnh thoảng hết giấy mà không có thông báo sớm. |
| KS008 | Hành khách đi du lịch, thăm thân | 3 | 2 | 3 | 3 | 3 | 3 | 2,81 | Mấy đợt mở bán vé Tết vào tìm chuyến bay mạng rất chậm, chọn xong ghế hay bị báo lỗi kết nối. |
| KS009 | Hành khách đi công tác | 2 | 4 | 4 | 5 | 4 | 4 | 3,90 | Mở web trên máy tính để so sánh giờ bay một lúc là tài khoản tự thoát ra, phải đăng nhập lại. |
| KS010 | Hành khách đi du lịch, thăm thân | 4 | 4 | 3 | 4 | 1 | 3 | 3,05 | Làm thủ tục online đã chọn sẵn ghế ngồi cạnh nhau cho cả nhà, đến lúc ra sân bay đổi máy bay khác lại bị xếp tách ra mỗi người một hàng. |
| KS011 | Hành khách đi công tác | 4 | 4 | 4 | 4 | 5 | 4 | 4,19 | Làm thủ tục trên điện thoại nhanh, tiện. |
| KS012 | Hành khách đi du lịch, thăm thân | 3 | 2 | 2 | 3 | 3 | 3 | 2,86 | Lúc đặt vé có nhiều mục gợi ý mua thêm bảo hiểm với dịch vụ đi kèm, người lớn tuổi không để ý rất dễ bấm nhầm. |
| KS013 | Hội viên Bông Sen Vàng | 5 | 5 | 4 | 4 | 5 | 2 | 4,05 | Đặt vé khứ hồi tới lúc muốn đổi giờ bay chiều về trên app thì không tự bấm đổi được. |
| KS014 | Hành khách đi công tác | 4 | 4 | 4 | 3 | 4 | 2 | 3,62 | Hoàn tiền khi hủy vé còn hơi lâu, mình phải đợi gần hai tuần mới nhận lại được tiền. |
| KS015 | Hành khách đi du lịch, thăm thân | 3 | 4 | 4 | 5 | 4 | 4 | 4,05 | (Để trống) |
| KS016 | Nhân viên bán vé, phục vụ mặt đất | 4 | 4 | 4 | 2 | 4 | 3 | 3,38 | Nhiều khách quét mã QR thanh toán sát lúc hết hạn giữ chỗ hay bị trừ tiền nhưng chưa ra vé ngay. |
| KS017 | Hành khách đi công tác | 4 | 5 | 4 | 4 | 4 | 4 | 4,14 | (Để trống) |
| KS018 | Hành khách đi du lịch, thăm thân | 4 | 4 | 5 | 4 | 4 | 4 | 4,10 | Mua thêm hành lý ký gửi trước trên app rẻ và tiện hơn ra sân bay. |
| KS019 | Hành khách đi công tác | 3 | 4 | 1 | 3 | 4 | 2 | 3,05 | Lỡ gõ nhầm tên đệm lúc đặt vé mà trên web không cho sửa lại, gọi tổng đài nhờ hỗ trợ thì chờ máy hơi lâu. |
| KS020 | Hành khách đi du lịch, thăm thân | 4 | 4 | 4 | 4 | 2 | 4 | 3,67 | Cổng quét khuôn mặt ở sân bay có lúc nhận diện hơi chậm, phải đứng thử lại mấy lần mới qua được. |
| KS021 | Hội viên Bông Sen Vàng | 2 | 5 | 4 | 4 | 4 | 4 | 3,95 | Lúc đổi dặm lấy vé thưởng tin nhắn mã OTP gửi về điện thoại hơi chậm. |
| KS022 | Hành khách đi công tác | 4 | 4 | 4 | 4 | 5 | 4 | 4,14 | Đổi cửa ra máy bay có báo ngay trên ứng dụng nên dễ theo dõi. |
| KS023 | Hành khách đi du lịch, thăm thân | 3 | 1 | 3 | 3 | 3 | 3 | 2,67 | Hôm có khuyến mãi vào đặt vé bị đứng trang web suốt, tải lại được thì đã hết vé giá rẻ. |
| KS024 | Hành khách đi công tác | 4 | 4 | 4 | 4 | 3 | 1 | 3,48 | Bạn mình chụp ảnh vé đăng mạng xã hội quên che mã đặt chỗ, bị người lạ vào đổi mất ghế ngồi. |
| KS025 | Hành khách đi du lịch, thăm thân | 3 | 4 | 3 | 4 | 4 | 4 | 3,71 | Không có ý kiến. |
| KS026 | Hành khách đi công tác | 4 | 4 | 4 | 5 | 4 | 4 | 4,24 | Thanh toán bằng quét mã QR ngân hàng nhanh, có vé gửi về email ngay. |
| KS027 | Hành khách đi du lịch, thăm thân | 3 | 3 | 3 | 4 | 3 | 2 | 3,05 | Chữ ở phần điều kiện hoàn đổi vé trên điện thoại hơi nhỏ, lúc bấm hoàn vé cũng không hiện sẵn số tiền được nhận lại. |
| KS028 | Hành khách đi công tác | 4 | 5 | 4 | 4 | 4 | 4 | 4,14 | Bình thường, dễ sử dụng. |
| KS029 | Hội viên Bông Sen Vàng | 5 | 5 | 5 | 4 | 4 | 4 | 4,43 | (Để trống) |
| KS030 | Hành khách đi công tác | 4 | 3 | 4 | 2 | 4 | 1 | 3,05 | Vé bị lỗi thanh toán phải chờ hoàn tiền mà trên app không xem được tiến độ xử lý tới đâu rồi. |
