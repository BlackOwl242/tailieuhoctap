from __future__ import annotations

import re
from copy import deepcopy
from collections import defaultdict
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Twips
from docx.text.paragraph import Paragraph
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "04_Bao_cao" / "Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx"
MODEL = ROOT / "03_Thiet_ke" / "Huong_doi_tuong"
DIAGRAMS = MODEL / "So_do"
UI = ROOT / "03_Thiet_ke" / "Anh_giao_dien_he_thong"


def set_text(paragraph: Paragraph, text: str) -> None:
    for child in list(paragraph._p):
        if child.tag != qn("w:pPr"):
            paragraph._p.remove(child)
    paragraph.add_run(text)


def add_sequence_field(paragraph: Paragraph, name: str, result: int, reset: bool = False) -> None:
    instruction = f" SEQ {name} \\r {result} " if reset else f" SEQ {name} "
    for kind, value in (("begin", None), ("instr", instruction), ("separate", None), ("text", str(result)), ("end", None)):
        run = OxmlElement("w:r")
        if kind in ("begin", "separate", "end"):
            fld = OxmlElement("w:fldChar")
            fld.set(qn("w:fldCharType"), kind)
            run.append(fld)
        elif kind == "instr":
            instr = OxmlElement("w:instrText")
            instr.set(qn("xml:space"), "preserve")
            instr.text = value
            run.append(instr)
        else:
            text = OxmlElement("w:t")
            text.text = value
            run.append(text)
        paragraph._p.append(run)


def make_heading(doc: Document, text: str, level: int) -> Paragraph:
    paragraph = doc.add_paragraph(text, style=f"Heading {level}")
    paragraph.paragraph_format.keep_with_next = True
    paragraph._p.getparent().remove(paragraph._p)
    return paragraph


def make_caption(doc: Document, text: str, result: int) -> Paragraph:
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.keep_together = True
    run = paragraph.add_run("Hình 2.")
    run.italic = True
    run.font.size = Pt(11)
    add_sequence_field(paragraph, "Hình", result)
    run = paragraph.add_run(": " + text)
    run.italic = True
    run.font.size = Pt(11)
    paragraph._p.getparent().remove(paragraph._p)
    return paragraph


def insert_local_ui_section(doc: Document) -> bool:
    # Move this evidence section after the analytical and design diagrams.
    body = doc.element.body
    references = next(p for p in doc.paragraphs if p.style.name == "Heading 1" and p.text.strip() == "TÀI LIỆU THAM KHẢO")
    for heading in list(doc.paragraphs):
        if heading.style.name not in ("Heading 1", "Heading 2") or not heading.text.strip().startswith(("2.6.", "4.6.", "CHƯƠNG 8.")):
            continue
        start = list(body).index(heading._p)
        if heading.text.strip().startswith("2.6."):
            stop_paragraph = next(p for p in doc.paragraphs if p.style.name == "Heading 1" and p.text.strip().startswith("CHƯƠNG 3."))
        elif heading.text.strip().startswith("4.6."):
            stop_paragraph = next(p for p in doc.paragraphs if p.style.name == "Heading 1" and p.text.strip().startswith("CHƯƠNG 5."))
        else:
            stop_paragraph = references
        stop = list(body).index(stop_paragraph._p)
        for node in list(body)[start:stop]:
            body.remove(node)

    screenshots = [
        (UI / "01_cong_dan_may_tinh.jpg", "Cổng thông tin người dân trên màn hình rộng"),
        (UI / "02_cong_dan_dien_thoai.jpg", "Cổng thông tin người dân trên điện thoại"),
        (UI / "03_dang_nhap_can_bo.jpg", "Đăng nhập bàn làm việc cán bộ"),
        (UI / "04_tong_quan_can_bo.jpg", "Tổng quan công việc và hồ sơ cần chú ý"),
        (UI / "05_hop_xu_ly.jpg", "Danh sách hồ sơ trong hộp xử lý"),
        (UI / "06_chi_tiet_ho_so.jpg", "Chi tiết hồ sơ, lịch sử và thao tác theo vai trò"),
        (UI / "07_quan_ly_tai_khoan.jpg", "Quản lý đề nghị cấp quyền và tài khoản cán bộ"),
        (UI / "08_giam_sat_quy_trinh.jpg", "Giám sát thời hạn, tồn đọng, phân công và chất lượng phục vụ"),
        (UI / "09_danh_muc_thu_tuc.jpg", "Tra cứu danh mục thủ tục và tình trạng kiểm chứng nguồn"),
        (UI / "10_nhat_ky_ho_so.jpg", "Nhật ký hồ sơ có lọc phạm vi và liên kết về hồ sơ"),
        (UI / "11_ket_noi_dich_vu.jpg", "Tình trạng kết nối, dịch vụ phụ thuộc và hàng chờ cục bộ"),
    ]
    for path, _ in screenshots:
        if not path.exists():
            raise FileNotFoundError(path)

    chapter_heading = make_heading(doc, "CHƯƠNG 8. GIAO DIỆN ỨNG DỤNG ĐÃ XÂY DỰNG", 1)
    chapter_heading.paragraph_format.page_break_before = True
    nodes = [chapter_heading, make_heading(doc, "8.1. Phân hệ cán bộ và các luồng tương tác", 2)]
    intro = doc.add_paragraph(
        "Bàn làm việc cán bộ gồm các nhóm việc thường ngày: xem tổng quan; tiếp nhận, phân công và xử lý hồ sơ; theo dõi hạn; tra cứu thủ tục; xem nhật ký; quản lý tài khoản; kiểm tra trạng thái kết nối. Từ mỗi màn hình, người dùng có thể mở danh sách hoặc hồ sơ liên quan. API kiểm tra vai trò, phạm vi cơ quan và trạng thái trước khi lưu thao tác."
    )
    nodes.append(intro)
    intro._p.getparent().remove(intro._p)
    note = doc.add_paragraph(
        "Hồ sơ và tài khoản trong ảnh được tạo riêng để kiểm tra giao diện. Đây là dữ liệu giả lập, không phải thông tin công dân hay tài khoản công vụ. Ứng dụng hiện chạy độc lập; chưa nhận hồ sơ từ Hà Nội hoặc Cổng Dịch vụ công quốc gia, chưa thu phí và chưa ký số."
    )
    note._p.getparent().remove(note._p)
    nodes.append(note)

    scope = doc.add_paragraph(
        "Ảnh dưới đây được chụp trực tiếp từ giao diện React và máy chủ Python của đề tài. Một số thao tác nội bộ như tiếp nhận, phân công, trình duyệt và ghi nhật ký có kiểm tra quyền, phạm vi cơ quan, trạng thái hồ sơ và thời hạn tài khoản. Dữ liệu trong ảnh chỉ dùng để kiểm tra; danh mục thủ tục được gắn mức độ đối chiếu riêng."
    )
    scope._p.getparent().remove(scope._p)
    nodes.append(scope)
    boundary = doc.add_paragraph(
        "Bàn cán bộ trong chương này là ứng dụng độc lập, không phải phần mềm tác nghiệp chính thức của Hà Nội. Ảnh cho thấy những màn hình đã dựng và một phần luồng đã chạy; các chức năng còn lại trong use case vẫn là yêu cầu thiết kế. Ký số, thanh toán, phát hành kết quả, đồng bộ định danh và liên thông chưa được kết nối hoặc xác nhận trên môi trường thật."
    )
    boundary._p.getparent().remove(boundary._p)
    nodes.append(boundary)

    nodes.append(make_heading(doc, "8.2. Phân quyền và kết quả kiểm tra ứng dụng", 2))
    access = doc.add_paragraph(
        "Người dân không tạo tài khoản tại ứng dụng này; giao dịch trực tuyến được chuyển sang Cổng Dịch vụ công quốc gia. Tài khoản cán bộ do quản trị viên lập đề nghị và một quản trị viên khác duyệt; quyền gắn với vai trò, cơ quan, thời hạn và phạm vi được giao. Máy chủ lọc hồ sơ theo vai trò, cơ quan và phân công; tài khoản quản trị chỉ quản lý tài khoản, không được mở, tải hoặc xuất hồ sơ công dân. Quyền ký Mẫu 06 được cấp riêng sau khi đối chiếu văn bản phân công và có thể thu hồi. Cơ sở dữ liệu ứng dụng hiện chưa có tài khoản cán bộ; tài khoản dùng trong kiểm thử chỉ nằm trên cơ sở dữ liệu tạm. Giao diện chưa hỗ trợ khóa tài khoản hoặc đề nghị, duyệt thay đổi vai trò, cơ quan và thời hạn sau khi cấp; cần hoàn thiện vòng đời này trước khi vận hành thật."
    )
    access._p.getparent().remove(access._p)
    nodes.append(access)
    test_result = doc.add_paragraph(
        "Bốn bài kiểm tra HTTP hồi quy đã chạy đạt trên cơ sở dữ liệu tạm: cổng công khai và chặn đăng ký công dân; tách quyền quản trị khỏi dữ liệu hồ sơ; kiểm tra CSRF, phạm vi cơ quan, phân công, phiên bản và luồng tiếp nhận, phân công, dự thảo, trình duyệt, phê duyệt; xác nhận lệnh phát hành bị chặn khi chưa có kết nối; cấp quyền qua hai quản trị viên, đổi mật khẩu lần đầu, cấp và thu hồi quyền ký Mẫu 06. Đây là kiểm tra tập trung cho các luồng đang có. Bộ 180 ca hướng đối tượng và 101 ca tổng hợp trong thiết kế chưa được chạy đầy đủ; các kiểm tra này cũng không thay cho kết nối hoặc nghiệm thu trên hệ thống chính phủ."
    )
    test_result._p.getparent().remove(test_result._p)
    nodes.append(test_result)
    legal_gap = doc.add_paragraph(
        "Ứng dụng chưa thực hiện đầy đủ quy trình số hóa theo Thông tư 14/2026/TT-BTP: kiểm đếm và bảo đảm thứ tự trang; bóc tách OCR hoặc nhập tay đủ dữ liệu đặc tả; cấp mã kết quả số hóa; ký số bản chụp và dữ liệu theo đúng trách nhiệm; lưu vào kho dữ liệu có giá trị pháp lý. Việc nhận tệp hiện tại không được coi là đã số hóa. Ứng dụng cũng chưa có kết nối dữ liệu, ký số, thanh toán trực tuyến, phát hành kết quả hay đồng bộ trạng thái với Cổng quốc gia và VNeID. Vì vậy, không thể xếp phần mềm này là dịch vụ công trực tuyến toàn trình hoặc khẳng định tương đương hệ thống đang vận hành."
    )
    legal_gap._p.getparent().remove(legal_gap._p)
    nodes.append(legal_gap)

    for number, (path, caption_text) in enumerate(screenshots, start=1):
        image_paragraph = doc.add_paragraph()
        image_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        image_paragraph.paragraph_format.page_break_before = True
        image_paragraph.paragraph_format.keep_with_next = True
        width, height = Image.open(path).size
        width_twips = min(9072, int(10400 * width / height))
        inline = image_paragraph.add_run().add_picture(str(path), width=Twips(width_twips))
        inline._inline.docPr.set("title", caption_text)
        inline._inline.docPr.set("descr", caption_text)
        image_paragraph._p.getparent().remove(image_paragraph._p)
        caption = make_caption(doc, caption_text, number)
        set_text(caption, "")
        caption.add_run("Hình 8.")
        add_sequence_field(caption, "Hình", number, reset=(number == 1))
        caption.add_run(": " + caption_text)
        nodes.extend((image_paragraph, caption))

    anchor_index = list(body).index(references._p)
    for offset, node in enumerate(nodes):
        body.insert(anchor_index + offset, node._p)
    return True


def extend_front_matter(doc: Document) -> bool:
    # A template merge left the same title page twice. Remove the later copy
    # before locating the front-matter headings so the export starts cleanly.
    paragraphs = list(doc.paragraphs)
    ack_index = next(i for i, p in enumerate(paragraphs) if p.style.name == "Heading 1" and p.text.strip() == "LỜI CẢM ƠN")
    cover_markers = [i for i, p in enumerate(paragraphs[:ack_index]) if p.text.strip() == "HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH"]
    changed = False
    if len(cover_markers) > 1:
        first_cover_end = next(
            (p for p in paragraphs[cover_markers[0]:cover_markers[1]] if p.text.strip() == "Hà Nội - 2026"),
            paragraphs[cover_markers[1] - 1],
        )
        duplicate_cover = paragraphs[cover_markers[1]:ack_index]
        original_section_break = next(
            (
                p._p.pPr.find(qn("w:sectPr"))
                for p in reversed(duplicate_cover)
                if p._p.pPr is not None and p._p.pPr.find(qn("w:sectPr")) is not None
            ),
            None,
        )
        if original_section_break is not None:
            first_cover_ppr = first_cover_end._p.get_or_add_pPr()
            existing_section_break = first_cover_ppr.find(qn("w:sectPr"))
            if existing_section_break is not None:
                first_cover_ppr.remove(existing_section_break)
            first_cover_ppr.append(deepcopy(original_section_break))
            # The original manual page break was only needed because the
            # duplicate cover occupied the next page. The section break now
            # starts the front matter on that page and keeps page numbering.
            for page_break in list(first_cover_end._p.iter(qn("w:br"))):
                if page_break.get(qn("w:type")) == "page":
                    page_break.getparent().remove(page_break)
        for paragraph in paragraphs[cover_markers[1]:ack_index]:
            paragraph._p.getparent().remove(paragraph._p)
        changed = True

    paragraphs = doc.paragraphs
    ack_heading = next(p for p in paragraphs if p.style.name == "Heading 1" and p.text.strip() == "LỜI CẢM ƠN")
    pledge_heading = next(p for p in paragraphs if p.style.name == "Heading 1" and p.text.strip() == "LỜI CAM ĐOAN")
    contents_heading = next(p for p in paragraphs if p.text.strip() == "MỤC LỤC")

    ack_text = (
        "Em xin trân trọng cảm ơn giảng viên Hoàng Minh Ngọc đã hướng dẫn học phần Hệ thống thông tin quản lý hành chính và góp ý cách tiếp cận đề tài. Những nội dung về phân tích quy trình, mô hình hóa dữ liệu, trách nhiệm nghiệp vụ và tổ chức vận hành giúp em đặt bài toán phần mềm trong bối cảnh phục vụ người dân và cơ quan nhà nước.",
        "Em cảm ơn các cơ quan đã công khai văn bản, hướng dẫn thủ tục, thông tin về Trung tâm Phục vụ hành chính công Hà Nội và các trang dịch vụ trực tuyến. Việc đối chiếu nguồn giúp em phân biệt thông tin hiện hành, tư liệu lịch sử và nội dung cần xác minh thêm khi chưa được tiếp cận hệ thống nội bộ.",
        "Trong quá trình thực hiện, em đã tổng hợp các nhánh dịch vụ, xây dựng 36 use case, mô hình dữ liệu và phần mềm nghiên cứu cục bộ để minh họa giao diện cùng một số luồng xử lý. Đây là kết quả học tập để tiếp tục nhận góp ý; thiết kế và phần mềm chưa được cơ quan nghiệp vụ xác nhận hoặc kết nối vào hệ thống đang vận hành.",
        "Em mong nhận được nhận xét của giảng viên về căn cứ, cách trình bày và những điểm cần khảo sát thêm. Em sẽ dùng các góp ý đó để sửa phần chưa rõ, bổ sung nguồn kiểm chứng và hoàn thiện thiết kế trong phạm vi dữ liệu được phép tiếp cận.",
    )
    pledge_text = (
        "Em cam đoan báo cáo do em thực hiện trên cơ sở các tài liệu được dẫn nguồn và hồ sơ nghiên cứu của đề tài. Văn bản pháp lý, thông tin công khai và ảnh giao diện từ nguồn bên ngoài được ghi theo xuất xứ; phần tổng hợp, nhận định và thiết kế do em xây dựng được trình bày trong đúng phạm vi của chúng.",
        "Các mô hình, màn hình và quy tắc trong báo cáo là phương án phân tích, thiết kế cho ứng dụng nghiên cứu cục bộ. Ảnh giao diện tại Chương 8 được chụp từ phần mềm do em xây dựng trong thư mục dự án; đó không phải ảnh bàn cán bộ hay giao dịch trên hệ thống chính thức của thành phố Hà Nội. Dữ liệu minh họa không được giới thiệu là hồ sơ thật của người dân.",
        "Em chưa được cấp quyền khảo sát tài khoản cán bộ, mã nguồn, dữ liệu nội bộ hoặc hợp đồng kết nối của hệ thống Hà Nội. Vì vậy, báo cáo không khẳng định đã sao chép đầy đủ cấu hình nội bộ, đã tích hợp hoặc đã kiểm thử trên môi trường thật. Nội dung chưa thể xác nhận được ghi rõ thành giới hạn hoặc yêu cầu khảo sát tiếp; kết quả kiểm tra mô hình không được xem là bằng chứng kiểm thử hệ thống đang vận hành.",
    )

    def set_section(heading: Paragraph, next_heading: Paragraph, desired: tuple[str, ...]) -> bool:
        section_paragraphs = list(doc.paragraphs)
        start = next(i for i, p in enumerate(section_paragraphs) if p._p is heading._p)
        end = next(i for i, p in enumerate(section_paragraphs) if p._p is next_heading._p)
        existing = [p for p in section_paragraphs[start + 1:end] if p.text.strip()]
        section_changed = False
        for index, text in enumerate(desired):
            if index < len(existing):
                if existing[index].text.strip() != text:
                    set_text(existing[index], text)
                    section_changed = True
            else:
                next_heading.insert_paragraph_before(text, style="Normal")
                section_changed = True
        for paragraph in existing[len(desired):]:
            paragraph._p.getparent().remove(paragraph._p)
            section_changed = True
        return section_changed

    changed = set_section(ack_heading, pledge_heading, ack_text) or changed
    changed = set_section(pledge_heading, contents_heading, pledge_text) or changed

    note_prefix = "Giảng viên hướng dẫn:"
    for paragraph in list(doc.paragraphs):
        text = paragraph.text.strip()
        if text.startswith(note_prefix) and (
            "Mốc quan sát" in text or "ảnh ứng dụng nghiên cứu chụp" in text
        ):
            paragraph._p.getparent().remove(paragraph._p)
            changed = True
        elif "Ảnh giao diện tại mục 2.6" in text or "Ảnh ứng dụng tại mục 4.6" in text:
            paragraph._p.getparent().remove(paragraph._p)
            changed = True

    return changed


def is_group(paragraph: Paragraph) -> re.Match[str] | None:
    if paragraph.style.name != "Heading 2":
        return None
    return re.match(r"^3\.\d+\.\s*Nhóm\s+(\d+)\s*:\s*(.*)$", paragraph.text.strip())


def is_case(paragraph: Paragraph) -> re.Match[str] | None:
    if paragraph.style.name != "Heading 3":
        return None
    return re.match(r"^UC(\d{2})\.", paragraph.text.strip())


def reorder_use_cases(doc: Document) -> bool:
    body = doc.element.body
    all_children = list(body)
    chapter3 = next(p for p in doc.paragraphs if p.style.name == "Heading 1" and p.text.strip().startswith("CHƯƠNG 3."))
    chapter4 = next(p for p in doc.paragraphs if p.style.name == "Heading 1" and p.text.strip().startswith("CHƯƠNG 4."))
    start = all_children.index(chapter3._p) + 1
    end = all_children.index(chapter4._p)
    region = all_children[start:end]

    if any(p.style.name == "Heading 2" and p.text.strip() == "3.2. Phân nhóm mục tiêu nghiệp vụ" for p in doc.paragraphs):
        return False

    group_starts: list[tuple[int, int, Paragraph, re.Match[str]]] = []
    case_starts: list[tuple[int, int, Paragraph, re.Match[str]]] = []
    concurrent_start = None
    for index, child in enumerate(region):
        if child.tag != qn("w:p"):
            continue
        paragraph = Paragraph(child, doc._body)
        group_match = is_group(paragraph)
        case_match = is_case(paragraph)
        if group_match:
            group_starts.append((index, index, paragraph, group_match))
        elif case_match:
            case_starts.append((index, index, paragraph, case_match))
        elif paragraph.style.name == "Heading 2" and paragraph.text.strip().startswith("3.") and "Phối hợp đồng thời" in paragraph.text:
            concurrent_start = index

    if len(group_starts) != 9 or len(case_starts) != 36 or concurrent_start is None:
        raise ValueError(f"Expected 9 groups, 36 cases, and a concurrent section; got {len(group_starts)}, {len(case_starts)}, {concurrent_start}")

    def next_case_after(index: int) -> int:
        return next(item[0] for item in case_starts if item[0] > index)

    groups: list[tuple[int, list]] = []
    for group_start, _, heading, match in group_starts:
        group_end = next_case_after(group_start)
        groups.append((int(match.group(1)), region[group_start:group_end]))

    cases: list[tuple[int, list]] = []
    for case_start, _, heading, match in case_starts:
        stops = [
            item[0]
            for item in group_starts + case_starts
            if item[0] > case_start
        ]
        if concurrent_start > case_start:
            stops.append(concurrent_start)
        case_end = min(stops) if stops else concurrent_start
        cases.append((int(match.group(1)), region[case_start:case_end]))

    first_group = group_starts[0][0]
    prelude = region[:first_group]
    concurrent = region[concurrent_start:]
    covered = [node for _, block in groups for node in block]
    covered += [node for _, block in cases for node in block]
    covered += list(prelude) + list(concurrent)
    if len(covered) != len(region) or {id(node) for node in covered} != {id(node) for node in region}:
        raise ValueError("Chapter 3 block extraction left gaps or overlaps")

    for group_number, block in groups:
        heading = Paragraph(block[0], doc._body)
        title_match = is_group(heading)
        heading.style = doc.styles["Heading 3"]
        heading.text = f"3.2.{group_number}. Nhóm {group_number}: {title_match.group(2).strip()}"
        for run in heading.runs:
            run.bold = False
            run.italic = True

    concurrent_heading = Paragraph(concurrent[0], doc._body)
    concurrent_heading.text = re.sub(r"^3\.\d+\.", "3.4.", concurrent_heading.text.strip(), count=1)

    h2_groups = make_heading(doc, "3.2. Phân nhóm mục tiêu nghiệp vụ", 2)
    h2_cases = make_heading(doc, "3.3. Đặc tả 36 use case theo mã", 2)
    ordered = list(prelude) + [h2_groups._p]
    ordered += [node for _, block in sorted(groups) for node in block]
    ordered.append(h2_cases._p)
    ordered += [node for _, block in sorted(cases) for node in block]
    ordered += list(concurrent)

    for child in region:
        body.remove(child)
    insert_at = list(body).index(chapter4._p)
    for offset, child in enumerate(ordered):
        body.insert(insert_at + offset, child)
    return True


def image_target(caption: str, class_counts: defaultdict[int, int], class_names: dict[int, list[str]]) -> Path | None:
    sequence = re.search(r"Biểu đồ trình tự UC(\d{2})", caption)
    activity = re.search(r"Biểu đồ hoạt động UC(\d{2})", caption)
    if sequence:
        stem = f"UC{sequence.group(1)}_trinh_tu"
    elif activity:
        stem = f"UC{activity.group(1)}_hoat_dong"
    else:
        group = re.search(r"use case nhóm (\d+)(?:, phần (\d+))?", caption, re.IGNORECASE)
        if group:
            stem = f"ca_su_dung_nhom_{group.group(1)}"
            if group.group(2):
                stem += f"_phan_{group.group(2)}"
        else:
            class_group = re.search(r"Biểu đồ lớp miền nhóm (\d+):", caption)
            if class_group:
                number = int(class_group.group(1))
                candidates = class_names[number]
                class_counts[number] += 1
                stem = candidates[class_counts[number] - 1]
            else:
                fixed = {
                    "tổng quát hóa tác nhân cán bộ": "phan_cap_tac_nhan",
                    "Biểu đồ use case tổng thể theo mục tiêu": "ca_su_dung_tong_the",
                    "Biểu đồ hoạt động phối hợp đồng thời trong UC15": "hoat_dong_phoi_hop_song_song",
                    "Biểu đồ lớp phân tích theo mô hình Boundary": "lop_phan_tich_tiep_nhan",
                    "Biểu đồ lớp miền cốt lõi quanh hồ sơ": "lop_mien_cot_loi",
                    "Biểu đồ trạng thái hồ sơ: các nhánh tiếp nhận": "trang_thai_HoSo",
                    "Biểu đồ trạng thái hồ sơ bổ sung và quay lại": "trang_thai_HoSo_bo_sung",
                    "Biểu đồ trạng thái ký duyệt, phát hành": "trang_thai_HoSo_phat_hanh",
                    "Biểu đồ trạng thái: vòng đời kết quả": "trang_thai_KetQua",
                    "Biểu đồ trạng thái: vòng đời khoản thu": "trang_thai_KhoanThu",
                    "Biểu đồ trạng thái: vòng đời nhiệm vụ phối hợp": "trang_thai_NhiemVuPhoiHop",
                    "Biểu đồ trạng thái: vòng đời thông điệp kết nối": "trang_thai_ThongDiep",
                    "Biểu đồ trạng thái: vòng đời gói nộp lưu": "trang_thai_GoiNopLuu",
                    "Biểu đồ gói chức năng và phụ thuộc": "goi_he_thong",
                    "Biểu đồ thành phần thực thi đề xuất": "thanh_phan_he_thong",
                    "Biểu đồ cộng tác đối tượng khi phát hành": "cong_tac_phat_hanh",
                    "Biểu đồ triển khai và vùng truy cập đề xuất": "trien_khai_uml",
                }
                stem = next((name for text, name in fixed.items() if text in caption), "")
                if not stem:
                    return None
    path = DIAGRAMS / f"{stem}.png"
    if not path.exists():
        raise FileNotFoundError(path)
    return path


def refresh_embedded_diagrams(doc: Document) -> int:
    mapping = __import__("json").loads((MODEL / "Anh_xa_lop.json").read_text(encoding="utf-8"))
    class_names: dict[int, list[str]] = defaultdict(list)
    for group, filename, _ in mapping["diagrams"]:
        class_names[int(group)].append(filename)
    class_counts: defaultdict[int, int] = defaultdict(int)
    paragraphs = doc.paragraphs
    replacements = 0
    for index, caption_paragraph in enumerate(paragraphs):
        caption = caption_paragraph.text.strip()
        if not caption.startswith(("Hình 3.", "Hình 4.")) or index == 0:
            continue
        image_paragraph = paragraphs[index - 1]
        blips = image_paragraph._p.xpath(".//a:blip")
        if not blips:
            continue
        target = image_target(caption, class_counts, class_names)
        if target is None:
            continue
        data = target.read_bytes()
        width, height = Image.open(target).size
        width_twips = min(9072, int(10400 * width / height))
        cx = width_twips * 635
        cy = round(cx * height / width)
        for blip in blips:
            rel_id = blip.get(qn("r:embed"))
            if not rel_id:
                continue
            image_part = doc.part.related_parts[rel_id]
            image_part._blob = data
        for extent in image_paragraph._p.xpath(".//wp:extent") + image_paragraph._p.xpath(".//a:ext"):
            extent.set("cx", str(cx))
            extent.set("cy", str(cy))
        replacements += 1
    return replacements


def clean_and_label_uml_figures(doc: Document) -> tuple[int, int]:
    """Remove obsolete MH wireframes and make each UML caption identify its diagram type."""
    paragraphs = list(doc.paragraphs)
    removed = 0
    for index, paragraph in enumerate(paragraphs):
        if not re.search(r"\bMH\d{2};\s*bản thiết kế màn hình", paragraph.text, re.IGNORECASE):
            continue
        if paragraph.style.name.lower() != "table of figures" and index > 0:
            image_paragraph = paragraphs[index - 1]
            if image_paragraph._p.xpath(".//w:drawing"):
                parent = image_paragraph._p.getparent()
                if parent is not None:
                    parent.remove(image_paragraph._p)
        parent = paragraph._p.getparent()
        if parent is not None:
            parent.remove(paragraph._p)
            removed += 1

    case_names = {}
    for paragraph in doc.paragraphs:
        match = re.match(r"^UC(\d{2})\.\s+(.+)$", paragraph.text.strip())
        if match:
            case_names[match.group(1)] = match.group(2)
    fixed = {
        "Phân cấp vai trò cán bộ": "Biểu đồ tổng quát hóa tác nhân cán bộ theo vai trò",
        "use case tổng thể theo mục tiêu": "Biểu đồ use case tổng thể theo mục tiêu",
        "Phân tách giao diện, điều khiển, thực thể và truy xuất": "Biểu đồ lớp phân tích theo mô hình Boundary–Control–Entity",
        "Quan hệ miền cốt lõi quanh hồ sơ": "Biểu đồ lớp miền cốt lõi quanh hồ sơ",
        "Các nhánh tiếp nhận và kết luận": "Biểu đồ trạng thái hồ sơ: các nhánh tiếp nhận và kết luận",
        "Bổ sung quay lại đúng giai đoạn": "Biểu đồ trạng thái hồ sơ bổ sung và quay lại giai đoạn",
        "Ký duyệt, phát hành và xác nhận giao": "Biểu đồ trạng thái ký duyệt, phát hành và giao kết quả",
        "Vòng đời kết quả": "Biểu đồ trạng thái: vòng đời kết quả",
        "Vòng đời khoản thu": "Biểu đồ trạng thái: vòng đời khoản thu",
        "Vòng đời nhiệm vụ phối hợp": "Biểu đồ trạng thái: vòng đời nhiệm vụ phối hợp",
        "Vòng đời thông điệp kết nối": "Biểu đồ trạng thái: vòng đời thông điệp kết nối",
        "Vòng đời gói nộp lưu": "Biểu đồ trạng thái: vòng đời gói nộp lưu",
        "Chín gói chức năng và phụ thuộc": "Biểu đồ gói chức năng và phụ thuộc",
        "Các thành phần thực thi đề xuất": "Biểu đồ thành phần thực thi đề xuất",
        "Cộng tác đối tượng khi phát hành": "Biểu đồ cộng tác đối tượng khi phát hành",
        "Các nút triển khai và vùng truy cập đề xuất": "Biểu đồ triển khai và vùng truy cập đề xuất",
        "Biểu đồ triển khai và vùng truy cập đề xuất": "Biểu đồ triển khai và vùng truy cập đề xuất",
        "Hai nhiệm vụ phối hợp bắt buộc trong UC15": "Biểu đồ hoạt động phối hợp đồng thời trong UC15",
    }
    changed = 0
    for paragraph in doc.paragraphs:
        if paragraph.style.name.lower() == "table of figures":
            continue
        text = paragraph.text.strip()
        if not text.startswith(("Hình 3.", "Hình 4.")) or ": " not in text:
            continue
        suffix = text.split(": ", 1)[1]
        label = None
        sequence = re.match(r"Tương tác một thao tác của UC(\d{2})", suffix)
        activity = re.match(r"Hoạt động một thao tác của UC(\d{2})", suffix)
        group = re.match(r"use case nhóm (\d+)(, phần \d+)?", suffix, re.IGNORECASE)
        classes = re.match(r"Các lớp miền nhóm (\d+):\s*(.*)", suffix)
        if sequence:
            uc = sequence.group(1)
            label = f"Biểu đồ trình tự UC{uc}: {case_names.get(uc, '')}".rstrip()
        elif activity:
            uc = activity.group(1)
            label = f"Biểu đồ hoạt động UC{uc}: {case_names.get(uc, '')}".rstrip()
        elif group:
            label = f"Biểu đồ use case nhóm {group.group(1)}{group.group(2) or ''}"
        elif classes:
            label = f"Biểu đồ lớp miền nhóm {classes.group(1)}: {classes.group(2)}"
        else:
            label = next((value for key, value in fixed.items() if key in suffix), None)
        if label:
            suffix_started = False
            for run in paragraph.runs:
                if suffix_started:
                    if run.text:
                        run.text = ""
                        changed += 1
                elif ": " in run.text:
                    prefix = run.text.split(": ", 1)[0]
                    replacement = f"{prefix}: {label}"
                    if run.text != replacement:
                        run.text = replacement
                        changed += 1
                    suffix_started = True

    for table in doc.tables:
        for row in list(table.rows):
            if len(row.cells) < 2:
                continue
            first = row.cells[0].text.strip()
            second = row.cells[1].text.strip()
            if first == "MH" and "Mã màn hình đề xuất" in second:
                row._tr.getparent().remove(row._tr)
                removed += 1
            elif first == "Truy vết" and re.search(r"Màn hình MH\d{2}\.\s*Thao tác thiết kế:", second):
                for paragraph in row.cells[1].paragraphs:
                    updated = re.sub(r"Màn hình MH\d{2}\.\s*Thao tác thiết kế:", "Thao tác xử lý:", paragraph.text)
                    if updated != paragraph.text:
                        set_text(paragraph, updated)
                        changed += 1
    return removed, changed


def fix_catalog_layout(doc: Document) -> int:
    count = 0
    catalog_style = next(style for style in doc.styles if style.name.lower() == "table of figures")
    style_ppr = catalog_style._element.get_or_add_pPr()
    style_ind = style_ppr.find(qn("w:ind"))
    if style_ind is None:
        style_ind = OxmlElement("w:ind")
        style_ppr.append(style_ind)
    style_ind.set(qn("w:left"), "0")
    style_ind.set(qn("w:firstLine"), "0")
    style_ind.set(qn("w:hanging"), "0")
    style_ind.set(qn("w:right"), "0")
    for paragraph in doc.paragraphs:
        name = paragraph.style.name.lower()
        if name == "table of figures":
            paragraph.paragraph_format.left_indent = Twips(0)
            paragraph.paragraph_format.first_line_indent = Twips(0)
            paragraph.paragraph_format.right_indent = Twips(0)
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            paragraph.paragraph_format.space_before = Pt(0)
            paragraph.paragraph_format.space_after = Pt(2)
            ppr = paragraph._p.get_or_add_pPr()
            ind = ppr.find(qn("w:ind"))
            if ind is None:
                ind = OxmlElement("w:ind")
                ppr.append(ind)
            ind.set(qn("w:left"), "0")
            ind.set(qn("w:firstLine"), "0")
            ind.set(qn("w:hanging"), "0")
            ind.set(qn("w:right"), "0")
            paragraph.paragraph_format.tab_stops.clear_all()
            paragraph.paragraph_format.tab_stops.add_tab_stop(
                Twips(9072), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS
            )
            tabs = ppr.find(qn("w:tabs"))
            if tabs is None:
                tabs = OxmlElement("w:tabs")
                ppr.append(tabs)
            for tab in list(tabs):
                tabs.remove(tab)
            tab = OxmlElement("w:tab")
            tab.set(qn("w:val"), "right")
            tab.set(qn("w:leader"), "dot")
            tab.set(qn("w:pos"), "9072")
            tabs.append(tab)
            count += 1
        elif name in ("toc 1", "toc 2"):
            paragraph.paragraph_format.left_indent = Twips(0 if name == "toc 1" else 360)
            paragraph.paragraph_format.first_line_indent = Twips(0)
            paragraph.paragraph_format.right_indent = Twips(0)
            paragraph.paragraph_format.tab_stops.clear_all()
            paragraph.paragraph_format.tab_stops.add_tab_stop(
                Twips(9072), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS
            )
    return count


def enable_field_refresh(doc: Document) -> None:
    settings = doc.settings.element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")


def update_current_review_results(doc: Document) -> bool:
    old_prefixes = (
        "Bộ kiểm thử hướng đối tượng gồm 180 ca dự kiến",
        "Thiết kế kiểm thử hướng đối tượng gồm 180 ca",
    )
    new_text = (
        "Thiết kế kiểm thử hướng đối tượng gồm 180 ca và bộ kiểm thử tổng hợp gồm 101 ca; cả hai bộ chưa được chạy đầy đủ. "
        "Trong lượt rà soát này, bốn bài kiểm tra HTTP hồi quy đã chạy trên cơ sở dữ liệu tạm: truy cập công khai và chặn đăng ký công dân; "
        "tách quyền quản trị khỏi hồ sơ; kiểm tra CSRF, phạm vi cơ quan, phân công, phiên bản và luồng tiếp nhận, phân công, dự thảo, "
        "trình duyệt, phê duyệt; xác nhận lệnh phát hành vẫn bị chặn khi chưa có kết nối; cấp quyền qua hai quản trị viên, "
        "đổi mật khẩu lần đầu, cấp và thu hồi quyền ký Mẫu 06. Cả bốn bài đạt. Mười một kiểm tra dữ liệu mô hình đã chạy trước đó để kiểm tra "
        "tính duy nhất, tham chiếu bảng, ca đọc, khóa ngoại và tính tới được của máy trạng thái; chúng không thay cho kiểm thử phần mềm. "
        "Kết quả trên không phải kiểm thử tích hợp hoặc nghiệm thu hệ thống chính phủ; chưa có kết nối Cổng Dịch vụ công quốc gia, VNeID, "
        "chữ ký số hay thanh toán để thử."
    )
    changed = False
    for paragraph in doc.paragraphs:
        if paragraph.text.strip().startswith(old_prefixes):
            if paragraph.text.strip() != new_text:
                set_text(paragraph, new_text)
                changed = True
        if paragraph.text.strip().startswith("Trạng thái cần tiếp tục:") and "chưa kiểm thử phần mềm" in paragraph.text:
            set_text(
                paragraph,
                "Trạng thái cần tiếp tục: chưa xác minh đầy đủ chi tiết và hiệu lực hiện hành của 2.075 thủ tục; chưa có tài khoản, ảnh màn hình hoặc phiên thực hiện nộp, ký, thanh toán trên hệ thống Hà Nội; phần mềm cục bộ mới có bốn bài kiểm thử HTTP hồi quy trên dữ liệu tạm và chưa được kiểm thử đầy đủ; chưa có lược đồ đầy đủ tờ khai cho toàn bộ thủ tục. Bản thiết kế không tuyên bố đạt 100% mọi yêu cầu của hệ thống thực.",
            )
            changed = True
    return changed


def main() -> None:
    doc = Document(REPORT)
    changed_front = extend_front_matter(doc)
    changed_ui = insert_local_ui_section(doc)
    removed_legacy_screens, renamed_uml_figures = clean_and_label_uml_figures(doc)
    updated_diagrams = refresh_embedded_diagrams(doc)
    changed_order = reorder_use_cases(doc)
    updated_test_results = update_current_review_results(doc)
    catalog_count = fix_catalog_layout(doc)
    enable_field_refresh(doc)
    doc.save(REPORT)
    print(
        f"front_matter={changed_front}; ui_section={changed_ui}; removed_MH={removed_legacy_screens}; "
        f"renamed_figures={renamed_uml_figures}; diagrams={updated_diagrams}; "
        f"uc_order={changed_order}; test_results={updated_test_results}; catalog_paragraphs={catalog_count}"
    )


if __name__ == "__main__":
    main()
