# THƯ MỤC CÔNG CỤ TỰ ĐỘNG HÓA VÀ BIÊN DỊCH BÁO CÁO

Thư mục này chứa toàn bộ các công cụ kỹ thuật tự động phục vụ quá trình kết xuất sơ đồ học thuật, ghép nối tài liệu và biên dịch báo cáo sang định dạng Microsoft Word (.docx) chuẩn 100% quy cách:

## 1. `generate_academic_diagrams.js`
- **Mục đích**: Tự động kết xuất 14 sơ đồ kiến trúc, sơ đồ luồng dữ liệu (DFD), sơ đồ phân rã chức năng (FDD), sơ đồ cơ sở dữ liệu (ERD), bản vẽ thiết kế giao diện và kiến trúc an toàn thông tin cấp độ ba từ mã nguồn hình học vector sang ảnh độ phân giải cao tại `assets/diagrams/`.
- **Cách chạy**:
```bash
node tools/generate_academic_diagrams.js
```

## 2. `rebuild_master_md.js`
- **Mục đích**: Tự động ghép nối hai trang bìa chuẩn Học viện cùng toàn bộ năm chương tài liệu trong thư mục `docs/` thành tệp tổng hợp `Bao_Cao_He_Thong_Thong_Tin_Quan_Ly_Hanh_Chinh.md`.
- **Cách chạy**:
```bash
node tools/rebuild_master_md.js
```

## 3. `build_docx.ps1`
- **Mục đích**: Tự động điều khiển Microsoft Word thông qua giao diện lập trình để tạo tài liệu `.docx` chuẩn 100% theo mẫu tham chiếu:
  - Khung viền đôi mỹ thuật trên hai trang bìa (Bìa chính và Bìa trong).
  - Mục lục động Word (TOC) tự động cập nhật số trang, chỉ phân cấp Đề mục cấp một và cấp hai.
  - Định dạng chuẩn: Phông chữ Times New Roman, cỡ 13pt, dãn dòng 1.5, thụt đầu dòng 1.27 cm, căn đều hai bên.
  - Đề mục cấp ba chữ nghiêng, không in đậm theo đúng tiêu chuẩn.
  - Toàn bộ bảng biểu có tiêu đề in đậm phía trên, không ngắt hàng qua trang, tiêu đề lặp lại ở đầu trang sau.
  - Hình ảnh căn giữa trang, chú thích nghiêng phía dưới.
- **Cách chạy**:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build_docx.ps1
```

## 4. `verify_final.ps1`
- **Mục đích**: Kiểm tra tự động tính toàn vẹn của tệp Word sau khi kết xuất: kiểm tra số lượng mục trong mục lục, xác nhận Đề mục cấp ba đạt chuẩn chữ nghiêng không in đậm, đếm số lượng trang, bảng biểu, sơ đồ và khung viền bìa.
- **Cách chạy**:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\verify_final.ps1
```
