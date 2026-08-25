/**
 * ============================================================================
 * BẢNG THUẬT NGỮ THỐNG NHẤT TOÀN HỆ THỐNG (Mục 2 — glossary)
 * ============================================================================
 * Nguyên tắc: mọi nhãn menu, nút bấm, thông báo PHẢI dùng thuật ngữ trong
 * bảng này. Cấm dùng từ dịch máy hoặc ghép từ sai tự nhiên ("Space tri thức",
 * "Quản lý tri thức"…). Khi thêm tính năng mới, tra cứu và bổ sung vào đây.
 *
 * | Thuật ngữ cũ (sai/khó hiểu)   | Thuật ngữ chuẩn                  | Ghi chú                          |
 * |-------------------------------|----------------------------------|----------------------------------|
 * | Space / Space tri thức        | Không gian / Không gian tri thức | Đơn vị lưu trữ tài liệu          |
 * | Quản lý tri thức (vai)        | Quản lý nội dung                 | Nhãn vai KM_MANAGER trên UI      |
 * | Hộp phê duyệt / Hộp duyệt     | Phê duyệt                        |                                  |
 * | Chuyên gia                    | Tìm chuyên gia                   | Trang tra cứu nhân sự theo môn   |
 * | Chuyển giao tri thức          | Bàn giao công việc               | Checklist nghỉ việc (UC17)       |
 * | Ống dẫn ứng viên (pipeline)   | Danh sách ứng viên               | Trạng thái ứng viên = "giai đoạn tuyển" |
 * | Thoát                         | Đăng xuất                        |                                  |
 * | Tìm kiếm tri thức             | Tìm kiếm                         |                                  |
 * | Kiosk điểm danh               | Kiosk điểm danh                  | Giữ nguyên — đúng ngữ cảnh       |
 * | Onboarding / Hội nhập         | Hội nhập                         |                                  |
 * | Handover                      | Bàn giao công việc               |                                  |
 */

/** Nhãn nhóm điều hướng sidebar. */
export const NAV_GROUP_LABELS = {
  hr: 'Nhân sự',
  recruitment: 'Tuyển dụng',
  knowledge: 'Cơ sở kiến thức',
  admin: 'Quản trị',
} as const;

/** Nhãn vai hiển thị trên UI (map từ roleCode). */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  KM_MANAGER: 'Quản lý nội dung',
  USER: 'Nhân viên',
};
