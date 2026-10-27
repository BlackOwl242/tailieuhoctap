"""Owner-scoped citizen workspace. GET requests never change business state."""
import json
import secrets
import hashlib
import re
from urllib.parse import quote


def init_schema(con):
    con.executescript('''
        CREATE TABLE IF NOT EXISTS citizen_notification_reads (
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            event_key TEXT NOT NULL, read_at TEXT NOT NULL,
            PRIMARY KEY(user_id,event_key));
        CREATE TABLE IF NOT EXISTS citizen_drafts (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            procedure_code TEXT NOT NULL, details_json TEXT NOT NULL,
            version INTEGER NOT NULL, updated_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_citizen_drafts_owner ON citizen_drafts(user_id,updated_at);
    ''')


def snapshot(service, con, user):
    rows = con.execute('SELECT c.* FROM cases c JOIN citizen_record_owners o ON o.record_code=c.code WHERE o.user_id=? ORDER BY c.created_at DESC', (user['id'],)).fetchall()
    cases = [service.public_case_view(con, row) for row in rows]
    appointments = [dict(row) for row in con.execute('SELECT a.* FROM public_appointments a JOIN citizen_record_owners o ON o.record_code=a.code WHERE o.user_id=? ORDER BY a.created_at DESC', (user['id'],))]
    feedback = [dict(row) for row in con.execute('SELECT a.* FROM public_pakn a JOIN citizen_record_owners o ON o.record_code=a.code WHERE o.user_id=? ORDER BY a.created_at DESC', (user['id'],))]
    documents, notifications = [], []
    has_sample_data = False
    for row, case in zip(rows, cases):
        payload = json.loads(row['payload_json'])
        has_sample_data = has_sample_data or bool(payload.get('demoCitizenDataset'))
        for event in case['events']:
            notifications.append({'id': f"case:{row['id']}:{event['id']}", 'kind': 'case', 'code': case['code'], 'title': event['title'], 'detail': event['detail'], 'at': event['at']})
        candidates = [(item, 'Giấy tờ đã gửi') for item in payload.get('attachments', []) if isinstance(item, dict)]
        if row['status'] in {'DA_PHAT_HANH', 'HOAN_THANH'}:
            candidates.extend((item, 'Kết quả giải quyết') for item in (payload.get('result') or {}).get('files', []) if isinstance(item, dict))
        withdrawal = payload.get('withdrawal') or {}
        if withdrawal.get('status') == 'DA_PHAT_HANH' and isinstance(withdrawal.get('noticeFile'), dict):
            candidates.append((withdrawal['noticeFile'], 'Thông báo đã phát hành'))
        for item, kind in candidates:
            if not item.get('stored'):
                continue
            documents.append({'id': f"{case['code']}:{item['stored']}", 'code': case['code'], 'name': item.get('name', 'Tài liệu'), 'size': item.get('size', 0), 'kind': kind, 'at': row['updated_at'], 'downloadUrl': f"/api/citizen/documents/{quote(case['code'], safe='')}/{quote(item['stored'], safe='')}"})
    for item in appointments:
        note_hash = hashlib.sha256(item['counter_note'].encode()).hexdigest()[:16]
        notifications.append({'id': f"appointment:{item['code']}:{item['status']}:{note_hash}", 'kind': 'appointment', 'code': item['code'], 'title': 'Cập nhật lịch hẹn', 'detail': item['counter_note'] or f"{item['appointment_date']} · {item['time_slot']} · {item['agency']}", 'at': item['created_at']})
    for item in feedback:
        notifications.append({'id': f"feedback:{item['code']}:{item['status']}:{item['replied_at'] or ''}", 'kind': 'feedback', 'code': item['code'], 'title': 'Phản ánh đã được trả lời' if item['reply'] else 'Đã ghi nhận phản ánh', 'detail': item['title'], 'at': item['replied_at'] or item['created_at']})
    reads = {row['event_key'] for row in con.execute('SELECT event_key FROM citizen_notification_reads WHERE user_id=?', (user['id'],))}
    notifications.sort(key=lambda item: item['at'], reverse=True)
    notifications = notifications[:500]
    for item in notifications:
        item['read'] = item['id'] in reads
    drafts = []
    for row in con.execute('SELECT * FROM citizen_drafts WHERE user_id=? ORDER BY updated_at DESC', (user['id'],)):
        procedure = service.procedure_for(row['procedure_code']) or {}
        drafts.append({'id': row['id'], 'procedureCode': row['procedure_code'], 'title': procedure.get('name', row['procedure_code']), 'version': row['version'], 'updatedAt': row['updated_at']})
    sessions = [{'createdAt': row['created_at'], 'expiresAt': row['expires_at'], 'current': row['csrf_token'] == user['csrf_token']} for row in con.execute('SELECT created_at,expires_at,csrf_token FROM sessions WHERE user_id=? AND expires_at>? ORDER BY created_at DESC', (user['id'], int(service.datetime.now(service.TZ).timestamp())))]
    return {'cases': cases, 'appointments': appointments, 'feedback': feedback, 'documents': documents, 'notifications': notifications, 'drafts': drafts, 'sessions': sessions, 'sampleData': has_sample_data}


def handle(service, handler, path, body=None):
    user = handler.require_citizen(csrf=body is not None)
    with service.DB_LOCK, service.connect() as con:
        if path == '/api/citizen/workspace' and body is None:
            result = snapshot(service, con, user)
        elif path == '/api/citizen/notifications/read' and body is not None:
            ids = body.get('ids')
            if not isinstance(ids, list) or len(ids) > 500 or any(not isinstance(key, str) for key in ids):
                raise ValueError('Danh sách thông báo không hợp lệ.')
            allowed = {item['id'] for item in snapshot(service, con, user)['notifications']}
            if not set(ids) <= allowed:
                raise ValueError('Thông báo không thuộc tài khoản này hoặc đã hết phạm vi hiển thị.')
            con.executemany('INSERT OR IGNORE INTO citizen_notification_reads(user_id,event_key,read_at) VALUES(?,?,?)', [(user['id'], key, service.now_iso()) for key in ids])
            result = {'ok': True}
        elif path.startswith('/api/citizen/drafts/') and body is None:
            draft_id = path.rsplit('/', 1)[-1]
            row = con.execute('SELECT * FROM citizen_drafts WHERE id=? AND user_id=?', (draft_id, user['id'])).fetchone()
            if row is None and con.execute('SELECT 1 FROM citizen_drafts WHERE id=?', (draft_id,)).fetchone():
                return handler.send_error_json('Không tìm thấy hồ sơ nháp trong tài khoản.', 404)
            if not row:
                return handler.send_error_json('Không tìm thấy hồ sơ nháp trong tài khoản.', 404)
            result = {'draft': {**json.loads(row['details_json']), 'id': row['id'], 'version': row['version'], 'updatedAt': row['updated_at']}}
        elif path == '/api/citizen/drafts' and body is not None:
            draft_id = body.get('id') or secrets.token_hex(16)
            if not isinstance(draft_id, str) or not re.fullmatch(r'[0-9a-f]{32}', draft_id):
                raise ValueError('Mã hồ sơ nháp không hợp lệ.')
            version = body.get('version', 0)
            if isinstance(version, bool) or not isinstance(version, int) or version < 0:
                raise ValueError('Phiên bản hồ sơ nháp không hợp lệ.')
            row = con.execute('SELECT * FROM citizen_drafts WHERE id=? AND user_id=?', (draft_id, user['id'])).fetchone()
            if row is None and con.execute('SELECT 1 FROM citizen_drafts WHERE id=?', (draft_id,)).fetchone():
                return handler.send_error_json('Không tìm thấy hồ sơ nháp trong tài khoản.', 404)
            if version != (row['version'] if row else 0):
                raise RuntimeError('Hồ sơ nháp đã thay đổi. Mở lại từ tài khoản để lấy bản mới nhất.')
            if body.get('action') == 'delete':
                if not row:
                    return handler.send_error_json('Không tìm thấy hồ sơ nháp.', 404)
                con.execute('DELETE FROM citizen_drafts WHERE id=? AND user_id=? AND version=?', (draft_id, user['id'], version))
                result = {'ok': True}
            else:
                details = validate_draft(body)
                if details['procedureCode'] not in service.PROCEDURE_BY_CODE:
                    raise ValueError('Chọn thủ tục trước khi lưu nháp.')
                if not row and con.execute('SELECT COUNT(*) FROM citizen_drafts WHERE user_id=?', (user['id'],)).fetchone()[0] >= 50:
                    raise ValueError('Tài khoản lưu tối đa 50 hồ sơ nháp. Xóa các bản không cần dùng trước khi lưu thêm.')
                stamp = service.now_iso()
                con.execute('''INSERT INTO citizen_drafts(id,user_id,procedure_code,details_json,version,updated_at) VALUES(?,?,?,?,?,?)
                    ON CONFLICT(id) DO UPDATE SET procedure_code=excluded.procedure_code,details_json=excluded.details_json,version=excluded.version,updated_at=excluded.updated_at WHERE citizen_drafts.user_id=excluded.user_id''', (draft_id, user['id'], details['procedureCode'], json.dumps(details, ensure_ascii=False), version + 1, stamp))
                result = {'draft': {'id': draft_id, 'version': version + 1, 'updatedAt': stamp}}
        else:
            return handler.send_error_json('Không tìm thấy chức năng tài khoản.', 404)
    return handler.send_json(result)


def validate_draft(body):
    details = {}
    for key, limit in {'procedureCode': 40, 'agency': 180, 'applicantType': 20, 'delivery': 50, 'deliveryAddress': 500, 'submissionKey': 128, 'submissionToken': 128}.items():
        value = body.get(key, '')
        if not isinstance(value, str) or len(value) > limit:
            raise ValueError('Thông tin hồ sơ nháp không hợp lệ.')
        details[key] = value
    if details['applicantType'] not in ('citizen', 'organization'):
        raise ValueError('Chọn cá nhân hoặc tổ chức.')
    for key, count, length in [('values', 100, 10000), ('contact', 3, 254), ('documentExemptions', 32, 1200)]:
        value = body.get(key, {})
        if not isinstance(value, dict) or len(value) > count or any(not isinstance(k, str) or len(k) > 100 or not isinstance(v, str) or len(v) > length for k, v in value.items()):
            raise ValueError('Nội dung tờ khai nháp vượt giới hạn hoặc không đúng định dạng.')
        details[key] = value if key != 'contact' else {k: value.get(k, '') for k in ('name', 'phone', 'email')}
    details['step'] = body.get('step', 0)
    details['useOwnInformation'] = body.get('useOwnInformation', False)
    if isinstance(details['step'], bool) or not isinstance(details['step'], int) or not 0 <= details['step'] <= 4 or not isinstance(details['useOwnInformation'], bool):
        raise ValueError('Bước tờ khai không hợp lệ.')
    if len(json.dumps(details, ensure_ascii=False).encode()) > 80000:
        raise ValueError('Hồ sơ nháp vượt dung lượng 80 KB; chỉ lưu dữ liệu tờ khai, không kèm tệp.')
    return details
