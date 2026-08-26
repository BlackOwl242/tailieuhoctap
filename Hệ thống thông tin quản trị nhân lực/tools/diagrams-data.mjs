// Dữ liệu 46 use case + thân biểu đồ đặc thù cho bộ sinh PlantUML
export const G = [
    {
        id: 'A', name: 'Quản trị hệ thống', ucs: [
            { id: 'UC01', n: 'Đăng nhập', a: 'Nhân viên', pat: 's:UC01', pg: '/login', ct: 'AuthService', en: 'User, RefreshToken' },
            { id: 'UC02', n: 'Quản lý tài khoản', a: 'Nhân viên IT', pat: 'crud', pg: '/admin/users', ct: 'UsersService', en: 'User, Role, UserRole' },
            { id: 'UC03', n: 'Quản lý cây tổ chức', a: 'Nhân viên IT', pat: 'crud', pg: '/admin/org-units', ct: 'OrgUnitsService', en: 'OrgUnit' }]
    },
    {
        id: 'B', name: 'Tuyển dụng', ucs: [
            { id: 'UC04', n: 'Lập phiếu đề xuất tuyển dụng', a: 'Trưởng dự án', pat: 's:UC04', pg: '/recruitment-ats', ct: 'RecruitmentService', en: 'JobRequisition' },
            { id: 'UC05', n: 'Thẩm định chỉ tiêu tuyển dụng', a: 'Chuyên viên tuyển dụng, Kế toán', pat: 's:UC05', pg: '/recruitment-ats', ct: 'RecruitmentService', en: 'JobRequisition' },
            { id: 'UC06', n: 'Phê duyệt chỉ tiêu tuyển dụng', a: 'Giám đốc', pat: 's:UC06', pg: '/recruitment-ats', ct: 'RecruitmentService', en: 'JobRequisition' },
            { id: 'UC07', n: 'Quản lý hồ sơ ứng viên', a: 'Chuyên viên tuyển dụng', pat: 'crud', pg: '/recruitment-ats', ct: 'RecruitmentService', en: 'Candidate' },
            { id: 'UC08', n: 'Gửi thư mời và xếp lương', a: 'Chuyên viên tuyển dụng', pat: 's:UC08', pg: '/recruitment-ats', ct: 'RecruitmentService', en: 'HrmsJobOffer' }]
    },
    {
        id: 'C', name: 'Hồ sơ - Thử việc', ucs: [
            { id: 'UC09', n: 'Quản lý hồ sơ nhân viên', a: 'Chuyên viên hồ sơ', pat: 'crud', pg: '/employees', ct: 'EmployeesService', en: 'User' },
            { id: 'UC10', n: 'Quản lý hợp đồng lao động', a: 'Chuyên viên hồ sơ', pat: 'crud', pg: '/employees/:id', ct: 'EmployeesService', en: 'Contract' },
            { id: 'UC11', n: 'Quản lý văn bằng - chứng chỉ', a: 'Chuyên viên hồ sơ', pat: 'crud', pg: '/employees/:id', ct: 'EmployeesService', en: 'Certificate' },
            { id: 'UC12', n: 'Mượn - trả hồ sơ bản gốc', a: 'Nhân viên, Chuyên viên hồ sơ', pat: 'a:approvalShort', pg: '/employees/:id', ct: 'EmployeesService', en: 'PhieuMuonTra (thiết kế)' },
            { id: 'UC13', n: 'Đánh giá thử việc', a: 'Trưởng dự án', pat: 's:UC13', pg: '/lifecycle', ct: 'HrmsLifecycleService', en: 'Contract, HrmsLifecycleEvent' }]
    },
    {
        id: 'D', name: 'Biến động nhân sự', ucs: [
            { id: 'UC14', n: 'Đề xuất thuyên chuyển', a: 'Trưởng dự án', pat: 'a:approvalShort', pg: '/personnel', ct: 'PersonnelActionsService', en: 'PersonnelAction' },
            { id: 'UC15', n: 'Đề xuất điều chỉnh lương', a: 'Trưởng dự án', pat: 'a:approvalShort', pg: '/personnel', ct: 'PersonnelActionsService', en: 'PersonnelAction' },
            { id: 'UC16', n: 'Đề xuất khen thưởng - kỷ luật', a: 'Trưởng dự án, Đại diện người lao động', pat: 'a:approvalShort', pg: '/personnel', ct: 'PersonnelActionsService', en: 'PersonnelAction' },
            { id: 'UC17', n: 'Xử lý thôi việc', a: 'Nhân viên và các bộ phận', pat: 's:UC17', pg: '/personnel, /handover', ct: 'PersonnelActionsService', en: 'PersonnelAction, HandoverChecklist' }]
    },
    {
        id: 'E', name: 'Chấm công - Nghỉ phép', ucs: [
            { id: 'UC18', n: 'Ghi nhận chấm công', a: 'Nhân viên, Chuyên viên hồ sơ', pat: 's:UC18', pg: '/attendance', ct: 'AttendanceService', en: 'AttendanceEvent, AttendanceDay' },
            { id: 'UC19', n: 'Đăng ký làm thêm giờ', a: 'Nhân viên', pat: 'a:approvalShort', pg: '/overtime', ct: 'OvertimeService', en: 'OvertimeRequest' },
            { id: 'UC20', n: 'Đăng ký nghỉ phép', a: 'Nhân viên', pat: 's:UC20', pg: '/leave', ct: 'LeaveService', en: 'LeaveRequest, LeaveBalance' },
            { id: 'UC21', n: 'Chốt bảng chấm công', a: 'Chuyên viên tiền lương', pat: 's:UC21', pg: '/attendance', ct: 'AttendanceService', en: 'AttendanceDay' },
            { id: 'UC26', n: 'Điểm danh bằng mã QR', a: 'Nhân viên', pat: 's:UC26', pg: '/kiosk, /check-in', ct: 'QrTokenService, AttendanceService', en: 'AttendanceEvent' },
            { id: 'UC27', n: 'Điểm danh bằng khuôn mặt', a: 'Nhân viên', pat: 's:UC27', pg: '/attendance', ct: 'FaceCryptoService, AttendanceService', en: 'FaceEmbedding, AttendanceEvent' }]
    },
    {
        id: 'F', name: 'Lương - Báo cáo', ucs: [
            { id: 'UC22', n: 'Cấu hình công thức lương', a: 'Chuyên viên tiền lương', pat: 'crud', pg: '/payroll-engine', ct: 'HrmsPayrollService', en: 'HrmsSalaryComponent, HrmsSalaryStructure' },
            { id: 'UC23', n: 'Tính bảng lương hằng tháng', a: 'Chuyên viên tiền lương', pat: 's:UC23', pg: '/payroll', ct: 'PayrollService', en: 'PayrollPeriod, Payslip' },
            { id: 'UC24', n: 'Duyệt bảng lương', a: 'Chuyên viên tiền lương, Quản trị viên', pat: 's:UC24', pg: '/payroll', ct: 'PayrollService', en: 'PayrollPeriod' },
            { id: 'UC25', n: 'Xem thông tin cá nhân', a: 'Nhân viên', pat: 'r:/ess, /profile', ct: 'DashboardService, LeaveService', en: 'LeaveBalance, Payslip' }]
    },
    {
        id: 'G', name: 'Cổng tự phục vụ - Ca kíp', ucs: [
            { id: 'UC28', n: 'Sử dụng cổng tự phục vụ ESS', a: 'Nhân viên', pat: 'r:/ess', ct: 'DashboardService', en: 'LeaveBalance, Payslip, HrmsAssetAllocation' },
            { id: 'UC29', n: 'Giải trình bổ sung giờ công', a: 'Nhân viên', pat: 's:UC29', pg: '/ess', ct: 'HrmsRegularizationService', en: 'HrmsAttendanceRegularization' },
            { id: 'UC30', n: 'Quản lý ca kíp - bảng phân ca', a: 'Chuyên viên tiền lương', pat: 'crud', pg: '/shifts', ct: 'HrmsShiftsService', en: 'HrmsShiftType, HrmsShiftAssignment' }]
    },
    {
        id: 'H', name: 'Tiền lương - Phúc lợi mở rộng', ucs: [
            { id: 'UC31', n: 'Vận hành bảng lương tự động', a: 'Chuyên viên tiền lương', pat: 's:UC31', pg: '/payroll-engine', ct: 'HrmsPayrollService', en: 'HrmsPayrollRun, HrmsPayrollSlip' },
            { id: 'UC32', n: 'Quản lý khoản vay - tạm ứng', a: 'Nhân viên', pat: 's:UC32', pg: '/loans', ct: 'HrmsLoansService', en: 'HrmsEmployeeLoan' },
            { id: 'UC33', n: 'Quản lý công tác phí', a: 'Nhân viên', pat: 's:UC33', pg: '/expense-claims', ct: 'HrmsExpensesService', en: 'HrmsTravelRequest, HrmsExpenseClaim' },
            { id: 'UC34', n: 'Quản lý cấp phát - thu hồi tài sản', a: 'Nhân viên hành chính', pat: 's:UC34', pg: '/assets', ct: 'HrmsAssetsService', en: 'HrmsAssetAllocation' }]
    },
    {
        id: 'I', name: 'Tuyển dụng - Phát triển nâng cao', ucs: [
            { id: 'UC35', n: 'Vận hành ATS Kanban', a: 'Chuyên viên tuyển dụng', pat: 's:UC35', pg: '/recruitment-ats', ct: 'HrmsRecruitmentService', en: 'HrmsJobOpening, HrmsJobApplicant' },
            { id: 'UC36', n: 'Đánh giá hiệu suất KRA/KPI - phản hồi 360 độ', a: 'Chuyên viên nhân sự, Trưởng dự án', pat: 's:UC36', pg: '/performance-360', ct: 'HrmsPerformanceService', en: 'HrmsAppraisalCycle, HrmsAppraisalGoal, HrmsAppraisalReview' },
            { id: 'UC37', n: 'Quản trị đào tạo - tiếp nhận khiếu nại', a: 'Chuyên viên nhân sự, Nhân viên', pat: 's:UC37', pg: '/training-grievance', ct: 'HrmsTrainingService', en: 'HrmsTrainingProgram, HrmsGrievance' }]
    },
    {
        id: 'J', name: 'Chuẩn cán bộ công chức (BNV)', ucs: [
            { id: 'UC38', n: 'Quản lý hồ sơ cán bộ toàn diện 2C-BNV', a: 'Chuyên viên hồ sơ', pat: 'crud', pg: '/personnel-profiles', ct: 'PersonnelProfilesService', en: 'PersonnelComprehensiveProfile + 8 bảng quá trình' },
            { id: 'UC39', n: 'Quản lý danh mục ngạch bậc lương', a: 'Chuyên viên hồ sơ', pat: 'crud', pg: '/salary-ranks', ct: 'PersonnelRanksService', en: 'PersonnelRank' },
            { id: 'UC40', n: 'Quét - phê duyệt nâng bậc lương tự động', a: 'Chuyên viên hồ sơ, Giám đốc', pat: 's:UC40', pg: '/salary-progression', ct: 'PersonnelReportsService', en: 'PersonnelSalaryHistory' },
            { id: 'UC41', n: 'Xuất mẫu biểu nhà nước', a: 'Chuyên viên hồ sơ', pat: 's:UC41', pg: '/personnel-reports', ct: 'PersonnelReportsService', en: 'PersonnelComprehensiveProfile' }]
    },
    {
        id: 'K', name: 'Tri thức nội bộ', ucs: [
            { id: 'UC42', n: 'Quản lý không gian tri thức - bài viết', a: 'Nhân viên (soạn), Quản lý Space (duyệt)', pat: 's:UC42', pg: '/spaces, /review', ct: 'ArticlesService', en: 'Space, Article, ArticleVersion, ArticleReview' },
            { id: 'UC43', n: 'Tìm kiếm tri thức - tìm chuyên gia', a: 'Nhân viên', pat: 's:UC43', pg: '/search, /people', ct: 'SearchService, PeopleService', en: 'Article, User' },
 { id: 'UC44', n: 'Lộ trình hội nhập - bàn giao công việc', a: 'Nhân viên mới, Chuyên viên hồ sơ', pat: 's:UC44', pg: '/onboarding, /handover', ct: 'OnboardingService, PersonnelActionsService', en: 'OnboardingPath, HandoverChecklist' }]
    },
    {
        id: 'L', name: 'Điều hành - Quản trị', ucs: [
            { id: 'UC45', n: 'Xem bảng điều khiển điều hành', a: 'Toàn bộ vai', pat: 'r:/dashboard', ct: 'DashboardService', en: 'User, PayrollRun, PersonnelAction' },
            { id: 'UC46', n: 'Tra cứu nhật ký kiểm toán - cấu hình tham số', a: 'Nhân viên IT', pat: 's:UC46', pg: '/admin/audit, /admin/settings', ct: 'AuditService, SettingsService', en: 'AuditLog, Setting' }]
    },
];
export const ALL = G.flatMap(g => g.ucs.map(u => ({ ...u, g })));

export const SEQ = {
    UC01: `actor "Nhân viên" as U
boundary "Trang /login" as B
control "AuthService" as C
entity "User / RefreshToken" as E
U -> B : nhập email + mật khẩu
B -> C : login(email, password)
C -> E : so khớp bcrypt
alt hợp lệ
  C -> E : cấp access token (15 phút) + refresh token (7 ngày)
  B --> U : chuyển hướng theo vai
else sai >= 5 lần
  C -> E : khóa tài khoản 15 phút
  B --> U : báo lỗi
end`,
    UC02: `actor "Nhân viên IT" as A
boundary "Trang /admin/users" as B
control "UsersService" as C
entity "User / Role" as E
A -> B : tìm kiếm / chọn người dùng
B -> C : tạo - sửa - khóa, gán vai
C -> E : ghi dữ liệu
C -> E : ghi AuditLog (append-only)
B --> A : làm mới danh sách`,
    UC03: `actor "Nhân viên IT" as A
boundary "Trang /admin/org-units" as B
control "OrgUnitsService" as C
entity "OrgUnit" as E
A -> B : thêm / sửa / xóa đơn vị
C -> E : kiểm tra vòng lặp cha - con
C -> E : cập nhật cây (parentId, path)
C -> E : ghi AuditLog
B --> A : vẽ lại cây tổ chức`,
    UC04: `actor "Trưởng dự án" as PM
actor "Chuyên viên tuyển dụng" as HR
actor "Kế toán" as KT
actor "Giám đốc" as GD
boundary "Trang ATS" as B
control "RecruitmentService" as C
entity "JobRequisition" as E
PM -> B : lập phiếu (vị trí, số lượng, lý do)
B -> C : submit()
C -> E : lưu trạng thái PENDING_REVIEW
C -> HR : thông báo thẩm định
HR -> C : đối chiếu định biên + yêu cầu xác nhận quỹ
C -> KT : gửi yêu cầu song song
KT -> C : xác nhận khả năng chi
C -> GD : chuyển PENDING_APPROVAL
GD -> C : approve() từ xa
C -> E : cập nhật APPROVED, kích hoạt vị trí tuyển`,
    UC05: `actor "Chuyên viên tuyển dụng" as HR
actor "Kế toán" as KT
boundary "Trang ATS" as B
control "RecruitmentService" as C
entity "JobRequisition" as E
HR -> B : mở phiếu chờ thẩm định
B -> C : review()
C -> E : đối chiếu định biên - nội quy
alt có người nội bộ phù hợp
  C --> HR : gợi ý luân chuyển, dừng luồng
else cần ngân sách
  C -> KT : yêu cầu xác nhận quỹ
  KT -> C : xác nhận khả năng chi
  C -> E : chuyển PENDING_APPROVAL
end`,
    UC06: `actor "Giám đốc" as GD
boundary "Trang ATS" as B
control "RecruitmentService" as C
entity "JobRequisition" as E
GD -> B : xem tờ trình điện tử
alt ký duyệt
  GD -> C : approve(kèm ý kiến)
  C -> E : APPROVED + kích hoạt kế hoạch tuyển
else điều chỉnh / từ chối
  GD -> C : reject(kèm ý kiến)
  C -> E : REJECTED, phản hồi Trưởng dự án
end
C -> E : ghi AuditLog`,
    UC08: `actor "Chuyên viên tuyển dụng" as HR
actor "Ứng viên" as UV
boundary "Trang ATS" as B
control "RecruitmentService" as C
entity "HrmsJobOffer" as E
HR -> B : soạn thư mời (chức danh, lương, ngày nhận việc)
B -> C : createOffer()
C -> E : đối chiếu thang bảng lương
alt vượt khung
  C -> C : trình Giám đốc duyệt riêng
end
UV -> C : chấp nhận thư mời
C -> E : OFFER_ACCEPTED, chuyển sang hội nhập`,
    UC13: `actor "Trưởng dự án" as PM
boundary "Trang /lifecycle" as B
control "HrmsLifecycleService" as C
entity "Contract / HrmsLifecycleEvent" as E
PM -> B : điền phiếu đánh giá thử việc
B -> C : submitEvaluation()
alt đạt
  C -> E : sinh nhiệm vụ ký HĐ chính thức + xếp lương (>= 85%)
  C -> E : PROBATION -> ACTIVE
else không đạt
  C -> E : sinh nhiệm vụ chấm dứt hợp đồng thử việc
end`,
    UC17: `actor "Nhân viên" as NV
actor "Các bộ phận xác nhận" as BP
actor "Quản trị viên" as AD
boundary "Trang /personnel" as B
control "PersonnelActionsService" as C
entity "HandoverChecklist" as E
NV -> B : nộp đơn thôi việc
AD -> C : duyệt đơn
C -> E : tự sinh checklist 5 mục xác nhận
BP -> C : lần lượt xác nhận (1/5 -> 5/5)
alt đủ 5/5
  C -> E : bật phát hành quyết định chấm dứt hợp đồng
  C -> E : hồ sơ chuyển Lưu trữ - đã nghỉ
else thiếu
  C --> BP : nhắc mục còn thiếu
end`,
    UC18: `actor "Nhân viên" as NV
actor "Máy chấm công" as MC
boundary "Trang /attendance" as B
control "AttendanceService" as C
entity "AttendanceEvent / AttendanceDay" as E
NV -> B : điểm danh web
MC -> C : webhook HMAC / import CSV
C -> E : INSERT sự kiện thô (append-only)
C -> E : tổng hợp bảng công ngày (vào/ra, muộn/sớm)
C --> B : hiển thị bảng công, đánh dấu bản ghi lệch`,
    UC20: `actor "Nhân viên" as NV
actor "Chuyên viên nhân sự" as HR
boundary "Trang /leave" as B
control "LeaveService" as C
entity "LeaveRequest / LeaveBalance" as E
NV -> B : tạo đơn (loại, từ ngày, đến ngày)
B -> C : checkBalance()
alt quỹ đủ
  C -> E : lưu PENDING, thông báo HR
  HR -> C : approve()
  C -> E : trừ quỹ NGAY + ghi công phép vào bảng công
else quỹ không đủ
  C --> NV : từ chối kèm số dư còn lại
end`,
    UC21: `actor "Chuyên viên tiền lương" as CV
actor "Trưởng dự án" as PM
boundary "Trang /attendance" as B
control "AttendanceService" as C
entity "AttendanceDay" as E
CV -> B : hợp nhất bảng công tháng
C -> E : tổng hợp sự kiện, xử lý bản ghi lệch
PM -> B : xác nhận bảng công nhóm
CV -> B : chốt ngày 25, khóa bảng công
C -> E : khóa dữ liệu công chuyển sang tính lương`,
    UC23: `actor "Chuyên viên tiền lương" as CV
boundary "Trang /payroll" as B
control "PayrollService" as C
entity "Payslip / PayrollPeriod" as E
CV -> B : bấm tính lương kỳ đã chốt công
C -> E : nạp lương hợp đồng ACTIVE + OT đã duyệt
C -> E : trừ BHXH 10,5% + thuế TNCN 7 bậc - EMI vay
C -> E : sinh Payslip từng nhân viên
CV -> B : đối chiếu
alt khớp
  CV -> C : trình duyệt
else lệch
  C -> E : ghi chú, tính lại (giữ vết audit)
end`,
    UC24: `actor "Chuyên viên tiền lương" as CV
actor "Quản trị viên" as AD
boundary "Trang /payroll" as B
control "PayrollService" as C
entity "PayrollPeriod" as E
CV -> B : trình kết quả REVIEWED
AD -> B : duyệt và khóa kỳ
C -> E : OPEN -> CALCULATED -> REVIEWED -> LOCKED
alt gọi tính lại sau khóa
  C --> B : chặn lỗi HTTP 409
end
C -> E : xuất bảng kê chi lương ngân hàng`,
    UC26: `actor "Nhân viên" as NV
boundary "Kiosk /check-in" as B
control "QrTokenService" as C
control "AttendanceService" as S
entity "AttendanceEvent" as E
B -> C : lấy token HMAC {kiosk_id, iat, jti} TTL 30 giây
NV -> B : quét mã, xác nhận
B -> S : checkIn(qr_token)
S -> C : verify chữ ký + TTL <= 60 giây + jti một lần
alt hợp lệ và không trùng ±2 phút
  S -> E : INSERT sự kiện (nguồn QR)
  S -> E : tổng hợp bảng công ngày
  B --> NV : phản hồi chấm công thành công
else vi phạm
  S --> B : từ chối, đánh dấu lệch nếu thiếu giờ ra
end`,
    UC27: `actor "Nhân viên" as NV
boundary "Trang /attendance" as B
control "FaceCryptoService" as F
control "AttendanceService" as S
entity "FaceEmbedding / AttendanceEvent" as E
NV -> B : đăng ký mẫu (tick đồng thuận)
B -> F : trích vector, mã hóa AES-256-GCM
F -> E : lưu FaceEmbedding (không lưu ảnh gốc)
NV -> B : điểm danh khuôn mặt
B -> F : so khớp cosine similarity
alt vượt ngưỡng
  F -> S : ghi sự kiện (nguồn = khuôn mặt)
else không khớp
  S --> NV : từ chối rõ ràng, giới hạn số lần thử
end`,
    UC29: `actor "Nhân viên" as NV
actor "Quản lý" as QL
boundary "Trang /ess" as B
control "HrmsRegularizationService" as C
entity "HrmsAttendanceRegularization" as E
NV -> B : chọn ngày thiếu công, nhập giờ mong muốn + lý do
B -> C : submit()
C -> E : lưu PENDING, thông báo quản lý
QL -> C : duyệt / từ chối
alt duyệt
  C -> E : bù công vào bảng chấm công
else từ chối
  C -> E : lưu lý do
end`,
    UC31: `actor "Chuyên viên tiền lương" as CV
boundary "Trang /payroll-engine" as B
control "HrmsPayrollService" as C
entity "HrmsPayrollRun / HrmsPayrollSlip" as E
CV -> B : định nghĩa thành phần + cấu trúc lương, gán nhân viên
CV -> B : chạy kỳ 1-click
C -> E : tính gross theo cấu trúc + OT (150/200/300%)
C -> E : khấu trừ luật định + EMI vay
C -> E : sinh slip kèm breakdown từng khoản
CV -> B : xuất bảng kê chi lương ngân hàng`,
    UC32: `actor "Nhân viên" as NV
actor "Chuyên viên nhân sự" as HR
boundary "Trang /loans" as B
control "HrmsLoansService" as C
entity "HrmsEmployeeLoan" as E
NV -> B : tạo đơn vay / tạm ứng (kỳ hạn 1-24 tháng)
C -> E : tính EMI hàng tháng
alt EMI <= 30% thực lĩnh
  C -> E : chuyển CHỜ THẨM ĐỊNH
  HR -> C : duyệt giải ngân
  C -> E : APPROVED, EMI nạp bảng lương đến hết nợ
else vượt trần
  C --> NV : chặn kèm thông báo
end`,
    UC33: `actor "Nhân viên" as NV
actor "Chuyên viên nhân sự" as HR
boundary "Trang /expense-claims" as B
control "HrmsExpensesService" as C
entity "HrmsTravelRequest / HrmsExpenseClaim" as E
NV -> B : đề xuất chuyến công tác
HR -> C : duyệt lịch trình
C -> E : tạm ứng kinh phí
NV -> B : lập bảng kê chi phí + chứng từ
HR -> C : duyệt quyết toán
C -> E : chuyển số liệu xuống kỳ lương / kế toán`,
    UC34: `actor "Nhân viên hành chính" as HC
boundary "Trang /assets" as B
control "HrmsAssetsService" as C
entity "HrmsAssetAllocation" as E
HC -> B : đăng ký tài sản mới
HC -> B : cấp phát cho nhân viên
C -> E : lập biên bản bàn giao, trạng thái ALLOCATED
HC -> B : thu hồi khi chuyển / thôi việc
C -> E : trả về IN_STOCK (hoặc DECOMMISSIONED)`,
    UC35: `actor "Chuyên viên tuyển dụng" as HR
boundary "Trang /recruitment-ats" as B
control "HrmsRecruitmentService" as C
entity "HrmsJobApplicant" as E
HR -> B : kéo-thả ứng viên qua pipeline
C -> E : cập nhật stage (Sàng lọc -> PV1 -> PV2 -> Offer)
HR -> B : bấm chuyển thành nhân viên
C -> E : sinh hồ sơ nhân viên + hợp đồng thử việc
C -> E : kích hoạt onboarding`,
    UC36: `actor "Chuyên viên nhân sự" as HR
actor "Nhân viên" as NV
actor "Quản lý" as QL
boundary "Trang /performance-360" as B
control "HrmsPerformanceService" as C
entity "HrmsAppraisalGoal / HrmsAppraisalReview" as E
HR -> B : tạo kỳ đánh giá, gán KRA/KPI theo trọng số %
NV -> C : tự đánh giá
QL -> C : chấm điểm + phản hồi 360 độ
NV -> C : xác nhận kết quả
C -> E : lưu kết quả làm căn cứ tăng lương`,
    UC37: `actor "Chuyên viên nhân sự" as HR
actor "Nhân viên" as NV
boundary "Trang /training-grievance" as B
control "HrmsTrainingService" as C
entity "HrmsTrainingProgram / HrmsGrievance" as E
HR -> B : lập chương trình đào tạo
NV -> C : ghi danh (chặn khi hết chỗ)
NV -> C : hoàn thành + khảo sát hài lòng
NV -> B : gửi khiếu nại / kiến nghị
HR -> C : xử lý đến RESOLVED`,
    UC40: `actor "Chuyên viên hồ sơ" as HR
actor "Giám đốc" as GD
boundary "Trang /salary-progression" as B
control "PersonnelReportsService" as C
entity "PersonnelSalaryHistory" as E
HR -> B : bấm quét nâng bậc
C -> E : đối chiếu ngày hưởng bậc với chu kỳ 36/24 tháng
C -> E : sinh danh sách đề nghị (bậc trần cộng vượt khung 5% + 1%/năm)
GD -> C : phê duyệt
C -> E : cập nhật ngạch/bậc/hệ số + ghi diễn biến lương`,
    UC41: `actor "Chuyên viên hồ sơ" as HR
boundary "Trang /personnel-reports" as B
control "PersonnelReportsService" as C
entity "PersonnelComprehensiveProfile" as E
HR -> B : chọn nhân viên, xuất 2C PDF
C -> E : tổng hợp 111 thuộc tính + 8 bảng quá trình
C --> HR : Sơ yếu lý lịch Mẫu 2C-BNV/2008 (4 trang)
HR -> B : chọn Biểu thống kê
C --> HR : Biểu 01 / 02 / 03 dạng Excel`,
    UC42: `actor "Tác giả" as TG
actor "Quản lý Space" as QL
boundary "Trang /spaces, /review" as B
control "ArticlesService" as C
entity "Article / ArticleVersion / ArticleReview" as E
TG -> B : soạn bài (Markdown + đính kèm)
C -> E : lưu DRAFT
TG -> C : submit()
C -> E : PENDING_REVIEW + thông báo quản lý
alt duyệt
  QL -> C : approve()
  C -> E : PUBLISHED
else yêu cầu chỉnh sửa
  QL -> C : request_changes(kèm ý kiến)
  C -> E : về DRAFT
end
TG -> C : sửa bài
C -> E : sinh phiên bản mới (bất biến), rollback được`,
    UC43: `actor "Nhân viên" as NV
boundary "Trang /search, /people" as B
control "SearchService" as C
entity "Article (FTS + pg_trgm)" as E
NV -> B : nhập từ khóa
B -> C : search(q)
C -> E : truy vấn FTS lọc phạm vi quyền ngay trong SQL
C --> NV : kết quả kèm highlight
NV -> B : tìm chuyên gia theo lĩnh vực
B -> C : directory chuyên môn
C --> NV : danh sách chuyên gia + bài viết theo tác giả`,
    UC46: `actor "Nhân viên IT" as IT
boundary "Trang /admin/audit, /admin/settings" as B
control "AuditService / SettingsService" as C
entity "AuditLog / Setting" as E
IT -> B : tra cứu audit log
C -> E : đọc append-only (ai, làm gì, trước/sau)
IT -> B : chỉnh tham số key-value
C -> E : lưu Setting (không cần triển khai lại)
C -> E : ghi AuditLog thay đổi`,
UC44: `actor "Nhân viên mới" as NV
actor "Chuyên viên hồ sơ" as HR
boundary "Trang /onboarding, /handover" as B
control "OnboardingService" as C
entity "OnboardingPath / HandoverChecklist" as E
HR -> C : gán lộ trình đọc theo vị trí
NV -> B : tick tiến độ từng bài bắt buộc
alt thôi việc được duyệt
  HR -> C : kích hoạt checklist bàn giao 5 mục
  BP -> C : các bên xác nhận từng mục
  alt đủ 5/5
    C -> E : đóng checklist, hồ sơ chuyển lưu trữ
  else thiếu
    C --> HR : nhắc mục còn thiếu
  end
else đang làm việc
  C -> E : cập nhật tiến độ hội nhập
end`,
};

export const ACT = {
    UC01: [`start`, `:Nhập email + mật khẩu;`, `:So khớp bcrypt;`, `if (Hợp lệ?) then (có)`, `:Cấp access + refresh token;`, `:Vào giao diện theo vai;`, `else (không)`, `:Báo lỗi;`, `if (Sai >= 5 lần?) then (có)`, `:Khóa tài khoản 15 phút;`, `endif`, `endif`, `stop`],
    UC04: [`start`, `:Trưởng dự án lập phiếu đề xuất;`, `:Lưu PENDING_REVIEW, báo chuyên viên;`, `:Thẩm định định biên + nội quy;`, `:Kế toán xác nhận quỹ (song song);`, `:Trình Giám đốc;`, `if (Ký duyệt?) then (có)`, `:APPROVED - kích hoạt vị trí tuyển;`, `else (không)`, `:REJECTED kèm ý kiến;`, `endif`, `stop`],
    UC08: [`start`, `:Soạn thư mời (chức danh, lương, ngày nhận việc);`, `if (Lương vượt khung?) then (có)`, `:Trình Giám đốc duyệt riêng;`, `else (không)`, `:Gửi ngay;`, `endif`, `:Ứng viên chấp nhận;`, `:Chuyển sang luồng hội nhập;`, `stop`],
    UC13: [`start`, `:Trưởng dự án điền phiếu đánh giá thử việc;`, `if (Đạt?) then (có)`, `:Sinh nhiệm vụ ký HĐ chính thức + xếp lương;`, `:PROBATION -> ACTIVE;`, `else (không)`, `:Sinh nhiệm vụ chấm dứt hợp đồng thử việc;`, `endif`, `stop`],
    UC17: [`start`, `:Nhân viên nộp đơn thôi việc;`, `:Quản trị viên duyệt;`, `:Tự sinh checklist 5 mục xác nhận;`, `repeat`, `:Bộ phận tiếp theo xác nhận;`, `repeat while (Chưa đủ 5/5?) is (thiếu)`, `:Bật phát hành quyết định chấm dứt hợp đồng;`, `:Hồ sơ chuyển Lưu trữ - đã nghỉ;`, `stop`],
    UC18: [`start`, `fork`, `:Điểm danh web;`, `fork again`, `:Quét QR tại kiosk;`, `fork again`, `:Điểm danh khuôn mặt;`, `fork again`, `:Máy chấm công đẩy webhook/CSV;`, `end fork`, `:INSERT sự kiện thô (bất biến);`, `:Tổng hợp bảng công ngày;`, `if (Thiếu vào/ra?) then (có)`, `:Đánh dấu lệch vào hàng đợi;`, `else (không)`, `:Công chuẩn;`, `endif`, `stop`],
    UC20: [`start`, `:Nhân viên tạo đơn nghỉ phép;`, `:Kiểm tra quỹ phép;`, `if (Quỹ đủ?) then (có)`, `:Lưu PENDING, báo chuyên viên;`, `if (Duyệt?) then (có)`, `:Trừ quỹ NGAY + ghi công phép;`, `else (không)`, `:Lưu lý do từ chối;`, `endif`, `else (không)`, `:Chặn đơn kèm số dư còn lại;`, `endif`, `stop`],
    UC23: [`start`, `:Chốt dữ liệu công + OT đã duyệt;`, `:Nạp lương hợp đồng ACTIVE;`, `:Tính gross theo cấu trúc lương;`, `:Trừ BHXH 10,5% + thuế TNCN 7 bậc - EMI;`, `:Sinh phiếu lương từng nhân viên;`, `:Đối chiếu;`, `if (Khớp?) then (có)`, `:ADMIN khóa kỳ LOCKED (chặn 409);`, `:Xuất bảng kê ngân hàng;`, `else (không)`, `:Ghi chú, tính lại giữ vết;`, `endif`, `stop`],
    UC26: [`start`, `:Kiosk xin token HMAC TTL 30 giây;`, `:Hiển thị mã QR, xoay mỗi 30 giây;`, `:Nhân viên quét bằng điện thoại;`, `if (Token hợp lệ + jti chưa dùng + ngoài ±2 phút?) then (có)`, `:INSERT sự kiện (nguồn QR);`, `:Tổng hợp bảng công ngày;`, `:Phản hồi chấm công thành công;`, `else (không)`, `:Từ chối;`, `endif`, `stop`],
    UC27: [`start`, `:Tick đồng thuận dữ liệu sinh trắc học;`, `:Trích vector từ 3-5 ảnh, mã hóa AES-256-GCM;`, `:Lưu FaceEmbedding;`, `:Điểm danh khuôn mặt thời gian thực;`, `if (Cosine similarity vượt ngưỡng?) then (có)`, `:Ghi sự kiện nguồn khuôn mặt;`, `else (không)`, `:Từ chối, giới hạn số lần thử;`, `endif`, `stop`],
    UC29: [`start`, `:Chọn ngày thiếu công;`, `:Nhập giờ vào/ra mong muốn + lý do;`, `:Gửi giải trình;`, `if (Quản lý duyệt?) then (có)`, `:Bù công vào bảng chấm công;`, `else (không)`, `:Lưu lý do từ chối;`, `endif`, `stop`],
    UC31: [`start`, `:Định nghĩa thành phần thu nhập/khấu trừ;`, `:Gán cấu trúc lương cho nhân viên;`, `:Chạy kỳ 1-click;`, `:Tính gross + OT hệ số 150/200/300%;`, `:Khấu trừ luật định + EMI;`, `:Sinh slip kèm breakdown;`, `:Xuất bảng kê chi lương ngân hàng;`, `stop`],
    UC32: [`start`, `:Nhân viên tạo đơn vay/tạm ứng;`, `:Hệ thống tính EMI hàng tháng;`, `if (EMI <= 30% thực lĩnh?) then (đạt)`, `:Chờ thẩm định;`, `if (HR duyệt?) then (có)`, `:Giải ngân;`, `:EMI nạp bảng lương đến hết nợ;`, `else (không)`, `:Lưu lý do;`, `endif`, `else (vượt trần)`, `:Chặn kèm thông báo;`, `endif`, `stop`],
    UC33: [`start`, `:Đề xuất chuyến công tác;`, `:Duyệt lịch trình;`, `:Tạm ứng kinh phí;`, `:Lập bảng kê chi phí + chứng từ;`, `:Duyệt quyết toán;`, `:Chuyển số liệu xuống kỳ lương/kế toán;`, `stop`],
    UC34: [`start`, `:Đăng ký tài sản;`, `:Cấp phát kèm biên bản bàn giao;`, `:Trạng thái ALLOCATED;`, `if (Nhân viên chuyển/thôi việc?) then (có)`, `:Thu hồi về kho IN_STOCK;`, `else (không)`, `:Tiếp tục sử dụng;`, `endif`, `stop`],
    UC35: [`start`, `:Quản lý vị trí tuyển mở;`, `:Kéo-thả ứng viên qua pipeline;`, `:Sàng lọc -> PV1 -> PV2 -> Offer;`, `if (Nhận việc?) then (có)`, `:Chuyển thành nhân viên;`, `:Sinh hồ sơ + hợp đồng thử việc;`, `else (không)`, `:Đánh dấu REJECTED;`, `endif`, `stop`],
    UC36: [`start`, `:Tạo kỳ đánh giá;`, `:Gán KRA/KPI theo trọng số %;`, `:Nhân viên tự đánh giá;`, `:Phản hồi 360 độ từ đồng nghiệp/quản lý;`, `:Quản lý chấm điểm;`, `:Nhân viên xác nhận kết quả;`, `stop`],
    UC37: [`start`, `:Lập chương trình đào tạo;`, `if (Còn chỗ?) then (có)`, `:Nhân viên ghi danh;`, `:Hoàn thành + khảo sát;`, `else (hết)`, `:Chặn ghi danh;`, `endif`, `:Khiếu nại OPEN -> xử lý -> RESOLVED;`, `stop`],
    UC40: [`start`, `:Quét đối chiếu ngày hưởng bậc;`, `if (Đủ 36/24 tháng giữ bậc?) then (có)`, `:Sinh danh sách đề nghị nâng bậc;`, `if (ADMIN duyệt?) then (có)`, `:Cập nhật ngạch/bậc/hệ số;`, `:Ghi diễn biến tiền lương;`, `else (chưa)`, `:Giữ chờ kỳ sau;`, `endif`, `else (chưa)`, `:Không phát sinh;`, `endif`, `stop`],
    UC41: [`start`, `:Chọn nhân viên / loại biểu mẫu;`, `:Tổng hợp 111 thuộc tính + 8 bảng quá trình;`, `alt SYLL 2C`, `:Xuất PDF 4 trang Mẫu 2C-BNV/2008;`, `else Biểu thống kê`, `:Xuất Biểu 01/02/03 Excel;`, `endif`, `stop`],
    UC42: [`start`, `:Soạn bài trong Space;`, `:Lưu DRAFT;`, `:Trình duyệt -> PENDING_REVIEW;`, `if (Duyệt?) then (có)`, `:PUBLISHED;`, `else (yêu cầu chỉnh sửa)`, `:Về DRAFT kèm ý kiến;`, `endif`, `:Sửa bài sinh phiên bản mới bất biến;`, `stop`],
    UC43: [`start`, `:Nhập từ khóa;`, `:Truy vấn FTS + pg_trgm lọc phạm vi quyền;`, `:Trả kết quả có highlight;`, `:Tra cứu directory chuyên gia;`, `stop`],
    UC46: [`start`, `:Nhập tiêu chí tra cứu;`, `:Đọc AuditLog append-only;`, `:Chỉnh tham số key-value;`, `:Ghi vết thay đổi;`, `stop`],
UC44:[`start`, `:Nhân viên mới nhận lộ trình đọc theo vị trí;`, `repeat`, `:Hoàn thành từng bài đọc bắt buộc;`, `repeat while (Còn bài?) is (có)`, `:Hội nhập hoàn tất;`, `if (Đơn thôi việc được duyệt?) then (có)`, `:Tự sinh checklist bàn giao 5 mục;`, `repeat`, `:Các bên xác nhận từng mục;`, `repeat while (Chưa đủ 5/5?) is (thiếu)`, `:Đóng checklist, lưu trữ hồ sơ;`, `else (không)`, `:Tiếp tục làm việc;`, `endif`, `stop`],
};
export const CRUD_ACT = ['Mở trang quản lý', 'Tìm kiếm / lọc dữ liệu', 'alt Thêm / Sửa / Xóa', 'Nhập dữ liệu trên form', 'Hệ thống validate DTO', 'Lưu qua service + ghi AuditLog', 'Làm mới danh sách', 'end alt'];
export const READ_ACT = ['Mở trang', 'Truy vấn theo phạm vi quyền', 'Hiển thị dữ liệu'];

export const STATES = [
    ['Vòng đời Nhân viên (User.employmentStatus)', `[*] --> PROBATION : ký HĐ thử việc\nPROBATION --> ACTIVE : đánh giá đạt + xếp lương\nPROBATION --> [*] : dừng thử việc\nACTIVE --> ACTIVE : thăng chức / điều chuyển / thưởng - phạt\nACTIVE --> RESIGNED : thôi việc (đủ checklist 5 mục)\nACTIVE --> RETIRED : đủ tuổi\nRESIGNED --> [*] : lưu trữ bất biến\nRETIRED --> [*] : lưu trữ bất biến`],
    ['Phiếu tuyển dụng (JobRequisition)', `[*] --> DRAFT\nDRAFT --> PENDING_REVIEW : trình\nPENDING_REVIEW --> APPROVED : Giám đốc ký\nPENDING_REVIEW --> REJECTED : từ chối\nAPPROVED --> CLOSED : hết chỉ tiêu\nREJECTED --> [*]`],
    ['Đơn nghỉ phép (LeaveRequest)', `[*] --> PENDING : gửi (kiểm quỹ)\nPENDING --> APPROVED : duyệt, trừ quỹ NGAY\nPENDING --> REJECTED : từ chối\nPENDING --> CANCELLED : hủy\nAPPROVED --> [*]`],
    ['Đơn làm thêm giờ (OvertimeRequest)', `[*] --> PENDING : đăng ký\nPENDING --> APPROVED : duyệt (mới tính tiền)\nPENDING --> REJECTED : từ chối\nAPPROVED --> [*] : nạp bảng lương`],
    ['Kỳ lương (PayrollPeriod)', `[*] --> OPEN\nOPEN --> CALCULATED : tính\nCALCULATED --> REVIEWED : đối chiếu\nREVIEWED --> LOCKED : ADMIN khóa (chặn 409)\nLOCKED --> [*] : bất biến`],
    ['Khoản vay phúc lợi (HrmsEmployeeLoan)', `[*] --> PENDING : tạo đơn (EMI <= 30% net)\nPENDING --> APPROVED : giải ngân\nPENDING --> REJECTED : từ chối\nAPPROVED --> SETTLED : trả hết EMI\nSETTLED --> [*]`],
    ['Tài sản (HrmsAssetAllocation)', `[*] --> IN_STOCK : nhập kho\nIN_STOCK --> ALLOCATED : cấp phát + biên bản\nALLOCATED --> IN_STOCK : thu hồi\nALLOCATED --> MAINTENANCE : bảo trì\nIN_STOCK --> DECOMMISSIONED : thanh lý\nDECOMMISSIONED --> [*]`],
    ['Công tác phí (HrmsExpenseClaim)', `[*] --> DRAFT : đề xuất chuyến\nDRAFT --> SUBMITTED : trình duyệt\nSUBMITTED --> ADVANCED : tạm ứng\nADVANCED --> SETTLED : quyết toán chứng từ\nSETTLED --> [*]`],
    ['Giải trình giờ công (HrmsAttendanceRegularization)', `[*] --> PENDING : nhân viên gửi\nPENDING --> APPROVED : duyệt, bù công\nPENDING --> REJECTED : từ chối\nAPPROVED --> [*]`],
    ['Bài viết tri thức (Article)', `[*] --> DRAFT : soạn\nDRAFT --> PENDING_REVIEW : trình\nPENDING_REVIEW --> PUBLISHED : duyệt\nPENDING_REVIEW --> DRAFT : yêu cầu chỉnh sửa\nPUBLISHED --> ARCHIVED : lưu trữ\nARCHIVED --> PUBLISHED : khôi phục`],
    ['Khiếu nại (HrmsGrievance)', `[*] --> OPEN : nhân viên gửi\nOPEN --> IN_PROGRESS : HR tiếp nhận\nIN_PROGRESS --> RESOLVED : giải quyết\nRESOLVED --> [*]`],
    ['Checklist bàn giao (HandoverChecklist)', `[*] --> OPEN : duyệt thôi việc tự sinh\nOPEN --> OPEN : từng mục DONE (5 mục)\nOPEN --> CLOSED : đủ 5/5 xác nhận\nCLOSED --> [*] : đóng hồ sơ`],
];

export const FLOWS = [
    ['Luồng Tuyển dụng đến Ngày nhận việc', `@startuml\nskinparam linetype ortho\nstart\n:Trưởng dự án lập phiếu đề xuất;\n:HR thẩm định + Kế toán xác nhận quỹ;\n:Giám đốc duyệt chỉ tiêu;\n:Đăng tin đa kênh - tiếp nhận ứng viên;\n:Kéo-thả pipeline Sàng lọc -> PV1 -> PV2 -> Offer;\nif (Nhận việc?) then (có)\n  :Chuyển thành nhân viên;\n  fork\n    :Tổ hồ sơ: giấy tờ gốc + HĐ thử việc;\n  fork again\n    :IT: cấp email/Git/VPN;\n  fork again\n    :Hành chính: chỗ ngồi + laptop;\n  end fork\n  :Lộ trình hội nhập bắt đầu;\nelse (rớt)\n  :Lưu REJECTED;\nendif\nstop\n@enduml`],
    ['Luồng Chấm công đến Tiền lương', `@startuml\nskinparam linetype ortho\nstart\nfork\n  :Web;\nfork again\n  :QR kiosk (token HMAC 30 giây);\nfork again\n  :Khuôn mặt (AES-256-GCM);\nfork again\n  :Webhook HMAC / CSV;\nend fork\n:Sự kiện thô append-only;\n:Tổng hợp bảng công ngày;\n:Cộng OT đã duyệt - trừ phép đã duyệt;\n:Tính gross -> BHXH 10,5% -> thuế TNCN 7 bậc -> EMI;\n:Sinh phiếu lương;\n:Đối chiếu -> ADMIN khóa LOCKED (409);\n:Phiếu lương điện tử + bảng kê ngân hàng;\nstop\n@enduml`],
    ['Luồng Thôi việc', `@startuml\nskinparam linetype ortho\nstart\n:Nhân viên nộp đơn (báo trước 30/45 ngày);\n:ADMIN duyệt;\n:Tự sinh checklist 5 mục;\nfork\n  :Trưởng DA: bàn giao việc;\nfork again\n  :Hành chính: thu hồi tài sản;\nfork again\n  :IT: thu hồi tài khoản;\nfork again\n  :Kế toán: quyết toán;\nfork again\n  :Xóa mẫu khuôn mặt;\nend fork\nif (Đủ 5/5?) then (có)\n  :Phát hành quyết định chấm dứt HĐ;\n  :Hồ sơ lưu trữ bất biến;\nelse (chưa)\n  :Chờ các bên xác nhận;\nendif\nstop\n@enduml`],
    ['Luồng Xuất bản tri thức', `@startuml\nskinparam linetype ortho\nstart\n:Tác giả soạn bài trong Space;\n:Lưu DRAFT (Markdown + đính kèm);\n:Trình duyệt -> PENDING_REVIEW;\nif (Quản lý Space duyệt?) then (có)\n  :PUBLISHED (tìm thấy bằng FTS);\nelse (yêu cầu chỉnh sửa)\n  :Về DRAFT kèm ý kiến;\nendif\n:Sửa bài = phiên bản mới bất biến;\n:Bình luận hỏi đáp + đánh giá hữu ích;\nstop\n@enduml`],
];

export const CLS = {
    A: { b: ['AdminUsersPage (UC02)', 'AdminOrgUnitsPage (UC03)', 'LoginPage (UC01)'], c: ['UsersService (UC02): create(), lock(), assignRole()', 'OrgUnitsService (UC03): add(), move(), remove()', 'AuthService (UC01): login(), refresh(), logoutAll()'], e: ['User (UC01/02/09)', 'Role - UserRole (UC02)', 'RefreshToken (UC01)', 'OrgUnit (UC03)'] },
    B: { b: ['AtsPage (UC04-08)'], c: ['RecruitmentService (UC04-08): submit(), review(), approve(), createOffer()'], e: ['JobRequisition (UC04-06)', 'Candidate (UC07)', 'HrmsJobOffer (UC08)'] },
    C: { b: ['EmployeesPage (UC09-11)', 'LifecyclePage (UC13)'], c: ['EmployeesService (UC09-11)', 'HrmsLifecycleService (UC13)'], e: ['User (UC09)', 'Contract (UC10)', 'Certificate (UC11)', 'HrmsLifecycleEvent (UC13)'] },
    D: { b: ['PersonnelPage (UC14-17)'], c: ['PersonnelActionsService (UC14-17): submit(), approve() sinh HandoverChecklist'], e: ['PersonnelAction (UC14-16)', 'HandoverChecklist - HandoverItem (UC17)'] },
    E: { b: ['AttendancePage (UC18/21/26/27)', 'OvertimePage (UC19)', 'LeavePage (UC20)'], c: ['AttendanceService (UC18/21)', 'QrTokenService (UC26)', 'FaceCryptoService (UC27)', 'OvertimeService (UC19)', 'LeaveService (UC20): checkBalance(), approve() trừ NGAY'], e: ['AttendanceEvent (UC18/26/27)', 'AttendanceDay (UC18/21)', 'FaceEmbedding (UC27)', 'OvertimeRequest (UC19)', 'LeaveRequest - LeaveBalance (UC20)'] },
    F: { b: ['PayrollEnginePage (UC22)', 'PayrollPage (UC23/24)', 'EssPage (UC25)'], c: ['HrmsPayrollService (UC22)', 'PayrollService (UC23/24): calculate(), lock() chặn 409'], e: ['HrmsSalaryComponent - Structure (UC22)', 'PayrollPeriod - Payslip (UC23/24)', 'LeaveBalance - Payslip (UC25)'] },
    G: { b: ['EssPage (UC28/29)', 'ShiftsPage (UC30)'], c: ['DashboardService (UC28)', 'HrmsRegularizationService (UC29)', 'HrmsShiftsService (UC30)'], e: ['LeaveBalance - Payslip - HrmsAssetAllocation (UC28)', 'HrmsAttendanceRegularization (UC29)', 'HrmsShiftType - Assignment (UC30)'] },
    H: { b: ['PayrollEnginePage (UC31)', 'LoansPage (UC32)', 'ExpenseClaimsPage (UC33)', 'AssetsPage (UC34)'], c: ['HrmsPayrollService (UC31): runOneClick()', 'HrmsLoansService (UC32): kiem EMI <= 30% net', 'HrmsExpensesService (UC33)', 'HrmsAssetsService (UC34)'], e: ['HrmsPayrollRun - Slip (UC31)', 'HrmsEmployeeLoan (UC32)', 'HrmsTravelRequest - ExpenseClaim (UC33)', 'HrmsAssetAllocation (UC34)'] },
    I: { b: ['RecruitmentAtsPage (UC35)', 'Performance360Page (UC36)', 'TrainingGrievancePage (UC37)'], c: ['HrmsRecruitmentService (UC35): convertToEmployee()', 'HrmsPerformanceService (UC36)', 'HrmsTrainingService (UC37)'], e: ['HrmsJobOpening - Applicant - InterviewRound - Offer (UC35)', 'HrmsAppraisalCycle - Goal - Review (UC36)', 'HrmsTrainingProgram - Feedback - Grievance (UC37)'] },
    J: { b: ['PersonnelProfilesPage (UC38)', 'SalaryRanksPage (UC39)', 'SalaryProgressionPage (UC40)', 'PersonnelReportsPage (UC41)'], c: ['PersonnelProfilesService (UC38)', 'PersonnelRanksService (UC39)', 'PersonnelReportsService (UC40/41): scanProgression(), export2cPdf(), bieu01-03()'], e: ['PersonnelComprehensiveProfile + 8 bang qua trinh (UC38/41)', 'PersonnelRank (UC39/40)', 'PersonnelSalaryHistory (UC40)'] },
    K: { b: ['SpacesPage - ArticlePage (UC42)', 'SearchPage - PeoplePage (UC43)'], c: ['ArticlesService (UC42): submit(), review(), update() sinh version', 'SearchService (UC43): FTS + pg_trgm', 'PeopleService (UC43)'], e: ['Space - SpaceMember (UC42)', 'Article - ArticleVersion - ArticleReview (UC42)', 'Comment - Reaction (UC42)'] },
    L: { b: ['DashboardPage (UC45)', 'AdminAuditPage - AdminSettingsPage (UC46)'], c: ['DashboardService (UC45)', 'AuditService (UC46)', 'SettingsService (UC46)'], e: ['User - PayrollRun - PersonnelAction (UC45)', 'AuditLog (UC46)', 'Setting (UC46)'] },
};
