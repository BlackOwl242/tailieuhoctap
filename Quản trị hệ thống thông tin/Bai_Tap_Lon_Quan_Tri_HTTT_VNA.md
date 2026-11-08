# BÀI TẬP LỚN KẾT THÚC HỌC PHẦN QUẢN TRỊ HỆ THỐNG THÔNG TIN

**Tên đề tài:** Phân tích, đánh giá và đề xuất giải pháp nâng cấp Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)

---

## LỜI CẢM ƠN

Trong suốt quá trình học tập và thực hiện bài tập lớn kết thúc học phần **Quản trị hệ thống thông tin**, tác giả đã nhận được sự giảng dạy tận tình cùng những định hướng chuyên môn sâu sắc từ các thầy, cô giáo thuộc Học viện Hành chính và Quản trị công. Những kiến thức nền tảng về hệ thống thông tin, các mô hình biểu diễn hệ thống, phương pháp phân tích thiết kế hướng đối tượng và quản trị tài nguyên dữ liệu mà giảng viên truyền đạt chính là kim chỉ nam giúp tác giả hoàn thành đề tài nghiên cứu này.

Tác giả xin bày tỏ lòng biết ơn chân thành tới Ban Giám đốc Học viện, Khoa chuyên môn và đặc biệt là giảng viên trực tiếp giảng dạy học phần Quản trị hệ thống thông tin đã luôn tạo điều kiện thuận lợi, cung cấp tài liệu học tập và hướng dẫn phương pháp nghiên cứu khoa học nghiêm túc cho sinh viên. Tác giả cũng xin cảm ơn 150 anh, chị hành khách và nhân viên nghiệp vụ đã dành thời gian quý báu tham gia trả lời phiếu khảo sát thực tế về trải nghiệm sử dụng hệ thống đặt vé và làm thủ tục trực tuyến của Vietnam Airlines.

Mặc dù đã cố gắng vận dụng đầy đủ lý thuyết học phần vào việc khảo sát, mô hình hóa và đánh giá hệ thống thực tế, song do thời gian và kinh nghiệm thực tiễn còn nhất định nên báo cáo khó tránh khỏi những thiếu sót. Tác giả rất mong nhận được những ý kiến nhận xét, góp ý của quý thầy, cô để hoàn thiện hơn kiến thức chuyên môn của mình.

Xin trân trọng cảm ơn!

---

## LỜI CAM ĐOAN

Tác giả xin cam đoan báo cáo bài tập lớn với đề tài: *“Phân tích, đánh giá và đề xuất giải pháp nâng cấp Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)”* là công trình nghiên cứu độc lập do chính tác giả thực hiện dưới sự hướng dẫn của giảng viên học phần Quản trị hệ thống thông tin.

Toàn bộ nội dung phân tích, hệ thống sơ đồ mô hình hóa hướng đối tượng (Use Case, Activity, Sequence, Class, ERD), kết quả khảo sát 150 người sử dụng và các giải pháp đề xuất trong báo cáo đều được tổng hợp trung thực từ quá trình trải nghiệm thực tế trên cổng thông tin điện tử `vietnamairlines.com`, ứng dụng di động Vietnam Airlines và các nguồn tài liệu tham khảo chính thống đã được trích dẫn rõ ràng. Báo cáo không sao chép từ bất kỳ bài tập lớn, khóa luận hay công trình nghiên cứu nào khác đã được công bố. Nếu có bất kỳ gian lận nào, tác giả xin hoàn toàn chịu trách nhiệm trước quy chế đào tạo của Học viện.

---

## DANH MỤC TỪ VIẾT TẮT

| Chữ viết tắt | Thuật ngữ tiếng Anh / Nguyên nghĩa | Nghĩa tiếng Việt đầy đủ |
| :---: | :--- | :--- |
| **3NF** | *Third Normal Form* | Dạng chuẩn 3 trong thiết kế cơ sở dữ liệu |
| **API** | *Application Programming Interface* | Giao diện lập trình ứng dụng kết nối liên thông |
| **BCBP** | *Bar Coded Boarding Pass* | Thẻ lên máy bay có mã vạch hai chiều |
| **BSV** | *Lotusmiles* | Chương trình Hội viên Bông Sen Vàng |
| **CCCD** | *Citizen Identity Card* | Căn cước công dân |
| **CDN** | *Content Delivery Network* | Mạng phân phối nội dung tăng tốc tải trang |
| **CNTT** | *Information Technology* | Công nghệ thông tin |
| **CRM** | *Customer Relationship Management* | Hệ thống quản trị quan hệ khách hàng |
| **CSDL** | *Database* | Cơ sở dữ liệu |
| **DSS** | *Decision Support System* | Hệ thống hỗ trợ ra quyết định |
| **EIS** | *Executive Information System* | Hệ thống thông tin điều hành cấp cao |
| **ERP** | *Enterprise Resource Planning* | Hệ thống hoạch định nguồn lực doanh nghiệp |
| **ERD** | *Entity Relationship Diagram* | Biểu đồ thực thể quan hệ cơ sở dữ liệu |
| **HTTT** | *Information System* | Hệ thống thông tin |
| **MIS** | *Management Information System* | Hệ thống thông tin quản lý |
| **OOP** | *Object-Oriented Programming / Analysis* | Phân tích và thiết kế hướng đối tượng |
| **OTP** | *One-Time Password* | Mã xác thực sử dụng một lần |
| **PNR** | *Passenger Name Record* | Mã hồ sơ đặt chỗ của hành khách (gồm 6 ký tự) |
| **RBAC** | *Role-Based Access Control* | Cơ chế phân quyền truy cập theo vai trò |
| **TPS** | *Transaction Processing System* | Hệ thống xử lý giao dịch hàng ngày |
| **UML** | *Unified Modeling Language* | Ngôn ngữ mô hình hóa thống nhất chuẩn quốc tế |
| **VNA** | *Vietnam Airlines* | Hãng hàng không Quốc gia Việt Nam |
| **VNeID** | *Vietnam Electronic Identification* | Ứng dụng định danh điện tử quốc gia |

---

## MỞ ĐẦU

**1. Tính cấp thiết của đề tài**

Trong bối cảnh chuyển đổi số diễn ra mạnh mẽ trên toàn cầu và tại Việt Nam theo tinh thần Nghị quyết số 57-NQ/TW ngày 22/12/2024 của Bộ Chính trị, hệ thống thông tin đã trở thành hạ tầng cốt lõi quyết định năng lực vận hành và sức cạnh tranh của mọi doanh nghiệp. Đối với ngành vận tải hàng không dân dụng, hoạt động bán vé và phục vụ hành khách không còn giới hạn tại các phòng vé vật lý hay quầy thủ tục truyền thống ở sân bay. Thay vào đó, phần lớn hành khách hiện nay tự tra cứu lịch bay, so sánh giá vé, đặt chỗ, thanh toán trực tuyến và làm thủ tục lấy thẻ lên máy bay ngay trên trang web hoặc ứng dụng điện thoại di động.

Là hãng hàng không quốc gia chủ lực, Tổng công ty Hàng không Việt Nam (Vietnam Airlines) đang vận hành Hệ thống thông tin đặt vé và làm thủ tục trực tuyến tại địa chỉ `https://www.vietnamairlines.com` cùng ứng dụng di động Vietnam Airlines. Nền tảng này phục vụ hơn 25 triệu lượt hành khách mỗi năm trên hơn 100 đường bay nội địa và quốc tế, đồng thời quản lý hơn 7 triệu tài khoản hội viên Bông Sen Vàng. Đây là một hệ thống thông tin điển hình vừa xử lý hàng chục nghìn giao dịch đặt chỗ, thanh toán mỗi ngày, vừa cung cấp dữ liệu trực tiếp cho công tác quản trị doanh thu và điều hành khai thác bay.

Tuy nhiên, qua quá trình sử dụng thực tế và khảo sát ý kiến hành khách trong giai đoạn 2025–2026, hệ thống vẫn bộc lộ một số bất cập cần được giải quyết. Vào các đợt cao điểm mở bán vé Tết Nguyên đán hoặc chương trình khuyến mãi lớn, lượng người truy cập tăng đột biến khiến tốc độ tải trang chậm lại, đôi khi xảy ra tình trạng ghế giá rẻ vừa hiển thị nhưng khi bấm chọn thì báo hết chỗ. Bên cạnh đó, một số trường hợp hành khách thanh toán qua mã QR ngân hàng đã bị trừ tiền trong tài khoản nhưng do đường truyền phản hồi chậm quá thời gian giữ chỗ 15 phút nên hệ thống chưa kịp xuất vé điện tử, gây tâm lý lo lắng và mất nhiều ngày chờ đối soát hoàn tiền. Quy trình tự đổi chuyến bay hoặc hoàn vé trực tuyến trên ứng dụng còn phức tạp đối với người ít tiếp xúc công nghệ, trong khi việc hành khách vô tình đăng ảnh thẻ lên máy bay có chứa mã đặt chỗ (PNR) lên mạng xã hội cũng tiềm ẩn nguy cơ bị người lạ tra cứu và can thiệp trái phép vào hành trình bay.

Xuất phát từ thực tiễn đó, việc vận dụng kiến thức học phần Quản trị hệ thống thông tin và phương pháp phân tích thiết kế hướng đối tượng để nghiên cứu sâu cấu trúc, quy trình nghiệp vụ, cơ sở dữ liệu và đề xuất giải pháp hoàn thiện hệ thống là rất cần thiết. Vì vậy, tác giả lựa chọn đề tài: **“Phân tích, đánh giá và đề xuất giải pháp nâng cấp Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)”** làm bài tập lớn kết thúc học phần.

**2. Mục tiêu và nhiệm vụ nghiên cứu**

Mục tiêu tổng quát của bài tập lớn là vận dụng lý thuyết về hệ thống thông tin, ba mô hình biểu diễn và phương pháp phân tích hướng đối tượng để làm rõ thực trạng hoạt động của Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines; từ đó đánh giá khách quan những ưu điểm, hạn chế, rủi ro và đề xuất các giải pháp nâng cấp đồng bộ, khả thi.

Để thực hiện mục tiêu trên, đề tài tập trung giải quyết bốn nhiệm vụ cụ thể sau:
- *Một là,* hệ thống hóa các kiến thức lý luận nền tảng của học phần Quản trị hệ thống thông tin, bao gồm khái niệm dữ liệu, thông tin, 8 đặc trưng của thông tin có giá trị, 5 thành phần cấu thành hệ thống thông tin, 3 mô hình biểu diễn (mô hình ngoài, mô hình lô-gíc, mô hình vật lý) và phương pháp phân tích thiết kế hướng đối tượng bằng ngôn ngữ UML.
- *Hai là,* khảo sát và phân tích thực trạng Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines theo đầy đủ 5 thành phần hệ thống kết hợp mô hình hóa hướng đối tượng (xác định tác nhân, biểu đồ Use Case, đặc tả ca sử dụng, biểu đồ hoạt động, biểu đồ trình tự, biểu đồ lớp, lược đồ cơ sở dữ liệu đạt dạng chuẩn 3 và giao diện thực tế).
- *Ba là,* đánh giá thực trạng hệ thống thông qua việc đối chiếu với 8 đặc trưng chất lượng thông tin, phân tích kết quả khảo sát định lượng 150 người sử dụng và nhận diện các rủi ro về dữ liệu, bảo mật và vận hành.
- *Bốn là,* đề xuất các nhóm giải pháp nâng cấp đồng bộ cả 5 thành phần (phần cứng, phần mềm, cơ sở dữ liệu, mạng viễn thông, con người và quy trình) kèm lộ trình triển khai nhằm nâng cao chất lượng dịch vụ và hiệu quả quản trị của Vietnam Airlines trong giai đoạn 2026–2030.

**3. Đối tượng và phạm vi nghiên cứu**

- *Đối tượng nghiên cứu:* Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines), được xét trên cả 5 thành phần cấu thành (phần cứng, phần mềm, cơ sở dữ liệu, mạng viễn thông, con người) và 3 mô hình biểu diễn hệ thống.
- *Phạm vi không gian:* Nghiên cứu tập trung vào cổng thông tin đặt vé trực tuyến công khai tại địa chỉ `https://www.vietnamairlines.com`, ứng dụng di động Vietnam Airlines và phân hệ làm thủ tục trực tuyến (Online Check-in) kết nối với hệ thống kiểm soát tại các cảng hàng không của hãng.
- *Phạm vi thời gian:* Các số liệu báo cáo khai thác được thu thập trong giai đoạn 2024–2026; hoạt động trải nghiệm giao diện thực tế và khảo sát 150 hành khách được tác giả thực hiện trong năm 2026.

**4. Phương pháp nghiên cứu**

Báo cáo sử dụng kết hợp các phương pháp nghiên cứu cụ thể và dễ kiểm chứng:
- *Phương pháp nghiên cứu tài liệu:* Tổng hợp cơ sở lý luận từ giáo trình và bài giảng học phần Quản trị hệ thống thông tin của Học viện Hành chính và Quản trị công, kết hợp với các báo cáo thường niên của Vietnam Airlines và văn bản pháp luật về thương mại điện tử, bảo vệ dữ liệu cá nhân.
- *Phương pháp quan sát và trải nghiệm thực tế:* Tác giả trực tiếp truy cập website `vietnamairlines.com` và ứng dụng di động Vietnam Airlines để thực hiện từng bước nghiệp vụ từ tìm kiếm chuyến bay, xem điều kiện giá vé, điền thông tin hành khách, tra cứu hồ sơ đặt chỗ (mã PNR) đến làm thủ tục chọn ghế ngồi và tra cứu tài khoản hội viên Bông Sen Vàng.
- *Phương pháp phân tích và thiết kế hướng đối tượng (OOP/UML 2.5):* Sử dụng ngôn ngữ mô hình hóa thống nhất UML 2.5 chuẩn quốc tế để xây dựng sơ đồ phân cấp tác nhân, biểu đồ Use Case tổng quát và phân rã, biểu đồ hoạt động (Activity Diagram), biểu đồ trình tự (Sequence Diagram), biểu đồ lớp thực thể (Class Diagram) và biểu đồ thực thể quan hệ cơ sở dữ liệu (Crow's Foot ERD).
- *Phương pháp khảo sát bằng bảng hỏi và thống kê mô tả:* Thực hiện khảo sát 150 người dùng đã từng đặt vé và làm thủ tục trên hệ thống Vietnam Airlines theo thang đo Likert 5 mức độ (từ 1 - Rất không đồng ý đến 5 - Rất đồng ý) để có số liệu định lượng khách quan khi đánh giá hệ thống.

**5. Kết cấu của báo cáo**

Ngoài phần Lời cảm ơn, Lời cam đoan, Mục lục, Danh mục từ viết tắt, Danh mục bảng biểu, Danh mục hình và sơ đồ, Kết luận, Tài liệu tham khảo và Phụ lục, nội dung chính của báo cáo được kết cấu thành 4 chương:
- **Chương I:** Cơ sở lý luận về hệ thống thông tin và quản trị hệ thống thông tin trong tổ chức.
- **Chương II:** Phân tích thực trạng Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines.
- **Chương III:** Đánh giá thực trạng và nhận diện rủi ro của Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines.
- **Chương IV:** Đề xuất giải pháp nâng cấp và hoàn thiện Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines.


---

## CHƯƠNG I: CƠ SỞ LÝ LUẬN VỀ HỆ THỐNG THÔNG TIN VÀ QUẢN TRỊ HỆ THỐNG THÔNG TIN

### 1.1. Khái niệm dữ liệu, thông tin và hệ thống thông tin trong tổ chức

#### 1.1.1. Phân biệt dữ liệu, thông tin, tri thức và tám đặc tính của thông tin có giá trị

Trong hoạt động quản lý của bất kỳ cơ quan hay doanh nghiệp nào, dữ liệu và thông tin là hai khái niệm gắn bó mật thiết nhưng có bản chất khác nhau. Dữ liệu (*Data*) là những sự kiện, con số, ký hiệu, văn bản hoặc hình ảnh thô phản ánh các hiện tượng phát sinh trong thực tế nhưng chưa được sắp xếp hay xử lý cho một mục đích cụ thể. Ví dụ, trong lĩnh vực hàng không, một dãy ký tự gồm mã chuyến bay `VN213`, ngày `15/06/2026`, con số `1.850.000` hay tên một cá nhân riêng lẻ chính là những dữ liệu thô. Khi đứng tách rời nhau, các dữ liệu này chưa giúp người quản lý đưa ra quyết định.

Thông tin (*Information*) là kết quả của quá trình thu thập, sàng lọc, phân loại, tính toán và tổ chức các dữ liệu thô trong một ngữ cảnh có ý nghĩa để phục vụ con người nhận thức và ra quyết định. Chẳng hạn, từ hàng nghìn bản ghi đặt vé lẻ tẻ, khi hệ thống tổng hợp được rằng *"Chuyến bay VN213 chặng Hà Nội đi Thành phố Hồ Chí Minh lúc 11 giờ 00 ngày 15/06/2026 đã bán được 85% số ghế, chỉ còn 12 ghế hạng Phổ thông với mức giá 1.850.000 đồng"*, đó chính là thông tin có ích cho cả hành khách lẫn bộ phận điều hành bay. Cao hơn thông tin là tri thức (*Knowledge*), tức là sự kết hợp giữa thông tin đã qua kiểm chứng với kinh nghiệm thực tiễn và quy luật nghiệp vụ (ví dụ: nắm được quy luật nhu cầu bay tăng vọt trước kỳ nghỉ lễ 3 ngày để chủ động tăng chuyến và điều chỉnh dải giá vé phù hợp).

Để thông tin thực sự hỗ trợ tốt cho công tác quản trị và giao dịch của người dùng, thông tin cần đáp ứng đầy đủ 8 đặc tính chất lượng cốt lõi được giảng dạy trong học phần Quản trị hệ thống thông tin:

- *Một là, tính chính xác (Accurate):* Thông tin không chứa sai sót số học hay nhầm lẫn nội dung. Ví dụ, số ghế còn trống trên chuyến bay, số tiền vé phải thanh toán và họ tên hành khách trên vé điện tử phải khớp hoàn toàn với thực tế.
- *Hai là, tính đầy đủ (Complete):* Thông tin phải bao quát hết các yếu tố cần thiết của nghiệp vụ mà không bỏ sót chi tiết quan trọng. Khi hành khách tra cứu giá vé, hệ thống phải hiển thị đầy đủ cả giá vé cơ bản, thuế giá trị gia tăng, phí sân bay và điều kiện hành lý đi kèm.
- *Ba là, tính kịp thời (Timely):* Thông tin phải được cung cấp đúng vào thời điểm người dùng hoặc nhà quản lý cần sử dụng. Ngay khi một hành khách vừa thanh toán xong chiếc ghế cuối cùng trên chuyến bay, hệ thống phải lập tức cập nhật trạng thái hết chỗ để người khác không đặt trùng.
- *Bốn là, tính phù hợp (Relevant):* Thông tin đưa ra phải sát với nhu cầu và vai trò của người nhận, tránh nhồi nhét những dữ liệu dư thừa gây rối mắt. Hành khách chỉ cần xem lịch bay và giá vé của chặng mình tìm kiếm, còn nhân viên làm thủ tục mặt đất mới cần xem danh sách toàn bộ hành khách trên chuyến bay.
- *Năm là, tính dễ tiếp cận (Accessible):* Thông tin được trình bày rõ ràng, trực quan và dễ dàng tra cứu trên các thiết bị quen thuộc như máy tính hay điện thoại thông minh mọi lúc, mọi nơi.
- *Sáu là, tính an toàn và bảo mật (Secure):* Thông tin quan trọng như số căn cước công dân, số điện thoại, lịch trình di chuyển và thông tin thẻ thanh toán phải được bảo vệ chặt chẽ, ngăn chặn người không có thẩm quyền xem trộm hoặc sửa đổi.
- *Bảy là, tính có thể kiểm chứng (Verifiable):* Mọi thông tin đầu ra đều có nguồn gốc rõ ràng và có thể đối chiếu ngược lại với chứng từ hoặc nhật ký giao dịch gốc khi cần giải quyết khiếu nại.
- *Tám là, tính khách quan (Objective):* Thông tin phản ánh trung thực trạng thái thực tế của hoạt động kinh doanh dựa trên quy tắc tính toán thống nhất, không bị bóp méo bởi ý muốn chủ quan.

Trong một doanh nghiệp, nhu cầu sử dụng thông tin được phân chia rõ rệt theo 3 cấp quản trị từ thấp lên cao. Ở *cấp tác nghiệp* (nhân viên bán vé, nhân viên làm thủ tục tại sân bay), thông tin cần rất chi tiết, phát sinh liên tục từng giây theo từng giao dịch cụ thể như kiểm tra mã đặt chỗ, gán số ghế ngồi hay in thẻ lên máy bay. Ở *cấp chiến thuật* (trưởng phòng thương mại, trưởng chi nhánh khu vực), thông tin được tổng hợp theo tuần, tháng hoặc quý dưới dạng báo cáo doanh thu theo chặng bay, hệ số sử dụng ghế để điều chỉnh kế hoạch bán hàng. Ở *cấp chiến lược* (Hội đồng quản trị, Ban Tổng giám đốc), thông tin mang tính khái quát dài hạn theo năm, kết hợp số liệu nội bộ với xu hướng thị trường quốc tế để quyết định đầu tư thêm tàu bay hoặc mở đường bay mới.

#### 1.1.2. Năm thành phần cấu thành hệ thống thông tin và mối quan hệ với tổ chức

Hệ thống (*System*) là một tập hợp gồm nhiều phần tử có mối liên hệ tương tác, phối hợp chặt chẽ với nhau theo những quy tắc nhất định để cùng thực hiện một mục tiêu chung. Mọi hệ thống trong thực tế đều vận hành theo chu trình khép kín gồm bốn bước: tiếp nhận đầu vào (*Input*), xử lý biến đổi (*Process*), kết xuất đầu ra (*Output*) và thu nhận thông tin phản hồi (*Feedback*) để tự điều chỉnh.

Dưới góc độ của học phần Quản trị hệ thống thông tin, **Hệ thống thông tin (HTTT)** là một hệ thống mở có sự hỗ trợ của máy tính, kết hợp hài hòa các nguồn lực công nghệ và con người nhằm thu thập, xử lý, lưu trữ và phân phối thông tin phục vụ hoạt động tác nghiệp cũng như ra quyết định quản trị trong tổ chức. Một hệ thống thông tin hoàn chỉnh không chỉ có riêng chương trình máy tính mà bắt buộc phải được cấu thành từ **5 thành phần cơ bản** có quan hệ hữu cơ với nhau:

1. **Phần cứng (Hardware):** Bao gồm toàn bộ các thiết bị vật lý hữu hình dùng để nhập dữ liệu, xử lý, lưu trữ và hiển thị thông tin. Trong hệ thống đặt vé hàng không, phần cứng bao gồm máy chủ tại trung tâm dữ liệu, tủ đĩa lưu trữ, máy tính để bàn của nhân viên, điện thoại thông minh của hành khách, máy quầy làm thủ tục tự động (Kiosk Check-in), máy in thẻ lên máy bay và cổng quét mã vạch tại sân bay.
2. **Phần mềm (Software):** Là tập hợp các chương trình và câu lệnh điều khiển phần cứng thực hiện các quy trình nghiệp vụ. Phần mềm chia thành hai nhóm chính là phần mềm hệ thống (hệ điều hành máy chủ, phần mềm quản lý ảo hóa) và phần mềm ứng dụng (trang web đặt vé trực tuyến, ứng dụng di động trên điện thoại, phần mềm quản lý chỗ và tính giá vé, phần mềm làm thủ tục chuyến bay).
3. **Cơ sở dữ liệu (Database / Data):** Là tập hợp các dữ liệu có cấu trúc chặt chẽ, được tổ chức thành các bảng có mối liên hệ với nhau để lưu trữ tập trung, tránh trùng lặp và phục vụ truy xuất nhanh chóng. Đây là "trái tim" của hệ thống, lưu giữ danh mục chuyến bay, số ghế trống, bảng giá vé, hồ sơ đặt chỗ (PNR), vé điện tử, thông tin hành khách và điểm thưởng hội viên.
4. **Mạng truyền thông (Telecommunications & Network):** Là hệ thống đường truyền cáp quang, sóng di động, thiết bị định tuyến, tường lửa bảo mật và các giao thức kết nối Internet giúp liên kết các thiết bị phần cứng ở nhiều địa điểm khác nhau. Nhờ có mạng truyền thông, hành khách ngồi tại nhà vẫn có thể truy cập vào máy chủ của hãng hàng không và kết nối tức thời với ngân hàng để thanh toán tiền vé.
5. **Con người và quy trình nghiệp vụ (People & Procedures):** Con người là chủ thể quan trọng nhất, bao gồm cả nhóm người sử dụng hệ thống (hành khách, hội viên, nhân viên bán vé, nhân viên sân bay, nhà quản lý) và nhóm chuyên gia kỹ thuật (lập trình viên, quản trị viên cơ sở dữ liệu, kỹ sư an ninh mạng). Đi kèm với con người là các quy trình, quy định nghiệp vụ hướng dẫn trình tự thao tác chuẩn mực để hệ thống vận hành trơn tru và an toàn.

Giữa hệ thống thông tin và cơ cấu tổ chức của doanh nghiệp luôn tồn tại mối quan hệ tác động qua lại hai chiều. Cơ cấu tổ chức (theo phòng ban chức năng, theo chi nhánh địa lý hay theo mạng lưới đối tác) quy định luồng đi của thông tin và quyền hạn truy cập dữ liệu của từng vị trí công việc. Ngược lại, một hệ thống thông tin hiện đại sẽ giúp xóa bỏ khoảng cách địa lý giữa trụ sở chính với các chi nhánh sân bay và phòng vé, giúp dữ liệu được chia sẻ tức thời và giảm bớt các khâu giấy tờ trung gian rườm rà.

#### 1.1.3. Phân loại các hệ thống thông tin tiêu biểu trong doanh nghiệp

Tùy theo cấp độ quản lý và chức năng nghiệp vụ, một doanh nghiệp quy mô lớn thường triển khai nhiều loại hệ thống thông tin phối hợp chặt chẽ với nhau. Bảng 1.1 tổng hợp các loại hình hệ thống thông tin phổ biến nhất theo nội dung học phần và sự hiện diện thực tế trong doanh nghiệp hàng không.

**Bảng 1.1. Phân loại các hệ thống thông tin chủ yếu trong doanh nghiệp**

| Nhóm phân loại | Tên hệ thống thông tin | Cấp quản trị / Đối tượng phục vụ | Chức năng cốt lõi và ví dụ thực tế tại hãng hàng không |
| :--- | :--- | :--- | :--- |
| **1. Theo cấp độ quản trị** | Hệ thống xử lý giao dịch (**TPS**) | Cấp tác nghiệp (Hành khách, nhân viên bán vé, thu ngân) | Ghi nhận và xử lý tức thời các giao dịch phát sinh hàng ngày với số lượng lớn. *Ví dụ:* Hệ thống đặt giữ chỗ, thanh toán tiền vé trực tuyến, xuất vé điện tử và làm thủ tục chọn ghế ngồi. |
| | Hệ thống thông tin quản lý (**MIS**) | Cấp quản lý trung gian (Trưởng phòng thương mại, trưởng chi nhánh) | Tổng hợp dữ liệu từ TPS để lập các báo cáo định kỳ theo tuần, tháng, quý. *Ví dụ:* Báo cáo doanh thu bán vé trực tuyến theo từng đường bay, báo cáo tỷ lệ lấp đầy ghế trên chuyến bay. |
| | Hệ thống hỗ trợ ra quyết định (**DSS**) | Cấp quản lý trung và cao cấp (Chuyên gia phân tích giá, kế hoạch bay) | Sử dụng các mô hình toán học và phân tích dữ liệu để hỗ trợ các quyết định bán cấu trúc. *Ví dụ:* Hệ thống phân tích nhu cầu thị trường để điều chỉnh mở hoặc đóng các mức giá vé linh hoạt. |
| | Hệ thống thông tin điều hành (**EIS**) | Cấp lãnh đạo chiến lược (Hội đồng quản trị, Ban Tổng giám đốc) | Cung cấp bảng điều khiển trực quan tổng hợp các chỉ số trọng yếu toàn tổng công ty. *Ví dụ:* Theo dõi tổng sản lượng vận chuyển, thị phần đường bay quốc tế và hiệu quả khai thác đội tàu bay. |
| **2. Theo ứng dụng tích hợp** | Hoạch định nguồn lực doanh nghiệp (**ERP**) | Liên phòng ban (Tài chính - Kế toán, Nhân sự, Vật tư kỹ thuật) | Tích hợp quản lý dòng tiền, hạch toán doanh thu vé bán ra, quản lý chi phí nhiên liệu, phụ tùng bảo dưỡng tàu bay và tiền lương nhân viên trên một cơ sở dữ liệu thống nhất. |
| | Quản trị quan hệ khách hàng (**CRM**) | Khối thương mại, chăm sóc khách hàng và hội viên | Lưu trữ lịch sử bay, quản lý tích lũy và quy đổi dặm thưởng, phân hạng thẻ hội viên (Bạc, Titan, Vàng, Bạch Kim) và gửi ưu đãi cá nhân hóa cho khách hàng thân thiết. |

### 1.2. Ba mô hình biểu diễn hệ thống và phương pháp phân tích hướng đối tượng

#### 1.2.1. Ba mô hình biểu diễn hệ thống thông tin (Mô hình ngoài, mô hình lô-gíc, mô hình vật lý)

Khi nghiên cứu, phân tích một hệ thống thông tin đang vận hành hoặc thiết kế nâng cấp hệ thống mới, bài giảng học phần Quản trị hệ thống thông tin chỉ rõ phương pháp tiếp cận toàn diện thông qua **3 mô hình biểu diễn hệ thống** (còn gọi là mô hình vật lý ngoài, mô hình lô-gíc và mô hình vật lý trong). Việc tách hệ thống thành ba góc nhìn này giúp người phân tích hiểu thấu đáo hệ thống từ bề mặt giao diện bên ngoài cho tới quy tắc nghiệp vụ cốt lõi và cách cài đặt kỹ thuật bên dưới (Hình 1.1).

![Hình 1.1. Mối quan hệ giữa quy trình xử lý thông tin và ba mô hình biểu diễn hệ thống thông tin](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_1_1_quy_trinh_mo_hinh.png)

**Hình 1.1. Mối quan hệ giữa quy trình xử lý thông tin và ba mô hình biểu diễn hệ thống thông tin**
*Nguồn: Tác giả tổng hợp từ tài liệu học phần Quản trị hệ thống thông tin [5].*

Cụ thể, nội dung và vai trò của từng mô hình được xác định như sau:

- **Mô hình ngoài (External Model / Mô hình vật lý ngoài):** Trả lời câu hỏi *"Hệ thống giao tiếp với người dùng và môi trường bên ngoài như thế nào?"*. Đây là góc nhìn trực quan của người sử dụng cuối (hành khách, nhân viên). Mô hình ngoài mô tả các nhóm tác nhân tương tác với hệ thống, bố cục các màn hình giao diện trang web và ứng dụng di động (nơi người dùng nhập điểm đi, điểm đến, ngày bay, thông tin cá nhân) cũng như các chứng từ, kết quả đầu ra mà hệ thống trả về (như tờ xác nhận hành trình vé điện tử, thẻ lên máy bay có mã QR, hóa đơn điện tử).
- **Mô hình lô-gíc (Logical Model):** Trả lời câu hỏi *"Hệ thống thực hiện những chức năng nghiệp vụ gì và quản lý những đối tượng dữ liệu nào?"* mà hoàn toàn tách biệt với công nghệ phần cứng hay ngôn ngữ lập trình cụ thể. Đây là góc nhìn của nhà phân tích nghiệp vụ. Mô hình lô-gíc làm rõ các chức năng của hệ thống, trình tự các bước kiểm tra điều kiện nghiệp vụ (như kiểm tra còn ghế trống hay không, giữ chỗ trong bao lâu, khi nào được phép làm thủ tục trực tuyến) và mối liên hệ bản chất giữa các đối tượng thông tin (Chuyến bay, Hành khách, Hồ sơ đặt chỗ, Vé điện tử, Ghế ngồi).
- **Mô hình vật lý (Physical Model / Mô hình vật lý trong):** Trả lời câu hỏi *"Hệ thống được cài đặt và vận hành bằng phương tiện kỹ thuật, công nghệ nào?"*. Đây là góc nhìn của đội ngũ kỹ sư công nghệ thông tin. Mô hình vật lý mô tả kiến trúc phân tầng máy chủ (tầng giao diện, tầng xử lý ứng dụng, tầng cơ sở dữ liệu), cấu trúc các bảng dữ liệu vật lý trong hệ quản trị cơ sở dữ liệu (với tên bảng, tên cột, kiểu dữ liệu, khóa chính `PK`, khóa ngoại `FK`), hạ tầng đường truyền mạng và cơ chế bảo mật dữ liệu.

#### 1.2.2. Phương pháp phân tích thiết kế hệ thống theo hướng đối tượng (UML 2.5)

Trong khoa học hệ thống thông tin và công nghệ phần mềm hiện đại, để biểu diễn mô hình lô-gíc và mô hình vật lý một cách chuẩn xác, dễ hiểu và thống nhất trên toàn thế giới, các nhà phân tích sử dụng phương pháp **Phân tích và thiết kế hướng đối tượng (Object-Oriented Analysis and Design - OOAD)** thông qua **Ngôn ngữ mô hình hóa thống nhất UML (Unified Modeling Language - phiên bản chuẩn 2.5)**.

Khác với cách tiếp cận hướng cấu trúc truyền thống vốn tách rời các hàm xử lý và kho dữ liệu (thường vẽ bằng sơ đồ luồng dữ liệu DFD), phương pháp hướng đối tượng xem xét hệ thống như một tập hợp các đối tượng thực tế có mối quan hệ tương tác với nhau. Mỗi đối tượng (ví dụ: đối tượng `ChuyenBay`, `HanhKhach`, `HoSoDatCho`, `VeDienTu`) đều đóng gói bên trong nó cả **thuộc tính dữ liệu** (như mã chuyến bay, giờ khởi hành, họ tên, số căn cước) lẫn **phương thức hành vi** (như kiểm tra ghế trống, khóa chỗ tạm thời, phát hành vé). Cách tiếp cận hướng đối tượng giúp sơ đồ phân tích sát với đời thực, dễ đọc hiểu và dễ dàng mở rộng nâng cấp. Trong báo cáo này, tác giả sử dụng bộ 5 loại biểu đồ chuẩn quốc tế (UML 2.5 và ký hiệu chân quạ Crow's Foot) để phân tích hệ thống Vietnam Airlines:

1. **Biểu đồ phân cấp tác nhân và Biểu đồ ca sử dụng (Actor & Use Case Diagram):** Sử dụng ký hiệu hình người que (*Stick figure*) để biểu diễn các tác nhân con người hoặc hệ thống ngoài, và các hình bầu dục (*Ellipse*) nằm trong khung giới hạn hệ thống để biểu diễn các chức năng (ca sử dụng - *Use Case*). Các mũi tên nét đứt `<<include>>` thể hiện chức năng bắt buộc phải thực hiện kèm theo, còn `<<extend>>` thể hiện chức năng mở rộng tùy chọn.
2. **Biểu đồ hoạt động (Activity Diagram):** Chia thành các làn bơi dọc (*Swimlanes*) đại diện cho từng đối tượng tham gia (Hành khách, Hệ thống đặt vé, Cổng thanh toán). Biểu đồ sử dụng hình tròn đen đặc làm điểm bắt đầu, các hình chữ nhật bo góc thể hiện hành động, hình thoi thể hiện nút kiểm tra điều kiện rẽ nhánh (`[Còn chỗ]` / `[Hết chỗ]`), thanh ngang đậm thể hiện xử lý song song và hình tròn hai vòng (mắt bò) làm điểm kết thúc.
3. **Biểu đồ trình tự (Sequence Diagram):** Mô tả sự tương tác giữa các đối tượng theo trình tự thời gian từ trên xuống dưới. Phía trên cùng là các đối tượng chuẩn kiến trúc **BCE** gồm: Tác nhân (*Actor*), Lớp biên giao diện (*Boundary* - ký hiệu `⊢◯`), Lớp điều khiển nghiệp vụ (*Control* - ký hiệu `↻◯`) và Lớp thực thể dữ liệu (*Entity* - ký hiệu `◯` có gạch chân). Từ mỗi đối tượng có đường sống nét đứt (*Lifeline*) kéo dài xuống dưới, trên đó có các thanh kích hoạt hình chữ nhật hẹp và các mũi tên thông điệp gọi hàm (nét liền) hoặc trả về kết quả (nét đứt), đặt trong khung rẽ nhánh `alt` khi có điều kiện.
4. **Biểu đồ lớp (Class Diagram):** Mô tả cấu trúc tĩnh của các lớp đối tượng trong miền nghiệp vụ. Mỗi lớp được vẽ bằng hình chữ nhật chia làm 3 ngăn: ngăn trên cùng ghi **Tên lớp** in đậm, ngăn giữa liệt kê các **thuộc tính** (`- tenThuocTinh: KieuDuLieu`), ngăn dưới cùng liệt kê các **phương thức xử lý** (`+ tenPhuongThuc()`). Giữa các lớp có các đường liên kết kèm bội số quan hệ (`1`, `0..1`, `1..*`, `0..*`), hình thoi đặc (quan hệ hợp thành chặt chẽ) hoặc mũi tên tam giác rỗng (quan hệ kế thừa).
5. **Biểu đồ thực thể quan hệ cơ sở dữ liệu (Crow's Foot ERD):** Chuyển hóa biểu đồ lớp sang thiết kế bảng dữ liệu vật lý đạt dạng chuẩn 3 (3NF), sử dụng ký hiệu chân quạ chuẩn quốc tế (`||` là duy nhất một, `o|` là không hoặc một, `|<` là một hoặc nhiều, `o<` là không hoặc nhiều) cùng chỉ định rõ khóa chính (`PK`) và khóa ngoại (`FK`).

### 1.3. Nội dung trọng tâm của quản trị hệ thống thông tin trong doanh nghiệp

#### 1.3.1. Quản trị hạ tầng phần cứng, phần mềm và mạng truyền thông

Để một hệ thống thông tin thương mại điện tử quy mô lớn hoạt động liên tục 24/7, công tác quản trị hạ tầng kỹ thuật giữ vai trò nền tảng. Trước hết, trong *quản trị phần cứng*, doanh nghiệp phải quy hoạch cụm máy chủ đủ năng lực tính toán tại trung tâm dữ liệu chính và trung tâm dữ liệu dự phòng, đồng thời bảo trì thường xuyên hệ thống thiết bị đầu cuối tại các điểm giao dịch (như máy tính quầy vé, quầy làm thủ tục tự động Kiosk và thiết bị đọc mã vạch tại cửa ra máy bay). Hệ thống máy chủ phải được theo dõi liên tục về mức sử dụng bộ vi xử lý, bộ nhớ và dung lượng ổ cứng để kịp thời bổ sung tài nguyên khi lượng khách truy cập tăng cao.

Trong *quản trị phần mềm*, đơn vị phải kiểm soát chặt chẽ chất lượng các phiên bản cập nhật trên trang web và ứng dụng di động, bảo đảm giao diện thân thiện, dễ thao tác trên nhiều kích cỡ màn hình khác nhau. Các cổng kết nối dữ liệu (API) giữa phần mềm đặt vé với các ngân hàng, ví điện tử và hệ thống định danh quốc gia phải được giám sát thời gian phản hồi từng giây để không xảy ra hiện tượng nghẽn giao dịch.

Trong *quản trị mạng truyền thông*, doanh nghiệp cần duy trì đường truyền cáp quang tốc độ cao có nhánh dự phòng tự động chuyển mạch giữa trung tâm dữ liệu với tất cả các sân bay và chi nhánh. Đối với kênh bán vé trực tuyến trên Internet, việc sử dụng mạng phân phối nội dung (CDN) kết hợp thiết bị cân bằng tải và tường lửa bảo vệ ứng dụng web giúp trang web tải nhanh hơn và ngăn chặn các cuộc tấn công làm tê liệt hệ thống.

#### 1.3.2. Quản trị cơ sở dữ liệu, phân quyền người dùng và kiểm soát rủi ro

Dữ liệu là tài sản quý giá nhất của hệ thống thông tin, do đó công tác quản trị cơ sở dữ liệu đòi hỏi sự chuẩn mực ngay từ khâu thiết kế đến vận hành hàng ngày. Các bảng dữ liệu phải được chuẩn hóa (thường đạt dạng chuẩn 3 - 3NF) để loại bỏ tình trạng dư thừa dữ liệu và ngăn ngừa sai lệch khi thêm mới, sửa đổi hoặc xóa bản ghi. Mọi giao dịch liên quan đến giữ chỗ, trừ tiền và xuất vé đều phải tuân thủ nguyên tắc toàn vẹn giao dịch: hoặc thực hiện thành công trọn vẹn tất cả các bước, hoặc nếu có bất kỳ bước nào lỗi thì phải hoàn tác về trạng thái ban đầu để không làm mất tiền hay mất chỗ của khách hàng.

Song song với quản trị dữ liệu là công tác quản trị con người thông qua **cơ chế phân quyền truy cập theo vai trò (RBAC)**. Mỗi nhóm người dùng khi truy cập vào hệ thống chỉ được cấp đúng những quyền hạn tương ứng với chức trách của mình: khách vãng lai chỉ được xem lịch bay và giá vé; hành khách có mã đặt chỗ chỉ xem và làm thủ tục được cho đúng hồ sơ của mình; nhân viên sân bay được hỗ trợ làm thủ tục theo chuyến bay được phân công; còn quản trị viên mới có quyền cấu hình tham số hệ thống. Cuối cùng, nhà quản trị phải thường xuyên nhận diện, đánh giá mức độ rủi ro (theo khả năng xảy ra và mức độ thiệt hại) đối với các sự cố kỹ thuật hoặc rò rỉ dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân, từ đó thiết lập quy trình sao lưu dự phòng và đối soát tự động nhằm bảo vệ quyền lợi của cả khách hàng lẫn doanh nghiệp.

---

## CHƯƠNG II: PHÂN TÍCH THỰC TRẠNG HỆ THỐNG THÔNG TIN ĐẶT VÉ VÀ LÀM THỦ TỤC TRỰC TUYẾN CỦA VIETNAM AIRLINES

### 2.1. Tổng quan về Vietnam Airlines và khảo sát 5 thành phần của hệ thống

#### 2.1.1. Giới thiệu khái quát về Tổng công ty Hàng không Việt Nam (Vietnam Airlines)

Tổng công ty Hàng không Việt Nam – Công ty cổ phần (tên giao dịch quốc tế là *Vietnam Airlines*, mã hãng hàng không theo chuẩn quốc tế là **VN**, đầu số vé điện tử là **738**) là hãng hàng không quốc gia giữ vai trò nòng cốt trong ngành giao thông vận tải hàng không dân dụng Việt Nam. Trải qua hơn 30 năm hình thành và phát triển với tư cách hãng hàng không quốc gia và là thành viên chính thức của Liên minh hàng không toàn cầu SkyTeam từ năm 2010, Vietnam Airlines hiện đang khai thác đội tàu bay hiện đại khoảng 100 chiếc (bao gồm các dòng tàu bay thân rộng Boeing 787 Dreamliner, Airbus A350-900 và tàu bay thân hẹp Airbus A321) kết nối hơn 100 đường bay tới 22 sân bay nội địa và hơn 30 điểm đến quốc tế tại châu Á, châu Âu, châu Úc và Bắc Mỹ.

Theo số liệu báo cáo thường niên giai đoạn 2024–2025, Vietnam Airlines vận chuyển trên 25 triệu lượt hành khách mỗi năm với tổng doanh thu hợp nhất vượt mốc 120.000 tỷ đồng, lực lượng lao động đạt trên 23.000 cán bộ, tiếp viên, phi công và nhân viên kỹ thuật. Đặc biệt, trong chiến lược chuyển đổi số giai đoạn 2022–2026, Vietnam Airlines đã đẩy mạnh việc chuyển dịch hoạt động bán vé và phục vụ hành khách từ các phòng vé truyền thống sang môi trường số. Hiện nay, kênh thương mại điện tử trực tuyến tại địa chỉ `https://www.vietnamairlines.com` và ứng dụng di động Vietnam Airlines cùng chương trình khách hàng thân thiết Bông Sen Vàng (*Lotusmiles*) với hơn 7 triệu hội viên đã trở thành kênh giao dịch chủ lực, phục vụ hàng triệu lượt tra cứu, đặt vé và làm thủ tục trực tuyến mỗi tháng.

Về cơ cấu tổ chức quản lý vận hành hệ thống thông tin đặt vé và làm thủ tục trực tuyến, Vietnam Airlines tổ chức phối hợp liên thông giữa 4 khối đơn vị chính:
- *Khối Thương mại và Tiếp thị số:* Trực tiếp quản lý lịch bay thương mại, xây dựng cấu trúc bảng giá vé, triển khai các chương trình khuyến mãi trên website/ứng dụng và quản lý chương trình Hội viên Bông Sen Vàng.
- *Khối Dịch vụ mặt đất và Khai thác sân bay (thông qua Công ty Dịch vụ mặt đất sân bay Việt Nam - VIAGS và các chi nhánh cảng hàng không):* Trực tiếp quản lý sơ đồ ghế ngồi trên tàu bay, vận hành hệ thống làm thủ tục trực tuyến (Online Check-in), quầy làm thủ tục tự động (Kiosk) và kiểm soát hành khách lên tàu bay tại cửa khởi hành.
- *Khối Tài chính – Kế toán:* Quản lý kết nối với các ngân hàng, cổng thanh toán điện tử, thực hiện đối soát dòng tiền thu bán vé trực tuyến, xuất hóa đơn điện tử và xử lý hoàn tiền vé cho hành khách.
- *Khối Công nghệ thông tin và Chuyển đổi số (cùng Công ty Cổ phần Tin học – Viễn thông Hàng không - AITS):* Chịu trách nhiệm quản trị trung tâm dữ liệu, cụm máy chủ, hệ quản trị cơ sở dữ liệu, đường truyền mạng viễn thông, an toàn bảo mật thông tin và hỗ trợ kỹ thuật 24/7.

#### 2.1.2. Hiện trạng 5 thành phần cấu thành Hệ thống thông tin đặt vé và làm thủ tục trực tuyến

Vận dụng lý thuyết về cấu trúc hệ thống thông tin tại Chương I, tác giả tiến hành khảo sát thực trạng Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines theo đầy đủ **5 thành phần cấu thành**. Kết quả khảo sát tổng hợp tại Bảng 2.1 cho thấy sự gắn kết chặt chẽ giữa thiết bị, phần mềm, cơ sở dữ liệu, mạng truyền thông và con người trong toàn bộ vòng đời phục vụ một chuyến bay.

**Bảng 2.1. Tổng hợp thực trạng 5 thành phần của Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines**

| STT | Thành phần hệ thống | Hiện trạng trang bị và vận hành thực tế tại Vietnam Airlines | Vai trò trong quy trình đặt vé và làm thủ tục |
| :---: | :--- | :--- | :--- |
| **1** | **Phần cứng (Hardware)** | - Cụm máy chủ xử lý ứng dụng và máy chủ lưu trữ cơ sở dữ liệu đặt tại Trung tâm dữ liệu chính (Hà Nội) và Trung tâm dự phòng (TP. Hồ Chí Minh) kết hợp hạ tầng đám mây.<br>- Hệ thống quầy làm thủ tục tự động (*Kiosk Check-in*) có màn hình cảm ứng và máy in nhiệt đặt tại sân bay Nội Bài, Tân Sơn Nhất, Đà Nẵng.<br>- Thiết bị quét mã vạch 2D, camera nhận diện khuôn mặt sinh trắc học tại cửa an ninh và cửa ra tàu bay.<br>- Thiết bị cá nhân của hành khách (máy tính, điện thoại thông minh). | Đảm bảo năng lực tính toán, lưu trữ hàng triệu hồ sơ đặt chỗ và cung cấp thiết bị vật lý để hành khách tự thao tác đặt vé, in thẻ lên máy bay hoặc quét mã qua cửa sân bay. |
| **2** | **Phần mềm (Software)** | - **Cổng thông tin điện tử:** Website `https://www.vietnamairlines.com` tương thích mọi trình duyệt máy tính và điện thoại.<br>- **Ứng dụng di động:** Ứng dụng *Vietnam Airlines* trên hệ điều hành iOS và Android, hỗ trợ lưu thẻ lên máy bay vào ví điện tử trên điện thoại (*Apple Wallet / Google Wallet*).<br>- **Các phân hệ nghiệp vụ lõi:** Phân hệ quản lý lịch bay và kho chỗ trống; Phân hệ tính giá vé và giữ chỗ (sinh mã PNR); Phân hệ thanh toán và xuất vé điện tử 13 số; Phân hệ làm thủ tục trực tuyến (Check-in) và chọn ghế; Phân hệ quản lý hội viên Bông Sen Vàng. | Tự động hóa toàn bộ quy trình từ lúc khách tìm chuyến bay, chọn giá vé, thanh toán tiền, nhận vé điện tử cho đến khi chọn ghế ngồi và nhận thẻ lên máy bay trực tuyến. |
| **3** | **Cơ sở dữ liệu (Database)** | - Hệ thống cơ sở dữ liệu quan hệ tập trung quản lý các tập dữ liệu cốt lõi: Danh mục sân bay và đường bay; Lịch chuyến bay và sơ đồ ghế tàu bay; Bảng giá vé và điều kiện vé; Hồ sơ đặt chỗ (`PNR` 6 ký tự); Vé điện tử (13 chữ số bắt đầu bằng `738`); Thẻ lên máy bay (`BCBP`); Hồ sơ hành khách và Tài khoản hội viên Bông Sen Vàng; Nhật ký giao dịch thanh toán. | Lưu trữ nhất quán, chính xác tuyệt đối số lượng ghế trống và trạng thái vé theo thời gian thực, ngăn chặn tình trạng hai người đặt trùng một ghế ngồi. |
| **4** | **Mạng truyền thông (Network)** | - Đường truyền Internet băng thông rộng tích hợp mạng phân phối nội dung (**CDN**) và giao thức mã hóa bảo mật **HTTPS** (SSL/TLS) cho toàn bộ giao dịch trên website và ứng dụng.<br>- Đường truyền kênh thuê riêng và mạng riêng ảo (**VPN**) kết nối trung tâm dữ liệu của hãng với 22 sân bay nội địa và các sân bay quốc tế.<br>- Cổng kết nối **API** chuyên dụng liên thông với hơn 30 ngân hàng thương mại (VietQR, NAPAS), tổ chức thẻ quốc tế (Visa, Mastercard), ví điện tử (MoMo, VNPay, ZaloPay) và Hệ thống định danh điện tử **VNeID** của Bộ Công an. | Đảm bảo thông tin đặt chỗ, kết quả trừ tiền ngân hàng và dữ liệu thẻ lên máy bay được truyền tải tức thời, bảo mật giữa điện thoại của khách, máy chủ hãng và sân bay. |
| **5** | **Con người và Quy trình (People & Procedures)** | - **Người dùng bên ngoài:** Khách vãng lai tra cứu chuyến bay; Hành khách đặt vé và làm thủ tục; Hội viên Bông Sen Vàng.<br>- **Nhân sự nội bộ:** Nhân viên thương mại quản lý lịch bay và giá vé; Nhân viên tổng đài chăm sóc khách hàng (`1900 1100`); Nhân viên phục vụ mặt đất tại sân bay; Quản trị viên công nghệ thông tin.<br>- **Quy trình nghiệp vụ:** Quy định thời hạn giữ chỗ tạm thời để thanh toán, quy định mở cổng làm thủ tục trực tuyến từ 24 giờ đến 1 giờ trước giờ khởi hành, quy trình kiểm tra an toàn hàng không và bảo mật dữ liệu cá nhân. | Vận hành, giám sát hệ thống, hỗ trợ xử lý các tình huống phát sinh (như đổi giờ bay, hoàn hủy vé, lỗi thanh toán) và tuân thủ đúng quy định an toàn hàng không. |

### 2.2. Phân tích hệ thống theo hướng đối tượng (Mô hình lô-gíc)

Để làm rõ bản chất hoạt động nghiệp vụ của Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines một cách khoa học và dễ hiểu nhất, tác giả áp dụng phương pháp **Phân tích và thiết kế hướng đối tượng (OOP)** sử dụng bộ ký hiệu chuẩn quốc tế **UML 2.5** (tương tự phương pháp trình bày trong các tài liệu mẫu về phân tích thiết kế hệ thống thông tin của Học viện). Nội dung phân tích đi tuần tự từ việc xác định các tác nhân, xây dựng biểu đồ ca sử dụng (Use Case), đặc tả chi tiết từng ca sử dụng trọng tâm, cho đến thiết kế biểu đồ hoạt động (Activity Diagram), biểu đồ trình tự (Sequence Diagram) và biểu đồ lớp thực thể (Class Diagram).

#### 2.2.1. Xác định các tác nhân (Actors) và biểu đồ phân cấp tác nhân

Trong phương pháp hướng đối tượng, **Tác nhân (Actor)** là những người dùng hoặc hệ thống bên ngoài nằm ngoài ranh giới của phần mềm nhưng trực tiếp tương tác (gửi yêu cầu hoặc nhận thông tin) với hệ thống đặt vé và làm thủ tục trực tuyến của Vietnam Airlines. Qua khảo sát thực tế, hệ thống có 6 tác nhân chính được chia thành hai nhóm: nhóm khách hàng sử dụng dịch vụ (có quan hệ kế thừa quyền hạn từ thấp đến cao) và nhóm tác nhân nội bộ cùng hệ thống liên thông bên ngoài (Hình 2.1).

![Hình 2.1. Sơ đồ phân cấp tác nhân của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_1_phan_cap_tac_nhan.png)

**Hình 2.1. Sơ đồ phân cấp tác nhân của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines**
*Nguồn: Tác giả phân tích và xây dựng theo chuẩn UML 2.5.*

Bảng 2.2 mô tả chi tiết vai trò, mục đích sử dụng và các quyền hạn tương tác của từng tác nhân đối với hệ thống.

**Bảng 2.2. Danh sách và mô tả các tác nhân tương tác với hệ thống**

| STT | Tên tác nhân (Actor) | Phân loại tác nhân | Mô tả vai trò và các hoạt động tương tác chính với hệ thống |
| :---: | :--- | :--- | :--- |
| **1** | **Khách vãng lai** | Người dùng bên ngoài (Mức cơ bản) | Là người truy cập vào website `vietnamairlines.com` hoặc ứng dụng di động nhưng chưa có mã đặt chỗ và chưa đăng nhập tài khoản. Khách vãng lai có thể tra cứu lịch bay, xem bảng giá vé theo ngày, đọc điều kiện từng hạng vé và bắt đầu thao tác đặt vé mới. |
| **2** | **Hành khách** | Người dùng bên ngoài (Kế thừa *Khách vãng lai*) | Là khách hàng đã đặt vé thành công và sở hữu **Mã đặt chỗ PNR (6 ký tự)** cùng số vé điện tử. Ngoài mọi quyền của khách vãng lai, Hành khách được quyền tra cứu hồ sơ đặt chỗ của mình, mua thêm hành lý ký gửi, chọn trước chỗ ngồi, yêu cầu đổi chuyến/hoàn vé và thực hiện **Làm thủ tục trực tuyến (Online Check-in)** để nhận thẻ lên máy bay. |
| **3** | **Hội viên Bông Sen Vàng** | Người dùng bên ngoài (Kế thừa *Hành khách*) | Là hành khách đã đăng ký tài khoản khách hàng thân thiết (*Lotusmiles*). Ngoài các chức năng của hành khách thông thường, Hội viên có thể đăng nhập bằng số thẻ hội viên để tự động điền thông tin cá nhân khi đặt vé, tích lũy dặm thưởng sau chuyến bay, dùng dặm thưởng để mua vé hoặc nâng hạng ghế Thương gia. |
| **4** | **Nhân viên bán vé và phục vụ mặt đất** | Người dùng nội bộ | Là cán bộ, nhân viên của Vietnam Airlines và VIAGS làm việc tại tổng đài hoặc sân bay. Tác nhân này sử dụng phân hệ nghiệp vụ để kiểm tra trạng thái vé của khách, hỗ trợ xử lý các trường hợp khách cần đổi vé, hoàn vé, xác nhận hành lý ký gửi tại quầy và kiểm soát danh sách hành khách đã làm thủ tục lên tàu bay. |
| **5** | **Quản trị viên hệ thống** | Người dùng nội bộ | Là chuyên viên quản trị thương mại và công nghệ thông tin của hãng, có quyền cập nhật danh mục chuyến bay, cấu hình số lượng ghế mở bán theo từng hạng giá, thiết lập chương trình khuyến mãi, phân quyền người dùng và giám sát nhật ký đối soát giao dịch. |
| **6** | **Hệ thống Thanh toán và Định danh VNeID** | Tác nhân hệ thống ngoài | Bao gồm cổng thanh toán của các ngân hàng thương mại, tổ chức thẻ quốc tế, ví điện tử (nhận yêu cầu trừ tiền và trả về kết quả xác nhận giao dịch) và Hệ thống định danh điện tử VNeID của Bộ Công an (xác thực thông tin căn cước công dân và sinh trắc học khuôn mặt khi khách làm thủ tục trực tuyến). |

#### 2.2.2. Biểu đồ ca sử dụng (Use Case) tổng quát và phân rã

Sau khi xác định đầy đủ các tác nhân, tác giả xây dựng **Biểu đồ Use Case tổng quát** (Hình 2.2) nhằm mô hình hóa toàn bộ các chức năng chính của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines cũng như mối quan hệ giữa các chức năng đó với từng tác nhân.

![Hình 2.2. Biểu đồ Use Case tổng quát Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_2_usecase_tong_quat.png)

**Hình 2.2. Biểu đồ Use Case tổng quát Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines**
*Nguồn: Tác giả phân tích và thiết kế theo chuẩn UML 2.5.*

Nhìn vào Hình 2.2, có thể thấy rõ cách thức hoạt động của hệ thống thông qua các mối quan hệ chuẩn UML:
- Khi *Khách vãng lai* hoặc *Hành khách* thực hiện ca sử dụng **Đặt vé máy bay trực tuyến**, hệ thống bắt buộc phải gọi kèm (`<<include>>`) ca sử dụng **Thanh toán tiền vé trực tuyến** thông qua sự phối hợp của tác nhân *Cổng thanh toán Ngân hàng / Ví*. Đồng thời, trong quá trình đặt vé, khách hàng có thể lựa chọn thực hiện thêm hoặc bỏ qua (`<<extend>>`) ca sử dụng **Mua thêm hành lý và dịch vụ bổ trợ** (như mua thêm kiện hành lý 23kg, đặt suất ăn đặc biệt).
- Khi *Hành khách* thực hiện ca sử dụng **Làm thủ tục trực tuyến (Online Check-in)** trong khoảng thời gian từ 24 giờ đến 1 giờ trước giờ bay, hệ thống bắt buộc phải bao gồm (`<<include>>`) bước **Chọn ghế ngồi trên sơ đồ khoang tàu** và có thể mở rộng (`<<extend>>`) sang chức năng **Xác thực giấy tờ sinh trắc học** kết nối với *Hệ thống định danh điện tử VNeID*.

Để đi sâu vào hai quy trình nghiệp vụ cốt lõi nhất của đề tài là **Đặt vé trực tuyến** và **Làm thủ tục chuyến bay (Check-in)**, tác giả tiếp tục phân rã chi tiết hai phân hệ này tại Hình 2.3 và tổng hợp danh mục các ca sử dụng tại Bảng 2.3.

![Hình 2.3. Biểu đồ Use Case phân rã phân hệ Đặt vé trực tuyến và Làm thủ tục chuyến bay](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_3_usecase_dat_ve_checkin.png)

**Hình 2.3. Biểu đồ Use Case phân rã phân hệ Đặt vé trực tuyến và Làm thủ tục chuyến bay**
*Nguồn: Tác giả phân tích và thiết kế theo chuẩn UML 2.5.*

**Bảng 2.3. Tổng hợp các ca sử dụng (Use Case) chính của hệ thống**

| Mã UC | Tên ca sử dụng (Use Case) | Tác nhân chính | Tác nhân phối hợp | Mô tả tóm tắt nội dung nghiệp vụ của ca sử dụng |
| :---: | :--- | :--- | :--- | :--- |
| **UC01** | Tra cứu chuyến bay và xem giá vé | Khách vãng lai, Hành khách | — | Người dùng nhập sân bay đi, sân bay đến, ngày đi, ngày về (nếu khứ hồi) và số lượng khách; hệ thống trả về danh sách các chuyến bay còn chỗ kèm các mức giá Phổ thông, Phổ thông đặc biệt và Thương gia. |
| **UC02** | Đặt vé máy bay trực tuyến | Khách vãng lai, Hành khách, Hội viên | Cổng thanh toán trực tuyến | Bao gồm chuỗi thao tác chọn chuyến bay, điền thông tin cá nhân của hành khách, khóa chỗ tạm thời để sinh mã đặt chỗ `PNR` (6 ký tự), thanh toán trực tuyến và nhận vé điện tử 13 chữ số. |
| **UC03** | Quản lý hồ sơ đặt chỗ (Tra cứu mã PNR) | Hành khách | Cổng thanh toán trực tuyến | Hành khách nhập mã đặt chỗ `PNR` và Họ tên để xem lại chi tiết hành trình, kiểm tra trạng thái vé điện tử, mua bổ sung hành lý ký gửi, tải hóa đơn điện tử hoặc gửi yêu cầu đổi ngày/giờ bay. |
| **UC04** | Làm thủ tục trực tuyến (Online Check-in) | Hành khách, Hội viên | Hệ thống VNeID / Sân bay | Hành khách tự làm thủ tục trước giờ bay từ 24 giờ đến 1 giờ: xác thực mã `PNR`, chọn vị trí ghế ngồi trên sơ đồ tàu bay, xác nhận quy định an ninh về vật phẩm nguy hiểm và nhận Thẻ lên máy bay điện tử (`BCBP`). |
| **UC05** | Đăng nhập và sử dụng dặm Bông Sen Vàng | Hội viên Bông Sen Vàng | — | Hội viên đăng nhập tài khoản để xem số dư dặm thưởng, tự động điền thông tin khi mua vé, quy đổi dặm thưởng lấy vé máy bay miễn phí hoặc trừ dặm kết hợp tiền mặt (*Cash & Miles*). |
| **UC06** | Quản trị lịch bay, chỗ trống và đối soát | Nhân viên, Quản trị viên | Cổng thanh toán trực tuyến | Nhân viên và quản trị viên cập nhật lịch bay thương mại, điều chỉnh số lượng ghế mở bán theo từng hạng vé, xử lý các giao dịch thanh toán treo và hỗ trợ hành khách đổi/hoàn vé. |

#### 2.2.3. Đặc tả chi tiết các ca sử dụng (Use Case Specification) trọng tâm

Theo đúng chuẩn mực phân tích thiết kế hướng đối tượng, mỗi ca sử dụng quan trọng cần được đặc tả bằng bảng quy định rõ điều kiện tiên quyết, điều kiện hoàn thành, luồng sự kiện chính (từng bước tương tác giữa Tác nhân và Hệ thống) và các luồng rẽ nhánh ngoại lệ. Dưới đây, tác giả đặc tả chi tiết hai ca sử dụng cốt lõi nhất là **UC02 (Đặt vé máy bay trực tuyến)** tại Bảng 2.4 và **UC04 (Làm thủ tục trực tuyến - Online Check-in)** tại Bảng 2.5.

**Bảng 2.4. Bảng đặc tả chi tiết ca sử dụng UC02 – Đặt vé máy bay trực tuyến**

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã và Tên Use Case** | **UC02: Đặt vé máy bay trực tuyến** |
| **Tác nhân tham gia** | Tác nhân chính: Hành khách (hoặc Khách vãng lai, Hội viên Bông Sen Vàng).<br>Tác nhân phụ: Cổng thanh toán trực tuyến (Ngân hàng VietQR / Thẻ quốc tế / Ví điện tử). |
| **Mục đích nghiệp vụ** | Giúp hành khách tự lựa chọn chuyến bay, hạng giá vé, kê khai thông tin cá nhân, giữ chỗ hợp lệ, thanh toán tiền vé trực tuyến và nhận được Mã đặt chỗ (`PNR`) kèm Vé điện tử (`13 chữ số`). |
| **Điều kiện tiên quyết (Pre-condition)** | - Thiết bị của hành khách có kết nối Internet và truy cập vào website `vietnamairlines.com` hoặc ứng dụng Vietnam Airlines.<br>- Chuyến bay khách muốn đặt vẫn còn ghế trống mở bán và chưa đóng sổ bán vé. |
| **Điều kiện kết thúc (Post-condition)** | - *Nếu thành công:* Hệ thống trừ đi số ghế tương ứng trong kho chỗ chuyến bay, chuyển trạng thái hồ sơ đặt chỗ `PNR` sang **Đã xuất vé (Ticketed)**, lưu bản ghi vé điện tử 13 chữ số vào cơ sở dữ liệu và gửi thư điện tử xác nhận hành trình cho khách.<br>- *Nếu thất bại hoặc quá hạn thanh toán:* Hệ thống tự động hủy khóa chỗ tạm thời và trả lại ghế trống vào kho chỗ của chuyến bay để khách khác có thể mua. |
| **Luồng sự kiện chính (Basic Flow)** | **Bước 1 (Tác nhân):** Hành khách nhập điểm khởi hành (ví dụ: Hà Nội - `HAN`), điểm đến (ví dụ: TP. Hồ Chí Minh - `SGN`), ngày bay, loại hành trình (Một chiều / Khứ hồi), số lượng hành khách (Người lớn, Trẻ em, Em bé) và bấm nút **"Tìm chuyến bay"**.<br>**Bước 2 (Hệ thống):** Hệ thống kiểm tra tính hợp lệ của ngày bay, truy vấn cơ sở dữ liệu lịch bay và kho ghế trống, sau đó hiển thị danh sách các chuyến bay trong ngày kèm mức giá cụ thể của từng nhóm hạng vé (*Phổ thông Tiết kiệm, Phổ thông Tiêu chuẩn, Phổ thông Linh hoạt, Thương gia*).<br>**Bước 3 (Tác nhân):** Hành khách chọn giờ bay, bấm chọn hạng giá vé mong muốn (xem rõ điều kiện hành lý xách tay, hành lý ký gửi, phí đổi/hoàn vé) và chuyển sang màn hình nhập thông tin hành khách.<br>**Bước 4 (Tác nhân):** Hành khách nhập đầy đủ Họ, Tên đệm và Tên, Ngày sinh, Số căn cước công dân/Hộ chiếu, Số thẻ Bông Sen Vàng (nếu có), Số điện thoại di động và địa chỉ Email nhận vé.<br>**Bước 5 (Hệ thống):** Hệ thống kiểm tra định dạng dữ liệu đầu vào, tính tổng số tiền phải thanh toán (gồm giá vé cơ bản + thuế giá trị gia tăng + phí phục vụ sân bay + phí dịch vụ bổ trợ), đồng thời **khóa chỗ tạm thời (trong thời hạn 15 phút)** và sinh **Mã đặt chỗ PNR gồm 6 ký tự chữ và số**.<br>**Bước 6 (Tác nhân):** Hành khách chọn phương thức thanh toán (ví dụ: Quét mã QR ngân hàng hoặc Thẻ thanh toán) và thực hiện xác nhận chuyển tiền trên ứng dụng ngân hàng.<br>**Bước 7 (Hệ thống):** Hệ thống nhận bản tin xác nhận trừ tiền thành công từ Cổng thanh toán ngân hàng, lập tức trừ chỗ chính thức, phát hành **Số vé điện tử gồm 13 chữ số (bắt đầu bằng mã 738 của Vietnam Airlines)** và hiển thị màn hình đặt vé thành công kèm gửi vé qua Email cho hành khách. |
| **Luồng sự kiện rẽ nhánh / Ngoại lệ (Alternative & Exception Flows)** | - **Ngoại lệ 2a (Hết ghế trống ở hạng giá vừa chọn):** Tại Bước 3, nếu hai hành khách cùng bấm mua chiếc ghế cuối cùng của hạng giá thấp và người kia hoàn tất khóa chỗ trước vài giây, hệ thống sẽ thông báo *"Hạng vé bạn chọn vừa hết chỗ"* và gợi ý mức giá kế tiếp còn trống trên chuyến bay.<br>- **Ngoại lệ 6a (Thanh toán thất bại hoặc quá thời hạn giữ chỗ 15 phút):** Tại Bước 6–7, nếu khách hàng bấm hủy giao dịch hoặc sau 15 phút hệ thống chưa nhận được phản hồi thanh toán thành công từ ngân hàng, hệ thống sẽ chuyển trạng thái mã `PNR` sang **Hủy giữ chỗ (Cancelled)** và giải phóng ghế trống về lại chuyến bay.<br>- **Ngoại lệ 7a (Khách đã bị trừ tiền ngân hàng nhưng bản tin xác nhận về muộn sau 15 phút):** Hệ thống ghi nhận giao dịch vào danh sách **Chờ đối soát tự động** để cấp lại vé (nếu chuyến bay còn ghế) hoặc hoàn trả 100% số tiền về tài khoản ngân hàng của hành khách. |

**Bảng 2.5. Bảng đặc tả chi tiết ca sử dụng UC04 – Làm thủ tục trực tuyến (Online Check-in)**

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã và Tên Use Case** | **UC04: Làm thủ tục trực tuyến (Online Check-in)** |
| **Tác nhân tham gia** | Tác nhân chính: Hành khách (hoặc Hội viên Bông Sen Vàng).<br>Tác nhân phụ: Hệ thống định danh điện tử VNeID và Hệ thống kiểm soát cửa sân bay. |
| **Mục đích nghiệp vụ** | Giúp hành khách đã có vé điện tử tự chọn vị trí ghế ngồi yêu thích trên tàu bay và nhận **Thẻ lên máy bay điện tử (Boarding Pass)** ngay trên điện thoại hoặc máy tính trước khi ra sân bay, không phải xếp hàng chờ đợi tại quầy thủ tục truyền thống. |
| **Điều kiện tiên quyết (Pre-condition)** | - Hành khách đã có Mã đặt chỗ `PNR` (6 ký tự) hoặc Số vé điện tử `738...` ở trạng thái **Còn hiệu lực sử dụng (Open for Use)**.<br>- Thời điểm thực hiện nằm trong khung giờ mở cổng làm thủ tục trực tuyến của Vietnam Airlines: **từ 24 giờ đến 1 giờ trước giờ khởi hành dự kiến** của chuyến bay. |
| **Điều kiện kết thúc (Post-condition)** | - Ghế ngồi được chọn trên chuyến bay chuyển sang trạng thái **Đã có khách làm thủ tục (Checked-in)**.<br>- Hệ thống cấp cho hành khách **Thẻ lên máy bay điện tử (BCBP)** có chứa số ghế (ví dụ: `15A`), số thứ tự làm thủ tục (`SEQ`), cửa ra tàu bay (`Gate`), giờ lên tàu bay và mã vạch 2 chiều (QR Code). |
| **Luồng sự kiện chính (Basic Flow)** | **Bước 1 (Tác nhân):** Hành khách chọn mục **"Làm thủ tục"** trên trang chủ `vietnamairlines.com` hoặc ứng dụng di động, nhập **Mã đặt chỗ (PNR)** (hoặc Số vé điện tử), nhập **Họ của hành khách** cùng **Điểm khởi hành** rồi bấm **"Làm thủ tục"**.<br>**Bước 2 (Hệ thống):** Hệ thống kiểm tra mã `PNR`, đối chiếu họ tên hành khách, kiểm tra trạng thái vé điện tử đã thanh toán hợp lệ và kiểm tra thời gian hiện tại nằm trong khoảng 24 giờ đến 1 giờ trước giờ bay.<br>**Bước 3 (Hệ thống):** Hệ thống hiển thị danh sách hành khách trong hồ sơ đặt chỗ, quy định an toàn hàng không về các vật phẩm cấm mang lên tàu bay (như pin sạc dự phòng không được để trong hành lý ký gửi, chất dễ cháy nổ) và tải sơ đồ ghế ngồi thực tế của loại tàu bay khai thác chuyến đó.<br>**Bước 4 (Tác nhân):** Hành khách tích chọn tên người làm thủ tục, bấm xác nhận đã đọc và tuân thủ quy định an toàn hàng không, sau đó bấm chọn vị trí ghế ngồi còn trống trên sơ đồ khoang tàu bay (ví dụ: ghế cạnh cửa sổ hoặc ghế lối đi).<br>**Bước 5 (Hệ thống):** Hệ thống khóa vị trí ghế vừa chọn cho hành khách, cấp số thứ tự làm thủ tục (`SEQ`), sinh mã vạch 2D chuẩn hàng không quốc tế và xuất **Thẻ lên máy bay điện tử**.<br>**Bước 6 (Tác nhân):** Hành khách tải Thẻ lên máy bay về điện thoại (hoặc lưu vào *Apple Wallet / Google Wallet*, gửi về Email) và đồng bộ xác thực sinh trắc học qua ứng dụng **VNeID** để đi thẳng qua cửa kiểm soát an ninh tại sân bay (nếu không có hành lý ký gửi). |
| **Luồng sự kiện rẽ nhánh / Ngoại lệ (Alternative & Exception Flows)** | - **Ngoại lệ 2a (Chưa đến giờ hoặc đã quá giờ làm thủ tục trực tuyến):** Nếu khách truy cập sớm hơn 24 giờ hoặc muộn hơn 1 giờ trước giờ khởi hành, hệ thống hiển thị thông báo rõ thời gian mở/đóng cổng làm thủ tục trực tuyến và hướng dẫn khách ra quầy thủ tục tại sân bay.<br>- **Ngoại lệ 2b (Vé chưa thanh toán hoặc đã bị đổi/hoàn):** Hệ thống từ chối làm thủ tục và thông báo trạng thái vé không hợp lệ để khách kiểm tra lại tại mục Quản lý đặt chỗ.<br>- **Ngoại lệ 4a (Hành khách đi cùng trẻ nhỏ dưới 2 tuổi hoặc yêu cầu dịch vụ trợ giúp đặc biệt như xe lăn):** Hệ thống hiển thị lưu ý an toàn, không cho phép chọn ghế tại hàng cửa thoát hiểm khẩn cấp và hướng dẫn nhân viên sân bay kiểm tra hỗ trợ trực tiếp. |


#### 2.2.4. Thiết kế biểu đồ hoạt động (Activity Diagram) và biểu đồ trình tự (Sequence Diagram)

Để minh họa trực quan luồng xử lý từng bước và các nút kiểm tra điều kiện rẽ nhánh theo đúng chuẩn quốc tế **UML 2.5**, tác giả xây dựng **Biểu đồ hoạt động (Activity Diagram)** chia làm 3 làn bơi dọc (*Swimlanes*) cho hai quy trình nghiệp vụ cốt lõi: quy trình Đặt vé và thanh toán trực tuyến (Hình 2.4) và quy trình Làm thủ tục trực tuyến (Hình 2.5).

![Hình 2.4. Biểu đồ hoạt động (Activity Diagram) quy trình tìm chuyến bay, đặt vé và thanh toán trực tuyến](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_4_activity_dat_ve.png)

**Hình 2.4. Biểu đồ hoạt động (Activity Diagram) quy trình tìm chuyến bay, đặt vé và thanh toán trực tuyến**
*Nguồn: Tác giả phân tích và thiết kế theo chuẩn UML 2.5.*

Trên Hình 2.4, luồng hoạt động bắt đầu từ nút tròn đen đặc bên làn *Hành khách* khi người dùng nhập điểm đi, điểm đến, ngày bay và số lượng khách. Hệ thống đặt vé của Vietnam Airlines tiến hành truy vấn lịch bay và kiểm tra điều kiện tại hình thoi thứ nhất: nếu `[Hết chỗ]` thì quay lại bước nhập ngày bay hoặc hành trình khác; nếu `[Còn chỗ]` thì hiển thị danh sách chuyến bay và mức giá. Sau khi hành khách chọn chuyến bay và điền thông tin cá nhân, hệ thống thực hiện bước nghiệp vụ rất quan trọng là **Khóa chỗ tạm thời và tạo hồ sơ đặt chỗ (Mã PNR 6 ký tự)** rồi chuyển yêu cầu sang làn *Cổng thanh toán ngân hàng*. Tại hình thoi kiểm tra thanh toán thứ hai: nếu giao dịch `[Thất bại / Quá hạn]` (quá 15 phút giữ chỗ), hệ thống tự động hủy giữ chỗ và trả lại ghế trống vào kho chỗ; ngược lại, nếu `[Thành công]`, hệ thống trừ chỗ chính thức, phát hành **Vé điện tử 13 chữ số** gửi cho hành khách và kết thúc tại nút tròn hai vòng (mắt bò).

![Hình 2.5. Biểu đồ hoạt động (Activity Diagram) quy trình làm thủ tục trực tuyến (Online Check-in)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_5_activity_checkin.png)

**Hình 2.5. Biểu đồ hoạt động (Activity Diagram) quy trình làm thủ tục trực tuyến (Online Check-in)**
*Nguồn: Tác giả phân tích và thiết kế theo chuẩn UML 2.5.*

Trên Hình 2.5, quy trình làm thủ tục trực tuyến kiểm tra chặt chẽ điều kiện hợp lệ của mã đặt chỗ `PNR` và khung giờ mở thủ tục (từ 24 giờ đến 1 giờ trước giờ khởi hành). Điểm đáng chú ý về mặt kỹ thuật UML trên Hình 2.5 là sau khi hệ thống gán số ghế chính thức và phát hành Thẻ lên máy bay (`BCBP`), luồng xử lý đi qua **Thanh đồng bộ chia nhánh (Fork bar)** để thực hiện song song hai luồng công việc: một luồng gửi thẻ lên máy bay về điện thoại của hành khách để lưu trữ hoặc in tại quầy tự động; luồng còn lại đồng bộ tức thời dữ liệu thẻ bay sang *Hệ thống VNeID và cổng kiểm soát an ninh sân bay*, trước khi hợp nhất lại tại **Thanh đồng bộ gộp nhánh (Join bar)** để hoàn tất quy trình.

Tiếp theo, để làm rõ thứ tự truyền thông điệp gọi hàm giữa các đối tượng phần mềm bên trong hệ thống theo thời gian thực, tác giả xây dựng hai **Biểu đồ trình tự (Sequence Diagram)** áp dụng mẫu kiến trúc hướng đối tượng chuẩn **Boundary – Control – Entity (BCE)** tại Hình 2.6 và Hình 2.7.

![Hình 2.6. Biểu đồ trình tự (Sequence Diagram) ca sử dụng Đặt vé và thanh toán trực tuyến](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_6_sequence_dat_ve.png)

**Hình 2.6. Biểu đồ trình tự (Sequence Diagram) ca sử dụng Đặt vé và thanh toán trực tuyến**
*Nguồn: Tác giả phân tích và thiết kế theo chuẩn UML 2.5.*

Trên Hình 2.6, 6 đối tượng tham gia tương tác được bố trí từ trái sang phải đúng chuẩn ký hiệu UML: Tác nhân `:Hành khách`, Lớp biên giao diện `:GiaoDienDatVe`, Lớp điều khiển nghiệp vụ `:DieuKhienDatCho`, hai Lớp thực thể dữ liệu `:ChuyenBay`, `:HoSoDatCho` và hệ thống `:CSDL và ThanhToan`. Các mũi tên nét liền thể hiện lời gọi hàm đồng bộ từ bước `1: nhapHanhTrinh(diemDi, diemDen)` cho tới bước `8: khoaChoTamVaSinhMaPNR()` và bước `12: xuLyGiaoDichThanhToan(maPNR, soTien)`. Các mũi tên nét đứt thể hiện dữ liệu trả về. Đặc biệt, khung tương tác `alt` ở nửa dưới biểu đồ thể hiện rõ hai nhánh kết quả: nhánh `[Thanh toán thành công]` thực hiện bước 13 đến bước 16 để trừ chỗ chính thức và xuất vé điện tử 13 chữ số; còn nhánh `[Thanh toán thất bại hoặc quá hạn giữ chỗ]` thực hiện bước 17 và 18 để hủy giữ chỗ tạm thời và giải phóng ghế trống.

![Hình 2.7. Biểu đồ trình tự (Sequence Diagram) ca sử dụng Làm thủ tục trực tuyến (Check-in)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_7_sequence_checkin.png)

**Hình 2.7. Biểu đồ trình tự (Sequence Diagram) ca sử dụng Làm thủ tục trực tuyến (Check-in)**
*Nguồn: Tác giả phân tích và thiết kế theo chuẩn UML 2.5.*

Tương tự, Hình 2.7 mô tả trình tự 14 thông điệp tương tác của ca sử dụng Làm thủ tục trực tuyến giữa `:Hành khách`, lớp giao diện `:GiaoDienCheckIn`, lớp điều khiển `:DieuKhienThuTuc`, lớp thực thể `:HoSoDatCho`, `:SoDoGheTauBay` và `:TheLenMayBay`. Nhờ tách bạch rõ lớp Giao diện (*Boundary*), lớp Điều khiển (*Control*) và lớp Thực thể (*Entity*), hệ thống có thể dễ dàng nâng cấp giao diện trang web hoặc ứng dụng di động mà không làm ảnh hưởng đến quy tắc kiểm tra vé và gán ghế ở tầng điều khiển bên dưới.

#### 2.2.5. Thiết kế biểu đồ lớp thực thể miền (Domain Class Diagram)

Để tổng hợp cấu trúc tĩnh của toàn bộ các đối tượng nghiệp vụ trong hệ thống theo đúng phương pháp hướng đối tượng, tác giả xây dựng **Biểu đồ lớp thực thể miền (Domain Class Diagram)** tại Hình 2.8. Mỗi lớp trên biểu đồ đều được thiết kế chuẩn 3 ngăn (Tên lớp, Danh sách thuộc tính với phạm vi truy cập `-` private kèm kiểu dữ liệu, và Danh sách phương thức xử lý với phạm vi `+` public), đồng thời chỉ rõ bội số quan hệ (`1`, `0..1`, `1..*`, `0..*`), quan hệ hợp thành (hình thoi đen đặc) và quan hệ kế thừa (mũi tên tam giác rỗng).

![Hình 2.8. Biểu đồ lớp thực thể miền (Class Diagram) của Hệ thống đặt vé và làm thủ tục Vietnam Airlines](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_8_class_diagram.png)

**Hình 2.8. Biểu đồ lớp thực thể miền (Class Diagram) của Hệ thống đặt vé và làm thủ tục Vietnam Airlines**
*Nguồn: Tác giả phân tích và thiết kế theo chuẩn UML 2.5.*

Từ Hình 2.8, mối liên hệ lô-gíc giữa 8 lớp đối tượng cốt lõi trong miền nghiệp vụ hàng không của Vietnam Airlines được giải thích rõ ràng như sau:
1. **Lớp `ChuyenBay` và lớp `GheTrenChuyenBay` (Quan hệ hợp thành `1 — 1..n`):** Một chuyến bay cụ thể (ví dụ chuyến `VN213` ngày `15/06/2026`) bao gồm nhiều vị trí ghế ngồi trên chuyến bay đó (`GheTrenChuyenBay`). Đây là quan hệ hợp thành chặt chẽ (ký hiệu hình thoi đen đặc gắn ở đầu lớp `ChuyenBay`) vì nếu chuyến bay bị hủy bỏ khỏi lịch khai thác thì danh sách ghế trống của chuyến bay đó cũng không tồn tại độc lập.
2. **Lớp `HanhKhach` và lớp `HoiVienBongSenVang` (Quan hệ kế thừa):** Lớp `HoiVienBongSenVang` kế thừa (mũi tên tam giác rỗng) toàn bộ các thuộc tính nhân thân (`maHanhKhach`, `hoVaTen`, `ngaySinh`, `soGiayToTuyThan`, `soDienThoai`, `email`) của lớp `HanhKhach`, đồng thời bổ sung thêm các thuộc tính và phương thức riêng của khách hàng thân thiết (`soTheHoiVien`, `hangThe`, `soDamTichLuy`, `congDamThuong()`, `quyDoiDamThuong()`).
3. **Lớp `HoSoDatCho` và lớp `VeDienTu` (Quan hệ hợp thành `1 — 1..n`):** Khi một khách hàng đặt vé cho bản thân hoặc cho một nhóm người đi cùng nhau trong một lần giao dịch, hệ thống tạo ra duy nhất 1 hồ sơ đặt chỗ (`HoSoDatCho` mang mã `maPNR` 6 ký tự). Bên trong 1 hồ sơ `HoSoDatCho` đó có thể chứa từ 1 đến nhiều `VeDienTu` (mỗi hành khách trong đoàn được cấp 1 số vé điện tử 13 chữ số riêng biệt).
4. **Lớp `HoSoDatCho` và lớp `GiaoDichThanhToan` (Quan hệ kết hợp `1 — 0..n`):** Một hồ sơ đặt chỗ có thể chưa có giao dịch thanh toán nào (khi khách đang ở bước giữ chỗ tạm thời `0`) hoặc có một hay nhiều lần giao dịch thanh toán (`0..n`, ví dụ lần đầu quét thẻ bị lỗi hạn mức, lần thứ hai quét mã QR thành công, hoặc thanh toán bổ sung khi mua thêm hành lý).
5. **Lớp `GheTrenChuyenBay`, `VeDienTu` và `TheLenMayBay` (Quan hệ `1 — 0..1`):** Mỗi chiếc vé điện tử hợp lệ được gắn với 1 vị trí ghế trên chuyến bay và khi hành khách hoàn tất thủ tục trực tuyến (Check-in), chiếc vé điện tử đó sẽ sinh ra tối đa 1 thẻ lên máy bay (`TheLenMayBay` chứa mã vạch 2D `maVach2D` và cửa ra tàu bay `cuaRaTauBay`).

### 2.3. Thiết kế cơ sở dữ liệu, kiến trúc vật lý và giao diện thực tế (Mô hình vật lý và mô hình ngoài)

#### 2.3.1. Thiết kế lược đồ cơ sở dữ liệu quan hệ đạt dạng chuẩn 3 (3NF Crow's Foot ERD)

Chuyển từ mô hình lô-gíc hướng đối tượng sang **Mô hình vật lý trong**, các lớp thực thể miền tại Hình 2.8 được ánh xạ thành hệ thống các bảng cơ sở dữ liệu quan hệ. Để đảm bảo cơ sở dữ liệu không bị trùng lặp thông tin và không xảy ra dị thường khi thêm, sửa, xóa dữ liệu, toàn bộ các bảng được tác giả chuẩn hóa đạt **Dạng chuẩn 3 (3NF - Third Normal Form)**:
- *Đạt dạng chuẩn 1 (1NF):* Tất cả các cột thuộc tính trong bảng đều chứa giá trị nguyên tố đơn lẻ (không có cột nào chứa danh sách nhiều số ghế hay nhiều số vé gộp chung trong một ô), và mỗi bảng đều có khóa chính (`PK`) định danh duy nhất từng dòng.
- *Đạt dạng chuẩn 2 (2NF):* Mọi thuộc tính không khóa trong bảng đều phụ thuộc hàm đầy đủ vào toàn bộ khóa chính, không phụ thuộc bộ phận.
- *Đạt dạng chuẩn 3 (3NF):* Loại bỏ hoàn toàn các phụ thuộc bắc cầu giữa các cột không khóa (ví dụ: thông tin họ tên, số căn cước của hành khách được tách riêng ra bảng `HANH_KHACH` và chỉ liên kết vào bảng `VE_DIEN_TU` qua khóa ngoại `ma_hanh_khach`, nhờ đó một hành khách bay 10 chuyến trong năm không phải lưu lặp lại 10 lần thông tin cá nhân).

Hình 2.9 trình bày **Lược đồ quan hệ cơ sở dữ liệu (ERD)** sử dụng đúng chuẩn ký hiệu chân quạ quốc tế (**Crow's Foot Notation**).

![Hình 2.9. Lược đồ quan hệ cơ sở dữ liệu đạt dạng chuẩn 3 (3NF - Crow's Foot ERD)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_9_erd_csdl.png)

**Hình 2.9. Lược đồ quan hệ cơ sở dữ liệu đạt dạng chuẩn 3 (3NF - Crow's Foot ERD)**
*Nguồn: Tác giả thiết kế và chuẩn hóa theo ký hiệu Crow's Foot quốc tế.*

Cấu trúc chi tiết các cột thuộc tính, kiểu dữ liệu vật lý và ràng buộc khóa chính (`PK`), khóa ngoại (`FK`) của các bảng dữ liệu trọng tâm được đặc tả tại Bảng 2.6.

**Bảng 2.6. Đặc tả cấu trúc các bảng dữ liệu vật lý cốt lõi của hệ thống**

| Tên bảng vật lý | Tên cột thuộc tính | Kiểu dữ liệu | Ràng buộc khóa | Mô tả ý nghĩa lưu trữ nghiệp vụ |
| :--- | :--- | :--- | :---: | :--- |
| **1. CHUYEN_BAY** | `ma_chuyen_bay` | `VARCHAR(10)` | **PK** | Mã định danh chuyến bay theo ngày (VD: `VN213_260615`) |
| | `san_bay_di` | `CHAR(3)` | `NOT NULL` | Mã sân bay khởi hành chuẩn 3 ký tự (VD: `HAN`, `SGN`, `DAD`) |
| | `san_bay_den` | `CHAR(3)` | `NOT NULL` | Mã sân bay đến chuẩn 3 ký tự (VD: `SGN`, `NRT`, `CDG`) |
| | `gio_khoi_hanh` | `DATETIME` | `NOT NULL` | Ngày và giờ cất cánh dự kiến theo lịch thương mại |
| | `loai_tau_bay` | `VARCHAR(20)` | `NOT NULL` | Dòng tàu bay khai thác (VD: `Boeing 787`, `Airbus A350`, `A321`) |
| | `trang_thai` | `VARCHAR(20)` | `NOT NULL` | Trạng thái chuyến bay (`Đang mở bán`, `Đóng quầy`, `Đã cất cánh`) |
| **2. GHE_CHUYEN_BAY** | `ma_ghe_chuyen` | `VARCHAR(16)` | **PK** | Mã định danh duy nhất của ghế trên chuyến bay |
| | `ma_chuyen_bay` | `VARCHAR(10)` | **FK** | Tham chiếu tới bảng `CHUYEN_BAY(ma_chuyen_bay)` |
| | `so_ghe` | `VARCHAR(5)` | `NOT NULL` | Số hiệu hàng và cột ghế trong khoang (VD: `02A`, `15C`, `28G`) |
| | `hang_ghe` | `CHAR(1)` | `NOT NULL` | Hạng khoang ghế (`C`: Thương gia, `W`: Phổ thông đặc biệt, `Y`: Phổ thông) |
| | `gia_co_ban` | `DECIMAL(12,0)` | `NOT NULL` | Mức giá vé cơ bản niêm yết của hạng ghế (VNĐ) |
| | `trang_thai_ghe` | `VARCHAR(15)` | `NOT NULL` | Trạng thái ghế (`Trống`, `Tạm khóa 15p`, `Đã bán`, `Đã làm thủ tục`) |
| **3. HANH_KHACH** | `ma_hanh_khach` | `VARCHAR(12)` | **PK** | Mã định danh hành khách trong cơ sở dữ liệu |
| | `ho_va_ten` | `NVARCHAR(100)`| `NOT NULL` | Họ, tên đệm và tên đầy đủ của hành khách |
| | `ngay_sinh` | `DATE` | `NOT NULL` | Ngày tháng năm sinh để phân biệt Người lớn, Trẻ em, Em bé |
| | `so_cccd_ho_chieu`| `VARCHAR(20)` | `NOT NULL` | Số Căn cước công dân (12 số) hoặc số Hộ chiếu |
| | `so_dien_thoai` | `VARCHAR(15)` | `NOT NULL` | Số điện thoại di động nhận tin nhắn thông báo giờ bay và mã OTP |
| | `so_the_bsv` | `VARCHAR(16)` | `NULL` | Mã số thẻ Hội viên Bông Sen Vàng (nếu là hội viên) |
| **4. HO_SO_DAT_CHO** | `ma_pnr` | `CHAR(6)` | **PK** | Mã đặt chỗ gồm 6 ký tự chữ và số (VD: `VN8K2P`) |
| | `ma_hanh_khach_lh`| `VARCHAR(12)` | **FK** | Người đại diện liên hệ đặt chỗ, tham chiếu `HANH_KHACH` |
| | `ngay_tao` | `DATETIME` | `NOT NULL` | Thời điểm khởi tạo hồ sơ đặt chỗ |
| | `han_giu_cho` | `DATETIME` | `NOT NULL` | Thời điểm hết hạn giữ chỗ tạm thời (thường sau 15 phút) |
| | `tong_tien` | `DECIMAL(12,0)` | `NOT NULL` | Tổng số tiền vé, thuế phí và hành lý của toàn bộ hồ sơ PNR |
| | `trang_thai_pnr` | `VARCHAR(15)` | `NOT NULL` | Trạng thái hồ sơ (`Đang giữ chỗ`, `Đã xuất vé`, `Đã hủy`) |
| **5. VE_DIEN_TU** | `so_ve_13_so` | `CHAR(13)` | **PK** | Số vé điện tử chuẩn 13 chữ số bắt đầu bằng `738` |
| | `ma_pnr` | `CHAR(6)` | **FK** | Tham chiếu tới bảng `HO_SO_DAT_CHO(ma_pnr)` |
| | `ma_hanh_khach` | `VARCHAR(12)` | **FK** | Tham chiếu tới bảng `HANH_KHACH(ma_hanh_khach)` |
| | `ma_ghe_chuyen` | `VARCHAR(16)` | **FK** | Tham chiếu tới bảng `GHE_CHUYEN_BAY(ma_ghe_chuyen)` |
| | `hanh_ly_kg` | `INT` | `DEFAULT 0`| Tiêu chuẩn hành lý ký gửi đi kèm vé (VD: `23` kg, `32` kg) |
| | `trang_thai_ve` | `VARCHAR(15)` | `NOT NULL` | Trạng thái sử dụng (`Mở chờ bay`, `Đã làm thủ tục`, `Đã bay`, `Đã hoàn`) |
| **6. GIAO_DICH_TT** | `ma_giao_dich` | `VARCHAR(20)` | **PK** | Mã giao dịch thanh toán duy nhất đối soát với ngân hàng |
| | `ma_pnr` | `CHAR(6)` | **FK** | Tham chiếu tới bảng `HO_SO_DAT_CHO(ma_pnr)` |
| | `phuong_thuc` | `VARCHAR(30)` | `NOT NULL` | Kênh thanh toán (`VietQR`, `Thẻ nội địa NAPAS`, `Visa/Master`, `Ví`) |
| | `so_tien` | `DECIMAL(12,0)` | `NOT NULL` | Số tiền thực tế đã khấu trừ của giao dịch |
| | `ket_qua_tt` | `VARCHAR(15)` | `NOT NULL` | Kết quả (`Thành công`, `Thất bại`, `Chờ đối soát hoàn tiền`) |
| **7. THE_LEN_MAY_BAY**| `ma_the_bay` | `VARCHAR(16)` | **PK** | Mã định danh thẻ lên máy bay điện tử |
| | `so_ve_13_so` | `CHAR(13)` | **FK, UNIQUE**| Tham chiếu 1–1 tới bảng `VE_DIEN_TU(so_ve_13_so)` |
| | `so_thu_tu_seq` | `INT` | `NOT NULL` | Số thứ tự làm thủ tục trên chuyến bay (VD: `SEQ 042`) |
| | `cua_ra_tau_bay` | `VARCHAR(10)` | `NOT NULL` | Số hiệu cửa khởi hành tại nhà ga sân bay (VD: `Gate 06`) |
| | `ma_vach_bcbp` | `VARCHAR(255)` | `NOT NULL` | Chuỗi dữ liệu mã hóa trong mã vạch 2D để quét tại cổng an ninh |

#### 2.3.2. Kiến trúc triển khai vật lý 3 tầng (3-Tier Architecture)

Để vận hành cơ sở dữ liệu trên một cách an toàn và phục vụ đồng thời hàng chục nghìn người dùng từ nhiều thiết bị khác nhau, hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines được triển khai theo **Kiến trúc vật lý 3 tầng (3-Tier Architecture)** chuẩn mực (Hình 2.10).

![Hình 2.10. Sơ đồ kiến trúc triển khai hệ thống 3 tầng (3-Tier Architecture)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_2_10_kien_truc_he_thong.png)

**Hình 2.10. Sơ đồ kiến trúc triển khai hệ thống 3 tầng (3-Tier Architecture)**
*Nguồn: Tác giả tổng hợp và mô hình hóa kiến trúc triển khai hệ thống.*

Cấu trúc 3 tầng trên Hình 2.10 đảm bảo tính tách biệt và an toàn cao:
- **Tầng 1 – Tầng giao diện người dùng (Client / Presentation Tier):** Bao gồm trình duyệt web trên máy tính/điện thoại truy cập `vietnamairlines.com`, ứng dụng di động *Vietnam Airlines* trên iOS/Android và màn hình cảm ứng tại các quầy làm thủ tục tự động (*Kiosk Check-in*) ở sân bay. Tầng này chỉ làm nhiệm vụ hiển thị biểu mẫu và tiếp nhận thao tác của người dùng, tuyệt đối không kết nối trực tiếp vào cơ sở dữ liệu gốc.
- **Tầng 2 – Tầng xử lý nghiệp vụ (Application / Business Logic Tier):** Mọi yêu cầu từ Tầng 1 gửi về qua giao thức mã hóa `HTTPS` và `REST API` đều phải đi qua Cổng điều phối và cân bằng tải trước khi vào các phân hệ xử lý nghiệp vụ (Phân hệ Đặt chỗ và Giá vé; Phân hệ Xuất vé và Thanh toán; Phân hệ Làm thủ tục và Hội viên). Tầng này thực thi toàn bộ các quy tắc kiểm tra chỗ trống, tính thuế phí, khóa chỗ 15 phút và cấp số ghế.
- **Tầng 3 – Tầng dữ liệu và liên thông (Data & Integration Tier):** Đặt trong vùng mạng nội bộ được bảo vệ nghiêm ngặt bằng tường lửa, nơi lưu trữ Cơ sở dữ liệu Đặt chỗ & Lịch bay, Cơ sở dữ liệu Khách hàng & Hội viên, đồng thời kết nối qua kênh truyền bảo mật tới các cổng thanh toán ngân hàng, hệ thống định danh điện tử VNeID và hệ thống cửa kiểm soát sân bay.

#### 2.3.3. Mô hình ngoài: Khảo sát giao diện thực tế và ma trận phân quyền người dùng (RBAC)

Xét theo **Mô hình ngoài (External Model)** — tức bề mặt giao tiếp trực tiếp giữa hệ thống với con người — tác giả đã tiến hành khảo sát và chụp lại các màn hình giao diện thực tế đang vận hành công khai trên cổng thông tin `https://www.vietnamairlines.com` trong năm 2026.

Trên Hình 2.11 là giao diện màn hình Trang chủ với khung công cụ **Mua vé trực tuyến**. Giao diện được thiết kế theo tông màu xanh thanh lịch và vàng sen đặc trưng của hãng, cho phép khách hàng chọn nhanh hành trình (Khứ hồi, Một chiều, Nhiều chặng), chọn điểm đi, điểm đến, ngày bay từ bảng lịch trực quan và số lượng hành khách.

![Hình 2.11. Giao diện thực tế chức năng Tìm kiếm chuyến bay và Đặt vé trên trang chủ Vietnam Airlines](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/screenshots/ui_01_trang_chu_tim_chuyen_bay.png)

**Hình 2.11. Giao diện thực tế chức năng Tìm kiếm chuyến bay và Đặt vé trên trang chủ Vietnam Airlines**
*Nguồn: Ảnh chụp màn hình thực tế tại https://www.vietnamairlines.com (năm 2026).*

Khi hành khách đã mua vé thành công và muốn kiểm tra lại hành trình, mua thêm hành lý ký gửi hoặc đổi giờ bay, người dùng chuyển sang thẻ **Quản lý đặt chỗ** (Hình 2.12). Tại đây, hệ thống yêu cầu nhập chính xác **Mã đặt chỗ (PNR)** gồm 6 ký tự (hoặc Số vé điện tử 13 chữ số) kèm theo **Họ của hành khách** để tra cứu hồ sơ.

![Hình 2.12. Giao diện thực tế chức năng Quản lý đặt chỗ (Tra cứu hồ sơ PNR và Vé điện tử)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/screenshots/ui_02_quan_ly_dat_cho_pnr.png)

**Hình 2.12. Giao diện thực tế chức năng Quản lý đặt chỗ (Tra cứu hồ sơ PNR và Vé điện tử)**
*Nguồn: Ảnh chụp màn hình thực tế tại https://www.vietnamairlines.com (năm 2026).*

Trong khoảng thời gian từ 24 giờ đến 1 giờ trước giờ cất cánh, hành khách bấm sang thẻ **Làm thủ tục** (Hình 2.13) để tự chọn ghế ngồi và lấy thẻ lên máy bay trực tuyến bằng cách nhập Mã đặt chỗ (`PNR`), Họ và Điểm khởi hành.

![Hình 2.13. Giao diện thực tế chức năng Làm thủ tục trực tuyến (Online Check-in)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/screenshots/ui_03_lam_thu_tuc_truc_tuyen.png)

**Hình 2.13. Giao diện thực tế chức năng Làm thủ tục trực tuyến (Online Check-in)**
*Nguồn: Ảnh chụp màn hình thực tế tại https://www.vietnamairlines.com (năm 2026).*

Đối với nhóm tác nhân là *Hội viên Bông Sen Vàng*, hệ thống cung cấp màn hình **Đăng nhập tài khoản hội viên** riêng biệt (Hình 2.14), hỗ trợ đăng nhập bằng Số thẻ hội viên, địa chỉ Email hoặc Số điện thoại kèm mật khẩu và mã xác thực OTP để quản lý dặm thưởng.

![Hình 2.14. Giao diện thực tế màn hình Đăng nhập dành cho Hội viên Bông Sen Vàng (Lotusmiles)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/screenshots/ui_04_dang_nhap_bong_sen_vang.png)

**Hình 2.14. Giao diện thực tế màn hình Đăng nhập dành cho Hội viên Bông Sen Vàng (Lotusmiles)**
*Nguồn: Ảnh chụp màn hình thực tế tại https://www.vietnamairlines.com (năm 2026).*

Để kiểm soát chặt chẽ việc ai được phép thực hiện thao tác nào trên các màn hình giao diện và bảng cơ sở dữ liệu nêu trên, hệ thống áp dụng **Cơ chế phân quyền truy cập dựa trên vai trò (RBAC - Role-Based Access Control)**. Bảng 2.7 trình bày ma trận phân quyền chi tiết giữa 5 nhóm người dùng đối với các chức năng nghiệp vụ của hệ thống.

**Bảng 2.7. Ma trận phân quyền truy cập hệ thống theo vai trò người dùng (RBAC)**

| Chức năng nghiệp vụ / Tài nguyên dữ liệu | Khách vãng lai | Hành khách (Có mã PNR) | Hội viên Bông Sen Vàng | Nhân viên bán vé & Mặt đất | Quản trị viên hệ thống |
| :--- | :---: | :---: | :---: | :---: | :---: |
| 1. Tra cứu lịch bay, xem giá vé và điều kiện vé | Xem | Xem | Xem | Xem | Toàn quyền |
| 2. Khởi tạo đặt chỗ mới và thanh toán trực tuyến | Tạo mới | Tạo mới | Tạo mới | Tạo hộ khách | Giám sát |
| 3. Xem chi tiết hồ sơ đặt chỗ (`PNR`) và tải vé điện tử | Không | Chỉ hồ sơ của mình | Chỉ hồ sơ của mình | Tra cứu theo chuyến | Toàn quyền |
| 4. Mua thêm hành lý, chọn ghế ngồi, đổi chuyến bay | Không | Sửa hồ sơ của mình | Sửa hồ sơ của mình | Xử lý tại quầy / Tổng đài | Toàn quyền |
| 5. Làm thủ tục trực tuyến (Check-in) và lấy thẻ bay | Không | Thực hiện (24h–1h) | Thực hiện & Ưu tiên ghế | Làm thủ tục tại sân bay | Giám sát |
| 6. Tích lũy dặm, quy đổi dặm thưởng lấy vé máy bay | Không | Không | Thực hiện (Có mã OTP) | Hỗ trợ tra cứu | Cấu hình quy tắc |
| 7. Cấu hình lịch bay, kho ghế mở bán và đối soát tiền | Không | Không | Không | Xem báo cáo ca trực | Toàn quyền |

---

## CHƯƠNG III: ĐÁNH GIÁ THỰC TRẠNG VÀ NHẬN DIỆN RỦI RO CỦA HỆ THỐNG THÔNG TIN ĐẶT VÉ VÀ LÀM THỦ TỤC TRỰC TUYẾN VIETNAM AIRLINES

### 3.1. Đánh giá hệ thống theo 8 đặc tính chất lượng thông tin và kết quả khảo sát 150 người dùng

#### 3.1.1. Đánh giá thực trạng chất lượng thông tin của hệ thống theo 8 đặc tính lý thuyết

Đối chiếu hoạt động thực tế của Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines với **8 đặc tính của thông tin có giá trị** đã trình bày ở Chương I, tác giả rút ra bảng đánh giá toàn diện tại Bảng 3.1.

**Bảng 3.1. Đánh giá thực trạng hệ thống đặt vé và làm thủ tục Vietnam Airlines theo 8 đặc tính chất lượng thông tin**

| STT | Đặc tính thông tin | Biểu hiện đạt được trong thực tế tại Vietnam Airlines | Hạn chế còn tồn tại cần khắc phục | Mức đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Tính chính xác (Accurate)** | Số tiền vé, thuế phí sân bay, giờ khởi hành, số hiệu chuyến bay và họ tên hành khách trên vé điện tử 13 chữ số được tính toán chính xác, khớp hoàn toàn với biểu giá công bố. | Khi hãng thay đổi loại tàu bay đột xuất (ví dụ đổi từ tàu Airbus A350 sang Boeing 787 có cấu hình hàng ghế khác nhau), số ghế khách đã chọn trước đôi khi bị xếp lại chưa khớp vị trí cũ. | **Tốt** |
| **2** | **Tính đầy đủ (Complete)** | Hiển thị đầy đủ các thành phần giá vé (giá net, thuế VAT, phí soi chiếu an ninh, phí sân bay), tiêu chuẩn hành lý xách tay, hành lý ký gửi và điều kiện hoàn/đổi vé. | Thông tin hướng dẫn chi tiết về quy trình hoàn tiền vé và thời gian tiền về tài khoản ngân hàng khi khách tự hủy vé trên ứng dụng còn ngắn gọn, chưa hiển thị tiến độ xử lý từng bước. | **Khá - Tốt** |
| **3** | **Tính kịp thời (Timely)** | Thông thường, mã đặt chỗ `PNR` và vé điện tử được gửi về Email chỉ sau 5–10 giây kể từ lúc thanh toán thành công; thông báo thay đổi cửa ra tàu bay (`Gate`) được đẩy nhanh qua ứng dụng. | Vào dịp cao điểm săn vé Tết hoặc khuyến mãi lớn, tốc độ phản hồi khi chuyển từ bước chọn chuyến sang bước nhập tên bị chậm; đôi khi bản tin xác nhận trừ tiền QR ngân hàng về trễ sau 15 phút gây treo vé. | **Khá** |
| **4** | **Tính phù hợp (Relevant)** | Giao diện tự động lọc đúng các chuyến bay theo chặng và ngày khách chọn; tài khoản Hội viên Bông Sen Vàng hiển thị đúng hạng thẻ và ưu đãi phòng chờ tương ứng. | Một số thông báo quảng cáo dịch vụ bổ trợ (bảo hiểm du lịch, xe đưa đón sân bay) xuất hiện khá nhiều trong luồng đặt vé khiến hành khách lớn tuổi dễ bấm nhầm. | **Khá - Tốt** |
| **5** | **Tính dễ tiếp cận (Accessible)** | Hỗ trợ đa nền tảng (máy tính, điện thoại, máy tính bảng, Kiosk sân bay), hỗ trợ tiếng Việt và nhiều ngoại ngữ (Anh, Pháp, Nhật, Hàn, Trung) cho khách quốc tế. | Quy trình đặt vé và làm thủ tục có nhiều bước xác nhận; chữ hiển thị điều kiện vé trên màn hình điện thoại nhỏ đôi khi còn dày, gây khó khăn cho người lần đầu tự đặt vé. | **Khá** |
| **6** | **Tính an toàn và bảo mật (Secure)** | Toàn bộ đường truyền được mã hóa `HTTPS`, thanh toán thẻ áp dụng xác thực `3D-Secure`, đăng nhập hội viên và đổi dặm thưởng đều bắt buộc nhập mã xác thực `OTP`. | Chức năng **Quản lý đặt chỗ** và **Làm thủ tục** hiện chỉ yêu cầu nhập `Mã PNR (6 ký tự)` + `Họ hành khách` mà chưa yêu cầu mã OTP, dễ bị người lạ xem trộm nếu khách đăng ảnh vé lên mạng xã hội. | **Khá** |
| **7** | **Tính có kiểm chứng (Verifiable)** | Mỗi vé bán ra đều gắn với mã `PNR` 6 ký tự, số vé điện tử 13 chữ số (`738...`) và hóa đơn điện tử có mã của cơ quan thuế, dễ dàng tra cứu và đối chiếu lại. | Hành khách chưa thể tự tra cứu lịch sử chi tiết các lần thay đổi trạng thái thanh toán ngay trên màn hình ứng dụng mà phải gọi tổng đài `1900 1100` để nhân viên kiểm tra hộ. | **Tốt** |
| **8** | **Tính khách quan (Objective)** | Thứ tự hiển thị chuyến bay và mức giá mở bán hoàn toàn tự động theo số lượng ghế trống thực tế trong cơ sở dữ liệu, không có sự can thiệp cảm tính. | Khi hệ thống tự động đóng hạng vé giá rẻ do vừa bán hết ghế, giao diện chưa hiển thị rõ số lượng ghế còn lại trước đó nên một số khách hàng hiểu lầm là hãng tự ý tăng giá. | **Tốt** |

#### 3.1.2. Kết quả khảo sát định lượng 150 người sử dụng về 5 thành phần hệ thống

Để có căn cứ thực tiễn khách quan bên cạnh việc phân tích lý thuyết, tác giả đã thiết kế bảng hỏi khảo sát (chi tiết tại Phụ lục 1) và tiến hành thu thập ý kiến của **N = 150 người sử dụng** đã từng trực tiếp đặt vé và làm thủ tục trực tuyến trên hệ thống của Vietnam Airlines trong giai đoạn 2025–2026. Trong 150 người tham gia khảo sát có 68 hành khách thường xuyên đi công tác (chiếm 45,3%), 52 hành khách đi du lịch/thăm thân (chiếm 34,7%), 18 hội viên Bông Sen Vàng hạng Vàng/Bạch Kim (chiếm 12,0%) và 12 nhân viên bán vé/phục vụ mặt đất (chiếm 8,0%).

Bảng hỏi sử dụng thang đo Likert 5 mức độ (1 điểm: *Rất không hài lòng*, 2 điểm: *Không hài lòng*, 3 điểm: *Bình thường*, 4 điểm: *Hài lòng*, 5 điểm: *Rất hài lòng*) xoay quanh 5 nhóm tiêu chí tương ứng với **5 thành phần của hệ thống thông tin**. Kết quả thống kê điểm trung bình và tỷ lệ hài lòng được tổng hợp tại Bảng 3.2 và biểu diễn trực quan trên Hình 3.1.

**Bảng 3.2. Tổng hợp kết quả khảo sát 150 người dùng đánh giá 5 thành phần của hệ thống Vietnam Airlines**

| Nhóm thành phần HTTT | Các tiêu chí khảo sát cụ thể trong từng thành phần | Điểm trung bình (Thang 5,0) | Tỷ lệ đánh giá Tốt (Mức 4 & 5) | Tỷ lệ phàn nàn / Cần cải thiện (Mức 1 & 2) | Nhận xét trọng tâm từ người dùng thực tế |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **1. Hạ tầng phần cứng & thiết bị sân bay** | - Tốc độ đáp ứng của máy chủ khi truy cập ngày thường.<br>- Độ nhạy màn hình và máy in của quầy Kiosk Check-in.<br>- Thiết bị quét mã QR và nhận diện khuôn mặt tại sân bay. | **3,79 / 5,0** | 75,8% | 8,7% | Quầy Kiosk tại Nội Bài, Tân Sơn Nhất hoạt động tốt; tuy nhiên một số khung giờ cao điểm sáng sớm quầy in hết giấy hoặc cổng quét sinh trắc học nhận diện hơi chậm. |
| **2. Phần mềm ứng dụng (Web / App)** | - Giao diện tìm chuyến bay và chọn giá vé rõ ràng, dễ hiểu.<br>- Sự mượt mà khi thao tác làm thủ tục chọn ghế trên điện thoại.<br>- Tính năng tự đổi chuyến bay / hoàn vé trực tuyến. | **3,49 / 5,0** | 69,8% | 14,6% | Giao diện đẹp và hiện đại, nhưng tính năng tự đổi chuyến/hoàn vé trực tuyến còn rắc rối; khi chuyển giữa các bước đặt vé đôi lúc phải chờ tải lại màn hình khá lâu. |
| **3. Cơ sở dữ liệu (Lịch bay, PNR, Vé)** | - Độ chính xác của lịch bay, số ghế trống và tổng tiền thanh toán.<br>- Tốc độ cấp mã đặt chỗ `PNR` và gửi vé điện tử 13 chữ số.<br>- Tính chính xác khi cộng dặm thưởng Bông Sen Vàng. | **3,92 / 5,0** | 78,4% | 6,7% | Là thành phần được đánh giá cao nhất (3,92/5,0) nhờ dữ liệu vé và chỗ ngồi rất chuẩn xác; điểm trừ nhỏ là đôi khi thanh toán QR xong bị trễ vài phút mới nhận được vé. |
| **4. Mạng viễn thông & kết nối liên thông** | - Độ ổn định đường truyền vào dịp mở bán vé Tết, khuyến mãi.<br>- Tốc độ kết nối giữa ứng dụng VNA với ngân hàng và ví điện tử.<br>- Sự ổn định khi liên thông xác thực qua ứng dụng VNeID. | **3,55 / 5,0** | 71,0% | 13,3% | Ngày thường kết nối rất nhanh, nhưng vào đợt cao điểm săn vé Tết hoặc giờ cao điểm tại sân bay, kết nối thanh toán và đồng bộ VNeID đôi lúc bị báo lỗi quá thời gian chờ (*Timeout*). |
| **5. Con người & quy trình hỗ trợ** | - Quy định thời gian giữ chỗ và mở cổng làm thủ tục (24h–1h).<br>- Sự dễ hiểu của các hướng dẫn trên màn hình cho người mới.<br>- Tốc độ hỗ trợ của tổng đài và nhân viên khi gặp sự cố vé. | **3,49 / 5,0** | 69,8% | 14,0% | Nhân viên lịch sự, chuyên nghiệp; nhưng thời gian chờ kết nối tổng đài giờ cao điểm còn lâu và quy trình chờ hoàn tiền vé về tài khoản ngân hàng (7–15 ngày) còn chậm. |
| **TỔNG HỢP TOÀN HỆ THỐNG** | **Trung bình cộng cả 5 thành phần cấu thành (N = 150)** | **3,65 / 5,0** | **73,0%** | **11,5%** | **Hệ thống đạt mức Khá - Tốt (3,65/5,0), cần ưu tiên nâng cấp Phần mềm, Mạng cao điểm và Quy trình hỗ trợ đối soát.** |

![Hình 3.1. Biểu đồ kết quả khảo sát đánh giá 5 thành phần hệ thống thông tin (Thang điểm 5, N = 150)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_3_1_bieu_do_khao_sat.png)

**Hình 3.1. Biểu đồ kết quả khảo sát đánh giá 5 thành phần hệ thống thông tin (Thang điểm 5, N = 150)**
*Nguồn: Tác giả xử lý thống kê từ 150 phiếu khảo sát thực tế năm 2026.*

Số liệu từ Bảng 3.2 và Hình 3.1 cho thấy bức tranh rất rõ nét: thành phần **Cơ sở dữ liệu** đạt điểm cao nhất (**3,92 / 5,0**, tương ứng 78,4% hài lòng) và **Hạ tầng phần cứng** đứng thứ hai (**3,79 / 5,0**), chứng tỏ nền tảng lưu trữ dữ liệu cốt lõi của hãng rất vững chắc. Ngược lại, hai thành phần có điểm thấp nhất là **Phần mềm ứng dụng** (**3,49 / 5,0**) và **Con người & quy trình hỗ trợ** (**3,49 / 5,0**), tiếp đến là **Mạng viễn thông dịp cao điểm** (**3,55 / 5,0**). Đây chính là những "điểm nghẽn" thực tế mà người dùng cảm nhận rõ nhất khi thao tác.

### 3.2. Đánh giá tổng hợp ưu điểm, hạn chế và nhận diện rủi ro của hệ thống

#### 3.2.1. Tổng hợp những ưu điểm nổi bật và các hạn chế còn tồn tại theo 5 thành phần

Từ kết quả phân tích hướng đối tượng ở Chương II và khảo sát định lượng 150 người dùng ở Mục 3.1, tác giả tổng hợp những ưu điểm đã làm được và những hạn chế cần khắc phục của Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines theo từng thành phần như sau:

**a. Về những ưu điểm nổi bật của hệ thống**
- *Một là, tự động hóa khép kín toàn bộ quy trình phục vụ hành khách:* Hệ thống đã kết nối liền mạch từ khâu tra cứu lịch bay, báo giá vé, giữ chỗ tạm thời, thanh toán trực tuyến đa kênh, xuất vé điện tử 13 chữ số cho đến khâu tự chọn ghế ngồi và cấp thẻ lên máy bay điện tử (`BCBP`). Hành khách không có hành lý ký gửi có thể hoàn tất mọi thủ tục trên điện thoại và đi thẳng qua cửa an ninh sân bay mà không cần xếp hàng tại quầy giấy truyền thống.
- *Hai là, cơ sở dữ liệu tập trung đảm bảo tính nhất quán cao:* Nhờ thiết kế cơ sở dữ liệu chuẩn hóa và cơ chế khóa chỗ tạm thời ngay khi tạo mã `PNR`, hệ thống quản lý chính xác tuyệt đối quỹ ghế trống của hơn 100 đường bay, không để xảy ra tình trạng bán vượt quá số ghế vật lý trên tàu bay khi mở bán đồng thời trên cả website, ứng dụng di động và đại lý.
- *Ba là, tiên phong tích hợp thanh toán số và định danh điện tử quốc gia:* Hệ thống đã liên thông rộng rãi với mã QR ngân hàng (`VietQR`), các ví điện tử phổ biến tại Việt Nam và bước đầu kết nối xác thực sinh trắc học khuôn mặt qua ứng dụng định danh điện tử **VNeID** của Bộ Công an tại các cảng hàng không lớn, mang lại trải nghiệm hiện đại cho hành khách.

**b. Về những hạn chế và bất cập còn tồn tại theo 5 thành phần**
- *Về Phần cứng:* Số lượng quầy làm thủ tục tự động (*Kiosk Check-in*) và cổng kiểm soát sinh trắc học tự động mới tập trung chủ yếu ở ga nội địa Nội Bài và Tân Sơn Nhất, tại các sân bay địa phương còn ít thiết bị; vào khung giờ cao điểm sáng sớm (5h30–7h30), một số máy Kiosk gặp tình trạng hết giấy in nhiệt hoặc màn hình cảm ứng phản hồi chậm.
- *Về Phần mềm:* Luồng thao tác đặt vé trên trang web và ứng dụng di động còn chia thành khá nhiều màn hình nối tiếp nhau; khi khách hàng muốn **tự đổi ngày bay, giờ bay hoặc hoàn hủy vé trực tuyến**, phần mềm chưa hỗ trợ tính toán tự động tiền chênh lệch đối với nhiều loại vé khuyến mãi hoặc vé đã bay một chặng, buộc khách phải gửi biểu mẫu chờ nhân viên xử lý thủ công.
- *Về Cơ sở dữ liệu và đồng bộ giao dịch:* Vẫn tồn tại hiện tượng **lệch pha thời gian giữ chỗ và xác nhận thanh toán** (rủi ro khách quét mã QR ngân hàng vào phút thứ 14–15 của thời hạn giữ chỗ: ngân hàng đã trừ tiền nhưng bản tin xác nhận trả về máy chủ Vietnam Airlines chậm vài chục giây sau khi mã `PNR` vừa bị hủy tự động, dẫn đến khách bị trừ tiền nhưng không nhận được vé điện tử ngay). Bên cạnh đó, khi đổi loại tàu bay khai thác sát giờ khởi hành, việc tự động ánh xạ lại sơ đồ ghế ngồi đôi khi làm thay đổi vị trí ghế cạnh cửa sổ mà khách đã chọn trước.
- *Về Mạng truyền thông:* Vào các thời điểm mở bán vé Tết Nguyên đán hoặc chương trình khuyến mãi đầu mùa hè, lượng truy cập tăng gấp 8–10 lần ngày thường gây nghẽn cục bộ đường truyền API tìm kiếm chuyến bay, làm thời gian chờ tải trang kéo dài từ 5 đến 12 giây.
- *Về Con người và Quy trình:* Cơ chế tra cứu hồ sơ đặt chỗ và làm thủ tục trực tuyến hiện nay chỉ kiểm tra 2 thông tin tĩnh là `Mã PNR (6 ký tự)` và `Họ của hành khách`. Nhiều hành khách có thói quen chụp ảnh vé hoặc thẻ lên máy bay đăng lên mạng xã hội làm lộ mã `PNR`, tạo kẽ hở để người lạ truy cập vào xem lịch trình hoặc tự ý đổi ghế, hủy làm thủ tục. Ngoài ra, quy trình đối soát hoàn tiền vé khi giao dịch lỗi hoặc hoàn vé theo yêu cầu còn kéo dài từ 7 đến 15 ngày làm việc, gây tâm lý sốt ruột cho khách hàng.

#### 3.2.2. Nhận diện và đánh giá mức độ rủi ro dữ liệu, vận hành bằng Ma trận rủi ro 5x5

Vận dụng phương pháp quản trị rủi ro hệ thống thông tin đã trình bày tại Chương I, tác giả tiến hành nhận diện **5 rủi ro trọng yếu nhất (ký hiệu từ R1 đến R5)** đang đe dọa trực tiếp đến tính toàn vẹn dữ liệu, an toàn bảo mật và sự ổn định vận hành của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines. Mỗi rủi ro được chấm điểm định lượng theo hai chiều: **Khả năng xảy ra ($P$, từ 1 đến 5)** và **Mức độ tác động thiệt hại ($I$, từ 1 đến 5)**, với công thức điểm rủi ro:

$$\text{Điểm rủi ro } (R) = P \times I \quad (\text{Thang điểm từ } 1 \text{ đến } 25)$$

Kết quả đánh giá được biểu diễn trực quan trên **Ma trận đánh giá rủi ro 5x5** tại Hình 3.2 và phân tích chi tiết nguyên nhân, hậu quả tại Bảng 3.3.

![Hình 3.2. Ma trận đánh giá rủi ro dữ liệu và vận hành hệ thống (5x5)](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_3_2_ma_tran_rui_ro.png)

**Hình 3.2. Ma trận đánh giá rủi ro dữ liệu và vận hành hệ thống (5x5)**
*Nguồn: Tác giả phân tích và đánh giá theo khung quản trị rủi ro HTTT.*

**Bảng 3.3. Bảng phân tích chi tiết 5 rủi ro trọng yếu của Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines**

| Mã rủi ro | Tên rủi ro nhận diện | Thành phần liên quan | Khả năng (P) | Tác động (I) | Điểm (P × I) | Nguyên nhân kỹ thuật / Quản trị và Hậu quả thực tế |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **R1** | **Khấu trừ tiền thành công nhưng chậm xuất vé điện tử (Treo giao dịch)** | Cơ sở dữ liệu, Phần mềm & Mạng kết nối ngân hàng | 4 (Cao) | 4 (Nghiêm trọng) | **16 (Mức Cao)** | *Nguyên nhân:* Khách thanh toán sát lúc hết hạn giữ chỗ 15 phút hoặc đường truyền API giữa cổng ngân hàng và hệ thống đặt vé phản hồi chậm vài giây.<br>*Hậu quả:* Khách bị trừ tiền nhưng mã `PNR` bị hủy giữ chỗ, không có vé để bay và gây bức xúc lớn khi phải chờ đối soát hoàn tiền nhiều ngày. |
| **R4** | **Nghẽn mạch và chậm phản hồi vào dịp cao điểm săn vé Tết / Khuyến mãi** | Phần cứng máy chủ & Mạng viễn thông | 4 (Cao) | 3 (Trung bình) | **12 (Khá cao)** | *Nguyên nhân:* Lượng truy cập đồng thời tăng đột biến gấp nhiều lần ngày thường, cộng thêm các công cụ quét giá vé tự động (*Bot*) làm quá tải cụm máy chủ tra cứu giá.<br>*Hậu quả:* Khách thực sự có nhu cầu mua vé bị quay vòng chờ tải trang lâu hoặc văng khỏi phiên giao dịch. |
| **R2** | **Lệch sơ đồ ghế ngồi đã chọn khi thay đổi loại tàu bay khai thác** | Cơ sở dữ liệu & Quy trình điều hành bay | 3 (Trung bình) | 4 (Nghiêm trọng) | **12 (Khá cao)** | *Nguyên nhân:* Do yêu cầu kỹ thuật hoặc điều phối khai thác, hãng phải đổi tàu bay có cấu hình hàng ghế khác với tàu ban đầu sau khi khách đã chọn chỗ hoặc làm thủ tục.<br>*Hậu quả:* Hành khách đi theo gia đình bị tách rời ghế ngồi hoặc mất vị trí ghế đã mua phí chọn chỗ trước. |
| **R5** | **Rò rỉ thông tin hành trình và bị can thiệp trái phép do lộ mã đặt chỗ PNR** | Con người, Phần mềm & Bảo mật dữ liệu | 2 (Thấp) | 5 (Thảm họa / Pháp lý) | **10 (Trung bình)** | *Nguyên nhân:* Hành khách chụp ảnh vé/thẻ bay đăng lên mạng xã hội làm lộ mã `PNR` 6 ký tự và Họ tên; trong khi màn hình tra cứu chưa bắt buộc xác thực lớp thứ hai bằng mã OTP.<br>*Hậu quả:* Kẻ xấu có thể nhập mã PNR để xem số căn cước, lịch trình hoặc phá hoại bằng cách đổi ghế, hủy làm thủ tục; vi phạm quy định bảo vệ dữ liệu cá nhân. |
| **R3** | **Gián đoạn kết nối xác thực sinh trắc học VNeID và thiết bị sân bay** | Phần cứng sân bay & Đường truyền mạng | 3 (Trung bình) | 3 (Trung bình) | **9 (Trung bình)** | *Nguyên nhân:* Đường truyền mạng tại khu vực cửa an ninh sân bay không ổn định hoặc camera quét khuôn mặt gặp khó khăn do ánh sáng ngược.<br>*Hậu quả:* Hành khách phải chuyển sang xếp hàng kiểm tra căn cước công dân thủ công, làm giảm tốc độ thông qua cửa an ninh giờ cao điểm. |

---

## CHƯƠNG IV: ĐỀ XUẤT GIẢI PHÁP NÂNG CẤP VÀ HOÀN THIỆN HỆ THỐNG THÔNG TIN ĐẶT VÉ VÀ LÀM THỦ TỤC TRỰC TUYẾN CỦA VIETNAM AIRLINES

### 4.1. Định hướng và mô hình tổng thể nâng cấp hệ thống giai đoạn 2026–2030

#### 4.1.1. Nguyên tắc và mục tiêu nâng cấp hệ thống thông tin

Trên cơ sở những hạn chế và 5 rủi ro trọng yếu đã được chỉ rõ tại Chương III, việc đề xuất giải pháp nâng cấp Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines trong giai đoạn 2026–2030 cần quán triệt ba nguyên tắc cơ bản:
- *Thứ nhất, nguyên tắc đồng bộ toàn diện 5 thành phần:* Không chỉ sửa lỗi cục bộ ở phần mềm giao diện mà phải nâng cấp đồng bộ cả Hạ tầng phần cứng, Phần mềm ứng dụng, Cơ sở dữ liệu, Mạng viễn thông và Đào tạo con người – Quy trình nghiệp vụ.
- *Thứ hai, nguyên tắc lấy hành khách làm trung tâm và dễ sử dụng:* Mọi cải tiến kỹ thuật đều phải hướng tới việc giúp hành khách phổ thông (kể cả người lớn tuổi hoặc người ít rành công nghệ) đặt vé nhanh hơn, thanh toán an toàn tuyệt đối và làm thủ tục thuận tiện chỉ với vài thao tác đơn giản.
- *Thứ ba, nguyên tắc bảo đảm an toàn dữ liệu và tuân thủ pháp luật:* Tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân, đảm bảo mọi giao dịch tài chính và thông tin nhân thân của hành khách được bảo vệ nhiều lớp.

#### 4.1.2. Mô hình tổng thể giải pháp nâng cấp đồng bộ 5 thành phần hệ thống

Hình 4.1 khái quát hóa **Mô hình giải pháp nâng cấp đồng bộ 5 thành phần Hệ thống thông tin đặt vé và làm thủ tục trực tuyến Vietnam Airlines** cùng bộ chỉ tiêu hiệu quả mục tiêu cần đạt được.

![Hình 4.1. Mô hình giải pháp nâng cấp đồng bộ 5 thành phần hệ thống thông tin](/C:/Users/legen/.gemini/antigravity/brain/5e0bafcb-0923-43e5-b661-9e5ebda749fe/assets/diagrams/diag_4_1_kien_truc_nang_cap.png)

**Hình 4.1. Mô hình giải pháp nâng cấp đồng bộ 5 thành phần hệ thống thông tin**
*Nguồn: Tác giả đề xuất dựa trên kết quả phân tích và đánh giá thực trạng hệ thống.*

### 4.2. Giải pháp chi tiết nâng cấp theo từng thành phần của hệ thống thông tin

#### 4.2.1. Giải pháp 1 – Nâng cấp hạ tầng Phần cứng (Mở rộng máy chủ co giãn tự động và thiết bị sân bay)

Để giải quyết triệt để rủi ro **R4 (Nghẽn mạch giờ cao điểm săn vé Tết)** và rủi ro **R3 (Gián đoạn thiết bị làm thủ tục tại sân bay)**, Vietnam Airlines cần thực hiện hai hạng mục nâng cấp phần cứng cụ thể:

- **Nâng cấp cụm máy chủ theo cơ chế tự động co giãn tài nguyên (Auto-Scaling):** Thay vì duy trì một số lượng máy chủ cố định dễ bị quá tải khi mở bán vé Tết hoặc dư thừa công suất vào ngày thường, khối Công nghệ thông tin cần thiết lập cơ chế tự động cấp phát thêm máy chủ ảo trên hạ tầng đám mây ngay khi mức sử dụng bộ vi xử lý (CPU) của tầng ứng dụng vượt ngưỡng **70%**. Cụm máy chủ tìm kiếm chuyến bay và tra cứu giá vé được tách độc lập với cụm máy chủ xử lý thanh toán để dù lượng người vào xem giá vé tăng gấp 10 lần thì luồng thanh toán và xuất vé của những khách đang trả tiền vẫn hoạt động mượt mà, không bị ảnh hưởng.
- **Mở rộng và nâng cấp thiết bị phần cứng tại các cảng hàng không:** Đầu tư bổ sung thêm các quầy làm thủ tục tự động (*Kiosk Check-in* thế hệ mới tích hợp đầu đọc căn cước công dân gắn chip và máy in nhiệt dung lượng cuộn giấy lớn) không chỉ tại Nội Bài, Tân Sơn Nhất, Đà Nẵng mà mở rộng ra các sân bay có lưu lượng khách du lịch cao như Cam Ranh, Phú Quốc, Cát Bi, Vinh. Đồng thời, trang bị cảm biến cảnh báo tự động về máy tính của nhân viên kỹ thuật trực sân bay khi cuộn giấy in trong máy Kiosk còn dưới 15% để nhân viên thay giấy kịp thời trước giờ cao điểm sáng sớm.

#### 4.2.2. Giải pháp 2 – Nâng cấp Phần mềm ứng dụng (Tinh gọn giao diện, hàng đợi ảo và tự động hóa đổi/hoàn vé)

Nhằm cải thiện điểm số khảo sát của thành phần Phần mềm (hiện đang ở mức 3,49/5,0) và khắc phục sự phức tạp khi thao tác, tác giả đề xuất ba cải tiến trực tiếp trên website `vietnamairlines.com` và ứng dụng di động Vietnam Airlines:

- **Rút gọn quy trình đặt vé trực tuyến xuống 4 bước trực quan và minh bạch tổng giá vé ngay từ đầu:** Thiết kế lại màn hình chọn chuyến bay sao cho ngay khi hành khách bấm chọn giờ bay, hệ thống hiển thị luôn **Tổng số tiền cuối cùng phải trả (đã bao gồm thuế, phí sân bay)** bằng cỡ chữ lớn, rõ ràng kèm bảng so sánh ngắn gọn 3 quyền lợi quan trọng nhất (Số cân hành lý xách tay, Số cân hành lý ký gửi, Phí đổi/hoàn vé). Hạn chế tối đa các cửa sổ bật lên (*pop-up*) quảng cáo dịch vụ phụ trợ gây rối mắt, chuyển các dịch vụ mua thêm (như hành lý, suất ăn, chọn ghế) thành một mục tùy chọn gọn gàng trên cùng một màn hình.
- **Tích hợp "Phòng chờ xếp hàng ảo" (Virtual Waiting Room) vào các đợt mở bán vé cao điểm:** Khi lượng người truy cập săn vé khuyến mãi hoặc vé Tết vượt quá ngưỡng chịu tải tức thời, phần mềm tự động kích hoạt màn hình hàng đợi thông minh hiển thị rõ số thứ tự của khách và thời gian chờ dự kiến (ví dụ: *"Bạn đang ở vị trí 120, thời gian chờ khoảng 45 giây"*). Giải pháp này giúp giữ nguyên phiên làm việc của khách, ngăn chặn hoàn toàn tình trạng trang web bị trắng màn hình hoặc báo lỗi mất kết nối giữa chừng.
- **Nâng cấp phân hệ Tự đổi chuyến bay và Hoàn vé tự động trên ứng dụng:** Bổ sung thuật toán tự động đọc điều kiện giá vé của mã `PNR` để tính toán ngay trên màn hình số tiền chênh lệch giá vé cộng phí đổi (hoặc số tiền được hoàn lại sau khi trừ phí hoàn vé). Hành khách chỉ cần bấm xác nhận, thanh toán phần chênh lệch (nếu đổi vé) và nhận ngay vé điện tử mới chỉ sau 1 phút mà không cần phải điền đơn chờ nhân viên tổng đài xử lý thủ công.

#### 4.2.3. Giải pháp 3 – Chuẩn hóa Cơ sở dữ liệu và cơ chế đối soát thanh toán, bảo mật mã PNR

Đây là nhóm giải pháp trọng tâm nhất nhằm xử lý dứt điểm rủi ro nghiêm trọng **R1 (Trừ tiền thành công nhưng chậm xuất vé - 16 điểm)**, rủi ro **R2 (Lệch sơ đồ ghế khi đổi tàu bay - 12 điểm)** và rủi ro **R5 (Lộ mã đặt chỗ PNR - 10 điểm)**:

- **Thiết lập cơ chế "Gia hạn giữ chỗ thông minh" và "Đối soát thanh toán tự động 2 chiều trong 30 giây":**
  - *Thứ nhất,* ngay khi hành khách mở màn hình quét mã QR ngân hàng hoặc nhập thẻ thanh toán, hệ thống tự động gia hạn thêm **5 phút đệm bảo vệ** cho mã đặt chỗ `PNR` (nâng tổng thời gian giữ chỗ lên 20 phút đối với các giao dịch đang chờ ngân hàng phản hồi) để không xảy ra tình trạng ngân hàng vừa trừ tiền xong thì mã `PNR` bị hủy ở giây cuối cùng.
  - *Thứ hai,* bổ sung bảng nhật ký đối soát tức thời trong cơ sở dữ liệu: nếu sau 30 giây kể từ lúc khách bấm thanh toán mà chưa nhận được bản tin thông báo thụ động từ cổng thanh toán, máy chủ của Vietnam Airlines sẽ chủ động gửi lệnh truy vấn ngược (*Active Query API*) sang cổng ngân hàng để hỏi trạng thái giao dịch. Nếu ngân hàng xác nhận đã trừ tiền thành công, hệ thống lập tức kích hoạt xuất vé điện tử 13 chữ số ngay cho khách; nếu chuyến bay thực sự đã hết sạch ghế trong trường hợp hy hữu, hệ thống tự động phát lệnh hoàn tiền (*Auto-Refund*) trả tiền về tài khoản khách trong vòng 24 giờ thay vì để khách phải chờ 7–15 ngày như trước.
- **Cơ chế tự động giữ nguyên thuộc tính vị trí ghế khi đổi loại tàu bay:** Trong bảng cơ sở dữ liệu `GHE_CHUYEN_BAY`, bổ sung thêm thuộc tính đặc tính vị trí ghế (`Cửa sổ - Window`, `Lối đi - Aisle`, `Giữa - Middle`, `Hàng đầu rộng chân`). Khi hãng bắt buộc phải đổi loại tàu bay khai thác chuyến đó, thuật toán ánh xạ lại sơ đồ ghế sẽ ưu tiên tuyệt đối việc xếp lại cho hành khách đúng loại vị trí ghế cũ (ví dụ khách đã chọn ghế cửa sổ `15A` trên tàu cũ sẽ được chuyển sang ghế cửa sổ tương ứng trên tàu mới) và giữ cho các hành khách trong cùng một mã đặt chỗ `PNR` luôn được ngồi cạnh nhau, đồng thời gửi tin nhắn thông báo ngay số ghế mới về ứng dụng và điện thoại của khách.
- **Bổ sung lớp xác thực bảo mật thứ hai (OTP) khi tra cứu và chỉnh sửa hồ sơ PNR:** Để ngăn chặn triệt để việc người lạ lấy mã `PNR` trên ảnh chụp mạng xã hội để vào xem thông tin căn cước hoặc tự ý đổi ghế, hủy làm thủ tục của khách, hệ thống cần nâng cấp quy tắc truy cập cơ sở dữ liệu: khi người dùng nhập `Mã PNR` + `Họ hành khách` tại mục **Quản lý đặt chỗ**, hệ thống chỉ hiển thị giờ bay và trạng thái chuyến bay cơ bản (đồng thời che bớt một phần số căn cước công dân dạng `001099xxx456`). Nếu người dùng muốn xem toàn bộ thông tin cá nhân, đổi ghế, đổi chuyến hoặc hủy làm thủ tục, hệ thống bắt buộc phải gửi một **Mã xác thực OTP 6 chữ số** về đúng số điện thoại di động hoặc địa chỉ Email đã đăng ký trong hồ sơ đặt chỗ đó.

#### 4.2.4. Giải pháp 4 – Nâng cấp hạ tầng Mạng viễn thông và bảo mật đường truyền

- **Thiết lập đường truyền đôi dự phòng tự động chuyển mạch tới các sân bay:** Tại tất cả các cảng hàng không khai thác, duy trì song song hai đường truyền cáp quang của hai nhà mạng viễn thông độc lập kết nối về Trung tâm dữ liệu của hãng, kèm nhánh dự phòng qua mạng di động tốc độ cao 5G cho các quầy Kiosk Check-in và cổng kiểm soát sinh trắc học. Khi một đường truyền gặp sự cố đứt cáp hoặc suy hao tín hiệu, thiết bị định tuyến sẽ tự động chuyển luồng dữ liệu sang nhánh dự phòng trong thời gian dưới 1 giây, đảm bảo việc làm thủ tục và quét thẻ lên máy bay của hành khách không bao giờ bị gián đoạn.
- **Tối ưu mạng phân phối nội dung (CDN) và bộ lọc chống truy cập tự động trái phép (Anti-Bot):** Lưu trữ toàn bộ dữ liệu tĩnh (danh mục sân bay, hình ảnh, biểu mẫu giao diện) trên các máy chủ biên CDN đặt tại nhiều vùng để trang web tải tức thời dưới 1,5 giây. Đồng thời, cấu hình tường lửa ứng dụng web (WAF) để tự động nhận diện và chặn các phần mềm quét giá vé tự động trái phép (*Bot*) gửi hàng trăm yêu cầu mỗi giây, dành trọn vẹn băng thông mạng cho hành khách thực sự đặt vé.

#### 4.2.5. Giải pháp 5 – Đào tạo Con người và hoàn thiện quy trình hỗ trợ nghiệp vụ

- **Cải tiến quy trình hỗ trợ khách hàng theo hướng chủ động và rút ngắn thời gian hoàn tiền:** Thiết lập quy trình phối hợp tự động giữa Khối Công nghệ thông tin, Khối Tài chính – Kế toán và Tổng đài chăm sóc khách hàng (`1900 1100`): mọi giao dịch thanh toán trực tuyến gặp lỗi đều tự động sinh phiếu xử lý ưu tiên trên màn hình của nhân viên trực đối soát và gửi tin nhắn thông báo tiến độ từng bước (*"Đã ghi nhận lỗi giao dịch" → "Đang xử lý hoàn tiền" → "Ngân hàng đã hoàn tiền thành công"*) ngay trên ứng dụng Vietnam Airlines để hành khách hoàn toàn yên tâm.
- **Bổ sung hướng dẫn trực quan cho hành khách và đào tạo nhân sự hiện trường:**
  - *Đối với hành khách:* Tích hợp các đoạn hướng dẫn ngắn gọn, dễ hiểu ngay tại từng bước đặt vé và làm thủ tục trực tuyến; bổ sung dòng cảnh báo in đậm trên Thẻ lên máy bay điện tử: *"Lưu ý bảo mật: Quý khách vui lòng che Mã đặt chỗ (PNR) và Mã vạch khi chia sẻ hình ảnh thẻ lên máy bay lên mạng xã hội"*.
  - *Đối với nhân viên mặt đất và tổng đài:* Tổ chức các buổi tập huấn định kỳ về quy trình xử lý nhanh sự cố lệch thẻ lên máy bay, hỗ trợ hành khách cao tuổi tại khu vực quầy Kiosk tự động và hướng dẫn khách sử dụng tính năng làm thủ tục sinh trắc học qua ứng dụng VNeID tại sân bay.

### 4.3. Lộ trình triển khai và đánh giá hiệu quả kỳ vọng

Để các giải pháp đề xuất tại Mục 4.2 đi vào thực tế một cách khả thi, không làm gián đoạn hoạt động bán vé hàng ngày của Vietnam Airlines, tác giả đề xuất áp dụng chiến lược **Triển khai theo từng giai đoạn kết hợp thí điểm** chia làm 3 giai đoạn từ năm 2026 đến năm 2030, đồng thời xác lập bảng chỉ tiêu đo lường hiệu quả kỳ vọng tại Bảng 4.1.

**Bảng 4.1. Lộ trình triển khai 3 giai đoạn và các chỉ tiêu hiệu quả kỳ vọng sau khi nâng cấp hệ thống**

| Giai đoạn triển khai | Thời gian thực hiện | Các hạng mục công việc trọng tâm theo 5 thành phần | Chỉ tiêu đo lường hiệu quả kỳ vọng (KPIs) |
| :--- | :---: | :--- | :--- |
| **Giai đoạn 1: Khắc phục ngay các điểm nghẽn cấp bách** | Quý II/2026 – Quý IV/2026 | - Triển khai cơ chế **Đối soát thanh toán tự động 2 chiều trong 30 giây** và gia hạn đệm 5 phút giữ chỗ khi khách đang quét QR.<br>- Bổ sung xác thực **Mã OTP** khi chỉnh sửa hồ sơ `PNR` và che bớt số CCCD trên giao diện tra cứu công khai.<br>- Đưa vào vận hành **Phòng chờ xếp hàng ảo** phục vụ đợt mở bán vé Tết Nguyên đán. | - Giảm tỷ lệ giao dịch bị trừ tiền nhưng chậm xuất vé xuống **dưới 0,05%**.<br>- Thời gian hoàn tiền tự động các giao dịch lỗi rút ngắn từ 7–15 ngày xuống **trong vòng 24–48 giờ**.<br>- Loại bỏ hoàn toàn nguy cơ người lạ tự ý hủy vé/đổi ghế qua mã PNR lộ trên mạng. |
| **Giai đoạn 2: Nâng cấp phần mềm tự phục vụ và mở rộng phần cứng sân bay** | Năm 2027 – Năm 2028 | - Phát hành giao diện đặt vé 4 bước tinh gọn và tính năng **Tự đổi chuyến / Hoàn vé tự động** trên ứng dụng di động.<br>- Nâng cấp thuật toán giữ nguyên thuộc tính vị trí ghế ngồi khi đổi loại tàu bay.<br>- Lắp đặt bổ sung quầy Kiosk Check-in và đường truyền mạng đôi dự phòng tại các sân bay nội địa trọng điểm. | - Tốc độ phản hồi tìm kiếm chuyến bay trung bình đạt **dưới 1,5 giây**.<br>- Tỷ lệ hành khách chủ động làm thủ tục trực tuyến (Online/Kiosk/VNeID Check-in) đạt **từ 70% trở lên**.<br>- Độ sẵn sàng hoạt động liên tục của hệ thống đạt **99,95%**. |
| **Giai đoạn 3: Hoàn thiện đồng bộ và tối ưu hóa quản trị thông minh** | Năm 2029 – Năm 2030 | - Hoàn thiện liên thông toàn trình sinh trắc học VNeID từ khâu làm thủ tục trực tuyến trên điện thoại đến cửa kiểm soát an ninh và cửa lên tàu bay không dùng giấy tờ tại tất cả các cảng hàng không.<br>- Tối ưu hóa hệ thống báo cáo quản trị và dự báo nhu cầu đặt chỗ theo thời gian thực. | - Rút ngắn thời gian hành khách đi qua thủ tục tại sân bay xuống còn **1/3 so với làm thủ tục quầy truyền thống**.<br>- Điểm hài lòng trung bình của người sử dụng đối với toàn hệ thống tăng từ **3,65/5,0 lên đạt ≥ 4,35/5,0**. |

---

## KẾT LUẬN

Qua quá trình nghiên cứu lý luận học phần **Quản trị hệ thống thông tin** và vận dụng trực tiếp vào việc khảo sát, phân tích, đánh giá **Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)**, báo cáo bài tập lớn đã hoàn thành đầy đủ mục tiêu và bốn nhiệm vụ nghiên cứu đề ra, với những kết quả chính như sau:

1. **Về mặt lý luận:** Báo cáo đã hệ thống hóa mạch lạc các khái niệm nền tảng về dữ liệu, thông tin, tri thức, 8 đặc tính chất lượng của thông tin có giá trị, 5 thành phần cấu thành hệ thống thông tin (Phần cứng, Phần mềm, Cơ sở dữ liệu, Mạng truyền thông, Con người và quy trình) cùng 3 mô hình biểu diễn hệ thống (Mô hình ngoài, Mô hình lô-gíc, Mô hình vật lý) và phương pháp phân tích thiết kế hướng đối tượng chuẩn quốc tế UML 2.5.
2. **Về phân tích thực trạng hệ thống (Chương II):** Báo cáo đã làm rõ bức tranh vận hành thực tế của hệ thống đặt vé và làm thủ tục trực tuyến tại địa chỉ `https://www.vietnamairlines.com` và ứng dụng di động Vietnam Airlines. Bằng phương pháp phân tích hướng đối tượng, tác giả đã xác định rõ 6 tác nhân trong sơ đồ phân cấp tác nhân, xây dựng biểu đồ Use Case tổng quát và phân rã, đặc tả chi tiết các bước tương tác của ca sử dụng Đặt vé (`UC02`) và Làm thủ tục trực tuyến (`UC04`), thiết kế biểu đồ hoạt động (Activity Diagram), biểu đồ trình tự (Sequence Diagram theo kiến trúc BCE), biểu đồ lớp thực thể miền (Class Diagram) và chuẩn hóa lược đồ cơ sở dữ liệu quan hệ đạt dạng chuẩn 3 (3NF Crow's Foot ERD) cùng ma trận phân quyền người dùng RBAC.
3. **Về đánh giá thực trạng và nhận diện rủi ro (Chương III):** Dựa trên việc đối chiếu với 8 đặc tính chất lượng thông tin và kết quả khảo sát định lượng **150 người sử dụng thực tế** (điểm trung bình đạt **3,65 / 5,0**), báo cáo đã chỉ ra những mặt mạnh của hệ thống (cơ sở dữ liệu chuẩn xác đạt 3,92/5,0; quy trình tự động hóa khép kín) cũng như những hạn chế ở khâu phần mềm, mạng giờ cao điểm và quy trình hỗ trợ. Đặc biệt, báo cáo đã lập Ma trận rủi ro 5x5 để định lượng 5 rủi ro trọng yếu, đứng đầu là rủi ro **R1 (Trừ tiền thành công nhưng chậm xuất vé điện tử - 16 điểm)**, **R4 (Nghẽn mạch dịp săn vé Tết - 12 điểm)**, **R2 (Lệch sơ đồ ghế khi đổi tàu bay - 12 điểm)** và **R5 (Nguy cơ lộ thông tin cá nhân qua mã đặt chỗ PNR - 10 điểm)**.
4. **Về giải pháp đề xuất (Chương IV):** Bám sát từng hạn chế và rủi ro đã phát hiện, tác giả đã đề xuất bộ 5 nhóm giải pháp nâng cấp đồng bộ trên cả 5 thành phần của hệ thống thông tin (từ cơ chế co giãn máy chủ tự động, bổ sung quầy Kiosk sân bay, tinh gọn giao diện đặt vé 4 bước, phòng chờ ảo, tính năng tự đổi/hoàn vé trực tuyến, cho đến cơ chế đối soát thanh toán tự động 2 chiều trong 30 giây, xác thực OTP bảo vệ mã PNR và lộ trình triển khai 3 giai đoạn 2026–2030).

Việc triển khai đồng bộ các giải pháp nêu trên sẽ giúp Vietnam Airlines khắc phục triệt để các sự cố giao dịch trực tuyến, nâng cao mức độ an toàn dữ liệu cá nhân và mang lại trải nghiệm đặt vé, làm thủ tục hàng không thuận tiện, nhanh chóng và đáng tin cậy cho hàng chục triệu hành khách trong kỷ nguyên số.

---

## DANH MỤC TÀI LIỆU THAM KHẢO

**I. Văn bản pháp luật và tài liệu chỉ đạo**
1. Bộ Chính trị (2024), *Nghị quyết số 57-NQ/TW ngày 22/12/2024 về đột phá phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số quốc gia*, Hà Nội.
2. Quốc hội (2023), *Luật Giao dịch điện tử số 20/2023/QH15 thông qua ngày 22/6/2023*, Hà Nội.
3. Quốc hội (2025), *Luật Bảo vệ dữ liệu cá nhân thông qua năm 2025 và Nghị định số 13/2023/NĐ-CP ngày 17/4/2023 của Chính phủ về bảo vệ dữ liệu cá nhân*, Hà Nội.
4. Cục Hàng không Việt Nam (2025), *Báo cáo tổng kết công tác vận tải hàng không và chuyển đổi số hạ tầng cảng hàng không giai đoạn 2024–2025*, Hà Nội.

**II. Giáo trình và tài liệu học thuật tiếng Việt**
5. Học viện Hành chính và Quản trị công (2025), *Tài liệu giảng dạy và Đề cương học phần Quản trị hệ thống thông tin*, Lưu hành nội bộ, Hà Nội.
6. Trần Thị Song Minh (Chủ biên, 2020), *Giáo trình Hệ thống thông tin quản lý*, Nhà xuất bản Đại học Kinh tế Quốc dân, Hà Nội.
7. Nguyễn Văn Vỵ (2019), *Giáo trình Phân tích và thiết kế hệ thống phần mềm theo hướng đối tượng bằng UML*, Nhà xuất bản Giáo dục Việt Nam, Hà Nội.
8. Phạm Nguyễn Cương, Hồ Tú Bảo (2021), *Quản trị dữ liệu và Chuyển đổi số trong doanh nghiệp*, Nhà xuất bản Khoa học và Kỹ thuật, Hà Nội.
9. Tổng công ty Hàng không Việt Nam - Vietnam Airlines (2025), *Báo cáo thường niên năm 2025 và Tài liệu hướng dẫn đặt vé, làm thủ tục trực tuyến trên cổng thương mại điện tử https://www.vietnamairlines.com*, Hà Nội.

**III. Tài liệu tham khảo tiếng Anh**
10. Object Management Group - OMG (2017), *OMG Unified Modeling Language (OMG UML) Specification, Version 2.5.1*, Needham, MA.
11. Kenneth C. Laudon, Jane P. Laudon (2022), *Management Information Systems: Managing the Digital Firm* (17th Edition), Pearson Education, London.
12. James A. O'Brien, George M. Marakas (2019), *Management Information Systems* (10th Edition), McGraw-Hill Irwin, New York.
13. Ralph M. Stair, George W. Reynolds (2021), *Principles of Information Systems* (14th Edition), Cengage Learning, Boston.

---

## PHỤ LỤC

### Phụ lục 1. Mẫu phiếu khảo sát ý kiến người sử dụng về Hệ thống đặt vé và làm thủ tục trực tuyến của Vietnam Airlines

**PHIẾU KHẢO SÁT TRẢI NGHIỆM NGƯỜI SỬ DỤNG**
*(Phục vụ nghiên cứu Bài tập lớn học phần Quản trị hệ thống thông tin)*

Xin chào Anh/Chị! Nhằm mục đích nghiên cứu, đánh giá thực trạng và đề xuất giải pháp nâng cấp **Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Vietnam Airlines** (trên website `vietnamairlines.com` và ứng dụng di động *Vietnam Airlines*), rất mong Anh/Chị dành ít phút chia sẻ đánh giá thực tế của mình. Mọi thông tin trong phiếu hoàn toàn ẩn danh và chỉ phục vụ mục đích học tập.

**PHẦN I. THÔNG TIN CHUNG VỀ NGƯỜI THAM GIA KHẢO SÁT**
1. **Nhóm đối tượng sử dụng của Anh/Chị:**
   - [ ] Hành khách thường xuyên đi công tác
   - [ ] Hành khách đi du lịch, về quê, thăm thân
   - [ ] Hội viên Bông Sen Vàng (Thẻ Bạc / Titan / Vàng / Bạch Kim)
   - [ ] Nhân viên bán vé / Nhân viên phục vụ mặt đất sân bay
2. **Kênh giao dịch Anh/Chị thường sử dụng nhất:**
   - [ ] Website `vietnamairlines.com` trên máy tính / điện thoại
   - [ ] Ứng dụng di động *Vietnam Airlines* trên điện thoại thông minh
   - [ ] Quầy làm thủ tục tự động (*Kiosk Check-in*) tại sân bay

**PHẦN II. NỘI DUNG ĐÁNH GIÁ THEO 5 THÀNH PHẦN HỆ THỐNG THÔNG TIN**
*Xin Anh/Chị đánh dấu vào mức điểm từ **1 đến 5** tương ứng với mức độ đồng ý của mình (1 = Rất không hài lòng; 2 = Không hài lòng; 3 = Bình thường; 4 = Hài lòng; 5 = Rất hài lòng):*

| Mã | Nội dung tiêu chí đánh giá theo 5 thành phần hệ thống | Mức 1 | Mức 2 | Mức 3 | Mức 4 | Mức 5 | Điểm TB (N=150) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **PC1** | Hệ thống máy chủ đáp ứng nhanh khi truy cập tìm chuyến bay vào ngày thường | 1 | 2 | 3 | 4 | 5 | **3,88** |
| **PC2** | Quầy làm thủ tục tự động (Kiosk Check-in) tại sân bay có màn hình nhạy và in thẻ nhanh | 1 | 2 | 3 | 4 | 5 | **3,76** |
| **PC3** | Thiết bị quét mã vạch 2D và nhận diện khuôn mặt tại cửa sân bay hoạt động ổn định | 1 | 2 | 3 | 4 | 5 | **3,73** |
| **PM1** | Giao diện tìm kiếm chuyến bay và chọn hạng giá vé trên Web/App rõ ràng, dễ hiểu | 1 | 2 | 3 | 4 | 5 | **3,68** |
| **PM2** | Thao tác chọn ghế ngồi trên sơ đồ tàu bay khi làm thủ tục trực tuyến (Check-in) mượt mà | 1 | 2 | 3 | 4 | 5 | **3,65** |
| **PM3** | Chức năng tự đổi chuyến bay, đổi ngày bay hoặc hoàn vé trực tuyến dễ thực hiện | 1 | 2 | 3 | 4 | 5 | **3,14** |
| **DL1** | Dữ liệu lịch bay, số ghế trống và tổng số tiền vé + thuế phí hiển thị chính xác tuyệt đối | 1 | 2 | 3 | 4 | 5 | **4,02** |
| **DL2** | Mã đặt chỗ (PNR 6 ký tự) và Vé điện tử (13 chữ số) được cấp nhanh và khớp thông tin | 1 | 2 | 3 | 4 | 5 | **3,90** |
| **DL3** | Dữ liệu tài khoản và dặm thưởng Hội viên Bông Sen Vàng được cập nhật chính xác | 1 | 2 | 3 | 4 | 5 | **3,84** |
| **MC1** | Đường truyền truy cập ổn định ngay cả vào dịp mở bán vé Tết hoặc khuyến mãi lớn | 1 | 2 | 3 | 4 | 5 | **3,32** |
| **MC2** | Kết nối thanh toán giữa ứng dụng VNA với mã QR ngân hàng / Ví điện tử nhanh chóng | 1 | 2 | 3 | 4 | 5 | **3,72** |
| **MC3** | Kết nối xác thực giấy tờ và sinh trắc học liên thông với ứng dụng VNeID thuận lợi | 1 | 2 | 3 | 4 | 5 | **3,61** |
| **CN1** | Quy định thời gian giữ chỗ thanh toán và khung giờ mở làm thủ tục (24h–1h) hợp lý | 1 | 2 | 3 | 4 | 5 | **3,75** |
| **CN2** | Các hướng dẫn nghiệp vụ và cảnh báo bảo mật mã PNR trên màn hình dễ hiểu | 1 | 2 | 3 | 4 | 5 | **3,52** |
| **CN3** | Tốc độ hỗ trợ xử lý sự cố thanh toán và thời gian hoàn tiền vé đáp ứng kỳ vọng | 1 | 2 | 3 | 4 | 5 | **3,20** |

### Phụ lục 2. Bảng đối chiếu quy trình xử lý nghiệp vụ và kiểm soát toàn vẹn dữ liệu

| Giai đoạn nghiệp vụ | Dữ liệu đầu vào (Input) | Quy tắc kiểm tra và xử lý lô-gíc (Process) | Dữ liệu đầu ra và cập nhật CSDL (Output) | Cơ chế kiểm soát lỗi / Toàn vẹn dữ liệu |
| :--- | :--- | :--- | :--- | :--- |
| **1. Tìm kiếm chuyến bay** | Mã sân bay đi (`HAN`), mã sân bay đến (`SGN`), ngày khởi hành, số lượng khách. | Kiểm tra ngày bay $\ge$ ngày hiện tại; truy vấn các chuyến bay có trạng thái `Đang mở bán` và số ghế trống $\ge$ số khách. | Danh sách chuyến bay kèm giá vé cơ bản và thuế phí của từng hạng ghế (`C`, `W`, `Y`). | Sử dụng bộ nhớ đệm tăng tốc tra cứu nhưng kiểm tra lại số ghế thực tế ngay khi khách bấm chọn chuyến. |
| **2. Tạo hồ sơ đặt chỗ (PNR)** | Chuyến bay đã chọn, Họ tên, Ngày sinh, Số CCCD/Hộ chiếu, Số điện thoại, Email. | Kiểm tra định dạng CCCD/Hộ chiếu; tính tổng tiền thanh toán; khóa tạm thời số ghế trong 15 phút. | Sinh bản ghi `HO_SO_DAT_CHO` với khóa chính `ma_pnr` (6 ký tự) ở trạng thái `Đang giữ chỗ`. | Khóa bản ghi ghế ngồi ở mức cơ sở dữ liệu để ngăn hai hành khách cùng giữ trùng một chiếc ghế cuối cùng. |
| **3. Thanh toán và Xuất vé** | Mã `ma_pnr`, tổng số tiền, phương thức thanh toán (`VietQR` / Thẻ / Ví). | Gửi yêu cầu sang Cổng thanh toán; kiểm tra chữ ký số của bản tin xác nhận trừ tiền thành công. | Sinh bản ghi `GIAO_DICH_TT` và phát hành `VE_DIEN_TU` (`so_ve_13_so` đầu `738`), chuyển `ma_pnr` sang `Đã xuất vé`. | Nếu quá hạn giữ chỗ mà chưa thanh toán thì tự động giải phóng ghế; nếu trừ tiền muộn thì đưa vào luồng đối soát tự động 30 giây. |
| **4. Làm thủ tục trực tuyến (Check-in)** | Mã `ma_pnr`, Họ hành khách, vị trí ghế chọn trên sơ đồ tàu bay (`15A`). | Kiểm tra trạng thái vé `Mở chờ bay`; kiểm tra giờ hiện tại cách giờ khởi hành từ 24h đến 1h; xác nhận quy định an ninh. | Sinh bản ghi `THE_LEN_MAY_BAY` kèm số thứ tự `SEQ`, cửa ra tàu bay `Gate` và mã vạch 2D `BCBP`. | Ràng buộc duy nhất (`UNIQUE`) đảm bảo mỗi vé điện tử và mỗi số ghế trên một chuyến bay chỉ cấp 1 thẻ lên máy bay hợp lệ. |
