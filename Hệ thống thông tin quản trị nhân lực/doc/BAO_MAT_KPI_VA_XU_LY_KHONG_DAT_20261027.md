# Phạm vi KPI và hướng dẫn khi không đạt — 27/10/2026

API mục tiêu trước đợt sửa đã lọc USER về chính tài khoản. Chưa tái hiện được việc API này trả mục tiêu của đồng nghiệp cho USER thuần. Tuy nhiên, API chu kỳ trả nguyên danh sách người tham gia và tổng số mục tiêu; mục tiêu trả kèm chu kỳ cũng lộ danh sách này. Giao diện dùng khóa cache chung giữa tài khoản, không tự lọc lại KPI cá nhân và tải danh bạ nhân viên cả khi chỉ xem cá nhân. Đây là các điểm đã được siết lại, chưa đủ bằng chứng kết luận cache là nguyên nhân duy nhất của hiện tượng người dùng báo.

- USER và các role cá nhân chỉ nhận KPI/minh chứng của chính mình; truy vấn rõ userId khác trả 403.
- LINE_MANAGER chỉ xem bản thân và nhân sự cùng đơn vị theo phạm vi hiện hành; truy vấn ngoài đơn vị trả 403.
- ADMIN, KM_MANAGER, HR_TRAINER, HR_CB, BOD giữ phạm vi quản trị đánh giá đã có.
- Chu kỳ chỉ trả danh sách người tham gia và số mục tiêu thuộc phạm vi. Kỳ SELECTED không liên quan bị loại, lịch kỳ COMPANY có thể xem nhưng không lộ danh sách/số mục tiêu của người khác. Chu kỳ lồng trong mục tiêu cũng được lọc danh sách người tham gia.
- Giao diện tách cache KPI theo tài khoản và tập role, chỉ chạy truy vấn sau khi biết tài khoản. Giao diện cá nhân chỉ giữ mục tiêu có userId của mình, không tải danh bạ nhân viên hay kết luận hiệu chỉnh công vụ không thuộc quyền.
- Thư viện KPI dùng chung là mục tiêu mẫu, không phải kết quả đánh giá cá nhân.

KPI doanh nghiệp hiện lưu điểm và xếp loại: 90–100 xuất sắc, 75–dưới 90 tốt, 50–dưới 75 hoàn thành, dưới 50 không hoàn thành. Một mục tiêu không đạt chỉ tiêu không tự làm cả kỳ không hoàn thành; tổng kỳ cộng theo trọng số. Điểm 0 vẫn là đã chấm, thiếu điểm/minh chứng là chưa đủ căn cứ đánh giá. Hệ thống không tự khấu trừ lương, kỷ luật hoặc tạo quyết định thôi việc từ KPI. Chưa có luồng kế hoạch cải thiện riêng cho KPI; hướng dẫn nêu cách quản lý phản hồi, ghi nguyên nhân, thống nhất hỗ trợ/hạn rà soát và theo dõi bằng mục tiêu kỳ tiếp theo.

Kiểm tra: typecheck frontend/backend, build Docker API/web, 3/3 unit test điều kiện đóng kỳ và 14/14 E2E trên PostgreSQL tách biệt. E2E kiểm tra USER, quản lý cùng đơn vị, HR, chặn xem userId khác, giới hạn chu kỳ/số mục tiêu/minh chứng, chặn thêm minh chứng của người khác và chặn nhân viên tự chấm. Tổng kỳ điểm 0 trả UNSATISFACTORY nhưng không thay lương hồ sơ. Không thêm migration.

Đã thay container API/web tại localhost:3001/8080, cả hai healthy. Kiểm thử trình duyệt với dữ liệu API giả lập trộn cả KPI người khác: màn cá nhân chỉ hiển thị mục tiêu của mình và điểm 0/100, không gọi danh bạ nhân viên hay kết luận công vụ, không hiện nội dung KPI/minh chứng người khác. Hướng dẫn “Nếu nhân viên không đạt KPI thì sao?” đã có trên bản web đang chạy; không có lỗi JavaScript trong lượt kiểm thử.

## Tổng quan quản lý KPI

Bổ sung tab **Tổng quan quản lý** trong trang Đánh giá KPI doanh nghiệp, mở mặc định cho các vai trò quản lý đánh giá. Người dùng cá nhân vẫn vào mục tiêu của mình và API tổng quan trả 403 cho USER.

- Chọn kỳ và đơn vị để xem đối tượng thuộc quyền. Kỳ SELECTED lấy đúng danh sách đã chọn; kỳ COMPANY bổ sung người đủ điều kiện thời gian đánh giá. Bao gồm người chưa có mục tiêu, không chỉ đếm các mục tiêu đã tạo.
- Bốn ô thống kê bấm để lọc: nhân sự trong phạm vi, chưa giao KPI, chưa đủ đánh giá và cần hỗ trợ.
- Thanh tiến độ tổng thể hiện số người đủ căn cứ đánh giá, không phải mức hoàn thành chỉ tiêu. Mỗi nhân viên có hai thanh số KPI có minh chứng và số KPI đã chấm, kết quả tổng hợp và bước xử lý tiếp theo.
- Thiếu mục tiêu, trọng số không đủ 100%, thiếu minh chứng hoặc thiếu điểm đều có điểm tổng hợp null, không coi là 0. Chỉ đủ cả ba điều kiện trọng số/điểm/minh chứng mới cộng điểm theo trọng số. Dưới 50 điểm được đưa vào nhóm cần hỗ trợ; 50 điểm trở lên đã hoàn thành đánh giá và được hiển thị xếp loại tương ứng.
- Bảng ưu tiên người chưa giao, lỗi trọng số, thiếu minh chứng, chờ chấm, cần hỗ trợ rồi đã đủ đánh giá. Có tìm kiếm, xuất bảng và nút mở KPI của nhân viên theo đúng kỳ. Người chưa có KPI có thể được giao ngay từ dòng; chặn tự giao cho chính tài khoản và chặn giao khi kỳ đã đóng.
- Cờ quá hạn chỉ báo quá ngày kết thúc kỳ và hồ sơ chưa đủ đánh giá, không giả định thời hạn từng KPI. Đây là công cụ rà soát và hỗ trợ quyết định; chưa phải luồng kế hoạch cải thiện có phê duyệt riêng, chưa có biểu đồ xu hướng nhiều kỳ hay tự động tính thưởng.

API `GET /hrms/performance/overview?cycleId=...` chỉ cho ADMIN/KM_MANAGER/HR_TRAINER/HR_CB/LINE_MANAGER/BOD. Phạm vi quản lý bộ phận được áp dụng trước khi lấy nhân sự/mục tiêu. E2E kiểm tra đủ sáu trạng thái, người không có mục tiêu, điểm 0 và ngưỡng 50, chặn USER và loại người ngoài đơn vị; 14/14 E2E qua trên DB tách biệt. Không thêm migration.

Đã build và thay API/web Docker, cả hai healthy. Kiểm thử trình duyệt trên web đang chạy với dữ liệu giả lập: tổng quan mở mặc định cho KM_MANAGER; bộ lọc cần hỗ trợ chỉ giữ người có điểm thấp; Mở KPI chuyển đúng nhân viên/kỳ; Giao mục tiêu mở đúng biểu mẫu từ dòng chưa có KPI. Đã xem ảnh 1440px và 375px sau khi bố cục ổn định; không tràn ngang trang và không có lỗi JavaScript. Chạy lại kiểm thử KPI cá nhân vẫn qua, không hiển thị KPI người khác hoặc gọi các nguồn dữ liệu ngoài quyền.

## Làm gọn các tab đánh giá

Bỏ hai thẻ thống kê lặp lại phía trên các tab cũ. Bỏ đường kẻ trang, đường kẻ kép quanh thanh tab/bộ lọc và các đường phân cách trang trí giữa nội dung/chân thẻ; tab đang chọn dùng nền trung tính nhẹ. Giữ viền bảng/thẻ và đường phân hàng dữ liệu. Các bộ lọc co giãn theo màn hình.

Nếu nhân viên đang chọn không có mục tiêu trong bộ lọc hiện tại, vẫn hiển thị tên nhân viên kèm “Chưa có KPI trong bộ lọc”, thay vì rơi về UUID. Có nút “Bỏ lọc nhân viên” để quay lại danh sách. Không đổi quyền truy cập, cách chấm hoặc dữ liệu KPI.

Đã build frontend và thay web Docker. Kiểm thử bốn tab cũ (mục tiêu, biểu mẫu, quy ước, chu kỳ) ở 1440px/375px, không tràn ngang, không lỗi JavaScript; kiểm tra header không còn viền dưới. Kiểm thử từ tổng quan → giao cho nhân viên chưa có KPI → hủy → mở mục tiêu xác nhận bộ lọc vẫn hiển thị tên đúng, bỏ lọc được và mở lại KPI bình thường.
