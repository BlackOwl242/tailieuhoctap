"""HTTP-level regression checks for the locally hosted application.

All records and uploads stay in a disposable temporary directory. These tests
exercise the implemented boundary; they do not certify a government integration.
"""

from __future__ import annotations

import http.cookiejar
import base64
import json
import os
import secrets
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
from datetime import date, timedelta
from pathlib import Path


TEMP_DATA = tempfile.TemporaryDirectory(prefix="hanoi-services-tests-")
os.environ["HANOI_DATA_DIR"] = TEMP_DATA.name
os.environ["HANOI_DB_PATH"] = str(Path(TEMP_DATA.name) / "test.sqlite3")

import app as service  # noqa: E402


PASSWORD = "ReviewPassword2026"


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

    def login(self, email: str, password: str = PASSWORD):
        status, data = self.call("POST", "/api/auth/login", {"email": email, "password": password}, include_csrf=False)
        if status == 200:
            self.csrf = data["csrfToken"]
        return status, data


class ApplicationAccessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
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
        TEMP_DATA.cleanup()

    def setUp(self) -> None:
        with service.PUBLIC_ATTEMPTS_LOCK:
            service.PUBLIC_ATTEMPTS.clear()
        with service.connect() as con:
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
        self.leader = self.add_user("reviewer-leader@example.test", "leader", "Ward A")
        self.registrar = self.add_user("registrar@example.test", "registrar", "Ward A")
        self.other_unit = self.add_user("other@example.test", "specialist", "Ward B")
        self.add_case("CASE-A", "Ward A")
        self.add_case("CASE-B", "Ward A")

    def add_user(self, email: str, role: str, scope: str = "Ward A") -> str:
        salt = os.urandom(16)
        user_id = str(uuid.uuid4())
        today = date.today().isoformat()
        valid_until = (date.today() + timedelta(days=300)).isoformat()
        with service.connect() as con:
            con.execute(
                """INSERT INTO users(id,email,full_name,password_salt,password_hash,role,active,
                   agency_scope,valid_from,valid_until,created_at,updated_at)
                   VALUES(?,?,?,?,?,?,1,?,?,?,?,?)""",
                (user_id, email, email.split("@")[0], salt.hex(), service.password_hash(PASSWORD, salt).hex(),
                 role, scope, today, valid_until, service.now_iso(), service.now_iso()),
            )
        return user_id

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
        public = client or Client(self.base_url)
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
        status, result = public.call("POST", "/api/cases", body, include_csrf=False)
        self.assertEqual(status, 201, result)
        self.assertNotIn("accessKey", result)
        with service.connect() as con:
            encrypted = con.execute("SELECT encrypted_key FROM case_lookup_secrets v JOIN cases c ON c.id=v.case_id WHERE c.code=?", (result["code"],)).fetchone()[0]
        lookup_key = service.lookup_cipher().decrypt(encrypted).decode()
        self.assertNotEqual(lookup_key, access_key)
        return public, result["code"], lookup_key

    def test_citizen_submission_tracking_and_receipt_secret(self) -> None:
        public, code, access_key = self.submit_public_case()
        status, result = public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": access_key}, include_csrf=False)
        self.assertEqual(status, 200)
        self.assertEqual(result["case"]["status"], "CHO_TIEP_NHAN")
        self.assertEqual([p["state"] for p in result["case"]["progress"]], ["completed", "current", "pending", "pending", "pending", "pending"])
        self.assertEqual(result["case"]["declaration"]["copies"], "1")
        self.assertEqual(result["case"]["applicant"]["name"], "Test Applicant")
        self.assertEqual(len(result["case"]["events"]), 1)
        self.assertNotIn("citizenId", result["case"]["applicant"])
        self.assertEqual(public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": secrets.token_hex(32)}, include_csrf=False)[0], 404)

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
        public = Client(self.base_url)
        body = {
            "submissionKey": str(uuid.uuid4()), "accessKey": secrets.token_hex(32),
            "procedureCode": "2.000908", "applicantType": "citizen",
            "applicant": {"name": "Test Applicant", "phone": "0900000000", "email": ""},
            "receivingAgency": "Ward A", "requestSummary": "Đề nghị cấp bản sao theo hồ sơ lưu trữ của gia đình.", "files": [],
        }
        self.assertEqual(public.call("POST", "/api/cases", body, include_csrf=False)[0], 422)
        status, result = public.call("GET", "/api/public/agencies")
        self.assertEqual(status, 200)
        self.assertIn("UBND phường Tây Hồ", result["agencies"])
        self.assertNotIn("Toàn thành phố", result["agencies"])

    def test_unconfirmed_or_unselected_submission_does_not_create_a_case(self) -> None:
        public = Client(self.base_url)
        body = {"submissionKey": str(uuid.uuid4()), "accessKey": secrets.token_hex(32), "procedureCode": "2.000908", "schemaVersion": "2.000908-858-2026-v1", "confirmed": False, "applicantType": "citizen", "applicant": {"name": "Test Applicant", "phone": "0900000000"}, "receivingAgency": "UBND phường Tây Hồ", "files": []}
        with service.connect() as con: before = con.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
        status, result = public.call("POST", "/api/cases", body, include_csrf=False)
        self.assertEqual(status, 422)
        self.assertIn("xác nhận", result["error"])
        body["procedureCode"] = ""
        self.assertEqual(public.call("POST", "/api/cases", body, include_csrf=False)[0], 422)
        with service.connect() as con: self.assertEqual(con.execute("SELECT COUNT(*) FROM cases").fetchone()[0], before)

    def test_citizen_supplement_uses_the_staff_case_workflow(self) -> None:
        _, code, access_key = self.submit_public_case()
        intake = self.client("citizen-intake@example.test")
        status, accepted = intake.call("POST", f"/api/cases/{code}/actions", {"action": "accept", "expectedVersion": 1, "payload": {}})
        self.assertEqual(status, 200)
        status, requested = intake.call("POST", f"/api/cases/{code}/actions", {"action": "request_supplement", "expectedVersion": accepted["version"], "payload": {"reason": "Thiếu một giấy tờ cần thiết để tiếp tục kiểm tra.", "items": ["Bổ sung bản chụp giấy tờ liên quan."]}})
        self.assertEqual(status, 200)
        public = Client(self.base_url)
        status, updated = public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": access_key, "action": "submit_supplement", "expectedVersion": requested["version"], "payload": {"note": "Đã bổ sung giấy tờ theo hướng dẫn.", "files": []}}, include_csrf=False)
        self.assertEqual(status, 200)
        self.assertEqual(updated["case"]["status"], "DA_TIEP_NHAN")
        self.assertEqual(updated["case"]["events"][-1]["title"], "Người dân đã gửi nội dung bổ sung")
        self.assertEqual(public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": secrets.token_hex(32), "action": "submit_supplement", "expectedVersion": updated["case"]["version"], "payload": {"note": "Không được phép."}}, include_csrf=False)[0], 404)

    def test_citizen_feedback_is_only_available_after_a_closed_case(self) -> None:
        _, code, access_key = self.submit_public_case()
        with service.connect() as con:
            con.execute("UPDATE cases SET status='HOAN_THANH',version=version+1 WHERE code=?", (code,))
        public = Client(self.base_url)
        status, lookup = public.call("POST", "/api/public/cases/lookup", {"code": code, "accessKey": access_key}, include_csrf=False)
        self.assertEqual(status, 200)
        case = lookup["case"]
        status, result = public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": access_key, "action": "feedback", "expectedVersion": case["version"], "payload": {"score": 5, "content": "Thông tin cập nhật rõ ràng."}}, include_csrf=False)
        self.assertEqual(status, 200)
        self.assertTrue(result["case"]["feedbackSubmitted"])
        self.assertEqual(public.call("POST", f"/api/public/cases/{code}/actions", {"accessKey": access_key, "action": "feedback", "expectedVersion": result["case"]["version"], "payload": {"score": 5, "content": "Gửi lại đánh giá."}}, include_csrf=False)[0], 422)

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
        status, submitted = specialist.call("POST", "/api/cases/CASE-A/actions", {"action": "submit_review", "expectedVersion": drafted["version"], "payload": {}})
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


if __name__ == "__main__":
    unittest.main()
