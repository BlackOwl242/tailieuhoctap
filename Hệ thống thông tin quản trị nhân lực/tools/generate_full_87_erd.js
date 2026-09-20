const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const { buildRealEntity } = require('./entity_builder');

const col1Domains = [
  { id: 'D1', name: '1. ĐỊNH DANH, TÀI KHOẢN & CƠ CẤU TỔ CHỨC (5 BẢNG)', models: ['OrgUnit', 'User', 'Role', 'RefreshToken', 'UserRole'] },
  { id: 'D2', name: '2. TUYỂN DỤNG & THU HÚT NHÂN TÀI ATS (6 BẢNG)', models: ['JobRequisition', 'Candidate', 'HrmsJobOpening', 'HrmsJobApplicant', 'HrmsInterviewRound', 'HrmsJobOffer'] },
  { id: 'D3', name: '3. HỒ SƠ, HỢP ĐỒNG & HỘI NHẬP NHÂN SỰ (11 BẢNG)', models: ['Contract', 'Certificate', 'HrDocument', 'OnboardingPath', 'OnboardingPathItem', 'OnboardingAssignment', 'OnboardingItemProgress', 'HrmsOnboardingTask', 'HrmsLifecycleEvent', 'HandoverChecklist', 'HandoverItem'] },
  { id: 'D4', name: '4. BIẾN ĐỘNG NHÂN SỰ & QUẢN LÝ THAY ĐỔI (2 BẢNG)', models: ['ProfileChangeRequest', 'PersonnelAction'] },
  { id: 'D5', name: '5. CHẤM CÔNG, PHÂN CA & ĐIỂM DANH ĐA NGUỒN (8 BẢNG)', models: ['AttendanceDevice', 'AttendanceEvent', 'FaceEmbedding', 'AttendanceCorrection', 'AttendanceDay', 'HrmsAttendanceRegularization', 'HrmsShiftType', 'HrmsShiftAssignment'] },
  { id: 'D6', name: '6. QUẢN LÝ NGHỈ PHÉP & LÀM THÊM GIỜ (3 BẢNG)', models: ['LeaveBalance', 'LeaveRequest', 'OvertimeRequest'] },
  { id: 'D7', name: '7. TIỀN LƯƠNG & CẤU TRÚC ĐÃI NGỘ ĐỘNG (8 BẢNG)', models: ['HrmsSalaryComponent', 'HrmsSalaryStructureItem', 'HrmsSalaryStructure', 'HrmsSalaryStructureAssignment', 'PayrollPeriod', 'Payslip', 'HrmsPayrollRun', 'HrmsPayrollSlip'] }
];

const col2Domains = [
  { id: 'D8', name: '8. TÀI CHÍNH NHÂN SỰ, PHÚC LỢI & TÀI SẢN (5 BẢNG)', models: ['HrmsTravelRequest', 'HrmsEmployeeAdvance', 'HrmsExpenseClaim', 'HrmsEmployeeLoan', 'HrmsAssetAllocation'] },
  { id: 'D9', name: '9. HIỆU SUẤT & ĐÀO TẠO PHÁT TRIỂN (9 BẢNG)', models: ['HrmsAppraisalCycle', 'HrmsAppraisalGoal', 'PerformanceReview', 'HrmsAppraisalReview', 'TrainingCourse', 'TrainingEnrollment', 'HrmsTrainingProgram', 'HrmsTrainingFeedback', 'HrmsGrievance'] },
  { id: 'D10A', name: '10A. HỒ SƠ CÁN BỘ MẪU 2C-BNV (10 BẢNG)', models: ['PersonnelRank', 'PersonnelComprehensiveProfile', 'PersonnelSalaryHistory', 'PersonnelAppointment', 'PersonnelEducation', 'PersonnelWorkHistory', 'PersonnelRewardDiscipline', 'PersonnelFamilyRelation', 'PersonnelAppraisal', 'PersonnelSocialActivity'] },
  { id: 'D10B', name: '10B. CỔNG TRI THỨC SỐ & TƯƠNG TÁC (14 BẢNG)', models: ['Space', 'SpaceMember', 'SpaceFollow', 'Category', 'Article', 'Tag', 'ArticleTag', 'ArticleVersion', 'Attachment', 'ArticleReview', 'Comment', 'Reaction', 'ArticleView', 'Bookmark'] },
  { id: 'D10C', name: '10C. DANH MỤC DÙNG CHUNG & HỆ THỐNG (6 BẢNG)', models: ['MasterCatalogGroup', 'MasterCatalog', 'MasterCatalogItem', 'Setting', 'Notification', 'AuditLog'] }
];

const commonSkinparam = `
hide circle
skinparam linetype ortho
skinparam shadowing false
skinparam roundCorner 0
skinparam defaultFontName "Arial"
skinparam defaultFontSize 9
skinparam ranksep 14
skinparam nodesep 12
skinparam packagePadding 6

skinparam package {
  BackgroundColor #F8FAFC
  BorderColor #334155
  BorderThickness 1.2
  FontColor #0F172A
  FontStyle bold
  FontSize 10
}

skinparam entity {
  BackgroundColor #FFFFFF
  BorderColor #475569
  BorderThickness 1.0
  HeaderBackgroundColor #E2E8F0
  FontColor #0F172A
  FontSize 8.5
}

skinparam arrow {
  Color #1E3A8A
  Thickness 1.1
}
`;

function generateCol1Puml() {
  let puml = `@startuml\n` + commonSkinparam;

  col1Domains.forEach(dom => {
    puml += `\npackage "${dom.name}" as ${dom.id} {\n`;
    dom.models.forEach(m => { puml += buildRealEntity(m); });
    puml += `}\n`;
  });

  puml += `
' ========================================================
' LIÊN KẾT XUYÊN GÓI (CROSS-PACKAGE PIPELINE) - CỘT 1
' ========================================================
' D1 -> D2: Phiên đăng nhập người dùng quản lý Yêu cầu tuyển dụng
RefreshToken ||--down--o{ JobRequisition

' D2 -> D3: Ứng viên trúng tuyển tiếp nhận ký Hợp đồng lao động
HrmsJobApplicant ||--down--o{ Contract

' D3 -> D4: Bàn giao thôi việc kích hoạt Đề xuất thay đổi hồ sơ nhân sự
HandoverChecklist ||--down--o{ ProfileChangeRequest

' D4 -> D5: Đề xuất sửa hồ sơ phân quyền Thiết bị điểm danh
ProfileChangeRequest ||--down--o{ AttendanceDevice

' D5 -> D6: Phân ca làm việc quy định Quỹ nghỉ phép năm
HrmsShiftType ||--down--o{ LeaveBalance

' D6 -> D7: Quỹ phép năm kết chuyển cấu trúc Lương & Đãi ngộ
LeaveBalance ||--down--o{ HrmsSalaryComponent

' ========================================================
' QUAN HỆ KHÓA CHÍNH - NGOẠI NỘI BỘ TỪNG GÓI - CỘT 1
' ========================================================

' --- Miền 1: Định danh, Tài khoản & Cơ cấu tổ chức ---
OrgUnit ||--right--o{ OrgUnit
OrgUnit ||--right--o{ User
User ||--right--o{ Role
User ||--down--o{ RefreshToken
User ||--down--o{ UserRole
Role ||--down--o{ UserRole
RefreshToken -[hidden]right-> UserRole

' --- Miền 2: Tuyển dụng & Thu hút nhân tài ATS ---
JobRequisition ||--right--o{ Candidate
Candidate ||--right--o{ HrmsJobOpening
JobRequisition ||--down--o{ HrmsJobApplicant
Candidate ||--down--o{ HrmsInterviewRound
HrmsJobApplicant ||--right--o{ HrmsInterviewRound
HrmsInterviewRound ||--right--o{ HrmsJobOffer

' --- Miền 3: Hồ sơ, Hợp đồng & Hội nhập nhân sự ---
Contract ||--right--o{ Certificate
Certificate ||--right--o{ HrDocument
Contract ||--down--o{ OnboardingPath
OnboardingPath ||--right--o{ OnboardingPathItem
OnboardingPathItem ||--right--o{ OnboardingAssignment
OnboardingPath ||--down--o{ OnboardingItemProgress
OnboardingItemProgress ||--right--o{ HrmsOnboardingTask
HrmsOnboardingTask ||--right--o{ HrmsLifecycleEvent
OnboardingItemProgress ||--down--o{ HandoverChecklist
HandoverChecklist ||--right--o{ HandoverItem

' --- Miền 4: Biến động nhân sự & Quản lý thay đổi ---
ProfileChangeRequest ||--right--o{ PersonnelAction

' --- Miền 5: Chấm công, Phân ca & Điểm danh đa nguồn ---
AttendanceDevice ||--right--o{ AttendanceEvent
AttendanceEvent ||--right--o{ FaceEmbedding
AttendanceEvent ||--down--o{ AttendanceDay
AttendanceCorrection ||--right--o{ AttendanceDay
AttendanceDay ||--right--o{ HrmsAttendanceRegularization
AttendanceCorrection ||--down--o{ HrmsShiftType
HrmsShiftType ||--right--o{ HrmsShiftAssignment
AttendanceDay ||--down--o{ HrmsShiftAssignment

' --- Miền 6: Quản lý nghỉ phép & Làm thêm giờ ---
LeaveBalance ||--right--o{ LeaveRequest
LeaveRequest ||--right--o{ OvertimeRequest

' --- Miền 7: Tiền lương & Cấu trúc đãi ngộ động ---
HrmsSalaryComponent ||--right--o{ HrmsSalaryStructureItem
HrmsSalaryStructure ||--left--o{ HrmsSalaryStructureItem
HrmsSalaryComponent ||--down--o{ HrmsSalaryStructureAssignment
HrmsSalaryStructureAssignment ||--right--o{ PayrollPeriod
PayrollPeriod ||--right--o{ Payslip
HrmsSalaryStructureAssignment ||--down--o{ HrmsPayrollRun
PayrollPeriod ||--down--o{ HrmsPayrollSlip
HrmsPayrollRun ||--right--o{ HrmsPayrollSlip
@enduml`;
  return puml;
}

function generateCol2Puml() {
  let puml = `@startuml\n` + commonSkinparam;

  col2Domains.forEach(dom => {
    puml += `\npackage "${dom.name}" as ${dom.id} {\n`;
    dom.models.forEach(m => { puml += buildRealEntity(m); });
    puml += `}\n`;
  });

  puml += `
' ========================================================
' LIÊN KẾT XUYÊN GÓI (CROSS-PACKAGE PIPELINE) - CỘT 2
' ========================================================
' D8 -> D9: Quản lý công tác & hỗ trợ tài chính liên kết chu kỳ đánh giá hiệu suất
HrmsEmployeeLoan ||--down--o{ HrmsAppraisalCycle

' D9 -> D10A: Chương trình đào tạo & đánh giá cập nhật ngạch bậc hồ sơ cán bộ 2C
HrmsTrainingProgram ||--down--o{ PersonnelRank

' D10A -> D10B: Cán bộ phân quyền tham gia Không gian tri thức SOP
PersonnelSocialActivity ||--down--o{ Space

' D10B -> D10C: Bài viết tri thức phân loại theo Danh mục chuẩn dùng chung
ArticleView ||--down--o{ MasterCatalogGroup

' ========================================================
' QUAN HỆ KHÓA CHÍNH - NGOẠI NỘI BỘ TỪNG GÓI - CỘT 2
' ========================================================

' --- Miền 8: Tài chính nhân sự, Phúc lợi & Tài sản ---
HrmsTravelRequest ||--right--o{ HrmsEmployeeAdvance
HrmsEmployeeAdvance ||--right--o{ HrmsExpenseClaim
HrmsTravelRequest ||--down--o{ HrmsEmployeeLoan
HrmsEmployeeLoan ||--right--o{ HrmsAssetAllocation
HrmsExpenseClaim ||--down--o{ HrmsAssetAllocation

' --- Miền 9: Hiệu suất & Đào tạo phát triển ---
HrmsAppraisalCycle ||--right--o{ HrmsAppraisalGoal
HrmsAppraisalGoal ||--right--o{ PerformanceReview
HrmsAppraisalCycle ||--down--o{ HrmsAppraisalReview
HrmsAppraisalReview ||--right--o{ TrainingCourse
TrainingCourse ||--right--o{ TrainingEnrollment
HrmsAppraisalReview ||--down--o{ HrmsTrainingProgram
HrmsTrainingProgram ||--right--o{ HrmsTrainingFeedback
HrmsTrainingFeedback ||--right--o{ HrmsGrievance

' --- Miền 10A: Hồ sơ cán bộ mẫu 2C-BNV ---
PersonnelRank ||--right--o{ PersonnelComprehensiveProfile
PersonnelComprehensiveProfile ||--right--o{ PersonnelSalaryHistory
PersonnelComprehensiveProfile ||--down--o{ PersonnelAppointment
PersonnelAppointment ||--right--o{ PersonnelEducation
PersonnelEducation ||--right--o{ PersonnelWorkHistory
PersonnelAppointment ||--down--o{ PersonnelRewardDiscipline
PersonnelRewardDiscipline ||--right--o{ PersonnelFamilyRelation
PersonnelFamilyRelation ||--right--o{ PersonnelAppraisal
PersonnelRewardDiscipline ||--down--o{ PersonnelSocialActivity

' --- Miền 10B: Cổng tri thức số & Tương tác ---
Space ||--right--o{ SpaceMember
SpaceMember ||--right--o{ SpaceFollow
Space ||--down--o{ Category
Category ||--right--o{ Article
Article ||--right--o{ Tag
Article ||--down--o{ ArticleTag
ArticleTag ||--right--o{ ArticleVersion
ArticleVersion ||--right--o{ Attachment
ArticleTag ||--down--o{ ArticleReview
ArticleReview ||--right--o{ Comment
Comment ||--right--o{ Reaction
ArticleReview ||--down--o{ ArticleView
ArticleView ||--right--o{ Bookmark

' --- Miền 10C: Danh mục dùng chung & Hệ thống ---
MasterCatalogGroup ||--right--o{ MasterCatalog
MasterCatalog ||--right--o{ MasterCatalogItem
MasterCatalogGroup ||--down--o{ Setting
Setting ||--right--o{ Notification
Notification ||--right--o{ AuditLog
@enduml`;
  return puml;
}

async function render(puml, out) {
  console.log(`Rendering ${puml.length} chars to ${out}...`);
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'kroki.io',
      path: '/plantuml/png',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(puml, 'utf8')
      }
    }, r => {
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (r.statusCode !== 200) {
          rej(new Error(`HTTP ${r.statusCode}: ${buf.toString()}`));
          return;
        }
        fs.writeFileSync(out, buf);
        const w = buf.readUInt32BE(16);
        const h = buf.readUInt32BE(20);
        console.log(`Saved ${out}: ${w} x ${h} (${buf.length} bytes)`);
        res({ w, h });
      });
    });
    req.on('error', rej);
    req.write(puml, 'utf8');
    req.end();
  });
}

(async () => {
  console.log('Generating Column 1 (Domains 1-7: 43 tables)...');
  const puml1 = generateCol1Puml();
  fs.writeFileSync('tools/col1.puml', puml1);
  await render(puml1, 'tools/col1.png');

  console.log('Generating Column 2 (Domains 8-10C: 44 tables)...');
  const puml2 = generateCol2Puml();
  fs.writeFileSync('tools/col2.puml', puml2);
  await render(puml2, 'tools/col2.png');

  console.log('Stitching columns into final portrait ERD...');
  execSync('powershell -ExecutionPolicy Bypass -File tools/stitch_erd.ps1', { stdio: 'inherit' });

  console.log('Done generating full 87 tables ERD!');
})();
