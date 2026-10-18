"""Recovered local counter, appointment and public-feedback workflows.

Schema upgrades are additive. Existing records, accounts and credentials are retained.
"""
from datetime import date, datetime, timedelta
import hashlib
import json
import re
import secrets
import uuid


def init_schema(con):
    con.executescript("""
        CREATE TABLE IF NOT EXISTS public_appointments (
            code TEXT PRIMARY KEY, citizen_name TEXT NOT NULL, citizen_id TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL, agency TEXT NOT NULL, procedure_code TEXT NOT NULL,
            procedure_name TEXT NOT NULL, appointment_date TEXT NOT NULL, time_slot TEXT NOT NULL,
            queue_number INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '', status TEXT NOT NULL,
            created_at TEXT NOT NULL, counter_note TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS public_pakn (
            code TEXT PRIMARY KEY, sender_name TEXT NOT NULL, phone TEXT NOT NULL,
            email TEXT NOT NULL DEFAULT '', agency TEXT NOT NULL, topic TEXT NOT NULL,
            title TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL,
            reply TEXT NOT NULL DEFAULT '', replied_by TEXT NOT NULL DEFAULT '',
            replied_at TEXT, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS public_appointment_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_code TEXT NOT NULL REFERENCES public_appointments(code),
            actor_id TEXT NOT NULL DEFAULT '', actor_name TEXT NOT NULL,
            action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS public_feedback_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feedback_code TEXT NOT NULL REFERENCES public_pakn(code),
            actor_id TEXT NOT NULL, actor_name TEXT NOT NULL,
            action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL
        );
    """)


def _agency_allowed(user, agency):
    scope = user['agency_scope'].strip().casefold()
    return bool(scope and (scope == 'toàn thành phố' or scope == agency.strip().casefold()))


def get_records(service, handler, user):
    # System administrators see aggregates, not applicant contact details.
    if user['role'] not in {'intake', 'leader', 'admin'}:
        raise PermissionError('Tài khoản không được xem lịch hẹn hoặc phản ánh của cơ quan.')
    with service.connect() as con:
        if user['role'] == 'admin':
            return handler.send_json({'appointments': [], 'feedback': [], 'summary': {
                'appointments': con.execute('SELECT count(*) FROM public_appointments').fetchone()[0],
                'feedback': con.execute('SELECT count(*) FROM public_pakn').fetchone()[0]}})
        scope = user['agency_scope'].strip()
        clause, args = ('', ()) if scope.casefold() == 'toàn thành phố' else (' WHERE agency=? COLLATE NOCASE', (scope,))
        appointments = con.execute('SELECT * FROM public_appointments' + clause + ' ORDER BY appointment_date DESC,queue_number LIMIT 500', args).fetchall()
        feedback = con.execute('SELECT * FROM public_pakn' + clause + ' ORDER BY created_at DESC LIMIT 500', args).fetchall()
        return handler.send_json({'appointments': [dict(r) for r in appointments], 'feedback': [dict(r) for r in feedback]})


def create_public(service, handler, kind, body):
    service.check_public_rate_limit(handler.public_address(), kind, 8)
    name = service.clean_text(body.get('name'), 150)
    phone = service.clean_text(body.get('phone'), 40)
    agency = service.clean_text(body.get('agency'), 180)
    if len(name) < 2 or not re.fullmatch(r'[+0-9(). -]{8,40}', phone):
        raise ValueError('Nhập họ tên và số điện thoại liên hệ hợp lệ.')
    now = service.now_iso()
    with service.DB_LOCK, service.connect() as con:
        today = datetime.now(service.TZ).date()
        if not con.execute("SELECT 1 FROM users WHERE role='intake' AND active=1 AND agency_scope=? COLLATE NOCASE AND (valid_from='' OR valid_from<=?) AND (valid_until='' OR valid_until>=?)", (agency, today.isoformat(), today.isoformat())).fetchone():
            raise ValueError('Chọn cơ quan có bộ phận tiếp nhận đang hoạt động trong hệ thống.')
        if kind == 'appointments':
            procedure = service.PROCEDURE_BY_CODE.get(service.clean_text(body.get('procedureCode'), 40))
            if not procedure:
                raise ValueError('Chọn thủ tục cần được hướng dẫn tại quầy.')
            day = date.fromisoformat(str(body.get('date', '')))
            if day <= today or day > today + timedelta(days=30) or not service.is_workday(day):
                raise ValueError('Chọn ngày làm việc từ ngày mai đến 30 ngày tới.')
            slot = service.clean_text(body.get('timeSlot'), 30)
            if slot not in {'08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'}:
                raise ValueError('Chọn khung giờ làm việc trong danh sách.')
            booked = con.execute("SELECT count(*) FROM public_appointments WHERE agency=? COLLATE NOCASE AND appointment_date=? AND time_slot=? AND status NOT IN ('CANCELLED','DA_HUY','HUY')", (agency, day.isoformat(), slot)).fetchone()[0]
            if booked >= 10:
                raise ValueError('Khung giờ này đã đủ lịch; hãy chọn khung giờ khác.')
            queue = con.execute('SELECT coalesce(max(queue_number),0)+1 FROM public_appointments WHERE agency=? COLLATE NOCASE AND appointment_date=?', (agency, day.isoformat())).fetchone()[0]
            code = 'LH-' + secrets.token_hex(6).upper()
            con.execute('INSERT INTO public_appointments(code,citizen_name,phone,agency,procedure_code,procedure_name,appointment_date,time_slot,queue_number,note,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                        (code, name, phone, agency, procedure['code'], procedure['name'], day.isoformat(), slot, queue, service.clean_text(body.get('note'), 1000), 'BOOKED', now))
            return handler.send_json({'code': code, 'queueNumber': queue, 'message': 'Đã ghi nhận lịch hẹn trong hệ thống. Lịch hẹn không thay thế việc tiếp nhận hồ sơ.'}, 201)
        title = service.clean_text(body.get('title'), 180)
        content = service.clean_text(body.get('content'), 4000)
        if len(title) < 8 or len(content) < 20:
            raise ValueError('Nhập tiêu đề tối thiểu 8 ký tự và nội dung tối thiểu 20 ký tự.')
        email = service.clean_text(body.get('email'), 254)
        if email:
            email = service.normalize_email(email)
        code = 'PA-' + secrets.token_hex(6).upper()
        con.execute('INSERT INTO public_pakn(code,sender_name,phone,email,agency,topic,title,content,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
                    (code, name, phone, email, agency, service.clean_text(body.get('topic'), 120) or 'Phản ánh về phục vụ', title, content, 'RECEIVED', now))
        return handler.send_json({'code': code, 'message': 'Đã gửi phản ánh đến đơn vị trong hệ thống.'}, 201)


def lookup_public(service, handler, body):
    service.check_public_rate_limit(handler.public_address(), 'service-lookup', 30)
    code = service.clean_text(body.get('code'), 40).upper()
    phone = service.clean_text(body.get('phone'), 40)
    if not re.fullmatch(r'[+0-9(). -]{8,40}', phone):
        raise ValueError('Nhập số điện thoại liên hệ đã khai khi gửi thông tin.')
    with service.connect() as con:
        if code.startswith('LH-'):
            row = con.execute('SELECT code,phone,agency,procedure_name,appointment_date,time_slot,queue_number,status,counter_note FROM public_appointments WHERE code=?', (code,)).fetchone()
        elif code.startswith('PA-'):
            row = con.execute('SELECT code,phone,agency,title,content,status,reply,replied_at FROM public_pakn WHERE code=?', (code,)).fetchone()
        else:
            row = None
        if not row or not secrets.compare_digest(row['phone'], phone):
            return handler.send_error_json('Không tìm thấy thông tin khớp mã và số điện thoại.', 404)
        result = dict(row)
        result.pop('phone')
        return handler.send_json({'record': result})


def update_record(service, handler, user, body):
    if user['role'] not in {'intake', 'leader'}:
        raise PermissionError('Chỉ cán bộ tiếp nhận hoặc lãnh đạo cùng cơ quan được xử lý nội dung này.')
    code = service.clean_text(body.get('code'), 40).upper()
    table = 'public_appointments' if code.startswith('LH-') else 'public_pakn'
    with service.DB_LOCK, service.connect() as con:
        row = con.execute(f'SELECT * FROM {table} WHERE code=?', (code,)).fetchone()
        if not row or not _agency_allowed(user, row['agency']):
            return handler.send_error_json('Không tìm thấy nội dung trong phạm vi cơ quan.', 404)
        if body.get('expectedStatus') != row['status']:
            raise RuntimeError('Nội dung vừa được cập nhật; hãy tải lại trước khi xử lý.')
        note = service.clean_text(body.get('note'), 2000)
        if len(note) < 8:
            raise ValueError('Ghi nội dung xử lý tối thiểu 8 ký tự.')
        if table == 'public_appointments':
            status = service.clean_text(body.get('status'), 30)
            transitions = {'BOOKED': {'CONFIRMED', 'CANCELLED'}, 'CONFIRMED': {'CHECKED_IN', 'CANCELLED'},
                           'CHECKED_IN': {'COMPLETED'}, 'CHO_XAC_NHAN': {'CONFIRMED', 'CANCELLED'},
                           'DA_DAT': {'CONFIRMED', 'CANCELLED'}, 'DA_XAC_NHAN': {'CHECKED_IN', 'CANCELLED'}}
            if status not in transitions.get(row['status'], set()):
                raise ValueError('Trạng thái lịch hẹn không cho phép thao tác đã chọn.')
            con.execute('UPDATE public_appointments SET status=?,counter_note=? WHERE code=?', (status, note, code))
            con.execute('INSERT INTO public_appointment_events(appointment_code,actor_id,actor_name,action,detail,created_at) VALUES(?,?,?,?,?,?)',
                        (code, user['id'], user['full_name'], status, note, service.now_iso()))
        else:
            if row['status'] in {'REPLIED', 'DA_TRA_LOI', 'CLOSED'}:
                raise ValueError('Phản ánh đã được trả lời; không thể ghi đè nội dung trả lời.')
            con.execute("UPDATE public_pakn SET status='REPLIED',reply=?,replied_by=?,replied_at=? WHERE code=?", (note, user['id'], service.now_iso(), code))
            con.execute('INSERT INTO public_feedback_events(feedback_code,actor_id,actor_name,action,detail,created_at) VALUES(?,?,?,?,?,?)',
                        (code, user['id'], user['full_name'], 'REPLIED', note, service.now_iso()))
        return handler.send_json({'ok': True})


def create_counter_case(service, handler, user, body):
    if user['role'] != 'intake':
        raise PermissionError('Chỉ cán bộ tiếp nhận được lập hồ sơ tại quầy.')
    procedure_code = service.clean_text(body.get('procedureCode'), 40)
    procedure = service.PROCEDURE_BY_CODE.get(procedure_code)
    agency = service.clean_text(body.get('receivingAgency'), 180)
    if not procedure or not agency or not _agency_allowed(user, agency):
        raise ValueError('Chọn thủ tục và cơ quan thuộc phạm vi tiếp nhận.')
    applicant_type = service.clean_text(body.get('applicantType'), 20)
    name = service.clean_text(body.get('applicantName'), 150)
    citizen_id = service.clean_text(body.get('citizenId'), 40)
    phone = service.clean_text(body.get('applicantPhone'), 40)
    address = service.clean_text(body.get('applicantAddress'), 300)
    summary = service.clean_text(body.get('requestSummary'), 1200)
    originals = service.clean_text(body.get('paperOriginals'), 2000)
    if applicant_type not in {'citizen', 'organization'} or len(name) < 2 or len(citizen_id) < 3 or len(address) < 3:
        raise ValueError('Khai đầy đủ chủ thể, tên, số định danh và địa chỉ người nộp.')
    if not re.fullmatch(r'[+0-9(). -]{8,40}', phone) or len(summary) < 8 or len(originals) < 8 or body.get('identityVerified') is not True:
        raise ValueError('Ghi điện thoại, nội dung yêu cầu, danh mục giấy tờ và xác nhận đã đối chiếu người nộp.')
    try:
        request_key = str(uuid.UUID(str(body.get('submissionKey', ''))))
    except (ValueError, TypeError) as exc:
        raise ValueError('Thiếu mã phiên tiếp nhận; hãy mở lại biểu mẫu.') from exc
    idem = 'counter-' + hashlib.sha256((user['id'] + request_key).encode()).hexdigest()
    email = service.clean_text(body.get('applicantEmail'), 254)
    if email:
        email = service.normalize_email(email)
    with service.DB_LOCK, service.connect() as con:
        prior = con.execute('SELECT * FROM cases WHERE idempotency_key=?', (idem,)).fetchone()
        if prior:
            return handler.send_json({'case': service.case_dict(con, prior, True, user['role']), 'duplicate': True})
        code = f'HN-{datetime.now(service.TZ).year}-' + secrets.token_hex(4).upper()
        lookup = secrets.token_hex(32)
        created = service.now_iso()
        deadline, deadline_note = service.compute_deadline(procedure_code, datetime.now(service.TZ))
        payload = {'code': code, 'procedureCode': procedure_code, 'applicantType': applicant_type,
                   'applicant': {'name': name, 'citizenId': citizen_id, 'phone': phone, 'email': email, 'address': address},
                   'subject': {'name': name, 'relation': 'Người nộp'}, 'requestSummary': summary,
                   'paperOriginals': originals, 'receivingAgency': agency, 'agencyScope': agency,
                   'submissionChannel': 'TRUC_TIEP', 'createdAt': created, 'updatedAt': created, 'acceptedAt': created,
                   'deadline': deadline, 'deadlineNote': deadline_note, 'attachments': [],
                   'digitization': {'status': 'CHO_SO_HOA', 'documents': []},
                   'fee': {'status': 'NOT_CONFIGURED'}, 'sync': {'status': 'NOT_CONFIGURED', 'attempts': 0},
                   'intakeVerification': {'verifiedBy': user['id'], 'verifiedAt': created}}
        cursor = con.execute('INSERT INTO cases(code,owner_id,procedure_code,status,version,idempotency_key,payload_json,created_at,updated_at) VALUES(?,?,?,?,1,?,?,?,?)',
                             (code, hashlib.sha256(lookup.encode('ascii')).hexdigest(), procedure_code, 'DA_TIEP_NHAN', idem, json.dumps(payload, ensure_ascii=False), created, created))
        case_id = cursor.lastrowid
        con.execute('INSERT INTO case_lookup_secrets(case_id,encrypted_key,updated_at) VALUES(?,?,?)', (case_id, service.lookup_cipher().encrypt(lookup.encode('ascii')), created))
        service.add_event(con, case_id, 'intake', user['full_name'], 'accept', 'Đã tiếp nhận hồ sơ tại quầy', summary, 'public')
        row = con.execute('SELECT * FROM cases WHERE id=?', (case_id,)).fetchone()
        return handler.send_json({'case': service.case_dict(con, row, True, user['role'])}, 201)
