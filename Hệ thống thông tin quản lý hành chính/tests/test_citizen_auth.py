"""Citizen authentication and ownership regression checks using disposable data.
Run with: python -m unittest discover -s tests -p test_citizen_auth.py
"""
import base64
import http.cookiejar
import json
import secrets
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import app as service

PASSWORD = 'CitizenReview2026'

class Client:
    def __init__(self, url):
        self.url = url
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
        self.csrf = ''

    def call(self, path, body=None, csrf=True):
        headers = {}
        if body is not None:
            headers['Content-Type'] = 'application/json'
            if csrf and self.csrf:
                headers['X-CSRF-Token'] = self.csrf
        request = urllib.request.Request(self.url + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
        try:
            response = self.opener.open(request)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            raw = response.read()
            return response.status, json.loads(raw) if 'json' in response.headers.get('Content-Type', '') else raw.decode('utf-8')

    def register(self, email):
        status, result = self.call('/api/citizen/auth/register', {'name': 'Citizen Test', 'email': email, 'phone': '0900000000', 'password': PASSWORD, 'confirmPassword': PASSWORD, 'role': 'admin', 'active': False})
        if status == 201:
            self.csrf = result['csrfToken']
        return status, result

class CitizenAuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='hanoi-citizen-auth-')
        cls.previous = (service.DATA_DIR, service.DB_PATH, service.UPLOAD_DIR)
        service.DATA_DIR = Path(cls.temp.name)
        service.DB_PATH = service.DATA_DIR / 'test.sqlite3'
        service.UPLOAD_DIR = service.DATA_DIR / 'uploads'
        service.init_db()
        salt = secrets.token_bytes(16)
        with service.connect() as con:
            con.execute("INSERT INTO users(id,email,full_name,password_salt,password_hash,role,agency_scope,created_at,updated_at) VALUES('staff','staff@example.test','Staff Test',?,?,'intake','UBND phường Tây Hồ',?,?)", (salt.hex(), service.password_hash(PASSWORD, salt).hex(), service.now_iso(), service.now_iso()))
        cls.server = service.ThreadingHTTPServer(('127.0.0.1', 0), service.AppHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join()
        service.DATA_DIR, service.DB_PATH, service.UPLOAD_DIR = cls.previous
        cls.temp.cleanup()

    def setUp(self):
        service.AUTH_ATTEMPTS.clear(); service.PUBLIC_ATTEMPTS.clear()

    def citizen(self):
        client = Client(self.url)
        status, result = client.register(uuid.uuid4().hex + '@example.test')
        self.assertEqual(status, 201, result)
        self.assertEqual(result['user']['role'], 'citizen')
        self.assertFalse(result['user']['emailVerified'])
        return client, result

    def test_installer_preserves_existing_citizen_credentials_and_status(self):
        from scripts.provision_citizen_account import EMAIL, provision
        with service.connect() as con:
            self.assertTrue(provision(con))
            row = con.execute('SELECT * FROM users WHERE email=?', (EMAIL,)).fetchone()
            self.assertEqual(row['role'], 'citizen')
            salt = secrets.token_bytes(16)
            changed_hash = service.password_hash('ChangedCitizen2026', salt).hex()
            con.execute('UPDATE users SET password_salt=?,password_hash=?,active=0 WHERE id=?', (salt.hex(), changed_hash, row['id']))
            self.assertFalse(provision(con))
            kept = con.execute('SELECT * FROM users WHERE email=?', (EMAIL,)).fetchone()
            self.assertEqual(kept['id'], row['id'])
            self.assertEqual(kept['password_hash'], changed_hash)
            self.assertEqual(kept['password_salt'], salt.hex())
            self.assertEqual(kept['active'], 0)
            self.assertEqual(kept['role'], 'citizen')

    def test_anonymous_services_require_login(self):
        client = Client(self.url)
        for path in ['/api/cases', '/api/public/cases/lookup', '/api/public/appointments', '/api/public/pakn', '/api/public/service-lookup']:
            self.assertEqual(client.call(path, {})[0], 401, path)
        self.assertEqual(client.call('/api/citizen/cases')[0], 401)
        self.assertEqual(client.call('/api/procedures')[0], 200)

    def test_registration_login_logout_and_validation(self):
        client, result = self.citizen()
        self.assertEqual(client.call('/api/citizen/auth/me')[1]['user']['id'], result['user']['id'])
        self.assertEqual(client.call('/api/citizen/auth/logout', {}, csrf=False)[0], 403)
        self.assertEqual(client.call('/api/citizen/auth/logout', {})[0], 200)
        self.assertIsNone(client.call('/api/citizen/auth/me')[1]['user'])
        self.assertEqual(client.call('/api/citizen/auth/login', {'email': result['user']['email'], 'password': 'wrong'})[0], 401)
        self.assertEqual(client.call('/api/citizen/auth/login', {'email': result['user']['email'], 'password': PASSWORD})[0], 200)
        self.assertEqual(client.call('/api/citizen/auth/register', {'email': 'bad', 'password': '123'})[0], 422)

    def test_citizen_cannot_enter_staff_or_escalate_role(self):
        client, result = self.citizen()
        for path in ['/api/bootstrap', '/api/users', '/api/auth/account', '/api/service-desk', '/api/cases/CASE-A']:
            self.assertEqual(client.call(path)[0], 401, path)
        self.assertEqual(client.call('/api/users', {'role': 'admin'})[0], 401)
        self.assertEqual(client.call('/api/auth/login', {'email': result['user']['email'], 'password': PASSWORD})[0], 403)
        self.assertIsNone(client.call('/api/auth/me')[1]['user'])
        with client.opener.open(self.url + '/staff') as response:
            self.assertEqual(response.url, self.url + '/')
        with service.connect() as con:
            row = con.execute('SELECT role,active FROM users WHERE id=?', (result['user']['id'],)).fetchone()
            self.assertEqual(row['role'], 'citizen'); self.assertEqual(row['active'], 1)

    def test_staff_and_citizen_sessions_stay_separate(self):
        client, result = self.citizen()
        status, staff = client.call('/api/auth/login', {'email': 'staff@example.test', 'password': PASSWORD})
        self.assertEqual(status, 200)
        self.assertEqual(client.call('/api/auth/me')[1]['user']['role'], 'intake')
        self.assertEqual(client.call('/api/citizen/auth/me')[1]['user']['role'], 'citizen')
        self.assertEqual(client.call('/api/citizen/auth/login', {'email': 'staff@example.test', 'password': PASSWORD})[0], 403)
        self.assertEqual(client.call('/api/citizen/auth/logout', {})[0], 200)
        self.assertEqual(client.call('/api/auth/me')[1]['user']['role'], 'intake')
        self.assertEqual(client.call('/api/bootstrap')[0], 200)

    def submit(self, client):
        body = {'submissionKey': str(uuid.uuid4()), 'submissionToken': secrets.token_hex(32), 'procedureCode': '2.000908', 'applicantType': 'citizen', 'applicant': {'name': 'Citizen Test', 'phone': '0900000000'}, 'receivingAgency': 'UBND phường Tây Hồ', 'schemaVersion': '2.000908-858-2026-v1', 'confirmed': True, 'deliveryMethod': 'Trực tiếp', 'declaration': {'address': 'Địa chỉ kiểm thử', 'identityType': 'Thẻ căn cước', 'identityNumber': 'TEST-ID', 'relation': 'Người được cấp bản chính', 'originalOwner': 'Citizen Test', 'documentName': 'Giấy tờ kiểm thử', 'registerAuthority': 'UBND phường Tây Hồ', 'copies': '1'}, 'files': [{'name': 'identity.pdf', 'data': base64.b64encode(b'%PDF-test-only').decode(), 'componentId': 'identity'}]}
        self.assertEqual(client.call('/api/cases', body, csrf=False)[0], 403)
        status, result = client.call('/api/cases', body)
        self.assertEqual(status, 201, result)
        self.assertEqual(client.call('/api/cases', body)[1]['code'], result['code'])
        return result['code']

    def test_case_submission_ownership_and_cross_account_denial(self):
        client, account = self.citizen(); other, _ = self.citizen()
        code = self.submit(client)
        self.assertIn(code, [case['code'] for case in client.call('/api/citizen/cases')[1]['cases']])
        self.assertNotIn(code, [case['code'] for case in other.call('/api/citizen/cases')[1]['cases']])
        self.assertEqual(client.call('/api/public/cases/lookup', {'code': code})[0], 200)
        with service.connect() as con:
            secret = con.execute('SELECT encrypted_key FROM case_lookup_secrets v JOIN cases c ON c.id=v.case_id WHERE c.code=?', (code,)).fetchone()[0]
        key = service.lookup_cipher().decrypt(secret).decode()
        self.assertEqual(other.call('/api/public/cases/lookup', {'code': code, 'accessKey': key})[0], 404)
        self.assertEqual(other.call(f'/api/public/cases/{code}/actions', {'accessKey': key, 'action': 'feedback', 'expectedVersion': 1, 'payload': {'score': 5}})[0], 404)

    def test_public_feedback_belongs_to_sender(self):
        client, _ = self.citizen(); other, _ = self.citizen()
        status, result = client.call('/api/public/pakn', {'name': 'Citizen Test', 'phone': '0900000000', 'agency': 'UBND phường Tây Hồ', 'title': 'Phản ánh kiểm thử', 'content': 'Nội dung kiểm thử quyền truy cập phản ánh theo tài khoản.'})
        self.assertEqual(status, 201, result)
        body = {'code': result['code'], 'phone': '0900000000'}
        self.assertEqual(client.call('/api/public/service-lookup', body)[0], 200)
        self.assertEqual(other.call('/api/public/service-lookup', body)[0], 404)

if __name__ == '__main__':
    unittest.main()
