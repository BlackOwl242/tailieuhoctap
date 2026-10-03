from pathlib import Path
from hashlib import sha256
import json
root=Path(__file__).resolve().parents[1]
qa=root/'05_Doi_chieu'
render=qa/'Bo_sung_20261002/ban_ban_giao'
checks=json.loads((qa/'ket_qua_kiem_tra.json').read_text(encoding='utf-8'))
review=json.loads((render/'kiem_tra_truc_quan.json').read_text(encoding='utf-8'))
assert all(x['passed'] for x in checks['checks'])
assert review['pages_reviewed']==list(range(1,checks['pages']+1))
assert review['issues_remaining']==[]
def sha(p):return sha256(p.read_bytes()).hexdigest()
docx=root/'04_Bao_cao/Bao_cao_nghien_cuu_he_thong_hanh_chinh_Ha_Noi.docx'
ref=root.parents[1]/'Công nghệ phần mềm/Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx'
pages=checks['pages'];count=len(checks['checks']);tables=checks['tables'];figs=checks['figures']
report=f'''# Biên bản đối chiếu bản bổ sung ngày 02/10/2026

Bản bàn giao có {pages} trang, hai bìa, bảy chương, tài liệu tham khảo và phụ lục. Có {tables-1} bảng đánh số, một bảng viết tắt và {figs} hình, trong đó có một ảnh giao diện lịch sử có nguồn. Bộ thiết kế gồm 35 thực thể, 17 thao tác giao tiếp tham chiếu và 95 kịch bản kiểm thử chưa thực hiện. Báo cáo sử dụng 31 tài liệu tham khảo.

Đã sửa GVHD thành Hoàng Minh Ngọc và chỉ giữ sinh viên Lê Quóc Huy, mã 2305HTTB011, theo yêu cầu. Cập nhật cả thuộc tính tác giả, lời cảm ơn và lời cam đoan. Những dòng sinh viên khác được để trống để giữ nhịp bố cục bìa của mẫu.

## Kiểm tra định dạng và cấu trúc

Đạt {count}/{count} tiêu chí tự động, không có tiêu chí thất bại. Đã kiểm tra nguyên trạng tài liệu mẫu, hai phần tài liệu, khổ trang và lề, kiểu đoạn, cấp tiêu đề, mục lục hai cấp, danh mục bảng và hình, viền bảng, lề ô, hàng tiêu đề lặp, hàng không bị chia và độ rộng bảng. Định nghĩa kiểu chữ, đánh số, phông chữ, chủ đề, đầu trang và chân trang được bảo toàn từ mẫu. Chú thích bảng và hình dùng định dạng nhân bản từ mẫu; tỷ lệ cột được điều chỉnh trong độ rộng trang theo nội dung.

Tài liệu tham chiếu: `Công nghệ phần mềm/Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx`. SHA256: `{sha(ref)}`.

Bản Word bàn giao: `04_Bao_cao/Bao_cao_nghien_cuu_he_thong_hanh_chinh_Ha_Noi.docx`. SHA256: `{sha(docx)}`.

Bản kết xuất kiểm tra: `05_Doi_chieu/Bo_sung_20261002/ban_ban_giao/bao_cao.pdf`. SHA256: `{sha(render/'bao_cao.pdf')}`.

Mục lục chỉ gồm cấp một và hai, tiêu đề cấp ba nghiêng không đậm, không dùng cấp bốn, theo ràng buộc đã tiếp nhận. Dòng trang trí có dấu gạch kép bị bỏ chữ nhưng giữ đoạn. Tên đề tài và thông tin tác giả thay theo yêu cầu. Số trang và tỷ lệ cột phụ thuộc nội dung mới; kết quả đối chiếu không có nghĩa hai tài liệu giống từng điểm ảnh.

## Kiểm tra trực quan

Đã xem đầy đủ {pages} trang của bản kết xuất cuối ở kích thước đọc được, gồm bìa, mục lục, danh mục, đoạn văn, bảng kéo dài, từ điển, sơ đồ và tài liệu tham khảo. Đã đối chiếu bìa và các loại bố cục với bản mẫu đã kết xuất. Không còn vấn đề quan sát được về chữ tràn lề, chữ bị cắt, nhãn hình chồng lấn, chú thích tách khỏi hình hoặc trang trắng. Hàng tiêu đề được lặp khi bảng qua trang. Trang cuối mục có thể ngắn theo lượng nội dung và ngắt chương.

Trình kết xuất đi kèm không chạy vì thiếu LibreOffice; sử dụng Microsoft Word có sẵn để cập nhật trường và xuất PDF, rồi tạo ảnh bằng pypdfium2. Bản cuối được kết xuất chỉ đọc sau khi bảo toàn thành phần mẫu. Danh sách trang đã xem và mã kiểm tra ảnh nằm trong thư mục bản kết xuất cuối.

## Kiểm tra chiều sâu và độ tin cậy

Nguồn chính thức xác nhận vận hành từ 11/04/2023; hướng dẫn công dân năm 2023 có giao diện thực; tập huấn ngày 17/09/2026 xác nhận tiếp tục sử dụng hệ thống Thành phố. Phạm vi được mở rộng từ một nhánh hộ tịch sang chín nhóm, 31 chức năng và hai mươi khía cạnh, có ma trận khoảng trống chứng cứ ở mục 7.7. Quy trình cấp bản sao từ sổ gốc theo Quyết định 663 được phân tích riêng, không đồng nhất với trích lục hộ tịch. Ranh giới với hệ thống bộ được đối chiếu chỉ đạo năm 2026.

Đã phân biệt số liệu công bố, mục tiêu kế hoạch và phép tính minh họa. Luật Hộ tịch 03/2026/QH16 được ghi là có hiệu lực từ 01/03/2027. Các căn cứ dữ liệu cá nhân, an ninh mạng và lưu trữ được bổ sung theo mốc nghiên cứu. Chín nhóm chức năng là khung đối chiếu pháp lý, không phải chứng nhận mọi tính năng đã được kiểm tra trên hệ thống hiện hữu.

Kiến trúc bên trong, lược đồ dữ liệu và giao tiếp là thiết kế đề xuất. Chưa có đặc tả nội bộ, hợp đồng giao tiếp thực tế, nhật ký vận hành hoặc môi trường kiểm thử của Hà Nội. Cả 95 ca đều chưa thực hiện; kiểm tra tài liệu không thay thế kiểm thử phần mềm. Bàn giao gồm báo cáo và bản thiết kế, không có ứng dụng chạy.
'''
(qa/'Bien_ban_doi_chieu.md').write_text(report,encoding='utf-8')
overview=f'''# Hồ sơ nghiên cứu hệ thống thông tin giải quyết thủ tục hành chính Hà Nội

GVHD: Hoàng Minh Ngọc. Sinh viên: Lê Quóc Huy, 2305HTTB011. Bản bổ sung ngày 02/10/2026.

Đối tượng là hệ thống có thật, được xác nhận bằng nguồn vận hành năm 2023 và hoạt động sử dụng năm 2026. Báo cáo phân tích chín nhóm, 31 chức năng và hai mươi khía cạnh của vòng đời, với hai trường hợp nghiệp vụ hộ tịch và chứng thực. Phân biệt hiện trạng có nguồn, yêu cầu theo quy định và thiết kế đề xuất.

## Cách đọc

* `01_Nguon_tham_khao`: nguồn công khai, bản tải, văn bản trích và danh mục dấu kiểm tra; nguồn mới nằm trong `Bo_sung_2026`.
* `02_Noi_dung`: bảy chương, tài liệu tham khảo và phụ lục.
* `03_Thiet_ke`: 35 thực thể dữ liệu, lược đồ dữ liệu, 17 thao tác giao tiếp đề xuất, 95 ca chưa thực hiện, 21 sơ đồ chỉnh sửa được và một ảnh giao diện lịch sử.
* `04_Bao_cao`: bản Word bàn giao và nội dung tổng hợp để đọc.
* `05_Doi_chieu`: biên bản và kết quả kiểm tra. Bản kết xuất cuối của lần bổ sung nằm trong `Bo_sung_20261002/ban_ban_giao`; các lần trước được giữ để đối chiếu.
* `06_Cong_cu`: công cụ tạo và kiểm tra tài liệu. Lần bổ sung dùng `tao_bo_sung_thiet_ke.py`, `tao_bao_cao.py`, `xuat_kiem_tra.ps1`, `bao_toan_mau.py`, `kiem_tra_bao_cao.py`, `ghi_nhan_bo_sung.py`. Công cụ ghi nhận bàn giao cũ thuộc lần trước.

Bản Word có {pages} trang, {tables-1} bảng đánh số, một bảng viết tắt và {figs} hình. Đạt {count}/{count} tiêu chí tự động; đã xem từng trang bản kết xuất cuối. Xem [biên bản đối chiếu](05_Doi_chieu/Bien_ban_doi_chieu.md) để biết phạm vi và giới hạn kiểm tra.

Nghiên cứu chưa tiếp cận kỹ thuật nội bộ hoặc thực hiện bộ thử trên hệ thống vận hành. Kiến trúc, dữ liệu và giao tiếp được ghi rõ là đề xuất. Không có phần mềm chạy trong phạm vi bàn giao.
'''
(root/'README.md').write_text(overview,encoding='utf-8')
manifest=[]
for name in ['01_Nguon_tham_khao','02_Noi_dung','03_Thiet_ke','04_Bao_cao','06_Cong_cu']:
 for p in sorted((root/name).rglob('*')):
  if p.is_file() and '__pycache__' not in p.parts:manifest.append({'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)})
(qa/'manifest_ban_giao.json').write_text(json.dumps({'date':'2026-10-02','files':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pages':pages,'checks':count,'docx_sha256':sha(docx)},ensure_ascii=False))
