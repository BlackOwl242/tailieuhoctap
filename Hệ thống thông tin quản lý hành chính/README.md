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
- Dữ liệu ứng dụng lưu tại `data/hanoi-services.sqlite3`. Có 11 tài khoản cục bộ (2 quản trị viên, 9 cán bộ) được ghi trong [Danh sách tài khoản được phân quyền](DANH_SACH_TAI_KHOAN_DUOC_PHAN_QUYEN.md); cơ sở dữ liệu có 17 hồ sơ tình huống mô phỏng để hiển thị và thực hành luồng, không có hồ sơ công dân thật.

## Tài khoản và phân quyền

- Trong bàn cán bộ, nhấp tên người dùng ở góc trên bên phải để mở **Tài khoản cá nhân**: xem vai trò, cơ quan, hiệu lực, căn cứ duyệt; cập nhật điện thoại bằng mật khẩu hiện tại; đổi mật khẩu; xem số phiên và kết thúc các phiên khác. Nút **Đăng xuất** nằm ở cuối thanh bên.
- Các giai đoạn trên Tổng quan điều hành, chỉ số và dòng phân bố ở Giám sát quy trình có thể nhấp để mở hộp xử lý với trạng thái, cơ quan, người phụ trách hoặc thời hạn tương ứng. Trong Báo cáo vận hành, chọn **Mở hồ sơ** ở dòng tổng hợp để xem danh sách chi tiết với cùng cơ quan/thủ tục/trạng thái và khoảng ngày.
- Phê duyệt tài khoản và xác minh email được hiển thị riêng. Ứng dụng chưa gửi mã hoặc liên kết xác minh email; API không coi cờ xác minh cũ là bằng chứng sở hữu email. Tài khoản quản trị mới khởi tạo cũng không tự được đánh dấu đã xác minh email.
- Người dân không phải tạo tài khoản ứng dụng. Khi gửi hồ sơ trong ứng dụng, người nộp nhận mã hồ sơ; khóa tra cứu do máy chủ tạo riêng và lưu mã hóa trong kho khóa, đồng thời lưu mã băm để kiểm tra. Cán bộ tiếp nhận hoặc trả kết quả đúng phạm vi được xem, sao chép và cấp lại khóa trong chi tiết hồ sơ; thao tác ghi nhật ký nội bộ. Khóa không nằm trong API danh sách hay phản hồi gửi hồ sơ. Khóa dùng để xem lịch sử và gửi bổ sung, vì vậy cần cất giữ an toàn. Đây là luồng cục bộ của ứng dụng, chưa liên thông hay thay thế giao dịch chính thức trên [Cổng Dịch vụ công quốc gia](https://dichvucong.gov.vn/).
- Cán bộ đăng nhập tại `/staff`; không có đăng ký công khai. Người vận hành khởi tạo ít nhất hai quản trị viên bằng `python app.py create-admin`. Quản trị viên hệ thống lập đề nghị cấp tài khoản nghiệp vụ. Có thể ủy quyền thêm quyền **Quản lý tài khoản tại cơ quan** cho một cán bộ trong cơ quan cụ thể; quyền này được cấp hoặc thu hồi bằng đề nghị thay đổi tài khoản và phải do quản trị viên hệ thống khác duyệt. Người quản lý cơ quan chỉ xem và đề nghị thay đổi tài khoản cùng phạm vi, không tự duyệt và không được xem hồ sơ công dân.
- Quyền cán bộ hết hiệu lực ngoài khoảng ngày được duyệt. Hồ sơ phải có phạm vi cơ quan tiếp nhận (`agencyScope`) khớp với phạm vi tài khoản; tài khoản không được xem hồ sơ khác cơ quan. Mật khẩu khởi tạo cần được bàn giao qua kênh nội bộ.
- Tài khoản quản trị hệ thống chỉ quản lý tài khoản, không được đọc chi tiết, tải tệp hoặc xuất danh sách hồ sơ công dân. Mục **Tài khoản cán bộ** lọc, in và xuất CSV danh sách tài khoản theo cơ quan, không chứa mật khẩu. Quản lý cơ quan bị giới hạn theo cơ quan được giao và chỉ có thể lập đề nghị cấp mới hoặc thay đổi; quản trị viên hệ thống duyệt độc lập. Đổi quyền được ghi lịch sử trước/sau và thu hồi phiên cũ. Thay đổi tài khoản quản trị cần một quản trị viên thứ ba; máy chủ ngăn thu hồi quản trị viên cuối cùng còn hiệu lực.
- Cán bộ nghiệp vụ có thể lọc, in và xuất CSV danh sách hồ sơ mà vai trò và phạm vi cơ quan cho phép. Quản trị viên hệ thống chỉ xem báo cáo tổng hợp theo cơ quan/trạng thái/kỳ, không xem danh sách hồ sơ cá nhân. Báo cáo này là số liệu vận hành nội bộ; không tự tạo Quốc hiệu, tiêu ngữ, chữ ký, dấu hoặc mẫu báo cáo nhà nước. Thông tư 09/2026/TT-BTP quy định báo cáo công tác kiểm soát thủ tục hành chính; phần mềm chưa kết nối nền tảng báo cáo của Bộ Tư pháp và không giả lập biểu mẫu pháp định.
- Mật khẩu cán bộ được băm PBKDF2-HMAC-SHA256; phiên dùng cookie HttpOnly và mã CSRF. API đăng ký công dân cũ bị đóng; phiên công dân cũ không được dùng để vào bàn cán bộ.
- Khi đặt sau HTTPS reverse proxy, bật `HANOI_COOKIE_SECURE=1`; chỉ tin forwarded headers từ proxy do đơn vị vận hành quản lý.

## Phạm vi dữ liệu và tích hợp

- Danh mục hiện lấy từ tài liệu nghiên cứu đi kèm, chưa phải nguồn đồng bộ trực tiếp hay danh mục đã được cơ quan nghiệp vụ xác nhận. Báo cáo thiết kế 101 kịch bản kiểm thử (50 trọng tâm, 20 mở rộng, 31 chức năng); các kịch bản chưa được chạy trên hệ thống chính phủ. Đã xác nhận công khai một tuyến: mã 2.000908, Hà Nội → Phường Tây Hồ → UBND phường Tây Hồ. Tuyến đó không được áp dụng mặc định cho địa bàn khác.
- Bàn cán bộ hiển thị 2.075 thủ tục tham chiếu, danh mục lĩnh vực và toàn bộ thủ tục thuộc từng lĩnh vực. Quản trị viên có thể xem chi tiết, sửa mã/tên/mức dịch vụ/cơ quan/lĩnh vực, đổi tên lĩnh vực và chuyển thủ tục theo nhóm; các lần sửa ghi phiên bản và nhật ký. Nguồn HTTPS chính thức và ngày đối chiếu chỉ được lưu khi thực sự đã kiểm tra; sửa nội bộ không có nguồn vẫn bị đánh dấu cần xác minh. Bản sửa không tự được coi là thông tin chính thức và không đồng bộ ngược lên Cổng quốc gia. Nhóm bản ghi thiếu lĩnh vực được giữ thành “Chưa phân loại” để không che giấu dữ liệu nguồn còn thiếu.
- Trang **Kết nối dịch vụ** đọc trạng thái API/SQLite và số liệu hiện lưu trong ứng dụng: danh mục thủ tục, hồ sơ, tin công khai và hàng chờ. Bộ cài đặt khởi tạo 17 hồ sơ tình huống mô phỏng được gắn nhãn và tách khỏi hồ sơ phát sinh thật; dữ liệu này giúp kiểm tra bảng điều hành, phân quyền theo cơ quan, quy trình, nhật ký và báo cáo. Tích hợp với Cổng Dịch vụ công quốc gia, ký số, thanh toán và thông báo vẫn chưa kết nối cho tới khi có API, tài khoản, hợp đồng và quy trình được cơ quan/nhà cung cấp cấp.
- Báo cáo vận hành có bộ lọc ngày theo dạng `dd/mm/yyyy`; mỗi báo cáo phân biệt số tình huống mô phỏng với số hồ sơ phát sinh thật trong ứng dụng. Dữ liệu mô phỏng không được coi là số liệu chính thức. Báo cáo và CSV hiện có là số liệu nội bộ, không phải biểu mẫu pháp định.
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
