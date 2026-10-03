from pathlib import Path
root=Path(__file__).resolve().parents[1]
for p in (root/'02_Noi_dung').glob('*.md'):
 t=p.read_text(encoding='utf-8')
 t=t.replace('Toàn bộ 29 bảng','Toàn bộ 35 bảng').replace('29 thực thể','35 thực thể')
 t=t.replace('64 ca, truy vết','95 ca, truy vết')
 t=t.replace('Toàn bộ 64 ca của bộ thiết kế, gồm 44 ca trọng tâm và 20 ca bổ sung, có trạng thái chưa thực hiện.','Bộ ca từ mục 6.3 đến 6.8 có 64 ca, gồm 44 ca trọng tâm và 20 ca bổ sung, đều chưa thực hiện; mục 6.9 tiếp tục bổ sung ca đối chiếu từng chức năng.')
 if p.name=='04_Thiet_ke.md':
  start=t.index('### 4.8.3.');tail=t[start:];t=t[:start]
  pos=t.index('## 4.9.');t=t[:pos]+tail+'\n'+t[pos:]
 p.write_text(t,encoding='utf-8')
p=root/'06_Cong_cu/tao_thiet_ke.py';t=p.read_text(encoding='utf-8')
t=t.replace('29 bảng với kiểu','35 bảng với kiểu')
t=t.replace('Trường hợp chuyên sâu là nhánh cấp bản sao trích lục hộ tịch tại Sở Tư pháp theo phương án kèm Quyết định 1811/QĐ-TTPVHCC.','Phạm vi gồm chín nhóm, 31 chức năng và hai mươi khía cạnh. Hai trường hợp đối chiếu là nhánh hộ tịch theo Quyết định 1811 và cấp bản sao từ sổ gốc theo Quyết định 663. Các địa chỉ công khai và nhánh hoạt động được giải thích tại mục 2.10 của báo cáo.')
t=t.replace('* `Kich_ban_kiem_thu.csv`: bộ kịch bản; trạng thái chưa thực hiện.','* `Kich_ban_kiem_thu.csv`: 95 ca, gồm 31 ca CF tương ứng 31 chức năng CN; tất cả chưa thực hiện.')
p.write_text(t,encoding='utf-8')
p=root/'06_Cong_cu/kiem_tra_bao_cao.py';t=p.read_text(encoding='utf-8')
t=t.replace('đủ 29 thực thể\',len(schema)==29','đủ 35 thực thể\',len(schema)==35')
t=t.replace("'Có 64 ca và", "'Có 95 ca và").replace('len(cases)==64','len(cases)==95')
t=t.replace('Ba mươi nguồn','Ba mươi mốt nguồn').replace('len(declared)==30','len(declared)==31')
p.write_text(t,encoding='utf-8')
p=root/'06_Cong_cu/ghi_nhan_bo_sung.py';t=p.read_text(encoding='utf-8')
t=t.replace('29 thực thể','35 thực thể').replace('64 kịch bản','95 kịch bản').replace('30 tài liệu','31 tài liệu').replace('30 nguồn','31 nguồn').replace('29 thực thể','35 thực thể').replace('64 ca','95 ca').replace('20 sơ đồ','21 sơ đồ')
t=t.replace('chín nhóm chức năng và hai mươi khía cạnh','chín nhóm, 31 chức năng và hai mươi khía cạnh')
p.write_text(t,encoding='utf-8')
print('Đã thống nhất phạm vi, dữ liệu, bộ ca và thứ tự các mục.')
