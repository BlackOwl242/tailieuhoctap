# Hướng dẫn sử dụng hệ thống quản lý tiếp nhận và giải quyết thủ tục hành chính tại Hà Nội

Dự án xây dựng phần mềm hỗ trợ người dân nộp và theo dõi hồ sơ hành chính; hỗ trợ cán bộ tiếp nhận, phân công, thụ lý, phê duyệt và trả kết quả; đồng thời giúp lãnh đạo giám sát tiến độ, thời hạn và trách nhiệm xử lý theo từng cơ quan.

## Bắt đầu theo vai trò

Người dân đăng ký hoặc đăng nhập tại `/dang-nhap`, mở **Thông tin cá nhân** (`/tai-khoan/thong-tin-ca-nhan`) để kiểm tra họ tên, điện thoại và bổ sung ngày sinh, giấy tờ nhận dạng, địa chỉ thường trú, địa chỉ liên hệ. Bấm **Lưu thông tin cá nhân**. Sau đó mở `/thu-tuc`, tìm thủ tục, đọc trang chi tiết và chọn cơ quan được phép. Hai mã được mở là `2.000908` và `1.004237`. Nộp qua năm bước, giữ mã hồ sơ; liên hệ cán bộ tiếp nhận để được cung cấp khóa tra cứu sau kiểm tra chủ hồ sơ. Tra cứu, bổ sung và xem kết quả tại `/tra-cuu-ho-so`.

Cán bộ đăng nhập `/staff` bằng tài khoản được cấp. Mật khẩu ban đầu của tài khoản thực hành là `123`, không bắt buộc đổi. Cán bộ tiếp nhận kiểm tra và phân công; chuyên viên ghi bằng chứng thẩm tra theo thủ tục rồi trình; lãnh đạo duyệt hoặc trả lại, người có quyền ký ký bản đã duyệt; văn thư phát hành và lưu việc giao kết quả. Tài chính đối soát nghĩa vụ khi hồ sơ có khoản thu. Mọi vai trò nghiệp vụ chỉ làm việc trong cơ quan cụ thể; chuyên viên chỉ xử lý hồ sơ được giao. Quản trị viên quản lý quyền và dữ liệu danh mục, không đọc hồ sơ cá nhân.

## Thông tin cá nhân và tự điền tờ khai

- Khi tự nộp với tư cách cá nhân, giữ lựa chọn **Tôi là người yêu cầu, dùng thông tin cá nhân đã lưu**. Tên, liên hệ, địa chỉ và giấy tờ tương ứng được điền sẵn. Những trường chưa có thông tin vẫn phải bổ sung; kiểm tra toàn bộ tờ khai trước khi gửi.
- Khi nộp thay, thông tin tài khoản chỉ gợi ý cho người thực hiện việc nộp. Khai riêng thông tin chủ yêu cầu ở bước 2 và giấy tờ ủy quyền ở bước thành phần hồ sơ. Không dùng tên cá nhân làm tên tổ chức.
- Có thể sửa thông tin trên từng tờ khai mà không thay đổi hồ sơ cá nhân. Việc sửa hồ sơ cá nhân chỉ được dùng cho hồ sơ lập sau đó, không thay đổi hồ sơ đã gửi. Địa chỉ liên hệ được gợi ý cho việc nhận qua bưu chính và có thể sửa theo từng lần.
- Địa chỉ gồm tỉnh/thành phố, phường/xã và chi tiết số nhà, đường/thôn/tổ dân phố. Danh sách phường, xã Hà Nội lấy từ danh mục cơ quan hiện có trong ứng dụng; địa phương khác có thể nhập trực tiếp.
- Dữ liệu do người dân tự khai, chưa được xác thực từ VNeID hoặc cơ sở dữ liệu dân cư. Lưu số căn cước không tự miễn giấy tờ của thủ tục.

## Hướng dẫn chi tiết

- [Cấp bản sao từ sổ gốc 2.000908](Thu_tuc_phan_tich_sau/2.000908.md): kiểm tra sổ và quyền yêu cầu; hạn trong ngày hoặc ngày làm việc tiếp theo khi nhận sau 15 giờ; không thu phí hành chính ở luồng đã cấu hình.
- [Khai thác dữ liệu tài nguyên và môi trường 1.004237](Thu_tuc_phan_tich_sau/1.004237.md): Mẫu 02/03, kiểm tra yêu cầu và nghĩa vụ tài chính; mốc 05 ngày là mốc kiểm tra, không phải hạn trả dữ liệu chung.
- [Thủ tục hộ tịch 2.000635](Thu_tuc_phan_tich_sau/2.000635.md) là tài liệu phân tích, chưa được mở nộp trong ứng dụng.
- `Chuc_nang_dung_chung` có 36 use case; phần mô hình và phần chức năng đã chạy được ghi riêng. Không coi mọi ca thiết kế là tính năng đã hoàn tất.
- `Thu_tuc_theo_QD_492` là 2.075 dòng tham chiếu theo danh mục ngày 14/04/2026. Có thể mở [trang tra cứu tĩnh](Thu_tuc_theo_QD_492/Tra_cuu_danh_muc.html). Phân loại 1.120 toàn trình, 921 một phần và 34 thông tin là phân loại ở nguồn danh mục, không tự cho phép nộp hồ sơ.
- [Biên bản đối chiếu DVCQG](../05_Doi_chieu/Doi_chieu_thu_tuc_DVCQG_20261020.md) ghi nguồn, khác biệt và phần còn thiếu.

Hai quy trình dùng khung tiếp nhận, phân công, duyệt và giao chung, nhưng khác kiểm tra chuyên môn, cơ quan, hạn và khoản thu. Không dùng một luồng cho tất cả thủ tục. Chưa có kết nối định danh, sổ chuyên ngành, thanh toán hoặc chứng thư công vụ.

[Bản hướng dẫn cấp bản sao từ sổ gốc để mở trên điện thoại](../../output/pdf/huong-dan-ho-so-2-000908-xem-tren-dien-thoai.pdf) đã cập nhật ngày 20/10/2026: có bước đối chiếu sổ, cách nhận khóa và kiểm tra theo từng tài khoản.

## Tài khoản của tôi

Mở `/tai-khoan` sau đăng nhập để vào khu vực quản lý chung.

1. **Tổng quan**: xem hồ sơ gần đây, yêu cầu bổ sung và khoản thu cần thực hiện.
2. **Dịch vụ công của tôi**: tìm/lọc hồ sơ, xem tiến độ, bổ sung giấy tờ, gửi chứng từ và đánh giá theo điều kiện của hồ sơ. Không phải nhập khóa với hồ sơ thuộc tài khoản.
3. **Hồ sơ nháp**: khi lập hồ sơ bấm “Lưu nháp vào tài khoản”; quay lại đây để tiếp tục hoặc xóa. Tệp không lưu cùng nháp nên cần chọn lại trước khi gửi. Nháp chưa chuyển cho cán bộ.
4. **Tài liệu điện tử**: tải giấy tờ đã nộp, thông báo đã phát hành, mở kết quả giải quyết. Khi lập hồ sơ mới có thể dùng lại giấy tờ từ mục Thành phần hồ sơ; phải kiểm tra giấy tờ còn phù hợp.
5. **Thông báo**: xem các mốc xử lý công khai, cập nhật lịch hẹn và phản ánh; đánh dấu đã đọc khi cần.
6. **Lịch hẹn / Phản ánh**: xem danh sách thuộc tài khoản và nội dung trả lời của cơ quan.
7. **Khoản thu, thanh toán**: xem số tiền, căn cứ, mã theo dõi và chứng từ đã khai; mở hồ sơ để gửi chứng từ cho kế toán đối chiếu. Chưa chuyển tiền qua ngân hàng.
8. **Bảo mật**: chủ động đổi mật khẩu hoặc đăng xuất các phiên khác.

Tài khoản mới chưa có giao dịch sẽ hiển thị danh sách trống. Các mục chỉ hiển thị dữ liệu phát sinh từ tài khoản đó, không tự ghép hồ sơ theo tên hoặc số điện thoại.
