// Sinh doc/PTTK_OOP_HR_DIAGRAMS.md từ dữ liệu 46 UC; mọi biểu đồ linetype ortho.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { G, ALL, SEQ, ACT, CRUD_ACT, READ_ACT, STATES, FLOWS, CLS } from './diagrams-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const OUT = join(root, 'doc', 'PTTK_OOP_HR_DIAGRAMS.md');
const MAIN = join(root, 'doc', 'PTTK_OOP_HR.md');

const HEAD = '@startuml\nskinparam linetype ortho\nskinparam shadowing false\n';
const wrap = (body) => `\`\`\`plantuml\n${HEAD}${body}\n@enduml\n\`\`\``;

let out = [];
let fig = 0;
const figNo = () => `Hình D.${++fig}`;

out.push(`# BỘ BIỂU ĐỒ UML ĐẦY ĐỦ 46 USE CASE - HRMIS SAIGON TECHNOLOGY

> Tài liệu kèm theo \`doc/PTTK_OOP_HR.md\`, sinh thống nhất cho **46 use case chia 12 nhóm**.
> **Mọi biểu đồ đều khai báo \`skinparam linetype ortho\` nên các đường nối được kẻ THẲNG VUÔNG GÓC.**
> Cách dùng: sao chép từng khối \`\`\`plantuml\`\`\` dán vào plantuml.com (hoặc plugin IDE) để xuất ảnh PNG/SVG chèn vào báo cáo.

**Cấu trúc:** A. Use case (tổng quát + 12 nhóm) | B. Trình tự (46 UC) | C. Hoạt động (46 UC) | D. Trạng thái (theo đối tượng) | E. Luồng dữ liệu đầu-cuối | F. Gói (tổng quan + theo nhóm) | G. Lớp (theo nhóm, gán rõ use case)

`);

/* ===== A. USE CASE ===== */
out.push(`## A. BIỂU ĐỒ USE CASE\n`);
out.push(`### A.0. Tổng quan hệ thống (46 use case, 12 nhóm)\n`);
{
    const actors = ['Nhân viên', 'Trưởng dự án', 'Chuyên viên nhân sự', 'Nhân viên hành chính', 'Kế toán', 'Nhân viên IT', 'Giám đốc'];
    const map = {}; actors.forEach((a, i) => { map[a] = `A${i}`; });
    let b = 'left to right direction\n';
    actors.forEach((a, i) => { b += `actor "${a}" as A${i}\n`; });
    b += 'rectangle "HRMIS - 46 use case / 12 nhóm" {\n';
    for (const u of ALL) b += `  (${u.id} ${u.n}) as ${u.id}\n`;
    for (const u of ALL) {
        const main = u.a.split(',')[0].trim();
        b += `  ${map[main] || 'A0'} -- ${u.id}\n`;
    }
    b += '}\n';
    out.push(wrap(b) + `\n_${figNo()}. Biểu đồ Use case tổng quan 46 use case._\n`);
}
for (const g of G) {
    out.push(`### A.${g.id}. Nhóm ${g.id} - ${g.name}\n`);
    const acts = [...new Set(g.ucs.flatMap(u => u.a.split(',').map(s => s.trim())))];
    let b = 'left to right direction\n';
    acts.forEach((a, i) => { b += `actor "${a}" as A${i}\n`; });
    b += `rectangle "Nhóm ${g.id}: ${g.name}" {\n`;
    g.ucs.forEach(u => { b += `  (${u.id} ${u.n}) as ${u.id}\n`; });
    b += '}\n';
    g.ucs.forEach(u => {
        const i = acts.indexOf(u.a.split(',')[0].trim());
        if (i > -1) b += `A${i} -- ${u.id}\n`;
    });
    out.push(wrap(b) + `\n_${figNo()}. Nhóm ${g.id} - ${g.name} (${g.ucs.map(u => u.id).join(', ')})._\n`);
}

/* ===== B. TRÌNH TỰ ===== */
out.push(`\n## B. BIỂU ĐỒ TRÌNH TỰ THEO TỪNG USE CASE\n`);
for (const u of ALL) {
    const body = SEQ[u.id] ?? (() => {
        const L = [
            `actor "${u.a.split(',')[0]}" as A`,
            `boundary "Trang ${u.pg}" as B`,
            `control "${u.ct}" as C`,
            `entity "${u.en}" as E`];
        if (u.pat === 'crud') L.push('A -> B : mở trang quản lý', 'B -> C : truy vấn danh sách', 'C -> E : SELECT phân trang', 'alt Thêm / Sửa / Xóa', 'A -> B : nhập dữ liệu', 'B -> C : validate DTO + lưu', 'C -> E : ghi + AuditLog', 'end', 'B --> A : làm mới danh sách');
        else if (u.pat === 'a:approvalShort') L.push('A -> B : nhập đề xuất', 'B -> C : submit()', 'C -> E : lưu PENDING + thông báo duyệt', 'alt duyệt', 'C -> E : APPROVED + phát sinh hiệu lực', 'else từ chối', 'C -> E : REJECTED kèm lý do', 'end', 'C -> E : ghi AuditLog');
        else L.push('A -> B : thao tác', 'B -> C : gọi service', 'C -> E : đọc/ghi dữ liệu', 'C -> E : ghi AuditLog', 'B --> A : kết quả');
        return L.join('\n');
    })();
    out.push(`### B.${u.id}. ${u.n}\n`);
    out.push(wrap(body) + `\n_${figNo()}. Trình tự ${u.id} - ${u.n}._\n`);
}

/* ===== C. HOẠT ĐỘNG ===== */
out.push(`\n## C. BIỂU ĐỒ HOẠT ĐỘNG THEO TỪNG USE CASE\n`);
for (const u of ALL) {
    const steps = ACT[u.id] || (u.pat === 'crud' ? CRUD_ACT : READ_ACT);
    const body = ['start', ...steps.filter(s => s !== 'start' && s !== 'stop'), 'stop'].join('\n');
    out.push(`### C.${u.id}. ${u.n}\n`);
    out.push(wrap(body) + `\n_${figNo()}. Hoạt động ${u.id} - ${u.n}._\n`);
}

/* ===== D. TRẠNG THÁI ===== */
out.push(`\n## D. BIỂU ĐỒ TRẠNG THÁI THEO ĐỐI TƯỢNG\n`);
STATES.forEach(([title, body], i) => {
    out.push(`### D.${i + 1}. ${title}\n`);
    out.push(wrap(body) + `\n_${figNo()}. Trạng thái - ${title}._\n`);
});

/* ===== E. LUỒNG ===== */
out.push(`\n## E. LUỒNG DỮ LIỆU ĐẦU-CUỐI LIÊN PHÂN HỆ\n`);
FLOWS.forEach(([name, code], i) => {
    out.push(`### E.${i + 1}. ${name}\n`);
    out.push('```plantuml\n' + code + '\n```\n');
    out.push(`_${figNo()}. ${name}._\n`);
});

/* ===== F. GÓI ===== */
out.push(`\n## F. BIỂU ĐỒ GÓI (PACKAGE)\n`);
out.push(`### F.0. Gói tổng quan hệ thống\n`);
{
    let b = '';
    G.forEach(g => { b += `package "Nhóm ${g.id}: ${g.name}" as P${g.id} {\n}\n`; });
    b += `package "Nền tảng dùng chung" as PLAT {\n  [AuthModule]\n  [NotificationsService]\n  [AuditService]\n  [SettingsService]\n  [PrismaService]\n}\n`;
    b += `PLAT ..> P${G[0].id}\nPLAT ..> P${G[3].id}\nPLAT ..> P${G[5].id}\n`;
    out.push(wrap(b) + `\n_${figNo()}. Gói tổng quan: 12 nhóm nghiệp vụ trên nền tảng dùng chung._\n`);
}
for (const g of G) {
    out.push(`### F.${g.id}. Gói nhóm ${g.id} - ${g.name} (mỗi use case một gói con)\n`);
    let b = `package "Nhóm ${g.id}: ${g.name}" {\n`;
    for (const u of g.ucs) {
        b += `  package "${u.id} - ${u.n}" {\n    [Boundary: ${u.pg}]\n    [Control: ${u.ct}]\n    [Entity: ${u.en}]\n  }\n`;
    }
    b += '}\n';
    out.push(wrap(b) + `\n_${figNo()}. Gói nhóm ${g.id}, mỗi use case một gói con Boundary-Control-Entity._\n`);
}

/* ===== G. LỚP ===== */
out.push(`\n## G. BIỂU ĐỒ LỚP THEO NHÓM (GÁN RÕ USE CASE)\n`);
for (const g of G) {
    const m = CLS[g.id];
    out.push(`### G.${g.id}. Lớp nhóm ${g.id} - ${g.name}\n`);
    let b = '';
    b += 'package "Boundary (Next.js)" {\n';
    m.b.forEach((x, i) => { b += `  class "<<Boundary>> ${x.split(' (')[0]}" as B${i}\n`; });
    b += '}\npackage "Control (NestJS Service)" {\n';
    m.c.forEach((x, i) => { b += `  class "<<Control>> ${x.split(' (')[0]}" as C${i}\n`; });
    b += '}\npackage "Entity (Prisma Model)" {\n';
    m.e.forEach((x, i) => { b += `  class "<<Entity>> ${x.split(' (')[0]}" as E${i}\n`; });
    b += '}\n';
    m.b.forEach((_, i) => { b += `B${i} ..> C0\n`; });
    m.c.forEach((_, i) => { b += `C${i} ..> E0\n`; });
    b += 'note bottom of C0\n';
    b += `  Phục vụ use case: ${g.ucs.map(u => `${u.id}=${u.n}`).join('; ')}\n`;
    b += 'end note\n';
    out.push(wrap(b) + `\n_${figNo()}. Lớp nhóm ${g.id} - gán use case: ${g.ucs.map(u => `${u.id}=${u.n}`).join('; ')}._\n`);
}

const total = (out.join('').match(/@startuml/g) || []).length;
out.unshift(`> Tổng cộng **${total} biểu đồ PlantUML**.\n\n`);
writeFileSync(OUT, out.join('\n'), 'utf8');
console.log(`WROTE ${OUT} - ${total} diagrams`);

/* ===== VÁ BÁO CÁO CHÍNH ===== */
let m = readFileSync(MAIN, 'utf8');
const startMark = '**Biểu đồ Use case tổng quát các nhóm bổ sung (nhóm G đến nhóm L)**';
const endMark = '_Hình 2.28. Luồng quét và phê duyệt nâng bậc lương (UC40)._';
const s = m.indexOf(startMark), e = m.indexOf(endMark);
if (s > -1 && e > -1) {
    const pointer = `Toàn bộ mã PlantUML của hệ thống biểu đồ cho 46 use case (use case tổng quát và theo từng nhóm, trình tự, hoạt động, trạng thái, luồng dữ liệu liên phân hệ, gói tổng quan và gói theo từng use case, lớp theo nhóm gán rõ use case) được sinh thống nhất trong tài liệu kèm theo [\`doc/PTTK_OOP_HR_DIAGRAMS.md\`](PTTK_OOP_HR_DIAGRAMS.md); mọi biểu đồ đều khai báo \`skinparam linetype ortho\` để các đường nối kẻ thẳng vuông góc.`;
    m = m.slice(0, s) + pointer + m.slice(e + endMark.length);
    ['Hình 2.25. Biểu đồ Use case tổng quát các nhóm bổ sung (mã PlantUML)',
        'Hình 2.26. Luồng giải trình bổ sung giờ công - UC29 (mã PlantUML)',
        'Hình 2.27. Luồng khoản vay và tạm ứng phúc lợi - UC32 (mã PlantUML)',
        'Hình 2.28. Luồng quét và phê duyệt nâng bậc lương - UC40 (mã PlantUML)'
    ].forEach(l => { m = m.replace('- ' + l + '\n', ''); });
    m = m.replace('(2) các hình 2.1-2.24 kèm mã Mermaid, các hình 2.25-2.28 kèm mã PlantUML (skinparam linetype ortho để nét kẻ thẳng vuông góc) - dán vào mermaid.live hoặc plantuml.com để xuất ảnh chất lượng cao chèn vào báo cáo',
        '(2) mã Mermaid của các hình trong báo cáo nằm trực tiếp dưới từng hình; toàn bộ mã PlantUML của bộ biểu đồ 46 use case nằm tại [`doc/PTTK_OOP_HR_DIAGRAMS.md`](PTTK_OOP_HR_DIAGRAMS.md) với `linetype ortho` (nét kẻ thẳng vuông góc) - dán vào mermaid.live hoặc plantuml.com để xuất ảnh chất lượng cao chèn vào báo cáo');
    writeFileSync(MAIN, m, 'utf8');
    console.log('MAIN report patched');
} else console.log('MAIN report: ad-hoc block not found (skip)');
