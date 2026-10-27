"""Self-declared citizen details, separate from staff authorization and dossiers."""
import json
import re
from datetime import date

IDENTITY_TYPES = ('Thẻ căn cước', 'Thẻ căn cước công dân', 'Giấy chứng nhận căn cước', 'Hộ chiếu', 'Giấy tờ xuất nhập cảnh hoặc đi lại quốc tế')


def init_schema(con):
    con.execute('''CREATE TABLE IF NOT EXISTS citizen_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        details_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL)''')


def read(con, user):
    row = con.execute('SELECT * FROM citizen_profiles WHERE user_id=?', (user['id'],)).fetchone()
    details = json.loads(row['details_json']) if row else {}
    result = {
        'dateOfBirth': '', 'gender': '', 'nationality': 'Việt Nam',
        'identityType': 'Thẻ căn cước', 'identityNumber': '', 'identityDate': '', 'identityPlace': '',
        'permanentProvince': '', 'permanentCommune': '', 'permanentStreet': '',
        'sameContactAddress': True, 'contactProvince': '', 'contactCommune': '', 'contactStreet': '',
        **details, 'name': user['full_name'], 'phone': user['phone'], 'email': user['email'],
        'version': row['version'] if row else 0, 'updatedAt': row['updated_at'] if row else '',
        'verificationStatus': 'SELF_DECLARED',
    }
    result['permanentAddress'] = address(result, 'permanent')
    result['contactAddress'] = result['permanentAddress'] if result['sameContactAddress'] else address(result, 'contact')
    result['missingFields'] = [label for key, label in (
        ('name', 'Họ và tên'), ('phone', 'Số điện thoại'), ('dateOfBirth', 'Ngày sinh'),
        ('identityNumber', 'Số giấy tờ nhận dạng'), ('permanentProvince', 'Tỉnh, thành phố thường trú'),
        ('permanentCommune', 'Phường, xã thường trú'), ('permanentStreet', 'Địa chỉ thường trú chi tiết'),
    ) if not result[key]]
    return result


def address(profile, prefix):
    return ', '.join(profile.get(prefix + key, '') for key in ('Street', 'Commune', 'Province') if profile.get(prefix + key))


def validate(body, today):
    lengths = {'name': 150, 'phone': 40, 'nationality': 100, 'gender': 30,
               'dateOfBirth': 10, 'identityType': 100, 'identityNumber': 40,
               'identityDate': 10, 'identityPlace': 180}
    for prefix in ('permanent', 'contact'):
        lengths.update({prefix + 'Province': 100, prefix + 'Commune': 150, prefix + 'Street': 250})
    result = {}
    for key, limit in lengths.items():
        value = body.get(key, '')
        if not isinstance(value, str) or len(value.strip()) > limit or any(ord(c) < 32 for c in value):
            raise ValueError('Thông tin cá nhân không đúng định dạng hoặc vượt độ dài cho phép.')
        result[key] = value.strip()
    if len(result['name']) < 2:
        raise ValueError('Nhập họ và tên có ít nhất 2 ký tự.')
    if not re.fullmatch(r'[+0-9(). -]{8,40}', result['phone']):
        raise ValueError('Nhập số điện thoại liên hệ hợp lệ.')
    if result['gender'] not in ('', 'Nam', 'Nữ', 'Khác'):
        raise ValueError('Giới tính không hợp lệ.')
    if result['identityType'] not in IDENTITY_TYPES:
        raise ValueError('Chọn loại giấy tờ nhận dạng.')
    number = result['identityNumber']
    if number:
        if result['identityType'] in IDENTITY_TYPES[:3]:
            if not re.fullmatch(r'\d{12}', number):
                raise ValueError('Số căn cước hoặc số định danh cá nhân gồm 12 chữ số.')
        elif not re.fullmatch(r'[A-Za-z0-9 -]{5,40}', number):
            raise ValueError('Số hộ chiếu hoặc giấy tờ đi lại không hợp lệ.')
    for key, label in (('dateOfBirth', 'Ngày sinh'), ('identityDate', 'Ngày cấp giấy tờ')):
        if result[key]:
            try:
                value = date.fromisoformat(result[key])
                if value.isoformat() != result[key] or value > today:
                    raise ValueError()
            except ValueError:
                raise ValueError(label + ' phải là ngày hợp lệ, không sau ngày hiện tại.') from None
    if result['dateOfBirth'] and result['identityDate'] and result['identityDate'] < result['dateOfBirth']:
        raise ValueError('Ngày cấp giấy tờ không thể trước ngày sinh.')
    if not isinstance(body.get('sameContactAddress'), bool):
        raise ValueError('Chọn cách sử dụng địa chỉ liên hệ.')
    result['sameContactAddress'] = body['sameContactAddress']
    if result['sameContactAddress']:
        for key in ('Province', 'Commune', 'Street'):
            result['contact' + key] = ''
    version = body.get('version')
    if isinstance(version, bool) or not isinstance(version, int) or version < 0:
        raise ValueError('Phiên bản thông tin cá nhân không hợp lệ. Hãy tải lại trang.')
    return result, version
