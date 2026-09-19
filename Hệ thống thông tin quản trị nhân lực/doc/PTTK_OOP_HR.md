# HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH

# HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG

---

# TÊN ĐỀ TÀI:

# XÂY DỰNG HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC
# CHO CÔNG TY CỔ PHẦN PHẦN MỀM SAIGON TECHNOLOGY

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

Để bài báo cáo bài tập lớn kết thúc học phần này được hoàn thiện một cách chỉn chu, khoa học và đạt kết quả tốt nhất, em xin bày tỏ lòng biết ơn sâu sắc đến Thầy Hoàng Minh Ngọc. Thầy đã dành nhiều thời gian, tâm huyết để tận tình hướng dẫn, truyền đạt những kiến thức chuyên môn quý báu về phương pháp phân tích thiết kế hệ thống hướng đối tượng và quản trị nhân lực hiện đại, đồng thời đưa ra những đóng góp, định hướng xác đáng giúp em tháo gỡ các vướng mắc nghiệp vụ trong suốt quá trình nghiên cứu.

Đồng thời, em cũng xin bày tỏ lòng biết ơn chân thành đến Ban Giám hiệu cùng tập thể quý Thầy, Cô giáo tại Học viện Hành chính và Quản trị công đã không ngừng tạo mọi điều kiện thuận lợi nhất về cơ sở vật chất, môi trường học thuật chất lượng cao để chúng em được trau dồi tri thức, rèn luyện kỹ năng tư duy hệ thống và phương pháp luận giải quyết vấn đề thực tiễn.

Cuối cùng, em xin gửi lời tri ân sâu sắc đến gia đình, người thân và bạn bè – những người luôn là điểm tựa tinh thần vững chắc, không ngừng động viên, hỗ trợ và đồng hành cùng em trong suốt chặng đường học tập và rèn luyện vừa qua.

Em xin chân thành cảm ơn!

---

# LỜI CAM ĐOAN

Em xin cam đoan rằng toàn bộ nội dung được trình bày trong bài báo cáo bài tập lớn kết thúc học phần với đề tài "Xây dựng hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Phần mềm Saigon Technology" là công trình nghiên cứu độc lập, nghiêm túc của riêng bản thân em dưới sự hướng dẫn chuyên môn của Thầy Hoàng Minh Ngọc.

Đề tài này được thực hiện dựa trên nền tảng kiến thức lý thuyết đã được trang bị trong học phần, kết hợp chặt chẽ với quá trình tìm hiểu thực tế về mô hình tổ chức, quy trình sản xuất phần mềm và hiện trạng quản trị nhân lực tại Công ty Cổ phần Phần mềm Saigon Technology (STS Software Technology JSC).

Em xin khẳng định rằng mọi số liệu, biểu đồ, hình ảnh và kết quả phân tích trong báo cáo là trung thực, rõ ràng và có trích dẫn nguồn gốc đầy đủ theo đúng quy định học thuật. Các sơ đồ kỹ thuật UML đều được tự xây dựng dựa trên đặc tả bài toán thực tế của doanh nghiệp.

Em xin hoàn toàn chịu trách nhiệm trước Bộ môn, Khoa và Ban Giám hiệu Nhà trường về tính trung thực và sự chuẩn mực của nội dung được trình bày trong toàn bộ tài liệu này.

Em xin trân trọng cam đoan!

---

# MỤC LỤC

DANH MỤC TỪ/ THUẬT NGỮ VIẾT TẮT
DANH MỤC BẢNG BIỂU, SƠ ĐỒ
PHẦN MỞ ĐẦU
1. Lý do chọn đề tài
2. Tổng quan về Công ty Cổ phần Phần mềm Saigon Technology (STS Software Technology JSC)
3. Mục tiêu và nhiệm vụ
4. Đối tượng và phạm vi nghiên cứu
5. Cấu trúc của báo cáo
PHẦN NỘI DUNG
CHƯƠNG 1: CƠ SỞ LÝ LUẬN VỀ QUẢN TRỊ NHÂN LỰC VÀ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC
1.1. Lý thuyết cơ sở
1.2. Một số vấn đề liên quan đến chủ đề
1.3. Phát biểu bài toán cần phân tích
Tóm tắt chương 1
CHƯƠNG 2: THIẾT KẾ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC CHO CÔNG TY CỔ PHẦN PHẦN MỀM SAIGON TECHNOLOGY
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
| 1 | OOAD | Object-Oriented Analysis and Design (Phân tích và thiết kế hướng đối tượng) |
| 2 | OOP | Object-Oriented Programming (Lập trình hướng đối tượng) |
| 3 | UML | Unified Modeling Language (Ngôn ngữ mô hình hóa thống nhất) |
| 4 | STS | STS Software Technology JSC (Công ty Cổ phần Phần mềm Saigon Technology) |
| 5 | ODC | Offshore Development Center (Trung tâm phát triển phần mềm chuyên trách) |
| 6 | BGD | Board of Directors / Executive Board (Ban Giám đốc Điều hành) |
| 7 | PM | Project Manager (Quản trị viên Dự án phần mềm) |
| 8 | C&B | Compensation & Benefits (Bộ phận Chế độ Đãi ngộ, Tiền lương và Phúc lợi) |
| 9 | KPI / OKR | Key Performance Indicator / Objectives and Key Results (Chỉ số hiệu suất & Mục tiêu) |
| 10 | CRUD | Create, Read, Update, Delete (Bốn thao tác dữ liệu cơ bản) |
| 11 | RBAC | Role-Based Access Control (Kiểm soát truy cập dựa trên vai trò) |
| 12 | ERD | Entity-Relationship Diagram (Sơ đồ quan hệ thực thể cơ sở dữ liệu) |
| 13 | RESTful API | Representational State Transfer API (Giao diện lập trình ứng dụng chuẩn REST) |
| 14 | JSON | JavaScript Object Notation (Định dạng trao đổi dữ liệu tiêu chuẩn) |

---

# DANH MỤC BẢNG BIỂU, SƠ ĐỒ

**Danh mục Bảng biểu:**
- Bảng 1.1. Hồ sơ định danh pháp lý Công ty Cổ phần Phần mềm Saigon Technology
- Bảng 1.2. Mạng lưới văn phòng và chi nhánh toàn cầu của Saigon Technology
- Bảng 1.3. Tổng hợp chứng nhận quốc tế và giải thưởng tiêu biểu của Saigon Technology
- Bảng 1.4. Cơ cấu nguồn nhân lực theo khối chức năng và trình độ tại Saigon Technology
- Bảng 2.1. Ánh xạ tác nhân hệ thống với cơ cấu tổ chức của Saigon Technology
- Bảng 2.2. Danh sách 47 Use case của Hệ thống Quản trị nhân lực
- Bảng 2.3. Đặc tả tổng hợp 47 Use case của hệ thống
- Bảng 2.4. Đặc tả chi tiết các Use case trọng yếu
- Bảng 2.5. Bảng ánh xạ ba tầng: từ Quy trình nghiệp vụ đến Use Case và Màn hình thực tế
- Bảng 2.6. Ma trận phân quyền truy cập chức năng (CRUD Permission Matrix)
- Bảng 2.7. Đặc tả cấu trúc lược đồ Cơ sở dữ liệu quan hệ
- Bảng 2.8. So sánh các phương thức điểm danh trong hệ thống

**Danh mục Sơ đồ, Hình ảnh:**
- Hình 1.1. Sơ đồ cơ cấu tổ chức tổng thể Công ty Saigon Technology
- Hình 1.2. Cơ cấu chi tiết Khối Quản trị Nguồn nhân lực và Khối Vận hành & Pháp chế
- Hình 1.3. Cơ cấu chi tiết Khối Kỹ thuật & Sản xuất Phần mềm
- Hình 1.4. Mô hình phối hợp 3 mắt xích cốt lõi
- Hình 2.1. Biểu đồ cây phân cấp Tác nhân (Actor Generalization)
- Hình 2.2. Biểu đồ Use case tổng quan Hệ thống Quản trị nhân lực
- Hình 2.3. Biểu đồ Use case nhóm B - Tuyển dụng
- Hình 2.4. Biểu đồ trình tự Use case Đăng nhập & Xác thực hệ thống (UC01)
- Hình 2.5. Biểu đồ trình tự Use case Quản trị người dùng & Phân quyền RBAC (UC02)
- Hình 2.6. Biểu đồ trình tự Use case Quản trị cơ cấu tổ chức & Cây phòng ban (UC03)
- Hình 2.7. Biểu đồ trình tự Use case Lập phiếu đề xuất tuyển dụng nhân sự (UC04)
- Hình 2.8. Biểu đồ trình tự Use case Thẩm định chỉ tiêu & Kiểm soát định biên tuyển dụng (UC05)
- Hình 2.9. Biểu đồ trình tự Use case Phê duyệt chỉ tiêu tuyển dụng (UC06)
- Hình 2.10. Biểu đồ trình tự Use case Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban (UC07)
- Hình 2.11. Biểu đồ trình tự Use case Gửi thư mời nhận việc & Thỏa thuận mức lương (UC08)
- Hình 2.12. Biểu đồ trình tự Use case Quản lý hồ sơ nhân viên toàn diện (UC09)
- Hình 2.13. Biểu đồ trình tự Use case Quản lý hợp đồng lao động & Phụ lục hợp đồng (UC10)
- Hình 2.14. Biểu đồ trình tự Use case Quản lý văn bằng, chứng chỉ chuyên môn (UC11)
- Hình 2.15. Biểu đồ trình tự Use case Mượn - trả hồ sơ, chứng chỉ bản gốc (UC12)
- Hình 2.16. Biểu đồ trình tự Use case Đánh giá kết quả thử việc & Ký HĐLĐ chính thức (UC13)
- Hình 2.17. Biểu đồ trình tự Use case Lộ trình hội nhập nhân viên mới (Onboarding Checklist) (UC14)
- Hình 2.18. Biểu đồ trình tự Use case Cổng tự phục vụ nhân viên tập trung (ESS Portal) (UC15)
- Hình 2.19. Biểu đồ trình tự Use case Quản lý thông tin cá nhân phân cấp 3 mức độ (UC16)
- Hình 2.20. Biểu đồ trình tự Use case Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2 (UC17)
- Hình 2.21. Biểu đồ trình tự Use case Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca (UC18)
- Hình 2.22. Biểu đồ trình tự Use case Điểm danh sinh trắc học khuôn mặt & Cảm biến IR (UC19)
- Hình 2.23. Biểu đồ trình tự Use case Quản trị kết nối thiết bị máy chấm công (UC20)
- Hình 2.24. Biểu đồ trình tự Use case Đăng ký & Xét duyệt nghỉ phép trực tuyến (UC21)
- Hình 2.25. Biểu đồ trình tự Use case Đăng ký & Phê duyệt làm thêm giờ (OT) (UC22)
- Hình 2.26. Biểu đồ trình tự Use case Lập lịch và phân ca làm việc (Shift Scheduling) (UC23)
- Hình 2.27. Biểu đồ trình tự Use case Giải trình bổ sung giờ công & Xử lý lệch công (UC24)
- Hình 2.28. Biểu đồ trình tự Use case Tổng hợp & Chốt bảng chấm công tháng (UC25)
- Hình 2.29. Biểu đồ trình tự Use case Cấu hình công thức và ngạch bậc lương (UC26)
- Hình 2.30. Biểu đồ trình tự Use case Vận hành động cơ tính toán bảng lương tự động (UC27)
- Hình 2.31. Biểu đồ trình tự Use case Phê duyệt & Khóa bất biến kỳ lương (LOCKED state) (UC28)
- Hình 2.32. Biểu đồ trình tự Use case Quản lý tạm ứng & Khoản vay phúc lợi nhân viên (UC29)
- Hình 2.33. Biểu đồ trình tự Use case Quản lý đề xuất công tác & Quyết toán chi phí (T&E) (UC30)
- Hình 2.34. Biểu đồ trình tự Use case Quản lý cấp phát & Thu hồi tài sản làm việc (UC31)
- Hình 2.35. Biểu đồ trình tự Use case Đề xuất & Phê duyệt điều chuyển công tác nội bộ (UC32)
- Hình 2.36. Biểu đồ trình tự Use case Đề xuất & Phê duyệt điều chỉnh bậc lương (UC33)
- Hình 2.37. Biểu đồ trình tự Use case Đề xuất & Phê duyệt khen thưởng nhân sự (UC34)
- Hình 2.38. Biểu đồ trình tự Use case Xử lý kỷ luật & Vi phạm nội quy lao động (UC35)
- Hình 2.39. Biểu đồ trình tự Use case Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận (UC36)
- Hình 2.40. Biểu đồ trình tự Use case Đánh giá hiệu suất 360 độ & Mục tiêu OKR/KPI (UC37)
- Hình 2.41. Biểu đồ trình tự Use case Quản trị chương trình đào tạo nội bộ (UC38)
- Hình 2.42. Biểu đồ trình tự Use case Tiếp nhận & Giải quyết khiếu nại lao động bảo mật (UC39)
- Hình 2.43. Biểu đồ trình tự Use case Quản lý hồ sơ cán bộ toàn diện theo Mẫu 2C-BNV (UC40)
- Hình 2.44. Biểu đồ trình tự Use case Quản trị danh mục ngạch bậc lương chuẩn NĐ 204 (UC41)
- Hình 2.45. Biểu đồ trình tự Use case Tự động rà soát & Phê duyệt nâng bậc lương định kỳ (UC42)
- Hình 2.46. Biểu đồ trình tự Use case Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Biểu 01-03) (UC43)
- Hình 2.47. Biểu đồ trình tự Use case Quản lý không gian tri thức số & Tài liệu quy trình SOP (UC44)
- Hình 2.48. Biểu đồ trình tự Use case Tìm kiếm tri thức toàn văn & Danh bạ chuyên gia (UC45)
- Hình 2.49. Biểu đồ trình tự Use case Bảng điều khiển phân tích & Thống kê nhân sự (Dashboard) (UC46)
- Hình 2.50. Biểu đồ trình tự Use case Nhật ký kiểm toán hệ thống & Cấu hình tham số (UC47)
- Hình 2.51. Biểu đồ hoạt động Use case Đăng nhập & Xác thực hệ thống (UC01)
- Hình 2.52. Biểu đồ hoạt động Use case Quản trị người dùng & Phân quyền RBAC (UC02)
- Hình 2.53. Biểu đồ hoạt động Use case Quản trị cơ cấu tổ chức & Cây phòng ban (UC03)
- Hình 2.54. Biểu đồ hoạt động Use case Lập phiếu đề xuất tuyển dụng nhân sự (UC04)
- Hình 2.55. Biểu đồ hoạt động Use case Thẩm định chỉ tiêu & Kiểm soát định biên tuyển dụng (UC05)
- Hình 2.56. Biểu đồ hoạt động Use case Phê duyệt chỉ tiêu tuyển dụng (UC06)
- Hình 2.57. Biểu đồ hoạt động Use case Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban (UC07)
- Hình 2.58. Biểu đồ hoạt động Use case Gửi thư mời nhận việc & Thỏa thuận mức lương (UC08)
- Hình 2.59. Biểu đồ hoạt động Use case Quản lý hồ sơ nhân viên toàn diện (UC09)
- Hình 2.60. Biểu đồ hoạt động Use case Quản lý hợp đồng lao động & Phụ lục hợp đồng (UC10)
- Hình 2.61. Biểu đồ hoạt động Use case Quản lý văn bằng, chứng chỉ chuyên môn (UC11)
- Hình 2.62. Biểu đồ hoạt động Use case Mượn - trả hồ sơ, chứng chỉ bản gốc (UC12)
- Hình 2.63. Biểu đồ hoạt động Use case Đánh giá kết quả thử việc & Ký HĐLĐ chính thức (UC13)
- Hình 2.64. Biểu đồ hoạt động Use case Lộ trình hội nhập nhân viên mới (Onboarding Checklist) (UC14)
- Hình 2.65. Biểu đồ hoạt động Use case Cổng tự phục vụ nhân viên tập trung (ESS Portal) (UC15)
- Hình 2.66. Biểu đồ hoạt động Use case Quản lý thông tin cá nhân phân cấp 3 mức độ (UC16)
- Hình 2.67. Biểu đồ hoạt động Use case Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2 (UC17)
- Hình 2.68. Biểu đồ hoạt động Use case Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca (UC18)
- Hình 2.69. Biểu đồ hoạt động Use case Điểm danh sinh trắc học khuôn mặt & Cảm biến IR (UC19)
- Hình 2.70. Biểu đồ hoạt động Use case Quản trị kết nối thiết bị máy chấm công (UC20)
- Hình 2.71. Biểu đồ hoạt động Use case Đăng ký & Xét duyệt nghỉ phép trực tuyến (UC21)
- Hình 2.72. Biểu đồ hoạt động Use case Đăng ký & Phê duyệt làm thêm giờ (OT) (UC22)
- Hình 2.73. Biểu đồ hoạt động Use case Lập lịch và phân ca làm việc (Shift Scheduling) (UC23)
- Hình 2.74. Biểu đồ hoạt động Use case Giải trình bổ sung giờ công & Xử lý lệch công (UC24)
- Hình 2.75. Biểu đồ hoạt động Use case Tổng hợp & Chốt bảng chấm công tháng (UC25)
- Hình 2.76. Biểu đồ hoạt động Use case Cấu hình công thức và ngạch bậc lương (UC26)
- Hình 2.77. Biểu đồ hoạt động Use case Vận hành động cơ tính toán bảng lương tự động (UC27)
- Hình 2.78. Biểu đồ hoạt động Use case Phê duyệt & Khóa bất biến kỳ lương (LOCKED state) (UC28)
- Hình 2.79. Biểu đồ hoạt động Use case Quản lý tạm ứng & Khoản vay phúc lợi nhân viên (UC29)
- Hình 2.80. Biểu đồ hoạt động Use case Quản lý đề xuất công tác & Quyết toán chi phí (T&E) (UC30)
- Hình 2.81. Biểu đồ hoạt động Use case Quản lý cấp phát & Thu hồi tài sản làm việc (UC31)
- Hình 2.82. Biểu đồ hoạt động Use case Đề xuất & Phê duyệt điều chuyển công tác nội bộ (UC32)
- Hình 2.83. Biểu đồ hoạt động Use case Đề xuất & Phê duyệt điều chỉnh bậc lương (UC33)
- Hình 2.84. Biểu đồ hoạt động Use case Đề xuất & Phê duyệt khen thưởng nhân sự (UC34)
- Hình 2.85. Biểu đồ hoạt động Use case Xử lý kỷ luật & Vi phạm nội quy lao động (UC35)
- Hình 2.86. Biểu đồ hoạt động Use case Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận (UC36)
- Hình 2.87. Biểu đồ hoạt động Use case Đánh giá hiệu suất 360 độ & Mục tiêu OKR/KPI (UC37)
- Hình 2.88. Biểu đồ hoạt động Use case Quản trị chương trình đào tạo nội bộ (UC38)
- Hình 2.89. Biểu đồ hoạt động Use case Tiếp nhận & Giải quyết khiếu nại lao động bảo mật (UC39)
- Hình 2.90. Biểu đồ hoạt động Use case Quản lý hồ sơ cán bộ toàn diện theo Mẫu 2C-BNV (UC40)
- Hình 2.91. Biểu đồ hoạt động Use case Quản trị danh mục ngạch bậc lương chuẩn NĐ 204 (UC41)
- Hình 2.92. Biểu đồ hoạt động Use case Tự động rà soát & Phê duyệt nâng bậc lương định kỳ (UC42)
- Hình 2.93. Biểu đồ hoạt động Use case Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Biểu 01-03) (UC43)
- Hình 2.94. Biểu đồ hoạt động Use case Quản lý không gian tri thức số & Tài liệu quy trình SOP (UC44)
- Hình 2.95. Biểu đồ hoạt động Use case Tìm kiếm tri thức toàn văn & Danh bạ chuyên gia (UC45)
- Hình 2.96. Biểu đồ hoạt động Use case Bảng điều khiển phân tích & Thống kê nhân sự (Dashboard) (UC46)
- Hình 2.97. Biểu đồ hoạt động Use case Nhật ký kiểm toán hệ thống & Cấu hình tham số (UC47)
- Hình 2.98. Biểu đồ trạng thái vòng đời Nhân viên
- Hình 2.99. Biểu đồ trạng thái Phiếu tuyển dụng
- Hình 2.100. Biểu đồ trạng thái Đơn nghỉ phép
- Hình 2.101. Biểu đồ trạng thái Phiếu mượn - trả hồ sơ
- Hình 2.102. Biểu đồ trạng thái Phiếu lương
- Hình 2.103. Biểu đồ gói tổng quan của hệ thống
- Hình 2.104. Biểu đồ lớp Use case Đăng nhập (UC01)
- Hình 2.105. Biểu đồ lớp Use case Đăng ký nghỉ phép (UC21)
- Hình 2.106. Biểu đồ lớp miền cốt lõi của hệ thống
- Hình 2.107. Mô hình cơ sở dữ liệu vật lý của hệ thống
- Hình 2.108. Mô hình dữ liệu mở rộng cho chấm công đa nguồn
- Hình 2.109. Sơ đồ kiến trúc phần mềm 3 tầng của hệ thống


# PHẦN MỞ ĐẦU

## 1. Lý do chọn đề tài

Trong bối cảnh nền kinh tế số và xu thế toàn cầu hóa hiện nay, ngành công nghệ thông tin tại Việt Nam đang có những bước phát triển vượt bậc. Đối với các doanh nghiệp hoạt động trong lĩnh vực xuất khẩu dịch vụ phần mềm, nguồn nhân lực kỹ thuật chất lượng cao chính là tài sản chiến lược cốt lõi, quyết định trực tiếp đến năng lực cạnh tranh và sự phát triển bền vững của tổ chức. Việc quản lý hiệu quả một đội ngũ nhân sự tri thức đông đảo, đa dạng về chuyên môn, phân tán tại nhiều chi nhánh và làm việc theo các múi giờ quốc tế đặt ra bài toán quản trị vô cùng phức tạp.

Công ty Cổ phần Phần mềm Saigon Technology (STS Software Technology JSC) là một trong những doanh nghiệp gia công và xuất khẩu phần mềm uy tín hàng đầu tại Việt Nam với hơn 430 kỹ sư công nghệ làm việc tại các văn phòng ở Thành phố Hồ Chí Minh, Đà Nẵng cùng các văn phòng đại diện quốc tế tại Hoa Kỳ, Úc, Thụy Sĩ và Singapore. Sự mở rộng quy mô kinh doanh nhanh chóng đã dẫn đến khối lượng dữ liệu nhân sự tăng vọt, trong khi phương thức quản trị bán thủ công trước đây bắt đầu bộc lộ nhiều hạn chế: dữ liệu bị phân mảnh trên các bảng tính riêng lẻ, quy trình đề xuất và phê duyệt thủ tục hành chính còn phụ thuộc vào giấy tờ, công tác tổng hợp ngày công và tính lương tốn nhiều thời gian và dễ phát sinh sai sót, thiếu cơ chế theo dõi lịch sử biến động nhân sự và khó khăn trong việc kết xuất báo cáo nhanh cho Ban Giám đốc.

Xuất phát từ thực tiễn trên, việc nghiên cứu, phân tích và xây dựng một hệ thống thông tin quản trị nhân lực tích hợp, vận dụng phương pháp phân tích thiết kế hướng đối tượng (OOAD) kết hợp ngôn ngữ mô hình hóa thống nhất (UML) trở thành một yêu cầu cấp bách. Hệ thống phần mềm được thiết kế nhằm chuẩn hóa toàn diện cơ sở dữ liệu nhân sự, tự động hóa chuỗi quy trình tác nghiệp từ tuyển dụng, quản lý hồ sơ, chấm công đa nguồn, xét duyệt nghỉ phép đến tính lương và đánh giá hiệu suất, bảo đảm tuân thủ các quy chuẩn pháp lý lao động hiện hành. Đó chính là lý do em lựa chọn đề tài: "Xây dựng hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Phần mềm Saigon Technology" cho bài báo cáo kết thúc học phần.

## 2. Tổng quan về Công ty Cổ phần Phần mềm Saigon Technology (STS Software Technology JSC)

### 2.1. Thông tin chung và Hồ sơ pháp lý doanh nghiệp

Công ty Cổ phần Phần mềm Saigon Technology (tên đăng ký pháp nhân chính thức theo Giấy chứng nhận đăng ký doanh nghiệp: **Công ty Cổ phần Công nghệ Phần mềm STS**; tên giao dịch quốc tế: **STS SOFTWARE TECHNOLOGY JOINT STOCK COMPANY**, thường được nhận diện trên thị trường công nghệ toàn cầu dưới thương hiệu **Saigon Technology** hoặc **STS Software**) là doanh nghiệp công nghệ thông tin chuyên cung cấp dịch vụ gia công và phát triển phần mềm theo tiêu chuẩn quốc tế hàng đầu tại Việt Nam.

**Bảng 1.1. Hồ sơ định danh pháp lý Công ty Cổ phần Phần mềm Saigon Technology**

| Tiêu chí định danh | Thông tin chi tiết xác thực |
| :--- | :--- |
| **Tên tiếng Việt đầy đủ** | CÔNG TY CỔ PHẦN CÔNG NGHỆ PHẦN MỀM STS |
| **Tên tiếng Anh quốc tế** | STS SOFTWARE TECHNOLOGY JOINT STOCK COMPANY |
| **Tên thương hiệu giao dịch** | Saigon Technology / STS Software |
| **Mã số thuế (Doanh nghiệp)** | **0313534747** |
| **Ngày cấp ĐKKD đầu tiên** | **13/11/2015** (khởi nguồn sáng lập kỹ thuật từ năm 2012) |
| **Cơ quan cấp phép** | Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh |
| **Người đại diện theo pháp luật**| **Ông Phạm Tiến Thành** (Chức danh: Tổng Giám đốc / Founder & CEO - "Bruce" Pham) |
| **Loại hình doanh nghiệp** | Công ty cổ phần ngoài nhà nước |
| **Ngành nghề kinh doanh chính** | Lập trình máy vi tính, dịch vụ phần mềm, tư vấn quản trị CNTT (Mã ngành VSIC: 6201, 6202) |
| **Website chính thức** | [https://saigontechnology.com](https://saigontechnology.com) & [https://saigontechnology.com.vn](https://saigontechnology.com.vn) |
| **Hộp thư điện tử liên hệ** | `sales@saigontechnology.com` / `hr@saigontechnology.com` |
| **Đường dây nóng (Hotline)** | (+84) 767 496 612 / (+84) 28 3620 0214 |

Nhằm phục vụ tốt nhất khách hàng quốc tế tại các thị trường trọng điểm và tối ưu hóa nguồn lực kỹ sư chất lượng cao trong nước, Saigon Technology đã xây dựng mạng lưới hiện diện đa quốc gia với 2 trung tâm phát triển phần mềm lớn tại Việt Nam và 4 văn phòng đại diện quốc tế:

**Bảng 1.2. Mạng lưới văn phòng và chi nhánh toàn cầu của Saigon Technology**

| Khu vực / Quốc gia | Địa chỉ trụ sở & Văn phòng đại diện | Vai trò chức năng |
| :--- | :--- | :--- |
| **Trụ sở chính (TP.HCM)** | Tầng 3, Tòa nhà Orchard Parkview, số 130-132 Hồng Hà, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh *(và cơ sở Tòa nhà Aloha, số 68 Hồng Hà, Phường 2, Tân Bình)* | Trung tâm điều hành chiến lược, R&D và khối sản xuất phần mềm chủ lực phía Nam |
| **Chi nhánh Đà Nẵng** | Tầng 5 (Block B & Lot A2), Tòa nhà ICT1, Khu Công viên Phần mềm số 2, Đường Như Nguyệt, Phường Thuận Phước, Quận Hải Châu, TP. Đà Nẵng | Trung tâm phát triển phần mềm khu vực miền Trung, chuyên trách các dự án Cloud & Enterprise |
| **Văn phòng Hoa Kỳ (USA)** | 12110 Sunset Hills Rd, Suite 600, Reston, VA 20190, United States | Văn phòng đại diện thương mại, kết nối và quản lý dự án với khách hàng thị trường Bắc Mỹ |
| **Văn phòng Australia** | Level 45, 680 George Street, Sydney, NSW 2000, Australia | Văn phòng đại diện kinh doanh và hỗ trợ khách hàng khu vực Châu Đại Dương (Úc - New Zealand) |
| **Văn phòng Singapore** | 20 Cecil Street, #14-00 & #15-00 PLUS, Singapore 049705 | Cửa ngõ tài chính, điều phối dịch vụ phần mềm cho thị trường Đông Nam Á và Châu Á - TBD |
| **Văn phòng Thụy Sĩ** | Zurich, Switzerland | Kết nối thị trường tài chính công nghệ cao và khối khách hàng khu vực Tây Âu |

---

### 2.2. Lịch sử hình thành và các mốc phát triển chiến lược

Quá trình hình thành và phát triển của Saigon Technology là minh chứng rõ nét cho sự chuyển mình từ một nhóm kỹ sư công nghệ khởi nghiệp thành một công ty phần mềm đạt chuẩn mực quốc tế:

- **Giai đoạn 2012 - 2014 (Khởi nghiệp và tạo dựng nền tảng):** Tiền thân của Saigon Technology xuất phát điểm từ năm 2012 tại TP. Hồ Chí Minh với nhóm sáng lập chỉ gồm 3 kỹ sư phần mềm xuất sắc. Giai đoạn đầu tập trung nghiên cứu, phát triển các giải pháp phần mềm trên nền tảng Web và ứng dụng di động cho thị trường trong nước và khu vực.
- **Năm 2015 (Chính thức xác lập pháp nhân và định hướng gia công quốc tế):** Ngày 13/11/2015, Công ty Cổ phần Công nghệ Phần mềm STS chính thức được cấp Giấy phép ĐKKD. Ban Lãnh đạo xác định bước đi chiến lược mang tính sống còn: chuyển hướng 100% nguồn lực sang lĩnh vực xuất khẩu phần mềm (Software Outsourcing) áp dụng triệt để quy trình phát triển linh hoạt (Agile/Scrum).
- **Giai đoạn 2018 - 2019 (Mở rộng quy mô và Trung tâm Đà Nẵng):** Quy mô công ty vượt mốc 100 nhân sự. Khai trương Trung tâm phát triển phần mềm tại Thành phố Đà Nẵng (Khu Phần mềm Đà Nẵng, tòa nhà ICT1), mở rộng không gian nghiên cứu phát triển và tiếp cận nguồn nhân tài kỹ thuật dồi dào của miền Trung.
- **Năm 2020 (Chuẩn hóa hệ thống quản lý quốc tế):** Chuyển trụ sở chính tại TP.HCM về khu phức hợp Hồng Hà diện tích hơn 2.000m². Đạt chứng nhận Hệ thống quản lý chất lượng **ISO 9001:2015** và Hệ thống quản lý an toàn thông tin **ISO/IEC 27001:2013** do tổ chức BSI (Vương quốc Anh) và DAS đánh giá cấp chứng chỉ. Được Hiệp hội Phần mềm và Dịch vụ CNTT Việt Nam (VINASA) vinh danh tại **Giải thưởng Sao Khuê**.
- **Giai đoạn 2021 - 2023 (Khẳng định vị thế toàn cầu):** Đạt chứng nhận quốc tế danh giá *"Great Place to Work"* (Môi trường làm việc lý tưởng); lọt Top 15 Doanh nghiệp gia công phần mềm Agile hàng đầu Việt Nam do VINASA bình chọn; liên tục dẫn đầu bảng xếp hạng nhà phát triển phần mềm uy tín tại Việt Nam trên nền tảng quốc tế Clutch (điểm xếp hạng 4.8/5 sao). Thiết lập mạng lưới văn phòng đại diện thương mại tại Mỹ, Úc, Singapore và Thụy Sĩ.
- **Giai đoạn 2024 - 2026 (Đột phá công nghệ và Số hóa toàn diện):** Đội ngũ nhân sự phát triển vượt mức 430 kỹ sư; hoàn thành hơn 850 dự án cho hơn 350 khách hàng doanh nghiệp trên toàn cầu; mở rộng năng lực sang Trí tuệ nhân tạo (AI & Machine Learning), Điện toán đám mây (Cloud Migration AWS/Azure); và đặt trọng tâm xây dựng Hệ thống thông tin quản trị nhân lực để số hóa toàn diện bộ máy vận hành nội bộ.

---

### 2.3. Tầm nhìn chiến lược, Sứ mệnh phát triển và Hệ giá trị cốt lõi

Văn hóa doanh nghiệp và định hướng kinh doanh của Saigon Technology được xây dựng vững chắc trên kim chỉ nam:

#### A. Tầm nhìn chiến lược (Vision)
*"To be Vietnam's trusted software outsourcing company where clients can find the most affordable and high quality software development services."*  
(Trở thành công ty gia công phần mềm đáng tin cậy nhất của Việt Nam, nơi khách hàng toàn cầu luôn tìm thấy các giải pháp phát triển phần mềm chất lượng cao với chi phí tối ưu và cạnh tranh nhất).

#### B. Sứ mệnh phát triển (Mission)
*"To offer the best and the most effective software outsourcing services to our customers."*  
(Cung cấp các dịch vụ gia công phát triển phần mềm tốt nhất, hiệu quả nhất cho khách hàng; mang trí tuệ và tài năng công nghệ của kỹ sư Việt Nam vươn tầm thế giới; đồng thời kiến tạo môi trường làm việc nhân bản, lấy con người làm trọng tâm để nhân viên phát huy tối đa tiềm năng).

#### C. Khẩu hiệu hành động (Slogan / Motto)
**"Your success is our mission"** (Thành công của bạn là sứ mệnh của chúng tôi).

#### D. Hệ thống 5 Giá trị cốt lõi (5 Core Values)
1. **Result-Orientation (Hướng tới kết quả):** Đặt mục tiêu rõ ràng, quyết tâm vượt qua mọi khó khăn kỹ thuật để bàn giao sản phẩm phần mềm đúng tiến độ, đạt chuẩn mực chất lượng cao nhất đã cam kết với khách hàng.
2. **Customer-Focus (Tập trung vào khách hàng):** Lắng nghe sâu sắc nhu cầu của đối tác, coi sự thành công và hài lòng bền vững của khách hàng là thước đo giá trị cao nhất của doanh nghiệp.
3. **Integrity (Chính trực & Minh bạch):** Giữ trọn sự trung thực trong mọi cam kết, minh bạch tuyệt đối về chi phí, mã nguồn và tiến độ công việc, tuân thủ nghiêm ngặt chuẩn mực đạo đức kinh doanh quốc tế.
4. **Empowerment (Trao quyền & Khuyến khích đổi mới):** Tin tưởng, trao quyền tự chủ chuyên môn cho các kỹ sư và quản trị viên, khuyến khích tư duy đổi mới sáng tạo và tạo không gian phát triển nghề nghiệp công bằng.
5. **Collaboration (Hợp tác & Tinh thần đồng đội):** Đề cao sức mạnh tập thể, thúc đẩy sự chia sẻ tri thức liên phòng ban và tương tác cởi mở, không rào cản giữa các thành viên.

---

### 2.4. Lĩnh vực hoạt động kinh doanh, Dịch vụ phần mềm và Nền tảng công nghệ

#### A. Các dịch vụ chuyên môn cốt lõi
Saigon Technology cung cấp giải pháp gia công phần mềm toàn diện (End-to-End Software Outsourcing Solutions) vận hành theo phương pháp luận Agile/Scrum:
- **Phát triển phần mềm tùy chỉnh theo yêu cầu (Custom Software Development):** Thiết kế, kiến trúc và xây dựng các hệ thống quản trị doanh nghiệp (ERP, CRM, HRM, DMS) và nền tảng kinh doanh trực tuyến SaaS theo yêu cầu chuyên biệt.
- **Phát triển ứng dụng Web và Di động (Web & Mobile Application Development):** Xây dựng các ứng dụng Web hiện đại chịu tải cao và ứng dụng di động đa nền tảng (iOS & Android) với trải nghiệm người dùng tối ưu.
- **Trung tâm phát triển phần mềm chuyên trách (Offshore Development Center - ODC / Dedicated Team):** Cung ứng các đội ngũ kỹ sư phần mềm chuyên biệt toàn thời gian, phối hợp ăn khớp theo múi giờ và văn hóa của khách hàng quốc tế.
- **Dịch vụ Điện toán đám mây và DevOps (Cloud Solutions & DevOps Automation):** Tư vấn kiến trúc Cloud-Native, di chuyển hạ tầng lên đám mây (AWS, Microsoft Azure, Google Cloud Platform) và thiết lập đường ống CI/CD tự động hóa kiểm thử, triển khai.
- **Kỹ nghệ Trí tuệ nhân tạo và Dữ liệu lớn (AI & Machine Learning Engineering):** Xây dựng các mô hình học máy (Machine Learning), xử lý ngôn ngữ tự nhiên (NLP), thị giác máy tính (Computer Vision) và nhận diện sinh trắc học ứng dụng vào chuyển đổi số.
- **Kiểm thử chất lượng và An toàn bảo mật phần mềm (Software QA, QC & Security Testing):** Cung cấp dịch vụ kiểm thử tự động (Automation Testing), kiểm thử chức năng, tải trọng và đánh giá an toàn thông tin theo chuẩn quốc tế.

#### B. Nền tảng công nghệ chủ lực (Technology Stack)
- *Backend & Hệ thống phân tán:* .NET Core / C#, Java Spring Boot, Node.js (NestJS, Express), Python (Django, FastAPI), Golang, PHP (Laravel).
- *Frontend & Di động:* React.js, Next.js, Angular, Vue.js, TypeScript, Flutter, React Native, iOS Swift, Android Kotlin.
- *Cơ sở dữ liệu & Dữ liệu lớn:* PostgreSQL, MySQL, Microsoft SQL Server, MongoDB, Redis, Elasticsearch.
- *Hạ tầng & Đám mây:* Docker, Kubernetes, AWS, Microsoft Azure, Google Cloud, Terraform, Jenkins, GitHub Actions.

#### C. Cơ cấu thị trường và khách hàng quốc tế
Doanh thu của Saigon Technology đến từ các thị trường phát triển hàng đầu thế giới:
- **Hoa Kỳ & Canada (~45%):** Thị trường lớn nhất với các dự án phần mềm tài chính, y tế và nền tảng SaaS khởi nghiệp.
- **Australia & New Zealand (~25%):** Các dự án ODC dài hạn trong lĩnh vực quản lý bất động sản, logistics và giáo dục trực tuyến.
- **Tây Âu & Thụy Sĩ (~20%):** Hợp tác với các tập đoàn và viện nghiên cứu trong lĩnh vực FinTech, chuỗi cung ứng và ngân hàng số.
- **Singapore & Châu Á (~10%):** Các giải pháp thương mại điện tử và thành phố thông minh.

---

### 2.5. Hệ thống chứng nhận quốc tế và Giải thưởng thành tựu

Uy tín của doanh nghiệp được khẳng định qua hệ thống chứng nhận chất lượng và các giải thưởng chuyên ngành:

**Bảng 1.3. Tổng hợp chứng nhận quốc tế và giải thưởng tiêu biểu của Saigon Technology**

| Nhóm chứng nhận / Giải thưởng | Tên danh hiệu / Tiêu chuẩn | Tổ chức đánh giá & Cấp phép | Năm đạt được / Hiệu lực |
| :--- | :--- | :--- | :--- |
| **Quản lý chất lượng** | **ISO 9001:2015** | BSI (Vương quốc Anh) & DAS Certification | Đạt năm 2020, duy trì thường niên |
| **An toàn thông tin** | **ISO/IEC 27001:2013** | BSI (Vương quốc Anh) & DAS Certification | Đạt năm 2020, duy trì nghiêm ngặt |
| **Môi trường làm việc** | **Great Place to Work Certification** | Great Place to Work® Institute (Hoa Kỳ) | Vinh danh liên tiếp 2021, 2022, 2023 |
| **Giải thưởng ngành CNTT Việt Nam** | **Giải thưởng Sao Khuê** (Hạng mục Xuất khẩu phần mềm) | Hiệp hội Phần mềm và Dịch vụ CNTT Việt Nam (VINASA) | Đạt giải các năm 2020, 2021, 2022 |
| **Xếp hạng doanh nghiệp Agile** | **Top 15 Doanh nghiệp gia công phần mềm Agile hàng đầu** | VINASA bình chọn | Vinh danh liên tục |
| **Bảng xếp hạng B2B quốc tế** | **Top 1 Software Development Company in Vietnam / Top 100 Global** | Clutch.co (Nền tảng đánh giá B2B uy tín của Mỹ) | 2021, 2022, 2023 (Rating: 4.8/5.0) |
| **Đối tác công nghệ toàn cầu** | **Microsoft Solutions Partner & AWS Partner** | Microsoft Corporation & Amazon Web Services | Ký kết hợp tác chính thức |

---

### 2.6. Cơ cấu tổ chức bộ máy quản lý và Mạng lưới ODC

Cơ cấu tổ chức của Công ty Cổ phần Phần mềm Saigon Technology được thiết lập theo mô hình ma trận chức năng kết hợp phân tán địa lý (Functional Matrix & Distributed Delivery Model). Hệ thống cơ cấu tổ chức hiện thời được cấu hình đồng bộ trực tiếp trong cơ sở dữ liệu và phần mềm quản trị nhân lực hệ thống quản trị nhân lực gồm **38 đơn vị phân cấp** thuộc 5 Khối chức năng ngang hàng và Ban Giám đốc.

![Hình 1.1: Sơ đồ cơ cấu tổ chức tổng thể Công ty Saigon Technology](images/hinh_1_1_org_chart.png)


Dưới sự chỉ đạo của Đại hội đồng Cổ đông và Ban Giám đốc, cơ cấu tổ chức được phân định rõ ràng thành 5 Khối chức năng chuyên biệt:

#### A. Cấp Quản trị Sở hữu và Ban Giám đốc Điều hành
- **Đại hội đồng Cổ đông (ĐHCĐ):** Cơ quan quyết định cao nhất của công ty cổ phần, thông qua các định hướng kinh doanh chiến lược, kế hoạch phát hành cổ phiếu thưởng ESOP và phê chuẩn ngân sách hoạt động hàng năm.
- **Ban Giám đốc Điều hành (BGD):** Đứng đầu là **Tổng Giám đốc (CEO Phạm Tiến Thành - "Bruce" Pham)**, cùng các Phó Giám đốc điều hành phụ trách Sản xuất kỹ thuật, Kinh doanh quốc tế, Tài chính và Khối nhân sự. Ban Giám đốc là cấp quyết định tối cao đối với các biến động nhân sự then chốt: phê chuẩn định biên dự án, bổ nhiệm cán bộ cấp cao, phê duyệt chỉ tiêu tuyển dụng vượt khung và thực thi lệnh khóa bất biến kỳ tính lương (LOCKED).

#### B. Khối Quản trị Nguồn nhân lực & Khối Vận hành - Pháp chế (Bộ đôi điều phối & hỗ trợ)
Cơ cấu tổ chức của Saigon Technology tách bạch chuyên môn hóa cao: Khối Quản trị Nguồn nhân lực (HR) tập trung sâu vào chiến lược phát triển con người, trong khi Khối Vận hành & Pháp chế (OPS) bảo đảm nền tảng hạ tầng công nghệ và tính tuân thủ pháp luật:

![Hình 1.2: Cơ cấu chi tiết Khối Quản trị Nguồn nhân lực và Khối Vận hành & Pháp chế](images/hinh_1_2_hr_admin.png)


- **Khối Quản trị Nguồn nhân lực (HR):**
  1. *Phòng Tuyển dụng Công nghệ (HR-TA):* Thực hiện chiến dịch săn tìm nhân tài công nghệ cao (Tech Talent Acquisition), phụ trách phễu tuyển dụng ATS từ tiếp nhận hồ sơ, sàng lọc, điều phối phỏng vấn kỹ thuật đến phát hành thư mời nhận việc (Offer Letter).
  2. *Phòng Tiền lương & Phúc lợi (HR-C&B):* Quản lý dữ liệu chấm công đa nguồn, vận hành công cụ tính toán tiền lương tự động (Automated Payroll Engine), trích nộp bảo hiểm xã hội bắt buộc, tính thuế thu nhập cá nhân theo biểu lũy tiến từng phần, kiểm soát hạn mức trích nợ vay phúc lợi theo Điều 102 BLLĐ 2019 và rà soát nâng bậc lương thường xuyên theo Nghị định 204/2004/NĐ-CP.
  3. *Phòng Đào tạo & Phát triển (HR-L&D):* Thiết kế và điều phối lộ trình hội nhập 14 ngày cho nhân viên mới, tổ chức các khóa bồi dưỡng kỹ năng công nghệ (AI, Cloud, DevOps), tài trợ thi chứng chỉ quốc tế và quản trị hệ thống tri thức số.
  4. *Phòng Nhân sự Vận hành & Văn hóa (HR-OPS):* Chịu trách nhiệm quản trị hồ sơ cán bộ toàn diện Mẫu 2C-BNV (111 trường dữ liệu và 8 bảng diễn biến), quản lý hợp đồng lao động, chủ trì chu kỳ đánh giá hiệu suất 360 độ, thực thi các thủ tục thuyên chuyển, khen thưởng, kỷ luật, tiếp nhận và hòa giải khiếu nại của người lao động.
- **Khối Vận hành & Pháp chế (OPS):**
  1. *Phòng IT & An ninh Mạng (OPS-IT):* Đảm bảo hạ tầng công nghệ, quản trị mạng, cấp phát quyền truy cập email, máy chủ dự án; thực thi nghiêm ngặt tiêu chuẩn an toàn thông tin ISO/IEC 27001 và chính sách bảo vệ dữ liệu cá nhân (xóa dữ liệu vector sinh trắc học khi nhân sự nghỉ việc theo Nghị định 13/2023/NĐ-CP).
  2. *Phòng Hành chính & Cơ sở vật chất (OPS-ADMIN):* Quản lý cơ sở vật chất văn phòng TP.HCM và Đà Nẵng, điều phối lễ tân, mua sắm và cấp phát tài sản làm việc (laptop, màn hình), đồng thời là chốt chặn thu hồi tài sản trong quy trình thôi việc.
  3. *Ban Pháp chế & Tuân thủ (OPS-LEGAL):* Rà soát pháp lý hợp đồng cung ứng dịch vụ phần mềm quốc tế, bảo vệ quyền sở hữu trí tuệ công nghệ và thẩm định tính pháp lý trong các vụ việc xử lý kỷ luật lao động.

#### C. Khối Kỹ thuật & Sản xuất Phần mềm (DELIVERY)
Khối Delivery là "trung tâm sản xuất" tạo ra toàn bộ doanh thu của doanh nghiệp, quy tụ lực lượng kỹ sư tại hai trung tâm công nghệ TP.HCM và Đà Nẵng:

![Hình 1.3: Cơ cấu chi tiết Khối Kỹ thuật & Sản xuất Phần mềm](images/hinh_1_3_delivery.png)


- *Phòng Quản lý Dự án (PMO):* Thiết lập và giám sát chuẩn mực thực thi dự án Agile/Scrum, kiểm soát Milestone bàn giao cho khách hàng quốc tế, quản trị định biên và điều phối nhân sự kỹ thuật giữa các dự án.
- *Phòng Phân tích Nghiệp vụ (BA & UI/UX):* Khảo sát yêu cầu khách hàng, xây dựng tài liệu đặc tả chức năng (SRS) và thiết kế hệ thống giao diện người dùng tối ưu.
- *Trung tâm Phần mềm TP.HCM (DEV-SGN):* Gồm 5 Squad công nghệ chủ lực: Web Frontend & Fullstack, Backend Microservices, Ứng dụng di động, DevOps & Cloud, và AI & Data Engineering.
- *Trung tâm Phần mềm Đà Nẵng (DEV-DAD):* Gồm 4 Squad chuyên môn: Ứng dụng doanh nghiệp, Web & Cloud Solutions, Mobile & IoT Solutions, và Hạ tầng & DevOps.
- *Phòng Đảm bảo Chất lượng (QA/QC):* Gồm Nhóm Kiểm thử tự động (Automation QA) và Nhóm Kiểm thử thủ công & An toàn bảo mật (Manual & Security QA).

#### D. Khối Phát triển Kinh doanh (BIZ)
- *Phòng Kinh doanh Quốc tế (BIZ-GLOBAL):* Đàm phán và ký kết các hợp đồng gia công phần mềm với khách hàng tại thị trường trọng điểm Mỹ, Úc, Châu Âu, Nhật Bản và Singapore.
- *Phòng Kinh doanh Doanh nghiệp (BIZ-DOMESTIC):* Phát triển giải pháp chuyển đổi số cho khối doanh nghiệp và tổ chức tài chính tại Việt Nam.
- *Phòng Khách hàng Chiến lược (BIZ-KAM):* Quản lý chăm sóc và mở rộng doanh thu từ các đối tác lớn dài hạn.
- *Phòng Marketing & Truyền thông (BIZ-MKT):* Quảng bá thương hiệu công nghệ, xây dựng thương hiệu nhà tuyển dụng và tổ chức các sự kiện kết nối cộng đồng.

#### E. Khối Tài chính - Kế toán (FIN)
- *Phòng Kế toán Doanh nghiệp & Thuế (FIN-ACC):* Hạch toán chi phí tiền lương, bảo hiểm, quyết toán thuế thu nhập doanh nghiệp và thuế TNCN.
- *Phòng Thanh toán & Dòng tiền (FIN-TREASURY):* Quản lý dòng tiền, trực tiếp thực hiện lệnh chi trả lương qua ngân hàng, chi trả tạm ứng công tác phí và giải ngân khoản vay phúc lợi.
- *Phòng Kế hoạch Tài chính (FIN-FP&A):* Dự báo ngân sách tiền lương, phân tích biên lợi nhuận dự án (Project Costing) và thẩm định nguồn tài chính cho các đề xuất tuyển dụng mới.

---

### 2.7. Đặc điểm cơ cấu nguồn nhân lực của doanh nghiệp

Nguồn nhân lực là tài sản quý giá nhất tại một doanh nghiệp xuất khẩu phần mềm. Việc phân tích đặc điểm nhân sự là cơ sở thực tiễn để thiết kế chính xác các phân hệ trong hệ thống:

**Bảng 1.4. Cơ cấu nguồn nhân lực theo khối chức năng và trình độ tại Saigon Technology**

| Khối chức năng | Số lượng nhân sự | Tỷ lệ (%) | Trình độ Đại học / Thạc sĩ | Ngoại ngữ (Tiếng Anh lưu loát) | Địa bàn làm việc chính |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Khối Kỹ thuật & Sản xuất (DELIVERY)** | **239** | 55.6% | 100% (Kỹ sư CNTT) | 100% (IELTS 6.0+ / TOEIC 750+) | TP.HCM (60%) & Đà Nẵng (40%) |
| **Khối Quản trị Nhân lực (HR)** | **44** | 10.2% | 100% (Cử nhân QTNL/Luật/Kinh tế)| 85% | TP.HCM & Đà Nẵng |
| **Khối Vận hành & Pháp chế (OPS)** | **24** | 5.6% | 100% (Cử nhân Luật/CNTT) | 80% | TP.HCM & Đà Nẵng |
| **Khối Phát triển Kinh doanh (BIZ)** | **96** | 22.3% | 100% (Cử nhân Kinh tế/QTKD) | 100% (IELTS 7.0+ / Bản ngữ) | TP.HCM, Mỹ, Úc, Singapore |
| **Khối Tài chính - Kế toán (FIN)** | **27** | 6.3% | 100% (Cử nhân Tài chính/Kế toán)| 75% | TP.HCM |
| **Tổng toàn công ty** | **430+** | **100.0%** | **100%** | **~95%** | **TP.HCM, Đà Nẵng & Quốc tế** |

Các đặc thù nổi bật của lực lượng lao động tại Saigon Technology:
1. *Độ tuổi trẻ trung và tốc độ thích ứng công nghệ cao:* Độ tuổi bình quân của nhân viên là 27.5 tuổi. Đây là lực lượng lao động tri thức năng động, có năng lực tự học cao, kỳ vọng môi trường làm việc số hóa, minh bạch về thông tin và tương tác nhanh qua các ứng dụng trực tuyến.
2. *Đặc thù làm việc linh hoạt (Hybrid & Flexible Shifts):* Để đáp ứng yêu cầu phối hợp với khách hàng tại các múi giờ khác nhau (Bắc Mỹ lệch 12-14 giờ, Úc lệch 3-4 giờ, Châu Âu lệch 5-6 giờ), doanh nghiệp áp dụng chế độ làm việc linh hoạt (Flexitime), kết hợp làm việc tại văn phòng và làm việc từ xa (Work From Home). Điều này đặt ra bài toán phức tạp cho phân hệ chấm công và ca kíp.
3. *Chính sách phát triển nhân tài và giữ chân nhân sự:* Do áp lực cạnh tranh nhân tài gay gắt trong ngành CNTT, công ty chú trọng chính sách đãi ngộ toàn diện: tài trợ 100% chi phí thi chứng chỉ công nghệ quốc tế (AWS, Microsoft, PMP, Scrum Master), duy trì Quỹ phúc lợi 2 tỷ VNĐ hỗ trợ nhân viên vay mua thiết bị và nhà ở với lãi suất ưu đãi, chu kỳ đánh giá hiệu suất 360 độ và rà soát lương định kỳ.

---

### 2.8. Thực trạng quản trị nhân lực và ứng dụng CNTT trước khi triển khai hệ thống quản trị nhân lực (As-Is Assessment)

Trước khi đề tài nghiên cứu và xây dựng hệ thống thông tin quản trị nhân lực, phương thức quản lý tại Saigon Technology bộc lộ nhiều điểm nghẽn nghiêm trọng:
- **Phân mảnh dữ liệu (Data Silos):** Hồ sơ nhân sự lưu rải rác trên các tệp Excel cá nhân của từng chuyên viên; thông tin hợp đồng và văn bằng lưu bản cứng tại kho văn phòng; dữ liệu chấm công nằm cô lập tại các đầu đọc thẻ máy chấm công chi nhánh; dữ liệu biến động nhân sự trao đổi qua email và ứng dụng Slack/Teams.
- **Rủi ro sai lệch trong tính toán tiền lương và tuân thủ pháp luật:** Việc tính lương hàng tháng cho hơn 430 nhân viên với nhiều loại hợp đồng, nhiều mức trợ cấp, khấu trừ bảo hiểm xã hội và thuế thu nhập cá nhân lũy tiến được thực hiện thủ công bằng công thức bảng tính Excel. Quá trình này mất từ 4-6 ngày làm việc của toàn bộ tổ C&B, tiềm ẩn nguy cơ sai sót số liệu và vi phạm quy định pháp lý (như trích nợ vượt quá 30% lương thực lĩnh theo Điều 102 BLLĐ 2019).
- **Quy trình phê duyệt giấy tờ cồng kềnh, thiếu minh bạch:** Đơn xin nghỉ phép, đăng ký làm thêm giờ và đề xuất tuyển dụng phải in tờ trình giấy hoặc gửi email chờ ký duyệt qua 3 cấp, dẫn đến độ trễ cao và hoàn toàn thiếu nhật ký kiểm toán (Audit Trail) để truy vết trách nhiệm.
- **Thiếu cổng tự phục vụ cho nhân viên (No Employee Self-Service):** Nhân viên không thể chủ động kiểm tra số ngày phép còn lại, không xem được chi tiết phiếu lương bảo mật và phải liên hệ trực tiếp với bộ phận nhân sự để tra cứu thông tin cơ bản, gây quá tải cho đội ngũ HR-OPS.

Đứng trước thực trạng trên, Ban Giám đốc Saigon Technology đã chỉ đạo triển khai cấp bách dự án **Thiết kế và Xây dựng Hệ thống Thông tin Quản trị Nhân lực Toàn diện ** nhằm tin học hóa toàn diện chu trình nhân sự, xóa bỏ tình trạng phân mảnh dữ liệu và xây dựng nền tảng quản trị nguồn nhân lực số hiện đại.

---

### 2.9. Mối quan hệ liên kết nghiệp vụ và Mô hình phối hợp 3 mắt xích

Mọi quyết định và luồng nghiệp vụ nhân sự trong toàn công ty được vận hành theo cơ chế phối hợp ba mắt xích cốt lõi: **Ban Giám đốc (Quyết định - Decision) — Các Khối Chức năng Điều phối (Trung tâm - Hub) — Các Khối Sản xuất & Kinh doanh (Cầu nối thực thi - Bridge)**:

![Hình 1.4: Mô hình phối hợp 3 mắt xích cốt lõi](images/hinh_1_4_matrix_3links.png)





## 3. Mục tiêu và nhiệm vụ

Mục tiêu tổng quát của đề tài là ứng dụng phương pháp luận phân tích thiết kế hệ thống hướng đối tượng để xây dựng một giải pháp phần mềm quản trị nhân lực toàn diện, hiện đại, đáp ứng đầy đủ các yêu cầu nghiệp vụ thực tế tại Công ty Cổ phần Phần mềm Saigon Technology.

Để hoàn thành mục tiêu tổng quát nêu trên, đề tài tập trung giải quyết các nhiệm vụ cụ thể sau:

Một là, khảo sát và phân tích toàn diện hiện trạng tổ chức, mô hình sản xuất phần mềm và các quy trình nghiệp vụ nhân sự thực tế tại Saigon Technology; làm rõ các điểm nghẽn trong công tác quản lý hiện hữu.

Hai là, tổng hợp cơ sở lý luận về quản trị nhân lực hiện đại và phương pháp phân tích thiết kế hướng đối tượng (OOAD) sử dụng ngôn ngữ mô hình hóa UML; nghiên cứu các chuẩn mực pháp lý về lao động, tiền lương, bảo hiểm xã hội, thuế thu nhập cá nhân và quy định bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.

Ba là, xác định các tác nhân và xây dựng danh mục 47 Use Case hoàn chỉnh theo vòng đời nhân sự; phân tích các mô hình hành vi động (biểu đồ trình tự, biểu đồ hoạt động, biểu đồ trạng thái) và mô hình cấu trúc tĩnh (biểu đồ lớp, mô hình dữ liệu quan hệ, kiến trúc phần mềm 3 tầng).

Bốn là, hiện thực hóa các giải pháp thiết kế vào mã nguồn cài đặt thực tế với công nghệ hiện đại (Next.js 14, NestJS 10, PostgreSQL 16, Prisma ORM, Docker); tổ chức kiểm thử chức năng và đánh giá hiệu quả vận hành của hệ thống.

Năm là, đánh giá ưu điểm, hạn chế và đề xuất định hướng phát triển, nâng cấp hệ thống trong các giai đoạn tiếp theo.

## 4. Đối tượng và phạm vi nghiên cứu

Đối tượng nghiên cứu của đề tài là các quy trình nghiệp vụ quản trị nguồn nhân lực trong doanh nghiệp phần mềm và phương pháp luận phân tích thiết kế hệ thống thông tin hướng đối tượng (OOAD) sử dụng UML.

Phạm vi nghiên cứu:
- Về nội dung: Nghiên cứu trọn vẹn vòng đời quản trị nhân sự tại Saigon Technology, bao gồm: tuyển dụng ứng viên (ATS), tiếp nhận hồ sơ và hội nhập, phân ca và điểm danh đa nguồn, quản lý nghỉ phép và làm thêm giờ, chu kỳ tính lương và phúc lợi (tạm ứng, khoản vay), biến động nhân sự và thôi việc bàn giao, đánh giá hiệu suất 360 độ, quản lý tri thức nội bộ và báo cáo hồ sơ cán bộ theo chuẩn Mẫu 2C-BNV/2008.
- Về không gian: Tập trung khảo sát và áp dụng tại hai trung tâm sản xuất phần mềm chính của Công ty Cổ phần Phần mềm Saigon Technology tại Thành phố Hồ Chí Minh và thành phố Đà Nẵng.
- Về thời gian: Số liệu khảo sát và các quy định pháp luật được cập nhật tính đến năm 2026.

## 5. Cấu trúc của báo cáo

Nội dung báo cáo kết thúc học phần được bố cục thành ba phần chính:

Phần Mở đầu: Trình bày lý do chọn đề tài, giới thiệu tổng quan về Công ty Cổ phần Phần mềm Saigon Technology, mục tiêu, nhiệm vụ, đối tượng, phạm vi nghiên cứu và cấu trúc của báo cáo.

Phần Nội dung: Gồm ba chương:
- Chương 1: Cơ sở lý luận về quản trị nhân lực và hệ thống thông tin quản trị nhân lực. Trình bày lý thuyết nền tảng, các công cụ, phương pháp mô hình hóa và phát biểu bài toán nghiệp vụ cần giải quyết tại doanh nghiệp.
- Chương 2: Thiết kế hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Phần mềm Saigon Technology. Đây là chương trọng tâm, thể hiện chi tiết phân tích yêu cầu, xác định tác nhân, danh sách 47 use case, đặc tả nghiệp vụ, biểu đồ trình tự, biểu đồ hoạt động, biểu đồ trạng thái, biểu đồ lớp, thiết kế cơ sở dữ liệu, giao diện người dùng và kiến trúc hệ thống 3 tầng.
- Chương 3: Kết quả đạt được và đề xuất, khuyến nghị hoặc hướng nghiên cứu phát triển. Tổng kết các kết quả định lượng, đánh giá ưu nhược điểm và vạch ra lộ trình hoàn thiện hệ thống trong tương lai.

Tài liệu tham khảo: Danh mục các giáo trình, văn bản quy phạm pháp luật và tài liệu kỹ thuật được sử dụng trong quá trình nghiên cứu.

---

# PHẦN NỘI DUNG

# CHƯƠNG 1: CƠ SỞ LÝ LUẬN VỀ QUẢN TRỊ NHÂN LỰC VÀ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC

## 1.1. Lý thuyết cơ sở

### 1.1.1. Tổng quan về quản trị nhân lực

Quản trị nhân lực (Human Resource Management - HRM) là hệ thống các triết lý, chính sách và hoạt động chức năng nhằm thu hút, đào tạo, phát triển và duy trì đội ngũ người lao động, bảo đảm tổ chức đạt được các mục tiêu chiến lược đề ra. Trong các doanh nghiệp công nghệ cao như Saigon Technology, nguồn lực con người giữ vị trí trung tâm, trực tiếp kiến tạo giá trị thông qua các sản phẩm phần mềm và giải pháp chuyển đổi số cho khách hàng toàn cầu.

Quản trị nhân lực hiện đại bao gồm sáu nhóm chức năng cốt lõi: hoạch định nguồn nhân lực và tuyển dụng; đào tạo và phát triển năng lực chuyên môn; quản lý hiệu suất và đánh giá thành tích; đãi ngộ, tiền lương và phúc lợi (C&B); quan hệ lao động và tuân thủ pháp lý; quản lý thông tin và hồ sơ nhân sự. Sự phối hợp đồng bộ giữa các chức năng này tạo nên một môi trường làm việc chuyên nghiệp, khích lệ tinh thần đổi mới sáng tạo và giảm thiểu tỷ lệ biến động nhân sự.

### 1.1.2. Hệ thống thông tin quản trị nhân lực

Hệ thống thông tin quản trị nhân lực là sự kết hợp giữa quy trình quản trị nhân sự với công nghệ thông tin và truyền thông. Hệ thống thu thập, lưu trữ, xử lý và phân phối thông tin liên quan đến nguồn nhân lực, đóng vai trò là xương sống vận hành số của doanh nghiệp.

Khác với các hệ thống thông tin thông thường, hệ thống thông tin nhân sự mang tính ràng buộc pháp lý rất cao. Mọi dữ liệu về hợp đồng lao động, thời gian làm việc, mức trích nộp bảo hiểm xã hội hay khấu trừ thuế thu nhập cá nhân đều phải tuân thủ nghiêm ngặt theo các quy định của Bộ luật Lao động, Luật Bảo hiểm xã hội và Luật Thuế. Do đó, hệ thống không chỉ thuần túy thực hiện các tác vụ lưu trữ dữ liệu (CRUD) mà còn phải cài đặt các quy tắc kiểm soát nghiệp vụ chặt chẽ, bảo đảm tính toàn vẹn và khả năng truy vết lịch sử dữ liệu.

### 1.1.3. Quy trình xây dựng và phương pháp phân tích thiết kế hệ thống

Quy trình phát triển hệ thống phần mềm trải qua các giai đoạn chính: khảo sát hiện trạng, phân tích yêu cầu nghiệp vụ, thiết kế hệ thống, lập trình cài đặt, kiểm thử và chuyển giao vận hành. Trong đó, giai đoạn phân tích và thiết kế giữ vai trò quyết định đến độ tin cậy, tính linh hoạt và khả năng mở rộng của phần mềm.

Phương pháp phân tích và thiết kế hướng đối tượng (OOAD) tiếp cận bài toán thực tế bằng cách mô hình hóa hệ thống thành tập hợp các đối tượng tương tác với nhau, mang đầy đủ thuộc tính (dữ liệu) và phương thức (hành vi). OOAD vận dụng triệt để bốn nguyên lý trụ cột của lập trình hướng đối tượng: trừu tượng hóa (Abstraction), bao đóng (Encapsulation), kế thừa (Inheritance) và đa hình (Polymorphism).

Ngôn ngữ mô hình hóa thống nhất (UML) được sử dụng làm phương tiện trực quan để đặc tả, thiết kế và tài liệu hóa các thành phần của hệ thống thông qua các sơ đồ tiêu chuẩn:
- Biểu đồ Use Case: Mô tả ranh giới hệ thống, xác định các tác nhân và các chức năng mà hệ thống cung cấp;
- Biểu đồ Trình tự (Sequence Diagram): Mô hình hóa sự tương tác và truyền thông điệp giữa các đối tượng theo dòng thời gian để hoàn thành một kịch bản nghiệp vụ cụ thể;
- Biểu đồ Hoạt động (Activity Diagram): Trực quan hóa luồng điều khiển, các bước xử lý tuần tự, rẽ nhánh hoặc song song trong quy trình;
- Biểu đồ Trạng thái (State Diagram): Mô tả các trạng thái khác nhau của một đối tượng quan trọng trong suốt vòng đời của nó và các sự kiện kích hoạt chuyển trạng thái;
- Biểu đồ Lớp (Class Diagram): Thể hiện cấu trúc tĩnh của hệ thống, bao gồm các lớp, thuộc tính, phương thức và các mối quan hệ (kế thừa, liên kết, phụ thuộc, hợp thành) giữa chúng.

### 1.1.4. Công cụ và phần mềm ứng dụng

Trong đề tài này, các công cụ và nền tảng công nghệ hiện đại được lựa chọn nhằm bảo đảm tính chuyên nghiệp và khả năng triển khai thực tế:
- Công cụ mô hình hóa: Sử dụng PlantUML và Draw.io để xây dựng các biểu đồ UML chuẩn mực;
- Hệ quản trị cơ sở dữ liệu: Sử dụng PostgreSQL 16 kết hợp với Prisma ORM, quản trị 87 model quan hệ chia thành 10 miền dữ liệu nghiệp vụ, hỗ trợ tìm kiếm toàn văn (FTS) và lưu trữ nhật ký kiểm toán bất biến (Append-Only Audit Log);
- Tầng máy chủ nghiệp vụ (Backend): Xây dựng trên nền tảng NestJS 10 (TypeScript) với 39 module nghiệp vụ chuyên sâu, phân tầng rõ ràng theo mô hình Controller - Service - DTO - Entity, tích hợp hai bộ phận dùng chung: Động cơ phê duyệt biến động nhân sự (Approval Engine) và Động cơ tính toán tiền lương tự động (Payroll Engine);
- Tầng giao diện người dùng (Frontend): Xây dựng bằng Next.js 14 (App Router) với 31 màn hình ứng dụng thực tế phân bổ thành 7 phân hệ nghiệp vụ chuẩn hóa, thiết kế đáp ứng đa thiết bị (Responsive Design) và tuân thủ các quy chuẩn hiển thị doanh nghiệp;
- Đóng gói và triển khai: Toàn bộ hệ thống được container hóa bằng Docker Compose với ba dịch vụ độc lập: cơ sở dữ liệu, máy chủ API và máy chủ Web.

## 1.2. Một số vấn đề liên quan đến chủ đề "Xây dựng hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Phần mềm Saigon Technology"

### 1.2.1. Ý nghĩa

Xây dựng hệ thống thông tin quản trị nhân lực cho Saigon Technology đồng nghĩa với việc số hóa trọn vẹn vòng đời lao động: từ thời điểm ứng viên nộp hồ sơ, tham gia phỏng vấn, ký hợp đồng thử việc, điểm danh làm việc hàng ngày, đăng ký nghỉ phép, nhận lương định kỳ cho đến khi hoàn tất các thủ tục bàn giao thôi việc. Hệ thống giúp doanh nghiệp nâng cao tính chuẩn hóa dữ liệu, xóa bỏ rủi ro sai sót thủ công và thiết lập một hạ tầng quản trị nhân sự số hóa vững chắc.

### 1.2.2. Vai trò

Hệ thống đóng vai trò kiểm soát trạng thái các thực thể nhân sự, bảo đảm mọi bước chuyển đổi trạng thái (như chuyển từ thử việc sang chính thức, khóa bảng lương, ban hành quyết định thôi việc) đều phải có đầy đủ chứng từ và phê chuẩn pháp lý đi kèm. Đồng thời, hệ thống tự động hóa chuỗi quy trình đề xuất - thẩm định - phê duyệt liên phòng ban, loại bỏ hoàn toàn các nút thắt chờ đợi tờ trình giấy, góp phần nâng cao năng suất vận hành và gia tăng mức độ hài lòng của nhân viên.

### 1.2.3. Tác dụng

Ứng dụng phần mềm giúp tối ưu hóa nguồn lực quản lý: đội ngũ nhân sự gồm 18 chuyên viên có thể quản trị thông suốt dữ liệu cho hơn 430 nhân viên; thời gian tổng hợp chấm công và tính lương hàng tháng được rút ngắn từ 4-5 ngày xuống còn vài giờ làm việc. Người lao động có thể chủ động điểm danh, tra cứu phiếu lương và gửi đơn từ trực tiếp trên máy tính hoặc điện thoại thông minh. Đồng thời, Ban Giám đốc được cung cấp các báo cáo trực quan, đa chiều theo thời gian thực để đưa ra các quyết định chiến lược kịp thời.

### 1.2.4. Nhu cầu và khả năng ứng dụng

Với tốc độ phát triển mạnh mẽ và tính chất dự án phân tán tại nhiều thành phố và quốc gia, nhu cầu tin học hóa toàn diện công tác quản trị nhân lực tại Saigon Technology là hết sức cấp thiết. Kiến trúc hướng đối tượng cho phép phân chia bài toán thành các phân hệ độc lập, có tính đóng gói cao, giúp hệ thống dễ dàng thích ứng với sự thay đổi của cơ cấu tổ chức cũng như sẵn sàng tích hợp thêm các công nghệ mới trong tương lai.

### 1.2.5. Bài học kinh nghiệm rút ra từ việc tiếp cận hệ thống

Thứ nhất, cơ cấu tổ chức doanh nghiệp luôn vận động và biến đổi theo chiến lược kinh doanh. Do đó, cây tổ chức phòng ban phải được thiết kế dưới dạng dữ liệu cấu hình phân cấp linh hoạt, tuyệt đối không cài cứng vào mã nguồn.

Thứ hai, các tham số pháp lý về tiền lương, thuế và bảo hiểm xã hội thường xuyên thay đổi theo các chính sách của Nhà nước. Hệ thống cần quản lý các tham số này gắn liền với ngày hiệu lực để bảo đảm tính chính xác khi truy xuất lịch sử.

Thứ ba, dữ liệu tài chính và nhân sự sau khi đã phê duyệt phải tuân thủ nguyên tắc bất biến (Immutability). Cơ chế khóa kỳ lương hoặc nhật ký kiểm toán chỉ thêm (Append-Only) là bắt buộc để ngăn ngừa mọi hành vi sửa đổi trái phép.

## 1.3. Phát biểu bài toán cần phân tích

### 1.3.1. Bài toán trong thực tế tại Saigon Technology

Saigon Technology hoạt động trong lĩnh vực dịch vụ gia công phần mềm xuất khẩu, với hơn 430 kỹ sư công nghệ làm việc theo các mô hình dự án ODC chuyên trách. Doanh nghiệp quản lý hai nhóm quy trình tác nghiệp lớn:
- Nhóm quy trình quản lý tổ chức và nhân sự: Tiếp nhận nhu cầu bổ sung nhân sự từ các dự án, thẩm định định biên, tổ chức tuyển dụng qua pipeline ATS, quản lý hồ sơ nhân viên, ký kết và theo dõi thời hạn hợp đồng lao động, quản lý văn bằng chứng chỉ, mượn trả hồ sơ gốc, đánh giá thử việc, điều chuyển nội bộ, nâng bậc lương, khen thưởng, kỷ luật và xử lý thôi việc bàn giao;
- Nhóm quy trình chấm công, tiền lương và chế độ đãi ngộ: Phân ca làm việc, thu thập sự kiện điểm danh từ nhiều nguồn (máy chấm công phần cứng, Kiosk nhận diện khuôn mặt sinh trắc học kết hợp cảm biến hồng ngoại IR chống giả mạo, Web Check-in trên cổng ESS), xử lý ngoại lệ lệch công, xét duyệt đơn nghỉ phép và làm thêm giờ, vận hành chu kỳ tính lương hàng tháng, giải quyết tạm ứng và khoản vay phúc lợi, thanh quyết toán công tác phí và kết xuất báo cáo bảo hiểm - thuế.

### 1.3.2. Phạm vi hệ thống và phân loại người dùng

Hệ thống được thiết kế hướng tới việc bao đóng toàn bộ quy trình quản trị nhân lực nội bộ, kết hợp giữa cổng tự phục vụ dành cho người lao động (ESS Portal) và phân hệ quản trị chuyên sâu dành cho cán bộ nhân sự và nhà quản lý.

Người dùng trong hệ thống được phân thành ba vai trò toàn cục:
- Vai USER: Dành cho toàn thể nhân viên và trưởng dự án, phục vụ các thao tác tự phục vụ (điểm danh, nộp đơn nghỉ phép, xem phiếu lương cá nhân, đăng ký khoản vay) và quyền đề xuất/phê duyệt trong phạm vi nhóm quản lý;
- Vai KM_MANAGER: Dành cho chuyên viên nhân sự và chuyên viên tiền lương, chủ trì các nghiệp vụ thẩm định hồ sơ, quản trị hợp đồng, xử lý dữ liệu chấm công, vận hành động cơ tính lương và quản lý danh mục;
- Vai ADMIN: Dành cho Ban Giám đốc và cán bộ quản trị hệ thống IT, thực hiện phê duyệt các quyết định nhân sự cấp cao, khóa bất biến kỳ lương, cấu hình tham số hệ thống và giám sát nhật ký kiểm toán.

### 1.3.3. Phát biểu bài toán và yêu cầu nghiệp vụ

Hệ thống cần giải quyết hai yêu cầu trọng tâm:

Về quản trị vận hành: Tin học hóa toàn bộ vòng đời nhân viên, loại bỏ hoàn toàn sự phân mảnh dữ liệu giữa các phòng ban, thay thế quy trình giấy tờ thủ công bằng luồng phê duyệt điện tử minh bạch, cưỡng chế việc tuân thủ quy trình bằng phần mềm (chỉ phê duyệt quyết định khi đã đủ bằng chứng hợp lệ).

Về tuân thủ pháp lý: Tính toán chính xác các chế độ tiền lương, bảo hiểm xã hội và thuế thu nhập cá nhân theo đúng quy định hiện hành; lưu trữ đầy đủ hồ sơ pháp lý và vết kiểm toán cho mọi giao dịch nhân sự; bảo vệ an toàn thông tin định danh cá nhân theo Nghị định 13/2023/NĐ-CP.

## Tóm tắt chương 1

Chương 1 đã trình bày có hệ thống cơ sở lý luận về quản trị nhân lực và hệ thống thông tin nhân sự trong doanh nghiệp công nghệ cao; giới thiệu phương pháp phân tích thiết kế hướng đối tượng (OOAD) cùng bộ công cụ mô hình hóa UML; đúc kết các bài học kinh nghiệm về tính cấu hình của cây tổ chức và tính bất biến của dữ liệu tài chính. Đồng thời, chương đã phát biểu rõ nét bài toán thực tế tại Saigon Technology, phân loại người dùng và xác định các yêu cầu nghiệp vụ cốt lõi, tạo nền tảng trực tiếp cho công tác phân tích và thiết kế chi tiết ở Chương 2.

---

# CHƯƠNG 2: THIẾT KẾ HỆ THỐNG THÔNG TIN QUẢN TRỊ NHÂN LỰC CHO CÔNG TY CỔ PHẦN PHẦN MỀM SAIGON TECHNOLOGY

## 2.1. Phân tích các yêu cầu nghiệp vụ

### 2.1.1. Xác định và phân loại các tác nhân

Tác nhân (Actor) trong phân tích hệ thống hướng đối tượng là bất kỳ thực thể nào bên ngoài (con người, phòng ban hoặc hệ thống khác) có tương tác trực tiếp và trao đổi thông tin với phần mềm. Dựa trên kết quả khảo sát cơ cấu tổ chức và quy trình nghiệp vụ thực tế tại Công ty Cổ phần Phần mềm Saigon Technology, hệ thống xác định 11 tác nhân nghiệp vụ cụ thể. Để tối ưu hóa việc phân quyền truy cập trên hệ thống phần mềm, 11 tác nhân này được phân loại và kế thừa vào ba nhóm vai trò người dùng chính: Toàn thể Nhân viên (USER), Cán bộ Nghiệp vụ Nhân sự (KM_MANAGER) và Quản trị viên Cấp cao (ADMIN).

**Bảng 2.1. Ánh xạ tác nhân hệ thống với cơ cấu tổ chức của Saigon Technology**

| STT | Tác nhân nghiệp vụ | Bộ phận / Vị trí thực tế tương ứng | Vai trò hệ thống | Trách nhiệm và quyền hạn chính trên phần mềm |
| :---: | :--- | :--- | :---: | :--- |
| 1 | Nhân viên (Employee) | Toàn thể kỹ sư, lập trình viên, chuyên viên tại các dự án và phòng ban | USER | Sử dụng cổng tự phục vụ ESS: điểm danh, nộp đơn nghỉ phép, đăng ký làm thêm giờ, tra cứu phiếu lương cá nhân, cập nhật thông tin liên lạc (Mức 1). |
| 2 | Trưởng dự án (Project Manager - PM) | Quản lý dự án phần mềm, Trưởng nhóm kỹ thuật (Tech Lead) | USER | Lập phiếu đề xuất tuyển dụng, phân ca làm việc cho thành viên dự án, duyệt đơn nghỉ phép, xác nhận giờ làm thêm, đánh giá thử việc và đánh giá KPI thành viên. |
| 3 | Chuyên viên Tuyển dụng (Recruiter) | Tổ Tuyển dụng - Ban TC-HC-NS | KM_MANAGER | Quản lý tin tuyển dụng, tiếp nhận và sàng lọc hồ sơ ứng viên trên pipeline ATS Kanban, lên lịch phỏng vấn, lập tờ trình tuyển dụng và gửi thư mời nhận việc. |
| 4 | Chuyên viên Hồ sơ (HR Records Officer) | Tổ Quản trị Hồ sơ & Thủ tục nhân sự | KM_MANAGER | Tiếp nhận nhân viên mới, lập hợp đồng lao động, số hóa văn bằng chứng chỉ, quản lý mượn trả hồ sơ gốc, thẩm định đề xuất thay đổi thông tin định danh (Mức 2). |
| 5 | Chuyên viên Tiền lương (C&B Officer) | Tổ Tiền lương & Phúc lợi | KM_MANAGER | Giám sát dữ liệu chấm công, xử lý ngoại lệ lệch công, cấu hình công thức lương, chạy động cơ tính lương tự động, quản lý tạm ứng và khoản vay phúc lợi. |
| 6 | Chuyên viên Đào tạo & Hiệu suất | Tổ Phát triển Nguồn nhân lực | KM_MANAGER | Tổ chức khóa đào tạo nội bộ, điều phối kỳ đánh giá hiệu suất 360 độ, theo dõi mục tiêu OKR/KPI và tiếp nhận giải quyết khiếu nại lao động. |
| 7 | Nhân viên Hành chính (Office Admin) | Bộ phận Hành chính - Quản trị văn phòng | KM_MANAGER | Quản lý cấp phát, thu hồi tài sản làm việc (laptop, màn hình), bàn giao chỗ ngồi và thẻ từ ra vào văn phòng. |
| 8 | Kế toán viên (Accountant) | Phòng Kế toán - Tài chính | KM_MANAGER | Xác nhận ngân sách quỹ lương, đối chiếu bảng thanh toán tiền lương, tạm ứng và thanh quyết toán các khoản chi phí công tác (T&E). |
| 9 | Đại diện Người lao động | Ban Chấp hành Công đoàn cơ sở | USER | Tham gia đóng góp ý kiến và giám sát trong quy trình xử lý kỷ luật lao động và giải quyết khiếu nại theo quy định pháp luật. |
| 10 | Giám đốc (Executive Director / COO) | Ban Tổng Giám đốc điều hành | ADMIN | Phê duyệt kế hoạch tuyển dụng, ký duyệt hợp đồng lao động, phê duyệt bảng lương tháng, phê duyệt bổ nhiệm, nâng bậc lương và khen thưởng, kỷ luật. |
| 11 | Nhân viên Quản trị IT (System Admin) | Phòng Hạ tầng & An ninh thông tin (IT/DevOps) | ADMIN | Quản trị tài khoản người dùng, phân quyền RBAC, cấu hình tham số hệ thống, giám sát kết nối máy chấm công và tra cứu nhật ký kiểm toán (Audit Log). |

![Hình 2.1: Biểu đồ cây phân cấp Tác nhân (Actor Generalization)](images/hinh_2_1_actor_tree.png)

Sơ đồ thể hiện quan hệ kế thừa giữa 11 tác nhân nghiệp vụ vào 3 nhóm vai trò người dùng chuẩn hóa trên hệ thống.

### 2.1.2. Danh sách Use case và phân nhóm nhiệm vụ

Dựa trên kết quả phân tích quy trình nghiệp vụ và các tác nhân tương tác, hệ thống thông tin quản trị nhân lực được chuẩn hóa thành 47 Use Case hoàn chỉnh, phân bổ vào 10 nhóm nghiệp vụ bám sát theo vòng đời nhân sự của tổ chức.

**Bảng 2.2. Danh sách 47 Use case của Hệ thống Quản trị nhân lực**

| STT | Mã Use case | Tên Use case nghiệp vụ | Tác nhân chính | Nhóm phân hệ chức năng |
| :---: | :---: | :--- | :--- | :--- |
| 1 | UC01 | Đăng nhập & Xác thực hệ thống | Toàn thể nhân viên | Nhóm A: Quản trị hệ thống & Tổ chức |
| 2 | UC02 | Quản trị người dùng & Phân quyền RBAC | Nhân viên Quản trị IT | Nhóm A: Quản trị hệ thống & Tổ chức |
| 3 | UC03 | Quản trị cơ cấu tổ chức & Cây phòng ban | Nhân viên Quản trị IT | Nhóm A: Quản trị hệ thống & Tổ chức |
| 4 | UC04 | Lập phiếu đề xuất tuyển dụng nhân sự | Trưởng dự án | Nhóm B: Tuyển dụng & Quản lý ứng viên |
| 5 | UC05 | Thẩm định chỉ tiêu & Kiểm soát định biên tuyển dụng | Chuyên viên Tuyển dụng, Kế toán | Nhóm B: Tuyển dụng & Quản lý ứng viên |
| 6 | UC06 | Phê duyệt chỉ tiêu tuyển dụng | Giám đốc | Nhóm B: Tuyển dụng & Quản lý ứng viên |
| 7 | UC07 | Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban | Chuyên viên Tuyển dụng | Nhóm B: Tuyển dụng & Quản lý ứng viên |
| 8 | UC08 | Gửi thư mời nhận việc & Thỏa thuận mức lương | Chuyên viên Tuyển dụng, Ứng viên | Nhóm B: Tuyển dụng & Quản lý ứng viên |
| 9 | UC09 | Quản lý hồ sơ nhân viên toàn diện | Chuyên viên Hồ sơ | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 10 | UC10 | Quản lý hợp đồng lao động & Phụ lục hợp đồng | Chuyên viên Hồ sơ | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 11 | UC11 | Quản lý văn bằng, chứng chỉ chuyên môn | Chuyên viên Hồ sơ | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 12 | UC12 | Mượn - trả hồ sơ, chứng chỉ bản gốc | Nhân viên, Chuyên viên Hồ sơ | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 13 | UC13 | Đánh giá kết quả thử việc & Ký HĐLĐ chính thức | Trưởng dự án, Chuyên viên Hồ sơ, Giám đốc | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 14 | UC14 | Lộ trình hội nhập nhân viên mới (Onboarding Checklist) | Nhân viên mới, Chuyên viên Hồ sơ, Mentor | Nhóm C: Hồ sơ nhân sự, Hợp đồng & Hội nhập |
| 15 | UC15 | Cổng tự phục vụ nhân viên tập trung (ESS Portal) | Toàn thể nhân viên | Nhóm D: Cổng tự phục vụ & Phân cấp hồ sơ |
| 16 | UC16 | Quản lý thông tin cá nhân phân cấp 3 mức độ | Toàn thể nhân viên | Nhóm D: Cổng tự phục vụ & Phân cấp hồ sơ |
| 17 | UC17 | Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2 | Chuyên viên Hồ sơ, Quản trị viên | Nhóm D: Cổng tự phục vụ & Phân cấp hồ sơ |
| 18 | UC18 | Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca | Toàn thể nhân viên | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 19 | UC19 | Điểm danh sinh trắc học khuôn mặt & Cảm biến IR | Nhân viên, Kiosk điểm danh | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 20 | UC20 | Quản trị kết nối thiết bị máy chấm công | Chuyên viên Hồ sơ, Quản trị IT | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 21 | UC21 | Đăng ký & Xét duyệt nghỉ phép trực tuyến | Nhân viên, Trưởng dự án, Chuyên viên Hồ sơ | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 22 | UC22 | Đăng ký & Phê duyệt làm thêm giờ (OT) | Nhân viên, Trưởng dự án, Chuyên viên Tiền lương | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 23 | UC23 | Lập lịch và phân ca làm việc (Shift Scheduling) | Trưởng dự án, Chuyên viên Tiền lương | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 24 | UC24 | Giải trình bổ sung giờ công & Xử lý lệch công | Nhân viên, Trưởng dự án, Chuyên viên Tiền lương | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 25 | UC25 | Tổng hợp & Chốt bảng chấm công tháng | Chuyên viên Tiền lương, Trưởng dự án | Nhóm E: Chấm công, Phân ca & Điểm danh đa nguồn |
| 26 | UC26 | Cấu hình công thức và ngạch bậc lương | Chuyên viên Tiền lương | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 27 | UC27 | Vận hành động cơ tính toán bảng lương tự động | Chuyên viên Tiền lương | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 28 | UC28 | Phê duyệt & Khóa bất biến kỳ lương (LOCKED state) | Chuyên viên Tiền lương, Giám đốc | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 29 | UC29 | Quản lý tạm ứng & Khoản vay phúc lợi nhân viên | Nhân viên, Chuyên viên Tiền lương, Giám đốc | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 30 | UC30 | Quản lý đề xuất công tác & Quyết toán chi phí (T&E) | Nhân viên, Trưởng dự án, Kế toán | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 31 | UC31 | Quản lý cấp phát & Thu hồi tài sản làm việc | Nhân viên Hành chính, Nhân viên | Nhóm F: Tiền lương, Chế độ đãi ngộ & Phúc lợi |
| 32 | UC32 | Đề xuất & Phê duyệt điều chuyển công tác nội bộ | Trưởng dự án, Giám đốc, Chuyên viên Hồ sơ | Nhóm G: Biến động nhân sự & Thôi việc |
| 33 | UC33 | Đề xuất & Phê duyệt điều chỉnh bậc lương | Trưởng dự án, Giám đốc, Chuyên viên Tiền lương | Nhóm G: Biến động nhân sự & Thôi việc |
| 34 | UC34 | Đề xuất & Phê duyệt khen thưởng nhân sự | Trưởng dự án, Giám đốc, Chuyên viên Tiền lương | Nhóm G: Biến động nhân sự & Thôi việc |
| 35 | UC35 | Xử lý kỷ luật & Vi phạm nội quy lao động | Trưởng dự án, Đại diện NLĐ, Giám đốc | Nhóm G: Biến động nhân sự & Thôi việc |
| 36 | UC36 | Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận | Nhân viên, Chuyên viên Hồ sơ, Các bộ phận | Nhóm G: Biến động nhân sự & Thôi việc |
| 37 | UC37 | Đánh giá hiệu suất 360 độ & Mục tiêu OKR/KPI | Chuyên viên nhân sự, Trưởng dự án, Nhân viên | Nhóm H: Đánh giá hiệu suất, Đào tạo & Phát triển |
| 38 | UC38 | Quản trị chương trình đào tạo nội bộ | Chuyên viên nhân sự, Nhân viên | Nhóm H: Đánh giá hiệu suất, Đào tạo & Phát triển |
| 39 | UC39 | Tiếp nhận & Giải quyết khiếu nại lao động bảo mật | Chuyên viên nhân sự, Nhân viên | Nhóm H: Đánh giá hiệu suất, Đào tạo & Phát triển |
| 40 | UC40 | Quản lý hồ sơ cán bộ toàn diện theo Mẫu 2C-BNV | Chuyên viên Hồ sơ | Nhóm I: Chuẩn cán bộ & Báo cáo Nhà nước |
| 41 | UC41 | Quản trị danh mục ngạch bậc lương chuẩn NĐ 204 | Chuyên viên Hồ sơ | Nhóm I: Chuẩn cán bộ & Báo cáo Nhà nước |
| 42 | UC42 | Tự động rà soát & Phê duyệt nâng bậc lương định kỳ | Chuyên viên Hồ sơ, Giám đốc | Nhóm I: Chuẩn cán bộ & Báo cáo Nhà nước |
| 43 | UC43 | Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Biểu 01-03) | Chuyên viên Hồ sơ | Nhóm I: Chuẩn cán bộ & Báo cáo Nhà nước |
| 44 | UC44 | Quản lý không gian tri thức số & Tài liệu quy trình SOP | Toàn thể nhân viên (theo quyền không gian) | Nhóm J: Quản trị Tri thức & Điều hành hệ thống |
| 45 | UC45 | Tìm kiếm tri thức toàn văn & Danh bạ chuyên gia | Toàn thể nhân viên | Nhóm J: Quản trị Tri thức & Điều hành hệ thống |
| 46 | UC46 | Bảng điều khiển phân tích & Thống kê nhân sự (Dashboard) | Ban Giám đốc, Quản lý, Nhân viên | Nhóm J: Quản trị Tri thức & Điều hành hệ thống |
| 47 | UC47 | Nhật ký kiểm toán hệ thống & Cấu hình tham số | Nhân viên Quản trị IT | Nhóm J: Quản trị Tri thức & Điều hành hệ thống |

### 2.1.3. Đặc tả các Use case

**Bảng 2.3. Đặc tả tổng hợp 47 Use case của hệ thống**

| Mã UC | Tác nhân chính | Mục đích nghiệp vụ | Luồng xử lý tóm tắt của hệ thống |
| :---: | :--- | :--- | :--- |
| UC01 | Toàn thể nhân viên | Xác thực truy cập an toàn | Nhập email/mật khẩu -> Kiểm tra tài khoản -> Cấp JWT Access Token (15 phút) & Refresh Token (7 ngày) -> Điều hướng theo vai trò. |
| UC02 | Quản trị viên IT | Quản lý tài khoản và quyền hạn | Tạo mới/sửa tài khoản nhân viên -> Gán vai trò RBAC (USER, KM_MANAGER, ADMIN) -> Khóa tài khoản khi thôi việc -> Ghi vết kiểm toán. |
| UC03 | Quản trị viên IT | Quản trị cơ cấu doanh nghiệp | Cấu hình cây phòng ban tự tham chiếu đa cấp -> Thiết lập định biên nhân sự -> Gán người đứng đầu đơn vị -> Cập nhật trực quan sơ đồ tổ chức. |
| UC04 | Trưởng dự án | Đề xuất bổ sung nhân sự | Chọn vị trí, chức danh, số lượng, lý do -> Kiểm tra định biên phòng ban -> Lưu phiếu "Chờ thẩm định" -> Thông báo chuyên viên tuyển dụng. |
| UC05 | CV Tuyển dụng, Kế toán | Thẩm định nhu cầu tuyển dụng | Kiểm tra tính phù hợp của JD và khung lương -> Đối chiếu nguồn ứng viên nội bộ -> Kế toán thẩm định quỹ chi -> Chuyển "Chờ phê duyệt". |
| UC06 | Giám đốc | Phê chuẩn kế hoạch tuyển dụng | Xem xét đề xuất -> Phê duyệt điện tử -> Kích hoạt trạng thái mở tuyển (Open Requisition) -> Thông báo cho PM và bộ phận tuyển dụng. |
| UC07 | CV Tuyển dụng | Quản lý hồ sơ ứng viên | Tạo tin tuyển dụng -> Tiếp nhận CV đa kênh -> Kéo-thả ứng viên qua pipeline Kanban 6 bước (Ứng tuyển, Sàng lọc, PV 1, PV 2, Offer, Nhận việc). |
| UC08 | CV Tuyển dụng | Mời nhận việc và thỏa thuận lương | Lập thư mời theo khung bậc lương -> Trình duyệt nếu vượt khung -> Gửi ứng viên -> Ứng viên xác nhận -> Chuyển ứng viên thành nhân viên mới. |
| UC09 | CV Hồ sơ | Quản lý hồ sơ nhân viên | Lưu trữ thông tin nhân thân, quá trình công tác, hợp đồng, bằng cấp -> Tìm kiếm toàn văn -> Xuất dữ liệu nhân sự -> Theo dõi biến động. |
| UC10 | CV Hồ sơ | Quản lý hợp đồng lao động | Lập HĐLĐ thử việc, xác định thời hạn (12-36 tháng) hoặc không xác định thời hạn -> Cảnh báo hợp đồng sắp hết hạn trước 45/30 ngày. |
| UC11 | CV Hồ sơ | Quản lý bằng cấp, chứng chỉ | Lưu trữ loại bằng, số hiệu, nơi cấp, ngày cấp, bản quét đính kèm -> Lưu vị trí tủ lưu trữ vật lý -> Kiểm tra tính hợp lệ của chứng chỉ. |
| UC12 | Nhân viên, CV Hồ sơ | Mượn - trả hồ sơ gốc | Lập phiếu mượn bằng cấp gốc -> Ghi nhận lý do và ngày hẹn trả -> Tự động gửi email nhắc trả trước hạn 3 ngày -> Xác nhận thu hồi. |
| UC13 | Trưởng dự án, Giám đốc | Đánh giá thử việc | Hệ thống nhắc trước 15 ngày -> PM đánh giá năng lực và thái độ -> Đạt: Tự sinh HĐ chính thức; Không đạt: Chấm dứt thử việc. |
| UC14 | Nhân viên mới, Mentor | Hội nhập nhân sự mới | Khởi tạo Onboarding Checklist 14 ngày -> Nhân viên hoàn thành các khóa học chính sách, cam kết bảo mật NDA -> Mentor và HR nghiệm thu. |
| UC15 | Toàn thể nhân viên | Cổng tự phục vụ tập trung | Trang tổng quan cá nhân: chấm công trực tuyến, nộp đơn phép/OT, xem phiếu lương điện tử bảo mật, theo dõi tiến độ hoàn nợ khoản vay. |
| UC16 | Toàn thể nhân viên | Quản trị hồ sơ phân cấp 3 mức | Mức 1: Tự sửa số điện thoại, địa chỉ; Mức 2: Đề xuất đổi CCCD, tài khoản ngân hàng kèm minh chứng; Mức 3: Khóa chỉ xem chức danh, lương. |
| UC17 | CV Hồ sơ, Quản trị viên | Thẩm định điều chỉnh hồ sơ Mức 2 | Tiếp nhận đề xuất từ hàng đợi thẩm định -> Đối chiếu dữ liệu cũ/mới và ảnh minh chứng -> Duyệt (cập nhật CSDL nguyên tử) hoặc từ chối. |
| UC18 | Toàn thể nhân viên | Chấm công vào/ra ca làm việc | Thu thập sự kiện Check-in/Check-out từ các kênh -> Ghi vào bảng sự kiện bất biến AttendanceEvent -> Khớp giờ công với ca được gán. |
| UC19 | Nhân viên, Kiosk | Điểm danh khuôn mặt & IR | Đăng ký vector mẫu (mã hóa AES-256-GCM) -> Kiosk nhận diện thời gian thực qua camera và cảm biến hồng ngoại chống giả mạo -> Ghi nhận công. |
| UC20 | Quản trị viên IT | Quản trị máy chấm công | Cấu hình thiết bị máy chấm công -> Tiếp nhận webhook kèm chữ ký HMAC-SHA256 hoặc nhập file CSV -> Đồng bộ bản ghi thô vào CSDL. |
| UC21 | Nhân viên, Trưởng dự án | Đăng ký & Xét duyệt nghỉ phép | Kiểm tra số dư phép khả dụng -> Nộp đơn chọn loại phép -> Trưởng dự án duyệt -> Hệ thống tự động trừ quỹ phép ngay khi duyệt. |
| UC22 | Nhân viên, Trưởng dự án | Đăng ký làm thêm giờ (OT) | Đăng ký khung giờ làm thêm và lý do -> Kiểm tra giới hạn trần OT (không quá 40h/tháng) -> Quản lý duyệt -> Nạp dữ liệu vào bảng công. |
| UC23 | Trưởng dự án, CV Tiền lương | Phân ca làm việc | Thiết lập danh mục ca (giờ bắt đầu, kết thúc, thời gian nghỉ, ân hạn đi muộn) -> Gán ca cho nhân viên hoặc nhóm dự án theo tuần/tháng. |
| UC24 | Nhân viên, Quản lý | Giải trình & Hiệu chỉnh công | Gửi đơn giải trình quên quẹt thẻ hoặc công tác đột xuất kèm minh chứng -> Quản lý duyệt -> Cập nhật bảng công kèm lưu vết kiểm toán. |
| UC25 | CV Tiền lương, Quản lý | Tổng hợp & Chốt bảng công | Khóa dữ liệu chấm công định kỳ ngày 25 -> Rà soát bản ghi lệch công -> Tổng hợp ngày công thực tế, giờ OT, ngày nghỉ -> Chuyển sang tính lương. |
| UC26 | CV Tiền lương | Cấu hình công thức lương | Cấu hình các thành phần lương (Gross, lương cơ bản, phụ cấp, thưởng) -> Thiết lập công thức tính thuế TNCN 7 bậc và định mức đóng BHXH. |
| UC27 | CV Tiền lương | Tính toán bảng lương tự động | Nạp bảng công đã chốt và hợp đồng -> Tự động tính các khoản thu nhập, trừ BHXH (10.5%), thuế TNCN và nợ vay phúc lợi -> Sinh phiếu lương. |
| UC28 | CV Tiền lương, Giám đốc | Khóa bất biến kỳ lương | Giám đốc duyệt bảng lương -> Chuyển trạng thái kỳ lương sang LOCKED -> Chặn hoàn toàn thao tác tính lại (HTTP 409) -> Xuất lệnh chi ngân hàng. |
| UC29 | Nhân viên, CV Tiền lương | Vay phúc lợi & Tạm ứng lương | Mô phỏng khoản vay -> Tự động kiểm tra tỷ lệ trích nợ <= 30% lương thực lĩnh -> Duyệt theo quy tắc -> Tự động trích trừ vào kỳ lương hàng tháng. |
| UC30 | Nhân viên, Kế toán | Đề xuất & Quyết toán công tác phí | Lập đề xuất công tác và dự toán chi phí -> Duyệt tạm ứng -> Thực hiện chuyến đi -> Kê khai hóa đơn điện tử hợp lệ -> Kế toán thanh quyết toán. |
| UC31 | NV Hành chính, Nhân viên | Cấp phát & Thu hồi tài sản | Lập biên bản bàn giao thiết bị (laptop, màn hình) -> Quản lý vòng đời tài sản (sử dụng, bảo dưỡng, thu hồi) -> Kiểm kê định kỳ. |
| UC32 | Trưởng dự án, Giám đốc | Điều chuyển nhân sự nội bộ | Lập đề xuất chuyển phòng ban hoặc dự án -> Quản lý hai bên xác nhận -> Giám đốc ký quyết định điều chuyển -> Cập nhật sơ đồ tổ chức. |
| UC33 | Trưởng dự án, Giám đốc | Điều chỉnh ngạch bậc lương | Đề xuất tăng lương định kỳ hoặc đột xuất theo hiệu suất -> Thẩm định quỹ lương -> Giám đốc ký quyết định -> Cập nhật cấu trúc lương mới. |
| UC34 | Trưởng dự án, Giám đốc | Khen thưởng nhân sự | Lập danh sách cá nhân/tập thể có thành tích xuất sắc -> Duyệt mức tiền thưởng -> Tự động nạp tiền thưởng vào kỳ tính lương kế tiếp. |
| UC35 | Trưởng dự án, Đại diện NLĐ | Xử lý kỷ luật lao động | Lập biên bản vi phạm -> Họp hội đồng kỷ luật có đại diện người lao động tham gia -> Ban hành quyết định kỷ luật (khiển trách, kéo dài nâng lương, sa thải). |
| UC36 | Nhân viên, Các bộ phận | Xử lý thôi việc & Bàn giao | Nhân viên nộp đơn thôi việc -> Duyệt đơn -> Tự động sinh Checklist bàn giao 5 mục -> Đủ xác nhận mới phát hành quyết định và khóa tài khoản. |
| UC37 | CV Nhân sự, Quản lý | Đánh giá hiệu suất 360 độ | Thiết lập kỳ đánh giá và trọng số OKR/KPI -> Nhân viên tự đánh giá -> Đồng nghiệp đánh giá chéo -> Quản lý chấm điểm -> Phản hồi kết quả. |
| UC38 | CV Nhân sự, Nhân viên | Quản lý đào tạo nội bộ | Lập kế hoạch khóa học kỹ thuật/quy trình -> Nhân viên ghi danh (giới hạn sĩ số) -> Điểm danh khóa học -> Khảo sát đánh giá chất lượng. |
| UC39 | CV Nhân sự, Nhân viên | Giải quyết khiếu nại lao động | Tiếp nhận đơn khiếu nại bảo mật qua kênh nội bộ -> Phân công cán bộ xác minh -> Tổ chức đối thoại -> Ban hành kết luận giải quyết khiếu nại. |
| UC40 | CV Hồ sơ | Quản lý hồ sơ cán bộ 2C-BNV | Quản lý 111 thuộc tính thông tin cán bộ theo quy chuẩn Mẫu 2C-BNV/2008 -> Lưu trữ 8 bảng lịch sử quá trình (lương, đào tạo, công tác...). |
| UC41 | CV Hồ sơ | Quản trị ngạch bậc lương NĐ 204 | Thiết lập danh mục ngạch công chức/viên chức (A3, A2, A1, B, C), hệ số lương từng bậc và thời gian giữ bậc chuẩn (24 hoặc 36 tháng). |
| UC42 | CV Hồ sơ, Giám đốc | Nâng bậc lương định kỳ tự động | Quét tự động danh sách cán bộ đủ điều kiện thời gian giữ bậc -> Lập danh sách đề nghị nâng bậc -> Giám đốc duyệt -> Cập nhật hệ số mới. |
| UC43 | CV Hồ sơ | Xuất biểu mẫu báo cáo nhà nước | Kết xuất Sơ yếu lý lịch Mẫu 2C-BNV/2008 khổ in PDF chuẩn; kết xuất Biểu 01 (tuổi x ngạch), Biểu 02 (ngoại ngữ), Biểu 03 (trình độ) định dạng Excel. |
| UC44 | Toàn thể nhân viên | Quản trị kho tri thức số (SOP) | Quản lý không gian tri thức phân quyền (Space) -> Soạn thảo bài viết Markdown -> Luồng phê duyệt xuất bản bài viết -> Quản lý phiên bản bài viết bất biến. |
| UC45 | Toàn thể nhân viên | Tìm kiếm tri thức & Chuyên gia | Tìm kiếm toàn văn (FTS) nội dung bài viết theo quyền hạn truy cập -> Tra cứu danh bạ chuyên môn nội bộ ("ai am hiểu về công nghệ X"). |
| UC46 | Ban Giám đốc, Quản lý | Bảng điều khiển phân tích số | Trực quan hóa các chỉ số nhân sự: tỷ lệ đi làm hôm nay, cơ cấu nhân lực, biến động lao động, tiến độ phê duyệt đơn từ, quỹ lương kỳ gần nhất. |
| UC47 | Quản trị viên IT | Nhật ký kiểm toán & Cấu hình | Tra cứu nhật ký kiểm toán hệ thống bất biến (ai thực hiện, tác vụ gì, thời điểm, giá trị trước/sau); cấu hình tham số vận hành dạng key-value. |

**Bảng 2.4. Đặc tả chi tiết các Use case trọng yếu**

Dưới đây là đặc tả kịch bản tác nghiệp chi tiết của các Use Case đại diện cho các phân hệ chức năng cốt lõi theo đúng trình tự vòng đời nhân sự:

**1. UC01 - Đăng nhập & Xác thực hệ thống**
| Bước | Tác nhân (Người dùng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập giao diện `/login`, nhập tên đăng nhập (email công vụ) và mật khẩu cá nhân; bấm nút "Đăng nhập". | Tiếp nhận thông tin, kiểm tra tính hợp lệ của định dạng dữ liệu đầu vào. |
| 2 | - | Truy vấn CSDL tìm tài khoản; đối chiếu mã băm mật khẩu bằng thuật toán bcrypt. |
| 3 | - | Nếu hợp lệ: Cấp Access Token (JWT thời hạn 15 phút) và Refresh Token (thời hạn 7 ngày); lưu hash Refresh Token vào CSDL; điều hướng người dùng tới Dashboard tương ứng với vai trò. |
| 4 | - | Nếu không hợp lệ: Thông báo lỗi "Tài khoản hoặc mật khẩu không chính xác"; tăng biến đếm số lần thất bại (nếu nhập sai quá 5 lần liên tiếp, tự động khóa tài khoản trong 15 phút để chống tấn công Brute-Force). |

**2. UC04 - Lập phiếu đề xuất tuyển dụng nhân sự**
| Bước | Tác nhân (Trưởng dự án / HR) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Trưởng dự án truy cập phân hệ Tuyển dụng, bấm chọn "Tạo đề xuất tuyển dụng". | Hiển thị biểu mẫu nhập liệu kèm thông tin định biên nhân sự và số lượng nhân sự hiện hữu của dự án. |
| 2 | Nhập vị trí công việc, số lượng cần tuyển, yêu cầu kỹ năng, mức lương dự kiến và ngày cần nhân sự; gửi đề xuất. | Kiểm tra định biên: Nếu vượt định biên cho phép, cảnh báo yêu cầu phê duyệt ngoại lệ. Ghi nhận phiếu với trạng thái "Chờ thẩm định". |
| 3 | Chuyên viên tuyển dụng kiểm tra tính khả thi của yêu cầu tuyển dụng và đối chiếu khung lương. | Cập nhật kết quả thẩm định chuyên môn; gửi thông báo song song tới bộ phận Kế toán. |
| 4 | Kế toán trưởng xác nhận khả năng chi trả của quỹ ngân sách dự án. | Chuyển trạng thái phiếu sang "Chờ phê duyệt"; gửi thông báo kèm tờ trình điện tử tới Giám đốc. |
| 5 | Giám đốc xem xét và ký duyệt điện tử (hoặc yêu cầu chỉnh sửa/từ chối kèm lý do). | Cập nhật trạng thái "Đã duyệt"; tự động khởi tạo vị trí mở tuyển trên pipeline ATS Kanban; thông báo kết quả cho Trưởng dự án. |

**3. UC07 - Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban**
| Bước | Tác nhân (Chuyên viên Tuyển dụng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Truy cập giao diện Tuyển dụng ATS (`/recruitment-ats`), bấm "+ Đăng tin tuyển dụng" hoặc "+ Tiếp nhận ứng viên". | Hiển thị form tạo tin hoặc tiếp nhận hồ sơ ứng viên; lưu thông tin và đưa ứng viên vào cột "Ứng tuyển" (APPLIED). |
| 2 | Đánh giá sơ loại CV, kéo-thả thẻ ứng viên sang cột "Sàng lọc" (SCREENING); xếp lịch phỏng vấn. | Cập nhật trạng thái ứng viên; tự động gửi email mời phỏng vấn kèm đường link xác nhận cho ứng viên. |
| 3 | Cán bộ kỹ thuật và HR nhập điểm đánh giá vào Phiếu chấm điểm phỏng vấn (Scorecard). | Lưu trữ kết quả đánh giá; chuyển ứng viên qua các vòng phỏng vấn tiếp theo (INTERVIEW_1, INTERVIEW_2). |
| 4 | Ứng viên đạt yêu cầu được chuyển sang cột "Đề nghị nhận việc" (OFFER); HR soạn thảo thư mời theo khung lương. | Lưu thông tin thư mời; gửi thư mời điện tử cho ứng viên. |
| 5 | Khi ứng viên đồng ý nhận việc, HR bấm nút "1-Click Nhận việc" (HIRED). | Hệ thống tự động chuyển đổi hồ sơ ứng viên thành hồ sơ nhân viên chính thức, tự sinh Mã nhân viên và kích hoạt hợp đồng thử việc. |

**4. UC08 - Gửi thư mời nhận việc & Thỏa thuận mức lương**
| Bước | Tác nhân (Chuyên viên Tuyển dụng / Ứng viên) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên tuyển dụng lập dự thảo thư mời (chức danh, mức lương, phụ cấp, ngày nhận việc). | Đối chiếu mức lương với thang bảng lương chuẩn của công ty: nếu vượt khung, yêu cầu phê duyệt riêng của Giám đốc. |
| 2 | Gửi thư mời làm việc tới email của ứng viên. | Ghi nhận trạng thái "Đã gửi Offer"; tạo liên kết bảo mật có thời hạn để ứng viên phản hồi. |
| 3 | Ứng viên truy cập liên kết và bấm "Chấp thuận nhận việc". | Cập nhật trạng thái "Đã chấp thuận"; thông báo cho HR để chuẩn bị công tác tiếp nhận và hội nhập nhân sự mới. |

**5. UC13 - Đánh giá kết quả thử việc & Ký HĐLĐ chính thức**
| Bước | Tác nhân (Trưởng dự án / HR / Giám đốc) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | - | Trước ngày hết hạn thử việc 15 ngày, tự động quét và gửi thông báo nhắc nhở Trưởng dự án và HR thực hiện đánh giá thử việc. |
| 2 | Trưởng dự án mở Phiếu đánh giá trên phần mềm, chấm điểm theo các tiêu chí và đưa ra kết luận: "Đạt" hoặc "Không đạt". | Lưu kết quả đánh giá; nếu "Đạt", chuyển tiếp hồ sơ sang Tổ Tiền lương để xếp bậc lương chính thức. |
| 3 | Chuyên viên tiền lương đối chiếu khung bậc lương, soạn dự thảo Hợp đồng lao động chính thức (12-36 tháng). | Chuyển hồ sơ sang trạng thái "Chờ ký duyệt"; gửi thông báo tới Giám đốc. |
| 4 | Giám đốc xem xét và ký duyệt quyết định công nhận thử việc và HĐLĐ chính thức. | Hệ thống chuyển trạng thái nhân viên sang "Chính thức" (ACTIVE); tự động đăng ký tham gia BHXH bắt buộc từ tháng ký hợp đồng. |

**6. UC16 - Quản lý thông tin cá nhân phân cấp 3 mức độ**
| Bước | Tác nhân (Nhân viên) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên truy cập trang Hồ sơ cá nhân (`/profile`). | Hiển thị hồ sơ theo 3 phân cấp: Mức 1 (Tự cập nhật), Mức 2 (Yêu cầu thẩm định), Mức 3 (Khóa tổ chức). |
| 2 | Nhân viên chỉnh sửa số điện thoại, địa chỉ tạm trú (Mức 1) và bấm "Lưu". | Hệ thống kiểm tra hợp lệ và cập nhật trực tiếp vào CSDL; hiển thị thông báo thành công tức thì. |
| 3 | Nhân viên cần đổi số CCCD hoặc tài khoản ngân hàng (Mức 2): nhập thông tin mới, lý do và tải lên ảnh chụp minh chứng. | Kiểm tra tệp đính kèm; khởi tạo bản ghi đề xuất thay đổi (`ProfileChangeRequest`) với trạng thái "Chờ thẩm định". |
| 4 | - | Gửi đề xuất vào hàng đợi thẩm định của Phòng Nhân sự; khóa tạm thời trường thông tin đang chờ xử lý để tránh gửi trùng lặp. |

**7. UC17 - Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2**
| Bước | Tác nhân (Chuyên viên Hồ sơ) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên hồ sơ truy cập hàng đợi thẩm định (`ProfileChangeReviewQueue`). | Hiển thị danh sách các đề xuất thay đổi thông tin Mức 2 đang ở trạng thái PENDING. |
| 2 | Mở chi tiết một đề xuất, xem bảng so sánh trực quan dữ liệu hiện tại (Old Value) và dữ liệu mới đề xuất (New Value) kèm ảnh minh chứng. | Cho phép phóng to ảnh chứng từ (CCCD, thẻ ngân hàng) để kiểm tra tính xác thực. |
| 3 | Cán bộ nhân sự bấm "Phê duyệt" (hoặc "Từ chối" kèm lý do phản hồi). | Nếu duyệt: Thực thi giao dịch nguyên tử cập nhật dữ liệu mới vào bảng nhân viên, ghi nhận vết kiểm toán và chuyển trạng thái APPROVED. |
| 4 | - | Gửi thông báo kết quả phê duyệt qua hệ thống và email cá nhân của nhân viên đề xuất. |

**8. UC19 - Điểm danh sinh trắc học khuôn mặt & Cảm biến IR**
| Bước | Tác nhân (Nhân viên / Kiosk điểm danh) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên đăng ký khuôn mặt: đứng trước camera, tick đồng thuận xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. | Trích xuất vector đặc trưng 128 chiều ngay tại trình duyệt, mã hóa AES-256-GCM và lưu vào bảng `FaceEmbedding` (tuyệt đối không lưu ảnh gốc). |
| 2 | Hàng ngày, nhân viên đứng trước màn hình Kiosk chuyên dụng tại sảnh văn phòng (`/check-in`). | Camera kích hoạt kết hợp cảm biến hồng ngoại IR quét phổ nhiệt và chuyển động để chống giả mạo hình ảnh (Anti-Spoofing). |
| 3 | - | Trích xuất vector khuôn mặt hiện tại, đối sánh khoảng cách Euclidean với vector đã lưu trữ trong CSDL. |
| 4 | - | Nếu khớp: Phát âm thanh chào mừng, ghi nhận ngay một bản ghi sự kiện Check-in vào bảng bất biến `AttendanceEvent` với nguồn FACE; hiển thị giờ vào ca. |
| 5 | - | Nếu không khớp: Thông báo thử lại; sau 3 lần không thành công, hướng dẫn nhân viên liên hệ lễ tân hoặc sử dụng hình thức điểm danh dự phòng. |

**9. UC20 - Quản trị kết nối thiết bị máy chấm công**
| Bước | Tác nhân (Quản trị viên IT / Thiết bị phần cứng) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Máy chấm công quẹt vân tay/thẻ từ tại văn phòng đẩy bản tin chấm công qua giao thức HTTP POST vào endpoint API webhook. | Endpoint `/api/attendance-devices/webhook` tiếp nhận bản tin, kiểm tra chữ ký xác thực HMAC-SHA256 theo từng thiết bị. |
| 2 | - | Nếu chữ ký hợp lệ: Bóc tách mã nhân viên và thời gian quẹt thẻ, ghi nhận sự kiện vào bảng `AttendanceEvent` với nguồn MACHINE. |
| 3 | Quản trị viên IT có thể nhập tệp nhật ký quẹt thẻ định dạng CSV hoặc kích hoạt bộ mô phỏng thiết bị (Simulator) để kiểm thử dữ liệu. | Đọc dữ liệu, kiểm tra trùng lặp bản ghi và nạp vào CSDL với cờ đánh dấu nguồn tương ứng. |

**10. UC21 - Đăng ký & Xét duyệt nghỉ phép trực tuyến**
| Bước | Tác nhân (Nhân viên / Quản lý) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở cổng ESS (`/leave`), chọn "Tạo đơn xin nghỉ phép". | Hiển thị số dư phép năm còn lại và lịch sử các ngày đã nghỉ. |
| 2 | Chọn loại nghỉ phép (phép năm, việc riêng, nghỉ ốm, không lương), khoảng thời gian và lý do nghỉ; bấm gửi đơn. | Kiểm tra số dư phép: Nếu xin nghỉ phép năm vượt quá quỹ phép khả dụng, chặn gửi đơn và báo lỗi. Nếu hợp lệ, lưu đơn ở trạng thái PENDING. |
| 3 | - | Gửi thông báo duyệt đơn tới Trưởng dự án quản lý trực tiếp. |
| 4 | Trưởng dự án xem xét tiến độ công việc và phê duyệt đơn nghỉ phép. | Cập nhật trạng thái đơn sang APPROVED; tự động trừ số ngày nghỉ vào quỹ phép năm của nhân viên; ghi nhận ngày nghỉ vào bảng chấm công tháng. |

**11. UC25 - Tổng hợp & Chốt bảng chấm công tháng**
| Bước | Tác nhân (Chuyên viên Tiền lương) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Đến ngày 25 hàng tháng, Chuyên viên tiền lương truy cập phân hệ Bảng công (`/attendance`), kích hoạt lệnh tổng hợp công kỳ lương. | Tự động ghép nối các cặp sự kiện Check-in/Check-out sớm nhất và muộn nhất trong ngày của từng nhân viên đối chiếu với ca được gán. |
| 2 | - | Tính toán số giờ làm việc thực tế, thời gian đi muộn, về sớm, giờ làm thêm đã duyệt và ngày nghỉ phép hợp lệ; gắn cờ các bản ghi bất thường. |
| 3 | Chuyên viên tiền lương kiểm tra danh sách bản ghi lệch công, tiếp nhận các đơn giải trình giờ công (`AttendanceRegularization`) đã được PM duyệt. | Thực hiện hiệu chỉnh ngày công (bắt buộc nhập lý do và lưu vết kiểm toán tại `AttendanceCorrection`). |
| 4 | Chuyên viên tiền lương bấm nút "Khóa bảng chấm công". | Chuyển trạng thái bảng công tháng sang LOCKED; ngăn chặn mọi thao tác chỉnh sửa giờ công; kết xuất dữ liệu phục vụ kỳ tính lương. |

**12. UC27 - Vận hành động cơ tính toán bảng lương tự động**
| Bước | Tác nhân (Chuyên viên Tiền lương) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Chuyên viên tiền lương truy cập `/payroll-engine`, chọn kỳ lương cần xử lý và bấm "Tính toán bảng lương". | Kiểm tra điều kiện tiên quyết: Bảng chấm công của kỳ tương ứng bắt buộc phải ở trạng thái LOCKED. |
| 2 | - | Động cơ tính lương (Payroll Engine) tự động thực thi các bước: <br>- Nạp mức lương hợp đồng và ngày công thực tế để tính lương thời gian; <br>- Tính tiền làm thêm giờ (hệ số 150% ngày thường, 200% ngày nghỉ, 300% ngày lễ); <br>- Cộng các khoản phụ cấp và tiền thưởng dự án đã phê duyệt; <br>- Trích nộp BHXH (8%), BHYT (1.5%), BHTN (1%) theo mức lương đóng bảo hiểm (tuân thủ mức trần quy định); <br>- Tính thuế TNCN theo biểu lũy tiến từng phần sau khi giảm trừ gia cảnh bản thân (11 triệu) và người phụ thuộc (4.4 triệu/người); <br>- Tự động khấu trừ nợ vay phúc lợi và tạm ứng lương (bảo đảm tổng khấu trừ <= 30% lương thực lĩnh Net). |
| 3 | Chuyên viên tiền lương kiểm tra bảng tổng hợp lương, đối chiếu các trường hợp biến động bất thường. | Hiển thị bảng kê chi tiết từng thành phần thu nhập và khấu trừ (Breakdown View). |
| 4 | Kế toán trưởng thẩm định và chuyển bảng lương trình Giám đốc phê duyệt. | Chuyển trạng thái kỳ lương sang REVIEWED. |

**13. UC28 - Phê duyệt & Khóa bất biến kỳ lương (LOCKED state)**
| Bước | Tác nhân (Giám đốc / Chuyên viên Tiền lương) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Giám đốc xem xét bảng tổng hợp chi trả tiền lương và ký duyệt điện tử. | Ghi nhận quyết định phê duyệt của Giám đốc; chuyển trạng thái kỳ lương sang LOCKED. |
| 2 | - | Kích hoạt cơ chế bảo vệ bất biến: Chặn tuyệt đối mọi hành vi chạy tính toán lại hoặc sửa đổi dữ liệu kỳ lương đã khóa (trả về lỗi HTTP 409 Conflict). |
| 3 | Chuyên viên tiền lương kết xuất tệp lệnh chi chuyển khoản ngân hàng (Bank Transfer Batch File) và báo cáo bảo hiểm - thuế. | Sinh tệp Excel định dạng chuẩn ngân hàng và mẫu biểu cơ quan BHXH. |
| 4 | - | Tự động phát hành Phiếu lương điện tử bảo mật (ePayslip) tới từng tài khoản nhân viên trên cổng ESS; gửi thông báo thông báo lương. |

**14. UC29 - Quản lý tạm ứng & Khoản vay phúc lợi nhân viên**
| Bước | Tác nhân (Nhân viên / Chuyên viên Tiền lương) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên mở giao diện Phúc lợi & Khoản vay (`/loans`), sử dụng bộ mô phỏng tài chính chọn số tiền cần vay và kỳ hạn trả chậm (6-36 tháng). | Thuật toán tự động tính toán số tiền trích nợ mỗi kỳ (EMI), lãi suất ưu đãi và đối chiếu với mức lương thực lĩnh bình quân. |
| 2 | - | Kiểm tra tuân thủ Điều 102 BLLĐ: Nếu số tiền trích nợ dự kiến vượt quá 30% lương thực lĩnh Net, hệ thống tự động cảnh báo và yêu cầu kéo dài thời hạn vay. |
| 3 | Nhân viên nộp đơn đề nghị vay phúc lợi theo gói mục tiêu (trang bị thiết bị, học tập, hỗ trợ khẩn cấp). | Lưu đơn vào pipeline Kanban ở cột "Chờ Thẩm Định"; gửi thông báo cho C&B. |
| 4 | Chuyên viên C&B sử dụng công cụ phê duyệt nhanh 1-chạm (cho các đơn đạt chuẩn quy tắc) hoặc trình Giám đốc duyệt khoản vay lớn. | Cập nhật đơn sang "Đang Trích Lương"; sinh lịch trình khấu trừ định kỳ (Amortization Schedule). |
| 5 | - | Trong các kỳ tính lương tiếp theo, động cơ tính lương tự động trừ khoản hoàn nợ vào phiếu lương của nhân viên cho đến khi tất toán hoàn toàn. |

**15. UC36 - Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận**
| Bước | Tác nhân (Nhân viên / CV Hồ sơ / Các bộ phận) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Nhân viên nộp đơn xin thôi việc trên hệ thống, nêu rõ lý do và ngày làm việc cuối cùng (tuân thủ thời hạn báo trước theo HĐLĐ). | Lưu đơn ở trạng thái PENDING; gửi thông báo cho PM trực tiếp và Phòng Nhân sự. |
| 2 | Trưởng dự án và Giám đốc phê duyệt đơn xin thôi việc. | Cập nhật đơn sang APPROVED; hệ thống tự động khởi tạo Danh mục kiểm tra bàn giao đa bộ phận (`HandoverChecklist`) gồm 5 mục bắt buộc. |
| 3 | Từng bộ phận thực hiện xác nhận trách nhiệm bàn giao trên phần mềm: <br>- Quản lý dự án: Xác nhận bàn giao mã nguồn, tài liệu dự án và quyền truy cập mã nguồn; <br>- Bộ phận Hành chính: Xác nhận thu hồi thẻ nhân viên, chìa khóa và tài sản làm việc; <br>- Bộ phận IT: Xác nhận thu hồi laptop, thiết bị kiểm thử và thu hồi tài khoản hệ thống (Email, Slack, Jira, VPN); <br>- Bộ phận C&B: Xác nhận quyết toán công nợ, hoàn ứng và tính toán ngày phép tồn; <br>- Hệ thống: Tự động xóa mẫu vector khuôn mặt sinh trắc học theo chuẩn Nghị định 13/2023. | Hệ thống kiểm tra điều kiện tiên quyết: Nút "Phát hành quyết định thôi việc" chỉ được kích hoạt khi cả 5/5 hạng mục đều đã được xác nhận hoàn tất. |
| 4 | Giám đốc ký Quyết định chấm dứt hợp đồng lao động; Chuyên viên hồ sơ đóng sổ bảo hiểm xã hội và bàn giao hồ sơ cho người lao động. | Cập nhật trạng thái nhân viên sang RESIGNED; tự động khóa vĩnh viễn tài khoản truy cập vào ngày làm việc cuối cùng. |

**16. UC42 - Tự động rà soát & Phê duyệt nâng bậc lương định kỳ**
| Bước | Tác nhân (Chuyên viên Hồ sơ / Giám đốc) | Hệ thống phần mềm |
| :---: | :--- | :--- |
| 1 | Định kỳ hàng quý, Chuyên viên hồ sơ kích hoạt chức năng rà soát nâng bậc lương theo chuẩn Nghị định 204/2004/NĐ-CP. | Tự động quét cơ sở dữ liệu quá trình lương (`SalaryProgress`), lọc các cán bộ có thời gian giữ bậc đạt đủ chu kỳ quy định (24 tháng đối với ngạch B, C; 36 tháng đối với ngạch A1 trở lên). |
| 2 | - | Sinh danh sách cán bộ đủ điều kiện nâng bậc lương thường xuyên; đối với cán bộ đã kịch khung, tự động tính tỷ lệ hưởng phụ cấp thâm niên vượt khung (5% cho năm đầu tiên, mỗi năm sau thêm 1%). |
| 3 | Chuyên viên hồ sơ rà soát danh sách, loại trừ các trường hợp bị kỷ luật kéo dài thời hạn nâng bậc (nếu có); lập tờ trình nâng bậc lương. | Đóng gói danh sách đề xuất thành hồ sơ trình ký điện tử gửi tới Giám đốc. |
| 4 | Giám đốc xem xét và ký Quyết định nâng bậc lương hàng loạt. | Hệ thống cập nhật ngạch, bậc và hệ số lương mới vào hồ sơ cán bộ; tự động áp dụng hệ số mới vào chu kỳ tính lương tiếp theo. |

### 2.1.4. Xây dựng biểu đồ Use case

Biểu đồ Use case tổng quan thể hiện bức tranh toàn cảnh về sự tương tác giữa 11 tác nhân nghiệp vụ và 47 Use Case chức năng được phân nhóm khoa học trong hệ thống.

![Hình 2.2: Biểu đồ Use case tổng quan Hệ thống Quản trị nhân lực](images/hinh_2_2_usecase_overview.png)

Để làm rõ chi tiết quan hệ giữa các Use Case trong từng phân hệ, biểu đồ Use case phân rã nghiệp vụ Tuyển dụng (Nhóm B) được mô hình hóa chi tiết với các quan hệ phụ thuộc `<<include>>` và mở rộng `<<extend>>`.

![Hình 2.3: Biểu đồ Use case nhóm B - Tuyển dụng](images/hinh_2_3_usecase_recruitment.png)

Sơ đồ mô tả quy trình tiếp nhận chỉ tiêu, thẩm định định biên, đăng tin tuyển dụng ATS, phỏng vấn và gửi thư mời làm việc cho ứng viên.

### 2.1.5. Phân tầng yêu cầu: từ quy trình nghiệp vụ đến use case hệ thống

Để đảm bảo hệ thống phần mềm đáp ứng chuẩn xác nhu cầu vận hành thực tế của Công ty Cổ phần Phần mềm Saigon Technology, kiến trúc phân tích thực hiện chuyển hóa yêu cầu qua 3 tầng: Tầng quy trình nghiệp vụ thực tế doanh nghiệp -> Tầng Use case nghiệp vụ -> Tầng Use case hệ thống cài đặt trên phần mềm.

Dưới đây là mô tả chi tiết 18 quy trình nghiệp vụ cốt lõi đang được vận hành và số hóa hoàn chỉnh trên hệ thống:

**1. Quy trình Tuyển dụng nhân sự & Quản lý ứng viên (Recruitment & Applicant Tracking):**
- Bối cảnh & Căn cứ: Áp dụng khi các dự án phần mềm ký thêm hợp đồng với khách hàng quốc tế hoặc cần bổ sung nhân lực thay thế hao hụt tự nhiên. Căn cứ vào định biên dự án, ngân sách và bản mô tả công việc (JD).
- Trình tự thực hiện: Trưởng dự án lập phiếu đề xuất tuyển dụng trên hệ thống; Hệ thống kiểm tra định biên nhân sự phòng ban và gửi chuyên viên tuyển dụng thẩm định; Kế toán trưởng xác nhận khả năng chi trả của quỹ ngân sách; Giám đốc duyệt mở vị trí tuyển dụng. Chuyên viên tuyển dụng đăng tin trên bảng Kanban ATS (`/recruitment-ats`), tiếp nhận hồ sơ ứng viên, điều phối phỏng vấn 2 vòng (năng lực kỹ thuật và văn hóa), chấm điểm Scorecard. Khi đạt yêu cầu, HR gửi thư mời nhận việc (Offer) và bấm "1-Click Nhận việc" để tự động chuyển ứng viên thành nhân viên chính thức.
- Ánh xạ Use case & Giao diện: UC04, UC05, UC06, UC07, UC08. Giao diện: Tuyển dụng ATS (`/recruitment-ats`), Danh mục vị trí (`/admin/catalogs`).

**2. Quy trình Tiếp nhận hồ sơ & Hội nhập nhân viên mới (Onboarding & Integration):**
- Bối cảnh & Căn cứ: Áp dụng trong ngày đầu tiên tiếp nhận nhân sự, bảo đảm tuân thủ quy chuẩn An ninh thông tin ISO/IEC 27001 và Thỏa thuận bảo mật thông tin khách hàng (NDA).
- Trình tự thực hiện: Sau khi ứng viên đồng ý nhận việc, chuyên viên hồ sơ đối chiếu văn bằng gốc, CCCD gắn chip và ký hợp đồng thử việc; Hệ thống tự động sinh Mã nhân viên duy nhất và kích hoạt tài khoản cổng thông tin nội bộ; Bộ phận Hành chính cấp phát chỗ ngồi, thẻ từ; Bộ phận IT kích hoạt tài khoản hệ thống (Email, Slack, Jira, VPN) và máy trạm làm việc; Hệ thống tự động gán Lộ trình hội nhập 14 ngày (Onboarding Checklist) gồm các nhiệm vụ đào tạo chính sách và thiết lập môi trường phát triển dưới sự hướng dẫn của Mentor.
- Ánh xạ Use case & Giao diện: UC09, UC10, UC11, UC14. Giao diện: Hồ sơ nhân viên (`/employees`, `/employees/[id]`), Tài liệu hội nhập (`/documents`), Quản trị người dùng (`/admin/users`).

**3. Quy trình Đánh giá Thử việc & Ký Hợp đồng chính thức (Probation Assessment & Contract Signing):**
- Bối cảnh & Căn cứ: Căn cứ Điều 24 đến Điều 27 Bộ luật Lao động 2019 về thời hạn thử việc (tối đa 60 ngày đối với công việc kỹ thuật chuyên môn).
- Trình tự thực hiện: Trước ngày kết thúc thử việc 15 ngày, hệ thống tự động gửi thông báo nhắc nhở Trưởng dự án và HR; Trưởng dự án thực hiện chấm điểm đánh giá thử việc về năng suất code, tỷ lệ lỗi và thái độ làm việc; Chuyên viên tiền lương đối chiếu thang bảng lương để xác định mức thu nhập chính thức; Giám đốc phê duyệt kết quả; Hệ thống sinh Hợp đồng lao động có thời hạn và kích hoạt việc tham gia BHXH bắt buộc từ ngày ký hợp đồng chính thức.
- Ánh xạ Use case & Giao diện: UC10, UC13. Giao diện: Hồ sơ nhân viên - Tab Hợp đồng (`/employees/[id]`), Biến động nhân sự (`/personnel`), Khung bậc lương (`/salary-ranks`).

**4. Quy trình Phân ca, Chấm công & Điểm danh đa nguồn (Shift Scheduling & Multi-source Attendance):**
- Bối cảnh & Căn cứ: Phục vụ hơn 430 kỹ sư làm việc tại TP.HCM và Đà Nẵng theo nhiều ca: hành chính, lệch giờ (US/EU shift) và làm việc từ xa (Remote/Hybrid). Căn cứ Điều 97 Bộ luật Lao động 2019 về ghi nhận thời gian làm việc.
- Trình tự thực hiện: Trưởng dự án hoặc HR lập lịch phân ca cho từng nhân sự hoặc nhóm dự án; Hàng ngày, nhân viên thực hiện điểm danh qua một trong các kênh chuẩn hóa: (a) Máy chấm công vân tay/thẻ từ đẩy dữ liệu qua webhook có chữ ký HMAC-SHA256, (b) Kiosk nhận diện khuôn mặt sinh trắc học kết hợp cảm biến hồng ngoại IR chống giả mạo tại sảnh (`/check-in`), (c) Web Check-in trên cổng ESS; Hệ thống tự động ghép ca, tính toán giờ làm việc thực tế, thời gian đi muộn, về sớm và xác định trạng thái ngày công; Trường hợp quên điểm danh, nhân viên nộp đơn giải trình kèm minh chứng để quản lý phê duyệt hiệu chỉnh; Đến ngày 25 hàng tháng, chuyên viên nhân sự chốt bảng chấm công chuẩn bị cho kỳ tính lương.
- Ánh xạ Use case & Giao diện: UC18, UC19, UC20, UC23, UC24, UC25. Giao diện: Bảng chấm công (`/attendance`), Phân ca (`/shifts`), Kiosk điểm danh (`/check-in`), Quản trị máy chấm công (`/admin/attendance`).

**5. Quy trình Quản lý Nghỉ phép (Leave Management):**
- Bối cảnh & Căn cứ: Căn cứ Điều 113 đến Điều 115 Bộ luật Lao động 2019 về chế độ nghỉ phép năm (12 ngày phép cơ bản, cộng thêm 1 ngày sau mỗi 5 năm thâm niên) và các chế độ nghỉ việc riêng, nghỉ bảo hiểm (ốm đau, thai sản).
- Trình tự thực hiện: Nhân viên tra cứu số dư phép khả dụng trên cổng ESS (`/leave`) và tạo đơn xin nghỉ phép; Hệ thống tự động kiểm tra số dư: nếu quỹ phép còn đủ, chuyển đơn tới Trưởng dự án phê duyệt; Trưởng dự án cân đối tiến độ chạy nước rút (Sprint) để phê duyệt hoặc từ chối; Khi đơn được duyệt, hệ thống tự động trừ quỹ phép ngay lập tức và nạp ngày nghỉ vào bảng chấm công tháng; Bộ phận C&B theo dõi các chứng từ nghỉ ốm đau, thai sản để làm thủ tục trợ cấp BHXH.
- Ánh xạ Use case & Giao diện: UC15, UC21. Giao diện: Quản lý nghỉ phép (`/leave`), Cổng thông tin nhân viên (`/ess`).

**6. Quy trình Quản lý Làm thêm giờ (Overtime Management - OT):**
- Bối cảnh & Căn cứ: Căn cứ Điều 107 Bộ luật Lao động 2019 và Nghị định 145/2020/NĐ-CP về giới hạn làm thêm giờ (tối đa không quá 40 giờ/tháng và 200 giờ/năm).
- Trình tự thực hiện: Khi dự án cần huy động làm thêm giờ để kịp tiến độ bàn giao sản phẩm, Trưởng dự án lập kế hoạch OT hoặc nhân viên nộp đơn đăng ký trước; Hệ thống tự động kiểm tra số giờ lũy kế trong tháng và trong năm: nếu vượt trần quy định, tự động chặn đăng ký; Sau khi hoàn thành ca làm thêm, nhân viên điểm danh xác nhận và nộp bảng kê khối lượng công việc; Quản lý dự án phê duyệt nghiệm thu giờ công; Hệ thống tự động tính hệ số lương làm thêm (150% ngày thường, 200% ngày nghỉ cuối tuần, 300% ngày lễ) nạp vào bảng lương tháng.
- Ánh xạ Use case & Giao diện: UC15, UC22. Giao diện: Quản lý làm thêm giờ (`/overtime`), Bảng chấm công (`/attendance`).

**7. Quy trình Chu kỳ Tính & Khóa Bảng lương hàng tháng (Monthly Payroll Cycle):**
- Bối cảnh & Căn cứ: Căn cứ Điều 90 đến Điều 104 Bộ luật Lao động 2019, Luật Thuế TNCN và Luật Bảo hiểm xã hội hiện hành.
- Trình tự thực hiện: Vào ngày 25 hàng tháng, bộ phận nhân sự khóa dữ liệu chấm công; Chuyên viên tiền lương kích hoạt Động cơ tính lương tự động (`/payroll-engine`); Hệ thống tự động tính toán chi tiết: lương thời gian theo ngày công thực tế, lương làm thêm giờ, phụ cấp, thưởng dự án, trích nộp bảo hiểm xã hội (10.5%), giảm trừ gia cảnh, tính thuế TNCN theo biểu lũy tiến và khấu trừ nợ vay phúc lợi (đảm bảo tổng khấu trừ không vượt quá 30% lương Net); Kế toán trưởng đối soát tổng quỹ lương; Giám đốc phê duyệt điện tử; Chuyên viên nhân sự chuyển trạng thái kỳ lương sang LOCKED (kích hoạt cơ chế bất biến, chặn hoàn toàn mọi thao tác tính lại với lỗi HTTP 409); Hệ thống kết xuất lệnh chi ngân hàng và phát hành Phiếu lương điện tử (ePayslip) bảo mật tới từng nhân viên qua cổng ESS.
- Ánh xạ Use case & Giao diện: UC25, UC26, UC27, UC28. Giao diện: Động cơ tính lương (`/payroll-engine`), Phiếu lương cá nhân (`/ess`), Báo cáo nhân sự (`/personnel-reports`).

**8. Quy trình Tạm ứng Lương & Khoản vay phúc lợi (Advance & Welfare Loans):**
- Bối cảnh & Căn cứ: Căn cứ Điều 101 và Điều 102 Bộ luật Lao động 2019 về tạm ứng tiền lương, giới hạn khấu trừ lương (không quá 30% thực lĩnh) và Quy chế Quỹ phúc lợi nội bộ của Saigon Technology (hạn mức luân chuyển 2 tỷ VNĐ).
- Trình tự thực hiện: Nhân viên sử dụng công cụ mô phỏng tài chính trên giao diện `/loans` kéo chọn số tiền và thời hạn vay (6-36 tháng); Hệ thống tự động tính số tiền trích nợ mỗi kỳ (EMI) và kiểm tra ngưỡng an toàn thu nhập theo Điều 102 (nếu tỷ lệ khấu trừ > 30% lương Net, hệ thống cảnh báo và yêu cầu kéo dài kỳ hạn); Nhân viên nộp hồ sơ theo các gói mục tiêu; Chuyên viên C&B sử dụng công cụ phê duyệt nhanh 1-chạm hoặc trình Giám đốc phê duyệt; Sau khi giải ngân, hệ thống tự động sinh lịch trình hoàn nợ và tự động nạp khoản trích trừ vào phiếu lương hàng tháng; Nhân viên có thể thực hiện tất toán sớm bất kỳ lúc nào trực tiếp trên giao diện mà không chịu phí phạt.
- Ánh xạ Use case & Giao diện: UC15, UC29. Giao diện: Quản trị Phúc lợi & Khoản vay (`/loans`), Cổng ESS (`/ess`), Động cơ tính lương (`/payroll-engine`).

**9. Quy trình Đề xuất công tác & Quyết toán chi phí (Travel & Expense Claims):**
- Bối cảnh & Căn cứ: Phục vụ các đợt cử chuyên gia, kỹ sư đi công tác tại các chi nhánh (Hà Nội, Đà Nẵng, TP.HCM) hoặc làm việc trực tiếp tại văn phòng khách hàng quốc tế (Onsite). Căn cứ Quy chế tài chính nội bộ và quy định về chứng từ thuế hợp lệ.
- Trình tự thực hiện: Kỹ sư lập đề xuất công tác trên hệ thống, nêu rõ địa điểm, thời gian và dự toán kinh phí; Quản lý dự án và Giám đốc phê duyệt; Kế toán giải ngân tạm ứng; Sau chuyến công tác, nhân viên đính kèm các hóa đơn điện tử hợp lệ (vé máy bay, khách sạn, công tác phí theo ngày) lập bảng thanh quyết toán chi phí; Kế toán thẩm tra hóa đơn và chi trả phần chênh lệch hoặc thu hồi tạm ứng thừa.
- Ánh xạ Use case & Giao diện: UC15, UC30. Giao diện: Quản lý công tác phí (`/expense-claims`), Cổng ESS (`/ess`).

**10. Quy trình Quản lý Cấp phát & Thu hồi Tài sản, Thiết bị (Asset Lifecycle Management):**
- Bối cảnh & Căn cứ: Quản lý vòng đời tài sản kỹ thuật cao (laptop, màn hình phụ, thiết bị kiểm thử) theo tiêu chuẩn bảo mật ISO 27001.
- Trình tự thực hiện: Căn cứ đề xuất của dự án hoặc tiếp nhận nhân sự mới, bộ phận Hành chính lập phiếu bàn giao tài sản, ghi nhận số seri, cấu hình và trạng thái thiết bị; Nhân viên ký nhận bàn giao điện tử trên cổng ESS; Hệ thống theo dõi lịch sử luân chuyển, bảo dưỡng định kỳ và cảnh báo thiết bị đến hạn khấu hao; Khi nhân viên chuyển dự án hoặc thôi việc, bộ phận Hành chính thực hiện kiểm kê, thu hồi tài sản và xác nhận hoàn tất nghĩa vụ trên hệ thống.
- Ánh xạ Use case & Giao diện: UC15, UC31. Giao diện: Quản lý tài sản (`/assets`), Cổng thông tin cá nhân (`/ess`).

**11. Quy trình Đánh giá Hiệu suất 360 độ & Quản trị Mục tiêu OKR/KPI:**
- Bối cảnh & Căn cứ: Đánh giá năng lực chuyên môn và mức độ đóng góp định kỳ 6 tháng một lần làm căn cứ xét thưởng, tăng lương và quy hoạch cán bộ.
- Trình tự thực hiện: Đầu chu kỳ, nhân viên cùng Trưởng dự án thiết lập mục tiêu KRA/KPI với tỷ trọng % cụ thể; Cuối chu kỳ, nhân viên thực hiện tự đánh giá thành tích; Hệ thống điều phối đánh giá chéo đồng cấp (Peer Review) từ các đồng nghiệp cùng dự án; Trưởng dự án tổng hợp kết quả, thực hiện phỏng vấn đánh giá và chấm điểm tổng kết; Nhân viên xem kết quả và ký xác nhận điện tử; Kết quả xếp loại (A, B, C, D) được lưu trữ vào hồ sơ năng lực và tự động chuyển sang phân hệ lương để xét thưởng.
- Ánh xạ Use case & Giao diện: UC15, UC37. Giao diện: Đánh giá hiệu suất 360 (`/performance-360`), Hồ sơ nhân viên (`/employees/[id]`).

**12. Quy trình Rà soát Tăng lương định kỳ & Nâng bậc lương chuẩn Nghị định 204:**
- Bối cảnh & Căn cứ: Căn cứ quy chế tiền lương của doanh nghiệp và hệ thống ngạch bậc lương chuẩn Nghị định 204/2004/NĐ-CP (áp dụng cho khối chuyên gia và cán bộ nòng cốt).
- Trình tự thực hiện: Định kỳ hàng quý, hệ thống tự động quét dữ liệu diễn biến lương (`SalaryProgress`), lập danh sách nhân sự đủ thời gian giữ bậc (24 tháng đối với ngạch B, C; 36 tháng đối với ngạch A1 trở lên); Chuyên viên tiền lương rà soát, đối chiếu với kết quả đánh giá KPI và năng lực thực tế; Lập tờ trình nâng bậc lương kèm hệ số mới hoặc phụ cấp thâm niên vượt khung; Giám đốc xem xét và ký Quyết định nâng bậc lương; Hệ thống tự động cập nhật hệ số mới vào hợp đồng và áp dụng cho kỳ lương tiếp theo.
- Ánh xạ Use case & Giao diện: UC33, UC41, UC42. Giao diện: Bảng bậc lương (`/salary-ranks`), Biến động nhân sự (`/personnel`), Động cơ tính lương (`/payroll-engine`).

**13. Quy trình Điều chuyển, Luân chuyển & Bổ nhiệm vị trí công tác (Transfer & Promotion):**
- Bối cảnh & Căn cứ: Thực hiện khi điều động nhân sự giữa các dự án phần mềm, bổ nhiệm cán bộ quản lý hoặc luân chuyển giữa các chi nhánh TP.HCM - Đà Nẵng.
- Trình tự thực hiện: Trưởng dự án lập đề xuất điều chuyển nhân viên; Quản lý đơn vị tiếp nhận và chuyên viên nhân sự kiểm tra năng lực và sự phù hợp; Giám đốc phê duyệt lệnh điều chuyển; Hệ thống tự động cập nhật lại cơ cấu tổ chức phòng ban, chức danh công tác và quyền hạn dự án của nhân viên trên hệ thống phần mềm.
- Ánh xạ Use case & Giao diện: UC09, UC32. Giao diện: Biến động nhân sự (`/personnel`), Sơ đồ tổ chức (`/org-chart`), Hồ sơ nhân sự (`/employees/[id]`).

**14. Quy trình Quản lý Đào tạo nội bộ & Giải quyết Khiếu nại (Training & Grievance Handling):**
- Bối cảnh & Căn cứ: Nâng cao năng lực kỹ thuật công nghệ mới cho kỹ sư và duy trì môi trường làm việc minh bạch, tuân thủ pháp luật lao động.
- Trình tự thực hiện: Bộ phận Đào tạo xây dựng chương trình đào tạo kỹ thuật, công bố lịch học và giới hạn sĩ số trên hệ thống; Nhân viên chủ động đăng ký tham gia; Sau khóa đào tạo, hệ thống ghi nhận kết quả hoàn thành vào hồ sơ cán bộ và thực hiện khảo sát chất lượng; Đối với khiếu nại lao động, nhân viên gửi ý kiến bảo mật qua kênh chuyên biệt; Chuyên viên nhân sự tiếp nhận, tổ chức xác minh và theo dõi xử lý từ trạng thái OPEN đến RESOLVED.
- Ánh xạ Use case & Giao diện: UC15, UC38, UC39. Giao diện: Đào tạo & Khiếu nại (`/training-grievance`), Hồ sơ nhân viên (`/employees/[id]`).

**15. Quy trình Khen thưởng, Kỷ luật & Xử lý vi phạm lao động (Reward & Disciplinary Action):**
- Bối cảnh & Căn cứ: Căn cứ Điều 117 đến Điều 132 Bộ luật Lao động 2019 về kỷ luật lao động, trách nhiệm vật chất và Quy chế thi đua khen thưởng của công ty.
- Trình tự thực hiện: Khi có thành tích xuất sắc, quản lý dự án lập đề xuất khen thưởng; Giám đốc duyệt và hệ thống tự động nạp tiền thưởng vào kỳ tính lương tiếp theo; Khi phát sinh hành vi vi phạm kỷ luật (vi phạm bảo mật thông tin, nghỉ làm không phép kéo dài), bộ phận nhân sự lập biên bản vi phạm; Tổ chức phiên họp xử lý kỷ luật có sự tham gia bắt buộc của Đại diện người lao động (Công đoàn); Giám đốc ký Quyết định kỷ luật; Hệ thống ghi nhận tiền án kỷ luật vào hồ sơ nhân sự và thực hiện tạm dừng nâng lương hoặc chấm dứt hợp đồng theo đúng quy định.
- Ánh xạ Use case & Giao diện: UC34, UC35. Giao diện: Biến động nhân sự (`/personnel`), Hồ sơ cán bộ (`/personnel-reports`).

**16. Quy trình Quản lý Hồ sơ Cán bộ Toàn diện & Báo cáo chuẩn Mẫu 2C-BNV/2008:**
- Bối cảnh & Căn cứ: Căn cứ Quyết định 06/2007/QĐ-BNV và Thông tư 11/2012/TT-BNV về quản lý hồ sơ cán bộ, công chức, viên chức.
- Trình tự thực hiện: Hệ thống quản lý toàn diện 111 thuộc tính thông tin cán bộ theo chuẩn Mẫu 2C-BNV/2008 kết hợp 8 bảng quá trình lịch sử (diễn biến lương, đào tạo, khen thưởng, kỷ luật, gia đình...); Chuyên viên hồ sơ tra cứu, cập nhật dữ liệu; Khi có yêu cầu báo cáo cho cơ quan quản lý nhà nước hoặc lưu trữ hành chính, hệ thống tự động kết xuất Sơ yếu lý lịch Mẫu 2C-BNV định dạng PDF khổ in A4 4 trang và các Biểu 01, 02, 03 định dạng bảng tính Excel.
- Ánh xạ Use case & Giao diện: UC40, UC43. Giao diện: Báo cáo nhân sự & Cán bộ (`/personnel-reports`), Danh mục dùng chung (`/admin/catalogs`).

**17. Quy trình Thôi việc, Nghỉ việc & Bàn giao Đa bộ phận (Offboarding & Handover Checklist):**
- Bối cảnh & Căn cứ: Căn cứ Điều 34 đến Điều 48 Bộ luật Lao động 2019 về chấm dứt hợp đồng lao động và nghĩa vụ của các bên khi chấm dứt HĐLĐ.
- Trình tự thực hiện: Nhân viên gửi đơn xin thôi việc trên hệ thống; Quản lý dự án và Giám đốc phê duyệt; Hệ thống tự động khởi tạo Danh mục bàn giao trách nhiệm 5 bước độc lập (`HandoverChecklist`); Lần lượt từng bộ phận kiểm tra và bấm xác nhận bàn giao điện tử (PM xác nhận mã nguồn, Hành chính thu hồi tài sản, IT thu hồi tài khoản và quyền truy cập, C&B quyết toán công nợ và ngày phép, Hệ thống tự động xóa vector khuôn mặt sinh trắc học theo Nghị định 13); Chỉ khi 5/5 hạng mục được xác nhận đầy đủ, Giám đốc mới ký Quyết định thôi việc; Đến ngày làm việc cuối cùng, tài khoản của nhân viên tự động bị khóa vĩnh viễn.
- Ánh xạ Use case & Giao diện: UC36. Giao diện: Biến động nhân sự (`/personnel`), Danh mục bàn giao (`/documents`), Quản trị người dùng (`/admin/users`).

**18. Quy trình Phân cấp Quản trị Dữ liệu Cá nhân & Thẩm định Điều chỉnh Hồ sơ Nhân sự:**
- Bối cảnh & Căn cứ: Căn cứ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, nhằm ngăn ngừa việc tự ý chỉnh sửa các thông tin định danh pháp lý và tài chính.
- Trình tự thực hiện: Dữ liệu hồ sơ nhân sự được phân định thành 3 phân cấp: Mức 1 (Thông tin liên lạc như SĐT, địa chỉ - nhân viên tự sửa trên ESS); Mức 2 (Thông tin định danh pháp lý và tài chính như CCCD, số tài khoản ngân hàng, bằng cấp - nhân viên lập đề xuất thay đổi kèm hình ảnh chứng từ minh chứng hợp lệ); Mức 3 (Vị trí, ngạch bậc, mức lương - khóa cố định chỉ xem, chỉ thay đổi qua quyết định hành chính); Chuyên viên hồ sơ tiếp nhận yêu cầu Mức 2 tại Hàng đợi thẩm định (`ProfileChangeReviewQueue`), đối soát ảnh chụp minh chứng với dữ liệu đề xuất; Bấm phê duyệt để hệ thống cập nhật nguyên tử vào CSDL và lưu vết kiểm toán, hoặc từ chối kèm lý do phản hồi cho nhân viên.
- Ánh xạ Use case & Giao diện: UC16, UC17. Giao diện: Cổng ESS (`/ess`), Hồ sơ cá nhân (`/profile`), Quản lý nhân viên (`/employees`).

**Bảng 2.5. Bảng ánh xạ ba tầng: từ Quy trình nghiệp vụ đến Use Case và Màn hình thực tế**

| STT | Tên Quy trình nghiệp vụ thực tế | Tác nhân chính | Mã Use Case hệ thống tương ứng | Giao diện màn hình thực tế trong ứng dụng |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Tuyển dụng & Quản trị ứng viên | Trưởng dự án, CV Tuyển dụng, Giám đốc | UC04, UC05, UC06, UC07, UC08 | `/recruitment-ats`, `/admin/catalogs` |
| 2 | Tiếp nhận hồ sơ & Hội nhập | Nhân viên mới, CV Hồ sơ, IT | UC09, UC10, UC11, UC14 | `/employees`, `/documents`, `/admin/users` |
| 3 | Đánh giá thử việc & Ký hợp đồng | Trưởng dự án, CV Hồ sơ, Giám đốc | UC10, UC13 | `/employees/[id]`, `/personnel`, `/salary-ranks` |
| 4 | Phân ca & Điểm danh đa nguồn | Toàn thể nhân viên, Kiosk, CV Hồ sơ | UC18, UC19, UC20, UC23, UC24, UC25 | `/shifts`, `/check-in`, `/attendance`, `/admin/attendance` |
| 5 | Quản lý Nghỉ phép | Nhân viên, Trưởng dự án, CV Hồ sơ | UC15, UC21 | `/leave`, `/ess` |
| 6 | Quản lý Làm thêm giờ (OT) | Nhân viên, Trưởng dự án, CV Tiền lương | UC15, UC22 | `/overtime`, `/attendance` |
| 7 | Chu kỳ Tính & Khóa Bảng lương | CV Tiền lương, Kế toán, Giám đốc | UC25, UC26, UC27, UC28 | `/payroll-engine`, `/ess`, `/personnel-reports` |
| 8 | Tạm ứng & Khoản vay phúc lợi | Nhân viên, CV Tiền lương, Giám đốc | UC15, UC29 | `/loans`, `/ess`, `/payroll-engine` |
| 9 | Đề xuất & Quyết toán công tác | Nhân viên, Trưởng dự án, Kế toán | UC15, UC30 | `/expense-claims`, `/ess` |
| 10 | Quản lý Cấp phát & Thu hồi tài sản | Nhân viên Hành chính, Nhân viên | UC15, UC31 | `/assets`, `/ess` |
| 11 | Đánh giá Hiệu suất 360 & OKR/KPI | Nhân viên, Trưởng dự án, CV Nhân sự | UC15, UC37 | `/performance-360`, `/employees/[id]` |
| 12 | Rà soát & Nâng bậc lương NĐ 204 | CV Hồ sơ, Giám đốc | UC33, UC41, UC42 | `/salary-ranks`, `/personnel`, `/payroll-engine` |
| 13 | Điều chuyển & Bổ nhiệm vị trí | Trưởng dự án, Giám đốc, CV Hồ sơ | UC09, UC32 | `/personnel`, `/org-chart`, `/employees/[id]` |
| 14 | Đào tạo nội bộ & Khiếu nại | CV Nhân sự, Nhân viên | UC15, UC38, UC39 | `/training-grievance`, `/employees/[id]` |
| 15 | Khen thưởng & Kỷ luật lao động | Trưởng dự án, Đại diện NLĐ, Giám đốc | UC34, UC35 | `/personnel`, `/personnel-reports` |
| 16 | Hồ sơ cán bộ & Báo cáo Mẫu 2C-BNV | CV Hồ sơ | UC40, UC43 | `/personnel-reports`, `/admin/catalogs` |
| 17 | Thôi việc & Bàn giao đa bộ phận | Nhân viên, CV Hồ sơ, Các bộ phận | UC36 | `/personnel`, `/documents`, `/admin/users` |
| 18 | Phân cấp Quản trị Dữ liệu Cá nhân | Toàn thể nhân viên, CV Hồ sơ | UC16, UC17 | `/ess`, `/profile`, `/employees` |

---

## 2.2. Phân tích cấu trúc hệ thống

### 2.2.1. Định nghĩa và biểu diễn đối tượng, lớp

Trong phương pháp phân tích thiết kế hướng đối tượng (OOAD), đối tượng (Object) đại diện cho một thực thể cụ thể trong miền bài toán thực tế, mang trong mình trạng thái dữ liệu (thuộc tính) và khả năng xử lý nghiệp vụ (phương thức). Lớp (Class) là bản thiết kế trừu tượng định nghĩa tập hợp các thuộc tính và hành vi chung cho một nhóm đối tượng.

Để phân tách trách nhiệm rõ ràng theo mẫu kiến trúc BCE (Boundary - Control - Entity), các lớp trong hệ thống được phân thành ba nhóm chính:

Lớp Thực thể (Entity Class): Đại diện cho các đối tượng lưu trữ dữ liệu bền vững của doanh nghiệp, ánh xạ trực tiếp thành các model trong ORM Prisma và các bảng dữ liệu quan hệ trong PostgreSQL 16. Các lớp này chịu trách nhiệm duy trì tính toàn vẹn của dữ liệu nghiệp vụ (ví dụ: NhanVien, HopDong, PhieuLuong, DonNghiPhep).

Lớp Biên / Giao diện (Boundary Class): Đóng vai trò là cổng giao tiếp tương tác giữa tác nhân bên ngoài với hệ thống bên trong, bao gồm các trang màn hình tác nghiệp Next.js, biểu mẫu nhập liệu, bảng hiển thị dữ liệu và các hộp thoại tương tác.

Lớp Điều khiển (Control Class): Đóng vai trò là bộ não xử lý logic và điều phối các luồng nghiệp vụ trung tâm, được hiện thực hóa bằng các dịch vụ NestJS Service (như AuthService, RecruitmentService, AttendanceService, PayrollService).

### 2.2.2. Xác định các đối tượng, lớp từ đặc tả yêu cầu

Bằng phương pháp phân tích ngôn ngữ tự nhiên từ tài liệu khảo sát hiện trạng và đặc tả các ca sử dụng, hệ thống xác định các lớp thực thể cốt lõi tương ứng với các phân hệ chức năng:

Nhóm Đối tượng Con người & Tổ chức:
- NguoiDung (User): Lưu trữ thông tin định danh cơ bản (Mã, Họ tên, Ngày sinh, CCCD, Email, SĐT, Địa chỉ);
- NhanVien (Employee): Kế thừa từ NguoiDung, bổ sung thông tin nhân sự (Mã NV, Ngày vào công ty, Vị trí, Đơn vị trực thuộc, Trạng thái PROBATION/ACTIVE/RESIGNED);
- DonVi (OrgUnit): Cấu trúc phòng ban và chi nhánh theo mô hình cây tự tham chiếu, quản lý định biên nhân sự;
- VaiTro (Role): Vai trò phân quyền (USER, KM_MANAGER, ADMIN);
- TaiKhoan (Account): Định danh xác thực, mật khẩu băm bcrypt, mã token JWT và trạng thái khóa tài khoản.

Nhóm Đối tượng Tuyển dụng & Đào tạo:
- PhieuTuyenDung (JobRequisition): Đề xuất tuyển dụng, vị trí, số lượng cần tuyển, trạng thái phê duyệt;
- UngVien (Candidate): Hồ sơ ứng viên, CV đính kèm, trạng thái trên pipeline ATS;
- VongPhongVan (InterviewStage): Thông tin vòng phỏng vấn, người phỏng vấn, nhận xét và điểm số Scorecard;
- ThuMoi (JobOffer): Thư mời nhận việc, mức lương thỏa thuận, ngày nhận việc;
- KhoaDaoTao (TrainingCourse): Chương trình đào tạo kỹ thuật, số lượng chỗ, giảng viên và kết quả đánh giá;
- KhieuNai (Grievance): Đơn phản ánh, khiếu nại bảo mật và tiến độ giải quyết.

Nhóm Đối tượng Hồ sơ, Hợp đồng & Biến động:
- HopDong (Contract): Hợp đồng thử việc, hợp đồng xác định thời hạn (12-36 tháng), lương cơ bản, lương đóng BHXH;
- VanBang (Certificate): Bằng tốt nghiệp đại học, chứng chỉ công nghệ, số hiệu, nơi cấp, bản quét lưu trữ;
- PhieuMuonTra (DocumentLending): Phiếu mượn - trả bằng cấp bản gốc, ngày mượn, hạn trả, ngày thu hồi;
- DeXuatBienDong (PersonnelAction): Đề xuất dùng chung cho các luồng thuyên chuyển, tăng lương, khen thưởng, kỷ luật, thôi việc;
- NhiemVuBanGiao (HandoverChecklist): Danh mục kiểm tra trách nhiệm bàn giao 5 bước độc lập khi thôi việc.

Nhóm Đối tượng Chấm công, Nghỉ phép & Điểm danh:
- SuKienDiemDanh (AttendanceEvent): Sự kiện điểm danh bất biến (Thời điểm, Nguồn: MACHINE/WEB/FACE/SIMULATOR, Cờ lệch);
- ThietBiChamCong (AttendanceDevice): Cấu hình máy chấm công phần cứng, vị trí lắp đặt, khóa xác thực HMAC;
- MauKhuonMat (FaceEmbedding): Vector đặc trưng khuôn mặt 128 chiều đã mã hóa AES-256-GCM (không lưu ảnh gốc);
- CaLamViec (WorkShift): Khung giờ làm việc chuẩn, thời gian nghỉ giữa ca, dung sai ân hạn đi muộn;
- BangCongNgay (DailyAttendance): Tổng hợp ngày công, giờ vào/ra thực tế, phút đi muộn, về sớm, giờ làm thêm;
- DonNghiPhep (LeaveRequest): Đơn xin nghỉ phép, loại phép, khoảng thời gian, trạng thái phê duyệt;
- SoDuPhep (LeaveBalance): Quỹ phép năm của nhân viên (12 ngày chuẩn + thâm niên 1 ngày/5 năm).

Nhóm Đối tượng Tiền lương, Phúc lợi & Tài sản:
- ThanhPhanLuong (SalaryComponent): Thành phần lương Gross, phụ cấp, thưởng, các khoản khấu trừ;
- KyLuong (PayrollPeriod): Kỳ lương tháng, trạng thái chu kỳ (OPEN -> REVIEWED -> LOCKED);
- PhieuLuong (Payslip): Phiếu lương điện tử chi tiết từng cá nhân;
- KhoanVay (EmployeeLoan): Khoản vay phúc lợi, lãi suất ưu đãi, thời hạn, số tiền khấu trừ mỗi kỳ (EMI <= 30% lương Net);
- CongTacPhi (ExpenseClaim): Đề xuất công tác, tạm ứng và bảng thanh quyết toán chi phí kèm hóa đơn điện tử;
- TaiSan (Asset): Quản lý vòng đời tài sản thiết bị kỹ thuật (laptop, màn hình), trạng thái bàn giao và thu hồi.

Nhóm Đối tượng Quản trị & Tri thức:
- HoSoCanBo (CadreProfile): Hồ sơ lý lịch 111 thuộc tính theo Mẫu 2C-BNV/2008 và 8 bảng diễn biến lịch sử;
- NgachLuong (SalaryGrade): Khung 184 ngạch bậc lương chuẩn Nghị định 204/2004/NĐ-CP;
- BaiViet (Article): Bài viết quy trình SOP, phiên bản nội dung bất biến (ArticleVersion);
- NhatKyKiemToan (AuditLog): Nhật ký kiểm toán hệ thống ghi vết chỉ thêm (Append-Only) cho mọi giao dịch dữ liệu.

## 2.3. Phân tích hành vi của hệ thống

### 2.3.1. Xây dựng biểu đồ trình tự (Sequence Diagram)

Biểu đồ trình tự (Sequence Diagram) mô tả chi tiết chuỗi tương tác theo thứ tự thời gian giữa các tác nhân người dùng, lớp biên giao diện (Boundary), lớp điều khiển nghiệp vụ (Control) và các thực thể dữ liệu (Entity) trong hệ thống. Dưới đây là đầy đủ 47 biểu đồ trình tự tương ứng với 47 Use Case nghiệp vụ của toàn bộ hệ thống quản trị nhân lực:

#### 2.3.1.1. Biểu đồ trình tự Use case Đăng nhập & Xác thực hệ thống (UC01)

Kịch bản tương tác Use Case UC01: Tác nhân Toàn thể nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.4: Biểu đồ trình tự Use case Đăng nhập & Xác thực hệ thống (UC01)](images/hinh_seq_uc01.png)

#### 2.3.1.2. Biểu đồ trình tự Use case Quản trị người dùng & Phân quyền RBAC (UC02)

Kịch bản tương tác Use Case UC02: Tác nhân Nhân viên Quản trị IT tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.5: Biểu đồ trình tự Use case Quản trị người dùng & Phân quyền RBAC (UC02)](images/hinh_seq_uc02.png)

#### 2.3.1.3. Biểu đồ trình tự Use case Quản trị cơ cấu tổ chức & Cây phòng ban (UC03)

Kịch bản tương tác Use Case UC03: Tác nhân Nhân viên Quản trị IT tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.6: Biểu đồ trình tự Use case Quản trị cơ cấu tổ chức & Cây phòng ban (UC03)](images/hinh_seq_uc03.png)

#### 2.3.1.4. Biểu đồ trình tự Use case Lập phiếu đề xuất tuyển dụng nhân sự (UC04)

Kịch bản tương tác Use Case UC04: Tác nhân Trưởng dự án tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.7: Biểu đồ trình tự Use case Lập phiếu đề xuất tuyển dụng nhân sự (UC04)](images/hinh_seq_uc04.png)

#### 2.3.1.5. Biểu đồ trình tự Use case Thẩm định chỉ tiêu & Kiểm soát định biên tuyển dụng (UC05)

Kịch bản tương tác Use Case UC05: Tác nhân Chuyên viên Tuyển dụng, Kế toán tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.8: Biểu đồ trình tự Use case Thẩm định chỉ tiêu & Kiểm soát định biên tuyển dụng (UC05)](images/hinh_seq_uc05.png)

#### 2.3.1.6. Biểu đồ trình tự Use case Phê duyệt chỉ tiêu tuyển dụng (UC06)

Kịch bản tương tác Use Case UC06: Tác nhân Giám đốc tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.9: Biểu đồ trình tự Use case Phê duyệt chỉ tiêu tuyển dụng (UC06)](images/hinh_seq_uc06.png)

#### 2.3.1.7. Biểu đồ trình tự Use case Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban (UC07)

Kịch bản tương tác Use Case UC07: Tác nhân Chuyên viên Tuyển dụng tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.10: Biểu đồ trình tự Use case Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban (UC07)](images/hinh_seq_uc07.png)

#### 2.3.1.8. Biểu đồ trình tự Use case Gửi thư mời nhận việc & Thỏa thuận mức lương (UC08)

Kịch bản tương tác Use Case UC08: Tác nhân Chuyên viên Tuyển dụng, Ứng viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.11: Biểu đồ trình tự Use case Gửi thư mời nhận việc & Thỏa thuận mức lương (UC08)](images/hinh_seq_uc08.png)

#### 2.3.1.9. Biểu đồ trình tự Use case Quản lý hồ sơ nhân viên toàn diện (UC09)

Kịch bản tương tác Use Case UC09: Tác nhân Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.12: Biểu đồ trình tự Use case Quản lý hồ sơ nhân viên toàn diện (UC09)](images/hinh_seq_uc09.png)

#### 2.3.1.10. Biểu đồ trình tự Use case Quản lý hợp đồng lao động & Phụ lục hợp đồng (UC10)

Kịch bản tương tác Use Case UC10: Tác nhân Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.13: Biểu đồ trình tự Use case Quản lý hợp đồng lao động & Phụ lục hợp đồng (UC10)](images/hinh_seq_uc10.png)

#### 2.3.1.11. Biểu đồ trình tự Use case Quản lý văn bằng, chứng chỉ chuyên môn (UC11)

Kịch bản tương tác Use Case UC11: Tác nhân Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.14: Biểu đồ trình tự Use case Quản lý văn bằng, chứng chỉ chuyên môn (UC11)](images/hinh_seq_uc11.png)

#### 2.3.1.12. Biểu đồ trình tự Use case Mượn - trả hồ sơ, chứng chỉ bản gốc (UC12)

Kịch bản tương tác Use Case UC12: Tác nhân Nhân viên, Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.15: Biểu đồ trình tự Use case Mượn - trả hồ sơ, chứng chỉ bản gốc (UC12)](images/hinh_seq_uc12.png)

#### 2.3.1.13. Biểu đồ trình tự Use case Đánh giá kết quả thử việc & Ký HĐLĐ chính thức (UC13)

Kịch bản tương tác Use Case UC13: Tác nhân Trưởng dự án, Chuyên viên Hồ sơ, Giám đốc tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.16: Biểu đồ trình tự Use case Đánh giá kết quả thử việc & Ký HĐLĐ chính thức (UC13)](images/hinh_seq_uc13.png)

#### 2.3.1.14. Biểu đồ trình tự Use case Lộ trình hội nhập nhân viên mới (Onboarding Checklist) (UC14)

Kịch bản tương tác Use Case UC14: Tác nhân Nhân viên mới, Chuyên viên Hồ sơ, Mentor tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.17: Biểu đồ trình tự Use case Lộ trình hội nhập nhân viên mới (Onboarding Checklist) (UC14)](images/hinh_seq_uc14.png)

#### 2.3.1.15. Biểu đồ trình tự Use case Cổng tự phục vụ nhân viên tập trung (ESS Portal) (UC15)

Kịch bản tương tác Use Case UC15: Tác nhân Toàn thể nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.18: Biểu đồ trình tự Use case Cổng tự phục vụ nhân viên tập trung (ESS Portal) (UC15)](images/hinh_seq_uc15.png)

#### 2.3.1.16. Biểu đồ trình tự Use case Quản lý thông tin cá nhân phân cấp 3 mức độ (UC16)

Kịch bản tương tác Use Case UC16: Tác nhân Toàn thể nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.19: Biểu đồ trình tự Use case Quản lý thông tin cá nhân phân cấp 3 mức độ (UC16)](images/hinh_seq_uc16.png)

#### 2.3.1.17. Biểu đồ trình tự Use case Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2 (UC17)

Kịch bản tương tác Use Case UC17: Tác nhân Chuyên viên Hồ sơ, Quản trị viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.20: Biểu đồ trình tự Use case Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2 (UC17)](images/hinh_seq_uc17.png)

#### 2.3.1.18. Biểu đồ trình tự Use case Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca (UC18)

Kịch bản tương tác Use Case UC18: Tác nhân Toàn thể nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.21: Biểu đồ trình tự Use case Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca (UC18)](images/hinh_seq_uc18.png)

#### 2.3.1.19. Biểu đồ trình tự Use case Điểm danh sinh trắc học khuôn mặt & Cảm biến IR (UC19)

Kịch bản tương tác Use Case UC19: Tác nhân Nhân viên, Kiosk điểm danh tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.22: Biểu đồ trình tự Use case Điểm danh sinh trắc học khuôn mặt & Cảm biến IR (UC19)](images/hinh_seq_uc19.png)

#### 2.3.1.20. Biểu đồ trình tự Use case Quản trị kết nối thiết bị máy chấm công (UC20)

Kịch bản tương tác Use Case UC20: Tác nhân Chuyên viên Hồ sơ, Quản trị IT tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.23: Biểu đồ trình tự Use case Quản trị kết nối thiết bị máy chấm công (UC20)](images/hinh_seq_uc20.png)

#### 2.3.1.21. Biểu đồ trình tự Use case Đăng ký & Xét duyệt nghỉ phép trực tuyến (UC21)

Kịch bản tương tác Use Case UC21: Tác nhân Nhân viên, Trưởng dự án, Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.24: Biểu đồ trình tự Use case Đăng ký & Xét duyệt nghỉ phép trực tuyến (UC21)](images/hinh_seq_uc21.png)

#### 2.3.1.22. Biểu đồ trình tự Use case Đăng ký & Phê duyệt làm thêm giờ (OT) (UC22)

Kịch bản tương tác Use Case UC22: Tác nhân Nhân viên, Trưởng dự án, Chuyên viên Tiền lương tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.25: Biểu đồ trình tự Use case Đăng ký & Phê duyệt làm thêm giờ (OT) (UC22)](images/hinh_seq_uc22.png)

#### 2.3.1.23. Biểu đồ trình tự Use case Lập lịch và phân ca làm việc (Shift Scheduling) (UC23)

Kịch bản tương tác Use Case UC23: Tác nhân Trưởng dự án, Chuyên viên Tiền lương tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.26: Biểu đồ trình tự Use case Lập lịch và phân ca làm việc (Shift Scheduling) (UC23)](images/hinh_seq_uc23.png)

#### 2.3.1.24. Biểu đồ trình tự Use case Giải trình bổ sung giờ công & Xử lý lệch công (UC24)

Kịch bản tương tác Use Case UC24: Tác nhân Nhân viên, Trưởng dự án, Chuyên viên Tiền lương tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.27: Biểu đồ trình tự Use case Giải trình bổ sung giờ công & Xử lý lệch công (UC24)](images/hinh_seq_uc24.png)

#### 2.3.1.25. Biểu đồ trình tự Use case Tổng hợp & Chốt bảng chấm công tháng (UC25)

Kịch bản tương tác Use Case UC25: Tác nhân Chuyên viên Tiền lương, Trưởng dự án tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.28: Biểu đồ trình tự Use case Tổng hợp & Chốt bảng chấm công tháng (UC25)](images/hinh_seq_uc25.png)

#### 2.3.1.26. Biểu đồ trình tự Use case Cấu hình công thức và ngạch bậc lương (UC26)

Kịch bản tương tác Use Case UC26: Tác nhân Chuyên viên Tiền lương tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.29: Biểu đồ trình tự Use case Cấu hình công thức và ngạch bậc lương (UC26)](images/hinh_seq_uc26.png)

#### 2.3.1.27. Biểu đồ trình tự Use case Vận hành động cơ tính toán bảng lương tự động (UC27)

Kịch bản tương tác Use Case UC27: Tác nhân Chuyên viên Tiền lương tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.30: Biểu đồ trình tự Use case Vận hành động cơ tính toán bảng lương tự động (UC27)](images/hinh_seq_uc27.png)

#### 2.3.1.28. Biểu đồ trình tự Use case Phê duyệt & Khóa bất biến kỳ lương (LOCKED state) (UC28)

Kịch bản tương tác Use Case UC28: Tác nhân Chuyên viên Tiền lương, Giám đốc tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.31: Biểu đồ trình tự Use case Phê duyệt & Khóa bất biến kỳ lương (LOCKED state) (UC28)](images/hinh_seq_uc28.png)

#### 2.3.1.29. Biểu đồ trình tự Use case Quản lý tạm ứng & Khoản vay phúc lợi nhân viên (UC29)

Kịch bản tương tác Use Case UC29: Tác nhân Nhân viên, Chuyên viên Tiền lương, Giám đốc tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.32: Biểu đồ trình tự Use case Quản lý tạm ứng & Khoản vay phúc lợi nhân viên (UC29)](images/hinh_seq_uc29.png)

#### 2.3.1.30. Biểu đồ trình tự Use case Quản lý đề xuất công tác & Quyết toán chi phí (T&E) (UC30)

Kịch bản tương tác Use Case UC30: Tác nhân Nhân viên, Trưởng dự án, Kế toán tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.33: Biểu đồ trình tự Use case Quản lý đề xuất công tác & Quyết toán chi phí (T&E) (UC30)](images/hinh_seq_uc30.png)

#### 2.3.1.31. Biểu đồ trình tự Use case Quản lý cấp phát & Thu hồi tài sản làm việc (UC31)

Kịch bản tương tác Use Case UC31: Tác nhân Nhân viên Hành chính, Nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.34: Biểu đồ trình tự Use case Quản lý cấp phát & Thu hồi tài sản làm việc (UC31)](images/hinh_seq_uc31.png)

#### 2.3.1.32. Biểu đồ trình tự Use case Đề xuất & Phê duyệt điều chuyển công tác nội bộ (UC32)

Kịch bản tương tác Use Case UC32: Tác nhân Trưởng dự án, Giám đốc, Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.35: Biểu đồ trình tự Use case Đề xuất & Phê duyệt điều chuyển công tác nội bộ (UC32)](images/hinh_seq_uc32.png)

#### 2.3.1.33. Biểu đồ trình tự Use case Đề xuất & Phê duyệt điều chỉnh bậc lương (UC33)

Kịch bản tương tác Use Case UC33: Tác nhân Trưởng dự án, Giám đốc, Chuyên viên Tiền lương tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.36: Biểu đồ trình tự Use case Đề xuất & Phê duyệt điều chỉnh bậc lương (UC33)](images/hinh_seq_uc33.png)

#### 2.3.1.34. Biểu đồ trình tự Use case Đề xuất & Phê duyệt khen thưởng nhân sự (UC34)

Kịch bản tương tác Use Case UC34: Tác nhân Trưởng dự án, Giám đốc, Chuyên viên Tiền lương tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.37: Biểu đồ trình tự Use case Đề xuất & Phê duyệt khen thưởng nhân sự (UC34)](images/hinh_seq_uc34.png)

#### 2.3.1.35. Biểu đồ trình tự Use case Xử lý kỷ luật & Vi phạm nội quy lao động (UC35)

Kịch bản tương tác Use Case UC35: Tác nhân Trưởng dự án, Đại diện NLĐ, Giám đốc tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.38: Biểu đồ trình tự Use case Xử lý kỷ luật & Vi phạm nội quy lao động (UC35)](images/hinh_seq_uc35.png)

#### 2.3.1.36. Biểu đồ trình tự Use case Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận (UC36)

Kịch bản tương tác Use Case UC36: Tác nhân Nhân viên, Chuyên viên Hồ sơ, Các bộ phận tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.39: Biểu đồ trình tự Use case Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận (UC36)](images/hinh_seq_uc36.png)

#### 2.3.1.37. Biểu đồ trình tự Use case Đánh giá hiệu suất 360 độ & Mục tiêu OKR/KPI (UC37)

Kịch bản tương tác Use Case UC37: Tác nhân Chuyên viên nhân sự, Trưởng dự án, Nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.40: Biểu đồ trình tự Use case Đánh giá hiệu suất 360 độ & Mục tiêu OKR/KPI (UC37)](images/hinh_seq_uc37.png)

#### 2.3.1.38. Biểu đồ trình tự Use case Quản trị chương trình đào tạo nội bộ (UC38)

Kịch bản tương tác Use Case UC38: Tác nhân Chuyên viên nhân sự, Nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.41: Biểu đồ trình tự Use case Quản trị chương trình đào tạo nội bộ (UC38)](images/hinh_seq_uc38.png)

#### 2.3.1.39. Biểu đồ trình tự Use case Tiếp nhận & Giải quyết khiếu nại lao động bảo mật (UC39)

Kịch bản tương tác Use Case UC39: Tác nhân Chuyên viên nhân sự, Nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.42: Biểu đồ trình tự Use case Tiếp nhận & Giải quyết khiếu nại lao động bảo mật (UC39)](images/hinh_seq_uc39.png)

#### 2.3.1.40. Biểu đồ trình tự Use case Quản lý hồ sơ cán bộ toàn diện theo Mẫu 2C-BNV (UC40)

Kịch bản tương tác Use Case UC40: Tác nhân Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.43: Biểu đồ trình tự Use case Quản lý hồ sơ cán bộ toàn diện theo Mẫu 2C-BNV (UC40)](images/hinh_seq_uc40.png)

#### 2.3.1.41. Biểu đồ trình tự Use case Quản trị danh mục ngạch bậc lương chuẩn NĐ 204 (UC41)

Kịch bản tương tác Use Case UC41: Tác nhân Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.44: Biểu đồ trình tự Use case Quản trị danh mục ngạch bậc lương chuẩn NĐ 204 (UC41)](images/hinh_seq_uc41.png)

#### 2.3.1.42. Biểu đồ trình tự Use case Tự động rà soát & Phê duyệt nâng bậc lương định kỳ (UC42)

Kịch bản tương tác Use Case UC42: Tác nhân Chuyên viên Hồ sơ, Giám đốc tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.45: Biểu đồ trình tự Use case Tự động rà soát & Phê duyệt nâng bậc lương định kỳ (UC42)](images/hinh_seq_uc42.png)

#### 2.3.1.43. Biểu đồ trình tự Use case Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Biểu 01-03) (UC43)

Kịch bản tương tác Use Case UC43: Tác nhân Chuyên viên Hồ sơ tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.46: Biểu đồ trình tự Use case Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Biểu 01-03) (UC43)](images/hinh_seq_uc43.png)

#### 2.3.1.44. Biểu đồ trình tự Use case Quản lý không gian tri thức số & Tài liệu quy trình SOP (UC44)

Kịch bản tương tác Use Case UC44: Tác nhân Toàn thể nhân viên (theo quyền không gian) tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.47: Biểu đồ trình tự Use case Quản lý không gian tri thức số & Tài liệu quy trình SOP (UC44)](images/hinh_seq_uc44.png)

#### 2.3.1.45. Biểu đồ trình tự Use case Tìm kiếm tri thức toàn văn & Danh bạ chuyên gia (UC45)

Kịch bản tương tác Use Case UC45: Tác nhân Toàn thể nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.48: Biểu đồ trình tự Use case Tìm kiếm tri thức toàn văn & Danh bạ chuyên gia (UC45)](images/hinh_seq_uc45.png)

#### 2.3.1.46. Biểu đồ trình tự Use case Bảng điều khiển phân tích & Thống kê nhân sự (Dashboard) (UC46)

Kịch bản tương tác Use Case UC46: Tác nhân Ban Giám đốc, Quản lý, Nhân viên tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.49: Biểu đồ trình tự Use case Bảng điều khiển phân tích & Thống kê nhân sự (Dashboard) (UC46)](images/hinh_seq_uc46.png)

#### 2.3.1.47. Biểu đồ trình tự Use case Nhật ký kiểm toán hệ thống & Cấu hình tham số (UC47)

Kịch bản tương tác Use Case UC47: Tác nhân Nhân viên Quản trị IT tương tác với giao diện hệ thống; tầng điều khiển tiếp nhận và xác thực nghiệp vụ, thực hiện truy vấn và cập nhật trạng thái dữ liệu trên cơ sở dữ liệu, đồng thời tự động ghi nhận nhật ký kiểm toán hệ thống.

![Hình 2.50: Biểu đồ trình tự Use case Nhật ký kiểm toán hệ thống & Cấu hình tham số (UC47)](images/hinh_seq_uc47.png)

### 2.3.2. Xây dựng biểu đồ hoạt động (Activity Diagram)

Biểu đồ hoạt động (Activity Diagram) thể hiện luồng điều khiển xử lý nghiệp vụ, các bước tuần tự, các nhánh điều kiện rẽ nhánh và điểm kết thúc của từng tiến trình chức năng trong hệ thống. Dưới đây là đầy đủ 47 biểu đồ hoạt động tương ứng với 47 Use Case nghiệp vụ:

#### 2.3.2.1. Biểu đồ hoạt động Use case Đăng nhập & Xác thực hệ thống (UC01)

Tiến trình hoạt động Use Case UC01: Tác nhân Toàn thể nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.51: Biểu đồ hoạt động Use case Đăng nhập & Xác thực hệ thống (UC01)](images/hinh_act_uc01.png)

#### 2.3.2.2. Biểu đồ hoạt động Use case Quản trị người dùng & Phân quyền RBAC (UC02)

Tiến trình hoạt động Use Case UC02: Tác nhân Nhân viên Quản trị IT kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.52: Biểu đồ hoạt động Use case Quản trị người dùng & Phân quyền RBAC (UC02)](images/hinh_act_uc02.png)

#### 2.3.2.3. Biểu đồ hoạt động Use case Quản trị cơ cấu tổ chức & Cây phòng ban (UC03)

Tiến trình hoạt động Use Case UC03: Tác nhân Nhân viên Quản trị IT kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.53: Biểu đồ hoạt động Use case Quản trị cơ cấu tổ chức & Cây phòng ban (UC03)](images/hinh_act_uc03.png)

#### 2.3.2.4. Biểu đồ hoạt động Use case Lập phiếu đề xuất tuyển dụng nhân sự (UC04)

Tiến trình hoạt động Use Case UC04: Tác nhân Trưởng dự án kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.54: Biểu đồ hoạt động Use case Lập phiếu đề xuất tuyển dụng nhân sự (UC04)](images/hinh_act_uc04.png)

#### 2.3.2.5. Biểu đồ hoạt động Use case Thẩm định chỉ tiêu & Kiểm soát định biên tuyển dụng (UC05)

Tiến trình hoạt động Use Case UC05: Tác nhân Chuyên viên Tuyển dụng, Kế toán kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.55: Biểu đồ hoạt động Use case Thẩm định chỉ tiêu & Kiểm soát định biên tuyển dụng (UC05)](images/hinh_act_uc05.png)

#### 2.3.2.6. Biểu đồ hoạt động Use case Phê duyệt chỉ tiêu tuyển dụng (UC06)

Tiến trình hoạt động Use Case UC06: Tác nhân Giám đốc kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.56: Biểu đồ hoạt động Use case Phê duyệt chỉ tiêu tuyển dụng (UC06)](images/hinh_act_uc06.png)

#### 2.3.2.7. Biểu đồ hoạt động Use case Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban (UC07)

Tiến trình hoạt động Use Case UC07: Tác nhân Chuyên viên Tuyển dụng kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.57: Biểu đồ hoạt động Use case Quản lý hồ sơ ứng viên & Tuyển dụng ATS Kanban (UC07)](images/hinh_act_uc07.png)

#### 2.3.2.8. Biểu đồ hoạt động Use case Gửi thư mời nhận việc & Thỏa thuận mức lương (UC08)

Tiến trình hoạt động Use Case UC08: Tác nhân Chuyên viên Tuyển dụng, Ứng viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.58: Biểu đồ hoạt động Use case Gửi thư mời nhận việc & Thỏa thuận mức lương (UC08)](images/hinh_act_uc08.png)

#### 2.3.2.9. Biểu đồ hoạt động Use case Quản lý hồ sơ nhân viên toàn diện (UC09)

Tiến trình hoạt động Use Case UC09: Tác nhân Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.59: Biểu đồ hoạt động Use case Quản lý hồ sơ nhân viên toàn diện (UC09)](images/hinh_act_uc09.png)

#### 2.3.2.10. Biểu đồ hoạt động Use case Quản lý hợp đồng lao động & Phụ lục hợp đồng (UC10)

Tiến trình hoạt động Use Case UC10: Tác nhân Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.60: Biểu đồ hoạt động Use case Quản lý hợp đồng lao động & Phụ lục hợp đồng (UC10)](images/hinh_act_uc10.png)

#### 2.3.2.11. Biểu đồ hoạt động Use case Quản lý văn bằng, chứng chỉ chuyên môn (UC11)

Tiến trình hoạt động Use Case UC11: Tác nhân Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.61: Biểu đồ hoạt động Use case Quản lý văn bằng, chứng chỉ chuyên môn (UC11)](images/hinh_act_uc11.png)

#### 2.3.2.12. Biểu đồ hoạt động Use case Mượn - trả hồ sơ, chứng chỉ bản gốc (UC12)

Tiến trình hoạt động Use Case UC12: Tác nhân Nhân viên, Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.62: Biểu đồ hoạt động Use case Mượn - trả hồ sơ, chứng chỉ bản gốc (UC12)](images/hinh_act_uc12.png)

#### 2.3.2.13. Biểu đồ hoạt động Use case Đánh giá kết quả thử việc & Ký HĐLĐ chính thức (UC13)

Tiến trình hoạt động Use Case UC13: Tác nhân Trưởng dự án, Chuyên viên Hồ sơ, Giám đốc kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.63: Biểu đồ hoạt động Use case Đánh giá kết quả thử việc & Ký HĐLĐ chính thức (UC13)](images/hinh_act_uc13.png)

#### 2.3.2.14. Biểu đồ hoạt động Use case Lộ trình hội nhập nhân viên mới (Onboarding Checklist) (UC14)

Tiến trình hoạt động Use Case UC14: Tác nhân Nhân viên mới, Chuyên viên Hồ sơ, Mentor kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.64: Biểu đồ hoạt động Use case Lộ trình hội nhập nhân viên mới (Onboarding Checklist) (UC14)](images/hinh_act_uc14.png)

#### 2.3.2.15. Biểu đồ hoạt động Use case Cổng tự phục vụ nhân viên tập trung (ESS Portal) (UC15)

Tiến trình hoạt động Use Case UC15: Tác nhân Toàn thể nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.65: Biểu đồ hoạt động Use case Cổng tự phục vụ nhân viên tập trung (ESS Portal) (UC15)](images/hinh_act_uc15.png)

#### 2.3.2.16. Biểu đồ hoạt động Use case Quản lý thông tin cá nhân phân cấp 3 mức độ (UC16)

Tiến trình hoạt động Use Case UC16: Tác nhân Toàn thể nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.66: Biểu đồ hoạt động Use case Quản lý thông tin cá nhân phân cấp 3 mức độ (UC16)](images/hinh_act_uc16.png)

#### 2.3.2.17. Biểu đồ hoạt động Use case Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2 (UC17)

Tiến trình hoạt động Use Case UC17: Tác nhân Chuyên viên Hồ sơ, Quản trị viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.67: Biểu đồ hoạt động Use case Thẩm định & Phê duyệt đề xuất điều chỉnh hồ sơ Mức 2 (UC17)](images/hinh_act_uc17.png)

#### 2.3.2.18. Biểu đồ hoạt động Use case Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca (UC18)

Tiến trình hoạt động Use Case UC18: Tác nhân Toàn thể nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.68: Biểu đồ hoạt động Use case Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca (UC18)](images/hinh_act_uc18.png)

#### 2.3.2.19. Biểu đồ hoạt động Use case Điểm danh sinh trắc học khuôn mặt & Cảm biến IR (UC19)

Tiến trình hoạt động Use Case UC19: Tác nhân Nhân viên, Kiosk điểm danh kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.69: Biểu đồ hoạt động Use case Điểm danh sinh trắc học khuôn mặt & Cảm biến IR (UC19)](images/hinh_act_uc19.png)

#### 2.3.2.20. Biểu đồ hoạt động Use case Quản trị kết nối thiết bị máy chấm công (UC20)

Tiến trình hoạt động Use Case UC20: Tác nhân Chuyên viên Hồ sơ, Quản trị IT kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.70: Biểu đồ hoạt động Use case Quản trị kết nối thiết bị máy chấm công (UC20)](images/hinh_act_uc20.png)

#### 2.3.2.21. Biểu đồ hoạt động Use case Đăng ký & Xét duyệt nghỉ phép trực tuyến (UC21)

Tiến trình hoạt động Use Case UC21: Tác nhân Nhân viên, Trưởng dự án, Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.71: Biểu đồ hoạt động Use case Đăng ký & Xét duyệt nghỉ phép trực tuyến (UC21)](images/hinh_act_uc21.png)

#### 2.3.2.22. Biểu đồ hoạt động Use case Đăng ký & Phê duyệt làm thêm giờ (OT) (UC22)

Tiến trình hoạt động Use Case UC22: Tác nhân Nhân viên, Trưởng dự án, Chuyên viên Tiền lương kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.72: Biểu đồ hoạt động Use case Đăng ký & Phê duyệt làm thêm giờ (OT) (UC22)](images/hinh_act_uc22.png)

#### 2.3.2.23. Biểu đồ hoạt động Use case Lập lịch và phân ca làm việc (Shift Scheduling) (UC23)

Tiến trình hoạt động Use Case UC23: Tác nhân Trưởng dự án, Chuyên viên Tiền lương kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.73: Biểu đồ hoạt động Use case Lập lịch và phân ca làm việc (Shift Scheduling) (UC23)](images/hinh_act_uc23.png)

#### 2.3.2.24. Biểu đồ hoạt động Use case Giải trình bổ sung giờ công & Xử lý lệch công (UC24)

Tiến trình hoạt động Use Case UC24: Tác nhân Nhân viên, Trưởng dự án, Chuyên viên Tiền lương kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.74: Biểu đồ hoạt động Use case Giải trình bổ sung giờ công & Xử lý lệch công (UC24)](images/hinh_act_uc24.png)

#### 2.3.2.25. Biểu đồ hoạt động Use case Tổng hợp & Chốt bảng chấm công tháng (UC25)

Tiến trình hoạt động Use Case UC25: Tác nhân Chuyên viên Tiền lương, Trưởng dự án kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.75: Biểu đồ hoạt động Use case Tổng hợp & Chốt bảng chấm công tháng (UC25)](images/hinh_act_uc25.png)

#### 2.3.2.26. Biểu đồ hoạt động Use case Cấu hình công thức và ngạch bậc lương (UC26)

Tiến trình hoạt động Use Case UC26: Tác nhân Chuyên viên Tiền lương kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.76: Biểu đồ hoạt động Use case Cấu hình công thức và ngạch bậc lương (UC26)](images/hinh_act_uc26.png)

#### 2.3.2.27. Biểu đồ hoạt động Use case Vận hành động cơ tính toán bảng lương tự động (UC27)

Tiến trình hoạt động Use Case UC27: Tác nhân Chuyên viên Tiền lương kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.77: Biểu đồ hoạt động Use case Vận hành động cơ tính toán bảng lương tự động (UC27)](images/hinh_act_uc27.png)

#### 2.3.2.28. Biểu đồ hoạt động Use case Phê duyệt & Khóa bất biến kỳ lương (LOCKED state) (UC28)

Tiến trình hoạt động Use Case UC28: Tác nhân Chuyên viên Tiền lương, Giám đốc kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.78: Biểu đồ hoạt động Use case Phê duyệt & Khóa bất biến kỳ lương (LOCKED state) (UC28)](images/hinh_act_uc28.png)

#### 2.3.2.29. Biểu đồ hoạt động Use case Quản lý tạm ứng & Khoản vay phúc lợi nhân viên (UC29)

Tiến trình hoạt động Use Case UC29: Tác nhân Nhân viên, Chuyên viên Tiền lương, Giám đốc kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.79: Biểu đồ hoạt động Use case Quản lý tạm ứng & Khoản vay phúc lợi nhân viên (UC29)](images/hinh_act_uc29.png)

#### 2.3.2.30. Biểu đồ hoạt động Use case Quản lý đề xuất công tác & Quyết toán chi phí (T&E) (UC30)

Tiến trình hoạt động Use Case UC30: Tác nhân Nhân viên, Trưởng dự án, Kế toán kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.80: Biểu đồ hoạt động Use case Quản lý đề xuất công tác & Quyết toán chi phí (T&E) (UC30)](images/hinh_act_uc30.png)

#### 2.3.2.31. Biểu đồ hoạt động Use case Quản lý cấp phát & Thu hồi tài sản làm việc (UC31)

Tiến trình hoạt động Use Case UC31: Tác nhân Nhân viên Hành chính, Nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.81: Biểu đồ hoạt động Use case Quản lý cấp phát & Thu hồi tài sản làm việc (UC31)](images/hinh_act_uc31.png)

#### 2.3.2.32. Biểu đồ hoạt động Use case Đề xuất & Phê duyệt điều chuyển công tác nội bộ (UC32)

Tiến trình hoạt động Use Case UC32: Tác nhân Trưởng dự án, Giám đốc, Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.82: Biểu đồ hoạt động Use case Đề xuất & Phê duyệt điều chuyển công tác nội bộ (UC32)](images/hinh_act_uc32.png)

#### 2.3.2.33. Biểu đồ hoạt động Use case Đề xuất & Phê duyệt điều chỉnh bậc lương (UC33)

Tiến trình hoạt động Use Case UC33: Tác nhân Trưởng dự án, Giám đốc, Chuyên viên Tiền lương kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.83: Biểu đồ hoạt động Use case Đề xuất & Phê duyệt điều chỉnh bậc lương (UC33)](images/hinh_act_uc33.png)

#### 2.3.2.34. Biểu đồ hoạt động Use case Đề xuất & Phê duyệt khen thưởng nhân sự (UC34)

Tiến trình hoạt động Use Case UC34: Tác nhân Trưởng dự án, Giám đốc, Chuyên viên Tiền lương kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.84: Biểu đồ hoạt động Use case Đề xuất & Phê duyệt khen thưởng nhân sự (UC34)](images/hinh_act_uc34.png)

#### 2.3.2.35. Biểu đồ hoạt động Use case Xử lý kỷ luật & Vi phạm nội quy lao động (UC35)

Tiến trình hoạt động Use Case UC35: Tác nhân Trưởng dự án, Đại diện NLĐ, Giám đốc kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.85: Biểu đồ hoạt động Use case Xử lý kỷ luật & Vi phạm nội quy lao động (UC35)](images/hinh_act_uc35.png)

#### 2.3.2.36. Biểu đồ hoạt động Use case Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận (UC36)

Tiến trình hoạt động Use Case UC36: Tác nhân Nhân viên, Chuyên viên Hồ sơ, Các bộ phận kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.86: Biểu đồ hoạt động Use case Tiếp nhận, Xử lý thôi việc & Bàn giao đa bộ phận (UC36)](images/hinh_act_uc36.png)

#### 2.3.2.37. Biểu đồ hoạt động Use case Đánh giá hiệu suất 360 độ & Mục tiêu OKR/KPI (UC37)

Tiến trình hoạt động Use Case UC37: Tác nhân Chuyên viên nhân sự, Trưởng dự án, Nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.87: Biểu đồ hoạt động Use case Đánh giá hiệu suất 360 độ & Mục tiêu OKR/KPI (UC37)](images/hinh_act_uc37.png)

#### 2.3.2.38. Biểu đồ hoạt động Use case Quản trị chương trình đào tạo nội bộ (UC38)

Tiến trình hoạt động Use Case UC38: Tác nhân Chuyên viên nhân sự, Nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.88: Biểu đồ hoạt động Use case Quản trị chương trình đào tạo nội bộ (UC38)](images/hinh_act_uc38.png)

#### 2.3.2.39. Biểu đồ hoạt động Use case Tiếp nhận & Giải quyết khiếu nại lao động bảo mật (UC39)

Tiến trình hoạt động Use Case UC39: Tác nhân Chuyên viên nhân sự, Nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.89: Biểu đồ hoạt động Use case Tiếp nhận & Giải quyết khiếu nại lao động bảo mật (UC39)](images/hinh_act_uc39.png)

#### 2.3.2.40. Biểu đồ hoạt động Use case Quản lý hồ sơ cán bộ toàn diện theo Mẫu 2C-BNV (UC40)

Tiến trình hoạt động Use Case UC40: Tác nhân Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.90: Biểu đồ hoạt động Use case Quản lý hồ sơ cán bộ toàn diện theo Mẫu 2C-BNV (UC40)](images/hinh_act_uc40.png)

#### 2.3.2.41. Biểu đồ hoạt động Use case Quản trị danh mục ngạch bậc lương chuẩn NĐ 204 (UC41)

Tiến trình hoạt động Use Case UC41: Tác nhân Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.91: Biểu đồ hoạt động Use case Quản trị danh mục ngạch bậc lương chuẩn NĐ 204 (UC41)](images/hinh_act_uc41.png)

#### 2.3.2.42. Biểu đồ hoạt động Use case Tự động rà soát & Phê duyệt nâng bậc lương định kỳ (UC42)

Tiến trình hoạt động Use Case UC42: Tác nhân Chuyên viên Hồ sơ, Giám đốc kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.92: Biểu đồ hoạt động Use case Tự động rà soát & Phê duyệt nâng bậc lương định kỳ (UC42)](images/hinh_act_uc42.png)

#### 2.3.2.43. Biểu đồ hoạt động Use case Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Biểu 01-03) (UC43)

Tiến trình hoạt động Use Case UC43: Tác nhân Chuyên viên Hồ sơ kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.93: Biểu đồ hoạt động Use case Kết xuất biểu mẫu báo cáo nhà nước (SYLL 2C, Biểu 01-03) (UC43)](images/hinh_act_uc43.png)

#### 2.3.2.44. Biểu đồ hoạt động Use case Quản lý không gian tri thức số & Tài liệu quy trình SOP (UC44)

Tiến trình hoạt động Use Case UC44: Tác nhân Toàn thể nhân viên (theo quyền không gian) kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.94: Biểu đồ hoạt động Use case Quản lý không gian tri thức số & Tài liệu quy trình SOP (UC44)](images/hinh_act_uc44.png)

#### 2.3.2.45. Biểu đồ hoạt động Use case Tìm kiếm tri thức toàn văn & Danh bạ chuyên gia (UC45)

Tiến trình hoạt động Use Case UC45: Tác nhân Toàn thể nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.95: Biểu đồ hoạt động Use case Tìm kiếm tri thức toàn văn & Danh bạ chuyên gia (UC45)](images/hinh_act_uc45.png)

#### 2.3.2.46. Biểu đồ hoạt động Use case Bảng điều khiển phân tích & Thống kê nhân sự (Dashboard) (UC46)

Tiến trình hoạt động Use Case UC46: Tác nhân Ban Giám đốc, Quản lý, Nhân viên kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.96: Biểu đồ hoạt động Use case Bảng điều khiển phân tích & Thống kê nhân sự (Dashboard) (UC46)](images/hinh_act_uc46.png)

#### 2.3.2.47. Biểu đồ hoạt động Use case Nhật ký kiểm toán hệ thống & Cấu hình tham số (UC47)

Tiến trình hoạt động Use Case UC47: Tác nhân Nhân viên Quản trị IT kích hoạt thao tác chức năng; hệ thống tiến hành kiểm tra điều kiện hợp lệ đầu vào, rẽ nhánh xử lý nghiệp vụ tương ứng và cập nhật trạng thái bản ghi trên cơ sở dữ liệu.

![Hình 2.97: Biểu đồ hoạt động Use case Nhật ký kiểm toán hệ thống & Cấu hình tham số (UC47)](images/hinh_act_uc47.png)

### 2.3.3. Xây dựng biểu đồ trạng thái (State Diagram)

Biểu đồ trạng thái (State Machine Diagram) mô hình hóa vòng đời và các bước chuyển đổi trạng thái của các thực thể nghiệp vụ cốt lõi dưới tác động của các sự kiện phát sinh:

#### 1. Biểu đồ trạng thái vòng đời Nhân viên

Vòng đời đối tượng Nhân viên trải qua các trạng thái: Ứng viên đạt tuyển dụng (ONBOARDING) -> Thử việc (PROBATION) -> Ký hợp đồng chính thức (ACTIVE) -> Nghỉ thai sản/Tạm hoãn (SUSPENDED) -> Đã nghỉ việc (TERMINATED).

![Hình 2.98: Biểu đồ trạng thái vòng đời Nhân viên](images/hinh_2_12_state_employee.png)

#### 2. Biểu đồ trạng thái Phiếu tuyển dụng

Vòng đời phiếu tuyển dụng: Bản nháp (DRAFT) -> Chờ thẩm định định biên (PENDING_REVIEW) -> Chờ Giám đốc duyệt (PENDING_APPROVAL) -> Đã phê duyệt mở tuyển (APPROVED) hoặc Bị từ chối (REJECTED) -> Hoàn tất tuyển dụng (CLOSED).

![Hình 2.99: Biểu đồ trạng thái Phiếu tuyển dụng](images/hinh_2_13_state_requisition.png)

#### 3. Biểu đồ trạng thái Đơn nghỉ phép

Vòng đời đơn nghỉ phép: Khởi tạo (DRAFT) -> Chờ Trưởng dự án duyệt (SUBMITTED) -> Chờ HR xác nhận trừ phép (HR_CONFIRMED) -> Chấp thuận (APPROVED) hoặc Bị bác đơn (REJECTED) -> Đã hủy (CANCELLED).

![Hình 2.100: Biểu đồ trạng thái Đơn nghỉ phép](images/hinh_2_14_state_leave.png)

#### 4. Biểu đồ trạng thái Phiếu mượn - trả hồ sơ

Vòng đời phiếu mượn hồ sơ: Yêu cầu mượn (REQUESTED) -> HR xuất kho bàn giao (BORROWED) -> Nhân viên hoàn trả hồ sơ (RETURNED) -> HR kiểm tra niêm phong và đóng phiếu (CLOSED).

![Hình 2.101: Biểu đồ trạng thái Phiếu mượn - trả hồ sơ](images/hinh_2_15_state_doclending.png)

#### 5. Biểu đồ trạng thái Phiếu lương

Vòng đời phiếu lương: Tính dự thảo (DRAFT) -> Kế toán trưởng thẩm định (REVIEWED) -> Giám đốc ký duyệt khóa bất biến (LOCKED) -> Phát hành qua cổng ESS (PUBLISHED) -> Đã thanh toán chuyển khoản (PAID).

![Hình 2.102: Biểu đồ trạng thái Phiếu lương](images/hinh_2_16_state_payslip.png)

### 2.3.4. Xây dựng biểu đồ cộng tác (Collaboration Diagram)

Biểu đồ cộng tác (Communication Diagram) tập trung làm nổi bật mối quan hệ cấu trúc không gian và sự phân bổ trách nhiệm giữa các đối tượng trong việc thực thi các kịch bản tương tác liên phòng ban.

Trong phân hệ quản trị tiền lương, kịch bản tính lương định kỳ thể hiện sự cộng tác chặt chẽ giữa các đối tượng: Lớp giao diện `PayrollView` tiếp nhận yêu cầu từ chuyên viên; chuyển thông điệp tới bộ điều khiển `PayrollService`; `PayrollService` gửi thông điệp truy vấn tới `AttendanceDay` để lấy tổng số ngày công thực tế, gửi thông điệp tới `Contract` để lấy mức lương đóng bảo hiểm, và gửi thông điệp tới `EmployeeLoan` để tính toán số tiền trích nợ kỳ hiện tại; sau khi hoàn tất tính toán tổng hợp, `PayrollService` gửi thông điệp khởi tạo và lưu trữ hàng loạt các đối tượng `Payslip` vào cơ sở dữ liệu.

## 2.4. Thiết kế hệ thống

### 2.4.1. Xây dựng biểu đồ lớp (Class Diagram)

Biểu đồ gói tổng quan thể hiện cấu trúc phân rã các gói chức năng và mối quan hệ phụ thuộc kiến trúc trong toàn bộ hệ thống phần mềm.

![Hình 2.103: Biểu đồ gói tổng quan của hệ thống](images/hinh_2_17_package_diagram.png)

Biểu đồ lớp phân tích cho các Use Case đại diện thể hiện chi tiết cấu trúc thuộc tính, phương thức và sự liên kết giữa các lớp Boundary, Control và Entity:

**1. Biểu đồ lớp phân tích Use case Đăng nhập & Xác thực hệ thống (UC01):**

Bao gồm lớp giao diện `LoginForm`, lớp điều khiển `AuthService` và các lớp thực thể lưu trữ `User`, `Account`, `RefreshToken`.

![Hình 2.104: Biểu đồ lớp Use case Đăng nhập (UC01)](images/hinh_2_18_class_login.png)

**2. Biểu đồ lớp phân tích Use case Đăng ký nghỉ phép (UC21):**

Bao gồm lớp giao diện `LeaveRequestForm`, lớp điều khiển `LeaveService` cùng các lớp thực thể `LeaveRequest`, `LeaveBalance`, `Employee`.

![Hình 2.105: Biểu đồ lớp Use case Đăng ký nghỉ phép (UC21)](images/hinh_2_19_class_leave.png)

**3. Biểu đồ lớp miền cốt lõi của hệ thống (Domain Model):**

Thể hiện toàn cảnh mối quan hệ liên kết (Association), hợp thành (Composition) và kế thừa (Inheritance) giữa các thực thể cốt lõi nhất cấu thành nên hệ sinh thái quản trị nhân lực của doanh nghiệp.

![Hình 2.106: Biểu đồ lớp miền cốt lõi của hệ thống](images/hinh_2_20_class_domain.png)

**Bảng 2.6. Ma trận phân quyền truy cập chức năng (CRUD Permission Matrix)**

| Phân hệ chức năng | Bảng dữ liệu chính | Quyền hạn vai USER | Quyền hạn vai KM_MANAGER | Quyền hạn vai ADMIN |
| :--- | :--- | :---: | :---: | :---: |
| Tài khoản & Tổ chức | User, Account, OrgUnit | R (chỉ xem bản thân) | R (xem đơn vị) | C, R, U, D |
| Tuyển dụng & ATS | JobRequisition, Candidate | C, R (trong dự án) | C, R, U, D | C, R, U, D |
| Hồ sơ & Hợp đồng | Employee, Contract, Certificate | R (xem cá nhân) | C, R, U | C, R, U, D |
| Thẩm định hồ sơ Mức 2 | ProfileChangeRequest | C, R (tạo đề xuất cá nhân) | R, U (thẩm định duyệt) | C, R, U, D |
| Chấm công & Phân ca | AttendanceEvent, WorkShift | C, R (điểm danh, xem ca) | C, R, U (hiệu chỉnh công) | C, R, U, D |
| Nghỉ phép & Làm thêm | LeaveRequest, OvertimeRequest | C, R (nộp đơn cá nhân) | C, R, U (duyệt đơn) | C, R, U, D |
| Tiền lương & Kỳ lương | PayrollPeriod, Payslip | R (chỉ xem phiếu lương cá nhân) | C, R, U (tính toán, đối chiếu) | C, R, U (phê duyệt, khóa lương) |
| Phúc lợi & Khoản vay | EmployeeLoan, ExpenseClaim | C, R (đăng ký vay, xem nợ) | C, R, U (thẩm định duyệt) | C, R, U, D |
| Biến động & Thôi việc | PersonnelAction, HandoverChecklist | C, R (nộp đơn thôi việc) | C, R, U (xác nhận bàn giao) | C, R, U, D (ký quyết định) |
| Hồ sơ cán bộ & Báo cáo | CadreProfile, SalaryGrade | - | C, R, U (quản lý, xuất biểu) | C, R, U, D |
| Tri thức số & SOP | Article, ArticleVersion | C, R (soạn thảo, tra cứu) | C, R, U, D (duyệt xuất bản) | C, R, U, D |
| Nhật ký kiểm toán | AuditLog | - | - | R (chỉ đọc) |

*(Ghi chú: C: Create - Tạo mới, R: Read - Xem/Đọc, U: Update - Chỉnh sửa, D: Delete - Xóa dữ liệu).*

### 2.4.2. Thiết kế lưu trữ dữ liệu

Cơ sở dữ liệu của hệ thống được thiết kế và cài đặt trên hệ quản trị PostgreSQL 16 thông qua công cụ Prisma ORM, bao gồm 87 model quan hệ phân bổ thành 10 miền dữ liệu nghiệp vụ:

**Bảng 2.7. Đặc tả cấu trúc lược đồ Cơ sở dữ liệu quan hệ**

| Miền dữ liệu | Bảng CSDL chính | Số trường | Mục đích lưu trữ và quy tắc toàn vẹn nghiệp vụ |
| :--- | :--- | :---: | :--- |
| 1. Định danh & Hệ thống | `User`, `Account`, `OrgUnit`, `Role` | 34 | Quản lý tài khoản, mật khẩu băm bcrypt, cây tổ chức tự tham chiếu cha - con (`parentId`), định biên nhân sự. |
| 2. Tuyển dụng & ATS | `JobRequisition`, `Candidate`, `Interview` | 28 | Lưu trữ phiếu đề xuất tuyển dụng, hồ sơ ứng viên, các vòng phỏng vấn, điểm Scorecard và liên kết chuyển đổi ứng viên. |
| 3. Hồ sơ & Hợp đồng | `Employee`, `Contract`, `Certificate`, `DocLending` | 42 | Hồ sơ nhân viên, hợp đồng thử việc/chính thức, vị trí tủ lưu trữ văn bằng gốc và lịch sử mượn trả. |
| 4. Phân cấp dữ liệu | `ProfileChangeRequest` | 12 | Hàng đợi thẩm định thông tin Mức 2: lưu giá trị cũ, giá trị mới đề xuất, tệp minh chứng ảnh CCCD và vết phê duyệt nguyên tử. |
| 5. Chấm công & Ca kíp | `AttendanceEvent`, `AttendanceDay`, `WorkShift` | 36 | Lưu trữ sự kiện điểm danh bất biến (Append-Only), ca làm việc, tổng hợp ngày công và nhật ký hiệu chỉnh công bắt buộc lý do. |
| 6. Điểm danh đa nguồn | `AttendanceDevice`, `FaceEmbedding` | 18 | Cấu hình máy chấm công webhook HMAC, vector mẫu khuôn mặt 128 chiều mã hóa AES-256-GCM (tuân thủ Nghị định 13). |
| 7. Nghỉ phép & Làm thêm | `LeaveRequest`, `LeaveBalance`, `OvertimeRequest` | 24 | Quỹ phép năm, lịch sử nghỉ phép tự động trừ số dư khi duyệt, đăng ký và kiểm soát trần thời gian làm thêm giờ. |
| 8. Tiền lương & Phúc lợi | `PayrollPeriod`, `Payslip`, `SalaryComponent` | 46 | Chu kỳ tính lương có trạng thái khóa bất biến LOCKED (chặn tính lại với HTTP 409), phiếu lương chi tiết từng thành phần thu nhập. |
| 9. Tài chính nhân sự | `HrmsEmployeeLoan`, `ExpenseClaim`, `Asset` | 38 | Khoản vay phúc lợi (kiểm soát trích nợ <= 30% lương Net), lịch trình hoàn nợ tự động nạp kỳ lương, công tác phí, tài sản. |
| 10. Cán bộ & Tri thức | `CadreProfile`, `Article`, `AuditLog` | 52 | 111 thuộc tính cán bộ chuẩn Mẫu 2C-BNV, không gian tri thức phân quyền, nhật ký kiểm toán hệ thống bất biến Append-Only. |

Mô hình dữ liệu vật lý thể hiện các mối quan hệ khóa ngoại (Foreign Key) và các chỉ mục toàn vẹn (Unique Constraint) giữa các bảng cốt lõi:

![Hình 2.107: Mô hình cơ sở dữ liệu vật lý của hệ thống](images/hinh_2_21_erd_database.png)

Để mở rộng hỗ trợ thu nhận dữ liệu chấm công từ các nguồn công nghệ đa dạng, cơ sở dữ liệu tích hợp thêm các bảng chuyên biệt cho phép kết nối máy chấm công phần cứng, lưu trữ vector khuôn mặt và thu nhận bản ghi từ cổng Web:

![Hình 2.108: Mô hình dữ liệu mở rộng cho chấm công đa nguồn](images/hinh_2_24_erd_multisource.png)

Sơ đồ thể hiện bảng sự kiện chấm công bất biến AttendanceEvent với trường nguồn (MACHINE, WEB, FACE, SIMULATOR) cùng các bảng hỗ trợ FaceEmbedding và AttendanceDevice.

**Bảng 2.8. So sánh các phương thức điểm danh trong hệ thống**

| Tiêu chí so sánh | Kiosk Khuôn mặt sinh trắc học & IR | Máy chấm công phần cứng (Vân tay/Thẻ) | Web Check-in cổng ESS |
| :--- | :--- | :--- | :--- |
| Phương thức xác thực | Nhận diện khuôn mặt 2D + cảm biến hồng ngoại | Quẹt vân tay quang học / Thẻ từ RFID | Đăng nhập tài khoản định danh cá nhân |
| Cơ chế bảo mật & Chống giả mạo | Quét phổ nhiệt IR và chuyển động (Anti-Spoofing), không lưu ảnh gốc | Xác thực phần cứng tại chỗ qua cảm biến vân tay | Xác thực phiên làm việc JWT và lưu vết địa chỉ IP |
| Giao thức kết nối dữ liệu | Xử lý vector tại trình duyệt, gửi API thời gian thực | Đẩy bản tin HTTP POST có chữ ký HMAC-SHA256 | Gọi trực tiếp RESTful API nội bộ |
| Đối tượng áp dụng phù hợp | Toàn bộ nhân viên ra/vào sảnh văn phòng | Nhân viên làm việc cố định tại tòa nhà văn phòng | Nhân viên làm việc linh hoạt từ xa (WFH / Onsite) |
| Tuân thủ Nghị định 13/2023/NĐ-CP | Tuyệt đối tuân thủ (chỉ lưu vector mã hóa AES-256) | Dữ liệu mẫu lưu trên chip nhớ nội bộ của máy | Không thu thập dữ liệu sinh trắc học |

### 2.4.3. Thiết kế giao diện người dùng

Giao diện người dùng được thiết kế hiện đại trên nền tảng Design System trung tính của Shadcn UI và Tailwind CSS, tối ưu hóa trải nghiệm thao tác trên cả máy tính để bàn lẫn thiết bị di động. Cấu trúc điều hướng được tổ chức thành 7 phân hệ nghiệp vụ chuẩn hóa bao gồm 28 màn hình tác nghiệp trực tiếp, kết hợp cùng giao diện Kiosk điểm danh và trang đăng nhập xác thực tập trung:

1. Phân hệ Không gian làm việc (Workspace):
- `/dashboard`: Bảng điều khiển phân tích tổng quan các chỉ số nhân sự cốt lõi, tỷ lệ hiện diện hôm nay và lối tắt tác vụ nhanh;
- `/ess`: Cổng tự phục vụ nhân viên tập trung tích hợp điểm danh trực tuyến, nộp đơn nghỉ phép, đăng ký làm thêm giờ, tra cứu phiếu lương cá nhân và theo dõi khoản vay phúc lợi;
- `/profile`: Quản trị hồ sơ cá nhân theo mô hình phân cấp 3 mức độ, tích hợp hàng đợi thẩm định đề xuất thay đổi thông tin định danh pháp lý có ảnh minh chứng.

2. Phân hệ Nhân sự & Tổ chức (Personnel & Organization):
- `/org-chart`: Sơ đồ cây cơ cấu tổ chức tương tác đa cấp, trực quan hóa quan hệ báo cáo cấp bậc và quản lý định biên phòng ban;
- `/employees`: Danh bạ nhân sự toàn công ty hỗ trợ tìm kiếm toàn văn, lọc đa tiêu chí và kết xuất dữ liệu;
- `/employees/[id]`: Hồ sơ nhân sự chi tiết thiết kế dạng thẻ chuyển tab (Thông tin cá nhân, Hợp đồng, Bằng cấp, Tài sản, Quá trình công tác);
- `/personnel`: Quản lý các quyết định biến động nhân sự (điều chuyển, nâng lương, khen thưởng, kỷ luật, thôi việc);
- `/salary-ranks`: Cấu hình khung ngạch bậc lương theo tiêu chuẩn Nghị định 204/2004/NĐ-CP;
- `/assets`: Quản lý vòng đời cấp phát và thu hồi tài sản làm việc (laptop, màn hình).

3. Phân hệ Chấm công & Ca làm việc (Time & Attendance):
- `/shifts`: Lập lịch phân ca làm việc, cấu hình khung giờ chuẩn và dung sai ân hạn đi muộn;
- `/attendance`: Bảng chấm công tổng hợp theo tháng, hiển thị trực quan trạng thái ngày công, nghỉ phép và làm thêm giờ;
- `/leave`: Quản lý đơn nghỉ phép với cơ chế tự động kiểm tra số dư và trừ quỹ phép ngay khi duyệt;
- `/overtime`: Đăng ký và phê duyệt làm thêm giờ, kiểm soát trần thời gian tối đa theo luật lao động.

4. Phân hệ Đãi ngộ & Tài chính (Compensation & Benefits):
- `/payroll-engine`: Động cơ tính toán tiền lương tự động, cấu hình thành phần thu nhập, trích nộp BHXH, thuế TNCN và thực thi khóa bất biến kỳ lương (LOCKED);
- `/loans`: Trung tâm quản trị phúc lợi và khoản vay nhân viên, tích hợp công cụ mô phỏng tài chính, kiểm soát trích nợ không quá 30% lương Net và hỗ trợ tất toán sớm;
- `/expense-claims`: Quản lý đề xuất công tác và thanh quyết toán chi phí công tác phí kèm hóa đơn điện tử.

5. Phân hệ Phát triển & Tuyển dụng (Development & Recruitment):
- `/recruitment-ats`: Hệ thống tuyển dụng ứng viên với bảng điều khiển Kanban 6 giai đoạn, hỗ trợ nút "1-Click Nhận việc" để tự động chuyển ứng viên thành nhân viên chính thức;
- `/performance-360`: Đánh giá hiệu suất đa chiều kết hợp tự đánh giá, đánh giá chéo đồng nghiệp và quản lý mục tiêu OKR/KPI;
- `/training-grievance`: Quản lý các khóa đào tạo nội bộ và kênh tiếp nhận giải quyết khiếu nại lao động bảo mật.

6. Phân hệ Báo cáo & Tài liệu số (Reports & Documents):
- `/personnel-reports`: Báo cáo nhân sự và hồ sơ cán bộ quản lý 111 trường thông tin theo chuẩn Mẫu 2C-BNV/2008, hỗ trợ kết xuất biểu mẫu in ấn A4;
- `/documents`: Kho tri thức số nội bộ lưu trữ các quy trình vận hành chuẩn (SOP) với cơ chế quản lý phiên bản bất biến.

7. Phân hệ Quản trị hệ thống (System Administration):
- Gồm 6 màn hình quản trị chuyên sâu dành cho vai trò ADMIN: quản trị tài khoản người dùng (`/admin/users`), quản trị cây đơn vị (`/admin/org-units`), quản trị danh mục dùng chung (`/admin/catalogs`), quản trị máy chấm công (`/admin/attendance`), cấu hình tham số (`/admin/settings`) và nhật ký kiểm toán hệ thống (`/admin/audit`).

8. Giao diện Chuyên biệt:
- `/check-in`: Giao diện Kiosk toàn màn hình phục vụ điểm danh sinh trắc học khuôn mặt 2D kết hợp cảm biến hồng ngoại IR chống giả mạo;
- `/login`: Giao diện xác thực bảo mật tập trung hỗ trợ mã thông báo JWT.

### 2.4.4. Thiết kế mô hình thành phần

Hệ thống được thiết kế và cài đặt theo mô hình kiến trúc ba tầng (3-Tier Architecture) hoàn chỉnh, bảo đảm tính độc lập cao giữa giao diện, logic xử lý và lưu trữ dữ liệu:

Tầng Giao diện người dùng (Presentation Tier): Xây dựng bằng Next.js 14 Standalone phục vụ giao diện người dùng cho toàn bộ 31 màn hình chức năng, đồng thời đóng vai trò là Reverse Proxy chuyển tiếp các yêu cầu API (`/api/*`) trực tiếp tới máy chủ backend mà không cần cấu hình thêm máy chủ web trung gian.

Tầng Xử lý nghiệp vụ (Business Logic Tier): Xây dựng trên nền tảng NestJS 10 (TypeScript) bao gồm 39 module nghiệp vụ chuyên biệt, vận hành trên hai bộ máy xử lý cốt lõi: Động cơ phê duyệt biến động nhân sự (Approval Engine) và Động cơ tính lương tự động (Payroll Engine), tích hợp các dịch vụ bảo vệ phân quyền (JwtAuthGuard, RolesGuard) và cơ chế truyền thông điệp sự kiện (Event-Driven Architecture).

Tầng Lưu trữ dữ liệu (Data Tier): Hệ quản trị cơ sở dữ liệu PostgreSQL 16 quản lý 87 model quan hệ, kết hợp ổ lưu trữ tệp đính kèm độc lập; quản trị cấu trúc lược đồ qua Prisma Migration tự động chạy phiên bản khi khởi động container.

![Hình 2.109: Sơ đồ kiến trúc phần mềm 3 tầng của hệ thống](images/hinh_2_22_arch_3tier.png)

Kiến trúc phân tầng rõ ràng giúp hệ thống vận hành ổn định, có độ bao đóng cao, cho phép doanh nghiệp dễ dàng nâng cấp giao diện hoặc tích hợp thêm các dịch vụ công nghệ mới (như phân hệ trí tuệ nhân tạo dự báo nhân sự) trong tương lai mà không làm gián đoạn cấu trúc dữ liệu nền tảng.

## Tóm tắt chương 2

Chương 2 đã hoàn thành toàn diện nhiệm vụ thiết kế hệ thống thông tin quản trị nhân lực cho Công ty Cổ phần Phần mềm Saigon Technology. Chương đã xác định rõ 11 tác nhân nghiệp vụ ánh xạ vào 3 nhóm vai trò phân quyền; phân tầng yêu cầu từ 18 quy trình thực tế xuống danh mục 47 Use Case hoàn chỉnh theo vòng đời nhân sự; phân tích các mô hình tương tác động thông qua 6 biểu đồ trình tự, 3 biểu đồ hoạt động và 5 biểu đồ trạng thái; xây dựng cấu trúc tĩnh với biểu đồ gói, biểu đồ lớp miền, lược đồ CSDL quan hệ gồm 87 model trên PostgreSQL 16 (bao gồm các bảng mở rộng cho chấm công đa nguồn), thiết kế 31 màn hình ứng dụng phân bổ trong 7 phân hệ nghiệp vụ chuẩn hóa và thiết lập mô hình kiến trúc phần mềm 3 tầng hiện đại.

---

# CHƯƠNG 3: KẾT QUẢ ĐẠT ĐƯỢC VÀ ĐỀ XUẤT, KHUYẾN NGHỊ HOẶC HƯỚNG NGHIÊN CỨU PHÁT TRIỂN

## 3.1. Những kết quả đạt được

Sau quá trình nghiên cứu, khảo sát thực tế tại Công ty Cổ phần Phần mềm Saigon Technology, vận dụng phương pháp phân tích thiết kế hướng đối tượng (OOAD) và tiến hành lập trình cài đặt thực tế toàn bộ hệ thống, đề tài đã đạt được các kết quả cụ thể:

Về mặt nghiệp vụ và chức năng: Hệ thống đã số hóa hoàn chỉnh 18 quy trình nghiệp vụ cốt lõi, hiện thực hóa thành 47 Use Case chức năng trên 31 trang màn hình ứng dụng thực tế (bao gồm 28 màn hình nghiệp vụ phân bổ thành 7 phân hệ giao diện không gian làm việc cùng 2 giao diện chuyên biệt: Kiosk điểm danh khuôn mặt & IR và Login xác thực tập trung). Hệ thống phục vụ 11 tác nhân nghiệp vụ gói gọn trong 3 vai trò phân quyền (USER, KM_MANAGER, ADMIN), bao quát trọn vẹn vòng đời nhân sự từ tuyển dụng ATS, hồ sơ nhân viên, phân cấp quản trị dữ liệu cá nhân 3 mức độ, điểm danh đa nguồn (máy chấm công phần cứng, Kiosk nhận diện khuôn mặt sinh trắc học 2D & cảm biến hồng ngoại IR chống giả mạo, Web ESS), quản lý nghỉ phép, làm thêm giờ, chu kỳ tính lương có khóa bất biến (LOCKED), các chính sách phúc lợi (khoản vay, công tác phí, tài sản), đánh giá hiệu suất 360 độ cho đến kho tri thức nội bộ và bộ hồ sơ cán bộ theo chuẩn Mẫu 2C-BNV/2008.

Về mặt cơ sở dữ liệu: Thiết kế và cài đặt hoàn chỉnh 87 model quan hệ chia thành 10 miền dữ liệu trên hệ quản trị PostgreSQL 16, quản trị di chuyển lược đồ tự động qua Prisma Migration; kiểm chứng thành công ba ràng buộc bất biến: nhật ký kiểm toán chỉ thêm (Append-Only Audit Log), sự kiện điểm danh bất biến, và cơ chế khóa kỳ lương chặn tính lại với lỗi HTTP 409 Conflict.

Về mặt chất lượng phần mềm: Toàn bộ mã nguồn backend và frontend đều vượt qua các bước kiểm tra cú pháp, kiểm tra kiểu tĩnh TypeScript (`tsc --noEmit`) và linter với 0 lỗi cảnh báo; bộ kịch bản kiểm thử tự động tích hợp end-to-end trên môi trường Docker chạy thật đạt kết quả 39 PASS / 0 FAIL, bao phủ đầy đủ các luồng nghiệp vụ quan trọng: thu hồi token khi đăng xuất, phân cấp hồ sơ Mức 2 có thẩm định minh chứng, kiểm soát quỹ phép, khóa kỳ lương bất biến, thôi việc tự sinh danh mục bàn giao 5 bước và xuất bản tri thức có phiên bản; toàn bộ các route giao diện nội bộ đạt thời gian phản hồi dưới 100ms với mã trạng thái HTTP 200 OK.

Về khả năng triển khai: Hệ thống được đóng gói hoàn chỉnh thành các container Docker độc lập, sẵn sàng khởi chạy và chuyển giao vận hành bằng một câu lệnh duy nhất (`docker compose up -d`).

## 3.2. Đánh giá ưu, nhược điểm

**Ưu điểm nổi bật:**
- Kiến trúc phần mềm phân tầng rõ ràng (3-Tier Architecture) kết hợp mô hình BCE giúp hệ thống có tính đóng gói cao, các thành phần giao diện, xử lý nghiệp vụ và lưu trữ dữ liệu hoạt động độc lập, thuận tiện cho việc bảo trì và mở rộng;
- Cơ cấu tổ chức doanh nghiệp được thiết kế dưới dạng cây phân cấp tự tham chiếu linh hoạt, cho phép doanh nghiệp tự do thành lập thêm chi nhánh, tách nhập phòng ban mà không phải can thiệp sửa đổi mã nguồn;
- Cơ chế quản trị dữ liệu nhân sự phân cấp 3 mức độ giúp phân định ranh giới quyền hạn chặt chẽ: cho phép nhân viên chủ động cập nhật thông tin liên lạc (Mức 1), bắt buộc thẩm định đối soát minh chứng đối với thông tin định danh pháp lý và tài chính (Mức 2) và khóa cố định đối với các dữ liệu vị trí, lương do tổ chức quản lý (Mức 3);
- Cưỡng chế tuân thủ quy trình bằng phần mềm: cơ chế khóa kỳ lương bất biến (LOCKED) chặn hoàn toàn các hành vi tính toán lại tùy tiện, và danh mục kiểm tra thôi việc 5 bước ngăn chặn việc ban hành quyết định chấm dứt hợp đồng khi chưa hoàn tất trách nhiệm bàn giao;
- Hỗ trợ đa dạng phương thức điểm danh, đặc biệt là kênh Kiosk nhận diện khuôn mặt sinh trắc học kết hợp cảm biến hồng ngoại IR chống giả mạo hình ảnh, xử lý vector tại trình duyệt và mã hóa AES-256-GCM, bảo đảm tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP.

**Hạn chế còn tồn tại:**
- Một số tham số pháp lý về thuế và bảo hiểm xã hội hiện đang được cấu hình cố định trong các module nghiệp vụ, cần được chuyển hóa hoàn toàn sang bảng tham số có hiệu lực theo ngày để tối ưu hóa việc quản lý lịch sử;
- Kênh kết nối máy chấm công phần cứng hiện đang kiểm thử thông qua bộ mô phỏng thiết bị (Simulator) và webhook giả lập, cần tiếp tục phát triển adapter tích hợp trực tiếp SDK chuyên dụng của các hãng phần cứng (như ZKTeco, Ronald Jack);
- Hệ thống chưa tích hợp chữ ký số công cộng (CA/PKI) để phục vụ việc ký số pháp lý đối với các quyết định hành chính và việc truyền nhận dữ liệu trực tiếp với cơ quan Bảo hiểm xã hội và Cơ quan Thuế.

## 3.3. Hướng nghiên cứu, phát triển

Để hệ thống phát huy tối đa hiệu quả trong môi trường thực tế, đề tài đề xuất một số hướng hoàn thiện và phát triển sau:

Về mặt công nghệ và tích hợp: Hoàn thiện các bộ adapter kết nối trực tiếp với phần cứng máy chấm công qua mạng nội bộ LAN; bổ sung công nghệ phát hiện chuyển động sống (Liveness Detection) đa góc nhìn cho camera nhận diện khuôn mặt; tích hợp giải pháp ký số từ xa (Remote Signing) để Giám đốc có thể ký ban hành các quyết định nhân sự có đầy đủ giá trị pháp lý.

Về mặt ứng dụng trí tuệ nhân tạo (AI): Sau giai đoạn vận hành tích lũy dữ liệu từ 1-2 năm, nghiên cứu phát triển tầng trí tuệ nhân tạo hỗ trợ dự báo nhân sự: thuật toán học máy phân tích nguy cơ thôi việc của nhân sự chủ chốt, công cụ quét định biên so với tiến độ dự án để cảnh báo thiếu hụt kỹ năng và gợi ý lộ trình đào tạo, luân chuyển cán bộ.

Về quy trình và đào tạo: Xây dựng tài liệu hướng dẫn vận hành chi tiết cho từng nhóm vai trò người dùng; tổ chức đào tạo theo lộ trình (hướng dẫn nhân viên sử dụng cổng tự phục vụ trước, tập huấn nghiệp vụ cho cán bộ quản lý và chuyên viên sau); thực hiện chạy song song hệ thống phần mềm với phương thức quản lý cũ trong 2 kỳ lương liên tiếp để đối soát độ chính xác tuyệt đối trước khi chuyển giao chính thức.

## Tóm tắt chương 3

Chương 3 đã tổng kết toàn diện các kết quả định lượng đạt được của đề tài: 47 use case trên 31 màn hình ứng dụng thực tế, 87 model cơ sở dữ liệu quan hệ, kiểm thử tích hợp 39/39 kịch bản thành công và hệ thống sẵn sàng vận hành trên nền tảng Docker. Chương cũng đánh giá khách quan các ưu điểm về mặt kiến trúc, quản trị phân cấp và tuân thủ quy trình, đồng thời chỉ ra các hạn chế cần khắc phục và vạch ra lộ trình nâng cấp công nghệ (tích hợp adapter máy chấm công, chữ ký số, tầng AI dự báo nhân sự) nhằm hỗ trợ doanh nghiệp chuyển đổi số toàn diện công tác quản trị nguồn nhân lực.

---

# TÀI LIỆU THAM KHẢO

1. TS. Trần Kim Dung. *Quản trị nguồn nhân lực*. Hà Nội: Nhà xuất bản Lao động - Xã hội, 2018.
2. PGS.TS. Nguyễn Ngọc Quân, ThS. Nguyễn Vân Điềm. *Giáo trình Quản trị nhân lực*. Hà Nội: Nhà xuất bản Đại học Kinh tế Quốc dân, 2017.
3. PGS.TS. Đặng Văn Đức. *Phân tích và thiết kế hướng đối tượng bằng UML*. Hà Nội: Nhà xuất bản Giáo dục, 2002.
4. Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Bộ luật Lao động số 45/2019/QH14*, ngày 20 tháng 11 năm 2019.
5. Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Luật Bảo hiểm xã hội số 58/2014/QH13*, ngày 20 tháng 11 năm 2014 và các văn bản hướng dẫn thi hành.
6. Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Luật Thuế thu nhập cá nhân số 04/2007/QH12*; Ủy ban Thường vụ Quốc hội. *Nghị quyết số 954/2020/UBTVQH14* về điều chỉnh mức giảm trừ gia cảnh của thuế thu nhập cá nhân.
7. Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Nghị định số 13/2023/NĐ-CP* ngày 17 tháng 04 năm 2023 về bảo vệ dữ liệu cá nhân.
8. Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. *Nghị định số 204/2004/NĐ-CP* về chế độ tiền lương đối với cán bộ, công chức, viên chức và lực lượng vũ trang; Bộ Nội vụ. *Thông tư số 08/2013/TT-BNV*.
9. Bộ Nội vụ. *Quyết định số 06/2007/QĐ-BNV* về thành phần hồ sơ cán bộ, công chức; *Thông tư số 11/2012/TT-BNV* quy định về chế độ báo cáo thống kê và quản lý hồ sơ công chức (Mẫu 2C-BNV/2008).
10. Công ty Cổ phần Phần mềm Saigon Technology. *Quy chế quản trị nội bộ, Quy trình sản xuất phần mềm và Tài liệu khảo sát nghiệp vụ nhân sự*, 2026.
11. Martin Fowler. *UML Distilled: A Brief Guide to the Standard Object Modeling Language*. 3rd Edition, Addison-Wesley Professional, 2003.
12. Robert C. Martin. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
