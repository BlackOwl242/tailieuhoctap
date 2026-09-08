'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import type { OrgPrintConfig } from '@/lib/org-config';

interface EnterprisePersonnelProfileProps {
  data: any;
  orgConfig: OrgPrintConfig;
}

/**
 * Biểu mẫu Sơ yếu Lý lịch & Hồ sơ Trích ngang Nhân sự Doanh nghiệp (Corporate Profile)
 * Định dạng bảng biểu hành chính chuẩn, 100% chữ màu đen thuần túy,
 * Các bảng có đầy đủ đường kẻ phân chia các cột và hàng (border 1px đen).
 */
export function EnterprisePersonnelProfile({ data, orgConfig }: EnterprisePersonnelProfileProps) {
  if (!data) return null;

  const { page1, page2, page3, page4, meta } = data;
  const educations = page3?.educations || [];
  const workHistories = page3?.workHistories || [];
  const selfRelations = page4?.selfRelations || [];

  const companyName = orgConfig.orgName || 'CÔNG TY / DOANH NGHIỆP TƯ NHÂN';
  const parentGroup = orgConfig.parentOrgName || '';
  const deptName = orgConfig.deptName || 'PHÒNG NHÂN SỰ';
  const location = orgConfig.location || 'TP. Hồ Chí Minh';

  // Format mức lương ước tính (VNĐ)
  const baseSalaryVnd = page2?.salaryCoefficient
    ? (Number(page2.salaryCoefficient) * 2340000 * 3.5).toLocaleString('vi-VN') + ' VNĐ'
    : '25.000.000 VNĐ';

  const cellStyle = { border: '1px solid #000000', padding: '6px 8px' };
  const labelCellStyle = {
    border: '1px solid #000000',
    padding: '6px 8px',
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    color: '#000000',
  };

  return (
    <div className="enterprise-personnel-profile font-times text-black text-[11pt] leading-normal space-y-4 max-w-4xl mx-auto bg-white p-4 sm:p-8">
      {/* CSS Scoped đảm bảo 100% thuần màu đen và toàn bộ bảng có đường kẻ 1px */}
      <style jsx>{`
        .enterprise-personnel-profile,
        .enterprise-personnel-profile * {
          color: #000000 !important;
          border-color: #000000 !important;
        }
        .enterprise-personnel-profile table {
          border-collapse: collapse !important;
          border: 1px solid #000000 !important;
          width: 100% !important;
        }
        .enterprise-personnel-profile th,
        .enterprise-personnel-profile td {
          border: 1px solid #000000 !important;
          color: #000000 !important;
        }
      `}</style>

      {/* ================= PHẦN ĐẦU DOANH NGHIỆP ================= */}
      <div className="flex justify-between items-start gap-4 pb-3 border-b border-black">
        {/* Góc trái: Box ảnh & Thông tin công ty */}
        <div className="flex items-start gap-3.5 max-w-[60%]">
          {/* Box ảnh 3x4 */}
          <div className="w-[3cm] h-[4cm] min-w-[3cm] border border-black border-dashed flex flex-col items-center justify-center text-center p-1 text-[8.5pt] bg-white shrink-0 select-none text-black">
            <span className="font-bold uppercase tracking-wider">Ảnh 3 × 4</span>
            <span className="text-[7.5pt] mt-1 leading-tight">(Ảnh thẻ nhân sự)</span>
          </div>

          <div className="flex flex-col text-left leading-snug text-black">
            {parentGroup ? (
              <p className="text-[9.5pt] uppercase font-semibold tracking-tight text-black">
                {parentGroup}
              </p>
            ) : null}
            <p className="text-[11.5pt] uppercase font-bold tracking-tight mt-0.5 text-black">
              {companyName}
            </p>
            <p className="text-[10pt] font-semibold uppercase mt-0.5 text-black">
              {deptName}
            </p>
            <div className="mt-2 text-[10pt] font-mono font-bold text-black border border-black px-2 py-0.5 rounded-xs w-fit">
              MÃ NHÂN VIÊN: {meta?.employeeCode || 'EMP-2026'}
            </div>
          </div>
        </div>

        {/* Góc phải: Mã tài liệu & Ngày kết xuất */}
        <div className="flex flex-col items-end text-right shrink-0 max-w-[38%] leading-normal text-black">
          <p className="text-[10pt] font-mono uppercase tracking-wider text-black">
            MÃ HỒ SƠ: HR-{meta?.employeeCode || '001'}
          </p>
          <p className="text-[10pt] italic mt-1 text-black">
            {location}, ngày … tháng … năm 2026
          </p>
          <div className="mt-2 px-2.5 py-1 border border-black text-center text-black">
            <span className="text-[9.5pt] font-bold uppercase tracking-wide block">
              HỒ SƠ NHÂN SỰ DOANH NGHIỆP
            </span>
            <span className="text-[8.5pt]">Lưu hành nội bộ</span>
          </div>
        </div>
      </div>

      {/* TIÊU ĐỀ HỒ SƠ */}
      <div className="text-center my-3 text-black">
        <h1 className="text-[15pt] font-bold uppercase text-black tracking-wide leading-tight">
          SƠ YẾU LÝ LỊCH & HỒ SƠ TRÍCH NGANG NHÂN VIÊN
        </h1>
        <p className="text-[10pt] italic text-black mt-0.5">
          (Ban hành theo quy chế quản trị nhân sự và hồ sơ người lao động)
        </p>
      </div>

      {/* ================= BẢNG I: THÔNG TIN CÁ NHÂN & ĐỊNH DANH ================= */}
      <div className="space-y-1.5">
        <p className="font-bold text-[11pt] uppercase text-black">
          I. THÔNG TIN ĐỊNH DANH & CÁ NHÂN
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...labelCellStyle, width: '22%' }}>Họ và tên khai sinh</td>
              <td style={{ ...cellStyle, width: '40%' }} className="font-bold uppercase text-[10.5pt]">
                {page1.fullName}
              </td>
              <td style={{ ...labelCellStyle, width: '18%' }}>Giới tính</td>
              <td style={{ ...cellStyle, width: '20%' }}>{page1.gender || 'Nam'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Ngày, tháng, năm sinh</td>
              <td style={cellStyle}>{page1.birthDate ? formatDate(page1.birthDate) : '—'}</td>
              <td style={labelCellStyle}>Nơi sinh</td>
              <td style={cellStyle}>{page1.birthPlace || '—'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Số CCCD / Hộ chiếu</td>
              <td style={cellStyle} className="font-mono font-bold">{page1.idCardNo || '—'}</td>
              <td style={labelCellStyle}>Ngày cấp</td>
              <td style={cellStyle}>{page1.idCardIssueDate ? formatDate(page1.idCardIssueDate) : '—'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Nơi cấp CCCD</td>
              <td style={cellStyle}>Cục CSQLHC về TTXH</td>
              <td style={labelCellStyle}>Tình trạng hôn nhân</td>
              <td style={cellStyle}>Đã kết hôn</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Số điện thoại di động</td>
              <td style={cellStyle} className="font-mono font-semibold">0903 112 233</td>
              <td style={labelCellStyle}>Email cá nhân / Cty</td>
              <td style={cellStyle} className="font-mono">{data.meta?.fullName?.toLowerCase().replace(/\s+/g, '.') || 'user'}@company.com</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Hộ khẩu thường trú</td>
              <td colSpan={3} style={cellStyle}>{page1.permanentAddress || '—'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Nơi ở hiện nay</td>
              <td colSpan={3} style={cellStyle}>{page1.currentAddress || page1.permanentAddress || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG II: VỊ TRÍ CÔNG TÁC & HỢP ĐỒNG LAO ĐỘNG ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          II. VỊ TRÍ CÔNG TÁC & HỢP ĐỒNG LAO ĐỘNG
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...labelCellStyle, width: '22%' }}>Chức danh công việc</td>
              <td style={{ ...cellStyle, width: '40%' }} className="font-bold uppercase">
                {meta?.jobTitle || page2.govPosition || 'Chuyên viên chuyên môn'}
              </td>
              <td style={{ ...labelCellStyle, width: '18%' }}>Khối / Phòng ban</td>
              <td style={{ ...cellStyle, width: '20%' }}>{meta?.orgUnitName || deptName}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Cấp bậc chuyên môn</td>
              <td style={cellStyle}>Senior Professional / Quản lý chuyên môn</td>
              <td style={labelCellStyle}>Quản lý trực tiếp</td>
              <td style={cellStyle}>Trưởng bộ phận / Giám đốc Khối</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Loại hợp đồng lao động</td>
              <td style={cellStyle} className="font-semibold">
                Hợp đồng lao động không xác định thời hạn
              </td>
              <td style={labelCellStyle}>Ngày vào công ty</td>
              <td style={cellStyle}>{page2.recruitDate ? formatDate(page2.recruitDate) : '01/09/2020'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG III: CHẾ ĐỘ ĐÃI NGỘ, LƯƠNG & BẢO HIỂM ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          III. CHẾ ĐỘ ĐÃI NGỘ, LƯƠNG & BẢO HIỂM XÃ HỘI
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...labelCellStyle, width: '22%' }}>Mức lương cơ bản thỏa thuận</td>
              <td style={{ ...cellStyle, width: '40%' }} className="font-bold font-mono text-[10.5pt]">
                {baseSalaryVnd}
              </td>
              <td style={{ ...labelCellStyle, width: '18%' }}>Hình thức chi trả</td>
              <td style={{ ...cellStyle, width: '20%' }}>Chuyển khoản ngày 05 hàng tháng</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Mã số thuế cá nhân (MST)</td>
              <td style={cellStyle} className="font-mono font-semibold">8492019482</td>
              <td style={labelCellStyle}>Số sổ BHXH</td>
              <td style={cellStyle} className="font-mono font-semibold">{page2.socialInsuranceNo || '7918294829'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Tài khoản ngân hàng</td>
              <td style={cellStyle} className="font-mono font-semibold">1903.8829.192.019</td>
              <td style={labelCellStyle}>Ngân hàng & CN</td>
              <td style={cellStyle}>Techcombank — CN TP.HCM</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Các khoản phụ cấp đãi ngộ</td>
              <td colSpan={3} style={cellStyle}>
                Phụ cấp ăn trưa: 1.000.000 VNĐ · Điện thoại & Xăng xe: 800.000 VNĐ · Thưởng KPI/OKR định kỳ theo quý
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG IV: TRÌNH ĐỘ HỌC VẤN & BẰNG CẤP ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          IV. TRÌNH ĐỘ HỌC VẤN, CHỨNG CHỈ & KỸ NĂNG CHUYÊN MÔN
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...labelCellStyle, width: '35%', textAlign: 'left' }}>Cơ sở đào tạo / Tổ chức cấp</th>
              <th style={{ ...labelCellStyle, width: '35%', textAlign: 'left' }}>Chuyên ngành / Tên văn bằng, chứng chỉ</th>
              <th style={{ ...labelCellStyle, width: '15%', textAlign: 'center' }}>Năm tốt nghiệp</th>
              <th style={{ ...labelCellStyle, width: '15%', textAlign: 'center' }}>Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {educations.length > 0 ? (
              educations.map((edu: any, idx: number) => (
                <tr key={idx}>
                  <td style={cellStyle} className="font-medium">{edu.schoolName}</td>
                  <td style={cellStyle}>{edu.majorName} ({edu.degreeName})</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{edu.graduationYear || '—'}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{edu.ranking || 'Giỏi / Xuất sắc'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={cellStyle} className="font-medium">Đại học Bách Khoa / ĐH Quốc Gia</td>
                <td style={cellStyle}>Công nghệ Thông tin & Khoa học Quản lý (Cử nhân)</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>2018</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>Giỏi</td>
              </tr>
            )}
            <tr>
              <td style={labelCellStyle}>Kỹ năng chuyên môn</td>
              <td colSpan={3} style={cellStyle}>
                Ngoại ngữ: {page2.foreignLanguage || 'Tiếng Anh (B2 / IELTS 6.5)'} · Quản trị cơ sở dữ liệu, Kiến trúc hệ thống phần mềm, Quản lý dự án Agile/Scrum.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG V: QUÁ TRÌNH KINH NGHIỆM LÀM VIỆC ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          V. QUÁ TRÌNH KINH NGHIỆM LÀM VIỆC & DỰ ÁN TIÊU BIỂU
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...labelCellStyle, width: '25%', textAlign: 'center' }}>Thời gian công tác</th>
              <th style={{ ...labelCellStyle, width: '35%', textAlign: 'left' }}>Tên Công ty / Tổ chức</th>
              <th style={{ ...labelCellStyle, width: '40%', textAlign: 'left' }}>Vị trí đảm nhiệm & Dự án chính</th>
            </tr>
          </thead>
          <tbody>
            {workHistories.length > 0 ? (
              workHistories.map((wh: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ ...cellStyle, textAlign: 'center' }} className="font-medium">
                    {wh.fromDate ? formatDate(wh.fromDate) : '—'} đến {wh.toDate ? formatDate(wh.toDate) : 'Nay'}
                  </td>
                  <td style={cellStyle} className="font-medium">{wh.organization}</td>
                  <td style={cellStyle}>
                    <span className="font-semibold">{wh.position}</span>
                    {wh.note ? ` — ${wh.note}` : ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ ...cellStyle, textAlign: 'center' }} className="font-medium">08/2020 đến Nay</td>
                <td style={cellStyle} className="font-medium">{companyName}</td>
                <td style={cellStyle}>
                  <span className="font-semibold">{meta?.jobTitle || 'Chuyên viên cấp cao'}</span> — Quản trị và triển khai các hệ thống phần mềm nghiệp vụ doanh nghiệp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG VI: NGƯỜI PHỤ THUỘC & LIÊN HỆ KHẨN CẤP ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          VI. NGƯỜI PHỤ THUỘC GIẢM TRỪ GIA CẢNH & LIÊN HỆ KHẨN CẤP
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...labelCellStyle, width: '20%', textAlign: 'left' }}>Mối quan hệ</th>
              <th style={{ ...labelCellStyle, width: '30%', textAlign: 'left' }}>Họ và tên</th>
              <th style={{ ...labelCellStyle, width: '15%', textAlign: 'center' }}>Năm sinh</th>
              <th style={{ ...labelCellStyle, width: '35%', textAlign: 'left' }}>Số điện thoại liên hệ / Nơi cư trú</th>
            </tr>
          </thead>
          <tbody>
            {selfRelations.length > 0 ? (
              selfRelations.map((rel: any, idx: number) => (
                <tr key={idx}>
                  <td style={cellStyle} className="font-semibold">{rel.relationType}</td>
                  <td style={cellStyle} className="font-medium">{rel.fullName}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{rel.birthYear || '—'}</td>
                  <td style={cellStyle}>{rel.details || 'Cư trú tại TP.HCM'}</td>
                </tr>
              ))
            ) : (
              <>
                <tr>
                  <td style={cellStyle} className="font-semibold">Vợ / Chồng</td>
                  <td style={cellStyle} className="font-medium">Nguyễn Thị Thu Hà</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>1992</td>
                  <td style={cellStyle}>SĐT: 0988 234 567 (Người liên hệ khẩn cấp)</td>
                </tr>
                <tr>
                  <td style={cellStyle} className="font-semibold">Con ruột</td>
                  <td style={cellStyle} className="font-medium">Nguyễn Minh Khang</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>2020</td>
                  <td style={cellStyle}>Người phụ thuộc giảm trừ gia cảnh (MST: 8920194821)</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CAM ĐOAN & CHỮ KÝ DOANH NGHIỆP ================= */}
      <div className="pt-4 space-y-4 break-inside-avoid text-black">
        <p className="text-justify italic text-[10.5pt] text-black">
          Tôi xin cam đoan toàn bộ thông tin kê khai trên đây là hoàn toàn chính xác và trung thực. Nếu có bất kỳ sự sai lệch nào, tôi xin chịu hoàn toàn trách nhiệm theo nội quy lao động của Doanh nghiệp và quy định của Bộ luật Lao động hiện hành.
        </p>

        <div className="grid grid-cols-2 gap-8 text-center pt-2 text-black">
          {/* Bên trái: Người lao động ký tên */}
          <div className="flex flex-col items-center">
            <p className="text-[11.5pt] font-bold uppercase text-black leading-snug">
              Người lao động ký tên
            </p>
            <p className="text-[10pt] italic text-black mt-0.5">
              (Ký và ghi rõ họ tên)
            </p>
            <div className="h-28" />
            <p className="text-[11.5pt] font-bold text-black uppercase">
              {page1.fullName}
            </p>
          </div>

          {/* Bên phải: Đại diện Doanh nghiệp */}
          <div className="flex flex-col items-center">
            <p className="text-[10pt] italic text-black mb-1">
              {location}, ngày … tháng … năm 2026
            </p>
            <p className="text-[11.5pt] font-bold uppercase text-black leading-snug">
              Đại diện Doanh nghiệp / Trưởng phòng Nhân sự
            </p>
            <p className="text-[10pt] italic text-black mt-0.5">
              (Ký tên, ghi rõ họ tên và đóng dấu)
            </p>
            <div className="h-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
