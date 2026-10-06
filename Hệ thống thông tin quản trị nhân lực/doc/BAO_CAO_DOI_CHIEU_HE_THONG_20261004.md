**BÁO CÁO ĐỐI CHIẾU TÀI LIỆU VÀ HỆ THỐNG QUẢN TRỊ NHÂN LỰC**

**Lưu ý trạng thái:** Báo cáo này là ảnh chụp trước khi sửa, giữ nguyên để truy vết 23 phát hiện ban đầu; không dùng kết luận lỗi cũ làm trạng thái hiện tại. Báo cáo cập nhật sau sửa: [BAO_CAO_TRANG_THAI_SAU_SUA_20261004.md](BAO_CAO_TRANG_THAI_SAU_SUA_20261004.md).

Ngày kiểm tra: 04/10/2026. Phạm vi: thư mục `Hệ thống thông tin quản trị nhân lực`, gồm tài liệu Word/Markdown, frontend, backend, lược đồ dữ liệu, dữ liệu mẫu và bộ kiểm tra hiện có. Đây là báo cáo kiểm tra; không sửa mã nguồn hoặc tài liệu gốc.

**1. Kết luận trực tiếp**

Hệ thống **chưa đồng bộ hoàn toàn với tài liệu, chưa hoàn chỉnh các quy trình và đang có những mâu thuẫn chức năng đáng kể**. Dự án có độ rộng tốt cho bài tập: 47 use case trong tài liệu chính, 39 tệp module trong thư mục nghiệp vụ (41 nếu tính thêm app và Prisma), 87 model Prisma, 40 enum và 33 tệp trang giao diện. Tuy nhiên, số lượng màn hình/bảng không chứng minh một nghiệp vụ đã vận hành xuyên suốt. Nhiều phân hệ dừng ở thêm–xem–sửa–xóa, chưa thực hiện đúng phê duyệt, ngày hiệu lực, phân quyền theo người/phòng ban, khóa kỳ hoặc đồng bộ sang lương.

| Tiêu chí người dùng yêu cầu | Đánh giá | Căn cứ chính |
|---|---|---|
| Đồng bộ tài liệu ↔ hệ thống | Một phần; có chênh lệch quan trọng | Hai bộ tính lương; UI dùng luồng mới nhưng tài liệu mô tả luồng cũ; quyền và công thức khác nhau |
| Đủ các quy trình | Chưa đủ | Thiếu quy trình mượn hồ sơ gốc, đánh giá thử việc, chốt công tháng; nhiều phê duyệt chỉ là đổi trạng thái |
| Chiều sâu thông tin | Rộng về trường dữ liệu, thiếu chiều sâu vận hành | Có hồ sơ và lịch sử, nhưng chưa đảm bảo nguồn gốc, hiệu lực, đối soát, trạng thái và tác động liên phân hệ |
| Chất và lượng dữ liệu | Đủ để trình diễn nhiều màn hình; chưa đủ để chứng minh nghiệp vụ đúng | Dữ liệu mẫu đồng dạng/ngẫu nhiên; chưa kiểm chứng số nhân viên thực tế trong DB; thiếu tình huống biên |
| Mâu thuẫn chức năng | Có, cần sửa trước khi bổ sung tính năng | Lương–công; ca–chấm công; nghỉ việc–tài khoản–lương; quyền trên menu–quyền API; điểm KPI trên UI–backend–tài liệu |

Không đưa ra tỷ lệ “hoàn thành bao nhiêu %” hoặc điểm môn học: chưa có tiêu chí chấm của giảng viên và chưa chạy được toàn bộ hệ thống với cơ sở dữ liệu thật.

**2. Tài liệu nào là chuẩn đối chiếu?**

| Tài liệu | Phạm vi nhận diện | Cách sử dụng trong kiểm tra |
|---|---|---|
| [doc/PTTK_OOP_HR.docx](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/doc/PTTK_OOP_HR.docx>) và [doc/PTTK_OOP_HR.md](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/doc/PTTK_OOP_HR.md>) | HRMS tại Saigon Technology, 47 UC | Chuẩn đối chiếu chính, phù hợp README của dự án |
| [doc/anan-copy.docx](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/doc/anan-copy.docx>) | Bối cảnh MWG/Thế Giới Di Động | Tài liệu khác bối cảnh; cần ghi rõ là tham khảo hay phiên bản cũ |
| [doc/PTTK_HTTT_KPI.docx](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/doc/PTTK_HTTT_KPI.docx>) | Hệ thống KPI riêng, BSC/ASK và các yêu cầu chuyên biệt | Không thể mặc định được thực hiện đầy đủ chỉ vì HRMS có trang KPI |

Ba file Word không phải ba bản tương đương của cùng một đặc tả. Nếu tất cả đều là tài liệu nộp chính thức, cần thống nhất doanh nghiệp, phạm vi, thuật ngữ và yêu cầu trước. Nếu hai file sau chỉ tham khảo, hãy ghi rõ ở README và tên file. Nội dung chuẩn cán bộ/Mẫu 2C/ngạch NĐ 204 cũng cần được giải thích là phạm vi mở rộng hoặc chế độ riêng khi bối cảnh chính là doanh nghiệp công nghệ.

Tài liệu chính có đầu tư: đặc tả 47 UC, ma trận trách nhiệm, mô hình và mô tả ngoại lệ. Vấn đề lớn là một số tuyên bố vượt quá khả năng hiện thực. Ví dụ: phần tổng hợp gọi 18 quy trình nhưng Bảng 2.3 liệt kê 21 dòng; số vai trò và số trang thay đổi giữa các phần; tài liệu nói 31 trang trong khi mã có 33 `page.tsx` gồm cả trang chuyển hướng/trang động. Cần có quy tắc đếm thống nhất. Chưa có bằng chứng trong lần kiểm tra này để xác nhận tuyên bố 383 người dùng, 39/39 kiểm tra đầu-cuối hoặc mọi UI dưới 100 ms.

**3. Những lỗi và mâu thuẫn cần ưu tiên**

Quy ước: **Ưu tiên 1** = ảnh hưởng quyền truy cập, số tiền, công, dữ liệu hoặc trạng thái nhân sự; **Ưu tiên 2** = thiếu liên kết/quy trình, chất lượng thông tin và độ tin cậy của tài liệu. “Đã tái hiện” bên dưới nghĩa là chạy mã thật trong môi trường cô lập với dữ liệu giả lập; không đồng nghĩa đã chạy trên DB thật.

**F01 — Quyền truy cập ở các API HRMS mới quá rộng — Ưu tiên 1, đã tái hiện.**

Các controller `hrms-*` có xác thực đăng nhập nhưng thiếu giới hạn vai trò tại nhiều thao tác nhạy cảm. `RolesGuard` cho qua nếu không có metadata `@Roles`; `@ApiBearerAuth` chỉ mô tả API. Với token mang vai trò `USER`, kiểm tra cô lập nhận 200/201 khi xem toàn bộ kỳ lương, tạo thành phần lương, xóa kỳ lương, xem khiếu nại người khác và duyệt khoản vay. Ẩn menu không ngăn được gọi trực tiếp API. Nhiều thao tác ghi người thực hiện là `'system'`, không phải người đang đăng nhập. Cần quyền cho từng hành động, giới hạn phạm vi bản ghi và tách người đề nghị/người phê duyệt.

**F02 — Bảo vệ hồ sơ ở một API nhưng lộ qua API khác — Ưu tiên 1, đã tái hiện đường truy cập.**

Phân hệ nhân viên có lọc thông tin nhạy cảm đối với `USER`, nhưng `personnel-profiles/:userId` cho `USER` đọc hồ sơ đầy đủ của một ID khác mà không kiểm tra chủ sở hữu. API báo cáo `2c-profile/:userId` cũng cho vai trò này truy cập. Hồ sơ có các nhóm căn cước, gia đình, lịch sử lương và thông tin cá nhân sâu. Đây là mâu thuẫn giữa quyền danh bạ và quyền hồ sơ. Cần dùng một chính sách chung: nhân viên xem hồ sơ của mình; chuyên viên có quyền theo chức năng/phạm vi; dữ liệu nhạy cảm được lọc theo trường.

**F03 — Vai trò thiết kế không thực hiện được đúng trách nhiệm — Ưu tiên 1, đã tái hiện.**

Tài liệu/menu có Giám đốc và Trưởng dự án, nhưng API cũ còn dùng chủ yếu `ADMIN`/`KM_MANAGER`. Token `BOD` bị 403 khi khóa kỳ lương cũ; `LINE_MANAGER` bị 403 khi duyệt nghỉ phép. Ngược lại, API mới thiếu giới hạn như F01. Ma trận quyền lưu trong cài đặt không được `RolesGuard` sử dụng để thực thi; quyền trong JWT cũng không tự cập nhật ngay khi sửa ma trận. Cần thống nhất một mô hình quyền từ tài liệu, menu, API đến phạm vi phòng ban và kiểm tra thu hồi quyền.

**F04 — Hai bộ tính lương cho hai kết quả khác nhau — Ưu tiên 1, đã tái hiện.**

`payroll` và `hrms-payroll` cùng được nạp nhưng dùng model, công thức và chu trình khác nhau. Với lương cơ bản 15.000.000 đồng, không có công và không có OT:

| Kết quả | Bộ `payroll` cũ | Bộ `hrms-payroll` mà trang payroll-engine sử dụng |
|---|---:|---:|
| Ngày công | 0 | 22, tự giả định vì cả kỳ chưa có dữ liệu |
| Thuế tính ra | 1.126.250 | 200.000 |
| Thực nhận | 12.298.750 | 13.955.004 |

Chênh 1.656.254 đồng; cả hai kết quả đều cần xem lại quy tắc, không chọn một kết quả làm chuẩn chỉ vì cao/thấp hơn. Bộ cũ không quy đổi lương cơ bản theo công và khai báo giảm trừ tháng là `11.000.000 / 12`. Bộ mới dùng 22 công mặc định, thuế phẳng 5%, không trừ bảo hiểm khi xác định phần tính thuế, không tính OT/thưởng/vay theo mô tả UC27 và không sử dụng cấu trúc lương đã gán. `baseSalary || 15000000` còn biến mức 0 thành 15 triệu. Dashboard đọc kỳ lương cũ trong khi UI tạo kỳ mới. Cần chọn một nguồn lương chuẩn và di chuyển các chức năng còn cần từ bộ còn lại.

**F05 — Màn giải thích lương không khớp kết quả backend; khóa lương không bảo vệ luồng đang dùng — Ưu tiên 1.**

UI payroll-engine diễn giải tiền ăn 35.000/ngày và phụ cấp trách nhiệm 1,5 triệu; backend mới tính tiền ăn từ 730.000/22 và không thêm phụ cấp đó. UI trừ bảo hiểm trong phép tính phần chịu thuế, backend mới không trừ. Biểu thức `actualWorkDays || 22` biến 0 công thành 22 công trên phần giải thích. Bộ cũ có DRAFT → CALCULATED → REVIEWED → LOCKED, nhưng bộ mới tạo run PROCESSED/slip APPROVED và cho xóa run mà không kiểm tra khóa. Cần render bảng giải thích từ cùng breakdown với phép tính, và áp dụng chu trình kiểm tra–phê duyệt–khóa cho kỳ mà UI thực sự dùng.

**F06 — Bản thân đặc tả thuế đã lỗi thời so với mốc 2026 — Ưu tiên 1.**

UC26/27 còn nêu giảm trừ 11 triệu/tháng, 4,4 triệu/người phụ thuộc và 7 bậc. Nguồn Chính phủ xác nhận mức giảm trừ 15,5 triệu và 6,2 triệu từ 01/01/2026; hướng dẫn thuế phân biệt biểu 7 bậc năm 2025 và 5 bậc năm 2026. Vì vậy cần cấu hình theo kỳ hiệu lực, sửa tài liệu và lập ví dụ kiểm chứng cho từng năm; không chỉ ép code khớp một đặc tả cũ. Đây là kiểm chứng tham số cụ thể, chưa phải rà soát pháp lý toàn bộ tiền lương. [Nghị quyết 110/2025](https://xaydungchinhsach.chinhphu.vn/nghi-quyet-110-2025-ubtvqh15-dieu-chinh-muc-giam-tru-gia-canh-cua-thue-thu-nhap-ca-nhan-119251110101313787.htm), [hướng dẫn quyết toán và biểu thuế theo năm](https://xaydungchinhsach.chinhphu.vn/huong-dan-quyet-toan-thue-thu-nhap-ca-nhan-doi-voi-thu-nhap-tu-tien-luong-tien-cong-119260306092819051.htm), [cách xác định thu nhập tính thuế](https://xaydungchinhsach.chinhphu.vn/cach-tinh-thue-thu-nhap-ca-nhan-tu-tien-luong-tien-cong-119260623094516526.htm).

**F07 — Phân ca không điều khiển chấm công, lịch hiển thị không phản ánh phân công — Ưu tiên 1.**

Backend lưu ca/phân ca, nhưng chấm công tính muộn/sớm theo giờ môi trường cố định 08:00–17:30. Trang phân ca hiển thị ngày thường 08:00–17:00, cuối tuần nghỉ; file CSV cũng ghi cố định các giá trị này. Khi bấm ô, ngày còn cố định ở tháng 09/2026 thay vì tuần đang xem. Dữ liệu assignment không được dùng để render từng ô. Roster backend giới hạn 20 người, chưa phân trang và chưa lọc đúng khoảng hiệu lực. Cần lấy ca theo nhân viên/ngày, kiểm tra ca trùng, xử lý ca qua đêm và dùng cùng nguồn cho lịch, chấm công, xuất file.

**F08 — Bổ sung công sai số giờ và có thể mất sau tính lại — Ưu tiên 1, đã tái hiện số giờ.**

Duyệt yêu cầu từ 09:00 đến 10:00 tạo `workedMinutes: 480`, tức 1 giờ thành 8 giờ. Nhánh cập nhật cũng không cập nhật đầy đủ số phút. Phê duyệt chỉ sửa bảng tổng hợp ngày, trong khi tính lại công lấy sự kiện gốc và có thể ghi đè sửa đổi. Thiếu kiểm tra trạng thái đang chờ trước khi duyệt lại. Cần lưu điều chỉnh có nguồn gốc, người duyệt và phiên bản; tổng hợp sự kiện cộng điều chỉnh thay vì ghi một số 480 cố định.

**F09 — Chưa có chốt công tháng bảo đảm đầu vào lương — Ưu tiên 1.**

Không tìm thấy model/API vận hành kỳ công với chu trình LOCKED/FINALIZED như UC25. Sửa/bổ sung công chưa bị chặn bởi kỳ công/kỳ lương đã khóa. Nghỉ phép được duyệt cũng chưa cập nhật nguồn công mà lương mới đang đếm. Cần kỳ công có người đối soát, phiên bản, trạng thái khóa và cơ chế mở lại có lý do; lương phải trỏ tới đúng bản công đã chốt.

**F10 — Nhãn Windows Hello/Face ID/3D không tương đương xác thực sinh trắc học — Ưu tiên 1, đã tái hiện.**

Nhánh `WINDOWS_HELLO`, `FACE_ID`, `BIOMETRIC_3D` chỉ kiểm tra đã đồng ý thu thập sinh trắc học rồi gán similarity 0,9995, không xác minh chứng thực phần cứng/chữ ký cho lần điểm danh. Kiểm tra bằng mã thật đã chấp nhận điểm danh khi chỉ có consent, không có credential xác thực phần cứng. README còn xác định nhận diện ảnh đơn giản là demo. Vì vậy không đủ căn cứ cho tuyên bố IR/chống giả mạo 100%. Cần ghi rõ mô phỏng hoặc triển khai xác thực thiết bị thực sự; không dùng điểm cố định làm bằng chứng nhận diện.

**F11 — Nghỉ phép/OT có bước cơ bản nhưng thiếu kiểm soát nghiệp vụ — Ưu tiên 1.**

Nghỉ phép có số dư và phê duyệt, nhưng chưa chặn yêu cầu trùng khoảng, chưa dùng lịch ngày lễ, chưa tách phép qua hai năm và chưa đồng bộ công. Trừ số dư và chuyển trạng thái là các thao tác riêng, có rủi ro duyệt đồng thời/trừ lặp; chưa có hủy phép đã duyệt để hoàn số dư. OT có nhập số giờ và phê duyệt nhưng chưa thể hiện đầy đủ hạn mức theo kỳ, loại ngày/hệ số và trùng thời gian. Đây là các thiếu sót đọc từ mã; chưa chạy thử cạnh tranh giao dịch trên DB thật.

**F12 — Tuyển dụng chưa nối liền định biên → offer → nhận việc — Ưu tiên 2.**

Luồng requisition cũ và opening/applicant/offer mới tách biệt. Chưa có mối ràng buộc bắt buộc “tin tuyển dụng phải thuộc chỉ tiêu/ngân sách đã duyệt”. Đổi giai đoạn ứng viên chưa kiểm tra sơ đồ chuyển trạng thái. Offer tạo bản ghi SENT nhưng chưa chứng minh gửi thư/ký/chấp thuận. Hàm chuyển thành nhân viên chưa buộc offer đã chấp thuận, chưa tạo trọn bộ hợp đồng/thử việc/hội nhập và các bước ghi dữ liệu không nằm trong một giao dịch chung. Cần một khóa liên kết và điều kiện chuyển trạng thái xuyên suốt.

**F13 — Cổng tự phục vụ có đường gọi sai và phạm vi dữ liệu sai — Ưu tiên 1, đã tái hiện một phần.**

ESS gọi `/hrms/attendance/check-in` và `/check-out`, nhưng không có các tuyến tương ứng: kiểm tra nhận 404. “Khoản vay của tôi” dùng `demo-user` nếu không truyền query; API phiếu lương nhận `userId` từ query thay vì luôn lấy người đăng nhập. Vì vậy chữ “của tôi” chưa được bảo đảm ở backend. Riêng nghỉ phép có alias `leave`/`hrms/leave`, không kết luận nhầm toàn bộ đường `/hrms` bị thiếu. Cần kiểm tra từng hành động ESS từ UI tới API và dùng định danh phiên đăng nhập.

**F14 — Thay đổi hồ sơ có giao dịch tốt nhưng lỗi ánh xạ trường — Ưu tiên 1, đã tái hiện dữ liệu ghi sai model.**

Tự cập nhật mức 1 đã đồng bộ User/Profile bằng transaction; duyệt yêu cầu cũng có transaction và thông báo. Tuy nhiên `fullName`/`birthDate` đi vào cả User và `PersonnelComprehensiveProfile`, trong khi model hồ sơ không có hai trường đó. Đã tái hiện payload ghi `fullName` vào model không chứa trường: Prisma thực sẽ từ chối dữ liệu này. Cập nhật trực tiếp hồ sơ còn có các trường chưa đồng bộ về User. Cần bản đồ trường rõ ràng, danh sách cho phép theo cấp, bằng chứng thay đổi và quy tắc tránh tự duyệt.

**F15 — Thôi việc, điều chuyển, tăng lương không tuân thủ ngày hiệu lực — Ưu tiên 1, đã tái hiện nghỉ việc sớm.**

Duyệt đơn nghỉ có hiệu lực 31/12/2099 vẫn lập tức đổi `employmentStatus` thành RESIGNED. Tài khoản không được đổi DISABLED trong luồng đó; lương mới chọn `status: ACTIVE` nên vẫn có thể đưa người đã RESIGNED vào tính, khác với bộ cũ. Điều chuyển/tăng lương cũng áp dụng ngay, chưa bảo đảm thời điểm và đồng bộ phụ lục/lịch sử. Bàn giao có danh sách việc nhưng thiếu người chịu trách nhiệm theo từng bộ phận; đóng bàn giao chưa hoàn tất khóa tài khoản, đối soát nợ và các nghĩa vụ cuối kỳ. Cần trạng thái chờ hiệu lực, tác vụ áp dụng đúng ngày và một quy tắc thống nhất cho “đang làm việc”.

**F16 — Điểm 360 độ có ba cách hiểu, chưa đủ chiều sâu KPI — Ưu tiên 2.**

Tài liệu chia điểm theo người đánh giá: bản thân/đồng nghiệp/quản lý 20%/30%/50%. Giao diện lại giải thích các thành phần đánh giá 60%/20%/20%; đây là một trục trọng số khác, chưa có ánh xạ nối hai cách tổng hợp. Backend gán điểm cuối của mục tiêu trực tiếp bằng điểm quản lý. Chưa có tổng hợp xuyên mục tiêu theo trọng số/nguồn đánh giá như mô tả, thiếu kiểm soát tổng trọng số và khóa kỳ. Đồng bộ sang đánh giá cán bộ là thao tác riêng, chưa chứng minh cùng một kết quả chuẩn. Tài liệu KPI riêng có yêu cầu BSC/ASK và chuẩn hóa sâu hơn; chưa đủ bằng chứng hiện thực toàn bộ. Cần một công thức, minh chứng đầu vào và phiên bản kỳ đánh giá.

**F17 — Đào tạo và khiếu nại mới có bề mặt quản lý — Ưu tiên 2; quyền khiếu nại thuộc Ưu tiên 1.**

Backend đào tạo cũ có ghi danh/hoàn thành, nhưng UI đào tạo mới dùng program/feedback khác, chưa nối đến quản lý học viên, điểm danh, chứng nhận và tác động năng lực sau học. Khiếu nại lưu userId/nội dung, API cho truy cập rộng như F01; chưa bảo đảm yêu cầu bảo mật/ẩn danh trong tài liệu. Cần phân biệt phản hồi khóa học với kết quả học, và phân quyền riêng cho hồ sơ khiếu nại.

**F18 — Vay, công tác/chi phí và tài sản chưa đối soát — Ưu tiên 1.**

Khoản vay có tính EMI và hàm khấu trừ an toàn, nhưng chưa được bộ lương sử dụng; giới hạn theo từng khoản không bảo đảm tổng nhiều khoản. Ghi trả nợ chưa chặn số âm, nên có thể làm tăng dư nợ. Công tác/claim/advance có bản ghi tạo sẵn APPROVED, chưa đi qua đầy đủ quản lý–kế toán–quyết toán; số tiền claim chưa được buộc khớp tổng hạng mục. Tài sản cho cấp lại khi đang cấp, chưa có xác nhận nhận bàn giao và lịch sử giao nhận đầy đủ. Cần một sổ đối soát và các điều kiện tiền/trạng thái, không chỉ thêm biểu mẫu.

**F19 — Kho tri thức và tìm kiếm trên giao diện không dùng quy trình tri thức đã thiết kế — Ưu tiên 2.**

Backend cũ có Space, Article, phiên bản, duyệt bài và tìm kiếm toàn văn. UI `/documents` dùng `HrDocument` CRUD khác, có sửa/xóa trực tiếp; tìm kiếm toàn cục tải danh sách rồi lọc tiêu đề/quy trình ở phía trình duyệt, không dùng API tìm kiếm toàn văn/nội dung hoặc danh bạ chuyên gia như UC45. Có chức năng ở backend không có nghĩa người dùng đi được luồng đó qua UI. Cần nối UI vào luồng chuẩn hoặc điều chỉnh phạm vi UC44/45 trung thực.

**F20 — Cây tổ chức cho phép vòng lặp — Ưu tiên 1, đã tái hiện.**

Điều kiện kiểm tra `unit.path.includes(parentId)` kiểm tra sai hướng. Với B là con A, cập nhật A về dưới B vẫn được chấp nhận, sinh A.parent=B và B.parent=A. Việc này có thể làm sai duyệt theo cấp, thống kê và hiển thị cây. Cần kiểm tra cha mới có thuộc nhánh con hiện tại hay không và cập nhật đường dẫn toàn bộ nhánh trong giao dịch.

**F21 — Cài đặt, nhật ký và dữ liệu nghiệp vụ không dùng cùng nguồn — Ưu tiên 1/2.**

Cài đặt lưu giờ làm/TTL QR/ngưỡng mặt/tham số đăng nhập, nhưng các phần thực thi vẫn đọc biến môi trường hoặc hằng số. Ma trận quyền cũng chưa được guard thực thi. Nhiều phân hệ mới ghi actor `'system'`; bảng audit tham chiếu User, nên nếu không có User tương ứng thao tác ghi nhật ký còn có thể lỗi. AuditService bắt lỗi mà nghiệp vụ vẫn tiếp tục. Chắc chắn mất định danh thật; khả năng lỗi khóa ngoại phụ thuộc DB hiện có. Cần xác định một nguồn cấu hình hiệu lực và đảm bảo lưu vết các thao tác nhạy cảm với đúng actor.

**F22 — Khởi tạo dữ liệu có thể ghi đè hồ sơ đã sửa — Ưu tiên 1.**

`seed.cjs` kiểm tra DB đã có người dùng rồi return trong `main()`, nhưng chuỗi `.then()` vẫn chạy seed mở rộng. Seed hồ sơ upsert lại profile, xóa và tạo lại lịch sử bổ nhiệm/học tập. Entry point gọi seed mỗi lần khởi động nếu `SEED_ON_FIRST_RUN=true`. Vì vậy “chỉ một lần khi DB trống” không đúng với các bước mở rộng; dữ liệu người dùng sửa có thể bị thay bằng mẫu khi khởi động lại. Cần tách migration dữ liệu khỏi demo seed, có cờ bảo vệ bao trùm toàn bộ và thử nghiệm bảo toàn dữ liệu. Đây là phân tích đường chạy; chưa thực thi seed trên DB người dùng.

**F23 — Số trường nhiều nhưng dữ liệu chưa chứng minh đúng nghiệp vụ — Ưu tiên 2.**

Seed có tập 70 nhân sự định danh NV0001…NV0070 và seed bổ sung ghi 43 nhân viên, nhưng các tập có thể giao nhau; không cộng số dòng seed để suy ra số bản ghi thật hoặc xác nhận 383. Danh mục `STANDARD_RANKS` có 20 mục trong khi chú thích seed nói 184. CCCD/BHXH được sinh mẫu, giới tính suy từ tên, nhiều hồ sơ cùng nơi sinh/chiều cao/cân nặng/nhóm máu. Đây là dữ liệu trình diễn, chưa phù hợp để chứng minh chất lượng hồ sơ, thống kê thật hoặc đầy đủ danh mục chuẩn. Cần gắn nhãn dữ liệu giả lập và dùng tình huống đa dạng có đáp án kiểm tra.

**4. Đối chiếu đủ 47 use case của tài liệu chính**

“Có nền” nghĩa là đã có cấu trúc/chức năng đáng kể, vẫn còn hạn chế nêu trong bảng. “Một phần” nghĩa là có màn hình/API nhưng chưa đủ quy trình. “Thiếu luồng” nghĩa là chưa tìm thấy luồng vận hành hoàn chỉnh theo đặc tả; không suy ra tất cả thành phần liên quan đều không tồn tại. Các mã F dẫn tới bằng chứng và phân tích phía trên.

| UC | Chức năng theo tài liệu | Tình trạng | Điểm còn thiếu hoặc mâu thuẫn |
|---|---|---|---|
| 01 | Đăng nhập, xác thực | Có nền | Có kiểm tra auth; quyền thu hồi/đổi vai trò chưa đồng bộ tức thời; không suy rộng 12 test thành mọi luồng xác thực |
| 02 | Người dùng, RBAC | Một phần | Ma trận quyền không điều khiển guard; API mới quá rộng, API cũ thiếu vai trò nghiệp vụ — F01–03 |
| 03 | Cây tổ chức | Một phần | Vòng lặp, chưa bảo đảm định biên/quyền theo nhánh — F20 |
| 04 | Đề xuất tuyển dụng | Một phần | Requisition cũ chưa nối tin tuyển dụng mới — F12 |
| 05 | Thẩm định chỉ tiêu/ngân sách | Thiếu luồng | Chưa có chu trình thẩm định kế toán/định biên ràng buộc opening — F12 |
| 06 | Giám đốc duyệt chỉ tiêu | Một phần | Duyệt gộp ở luồng cũ, chưa tách đúng trách nhiệm BOD — F03/F12 |
| 07 | Ứng viên đa giai đoạn | Một phần | Có applicant/stage; thiếu điều kiện chuyển bước, lịch/phản hồi gắn quy trình — F12 |
| 08 | Offer và thỏa thuận lương | Một phần | Có offer record, chưa chứng minh gửi/ký/chấp thuận trước nhận việc — F12 |
| 09 | Hồ sơ nhân viên toàn diện | Có nền | Nhiều nhóm dữ liệu/lịch sử; quyền riêng tư và đồng bộ còn lỗi — F02/F14/F23 |
| 10 | Hợp đồng/phụ lục | Một phần | Có quản lý; thiếu áp dụng đúng ngày hiệu lực và liên kết thử việc/biến động/lương |
| 11 | Văn bằng/chứng chỉ | Một phần | Có hồ sơ; chưa thành luồng theo dõi hiệu lực, năng lực, chứng chỉ sau đào tạo |
| 12 | Mượn–trả hồ sơ gốc | Thiếu luồng | Chưa tìm thấy phiếu mượn, hạn trả, giữ bản gốc, nhắc quá hạn và giao nhận |
| 13 | Đánh giá thử việc → chính thức | Thiếu luồng | Chưa có chu trình đánh giá–duyệt–ký HĐ–đổi trạng thái đầy đủ — F12 |
| 14 | Hội nhập nhân viên mới | Một phần | Có reading path cũ/task mẫu mới; chưa nối phân công theo nhân viên và xác nhận mentor/HR |
| 15 | Cổng tự phục vụ | Một phần | Điểm danh gọi API thiếu; dữ liệu “của tôi” sai phạm vi — F13 |
| 16 | Hồ sơ phân cấp 3 mức | Một phần | Tự sửa mức 1 có transaction; quyền đọc và ràng buộc trường chưa nhất quán — F02/F14 |
| 17 | Duyệt điều chỉnh mức 2 | Một phần | Có giao dịch/thông báo; lỗi fullName/birthDate, thiếu kiểm soát trường/minh chứng — F14 |
| 18 | Chấm công vào/ra | Có nền | Có sự kiện gốc và tổng hợp; chưa theo ca/nghỉ/điều chỉnh/kỳ chốt — F07–09 |
| 19 | Sinh trắc học/IR | Một phần, có mô phỏng | Nhánh phần cứng chấp nhận khi có consent, similarity cố định — F10 |
| 20 | Kết nối thiết bị | Một phần | Có HMAC/CSV/mô phỏng; chưa chứng minh kết nối SDK/thiết bị thật và vận hành giám sát |
| 21 | Nghỉ phép trực tuyến | Một phần | Thiếu kiểm tra trùng, lịch lễ, qua năm, đồng bộ công/giao dịch duyệt — F11 |
| 22 | OT | Một phần | Có đăng ký/duyệt; thiếu kiểm soát thời gian/hạn mức và nối lương mới — F04/F11 |
| 23 | Lập lịch/phân ca | Một phần | Lịch hiển thị cố định, chấm công không dùng assignment — F07 |
| 24 | Giải trình bổ sung công | Một phần, tính sai | 1 giờ thành 480 phút; chưa bảo toàn điều chỉnh khi tính lại — F08 |
| 25 | Chốt công tháng | Thiếu luồng | Chưa có kỳ công khóa/finalize làm đầu vào bất biến — F09 |
| 26 | Công thức/ngạch bậc lương | Một phần | Có cấu trúc và gán lương nhưng bộ tính không dùng; tham số hiệu lực lỗi thời — F04/F06 |
| 27 | Tính lương tự động | Một phần, không đủ tin cậy | Hai engine, công/thuế/OT/vay không thống nhất — F04–06 |
| 28 | Phê duyệt/khóa lương | Một phần ở backend cũ | UI mới chưa dùng luồng khóa, xóa run không kiểm tra khóa — F03/F05 |
| 29 | Tạm ứng/vay phúc lợi | Một phần | EMI và helper có; chưa khấu trừ trong payroll, quyền duyệt rộng/số âm — F01/F18 |
| 30 | Công tác/quyết toán | Một phần | Có CRUD; tự APPROVED, chưa đối soát advance/claim qua kế toán — F18 |
| 31 | Cấp/thu hồi tài sản | Một phần | Có cấp/thu hồi; thiếu chặn cấp trùng, giao nhận và lịch sử — F18 |
| 32 | Điều chuyển | Một phần | Áp dụng ngay, thiếu chuỗi duyệt/quyền phòng ban sau chuyển — F15 |
| 33 | Điều chỉnh bậc/lương | Một phần | Chưa đồng bộ đủ hợp đồng/lịch sử/ngày hiệu lực và hai nguồn lương — F15 |
| 34 | Khen thưởng | Một phần | Có quyết định; chưa chuyển khoản thưởng vào kỳ lương — F04/F15 |
| 35 | Kỷ luật | Một phần | Có lưu biến động; chưa đủ quy trình xử lý và điều kiện chặn nâng bậc |
| 36 | Thôi việc/bàn giao | Một phần | Nghỉ sớm hơn hiệu lực; chưa khóa tài khoản/đối soát cuối cùng — F15 |
| 37 | KPI/OKR/360 | Một phần | Công thức UI, tài liệu và backend khác nhau — F16 |
| 38 | Đào tạo | Một phần | UI mới chưa nối ghi danh/hoàn thành/chứng nhận của backend cũ — F17 |
| 39 | Khiếu nại bảo mật | Một phần, quyền chưa đạt | Nội dung/định danh truy cập rộng, thiếu chính sách bảo mật riêng — F01/F17 |
| 40 | Hồ sơ chuẩn 2C | Có nền | Nhiều nhóm lịch sử; cần xác định phạm vi cán bộ và hạn chế truy cập — F02/F23 |
| 41 | Danh mục ngạch bậc | Một phần | Có catalog; seed 20 mục không chứng minh danh mục 184 đầy đủ — F23 |
| 42 | Rà soát/nâng bậc định kỳ | Một phần | Rà soát theo thời gian; chưa đủ điều kiện đánh giá/kỷ luật/duyệt/ngày hiệu lực/đồng bộ baseSalary |
| 43 | Xuất 2C/Biểu 01–03 | Một phần | Có dữ liệu/print/export; HTML mang đuôi .doc/.xls chưa chứng minh tệp chuẩn/công thức/mẫu đầy đủ |
| 44 | Không gian tri thức/tài liệu | Một phần | Backend KMS cũ có version/review; UI HrDocument đi luồng CRUD khác — F19 |
| 45 | Tìm toàn văn/chuyên gia | Một phần | Có search backend cũ; UI lọc tiêu đề phía trình duyệt — F19 |
| 46 | Dashboard/phân tích | Một phần | Có số đếm; thiếu đối soát nguồn lương, chỉ tiêu quản trị sâu và nguồn cho xu hướng — F04/F23 |
| 47 | Audit/cấu hình | Một phần | Actor mới là system, cấu hình không điều khiển đủ runtime — F21 |

Các điểm “thiếu” cần được sửa trong tài liệu nếu chủ ý nằm ngoài bài tập; không nên để UC tiếp tục mô tả như đã hiện thực.

**5. Đánh giá chiều sâu và lượng thông tin**

| Góc đánh giá | Điểm đã có | Điều cần bổ sung để đạt chiều sâu |
|---|---|---|
| Hồ sơ | Nhiều trường và bảng lịch sử, gia đình, học tập, công tác | Bằng chứng/nguồn, người xác nhận, thời điểm hiệu lực, phiên bản, liên kết giữa các nguồn, bảo vệ từng trường |
| Quy trình | Nhiều biểu mẫu và trạng thái | Điều kiện chuyển trạng thái, người được duyệt, phân tách trách nhiệm, từ chối/hủy/thu hồi, nhắc hạn, xử lý ngoại lệ |
| Tiền/công | Có dữ liệu sự kiện, tổng hợp, phiếu lương | Đầu vào chốt, công thức có phiên bản, giải thích khớp kết quả, đối soát OT/phép/vay/thuế, tính lại không mất sửa đổi |
| Đánh giá/đào tạo | Có mục tiêu, điểm, chương trình, feedback | Minh chứng kết quả, trọng số chuẩn, nhiều người đánh giá, kiểm soát kỳ, tác động năng lực và kế hoạch phát triển |
| Thông tin quản trị | Có dashboard và báo cáo | Chỉ số có định nghĩa/công thức/nguồn/khoảng thời gian; xu hướng có dữ liệu thật; truy vết về bản ghi gốc |
| Chất lượng dữ liệu | Có dữ liệu mẫu rộng | Khác biệt giữa “chưa biết” và giá trị thật, quy tắc hợp lệ, phát hiện trùng, kiểm tra đầy đủ, nhãn giả lập và dữ liệu không bị seed ghi đè |

Không cần thêm thật nhiều trường hoặc nhân viên để cải thiện bài tập. Cần một bộ tình huống có đáp án, bao phủ các trạng thái và quan hệ:

1. Tuyển đúng chỉ tiêu; đề xuất vượt chỉ tiêu; offer bị từ chối; ứng viên bị loại; người nhận việc có đủ hợp đồng và nhiệm vụ hội nhập.
2. Nhân viên thử việc, chính thức, làm bán thời gian, chuyển phòng, tăng lương giữa tháng, nghỉ việc vào cuối tháng và nghỉ việc tương lai.
3. Công đủ/thiếu/không có dữ liệu; ca đêm; lễ; phép có lương/không lương; quên chấm; bổ sung công; chốt và mở lại công.
4. OT theo loại ngày; nhiều khoản vay; trả nợ một phần; chi phí không bằng tổng hạng mục; tạm ứng chưa quyết toán; tài sản chưa trả.
5. Các mức thu nhập qua nhiều bậc, nhiều người phụ thuộc, thay đổi tham số năm, hợp đồng có mức đóng bảo hiểm khác lương trả.
6. KPI có tổng trọng số 100%, nhiều người chấm, người không đủ minh chứng, kỳ đã khóa; đào tạo đạt/trượt/vắng và tác động năng lực.
7. Nhân viên đọc dữ liệu của mình/người khác, quản lý khác phòng, người đã nghỉ việc, người đề nghị tự duyệt, đổi quyền đang có phiên đăng nhập.

Mỗi tình huống cần bản ghi đầu vào, thao tác, kết quả mong đợi, người chịu trách nhiệm và bằng chứng thực chạy. Tăng số lượng bản ghi chỉ có ý nghĩa khi tăng độ bao phủ tình huống. Để bài tập thuyết phục, nên có các chuỗi hoàn chỉnh từ đầu tới cuối thay vì mọi màn hình đều nhiều dữ liệu nhưng không liên kết.

**6. Kiểm tra đã thực hiện và giới hạn bằng chứng**

| Kiểm tra | Kết quả | Ý nghĩa/giới hạn |
|---|---|---|
| Typecheck backend | Đạt | Không phát hiện lỗi kiểu dữ liệu; không chứng minh nghiệp vụ đúng |
| Typecheck frontend | Đạt | Không phát hiện lỗi kiểu dữ liệu; không phát hiện mọi route/API mismatch |
| Bộ kiểm tra backend sẵn có | 3 suite, 12 test đạt | Phạm vi auth, QR token, mã hóa dữ liệu mặt; chưa bao phủ payroll/leave/workflow/RBAC mới |
| Tái hiện cô lập bổ sung | 17 quan sát được xác nhận | Dùng controller/guard hoặc service thật, DB/service fixture; không phải 17 E2E trên dữ liệu thật |
| Hệ thống với DB thật | Chưa chạy | Docker daemon không khả dụng và không có dịch vụ DB/backend lắng nghe tại các cổng kiểm tra |
| Word | Trích xuất nội dung 3 file, đối chiếu tài liệu chính/Markdown | Không thực hiện đánh giá trình bày trang Word; không sửa bản gốc |

17 quan sát gồm: hai phép tính lương; vòng lặp tổ chức; nghỉ việc trước ngày hiệu lực; một giờ thành tám giờ; trường hồ sơ sai model; chấm sinh trắc học không cần chứng thực phần cứng; USER xem lương/tạo thành phần lương/xóa run/xem khiếu nại/xem hồ sơ khác; khoản vay “của tôi” trả demo-user; USER duyệt khoản vay; BOD bị chặn khóa lương; LINE_MANAGER bị chặn duyệt phép; hai API ESS điểm danh trả 404.

Các phép kiểm tra API dùng JWT/guard thật với vai trò chỉ định và service giả lập để xác nhận quyền/routing. Chúng chứng minh yêu cầu đi tới service hoặc bị guard/route chặn; không chứng minh số bản ghi thực tế đang có trong DB. Các phép kiểm tra nghiệp vụ gọi service thật và chụp dữ liệu ghi vào persistence giả lập. Rủi ro cạnh tranh giao dịch, tác động thiết bị thật, thời gian đáp ứng, định dạng xuất file và toàn bộ chuỗi nghiệp vụ vẫn cần kiểm thử tích hợp riêng.

**7. Thứ tự sửa và tiêu chí nghiệm thu**

| Thứ tự | Công việc | Điều kiện để coi là hoàn tất |
|---|---|---|
| 1 | Chặn quyền quá rộng, sửa phạm vi “của tôi”, bảo vệ hồ sơ/khiếu nại | USER không thể xem/sửa/xóa/duyệt dữ liệu ngoài quyền; quản lý chỉ đúng phạm vi; người nghỉ việc bị chặn đúng thời điểm; audit ghi actor thật |
| 2 | Chọn một nguồn payroll và cập nhật đặc tả tiền/công | Một đầu vào cho UI/API/dashboard/report; công thức đúng tham số hiệu lực; có ví dụ 0 công/OT/vay/phụ thuộc; breakdown cộng khớp net |
| 3 | Nối ca–sự kiện–điều chỉnh–phép–chốt công–khóa lương | Lịch đúng từng ngày; điều chỉnh 1 giờ là 60 phút; tính lại bảo toàn điều chỉnh; kỳ khóa không sửa/xóa ngoài quy trình mở lại |
| 4 | Sửa ngày hiệu lực và tính toàn vẹn dữ liệu | Quyết định tương lai chưa tác động hiện tại; khi tới ngày cập nhật đủ User/Profile/hợp đồng/lương/quyền; cây không tạo vòng; seed không ghi đè hồ sơ |
| 5 | Hoàn thiện chuỗi tuyển dụng/nhận việc/thử việc/thôi việc | Mỗi bước có điều kiện đầu vào/đầu ra, trách nhiệm và chuyển giao; không nhận việc khi offer chưa được chấp thuận |
| 6 | Thống nhất KPI, đào tạo, tri thức và báo cáo | Điểm có một công thức; đào tạo nối học viên/kết quả; tìm kiếm truy nội dung; xuất file được kiểm chứng theo mẫu |
| 7 | Cập nhật tài liệu và dữ liệu chứng minh | Một tài liệu chuẩn; bảng UC ↔ UI ↔ API ↔ model ↔ kiểm tra; chỉ ghi “đã làm” khi có bằng chứng; file tham khảo được phân biệt |

Nên giảm phạm vi các nhánh mở rộng chưa hoàn thiện nếu thời gian môn học hạn chế, rồi làm chắc các chuỗi cốt lõi. Các lỗi ưu tiên 1 phải được xử lý trước khi tuyên bố hệ thống đầy đủ hoặc dùng dữ liệu nhân sự thực.

**8. Điểm truy vết mã nguồn**

Đường dẫn dưới đây tính từ thư mục dự án. Số dòng là vị trí đã đọc ở trạng thái mã ngày kiểm tra; có thể dịch chuyển sau khi sửa. F liên quan đã nêu ở phần 3.

| Bằng chứng | Tệp và vị trí |
|---|---|
| Danh mục UC, quy trình, công thức | [doc/PTTK_OOP_HR.md:852](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/doc/PTTK_OOP_HR.md:852>), `:1240`, `:1253`, `:1664` |
| Không có role metadata thì cho qua | [backend/src/common/guards/roles.guard.ts:14](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/common/guards/roles.guard.ts:14>) |
| Nạp đồng thời hai hệ module | [backend/src/app.module.ts:24](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/app.module.ts:24>), `:35`, `:69`, `:80` |
| Thuế và trạng thái lương cũ | [backend/src/modules/payroll/payroll.module.ts:23](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/payroll/payroll.module.ts:23>), `:98`, `:140`, `:184`, `:196` |
| Gán cấu trúc/xóa/tính lương mới | [backend/src/modules/hrms-payroll/hrms-payroll.module.ts:182](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/hrms-payroll/hrms-payroll.module.ts:182>), `:237`, `:254`, `:297`, `:317`, `:475` |
| Giải thích phiếu lương trên UI | [frontend/src/app/(app)/payroll-engine/page.tsx:998](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/frontend/src/app/(app)/payroll-engine/page.tsx:998>) |
| Lịch và xuất ca cố định | [frontend/src/app/(app)/shifts/page.tsx:478](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/frontend/src/app/(app)/shifts/page.tsx:478>), `:523` |
| Giờ chấm công cố định/sinh trắc học | [backend/src/modules/attendance/attendance.service.ts:126](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/attendance/attendance.service.ts:126>), `:132`, `:507`, `:514` |
| Duyệt bổ sung công | [backend/src/modules/hrms-regularization/hrms-regularization.module.ts:88](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/hrms-regularization/hrms-regularization.module.ts:88>), `:126` |
| Quyền đọc hồ sơ/tự cập nhật | [backend/src/modules/personnel-profiles/personnel-profiles.module.ts:250](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/personnel-profiles/personnel-profiles.module.ts:250>), `:356`, `:678` |
| Quyền báo cáo hồ sơ | [backend/src/modules/personnel-reports/personnel-reports.module.ts:311](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/personnel-reports/personnel-reports.module.ts:311>) |
| Ánh xạ trường khi duyệt thay đổi | [backend/src/modules/profile-change-requests/profile-change-requests.module.ts:340](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/profile-change-requests/profile-change-requests.module.ts:340>), `:360`, `:379` |
| Ngày hiệu lực nghỉ việc | [backend/src/modules/personnel-actions/personnel-actions.module.ts:107](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/personnel-actions/personnel-actions.module.ts:107>), `:148` |
| Offer/chuyển nhân viên | [backend/src/modules/hrms-recruitment/hrms-recruitment.module.ts:253](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/hrms-recruitment/hrms-recruitment.module.ts:253>), `:280` |
| Điểm cuối KPI | [backend/src/modules/hrms-performance/hrms-performance.module.ts:215](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/hrms-performance/hrms-performance.module.ts:215>), `:219` |
| API khoản vay, actor/phạm vi | [backend/src/modules/hrms-loans/hrms-loans.module.ts:134](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/hrms-loans/hrms-loans.module.ts:134>), `:161`, `:190`, `:199`, `:216` |
| Ma trận quyền chỉ lưu cấu hình | [backend/src/modules/users/roles.controller.ts:321](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/users/roles.controller.ts:321>), `:341`; [backend/src/modules/settings/settings.module.ts](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/settings/settings.module.ts>) |
| Kiểm tra vòng lặp tổ chức | [backend/src/modules/org-units/org-units.module.ts:125](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/org-units/org-units.module.ts:125>), `:133` |
| Nhật ký và khóa ngoại actor | [backend/src/common/services/audit.service.ts](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/common/services/audit.service.ts>); [backend/prisma/schema.prisma:580](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/prisma/schema.prisma:580>) |
| Seed mở rộng dù main bỏ qua | [backend/prisma/seed.cjs:18](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/prisma/seed.cjs:18>), `:375`; [backend/docker-entrypoint.sh:9](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/docker-entrypoint.sh:9>) |
| Ghi đè và xóa lịch sử hồ sơ khi seed | [backend/prisma/seed-personnel-ranks.cjs:324](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/prisma/seed-personnel-ranks.cjs:324>), `:329`, `:341` |
| Tài liệu CRUD thay luồng KMS | [backend/src/modules/documents/documents.module.ts:80](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/backend/src/modules/documents/documents.module.ts:80>), `:108`, `:134`; [frontend/src/components/layout/global-search.tsx](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/frontend/src/components/layout/global-search.tsx>) |
| Định dạng xuất HTML .doc/.xls | [frontend/src/lib/export.ts](<C:/Users/legen/OneDrive/Documents/GitHub/tailieuhoctap/Hệ thống thông tin quản trị nhân lực/frontend/src/lib/export.ts>) |

Nguồn pháp lý được liên kết trực tiếp tại F06. Những đánh giá còn lại dựa trên tài liệu và mã trong dự án, không giả định dữ liệu DB thật hoặc thiết bị thật đã được xác minh.


