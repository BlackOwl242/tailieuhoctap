"""HTTP-level regression checks for the locally hosted application.

All records and uploads stay in a disposable temporary directory. These tests
exercise the implemented boundary; they do not certify a government integration.
"""

from __future__ import annotations

import http.cookiejar
import base64
import gzip
import io
import json
import os
import secrets
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
import zipfile
from datetime import date, timedelta
from pathlib import Path


TEMP_DATA = tempfile.TemporaryDirectory(prefix="hanoi-services-tests-")
os.environ["HANOI_DATA_DIR"] = TEMP_DATA.name
os.environ["HANOI_DB_PATH"] = str(Path(TEMP_DATA.name) / "test.sqlite3")

import app as service  # noqa: E402


PASSWORD = "ReviewPassword2026"
_TEST_SALT = b"hanoi-test-salt!"
_TEST_HASH_HEX = service.password_hash(PASSWORD, _TEST_SALT).hex()


class Client:
    def __init__(self, base_url: str) -> None:
        cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
        self.base_url = base_url
        self.csrf = ""

    def call(self, method: str, path: str, body: dict | None = None, include_csrf: bool = True):
        headers = {}
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode("utf-8")
        if include_csrf and self.csrf:
            headers["X-CSRF-Token"] = self.csrf
        request = urllib.request.Request(self.base_url + path, data=data, headers=headers, method=method)
        try:
            with self.opener.open(request) as response:
                raw = response.read()
                content_type = response.headers.get("Content-Type", "")
                return response.status, json.loads(raw) if "json" in content_type else raw.decode("utf-8")
        except urllib.error.HTTPError as error:
            raw = error.read().decode("utf-8")
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                pass
            return error.code, raw

    def call_raw(self, method: str, path: str, data: bytes | None = None, headers: dict | None = None, include_csrf: bool = True):
        req_headers = dict(headers or {})
        if include_csrf and self.csrf and "X-CSRF-Token" not in req_headers:
            req_headers["X-CSRF-Token"] = self.csrf
        request = urllib.request.Request(self.base_url + path, data=data, headers=req_headers, method=method)
        try:
            with self.opener.open(request) as response:
                return response.status, response.read(), dict(response.headers.items())
        except urllib.error.HTTPError as error:
            return error.code, error.read(), dict(error.headers.items())

    def login(self, email: str, password: str = PASSWORD):
        status, data = self.call("POST", "/api/auth/login", {"email": email, "password": password}, include_csrf=False)
        if status == 200:
            self.csrf = data["csrfToken"]
        return status, data

    def login_citizen(self, email: str, password: str = PASSWORD):
        status, data = self.call("POST", "/api/citizen/auth/login", {"email": email, "password": password}, include_csrf=False)
        if status == 200:
            self.csrf = data["csrfToken"]
        return status, data


class ApplicationAccessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.previous = (service.DATA_DIR, service.DB_PATH, service.UPLOAD_DIR)
        service.DATA_DIR = Path(TEMP_DATA.name)
        service.DB_PATH = service.DATA_DIR / "test.sqlite3"
        service.UPLOAD_DIR = service.DATA_DIR / "uploads"
        service.init_db()
        cls.server = service.ThreadingHTTPServer(("127.0.0.1", 0), service.AppHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_address[1]}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)
        service.DATA_DIR, service.DB_PATH, service.UPLOAD_DIR = cls.previous
        TEMP_DATA.cleanup()

    def setUp(self) -> None:
        with service.PUBLIC_ATTEMPTS_LOCK:
            service.PUBLIC_ATTEMPTS.clear()
        with service.AUTH_ATTEMPTS_LOCK:
            service.AUTH_ATTEMPTS.clear()
        with service.connect() as con:
            con.execute("DELETE FROM citizen_record_owners")
            con.execute("DELETE FROM payment_refunds")
            con.execute("DELETE FROM payment_events")
            con.execute("DELETE FROM payment_records")
            con.execute("DELETE FROM feedback")
            con.execute("DELETE FROM sandbox_signatures")
            con.execute("DELETE FROM sandbox_signing_authorities")
            con.execute("DELETE FROM sandbox_signing_authority_events")
            con.execute("DELETE FROM cases")
            con.execute("DELETE FROM sessions")
            con.execute("DELETE FROM staff_authority_events")
            con.execute("DELETE FROM staff_account_changes")
            con.execute("DELETE FROM staff_access_requests")
            con.execute("DELETE FROM users")
        self.admin1 = self.add_user("admin1@example.test", "admin")
        self.admin2 = self.add_user("admin2@example.test", "admin")
        self.intake = self.add_user("intake@example.test", "intake", "Ward A")
        self.citizen_intake = self.add_user("citizen-intake@example.test", "intake", "UBND phường Tây Hồ")
        self.citywide_intake = self.add_user("citywide-intake@example.test", "intake", "Toàn thành phố")
        self.specialist = self.add_user("specialist@example.test", "specialist", "Ward A")
        self.specialist2 = self.add_user("specialist2@example.test", "specialist", "Ward A")
        self.leader = self.add_user("reviewer-leader@example.test", "leader", "Ward A")
        self.registrar = self.add_user("registrar@example.test", "registrar", "Ward A")
        self.other_unit = self.add_user("other@example.test", "specialist", "Ward B")
        self.citizen_user = self.add_user("citizen@example.test", "citizen", "")
        self.other_citizen_user = self.add_user("citizen2@example.test", "citizen", "")
        self.add_case("CASE-A", "Ward A")
        self.add_case("CASE-B", "Ward A")

    def add_user(self, email: str, role: str, scope: str = "Ward A", may_sign_stop: int = 0, signing_ref: str = "") -> str:
        user_id = str(uuid.uuid4())
        today = date.today().isoformat() if role != "citizen" else ""
        valid_until = (date.today() + timedelta(days=300)).isoformat() if role != "citizen" else ""
        with service.connect() as con:
            con.execute(
                """INSERT INTO users(id,email,full_name,password_salt,password_hash,role,active,
                   agency_scope,valid_from,valid_until,may_sign_stop,signing_authority_ref,created_at,updated_at)
                   VALUES(?,?,?,?,?,?,1,?,?,?,?,?,?,?)""",
                (user_id, email, email.split("@")[0], _TEST_SALT.hex(), _TEST_HASH_HEX,
                 role, scope, today, valid_until, may_sign_stop, signing_ref, service.now_iso(), service.now_iso()),
            )
        return user_id

    def citizen_client(self, email: str = "citizen@example.test") -> Client:
        client = Client(self.base_url)
        self.assertEqual(client.login_citizen(email)[0], 200)
        return client

    def add_case(self, code: str, scope: str) -> None:
        payload = {
            "procedureCode": "2.000908",
            "agencyScope": scope,
            "receivingAgency": scope,
            "applicant": {"name": "Test Applicant", "citizenId": "TEST-IDENTIFIER", "phone": "0900000000"},
            "procedure": {"name": "Procedure", "agency": scope},
            "attachments": [],
            "events": [],
            "fee": {"status": "NONE"},
        }
        with service.connect() as con:
            con.execute(
                "INSERT INTO cases(code,owner_id,procedure_code,status,payload_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
                (code, "external-person", "2.000908", "CHO_TIEP_NHAN", json.dumps(payload), service.now_iso(), service.now_iso()),
            )

    def client(self, email: str) -> Client:
        client = Client(self.base_url)
        self.assertEqual(client.login(email)[0], 200)
        return client

    def test_public_and_account_boundaries(self) -> None:
        anonymous = Client(self.base_url)
        self.assertEqual(anonymous.call("GET", "/api/bootstrap")[0], 401)
        self.assertEqual(anonymous.call("GET", "/api/procedures")[0], 200)
        self.assertEqual(anonymous.call("POST", "/api/auth/register", {})[0], 410)

        admin = self.client("admin1@example.test")
        self.assertEqual(admin.call("GET", "/api/bootstrap")[1]["cases"], [])
        self.assertEqual(admin.call("GET", "/api/cases/CASE-A")[0], 404)
        self.assertEqual(admin.call("GET", "/api/export/cases.csv")[0], 403)

    def test_personal_account_contact_and_session_isolation(self) -> None:
        anonymous = Client(self.base_url)
        self.assertEqual(anonymous.call("GET", "/api/auth/account")[0], 401)
        first = self.client("intake@example.test")
        second = self.client("intake@example.test")
        other = self.client("specialist@example.test")
        with service.connect() as con:
            con.execute("UPDATE users SET email_verified=1 WHERE id=?", (self.intake,))
        details = first.call("GET", "/api/auth/account")[1]
        self.assertEqual(details["user"]["id"], self.intake)
        self.assertEqual(details["activeSessions"], 2)
        self.assertFalse(details["emailVerification"]["verified"])
        self.assertFalse(details["emailVerification"]["available"])
        self.assertFalse(details["user"]["emailVerified"])
        self.assertEqual(first.call("POST", "/api/auth/contact", {"phone": "0901234567", "currentPassword": PASSWORD}, include_csrf=False)[0], 403)
        self.assertEqual(first.call("POST", "/api/auth/contact", {"phone": "0901234567", "currentPassword": "wrong"})[0], 401)
        self.assertEqual(first.call("POST", "/api/auth/contact", {"phone": "invalid phone", "currentPassword": PASSWORD})[0], 422)
        status, saved = first.call("POST", "/api/auth/contact", {"phone": "0901234567", "currentPassword": PASSWORD, "role": "admin", "emailVerified": True})
        self.assertEqual(status, 200)
        self.assertEqual(saved["user"]["phone"], "0901234567")
        self.assertEqual(saved["user"]["role"], "intake")
        self.assertFalse(first.call("GET", "/api/auth/account")[1]["emailVerification"]["verified"])
        self.assertEqual(first.call("POST", "/api/auth/revoke-other-sessions", {})[0], 200)
        self.assertEqual(first.call("GET", "/api/auth/account")[1]["activeSessions"], 1)
        self.assertIsNone(second.call("GET", "/api/auth/me")[1]["user"])
        self.assertIsNotNone(other.call("GET", "/api/auth/me")[1]["user"])

    def test_news_management_permissions_publication_and_audit(self) -> None:
        anonymous = Client(self.base_url)
        status, public = anonymous.call("GET", "/api/public/news")
        self.assertEqual(status, 200)
        self.assertTrue(public["articles"])
        self.assertTrue(all(item["status"] == "PUBLISHED" for item in public["articles"]))
        self.assertEqual(anonymous.call("GET", "/api/news")[0], 401)

        intake = self.client("intake@example.test")
        self.assertEqual(intake.call("GET", "/api/news")[0], 403)
        unauthorized_body = {
            "action": "publish", "title": "Tin không được phép xuất bản",
            "summary": "Nội dung này chỉ dùng kiểm tra quyền quản trị tin.",
            "body": "Bài kiểm tra quyền không được tạo dữ liệu.",
            "category": "Hoạt động của Trung tâm", "image": "news-birth.jpg",
            "sourceUrl": "https://ttpvhcc.hanoi.gov.vn/trang-chu", "featured": False,
        }
        self.assertEqual(intake.call("POST", "/api/news", unauthorized_body)[0], 403)

        admin = self.client("admin1@example.test")
        status, managed = admin.call("GET", "/api/news")
        self.assertEqual(status, 200)
        self.assertEqual(len(managed["articles"]), len(public["articles"]))
        draft = {
            "action": "save", "title": "Thông báo hướng dẫn dịch vụ công trực tuyến",
            "summary": "Người dân có thể xem hướng dẫn và chuẩn bị thông tin trước khi gửi hồ sơ.",
            "body": "Nội dung thông báo hướng dẫn thao tác trong cổng.\n\nBài viết kiểm tra được lưu dưới dạng bản nháp.",
            "category": "Tiện ích công dân", "image": "news-support.jpg",
            "sourceUrl": "https://ttpvhcc.hanoi.gov.vn/trang-chu", "featured": False,
        }
        status, created = admin.call("POST", "/api/news", draft)
        self.assertEqual(status, 201, created)
        article = created["article"]
        self.assertEqual(article["status"], "DRAFT")
        self.assertEqual(article["version"], 1)
        self.assertNotIn(article["id"], {item["id"] for item in anonymous.call("GET", "/api/public/news")[1]["articles"]})

        self.assertEqual(admin.call("POST", "/api/news", {**draft, "action": "publish", "id": article["id"], "expectedVersion": 0})[0], 409)
        status, published = admin.call("POST", "/api/news", {**draft, "action": "publish", "id": article["id"], "expectedVersion": article["version"]})
        self.assertEqual(status, 200, published)
        article = published["article"]
        self.assertEqual(article["status"], "PUBLISHED")
        self.assertIn(article["id"], {item["id"] for item in anonymous.call("GET", "/api/public/news")[1]["articles"]})

        self.assertEqual(admin.call("POST", "/api/news", {**draft, "action": "archive", "id": article["id"], "expectedVersion": article["version"]})[0], 200)
        self.assertNotIn(article["id"], {item["id"] for item in anonymous.call("GET", "/api/public/news")[1]["articles"]})
        status, archived = admin.call("GET", "/api/news")
        article = next(item for item in archived["articles"] if item["id"] == article["id"])
        self.assertEqual(article["status"], "ARCHIVED")
        status, restored = admin.call("POST", "/api/news", {"action": "draft", "id": article["id"], "expectedVersion": article["version"]})
        self.assertEqual(status, 200, restored)
        self.assertEqual(restored["article"]["status"], "DRAFT")
        self.assertEqual(admin.call("POST", "/api/news", {**draft, "sourceUrl": "https://example.com/tin", "action": "publish"})[0], 422)
        status, history = admin.call("GET", "/api/news")
        self.assertEqual(status, 200)
        actions = [item["action"] for item in history["history"] if item["news_id"] == article["id"]]
        self.assertIn("PUBLISH", actions)
        self.assertIn("ARCHIVE", actions)
        self.assertIn("DRAFT", actions)

    def submit_public_case(self, client: Client | None = None) -> tuple[Client, str, str]:
        public = client or self.citizen_client()
        access_key = secrets.token_hex(32)
        body = {
            "submissionKey": str(uuid.uuid4()), "accessKey": access_key,
            "procedureCode": "2.000908", "applicantType": "citizen",
            "applicant": {"name": "Test Applicant", "phone": "0900000000", "email": ""},
            "subject": {"name": "Test Applicant", "relation": "Người nộp hồ sơ"},
            "receivingAgency": "UBND phường Tây Hồ", "requestSummary": "Đề nghị cấp bản sao theo hồ sơ lưu trữ của gia đình.", "files": [],
            "schemaVersion": "2.000908-858-2026-v1", "confirmed": True, "deliveryMethod": "Trực tiếp",
            "declaration": {"address": "Địa chỉ liên hệ để kiểm thử", "identityType": "Thẻ căn cước", "identityNumber": "TEST-ID", "relation": "Người được cấp bản chính", "originalOwner": "Test Applicant", "documentName": "Giấy tờ kiểm thử", "registerAuthority": "UBND phường Tây Hồ", "copies": "1"},
        }
        body["files"] = [{"name": "identity.pdf", "data": base64.b64encode(b"%PDF-test-only").decode(), "componentId": "identity"}]
        self.assertEqual(Client(self.base_url).call("POST", "/api/cases", body, include_csrf=False)[0], 401)
        status, result = public.call("POST", "/api/cases", body)
        self.assertEqual(status, 201, result)
        self.assertNotIn("accessKey", result)
        with service.connect() as con:
            encrypted = con.execute("SELECT encrypted_key FROM case_lookup_secrets v JOIN cases c ON c.id=v.case_id WHERE c.code=?", (result["code"],)).fetchone()[0]
        lookup_key = service.lookup_cipher().decrypt(encrypted).decode()
        self.assertNotEqual(lookup_key, access_key)
        return public, result["code"], lookup_key

    def test_citizen_submission_tracking_and_receipt_secret(self) -> None:
        public, code, access_key = self.submit_public_case()
        self.assertEqual(Client(self.base_url).call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": access_key}, include_csrf=False)[0], 401)
        status, result = public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": access_key})
        self.assertEqual(status, 200)
        self.assertEqual(result["case"]["status"], "CHO_TIEP_NHAN")
        self.assertEqual([p["state"] for p in result["case"]["progress"]], ["completed", "current", "pending", "pending", "pending", "pending"])
        self.assertEqual(result["case"]["declaration"]["copies"], "1")
        self.assertEqual(result["case"]["applicant"]["name"], "Test Applicant")
        self.assertEqual(len(result["case"]["events"]), 1)
        self.assertNotIn("citizenId", result["case"]["applicant"])
        self.assertEqual(public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": secrets.token_hex(32)})[0], 404)

        intake = self.client("citizen-intake@example.test")
        visible = intake.call("GET", "/api/bootstrap")[1]["cases"]
        self.assertIn(code, {item["code"] for item in visible})

    def test_staff_lookup_key_is_scoped_encrypted_audited_and_rotatable(self) -> None:
        public, code, original = self.submit_public_case()
        path = f"/api/cases/{code}/lookup-key"
        self.assertEqual(public.call("POST", path, {"action": "reveal"})[0], 401)
        intake = self.client("citizen-intake@example.test")
        self.assertEqual(intake.call("POST", path, {"action": "reveal"}, include_csrf=False)[0], 403)
        self.assertEqual(self.client("intake@example.test").call("POST", path, {"action": "reveal"})[0], 404)
        for email in ["admin1@example.test", "specialist@example.test", "reviewer-leader@example.test"]:
            self.assertEqual(self.client(email).call("POST", path, {"action": "reveal"})[0], 403)
        status, revealed = intake.call("POST", path, {"action": "reveal"})
        self.assertEqual(status, 200)
        self.assertEqual(revealed["accessKey"], original)
        bootstrap = intake.call("GET", "/api/bootstrap")[1]
        self.assertNotIn(original, json.dumps(bootstrap))
        with service.connect() as con:
            vault = con.execute("SELECT encrypted_key FROM case_lookup_secrets").fetchone()[0]
            self.assertNotIn(original.encode(), vault)
            self.assertEqual(service.lookup_cipher().decrypt(vault).decode(), original)
        self.assertEqual(intake.call("POST", path, {"action": "rotate", "expectedVersion": 0})[0], 409)
        status, rotated = intake.call("POST", path, {"action": "rotate", "expectedVersion": 1})
        self.assertEqual(status, 200)
        self.assertNotEqual(rotated["accessKey"], original)
        self.assertEqual(rotated["version"], 2)
        self.assertEqual(public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": original})[0], 404)
        status, looked_up = public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": rotated["accessKey"]})
        self.assertEqual(status, 200)
        self.assertNotIn("lookup_key_", json.dumps(looked_up))
        events = intake.call("GET", f"/api/cases/{code}")[1]["events"]
        self.assertIn("lookup_key_rotate", [event["action"] for event in events])
        self.assertNotIn(rotated["accessKey"], json.dumps(events))

    def test_public_submission_must_match_a_verified_procedure_authority(self) -> None:
        public = self.citizen_client()
        body = {
            "submissionKey": str(uuid.uuid4()), "accessKey": secrets.token_hex(32),
            "procedureCode": "2.000908", "applicantType": "citizen",
            "applicant": {"name": "Test Applicant", "phone": "0900000000", "email": ""},
            "receivingAgency": "Ward A", "requestSummary": "Đề nghị cấp bản sao theo hồ sơ lưu trữ của gia đình.", "files": [],
        }
        self.assertEqual(Client(self.base_url).call("POST", "/api/cases", body, include_csrf=False)[0], 401)
        self.assertEqual(public.call("POST", "/api/cases", body)[0], 422)
        status, result = Client(self.base_url).call("GET", "/api/public/agencies")
        self.assertEqual(status, 200)
        self.assertIn("UBND phường Tây Hồ", result["agencies"])
        self.assertNotIn("Toàn thành phố", result["agencies"])

    def test_unconfirmed_or_unselected_submission_does_not_create_a_case(self) -> None:
        public = self.citizen_client()
        body = {"submissionKey": str(uuid.uuid4()), "accessKey": secrets.token_hex(32), "procedureCode": "2.000908", "schemaVersion": "2.000908-858-2026-v1", "confirmed": False, "applicantType": "citizen", "applicant": {"name": "Test Applicant", "phone": "0900000000"}, "receivingAgency": "UBND phường Tây Hồ", "files": []}
        with service.connect() as con: before = con.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
        status, result = public.call("POST", "/api/cases", body)
        self.assertEqual(status, 422)
        self.assertIn("xác nhận", result["error"])
        body["procedureCode"] = ""
        self.assertEqual(public.call("POST", "/api/cases", body)[0], 422)
        with service.connect() as con: self.assertEqual(con.execute("SELECT COUNT(*) FROM cases").fetchone()[0], before)

    def test_citizen_supplement_uses_the_staff_case_workflow(self) -> None:
        public, code, access_key = self.submit_public_case()
        intake = self.client("citizen-intake@example.test")
        status, accepted = intake.call("POST", f"/api/cases/{code}/actions", {"action": "accept", "expectedVersion": 1, "payload": {}})
        self.assertEqual(status, 200)
        status, requested = intake.call("POST", f"/api/cases/{code}/actions", {"action": "request_supplement", "expectedVersion": accepted["version"], "payload": {"reason": "Thiếu một giấy tờ cần thiết để tiếp tục kiểm tra.", "items": ["Bổ sung bản chụp giấy tờ liên quan."]}})
        self.assertEqual(status, 200)
        self.assertTrue(requested["supplement"].get("supplementDueAt"))
        self.assertTrue(requested.get("forms", {}).get("mau02", {}).get("supplementDueAt"))
        self.assertEqual(Client(self.base_url).call("POST", f"/api/public/cases/{code}/actions", {"accessKey": access_key, "action": "submit_supplement", "expectedVersion": requested["version"], "payload": {"note": "Đã bổ sung.", "files": []}}, include_csrf=False)[0], 401)
        status, updated = public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": access_key, "action": "submit_supplement", "expectedVersion": requested["version"], "payload": {"note": "Đã bổ sung giấy tờ theo hướng dẫn.", "files": []}})
        self.assertEqual(status, 200)
        self.assertEqual(updated["case"]["status"], "DA_TIEP_NHAN")
        self.assertEqual(updated["case"]["events"][-1]["title"], "Người dân đã gửi nội dung bổ sung")
        self.assertEqual(public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": secrets.token_hex(32), "action": "submit_supplement", "expectedVersion": updated["case"]["version"], "payload": {"note": "Không được phép."}})[0], 404)

    def test_citizen_feedback_is_only_available_after_a_closed_case(self) -> None:
        public, code, access_key = self.submit_public_case()
        with service.connect() as con:
            con.execute("UPDATE cases SET status='HOAN_THANH',version=version+1 WHERE code=?", (code,))
        status, lookup = public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": access_key})
        self.assertEqual(status, 200)
        case = lookup["case"]
        status, result = public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": access_key, "action": "feedback", "expectedVersion": case["version"], "payload": {"score": 5, "content": "Thông tin cập nhật rõ ràng."}})
        self.assertEqual(status, 200)
        self.assertTrue(result["case"]["feedbackSubmitted"])
        self.assertEqual(public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": access_key, "action": "feedback", "expectedVersion": result["case"]["version"], "payload": {"score": 5, "content": "Gửi lại đánh giá."}})[0], 422)

    def test_citywide_operational_account_cannot_read_dossiers(self) -> None:
        citywide = self.client("citywide-intake@example.test")
        self.assertEqual(citywide.call("GET", "/api/cases/CASE-A")[0], 404)
        status, data = citywide.call("GET", "/api/bootstrap")
        self.assertEqual(status, 200)
        self.assertEqual(data["cases"], [])

    def test_unreviewed_form_and_wildcard_agency_cannot_create_cases(self) -> None:
        public = self.citizen_client()
        for procedure, agency in [("1.000477", "UBND phường Tây Hồ"), ("2.000908", "Toàn thành phố")]:
            body = {"submissionKey": str(uuid.uuid4()), "accessKey": secrets.token_hex(32), "procedureCode": procedure,
                    "applicantType": "citizen", "applicant": {"name": "Test Applicant", "phone": "0900000000"}, "receivingAgency": agency}
            with service.connect() as con:
                before = con.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
            self.assertEqual(public.call("POST", "/api/cases", body)[0], 422)
            with service.connect() as con:
                self.assertEqual(con.execute("SELECT COUNT(*) FROM cases").fetchone()[0], before)

    def test_role_scope_and_version_guard(self) -> None:
        intake = self.client("intake@example.test")
        self.assertEqual(intake.call("GET", "/api/cases/CASE-A")[0], 200)
        self.assertEqual(
            intake.call("POST", "/api/cases/CASE-A/actions", {"action": "accept", "expectedVersion": 1, "payload": {}}, include_csrf=False)[0],
            403,
        )
        status, accepted = intake.call("POST", "/api/cases/CASE-A/actions", {"action": "accept", "expectedVersion": 1, "payload": {}})
        self.assertEqual(status, 200)
        self.assertEqual(accepted["status"], "DA_TIEP_NHAN")
        self.assertEqual(intake.call("POST", "/api/cases/CASE-A/actions", {"action": "assign", "expectedVersion": 1, "payload": {"assignee": self.specialist}})[0], 409)
        self.assertEqual(intake.call("POST", "/api/cases/CASE-B/actions", {"action": "accept", "payload": {}})[0], 422)

        status, assigned = intake.call("POST", "/api/cases/CASE-A/actions", {"action": "assign", "expectedVersion": 2, "payload": {"assignee": self.specialist}})
        self.assertEqual(status, 200)
        specialist = self.client("specialist@example.test")
        self.assertEqual(specialist.call("GET", "/api/cases/CASE-A")[0], 200)
        self.assertEqual(specialist.call("GET", "/api/cases/CASE-B")[0], 404)
        self.assertEqual(specialist.call("GET", "/api/cases/CASE-A")[1]["version"], assigned["version"])
        self.assertEqual(specialist.call("POST", "/api/cases/CASE-A/actions", {"action": "accept", "expectedVersion": 3, "payload": {}})[0], 403)
        status, drafted = specialist.call("POST", "/api/cases/CASE-A/actions", {"action": "save_draft", "expectedVersion": 3, "payload": {"draft": "A valid test draft for this case"}})
        self.assertEqual(status, 200)
        status, checked = specialist.call("POST", "/api/cases/CASE-A/actions", {"action": "verify_original_register", "expectedVersion": drafted["version"], "payload": {"evidence": {"outcome": "Khớp sổ gốc và đủ quyền yêu cầu", "registerReference": "Sổ kiểm thử, trang 1, cơ quan kiểm thử", "verificationBasis": "Đã đối chiếu quyền yêu cầu và sổ gốc trong bộ dữ liệu kiểm thử"}}})
        self.assertEqual(status, 200, checked)
        status, submitted = specialist.call("POST", "/api/cases/CASE-A/actions", {"action": "submit_review", "expectedVersion": checked["version"], "payload": {}})
        self.assertEqual(status, 200)
        self.assertEqual(submitted["status"], "TRINH_DUYET")

        leader = self.client("reviewer-leader@example.test")
        self.assertEqual(leader.call("GET", "/api/cases/CASE-A")[0], 200)
        status, approved = leader.call("POST", "/api/cases/CASE-A/actions", {"action": "approve", "expectedVersion": submitted["version"], "payload": {"note": "Reviewed in the isolated regression test"}})
        self.assertEqual(status, 200)
        self.assertEqual(approved["status"], "DA_PHE_DUYET")

        registrar = self.client("registrar@example.test")
        self.assertEqual(registrar.call("GET", "/api/cases/CASE-A")[0], 200)
        self.assertEqual(registrar.call("POST", "/api/cases/CASE-A/actions", {"action": "issue", "expectedVersion": approved["version"], "payload": {}})[0], 403)
        self.assertEqual(registrar.call("GET", "/api/cases/CASE-A")[1]["status"], "DA_PHE_DUYET")
        other = self.client("other@example.test")
        self.assertEqual(other.call("GET", "/api/cases/CASE-A")[0], 404)

    def test_staff_access_requires_second_admin_and_forced_password_change(self) -> None:
        admin1 = self.client("admin1@example.test")
        request_body = {
            "name": "New Specialist", "email": "new@example.test", "phone": "", "role": "specialist",
            "agencyScope": "Ward A", "validFrom": date.today().isoformat(),
            "validUntil": (date.today() + timedelta(days=90)).isoformat(),
            "reason": "Assignment under approved staffing plan", "password": PASSWORD,
            "maySignStop": False, "signingAuthorityRef": "",
        }
        status, created = admin1.call("POST", "/api/users", request_body)
        self.assertEqual(status, 201)
        self.assertEqual(Client(self.base_url).login("new@example.test")[0], 401)
        self.assertEqual(admin1.call("POST", f"/api/users/{created['request']['userId']}/change-requests", {"role": "specialist", "active": True, "agencyScope": "Ward A", "validFrom": request_body["validFrom"], "validUntil": request_body["validUntil"], "reason": "Change before the initial account review"})[0], 409)
        self.assertEqual(admin1.call("POST", f"/api/users/access-requests/{created['request']['id']}/review", {"decision": "approve", "note": ""})[0], 403)

        admin2 = self.client("admin2@example.test")
        self.assertEqual(admin2.call("POST", f"/api/users/access-requests/{created['request']['id']}/review", {"decision": "approve", "note": "Approved by independent administrator"})[0], 200)
        staff = Client(self.base_url)
        status, data = staff.login("new@example.test")
        self.assertEqual(status, 200)
        self.assertTrue(data["user"]["mustChangePassword"])
        self.assertEqual(staff.call("GET", "/api/bootstrap")[0], 403)
        changed = "NewReviewPassword2026"
        self.assertEqual(staff.call("POST", "/api/auth/change-password", {"currentPassword": PASSWORD, "newPassword": changed})[0], 200)
        self.assertEqual(staff.call("GET", "/api/bootstrap")[0], 200)
        self.assertEqual(Client(self.base_url).login("new@example.test", changed)[0], 200)

    def test_account_changes_need_independent_review_and_revoke_sessions(self) -> None:
        admin1 = self.client("admin1@example.test")
        intake = self.client("intake@example.test")
        self.add_user("admin3@example.test", "admin")
        proposal = {
            "role": "specialist", "active": False, "agencyScope": "Ward C",
            "validFrom": date.today().isoformat(), "validUntil": (date.today() + timedelta(days=180)).isoformat(),
            "reason": "Điều chuyển theo quyết định nhân sự số 24/2026",
        }
        self.assertEqual(admin1.call("POST", f"/api/users/{self.admin1}/change-requests", proposal)[0], 403)
        status, created = admin1.call("POST", f"/api/users/{self.intake}/change-requests", proposal)
        self.assertEqual(status, 201)
        change_id = created["request"]["id"]
        self.assertEqual(admin1.call("POST", f"/api/users/account-changes/{change_id}/review", {"decision": "approve"})[0], 403)
        self.assertEqual(intake.call("POST", f"/api/users/account-changes/{change_id}/review", {"decision": "approve"})[0], 403)

        admin2 = self.client("admin2@example.test")
        self.assertEqual(admin2.call("POST", f"/api/users/account-changes/{change_id}/review", {"decision": "approve", "note": "Đã đối chiếu quyết định điều chuyển nhân sự"})[0], 200)
        self.assertEqual(intake.call("GET", "/api/auth/me")[1]["user"], None)
        self.assertEqual(Client(self.base_url).login("intake@example.test")[0], 401)
        updated = next(row for row in admin1.call("GET", "/api/users")[1]["users"] if row["id"] == self.intake)
        self.assertEqual(updated["role"], "specialist")
        self.assertFalse(updated["active"])
        self.assertEqual(updated["agencyScope"], "Ward C")
        history = next(row for row in admin1.call("GET", "/api/users")[1]["accountChanges"] if row["id"] == change_id)
        self.assertEqual(history["before"]["role"], "intake")
        self.assertFalse(history["proposed"]["active"])
        self.assertEqual(history["status"], "APPROVED")

        reactivate = {**proposal, "active": True, "agencyScope": "Ward A", "reason": "Khôi phục theo quyết định phân công số 31/2026"}
        status, reactivation = admin2.call("POST", f"/api/users/{self.intake}/change-requests", reactivate)
        self.assertEqual(status, 201)
        self.assertEqual(admin2.call("POST", f"/api/users/account-changes/{reactivation['request']['id']}/review", {"decision": "approve"})[0], 403)
        self.assertEqual(admin1.call("POST", f"/api/users/account-changes/{reactivation['request']['id']}/review", {"decision": "approve", "note": "Đã kiểm tra quyết định khôi phục phân công"})[0], 200)
        self.assertEqual(Client(self.base_url).login("intake@example.test")[0], 200)

        admin_target_change = {"role": "specialist", "active": True, "agencyScope": "Ward B", "validFrom": date.today().isoformat(), "validUntil": (date.today() + timedelta(days=120)).isoformat(), "reason": "Điều động theo quyết định tổ chức số 45/2026"}
        status, admin_proposal = admin1.call("POST", f"/api/users/{self.admin2}/change-requests", admin_target_change)
        self.assertEqual(status, 201)
        self.assertEqual(admin2.call("POST", f"/api/users/account-changes/{admin_proposal['request']['id']}/review", {"decision": "approve"})[0], 403)
        admin3 = self.client("admin3@example.test")
        self.assertEqual(admin3.call("POST", f"/api/users/account-changes/{admin_proposal['request']['id']}/review", {"decision": "approve", "note": "Đã đối chiếu quyết định tổ chức và phạm vi mới"})[0], 200)
        self.assertEqual(admin2.call("GET", "/api/auth/me")[1]["user"], None)
        changed_admin = next(row for row in admin1.call("GET", "/api/users")[1]["users"] if row["id"] == self.admin2)
        self.assertEqual(changed_admin["role"], "specialist")
        self.assertEqual(changed_admin["agencyScope"], "Ward B")

    def test_stop_signing_authority_needs_review_and_can_be_revoked(self) -> None:
        admin1 = self.client("admin1@example.test")
        request_body = {
            "name": "Authorized Leader", "email": "leader@example.test", "phone": "", "role": "leader",
            "agencyScope": "Ward A", "validFrom": date.today().isoformat(),
            "validUntil": (date.today() + timedelta(days=90)).isoformat(),
            "reason": "Assignment under approved staffing plan", "password": PASSWORD,
            "maySignStop": True, "signingAuthorityRef": "Decision 123/QD-UNIT",
        }
        status, created = admin1.call("POST", "/api/users", request_body)
        self.assertEqual(status, 201)
        request_id = created["request"]["id"]
        admin2 = self.client("admin2@example.test")
        endpoint = f"/api/users/access-requests/{request_id}/review"
        self.assertEqual(admin2.call("POST", endpoint, {"decision": "approve", "authorizeStopSigning": False})[0], 422)
        self.assertEqual(admin2.call("POST", endpoint, {"decision": "approve", "authorizeStopSigning": True})[0], 200)
        managed = admin1.call("GET", "/api/users")[1]["users"]
        leader = next(account for account in managed if account["email"] == "leader@example.test")
        self.assertTrue(leader["maySignStop"])
        self.assertEqual(
            admin1.call("POST", f"/api/users/{leader['id']}/stop-signature-authority", {"reason": "Authority assignment has ended"})[0],
            200,
        )
        managed = admin1.call("GET", "/api/users")[1]["users"]
        leader = next(account for account in managed if account["email"] == "leader@example.test")
        self.assertFalse(leader["maySignStop"])

    def test_citizen_mau06_download_and_withdrawal_lifecycle(self) -> None:
        # (a) Pre-acceptance citizen online withdrawal transitions directly to DUNG
        owner, pre_code, pre_key = self.submit_public_case()
        status, pre_res = owner.call("POST", f"/api/public/cases/{pre_code}/actions", {
            "accessKey": pre_key, "action": "request_withdrawal", "expectedVersion": 1,
            "payload": {"reason": "Không còn nhu cầu thực hiện thủ tục này."},
        })
        self.assertEqual(status, 200, pre_res)
        self.assertEqual(pre_res["case"]["status"], "DUNG")

        # Post-acceptance withdrawal -> reject_stop_notice -> prepare_stop_notice (TRUC_TUYEN) -> issue_stop_notice -> citizen download Mẫu 06 PDF -> confirm_paper_returned
        self.add_user("tayho-leader@example.test", "leader", "UBND phường Tây Hồ", may_sign_stop=1, signing_ref="QD-99/UBND")
        self.add_user("tayho-registrar@example.test", "registrar", "UBND phường Tây Hồ")
        owner2, code, key = self.submit_public_case()
        intake = self.client("citizen-intake@example.test")
        leader = self.client("tayho-leader@example.test")
        registrar = self.client("tayho-registrar@example.test")

        status, accepted = intake.call("POST", f"/api/cases/{code}/actions", {
            "action": "accept", "expectedVersion": 1, "payload": {"paperOriginals": "01 Sổ hộ tịch gốc để đối chiếu"},
        })
        self.assertEqual(status, 200, accepted)
        # Note: accept sets paperOriginals if present on payload/counter; ensure paperOriginals in case payload for returnPaperFollowUp check
        with service.connect() as con:
            row = con.execute("SELECT id, payload_json FROM cases WHERE code=?", (code,)).fetchone()
            pdata = json.loads(row["payload_json"])
            pdata["paperOriginals"] = "01 bản giấy nộp kèm"
            con.execute("UPDATE cases SET payload_json=? WHERE id=?", (json.dumps(pdata, ensure_ascii=False), row["id"]))

        status, req_wd = owner2.call("POST", f"/api/public/cases/{code}/actions", {
            "accessKey": key, "action": "request_withdrawal", "expectedVersion": accepted["version"],
            "payload": {"reason": "Xin rút hồ sơ trực tuyến để chuẩn bị lại giấy tờ."},
        })
        self.assertEqual(status, 200, req_wd)
        self.assertEqual(req_wd["case"]["withdrawal"]["status"], "CHO_KY_PHAT_HANH")
        self.assertIn("mau05", req_wd["case"]["forms"])

        status, rejected_wd = leader.call("POST", f"/api/cases/{code}/actions", {
            "action": "reject_stop_notice", "expectedVersion": req_wd["case"]["version"],
            "payload": {"reason": "Người nộp xác nhận lại qua điện thoại tiếp tục giải quyết."},
        })
        self.assertEqual(status, 200, rejected_wd)
        self.assertEqual(rejected_wd["withdrawal"]["status"], "TU_CHOI_DUNG")

        pdf_bytes = b"%PDF-1.4\nSigned Mau 05 & Mau 06 test document\n%%EOF"
        status, prepared = intake.call("POST", f"/api/cases/{code}/actions", {
            "action": "prepare_stop_notice", "expectedVersion": rejected_wd["version"],
            "payload": {
                "channel": "TRUC_TUYEN", "requesterType": "SELF", "requesterName": "Test Applicant",
                "requesterIdentifier": "001099000123", "requesterAddress": "Tây Hồ, Hà Nội",
                "reason": "Đề nghị dừng giải quyết theo Mẫu số 05.", "identityVerified": True,
                "files": [{"name": "mau05.pdf", "data": base64.b64encode(pdf_bytes).decode()}],
            },
        })
        self.assertEqual(status, 200, prepared)
        status, issued_stop = leader.call("POST", f"/api/cases/{code}/actions", {
            "action": "issue_stop_notice", "expectedVersion": prepared["version"],
            "payload": {
                "signatureAttested": True, "noticeNumber": "12/TB-UBND",
                "authorityName": "UBND thành phố Hà Nội", "serviceOfficeName": "Bộ phận Một cửa UBND phường Tây Hồ",
                "noticeLocation": "Tây Hồ", "noticeDate": date.today().isoformat(),
                "deliveryChannel": "TRUC_TUYEN", "deliveryReference": "PORTAL-MSG-01",
                "collectionOffice": "Bộ phận Một cửa UBND phường Tây Hồ",
                "files": [{"name": "mau06-signed.pdf", "data": base64.b64encode(pdf_bytes).decode()}],
            },
        })
        self.assertEqual(status, 200, issued_stop)
        self.assertEqual(issued_stop["status"], "DUNG")

        _, lookup_after = owner2.call("POST", "/api/public/cases/lookup", {"code": code})
        doc_info = lookup_after["case"]["withdrawal"]["noticeDocument"]
        self.assertTrue(doc_info["downloadUrl"].startswith(f"/api/citizen/documents/{code}/"), doc_info)

        dl_status, dl_raw, _ = owner2.call_raw("GET", doc_info["downloadUrl"], include_csrf=False)
        self.assertEqual(dl_status, 200)
        self.assertEqual(dl_raw, pdf_bytes)

        other_citizen = self.citizen_client("citizen2@example.test")
        self.assertEqual(other_citizen.call_raw("GET", doc_info["downloadUrl"], include_csrf=False)[0], 404)
        self.assertEqual(Client(self.base_url).call_raw("GET", doc_info["downloadUrl"], include_csrf=False)[0], 401)

        status, paper_ret = intake.call("POST", f"/api/cases/{code}/actions", {
            "action": "confirm_paper_returned", "expectedVersion": issued_stop["version"],
            "payload": {"note": "Đã bàn giao lại giấy tờ gốc theo biên bản."},
        })
        self.assertEqual(status, 200, paper_ret)
        self.assertEqual(paper_ret["withdrawal"]["returnPaperFollowUp"]["status"], "DA_TRA_GIAY_TO")

    def test_negative_verification_blocks_approve_and_allows_decline(self) -> None:
        # (b) Deadlock #1 fix
        intake = self.client("intake@example.test")
        specialist = self.client("specialist@example.test")
        leader = self.client("reviewer-leader@example.test")

        _, acc = intake.call("POST", "/api/cases/CASE-A/actions", {"action": "accept", "expectedVersion": 1, "payload": {}})
        _, asg = intake.call("POST", "/api/cases/CASE-A/actions", {"action": "assign", "expectedVersion": acc["version"], "payload": {"assignee": self.specialist}})
        _, drf = specialist.call("POST", "/api/cases/CASE-A/actions", {"action": "save_draft", "expectedVersion": asg["version"], "payload": {"draft": "Dự thảo thông báo không đủ điều kiện cấp bản sao."}})
        status, ver = specialist.call("POST", "/api/cases/CASE-A/actions", {
            "action": "verify_original_register", "expectedVersion": drf["version"],
            "payload": {"evidence": {
                "outcome": "Không tìm thấy bản ghi trong sổ gốc",
                "registerReference": "Sổ hộ tịch 2005-2010",
                "verificationBasis": "Đã tra cứu toàn bộ sổ gốc lưu trữ nhưng không có bản ghi phù hợp.",
            }},
        })
        self.assertEqual(status, 200, ver)
        self.assertIn("submit_review", ver["workflowGuard"]["allowedActions"])

        status, sub = specialist.call("POST", "/api/cases/CASE-A/actions", {"action": "submit_review", "expectedVersion": ver["version"], "payload": {}})
        self.assertEqual(status, 200, sub)
        self.assertEqual(sub["status"], "TRINH_DUYET")
        self.assertEqual(sub["proposedDecision"], "DECLINE")

        status, blocked = leader.call("POST", "/api/cases/CASE-A/actions", {
            "action": "approve", "expectedVersion": sub["version"], "payload": {"note": "Thử phê duyệt sai quy định."},
        })
        self.assertEqual(status, 422)
        self.assertIn("không đủ điều kiện phê duyệt", blocked["error"])

        status, declined = leader.call("POST", "/api/cases/CASE-A/actions", {
            "action": "decline", "expectedVersion": sub["version"],
            "payload": {"reason": "Không tìm thấy thông tin trong sổ gốc theo biên bản tra cứu của chuyên viên."},
        })
        self.assertEqual(status, 200, declined)
        self.assertEqual(declined["status"], "KHONG_GIAI_QUYET")

    def test_post_sign_send_back_return_to_leader_and_reassignment(self) -> None:
        # (c) Deadlock #2 fix + leader assign + return_to_intake + close_expired_supplement
        admin = self.client("admin1@example.test")
        self.assertEqual(admin.call("POST", "/api/sandbox-signers", {
            "userId": self.leader, "action": "grant", "authorityRef": "QD-77/UBND", "reason": "Cấp quyền ký thử nghiệm cho lãnh đạo đơn vị.",
        })[0], 200)

        intake = self.client("intake@example.test")
        specialist = self.client("specialist@example.test")
        specialist2 = self.client("specialist2@example.test")
        leader = self.client("reviewer-leader@example.test")
        registrar = self.client("registrar@example.test")

        _, acc = intake.call("POST", "/api/cases/CASE-A/actions", {"action": "accept", "expectedVersion": 1, "payload": {}})
        _, asg = intake.call("POST", "/api/cases/CASE-A/actions", {"action": "assign", "expectedVersion": acc["version"], "payload": {"assignee": self.specialist}})
        # Specialist returns misrouted dossier to intake
        status, ret_in = specialist.call("POST", "/api/cases/CASE-A/actions", {
            "action": "return_to_intake", "expectedVersion": asg["version"], "payload": {"note": "Hồ sơ thuộc mảng chuyên môn khác, đề nghị phân công lại."},
        })
        self.assertEqual(status, 200, ret_in)
        self.assertEqual(ret_in["status"], "DA_TIEP_NHAN")
        self.assertIsNone(ret_in.get("assignment"))

        # Leader assigns to specialist1, then reassigns to specialist2 -> assignmentHistory has 2 entries (return_to_intake + reassign)
        _, asg1 = leader.call("POST", "/api/cases/CASE-A/actions", {"action": "assign", "expectedVersion": ret_in["version"], "payload": {"assignee": self.specialist}})
        status, asg2 = leader.call("POST", "/api/cases/CASE-A/actions", {"action": "assign", "expectedVersion": asg1["version"], "payload": {"assignee": self.specialist2}})
        self.assertEqual(status, 200, asg2)
        self.assertEqual(len(asg2.get("assignmentHistory", [])), 2)

        _, drf = specialist2.call("POST", "/api/cases/CASE-A/actions", {"action": "save_draft", "expectedVersion": asg2["version"], "payload": {"draft": "Dự thảo bản sao hợp lệ lần 1."}})
        _, ver = specialist2.call("POST", "/api/cases/CASE-A/actions", {
            "action": "verify_original_register", "expectedVersion": drf["version"],
            "payload": {"evidence": {"outcome": "Khớp sổ gốc và đủ quyền yêu cầu", "registerReference": "Sổ gốc quyển 01", "verificationBasis": "Đã đối chiếu khớp hoàn toàn với sổ gốc."}},
        })
        _, sub = specialist2.call("POST", "/api/cases/CASE-A/actions", {"action": "submit_review", "expectedVersion": ver["version"], "payload": {}})
        status, app1 = leader.call("POST", "/api/cases/CASE-A/actions", {
            "action": "approve", "expectedVersion": sub["version"], "payload": {"note": "Đồng ý ký duyệt lần 1."},
        })
        self.assertEqual(status, 200, app1)
        status, sig1 = leader.call("POST", "/api/cases/CASE-A/actions", {
            "action": "sign_result", "expectedVersion": app1["version"], "payload": {},
        })
        self.assertEqual(status, 200, sig1)
        self.assertIsNotNone(sig1["sandboxSignature"])

        # Registrar detects format issue and returns to leader -> revokes signature
        status, ret_ldr = registrar.call("POST", "/api/cases/CASE-A/actions", {
            "action": "return_to_leader", "expectedVersion": sig1["version"], "payload": {"note": "Sai thể thức trích yếu văn bản, chuyển lãnh đạo xem lại."},
        })
        self.assertEqual(status, 200, ret_ldr)
        self.assertEqual(ret_ldr["status"], "TRINH_DUYET")
        self.assertIsNone(ret_ldr["sandboxSignature"])

        # Leader approves & signs again, then runs post-sign send_back -> revokes signature and reopens DANG_THU_LY
        _, app2 = leader.call("POST", "/api/cases/CASE-A/actions", {
            "action": "approve", "expectedVersion": ret_ldr["version"], "payload": {"note": "Ký duyệt lại lần 2."},
        })
        status, sig2 = leader.call("POST", "/api/cases/CASE-A/actions", {
            "action": "sign_result", "expectedVersion": app2["version"], "payload": {},
        })
        self.assertEqual(status, 200, sig2)
        self.assertIsNotNone(sig2["sandboxSignature"])
        status, sb = leader.call("POST", "/api/cases/CASE-A/actions", {
            "action": "send_back", "expectedVersion": sig2["version"], "payload": {"note": "Thu hồi chữ ký để chuyên viên cập nhật lại số tham chiếu."},
        })
        self.assertEqual(status, 200, sb)
        self.assertEqual(sb["status"], "DANG_THU_LY")
        self.assertIsNone(sb["sandboxSignature"])
        self.assertTrue(any("Thu hồi chữ ký" in e["title"] for e in sb["events"]))

        # Also check close_expired_supplement on CASE-B
        _, req_sup = intake.call("POST", "/api/cases/CASE-B/actions", {
            "action": "request_supplement", "expectedVersion": 1,
            "payload": {"reason": "Bổ sung bản chính giấy tờ tùy thân để đối chiếu.", "items": ["CCCD bản chính"]},
        })
        status, closed_sup = intake.call("POST", "/api/cases/CASE-B/actions", {
            "action": "close_expired_supplement", "expectedVersion": req_sup["version"],
            "payload": {"note": "Quá thời hạn 10 ngày làm việc người nộp không bổ sung hồ sơ."},
        })
        self.assertEqual(status, 200, closed_sup)
        self.assertEqual(closed_sup["status"], "TU_CHOI")

    def test_extend_deadline_mau04_and_electronic_result_docx_download(self) -> None:
        # (d) extend_deadline (Mẫu 04) + (e) issue electronic result .docx & citizen download
        self.add_user("tayho-spec@example.test", "specialist", "UBND phường Tây Hồ")
        tayho_leader_id = self.add_user("tayho-ldr@example.test", "leader", "UBND phường Tây Hồ")
        self.add_user("tayho-reg@example.test", "registrar", "UBND phường Tây Hồ")
        admin = self.client("admin1@example.test")
        self.assertEqual(admin.call("POST", "/api/sandbox-signers", {
            "userId": tayho_leader_id, "action": "grant", "authorityRef": "QD-88/UBND", "reason": "Cấp quyền ký thử nghiệm kết quả điện tử.",
        })[0], 200)

        citizen, code, _ = self.submit_public_case()
        intake = self.client("citizen-intake@example.test")
        spec = self.client("tayho-spec@example.test")
        leader = self.client("tayho-ldr@example.test")
        registrar = self.client("tayho-reg@example.test")
        spec_id = intake.call("GET", "/api/bootstrap")[1]["staff"][0]["id"]

        _, acc = intake.call("POST", f"/api/cases/{code}/actions", {"action": "accept", "expectedVersion": 1, "payload": {}})
        orig_deadline = acc["deadline"]
        _, asg = intake.call("POST", f"/api/cases/{code}/actions", {"action": "assign", "expectedVersion": acc["version"], "payload": {"assignee": spec_id}})

        status, ext = spec.call("POST", f"/api/cases/{code}/actions", {
            "action": "extend_deadline", "expectedVersion": asg["version"],
            "payload": {"addDays": 3, "reason": "Cần xác minh bổ sung sổ hộ tịch lưu trữ nhiều năm.", "apologyNote": "Xin lỗi ông/bà về sự chậm trễ và hẹn trả kết quả mới."},
        })
        self.assertEqual(status, 200, ext)
        self.assertEqual(ext["originalDeadline"], orig_deadline)
        self.assertGreater(ext["deadline"], orig_deadline)
        self.assertEqual(ext["forms"]["mau04"]["newDeadline"], ext["deadline"])
        # Max 1 extension per case
        self.assertEqual(spec.call("POST", f"/api/cases/{code}/actions", {
            "action": "extend_deadline", "expectedVersion": ext["version"],
            "payload": {"addDays": 2, "reason": "Gia hạn lần hai không được phép theo quy định."},
        })[0], 422)

        _, drf = spec.call("POST", f"/api/cases/{code}/actions", {"action": "save_draft", "expectedVersion": ext["version"], "payload": {"draft": "Bản sao trích lục cấp từ sổ gốc hợp lệ."}})
        _, ver = spec.call("POST", f"/api/cases/{code}/actions", {
            "action": "verify_original_register", "expectedVersion": drf["version"],
            "payload": {"evidence": {"outcome": "Khớp sổ gốc và đủ quyền yêu cầu", "registerReference": "Sổ gốc trang 12", "verificationBasis": "Đủ điều kiện cấp bản sao từ sổ gốc."}},
        })
        _, sub = spec.call("POST", f"/api/cases/{code}/actions", {"action": "submit_review", "expectedVersion": ver["version"], "payload": {}})
        _, app_res = leader.call("POST", f"/api/cases/{code}/actions", {
            "action": "approve", "expectedVersion": sub["version"], "payload": {"note": "Phê duyệt kết quả điện tử."},
        })
        status, sig_res = leader.call("POST", f"/api/cases/{code}/actions", {
            "action": "sign_result", "expectedVersion": app_res["version"], "payload": {},
        })
        self.assertEqual(status, 200, sig_res)
        status, issued = registrar.call("POST", f"/api/cases/{code}/actions", {
            "action": "issue", "expectedVersion": sig_res["version"], "payload": {"resultNumber": "18/BS-UBND"},
        })
        self.assertEqual(status, 200, issued)
        self.assertEqual(issued["status"], "DA_PHAT_HANH")
        self.assertEqual(len(issued["result"]["files"]), 1)
        self.assertEqual(issued["result"]["files"][0]["name"], f"Ket-qua-{code}.docx")

        _, pub_lookup = citizen.call("POST", "/api/public/cases/lookup", {"code": code})
        res_file = pub_lookup["case"]["result"]["files"][0]
        self.assertTrue(res_file["downloadUrl"].startswith(f"/api/citizen/documents/{code}/"))
        dl_status, docx_raw, _ = citizen.call_raw("GET", res_file["downloadUrl"], include_csrf=False)
        self.assertEqual(dl_status, 200)
        with zipfile.ZipFile(io.BytesIO(docx_raw)) as zf:
            xml_text = zf.read("word/document.xml").decode("utf-8")
        self.assertIn("18/BS-UBND", xml_text)
        self.assertIn(issued["result"]["signatureHash"], xml_text)
        self.assertEqual(self.citizen_client("citizen2@example.test").call_raw("GET", res_file["downloadUrl"], include_csrf=False)[0], 404)

    def test_public_status_check_returns_zero_pii(self) -> None:
        # (f) Public status check endpoint without authentication, zero PII
        _, code, _ = self.submit_public_case()
        anon = Client(self.base_url)
        status, res = anon.call("GET", f"/api/public/status-check?code={code}")
        self.assertEqual(status, 200, res)
        self.assertEqual(res["case"]["code"], code)
        self.assertEqual(res["case"]["procedureCode"], "2.000908")
        self.assertEqual(res["case"]["status"], "CHO_TIEP_NHAN")
        serialized = json.dumps(res, ensure_ascii=False)
        for pii in ("Test Applicant", "0900000000", "TEST-ID", "Địa chỉ liên hệ", "identity.pdf"):
            self.assertNotIn(pii, serialized)
        self.assertEqual(anon.call("GET", "/api/public/status-check?code=DOES-NOT-EXIST")[0], 404)

    def test_reporting_index766_period_balance_and_http_hardening(self) -> None:
        # (g) index766 + periodBalance + gzip + Content-Type 415 + malicious file rejection + must_change_password citizen
        citizen, code, key = self.submit_public_case()
        with service.connect() as con:
            con.execute("UPDATE cases SET status='HOAN_THANH',version=version+1 WHERE code=?", (code,))
        self.assertEqual(citizen.call("POST", f"/api/public/cases/{code}/actions", {
            "accessKey": key, "action": "feedback", "expectedVersion": 2, "payload": {"score": 5, "content": "Rất hài lòng."},
        })[0], 200)

        admin = self.client("admin1@example.test")
        # Admin zero-PII on bootstrap feedback
        boot = admin.call("GET", "/api/bootstrap")[1]
        self.assertEqual(boot["feedback"], [])
        self.assertIn("index766", boot["stats"])

        today = date.today().isoformat()
        status, report = admin.call("GET", f"/api/reporting/summary?from={today}&to={today}")
        self.assertEqual(status, 200, report)
        idx = report["index766"]
        for k, cap in [("transparency", 18), ("progress", 20), ("onlineAndPayment", 22), ("digitization", 22), ("satisfaction", 18)]:
            self.assertGreaterEqual(idx[k], 0.0)
            self.assertLessEqual(idx[k], float(cap))
        self.assertAlmostEqual(
            idx["totalScore"],
            round(min(100.0, idx["transparency"] + idx["progress"] + idx["onlineAndPayment"] + idx["digitization"] + idx["satisfaction"]), 2),
            places=2,
        )
        pb = report["periodBalance"]
        self.assertEqual(
            pb["openingBacklog"] + pb["receivedInPeriod"],
            pb["resolvedOnTime"] + pb["resolvedOverdue"] + pb["stoppedOrRejected"] + pb["closingBacklog"],
        )

        # Gzip compression on >4KB JSON response + security headers
        gz_status, gz_raw, gz_headers = admin.call_raw("GET", "/api/procedure-categories", headers={"Accept-Encoding": "gzip"}, include_csrf=False)
        self.assertEqual(gz_status, 200)
        self.assertEqual(gz_headers.get("Content-Encoding"), "gzip")
        self.assertEqual(gz_headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(gz_headers.get("X-Frame-Options"), "DENY")
        decompressed = json.loads(gzip.decompress(gz_raw).decode("utf-8"))
        self.assertTrue(decompressed["categories"])
        # Summary payload: categories should not duplicate full submission schemas
        self.assertNotIn("submission", decompressed["categories"][0]["procedures"][0])

        # CSV security headers & malformed date handling in do_GET (400 instead of thread crash)
        self.assertEqual(admin.call("GET", "/api/reporting/summary?from=not-a-date")[0], 400)
        csv_status, _, csv_headers = admin.call_raw("GET", "/api/reporting/summary.csv", include_csrf=False)
        self.assertEqual(csv_status, 200)
        self.assertEqual(csv_headers.get("Cache-Control"), "private, no-store")
        self.assertEqual(csv_headers.get("X-Content-Type-Options"), "nosniff")

        # Content-Type enforcement in read_json() -> 415
        bad_ct_status, _, _ = Client(self.base_url).call_raw("POST", "/api/citizen/auth/login", data=b'{"email":"a@b.c"}', headers={"Content-Type": "text/plain"}, include_csrf=False)
        self.assertEqual(bad_ct_status, 415)

        # Reject PDF /JS and DOCX External TargetMode in save_files()
        with self.assertRaisesRegex(ValueError, "kịch bản"):
            service.save_files("SEC-TEST", [{"name": "evil.pdf", "data": base64.b64encode(b"%PDF-1.4\n/OpenAction << /S /JavaScript /JS (app.alert(1)) >>\n%%EOF").decode()}])
        ext_docx = io.BytesIO()
        with zipfile.ZipFile(ext_docx, "w") as zf:
            zf.writestr("[Content_Types].xml", "<Types/>")
            zf.writestr("word/document.xml", "<document/>")
            zf.writestr("word/_rels/document.xml.rels", '<Relationships><Relationship Id="rId1" Target="https://evil.example/x" TargetMode="External"/></Relationships>')
        with self.assertRaisesRegex(ValueError, "liên kết ngoài"):
            service.save_files("SEC-TEST", [{"name": "ext.docx", "data": base64.b64encode(ext_docx.getvalue()).decode()}])

        # Enforce must_change_password on require_citizen() except password-change/logout
        with service.connect() as con:
            con.execute("UPDATE users SET must_change_password=1 WHERE id=?", (self.other_citizen_user,))
        forced_cit = self.citizen_client("citizen2@example.test")
        self.assertEqual(forced_cit.call("GET", "/api/citizen/cases")[0], 403)
        self.assertEqual(forced_cit.call("POST", "/api/citizen/change-password", {
            "currentPassword": PASSWORD, "newPassword": "UpdatedPassword2026", "confirmPassword": "UpdatedPassword2026",
        })[0], 200)
        self.assertEqual(forced_cit.call("GET", "/api/citizen/cases")[0], 200)

        # Legacy BLOB password_salt/password_hash compatibility + short exam password '123'
        blob_salt = b"0123456789abcdef"
        blob_hash = service.password_hash("123", blob_salt)
        with service.connect() as con:
            con.execute(
                """INSERT INTO users(id,email,full_name,password_salt,password_hash,role,active,agency_scope,must_change_password,created_at,updated_at)
                   VALUES(?,?,?,?,?,'citizen',1,'',0,?,?)""",
                (str(uuid.uuid4()), "blob-citizen@example.test", "Blob Citizen", blob_salt, blob_hash, service.now_iso(), service.now_iso()),
            )
            con.execute(
                """INSERT INTO users(id,email,full_name,password_salt,password_hash,role,active,agency_scope,must_change_password,created_at,updated_at)
                   VALUES(?,?,?,?,?,'leader',1,'Ward A',0,?,?)""",
                (str(uuid.uuid4()), "blob-leader@example.test", "Blob Leader", blob_salt, blob_hash, service.now_iso(), service.now_iso()),
            )
        self.assertEqual(Client(self.base_url).login_citizen("blob-citizen@example.test", "123")[0], 200)
        self.assertEqual(Client(self.base_url).login("blob-leader@example.test", "123")[0], 200)


if __name__ == "__main__":
    unittest.main()
