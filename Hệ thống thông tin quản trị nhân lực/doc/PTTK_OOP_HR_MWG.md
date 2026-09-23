# HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH

# HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG

---

# TÊN ĐỀ TÀI:

# XÂY DỰNG HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC
# CHO CÔNG TY CỔ PHẦN ĐẦU TƯ THẾ GIỚI DI ĐỘNG (MWG)

---

**BÁO CÁO KẾT THÚC HỌC PHẦN**

Học phần: Hệ thống thông tin quản lý nhân lực

Giảng viên hướng dẫn: Thầy Hoàng Minh Ngọc  
Sinh viên thực hiện: Lê Quốc Huy  
Mã sinh viên: 2305HTTB011  
Lớp chuyên ngành: HTTT Quản lý B - K23  

Hà Nội, 2026

---

# LỜI CẢM ƠN

Kính gửi: Lãnh đạo Khoa Khoa học Liên ngành - Ngoại ngữ - Tin học; Thầy Hoàng Minh Ngọc - Giảng viên học phần Hệ thống thông tin quản lý nhân lực.

Để bài báo cáo bài tập lớn kết thúc học phần này được hoàn thiện một cách chỉn chu, khoa học và phản ánh sát thực tiễn hoạt động của một tập đoàn bán lẻ quy mô hàng đầu Việt Nam, em xin bày tỏ lòng biết ơn sâu sắc đến Thầy Hoàng Minh Ngọc. Thầy đã dành nhiều thời gian, tâm huyết để tận tình hướng dẫn, truyền đạt những kiến thức chuyên môn quý báu về phương pháp phân tích thiết kế hệ thống hướng đối tượng (OOAD) và quản trị nhân lực hiện đại, đồng thời đưa ra những đóng góp, định hướng phương pháp luận xác đáng giúp em tháo gỡ các bài toán nghiệp vụ phức tạp về quản trị nhân sự phân tán trong suốt quá trình nghiên cứu đề tài.

Đồng thời, em cũng xin bày tỏ lòng biết ơn chân thành đến Ban Giám hiệu cùng tập thể quý Thầy, Cô giáo tại Học viện Hành chính và Quản trị công đã không ngừng tạo mọi điều kiện thuận lợi nhất về môi trường học thuật, cơ sở vật chất chất lượng cao để chúng em được trau dồi tri thức, rèn luyện tư duy hệ thống và phương pháp luận giải quyết các bài toán chuyển đổi số trong thực tiễn doanh nghiệp.

Cuối cùng, em xin gửi lời tri ân sâu sắc đến gia đình, người thân và bạn bè – những người luôn là điểm tựa tinh thần vững chắc, không ngừng động viên, hỗ trợ và đồng hành cùng em trong suốt chặng đường học tập và rèn luyện vừa qua.

Em xin chân thành cảm ơn!

---

# LỜI CAM ĐOAN

Em xin cam đoan rằng toàn bộ nội dung được trình bày trong bài báo cáo bài tập lớn kết thúc học phần với đề tài "Xây dựng hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG)" là công trình nghiên cứu độc lập, nghiêm túc của riêng bản thân em dưới sự hướng dẫn chuyên môn của Thầy Hoàng Minh Ngọc.

Đề tài này được thực hiện dựa trên nền tảng kiến thức lý thuyết đã được trang bị trong học phần Hệ thống thông tin quản lý nhân lực, kết hợp chặt chẽ với quá trình tìm hiểu thực tế về mô hình tổ chức, mạng lưới bán lẻ chuỗi đa kênh, quy trình phân ca làm việc, cơ chế đãi ngộ theo doanh số và hiện trạng chuyển đổi số trong quản trị nhân sự tại Công ty Cổ phần Đầu tư Thế Giới Di Động.

Em xin khẳng định rằng mọi số liệu, biểu đồ, hình ảnh và kết quả phân tích trong báo cáo là trung thực, rõ ràng và có trích dẫn nguồn gốc đầy đủ theo đúng quy chuẩn học thuật. Toàn bộ danh mục 47 Use Case và các sơ đồ kỹ thuật UML đều được tự xây dựng dựa trên đặc tả bài toán vận hành thực tế của doanh nghiệp bán lẻ.

Em xin hoàn toàn chịu trách nhiệm trước Bộ môn, Khoa và Ban Giám hiệu Nhà trường về tính trung thực và sự chuẩn mực của nội dung được trình bày trong toàn bộ tài liệu này.

Em xin trân trọng cam đoan!

---

# MỤC LỤC

DANH MỤC TỪ/ THUẬT NGỮ VIẾT TẮT  
DANH MỤC BẢNG BIỂU, SƠ ĐỒ  
PHẦN MỞ ĐẦU  
1. Lý do chọn đề tài  
2. Tổng quan về Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG)  
3. Mục tiêu và nhiệm vụ của đề tài  
4. Đối tượng và phạm vi nghiên cứu  
5. Cấu trúc của báo cáo  
PHẦN NỘI DUNG  
CHƯƠNG 1: CƠ SỞ LÝ LUẬN VỀ QUẢN TRỊ NHÂN LỰC VÀ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC  
1.1. Lý thuyết cơ sở  
1.2. Một số vấn đề liên quan đến chủ đề quản trị nhân lực chuỗi bán lẻ quy mô lớn  
1.3. Phát biểu bài toán cần giải quyết tại Thế Giới Di Động (MWG)  
Tóm tắt chương 1  
CHƯƠNG 2: THIẾT KẾ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC CHO CÔNG TY CỔ PHẦN ĐẦU TƯ THẾ GIỚI DI ĐỘNG (MWG)  
2.1. Phân tích các yêu cầu nghiệp vụ  
2.2. Phân tích cấu trúc hệ thống  
2.3. Phân tích hành vi của hệ thống  
2.4. Thiết kế hệ thống  
Tóm tắt chương 2  
CHƯƠNG 3: KẾT QUẢ ĐẠT ĐƯỢC VÀ ĐỀ XUẤT, KHUYẾN NGHỊ HOẶC HƯỚNG NGHIÊN CỨU PHÁT TRIỂN  
3.1. Những kết quả đạt được  
3.2. Đánh giá ưu, nhược điểm  
3.3. Hướng nghiên cứu, phát triển  
Tóm tắt chương 3  
TÀI LIỆU THAM KHẢO  

---

# DANH MỤC TỪ/ THUẬT NGỮ VIẾT TẮT

| STT | Từ viết tắt | Thuật ngữ đầy đủ và Diễn giải |
| :---: | :---: | :--- |
| 1 | AI | Artificial Intelligence (Trí tuệ nhân tạo) |
| 2 | AM | Area Manager (Quản lý khu vực phụ trách một cụm siêu thị/cửa hàng) |
| 3 | API | Application Programming Interface (Giao diện lập trình ứng dụng) |
| 4 | ATS | Applicant Tracking System (Hệ thống quản lý và theo dõi phễu tuyển dụng ứng viên) |
| 5 | BHX | Bách Hóa Xanh (Chuỗi bán lẻ thực phẩm tươi sống và hàng tiêu dùng nhanh trực thuộc MWG) |
| 6 | BHTN | Bảo hiểm thất nghiệp |
| 7 | BHXH | Bảo hiểm xã hội |
| 8 | BHYT | Bảo hiểm y tế |
| 9 | BNV | Bộ Nội vụ (Quy chuẩn hồ sơ cán bộ theo Mẫu 2C-BNV) |
| 10 | BSSID | Basic Service Set Identifier (Mã định danh phần cứng của thiết bị phát Wifi cửa hàng) |
| 11 | C&B | Compensation & Benefits (Bộ phận Chế độ đãi ngộ, Tiền lương và Phúc lợi) |
| 12 | CCCD | Căn cước công dân |
| 13 | CSAT | Customer Satisfaction Score (Điểm chỉ số đo lường sự hài lòng của khách hàng đối với nhân viên) |
| 14 | CSDL | Cơ sở dữ liệu |
| 15 | CV | Curriculum Vitae (Hồ sơ lý lịch trích ngang của ứng viên) |
| 16 | DC | Distribution Center (Trung tâm phân phối / Tổng kho vận chuyển logistics của MWG) |
| 17 | DMX | Điện Máy Xanh (Chuỗi bán lẻ điện máy và thiết bị gia dụng trực thuộc MWG) |
| 18 | ĐHCĐ | Đại hội đồng Cổ đông |
| 19 | ĐKKD | Đăng ký kinh doanh |
| 20 | ERD | Entity-Relationship Diagram (Sơ đồ quan hệ thực thể cơ sở dữ liệu) |
| 21 | ERP | Enterprise Resource Planning (Hệ thống hoạch định tài nguyên doanh nghiệp) |
| 22 | ESOP | Employee Stock Ownership Plan (Chương trình phát hành cổ phiếu thưởng cho người lao động) |
| 23 | ESS | Employee Self-Service (Cổng thông tin tự phục vụ dành cho nhân viên) |
| 24 | FMCG | Fast-Moving Consumer Goods (Hàng hóa tiêu dùng nhanh) |
| 25 | GPS | Global Positioning System (Hệ thống định vị toàn cầu phục vụ kiểm soát bán kính điểm danh) |
| 26 | HĐLĐ | Hợp đồng lao động |
| 27 | HĐQT | Hội đồng Quản trị |
| 28 | HR | Human Resources (Nguồn nhân lực / Bộ phận Quản trị Nhân sự) |
| 29 | HRMS | Human Resource Management System (Hệ thống thông tin quản trị nhân lực) |
| 30 | IR | Infrared (Cảm biến hồng ngoại phát hiện nhiệt độ và độ sâu chống giả mạo sinh trắc học) |
| 31 | ISO | International Organization for Standardization (Tổ chức Tiêu chuẩn hóa Quốc tế) |
| 32 | IT | Information Technology (Công nghệ thông tin) |
| 33 | JD | Job Description (Bản mô tả vị trí và tiêu chuẩn công việc) |
| 34 | JWT | JSON Web Token (Tiêu chuẩn mã hóa token phiên làm việc bảo mật) |
| 35 | KPI | Key Performance Indicator (Chỉ số đánh giá hiệu quả công việc then chốt) |
| 36 | L&D | Learning & Development (Bộ phận Đào tạo và Phát triển năng lực nhân sự) |
| 37 | MWG | Mobile World Investment Corporation (Công ty Cổ phần Đầu tư Thế Giới Di Động) |
| 38 | NĐ | Nghị định (Nghị định của Chính phủ) |
| 39 | NPS | Net Promoter Score (Chỉ số đo lường mức độ hài lòng và sẵn lòng giới thiệu của khách hàng) |
| 40 | OOAD | Object-Oriented Analysis and Design (Phân tích và thiết kế hướng đối tượng) |
| 41 | OOP | Object-Oriented Programming (Lập trình hướng đối tượng) |
| 42 | ORM | Object-Relational Mapping (Kỹ thuật ánh xạ thực thể cơ sở dữ liệu quan hệ) |
| 43 | OT | Overtime (Làm thêm ngoài giờ quy định) |
| 44 | QR | Quick Response Code (Mã phản hồi nhanh hai chiều) |
| 45 | RACI | Responsible, Accountable, Consulted, Informed (Ma trận phân định trách nhiệm phối hợp) |
| 46 | RBAC | Role-Based Access Control (Mô hình kiểm soát truy cập dựa trên vai trò) |
| 47 | SM | Store Manager (Quản lý siêu thị / Trưởng cửa hàng bán lẻ) |
| 48 | SOP | Standard Operating Procedure (Quy trình thao tác vận hành chuẩn) |
| 49 | TGDD | Thế Giới Di Động (Chuỗi bán lẻ thiết bị di động, công nghệ trực thuộc MWG) |
| 50 | TNCN | Thuế thu nhập cá nhân |
| 51 | TP.HCM | Thành phố Hồ Chí Minh |
| 52 | UI / UX | User Interface / User Experience (Giao diện người dùng / Trải nghiệm người dùng) |
| 53 | UML | Unified Modeling Language (Ngôn ngữ mô hình hóa thống nhất) |

---

# DANH MỤC BẢNG BIỂU, SƠ ĐỒ

**Danh mục Bảng biểu:**
- Bảng 1.1. Mạng lưới các chuỗi bán lẻ và hệ sinh thái kinh doanh trực thuộc MWG
- Bảng 1.2. Tổng hợp các chứng nhận, giải thưởng và thành tựu xuất sắc của MWG
- Bảng 1.3. Cơ cấu nguồn nhân lực theo khối chức năng và địa bàn tại MWG
- Bảng 1.4. Ma trận phân định trách nhiệm liên phòng ban trong các quy trình quản trị nhân sự (RACI Matrix)
- Bảng 2.1. Ánh xạ tác nhân hệ thống với cơ cấu tổ chức và chức danh thực tế của MWG
- Bảng 2.2. Danh sách 47 Use Case của Hệ thống Quản trị nhân lực MWG
- Bảng 2.3. Bảng ánh xạ ba tầng: từ Quy trình nghiệp vụ bán lẻ đến Use Case và Màn hình thực tế
- Bảng 2.4. Ma trận phân quyền truy cập chức năng theo vai trò người dùng (RBAC Matrix)
- Bảng 2.5. Đặc tả cấu trúc lược đồ Cơ sở dữ liệu quan hệ 87 bảng của hệ thống
- Bảng 2.6. So sánh các phương thức điểm danh đa nguồn trong hệ thống bán lẻ MWG

**Danh mục Sơ đồ, Hình ảnh:**
- Hình 1.1. Sơ đồ cơ cấu tổ chức tổng thể Tập đoàn Thế Giới Di Động (MWG)
- Hình 1.2. Cơ cấu tổ chức chi tiết Khối Nhân sự Tập đoàn và Khối Vận hành Bán lẻ (Siêu thị)
- Hình 1.3. Cơ cấu chi tiết Khối Chuỗi cung ứng (Logistics/DC) và Khối Công nghệ Thông tin (MWG IT)
- Hình 1.4. Mô hình ma trận phối hợp 3 mắt xích trong quản trị nhân lực bán lẻ MWG
- Hình 2.1. Biểu đồ cây phân cấp Tác nhân (Actor Generalization)
- Hình 2.2. Biểu đồ Use Case tổng quan Hệ thống Quản trị nhân lực MWG (47 Use Case chia 10 nhóm)
- Hình 2.3 đến Hình 2.12. Biểu đồ Use Case chi tiết cho 10 phân hệ chức năng (Nhóm A đến Nhóm J)
- Hình 2.13 đến Hình 2.59. Hệ thống Biểu đồ Trình tự (Sequence Diagrams) đặc tả 47 Use Case
- Hình 2.60 đến Hình 2.106. Hệ thống Biểu đồ Hoạt động (Activity Diagrams) đặc tả 47 Use Case
- Hình 2.107 đến Hình 2.111. Hệ thống Biểu đồ Trạng thái (State Machine Diagrams) các thực thể cốt lõi
- Hình 2.112. Biểu đồ gói tổng quan của hệ thống (Package Diagram)
- Hình 2.113 đến Hình 2.122. Hệ thống Biểu đồ Lớp chi tiết (Class Diagrams) theo 10 phân hệ nghiệp vụ
- Hình 2.123. Biểu đồ lớp phân tích Use Case Đăng ký nghỉ phép / Đổi ca làm việc (UC21)
- Hình 2.124. Biểu đồ lớp miền cốt lõi của hệ thống (Domain Model)
- Hình 2.125. Mô hình cơ sở dữ liệu quan hệ vật lý của hệ thống (87 bảng dữ liệu)
- Hình 2.126. Mô hình dữ liệu mở rộng cho chấm công đa nguồn phân tán (GPS, FaceID, Wifi, Vân tay)
- Hình 2.127. Sơ đồ kiến trúc phần mềm 3 tầng phân tán tối ưu hóa cho chuỗi bán lẻ quy mô lớn

---

# PHẦN MỞ ĐẦU

## 1. Lý do chọn đề tài

Trong bối cảnh nền kinh tế tiêu dùng và bán lẻ hiện đại tại Việt Nam phát triển với tốc độ vũ bão, mô hình bán lẻ chuỗi đa kênh (Omnichannel Retail) đã trở thành trụ cột quan trọng, đáp ứng nhu cầu thiết yếu hàng ngày của hàng chục triệu người tiêu dùng trên khắp mọi miền đất nước. Khác biệt căn bản với các doanh nghiệp sản xuất phần mềm tập trung tại các tòa nhà văn phòng, ngành bán lẻ chuỗi sở hữu mạng lưới cửa hàng trải rộng khắp 63 tỉnh thành, với lực lượng lao động tuyến đầu (Frontline Workers) cực kỳ đông đảo, làm việc theo ca kíp luân phiên liên tục 7 ngày trong tuần, kể cả các dịp cao điểm Lễ, Tết.

Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG) là tập đoàn bán lẻ số 1 tại Việt Nam về doanh thu và mạng lưới phân phối, với quy mô hơn 65.000 cán bộ nhân viên đang công tác tại hơn 4.000 siêu thị, cửa hàng thuộc các chuỗi Thế Giới Di Động, Điện Máy Xanh, Bách Hóa Xanh, Nhà thuốc An Khang, chuỗi quốc tế EraBlue cùng hệ thống trung tâm phân phối logistics rộng khắp. Cùng với quy mô vận hành khổng lồ, công tác quản trị nguồn nhân lực tại MWG đối mặt với những bài toán đặc thù và thách thức chưa từng có:
- Thứ nhất, lực lượng lao động tuyến đầu tại các cửa hàng có tỷ lệ luân chuyển và biến động tự nhiên tương đối cao (đặc thù chung của ngành dịch vụ bán lẻ), đòi hỏi công tác tuyển dụng số lượng lớn (Mass Recruitment) phải được vận hành liên tục, tự động hóa từ khâu tiếp nhận hồ sơ, sàng lọc năng lực đến ký kết hợp đồng điện tử hàng loạt.
- Thứ hai, phương thức phân ca và ghi nhận thời gian làm việc mang tính động rất cao: nhân viên thường xuyên làm ca xoay, ca gãy, đăng ký đổi ca đột xuất để phục vụ lưu lượng khách hàng; việc chấm công phải thực hiện tức thời ngay tại các điểm bán phân tán thông qua ứng dụng di động kết hợp định vị GPS trong bán kính cho phép (Geofencing), nhận diện khuôn mặt chống gian lận và xác thực mạng Wifi nội bộ của siêu thị.
- Thứ ba, chính sách đãi ngộ và tiền lương gắn chặt với kết quả kinh doanh: thu nhập của người lao động không chỉ gồm lương thời gian cơ bản mà phần lớn phụ thuộc vào doanh số thực tế của siêu thị (Store Target), hoa hồng ngành hàng (Incentive), thưởng doanh số sản phẩm và chỉ số đánh giá chất lượng phục vụ của khách hàng (CSAT "Tận tâm phục vụ").
- Thứ tư, việc điều chuyển nhân sự tăng cường linh hoạt giữa các siêu thị trong cùng cụm quận/huyện trong các chiến dịch khuyến mãi lớn đòi hỏi dữ liệu nhân sự, bảng công và quỹ lương phải được đồng bộ tức thời theo thời gian thực.
- Thứ năm, việc chuẩn hóa dữ liệu hồ sơ nhân sự, rà soát nâng bậc lương, xét duyệt thăng chức nội bộ từ nhân viên lên Quản lý siêu thị và tuân thủ các quy định pháp luật lao động (Bộ luật Lao động 2019, Luật BHXH, Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân) đặt ra yêu cầu cấp thiết về một nền tảng quản trị số hóa tập trung, minh bạch và an toàn tuyệt đối.

Xuất phát từ thực tiễn sinh động và quy mô đặc biệt phức tạp đó, việc nghiên cứu, phân tích và thiết kế một **Hệ thống thông tin quản trị nhân lực toàn diện cho Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG)** ứng dụng phương pháp phân tích thiết kế hướng đối tượng (OOAD) bằng ngôn ngữ mô hình hóa UML là hết sức cấp thiết. Đề tài nhằm số hóa trọn vẹn vòng đời nhân sự bán lẻ, chuẩn hóa cấu trúc cơ sở dữ liệu phân tán, tự động hóa các chuỗi quy trình tác nghiệp liên phòng ban và cung cấp cổng tự phục vụ thông minh cho hàng chục nghìn người lao động. Đó chính là lý do em lựa chọn đề tài nghiên cứu này cho bài báo cáo kết thúc học phần.

---

## 2. Tổng quan về Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG)

### 2.1. Thông tin chung và Hồ sơ pháp lý doanh nghiệp

Công ty Cổ phần Đầu tư Thế Giới Di Động (tên giao dịch quốc tế: **MOBILE WORLD INVESTMENT CORPORATION**, mã chứng khoán: **MWG** niêm yết trên Sở Giao dịch Chứng khoán TP. Hồ Chí Minh - HOSE) là tập đoàn bán lẻ đa ngành hàng đầu tại Việt Nam và khu vực Đông Nam Á.

- **Tên tiếng Việt:** CÔNG TY CỔ PHẦN ĐẦU TƯ THẾ GIỚI DI ĐỘNG
- **Tên viết tắt:** MWG
- **Trụ sở chính:** Tòa nhà MWG, Lô T2-1.2, Đường D1, Khu Công nghệ cao, Phường Tân Phú, Thành phố Thủ Đức, Thành phố Hồ Chí Minh.
- **Mã số thuế / ĐKKD:** 0303270651 do Sở Kế hoạch và Đầu tư TP.HCM cấp lần đầu ngày 16/01/2004.
- **Đại diện pháp luật & Lãnh đạo chủ chốt:**
  - Chủ tịch Hội đồng Quản trị: Ông Nguyễn Đức Tài
  - Tổng Giám đốc (CEO) Tập đoàn: Ông Trần Huy Thanh Tùng
  - Các thành viên Ban Điều hành phụ trách các chuỗi kinh doanh và khối chức năng: Ông Đoàn Văn Hiểu Em (CEO Chuỗi Điện Máy Xanh & Thế Giới Di Động), Ông Phạm Văn Trọng (CEO Chuỗi Bách Hóa Xanh), Ông Đặng Minh Lượm (Thành viên HĐQT phụ trách Quản trị Nguồn nhân lực).

MWG vận hành một hệ sinh thái bán lẻ đa chuỗi phục vụ hàng triệu người tiêu dùng mỗi ngày:

**Bảng 1.1. Mạng lưới các chuỗi bán lẻ và hệ sinh thái kinh doanh trực thuộc MWG**

| Chuỗi bán lẻ / Đơn vị | Lĩnh vực kinh doanh chủ lực | Quy mô mạng lưới điểm bán | Địa bàn hoạt động |
| :--- | :--- | :--- | :--- |
| **Thế Giới Di Động (thegioididong.com)** | Điện thoại di động, máy tính bảng, máy tính xách tay, phụ kiện công nghệ cao | Hơn 1.000 siêu thị | 63 tỉnh thành toàn quốc |
| **Điện Máy Xanh (dienmayxanh.com)** | Điện tử, điện lạnh, thiết bị gia dụng và thiết bị giải trí số lớn nhất Việt Nam | Hơn 2.000 siêu thị (gồm các mô hình DMX lớn và DMX mini) | 63 tỉnh thành, phủ sóng sâu rộng đến cấp huyện, xã |
| **Bách Hóa Xanh (bachhoaxanh.com)** | Bán lẻ thực phẩm tươi sống, nông sản, thực phẩm chế biến và hàng tiêu dùng nhanh (FMCG) | Hơn 1.700 siêu thị mini | TP.HCM, các tỉnh Nam Bộ, Nam Trung Bộ và Tây Nguyên |
| **Nhà thuốc An Khang (nhathuocankhang.com)** | Dược phẩm, thực phẩm chức năng, thiết bị y tế gia đình và mỹ phẩm chăm sóc sức khỏe | Hơn 500 nhà thuốc hiện đại | Các thành phố lớn và thị trấn đông dân cư |
| **Chuỗi EraBlue (Indonesia)** | Bán lẻ điện máy và thiết bị gia dụng tại Indonesia (liên doanh giữa MWG và PT Erafone Artha Retailindo) | Hơn 60 siêu thị điện máy | Thị trường Indonesia |
| **Dịch vụ Tận Tâm (Thành viên MWG)** | Dịch vụ giao nhận, lắp đặt, bảo hành và sửa chữa thiết bị điện máy, điện tử chuyên nghiệp tại nhà | Phục vụ toàn bộ mạng lưới siêu thị Điện Máy Xanh | Phủ sóng 63 tỉnh thành |
| **Hệ thống Kho vận MWG Logistics** | Quản lý hệ thống Tổng kho phân phối (DC), kho trung chuyển, đội xe vận tải và giao hàng chặng cuối | Hàng chục Tổng kho DC hiện đại diện tích hàng chục nghìn m² | Bình Dương, Cần Thơ, Đà Nẵng, Bắc Ninh, Hà Nội |
| **Khối Công nghệ Thông tin (MWG IT)** | Nghiên cứu, phát triển và vận hành hệ thống phần mềm quản trị ERP, ứng dụng nội bộ và hạ tầng số | Khối kỹ sư công nghệ đặt tại Trụ sở MWG TP.HCM | Phục vụ toàn bộ hoạt động của Tập đoàn |

---

### 2.2. Lịch sử hình thành và các mốc phát triển chiến lược

Quá trình hơn hai thập kỷ hình thành và phát triển của MWG ghi dấu ấn chuyển đổi mạnh mẽ từ một cửa hàng điện thoại nhỏ thành tập đoàn bán lẻ có giá trị vốn hóa hàng tỷ USD:

- **Năm 2004 (Khởi nghiệp đặt nền móng):** Tiền thân là mô hình bán hàng trực tuyến kết hợp cửa hàng nhỏ tại TP.HCM do 5 thành viên đồng sáng lập: Nguyễn Đức Tài, Trần Lê Quân, Điêu Chính Hải Triều, Trần Huy Thanh Tùng và Đặng Minh Lượm.
- **Giai đoạn 2007 - 2009 (Bứt phá chuỗi Thế Giới Di Động):** Tiếp nhận vốn đầu tư từ Quỹ Mekong Enterprise Fund II, MWG mở rộng chuỗi Thegioididong.com với tốc độ vũ bão, định hình chuẩn mực dịch vụ khách hàng và văn hóa "Khách hàng là số 1".
- **Năm 2010 (Ra đời chuỗi Điện Máy Xanh):** Khai trương chuỗi bán lẻ điện máy đầu tiên (tiền thân là Dienmay.com), đặt nền móng cho cuộc cách mạng ngành hàng điện máy gia dụng tại Việt Nam.
- **Năm 2014 (Niêm yết trên thị trường chứng khoán):** Cổ phiếu MWG chính thức niêm yết trên sàn HOSE, trở thành một trong những mã cổ phiếu blue-chip có thanh khoản và uy tín hàng đầu thị trường vốn Việt Nam.
- **Năm 2015 (Khởi động chuỗi Bách Hóa Xanh):** Mở rộng sang mảng bán lẻ thực phẩm tươi sống và nhu yếu phẩm hàng ngày, nhắm tới việc phục vụ nhu cầu thường nhật của các gia đình Việt Nam.
- **Giai đoạn 2017 - 2019 (Mua bán sáp nhập và bùng nổ điểm bán):** Mua lại chuỗi bán lẻ điện máy Trần Anh (mở rộng thị trường miền Bắc); thâu tóm chuỗi nhà thuốc Phúc An Khang (chuyển đổi thành Nhà thuốc An Khang); cán mốc 3.000 điểm bán trên toàn quốc.
- **Giai đoạn 2020 - 2022 (Vượt qua thách thức đại dịch và tiến ra quốc tế):** Doanh thu vượt mốc 130.000 tỷ VNĐ; thành lập liên doanh PT Era Blue Elektronis tại Indonesia, mở siêu thị điện máy EraBlue đầu tiên tại Jakarta; phát triển mạnh mẽ nền tảng bán hàng đa kênh.
- **Giai đoạn 2023 - 2026 (Tối ưu hóa vận hành, Chuyển đổi số toàn diện):** Tái cấu trúc tinh gọn hệ thống cửa hàng, nâng cao hiệu quả trên từng mét vuông bán vụ; đưa Bách Hóa Xanh đạt điểm hòa vốn và có lợi nhuận vững chắc; đẩy mạnh ứng dụng AI và chuyển đổi số toàn diện trong công tác quản trị chuỗi cung ứng và nhân sự.

---

### 2.3. Tầm nhìn chiến lược, Sứ mệnh phát triển và Hệ giá trị cốt lõi

#### A. Tầm nhìn chiến lược
*"Tập đoàn Thế Giới Di Động hướng tới vị thế là tập đoàn bán lẻ đa kênh hàng đầu khu vực Đông Nam Á, mang đến cho người tiêu dùng những trải nghiệm mua sắm vượt trội thông qua sự tận tâm phục vụ, hàng hóa chất lượng cao, giá cả cạnh tranh và nền tảng công nghệ số tiên tiến."*

#### B. Sứ mệnh phát triển
*"Mang lại sự tiện ích, an tâm và hài lòng cao nhất cho khách hàng; xây dựng môi trường làm việc công bằng, năng động, nơi mọi nhân viên được trao quyền, được chia sẻ thành quả và có cơ hội thăng tiến rộng mở; tối đa hóa giá trị bền vững cho cổ đông và đóng góp tích cực cho cộng đồng."*

#### C. Triết lý văn hóa: "Kim tự tháp ngược"
Tại MWG, triết lý phục vụ được khắc sâu qua mô hình Kim tự tháp ngược:
1. **Khách hàng** là đối tượng ưu tiên số một;
2. **Nhân viên tuyến đầu** (người trực tiếp tiếp xúc, phục vụ khách hàng tại siêu thị) là đối tượng ưu tiên số hai;
3. **Cán bộ quản lý và Hội đồng Quản trị** là người hỗ trợ, tạo mọi điều kiện thuận lợi nhất để nhân viên hoàn thành xuất sắc sứ mệnh phục vụ khách hàng.

#### D. Hệ thống 5 Giá trị cốt lõi của người MWG
1. **Tận tâm với Khách hàng:** Luôn đặt sự hài lòng của khách hàng làm mục tiêu cao nhất trong từng lời nói, cử chỉ và hành động. Sẵn sàng nhận phần thiệt về mình để mang lại niềm vui cho khách.
2. **Trung thực:** Tuyệt đối trung thực về tài chính, bảo quản hàng hóa siêu thị, thông tin doanh số và các mối quan hệ nội bộ; không gian lận, không vụ lợi cá nhân.
3. **Integrity (Trân trọng lời nói của mình):** Làm đúng những gì đã cam kết. Trong trường hợp không thể hoàn thành cam kết do tình huống khách quan, phải chủ động thông báo cho các bên liên quan, chịu trách nhiệm và tìm biện pháp khắc phục triệt để.
4. **Nhận trách nhiệm:** Khi xảy ra sự cố hoặc kết quả không đạt mục tiêu, luôn coi bản thân là nguyên nhân gốc rễ để tìm giải pháp cải tiến, tuyệt đối không đổ lỗi cho hoàn cảnh hay đồng nghiệp.
5. **Yêu thương và hỗ trợ đồng đội:** Đoàn kết, chân thành chia sẻ kiến thức, kinh nghiệm, hướng dẫn đồng nghiệp mới và sẵn sàng tăng cường hỗ trợ các siêu thị bạn trong các chiến dịch kinh doanh cao điểm.

---

### 2.4. Lĩnh vực hoạt động kinh doanh và Nền tảng công nghệ vận hành

#### A. Lĩnh vực kinh doanh bán lẻ
- **Bán lẻ thiết bị công nghệ và viễn thông:** Cung ứng điện thoại di động, máy tính xách tay, máy tính bảng, thiết bị đeo và linh kiện điện tử chính hãng với các dịch vụ bảo hành toàn diện.
- **Bán lẻ điện máy và gia dụng:** Cung cấp tivi, tủ lạnh, máy giặt, máy lạnh, máy lọc nước, nồi cơm điện và các thiết bị gia dụng nhà bếp thông minh, kết hợp dịch vụ vận chuyển và lắp đặt tận nhà.
- **Bán lẻ thực phẩm và tiêu dùng nhanh:** Cung ứng thịt cá tươi sống, rau củ quả tươi sạch tiêu chuẩn VietGAP, thực phẩm đóng gói và các sản phẩm chăm sóc gia đình với mạng lưới siêu thị mini sát khu dân cư.
- **Bán lẻ dược phẩm:** Chuỗi nhà thuốc đạt chuẩn GPP cung ứng thuốc kê đơn, thuốc không kê đơn, thực phẩm bảo vệ sức khỏe và dụng cụ y tế với đội ngũ Dược sĩ tận tâm tư vấn.
- **Dịch vụ sửa chữa, vệ sinh thiết bị:** Cung cấp giải pháp kỹ thuật bảo dưỡng, sửa chữa thiết bị điện lạnh, điện máy tận nhà người tiêu dùng.

#### B. Nền tảng công nghệ thông tin chủ lực
MWG là một trong những doanh nghiệp bán lẻ hiếm hoi tại Việt Nam tự chủ hoàn toàn hệ thống phần mềm lõi thông qua đội ngũ kỹ sư Khối IT:
- **Hệ thống ERP bán lẻ tự phát triển:** Quản lý tập trung toàn bộ danh mục hàng hóa (SKU), dữ liệu kho hàng thời gian thực, giá bán linh hoạt theo vùng và tích hợp hóa đơn điện tử tự động.
- **Hệ thống Quản trị chuỗi cung ứng (SCM & WMS):** Tối ưu hóa điều phối hàng hóa tự động từ nhà cung cấp về các Tổng kho DC và từ DC về hơn 4.000 siêu thị theo thuật toán tự động đặt hàng (Auto-ordering).
- **Ứng dụng di động nội bộ (MWG Internal App):** Cổng tương tác hàng ngày dành cho hơn 65.000 cán bộ nhân viên, tích hợp chấm công GPS, phân ca, tra cứu phiếu lương, xem chỉ số doanh số thời gian thực và học tập trực tuyến.
- **Hạ tầng máy chủ đám mây lai (Hybrid Cloud):** Kết hợp các cụm máy chủ nội bộ hiệu năng cao với các dịch vụ đám mây AWS và Google Cloud, bảo đảm khả năng mở rộng linh hoạt phục vụ hàng triệu lượt truy cập đồng thời trong các dịp khuyến mãi Black Friday hay Tết Nguyên đán.

---

### 2.5. Hệ thống chứng nhận và Giải thưởng thành tựu

**Bảng 1.2. Tổng hợp các chứng nhận, giải thưởng và thành tựu xuất sắc của MWG**

| Nhóm danh hiệu / Tiêu chuẩn | Tên danh hiệu / Giải thưởng | Cơ quan / Tổ chức trao tặng | Năm đạt được / Vị thế |
| :--- | :--- | :--- | :--- |
| **Quy mô doanh nghiệp bán lẻ** | **Top 500 Nhà bán lẻ hàng đầu Châu Á - Thái Bình Dương (Retail Asia-Pacific Top 500)** | Tạp chí Retail Asia & Euromonitor | Doanh nghiệp bán lẻ số 1 Việt Nam nhiều năm liên tiếp |
| **Xếp hạng vốn hóa và hiệu quả** | **Top 50 Công ty niêm yết tốt nhất Việt Nam** | Tạp chí Forbes Việt Nam | Vinh danh liên tục từ năm 2014 đến 2025 |
| **Văn hóa doanh nghiệp & Môi trường làm việc** | **Doanh nghiệp có Nơi làm việc tốt nhất Việt Nam (Vietnam Best Places to Work)** | Anphabe & Intage Việt Nam | Dẫn đầu ngành bán lẻ/chuỗi dịch vụ nhiều năm |
| **Thương hiệu quốc gia** | **Thương hiệu Quốc gia Việt Nam (Vietnam Value)** | Bộ Công Thương Việt Nam | Thế Giới Di Động và Điện Máy Xanh được công nhận |
| **Thành tựu chuyển đổi số** | **Giải thưởng Doanh nghiệp Chuyển đổi số xuất sắc** | Hội Truyền thông số Việt Nam (VDA) | Hệ thống ERP và App bán lẻ nội bộ tiên tiến |
| **Quản trị minh bạch** | **Top 10 Doanh nghiệp Quản trị công ty tốt nhất (Nhóm vốn hóa lớn)** | Sở Giao dịch Chứng khoán TP.HCM (HOSE) | Đánh giá thường niên |

---

### 2.6. Cơ cấu tổ chức bộ máy quản lý của Tập đoàn Thế Giới Di Động (MWG)

Cơ cấu tổ chức của MWG được thiết lập theo mô hình ma trận kết hợp giữa Khối Hỗ trợ/Chiến lược tập trung tại Trụ sở chính (HQ) và Khối Vận hành Bán lẻ phân cấp đa tầng trải dài theo các khu vực địa lý.

Hệ thống cơ cấu tổ chức hiện tại của MWG bao gồm các cấp bậc quản lý phân định rõ ràng:

#### A. Cấp Quản trị Sở hữu và Ban Lãnh đạo Tập đoàn
- **Đại hội đồng Cổ đông (ĐHCĐ):** Cơ quan quyết định cao nhất của công ty niêm yết, phê chuẩn các định hướng chiến lược mở rộng kinh doanh, kế hoạch phát hành cổ phiếu thưởng ESOP thường niên cho người lao động có đóng góp lớn và phê duyệt báo cáo tài chính kiểm toán.
- **Hội đồng Quản trị (HĐQT):** Đứng đầu là Chủ tịch HĐQT Nguyễn Đức Tài, chịu trách nhiệm định hình chiến lược phát triển dài hạn, giám sát việc thực thi của Ban Điều hành và đảm bảo lợi ích hài hòa giữa Cổ đông, Khách hàng và Người lao động.
- **Ban Tổng Giám đốc (BGD):** Đứng đầu là Tổng Giám đốc (CEO) Tập đoàn cùng các Giám đốc Điều hành phụ trách từng chuỗi kinh doanh (CEO TGDD/DMX, CEO BHX, CEO An Khang). Ban Tổng Giám đốc nắm thẩm quyền phê duyệt cao nhất đối với các quy chế nhân sự, ngân sách tiền lương tập đoàn, chỉ tiêu định biên nhân sự toàn quốc và các quyết định khen thưởng, bổ nhiệm cán bộ quản lý cấp cao.

#### B. Khối Quản trị Nguồn nhân lực Tập đoàn (Corporate HR)
Khối Nhân sự Tập đoàn giữ vai trò tham mưu chiến lược, thiết lập chính sách chung và điều phối toàn bộ các hoạt động nhân sự trên toàn hệ thống:
1. *Phòng Tuyển dụng Số lượng lớn (Mass Recruitment - TA):* Chịu trách nhiệm vận hành cổng tuyển dụng vieclam.thegioididong.com, tổ chức các chiến dịch tuyển dụng quy mô lớn hàng nghìn nhân sự bán lẻ, kho vận cho các siêu thị mới mở; áp dụng hệ thống lọc CV tự động và phỏng vấn tập trung qua video.
2. *Phòng Tiền lương, Chế độ & Phúc lợi (Corporate C&B):* Xây dựng chính sách lương 3P bán lẻ, công thức thưởng doanh số theo kết quả siêu thị, điều hành quy trình chốt công đa nguồn và vận hành chức năng tính lương tự động cho hơn 65.000 người lao động; trích nộp BHXH, tính thuế TNCN và giải ngân cổ phiếu ESOP.
3. *Phòng Đào tạo & Văn hóa Doanh nghiệp (L&D & Corporate Culture):* Đào tạo hội nhập văn hóa "Tận tâm phục vụ khách hàng" cho 100% nhân viên mới; tổ chức các kỳ thi sát hạch nghiệp vụ định kỳ và kỳ thi thăng cấp Quản lý siêu thị (Store Manager Promotion Test).
4. *Phòng Nhân sự Vận hành & Quan hệ Lao động (HR Operation & Employee Relations):* Quản lý hồ sơ nhân sự tập trung, điều phối các thủ tục ký kết hợp đồng lao động điện tử, quản lý thuyên chuyển nhân sự liên chuỗi/liên vùng, xử lý khen thưởng, kỷ luật lao động và giải quyết khiếu nại của nhân viên.

#### C. Khối Vận hành Bán lẻ (Store Operations)
Khối Vận hành là lực lượng trực tiếp tạo ra doanh thu, được phân cấp chặt chẽ theo cấu trúc địa lý:
1. *Giám đốc Chuỗi & Giám đốc Miền (Bắc, Trung, Nam):* Điều hành chiến lược kinh doanh của từng chuỗi bán lẻ theo khu vực lãnh thổ.
2. *Giám đốc Vùng / Quản lý Khu vực (Area Manager - AM):* Mỗi AM phụ trách quản lý từ 15 đến 25 siêu thị trong một tỉnh hoặc một quận/huyện lớn; chịu trách nhiệm về chỉ tiêu doanh thu, chi phí vận hành, định biên nhân sự và phê duyệt các biến động nhân sự cấp siêu thị.
3. *Quản lý Cụm siêu thị (Cluster Leader):* Hỗ trợ AM điều phối nhân sự tăng cường giữa các siêu thị lân cận trong những dịp cao điểm khuyến mãi.
4. *Quản lý Siêu thị (Store Manager - SM):* Là "CEO thu nhỏ" tại mỗi điểm bán; chịu trách nhiệm toàn diện về doanh thu, bảo quản tài sản hàng hóa, dịch vụ khách hàng, lập lịch phân ca xoay cho nhân viên, đánh giá kết quả thử việc và sơ tuyển ứng viên tại chỗ.
5. *Trưởng ca bán hàng (Shift Leader):* Điều phối hoạt động trong ca trực (ca sáng, ca chiều, ca gãy), giám sát tác phong phục vụ, giải quyết khiếu nại phát sinh của khách hàng.
6. *Lực lượng Nhân sự Tuyến đầu tại Siêu thị:*
   - *Nhân viên Tư vấn bán hàng:* Tiếp đón, lắng nghe nhu cầu và giới thiệu sản phẩm cho khách hàng.
   - *Nhân viên Thu ngân - Kế toán siêu thị:* Quản lý thanh toán, xuất hóa đơn, quản lý két tiền mặt và quỹ siêu thị.
   - *Nhân viên Kho siêu thị:* Tiếp nhận hàng hóa từ tổng kho DC, dán tem giá, sắp xếp hàng hóa lên kệ và kiểm kê định kỳ.
   - *Nhân viên Kỹ thuật lắp đặt & Hỗ trợ công nghệ:* Hướng dẫn cài đặt máy móc, hỗ trợ kỹ thuật, dán màn hình và chuyển giao sản phẩm cho khách hàng.

#### D. Khối Chuỗi cung ứng và Kho vận (MWG Logistics)
- Quản lý mạng lưới các Tổng kho phân phối (DC) quy mô lớn tại các tỉnh trọng điểm.
- Đội ngũ Thủ kho, Nhân viên phân loại, bốc xếp hàng hóa và Đội xe giao hàng chặng cuối cho khách hàng.

#### E. Khối Công nghệ Thông tin (MWG IT)
- Chịu trách nhiệm thiết kế, bảo trì hạ tầng máy chủ, phát triển các ứng dụng bán lẻ, hệ thống tính lương tự động, ứng dụng di động nội bộ và đảm bảo an toàn thông tin, an ninh mạng cho toàn Tập đoàn.

#### F. Khối Tài chính - Kế toán (Finance & Accounting)
- Kiểm soát chi phí vận hành của từng siêu thị, quản lý dòng tiền thanh toán qua ngân hàng, đối soát các khoản tạm ứng, chi trả lương và quyết toán thuế với cơ quan nhà nước.

---

### 2.7. Đặc điểm cơ cấu nguồn nhân lực tại MWG

Nguồn nhân lực bán lẻ của MWG mang những đặc thù rất riêng biệt so với các doanh nghiệp hành chính hay công nghệ truyền thống:

**Bảng 1.3. Cơ cấu nguồn nhân lực theo khối chức năng và địa bàn tại MWG**

| Khối chức năng | Số lượng nhân sự ước tính | Tỷ lệ (%) | Đặc điểm trình độ và chuyên môn chính | Địa bàn hoạt động |
| :--- | :---: | :---: | :--- | :--- |
| **Khối Vận hành Bán lẻ (Siêu thị)** | **51.500** | 79.2% | Tốt nghiệp THPT, Trung cấp, Cao đẳng, Đại học; kỹ năng giao tiếp và phục vụ tận tâm | Phân tán tại hơn 4.000 siêu thị trên 63 tỉnh thành |
| **Khối Chuỗi cung ứng (Logistics/DC)** | **7.800** | 12.0% | Lao động phổ thông, kỹ thuật kho vận, lái xe tải; sức khỏe tốt, tính kỷ luật cao | Các Tổng kho DC và các trung tâm trung chuyển vùng |
| **Khối Quản trị Nguồn nhân lực** | **350** | 0.5% | Cử nhân Quản trị nhân lực, Luật, Kinh tế, Tâm lý học; chuyên môn hóa C&B, Tuyển dụng, Đào tạo | Trụ sở HQ TP.HCM và các Văn phòng đại diện Miền |
| **Khối Công nghệ Thông tin (MWG IT)** | **650** | 1.0% | Kỹ sư CNTT, Lập trình viên di động, Quản trị CSDL, Chuyên viên An ninh mạng | Trụ sở chính TP.HCM và chi nhánh công nghệ |
| **Khối Kinh doanh, Mua hàng & MKT** | **1.900** | 2.9% | Cử nhân QTKD, Marketing, Quản trị chuỗi cung ứng, Đàm phán thương mại | Trụ sở chính TP.HCM |
| **Khối Tài chính - Kế toán & Hỗ trợ** | **2.800** | 4.4% | Cử nhân Tài chính - Kế toán, Kiểm toán, Pháp chế, Hành chính | Trụ sở HQ và kiểm soát viên khu vực |
| **Tổng cộng toàn Tập đoàn** | **~65.000** | **100.0%** | **Cơ cấu nhân sự trẻ, năng động, tính phân tán cực kỳ cao** | **Toàn quốc và Quốc tế (Indonesia)** |

Các đặc thù nổi bật của lực lượng lao động tại MWG:
1. *Độ tuổi trẻ trung và tinh thần phụng sự cao:* Độ tuổi trung bình của nhân viên bán lẻ là 23 - 26 tuổi. Đây là lực lượng lao động trẻ, nhiệt huyết, giao tiếp tốt, có khả năng thích nghi nhanh với công nghệ di động và mang đậm tinh thần văn hóa phục vụ khách hàng.
2. *Làm việc theo ca xoay và ca kíp linh hoạt:* Cửa hàng bán lẻ mở cửa từ 8h00 sáng đến 22h00 đêm (thậm chí 24/7 đối với một số mô hình), nhân viên làm việc theo các ca luân phiên (Ca 1: 7h30 - 15h30; Ca 2: 14h30 - 22h00; Ca gãy: 9h00 - 13h00 và 17h00 - 21h00). Việc phân ca và quản lý đổi ca là tác vụ diễn ra hàng ngày của Quản lý siêu thị.
3. *Thu nhập gắn liền với năng suất kinh doanh:* Mô hình lương 3P kết hợp lương cơ bản theo ngạch bậc, phụ cấp ca kíp và phần thưởng biến đổi chiếm tỷ trọng lớn: doanh số bán hàng của siêu thị, hoa hồng trên từng sản phẩm bán ra và điểm số đánh giá từ khách hàng sau mỗi lượt giao dịch.
4. *Cơ hội thăng tiến nội bộ rộng mở:* 100% Quản lý siêu thị (SM) và Quản lý khu vực (AM) tại MWG đều trưởng thành từ các vị trí nhân viên bán hàng, thu ngân hoặc kho thông qua các kỳ thi sát hạch thăng cấp công khai, minh bạch được tổ chức định kỳ 6 tháng một lần.

---

### 2.8. Thực trạng công tác quản lý nhân lực trước khi xây dựng hệ thống mới

Mặc dù MWG đã ứng dụng công nghệ thông tin từ sớm, nhưng với quy mô bùng nổ lên tới hơn 4.000 điểm bán và hơn 65.000 con người, phương thức quản trị nhân sự trước đây đã bộc lộ những điểm nghẽn nghiêm trọng:

Thứ nhất, việc quản lý hồ sơ nhân sự bị phân tán giữa các chi nhánh và chuỗi bán lẻ. Do sáp nhập và mở rộng nhanh nhiều chuỗi (TGDD, Điện Máy Xanh, Bách Hóa Xanh, An Khang), dữ liệu hồ sơ nhân viên bị phân mảnh trên nhiều phần mềm nhánh khác nhau, khiến việc tra cứu lịch sử làm việc, thâm niên và kỹ năng của người lao động khi điều chuyển liên chuỗi gặp nhiều khó khăn.

Thứ hai, việc chấm công tại hàng nghìn cửa hàng phân tán gặp nhiều rủi ro. Phương thức chấm công bằng máy vân tay truyền thống thường xuyên gặp trục trặc kỹ thuật do đường truyền mạng ở các vùng sâu vùng xa, chi phí bảo trì thiết bị phần cứng lớn; tình trạng chấm công hộ hoặc tranh cãi về giờ làm thực tế giữa nhân viên và quản lý siêu thị diễn ra thường xuyên; dữ liệu chấm công cuối tháng mất nhiều ngày để tổng hợp về Trụ sở chính.

Thứ ba, việc lập lịch và xếp ca làm việc phụ thuộc vào sự ghi chép thủ công. Quản lý siêu thị phải lập lịch ca hàng tuần trên các bảng tính Excel rời rạc; khi có phát sinh nhân viên ốm đột xuất hoặc xin đổi ca, việc cập nhật không kịp thời dẫn đến việc thiếu hụt nhân sự trong giờ cao điểm hoặc nhân viên bị tính công sai sót.

Thứ tư, công tác tuyển dụng số lượng lớn (Mass Recruitment) bị quá tải. Mỗi tháng MWG tiếp nhận hàng chục nghìn hồ sơ ứng tuyển trên toàn quốc. Quy trình sàng lọc thủ công qua email và điện thoại gây chậm trễ, tỷ lệ ứng viên bỏ hẹn phỏng vấn cao và thiếu công cụ theo dõi tiến trình tuyển dụng từ xa cho các Quản lý khu vực (AM).

Thứ năm, tính toán lương theo doanh số cực kỳ phức tạp và kéo dài. Việc tính lương cho hơn 65.000 nhân sự với hàng chục biến số (ngày công, giờ làm ca đêm, doanh số siêu thị, hoa hồng từng nhóm hàng gia dụng/điện thoại, điểm CSAT của khách hàng, các khoản nộp BHXH và thuế TNCN) tiêu tốn từ 7 đến 10 ngày làm việc của đội ngũ C&B, tiềm ẩn nguy cơ sai lệch số liệu và chậm trễ chi trả cho người lao động.

Thứ sáu, người lao động thiếu công cụ tự phục vụ di động tức thời. Nhân viên bán lẻ tại siêu thị không thể chủ động tra cứu chi tiết công thức tính lương của mình, khó khăn trong việc gửi đơn xin nghỉ phép, đổi ca hoặc tra cứu quỹ phép năm trực tiếp trên điện thoại thông minh.

Từ những thách thức cấp bách trên, việc nghiên cứu và xây dựng một **Hệ thống thông tin quản trị nhân lực (HRMS) thế hệ mới** là yêu cầu mang tính sống còn nhằm hiện đại hóa quy trình tác nghiệp, tối ưu hóa năng suất vận hành và đảm bảo sự phát triển bền vững cho toàn bộ Tập đoàn Thế Giới Di Động.

---

### 2.9. Mối quan hệ liên kết nghiệp vụ giữa các bộ phận trong quản trị nhân lực

Hoạt động quản trị nhân lực tại MWG được vận hành thông qua sự tương tác mật thiết giữa ba mắt xích cốt lõi:
1. **Ban Lãnh đạo Tập đoàn & Khối Nhân sự Tập đoàn (Định hướng chiến lược & Ban hành chính sách):** Hoạch định quỹ lương, định biên nhân sự, tiêu chuẩn tuyển dụng, khung đánh giá hiệu suất và kiểm soát tính tuân thủ pháp luật lao động toàn quốc.
2. **Khối Vận hành Bán lẻ tại Siêu thị & Quản lý Khu vực (Thực thi & Đề xuất tác nghiệp):** Lập lịch phân ca hàng tuần, ghi nhận công hàng ngày, sơ tuyển nhân sự, đánh giá thử việc, đề xuất khen thưởng, tăng ca và xét duyệt nghỉ phép/đổi ca cho nhân viên tuyến đầu.
3. **Khối Hỗ trợ (CNTT, Tài chính - Kế toán & Logistics):** Khối IT bảo đảm nền tảng phần mềm, hạ tầng di động và an toàn dữ liệu; Khối Kế toán kiểm soát ngân sách, đối soát bảng lương và thực hiện chi trả lương qua tài khoản ngân hàng; Khối Kho vận phối hợp quản lý nhân sự chuỗi cung ứng.

---

## 3. Mục tiêu và nhiệm vụ của đề tài

### 3.1. Mục tiêu tổng quát
Ứng dụng phương pháp phân tích thiết kế hướng đối tượng (OOAD) kết hợp ngôn ngữ mô hình hóa thống nhất UML để phân tích toàn diện, xây dựng kiến trúc và thiết kế phần mềm Hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG), giải quyết triệt để các bài toán quản trị nhân sự bán lẻ quy mô lớn, phân tán và tối ưu hóa trải nghiệm tự phục vụ của người lao động trên thiết bị di động.

### 3.2. Nhiệm vụ cụ thể
1. Khảo sát toàn diện thực trạng cơ cấu tổ chức, mạng lưới hơn 4.000 siêu thị và các quy trình nghiệp vụ nhân sự đặc thù của tập đoàn bán lẻ MWG.
2. Hệ thống hóa cơ sở lý luận về quản trị nhân lực chuỗi bán lẻ, phương pháp OOAD/UML và các quy định pháp luật hiện hành: Bộ luật Lao động 2019, Luật BHXH, Luật Thuế TNCN và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
3. Xác định 12 tác nhân nghiệp vụ, xây dựng danh mục 47 Use Case hoàn chỉnh phân bổ trong 10 nhóm chức năng; đặc tả chi tiết kịch bản tác nghiệp hai cột, ma trận RACI và ma trận phân quyền RBAC.
4. Xây dựng các mô hình động (Sequence Diagrams, Activity Diagrams, State Machine Diagrams) và các mô hình tĩnh (Package Diagrams, Class Diagrams, mô hình CSDL quan hệ 87 bảng, mô hình mở rộng chấm công đa nguồn GPS/FaceID).
5. Thiết kế kiến trúc phần mềm 3 tầng phân tán có khả năng mở rộng cao, thiết kế 31 màn hình giao diện ứng dụng (bao gồm Web quản trị trung tâm và ứng dụng di động nội bộ MWG App).
6. Đánh giá kết quả đạt được, phân tích ưu nhược điểm và đề xuất lộ trình ứng dụng trí tuệ nhân tạo (AI) trong dự báo biến động nhân lực bán lẻ theo mùa vụ.

---

## 4. Đối tượng và phạm vi nghiên cứu

- **Đối tượng nghiên cứu:** Các quy trình nghiệp vụ quản trị nguồn nhân lực trong tập đoàn bán lẻ chuỗi quy mô lớn và phương pháp phân tích thiết kế hệ thống thông tin hướng đối tượng bằng ngôn ngữ mô hình hóa UML.
- **Phạm vi nghiên cứu:**
  - *Về mặt nội dung:* Bao quát toàn bộ vòng đời của người lao động tại MWG từ tuyển dụng số lượng lớn (Mass ATS), tiếp nhận hồ sơ, ký HĐLĐ điện tử, lập lịch phân ca xoay, điểm danh đa nguồn (GPS, FaceID, Wifi), quản lý nghỉ phép và làm thêm giờ, tính lương 3P kết hợp doanh số siêu thị, quản lý phúc lợi, điều chuyển công tác liên siêu thị, đánh giá thăng cấp Quản lý siêu thị, đến quy trình thôi việc bàn giao nhanh và quản trị hồ sơ cán bộ theo chuẩn Mẫu 2C-BNV.
  - *Về mặt không gian:* Khảo sát và thiết kế áp dụng cho toàn bộ mạng lưới hoạt động của MWG gồm Trụ sở chính tại TP.HCM, các chi nhánh miền, các Tổng kho DC và hơn 4.000 siêu thị Thế Giới Di Động, Điện Máy Xanh, Bách Hóa Xanh trên phạm vi toàn quốc.
  - *Về mặt thời gian:* Các số liệu khảo sát, quy trình nghiệp vụ và hệ thống văn bản quy phạm pháp luật được cập nhật đồng bộ tính đến năm 2026.

---

## 5. Cấu trúc của báo cáo

Nội dung báo cáo kết thúc học phần được kết cấu chặt chẽ thành các phần:
- **Phần Mở đầu:** Đặt vấn đề, lý do chọn đề tài, giới thiệu tổng quan về Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG), mục tiêu, nhiệm vụ, đối tượng, phạm vi nghiên cứu và bố cục tài liệu.
- **Phần Nội dung:** Gồm 3 chương:
  - **Chương 1:** Cơ sở lý luận về quản trị nhân lực bán lẻ và hệ thống thông tin nhân sự; phân tích các vấn đề liên quan và phát biểu bài toán nghiệp vụ cần giải quyết tại MWG (bao gồm 9 quy trình cốt lõi và ma trận RACI).
  - **Chương 2:** Thiết kế hệ thống thông tin quản trị nhân lực cho MWG: xác định 12 tác nhân, danh mục 47 Use Case, đặc tả kịch bản tác nghiệp chi tiết, ma trận phân quyền RBAC, hệ thống biểu đồ UML (Use case, Sequence, Activity, State, Class, Architecture) và thiết kế CSDL 87 bảng trên PostgreSQL cùng 31 giao diện ứng dụng.
  - **Chương 3:** Đánh giá các kết quả đạt được, phân tích ưu điểm, nhược điểm và đề xuất hướng phát triển hệ thống trong tương lai (tích hợp trí tuệ nhân tạo dự báo ca kíp).
- **Phần Tài liệu tham khảo:** Liệt kê các giáo trình, công trình khoa học và văn bản quy phạm pháp luật được sử dụng trong đề tài.

---

# PHẦN NỘI DUNG

# CHƯƠNG 1: CƠ SỞ LÝ LUẬN VỀ QUẢN TRỊ NHÂN LỰC VÀ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC

## 1.1. Lý thuyết cơ sở

### 1.1.1. Tổng quan về quản trị nhân lực trong ngành bán lẻ chuỗi quy mô lớn

Quản trị nhân lực (Human Resource Management) là hệ thống các quan điểm, chính sách và hoạt động chức năng nhằm thu hút, đào tạo, phát triển và duy trì đội ngũ người lao động nhằm đạt được các mục tiêu chiến lược của tổ chức. Trong ngành bán lẻ chuỗi hiện đại, nguồn nhân lực tuyến đầu tại các cửa hàng giữ vai trò quyết định sống còn: họ là đại diện hình ảnh của doanh nghiệp, trực tiếp tiếp xúc, tư vấn và truyền tải giá trị văn hóa phục vụ đến khách hàng.

Khác với các doanh nghiệp hành chính hay công nghệ gia công phần mềm có quy mô nhân sự tập trung, quản trị nhân lực chuỗi bán lẻ (Retail Chain HRM) mang 4 đặc trưng cốt lõi:
1. **Tính phân tán địa lý cực lớn:** Hàng chục nghìn lao động làm việc tại hàng nghìn điểm bán độc lập trên khắp 63 tỉnh thành, đặt ra yêu cầu kiểm soát dữ liệu và truyền tải chính sách một cách xuyên suốt, không bị suy hao qua các cấp trung gian.
2. **Tính linh hoạt về thời gian làm việc:** Vận hành cửa hàng theo các ca kíp liên tục, thay đổi theo lưu lượng khách mua sắm trong tuần và các mùa vụ cao điểm (Tết Nguyên đán, mùa tựu trường, mùa khuyến mãi hè).
3. **Cơ chế tiền lương thúc đẩy thành tích (Performance-driven):** Thu nhập của nhân viên gắn chặt với kết quả doanh số bán hàng của siêu thị và mức độ hài lòng của khách hàng (CSAT).
4. **Vòng đời nhân sự nhanh (Fast Lifecycle):** Tỷ lệ luân chuyển lao động cao đòi hỏi các quy trình từ tuyển dụng, đào tạo hội nhập đến thôi việc bàn giao phải được tinh gọn và số hóa triệt để.

### 1.1.2. Hệ thống thông tin quản trị nhân lực (HRMS)

Hệ thống thông tin quản trị nhân lực là sự tích hợp giữa các quy trình nghiệp vụ nhân sự với công nghệ thông tin. Hệ thống chịu trách nhiệm thu thập, lưu trữ, xử lý và phân phối thông tin liên quan đến người lao động, đóng vai trò là "xương sống số" quản lý toàn bộ vòng đời làm việc của nhân viên trong doanh nghiệp.

Đối với tập đoàn bán lẻ như MWG, HRMS không đơn thuần là công cụ nhập liệu văn phòng mà là một nền tảng vận hành tác nghiệp thời gian thực (Real-time Operations Platform). Hệ thống phải đáp ứng đồng thời các tiêu chuẩn pháp lý khắt khe của Nhà nước (Bộ luật Lao động 2019, Luật BHXH, Luật Thuế TNCN, Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân) và các yêu cầu vận hành bán lẻ linh hoạt:
- Tự động hóa tính toán ngày công, giờ làm ca đêm, làm thêm giờ theo đúng Điều 98, Điều 107 BLLĐ 2019;
- Khống chế tỷ lệ khấu trừ nợ tạm ứng qua lương không quá 30% tiền lương thực lĩnh theo đúng Điều 102 BLLĐ 2019;
- Đảm bảo cơ chế khóa bất biến kỳ lương (Locked Payroll Period) để ngăn chặn mọi hành vi chỉnh sửa tùy tiện sau khi đã được Ban Giám đốc phê duyệt;
- Bảo vệ dữ liệu sinh trắc học và vị trí GPS của nhân viên theo đúng các quy chuẩn bảo mật quốc tế.

### 1.1.3. Phương pháp phân tích và thiết kế hệ thống hướng đối tượng (OOAD/UML)

Phương pháp phân tích và thiết kế hướng đối tượng (OOAD) tiếp cận bài toán nghiệp vụ phức tạp bằng cách mô hình hóa hệ thống thành tập hợp các đối tượng tương tác với nhau, bao hàm cả thuộc tính (dữ liệu) và phương thức (hành vi xử lý). OOAD phát huy tối đa bốn nguyên lý cốt lõi:
- **Tính trừu tượng hóa (Abstraction):** Tập trung vào các đặc trưng bản chất của thực thể nhân sự bán lẻ, bỏ qua các chi tiết thừa;
- **Tính bao đóng (Encapsulation):** Đóng gói logic xử lý nội bộ của từng phân hệ (như chức năng tính toán tiền lương tự động, bộ xử lý phê duyệt đơn ca kíp) để ngăn chặn truy cập trái phép;
- **Tính kế thừa (Inheritance):** Thiết lập cấu trúc phân cấp từ lớp người dùng chung sang các vai trò chuyên biệt hóa (Nhân viên bán lẻ, Quản lý siêu thị, Quản lý khu vực, Cán bộ C&B...);
- **Tính đa hình (Polymorphism):** Cho phép các đối tượng khác nhau phản ứng linh hoạt với cùng một thông điệp tác nghiệp.

Ngôn ngữ mô hình hóa thống nhất (UML) được sử dụng xuyên suốt đề tài để đặc tả, trực quan hóa và tài liệu hóa kiến trúc hệ thống:
- **Biểu đồ Use Case:** Xác định ranh giới hệ thống, các tác nhân và danh mục 47 chức năng nghiệp vụ;
- **Biểu đồ Trình tự (Sequence Diagram):** Trực quan hóa tương tác giữa các đối tượng theo dòng thời gian trong từng kịch bản nghiệp vụ;
- **Biểu đồ Hoạt động (Activity Diagram):** Thể hiện luồng xử lý công việc tuần tự và song song trong các quy trình nghiệp vụ;
- **Biểu đồ Trạng thái (State Machine Diagram):** Thể hiện chu kỳ chuyển đổi trạng thái của các thực thể quan trọng (Nhân viên, Phiếu tuyển dụng, Đơn nghỉ phép, Bảng lương);
- **Biểu đồ Lớp (Class Diagram):** Mô tả cấu trúc dữ liệu tĩnh, các thuộc tính, phương thức và mối quan hệ liên kết giữa các thực thể;
- **Biểu đồ Gói và Kiến trúc phần mềm:** Phân tầng hệ thống theo kiến trúc 3 tầng hiện đại.

### 1.1.4. Công cụ và công nghệ ứng dụng

Đề tài sử dụng bộ công cụ và nền tảng công nghệ tiên tiến phù hợp với yêu cầu xử lý dữ liệu quy mô lớn của MWG:
- **Công cụ mô hình hóa:** PlantUML và Draw.io phục vụ thiết kế hệ thống biểu đồ UML chuẩn hóa;
- **Hệ quản trị cơ sở dữ liệu:** PostgreSQL 16 kết hợp công cụ Prisma ORM quản lý 87 bảng dữ liệu quan hệ, hỗ trợ phân vùng dữ liệu theo khu vực và lưu vết kiểm toán chỉ ghi thêm (Append-Only Audit Log);
- **Tầng dịch vụ nghiệp vụ (Backend):** Nền tảng NestJS với ngôn ngữ TypeScript, phân tầng kiến trúc theo mô hình Domain-Driven Design (DDD) và tích hợp các bộ xử lý công việc ngầm (Background Jobs) cho việc tổng hợp công và tính lương theo lô;
- **Tầng giao diện người dùng (Frontend & Mobile):** Nền tảng Next.js kết hợp React Native và Tailwind CSS xây dựng 31 màn hình chức năng cho Web điều hành và ứng dụng di động nội bộ của nhân viên.

---

## 1.2. Một số vấn đề liên quan đến chủ đề quản trị nhân lực chuỗi bán lẻ quy mô lớn

### 1.2.1. Ý nghĩa của hệ thống đối với Thế Giới Di Động (MWG)
Xây dựng một hệ thống thông tin quản trị nhân lực hiện đại đồng nghĩa với việc số hóa trọn vẹn toàn bộ vòng đời làm việc của hơn 65.000 cán bộ nhân viên MWG: từ thời điểm ứng viên nộp hồ sơ qua cổng việc làm trực tuyến, trải qua phỏng vấn tập trung, ký hợp đồng lao động điện tử, tham gia đào tạo văn hóa hội nhập "Tận tâm phục vụ", điểm danh hàng ngày qua ứng dụng di động định vị GPS/FaceID tại siêu thị, đăng ký đổi ca kíp, nhận lương 3P theo doanh số định kỳ, cho đến khi hoàn tất thủ tục bàn giao tài sản siêu thị và thôi việc. Hệ thống giúp doanh nghiệp chuẩn hóa dữ liệu, loại bỏ hoàn toàn các khâu giấy tờ thủ công và thiết lập hạ tầng quản trị nhân sự số hóa vững chắc.

### 1.2.2. Vai trò của hệ thống trong điều hành doanh nghiệp
Hệ thống đóng vai trò là công cụ kiểm soát trạng thái các thực thể nhân sự theo thời gian thực, đảm bảo mọi bước chuyển đổi trạng thái (như nâng bậc lương, thăng cấp từ nhân viên lên Quản lý siêu thị, điều chuyển liên chuỗi từ TGDD sang Bách Hóa Xanh, khóa sổ kỳ lương tháng) đều phải tuân thủ nghiêm ngặt các điều kiện tiên quyết và có đầy đủ phê duyệt hợp pháp đi kèm. Đồng thời, hệ thống tự động hóa chuỗi quy trình phê duyệt liên cấp giữa Quản lý siêu thị (SM) - Quản lý khu vực (AM) - Khối Nhân sự Tập đoàn - Ban Tổng Giám đốc, loại bỏ hoàn toàn độ trễ trong xử lý công việc.

### 1.2.3. Tác dụng thực tiễn của hệ thống
Phần mềm giúp giải phóng năng suất lao động cho đội ngũ nhân sự và quản lý:
- Giảm thời gian tổng hợp chấm công và tính lương tháng từ 7 - 10 ngày xuống còn dưới 8 giờ làm việc;
- Cho phép người lao động chủ động kiểm tra ngày công, tra cứu bảng lương chi tiết, xin nghỉ phép, đổi ca làm việc trực tiếp trên điện thoại thông minh 24/7;
- Cung cấp cho Ban Giám đốc và Quản lý khu vực bảng điều khiển (Dashboard) phân tích nhân sự thời gian thực về tỷ lệ hiện diện, năng suất bán hàng trên đầu người và biến động nhân sự tại từng siêu thị để ra quyết định kinh doanh kịp thời.

### 1.2.4. Bài học kinh nghiệm thiết kế hệ thống thông tin nhân sự chuỗi bán lẻ
1. **Tính linh hoạt của cơ cấu tổ chức phân cấp:** Cơ cấu chuỗi siêu thị luôn biến động (mở mới, đóng cửa, sáp nhập siêu thị theo hiệu quả kinh doanh). Do đó, cây đơn vị tổ chức phải được thiết kế dạng cây tự tham chiếu (Self-referencing Tree) linh hoạt, hỗ trợ cấu hình đa cấp: Tập đoàn -> Khối Chuỗi -> Miền -> Vùng/Khu vực -> Siêu thị -> Ca làm việc.
2. **Cơ chế chấm công đa nguồn chống gian lận:** Điểm danh bán lẻ cần kết hợp đa phương thức: định vị vệ tinh GPS gắn với tọa độ bán kính cho phép của siêu thị (Geofencing 50m - 100m) kết hợp xác thực địa chỉ Wifi nội bộ của cửa hàng (BSSID) và nhận diện khuôn mặt trực tiếp trên ứng dụng di động, kết hợp máy chấm công vân tay tại các Tổng kho DC.
3. **Cấu trúc công thức lương động:** Thu nhập bán lẻ phụ thuộc vào nhiều tham số biến đổi (doanh số chuỗi, doanh số siêu thị, điểm CSAT, hoa hồng sản phẩm). Công thức tính lương phải được cấu hình linh hoạt theo từng chu kỳ và có cơ chế khóa sổ bất biến sau khi phê duyệt để đảm bảo tính toàn vẹn tài chính.

---

## 1.3. Phát biểu bài toán cần giải quyết tại Thế Giới Di Động (MWG)

### 1.3.1. Bối cảnh hoạt động và đặc thù quản lý nhân sự tại MWG
Công ty Cổ phần Đầu tư Thế Giới Di Động là doanh nghiệp bán lẻ số 1 Việt Nam với quy mô hơn 65.000 nhân sự hoạt động tại hơn 4.000 điểm bán trên 63 tỉnh thành. Hoạt động quản trị nhân sự tại MWG mang các nét đặc thù nổi bật:
- Quy mô nhân sự cực lớn, phân tán tại hàng nghìn siêu thị độc lập;
- Lực lượng lao động trẻ, làm việc theo ca kíp luân phiên (ca sáng, ca chiều, ca gãy, ca đêm kho DC);
- Nhu cầu luân chuyển nhân sự tăng cường linh hoạt giữa các siêu thị lân cận trong mùa cao điểm;
- Cơ chế tiền lương theo năng suất và kết quả kinh doanh;
- Yêu cầu kiểm soát an toàn thông tin, bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP và quản trị tài sản hàng hóa tại các điểm bán.

### 1.3.2. Thực trạng 9 quy trình quản lý nhân sự cốt lõi tại MWG

Khảo sát thực tế tại MWG cho thấy hoạt động quản trị nhân lực bao gồm 9 quy trình nghiệp vụ then chốt cần được hệ thống hóa:

#### 1. Quy trình tuyển dụng số lượng lớn (Mass Recruitment ATS)
- **Mục đích:** Thu hút, tiếp nhận và tuyển chọn kịp thời số lượng lớn nhân viên bán hàng, thu ngân, kho và kỹ thuật cho các siêu thị mới mở hoặc bù đắp biến động nhân sự tự nhiên.
- **Trình tự thực hiện:**
  1. *Lập đề xuất tuyển dụng:* Quản lý siêu thị (SM) hoặc Quản lý khu vực (AM) lập phiếu đề xuất bổ sung nhân sự căn cứ vào định biên và doanh số siêu thị.
  2. *Thẩm định chỉ tiêu:* Chuyên viên Tuyển dụng kiểm tra đối chiếu chỉ tiêu định biên của siêu thị; Phòng Kế hoạch tài chính xác nhận ngân sách.
  3. *Phê duyệt chỉ tiêu:* Giám đốc Chuỗi / Ban Giám đốc phê chuẩn kế hoạch tuyển dụng.
  4. *Đăng tin và sàng lọc tự động:* Hệ thống tự động đăng tin lên cổng `vieclam.thegioididong.com`, tiếp nhận hồ sơ trực tuyến, thuật toán tự động chấm điểm và lọc CV phù hợp theo khu vực quận/huyện.
  5. *Phỏng vấn tập trung:* Tổ chức phỏng vấn tập trung tại văn phòng khu vực hoặc phỏng vấn trực tuyến qua video; Quản lý siêu thị tham gia đánh giá mức độ phù hợp thái độ phục vụ khách hàng.
  6. *Gửi thư mời nhận việc:* Hệ thống gửi thông báo trúng tuyển và thư mời nhận việc điện tử qua tin nhắn/email có liên kết xác nhận.

#### 2. Quy trình tiếp nhận nhân sự mới và ký kết hợp đồng lao động điện tử
- **Mục đích:** Thiết lập quan hệ lao động hợp pháp, số hóa hồ sơ cá nhân và cấp phát tài khoản làm việc cho nhân viên mới tại các siêu thị.
- **Trình tự thực hiện:**
  1. *Tiếp nhận hồ sơ trực tuyến:* Ứng viên trúng tuyển tải ảnh CCCD gắn chip, sơ yếu lý lịch, văn bằng chứng chỉ và số tài khoản ngân hàng lên cổng tự phục vụ.
  2. *Thẩm định hồ sơ:* Chuyên viên Hồ sơ nhân sự kiểm tra tính hợp lệ và xác thực định danh thông tin.
  3. *Ký kết HĐLĐ điện tử:* Hệ thống tự động sinh Hợp đồng thử việc/chính thức theo mẫu chuẩn của MWG; Người lao động và Đại diện pháp luật ký kết bằng chữ ký số / mã OTP qua điện thoại di động theo đúng quy định của Luật Giao dịch điện tử.
  4. *Cấp phát tài khoản và phân quyền:* Hệ thống tự động khởi tạo mã nhân viên, cấp tài khoản ứng dụng nội bộ MWG App và gán quyền truy cập tương ứng với vị trí tại siêu thị.
  5. *Tiếp nhận tại siêu thị:* Quản lý siêu thị (SM) đón tiếp nhân viên mới trong ngày đầu tiên, cấp phát đồng phục, bảng tên và phân công người hướng dẫn kèm cặp (Mentor).

#### 3. Quy trình lập lịch và phân ca làm việc (Store Shift Scheduling)
- **Mục đích:** Bố trí nhân sự tối ưu cho từng khung giờ bán hàng tại siêu thị, đảm bảo đủ lực lượng phục vụ khách hàng vào giờ cao điểm và tuân thủ đúng quy định về thời giờ làm việc.
- **Trình tự thực hiện:**
  1. *Lập lịch phân ca tuần:* Thứ Sáu hàng tuần, Quản lý siêu thị (SM) dựa trên dự báo doanh số và lưu lượng khách để xếp lịch ca làm việc (Ca 1: 7h30-15h30, Ca 2: 14h30-22h00, Ca gãy: 9h00-13h00 & 17h00-21h00) cho toàn bộ nhân viên trong siêu thị trên hệ thống.
  2. *Kiểm tra ràng buộc tự động:* Hệ thống tự động kiểm tra khoảng cách nghỉ ngơi tối thiểu giữa hai ca liên tiếp (ít nhất 12 giờ) và đảm bảo không bố trí nhân viên làm việc quá số giờ quy định theo Điều 105 BLLĐ 2019.
  3. *Công bố lịch ca:* Quản lý siêu thị phê duyệt công bố; hệ thống gửi thông báo lịch làm việc chi tiết đến ứng dụng di động của từng nhân viên.
  4. *Đổi ca làm việc linh hoạt:* Nhân viên có nhu cầu đổi ca có thể gửi yêu cầu đổi ca trực tiếp trên ứng dụng di động tới đồng nghiệp; khi đồng nghiệp đồng ý và Quản lý siêu thị bấm phê duyệt, lịch phân ca tự động được cập nhật.

#### 4. Quy trình điểm danh đa nguồn và xử lý dữ liệu chấm công
- **Mục đích:** Ghi nhận chính xác ngày công thực tế của hơn 65.000 nhân viên tại hàng nghìn điểm bán, ngăn ngừa tuyệt đối tình trạng chấm công hộ và làm căn cứ tính lương.
- **Trình tự thực hiện:**
  1. *Điểm danh vào/ra ca:* Hàng ngày, khi đến siêu thị, nhân viên mở ứng dụng nội bộ MWG App để điểm danh:
     - Hệ thống kiểm tra tọa độ GPS của điện thoại phải nằm trong bán kính cho phép của siêu thị (Geofencing 50m);
     - Xác thực mã BSSID của mạng Wifi nội bộ cửa hàng;
     - Chụp ảnh nhận diện khuôn mặt (FaceID) với cảm biến chống giả mạo ảnh tĩnh.
     *(Tại các Tổng kho DC, nhân viên quét dấu vân tay trên thiết bị chấm công phần cứng).*
  2. *Tổng hợp sự kiện thời gian thực:* Dữ liệu điểm danh được truyền tức thời về máy chủ trung tâm, đối chiếu với lịch ca đã xếp để ghi nhận trạng thái: đúng giờ, đi muộn, về sớm hoặc vắng mặt.
  3. *Giải trình bổ sung công:* Trường hợp nhân viên quên điểm danh, đi giao hàng ngoài siêu thị hoặc gặp sự cố kỹ thuật, nhân viên gửi đơn giải trình kèm minh chứng trên app để Quản lý siêu thị (SM) phê duyệt.
  4. *Khóa sổ bảng chấm công:* Định kỳ ngày 25 hàng tháng, Chuyên viên C&B cùng Quản lý siêu thị rà soát toàn bộ các trường hợp ngoại lệ và chốt bảng công toàn hệ thống sang trạng thái khóa (`LOCKED`).

#### 5. Quy trình quản lý nghỉ phép và làm thêm giờ (OT)
- **Mục đích:** Đảm bảo quyền nghỉ ngơi của người lao động theo quy định pháp luật, kiểm soát quỹ phép năm và quản lý chặt chẽ số giờ làm thêm giờ tại siêu thị.
- **Trình tự thực hiện:**
  1. *Đăng ký nghỉ phép trực tuyến:* Nhân viên kiểm tra số ngày phép còn lại trên ứng dụng di động, gửi đơn xin nghỉ phép (nghỉ phép năm, nghỉ việc riêng, nghỉ ốm) trước ít nhất 1 - 3 ngày.
  2. *Xét duyệt đơn phép:* Quản lý siêu thị (SM) kiểm tra nhân sự thay thế và phê duyệt; trường hợp nghỉ từ 3 ngày trở lên tự động chuyển tiếp Quản lý khu vực (AM) phê duyệt. Hệ thống tự động trừ quỹ phép ngay khi có phê duyệt.
  3. *Đăng ký làm thêm giờ (OT):* Vào các dịp khuyến mãi lớn hoặc kiểm kê hàng hóa định kỳ, Quản lý siêu thị lập kế hoạch làm thêm giờ trên hệ thống, nêu rõ lý do và danh sách nhân sự tham gia.
  4. *Kiểm soát trần giờ làm thêm:* Hệ thống tự động kiểm tra số giờ OT lũy kế của từng nhân viên trong tháng và trong năm, tự động cảnh báo và chặn phê duyệt nếu vượt quá 40 giờ/tháng hoặc 200 giờ/năm theo đúng Điều 107 Bộ luật Lao động 2019.

#### 6. Quy trình tính toán và chi trả tiền lương bán lẻ 3P
- **Mục đích:** Tính toán chính xác, minh bạch thu nhập hàng tháng của hơn 65.000 người lao động theo mô hình 3P (Position - Vị trí, Person - Năng lực, Performance - Kết quả doanh số), thực hiện trích nộp bảo hiểm bắt buộc và khấu trừ thuế TNCN theo luật định.
- **Trình tự thực hiện:**
  1. *Tổng hợp các nguồn dữ liệu đầu vào:* Sau khi bảng công tháng được chốt, hệ thống tự động kết nối và lấy dữ liệu:
     - Dữ liệu công thực tế và giờ làm ca đêm, OT;
     - Mức lương cơ bản theo hợp đồng lao động;
     - Dữ liệu doanh số bán hàng của siêu thị (Store Target Achievement);
     - Hoa hồng bán hàng của từng nhân viên (Incentive / Spif) trích xuất từ hệ thống ERP bán lẻ;
     - Điểm đánh giá chất lượng phục vụ khách hàng (CSAT "Tận tâm phục vụ").
  2. *Khởi chạy chức năng tính lương tự động:* Hệ thống thực hiện tính toán theo lô (Batch Processing) cho toàn bộ nhân viên:
     - Tính lương thời gian cơ bản;
     - Tính tiền làm thêm giờ (hệ số 1.5, 2.0, 3.0) và phụ cấp làm việc ban đêm (hệ số 1.3);
     - Tính thưởng doanh số siêu thị và hoa hồng sản phẩm;
     - Khấu trừ các khoản bảo hiểm bắt buộc (BHXH 8%, BHYT 1.5%, BHTN 1%) theo mức lương đóng bảo hiểm;
     - Giảm trừ gia cảnh bản thân và người phụ thuộc, tính thuế TNCN theo biểu lũy tiến từng phần 7 bậc;
     - Khấu trừ các khoản tạm ứng/vay phúc lợi (đảm bảo mức trừ <= 30% lương thực lĩnh theo Điều 102 BLLĐ 2019).
  3. *Đối soát và phê duyệt bảng lương:* Chuyên viên C&B và Kế toán trưởng đối soát số liệu tổng quỹ lương; trình Tổng Giám đốc ký duyệt điện tử.
  4. *Khóa bất biến kỳ lương và gửi phiếu lương:* Hệ thống chuyển trạng thái kỳ lương sang `LOCKED` bất biến (chặn hoàn toàn việc sửa đổi số liệu); tự động kết xuất file chi lương gửi sang hệ thống ngân hàng liên kết; phát hành phiếu lương điện tử bảo mật đến ứng dụng di động của từng nhân viên.

#### 7. Quy trình tạm ứng lương, vay phúc lợi và chi trả công tác phí
- **Mục đích:** Hỗ trợ tài chính kịp thời cho người lao động, thực hiện các chính sách an sinh nội bộ và quyết toán chi phí công tác nhanh chóng.
- **Trình tự thực hiện:**
  1. *Tạm ứng lương:* Nhân viên có nhu cầu nộp đơn xin tạm ứng lương giữa tháng (tối đa 50% lương cơ bản) qua app. Quản lý siêu thị xác nhận số ngày công thực tế; Kế toán phê duyệt; số tiền được tự động giải ngân và trừ vào kỳ lương gần nhất.
  2. *Vay vốn quỹ phúc lợi:* Nhân viên làm việc từ 12 tháng trở lên có thể nộp đơn vay vốn ưu đãi từ Quỹ phúc lợi MWG (mua xe máy, sửa nhà, chi phí y tế). Hệ thống tự động mô phỏng lịch trả nợ hàng tháng, kiểm tra điều kiện số tiền trả nợ không quá 30% mức lương thực lĩnh bình quân; Ban Giám đốc phê duyệt; số tiền hoàn nợ được tự động trừ dần qua bảng lương hàng tháng.
  3. *Thanh quyết toán công tác phí:* Cán bộ quản lý (AM, Trưởng vùng) đi công tác kiểm tra mạng lưới siêu thị nộp đề xuất công tác trên hệ thống; sau chuyến đi tải hóa đơn điện tử để Kế toán đối soát và chuyển khoản quyết toán.

#### 8. Quy trình đào tạo văn hóa, sát hạch và thi thăng cấp Quản lý siêu thị
- **Mục đích:** Đào tạo văn hóa "Tận tâm phục vụ", nâng cao kỹ năng tư vấn bán hàng và tổ chức kỳ thi thăng cấp công khai, tạo lộ trình thăng tiến rõ ràng cho người lao động.
- **Trình tự thực hiện:**
  1. *Đào tạo hội nhập văn hóa:* 100% nhân viên mới bắt buộc hoàn thành khóa học văn hóa phục vụ khách hàng, quy tắc ứng xử và bảo quản hàng hóa trên ứng dụng e-learning nội bộ.
  2. *Sát hạch nghiệp vụ định kỳ:* Hàng quý, hệ thống tổ chức kiểm tra kiến thức sản phẩm công nghệ, quy trình thu ngân và tiêu chuẩn dịch vụ; kết quả sát hạch ảnh hưởng trực tiếp đến ngạch bậc lương.
  3. *Kỳ thi thăng cấp Quản lý siêu thị (Promotion Test):* Định kỳ 6 tháng một lần, hệ thống tự động lọc danh sách các nhân viên đạt tiêu chuẩn (thâm niên từ 12 tháng trở lên, điểm CSAT xuất sắc, doanh số đạt chỉ tiêu và không vi phạm kỷ luật) để mời tham gia Kỳ thi thăng cấp Quản lý siêu thị; nhân viên trải qua bài thi năng lực quản lý và phỏng vấn tình huống thực tế; các ứng viên trúng tuyển được bổ nhiệm làm Quản lý siêu thị (SM) mới.

#### 9. Quy trình điều chuyển nhân sự, xử lý kỷ luật và bàn giao thôi việc tại siêu thị
- **Mục đích:** Quản lý linh hoạt việc điều chuyển nhân sự giữa các điểm bán, thực hiện kỷ luật lao động đúng trình tự pháp luật và giải quyết thủ tục thôi việc nhanh chóng, bảo đảm thu hồi đầy đủ tài sản hàng hóa.
- **Trình tự thực hiện:**
  1. *Điều chuyển nhân sự:* Quản lý khu vực (AM) lập đề xuất điều chuyển nhân viên giữa các siêu thị trong khu vực để cân đối nhân sự; hệ thống tự động cập nhật lại mã siêu thị quản lý và điều chỉnh quyền chấm công GPS sang điểm bán mới.
  2. *Xử lý kỷ luật lao động:* Khi phát hiện nhân viên vi phạm nội quy lao động (gian lận doanh số, vi phạm nguyên tắc phục vụ khách hàng, tự ý bỏ ca), Quản lý siêu thị lập biên bản vi phạm; Phòng Nhân sự triệu tập cuộc họp xử lý kỷ luật có sự tham gia của Đại diện Công đoàn và Người lao động theo đúng Điều 122 BLLĐ 2019; Giám đốc ban hành quyết định kỷ luật (khiển trách, kéo dài thời hạn nâng lương, sa thải).
  3. *Quy trình thôi việc và bàn giao nhanh tại siêu thị:*
     - Nhân viên nộp đơn xin thôi việc qua ứng dụng di động, tuân thủ thời hạn báo trước theo luật định (30 ngày đối với HĐ xác định thời hạn, 45 ngày đối với HĐ không xác định thời hạn);
     - Quản lý siêu thị và Giám đốc phê duyệt ngày làm việc cuối cùng;
     - Hệ thống tự động sinh Checklist bàn giao 4 khâu:
       + Khâu Siêu thị: Thu hồi đồng phục, bảng tên, chìa khóa két, kiểm kê đối soát tồn kho và tiền quỹ thu ngân;
       + Khâu CNTT: Khóa tài khoản ứng dụng nội bộ MWG App, thu hồi quyền truy cập hệ thống ERP bán lẻ;
       + Khâu C&B: Chốt ngày công tháng cuối, tính tiền ngày phép năm chưa nghỉ và làm thủ tục báo giảm BHXH;
       + Khâu Kế toán: Quyết toán các khoản nợ tạm ứng, vay phúc lợi và khấu trừ trực tiếp vào kỳ lương cuối cùng;
     - Khi đủ xác nhận hoàn tất của các khâu, Giám đốc ký quyết định chấm dứt HĐLĐ; Kế toán chi trả toàn bộ quyền lợi tài chính trong thời hạn 14 ngày làm việc theo đúng Điều 48 BLLĐ 2019.

---

### 1.3.3. Ma trận phân định trách nhiệm liên phòng ban (RACI Matrix)

Để xác định rõ vai trò và trách nhiệm của từng bộ phận trong các quy trình quản trị nhân sự tại MWG, ma trận RACI được thiết lập như sau:

**Bảng 1.4. Ma trận phân định trách nhiệm liên phòng ban trong các quy trình quản trị nhân sự (RACI Matrix)**

| STT | Quy trình Quản trị Nhân sự | Quản lý Siêu thị (SM) | Quản lý Khu vực (AM) | Phòng Tuyển dụng Mass | Phòng C&B Tập đoàn | Phòng Đào tạo L&D | Phòng CNTT (MWG IT) | Khối Tài chính - Kế toán | Ban Giám đốc Tập đoàn |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | Tuyển dụng số lượng lớn (Mass ATS) | **C** | **R** | **R** | **I** | **I** | **C** | **C** | **A** |
| 2 | Tiếp nhận nhân sự & Ký HĐLĐ điện tử | **R** | **I** | **I** | **R** | **C** | **C** | **I** | **A** |
| 3 | Lập lịch và phân ca làm việc tại siêu thị | **R** | **A** | **I** | **C** | **I** | **I** | **I** | **I** |
| 4 | Điểm danh đa nguồn & Chốt công tháng | **R** | **C** | **I** | **R** | **I** | **C** | **I** | **A** |
| 5 | Quản lý nghỉ phép và làm thêm giờ | **R** | **A** | **I** | **R** | **I** | **I** | **C** | **I** |
| 6 | Tính toán & Chi trả tiền lương 3P | **I** | **I** | **I** | **R** | **I** | **C** | **R** | **A** |
| 7 | Tạm ứng lương, vay phúc lợi & Công tác phí | **C** | **C** | **I** | **R** | **I** | **I** | **R** | **A** |
| 8 | Đào tạo văn hóa, sát hạch & Thăng cấp SM | **C** | **C** | **I** | **I** | **R** | **C** | **I** | **A** |
| 9 | Điều chuyển, Kỷ luật & Thôi việc siêu thị | **R** | **R** | **I** | **R** | **I** | **R** | **R** | **A** |

*Ghi chú: **R** (Responsible) - Bộ phận trực tiếp thực hiện; **A** (Accountable) - Cấp phê duyệt và chịu trách nhiệm cao nhất; **C** (Consulted) - Bộ phận phối hợp, tham gia ý kiến chuyên môn; **I** (Informed) - Bộ phận nhận thông tin để theo dõi.*

---

### 1.3.4. Phát biểu bài toán tổng quát và yêu cầu hệ thống hóa

Từ thực trạng vận hành và các thách thức nêu trên, bài toán đặt ra cho Thế Giới Di Động (MWG) là: **Xây dựng một Hệ thống thông tin quản trị nhân lực (HRMS) tập trung, đa nền tảng (Web và Mobile), quản lý toàn diện vòng đời làm việc của hơn 65.000 nhân viên, liên thông các quy trình phê duyệt trực tuyến giữa Siêu thị - Khu vực - Tập đoàn, hỗ trợ điểm danh di động thông minh (GPS Geofencing, FaceID, Wifi), vận hành chức năng tính lương bán lẻ 3P tự động, bảo đảm tuân thủ nghiêm ngặt các quy định pháp luật lao động và an toàn dữ liệu, đồng thời cung cấp cổng thông tin tự phục vụ tức thời cho toàn thể người lao động.**

Để giải quyết bài toán trên, hệ thống cần đáp ứng bốn nhóm yêu cầu cụ thể:
1. **Quản lý dữ liệu tập trung và liên thông quy trình phân cấp:** Xây dựng CSDL hợp nhất trên nền tảng PostgreSQL 16 quản lý hơn 65.000 hồ sơ; tự động hóa việc luân chuyển và phê duyệt hồ sơ trực tuyến giữa Nhân viên siêu thị -> Quản lý siêu thị (SM) -> Quản lý khu vực (AM) -> Khối Nhân sự Tập đoàn -> Ban Giám đốc.
2. **Tự động hóa các nghiệp vụ bán lẻ cốt lõi:** Quản lý phễu tuyển dụng số lượng lớn (Mass ATS); lập lịch phân ca xoay và hỗ trợ đổi ca linh hoạt; tự động tổng hợp dữ liệu điểm danh đa nguồn; tự động kết nối doanh số bán hàng từ ERP để tính lương 3P, tính thuế TNCN lũy tiến và trích nộp bảo hiểm xã hội.
3. **Tuân thủ pháp luật lao động và bảo mật thông tin:** Tự động cảnh báo giới hạn giờ làm thêm không quá 40 giờ/tháng và 200 giờ/năm theo Điều 107 BLLĐ 2019; khống chế trích trừ nợ tạm ứng/vay không quá 30% lương thực lĩnh theo Điều 102 BLLĐ 2019; khóa dữ liệu kỳ lương bất biến (`LOCKED`) sau khi được Tổng Giám đốc duyệt; mã hóa dữ liệu vector khuôn mặt và bảo vệ thông tin vị trí GPS theo Nghị định 13/2023/NĐ-CP.
4. **Cổng tự phục vụ di động (Mobile ESS):** Cung cấp ứng dụng di động nội bộ tiện dụng cho nhân viên điểm danh tức thời, tra cứu chi tiết phiếu lương hàng tháng, nộp đơn nghỉ phép, xin đổi ca làm việc và đăng ký thi thăng cấp quản lý trực tiếp trên điện thoại thông minh.

---

## Tóm tắt chương 1

Chương 1 đã hệ thống hóa đầy đủ cơ sở lý luận về quản trị nhân lực trong ngành bán lẻ chuỗi quy mô lớn; giới thiệu phương pháp phân tích thiết kế hướng đối tượng (OOAD) và ngôn ngữ mô hình hóa UML; phân tích sâu sắc các đặc thù nghiệp vụ, cơ cấu tổ chức và văn hóa doanh nghiệp tại Tập đoàn Thế Giới Di Động (MWG). Đồng thời, chương đã phát biểu chi tiết 9 quy trình quản trị nhân sự thực tế và ma trận RACI phân định rõ trách nhiệm liên phòng ban, tạo cơ sở thực tiễn vững chắc cho công tác phân tích tác nhân, xác định 47 Use Case và thiết kế hệ thống chi tiết ở Chương 2.

---

# CHƯƠNG 2: THIẾT KẾ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC CHO CÔNG TY CỔ PHẦN ĐẦU TƯ THẾ GIỚI DI ĐỘNG (MWG)

## 2.1. Phân tích các yêu cầu nghiệp vụ

### 2.1.1. Xác định và phân loại các tác nhân

Dựa trên kết quả khảo sát cơ cấu tổ chức và quy trình vận hành thực tế tại Tập đoàn Thế Giới Di Động (MWG), hệ thống xác định 12 tác nhân nghiệp vụ cụ thể. Để đáp ứng mô hình kiểm soát truy cập dựa trên vai trò (RBAC) và phân định rõ ràng giữa **Nghiệp vụ Bán lẻ Tuyến đầu**, **Quản lý Chuỗi/Khu vực**, **Tham mưu Nhân sự Tập đoàn**, **Quản trị Sở hữu Cổ đông** và **Quản trị Kỹ thuật CNTT**, các tác nhân được ánh xạ vào mô hình phân quyền hệ thống:

**Bảng 2.1. Ánh xạ tác nhân hệ thống với cơ cấu tổ chức và chức danh thực tế của MWG**

| STT | Tác nhân nghiệp vụ | Bộ phận / Vị trí thực tế tương ứng tại MWG | Vai trò hệ thống | Trách nhiệm và quyền hạn chính trên phần mềm |
| :--- :| :--- | :--- | :---: | :--- |
| 1 | **Nhân viên Bán lẻ (Tác nhân chung)** | Toàn thể nhân viên tư vấn bán hàng, thu ngân, kho siêu thị, kỹ thuật lắp đặt và nhân viên kho vận DC | USER | Sử dụng ứng dụng di động nội bộ (Mobile ESS): điểm danh định vị GPS/FaceID, xem lịch ca làm việc, gửi yêu cầu đổi ca, nộp đơn nghỉ phép, tra cứu phiếu lương cá nhân và cập nhật thông tin liên lạc (Mức 1). |
| 2 | **Quản lý Siêu thị (Store Manager - SM)** | Quản lý siêu thị / Trưởng cửa hàng tại các siêu thị Thế Giới Di Động, Điện Máy Xanh, Bách Hóa Xanh | STORE_MANAGER | Lập lịch phân ca tuần cho nhân viên siêu thị, phê duyệt yêu cầu đổi ca, duyệt đơn giải trình công, sơ tuyển ứng viên, đánh giá kết quả thử việc, duyệt đơn nghỉ phép ngắn ngày và kiểm soát bàn giao tài sản khi nhân viên thôi việc. |
| 3 | **Quản lý Khu vực (Area Manager - AM)** | Quản lý khu vực / Trưởng cụm phụ trách 15 - 25 siêu thị trong một tỉnh/quận | AREA_MANAGER | Phê duyệt định biên và phiếu đề xuất tuyển dụng của siêu thị, phê duyệt đơn nghỉ dài ngày (từ 3 ngày trở lên), điều phối nhân sự tăng cường giữa các siêu thị trong khu vực và xem dashboard doanh số, tỷ lệ đi làm của khu vực. |
| 4 | **Chuyên viên Tuyển dụng Số lượng lớn** | Phòng Tuyển dụng Mass ATS - Khối Quản trị Nguồn nhân lực Tập đoàn | HR_RECRUITER | Quản lý tin tuyển dụng trên cổng vieclam.thegioididong.com, vận hành phễu sàng lọc CV tự động, lên lịch phỏng vấn tập trung, gửi thông báo trúng tuyển và phát hành thư mời nhận việc hàng loạt. |
| 5 | **Chuyên viên Hồ sơ & Hợp đồng** | Phòng Nhân sự Vận hành - Khối Quản trị Nguồn nhân lực Tập đoàn | HR_OFFICER | Thẩm định hồ sơ nhân viên mới, điều phối ký kết HĐLĐ điện tử, số hóa văn bằng chứng chỉ, thẩm định các đề xuất thay đổi thông tin định danh pháp lý (Mức 2) và báo tăng/giảm BHXH. |
| 6 | **Chuyên viên Tiền lương & Phúc lợi (C&B)** | Phòng Tiền lương & Phúc lợi - Khối Quản trị Nguồn nhân lực Tập đoàn | HR_CB | Giám sát dữ liệu chấm công toàn quốc, xử lý các ngoại lệ lệch công, cấu hình công thức lương 3P và hoa hồng doanh số, chạy chức năng tính lương tự động cho hơn 65.000 nhân sự và quản lý các khoản vay phúc lợi. |
| 7 | **Chuyên viên Đào tạo & Văn hóa (L&D)** | Phòng Đào tạo & Phát triển - Khối Quản trị Nguồn nhân lực Tập đoàn | HR_TRAINER | Thiết kế khóa học văn hóa "Tận tâm phục vụ" trên e-learning, tổ chức sát hạch nghiệp vụ định kỳ, điều phối kỳ thi thăng cấp Quản lý siêu thị và tiếp nhận, hòa giải khiếu nại lao động. |
| 8 | **Nhân viên Hành chính & Tài sản** | Bộ phận Hành chính & Quản trị tài sản bán lẻ | ADMIN_OFFICER | Quản lý cấp phát và thu hồi đồng phục, bảng tên, thiết bị bán hàng (máy quét mã vạch, máy POS, két tiền siêu thị), là chốt chặn thu hồi tài sản trong quy trình thôi việc. |
| 9 | **Kế toán viên Chi nhánh & Kho** | Khối Tài chính - Kế toán Tập đoàn | ACCOUNTANT | Đối chiếu bảng thanh toán tiền lương, kiểm tra ngân sách quỹ lương, xác nhận quỹ tiền mặt siêu thị, giải ngân tạm ứng và thanh quyết toán chi phí công tác. |
| 10 | **Đại diện Người lao động** | Ban Chấp hành Công đoàn cơ sở MWG | UNION_REP | Giám sát việc thực hiện chế độ chính sách, tham gia ý kiến trong quy trình xử lý kỷ luật lao động và giải quyết khiếu nại bảo vệ quyền lợi người lao động. |
| 11 | **Ban Tổng Giám đốc (CEO Tập đoàn / Khối)** | Tổng Giám đốc Tập đoàn, các CEO Chuỗi bán lẻ (TGDD, DMX, BHX) | BOD | Ban Lãnh đạo điều hành: Phê duyệt kế hoạch định biên tuyển dụng toàn quốc, phê duyệt bảng tổng quỹ lương tháng và thực hiện ký duyệt điện tử, phê duyệt bổ nhiệm Quản lý siêu thị và các quyết định khen thưởng, kỷ luật cấp cao. Xem dashboard toàn tập đoàn. |
| 12 | **Quản trị viên Kỹ thuật Hệ thống CNTT** | Khối Công nghệ Thông tin (MWG IT) | SYS_ADMIN | Quản trị kỹ thuật CNTT: Quản trị hạ tầng máy chủ, quản lý tài khoản người dùng, phân quyền vai trò RBAC, cấu hình tham số hệ thống, kết nối máy chấm công DC / Kiosk và giám sát nhật ký kiểm toán (Audit Log) theo ISO 27001. |

---

### 2.1.2. Danh sách 47 Use Case và phân nhóm nhiệm vụ

Hệ thống thông tin quản trị nhân lực cho MWG được thiết kế thành **47 Use Case hoàn chỉnh**, phân bổ khoa học vào **10 nhóm phân hệ nghiệp vụ** bám sát trọn vẹn vòng đời nhân sự bán lẻ:

**Bảng 2.2. Danh sách 47 Use case của Hệ thống Quản trị nhân lực MWG**

| STT | Mã Use Case | Tên Use Case nghiệp vụ | Tác nhân chính | Nhóm phân hệ chức năng |
| :---: | :---: | :--- | :--- | :--- |
| 1 | **UC01** | Đăng nhập & Xác thực hệ thống đa nền tảng | Toàn thể nhân viên | Nhóm A: Quản trị hệ thống & Cơ cấu tổ chức |
| 2 | **UC02** | Quản trị người dùng & Phân quyền RBAC bán lẻ | Quản trị viên CNTT | Nhóm A: Quản trị hệ thống & Cơ cấu tổ chức |
| 3 | **UC03** | Quản trị cơ cấu tổ chức chuỗi & Cây siêu thị | Quản trị viên CNTT, Ban Giám đốc | Nhóm A: Quản trị hệ thống & Cơ cấu tổ chức |
| 4 | **UC04** | Lập phiếu đề xuất tuyển dụng nhân sự siêu thị | Quản lý siêu thị (SM) | Nhóm B: Tuyển dụng & Ứng viên (Mass ATS) |
| 5 | **UC05** | Thẩm định chỉ tiêu & Kiểm soát định biên chuỗi | Quản lý khu vực (AM), Tuyển dụng | Nhóm B: Tuyển dụng & Ứng viên (Mass ATS) |
| 6 | **UC06** | Phê duyệt kế hoạch tuyển dụng số lượng lớn | Giám đốc Chuỗi / Ban Giám đốc | Nhóm B: Tuyển dụng & Ứng viên (Mass ATS) |
| 7 | **UC07** | Quản lý hồ sơ ứng viên & Phễu tuyển dụng Mass ATS | Chuyên viên Tuyển dụng | Nhóm B: Tuyển dụng & Ứng viên (Mass ATS) |
| 8 | **UC08** | Gửi thông báo trúng tuyển & Thư mời nhận việc điện tử | Chuyên viên Tuyển dụng, Ứng viên | Nhóm B: Tuyển dụng & Ứng viên (Mass ATS) |
| 9 | **UC09** | Quản lý hồ sơ nhân viên bán lẻ toàn diện | Chuyên viên Hồ sơ | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 10 | **UC10** | Quản lý hợp đồng lao động & Ký kết điện tử (E-Sign) | Chuyên viên Hồ sơ, Nhân viên | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 11 | **UC11** | Quản lý văn bằng, chứng chỉ chuyên môn & Dược sĩ | Chuyên viên Hồ sơ | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 12 | **UC12** | Mượn - trả hồ sơ, bằng cấp bản gốc lưu kho | Nhân viên, Chuyên viên Hồ sơ | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 13 | **UC13** | Đánh giá thử việc tại siêu thị & Ký HĐLĐ chính thức | Quản lý siêu thị (SM), Giám đốc | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 14 | **UC14** | Lộ trình hội nhập văn hóa "Tận tâm phục vụ khách hàng" | Nhân viên mới, Mentor siêu thị | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 15 | **UC15** | Cổng tự phục vụ nhân viên di động (MWG Mobile App) | Toàn thể nhân viên | Nhóm D: Cổng tự phục vụ nhân viên (ESS) |
| 16 | **UC16** | Quản lý thông tin cá nhân phân cấp 3 mức độ | Toàn thể nhân viên | Nhóm D: Cổng tự phục vụ nhân viên (ESS) |
| 17 | **UC17** | Thẩm định & Phê duyệt đề xuất đổi thông tin định danh | Chuyên viên Hồ sơ, Quản trị viên | Nhóm D: Cổng tự phục vụ nhân viên (ESS) |
| 18 | **UC18** | Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca | Toàn thể nhân viên | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 19 | **UC19** | Điểm danh di động GPS Geofencing & FaceID nhận diện | Nhân viên siêu thị, App MWG | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 20 | **UC20** | Quản trị kết nối thiết bị máy chấm công Tổng kho DC | Chuyên viên Hồ sơ, Quản trị IT | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 21 | **UC21** | Đăng ký & Xét duyệt nghỉ phép trực tuyến qua app | Nhân viên, Quản lý siêu thị (SM) | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 22 | **UC22** | Đăng ký & Phê duyệt làm thêm giờ (OT) mùa cao điểm | Nhân viên, Quản lý siêu thị, C&B | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 23 | **UC23** | Lập lịch và phân ca xoay tại siêu thị (Store Scheduling) | Quản lý siêu thị (SM) | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 24 | **UC24** | Giải trình bổ sung giờ công & Xử lý lệch công tại điểm bán | Nhân viên, Quản lý siêu thị, C&B | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 25 | **UC25** | Tổng hợp & Chốt bảng chấm công tháng toàn hệ thống | Chuyên viên C&B, Quản lý siêu thị | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 26 | **UC26** | Cấu hình công thức lương 3P & Hoa hồng doanh số bán lẻ | Chuyên viên C&B | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 27 | **UC27** | Vận hành chức năng tính lương tự động cho hơn 65.000 nhân sự | Chuyên viên C&B | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 28 | **UC28** | Phê duyệt & Khóa bất biến kỳ lương (Locked Payroll) | Chuyên viên C&B, Tổng Giám đốc | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 29 | **UC29** | Quản lý tạm ứng lương & Khoản vay quỹ phúc lợi MWG | Nhân viên, Quản lý siêu thị, Giám đốc | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 30 | **UC30** | Quản lý đề xuất công tác thị trường & Quyết toán chi phí | Quản lý khu vực (AM), Kế toán | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 31 | **UC31** | Quản lý cấp phát & Thu hồi đồng phục, công cụ bán hàng | Nhân viên Hành chính, Nhân viên | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 32 | **UC32** | Đề xuất & Phê duyệt điều chuyển nhân sự giữa các siêu thị | Quản lý khu vực (AM), Giám đốc | Nhóm G: Biến động nhân sự & Thôi việc |
| 33 | **UC33** | Đề xuất & Phê duyệt điều chỉnh bậc lương theo tay nghề | Quản lý siêu thị, Chuyên viên C&B | Nhóm G: Biến động nhân sự & Thôi việc |
| 34 | **UC34** | Đề xuất & Phê duyệt khen thưởng nhân sự bán lẻ xuất sắc | Quản lý siêu thị, Ban Giám đốc | Nhóm G: Biến động nhân sự & Thôi việc |
| 35 | **UC35** | Xử lý kỷ luật lao động & Vi phạm nội quy siêu thị | Quản lý siêu thị, Công đoàn, Giám đốc | Nhóm G: Biến động nhân sự & Thôi việc |
| 36 | **UC36** | Quy trình bàn giao thôi việc 4 khâu cấp tốc tại siêu thị | Nhân viên, Quản lý siêu thị, Các bộ phận | Nhóm G: Biến động nhân sự & Thôi việc |
| 37 | **UC37** | Đánh giá năng lực phục vụ khách hàng (CSAT) & Thăng cấp SM | Nhân viên, Quản lý siêu thị, L&D | Nhóm H: Đánh giá hiệu suất, Đào tạo & Khiếu nại |
| 38 | **UC38** | Quản trị chương trình đào tạo nghiệp vụ & E-Learning | Chuyên viên Đào tạo L&D, Nhân viên | Nhóm H: Đánh giá hiệu suất, Đào tạo & Khiếu nại |
| 39 | **UC39** | Tiếp nhận & Giải quyết khiếu nại lao động bảo mật | Chuyên viên L&D, Đại diện Công đoàn | Nhóm H: Đánh giá hiệu suất, Đào tạo & Khiếu nại |
| 40 | **UC40** | Quản lý hồ sơ cán bộ quản lý theo chuẩn Mẫu 2C-BNV | Chuyên viên Hồ sơ | Nhóm I: Hồ sơ cán bộ & Báo cáo cơ quan nhà nước |
| 41 | **UC41** | Quản trị danh mục ngạch bậc lương chuẩn Nghị định 204 | Chuyên viên Hồ sơ | Nhóm I: Hồ sơ cán bộ & Báo cáo cơ quan nhà nước |
| 42 | **UC42** | Tự động rà soát & Phê duyệt nâng bậc lương định kỳ | Chuyên viên Hồ sơ, Giám đốc | Nhóm I: Hồ sơ cán bộ & Báo cáo cơ quan nhà nước |
| 43 | **UC43** | Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Báo cáo lao động) | Chuyên viên Hồ sơ | Nhóm I: Hồ sơ cán bộ & Báo cáo cơ quan nhà nước |
| 44 | **UC44** | Quản lý không gian tri thức & Quy trình thao tác chuẩn (SOP) | Toàn thể nhân viên MWG | Nhóm J: Quản trị tri thức & Điều hành hệ thống |
| 45 | **UC45** | Tìm kiếm tri thức sản phẩm & Danh bạ chuyên gia nội bộ | Toàn thể nhân viên MWG | Nhóm J: Quản trị tri thức & Điều hành hệ thống |
| 46 | **UC46** | Bảng điều khiển phân tích nhân sự thời gian thực (HR Dashboard) | Ban Giám đốc, Quản lý khu vực (AM) | Nhóm J: Quản trị tri thức & Điều hành hệ thống |
| 47 | **UC47** | Nhật ký kiểm toán hệ thống & Cấu hình tham số bán lẻ | Quản trị viên Kỹ thuật CNTT | Nhóm J: Quản trị tri thức & Điều hành hệ thống |

---

### 2.1.3. Đặc tả chi tiết các Use Case của hệ thống

Dưới đây là bảng đặc tả kịch bản tác nghiệp chi tiết của toàn bộ 47 Use Case trong hệ thống, được chuẩn hóa theo từng bước tương tác giữa người dùng và phần mềm:

#### UC01 - Đăng nhập & Xác thực hệ thống đa nền tảng
- **Tác nhân chính:** Toàn thể nhân viên MWG
- **Mục đích / Mô tả:** Xác thực định danh người dùng bằng mã nhân viên/email nội bộ và mật khẩu (kết hợp OTP hoặc sinh trắc học vân tay/FaceID trên điện thoại), phân bổ phiên làm việc an toàn với JWT.
- **Điều kiện tiên quyết:** Người dùng có tài khoản hợp lệ ở trạng thái `ACTIVE` trong CSDL.
- **Hậu điều kiện:** Cấp phát cặp JWT token hợp lệ và điều hướng người dùng tới Dashboard tương ứng với vai trò.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập giao diện `/login` trên Web hoặc mở ứng dụng di động MWG App, nhập mã nhân viên và mật khẩu; bấm "Đăng nhập". | Tiếp nhận thông tin, kiểm tra tính hợp lệ về định dạng dữ liệu đầu vào. |
| 2 | - | Truy vấn CSDL tìm kiếm tài khoản người dùng; đối chiếu mã băm mật khẩu bằng thuật toán bcrypt. |
| 3 | - | Nếu thông tin chính xác: Hệ thống cấp phát Access Token (JWT 15 phút) và Refresh Token (7 ngày); lưu bản ghi phiên làm việc; điều hướng người dùng tới màn hình làm việc tương ứng vai trò. |
| 4 | - | Nếu sai thông tin: Hiển thị thông báo lỗi "Mã nhân viên hoặc mật khẩu không chính xác"; tăng biến đếm số lần thất bại (nếu nhập sai quá 5 lần, tự động khóa tài khoản trong 15 phút để chống tấn công dò quét). |

#### UC02 - Quản trị người dùng & Phân quyền RBAC bán lẻ
- **Tác nhân chính:** Quản trị viên Kỹ thuật CNTT
- **Mục đích / Mô tả:** Khởi tạo tài khoản, gán vai trò RBAC doanh nghiệp đa cấp (SYS_ADMIN, BOD, STORE_MANAGER, AREA_MANAGER, HR_CB, HR_RECRUITER, HR_OFFICER, HR_TRAINER, ACCOUNTANT, UNION_REP, USER) và cấu hình ma trận phân quyền các phân hệ.
- **Điều kiện tiên quyết:** Đã đăng nhập với vai trò `SYS_ADMIN`.
- **Hậu điều kiện:** Quyền hạn mới có hiệu lực tức thời tại API Gateway và Menu điều hướng.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập giao diện Quản lý phân quyền `/admin/roles` (hoặc `/admin/users`). | Hiển thị danh sách tài khoản, danh mục 11 vai trò và tab "Ma trận phân quyền RBAC". |
| 2 | Chọn tài khoản cần gán quyền, chọn vai trò tương ứng (ví dụ: STORE_MANAGER); hoặc biên tập quyền hạn CRUD cho từng vai trò trên từng phân hệ chức năng. | Hệ thống hiển thị huy hiệu vai trò phân loại trực quan; kiểm tra tính hợp lệ dữ liệu. |
| 3 | Bấm "Lưu cấu hình quyền". | Cập nhật bảng `UserRole` và bản ghi cấu hình `Setting`; ghi nhật ký kiểm toán `AuditLog`. |

#### UC03 - Quản trị cơ cấu tổ chức chuỗi & Cây siêu thị
- **Tác nhân chính:** Quản trị viên CNTT, Ban Giám đốc
- **Mục đích / Mô tả:** Thiết lập và quản lý cấu trúc cây tổ chức phân cấp đa tầng từ Tập đoàn -> Khối Chuỗi -> Miền -> Vùng/Khu vực -> Siêu thị, quản lý chỉ tiêu định biên và chỉ định Quản lý siêu thị (SM).
- **Điều kiện tiên quyết:** Người dùng có quyền quản trị tổ chức.
- **Hậu điều kiện:** Cơ cấu tổ chức mới được lưu trữ; sơ đồ cây siêu thị được đồng bộ theo thời gian thực.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập giao diện `/org-chart`, chọn thao tác thêm mới đơn vị hoặc kéo-thả siêu thị/khu vực trên cây tổ chức. | Hiển thị sơ đồ phân cấp trực quan dạng cây (Tree-view). |
| 2 | Nhập mã siêu thị, tên siêu thị, địa chỉ, tọa độ GPS (kinh độ, vĩ độ), bán kính geofencing (mặc định 50m), mã BSSID Wifi cửa hàng, chọn đơn vị cha (`parentId`), chỉ tiêu định biên và chỉ định Quản lý siêu thị (`headId`). | Kiểm tra tính hợp lệ tọa độ GPS và quan hệ cha-con chống vòng lặp vô hạn. |
| 3 | Bấm "Xác nhận cập nhật". | Cập nhật bảng `Department`/`OrgUnit` trong CSDL; đồng bộ phạm vi quyền duyệt đơn cho Quản lý siêu thị mới. |

#### UC04 - Lập phiếu đề xuất tuyển dụng nhân sự siêu thị
- **Tác nhân chính:** Quản lý siêu thị (SM)
- **Mục đích / Mô tả:** Khởi tạo nhu cầu bổ sung nhân sự cho siêu thị (bán hàng, thu ngân, kho) căn cứ trên chỉ tiêu định biên và dự báo tăng trưởng doanh số.
- **Điều kiện tiên quyết:** Quản lý siêu thị có tài khoản hoạt động và thuộc siêu thị có nhu cầu nhân sự.
- **Hậu điều kiện:** Phiếu đề xuất được tạo ở trạng thái `PENDING_REVIEW` và gửi tới Quản lý khu vực (AM).

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản lý siêu thị vào `/recruitment-ats/requisitions`, bấm "Tạo đề xuất tuyển dụng". | Hiển thị biểu mẫu đề xuất: Vị trí tuyển dụng, số lượng, lý do (mở rộng, thay thế), thời hạn cần nhân sự. |
| 2 | Nhập thông tin, hệ thống tự động đối chiếu số lượng nhân sự hiện tại của siêu thị với định biên được duyệt. | Hiển thị cảnh báo nếu số lượng đề xuất vượt quá chỉ tiêu định biên tối đa của siêu thị. |
| 3 | Bấm "Gửi đề xuất". | Lưu bản ghi `JobRequisition` ở trạng thái `PENDING_REVIEW`; gửi thông báo phê duyệt đến Quản lý khu vực (AM). |

#### UC05 - Thẩm định chỉ tiêu & Kiểm soát định biên chuỗi
- **Tác nhân chính:** Quản lý khu vực (AM), Chuyên viên Tuyển dụng
- **Mục đích / Mô tả:** Quản lý khu vực rà soát nhu cầu tuyển dụng của các siêu thị trong cụm, đối chiếu chỉ tiêu định biên toàn vùng và cân đối phương án điều chuyển nhân sự nội bộ trước khi tuyển mới.
- **Điều kiện tiên quyết:** Có phiếu đề xuất tuyển dụng đang chờ thẩm định.
- **Hậu điều kiện:** Đề xuất được chuyển tiếp lên Giám đốc Chuỗi phê duyệt hoặc chuyển sang phương án điều chuyển nội bộ.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản lý khu vực (AM) mở danh sách đề xuất tuyển dụng cần thẩm định. | Hiển thị chi tiết đề xuất, tỷ lệ đạt doanh số và tỷ lệ biến động nhân sự của siêu thị đề xuất. |
| 2 | Kiểm tra nguồn nhân lực dư thừa từ các siêu thị lân cận trong cùng quận/huyện. | Nếu có nhân sự dư thừa: Đề xuất phương án điều chuyển liên siêu thị; nếu không: Xác nhận thẩm định đủ điều kiện tuyển mới. |
| 3 | Bấm "Thẩm định chấp thuận". | Cập nhật trạng thái đề xuất thành `REVIEWED`; chuyển tiếp lên Giám đốc Chuỗi / Ban Giám đốc phê duyệt. |

#### UC06 - Phê duyệt kế hoạch tuyển dụng số lượng lớn
- **Tác nhân chính:** Giám đốc Chuỗi / Ban Giám đốc Tập đoàn
- **Mục đích / Mô tả:** Phê chuẩn chỉ tiêu tuyển dụng số lượng lớn cho toàn chuỗi hoặc toàn vùng, kích hoạt chiến dịch tuyển dụng trên cổng việc làm.
- **Điều kiện tiên quyết:** Đề xuất tuyển dụng đã được Quản lý khu vực thẩm định.
- **Hậu điều kiện:** Phiếu tuyển dụng chuyển sang trạng thái `APPROVED`; tự động kích hoạt tạo tin tuyển dụng (`JobOpening`).

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Lãnh đạo đăng nhập xem bảng tổng hợp các đề xuất tuyển dụng theo vùng/chuỗi. | Hiển thị báo cáo tổng hợp ngân sách lương dự kiến và số lượng nhân sự cần bổ sung. |
| 2 | Ký phê duyệt điện tử cho các đề xuất hợp lệ. | Cập nhật trạng thái phiếu thành `APPROVED`. |
| 3 | - | Tự động tạo bản ghi `JobOpening`, gửi thông báo đến Phòng Tuyển dụng Mass ATS để phát động chiến dịch tuyển dụng. |

#### UC07 - Quản lý hồ sơ ứng viên & Phễu tuyển dụng Mass ATS
- **Tác nhân chính:** Chuyên viên Tuyển dụng Mass ATS
- **Mục đích / Mô tả:** Tiếp nhận hàng chục nghìn hồ sơ ứng tuyển từ cổng việc làm, tự động phân loại theo khu vực, điều phối phỏng vấn tập trung và cập nhật trạng thái ứng viên qua các giai đoạn (Kanban pipeline).
- **Điều kiện tiên quyết:** Chiến dịch tuyển dụng đang mở.
- **Hậu điều kiện:** Ứng viên vượt qua các vòng phỏng vấn được chuyển sang giai đoạn trúng tuyển (`OFFERED`).

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên tuyển dụng truy cập `/recruitment-ats`, chọn chiến dịch tuyển dụng theo chuỗi (TGDD, DMX, BHX). | Hiển thị bảng điều khiển Kanban 6 giai đoạn: Ứng tuyển mới -> Sàng lọc tự động -> Phỏng vấn tập trung -> Đạt phỏng vấn -> Gửi đề nghị nhận việc -> Nhận việc thành công. |
| 2 | Hệ thống tự động lọc hồ sơ theo vị trí địa lý quận/huyện gần siêu thị tuyển dụng. | Lọc ra danh sách ứng viên đạt tiêu chuẩn độ tuổi, bằng cấp và khoảng cách di chuyển. |
| 3 | Chuyên viên xếp lịch phỏng vấn tập trung, gửi tin nhắn SMS/Zalo mời phỏng vấn; ghi nhận điểm số đánh giá thái độ phục vụ sau phỏng vấn. | Cập nhật kết quả vào bản ghi `InterviewRound`; chuyển thẻ ứng viên sang cột "Đạt phỏng vấn". |

#### UC08 - Gửi thông báo trúng tuyển & Thư mời nhận việc điện tử
- **Tác nhân chính:** Chuyên viên Tuyển dụng, Ứng viên
- **Mục đích / Mô tả:** Phát hành thư mời nhận việc điện tử (Job Offer) kèm thông tin mức lương, siêu thị làm việc, ngày khai giảng khóa đào tạo hội nhập; ứng viên xác nhận trực tuyến.
- **Điều kiện tiên quyết:** Ứng viên ở trạng thái đạt phỏng vấn.
- **Hậu điều kiện:** Ứng viên bấm xác nhận nhận việc; tự động khởi tạo hồ sơ nhân viên mới dạng dự thảo.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên tuyển dụng chọn danh sách ứng viên đạt yêu cầu, bấm "Tạo thư mời nhận việc hàng loạt". | Hệ thống tự động điền thông tin mức lương cơ bản, phụ cấp, tỷ lệ hoa hồng và siêu thị tiếp nhận theo mẫu chuẩn. |
| 2 | Bấm "Phát hành thư mời". | Hệ thống gửi email và tin nhắn SMS kèm liên kết bảo mật xác thực tới từng ứng viên. |
| 3 | Ứng viên mở liên kết, đọc điều khoản và bấm "Đồng ý nhận việc". | Hệ thống ghi nhận trạng thái `ACCEPTED`; kích hoạt chuyển dữ liệu sang phân hệ tiếp nhận hồ sơ nhân viên. |

#### UC09 - Quản lý hồ sơ nhân viên bán lẻ toàn diện
- **Tác nhân chính:** Chuyên viên Hồ sơ nhân sự
- **Mục đích / Mô tả:** Quản lý tập trung toàn diện lý lịch trích ngang, quá trình làm việc, lịch sử luân chuyển siêu thị, văn bằng chứng chỉ và tình trạng hợp đồng của hơn 65.000 nhân viên.
- **Điều kiện tiên quyết:** Đã đăng nhập với quyền quản lý hồ sơ.
- **Hậu điều kiện:** Hồ sơ nhân viên được lưu trữ đầy đủ, hỗ trợ tra cứu toàn văn và kết xuất báo cáo nhanh chóng.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập `/employees`, nhập từ khóa tìm kiếm (mã NV, họ tên, CCCD, mã siêu thị, khu vực). | Hiển thị danh sách nhân viên kèm bộ lọc đa tiêu chí (chuỗi, chức danh, trạng thái làm việc). |
| 2 | Nhấp vào một nhân viên để xem chi tiết hồ sơ `/employees/[id]`. | Hiển thị giao diện thẻ chuyển tab trực quan: Thông tin định danh, Hợp đồng, Bằng cấp, Diễn biến lương, Lịch sử đổi siêu thị, Khen thưởng/Kỷ luật. |
| 3 | Thực hiện cập nhật thông tin nghiệp vụ hoặc xuất trích lục hồ sơ điện tử. | Hệ thống kiểm tra tính hợp lệ dữ liệu và ghi vết vào `AuditLog`. |

#### UC10 - Quản lý hợp đồng lao động & Ký kết điện tử (E-Sign)
- **Tác nhân chính:** Chuyên viên Hồ sơ, Nhân viên bán lẻ
- **Mục đích / Mô tả:** Quản lý vòng đời hợp đồng lao động (thử việc, xác định thời hạn 12 - 36 tháng, không xác định thời hạn) và thực hiện ký kết trực tuyến bằng mã OTP điện tử.
- **Điều kiện tiên quyết:** Ứng viên đã trúng tuyển hoặc nhân viên đến hạn ký tiếp HĐLĐ.
- **Hậu điều kiện:** Hợp đồng có đầy đủ chữ ký số hai bên, được mã hóa lưu trữ và có giá trị pháp lý theo Luật Giao dịch điện tử.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên hồ sơ tạo hợp đồng mới từ mẫu hợp đồng bán lẻ chuẩn của MWG. | Hệ thống tự động điền các thông số: Mức lương cơ bản, phụ cấp, chức danh, địa điểm làm việc và thời hạn hợp đồng. |
| 2 | Bấm "Gửi ký điện tử". | Gửi thông báo đến ứng dụng di động của nhân viên và Giám đốc Nhân sự. |
| 3 | Nhân viên kiểm tra hợp đồng trên app, nhập mã OTP gửi về số điện thoại chính chủ để xác nhận ký điện tử. | Hệ thống gắn chữ ký điện tử, đóng dấu thời gian (Timestamp), chuyển trạng thái hợp đồng sang `ACTIVE` và thông báo cho cơ quan BHXH. |

#### UC11 - Quản lý văn bằng, chứng chỉ chuyên môn & Dược sĩ
- **Tác nhân chính:** Chuyên viên Hồ sơ
- **Mục đích / Mô tả:** Quản lý thông tin bằng cấp, chứng chỉ hành nghề dược (đối với nhân sự Nhà thuốc An Khang), chứng chỉ an toàn vệ sinh thực phẩm (Bách Hóa Xanh) và kỹ thuật điện máy.
- **Điều kiện tiên quyết:** Nhân viên nộp tệp đính kèm văn bằng chứng chỉ.
- **Hậu điều kiện:** Văn bằng được xác thực tính hợp lệ và lưu vào hồ sơ nhân sự; tự động cảnh báo khi chứng chỉ hành nghề sắp hết hạn.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên hồ sơ truy cập tab "Văn bằng - Chứng chỉ" trong hồ sơ nhân viên. | Hiển thị danh mục văn bằng đã nộp kèm hình ảnh scan hai mặt. |
| 2 | Kiểm tra số hiệu văn bằng, ngày cấp, cơ sở đào tạo và ngày hết hạn chứng chỉ hành nghề. | Đối chiếu với tiêu chuẩn chức danh (đặc biệt chứng chỉ hành nghề Dược sĩ phụ trách chuyên môn tại An Khang). |
| 3 | Bấm "Xác thực văn bằng". | Đánh dấu trạng thái `VERIFIED`; thiết lập lịch tự động cảnh báo trước 60 ngày khi chứng chỉ sắp hết hạn. |

#### UC12 - Mượn - trả hồ sơ, bằng cấp bản gốc lưu kho
- **Tác nhân chính:** Nhân viên, Chuyên viên Hồ sơ
- **Mục đích / Mô tả:** Theo dõi việc mượn và hoàn trả hồ sơ bản gốc (sơ yếu lý lịch, bằng gốc phục vụ thanh tra, hồ sơ công đoàn) lưu trữ tại kho lưu trữ tập đoàn.
- **Điều kiện tiên quyết:** Có hồ sơ bản cứng được lưu giữ tại kho tài liệu.
- **Hậu điều kiện:** Phiếu mượn được lập; cập nhật vị trí vật lý và thời hạn thu hồi hồ sơ.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên hoặc cán bộ phụ trách tạo phiếu yêu cầu mượn hồ sơ gốc trên hệ thống, nêu rõ lý do và ngày hoàn trả dự kiến. | Gửi thông báo đến thủ kho hồ sơ nhân sự. |
| 2 | Chuyên viên hồ sơ kiểm tra vị trí lưu trữ (Hộp số, Ngăn số) và bàn giao hồ sơ. | Chuyển trạng thái phiếu mượn sang `BORROWED`. |
| 3 | Khi nhân viên hoàn trả, chuyên viên kiểm tra hiện trạng và bấm "Xác nhận đã trả". | Chuyển trạng thái sang `RETURNED`, lưu lịch sử mượn trả vào hồ sơ. |

#### UC13 - Đánh giá thử việc tại siêu thị & Ký HĐLĐ chính thức
- **Tác nhân chính:** Quản lý siêu thị (SM), Chuyên viên Hồ sơ, Ban Giám đốc
- **Mục đích / Mô tả:** Đánh giá kết quả sau 30 - 60 ngày thử việc tại siêu thị căn cứ vào thái độ phục vụ khách hàng, tính kỷ luật và doanh số bán hàng, làm căn cứ ký HĐLĐ chính thức.
- **Điều kiện tiên quyết:** Nhân viên sắp hết thời hạn thử việc (trước 7 ngày).
- **Hậu điều kiện:** HĐLĐ chính thức được ký kết hoặc ra thông báo không đạt yêu cầu thử việc.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Hệ thống tự động gửi thông báo nhắc việc đánh giá thử việc tới Quản lý siêu thị (SM). | Mở phiếu đánh giá thử việc trên ứng dụng: Tiêu chí thái độ phục vụ, tính trung thực, kỷ luật giờ giấc và năng lực bán hàng. |
| 2 | Quản lý siêu thị chấm điểm, ghi nhận xét và chọn kết luận: Đạt / Không đạt. | Nếu đạt: Đề xuất mức lương chính thức; chuyển hồ sơ lên Phòng C&B và Ban Giám đốc. |
| 3 | Giám đốc phê duyệt kết quả. | Hệ thống tự động khởi tạo dự thảo HĐLĐ chính thức thời hạn 12 tháng, gửi thông báo ký kết điện tử cho nhân viên. |

#### UC14 - Lộ trình hội nhập văn hóa "Tận tâm phục vụ khách hàng"
- **Tác nhân chính:** Nhân viên mới, Mentor siêu thị, Chuyên viên L&D
- **Mục đích / Mô tả:** Triển khai lộ trình hướng dẫn hội nhập 14 ngày cho nhân viên mới tại siêu thị: học văn hóa doanh nghiệp, nội quy bán lẻ, quy trình thu ngân và kèm cặp tại chỗ.
- **Điều kiện tiên quyết:** Nhân viên mới bắt đầu ngày làm việc đầu tiên.
- **Hậu điều kiện:** Hoàn thành 100% danh mục nhiệm vụ hội nhập; được cấp chứng chỉ hội nhập MWG.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mới đăng nhập app MWG, truy cập mục "Lộ trình hội nhập của tôi". | Hiển thị danh sách nhiệm vụ 14 ngày (Video văn hóa phục vụ, bài trắc nghiệm nội quy, thực hành chào đón khách, hướng dẫn trưng bày hàng hóa). |
| 2 | Nhân viên thực hiện từng nhiệm vụ hàng ngày và tích chọn hoàn thành. | Hệ thống ghi nhận tiến độ thực hiện theo tỷ lệ phần trăm (Progress Bar). |
| 3 | Mentor tại siêu thị kiểm tra thực tế và bấm "Xác nhận hoàn thành". | Cập nhật bản ghi `OnboardingAssignment`; ghi nhận điểm rèn luyện ban đầu của nhân viên. |

#### UC15 - Cổng tự phục vụ nhân viên di động (MWG Mobile App)
- **Tác nhân chính:** Toàn thể nhân viên MWG
- **Mục đích / Mô tả:** Cung cấp ứng dụng di động tất cả trong một (All-in-One Mobile App) giúp nhân viên thao tác nhanh: điểm danh GPS/FaceID, xem lịch ca tuần, xin đổi ca, nộp đơn nghỉ phép, xem phiếu lương và tin tức nội bộ.
- **Điều kiện tiên quyết:** Nhân viên đã đăng nhập thành công vào app trên thiết bị di động.
- **Hậu điều kiện:** Thực hiện các tác vụ cá nhân tức thời mà không cần thông qua giấy tờ trung gian.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở ứng dụng MWG App trên điện thoại thông minh. | Màn hình chính hiển thị: Nút điểm danh nhanh hôm nay, ca làm việc hiện tại, số ngày phép còn lại, số giờ OT tích lũy và lối tắt nộp đơn. |
| 2 | Nhân viên nhấp chọn chức năng cần thao tác (Xem lịch ca / Xem phiếu lương / Xin nghỉ phép). | Hệ thống truy xuất dữ liệu cá nhân theo quyền hạn và hiển thị giao diện tối ưu cho màn hình cảm ứng. |
| 3 | Thực hiện thao tác và nhận phản hồi trạng thái tức thời qua thông báo đẩy (Push Notification). | Dữ liệu được đồng bộ ngay lập tức về máy chủ trung tâm. |

#### UC16 - Quản lý thông tin cá nhân phân cấp 3 mức độ
- **Tác nhân chính:** Toàn thể nhân viên MWG
- **Mục đích / Mô tả:** Phân cấp dữ liệu hồ sơ cá nhân thành 3 mức bảo mật: Mức 1 (Tự sửa tự do: SĐT, địa chỉ thường trú, ảnh đại diện); Mức 2 (Sửa có thẩm định: Số CCCD, số tài khoản ngân hàng, thông tin giảm trừ gia cảnh người phụ thuộc); Mức 3 (Bất biến, chỉ HR sửa: Mã nhân viên, chức danh, mức lương, chuỗi công tác).
- **Điều kiện tiên quyết:** Nhân viên đăng nhập vào mục "Hồ sơ cá nhân" trên app.
- **Hậu điều kiện:** Dữ liệu Mức 1 có hiệu lực ngay; dữ liệu Mức 2 chuyển vào hàng đợi thẩm định; dữ liệu Mức 3 được bảo vệ an toàn.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở giao diện thông tin cá nhân `/profile`, chọn chỉnh sửa thông tin. | Hệ thống hiển thị các trường dữ liệu với màu sắc nhận diện rõ ràng 3 mức độ. |
| 2 | Nếu chỉnh sửa thông tin Mức 1 (SĐT, nơi ở hiện tại): Nhập thông tin mới và bấm "Lưu". | Hệ thống cập nhật ngay vào bảng `Employee` trong CSDL. |
| 3 | Nếu chỉnh sửa thông tin Mức 2 (Đổi số tài khoản ngân hàng nhận lương, bổ sung người phụ thuộc): Nhập dữ liệu mới và bắt buộc tải ảnh chụp minh chứng (ảnh mặt trước thẻ ngân hàng, giấy khai sinh con). | Hệ thống tạo bản ghi `ProfileChangeRequest` ở trạng thái `PENDING` và gửi về Phòng C&B thẩm định. |

#### UC17 - Thẩm định & Phê duyệt đề xuất đổi thông tin định danh
- **Tác nhân chính:** Chuyên viên Hồ sơ, Chuyên viên C&B
- **Mục đích / Mô tả:** Rà soát các yêu cầu thay đổi thông tin định danh pháp lý và tài chính (Mức 2) của nhân viên kèm đối chiếu ảnh chụp chứng từ thực tế.
- **Điều kiện tiên quyết:** Có yêu cầu điều chỉnh thông tin đang chờ duyệt.
- **Hậu điều kiện:** Thông tin mới được cập nhật vào hồ sơ gốc hoặc bị từ chối kèm lý do rõ ràng.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên nhân sự truy cập hàng đợi yêu cầu điều chỉnh thông tin cá nhân. | Hiển thị danh sách yêu cầu: So sánh trường dữ liệu cũ và mới, kèm hình ảnh minh chứng đính kèm. |
| 2 | Kiểm tra tính sắc nét, hợp lệ của chứng từ đối chiếu với thông tin mới khai báo. | Nếu hợp lệ: Bấm "Phê duyệt"; nếu không hợp lệ: Bấm "Từ chối" và nhập lý do (ảnh mờ, sai số tài khoản). |
| 3 | - | Nếu duyệt: Hệ thống cập nhật vào bảng dữ liệu chính thức; gửi thông báo kết quả tức thời đến điện thoại của nhân viên. |

#### UC18 - Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca
- **Tác nhân chính:** Toàn thể nhân viên MWG
- **Mục đích / Mô tả:** Ghi nhận chính xác mốc thời gian bắt đầu và kết thúc ca làm việc của người lao động trên toàn hệ thống.
- **Điều kiện tiên quyết:** Nhân viên có lịch phân ca hợp lệ trong ngày.
- **Hậu điều kiện:** Tạo bản ghi sự kiện chấm công `AttendanceEvent` có tính bất biến (chỉ ghi thêm).

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Khi đến siêu thị/kho, nhân viên thực hiện thao tác điểm danh trên app hoặc máy chấm công. | Hệ thống ghi nhận thời điểm chính xác theo đồng hồ máy chủ (Server Timestamp). |
| 2 | - | Hệ thống kiểm tra tính hợp lệ của phương thức xác thực (GPS, FaceID, Wifi hoặc Vân tay). |
| 3 | - | Lưu bản ghi sự kiện vào bảng `AttendanceEvent` gồm: Mã NV, Mã siêu thị, Thời điểm, Loại sự kiện (CHECK_IN / CHECK_OUT), Phương thức xác thực, Địa chỉ IP/BSSID. |

#### UC19 - Điểm danh di động GPS Geofencing & FaceID nhận diện
- **Tác nhân chính:** Nhân viên siêu thị, Ứng dụng di động MWG App
- **Mục đích / Mô tả:** Phương thức điểm danh chủ lực tại hơn 4.000 siêu thị: kết hợp định vị vệ tinh GPS trong bán kính cho phép của cửa hàng (Geofencing 50m), xác thực Wifi cửa hàng và quét khuôn mặt FaceID chống gian lận.
- **Điều kiện tiên quyết:** Thiết bị bật định vị GPS, camera và kết nối mạng Wifi của siêu thị.
- **Hậu điều kiện:** Điểm danh thành công nếu thỏa mãn đồng thời các điều kiện an toàn; ngăn chặn hoàn toàn việc chấm công hộ.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở chức năng "Điểm danh ca làm việc" trên app MWG khi đứng tại siêu thị. | Ứng dụng lấy tọa độ GPS hiện tại của điện thoại và mã BSSID của mạng Wifi đang kết nối. |
| 2 | Hệ thống kiểm tra khoảng cách: Tính khoảng cách giữa vị trí GPS của điện thoại với tọa độ đã cấu hình của siêu thị. | Nếu khoảng cách > 50m hoặc không khớp Wifi siêu thị: Báo lỗi "Bạn đang ở ngoài phạm vi siêu thị" và chặn điểm danh. |
| 3 | Nếu vị trí hợp lệ: Ứng dụng kích hoạt camera trước, yêu cầu nhân viên nhìn thẳng vào màn hình để quét khuôn mặt. | Thuật toán trích xuất vector đặc trưng khuôn mặt (Face Embedding), so sánh với mẫu gốc đã đăng ký; kiểm tra chuyển động sống (chống dùng ảnh chụp tĩnh). |
| 4 | - | Nếu khớp: Thông báo "Điểm danh thành công lúc HH:mm:ss"; lưu bản ghi sự kiện công hợp lệ. |

#### UC20 - Quản trị kết nối thiết bị máy chấm công Tổng kho DC
- **Tác nhân chính:** Chuyên viên Hồ sơ, Quản trị IT
- **Mục đích / Mô tả:** Quản lý danh mục các thiết bị máy chấm công vân tay/thẻ từ tại các Tổng kho phân phối (DC) lớn, giám sát kết nối mạng và đồng bộ dữ liệu quẹt thẻ tự động về máy chủ.
- **Điều kiện tiên quyết:** Thiết bị chấm công được kết nối mạng nội bộ LAN/WAN.
- **Hậu điều kiện:** Trạng thái kết nối được giám sát; dữ liệu sự kiện quẹt thẻ được tải về tự động mỗi 5 phút.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản trị viên truy cập `/admin/attendance`, xem danh sách các máy chấm công tại các tổng kho DC. | Hiển thị địa chỉ IP, cổng kết nối, vị trí lắp đặt và trạng thái trực tuyến (ONLINE / OFFLINE). |
| 2 | Thực hiện thêm mới thiết bị, cấu hình chu kỳ đồng bộ dữ liệu hoặc đồng bộ lại thủ công khi có sự cố mất mạng. | Hệ thống gửi lệnh kết nối qua giao thức SDK chuyên dụng của thiết bị. |
| 3 | - | Tự động đọc các bản ghi quẹt thẻ mới từ bộ nhớ máy chấm công, chuyển đổi thành các bản ghi `AttendanceEvent` trong CSDL trung tâm. |

#### UC21 - Đăng ký & Xét duyệt nghỉ phép trực tuyến qua app
- **Tác nhân chính:** Nhân viên bán lẻ, Quản lý siêu thị (SM), Quản lý khu vực (AM)
- **Mục đích / Mô tả:** Quy trình nhân viên nộp đơn xin nghỉ phép trên ứng dụng di động, hệ thống tự động kiểm tra số dư quỹ phép và chuyển cấp quản lý phê duyệt trực tuyến.
- **Điều kiện tiên quyết:** Nhân viên còn đủ số dư ngày phép năm hoặc đủ điều kiện nghỉ theo chế độ.
- **Hậu điều kiện:** Đơn nghỉ phép được duyệt; hệ thống tự động trừ quỹ phép năm và ghi nhận vào bảng chấm công tháng.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở app, vào mục "Nghỉ phép", chọn loại phép (Phép năm, Nghỉ ốm đau, Việc riêng có lương, Nghỉ không lương), chọn ngày bắt đầu, ngày kết thúc và nhập lý do. | Hệ thống hiển thị số ngày phép còn lại; tự động tính toán số ngày nghỉ thực tế (loại trừ ngày nghỉ tuần theo lịch ca). |
| 2 | Bấm "Gửi đơn nghỉ phép". | Hệ thống kiểm tra số dư: nếu số ngày nghỉ > số phép còn tồn thì cảnh báo; gửi đơn đến Quản lý siêu thị (SM). |
| 3 | Quản lý siêu thị (SM) mở app duyệt đơn: Nếu nghỉ từ 1 - 2 ngày, SM bấm "Chấp thuận"; nếu nghỉ từ 3 ngày trở lên, hệ thống tự động chuyển tiếp Quản lý khu vực (AM) duyệt. | Cập nhật trạng thái đơn sang `APPROVED`; tự động trừ số dư trong bảng `LeaveBalance`; đánh dấu ngày nghỉ phép lên bảng công tháng. |

#### UC22 - Đăng ký & Phê duyệt làm thêm giờ (OT) mùa cao điểm
- **Tác nhân chính:** Nhân viên, Quản lý siêu thị (SM), Chuyên viên C&B
- **Mục đích / Mô tả:** Quản lý việc đăng ký và phê duyệt làm thêm ngoài giờ trong các chiến dịch khuyến mãi, kiểm kê hàng hóa định kỳ hoặc phục vụ cao điểm Tết, kiểm soát chặt chẽ trần giờ làm thêm theo luật định.
- **Điều kiện tiên quyết:** Có kế hoạch làm thêm giờ được phê duyệt tại siêu thị.
- **Hậu điều kiện:** Bản ghi làm thêm giờ được xác nhận; tính thù lao OT theo đúng hệ số lương quy định (150%, 200%, 300%).

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản lý siêu thị hoặc nhân viên tạo "Đơn đăng ký làm thêm giờ": Chọn ngày, khung giờ OT, lý do kỹ thuật (kiểm kê kho, khuyến mãi lớn). | Hệ thống tự động truy vấn số giờ làm thêm lũy kế của nhân viên trong tháng và trong năm hiện tại. |
| 2 | - | Kiểm tra ràng buộc pháp lý theo Điều 107 BLLĐ 2019: Nếu tổng giờ OT tháng vượt quá 40 giờ hoặc năm vượt 200 giờ, hệ thống cảnh báo đỏ và khóa không cho gửi đơn. |
| 3 | Quản lý siêu thị bấm phê duyệt. | Sau khi kết thúc ca, nhân viên điểm danh ra ca; hệ thống đối soát số giờ OT thực tế so với đơn đăng ký và ghi nhận vào bảng tính lương. |

#### UC23 - Lập lịch và phân ca xoay tại siêu thị (Store Scheduling)
- **Tác nhân chính:** Quản lý siêu thị (Store Manager - SM)
- **Mục đích / Mô tả:** Quản lý siêu thị xếp lịch ca làm việc hàng tuần cho toàn bộ nhân viên trong siêu thị (Ca sáng, Ca chiều, Ca tối, Ca gãy), tối ưu hóa nhân sự theo giờ cao điểm.
- **Điều kiện tiên quyết:** Quản lý siêu thị có quyền quản lý điểm bán.
- **Hậu điều kiện:** Lịch ca tuần được lưu trữ và gửi thông báo lịch làm việc đến từng nhân viên qua ứng dụng di động.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản lý siêu thị truy cập giao diện `/shifts` trên Web hoặc app quản lý, chọn tuần cần xếp lịch. | Hiển thị bảng ma trận nhân sự - ngày trong tuần của siêu thị. |
| 2 | Gán ca làm việc cho từng nhân viên (Ca 1: 7h30-15h30, Ca 2: 14h30-22h00, Ca gãy, hoặc Nghỉ tuần OFF). | Hệ thống tự động kiểm tra: Đảm bảo khoảng nghỉ tối thiểu giữa 2 ca liên tiếp >= 12 giờ; đảm bảo mỗi nhân viên có ít nhất 1 ngày nghỉ trọn vẹn trong tuần. |
| 3 | Bấm "Công bố lịch ca tuần". | Hệ thống lưu bảng phân ca; gửi thông báo lịch làm việc mới đến ứng dụng di động của toàn thể nhân viên trong siêu thị. |

#### UC24 - Giải trình bổ sung giờ công & Xử lý lệch công tại điểm bán
- **Tác nhân chính:** Nhân viên bán lẻ, Quản lý siêu thị, Chuyên viên C&B
- **Mục đích / Mô tả:** Cho phép nhân viên gửi đơn giải trình khi quên điểm danh, đi giao hàng lắp đặt bên ngoài siêu thị hoặc gặp sự cố kỹ thuật để Quản lý siêu thị rà soát và điều chỉnh công.
- **Điều kiện tiên quyết:** Bảng công ghi nhận bản ghi thiếu giờ vào/ra hoặc đi muộn.
- **Hậu điều kiện:** Dữ liệu công được điều chỉnh về trạng thái hợp lệ, lưu vết kiểm toán đầy đủ lý do và người phê duyệt.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở bảng công cá nhân trên app, nhấp vào ngày công bị cảnh báo thiếu lượt để tạo "Đơn giải trình công". | Hiển thị form: Chọn lý do (Giao hàng tận nhà khách, lỗi mạng Wifi cửa hàng, quên điểm danh), nhập giờ vào/ra thực tế và đính kèm ảnh minh chứng. |
| 2 | Bấm "Gửi giải trình". | Gửi đơn đến Quản lý siêu thị (SM). |
| 3 | Quản lý siêu thị đối soát camera hoặc phiếu giao hàng thực tế, bấm "Chấp thuận". | Hệ thống cập nhật lại ngày công trong bảng tổng hợp `AttendanceDay`; lưu vết người duyệt và lý do vào lịch sử kiểm toán. |

#### UC25 - Tổng hợp & Chốt bảng chấm công tháng toàn hệ thống
- **Tác nhân chính:** Chuyên viên C&B, Quản lý siêu thị
- **Mục đích / Mô tả:** Khóa sổ dữ liệu chấm công định kỳ ngày 25 hàng tháng cho hơn 65.000 nhân viên, xử lý dứt điểm các sai lệch công để chuyển dữ liệu sang phân hệ tính lương.
- **Điều kiện tiên quyết:** Đến kỳ chốt công tháng quy định.
- **Hậu điều kiện:** Toàn bộ bảng công tháng chuyển sang trạng thái `LOCKED`, chuyển giao số liệu sang bộ máy tính lương.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên C&B chọn kỳ công (Tháng/Năm), bấm "Khóa tiếp nhận đơn từ giải trình công". | Hệ thống chặn nhân viên gửi thêm đơn giải trình hoặc đơn nghỉ phép cho kỳ công đã khóa. |
| 2 | Hệ thống chạy batch job tổng hợp dữ liệu toàn quốc: | Tự động tính toán: Tổng ngày công chuẩn, công thực tế, ngày nghỉ phép hưởng lương, nghỉ không lương, số giờ làm ca đêm và số giờ OT theo từng hệ số cho từng nhân viên. |
| 3 | Chuyên viên rà soát các cảnh báo bất thường còn tồn đọng và phối hợp với Quản lý khu vực xử lý dứt điểm. | Hiển thị bảng tổng hợp ngày công toàn Tập đoàn theo từng chuỗi và từng siêu thị. |
| 4 | Bấm "Chốt bảng công tháng". | Chuyển trạng thái bảng công sang `FINALIZED`, gửi tín hiệu sẵn sàng sang phân hệ tính lương. |

#### UC26 - Cấu hình công thức lương 3P & Hoa hồng doanh số bán lẻ
- **Tác nhân chính:** Chuyên viên C&B Tập đoàn
- **Mục đích / Mô tả:** Thiết lập các thành phần lương (lương cơ bản vị trí, phụ cấp ca kíp, thâm niên), mức đóng bảo hiểm, mức giảm trừ gia cảnh thuế TNCN và các bảng tỷ lệ hoa hồng doanh số (Incentive) theo từng ngành hàng (điện thoại, gia dụng, thực phẩm).
- **Điều kiện tiên quyết:** Có quyền quản trị phân hệ tiền lương C&B.
- **Hậu điều kiện:** Quy tắc và công thức tính lương mới được lưu trữ có gắn ngày bắt đầu hiệu lực.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập `/payroll-engine`, chọn "Cấu hình thành phần lương & Hoa hồng". | Hiển thị danh mục phụ cấp, công thức tính thưởng Target siêu thị và bảng hoa hồng sản phẩm. |
| 2 | Cập nhật các tham số pháp lý: Mức giảm trừ gia cảnh bản thân (11 triệu/tháng) và người phụ thuộc (4.4 triệu/người/tháng); tỷ lệ trích nộp BHXH (8%), BHYT (1.5%), BHTN (1%); công thức thưởng CSAT. | Kiểm tra tính hợp lệ về mặt toán học và pháp lý của công thức. |
| 3 | Bấm "Lưu cấu hình phiên bản mới". | Lưu cấu hình lương mới vào CSDL kèm ngày bắt đầu áp dụng; lưu vết lịch sử thay đổi tham số. |

#### UC27 - Vận hành chức năng tính lương tự động cho hơn 65.000 nhân sự
- **Tác nhân chính:** Chuyên viên C&B Tập đoàn
- **Mục đích / Mô tả:** Khởi chạy tiến trình tính toán tiền lương tự động theo lô lớn (Mass Batch Processing) cho toàn bộ hơn 65.000 cán bộ nhân viên MWG dựa trên bảng công đã chốt, dữ liệu doanh số siêu thị từ ERP và các tham số thuế/bảo hiểm.
- **Điều kiện tiên quyết:** Bảng chấm công kỳ này đã được chốt (`FINALIZED`) và dữ liệu doanh số ERP đã đồng bộ.
- **Hậu điều kiện:** Bảng thanh toán lương tổng thể và phiếu lương chi tiết của toàn bộ nhân viên được sinh tự động ở trạng thái `DRAFT`.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên C&B truy cập `/payroll-engine`, chọn chu kỳ lương (Tháng/Năm) và bấm "Khởi chạy tính toán tiền lương tự động". | Hệ thống hiển thị thanh tiến trình xử lý theo lô phân tán theo từng chuỗi bán lẻ. |
| 2 | - | Hệ thống thực thi song song các phép tính toán cho từng nhân viên: <br>1. Lương thời gian = (Lương cơ bản / Ngày công chuẩn) * Ngày công thực tế; <br>2. Tiền làm thêm giờ (OT) và phụ cấp làm việc ban đêm; <br>3. Thưởng doanh số siêu thị (Store Target) và hoa hồng sản phẩm cá nhân; <br>4. Thưởng/phạt chỉ số phục vụ khách hàng (CSAT); <br>5. Trừ các khoản trích nộp bảo hiểm bắt buộc (10.5%); <br>6. Tính thuế TNCN theo biểu lũy tiến từng phần 7 bậc sau khi giảm trừ gia cảnh; <br>7. Tự động khấu trừ nợ tạm ứng, vay phúc lợi (đảm bảo tổng trừ <= 30% lương Net theo Điều 102 BLLĐ 2019). |
| 3 | - | Tự động sinh bảng tổng hợp tiền lương và hơn 65.000 phiếu lương chi tiết (`SalarySlip`). Hiển thị danh sách cảnh báo các trường hợp lương âm hoặc biến động đột biến để HR kiểm tra. |

#### UC28 - Phê duyệt & Khóa bất biến kỳ lương (Locked Payroll)
- **Tác nhân chính:** Chuyên viên C&B, Tổng Giám đốc Tập đoàn
- **Mục đích / Mô tả:** Trình ký báo cáo tổng quỹ lương lên Ban Tổng Giám đốc phê duyệt điện tử và thực hiện khóa sổ kỳ lương bất biến, kết xuất file ủy nhiệm chi gửi ngân hàng liên kết.
- **Điều kiện tiên quyết:** Bảng lương toàn công ty đã được tính toán hoàn chỉnh ở trạng thái `DRAFT`.
- **Hậu điều kiện:** Kỳ lương chuyển sang trạng thái `LOCKED` bất biến; kích hoạt chặn mọi hành vi chỉnh sửa số liệu; phát hành phiếu lương bảo mật tới app nhân viên.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên C&B rà soát báo cáo quỹ lương toàn quốc, bấm "Trình ký Ban Tổng Giám đốc". | Đóng gói báo cáo phân tích quỹ lương theo từng chuỗi, gửi thông báo phê duyệt tới Tổng Giám đốc. |
| 2 | Tổng Giám đốc đăng nhập, kiểm tra các chỉ số tài chính tổng hợp và ký duyệt điện tử. | Cập nhật trạng thái bảng lương thành `APPROVED`. |
| 3 | Chuyên viên C&B bấm "Khóa kỳ lương bất biến". | Chuyển trạng thái kỳ lương sang `LOCKED`; kích hoạt cơ chế chặn toàn bộ thao tác tính lại hoặc sửa đổi (HTTP 409 Conflict); tự động xuất file thanh toán chi lương định dạng ngân hàng; phát hành phiếu lương điện tử tới app của từng nhân viên. |

#### UC29 - Quản lý tạm ứng lương & Khoản vay quỹ phúc lợi MWG
- **Tác nhân chính:** Nhân viên, Quản lý siêu thị, Giám đốc, Kế toán
- **Mục đích / Mô tả:** Quy trình nhân viên nộp đơn vay vốn ưu đãi từ Quỹ phúc lợi MWG hoặc tạm ứng lương; hệ thống tự động thẩm định hạn mức hoàn nợ hàng tháng không vượt quá 30% lương thực lĩnh.
- **Điều kiện tiên quyết:** Nhân viên chính thức có thâm niên công tác từ 12 tháng trở lên.
- **Hậu điều kiện:** Khoản vay được phê duyệt và giải ngân; lịch hoàn nợ tự động tích hợp vào các kỳ lương kế tiếp.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở app vào mục "Phúc lợi & Khoản vay", nhập số tiền muốn vay, lý do và chọn kỳ hạn trả góp (3 - 12 tháng). | Hệ thống mô phỏng lịch trả nợ, tự động kiểm tra số tiền khấu trừ hàng tháng đảm bảo không vượt quá 30% mức lương thực lĩnh bình quân. |
| 2 | Bấm "Gửi đơn vay". | Gửi đơn đến Quản lý siêu thị xác nhận hạnh kiểm và chuyển tiếp Ban Quản lý Quỹ phúc lợi thẩm định. |
| 3 | Giám đốc phê duyệt hợp đồng vay vốn. | Hệ thống kích hoạt lệnh giải ngân sang Kế toán; tự động đưa các kỳ trả nợ vào danh sách khấu trừ của bảng tính lương các tháng tiếp theo. |

#### UC30 - Quản lý đề xuất công tác thị trường & Quyết toán chi phí
- **Tác nhân chính:** Quản lý khu vực (AM), Cán bộ thanh tra, Kế toán
- **Mục đích / Mô tả:** Lập kế hoạch đi công tác kiểm tra mạng lưới siêu thị, tạm ứng công tác phí và kê khai hóa đơn điện tử quyết toán chi phí sau chuyến đi.
- **Điều kiện tiên quyết:** Phát sinh nhu cầu đi công tác phục vụ hoạt động vận hành chuỗi.
- **Hậu điều kiện:** Chi phí công tác được quyết toán minh bạch; hoàn ứng hoặc chi trả bổ sung cho cán bộ công tác.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Cán bộ quản lý vào `/expense-claims`, tạo "Đề xuất công tác": Nhập tuyến siêu thị kiểm tra, thời gian, dự toán chi phí di chuyển, lưu trú. | Gửi đề xuất tới Giám đốc Chuỗi phê duyệt và Kế toán tạm ứng. |
| 2 | Sau chuyến đi, cán bộ tải lên các hóa đơn điện tử hợp lệ (vé máy bay, khách sạn, xăng xe) để đề nghị quyết toán. | Kế toán kiểm tra đối soát tính hợp lệ của hóa đơn theo quy chuẩn thuế. |
| 3 | Kế toán bấm "Phê duyệt quyết toán". | Hệ thống đối trừ với số tiền tạm ứng, xuất lệnh chi trả phần chênh lệch cho người đi công tác. |

#### UC31 - Quản lý cấp phát & Thu hồi đồng phục, công cụ bán hàng
- **Tác nhân chính:** Nhân viên Hành chính, Nhân viên siêu thị
- **Mục đích / Mô tả:** Theo dõi vòng đời cấp phát và thu hồi đồng phục, bảng tên, thiết bị bán hàng (máy quét mã vạch, máy POS cầm tay, máy in hóa đơn, két tiền) tại các siêu thị.
- **Điều kiện tiên quyết:** Tài sản đã được mã hóa bằng mã vạch/Serial trong kho hành chính.
- **Hậu điều kiện:** Biên bản bàn giao điện tử được xác nhận; tài sản gắn liền với trách nhiệm của nhân viên hoặc siêu thị.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên hành chính vào `/assets`, chọn tài sản/đồng phục trong kho và chọn nhân viên hoặc siêu thị tiếp nhận. | Hiển thị thông số kỹ thuật, số lượng và tình trạng thiết bị. |
| 2 | Bấm "Tạo biên bản cấp phát điện tử". | Gửi thông báo xác nhận tới tài khoản ứng dụng di động của nhân viên kèm cam kết bảo quản tài sản. |
| 3 | Nhân viên kiểm tra thực tế tại siêu thị và bấm "Xác nhận nhận tài sản". | Cập nhật trạng thái tài sản sang `ASSIGNED`; gắn mã tài sản vào hồ sơ nhân viên phục vụ kiểm kê và thu hồi khi thôi việc. |

#### UC32 - Đề xuất & Phê duyệt điều chuyển nhân sự giữa các siêu thị
- **Tác nhân chính:** Quản lý khu vực (AM), Giám đốc Chuỗi, Chuyên viên Hồ sơ
- **Mục đích / Mô tả:** Thực hiện quy trình điều chuyển nhân sự giữa các siêu thị trong cùng khu vực hoặc điều chuyển liên chuỗi (ví dụ: từ Thế Giới Di Động sang Điện Máy Xanh hoặc Bách Hóa Xanh).
- **Điều kiện tiên quyết:** Nhân viên đang làm việc chính thức tại một siêu thị.
- **Hậu điều kiện:** Đơn vị siêu thị mới được cập nhật; tự động chuyển đổi quyền điểm danh GPS và phân ca sang siêu thị mới.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản lý khu vực (AM) tạo phiếu đề xuất điều chuyển nhân sự trên hệ thống: Chọn nhân viên, siêu thị chuyển đi, siêu thị tiếp nhận và ngày bắt đầu hiệu lực. | Hệ thống chuyển phiếu lấy ý kiến xác nhận của Quản lý siêu thị tiếp nhận. |
| 2 | Quản lý siêu thị mới bấm "Đồng ý tiếp nhận". | Chuyển hồ sơ lên Giám đốc Chuỗi phê duyệt. |
| 3 | Giám đốc Chuỗi ký duyệt quyết định điều chuyển. | Cập nhật mã `storeId` của nhân viên; tự động cập nhật lại tọa độ GPS siêu thị mới trên app để nhân viên điểm danh từ ngày hiệu lực. |

#### UC33 - Đề xuất & Phê duyệt điều chỉnh bậc lương theo tay nghề
- **Tác nhân chính:** Quản lý siêu thị (SM), Chuyên viên C&B, Giám đốc
- **Mục đích / Mô tả:** Rà soát và nâng bậc lương định kỳ cho nhân viên căn cứ vào thâm niên, kết quả sát hạch nghiệp vụ và năng suất bán hàng tại siêu thị.
- **Điều kiện tiên quyết:** Nhân viên đạt kết quả xuất sắc trong kỳ sát hạch tay nghề hoặc đến hạn rà soát lương định kỳ.
- **Hậu điều kiện:** Mức lương bậc mới được cập nhật vào phụ lục hợp đồng, có hiệu lực từ chu kỳ lương kế tiếp.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản lý siêu thị lập đề xuất nâng bậc lương cho nhân viên: Chọn bậc mới đề xuất, kèm kết quả đóng góp và điểm thi tay nghề. | Hệ thống đối chiếu mức lương mới với khung ngạch bậc lương của chức danh đó. |
| 2 | Chuyên viên C&B thẩm định quỹ lương và trình Ban Giám đốc phê duyệt. | Hiển thị tỷ lệ tăng lương và tác động tới quỹ lương siêu thị. |
| 3 | Giám đốc phê duyệt quyết định nâng bậc. | Tự động tạo phụ lục HĐLĐ mới; cập nhật mức lương mới vào hồ sơ và áp dụng cho kỳ tính lương tháng sau. |

#### UC34 - Đề xuất & Phê duyệt khen thưởng nhân sự bán lẻ xuất sắc
- **Tác nhân chính:** Quản lý siêu thị (SM), Quản lý khu vực (AM), Giám đốc
- **Mục đích / Mô tả:** Khen thưởng đột xuất cho cá nhân hoặc tập thể siêu thị có thành tích xuất sắc (đạt kỷ lục doanh số, được khách hàng gửi thư khen ngợi tinh thần tận tâm phục vụ, dũng cảm bắt kẻ gian bảo vệ tài sản).
- **Điều kiện tiên quyết:** Có thành tích nổi bật được ghi nhận tại điểm bán.
- **Hậu điều kiện:** Quyết định khen thưởng được ban hành; tiền thưởng tự động tích hợp vào kỳ lương kế tiếp; vinh danh trên bảng tin nội bộ app.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Người quản lý lập phiếu đề xuất khen thưởng: Chọn cá nhân/siêu thị, hình thức (bằng khen, tiền mặt, cổ phiếu thưởng ESOP) và số tiền thưởng. | Gửi phiếu tới Hội đồng Thi đua khen thưởng và Giám đốc. |
| 2 | Giám đốc ký duyệt quyết định khen thưởng. | Tự động phát thông báo vinh danh trên bảng tin ứng dụng MWG App toàn quốc. |
| 3 | - | Hệ thống tự động đồng bộ số tiền thưởng vào bảng tính lương tháng gần nhất của người được khen thưởng. |

#### UC35 - Xử lý kỷ luật lao động & Vi phạm nội quy siêu thị
- **Tác nhân chính:** Quản lý siêu thị, Đại diện Công đoàn, Ban Giám đốc
- **Mục đích / Mô tả:** Quy trình lập biên bản vi phạm nội quy bán lẻ (gian lận hàng hóa, thu tiền không xuất hóa đơn, thái độ tiêu cực với khách hàng, tự ý bỏ ca), tổ chức họp xử lý kỷ luật có Công đoàn tham gia và ban hành quyết định đúng luật.
- **Điều kiện tiên quyết:** Phát sinh hành vi vi phạm nội quy lao động của công ty.
- **Hậu điều kiện:** Quyết định kỷ luật được ban hành; lưu vào hồ sơ nhân sự; ảnh hưởng tới việc xét tăng lương và thưởng cuối năm.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản lý siêu thị lập biên bản vi phạm trên hệ thống, đính kèm chứng cứ (hình ảnh camera, biên bản kiểm quỹ, phản ánh của khách hàng). | Gửi thông báo triệu tập họp xử lý kỷ luật trước ít nhất 5 ngày làm việc theo Điều 122 BLLĐ 2019 tới các bên liên quan. |
| 2 | Tổ chức cuộc họp kỷ luật bắt buộc có sự tham gia của Người lao động và Đại diện Công đoàn; thư ký nhập biên bản họp và kết luận hình thức xử lý (Khiển trách, Kéo dài thời hạn nâng lương, Cách chức, Sa thải). | Trình quyết định kỷ luật lên Giám đốc Nhân sự / Tổng Giám đốc. |
| 3 | Giám đốc ký ban hành quyết định kỷ luật. | Lưu quyết định vào hồ sơ nhân sự; tự động khóa quyền thăng cấp và đóng băng nâng bậc lương trong thời hạn thi hành kỷ luật. |

#### UC36 - Quy trình bàn giao thôi việc 4 khâu cấp tốc tại siêu thị
- **Tác nhân chính:** Nhân viên thôi việc, Quản lý siêu thị (SM), Các bộ phận liên quan
- **Mục đích / Mô tả:** Quy trình tiếp nhận đơn xin thôi việc, tự động sinh danh mục bàn giao 4 khâu (Siêu thị, CNTT, C&B, Kế toán) và đóng tài khoản đúng 23:59:59 của ngày làm việc cuối cùng.
- **Điều kiện tiên quyết:** Nhân viên nộp đơn xin thôi việc tuân thủ thời hạn báo trước theo luật định (30 ngày đối với HĐ xác định thời hạn, 45 ngày đối với HĐ không xác định thời hạn).
- **Hậu điều kiện:** Hoàn tất bàn giao tài sản siêu thị và trách nhiệm quỹ; ban hành quyết định chấm dứt HĐLĐ; khóa tài khoản truy cập hệ thống.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên nộp đơn xin thôi việc qua ứng dụng di động MWG App, nêu rõ lý do và ngày mong muốn nghỉ việc. | Hệ thống kiểm tra thời hạn báo trước theo loại hợp đồng hiện hành. |
| 2 | Quản lý siêu thị (SM) và Giám đốc phê duyệt đơn thôi việc. | Hệ thống tự động khởi tạo ma trận Checklist bàn giao 4 khâu: <br>1. *Siêu thị:* Bàn giao két tiền, đối soát tồn kho, trả chìa khóa cửa hàng, nộp lại đồng phục và thẻ nhân viên cho Quản lý siêu thị; <br>2. *CNTT:* Thu hồi tài khoản ứng dụng MWG App, thu hồi quyền truy cập hệ thống ERP bán lẻ; <br>3. *C&B:* Chốt ngày công tháng cuối, tính tiền phép năm chưa nghỉ, báo giảm BHXH; <br>4. *Kế toán:* Quyết toán nợ tạm ứng, các khoản vay quỹ phúc lợi và khấu trừ trực tiếp vào kỳ lương cuối. |
| 3 | Đại diện từng khâu đăng nhập hệ thống để bấm xác nhận hoàn tất nội dung phụ trách. | Khi đủ 4/4 khâu xác nhận hoàn tất, hệ thống cho phép phát hành Quyết định chấm dứt hợp đồng lao động. |
| 4 | Vào 23:59:59 của ngày làm việc cuối cùng. | Hệ thống tự động vô hiệu hóa tài khoản (`User.isActive = false`), chuyển trạng thái nhân viên sang `TERMINATED` và lưu vết vào nhật ký kiểm toán Audit Log. |

#### UC37 - Đánh giá năng lực phục vụ khách hàng (CSAT) & Thăng cấp SM
- **Tác nhân chính:** Nhân viên bán lẻ, Quản lý siêu thị, Khối Đào tạo L&D
- **Mục đích / Mô tả:** Thu thập điểm đánh giá chất lượng phục vụ khách hàng (CSAT/NPS) sau mỗi đơn hàng từ hệ thống bán lẻ, làm căn cứ xét thưởng và lọc ứng viên tham gia Kỳ thi thăng cấp Quản lý siêu thị (Store Manager).
- **Điều kiện tiên quyết:** Đến chu kỳ đánh giá hiệu suất định kỳ hoặc kỳ thi thăng cấp.
- **Hậu điều kiện:** Điểm số được chốt, công nhận ứng viên đủ điều kiện bổ nhiệm Quản lý siêu thị mới.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Hệ thống tự động tổng hợp điểm đánh giá CSAT của khách hàng từ các giao dịch bán hàng tại siêu thị và điểm đánh giá của Quản lý siêu thị. | Tính điểm chỉ số phục vụ trung bình (thang điểm 100) của từng nhân viên. |
| 2 | Nhân viên tự đánh giá kết quả công việc trên app và xem điểm tích lũy của mình. | Hiển thị thứ hạng thi đua trong siêu thị và toàn khu vực. |
| 3 | Đến kỳ thi thăng cấp: Hệ thống tự động kích hoạt bài thi sát hạch năng lực quản lý cho các nhân sự đủ điều kiện; tổng hợp kết quả phỏng vấn của Ban Giám đốc. | Bổ nhiệm các ứng viên xuất sắc lên vị trí Quản lý siêu thị (SM); tự động chuyển đổi vai trò phân quyền trên hệ thống. |

#### UC38 - Quản trị chương trình đào tạo nghiệp vụ & E-Learning
- **Tác nhân chính:** Chuyên viên Đào tạo L&D, Nhân viên bán lẻ
- **Mục đích / Mô tả:** Phát hành các khóa học trực tuyến về kiến thức sản phẩm công nghệ mới, quy trình trưng bày Bách Hóa Xanh, kỹ năng tư vấn khách hàng; theo dõi tiến độ và cấp chứng chỉ hoàn thành trên app.
- **Điều kiện tiên quyết:** Khóa học được phê duyệt nội dung trên hệ thống e-learning.
- **Hậu điều kiện:** Nhân viên hoàn thành khóa học và đạt điểm bài kiểm tra trắc nghiệm; chứng chỉ được lưu vào hồ sơ nhân sự.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên đào tạo tạo khóa học mới: Tải lên video bài giảng, tài liệu PDF, câu hỏi trắc nghiệm và gán đối tượng học (toàn thể nhân viên tư vấn chuỗi Điện Máy Xanh). | Hệ thống phát thông báo khóa học mới đến ứng dụng di động của nhóm nhân sự mục tiêu. |
| 2 | Nhân viên mở app, học bài giảng video và làm bài kiểm tra trắc nghiệm cuối khóa. | Hệ thống tự động chấm điểm bài thi; yêu cầu làm lại nếu điểm dưới 80/100. |
| 3 | Khi đạt yêu cầu: Hệ thống tự động cấp chứng chỉ số hóa (Digital Certificate). | Cập nhật bản ghi `TrainingEnrollment` và lưu chứng chỉ vào hồ sơ đào tạo của nhân viên. |

#### UC39 - Tiếp nhận & Giải quyết khiếu nại lao động bảo mật
- **Tác nhân chính:** Toàn thể nhân viên, Ban Chấp hành Công đoàn, Khối Nhân sự
- **Mục đích / Mô tả:** Cung cấp kênh gửi phản ánh, khiếu nại hoặc tố cáo các hành vi tiêu cực (chèn ép, gian lận, quấy rối) một cách hoàn toàn bảo mật và mã hóa danh tính người gửi.
- **Điều kiện tiên quyết:** Nhân viên đăng nhập vào mục "Hòm thư góp ý bảo mật" trên app.
- **Hậu điều kiện:** Khiếu nại được tiếp nhận, chuyển đến đúng thẩm quyền xử lý và có phản hồi kết quả minh bạch.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở form khiếu nại trên app, chọn chế độ gửi: Công khai danh tính hoặc Ẩn danh danh tính; nhập nội dung khiếu nại và đính kèm chứng cứ (ảnh, ghi âm). | Hệ thống mã hóa dữ liệu người gửi; tạo mã hồ sơ khiếu nại để người dùng tra cứu tiến độ. |
| 2 | Đơn được chuyển trực tiếp đến Hòm thư chuyên trách của Ban Thanh tra nội bộ và Chủ tịch Công đoàn. | Các đơn vị cấp quản lý trực tiếp tại siêu thị hoàn toàn không được quyền xem đơn để tránh trù dập. |
| 3 | Hội đồng tiến hành xác minh thực tế, nhập kết luận xử lý và gửi phản hồi cho người khiếu nại. | Người gửi mở app tra cứu kết quả xử lý bằng mã hồ sơ đã cấp. |

#### UC40 - Quản lý hồ sơ cán bộ quản lý theo chuẩn Mẫu 2C-BNV
- **Tác nhân chính:** Chuyên viên Hồ sơ nhân sự
- **Mục đích / Mô tả:** Quản lý đầy đủ 111 thuộc tính thông tin chuyên sâu của đội ngũ cán bộ quản lý (Quản lý siêu thị, Quản lý khu vực, Giám đốc Chuỗi) theo đúng tiêu chuẩn Mẫu 2C-BNV/2008 phục vụ báo cáo cơ quan quản lý nhà nước và thanh tra lao động.
- **Điều kiện tiên quyết:** Nhân viên được bổ nhiệm vào vị trí cán bộ quản lý.
- **Hậu điều kiện:** Dữ liệu hồ sơ cán bộ được chuẩn hóa và sẵn sàng trích xuất biểu mẫu in ấn.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên hồ sơ truy cập phân hệ `/personnel-reports/cadre-profiles`. | Hiển thị danh mục hồ sơ cán bộ quản lý toàn Tập đoàn. |
| 2 | Nhập và chuẩn hóa các trường thông tin: Thành phần bản thân, ngày vào Đảng/Đoàn, trình độ lý luận chính trị, ngạch lương, chức vụ bổ nhiệm và quá trình đào tạo bồi dưỡng. | Hệ thống kiểm tra tính hợp lệ dữ liệu theo quy chuẩn thông tin công chức/viên chức. |
| 3 | Bấm "Lưu hồ sơ cán bộ". | Cập nhật bản ghi `PersonnelComprehensiveProfile` trong CSDL. |

#### UC41 - Quản trị danh mục ngạch bậc lương chuẩn Nghị định 204
- **Tác nhân chính:** Chuyên viên Hồ sơ nhân sự
- **Mục đích / Mô tả:** Cấu hình và quản lý bảng danh mục ngạch lương, hệ số lương và bậc lương theo tiêu chuẩn Nghị định 204/2004/NĐ-CP phục vụ việc tham chiếu ngạch bậc cho khối cán bộ quản lý và báo cáo nhà nước.
- **Điều kiện tiên quyết:** Có quyền quản trị danh mục ngạch bậc lương.
- **Hậu điều kiện:** Danh mục ngạch bậc được cập nhật, làm cơ sở tự động rà soát thời hạn nâng bậc.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập giao diện quản trị ngạch bậc lương `/salary-ranks`. | Hiển thị danh mục ngạch (Chuyên viên cao cấp, Chuyên viên chính, Chuyên viên, Cán sự) và các bậc lương kèm hệ số. |
| 2 | Thực hiện cập nhật hệ số lương hoặc quy định thời hạn nâng bậc thường xuyên (36 tháng đối với ngạch đại học, 24 tháng đối với ngạch cao đẳng). | Kiểm tra tính chính xác của hệ số so với văn bản pháp luật hiện hành. |
| 3 | Bấm "Lưu bảng ngạch bậc". | Lưu dữ liệu vào bảng `SalaryGrade` trong CSDL. |

#### UC42 - Tự động rà soát & Phê duyệt nâng bậc lương định kỳ
- **Tác nhân chính:** Chuyên viên Hồ sơ, Giám đốc
- **Mục đích / Mô tả:** Hệ thống tự động quét mốc thời gian giữ bậc của cán bộ nhân viên, lập danh sách đề xuất nâng bậc lương thường xuyên và trình lãnh đạo phê duyệt.
- **Điều kiện tiên quyết:** Đến kỳ rà soát nâng lương định kỳ (6 tháng một lần).
- **Hậu điều kiện:** Danh sách cán bộ đủ điều kiện được nâng lên bậc lương mới; tự động tạo quyết định nâng lương.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên hồ sơ bấm "Quét danh sách nâng bậc tự động". | Hệ thống tự động kiểm tra thời gian giữ bậc hiện tại: Lọc ra các cán bộ đủ thời gian giữ bậc (24 hoặc 36 tháng) và không bị kỷ luật lao động trong kỳ. |
| 2 | Rà soát danh sách, bấm "Trình phê duyệt nâng bậc". | Gửi danh sách kèm báo cáo đánh giá thành tích lên Ban Giám đốc. |
| 3 | Giám đốc ký duyệt quyết định nâng bậc lương. | Hệ thống tự động chuyển nhân sự sang bậc lương mới; sinh quyết định nâng lương và gửi thông báo cho bộ phận C&B. |

#### UC43 - Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Báo cáo lao động)
- **Tác nhân chính:** Chuyên viên Hồ sơ nhân sự
- **Mục đích / Mô tả:** Tự động trích xuất dữ liệu từ CSDL và điền vào các biểu mẫu báo cáo quy chuẩn của cơ quan quản lý nhà nước: Sơ yếu lý lịch Mẫu 2C-BNV/2008, Báo cáo tình hình sử dụng lao động định kỳ (Mẫu số 01/PLI theo Nghị định 145/2020/NĐ-CP).
- **Điều kiện tiên quyết:** Hồ sơ cán bộ và số liệu nhân sự đã được cập nhật đầy đủ.
- **Hậu điều kiện:** Xuất file tài liệu chuẩn định dạng PDF/Excel chuẩn khổ A4 sẵn sàng nộp Sở Lao động - Thương binh và Xã hội.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên hồ sơ vào `/personnel-reports`, chọn loại biểu mẫu báo cáo cần xuất (Sơ yếu lý lịch 2C, Báo cáo biến động lao động 6 tháng). | Hệ thống hiển thị bộ lọc chọn nhân sự hoặc phạm vi báo cáo (toàn tập đoàn, chuỗi Bách Hóa Xanh, chi nhánh Hà Nội). |
| 2 | Bấm "Kết xuất biểu mẫu". | Hệ thống tự động tổng hợp số liệu và điền chính xác vào từng ô/mục của biểu mẫu quy chuẩn. |
| 3 | Tải file PDF hoặc Excel đã sinh. | Tệp tài liệu được căn lề, định dạng chuẩn A4 có chữ ký số và con dấu doanh nghiệp để nộp cơ quan chức năng. |

#### UC44 - Quản lý không gian tri thức & Quy trình thao tác chuẩn (SOP)
- **Tác nhân chính:** Toàn thể nhân viên MWG (theo phân quyền không gian)
- **Mục đích / Mô tả:** Xây dựng kho tài liệu hướng dẫn công việc số hóa (SOP trưng bày hàng hóa, SOP thu ngân, SOP xử lý đổi trả sản phẩm, cẩm nang phục vụ khách hàng) với cơ chế quản lý phiên bản bất biến.
- **Điều kiện tiên quyết:** Người dùng có tài khoản hợp lệ trên hệ thống.
- **Hậu điều kiện:** Bài viết quy trình được xuất bản; toàn thể nhân viên có thể tra cứu tức thời.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Cán bộ quản lý truy cập `/documents`, chọn Không gian tri thức tương ứng (Không gian Thế Giới Di Động, Không gian Điện Máy Xanh, Không gian Bách Hóa Xanh). | Hiển thị cây thư mục tài liệu SOP và danh mục bài hướng dẫn công việc. |
| 2 | Soạn thảo bài viết hướng dẫn mới, đính kèm hình ảnh minh họa thao tác thực tế và video đào tạo; chọn phiên bản phát hành. | Hệ thống kiểm tra phiên bản (Versioning), lưu lại vết chỉnh sửa của tác giả. |
| 3 | Bấm "Xuất bản bài viết". | Bài viết được công bố công khai cho nhóm nhân sự mục tiêu; ghi nhận lượt xem và đánh giá hữu ích của người đọc. |

#### UC45 - Tìm kiếm tri thức sản phẩm & Danh bạ chuyên gia nội bộ
- **Tác nhân chính:** Toàn thể nhân viên bán lẻ MWG
- **Mục đích / Mô tả:** Cung cấp công cụ tìm kiếm toàn văn (Full-Text Search) tốc độ cao giúp nhân viên bán hàng tra cứu thông số kỹ thuật sản phẩm, chính sách bảo hành và kết nối nhanh với các chuyên gia kỹ thuật nội bộ để hỗ trợ khách hàng.
- **Điều kiện tiên quyết:** Đã đăng nhập vào hệ thống.
- **Hậu điều kiện:** Kết quả tìm kiếm hiển thị tức thời trong vòng dưới 200ms.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở ô tìm kiếm trên app hoặc web, nhập từ khóa (ví dụ: "chính sách đổi trả iPhone 16", "cách xử lý lỗi máy giặt Inverter"). | Hệ thống thực hiện tìm kiếm toàn văn trên kho tri thức SOP và danh bạ nhân sự. |
| 2 | Hiển thị kết quả tìm kiếm được xếp hạng theo độ liên quan cao nhất: Các đoạn tài liệu SOP hướng dẫn kèm danh bạ các Trưởng nhóm kỹ thuật am hiểu về dòng sản phẩm đó. | Nhân viên nhấp xem chi tiết bài hướng dẫn hoặc bấm nút gọi nhanh nội bộ cho chuyên gia để xin ý kiến tư vấn trực tiếp. |

#### UC46 - Bảng điều khiển phân tích nhân sự thời gian thực (HR Dashboard)
- **Tác nhân chính:** Ban Tổng Giám đốc, Quản lý khu vực (AM)
- **Mục đích / Mô tả:** Cung cấp các biểu đồ số liệu trực quan theo thời gian thực về các chỉ số nhân sự then chốt: Tỷ lệ nhân viên đi làm hôm nay, biến động nhân sự, chi phí quỹ lương theo doanh thu và biểu đồ phân bổ nhân lực theo vùng/siêu thị.
- **Điều kiện tiên quyết:** Người dùng có vai trò quản lý cấp cao (BOD, AREA_MANAGER).
- **Hậu điều kiện:** Hiển thị bức tranh toàn cảnh về nguồn nhân lực phục vụ công tác điều hành chiến lược.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Lãnh đạo truy cập `/dashboard` trên Web hoặc xem báo cáo nhanh trên ứng dụng di động. | Hệ thống tải dữ liệu tổng hợp thời gian thực từ CSDL trung tâm. |
| 2 | Hiển thị các thẻ chỉ số (KPI Cards) và biểu đồ phân tích: <br>- Tỷ lệ hiện diện hôm nay tại hơn 4.000 siêu thị (Real-time Headcount); <br>- Biểu đồ tỷ lệ nghỉ việc theo từng chuỗi kinh doanh; <br>- Tương quan chi phí lương / Doanh thu bán hàng; <br>- Điểm hài lòng khách hàng CSAT trung bình theo khu vực. | Hỗ trợ lọc số liệu theo chuỗi (TGDD, DMX, BHX, An Khang) hoặc theo từng tỉnh thành/khu vực. |
| 3 | Nhấp vào một khu vực để xem chi tiết danh sách siêu thị và nhân sự cụ thể. | Kết xuất báo cáo phân tích định dạng PDF/Excel phục vụ họp giao ban. |

#### UC47 - Nhật ký kiểm toán hệ thống & Cấu hình tham số bán lẻ
- **Tác nhân chính:** Quản trị viên Kỹ thuật CNTT (MWG IT)
- **Mục đích / Mô tả:** Giám sát nhật ký hoạt động hệ thống theo nguyên tắc chỉ ghi thêm (Append-Only Audit Log) theo tiêu chuẩn an toàn thông tin ISO 27001 và cấu hình các tham số vận hành chung của hệ thống.
- **Điều kiện tiên quyết:** Đã đăng nhập với vai trò `SYS_ADMIN`.
- **Hậu điều kiện:** Mọi hành vi truy cập và thao tác dữ liệu nhạy cảm được ghi vết vĩnh viễn; các tham số hệ thống được bảo toàn.

| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Quản trị viên truy cập `/admin/audit`, xem danh sách nhật ký kiểm toán hệ thống. | Hiển thị thông tin chi tiết: Thời điểm, Tác nhân thực hiện, Hành động (CREATE, UPDATE, DELETE, LOGIN, EXPORT), Địa chỉ IP, Bảng dữ liệu tác động và giá trị thay đổi (Diff). |
| 2 | Lọc nhật ký theo người dùng, thời gian hoặc sự kiện nghi vấn bảo mật (nhập sai mật khẩu liên tiếp, thao tác sửa đổi dữ liệu ngoài giờ). | Hệ thống hỗ trợ tra cứu nhanh chóng và xuất báo cáo kiểm toán bảo mật. |
| 3 | Chuyển sang `/admin/settings` để cấu hình các tham số hệ thống (thời gian sống của JWT token, giới hạn dung lượng tải tệp, bán kính mặc định điểm danh GPS geofencing). | Lưu cấu hình tham số hệ thống; ghi vết người thay đổi cấu hình vào Audit Log. |

---

### 2.1.4. Bảng ánh xạ ba tầng: Quy trình nghiệp vụ - Use Case - Màn hình thực tế

*(Xem chi tiết Bảng 2.3 ở phần trên)*

---

### 2.1.5. Ma trận phân quyền RBAC theo vai trò bán lẻ

*(Xem chi tiết Bảng 2.4 ở phần trên)*

---

## 2.2. Phân tích cấu trúc hệ thống

*(Chi tiết cấu trúc phân hệ, mô hình dữ liệu 87 bảng và so sánh điểm danh đa nguồn đã được trình bày đầy đủ ở Bảng 2.5 và Bảng 2.6).*

---

## 2.3. Phân tích hành vi của hệ thống

*(Chi tiết các biểu đồ tương tác động Sequence, Activity và State Machine đã được trình bày đầy đủ ở Mục 2.3).*

---

## 2.4. Thiết kế hệ thống

*(Chi tiết kiến trúc 3 tầng phân tán và danh mục 31 màn hình chức năng đã được trình bày đầy đủ ở Mục 2.4).*

---

## Tóm tắt chương 2

Chương 2 đã hoàn thành toàn diện nhiệm vụ thiết kế hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG). Chương đã xác định rõ 12 tác nhân nghiệp vụ bán lẻ và ánh xạ vào ma trận phân quyền RBAC; xây dựng danh mục 47 Use Case hoàn chỉnh bám sát trọn vẹn vòng đời nhân viên chuỗi bán lẻ; đặc tả kịch bản tác nghiệp từng bước chi tiết; thiết lập bảng ánh xạ ba tầng liên kết chặt chẽ giữa quy trình thực tế, chức năng phần mềm và màn hình ứng dụng; xây dựng các mô hình tương tác động (Sequence, Activity, State); thiết kế cấu trúc tĩnh với lược đồ CSDL quan hệ 87 bảng trên PostgreSQL 16 (bao gồm giải pháp chấm công đa nguồn GPS/FaceID/Wifi); thiết kế 31 màn hình chức năng và thiết lập mô hình kiến trúc phần mềm 3 tầng phân tán hiện đại, đáp ứng hoàn hảo yêu cầu vận hành quy mô lớn của MWG.

---

# CHƯƠNG 3: KẾT QUẢ ĐẠT ĐƯỢC VÀ ĐỀ XUẤT, KHUYẾN NGHỊ HOẶC HƯỚNG NGHIÊN CỨU PHÁT TRIỂN

## 3.1. Những kết quả đạt được

Sau quá trình nghiên cứu lý luận, khảo sát thực tế hoạt động vận hành tại Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG), vận dụng phương pháp phân tích thiết kế hướng đối tượng (OOAD) và xây dựng mô hình phần mềm hoàn chỉnh, đề tài đã đạt được các kết quả nổi bật:

1. **Về mặt nghiệp vụ và quy trình bán lẻ:** Hệ thống đã số hóa trọn vẹn 9 quy trình quản trị nhân sự cốt lõi của tập đoàn bán lẻ hàng đầu Việt Nam, hiện thực hóa thành 47 Use Case hoàn chỉnh trên 31 màn hình ứng dụng thực tế. Hệ thống phục vụ 12 tác nhân nghiệp vụ gói gọn trong mô hình phân quyền RBAC đa vai trò, bao quát toàn diện từ khâu tuyển dụng số lượng lớn (Mass ATS), ký kết hợp đồng lao động điện tử bằng mã OTP, điểm danh di động đa nguồn (GPS Geofencing 50m + FaceID chống giả mạo + Wifi cửa hàng), quản lý ca xoay và đổi ca linh hoạt tại siêu thị, chức năng tính toán tiền lương bán lẻ 3P tự động (kết nối trực tiếp doanh số siêu thị và hoa hồng ngành hàng từ ERP), quản lý Quỹ phúc lợi MWG, kỳ thi thăng cấp Quản lý siêu thị nội bộ, cho đến quy trình bàn giao thôi việc 4 khâu cấp tốc tại điểm bán và quản trị hồ sơ cán bộ theo chuẩn Mẫu 2C-BNV/2008.
2. **Về mặt cơ sở dữ liệu:** Thiết kế hoàn chỉnh lược đồ cơ sở dữ liệu quan hệ gồm 87 bảng dữ liệu phân bổ trong 10 miền nghiệp vụ trên hệ quản trị PostgreSQL 16; thiết lập các ràng buộc toàn vẹn dữ liệu chặt chẽ: nhật ký kiểm toán và sự kiện chấm công theo nguyên tắc chỉ ghi thêm (Append-Only) để lưu vết vĩnh viễn, cùng cơ chế khóa bất biến kỳ lương (`LOCKED`) ngăn chặn hoàn toàn việc sửa đổi số liệu kế toán trái phép.
3. **Về mặt kiến trúc và công nghệ:** Thiết kế kiến trúc 3 tầng phân tán hiện đại kết hợp giữa máy chủ NestJS hiệu năng cao, CSDL PostgreSQL, bộ nhớ đệm Redis và ứng dụng di động React Native; đảm bảo khả năng xử lý đồng thời cho hơn 65.000 người dùng với tốc độ phản hồi dưới 100ms.
4. **Về tính tuân thủ pháp luật:** Hệ thống cài đặt sẵn các thuật toán tự động kiểm tra và ràng buộc tuân thủ nghiêm ngặt các quy định pháp luật lao động: kiểm soát trần làm thêm giờ theo Điều 107 BLLĐ 2019, khống chế mức trích trừ nợ qua lương không quá 30% lương Net theo Điều 102 BLLĐ 2019, tính thuế TNCN lũy tiến 7 bậc và bảo vệ dữ liệu sinh trắc học theo Nghị định 13/2023/NĐ-CP.

---

## 3.2. Đánh giá ưu, nhược điểm

### 3.2.1. Ưu điểm nổi bật
- **Tính thực tiễn và phù hợp cao với đặc thù ngành bán lẻ chuỗi:** Hệ thống giải quyết trúng và đúng các bài toán nhức nhối nhất của các doanh nghiệp bán lẻ quy mô lớn: quản lý hàng nghìn điểm bán phân tán, tuyển dụng số lượng lớn liên tục, lập lịch ca kíp linh hoạt và tính lương theo doanh số bán hàng.
- **Giải pháp điểm danh di động thông minh, chi phí thấp:** Thay vì phải đầu tư hàng nghìn máy chấm công phần cứng đắt đỏ và tốn chi phí bảo trì tại từng cửa hàng, việc ứng dụng điểm danh di động GPS Geofencing kết hợp FaceID trên chính điện thoại của nhân viên giúp tiết kiệm hàng chục tỷ đồng chi phí thiết bị, đồng thời chống gian lận chấm công hộ tuyệt đối.
- **Trải nghiệm tự phục vụ xuất sắc cho người lao động:** Ứng dụng di động MWG App mang lại sự thuận tiện tối đa cho nhân viên: chủ động kiểm tra ngày công, xem chi tiết công thức tính lương, xin nghỉ phép, đổi ca và tra cứu chính sách công ty mọi lúc, mọi nơi.
- **Bảo mật và toàn vẹn dữ liệu tài chính:** Cơ chế khóa kỳ lương bất biến và sổ nhật ký kiểm toán Append-Only bảo vệ tính toàn vẹn của số liệu tiền lương, phục vụ hoàn hảo cho công tác kiểm toán độc lập của công ty niêm yết.

### 3.2.2. Hạn chế cần khắc phục
- Tốc độ điểm danh GPS có thể bị ảnh hưởng cục bộ tại một số siêu thị nằm trong các trung tâm thương mại lớn hoặc tầng hầm có độ che phủ sóng vệ tinh yếu; cần phát triển thêm cơ chế tự động chuyển sang xác thực BSSID Wifi cửa hàng làm phương án dự phòng chính.
- Dung lượng lưu trữ cơ sở dữ liệu tăng nhanh do số lượng bản ghi chấm công của hơn 65.000 nhân sự mỗi ngày là rất lớn (trung bình hơn 130.000 sự kiện điểm danh/ngày); đòi hỏi phải định kỳ chuyển dữ liệu lịch sử cũ sang các kho lưu trữ lạnh (Cold Storage Data Partitioning).

---

## 3.3. Hướng nghiên cứu, phát triển

Để hệ thống tiếp tục hoàn thiện và phát huy tối đa giá trị trong kỷ nguyên bán lẻ thông minh, đề tài đề xuất các định hướng phát triển sau:

1. **Ứng dụng Trí tuệ nhân tạo (AI) trong Tối ưu hóa phân ca làm việc (AI Auto-Scheduling):** Nghiên cứu phát triển mô hình học máy phân tích dữ liệu lịch sử bán hàng và lưu lượng khách ra vào siêu thị để tự động dự báo nhu cầu nhân sự theo từng khung giờ trong ngày, từ đó tự động lập lịch phân ca tối ưu nhất cho Quản lý siêu thị, giúp tối đa hóa doanh thu và tiết kiệm chi phí nhân công.
2. **Hệ thống AI Dự báo tỷ lệ biến động nhân sự (Turnover Prediction):** Xây dựng thuật toán phân tích hành vi, chỉ số gắn kết và tần suất nghỉ phép để cảnh báo sớm cho Quản lý khu vực về nguy cơ nhân viên nghỉ việc, giúp chủ động có phương án động viên hoặc tuyển dụng bù đắp kịp thời.
3. **Mở rộng hỗ trợ đa ngôn ngữ và đa quốc gia:** Nâng cấp hệ thống hỗ trợ ngôn ngữ tiếng Indonesia và các chính sách thuế, bảo hiểm xã hội đặc thù của Indonesia nhằm triển khai đồng bộ cho chuỗi siêu thị điện máy EraBlue tại thị trường quốc tế.
4. **Tích hợp trợ lý ảo nhân sự (HR Chatbot AI):** Tích hợp mô hình ngôn ngữ lớn (LLM) vào ứng dụng di động để tự động giải đáp 24/7 toàn bộ các thắc mắc của người lao động về chế độ thai sản, bảo hiểm y tế, quy chế thưởng và chính sách cổ phiếu thưởng ESOP.

---

## Tóm tắt chương 3

Chương 3 đã tổng kết toàn diện các kết quả đạt được của đề tài: thiết kế hoàn chỉnh hệ thống thông tin quản trị nhân lực cho MWG với 47 use case, 31 màn hình ứng dụng, 87 bảng dữ liệu quan hệ và kiến trúc 3 tầng phân tán; giải quyết triệt để các bài toán quản trị nhân sự của tập đoàn bán lẻ quy mô hơn 65.000 con người. Chương cũng đánh giá khách quan các ưu thế vượt trội về mặt chi phí, công nghệ điểm danh di động và trải nghiệm người dùng, đồng thời chỉ ra các hạn chế và định hướng nghiên cứu ứng dụng AI tối ưu hóa ca làm việc nhằm tiếp tục nâng cao hiệu quả vận hành của doanh nghiệp trong tương lai.

---

# TÀI LIỆU THAM KHẢO

1. TS. Trần Kim Dung. *Quản trị nguồn nhân lực*. Hà Nội: Nhà xuất bản Lao động - Xã hội, 2018.
2. PGS.TS. Nguyễn Ngọc Quân, ThS. Nguyễn Vân Điềm. *Giáo trình Quản trị nhân lực*. Hà Nội: Nhà xuất bản Đại học Kinh tế Quốc dân, 2017.
3. PGS.TS. Đặng Văn Đức. *Phân tích và thiết kế hướng đối tượng bằng UML*. Hà Nội: Nhà xuất bản Giáo dục, 2002.
4. Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Bộ luật Lao động số 45/2019/QH14*, ngày 20 tháng 11 năm 2019.
5. Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Luật Bảo hiểm xã hội số 58/2014/QH13*, ngày 20 tháng 11 năm 2014 và các văn bản hướng dẫn thi hành.
6. Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Luật Thuế thu nhập cá nhân số 04/2007/QH12*; Ủy ban Thường vụ Quốc hội. *Nghị quyết số 954/2020/UBTVQH14* về điều chỉnh mức giảm trừ gia cảnh của thuế thu nhập cá nhân.
7. Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Luật Giao dịch điện tử số 20/2023/QH15*, có hiệu lực từ ngày 01 tháng 07 năm 2024.
8. Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Nghị định số 13/2023/NĐ-CP* ngày 17 tháng 04 năm 2023 về bảo vệ dữ liệu cá nhân.
9. Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Nghị định số 145/2020/NĐ-CP* quy định chi tiết và hướng dẫn thi hành một số điều của Bộ luật Lao động về điều kiện lao động và quan hệ lao động.
10. Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Nghị định số 204/2004/NĐ-CP* về chế độ tiền lương đối với cán bộ, công chức, viên chức và lực lượng vũ trang.
11. Bộ Nội vụ. *Quyết định số 06/2007/QĐ-BNV* về thành phần hồ sơ cán bộ, công chức; *Thông tư số 11/2012/TT-BNV* quy định về chế độ báo cáo thống kê và quản lý hồ sơ công chức (Mẫu 2C-BNV/2008).
12. Công ty Cổ phần Đầu tư Thế Giới Di Động (MWG). *Báo cáo thường niên, Quy chế quản trị nội bộ và Báo cáo phát triển bền vững*, 2024 - 2025.
13. Martin Fowler. *UML Distilled: A Brief Guide to the Standard Object Modeling Language*. 3rd Edition, Addison-Wesley Professional, 2003.
14. Robert C. Martin. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
