/* Thiết kế đề xuất. Không phải lược đồ nội bộ của Hà Nội. */
/* Cần xác nhận nghiệp vụ và an toàn trước triển khai. */
CREATE TABLE co_quan (
    id uuid NOT NULL PRIMARY KEY,
    ma varchar(50) NOT NULL UNIQUE,
    ten text NOT NULL,
    cap varchar(30) NOT NULL,
    hieu_luc_tu date NOT NULL,
    hieu_luc_den date
);

CREATE TABLE thu_tuc (
    id uuid NOT NULL PRIMARY KEY,
    ma_quoc_gia varchar(50) NOT NULL UNIQUE,
    ten text NOT NULL,
    linh_vuc varchar(100) NOT NULL
);

CREATE TABLE phien_ban_thu_tuc (
    id uuid NOT NULL PRIMARY KEY,
    thu_tuc_id uuid NOT NULL REFERENCES thu_tuc(id),
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    so_phien_ban integer NOT NULL CHECK (so_phien_ban > 0),
    quyet_dinh text NOT NULL,
    hieu_luc_tu timestamptz NOT NULL,
    hieu_luc_den timestamptz,
    quy_tac_han jsonb NOT NULL,
    luoc_do_mau jsonb NOT NULL,
    trang_thai varchar(30) NOT NULL,
    cau_hinh_quy_trinh jsonb NOT NULL,
    UNIQUE (thu_tuc_id, co_quan_id, so_phien_ban),
    CHECK (hieu_luc_den IS NULL OR hieu_luc_den > hieu_luc_tu)
);

CREATE TABLE chu_the (
    id uuid NOT NULL PRIMARY KEY,
    loai varchar(30) NOT NULL,
    ho_ten text NOT NULL,
    dinh_danh_ma_hoa text,
    tham_chieu_dinh_danh text,
    lien_he jsonb
);

CREATE TABLE tai_khoan (
    id uuid NOT NULL PRIMARY KEY,
    chu_the_id uuid NOT NULL REFERENCES chu_the(id),
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    ma_dang_nhap varchar(100) NOT NULL UNIQUE,
    trang_thai varchar(30) NOT NULL,
    tao_luc timestamptz NOT NULL
);

CREATE TABLE quyen_pham_vi (
    id uuid NOT NULL PRIMARY KEY,
    tai_khoan_id uuid NOT NULL REFERENCES tai_khoan(id),
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    vai_tro varchar(50) NOT NULL,
    hieu_luc_tu timestamptz NOT NULL,
    hieu_luc_den timestamptz,
    can_cu text NOT NULL
);

CREATE TABLE ho_so (
    id uuid NOT NULL PRIMARY KEY,
    ma_yeu_cau varchar(100) NOT NULL UNIQUE,
    ma_ho_so varchar(100) UNIQUE,
    phien_ban_id uuid NOT NULL REFERENCES phien_ban_thu_tuc(id),
    nguoi_yeu_cau_id uuid NOT NULL REFERENCES chu_the(id),
    chu_the_ho_tich_id uuid REFERENCES chu_the(id),
    trang_thai varchar(40) NOT NULL,
    nhan_luc timestamptz,
    han_goc timestamptz,
    han_hien_hanh timestamptz,
    du_lieu_khai jsonb NOT NULL,
    phien_ban integer NOT NULL CHECK (phien_ban > 0),
    kenh_tiep_nhan varchar(30) NOT NULL,
    ma_diem_tiep_nhan varchar(50),
    nguoi_ho_tro_id uuid REFERENCES tai_khoan(id)
);

CREATE TABLE uy_quyen (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    nguoi_uy_quyen_id uuid NOT NULL REFERENCES chu_the(id),
    nguoi_dai_dien_id uuid NOT NULL REFERENCES chu_the(id),
    quan_he varchar(100) NOT NULL,
    tai_lieu_tham_chieu text,
    pham_vi text NOT NULL,
    hieu_luc_den timestamptz
);

CREATE TABLE thanh_phan_ho_so (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    loai varchar(100) NOT NULL,
    khoa_doi_tuong text,
    bam_sha256 char(64),
    nguon_du_lieu text,
    tham_chieu_nguon text,
    trang_thai varchar(40) NOT NULL,
    phien_ban integer NOT NULL CHECK (phien_ban > 0),
    kich_thuoc_byte bigint CHECK (kich_thuoc_byte >= 0),
    loai_tep varchar(100)
);

CREATE TABLE phan_cong (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    tai_khoan_id uuid NOT NULL REFERENCES tai_khoan(id),
    giao_luc timestamptz NOT NULL,
    ket_thuc_luc timestamptz,
    nguoi_giao_id uuid NOT NULL REFERENCES tai_khoan(id),
    ly_do text NOT NULL
);

CREATE TABLE su_kien_xu_ly (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    tai_khoan_id uuid REFERENCES tai_khoan(id),
    hanh_dong varchar(100) NOT NULL,
    truoc varchar(40),
    sau varchar(40),
    thoi_diem timestamptz NOT NULL,
    can_cu text,
    ma_tuong_quan varchar(100) NOT NULL
);

CREATE TABLE yeu_cau_bo_sung (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    giai_doan varchar(40) NOT NULL,
    noi_dung text NOT NULL,
    can_cu text NOT NULL,
    nguoi_lap_id uuid NOT NULL REFERENCES tai_khoan(id),
    lap_luc timestamptz NOT NULL,
    phan_hoi_luc timestamptz,
    trang_thai_quay_lai varchar(40) NOT NULL
);

CREATE TABLE ket_qua (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    so_phien_ban integer NOT NULL CHECK (so_phien_ban > 0),
    khoa_doi_tuong text NOT NULL,
    bam_sha256 char(64) NOT NULL,
    so_van_ban varchar(100),
    trang_thai varchar(40) NOT NULL,
    thay_the_id uuid REFERENCES ket_qua(id),
    phat_hanh_luc timestamptz,
    kich_thuoc_byte bigint NOT NULL CHECK (kich_thuoc_byte >= 0),
    loai_tep varchar(100) NOT NULL,
    UNIQUE (ho_so_id, so_phien_ban)
);

CREATE TABLE chu_ky (
    id uuid NOT NULL PRIMARY KEY,
    ket_qua_id uuid NOT NULL REFERENCES ket_qua(id),
    nguoi_ky text NOT NULL,
    tham_chieu_chung_thu text NOT NULL,
    ky_luc timestamptz,
    kiem_tra_luc timestamptz NOT NULL,
    ket_luan varchar(40) NOT NULL,
    bang_chung jsonb NOT NULL
);

CREATE TABLE khoan_thu (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    loai varchar(100) NOT NULL,
    so_tien numeric(18,2) NOT NULL CHECK (so_tien >= 0),
    don_vi_tien char(3) NOT NULL,
    can_cu text NOT NULL,
    trang_thai varchar(40) NOT NULL
);

CREATE TABLE giao_dich (
    id uuid NOT NULL PRIMARY KEY,
    khoan_thu_id uuid NOT NULL REFERENCES khoan_thu(id),
    doi_tac varchar(100) NOT NULL,
    ma_ngoai varchar(150) NOT NULL,
    so_tien numeric(18,2) NOT NULL CHECK (so_tien >= 0),
    thoi_diem timestamptz NOT NULL,
    trang_thai varchar(40) NOT NULL,
    tham_chieu_bang_chung text NOT NULL,
    UNIQUE (doi_tac, ma_ngoai)
);

CREATE TABLE giao_nhan (
    id uuid NOT NULL PRIMARY KEY,
    ket_qua_id uuid NOT NULL REFERENCES ket_qua(id),
    nguoi_nhan_id uuid NOT NULL REFERENCES chu_the(id),
    kenh varchar(50) NOT NULL,
    trang_thai varchar(40) NOT NULL,
    thoi_diem timestamptz,
    bang_chung text
);

CREATE TABLE hang_doi_gui (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    ma_thong_diep varchar(150) NOT NULL UNIQUE,
    dich_nhan varchar(150) NOT NULL,
    noi_dung jsonb NOT NULL,
    trang_thai varchar(40) NOT NULL,
    so_lan_thu integer NOT NULL CHECK (so_lan_thu >= 0),
    thu_tiep_luc timestamptz,
    ma_loi varchar(100)
);

CREATE TABLE lich_lam_viec (
    id uuid NOT NULL PRIMARY KEY,
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    ngay date NOT NULL,
    la_ngay_lam boolean NOT NULL,
    bat_dau time,
    ket_thuc time,
    can_cu text NOT NULL,
    UNIQUE (co_quan_id, ngay)
);

CREATE TABLE nhat_ky (
    id uuid NOT NULL PRIMARY KEY,
    tai_khoan_id uuid REFERENCES tai_khoan(id),
    hanh_dong varchar(100) NOT NULL,
    doi_tuong text NOT NULL,
    thoi_diem timestamptz NOT NULL,
    ket_qua varchar(40) NOT NULL,
    ma_tuong_quan varchar(100) NOT NULL
);

CREATE TABLE he_thong_ket_noi (
    id uuid NOT NULL PRIMARY KEY,
    ma varchar(50) NOT NULL UNIQUE,
    ten text NOT NULL,
    loai varchar(30) NOT NULL,
    chu_quan text NOT NULL,
    phien_ban_hop_dong varchar(30) NOT NULL,
    trang_thai varchar(30) NOT NULL
);

CREATE TABLE tuyen_xu_ly (
    id uuid NOT NULL PRIMARY KEY,
    phien_ban_id uuid NOT NULL REFERENCES phien_ban_thu_tuc(id),
    he_thong_id uuid NOT NULL REFERENCES he_thong_ket_noi(id),
    hieu_luc_tu timestamptz NOT NULL,
    hieu_luc_den timestamptz,
    can_cu text NOT NULL,
    phe_duyet_id uuid NOT NULL REFERENCES tai_khoan(id),
    CHECK (hieu_luc_den IS NULL OR hieu_luc_den > hieu_luc_tu)
);

CREATE TABLE tham_chieu_lien_thong (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    he_thong_id uuid NOT NULL REFERENCES he_thong_ket_noi(id),
    ma_ngoai varchar(150) NOT NULL,
    trang_thai_nguon varchar(40) NOT NULL,
    su_kien_cuoi varchar(150),
    thoi_diem_nguon timestamptz NOT NULL,
    nhan_luc timestamptz NOT NULL,
    thu_tu_cuoi bigint CHECK (thu_tu_cuoi > 0),
    UNIQUE (he_thong_id, ma_ngoai),
    UNIQUE (ho_so_id, he_thong_id)
);

CREATE TABLE nhiem_vu_phoi_hop (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    noi_dung text NOT NULL,
    bat_buoc boolean NOT NULL,
    han_tra_loi timestamptz NOT NULL,
    trang_thai varchar(40) NOT NULL,
    tham_chieu_y_kien text,
    phien_ban integer NOT NULL CHECK (phien_ban > 0)
);

CREATE TABLE thong_bao (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    nguoi_nhan_id uuid NOT NULL REFERENCES chu_the(id),
    kenh varchar(30) NOT NULL,
    ma_mau varchar(50) NOT NULL,
    tham_chieu_gui text,
    trang_thai varchar(30) NOT NULL,
    gui_luc timestamptz
);

CREATE TABLE dot_nop_luu (
    id uuid NOT NULL PRIMARY KEY,
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    lap_luc timestamptz NOT NULL,
    phe_duyet_id uuid REFERENCES tai_khoan(id),
    kho_dich text NOT NULL,
    trang_thai varchar(30) NOT NULL
);

CREATE TABLE ho_so_nop_luu (
    id uuid NOT NULL PRIMARY KEY,
    dot_id uuid NOT NULL REFERENCES dot_nop_luu(id),
    ho_so_id uuid NOT NULL REFERENCES ho_so(id),
    ma_goi varchar(100) NOT NULL UNIQUE,
    bam_danh_muc char(64) NOT NULL,
    tham_chieu_bien_nhan text,
    trang_thai varchar(30) NOT NULL,
    nhan_luc timestamptz
);

CREATE TABLE phan_anh_kien_nghi (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid REFERENCES ho_so(id),
    chu_the_id uuid REFERENCES chu_the(id),
    loai varchar(40) NOT NULL,
    noi_dung text NOT NULL,
    co_quan_id uuid REFERENCES co_quan(id),
    trang_thai varchar(30) NOT NULL,
    tao_luc timestamptz NOT NULL
);

CREATE TABLE thong_diep_nhan (
    id uuid NOT NULL PRIMARY KEY,
    he_thong_id uuid NOT NULL REFERENCES he_thong_ket_noi(id),
    ma_thong_diep varchar(150) NOT NULL,
    bam_noi_dung char(64) NOT NULL,
    ho_so_id uuid REFERENCES ho_so(id),
    trang_thai varchar(30) NOT NULL,
    nhan_luc timestamptz NOT NULL,
    ma_loi varchar(100),
    thu_tu_nguon bigint NOT NULL CHECK (thu_tu_nguon > 0),
    thoi_diem_nguon timestamptz NOT NULL,
    loai_su_kien varchar(40) NOT NULL,
    ma_ho_so_ngoai varchar(150) NOT NULL,
    tham_chieu_noi_dung text NOT NULL,
    UNIQUE (he_thong_id, ma_thong_diep)
);

CREATE TABLE diem_tiep_nhan (
    id uuid NOT NULL PRIMARY KEY,
    ma varchar(50) NOT NULL UNIQUE,
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    ten text NOT NULL,
    dia_chi text NOT NULL,
    hieu_luc_tu timestamptz NOT NULL,
    hieu_luc_den timestamptz,
    CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den > hieu_luc_tu)
);

CREATE TABLE mau_bao_cao (
    id uuid NOT NULL PRIMARY KEY,
    ma varchar(50) NOT NULL,
    so_phien_ban integer NOT NULL CHECK (so_phien_ban > 0),
    ten text NOT NULL,
    dinh_nghia jsonb NOT NULL,
    nguon_du_lieu jsonb NOT NULL,
    phe_duyet_id uuid NOT NULL REFERENCES tai_khoan(id),
    hieu_luc_tu timestamptz NOT NULL,
    hieu_luc_den timestamptz,
    UNIQUE (ma, so_phien_ban),
    CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den > hieu_luc_tu)
);

CREATE TABLE tai_lieu_huong_dan (
    id uuid NOT NULL PRIMARY KEY,
    ten text NOT NULL,
    can_cu text NOT NULL,
    so_phien_ban integer NOT NULL CHECK (so_phien_ban > 0),
    dia_chi text NOT NULL,
    bam_sha256 char(64) NOT NULL,
    phe_duyet_id uuid NOT NULL REFERENCES tai_khoan(id),
    hieu_luc_tu timestamptz NOT NULL,
    hieu_luc_den timestamptz,
    trang_thai varchar(30) NOT NULL,
    CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den > hieu_luc_tu)
);

CREATE TABLE tai_lieu_kho (
    id uuid NOT NULL PRIMARY KEY,
    chu_the_id uuid NOT NULL REFERENCES chu_the(id),
    ket_qua_id uuid REFERENCES ket_qua(id),
    thanh_phan_id uuid REFERENCES thanh_phan_ho_so(id),
    loai varchar(100) NOT NULL,
    nguon text NOT NULL,
    khoa_doi_tuong text NOT NULL,
    bam_sha256 char(64) NOT NULL,
    hieu_luc_tu timestamptz,
    hieu_luc_den timestamptz,
    thay_the_id uuid REFERENCES tai_lieu_kho(id),
    trang_thai varchar(30) NOT NULL,
    CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den > hieu_luc_tu)
);

CREATE TABLE quyen_khai_thac_kho (
    id uuid NOT NULL PRIMARY KEY,
    tai_lieu_id uuid NOT NULL REFERENCES tai_lieu_kho(id),
    chu_the_id uuid NOT NULL REFERENCES chu_the(id),
    muc_dich text NOT NULL,
    can_cu text NOT NULL,
    hieu_luc_tu timestamptz NOT NULL,
    hieu_luc_den timestamptz,
    trang_thai varchar(30) NOT NULL,
    CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den > hieu_luc_tu)
);

CREATE TABLE chi_dao_dieu_hanh (
    id uuid NOT NULL PRIMARY KEY,
    ho_so_id uuid REFERENCES ho_so(id),
    co_quan_id uuid NOT NULL REFERENCES co_quan(id),
    nguoi_giao_id uuid NOT NULL REFERENCES tai_khoan(id),
    nguoi_nhan_id uuid REFERENCES tai_khoan(id),
    noi_dung text NOT NULL,
    tao_luc timestamptz NOT NULL,
    han_phan_hoi timestamptz NOT NULL,
    trang_thai varchar(30) NOT NULL,
    tham_chieu_phan_hoi text,
    phien_ban integer NOT NULL CHECK (phien_ban > 0)
);

CREATE INDEX ix_ho_so_xu_ly ON ho_so (trang_thai, han_hien_hanh);
CREATE INDEX ix_su_kien ON su_kien_xu_ly (ho_so_id, thoi_diem);
CREATE UNIQUE INDEX uq_phan_cong_hien_hanh ON phan_cong (ho_so_id) WHERE ket_thuc_luc IS NULL;