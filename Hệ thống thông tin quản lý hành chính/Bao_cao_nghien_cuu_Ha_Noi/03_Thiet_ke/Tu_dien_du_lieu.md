Bảng 4.0: Từ điển dữ liệu cơ quan giải quyết

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh cơ quan |
| ma | varchar(50) | UQ | Không | Mã theo danh mục quản lý |
| ten | text |  | Không | Tên chính thức |
| cap | varchar(30) |  | Không | Cấp hoặc loại cơ quan |
| hieu_luc_tu | date |  | Không | Ngày có hiệu lực |
| hieu_luc_den | date |  | Có | Kết thúc hiệu lực nếu có |

Bảng 4.0: Từ điển dữ liệu danh mục thủ tục

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh thủ tục |
| ma_quoc_gia | varchar(50) | UQ | Không | Mã thủ tục quốc gia |
| ten | text |  | Không | Tên thủ tục |
| linh_vuc | varchar(100) |  | Không | Lĩnh vực quản lý |

Bảng 4.0: Từ điển dữ liệu phiên bản thủ tục

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh phiên bản |
| thu_tuc_id | uuid | FK thu_tuc | Không | Thủ tục gốc |
| co_quan_id | uuid | FK co_quan | Không | Cơ quan có thẩm quyền |
| so_phien_ban | integer |  | Không | Số phiên bản theo cơ quan |
| quyet_dinh | text |  | Không | Quyết định và căn cứ công bố |
| hieu_luc_tu | timestamptz |  | Không | Bắt đầu áp dụng |
| hieu_luc_den | timestamptz |  | Có | Kết thúc áp dụng |
| quy_tac_han | jsonb |  | Không | Kiểu hạn và tham số được duyệt |
| luoc_do_mau | jsonb |  | Không | Trường biểu mẫu và phiên bản |
| trang_thai | varchar(30) |  | Không | Nháp, duyệt hoặc hết hiệu lực |
| cau_hinh_quy_trinh | jsonb |  | Không | Bước, quyền, điều kiện, nhánh và phiên bản được duyệt |

Bảng 4.0: Từ điển dữ liệu chủ thể giao dịch và hộ tịch

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh nội bộ |
| loai | varchar(30) |  | Không | Cá nhân hoặc tổ chức |
| ho_ten | text |  | Không | Tên chủ thể |
| dinh_danh_ma_hoa | text |  | Có | Thông tin định danh đã bảo vệ |
| tham_chieu_dinh_danh | text |  | Có | Tham chiếu từ nền tảng xác thực |
| lien_he | jsonb |  | Có | Kênh liên hệ được sử dụng |

Bảng 4.0: Từ điển dữ liệu tài khoản cán bộ

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh tài khoản |
| chu_the_id | uuid | FK chu_the | Không | Người sử dụng |
| co_quan_id | uuid | FK co_quan | Không | Cơ quan công tác |
| ma_dang_nhap | varchar(100) | UQ | Không | Tham chiếu danh tính |
| trang_thai | varchar(30) |  | Không | Hoạt động hoặc khóa |
| tao_luc | timestamptz |  | Không | Thời điểm cấp |

Bảng 4.0: Từ điển dữ liệu quyền theo phạm vi

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh lần cấp quyền |
| tai_khoan_id | uuid | FK tai_khoan | Không | Tài khoản được cấp |
| co_quan_id | uuid | FK co_quan | Không | Phạm vi cơ quan |
| vai_tro | varchar(50) |  | Không | Vai trò nghiệp vụ |
| hieu_luc_tu | timestamptz |  | Không | Bắt đầu quyền |
| hieu_luc_den | timestamptz |  | Có | Hết quyền |
| can_cu | text |  | Không | Căn cứ và người phê duyệt |

Bảng 4.0: Từ điển dữ liệu hồ sơ hành chính

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh nội bộ |
| ma_yeu_cau | varchar(100) | UQ | Không | Khóa gửi lặp an toàn |
| ma_ho_so | varchar(100) | UQ | Có | Mã chính thức sau tiếp nhận |
| phien_ban_id | uuid | FK phien_ban_thu_tuc | Không | Phiên bản áp dụng |
| nguoi_yeu_cau_id | uuid | FK chu_the | Không | Người giao dịch |
| chu_the_ho_tich_id | uuid | FK chu_the | Có | Chủ thể sự kiện hộ tịch khi thủ tục yêu cầu |
| trang_thai | varchar(40) |  | Không | Trạng thái nghiệp vụ |
| nhan_luc | timestamptz |  | Có | Tiếp nhận hợp lệ |
| han_goc | timestamptz |  | Có | Hạn ban đầu |
| han_hien_hanh | timestamptz |  | Có | Hạn đang áp dụng |
| du_lieu_khai | jsonb |  | Không | Nội dung tờ khai có phiên bản |
| phien_ban | integer |  | Không | Số kiểm soát cập nhật đồng thời |
| kenh_tiep_nhan | varchar(30) |  | Không | Trực tuyến, trực tiếp hoặc bưu chính |
| ma_diem_tiep_nhan | varchar(50) |  | Có | Điểm tiếp nhận thực tế theo danh mục |
| nguoi_ho_tro_id | uuid | FK tai_khoan | Có | Người hỗ trợ; không thay người giao dịch |

Bảng 4.0: Từ điển dữ liệu căn cứ đại diện

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh căn cứ |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ áp dụng |
| nguoi_uy_quyen_id | uuid | FK chu_the | Không | Người được đại diện |
| nguoi_dai_dien_id | uuid | FK chu_the | Không | Người giao dịch |
| quan_he | varchar(100) |  | Không | Quan hệ hoặc căn cứ đại diện |
| tai_lieu_tham_chieu | text |  | Có | Tài liệu chứng minh nếu áp dụng |
| pham_vi | text |  | Không | Phạm vi đại diện |
| hieu_luc_den | timestamptz |  | Có | Thời điểm hết hiệu lực |

Bảng 4.0: Từ điển dữ liệu thành phần hồ sơ

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh thành phần |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ chủ quản |
| loai | varchar(100) |  | Không | Loại giấy tờ hoặc dữ liệu |
| khoa_doi_tuong | text |  | Có | Khóa tệp trong kho |
| bam_sha256 | char(64) |  | Có | Kiểm tra tính toàn vẹn tệp |
| nguon_du_lieu | text |  | Có | Nguồn khai thác thay thế giấy tờ |
| tham_chieu_nguon | text |  | Có | Định danh bản ghi nguồn |
| trang_thai | varchar(40) |  | Không | Cần cung cấp, hợp lệ hoặc chờ kiểm tra |
| phien_ban | integer |  | Không | Phiên bản thành phần |
| kich_thuoc_byte | bigint |  | Có | Kích thước nếu thành phần là tệp |
| loai_tep | varchar(100) |  | Có | Loại tệp được kiểm tra từ nội dung |

Bảng 4.0: Từ điển dữ liệu phân công xử lý

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh phân công |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ chịu trách nhiệm |
| tai_khoan_id | uuid | FK tai_khoan | Không | Cán bộ được giao |
| giao_luc | timestamptz |  | Không | Bắt đầu trách nhiệm |
| ket_thuc_luc | timestamptz |  | Có | Kết thúc lần phân công |
| nguoi_giao_id | uuid | FK tai_khoan | Không | Người quyết định |
| ly_do | text |  | Không | Căn cứ phân công hoặc thay đổi |

Bảng 4.0: Từ điển dữ liệu sự kiện xử lý

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh sự kiện |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ liên quan |
| tai_khoan_id | uuid | FK tai_khoan | Có | Cán bộ nếu có |
| hanh_dong | varchar(100) |  | Không | Loại hành động |
| truoc | varchar(40) |  | Có | Trạng thái trước |
| sau | varchar(40) |  | Có | Trạng thái sau |
| thoi_diem | timestamptz |  | Không | Thời điểm máy chủ |
| can_cu | text |  | Có | Lý do và chứng từ tham chiếu |
| ma_tuong_quan | varchar(100) |  | Không | Liên hệ giao dịch kỹ thuật |

Bảng 4.0: Từ điển dữ liệu yêu cầu bổ sung

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh lần yêu cầu |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ liên quan |
| giai_doan | varchar(40) |  | Không | Tiếp nhận hoặc thẩm định |
| noi_dung | text |  | Không | Thông tin cần bổ sung cụ thể |
| can_cu | text |  | Không | Cơ sở yêu cầu |
| nguoi_lap_id | uuid | FK tai_khoan | Không | Người lập |
| lap_luc | timestamptz |  | Không | Thời điểm phát sinh |
| phan_hoi_luc | timestamptz |  | Có | Nhận bổ sung |
| trang_thai_quay_lai | varchar(40) |  | Không | Giai đoạn tiếp tục khi đủ |

Bảng 4.0: Từ điển dữ liệu phiên bản kết quả

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh bản kết quả |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ chủ quản |
| so_phien_ban | integer |  | Không | Phiên bản kết quả |
| khoa_doi_tuong | text |  | Không | Tệp dự thảo hoặc phát hành |
| bam_sha256 | char(64) |  | Không | Giá trị toàn vẹn |
| so_van_ban | varchar(100) |  | Có | Số sau phát hành |
| trang_thai | varchar(40) |  | Không | Dự thảo, ký hoặc phát hành |
| thay_the_id | uuid | FK ket_qua | Có | Bản được thay thế |
| phat_hanh_luc | timestamptz |  | Có | Thời điểm phát hành |
| kich_thuoc_byte | bigint |  | Không | Kích thước bản kết quả |
| loai_tep | varchar(100) |  | Không | Loại tệp kết quả được kiểm tra |

Bảng 4.0: Từ điển dữ liệu bằng chứng chữ ký

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh bằng chứng |
| ket_qua_id | uuid | FK ket_qua | Không | Bản có chữ ký |
| nguoi_ky | text |  | Không | Thông tin chủ thể chứng thư |
| tham_chieu_chung_thu | text |  | Không | Chứng thư kiểm tra |
| ky_luc | timestamptz |  | Có | Thời điểm được xác định từ bằng chứng |
| kiem_tra_luc | timestamptz |  | Không | Thời điểm kiểm tra |
| ket_luan | varchar(40) |  | Không | Hợp lệ hoặc cần xử lý |
| bang_chung | jsonb |  | Không | Chuỗi kiểm tra và trạng thái liên quan |

Bảng 4.0: Từ điển dữ liệu khoản thu và miễn giảm

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh khoản thu |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ liên quan |
| loai | varchar(100) |  | Không | Phí, lệ phí hoặc khoản áp dụng |
| so_tien | numeric(18,2) |  | Không | Số phải thu không âm |
| don_vi_tien | char(3) |  | Không | Đơn vị tiền tệ |
| can_cu | text |  | Không | Biểu phí, miễn hoặc giảm |
| trang_thai | varchar(40) |  | Không | Chờ thu, đủ, miễn hoặc hoàn |

Bảng 4.0: Từ điển dữ liệu giao dịch và đối soát

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh giao dịch |
| khoan_thu_id | uuid | FK khoan_thu | Không | Khoản thu liên quan |
| doi_tac | varchar(100) |  | Không | Nguồn thông báo |
| ma_ngoai | varchar(150) |  | Không | Mã giao dịch bên ngoài |
| so_tien | numeric(18,2) |  | Không | Số tiền không âm |
| thoi_diem | timestamptz |  | Không | Thời điểm ghi nhận |
| trang_thai | varchar(40) |  | Không | Nhận, đối soát hoặc hoàn |
| tham_chieu_bang_chung | text |  | Không | Chứng từ hoặc thông báo đã xác minh |

Bảng 4.0: Từ điển dữ liệu chứng cứ giao kết quả

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh giao nhận |
| ket_qua_id | uuid | FK ket_qua | Không | Kết quả được giao |
| nguoi_nhan_id | uuid | FK chu_the | Không | Chủ thể có quyền nhận |
| kenh | varchar(50) |  | Không | Kho, trực tiếp hoặc bưu chính |
| trang_thai | varchar(40) |  | Không | Chưa giao, đã giao hoặc lỗi |
| thoi_diem | timestamptz |  | Có | Mốc giao xác nhận |
| bang_chung | text |  | Có | Mã giao hoặc chứng từ liên quan |

Bảng 4.0: Từ điển dữ liệu hàng đợi tích hợp

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh thông điệp |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ liên quan |
| ma_thong_diep | varchar(150) | UQ | Không | Mã giữ nguyên khi gửi lại |
| dich_nhan | varchar(150) |  | Không | Đích tích hợp |
| noi_dung | jsonb |  | Không | Dữ liệu cần gửi theo hợp đồng |
| trang_thai | varchar(40) |  | Không | Chờ, đã gửi hoặc cần xử lý |
| so_lan_thu | integer |  | Không | Số lần gửi không âm |
| thu_tiep_luc | timestamptz |  | Có | Mốc gửi tiếp |
| ma_loi | varchar(100) |  | Có | Lỗi đã chuẩn hóa |

Bảng 4.0: Từ điển dữ liệu lịch và ngoại lệ

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh lịch |
| co_quan_id | uuid | FK co_quan | Không | Cơ quan áp dụng |
| ngay | date |  | Không | Ngày lịch |
| la_ngay_lam | boolean |  | Không | Có làm việc hay không |
| bat_dau | time |  | Có | Giờ bắt đầu nếu có |
| ket_thuc | time |  | Có | Giờ đóng ngày |
| can_cu | text |  | Không | Căn cứ xác định lịch |

Bảng 4.0: Từ điển dữ liệu nhật ký quản trị

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh sự kiện kiểm tra |
| tai_khoan_id | uuid | FK tai_khoan | Có | Tài khoản tác động |
| hanh_dong | varchar(100) |  | Không | Loại thao tác |
| doi_tuong | text |  | Không | Định danh đối tượng; không sao chép nội dung hồ sơ |
| thoi_diem | timestamptz |  | Không | Thời điểm máy chủ |
| ket_qua | varchar(40) |  | Không | Thành công hoặc bị từ chối |
| ma_tuong_quan | varchar(100) |  | Không | Liên hệ giao dịch |

Bảng 4.0: Từ điển dữ liệu hệ thống kết nối

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh hệ thống |
| ma | varchar(50) | UQ | Không | Mã nguồn theo hợp đồng |
| ten | text |  | Không | Tên nền tảng |
| loai | varchar(30) |  | Không | Thành phố, bộ, quốc gia hoặc đối tác |
| chu_quan | text |  | Không | Đơn vị chịu trách nhiệm |
| phien_ban_hop_dong | varchar(30) |  | Không | Phiên bản giao tiếp |
| trang_thai | varchar(30) |  | Không | Được phép, thử hoặc ngừng |

Bảng 4.0: Từ điển dữ liệu tuyến tác nghiệp theo phiên bản

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh tuyến |
| phien_ban_id | uuid | FK phien_ban_thu_tuc | Không | Phiên bản thủ tục |
| he_thong_id | uuid | FK he_thong_ket_noi | Không | Hệ thống được xử lý |
| hieu_luc_tu | timestamptz |  | Không | Bắt đầu tuyến |
| hieu_luc_den | timestamptz |  | Có | Kết thúc tuyến |
| can_cu | text |  | Không | Quyết định áp dụng |
| phe_duyet_id | uuid | FK tai_khoan | Không | Người phê duyệt |

Bảng 4.0: Từ điển dữ liệu tham chiếu hồ sơ liên thông

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh tham chiếu |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ dùng chung |
| he_thong_id | uuid | FK he_thong_ket_noi | Không | Hệ thống nguồn |
| ma_ngoai | varchar(150) |  | Không | Mã hồ sơ tại nguồn |
| trang_thai_nguon | varchar(40) |  | Không | Trạng thái do nguồn công bố |
| su_kien_cuoi | varchar(150) |  | Có | Mã sự kiện cuối áp dụng |
| thoi_diem_nguon | timestamptz |  | Không | Mốc nghiệp vụ của nguồn |
| nhan_luc | timestamptz |  | Không | Mốc nhận tại địa phương |
| thu_tu_cuoi | bigint |  | Có | Thứ tự sự kiện cuối đã áp dụng theo hợp đồng |

Bảng 4.0: Từ điển dữ liệu nhiệm vụ phối hợp thẩm định

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh nhiệm vụ |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ cần ý kiến |
| co_quan_id | uuid | FK co_quan | Không | Cơ quan được hỏi |
| noi_dung | text |  | Không | Phạm vi yêu cầu |
| bat_buoc | boolean |  | Không | Ý kiến bắt buộc theo quy trình |
| han_tra_loi | timestamptz |  | Không | Hạn nhiệm vụ, không thay hạn hồ sơ |
| trang_thai | varchar(40) |  | Không | Chờ nhận, xử lý, đã trả hoặc hủy |
| tham_chieu_y_kien | text |  | Có | Tài liệu và phiên bản trả lời |
| phien_ban | integer |  | Không | Kiểm soát cập nhật nhiệm vụ đồng thời |

Bảng 4.0: Từ điển dữ liệu thông báo và trạng thái gửi

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh thông báo |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ liên quan |
| nguoi_nhan_id | uuid | FK chu_the | Không | Chủ thể có quyền nhận |
| kenh | varchar(30) |  | Không | Kênh đã được phép sử dụng |
| ma_mau | varchar(50) |  | Không | Mẫu nội dung đã duyệt |
| tham_chieu_gui | text |  | Có | Mã đối tác, không lưu bí mật truy cập |
| trang_thai | varchar(30) |  | Không | Chờ, gửi, giao hoặc lỗi |
| gui_luc | timestamptz |  | Có | Mốc gửi thực tế |

Bảng 4.0: Từ điển dữ liệu đợt nộp lưu hồ sơ

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh đợt |
| co_quan_id | uuid | FK co_quan | Không | Đơn vị nộp |
| lap_luc | timestamptz |  | Không | Mốc lập danh mục |
| phe_duyet_id | uuid | FK tai_khoan | Có | Người duyệt nộp |
| kho_dich | text |  | Không | Đầu mối lưu trữ nhận |
| trang_thai | varchar(30) |  | Không | Nháp, gửi, nhận hoặc cần bổ sung |

Bảng 4.0: Từ điển dữ liệu hồ sơ và bằng chứng nộp lưu

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh lần nộp |
| dot_id | uuid | FK dot_nop_luu | Không | Đợt nộp lưu |
| ho_so_id | uuid | FK ho_so | Không | Hồ sơ được nộp |
| ma_goi | varchar(100) | UQ | Không | Mã gói có phiên bản |
| bam_danh_muc | char(64) |  | Không | Toàn vẹn danh mục thành phần |
| tham_chieu_bien_nhan | text |  | Có | Biên nhận của kho đích |
| trang_thai | varchar(30) |  | Không | Chờ kiểm tra, được nhận hoặc trả lại |
| nhan_luc | timestamptz |  | Có | Mốc được kho xác nhận |

Bảng 4.0: Từ điển dữ liệu phản ánh và đánh giá phục vụ

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh phản ánh |
| ho_so_id | uuid | FK ho_so | Có | Hồ sơ nếu có quan hệ |
| chu_the_id | uuid | FK chu_the | Có | Chủ thể nếu có thông tin hợp lệ |
| loai | varchar(40) |  | Không | Phản ánh, đánh giá hoặc chuyển quy trình khác |
| noi_dung | text |  | Không | Nội dung được bảo vệ |
| co_quan_id | uuid | FK co_quan | Có | Đơn vị được giao trả lời |
| trang_thai | varchar(30) |  | Không | Nhận, phân loại, xử lý hoặc trả lời |
| tao_luc | timestamptz |  | Không | Mốc nhận |

Bảng 4.0: Từ điển dữ liệu thông điệp nhận và chống lặp

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh nội bộ |
| he_thong_id | uuid | FK he_thong_ket_noi | Không | Nguồn đã xác thực |
| ma_thong_diep | varchar(150) |  | Không | Mã sự kiện bên ngoài |
| bam_noi_dung | char(64) |  | Không | So sánh nội dung gửi lại |
| ho_so_id | uuid | FK ho_so | Có | Liên kết sau khi xác định hồ sơ |
| trang_thai | varchar(30) |  | Không | Nhận, áp dụng, trùng hoặc cần đối chiếu |
| nhan_luc | timestamptz |  | Không | Mốc nhận |
| ma_loi | varchar(100) |  | Có | Lỗi xác thực hoặc nghiệp vụ |
| thu_tu_nguon | bigint |  | Không | Thứ tự trong luồng hồ sơ tại nguồn |
| thoi_diem_nguon | timestamptz |  | Không | Mốc phát sinh nghiệp vụ tại nguồn |
| loai_su_kien | varchar(40) |  | Không | Loại sự kiện theo hợp đồng |
| ma_ho_so_ngoai | varchar(150) |  | Không | Mã để xác định hồ sơ ở nguồn |
| tham_chieu_noi_dung | text |  | Không | Nội dung được bảo vệ để áp dụng và kiểm chứng |

Bảng 4.0: Từ điển dữ liệu điểm tiếp nhận theo hiệu lực

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh điểm phục vụ |
| ma | varchar(50) | UQ | Không | Mã điểm trong danh mục |
| co_quan_id | uuid | FK co_quan | Không | Đơn vị quản lý điểm |
| ten | text |  | Không | Tên điểm |
| dia_chi | text |  | Không | Địa chỉ công khai |
| hieu_luc_tu | timestamptz |  | Không | Bắt đầu phục vụ |
| hieu_luc_den | timestamptz |  | Có | Kết thúc hoặc chuyển điểm |

Bảng 4.0: Từ điển dữ liệu phiên bản mẫu và công thức báo cáo

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh mẫu phiên bản |
| ma | varchar(50) |  | Không | Mã mẫu |
| so_phien_ban | integer |  | Không | Phiên bản công thức |
| ten | text |  | Không | Tên và mục đích |
| dinh_nghia | jsonb |  | Không | Tử số, mẫu số, bộ lọc và loại trừ |
| nguon_du_lieu | jsonb |  | Không | Hệ thống và mốc lấy dữ liệu |
| phe_duyet_id | uuid | FK tai_khoan | Không | Người duyệt định nghĩa |
| hieu_luc_tu | timestamptz |  | Không | Bắt đầu áp dụng |
| hieu_luc_den | timestamptz |  | Có | Kết thúc áp dụng |

Bảng 4.0: Từ điển dữ liệu nguồn hướng dẫn có phiên bản

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh nguồn |
| ten | text |  | Không | Tên tài liệu |
| can_cu | text |  | Không | Nguồn và thẩm quyền ban hành |
| so_phien_ban | integer |  | Không | Phiên bản được dùng |
| dia_chi | text |  | Không | Địa chỉ hoặc khóa tài liệu |
| bam_sha256 | char(64) |  | Không | Toàn vẹn bản đã duyệt |
| phe_duyet_id | uuid | FK tai_khoan | Không | Người duyệt dùng hướng dẫn |
| hieu_luc_tu | timestamptz |  | Không | Mốc áp dụng |
| hieu_luc_den | timestamptz |  | Có | Mốc hết áp dụng |
| trang_thai | varchar(30) |  | Không | Duyệt, thay thế hoặc thu hồi |

Bảng 4.0: Từ điển dữ liệu tài liệu kho của tổ chức, cá nhân

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh bản tài liệu |
| chu_the_id | uuid | FK chu_the | Không | Chủ thể sở hữu quyền khai thác |
| ket_qua_id | uuid | FK ket_qua | Có | Bản kết quả nếu có |
| thanh_phan_id | uuid | FK thanh_phan_ho_so | Có | Thành phần nếu có |
| loai | varchar(100) |  | Không | Loại tài liệu |
| nguon | text |  | Không | Cơ quan cấp và tham chiếu nguồn |
| khoa_doi_tuong | text |  | Không | Bản lưu được bảo vệ |
| bam_sha256 | char(64) |  | Không | Toàn vẹn bản lưu |
| hieu_luc_tu | timestamptz |  | Có | Bắt đầu giá trị sử dụng nếu áp dụng |
| hieu_luc_den | timestamptz |  | Có | Kết thúc giá trị sử dụng nếu áp dụng |
| thay_the_id | uuid | FK tai_lieu_kho | Có | Bản được thay thế |
| trang_thai | varchar(30) |  | Không | Chờ kiểm tra, hợp lệ hoặc bị thay thế |

Bảng 4.0: Từ điển dữ liệu quyền khai thác tài liệu kho

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh lần cấp |
| tai_lieu_id | uuid | FK tai_lieu_kho | Không | Tài liệu được khai thác |
| chu_the_id | uuid | FK chu_the | Không | Chủ thể được phép |
| muc_dich | text |  | Không | Phạm vi và mục đích |
| can_cu | text |  | Không | Căn cứ quyền hoặc đại diện |
| hieu_luc_tu | timestamptz |  | Không | Bắt đầu quyền |
| hieu_luc_den | timestamptz |  | Có | Kết thúc quyền |
| trang_thai | varchar(30) |  | Không | Có hiệu lực hoặc thu hồi |

Bảng 4.0: Từ điển dữ liệu chỉ đạo và trách nhiệm phản hồi

| Tên trường | Kiểu dữ liệu | Khóa | Rỗng | Diễn giải |
| --- | --- | --- | --- | --- |
| id | uuid | PK | Không | Định danh nhiệm vụ |
| ho_so_id | uuid | FK ho_so | Có | Hồ sơ liên quan nếu có |
| co_quan_id | uuid | FK co_quan | Không | Phạm vi điều hành |
| nguoi_giao_id | uuid | FK tai_khoan | Không | Người ra chỉ đạo |
| nguoi_nhan_id | uuid | FK tai_khoan | Có | Người thực hiện |
| noi_dung | text |  | Không | Nhiệm vụ có căn cứ |
| tao_luc | timestamptz |  | Không | Thời điểm giao |
| han_phan_hoi | timestamptz |  | Không | Mốc phản hồi nhiệm vụ |
| trang_thai | varchar(30) |  | Không | Giao, xử lý hoặc hoàn thành |
| tham_chieu_phan_hoi | text |  | Có | Bằng chứng thực hiện |
| phien_ban | integer |  | Không | Kiểm soát cập nhật đồng thời |
