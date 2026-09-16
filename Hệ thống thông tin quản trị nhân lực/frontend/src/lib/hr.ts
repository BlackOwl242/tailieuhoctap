/**
 * Nhãn nghiệp vụ HR dùng chung toàn hệ thống (Mục 5 — chuẩn hóa thuật ngữ).
 * Mọi trang map trạng thái qua đây để bảo đảm nhất quán thuật ngữ.
 */

export const EMPLOYMENT_STATUS_LABEL: Record<string, string> = {
  PROBATION: 'Thử việc',
  ACTIVE: 'Chính thức',
  RESIGNED: 'Đã thôi việc',
  RETIRED: 'Nghỉ hưu',
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
};

export const LEAVE_TYPE_LABEL: Record<string, string> = {
  ANNUAL: 'Phép năm',
  SICK: 'Nghỉ ốm',
  UNPAID: 'Không lương',
  MATERNITY: 'Thai sản',
};

export const PAYROLL_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Mở kỳ',
  CALCULATED: 'Đã tính',
  REVIEWED: 'Đã đối chiếu',
  LOCKED: 'Đã khóa',
};

export const REQUISITION_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING_REVIEW: 'Chờ thẩm định',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  CLOSED: 'Đã đóng',
};

export const CANDIDATE_STAGE_LABEL: Record<string, string> = {
  NEW: 'Nhận hồ sơ',
  SCREENING: 'Sàng lọc',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Thư mời',
  HIRED: 'Đã nhận việc',
  REJECTED: 'Loại',
};

export const ACTION_TYPE_LABEL: Record<string, string> = {
  TRANSFER: 'Thuyên chuyển · Điều động · Luân chuyển',
  SALARY_ADJUST: 'Điều chỉnh lương · Nâng ngạch bậc',
  AWARD: 'Khen thưởng · Biểu dương',
  DISCIPLINE: 'Kỷ luật · Bãi nhiệm · Cách chức',
  RESIGNATION: 'Thôi việc · Nghỉ hưu · Miễn nhiệm',
};

export const PERF_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  ACKNOWLEDGED: 'Đã xác nhận',
};

export const COURSE_STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Sắp khai giảng',
  ONGOING: 'Đang diễn ra',
  DONE: 'Đã kết thúc',
};

export const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  ENROLLED: 'Đã ghi danh',
  COMPLETED: 'Đã hoàn thành',
  DROPPED: 'Đã rút khỏi khóa',
};

export const DOCUMENT_CATEGORY_LABEL: Record<string, string> = {
  POLICY: 'Chính sách',
  FORM: 'Biểu mẫu',
  DECISION: 'Quyết định',
  PROCESS: 'Quy trình',
  REPORT: 'Báo cáo',
  OTHER: 'Khác',
};

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  PROBATION: 'Thử việc',
  FIXED_TERM: 'Xác định thời hạn',
  INDEFINITE: 'Không xác định thời hạn',
  INTERNSHIP: 'Thực tập',
};

export const CONTRACT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Chấm dứt',
};

/** Badge màu theo trạng thái đơn (PENDING/APPROVED/REJECTED/CANCELLED). */
export const REQUEST_STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/20 border',
  APPROVED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 border',
  REJECTED: 'bg-rose-500/10 text-rose-700 border-rose-500/20 border',
  CANCELLED: 'bg-muted text-muted-foreground border-border border',
};

/** Định dạng tiền Việt Nam đồng gọn gàng. */
export function vnd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}
