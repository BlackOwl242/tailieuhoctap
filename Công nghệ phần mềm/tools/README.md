# THƯ MỤC CÔNG CỤ TỰ ĐỘNG HÓA (TOOLS)

Thư mục này chứa các công cụ tự động phục vụ quá trình biên tập, kết xuất sơ đồ và đóng gói tài liệu Báo cáo Bài tập lớn Công nghệ phần mềm:

## 1. `build_docx.ps1`
- **Mục đích**: Tự động chuyển đổi toàn bộ báo cáo từ `Bao_Cao_Bai_Tap_Lon_CNPM.md` sang tài liệu Word chuẩn học thuật `Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx`.
- **Tính năng nổi bật**:
  - Tự động tạo 2 trang bìa (bìa chính + bìa phụ) có khung viền đôi (Border Arts) chuẩn kích thước A4.
  - Tự động tạo Mục lục chuẩn động của Microsoft Word (TOC) có liên kết số trang chính xác và bấm chuột để điều hướng.
  - Áp dụng chuẩn Heading 1, 2, 3, 4 phân cấp định hướng rõ ràng (Navigation Pane).
  - Tự động căn giữa hình ảnh, co giãn tỉ lệ hợp lý và chèn caption nghiêng chuẩn.
  - Định dạng bảng biểu học thuật: header in đậm, viền đơn thanh lịch, không đổ nền tối.
- **Cách chạy**:
```powershell
# Chạy từ thư mục gốc dự án:
powershell -ExecutionPolicy Bypass -File .\tools\build_docx.ps1

# Hoặc chạy trực tiếp bên trong thư mục tools:
powershell -ExecutionPolicy Bypass -File .\build_docx.ps1
```

## 2. `generate_clean_academic_diagrams.js`
- **Mục đích**: Vẽ 11 sơ đồ hình học trực giao chuẩn học thuật (Waterflow, DFD mức 0, DFD mức 1, Sơ đồ trạng thái, ERD tổng thể,...) bằng SVG và render tự động thành ảnh PNG độ phân giải cao vào thư mục `assets/diagrams/`.
- **Cách chạy**:
```bash
node tools/generate_clean_academic_diagrams.js
```

## 3. `verify_final.ps1`
- **Mục đích**: Kiểm tra tự động file Word sau khi xuất (đếm số trang, số đoạn văn, kiểm tra sự tồn tại của khung viền bìa và tính toàn vẹn của mục lục).
- **Cách chạy**:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\verify_final.ps1
```
