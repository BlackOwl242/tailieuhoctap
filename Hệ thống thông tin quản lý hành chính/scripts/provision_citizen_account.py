"""Provision the requested local citizen account without changing existing accounts."""
from __future__ import annotations

import secrets
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import app

EMAIL = "congdan@example.test"
PASSWORD = "123"
NAME = "Công dân"


def provision(con) -> bool:
    """Return True on creation; preserve existing passwords, status and access."""
    existing = con.execute("SELECT role FROM users WHERE email=? COLLATE NOCASE", (EMAIL,)).fetchone()
    if existing:
        if existing["role"] != "citizen":
            raise ValueError("Email congdan@example.test đã thuộc tài khoản nội bộ. Không thay đổi quyền tài khoản.")
        return False
    salt = secrets.token_bytes(16)
    now = app.now_iso()
    con.execute(
        "INSERT INTO users(id,email,phone,full_name,password_salt,password_hash,role,active,email_verified,agency_scope,valid_from,valid_until,must_change_password,created_at,updated_at) "
        "VALUES(?,?, '', ?,?,?,'citizen',1,0,'','','',0,?,?)",
        (str(uuid.uuid4()), EMAIL, NAME, salt.hex(), app.password_hash(PASSWORD, salt).hex(), now, now),
    )
    return True


def main() -> None:
    app.init_db()
    with app.DB_LOCK, app.connect() as con:
        created = provision(con)
    if created:
        print("Da tao tai khoan cong dan:")
        print("Email: " + EMAIL)
        print("Mat khau: " + PASSWORD)
    else:
        print("Tai khoan cong dan da ton tai: " + EMAIL)
        print("Giu nguyen mat khau va trang thai hien tai.")
    print("Dang nhap tai http://127.0.0.1:" + str(app.PORT) + "/dang-nhap")


if __name__ == "__main__":
    main()
