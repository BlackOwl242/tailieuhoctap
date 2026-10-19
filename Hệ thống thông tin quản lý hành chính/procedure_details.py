"""Present the saved DVCQG publication without inventing missing procedure data."""

from functools import lru_cache
import gzip
import json
from pathlib import Path
from urllib.request import Request, urlopen


@lru_cache(maxsize=1)
def official_snapshot():
    path = Path(__file__).resolve().parent / "data" / "official_procedure_forms_snapshot.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


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
    source_url = f"https://dichvucong.gov.vn/thu-tuc-hanh-chinh/{record['id']}"
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


def export_bundled_details():
    snapshot = official_snapshot()
    payload = {"sourceUrl": snapshot.get("sourceUrl"), "checkedAt": snapshot.get("checkedAt"),
               "details": {code: published_procedure_detail(code) for code in snapshot.get("details", {})}}
    path = Path(__file__).resolve().parent / "resources" / "official_procedure_details.json.gz"
    path.parent.mkdir(exist_ok=True)
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    path.write_bytes(gzip.compress(raw, mtime=0))
    return path


@lru_cache(maxsize=16)
def download_published_template(attachment_id):
    request = Request(
        "https://dichvucong.gov.vn/api/v1/submitting/preview-attachment",
        data=json.dumps({"fileId": attachment_id}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Origin": "https://dichvucong.gov.vn",
                 "Referer": "https://dichvucong.gov.vn/"}, method="POST",
    )
    with urlopen(request, timeout=20) as response:
        limit = 16 * 1024 * 1024
        content = response.read(limit + 1)
        content_type = response.headers.get("Content-Type", "application/octet-stream")
        if not content or len(content) > limit or content_type.split(";")[0] in {"text/html", "application/json"}:
            raise ValueError("Cổng quốc gia chưa trả về tệp mẫu hợp lệ.")
        return content, content_type
