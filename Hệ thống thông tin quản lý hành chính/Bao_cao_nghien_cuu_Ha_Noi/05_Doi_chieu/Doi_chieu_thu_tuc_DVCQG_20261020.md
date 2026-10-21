# Đối chiếu thủ tục và phạm vi ứng dụng ngày 20 tháng 10 năm 2026

## Kết luận

Tên đề tài thống nhất là **Xây dựng hệ thống thông tin quản lý tiếp nhận và giải quyết thủ tục hành chính theo cơ chế một cửa tại thành phố Hà Nội**. Dự án xây dựng phần mềm hỗ trợ người dân nộp và theo dõi hồ sơ hành chính; hỗ trợ cán bộ tiếp nhận, phân công, thụ lý, phê duyệt và trả kết quả; đồng thời giúp lãnh đạo giám sát tiến độ, thời hạn và trách nhiệm xử lý theo từng cơ quan.

Ứng dụng mở tiếp nhận cho **02 thủ tục**, mã `2.000908` và `1.004237`. Chưa đủ căn cứ kết luận toàn bộ 2.075 thủ tục đã đáp ứng quy trình thực tế. Bản công bố công khai cung cấp thông tin nộp hồ sơ; nó không cho biết đầy đủ cấu hình tác nghiệp phía sau tài khoản cán bộ.

## Phạm vi kiểm tra và nguồn

Đã đối chiếu 2,075 dòng danh mục của API ứng dụng với dữ liệu DVCQG đã lưu: 1,549 dòng có bản công bố chi tiết, 526 dòng chưa có bản chi tiết tương ứng. Kết quả từng dòng nằm trong [bảng đối chiếu CSV](Doi_chieu_danh_muc_DVCQG_20261020.csv). Có 592 tên trùng nguyên văn, 638 tên chỉ khác sau khi bỏ tiền tố “Thủ tục” và chuẩn hóa dấu câu; 319 tên khác cần rà soát. So sánh tên không thay thế kiểm tra hiệu lực, thẩm quyền hoặc toàn bộ nội dung thủ tục.

Tệp `procedure_forms.json` có 1,429 cấu hình: 02 tờ khai tương tác đã rà soát và 1,427 bản chỉ có danh sách giấy tờ tham chiếu. Không sinh trường kê khai từ tên hay lĩnh vực. Số cấu hình biểu mẫu, số bản công bố và số thủ tục được tiếp nhận là ba số khác nhau.

Ngày 20/10/2026, truy cập trực tiếp hai trang UUID và API công khai không lấy được dữ liệu JSON hợp lệ. Kết quả đối chiếu mới sử dụng nội dung nguồn chính thức được công cụ tìm kiếm lập chỉ mục, cùng bản nguồn đã lưu. Không ghi đè ngày tải bản công bố thành ngày kiểm tra mới; chưa xác nhận bản đang hiển thị sau đăng nhập hoặc mọi thay đổi mới trên cổng.

- [Cấp bản sao từ sổ gốc trên DVCQG](https://dichvucong.gov.vn/p/home/dvc-tthc-thu-tuc-hanh-chinh-chi-tiet.html?ma_thu_tuc=2989&open_popup=1).
- [Khai thác dữ liệu tài nguyên và môi trường trên DVCQG](https://vpcp.dichvucong.gov.vn/p/home/dvc-tthc-thu-tuc-hanh-chinh-chi-tiet.html?ma_thu_tuc=6022).
- [Quy trình Hà Nội tại Quyết định 663, trang 65–69](https://datafiles.hanoi.gov.vn/gov-hni/6244/VanBan/2026/5/13/PLQDPVHCC-663-2026.pdf). Đối chiếu bản lưu trong thư mục nguồn; chưa tải lại thành công ngày 20/10.
- [Quyết định 2273 của Hà Nội](https://datafiles.hanoi.gov.vn/gov-hni/6244/VanBan/2026/1/5/QDPVHCC-2273-2025.pdf). Chưa tải lại thành công ngày 20/10.

## Thủ tục 2.000908 cấp bản sao từ sổ gốc

| Nội dung | Nguồn công bố | Ứng dụng hiện tại | Đánh giá |
| --- | --- | --- | --- |
| Cơ quan | Cơ quan, tổ chức đang quản lý sổ gốc | Chỉ mở tại UBND phường, xã có tài khoản tiếp nhận; cán bộ phải kiểm tra nơi lưu sổ | Phạm vi triển khai hẹp hơn công bố toàn quốc; có tài khoản không chứng minh đơn vị giữ mọi sổ |
| Chủ thể và giấy tờ | Giấy tờ định danh; giấy tờ đại diện hoặc quan hệ theo trường hợp | Kê khai tư cách, đính kèm giấy tờ theo điều kiện | Có nhánh dữ liệu; kiểm tra giá trị giấy tờ vẫn do cán bộ thực hiện |
| Kiểm tra | Căn cứ sổ gốc, trả lời có lý do nếu không có sổ hoặc không có thông tin | Lưu kết luận, tham chiếu sổ và căn cứ; chặn trình khi chưa kiểm tra, chặn duyệt cấp khi kết luận không phù hợp | Đã có bước kiểm soát trong phần mềm; chưa tra sổ qua hệ thống chuyên ngành |
| Thời hạn | Trong ngày nhận đủ hồ sơ; sau 15 giờ chuyển sang ngày làm việc tiếp theo | Chính sách SAME_DAY và lịch làm việc riêng | Phù hợp nguồn diễn giải; bản JSON đã lưu hiển thị 1 ngày và thiếu diễn giải, cần cập nhật nguồn khi lấy lại được |
| Khoản thu | Nguồn quy trình cấp xã không thu phí; cước gửi riêng | Không cho tạo khoản thu hành chính ở luồng này | Phù hợp phạm vi đã đối chiếu |
| Kết quả | Bản sao đúng nội dung sổ gốc | Dự thảo, duyệt, ký nội bộ, phát hành và lưu chứng cứ giao | Chưa có chứng thư công vụ và bản sao được cơ quan nhà nước phát hành |

Không tự miễn giấy tờ bằng dữ liệu dân cư hoặc hộ tịch khi ứng dụng chưa truy cập được nguồn đó. Các trường điện tử là cấu trúc nhập liệu của dự án, không phải mẫu tờ khai điện tử do Cổng quốc gia cấp cho dự án. Trực tuyến và tiếp nhận trực tiếp đã có thao tác; luồng bưu chính hiện ghi nhận kênh trả và chứng cứ thủ công, chưa kết nối đơn vị chuyển phát.

## Thủ tục 1.004237 khai thác dữ liệu tài nguyên và môi trường cấp tỉnh

| Nội dung | Nguồn công bố | Ứng dụng hiện tại | Đánh giá |
| --- | --- | --- | --- |
| Cơ quan | Sở Nông nghiệp và Môi trường | Máy chủ chỉ nhận tại Sở Nông nghiệp và Môi trường Hà Nội | Khớp cơ quan trong phạm vi triển khai |
| Phiếu yêu cầu | Mẫu 02 hoặc Mẫu 03; chữ ký, xác nhận theo đối tượng | Phân nhánh tổ chức, cá nhân trong nước, cá nhân nước ngoài; tải phiếu đúng nhánh | Hỗ trợ nhập liệu và lưu phiếu; chưa xác thực chữ ký ngoài |
| Thẩm tra | Kiểm tra yêu cầu, khả năng cung cấp và nghĩa vụ tài chính | Bắt buộc ghi kết luận, phạm vi dữ liệu, nghĩa vụ và căn cứ trước khi trình | Có kiểm soát riêng theo thủ tục |
| Mốc 05 ngày | Kiểm tra và thông báo nghĩa vụ tài chính nếu phát sinh | Mốc trung gian riêng; không gán thành hạn giao dữ liệu | Phù hợp phần diễn giải nguồn được lập chỉ mục; JSON đã lưu thiếu diễn giải này |
| Thu và cung cấp | Thông báo khoản thu theo căn cứ; cung cấp dữ liệu sau hoàn thành nghĩa vụ | Có nhánh không thu hoặc có thu; chặn ký và phát hành khi chưa đối soát hoặc miễn có căn cứ | Đã kiểm soát trình tự cục bộ; chưa có bảng giá đầy đủ, thanh toán thật hoặc nguồn dữ liệu chuyên ngành |
| Từ chối và tạm ngừng | Trả lời có lý do; công khai trước 07 ngày làm việc khi chủ động tạm ngừng dịch vụ mạng, trừ bất khả kháng | Ghi lý do không đủ điều kiện; chưa có lịch công bố tạm ngừng dịch vụ chuyên biệt | Còn thiếu phần vận hành dịch vụ công khai |

## Quy trình dùng chung và quyền truy cập

Tiếp nhận, phân công, thụ lý, duyệt, ký, phát hành và giao kết quả là khung tác nghiệp của ứng dụng. Mỗi thủ tục bổ sung điều kiện, chứng cứ, khoản thu, cơ quan và chính sách hạn. Chưa có bộ máy tùy biến mọi tuyến liên cơ quan, nhiều cấp duyệt hoặc nhiệm vụ song song; không áp dụng hai luồng hiện có cho tất cả danh mục.

Mỗi hồ sơ mới lưu bản chụp cấu hình quy trình và phiên bản tờ khai. Tài khoản nghiệp vụ chỉ thấy hồ sơ cùng cơ quan cụ thể; chuyên viên chỉ xử lý hồ sơ được giao. “Toàn thành phố” không có tác dụng xem mọi hồ sơ. Quản trị viên chỉ quản lý và xem tổng hợp, không đọc chi tiết, tệp hoặc xuất hồ sơ cá nhân. Hồ sơ cũ thiếu cấu hình được nhận diện riêng; không tự tiếp tục quy trình chưa được xác định.

## Công việc tiếp theo

1. Lấy lại bản công bố đang hiển thị cho đúng cơ quan Hà Nội, giữ bản gốc và ghi ngày tải; xử lý chênh lệch số ngày, quyết định công bố và tên theo từng nguồn.
2. Cơ quan nghiệp vụ xác nhận tuyến phân công, người ký, nhánh từ chối, bổ sung và cách tính hạn. Chỉ mở thủ tục mới sau khi có biểu mẫu tương tác, cấu hình và ca kiểm tra riêng.
3. Hoàn thiện nguồn dữ liệu chuyên ngành, nghĩa vụ tài chính theo loại dữ liệu và thông báo tạm ngừng dịch vụ. Kết nối định danh, chữ ký, thanh toán và chuyển phát khi có quyền truy cập.
4. Chạy nghiệm thu nghiệp vụ với đơn vị sử dụng. Kết quả 46 kiểm thử hồi quy trên cơ sở dữ liệu tạm là bằng chứng của phần mềm học phần, chưa phải nghiệm thu hệ thống nhà nước.
