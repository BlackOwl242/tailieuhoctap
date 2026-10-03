from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from hashlib import sha256
from collections import Counter
import json, re, shutil
from lxml import etree as E

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / '04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
Q = ROOT / '05_Doi_chieu/Gop_chuong_20261003'
Q.mkdir(exist_ok=True)
BASE = Q / 'Ban_truoc_gop.docx'
if not BASE.exists():
    shutil.copy2(DOC, BASE)
N = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
     'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
     'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
W = N['w']
def text(p):
    return ''.join(p.xpath('.//w:t/text()', namespaces=N))
def style(p):
    return p.find('w:pPr/w:pStyle', N).get('{'+W+'}val') if p.find('w:pPr/w:pStyle', N) is not None else ''
def replace_visible(p, old, new):
    nodes = p.xpath('.//w:t', namespaces=N)
    total = ''.join(n.text or '' for n in nodes)
    start = total.index(old)
    stop = start + len(old)
    pos = 0
    written = False
    for n in nodes:
        value = n.text or ''
        end = pos + len(value)
        if pos < stop and end > start:
            left = value[:max(0, start-pos)]
            right = value[max(0, stop-pos):] if end > stop else ''
            n.text = left + (new if not written else '') + right
            written = True
        pos = end
    assert written

with ZipFile(BASE) as z:
    infos = z.infolist()
    data = {i.filename:z.read(i.filename) for i in infos}
tree = E.fromstring(data['word/document.xml'])
body = tree.find('w:body', N)
children = list(body)
starts = {}
for i, p in enumerate(children):
    m = re.match(r'^CHƯƠNG (\d+)\.', text(p))
    if p.tag == '{'+W+'}p' and style(p) == 'Heading1' and m:
        starts[int(m[1])] = i
end = next(i for i in range(starts[7]+1,len(children)) if text(children[i]) == 'TÀI LIỆU THAM KHẢO')
assert set(starts) == set(range(1,8))
blocks = {n: children[starts[n]:starts.get(n+1,end)] for n in range(1,8)}
names = {
    1:'CHƯƠNG 1. TỔNG QUAN HỆ THỐNG VÀ KHẢO SÁT THỰC TẾ',
    2:'CHƯƠNG 2. PHÂN TÍCH NGHIỆP VỤ, TÁC NHÂN VÀ HƯỚNG DẪN SỬ DỤNG',
    3:'CHƯƠNG 3. THIẾT KẾ HƯỚNG ĐỐI TƯỢNG VÀ ĐẶC TẢ LẬP TRÌNH',
    4:'CHƯƠNG 4. TRIỂN KHAI, KIỂM THỬ, VẬN HÀNH VÀ QUẢN TRỊ',
}
groups = [(1,[1,2]), (2,[3,5]), (3,[4,6]), (4,[7])]
heading_map = {}
caption_map = {}
new_blocks = []
for new_chapter, old_chapters in groups:
    h = blocks[old_chapters[0]][0]
    replace_visible(h,text(h),names[new_chapter])
    new_blocks.append(h)
    section_count = 0
    counts = Counter()
    for old_chapter in old_chapters:
        for element in blocks[old_chapter][1:]:
            if element.tag == '{'+W+'}p':
                old_text = text(element)
                if style(element) == 'Heading2':
                    m = re.match(r'^(\d+\.\d+)\.',old_text)
                    assert m, old_text
                    section_count += 1
                    new_id = f'{new_chapter}.{section_count}'
                    heading_map[m[1]] = new_id
                    replace_visible(element,m[1]+'.',new_id+'.')
                m = re.match(r'^(Hình|Bảng) (\d+\.\d+):',old_text)
                if m and not element.xpath('.//w:tab',namespaces=N):
                    kind = m[1]
                    counts[kind] += 1
                    new_number = f'{new_chapter}.{counts[kind]}'
                    caption_map[kind+' '+m[2]] = kind+' '+new_number
                    ts = element.xpath('.//w:t',namespaces=N)
                    assert ts[0].text == f'{kind} {old_chapter}.',old_text
                    ts[0].text = f'{kind} {new_chapter}.'
                    instr = element.xpath('.//w:instrText',namespaces=N)
                    assert len(instr) == 1,old_text
                    instr[0].text = f' SEQ {kind} '+('\\r 1 ' if counts[kind] == 1 else '')
                    field = False
                    cached = False
                    for run in element.findall('w:r',N):
                        fc = run.find('w:fldChar',N)
                        if fc is not None:
                            typ = fc.get('{'+W+'}fldCharType')
                            if typ == 'separate': field = True
                            if typ == 'end': field = False
                        if field and run.find('w:t',N) is not None:
                            run.find('w:t',N).text = str(counts[kind]) if not cached else ''
                            cached = True
                    assert cached
            new_blocks.append(element)

# This reference points to the report; the references to 3.2 and 3.6 in the
# procedure tables refer to published procedure descriptions, so remain intact.
for element in new_blocks:
    for p in ([element] if element.tag == '{'+W+'}p' else element.xpath('.//w:p',namespaces=N)):
        if 'Tất cả ảnh của mục 2.2' in text(p):
            replace_visible(p,'Tất cả ảnh của mục 2.2','Tất cả ảnh của mục 1.5')

for element in children[starts[1]:end]:
    body.remove(element)
for offset,element in enumerate(new_blocks):
    body.insert(starts[1]+offset,element)

def signature(element):
    return {'type':E.QName(element).localname,'text':text(element),
            'style':style(element) if element.tag=='{'+W+'}p' else '',
            'images':element.xpath('.//a:blip/@r:embed',namespaces=N)}
expected = [signature(e) for e in list(body)[starts[1]:]]
data['word/document.xml'] = E.tostring(tree,xml_declaration=True,encoding='UTF-8',standalone=True)
temp = DOC.with_suffix('.regrouped.docx')
with ZipFile(temp,'w',ZIP_DEFLATED) as z:
    for info in infos:
        z.writestr(info,data[info.filename])
temp.replace(DOC)
result = {'chapters_before':7,'chapters_after':4,'groups':groups,'titles':names,
          'headings':heading_map,'captions':caption_map,'expected_body':expected,
          'unchanged_package_parts':[n for n in data if n!='word/document.xml'],
          'baseline_sha256':sha256(BASE.read_bytes()).hexdigest(),
          'docx_sha256':sha256(DOC.read_bytes()).hexdigest(),
          'scope':'Gộp chương, chuyển toàn bộ phần thủ tục vào chương phân tích nghiệp vụ. Chỉ đổi tên chương, số mục, số chú thích và một dẫn chiếu nội bộ; không rút gọn nội dung.'}
(Q/'Ban_do_gop_chuong.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({k:v for k,v in result.items() if k in ['chapters_before','chapters_after','groups','titles','headings','scope']},ensure_ascii=False,indent=2))
