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
  const printedDate = formatDate(meta?.exportedAt || new Date().toISOString());

  const notProvided = 'Chưa cập nhật';

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
      <style jsx global>{`
        .enterprise-personnel-profile,
        .enterprise-personnel-profile * {
          color: #000000 !important;
          border-color: #000000 !important;
        }
        @media print {
          .enterprise-personnel-profile,
          .enterprise-personnel-profile * {
            font-family: "Times New Roman", Times, "Liberation Serif", serif !important;
          }
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
          vertical-align: top;
          word-break: normal;
          overflow-wrap: anywhere;
        }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          .print-area.enterprise-personnel-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 14mm 15mm !important;
            overflow: visible !important;
          }
          .enterprise-personnel-print-area > div > div,
          .enterprise-personnel-print-area [class*="bg-muted"],
          .enterprise-personnel-print-area [class*="bg-card"] {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            overflow: visible !important;
          }
          .enterprise-personnel-profile {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            font-size: 10pt !important;
            line-height: 1.25 !important;
          }
          .print-area .enterprise-personnel-profile table {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            table-layout: auto !important;
            margin: 2mm 0 4mm !important;
            font-size: 9.5pt !important;
            page-break-inside: auto !important;
          }
          .enterprise-personnel-profile th,
          .enterprise-personnel-profile td {
            padding: 2mm 2.2mm !important;
            line-height: 1.25 !important;
            word-break: normal !important;
            overflow-wrap: anywhere !important;
          }
          .enterprise-personnel-profile tr { page-break-inside: avoid !important; }
          .enterprise-personnel-profile .profile-section-title { page-break-after: avoid !important; }
          .enterprise-personnel-profile .profile-signatures { page-break-inside: avoid !important; }
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
              MÃ NHÂN VIÊN: {meta?.employeeCode || notProvided}
            </div>
          </div>
        </div>

        {/* Góc phải: Mã tài liệu & Ngày kết xuất */}
        <div className="flex flex-col items-end text-right shrink-0 max-w-[38%] leading-normal text-black">
          <p className="text-[10pt] font-mono uppercase tracking-wider text-black">
            MÃ HỒ SƠ: HR-{meta?.employeeCode || notProvided}
          </p>
          <p className="text-[10pt] italic mt-1 text-black">
            {location}, ngày {printedDate}
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
        <p className="profile-section-title font-bold text-[11pt] uppercase text-black">
          I. THÔNG TIN ĐỊNH DANH & CÁ NHÂN
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...labelCellStyle, width: '22%' }}>Họ và tên khai sinh</td>
              <td style={{ ...cellStyle, width: '40%' }} className="font-bold uppercase text-[10.5pt]">
                {page1.fullName ? page1.fullName.replace(/\s*\([^)]*\)/g, '').trim() : ''}
              </td>
              <td style={{ ...labelCellStyle, width: '18%' }}>Giới tính</td>
              <td style={{ ...cellStyle, width: '20%' }}>{page1.gender || 'Nam'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Ngày, tháng, năm sinh</td>
              <td style={cellStyle}>{page1.birthDate ? formatDate(page1.birthDate) : 'Chưa cập nhật'}</td>
              <td style={labelCellStyle}>Nơi sinh</td>
              <td style={cellStyle}>{page1.birthPlace || 'Chưa cập nhật'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Số CCCD / Hộ chiếu</td>
              <td style={cellStyle} className="font-mono font-bold">{page1.idCardNo || 'Chưa cập nhật'}</td>
              <td style={labelCellStyle}>Ngày cấp</td>
              <td style={cellStyle}>{page1.idCardIssueDate ? formatDate(page1.idCardIssueDate) : 'Chưa cập nhật'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Nơi cấp CCCD</td>
              <td style={cellStyle}>{page1.idCardIssuePlace || notProvided}</td>
              <td style={labelCellStyle}>Tình trạng hôn nhân</td>
              <td style={cellStyle}>{page1.maritalStatus || notProvided}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Số điện thoại di động</td>
              <td colSpan={3} style={cellStyle} className="font-mono font-semibold">{meta?.phone || notProvided}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Email cá nhân / Cty</td>
              <td colSpan={3} style={cellStyle} className="font-mono">{meta?.email || notProvided}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Hộ khẩu thường trú</td>
              <td colSpan={3} style={cellStyle}>{page1.permanentAddress || 'Chưa cập nhật'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Nơi ở hiện nay</td>
              <td colSpan={3} style={cellStyle}>{page1.currentAddress || page1.permanentAddress || 'Chưa cập nhật'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG II: VỊ TRÍ CÔNG TÁC & HỢP ĐỒNG LAO ĐỘNG ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="profile-section-title font-bold text-[11pt] uppercase text-black">
          II. VỊ TRÍ CÔNG TÁC & HỢP ĐỒNG LAO ĐỘNG
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...labelCellStyle, width: '22%' }}>Chức danh công việc</td>
              <td colSpan={3} style={{ ...cellStyle, width: '78%' }} className="font-bold uppercase">
                {meta?.jobTitle || page2.govPosition || notProvided}
              </td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Khối / Phòng ban</td>
              <td colSpan={3} style={cellStyle}>{meta?.orgUnitName || deptName}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Cấp bậc chuyên môn</td>
              <td colSpan={3} style={cellStyle}>{page2.professionalGrade || notProvided}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Quản lý trực tiếp</td>
              <td colSpan={3} style={cellStyle}>{meta?.managerName || notProvided}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Loại hợp đồng lao động</td>
              <td colSpan={3} style={cellStyle} className="font-semibold">{page2.contractType || notProvided}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Ngày vào công ty</td>
              <td colSpan={3} style={cellStyle}>{page2.recruitDate ? formatDate(page2.recruitDate) : notProvided}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG III: CHẾ ĐỘ ĐÃI NGỘ, LƯƠNG & BẢO HIỂM ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="profile-section-title font-bold text-[11pt] uppercase text-black">
          III. CHẾ ĐỘ ĐÃI NGỘ, LƯƠNG & BẢO HIỂM XÃ HỘI
        </p>
        <table className="w-full border-collapse text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...labelCellStyle, width: '22%' }}>Mức lương cơ bản thỏa thuận</td>
              <td style={{ ...cellStyle, width: '40%' }} className="font-bold font-mono text-[10.5pt]">
                {page2.contractSalary ? `${Number(page2.contractSalary).toLocaleString('vi-VN')} VNĐ` : notProvided}
              </td>
              <td style={{ ...labelCellStyle, width: '18%' }}>Hình thức chi trả</td>
              <td style={{ ...cellStyle, width: '20%' }}>Chuyển khoản ngày 05 hàng tháng</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Mã số thuế cá nhân (MST)</td>
              <td style={cellStyle} className="font-mono font-semibold">{page2.taxCode || notProvided}</td>
              <td style={labelCellStyle}>Số sổ BHXH</td>
              <td style={cellStyle} className="font-mono font-semibold">{page2.socialInsuranceNo || '7918294829'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Tài khoản ngân hàng</td>
              <td style={cellStyle} className="font-mono font-semibold">{page2.bankAccount || notProvided}</td>
              <td style={labelCellStyle}>Ngân hàng & CN</td>
              <td style={cellStyle}>{page2.bankName || notProvided}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Các khoản phụ cấp đãi ngộ</td>
              <td colSpan={3} style={cellStyle}>
                {page2.allowances || notProvided}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG IV: TRÌNH ĐỘ HỌC VẤN & BẰNG CẤP ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="profile-section-title font-bold text-[11pt] uppercase text-black">
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
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{edu.graduationYear || 'Chưa cập nhật'}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{edu.ranking || 'Giỏi / Xuất sắc'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={cellStyle} colSpan={4} className="font-medium">{notProvided}</td>
              </tr>
            )}
            <tr>
              <td style={labelCellStyle}>Kỹ năng chuyên môn</td>
              <td colSpan={3} style={cellStyle}>
                Ngoại ngữ: {page2.foreignLanguage || notProvided} · Tin học: {page2.informaticsLevel || notProvided}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG V: QUÁ TRÌNH KINH NGHIỆM LÀM VIỆC ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="profile-section-title font-bold text-[11pt] uppercase text-black">
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
                    {wh.fromDate ? formatDate(wh.fromDate) : 'Chưa cập nhật'} đến {wh.toDate ? formatDate(wh.toDate) : 'Nay'}
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
                <td style={cellStyle} colSpan={3} className="font-medium">{notProvided}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG VI: NGƯỜI PHỤ THUỘC & LIÊN HỆ KHẨN CẤP ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="profile-section-title font-bold text-[11pt] uppercase text-black">
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
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{rel.birthYear || 'Chưa cập nhật'}</td>
                  <td style={cellStyle}>{rel.details || notProvided}</td>
                </tr>
              ))
            ) : (
              <>
                <tr><td style={cellStyle} colSpan={4}>{notProvided}</td></tr>
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
              {location}, ngày {printedDate}
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
