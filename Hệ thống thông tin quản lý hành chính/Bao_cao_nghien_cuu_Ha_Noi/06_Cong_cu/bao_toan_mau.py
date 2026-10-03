from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parents[1]
reference=root.parents[1]/'Công nghệ phần mềm/Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx'
final=root/'04_Bao_cao/Bao_cao_nghien_cuu_he_thong_hanh_chinh_Ha_Noi.docx'
with ZipFile(reference) as source,ZipFile(final) as report:
 parts={n:report.read(n) for n in report.namelist()}
 preserved=[n for n in source.namelist() if n.startswith(('word/theme/','word/footer','word/header','word/numbering','word/styles','word/fontTable'))]
 for n in preserved:parts[n]=source.read(n)
temporary=final.with_suffix('.verified.docx')
with ZipFile(temporary,'w',ZIP_DEFLATED) as output:
 for n,data in parts.items():output.writestr(n,data)
temporary.replace(final)
print('Bảo toàn',len(preserved),'thành phần định dạng gốc; giữ nội dung và kết quả cập nhật mục lục.')
