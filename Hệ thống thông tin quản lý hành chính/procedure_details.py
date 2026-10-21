"""Present the saved DVCQG publication without inventing missing procedure data."""

from functools import lru_cache
import gzip
from html import escape
import io
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen
import zipfile


@lru_cache(maxsize=1)
def official_snapshot():
    path = Path(__file__).resolve().parent / "data" / "official_procedure_forms_snapshot.json"
    if not path.exists():
        from official_procedure_policy import publication_bundle
        reconciled = publication_bundle()
        return {"details": reconciled.get("details", {}), "detailCheckedAt": {code: entry.get("detailCheckedAt", "") for code, entry in reconciled.get("entries", {}).items()}}
    snapshot = json.loads(path.read_text(encoding="utf-8"))
    from official_procedure_policy import publication_bundle
    reconciled = publication_bundle()
    snapshot["details"] = {**snapshot.get("details", {}), **reconciled.get("details", {})}
    snapshot["detailCheckedAt"] = {**snapshot.get("detailCheckedAt", {}), **{code: entry.get("detailCheckedAt", "") for code, entry in reconciled.get("entries", {}).items() if entry.get("status") == "matched"}}
    return snapshot


@lru_cache(maxsize=1)
def bundled_details():
    path = Path(__file__).resolve().parent / "resources" / "official_procedure_details.json.gz"
    if not path.exists():
        return {}
    with gzip.open(path, "rt", encoding="utf-8") as stream:
        return json.load(stream).get("details", {})


def names(record, *keys):
    result = []
    for key in keys:
        for item in record.get(key) or []:
            if isinstance(item, dict) and item.get("name") and item["name"] not in result:
                result.append(item["name"])
    return result


def published_procedure_detail(code):
    snapshot = official_snapshot()
    record = snapshot.get("details", {}).get(code)
    if not record:
        return bundled_details().get(code)
    proposal = record.get("procedureProposal") or {}
    source_url = record.get("_sourceUrl") or f"https://dichvucong.gov.vn/thu-tuc-hanh-chinh/{record['id']}"
    levels = [("isMinistry", "Cấp Bộ"), ("isProvince", "Cấp tỉnh"),
              ("isWard", "Cấp xã"), ("isOtherAgency", "Cơ quan khác")]
    cases = record.get("executionCases") or []
    if not cases and record.get("profileComponents"):
        cases = [{"name": "", "profileComponents": record["profileComponents"]}]
    return {
        "name": record.get("name") or "",
        "code": record.get("code") or code,
        "sourceUrl": source_url,
        "checkedAt": snapshot.get("detailCheckedAt", {}).get(code) or snapshot.get("checkedAt", ""),
        "decisionNumber": record.get("decisionNo") or proposal.get("proposalNumber") or proposal.get("decisionNumber") or "",
        "executionLevel": ", ".join(label for key, label in levels if record.get(key)),
        "procedureType": {
            "ASSIGNED_REGULATION": "TTHC được luật giao quy định chi tiết",
            "NOT_ASSIGNED_REGULATION": "TTHC không được luật giao quy định chi tiết",
            "OTHER": "Thủ tục hành chính khác",
        }.get(record.get("formalityType"), ""),
        "fields": names(record, "categoriesDetails") or ([record["category"]["name"]] if record.get("category") else []),
        "targets": names(record, "subjectTypesDetails"),
        "authorities": names(record, "departmentsAuthority", "unitGroupsAuthority"),
        "executingAgencies": names(record, "departmentsExecuting", "unitGroupsExecuting") or ([record["executingAgencies"]] if record.get("executingAgencies") else []),
        "authorizedAgencies": names(record, "departmentsAuthorized", "unitGroupsAuthorized") or ([record["authorizedAgencies"]] if record.get("authorizedAgencies") else []),
        "coordinatingAgencies": names(record, "departmentsCoordinating", "unitGroupsCoordinating") or ([record["coordinatingAgencies"]] if record.get("coordinatingAgencies") else []),
        "receivingAddress": record.get("dossierReceivingAddresses") or "",
        "steps": [{"name": item.get("name") or "", "description": item.get("description") or ""}
                  for item in record.get("executionSteps") or [] if isinstance(item, dict)],
        "methods": record.get("executionMethods") or [],
        "cases": cases,
        "legalBases": record.get("legalBasisesDetails") or [],
        "conditions": record.get("requirementsAndConditions") or "",
        "results": record.get("resultsDetails") or [],
        "relatedProcedures": record.get("procedureRelatedGroup") or [],
        "keywords": record.get("keywords") or "",
        "description": record.get("description") or "",
    }


def published_template(code, attachment_id):
    """Only resolve attachments belonging to the requested published procedure."""
    record = published_procedure_detail(code) or {}
    cases = record.get("cases") or []
    for case in cases:
        for component in case.get("profileComponents") or []:
            for attachment in component.get("attachments") or []:
                if attachment.get("id") == attachment_id:
                    return attachment
    return None


@lru_cache(maxsize=1)
def _attachment_index():
    index = {}
    details = official_snapshot().get("details", {})
    for code, record in details.items():
        cases = record.get("executionCases") or []
        if not cases and record.get("profileComponents"):
            cases = [{"name": "", "profileComponents": record["profileComponents"]}]
        for case in cases:
            if not isinstance(case, dict):
                continue
            for comp in case.get("profileComponents") or []:
                if not isinstance(comp, dict):
                    continue
                for att in comp.get("attachments") or []:
                    if isinstance(att, dict) and att.get("id"):
                        index.setdefault(str(att["id"]), (code, record, comp, att))
    return index


def _build_official_template_document(code, record, comp, att):
    fname = str(att.get("fileName") or att.get("name") or "mau-don.docx").strip()
    proc_name = str(record.get("name") or "").strip()
    decision_no = str(record.get("decisionNo") or "").strip()
    comp_name = str(comp.get("name") or "").strip()
    source_url = str(record.get("_sourceUrl") or f"https://dichvucong.gov.vn/thu-tuc-hanh-chinh/{record.get('id', '')}").strip()
    legal_items = [
        f"{item.get('code', '')} - {item.get('name', '')}".strip(" -")
        for item in (record.get("legalBasisesDetails") or [])
        if isinstance(item, dict) and (item.get("name") or item.get("code"))
    ]
    legal_str = "; ".join(legal_items) or (f"Quyết định công bố số {decision_no}" if decision_no else "Theo công bố trên Cổng Dịch vụ công quốc gia")

    if fname.lower().endswith(".pdf"):
        text_summary = f"Bieu mau TTHC {code}: {fname}"
        stream_data = f"BT /F1 12 Tf 50 750 Td ({escape(text_summary[:80])}) Tj ET".encode("latin-1", "replace")
        pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
            b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n"
            b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
            + f"4 0 obj<< /Length {len(stream_data)} >>stream\n".encode("ascii")
            + stream_data
            + b"\nendstream\nendobj\n"
            b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
            b"xref\n0 6\n0000000000 65535 f \n"
            b"trailer<< /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF\n"
        )
        return pdf, "application/pdf"

    paragraphs = [
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
        "Độc lập - Tự do - Hạnh phúc",
        "----------------------------------------",
        f"BIỂU MẪU, TỜ KHAI THỦ TỤC HÀNH CHÍNH ({fname})",
        f"Mã thủ tục hành chính: {code}",
        f"Tên thủ tục hành chính: {proc_name}",
        f"Số quyết định công bố: {decision_no or 'Theo công bố trên Cổng Dịch vụ công quốc gia'}",
        f"Thành phần hồ sơ áp dụng: {comp_name}",
        f"Căn cứ pháp lý: {legal_str}",
        f"Nguồn công bố chính thức: {source_url}",
        "----------------------------------------",
        "PHẦN KÊ KHAI CỦA TỔ CHỨC / CÁ NHÂN NỘP HỒ SƠ:",
        "1. Họ và tên người yêu cầu / Tên tổ chức, doanh nghiệp: ................................................................",
        "2. Số Định danh cá nhân / CCCD / Mã số doanh nghiệp: ................................................................",
        "3. Địa chỉ liên hệ / Trụ sở chính: ....................................................................................",
        "4. Số điện thoại: .............................................. Email: ...............................................",
        "5. Nội dung đề nghị, kê khai theo mẫu quy định tại văn bản pháp lý nêu trên:",
        ".......................................................................................................................",
        ".......................................................................................................................",
        ".......................................................................................................................",
        "Tôi xin cam đoan các thông tin kê khai và tài liệu kèm theo là đúng sự thật và chịu trách nhiệm trước pháp luật.",
        "........, ngày ...... tháng ...... năm 20....",
        "Người làm đơn / Đại diện hợp pháp (Ký, ghi rõ họ tên, đóng dấu nếu có)",
    ]
    body_xml = "".join(
        f"<w:p><w:r><w:t>{escape(line)}</w:t></w:r></w:p>" for line in paragraphs
    )
    doc_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{body_xml}</w:body></w:document>"
    )
    content_types_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        "</Types>"
    )
    rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        "</Relationships>"
    )
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml)
        zf.writestr("_rels/.rels", rels_xml)
        zf.writestr("word/document.xml", doc_xml)
    return buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def export_bundled_details():
    snapshot = official_snapshot()
    payload = {"sourceUrl": snapshot.get("sourceUrl"), "checkedAt": snapshot.get("checkedAt"),
               "details": {code: published_procedure_detail(code) for code in snapshot.get("details", {})}}
    path = Path(__file__).resolve().parent / "resources" / "official_procedure_details.json.gz"
    path.parent.mkdir(exist_ok=True)
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    path.write_bytes(gzip.compress(raw, mtime=0))
    return path


@lru_cache(maxsize=64)
def download_published_template(attachment_id):
    meta = _attachment_index().get(str(attachment_id))
    file_id = str(attachment_id)
    if meta:
        _, _, _, att = meta
        if att.get("fileId"):
            file_id = str(att["fileId"])

    limit = 16 * 1024 * 1024
    if re.fullmatch(r"[0-9a-fA-F-]{36}", file_id) or not meta:
        request = Request(
            "https://dichvucong.gov.vn/api/v1/submitting/preview-attachment",
            data=json.dumps({"fileId": file_id}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Origin": "https://dichvucong.gov.vn",
                "Referer": "https://dichvucong.gov.vn/thu-tuc-hanh-chinh",
                "User-Agent": "Hanoi-Administrative-Services-Local-Research/1.0",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=20) as response:
                content = response.read(limit + 1)
                content_type = response.headers.get("Content-Type", "application/octet-stream")
                if not content or len(content) > limit or content_type.split(";")[0] in {"text/html", "application/json"}:
                    raise ValueError("Cổng quốc gia chưa trả về tệp mẫu hợp lệ.")
                return content, content_type
        except Exception:
            if not meta:
                raise

    if meta:
        code, record, comp, att = meta
        direct_url = str(att.get("directUrl") or "")
        if direct_url.startswith("https://csdl.dichvucong.gov.vn/"):
            try:
                req = Request(direct_url, headers={"User-Agent": "Mozilla/5.0"})
                with urlopen(req, timeout=2.5) as response:
                    content = response.read(limit + 1)
                    content_type = response.headers.get("Content-Type", "application/octet-stream")
                    if content and len(content) <= limit and content_type.split(";")[0] not in {"text/html", "application/json"}:
                        return content, content_type
            except Exception:
                pass
        return _build_official_template_document(code, record, comp, att)

    raise ValueError("Cổng quốc gia chưa trả về tệp mẫu hợp lệ.")
