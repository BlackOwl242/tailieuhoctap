# Sửa các mâu thuẫn quy trình thực tế — 24/10/2026

**Cập nhật ngày 26/10:** đã triển khai bản sửa vào Docker local đang phục vụ `localhost:8080`, sau khi sao lưu dữ liệu. Xem [biên bản triển khai](TRIEN_KHAI_DOCKER_20261026.md). Phần trạng thái chưa triển khai bên dưới là ghi nhận tại thời điểm lập báo cáo ngày 24/10.

Đã sửa 10 nhóm vấn đề được chọn từ đợt rà soát. Mục “nhân viên vào giữa tháng” xuất hiện hai lần trong yêu cầu và được xử lý chung. Thay đổi gồm backend, dữ liệu, giao diện và kiểm thử hồi quy.

## Hành vi sau sửa

| Nhóm | Hành vi mới | Cách sử dụng |
| --- | --- | --- |
| Người vào giữa tháng làm lỗi kỳ lương (F04) | Không đòi hợp đồng/quyết định lương trước ngày tuyển dụng. Giữ mẫu số ngày công của cả tháng, chỉ hưởng lương trong thời gian làm việc. Ngày trước tuyển dụng được tính vào kiểm tra số ngày không hưởng lương khi xác định khấu trừ bảo hiểm. | Khai báo đúng ngày vào làm và hồ sơ lương có hiệu lực từ ngày đó; tính kỳ lương như bình thường. |
| Duyệt OT đồng nghĩa trả tiền (F07) | Tách duyệt kế hoạch và xác nhận thực làm. Lương chỉ lấy giờ thực làm đã xác nhận, trong thời gian làm việc của nhân viên. Loại ngày được suy từ lịch ca/ngày lễ. Chặn chốt công nếu còn OT đã duyệt chưa xác nhận thực làm. | Sau ngày OT, người có quyền khác nhân viên chọn **Xác nhận giờ thực làm**, nhập giờ thực tế, giờ đêm, kết quả đối soát và minh chứng. Nhập 0 nếu kế hoạch không thực hiện. Giờ thực tế không vượt kế hoạch. |
| Tài sản chưa xác nhận bị kẹt khi nghỉ việc (F06) | HR thu hồi được cả tài sản `PENDING_ACK` và `ALLOCATED`, kể cả khi tài khoản nhân viên đã khóa. Lịch sử lưu đúng người được giao. Từ chối nhận cũng giải phóng tài sản về kho. | Chọn **Thu hồi**; tài sản chưa ký nhận bắt buộc có biên bản/lý do ít nhất 10 ký tự. |
| Phép khác lịch ca (F08) | Dùng lịch phân ca có hiệu lực theo người và ngày, loại ngày lễ. Lưu các ngày trừ phép vào `chargedDates`, dùng lại khi duyệt/hủy. | Người có ca thứ Bảy xin phép thứ Bảy được tính đúng. Đổi lịch sau khi nộp không tự đổi số ngày của đơn. Đơn cũ giữ cách tính lịch cũ. |
| Người mới được đủ phép năm (F09) | Phân bổ theo thời gian làm việc và cấu hình chính sách, không mặc định cấp đủ 12 ngày cho người vào cuối năm. Cập nhật hạn mức khi đọc/kiểm tra quỹ, bảo toàn số ngày đã sử dụng. | Vào **Cấu hình hệ thống** để đặt số ngày cơ bản và cách phân bổ. Mặc định và các lựa chọn được giải thích bên dưới. |
| Công tác chưa nối công hưởng lương (F11) | Chuyến đi được duyệt chưa tự tạo công. Sau xác nhận ngày thực hiện và minh chứng, ghi `BUSINESS_TRIP`, tính công hưởng lương mà không tạo giờ vào/ra giả. Ngăn công tác và phép đã duyệt ghi đè nhau theo cả hai chiều. | Mở chi tiết chuyến đi → **Xác nhận ngày thực hiện**. Chỉ xác nhận ngày theo lịch ca, trong chuyến đi, đã kết thúc và chưa chốt công/lương. Chi tiết công trong phiếu lương hiển thị chuyến đi và OT thực tế. |
| Thăng chức chưa đồng bộ chức danh (phần thăng chức của F13) | Quyết định thăng chức bắt buộc có chức danh mới; kiểm tra chức danh/ngạch lương và đơn vị. Đến ngày hiệu lực, cập nhật chức danh, đơn vị nếu có, lương và bổ nhiệm hiện tại trong cùng giao dịch; kết thúc cơ cấu lương cũ. | Khi điều chỉnh lương với lý do **Thăng chức**, nhập chức danh mới. Quyết định tương lai được áp dụng theo ngày hiệu lực. Nếu cần cơ cấu lương riêng cho chức danh mới, gán cơ cấu phù hợp sau đó. |
| Hai nguồn ứng viên lệch trạng thái (F14) | ATS là nguồn trạng thái cho hồ sơ có liên kết. Tạo/chuyển giai đoạn, gửi/phản hồi offer, nhận việc và từ chối đồng bộ bảng ứng viên cũ trong giao dịch. Luồng cũ không được bỏ qua các bước ATS. Migration đồng bộ hồ sơ lịch sử và bổ sung bản phản chiếu thiếu. | Dùng ATS để phỏng vấn, offer và tiếp nhận; danh sách cũ phản ánh kết quả ATS. Hồ sơ không có liên kết vẫn là nguồn ứng viên cũ. |
| Thử việc không đạt chưa đầy đủ (F15) | `FAIL` không yêu cầu mức lương/hợp đồng chính thức. Sau thẩm định HR và phê duyệt độc lập, tạo quyết định `PROBATION_FAIL` và checklist bàn giao. Đến ngày hiệu lực, kết thúc trạng thái làm việc, hợp đồng và quyền truy cập theo luồng chung. | Chọn **Không đạt**, nhập ngày kết thúc, đánh giá và minh chứng; HR thẩm định rồi người phê duyệt độc lập duyệt kết luận. Tài sản chưa ký nhận vẫn thu hồi được qua luồng trên. |
| Kỳ KPI bỏ sót người chưa có mục tiêu (F16) | Kỳ KPI doanh nghiệp có phạm vi toàn bộ hoặc danh sách chọn. Chốt kỳ đối chiếu mọi người thuộc phạm vi, yêu cầu đủ mục tiêu/trọng số, điểm và minh chứng; thông báo người còn thiếu. Kỳ toàn bộ bổ sung người đủ điều kiện phát sinh trong khoảng kỳ. | Chọn phạm vi khi tạo kỳ. Nếu chỉ đánh giá một nhóm, chọn danh sách cụ thể. Không dùng việc chỉ giao KPI cho một người để thu hẹp ngầm phạm vi kỳ. |

## Chính sách phép năm

- `ANNUAL_LEAVE_DAYS`: mặc định 12 ngày, có cộng thâm niên theo quy tắc hiện có.
- `PRORATED_YEAR` (mặc định): cấp theo thời gian **dự kiến** làm việc trong năm, từ ngày vào làm đến cuối năm hoặc ngày nghỉ việc đã được duyệt. Đây là cấp trước phần dự kiến, không phải chỉ tích lũy tới hôm nay.
- `ACCRUED`: chỉ tích lũy tới ngày hiện tại.
- `FULL_YEAR`: công ty chủ động chọn cấp trước cả năm; không còn là mặc định ngầm cho người mới.
- Với cách phân bổ theo thời gian: tháng có ít nhất 50% số ngày làm việc theo lịch nằm trong thời gian làm việc đủ điều kiện được tính một tháng; hạn mức = ngày năm × số tháng / 12, làm tròn hai chữ số.
- Đơn cũ chưa có `chargedDates` tiếp tục dùng lịch thứ Hai–thứ Sáu và ngày lễ như trước để không thay đổi ngược số phép đã ghi nhận. Chưa bổ sung chính sách chuyển phép sang năm sau trong đợt này.

## Dữ liệu và triển khai

Migration mới: `backend/prisma/migrations/20261024000000_practical_hr_workflows/migration.sql`.

Migration thêm ngày trừ phép, thông tin xác nhận OT/công tác, ngày kết thúc cơ cấu lương, đối tượng KPI, loại công tác/kết thúc thử việc và cho phép trường hợp đồng trống khi thử việc không đạt. Phần chuyển dữ liệu ứng viên chọn ATS mới nhất theo đợt tuyển và email, không tạo offer hoặc quyết định nhận việc giả.

Khi triển khai vào môi trường đã chọn đúng `DATABASE_URL`, chạy từ thư mục gốc dự án:

```powershell
npm run prisma:generate --workspace=backend
npm run prisma:migrate --workspace=backend
npm run build --workspace=backend
npm run build --workspace=frontend
```

Sau đó khởi động lại dịch vụ theo cấu hình triển khai của môi trường. Trong lần sửa này **chưa chạy migration hoặc thay dữ liệu trên cơ sở dữ liệu đang vận hành**. Chỉ áp dụng migration trên PostgreSQL kiểm thử tách riêng.

OT cũ đã duyệt chưa có giờ thực làm không tự được xác nhận bằng số giờ kế hoạch. Với kỳ còn mở, cần xác nhận trước khi chốt. Bảng lương đã lưu không bị migration tự tính lại. Kỳ KPI cũ nhận mặc định phạm vi toàn bộ; trước khi chốt cần hoàn tất người còn thiếu.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| Backend unit/regression (`npm test --workspace=backend -- --runInBand`) | 23 suite, 124/124 kiểm thử đạt |
| E2E qua HTTP, Prisma và PostgreSQL tạm riêng (`RUN_E2E=1`, `npm run test:e2e --workspace=backend`) | 2 suite, 9/9 kiểm thử đạt |
| Migration từ cơ sở dữ liệu rỗng | Toàn bộ 32 migration áp dụng thành công |
| Chuyển dữ liệu ứng viên có sẵn | Kiểm thử cập nhật bản lệch, bổ sung bản thiếu và chạy lại không tạo bản trùng |
| Typecheck backend/frontend | Đạt |
| Build production backend/frontend | Đạt |
| Biểu mẫu OT, tài sản, thử việc, công tác, KPI, phép, cấu hình | 14 kiểm tra ở 375px và 1280px; không tràn ngang, không lỗi JavaScript; gửi được payload của ba biểu mẫu mới |
| `git diff --check` | Đạt |

E2E dùng PostgreSQL 18 tạm do Docker Desktop không kết nối được, chưa xác minh trực tiếp trên PostgreSQL 16 của cấu hình Docker dự án. Kiểm tra giao diện dùng ứng dụng Next.js thật với API fixture; kết quả nghiệp vụ/dữ liệu được xác minh riêng bằng E2E PostgreSQL.

Đợt này xử lý đúng các nhóm được yêu cầu. Báo cáo rà soát gốc giữ lại bằng chứng trước sửa; các mục khác như công tự sinh, phạm vi công tác phí, hủy lương đã trả, phiên bản công cũ và mô hình quản lý trực tiếp chưa được kết luận là đã sửa.
