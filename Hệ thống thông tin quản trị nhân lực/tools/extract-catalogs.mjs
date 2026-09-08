// ============================================================================
// Script trích xuất và chuẩn hóa toàn bộ 31 danh mục từ D:\HUHA_HRM\DATA
// Chuyển mã TCVN3 sang Unicode UTF-8 chuẩn xác, bổ sung dữ liệu hành chính Nhà nước.
// ============================================================================

import fs from 'fs';
import path from 'path';

const TCVN3_MAP = {
  0xa7: 'Đ', 0xae: 'đ',
  0xa8: 'ă', 0xbb: 'ắ', 0xba: 'ằ', 0xbc: 'ẳ', 0xbd: 'ẵ', 0xbe: 'ặ',
  0xa9: 'â', 0xca: 'ấ', 0xc7: 'ầ', 0xc8: 'ẩ', 0xc9: 'ẫ', 0xcb: 'ậ',
  0xaa: 'ê', 0xd5: 'ế', 0xd2: 'ề', 0xd3: 'ể', 0xd4: 'ễ', 0xd6: 'ệ',
  0xab: 'ô', 0xe8: 'ố', 0xe6: 'ồ', 0xe7: 'ổ', 0xea: 'ỗ', 0xeb: 'ộ',
  0xac: 'ơ', 0xee: 'ớ', 0xec: 'ờ', 0xed: 'ở', 0xef: 'ỡ', 0xf0: 'ợ',
  0xad: 'ư', 0xf8: 'ứ', 0xf6: 'ừ', 0xf7: 'ữ', 0xfa: 'ử', 0xf9: 'ự',
  0xb8: 'á', 0xb5: 'à', 0xb6: 'ả', 0xb7: 'ã', 0xb9: 'ạ',
  0xcc: 'é', 0xcd: 'è', 0xce: 'ẻ', 0xcf: 'ẽ', 0xd0: 'ẹ',
  0xdd: 'í', 0xd7: 'ì', 0xd8: 'ỉ', 0xd9: 'ĩ', 0xde: 'ị',
  0xe3: 'ó', 0xdf: 'ò', 0xe1: 'ỏ', 0xe2: 'õ', 0xe4: 'ọ',
  0xf3: 'ú', 0xf1: 'ù', 0xf2: 'ủ', 0xf5: 'ũ', 0xf4: 'ụ',
  0xfd: 'ý', 0xfb: 'ỳ', 0xfc: 'ỹ', 0xfe: 'ỵ',
};

function decodeTcvn3(buf) {
  let s = '';
  for (let b of buf) {
    if (TCVN3_MAP[b]) s += TCVN3_MAP[b];
    else if (b >= 32 && b <= 126) s += String.fromCharCode(b);
  }
  return s.trim();
}

function readDbf(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const buf = fs.readFileSync(filePath);
  const numRecs = buf.readUInt32LE(4);
  const headerLen = buf.readUInt16LE(8);
  const recLen = buf.readUInt16LE(10);
  const fields = [];
  for (let i = 32; i < headerLen - 1; i += 32) {
    if (buf[i] === 0x0D) break;
    const name = buf.toString('ascii', i, i + 11).replace(/\0/g, '').trim();
    const len = buf[i + 16];
    fields.push({ name, len });
  }
  const records = [];
  for (let r = 0; r < numRecs; r++) {
    const start = headerLen + r * recLen;
    if (buf[start] === 0x2A) continue; // deleted record
    let off = start + 1;
    const item = {};
    for (let f of fields) {
      if (f.name === '_NullFlags') continue;
      item[f.name] = decodeTcvn3(buf.slice(off, off + f.len));
      off += f.len;
    }
    records.push(item);
  }
  return records;
}

const HUHA_DATA_DIR = 'D:/HUHA_HRM/DATA';

// 1. Dân tộc (56 mục từ dmdtoc.DBF)
const rawDtoc = readDbf(path.join(HUHA_DATA_DIR, 'dmdtoc.DBF'));
const danToc = rawDtoc.map(d => ({
  code: d.MA_DTOC,
  name: d.TEN_DTOC || d.MA_DTOC,
}));

// 2. Tôn giáo (10 mục từ DMTGIAO.DBF)
const rawTgiao = readDbf(path.join(HUHA_DATA_DIR, 'DMTGIAO.DBF'));
const tonGiao = rawTgiao.map(t => ({
  code: t.MA_TGIAO,
  name: t.TEN_TGIAO === 'Khong' ? 'Không tôn giáo' :
        t.TEN_TGIAO === 'Phat giao' ? 'Phật giáo' :
        t.TEN_TGIAO === 'Cong giao' ? 'Công giáo' :
        t.TEN_TGIAO === 'Cao dai' ? 'Cao Đài' :
        t.TEN_TGIAO === 'Hoa hao' ? 'Hòa Hảo' :
        t.TEN_TGIAO === 'Tin lanh' ? 'Tin Lành' :
        t.TEN_TGIAO === 'Hoi giao' ? 'Hồi giáo' :
        t.TEN_TGIAO === 'Ton giao khac' ? 'Tôn giáo khác' :
        t.TEN_TGIAO === 'Ba la mon' ? 'Bà La Môn' :
        t.TEN_TGIAO === 'Ba ni' ? 'Bà Ni' : t.TEN_TGIAO,
}));

// 3. Tình trạng hôn nhân (5 mục)
const rawTthn = readDbf(path.join(HUHA_DATA_DIR, 'dmtthn.DBF'));
const honNhan = rawTthn.map(h => ({
  code: h.MA_TTHN,
  name: h.TEN_TTHN || h.MA_TTHN,
}));

// 4. Ngạch công chức (184 ngạch từ DMNGCC.DBF)
const rawNgcc = readDbf(path.join(HUHA_DATA_DIR, 'DMNGCC.DBF'));
const ngachCongChuc = rawNgcc.map(n => ({
  code: n.MA_NGACH,
  name: n.TEN_NGACH,
  groupCode: n.MA_NHOM,
  sector: n.LINHVUC,
  maxStep: Number(n.TOTKHUNG) || 9,
  salarySteps: [
    n.BAC1, n.BAC2, n.BAC3, n.BAC4, n.BAC5, n.BAC6, n.BAC7, n.BAC8,
    n.BAC9, n.BAC10, n.BAC11, n.BAC12, n.BAC13, n.BAC14, n.BAC15, n.BAC16
  ].filter(b => b && Number(b) > 0)
}));

// 5. Nhóm ngạch công chức (28 nhóm từ nhomngcc.dbf)
const rawNhomNgcc = readDbf(path.join(HUHA_DATA_DIR, 'nhomngcc.dbf'));
const nhomNgach = rawNhomNgcc.map(nh => ({
  code: nh.MA_NHOM,
  name: nh.TEN_NHOM,
  payTable: nh.BANG_LUONG,
  yearsToStep: Number(nh.SO_NAM) || 3,
  overCapPct: nh.PTRAM_VK1,
}));

// 6. Ngành đào tạo (515 ngành từ DMNGDTAO.DBF)
const rawNgdt = readDbf(path.join(HUHA_DATA_DIR, 'DMNGDTAO.DBF'));
const nganhDaoTao = rawNgdt.map(nd => ({
  code: nd.MA_NGANH,
  name: nd.TEN_NGANH,
}));

// 7. Ngoại ngữ (11 mục từ dmnngu.DBF)
const rawNngu = readDbf(path.join(HUHA_DATA_DIR, 'dmnngu.DBF'));
const ngoaiNgu = rawNngu.map(nn => ({
  code: nn.MA_NN,
  name: nn.TEN_NN === 'Anh' ? 'Tiếng Anh' :
        nn.TEN_NN === 'Phap' ? 'Tiếng Pháp' :
        nn.TEN_NN === 'Nga' ? 'Tiếng Nga' :
        nn.TEN_NN === 'Trung Quoc' ? 'Tiếng Trung Quốc' :
        nn.TEN_NN === 'Duc' ? 'Tiếng Đức' :
        nn.TEN_NN === 'Nhat' ? 'Tiếng Nhật' :
        nn.TEN_NN === 'Han Quoc' ? 'Tiếng Hàn Quốc' :
        nn.TEN_NN === 'Tay Ban Nha' ? 'Tiếng Tây Ban Nha' :
        nn.TEN_NN === 'Y' ? 'Tiếng Ý' :
        nn.TEN_NN === 'A Rap' ? 'Tiếng Ả Rập' : nn.TEN_NN,
}));

// 8. Trình độ ngoại ngữ
const trinhDoNgoaiNgu = [
  { code: 'A1', name: 'Bậc 1/6 (Sơ cấp A1 / Khung Châu Âu)' },
  { code: 'A2', name: 'Bậc 2/6 (Sơ cấp A2)' },
  { code: 'B1', name: 'Bậc 3/6 (Trung cấp B1 / Chuẩn tốt nghiệp ĐH)' },
  { code: 'B2', name: 'Bậc 4/6 (Trung cấp B2 / Chuẩn chuyên viên chính)' },
  { code: 'C1', name: 'Bậc 5/6 (Cao cấp C1 / Chuẩn chuyên viên cao cấp)' },
  { code: 'C2', name: 'Bậc 6/6 (Cao cấp C2 / Thành thạo)' },
  { code: 'CC_A', name: 'Chứng chỉ A (Quy định cũ)' },
  { code: 'CC_B', name: 'Chứng chỉ B (Quy định cũ)' },
  { code: 'CC_C', name: 'Chứng chỉ C (Quy định cũ)' },
  { code: 'IELTS', name: 'Chứng chỉ quốc tế IELTS' },
  { code: 'TOEIC', name: 'Chứng chỉ quốc tế TOEIC' },
  { code: 'TOEFL', name: 'Chứng chỉ quốc tế TOEFL' },
];

// 9. Chức vụ Đảng
const chucVuDang = [
  { code: 'BT_DU', name: 'Bí thư Đảng ủy' },
  { code: 'PBT_DU', name: 'Phó Bí thư Đảng ủy' },
  { code: 'UV_BTV', name: 'Ủy viên Ban Thường vụ Đảng ủy' },
  { code: 'UV_BCH', name: 'Ủy viên Ban Chấp hành Đảng bộ' },
  { code: 'BT_CB', name: 'Bí thư Chi bộ' },
  { code: 'PBT_CB', name: 'Phó Bí thư Chi bộ' },
  { code: 'CUV', name: 'Chi ủy viên' },
  { code: 'DV_CT', name: 'Đảng viên chính thức' },
  { code: 'DV_DB', name: 'Đảng viên dự bị' },
];

// 10. Chức vụ Đoàn
const chucVuDoan = [
  { code: 'BT_DCS', name: 'Bí thư Đoàn cơ sở' },
  { code: 'PBT_DCS', name: 'Phó Bí thư Đoàn cơ sở' },
  { code: 'UV_BTV_D', name: 'Ủy viên Ban Thường vụ Đoàn' },
  { code: 'UV_BCH_D', name: 'Ủy viên Ban Chấp hành Đoàn' },
  { code: 'BT_CD', name: 'Bí thư Chi đoàn' },
  { code: 'PBT_CD', name: 'Phó Bí thư Chi đoàn' },
  { code: 'DOAN_VIEN', name: 'Đoàn viên' },
];

// 11. Quân hàm
const quanHam = [
  { code: 'QH_BN', name: 'Binh nhì' },
  { code: 'QH_BNH', name: 'Binh nhất' },
  { code: 'QH_HS', name: 'Hạ sĩ' },
  { code: 'QH_TS', name: 'Trung sĩ' },
  { code: 'QH_THS', name: 'Thượng sĩ' },
  { code: 'QH_CU', name: 'Chuẩn úy' },
  { code: 'QH_TU', name: 'Thiếu úy' },
  { code: 'QH_TRU', name: 'Trung úy' },
  { code: 'QH_THU', name: 'Thượng úy' },
  { code: 'QH_DU', name: 'Đại úy' },
  { code: 'QH_THTA', name: 'Thiếu tá' },
  { code: 'QH_TRTA', name: 'Trung tá' },
  { code: 'QH_THTA2', name: 'Thượng tá' },
  { code: 'QH_DTA', name: 'Đại tá' },
  { code: 'QH_TTUONG', name: 'Thiếu tướng' },
  { code: 'QH_TRTUONG', name: 'Trung tướng' },
  { code: 'QH_THTUONG', name: 'Thượng tướng' },
  { code: 'QH_DTUONG', name: 'Đại tướng' },
];

// 12. Chức vụ trong Lực lượng vũ trang
const chucVuLlvf = [
  { code: 'CV_CS', name: 'Chiến sĩ' },
  { code: 'CV_TDT', name: 'Tiểu đội trưởng' },
  { code: 'CV_TRDT', name: 'Trung đội trưởng' },
  { code: 'CV_DDT', name: 'Đại đội trưởng' },
  { code: 'CV_TDT2', name: 'Tiểu đoàn trưởng' },
  { code: 'CV_TRDT2', name: 'Trung đoàn trưởng' },
  { code: 'CV_LDT', name: 'Lữ đoàn trưởng' },
  { code: 'CV_SDT', name: 'Sư đoàn trưởng' },
  { code: 'CV_QDT', name: 'Quân đoàn trưởng' },
  { code: 'CV_QKT', name: 'Tư lệnh Quân khu / Quân chủng' },
];

// 13. Thành phần xuất thân
const thanhPhanXuatThan = [
  { code: 'XT_CB', name: 'Cán bộ, Công chức, Viên chức' },
  { code: 'XT_CN', name: 'Công nhân' },
  { code: 'XT_ND', name: 'Nông dân' },
  { code: 'XT_TT', name: 'Trí thức' },
  { code: 'XT_QN', name: 'Quân nhân, Lực lượng vũ trang' },
  { code: 'XT_TN', name: 'Tiểu thương, Tiểu chủ' },
  { code: 'XT_KHAC', name: 'Khác' },
];

// 14. Đối tượng hưởng chính sách Nhà nước
const doiTuongChinhSach = [
  { code: 'CS_CLS', name: 'Con liệt sĩ' },
  { code: 'CS_CTB', name: 'Con thương binh' },
  { code: 'CS_CBB', name: 'Con bệnh binh' },
  { code: 'CS_TB', name: 'Bản thân là thương binh' },
  { code: 'CS_BB', name: 'Bản thân là bệnh binh' },
  { code: 'CS_AHLL', name: 'Anh hùng Lực lượng vũ trang nhân dân' },
  { code: 'CS_AHLD', name: 'Anh hùng Lao động' },
  { code: 'CS_GDC', name: 'Gia đình có công với cách mạng' },
  { code: 'CS_KHONG', name: 'Không thuộc diện ưu đãi chính sách' },
];

// 15. Trình độ chuyên môn
const trinhDoChuyenMon = [
  { code: 'TD_TS', name: 'Tiến sĩ' },
  { code: 'TD_THS', name: 'Thạc sĩ' },
  { code: 'TD_DH', name: 'Đại học (Cử nhân / Kỹ sư / Bác sĩ)' },
  { code: 'TD_CD', name: 'Cao đẳng' },
  { code: 'TD_TC', name: 'Trung cấp' },
  { code: 'TD_SC', name: 'Sơ cấp / Chứng chỉ nghề' },
  { code: 'TD_CHUA', name: 'Chưa qua đào tạo nghề' },
];

// 16. Hình thức đào tạo
const hinhThucDaoTao = [
  { code: 'HT_CQ', name: 'Chính quy tập trung' },
  { code: 'HT_TC', name: 'Tại chức / Vừa làm vừa học' },
  { code: 'HT_TX', name: 'Từ xa (E-learning)' },
  { code: 'HT_LT', name: 'Liên thông' },
  { code: 'HT_CHUYEN', name: 'Chuyên tu' },
  { code: 'HT_BD', name: 'Bồi dưỡng ngắn hạn / Tập huấn' },
];

// 17. Trình độ Lý luận chính trị
const trinhDoLlct = [
  { code: 'LLCT_CN', name: 'Cử nhân Lý luận chính trị' },
  { code: 'LLCT_CC', name: 'Cao cấp Lý luận chính trị' },
  { code: 'LLCT_TC', name: 'Trung cấp Lý luận chính trị' },
  { code: 'LLCT_SC', name: 'Sơ cấp Lý luận chính trị' },
  { code: 'LLCT_CHUA', name: 'Chưa qua đào tạo lý luận chính trị' },
];

// 18. Trình độ Quản lý nhà nước
const trinhDoQlnn = [
  { code: 'QLNN_CVCC', name: 'Bồi dưỡng ngạch Chuyên viên cao cấp' },
  { code: 'QLNN_CVC', name: 'Bồi dưỡng ngạch Chuyên viên chính' },
  { code: 'QLNN_CV', name: 'Bồi dưỡng ngạch Chuyên viên' },
  { code: 'QLNN_CS', name: 'Bồi dưỡng ngạch Cán sự' },
  { code: 'QLNN_LANHDAO', name: 'Bồi dưỡng Lãnh đạo, Quản lý cấp Vụ/Cục/Sở/Phòng' },
  { code: 'QLNN_CHUA', name: 'Chưa qua bồi dưỡng quản lý nhà nước' },
];

// 19. Trình độ Quản lý kinh tế
const trinhDoQlkt = [
  { code: 'QLKT_CC', name: 'Cao cấp Quản lý kinh tế' },
  { code: 'QLKT_TC', name: 'Trung cấp Quản lý kinh tế' },
  { code: 'QLKT_SC', name: 'Sơ cấp Quản lý kinh tế' },
  { code: 'QLKT_CHUA', name: 'Chưa qua bồi dưỡng quản lý kinh tế' },
];

// 20. Trình độ Tin học
const trinhDoTinHoc = [
  { code: 'TH_DH', name: 'Đại học chuyên ngành Công nghệ thông tin' },
  { code: 'TH_CD', name: 'Cao đẳng chuyên ngành Tin học' },
  { code: 'TH_NC', name: 'Chứng chỉ Tin học chuẩn Kỹ năng CNTT nâng cao (Thông tư 03/2014/TT-BTTTT)' },
  { code: 'TH_CB', name: 'Chứng chỉ Tin học chuẩn Kỹ năng CNTT cơ bản' },
  { code: 'TH_CC_B', name: 'Chứng chỉ Tin học trình độ B (cũ)' },
  { code: 'TH_CC_A', name: 'Chứng chỉ Tin học trình độ A (cũ)' },
  { code: 'TH_MOS', name: 'Chứng chỉ Quốc tế Microsoft Office Specialist (MOS)' },
  { code: 'TH_IC3', name: 'Chứng chỉ Quốc tế IC3' },
];

// 21. Trình độ Học vấn phổ thông
const trinhDoHvpt = [
  { code: 'PT_12', name: '12/12 (Tốt nghiệp Trung học phổ thông)' },
  { code: 'PT_10', name: '10/10 (Hệ phổ thông 10 năm)' },
  { code: 'PT_9', name: '9/12 (Tốt nghiệp Trung học cơ sở)' },
  { code: 'PT_7', name: '7/10 (Hệ cơ sở cũ)' },
  { code: 'PT_5', name: 'Tiểu học' },
];

// 22. Danh hiệu được phong
const danhHieuPhong = [
  { code: 'DH_NGND', name: 'Nhà giáo Nhân dân' },
  { code: 'DH_NGUT', name: 'Nhà giáo Ưu tú' },
  { code: 'DH_TTND', name: 'Thầy thuốc Nhân dân' },
  { code: 'DH_TTUT', name: 'Thầy thuốc Ưu tú' },
  { code: 'DH_NSND', name: 'Nghệ sĩ Nhân dân' },
  { code: 'DH_NSUT', name: 'Nghệ sĩ Ưu tú' },
  { code: 'DH_NNND', name: 'Nghệ nhân Nhân dân' },
  { code: 'DH_NNUT', name: 'Nghệ nhân Ưu tú' },
  { code: 'DH_AHLD', name: 'Anh hùng Lao động' },
  { code: 'DH_CSTQ', name: 'Chiến sĩ Thi đua toàn quốc' },
];

// 23. Chức danh, Chức vụ quản lý chính quyền
const chucVuChinhQuyen = [
  { code: 'CV_BGĐ_GD', name: 'Giám đốc / Tổng giám đốc' },
  { code: 'CV_BGĐ_PGD', name: 'Phó Giám đốc / Phó Tổng giám đốc' },
  { code: 'CV_TP', name: 'Trưởng phòng / Trưởng ban / Trưởng khoa' },
  { code: 'CV_PP', name: 'Phó Trưởng phòng / Phó Trưởng ban / Phó Trưởng khoa' },
  { code: 'CV_TT', name: 'Tổ trưởng / Trưởng nhóm chuyên môn' },
  { code: 'CV_TP_PHO', name: 'Tổ phó chuyên môn' },
  { code: 'CV_CVCC', name: 'Chuyên viên cao cấp' },
  { code: 'CV_CVC', name: 'Chuyên viên chính' },
  { code: 'CV_CV', name: 'Chuyên viên nghiệp vụ' },
  { code: 'CV_CS', name: 'Cán sự / Nhân viên chuyên môn' },
  { code: 'CV_NV', name: 'Nhân viên hỗ trợ / Nhân viên thừa hành' },
];

// 24. Công việc chuyên môn đảm nhiệm
const congViecChuyenMon = [
  { code: 'CV_GD', name: 'Giảng dạy / Đào tạo' },
  { code: 'CV_NCKH', name: 'Nghiên cứu khoa học' },
  { code: 'CV_QLNN', name: 'Quản lý nhà nước / Hành chính công' },
  { code: 'CV_TCHC', name: 'Tổ chức cán bộ - Hành chính văn phòng' },
  { code: 'CV_KTTK', name: 'Tài chính - Kế toán - Ngân sách' },
  { code: 'CV_CNTT', name: 'Công nghệ thông tin - Chuyển đổi số' },
  { code: 'CV_PC', name: 'Pháp chế - Kiểm tra - Thanh tra' },
  { code: 'CV_HTQT', name: 'Hợp tác quốc tế / Đối ngoại' },
  { code: 'CV_QLDA', name: 'Quản lý dự án / Kế hoạch tổng hợp' },
  { code: 'CV_CSKH', name: 'Dịch vụ công / Chăm sóc đối tác khách hàng' },
  { code: 'CV_TH', name: 'Văn thư - Lưu trữ - Thư viện' },
];

// 25. Lĩnh vực công tác
const linhVucCongTac = [
  { code: 'LV_NOIVU', name: 'Nội vụ - Quản trị nhân lực' },
  { code: 'LV_GDDT', name: 'Giáo dục và Đào tạo' },
  { code: 'LV_KHCN', name: 'Khoa học và Công nghệ' },
  { code: 'LV_TTTT', name: 'Thông tin và Truyền thông' },
  { code: 'LV_TAICHINH', name: 'Tài chính - Kế hoạch - Đầu tư' },
  { code: 'LV_TUPHAP', name: 'Tư pháp - Pháp luật' },
  { code: 'LV_YTE', name: 'Y tế - Chăm sóc sức khỏe' },
  { code: 'LV_VHXH', name: 'Văn hóa - Thể thao - Du lịch' },
  { code: 'LV_CONGTHUONG', name: 'Công thương - Sản xuất kinh doanh' },
  { code: 'LV_XAYDUNG', name: 'Xây dựng - Giao thông - Đô thị' },
];

// 26. Ngành nghề trước tuyển dụng
const nganhNgheTruocTd = [
  { code: 'NN_SINHVIEN', name: 'Học sinh, sinh viên mới tốt nghiệp' },
  { code: 'NN_CANBO_CQ', name: 'Cán bộ, công chức cơ quan khác thuyên chuyển' },
  { code: 'NN_DOANHNGHIEP', name: 'Nhân sự từ doanh nghiệp / Khối tư nhân' },
  { code: 'NN_LLVT', name: 'Lực lượng vũ trang (quân nhân, công an xuất ngũ)' },
  { code: 'NN_TUDO', name: 'Lao động tự do' },
  { code: 'NN_KHAC', name: 'Ngành nghề khác' },
];

// 27. Đơn vị quản lý hành chính
const donViQuanLy = [
  { code: 'DV_TW', name: 'Cơ quan, Đơn vị cấp Trung ương / Tổng công ty' },
  { code: 'DV_TINH', name: 'Cơ quan, Đơn vị cấp Tỉnh / Thành phố trực thuộc TW' },
  { code: 'DV_HUYEN', name: 'Cơ quan, Đơn vị cấp Quận / Huyện / Thị xã' },
  { code: 'DV_XA', name: 'Cơ quan, Đơn vị cấp Xã / Phường / Thị trấn' },
  { code: 'DV_SNCL', name: 'Đơn vị sự nghiệp công lập' },
  { code: 'DV_DNTN', name: 'Doanh nghiệp / Tập đoàn kinh tế' },
];

// 28. Hình thức khen thưởng, kỷ luật
const khenThuongKyLuat = [
  { code: 'KT_HC_SAOVANG', name: 'Huân chương Sao vàng', type: 'KHEN_THUONG' },
  { code: 'KT_HC_HCM', name: 'Huân chương Hồ Chí Minh', type: 'KHEN_THUONG' },
  { code: 'KT_HC_DOCLAP', name: 'Huân chương Độc lập (Hạng 1, 2, 3)', type: 'KHEN_THUONG' },
  { code: 'KT_HC_LAODONG', name: 'Huân chương Lao động (Hạng 1, 2, 3)', type: 'KHEN_THUONG' },
  { code: 'KT_BK_TTG', name: 'Bằng khen của Thủ tướng Chính phủ', type: 'KHEN_THUONG' },
  { code: 'KT_BK_BO', name: 'Bằng khen cấp Bộ / Tỉnh / Thành phố', type: 'KHEN_THUONG' },
  { code: 'KT_CSTDTQ', name: 'Danh hiệu Chiến sĩ thi đua toàn quốc', type: 'KHEN_THUONG' },
  { code: 'KT_CSTDCB', name: 'Danh hiệu Chiến sĩ thi đua cấp Bộ/Tỉnh', type: 'KHEN_THUONG' },
  { code: 'KT_CSTDCS', name: 'Danh hiệu Chiến sĩ thi đua cơ sở', type: 'KHEN_THUONG' },
  { code: 'KT_LĐTT', name: 'Danh hiệu Lao động tiên tiến', type: 'KHEN_THUONG' },
  { code: 'KT_GK', name: 'Giấy khen của Thủ trưởng cơ quan, đơn vị', type: 'KHEN_THUONG' },
  { code: 'KL_KTHRACH', name: 'Khiển trách', type: 'KY_LUAT' },
  { code: 'KL_CCAO', name: 'Cảnh cáo', type: 'KY_LUAT' },
  { code: 'KL_HALUONG', name: 'Hạ bậc lương', type: 'KY_LUAT' },
  { code: 'KL_HACHUC', name: 'Giáng chức', type: 'KY_LUAT' },
  { code: 'KL_CACHCHUC', name: 'Cách chức', type: 'KY_LUAT' },
  { code: 'KL_BUOCTHOI', name: 'Buộc thôi việc / Sa thải', type: 'KY_LUAT' },
];

// 29. Tình trạng sức khỏe
const tinhTrangSucKhoe = [
  { code: 'SK_1', name: 'Loại 1 (Rất khỏe - Đủ điều kiện công tác tốt)' },
  { code: 'SK_2', name: 'Loại 2 (Khỏe - Đáp ứng đầy đủ nhiệm vụ)' },
  { code: 'SK_3', name: 'Loại 3 (Trung bình - Có bệnh lý cần theo dõi)' },
  { code: 'SK_4', name: 'Loại 4 (Yếu - Hạn chế lao động nặng)' },
];

// 30. Hạng thương binh
const hangThuongBinh = [
  { code: 'TB_1_4', name: 'Thương binh Hạng 1/4 (Tỷ lệ mất sức 81% - 100%)' },
  { code: 'TB_2_4', name: 'Thương binh Hạng 2/4 (Tỷ lệ mất sức 61% - 80%)' },
  { code: 'TB_3_4', name: 'Thương binh Hạng 3/4 (Tỷ lệ mất sức 41% - 60%)' },
  { code: 'TB_4_4', name: 'Thương binh Hạng 4/4 (Tỷ lệ mất sức 21% - 40%)' },
  { code: 'BB_1_3', name: 'Bệnh binh Hạng 1/3' },
  { code: 'BB_2_3', name: 'Bệnh binh Hạng 2/3' },
  { code: 'BB_3_3', name: 'Bệnh binh Hạng 3/3' },
];

// 31. Các nước trên thế giới
const cacNuoc = [
  { code: 'VN', name: 'Việt Nam' },
  { code: 'US', name: 'Hoa Kỳ (Mỹ)' },
  { code: 'GB', name: 'Vương quốc Anh' },
  { code: 'FR', name: 'Pháp' },
  { code: 'DE', name: 'Đức' },
  { code: 'RU', name: 'Nga' },
  { code: 'CN', name: 'Trung Quốc' },
  { code: 'JP', name: 'Nhật Bản' },
  { code: 'KR', name: 'Hàn Quốc' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Úc (Australia)' },
  { code: 'CA', name: 'Canada' },
  { code: 'TH', name: 'Thái Lan' },
  { code: 'LA', name: 'Lào' },
  { code: 'KH', name: 'Campuchia' },
];

// 32. Trường đào tạo
const truongDaoTao = [
  { code: 'DH_QGHN', name: 'Đại học Quốc gia Hà Nội' },
  { code: 'DH_QGHCM', name: 'Đại học Quốc gia TP. Hồ Chí Minh' },
  { code: 'HV_HCQG', name: 'Học viện Hành chính Quốc gia' },
  { code: 'HV_CTQG', name: 'Học viện Chính trị Quốc gia Hồ Chí Minh' },
  { code: 'DH_BKHN', name: 'Đại học Bách Khoa Hà Nội' },
  { code: 'DH_KTQD', name: 'Trường Đại học Kinh tế Quốc dân' },
  { code: 'DH_LUAT', name: 'Trường Đại học Luật Hà Nội' },
  { code: 'DH_NVHN', name: 'Trường Đại học Nội vụ Hà Nội (Cũ)' },
  { code: 'DH_NVHCM', name: 'Phân hiệu ĐH Nội vụ TP.HCM' },
  { code: 'DH_SPHN', name: 'Trường Đại học Sư phạm Hà Nội' },
  { code: 'DH_YHN', name: 'Trường Đại học Y Hà Nội' },
  { code: 'HV_TC', name: 'Học viện Tài chính' },
  { code: 'HV_NH', name: 'Học viện Ngân hàng' },
  { code: 'HV_BCVT', name: 'Học viện Công nghệ Bưu chính Viễn thông' },
];

// Gom thành 4 nhóm danh mục chuẩn
const MASTER_CATALOGS = {
  meta: {
    title: 'Hệ thống Danh mục Quản trị Nhân lực Toàn diện (HRMIS Pro)',
    standard: 'Quy chuẩn Bộ Nội vụ & Doanh nghiệp',
    version: '2026.1',
    extractedAt: new Date().toISOString(),
    totalCatalogs: 32,
    totalRecords: danToc.length + tonGiao.length + honNhan.length + ngachCongChuc.length + nhomNgach.length + nganhDaoTao.length + ngoaiNgu.length + trinhDoNgoaiNgu.length + chucVuDang.length + chucVuDoan.length + quanHam.length + chucVuLlvf.length + thanhPhanXuatThan.length + doiTuongChinhSach.length + trinhDoChuyenMon.length + hinhThucDaoTao.length + trinhDoLlct.length + trinhDoQlnn.length + trinhDoQlkt.length + trinhDoTinHoc.length + trinhDoHvpt.length + danhHieuPhong.length + chucVuChinhQuyen.length + congViecChuyenMon.length + linhVucCongTac.length + nganhNgheTruocTd.length + donViQuanLy.length + khenThuongKyLuat.length + tinhTrangSucKhoe.length + hangThuongBinh.length + cacNuoc.length + truongDaoTao.length,
  },
  groups: [
    {
      id: 'personal_politics',
      title: 'Nhân thân & Chính trị',
      description: 'Dân tộc, tôn giáo, hôn nhân, xuất thân, đối tượng chính sách, chức vụ Đảng, Đoàn, LLVT',
      catalogs: [
        { id: 'dan_toc', name: 'Danh mục Dân tộc', count: danToc.length, items: danToc },
        { id: 'ton_giao', name: 'Danh mục Tôn giáo', count: tonGiao.length, items: tonGiao },
        { id: 'hon_nhan', name: 'Danh mục Tình trạng hôn nhân', count: honNhan.length, items: honNhan },
        { id: 'xuat_than', name: 'Danh mục Thành phần xuất thân', count: thanhPhanXuatThan.length, items: thanhPhanXuatThan },
        { id: 'chinh_sach', name: 'Danh mục Đối tượng chính sách Nhà nước', count: doiTuongChinhSach.length, items: doiTuongChinhSach },
        { id: 'chuc_vu_dang', name: 'Danh mục Chức vụ Đảng', count: chucVuDang.length, items: chucVuDang },
        { id: 'chuc_vu_doan', name: 'Danh mục Chức vụ Đoàn Thanh niên', count: chucVuDoan.length, items: chucVuDoan },
        { id: 'quan_ham', name: 'Danh mục Quân hàm', count: quanHam.length, items: quanHam },
        { id: 'chuc_vu_llvt', name: 'Chức vụ trong Lực lượng vũ trang', count: chucVuLlvf.length, items: chucVuLlvf },
        { id: 'danh_hieu_phong', name: 'Danh hiệu Nhà nước được phong', count: danhHieuPhong.length, items: danhHieuPhong },
      ]
    },
    {
      id: 'training_education',
      title: 'Đào tạo & Trình độ chuyên môn',
      description: 'Trình độ văn hóa, chuyên môn, ngành/trường đào tạo, lý luận chính trị, QLNN, tin học, ngoại ngữ',
      catalogs: [
        { id: 'trinh_do_chuyen_mon', name: 'Danh mục Trình độ chuyên môn', count: trinhDoChuyenMon.length, items: trinhDoChuyenMon },
        { id: 'nganh_dao_tao', name: 'Danh mục Ngành đào tạo (515 ngành)', count: nganhDaoTao.length, items: nganhDaoTao },
        { id: 'truong_dao_tao', name: 'Danh mục Trường đào tạo', count: truongDaoTao.length, items: truongDaoTao },
        { id: 'hinh_thuc_dao_tao', name: 'Danh mục Hình thức đào tạo', count: hinhThucDaoTao.length, items: hinhThucDaoTao },
        { id: 'trinh_do_llct', name: 'Trình độ Lý luận chính trị', count: trinhDoLlct.length, items: trinhDoLlct },
        { id: 'trinh_do_qlnn', name: 'Trình độ Quản lý nhà nước', count: trinhDoQlnn.length, items: trinhDoQlnn },
        { id: 'trinh_do_qlkt', name: 'Trình độ Quản lý kinh tế', count: trinhDoQlkt.length, items: trinhDoQlkt },
        { id: 'trinh_do_tin_hoc', name: 'Danh mục Trình độ tin học', count: trinhDoTinHoc.length, items: trinhDoTinHoc },
        { id: 'ngoai_ngu', name: 'Danh mục Ngoại ngữ', count: ngoaiNgu.length, items: ngoaiNgu },
        { id: 'trinh_do_ngoai_ngu', name: 'Danh mục Trình độ ngoại ngữ', count: trinhDoNgoaiNgu.length, items: trinhDoNgoaiNgu },
        { id: 'hoc_van_pho_thong', name: 'Trình độ Học vấn phổ thông', count: trinhDoHvpt.length, items: trinhDoHvpt },
      ]
    },
    {
      id: 'ranks_positions',
      title: 'Ngạch bậc & Cơ cấu vị trí',
      description: '184 Ngạch công chức kèm bậc hệ số lương NĐ 204, 28 Nhóm ngạch, chức vụ chính quyền, công việc',
      catalogs: [
        { id: 'ngach_cong_chuc', name: 'Ngạch công chức & Bậc hệ số lương (184 ngạch)', count: ngachCongChuc.length, items: ngachCongChuc },
        { id: 'nhom_ngach', name: 'Nhóm ngạch công chức (28 nhóm)', count: nhomNgach.length, items: nhomNgach },
        { id: 'chuc_vu_chinh_quyen', name: 'Chức danh, Chức vụ quản lý', count: chucVuChinhQuyen.length, items: chucVuChinhQuyen },
        { id: 'cong_viec_chuyen_mon', name: 'Công việc chuyên môn đảm nhiệm', count: congViecChuyenMon.length, items: congViecChuyenMon },
        { id: 'linh_vuc_cong_tac', name: 'Danh mục Lĩnh vực công tác', count: linhVucCongTac.length, items: linhVucCongTac },
        { id: 'nganh_nghe_truoc_td', name: 'Ngành nghề trước tuyển dụng', count: nganhNgheTruocTd.length, items: nganhNgheTruocTd },
        { id: 'don_vi_quan_ly', name: 'Đơn vị quản lý hành chính', count: donViQuanLy.length, items: donViQuanLy },
      ]
    },
    {
      id: 'rewards_health_other',
      title: 'Khen thưởng, Sức khỏe & Khác',
      description: 'Hình thức khen thưởng, kỷ luật, tình trạng sức khỏe, hạng thương binh, các quốc gia',
      catalogs: [
        { id: 'khen_thuong_ky_luat', name: 'Hình thức Khen thưởng - Kỷ luật', count: khenThuongKyLuat.length, items: khenThuongKyLuat },
        { id: 'tinh_trang_suc_khoe', name: 'Tình trạng sức khỏe', count: tinhTrangSucKhoe.length, items: tinhTrangSucKhoe },
        { id: 'hang_thuong_binh', name: 'Danh mục Hạng thương binh', count: hangThuongBinh.length, items: hangThuongBinh },
        { id: 'cac_nuoc', name: 'Danh mục Các quốc gia trên thế giới', count: cacNuoc.length, items: cacNuoc },
      ]
    }
  ]
};

// Đảm bảo thư mục frontend/src/data tồn tại
const outDir = path.resolve('frontend/src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outFile = path.join(outDir, 'master-catalogs.json');
fs.writeFileSync(outFile, JSON.stringify(MASTER_CATALOGS, null, 2), 'utf-8');

console.log('✅ Đã trích xuất và chuẩn hóa thành công 32 danh mục!');
console.log(`📁 Tệp đầu ra: ${outFile}`);
console.log(`📊 Tổng số bản ghi danh mục: ${MASTER_CATALOGS.meta.totalRecords}`);
console.log(`- Dân tộc: ${danToc.length}`);
console.log(`- Ngạch công chức: ${ngachCongChuc.length}`);
console.log(`- Nhóm ngạch: ${nhomNgach.length}`);
console.log(`- Ngành đào tạo: ${nganhDaoTao.length}`);
console.log(`- Tôn giáo: ${tonGiao.length}`);
