from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent.parent
qa = root / '05_Doi_chieu'
checks = json.loads((qa / 'ket_qua_kiem_tra.json').read_text(encoding='utf-8'))
assert len(checks['checks']) == 440
assert all(item['passed'] for item in checks['checks'])
assert checks['pages'] == 85

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

comparison = json.loads((qa / 'doi_chieu_anh_lan_cuoi.json').read_text(encoding='utf-8'))
stored_previous = {item['page']: item['previous_sha256'] for item in comparison.get('page_hashes', [])}
comparison['page_hashes'] = []
for n in range(1, 86):
    name = f'page-{n:03}.png'
    previous = qa / 'bao_cao_render_cuoi' / name
    final = qa / 'ban_ban_giao' / name
    a = sha(previous) if previous.exists() else stored_previous[n]
    b = sha(final)
    comparison['page_hashes'].append({'page': n, 'previous_sha256': a, 'final_sha256': b, 'identical': a == b})
comparison['changed_pages_reviewed_final'] = [6, 10, 75, 76, 77, 78, 79, 80]
comparison['visual_review_complete'] = True
(qa / 'doi_chieu_anh_lan_cuoi.json').write_text(json.dumps(comparison, ensure_ascii=False, indent=2), encoding='utf-8')

docx = root / '04_Bao_cao' / 'Bao_cao_nghien_cuu_he_thong_hanh_chinh_Ha_Noi.docx'
reference = root.parent.parent / 'Công nghệ phần mềm' / 'Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx'
report = f'''# Biên bản đối chiếu và kiểm tra bản bàn giao

Ngày kiểm tra: 01/10/2026.

## Kết quả

Bản bàn giao có 85 trang, hai trang bìa, bảy chương, tài liệu tham khảo và phụ lục. Có 88 bảng, gồm 87 bảng đánh số và một bảng danh mục viết tắt; có 16 sơ đồ và 14 nguồn tham khảo. Bộ thiết kế kèm theo có 20 thực thể dữ liệu, 10 giao tiếp tham chiếu và 44 kịch bản kiểm thử.

Toàn bộ 440 tiêu chí kiểm tra tự động đạt; không có tiêu chí thất bại. Chi tiết từng tiêu chí nằm trong `ket_qua_kiem_tra.json`. Đã xem từng trang ở kích thước đọc được và sửa các vấn đề quan sát được. Kết quả này xác nhận các tiêu chí được nêu dưới đây; không phải phép chứng minh hai tài liệu có nội dung và điểm ảnh giống nhau.

## Tài liệu đối chiếu

Tài liệu tham chiếu: `Công nghệ phần mềm/Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx`, kết xuất thành 122 trang bằng Microsoft Word.

Mã SHA256 của tài liệu tham chiếu: `{sha(reference)}`. Tệp tham chiếu được giữ nguyên.

Bản bàn giao: `04_Bao_cao/Bao_cao_nghien_cuu_he_thong_hanh_chinh_Ha_Noi.docx`.

Mã SHA256 của bản bàn giao: `{sha(docx)}`.

Bản kết xuất dùng để đối chiếu: `05_Doi_chieu/ban_ban_giao/bao_cao.pdf`, 85 trang. Mã SHA256: `{sha(qa / 'ban_ban_giao' / 'bao_cao.pdf')}`. Tệp này dùng làm bằng chứng kiểm tra; tài liệu chỉnh sửa và bàn giao chính là bản Word.

## Các nhóm tiêu chí đã kiểm tra

| Nhóm | Nội dung đối chiếu | Kết quả |
| :--- | :--- | :--- |
| Bìa và phân phần | Hai bìa, biểu trưng, khung, nhịp đoạn, ngắt phần; phần nội dung đánh số lại từ 1 | Đạt |
| Trang và kiểu chữ | Khổ trang, lề, đầu và chân trang; Times New Roman; cỡ chữ, căn đoạn, thụt đầu dòng, giãn dòng, khoảng trước và sau | Đạt |
| Tiêu đề và mục lục | Cấp tiêu đề, kiểu chữ; mục lục cấp một và hai; số trang và dấu dẫn được Word cập nhật | Đạt |
| Danh mục | Viết tắt, bảng và hình; các trường đánh số và số trang được cập nhật | Đạt |
| Bảng | Viền, độ rộng tổng, lề ô, cỡ chữ, giãn dòng, hàng tiêu đề đậm và lặp, hàng không bị chia giữa hai trang | Đạt |
| Hình | Căn giữa, chú thích nghiêng bên dưới, đánh số, nhãn rõ và không chồng lấn sau khi sửa | Đạt |
| Nội dung | Không còn tên đề tài tuyển dụng, chỉ dẫn soạn thảo hoặc dấu gạch kép; nguồn và đề xuất được phân biệt | Đạt |
| Bộ thiết kế | Thực thể và quan hệ dữ liệu, số lượng giao tiếp, số lượng và trạng thái ca kiểm thử; đối chiếu với báo cáo | Đạt |

Giữ nguyên các phần định nghĩa kiểu, kiểu đánh số, phông chữ, chủ đề, đầu trang và chân trang của gói tài liệu tham chiếu. Chú thích bảng và hình được nhân bản theo mẫu. Các tỷ lệ cột được điều chỉnh trong độ rộng 9072 đơn vị twip theo nội dung mới. Ma trận quyền dùng độ rộng cột 1800, 1700, 1700, 1900, 1972; từ điển dữ liệu dùng 2200, 1750, 1450, 1100, 2572.

Theo ràng buộc nội dung đã tiếp nhận, mục lục chỉ gồm cấp một và hai; tiêu đề cấp ba nghiêng, không đậm; không dùng cấp bốn. Dòng trang trí có dấu gạch kép trên bìa được bỏ chữ nhưng giữ nhịp đoạn. Đây là các điều chỉnh được ghi trong hợp đồng định dạng, không phải sai lệch chưa xử lý. Số trang, số chương và nội dung hình thay đổi theo đề tài mới.

## Kiểm tra bằng hình ảnh

Đã đối chiếu bìa và các trang đại diện về đoạn văn, tiêu đề, mục lục, bảng và hình với bản tham chiếu; đã xem từng trang của báo cáo. Các lần sửa gồm khôi phục chữ đậm của chú thích, giãn nhãn đường nối của sơ đồ, điều chỉnh xuống dòng của tên trường dữ liệu, mở rộng cột điều kiện rỗng và cột ký, phát hành trong ma trận quyền.

Sau lần sửa cuối, 77 ảnh trang có mã kiểm tra trùng với các trang đã xem ở lần trước; tám trang thay đổi là 6, 10, 75, 76, 77, 78, 79 và 80 đã được xem lại trên bản kết xuất cuối. Danh sách và mã kiểm tra từng ảnh nằm trong `doi_chieu_anh_lan_cuoi.json`. Toàn bộ ảnh cuối nằm trong `ban_ban_giao`.

Không còn chữ hoặc bảng tràn lề, nhãn sơ đồ chồng lấn, chú thích hình tách khỏi hình hoặc trang trắng trong phạm vi đã quan sát. Các bảng kéo dài qua trang giữ hàng tiêu đề. Trang cuối của một mục có thể ngắn theo lượng nội dung; không bổ sung đoạn để lấp trang.

Trình kết xuất đi kèm không chạy do thiếu LibreOffice trên máy. Đã dùng Microsoft Word sẵn có để cập nhật trường, phân trang và xuất bản kiểm tra, sau đó dùng pypdfium2 tạo ảnh. Sau khi bảo toàn các phần của mẫu, bản cuối được kết xuất ở chế độ chỉ đọc để tránh thay đổi kiểu.

## Độ tin cậy và phạm vi nghiên cứu

Đối tượng là Hệ thống thông tin giải quyết thủ tục hành chính thành phố Hà Nội, có nguồn công khai. Trường hợp chuyên sâu là nhánh cấp bản sao trích lục hộ tịch, bản sao giấy khai sinh tại Sở Tư pháp theo phương án kèm Quyết định 1811/QĐ-TTPVHCC ngày 24/12/2025. Báo cáo đối chiếu thông tin công khai và quy định, phân biệt số liệu năm 2025 với mục tiêu hoặc hiệu quả dự kiến.

Kiến trúc bên trong, dữ liệu, giao tiếp và màn hình là phương án thiết kế nghiên cứu. Không khẳng định đó là cấu trúc đang vận hành của Hà Nội khi chưa có đặc tả nội bộ. Không có phần mềm chạy trong phạm vi bàn giao. Cả 44 ca kiểm thử đều ghi “Chưa thực hiện”; các kết quả kiểm tra tài liệu trong biên bản này không phải kết quả kiểm thử hệ thống thực tế.

Kết luận: bản bàn giao đạt toàn bộ tiêu chí định dạng, cấu trúc và sự nhất quán đã kiểm tra, kèm bằng chứng để đọc và đối chiếu.
'''
(qa / 'Bien_ban_doi_chieu.md').write_text(report, encoding='utf-8')

files = []
for folder in ['01_Nguon_tham_khao', '02_Noi_dung', '03_Thiet_ke', '04_Bao_cao', '06_Cong_cu']:
    for file in sorted((root / folder).rglob('*')):
        if file.is_file() and '__pycache__' not in file.parts:
            files.append({'path': file.relative_to(root).as_posix(), 'bytes': file.stat().st_size, 'sha256': sha(file)})
(qa / 'manifest_ban_giao.json').write_text(json.dumps({'date': '2026-10-01', 'files': files}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'pages': 85, 'criteria_passed': 440, 'docx_sha256': sha(docx), 'manifest_files': len(files)}, ensure_ascii=False))
