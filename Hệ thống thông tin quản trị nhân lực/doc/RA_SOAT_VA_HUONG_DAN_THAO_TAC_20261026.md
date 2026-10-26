# Rà soát bổ sung và làm rõ thao tác — 26/10/2026

**Cập nhật triển khai:** đã áp dụng bản sửa và hai migration vào Docker local đang phục vụ `localhost:8080` ngày 26/10. Xem [biên bản triển khai](TRIEN_KHAI_DOCKER_20261026.md). Các ghi nhận “chưa áp dụng CSDL chính” bên dưới mô tả thời điểm hoàn tất kiểm thử trước triển khai.

## Kết quả

Đợt rà soát tiếp nối bản sửa ngày 24/10, tập trung các luồng công, lương, OT, phép, công tác phí, tài sản, thử việc và KPI. Đã xử lý thêm các đường sai trạng thái/quyền và bổ sung hướng dẫn trực tiếp trên giao diện. Không kết luận hệ thống đã hết mọi lỗ hổng.

| Phát hiện xác nhận được | Thay đổi |
| --- | --- |
| Có thể hủy kỳ đã trả để lập lại, giữ nguyên giao dịch tiền cũ nhưng giải phóng khoảng kỳ (F03) | Chặn khi trạng thái `PAID`, có `paidAt` hoặc mã thanh toán; giao diện không còn mời hủy kỳ đã trả. Trường hợp này cần điều chỉnh có đối soát. |
| Bảng lương cũ không đối chiếu phiên bản công sau khi mở lại/chốt lại (F05) | Lưu `attendanceVersion` lúc tính; kiểm tra kỳ vẫn chốt và đúng phiên bản ở mọi bước đối soát/duyệt/khóa/trả. Phiếu ưu tiên ngày công đã lưu trong chính kết quả tính, tránh hiển thị nhầm bản công mới thành lịch sử cũ. |
| Chốt công còn bỏ qua đơn phép/OT đang chờ duyệt, làm kẹt xử lý sau đó (F10) | Chặn cả đơn phép giao khoảng tháng và OT trong tháng; kiểm tra trước và trong giao dịch chốt. Thông báo số lượng và nơi cần xử lý. Giữ chặn OT đã duyệt chưa đối soát thực làm của bản trước. |
| API công tác phí cho xem/tạo hộ/xóa ngoài chủ hồ sơ và quản lý có thể duyệt ngoài đơn vị (F02) | Áp phạm vi cho cả chuyến đi, bảng kê, tạm ứng. Nhân viên chỉ xem hồ sơ mình; quản lý giới hạn đơn vị hiện có; các vai trò toàn công ty giữ phạm vi nghiệp vụ của họ. Chặn truy vấn giả `userId`, tạo hộ/xóa ngoài quyền và duyệt ngoài đơn vị. Kiểm toán chỉ đọc, không tạo/xóa. Không tự chuyển đề xuất về người đăng nhập khi ID sai hoặc tên không xác định duy nhất. |
| Tự sinh đủ công được mặc định bật và giao diện mô tả như công thực (phần tự sinh tương lai của F01) | Tắt mặc định; chỉ chạy khi môi trường bật riêng `ALLOW_DEMO_ATTENDANCE=true` và cấu hình `AUTO_ATTENDANCE_ENABLED=true`. Bộ demo tôn trọng công tắc ca, chỉ sinh sau khi ca kết thúc. Nút trên bảng công cá nhân chỉ làm mới dữ liệu; hướng dẫn thiếu công dẫn tới Giải trình. Không tự xóa dữ liệu mô phỏng lịch sử. |
| Biểu mẫu chi phí chứa dữ liệu mẫu có thể nộp nhầm; thiếu liên kết chuyến đi trong thao tác | Bỏ các số tiền/lịch trình mẫu điền sẵn. Có lựa chọn chuyến đi đã duyệt của đúng người khi lập bảng kê/tạm ứng. Kiểm tra nội dung khoản chi và tổng tiền hợp lệ. |

## Các thay đổi giao diện

1. **Bàn làm việc → Hướng dẫn thao tác** (`/workflow-guide`): chín quy trình, tìm theo công việc hoặc vai trò; mỗi bước ghi ai làm, thao tác, kết quả và liên kết đúng màn.
2. Hướng dẫn ngắn ngay trên màn OT, phép, tài sản, công tác phí, nhân sự, ATS, KPI và lương. Có phần mở rộng giải thích điều kiện bị chặn.
3. **OT:** đổi tab “Toàn công ty” thành “Phạm vi quản lý”; thêm cột “Việc tiếp theo”, nút xác nhận thực làm ngay trên dòng và duyệt kế hoạch trong chi tiết; lọc riêng chờ xác nhận và đã xác nhận. Ngày chưa kết thúc có lời giải thích. Đổi “Giờ được trả” thành “Giờ làm căn cứ trả”.
4. **Công tác:** nút xác nhận ngay trên thẻ; chọn ngày bằng checkbox do backend tính từ lịch ca. Ngày đã ghi công, trùng phép, chưa kết thúc hoặc bị chốt có lý do và không chọn được. Backend tiếp tục kiểm tra lại khi gửi. Không mở chồng hai modal khi chuyển từ chi tiết sang xác nhận.
5. **Quyền trên công tác phí:** nút duyệt/chi tiền/xóa phù hợp vai trò, chủ hồ sơ và trạng thái ở cả dạng thẻ, bảng và chi tiết. Hiển thị lỗi tải dữ liệu thay vì làm danh sách lỗi trông như danh sách rỗng.
6. **Quy trình & xác nhận:** liên kết sâu như `/hr-workflows?tab=probation` hoặc `?tab=attendance`; giữ tab trong URL. Chốt công mặc định tháng đã kết thúc, có liên kết kiểm tra phép/OT/công tác/công. Lỗi thao tác lưu trên trang để người dùng đọc, bên cạnh thông báo nhanh. Nhãn từ chối thử việc đổi thành “Yêu cầu đánh giá lại”.
7. **Lương:** trạng thái ghi rõ bước tiếp theo bằng tiếng Việt; chặn nút tự đối soát/duyệt/khóa kèm lý do. Hướng dẫn lương cũ được sửa để nói đủ bước xác nhận OT, công tác và chốt công.
8. **KPI:** thẻ kỳ nêu phạm vi và số người có mục tiêu; thông báo danh sách kỳ còn người chưa được giao. Bỏ tỷ lệ tổng trọng số cộng qua nhiều người vì mỗi người cần đủ 100% riêng.

## Bắt đầu sử dụng

- Chưa biết đi đâu: **Tổng quan → Bàn làm việc → Hướng dẫn thao tác**.
- Là nhân viên: gửi đơn bằng tài khoản của mình; các bước phê duyệt/xác nhận cần người khác có quyền.
- Là HR/quản lý: ở OT, mở **Phạm vi quản lý** để xử lý; ở công tác, mở **Đơn đề xuất công tác**, dùng **Xác nhận ngày thực hiện** sau chuyến đi.
- Là HR chuẩn bị tính lương: mở **Quy trình & xác nhận → Chốt công**, xử lý các điều kiện còn thiếu rồi chốt tháng. Sau đó tạo kỳ ở **Tiền lương**; người tính, người đối soát và người phê duyệt phải đáp ứng phân tách nhiệm vụ dù một tài khoản có nhiều vai trò.

## Kiểm chứng

- 23 suite backend, **139 kiểm thử** đạt; có các tình huống chặn hủy khi có thanh toán, bản công đã mở lại/sai phiên bản, đơn còn chờ, giới hạn chủ hồ sơ/quản lý và kiểm toán chỉ đọc.
- 2 suite E2E, **11 kiểm thử** đạt trên PostgreSQL 18 tạm riêng; kiểm tra qua HTTP thật với guards và Prisma. Đã kiểm tra giả mạo truy vấn, tạo hộ/xóa ngoài quyền, quản lý khác đơn vị, hủy lương đã trả, mở lại/chốt lại công và ngày công lưu trong phiếu.
- **33 migration** áp dụng thành công trên cơ sở dữ liệu rỗng. Kiểm tra chuyển dữ liệu ứng viên và phục hồi phiên bản công cũ từ audit log; phiên bản không được lấy từ công hiện tại để hợp thức hóa bảng lương cũ.
- Backend/frontend typecheck và build production đạt.
- Giao diện: **20 lượt kiểm tra ở 375px/1280px**, không tràn ngang hoặc lỗi JavaScript; gửi được các biểu mẫu OT, thu hồi tài sản, xác nhận công tác; kiểm tra tìm hướng dẫn và liên kết đúng tab. Kiểm tra thêm thẻ/bảng theo **USER, HR_CB, ACCOUNTANT, AUDITOR** đúng nút xử lý và không lỗi JavaScript.
- Giao diện được thử bằng Chrome với API fixture; dữ liệu và phân quyền được kiểm chứng riêng bằng E2E PostgreSQL. Chưa chạy trên PostgreSQL 16 của cấu hình Docker dự án vì Docker Desktop chưa kết nối được.

## Điểm còn cần xử lý riêng

- **Quản lý trực tiếp vẫn suy từ cùng đơn vị (F12):** đã chặn vượt đơn vị, nhưng chưa có quan hệ người quản lý trực tiếp theo từng nhân viên. Nếu một phòng có nhiều nhóm/quản lý, cần mô hình này và dữ liệu phân công trước khi phân quyền tới từng nhóm.
- **Công mô phỏng lịch sử:** việc tắt tự sinh không làm dữ liệu đã sinh trở thành bằng chứng công thực. Cần đối chiếu các sự kiện có `payload.autoGenerated` với dữ liệu thực; không tự xóa/sửa hàng loạt các kỳ đã trả trong đợt này.
- **Bổ nhiệm sửa trực tiếp (phần còn lại của F13):** đã đồng bộ luồng thăng chức được duyệt, chưa gom mọi cách sửa lịch sử bổ nhiệm thành một nguồn quyết định duy nhất.
- Bản rà soát dựa trên mã nguồn và kiểm thử cô lập, không phải xác nhận số hồ sơ ảnh hưởng trên cơ sở dữ liệu đang vận hành.

## Triển khai

Thêm migration `backend/prisma/migrations/20261025000000_payroll_attendance_version/migration.sql`, sau migration ngày 24/10. Chưa áp dụng migration lên cơ sở dữ liệu chính.

Tại thư mục gốc dự án, sau khi chọn đúng môi trường `DATABASE_URL`:

```powershell
npm run prisma:generate --workspace=backend
npm run prisma:migrate --workspace=backend
npm run build --workspace=backend
npm run build --workspace=frontend
```

Khởi động lại backend/frontend để dùng giao diện và quy tắc mới. Các kỳ cũ không có audit log xác định phiên bản công sẽ bị chặn chuyển bước; kỳ chưa trả cần hủy và tính mới từ công đã chốt. Kỳ đã trả được giữ nguyên để đối soát/điều chỉnh theo quy trình phù hợp.
