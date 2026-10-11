# Rà soát logic ứng dụng và đối chiếu tài liệu

**Ngày rà soát:** 11/10/2026  
**Phạm vi:** cổng người dân, bàn cán bộ, tài khoản/phân quyền, nhận và tra cứu hồ sơ, danh mục thủ tục, tin tức, tài liệu bàn giao.  
**Mức kết luận:** ứng dụng cục bộ có luồng chạy được; chưa thể xác nhận tương đương toàn bộ hệ thống tác nghiệp chính thức.

## Kết quả kiểm tra trực tiếp

- Máy chủ cục bộ tại http://127.0.0.1:8766 trả trạng thái sức khỏe ok.
- Đã đăng nhập thử thành công cả 11 tài khoản. API quản trị trả 11 tài khoản đang hoạt động; 9 cán bộ đăng nhập bằng mật khẩu trong danh sách; đã bỏ yêu cầu đổi mật khẩu lần đầu theo đề nghị. Cả 11 email mẫu đều chưa xác minh.
- Hai quản trị viên có thể vào khu vực tài khoản; tài khoản nghiệp vụ có các vai trò tiếp nhận, chuyên viên, lãnh đạo, trả kết quả và tài chính theo phạm vi cơ quan được cấp.
- Danh mục có 2.075 bản ghi tham chiếu, nhưng chỉ thủ tục 1.004237 và 2.000908 có lược đồ biểu mẫu nộp được cấu hình. Máy chủ từ chối mã khác hoặc bản khai sai phiên bản. Thủ tục cung cấp thông tin không được gửi như hồ sơ trực tuyến.
- Mã hồ sơ và khóa tra cứu là dữ liệu của ứng dụng cục bộ. Khóa được bảo vệ trong kho riêng; thao tác xem/cấp lại có kiểm tra vai trò và phạm vi. Đây không phải mã tiếp nhận do cổng nhà nước cấp.
- Tài liệu hiện ghi nhận 23 kiểm tra HTTP hồi quy đạt trên dữ liệu tạm ở lần chạy trước. Lần rà soát này đã xác thực 11 lần đăng nhập và gọi API tài khoản. Không chạy lại toàn bộ bộ kiểm thử Python: môi trường hiện tại không cài pytest. Đã chạy npm run build và npm run lint trong frontend; cả hai hoàn tất thành công.

## Bảng đối chiếu

| Nội dung | Ứng dụng hiện tại | Hệ thống công khai/thực tế đã xác minh | Kết luận và việc tài liệu phải nói rõ |
|---|---|---|---|
| Đăng nhập người dân | Không yêu cầu tài khoản ứng dụng; dùng mã và khóa tra cứu cục bộ. | Hướng dẫn Hà Nội cho Cổng Dịch vụ công quốc gia sử dụng đăng nhập VNeID; người dân có thể tra cứu bằng mã hồ sơ hoặc trong tài khoản. | Khác biệt có chủ ý theo yêu cầu sản phẩm. Không mô tả là xác thực/tra cứu tương đương cổng thật. |
| Thông báo sau nộp | Không gửi SMS/email; mã hiển thị trong luồng của ứng dụng và khóa do cán bộ được phép cấp. | Hướng dẫn Hà Nội nêu mã hồ sơ được gửi tới điện thoại bằng SMS. | Nêu đây là quy ước cục bộ, không giả lập việc đã gửi tin. |
| Cán bộ | Có tài khoản cục bộ, phê duyệt hai người, vai trò, phạm vi cơ quan, thời hạn, mật khẩu đã bàn giao và nhật ký. | Quyền/tài khoản vận hành chính thức không thể kiểm chứng từ trang công khai; ứng dụng không kết nối danh tính cán bộ Hà Nội. | Tài liệu đã phân biệt tài khoản cục bộ; danh sách/mật khẩu bàn giao ở tệp riêng. Không gọi là tài khoản được cơ quan cấp. |
| Tờ khai | Có hai lược đồ cụ thể: 1.004237, 2.000908. | Thành phần và biểu mẫu phụ thuộc từng thủ tục, địa bàn, phiên bản, dữ liệu có thể tái sử dụng và trạng thái xác thực. | 2.075 bản ghi danh mục không có nghĩa là 2.075 thủ tục nộp được. Chỉ quảng bá thao tác nộp cho hai tuyến đã cấu hình; các tuyến khác phải báo rõ chưa sẵn sàng. |
| Trạng thái/tiến độ | Trang tra cứu dựng dòng thời gian từ sự kiện được ghi; nhánh bổ sung, từ chối, dừng và tiếp tục được tách. | Mỗi thủ tục có quy trình điện tử/đơn vị có thẩm quyền riêng; nguồn công khai không cho biết cấu hình nội bộ của mọi hồ sơ. | Mô hình hiện tại là mô phỏng nghiệp vụ cục bộ, không khẳng định tên bước và tuyến phê duyệt khớp mọi thủ tục thật. |
| Thanh toán, ký số, cấp kết quả, liên thông | Không ghi nhận thành công nếu chưa có xác nhận; không có kết nối thực. | Là các dịch vụ/quy trình phụ thuộc thủ tục và hệ thống đối tác. | Giới hạn này được nêu trong README và báo cáo; cần giữ trạng thái khóa cho đến khi có căn cứ tích hợp. |
| Tin cổng | CMS cục bộ cho quản trị viên, lưu nháp/xuất bản/lưu trữ và nhật ký. | Trang tham chiếu công khai có tin tức nhưng không cung cấp thông tin nội bộ về CMS. | Là chức năng thiết kế của phần mềm, không khẳng định sao chép hệ quản trị nội dung chính thức. |
| Quản lý tài khoản theo cơ quan | Có thể giao cờ quyền cho một tài khoản cán bộ qua đề nghị; sau duyệt, người đó xem/lập yêu cầu trong đúng cơ quan; quản trị viên hệ thống duyệt; có in/CSV danh sách tài khoản. Hiện tại chưa tài khoản nào được giao quyền này. | Nguồn Bộ Tư pháp công bố nền tảng KSTTHC đang được xây dựng có phân quyền, cấp tài khoản và biểu mẫu/đề cương báo cáo; không xác nhận cơ cấu quản trị hoặc quyền ở hệ thống Hà Nội. | Tính năng theo cơ quan là năng lực cục bộ mới, không phải mô tả đã xác minh về phân cấp của Hà Nội. Không đổi mật khẩu tài khoản hiện hữu. |
| In/xuất hồ sơ và báo cáo | Cán bộ nghiệp vụ in/CSV danh sách hồ sơ trong phạm vi được máy chủ cấp. Quản trị viên hệ thống chỉ xem số liệu tổng hợp và in/xuất báo cáo vận hành, không đọc danh sách/PII hồ sơ. | Thông tư 09/2026/TT-BTP điều chỉnh chế độ báo cáo công tác kiểm soát TTHC; Bộ Tư pháp nêu nền tảng chuyên ngành cung cấp biểu mẫu, đề cương để kiểm thử/tập huấn. | Tệp và bản in hiện có là bảng kê nội bộ; chưa có mẫu gốc chính thức để kiểm tra định dạng, không tạo Quốc hiệu–tiêu ngữ, tên cơ quan hay thành phần ký. |

## Các điểm dễ gây hiểu nhầm cần giữ đã sửa

1. Câu cũ trong mục mức độ sẵn sàng nói “chưa kết nối tài khoản, hồ sơ” không chính xác vì ứng dụng hiện có tài khoản cán bộ và hồ sơ cục bộ. Đã thay bằng mô tả rõ những gì chạy cục bộ và những tích hợp chưa có.
2. Tài liệu trước có chỗ lệch số kiểm tra 21/22/23. Đã thống nhất thành 23 kiểm tra HTTP hồi quy theo biên bản lần chạy trước; con số này không bao gồm 180 ca Use case và 101 ca kiểm thử tổng hợp.
3. Cần phân biệt số bản ghi thủ tục tham chiếu với số thủ tục có thể lập/nộp hồ sơ. Báo cáo đã ghi rõ hai lược đồ đang hỗ trợ và chặn gửi mã khác.
4. Tài khoản thử nghiệm dùng địa chỉ example.test; email chưa xác minh, mật khẩu cán bộ là mật khẩu khởi tạo dùng trực tiếp trong ứng dụng cục bộ; không buộc đổi lần đầu. Không dùng tài khoản/dữ liệu này tại cổng chính thức.
5. Hướng dẫn cổng chính thức thêm vào tài liệu tham khảo là hướng dẫn của Trung tâm Hà Nội; nguồn mô tả VNeID, SMS và hai cách tra cứu. Đây là đối chiếu luồng công khai, không chứng minh giao diện sau đăng nhập hoặc quy trình nội bộ.

## Hạn chế và bước còn thiếu

- Chưa có tài khoản hoặc quyền khảo sát bàn cán bộ thật, API, hợp đồng tích hợp, dữ liệu nghiệp vụ hay quy trình điện tử nội bộ; các phần đó không thể suy ra chính xác từ ảnh trang công khai.
- Chưa xác minh đầy đủ hiệu lực, biểu mẫu, giấy tờ, phí, thời hạn và tuyến cơ quan của toàn bộ 2.075 thủ tục.
- Chỉ hai thủ tục có cấu hình gửi trong ứng dụng; chưa kiểm thử đủ mọi nhánh thực tế của hai thủ tục với cán bộ nghiệp vụ.
- Chưa chạy lại toàn bộ kiểm thử Python trong lần rà soát này do thiếu pytest. Đăng nhập 11 tài khoản và API quản lý tài khoản đã được xác thực trên máy chủ đang chạy.
- Hệ thống là ứng dụng cục bộ nghiên cứu, không được dùng nhận hoặc giải quyết hồ sơ hành chính thật.

## Rà soát bổ sung: quản lý cơ quan, in/xuất và báo cáo

Trong phiên bản mã nguồn hiện tại, quyền quản lý tài khoản tại cơ quan tách khỏi vai trò quản trị hệ thống. Quản trị viên hệ thống lập đề nghị giao quyền; một quản trị viên khác phê duyệt. Người được giao chỉ thao tác với tài khoản cùng cơ quan, không được tự duyệt, chuyển cơ quan hoặc quản lý tài khoản quản trị. Migration tương thích đã chạy khi khởi động lại máy chủ; cột quyền đã hiện diện trong cơ sở dữ liệu. Tại dữ liệu đã kiểm tra, có 11 tài khoản (2 quản trị viên toàn thành phố, 5 thuộc Sở Nông nghiệp và Môi trường Hà Nội, 4 thuộc UBND phường Tây Hồ) và chưa có người quản lý cơ quan. Không tự chọn một cán bộ để giao quyền thay người dùng.

Danh sách tài khoản có chức năng in bảng nội bộ và CSV theo cơ quan, không chứa mật khẩu. Danh sách hồ sơ do cán bộ nghiệp vụ xem có thể lọc, in và xuất CSV theo phạm vi API; quản trị viên hệ thống không được xuất hoặc xem hồ sơ cá nhân. Quản trị viên có trang tổng hợp số lượng theo cơ quan, trạng thái, thủ tục và khoảng ngày; bản in/CSV được đánh dấu báo cáo vận hành nội bộ. Cơ chế này không thay thế chế độ báo cáo pháp định.

Nguồn chính thức đã tra cứu: Bộ Tư pháp cho biết nền tảng số kiểm soát TTHC đang được xây dựng, có nhóm phân quyền, cấp tài khoản và biểu mẫu/đề cương theo Thông tư 09/2026/TT-BTP để kiểm thử, tập huấn; cơ sở dữ liệu văn bản pháp luật ghi Thông tư 09 quy định chế độ báo cáo kiểm soát TTHC, hiệu lực từ 01/08/2026 [47], [48]. Đây không phải bằng chứng về giao diện hay tài khoản quản trị của Hà Nội. Chưa tải/đối chiếu được bản mẫu gốc từ nguồn phát hành chính thức; dù có bản sao trên một số trang thứ cấp, không dùng các bản đó làm căn cứ dàn trang. Vì vậy không tự dựng mẫu Word/PDF, không gắn Quốc hiệu, tiêu ngữ, tên cơ quan, cỡ chữ/font hoặc khung giấy theo suy đoán. Khi có bản gốc, phải đối chiếu đúng phụ lục, phiên bản, hiệu lực và hướng dẫn lập trước khi phát hành.

Phiên bản giao diện đã `npm run build` thành công; Python và công cụ tạo báo cáo qua kiểm tra biên dịch. Máy chủ cục bộ đã khởi động lại, `/api/health` trả `ok`, migration đã có hiệu lực và số người được giao quản lý cơ quan vẫn là 0. Tài liệu Word đã được sinh lại và gói DOCX qua kiểm tra ZIP/nội dung. Không hoàn tất được render hình ảnh: bộ render của tài liệu cần LibreOffice nhưng máy không có `soffice.exe`; lần xuất qua Microsoft Word COM treo ở thao tác mở tệp và bị dừng. Do đó chưa xác nhận trực quan toàn bộ trang Word sau cập nhật.

## Nguồn công khai

- [Hướng dẫn công dân nộp hồ sơ trực tuyến trên Cổng Dịch vụ công quốc gia — Trung tâm Phục vụ hành chính công Hà Nội](https://ttpvhcc.hanoi.gov.vn/video/huong-dan-cong-dan-nop-ho-so-truc-tuyen-tren-cong-dich-vu-cong-quoc-gia-2850260116085159336.htm)
- [Nghị định 118/2025/NĐ-CP — Cơ chế một cửa và Cổng Dịch vụ công quốc gia](https://vanban.chinhphu.vn/?classid=0&docid=213871&pageid=27160)
- [Nghị định 309/2026/NĐ-CP — sửa đổi Nghị định 118/2025/NĐ-CP](https://vanban.chinhphu.vn/?docid=219100&pageid=27160)
- [Nghị định 310/2026/NĐ-CP — giao dịch thủ tục hành chính trên môi trường điện tử](https://vanban.chinhphu.vn/?classid=1&docid=219101&pageid=27160)
- [Bộ Tư pháp: xây dựng Nền tảng số kiểm soát thủ tục hành chính, có phân quyền, cấp tài khoản và biểu mẫu/đề cương theo Thông tư 09/2026/TT-BTP](https://kstthc.moj.gov.vn/portal/tin-tuc/chi-tiet/bo-tu-phap-huong-toi-nen-tang-kiem-soat-thu-tuc-hanh-chinh-thong-minh-tjcjp0de4e.html)
- [Cơ sở dữ liệu quốc gia về văn bản pháp luật — tra cứu Thông tư 09/2026/TT-BTP](https://vbpl.moj.gov.vn/TW/Pages/home.aspx)
