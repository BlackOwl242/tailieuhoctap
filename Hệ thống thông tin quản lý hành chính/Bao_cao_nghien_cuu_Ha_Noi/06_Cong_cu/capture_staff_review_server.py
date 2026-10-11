"""Serve disposable accounts and cases for report screenshots; never seed the live DB."""
import json
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT), str(ROOT / 'tests')]
import test_app_access as fixtures

fixtures.ApplicationAccessTests.setUpClass()
sample = fixtures.ApplicationAccessTests()
sample.setUp()
service = fixtures.service
with service.connect() as con:
    names = {'admin1@example.test': 'Quản trị viên 01', 'admin2@example.test': 'Quản trị viên 02', 'intake@example.test': 'Cán bộ tiếp nhận', 'specialist@example.test': 'Chuyên viên thụ lý'}
    for email, name in names.items():
        con.execute('UPDATE users SET full_name=?,agency_scope=? WHERE email=?', (name, 'UBND phường Tây Hồ', email))
    con.execute("""INSERT INTO staff_access_requests(id,user_id,requested_by,role,agency_scope,valid_from,valid_until,requested_sign_stop,signing_authority_ref,reason,status,created_at,reviewed_by,review_note,reviewed_at)
        VALUES('capture-approved',?,?,'intake','UBND phường Tây Hồ','2026-10-11','2027-08-07',0,'','Phân công tiếp nhận hồ sơ tại bộ phận một cửa','APPROVED',?,?,'Đã đối chiếu phân công và phạm vi công tác',?)""", (sample.intake, sample.admin1, service.now_iso(), sample.admin2, service.now_iso()))
    for index, row in enumerate(con.execute('SELECT * FROM cases').fetchall()):
        payload = json.loads(row['payload_json'])
        payload.update(agencyScope='UBND phường Tây Hồ', receivingAgency='UBND phường Tây Hồ')
        payload['applicant'].update(name=f'Người nộp hồ sơ {index + 1:02}', phone='0900000000', email='nguoinop@example.test', address='Phường Tây Hồ, Hà Nội')
        payload['procedure'] = service.procedure_for(row['procedure_code'])
        payload['events'] = [{'id': f'event-{index}', 'at': service.now_iso(), 'title': 'Hồ sơ đã được gửi', 'detail': 'Chờ cán bộ kiểm tra thành phần hồ sơ.', 'audience': 'public', 'actor': 'Người nộp', 'role': 'citizen', 'action': 'submit'}]
        con.execute('UPDATE cases SET payload_json=? WHERE code=?', (json.dumps(payload, ensure_ascii=False), row['code']))
print(json.dumps({'url': fixtures.ApplicationAccessTests.base_url}), flush=True)
try:
    threading.Event().wait()
finally:
    fixtures.ApplicationAccessTests.tearDownClass()
