# PHỤ LỤC

## A. Danh mục khảo sát với đơn vị sử dụng

Bảng A.1: Nội dung cần xác nhận trước triển khai

| Mã | Câu hỏi khảo sát | Sản phẩm cần thu |
| --- | --- | --- |
| KS01 | Nhánh thủ tục theo phương án 1811 hiện áp dụng phiên bản nào? | Quyết định, mã và cấu hình có hiệu lực |
| KS02 | Mốc 15 giờ và lịch làm việc được tính như thế nào? | Quy tắc duyệt và ví dụ ranh giới |
| KS03 | Hệ thống nào chịu trách nhiệm lưu hồ sơ gốc? | Sơ đồ trách nhiệm và giao tiếp |
| KS04 | Thông điệp giữa cổng quốc gia và địa phương có cơ chế đối soát nào? | Hợp đồng, mã lỗi và hướng dẫn thử |
| KS05 | Việc ký, cấp số và phát hành diễn ra trên thành phần nào? | Quy trình, quyền và chứng thư |
| KS06 | Chính sách tài chính và miễn giảm hiện hành là gì? | Văn bản và cấu hình được duyệt |
| KS07 | Quyền hỗ trợ kỹ thuật được cấp và kiểm tra như thế nào? | Quy trình cấp tạm và nhật ký |
| KS08 | Hệ thống đã có tách giao nhận và đồng bộ chưa? | Mẫu trạng thái, dữ liệu và báo cáo |
| KS09 | Khôi phục gần nhất được kiểm chứng như thế nào? | Biên bản và dữ liệu đối chiếu |
| KS10 | Số liệu sau tái cấu trúc được thu bằng phương pháp nào? | Kỳ dữ liệu, mẫu khảo sát và báo cáo |

## B. Ánh xạ dữ liệu vào biểu mẫu hành chính

Bảng B.1: Thiết kế ánh xạ dữ liệu biểu mẫu

| Mẫu | Dữ liệu nguồn | Kiểm tra trước lập |
| --- | --- | --- |
| 01 | Mã hồ sơ, chủ thể, thành phần, thời điểm và hạn | Đã tiếp nhận hợp lệ; phiên bản và hạn khớp |
| 02 | Thiếu sót, nội dung cần hoàn thiện, lý do và hướng dẫn | Căn cứ, giai đoạn và người lập hợp lệ |
| 03 | Chủ thể, yêu cầu, lý do không tiếp nhận | Không thay lý do bằng mã lỗi kỹ thuật |
| 04 | Hạn gốc, lý do chậm và thời điểm đề nghị mới | Người ký, giới hạn gia hạn và lịch sử |
| 05 | Đề nghị dừng, giai đoạn, quyết định và tài chính | Chưa có quyết định kết quả theo điều kiện áp dụng |
| 06 | Giao nhận qua cơ quan, thời điểm và kết quả | Lịch sử không bị ghi đè |
| 07 | Tiếp nhận, xử lý, trả và trạng thái | Kỳ thống kê và dữ liệu nguồn nhất quán |

Bảng ánh xạ phục vụ đặc tả dữ liệu, không thay thế hình thức biểu mẫu ban hành. Khi xây dựng chức năng in hoặc kết xuất, phải sử dụng mẫu gốc trong Phụ lục I Thông tư 03/2025/TT-VPCP và các trường bổ sung được cơ quan có thẩm quyền chấp thuận. Bản điện tử cần bảo đảm nội dung đầy đủ và nguồn dữ liệu được kiểm tra trước phát hành.

## C. Tình huống minh họa xuyên suốt

Tình huống C01 sử dụng người yêu cầu và dữ liệu hộ tịch giả lập. Người yêu cầu gửi đề nghị cấp bản sao vào buổi sáng ngày làm việc; dữ liệu nhân thân và sự kiện phù hợp; cán bộ tiếp nhận xác nhận hợp lệ; chuyên viên dự thảo; người có thẩm quyền ký; văn thư phát hành; kết quả được giao và đồng bộ. Từng bước phát sinh một sự kiện và được liên kết với chứng từ. Tình huống dùng để kiểm tra sự thống nhất giữa mô hình, không phải hồ sơ thật đã giải quyết.

Bảng C.1: Đối chiếu tình huống thuận lợi

| Bước | Trạng thái nghiệp vụ | Dữ liệu và bằng chứng |
| --- | --- | --- |
| Gửi | CHO_TIEP_NHAN | Mã yêu cầu duy nhất và phiên bản tờ khai |
| Nhận | DA_TIEP_NHAN | Mã hồ sơ, giấy tiếp nhận và hạn |
| Thẩm định | DANG_THU_LY | Phân công, nguồn tra cứu và ý kiến |
| Trình | TRINH_DUYET | Dự thảo đã chốt |
| Ký | DA_PHE_DUYET | Bản ký và kết quả kiểm tra |
| Phát hành | DA_PHAT_HANH | Số văn bản và bản phát hành |
| Giao | HOAN_THANH | Chứng cứ giao và trạng thái từng đích |

Tình huống C02 có cùng luồng đến phát hành, nhưng kho nhận mất phản hồi sau khi xử lý. Hồ sơ vẫn giữ đã phát hành; chiều đồng bộ ghi cần kiểm tra. Tiến trình gửi lại giữ mã thông điệp. Đơn vị vận hành xác nhận đích đã nhận để tránh tạo lần giao mới. Tình huống thể hiện lý do cần tách trạng thái và có đối soát.

Tình huống C03 tiếp nhận sau 15 giờ trước một ngày nghỉ. Hạn được xác định bằng lịch đã duyệt và quy tắc của thủ tục, không cộng mặc định 24 giờ. Nếu cán bộ thay hạn, hệ thống cần căn cứ, người duyệt và lịch sử. Tình huống được đưa vào bộ thử ranh giới vì có thể gây sai đồng thời giấy hẹn và báo cáo quá hạn.

## D. Điều kiện sử dụng bộ thiết kế

Sơ đồ, từ điển dữ liệu và hợp đồng giao tiếp trong bộ thiết kế có cùng mã và thuật ngữ với báo cáo. Chúng là phương án nghiên cứu được xây dựng từ quy trình thực tế đã lựa chọn. Trước phát triển, cần xác nhận khoảng trống khảo sát, bổ sung đặc tả kết nối do đơn vị quản lý cung cấp và thực hiện thẩm định an toàn theo quy định. Khi sửa thiết kế, phải cập nhật ma trận truy vết và bộ thử liên quan.
