/**
 * Update PTTK_OOP_HR.docx:
 * 1. Replace old group names with simplified names in document.xml
 * 2. Replace actor tree and UC overview images
 */

const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const docxPath = path.join(__dirname, '..', 'doc', 'PTTK_OOP_HR.docx');
const imagesDir = path.join(__dirname, '..', 'doc', 'images');

// ── Text replacements (old → new) ──
const textReplacements = [
  // Group A
  ['Quản trị hệ thống & Cơ cấu tổ chức', 'Quản trị hệ thống & Tổ chức'],
  ['Quản trị hệ thống \u0026 Cơ cấu tổ chức', 'Quản trị hệ thống \u0026 Tổ chức'],
  // Group B
  ['Tuyển dụng & Quản lý ứng viên', 'Tuyển dụng & Ứng viên'],
  ['Tuyển dụng \u0026 Quản lý ứng viên', 'Tuyển dụng \u0026 Ứng viên'],
  // Group C
  ['Hồ sơ nhân sự, Hợp đồng & Hội nhập', 'Hồ sơ nhân sự & Hội nhập'],
  ['Hồ sơ nhân sự, Hợp đồng \u0026 Hội nhập', 'Hồ sơ nhân sự \u0026 Hội nhập'],
  // Group D
  ['Cổng tự phục vụ ESS & Phân cấp hồ sơ', 'Cổng tự phục vụ nhân viên'],
  ['Cổng tự phục vụ ESS \u0026 Phân cấp hồ sơ', 'Cổng tự phục vụ nhân viên'],
  ['Cổng tự phục vụ & Phân cấp hồ sơ', 'Cổng tự phục vụ nhân viên'],
  ['Cổng tự phục vụ \u0026 Phân cấp hồ sơ', 'Cổng tự phục vụ nhân viên'],
  // Group E
  ['Chấm công, Phân ca & Điểm danh đa nguồn', 'Chấm công & Phân ca'],
  ['Chấm công, Phân ca \u0026 Điểm danh đa nguồn', 'Chấm công \u0026 Phân ca'],
  // Group F
  ['Tiền lương, Chế độ đãi ngộ & Phúc lợi', 'Tiền lương & Phúc lợi'],
  ['Tiền lương, Chế độ đãi ngộ \u0026 Phúc lợi', 'Tiền lương \u0026 Phúc lợi'],
  // Group H
  ['Đánh giá hiệu suất, Đào tạo & Phát triển', 'Đánh giá hiệu suất & Đào tạo'],
  ['Đánh giá hiệu suất, Đào tạo \u0026 Phát triển', 'Đánh giá hiệu suất \u0026 Đào tạo'],
  ['Đánh giá hiệu suất, Đào tạo & Khiếu nại', 'Đánh giá hiệu suất & Đào tạo'],
  ['Đánh giá hiệu suất, Đào tạo \u0026 Khiếu nại', 'Đánh giá hiệu suất \u0026 Đào tạo'],
  // Group I
  ['Chuẩn cán bộ & Báo cáo Nhà nước', 'Chuẩn cán bộ & Báo cáo'],
  ['Chuẩn cán bộ \u0026 Báo cáo Nhà nước', 'Chuẩn cán bộ \u0026 Báo cáo'],
  // Group J
  ['Quản trị Tri thức SOP & Điều hành hệ thống', 'Quản trị tri thức & Điều hành'],
  ['Quản trị Tri thức SOP \u0026 Điều hành hệ thống', 'Quản trị tri thức \u0026 Điều hành'],
  ['Quản trị Tri thức & Điều hành hệ thống', 'Quản trị tri thức & Điều hành'],
  ['Quản trị Tri thức \u0026 Điều hành hệ thống', 'Quản trị tri thức \u0026 Điều hành'],
];

function main() {
  console.log('Opening:', docxPath);
  const zip = new AdmZip(docxPath);

  // ── Step 1: Text replacements in all XML parts ──
  const xmlParts = ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/footer1.xml', 'word/footer2.xml'];
  
  for (const partName of xmlParts) {
    const entry = zip.getEntry(partName);
    if (!entry) continue;
    
    let xml = entry.getData().toString('utf-8');
    let changed = false;
    
    for (const [oldText, newText] of textReplacements) {
      if (xml.includes(oldText)) {
        xml = xml.split(oldText).join(newText);
        changed = true;
        console.log(`  [${partName}] "${oldText}" → "${newText}"`);
      }
    }
    
    if (changed) {
      zip.updateFile(partName, Buffer.from(xml, 'utf-8'));
    }
  }

  // ── Step 2: Replace images ──
  // From analysis:
  //   hinh_2_1_actor_tree → rId13 → word/media/image6.png
  //   Hình 2.2 UC overview → rId14 → word/media/image7.png
  
  // Approach: search for pic:cNvPr elements with known names and find their blip rId
  const docEntry = zip.getEntry('word/document.xml');
  const docXml = docEntry.getData().toString('utf-8');
  const relsEntry = zip.getEntry('word/_rels/document.xml.rels');
  
  if (relsEntry) {
    const relsXml = relsEntry.getData().toString('utf-8');
    const relMap = {};
    [...relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g)].forEach(m => relMap[m[1]] = m[2]);
    
    // Find actor tree image (contains "hinh_2_1" or "actor" in pic:cNvPr name)
    const actorMatch = docXml.match(/cNvPr[^>]*name="[^"]*hinh_2_1[^"]*"[^]*?r:embed="(rId\d+)"/);
    if (actorMatch) {
      const fn = relMap[actorMatch[1]];
      if (fn) {
        const mediaPath = `word/media/${fn}`;
        const newImg = fs.readFileSync(path.join(imagesDir, 'hinh_2_1_actor_tree.png'));
        zip.updateFile(mediaPath, newImg);
        console.log(`\n>>> Replaced ${mediaPath} (${actorMatch[1]}) with hinh_2_1_actor_tree.png (${newImg.length} bytes)`);
      }
    } else {
      console.log('WARNING: Could not find actor tree image reference');
    }
    
    // Find UC overview image (contains "Hình 2.2" in pic:cNvPr name)
    const overviewMatch = docXml.match(/cNvPr[^>]*name="[^"]*Hình 2\.2[^"]*"[^]*?r:embed="(rId\d+)"/);
    if (overviewMatch) {
      const fn = relMap[overviewMatch[1]];
      if (fn) {
        const mediaPath = `word/media/${fn}`;
        const newImg = fs.readFileSync(path.join(imagesDir, 'hinh_2_2_usecase_overview.png'));
        zip.updateFile(mediaPath, newImg);
        console.log(`>>> Replaced ${mediaPath} (${overviewMatch[1]}) with hinh_2_2_usecase_overview.png (${newImg.length} bytes)`);
      }
    } else {
      console.log('WARNING: Could not find UC overview image reference');
    }
  }

  // ── Step 3: Save (use temp file to avoid EBUSY on OneDrive) ──
  const tempPath = docxPath + '.tmp';
  zip.writeZip(tempPath);
  
  try {
    fs.renameSync(tempPath, docxPath);
  } catch (e) {
    // If rename fails (EBUSY), try copy + delete
    try {
      fs.copyFileSync(tempPath, docxPath);
      fs.unlinkSync(tempPath);
    } catch (e2) {
      console.log(`\nCouldn't overwrite original (file locked). Saved as: ${tempPath}`);
      console.log('Please close the docx file and rename manually, or run again.');
    }
  }
  
  console.log(`\nUpdated: ${docxPath}`);
  console.log('Done!');
}

main();
