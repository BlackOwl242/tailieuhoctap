# Sửa in danh sách và xuất bảng — 27/10/2026

## Lỗi đã xác minh

DataTable mặc định gọi window.print() để in cả app. CSS in toàn cục ẩn body và chỉ cho hiện vùng print-area/a4-sheet; các bảng như tổng quan KPI không nằm trong vùng này nên in trắng. Bảng có phân trang cũng chỉ dựng trang hiện tại lên DOM. Xuất Excel trước sửa có thể tải được trong lượt tái hiện ở tổng quan KPI; chưa có bằng chứng mọi chức năng Excel cùng lỗi khởi tạo thư viện. Tuy nhiên dữ liệu xuất mặc định lấy trường thô, dễ bỏ nội dung cột tính toán hoặc ra chuỗi [object Object]; Promise xuất bị bỏ qua nên lỗi không hiện cho người dùng.

## Thay đổi

- DataTable tạo snapshot từ toàn bộ dữ liệu đã lọc/sắp xếp, tách khỏi phân trang màn hình. In và Excel dùng cùng tập dòng/cột. Cột noPrint hoặc thao tác được bỏ.
- Ưu tiên exportValue do trang định nghĩa; các cột hiển thị tùy biến được lấy nhãn thực tế từ bản render trong cùng ngữ cảnh React. Ngăn nối liền tên và email ở các span hiển thị dạng block. Giữ số hữu hạn ở dạng số trong XLSX.
- Bản in bảng dùng iframe độc lập, không nhập CSS app, có tiêu đề, thời điểm, số dòng và tiêu đề cột lặp ở trang sau. Tự chọn giấy ngang khi nhiều cột; bản in không có dòng phù hợp vẫn có thông báo thay vì trang trắng. Căn chỉnh số in tối đa hai chữ số thập phân khi exportValue là số.
- Báo cáo cũ dùng vùng in riêng được trích sang iframe có sẵn thay vì mặc định in cả giao diện.
- Excel vẫn là tệp XLSX thật, có dòng tiêu đề, bộ lọc, cố định tiêu đề, xuống dòng và độ rộng cột theo dữ liệu. Hỗ trợ dạng module ExcelJS khác nhau, gắn link tải vào DOM và trì hoãn thu hồi Blob URL.
- Dropdown chờ hoàn tất thao tác, khóa bấm lặp khi chuẩn bị và hiện toast khi thất bại. Các đường xuất riêng ở chấm công, cơ cấu tổ chức và danh mục trả/đón Promise để lỗi không bị bỏ qua.

## Kiểm tra và triển khai

Build production frontend qua; đã thay web Docker localhost:8080, healthy. Không thêm migration hoặc đổi quyền dữ liệu.

Kiểm thử trình duyệt trên web Docker với API giả lập: danh sách 37 dòng dù màn hình chỉ phân trang 10 dòng, lọc còn 1 dòng, viewport 375px, không có dòng, bảng phân quyền và báo cáo chấm công. Mở lại 6 XLSX để kiểm tra số dòng/cột, số phút công vẫn là số, tên đơn vị và trạng thái là nhãn đọc được, không có cột thao tác hay [object Object]. Thử gây lỗi tạo Blob đã xác nhận toast xuất hiện và nút cho thử lại.

Kiểm tra 6 PDF từ tài liệu in tương ứng: danh sách dài 3 trang có đủ dòng cuối, các bản lọc/mobile/rỗng/phân quyền/chấm công 1 trang; không trang trắng. Đã trích xuất chữ, render PNG kiểm tra tiêu đề, tiếng Việt, ngắt trang, tên/email, tiêu đề cột lặp và bảng công. Các PDF là sản phẩm kiểm thử dữ liệu giả lập, không phải báo cáo thực của doanh nghiệp.

## Chỉnh bố cục báo cáo nội bộ

Sau phản hồi bản in thiếu định dạng, đã bổ sung mẫu trình bày cho bảng in: thông tin đơn vị/phòng ban từ cấu hình tổ chức; tên báo cáo in hoa, căn giữa; phạm vi lọc, tổng số bản ghi và thời điểm lập; cột STT tự thêm nếu chưa có; độ rộng cột theo loại nội dung; tiêu đề bảng lặp ở các trang; số trang hiện tại/tổng trang và hai vị trí ký theo cấu hình. Không tự sinh số văn bản, quyết định phê duyệt hoặc chữ ký thật.

Doanh nghiệp hiển thị nhãn báo cáo quản trị nội bộ. Chế độ nhà nước dùng quốc hiệu/tiêu ngữ; đây là định dạng bản in, không phải xác nhận văn bản đã ban hành hay đáp ứng một biểu mẫu pháp quy cụ thể. KPI dùng tiêu đề “Báo cáo theo dõi KPI nhân sự” và in rõ kỳ/phạm vi đang chọn. Bảng từ 5 cột hoặc có cột ghi chú/việc xử lý dài dùng A4 ngang. Font Times New Roman, tiêu đề 17pt; thân 13pt, bảng thông thường 12pt, bảng nhiều cột 10.5pt; lề trên/dưới 18mm, trái 20mm, phải 15mm.

Ngày/giờ, URL và tiêu đề ở mép giấy do Chrome tự chèn không phải nội dung báo cáo. Đã thêm hướng dẫn ngay trong menu: A4, tỷ lệ 100%, tắt “Đầu trang và chân trang” trong Tùy chọn khác. JavaScript trang không thay được lựa chọn này của người dùng. Tham khảo tài liệu chính thức: https://developer.chrome.com/blog/print-margins?hl=en.

Build và triển khai web Docker đã qua. Kiểm thử lại 4 XLSX/PDF cho toàn bộ 37 dòng, sau lọc, viewport nhỏ, dữ liệu rỗng và thêm XLSX/PDF bảng phân quyền. Excel không đổi số dòng/cột. Mẫu mới: KPI 37 dòng 5 trang A4 ngang; bản sau lọc/mobile/rỗng 1 trang, phân quyền 2 trang. Kiểm tra tất cả trang có STT, số trang, đủ dòng cuối, phần ký cuối tài liệu, không trang trắng; đã render ảnh để rà soát bố cục.
