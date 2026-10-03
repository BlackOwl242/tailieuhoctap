from pathlib import Path
import pdfplumber,json,csv,re,html
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'07_Huong_dan/Thu_tuc_theo_QD_492';OUT.mkdir(parents=True,exist_ok=True)
records=[];stats={};issues=[]
clean=lambda s:re.sub(r'\s+',' ',s or '').strip()
for annex,level,expected in [(1,'Toàn trình',1120),(2,'Một phần',921),(3,'Cung cấp thông tin',34)]:
 agency='';start=len(records)
 with pdfplumber.open(ROOT/f'01_Nguon_tham_khao/Bo_sung_2026/QD_492_PL{annex}_2026.pdf') as doc:
  for page_no,page in enumerate(doc.pages,1):
   for table in page.extract_tables():
    for row in table:
     cells=[clean(x) for x in row]
     if len(cells)<5:continue
     if re.match(r'^(Sở |Ban |Công an |Thanh tra |Văn phòng |UBND |Trung tâm )',cells[0]):agency=cells[0]
     code=cells[2]
     if code and re.fullmatch(r'[\d.,]+',code) and cells[0].isdigit():
      flags=cells[-4:];caps=[x for x,v in zip(['Cấp tỉnh','Cấp xã','Cấp tỉnh và cấp xã','Liên thông'],flags) if v.lower()=='x']
      rec=dict(record_id=f'PL{annex}-{len(records)-start+1:04}',ordinal=int(cells[0]),code=code,name=cells[4],sector=cells[3],agency=agency,level=level,competence='; '.join(caps),annex=annex,page=page_no,source=f'https://datafiles.hanoi.gov.vn/gov-hni/8123/VanBan/2026/4/22/QD%20492%20PL{annex}.pdf',as_of='2026-04-14',verified_details=False,code_needs_verification=not bool(re.fullmatch(r'\d\.\d{6}',code)))
      records.append(rec)
     elif records and records[-1]['annex']==annex and not cells[0] and not code and cells[4] and not cells[4].isdigit():
      # Một số tên dài được nối qua trang; không tự thêm dữ liệu ngoài bảng nguồn.
      records[-1]['name']+=' '+cells[4]
 stats[str(annex)]={'expected':expected,'extracted':len(records)-start}
 if len(records)-start!=expected:issues.append(f'Phụ lục {annex}: cần đối chiếu {expected} dòng với {len(records)-start} dòng đọc được')
for rec in records:
 filename=rec['record_id']+'_'+rec['code'].replace('.','_')+'.md';rec['file']=filename
 lookup='https://dichvucong.gov.vn/dvc-ket-qua-thu-tuc?keyword='+quote(rec['name'])
 steps=['Mở liên kết tra cứu theo đúng tên và đối chiếu mã '+rec['code']+'.','Chọn Thành phố Hà Nội và cơ quan thực hiện đúng thẩm quyền; đối chiếu quyết định công bố mới nhất.','Đọc thành phần, mẫu, thời hạn, phí, điều kiện và cách nhận kết quả trên trang chi tiết; không lấy số liệu của thủ tục khác.']
 if rec['level']=='Cung cấp thông tin':
  steps+=['Liên hệ nơi tiếp nhận được công bố. Danh mục này chỉ xác nhận cung cấp thông tin, không chứng minh có nút gửi hồ sơ trực tuyến.','Chuẩn bị hồ sơ và thực hiện bằng kênh được cơ quan hướng dẫn; lưu giấy tiếp nhận hoặc chứng từ có mã.']
 else:
  steps+=['Đăng nhập theo phương thức cổng đang hỗ trợ; kê khai đúng chủ thể và căn cứ đại diện; dùng lại dữ liệu hợp lệ nếu có.','Đính kèm thành phần được yêu cầu; xem lại toàn bộ thông tin rồi gửi; lưu mã giao dịch và mã hồ sơ sau khi tiếp nhận.']
  if rec['level']=='Một phần':steps+=['Đọc bước phải thực hiện trực tiếp hoặc đối chiếu bản chính. Không suy luận rằng mọi khâu đều có thể hoàn thành trên mạng.']
  steps+=['Chỉ thanh toán khi thủ tục có khoản thu áp dụng; theo dõi bổ sung, giấy hẹn và nhận đúng bản kết quả có quyền nhận.']
 text=f"# {rec['name']}\n\nMã thủ tục: {rec['code']}. Mức cung cấp: {rec['level']}. Lĩnh vực: {rec['sector']}. Đơn vị trong danh mục: {rec['agency']}. Cấp giải quyết: {rec['competence']}.\n\nNguồn: [Quyết định 492 phụ lục {rec['annex']} trang {rec['page']}]({rec['source']}#page={rec['page']}). Danh mục tại ngày 14/4/2026, chưa xác nhận còn hiệu lực tại ngày 02/10/2026.\n\n## Hướng dẫn tiếp cận dịch vụ\n\n[Tra cứu thủ tục trên cổng quốc gia]({lookup})\n\n"+'\n\n'.join(f'{i}. {s}' for i,s in enumerate(steps,1))
 text+='\n\n## Nội dung chuyên biệt chưa được xác nhận\n\nDanh mục nguồn chỉ có mã, tên, lĩnh vực, mức cung cấp và cấp giải quyết. Hồ sơ này chưa có đặc tả đầy đủ về thành phần giấy tờ, phí, hạn, biểu mẫu và quy trình nội bộ. Các dữ liệu đó phải được lấy từ trang chi tiết hoặc quyết định còn hiệu lực trước khi hướng dẫn nộp cụ thể hay đưa vào cấu hình lập trình. Đây là hướng dẫn tiếp cận theo danh mục, chưa phải hướng dẫn chuyên biệt hoàn chỉnh.\n\n## Điều kiện đưa vào bản thiết kế\n\nChốt phiên bản thủ tục và nguồn; xác nhận thẩm quyền và tuyến địa phương hoặc bộ; nhập đủ thành phần và mẫu; thiết lập hạn theo lịch; khai báo khoản thu hoặc không áp dụng; kiểm tra các bước bổ sung, từ chối, phê duyệt và giao; ghi nguồn ảnh thật hoặc đánh dấu bản thiết kế; người phụ trách nghiệp vụ duyệt trước công bố.\n'
 (OUT/filename).write_text(text,encoding='utf-8')
(OUT/'Danh_muc.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
with (OUT/'Danh_muc.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=records[0].keys());w.writeheader();w.writerows(records)
(OUT/'Kiem_tra_trich_xuat.json').write_text(json.dumps({'stats':stats,'total':len(records),'unique_codes':len({r['code'] for r in records}),'issues':issues,'limitations':'Danh mục lịch sử, hướng dẫn tiếp cận; chưa kiểm chứng toàn bộ quy trình chuyên biệt hiện hành'},ensure_ascii=False,indent=2),encoding='utf-8')
rows=''.join(f"<tr><td>{r['record_id']}</td><td>{r['code']}</td><td><a href='{r['file']}'>{html.escape(r['name'])}</a></td><td>{html.escape(r['sector'])}</td><td>{html.escape(r['level'])}</td><td>{html.escape(r['agency'])}</td></tr>" for r in records)
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><title>Danh mục hướng dẫn thủ tục Hà Nội</title><style>body{font:16px Arial;margin:30px;color:#17212c}input{padding:12px;width:70%}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{border:1px solid #bbb;padding:9px;text-align:left}th{background:#eee;position:sticky;top:0}a{color:#174f82}</style><h1>Danh mục thủ tục theo Quyết định 492</h1><p>Danh mục tại ngày 14/4/2026. Mỗi mục có hướng dẫn tiếp cận và nguồn. Thành phần, phí, hạn và quy trình chuyên biệt chưa được xác nhận đầy đủ; không dùng danh mục này làm cấu hình hiện hành khi chưa cập nhật.</p><input id="q" placeholder="Tìm theo mã, tên, lĩnh vực hoặc cơ quan"><p id="n"></p><table><thead><tr><th>Mục</th><th>Mã</th><th>Thủ tục</th><th>Lĩnh vực</th><th>Mức cung cấp</th><th>Đơn vị</th></tr></thead><tbody>'''+rows+'''</tbody></table><script>const rows=[...document.querySelectorAll('tbody tr')];function filter(){let q=document.querySelector('#q').value.toLocaleLowerCase('vi');let n=0;rows.forEach(r=>{let ok=r.textContent.toLocaleLowerCase('vi').includes(q);r.hidden=!ok;if(ok)n++});document.querySelector('#n').textContent=n+' mục phù hợp'}document.querySelector('#q').addEventListener('input',filter);filter()</script></html>'''
(OUT/'Tra_cuu_danh_muc.html').write_text(page,encoding='utf-8')
print(json.dumps({'stats':stats,'total':len(records),'issues':issues},ensure_ascii=False))
