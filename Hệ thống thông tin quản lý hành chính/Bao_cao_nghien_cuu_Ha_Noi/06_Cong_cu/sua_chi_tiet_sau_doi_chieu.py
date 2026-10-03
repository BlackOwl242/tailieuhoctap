from pathlib import Path
import json,zipfile,hashlib
from lxml import etree as E
import dung_lai_bieu_do_20261003 as draw
ROOT=Path(__file__).resolve().parents[1]
Q=ROOT/'05_Doi_chieu/Bien_tap_lai_20261003'
DOC=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
old_pages={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (Q/'Trang').glob('trang_*.png')}
(Q/'Trang_truoc_sua_chi_tiet.json').write_text(json.dumps(old_pages),encoding='utf-8')
for u in draw.DATA.values():draw.wireframe(u)
draw.activity(draw.DATA['UC20'])
draw.restyle_other_figures()
mapping=json.loads((Q/'Bien_tap_noi_dung.json').read_text('utf-8'))['media']
with zipfile.ZipFile(DOC) as z:parts={n:z.read(n) for n in z.namelist()}
for media,asset in mapping.items():
    parts[media]=(draw.FIG/(asset+'.png')).read_bytes()
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
xml=E.fromstring(parts['word/document.xml'])
old='Không có bước kết thúc không thể đến hoặc chuyển bước trái quyền'
new='Nhánh xử lý có đường đến bước kết thúc; người chuyển bước có đúng quyền.'
for t in xml.findall('.//{'+W+'}t'):
    if t.text and old in t.text:t.text=t.text.replace(old,new)
parts['word/document.xml']=E.tostring(xml,xml_declaration=True,encoding='UTF-8',standalone=True)
temp=DOC.with_suffix('.updated.docx')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
    for n,data in parts.items():z.writestr(n,data)
temp.replace(DOC)
for file in [ROOT/'03_Thiet_ke/Huong_doi_tuong/Danh_muc_ca_su_dung.json',ROOT/'03_Thiet_ke/Huong_doi_tuong/Noi_dung_Use_case_20261003.json']:
    s=file.read_text('utf-8');file.write_text(s.replace(old,new),encoding='utf-8')
(Q/'Hinh_sua_sau_doi_chieu.json').write_text(json.dumps(draw.AUDIT,ensure_ascii=False,indent=2),encoding='utf-8')
print('Đã sửa 36 nút thao tác, trình tự thông báo và khoảng cách nhãn trạng thái.')
