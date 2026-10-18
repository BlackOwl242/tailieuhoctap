"""Reconcile the local Hanoi procedure catalog with public DVCQG records.

The official public API exposes procedure names, execution cases, document
components, methods, deadlines, fees, and referenced attachment names. It does
not expose an interactive e-form schema through this public endpoint. Imported
forms therefore preserve the official case/document structure and link back to
the source procedure; they do not invent missing declaration fields.

Run with --write to merge source-backed procedures into procedure_forms.json.
Existing hand-configured schemas are preserved.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
CATALOG_CSV = ROOT / "Bao_cao_nghien_cuu_Ha_Noi" / "07_Huong_dan" / "Thu_tuc_theo_QD_492" / "Danh_muc.csv"
FORMS_PATH = ROOT / "procedure_forms.json"
DATA_DIR = ROOT / "data"
SNAPSHOT_PATH = DATA_DIR / "official_procedure_forms_snapshot.json"
REPORT_PATH = DATA_DIR / "procedure_form_sync_report.md"
BASE_URL = "https://dichvucong.gov.vn/api/v1"
PAGE_URL = "https://dichvucong.gov.vn/thu-tuc-hanh-chinh"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://dichvucong.gov.vn",
    "Referer": PAGE_URL,
    "User-Agent": "Hanoi-Administrative-Services-Local-Research/1.0",
}


def post_json(path: str, payload: dict, retries: int = 3) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = Request(f"{BASE_URL}{path}", data=body, headers=HEADERS, method="POST")
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urlopen(request, timeout=35) as response:
                result = json.loads(response.read().decode("utf-8"))
            if result.get("code") != "OK":
                raise RuntimeError(f"Official API returned {result.get('code')}: {result.get('message')}")
            return result.get("data") or {}
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, RuntimeError) as exc:
            last_error = exc
            if attempt + 1 < retries:
                time.sleep(0.6 * (attempt + 1))
    raise RuntimeError(str(last_error))


def official_hanoi_catalog() -> list[dict]:
    items: list[dict] = []
    cursor = ""
    total: int | None = None
    for _ in range(100):
        page = post_json(
            "/submitting/formality/list-all-public-formality-by-citizen",
            {"limit": 200, "lastId": cursor, "q": "", "provinceCode": "01"},
        )
        if total is None:
            total = int(page.get("total") or 0)
        batch = page.get("items") or []
        if not batch:
            break
        items.extend(batch)
        next_cursor = str(page.get("lastId") or "")
        if not next_cursor or next_cursor == cursor:
            break
        cursor = next_cursor
        if total and len(items) >= total:
            break
    if total is not None and len(items) != total:
        raise RuntimeError(f"Catalog pagination incomplete: got {len(items)} of {total} records")
    return items


def local_catalog() -> list[dict]:
    with CATALOG_CSV.open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source))


def fetch_detail(item: dict) -> tuple[str, dict | None, str | None]:
    code = str(item.get("code") or "")
    try:
        detail = post_json("/configuring/formality/get-formality-by-citizen", {"id": item["id"]})
        if detail.get("code") != code:
            return code, None, f"Official record code mismatch ({detail.get('code')})"
        return code, detail, None
    except Exception as exc:  # keep the other procedure records usable
        return code, None, str(exc)


def clean(value: object, limit: int = 1800) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def official_case_documents(detail: dict) -> tuple[list[dict], int, int]:
    cases = detail.get("executionCases") or []
    cases = [item for item in cases if isinstance(item, dict)]
    case_selector = "officialCase"
    case_names = [clean(item.get("name")) or f"Trường hợp {index + 1}" for index, item in enumerate(cases)]
    # Keep separate official cases even when the portal repeats their title.
    counts: dict[str, int] = {}
    for name in case_names:
        counts[name] = counts.get(name, 0) + 1
    seen_names: dict[str, int] = {}
    labelled_case_names = []
    for name in case_names:
        seen_names[name] = seen_names.get(name, 0) + 1
        labelled_case_names.append(f"{name} (phương án {seen_names[name]})" if counts[name] > 1 else name)
    case_names = labelled_case_names
    fields: list[dict] = []
    if len(case_names) > 1:
        fields.append({
            "id": case_selector,
            "label": "Trường hợp thực hiện thủ tục",
            "type": "select",
            "required": True,
            "options": case_names,
            "help": "Chọn đúng trường hợp theo hướng dẫn công khai của thủ tục. Chỉ giấy tờ của trường hợp đã chọn được áp dụng.",
        })

    docs: list[dict] = []
    seen: set[tuple[str, str]] = set()
    attachment_count = 0
    component_count = 0
    for index, case in enumerate(cases):
        case_name = case_names[index] if index < len(case_names) else f"Trường hợp {index + 1}"
        for component in case.get("profileComponents") or []:
            if not isinstance(component, dict):
                continue
            component_id = clean(component.get("profileComponentId") or component.get("id"), 120)
            label = clean(component.get("name"), 600)
            if not label:
                continue
            duplicate_key = (case_name, component_id or label)
            if duplicate_key in seen:
                continue
            seen.add(duplicate_key)
            component_count += 1
            original_qty = component.get("originalQty")
            copy_qty = component.get("copyQty")
            notes = []
            if isinstance(original_qty, int) and original_qty > 0:
                notes.append(f"Bản chính: {original_qty}")
            if isinstance(copy_qty, int) and copy_qty > 0:
                notes.append(f"Bản sao: {copy_qty}")
            attachments = component.get("attachments") or []
            attachment_names = [clean(a.get("fileName") or a.get("name"), 240) for a in attachments if isinstance(a, dict)]
            attachment_names = [name for name in attachment_names if name]
            attachment_count += len(attachment_names)
            if attachment_names:
                notes.append("Mẫu gốc được Cổng quốc gia liệt kê: " + "; ".join(attachment_names))
            document = {
                "id": f"dvc-{index + 1}-{component_id or len(docs) + 1}",
                "label": label,
                # Preserve the official API flag. False is not silently turned
                # into a mandatory requirement because some items are retrieved
                # from government datasets or apply only to a stated condition.
                "required": bool(component.get("required", False)),
                "help": " · ".join(notes),
                "officialComponentCode": clean(component.get("code"), 120),
                "officialAttachmentNames": attachment_names,
                "templateSourceUrl": f"https://dichvucong.gov.vn/thu-tuc-hanh-chinh/{detail.get('id')}",
                "hasElectronicForm": bool(component.get("hasElectronicForm")),
                "isProcessingResult": bool(component.get("isProcessingResult")),
            }
            if len(case_names) > 1:
                document["when"] = {"field": case_selector, "equals": case_name}
            docs.append(document)
    return docs, component_count, attachment_count


def format_duration(method: dict | None) -> str:
    if not method:
        return "Cổng quốc gia chưa công khai thời hạn xử lý trực tuyến trong bản ghi hiện tại."
    amount = method.get("processingTime")
    unit = str(method.get("processingTimeUnit") or "").upper()
    description = clean(method.get("description"), 800)
    unit_names = {
        "DAY": "ngày",
        "WORKING_DAY": "ngày làm việc",
        "MONTH": "tháng",
        "YEAR": "năm",
        "HOUR": "giờ",
        "MINUTE": "phút",
    }
    if isinstance(amount, (int, float)) and amount > 0 and unit in unit_names:
        text = f"{amount:g} {unit_names[unit]}"
    elif description:
        text = description
    else:
        text = "Cổng quốc gia chưa công khai thời hạn xử lý trực tuyến trong bản ghi hiện tại."
    return f"{text} · theo phương thức trực tuyến trên Cổng Dịch vụ công quốc gia."


def format_fees(method: dict | None, detail: dict) -> str:
    fees = (method or {}).get("fees") or detail.get("fees") or []
    parts: list[str] = []
    for fee in fees:
        if not isinstance(fee, dict):
            continue
        amount = fee.get("value")
        currency = clean(fee.get("currencyName") or "VNĐ", 30)
        description = clean(fee.get("description"), 400)
        if isinstance(amount, (int, float)):
            text = "Miễn phí" if amount == 0 else f"{amount:,.0f} {currency}"
        else:
            text = "Mức thu chưa được ghi rõ"
        if description:
            text += f" ({description})"
        parts.append(text)
    return "; ".join(dict.fromkeys(parts)) or "Cổng quốc gia chưa công khai khoản thu trong bản ghi hiện tại; cần đối chiếu trước khi áp dụng."


def return_methods(detail: dict) -> list[str]:
    result: list[str] = []
    for item in detail.get("returningMethods") or []:
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or "").upper()
        for value in item.get("value") or []:
            value = str(value).upper()
            if value in {"ONLINE", "ONLINE_AT_HOME"}:
                label = "Điện tử"
            elif value in {"AT_HOME", "POSTAL", "POSTAL_SERVICE"}:
                label = "Bưu chính"
            elif value in {"AT_SUBMISSION_PLACE", "DIRECT"}:
                label = "Trực tiếp"
            else:
                continue
            if label not in result:
                result.append(label)
        if not item.get("value") and kind == "OFFLINE" and "Trực tiếp" not in result:
            result.append("Trực tiếp")
    return result


def build_schema(code: str, catalog_item: dict, detail: dict, checked_at: str) -> dict | None:
    docs, component_count, attachment_count = official_case_documents(detail)
    if component_count == 0:
        return None
    online_method = next((item for item in detail.get("executionMethods") or [] if str(item.get("submissionMethod") or "").upper() == "ONLINE"), None)
    if not online_method:
        return None
    source_url = f"https://dichvucong.gov.vn/thu-tuc-hanh-chinh/{detail.get('id')}"
    legal_items = detail.get("legalBasisesDetails") or []
    legal_parts = [f"{clean(item.get('name'), 300)} ({clean(item.get('code'), 80)})" if item.get("code") else clean(item.get("name"), 300)
                   for item in legal_items if isinstance(item, dict) and clean(item.get("name"))]
    legal_basis = "; ".join(dict.fromkeys(legal_parts)) or "Căn cứ pháp lý chưa được công khai trong bản ghi hiện tại."
    methods = return_methods(detail)
    if not methods:
        methods = ["Trực tiếp"]
    profile = detail.get("procedureProposal") or {}
    updated = profile.get("publicationDate") or detail.get("updatedAt") or ""
    version = f"dvcqg-{detail.get('id')}-{updated}"
    target_types = detail.get("subjectTypesDetails") or []
    targets = [clean(item.get("name"), 100) for item in target_types if isinstance(item, dict)]
    return {
        "version": version,
        "title": clean(detail.get("name") or catalog_item.get("name"), 400),
        "sourceUrl": source_url,
        "formSourceUrl": source_url,
        "formSourceLabel": "Xem thành phần hồ sơ và tệp mẫu được Cổng Dịch vụ công quốc gia công khai",
        "legalBasis": legal_basis,
        "deadlineText": format_duration(online_method),
        "feeText": format_fees(online_method, detail),
        # The public citizen endpoint exposes document components, not the
        # interactive declaration fields. Never fabricate a citizen form.
        "fields": [],
        "documents": docs,
        "deliveryMethods": methods,
        "deliveryNote": "Đối chiếu phương thức nhận kết quả trên nguồn chính thức. Ứng dụng không tự tải tệp mẫu; mở trang thủ tục chính thức để xem hoặc tải khi Cổng công khai tệp.",
        "sourceStatus": "official-document-list-only",
        "sourceCheckedAt": checked_at,
        "officialRecordId": clean(detail.get("id"), 80),
        "officialState": clean(detail.get("state"), 40),
        "officialTargets": targets,
        "officialDocumentCount": component_count,
        "officialTemplateCount": attachment_count,
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="merge source-backed schemas into procedure_forms.json")
    parser.add_argument("--workers", type=int, default=6, help="concurrent read-only DVCQG detail requests (default: 6)")
    args = parser.parse_args()
    if not 1 <= args.workers <= 12:
        parser.error("--workers must be between 1 and 12")

    local = local_catalog()
    official = official_hanoi_catalog()
    local_codes = {str(item.get("code") or "") for item in local}
    official_by_code = {str(item.get("code") or ""): item for item in official}
    matched = {code: official_by_code[code] for code in local_codes if code in official_by_code}
    not_currently_listed = sorted(local_codes - set(matched))
    checked_at = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")

    details: dict[str, dict] = {}
    errors: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(fetch_detail, item) for item in matched.values()]
        for index, future in enumerate(as_completed(futures), 1):
            code, detail, error = future.result()
            if detail is not None:
                details[code] = detail
            else:
                errors[code] = error or "Unknown error"
            if index % 100 == 0:
                print(f"Fetched official details: {index}/{len(futures)}", flush=True)

    current_forms = json.loads(FORMS_PATH.read_text(encoding="utf-8"))
    imported: dict[str, dict] = {}
    no_public_document_components: list[str] = []
    for code, detail in details.items():
        if code in current_forms:
            continue
        schema = build_schema(code, matched[code], detail, checked_at)
        if schema is None:
            no_public_document_components.append(code)
            continue
        imported[code] = schema

    if args.write:
        merged = dict(current_forms)
        merged.update(imported)
        backup = FORMS_PATH.with_suffix(".json.before-official-sync")
        if not backup.exists():
            backup.write_text(json.dumps(current_forms, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        FORMS_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    snapshot = {
        "source": "Cổng Dịch vụ công quốc gia public API",
        "sourceUrl": "https://dichvucong.gov.vn/thu-tuc-hanh-chinh",
        "checkedAt": checked_at,
        "localCatalogCount": len(local),
        "hanoiPublicCatalogCount": len(official),
        "matchedLocalCodes": len(matched),
        "notCurrentlyListedInHanoi": not_currently_listed,
        "detailCount": len(details),
        "detailErrors": errors,
        "importedSchemaCodes": sorted(imported),
        "codesWithoutPublicDocumentComponents": sorted(no_public_document_components),
        "details": details,
    }
    DATA_DIR.mkdir(exist_ok=True)
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report = [
        "# Đối chiếu thành phần hồ sơ và biểu mẫu thủ tục với Cổng Dịch vụ công quốc gia",
        "",
        f"- Thời điểm lấy dữ liệu: {checked_at}",
        f"- Danh mục tham chiếu cục bộ: {len(local):,} thủ tục.",
        f"- Danh mục công khai Hà Nội từ nguồn chính thức: {len(official):,} thủ tục.",
        f"- Mã cục bộ tìm thấy trong danh mục công khai Hà Nội: {len(matched):,}.",
        f"- Mã chưa tìm thấy trong danh mục công khai Hà Nội: {len(not_currently_listed):,}.",
        f"- Chi tiết chính thức tải được: {len(details):,}; lỗi tải: {len(errors):,}.",
        f"- Cấu hình tham chiếu thành phần hồ sơ mới từ nguồn: {len(imported):,}.",
        f"- Bản ghi không có thành phần hồ sơ công khai để cấu hình: {len(no_public_document_components):,}.",
        f"- Biểu mẫu đã có trước lần đồng bộ này và được giữ nguyên: {len(current_forms):,}.",
        "",
        "Các cấu hình mới là danh mục thành phần hồ sơ tham chiếu lấy từ Cổng quốc gia; chúng không được coi là tờ khai điện tử có thể nộp tại ứng dụng này. API dữ liệu công khai không cung cấp cấu trúc tờ khai tương tác. Tên tệp mẫu được giữ lại làm tham chiếu; người dùng có thể mở trang thủ tục chính thức để xem hoặc tải tệp khi Cổng cung cấp. Ứng dụng chặn nộp hồ sơ cục bộ đối với các cấu hình chỉ có danh mục giấy tờ.",
        "",
        "Các mã chưa có bản ghi hiện hành hoặc không có thành phần hồ sơ công khai được giữ ở trạng thái chưa cấu hình để không tự đặt yêu cầu pháp lý.",
        "",
    ]
    REPORT_PATH.write_text("\n".join(report), encoding="utf-8")

    print(f"Local catalog: {len(local)}")
    print(f"Hanoi public catalog: {len(official)}")
    print(f"Matched local codes: {len(matched)}")
    print(f"Detail records: {len(details)}; errors: {len(errors)}")
    print(f"New form schemas: {len(imported)}")
    print(f"No public document components: {len(no_public_document_components)}")
    print(f"No current Hanoi listing: {len(not_currently_listed)}")
    if errors:
        print("Detail errors (first 15):")
        for code, error in list(errors.items())[:15]:
            print(f"  {code}: {error}")
    if args.write:
        print(f"Updated {FORMS_PATH}")
        print(f"Backup {FORMS_PATH.with_suffix('.json.before-official-sync')}")
    else:
        print("Dry run; procedure_forms.json was not changed. Re-run with --write to import.")
    print(f"Source snapshot: {SNAPSHOT_PATH}")
    print(f"Report: {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
