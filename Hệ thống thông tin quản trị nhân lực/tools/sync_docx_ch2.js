const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const docxPath = path.join(__dirname, '..', 'doc', 'PTTK_OOP_HR.docx');
const imagesDir = path.join(__dirname, '..', 'doc', 'images');

// 21 rows of data for Bảng 2.5
const tableData = [
  {
    stt: '1',
    process: 'Quản trị hệ thống, Định danh & Phân quyền RBAC',
    actors: 'Quản trị viên IT, Toàn thể nhân viên',
    ucs: 'UC01, UC02, UC03',
    screens: '/login, /admin/users, /admin/org-units, /org-chart'
  },
  {
    stt: '2',
    process: 'Tuyển dụng & Quản trị ứng viên',
    actors: 'Trưởng dự án, CV Tuyển dụng, Giám đốc',
    ucs: 'UC04, UC05, UC06, UC07, UC08',
    screens: '/recruitment-ats, /admin/catalogs'
  },
  {
    stt: '3',
    process: 'Tiếp nhận hồ sơ, Văn bằng & Hội nhập',
    actors: 'Nhân viên mới, CV Hồ sơ, IT',
    ucs: 'UC09, UC10, UC11, UC12, UC14',
    screens: '/employees, /documents, /admin/users, /employees/[id]'
  },
  {
    stt: '4',
    process: 'Đánh giá thử việc & Ký hợp đồng',
    actors: 'Trưởng dự án, CV Hồ sơ, Giám đốc',
    ucs: 'UC10, UC13',
    screens: '/employees/[id], /personnel, /salary-ranks'
  },
  {
    stt: '5',
    process: 'Cổng tự phục vụ & Dữ liệu cá nhân 3 mức độ',
    actors: 'Toàn thể nhân viên, CV Hồ sơ',
    ucs: 'UC15, UC16, UC17',
    screens: '/ess, /profile, /notifications, /employees'
  },
  {
    stt: '6',
    process: 'Phân ca & Điểm danh đa nguồn',
    actors: 'Toàn thể nhân viên, Kiosk, CV Hồ sơ',
    ucs: 'UC18, UC19, UC20, UC23, UC24, UC25',
    screens: '/shifts, /check-in, /attendance, /admin/attendance'
  },
  {
    stt: '7',
    process: 'Quản lý Nghỉ phép',
    actors: 'Nhân viên, Trưởng dự án, CV Hồ sơ',
    ucs: 'UC15, UC21',
    screens: '/leave, /ess'
  },
  {
    stt: '8',
    process: 'Quản lý Làm thêm giờ (OT)',
    actors: 'Nhân viên, Trưởng dự án, CV Tiền lương',
    ucs: 'UC15, UC22',
    screens: '/overtime, /attendance'
  },
  {
    stt: '9',
    process: 'Chu kỳ Tính & Khóa Bảng lương',
    actors: 'CV Tiền lương, Kế toán, Giám đốc',
    ucs: 'UC25, UC26, UC27, UC28',
    screens: '/payroll-engine, /ess, /personnel-reports'
  },
  {
    stt: '10',
    process: 'Tạm ứng & Khoản vay phúc lợi',
    actors: 'Nhân viên, CV Tiền lương, Giám đốc',
    ucs: 'UC15, UC29',
    screens: '/loans, /ess, /payroll-engine'
  },
  {
    stt: '11',
    process: 'Đề xuất & Quyết toán công tác (T&E)',
    actors: 'Nhân viên, Trưởng dự án, Kế toán',
    ucs: 'UC15, UC30',
    screens: '/expense-claims, /ess'
  },
  {
    stt: '12',
    process: 'Quản lý Cấp phát & Thu hồi tài sản',
    actors: 'Nhân viên Hành chính, Nhân viên',
    ucs: 'UC15, UC31',
    screens: '/assets, /ess'
  },
  {
    stt: '13',
    process: 'Điều chuyển & Bổ nhiệm vị trí',
    actors: 'Trưởng dự án, Giám đốc, CV Hồ sơ',
    ucs: 'UC09, UC32',
    screens: '/personnel, /org-chart, /employees/[id]'
  },
  {
    stt: '14',
    process: 'Rà soát & Nâng bậc lương NĐ 204',
    actors: 'CV Hồ sơ, Giám đốc',
    ucs: 'UC33, UC41, UC42',
    screens: '/salary-ranks, /personnel, /payroll-engine'
  },
  {
    stt: '15',
    process: 'Khen thưởng & Kỷ luật lao động',
    actors: 'Trưởng dự án, Đại diện NLĐ, Giám đốc',
    ucs: 'UC34, UC35',
    screens: '/personnel, /personnel-reports'
  },
  {
    stt: '16',
    process: 'Thôi việc & Bàn giao đa bộ phận',
    actors: 'Nhân viên, CV Hồ sơ, Các bộ phận',
    ucs: 'UC36',
    screens: '/personnel, /documents, /admin/users'
  },
  {
    stt: '17',
    process: 'Đánh giá Hiệu suất 360 & OKR/KPI',
    actors: 'Nhân viên, Trưởng dự án, CV Nhân sự',
    ucs: 'UC15, UC37',
    screens: '/performance-360, /employees/[id]'
  },
  {
    stt: '18',
    process: 'Đào tạo nội bộ & Khiếu nại lao động',
    actors: 'CV Nhân sự, Nhân viên',
    ucs: 'UC15, UC38, UC39',
    screens: '/training-grievance, /employees/[id]'
  },
  {
    stt: '19',
    process: 'Hồ sơ cán bộ & Báo cáo Mẫu 2C-BNV',
    actors: 'CV Hồ sơ',
    ucs: 'UC40, UC43',
    screens: '/personnel-reports, /admin/catalogs'
  },
  {
    stt: '20',
    process: 'Quản lý tri thức số & Tìm kiếm toàn văn',
    actors: 'Toàn thể nhân viên, Quản lý nội dung',
    ucs: 'UC44, UC45',
    screens: '/documents, /employees'
  },
  {
    stt: '21',
    process: 'Bảng điều khiển phân tích & Kiểm toán hệ thống',
    actors: 'Ban Giám đốc, Quản lý, Quản trị IT',
    ucs: 'UC46, UC47',
    screens: '/dashboard, /admin/audit, /admin/settings'
  }
];

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

let pId = 0x6000;
function getParaId() {
  pId++;
  return pId.toString(16).toUpperCase().padStart(8, '0');
}

function buildTableXml() {
  let xml = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="8777" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="800"/><w:gridCol w:w="2200"/><w:gridCol w:w="1900"/><w:gridCol w:w="1800"/><w:gridCol w:w="2077"/></w:tblGrid>`;

  // Header row
  const headers = ['STT', 'Tên Quy trình nghiệp vụ thực tế', 'Tác nhân chính', 'Mã Use Case hệ thống tương ứng', 'Giao diện màn hình thực tế trong ứng dụng'];
  const widths = ['800', '2200', '1900', '1800', '2077'];
  xml += `<w:tr w:rsidR="00705A97" w14:paraId="${getParaId()}" w14:textId="77777777"><w:trPr><w:jc w:val="center"/></w:trPr>`;
  for (let i = 0; i < 5; i++) {
    xml += `<w:tc><w:tcPr><w:tcW w:w="${widths[i]}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/></w:tcPr><w:p w14:paraId="${getParaId()}" w14:textId="77777777" w:rsidR="00705A97" w:rsidRDefault="006D0969"><w:pPr><w:spacing w:before="60" w:after="60"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(headers[i])}</w:t></w:r></w:p></w:tc>`;
  }
  xml += `</w:tr>`;

  // Data rows
  for (const row of tableData) {
    xml += `<w:tr w:rsidR="00705A97" w14:paraId="${getParaId()}" w14:textId="77777777"><w:trPr><w:jc w:val="center"/></w:trPr>`;

    const cells = [row.stt, row.process, row.actors, row.ucs, row.screens];
    for (let i = 0; i < 5; i++) {
      const align = i === 0 ? 'center' : 'left';
      xml += `<w:tc><w:tcPr><w:tcW w:w="${widths[i]}" w:type="dxa"/></w:tcPr><w:p w14:paraId="${getParaId()}" w14:textId="77777777" w:rsidR="00705A97" w:rsidRDefault="006D0969"><w:pPr><w:spacing w:before="60" w:after="60"/><w:ind w:firstLine="0"/><w:jc w:val="${align}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="000000"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(cells[i])}</w:t></w:r></w:p></w:tc>`;
    }

    xml += `</w:tr>`;
  }

  xml += `</w:tbl>`;
  return xml;
}

function main() {
  console.log('Reading DOCX from:', docxPath);
  const zip = new AdmZip(docxPath);
  let docXml = zip.readAsText('word/document.xml');

  // Locate the actual Bảng 2.5 using needle "UC04, UC05, UC06, UC07, UC08" in the table
  const needle = 'UC04, UC05, UC06, UC07, UC08';
  let pos = 0;
  let cellPos = -1;
  while ((pos = docXml.indexOf(needle, pos)) !== -1) {
    cellPos = pos;
    pos += needle.length;
  }
  if (cellPos === -1) {
    throw new Error('Could not find needle for Bảng 2.5 in docx!');
  }

  // Find exact <w:tbl> start and </w:tbl> end
  let p = cellPos;
  while (p > 0) {
    p = docXml.lastIndexOf('<w:tbl', p - 1);
    if (docXml[p + 6] === '>' || docXml[p + 6] === ' ') {
      break;
    }
  }
  const tblStart = p;
  const tblEnd = docXml.indexOf('</w:tbl>', cellPos) + 8;

  console.log(`Replacing Bảng 2.5 table at [${tblStart}..${tblEnd}] (old length: ${tblEnd - tblStart})...`);
  const newTblXml = buildTableXml();
  docXml = docXml.substring(0, tblStart) + newTblXml + docXml.substring(tblEnd);
  zip.updateFile('word/document.xml', Buffer.from(docXml, 'utf-8'));
  console.log('Updated word/document.xml with complete 21-row Bảng 2.5!');

  // Update images
  const img6 = path.join(imagesDir, 'hinh_2_1_actor_tree.png');
  const img7 = path.join(imagesDir, 'hinh_2_2_usecase_overview.png');
  const img123 = path.join(imagesDir, 'hinh_2_22_arch_3tier.png');

  if (fs.existsSync(img6)) {
    zip.updateFile('word/media/image6.png', fs.readFileSync(img6));
    console.log('Updated word/media/image6.png (Actor tree)');
  }
  if (fs.existsSync(img7)) {
    zip.updateFile('word/media/image7.png', fs.readFileSync(img7));
    console.log('Updated word/media/image7.png (Use Case overview)');
  }
  if (fs.existsSync(img123)) {
    zip.updateFile('word/media/image123.png', fs.readFileSync(img123));
    console.log('Updated word/media/image123.png (3-tier Architecture)');
  }

  zip.writeZip(docxPath);
  console.log('Successfully saved updated DOCX file:', docxPath);
}

main();
