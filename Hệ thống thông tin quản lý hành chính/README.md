# Hệ thống thông tin quản lý hành chính

Phần mềm tại thư mục này là ứng dụng tác nghiệp chạy cục bộ, có máy chủ, cơ sở dữ liệu và bàn cán bộ đăng nhập. Báo cáo trong `Bao_cao_nghien_cuu_Ha_Noi` ghi lại phân tích, thiết kế, giới hạn đã xác minh và các luồng đã hiện thực; tài liệu đó không cấp quyền truy cập vào hạ tầng của Hà Nội.

Báo cáo chính: [Phân tích và thiết kế hướng đối tượng hệ thống Hà Nội](Bao_cao_nghien_cuu_Ha_Noi/04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx).

Bộ hồ sơ gồm báo cáo phân tích, danh sách hình/bảng, từ viết tắt, nguồn tham khảo, tài liệu mô hình, ảnh giao diện ứng dụng và thư viện hướng dẫn. Bản Word hiện có 141 hình và 99 bảng có số hiệu. Cổng người dân có trang chủ, tin lấy từ dữ liệu đã xuất bản, danh mục và chi tiết thủ tục, lập hồ sơ, tra cứu bằng mã/khóa riêng, gửi bổ sung và đánh giá hồ sơ đã kết thúc. `/huong-dan` có hướng dẫn thao tác riêng cho người dân/tổ chức và cán bộ.

Các tệp học tập 230926, bài viết `.md` và mẫu trình chiếu APAG được giữ nguyên trong kho tài liệu.

## Chạy hệ thống

- Cần Python 3.10+ và Node.js 20.19+.
- Nhấp đúp `MO_HE_THONG.bat` để khởi động hệ thống và tự mở trình duyệt khi máy chủ sẵn sàng. Nếu hệ thống đã chạy, tệp này mở thẳng trang chủ. Có thể dùng `run.bat` để chạy thủ công.
- Địa chỉ hệ thống: `http://127.0.0.1:8766`.
- Để phát triển giao diện: giữ máy chủ `python app.py` chạy, sau đó chạy `npm run dev` trong `frontend/`; Vite sử dụng cổng `5173` và chuyển `/api` tới máy chủ Python.
- Dữ liệu ứng dụng lưu tại `data/hanoi-services.sqlite3`. Tình trạng tài khoản hiện có được ghi trong [Danh sách tài khoản được phân quyền](DANH_SACH_TAI_KHOAN_DUOC_PHAN_QUYEN.md); không có tài khoản hoặc hồ sơ được tạo sẵn.

## Tài khoản và phân quyền

- Trong bàn cán bộ, nhấp tên người dùng ở góc trên bên phải để mở **Tài khoản cá nhân**: xem vai trò, cơ quan, hiệu lực, căn cứ duyệt; cập nhật điện thoại bằng mật khẩu hiện tại; đổi mật khẩu; xem số phiên và kết thúc các phiên khác. Nút **Đăng xuất** nằm ở cuối thanh bên.
- Phê duyệt tài khoản và xác minh email được hiển thị riêng. Ứng dụng chưa gửi mã hoặc liên kết xác minh email; API không coi cờ xác minh cũ là bằng chứng sở hữu email. Tài khoản quản trị mới khởi tạo cũng không tự được đánh dấu đã xác minh email.
- Người dân không phải tạo tài khoản ứng dụng. Khi gửi hồ sơ trong ứng dụng, người nộp nhận mã hồ sơ; khóa tra cứu do máy chủ tạo riêng và lưu mã hóa trong kho khóa, đồng thời lưu mã băm để kiểm tra. Cán bộ tiếp nhận hoặc trả kết quả đúng phạm vi được xem, sao chép và cấp lại khóa trong chi tiết hồ sơ; thao tác ghi nhật ký nội bộ. Khóa không nằm trong API danh sách hay phản hồi gửi hồ sơ. Khóa dùng để xem lịch sử và gửi bổ sung, vì vậy cần cất giữ an toàn. Đây là luồng cục bộ của ứng dụng, chưa liên thông hay thay thế giao dịch chính thức trên [Cổng Dịch vụ công quốc gia](https://dichvucong.gov.vn/).
- Cán bộ đăng nhập tại `/staff`; không có đăng ký công khai. Người vận hành khởi tạo ít nhất hai quản trị viên bằng `python app.py create-admin`. Quản trị viên lập đề nghị cấp tài khoản nghiệp vụ trong mục **Tài khoản**, gắn vai trò, cơ quan, căn cứ và thời hạn; quản trị viên khác phải duyệt thì tài khoản mới có hiệu lực.
- Quyền cán bộ hết hiệu lực ngoài khoảng ngày được duyệt. Hồ sơ phải có phạm vi cơ quan tiếp nhận (`agencyScope`) khớp với phạm vi tài khoản; tài khoản không được xem hồ sơ khác cơ quan. Mật khẩu khởi tạo cần được bàn giao qua kênh nội bộ.
- Tài khoản quản trị chỉ quản lý tài khoản, không được đọc chi tiết, tải tệp hoặc xuất dữ liệu hồ sơ công dân. Mục **Tài khoản** hỗ trợ đề nghị tạm ngưng/khôi phục hoặc đổi vai trò, cơ quan và thời hạn của tài khoản đã cấp. Một quản trị viên lập đề nghị, người khác duyệt; chủ tài khoản không tự duyệt. Đổi quyền được ghi lịch sử trước/sau và thu hồi phiên cũ. Thay đổi tài khoản quản trị cần một quản trị viên thứ ba; máy chủ ngăn thu hồi quản trị viên cuối cùng còn hiệu lực.
- Mật khẩu cán bộ được băm PBKDF2-HMAC-SHA256; phiên dùng cookie HttpOnly và mã CSRF. API đăng ký công dân cũ bị đóng; phiên công dân cũ không được dùng để vào bàn cán bộ.
- Khi đặt sau HTTPS reverse proxy, bật `HANOI_COOKIE_SECURE=1`; chỉ tin forwarded headers từ proxy do đơn vị vận hành quản lý.

## Phạm vi dữ liệu và tích hợp

- Danh mục hiện lấy từ tài liệu nghiên cứu đi kèm, chưa phải nguồn đồng bộ trực tiếp hay danh mục đã được cơ quan nghiệp vụ xác nhận. Báo cáo thiết kế 101 kịch bản kiểm thử (50 trọng tâm, 20 mở rộng, 31 chức năng); các kịch bản chưa được chạy trên hệ thống chính phủ. Đã xác nhận công khai một tuyến: mã 2.000908, Hà Nội → Phường Tây Hồ → UBND phường Tây Hồ. Tuyến đó không được áp dụng mặc định cho địa bàn khác.
- Đã chạy 23 bài kiểm tra hồi quy trên cơ sở dữ liệu tạm, gồm quyền CMS, tạo/sửa/xuất bản/lưu trữ tin và nhật ký, cùng API, luồng hồ sơ, tờ khai, giấy tờ, hạn, tiến độ, cấp và thu hồi tài khoản, khóa tra cứu mã hóa. TypeScript, lint và bản dựng frontend đã chạy thành công. Kết quả này không phải chạy đủ 101 kịch bản hoặc nghiệm thu của cơ quan nhà nước.
- Cổng người dân và bàn cán bộ dùng chung hồ sơ trong cơ sở dữ liệu cục bộ. Người dân gửi hồ sơ, xem sự kiện công khai, phản hồi yêu cầu bổ sung và đánh giá sau khi kết thúc; cán bộ tiếp nhận hồ sơ đó trong phạm vi cơ quan và xử lý theo vai trò. Mã tra cứu không phải mã tiếp nhận do cơ quan nhà nước cấp.
- Hiện chưa có kết nối đồng bộ hồ sơ với Cổng Dịch vụ công quốc gia, VNeID, hệ thống của bộ hoặc hệ thống tác nghiệp thật của Hà Nội. Luồng nộp có 5 bước và biểu mẫu có phiên bản riêng cho 1.004237 và 2.000908 trong procedure_forms.json. Chưa cấu hình biểu mẫu cho các thủ tục còn lại; máy chủ chặn nộp khi chưa có tờ khai đúng thủ tục. Danh mục phân biệt toàn trình, một phần và cung cấp thông tin. Tra cứu hiển thị tiến độ theo sự kiện, không suy ra mọi khâu trước đã xong từ trạng thái hiện tại. Ký số, phát hành chính thức, thanh toán/đối soát và đồng bộ liên thông tiếp tục bị khóa tới khi có hợp đồng API, thông tin xác thực và quy trình kiểm thử được phê duyệt.
- Phát hành kết quả, ký số, thanh toán/đối soát và đồng bộ liên thông bị khóa cho tới khi có hợp đồng API, thông tin xác thực và quy trình kiểm thử với nhà cung cấp/cơ quan có thẩm quyền. Hệ thống không tạo giao dịch hoặc chữ ký giả.
- Trước khi nhận giấy tờ định danh thật, cần cấu hình kết nối định danh và hồ sơ từ hệ thống thật, HTTPS, danh mục cơ quan/phạm vi chuẩn, chính sách lưu trữ, sao lưu, nhật ký truy cập, kiểm thử bảo mật và nghiệm thu nghiệp vụ trên hạ tầng được phê duyệt.

## Công nghệ

- Frontend: React, TypeScript, Vite.
- Backend: Python, HTTP API và SQLite cho cài đặt cục bộ.
- Tệp cấu hình ngày nghỉ: `working_calendar.json`; đơn vị vận hành cập nhật ngày lễ và ngày làm bù theo từng năm.

## Cài đặt kho khóa tra cứu

Chạy `python -m pip install -r requirements.txt` trước khi chạy máy chủ. Khóa tra cứu được mã hóa bằng Fernet; khóa mã hóa lưu tại `data/lookup-vault.key`, tách khỏi cơ sở dữ liệu. Sao lưu kho khóa cùng cơ sở dữ liệu vào nơi có quyền truy cập phù hợp; không đưa tệp khóa lên Git. Mất tệp này không thể giải mã khóa đã lưu. Hồ sơ cũ chỉ có mã băm cần được cán bộ cấp lại khóa.

Trang chủ đọc tin đã xuất bản từ cơ sở dữ liệu. Quản trị viên hệ thống vào bàn cán bộ, mục **Tin tức cổng thông tin**, để soạn bản nháp, biên tập, chọn ảnh có sẵn, gắn nguồn HTTPS `.gov.vn`, đánh dấu nổi bật, xuất bản, lưu trữ hoặc khôi phục. Hệ thống kiểm tra quyền, phiên bản dữ liệu và ghi lịch sử biên tập; người dân chỉ thấy tin đã xuất bản. Các ảnh và bài viết tham chiếu hiện có được nạp một lần khi cơ sở dữ liệu tin còn trống; hệ thống không tự đồng bộ nội dung mới từ trang Trung tâm. Nguồn ảnh ở `frontend/public/images/SOURCES.md`.
