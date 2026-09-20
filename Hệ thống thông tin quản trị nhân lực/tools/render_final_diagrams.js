const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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
    if (i + 2 === data.length) r += append3bytes(data[i], data[i + 1], 0);
    else if (i + 1 === data.length) r += append3bytes(data[i], 0, 0);
    else r += append3bytes(data[i], data[i + 1], data[i + 2]);
  }
  return r;
}
function encodePlantUml(text) {
  return encode64(zlib.deflateRawSync(Buffer.from(text, 'utf-8'), { level: 9 }));
}

async function render(puml, out) {
  const enc = encodePlantUml(puml);
  const url = 'https://www.plantuml.com/plantuml/png/' + enc;
  console.log(`Rendering ${path.basename(out)} (URL len: ${url.length})...`);
  return new Promise((res, rej) => {
    https.get(url, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        https.get(r.headers.location, r2 => {
          const chunks = [];
          r2.on('data', c => chunks.push(c));
          r2.on('end', () => {
            const buf = Buffer.concat(chunks);
            fs.writeFileSync(out, buf);
            console.log(`  Saved: ${out} (${buf.length} bytes)`);
            res();
          });
        }).on('error', rej);
        return;
      }
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(out, buf);
        console.log(`  Saved: ${out} (${buf.length} bytes)`);
        res();
      });
    }).on('error', rej);
  });
}

// ── SƠ ĐỒ 1: Phân cấp Tác nhân (Hình 2.1) ──
const actorTreePuml = `@startuml
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

// ── SƠ ĐỒ 2: Tổng quan Use case (Hình 2.2) ──
const ucOverviewPuml = `@startuml
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

async function main() {
  const imagesDir = path.join(__dirname, '..', 'doc', 'images');
  await render(actorTreePuml, path.join(imagesDir, 'hinh_2_1_actor_tree.png'));
  await render(ucOverviewPuml, path.join(imagesDir, 'hinh_2_2_usecase_overview.png'));
  console.log('Finished rendering both diagrams!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
