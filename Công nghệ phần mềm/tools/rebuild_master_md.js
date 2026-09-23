const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const docs = [
  path.join(rootDir, 'docs', '01_MoDau_TongQuan.md'),
  path.join(rootDir, 'docs', '02_XacDinh_PhanTich_YeuCau.md'),
  path.join(rootDir, 'docs', '03_ThietKe_HeThong_LapTrinh.md'),
  path.join(rootDir, 'docs', '04_KiemThu_BaoTri_KetLuan.md')
];

const pageBreak = '<div style="page-break-after: always;"></div>';
const contents = docs.map(f => fs.readFileSync(f, 'utf8').trim());
const masterContent = contents.join('\n\n' + pageBreak + '\n\n') + '\n';

const masterPath = path.join(rootDir, 'Bao_Cao_Bai_Tap_Lon_CNPM.md');
fs.writeFileSync(masterPath, masterContent, 'utf8');
console.log('Successfully rebuilt Bao_Cao_Bai_Tap_Lon_CNPM.md, total bytes:', masterContent.length);
