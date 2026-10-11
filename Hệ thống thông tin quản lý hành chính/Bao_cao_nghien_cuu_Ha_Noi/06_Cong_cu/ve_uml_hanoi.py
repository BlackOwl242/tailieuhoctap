from mo_hinh_huong_doi_tuong import *
from PIL import Image,ImageDraw,ImageFont
import math,html
FIG=OUT/'So_do';FIG.mkdir(exist_ok=True)
class Canvas:
 def __init__(self,w=2000,h=1200):
  self.w=w;self.h=h;self.im=Image.new('RGB',(w,h),'white');self.d=ImageDraw.Draw(self.im);self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="100%" height="100%" fill="white"/>'];self.records=[]
 def _bounds(self,label,x1,y1,x2,y2):
  if x1<0 or y1<0 or x2>self.w or y2>self.h:self.records.append(f'{label} ngoài khung: ({x1},{y1})–({x2},{y2})')
 def line(self,pts,dash=False,arrow=False):
  self._bounds('Đường',min(p[0] for p in pts)-22,min(p[1] for p in pts)-10,max(p[0] for p in pts)+22,max(p[1] for p in pts)+10)
  self.svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in pts)+'" fill="none" stroke="black" stroke-width="3"'+(' stroke-dasharray="14 10"' if dash else '')+'/>')
  for p,q in zip(pts,pts[1:]):
   if dash:
    dx=q[0]-p[0];dy=q[1]-p[1];ln=math.hypot(dx,dy)
    for s in range(0,int(ln),24):
     a=s/max(ln,1);b=min(s+14,ln)/max(ln,1);self.d.line((p[0]+dx*a,p[1]+dy*a,p[0]+dx*b,p[1]+dy*b),fill='black',width=3)
   else:self.d.line([p,q],fill='black',width=3)
  if arrow:
   p,q=pts[-2:];ang=math.atan2(q[1]-p[1],q[0]-p[0]);tri=[q,(q[0]-20*math.cos(ang)+8*math.sin(ang),q[1]-20*math.sin(ang)-8*math.cos(ang)),(q[0]-20*math.cos(ang)-8*math.sin(ang),q[1]-20*math.sin(ang)+8*math.cos(ang))];self.poly(tri,fill='black')
 def poly(self,pts,fill='white'):
  self._bounds('Đa giác',min(p[0] for p in pts)-2,min(p[1] for p in pts)-2,max(p[0] for p in pts)+2,max(p[1] for p in pts)+2)
  self.d.polygon(pts,fill=fill,outline='black',width=3);self.svg.append('<polygon points="'+' '.join(f'{x},{y}' for x,y in pts)+f'" fill="{fill}" stroke="black" stroke-width="3"/>')
 def rect(self,x,y,w,h,round=False,fill='white'):
  self._bounds('Hình chữ nhật',x-2,y-2,x+w+2,y+h+2)
  self.d.rounded_rectangle((x,y,x+w,y+h),radius=25 if round else 0,fill=fill,outline='black',width=3);self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{25 if round else 0}" fill="{fill}" stroke="black" stroke-width="3"/>')
 def circle(self,x,y,r,fill='white'):
  self._bounds('Đường tròn',x-r-2,y-r-2,x+r+2,y+r+2)
  self.d.ellipse((x-r,y-r,x+r,y+r),fill=fill,outline='black',width=3);self.svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="black" stroke-width="3"/>')
 def text(self,x,y,t,width=900,size=38,bold=False,anchor='middle',background=False):
  f=ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf' if bold else 'C:/Windows/Fonts/times.ttf',size);lines=[]
  for raw in t.split('\n'):
   words=[]
   for word in raw.split():
    while self.d.textlength(word,font=f)>width:
     cut=max(i for i in range(1,len(word)) if self.d.textlength(word[:i],font=f)<=width)
     boundaries=[i for i in range(1,cut+1) if word[i:i+1].isupper() or word[i-1:i]=='_']
     if boundaries:cut=boundaries[-1]
     words.append(word[:cut]);word=word[cut:]
    if word:words.append(word)
   s=''
   for word in words:
    cand=(s+' '+word).strip()
    if s and self.d.textlength(cand,font=f)>width:lines.append(s);s=word
    else:s=cand
   lines.append(s)
  for i,s in enumerate(lines):
   yy=y+i*(size+9);xx=x-self.d.textlength(s,font=f)/2 if anchor=='middle' else x
   if background:
    ww=self.d.textlength(s,font=f)
    self.d.rectangle((xx-5,yy-2,xx+ww+5,yy+size+5),fill='white')
    self.svg.append(f'<rect x="{xx-5}" y="{yy-2}" width="{ww+10}" height="{size+7}" fill="white"/>')
   self.d.text((xx,yy),s,font=f,fill='black');self.svg.append(f'<text x="{x}" y="{yy+size-4}" font-family="Times New Roman" font-size="{size}" font-weight="{"bold" if bold else "normal"}" text-anchor="{anchor}">{html.escape(s)}</text>')
   if xx<0 or yy<0 or xx+self.d.textlength(s,font=f)>self.w or yy+size>self.h:self.records.append('Texte ngoài khung: '+s)
  return len(lines)*(size+9)
 def box(self,x,y,w,h,t,round=False):self.rect(x,y,w,h,round);self.text(x+w/2,y+18,t,w-40)
 def actor(self,x,y,label):
  self.circle(x,y+22,22);self.line([(x,y+44),(x,y+100)]);self.line([(x-40,y+64),(x+40,y+64)]);self.line([(x,y+100),(x-35,y+143)]);self.line([(x,y+100),(x+35,y+143)]);self.text(x,y+150,label,380)
 def database_icon(self,x,y,w=76,h=66):
  left=x-w//2;right=x+w//2;top=y;bottom=y+h;rim=max(12,h//4)
  self.d.rectangle((left,top+rim//2,right,bottom-rim//2),fill='white',outline='black',width=3)
  self.d.ellipse((left,top,right,top+rim),fill='white',outline='black',width=3)
  self.d.arc((left,bottom-rim,right,bottom+rim//2),0,180,fill='black',width=3)
  self.d.line((left,top+rim//2,left,bottom-rim//2),fill='black',width=3)
  self.d.line((right,top+rim//2,right,bottom-rim//2),fill='black',width=3)
  self.svg.append(f'<path d="M {left} {top+rim//2} V {bottom-rim//2} A {w//2} {rim//2} 0 0 0 {right} {bottom-rim//2} V {top+rim//2} A {w//2} {rim//2} 0 0 0 {left} {top+rim//2} Z" fill="white" stroke="black" stroke-width="3"/>')
  self.svg.append(f'<ellipse cx="{x}" cy="{top+rim//2}" rx="{w//2}" ry="{rim//2}" fill="white" stroke="black" stroke-width="3"/>')
  self.svg.append(f'<path d="M {left} {bottom-rim//2} A {w//2} {rim//2} 0 0 0 {right} {bottom-rim//2}" fill="none" stroke="black" stroke-width="3"/>')
 def participant(self,x,kind,label):
  cy=132
  if kind=='boundary':
   # Ký hiệu Boundary theo tài liệu mẫu: vòng tròn gắn với nét gấp ở bên trái.
   self.circle(x,cy,33);self.line([(x-55,cy-28),(x-55,cy+28)]);self.line([(x-55,cy),(x-33,cy)])
  elif kind=='control':
   # Ký hiệu ControlClass theo mẫu BCE: đầu mũi tên chạm cung trên-trái; hai cạnh cân bằng.
   self.circle(x,cy,33)
   self.line([(x+9,cy-47),(x-11,cy-31),(x+9,cy-15)])
  elif kind=='entity':
   # Entity: vòng tròn có đường gạch chạm đáy, theo ký hiệu lớp phân tích.
   self.circle(x,cy,33)
   self.line([(x-44,cy+33),(x+44,cy+33)])
  else:
   # CSDL là kho dữ liệu, dùng ký hiệu hình trụ để phân biệt với Entity.
   self.database_icon(x,cy-34)
  self.text(x,194,label,370,size=27)
 def final(self,x,y):self.circle(x,y,26);self.circle(x,y,16,'black')
 def save(self,name):
  assert not self.records,self.records
  self.im.save(FIG/(name+'.png'));(FIG/(name+'.svg')).write_text('\n'.join(self.svg+['</svg>']),encoding='utf-8')

def sequence(u):
 c=Canvas(2600,2060);xs=[220,700,1280,1850,2400]
 c.text(1300,16,'Biểu đồ trình tự — '+u['id']+': '+u['name'],2480,size=48,bold=True)
 actor='Văn thư được giao' if u['id']=='UC16' else u['actor']
 c.actor(xs[0],72,actor)
 labels=[('boundary','GiaoDien'+u['id']),('control',u['controller']),('entity',u['entity']),('database','CSDL')]
 for x,(kind,label) in zip(xs[1:],labels):c.participant(x,kind,label)
 for x in xs:c.line([(x,275),(x,1980)],dash=True)
 for i,a,b in [(1,365,1880),(2,455,1540),(3,555,1435),(4,655,745),(4,1175,1285)]:
  c.rect(xs[i]-10,a,20,b-a)
 def msg(a,b,y,t,ret=False):
  width=abs(xs[a]-xs[b])-70
  measure=Canvas(2600,400);h=measure.text((xs[a]+xs[b])/2,0,t,width,size=32)
  direction=1 if b>a else -1
  start=xs[a]+(10*direction if a else 0);end=xs[b]-(10*direction if b else 0)
  c.line([(start,y),(end,y)],dash=ret,arrow=not ret)
  if ret:
   sgn=direction;c.line([(end-sgn*20,y-10),(end,y),(end-sgn*20,y+10)])
  c.text((xs[a]+xs[b])/2,y-h-9,t,width,size=32,background=True)
 msg(0,1,365,'Yêu cầu: '+u['name'])
 msg(1,2,455,'guiYeuCau('+u['operation']+')')
 msg(2,3,555,'kiemTraDieuKien()')
 msg(3,4,655,'docTheoPhamVi()')
 msg(4,3,745,'DuLieuVaTrangThai',True)
 msg(3,2,835,'ketQuaKiemTra',True)
 c.line([(78,930),(2520,930),(2520,1950),(78,1950),(78,930)])
 c.text(102,938,'alt',100,size=32,bold=True,anchor='start')
 c.text(205,938,'[Điều kiện: '+u['guard']+']',2260,size=29,anchor='start',background=True)
 msg(2,3,1080,'thucHien('+u['operation']+')')
 msg(3,4,1175,'ghiGiaoDich()' if not u['read_only'] else 'truyVanTheoDieuKien()')
 msg(4,3,1270,'xacNhanCommit()' if not u['read_only'] else 'KetQuaTruyVan',True)
 msg(3,2,1365,'ketQuaNghiepVu',True)
 msg(2,1,1455,'traKetQua()',True)
 msg(1,0,1545,'hienThiKetQua()',True)
 c.line([(78,1635),(2520,1635)],dash=True)
 c.text(205,1642,'[Điều kiện không đạt]',2260,size=29,anchor='start',background=True)
 msg(2,1,1745,'traMaLoiVaLyDo()',True)
 msg(1,0,1840,'hienThiLoi; cho phép nhập lại',True)
 c.text(1300,1970,'Không ghi nhận thay đổi khi điều kiện nghiệp vụ không đạt.',2440,size=27)
 c.save(u['id']+'_trinh_tu')

def activity_supplement(u):
 c=Canvas(2000,1490);c.text(1000,18,'Biểu đồ hoạt động — '+u['id']+': '+u['name'],1850,bold=True)
 for x,lab in [(360,'Cán bộ tiếp nhận'),(980,'Người yêu cầu'),(1600,'Hệ thống')]:c.text(x,120,lab,560,bold=True)
 for x in [660,1280]:c.line([(x,205),(x,1390)],dash=True)
 c.circle(360,210,20,'black');c.line([(360,230),(360,250)],arrow=True)
 c.box(80,250,560,170,'Lập yêu cầu bổ sung\nGhi giai đoạn xử lý',True)
 c.line([(360,420),(360,500),(1320,500)],arrow=True)
 c.box(1320,440,560,180,'Gửi thông báo\nGiữ giai đoạn và mốc hạn',True)
 c.line([(1600,620),(1600,660),(1010,660)],arrow=True)
 c.poly([(980,630),(1010,660),(980,690),(950,660)])
 c.line([(980,690),(980,730)],arrow=True)
 c.box(700,730,560,170,'Gửi tài liệu theo đúng yêu cầu',True)
 c.line([(980,900),(360,900),(360,940)],arrow=True)
 c.box(80,940,560,150,'Đối chiếu tài liệu và căn cứ',True)
 c.line([(360,1090),(360,1110)],arrow=True)
 c.poly([(360,1110),(480,1160),(360,1210),(240,1160)]);c.text(360,1130,'Đạt?',210)
 c.line([(480,1160),(1320,1160)],arrow=True);c.text(900,1100,'[Đạt]',220)
 c.box(1320,1120,560,190,'Ghi nhận bổ sung\nTrở lại đúng giai đoạn',True)
 c.line([(240,1160),(50,1160),(50,700),(680,700),(680,660),(950,660)],arrow=True)
 c.text(360,635,'[Chưa đạt]',300)
 c.line([(1600,1310),(1600,1340)],arrow=True);c.final(1600,1370)
 c.text(1000,1420,'Bổ sung giữ giai đoạn xử lý và áp dụng thời hạn của thủ tục.',1840,size=48)
 c.save(u['id']+'_hoat_dong')

def activity_release(u):
 c=Canvas(2000,1490);c.text(1000,18,'Biểu đồ hoạt động — '+u['id']+': '+u['name'],1850,bold=True)
 c.circle(750,120,20,'black');c.line([(750,140),(750,190)],arrow=True)
 c.box(230,190,1040,130,'Lãnh đạo đọc dự thảo và căn cứ',True)
 c.line([(750,320),(750,340)],arrow=True)
 c.poly([(750,340),(900,410),(750,480),(600,410)]);c.text(750,375,'Duyệt?',260)
 c.line([(900,410),(1620,410),(1620,480)],arrow=True);c.text(1240,350,'[Trả chỉnh sửa]',420)
 c.box(1360,480,520,180,'Trả chỉnh sửa\nNêu rõ lý do',True)
 c.line([(1620,660),(1940,660),(1940,1360),(1026,1360)],arrow=True)
 c.line([(750,480),(750,560)],arrow=True);c.text(965,493,'[Duyệt]',250)
 c.box(230,560,1040,150,'Người có thẩm quyền ký đúng bản đã duyệt',True)
 c.line([(750,710),(750,750)],arrow=True)
 c.poly([(750,750),(920,850),(750,950),(580,850)]);c.text(750,795,'Chữ ký\nhợp lệ?',255,size=48)
 c.line([(920,850),(1620,850),(1620,940)],arrow=True);c.text(1270,790,'[Không hợp lệ]',400)
 c.box(1360,940,520,170,'Báo lỗi ký\nGiữ bản đã duyệt',True)
 c.line([(1620,1110),(1620,1320),(1100,1320),(1026,1345)],arrow=True)
 c.line([(750,950),(750,970)],arrow=True);c.text(965,920,'[Hợp lệ]',270)
 c.box(230,970,1040,130,'Văn thư kiểm tra và cấp số văn bản',True)
 c.line([(750,1100),(750,1150)],arrow=True)
 c.box(230,1150,1040,150,'Phát hành bản bất biến\nLưu nhật ký và thông điệp',True)
 c.line([(750,1300),(750,1360),(974,1360)],arrow=True);c.final(1000,1360)
 c.text(1000,1420,'Phê duyệt, ký và phát hành do các vai trò có thẩm quyền thực hiện.',1840,size=48)
 c.save(u['id']+'_hoat_dong')

def activity(u):
 if u['id']=='UC13':return activity_supplement(u)
 if u['id']=='UC16':return activity_release(u)
 c=Canvas(2600,1940);left=(80,180,920,1640);right=(1000,180,1520,1640)
 c.text(1300,16,'Biểu đồ hoạt động — '+u['id']+': '+u['name'],2480,size=48,bold=True)
 c.text(1300,78,'Điều kiện kiểm tra: '+u['guard'],2460,size=28)
 c.rect(left[0],left[1],left[2],left[3]);c.rect(right[0],right[1],right[2],right[3])
 c.line([(80,290),(2520,290)]);c.line([(1000,180),(1000,1820)])
 c.text(540,198,'Tác nhân: '+u['actor'],860,size=30,bold=True)
 c.text(1760,198,'Ứng dụng',1460,size=30,bold=True)
 ax=540;sx=1750
 c.circle(ax,335,20,'black');c.line([(ax,355),(ax,380)],arrow=True)
 c.box(190,380,700,130,u['steps'][0],True);c.line([(ax,510),(ax,545)],arrow=True)
 c.box(190,545,700,130,u['steps'][1],True)
 c.line([(890,610),(1050,610),(1050,790),(1150,790)],arrow=True)
 c.box(1150,715,1200,150,'Kiểm tra điều kiện nghiệp vụ',True)
 c.line([(sx,865),(sx,920)],arrow=True)
 c.poly([(sx,920),(1930,1020),(sx,1120),(1570,1020)]);c.text(sx,972,'Đạt điều kiện?',310,size=32)
 c.line([(sx,1120),(sx,1190),(1010,1190),(1010,1320),(890,1320)],arrow=True)
 c.text(1265,1155,'[Đạt]',200,size=30,background=True)
 c.box(190,1250,700,140,u['steps'][2],True)
 c.line([(ax,1390),(ax,1480),(1150,1480)],arrow=True)
 c.box(1150,1480,1200,170,u['steps'][3]+'\n'+('Trả dữ liệu theo quyền' if u['read_only'] else 'Xác nhận kết quả và nhật ký'),True)
 c.line([(sx,1650),(sx,1730)],arrow=True);c.final(sx,1755)
 c.line([(1930,1020),(1980,1020),(1980,1230),(2010,1230)],arrow=True)
 c.text(2165,975,'[Không đạt]',420,size=29,background=True)
 c.box(2010,1150,460,170,'Trả lý do; cho phép sửa\nKhông ghi thay đổi',True)
 c.line([(2470,1230),(2480,1230),(2480,1420)],arrow=True);c.final(2480,1445)
 c.text(1300,1840,'Ngoại lệ UC'+u['id'][2:]+': '+u['exception'],2460,size=26)
 c.save(u['id']+'_hoat_dong')

def usecases(group,items,name):
 actors=list(dict.fromkeys(u['actor'] for u in items))
 h=max(850,190*len(items)+270,290*len(actors)+300);c=Canvas(2000,h);c.rect(610,120,1330,h-180);c.text(1260,135,GROUPS[group],1150,bold=True)
 positions={a:250+i*(h-300)/max(len(actors),1) for i,a in enumerate(actors)}
 for a,y in positions.items():c.actor(230,y-90,a)
 for i,u in enumerate(items):
  y=260+i*190;c.d.ellipse((750,y,1810,y+130),outline='black',width=3);c.svg.append(f'<ellipse cx="1280" cy="{y+65}" rx="530" ry="65" fill="white" stroke="black" stroke-width="3"/>');c.text(1280,y+20,u['id']+' '+u['name'],1000,size=38)
  bus=450+actors.index(u['actor'])*min(50,150/max(len(actors)-1,1));ay=positions[u['actor']]-26;c.line([(270,ay),(bus,ay),(bus,y+65),(750,y+65)])
 c.save(name)

SCHEMA=json.loads((ROOT/'03_Thiet_ke/Tu_dien_du_lieu.json').read_text('utf-8'))
CLASSES={k:''.join(w.capitalize() for w in k.split('_')) for k in SCHEMA}
aliases={'ho_so':'HoSo','ket_qua':'KetQua','tai_khoan':'TaiKhoan','co_quan':'CoQuan','phien_ban_thu_tuc':'PhienBanThuTuc','yeu_cau_bo_sung':'YeuCauBoSung','yeu_cau_dung':'YeuCauDung','su_kien_quyen_ky_mau06':'SuKienQuyenKyMau06','phan_cong':'PhanCong','nhiem_vu_phoi_hop':'NhiemVuPhoiHop','giao_nhan':'GiaoNhan','he_thong_ket_noi':'HeThongKetNoi','tai_lieu_huong_dan':'TaiLieuHuongDan','mau_bao_cao':'MauBaoCao','chi_dao_dieu_hanh':'ChiDaoDieuHanh','tai_lieu_kho':'TaiLieuKho','thong_diep_nhan':'ThongDiepNhan','hang_doi_gui':'HangDoiGui','khoan_thu':'KhoanThu','giao_dich':'GiaoDich','thanh_phan_ho_so':'ThanhPhanHoSo','phan_anh':'PhanAnh','ho_so_nop_luu':'HoSoNopLuu','thong_bao':'ThongBao'}
CLASSES.update(aliases)
CLASSES={k:v for k,v in CLASSES.items() if k in SCHEMA}
PARTS={1:['co_quan','chu_the','tai_khoan','quyen_pham_vi'],2:['thu_tuc','phien_ban_thu_tuc','tuyen_xu_ly','lich_lam_viec'],3:['ket_qua','chu_ky','giao_nhan'],4:['ho_so','uy_quyen','thanh_phan_ho_so','phan_cong','su_kien_xu_ly','yeu_cau_bo_sung','nhiem_vu_phoi_hop','yeu_cau_dung','su_kien_quyen_ky_mau06'],5:['thong_bao','phan_anh','tai_lieu_huong_dan','diem_tiep_nhan'],6:['khoan_thu','giao_dich','mau_bao_cao'],7:['chi_dao_dieu_hanh','nhat_ky'],8:['tai_lieu_kho','quyen_khai_thac_kho','dot_nop_luu','ho_so_nop_luu'],9:['he_thong_ket_noi','tham_chieu_lien_thong','thong_diep_nhan','hang_doi_gui']}
PARTS[5][1]='phan_anh_kien_nghi';CLASSES['phan_anh_kien_nghi']='PhanAnh'
assert set(k for v in PARTS.values() for k in v)==set(SCHEMA)
CLASS_DIAGRAMS=[]
def classes(g,keys,part):
 c=Canvas(2200,1530);c.text(1100,20,'Lớp miền '+GROUPS[g]+(' phần '+str(part) if g==4 else ''),2070,bold=True)
 pos={k:(80+(i%2)*1120,160+(i//2)*680) for i,k in enumerate(keys)}
 for k,(x,y) in pos.items():
  c.rect(x,y,920,470);c.line([(x,y+90),(x+920,y+90)]);c.line([(x,y+335),(x+920,y+335)]);c.text(x+460,y+22,CLASSES[k],840,bold=True)
  def dtype(t):
   return 'ĐịnhDanh' if t=='uuid' else 'Chuỗi' if t.startswith(('varchar','text','char')) else 'SốNguyên' if t=='integer' else 'Logic' if t=='boolean' else 'DữLiệuCấuTrúc' if t=='jsonb' else 'ThờiĐiểm' if t.startswith(('date','time')) else 'SốThậpPhân'
  cols=SCHEMA[k][1];attrs=['− '+f[0]+': '+dtype(f[1]) for f in cols[:4]];c.text(x+20,y+112,'\n'.join(attrs),870,size=36,anchor='start')
  methods=[u['operation']+'()' for u in MODEL if u['entity']==CLASSES[k]][:2] or ['kiemTraHopLe()'];c.text(x+20,y+353,'\n'.join('+ '+m for m in methods),870,size=36,anchor='start')
 # Mỗi hình tĩnh chỉ nối một quan hệ chính để giữ rõ nhãn. Toàn bộ quan hệ có trong bảng ánh xạ.
 edges=[]
 for k in keys:
  for field in SCHEMA[k][1]:
   if field[2].startswith('FK ') and field[2][3:] in keys and field[2][3:]!=k:
    edges.append((k,field[2][3:],field[0],field[3]));break
  if edges:break
 if edges:
  a,b,label,nullable=edges[0];x,y=pos[a];xx,yy=pos[b]
  if y==yy:
   p=(x+(920 if xx>x else 0),y+300);q=(xx+(0 if xx>x else 920),yy+300);c.line([p,q]);c.text(p[0]+(45 if xx>x else -45),p[1]+20,'0..*',100,size=34);c.text(q[0]+(-45 if xx>x else 45),q[1]-65,'0..1' if nullable=='Có' else '1',100,size=34)
  else:
   p=(x+500,y+(470 if yy>y else 0));q=(xx+500,yy+(0 if yy>y else 470));mid=(p[1]+q[1])/2;c.line([p,(p[0],mid),(q[0],mid),q]);c.text(p[0]+100,p[1]+(12 if yy>y else -60),'0..*',150,size=34);c.text(q[0]+100,q[1]+(-60 if yy>y else 12),'0..1' if nullable=='Có' else '1',150,size=34)
 c.text(1100,1410,'Bội số đặt ở phía đối tượng tương ứng; các quan hệ còn lại được đặc tả trong bảng ánh xạ.',2060,size=34)
 name=f'lop_nhom_{g}_{part}';c.save(name);CLASS_DIAGRAMS.append((g,name,keys))

for u in MODEL:sequence(u);activity(u)
for g in GROUPS:usecases(g,[u for u in MODEL if u['group']==g],f'ca_su_dung_nhom_{g}')
for g,ks in PARTS.items():
 for i in range(0,len(ks),4):classes(g,ks[i:i+4],i//4+1)
(OUT/'Anh_xa_lop.json').write_text(json.dumps({'classes':CLASSES,'parts':PARTS,'diagrams':CLASS_DIAGRAMS},ensure_ascii=False,indent=2),encoding='utf-8')
print('Generated',len(list(FIG.glob('*.svg'))),'UML diagram files.')
