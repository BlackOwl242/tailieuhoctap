const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');
const masterMdPath = path.join(projectRoot, 'Bao_Cao_He_Thong_Thong_Tin_Quan_Ly_Hanh_Chinh.md');

const coverText = `HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH
HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG
__________________________________

[[IMAGE: assets/diagrams/logo_hoc_vien.png | Caption: ]]

TÊN ĐỀ TÀI:
Nghiên cứu phân tích, thiết kế, triển khai, vận hành, kiểm thử và quản trị hệ thống thông tin giải quyết thủ tục hành chính cấp tỉnh
---------------------------------------------------------
BÀI TẬP LỚN KẾT THÚC HỌC PHẦN
Học phần : Hệ thống thông tin quản lý hành chính
GVHD      : Ths. Bùi Thị Thanh

Hà Nội - 2026

<div style="page-break-after: always;"></div>

HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH
HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG
__________________________________

[[IMAGE: assets/diagrams/logo_hoc_vien.png | Caption: ]]

TÊN ĐỀ TÀI:
Nghiên cứu phân tích, thiết kế, triển khai, vận hành, kiểm thử và quản trị hệ thống thông tin giải quyết thủ tục hành chính cấp tỉnh
---------------------------------------------------------
BÀI TẬP LỚN KẾT THÚC HỌC PHẦN
Học phần : Hệ thống thông tin quản lý hành chính
GVHD      : Ths. Bùi Thị Thanh
Sinh viên : Lê Quốc Huy – 2305HTTB011
                  Nguyễn Như Hạ – 2305HTTA008
                  Đỗ Minh Hiếu – 2305HTTA009
                  Nguyễn Trần Quang Duy – 2405HTTB013
                  Mai Hoàng Anh – 2305HTTB001
                  Nguyễn Thị Ngân Hà – 2205HTTA019

Hà Nội - 2026

<div style="page-break-after: always;"></div>

`;

const docFiles = [
  '01_MoDau_CoSoPhapLy.md',
  '02_PhanTich_YeuCau_HeThong.md',
  '03_ThietKe_KienTruc_DuLieu.md',
  '04_TrienKhai_VanHanh_KiemThu_QuanTri.md',
  '05_KetLuan_KienNghi_TaiLieuThamKhao.md'
];

let fullContent = coverText;

for (const f of docFiles) {
  const filePath = path.join(docsDir, f);
  if (fs.existsSync(filePath)) {
    const text = fs.readFileSync(filePath, 'utf8');
    fullContent += text.trim() + '\n\n<div style="page-break-after: always;"></div>\n\n';
  } else {
    console.error(`File not found: ${filePath}`);
  }
}

// Remove trailing page-break
fullContent = fullContent.replace(/\n\n<div style="page-break-after: always;"><\/div>\n\n$/, '\n');

fs.writeFileSync(masterMdPath, fullContent, 'utf8');
console.log(`Rebuilt master markdown: ${masterMdPath} (${fs.statSync(masterMdPath).size} bytes)`);
