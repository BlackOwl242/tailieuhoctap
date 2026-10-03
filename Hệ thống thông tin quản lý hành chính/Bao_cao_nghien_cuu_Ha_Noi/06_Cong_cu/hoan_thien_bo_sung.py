from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'02_Noi_dung/01_Mo_dau_va_phuong_phap.md'
t=p.read_text(encoding='utf-8').replace('Phạm vi thời gian của việc rà soát nguồn là đến ngày 01/10/2026.','Phạm vi thời gian của việc rà soát nguồn là đến ngày 02/10/2026.')
t=t.replace('Phạm vi chuyên sâu của báo cáo là nhánh giải quyết tại Sở Tư pháp được nêu trong phương án, không đồng nhất với mọi phiên bản của thủ tục tại cấp xã.','Trường hợp hộ tịch được phân tích theo nhánh tại Sở Tư pháp trong phương án; một thủ tục chứng thực tại cấp xã được bổ sung để đối chiếu đặc điểm khác nhau giữa các lĩnh vực.')
p.write_text(t,encoding='utf-8')
p=root/'02_Noi_dung/07_Quan_tri_ket_luan.md'
t=p.read_text(encoding='utf-8').replace('Nguồn [1], [22]; cần xác nhận nhánh cấu hình đang dùng','Nguồn [2], [22]; cần xác nhận nhánh cấu hình đang dùng')
p.write_text(t,encoding='utf-8')

