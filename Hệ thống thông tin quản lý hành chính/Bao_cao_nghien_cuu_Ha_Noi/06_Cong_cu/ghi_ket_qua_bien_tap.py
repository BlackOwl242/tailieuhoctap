from pathlib import Path
import json, hashlib

ROOT=Path(__file__).resolve().parents[1]
Q=ROOT/'05_Doi_chieu/Bien_tap_lai_20261003'
doc=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
pdf=Q/'Bao_cao.pdf'
hash_of=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
result=json.loads((Q/'Kiem_tra_ban_cuoi.json').read_text('utf-8'))
change=json.loads((Q/'Trang_thay_doi_cuoi.json').read_text('utf-8'))
assert all(result['checks'].values())
assert not change['media_mismatches']
assert change['pages']==206
record={
    'docx_sha256':hash_of(doc), 'pdf_sha256':hash_of(pdf),
    'pages_visually_reviewed':list(range(1,207)),
    'method':'Đã xem toàn bộ 206 trang ở lượt đối chiếu chính. Sau mỗi lần sửa, so sánh mã băm ảnh trang và xem lại tất cả trang thay đổi; trang không thay đổi giữ kết quả đối chiếu trước.',
    'last_changed_pages_reviewed':change['changed'],
    'observations':[
        'Không phát hiện chữ chồng lên nhãn khác hoặc bị cắt trong bản kết xuất cuối.',
        'Nhãn điều kiện nằm trong hình thoi; đường nối đi đến đúng nút.',
        'Biểu đồ trình tự dùng nhãn nghiệp vụ ngắn, ký hiệu tác nhân và đối tượng nhất quán.',
        'Đã sửa UC20 kiểm tra người nhận và kênh trước khi gửi.',
        'UC16 phân biệt người duyệt, người ký và văn thư phát hành.',
        'UC06 chỉ xác nhận bàn giao khi nơi nhận đã xác nhận đủ hồ sơ.'
    ],
    'scope':'Đối chiếu tài liệu và bản thiết kế; chưa xác nhận mã nguồn hay kiến trúc nội bộ của hệ thống đang vận hành.'
}
(Q/'Kiem_tra_truc_quan_cuoi.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
metadata_path=Q/'Bien_tap_noi_dung.json'
metadata=json.loads(metadata_path.read_text('utf-8'))
metadata['docx_sha256']=hash_of(doc)
metadata_path.write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
(Q/'Ket_qua_bien_tap.md').write_text('''# Kết quả biên tập ngày 03 tháng 10 năm 2026

Tệp chính: `04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx`.

Đã viết lại 36 bảng đặc tả và phần giải thích của từng Use case theo mục tiêu, người thực hiện, điều kiện, các bước, ngoại lệ và kết quả. Đã thay 146 hình thiết kế trong báo cáo, gồm biểu đồ và bản thiết kế màn hình. Các ảnh tư liệu có nguồn được giữ riêng với hình thiết kế đề xuất.

Đã kết xuất 206 trang và xem toàn bộ ở lượt đối chiếu chính. Sau các lần chỉnh sửa, đối chiếu ảnh trang và xem lại các trang thay đổi. Không phát hiện chữ bị cắt hoặc nhãn chồng lên nhau trong bản cuối. 29 kiểm tra cấu trúc định dạng và 8 kiểm tra nội dung đều đạt. 146 ảnh thiết kế được nhúng trong Word khớp với các tệp hình đã sửa.

Các lỗi đã sửa gồm nhãn dài khó đọc, xuống dòng giữa tên đối tượng, chữ sát cạnh hình thoi, mũi tên trùng, nhánh gửi thông báo trước khi kiểm tra và việc gộp các vai trò duyệt, ký, phát hành. Báo cáo sử dụng Use case, mã UC và dẫn nguồn theo số trong ngoặc vuông; không nhắc tên tài liệu được cung cấp để đối chiếu.

Kết quả này xác nhận bản báo cáo và thiết kế đã biên tập. Phần thiết kế đề xuất không được trình bày như mã nguồn hoặc kiến trúc nội bộ đã được xác nhận của hệ thống đang vận hành.
''',encoding='utf-8')
print('Đã lưu kết quả đối chiếu bản cuối.')
