/**
 * Render PlantUML diagrams to PNG using the PlantUML web service.
 * Usage: node render_plantuml.js
 */

const zlib = require('zlib');
const https = require('https');
const fs = require('fs');
const path = require('path');

// PlantUML custom base64 encoding
function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F);
}

function encode64(data) {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}

function encodePlantUml(text) {
  const data = Buffer.from(text, 'utf-8');
  const deflated = zlib.deflateRawSync(data, { level: 9 });
  return encode64(deflated);
}

const http = require('http');

function downloadPng(url) {
  const mod = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const doRequest = (reqUrl) => {
      mod.get(reqUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doRequest(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    doRequest(url);
  });
}

function postPlantUml(pumlText) {
  return new Promise((resolve, reject) => {
    const postData = pumlText;
    const options = {
      hostname: 'www.plantuml.com',
      port: 443,
      path: '/plantuml/png',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData, 'utf-8'),
      },
    };

    const req = https.request(options, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadPng(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`)));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(postData, 'utf-8');
    req.end();
  });
}

async function renderDiagram(pumlText, outputPath) {
  const encoded = encodePlantUml(pumlText);
  const url = `https://www.plantuml.com/plantuml/png/${encoded}`;
  console.log(`Rendering: ${path.basename(outputPath)} ...`);
  console.log(`URL length: ${url.length}`);

  const buffer = await downloadPng(url);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Saved: ${outputPath} (${buffer.length} bytes)`);
}

// ─────────────────────────────────────────────
// DIAGRAM 1: Actor Generalization (Hình 2.1)
// ─────────────────────────────────────────────
const actorTree = `@startuml
left to right direction
skinparam shadowing false
skinparam defaultFontSize 11

actor "Trưởng dự án" as TDA
actor "Đại diện\\nNgười lao động" as DDNLD
actor "Chuyên viên\\nTuyển dụng" as CVTD
actor "Chuyên viên\\nHồ sơ" as CVHS
actor "Chuyên viên\\nTiền lương" as CVTL

actor "Nhân viên\\n(Tác nhân chung)" as NV

actor "Nhân viên\\nHành chính" as NVHC
actor "Kế toán viên" as KTV
actor "Chuyên viên Đào tạo\\n& Hiệu suất" as CVDT
actor "Giám đốc" as GD
actor "Nhân viên\\nQuản trị IT" as NVIT

TDA <|-- NV
DDNLD <|-- NV
CVTD <|-- NV
CVHS <|-- NV
CVTL <|-- NV

NV --|> NVHC
NV --|> KTV
NV --|> CVDT
NV --|> GD
NV --|> NVIT
@enduml`;

// ─────────────────────────────────────────────
// DIAGRAM 2: UC Overview (Hình 2.2)
// Tác nhân phân bổ đều 2 bên, hình elip khớp tên nhóm tối giản
// ─────────────────────────────────────────────
const ucOverview = `@startuml
left to right direction
skinparam linetype ortho
skinparam shadowing false
skinparam packageStyle rectangle
skinparam defaultFontSize 11

' Tác nhân phía bên trái (6 tác nhân)
actor "Nhân viên\\nQuản trị IT" as NVIT
actor "Nhân viên" as NV
actor "Chuyên viên\\nHồ sơ" as CVHS
actor "Trưởng dự án" as TDA
actor "Chuyên viên Đào tạo\\n& Hiệu suất" as CVDT
actor "Chuyên viên\\nTuyển dụng" as CVTD

' Hệ thống và 10 nhóm Use case ở trung tâm
rectangle "HỆ THỐNG QUẢN TRỊ NHÂN LỰC (47 USE CASE)" {
  usecase "A. Quản trị hệ thống & Tổ chức\\n(UC01-UC03)" as GA
  usecase "B. Tuyển dụng & Ứng viên\\n(UC04-UC08)" as GB
  usecase "C. Hồ sơ nhân sự & Hội nhập\\n(UC09-UC14)" as GC
  usecase "D. Cổng tự phục vụ nhân viên\\n(UC15-UC17)" as GD_uc
  usecase "E. Chấm công & Phân ca\\n(UC18-UC25)" as GE
  usecase "F. Tiền lương & Phúc lợi\\n(UC26-UC31)" as GF
  usecase "G. Biến động nhân sự & Thôi việc\\n(UC32-UC36)" as GG
  usecase "H. Đánh giá hiệu suất & Đào tạo\\n(UC37-UC39)" as GH
  usecase "I. Chuẩn cán bộ & Báo cáo\\n(UC40-UC43)" as GI
  usecase "J. Quản trị tri thức & Điều hành\\n(UC44-UC47)" as GJ
}

' Tác nhân phía bên phải (5 tác nhân)
actor "Chuyên viên\\nTiền lương" as CVTL
actor "Nhân viên\\nHành chính" as NVHC
actor "Đại diện\\nNgười lao động" as DDNLD
actor "Giám đốc" as GD
actor "Kế toán viên" as KTV

' Liên kết tác nhân bên trái -> Use Case (mũi tên nét thẳng vuông góc)
NVIT --> GA
NVIT --> GE
NVIT --> GJ

NV --> GA
NV --> GC
NV --> GD_uc
NV --> GE
NV --> GF
NV --> GG
NV --> GH
NV --> GJ

CVHS --> GI
CVHS --> GD_uc
CVHS --> GC
CVHS --> GG

TDA --> GB
TDA --> GC
TDA --> GE
TDA --> GG
TDA --> GH

CVDT --> GH

CVTD --> GB

' Liên kết Use Case -> Tác nhân bên phải (mũi tên nét thẳng vuông góc từ tác nhân vào Use Case)
GE <-- CVTL
GF <-- CVTL
GG <-- CVTL

GF <-- NVHC

GG <-- DDNLD

GI <-- GD
GJ <-- GD
GC <-- GD
GF <-- GD
GG <-- GD
GB <-- GD

GB <-- KTV
GF <-- KTV
@enduml`;

// ─────────────────────────────────────────────

const imagesDir = process.argv[2] || path.join(__dirname, '..', 'doc', 'images');

async function main() {
  try {
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    await renderDiagram(actorTree, path.join(imagesDir, 'hinh_2_1_actor_tree.png'));
    await renderDiagram(ucOverview, path.join(imagesDir, 'hinh_2_2_usecase_overview.png'));
    console.log('\\nDone! Both diagrams rendered successfully.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
