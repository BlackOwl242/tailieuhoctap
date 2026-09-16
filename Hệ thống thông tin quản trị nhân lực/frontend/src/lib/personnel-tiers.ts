/**
 * Chuẩn Phân Cấp Mức Độ Dữ Liệu Hồ Sơ Nhân Sự (Personnel Data Governance & Sensitivity Tiers)
 *
 * Mức 1: Tự phục vụ (Self-Service) — Cán bộ/nhân viên tự do chỉnh sửa trực tiếp.
 * Mức 2: Định danh & Pháp lý nhân thân (Org-Verified) — Khóa sửa đè; Phải gửi đề xuất kèm minh chứng để HR/Ban Tổ chức duyệt.
 * Mức 3: Tổ chức - Chế độ - Chính trị - Tiền lương (Org-Controlled) — Tuyệt đối chỉ xem (Read-only); Quyết định do Tổ chức/Lãnh đạo ban hành.
 */

export type PersonnelDataTier = 1 | 2 | 3;

export interface FieldDefinition {
  key: string;
  label: string;
  tier: PersonnelDataTier;
  category: 'contact' | 'identity' | 'education' | 'health' | 'organization' | 'salary' | 'political';
  type: 'text' | 'date' | 'select' | 'number' | 'textarea';
  options?: string[];
  placeholder?: string;
  helperText?: string;
}

export const TIER_CONFIG = {
  1: {
    tier: 1 as const,
    code: 'TIER_1_SELF_SERVICE',
    name: 'Mức 1: Tự phục vụ (Self-Service)',
    shortName: 'Mức 1 (Tự sửa)',
    description: 'Thông tin liên hệ, diện mạo & cá nhân linh hoạt. Cán bộ/nhân viên có quyền tự do cập nhật trực tiếp bất kỳ lúc nào.',
    badgeColor: 'bg-muted text-foreground border-border',
    dotColor: 'bg-foreground/60',
    iconName: 'UserCheck',
    canDirectEdit: true,
    requiresApproval: false,
    isOrgOnly: false,
  },
  2: {
    tier: 2 as const,
    code: 'TIER_2_ORG_VERIFIED',
    name: 'Mức 2: Định danh & Pháp lý (Org-Verified)',
    shortName: 'Mức 2 (Cần duyệt)',
    description: 'Thông tin định danh nhân thân & bằng cấp pháp lý. Khóa sửa đè; cán bộ/nhân viên gửi Đề xuất điều chỉnh kèm tài liệu minh chứng để Phòng Nhân sự thẩm định và phê duyệt.',
    badgeColor: 'bg-muted text-foreground border-border',
    dotColor: 'bg-foreground/60',
    iconName: 'ShieldAlert',
    canDirectEdit: false,
    requiresApproval: true,
    isOrgOnly: false,
  },
  3: {
    tier: 3 as const,
    code: 'TIER_3_ORG_CONTROLLED',
    name: 'Mức 3: Tổ chức & Chế độ (Org-Controlled)',
    shortName: 'Mức 3 (Tổ chức quản lý)',
    description: 'Dữ liệu tổ chức quản trị định biên, chức vụ, ngạch bậc, tiền lương và hồ sơ chính trị. Cán bộ/nhân viên chỉ có quyền xem (Read-only); Quyết định do tổ chức ban hành.',
    badgeColor: 'bg-muted text-muted-foreground border-border',
    dotColor: 'bg-muted-foreground',
    iconName: 'Lock',
    canDirectEdit: false,
    requiresApproval: false,
    isOrgOnly: true,
  },
};

export const PERSONNEL_FIELDS: Record<string, FieldDefinition> = {
  // === MỨC 1: TỰ PHỤC VỤ ===
  phone: {
    key: 'phone',
    label: 'Số điện thoại cá nhân',
    tier: 1,
    category: 'contact',
    type: 'text',
    placeholder: '0901234567',
    helperText: 'Dùng để liên hệ công việc và nhận thông báo OTP/SMS',
  },
  currentAddress: {
    key: 'currentAddress',
    label: 'Nơi ở hiện nay / Tạm trú',
    tier: 1,
    category: 'contact',
    type: 'text',
    placeholder: 'Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành',
  },
  avatarUrl: {
    key: 'avatarUrl',
    label: 'Ảnh đại diện',
    tier: 1,
    category: 'contact',
    type: 'text',
  },
  bio: {
    key: 'bio',
    label: 'Giới thiệu bản thân (Bio)',
    tier: 1,
    category: 'contact',
    type: 'textarea',
    placeholder: 'Đôi dòng tóm tắt định hướng phát triển, kinh nghiệm bản thân...',
  },
  expertise: {
    key: 'expertise',
    label: 'Kỹ năng & Chuyên môn tự khai',
    tier: 1,
    category: 'contact',
    type: 'text',
    placeholder: 'Ví dụ: React, TypeScript, Quản trị rủi ro...',
  },
  strengths: {
    key: 'strengths',
    label: 'Sở trường công tác',
    tier: 1,
    category: 'contact',
    type: 'textarea',
    placeholder: 'Thế mạnh trong quản trị, kỹ thuật, giao tiếp...',
  },

  // === MỨC 2: ĐỊNH DANH PHÁP LÝ & BẰNG CẤP (CẦN XÉT DUYỆT) ===
  fullName: {
    key: 'fullName',
    label: 'Họ và tên khai sinh',
    tier: 2,
    category: 'identity',
    type: 'text',
    helperText: 'Cần giấy khai sinh hoặc CCCD mới nếu xin đổi họ tên',
  },
  aliasName: {
    key: 'aliasName',
    label: 'Tên gọi khác',
    tier: 2,
    category: 'identity',
    type: 'text',
  },
  gender: {
    key: 'gender',
    label: 'Giới tính',
    tier: 2,
    category: 'identity',
    type: 'select',
    options: ['Nam', 'Nữ', 'Khác'],
  },
  birthDate: {
    key: 'birthDate',
    label: 'Ngày tháng năm sinh',
    tier: 2,
    category: 'identity',
    type: 'date',
    helperText: 'Ảnh hưởng trực tiếp đến tuổi nghỉ hưu và đóng BHXH',
  },
  birthPlace: {
    key: 'birthPlace',
    label: 'Nơi sinh',
    tier: 2,
    category: 'identity',
    type: 'text',
  },
  hometown: {
    key: 'hometown',
    label: 'Quê quán',
    tier: 2,
    category: 'identity',
    type: 'text',
  },
  permanentAddress: {
    key: 'permanentAddress',
    label: 'Hộ khẩu thường trú',
    tier: 2,
    category: 'identity',
    type: 'text',
    helperText: 'Cần giấy xác nhận cư trú CT07 hoặc CCCD gắn chip',
  },
  idCardNo: {
    key: 'idCardNo',
    label: 'Số CCCD / Hộ chiếu',
    tier: 2,
    category: 'identity',
    type: 'text',
    helperText: 'Số 12 số CCCD gắn chip hợp lệ của Bộ Công an',
  },
  idCardIssueDate: {
    key: 'idCardIssueDate',
    label: 'Ngày cấp CCCD',
    tier: 2,
    category: 'identity',
    type: 'date',
  },
  idCardIssuePlace: {
    key: 'idCardIssuePlace',
    label: 'Nơi cấp CCCD',
    tier: 2,
    category: 'identity',
    type: 'text',
    placeholder: 'Cục Cảnh sát QLHC về TTXH',
  },
  ethnicity: {
    key: 'ethnicity',
    label: 'Dân tộc',
    tier: 2,
    category: 'identity',
    type: 'text',
    placeholder: 'Kinh, Tày, Thái, Mường...',
  },
  religion: {
    key: 'religion',
    label: 'Tôn giáo',
    tier: 2,
    category: 'identity',
    type: 'text',
    placeholder: 'Không, Phật giáo, Công giáo...',
  },
  maritalStatus: {
    key: 'maritalStatus',
    label: 'Tình trạng hôn nhân',
    tier: 2,
    category: 'identity',
    type: 'select',
    options: ['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Góa'],
  },
  generalEducation: {
    key: 'generalEducation',
    label: 'Giáo dục phổ thông',
    tier: 2,
    category: 'education',
    type: 'select',
    options: ['12/12', '10/10', '9/12'],
  },
  highestDegree: {
    key: 'highestDegree',
    label: 'Trình độ học vấn / Bằng cấp cao nhất',
    tier: 2,
    category: 'education',
    type: 'select',
    options: ['Tiến sĩ', 'Thạc sĩ', 'Đại học', 'Cao đẳng', 'Trung cấp', 'Sơ cấp'],
    helperText: 'Bắt buộc đính kèm scan bằng tốt nghiệp và bảng điểm',
  },
  majorName: {
    key: 'majorName',
    label: 'Chuyên ngành đào tạo',
    tier: 2,
    category: 'education',
    type: 'text',
    placeholder: 'Công nghệ thông tin, Quản trị kinh doanh, Luật...',
  },
  academicTitle: {
    key: 'academicTitle',
    label: 'Học hàm (Giáo sư, Phó Giáo sư)',
    tier: 2,
    category: 'education',
    type: 'select',
    options: ['Không', 'Phó Giáo sư', 'Giáo sư'],
  },
  foreignLanguage: {
    key: 'foreignLanguage',
    label: 'Trình độ ngoại ngữ',
    tier: 2,
    category: 'education',
    type: 'text',
    placeholder: 'Tiếng Anh B2 / IELTS 6.5, Tiếng Trung HSK 5...',
  },
  informaticsLevel: {
    key: 'informaticsLevel',
    label: 'Trình độ tin học',
    tier: 2,
    category: 'education',
    type: 'text',
    placeholder: 'Chuẩn CNTT cơ bản, Nâng cao, MOS...',
  },
  socialInsuranceNo: {
    key: 'socialInsuranceNo',
    label: 'Mã số BHXH',
    tier: 2,
    category: 'identity',
    type: 'text',
    helperText: '10 số sổ bảo hiểm xã hội',
  },

  // === MỨC 3: TỔ CHỨC - CHẾ ĐỘ - CHÍNH TRỊ (CHỈ XEM) ===
  employeeCode: {
    key: 'employeeCode',
    label: 'Mã nhân viên / cán bộ',
    tier: 3,
    category: 'organization',
    type: 'text',
    helperText: 'Do Tổ chức cấp duy nhất',
  },
  jobTitle: {
    key: 'jobTitle',
    label: 'Chức danh vị trí việc làm',
    tier: 3,
    category: 'organization',
    type: 'text',
  },
  govPosition: {
    key: 'govPosition',
    label: 'Chức vụ lãnh đạo / quản lý',
    tier: 3,
    category: 'organization',
    type: 'text',
    helperText: 'Quyết định bổ nhiệm bởi cấp có thẩm quyền',
  },
  rankCode: {
    key: 'rankCode',
    label: 'Ngạch công chức / viên chức',
    tier: 3,
    category: 'salary',
    type: 'text',
    helperText: 'Theo Thông tư chuẩn ngạch công chức/viên chức',
  },
  salaryStep: {
    key: 'salaryStep',
    label: 'Bậc lương hiện hưởng',
    tier: 3,
    category: 'salary',
    type: 'number',
  },
  salaryCoefficient: {
    key: 'salaryCoefficient',
    label: 'Hệ số lương',
    tier: 3,
    category: 'salary',
    type: 'number',
  },
  baseSalary: {
    key: 'baseSalary',
    label: 'Lương cơ bản (VNĐ)',
    tier: 3,
    category: 'salary',
    type: 'number',
  },
  positionAllowance: {
    key: 'positionAllowance',
    label: 'Hệ số phụ cấp chức vụ',
    tier: 3,
    category: 'salary',
    type: 'number',
  },
  overGradePercent: {
    key: 'overGradePercent',
    label: '% Vượt khung',
    tier: 3,
    category: 'salary',
    type: 'number',
  },
  hireDate: {
    key: 'hireDate',
    label: 'Ngày tuyển dụng',
    tier: 3,
    category: 'organization',
    type: 'date',
  },
  officialDate: {
    key: 'officialDate',
    label: 'Ngày vào biên chế / chính thức',
    tier: 3,
    category: 'organization',
    type: 'date',
  },
  employmentStatus: {
    key: 'employmentStatus',
    label: 'Tình trạng công tác',
    tier: 3,
    category: 'organization',
    type: 'text',
  },
  partyJoinDate: {
    key: 'partyJoinDate',
    label: 'Ngày vào Đảng CSVN',
    tier: 3,
    category: 'political',
    type: 'date',
  },
  partyPosition: {
    key: 'partyPosition',
    label: 'Chức vụ Đảng',
    tier: 3,
    category: 'political',
    type: 'text',
  },
  unionJoinDate: {
    key: 'unionJoinDate',
    label: 'Ngày vào Đoàn TNCS HCM',
    tier: 3,
    category: 'political',
    type: 'date',
  },
  enlistmentDate: {
    key: 'enlistmentDate',
    label: 'Ngày nhập ngũ',
    tier: 3,
    category: 'political',
    type: 'date',
  },
  militaryRank: {
    key: 'militaryRank',
    label: 'Quân hàm cao nhất',
    tier: 3,
    category: 'political',
    type: 'text',
  },
};

/** Lấy thông tin cấu hình của 1 trường */
export function getFieldDefinition(key: string): FieldDefinition | undefined {
  return PERSONNEL_FIELDS[key];
}

/** Kiểm tra trường có thuộc Mức 1 (Tự sửa) */
export function isTier1Field(key: string): boolean {
  return PERSONNEL_FIELDS[key]?.tier === 1;
}

/** Kiểm tra trường có thuộc Mức 2 (Cần HR duyệt) */
export function isTier2Field(key: string): boolean {
  return PERSONNEL_FIELDS[key]?.tier === 2;
}

/** Kiểm tra trường có thuộc Mức 3 (Tổ chức quản lý) */
export function isTier3Field(key: string): boolean {
  return PERSONNEL_FIELDS[key]?.tier === 3;
}

/** Lấy danh sách các trường Mức 2 có thể đề xuất sửa đổi */
export function getTier2EditableFields(): FieldDefinition[] {
  return Object.values(PERSONNEL_FIELDS).filter((f) => f.tier === 2);
}
