from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from hashlib import sha256
from lxml import etree as E
import json, shutil

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
Q=ROOT/'05_Doi_chieu/Mo_dau_20261003'
Q.mkdir(exist_ok=True)
backup=Q/'Ban_truoc_sua.docx'
if not backup.exists(): shutil.copy2(DOC,backup)
old_pages=ROOT/'05_Doi_chieu/Bien_tap_lai_20261003/Trang'
(Q/'Trang_truoc_sua.json').write_text(json.dumps({p.name:sha256(p.read_bytes()).hexdigest() for p in old_pages.glob('trang_*.png')}),encoding='utf-8')
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
N={'w':W}
tag=lambda n:f'{{{W}}}{n}'
thanks=[
    'Em xin gửi lời cảm ơn chân thành đến thầy Hoàng Minh Ngọc, giảng viên hướng dẫn bài báo cáo trong học phần Hệ thống thông tin quản lý hành chính. Những kiến thức của học phần đã giúp em hiểu rõ hơn cách một hệ thống thông tin phục vụ công việc của cơ quan nhà nước và nhu cầu của người dân. Đây là cơ sở để em lựa chọn Hệ thống thông tin giải quyết thủ tục hành chính thành phố Hà Nội làm đối tượng nghiên cứu, xác định các vấn đề cần phân tích và xây dựng bản thiết kế phù hợp với phạm vi đề tài.',
    'Em cũng xin cảm ơn các thầy, cô tại Học viện Hành chính và Quản trị công đã giảng dạy những kiến thức nền tảng trong quá trình học tập. Các nội dung về quản lý, cơ sở dữ liệu và phân tích thiết kế hệ thống giúp em xem xét một hồ sơ hành chính từ lúc được tiếp nhận đến khi trả kết quả và lưu trữ. Qua việc vận dụng kiến thức vào báo cáo, em có dịp tìm hiểu kỹ hơn trách nhiệm của từng người tham gia, mối liên hệ giữa các công việc và những thông tin cần được lưu lại trong quá trình giải quyết hồ sơ.',
    'Em trân trọng cảm ơn các cơ quan, đơn vị đã công bố văn bản, danh mục thủ tục và tài liệu hướng dẫn trên các trang thông tin chính thức. Những nguồn tài liệu này giúp em có căn cứ để tìm hiểu hệ thống đang được sử dụng tại Hà Nội, đối chiếu quy trình nghiệp vụ và phân biệt thông tin đã được công bố với phần thiết kế do báo cáo đề xuất. Em đã ghi nguồn cho các tài liệu, số liệu và hình ảnh được sử dụng để người đọc có thể tra cứu và kiểm tra lại.',
    'Do kiến thức chuyên môn và kinh nghiệm nghiên cứu còn hạn chế, báo cáo có thể còn thiếu sót trong cách phân tích nghiệp vụ, xây dựng mô hình và trình bày giải pháp. Em mong nhận được những nhận xét của thầy cùng các thầy, cô để nhận ra các điểm chưa hợp lý, chỉnh sửa bản thiết kế và hiểu sâu hơn về việc ứng dụng hệ thống thông tin trong quản lý hành chính. Những góp ý đó cũng sẽ giúp em rèn luyện cách nghiên cứu và trình bày một vấn đề có căn cứ trong các học phần tiếp theo.',
    'Em xin chân thành cảm ơn!'
]
declaration=[
    'Em là Lê Quóc Huy, mã sinh viên 2305HTTB011, xin cam đoan về tính trung thực của nội dung trình bày trong báo cáo với đề tài “Phân tích và thiết kế hướng đối tượng Hệ thống giải quyết thủ tục hành chính Hà Nội”, được thực hiện trong học phần Hệ thống thông tin quản lý hành chính dưới sự hướng dẫn của thầy Hoàng Minh Ngọc. Em chịu trách nhiệm về việc lựa chọn tài liệu, sử dụng thông tin và các nhận định được đưa ra trong báo cáo.',
    'Các văn bản, số liệu, hình ảnh và tài liệu hướng dẫn được sử dụng đều được ghi nguồn để có thể đối chiếu. Các số liệu về thủ tục hành chính được ghi kèm thời điểm công bố để người đọc có thể đối chiếu đúng bối cảnh sử dụng. Các nội dung tham khảo được trích dẫn rõ ràng và phân biệt với những nhận xét, phân tích do em trình bày.',
    'Các mô hình lớp, biểu đồ tương tác, bản thiết kế màn hình và phương án triển khai là kết quả phân tích, đề xuất trong phạm vi đề tài. Việc nghiên cứu dựa trên tài liệu và giao diện công khai; báo cáo không xác nhận kiến trúc nội bộ, mã nguồn hoặc dữ liệu nghiệp vụ chưa được tiếp cận. Các kịch bản kiểm thử được xây dựng để phục vụ việc triển khai sau này và được ghi rõ là chưa thực hiện trên phần mềm của thành phố Hà Nội.',
    'Em cam kết không trình bày thông tin chưa được kiểm chứng như một kết quả khảo sát hoặc kiểm thử đã thực hiện. Nếu phát hiện sai sót về nguồn, số liệu hay cách diễn giải, em có trách nhiệm kiểm tra và sửa lại. Em xin chịu trách nhiệm trước giảng viên, Bộ môn và Nhà trường về nội dung báo cáo, đồng thời tuân thủ các quy định về trích dẫn và liêm chính học thuật.',
    'Em xin trân trọng cam đoan!'
]
with ZipFile(DOC) as z:
    entries=z.infolist(); data={i.filename:z.read(i.filename) for i in entries}
tree=E.fromstring(data['word/document.xml'])
body=tree.find('w:body',N)
text=lambda p:''.join(p.xpath('.//w:t/text()',namespaces=N))
start=next(p for p in body.findall('w:p',N) if text(p)=='LỜI CẢM ƠN')
middle=next(p for p in body.findall('w:p',N) if text(p)=='LỜI CAM ĐOAN')
end=next(p for p in body.findall('w:p',N) if text(p)=='MỤC LỤC')
body_template=deepcopy(start.getnext())
def new_paragraph(value,closing=False):
    p=E.Element(tag('p'),dict(body_template.attrib))
    props=body_template.find('w:pPr',N)
    if props is not None: p.append(deepcopy(props))
    r=E.SubElement(p,tag('r'))
    old_r=body_template.find('w:r',N)
    if old_r is not None and old_r.find('w:rPr',N) is not None:
        r.append(deepcopy(old_r.find('w:rPr',N)))
    t=E.SubElement(r,tag('t')); t.text=value
    return p
def replace_between(first,last,values):
    cursor=first.getnext()
    while cursor is not last:
        nxt=cursor.getnext(); body.remove(cursor); cursor=nxt
    for value in values:
        p=new_paragraph(value)
        first.addnext(p);first=p
replace_between(start,middle,thanks)
replace_between(middle,end,declaration)
data['word/document.xml']=E.tostring(tree,xml_declaration=True,encoding='UTF-8',standalone=True)
temp=DOC.with_suffix('.edited.docx')
with ZipFile(temp,'w',ZIP_DEFLATED) as z:
    for i in entries:z.writestr(i,data[i.filename])
temp.replace(DOC)
result={'thanks_paragraphs':len(thanks),'thanks_words':sum(len(x.split()) for x in thanks),'declaration_paragraphs':len(declaration),'declaration_words':sum(len(x.split()) for x in declaration),'changed_part':'word/document.xml','retained_actor_section':'3.1. Tác nhân và phạm vi trách nhiệm','docx_sha256':sha256(DOC.read_bytes()).hexdigest()}
(Q/'Noi_dung_sua.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
