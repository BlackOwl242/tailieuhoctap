"""Procedure-specific workflow policy used by the local Hanoi services app.

Interactive schemas live in procedure_forms.json; source-backed published dossiers
are resolved lazily on demand from official_procedure_policy.
"""
from __future__ import annotations

import json
import official_procedure_policy as official
import re
from datetime import datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parent
_forms_path = ROOT / "procedure_forms.json"
try:
    _forms = json.loads(_forms_path.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError):
    _forms = {}

PROFILES: dict[str, dict] = {
    "2.000908": {
        "procedureCode": "2.000908",
        "version": "2.000908-858-2026-v1",
        "title": "Yêu cầu cấp bản sao từ sổ gốc",
        "sourceUrl": "https://dichvucong.gov.vn/p/home/dvc-tthc-thu-tuc-hanh-chinh-chi-tiet.html?ma_thu_tuc=2989&open_popup=1",
        "checkedAt": "2026-10-20",
        "authority": "UBND phường, xã có bộ phận tiếp nhận và quản lý sổ gốc tương ứng",
        "stages": {"submitted": "Gửi hồ sơ", "intake": "Kiểm tra, tiếp nhận", "handling": "Đối chiếu sổ gốc", "review": "Xem xét, phê duyệt", "issue": "Cấp bản sao", "delivery": "Trả kết quả"},
        "verificationAction": "verify_original_register",
        "verificationLabel": "Ghi kết quả đối chiếu sổ gốc",
        "evidenceFields": [
            {"id": "outcome", "label": "Kết quả đối chiếu", "options": ["Khớp sổ gốc và đủ quyền yêu cầu", "Không tìm thấy bản ghi trong sổ gốc", "Người yêu cầu không đủ quyền"]},
            {"id": "registerReference", "label": "Sổ, trang hoặc bản ghi đã đối chiếu", "minLength": 3},
            {"id": "verificationBasis", "label": "Căn cứ xác định quyền yêu cầu", "minLength": 12},
        ],
        "deadline": {"kind": "SAME_DAY", "cutoffHour": 15, "note": "Trong ngày nhận đủ hồ sơ hợp lệ; nếu nhận sau 15 giờ, hạn chuyển sang ngày làm việc tiếp theo. Cần xác nhận hồ sơ hợp lệ sau khi đối chiếu sổ gốc."},
    },
    "1.004237": {
        "procedureCode": "1.004237",
        "version": "1.004237-704-2025-v2",
        "title": "Khai thác và sử dụng thông tin, dữ liệu tài nguyên và môi trường",
        "sourceUrl": "https://datafiles.hanoi.gov.vn/gov-hni/6244/VanBan/2026/1/5/QDPVHCC-2273-2025.pdf",
        "checkedAt": "2026-10-20",
        "authority": "Sở Nông nghiệp và Môi trường Hà Nội",
        "stages": {"submitted": "Gửi yêu cầu", "intake": "Kiểm tra hồ sơ", "handling": "Xem xét yêu cầu và nghĩa vụ tài chính", "review": "Xác nhận kết quả xử lý", "issue": "Cung cấp dữ liệu", "delivery": "Trả kết quả"},
        "verificationAction": "assess_data_request",
        "verificationLabel": "Ghi kết quả xem xét yêu cầu",
        "evidenceFields": [
            {"id": "outcome", "label": "Kết luận về khả năng cung cấp", "minLength": 8},
            {"id": "dataReference", "label": "Phạm vi dữ liệu và nguồn đã kiểm tra", "minLength": 8},
            {"id": "financialAssessment", "label": "Kết luận nghĩa vụ tài chính", "options": ["Có nghĩa vụ tài chính", "Không phát sinh nghĩa vụ tài chính", "Cần làm rõ trước khi kết luận"]},
            {"id": "verificationBasis", "label": "Căn cứ và nội dung thẩm tra", "minLength": 12},
        ],
        "milestone": {"id": "financial_notice", "label": "Kiểm tra yêu cầu và thông báo nghĩa vụ tài chính", "businessDays": 5, "note": "Mốc kiểm tra trung gian 05 ngày làm việc, không phải hạn cuối cung cấp dữ liệu."},
        "deadline": {"kind": "NONE", "note": "Chưa có hạn cuối cung cấp dữ liệu chung; mốc 05 ngày làm việc chỉ dùng để kiểm tra yêu cầu và thông báo nghĩa vụ tài chính nếu có."},
    },
}


def _resolve_profile(code: str) -> dict | None:
    if not code:
        return None
    if code in PROFILES:
        return PROFILES[code]
    compiled = official.compiled_policy(code)
    if compiled:
        PROFILES[code] = compiled["profile"]
        _forms[code] = compiled["schema"]
        return PROFILES[code]
    return None


def form_for(code: str) -> dict | None:
    if code in _forms:
        return _forms[code]
    _resolve_profile(code)
    return _forms.get(code)


def concrete_agency(name: str) -> bool:
    value = " ".join(str(name or "").split()).strip()
    if len(value) < 3:
        return False
    folded = value.casefold()
    return folded not in {"toàn thành phố", "toàn hà nội", "hà nội", "thành phố hà nội", "all"} and not any(x in folded for x in ("toàn thành phố", "tất cả cơ quan", "mọi cơ quan"))


def configured_profile(procedure: dict) -> dict | None:
    code = str(procedure.get("code") or procedure.get("procedureCode") or "")
    profile = _resolve_profile(code)
    form = form_for(code) if profile and profile.get("kind") == "PUBLISHED_DOSSIER" else procedure.get("submission") or form_for(code)
    if profile and profile.get("kind") == "PUBLISHED_DOSSIER":
        return profile if form and form.get("version") == profile["version"] else None
    if not profile or procedure.get("serviceMode") in {"INFORMATION", "UNKNOWN"}:
        return None
    if not isinstance(form, dict) or form.get("sourceStatus") != "reviewed-interactive":
        return None
    if form.get("version") != profile["version"] or not form.get("fields") or not form.get("documents"):
        return None
    return profile


def require_submission(procedure: dict, channel: str = "ONLINE") -> dict:
    profile = configured_profile(procedure)
    if not profile or channel not in profile.get("channels", ["ONLINE", "DIRECT", "POSTAL"]):
        raise ValueError("Thủ tục chưa có biểu mẫu và quy trình đã được đối chiếu đầy đủ để tiếp nhận trực tuyến.")
    return profile


def snapshot(procedure: dict, channel: str = "ONLINE") -> dict:
    profile = require_submission(procedure, channel)
    return dict(profile) if profile.get("kind") == "PUBLISHED_DOSSIER" else {key: value for key, value in profile.items() if key not in {"evidenceFields"}}


def case_profile(case: dict) -> dict | None:
    saved = case.get("workflow")
    if isinstance(saved, dict) and saved.get("kind") == "PUBLISHED_DOSSIER" and saved.get("version") and saved.get("evidenceFields"):
        return saved
    if isinstance(saved, dict) and saved.get("procedureCode"):
        base = _resolve_profile(str(saved["procedureCode"]))
        return {**base, **saved} if base else saved
    return _resolve_profile(str(case.get("procedureCode") or ""))


def guard_summary(case: dict) -> dict:
    profile = case_profile(case)
    allowed_actions = [
        "accept", "request_supplement", "reject_intake", "assign", "prepare_stop_notice",
        "set_fee", "digitize_documents", "deliver", "submit_supplement", "save_draft",
        "submit_review", "verify_original_register", "verify_data_request", "assess_data_request", "verify_published_procedure",
        "approve", "send_back", "decline", "waive_fee", "sign_result", "issue", "issue_stop_notice",
        "return_to_leader", "return_to_intake", "close_expired_supplement", "reject_stop_notice",
        "confirm_paper_returned", "extend_deadline",
    ]
    if not profile:
        return {"verificationAction": "", "evidenceFields": [], "allowedActions": allowed_actions}
    evidence = case.get("workflowEvidence") or {}
    has_outcome = bool(str(evidence.get("outcome") or "").strip())
    if not has_outcome or (profile.get("procedureCode") == "1.004237" and not evidence.get("financialAssessment")):
        if "submit_review" in allowed_actions:
            allowed_actions.remove("submit_review")
    return {
        "officialSteps": profile.get("officialSteps", []),
        "conditions": profile.get("conditions", ""),
        "sourceUrl": profile.get("sourceUrl", ""),
        "verificationAction": profile["verificationAction"],
        "verificationLabel": profile["verificationLabel"],
        "evidenceFields": profile["evidenceFields"],
        "milestone": profile.get("milestone"),
        "allowedActions": allowed_actions,
    }


def authorize_action(role: str, action: str) -> None:
    verification_actions = {profile["verificationAction"] for profile in PROFILES.values()} | {"verify_published_procedure"}
    if action in verification_actions and role != "specialist":
        raise PermissionError("Chỉ chuyên viên được phân công mới được ghi kết quả thẩm tra thủ tục này.")


def verify_evidence(profile: dict, evidence: dict | None) -> dict:
    if not isinstance(evidence, dict):
        raise ValueError("Thiếu kết quả và căn cứ thẩm tra.")
    result = {}
    for field in profile.get("evidenceFields", []):
        value = " ".join(str(evidence.get(field["id"]) or "").split())
        if not value or len(value) < field.get("minLength", 1) or len(value) > 1200:
            raise ValueError(f"Cần nhập {field['label']}.")
        if field.get("options") and value not in field["options"]:
            raise ValueError(f"Lựa chọn không hợp lệ: {field['label']}.")
        result[field["id"]] = value
    return result


def agency_matches(profile: dict, agency: str) -> bool:
    if not concrete_agency(agency):
        return False
    code = profile.get("procedureCode")
    folded = " ".join(str(agency).split()).casefold()
    if profile.get("kind") == "PUBLISHED_DOSSIER":
        return official.agency_matches(profile, agency)
    if code == "1.004237":
        return folded in {"sở nông nghiệp và môi trường hà nội", "sở nông nghiệp và môi trường"}
    if code == "2.000908":
        return bool(re.match(r"^ubnd\s+(phường|xã|đặc khu)\b", folded))
    return False


def milestones(profile: dict, accepted_at: datetime, is_workday) -> list[dict]:
    definition = profile.get("milestone")
    if not definition:
        return []
    due = accepted_at.date()
    days = 0
    while days < definition["businessDays"]:
        due += timedelta(days=1)
        if is_workday(due):
            days += 1
    return [{"id": definition["id"], "label": definition["label"], "dueDate": due.isoformat(), "completedAt": None, "note": definition["note"]}]
