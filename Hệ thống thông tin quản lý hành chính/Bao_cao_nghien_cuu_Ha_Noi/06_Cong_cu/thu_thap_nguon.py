from pathlib import Path
import urllib.request, hashlib, json, sys
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image, ImageDraw, ImageFont
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'01_Nguon_tham_khao'; OUT.mkdir(parents=True,exist_ok=True)
sources={
 'phuong_an_1811_2025':'https://datafiles.hanoi.gov.vn/gov-hni/6244/VanBan/2025/12/25/PAQDPVHCC-1811-2025.pdf',
 'thong_tu_03_2025':'https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/03-tb.signed.pdf',
 'nghi_dinh_367_2025':'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/367-ndcp.signed.pdf',
 'thong_bao_cong_ha_noi':'https://dichvucong.hanoi.gov.vn/',
 'quyet_dinh_1811':'https://vanban.hanoi.gov.vn/chi-tiet-van-ban/ve-viec-phe-duyet-phuong-an-tai-cau-truc-thu-tuc-hanh-chinh-cap-ban-sao-trich-luc-ho-tich-ban-sao-g-230492',
}
records=[]
for name,url in sources.items():
 try:
  with urllib.request.urlopen(url,timeout=40) as r: data=r.read(); status=r.status
  ext='.pdf' if data.startswith(b'%PDF') else '.html'
  p=OUT/(name+ext); p.write_bytes(data)
  if ext=='.pdf':
   d=PdfReader(p); (OUT/(name+'.txt')).write_text('\n'.join(x.extract_text() for x in d.pages),encoding='utf-8')
  records.append({'file':p.name,'url':url,'date':'2026-10-01','status':status,'sha256':hashlib.sha256(data).hexdigest()})
  print(name,len(data))
 except Exception as e:
  records.append({'url':url,'error':str(e)}); print(name,str(e))
(OUT/'nguon_da_luu.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')

def render_pdf(p,folder):
 folder.mkdir(parents=True,exist_ok=True)
 doc=pdfium.PdfDocument(str(p))
 for i,page in enumerate(doc):
  page.render(scale=1.4).to_pil().save(folder/f'page-{i+1:03}.png')
 for start in range(0,len(doc),12):
  canvas=Image.new('RGB',(1200,1440),'#d7d7d7'); dr=ImageDraw.Draw(canvas)
  for j in range(start,min(start+12,len(doc))):
   im=Image.open(folder/f'page-{j+1:03}.png'); im.thumbnail((285,435))
   x=((j-start)%4)*300+7; y=((j-start)//4)*480+24
   canvas.paste(im,(x,y)); dr.text((x,y-18),str(j+1),fill='black')
  canvas.save(folder/f'contact-{start+1:03}.png')
 print('rendered',len(doc),folder)
ref=ROOT/'05_Doi_chieu/mau_render/mau.pdf'
if ref.exists(): render_pdf(ref,ref.parent)
