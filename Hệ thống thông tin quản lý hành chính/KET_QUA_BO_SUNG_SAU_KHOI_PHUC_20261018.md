# Kết quả bổ sung dự án hành chính sau khôi phục

Ngày thực hiện: 18/10/2026.

## Các phần đã bổ sung

1. Tiếp nhận hồ sơ trực tiếp tại quầy: giới hạn vai trò tiếp nhận và phạm vi cơ quan, xác nhận đối chiếu người nộp, danh mục giấy tờ, cấp mã hồ sơ và chống gửi trùng bằng mã phiên. Khóa tra cứu tiếp tục lưu mã hóa và được cán bộ lấy qua chức năng hiện có.
2. Số hóa tại quầy: nhận tệp quét thực tế, kiểm tra số trang và danh mục đối chiếu, giữ nguyên nội dung tệp, ghi người thực hiện và lịch sử. Không tự tạo giấy tờ giả thay tệp nộp.
3. Khoản thu: người nộp khai hình thức đã nộp và mã chứng từ; cán bộ tài chính nhập tham chiếu đối soát. Thông tin chứng từ đi cùng khoản thu ở API và giao diện.
4. Hoàn phí: người đề nghị không được tự duyệt. Duyệt đề nghị không đồng nghĩa đã chi hoàn. Chỉ cập nhật REFUNDED sau bước ghi nhận chứng từ thực hiện hoàn. Kiểm tra phiên bản và giao dịch SQLite bảo vệ tính nhất quán khi thao tác lỗi hoặc trùng.
5. Lịch hẹn: đặt theo ngày làm việc và khung giờ, giới hạn 10 lịch/cơ quan/khung giờ trong 30 ngày tới; tra cứu bằng mã và số điện thoại đã khai; cán bộ cùng cơ quan cập nhật theo các bước xác nhận, đến quầy, phục vụ hoặc hủy. Lưu lịch sử thao tác. Đây là cấu hình của ứng dụng môn học.
6. Phản ánh, kiến nghị: người gửi nhận mã theo dõi; cán bộ cùng cơ quan trả lời và lưu lịch sử. Ngăn ghi đè phản ánh đã trả lời. Quản trị hệ thống chỉ lấy số lượng tổng hợp qua API bàn dịch vụ.
7. Khởi động: bỏ thao tác tự xóa hồ sơ cũ và tự sinh hồ sơ mẫu. Giữ tài khoản, mật khẩu và dữ liệu đã phục hồi. Các thay đổi schema mới chỉ bổ sung bảng/cột khi chưa tồn tại.
8. Tài liệu: cập nhật README và danh sách 79 tài khoản đọc trực tiếp từ SQLite. Giữ danh sách ngày 11/10 dưới dạng bản ghi lịch sử, không coi các mật khẩu trong bản đó là thông tin hiện tại đã xác minh.

## Kiểm tra và bảo vệ dữ liệu

- Trước khi sửa đã tạo source-before.zip và database-before.sqlite3 trong recovery/evidence/admin_completion_20261018_143250/.
- Bộ kiểm thử hiện tại: 31/31 đạt. Có 8 bài mới cho phân quyền, CSRF, gửi trùng, tệp quét, chứng từ thu, hoàn phí, lịch hẹn, phản ánh, JSON không hợp lệ và bảo toàn dữ liệu khi khởi động.
- TypeScript/Vite build thành công. Lint không có lỗi; còn 9 cảnh báo trong App.tsx.
- Kiểm tra trình duyệt bằng Edge/Playwright trên SQLite sao chép: gửi phản ánh, cán bộ trả lời và tiếp nhận tại quầy thành công; không ghi nhận lỗi JavaScript hoặc tràn ngang ở 390 px. Đã xem ảnh biểu mẫu máy tính và di động; dùng lại class biểu mẫu của dự án, không thay CSS, font, màu hoặc khung điều hướng.
- SQLite đang dùng có 79 tài khoản, 213 hồ sơ, 938 sự kiện, 11 lịch hẹn, 10 phản ánh và 82 bản ghi khoản thu. PRAGMA quick_check trả về ok. SHA-256 của tệp DB sau khi sửa/kiểm thử trùng trước khi sửa. Tài khoản và hồ sơ QA chỉ nằm trong bản sao kiểm tra.
- Không thay đổi Docker hoặc dữ liệu dự án nhân sự. Chưa commit hoặc push các thay đổi.

## Cách dùng

Mở MO_HE_THONG.bat để chạy bản mới tại http://127.0.0.1:8766/. Cán bộ tiếp nhận/lãnh đạo mở Kết nối dịch vụ để dùng bàn lịch hẹn và phản ánh; tiếp nhận tại quầy nằm ở đầu màn hình này. Người dân mở mục Đặt lịch hẹn, gửi phản ánh và tra cứu kết quả dưới danh mục thủ tục trên trang chủ.

Bộ dữ liệu hiện có một tài khoản tài chính. Để dùng đầy đủ bước duyệt hoàn độc lập, quản trị viên cần cấp thêm tài khoản tài chính qua luồng đề nghị/phê duyệt hiện có; không dùng cùng người lập để tự duyệt. Kiểm thử đã dùng hai tài khoản tài chính riêng trên DB tạm.

Lần khởi động đầu với mã mới sẽ bổ sung bảng/cột còn thiếu vào SQLite. Không nhập đè dump hoặc dữ liệu mẫu. Bản sao kiểm tra chạy riêng trên cổng 8767 và không được dùng làm cơ sở dữ liệu chính.

## Giới hạn phục hồi

Đây là bản bổ sung chức năng đã kiểm thử từ mã, dữ liệu và lịch sử còn lại; không phải xác nhận đã tìm lại nguyên trạng mọi dòng mã trước khi xóa. Sổ unmatched-hunks ban đầu có 264 đoạn thuộc 13 tệp của cả hai dự án; 256 đoạn thuộc 9 tệp hành chính, 8 đoạn thuộc dự án nhân sự. Con số đó không phải số chức năng còn thiếu và không dùng làm tỷ lệ phục hồi.

Các báo cáo Word/PDF phục hồi trước đó được giữ nguyên trong lượt này. Chưa rà soát lại toàn bộ đối chiếu nghiệp vụ hoặc nội dung pháp lý trong các báo cáo. Các kết nối cổng quốc gia, VNeID, ngân hàng và nhà cung cấp chữ ký số vẫn cần tích hợp riêng.
