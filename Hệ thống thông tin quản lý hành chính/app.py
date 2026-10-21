"""Application server for the locally operated Hanoi services system."""

from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import html.parser
import io
import json
import mimetypes
import os
import re
import secrets
import sqlite3
import sys
import threading
import traceback
import workflow_extensions
import procedure_workflows as workflows
from procedure_details import published_procedure_detail, published_template, download_published_template
import uuid
from time import monotonic
from getpass import getpass
from datetime import date, datetime, time, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, quote, unquote, urlparse
from cryptography.fernet import Fernet
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import NoEncryption


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("HANOI_DATA_DIR", ROOT / "data")).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = Path(os.environ.get("HANOI_DB_PATH", DATA_DIR / "hanoi-services.sqlite3")).resolve()
CATALOG_PATH = ROOT / "Bao_cao_nghien_cuu_Ha_Noi" / "07_Huong_dan" / "Thu_tuc_theo_QD_492" / "Tra_cuu_danh_muc.html"
CALENDAR_PATH = ROOT / "working_calendar.json"
PORT = int(os.environ.get("HANOI_SERVICES_PORT", "8766"))
# Vietnam uses UTC+07:00 without daylight-saving transitions; fixed offset keeps
# the server runnable on Windows installations without an external tzdata package.
TZ = timezone(timedelta(hours=7), "ICT")
DB_LOCK = threading.RLock()

def lookup_cipher() -> Fernet:
    """Separate the recoverable secret from the public case payload and hash."""
    key_path = DATA_DIR / "lookup-vault.key"
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not key_path.exists():
        try:
            with key_path.open("xb") as stream:
                stream.write(Fernet.generate_key())
            key_path.chmod(0o600)
        except FileExistsError:
            pass
    return Fernet(key_path.read_bytes())
AUTH_ATTEMPTS: dict[str, list[float]] = {}
AUTH_ATTEMPTS_LOCK = threading.Lock()
PUBLIC_ATTEMPTS: dict[str, list[float]] = {}
PUBLIC_ATTEMPTS_LOCK = threading.Lock()
AUTH_WINDOW_SECONDS = 15 * 60
AUTH_EMAIL_FAILURE_LIMIT = 10
AUTH_IP_FAILURE_LIMIT = 60
PUBLIC_WINDOW_SECONDS = 15 * 60

MAX_BODY = 14 * 1024 * 1024
MAX_FILE = 8 * 1024 * 1024
ALLOWED_EXTS = {".pdf", ".png", ".jpg", ".jpeg"}
SESSION_COOKIE = "hni_session"
SESSION_TTL = 60 * 60 * 12
PASSWORD_ITERATIONS = 600_000
COOKIE_SECURE = os.environ.get("HANOI_COOKIE_SECURE", "0") == "1"
STAFF_ROLES = {"intake", "specialist", "leader", "registrar", "finance", "admin"}
ROLE_LABELS = {"intake": "Cán bộ tiếp nhận", "specialist": "Chuyên viên thụ lý", "leader": "Lãnh đạo phê duyệt", "registrar": "Văn thư phát hành", "finance": "Tài chính", "admin": "Quản trị hệ thống"}
NEWS_CATEGORIES = ("Hoạt động của Trung tâm", "Hành chính xung kích", "Cải cách hành chính", "Chuyển đổi số", "Tiện ích công dân")
DEFAULT_NEWS = [
    ("khai-sinh", "Hỗ trợ đăng ký khai sinh tại Bệnh viện Phụ sản", "10/10/2026", "Hoạt động của Trung tâm", "news-birth.jpg", "Gia đình được hướng dẫn làm thủ tục trực tuyến ngay tại bệnh viện.", "/hoat-dong-cua-trung-tam/ha-noi-trien-khai-quay-ho-tro-dang-ky-khai-sinh-ngay-tai-benh-vien-phu-san-2850261010092318881.htm", 1),
    ("an-toan", "Tập huấn bảo vệ thông tin khi thực hiện dịch vụ công", "08/10/2026", "Hoạt động của Trung tâm", "news-security.jpg", "Cán bộ được tập huấn về bảo mật và an ninh mạng.", "/hoat-dong-cua-trung-tam/bao-dam-bi-mat-nha-nuoc-an-ninh-mang-trong-thuc-hien-dich-vu-cong-truc-tuyen-2850261008173220299.htm", 1),
    ("ho-tro", "Chi nhánh 11 hỗ trợ người cao tuổi và người yếu thế", "05/10/2026", "Hành chính xung kích", "news-support.jpg", "Hỗ trợ người dân tiếp cận và thực hiện thủ tục hành chính.", "/hanh-chinh-xung-kich/chi-nhanh-so-11-duy-tri-hoat-dong-ho-tro-nguoi-cao-tuoi-nguoi-khuyet-tat-nguoi-yeu-the-2850261001170648669.htm", 1),
    ("ngoai-gio", "Đan Phượng hỗ trợ dịch vụ công sau giờ hành chính", "30/09/2026", "Hành chính xung kích", "news-evening.jpg", "Điểm hỗ trợ tiếp tục phục vụ theo đề nghị của công dân.", "/hanh-chinh-xung-kich/diem-ho-tro-dich-vu-cong-so-dan-phuong-tiep-tuc-nhung-chuyen-di-ho-tro-sau-gio-hanh-chinh-2850261001094218063.htm", 0),
    ("cong-nghe", "Phê duyệt ba quy trình về công nghệ thông tin, điện tử", "01/10/2026", "Cải cách hành chính", "news-technology.jpg", "Quyết định 1206/QĐ-TTPVHCC quy định quy trình nội bộ giải quyết thủ tục.", "/cai-cach-hanh-chinh-va-tin-khac/ha-noi-phe-duyet-03-quy-trinh-noi-bo-giai-quyet-thu-tuc-hanh-chinh-linh-vuc-cong-nghe-thong-tin-dien-tu-theo-quyet-dinh-so-1206-qd-ttpvhcc-2850261006113412799.htm", 0),
    ("giao-duc", "Quy trình giải quyết sáu thủ tục giáo dục", "30/09/2026", "Cải cách hành chính", "news-education.jpg", "Quyết định 1197/QĐ-TTPVHCC liên quan giáo dục tiểu học và trung học.", "/cai-cach-hanh-chinh-va-tin-khac/ha-noi-lam-ro-quy-trinh-giai-quyet-6-thu-tuc-linh-vuc-giao-duc-va-dao-tao-2850260929092211793.htm", 0),
    ("bien-nhan", "Thí điểm giấy tiếp nhận và hẹn trả điện tử", "08/09/2026", "Chuyển đổi số", "news-receipt.png", "Giấy tiếp nhận điện tử được triển khai thí điểm.", "/doi-moi-sang-tao-va-chuyen-doi-so/thi-diem-su-dung-giay-tiep-nhan-ho-so-va-hen-tra-ket-qua-ban-dien-tu-2850260908143936744.htm", 0),
    ("ban-sao", "Sử dụng bản sao điện tử có chứng thực", "30/09/2026", "Tiện ích công dân", "news-copy.jpg", "Bản sao điện tử hỗ trợ việc nộp hồ sơ trực tuyến.", "/tien-ich-cong-dan/chung-thuc-ban-sao-dien-tu-tu-ban-chinh-chung-thuc-mot-lan-su-dung-nhieu-lan-285026092514542508.htm", 0),
]

STATUS_LABELS = {
    "NHAP": "Bản nháp",
    "CHO_TIEP_NHAN": "Chờ tiếp nhận",
    "CHO_BO_SUNG": "Chờ người dân bổ sung",
    "DA_TIEP_NHAN": "Đã tiếp nhận",
    "DANG_THU_LY": "Đang thụ lý",
    "TRINH_DUYET": "Chờ phê duyệt",
    "DA_PHE_DUYET": "Đã phê duyệt",
    "DA_PHAT_HANH": "Đã phát hành",
    "HOAN_THANH": "Đã trả kết quả",
    "TU_CHOI": "Từ chối tiếp nhận",
    "KHONG_GIAI_QUYET": "Không giải quyết",
    "DUNG": "Đã phát hành Thông báo dừng",
}


def now_iso() -> str:
    return datetime.now(TZ).isoformat(timespec="seconds")


def sandbox_signing_key() -> Ed25519PrivateKey:
    """Load a local-only Ed25519 key; never use this key for official issuance."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    key_path = DATA_DIR / "sandbox-signing-key.enc"
    cipher = lookup_cipher()
    if key_path.exists():
        pem = cipher.decrypt(key_path.read_bytes())
        key = serialization.load_pem_private_key(pem, password=None)
        if not isinstance(key, Ed25519PrivateKey):
            raise RuntimeError("Khóa ký thử nghiệm không đúng định dạng.")
        return key
    key = Ed25519PrivateKey.generate()
    pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, NoEncryption())
    try:
        with key_path.open("xb") as stream:
            stream.write(cipher.encrypt(pem))
        key_path.chmod(0o600)
    except FileExistsError:
        pem = cipher.decrypt(key_path.read_bytes())
        key = serialization.load_pem_private_key(pem, password=None)
    return key


def sandbox_signature_message(case_code: str, procedure_code: str, draft: str, approved_at: str) -> bytes:
    return json.dumps(
        {"case": case_code, "procedure": procedure_code, "document": draft, "approvedAt": approved_at, "mode": "LOCAL_SANDBOX"},
        ensure_ascii=False, sort_keys=True, separators=(",", ":"),
    ).encode("utf-8")


def payment_event(con: sqlite3.Connection, transaction_ref: str, actor_id: str, actor_name: str,
                  action: str, detail: str = "", idempotency_key: str = "") -> None:
    con.execute(
        "INSERT INTO payment_events(transaction_ref,actor_id,actor_name,action,detail,idempotency_key,created_at) VALUES(?,?,?,?,?,?,?)",
        (transaction_ref, actor_id, actor_name, action, detail, idempotency_key, now_iso()),
    )


def sandbox_signature_view(con: sqlite3.Connection, case_id: int, payload: dict | None = None) -> dict | None:
    record = con.execute("SELECT * FROM sandbox_signatures WHERE case_id=? ORDER BY id DESC LIMIT 1", (case_id,)).fetchone()
    if not record:
        return None
    data = payload or {}
    message = sandbox_signature_message(
        str(data.get("code", "")), str(data.get("procedureCode", "")),
        str(data.get("draftResult", "")), str(data.get("approvedAt", "")),
    )
    valid = False
    try:
        public_key = Ed25519PublicKey.from_public_bytes(base64.b64decode(record["public_key_b64"], validate=True))
        public_key.verify(base64.b64decode(record["signature_b64"], validate=True), message)
        valid = hashlib.sha256(message).hexdigest() == record["document_hash"]
    except (InvalidSignature, ValueError, TypeError):
        valid = False
    return {
        "documentHash": record["document_hash"], "signature": record["signature_b64"],
        "publicKey": record["public_key_b64"], "signer": record["signer_name"],
        "authorityRef": record["authority_ref"], "signedAt": record["signed_at"],
        "mode": record["mode"], "verified": valid,
    }


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (TypeError, ValueError):
        return None


class CatalogParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: list[list[str]] = []
        self.row: list[str] | None = None
        self.cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "tr":
            self.row = []
        elif tag == "td" and self.row is not None:
            self.cell = []

    def handle_data(self, data: str) -> None:
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self.row is not None and self.cell is not None:
            self.row.append(" ".join(" ".join(self.cell).split()))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            if len(self.row) >= 6 and self.row[1] and self.row[2]:
                self.rows.append(self.row[:6])
            self.row = None


class AuthenticationError(PermissionError):
    pass


class RateLimitError(Exception):
    pass


def ensure_procedure_submission(proc: dict) -> None:
    """Keep reference documents visible; enable intake only for reviewed form/workflow pairs."""
    proc["serviceMode"] = proc.get("serviceMode") or {"Toàn trình": "FULL", "Một phần": "PARTIAL", "Cung cấp thông tin": "INFORMATION"}.get(proc.get("level", ""), "UNKNOWN")
    profile = workflows.configured_profile(proc)
    proc["submissionEnabled"] = bool(profile)
    proc["workflowSummary"] = ({"version": profile["version"], "title": profile["title"], "stages": profile["stages"],
                                "authority": profile["authority"], "sourceUrl": profile["sourceUrl"], "checkedAt": profile["checkedAt"]} if profile else None)
    proc["submissionDisabledReason"] = "" if profile else "Chưa mở tiếp nhận: tờ khai tương tác và quy trình của thủ tục chưa được đối chiếu đầy đủ. Vẫn có thể xem thông tin công bố và tải mẫu giấy tờ."
    if proc["serviceMode"] in {"INFORMATION", "UNKNOWN"}:
        proc["submission"] = None
    elif not profile and isinstance(proc.get("submission"), dict):
        proc["submission"] = {**proc["submission"], "sourceStatus": "official-document-list-only", "fields": []}


def load_catalog() -> list[dict]:
    parser = CatalogParser()
    if CATALOG_PATH.exists():
        parser.feed(CATALOG_PATH.read_text(encoding="utf-8", errors="replace"))
    procedures = []
    for cells in parser.rows:
        ref, code, name, field, mode, agency = cells
        if code.lower() == "mã":
            continue
        procedures.append({
            "ref": ref,
            "code": code,
            "name": name,
            "field": field,
            "level": mode,
            "agency": agency,
            "verified": code == "2.000908",
        })
    # Keep these two researched procedures discoverable if a future revision of
    # the catalog changes its markup; retain the uncertainty stated in the docs.
    known = {p["code"] for p in procedures}
    if "2.000908" not in known:
        procedures.append({"ref": "", "code": "2.000908", "name": "Cấp bản sao từ sổ gốc", "field": "Hộ tịch", "level": "Toàn trình", "agency": "Cấp xã", "verified": True})
    if "2.000635" not in known:
        procedures.append({"ref": "", "code": "2.000635", "name": "Cấp bản sao trích lục hộ tịch, bản sao giấy khai sinh", "field": "Hộ tịch", "level": "Toàn trình", "agency": "Cơ quan có thẩm quyền", "verified": False})
    # The deep procedure notes are more specific than the broad catalog rows.
    # Avoid carrying a stale/broad agency into the working form for these cases.
    for proc in procedures:
        if proc["code"] == "2.000908":
            proc.update({"name": "Cấp bản sao từ sổ gốc", "field": "Cấp bản sao từ sổ gốc", "agency": "UBND cấp xã/cơ quan lưu sổ gốc theo địa bàn", "verified": True})
            proc["routing"] = {
                "mode": "select-locality-and-authority",
                "status": "partially-verified",
                "summary": "Cổng quốc gia yêu cầu chọn tỉnh/thành phố và phường/xã hoặc Sở; cơ quan cụ thể thay đổi theo địa bàn. Ngày 10/10/2026, tuyến Hà Nội → Phường Tây Hồ hiển thị UBND phường Tây Hồ.",
                "officialUrl": "https://dichvucong.gov.vn/dvc-dich-vu-cong-truc-tuyen",
                "checkedAt": "2026-10-10",
                "observedAuthorities": [{"locality": "Thành phố Hà Nội → Phường Tây Hồ", "authority": "UBND phường Tây Hồ"}],
            }
        elif proc["code"] == "2.000635":
            proc.update({"name": "Cấp bản sao trích lục hộ tịch, bản sao giấy khai sinh", "field": "Hộ tịch", "agency": "Cơ quan hộ tịch có thẩm quyền tại Hà Nội · cần xác nhận", "verified": False})
            proc["routing"] = {
                "mode": "select-locality-and-authority",
                "status": "unverified",
                "summary": "Chỉ mục tìm kiếm của Cổng quốc gia trả về bản ghi 2.000635.H17, cấp xã, Quyết định 386/QĐ-UBND; chỉ mục nêu mức 8.000 đồng và xử lý trong ngày. Trang chi tiết trực tiếp trả 503 khi kiểm tra ngày 10/10/2026; chưa xác nhận hiệu lực, khoản thu và tuyến cơ quan tại Hà Nội. Không dùng làm tuyến mặc định; tra cứu lại trên Cổng quốc gia trước khi xử lý.",
                "officialUrl": "https://dichvucong.gov.vn/dvc-dich-vu-cong-truc-tuyen",
                "checkedAt": "2026-10-10",
            }
        else:
            proc["routing"] = {
                "mode": "select-locality-and-authority",
                "status": "catalog-reference-only",
                "summary": "Tên và cơ quan trong danh mục là dữ liệu tham chiếu; mức dịch vụ không tự cho phép tiếp nhận khi chưa có cấu hình tờ khai và quy trình đã đối chiếu.",
                "officialUrl": "https://dichvucong.gov.vn/dvc-dich-vu-cong-truc-tuyen",
            }
    forms_path = ROOT / "procedure_forms.json"
    forms = json.loads(forms_path.read_text(encoding="utf-8")) if forms_path.exists() else {}
    for proc in procedures:
        proc["serviceMode"] = {"Toàn trình": "FULL", "Một phần": "PARTIAL", "Cung cấp thông tin": "INFORMATION"}.get(proc["level"], "UNKNOWN")
        proc["submission"] = forms.get(proc["code"])
        if proc["code"] == "1.004237":
            proc["name"] = "Khai thác và sử dụng thông tin, dữ liệu tài nguyên và môi trường (cấp tỉnh)"
            proc["routing"] = {"mode": "provincial-authority", "status": "verified", "summary": "Thẩm quyền: Sở Nông nghiệp và Môi trường Hà Nội. Yêu cầu cung cấp dữ liệu theo Mẫu 02 hoặc Mẫu 03.", "officialUrl": "https://datafiles.hanoi.gov.vn/gov-hni/6244/VanBan/2026/1/5/QDPVHCC-2273-2025.pdf"}
            proc["verified"] = True
        ensure_procedure_submission(proc)
    return procedures


PROCEDURES = load_catalog()
PROCEDURE_BY_CODE = {p["code"]: p for p in PROCEDURES}
for procedure in PROCEDURES:
    procedure["fieldSource"] = procedure.get("field", "").strip() or "Chưa phân loại"
PROCEDURE_OVERRIDES: dict[str, dict] = {}
PROCEDURE_CATEGORY_OVERRIDES: dict[str, dict] = {}
SAMPLE_DATASET_VERSION = 2


def procedure_catalog_records() -> list[dict]:
    records = []
    for source in PROCEDURES:
        item = dict(source)
        item["sourceCode"] = source["code"]
        edit = PROCEDURE_OVERRIDES.get(item["code"])
        if edit:
            item.update({key: edit[key] for key in ("name", "field", "level", "agency")})
            item["code"] = edit.get("localCode") or source["code"]
            item["fieldSource"] = edit.get("categoryKey") or edit["field"] or "Chưa phân loại"
            item["serviceMode"] = {"Toàn trình": "FULL", "Một phần": "PARTIAL", "Cung cấp thông tin": "INFORMATION"}.get(item["level"], "UNKNOWN")
            if isinstance(edit.get("submission"), dict):
                item["submission"] = edit["submission"]
            item["localEdit"] = {key: edit[key] for key in ("sourceUrl", "checkedAt", "reason", "version", "updatedBy", "updatedAt")}
        ensure_procedure_submission(item)
        item["field"] = item.get("field", "").strip() or "Chưa phân loại"
        category_edit = PROCEDURE_CATEGORY_OVERRIDES.get(item.get("fieldSource") or "Chưa phân loại")
        if category_edit:
            item["field"] = category_edit["displayName"]
            item["categoryEdit"] = {key: category_edit[key] for key in ("sourceUrl", "checkedAt", "reason", "version", "updatedBy", "updatedAt")}
        item["categoryKey"] = item.get("fieldSource") or "Chưa phân loại"
        item.pop("fieldSource", None)
        records.append(item)
    return records


def procedure_category_records() -> list[dict]:
    """Return all reference groups, including locally created groups with no procedures yet."""
    groups: dict[str, dict] = {}
    for source in PROCEDURES:
        key = source.get("fieldSource") or "Chưa phân loại"
        edit = PROCEDURE_CATEGORY_OVERRIDES.get(key)
        groups.setdefault(key, {
            "key": key,
            "name": edit["displayName"] if edit else (source.get("field") or "Chưa phân loại"),
            "source": "internal" if key.startswith("local:") else "reference",
            "categoryEdit": edit,
        })
    for key, edit in PROCEDURE_CATEGORY_OVERRIDES.items():
        groups.setdefault(key, {
            "key": key, "name": edit["displayName"],
            "source": "internal" if key.startswith("local:") else "reference",
            "categoryEdit": edit,
        })
    for item in procedure_catalog_records():
        key = item.get("categoryKey") or item.get("field") or "Chưa phân loại"
        group = groups.setdefault(key, {
            "key": key, "name": item.get("field") or "Chưa phân loại",
            "source": "internal" if key.startswith("local:") else "reference",
            "categoryEdit": item.get("categoryEdit"),
        })
        group["name"] = item.get("field") or group["name"]
        group.setdefault("procedures", []).append(item)
    for group in groups.values():
        group.setdefault("procedures", [])
        group["count"] = len(group["procedures"])
        edit = group.get("categoryEdit")
        group["categoryEdit"] = ({key: edit[key] for key in ("sourceUrl", "checkedAt", "reason", "version", "updatedBy", "updatedAt")}
                                  if edit else None)
    return sorted(groups.values(), key=lambda item: (item["name"].casefold(), item["key"].casefold()))


class ClosingSQLiteConnection(sqlite3.Connection):
    """Keep sqlite's transaction context manager, and close its handle on exit."""

    def __exit__(self, exc_type, exc_value, traceback):
        try:
            return super().__exit__(exc_type, exc_value, traceback)
        finally:
            self.close()


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=15, factory=ClosingSQLiteConnection)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    con.execute("PRAGMA busy_timeout = 15000")
    return con


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with DB_LOCK, connect() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                owner_id TEXT NOT NULL,
                procedure_code TEXT NOT NULL,
                status TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                idempotency_key TEXT UNIQUE,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_cases_status_created ON cases(status, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner_id, created_at DESC);
            CREATE TABLE IF NOT EXISTS case_lookup_secrets (
                case_id INTEGER PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
                encrypted_key BLOB NOT NULL,
                submission_hash TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS case_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                actor_role TEXT NOT NULL,
                actor_name TEXT NOT NULL,
                action TEXT NOT NULL,
                title TEXT NOT NULL,
                detail TEXT NOT NULL DEFAULT '',
                audience TEXT NOT NULL DEFAULT 'public',
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_events_case ON case_events(case_id, id);
            CREATE TABLE IF NOT EXISTS payment_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                transaction_ref TEXT NOT NULL UNIQUE,
                amount INTEGER NOT NULL,
                status TEXT NOT NULL,
                basis TEXT NOT NULL,
                created_at TEXT NOT NULL,
                reconciled_at TEXT
            );
            CREATE TABLE IF NOT EXISTS payment_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_ref TEXT NOT NULL REFERENCES payment_records(transaction_ref) ON DELETE CASCADE,
                actor_id TEXT NOT NULL DEFAULT '',
                actor_name TEXT NOT NULL,
                action TEXT NOT NULL,
                detail TEXT NOT NULL DEFAULT '',
                idempotency_key TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_payment_events_ref ON payment_events(transaction_ref, id);
            CREATE TABLE IF NOT EXISTS payment_refunds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_ref TEXT NOT NULL REFERENCES payment_records(transaction_ref) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                requested_by TEXT NOT NULL,
                requested_at TEXT NOT NULL,
                reviewed_by TEXT NOT NULL DEFAULT '',
                reviewed_at TEXT,
                review_note TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS sandbox_signing_authorities (
                user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                granted_by TEXT NOT NULL REFERENCES users(id),
                authority_ref TEXT NOT NULL,
                reason TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                granted_at TEXT NOT NULL,
                revoked_at TEXT
            );
            CREATE TABLE IF NOT EXISTS sandbox_signing_authority_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL REFERENCES users(id),
                actor_id TEXT NOT NULL REFERENCES users(id),
                action TEXT NOT NULL,
                authority_ref TEXT NOT NULL DEFAULT '',
                reason TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sandbox_signatures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                document_hash TEXT NOT NULL,
                signature_b64 TEXT NOT NULL,
                public_key_b64 TEXT NOT NULL,
                signer_id TEXT NOT NULL REFERENCES users(id),
                signer_name TEXT NOT NULL,
                authority_ref TEXT NOT NULL,
                signed_at TEXT NOT NULL,
                mode TEXT NOT NULL DEFAULT 'LOCAL_SANDBOX',
                UNIQUE(case_id, document_hash)
            );
            CREATE INDEX IF NOT EXISTS idx_sandbox_signatures_case ON sandbox_signatures(case_id, id DESC);
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                owner_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                phone TEXT NOT NULL DEFAULT '',
                full_name TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('citizen','intake','specialist','leader','registrar','finance','admin')),
                active INTEGER NOT NULL DEFAULT 1,
                email_verified INTEGER NOT NULL DEFAULT 0,
                agency_scope TEXT NOT NULL DEFAULT '',
                valid_from TEXT NOT NULL DEFAULT '',
                valid_until TEXT NOT NULL DEFAULT '',
                may_sign_stop INTEGER NOT NULL DEFAULT 0,
                signing_authority_ref TEXT NOT NULL DEFAULT '',
                must_change_password INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, active);
            CREATE TABLE IF NOT EXISTS news_articles (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                body TEXT NOT NULL,
                category TEXT NOT NULL,
                image_path TEXT NOT NULL DEFAULT '',
                source_url TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
                featured INTEGER NOT NULL DEFAULT 0,
                published_at TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
                updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_news_public ON news_articles(status, featured DESC, published_at DESC);
            CREATE TABLE IF NOT EXISTS news_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                news_id TEXT NOT NULL REFERENCES news_articles(id),
                actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                actor_name TEXT NOT NULL,
                action TEXT NOT NULL,
                before_json TEXT,
                after_json TEXT,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_news_audit_article ON news_audit_log(news_id, id DESC);
            CREATE TABLE IF NOT EXISTS procedure_catalog_edits (
                procedure_code TEXT PRIMARY KEY,
                local_code TEXT NOT NULL DEFAULT '',
                name TEXT NOT NULL,
                field TEXT NOT NULL,
                category_key TEXT NOT NULL DEFAULT '',
                level TEXT NOT NULL,
                agency TEXT NOT NULL,
                source_url TEXT NOT NULL,
                checked_at TEXT NOT NULL,
                reason TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                updated_by TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS procedure_catalog_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                procedure_code TEXT NOT NULL,
                actor_id TEXT NOT NULL,
                actor_name TEXT NOT NULL,
                action TEXT NOT NULL,
                reason TEXT NOT NULL,
                before_json TEXT,
                after_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_procedure_catalog_audit_code ON procedure_catalog_audit(procedure_code, id DESC);
            CREATE TABLE IF NOT EXISTS procedure_category_edits (
                source_field TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                source_url TEXT NOT NULL,
                checked_at TEXT NOT NULL,
                reason TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                updated_by TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS procedure_category_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_field TEXT NOT NULL,
                actor_id TEXT NOT NULL,
                actor_name TEXT NOT NULL,
                reason TEXT NOT NULL,
                before_json TEXT,
                after_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_procedure_category_audit_field ON procedure_category_audit(source_field, id DESC);
            CREATE TABLE IF NOT EXISTS app_data_versions (
                data_key TEXT PRIMARY KEY,
                version INTEGER NOT NULL,
                applied_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS staff_access_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                requested_by TEXT NOT NULL REFERENCES users(id),
                role TEXT NOT NULL,
                agency_scope TEXT NOT NULL,
                valid_from TEXT NOT NULL,
                valid_until TEXT NOT NULL,
                requested_sign_stop INTEGER NOT NULL DEFAULT 0,
                signing_authority_ref TEXT NOT NULL DEFAULT '',
                authorized_sign_stop INTEGER NOT NULL DEFAULT 0,
                reason TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED')),
                reviewed_by TEXT REFERENCES users(id),
                review_note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                reviewed_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_access_requests_status_created ON staff_access_requests(status, created_at DESC);
            CREATE TABLE IF NOT EXISTS staff_account_changes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                requested_by TEXT NOT NULL REFERENCES users(id),
                before_json TEXT NOT NULL,
                proposed_json TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED')),
                reviewed_by TEXT REFERENCES users(id),
                review_note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                reviewed_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_account_changes_status_created ON staff_account_changes(status, created_at DESC);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_account_changes_one_pending_per_user ON staff_account_changes(user_id) WHERE status='PENDING';
            CREATE TABLE IF NOT EXISTS staff_authority_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL REFERENCES users(id),
                changed_by TEXT NOT NULL REFERENCES users(id),
                action TEXT NOT NULL CHECK(action IN ('GRANT_STOP_SIGNING','REVOKE_STOP_SIGNING')),
                authority_ref TEXT NOT NULL DEFAULT '',
                reason TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_staff_authority_user ON staff_authority_events(user_id, id);
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                csrf_token TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        """)
        if "submission_hash" not in {row["name"] for row in con.execute("PRAGMA table_info(case_lookup_secrets)")} :
            con.execute("ALTER TABLE case_lookup_secrets ADD COLUMN submission_hash TEXT NOT NULL DEFAULT ''")
        payment_columns = {row["name"] for row in con.execute("PRAGMA table_info(payment_records)").fetchall()}
        for name, declaration in {
            "provider_mode": "TEXT NOT NULL DEFAULT 'LOCAL_SANDBOX'",
            "payment_method": "TEXT NOT NULL DEFAULT 'SANDBOX'",
        }.items():
            if name not in payment_columns:
                con.execute(f"ALTER TABLE payment_records ADD COLUMN {name} {declaration}")
        for table, declarations in {
            "payment_records": {"payer_reference": "TEXT NOT NULL DEFAULT ''", "reconciliation_reference": "TEXT NOT NULL DEFAULT ''"},
            "payment_refunds": {"executed_at": "TEXT", "execution_reference": "TEXT NOT NULL DEFAULT ''"},
        }.items():
            columns = {row["name"] for row in con.execute(f"PRAGMA table_info({table})")}
            for name, declaration in declarations.items():
                if name not in columns:
                    con.execute(f"ALTER TABLE {table} ADD COLUMN {name} {declaration}")
        workflow_extensions.init_schema(con)
        catalog_edit_cols = {row["name"] for row in con.execute("PRAGMA table_info(procedure_catalog_edits)")}
        if "category_key" not in catalog_edit_cols:
            con.execute("ALTER TABLE procedure_catalog_edits ADD COLUMN category_key TEXT NOT NULL DEFAULT ''")
        if "local_code" not in catalog_edit_cols:
            con.execute("ALTER TABLE procedure_catalog_edits ADD COLUMN local_code TEXT NOT NULL DEFAULT ''")
        if "submission_json" not in catalog_edit_cols:
            con.execute("ALTER TABLE procedure_catalog_edits ADD COLUMN submission_json TEXT NOT NULL DEFAULT ''")
        if con.execute("SELECT COUNT(*) FROM news_articles").fetchone()[0] == 0:
            for news_id, title, date_label, category, image_path, summary, source_path, featured in DEFAULT_NEWS:
                published_at = datetime.strptime(date_label, "%d/%m/%Y").replace(tzinfo=TZ).isoformat(timespec="seconds")
                con.execute("INSERT INTO news_articles(id,title,summary,body,category,image_path,source_url,status,featured,published_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'PUBLISHED',?,?,?,?)", (news_id, title, summary, summary, category, image_path, "https://ttpvhcc.hanoi.gov.vn" + source_path, featured, published_at, published_at, published_at))
        user_columns = {row["name"] for row in con.execute("PRAGMA table_info(users)").fetchall()}
        for name, declaration in {
            "agency_scope": "TEXT NOT NULL DEFAULT ''",
            "valid_from": "TEXT NOT NULL DEFAULT ''",
            "valid_until": "TEXT NOT NULL DEFAULT ''",
            "may_sign_stop": "INTEGER NOT NULL DEFAULT 0",
            "signing_authority_ref": "TEXT NOT NULL DEFAULT ''",
            "must_change_password": "INTEGER NOT NULL DEFAULT 0",
            "can_manage_agency_accounts": "INTEGER NOT NULL DEFAULT 0",
        }.items():
            if name not in user_columns:
                con.execute(f"ALTER TABLE users ADD COLUMN {name} {declaration}")
        request_columns = {row["name"] for row in con.execute("PRAGMA table_info(staff_access_requests)").fetchall()}
        for name, declaration in {
            "requested_sign_stop": "INTEGER NOT NULL DEFAULT 0",
            "signing_authority_ref": "TEXT NOT NULL DEFAULT ''",
            "authorized_sign_stop": "INTEGER NOT NULL DEFAULT 0",
        }.items():
            if name not in request_columns:
                con.execute(f"ALTER TABLE staff_access_requests ADD COLUMN {name} {declaration}")
        con.execute("DELETE FROM sessions WHERE expires_at < ?", (int(datetime.now(TZ).timestamp()),))
        global PROCEDURE_OVERRIDES
        PROCEDURE_OVERRIDES = {}
        for row in con.execute("SELECT * FROM procedure_catalog_edits").fetchall():
            parsed_submission = None
            raw_sub = row["submission_json"] if "submission_json" in row.keys() else ""
            if raw_sub:
                try:
                    parsed_submission = json.loads(raw_sub)
                except json.JSONDecodeError:
                    parsed_submission = None
            PROCEDURE_OVERRIDES[row["procedure_code"]] = {
                "localCode": row["local_code"] or row["procedure_code"],
                "name": row["name"], "field": row["field"], "categoryKey": row["category_key"] or row["field"] or "Chưa phân loại", "level": row["level"], "agency": row["agency"],
                "sourceUrl": row["source_url"], "checkedAt": row["checked_at"], "reason": row["reason"],
                "version": row["version"], "updatedBy": row["updated_by"], "updatedAt": row["updated_at"],
                "submission": parsed_submission,
            }
        for code, edit in PROCEDURE_OVERRIDES.items():
            if code in PROCEDURE_BY_CODE:
                PROCEDURE_BY_CODE[code].update({key: edit[key] for key in ("name", "field", "level", "agency")})
                PROCEDURE_BY_CODE[code]["fieldSource"] = edit.get("categoryKey") or edit["field"] or "Chưa phân loại"
                PROCEDURE_BY_CODE[code]["serviceMode"] = {"Toàn trình": "FULL", "Một phần": "PARTIAL", "Cung cấp thông tin": "INFORMATION"}.get(edit["level"], "UNKNOWN")
                if isinstance(edit.get("submission"), dict):
                    PROCEDURE_BY_CODE[code]["submission"] = edit["submission"]
                ensure_procedure_submission(PROCEDURE_BY_CODE[code])
                if edit.get("localCode") and edit["localCode"] != code:
                    PROCEDURE_BY_CODE[edit["localCode"]] = PROCEDURE_BY_CODE[code]
        global PROCEDURE_CATEGORY_OVERRIDES
        PROCEDURE_CATEGORY_OVERRIDES = {
            row["source_field"]: {
                "displayName": row["display_name"], "sourceUrl": row["source_url"], "checkedAt": row["checked_at"],
                "reason": row["reason"], "version": row["version"], "updatedBy": row["updated_by"], "updatedAt": row["updated_at"],
            }
            for row in con.execute("SELECT * FROM procedure_category_edits").fetchall()
        }
        for procedure in PROCEDURES:
            category_edit = PROCEDURE_CATEGORY_OVERRIDES.get(procedure.get("fieldSource") or "Chưa phân loại")
            if category_edit:
                procedure["field"] = category_edit["displayName"]
    # Recovery keeps existing cases and accounts intact; no automatic sample seeding.


def procedure_for(code: str) -> dict:
    return PROCEDURE_BY_CODE.get(code) or {
        "ref": "", "code": code, "name": "Thủ tục hành chính", "field": "Khác",
        "level": "Cần đối chiếu", "agency": "Cơ quan giải quyết theo danh mục", "verified": False,
    }


def compute_deadline(procedure_code: str, accepted_at: datetime, profile: dict | None = None) -> tuple[str | None, str | None]:
    """Use the case's pinned policy; never invent a final deadline from a milestone."""
    profile = profile or workflows.PROFILES.get(procedure_code) or {}
    rule = profile.get("deadline") or {}
    if rule.get("kind") != "SAME_DAY":
        return None, rule.get("note") or "Chưa cấu hình hạn: cần xác nhận đúng phiên bản thủ tục và cơ quan."
    local = accepted_at.astimezone(TZ)
    due = local.date()
    if not is_workday(due):
        due = next_workday(due)
    elif local.time() > time(rule["cutoffHour"], 0):
        due = next_workday(due)
    return due.isoformat(), rule["note"]


def calendar_dates() -> tuple[set[str], set[str]]:
    try:
        config = json.loads(CALENDAR_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        config = {}
    holidays = {str(x) for x in config.get("holidays", [])}
    working = {str(x) for x in config.get("working_weekends", [])}
    return holidays, working


def is_workday(day: date) -> bool:
    holidays, working_weekends = calendar_dates()
    key = day.isoformat()
    if key in working_weekends:
        return True
    return day.weekday() < 5 and key not in holidays


def next_workday(day: date) -> date:
    next_day = day + timedelta(days=1)
    while not is_workday(next_day):
        next_day += timedelta(days=1)
    return next_day


def add_event(con: sqlite3.Connection, case_id: int, role: str, actor: str, action: str,
              title: str, detail: str = "", audience: str = "public", at: str | None = None) -> None:
    con.execute(
        "INSERT INTO case_events(case_id,actor_role,actor_name,action,title,detail,audience,created_at) VALUES(?,?,?,?,?,?,?,?)",
        (case_id, role, actor, action, title, detail, audience, at or now_iso()),
    )


def rows_to_dicts(rows) -> list[dict]:
    return [dict(row) for row in rows]


def news_item_dict(row: sqlite3.Row, include_draft: bool = False) -> dict:
    published_at = row["published_at"] or ""
    return {
        "id": row["id"], "title": row["title"], "summary": row["summary"], "description": row["summary"],
        "body": row["body"], "category": row["category"], "section": row["category"],
        "image": row["image_path"], "sourceUrl": row["source_url"], "featured": bool(row["featured"]),
        "status": row["status"] if include_draft else "PUBLISHED", "publishedAt": published_at,
        "date": datetime.fromisoformat(published_at).astimezone(TZ).strftime("%d/%m/%Y") if published_at else "",
        "version": row["version"], "createdAt": row["created_at"], "updatedAt": row["updated_at"],
    }


def clean_multiline(value, limit: int) -> str:
    if not isinstance(value, str):
        raise ValueError("Nội dung tin phải là văn bản.")
    lines = [" ".join(line.strip().split()) for line in value.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    return "\n".join(lines).strip()[:limit]


def validate_news_fields(body: dict) -> dict:
    title = clean_text(body.get("title"), 180)
    summary = clean_text(body.get("summary"), 500)
    content = clean_multiline(body.get("body", ""), 20000)
    category = clean_text(body.get("category"), 80)
    image_path = clean_text(body.get("image"), 120)
    source_url = clean_text(body.get("sourceUrl"), 600)
    if len(title) < 8:
        raise ValueError("Tiêu đề cần ít nhất 8 ký tự.")
    if len(summary) < 20:
        raise ValueError("Tóm tắt cần ít nhất 20 ký tự.")
    if len(content) < 30:
        raise ValueError("Nội dung tin cần ít nhất 30 ký tự.")
    if category not in NEWS_CATEGORIES:
        raise ValueError("Chọn một chuyên mục đã được khai báo.")
    if image_path:
        if Path(image_path).name != image_path or not re.fullmatch(r"[A-Za-z0-9_.-]{1,120}", image_path):
            raise ValueError("Ảnh tin phải chọn từ thư viện ảnh của ứng dụng.")
        image_file = ROOT / "frontend" / "public" / "images" / image_path
        if not image_file.is_file():
            raise ValueError("Không tìm thấy ảnh trong thư viện của ứng dụng.")
    if source_url:
        parsed = urlparse(source_url)
        host = (parsed.hostname or "").lower()
        if parsed.scheme != "https" or not host or not (host.endswith(".gov.vn") or host == "gov.vn"):
            raise ValueError("Nguồn tin phải là địa chỉ HTTPS thuộc miền .gov.vn.")
    if body.get("featured") not in (True, False):
        raise ValueError("Trạng thái tin nổi bật không hợp lệ.")
    return {"title": title, "summary": summary, "body": content, "category": category, "image_path": image_path, "source_url": source_url, "featured": int(body["featured"])}


def events_for(con: sqlite3.Connection, case_id: int, include_internal: bool) -> list[dict]:
    if include_internal:
        rows = con.execute("SELECT * FROM case_events WHERE case_id=? ORDER BY id", (case_id,)).fetchall()
    else:
        rows = con.execute("SELECT * FROM case_events WHERE case_id=? AND audience='public' ORDER BY id", (case_id,)).fetchall()
    return [{"id": r["id"], "role": r["actor_role"], "actor": r["actor_name"], "action": r["action"], "title": r["title"], "detail": r["detail"], "audience": r["audience"], "at": r["created_at"]} for r in rows]


def normalize_agency_name(name: str) -> str:
    val = " ".join(str(name or "").strip().split()).casefold()
    for suffix in (" thành phố hà nội", " tp. hà nội", " tp hà nội", " hà nội"):
        if val.endswith(suffix) and len(val) > len(suffix) + 3:
            val = val[:-len(suffix)].strip()
    return val


def same_agency_scope(scope_a: str, scope_b: str) -> bool:
    a = (scope_a or "").strip()
    b = (scope_b or "").strip()
    if not a or not b:
        return False
    if not workflows.concrete_agency(a) or not workflows.concrete_agency(b):
        return False
    return normalize_agency_name(a) == normalize_agency_name(b)


def feedback_for_scope(con: sqlite3.Connection, role: str, visible_codes: set[str]) -> list[sqlite3.Row]:
    if role == "admin":
        return con.execute(
            "SELECT f.id,f.score,f.content,f.created_at,c.code FROM feedback f JOIN cases c ON c.id=f.case_id ORDER BY f.id DESC LIMIT 50"
        ).fetchall()
    if role != "leader" or not visible_codes:
        return []
    codes = sorted(visible_codes)
    placeholders = ",".join("?" for _ in codes)
    return con.execute(
        f"SELECT f.id,f.score,f.content,f.created_at,c.code FROM feedback f JOIN cases c ON c.id=f.case_id WHERE c.code IN ({placeholders}) ORDER BY f.id DESC LIMIT 50",
        tuple(codes),
    ).fetchall()


def case_dict(con: sqlite3.Connection, row: sqlite3.Row, include_internal: bool, role: str | None = None) -> dict:
    item = json.loads(row["payload_json"])
    item["id"] = row["id"]
    item["code"] = row["code"]
    item["version"] = row["version"]
    item["status"] = row["status"]
    item["statusLabel"] = STATUS_LABELS.get(row["status"], row["status"])
    item["createdAt"] = row["created_at"]
    item["updatedAt"] = row["updated_at"]
    item["events"] = events_for(con, row["id"], include_internal)
    item["workflowGuard"] = workflows.guard_summary(item)
    item["canManageLookupKey"] = include_internal and role in {"intake", "registrar"}
    item["sandboxSignature"] = sandbox_signature_view(con, row["id"], {**item, "code": row["code"], "procedureCode": row["procedure_code"]})
    def public_file_link(file_record: dict) -> dict:
        return {
            "name": file_record.get("name", "Tài liệu"),
            "size": file_record.get("size"),
            "type": file_record.get("type"),
            "downloadUrl": f"/api/cases/{quote(row['code'], safe='')}/files/{quote(str(file_record.get('stored', '')), safe='')}",
        }
    item["attachments"] = [public_file_link(file_record) for file_record in (item.get("attachments") or []) if isinstance(file_record, dict)]
    if include_internal and isinstance(item.get("withdrawal"), dict):
        internal_withdrawal = item["withdrawal"]
        internal_withdrawal["requestDocuments"] = [public_file_link(file_record) for file_record in (internal_withdrawal.get("requestDocuments") or []) if isinstance(file_record, dict)]
        if isinstance(internal_withdrawal.get("noticeFile"), dict):
            internal_withdrawal["noticeFile"] = public_file_link(internal_withdrawal["noticeFile"])
    if not include_internal and isinstance(item.get("withdrawal"), dict):
        withdrawal = item["withdrawal"]
        public_withdrawal = {
            key: withdrawal[key]
            for key in ("status", "channel", "requestReceivedAt", "noticeNumber", "noticeIssuedAt", "noticeDelivery", "ineligibleReason")
            if key in withdrawal
        }
        notice_file = withdrawal.get("noticeFile")
        if isinstance(notice_file, dict) and withdrawal.get("status") == "DA_PHAT_HANH":
            public_withdrawal["noticeDocument"] = public_file_link(notice_file)
        item["withdrawal"] = public_withdrawal
    if role in {"admin", "finance", "leader"}:
        payments = con.execute("SELECT transaction_ref,amount,status,basis,created_at,reconciled_at,provider_mode,payment_method,payer_reference,reconciliation_reference FROM payment_records WHERE case_id=? ORDER BY id", (row["id"],)).fetchall()
        item["payments"] = [dict(p) for p in payments]
    else:
        item["payments"] = []
    if role == "finance":
        applicant = item.get("applicant") or {}
        item["applicant"] = {"name": applicant.get("name", "")}
        item.pop("subject", None)
        item["attachments"] = []
        item["events"] = [event for event in item["events"] if event.get("action") in {"set_fee", "waive_fee", "pay", "reconcile"}]
        for key in ("draftResult", "supplement", "supplementHistory", "approvalNote", "publicNote", "withdrawal", "sync", "paperOriginals", "declaration", "requestSummary", "deliveryAddress", "workflowEvidence", "workflowEvidenceHistory"):
            item.pop(key, None)
    return item


def visible_to_user(user: sqlite3.Row, row: sqlite3.Row) -> bool:
    role = user["role"]
    # Account administrators manage staff access, not citizen case files. Keeping
    # them out of this predicate prevents a management account from becoming an
    # implicit, city-wide data reader through the inbox, detail, files, or export APIs.
    if role == "admin":
        return False
    if role == "citizen":
        return row["owner_id"] == user["id"]
    payload = json.loads(row["payload_json"])
    agency_scope = (user["agency_scope"] or "").strip()
    case_scope = (payload.get("agencyScope") or payload.get("receivingAgency") or "").strip()
    if not agency_scope or not case_scope:
        return False
    if not same_agency_scope(agency_scope, case_scope):
        return False
    if payload.get("receivingAgency") and not same_agency_scope(case_scope, payload["receivingAgency"]):
        return False
    if role == "intake":
        return True
    if role == "specialist":
        return (payload.get("assignment") or {}).get("assigneeId") == user["id"]
    if role == "leader":
        return True
    if role == "registrar":
        return row["status"] in {"DA_PHE_DUYET", "DA_PHAT_HANH", "HOAN_THANH"}
    if role == "finance":
        return payload.get("fee", {}).get("status") in {"DUE", "PAID", "RECONCILED", "REFUNDED"}
    return False


def public_case_view(con: sqlite3.Connection, row: sqlite3.Row) -> dict:
    """Return only the owner-facing case fields after a receipt key was verified."""
    payload = json.loads(row["payload_json"])
    applicant = payload.get("applicant") or {}
    procedure = payload.get("procedure") or procedure_for(row["procedure_code"])
    supplement = payload.get("supplement") or {}
    feedback_exists = con.execute("SELECT 1 FROM feedback WHERE case_id=?", (row["id"],)).fetchone() is not None
    payment_rows = con.execute("SELECT transaction_ref,amount,status,basis,created_at,reconciled_at,provider_mode,payment_method,payer_reference,reconciliation_reference FROM payment_records WHERE case_id=? ORDER BY id", (row["id"],)).fetchall()
    signature = sandbox_signature_view(con, row["id"], {**payload, "code": row["code"], "procedureCode": row["procedure_code"]})
    raw_result = payload.get("result") if row["status"] in {"DA_PHAT_HANH", "HOAN_THANH"} else None
    result = ({key: raw_result[key] for key in ("number", "content", "issuedAt", "publishedAt") if key in raw_result}
              if isinstance(raw_result, dict) else None)
    if isinstance(result, dict) and signature:
        result["signature"] = signature
    withdrawal = payload.get("withdrawal")
    public_withdrawal = None
    if isinstance(withdrawal, dict):
        public_withdrawal = {
            key: withdrawal[key]
            for key in ("status", "channel", "requestReceivedAt", "noticeNumber", "noticeIssuedAt", "noticeDelivery", "ineligibleReason")
            if key in withdrawal
        }
        notice_file = withdrawal.get("noticeFile")
        if isinstance(notice_file, dict) and withdrawal.get("status") == "DA_PHAT_HANH":
            public_withdrawal["noticeDocument"] = {
                "name": notice_file.get("name", "Tài liệu"),
                "size": notice_file.get("size"),
                "type": notice_file.get("type"),
                "downloadUrl": f"/api/cases/{quote(row['code'], safe='')}/files/{quote(str(notice_file.get('stored', '')), safe='')}",
            }
    return {
        "code": row["code"],
        "procedureCode": row["procedure_code"],
        "procedure": procedure,
        "status": row["status"],
        "statusLabel": STATUS_LABELS.get(row["status"], row["status"]),
        "milestones": payload.get("milestones", []),
        "version": row["version"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "deadline": payload.get("deadline"),
        "deadlineNote": payload.get("deadlineNote"),
        "receivingAgency": payload.get("receivingAgency", ""),
        "applicant": {"name": applicant.get("name", "")},
        "requestSummary": payload.get("requestSummary", ""),
        "attachments": [{"name": item.get("name", "Tài liệu"), "size": item.get("size"), "type": item.get("type")} for item in payload.get("attachments", []) if isinstance(item, dict)],
        "events": citizen_processing_events(con, row["id"]),
        "progress": case_progress(con, row, payload),
        "declaration": payload.get("declaration", {}),
        "deliveryMethod": payload.get("deliveryMethod", ""),
        "deliveryAddress": payload.get("deliveryAddress", ""),
        "delivery": ({key: payload["delivery"][key] for key in ("receiver", "evidence", "channel", "deliveredAt", "mode") if key in payload["delivery"]} if isinstance(payload.get("delivery"), dict) else None),
        "supplement": {key: supplement[key] for key in ("reason", "items", "requestedAt", "requestNumber", "stage", "submittedAt", "resumeStatus") if key in supplement},
        "withdrawal": public_withdrawal,
        "publicNote": payload.get("publicNote", ""),
        "result": result,
        "fee": ({key: payload["fee"][key] for key in ("status", "paymentStatus", "amount", "currency", "basis", "configuredAt", "paidAt", "reconciledAt", "refundStatus", "refundedAt", "transactionRef") if key in payload["fee"]} if isinstance(payload.get("fee"), dict) else None),
        "payments": [{"transactionRef": p["transaction_ref"], "amount": p["amount"], "status": p["status"], "basis": p["basis"], "createdAt": p["created_at"], "reconciledAt": p["reconciled_at"], "mode": p["provider_mode"], "method": p["payment_method"], "payerReference": p["payer_reference"], "reconciliationReference": p["reconciliation_reference"]} for p in payment_rows],
        "feedbackSubmitted": feedback_exists,
        "sampleData": bool(payload.get("sampleDatasetVersion")),
        "sampleDataNote": payload.get("sampleNote", "") if payload.get("sampleDatasetVersion") else "",
    }


def citizen_processing_events(con, case_id: int) -> list[dict]:
    # Publish progress milestones without exposing internal drafts or review notes.
    milestones = {"assign": "Đã chuyển chuyên viên thụ lý", "submit_review": "Đang xem xét phê duyệt", "send_back": "Chuyển lại khâu thụ lý để hoàn thiện", "approve": "Đã phê duyệt, chờ phát hành"}
    result = []
    for event in events_for(con, case_id, include_internal=True):
        if event["audience"] == "public" or event["action"] in milestones:
            result.append({"id": event["id"], "action": event["action"], "title": milestones.get(event["action"], event["title"]), "detail": event["detail"] if event["audience"] == "public" else "", "at": event["at"], "audience": "public"})
    return result


def case_progress(con, row, payload) -> list[dict]:
    events = events_for(con, row["id"], include_internal=True)
    definitions = [("submitted", "Gửi hồ sơ", "submit"), ("intake", "Kiểm tra, tiếp nhận", "accept"), ("handling", "Thụ lý, thẩm định", "submit_review"), ("review", "Xem xét, phê duyệt", "approve"), ("issue", "Phát hành kết quả", "issue"), ("delivery", "Trả kết quả", "deliver")]
    stage_for_status = {"CHO_TIEP_NHAN": "intake", "DA_TIEP_NHAN": "handling", "DANG_THU_LY": "handling", "TRINH_DUYET": "review", "DA_PHE_DUYET": "issue", "DA_PHAT_HANH": "delivery", "HOAN_THANH": "delivery", "TU_CHOI": "intake", "KHONG_GIAI_QUYET": "review"}
    status = row["status"]
    active = stage_for_status.get(status)
    if status == "CHO_BO_SUNG":
        active = stage_for_status.get((payload.get("supplement") or {}).get("resumeStatus"), "intake")
    if status == "DUNG":
        transitions = {"submit": "intake", "accept": "handling", "assign": "handling", "submit_review": "review", "send_back": "handling", "approve": "issue", "issue": "delivery"}
        active = next((transitions[e["action"]] for e in reversed(events) if e["action"] in transitions), "intake")
    result = []
    profile = workflows.case_profile(payload) or {}
    for stage, label, completion_action in definitions:
        label = profile.get("stages", {}).get(stage, label)
        evidence = [e for e in events if e["action"] == completion_action]
        state = "completed" if evidence else "pending"
        if stage == active and status != "HOAN_THANH":
            state = "terminated" if status in {"TU_CHOI", "KHONG_GIAI_QUYET", "DUNG"} else "paused" if status == "CHO_BO_SUNG" else "current"
        # A returned draft reopens handling; a prior presentation is not final approval.
        if stage == "review" and status == "DANG_THU_LY" and not any(e["action"] == "approve" for e in events):
            state = "pending"
        result.append({"id": stage, "label": label, "state": state, "at": evidence[-1]["at"] if evidence else None})
    return result


def form_item_visible(item: dict, applicant_type: str, declaration: dict) -> bool:
    if item.get("applicantTypes") and applicant_type not in item["applicantTypes"]:
        return False
    condition = item.get("when") or {}
    value = declaration.get(condition.get("field"), "")
    return ("equals" not in condition or value == condition["equals"]) and ("not" not in condition or value != condition["not"])


def validate_procedure_submission(procedure, body, applicant_type, files):
    workflows.require_submission(procedure)
    schema = procedure.get("submission")
    if procedure.get("serviceMode") in {"INFORMATION", "UNKNOWN"} or not schema:
        raise ValueError("Thủ tục chưa có biểu mẫu và thành phần hồ sơ được cấu hình để tiếp nhận trực tuyến. Không thể gửi bằng biểu mẫu chung.")
    if schema.get("sourceStatus") == "official-document-list-only" or not schema.get("fields"):
        raise ValueError("Nguồn chính thức hiện chỉ cung cấp thành phần hồ sơ, chưa cung cấp biểu mẫu tờ khai điện tử. Không thể tiếp nhận trực tuyến bằng cấu hình tham chiếu này; hãy mở thủ tục trên Cổng Dịch vụ công quốc gia.")
    if body.get("schemaVersion") != schema["version"]:
        raise ValueError("Không khớp phiên bản biểu mẫu của thủ tục. Hãy mở lại thủ tục để lập hồ sơ.")
    if body.get("confirmed") is not True:
        raise ValueError("Cần kiểm tra và xác nhận hồ sơ trước khi gửi.")
    raw = body.get("declaration")
    if not isinstance(raw, dict):
        raise ValueError("Thiếu tờ khai của thủ tục.")
    declaration = {}
    for item in schema["fields"]:
        if not form_item_visible(item, applicant_type, raw):
            continue
        raw_value = raw.get(item["id"], "")
        if not isinstance(raw_value, str):
            raise ValueError(f"Dữ liệu không hợp lệ: {item['label']}.")
        value = raw_value.strip()
        if item.get("required") and not value:
            raise ValueError(f"Cần khai: {item['label']}.")
        if len(value) > item.get("maxLength", 500):
            raise ValueError(f"Nội dung quá dài: {item['label']}.")
        if value and item.get("type") == "select" and value not in item["options"]:
            raise ValueError(f"Lựa chọn không hợp lệ: {item['label']}.")
        if value and item.get("type") == "email" and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError(f"Email không hợp lệ: {item['label']}.")
        if value and item.get("type") == "tel" and not re.fullmatch(r"[+\d][\d ().-]{6,39}", value):
            raise ValueError(f"Số điện thoại không hợp lệ: {item['label']}.")
        if value and item.get("type") == "number":
            if not value.isdigit() or not item.get("min", 1) <= int(value) <= item.get("max", 100):
                raise ValueError(f"Số lượng không hợp lệ: {item['label']}.")
        if value and item.get("type") == "date":
            try:
                if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value): raise ValueError()
                date.fromisoformat(value)
            except ValueError as exc:
                raise ValueError(f"Ngày không hợp lệ: {item['label']}.") from exc
        declaration[item["id"]] = value
    if procedure["code"] == "2.000908" and declaration.get("registerAuthority", "").casefold() != clean_text(body.get("receivingAgency"), 180).casefold():
        raise ValueError("Cơ quan tiếp nhận phải là cơ quan đang quản lý sổ gốc đã khai. Chọn lại đúng cơ quan.")
    documents = [item for item in schema["documents"] if form_item_visible(item, applicant_type, declaration)]
    allowed = {item["id"] for item in documents}
    if any(file.get("componentId") not in allowed for file in files):
        raise ValueError("Tệp đính kèm không thuộc thành phần hồ sơ của trường hợp đã chọn.")
    for item in documents:
        if item.get("required") and not any(file.get("componentId") == item["id"] for file in files):
            raise ValueError(f"Thiếu thành phần hồ sơ: {item['label']}.")
    delivery = clean_text(body.get("deliveryMethod"), 40)
    if delivery not in schema["deliveryMethods"]:
        raise ValueError("Chọn phương thức nhận kết quả.")
    delivery_address = clean_text(body.get("deliveryAddress"), 500)
    if delivery == "Bưu chính" and len(delivery_address) < 10:
        raise ValueError("Cần địa chỉ nhận kết quả qua bưu chính.")
    return declaration, delivery, delivery_address


def check_public_rate_limit(address: str, action: str, limit: int) -> None:
    now = monotonic()
    key = f"{action}:{address or 'unknown'}"
    with PUBLIC_ATTEMPTS_LOCK:
        recent = [at for at in PUBLIC_ATTEMPTS.get(key, []) if now - at < PUBLIC_WINDOW_SECONDS]
        if len(recent) >= limit:
            raise RateLimitError("Đã có nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.")
        recent.append(now)
        PUBLIC_ATTEMPTS[key] = recent


def procedure_agency_options(procedure: dict) -> set[str]:
    """Return only explicitly named authorities available in the procedure reference."""
    options = {clean_text(procedure.get("agency"), 180).casefold()} - {""}
    routing = procedure.get("routing") or {}
    observed = routing.get("observedAuthorities") or []
    if isinstance(observed, list):
        options.update(clean_text(item.get("authority"), 180).casefold() for item in observed if isinstance(item, dict) and clean_text(item.get("authority"), 180))
    return options


def clean_text(value, limit: int = 4000) -> str:
    return " ".join(str(value or "").strip().split())[:limit]


def csv_safe(value) -> str:
    text = str(value or "")
    if text.lstrip(" \t\r\n")[:1] in {"=", "+", "-", "@"}:
        return "'" + text
    return text


def normalize_email(value: str) -> str:
    email = clean_text(value, 254).lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise ValueError("Địa chỉ email không hợp lệ.")
    return email


def password_hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS, dklen=32)


def validate_password(password: str) -> None:
    if not isinstance(password, str) or len(password) < 12 or len(password) > 128:
        raise ValueError("Mật khẩu cần có từ 12 đến 128 ký tự.")
    if not any(ch.islower() for ch in password) or not any(ch.isupper() for ch in password) or not any(ch.isdigit() for ch in password):
        raise ValueError("Mật khẩu cần có chữ hoa, chữ thường và chữ số.")


def public_user(user: sqlite3.Row) -> dict:
    today = datetime.now(TZ).date().isoformat()
    may_sign_sandbox = False
    if user["role"] == "leader" and user["active"] and (not user["valid_from"] or user["valid_from"] <= today) and (not user["valid_until"] or user["valid_until"] >= today):
        with DB_LOCK, connect() as con:
            may_sign_sandbox = bool(con.execute("SELECT 1 FROM sandbox_signing_authorities WHERE user_id=? AND active=1", (user["id"],)).fetchone())
    return {"id": user["id"], "email": user["email"], "phone": user["phone"], "name": user["full_name"], "role": user["role"], "emailVerified": False, "agencyScope": user["agency_scope"], "validFrom": user["valid_from"], "validUntil": user["valid_until"], "maySignStop": bool(user["may_sign_stop"]), "signingAuthorityRef": user["signing_authority_ref"], "maySignSandbox": may_sign_sandbox, "mustChangePassword": bool(user["must_change_password"]), "canManageAgencyAccounts": bool(user["can_manage_agency_accounts"])}


def can_manage_staff_accounts(user: sqlite3.Row) -> bool:
    return user["role"] == "admin" or bool(user["can_manage_agency_accounts"])


def new_session(con: sqlite3.Connection, user_id: str) -> tuple[str, str, int]:
    token = secrets.token_urlsafe(48)
    csrf = secrets.token_urlsafe(32)
    expires = int(datetime.now(TZ).timestamp()) + SESSION_TTL
    token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
    con.execute("INSERT INTO sessions(token_hash,user_id,csrf_token,expires_at,created_at) VALUES(?,?,?,?,?)", (token_hash, user_id, csrf, expires, now_iso()))
    return token, csrf, expires


def save_files(case_code: str, files) -> list[dict]:
    prepared = []
    for file in files or []:
        name = Path(str(file.get("name", "tai-lieu"))).name
        ext = Path(name).suffix.lower()
        if ext not in ALLOWED_EXTS:
            raise ValueError(f"Tệp {name} không đúng định dạng. Chỉ nhận PDF, PNG, JPG hoặc JPEG.")
        try:
            raw = base64.b64decode(file.get("data", ""), validate=True)
        except (ValueError, TypeError) as exc:
            raise ValueError(f"Dữ liệu tệp {name} không hợp lệ.") from exc
        if len(raw) > MAX_FILE:
            raise ValueError(f"Tệp {name} vượt quá giới hạn 8 MB.")
        if not raw:
            raise ValueError(f"Tệp {name} đang trống.")
        signatures = {
            ".pdf": raw.startswith(b"%PDF-"),
            ".png": raw.startswith(b"\x89PNG\r\n\x1a\n"),
            ".jpg": raw.startswith(b"\xff\xd8\xff"),
            ".jpeg": raw.startswith(b"\xff\xd8\xff"),
        }
        if not signatures[ext]:
            raise ValueError(f"Nội dung tệp {name} không khớp với định dạng .{ext.lstrip('.')}.")
        prepared.append((name, ext, raw))

    saved = []
    case_dir = UPLOAD_DIR / case_code
    created_paths: list[Path] = []
    try:
        for name, ext, raw in prepared:
            case_dir.mkdir(parents=True, exist_ok=True)
            stored = f"{uuid.uuid4().hex[:10]}-{name}"
            target = case_dir / stored
            target.write_bytes(raw)
            created_paths.append(target)
            media_type = {".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}[ext]
            saved.append({"name": name, "stored": stored, "size": len(raw), "type": media_type, "sha256": hashlib.sha256(raw).hexdigest()})
    except Exception:
        for target in created_paths:
            target.unlink(missing_ok=True)
        if case_dir.exists() and not any(case_dir.iterdir()):
            case_dir.rmdir()
        raise
    return saved


def actor_info(body: dict, principal: sqlite3.Row | None = None) -> tuple[str, str]:
    role = principal["role"] if principal is not None else clean_text(body.get("role"), 30)
    name = principal["full_name"] if principal is not None else clean_text(body.get("actor"), 80)
    return role, name


def require_role(role: str, allowed: set[str]) -> None:
    if role not in allowed:
        raise PermissionError("Tài khoản không có quyền thực hiện thao tác này.")


def has_issued_result(case: dict) -> bool:
    """Detect a formal result even when a legacy payload lacks the case status flag."""
    issued_markers = (
        "decisionIssuedAt", "resultIssuedAt", "resultNoticeAt", "resultNoticeIssuedAt",
        "decisionIssued", "resultIssued", "resultNoticeIssued", "officialResultIssuedAt",
    )
    if any(case.get(key) is True or (case.get(key) not in (None, False, "", 0)) for key in issued_markers):
        return True

    issued_states = {"ISSUED", "PUBLISHED", "PHAT_HANH", "DA_PHAT_HANH", "DA_BAN_HANH", "DELIVERED"}
    draft_states = {"DRAFT", "NHAP", "DU_THAO", "CHO_DUYET", "PENDING", "UNSIGNED"}
    formal_artifacts = ("result", "resultNotice", "decisionDocument", "resultDocument", "resultNoticeDocument")
    for key in formal_artifacts:
        value = case.get(key)
        if value in (None, False, "", 0):
            continue
        if not isinstance(value, dict):
            # A non-empty final-result field is distinct from draftResult in this model.
            return True
        state = str(value.get("status", "")).strip().upper()
        if state in issued_states:
            return True
        if state in draft_states:
            continue
        if any(value.get(marker) for marker in ("issuedAt", "publishedAt", "deliveredAt", "issuedBy", "publishedBy", "official")):
            return True
        # Legacy integrations often store the final document without a status field.
        # A saved/signed document with a formal number is evidence of issuance; a draft
        # without those fields remains eligible for the second status check.
        has_document = any(value.get(marker) for marker in ("stored", "fileId", "documentId", "url", "downloadUrl", "signedFile"))
        has_formal_number = any(value.get(marker) for marker in ("number", "documentNumber", "decisionNumber", "resultNumber"))
        if has_document and has_formal_number:
            return True
    return False


def apply_action(con: sqlite3.Connection, row: sqlite3.Row, body: dict) -> tuple[str, str, str, str]:
    """Apply one domain transition and return action/title/detail/audience."""
    case = json.loads(row["payload_json"])
    role, actor = actor_info(body)
    action = clean_text(body.get("action"), 40)
    payload = body.get("payload") or {}
    withdrawal = case.get("withdrawal") or {}
    if withdrawal.get("status") == "CHO_KY_PHAT_HANH" and action != "issue_stop_notice":
        raise ValueError("Đang chờ ký và phát hành Mẫu 06. Hồ sơ được giữ nguyên trạng thái; xử lý yêu cầu dừng trước các thao tác xung đột.")
    if action == "sync":
        raise PermissionError("Chưa có hợp đồng và thông tin xác thực để đồng bộ với hệ thống bên ngoài.")
    current = row["status"]
    expected = body.get("expectedVersion")
    if type(expected) is not int or expected < 1:
        raise ValueError("Thiếu phiên bản hồ sơ. Hãy tải lại hồ sơ trước khi thao tác.")
    if expected != row["version"]:
        raise RuntimeError("Hồ sơ vừa được cập nhật ở phiên khác. Hãy tải lại trước khi thao tác.")
    workflows.authorize_action(role, action)
    profile = workflows.action_guard(case, action)
    if profile and not case.get("workflow"):
        case["workflow"] = {**profile, "procedureCode": row["procedure_code"]}

    title = ""
    detail = ""
    audience = "public"
    next_status = current

    if profile and action == profile["verificationAction"]:
        require_role(role, {"specialist"})
        if current != "DANG_THU_LY":
            raise ValueError("Chỉ ghi kết quả kiểm tra khi hồ sơ đang thụ lý; hồ sơ đã trình/duyệt cần trả lại trước.")
        evidence = workflows.verify_evidence(profile, payload.get("evidence"))
        evidence.update({"verifiedAt": now_iso(), "verifiedBy": actor, "verifiedById": body.get("userId"), "profileVersion": profile["version"]})
        case["workflowEvidence"] = evidence
        case.setdefault("workflowEvidenceHistory", []).append(evidence)
        for milestone in case.get("milestones", []):
            if profile.get("milestone", {}).get("id") == milestone["id"]:
                # Financial notice is completed by set_fee, not just an internal assessment.
                milestone["completedAt"] = now_iso() if evidence.get("financialAssessment") == "Không phát sinh nghĩa vụ tài chính" else None
        title = profile["verificationLabel"]
        detail = evidence["outcome"] + ". " + evidence["verificationBasis"]
        audience = "internal"
    elif action == "set_fee":
        require_role(role, {"intake"})
        if current not in {"DA_TIEP_NHAN", "DANG_THU_LY"}:
            raise ValueError("Chỉ cấu hình khoản thu khi hồ sơ đã được tiếp nhận và đang giải quyết.")
        if any(x["status"] in {"PENDING", "PAID", "RECONCILED", "REFUNDED"} for x in con.execute("SELECT status FROM payment_records WHERE case_id=?", (row["id"],)).fetchall()):
            raise ValueError("Hồ sơ đã có giao dịch; không thể thay đổi căn cứ hoặc số tiền.")
        amount = payload.get("amount")
        if type(amount) is not int or amount <= 0 or amount > 100_000_000:
            raise ValueError("Nhập số tiền nguyên dương, tối đa 100.000.000 đồng.")
        basis = clean_text(payload.get("basis"), 1200)
        if len(basis) < 15:
            raise ValueError("Ghi căn cứ và nguồn xác định khoản thu trước khi thông báo cho người nộp.")
        case["fee"] = {"status": "DUE", "amount": amount, "currency": "VND", "basis": basis, "configuredAt": now_iso(), "configuredBy": actor, "mode": "LOCAL_SANDBOX"}
        for milestone in case.get("milestones", []):
            if profile and milestone["id"] == profile.get("milestone", {}).get("id"):
                milestone["completedAt"] = now_iso()
        title = "Đã cấu hình khoản thu cho hồ sơ"
        detail = f"{amount:,} đồng · {basis} · môi trường thử nghiệm cục bộ; chưa thu tiền thật.".replace(",", ".")
    elif action == "waive_fee":
        require_role(role, {"leader"})
        if current in {"DA_PHAT_HANH", "HOAN_THANH", "TU_CHOI", "KHONG_GIAI_QUYET", "DUNG"}:
            raise ValueError("Không thể điều chỉnh khoản thu sau khi hồ sơ đã kết thúc.")
        fee = case.get("fee") or {}
        if fee.get("status") != "DUE":
            raise ValueError("Chỉ khoản thu đang đến hạn và chưa phát sinh giao dịch mới được miễn/điều chỉnh.")
        if con.execute("SELECT 1 FROM payment_records WHERE case_id=? AND status IN ('PENDING','PAID','RECONCILED') LIMIT 1", (row["id"],)).fetchone():
            raise ValueError("Hồ sơ đã có giao dịch; không thể miễn khoản thu qua thao tác này.")
        reason = clean_text(payload.get("reason"), 1200)
        if len(reason) < 12: raise ValueError("Ghi căn cứ miễn hoặc điều chỉnh khoản thu.")
        fee.update({"status": "WAIVED", "waivedAt": now_iso(), "waivedBy": actor, "waiverReason": reason})
        case["fee"] = fee
        title = "Đã ghi nhận miễn khoản thu"
        detail = reason
    elif action in {"create_payment", "confirm_payment"}:
        require_role(role, {"citizen"})
        if current in {"DA_PHAT_HANH", "HOAN_THANH", "TU_CHOI", "KHONG_GIAI_QUYET", "DUNG"}:
            raise ValueError("Hồ sơ đã kết thúc, không thể tạo giao dịch mới.")
        fee = case.get("fee") or {}
        if fee.get("status") not in {"DUE", "PAID"} or type(fee.get("amount")) is not int or fee["amount"] <= 0:
            raise ValueError("Hồ sơ chưa được cơ quan cấu hình khoản thu hợp lệ.")
        if action == "create_payment":
            if fee.get("status") != "DUE": raise ValueError("Khoản thu đã được thanh toán hoặc đã xử lý.")
            pending = con.execute("SELECT transaction_ref FROM payment_records WHERE case_id=? AND status='PENDING' ORDER BY id DESC LIMIT 1", (row["id"],)).fetchone()
            if pending: raise ValueError(f"Đang có giao dịch thử nghiệm {pending['transaction_ref']}; hãy tiếp tục giao dịch đó.")
            transaction_ref = f"HN-THU-{datetime.now(TZ):%Y%m%d%H%M%S}-{secrets.token_hex(3).upper()}"
            con.execute("INSERT INTO payment_records(case_id,transaction_ref,amount,status,basis,created_at,provider_mode,payment_method) VALUES(?,?,?,'PENDING',?,?, 'LOCAL_SANDBOX','SANDBOX')", (row["id"], transaction_ref, fee["amount"], fee["basis"], now_iso()))
            payment_event(con, transaction_ref, clean_text(body.get("userId"), 80), actor, "CREATED", "Tạo giao dịch thử nghiệm; chưa có tiền thật.", transaction_ref)
            fee["paymentStatus"] = "PENDING"
            title = "Đã tạo giao dịch thanh toán thử nghiệm"
            detail = f"Mã giao dịch {transaction_ref}; {fee['amount']:,} đồng. Chưa phát sinh thanh toán thật.".replace(",", ".")
        else:
            transaction_ref = clean_text(payload.get("transactionRef"), 80)
            payment = con.execute("SELECT * FROM payment_records WHERE case_id=? AND transaction_ref=?", (row["id"], transaction_ref)).fetchone()
            if not payment: raise ValueError("Không tìm thấy giao dịch của hồ sơ.")
            if payment["status"] == "PAID":
                title = "Giao dịch đã được xác nhận"
                detail = f"{transaction_ref} đã ở trạng thái đã thanh toán trong môi trường thử nghiệm."
            elif payment["status"] != "PENDING": raise ValueError("Chỉ giao dịch đang chờ mới được xác nhận.")
            else:
                payment_method = clean_text(payload.get("paymentMethod"), 40).upper()
                evidence = clean_text(payload.get("paymentEvidence"), 160)
                if payment_method not in {"BANK_TRANSFER", "COUNTER_RECEIPT", "POSTAL_RECEIPT", "OTHER"} or len(evidence) < 4:
                    raise ValueError("Chọn hình thức đã nộp và nhập mã giao dịch hoặc số biên lai tối thiểu 4 ký tự.")
                con.execute("UPDATE payment_records SET status='PAID',payment_method=?,payer_reference=? WHERE transaction_ref=? AND status='PENDING'", (payment_method, evidence, transaction_ref))
                payment_event(con, transaction_ref, clean_text(body.get("userId"), 80), actor, "PAID_DECLARED", "Người nộp khai đã thanh toán; chờ kế toán đối chiếu chứng từ.", transaction_ref)
                fee.update({"status": "PAID", "paymentStatus": "PAID", "paidAt": now_iso(), "transactionRef": transaction_ref})
                title = "Đã ghi nhận thông tin người nộp khai đã thanh toán"
                detail = f"Giao dịch {transaction_ref} đang chờ cán bộ tài chính đối chiếu chứng từ."
        case["fee"] = fee
    elif action == "accept":
        require_role(role, {"intake"})
        if current != "CHO_TIEP_NHAN": raise ValueError("Chỉ hồ sơ đang chờ tiếp nhận mới được xác nhận.")
        accepted = datetime.now(TZ)
        deadline, note = compute_deadline(case["procedureCode"], accepted, profile)
        case["acceptedAt"] = accepted.isoformat(timespec="seconds")
        case["deadline"] = deadline
        case["deadlineNote"] = note
        next_status = "DA_TIEP_NHAN"
        case["milestones"] = workflows.milestones(profile, accepted, is_workday) if profile else []
        title = "Đã tiếp nhận hồ sơ"
        detail = "Đã ghi thời điểm tiếp nhận hợp lệ và lập giấy tiếp nhận (Mẫu số 01). " + (f"Hạn dự kiến theo quy tắc của thủ tục: {deadline}." if deadline else "Hạn giải quyết cần được đơn vị nghiệp vụ xác nhận.")
    elif action == "digitize_documents":
        require_role(role, {"intake"})
        if case.get("submissionChannel") != "TRUC_TIEP":
            raise ValueError("Chỉ ghi nhận số hóa tại quầy cho hồ sơ nộp trực tiếp.")
        if current not in {"DA_TIEP_NHAN", "DANG_THU_LY"}:
            raise ValueError("Hồ sơ cần được tiếp nhận trước khi bổ sung bản số hóa.")
        raw_files = payload.get("files")
        if not isinstance(raw_files, list) or not raw_files or len(raw_files) > 8:
            raise ValueError("Chọn từ 1 đến 8 tệp quét thực tế của thành phần hồ sơ.")
        if sum(len(str(file.get("data", ""))) for file in raw_files if isinstance(file, dict)) > 12 * 1024 * 1024:
            raise ValueError("Tổng dung lượng tệp quét vượt quá 12 MB.")
        register = clean_text(payload.get("documentRegister"), 1200)
        if len(register) < 8:
            raise ValueError("Ghi danh mục giấy tờ được quét để kiểm đếm với bản gốc.")
        page_count = payload.get("pageCount")
        if type(page_count) is not int or page_count < 1 or page_count > 500:
            raise ValueError("Nhập số trang đã quét từ 1 đến 500.")
        scanned_files = save_files(row["code"], raw_files)
        for saved in scanned_files:
            saved["componentId"] = "SOHOA_QUAY"
        case.setdefault("attachments", []).extend(scanned_files)
        digitized_at = now_iso()
        batch = {"documents": scanned_files, "documentRegister": register, "pageCount": page_count, "digitizedAt": digitized_at, "digitizedBy": actor, "status": "DA_SO_HOA"}
        case.setdefault("digitizationHistory", []).append(batch)
        case["digitization"] = batch
        title = "Đã số hóa thành phần hồ sơ tại quầy"
        detail = f"Đã quét và ghi nhận {len(scanned_files)} tệp, {page_count} trang; danh mục đối chiếu: {register}."
        audience = "internal"
    elif action == "request_supplement":
        require_role(role, {"intake", "specialist"})
        if current not in {"CHO_TIEP_NHAN", "DA_TIEP_NHAN", "DANG_THU_LY"}: raise ValueError("Không thể yêu cầu bổ sung ở bước hiện tại.")
        reason = clean_text(payload.get("reason"), 1200)
        if len(reason) < 12: raise ValueError("Cần ghi rõ nội dung cần bổ sung và căn cứ.")
        raw_items = payload.get("items")
        items = [clean_text(x, 240) for x in raw_items if clean_text(x, 240)] if isinstance(raw_items, list) else []
        if not items: raise ValueError("Liệt kê cụ thể từng thông tin hoặc giấy tờ cần bổ sung; mỗi nội dung một dòng.")
        initial_check = role == "intake" and current == "CHO_TIEP_NHAN"
        if initial_check and case.get("initialSupplementRequestedAt"):
            raise ValueError("Lần kiểm tra đầu vào đã có phiếu hướng dẫn bổ sung. Không thể yêu cầu lại; hãy xử lý theo hồ sơ và dữ liệu đã nộp.")
        if not initial_check and any(s.get("stage") == "Trong quá trình giải quyết" for s in (case.get("supplementHistory") or []) if isinstance(s, dict)):
            raise ValueError("Trong quá trình giải quyết chỉ được yêu cầu bổ sung hồ sơ tối đa 01 lần theo quy định.")
        resume = current
        requested_at = now_iso()
        supplement = {"reason": reason, "items": items, "requestedAt": requested_at, "resumeStatus": resume, "stage": "Kiểm tra đầu vào" if initial_check else "Trong quá trình giải quyết", "requestNumber": len(case.get("supplementHistory", [])) + 1}
        case.setdefault("supplementHistory", []).append(supplement)
        case["supplement"] = supplement
        if initial_check:
            case["initialSupplementRequestedAt"] = requested_at
        next_status = "CHO_BO_SUNG"
        title = "Đã gửi phiếu yêu cầu bổ sung"
        detail = reason + "\n" + "\n".join(f"• {item}" for item in items)
    elif action == "submit_supplement":
        require_role(role, {"citizen", "intake"})
        if current != "CHO_BO_SUNG": raise ValueError("Hồ sơ hiện không chờ bổ sung.")
        note = clean_text(payload.get("note"), 1200)
        raw_files = payload.get("files", [])
        if not isinstance(raw_files, list): raise ValueError("Danh sách tệp bổ sung không hợp lệ.")
        if len(note) < 3 and not raw_files: raise ValueError("Hãy ghi nội dung hoặc đính kèm tài liệu bổ sung.")
        files = save_files(row["code"], raw_files)
        case.setdefault("attachments", []).extend(files)
        submitted_now = datetime.now(TZ)
        req_dt = parse_dt((case.get("supplement") or {}).get("requestedAt"))
        if req_dt:
            cursor_day = req_dt.astimezone(TZ).date()
            paused_workdays = 0
            while cursor_day < submitted_now.date():
                if is_workday(cursor_day):
                    paused_workdays += 1
                cursor_day += timedelta(days=1)
            deadlines = [(case, "deadline")] + [(milestone, "dueDate") for milestone in case.get("milestones", []) if not milestone.get("completedAt")]
            for record, key in deadlines:
                if not record.get(key):
                    continue
                due_day = date.fromisoformat(str(record[key])[:10])
                for _ in range(paused_workdays):
                    due_day = next_workday(due_day)
                record[key] = due_day.isoformat()
        case["supplement"]["submittedAt"] = submitted_now.isoformat(timespec="seconds")
        case["supplement"]["citizenNote"] = note
        case["supplement"]["newFiles"] = files
        next_status = case["supplement"].get("resumeStatus") or "DA_TIEP_NHAN"
        title = "Người dân đã gửi nội dung bổ sung"
        detail = note or f"Đã bổ sung {len(files)} tài liệu."
    elif action == "reject_intake":
        require_role(role, {"intake"})
        if current != "CHO_TIEP_NHAN": raise ValueError("Chỉ có thể từ chối yêu cầu đang chờ tiếp nhận.")
        reason = clean_text(payload.get("reason"), 1200)
        if len(reason) < 12: raise ValueError("Cần nêu lý do và căn cứ từ chối.")
        case["publicNote"] = reason
        next_status = "TU_CHOI"
        title = "Đã từ chối tiếp nhận"
        detail = reason
    elif action == "assign":
        require_role(role, {"intake"})
        if current not in {"DA_TIEP_NHAN", "DANG_THU_LY"}: raise ValueError("Hồ sơ cần được tiếp nhận trước khi phân công.")
        assignee_id = clean_text(payload.get("assignee"), 64)
        case_scope = (case.get("agencyScope") or case.get("receivingAgency") or "").strip()
        today = datetime.now(TZ).date().isoformat()
        candidate = con.execute("""SELECT id,full_name,agency_scope FROM users WHERE id=? AND role='specialist' AND active=1
            AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?)""", (assignee_id, today, today)).fetchone()
        assignee_user = candidate if (candidate and same_agency_scope(candidate["agency_scope"], case_scope)) else None
        if not assignee_user: raise ValueError("Chọn chuyên viên còn hiệu lực thuộc đúng cơ quan xử lý hồ sơ.")
        case["assignment"] = {"assigneeId": assignee_user["id"], "assignee": assignee_user["full_name"], "assigneeName": assignee_user["full_name"], "unit": case_scope, "assignedAt": now_iso(), "assignedBy": actor}
        next_status = "DANG_THU_LY"
        title = "Đã phân công chuyên viên"
        detail = f"{assignee_user['full_name']} · {case['assignment']['unit']}"
        audience = "internal"
    elif action == "save_draft":
        require_role(role, {"specialist"})
        if current != "DANG_THU_LY": raise ValueError("Chỉ hồ sơ đang thụ lý mới có thể cập nhật dự thảo.")
        draft = clean_text(payload.get("draft"), 5000)
        if len(draft) < 10: raise ValueError("Dự thảo cần có tối thiểu 10 ký tự.")
        case["draftResult"] = draft
        title = "Đã lưu dự thảo kết quả"
        detail = "Phiên bản dự thảo mới đã được ghi nhận trong nhật ký nội bộ."
        audience = "internal"
    elif action == "submit_review":
        require_role(role, {"specialist"})
        if current != "DANG_THU_LY": raise ValueError("Hồ sơ không ở bước thẩm định.")
        draft = clean_text(payload.get("draft"), 5000) or clean_text(case.get("draftResult"), 5000)
        if len(draft) < 10: raise ValueError("Cần lưu dự thảo trước khi trình duyệt.")
        case["draftResult"] = draft
        case["submittedForApprovalAt"] = now_iso()
        next_status = "TRINH_DUYET"
        title = "Đã trình lãnh đạo phê duyệt"
        detail = "Dự thảo được chốt phiên bản để người có thẩm quyền xem xét."
        audience = "internal"
    elif action == "send_back":
        require_role(role, {"leader"})
        if current not in {"TRINH_DUYET", "DA_PHE_DUYET"}: raise ValueError("Hồ sơ không chờ xem xét hoặc chưa được phê duyệt.")
        if has_issued_result(case) or con.execute("SELECT 1 FROM sandbox_signatures WHERE case_id=?", (row["id"],)).fetchone():
            raise ValueError("Kết quả đã ký hoặc phát hành; không thể trả lại bằng thao tác chỉnh sửa dự thảo.")
        if current == "DA_PHE_DUYET":
            case.setdefault("approvalHistory", []).append({"approvedAt": case.get("approvedAt"), "approvedById": case.get("approvedById"), "reopenedAt": now_iso(), "reopenedBy": actor})
            case.pop("approvedAt", None)
            case.pop("approvedById", None)
        reason = clean_text(payload.get("reason"), 1200)
        if len(reason) < 8: raise ValueError("Nêu nội dung cần chuyên viên chỉnh sửa.")
        case["approvalNote"] = reason
        next_status = "DANG_THU_LY"
        title = "Lãnh đạo yêu cầu chỉnh sửa dự thảo"
        detail = reason
        audience = "internal"
    elif action == "approve":
        require_role(role, {"leader"})
        if current != "TRINH_DUYET": raise ValueError("Chỉ dự thảo đang trình mới được phê duyệt.")
        if len(clean_text(case.get("draftResult"), 5000)) < 10: raise ValueError("Không có dự thảo hợp lệ để phê duyệt.")
        case["approvedAt"] = now_iso()
        case["approvedById"] = body.get("userId") or ""
        case["approvalNote"] = clean_text(payload.get("note"), 500)
        next_status = "DA_PHE_DUYET"
        title = "Đã phê duyệt kết quả"
        detail = "Quyết định phê duyệt được ghi nhận; chờ văn thư phát hành."
        audience = "internal"
    elif action == "sign_result":
        require_role(role, {"leader"})
        if current != "DA_PHE_DUYET": raise ValueError("Chỉ kết quả đã được phê duyệt mới được ký.")
        if not case.get("approvedAt") or not case.get("approvedById") or len(clean_text(case.get("draftResult"), 5000)) < 10:
            raise ValueError("Thiếu thời điểm phê duyệt hoặc bản dự thảo đã chốt.")
        today = datetime.now(TZ).date().isoformat()
        authority = con.execute("""SELECT a.authority_ref,a.active,u.role,u.active AS user_active,u.agency_scope,u.valid_from,u.valid_until
            FROM sandbox_signing_authorities a JOIN users u ON u.id=a.user_id WHERE a.user_id=?""", (body.get("userId"),)).fetchone()
        case_scope = (case.get("agencyScope") or case.get("receivingAgency") or "").strip()
        if not authority or not authority["active"] or not authority["user_active"] or authority["role"] != "leader" or not authority["authority_ref"]:
            raise PermissionError("Tài khoản chưa được quản trị viên cấp riêng quyền ký thử nghiệm.")
        if authority["valid_from"] and today < authority["valid_from"] or authority["valid_until"] and today > authority["valid_until"]:
            raise PermissionError("Quyền ký thử nghiệm đã hết hạn hoặc chưa có hiệu lực.")
        if not same_agency_scope(authority["agency_scope"], case_scope):
            raise PermissionError("Quyền ký thử nghiệm không bao gồm cơ quan xử lý hồ sơ.")
        if con.execute("SELECT 1 FROM sandbox_signatures WHERE case_id=? LIMIT 1", (row["id"],)).fetchone():
            raise ValueError("Kết quả này đã được ký; cần tạo phiên bản mới và phê duyệt lại để ký lần nữa.")
        fee = case.get("fee") or {}
        if fee.get("amount") is not None and fee.get("status") not in {"RECONCILED", "WAIVED"}:
            raise ValueError("Cần hoàn tất đối soát hoặc miễn khoản thu trước khi ký phát hành.")
        message_bytes = sandbox_signature_message(row["code"], row["procedure_code"], case["draftResult"], case["approvedAt"])
        signing_key = sandbox_signing_key()
        signature = signing_key.sign(message_bytes)
        public_bytes = signing_key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        con.execute("INSERT INTO sandbox_signatures(case_id,document_hash,signature_b64,public_key_b64,signer_id,signer_name,authority_ref,signed_at,mode) VALUES(?,?,?,?,?,?,?,?, 'LOCAL_SANDBOX')", (row["id"], hashlib.sha256(message_bytes).hexdigest(), base64.b64encode(signature).decode("ascii"), base64.b64encode(public_bytes).decode("ascii"), body.get("userId"), actor, authority["authority_ref"], now_iso()))
        case["sandboxSignature"] = {"signedAt": now_iso(), "mode": "LOCAL_SANDBOX"}
        title = "Đã ký thử nghiệm kết quả"
        detail = "Chữ ký Ed25519 cục bộ gắn với nội dung dự thảo đã phê duyệt; chỉ xác minh toàn vẹn trong ứng dụng, không phải chữ ký số công vụ hoặc chứng thư được cấp phép."
        audience = "internal"
    elif action == "issue":
        require_role(role, {"registrar"})
        if current != "DA_PHE_DUYET": raise ValueError("Chỉ kết quả đã được phê duyệt mới được phát hành.")
        signed = sandbox_signature_view(con, row["id"], {**case, "code": row["code"], "procedureCode": row["procedure_code"]})
        if not signed or not signed["verified"]: raise PermissionError("Chưa có chữ ký hợp lệ cho phép phát hành bản kết quả đã phê duyệt.")
        fee = case.get("fee") or {}
        if fee.get("amount") is not None and fee.get("status") not in {"RECONCILED", "WAIVED"}:
            raise ValueError("Cần đối soát hoặc miễn khoản thu trước khi phát hành.")
        result_number = clean_text(payload.get("resultNumber"), 100)
        if len(result_number) < 3: raise ValueError("Ghi số kết quả nội bộ cho tình huống thử nghiệm.")
        case["result"] = {"number": result_number, "content": case["draftResult"], "issuedAt": now_iso(), "mode": "LOCAL_SANDBOX", "signatureHash": signed["documentHash"]}
        case["resultIssuedAt"] = case["result"]["issuedAt"]
        next_status = "DA_PHAT_HANH"
        title = "Đã phát hành kết quả thử nghiệm"
        detail = f"Số nội bộ {result_number}; chỉ có hiệu lực trong cơ sở dữ liệu thử nghiệm, không phải quyết định hành chính."
    elif action == "deliver":
        require_role(role, {"registrar", "intake"})
        if current != "DA_PHAT_HANH": raise ValueError("Chỉ kết quả đã phát hành mới được ghi nhận trả.")
        receiver = clean_text(payload.get("receiver"), 180)
        evidence = clean_text(payload.get("evidence"), 180)
        channel = clean_text(payload.get("channel"), 30).upper()
        if len(receiver) < 2 or len(evidence) < 3 or channel not in {"TRUC_TIEP", "BUU_CHINH", "DIEN_TU_SANDBOX"}:
            raise ValueError("Ghi người nhận, chứng cứ giao và kênh trả kết quả.")
        case["delivery"] = {"receiver": receiver, "evidence": evidence, "channel": channel, "deliveredAt": now_iso(), "mode": "LOCAL_SANDBOX"}
        next_status = "HOAN_THANH"
        title = "Đã ghi nhận trả kết quả thử nghiệm"
        detail = f"Người nhận: {receiver}; kênh: {channel}; chứng cứ: {evidence}."
    elif action == "decline":
        require_role(role, {"leader"})
        if current != "TRINH_DUYET": raise ValueError("Chỉ hồ sơ đang trình mới có thể kết luận.")
        reason = clean_text(payload.get("reason"), 1200)
        if len(reason) < 12: raise ValueError("Cần ghi kết luận và căn cứ chuyên ngành.")
        case["publicNote"] = reason
        next_status = "KHONG_GIAI_QUYET"
        title = "Đã kết luận không giải quyết"
        detail = reason
    elif action == "prepare_stop_notice":
        require_role(role, {"intake"})
        reason = clean_text(payload.get("reason"), 1200)
        if len(reason) < 8: raise ValueError("Ghi rõ lý do người dân yêu cầu dừng theo Mẫu 05.")
        channel = clean_text(payload.get("channel"), 20).upper()
        if channel not in {"TRUC_TIEP", "BUU_CHINH"}:
            raise ValueError("Yêu cầu trực tuyến được xử lý qua chức năng Cổng Dịch vụ công quốc gia; ứng dụng này chưa nhận được sự kiện đó.")
        requester_type = clean_text(payload.get("requesterType"), 20).upper()
        if requester_type not in {"SELF", "REPRESENTATIVE"}:
            raise ValueError("Chọn người yêu cầu là chủ thể hồ sơ hoặc người đại diện.")
        requester_name = clean_text(payload.get("requesterName"), 150)
        if len(requester_name) < 2:
            raise ValueError("Ghi họ tên người ký/nộp yêu cầu Mẫu 05.")
        requester_identifier = clean_text(payload.get("requesterIdentifier"), 80)
        requester_address = clean_text(payload.get("requesterAddress"), 300)
        requester_phone = clean_text(payload.get("requesterPhone"), 40)
        requester_email = clean_text(payload.get("requesterEmail"), 254).lower()
        if len(requester_identifier) < 3 or len(requester_address) < 3:
            raise ValueError("Ghi số định danh cá nhân/mã số tổ chức và địa chỉ theo Mẫu 05.")
        if requester_email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", requester_email):
            raise ValueError("Email trên Mẫu 05 không hợp lệ.")
        if payload.get("identityVerified") is not True:
            raise ValueError("Cán bộ phải xác nhận đã đối chiếu danh tính người yêu cầu trước khi lập yêu cầu.")
        if requester_type == "REPRESENTATIVE" and payload.get("authorizationVerified") is not True:
            raise ValueError("Cần đối chiếu căn cứ đại diện còn hiệu lực trước khi tiếp nhận yêu cầu.")
        request_ref = clean_text(payload.get("requestReference"), 120)
        if channel == "BUU_CHINH" and len(request_ref) < 3:
            raise ValueError("Ghi mã bưu gửi hoặc tham chiếu trên văn bản yêu cầu.")
        case_rules = case.get("procedureRules") or {}
        if case_rules.get("withdrawalAllowed") is False:
            raise ValueError("Thủ tục này có quy định chuyên ngành khác; không thể áp dụng luồng dừng chung.")
        accepted_at = parse_dt(case.get("acceptedAt"))
        eligible_statuses = {"DA_TIEP_NHAN", "DANG_THU_LY", "TRINH_DUYET", "DA_PHE_DUYET"}
        if current == "CHO_BO_SUNG" and (case.get("supplement") or {}).get("resumeStatus") in {"DA_TIEP_NHAN", "DANG_THU_LY"}:
            eligible_statuses.add("CHO_BO_SUNG")
        if not accepted_at or current not in eligible_statuses:
            raise ValueError("Chỉ tiếp nhận yêu cầu dừng sau khi hồ sơ đã được tiếp nhận hợp lệ và còn trong quá trình giải quyết.")
        terminal_statuses = {"DA_PHAT_HANH", "HOAN_THANH", "TU_CHOI", "KHONG_GIAI_QUYET", "DUNG"}
        if current in terminal_statuses or has_issued_result(case):
            raise ValueError("Cơ quan đã ban hành quyết định hoặc văn bản thông báo kết quả; giữ nguyên trạng thái và lịch sử.")
        if withdrawal.get("status") in {"CHO_KY_PHAT_HANH", "DA_PHAT_HANH"}:
            raise ValueError("Hồ sơ đã có yêu cầu dừng đang xử lý hoặc đã phát hành Thông báo dừng.")
        raw_request_files = payload.get("files", [])
        if not isinstance(raw_request_files, list) or not raw_request_files:
            raise ValueError("Đính kèm văn bản yêu cầu Mẫu 05 đã ký; nếu là người đại diện, kèm chứng cứ đại diện.")
        if requester_type == "REPRESENTATIVE" and len(raw_request_files) < 2:
            raise ValueError("Người đại diện phải gửi riêng Mẫu 05 và tài liệu chứng minh căn cứ đại diện.")
        request_files = save_files(row["code"], raw_request_files)
        received_at = now_iso()
        case["withdrawal"] = {
            "status": "CHO_KY_PHAT_HANH", "channel": channel, "requesterType": requester_type,
            "requesterName": requester_name, "requesterIdentifier": requester_identifier,
            "requesterAddress": requester_address, "requesterPhone": requester_phone, "requesterEmail": requester_email,
            "requestReference": request_ref, "reason": reason, "requestDocuments": request_files,
            "requestReceivedAt": received_at, "receivedBy": actor,
            "identityVerified": True, "identityVerifiedAt": received_at,
            "authorizationVerified": requester_type == "REPRESENTATIVE", "checkedBy": actor,
            "checkedAt": received_at, "checkedCaseStatus": current, "checkedAcceptedAt": case.get("acceptedAt"),
            "noticeTemplate": "Mẫu số 06 - Thông tư 13/2026/TT-BTP",
            "noticeDraft": {
                # The published form separates the province/ministry/commune header
                # from the One-Stop Office name. The live case record does not prove
                # either printed label, so leave them for the responsible office to
                # confirm instead of copying the resolving agency into both fields.
                "authorityName": case.get("noticeAuthorityName", ""),
                "serviceOfficeName": case.get("serviceOfficeName", ""),
                "noticeLocation": case.get("noticeLocation", ""),
                "caseCode": row["code"], "applicantName": (case.get("applicant") or {}).get("name", ""),
                "applicantIdentifier": (case.get("applicant") or {}).get("citizenId") or (case.get("applicant") or {}).get("organizationId", ""),
                "procedureName": (procedure_for(row["procedure_code"]) or {}).get("name", row["procedure_code"]),
                "requestDate": received_at, "requesterName": requester_name, "reason": reason,
                "resultCheckText": f"Qua kiểm tra, đến thời điểm {received_at}, hồ sơ {row['code']} chưa có quyết định giải quyết thủ tục hành chính hoặc có văn bản thông báo kết quả giải quyết thủ tục hành chính.",
                "signatureStatus": "CHUA_KY",
            },
        }
        title = "Đã nhận yêu cầu dừng; dự thảo Mẫu 06 chờ ký"
        detail = "Bộ phận Một cửa đã ghi nhận yêu cầu và kiểm tra điều kiện. Hồ sơ chưa chuyển sang trạng thái dừng; đang chờ người ký có thẩm quyền ký và phát hành Thông báo dừng."
        audience = "public"
    elif action == "issue_stop_notice":
        require_role(role, {"leader"})
        if not body.get("maySignStop") or len(clean_text(body.get("signingAuthorityRef"), 180)) < 3:
            raise PermissionError("Tài khoản chưa được quản trị viên khác xác nhận thẩm quyền ký Thông báo dừng.")
        withdrawal = case.get("withdrawal") or {}
        if withdrawal.get("status") != "CHO_KY_PHAT_HANH":
            raise ValueError("Không có yêu cầu dừng đủ điều kiện đang chờ ký và phát hành.")
        eligible_at_issuance = current in {"DA_TIEP_NHAN", "DANG_THU_LY", "TRINH_DUYET", "DA_PHE_DUYET"} or (
            current == "CHO_BO_SUNG" and (case.get("supplement") or {}).get("resumeStatus") in {"DA_TIEP_NHAN", "DANG_THU_LY"}
        )
        if not parse_dt(case.get("acceptedAt")) or not eligible_at_issuance or has_issued_result(case):
            withdrawal["status"] = "KHONG_DU_DIEU_KIEN"
            withdrawal["ineligibleReason"] = "Tại thời điểm phát hành, hồ sơ không còn trong khoảng thời gian hoặc trạng thái được yêu cầu dừng; không phát hành Mẫu 06."
            case["withdrawal"] = withdrawal
            title = "Không thể phát hành Mẫu 06"
            detail = withdrawal["ineligibleReason"]
            audience = "public"
        else:
            if payload.get("signatureAttested") is not True:
                raise ValueError("Xác nhận đã đối chiếu chữ ký và thẩm quyền người ký trên Mẫu 06.")
            notice_number = clean_text(payload.get("noticeNumber"), 100)
            if not re.fullmatch(r"\d{1,20}\s*/\s*[^/]{2,80}", notice_number) or "TBD" in notice_number.upper():
                raise ValueError("Nhập đầy đủ số văn bản theo sổ của cơ quan; thay phần TBD trong biểu mẫu bằng mã đơn vị thực tế.")
            authority_name = clean_text(payload.get("authorityName"), 180)
            service_office_name = clean_text(payload.get("serviceOfficeName"), 180)
            notice_location = clean_text(payload.get("noticeLocation"), 100)
            notice_date = clean_text(payload.get("noticeDate"), 10)
            if min(len(authority_name), len(service_office_name), len(notice_location)) < 2:
                raise ValueError("Điền đúng tên cơ quan cấp trên/cấp xã, Bộ phận Một cửa và địa danh trên Mẫu 06 theo văn bản tổ chức của đơn vị.")
            try:
                notice_date_value = date.fromisoformat(notice_date)
                request_date_value = parse_dt(withdrawal.get("requestReceivedAt")).date()
            except (ValueError, AttributeError, TypeError) as exc:
                raise ValueError("Ngày trên Mẫu 06 không hợp lệ hoặc thiếu ngày nhận yêu cầu.") from exc
            if notice_date_value < request_date_value or notice_date_value > datetime.now(TZ).date():
                raise ValueError("Ngày Mẫu 06 phải từ ngày nhận yêu cầu đến ngày hiện tại.")
            raw_files = payload.get("files", [])
            if not isinstance(raw_files, list) or len(raw_files) != 1:
                raise ValueError("Đính kèm đúng một bản Thông báo dừng Mẫu 06 đã ký.")
            delivery_channel = clean_text(payload.get("deliveryChannel"), 20).upper()
            delivery_ref = clean_text(payload.get("deliveryReference"), 150)
            collection_office = clean_text(payload.get("collectionOffice"), 240)
            if delivery_channel not in {"TRUC_TIEP", "BUU_CHINH"} or len(delivery_ref) < 3:
                raise ValueError("Chọn kênh gửi và ghi chứng cứ giao/biên nhận hoặc mã bưu gửi.")
            if len(collection_office) < 3:
                raise ValueError("Ghi đúng Trung tâm/Bộ phận Một cửa để người dân liên hệ nhận lại hồ sơ giấy và khoản đã nộp (nếu có).")
            signed_files = save_files(row["code"], raw_files)
            issued_at = now_iso()
            fee_rows = con.execute("SELECT status FROM payment_records WHERE case_id=?", (row["id"],)).fetchall()
            has_paid_fee = any(str(payment["status"]).upper() in {"PAID", "RECONCILED", "SETTLED"} for payment in fee_rows)
            withdrawal.update({
                "status": "DA_PHAT_HANH", "noticeNumber": notice_number, "noticeFile": signed_files[0],
                "noticeSignedBy": actor, "noticeSignerId": body.get("userId"),
                "noticeSigningAuthorityRef": clean_text(body.get("signingAuthorityRef"), 180),
                "noticeSignedAt": issued_at, "noticeIssuedAt": issued_at,
                "noticeDraft": {
                    **(withdrawal.get("noticeDraft") or {}),
                    "authorityName": authority_name, "serviceOfficeName": service_office_name,
                    "noticeLocation": notice_location, "collectionOffice": collection_office,
                    "noticeNumber": notice_number, "issueDate": notice_date_value.isoformat(),
                    "signatureStatus": "DA_KY",
                },
                "noticeDelivery": {"channel": delivery_channel, "reference": delivery_ref, "recordedAt": issued_at, "recordedBy": actor},
                "refundFollowUp": {"required": has_paid_fee, "status": "CHO_CO_QUAN_THU_XEM_XET" if has_paid_fee else "KHONG_PHAT_SINH"},
                "returnPaperFollowUp": {"required": bool(case.get("paperOriginals")), "status": "CAN_DOI_CHIEU" if case.get("paperOriginals") else "KHONG_PHAT_SINH"},
            })
            case["withdrawal"] = withdrawal
            next_status = "DUNG"
            title = "Đã ký và ghi nhận phát hành Thông báo dừng Mẫu 06"
            detail = f"Số {notice_number}; đã ghi nhận kênh gửi {delivery_channel} và chứng cứ {delivery_ref}. Trả hồ sơ giấy và hoàn phí/lệ phí (nếu có) được theo dõi riêng."
            audience = "public"
    elif action == "feedback":
        require_role(role, {"citizen"})
        if current not in {"HOAN_THANH", "TU_CHOI", "KHONG_GIAI_QUYET", "DUNG"}: raise ValueError("Chỉ gửi đánh giá sau khi có kết quả xử lý.")
        score = int(payload.get("score", 0))
        content = clean_text(payload.get("content"), 1000)
        if score not in range(1, 6): raise ValueError("Chọn mức đánh giá từ 1 đến 5 sao.")
        if con.execute("SELECT 1 FROM feedback WHERE case_id=? AND owner_id=?", (row["id"], row["owner_id"])).fetchone():
            raise ValueError("Hồ sơ này đã có đánh giá.")
        con.execute("INSERT INTO feedback(case_id,owner_id,score,content,created_at) VALUES(?,?,?,?,?)", (row["id"], row["owner_id"], score, content, now_iso()))
        title = "Đã nhận đánh giá phục vụ"
        detail = "Cảm ơn bạn đã gửi phản hồi. Nội dung đánh giá không làm thay đổi quyết định hồ sơ."
        audience = "internal"
    else:
        raise ValueError("Thao tác không được hỗ trợ.")

    case["status"] = next_status
    case["statusLabel"] = STATUS_LABELS.get(next_status, next_status)
    case["updatedAt"] = now_iso()
    updated = con.execute(
        "UPDATE cases SET status=?,payload_json=?,updated_at=?,version=version+1 WHERE id=? AND version=?",
        (next_status, json.dumps(case, ensure_ascii=False), now_iso(), row["id"], expected),
    )
    if updated.rowcount != 1:
        raise RuntimeError("Hồ sơ vừa được cập nhật ở phiên khác. Hãy tải lại trước khi thao tác.")
    add_event(con, row["id"], role, actor, action, title, detail, audience)
    return action, title, detail, audience


def build_stats(cases: list[dict]) -> dict:
    counts = {key: 0 for key in STATUS_LABELS}
    for case in cases:
        counts[case["status"]] = counts.get(case["status"], 0) + 1
    open_cases = [c for c in cases if c["status"] not in {"HOAN_THANH", "TU_CHOI", "KHONG_GIAI_QUYET", "DUNG"}]
    overdue = []
    today = datetime.now(TZ).date()
    for case in open_cases:
        due = parse_dt(case.get("deadline"))
        try:
            due_day = date.fromisoformat(case["deadline"]) if case.get("deadline") else None
        except ValueError:
            due_day = due.date() if due else None
        if due_day and due_day < today:
            overdue.append(case)
    return {"total": len(cases), "open": len(open_cases), "waiting": counts.get("CHO_TIEP_NHAN", 0), "supplement": counts.get("CHO_BO_SUNG", 0), "review": counts.get("TRINH_DUYET", 0), "overdue": len(overdue), "byStatus": counts}


def seed_training_cases() -> None:
    """Install a clearly labelled, local-only scenario set once for UI/workflow practice."""
    agencies = {
        "so": "Sở Nông nghiệp và Môi trường Hà Nội",
        "tay-ho": "UBND phường Tây Hồ",
    }
    scenarios = [
        ("so", "CHO_TIEP_NHAN", 1), ("so", "DA_TIEP_NHAN", 3), ("so", "DANG_THU_LY", 2),
        ("so", "DANG_THU_LY", 8), ("so", "CHO_BO_SUNG", 5), ("so", "TRINH_DUYET", 4),
        ("so", "DA_PHE_DUYET", 12), ("so", "HOAN_THANH", 17),
        ("tay-ho", "CHO_TIEP_NHAN", 2), ("tay-ho", "DA_TIEP_NHAN", 6),
        ("tay-ho", "DANG_THU_LY", 3), ("tay-ho", "CHO_BO_SUNG", 7),
        ("tay-ho", "TRINH_DUYET", 9), ("tay-ho", "DA_PHAT_HANH", 14),
        ("tay-ho", "HOAN_THANH", 21), ("tay-ho", "TU_CHOI", 10), ("tay-ho", "DUNG", 25),
    ]
    actions_for_status = {
        "CHO_TIEP_NHAN": [],
        "DA_TIEP_NHAN": [("accept", "Đã tiếp nhận", "Cán bộ đã kiểm tra thông tin ban đầu trong tình huống mô phỏng.")],
        "DANG_THU_LY": [("accept", "Đã tiếp nhận", "Hồ sơ mô phỏng đã qua bước kiểm tra ban đầu."), ("assign", "Chuyển chuyên viên thụ lý", "Đã phân công chuyên viên theo phạm vi cơ quan mô phỏng.")],
        "CHO_BO_SUNG": [("accept", "Đã tiếp nhận", "Hồ sơ mô phỏng đã được tiếp nhận."), ("assign", "Chuyển chuyên viên thụ lý", "Đã phân công xử lý."), ("request_supplement", "Yêu cầu bổ sung", "Tình huống thực hành: cần bổ sung thông tin còn thiếu.")],
        "TRINH_DUYET": [("accept", "Đã tiếp nhận", "Hồ sơ mô phỏng đã được tiếp nhận."), ("assign", "Chuyển chuyên viên thụ lý", "Đã phân công xử lý."), ("submit_review", "Trình phê duyệt", "Chuyển lãnh đạo xem xét trong tình huống thực hành.")],
        "DA_PHE_DUYET": [("accept", "Đã tiếp nhận", "Hồ sơ mô phỏng đã được tiếp nhận."), ("assign", "Chuyển chuyên viên thụ lý", "Đã phân công xử lý."), ("submit_review", "Trình phê duyệt", "Đã chuyển lãnh đạo xem xét."), ("approve", "Đã phê duyệt", "Tình huống mô phỏng đã được phê duyệt, chờ phát hành.")],
        "DA_PHAT_HANH": [("accept", "Đã tiếp nhận", "Hồ sơ mô phỏng đã được tiếp nhận."), ("assign", "Chuyển chuyên viên thụ lý", "Đã phân công xử lý."), ("submit_review", "Trình phê duyệt", "Đã chuyển lãnh đạo xem xét."), ("approve", "Đã phê duyệt", "Đã phê duyệt trong tình huống mô phỏng."), ("issue", "Phát hành kết quả", "Đã ghi nhận kết quả mô phỏng; không có giá trị pháp lý.")],
        "HOAN_THANH": [("accept", "Đã tiếp nhận", "Hồ sơ mô phỏng đã được tiếp nhận."), ("assign", "Chuyển chuyên viên thụ lý", "Đã phân công xử lý."), ("submit_review", "Trình phê duyệt", "Đã chuyển lãnh đạo xem xét."), ("approve", "Đã phê duyệt", "Đã phê duyệt trong tình huống mô phỏng."), ("issue", "Phát hành kết quả", "Đã ghi nhận kết quả mô phỏng; không có giá trị pháp lý."), ("deliver", "Trả kết quả", "Đã hoàn tất tình huống thực hành; không phải kết quả hành chính thật.")],
        "TU_CHOI": [("reject", "Từ chối tiếp nhận", "Tình huống thực hành minh họa hồ sơ chưa đáp ứng điều kiện tiếp nhận.")],
        "DUNG": [("accept", "Đã tiếp nhận", "Hồ sơ mô phỏng đã được tiếp nhận."), ("assign", "Chuyển chuyên viên thụ lý", "Đã phân công xử lý."), ("submit_review", "Trình phê duyệt", "Đã chuyển lãnh đạo xem xét."), ("approve", "Đã phê duyệt", "Đã phê duyệt tình huống mô phỏng."), ("stop", "Dừng quy trình", "Tình huống thực hành minh họa nhánh dừng xử lý; không phải văn bản thật.")],
    }
    with DB_LOCK, connect() as con:
        installed = con.execute("SELECT version FROM app_data_versions WHERE data_key='training-cases'").fetchone()
        if installed and installed["version"] >= SAMPLE_DATASET_VERSION:
            return
        existing = con.execute("SELECT COUNT(*) FROM cases WHERE json_extract(payload_json,'$.sampleDatasetVersion')=?", (SAMPLE_DATASET_VERSION,)).fetchone()[0]
        if existing:
            con.execute("INSERT INTO app_data_versions(data_key,version,applied_at) VALUES('training-cases',?,?) ON CONFLICT(data_key) DO UPDATE SET version=excluded.version,applied_at=excluded.applied_at", (SAMPLE_DATASET_VERSION, now_iso()))
            return
        staff_by_scope = {}
        for key, agency in agencies.items():
            staff_by_scope[key] = {
                row["role"]: row for row in con.execute(
                    "SELECT id,full_name,role FROM users WHERE active=1 AND agency_scope=? COLLATE NOCASE AND role IN ('intake','specialist','leader','registrar','finance') ORDER BY created_at,id",
                    (agency,),
                ).fetchall()
            }
        for index, (agency_key, status, age_days) in enumerate(scenarios, start=1):
            agency = agencies[agency_key]
            office = staff_by_scope[agency_key]
            procedure_code = "1.004237" if agency_key == "so" else "2.000908"
            procedure = dict(procedure_for(procedure_code))
            procedure["code"] = procedure_code
            created_dt = datetime.now(TZ) - timedelta(days=age_days)
            created_dt = created_dt.replace(hour=9 + (index % 6), minute=(index * 7) % 60, second=0, microsecond=0)
            created = created_dt.isoformat(timespec="seconds")
            code = f"HN-{created_dt.year}-{hashlib.sha256(f'TRAINING-CODE-{index}'.encode('ascii')).hexdigest()[:8].upper()}"
            lookup_key = hashlib.sha256(f"TRAINING-KEY-{index}".encode("ascii")).hexdigest().upper()
            owner_hash = hashlib.sha256(lookup_key.encode("ascii")).hexdigest()
            actions = actions_for_status[status]
            assigned = office.get("specialist")
            if status in {"DANG_THU_LY", "CHO_BO_SUNG", "TRINH_DUYET", "DA_PHE_DUYET", "DA_PHAT_HANH", "HOAN_THANH", "DUNG"}:
                assignee = {"assigneeId": assigned["id"], "assigneeName": assigned["full_name"], "assignedAt": created} if assigned else None
            else:
                assignee = None
            closed = status in {"DA_PHAT_HANH", "HOAN_THANH", "TU_CHOI", "KHONG_GIAI_QUYET", "DUNG"}
            if closed:
                deadline = (created_dt.date() + timedelta(days=4)).isoformat()
            elif index % 5 == 0:
                deadline = (datetime.now(TZ).date() - timedelta(days=2)).isoformat()
            elif index % 3 == 0:
                deadline = (datetime.now(TZ).date() + timedelta(days=2)).isoformat()
            else:
                deadline = (datetime.now(TZ).date() + timedelta(days=7)).isoformat()
            fee_status = "DUE" if procedure_code == "1.004237" and index in {3, 7} else "NOT_CONNECTED"
            approval_actor = office.get("leader") if status == "DA_PHE_DUYET" else None
            approval_action_index = next((i for i, (action, *_rest) in enumerate(actions, start=1) if action == "approve"), None)
            approval_time = (
                (created_dt + timedelta(hours=approval_action_index * 5)).isoformat(timespec="seconds")
                if approval_actor and approval_action_index else ""
            )
            payload = {
                "procedureCode": procedure_code, "procedure": procedure, "applicantType": "citizen",
                "agencyScope": agency, "receivingAgency": agency,
                "applicant": {"name": f"Công dân mô phỏng {index:02d}", "phone": "", "email": ""},
                "subject": {"name": f"Chủ hồ sơ mô phỏng {index:02d}", "relation": "Người yêu cầu"},
                "requestSummary": f"Tình huống thực hành số {index:02d}: kiểm tra luồng xử lý thủ tục {procedure_code}.",
                "schemaVersion": (procedure.get("submission") or {}).get("version", "scenario-v1"),
                "declaration": {"scenario": f"Tình huống mô phỏng {index:02d}", "purpose": "Thực hành giao diện và luồng nghiệp vụ; không phải thông tin công dân thật."},
                "deliveryMethod": "Trực tiếp", "deliveryAddress": "", "attachments": [], "events": [],
                "fee": {"status": fee_status, "amount": None, "note": "Tình huống mô phỏng; chưa phát sinh nghĩa vụ tài chính thật."},
                "sync": {"status": "NOT_CONFIGURED", "attempts": 0}, "assignment": {"assigneeId": assignee["assigneeId"], "assigneeName": assignee["assigneeName"], "assignedAt": assignee["assignedAt"]} if assignee else {},
                "deadline": deadline, "deadlineNote": "Hạn minh họa trong dữ liệu tình huống; không dùng làm hạn pháp lý.",
                "sample": True, "sampleDatasetVersion": SAMPLE_DATASET_VERSION,
                "sampleNote": "Dữ liệu tình huống sinh tại máy cục bộ để thực hành và kiểm tra; không phải hồ sơ công dân, không có giá trị pháp lý hoặc báo cáo chính thức.",
            }
            if approval_actor and approval_time:
                payload.update({
                    "draftResult": f"Kết quả minh họa cho tình huống hồ sơ {code}. Nội dung phục vụ thực hành quy trình, không phải quyết định hành chính.",
                    "approvedAt": approval_time,
                    "approvedById": approval_actor["id"],
                    "approvalSource": "Sự kiện phê duyệt thuộc dữ liệu tình huống mô phỏng.",
                })
            if status == "CHO_BO_SUNG":
                payload["supplement"] = {"reason": "Tình huống mô phỏng: cần bổ sung thông tin minh họa để kiểm tra nhánh phản hồi.", "items": [], "requestedAt": created, "stage": "CITIZEN", "resumeStatus": "DANG_THU_LY"}
            if status in {"DA_PHAT_HANH", "HOAN_THANH"}:
                payload["result"] = {"number": f"MO-PHONG-{index:03d}", "content": "Kết quả minh họa trong dữ liệu mô phỏng, không phải quyết định hoặc văn bản do cơ quan nhà nước phát hành.", "issuedAt": created, "publishedAt": created}
            con.execute("INSERT INTO cases(code,owner_id,procedure_code,status,version,idempotency_key,payload_json,created_at,updated_at) VALUES(?,?,?,?,1,NULL,?,?,?)",
                        (code, owner_hash, procedure_code, status, json.dumps(payload, ensure_ascii=False), created, now_iso()))
            case_id = con.execute("SELECT id FROM cases WHERE code=?", (code,)).fetchone()["id"]
            con.execute("INSERT INTO case_lookup_secrets(case_id,encrypted_key,submission_hash,updated_at) VALUES(?,?,?,?)",
                        (case_id, lookup_cipher().encrypt(lookup_key.encode("ascii")), hashlib.sha256(lookup_key.encode("ascii")).hexdigest(), now_iso()))
            add_event(con, case_id, "citizen", "Người nộp (mô phỏng)", "submit", "Đã gửi hồ sơ mô phỏng", payload["sampleNote"], "public", created)
            for action_index, (action, title, detail) in enumerate(actions, start=1):
                event_at = (created_dt + timedelta(hours=action_index * 5)).isoformat(timespec="seconds")
                if action == "submit_review":
                    actor = office.get("specialist")
                elif action == "approve":
                    actor = office.get("leader")
                elif action in {"issue", "deliver"}:
                    actor = office.get("registrar") or office.get("intake")
                else:
                    actor = office.get("intake")
                add_event(con, case_id, (actor["role"] if actor else "intake"), (actor["full_name"] if actor else "Cán bộ mô phỏng"), action, title, detail, "public", event_at)
            if status == "HOAN_THANH":
                con.execute("INSERT INTO feedback(case_id,owner_id,score,content,created_at) VALUES(?,?,5,?,?)",
                            (case_id, owner_hash, "Giao diện và các bước được minh họa rõ ràng trong tình huống thực hành.", now_iso()))
        con.execute("INSERT INTO app_data_versions(data_key,version,applied_at) VALUES('training-cases',?,?) ON CONFLICT(data_key) DO UPDATE SET version=excluded.version,applied_at=excluded.applied_at", (SAMPLE_DATASET_VERSION, now_iso()))


def repair_sample_approval_context() -> None:
    """Backfill only missing approval metadata on current-version training scenarios.

    The approval identity and timestamp must come from the scenario's recorded
    approval event and matching agency leader account. No real case is touched.
    """
    with DB_LOCK, connect() as con:
        rows = con.execute(
            "SELECT id,code,payload_json,version FROM cases "
            "WHERE status='DA_PHE_DUYET' AND json_extract(payload_json,'$.sampleDatasetVersion')=?",
            (SAMPLE_DATASET_VERSION,),
        ).fetchall()
        for row in rows:
            payload = json.loads(row["payload_json"])
            event = con.execute(
                "SELECT created_at,actor_name FROM case_events "
                "WHERE case_id=? AND action='approve' AND actor_role='leader' ORDER BY id DESC LIMIT 1",
                (row["id"],),
            ).fetchone()
            if not event:
                continue
            agency = (payload.get("agencyScope") or payload.get("receivingAgency") or "").strip()
            approver = con.execute(
                "SELECT id FROM users WHERE role='leader' AND full_name=? COLLATE NOCASE "
                "AND agency_scope=? COLLATE NOCASE ORDER BY created_at,id LIMIT 1",
                (event["actor_name"], agency),
            ).fetchone()
            if not approver:
                continue
            changed = False
            if not payload.get("approvedAt"):
                payload["approvedAt"] = event["created_at"]
                changed = True
            if not payload.get("approvedById"):
                payload["approvedById"] = approver["id"]
                changed = True
            if len(clean_text(payload.get("draftResult"), 5000)) < 10:
                payload["draftResult"] = (
                    f"Kết quả minh họa cho tình huống hồ sơ {row['code']}. "
                    "Nội dung phục vụ thực hành quy trình, không phải quyết định hành chính."
                )
                changed = True
            if changed:
                payload["approvalSource"] = "Sự kiện phê duyệt thuộc dữ liệu tình huống mô phỏng."
                updated = con.execute(
                    "UPDATE cases SET payload_json=?,version=version+1 WHERE id=? AND version=?",
                    (json.dumps(payload, ensure_ascii=False), row["id"], row["version"]),
                )
                if updated.rowcount == 1:
                    add_event(
                        con, row["id"], "system", "Hệ thống ứng dụng", "repair_sample_approval_context",
                        "Bổ sung dữ liệu phê duyệt cho tình huống mô phỏng",
                        "Đối chiếu sự kiện phê duyệt và tài khoản lãnh đạo cùng phạm vi; không sửa hồ sơ thật.",
                        "internal",
                    )


class AppHandler(BaseHTTPRequestHandler):
    server_version = "HanoiServices/1.0"

    def log_message(self, fmt, *args):
        # Keep the local console quiet except for application startup/errors.
        pass

    def send_json(self, data, status=200, headers=None):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(raw)

    def serve_case_file(self, code: str, stored: str, user: sqlite3.Row):
        if not stored or Path(stored).name != stored:
            return self.send_error_json("Đường dẫn tài liệu không hợp lệ.", 400)
        if user["role"] == "finance":
            return self.send_error_json("Vai trò tài chính không có quyền tải tài liệu hồ sơ.", 404)
        with DB_LOCK, connect() as con:
            row = con.execute("SELECT * FROM cases WHERE code=?", (code,)).fetchone()
            if not row or not visible_to_user(user, row):
                return self.send_error_json("Không tìm thấy hồ sơ trong phạm vi được phép tra cứu.", 404)
            data = json.loads(row["payload_json"])
            withdrawal = data.get("withdrawal") or {}
            candidates = list(data.get("attachments") or []) + list((withdrawal.get("requestDocuments") or []))
            if isinstance(withdrawal.get("noticeFile"), dict) and withdrawal.get("status") == "DA_PHAT_HANH":
                candidates.append(withdrawal["noticeFile"])
            record = next((entry for entry in candidates if isinstance(entry, dict) and entry.get("stored") == stored), None)
            if not record:
                return self.send_error_json("Tài liệu không gắn với hồ sơ này.", 404)
            target = (UPLOAD_DIR / row["code"] / stored).resolve()
            try:
                target.relative_to(UPLOAD_DIR.resolve())
            except ValueError:
                return self.send_error_json("Đường dẫn tài liệu không hợp lệ.", 400)
            if not target.is_file():
                return self.send_error_json("Không tìm thấy tệp đã lưu.", 404)
            raw = target.read_bytes()
            extension = Path(record.get("name", stored)).suffix.lower()
            content_type = {".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}.get(extension, "application/octet-stream")
            signatures = {".pdf": raw.startswith(b"%PDF-"), ".png": raw.startswith(b"\x89PNG\r\n\x1a\n"), ".jpg": raw.startswith(b"\xff\xd8\xff"), ".jpeg": raw.startswith(b"\xff\xd8\xff")}
            if extension not in signatures or not signatures[extension]:
                return self.send_error_json("Tệp lưu trữ không khớp định dạng được phép.", 415)
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(str(record.get('name', stored)))}")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Cache-Control", "private, no-store")
            self.end_headers()
            self.wfile.write(raw)

    def session_cookie(self, token: str, max_age: int) -> str:
        attributes = [f"{SESSION_COOKIE}={token}", "Path=/", f"Max-Age={max_age}", "HttpOnly", "SameSite=Strict"]
        if COOKIE_SECURE:
            attributes.append("Secure")
        return "; ".join(attributes)

    def current_user(self) -> sqlite3.Row | None:
        cookie_header = self.headers.get("Cookie", "")
        jar = SimpleCookie()
        try:
            jar.load(cookie_header)
            morsel = jar.get(SESSION_COOKIE)
            raw_token = morsel.value if morsel else ""
        except Exception:
            raw_token = ""
        if not raw_token:
            return None
        token_hash = hashlib.sha256(raw_token.encode("ascii", errors="ignore")).hexdigest()
        with DB_LOCK, connect() as con:
            row = con.execute("SELECT u.*,s.csrf_token,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?", (token_hash,)).fetchone()
            today = datetime.now(TZ).date().isoformat()
            out_of_scope_time = bool(row and ((row["valid_from"] and today < row["valid_from"]) or (row["valid_until"] and today > row["valid_until"])))
            if not row or not row["active"] or row["expires_at"] <= int(datetime.now(TZ).timestamp()) or row["role"] not in STAFF_ROLES or out_of_scope_time:
                if row:
                    con.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash,))
                return None
            return row

    def require_user(self) -> sqlite3.Row:
        user = self.current_user()
        if not user:
            raise AuthenticationError("Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.")
        return user

    def require_csrf(self, user: sqlite3.Row) -> None:
        supplied = self.headers.get("X-CSRF-Token", "")
        if not supplied or not hmac.compare_digest(supplied, user["csrf_token"]):
            raise PermissionError("Mã bảo vệ phiên không hợp lệ. Hãy tải lại trang và thử lại.")

    def check_auth_rate_limit(self) -> None:
        address = self.client_address[0] if self.client_address else "unknown"
        email = clean_text(getattr(self, "_auth_email", ""), 254).lower()
        now = monotonic()
        with AUTH_ATTEMPTS_LOCK:
            buckets = [(f"ip:{address}", AUTH_IP_FAILURE_LIMIT)]
            if email:
                buckets.append((f"email:{address}:{email}", AUTH_EMAIL_FAILURE_LIMIT))
            for key, limit in buckets:
                recent = [t for t in AUTH_ATTEMPTS.get(key, []) if now - t < AUTH_WINDOW_SECONDS]
                if recent:
                    AUTH_ATTEMPTS[key] = recent
                else:
                    AUTH_ATTEMPTS.pop(key, None)
                if len(recent) >= limit:
                    raise RateLimitError("Quá nhiều lần đăng nhập không thành công. Hãy thử lại sau 15 phút.")

    def record_auth_failure(self, email: str = "") -> None:
        address = self.client_address[0] if self.client_address else "unknown"
        now = monotonic()
        with AUTH_ATTEMPTS_LOCK:
            keys = [f"ip:{address}"]
            if email:
                keys.append(f"email:{address}:{clean_text(email, 254).lower()}")
            for key in keys:
                recent = [t for t in AUTH_ATTEMPTS.get(key, []) if now - t < AUTH_WINDOW_SECONDS]
                recent.append(now)
                AUTH_ATTEMPTS[key] = recent

    def clear_auth_email_failures(self, email: str) -> None:
        address = self.client_address[0] if self.client_address else "unknown"
        with AUTH_ATTEMPTS_LOCK:
            AUTH_ATTEMPTS.pop(f"email:{address}:{email}", None)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_BODY:
            raise ValueError("Dữ liệu gửi lên quá lớn.")
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def send_error_json(self, message, status=400):
        self.send_json({"error": message}, status)

    def list_public_news(self):
        with DB_LOCK, connect() as con:
            rows = con.execute("SELECT * FROM news_articles WHERE status='PUBLISHED' ORDER BY featured DESC,published_at DESC,id DESC").fetchall()
        return self.send_json({"articles": [news_item_dict(row) for row in rows], "categories": list(NEWS_CATEGORIES)})

    def list_managed_news(self):
        user = self.require_user()
        if user["role"] != "admin":
            raise PermissionError("Chỉ quản trị viên hệ thống được quản lý nội dung cổng thông tin.")
        with DB_LOCK, connect() as con:
            rows = con.execute("SELECT * FROM news_articles ORDER BY CASE status WHEN 'DRAFT' THEN 0 WHEN 'PUBLISHED' THEN 1 ELSE 2 END,updated_at DESC").fetchall()
            history = con.execute("SELECT id,news_id,actor_name,action,created_at FROM news_audit_log ORDER BY id DESC LIMIT 30").fetchall()
        return self.send_json({"articles": [news_item_dict(row, True) for row in rows], "categories": list(NEWS_CATEGORIES), "history": [dict(row) for row in history]})

    def save_managed_news(self, body: dict, user: sqlite3.Row):
        if user["role"] != "admin":
            raise PermissionError("Chỉ quản trị viên hệ thống được quản lý nội dung cổng thông tin.")
        action = clean_text(body.get("action"), 20)
        if action not in {"save", "publish", "archive", "draft"}:
            raise ValueError("Thao tác tin tức không hợp lệ.")
        now = now_iso()
        article_id = clean_text(body.get("id"), 80) or uuid.uuid4().hex
        with DB_LOCK, connect() as con:
            current = con.execute("SELECT * FROM news_articles WHERE id=?", (article_id,)).fetchone()
            if action == "archive" or action == "draft":
                if not current:
                    return self.send_error_json("Không tìm thấy tin tức.", 404)
                expected = body.get("expectedVersion")
                if not isinstance(expected, int) or isinstance(expected, bool) or expected != current["version"]:
                    raise RuntimeError("Tin đã được thay đổi. Hãy tải lại trước khi thao tác.")
                before = news_item_dict(current, True)
                next_status = "ARCHIVED" if action == "archive" else "DRAFT"
                published_at = current["published_at"] if next_status == "ARCHIVED" else None
                updated = con.execute("UPDATE news_articles SET status=?,published_at=?,version=version+1,updated_by=?,updated_at=? WHERE id=? AND version=?", (next_status, published_at, user["id"], now, article_id, expected)).rowcount
                if updated != 1:
                    raise RuntimeError("Tin đã thay đổi trong lúc lưu. Hãy tải lại.")
                fresh = con.execute("SELECT * FROM news_articles WHERE id=?", (article_id,)).fetchone()
                con.execute("INSERT INTO news_audit_log(news_id,actor_id,actor_name,action,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?)", (article_id, user["id"], user["full_name"], action.upper(), json.dumps(before, ensure_ascii=False), json.dumps(news_item_dict(fresh, True), ensure_ascii=False), now))
                return self.send_json({"article": news_item_dict(fresh, True)})

            fields = validate_news_fields(body)
            if not current:
                status = "PUBLISHED" if action == "publish" else "DRAFT"
                published_at = now if status == "PUBLISHED" else None
                con.execute("INSERT INTO news_articles(id,title,summary,body,category,image_path,source_url,status,featured,published_at,version,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?,?,?)", (article_id, fields["title"], fields["summary"], fields["body"], fields["category"], fields["image_path"], fields["source_url"], status, fields["featured"], published_at, user["id"], user["id"], now, now))
                fresh = con.execute("SELECT * FROM news_articles WHERE id=?", (article_id,)).fetchone()
                con.execute("INSERT INTO news_audit_log(news_id,actor_id,actor_name,action,after_json,created_at) VALUES(?,?,?,?,?,?)", (article_id, user["id"], user["full_name"], "PUBLISH" if status == "PUBLISHED" else "CREATE_DRAFT", json.dumps(news_item_dict(fresh, True), ensure_ascii=False), now))
                return self.send_json({"article": news_item_dict(fresh, True)}, 201)

            expected = body.get("expectedVersion")
            if not isinstance(expected, int) or isinstance(expected, bool) or expected != current["version"]:
                raise RuntimeError("Tin đã được thay đổi. Hãy tải lại trước khi lưu.")
            before = news_item_dict(current, True)
            status = "PUBLISHED" if action == "publish" else current["status"]
            published_at = current["published_at"] or now if status == "PUBLISHED" else None
            changed = con.execute("UPDATE news_articles SET title=?,summary=?,body=?,category=?,image_path=?,source_url=?,status=?,featured=?,published_at=?,version=version+1,updated_by=?,updated_at=? WHERE id=? AND version=?", (fields["title"], fields["summary"], fields["body"], fields["category"], fields["image_path"], fields["source_url"], status, fields["featured"], published_at, user["id"], now, article_id, expected)).rowcount
            if changed != 1:
                raise RuntimeError("Tin đã thay đổi trong lúc lưu. Hãy tải lại.")
            fresh = con.execute("SELECT * FROM news_articles WHERE id=?", (article_id,)).fetchone()
            log_action = "PUBLISH" if action == "publish" and current["status"] != "PUBLISHED" else "UPDATE"
            con.execute("INSERT INTO news_audit_log(news_id,actor_id,actor_name,action,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?)", (article_id, user["id"], user["full_name"], log_action, json.dumps(before, ensure_ascii=False), json.dumps(news_item_dict(fresh, True), ensure_ascii=False), now))
            return self.send_json({"article": news_item_dict(fresh, True)})

    def public_address(self) -> str:
        return self.client_address[0] if self.client_address else "unknown"

    def create_public_case(self, body: dict):
        if not isinstance(body, dict):
            raise ValueError("Thông tin hồ sơ không hợp lệ.")
        check_public_rate_limit(self.public_address(), "submit", 8)
        access_key = clean_text(body.get("submissionToken", body.get("accessKey")), 80)
        if not re.fullmatch(r"[A-Fa-f0-9]{64}", access_key):
            raise ValueError("Không tạo được phiên gửi hồ sơ an toàn. Hãy tải lại trang và thử lại.")
        try:
            request_id = str(uuid.UUID(str(body.get("submissionKey", ""))))
        except (ValueError, AttributeError, TypeError) as exc:
            raise ValueError("Phiên gửi hồ sơ không hợp lệ. Hãy tải lại trang và thử lại.") from exc
        submission_hash = hashlib.sha256(access_key.encode("ascii")).hexdigest()
        lookup_key = secrets.token_hex(32)
        owner_hash = hashlib.sha256(lookup_key.encode("ascii")).hexdigest()
        idempotency_hash = hashlib.sha256(f"{self.public_address()}:{request_id}".encode("utf-8")).hexdigest()
        with DB_LOCK, connect() as con:
            prior = con.execute("SELECT c.code,c.owner_id,v.submission_hash FROM cases c LEFT JOIN case_lookup_secrets v ON v.case_id=c.id WHERE c.idempotency_key=?", (idempotency_hash,)).fetchone()
            if prior:
                if not hmac.compare_digest(prior["submission_hash"] or prior["owner_id"], submission_hash):
                    raise RuntimeError("Mã phiên gửi đã được sử dụng. Hãy tải lại biểu mẫu trước khi gửi tiếp.")
                return self.send_json({"code": prior["code"], "duplicate": True}, 200)

        procedure_code = clean_text(body.get("procedureCode"), 40)
        procedure = PROCEDURE_BY_CODE.get(procedure_code)
        if not procedure:
            raise ValueError("Chọn một thủ tục trong danh mục trước khi gửi.")
        applicant_type = clean_text(body.get("applicantType"), 20).lower()
        if applicant_type not in {"citizen", "organization"}:
            raise ValueError("Chọn cá nhân hoặc tổ chức đứng tên hồ sơ.")
        applicant_input = body.get("applicant") or {}
        if not isinstance(applicant_input, dict):
            raise ValueError("Thông tin người nộp không hợp lệ.")
        applicant_name = clean_text(applicant_input.get("name"), 150)
        phone = clean_text(applicant_input.get("phone"), 40)
        email_value = clean_text(applicant_input.get("email"), 254)
        if len(applicant_name) < 2:
            raise ValueError("Nhập họ tên người nộp hoặc tên tổ chức.")
        if phone and not re.fullmatch(r"[+0-9(). -]{8,40}", phone):
            raise ValueError("Số điện thoại không hợp lệ.")
        if email_value:
            email_value = normalize_email(email_value)
        if not phone and not email_value:
            raise ValueError("Cần cung cấp ít nhất số điện thoại hoặc email để cơ quan liên hệ.")
        receiving_agency = clean_text(body.get("receivingAgency"), 180)
        if len(receiving_agency) < 3:
            raise ValueError("Chọn hoặc ghi cơ quan tiếp nhận theo tuyến thủ tục đã đối chiếu.")
        profile = workflows.require_submission(procedure)
        if not workflows.agency_matches(profile, receiving_agency):
            raise ValueError("Cơ quan không thuộc tuyến xử lý đã cấu hình cho thủ tục.")
        commune_authority_ok = procedure_code in {"2.000908", "2.000635"} and bool(re.match(r"^(ubnd\s+(phường|xã)\s+.+|sở\s+tư\s+pháp.*)$", receiving_agency, re.IGNORECASE))
        if not commune_authority_ok and not any(same_agency_scope(receiving_agency, opt) and opt != "toàn thành phố" for opt in procedure_agency_options(procedure)):
            raise ValueError("Cơ quan tiếp nhận không khớp với cơ quan được nêu trong danh mục của thủ tục đã chọn.")
        subject_input = body.get("subject") or {}
        if not isinstance(subject_input, dict):
            raise ValueError("Thông tin đối tượng của thủ tục không hợp lệ.")
        subject_name = clean_text(subject_input.get("name"), 150) or applicant_name
        relation = clean_text(subject_input.get("relation"), 100) or ("Tổ chức đứng tên" if applicant_type == "organization" else "Người nộp hồ sơ")
        files = body.get("files", [])
        if not isinstance(files, list) or len(files) > 8:
            raise ValueError("Mỗi hồ sơ nhận tối đa 8 tệp đính kèm.")
        if any(not isinstance(file, dict) for file in files):
            raise ValueError("Danh sách tệp đính kèm không hợp lệ.")
        if sum(len(str(file.get("data", ""))) for file in files if isinstance(file, dict)) > 12 * 1024 * 1024:
            raise ValueError("Tổng dung lượng tệp gửi lên vượt quá 12 MB.")

        declaration, delivery_method, delivery_address = validate_procedure_submission(procedure, body, applicant_type, files)
        if procedure_code == "1.004237":
            request_summary = f"{declaration['dataRequested']}. Mục đích: {declaration['purpose']}"
        elif procedure_code == "2.000908":
            request_summary = f"Đề nghị cấp {declaration['copies']} bản sao {declaration['documentName']} cho {declaration['originalOwner']}."
        elif declaration.get("requestContent"):
            request_summary = declaration["requestContent"]
            if declaration.get("relatedDocumentsInfo"):
                request_summary += f" ({declaration['relatedDocumentsInfo']})"
        else:
            request_summary = "; ".join(f"{key}: {value}" for key, value in declaration.items() if value) or "Hồ sơ trực tuyến theo biểu mẫu thủ tục đã cấu hình."
        request_summary = request_summary[:3000]

        with DB_LOCK, connect() as con:
            prior = con.execute("SELECT c.code,c.owner_id,v.submission_hash FROM cases c LEFT JOIN case_lookup_secrets v ON v.case_id=c.id WHERE c.idempotency_key=?", (idempotency_hash,)).fetchone()
            if prior:
                if not hmac.compare_digest(prior["submission_hash"] or prior["owner_id"], submission_hash):
                    raise RuntimeError("Mã phiên gửi đã được sử dụng. Hãy tải lại biểu mẫu trước khi gửi tiếp.")
                return self.send_json({"code": prior["code"], "duplicate": True}, 200)
            today = datetime.now(TZ).date().isoformat()
            active_intakes = con.execute("SELECT agency_scope FROM users WHERE role='intake' AND active=1 AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?)", (today, today)).fetchall()
            intake_exists = any(same_agency_scope(r["agency_scope"], receiving_agency) and (r["agency_scope"] or "").strip().casefold() != "toàn thành phố" for r in active_intakes)
            if not intake_exists:
                raise ValueError("Cơ quan này chưa có tài khoản tiếp nhận đang hiệu lực trong ứng dụng. Chọn cơ quan có trong danh sách hoặc liên hệ đơn vị quản trị.")

            code = ""
            for _ in range(5):
                candidate = f"HN-{datetime.now(TZ).year}-{secrets.token_hex(4).upper()}"
                if not con.execute("SELECT 1 FROM cases WHERE code=?", (candidate,)).fetchone():
                    code = candidate
                    break
            if not code:
                raise RuntimeError("Chưa tạo được mã hồ sơ. Vui lòng gửi lại sau.")
            saved_files: list[dict] = []
            try:
                saved_files = save_files(code, files)
                for saved, original in zip(saved_files, files):
                    saved["componentId"] = original["componentId"]
                created = now_iso()
                payload = {
                    "procedureCode": procedure_code,
                    "workflow": workflows.snapshot(procedure),
                    "procedure": procedure,
                    "applicantType": applicant_type,
                    "agencyScope": receiving_agency,
                    "receivingAgency": receiving_agency,
                    "applicant": {"name": applicant_name, "phone": phone, "email": email_value},
                    "subject": {"name": subject_name, "relation": relation},
                    "requestSummary": request_summary,
                    "schemaVersion": procedure["submission"]["version"],
                    "declaration": declaration,
                    "deliveryMethod": delivery_method,
                    "deliveryAddress": delivery_address,
                    "attachments": saved_files,
                    "events": [],
                    "fee": {"status": "NOT_CONNECTED"},
                    "sync": {"status": "NOT_CONFIGURED", "attempts": 0},
                }
                con.execute(
                    "INSERT INTO cases(code,owner_id,procedure_code,status,version,idempotency_key,payload_json,created_at,updated_at) VALUES(?,?,?,'CHO_TIEP_NHAN',1,?,?,?,?)",
                    (code, owner_hash, procedure_code, idempotency_hash, json.dumps(payload, ensure_ascii=False), created, created),
                )
                case_id = con.execute("SELECT id FROM cases WHERE code=?", (code,)).fetchone()["id"]
                con.execute("INSERT INTO case_lookup_secrets(case_id,encrypted_key,submission_hash,updated_at) VALUES(?,?,?,?)", (case_id, lookup_cipher().encrypt(lookup_key.encode("ascii")), submission_hash, created))
                add_event(con, case_id, "citizen", "Người nộp", "submit", "Đã gửi hồ sơ", "Hồ sơ đã được lưu và đang chờ cơ quan tiếp nhận kiểm tra.", "public", created)
            except Exception:
                case_dir = UPLOAD_DIR / code
                if case_dir.exists():
                    for item in case_dir.iterdir():
                        if item.is_file():
                            item.unlink(missing_ok=True)
                    if not any(case_dir.iterdir()):
                        case_dir.rmdir()
                raise
        return self.send_json({"code": code, "status": "CHO_TIEP_NHAN", "statusLabel": STATUS_LABELS["CHO_TIEP_NHAN"], "duplicate": False}, 201)

    def lookup_public_case(self, body: dict):
        check_public_rate_limit(self.public_address(), "lookup", 30)
        if not isinstance(body, dict):
            return self.send_error_json("Không tìm thấy hồ sơ với thông tin tra cứu đã nhập.", 404)
        code = clean_text(body.get("code"), 40).upper()
        access_key = clean_text(body.get("accessKey"), 80)
        if not re.fullmatch(r"HN-\d{4}-[A-F0-9]{8}", code) or not re.fullmatch(r"[A-Fa-f0-9]{64}", access_key):
            return self.send_error_json("Không tìm thấy hồ sơ với thông tin tra cứu đã nhập.", 404)
        with DB_LOCK, connect() as con:
            row = con.execute("SELECT * FROM cases WHERE code=?", (code,)).fetchone()
            expected = hashlib.sha256(access_key.encode("ascii")).hexdigest()
            if not row or not hmac.compare_digest(row["owner_id"], expected):
                return self.send_error_json("Không tìm thấy hồ sơ với thông tin tra cứu đã nhập.", 404)
            return self.send_json({"case": public_case_view(con, row)})

    def public_case_action(self, code: str, body: dict):
        check_public_rate_limit(self.public_address(), "action", 20)
        if not isinstance(body, dict) or not isinstance(body.get("payload") or {}, dict):
            raise ValueError("Thông tin thao tác không hợp lệ.")
        access_key = clean_text(body.get("accessKey"), 80)
        if not re.fullmatch(r"[A-Fa-f0-9]{64}", access_key):
            return self.send_error_json("Không tìm thấy hồ sơ với thông tin tra cứu đã nhập.", 404)
        action = clean_text(body.get("action"), 40)
        if action not in {"submit_supplement", "feedback", "create_payment", "confirm_payment"}:
            return self.send_error_json("Thao tác công dân không được hỗ trợ.", 403)
        if action == "submit_supplement":
            uploads = (body.get("payload") or {}).get("files", [])
            if not isinstance(uploads, list) or len(uploads) > 8:
                raise ValueError("Mỗi lần bổ sung nhận tối đa 8 tệp.")
            if any(not isinstance(file, dict) for file in uploads):
                raise ValueError("Danh sách tệp bổ sung không hợp lệ.")
            if sum(len(str(file.get("data", ""))) for file in uploads if isinstance(file, dict)) > 12 * 1024 * 1024:
                raise ValueError("Tổng dung lượng tệp bổ sung vượt quá 9 MB.")
        owner_hash = hashlib.sha256(access_key.encode("ascii")).hexdigest()
        with DB_LOCK, connect() as con:
            row = con.execute("SELECT * FROM cases WHERE code=?", (code.upper(),)).fetchone()
            if not row or not hmac.compare_digest(row["owner_id"], owner_hash):
                return self.send_error_json("Không tìm thấy hồ sơ với thông tin tra cứu đã nhập.", 404)
            case_dir = (UPLOAD_DIR / row["code"]).resolve()
            case_dir.relative_to(UPLOAD_DIR.resolve())
            existing_files = {item.resolve() for item in case_dir.iterdir() if item.is_file()} if case_dir.exists() else set()
            try:
                apply_action(con, row, {**body, "role": "citizen", "actor": "Người nộp"})
            except Exception:
                if case_dir.exists():
                    for item in case_dir.iterdir():
                        if item.is_file() and item.resolve() not in existing_files:
                            item.unlink(missing_ok=True)
                    if not any(case_dir.iterdir()):
                        case_dir.rmdir()
                raise
            fresh = con.execute("SELECT * FROM cases WHERE id=?", (row["id"],)).fetchone()
            return self.send_json({"case": public_case_view(con, fresh)})

    def login_account(self, body: dict):
        email_candidate = clean_text(body.get("email", ""), 254).lower()
        self._auth_email = email_candidate
        self.check_auth_rate_limit()
        try:
            email = normalize_email(email_candidate)
        except ValueError:
            self.record_auth_failure(email_candidate)
            raise
        password = body.get("password", "")
        with DB_LOCK, connect() as con:
            user = con.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
            salt = bytes.fromhex(user["password_salt"]) if user else b"hanoi-auth-timing-salt"
            expected = bytes.fromhex(user["password_hash"]) if user else password_hash(str(password), salt)
            actual = password_hash(str(password), salt)
            valid = hmac.compare_digest(expected, actual)
            if not user or not valid:
                self.record_auth_failure(email)
                raise AuthenticationError("Email hoặc mật khẩu không đúng.")
            if not user["active"]:
                self.record_auth_failure(email)
                raise AuthenticationError("Tài khoản cán bộ chưa được cấp quyền hoặc đã bị thu hồi.")
            if user["role"] not in STAFF_ROLES:
                self.record_auth_failure(email)
                raise PermissionError("Khu vực này chỉ dành cho cán bộ có tài khoản do cơ quan cấp.")
            today = datetime.now(TZ).date().isoformat()
            if user["valid_from"] and today < user["valid_from"]:
                self.record_auth_failure(email)
                raise PermissionError(f"Quyền truy cập có hiệu lực từ ngày {user['valid_from']}.")
            if user["valid_until"] and today > user["valid_until"]:
                self.record_auth_failure(email)
                raise PermissionError("Thời hạn quyền truy cập đã kết thúc.")
            token, csrf, expires = new_session(con, user["id"])
        self.clear_auth_email_failures(email)
        return self.send_json({"user": public_user(user), "csrfToken": csrf}, 200, {"Set-Cookie": self.session_cookie(token, expires - int(datetime.now(TZ).timestamp()))})

    def change_password(self, body: dict, user: sqlite3.Row):
        self._auth_email = user["email"]
        self.check_auth_rate_limit()
        current_password = body.get("currentPassword", "")
        new_password = body.get("newPassword", "")
        if not isinstance(current_password, str) or not current_password:
            raise ValueError("Nhập mật khẩu hiện tại.")
        validate_password(new_password)
        if hmac.compare_digest(current_password, new_password):
            raise ValueError("Mật khẩu mới phải khác mật khẩu hiện tại.")
        salt = secrets.token_bytes(16)
        jar = SimpleCookie()
        jar.load(self.headers.get("Cookie", ""))
        morsel = jar.get(SESSION_COOKIE)
        token = morsel.value if morsel else ""
        token_hash = hashlib.sha256(token.encode("ascii", errors="ignore")).hexdigest()
        with DB_LOCK, connect() as con:
            stored = con.execute("SELECT password_salt,password_hash FROM users WHERE id=?", (user["id"],)).fetchone()
            if not stored:
                raise AuthenticationError("Không tìm thấy tài khoản.")
            expected = bytes.fromhex(stored["password_hash"])
            actual = password_hash(str(current_password), bytes.fromhex(stored["password_salt"]))
            if not hmac.compare_digest(expected, actual):
                self.record_auth_failure(user["email"])
                raise AuthenticationError("Mật khẩu hiện tại không đúng.")
            con.execute("UPDATE users SET password_salt=?,password_hash=?,must_change_password=0,updated_at=? WHERE id=?", (salt.hex(), password_hash(new_password, salt).hex(), now_iso(), user["id"]))
            con.execute("DELETE FROM sessions WHERE user_id=? AND token_hash<>?", (user["id"], token_hash))
            updated = con.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
        self.clear_auth_email_failures(user["email"])
        return self.send_json({"ok": True, "user": public_user(updated)})

    def personal_account(self, user: sqlite3.Row):
        with DB_LOCK, connect() as con:
            approval = con.execute("""SELECT r.reviewed_at,r.reason,r.review_note,u.full_name AS reviewer
                FROM staff_access_requests r LEFT JOIN users u ON u.id=r.reviewed_by
                WHERE r.user_id=? AND r.status='APPROVED' ORDER BY r.reviewed_at DESC LIMIT 1""", (user["id"],)).fetchone()
            change = con.execute("""SELECT r.reviewed_at,r.reason,r.review_note,u.full_name AS reviewer
                FROM staff_account_changes r LEFT JOIN users u ON u.id=r.reviewed_by
                WHERE r.user_id=? AND r.status='APPROVED' ORDER BY r.reviewed_at DESC LIMIT 1""", (user["id"],)).fetchone()
            evidence = max([dict(row) for row in (approval, change) if row], key=lambda row: row["reviewed_at"], default=None)
            sessions = con.execute("SELECT COUNT(*) FROM sessions WHERE user_id=? AND expires_at>?", (user["id"], int(datetime.now(TZ).timestamp()))).fetchone()[0]
        # The legacy email_verified flag has no email challenge behind it.
        # Account approval does not prove ownership of an email address.
        return self.send_json({"user": public_user(user), "approval": evidence,
            "accessSource": "Đã được quản trị viên duyệt" if evidence else "Khởi tạo bởi người vận hành" if user["role"] == "admin" else "Chưa có bản ghi phê duyệt",
            "emailVerification": {"verified": False, "available": False},
            "activeSessions": sessions, "sessionExpiresAt": datetime.fromtimestamp(user["expires_at"], TZ).isoformat()})

    def update_personal_contact(self, body: dict, user: sqlite3.Row):
        phone = body.get("phone", "")
        if not isinstance(phone, str) or len(phone) > 40 or (phone.strip() and not re.fullmatch(r"[+\d()\s.-]{6,40}", phone.strip())):
            raise ValueError("Số điện thoại cần có 6–40 ký tự, chỉ gồm chữ số và dấu định dạng điện thoại.")
        password = body.get("currentPassword", "")
        if not isinstance(password, str) or not password:
            raise ValueError("Nhập mật khẩu hiện tại để xác nhận thay đổi.")
        self._auth_email = user["email"]
        self.check_auth_rate_limit()
        with DB_LOCK, connect() as con:
            stored = con.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
            if not hmac.compare_digest(bytes.fromhex(stored["password_hash"]), password_hash(password, bytes.fromhex(stored["password_salt"]))):
                self.record_auth_failure(user["email"])
                raise AuthenticationError("Mật khẩu hiện tại không đúng.")
            con.execute("UPDATE users SET phone=?,updated_at=? WHERE id=?", (phone.strip(), now_iso(), user["id"]))
            updated = con.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
        self.clear_auth_email_failures(user["email"])
        return self.send_json({"user": public_user(updated)})

    def revoke_other_sessions(self, user: sqlite3.Row):
        with DB_LOCK, connect() as con:
            con.execute("DELETE FROM sessions WHERE user_id=? AND csrf_token<>?", (user["id"], user["csrf_token"]))
        return self.send_json({"ok": True})

    def create_staff_account(self, body: dict, requester: sqlite3.Row):
        role = clean_text(body.get("role"), 30)
        if role not in STAFF_ROLES - {"admin"}:
            raise ValueError("Vai trò cán bộ không hợp lệ.")
        full_name = clean_text(body.get("name"), 150)
        if len(full_name) < 2:
            raise ValueError("Hãy nhập họ tên cán bộ.")
        email = normalize_email(body.get("email", ""))
        password = body.get("password", "")
        validate_password(password)
        agency_scope = clean_text(body.get("agencyScope"), 180)
        if len(agency_scope) < 3 or not workflows.concrete_agency(agency_scope):
            raise ValueError("Tài khoản nghiệp vụ phải thuộc một cơ quan cụ thể; không dùng phạm vi Toàn thành phố.")
        if requester["role"] != "admin":
            req_scope = (requester["agency_scope"] or "").strip()
            if not req_scope or req_scope.casefold() == "toàn thành phố" or not same_agency_scope(agency_scope, req_scope):
                raise PermissionError("Chỉ được đề nghị cấp tài khoản thuộc đúng cơ quan đang được giao quản lý.")
        valid_from = clean_text(body.get("validFrom"), 10)
        valid_until = clean_text(body.get("validUntil"), 10)
        try:
            start_date = date.fromisoformat(valid_from)
            end_date = date.fromisoformat(valid_until)
        except ValueError as exc:
            raise ValueError("Hãy nhập thời hạn quyền theo định dạng ngày hợp lệ.") from exc
        if end_date < start_date:
            raise ValueError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.")
        if end_date < datetime.now(TZ).date():
            raise ValueError("Không thể đề nghị cấp quyền đã hết hạn.")
        reason = clean_text(body.get("reason"), 1200)
        if len(reason) < 12:
            raise ValueError("Cần ghi căn cứ cấp quyền (ít nhất 12 ký tự).")
        requested_sign_stop = body.get("maySignStop") is True
        signing_authority_ref = clean_text(body.get("signingAuthorityRef"), 180)
        if requested_sign_stop and (role != "leader" or len(signing_authority_ref) < 3):
            raise ValueError("Quyền ký Mẫu 06 chỉ đề nghị cho vai trò lãnh đạo và phải có số văn bản phân công thẩm quyền.")
        salt = secrets.token_bytes(16)
        user_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())
        created = now_iso()
        with DB_LOCK, connect() as con:
            try:
                con.execute("INSERT INTO users(id,email,phone,full_name,password_salt,password_hash,role,active,email_verified,agency_scope,valid_from,valid_until,must_change_password,created_at,updated_at) VALUES(?,?,?,?,?,?,?,0,0,?,?,?,1,?,?)", (user_id, email, clean_text(body.get("phone"), 40), full_name, salt.hex(), password_hash(password, salt).hex(), role, agency_scope, valid_from, valid_until, created, created))
            except sqlite3.IntegrityError as exc:
                if "email" in str(exc).lower():
                    raise ValueError("Email này đã có tài khoản.") from exc
                raise
            con.execute("INSERT INTO staff_access_requests(id,user_id,requested_by,role,agency_scope,valid_from,valid_until,requested_sign_stop,signing_authority_ref,reason,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,'PENDING',?)", (request_id, user_id, requester["id"], role, agency_scope, valid_from, valid_until, int(requested_sign_stop), signing_authority_ref, reason, created))
        return self.send_json({"request": {"id": request_id, "userId": user_id, "email": email, "name": full_name, "role": role, "agencyScope": agency_scope, "validFrom": valid_from, "validUntil": valid_until, "maySignStop": requested_sign_stop, "signingAuthorityRef": signing_authority_ref, "status": "PENDING", "createdAt": created}}, 201)

    def review_staff_access(self, request_id: str, body: dict, reviewer: sqlite3.Row):
        decision = clean_text(body.get("decision"), 20).lower()
        if decision not in {"approve", "reject"}:
            raise ValueError("Hãy chọn duyệt hoặc từ chối đề nghị.")
        note = clean_text(body.get("note"), 1200)
        if decision == "reject" and len(note) < 12:
            raise ValueError("Cần ghi rõ căn cứ từ chối đề nghị.")
        today = datetime.now(TZ).date().isoformat()
        with DB_LOCK, connect() as con:
            request = con.execute("SELECT * FROM staff_access_requests WHERE id=?", (request_id,)).fetchone()
            if not request:
                return self.send_error_json("Không tìm thấy đề nghị cấp quyền.", 404)
            if request["status"] != "PENDING":
                raise ValueError("Đề nghị này đã được xử lý.")
            if request["requested_by"] == reviewer["id"]:
                raise PermissionError("Người duyệt phải khác người đề nghị cấp quyền.")
            authorize_sign_stop = body.get("authorizeStopSigning") is True
            if decision == "approve" and request["requested_sign_stop"]:
                if not authorize_sign_stop or len(request["signing_authority_ref"].strip()) < 3:
                    raise ValueError("Đối chiếu văn bản phân công thẩm quyền ký Mẫu 06 rồi xác nhận riêng trước khi duyệt.")
            if decision == "approve":
                if not workflows.concrete_agency(request["agency_scope"]):
                    raise ValueError("Đề nghị cấp quyền nghiệp vụ phải ghi cơ quan cụ thể; hãy lập lại đề nghị cũ.")
                if request["valid_until"] < today:
                    raise ValueError("Thời hạn đề nghị đã hết; hãy lập đề nghị mới.")
                can_sign_stop = bool(request["requested_sign_stop"] and authorize_sign_stop)
                authority_ref = request["signing_authority_ref"] if can_sign_stop else ""
                con.execute("UPDATE users SET role=?,active=1,agency_scope=?,valid_from=?,valid_until=?,may_sign_stop=?,signing_authority_ref=?,updated_at=? WHERE id=?", (request["role"], request["agency_scope"], request["valid_from"], request["valid_until"], int(can_sign_stop), authority_ref, now_iso(), request["user_id"]))
                if can_sign_stop:
                    con.execute("INSERT INTO staff_authority_events(user_id,changed_by,action,authority_ref,reason,created_at) VALUES(?,?,'GRANT_STOP_SIGNING',?,?,?)", (request["user_id"], reviewer["id"], authority_ref, f"Đề nghị {request_id} được duyệt; {clean_text(request['reason'], 500)}", now_iso()))
            else:
                con.execute("UPDATE users SET active=0,updated_at=? WHERE id=?", (now_iso(), request["user_id"]))
            status = "APPROVED" if decision == "approve" else "REJECTED"
            con.execute("UPDATE staff_access_requests SET status=?,reviewed_by=?,review_note=?,reviewed_at=? WHERE id=?", (status, reviewer["id"], note, now_iso(), request_id))
        return self.send_json({"ok": True, "status": status, "id": request_id})

    @staticmethod
    def account_access_values(row: sqlite3.Row) -> dict:
        return {
            "role": row["role"],
            "active": bool(row["active"]),
            "agencyScope": row["agency_scope"],
            "validFrom": row["valid_from"],
            "validUntil": row["valid_until"],
            "canManageAgencyAccounts": bool(row["can_manage_agency_accounts"]),
        }

    def request_staff_account_change(self, user_id: str, body: dict, requester: sqlite3.Row):
        reason = clean_text(body.get("reason"), 1200)
        if len(reason) < 12:
            raise ValueError("Cần ghi căn cứ điều chỉnh (ít nhất 12 ký tự).")
        if "active" not in body or not isinstance(body.get("active"), bool):
            raise ValueError("Tình trạng tài khoản phải được gửi rõ ràng.")
        role = clean_text(body.get("role"), 30)
        if role not in STAFF_ROLES:
            raise ValueError("Vai trò cán bộ không hợp lệ.")
        agency_scope = clean_text(body.get("agencyScope"), 180)
        if len(agency_scope) < 3 or (role != "admin" and not workflows.concrete_agency(agency_scope)):
            raise ValueError("Tài khoản nghiệp vụ phải thuộc một cơ quan cụ thể.")
        valid_from = clean_text(body.get("validFrom"), 10)
        valid_until = clean_text(body.get("validUntil"), 10)
        try:
            start_date = date.fromisoformat(valid_from) if valid_from else None
            end_date = date.fromisoformat(valid_until) if valid_until else None
        except ValueError as exc:
            raise ValueError("Thời hạn phải là ngày hợp lệ theo định dạng YYYY-MM-DD.") from exc
        if start_date and end_date and end_date < start_date:
            raise ValueError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.")
        today = datetime.now(TZ).date()
        if body["active"] and end_date and end_date < today:
            raise ValueError("Không thể kích hoạt tài khoản với thời hạn đã kết thúc.")
        change_id = str(uuid.uuid4())
        created = now_iso()
        with DB_LOCK, connect() as con:
            target = con.execute("SELECT * FROM users WHERE id=? AND role!='citizen'", (user_id,)).fetchone()
            if not target:
                return self.send_error_json("Không tìm thấy tài khoản cán bộ.", 404)
            if requester["role"] != "admin":
                if role == "admin" or target["role"] == "admin" or target["agency_scope"].strip().casefold() != requester["agency_scope"].strip().casefold():
                    raise PermissionError("Chỉ được đề nghị thay đổi tài khoản thuộc cơ quan đang được giao quản lý.")
                if agency_scope.casefold() != requester["agency_scope"].strip().casefold():
                    raise PermissionError("Quản trị viên cơ quan không được chuyển tài khoản sang cơ quan khác.")
                can_manage_agency_accounts = bool(target["can_manage_agency_accounts"])
            else:
                requested_manager = body.get("canManageAgencyAccounts", bool(target["can_manage_agency_accounts"]))
                if not isinstance(requested_manager, bool):
                    raise ValueError("Quyền quản lý tài khoản cơ quan phải được gửi rõ ràng.")
                can_manage_agency_accounts = requested_manager
            if role == "admin" and can_manage_agency_accounts:
                raise ValueError("Tài khoản quản trị hệ thống không đồng thời mang quyền quản trị cơ quan.")
            if requester["id"] == user_id:
                raise PermissionError("Không thể lập đề nghị thay đổi chính tài khoản đang sử dụng.")
            if not target["active"] and con.execute("SELECT 1 FROM staff_access_requests WHERE user_id=? AND status='PENDING'", (user_id,)).fetchone():
                raise RuntimeError("Tài khoản đang chờ duyệt đề nghị cấp ban đầu; hãy xử lý đề nghị đó trước.")
            before = self.account_access_values(target)
            proposed = {"role": role, "active": body["active"], "agencyScope": agency_scope, "validFrom": valid_from, "validUntil": valid_until, "canManageAgencyAccounts": can_manage_agency_accounts}
            if before == proposed:
                raise ValueError("Thông tin đề nghị giống quyền hiện tại; không có nội dung cần thay đổi.")
            pending = con.execute("SELECT 1 FROM staff_account_changes WHERE user_id=? AND status='PENDING'", (user_id,)).fetchone()
            if pending:
                raise RuntimeError("Tài khoản đã có một đề nghị thay đổi đang chờ xử lý.")
            try:
                con.execute("INSERT INTO staff_account_changes(id,user_id,requested_by,before_json,proposed_json,reason,status,created_at) VALUES(?,?,?,?,?,?,'PENDING',?)", (change_id, user_id, requester["id"], json.dumps(before, ensure_ascii=False), json.dumps(proposed, ensure_ascii=False), reason, created))
            except sqlite3.IntegrityError as exc:
                raise RuntimeError("Tài khoản đã có một đề nghị thay đổi đang chờ xử lý.") from exc
        return self.send_json({"request": {"id": change_id, "userId": user_id, "before": before, "proposed": proposed, "reason": reason, "status": "PENDING", "createdAt": created}}, 201)

    def review_staff_account_change(self, request_id: str, body: dict, reviewer: sqlite3.Row):
        decision = clean_text(body.get("decision"), 20).lower()
        if decision not in {"approve", "reject"}:
            raise ValueError("Hãy chọn duyệt hoặc từ chối đề nghị.")
        note = clean_text(body.get("note"), 1200)
        if decision == "reject" and len(note) < 12:
            raise ValueError("Cần ghi rõ căn cứ từ chối đề nghị.")
        today = datetime.now(TZ).date().isoformat()
        with DB_LOCK, connect() as con:
            request = con.execute("SELECT * FROM staff_account_changes WHERE id=?", (request_id,)).fetchone()
            if not request:
                return self.send_error_json("Không tìm thấy đề nghị thay đổi tài khoản.", 404)
            if request["status"] != "PENDING":
                raise ValueError("Đề nghị này đã được xử lý.")
            if request["requested_by"] == reviewer["id"] or request["user_id"] == reviewer["id"]:
                raise PermissionError("Người đề nghị và chủ tài khoản không được tự duyệt thay đổi này.")
            target = con.execute("SELECT * FROM users WHERE id=? AND role!='citizen'", (request["user_id"],)).fetchone()
            if not target:
                return self.send_error_json("Tài khoản đích không còn tồn tại.", 404)
            before = json.loads(request["before_json"])
            proposed = json.loads(request["proposed_json"])
            before.setdefault("canManageAgencyAccounts", False)
            proposed.setdefault("canManageAgencyAccounts", False)
            current_access = self.account_access_values(target)
            if current_access != before:
                raise RuntimeError("Quyền tài khoản đã đổi sau khi lập đề nghị. Hãy lập đề nghị mới dựa trên thông tin hiện tại.")
            status = "APPROVED" if decision == "approve" else "REJECTED"
            if decision == "approve":
                if proposed["role"] != "admin" and not workflows.concrete_agency(proposed["agencyScope"]):
                    raise ValueError("Tài khoản nghiệp vụ phải thuộc cơ quan cụ thể.")
                if proposed["active"] and proposed["validUntil"] and proposed["validUntil"] < today:
                    raise ValueError("Thời hạn đề nghị đã kết thúc; hãy lập đề nghị mới.")
                if target["role"] == "admin":
                    other_admins = con.execute("""SELECT COUNT(*) FROM users WHERE id<>? AND role='admin' AND active=1
                        AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?)""", (target["id"], today, today)).fetchone()[0]
                    proposed_is_effective_admin = proposed["role"] == "admin" and proposed["active"] and (not proposed["validFrom"] or proposed["validFrom"] <= today) and (not proposed["validUntil"] or proposed["validUntil"] >= today)
                    if not other_admins and not proposed_is_effective_admin:
                        raise ValueError("Không thể thu hồi hoặc hạ quyền quản trị viên cuối cùng đang có hiệu lực.")
                con.execute("UPDATE users SET role=?,active=?,agency_scope=?,valid_from=?,valid_until=?,can_manage_agency_accounts=?,updated_at=? WHERE id=?", (proposed["role"], int(proposed["active"]), proposed["agencyScope"], proposed["validFrom"], proposed["validUntil"], int(proposed["canManageAgencyAccounts"]), now_iso(), target["id"]))
                if target["role"] == "leader" and proposed["role"] != "leader" and target["may_sign_stop"]:
                    con.execute("UPDATE users SET may_sign_stop=0,signing_authority_ref='' WHERE id=?", (target["id"],))
                    con.execute("INSERT INTO staff_authority_events(user_id,changed_by,action,authority_ref,reason,created_at) VALUES(?,?,'REVOKE_STOP_SIGNING',?,?,?)", (target["id"], reviewer["id"], target["signing_authority_ref"], f"Thu hồi do đổi vai trò; đề nghị {request_id}: {clean_text(request['reason'], 500)}", now_iso()))
                # A changed account must authenticate again with its newly approved rights.
                con.execute("DELETE FROM sessions WHERE user_id=?", (target["id"],))
            changed = con.execute("UPDATE staff_account_changes SET status=?,reviewed_by=?,review_note=?,reviewed_at=? WHERE id=? AND status='PENDING'", (status, reviewer["id"], note, now_iso(), request_id)).rowcount
            if changed != 1:
                raise RuntimeError("Đề nghị vừa được xử lý bởi một quản trị viên khác.")
        return self.send_json({"ok": True, "status": status, "id": request_id})

    def revoke_stop_signing(self, user_id: str, body: dict, reviewer: sqlite3.Row):
        reason = clean_text(body.get("reason"), 1200)
        if len(reason) < 12:
            raise ValueError("Ghi căn cứ thu hồi quyền ký (ít nhất 12 ký tự).")
        with DB_LOCK, connect() as con:
            target = con.execute("SELECT id,role,may_sign_stop,signing_authority_ref FROM users WHERE id=?", (user_id,)).fetchone()
            if not target or target["role"] != "leader":
                return self.send_error_json("Không tìm thấy tài khoản lãnh đạo trong hệ thống.", 404)
            if not target["may_sign_stop"]:
                raise ValueError("Tài khoản này hiện không có quyền ký Thông báo dừng.")
            con.execute("UPDATE users SET may_sign_stop=0,signing_authority_ref='',updated_at=? WHERE id=?", (now_iso(), user_id))
            con.execute("INSERT INTO staff_authority_events(user_id,changed_by,action,authority_ref,reason,created_at) VALUES(?,?,'REVOKE_STOP_SIGNING',?,?,?)", (user_id, reviewer["id"], target["signing_authority_ref"], reason, now_iso()))
        return self.send_json({"ok": True, "userId": user_id, "maySignStop": False})

    def save_procedure_catalog_edit(self, code: str, body: dict, actor: sqlite3.Row):
        if actor["role"] != "admin":
            return self.send_error_json("Chỉ quản trị viên hệ thống được cập nhật danh mục thủ tục.", 403)
        current = PROCEDURE_BY_CODE.get(code)
        if not current:
            return self.send_error_json("Không tìm thấy mã thủ tục trong danh mục tham chiếu.", 404)
        source_code = current.get("sourceCode") or current["code"]
        local_code = clean_text(body.get("code"), 40).upper()
        name = clean_text(body.get("name"), 500)
        level = clean_text(body.get("level"), 80)
        agency = clean_text(body.get("agency"), 300)
        source_url = clean_text(body.get("sourceUrl"), 600)
        checked_at = clean_text(body.get("checkedAt"), 10)
        reason = clean_text(body.get("reason"), 1200)
        category_key = clean_text(body.get("categoryKey"), 180) or current.get("fieldSource") or current.get("field")
        target_category = next((item for item in procedure_category_records() if item["key"] == category_key), None)
        if not target_category:
            raise ValueError("Chọn một lĩnh vực hiện có trong danh mục.")
        field = target_category["name"]
        if not re.fullmatch(r"[A-Z0-9][A-Z0-9._/-]{1,39}", local_code):
            raise ValueError("Mã thủ tục cần 2–40 ký tự gồm chữ, số, dấu chấm, gạch ngang hoặc gạch chéo; không có khoảng trắng.")
        if not name or not agency:
            raise ValueError("Tên thủ tục và cơ quan thực hiện không được để trống.")
        for item in procedure_catalog_records():
            if item.get("sourceCode") != source_code and item.get("code", "").casefold() == local_code.casefold():
                raise ValueError("Mã thủ tục đã được một thủ tục khác sử dụng.")
        if level not in {"Toàn trình", "Một phần", "Cung cấp thông tin"}:
            raise ValueError("Mức dịch vụ phải chọn theo một trong ba nhóm của danh mục.")
        if source_url:
            self.validate_catalog_source(source_url)
            if not checked_at:
                raise ValueError("Khi ghi nguồn đối chiếu, hãy nhập cả ngày đã kiểm tra nguồn.")
        if checked_at:
            if not source_url:
                raise ValueError("Chỉ ghi ngày đối chiếu khi có liên kết nguồn chính thức.")
            self.validate_catalog_date(checked_at)
        if len(reason) < 20:
            raise ValueError("Hãy ghi căn cứ thay đổi ít nhất 20 ký tự.")
        expected_version = body.get("expectedVersion", 0)
        if isinstance(expected_version, bool) or not isinstance(expected_version, int) or expected_version < 0:
            raise ValueError("Phiên bản danh mục không hợp lệ.")

        before = PROCEDURE_OVERRIDES.get(source_code)
        current_version = before["version"] if before else 0
        if expected_version != current_version:
            return self.send_error_json("Danh mục đã được người khác cập nhật. Tải lại trước khi lưu tiếp.", 409)
        version = current_version + 1
        updated_at = now_iso()
        edit = {
            "localCode": local_code, "name": name, "field": field, "categoryKey": category_key, "level": level, "agency": agency,
            "sourceUrl": source_url, "checkedAt": checked_at, "reason": reason,
            "version": version, "updatedBy": actor["full_name"], "updatedAt": updated_at,
            "submission": (before or {}).get("submission"),
        }
        after_json = json.dumps({k: v for k, v in edit.items() if k != "submission"}, ensure_ascii=False, separators=(",", ":"))
        before_json = json.dumps({k: v for k, v in before.items() if k != "submission"}, ensure_ascii=False, separators=(",", ":")) if before else None
        with DB_LOCK, connect() as con:
            con.execute("""INSERT INTO procedure_catalog_edits(procedure_code,local_code,name,field,category_key,level,agency,source_url,checked_at,reason,version,updated_by,updated_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(procedure_code) DO UPDATE SET local_code=excluded.local_code,name=excluded.name,field=excluded.field,category_key=excluded.category_key,level=excluded.level,agency=excluded.agency,source_url=excluded.source_url,checked_at=excluded.checked_at,reason=excluded.reason,version=excluded.version,updated_by=excluded.updated_by,updated_at=excluded.updated_at""",
                (source_code, local_code, name, field, category_key, level, agency, source_url, checked_at, reason, version, actor["full_name"], updated_at))
            con.execute("INSERT INTO procedure_catalog_audit(procedure_code,actor_id,actor_name,action,reason,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?)",
                (source_code, actor["id"], actor["full_name"], "UPDATED", reason, before_json, after_json, updated_at))
        PROCEDURE_OVERRIDES[source_code] = edit
        current.update({"name": name, "field": field, "level": level, "agency": agency,
            "serviceMode": {"Toàn trình": "FULL", "Một phần": "PARTIAL", "Cung cấp thông tin": "INFORMATION"}[level]})
        current["fieldSource"] = category_key
        ensure_procedure_submission(current)
        for alias, procedure in list(PROCEDURE_BY_CODE.items()):
            if procedure is current and alias not in {source_code, local_code}:
                del PROCEDURE_BY_CODE[alias]
        PROCEDURE_BY_CODE[source_code] = current
        PROCEDURE_BY_CODE[local_code] = current
        updated_record = next(item for item in procedure_catalog_records() if item.get("sourceCode") == source_code)
        return self.send_json({"procedure": updated_record})

    def save_procedure_category_edit(self, body: dict, actor: sqlite3.Row):
        if actor["role"] != "admin":
            return self.send_error_json("Chỉ quản trị viên hệ thống được cập nhật lĩnh vực thủ tục.", 403)
        source_field = clean_text(body.get("sourceName"), 180)
        display_name = clean_text(body.get("name"), 180)
        source_url = clean_text(body.get("sourceUrl"), 600)
        checked_at = clean_text(body.get("checkedAt"), 10)
        reason = clean_text(body.get("reason"), 1200)
        if not source_field or not display_name:
            raise ValueError("Tên lĩnh vực hiện tại và tên lĩnh vực mới không được để trống.")
        if not any(item["key"] == source_field for item in procedure_category_records()):
            raise ValueError("Lĩnh vực không còn trong danh mục; hãy tải lại dữ liệu.")
        conflicts = {item["key"] for item in procedure_category_records()
                     if item["name"].strip().casefold() == display_name.casefold() and item["key"] != source_field}
        if conflicts:
            raise ValueError("Tên lĩnh vực này đang được một nhóm khác sử dụng. Hãy chọn tên phân biệt hoặc xử lý từng nhóm riêng.")
        is_internal = source_field.startswith("local:")
        if source_url or not is_internal:
            self.validate_catalog_source(source_url)
        if checked_at:
            self.validate_catalog_date(checked_at)
        elif not is_internal:
            raise ValueError("Nhập ngày đối chiếu theo nguồn chính thức.")
        if len(reason) < 20:
            raise ValueError("Hãy ghi căn cứ thay đổi ít nhất 20 ký tự.")
        expected_version = body.get("expectedVersion", 0)
        if isinstance(expected_version, bool) or not isinstance(expected_version, int) or expected_version < 0:
            raise ValueError("Phiên bản lĩnh vực không hợp lệ.")
        before = PROCEDURE_CATEGORY_OVERRIDES.get(source_field)
        current_version = before["version"] if before else 0
        if expected_version != current_version:
            return self.send_error_json("Lĩnh vực đã được cập nhật. Tải lại danh mục trước khi lưu tiếp.", 409)
        version = current_version + 1
        updated_at = now_iso()
        edit = {"displayName": display_name, "sourceUrl": source_url, "checkedAt": checked_at, "reason": reason,
                "version": version, "updatedBy": actor["full_name"], "updatedAt": updated_at}
        before_json = json.dumps(before, ensure_ascii=False, separators=(",", ":")) if before else None
        after_json = json.dumps(edit, ensure_ascii=False, separators=(",", ":"))
        with DB_LOCK, connect() as con:
            con.execute("""INSERT INTO procedure_category_edits(source_field,display_name,source_url,checked_at,reason,version,updated_by,updated_at)
                VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(source_field) DO UPDATE SET display_name=excluded.display_name,source_url=excluded.source_url,checked_at=excluded.checked_at,reason=excluded.reason,version=excluded.version,updated_by=excluded.updated_by,updated_at=excluded.updated_at""",
                (source_field, display_name, source_url, checked_at, reason, version, actor["full_name"], updated_at))
            con.execute("INSERT INTO procedure_category_audit(source_field,actor_id,actor_name,reason,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?)",
                (source_field, actor["id"], actor["full_name"], reason, before_json, after_json, updated_at))
        PROCEDURE_CATEGORY_OVERRIDES[source_field] = edit
        for procedure in PROCEDURES:
            if (procedure.get("fieldSource") or "Chưa phân loại") == source_field:
                procedure["field"] = display_name
        return self.send_json({"category": {"sourceName": source_field, "name": display_name, **edit}})

    @staticmethod
    def validate_catalog_source(source_url: str) -> None:
        parsed = urlparse(source_url)
        hostname = (parsed.hostname or "").lower().rstrip(".")
        official_host = hostname == "gov.vn" or hostname.endswith(".gov.vn") or hostname == "chinhphu.vn" or hostname.endswith(".chinhphu.vn")
        if parsed.scheme != "https" or not official_host:
            raise ValueError("Nguồn đối chiếu phải là liên kết HTTPS thuộc miền .gov.vn hoặc chinhphu.vn.")

    @staticmethod
    def validate_catalog_date(checked_at: str) -> None:
        try:
            checked_day = date.fromisoformat(checked_at)
        except ValueError as exc:
            raise ValueError("Ngày đối chiếu cần nhập theo dạng YYYY-MM-DD.") from exc
        if checked_day > datetime.now(TZ).date():
            raise ValueError("Ngày đối chiếu không thể ở trong tương lai.")

    def create_procedure_category(self, body: dict, actor: sqlite3.Row):
        if actor["role"] != "admin":
            return self.send_error_json("Chỉ quản trị viên hệ thống được tạo nhóm lĩnh vực nội bộ.", 403)
        name = clean_text(body.get("name"), 180)
        source_url = clean_text(body.get("sourceUrl"), 600)
        checked_at = clean_text(body.get("checkedAt"), 10)
        reason = clean_text(body.get("reason"), 1200)
        if len(name) < 3:
            raise ValueError("Tên lĩnh vực cần ít nhất 3 ký tự.")
        if source_url:
            self.validate_catalog_source(source_url)
        if checked_at:
            self.validate_catalog_date(checked_at)
        if len(reason) < 20:
            raise ValueError("Nêu rõ mục đích tạo nhóm, tối thiểu 20 ký tự.")
        if any(item["name"].casefold() == name.casefold() for item in procedure_category_records()):
            raise ValueError("Tên lĩnh vực này đã có trong danh mục.")
        key = f"local:{uuid.uuid4().hex[:16]}"
        created_at = now_iso()
        edit = {"displayName": name, "sourceUrl": source_url, "checkedAt": checked_at,
                "reason": reason, "version": 1, "updatedBy": actor["full_name"], "updatedAt": created_at}
        with DB_LOCK, connect() as con:
            con.execute("INSERT INTO procedure_category_edits(source_field,display_name,source_url,checked_at,reason,version,updated_by,updated_at) VALUES(?,?,?,?,?,1,?,?)",
                        (key, name, source_url, checked_at, reason, actor["full_name"], created_at))
            con.execute("INSERT INTO procedure_category_audit(source_field,actor_id,actor_name,reason,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?)",
                        (key, actor["id"], actor["full_name"], reason, None, json.dumps(edit, ensure_ascii=False, separators=(",", ":")), created_at))
        PROCEDURE_CATEGORY_OVERRIDES[key] = edit
        return self.send_json({"category": {"key": key, "name": name, "count": 0, "source": "internal", "categoryEdit": edit}}, 201)

    def move_procedures_to_category(self, body: dict, actor: sqlite3.Row):
        if actor["role"] != "admin":
            return self.send_error_json("Chỉ quản trị viên hệ thống được phân loại lại danh mục.", 403)
        codes = body.get("procedureCodes")
        if not isinstance(codes, list) or not codes or len(codes) > 100:
            raise ValueError("Chọn từ 1 đến 100 thủ tục trong một lần chuyển nhóm.")
        target_key = clean_text(body.get("targetCategoryKey"), 180)
        target = next((item for item in procedure_category_records() if item["key"] == target_key), None)
        if not target:
            raise ValueError("Lĩnh vực đích không còn trong danh mục.")
        source_url = clean_text(body.get("sourceUrl"), 600)
        checked_at = clean_text(body.get("checkedAt"), 10)
        reason = clean_text(body.get("reason"), 1200)
        if source_url:
            self.validate_catalog_source(source_url)
        if target["source"] == "reference":
            if not source_url or not checked_at:
                raise ValueError("Khi chuyển vào lĩnh vực tham chiếu, cần ghi nguồn .gov.vn/chinhphu.vn và ngày đối chiếu.")
            self.validate_catalog_date(checked_at)
        elif checked_at:
            self.validate_catalog_date(checked_at)
        if len(reason) < 20:
            raise ValueError("Nêu căn cứ và mục đích chuyển nhóm, tối thiểu 20 ký tự.")
        unique_codes = list(dict.fromkeys(clean_text(value, 40).upper() for value in codes))
        if len(unique_codes) != len(codes):
            raise ValueError("Danh sách có mã thủ tục trống hoặc lặp.")
        records_by_source = {item["sourceCode"]: item for item in procedure_catalog_records()}
        expected_versions = body.get("expectedVersions") if isinstance(body.get("expectedVersions"), dict) else {}
        changes = []
        for submitted_code in unique_codes:
            current = PROCEDURE_BY_CODE.get(submitted_code)
            source_code = current.get("code") if current else None
            record = records_by_source.get(source_code or "")
            if not current or not record:
                raise ValueError(f"Không tìm thấy thủ tục {submitted_code} trong danh mục hiện tại.")
            if record["categoryKey"] == target_key:
                continue
            before = PROCEDURE_OVERRIDES.get(source_code)
            version = before["version"] if before else 0
            supplied_version = expected_versions.get(source_code, version)
            if isinstance(supplied_version, bool) or not isinstance(supplied_version, int) or supplied_version != version:
                return self.send_error_json(f"Thủ tục {record['code']} vừa thay đổi. Tải lại danh mục trước khi chuyển.", 409)
            changes.append((current, record, source_code, before, version + 1))
        if not changes:
            return self.send_json({"moved": 0, "message": "Các thủ tục đã thuộc lĩnh vực được chọn."})
        updated_at = now_iso()
        with DB_LOCK, connect() as con:
            for current, record, source_code, before, version in changes:
                edit = {
                    "localCode": record["code"], "name": record["name"], "field": target["name"], "categoryKey": target_key,
                    "level": record["level"], "agency": record["agency"], "sourceUrl": source_url, "checkedAt": checked_at,
                    "reason": reason, "version": version, "updatedBy": actor["full_name"], "updatedAt": updated_at,
                    "submission": (before or {}).get("submission"),
                }
                con.execute("""INSERT INTO procedure_catalog_edits(procedure_code,local_code,name,field,category_key,level,agency,source_url,checked_at,reason,version,updated_by,updated_at)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(procedure_code) DO UPDATE SET local_code=excluded.local_code,name=excluded.name,field=excluded.field,category_key=excluded.category_key,level=excluded.level,agency=excluded.agency,source_url=excluded.source_url,checked_at=excluded.checked_at,reason=excluded.reason,version=excluded.version,updated_by=excluded.updated_by,updated_at=excluded.updated_at""",
                    (source_code, edit["localCode"], edit["name"], edit["field"], target_key, edit["level"], edit["agency"], source_url, checked_at, reason, version, actor["full_name"], updated_at))
                con.execute("INSERT INTO procedure_catalog_audit(procedure_code,actor_id,actor_name,action,reason,before_json,after_json,created_at) VALUES(?,?,?,?,?,?,?,?)",
                    (source_code, actor["id"], actor["full_name"], "MOVED_CATEGORY", reason,
                     json.dumps({k: v for k, v in before.items() if k != "submission"}, ensure_ascii=False, separators=(",", ":")) if before else json.dumps({"code": record["code"], "name": record["name"], "field": record["field"], "categoryKey": record["categoryKey"]}, ensure_ascii=False, separators=(",", ":")),
                     json.dumps({k: v for k, v in edit.items() if k != "submission"}, ensure_ascii=False, separators=(",", ":")), updated_at))
                PROCEDURE_OVERRIDES[source_code] = edit
                current["field"] = target["name"]
                current["fieldSource"] = target_key
        return self.send_json({"moved": len(changes), "targetCategory": target["name"]})

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == "/api/health":
            return self.send_json({"status": "ok"})
        if path == "/api/auth/me":
            user = self.current_user()
            return self.send_json({"user": public_user(user) if user else None, "csrfToken": user["csrf_token"] if user else None})
        if path == "/api/auth/account":
            user = self.current_user()
            if not user:
                return self.send_error_json("Bạn cần đăng nhập để xem tài khoản cá nhân.", 401)
            if user["must_change_password"]:
                return self.send_error_json("Đổi mật khẩu khởi tạo trước khi tiếp tục.", 403)
            return self.personal_account(user)
        if path == "/api/sandbox-signers":
            user = self.current_user()
            if not user:
                return self.send_error_json("Bạn cần đăng nhập để xem quyền ký thử nghiệm.", 401)
            if user["must_change_password"]:
                return self.send_error_json("Đổi mật khẩu khởi tạo trước khi tiếp tục.", 403)
            with DB_LOCK, connect() as con:
                if user["role"] == "admin":
                    today = datetime.now(TZ).date().isoformat()
                    rows = con.execute("""SELECT u.id,u.full_name,u.email,u.agency_scope,u.valid_from,u.valid_until,u.active AS user_active,
                        a.authority_ref,a.reason,a.active AS authority_active,a.granted_at,a.revoked_at
                        FROM users u LEFT JOIN sandbox_signing_authorities a ON a.user_id=u.id
                        WHERE u.role='leader' ORDER BY u.agency_scope,u.full_name""").fetchall()
                    signers = []
                    for row in rows:
                        item = dict(row)
                        item["effective"] = bool(item["user_active"] and item["authority_active"] and (not item["valid_from"] or item["valid_from"] <= today) and (not item["valid_until"] or item["valid_until"] >= today))
                        signers.append(item)
                    return self.send_json({"signers": signers})
                if user["role"] != "leader":
                    return self.send_error_json("Chỉ quản trị viên hoặc lãnh đạo xem được quyền ký thử nghiệm.", 403)
                row = con.execute("SELECT authority_ref,reason,active,granted_at,revoked_at FROM sandbox_signing_authorities WHERE user_id=?", (user["id"],)).fetchone()
                today = datetime.now(TZ).date().isoformat()
                effective = bool(row and row["active"] and (not user["valid_from"] or user["valid_from"] <= today) and (not user["valid_until"] or user["valid_until"] >= today))
                return self.send_json({"authorized": effective, "authority": dict(row) if row else None})
        if path == "/api/procedure-categories":
            return self.send_json({"categories": procedure_category_records()})
        if path == "/api/public/news":
            return self.list_public_news()
        if path.startswith("/api/procedures/") and path.endswith("/history"):
            user = self.current_user()
            if not user:
                return self.send_error_json("Bạn cần đăng nhập để xem lịch sử chỉnh sửa danh mục.", 401)
            if user["role"] != "admin":
                return self.send_error_json("Lịch sử chỉnh sửa danh mục chỉ dành cho quản trị viên hệ thống.", 403)
            code = path[len("/api/procedures/"):-len("/history")].strip("/")
            if not code or "/" in code or code not in PROCEDURE_BY_CODE:
                return self.send_error_json("Không tìm thấy thủ tục.", 404)
            with DB_LOCK, connect() as con:
                rows = con.execute("SELECT actor_name,action,reason,before_json,after_json,created_at FROM procedure_catalog_audit WHERE procedure_code=? ORDER BY id DESC LIMIT 30", (code,)).fetchall()
            return self.send_json({"history": [{"actor": row["actor_name"], "action": row["action"], "reason": row["reason"], "before": json.loads(row["before_json"]) if row["before_json"] else None, "after": json.loads(row["after_json"]), "createdAt": row["created_at"]} for row in rows]})
        if path == "/api/procedure-categories/history":
            user = self.current_user()
            if not user:
                return self.send_error_json("Bạn cần đăng nhập để xem lịch sử lĩnh vực.", 401)
            if user["role"] != "admin":
                return self.send_error_json("Lịch sử chỉnh sửa lĩnh vực chỉ dành cho quản trị viên hệ thống.", 403)
            source_field = clean_text((parse_qs(parsed.query).get("key") or [""])[0], 180)
            with DB_LOCK, connect() as con:
                rows = con.execute("SELECT actor_name,reason,before_json,after_json,created_at FROM procedure_category_audit WHERE source_field=? ORDER BY id DESC LIMIT 30", (source_field,)).fetchall()
            return self.send_json({"history": [{"actor": row["actor_name"], "reason": row["reason"], "before": json.loads(row["before_json"]) if row["before_json"] else None, "after": json.loads(row["after_json"]), "createdAt": row["created_at"]} for row in rows]})
        template_route = re.fullmatch(r"/api/procedures/([^/]+)/templates/([^/]+)", path)
        if template_route:
            code, attachment_id = template_route.groups()
            attachment = published_template(code, attachment_id) if code in PROCEDURE_BY_CODE else None
            if not attachment:
                return self.send_error_json("Không tìm thấy mẫu đơn của thủ tục này.", 404)
            try:
                check_public_rate_limit(self.public_address(), "official-template", 60)
                raw, content_type = download_published_template(attachment_id)
            except RateLimitError as exc:
                return self.send_error_json(str(exc), 429)
            except Exception:
                return self.send_error_json("Chưa tải được mẫu đơn từ Cổng quốc gia. Vui lòng thử lại hoặc mở bản công bố gốc.", 502)
            filename = str(attachment.get("fileName") or "mau-don").replace("\\", "/").rsplit("/", 1)[-1]
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(filename, safe='')}")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            self.wfile.write(raw)
            return
        if path.startswith("/api/procedures/") and path.endswith("/detail"):
            code = unquote(path[len("/api/procedures/"):-len("/detail")].strip("/"))
            if not code or "/" in code or code not in PROCEDURE_BY_CODE:
                return self.send_error_json("Không tìm thấy thủ tục.", 404)
            procedure = next(item for item in procedure_catalog_records() if item["sourceCode"] == code)
            return self.send_json({"procedure": procedure, "detail": published_procedure_detail(code)})
        if path == "/api/procedures":
            records = procedure_catalog_records()
            return self.send_json({"procedures": records, "count": len(records)})
        if path == "/api/public/agencies":
            today = datetime.now(TZ).date().isoformat()
            with DB_LOCK, connect() as con:
                rows = con.execute("SELECT DISTINCT agency_scope FROM users WHERE role='intake' AND active=1 AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?) AND trim(agency_scope)!='' AND agency_scope!='Toàn thành phố' COLLATE NOCASE ORDER BY agency_scope COLLATE NOCASE", (today, today)).fetchall()
            return self.send_json({"agencies": [row["agency_scope"] for row in rows]})
        if not path.startswith("/api/"):
            return self.serve_static(path)
        user = self.current_user()
        if not user:
            return self.send_error_json("Bạn cần đăng nhập để truy cập dữ liệu này.", 401)
        if user["must_change_password"]:
            return self.send_error_json("Đổi mật khẩu khởi tạo trước khi tiếp tục.", 403)
        if path == "/api/service-desk":
            try:
                return workflow_extensions.get_records(sys.modules[__name__], self, user)
            except PermissionError as exc:
                return self.send_error_json(str(exc), 403)
        if path == "/api/payments":
            if user["role"] not in {"admin", "finance", "leader"}:
                return self.send_error_json("Chỉ quản trị viên hệ thống, lãnh đạo cơ quan hoặc cán bộ tài chính được xem giao dịch.", 403)
            with DB_LOCK, connect() as con:
                records = con.execute("""SELECT p.*,c.code,c.procedure_code,c.status AS case_status,c.payload_json,c.version AS case_version
                    FROM payment_records p JOIN cases c ON c.id=p.case_id ORDER BY p.id DESC LIMIT 500""").fetchall()
                output = []
                for record in records:
                    case_row = con.execute("SELECT * FROM cases WHERE id=?", (record["case_id"],)).fetchone()
                    if user["role"] in {"finance", "leader"} and not visible_to_user(user, case_row):
                        continue
                    refund = con.execute("SELECT status,reason,requested_by,requested_at,reviewed_by,reviewed_at,review_note,executed_at,execution_reference FROM payment_refunds WHERE transaction_ref=? ORDER BY id DESC LIMIT 1", (record["transaction_ref"],)).fetchone()
                    events = con.execute("SELECT action,actor_name,detail,created_at FROM payment_events WHERE transaction_ref=? ORDER BY id", (record["transaction_ref"],)).fetchall()
                    case_payload = json.loads(record["payload_json"])
                    output.append({"transactionRef": record["transaction_ref"], "caseCode": record["code"], "caseVersion": record["case_version"], "procedureCode": record["procedure_code"], "agency": case_payload.get("agencyScope") or case_payload.get("receivingAgency", ""), "caseStatus": record["case_status"], "amount": record["amount"], "status": record["status"], "basis": record["basis"], "createdAt": record["created_at"], "reconciledAt": record["reconciled_at"], "mode": record["provider_mode"], "method": record["payment_method"], "payerReference": record["payer_reference"], "reconciliationReference": record["reconciliation_reference"], "refund": dict(refund) if refund else None, "events": [dict(event) for event in events]})
                return self.send_json({"payments": output, "mode": "LOCAL_SANDBOX"})
        if path == "/api/news":
            if user["role"] != "admin":
                return self.send_error_json("Chỉ quản trị viên hệ thống được quản lý nội dung cổng thông tin.", 403)
            return self.list_managed_news()
        if path == "/api/bootstrap":
            role = user["role"]
            is_staff = role != "citizen"
            with DB_LOCK, connect() as con:
                rows = con.execute("SELECT * FROM cases ORDER BY created_at DESC").fetchall()
                visible_rows = [r for r in rows if visible_to_user(user, r)]
                cases = [case_dict(con, r, include_internal=is_staff, role=role) for r in visible_rows]
                total_case_records = con.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
                if role == "admin":
                    sample_case_count = con.execute("SELECT COUNT(*) FROM cases WHERE json_extract(payload_json,'$.sampleDatasetVersion')=?", (SAMPLE_DATASET_VERSION,)).fetchone()[0]
                else:
                    sample_case_count = sum(json.loads(r["payload_json"]).get("sampleDatasetVersion") == SAMPLE_DATASET_VERSION for r in visible_rows)
                published_news_count = con.execute("SELECT COUNT(*) FROM news_articles WHERE status='PUBLISHED'").fetchone()[0]
                visible_codes = {r["code"] for r in visible_rows}
                feedback_rows = feedback_for_scope(con, role, visible_codes)
                today = datetime.now(TZ).date().isoformat()
                if role == "intake":
                    all_specialists = con.execute("SELECT id,full_name,role,agency_scope FROM users WHERE active=1 AND role='specialist' AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?) ORDER BY full_name", (today, today)).fetchall()
                    staff = [r for r in all_specialists if same_agency_scope(r["agency_scope"], user["agency_scope"])]
                else:
                    staff = []
            outbox = [{"code": c["code"], "status": c["sync"]["status"], "attempts": c["sync"]["attempts"], "lastError": c["sync"].get("lastError"), "messageId": c["sync"].get("messageId")} for c in cases if c.get("sync", {}).get("status") in {"ERROR", "PENDING"}]
            storage = {"database": "connected", "procedureCount": len(PROCEDURES), "caseRecords": total_case_records if role == "admin" else len(cases), "sampleCaseCount": sample_case_count, "sampleDataVersion": SAMPLE_DATASET_VERSION if sample_case_count else 0, "publishedNews": published_news_count, "caseCountScope": "toàn ứng dụng" if role == "admin" else "phạm vi được cấp"}
            return self.send_json({"user": public_user(user), "procedures": procedure_catalog_records(), "procedureCategories": procedure_category_records(), "cases": cases, "stats": build_stats(cases), "storage": storage, "feedback": rows_to_dicts(feedback_rows), "outbox": outbox, "staff": [{"id": r["id"], "name": r["full_name"], "role": r["role"]} for r in staff], "statusLabels": STATUS_LABELS})
        if path.startswith("/api/cases/") and "/files/" in path:
            user = self.require_user()
            parts = path.split("/")
            if len(parts) != 6 or parts[4] != "files":
                return self.send_error_json("Đường dẫn tài liệu không hợp lệ.", 404)
            return self.serve_case_file(parts[3], parts[5], user)
        if path.startswith("/api/cases/"):
            code = path.rsplit("/", 1)[-1]
            with DB_LOCK, connect() as con:
                row = con.execute("SELECT * FROM cases WHERE code=?", (code,)).fetchone()
                if not row or not visible_to_user(user, row):
                    return self.send_error_json("Không tìm thấy hồ sơ trong phạm vi được phép tra cứu.", 404)
                return self.send_json(case_dict(con, row, include_internal=user["role"] != "citizen", role=user["role"]))
        if path == "/api/export/cases.csv":
            if user["role"] not in STAFF_ROLES - {"admin"}:
                return self.send_error_json("Tài khoản không có quyền thực hiện thao tác này.", 403)
            query = parse_qs(parsed.query)
            agency_filter = clean_text((query.get("agency") or [""])[0], 180)
            status_filter = clean_text((query.get("status") or [""])[0], 40)
            from_date = clean_text((query.get("from") or [""])[0], 10)
            to_date = clean_text((query.get("to") or [""])[0], 10)
            for value in (from_date, to_date):
                if value:
                    try:
                        date.fromisoformat(value)
                    except ValueError as exc:
                        raise ValueError("Ngày lọc phải theo định dạng YYYY-MM-DD.") from exc
            if from_date and to_date and to_date < from_date:
                raise ValueError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.")
            if agency_filter and user["agency_scope"].strip().casefold() != "toàn thành phố" and agency_filter.casefold() != user["agency_scope"].strip().casefold():
                return self.send_error_json("Không thể xuất dữ liệu ngoài phạm vi cơ quan được cấp.", 403)
            with DB_LOCK, connect() as con:
                rows = con.execute("SELECT * FROM cases ORDER BY created_at DESC").fetchall()
                rows = [r for r in rows if visible_to_user(user, r)]
            filtered_rows = []
            for row in rows:
                data = json.loads(row["payload_json"])
                agency = clean_text(data.get("agencyScope") or data.get("receivingAgency"), 180)
                created_day = row["created_at"][:10]
                if agency_filter and agency.casefold() != agency_filter.casefold():
                    continue
                if status_filter and row["status"] != status_filter:
                    continue
                if from_date and created_day < from_date:
                    continue
                if to_date and created_day > to_date:
                    continue
                filtered_rows.append((row, data, agency))
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Mã hồ sơ", "Mã thủ tục", "Trạng thái", "Người nộp", "Cơ quan tiếp nhận", "Ngày gửi", "Hạn giải quyết", "Đồng bộ"])
            for r, data, agency in filtered_rows:
                applicant_name = "" if user["role"] == "finance" else csv_safe(data.get("applicant", {}).get("name"))
                writer.writerow([r["code"], r["procedure_code"], STATUS_LABELS.get(r["status"], r["status"]), applicant_name, csv_safe(agency), r["created_at"], data.get("deadline") or "", data.get("sync", {}).get("status")])
            raw = ("\ufeff" + output.getvalue()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=hanoi-cases.csv")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            return self.wfile.write(raw)
        if path == "/api/export/users.csv":
            if not can_manage_staff_accounts(user):
                return self.send_error_json("Tài khoản không có quyền xuất danh sách cán bộ.", 403)
            query = parse_qs(parsed.query)
            agency_filter = clean_text((query.get("agency") or [""])[0], 180)
            manager_scope = user["agency_scope"].strip()
            if user["role"] != "admin":
                if not manager_scope or manager_scope.casefold() == "toàn thành phố":
                    return self.send_error_json("Tài khoản quản lý cơ quan chưa có phạm vi cơ quan cụ thể.", 403)
                if agency_filter and agency_filter.casefold() != manager_scope.casefold():
                    return self.send_error_json("Không thể xuất tài khoản ngoài cơ quan đang được giao quản lý.", 403)
                agency_filter = manager_scope
            with DB_LOCK, connect() as con:
                if agency_filter:
                    rows = con.execute("SELECT full_name,email,phone,role,active,agency_scope,valid_from,valid_until,can_manage_agency_accounts,created_at FROM users WHERE role!='citizen' AND agency_scope=? COLLATE NOCASE ORDER BY full_name COLLATE NOCASE", (agency_filter,)).fetchall()
                else:
                    rows = con.execute("SELECT full_name,email,phone,role,active,agency_scope,valid_from,valid_until,can_manage_agency_accounts,created_at FROM users WHERE role!='citizen' ORDER BY agency_scope COLLATE NOCASE,full_name COLLATE NOCASE").fetchall()
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Họ tên", "Email", "Điện thoại", "Vai trò", "Trạng thái", "Cơ quan", "Hiệu lực từ", "Hiệu lực đến", "Quản lý tài khoản cơ quan", "Ngày tạo"])
            for row in rows:
                writer.writerow([csv_safe(row["full_name"]), csv_safe(row["email"]), csv_safe(row["phone"]), ROLE_LABELS.get(row["role"], row["role"]), "Đang hoạt động" if row["active"] else "Chưa hiệu lực / tạm ngưng", csv_safe(row["agency_scope"]), row["valid_from"], row["valid_until"], "Có" if row["can_manage_agency_accounts"] else "Không", row["created_at"]])
            raw = ("\ufeff" + output.getvalue()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=danh-sach-tai-khoan-can-bo.csv")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            return self.wfile.write(raw)
        if path in {"/api/reporting/summary", "/api/reporting/summary.csv"}:
            if user["role"] != "admin":
                return self.send_error_json("Báo cáo tổng hợp toàn hệ thống chỉ dành cho quản trị viên hệ thống.", 403)
            query = parse_qs(parsed.query)
            agency_filter = clean_text((query.get("agency") or [""])[0], 180)
            from_date = clean_text((query.get("from") or [""])[0], 10)
            to_date = clean_text((query.get("to") or [""])[0], 10)
            for value in (from_date, to_date):
                if value:
                    try:
                        date.fromisoformat(value)
                    except ValueError as exc:
                        raise ValueError("Ngày lọc phải theo định dạng YYYY-MM-DD.") from exc
            if from_date and to_date and to_date < from_date:
                raise ValueError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.")
            with DB_LOCK, connect() as con:
                agencies = [r["agency_scope"] for r in con.execute("SELECT DISTINCT agency_scope FROM users WHERE role!='citizen' AND trim(agency_scope)!='' AND agency_scope!='Toàn thành phố' COLLATE NOCASE ORDER BY agency_scope COLLATE NOCASE").fetchall()]
                rows = con.execute("SELECT code,procedure_code,status,created_at,payload_json FROM cases ORDER BY created_at").fetchall()
            if agency_filter and agency_filter.casefold() not in {value.casefold() for value in agencies}:
                return self.send_error_json("Cơ quan cần lọc không có trong danh sách phân quyền.", 400)
            by_agency: dict[str, int] = {}
            by_status: dict[str, int] = {}
            by_procedure: dict[str, int] = {}
            by_agency_status: dict[tuple[str, str], int] = {}
            total = 0
            sample_total = 0
            for row in rows:
                day = row["created_at"][:10]
                if from_date and day < from_date or to_date and day > to_date:
                    continue
                payload = json.loads(row["payload_json"])
                agency = clean_text(payload.get("agencyScope") or payload.get("receivingAgency"), 180) or "Chưa xác định cơ quan"
                if agency_filter and agency.casefold() != agency_filter.casefold():
                    continue
                total += 1
                if payload.get("sampleDatasetVersion") == SAMPLE_DATASET_VERSION:
                    sample_total += 1
                by_agency[agency] = by_agency.get(agency, 0) + 1
                status = STATUS_LABELS.get(row["status"], row["status"])
                by_status[status] = by_status.get(status, 0) + 1
                procedure = f"{row['procedure_code']} · {clean_text((payload.get('procedure') or {}).get('name'), 180)}"
                by_procedure[procedure] = by_procedure.get(procedure, 0) + 1
                key = (agency, status)
                by_agency_status[key] = by_agency_status.get(key, 0) + 1
            report = {"reportKind": "INTERNAL_OPERATIONS", "officialForm": False, "agency": agency_filter or "Tất cả cơ quan", "from": from_date, "to": to_date, "total": total, "sampleTotal": sample_total, "realTotal": total - sample_total, "storedTotal": len(rows), "agencies": agencies,
                "byAgency": [{"name": name, "count": count} for name, count in sorted(by_agency.items())],
                "byStatus": [{"name": name, "count": count} for name, count in sorted(by_status.items(), key=lambda item: (-item[1], item[0]))],
                "byProcedure": [{"name": name, "count": count} for name, count in sorted(by_procedure.items(), key=lambda item: (-item[1], item[0]))],
                "byAgencyStatus": [{"agency": agency, "status": status, "count": count} for (agency, status), count in sorted(by_agency_status.items())]}
            if path.endswith(".csv"):
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["Báo cáo vận hành nội bộ - không phải biểu mẫu báo cáo pháp định", ""])
                writer.writerow(["Cơ quan lọc", report["agency"]])
                writer.writerow(["Từ ngày", from_date, "Đến ngày", to_date])
                writer.writerow(["Tình huống mô phỏng", report["sampleTotal"], "Hồ sơ phát sinh thật trong ứng dụng", report["realTotal"]])
                writer.writerow([])
                writer.writerow(["Cơ quan tiếp nhận", "Trạng thái", "Số hồ sơ"])
                for item in report["byAgencyStatus"]:
                    writer.writerow([csv_safe(item["agency"]), item["status"], item["count"]])
                raw = ("\ufeff" + output.getvalue()).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/csv; charset=utf-8")
                self.send_header("Content-Disposition", "attachment; filename=bao-cao-van-hanh-noi-bo.csv")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                return self.wfile.write(raw)
            return self.send_json(report)
        if path == "/api/users":
            if not can_manage_staff_accounts(user):
                return self.send_error_json("Tài khoản không có quyền quản lý tài khoản cán bộ.", 403)
            manager_scope = user["agency_scope"].strip()
            if user["role"] != "admin" and (not manager_scope or manager_scope.casefold() == "toàn thành phố"):
                return self.send_error_json("Tài khoản quản lý cơ quan chưa có phạm vi cơ quan cụ thể.", 403)
            with DB_LOCK, connect() as con:
                agency_clause = " AND agency_scope=? COLLATE NOCASE" if user["role"] != "admin" else ""
                rows = con.execute("SELECT id,email,phone,full_name,role,active,email_verified,agency_scope,valid_from,valid_until,may_sign_stop,signing_authority_ref,must_change_password,can_manage_agency_accounts,created_at FROM users WHERE role!='citizen'" + agency_clause + " ORDER BY created_at DESC", (manager_scope,) if agency_clause else ()).fetchall()
                requests = con.execute("""SELECT r.*,u.email,u.full_name,requester.full_name AS requester_name,reviewer.full_name AS reviewer_name
                    FROM staff_access_requests r JOIN users u ON u.id=r.user_id
                    JOIN users requester ON requester.id=r.requested_by
                    LEFT JOIN users reviewer ON reviewer.id=r.reviewed_by
                    WHERE (?='admin' OR r.agency_scope=? COLLATE NOCASE)
                    ORDER BY CASE r.status WHEN 'PENDING' THEN 0 ELSE 1 END,r.created_at DESC""", (user["role"], manager_scope)).fetchall()
                account_changes = con.execute("""SELECT c.*,u.email,u.full_name,requester.full_name AS requester_name,reviewer.full_name AS reviewer_name
                    FROM staff_account_changes c JOIN users u ON u.id=c.user_id
                    JOIN users requester ON requester.id=c.requested_by
                    LEFT JOIN users reviewer ON reviewer.id=c.reviewed_by
                    WHERE (?='admin' OR u.agency_scope=? COLLATE NOCASE)
                    ORDER BY CASE c.status WHEN 'PENDING' THEN 0 ELSE 1 END,c.created_at DESC""", (user["role"], manager_scope)).fetchall()
            return self.send_json({
                "users": [{"id": r["id"], "email": r["email"], "phone": r["phone"], "name": r["full_name"], "role": r["role"], "active": bool(r["active"]), "emailVerified": False, "agencyScope": r["agency_scope"], "validFrom": r["valid_from"], "validUntil": r["valid_until"], "maySignStop": bool(r["may_sign_stop"]), "signingAuthorityRef": r["signing_authority_ref"], "mustChangePassword": bool(r["must_change_password"]), "canManageAgencyAccounts": bool(r["can_manage_agency_accounts"]), "createdAt": r["created_at"]} for r in rows],
                "accessRequests": [{"id": r["id"], "userId": r["user_id"], "email": r["email"], "name": r["full_name"], "requestedBy": r["requester_name"], "requestedById": r["requested_by"], "role": r["role"], "agencyScope": r["agency_scope"], "validFrom": r["valid_from"], "validUntil": r["valid_until"], "maySignStop": bool(r["requested_sign_stop"]), "signingAuthorityRef": r["signing_authority_ref"], "reason": r["reason"], "status": r["status"], "reviewedBy": r["reviewer_name"], "reviewNote": r["review_note"], "createdAt": r["created_at"], "reviewedAt": r["reviewed_at"]} for r in requests],
                "accountChanges": [{"id": r["id"], "userId": r["user_id"], "email": r["email"], "name": r["full_name"], "requestedBy": r["requester_name"], "requestedById": r["requested_by"], "before": json.loads(r["before_json"]), "proposed": json.loads(r["proposed_json"]), "reason": r["reason"], "status": r["status"], "reviewedBy": r["reviewer_name"], "reviewNote": r["review_note"], "createdAt": r["created_at"], "reviewedAt": r["reviewed_at"]} for r in account_changes],
            })
        return self.send_error_json("Không tìm thấy API.", 404)

    def serve_static(self, path: str):
        # Procedure codes contain dots, but detail routes are still SPA pages.
        is_procedure_page = re.fullmatch(r"/thu-tuc/[^/]+/?", path) is not None
        rel = "index.html" if path in {"", "/"} or is_procedure_page else path.lstrip("/")
        frontend_root = ROOT / "frontend" / "dist"
        if not (frontend_root / "index.html").is_file():
            return self.send_error_json("Giao diện chưa được biên dịch. Hãy chạy frontend\\npm run build.", 503)
        base = frontend_root.resolve()
        target = (base / rel).resolve()
        try:
            target.relative_to(base)
        except ValueError:
            return self.send_error_json("Đường dẫn không hợp lệ.", 403)
        if base == frontend_root.resolve() and not target.is_file() and not Path(rel).suffix:
            target = base / "index.html"
        if not target.is_file():
            return self.send_error_json("Không tìm thấy tệp.", 404)
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if target.suffix in {".html", ".css", ".js"}:
            content_type += "; charset=utf-8"
        raw = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        # SPA routes (including /staff) serve index.html. Keep that entry point
        # fresh so a launcher rebuild cannot leave browsers with an old bundle
        # reference and an empty React root; Vite's fingerprinted assets are safe
        # to cache for a long time.
        if target.name == "index.html":
            self.send_header("Cache-Control", "no-store, max-age=0")
        elif re.search(r"\.[A-Za-z0-9_-]{8,}\.(?:js|css)$", target.name):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        try:
            body = self.read_json()
            if not isinstance(body, dict):
                raise ValueError("Nội dung yêu cầu phải là một đối tượng JSON.")
            if path == "/api/auth/register":
                return self.send_json({"error": "Cổng Hà Nội không tạo tài khoản công dân. Vui lòng thực hiện giao dịch trên Cổng Dịch vụ công quốc gia.", "portal": "https://dichvucong.gov.vn/"}, 410)
            if path == "/api/auth/login":
                return self.login_account(body)
            if path == "/api/auth/logout":
                user = self.current_user()
                if user:
                    self.require_csrf(user)
                    jar = SimpleCookie()
                    jar.load(self.headers.get("Cookie", ""))
                    token = jar.get(SESSION_COOKIE).value if jar.get(SESSION_COOKIE) else ""
                    with DB_LOCK, connect() as con:
                        con.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(token.encode("ascii", errors="ignore")).hexdigest(),))
                return self.send_json({"ok": True}, headers={"Set-Cookie": self.session_cookie("", 0)})
            if path in {"/api/public/appointments", "/api/public/pakn"}:
                return workflow_extensions.create_public(sys.modules[__name__], self, path.rsplit("/", 1)[-1], body)
            if path == "/api/public/service-lookup":
                return workflow_extensions.lookup_public(sys.modules[__name__], self, body)
            if path == "/api/cases":
                return self.create_public_case(body)
            if path == "/api/public/cases/lookup":
                return self.lookup_public_case(body)
            if path.startswith("/api/public/cases/") and path.endswith("/actions"):
                code = path[len("/api/public/cases/"):-len("/actions")].strip("/")
                if not code or "/" in code:
                    return self.send_error_json("Không tìm thấy hồ sơ.", 404)
                return self.public_case_action(code, body)
            user = self.require_user()
            self.require_csrf(user)
            if path == "/api/auth/change-password":
                return self.change_password(body, user)
            if user["must_change_password"]:
                raise PermissionError("Đổi mật khẩu khởi tạo trước khi tiếp tục.")
            if path == "/api/service-desk/update":
                return workflow_extensions.update_record(sys.modules[__name__], self, user, body)
            if path == "/api/cases/counter":
                return workflow_extensions.create_counter_case(sys.modules[__name__], self, user, body)
            if path.startswith("/api/procedures/") and path.endswith("/edit"):
                code = path[len("/api/procedures/"):-len("/edit")].strip("/")
                if not code or "/" in code:
                    return self.send_error_json("Mã thủ tục không hợp lệ.", 400)
                return self.save_procedure_catalog_edit(code, body, user)
            if path == "/api/procedure-categories/edit":
                return self.save_procedure_category_edit(body, user)
            if path == "/api/procedure-categories/create":
                return self.create_procedure_category(body, user)
            if path == "/api/procedure-categories/move":
                return self.move_procedures_to_category(body, user)
            if path == "/api/auth/contact":
                return self.update_personal_contact(body, user)
            if path == "/api/auth/revoke-other-sessions":
                return self.revoke_other_sessions(user)
            if path == "/api/news":
                return self.save_managed_news(body, user)
            if path == "/api/sandbox-signers":
                return self.manage_sandbox_signer(body, user)
            if path.startswith("/api/payments/"):
                parts = path.strip("/").split("/")
                if len(parts) != 4 or parts[0] != "api" or parts[1] != "payments":
                    return self.send_error_json("Đường dẫn giao dịch không hợp lệ.", 404)
                return self.manage_payment(unquote(parts[2]), parts[3], body, user)
            if path == "/api/users":
                if not can_manage_staff_accounts(user):
                    return self.send_error_json("Tài khoản không có quyền lập đề nghị cấp tài khoản cán bộ.", 403)
                return self.create_staff_account(body, user)
            if path.startswith("/api/users/access-requests/") and path.endswith("/review"):
                request_id = path.split("/")[-2]
                if user["role"] != "admin":
                    return self.send_error_json("Chỉ quản trị viên mới được duyệt quyền cán bộ.", 403)
                return self.review_staff_access(request_id, body, user)
            if path.startswith("/api/users/account-changes/") and path.endswith("/review"):
                request_id = path.split("/")[-2]
                if user["role"] != "admin":
                    return self.send_error_json("Chỉ quản trị viên mới được duyệt thay đổi tài khoản.", 403)
                return self.review_staff_account_change(request_id, body, user)
            if path.startswith("/api/users/") and path.endswith("/change-requests"):
                if not can_manage_staff_accounts(user):
                    return self.send_error_json("Tài khoản không có quyền đề nghị thay đổi tài khoản cán bộ.", 403)
                target_id = path[len("/api/users/"):-len("/change-requests")].strip("/")
                return self.request_staff_account_change(target_id, body, user)
            if path.startswith("/api/users/") and path.endswith("/stop-signature-authority"):
                if user["role"] != "admin":
                    return self.send_error_json("Chỉ quản trị viên mới được thu hồi quyền ký.", 403)
                target_id = path[len("/api/users/"):-len("/stop-signature-authority")].strip("/")
                return self.revoke_stop_signing(target_id, body, user)
            if path.startswith("/api/cases/") and path.endswith("/actions"):
                code = path.split("/")[-2]
                return self.case_action(code, body, user)
            if path.startswith("/api/cases/") and path.endswith("/lookup-key"):
                code = path.split("/")[-2]
                return self.staff_lookup_key(code, body, user)
            return self.send_error_json("Không tìm thấy API.", 404)
        except RateLimitError as exc:
            return self.send_error_json(str(exc), 429)
        except AuthenticationError as exc:
            return self.send_error_json(str(exc), 401)
        except PermissionError as exc:
            return self.send_error_json(str(exc), 403)
        except RuntimeError as exc:
            return self.send_error_json(str(exc), 409)
        except (ValueError, json.JSONDecodeError) as exc:
            return self.send_error_json(str(exc) or "Dữ liệu gửi lên không hợp lệ.", 422)
        except Exception as exc:
            print("Request failed:", repr(exc))
            traceback.print_exc()
            return self.send_error_json("Có lỗi nội bộ. Dữ liệu trước đó vẫn được giữ.", 500)

    def staff_lookup_key(self, code: str, body: dict, user: sqlite3.Row):
        if user["role"] not in {"intake", "registrar"}:
            raise PermissionError("Chỉ cán bộ tiếp nhận và trả kết quả được quản lý khóa tra cứu.")
        with DB_LOCK, connect() as con:
            row = con.execute("SELECT * FROM cases WHERE code=?", (code,)).fetchone()
            if not row or not visible_to_user(user, row):
                return self.send_error_json("Không tìm thấy hồ sơ trong phạm vi được phép.", 404)
            action = body.get("action")
            if action not in {"reveal", "rotate"}:
                raise ValueError("Thao tác khóa tra cứu không hợp lệ.")
            secret = con.execute("SELECT encrypted_key FROM case_lookup_secrets WHERE case_id=?", (row["id"],)).fetchone()
            if action == "rotate":
                if body.get("expectedVersion") != row["version"]:
                    raise RuntimeError("Hồ sơ đã thay đổi. Hãy mở lại trước khi cấp khóa mới.")
                key = secrets.token_hex(32)
                con.execute("INSERT INTO case_lookup_secrets(case_id,encrypted_key,updated_at) VALUES(?,?,?) ON CONFLICT(case_id) DO UPDATE SET encrypted_key=excluded.encrypted_key,updated_at=excluded.updated_at", (row["id"], lookup_cipher().encrypt(key.encode("ascii")), now_iso()))
                con.execute("UPDATE cases SET owner_id=?,version=version+1,updated_at=? WHERE id=?", (hashlib.sha256(key.encode("ascii")).hexdigest(), now_iso(), row["id"]))
            else:
                if not secret:
                    return self.send_error_json("Hồ sơ cũ chỉ lưu mã băm. Cần cấp lại khóa tra cứu.", 409)
                key = lookup_cipher().decrypt(secret["encrypted_key"]).decode("ascii")
            add_event(con, row["id"], user["role"], user["full_name"], "lookup_key_" + action, "Đã xem khóa tra cứu" if action == "reveal" else "Đã cấp lại khóa tra cứu", "Thao tác của cán bộ được phân quyền; không ghi nội dung khóa vào nhật ký.", "internal")
            return self.send_json({"code": code, "accessKey": key, "version": row["version"] + (1 if action == "rotate" else 0)})

    def manage_sandbox_signer(self, body: dict, user: sqlite3.Row):
        if user["role"] != "admin":
            return self.send_error_json("Chỉ quản trị viên hệ thống được cấp hoặc thu hồi quyền ký thử nghiệm.", 403)
        target_id = clean_text(body.get("userId"), 80)
        action = clean_text(body.get("action"), 20).lower()
        reason = clean_text(body.get("reason"), 1200)
        if action not in {"grant", "revoke"} or len(reason) < 12:
            raise ValueError("Chọn cấp/thu hồi quyền và ghi lý do tối thiểu 12 ký tự.")
        with DB_LOCK, connect() as con:
            target = con.execute("SELECT * FROM users WHERE id=? AND role='leader'", (target_id,)).fetchone()
            if not target or not target["active"]:
                raise ValueError("Chỉ cấp quyền cho tài khoản lãnh đạo đang hoạt động.")
            today = datetime.now(TZ).date().isoformat()
            if (target["valid_from"] and today < target["valid_from"]) or (target["valid_until"] and today > target["valid_until"]):
                raise ValueError("Tài khoản lãnh đạo chưa có hiệu lực hoặc đã hết hiệu lực.")
            current = con.execute("SELECT * FROM sandbox_signing_authorities WHERE user_id=?", (target_id,)).fetchone()
            if action == "grant":
                authority_ref = clean_text(body.get("authorityRef"), 180)
                if len(authority_ref) < 4:
                    raise ValueError("Ghi số quyết định/văn bản làm căn cứ cấp quyền ký thử nghiệm.")
                con.execute("""INSERT INTO sandbox_signing_authorities(user_id,granted_by,authority_ref,reason,active,granted_at,revoked_at)
                    VALUES(?,?,?,?,1,?,NULL) ON CONFLICT(user_id) DO UPDATE SET granted_by=excluded.granted_by,authority_ref=excluded.authority_ref,reason=excluded.reason,active=1,granted_at=excluded.granted_at,revoked_at=NULL""",
                    (target_id, user["id"], authority_ref, reason, now_iso()))
                event_ref = authority_ref
                message = "Đã cấp quyền ký thử nghiệm trong ứng dụng. Đây không phải quyền ký số công vụ."
            else:
                if not current or not current["active"]:
                    raise ValueError("Tài khoản này không có quyền ký thử nghiệm đang hoạt động.")
                event_ref = current["authority_ref"]
                con.execute("UPDATE sandbox_signing_authorities SET active=0,revoked_at=?,reason=? WHERE user_id=?", (now_iso(), reason, target_id))
                message = "Đã thu hồi quyền ký thử nghiệm; tài khoản không thể ký thêm kết quả."
            con.execute("INSERT INTO sandbox_signing_authority_events(user_id,actor_id,action,authority_ref,reason,created_at) VALUES(?,?,?,?,?,?)", (target_id, user["id"], action.upper(), event_ref, reason, now_iso()))
            return self.send_json({"ok": True, "message": message})

    def manage_payment(self, transaction_ref: str, action: str, body: dict, user: sqlite3.Row):
        if user["role"] not in {"finance", "leader"}:
            return self.send_error_json("Thao tác giao dịch chỉ dành cho cán bộ tài chính hoặc lãnh đạo cơ quan được cấp quyền.", 403)
        if action not in {"reconcile", "refund-request", "refund-review", "refund-execute"}:
            return self.send_error_json("Thao tác giao dịch không được hỗ trợ.", 404)
        with DB_LOCK, connect() as con:
            payment = con.execute("SELECT * FROM payment_records WHERE transaction_ref=?", (transaction_ref,)).fetchone()
            if not payment:
                return self.send_error_json("Không tìm thấy giao dịch.", 404)
            case_row = con.execute("SELECT * FROM cases WHERE id=?", (payment["case_id"],)).fetchone()
            if not visible_to_user(user, case_row):
                return self.send_error_json("Không tìm thấy giao dịch trong phạm vi tài khoản.", 404)
            case = json.loads(case_row["payload_json"])
            if action == "reconcile":
                if payment["status"] == "RECONCILED":
                    return self.send_json({"ok": True, "message": "Giao dịch đã được đối soát trước đó."})
                if payment["status"] != "PAID":
                    raise ValueError("Chỉ giao dịch đã được xác nhận thanh toán mới được đối soát.")
                expected = body.get("expectedVersion")
                if type(expected) is not int or expected != case_row["version"]:
                    raise RuntimeError("Hồ sơ vừa thay đổi; hãy tải lại dữ liệu giao dịch.")
                statement_reference = clean_text(body.get("statementReference"), 180)
                if len(statement_reference) < 4:
                    raise ValueError("Nhập số chứng từ thu hoặc dòng đối chiếu trong sổ quỹ/bảng kê.")
                changed_payment = con.execute("UPDATE payment_records SET status='RECONCILED',provider_mode='LOCAL_RECONCILED',reconciled_at=?,reconciliation_reference=? WHERE transaction_ref=? AND status='PAID'", (now_iso(), statement_reference, transaction_ref))
                if changed_payment.rowcount != 1:
                    raise RuntimeError("Giao dịch vừa thay đổi; hãy tải lại danh sách trước khi đối soát.")
                payment_event(con, transaction_ref, user["id"], user["full_name"], "RECONCILED", f"Đã kiểm tra chứng từ người nộp khai và ghi dòng đối chiếu nội bộ: {statement_reference}.", transaction_ref)
                fee = case.get("fee") or {}
                fee.update({"status": "RECONCILED", "paymentStatus": "RECONCILED", "reconciledAt": now_iso(), "reconciledBy": user["full_name"], "reconciliationReference": statement_reference})
                case["fee"] = fee
                case["updatedAt"] = now_iso()
                changed_case = con.execute("UPDATE cases SET payload_json=?,updated_at=?,version=version+1 WHERE id=? AND version=?", (json.dumps(case, ensure_ascii=False), now_iso(), case_row["id"], expected))
                if changed_case.rowcount != 1:
                    raise RuntimeError("Hồ sơ vừa được cập nhật; hãy tải lại trước khi đối soát.")
                add_event(con, case_row["id"], "finance", user["full_name"], "reconcile", "Đã đối soát giao dịch thử nghiệm", f"{transaction_ref}; chỉ đối soát trong ứng dụng.", "internal")
                return self.send_json({"ok": True, "message": "Đã đối soát giao dịch nội bộ."})
            if action == "refund-request":
                if payment["status"] != "RECONCILED":
                    raise ValueError("Chỉ đề nghị hoàn giao dịch đã đối soát.")
                terminal = case_row["status"] in {"DUNG", "TU_CHOI", "KHONG_GIAI_QUYET"} or (case.get("withdrawal") or {}).get("status") == "DA_PHAT_HANH"
                if not terminal:
                    raise ValueError("Chỉ xem xét hoàn khi hồ sơ đã dừng, bị từ chối/không giải quyết hoặc có Thông báo dừng đã phát hành.")
                if con.execute("SELECT 1 FROM payment_refunds WHERE transaction_ref=? AND status IN ('PENDING','APPROVED')", (transaction_ref,)).fetchone():
                    raise ValueError("Đã có đề nghị hoàn đang chờ xem xét hoặc chờ thực hiện.")
                reason = clean_text(body.get("reason"), 1200)
                if len(reason) < 12: raise ValueError("Nêu căn cứ đề nghị hoàn khoản thu.")
                con.execute("INSERT INTO payment_refunds(transaction_ref,reason,status,requested_by,requested_at) VALUES(?,?,'PENDING',?,?)", (transaction_ref, reason, user["id"], now_iso()))
                payment_event(con, transaction_ref, user["id"], user["full_name"], "REFUND_REQUESTED", reason)
                add_event(con, case_row["id"], "finance", user["full_name"], "refund_request", "Đã lập đề nghị hoàn thử nghiệm", reason, "internal")
                return self.send_json({"ok": True, "message": "Đã lập đề nghị hoàn trong ứng dụng; chưa gửi tới ngân hàng hoặc nhà cung cấp."})
            refund = con.execute("SELECT * FROM payment_refunds WHERE transaction_ref=? AND status='PENDING' ORDER BY id DESC LIMIT 1", (transaction_ref,)).fetchone()
            if action == "refund-execute":
                refund = con.execute("SELECT * FROM payment_refunds WHERE transaction_ref=? AND status='APPROVED' ORDER BY id DESC LIMIT 1", (transaction_ref,)).fetchone()
                if not refund:
                    raise ValueError("Chỉ ghi nhận chi hoàn sau khi đề nghị đã được phê duyệt.")
                if payment["status"] != "RECONCILED":
                    raise ValueError("Trạng thái khoản thu đã thay đổi; không thể ghi nhận chi hoàn.")
                execution_reference = clean_text(body.get("executionReference"), 180)
                if len(execution_reference) < 4:
                    raise ValueError("Nhập số ủy nhiệm chi, mã giao dịch hoàn hoặc chứng từ chi hoàn.")
                changed_refund = con.execute("UPDATE payment_refunds SET status='EXECUTED',executed_at=?,execution_reference=? WHERE id=? AND status='APPROVED'", (now_iso(), execution_reference, refund["id"]))
                if changed_refund.rowcount != 1:
                    raise RuntimeError("Đề nghị hoàn vừa được cập nhật ở phiên khác; hãy tải lại.")
                changed_payment = con.execute("UPDATE payment_records SET status='REFUNDED' WHERE transaction_ref=? AND status='RECONCILED'", (transaction_ref,))
                if changed_payment.rowcount != 1:
                    raise RuntimeError("Khoản thu vừa thay đổi; không thể ghi nhận hoàn trả.")
                fee = case.get("fee") or {}
                fee.update({"status": "REFUNDED", "refundStatus": "EXECUTED", "refundedAt": now_iso(), "refundReference": execution_reference})
                case["fee"] = fee
                case["updatedAt"] = now_iso()
                expected = body.get("expectedVersion")
                if type(expected) is not int or expected != case_row["version"]:
                    raise RuntimeError("Hồ sơ vừa thay đổi; hãy tải lại dữ liệu giao dịch trước khi ghi nhận hoàn.")
                changed_case = con.execute("UPDATE cases SET payload_json=?,updated_at=?,version=version+1 WHERE id=? AND version=?", (json.dumps(case, ensure_ascii=False), now_iso(), case_row["id"], expected))
                if changed_case.rowcount != 1:
                    raise RuntimeError("Hồ sơ vừa được cập nhật; hãy tải lại trước khi ghi nhận hoàn.")
                payment_event(con, transaction_ref, user["id"], user["full_name"], "REFUND_EXECUTED", f"Đã ghi nhận chứng từ chi hoàn: {execution_reference}.", transaction_ref)
                add_event(con, case_row["id"], "finance", user["full_name"], "refund_execute", "Đã ghi nhận chứng từ thực hiện hoàn trả", f"Chứng từ chi hoàn: {execution_reference}.", "internal")
                return self.send_json({"ok": True, "message": "Đã ghi nhận chứng từ thực hiện hoàn trả."})
            if not refund:
                raise ValueError("Không có đề nghị hoàn đang chờ xem xét.")
            if refund["requested_by"] == user["id"]:
                raise PermissionError("Người lập đề nghị hoàn không được tự duyệt đề nghị đó.")
            decision = clean_text(body.get("decision"), 20).upper()
            note = clean_text(body.get("note"), 1200)
            if decision not in {"APPROVE", "REJECT"} or len(note) < 8:
                raise ValueError("Chọn duyệt/từ chối và ghi ý kiến xem xét tối thiểu 8 ký tự.")
            if payment["status"] != "RECONCILED":
                raise ValueError("Giao dịch đã thay đổi trạng thái; không thể duyệt hoàn.")
            next_refund_status = "APPROVED" if decision == "APPROVE" else "REJECTED"
            changed_refund = con.execute("UPDATE payment_refunds SET status=?,reviewed_by=?,reviewed_at=?,review_note=? WHERE id=? AND status='PENDING'", (next_refund_status, user["id"], now_iso(), note, refund["id"]))
            if changed_refund.rowcount != 1:
                raise RuntimeError("Đề nghị hoàn vừa được xử lý ở phiên khác; hãy tải lại.")
            if decision == "APPROVE":
                expected = body.get("expectedVersion")
                if type(expected) is not int or expected != case_row["version"]:
                    raise RuntimeError("Hồ sơ vừa thay đổi; hãy tải lại dữ liệu giao dịch trước khi duyệt hoàn.")
            payment_event(con, transaction_ref, user["id"], user["full_name"], "REFUND_" + next_refund_status, note)
            add_event(con, case_row["id"], "finance", user["full_name"], "refund_review", "Đã " + ("duyệt" if decision == "APPROVE" else "từ chối") + " đề nghị hoàn thử nghiệm", note, "internal")
            return self.send_json({"ok": True, "message": "Đã ghi nhận kết quả xem xét hoàn trong ứng dụng; không chuyển tiền thật."})

    def case_action(self, code: str, body: dict, user: sqlite3.Row):
        role, actor = actor_info(body, user)
        if role not in STAFF_ROLES:
            return self.send_error_json("Vai trò tài khoản không hợp lệ.", 403)
        with DB_LOCK, connect() as con:
            row = con.execute("SELECT * FROM cases WHERE code=?", (code,)).fetchone()
            if not row:
                return self.send_error_json("Không tìm thấy hồ sơ.", 404)
            if not visible_to_user(user, row):
                return self.send_error_json("Không tìm thấy hồ sơ trong phạm vi được phép tra cứu.", 404)
            case_dir = (UPLOAD_DIR / row["code"]).resolve()
            case_dir.relative_to(UPLOAD_DIR.resolve())
            existing_files = {path.resolve() for path in case_dir.iterdir() if path.is_file()} if case_dir.exists() else set()
            try:
                apply_action(con, row, {**body, "role": role, "actor": actor, "userId": user["id"], "maySignStop": bool(user["may_sign_stop"]), "signingAuthorityRef": user["signing_authority_ref"]})
            except Exception:
                if case_dir.exists():
                    for path in case_dir.iterdir():
                        if path.is_file() and path.resolve() not in existing_files:
                            path.unlink(missing_ok=True)
                    if not any(case_dir.iterdir()):
                        case_dir.rmdir()
                raise
            fresh = con.execute("SELECT * FROM cases WHERE id=?", (row["id"],)).fetchone()
            return self.send_json(case_dict(con, fresh, include_internal=True, role=role))


def main() -> None:
    init_db()
    if len(sys.argv) > 1:
        if sys.argv[1] == "create-admin":
            create_operator_account()
            return
        if sys.argv[1] == "create-staff":
            raise SystemExit("Tài khoản nghiệp vụ được đề nghị trong mục Tài khoản và cần quản trị viên khác duyệt.")
    bind_host = os.environ.get("HANOI_BIND_HOST", "127.0.0.1")
    server = ThreadingHTTPServer((bind_host, PORT), AppHandler)
    print(f"Hanoi public services system: http://{bind_host}:{PORT}")
    print(f"Loaded {len(PROCEDURES):,} procedure references. Persistent SQLite storage is ready.")
    print("Press Ctrl+C to stop the local server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


def create_operator_account() -> None:
    role = "admin"
    name = clean_text(input("Full name: "), 150)
    if len(name) < 2:
        raise SystemExit("A full name is required.")
    email = normalize_email(input("Email: "))
    password = getpass("Password (12+ chars, upper/lowercase and digit): ")
    validate_password(password)
    confirmation = getpass("Confirm password: ")
    if not hmac.compare_digest(password, confirmation):
        raise SystemExit("Passwords do not match.")
    salt = secrets.token_bytes(16)
    user_id = str(uuid.uuid4())
    with DB_LOCK, connect() as con:
        try:
            con.execute("INSERT INTO users(id,email,phone,full_name,password_salt,password_hash,role,active,email_verified,agency_scope,valid_from,valid_until,created_at,updated_at) VALUES(?,?, '', ?,?,?,?,1,0,'Toàn thành phố','','',?,?)", (user_id, email, name, salt.hex(), password_hash(password, salt).hex(), role, now_iso(), now_iso()))
        except sqlite3.IntegrityError as exc:
            raise SystemExit("An account with that email already exists.") from exc
    print(f"Created {role} account for {email}.")


if __name__ == "__main__":
    main()
