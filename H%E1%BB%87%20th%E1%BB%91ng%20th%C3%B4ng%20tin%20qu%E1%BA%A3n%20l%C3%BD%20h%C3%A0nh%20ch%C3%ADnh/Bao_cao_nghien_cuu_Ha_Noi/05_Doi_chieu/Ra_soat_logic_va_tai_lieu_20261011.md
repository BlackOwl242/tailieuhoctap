# Rà soát logic phần mềm và đối chiếu hệ thống dịch vụ công Hà Nội

**Ngày rà soát:** 11/10/2026  
**Phạm vi:** mã nguồn hiện có, luồng người dân và bàn cán bộ; trang công khai của Trung tâm Phục vụ hành chính công Hà Nội; hướng dẫn nộp hồ sơ công khai; văn bản một cửa có hiệu lực tại ngày rà soát. Không đăng nhập, gửi hồ sơ, thanh toán hoặc thay đổi dữ liệu trên hệ thống thật.

## Kết luận

Ứng dụng có luồng cục bộ chạy được cho tra cứu danh mục, gửi hai biểu mẫu đã cấu hình, theo dõi bằng mã và khóa, xử lý hồ sơ theo vai trò, CMS tin tức và quản lý tài khoản cán bộ. 2.075 bản ghi danh mục không đồng nghĩa với 2.075 biểu mẫu nộp hồ sơ. Chỉ mã **1.004237** và **2.000908** có cấu hình tiếp nhận; các mã khác phải bị chặn gửi khi chưa có biểu mẫu và thành phần hồ sơ tương ứng.

Đây chưa phải hệ thống giao dịch của Nhà nước. Các khác biệt về VNeID, SMS, tài khoản người dân, dữ liệu liên thông, thanh toán và ký số được ứng dụng công khai là chưa tích hợp. Không được trình bày mã hồ sơ cục bộ như mã có thể tra cứu trên Cổng Dịch vụ công quốc gia.

## Đối chiếu logic và giao diện

| Luồng | Ứng dụng hiện có | Hành vi/căn cứ công khai | Đánh giá |
|---|---|---|---|
| Trang chủ | Cổng thông tin có tin, nhóm dịch vụ, lối vào danh mục, nộp, tra cứu và hướng dẫn | Trang Trung tâm là cổng thông tin; giao dịch TTHC được hướng sang Cổng quốc gia | Phân vai thông tin và giao dịch là hợp lý; cần giữ cảnh báo giao dịch cục bộ không liên thông ở vị trí dễ thấy. |
| Xác thực công dân | Không có tài khoản công dân; khai thông tin hồ sơ và dùng mã/khóa do cán bộ tiếp nhận cung cấp | Hướng dẫn công khai Hà Nội tháng 01/2026 mô tả công dân đăng nhập VNeID, gửi hồ sơ trên Cổng quốc gia, nhận SMS mã hồ sơ và theo dõi qua tài khoản “Dịch vụ công của tôi” hoặc tra cứu mã | **Khác biệt chủ đích theo yêu cầu phạm vi**, nhưng không tương đương hệ thống thật. Cần nêu rõ trước lúc bắt đầu và tại biên nhận; không thu VNeID. |
| Nộp hồ sơ | Năm bước; chưa tạo hồ sơ khi mở URL. Máy chủ kiểm tra biểu mẫu, trường bắt buộc, tệp, cơ quan tiếp nhận và xác nhận cuối | Mỗi TTHC có hồ sơ, cơ quan, hình thức nộp, thời hạn, phí và điều kiện riêng; Hà Nội công bố nhiều quy trình toàn trình và một phần | Luồng bước có kiểm tra nhất quán. Không suy rộng biểu mẫu hai thủ tục sang toàn danh mục. |
| Mã/khóa tra cứu | Mã hiển thị cho người nộp; khóa được lưu mã hóa, cán bộ đúng vai trò có thể xem/cấp lại; lần xem và cấp lại ghi nhật ký | Cổng thật gửi SMS mã; cho phép tra cứu mã hoặc xem danh sách trong tài khoản đã đăng nhập | **Khác biệt chủ đích**, nhưng trao khóa bằng tay không thay thế OTP/SMS hay tài khoản người dân. Cần xác minh chủ thể trước khi cấp khóa và không để khóa xuất hiện trong nhật ký. |
| Tiến độ | Trục trạng thái được tạo từ sự kiện đã ghi; tách tiếp nhận, xử lý, trình duyệt, phát hành và trả kết quả; bổ sung/dừng/từ chối là nhánh riêng | Nghị định 118/2025/NĐ-CP và các sửa đổi, văn bản hướng dẫn 2026 điều chỉnh cơ chế một cửa; quy trình cụ thể phụ thuộc quyết định và phiên bản từng TTHC | Không thấy bước tự đánh dấu hoàn thành chỉ vì đi qua màn hình. Trình tự duyệt cụ thể của Hà Nội không công khai đầy đủ, nên không thể xác nhận sơ đồ nội bộ là cấu hình thật. |
| Bổ sung, từ chối, dừng | Cán bộ ghi lý do; yêu cầu bổ sung tách khỏi từ chối tiếp nhận; dừng cần hồ sơ yêu cầu, kiểm tra điều kiện, Mẫu 06 đã ký và thông tin giao | Thông tư 13/2026/TT-BTP và hướng dẫn của Nghị định 118 quy định biểu mẫu, người có thẩm quyền và chứng cứ giao tương ứng | Nhánh hiện thiết kế thận trọng; chưa kiểm chứng được phân quyền/tuyến ký đang chạy ở Hà Nội. |
| Phí, ký, trả kết quả, tích hợp | Không thu phí giả, không ký giả, không báo đã đồng bộ; hàng chờ là bản ghi cục bộ | Giao dịch thật dùng Cổng quốc gia và các dịch vụ thanh toán/ký, trả kết quả đã được phê duyệt; chính sách lệ phí/bưu chính có điều kiện và theo TTHC | Cảnh báo không liên thông đúng. Không được bật trạng thái “đã thanh toán/đã ký/đã gửi” nếu chưa có xác nhận đối tác. |
| Bàn cán bộ | Tài khoản do quản trị cấp; phân vai/phạm vi, hàng đợi, xử lý, nhật ký, tin tức và tài khoản cá nhân | Giao diện sau đăng nhập, cấu hình quyền, API và nhật ký của hệ thống Hà Nội không công khai | Có thể đánh giá tính nhất quán nội bộ; chưa thể gọi là khớp giao diện hay quy trình nội bộ thật. |

## Điểm tài liệu đã hiệu chỉnh

- Đã sửa câu ở mục 6.4 từng nói ứng dụng “chưa kết nối tài khoản, hồ sơ” thành phân biệt giữa **tài khoản/hồ sơ cục bộ đã triển khai** và **tích hợp với hệ thống Nhà nước chưa có**.
- Đã ghi rõ chỉ hai biểu mẫu **1.004237, 2.000908** được cấu hình. Các thủ tục còn lại chỉ là dữ liệu danh mục tham chiếu.
- Đã mô tả khác biệt VNeID/SMS/tài khoản người dân so với luồng công khai Hà Nội, không khẳng định khớp 100%.
- Đã cập nhật số kiểm thử hồi quy HTTP từ 22 lên 23; bộ kiểm thử Use case 36 chức năng vẫn chưa chạy đầy đủ.

## Thiếu sót và giới hạn còn lại

1. Chưa có xác minh danh tính công dân, tài khoản người dân, SMS/email, VNeID, thanh toán, ký số, kho dữ liệu cá nhân hoặc kết nối hệ thống Nhà nước.
2. Chỉ hai biểu mẫu đang hoạt động; dữ liệu 2.075 thủ tục được đóng theo văn bản nguồn, không tự đồng bộ trạng thái hiệu lực, cơ quan, thời hạn, lệ phí hoặc mức trực tuyến.
3. Quy trình cán bộ sau đăng nhập và cấu hình nội bộ của Hà Nội không công khai; vai trò và bước phê duyệt trong phần mềm là mô hình nghiên cứu, cần được chủ quản nghiệp vụ xác nhận.
4. Các Use case về đối soát, hoàn phí, ký số, liên thông, nộp lưu và nhiều báo cáo là đặc tả thiết kế; không nên đọc chúng như tính năng đã triển khai. Chương 6.4 và 7.2 phân định phạm vi này.
5. Rà soát này không phải đánh giá an toàn thông tin, kiểm thử tải, kiểm thử xâm nhập hay nghiệm thu quy trình cơ quan.

## Bằng chứng và lần kiểm tra

- Backend: bộ `tests/test_app_access.py` và `tests/test_procedure_workflow.py` cần chạy bằng môi trường có `pytest`; lần rà soát này chưa chạy được vì Python trên máy chưa cài pytest. Trước đó biên bản phát triển ghi nhận 23 kiểm thử HTTP đạt trên CSDL tạm; đây không phải kết quả kiểm thử chính phủ.
- Frontend: `npm run build` và `npm run lint` đạt ngày 11/10/2026.
- Máy chủ cục bộ: `/api/health` trả `ok`.
- Quan sát thật: chỉ trang và hướng dẫn công khai, không thực hiện giao dịch thật.

## Nguồn chính

- Trung tâm Phục vụ hành chính công Hà Nội, [Hướng dẫn công dân nộp hồ sơ trực tuyến trên Cổng Dịch vụ công quốc gia](https://ttpvhcc.hanoi.gov.vn/video/huong-dan-cong-dan-nop-ho-so-truc-tuyen-tren-cong-dich-vu-cong-quoc-gia-2850260116085159336.htm), 16/01/2026.
- Trung tâm Phục vụ hành chính công Hà Nội, [Trang chủ](https://ttpvhcc.hanoi.gov.vn/trang-chu).
- Chính phủ, [Nghị định 118/2025/NĐ-CP](https://vanban.chinhphu.vn/?classid=0&docid=213871&pageid=27160), hiệu lực 01/07/2025.
- Chính phủ, [Nghị định 309/2026/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=219100&pageid=27160) và [Nghị định 310/2026/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=219101&pageid=27160), hiệu lực 05/08/2026.
- Bộ Tư pháp, [Thông tư 13/2026/TT-BTP](https://vanban.chinhphu.vn/?docid=219795&pageid=27160) và [Thông tư 14/2026/TT-BTP](https://vanban.chinhphu.vn/?docid=219796&pageid=27160&typegroupid=6), hiệu lực 10/10/2026.
- Trung tâm Phục vụ hành chính công Hà Nội, [Hà Nội triển khai đồng loạt phương án tái cấu trúc 293 thủ tục hành chính từ 01/01/2026](https://ttpvhcc.hanoi.gov.vn/loi-ich-khi-su-dung-dvc-truc-tuyen/ha-noi-trien-khai-dong-loat-phuong-an-tai-cau-truc-293-thu-tuc-hanh-chinh-tu-ngay-01-01-2026-2850260101000751099.htm).
