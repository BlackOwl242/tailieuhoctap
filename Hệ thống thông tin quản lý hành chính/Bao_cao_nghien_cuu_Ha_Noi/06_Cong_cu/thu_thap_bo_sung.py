from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from lxml import html
from pypdf import PdfReader
import json, re, sys

root = Path(__file__).resolve().parent.parent
out = root / '01_Nguon_tham_khao' / 'Bo_sung_2026'
out.mkdir(exist_ok=True)
urls = {
 'cong_ha_noi_20261002':'https://dichvucong.hanoi.gov.vn/',
 'cong_quoc_gia_20261002':'https://dichvucong.gov.vn/',
 'tap_huan_20260917': 'https://ttpvhcc.hanoi.gov.vn/hoat-dong-cua-trung-tam/tap-huan-nang-cao-ky-nang-su-dung-chu-ky-so-2850260917173022161.htm',
 'chu_ky_20260930': 'https://ttpvhcc.hanoi.gov.vn/infographics/su-dung-chu-ky-so-dung-quy-trinh-bao-dam-ket-qua-dien-tu-chinh-xac-2850260930145931239.htm',
 'tt21_pdf': 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/3/21-ttbtttt.signed.pdf',
 'tt11_pdf': 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/11-bkhcn.pdf',
 'tt13_pdf': 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2023/9/13-bnv.pdf',
 'luat116_pdf': 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat116-2025.pdf',
 'nd356_pdf': 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf',
 'luat_ho_tich_moi': 'https://xaydungchinhsach.chinhphu.vn/toan-van-luat-ho-tich-so-03-2026-qh16-119260527163142286.htm',
 'so_hoa_2024': 'https://hanoi.gov.vn/tin-tuc-su-kien-noi-bat/ha-noi-huong-toi-xay-dung-chinh-quyen-so-chinh-quyen-phuc-vu-42862896.htm',
 'van_hanh_2023': 'https://thanglong.chinhphu.vn/hoan-thanh-25-25-dich-vu-cong-thiet-yeu-theo-dung-lo-trinh-de-an-06-10323070313374254.htm',
 'huong_dan_2025': 'https://hoangliet.hanoi.gov.vn/cai-cach-hanh-chinh/tai-lieu-huong-dan-su-dung-he-thong-thong-tin-giai-quyet-tthc-thanh-pho-ha-noi-danh-cho-cong-dan-2820250213135753619.htm',
 'huong_dan_2023': 'https://sqhx-hanoi.mediacdn.vn/documents/49866/0/_VB_1684301998055_VB_HDSD.pdf',
 'dieu_phoi_2026': 'https://hanoi.gov.vn/chi-dao-cua-ubnd-thanh-pho-ha-noi/thuc-hien-tthc-dich-vu-cong-truc-tuyen-lien-thong-dong-bo-hieu-qua-4260429145849633.htm',
 'ket_qua_2026': 'https://caicachhanhchinh.hanoi.gov.vn/tin-hoat-dong-cchc-thanh-pho-ha-noi/ha-noi-mot-so-ket-qua-noi-bat-trong-cong-tac-cai-cach-hanh-chinh-6-thang-dau-nam-2026-265826061915232893.htm',
 'ke_hoach_86': 'https://datafiles.hanoi.gov.vn/gov-hni/6249/VanBan/2026/3/6/KH-86-2026.pdf',
 'quy_trinh_663': 'https://datafiles.hanoi.gov.vn/gov-hni/6244/VanBan/2026/5/13/PLQDPVHCC-663-2026.pdf',
 'trung_tam': 'https://ttpvhcc.hanoi.gov.vn/',
 'tt21': 'https://vanban.chinhphu.vn/?classid=1&docid=209894&orggroupid=4&pageid=27160',
 'tt11': 'https://vanban.chinhphu.vn/?classid=1&docid=214528&pageid=27160&typegroupid=6',
 'nd356': 'https://vanban.chinhphu.vn/?classid=1&docid=216387&orggroupid=2&pageid=27160',
 'luat116': 'https://vanban.chinhphu.vn/?docid=216499&pageid=27160',
 'luat33': 'https://vanban.chinhphu.vn/?classid=1&docid=211191&orggroupid=1&pageid=27160',
 'tt13': 'https://vanban.chinhphu.vn/?classid=0&docid=208598&pageid=27160',
 'luat_ho_tich_2026': 'https://vanban.chinhphu.vn/he-thong-van-ban?classid=1&mode=1&typegroupid=3',
}
def get(item):
 name, url = item
 try:
  data = urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=35).read()
  ext = '.pdf' if data[:4] == b'%PDF' else '.html'
  file = out / (name + ext); file.write_bytes(data)
  links = []
  if ext == '.pdf':
   reader = PdfReader(file)
   text = '\n'.join(f'\nTRANG {i+1}\n' + (p.extract_text() or '') for i,p in enumerate(reader.pages))
  else:
   doc = html.fromstring(data)
   for x in doc.xpath('//script|//style'): x.getparent().remove(x)
   text = re.sub(r'[ \t]+',' ',doc.text_content())
   links = [(x.text_content().strip(), x.get('href')) for x in doc.xpath('//a[@href]') if re.search(r'\.pdf|hoan-thien-he-thong|huong-dan-su-dung|ho-tich',x.get('href',''), re.I)]
  (out / (name + '.txt')).write_text(text,encoding='utf-8')
  return {'name': name, 'url': url, 'file': file.name, 'bytes': len(data), 'sha256': sha256(data).hexdigest(), 'links': links, 'date': '2026-10-02'}
 except Exception as exc:
  return {'name': name,'url': url,'error': str(exc)}
selected = {k:v for k,v in urls.items() if not sys.argv[1:] or k in sys.argv[1:]}
with ThreadPoolExecutor(max_workers=5) as pool: results = list(pool.map(get,selected.items()))
catalog = out / 'danh_muc_nguon.json'
old = json.loads(catalog.read_text(encoding='utf-8')) if catalog.exists() else []
combined = [r for r in old if r['name'] not in selected] + results
catalog.write_text(json.dumps(combined,ensure_ascii=False,indent=2),encoding='utf-8')
for r in results: print(json.dumps(r,ensure_ascii=False))
