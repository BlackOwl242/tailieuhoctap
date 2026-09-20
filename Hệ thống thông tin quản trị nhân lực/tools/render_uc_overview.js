/**
 * Render UC overview v3 - clean layout:
 * - left to right direction (actors left, UCs right)
 * - NO ortho (avoid line tangling)
 * - stick figures (default actor style, smaller)
 * - actors split: 5 left, 6 right
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PUML = `@startuml
skinparam shadowing false
skinparam defaultFontSize 11
skinparam packageStyle rectangle
left to right direction

actor "Nhân viên" as NV
actor "Trưởng dự án" as TDA
actor "Chuyên viên\\nHồ sơ" as CVHS
actor "Chuyên viên\\nTiền lương" as CVTL
actor "Đại diện\\nNgười lao động" as DDNLD

rectangle "HỆ THỐNG QUẢN TRỊ NHÂN LỰC (47 USE CASE)" {
  (A. Quản trị hệ thống & Tổ chức\\n(UC01-UC03)) as GA
  (B. Tuyển dụng & Ứng viên\\n(UC04-UC08)) as GB
  (C. Hồ sơ nhân sự & Hội nhập\\n(UC09-UC14)) as GC
  (D. Cổng tự phục vụ nhân viên\\n(UC15-UC17)) as GD_uc
  (E. Chấm công & Phân ca\\n(UC18-UC25)) as GE
  (F. Tiền lương & Phúc lợi\\n(UC26-UC31)) as GF
  (G. Biến động nhân sự & Thôi việc\\n(UC32-UC36)) as GG
  (H. Đánh giá hiệu suất & Đào tạo\\n(UC37-UC39)) as GH
  (I. Chuẩn cán bộ & Báo cáo\\n(UC40-UC43)) as GI
  (J. Quản trị tri thức & Điều hành\\n(UC44-UC47)) as GJ
}

actor "NV Quản trị IT" as NVIT
actor "CV Tuyển dụng" as CVTD
actor "Giám đốc" as GD
actor "Kế toán viên" as KTV
actor "NV Hành chính" as NVHC
actor "CV Đào tạo\\n& Hiệu suất" as CVDT

NV -- GA
NV -- GC
NV -- GD_uc
NV -- GE
NV -- GF
NV -- GG
NV -- GH
NV -- GJ

TDA -- GB
TDA -- GC
TDA -- GE
TDA -- GG
TDA -- GH

CVHS -- GC
CVHS -- GD_uc
CVHS -- GG
CVHS -- GI

CVTL -- GE
CVTL -- GF
CVTL -- GG

DDNLD -- GG

NVIT -- GA
NVIT -- GE
NVIT -- GJ

CVTD -- GB

GD -- GB
GD -- GC
GD -- GF
GD -- GG
GD -- GI
GD -- GJ

KTV -- GB
KTV -- GF

NVHC -- GF

CVDT -- GH
@enduml`;

// Encode for PlantUML HTTP POST
function postPlantUML(puml, outPath) {
  const deflated = zlib.deflateRawSync(Buffer.from(puml, 'utf-8'));
  
  const postData = 'text=' + encodeURIComponent(puml);
  
  const options = {
    hostname: 'www.plantuml.com',
    port: 443,
    path: '/plantuml/png',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => {
            const buf = Buffer.concat(chunks);
            fs.writeFileSync(outPath, buf);
            console.log(`Saved: ${outPath} (${buf.length} bytes)`);
            resolve();
          });
        }).on('error', reject);
        return;
      }
      
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf[0] === 0x89 && buf[1] === 0x50) { // PNG magic
          fs.writeFileSync(outPath, buf);
          console.log(`Saved: ${outPath} (${buf.length} bytes)`);
        } else {
          console.log('Response:', buf.toString().substring(0, 500));
        }
        resolve();
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const outPath = path.join(__dirname, '..', 'doc', 'images', 'hinh_2_2_usecase_overview.png');
  console.log('Rendering UC overview v3...');
  await postPlantUML(PUML, outPath);
  console.log('Done!');
}

main().catch(console.error);
