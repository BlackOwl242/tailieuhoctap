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
import uuid
from time import monotonic
from getpass import getpass
from datetime import date, datetime, time, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, quote, unquote, urlparse
from cryptography.fernet import Fernet


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
                "summary": "Tên và cơ quan trong danh mục là dữ liệu tham chiếu. Chưa xác minh tuyến hiện hành của thủ tục này; chọn địa bàn và cơ quan trực tiếp trên Cổng quốc gia.",
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
    return procedures


PROCEDURES = load_catalog()
PROCEDURE_BY_CODE = {p["code"]: p for p in PROCEDURES}


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
        # Remove records created by the earlier demo build. New installations
        # begin empty; user submissions are never generated by the server.
        for row in con.execute("SELECT id,owner_id,payload_json FROM cases").fetchall():
            payload = json.loads(row["payload_json"])
            if row["owner_id"].startswith("demo-") or payload.get("sample"):
                con.execute("DELETE FROM cases WHERE id=?", (row["id"],))
        con.execute("DELETE FROM sessions WHERE expires_at < ?", (int(datetime.now(TZ).timestamp()),))


def procedure_for(code: str) -> dict:
    return PROCEDURE_BY_CODE.get(code) or {
        "ref": "", "code": code, "name": "Thủ tục hành chính", "field": "Khác",
        "level": "Cần đối chiếu", "agency": "Cơ quan giải quyết theo danh mục", "verified": False,
    }


def compute_deadline(procedure_code: str, accepted_at: datetime) -> tuple[str | None, str | None]:
    """Only calculate a legal-style deadline where the supplied research defines it."""
    if procedure_code != "2.000908":
        if procedure_code == "1.004237":
            return None, "05 ngày làm việc áp dụng cho kiểm tra yêu cầu và thông báo nghĩa vụ tài chính, không phải hạn trả dữ liệu."
        return None, "Chưa cấu hình hạn: cần xác nhận đúng phiên bản thủ tục và cơ quan."
    local = accepted_at.astimezone(TZ)
    due = local.date()
    if not is_workday(due):
        due = next_workday(due)
    elif local.time() > time(15, 0):
        due = next_workday(due)
    return due.isoformat(), "Lịch ngày nghỉ lễ/đổi ngày làm việc lấy từ working_calendar.json; danh sách hiện có cần đơn vị vận hành xác nhận."


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


def feedback_for_scope(con: sqlite3.Connection, role: str, visible_codes: set[str]) -> list[sqlite3.Row]:
    if role not in {"admin", "leader"} or not visible_codes:
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
    item["canManageLookupKey"] = include_internal and role in {"intake", "registrar"}
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
    if role in {"admin", "finance"}:
        payments = con.execute("SELECT transaction_ref,amount,status,basis,created_at,reconciled_at FROM payment_records WHERE case_id=? ORDER BY id", (row["id"],)).fetchall()
        item["payments"] = [dict(p) for p in payments]
    else:
        item["payments"] = []
    if role == "finance":
        applicant = item.get("applicant") or {}
        item["applicant"] = {"name": applicant.get("name", "")}
        item.pop("subject", None)
        item["attachments"] = []
        item["events"] = [event for event in item["events"] if event.get("action") in {"set_fee", "waive_fee", "pay", "reconcile"}]
        for key in ("draftResult", "supplement", "supplementHistory", "approvalNote", "publicNote", "withdrawal", "sync", "paperOriginals", "declaration", "requestSummary", "deliveryAddress"):
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
    if agency_scope.casefold() != "toàn thành phố" and agency_scope.casefold() != case_scope.casefold():
        return False
    if role == "intake":
        return True
    if role == "specialist":
        return (payload.get("assignment") or {}).get("assigneeId") == user["id"]
    if role == "leader":
        is_signatory = bool(user["may_sign_stop"]) and bool((payload.get("withdrawal") or {}).get("status") == "CHO_KY_PHAT_HANH")
        return row["status"] == "TRINH_DUYET" or is_signatory
    if role == "registrar":
        return row["status"] in {"DA_PHE_DUYET", "DA_PHAT_HANH"}
    if role == "finance":
        return payload.get("fee", {}).get("status") in {"DUE", "PAID"}
    return False


def public_case_view(con: sqlite3.Connection, row: sqlite3.Row) -> dict:
    """Return only the owner-facing case fields after a receipt key was verified."""
    payload = json.loads(row["payload_json"])
    applicant = payload.get("applicant") or {}
    procedure = payload.get("procedure") or procedure_for(row["procedure_code"])
    supplement = payload.get("supplement") or {}
    feedback_exists = con.execute("SELECT 1 FROM feedback WHERE case_id=?", (row["id"],)).fetchone() is not None
    raw_result = payload.get("result") if row["status"] in {"DA_PHAT_HANH", "HOAN_THANH"} else None
    result = ({key: raw_result[key] for key in ("number", "content", "issuedAt", "publishedAt") if key in raw_result}
              if isinstance(raw_result, dict) else None)
    return {
        "code": row["code"],
        "procedureCode": row["procedure_code"],
        "procedure": procedure,
        "status": row["status"],
        "statusLabel": STATUS_LABELS.get(row["status"], row["status"]),
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
        "supplement": {key: supplement[key] for key in ("reason", "items", "requestedAt", "requestNumber", "stage", "submittedAt", "resumeStatus") if key in supplement},
        "publicNote": payload.get("publicNote", ""),
        "result": result,
        "feedbackSubmitted": feedback_exists,
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
    for stage, label, completion_action in definitions:
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
    schema = procedure.get("submission")
    if procedure.get("serviceMode") in {"INFORMATION", "UNKNOWN"} or not schema:
        raise ValueError("Thủ tục chưa có biểu mẫu và thành phần hồ sơ được cấu hình để tiếp nhận trực tuyến. Không thể gửi bằng biểu mẫu chung.")
    if body.get("schemaVersion") != schema["version"]:
        raise ValueError("Biểu mẫu đã thay đổi hoặc thiếu phiên bản. Hãy mở lại thủ tục để lập hồ sơ.")
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
    return {"id": user["id"], "email": user["email"], "phone": user["phone"], "name": user["full_name"], "role": user["role"], "emailVerified": False, "agencyScope": user["agency_scope"], "validFrom": user["valid_from"], "validUntil": user["valid_until"], "maySignStop": bool(user["may_sign_stop"]), "signingAuthorityRef": user["signing_authority_ref"], "mustChangePassword": bool(user["must_change_password"])}


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
    if action in {"issue", "deliver", "sync", "set_fee", "waive_fee", "pay", "reconcile"}:
        raise PermissionError("Nghiệp vụ này chưa được mở vì chưa có hợp đồng kết nối và thông tin xác thực của cơ quan cung cấp dịch vụ.")
    current = row["status"]
    expected = body.get("expectedVersion")
    if type(expected) is not int or expected < 1:
        raise ValueError("Thiếu phiên bản hồ sơ. Hãy tải lại hồ sơ trước khi thao tác.")
    if expected != row["version"]:
        raise RuntimeError("Hồ sơ vừa được cập nhật ở phiên khác. Hãy tải lại trước khi thao tác.")

    title = ""
    detail = ""
    audience = "public"
    next_status = current

    if action == "accept":
        require_role(role, {"intake"})
        if current != "CHO_TIEP_NHAN": raise ValueError("Chỉ hồ sơ đang chờ tiếp nhận mới được xác nhận.")
        accepted = datetime.now(TZ)
        deadline, note = compute_deadline(case["procedureCode"], accepted)
        case["acceptedAt"] = accepted.isoformat(timespec="seconds")
        case["deadline"] = deadline
        case["deadlineNote"] = note
        next_status = "DA_TIEP_NHAN"
        title = "Đã tiếp nhận hồ sơ"
        detail = "Đã ghi thời điểm tiếp nhận hợp lệ và lập giấy tiếp nhận. " + (f"Hạn dự kiến theo quy tắc của thủ tục: {deadline}." if deadline else "Hạn giải quyết cần được đơn vị nghiệp vụ xác nhận.")
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
        require_role(role, {"citizen"})
        if current != "CHO_BO_SUNG": raise ValueError("Hồ sơ hiện không chờ bổ sung.")
        note = clean_text(payload.get("note"), 1200)
        raw_files = payload.get("files", [])
        if not isinstance(raw_files, list): raise ValueError("Danh sách tệp bổ sung không hợp lệ.")
        if len(note) < 3 and not raw_files: raise ValueError("Hãy ghi nội dung hoặc đính kèm tài liệu bổ sung.")
        files = save_files(row["code"], raw_files)
        case.setdefault("attachments", []).extend(files)
        case["supplement"]["submittedAt"] = now_iso()
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
        assignee_user = con.execute("""SELECT id,full_name FROM users WHERE id=? AND role='specialist' AND active=1
            AND (agency_scope=? COLLATE NOCASE OR agency_scope='Toàn thành phố' COLLATE NOCASE)
            AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?)""", (assignee_id, case_scope, today, today)).fetchone()
        if not assignee_user: raise ValueError("Chọn chuyên viên còn hiệu lực thuộc đúng cơ quan xử lý hồ sơ.")
        case["assignment"] = {"assigneeId": assignee_user["id"], "assignee": assignee_user["full_name"], "unit": case_scope, "assignedAt": now_iso(), "assignedBy": actor}
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
        if current != "TRINH_DUYET": raise ValueError("Hồ sơ không chờ phê duyệt.")
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
        case["approvalNote"] = clean_text(payload.get("note"), 500)
        next_status = "DA_PHE_DUYET"
        title = "Đã phê duyệt kết quả"
        detail = "Quyết định phê duyệt được ghi nhận; chờ văn thư phát hành."
        audience = "internal"
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
        if receiving_agency.casefold() not in procedure_agency_options(procedure):
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
        request_summary = (f"{declaration['dataRequested']}. Mục đích: {declaration['purpose']}" if procedure_code == "1.004237"
                           else f"Đề nghị cấp {declaration['copies']} bản sao {declaration['documentName']} cho {declaration['originalOwner']}.")[:3000]

        with DB_LOCK, connect() as con:
            prior = con.execute("SELECT c.code,c.owner_id,v.submission_hash FROM cases c LEFT JOIN case_lookup_secrets v ON v.case_id=c.id WHERE c.idempotency_key=?", (idempotency_hash,)).fetchone()
            if prior:
                if not hmac.compare_digest(prior["submission_hash"] or prior["owner_id"], submission_hash):
                    raise RuntimeError("Mã phiên gửi đã được sử dụng. Hãy tải lại biểu mẫu trước khi gửi tiếp.")
                return self.send_json({"code": prior["code"], "duplicate": True}, 200)
            today = datetime.now(TZ).date().isoformat()
            intake_exists = con.execute("SELECT 1 FROM users WHERE role='intake' AND active=1 AND agency_scope=? COLLATE NOCASE AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?) LIMIT 1", (receiving_agency, today, today)).fetchone()
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
        if action not in {"submit_supplement", "feedback"}:
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
        if len(agency_scope) < 3:
            raise ValueError("Hãy khai báo cơ quan hoặc đơn vị được giao.")
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
        if len(agency_scope) < 3:
            raise ValueError("Hãy khai báo cơ quan hoặc đơn vị được giao.")
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
        proposed = {"role": role, "active": body["active"], "agencyScope": agency_scope, "validFrom": valid_from, "validUntil": valid_until}
        with DB_LOCK, connect() as con:
            target = con.execute("SELECT * FROM users WHERE id=? AND role!='citizen'", (user_id,)).fetchone()
            if not target:
                return self.send_error_json("Không tìm thấy tài khoản cán bộ.", 404)
            if requester["id"] == user_id:
                raise PermissionError("Không thể lập đề nghị thay đổi chính tài khoản đang sử dụng.")
            if not target["active"] and con.execute("SELECT 1 FROM staff_access_requests WHERE user_id=? AND status='PENDING'", (user_id,)).fetchone():
                raise RuntimeError("Tài khoản đang chờ duyệt đề nghị cấp ban đầu; hãy xử lý đề nghị đó trước.")
            before = self.account_access_values(target)
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
            if self.account_access_values(target) != before:
                raise RuntimeError("Quyền tài khoản đã đổi sau khi lập đề nghị. Hãy lập đề nghị mới dựa trên thông tin hiện tại.")
            status = "APPROVED" if decision == "approve" else "REJECTED"
            if decision == "approve":
                if proposed["active"] and proposed["validUntil"] and proposed["validUntil"] < today:
                    raise ValueError("Thời hạn đề nghị đã kết thúc; hãy lập đề nghị mới.")
                if target["role"] == "admin":
                    other_admins = con.execute("""SELECT COUNT(*) FROM users WHERE id<>? AND role='admin' AND active=1
                        AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?)""", (target["id"], today, today)).fetchone()[0]
                    proposed_is_effective_admin = proposed["role"] == "admin" and proposed["active"] and (not proposed["validFrom"] or proposed["validFrom"] <= today) and (not proposed["validUntil"] or proposed["validUntil"] >= today)
                    if not other_admins and not proposed_is_effective_admin:
                        raise ValueError("Không thể thu hồi hoặc hạ quyền quản trị viên cuối cùng đang có hiệu lực.")
                con.execute("UPDATE users SET role=?,active=?,agency_scope=?,valid_from=?,valid_until=?,updated_at=? WHERE id=?", (proposed["role"], int(proposed["active"]), proposed["agencyScope"], proposed["validFrom"], proposed["validUntil"], now_iso(), target["id"]))
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
        if path == "/api/public/news":
            return self.list_public_news()
        if path.startswith("/api/procedures"):
            return self.send_json({"procedures": PROCEDURES, "count": len(PROCEDURES)})
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
                visible_codes = {r["code"] for r in visible_rows}
                feedback_rows = feedback_for_scope(con, role, visible_codes)
                today = datetime.now(TZ).date().isoformat()
                if role == "intake":
                    if (user["agency_scope"] or "").strip().casefold() == "toàn thành phố":
                        staff = con.execute("SELECT id,full_name,role FROM users WHERE active=1 AND role='specialist' AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?) ORDER BY full_name", (today, today)).fetchall()
                    else:
                        staff = con.execute("""SELECT id,full_name,role FROM users WHERE active=1 AND role='specialist'
                            AND (agency_scope=? COLLATE NOCASE OR agency_scope='Toàn thành phố' COLLATE NOCASE)
                            AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?) ORDER BY full_name""", (user["agency_scope"], today, today)).fetchall()
                else:
                    staff = []
            outbox = [{"code": c["code"], "status": c["sync"]["status"], "attempts": c["sync"]["attempts"], "lastError": c["sync"].get("lastError"), "messageId": c["sync"].get("messageId")} for c in cases if c.get("sync", {}).get("status") in {"ERROR", "PENDING"} or c.get("status") in {"DA_PHAT_HANH", "HOAN_THANH"}]
            return self.send_json({"user": public_user(user), "procedures": PROCEDURES, "cases": cases, "stats": build_stats(cases), "feedback": rows_to_dicts(feedback_rows), "outbox": outbox, "staff": [{"id": r["id"], "name": r["full_name"], "role": r["role"]} for r in staff], "statusLabels": STATUS_LABELS})
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
            with DB_LOCK, connect() as con:
                rows = con.execute("SELECT * FROM cases ORDER BY created_at DESC").fetchall()
                rows = [r for r in rows if visible_to_user(user, r)]
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Mã hồ sơ", "Mã thủ tục", "Trạng thái", "Người nộp", "Cơ quan", "Ngày gửi", "Hạn giải quyết", "Đồng bộ"])
            for r in rows:
                data = json.loads(r["payload_json"])
                applicant_name = "" if user["role"] == "finance" else csv_safe(data.get("applicant", {}).get("name"))
                writer.writerow([r["code"], r["procedure_code"], STATUS_LABELS.get(r["status"], r["status"]), applicant_name, csv_safe(data.get("procedure", {}).get("agency")), r["created_at"], data.get("deadline") or "", data.get("sync", {}).get("status")])
            raw = ("\ufeff" + output.getvalue()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=hanoi-cases.csv")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            return self.wfile.write(raw)
        if path == "/api/users":
            if user["role"] != "admin":
                return self.send_error_json("Chỉ quản trị viên mới được quản lý tài khoản.", 403)
            with DB_LOCK, connect() as con:
                rows = con.execute("SELECT id,email,phone,full_name,role,active,email_verified,agency_scope,valid_from,valid_until,may_sign_stop,signing_authority_ref,must_change_password,created_at FROM users WHERE role!='citizen' ORDER BY created_at DESC").fetchall()
                requests = con.execute("""SELECT r.*,u.email,u.full_name,requester.full_name AS requester_name,reviewer.full_name AS reviewer_name
                    FROM staff_access_requests r JOIN users u ON u.id=r.user_id
                    JOIN users requester ON requester.id=r.requested_by
                    LEFT JOIN users reviewer ON reviewer.id=r.reviewed_by
                    ORDER BY CASE r.status WHEN 'PENDING' THEN 0 ELSE 1 END,r.created_at DESC""").fetchall()
                account_changes = con.execute("""SELECT c.*,u.email,u.full_name,requester.full_name AS requester_name,reviewer.full_name AS reviewer_name
                    FROM staff_account_changes c JOIN users u ON u.id=c.user_id
                    JOIN users requester ON requester.id=c.requested_by
                    LEFT JOIN users reviewer ON reviewer.id=c.reviewed_by
                    ORDER BY CASE c.status WHEN 'PENDING' THEN 0 ELSE 1 END,c.created_at DESC""").fetchall()
            return self.send_json({
                "users": [{"id": r["id"], "email": r["email"], "phone": r["phone"], "name": r["full_name"], "role": r["role"], "active": bool(r["active"]), "emailVerified": False, "agencyScope": r["agency_scope"], "validFrom": r["valid_from"], "validUntil": r["valid_until"], "maySignStop": bool(r["may_sign_stop"]), "signingAuthorityRef": r["signing_authority_ref"], "mustChangePassword": bool(r["must_change_password"]), "createdAt": r["created_at"]} for r in rows],
                "accessRequests": [{"id": r["id"], "userId": r["user_id"], "email": r["email"], "name": r["full_name"], "requestedBy": r["requester_name"], "requestedById": r["requested_by"], "role": r["role"], "agencyScope": r["agency_scope"], "validFrom": r["valid_from"], "validUntil": r["valid_until"], "maySignStop": bool(r["requested_sign_stop"]), "signingAuthorityRef": r["signing_authority_ref"], "reason": r["reason"], "status": r["status"], "reviewedBy": r["reviewer_name"], "reviewNote": r["review_note"], "createdAt": r["created_at"], "reviewedAt": r["reviewed_at"]} for r in requests],
                "accountChanges": [{"id": r["id"], "userId": r["user_id"], "email": r["email"], "name": r["full_name"], "requestedBy": r["requester_name"], "requestedById": r["requested_by"], "before": json.loads(r["before_json"]), "proposed": json.loads(r["proposed_json"]), "reason": r["reason"], "status": r["status"], "reviewedBy": r["reviewer_name"], "reviewNote": r["review_note"], "createdAt": r["created_at"], "reviewedAt": r["reviewed_at"]} for r in account_changes],
            })
        return self.send_error_json("Không tìm thấy API.", 404)

    def serve_static(self, path: str):
        rel = "index.html" if path in {"", "/"} else path.lstrip("/")
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
            if path == "/api/auth/contact":
                return self.update_personal_contact(body, user)
            if path == "/api/auth/revoke-other-sessions":
                return self.revoke_other_sessions(user)
            if path == "/api/news":
                return self.save_managed_news(body, user)
            if path == "/api/users":
                if user["role"] != "admin":
                    return self.send_error_json("Chỉ quản trị viên mới được cấp tài khoản cán bộ.", 403)
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
                if user["role"] != "admin":
                    return self.send_error_json("Chỉ quản trị viên mới được đề nghị thay đổi tài khoản cán bộ.", 403)
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
