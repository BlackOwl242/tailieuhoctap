const fs = require('fs');

const data = JSON.parse(fs.readFileSync('tools/clean_schema_parsed.json', 'utf8'));

const modelLabels = {
  User: "Nhân viên / Tài khoản",
  Role: "Vai trò & Quyền hạn",
  UserRole: "Gán vai trò người dùng",
  OrgUnit: "Đơn vị & Phòng ban",
  RefreshToken: "Phiên đăng nhập JWT",

  JobRequisition: "Yêu cầu tuyển dụng",
  Candidate: "Hồ sơ ứng viên",
  HrmsJobOpening: "Bản tin tuyển dụng",
  HrmsJobApplicant: "Đơn ứng tuyển",
  HrmsInterviewRound: "Vòng phỏng vấn",
  HrmsJobOffer: "Thư mời nhận việc",

  Contract: "Hợp đồng lao động",
  Certificate: "Văn bằng chứng chỉ",
  HrDocument: "Tài liệu nhân sự",
  OnboardingPath: "Lộ trình hội nhập",
  OnboardingPathItem: "Mục lộ trình",
  OnboardingAssignment: "Giao việc hội nhập",
  OnboardingItemProgress: "Tiến độ hội nhập",
  HandoverChecklist: "Bàn giao thôi việc",
  HandoverItem: "Mục bàn giao",
  HrmsLifecycleEvent: "Sự kiện vòng đời",
  HrmsOnboardingTask: "Tác vụ hội nhập",

  PersonnelAction: "Quyết định biến động",
  ProfileChangeRequest: "Đề xuất sửa hồ sơ",

  AttendanceDevice: "Thiết bị điểm danh",
  FaceEmbedding: "Vector khuôn mặt",
  AttendanceEvent: "Sự kiện điểm danh",
  AttendanceDay: "Tổng hợp công ngày",
  AttendanceCorrection: "Giải trình công",
  HrmsShiftType: "Loại ca làm việc",
  HrmsShiftAssignment: "Phân ca làm việc",
  HrmsAttendanceRegularization: "Điều chỉnh điểm danh",

  LeaveRequest: "Đơn xin nghỉ phép",
  LeaveBalance: "Quỹ phép năm",
  OvertimeRequest: "Đơn làm thêm giờ",

  PayrollPeriod: "Kỳ tính lương",
  Payslip: "Phiếu lương cá nhân",
  HrmsSalaryComponent: "Thành phần thu nhập",
  HrmsSalaryStructure: "Cấu trúc lương",
  HrmsSalaryStructureItem: "Hạng mục cấu trúc",
  HrmsSalaryStructureAssignment: "Gán cấu trúc lương",
  HrmsPayrollRun: "Đợt chạy lương",
  HrmsPayrollSlip: "Bảng lương HRMS",

  HrmsEmployeeLoan: "Khoản vay phúc lợi",
  HrmsEmployeeAdvance: "Tạm ứng lương",
  HrmsExpenseClaim: "Thanh toán công tác",
  HrmsAssetAllocation: "Cấp phát tài sản",
  HrmsTravelRequest: "Lệnh công tác",

  PerformanceReview: "Đánh giá hiệu suất",
  HrmsAppraisalCycle: "Chu kỳ đánh giá",
  HrmsAppraisalGoal: "Mục tiêu OKR/KPI",
  HrmsAppraisalReview: "Phiếu đánh giá",
  TrainingCourse: "Khóa đào tạo",
  TrainingEnrollment: "Ghi danh khóa học",
  HrmsTrainingProgram: "Chương trình đào tạo",
  HrmsTrainingFeedback: "Phản hồi đào tạo",
  HrmsGrievance: "Khiếu nại lao động",

  PersonnelComprehensiveProfile: "Hồ sơ cán bộ 2C-BNV",
  PersonnelRank: "Ngạch công chức",
  PersonnelSalaryHistory: "Lịch sử ngạch bậc",
  PersonnelAppointment: "Bổ nhiệm chức vụ",
  PersonnelEducation: "Đào tạo bồi dưỡng",
  PersonnelWorkHistory: "Quá trình công tác",
  PersonnelRewardDiscipline: "Khen thưởng kỷ luật",
  PersonnelFamilyRelation: "Quan hệ gia đình",
  PersonnelAppraisal: "Đánh giá cán bộ",
  PersonnelSocialActivity: "Hoạt động xã hội",

  Space: "Không gian tri thức",
  SpaceMember: "Thành viên không gian",
  SpaceFollow: "Theo dõi không gian",
  Category: "Chuyên mục bài viết",
  Tag: "Thẻ bài viết",
  ArticleTag: "Gán thẻ bài viết",
  Article: "Bài viết tri thức SOP",
  ArticleVersion: "Phiên bản bài viết",
  Attachment: "Tệp đính kèm",
  ArticleReview: "Xét duyệt xuất bản",
  Comment: "Bình luận thảo luận",
  Reaction: "Tương tác cảm xúc",
  ArticleView: "Lượt xem bài viết",
  Bookmark: "Đánh dấu lưu trữ",

  MasterCatalogGroup: "Nhóm danh mục chuẩn",
  MasterCatalog: "Danh mục dùng chung",
  MasterCatalogItem: "Mục danh mục chi tiết",
  Notification: "Thông báo hệ thống",
  AuditLog: "Nhật ký kiểm toán",
  Setting: "Tham số cấu hình"
};

function toSqlType(fName, fType) {
  if (fName === 'id' || fName.endsWith('Id')) return 'varchar(36)';
  if (fName === 'code' || fName.endsWith('Code')) return 'varchar(50)';
  if (fName.includes('password') || fName.includes('token') || fName.includes('hash')) return 'varchar(255)';
  if (fName === 'email') return 'varchar(150)';
  if (fName === 'phone') return 'varchar(20)';
  if (fName === 'status' || fType.endsWith('Status') || fType.endsWith('Type') || fType.endsWith('Role') || fType.endsWith('Stage')) return 'varchar(30)';
  if (fName.includes('Salary') || fName.includes('Amount') || fName.includes('Allowance') || fName.includes('bonus') || fName.includes('tax') || fName.includes('Pay') || fName.includes('Budget') || fName.includes('cost') || fName.includes('price')) return 'decimal(15,2)';
  if (fName.includes('coefficient') || fName === 'days' || fName === 'otHours' || fName === 'workingDays') return 'decimal(4,2)';
  if (fType === 'DateTime') return 'timestamp';
  if (fType === 'Int') return 'integer';
  if (fType === 'BigInt') return 'bigint';
  if (fType === 'Float' || fType === 'Decimal') return 'decimal(12,2)';
  if (fType === 'Boolean') return 'boolean';
  if (fType === 'Json') return 'jsonb';
  if (fName.includes('note') || fName.includes('description') || fName.includes('content') || fName.includes('payload') || fName.includes('reason') || fName.includes('resolution') || fName.includes('details') || fName.includes('historyNotes')) return 'text';
  return 'varchar(100)';
}

function toSnake(str) {
  return str.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase());
}

// Build entity with accurate PostgreSQL columns
function buildRealEntity(mName) {
  const info = data.models[mName];
  if (!info) {
    return `  entity "${toSnake(mName)}" as ${mName} {\n    * **id** : varchar(36) [PK]\n  }\n`;
  }
  const label = modelLabels[mName] || mName;
  const tName = info.tableName;

  const pkFields = info.scalars.filter(s => s.isPk);
  const fkFields = info.scalars.filter(s => !s.isPk && s.isFk);
  const businessFields = info.scalars.filter(s => !s.isPk && !s.isFk && !['createdAt', 'updatedAt', 'deletedAt'].includes(s.fName));

  // If no explicit PK, default to id
  const pks = pkFields.length > 0 ? pkFields : [{ fName: 'id', fType: 'String', isPk: true }];

  // Pick up to 2 key FKs and 2 key business attributes
  const pickedFks = fkFields.slice(0, 2);
  const pickedBiz = businessFields.slice(0, 2);

  let str = `  entity "${tName}\\n(${label})" as ${mName} {\n`;
  pks.forEach(pk => {
    str += `    * **${toSnake(pk.fName)}** : ${toSqlType(pk.fName, pk.fType)} [PK]\n`;
  });
  str += `    --\n`;
  pickedFks.forEach(fk => {
    str += `    ${toSnake(fk.fName)} : ${toSqlType(fk.fName, fk.fType)} [FK]\n`;
  });
  pickedBiz.forEach(biz => {
    const uq = biz.isUq ? ' [UQ]' : '';
    str += `    ${toSnake(biz.fName)} : ${toSqlType(biz.fName, biz.fType)}${uq}\n`;
  });
  str += `  }\n`;
  return str;
}

module.exports = {
  buildRealEntity,
  modelLabels,
  toSnake,
  toSqlType
};
