# Báo cáo trạng thái sau khi sửa đối chiếu HRMS

**Ngày cập nhật:** 04/10/2026  
**Phạm vi:** mã nguồn và tài liệu chính trong thư mục dự án HRMS. Báo cáo đối chiếu gốc [`BAO_CAO_DOI_CHIEU_HE_THONG_20261004.md`](BAO_CAO_DOI_CHIEU_HE_THONG_20261004.md) được giữ làm ảnh chụp trước sửa để truy vết phát hiện; các kết luận “chưa có/không đúng” trong ảnh chụp đó không đại diện trạng thái mới.

## Kết quả

Các lỗi cốt lõi về quyền, phạm vi dữ liệu, tính lương, chấm công và ngày hiệu lực đã được sửa trong mã. Những quy trình trước đây dừng ở đổi trạng thái đã được nối thêm điều kiện nghiệp vụ, vai trò duyệt, lịch sử và tác động liên phân hệ. Giao diện các nghiệp vụ mới đã có trang thao tác. Không thể kết luận mọi use case đã hoàn tất toàn diện: một số yêu cầu phần cứng, chứng từ vật lý và vận hành trên DB thật vẫn còn giới hạn được nêu dưới đây.

| Nhóm phát hiện trong báo cáo trước | Trạng thái sau sửa |
|---|---|
| F01–F03: thiếu RBAC, lộ hồ sơ qua API khác, vai trò không khớp | Đã thêm kiểm tra vai trò hiện hành trong DB, quyền theo controller/action, phạm vi hồ sơ và ràng buộc tự phục vụ; tách người khởi tạo/người duyệt ở luồng nhạy cảm. Ma trận role/module có kiểm tra đầu vào và được guard dùng để thu hẹp quyền. |
| F04–F06: hai công thức lương, phiếu lương không khớp, giả định thuế cũ | Hai API dùng chung calculator; phiếu lương lấy từ kết quả đã lưu; có sổ công chốt làm đầu vào, snapshot dữ liệu và chu trình rà soát/duyệt/khóa/chi trả. Cấu hình thuế theo mốc năm trong mô hình bài tập. Cần xác minh pháp lý và chính sách doanh nghiệp trước khi sử dụng thực tế. |
| F07–F09: ca không điều khiển công, điều chỉnh sai, thiếu chốt công | Chấm công tính theo lịch phân ca/ngày/qua đêm và giờ nghỉ; điều chỉnh được bảo toàn khi tính lại; thêm chốt/mở lại kỳ với điều kiện và lý do. Ngày Văn hóa Việt Nam 24/11 được đưa tự động vào lịch từ năm 2026; ngày Tết/nghỉ bù theo năm cần cấu hình. |
| F10: tuyên bố IR/Face ID vượt quá khả năng | Giao diện/code không giả định cảm biến IR/3D. Phần nhận diện vẫn là demo trình duyệt; kiểm tra độ sống và SDK thiết bị thật chưa triển khai. |
| F11–F15: nghỉ/OT/tuyển dụng/ESS/hồ sơ/quyết định chưa xuyên suốt | Thêm kiểm tra trùng/hạn mức/giao dịch cho nghỉ phép và OT; nối tuyển dụng đến offer được chấp thuận, hồ sơ thử việc và onboarding; ESS dùng API thật; hồ sơ đổi trường đúng model và cần minh chứng; quyết định nhân sự áp dụng theo ngày hiệu lực và đồng bộ lịch sử liên quan. |
| F16–F17: KPI, đào tạo, khiếu nại nông | Chuẩn hóa công thức thật: điểm mỗi mục tiêu = tự đánh giá 20% + đồng nghiệp 30% + quản lý 50%; điểm chu kỳ cộng theo trọng số mục tiêu đủ 100%. Đã bỏ mô tả sai 60/20/20, hạn ngạch xếp loại và thưởng tự động. Đã thêm chuỗi đánh giá năng lực qua kỳ, minh chứng và kế hoạch phát triển; vẫn cần dữ liệu nghiệp vụ đủ để chứng minh kết quả. |
| F18: vay/chi phí/tài sản không đối soát | Trả nợ có điều kiện; tài sản có nhật ký giao/nhận và xác nhận điện tử của nhân viên; claim chi phí có chứng từ, duyệt độc lập, khóa đối soát và thu hồi tạm ứng dư từng phần. |
| F19: tài liệu và tìm kiếm không đi qua KMS | Tài liệu có trạng thái, lịch sử phiên bản; kho tri thức có soạn–duyệt–xuất bản; tìm kiếm nội dung đã được nối từ thanh tìm kiếm desktop/mobile. Tệp nhạy cảm chuyển sang API tải xuống có xác thực/quyền; static `/uploads` đã bỏ. |
| F20–F23: vòng lặp tổ chức, cài đặt/audit, seed và chất lượng dữ liệu | Chặn chuyển tổ chức vào nhánh con; cấu hình được xác thực; actor audit là người thật; seed không phá dữ liệu hiện hữu và bỏ giá trị định danh bịa đặt. Dữ liệu minh họa vẫn cần gắn nhãn khi trình diễn. |

## Sửa các nội dung demo và biểu mẫu

Đã loại khỏi đầu ra thông tin mẫu: danh sách người học, điểm 100%, khảo sát 5/5, biên bản khiếu nại có người họp/ký giả, hợp đồng vay gắn NĐ30 và địa điểm Hà Nội. Các bản này chỉ in trường có trong hồ sơ và ghi rõ là bản nội bộ. KPI đào tạo lấy số ghi danh, hoàn thành và phản hồi thực tế; không hiển thị số hài lòng cố định. Phần đầu tài liệu nội bộ dùng tên tổ chức đã cấu hình; bố cục này không chứng minh tuân thủ NĐ30.

Đã sửa hướng dẫn KPI 20/30/50 theo backend và ghi rõ hiện chưa tự phát sinh thưởng/lương. Các biểu mẫu công chức NĐ335/2025 và viên chức NĐ233/2026 là hạng mục chưa làm; màn hình liên kết văn bản hiện hành thay cho mẫu NĐ90 cũ.

## Mức độ bao phủ quy trình

- **Đã có luồng nghiệp vụ liên kết và khóa trạng thái:** attendance → regularization → period close → payroll; tuyển dụng → requisition/approval → interview/offer → ứng viên chấp thuận → hồ sơ thử việc/onboarding; quyết định nhân sự → ngày hiệu lực → lịch sử hợp đồng/lương/tổ chức; claim → chứng từ/duyệt → settlement; khoản vay → đồng ý khấu trừ → phê duyệt → kế toán ghi phương thức/mã giải ngân → kỳ lương mới được khấu trừ.
- **Đã thêm biểu mẫu thao tác:** xác nhận ngân hàng/người phụ thuộc kèm chứng từ; giải trình công; mượn/trả hồ sơ gốc; đánh giá thử việc; onboarding; chốt/mở lại công; quản lý tuyển dụng và kho tri thức.
- **Còn một phần:** đồng bộ email tự động; khai báo lương/thuế/BHXH cho toàn bộ ngoại lệ; bằng chứng ngân hàng thật; một số biểu mẫu pháp quy chưa tích hợp. Theo phạm vi yêu cầu, sơ yếu lý lịch được loại khỏi đợt so khớp. Biểu 02-TT đã được đối chiếu các trường với Phụ lục I TT99/2025; còn phải kiểm tra bản in cuối. Biểu 01–03 là báo cáo nội bộ. Biểu đánh giá công chức theo NĐ335/2025 và viên chức theo NĐ233/2026 chưa được tích hợp; trang đánh giá hiện dùng mẫu nội bộ.

## Kiểm chứng kỹ thuật

Backend/frontend typecheck và production build đều đạt; backend hồi quy đạt **45/45**. PostgreSQL cô lập `kms_e2e` đã được làm mới từ đầu và E2E đạt **1/1**, chạy qua công → giải trình → khóa công → tính/đối soát/duyệt/khóa/chi lương, xác nhận nhận tài sản, hoàn ứng dư, năng lực và khoản vay: thiếu chấp thuận bị chặn; duyệt vay chưa tạo khấu trừ; kế toán ghi phương thức/mã giải ngân; kỳ lương sau mới ghi khấu trừ và giảm dư nợ.

Trước migration cuối đã sao lưu DB `kms` vào `kms-pre-loan-disbursement-20261004.dump`. Migration `20261004030000_loan_disbursement_evidence` đã áp dụng thành công; Prisma xác nhận **10/10 migration** và schema up to date. E2E ghi dữ liệu thử trên `kms_e2e`, không tạo kỳ công nghiệp vụ trong DB `kms`.

Đã đồng bộ 131 chú thích hình giữa Word và Markdown, sửa sơ đồ UC28 bị lẫn nội dung UC42 và thay liên kết Markdown thô trong phần quy trình lương. Bản Word được render lại; đã kiểm tra trực quan các trang bị ảnh hưởng (92–93, 122, 158–159) và phụ lục (210–212); trang phân cách 209 để trống theo chủ ý bố cục.

## Việc còn lại trước khi coi là sản phẩm vận hành

1. Migration đã chạy trên DB hiện tại sau khi backup và thử DB mới; trước khi triển khai môi trường khác vẫn cần thử trên bản sao dữ liệu riêng của môi trường đó.
2. E2E hiện kiểm tra các luồng ghi được nêu trong yêu cầu bằng API thật và PostgreSQL cô lập. Còn cần kiểm tra UI với nhiều vai trò, giao dịch đồng thời, tệp đính kèm, tuyển dụng nhận việc và lỗi giữa bước.
3. Tệp tải xuống có kiểm tra xác thực/quyền; trước khi nạp hồ sơ thật cần kiểm tra cả từng loại chủ sở hữu tệp và cấu hình storage ngoài production.
4. Quy trình lương đã đối chiếu luật/nguồn hướng dẫn có hiệu lực đến 04/10/2026 và có tài liệu riêng [`QUY_TRINH_TINH_LUONG_VN_THAM_CHIEU_2026.md`](QUY_TRINH_TINH_LUONG_VN_THAM_CHIEU_2026.md). Đây vẫn là baseline bài tập: cần cấu hình theo loại lao động, chứng từ thực, quyết toán/nộp thuế và BHXH, bằng chứng chi lương, ngoại lệ OT, và phê duyệt chính sách doanh nghiệp. Lịch nghỉ áp dụng 24/11 theo Nghị quyết 28/2026/QH16; các ngày Tết/nghỉ bù cần quản trị cấu hình theo năm qua API.
Tham chiếu gốc: [Công báo TT99/2025/TT-BTC và mẫu 02-TT](https://congbao.chinhphu.vn/tai-ve-van-ban-so-99-2025-tt-btc-46529-59631); [Nghị định 335/2025/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=216292&pageid=27160&typegroupid=4); [Nghị định 233/2026/NĐ-CP](https://vanban.chinhphu.vn/?docid=218616&pageid=27160&typegroupid=4).

5. Bản 02-TT chỉ dùng cho phiếu chi tiền mặt và tách khỏi đề nghị nội bộ/chuyển khoản; các trường của Phụ lục I TT99/2025 đã được đối chiếu (người nhận, địa chỉ, lý do, số tiền/số tiền bằng chữ, chứng từ kèm theo, số quyển/số phiếu, Nợ/Có, năm chữ ký, nhận đủ tiền, quy đổi ngoại tệ). Doanh nghiệp vẫn cần xác nhận bản in, điền số/tài khoản/chữ ký thật và có thể thiết kế biểu mẫu theo yêu cầu quản lý.

Các khẳng định trong báo cáo trước về chưa chạy E2E, chưa có xác nhận tài sản, chưa có hoàn ứng dư và chưa bảo vệ tệp là thông tin trước sửa. Phần “còn một phần” ở trên nêu đúng các giới hạn hiện tại sau sửa.

