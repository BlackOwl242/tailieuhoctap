"""Prepare an isolated copy of application data for documentation captures."""
from pathlib import Path
import json
import os
import shutil
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(tempfile.mkdtemp(prefix='hanoi-docs-20261016-'))
DATA = WORK / 'data'
DATA.mkdir()
from reportlab.pdfgen import canvas
sample = canvas.Canvas(str(WORK / 'Tai_lieu_minh_hoa_giao_dien.pdf'))
sample.drawString(60, 760, 'DOCUMENTATION EXAMPLE ONLY')
sample.drawString(60, 730, 'This file illustrates the upload control and is not an identity document.')
sample.save()
with sqlite3.connect(ROOT / 'data/hanoi-services.sqlite3') as source:
    with sqlite3.connect(DATA / 'hanoi-services.sqlite3') as target:
        source.backup(target)
for key in (ROOT / 'data').glob('*.key'):
    shutil.copy2(key, DATA / key.name)
uploads = ROOT / 'data/uploads'
if uploads.exists():
    shutil.copytree(uploads, DATA / 'uploads')
report = ROOT / 'Bao_cao_nghien_cuu_Ha_Noi/04_Bao_cao/Phan_tich_thiet_ke_huong_doi_tuong_Ha_Noi.docx'
shutil.copy2(report, WORK / 'bao_cao_truoc_cap_nhat.docx')
os.environ['HANOI_DATA_DIR'] = str(DATA)
os.environ['HANOI_DB_PATH'] = str(DATA / 'hanoi-services.sqlite3')
sys.path.insert(0, str(ROOT))
import app
app.init_db()
config = {'work': str(WORK), 'data': str(DATA), 'port': 8767, 'roles': {}}
with app.connect() as con:
    for role in ('admin', 'intake', 'specialist', 'leader', 'registrar', 'finance'):
        row = con.execute("SELECT * FROM users WHERE role=? AND active=1 ORDER BY CASE WHEN agency_scope='UBND phường Tây Hồ' THEN 0 ELSE 1 END,id LIMIT 1", (role,)).fetchone()
        if row is None:
            raise RuntimeError('No active local account for role ' + role)
        con.execute('UPDATE users SET must_change_password=0 WHERE id=?', (row['id'],))
        token, csrf, _ = app.new_session(con, row['id'])
        config['roles'][role] = {'token': token, 'csrf': csrf, 'scope': row['agency_scope']}
    cases = con.execute('SELECT code,payload_json FROM cases ORDER BY id').fetchall()
    config['trackingCode'] = next((r['code'] for r in cases if json.loads(r['payload_json']).get('agencyScope') == config['roles']['intake']['scope']), cases[0]['code'])
(WORK / 'capture-config.json').write_text(json.dumps(config, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'work': str(WORK), 'config': str(WORK / 'capture-config.json'), 'port': 8767, 'roles': list(config['roles'])}, ensure_ascii=False))
