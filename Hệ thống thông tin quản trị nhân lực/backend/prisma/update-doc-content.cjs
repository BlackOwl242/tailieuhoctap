/**
 * Bổ sung NỘI DUNG thực (contentMd) cho 4 tài liệu demo — để người dùng xem
 * và tải xuống được, không chỉ metadata. Idempotent. Chạy:
 *   node prisma/update-doc-content.cjs
 * (CONTENT được seed.cjs tái sử dụng khi cài mới.)
 */
const CONTENT = {
  'Nội quy lao động 2026': `# NỘI QUY LAO ĐỘNG 2026

## Điều 1. Thời gian làm việc
- Giờ làm việc chuẩn: **08:00 – 17:30**, nghỉ trưa 12:00 – 13:30, thứ Hai đến thứ Sáu.
- Làm thêm giờ phải được Trưởng dự án duyệt trước trên hệ thống; giờ chưa duyệt không được tính tiền (Điều 98 BLĐ 2019).

## Điều 2. Nghỉ phép năm
- Mỗi năm người lao động được hưởng **12 ngày phép làm việc**; tăng 1 ngày mỗi 5 năm công tác (Điều 65 BLĐ 2019).
- Đơn nghỉ phép nộp trên hệ thống tối thiểu **3 ngày làm việc** trước ngày nghỉ (trừ trường hợp ốm đột xuất có xác nhận y tế).
- Quỹ phép được trừ NGAY khi đơn được duyệt.

## Điều 3. Kỷ luật
- Mọi quyết định kỷ luật phải qua bước lấy ý kiến đại diện người lao động.
- Khấu trừ kỷ luật (nếu có) được nạp tự động vào kỳ lương kế tiếp.

## Điều 4. Chấm công
- Điểm danh đa kênh: kiosk mã QR, khuôn mặt, web, máy chấm công.
- Bản ghi thiếu giờ vào/ra đưa vào hàng đợi xử lý lệch; hiệu chỉnh phải có lý do và lưu vết.`,
  'Biểu mẫu Đơn xin nghỉ phép': `# ĐƠN XIN NGHỈ PHÉP

**Kính gửi:** Ban Tổ chức – Hành chính – Nhân sự

Tôi tên: ..................................................
Đơn vị: ..................... Chức danh: .....................
Loại phép: ☐ Phép năm  ☐ Nghỉ ốm  ☐ Không lương  ☐ Thai sản
Thời gian nghỉ: từ ngày ......../......../.......... đến ngày ......../......../..........
Số ngày làm việc: ............

**Lý do:** ..........................................................................................

Tôi cam kết đã bàn giao công việc trong thời gian nghỉ cho: ..................................................
Điện thoại liên hệ trong kỳ nghỉ: ............................

*Người làm đơn*                    *Ý kiến Trưởng đơn vị*          *Ý kiến Bộ phận Nhân sự*

> Lưu ý: biểu mẫu này dùng cho trường hợp nộp giấy; khuyến nghị tạo đơn trực tuyến tại mục **Nghỉ phép** để được kiểm quỹ tự động.`,
  'Quy trình tuyển dụng 9 bước': `# QUY TRÌNH TUYỂN DỤNG 9 BƯỚC

1. **Phát hiện thiếu hụt** — Trưởng dự án lập Phiếu đề xuất tuyển dụng (vị trí, số lượng, lý do, thời gian cần người).
2. **Thẩm định** — Ban TC–HC–NS đối chiếu định biên lao động và nội quy; nếu có người nội bộ phù hợp → gợi ý luân chuyển, dừng luồng.
3. **Xác nhận quỹ lương** — Phòng Tài chính – Kế toán xác nhận khả năng chi.
4. **Phê duyệt** — Ban Giám đốc ký duyệt từ xa (hoặc điều chỉnh/từ chối kèm ý kiến).
5. **Tuyển đa kênh** — Đăng tin website, LinkedIn, VietnamWorks, TopCV; tiếp nhận hồ sơ trực tuyến + trực tiếp nhập chung một nơi.
6. **Sàng lọc** — Nhân sự sơ loại hồ sơ, chuyển hồ sơ đạt cho Trưởng dự án.
7. **Phỏng vấn** — Vòng 1 chuyên môn kỹ thuật (Trưởng dự án); vòng 2 với vị trí cao cấp (lãnh đạo khối). Lưu phiếu đánh giá có điểm số.
8. **Thư mời & xếp lương** — Xếp lương theo thang bảng; vượt khung trình Giám đốc duyệt riêng.
9. **Hội nhập** — Ngày nhận việc: 3 bộ phận đồng loạt — Tổ hồ sơ (hồ sơ gốc) ∥ Hành chính (chỗ ngồi, máy tính) ∥ Trợ giúp kỹ thuật (tài khoản, quyền truy cập).`,
  'Quy trình bàn giao công việc khi thôi việc': `# QUY TRÌNH BÀN GIAO CÔNG VIỆC KHI THÔI VIỆC

## Nguyên tắc
Đơn thôi việc (báo trước **45 ngày** với hợp đồng không xác định thời hạn, **30 ngày** với hợp đồng xác định thời hạn) chỉ được phát hành Quyết định chấm dứt hợp đồng khi **ĐỦ 4 XÁC NHẬN** bắt buộc.

## Checklist 4 xác nhận
1. **Bàn giao công việc** — Trưởng dự án xác nhận đã bàn giao cho người tiếp nhận (mã nguồn, tài liệu, đầu việc).
2. **Thu hồi tài sản** — Tổ Hành chính xác nhận thu hồi máy tính, thẻ từ, tài sản văn phòng.
3. **Thu hồi tài khoản** — Trợ giúp kỹ thuật xác nhận thu hồi toàn bộ tài khoản email, mã nguồn, quyền truy cập dự án (yêu cầu sống còn của cam kết ISO/IEC 27001).
4. **Quyết toán** — Kế toán xác nhận quyết toán công – lương – bảo hiểm – thuế.

## Kèm theo
- Chuyển giao tri thức: tài liệu hóa quy trình đang phụ trách (gắn bài viết trong Cơ sở kiến thức).
- Xóa mẫu khuôn mặt đã đăng ký khỏi hệ thống điểm danh.
- Ngày làm việc cuối: tài khoản tự khóa lúc 23:59.`,
};

module.exports = { CONTENT };

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    for (const [title, contentMd] of Object.entries(CONTENT)) {
      const r = await prisma.hrDocument.updateMany({ where: { title }, data: { contentMd } });
      console.log(`${r.count > 0 ? 'Đã cập nhật' : 'KHÔNG tìm thấy'}: ${title}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exitCode = 1; });
