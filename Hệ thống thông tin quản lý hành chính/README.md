# Xây dựng hệ thống thông tin quản lý tiếp nhận và giải quyết thủ tục hành chính theo cơ chế một cửa tại thành phố Hà Nội

Phần mềm tại thư mục này là ứng dụng tác nghiệp chạy cục bộ, có máy chủ, cơ sở dữ liệu và bàn cán bộ đăng nhập. Báo cáo trong `Bao_cao_nghien_cuu_Ha_Noi` ghi lại phân tích, thiết kế, giới hạn đã xác minh và các luồng đã hiện thực; tài liệu đó không cấp quyền truy cập vào hạ tầng của Hà Nội.

Báo cáo chính: [Báo cáo xây dựng hệ thống quản lý tiếp nhận và giải quyết thủ tục hành chính](Bao_cao_nghien_cuu_Ha_Noi/04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx).

Bộ hồ sơ gồm báo cáo phân tích, danh sách hình/bảng, từ viết tắt, nguồn tham khảo, tài liệu mô hình, ảnh giao diện ứng dụng và thư viện hướng dẫn. Cổng người dân có trang chủ, tin lấy từ dữ liệu đã xuất bản, danh mục và chi tiết thủ tục, lập hồ sơ, tra cứu bằng mã/khóa riêng, gửi bổ sung và đánh giá hồ sơ đã kết thúc. `/huong-dan` có hướng dẫn thao tác riêng cho người dân/tổ chức và cán bộ.

Các tệp học tập 230926, bài viết `.md` và mẫu trình chiếu APAG được giữ nguyên trong kho tài liệu.

## Chạy hệ thống

- Cần Python 3.10+ và Node.js 20.19+.
- Nhấp đúp `MO_HE_THONG.bat` để khởi động hệ thống và tự mở trình duyệt khi máy chủ sẵn sàng. Nếu hệ thống đã chạy, tệp này mở thẳng trang chủ. Có thể dùng `run.bat` để chạy thủ công.
- Địa chỉ hệ thống: `http://127.0.0.1:8766`.
- Để phát triển giao diện: giữ máy chủ `python app.py` chạy, sau đó chạy `npm run dev` trong `frontend/`; Vite sử dụng cổng `5173` và chuyển `/api` tới máy chủ Python.
- Dữ liệu ứng dụng lưu tại `data/hanoi-services.sqlite3`. Cơ sở dữ liệu có 705 tài khoản cùng hồ sơ thực hành và hồ sơ phát sinh trong ứng dụng: 79 tài khoản gốc và 626 tài khoản mới cho UBND 126 phường, xã. Mật khẩu ban đầu của tài khoản UBND phường, xã là `123`, không buộc đổi ở lần đăng nhập đầu. Xem [danh sách tài khoản phường, xã](TAI_KHOAN_UBND_CAP_XA_HANOI_2026.md), [danh sách 79 tài khoản gốc](TAI_KHOAN_SAU_KHOI_PHUC_20261018.md) và [danh sách phân quyền cốt lõi](DANH_SACH_TAI_KHOAN_DUOC_PHAN_QUYEN.md). Lệnh cấp tài khoản có thể chạy lại an toàn bằng `python scripts/provision_hanoi_commune_accounts.py`; tài khoản trùng email được giữ nguyên.

## Tài khoản và phân quyền

- Trong bàn cán bộ, nhấp tên người dùng ở góc trên bên phải để mở **Tài khoản cá nhân**: xem vai trò, cơ quan, hiệu lực, căn cứ duyệt; cập nhật điện thoại bằng mật khẩu hiện tại; đổi mật khẩu; xem số phiên và kết thúc các phiên khác. Nút **Đăng xuất** nằm ở cuối thanh bên.
- Các giai đoạn trên Tổng quan điều hành, chỉ số và dòng phân bố ở Giám sát quy trình có thể nhấp để mở hộp xử lý với trạng thái, cơ quan, người phụ trách hoặc thời hạn tương ứng. Trong Báo cáo vận hành, chọn **Mở hồ sơ** ở dòng tổng hợp để xem danh sách chi tiết với cùng cơ quan/thủ tục/trạng thái và khoảng ngày.
- Phê duyệt tài khoản và xác minh email được hiển thị riêng. Ứng dụng chưa gửi mã hoặc liên kết xác minh email; API không coi cờ xác minh cũ là bằng chứng sở hữu email. Tài khoản quản trị mới khởi tạo cũng không tự được đánh dấu đã xác minh email.
- Người dân không phải tạo tài khoản ứng dụng. Khi gửi hồ sơ trong ứng dụng, người nộp nhận mã hồ sơ; khóa tra cứu do máy chủ tạo riêng và lưu mã hóa trong kho khóa, đồng thời lưu mã băm để kiểm tra. Cán bộ tiếp nhận hoặc trả kết quả đúng phạm vi được xem, sao chép và cấp lại khóa trong chi tiết hồ sơ; thao tác ghi nhật ký nội bộ. Khóa không nằm trong API danh sách hay phản hồi gửi hồ sơ. Khóa dùng để xem lịch sử và gửi bổ sung, vì vậy cần cất giữ an toàn. Đây là luồng cục bộ của ứng dụng, chưa liên thông hay thay thế giao dịch chính thức trên [Cổng Dịch vụ công quốc gia](https://dichvucong.gov.vn/).
- Cán bộ đăng nhập tại `/staff` (mật khẩu mặc định của các tài khoản mẫu là `123`); không có đăng ký công khai. Người vận hành khởi tạo ít nhất hai quản trị viên bằng `python app.py create-admin`. Quản trị viên hệ thống lập đề nghị cấp tài khoản nghiệp vụ. Có thể ủy quyền thêm quyền **Quản lý tài khoản tại cơ quan** cho một cán bộ trong cơ quan cụ thể; quyền này được cấp hoặc thu hồi bằng đề nghị thay đổi tài khoản và phải do quản trị viên hệ thống khác duyệt. Người quản lý cơ quan chỉ xem và đề nghị thay đổi tài khoản cùng phạm vi, không tự duyệt và không được xem hồ sơ công dân.
- Quyền cán bộ hết hiệu lực ngoài khoảng ngày được duyệt. Hồ sơ phải có phạm vi cơ quan tiếp nhận (`agencyScope`) khớp với phạm vi tài khoản (đã chuẩn hóa hậu tố địa danh để đồng bộ giữa danh mục và tài khoản); tài khoản không được xem hồ sơ khác cơ quan.
- Tài khoản quản trị hệ thống chỉ quản lý tài khoản, không được đọc chi tiết, tải tệp hoặc xuất danh sách hồ sơ công dân. Mục **Tài khoản cán bộ** lọc, in và xuất CSV danh sách tài khoản theo cơ quan, không chứa mật khẩu. Quản lý cơ quan bị giới hạn theo cơ quan được giao và chỉ có thể lập đề nghị cấp mới hoặc thay đổi; quản trị viên hệ thống duyệt độc lập. Đổi quyền được ghi lịch sử trước/sau và thu hồi phiên cũ. Thay đổi tài khoản quản trị cần một quản trị viên thứ ba; máy chủ ngăn thu hồi quản trị viên cuối cùng còn hiệu lực.
- Cán bộ nghiệp vụ có thể lọc, in và xuất CSV danh sách hồ sơ mà vai trò và phạm vi cơ quan cho phép, đồng thời in trực tiếp các phiếu nghiệp vụ theo cơ chế một cửa (**Mẫu 01**: Phiếu tiếp nhận và hẹn trả kết quả; **Mẫu 02**: Phiếu yêu cầu bổ sung, hoàn thiện hồ sơ; **Mẫu 03**: Phiếu từ chối giải quyết hồ sơ; **Mẫu 06**: Thông báo dừng thực hiện thủ tục). Quản trị viên hệ thống chỉ xem báo cáo tổng hợp theo cơ quan/trạng thái/kỳ, không xem danh sách hồ sơ cá nhân. Báo cáo này là số liệu vận hành nội bộ; không tự tạo Quốc hiệu, tiêu ngữ, chữ ký, dấu hoặc mẫu báo cáo nhà nước. Thông tư 09/2026/TT-BTP quy định báo cáo công tác kiểm soát thủ tục hành chính; phần mềm chưa kết nối nền tảng báo cáo của Bộ Tư pháp và không giả lập biểu mẫu pháp định.
- Mật khẩu cán bộ được băm PBKDF2-HMAC-SHA256; phiên dùng cookie HttpOnly và mã CSRF. API đăng ký công dân cũ bị đóng; phiên công dân cũ không được dùng để vào bàn cán bộ.
- Khi đặt sau HTTPS reverse proxy, bật `HANOI_COOKIE_SECURE=1`; chỉ tin forwarded headers từ proxy do đơn vị vận hành quản lý.

## Phạm vi dữ liệu và tích hợp

- Danh mục hiện lấy từ tài liệu nghiên cứu đi kèm, chưa phải nguồn đồng bộ trực tiếp hay danh mục đã được cơ quan nghiệp vụ xác nhận. Báo cáo thiết kế 101 kịch bản kiểm thử (50 trọng tâm, 20 mở rộng, 31 chức năng); các kịch bản chưa được chạy trên hệ thống chính phủ. Đã xác nhận công khai một tuyến: mã 2.000908, Hà Nội → Phường Tây Hồ → UBND phường Tây Hồ. Tuyến đó không được áp dụng mặc định cho địa bàn khác.
- Bàn cán bộ hiển thị 2.075 thủ tục tham chiếu, danh mục lĩnh vực và toàn bộ thủ tục thuộc từng lĩnh vực. Quản trị viên có thể xem chi tiết, sửa mã/tên/mức dịch vụ/cơ quan/lĩnh vực, đổi tên lĩnh vực và chuyển thủ tục theo nhóm; các lần sửa ghi phiên bản và nhật ký. Nguồn HTTPS chính thức và ngày đối chiếu chỉ được lưu khi thực sự đã kiểm tra; sửa nội bộ không có nguồn vẫn bị đánh dấu cần xác minh. Bản sửa không tự được coi là thông tin chính thức và không đồng bộ ngược lên Cổng quốc gia. Nhóm bản ghi thiếu lĩnh vực được giữ thành “Chưa phân loại” để không che giấu dữ liệu nguồn còn thiếu.
- Trang **Kết nối dịch vụ** và mục **Quầy một cửa & Lịch hẹn** đọc trạng thái API/SQLite, danh mục thủ tục, hồ sơ, tin, hàng chờ và giao dịch phát sinh cục bộ. Nó cũng có bàn thao tác cho giao dịch thử nghiệm và quyền ký thử nghiệm. Bản sau khôi phục không tự sinh hoặc xóa hồ sơ tình huống khi khởi động. Dữ liệu có sẵn được giữ nguyên; không dùng số lượng hồ sơ của bộ dữ liệu môn học làm số liệu hành chính chính thức.
- Báo cáo vận hành có bộ lọc ngày theo dạng `dd/mm/yyyy`; mỗi báo cáo phân biệt số tình huống mô phỏng với số hồ sơ phát sinh thật trong ứng dụng. Dữ liệu mô phỏng không được coi là số liệu chính thức. Báo cáo và CSV hiện có là số liệu nội bộ, không phải biểu mẫu pháp định.
- Đã chạy thành công 46 bài kiểm tra hồi quy trên cơ sở dữ liệu tạm sau khi bổ sung chính sách quy trình ngày 20/10/2026, gồm quyền CMS, tạo/sửa/xuất bản/lưu trữ tin và nhật ký, cùng API, luồng hồ sơ, tờ khai, giấy tờ, hạn, tiến độ, cấp và thu hồi tài khoản, khóa tra cứu mã hóa. TypeScript, lint và bản dựng frontend đã chạy thành công. Kết quả này không phải chạy đủ 101 kịch bản hoặc nghiệm thu của cơ quan nhà nước.
- Cổng người dân và bàn cán bộ dùng chung hồ sơ trong cơ sở dữ liệu cục bộ. Người dân gửi hồ sơ, xem sự kiện công khai, phản hồi yêu cầu bổ sung và đánh giá sau khi kết thúc; cán bộ tiếp nhận hồ sơ đó trong phạm vi cơ quan và xử lý theo vai trò. Mã tra cứu không phải mã tiếp nhận do cơ quan nhà nước cấp.
- Hiện chưa có kết nối hồ sơ với Cổng Dịch vụ công quốc gia, VNeID, hệ thống của bộ, Hà Nội, ngân hàng hoặc nhà cung cấp chứng thư số. Luồng nộp trực tuyến có 5 bước; tờ khai điện tử và quy trình đã đối chiếu hiện mở cho 02 thủ tục (`2.000908`, `1.004237`), cùng 1.427 cấu hình chỉ có danh sách giấy tờ tham chiếu trong `procedure_forms.json`. Máy chủ chặn nộp nếu chưa có tờ khai đã rà soát khớp phiên bản quy trình và mức dịch vụ phù hợp. Tra cứu tiến độ dựa trên sự kiện đã ghi; thời hạn giải quyết tự động cộng bù số ngày làm việc tạm dừng khi chờ bổ sung và kiểm soát số lần yêu cầu bổ sung theo cấu hình hiện có; cấu hình quy trình phải được đối chiếu theo văn bản hiện hành và quy định chuyên ngành.
- Quy trình tài chính cục bộ: cán bộ tiếp nhận cấu hình một khoản thu với số tiền và căn cứ; người nộp tạo giao dịch rồi xác nhận kết quả thử nghiệm bằng mã hồ sơ/khóa tra cứu; tài khoản `finance` hoặc `leader` trong cùng phạm vi đối soát; đề nghị hoàn chỉ mở với hồ sơ đã dừng/từ chối/không giải quyết hoặc có Thông báo dừng phát hành. Người lập đề nghị không thể tự duyệt. Các trạng thái `PENDING`, `PAID`, `RECONCILED`, `REFUNDED` chỉ là sổ thử nghiệm; không gọi nhà cung cấp và không chuyển tiền.
- Quy trình ký/phát hành cục bộ: quản trị viên cấp hoặc thu hồi quyền ký thử nghiệm cho một tài khoản lãnh đạo đang hiệu lực, ghi căn cứ và lý do. Khi cơ quan có nhiều lãnh đạo, người phê duyệt không tự ký kết quả của chính mình; trường hợp cơ quan chỉ có 01 tài khoản lãnh đạo duy nhất đang hoạt động thì lãnh đạo đó được phép ký số phát hành sau khi đã được cấp quyền ký. Khóa Ed25519 nội bộ ký trên nội dung dự thảo đã duyệt; màn hình kiểm tra chữ ký bằng khóa công khai và SHA-256. Văn thư chỉ có thể phát hành khi chữ ký hợp lệ và khoản thu (nếu cấu hình) đã đối soát hoặc miễn; tiếp đó văn thư hoặc cán bộ tiếp nhận một cửa ghi người nhận, kênh và chứng cứ trả kết quả. Đây không phải chữ ký số công vụ, chứng thư số được cấp phép, quyết định hành chính hoặc dịch vụ thanh toán thật.
- Khóa riêng ký thử nghiệm lưu tại `data/sandbox-signing-key.enc`, được mã hóa bằng vault Fernet hiện có. Sao lưu và bảo vệ `data/lookup-vault.key` cùng cơ sở dữ liệu theo quy trình vận hành; không đưa khóa lên Git. Nếu mất vault, không thể dùng lại khóa đã mã hóa và phải cấp khóa thử nghiệm mới (chữ ký lịch sử vẫn giữ khóa công khai để kiểm tra).
- Trước khi nhận giấy tờ định danh thật, cần cấu hình kết nối định danh và hồ sơ từ hệ thống thật, HTTPS, danh mục cơ quan/phạm vi chuẩn, chính sách lưu trữ, sao lưu, nhật ký truy cập, kiểm thử bảo mật và nghiệm thu nghiệp vụ trên hạ tầng được phê duyệt.

## Công nghệ

- Frontend: React, TypeScript, Vite.
- Backend: Python, HTTP API và SQLite cho cài đặt cục bộ.
- Tệp cấu hình ngày nghỉ: `working_calendar.json` (đã cấu hình lịch nghỉ lễ năm 2026); đơn vị vận hành cập nhật ngày lễ và ngày làm bù theo từng năm.

## Cài đặt kho khóa tra cứu

Chạy `python -m pip install -r requirements.txt` trước khi chạy máy chủ. Khóa tra cứu được mã hóa bằng Fernet; khóa mã hóa lưu tại `data/lookup-vault.key`, tách khỏi cơ sở dữ liệu. Sao lưu kho khóa cùng cơ sở dữ liệu vào nơi có quyền truy cập phù hợp; không đưa tệp khóa lên Git. Mất tệp này không thể giải mã khóa đã lưu. Hồ sơ cũ chỉ có mã băm cần được cán bộ cấp lại khóa.

Trang chủ đọc tin đã xuất bản từ cơ sở dữ liệu. Quản trị viên hệ thống vào bàn cán bộ, mục **Tin tức cổng thông tin**, để soạn bản nháp, biên tập, chọn ảnh có sẵn, gắn nguồn HTTPS `.gov.vn`, đánh dấu nổi bật, xuất bản, lưu trữ hoặc khôi phục. Hệ thống kiểm tra quyền, phiên bản dữ liệu và ghi lịch sử biên tập; người dân chỉ thấy tin đã xuất bản. Các ảnh và bài viết tham chiếu hiện có được nạp một lần khi cơ sở dữ liệu tin còn trống; hệ thống không tự đồng bộ nội dung mới từ trang Trung tâm. Nguồn ảnh ở `frontend/public/images/SOURCES.md`.

## Các phần bổ sung và hoàn thiện ngày 18/10/2026

- Trang **Lịch hẹn & phản ánh** tại `/tien-ich` có các chức năng đặt lịch, gửi phản ánh và tra cứu kết quả; liên kết mở nằm trên thanh điều hướng trang chủ. Người gửi giữ mã theo dõi (hỗ trợ cả tiền tố `PA-` và `PAKN-`) cùng số điện thoại đã khai để tra cứu lịch hẹn (kèm số thứ tự quầy) hoặc nội dung trả lời. Lịch hẹn không thay thế việc tiếp nhận hồ sơ.
- Cán bộ tiếp nhận và lãnh đạo vào **Quầy một cửa & Lịch hẹn** (hoặc **Kết nối dịch vụ**) để tiếp nhận trực tiếp tại quầy, xử lý lịch hẹn và trả lời phản ánh theo phạm vi cơ quan. Quản trị hệ thống chỉ xem số liệu tổng hợp, không lấy thông tin liên hệ người nộp qua API bàn dịch vụ.
- Cán bộ tiếp nhận lập hồ sơ tại quầy, có thể mở ngay hồ sơ vừa tạo trong Hộp xử lý để in **Mẫu 01**, xem/cấp khóa tra cứu, bổ sung tệp quét số hóa, nhận hồ sơ bổ sung tại quầy và trả kết quả cho công dân.
- Người nộp khai hình thức nộp tiền và mã giao dịch/số biên lai. Cán bộ tài chính hoặc lãnh đạo đơn vị đối chiếu và nhập tham chiếu chứng từ. Duyệt đề nghị hoàn và ghi nhận chứng từ thực hiện hoàn là hai bước riêng; hệ thống không tự chuyển tiền.
- Lịch hẹn mới giới hạn 10 lịch mỗi cơ quan/khung giờ, trong 30 ngày tới và theo lịch ngày làm việc đã cấu hình. Đây là cấu hình vận hành của dự án, không phải định mức của cơ quan nhà nước.
- Nguồn mới gồm `workflow_extensions.py`, `frontend/src/AdministrativeServices.tsx` và `tests/test_recovered_workflows.py`.
- Kết quả lịch sử ngày 18/10: 31/31 kiểm thử đạt; TypeScript/Vite build (`frontend/dist`) đã được đồng bộ đầy đủ với mã nguồn.


## Trang chi tiết thủ tục (19/10/2026)

Mở **Danh mục thủ tục**, chọn một thủ tục để đến `/thu-tuc/<mã thủ tục>`. Các liên kết cũ dạng `/thu-tuc?code=...` vẫn mở được cùng trang chi tiết. Trang có thông tin công bố, trình tự, thời hạn và phí theo phương thức nộp, thành phần hồ sơ theo từng trường hợp, mẫu đơn gốc, căn cứ pháp lý, cơ quan thực hiện, điều kiện và kết quả giải quyết.

Nội dung được lấy từ 1.549 bản ghi chính thức đã đối chiếu với Cổng Dịch vụ công quốc gia; bản ghi 1.014677 được lấy lại ngày 19/10/2026. Ngày đối chiếu và liên kết nguồn hiện ngay trên trang. Các thủ tục chưa có bản công bố chi tiết được giữ ở mức thông tin đã có; không tự điền thời hạn, khoản thu, điều kiện hay căn cứ pháp lý còn thiếu.

Người dùng chọn trường hợp hồ sơ và cơ quan tại Hà Nội, sau đó bấm **Nộp hồ sơ**. Mã thủ tục, cơ quan và trường hợp đã chọn được chuyển sang trang nộp đang có. Danh sách cơ quan dùng chung với bước đầu của trang nộp và chỉ cho chọn đơn vị có bộ phận tiếp nhận. Nút **In / Lưu PDF** dùng khổ A4 dọc; bảng chuyển thành từng khối trên điện thoại.

Mẫu đơn được tải trực tiếp từ dịch vụ tệp công khai của Cổng quốc gia qua API `/api/procedures/<code>/templates/<attachmentId>`. Máy chủ kiểm tra tệp có thuộc đúng bản công bố của thủ tục, giới hạn dung lượng 16 MB và không gửi dữ liệu người nộp đến nguồn ngoài. Khi nguồn tệp không phản hồi, trang báo lỗi và vẫn có liên kết mở bản công bố gốc.

Nguồn trình bày: `procedure_details.py`, `frontend/src/CitizenProcedureDetail.tsx`, `frontend/src/ProcedureDetail.css`. Bản dữ liệu công bố đi kèm mã nguồn ở `resources/official_procedure_details.json.gz` để hệ thống vẫn mở được chi tiết khi chuyển máy và chưa có thư mục `data`. Lệnh `python tools/sync_official_procedure_forms.py --write` cập nhật lại bản nguồn và gói dữ liệu công bố; cần khởi động lại máy chủ sau khi đồng bộ. Đây là bản dữ liệu theo thời điểm đối chiếu, chưa phải đồng bộ tự động theo thời gian thực.


Trang **Danh mục thủ tục** trong bàn cán bộ hiển thị bảng tra cứu toàn chiều rộng, với mã, tên, mức dịch vụ, cơ quan và tình trạng dữ liệu. Chọn thủ tục để mở màn chi tiết trong bàn cán bộ; nội dung công bố và chức năng tải mẫu dùng chung với trang công dân. Cấu hình nội bộ được hiển thị riêng, kèm chức năng chỉnh sửa và lịch sử theo quyền quản trị. Nút **Về danh sách thủ tục** giữ bộ lọc và trang kết quả đã chọn. Quản lý lĩnh vực, tạo nhóm và chuyển thủ tục vẫn có trong khu **Quản lý lĩnh vực**.

Giao diện **Danh mục thủ tục** trong bàn cán bộ được cập nhật ngày 19/10/2026: danh sách có bộ lọc và trạng thái dữ liệu; trang chi tiết dùng chung nội dung công bố với cổng công dân, còn cấu hình nội bộ, lịch sử và quyền sửa được tách riêng. Báo cáo Word, mô tả thiết kế, cẩm nang vận hành và danh mục ảnh đã được đồng bộ với màn hình này.


## Quy trình theo thủ tục và phạm vi cơ quan (20/10/2026)

Mục đích dự án: xây dựng hệ thống thông tin quản lý tiếp nhận và giải quyết thủ tục hành chính theo cơ chế một cửa tại thành phố Hà Nội, hỗ trợ người dân nộp/theo dõi hồ sơ và cán bộ xử lý, giám sát theo cơ quan.

- Cấu hình chạy thật trong ứng dụng nằm ở `procedure_workflows.json` và `procedure_workflows.py`. Hiện có 02 luồng đã đối chiếu nguồn. Danh mục 2.075 thủ tục không đồng nghĩa tất cả đã được mở nộp.
- Đã bỏ toàn bộ hàm suy đoán trường tờ khai và giấy tờ theo tên/lĩnh vực. Thủ tục chỉ mở khi đồng thời có tờ khai được đánh dấu đã rà soát, phiên bản tờ khai khớp phiên bản quy trình và mức dịch vụ cho phép. Bản nguồn chỉ có danh sách giấy tờ vẫn dùng để tra cứu; không tạo biểu mẫu chung để nhận hồ sơ.
- `2.000908`: chuyên viên đối chiếu sổ gốc và quyền yêu cầu, lưu số sổ/trang/bản ghi cùng căn cứ. Không cho trình khi chưa kiểm tra; kết quả không phù hợp không được phê duyệt cấp bản sao. Không tự lập phí hành chính cho luồng này; chi phí bưu chính cần được xử lý theo dịch vụ riêng.
- `1.004237`: có mốc trung gian 05 ngày làm việc để kiểm tra yêu cầu và thông báo nghĩa vụ tài chính. Không gán mốc đó làm hạn trả dữ liệu. Chuyên viên ghi phạm vi dữ liệu, khả năng cung cấp, kết luận nghĩa vụ tài chính và căn cứ; khoản thu chỉ mở sau kết luận có nghĩa vụ. Chặn ký/phát hành khi nghĩa vụ chưa đối soát hoặc miễn có căn cứ.
- Hồ sơ mới (cả trực tuyến và tại quầy) lưu bản chụp cấu hình quy trình. Đổi cấu hình sau này không đổi quy trình của hồ sơ đã lập. Hồ sơ cũ chưa chốt cấu hình được ghi rõ; các hồ sơ chưa có quy trình không thể tiếp tục bằng luồng chung. Hồ sơ đã phát hành vẫn có thể ghi nhận trả; yêu cầu dừng vẫn phải đáp ứng các điều kiện nghiệp vụ.
- Tên `Toàn thành phố` không còn là ký tự đại diện để đọc, phân công hay xử lý hồ sơ. Cả tài khoản và hồ sơ phải khớp cơ quan cụ thể. Chuyên viên chỉ được xử lý hồ sơ được phân công. Quản trị viên giữ quyền quản trị và báo cáo tổng hợp; không có quyền đọc hồ sơ cá nhân.
- Đường cơ quan khi tạo hồ sơ tại quầy và trực tuyến được kiểm tra ở máy chủ. Hồ sơ dữ liệu môi trường chỉ nhận tại Sở Nông nghiệp và Môi trường; hồ sơ bản sao chỉ mở tại UBND phường, xã có bộ phận tiếp nhận trong phạm vi triển khai và phải kiểm tra nơi lưu sổ gốc.

Các bước phân công/duyệt trong cấu hình là cách triển khai tác nghiệp của dự án trên các vai trò đã có. Chưa có căn cứ để tuyên bố đã cấu hình đầy đủ mọi quy trình nội bộ được phê duyệt của Hà Nội; không suy diễn danh sách bước hoặc thời lượng từng khâu từ tên thủ tục. Quy trình liên cơ quan và quy trình nhiều cấp duyệt chỉ được bật khi có nguồn và cấu hình riêng, không dùng cấu hình hai thủ tục hiện có thay thế.

Hướng dẫn trong `/huong-dan`, nút nộp ở danh mục/chi tiết, trình lập hồ sơ và bàn tiếp nhận tại quầy cùng sử dụng trạng thái sẵn sàng do API cung cấp.

Kiểm tra ngày 20/10/2026: 46/46 bài hồi quy đạt trên cơ sở dữ liệu tạm, gồm luồng ký–phát hành–trả kết quả cho cả hai thủ tục và các trường hợp bị chặn. Sau thay đổi cuối ở cấu hình hạn và duyệt quyền, đã chạy lại 23 bài về biểu mẫu/quy trình và 02 bài duyệt quyền, đều đạt. TypeScript/Vite build đạt. Lint không có lỗi, còn các cảnh báo React trong mã hiện có. Đã kiểm tra trên trình duyệt: thủ tục chưa cấu hình bị khóa nút nộp và có lý do; thủ tục bản sao hiển thị 126 UBND phường/xã có tiếp nhận; trang hướng dẫn có nội dung quy trình mới.

## Tài liệu đồng bộ ngày 20/10/2026

Dự án xây dựng phần mềm hỗ trợ người dân nộp và theo dõi hồ sơ hành chính; hỗ trợ cán bộ tiếp nhận, phân công, thụ lý, phê duyệt và trả kết quả; đồng thời giúp lãnh đạo giám sát tiến độ, thời hạn và trách nhiệm xử lý theo từng cơ quan.

Tên đề tài trên bìa, thuộc tính Word, nội dung mở đầu và README được thống nhất như tiêu đề tài liệu này. Bản Word/PDF cập nhật quy trình, phạm vi cơ quan và kết quả kiểm tra; [biên bản đối chiếu thủ tục](Bao_cao_nghien_cuu_Ha_Noi/05_Doi_chieu/Doi_chieu_thu_tuc_DVCQG_20261020.md) nêu rõ mức đáp ứng và phần còn thiếu. [Bảng CSV](Bao_cao_nghien_cuu_Ha_Noi/05_Doi_chieu/Doi_chieu_danh_muc_DVCQG_20261020.csv) có đủ 2.075 dòng, so với bản công bố đã lưu, không phải kết quả xác nhận trực tiếp mới cho toàn bộ cổng quốc gia.
