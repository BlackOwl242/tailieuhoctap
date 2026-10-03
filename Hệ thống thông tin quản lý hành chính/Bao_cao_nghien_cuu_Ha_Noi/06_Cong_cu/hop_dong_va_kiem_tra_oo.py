from mo_hinh_huong_doi_tuong import *
import csv,re
SCHEMA=json.loads((ROOT/'03_Thiet_ke/Tu_dien_du_lieu.json').read_text('utf-8'))
# Từng trường thuộc hợp đồng đề xuất, tách khỏi giao tiếp của hệ thống thật.
FIELDS=[
'taiKhoanId,coQuanId,vaiTro,tuNgay,denNgay,canCu','ma,ten,loai,tuNgay,denNgay,nguon','thuTucId,quyetDinh,tuNgay,thanhPhan,quyTacHan,tuyenId','phienBanThuTucId,trangThaiNguon,trangThaiDich,suKien,dieuKien,vaiTro','phienBanThuTucId,chuTheId,uyQuyenId,toKhai,taiLieuIds,kenh','hoSoId,coQuanDichId,canCu,goiBanGiaoId','hoSoId,hanhDong,bangChungIds','hoSoId','phienBanThuTucId,buocXuLy,canhNoi,quyTacTongHop','ketQuaId,giaTriBam,chungThuId','heThongId,cauHinhBiMatId,maTuongQuan','hoSoId,ketQuaKiemTra,giayHenId','hoSoId,yeuCauBoSungId,giaiDoan,taiLieuIds','hoSoId,nguoiXuLyId,canCu','hoSoId,nhiemVuIds,yKienIds,duThaoId','hoSoId,ketQuaId,chuKyId,soVanBan','hoSoId,quyetDinhId,canCu,phuongAnTaiChinh','ketQuaId,nguoiNhanId,kenh,bangChungIds','hoSoId,mauId,mucDich','hoSoId,nguoiNhanIds,kenh,noiDung','tuKhoa,coQuanId,thuTucId,tuNgay,denNgay,trang','thuTucId,ngayApDung,cauHoi','mauId,coQuanId,tuNgay,denNgay,mocChot','mauId,cotDuLieu,congThuc,quyTacLoaiTru,tuNgay','chiTieu,coQuanId,tuNgay,denNgay,mocChot','coQuanId,trachNhiem,hanXuLy,trang','noiDung,nguoiNhanIds,hanXuLy,hoSoIds','taiLieuId,chuTheId,quyen,denNgay,canCu','hoSoId,taiLieuId,mucDich','heThongId,maSuKien,thuTu,chuKyNoiDung,noiDung','thongDiepId,maTuongQuan,lanThu','khoanThuId,soTien,phuongThuc','giaoDichId,maDoiTac,soTien,trangThaiDoiTac,kyDoiSoat','hoSoId,thanhPhanId,taiLieuId,soTrang,nguon,giaTriBam','hoSoId,loai,noiDung,lienHe,taiLieuIds','hoSoId,dotNopLuuId,danhMucTep,giaTriBam,thoiHanBaoQuan']
contracts=[]; cases=[]
date={'tuNgay','denNgay','ngayApDung','hanXuLy','mocChot'}
arrays={'thanhPhan','taiLieuIds','bangChungIds','buocXuLy','canhNoi','nhiemVuIds','yKienIds','nguoiNhanIds','hoSoIds','cotDuLieu','danhMucTep'}
objects={'toKhai','quyTacHan','dieuKien','quyTacTongHop','noiDung'}
def prop(f):
 if f.endswith('Id'):return {'type':'string','format':'uuid'}
 if f in arrays:return {'type':'array','items':{'type':'string' if f.endswith('Ids') else 'object'},'minItems':1}
 if f in date:return {'type':'string','format':'date-time'}
 if f in {'soTrang','thuTu','lanThu','trang','thoiHanBaoQuan'}:return {'type':'integer','minimum':0 if f=='lanThu' else 1}
 if f=='soTien':return {'type':'integer','minimum':0,'description':'Số nguyên theo đơn vị đồng; không dùng số thực'}
 if f in objects:return {'type':'object','description':'Có lược đồ chuyên biệt theo phiên bản thủ tục; chưa chấp nhận dữ liệu không kiểm tra'}
 return {'type':'string','minLength':1,'maxLength':20000 if f in {'canCu','congThuc','quyTacLoaiTru','cauHoi'} else 512}
for u,raw in zip(MODEL,FIELDS):
 fields=raw.split(','); optional={'uyQuyenId','hoSoId'} if u['id'] in {'UC05','UC35'} else set()
 method='GET' if u['read_only'] else 'POST';path='/api/v1/nghiep-vu/'+u['operation']
 props={f:prop(f) for f in fields}
 if not u['read_only']:props['phienBanMongDoi']={'type':'integer','minimum':0}
 c=dict(uc=u['id'],method=method,path=path,operationId=u['operation'],role=u['actor'],scope='Cơ quan và quan hệ hồ sơ được kiểm tra phía máy chủ',requestSchema={'type':'object','additionalProperties':False,'properties':props,'required':[f for f in fields if f not in optional]+([] if u['read_only'] else ['phienBanMongDoi'])},guard=u['guard'],success={'code':200,'fields':['maTuongQuan','duLieu','phienBanMoi'],'condition':'Chỉ trả thành công khi thao tác đã đọc đúng phạm vi hoặc giao dịch lưu đã được xác nhận'},errors={'400':'Dữ liệu không hợp lệ','401':'Chưa xác thực','403':'Thiếu quyền hoặc sai phạm vi','404':'Không tìm thấy trong phạm vi được phép','409':'Phiên bản khác hoặc khóa chống lặp khác nội dung','422':'Điều kiện nghiệp vụ chưa đạt','503':'Dịch vụ chưa sẵn sàng, không xác nhận thành công'},idempotency='Không áp dụng với đọc' if u['read_only'] else 'Bắt buộc khóa yêu cầu cho lệnh; lưu cùng nội dung băm, chủ thể và kết quả',tables=u['tables'])
 contracts.append(c)
 for suffix,scenario,expect in [('A','Dữ liệu hợp lệ, đúng quyền, đủ điều kiện','Kết quả đúng đặc tả; chỉ ghi những đối tượng được cho phép'),('B','Không đáp ứng điều kiện: '+u['guard'],'Trả lỗi nghiệp vụ; không áp dụng thay đổi'),('C','Không có quyền trên cơ quan hoặc hồ sơ','Từ chối; không rò dữ liệu hoặc tổng số')]:
  cases.append(dict(id=u['test']+suffix,uc=u['id'],scenario=scenario,expected=expect,status='Chưa thực hiện'))
 if not u['read_only']:
  for suffix,scenario,expect in [('D','Gửi lại cùng khóa, nội dung và người gửi','Trả cùng kết quả; không ghi trùng'),('E','Gửi phiên bản cũ hoặc cùng khóa khác nội dung','Báo xung đột; giữ dữ liệu đã xác nhận')]:cases.append(dict(id=u['test']+suffix,uc=u['id'],scenario=scenario,expected=expect,status='Chưa thực hiện'))
(OUT/'Hop_dong_36_thao_tac.json').write_text(json.dumps(contracts,ensure_ascii=False,indent=2),encoding='utf-8')
with (OUT/'Kich_ban_kiem_thu_huong_doi_tuong.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(cases[0]));w.writeheader();w.writerows(cases)
associations=[]
for name,(_,fields) in SCHEMA.items():
 for field,typ,key,nullable,desc in fields:
  if key.startswith('FK '):associations.append(dict(source=name,target=key[3:],field=field,source_multiplicity='0..*',target_multiplicity='0..1' if nullable=='Có' else '1',note=desc))
(OUT/'Quan_he_lop_day_du.json').write_text(json.dumps(associations,ensure_ascii=False,indent=2),encoding='utf-8')
checks=[]
def check(name,ok):checks.append(dict(check=name,passed=bool(ok)))
check('Có 36 ca dùng duy nhất',len(MODEL)==36 and len({u['id'] for u in MODEL})==36)
check('31 chức năng chuẩn không trùng',len({u['function'] for u in MODEL if u['function'].startswith('CN')})==31)
check('Mỗi ca có bốn bước hướng dẫn',all(len(u['steps'])==4 for u in MODEL))
check('Mọi bảng tham chiếu đều tồn tại',all(t in SCHEMA for u in MODEL for t in u['tables']))
check('Có hợp đồng riêng cho mọi ca',len(contracts)==len(MODEL))
check('Ca đọc chỉ dùng phương thức đọc',all(c['method']=='GET' for c,u in zip(contracts,MODEL) if u['read_only']))
check('Khóa ngoại tham chiếu đúng đối tượng',all(a['target'] in SCHEMA for a in associations))
check('Ca kiểm thử chưa thực hiện',all(c['status']=='Chưa thực hiện' for c in cases))
m=json.loads((OUT/'May_trang_thai_ho_so.json').read_text('utf-8'));reach={m['initial']}
while True:
 nxt=reach|{t['target'] for t in m['transitions'] if t['source'] in reach}
 if nxt==reach:break
 reach=nxt
check('Mọi trạng thái có đường đến từ bản nháp',set(m['states'])==reach)
check('Trạng thái kết thúc không có lệnh chuyển thông thường',not any(t['source'] in m['terminal'] for t in m['transitions']))
check('Mỗi chuyển bước có điều kiện và vai trò',all(t['guard'] and t['role'] for t in m['transitions']))
(OUT/'Ket_qua_kiem_tra_mo_hinh.json').write_text(json.dumps({'checks':checks,'classes':len(SCHEMA),'associations':len(associations),'test_cases':len(cases),'all_passed':all(c['passed'] for c in checks),'meaning':'Kiểm tra tính nhất quán dữ liệu thiết kế; không phải thực thi phần mềm'},ensure_ascii=False,indent=2),encoding='utf-8')
G=ROOT/'07_Huong_dan/Chuc_nang_dung_chung';G.mkdir(exist_ok=True)
for u,c in zip(MODEL,contracts):
 s=f"# {u['id']}. {u['name']}\n\nLoại: {u['function']}; nhóm {u['group']}: {GROUPS[u['group']]}.\n\nĐây là hướng dẫn theo bản thiết kế nghiên cứu, không xác nhận tên màn hình nội bộ của Hà Nội.\n\nNgười thực hiện: {u['actor']}.\n\nĐiều kiện: {u['guard']}.\n\n"
 for i,step in enumerate(u['steps'],1):s+=f'## Bước {i}\n\n{step}.\n\n'
 s+=f"## Kết quả và ngoại lệ\n\n{u['exception']}.\n\n## Truy vết thiết kế\n\nMàn hình {u['screen']}; lớp điều khiển {u['controller']}; thao tác {u['operation']}; giao tiếp {c['method']} {c['path']}.\n\nDữ liệu cần nhập: {u['inputs']}.\n\nẢnh màn hình thiết kế: ../../03_Thiet_ke/Huong_doi_tuong/So_do/{u['id']}_man_hinh.png\n\nBiểu đồ trình tự và hoạt động cùng mã nằm trong thư mục sơ đồ. Ca kiểm thử {u['test']}A đến {u['test']}{'C' if u['read_only'] else 'E'} chưa thực hiện.\n"
 (G/(u['id']+'.md')).write_text(s,encoding='utf-8')
print('Hợp đồng:',len(contracts),'quan hệ:',len(associations),'ca kiểm thử:',len(cases),'kiểm tra:',all(c['passed'] for c in checks))
