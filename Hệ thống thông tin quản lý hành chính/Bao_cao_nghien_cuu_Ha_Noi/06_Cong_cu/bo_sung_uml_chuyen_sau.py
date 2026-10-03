from ve_uml_hanoi import Canvas,FIG,OUT,MODEL,CLASSES,GROUPS,ROOT
import json

# Sự kiện, điều kiện và vai trò là ràng buộc của thiết kế, không phải cấu hình đã quan sát nội bộ.
T=[
('NHAP','gui','CHO_TIEP_NHAN','Đủ trường và tuyến hợp lệ','Người yêu cầu'),
('CHO_TIEP_NHAN','yeuCauBoSung','CHO_BO_SUNG','Nêu rõ thiếu sót và căn cứ','Cán bộ tiếp nhận'),
('CHO_TIEP_NHAN','tiepNhan','DA_TIEP_NHAN','Đủ thành phần, đúng quyền và phiên bản','Cán bộ tiếp nhận'),
('CHO_TIEP_NHAN','tuChoi','TU_CHOI','Có căn cứ và thông báo được duyệt','Cán bộ tiếp nhận'),
('CHO_BO_SUNG','tuChoiTiepNhan','TU_CHOI','Giai đoạn tiếp nhận, không thể hoàn thiện, thông báo được duyệt','Cán bộ tiếp nhận'),
('CHO_BO_SUNG','boSungTiepNhan','CHO_TIEP_NHAN','Giai đoạn trước là tiếp nhận và bổ sung đã được đối chiếu','Cán bộ tiếp nhận'),
('CHO_BO_SUNG','boSungThamDinh','DANG_THU_LY','Giai đoạn trước là thẩm định và đủ bổ sung','Chuyên viên thụ lý'),
('DA_TIEP_NHAN','phanCong','DANG_THU_LY','Người nhận có quyền, chỉ một phân công hiện hành','Lãnh đạo đơn vị'),
('DANG_THU_LY','yeuCauBoSung','CHO_BO_SUNG','Có căn cứ và giai đoạn quay lại','Chuyên viên thụ lý'),
('DANG_THU_LY','trinhDuyet','TRINH_DUYET','Đủ ý kiến bắt buộc và dự thảo hợp lệ','Chuyên viên thụ lý'),
('DANG_THU_LY','khongGiaiQuyet','KHONG_GIAI_QUYET','Có kết luận và thẩm quyền','Chuyên viên thụ lý'),
('TRINH_DUYET','traChinhSua','DANG_THU_LY','Có ý kiến và phiên bản dự thảo','Lãnh đạo có thẩm quyền'),
('TRINH_DUYET','kyDuyet','DA_PHE_DUYET','Đúng bản và chữ ký hợp lệ','Lãnh đạo có thẩm quyền'),
('DA_PHE_DUYET','phatHanh','DA_PHAT_HANH','Văn thư cấp số; tệp bất biến','Văn thư'),
('DA_PHAT_HANH','xacNhanGiao','HOAN_THANH','Có chứng cứ giao đúng người','Cán bộ trả kết quả'),
('DA_TIEP_NHAN','dung','DUNG','Quyết định dừng có căn cứ','Lãnh đạo có thẩm quyền'),
('DANG_THU_LY','dung','DUNG','Quyết định dừng có căn cứ','Lãnh đạo có thẩm quyền'),
('TRINH_DUYET','dung','DUNG','Quyết định dừng và xử lý dự thảo','Lãnh đạo có thẩm quyền'),
]
machine={'object':'HoSo','initial':'NHAP','states':sorted({s for a,_,b,_,_ in T for s in [a,b]}),'terminal':['TU_CHOI','KHONG_GIAI_QUYET','DUNG','HOAN_THANH'],'transitions':[dict(source=a,event=e,target=b,guard=g,role=r) for a,e,b,g,r in T],'invariants':['Mỗi chuyển bước kiểm tra phiên bản và phạm vi quyền','Chuyển bước và nhật ký cùng giao dịch','Không tự điều chỉnh hạn khi bổ sung hoặc sự cố','Tài chính, giao nhận, đồng bộ là các chiều độc lập']}
(OUT/'May_trang_thai_ho_so.json').write_text(json.dumps(machine,ensure_ascii=False,indent=2),encoding='utf-8')

def state_linear(name,states,events,back=None):
 c=Canvas(2000,1120);c.text(1000,0,'Vòng đời '+name,1830,bold=True);c.circle(150,285,21,'black');xs=[300,720,1140,1560]
 for i,s in enumerate(states):c.box(xs[i],215,330,155,s,True)
 c.line([(171,285),(300,285)],arrow=True)
 for i,e in enumerate(events):
  y=520+i*170;c.line([(xs[i]+165,370),(xs[i]+165,y),(xs[i+1]+165,y),(xs[i+1]+165,370)],arrow=True);c.text((xs[i]+xs[i+1])/2+165,y+15,e,390,size=36,background=True)
 if back:
  source,target,label=back;sx=xs[source]+165;tx=xs[target]+165
  c.line([(sx,215),(sx,170),(tx,170),(tx,215)],arrow=True);c.text((sx+tx)/2,100,label,1160,size=36,background=True)
 c.line([(1890,285),(1950,285),(1950,1000),(1026,1000)],arrow=True);c.final(1000,1000);c.save('trang_thai_'+name)

state_linear('KetQua',['DỰ THẢO','ĐÃ DUYỆT','ĐÃ KÝ','ĐÃ PHÁT HÀNH'],['duyệt [đúng quyền]','ký [đúng bản và chứng thư]','cấp số [đã kiểm tra chữ ký]'],(1,0,'trả chỉnh sửa [chưa ký]'))
state_linear('KhoanThu',['CHỜ THU','ĐÃ THANH TOÁN','CHỜ ĐỐI SOÁT','ĐÃ CHỐT'],['nhận xác nhận [nguồn hợp lệ]','đối chiếu [không ghi trùng]','chốt [khớp mã và số tiền]'])
state_linear('NhiemVuPhoiHop',['ĐÃ GIAO','ĐANG XỬ LÝ','ĐÃ TRẢ LỜI','ĐÃ XÁC NHẬN'],['nhận việc [đúng cơ quan]','gửi ý kiến [đúng phiên bản]','xác nhận [đủ nội dung]'],(2,1,'yêu cầu sửa [ý kiến chưa đủ]'))
state_linear('ThongDiep',['CHỜ GỬI','ĐANG GỬI','ĐÃ CÓ BIÊN NHẬN','ĐÃ ĐỐI CHIẾU'],['gửi [đến hạn thử]','phản hồi [đúng tương quan]','xác nhận áp dụng [đúng hợp đồng]'],(1,0,'hết chờ hoặc lỗi [cùng mã]'))
state_linear('GoiNopLuu',['ĐÃ LẬP','ĐÃ KIỂM TRA','ĐÃ GỬI','ĐÃ NHẬN LƯU'],['kiểm tra [đủ và toàn vẹn]','gửi [gói không đổi]','biên nhận [đúng phiên bản]'],(2,0,'trả gói [bổ sung có phiên bản]'))

c=Canvas(2200,1810);c.text(1100,20,'HoSo các nhánh tiếp nhận và giải quyết',2050,bold=True)
nodes={'NHAP':(50,150),'CHO_TIEP_NHAN':(820,150),'CHO_BO_SUNG':(1590,150),'DA_TIEP_NHAN':(820,570),'DANG_THU_LY':(820,990),'TRINH_DUYET':(820,1410),'TU_CHOI':(1590,570),'KHONG_GIAI_QUYET':(1590,990),'DUNG':(50,990)}
for s,(x,y) in nodes.items():c.box(x,y,560,130,s,True)
c.circle(100,95,20,'black');c.line([(100,115),(100,150)],arrow=True)
def edge(a,b,label,side=False):
 x,y=nodes[a];xx,yy=nodes[b]
 if y==yy:p=(x+560 if xx>x else x,y+65);q=(xx if xx>x else xx+560,yy+65);c.line([p,q],arrow=True);c.text((p[0]+q[0])/2,y-80,label,650,size=34)
 else:
  p=(x+280,y+130);q=(xx+280,yy);mid=(p[1]+q[1])/2;c.line([p,(p[0],mid),(q[0],mid),q],arrow=True);c.text(1530 if p[0]==1870 else 1450,mid-85,label,560,size=34,background=True)
edge('NHAP','CHO_TIEP_NHAN','gửi [đủ trường]');edge('CHO_TIEP_NHAN','CHO_BO_SUNG','thiếu [có căn cứ]');edge('CHO_TIEP_NHAN','DA_TIEP_NHAN','tiếp nhận [hợp lệ]');edge('DA_TIEP_NHAN','DANG_THU_LY','phân công [còn quyền]');edge('DANG_THU_LY','TRINH_DUYET','trình [đủ ý kiến]');edge('CHO_BO_SUNG','TU_CHOI','không thể hoàn thiện [được duyệt]');edge('DANG_THU_LY','KHONG_GIAI_QUYET','kết luận [có căn cứ]');edge('DANG_THU_LY','DUNG','dừng [có quyết định]')
c.text(1100,1660,'Bổ sung quay lại giai đoạn đã lưu. Sau TRINH_DUYET: ký duyệt, phát hành, xác nhận giao.',2060,size=36,background=True);c.save('trang_thai_HoSo')

# Vai trò chung kế thừa quyền dùng chung; đây không phải cây cơ cấu tổ chức.
c=Canvas(2000,900);c.text(1000,20,'Phân cấp tác nhân cán bộ theo vai trò',1870,bold=True);c.actor(1000,100,'Cán bộ được phân quyền')
roles=['Tiếp nhận','Thụ lý','Lãnh đạo','Văn thư','Tài chính','Quản trị']
for i,r in enumerate(roles):
 x=160+i*330;c.actor(x,570,r);c.line([(x,570),(x,430),(1000,430),(1000,405)]);c.poly([(1000,365),(980,405),(1020,405)])
c.text(1000,830,'Chuyên biệt hóa trỏ về tác nhân chung; từng quyền vẫn kiểm tra cơ quan và thời gian hiệu lực.',1870,size=34);c.save('phan_cap_tac_nhan')

c=Canvas(2000,1140);c.text(1000,20,'Các gói trách nhiệm của thiết kế',1860,bold=True)
for g,name in GROUPS.items():
 i=g-1;x=70+(i%3)*650;y=130+(i//3)*300;c.rect(x,y,580,220);c.rect(x,y-30,220,30);c.text(x+290,y+35,str(g)+'. '+name,530,bold=True)
 if g in [4,7]:c.line([(x+290,y),(x+290,y-80)],dash=True,arrow=True)
c.line([(720,540),(650,540)],dash=True,arrow=True)
c.text(1000,1050,'Mũi tên nét đứt chỉ phụ thuộc được minh họa; ma trận phụ thuộc ghi đầy đủ trong tài liệu.',1850,size=34);c.save('goi_he_thong')

c=Canvas(2000,1170);c.text(1000,20,'Các thành phần và giao tiếp cần cung cấp',1840,bold=True)
names=['Giao diện cán bộ','Nghiệp vụ hồ sơ','Bộ tích hợp','Kho dữ liệu']
for i,name in enumerate(names):
 x=90+(i%2)*1040;y=170+(i//2)*580;c.box(x,y,760,230,'«thành phần»\n'+name);c.rect(x+690,y+30,45,65);c.rect(x+670,y+35,30,15);c.rect(x+670,y+65,30,15)
for a,b,label in [(0,1,'Giao tiếp tác nghiệp'),(1,3,'Lưu trữ theo hợp đồng'),(1,2,'Trao đổi sự kiện')]:
 x=470+(a%2)*1040;y=285+(a//2)*580;xx=470+(b%2)*1040;yy=285+(b//2)*580
 if y==yy:c.line([(x+380,y),(xx-380,y)],dash=True,arrow=True);c.text((x+xx)/2,420,label,670,size=36,background=True)
 else:
  c.line([(x,y+115),(x,600),(xx,600),(xx,yy-115)],dash=True,arrow=True)
  if a==1 and b==3:c.text(1760,470,label,440,size=36,background=True)
  else:c.text((x+xx)/2,620,label,970,size=36,background=True)
c.text(1000,1090,'Hợp đồng xác thực, dữ liệu và xử lý lỗi được đặc tả riêng; thành phần có thể cùng ứng dụng.',1850,size=34);c.save('thanh_phan_he_thong')

c=Canvas(2000,1150);c.text(1000,20,'Triển khai tham chiếu theo vùng kiểm soát',1840,bold=True)
for i,name in enumerate(['Vùng kết nối bên ngoài\nCổng kết nối và xác thực','Vùng ứng dụng\nTác nghiệp và tiến trình nền','Vùng dữ liệu\nCSDL, tệp và bản sao']):
 x=70+i*650;y=250;c.poly([(x,y),(x+30,y-30),(x+610,y-30),(x+580,y)]);c.poly([(x+580,y),(x+610,y-30),(x+610,y+410),(x+580,y+440)]);c.box(x,y,580,440,'«nút triển khai»\n'+name)
 if i:c.line([(x-70,470),(x,470)],arrow=True)
c.box(300,850,1400,180,'Vùng quản trị riêng\nTruy cập được cấp phép, giám sát và quản lý bí mật');c.text(1000,735,'Chỉ mở giao tiếp đã được duyệt giữa các vùng.',1790,size=36,background=True);c.save('trien_khai_uml')

c=Canvas(2000,1200);c.text(1000,20,'Cộng tác trong phát hành kết quả',1840,bold=True)
boxes=[(70,150,'mh: GiaoDienKetQua'),(1170,150,'dk: DieuKhienKetQua'),(70,650,'kq: KetQua'),(1170,650,'kho: KhoDuLieu')]
for x,y,t in boxes:c.box(x,y,760,170,t)
c.line([(830,235),(1170,235)],arrow=True);c.text(1000,355,'1. phatHanh(dữ liệu, phiên bản)',1500,size=36,background=True)
c.line([(1550,320),(1550,475),(450,475),(450,650)],arrow=True);c.text(930,500,'2. Kiểm tra chữ ký và bản được duyệt',850,size=36,background=True)
c.line([(1550,320),(1550,650)],arrow=True);c.text(1775,360,'3. Lưu bản phát hành, nhật ký và thông điệp cùng giao dịch',380,size=36,background=True)
c.text(1000,940,'4. Chỉ sau khi lưu thành công, tiến trình nền lấy thông điệp để gửi.',1840,size=36,background=True);c.text(1000,1060,'Thứ tự thông điệp được đánh số; liên kết biểu thị đối tượng trao đổi.',1840,size=36,background=True);c.save('cong_tac_phat_hanh')

c=Canvas(2000,1050);c.text(1000,20,'Lớp phân tích của Use case tiếp nhận',1840,bold=True)
labs=['«giao diện»\nManHinhTiepNhan\n+ guiLenh()','«điều khiển»\nDieuKhienHoSo\n+ tiepNhan()','«thực thể»\nHoSo\n− phien_ban: SốNguyên\n+ tiepNhan()','KhoHoSo\n+ luuGiaoDich()']
for i,lab in enumerate(labs):x=80+(i%2)*1040;y=130+(i//2)*500;c.box(x,y,780,300,lab)
c.line([(860,280),(1120,280)],dash=True,arrow=True);c.line([(1510,430),(1510,560),(470,560),(470,630)],dash=True,arrow=True);c.line([(1510,430),(1510,630)],dash=True,arrow=True);c.save('lop_phan_tich_tiep_nhan')
print('Đã bổ sung sáu vòng đời đối tượng, tác nhân, gói, thành phần, triển khai, cộng tác và lớp phân tích.')
