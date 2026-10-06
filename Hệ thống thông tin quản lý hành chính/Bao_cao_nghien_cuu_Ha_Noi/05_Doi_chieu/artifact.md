# Hợp đồng định dạng theo tài liệu tham chiếu

Tài liệu: C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Công nghệ phần mềm/Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx

SHA256: 256c1192480f9dd050c6c6bd31aea19f959d1c63fa104be20f1e0a332a118725.

Tài liệu tham chiếu được Microsoft Word kết xuất thành 122 trang. Có hai phần: hai trang bìa và phần nội dung đánh số lại từ 1. Kiểm tra các mẫu trang trong mau_render; bằng chứng cấu trúc đầy đủ trong mau_tham_chieu.json.

Khổ trang 11907 × 16839 đơn vị twip. Lề trên, dưới, phải 1134; trái 1701. Khoảng đầu và chân trang 720. Giữ nguyên hai phần cùng định nghĩa chân trang. Sao chép các phần tử thân tài liệu từ đoạn 0 đến 50 làm hai bìa, bao gồm biểu trưng, hình khung, ngắt trang và ngắt phần.

Văn bản thường: Times New Roman, 13 điểm, đen; căn đều; thụt dòng đầu 720 twip; trước và sau đoạn 120 twip; giãn dòng 360 twip theo hệ số tự động. Tiêu đề cấp một 14 điểm, đậm, giữa, trước 360, sau 240; cấp hai 13 điểm đậm, trái, trước 240; cấp ba 13 điểm nghiêng, không đậm, trước 160, sau 80. Giữ các định nghĩa kiểu gốc.

Mục lục: sử dụng kiểu toc 1 và toc 2, dấu dẫn chấm, số trang căn phải. Theo ràng buộc đã tiếp nhận, chỉ lấy cấp một và hai dù mẫu cũ có cấp ba. Danh mục viết tắt theo bảng đầu tiên của mẫu. Bổ sung danh mục bảng và hình với số trang cập nhật bởi Word.

Bảng: sao chép tblPr của bảng gốc, đường viền đơn 0,5 điểm màu tự động, căn giữa, bố trí cố định, lề ô trên dưới 60 twip và trái phải 100 twip. Đoạn trong ô 13 điểm, dòng đơn, trước sau 40 twip, không thụt đầu dòng. Tiêu đề hàng đậm; hàng không chia qua trang, lặp hàng tiêu đề. Cho phép nhân bản mẫu với 2 đến 5 cột, điều chỉnh tỷ lệ rộng theo nội dung trong 9072 twip.

Chú thích bảng: đậm trên bảng, căn trái; dùng mẫu đoạn 244. Hình căn giữa, chú thích nghiêng 11 điểm dưới hình, trước 40 sau 160 twip; sao chép mẫu đoạn 173. Sơ đồ mới sử dụng đường đen, nền trắng, nhãn tiếng Việt; được thay hình theo nội dung nghiên cứu, không sao chép sơ đồ tuyển dụng.

Vị trí chỉnh sửa: document.xml, các đoạn tên đề tài 10, 11, 35, 36; học phần 14, 39; đường dấu gạch 12, 37 bỏ nội dung theo yêu cầu người dùng, giữ nhịp đoạn. Theo yêu cầu bổ sung ngày 02/10/2026, đoạn 15 và 40 ghi GVHD Hoàng Minh Ngọc; đoạn 41 chỉ ghi sinh viên Lê Quóc Huy, 2305HTTB011; đoạn 42 đến 46 để trống nhưng giữ nhịp bìa. Thay toàn bộ nội dung từ sau đoạn 50 bằng báo cáo nghiên cứu. Giữ sectPr cuối cùng. Không thay đổi tài liệu tham chiếu.

Thành phần bảo toàn: styles.xml, stylesWithEffects.xml, numbering.xml, theme, fontTable, header, footer, các quan hệ của các phần ấy và hình trang bìa. document.xml.rels và Content_Types được phép bổ sung quan hệ ảnh thiết kế. settings.xml được phép bật cập nhật trường. docProps được phép cập nhật tên và thống kê của báo cáo mới.

Đối chiếu: kiểm tra bằng mã toàn bộ quy cách trên; kết xuất qua Word, cập nhật mục lục, danh mục, số trang. Xem từng trang cuối ở kích thước đọc được. Thực hiện điều chỉnh khi bảng bị cắt, chữ hoặc hình chồng lấn, chú thích tách hình. So sánh hai bìa và các mẫu đoạn, bảng, hình ở độ phóng đại tương đương. Nội dung, số trang và số chương thay đổi theo đề tài, không phải tiêu chí giống từng điểm ảnh.

Trình kết xuất đóng gói không chạy do thiếu LibreOffice trên Windows. Dùng Word sẵn có để xuất bản PDF phục vụ kiểm tra và pypdfium2 để tạo ảnh trang; không cài thêm phần mềm.

Thông số kết quả của bản bổ sung được ghi trong Bien_ban_doi_chieu.md và ket_qua_kiem_tra.json sau khi kết xuất và kiểm tra. Từ điển dữ liệu sử dụng độ rộng cột 2200, 1750, 1450, 1100, 2572 twip; ma trận quyền sử dụng 1800, 1700, 1700, 1900, 1972 twip. Tổng độ rộng đều là 9072 twip. Bản kết xuất cuối của lần bổ sung nằm trong Bo_sung_20261002/ban_ban_giao.

## Phạm vi bản thiết kế hướng đối tượng ngày 02/10/2026

Hai tệp mới giữ hai bìa, các phần, kiểu đoạn và bảng của mẫu TalentConnect. Bản thiết kế dùng mẫu PTTK_OOP_HR để đối chiếu phương pháp và loại biểu đồ; không sao chép nghiệp vụ nhân lực. Có 160 hình đánh số, trong đó 14 ảnh nguồn và 36 màn hình đề xuất; 98 bảng đánh số cùng một bảng viết tắt. Bản tóm tắt là tài liệu trình bày riêng, không phải phần mềm hoặc kết quả kiểm thử. Khung kiểm tra cấu trúc, kết xuất qua Word và nhật ký xem ảnh được lưu trong Kiem_tra_huong_doi_tuong_20261002. Không tuyên bố yêu cầu hướng dẫn chuyên biệt mọi thủ tục hiện hành đã hoàn tất.


## Biên tập ngày 03/10/2026

Biểu đồ trình tự dùng chữ Arial, biểu tượng giao diện, điều khiển và dữ liệu, mũi tên liền cho yêu cầu và nét đứt cho phản hồi. Nhãn không bị cắt giữa một từ. Điều kiện từng nhánh viết ngắn và cụ thể. UC13 phân biệt cán bộ với người nộp; UC16 phân biệt người duyệt, người ký và văn thư. Nội dung đặc tả nêu điều kiện bắt đầu, từng bước, kết quả và ngoại lệ. Các nguồn mẫu chỉ được dùng ở hồ sơ kiểm tra nội bộ.

## Chỉnh sửa lời mở đầu ngày 03/10/2026

Viết lại hai phần lời cảm ơn và lời cam đoan bằng giọng văn sinh viên, mỗi phần một trang. Giữ nguyên định dạng và nội dung từ mục lục trở đi. Báo cáo vẫn 206 trang; 29 kiểm tra định dạng, 10 kiểm tra nội dung và bảo toàn đều đạt. Hai trang sửa đã được xem trực quan. Bằng chứng nằm trong Mo_dau_20261003. SHA256 bản cuối: 4f98bba24243cbac42bfb936d09f4904e7361d24038ac8edb4627c02457c7aca.

## Gộp chương theo yêu cầu ngày 03/10/2026

Cấu trúc bảy chương được gộp thành bốn chương. Chương 1 gồm đối tượng, phạm vi và khảo sát giao diện. Chương 2 gồm tác nhân, 36 Use case, hướng dẫn chức năng và hướng dẫn theo thủ tục. Chương 3 gồm các mô hình hướng đối tượng, kiến trúc và đặc tả lập trình. Chương 4 gồm triển khai, kiểm thử, vận hành và quản trị. Giữ nguyên toàn bộ nội dung chi tiết, các bảng, hình, lời mở đầu, tài liệu tham khảo và phụ lục. Chỉ thay tiêu đề chương, số mục, số chú thích và dẫn chiếu nội bộ; cập nhật các danh mục bằng Word. Bản trước gộp, bản đồ chuyển nội dung và bằng chứng kiểm tra nằm trong Gop_chuong_20261003. Đây là thay đổi cấu trúc đã được người dùng yêu cầu, không thay đổi hệ thống kiểu và hình thức của mẫu.

Bản cuối sau gộp đã cập nhật trường trong Word và kết xuất 204 trang. Đủ 98 bảng, 160 chú thích hình, 97 chú thích bảng và 36 Use case; toàn bộ nội dung trong các đoạn và ô bảng được bảo toàn. 29 kiểm tra định dạng và 15 kiểm tra bảo toàn đạt. Đã xem trực quan đủ 204 trang qua 51 ảnh ghép giữ độ phân giải gốc. SHA256 bản cuối: a658ba529da0acc3b88c3eef478123a2d6953ec1259b5334ef1ee968d89be24c. Hồ sơ kết quả nằm trong Gop_chuong_20261003/Kiem_tra_gop_chuong.json và Kiem_tra_truc_quan.json.


## Điều chỉnh tên chương ngày 03/10/2026
Đã đọc cấu trúc của hai tài liệu tham chiếu và đặt tên chương theo nhiệm vụ chính của nội dung, giữ cách gộp thành bốn chương. Tên mới: Tổng quan về hệ thống thông tin giải quyết thủ tục hành chính thành phố Hà Nội; Phân tích hệ thống; Thiết kế hệ thống; Đề xuất triển khai và quản trị hệ thống.
Đã cập nhật mục lục. Giữ nguyên toàn bộ nội dung ngoài bốn tên chương, 98 bảng và hình ảnh. Báo cáo vẫn có 204 trang. Năm kiểm tra bảo toàn nội dung và 29 kiểm tra định dạng đều đạt. Đã xem 32 trang có thay đổi; 172 trang còn lại trùng khớp từng điểm ảnh với bản đã kiểm tra đầy đủ trước đó.
SHA256: 134f3ff1a0b0b668e9afea0e7c374346c93a481dd7669162a07014d02e04931d

## Bỏ phụ lục ngày 03/10/2026
Đã bỏ phần phụ lục Tệp bàn giao và nội dung còn thiếu, bảng A.1 và các dòng danh mục tương ứng. Giữ nguyên nội dung các chương và tài liệu tham khảo, chỉ sửa một đường dẫn tới báo cáo đã ngừng dùng. Báo cáo còn 203 trang, 160 hình, 97 bảng. Bốn kiểm tra bảo toàn và 29 kiểm tra định dạng đều đạt. Đã xem 48 trang thay đổi và trang cuối; 155 trang trùng khớp với bản đã kiểm tra. Biểu đồ lớp hiện có sơ đồ cốt lõi và 10 hình theo nhóm; chưa có biểu đồ lớp tổng hoặc ERD tổng. SHA256: 7eb58838ade5d45b5dac0a68409f52938388ea627dc8a37ba52aeb85f30769c0

## Bổ sung hai sơ đồ tổng và căn danh mục ngày 03/10/2026
Biểu đồ lớp và ERD đều có đủ 35 nút, 62 quan hệ; các trường tham chiếu và tính bắt buộc khớp đặc tả. Đã giữ nguyên 97 bảng, các đoạn nội dung cũ và nội dung ảnh cũ. Word tự đổi tên 12 phần ảnh; đối chiếu bằng hàm băm xác nhận không thay đổi nội dung ảnh. Đã xem 80 trang thay đổi qua 20 bảng ảnh và hai trang sơ đồ lớn; 125 trang còn lại trùng khớp từng điểm ảnh với bản đã kiểm tra. Báo cáo 205 trang, 162 hình. Danh mục bảng và hình dùng tab phải 9072, lề trái 0, dấu chấm dẫn, chữ đen và không gạch chân. Hai trang 166 và 167 dùng khổ 420 x 550 mm để đọc sơ đồ tổng; các phần nội dung giữ khổ A4. Ảnh kiểm tra và bản sao đều đặt trong thư mục tạm ngoài kho tài liệu. SHA256: fa0c48ee64c21c4f350ad1e3158f60ab321bfba65e737cfa8ef9af767bef3695


## Sửa bố cục biểu đồ ngày 03/10/2026

Thay hai sơ đồ khổ lớn bằng các hình phân nhóm và liên kết nối tiếp trong mục 3.2. Bản hiện hành có 232 trang A4, 188 hình có chú thích và 97 bảng. Mô hình lớp giữ 35 lớp và 62 quan hệ; ERD giữ 35 bảng và 62 khóa ngoại. Các đối tượng lặp tên trong từng liên kết chỉ cùng một đối tượng, không phát sinh lớp hoặc bảng.

Đã xuất lại bằng Word, kết xuất toàn bộ 232 trang và rà các trang đối chiếu; mở riêng trang hình phân nhóm, quan hệ lớp và ERD để kiểm tra chữ, đường nối, chú thích và lề. Đối chiếu khóa ngoại, bảng đích và khả năng để trống với từ điển dữ liệu đạt ở 62 liên kết. Hai phân đoạn đều A4; 28 hình thay thế nằm trong lề; nội dung 97 bảng và toàn bộ ảnh gốc được giữ; các thành phần kiểu chữ, đầu trang và chân trang trùng bản gốc. Mục lục và danh mục đã cập nhật số trang. Ảnh kiểm tra, bản sao trước sửa và bản xuất PDF chỉ lưu ngoài kho tài liệu.

## Hoàn thiện phần mở đầu và sơ đồ ngày 04/10/2026

Theo yêu cầu mới nhất, giữ nguyên bốn tên chương và nội dung phân tích, thiết kế, triển khai, kiểm thử, vận hành và quản trị. Bổ sung phần mở đầu riêng gồm sáu mục. Bỏ 36 hình màn hình đề xuất cùng chú thích và các dẫn chiếu MH không còn sử dụng; giữ các ảnh khảo sát hệ thống thực tế. Nội dung 97 bảng được đối chiếu với bản trước sửa, chỉ bỏ tiền tố dẫn chiếu màn hình trong ô Truy vết và dòng viết tắt MH.

Thay 28 hình phân nhóm và liên kết rời bằng 34 sơ đồ có đường quan hệ: 17 phần biểu đồ lớp và 17 phần ERD, mỗi mô hình bao phủ 35 đối tượng và 62 quan hệ. Biểu đồ lớp có ngăn tên, thuộc tính, phương thức và số lượng liên kết; ERD có thực thể, khóa chính, khóa ngoại, hình thoi quan hệ và số lượng liên kết. Các đối tượng tham chiếu sang phần khác có chỉ dẫn ngay dưới hình. Toàn bộ sơ đồ đặt trong khổ A4, không dùng trang khổ lớn.

Bản cuối được Word cập nhật trường và kết xuất thành 235 trang A4. Đã kết xuất đủ 235 ảnh trang, rà toàn bộ qua 20 bảng ảnh và mở riêng 34 trang sơ đồ mới cùng các trang mở đầu, danh mục để kiểm tra. Không có trang trắng. Đối chiếu đủ 254 mục danh mục bảng và hình với vị trí chú thích trong bản xuất PDF: số trang đều khớp. Danh mục dùng tab phải 9072 twip, dấu dẫn chấm, lề trái 0; giữ nguyên các thành phần kiểu, đầu trang và chân trang của bản trước sửa. Tài liệu tham chiếu không thay đổi. Các ảnh kiểm tra, PDF và bản sao chỉ lưu trong thư mục tạm ngoài kho tài liệu.

SHA256 bản cuối: 6a38ec21943bd6905ee58e39aca4964fa92b5e25f7d7abd75a5332de858e252e.
