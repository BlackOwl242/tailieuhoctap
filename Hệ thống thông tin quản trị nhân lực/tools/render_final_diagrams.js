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
  console.log(`Rendering ${path.basename(out)}...`);
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

' Tác nhân phía bên trái (6 tác nhân xếp theo thứ tự nhóm chức năng từ trên xuống)
actor "Chuyên viên\\nTuyển dụng" as CVTD
actor "Nhân viên\\nQuản trị IT" as NVIT
actor "Chuyên viên\\nHồ sơ" as CVHS
actor "Trưởng dự án" as TDA
actor "Nhân viên" as NV
actor "Chuyên viên Đào tạo\\n& Hiệu suất" as CVDT

rectangle "HỆ THỐNG QUẢN TRỊ NHÂN LỰC (47 USE CASE)" {
  usecase "I. Chuẩn cán bộ & Báo cáo\\n(UC40-UC43)" as GI
  usecase "B. Tuyển dụng & Ứng viên\\n(UC04-UC08)" as GB
  usecase "A. Quản trị hệ thống & Tổ chức\\n(UC01-UC03)" as GA
  usecase "J. Quản trị tri thức & Điều hành\\n(UC44-UC47)" as GJ
  usecase "C. Hồ sơ nhân sự & Hội nhập\\n(UC09-UC14)" as GC
  usecase "G. Biến động nhân sự & Thôi việc\\n(UC32-UC36)" as GG
  usecase "E. Chấm công & Phân ca\\n(UC18-UC25)" as GE
  usecase "F. Tiền lương & Phúc lợi\\n(UC26-UC31)" as GF
  usecase "D. Cổng tự phục vụ nhân viên\\n(UC15-UC17)" as GD_uc
  usecase "H. Đánh giá hiệu suất & Đào tạo\\n(UC37-UC39)" as GH
}

' Tác nhân phía bên phải (5 tác nhân)
actor "Giám đốc" as GD
actor "Kế toán viên" as KTV
actor "Đại diện\\nNgười lao động" as DDNLD
actor "Chuyên viên\\nTiền lương" as CVTL
actor "Nhân viên\\nHành chính" as NVHC

CVTD --> GB

NVIT --> GA
NVIT --> GJ

CVHS --> GC
CVHS --> GI
CVHS --> GG

TDA --> GB
TDA --> GC
TDA --> GE
TDA --> GG
TDA --> GH

NV --> GA
NV --> GC
NV --> GD_uc
NV --> GE
NV --> GF
NV --> GG
NV --> GH
NV --> GJ

CVDT --> GH

GB <-- GD
GC <-- GD
GF <-- GD
GG <-- GD
GI <-- GD
GJ <-- GD

GB <-- KTV
GF <-- KTV

GG <-- DDNLD

GE <-- CVTL
GF <-- CVTL
GG <-- CVTL

GF <-- NVHC
@enduml`;

// ── SƠ ĐỒ 3: Kiến trúc 3 tầng (Hình 2.109 / hinh_2_22_arch_3tier.png - Bố cục dọc chuẩn A4) ──
const arch3TierPuml = `@startuml
skinparam shadowing false
skinparam roundCorner 8
skinparam defaultFontName "Arial"
skinparam defaultFontSize 12
skinparam packageStyle rectangle

skinparam package {
  BackgroundColor #F8FAFC
  BorderColor #334155
  BorderThickness 1.5
  FontColor #0F172A
  FontStyle bold
}

skinparam component {
  BackgroundColor #FFFFFF
  BorderColor #475569
  BorderThickness 1.2
  FontColor #1E293B
  FontSize 11
}

skinparam database {
  BackgroundColor #EFF6FF
  BorderColor #2563EB
  BorderThickness 1.5
  FontColor #1E3A8A
  FontSize 11
}

skinparam folder {
  BackgroundColor #F0FDF4
  BorderColor #16A34A
  BorderThickness 1.5
  FontColor #14532D
  FontSize 11
}

skinparam arrow {
  Color #2563EB
  FontColor #0F172A
  FontSize 11
  Thickness 1.5
}

package "TẦNG 1: GIAO DIỆN NGƯỜI DÙNG (PRESENTATION TIER)" as T1 {
  component "Web Quản trị & Điều hành Hệ thống\\n(Next.js 14 App Router • Tailwind CSS • TypeScript)" as C_Web
  component "Cổng Tự phục vụ Nhân viên ESS\\n(Giao diện Responsive Mobile-First Web PWA)" as C_ESS
  component "Kiosk / Thiết bị Điểm danh Ngoại vi\\n(Face ID 2D + Cảm biến IR + Quét mã QR)" as C_Kiosk
  
  C_Web -[hidden]down-> C_ESS
  C_ESS -[hidden]down-> C_Kiosk
}

package "TẦNG 2: XỬ LÝ NGHIỆP VỤ (BUSINESS LOGIC TIER - NESTJS 10)" as T2 {
  component "API Gateway & Security Layer\\n(JWT Authentication • RBAC 3 Vai trò: ADMIN / KM_MANAGER / USER • HMAC Webhook)" as C_Gateway

  component "39 Module Nghiệp vụ Quản trị Nhân sự Chuyên sâu\\n(Hệ thống, Tuyển dụng, Hồ sơ, Chấm công, Tiền lương, Biến động, Mẫu 2C-BNV, SOP)" as C_Modules

  component "Bộ máy Xử lý Trung tâm (Core Business Engines)\\n• ApprovalEngine: Xử lý quy trình duyệt động phân cấp đa cấp\\n• PayrollEngine: Tính toán bảng lương tự động & Cơ chế khóa sổ LOCKED\\n• NotificationService: Hệ thống thông báo in-app thời gian thực" as C_Engines

  C_Gateway -down-> C_Modules : "Điều phối Controller & DTO Validation"
  C_Modules -down-> C_Engines : "Kích hoạt thực thi logic nghiệp vụ"
}

package "TẦNG 3: LƯU TRỮ DỮ LIỆU & TÀI NGUYÊN (DATA & STORAGE TIER)" as T3 {
  database "Cơ sở Dữ liệu Quan hệ PostgreSQL 16 (Prisma ORM)\\n(87 Model Quan hệ • Sổ cái Audit Log Append-Only)" as DB_Postgres
  database "Hệ thống Bộ nhớ đệm Redis Cache\\n(Quản lý Phiên làm việc & Danh sách Token Blacklist)" as DB_Redis
  folder "Kho Lưu trữ Tệp & Minh chứng Số hóa\\n(Bản scan Hợp đồng, Minh chứng chấm công Mức 2, SOP)" as FS_Store

  DB_Postgres -[hidden]down-> DB_Redis
  DB_Redis -[hidden]down-> FS_Store
}

' Kết nối giữa các tầng từ trên xuống dưới
C_Kiosk -down-> C_Gateway : "HTTPS / RESTful API (JSON Payload • JWT Auth)"
C_Engines -down-> DB_Postgres : "Prisma Client (SQL) • Redis Protocol • File Storage"

@enduml`;

async function main() {
  const imagesDir = path.join(__dirname, '..', 'doc', 'images');
  await render(actorTreePuml, path.join(imagesDir, 'hinh_2_1_actor_tree.png'));
  await render(ucOverviewPuml, path.join(imagesDir, 'hinh_2_2_usecase_overview.png'));
  await render(arch3TierPuml, path.join(imagesDir, 'hinh_2_22_arch_3tier.png'));
  console.log('Finished rendering all 3 core diagrams!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
