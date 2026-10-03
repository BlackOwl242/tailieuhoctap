from pathlib import Path
import json, hashlib, zipfile
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
Q = ROOT / '05_Doi_chieu/Bien_tap_lai_20261003'
prior = json.loads((Q/'Trang_truoc_sua_chi_tiet.json').read_text('utf-8'))
pages = sorted((Q/'Trang').glob('trang_*.png'))
changed = [p for p in pages if hashlib.sha256(p.read_bytes()).hexdigest() != prior.get(p.name)]
folder = Q/'Trang_sua_cuoi'
folder.mkdir(exist_ok=True)
for i in range(0, len(changed), 4):
    group = changed[i:i+4]
    imgs = [Image.open(p) for p in group]
    w,h = imgs[0].size
    contact = Image.new('RGB',(w*2,(h+30)*2),'#dddddd')
    draw = ImageDraw.Draw(contact)
    for j,(p,im) in enumerate(zip(group,imgs)):
        x=j%2*w; y=j//2*(h+30)
        draw.text((x+15,y+5),p.stem,fill='black')
        contact.paste(im,(x,y+30))
    contact.save(folder/f'bo_{i//4+1:02}.png')
doc = ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
mapping = json.loads((Q/'Bien_tap_noi_dung.json').read_text('utf-8'))['media']
with zipfile.ZipFile(doc) as z:
    mismatches = [name for name,asset in mapping.items() if z.read(name) != (ROOT/'03_Thiet_ke/Huong_doi_tuong/So_do'/f'{asset}.png').read_bytes()]
result = {'pages':len(pages),'changed':[int(p.stem.split('_')[1]) for p in changed], 'unchanged':len(pages)-len(changed), 'media_checked':len(mapping),'media_mismatches':mismatches}
(Q/'Trang_thay_doi_cuoi.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
