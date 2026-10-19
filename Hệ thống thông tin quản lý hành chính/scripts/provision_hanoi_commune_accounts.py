#!/usr/bin/env python3
"""Create local project accounts for Hanoi's 2025 commune-level units.

This is an explicit, idempotent provisioning command. It does not run at app
startup and never changes existing user rows.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import shutil
import sqlite3
import unicodedata
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "hanoi-services.sqlite3"
ROSTER = ROOT / "TAI_KHOAN_UBND_CAP_XA_HANOI_2026.md"
PASSWORD = "123"
PBKDF2_ITERATIONS = 600_000

WARDS = """
Ba Đình|Bạch Mai|Bồ Đề|Cầu Giấy|Chương Mỹ|Cửa Nam|Đại Mỗ|Định Công|Đống Đa|Đông Ngạc|Dương Nội|Giảng Võ|Hà Đông|Hai Bà Trưng|Hoàn Kiếm|Hoàng Liệt|Hoàng Mai|Hồng Hà|Khương Đình|Kiến Hưng|Kim Liên|Láng|Lĩnh Nam|Long Biên|Nghĩa Đô|Ngọc Hà|Ô Chợ Dừa|Phú Diễn|Phú Lương|Phú Thượng|Phúc Lợi|Phương Liệt|Sơn Tây|Tây Hồ|Tây Mỗ|Tây Tựu|Thanh Liệt|Thanh Xuân|Thượng Cát|Từ Liêm|Tùng Thiện|Tương Mai|Văn Miếu - Quốc Tử Giám|Việt Hưng|Vĩnh Hưng|Vĩnh Tuy|Xuân Đỉnh|Xuân Phương|Yên Hòa|Yên Nghĩa|Yên Sở
""".strip().split("|")

COMMUNES = """
An Khánh|Ba Vì|Bất Bạt|Bát Tràng|Bình Minh|Chương Dương|Chuyên Mỹ|Cổ Đô|Đa Phúc|Đại Thanh|Đại Xuyên|Dân Hòa|Đan Phượng|Đoài Phương|Đông Anh|Dương Hòa|Gia Lâm|Hạ Bằng|Hát Môn|Hòa Lạc|Hòa Phú|Hòa Xá|Hoài Đức|Hồng Sơn|Hồng Vân|Hưng Đạo|Hương Sơn|Kiều Phú|Kim Anh|Liên Minh|Mê Linh|Minh Châu|Mỹ Đức|Nam Phù|Ngọc Hồi|Nội Bài|Ô Diên|Phú Cát|Phù Đổng|Phú Nghĩa|Phú Xuyên|Phúc Lộc|Phúc Sơn|Phúc Thịnh|Phúc Thọ|Phượng Dực|Quảng Bị|Quang Minh|Quảng Oai|Quốc Oai|Sóc Sơn|Sơn Đồng|Suối Hai|Tam Hưng|Tây Phương|Thạch Thất|Thanh Oai|Thanh Trì|Thiên Lộc|Thư Lâm|Thuận An|Thượng Phúc|Thường Tín|Tiến Thắng|Trần Phú|Trung Giã|Ứng Hòa|Ứng Thiên|Vân Đình|Vật Lại|Vĩnh Thanh|Xuân Mai|Yên Bài|Yên Lãng|Yên Xuân
""".strip().split("|")

ROLES = [
    ("intake", "Tiếp nhận", "Cán bộ tiếp nhận hồ sơ"),
    ("specialist", "Thụ lý", "Chuyên viên xử lý hồ sơ"),
    ("leader", "Lãnh đạo", "Lãnh đạo xem xét"),
    ("registrar", "Văn thư", "Cán bộ trả kết quả"),
    ("finance", "Tài chính", "Cán bộ theo dõi tài chính"),
]


def slug(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text.replace("đ", "d").replace("Đ", "D"))
    ascii_text = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", ascii_text.lower())).strip("-")


def agency(kind: str, name: str) -> str:
    return f"UBND {kind} {name}"


def main() -> None:
    if len(WARDS) != 51 or len(COMMUNES) != 75 or len(set(WARDS + COMMUNES)) != 126:
        raise SystemExit("Danh sach dia gioi phai co dung 51 phuong va 75 xa, khong trung ten.")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="SQLite database path")
    parser.add_argument("--no-backup", action="store_true", help="Do not create a timestamped database backup")
    args = parser.parse_args()
    db_path = args.db.resolve()
    if not db_path.is_file():
        raise SystemExit(f"Không tìm thấy cơ sở dữ liệu: {db_path}")

    today = date.today()
    valid_from = today.isoformat()
    valid_until = (today + timedelta(days=365)).isoformat()
    now = datetime.now().astimezone().isoformat(timespec="seconds")

    if not args.no_backup:
        backup_path = db_path.with_name(f"{db_path.stem}.before-commune-accounts-{today:%Y%m%d}.sqlite3")
        if not backup_path.exists():
            source = sqlite3.connect(db_path)
            target = sqlite3.connect(backup_path)
            try:
                source.backup(target)
            finally:
                target.close()
                source.close()

    created = 0
    skipped = 0
    with sqlite3.connect(db_path) as con:
        con.row_factory = sqlite3.Row
        for kind, names in (("phường", WARDS), ("xã", COMMUNES)):
            for name in names:
                scope = agency(kind, name)
                unit_slug = "tayho" if (kind, name) == ("phường", "Tây Hồ") else slug(name)
                for role, role_label, full_name in ROLES:
                    email = f"{role}.{unit_slug}@example.test"
                    existing = con.execute("SELECT id FROM users WHERE email=? COLLATE NOCASE", (email,)).fetchone()
                    if existing:
                        skipped += 1
                        continue
                    salt = __import__("secrets").token_bytes(16)
                    hashed = hashlib.pbkdf2_hmac("sha256", PASSWORD.encode(), salt, PBKDF2_ITERATIONS, dklen=32)
                    con.execute(
                        """INSERT INTO users
                        (id,email,phone,full_name,password_salt,password_hash,role,active,email_verified,
                         agency_scope,valid_from,valid_until,must_change_password,created_at,updated_at)
                        VALUES(?,?, '', ?,?,?,?,1,0,?,?,?,0,?,?)""",
                        (str(uuid.uuid4()), email, f"{full_name} — {scope}", salt.hex(), hashed.hex(), role,
                         scope, valid_from, valid_until, now, now),
                    )
                    created += 1
        con.commit()

    write_roster(db_path)
    print(f"Units: {len(WARDS)} wards + {len(COMMUNES)} communes = {len(WARDS) + len(COMMUNES)}")
    print(f"Roles per unit: {len(ROLES)}")
    print(f"Accounts created: {created}; existing emails skipped: {skipped}")
    print(f"Roster file: {ROSTER.name}")


def write_roster(db_path: Path) -> None:
    role_labels = {"admin": "Quản trị", **{role: label for role, label, _ in ROLES}}
    today = date.today().isoformat()
    with sqlite3.connect(db_path) as con:
        con.row_factory = sqlite3.Row
        users = con.execute(
            "SELECT full_name,email,role,agency_scope,active,valid_from,valid_until,must_change_password "
            "FROM users WHERE agency_scope LIKE 'UBND phường %' OR agency_scope LIKE 'UBND xã %' "
            "ORDER BY agency_scope COLLATE NOCASE, role, email"
        ).fetchall()

    lines = [
        "# Tài khoản các UBND phường, xã Hà Nội theo địa giới mới",
        "",
        f"Cập nhật: {today}. Danh sách được sinh từ cơ sở dữ liệu của dự án.",
        "",
        f"Phạm vi: **126 đơn vị** (51 phường, 75 xã); hiện có **{len(users)} tài khoản** trong các phạm vi UBND cấp xã.",
        "",
        "Danh sách địa giới đối chiếu theo [Nghị quyết 1656/NQ-UBTVQH15 và thông tin của Sở Văn hóa và Thể thao Hà Nội](https://sovhtt.hanoi.gov.vn/nghi-quyet-sap-xep-don-vi-hanh-chinh-cap-xa-tai-ha-noi-buoc-chuyen-minh-lich-su/).",
        "",
        "Đây là tài khoản nội bộ của dự án học phần, không phải tài khoản do UBND Hà Nội cấp và không xác thực quyền công vụ ngoài ứng dụng. Email dùng miền `.example.test`, không nhận thư.",
        "",
        "Mật khẩu ban đầu là `123`; không buộc đổi mật khẩu ở lần đăng nhập đầu. Tài khoản có hiệu lực 365 ngày kể từ ngày tạo. Bốn tài khoản Tây Hồ đã tồn tại được giữ nguyên thông tin và mật khẩu.",
        "",
        "| Họ tên hiển thị | Email đăng nhập | Vai trò | Phạm vi | Trạng thái | Hiệu lực | Mật khẩu khởi tạo |",
        "|---|---|---|---|---|---|---|",
    ]
    for user in users:
        status = "Đang hoạt động" if user["active"] else "Tạm ngưng"
        validity = f"{user['valid_from']} đến {user['valid_until']}" if user["valid_from"] or user["valid_until"] else "Không giới hạn"
        initial_password = "`123` (không buộc đổi lần đầu)"
        lines.append(
            f"| {user['full_name']} | `{user['email']}` | {role_labels.get(user['role'], user['role'])} "
            f"| {user['agency_scope']} | {status} | {validity} | {initial_password} |"
        )
    ROSTER.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
