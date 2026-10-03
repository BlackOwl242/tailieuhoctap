from pathlib import Path
import hashlib, json, zipfile
from noi_dung_ro_nghia import DATA, ROOT
from dung_lai_bieu_do_20261003 import activity

Q=ROOT/'05_Doi_chieu/Bien_tap_lai_20261003'
snap={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (Q/'Trang').glob('trang_*.png')}
(Q/'Trang_truoc_sua_chi_tiet.json').write_text(json.dumps(snap),encoding='utf-8')
for u in DATA.values():
    activity(u)
mapping=json.loads((Q/'Bien_tap_noi_dung.json').read_text('utf-8'))['media']
doc=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
with zipfile.ZipFile(doc) as z:
    info=z.infolist()
    content={i.filename:z.read(i.filename) for i in info}
for media,asset in mapping.items():
    if asset.endswith('_hoat_dong'):
        content[media]=(ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'/f'{asset}.png').read_bytes()
temp=doc.with_suffix('.docx.tmp')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
    for i in info:
        z.writestr(i,content[i.filename])
temp.replace(doc)
print('Đã căn giữa nhãn điều kiện và thay hình trong Word.')
