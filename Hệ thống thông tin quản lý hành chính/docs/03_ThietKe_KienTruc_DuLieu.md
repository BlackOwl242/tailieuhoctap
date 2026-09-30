IV. THIẾT KẾ HỆ THỐNG THÔNG TIN QUẢN LÝ HÀNH CHÍNH

4.1. Thiết kế kiến trúc công nghệ hệ thống tổng thể

Kiến trúc kỹ thuật của Hệ thống thông tin giải quyết thủ tục hành chính cấp tỉnh được thiết kế tuân thủ nghiêm ngặt Khung kiến trúc Chính phủ điện tử Việt Nam phiên bản 3.0 do Bộ Thông tin và Truyền thông ban hành. Hệ thống áp dụng mô hình kiến trúc bốn tầng phân tách độc lập, ghép nối lỏng thông qua các giao diện lập trình ứng dụng bảo mật, bảo đảm khả năng mở rộng linh hoạt, độ sẵn sàng cao và an toàn tuyệt đối.

Tầng 1: Tầng trình diễn và tương tác đa kênh . Đây là điểm tiếp xúc trực tiếp giữa hệ thống với người dùng, bao gồm:
Cổng Dịch vụ công trực tuyến cấp tỉnh: Cung cấp giao diện web hiện đại, tương thích đa nền tảng từ máy tính cá nhân đến thiết bị di động, phục vụ người dân và doanh nghiệp nộp hồ sơ, tra cứu tiến độ, thanh toán trực tuyến và đánh giá dịch vụ.
Phân hệ Một cửa điện tử và Thụ lý nghiệp vụ: Giao diện bàn làm việc số hóa dành riêng cho cán bộ, công chức tại Trung tâm Phục vụ hành chính công và các phòng chuyên môn, tối ưu hóa các thao tác tiếp nhận, quét tài liệu, thụ lý và trình ký số.
Bảng điều hành số giám sát theo Bộ chỉ số 766: Màn hình trung tâm hiển thị các biểu đồ trực quan hóa dữ liệu thời gian thực phục vụ công tác chỉ đạo, điều hành của Lãnh đạo Ủy ban nhân dân tỉnh và thủ trưởng các Sở, ngành.
Ứng dụng di động công dân: Cung cấp các tiện ích tra cứu tiến độ hồ sơ qua mã phản hồi nhanh, nhận thông báo đẩy tức thời và nộp hồ sơ thủ tục hành chính đơn giản ngay trên điện thoại thông minh.

Tầng 2: Tầng dịch vụ nghiệp vụ hệ thống . Tầng này đóng vai trò là bộ não điều hành toàn bộ logic nghiệp vụ công vụ, bao gồm các cụm dịch vụ chuyên biệt:
Dịch vụ quản lý danh mục và tiếp nhận: Quản lý danh mục thủ tục hành chính, cấu hình biểu mẫu tương tác, tự động sinh mã số hồ sơ điện tử theo quy chuẩn quốc gia.
Dịch vụ số hóa và bóc tách dữ liệu: Điều khiển thiết bị quét quang học, chuyển đổi tài liệu sang định dạng văn bản chuẩn, bóc tách thông tin siêu dữ liệu và đóng dấu số chứng thực số hóa.
Động cơ điều phối quy trình công vụ động: Áp dụng chuẩn mô hình hóa quy trình nghiệp vụ quốc tế, cho phép định tuyến luồng hồ sơ linh hoạt giữa các phòng ban, thiết lập thời hạn xử lý cho từng bước và tự động đếm ngược thời gian giải quyết.
Dịch vụ ký số và chứng thực điện tử tập trung: Tích hợp với thiết bị phần cứng bảo mật chuyên dụng, quản lý chứng thư số công vụ, hỗ trợ ký số văn bản định dạng chuẩn và đóng dấu số cơ quan nhà nước theo quy định của Nghị định số 30/2020/NĐ-CP.
Dịch vụ tài chính và biên lai điện tử: Sinh mã định danh thanh toán tập trung, điều phối thông điệp xác nhận nộp phí và phát hành biên lai thu phí điện tử hợp lệ.

[[IMAGE: assets/diagrams/hinh_3_1_kien_truc_cong_nghe_he_thong.png | Caption: Hình 3.1: Kiến trúc công nghệ bốn tầng của Hệ thống thông tin giải quyết thủ tục hành chính]]

Tầng 3: Tầng tích hợp và liên thông chia sẻ dữ liệu . Đóng vai trò là cầu nối thông tin an toàn giữa hệ thống của tỉnh với bên ngoài:
Nền tảng tích hợp và chia sẻ dữ liệu cấp tỉnh LGSP: Quản lý tập trung toàn bộ các giao diện kết nối nội bộ giữa Hệ thống giải quyết thủ tục hành chính với Hệ thống Quản lý văn bản và điều hành tác nghiệp, Hệ thống thông tin báo cáo tỉnh và các hệ thống chuyên ngành địa phương.
Kết nối Nền tảng tích hợp dữ liệu quốc gia NDXP: Liên thông dọc với Cổng Dịch vụ công Quốc gia, Cơ sở dữ liệu quốc gia về dân cư theo Đề án 06, Cơ sở dữ liệu quốc gia về đăng ký doanh nghiệp, Cơ sở dữ liệu hộ tịch điện tử toàn quốc và Hệ thống thông tin quản lý ngân sách của Kho bạc Nhà nước.
Cổng thanh toán trung gian quốc gia: Kết nối chuyển mạch thanh toán an toàn với mạng lưới các ngân hàng thương mại và tổ chức cung ứng dịch vụ trung gian thanh toán được cấp phép.

Tầng 4: Tầng dữ liệu và lưu trữ số hóa an toàn . Đảm nhiệm chức năng lưu trữ, bảo tồn và bảo đảm tính toàn vẹn của dữ liệu:
Cơ sở dữ liệu quan hệ nghiệp vụ: Sử dụng hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, triển khai theo mô hình cụm máy chủ có khả năng tự động chuyển đổi dự phòng nóng, bảo đảm không gián đoạn giao dịch khi một nút máy chủ gặp sự cố phần cứng. Áp dụng công nghệ mã hóa trong suốt toàn bộ cơ sở dữ liệu.
Kho lưu trữ dữ liệu số hóa đối tượng: Lưu trữ toàn bộ các tệp tin số hóa giấy tờ thành phần và kết quả giải quyết có chữ ký số. Áp dụng công nghệ ghi một lần đọc nhiều lần nhằm ngăn chặn hoàn toàn việc ghi đè hoặc sửa đổi nội dung tài liệu pháp lý sau khi đã được ký số phát hành.
Kho chỉ mục tìm kiếm tốc độ cao: Phục vụ công tác tìm kiếm toàn văn nội dung tài liệu số hóa, hỗ trợ tra cứu hồ sơ tức thì trên hàng triệu bản ghi lưu trữ.
Hệ thống quản lý thông tin và sự kiện an ninh mạng tập trung SIEM: Tiếp nhận và lưu trữ bất biến toàn bộ nhật ký kiểm toán hệ thống trong thời gian tối thiểu 02 năm phục vụ điều tra, giám sát an ninh mạng.

4.2. Thiết kế luồng quy trình nghiệp vụ và luân chuyển trạng thái hồ sơ

Quy trình giải quyết thủ tục hành chính điện tử được chuẩn hóa thành chu trình khép kín gồm năm bước nghiệp vụ mạch lạc, kết hợp đồng bộ với việc quản lý nghĩa vụ tài chính và giám sát kỷ cương công vụ.

Bảng 4.1: Ma trận luân chuyển trạng thái và trách nhiệm công vụ trong quy trình năm bước

| Bước quy trình | Đơn vị, cá nhân thực hiện | Thao tác trên phần mềm hệ thống | Trạng thái hồ sơ tương ứng | Đầu ra nghiệp vụ của bước |
| :---: | :--- | :--- | :---: | :--- |
| Bước 1: Tiếp nhận và kiểm tra | Cán bộ tiếp nhận tại Bộ phận Một cửa | Kiểm tra tính đầy đủ của thành phần hồ sơ theo danh mục công bố; xác thực danh tính người nộp qua VNeID. | Đã tiếp nhận chính thức (Mã: TT02) | Mã số hồ sơ duy nhất và Giấy hẹn trả kết quả điện tử có mã phản hồi nhanh. |
| Bước 2: Số hóa tại nguồn | Cán bộ Một cửa phối hợp máy quét | Quét hồ sơ giấy sang PDF/A, bóc tách dữ liệu nhân thân, ký số công vụ chứng thực số hóa vào tệp tin. | Đã số hóa thành phần (Mã: TT02-SH) | Tệp tin số hóa hợp lệ lưu vào Kho dữ liệu số hóa; đồng bộ vào Kho cá nhân. |
| Kiểm soát: Nộp nghĩa vụ tài chính | Người nộp hồ sơ và Kênh thanh toán | Hệ thống tự động sinh Mã định danh nộp phí; người dân quét mã chuyển tiền; ngân hàng phản hồi gói tin. | Đã hoàn thành nộp phí (Mã: TT04) | Biên lai điện tử có ký số của cơ quan thu; mở khóa chuyển bước chuyên môn. |
| Bước 3: Thụ lý chuyên môn | Chuyên viên phòng chuyên môn thụ lý | Thẩm định điều kiện thực tế; lấy ý kiến phối hợp liên phòng, liên ngành (nếu có); lập dự thảo kết quả. | Đang thẩm định chuyên môn (Mã: TT05) | Phiếu thẩm định điện tử và Dự thảo quyết định/giấy phép có chữ ký nháy. |
| Bước 4: Phê duyệt và ký số | Lãnh đạo cơ quan và Văn thư lưu trữ | Lãnh đạo thẩm tra và ký số công vụ; Văn thư cấp số văn bản đi tự động và áp dụng chữ ký số con dấu. | Đã có kết quả giải quyết (Mã: TT09) | Văn bản kết quả điện tử chính thức có đầy đủ chữ ký số cá nhân và con dấu cơ quan. |
| Bước 5: Trả kết quả và lưu trữ | Bộ phận Một cửa và Người nộp hồ sơ | Bàn giao kết quả điện tử vào Kho dữ liệu cá nhân; in bản giấy giao cho dân (nếu yêu cầu); khảo sát hài lòng. | Đã trả kết quả cho dân (Mã: TT10) | Phiếu đánh giá sự hài lòng của công dân; hồ sơ đóng và chuyển lưu trữ vĩnh viễn. |

Quy trình năm bước nêu trên được thiết lập các rào cản kỹ thuật tự động để loại trừ sự tùy tiện của con người:

Thứ nhất, rào cản kiểm soát thời gian: Hệ thống tự động tính toán thời hạn theo giờ làm việc thực tế, tự động gửi cảnh báo trước 24 giờ cho chuyên viên và trưởng phòng. Nếu để quá hạn, hệ thống khóa chức năng chuyển tiếp hồ sơ cho đến khi cán bộ thụ lý đính kèm văn bản xin lỗi công dân có xác nhận của lãnh đạo cơ quan.

Thứ hai, rào cản chống yêu cầu nộp lại giấy tờ: Khi tiếp nhận hồ sơ, nếu công dân xuất trình tài khoản VNeID Mức độ hai, hệ thống tự động kiểm tra Kho dữ liệu điện tử cá nhân. Nếu giấy tờ đã có bản số hóa hợp lệ hoặc đã có dữ liệu trong các cơ sở dữ liệu quốc gia, phần mềm tự động đánh dấu hoàn thành và vô hiệu hóa nút yêu cầu bổ sung giấy tờ đó đối với công chức Một cửa.

Thứ ba, rào cản kiểm soát dòng tiền: Luồng hồ sơ chỉ được tự động kích hoạt chuyển sang phòng chuyên môn thẩm định khi và chỉ khi hệ thống nhận được bản tin xác nhận giao dịch nộp phí, lệ phí thành công từ cổng thanh toán.

4.3. Thiết kế cơ sở dữ liệu quan hệ chi tiết

Cơ sở dữ liệu của Hệ thống thông tin giải quyết thủ tục hành chính được thiết kế tuân thủ nghiêm ngặt các nguyên tắc thiết kế cơ sở dữ liệu quan hệ, đạt chuẩn dạng chuẩn ba nhằm loại bỏ hoàn toàn hiện tượng dị thường dữ liệu khi thêm mới, sửa đổi hoặc xóa bản ghi, đồng thời tối ưu hóa tốc độ truy vấn chỉ mục.

[[IMAGE: assets/diagrams/hinh_3_2_mo_hinh_erd_quan_he_thuc_the.png | Caption: Hình 3.2: Sơ đồ quan hệ thực thể cơ sở dữ liệu hệ thống thông tin giải quyết thủ tục hành chính]]

Dưới đây là từ điển dữ liệu đặc tả chi tiết bảy bảng thực thể cốt lõi của hệ thống:

Bảng 4.2: Cấu trúc dữ liệu chi tiết bảng Danh mục thủ tục hành chính (THU_TUC_HANH_CHINH)

| Tên trường dữ liệu | Kiểu dữ liệu | Ràng buộc | Ý nghĩa và Diễn giải nghiệp vụ |
| :--- | :--- | :---: | :--- |
| ma_thu_tuc | VARCHAR(50) | Khóa chính | Mã định danh duy nhất của TTHC theo Cơ sở dữ liệu quốc gia về TTHC. |
| ten_thu_tuc | NVARCHAR(255) | Bắt buộc | Tên gọi đầy đủ, chính thức của thủ tục hành chính theo quyết định công bố. |
| ma_co_quan | VARCHAR(20) | Bắt buộc | Mã định danh điện tử của cơ quan có thẩm quyền giải quyết (Sở/UBND). |
| cap_thuc_hien | INT | Bắt buộc | Cấp hành chính thực hiện: 1-Cấp tỉnh, 2-Cấp huyện, 3-Cấp xã. |
| thoi_han_giai_quyet | INT | Bắt buộc | Thời hạn giải quyết chuẩn tính bằng giờ làm việc (ví dụ: 24, 72, 120 giờ). |
| muc_do_cung_cap | INT | Bắt buộc | Mức độ cung cấp DVC: 1-DVC trực tuyến toàn trình, 2-DVC một phần. |
| phi_dich_vu | DECIMAL(12,2) | Mặc định 0 | Mức phí phải nộp vào ngân sách nhà nước theo quy định (Đơn vị: VNĐ). |
| le_phi_dich_vu | DECIMAL(12,2) | Mặc định 0 | Mức lệ phí phải nộp vào ngân sách nhà nước theo quy định (Đơn vị: VNĐ). |
| ma_kho_bac | VARCHAR(30) | Bắt buộc | Mã số tài khoản chuyên thu mở tại Kho bạc Nhà nước của cơ quan giải quyết. |
| ma_tieu_muc_ngan_sach | VARCHAR(10) | Bắt buộc | Mã tiểu mục mục lục ngân sách nhà nước để hạch toán nguồn thu phí, lệ phí. |
| trang_thai_hieu_luc | BOOLEAN | Mặc định True | Trạng thái hiệu lực của thủ tục: True-Đang áp dụng, False-Hết hiệu lực. |

Bảng 4.3: Cấu trúc dữ liệu chi tiết bảng Hồ sơ tiếp nhận (HO_SO_TIEP_NHAN)

| Tên trường dữ liệu | Kiểu dữ liệu | Ràng buộc | Ý nghĩa và Diễn giải nghiệp vụ |
| :--- | :--- | :---: | :--- |
| ma_ho_so | VARCHAR(30) | Khóa chính | Mã định danh duy nhất của hồ sơ theo cấu trúc chuẩn quốc gia. |
| ma_thu_tuc | VARCHAR(50) | Khóa ngoại | Tham chiếu đến bảng THU_TUC_HANH_CHINH(ma_thu_tuc). |
| so_dinh_danh_cong_dan | VARCHAR(12) | Bắt buộc | Số định danh cá nhân / CCCD của người nộp hồ sơ đã xác thực VNeID. |
| ho_ten_nguoi_nop | NVARCHAR(100) | Bắt buộc | Họ và tên đầy đủ của người nộp hồ sơ (khóa cứng từ CSDL Dân cư). |
| so_dien_thoai | VARCHAR(15) | Bắt buộc | Số điện thoại liên lạc chính chủ của người nộp để nhận tin nhắn thông báo. |
| dia_chi_thuong_tru | NVARCHAR(255) | Bắt buộc | Địa chỉ thường trú đầy đủ trích xuất từ dữ liệu dân cư của Bộ Công an. |
| ngay_tiep_nhan | DATETIME | Bắt buộc | Thời điểm tiếp nhận hồ sơ chính thức (chính xác đến giây). |
| ngay_hen_tra | DATETIME | Bắt buộc | Thời điểm hẹn trả kết quả cho công dân (tự động loại trừ ngày nghỉ lễ). |
| ngay_hoan_thanh | DATETIME | Có thể rỗng | Thời điểm thực tế hồ sơ được ký số phát hành kết quả giải quyết. |
| trang_thai_ho_so | INT | Bắt buộc | Trạng thái hiện tại của hồ sơ (tham chiếu Bảng 3.2: TT01 đến TT10). |
| hinh_thuc_nop | INT | Bắt buộc | Hình thức nộp: 1-Trực tuyến qua mạng, 2-Nộp trực tiếp tại Bộ phận Một cửa. |
| ma_co_quan_giai_quyet | VARCHAR(20) | Bắt buộc | Mã cơ quan chịu trách nhiệm thẩm định và phê duyệt hồ sơ. |
| co_van_ban_xin_loi | BOOLEAN | Mặc định False | Đánh dấu hồ sơ có bị quá hạn và đã ban hành văn bản xin lỗi hay chưa. |

Bảng 4.4: Cấu trúc dữ liệu chi tiết bảng Thành phần hồ sơ số hóa (THANH_PHAN_HO_SO_SO_HOA)

| Tên trường dữ liệu | Kiểu dữ liệu | Ràng buộc | Ý nghĩa và Diễn giải nghiệp vụ |
| :--- | :--- | :---: | :--- |
| ma_giay_to | BIGINT AUTO | Khóa chính | Mã số tự tăng định danh duy nhất từng giấy tờ thành phần số hóa. |
| ma_ho_so | VARCHAR(30) | Khóa ngoại | Tham chiếu đến bảng HO_SO_TIEP_NHAN(ma_ho_so). |
| ten_giay_to | NVARCHAR(255) | Bắt buộc | Tên loại giấy tờ thành phần theo danh mục quy định của thủ tục. |
| duong_dan_tep_pdf | VARCHAR(500) | Bắt buộc | Đường dẫn lưu trữ tệp tin số hóa chuẩn PDF/A trong Kho lưu trữ đối tượng. |
| ma_bam_sha256 | VARCHAR(64) | Bắt buộc | Chuỗi mã băm bảo mật SHA-256 bảo đảm tính toàn vẹn, chống sửa đổi tệp. |
| da_ky_so_chung_thuc | BOOLEAN | Mặc định False | Đánh dấu tệp tin đã được công chức Một cửa ký số chứng thực số hóa hay chưa. |
| thong_tin_chu_ky_so | TEXT | Có thể rỗng | Dữ liệu chứng thư số, thời gian ký và đơn vị cấp chứng thư số công vụ. |
| ma_kho_du_lieu_ca_nhan | VARCHAR(50) | Bắt buộc | Mã định danh thư mục lưu trữ trong Kho dữ liệu cá nhân của người nộp. |
| tai_su_dung_tu_kho | BOOLEAN | Mặc định False | Đánh dấu giấy tờ này được trích xuất từ kết quả số hóa cũ hay tải mới lên. |
| ngay_so_hoa | DATETIME | Bắt buộc | Thời điểm tệp tin được quét và cập nhật vào hệ thống. |

Bảng 4.5: Cấu trúc dữ liệu chi tiết bảng Quá trình xử lý hồ sơ (QUA_TRINH_XU_LY)

| Tên trường dữ liệu | Kiểu dữ liệu | Ràng buộc | Ý nghĩa và Diễn giải nghiệp vụ |
| :--- | :--- | :---: | :--- |
| ma_qua_trinh | BIGINT AUTO | Khóa chính | Mã tự tăng định danh duy nhất từng bước luân chuyển nghiệp vụ của hồ sơ. |
| ma_ho_so | VARCHAR(30) | Khóa ngoại | Tham chiếu đến bảng HO_SO_TIEP_NHAN(ma_ho_so). |
| ma_can_bo_xu_ly | VARCHAR(20) | Khóa ngoại | Tham chiếu đến bảng CAN_BO_CONG_CHUC_PHAN_QUYEN(ma_can_bo). |
| buoc_nghiep_vu | NVARCHAR(100) | Bắt buộc | Tên bước công việc (Tiếp nhận, Số hóa, Thẩm định, Phê duyệt, Đóng dấu). |
| noi_dung_y_kien | NVARCHAR(1000) | Có thể rỗng | Ý kiến chỉ đạo, nhận xét chuyên môn hoặc lý do yêu cầu bổ sung hồ sơ. |
| thoi_gian_bat_dau | DATETIME | Bắt buộc | Thời điểm cán bộ nhận hồ sơ trên bàn làm việc điện tử. |
| thoi_gian_ket_thuc | DATETIME | Có thể rỗng | Thời điểm cán bộ hoàn tất xử lý và bấm chuyển tiếp bước tiếp theo. |
| chu_ky_so_xac_thuc | TEXT | Có thể rỗng | Chữ ký số cá nhân của cán bộ gắn với hành động xử lý bước nghiệp vụ. |
| trang_thai_xu_ly | INT | Bắt buộc | 1-Đang xử lý, 2-Đã chuyển tiếp, 3-Tạm dừng đếm giờ, 4-Từ chối. |

Bảng 4.6: Cấu trúc dữ liệu chi tiết bảng Giao dịch tài chính và Biên lai (GIAO_DICH_TAI_CHINH)

| Tên trường dữ liệu | Kiểu dữ liệu | Ràng buộc | Ý nghĩa và Diễn giải nghiệp vụ |
| :--- | :--- | :---: | :--- |
| ma_dinh_danh_thanh_toan | VARCHAR(35) | Khóa chính | Mã duy nhất định danh giao dịch thanh toán gắn chặt với mã hồ sơ. |
| ma_ho_so | VARCHAR(30) | Khóa ngoại | Tham chiếu đến bảng HO_SO_TIEP_NHAN(ma_ho_so). |
| so_tien_phi | DECIMAL(12,2) | Bắt buộc | Số tiền phí phải thu theo quy định nộp vào ngân sách nhà nước. |
| so_tien_le_phi | DECIMAL(12,2) | Bắt buộc | Số tiền lệ phí phải thu nộp ngân sách nhà nước. |
| kenh_thanh_toan | VARCHAR(50) | Bắt buộc | Cổng thanh toán quốc gia, Mã phản hồi nhanh ngân hàng, Ví điện tử. |
| ma_giao_dich_ngan_hang | VARCHAR(100) | Có thể rỗng | Mã số giao dịch thanh toán do ngân hàng hoặc đơn vị trung gian cấp. |
| thoi_gian_thanh_toan | DATETIME | Có thể rỗng | Thời điểm giao dịch trừ tiền thành công được xác nhận qua API. |
| trang_thai_thanh_toan | INT | Bắt buộc | 1-Chờ nộp tiền, 2-Thanh toán thành công, 3-Giao dịch thất bại, 4-Đã hoàn trả. |
| so_bien_lai_dien_tu | VARCHAR(30) | Có thể rỗng | Số seri và số thứ tự của biên lai điện tử thu phí, lệ phí đã phát hành. |
| chu_ky_so_bien_lai | TEXT | Có thể rỗng | Chữ ký số của cơ quan thu phí trên biên lai điện tử. |
| trang_thai_doi_soat_kho_bac | BOOLEAN | Mặc định False | Đánh dấu giao dịch đã được đối soát thành công với Kho bạc Nhà nước. |

Bảng 4.7: Cấu trúc dữ liệu chi tiết bảng Cán bộ công chức và Phân quyền (CAN_BO_CONG_CHUC)

| Tên trường dữ liệu | Kiểu dữ liệu | Ràng buộc | Ý nghĩa và Diễn giải nghiệp vụ |
| :--- | :--- | :---: | :--- |
| ma_can_bo | VARCHAR(20) | Khóa chính | Mã số định danh công chức theo Bảng mã định danh cán bộ quốc gia. |
| ho_ten_can_bo | NVARCHAR(100) | Bắt buộc | Họ và tên đầy đủ của cán bộ, công chức, viên chức. |
| so_cccd_dinh_danh | VARCHAR(12) | Duy nhất | Số căn cước công dân gắn chíp phục vụ xác thực hai yếu tố công vụ. |
| ten_dang_nhap | VARCHAR(50) | Duy nhất | Tên tài khoản truy cập phần mềm Một cửa điện tử nội bộ. |
| ma_phong_ban | VARCHAR(20) | Bắt buộc | Mã phòng chuyên môn trực thuộc Sở hoặc cơ quan chuyên trách cấp huyện. |
| ma_co_quan | VARCHAR(20) | Bắt buộc | Mã cơ quan hành chính nhà nước nơi cán bộ đang công tác. |
| vai_tro_he_thong | INT | Bắt buộc | 1-Cán bộ Một cửa, 2-Chuyên viên thụ lý, 3-Lãnh đạo phòng, 4-Lãnh đạo cơ quan. |
| so_seri_chung_thu_so | VARCHAR(100) | Bắt buộc | Số seri chứng thư số chuyên dùng công vụ do Ban Cơ yếu Chính phủ cấp. |
| trang_thai_hoat_dong | BOOLEAN | Mặc định True | Trạng thái tài khoản: True-Đang hoạt động, False-Khóa truy cập. |

Bảng 4.8: Cấu trúc dữ liệu chi tiết bảng Đánh giá sự hài lòng (DANH_GIA_HAI_LONG_766)

| Tên trường dữ liệu | Kiểu dữ liệu | Ràng buộc | Ý nghĩa và Diễn giải nghiệp vụ |
| :--- | :--- | :---: | :--- |
| ma_danh_gia | BIGINT AUTO | Khóa chính | Mã số tự tăng định danh duy nhất lượt đánh giá của tổ chức, cá nhân. |
| ma_ho_so | VARCHAR(30) | Khóa ngoại | Tham chiếu đến bảng HO_SO_TIEP_NHAN(ma_ho_so). |
| diem_thai_do_can_bo | INT | Bắt buộc | Điểm đánh giá tinh thần, thái độ phục vụ của cán bộ (Thang điểm 1 đến 5). |
| diem_thoi_gian_giai_quyet | INT | Bắt buộc | Điểm đánh giá về tính đúng hạn, kịp thời của thủ tục (Thang điểm 1 đến 5). |
| diem_tinh_thuan_tien | INT | Bắt buộc | Điểm đánh giá mức độ thuận tiện của cổng dịch vụ công (Thang điểm 1 đến 5). |
| y_kien_gop_y | NVARCHAR(500) | Có thể rỗng | Nội dung phản ánh, đóng góp ý kiến cải tiến quy trình của người dân. |
| kenh_danh_gia | INT | Bắt buộc | 1-Cổng Dịch vụ công, 2-Màn hình cảm ứng tại quầy, 3-Quét mã QR di động. |
| thoi_gian_danh_gia | DATETIME | Bắt buộc | Thời điểm người dân hoàn tất việc gửi đánh giá lên hệ thống. |
| da_dong_bo_quoc_gia | BOOLEAN | Mặc định False | Đánh dấu kết quả đánh giá đã được truyền về Cổng DVCQG phục vụ chấm điểm. |

4.4. Thiết kế giao diện tương tác người dùng công thái học

Thiết kế giao diện của hệ thống được xây dựng dựa trên nguyên lý thiết kế công thái học số và đáp ứng Tiêu chuẩn tiếp cận nội dung web (WCAG 2.1 Mức độ AA), bảo đảm mọi công dân kể cả người cao tuổi và người khuyết tật đều có thể tiếp cận thuận lợi.

4.4.1. Thiết kế giao diện Cổng Dịch vụ công trực tuyến

Giao diện Cổng Dịch vụ công trực tuyến (Hình 3.3) tuân thủ bộ nhận diện thương hiệu Chính phủ điện tử quốc gia với tông màu xanh lam đậm trang nghiêm và màu trắng thanh lịch.

Bố cục màn hình được chia thành ba khu vực trực quan:

Thanh điều hướng đỉnh trang: Hiển thị quốc huy, tên đơn vị hành chính tỉnh, công cụ tìm kiếm thủ tục bằng giọng nói hoặc từ khóa thông minh, nút chuyển đổi kích thước phông chữ và huy hiệu định danh điện tử VNeID Mức độ hai hiển thị rõ họ tên công dân kèm dấu tích xanh bảo mật.

Khu vực biểu mẫu tương tác nộp hồ sơ (Cột bên trái): Toàn bộ thông tin nhân thân cơ bản của người nộp được hệ thống tự động trích xuất từ dữ liệu dân cư và hiển thị trên nền xám nhạt với trạng thái khóa cứng, kèm dòng thông báo xác thực màu xanh lục: "Dữ liệu nhân thân đã được làm sạch và xác thực bởi Trung tâm Dữ liệu quốc gia về Dân cư". Người dân chỉ cần chọn cơ quan thụ lý và kê khai các nội dung chuyên ngành đặc thù của thủ tục.

Khu vực thành phần hồ sơ và Kho dữ liệu điện tử (Cột bên phải): Liệt kê danh mục các giấy tờ phải nộp. Tại mỗi giấy tờ, hệ thống cung cấp nút bấm tiện ích: "Trích xuất từ Kho dữ liệu cá nhân". Khi bấm vào, phần mềm tự động hiển thị danh sách các tài liệu số hóa hợp lệ của công dân đang lưu trữ trên hệ thống kèm ngày cấp và cơ quan ký số. Công dân chỉ cần nhấp chuột chọn để liên kết tài liệu vào hồ sơ mà không cần phải tìm kiếm và tải lên tệp tin từ máy tính cá nhân.

[[IMAGE: assets/diagrams/hinh_3_3_giao_dien_cong_dich_vu_cong.png | Caption: Hình 3.3: Thiết kế mô phỏng giao diện Cổng Dịch vụ công trực tuyến tích hợp định danh VNeID]]

4.4.2. Thiết kế giao diện Bàn làm việc Một cửa điện tử

Giao diện Bàn làm việc Một cửa điện tử (Hình 3.4) được thiết kế chuyên biệt phục vụ cho hiệu năng tác nghiệp cao độ của cán bộ, công chức, hạn chế tối đa số lần nhấp chuột và loại bỏ hoàn toàn các thao tác nhập liệu thừa.

Thanh điều hướng danh mục nghiệp vụ bên trái: Phân loại hồ sơ theo các ngăn làm việc thông minh gắn với số lượng hồ sơ cụ thể: Hồ sơ chờ tiếp nhận, Hồ sơ đang thụ lý, Hồ sơ xin ý kiến liên ngành, Hồ sơ chờ lãnh đạo ký số, Hồ sơ đã có kết quả và Hồ sơ cảnh báo nguy cơ trễ hạn. Màu sắc cảnh báo được phân định rõ rệt: Màu xanh lục cho hồ sơ an toàn, màu vàng cho hồ sơ còn dưới 24 giờ và màu đỏ nổi bật cho hồ sơ trễ hạn.

Bảng dữ liệu quản lý hồ sơ trung tâm: Hiển thị các trường thông tin trọng yếu: Mã số hồ sơ điện tử, Họ tên chủ hồ sơ, Tên thủ tục hành chính, Thời hạn xử lý còn lại tính bằng giờ kèm đồng hồ đếm ngược, Trạng thái xử lý và các nút hành động nhanh.

Khu vực thẩm định chi tiết và dòng lịch sử: Cho phép cán bộ xem song song nội dung văn bản số hóa bên cạnh phiếu thẩm định ý kiến; kiểm tra nhanh tính toàn vẹn của chữ ký số công vụ và lịch sử các bước xử lý trước đó mà không cần phải chuyển trang.

[[IMAGE: assets/diagrams/hinh_3_4_giao_dien_mot_cua_dien_tu.png | Caption: Hình 3.4: Thiết kế mô phỏng giao diện Bàn làm việc Một cửa điện tử của cán bộ công chức]]

4.4.3. Thiết kế Bảng điều hành giám sát theo Bộ chỉ số 766

Bảng điều hành giám sát (Hình 3.5) là công cụ kiểm soát công vụ tối cao được hiển thị trực tiếp tại phòng họp của Lãnh đạo Ủy ban nhân dân tỉnh và các màn hình lớn tại Trung tâm Phục vụ hành chính công:

Khối thẻ điểm tổng quan đỉnh trang: Hiển thị trực quan năm chỉ số thành phần cốt lõi của Quyết định số 766/QĐ-TTg với số điểm thực tế trên điểm chuẩn tối đa, tỷ lệ phần trăm đạt được và trạng thái xếp hạng của tỉnh.

Biểu đồ thanh ngang so sánh thi đua: Phản ánh tỷ lệ giải quyết hồ sơ đúng hạn theo thời gian thực của từng Sở, Ban, Ngành và từng Ủy ban nhân dân cấp huyện, tự động sắp xếp theo thứ tự giảm dần từ đơn vị dẫn đầu đến đơn vị có tỷ lệ trễ hạn cao.

Biểu đồ tròn khảo sát sự hài lòng: Trực quan hóa tỷ lệ phần trăm đánh giá của người dân theo bốn mức độ: Rất hài lòng, Hài lòng, Bình thường và Không hài lòng. Đi kèm với đó là bảng theo dõi tiến độ xử lý các phản ánh kiến nghị của công dân trong vòng 24 giờ.

[[IMAGE: assets/diagrams/hinh_3_5_giao_dien_dashboard_chi_so_766.png | Caption: Hình 3.5: Bản vẽ thiết kế Bảng điều hành giám sát đánh giá chất lượng phục vụ theo Bộ chỉ số 766]]
