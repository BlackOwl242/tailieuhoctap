from pathlib import Path
import json
from hashlib import sha256
from docx import Document
from docx.oxml.ns import qn
root=Path(__file__).resolve().parents[1]
qa=root/'05_Doi_chieu/Bo_sung_20261002/ban_ban_giao'
reviewed=[{'page':i,'sha256':sha256((qa/f'page-{i:03}.png').read_bytes()).hexdigest()} for i in range(1,25)]
(qa/'trang_da_xem_truoc_sua_nguon.json').write_text(json.dumps(reviewed,indent=2),encoding='utf-8')
old='Công ty Cổ phần FPT';new='Công ty TNHH Hệ thống thông tin FPT'
for folder in ['02_Noi_dung','04_Bao_cao']:
 for p in (root/folder).glob('*.md'):
  t=p.read_text(encoding='utf-8')
  if old in t:p.write_text(t.replace(old,new),encoding='utf-8')
p=root/'04_Bao_cao/Bao_cao_nghien_cuu_he_thong_hanh_chinh_Ha_Noi.docx'
d=Document(p);n=0
for para in d.paragraphs:
 if old in para.text:
  assert not list(para._p.iter(qn('w:instrText')))
  updated=para.text.replace(old,new)
  for r in para.runs:r.text=''
  para.runs[0].text=updated;n+=1
assert n==2,n
d.save(p)
print('Đã đối chiếu đúng tên đơn vị biên soạn trên trang bìa tài liệu nguồn.')
