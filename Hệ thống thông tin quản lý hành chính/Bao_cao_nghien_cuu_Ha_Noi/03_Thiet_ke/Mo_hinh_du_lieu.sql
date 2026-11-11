-- ============================================================================
-- MÔ HÌNH DỮ LIỆU VẬT LÝ SQLITE 3 (30 BẢNG ĐANG VẬN HÀNH THỰC TẾ)
-- Dự án: Hệ thống thông tin quản lý tiếp nhận và giải quyết TTHC theo cơ chế
--        một cửa tại thành phố Hà Nội (Cục bộ: data/hanoi-services.sqlite3)
-- Thứ tự DDL đã chuẩn hóa: Không có tham chiếu khóa ngoại ngược (0 forward-FK).
-- ============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 15000;

-- ============================================================================
-- NHÓM 1: ĐỊNH DANH, TÀI KHOẢN & PHÂN QUYỀN RBAC (5 BẢNG)
-- Đặt trước để đáp ứng khóa ngoại từ các bảng danh mục/tin tức, công dân, chữ ký
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone TEXT NOT NULL DEFAULT '',
    full_name TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'intake', 'specialist', 'leader', 'registrar', 'finance', 'admin')),
    active INTEGER NOT NULL DEFAULT 1,
    email_verified INTEGER NOT NULL DEFAULT 0,
    agency_scope TEXT NOT NULL DEFAULT '',
    valid_from TEXT NOT NULL DEFAULT '',
    valid_until TEXT NOT NULL DEFAULT '',
    may_sign_stop INTEGER NOT NULL DEFAULT 0,
    signing_authority_ref TEXT NOT NULL DEFAULT '',
    must_change_password INTEGER NOT NULL DEFAULT 0,
    can_manage_agency_accounts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role_active
    ON users(role, active);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires
    ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS staff_access_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    requested_by TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL,
    agency_scope TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    requested_sign_stop INTEGER NOT NULL DEFAULT 0,
    signing_authority_ref TEXT NOT NULL DEFAULT '',
    authorized_sign_stop INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by TEXT REFERENCES users(id),
    review_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status_created
    ON staff_access_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_access_user
    ON staff_access_requests(user_id);

CREATE TABLE IF NOT EXISTS staff_account_changes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    requested_by TEXT NOT NULL REFERENCES users(id),
    before_json TEXT NOT NULL,
    proposed_json TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by TEXT REFERENCES users(id),
    review_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_changes_status_created
    ON staff_account_changes(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_changes_one_pending_per_user
    ON staff_account_changes(user_id) WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS staff_authority_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    changed_by TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL CHECK (action IN ('GRANT_STOP_SIGNING', 'REVOKE_STOP_SIGNING')),
    authority_ref TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_authority_user
    ON staff_authority_events(user_id, id);

-- ============================================================================
-- NHÓM 2: DANH MỤC THỦ TỤC & TIN TỨC CỔNG THÔNG TIN (7 BẢNG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS procedure_catalog_edits (
    procedure_code TEXT PRIMARY KEY,
    local_code TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    field TEXT NOT NULL,
    category_key TEXT NOT NULL DEFAULT '',
    level TEXT NOT NULL,
    agency TEXT NOT NULL,
    source_url TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    reason TEXT NOT NULL,
    submission_json TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS procedure_catalog_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    procedure_code TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT NOT NULL,
    before_json TEXT,
    after_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_procedure_catalog_audit_code
    ON procedure_catalog_audit(procedure_code, id DESC);

CREATE TABLE IF NOT EXISTS procedure_category_edits (
    source_field TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    reason TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS procedure_category_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_field TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    before_json TEXT,
    after_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_procedure_category_audit_field
    ON procedure_category_audit(source_field, id DESC);

CREATE TABLE IF NOT EXISTS news_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    image_path TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    featured INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_public
    ON news_articles(status, featured DESC, published_at DESC);

CREATE TABLE IF NOT EXISTS news_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id TEXT NOT NULL REFERENCES news_articles(id),
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    before_json TEXT,
    after_json TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_audit_article
    ON news_audit_log(news_id, id DESC);

CREATE TABLE IF NOT EXISTS app_data_versions (
    data_key TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    applied_at TEXT NOT NULL
);

-- ============================================================================
-- NHÓM 3: HỒ SƠ MỘT CỬA, BIỂU MẪU 01-06 & KHÓA TRA CỨU FERNET (4 BẢNG)
-- Cấu trúc JSON bên trong cases.payload_json:
--   - applicant: {name, citizenId/organizationId, phone, email, address}
--   - subject: {name, relation}, applicantType ('citizen' | 'organization')
--   - agencyScope, receivingAgency, submissionChannel ('ONLINE' | 'TRUC_TIEP')
--   - declaration: dữ liệu tờ khai theo schemaVersion, documentExemptions
--   - attachments: [{name, stored, size, type, sha256, componentId}]
--   - workflow: bản chụp cấu hình quy trình tại thời điểm nộp, milestones
--   - workflowEvidence, workflowEvidenceHistory: kết quả đối chiếu/thẩm tra
--   - assignment: {assigneeId, assigneeName, unit, assignedAt, assignedBy}
--   - assignmentHistory: lịch sử phân công và hoàn trả giữa các vai trò
--   - supplement, supplementHistory: {reason, items, requestedAt, submittedAt,
--       resumeStatus, stage, requestNumber, citizenNote, newFiles}
--   - deadlineExtension: lịch sử gia hạn kèm phiếu xin lỗi Mẫu 04
--   - fee: {status, paymentStatus, amount, currency, basis, configuredAt,
--       paidAt, reconciledAt, waivedAt, waiverReason, refundStatus, transactionRef}
--   - forms: {mau01, mau02, mau03, mau04, mau05, mau06} (kèm mã QR tra cứu)
--   - withdrawal: {status, channel, requesterType, reason, requestDocuments,
--       noticeNumber, noticeFile, noticeDelivery, refundFollowUp, returnPaperFollowUp}
--   - draftResult, approvedAt, approvedById, approvalNote, approvalHistory
--   - result: {number, content, issuedAt, signatureHash, files: [{name, stored,
--       size, type, sha256}]} (đồng bộ sang kho tài liệu điện tử của công dân)
--   - delivery: {receiver, evidence, channel, deliveredAt, mode}
-- ============================================================================

CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    owner_id TEXT NOT NULL,
    procedure_code TEXT NOT NULL,
    status TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    idempotency_key TEXT UNIQUE,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_status_created
    ON cases(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_owner
    ON cases(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS case_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    audience TEXT NOT NULL DEFAULT 'public',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_case
    ON case_events(case_id, id);

CREATE TABLE IF NOT EXISTS case_lookup_secrets (
    case_id INTEGER PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
    encrypted_key BLOB NOT NULL,
    submission_hash TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_case
    ON feedback(case_id);

-- ============================================================================
-- NHÓM 4: KHÔNG GIAN CÔNG DÂN SỐ (4 BẢNG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS citizen_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    details_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS citizen_drafts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    procedure_code TEXT NOT NULL,
    details_json TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_citizen_drafts_owner
    ON citizen_drafts(user_id, updated_at);

CREATE TABLE IF NOT EXISTS citizen_record_owners (
    record_code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_citizen_records_user
    ON citizen_record_owners(user_id);

CREATE TABLE IF NOT EXISTS citizen_notification_reads (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL,
    read_at TEXT NOT NULL,
    PRIMARY KEY (user_id, event_key)
);

-- ============================================================================
-- NHÓM 5: NGHĨA VỤ TÀI CHÍNH & HOÀN PHÍ KIỂM SOÁT 4 MẮT (3 BẢNG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    transaction_ref TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    basis TEXT NOT NULL,
    provider_mode TEXT NOT NULL DEFAULT 'LOCAL_SANDBOX',
    payment_method TEXT NOT NULL DEFAULT 'SANDBOX',
    payer_reference TEXT NOT NULL DEFAULT '',
    reconciliation_reference TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    reconciled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_records_case
    ON payment_records(case_id);

CREATE TABLE IF NOT EXISTS payment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_ref TEXT NOT NULL REFERENCES payment_records(transaction_ref) ON DELETE CASCADE,
    actor_id TEXT NOT NULL DEFAULT '',
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    idempotency_key TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_events_ref
    ON payment_events(transaction_ref, id);

CREATE TABLE IF NOT EXISTS payment_refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_ref TEXT NOT NULL REFERENCES payment_records(transaction_ref) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    requested_by TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    reviewed_by TEXT NOT NULL DEFAULT '',
    reviewed_at TEXT,
    review_note TEXT NOT NULL DEFAULT '',
    executed_at TEXT,
    execution_reference TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_ref
    ON payment_refunds(transaction_ref, id DESC);

-- ============================================================================
-- NHÓM 6: KÝ THỬ NGHIỆM ED25519 & QUẦY DỊCH VỤ / LỊCH HẸN / PAKN (7 BẢNG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_signing_authorities (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    granted_by TEXT NOT NULL REFERENCES users(id),
    authority_ref TEXT NOT NULL,
    reason TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    granted_at TEXT NOT NULL,
    revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS sandbox_signing_authority_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    actor_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    authority_ref TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sandbox_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_hash TEXT NOT NULL,
    signature_b64 TEXT NOT NULL,
    public_key_b64 TEXT NOT NULL,
    signer_id TEXT NOT NULL REFERENCES users(id),
    signer_name TEXT NOT NULL,
    authority_ref TEXT NOT NULL,
    signed_at TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'LOCAL_SANDBOX',
    UNIQUE (case_id, document_hash)
);

CREATE INDEX IF NOT EXISTS idx_sandbox_signatures_case
    ON sandbox_signatures(case_id, id DESC);

CREATE TABLE IF NOT EXISTS public_appointments (
    code TEXT PRIMARY KEY,
    citizen_name TEXT NOT NULL,
    citizen_id TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    agency TEXT NOT NULL,
    procedure_code TEXT NOT NULL,
    procedure_name TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    queue_number INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    counter_note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_appointments_date_agency
    ON public_appointments(appointment_date, agency);

CREATE TABLE IF NOT EXISTS public_appointment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_code TEXT NOT NULL REFERENCES public_appointments(code) ON DELETE CASCADE,
    actor_id TEXT NOT NULL DEFAULT '',
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointment_events_code
    ON public_appointment_events(appointment_code, id);

CREATE TABLE IF NOT EXISTS public_pakn (
    code TEXT PRIMARY KEY,
    sender_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    agency TEXT NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL,
    reply TEXT NOT NULL DEFAULT '',
    replied_by TEXT NOT NULL DEFAULT '',
    replied_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public_feedback_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_code TEXT NOT NULL REFERENCES public_pakn(code) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_feedback_events_code
    ON public_feedback_events(feedback_code, id);
