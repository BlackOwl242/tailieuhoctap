const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const docxPath = path.join(__dirname, '..', 'doc', 'PTTK_OOP_HR.docx');
const mdPath = path.join(__dirname, '..', 'doc', 'PTTK_OOP_HR.md');

// Escape XML
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Parse markdown inline bold/italic into w:r runs
function parseInlineRuns(text) {
  if (!text) return '';
  const tokens = [];
  // Match **bold**, *italic*, or plain text
  const regex = /(\*\*[^*]+?\*\*|\*[^*]+?\*|[^*]+|\*)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const chunk = match[0];
    if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length >= 4) {
      tokens.push({ text: chunk.slice(2, -2), bold: true });
    } else if (chunk.startsWith('*') && chunk.endsWith('*') && chunk.length >= 2) {
      tokens.push({ text: chunk.slice(1, -1), italic: true });
    } else {
      tokens.push({ text: chunk });
    }
  }

  let xml = '';
  for (const token of tokens) {
    if (!token.text) continue;
    let rPr = '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="000000"/><w:szCs w:val="26"/>';
    if (token.bold) rPr += '<w:b/><w:bCs/>';
    if (token.italic) rPr += '<w:i/><w:iCs/>';
    rPr += '</w:rPr>';
    xml += `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(token.text)}</w:t></w:r>`;
  }
  return xml;
}

// Generate random hex for paraId
let paraCounter = 0x1000;
function getParaId() {
  paraCounter++;
  return paraCounter.toString(16).toUpperCase().padStart(8, '0');
}

// Create heading level 2 (mc2): 1.3.1, 1.3.2, 1.3.3, 1.3.4
function createHeading2(text) {
  return `<w:p w14:paraId="${getParaId()}" w14:textId="77777777" w:rsidR="00705A97" w:rsidRDefault="006D0969"><w:pPr><w:pStyle w:val="mc2"/><w:spacing w:before="180" w:after="80"/><w:ind w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:color w:val="000000"/><w:szCs w:val="26"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

// Create heading level 3 (mc3): 1. Quy trình Tuyển dụng...
function createHeading3(text) {
  return `<w:p w14:paraId="${getParaId()}" w14:textId="77777777" w:rsidR="00705A97" w:rsidRDefault="006D0969"><w:pPr><w:pStyle w:val="mc3"/><w:spacing w:before="140" w:after="60"/><w:ind w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:i/><w:iCs/><w:color w:val="1F4E79"/><w:szCs w:val="26"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

// Create table title/caption
function createTableCaption(text) {
  return `<w:p w14:paraId="${getParaId()}" w14:textId="77777777" w:rsidR="00705A97" w:rsidRDefault="006D0969"><w:pPr><w:spacing w:before="140" w:after="60"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:color w:val="000000"/><w:szCs w:val="26"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

// Create standard paragraph
function createParagraph(text, indentLevel = 0) {
  let pPr = `<w:pPr><w:spacing w:before="60" w:after="60"/><w:jc w:val="both"/>`;
  if (indentLevel === 0) {
    pPr += `<w:ind w:firstLine="360"/>`;
  } else if (indentLevel === 1) {
    pPr += `<w:ind w:left="480" w:firstLine="0"/>`;
  } else if (indentLevel === 2) {
    pPr += `<w:ind w:left="720" w:firstLine="0"/>`;
  }
  pPr += `</w:pPr>`;
  
  return `<w:p w14:paraId="${getParaId()}" w14:textId="77777777" w:rsidR="00705A97" w:rsidRDefault="006D0969">${pPr}${parseInlineRuns(text)}</w:p>`;
}

// Create RACI Matrix table
function createRaciTable() {
  // Columns: 9 cols. Total width = 8777 dxa
  // Col 0: STT (500)
  // Col 1: Quy trình (1777)
  // Col 2: Delivery (900)
  // Col 3: HR-TA (900)
  // Col 4: HR-OPS (900)
  // Col 5: HR-C&B (900)
  // Col 6: Vận hành (900)
  // Col 7: Tài chính (900)
  // Col 8: BGD (1100)
  // Total = 500+1777+900*6+1100 = 8777
  const colWidths = [500, 1777, 900, 900, 900, 900, 900, 900, 1100];
  
  const headers = [
    'STT',
    'Quy trình Quản trị Nhân sự',
    'Khối Kỹ thuật (Delivery)',
    'Khối HR (Tuyển dụng)',
    'Khối HR (Hồ sơ)',
    'Khối HR (Tiền lương)',
    'Khối Vận hành (Hành chính & IT)',
    'Khối Tài chính - Kế toán',
    'Ban Giám đốc (BGD)'
  ];

  const rows = [
    ['1', 'Tuyển dụng và thu hút nhân sự', '**R** (Đề xuất & Phỏng vấn)', '**R** (Sàng lọc & Điều phối)', '**I** (Nhận thông tin)', '**I** (Tham khảo khung lương)', '**C** (Hỗ trợ kỹ thuật)', '**C** (Kiểm tra ngân sách)', '**A** (Phê duyệt chỉ tiêu & Thư mời)'],
    ['2', 'Tiếp nhận nhân sự mới & HĐLĐ', '**C** (Hướng dẫn công việc)', '**I** (Bàn giao hồ sơ)', '**R** (Soạn HĐ & Đón tiếp)', '**I** (Nhận thông tin lương)', '**R** (Cấp máy tính & Thẻ từ)', '**I** (Mở tài khoản lương)', '**A** (Ký hợp đồng)'],
    ['3', 'Phân ca và chấm công', '**R** (Xếp ca & Duyệt công)', '**I**', '**C** (Theo dõi hồ sơ)', '**R** (Đối soát & Khóa bảng công)', '**R** (Bảo trì máy chấm công)', '**I** (Nhận số liệu công)', '**I** (Xem báo cáo)'],
    ['4', 'Xét duyệt nghỉ phép & Làm thêm giờ', '**R** (Đề xuất OT & Duyệt phép)', '**I**', '**C** (Kiểm tra chế độ)', '**R** (Kiểm soát trần 40h OT)', '**I**', '**C** (Dự toán chi phí OT)', '**A** (Duyệt OT & Nghỉ dài ngày)'],
    ['5', 'Tính toán và chi trả tiền lương', '**I** (Xác nhận ngày công)', '**I**', '**C** (Cập nhật biến động lương)', '**R** (Tính toán & Gửi phiếu lương)', '**I**', '**C** (Kiểm tra & Chuyển khoản)', '**A** (Phê duyệt bảng lương)'],
    ['6', 'Tạm ứng lương và vay phúc lợi', '**C** (Xác nhận thời gian làm)', '**I**', '**I** (Lưu hồ sơ vay)', '**R** (Kiểm tra mức trừ 30%)', '**I**', '**R** (Kiểm tra quỹ & Giải ngân)', '**A** (Phê duyệt hợp đồng vay)'],
    ['7', 'Đánh giá hiệu suất và đào tạo', '**R** (Chấm điểm & Trao đổi 1-1)', '**I**', '**C** (Lưu hồ sơ đánh giá)', '**C** (Lấy kết quả chia thưởng)', '**I**', '**C** (Cấp ngân sách đào tạo)', '**A** (Phê duyệt xếp loại)'],
    ['8', 'Bổ nhiệm, khen thưởng & Kỷ luật', '**R** (Lập đề xuất / Biên bản)', '**I**', '**R** (Chuẩn bị thủ tục)', '**C** (Điều chỉnh bậc lương)', '**C** (Cập nhật quyền hệ thống)', '**C** (Chi trả / Khấu trừ)', '**A** (Ký quyết định chính thức)'],
    ['9', 'Thôi việc và bàn giao công việc', '**R** (Nghiệm thu mã nguồn)', '**I** (Trao đổi lý do nghỉ)', '**R** (Chốt hồ sơ & Trả sổ BHXH)', '**R** (Chốt phép & Chế độ thôi việc)', '**R** (Thu hồi máy tính & Khóa tài khoản)', '**R** (Thu hồi nợ & Quyết toán)', '**A** (Ký quyết định thôi việc)']
  ];

  let xml = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="8777" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>`;
  
  for (const w of colWidths) {
    xml += `<w:gridCol w:w="${w}"/>`;
  }
  xml += `</w:tblGrid>`;

  // Header row
  xml += `<w:tr w:rsidR="00705A97"><w:trPr><w:tblHeader/><w:jc w:val="center"/></w:trPr>`;
  for (let i = 0; i < headers.length; i++) {
    xml += `<w:tc><w:tcPr><w:tcW w:w="${colWidths[i]}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>${escapeXml(headers[i])}</w:t></w:r></w:p></w:tc>`;
  }
  xml += `</w:tr>`;

  // Data rows
  for (const row of rows) {
    xml += `<w:tr w:rsidR="00705A97"><w:trPr><w:jc w:val="center"/></w:trPr>`;
    for (let i = 0; i < row.length; i++) {
      const align = (i === 0) ? 'center' : ((i === 1) ? 'left' : 'center');
      const cellText = row[i];
      xml += `<w:tc><w:tcPr><w:tcW w:w="${colWidths[i]}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/><w:jc w:val="${align}"/></w:pPr>${parseTableCellRuns(cellText)}</w:p></w:tc>`;
    }
    xml += `</w:tr>`;
  }

  xml += `</w:tbl>`;
  return xml;
}

function parseTableCellRuns(text) {
  const tokens = [];
  let remaining = text;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/);
    if (boldMatch) {
      if (boldMatch[1].length > 0) {
        tokens.push({ text: boldMatch[1] });
      }
      tokens.push({ text: boldMatch[2], bold: true });
      remaining = boldMatch[3];
    } else {
      tokens.push({ text: remaining });
      remaining = '';
    }
  }

  let xml = '';
  for (const t of tokens) {
    let rPr = '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="18"/><w:szCs w:val="18"/>';
    if (t.bold) rPr += '<w:b/><w:bCs/>';
    rPr += '</w:rPr>';
    xml += `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(t.text)}</w:t></w:r>`;
  }
  return xml;
}

function buildSectionXml() {
  const md = fs.readFileSync(mdPath, 'utf-8');
  
  // Extract section 1.3 from md (between "## 1.3. Phát biểu bài toán cần giải quyết" and "## Tóm tắt chương 1")
  const sStart = md.indexOf('## 1.3. Phát biểu bài toán cần giải quyết');
  const sEnd = md.indexOf('## Tóm tắt chương 1', sStart);
  if (sStart === -1 || sEnd === -1) {
    throw new Error('Could not find Section 1.3 in PTTK_OOP_HR.md');
  }
  
  const sectionMd = md.substring(sStart, sEnd);
  const lines = sectionMd.split('\n');
  
  let sectionXml = '';
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Ignore markdown header 2 (the main section title which is already in docx bookmark)
    if (line.startsWith('## 1.3.')) {
      continue;
    }
    
    // Heading 3: ### 1.3.1, 1.3.2, 1.3.3, 1.3.4
    if (line.startsWith('### 1.3.')) {
      const headingText = line.replace(/^###\s+/, '');
      sectionXml += createHeading2(headingText);
      continue;
    }
    
    // Heading 4: #### 1. Quy trình Tuyển dụng...
    if (line.startsWith('#### ')) {
      const headingText = line.replace(/^####\s+/, '');
      sectionXml += createHeading3(headingText);
      continue;
    }
    
    // Table caption: **Bảng 1.5. ...**
    if (line.startsWith('**Bảng 1.5.')) {
      const captionText = line.replace(/^\*\*/, '').replace(/\*\*$/, '');
      sectionXml += createTableCaption(captionText);
      // Next lines are table markdown, we will insert pre-built createRaciTable() and skip lines until table ends
      sectionXml += createRaciTable();
      inTable = true;
      continue;
    }
    
    if (inTable) {
      if (line.startsWith('|') || line.startsWith(':---')) {
        continue; // skip markdown table lines
      } else {
        inTable = false;
      }
    }
    
    // Check note below table
    if (line.startsWith('*Ghi chú:')) {
      const noteText = line.replace(/^\*/, '').replace(/\*$/, '');
      sectionXml += createParagraph(noteText, 1);
      continue;
    }
    
    // Bullet / Sub-bullet / List items
    if (line.startsWith('- **') || line.startsWith('- *') || line.startsWith('- ')) {
      const bulletText = line.replace(/^-\s+/, '• ');
      sectionXml += createParagraph(bulletText, 1);
      continue;
    }
    
    // Sub-sub-bullet (indented in markdown)
    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.') || line.startsWith('6.')) {
      sectionXml += createParagraph(line, 1);
      continue;
    }
    
    // Regular paragraph
    sectionXml += createParagraph(line, 0);
  }
  
  return sectionXml;
}

function updateDocx() {
  console.log('Loading docx:', docxPath);
  const zip = new AdmZip(docxPath);
  let docXml = zip.getEntry('word/document.xml').getData().toString('utf-8');
  
  // 1. Find boundaries of section 1.3 body
  const marker1 = 'w:name="_Toc_c1_3"';
  const marker2 = 'w:name="_Toc_c1_sum"';

  const pos1 = docXml.indexOf(marker1);
  const startP = docXml.indexOf('</w:p>', pos1) + 6;

  const pos2 = docXml.indexOf(marker2);
  const endPStart = docXml.lastIndexOf('<w:p ', pos2);

  if (pos1 === -1 || pos2 === -1) {
    throw new Error('Bookmarks not found!');
  }

  console.log(`Replacing XML from char ${startP} to ${endPStart}...`);
  const newSectionXml = buildSectionXml();
  console.log(`Generated XML length: ${newSectionXml.length} chars`);
  
  // Update section title text if needed
  let updatedDocXml = docXml.substring(0, startP) + newSectionXml + docXml.substring(endPStart);
  
  // 2. Also update List of Tables: add Bảng 1.5 after Bảng 1.4
  const b14Text = 'Bảng 1.4. Cơ cấu nguồn nhân lực theo khối chức năng và trình độ tại Saigon Technology';
  const b15Item = `<w:p w14:paraId="${getParaId()}" w14:textId="77777777" w:rsidR="00705A97" w:rsidRDefault="006D0969"><w:pPr><w:spacing w:before="60" w:after="60"/><w:ind w:firstLine="0"/><w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="000000"/><w:szCs w:val="26"/></w:rPr><w:t>- Bảng 1.5. Ma trận phân định trách nhiệm liên phòng ban trong các quy trình quản trị nhân sự (RACI Matrix)</w:t></w:r></w:p>`;
  
  const b14Idx = updatedDocXml.indexOf(b14Text);
  if (b14Idx !== -1) {
    const b14PEnd = updatedDocXml.indexOf('</w:p>', b14Idx) + 6;
    if (!updatedDocXml.includes('Bảng 1.5. Ma trận phân định')) {
      updatedDocXml = updatedDocXml.substring(0, b14PEnd) + b15Item + updatedDocXml.substring(b14PEnd);
      console.log('Added Bảng 1.5 to List of Tables in docx!');
    }
  }

  zip.updateFile('word/document.xml', Buffer.from(updatedDocXml, 'utf-8'));
  
  const tempPath = docxPath + '.tmp';
  zip.writeZip(tempPath);
  
  try {
    fs.renameSync(tempPath, docxPath);
    console.log('Successfully updated:', docxPath);
  } catch (e) {
    try {
      fs.copyFileSync(tempPath, docxPath);
      fs.unlinkSync(tempPath);
      console.log('Successfully copied and updated:', docxPath);
    } catch (e2) {
      console.log('Error writing to docx, saved to temp:', tempPath);
    }
  }

  // Also save to PTTK_OOP_HR_v2.docx
  const v2Path = path.join(__dirname, '..', 'doc', 'PTTK_OOP_HR_v2.docx');
  fs.copyFileSync(docxPath, v2Path);
  console.log('Synced to:', v2Path);
}

try {
  updateDocx();
} catch (err) {
  console.error('Error:', err);
}
