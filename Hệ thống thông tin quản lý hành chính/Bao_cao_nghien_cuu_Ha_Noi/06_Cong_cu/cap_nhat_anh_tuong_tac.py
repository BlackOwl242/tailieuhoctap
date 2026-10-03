from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile,ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'
before={sha256(p.read_bytes()).hexdigest():p for p in F.glob('UC*_trinh_tu.png')}
import ve_uml_hanoi
file=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
with ZipFile(file) as z:
 data={n:z.read(n) for n in z.namelist()};count=0
 for n,b in list(data.items()):
  h=sha256(b).hexdigest()
  if n.startswith('word/media/') and h in before:data[n]=before[h].read_bytes();count+=1
assert count==36,count
tmp=file.with_suffix('.images.docx')
with ZipFile(tmp,'w',ZIP_DEFLATED) as z:
 for n,b in data.items():z.writestr(n,b)
tmp.replace(file);print('Cập nhật',count,'ảnh; giữ nguyên kích thước, nội dung, trường và định dạng tài liệu.')
