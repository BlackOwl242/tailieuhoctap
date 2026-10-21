"""Exercise recovered workflows against a disposable database and uploads folder."""
import base64
import hashlib
import http.cookiejar
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta
from pathlib import Path

import app


class Client:
    def __init__(self, url):
        self.url = url
        self.csrf = ''
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def call(self, path, body=None, csrf=True):
        headers = {'Content-Type': 'application/json'}
        if self.csrf and csrf:
            headers['X-CSRF-Token'] = self.csrf
        req = urllib.request.Request(self.url + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
        try:
            with self.opener.open(req) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def login(self, role):
        status, result = self.call('/api/auth/login', {'email': role + '@recovery.test', 'password': 'RecoveryTest2026Password'})
        assert status == 200, result
        self.csrf = result['csrfToken']
        return self


class RecoveredWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='admin-recovered-tests-')
        cls.previous = (app.DATA_DIR, app.DB_PATH, app.UPLOAD_DIR)
        app.DATA_DIR = Path(cls.temp.name)
        app.DB_PATH = app.DATA_DIR / 'test.sqlite3'
        app.UPLOAD_DIR = app.DATA_DIR / 'uploads'
        app.init_db()
        with app.connect() as con:
            for name, role, scope in [('intake', 'intake', 'UBND phường Kiểm thử A'), ('other', 'intake', 'UBND phường Kiểm thử B'), ('finance', 'finance', 'UBND phường Kiểm thử A'), ('finance2', 'finance', 'UBND phường Kiểm thử A'), ('admin', 'admin', 'Toàn thành phố'), ('leader', 'leader', 'UBND phường Kiểm thử A')]:
                salt = uuid.uuid4().bytes
                now = app.now_iso()
                con.execute('INSERT INTO users(id,email,full_name,password_salt,password_hash,role,active,agency_scope,created_at,updated_at) VALUES(?,?,?,?,?,?,1,?,?,?)',
                            (name, name + '@recovery.test', name, salt.hex(), app.password_hash('RecoveryTest2026Password', salt).hex(), role, scope, now, now))
        cls.server = app.ThreadingHTTPServer(('127.0.0.1', 0), app.AppHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join(3)
        app.DATA_DIR, app.DB_PATH, app.UPLOAD_DIR = cls.previous
        cls.temp.cleanup()

    def setUp(self):
        with app.PUBLIC_ATTEMPTS_LOCK:
            app.PUBLIC_ATTEMPTS.clear()
        with app.connect() as con:
            con.execute('DELETE FROM public_appointment_events')
            con.execute('DELETE FROM public_feedback_events')
            con.execute('DELETE FROM public_appointments')
            con.execute('DELETE FROM public_pakn')
            con.execute('DELETE FROM cases')
        self.public = Client(self.url)

    def client(self, role):
        return Client(self.url).login(role)

    def case(self, code='RECOVERY-CASE'):
        key = 'a' * 64
        payload = {'code': code, 'procedureCode': '1.004237', 'agencyScope': 'UBND phường Kiểm thử A', 'receivingAgency': 'UBND phường Kiểm thử A', 'applicant': {'name': 'Test applicant', 'phone': '0900000000'}, 'fee': {'status': 'DUE', 'amount': 20000, 'basis': 'Căn cứ khoản thu của dữ liệu kiểm thử'}, 'attachments': []}
        with app.connect() as con:
            con.execute('INSERT INTO cases(code,owner_id,procedure_code,status,payload_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', (code, hashlib.sha256(key.encode()).hexdigest(), '1.004237', 'DA_TIEP_NHAN', json.dumps(payload), app.now_iso(), app.now_iso()))
        return key

    def action(self, key, action, payload, version):
        return self.public.call('/api/public/cases/RECOVERY-CASE/actions', {'accessKey': key, 'action': action, 'expectedVersion': version, 'payload': payload})

    def counter(self):
        return {'procedureCode': '2.000908', 'receivingAgency': 'UBND phường Kiểm thử A', 'applicantType': 'citizen', 'applicantName': 'Người nộp kiểm thử', 'citizenId': 'TEST-ID', 'applicantPhone': '0900000000', 'applicantAddress': 'Địa chỉ kiểm thử', 'requestSummary': 'Đề nghị giải quyết hồ sơ tại quầy', 'paperOriginals': 'Bản gốc và bản sao đã đối chiếu', 'identityVerified': True, 'submissionKey': str(uuid.uuid4())}

    def test_counter_scope_csrf_and_duplicate_submission(self):
        intake = self.client('intake'); body = self.counter()
        self.assertEqual(intake.call('/api/cases/counter', body, csrf=False)[0], 403)
        self.assertEqual(self.client('other').call('/api/cases/counter', body)[0], 422)
        self.assertEqual(self.client('admin').call('/api/cases/counter', body)[0], 403)
        status, result = intake.call('/api/cases/counter', body)
        self.assertEqual(status, 201, result)
        self.assertEqual(result['case']['status'], 'DA_TIEP_NHAN')
        again = intake.call('/api/cases/counter', body)
        self.assertTrue(again[1]['duplicate'])
        self.assertEqual(again[1]['case']['code'], result['case']['code'])
        self.assertNotIn('accessKey', result)

    def test_counter_digitization_needs_actual_file_and_preserves_original(self):
        intake = self.client('intake')
        _, result = intake.call('/api/cases/counter', self.counter())
        case = result['case']; endpoint = f"/api/cases/{case['code']}/actions"
        body = {'action': 'digitize_documents', 'expectedVersion': case['version'], 'payload': {'pageCount': 1, 'documentRegister': 'Bản quét giấy tờ đã nhận', 'files': []}}
        self.assertEqual(intake.call(endpoint, body)[0], 422)
        body['payload']['files'] = [{'name': 'scan.pdf', 'type': 'application/pdf', 'data': base64.b64encode(b'%PDF-1.4\nTest real uploaded bytes\n%%EOF').decode()}]
        status, result = intake.call(endpoint, body)
        self.assertEqual(status, 200, result)
        self.assertEqual(result['digitization']['status'], 'DA_SO_HOA')
        self.assertEqual(len(result['attachments']), 1)
        stored = list((app.UPLOAD_DIR / case['code']).iterdir())
        self.assertEqual(len(stored), 1)
        self.assertIn(b'Test real uploaded bytes', stored[0].read_bytes())

    def test_payment_requires_evidence_and_reconciliation_document(self):
        key = self.case(); status, created = self.action(key, 'create_payment', {}, 1)
        self.assertEqual(status, 200, created)
        case = created['case']; ref = case['payments'][0]['transactionRef']
        self.assertEqual(self.action(key, 'confirm_payment', {'transactionRef': ref}, case['version'])[0], 422)
        status, declared = self.action(key, 'confirm_payment', {'transactionRef': ref, 'paymentMethod': 'BANK_TRANSFER', 'paymentEvidence': 'BANK-TEST-001'}, case['version'])
        self.assertEqual(status, 200, declared)
        self.assertEqual(declared['case']['payments'][0]['payerReference'], 'BANK-TEST-001')
        finance = self.client('finance'); version = declared['case']['version']
        self.assertEqual(finance.call(f'/api/payments/{ref}/reconcile', {'expectedVersion': version})[0], 422)
        status, reconciled = finance.call(f'/api/payments/{ref}/reconcile', {'expectedVersion': version, 'statementReference': 'STATEMENT-TEST-001'})
        self.assertEqual(status, 200, reconciled)
        payment = finance.call('/api/payments')[1]['payments'][0]
        self.assertEqual(payment['reconciliationReference'], 'STATEMENT-TEST-001')

    def test_refund_approval_and_execution_are_separate_and_atomic(self):
        self.case()
        with app.connect() as con:
            row = con.execute("SELECT id FROM cases WHERE code='RECOVERY-CASE'").fetchone()
            con.execute("UPDATE cases SET status='DUNG' WHERE id=?", (row['id'],))
            con.execute("INSERT INTO payment_records(case_id,transaction_ref,amount,status,basis,created_at) VALUES(?,'REF-TEST',20000,'RECONCILED','Test basis',?)", (row['id'], app.now_iso()))
        finance = self.client('finance'); other = self.client('finance2'); base = '/api/payments/REF-TEST/'
        self.assertEqual(finance.call(base + 'refund-request', {'reason': 'Đề nghị hoàn khoản thu kiểm thử'})[0], 200)
        approval = {'decision': 'APPROVE', 'note': 'Đã đối chiếu hồ sơ kiểm thử', 'expectedVersion': 1}
        self.assertEqual(finance.call(base + 'refund-review', approval)[0], 403)
        self.assertEqual(other.call(base + 'refund-review', approval)[0], 200)
        payment = finance.call('/api/payments')[1]['payments'][0]
        self.assertEqual(payment['status'], 'RECONCILED'); self.assertEqual(payment['refund']['status'], 'APPROVED')
        self.assertEqual(finance.call(base + 'refund-request', {'reason': 'Không được lập đề nghị trùng lặp'})[0], 422)
        self.assertEqual(other.call(base + 'refund-execute', {'expectedVersion': 9, 'executionReference': 'REFUND-001'})[0], 409)
        self.assertEqual(finance.call('/api/payments')[1]['payments'][0]['refund']['status'], 'APPROVED')
        self.assertEqual(other.call(base + 'refund-execute', {'expectedVersion': 1})[0], 422)
        self.assertEqual(other.call(base + 'refund-execute', {'expectedVersion': 1, 'executionReference': 'REFUND-001'})[0], 200)
        payment = finance.call('/api/payments')[1]['payments'][0]
        self.assertEqual(payment['status'], 'REFUNDED'); self.assertEqual(payment['refund']['execution_reference'], 'REFUND-001')
        self.assertEqual(other.call(base + 'refund-execute', {'expectedVersion': 2, 'executionReference': 'REFUND-001'})[0], 422)

    def test_appointment_lookup_scope_status_and_audit(self):
        day = datetime.now(app.TZ).date() + timedelta(days=1)
        while not app.is_workday(day): day += timedelta(days=1)
        body = {'name': 'Người hẹn kiểm thử', 'phone': '0900000000', 'agency': 'UBND phường Kiểm thử A', 'procedureCode': '2.000908', 'date': day.isoformat(), 'timeSlot': '08:00-09:00'}
        status, created = self.public.call('/api/public/appointments', body)
        self.assertEqual(status, 201, created)
        code = created['code']
        self.assertEqual(self.public.call('/api/public/service-lookup', {'code': code, 'phone': '0911111111'})[0], 404)
        self.assertEqual(self.public.call('/api/public/service-lookup', {'code': code, 'phone': body['phone']})[0], 200)
        self.assertEqual(self.client('other').call('/api/service-desk')[1]['appointments'], [])
        self.assertEqual(self.client('admin').call('/api/service-desk')[1]['appointments'], [])
        intake = self.client('intake'); update = {'code': code, 'expectedStatus': 'BOOKED', 'status': 'COMPLETED', 'note': 'Ghi chú xử lý kiểm thử'}
        self.assertEqual(intake.call('/api/service-desk/update', update)[0], 422)
        update['status'] = 'CONFIRMED'
        self.assertEqual(intake.call('/api/service-desk/update', update)[0], 200)
        self.assertEqual(intake.call('/api/service-desk/update', update)[0], 409)
        with app.connect() as con:
            self.assertEqual(con.execute('SELECT count(*) FROM public_appointment_events WHERE appointment_code=?', (code,)).fetchone()[0], 1)

    def test_feedback_reply_is_scoped_and_not_overwritten(self):
        body = {'name': 'Người gửi kiểm thử', 'phone': '0900000000', 'agency': 'UBND phường Kiểm thử A', 'title': 'Góp ý chất lượng phục vụ', 'content': 'Đề nghị bổ sung hướng dẫn tại bộ phận tiếp nhận.'}
        status, result = self.public.call('/api/public/pakn', body)
        self.assertEqual(status, 201, result)
        update = {'code': result['code'], 'expectedStatus': 'RECEIVED', 'note': 'Đã tiếp nhận góp ý và chuyển bộ phận phụ trách.'}
        self.assertEqual(self.client('other').call('/api/service-desk/update', update)[0], 404)
        self.assertEqual(self.client('intake').call('/api/service-desk/update', update)[0], 200)
        self.assertEqual(self.client('intake').call('/api/service-desk/update', {**update, 'expectedStatus': 'REPLIED'})[0], 422)
        record = self.public.call('/api/public/service-lookup', {'code': result['code'], 'phone': body['phone']})[1]['record']
        self.assertEqual(record['reply'], update['note'])

    def test_startup_does_not_delete_legacy_case_or_generate_samples(self):
        self.case()
        with app.connect() as con:
            con.execute("UPDATE cases SET owner_id='demo-recovery' WHERE code='RECOVERY-CASE'")
        app.init_db(); app.init_db()
        with app.connect() as con:
            self.assertEqual(con.execute('SELECT count(*) FROM cases').fetchone()[0], 1)
            self.assertEqual(con.execute("SELECT owner_id FROM cases WHERE code='RECOVERY-CASE'").fetchone()[0], 'demo-recovery')

    def test_malformed_payload_is_rejected_without_internal_error(self):
        self.assertEqual(self.public.call('/api/public/appointments', [1, 2])[0], 422)
        self.assertEqual(self.public.call('/api/public/service-lookup', {'code': 'LH-TEST', 'phone': 'điện thoại không hợp lệ'})[0], 422)


if __name__ == '__main__':
    unittest.main()
