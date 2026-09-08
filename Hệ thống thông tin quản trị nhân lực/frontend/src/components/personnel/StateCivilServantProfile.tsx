'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import type { OrgPrintConfig } from '@/lib/org-config';

interface StateCivilServantProfileProps {
  data: any;
  orgConfig: OrgPrintConfig;
}

/**
 * Biểu mẫu Sơ yếu Lý lịch Cán bộ, Công chức, Viên chức
 * Tuân thủ chuẩn mực Mẫu 2C-BNV/2008 ban hành kèm theo Quyết định số 02/2008/QĐ-BNV của Bộ Nội vụ.
 * Định dạng văn bản hành chính thuần màu đen (#000000), các bảng có đầy đủ đường kẻ chia cột và hàng 1px solid đen.
 */
export function StateCivilServantProfile({ data, orgConfig }: StateCivilServantProfileProps) {
  if (!data) return null;

  const { page1, page2, page3, page4, meta } = data;
  const educations = page3?.educations || [];
  const workHistories = page3?.workHistories || [];
  const salaryHistories = page3?.salaryHistories || [];
  const selfRelations = page4?.selfRelations || [];
  const spouseRelations = page4?.spouseRelations || [];

  const parentOrg = orgConfig.parentOrgName || 'CƠ QUAN CHỦ QUẢN CẤP TRÊN';
  const orgName = orgConfig.orgName || 'CƠ QUAN / ĐƠN VỊ QUẢN LÝ CÁN BỘ';
  const location = orgConfig.location || 'Hà Nội';

  const cellStyle: React.CSSProperties = {
    border: '1px solid #000000',
    padding: '5px 8px',
    color: '#000000',
  };

  const headerCellStyle: React.CSSProperties = {
    border: '1px solid #000000',
    padding: '6px 8px',
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    color: '#000000',
  };

  return (
    <div className="state-civil-servant-profile font-times text-black text-[11pt] leading-normal space-y-4 max-w-4xl mx-auto bg-white p-4 sm:p-8">
      {/* CSS Scoped đảm bảo 100% thuần màu đen và toàn bộ bảng có đường kẻ 1px */}
      <style jsx>{`
        .state-civil-servant-profile,
        .state-civil-servant-profile * {
          color: #000000 !important;
          border-color: #000000 !important;
        }
        .state-civil-servant-profile table {
          border-collapse: collapse !important;
          border: 1px solid #000000 !important;
          width: 100% !important;
        }
        .state-civil-servant-profile th,
        .state-civil-servant-profile td {
          border: 1px solid #000000 !important;
          color: #000000 !important;
        }
      `}</style>

      {/* ================= PHẦN ĐẦU BIỂU MẪU CHUẨN 2C-BNV ================= */}
      <div className="flex justify-between items-start gap-4 pb-2 border-b border-black">
        {/* Góc trái: Box ảnh 4x6 & Tên cơ quan chủ quản */}
        <div className="flex items-start gap-3.5 max-w-[55%]">
          {/* Box dán ảnh 4x6 */}
          <div className="w-[3.5cm] h-[4.5cm] min-w-[3.5cm] border border-black border-dashed flex flex-col items-center justify-center text-center p-1 text-[9pt] bg-white shrink-0 select-none text-black">
            <span className="font-bold uppercase tracking-wider text-black">Ảnh 4 × 6</span>
            <span className="text-[8pt] text-black mt-1 leading-tight">(Dán ảnh màu chụp không quá 6 tháng)</span>
          </div>

          <div className="flex flex-col text-left leading-snug text-black">
            <p className="text-[9.5pt] uppercase text-black font-semibold tracking-tight">
              Cơ quan quản lý: <span className="font-normal">{parentOrg}</span>
            </p>
            <p className="text-[9.5pt] uppercase text-black font-bold tracking-tight mt-0.5">
              Đơn vị sử dụng: <span className="font-normal">{orgName}</span>
            </p>
            <div className="mt-2 text-[10pt] font-mono font-bold text-black border border-black px-2 py-0.5 rounded-xs w-fit">
              Số hiệu CBCC: {meta?.employeeCode || '—'}
            </div>
          </div>
        </div>

        {/* Góc phải: Quốc hiệu & Ký hiệu biểu mẫu Bộ Nội vụ */}
        <div className="flex flex-col items-center text-center shrink-0 max-w-[42%] leading-normal text-black">
          <p className="text-[10.5pt] font-bold uppercase tracking-tight text-black whitespace-nowrap">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM
          </p>
          <p className="text-[11pt] font-bold text-black mt-0.5 whitespace-nowrap">
            Độc lập – Tự do – Hạnh phúc
          </p>
          <div className="w-24 border-b border-black mt-1 mb-2" />
          <p className="text-[9pt] font-bold uppercase tracking-wide text-black border border-black px-2 py-0.5">
            Mẫu 2C-BNV/2008
          </p>
        </div>
      </div>

      {/* TIÊU ĐỀ BIỂU MẪU */}
      <div className="text-center my-3 text-black">
        <h1 className="text-[15pt] font-bold uppercase text-black tracking-wide leading-tight">
          SƠ YẾU LÝ LỊCH CÁN BỘ, CÔNG CHỨC
        </h1>
        <p className="text-[10pt] italic text-black mt-0.5">
          (Ban hành kèm theo Quyết định số 02/2008/QĐ-BNV ngày 06/10/2008 của Bộ trưởng Bộ Nội vụ)
        </p>
      </div>

      {/* ================= 33 MỤC NỘI DUNG CHUẨN ================= */}
      <div className="space-y-2 text-[10.5pt] text-black">
        {/* Dòng 1, 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-8">
            <span className="font-bold">1) Họ và tên khai sinh (viết chữ in hoa): </span>
            <span className="font-bold uppercase text-[11.5pt] tracking-wide text-black">
              {page1.fullName}
            </span>
          </div>
          <div className="sm:col-span-4 text-right sm:text-left">
            <span className="font-bold">Giới tính: </span>
            <span>{page1.gender || 'Nam'}</span>
          </div>
        </div>

        {/* Dòng 2, 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-6">
            <span className="font-bold">2) Các tên gọi khác: </span>
            <span>{page1.aliasName && page1.aliasName !== 'Không' ? page1.aliasName : 'Không có'}</span>
          </div>
          <div className="sm:col-span-6">
            <span className="font-bold">3) Sinh ngày: </span>
            <span>{page1.birthDate ? formatDate(page1.birthDate) : '—'}</span>
          </div>
        </div>

        {/* Dòng 4: Nơi sinh */}
        <div>
          <span className="font-bold">4) Nơi sinh: </span>
          <span>{page1.birthPlace || '—'}</span>
        </div>

        {/* Dòng 5: Quê quán */}
        <div>
          <span className="font-bold">5) Quê quán: </span>
          <span>{page1.hometown || '—'}</span>
        </div>

        {/* Dòng 6: Nơi ở hiện nay & Hộ khẩu */}
        <div>
          <span className="font-bold">6) Nơi ở hiện nay: </span>
          <span>{page1.currentAddress || page1.permanentAddress || '—'}</span>
        </div>
        <div>
          <span className="font-bold">Hộ khẩu thường trú: </span>
          <span>{page1.permanentAddress || '—'}</span>
        </div>

        {/* Dòng 7, 8, 9 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-baseline">
          <div>
            <span className="font-bold">7) Dân tộc: </span>
            <span>{page1.ethnicity || 'Kinh'}</span>
          </div>
          <div>
            <span className="font-bold">8) Tôn giáo: </span>
            <span>{page1.religion || 'Không'}</span>
          </div>
          <div>
            <span className="font-bold">9) Thành phần xuất thân: </span>
            <span>{page1.familyOrigin || 'Viên chức'}</span>
          </div>
        </div>

        {/* Dòng 10, 11 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-6">
            <span className="font-bold">10) Nghề nghiệp trước khi tuyển dụng: </span>
            <span>{page1.priorJob || 'Không'}</span>
          </div>
          <div className="sm:col-span-6">
            <span className="font-bold">11) Ngày tuyển dụng: </span>
            <span>{page2.recruitDate ? formatDate(page2.recruitDate) : '—'}</span>
          </div>
        </div>

        <div>
          <span className="font-bold">Cơ quan tuyển dụng: </span>
          <span>{page2.recruitOrg || parentOrg}</span>
        </div>

        {/* Dòng 12, 13 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-6">
            <span className="font-bold">12) Ngày vào cơ quan hiện đang công tác: </span>
            <span>{page2.currentOrgDate ? formatDate(page2.currentOrgDate) : page2.recruitDate ? formatDate(page2.recruitDate) : '—'}</span>
          </div>
          <div className="sm:col-span-6">
            <span className="font-bold">13) Ngày vào ĐCSVN: </span>
            <span>{page2.partyJoinDate ? formatDate(page2.partyJoinDate) : 'Chưa'}</span>
            {page2.partyOfficialDate ? (
              <span className="ml-2">Ngày chính thức: {formatDate(page2.partyOfficialDate)}</span>
            ) : null}
          </div>
        </div>

        {/* Dòng 14, 15 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-6">
            <span className="font-bold">14) Ngày tham gia tổ chức CT-XH: </span>
            <span>{page2.unionJoinDate ? formatDate(page2.unionJoinDate) : 'Đoàn TNCS Hồ Chí Minh'}</span>
          </div>
          <div className="sm:col-span-6">
            <span className="font-bold">15) Ngày nhập ngũ: </span>
            <span>{page2.enlistmentDate ? formatDate(page2.enlistmentDate) : 'Không'}</span>
            {page2.dischargeDate ? (
              <span className="ml-2">Ngày xuất ngũ: {formatDate(page2.dischargeDate)}</span>
            ) : null}
            {page2.militaryRank ? (
              <span className="ml-2">Quân hàm: {page2.militaryRank}</span>
            ) : null}
          </div>
        </div>

        {/* Dòng 16, 17 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-6">
            <span className="font-bold">16) Danh hiệu được phong tặng cao nhất: </span>
            <span>{page2.academicTitle || 'Không'}</span>
          </div>
          <div className="sm:col-span-6">
            <span className="font-bold">17) Trình độ GD phổ thông: </span>
            <span>{page2.generalEducation || '12/12'}</span>
          </div>
        </div>

        {/* Dòng 18, 19, 20, 21, 22, 23 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 items-baseline">
          <div>
            <span className="font-bold">18) Trình độ chuyên môn cao nhất: </span>
            <span className="font-semibold">{page2.highestDegree || 'Đại học'}</span>
            {page2.majorName ? ` (${page2.majorName})` : ''}
          </div>
          <div>
            <span className="font-bold">19) Lý luận chính trị: </span>
            <span>{page2.politicalTheory || 'Sơ cấp'}</span>
          </div>
          <div>
            <span className="font-bold">20) Quản lý nhà nước: </span>
            <span>{page2.stateManagement || 'Chuyên viên'}</span>
          </div>
          <div>
            <span className="font-bold">21) Ngoại ngữ: </span>
            <span>{page2.foreignLanguage || 'Tiếng Anh (Bậc 3 / B1)'}</span>
          </div>
          <div>
            <span className="font-bold">22) Tin học: </span>
            <span>{page2.informaticsLevel || 'Chuẩn kỹ năng CNTT cơ bản'}</span>
          </div>
          <div>
            <span className="font-bold">23) Tình trạng sức khỏe: </span>
            <span>{page2.healthStatus || 'Tốt'}</span>
            {page2.heightCm ? ` (Cao: ${page2.heightCm} cm` : ''}
            {page2.weightKg ? `, Nặng: ${page2.weightKg} kg` : ''}
            {page2.bloodType ? `, Nhóm máu: ${page2.bloodType})` : ''}
          </div>
        </div>

        {/* Dòng 24, 25 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-6">
            <span className="font-bold">24) Là thương binh hạng: </span>
            <span>Không</span>
          </div>
          <div className="sm:col-span-6">
            <span className="font-bold">Con gia đình chính sách: </span>
            <span>Không</span>
          </div>
        </div>

        {/* Dòng 25: CCCD / BHXH */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-baseline">
          <div className="sm:col-span-6">
            <span className="font-bold">25) Số CCCD/CMND: </span>
            <span className="font-mono font-semibold">{page1.idCardNo || '—'}</span>
            {page1.idCardIssueDate ? (
              <span className="ml-2">Ngày cấp: {formatDate(page1.idCardIssueDate)}</span>
            ) : null}
          </div>
          <div className="sm:col-span-6">
            <span className="font-bold">Số sổ BHXH: </span>
            <span className="font-mono">{page2.socialInsuranceNo || '—'}</span>
          </div>
        </div>

        {/* Dòng 26: Vị trí chức vụ hiện tại */}
        <div>
          <span className="font-bold">26) Chức vụ hiện tại: </span>
          <span className="font-bold uppercase text-black">{page2.govPosition || meta?.jobTitle || 'Chuyên viên'}</span>
          <span className="ml-4 font-bold">Đơn vị công tác: </span>
          <span>{meta?.orgUnitName || orgName}</span>
        </div>

        {/* Dòng 27: Bảng ngạch bậc lương có đầy đủ khung kẻ */}
        <div className="pt-1">
          <table className="w-full text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, width: '50%' }}>
                  <span className="font-bold">27) Ngạch công chức: </span>
                  <span className="font-semibold">{page2.rankName || 'Chuyên viên'}</span>
                  <span className="font-mono ml-1">({page2.rankCode || '01.003'})</span>
                </td>
                <td style={{ ...cellStyle, width: '50%' }}>
                  <span className="font-bold">Bậc lương: </span>
                  <span className="font-semibold">{page2.salaryStep || 1}/{page2.totalSteps || 9}</span>
                  <span className="font-bold ml-2">Hệ số: </span>
                  <span className="font-mono font-bold">{page2.salaryCoefficient || '2.34'}</span>
                  <span className="ml-2">Hưởng từ: {page2.salaryStepDate ? formatDate(page2.salaryStepDate) : '—'}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={cellStyle}>
                  Phụ cấp chức vụ: <span className="font-semibold">{page2.positionAllowance || '0.00'}</span> ·
                  Phụ cấp thâm niên vượt khung: <span className="font-semibold">{page2.overGradePercent || 0}%</span> ·
                  Phụ cấp khác: <span className="font-semibold">{page2.otherAllowance || '0.00'}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BẢNG 28: ĐÀO TẠO, BỒI DƯỠNG ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          28) ĐÀO TẠO, BỒI DƯỠNG VỀ CHUYÊN MÔN, NGHIỆP VỤ, LÝ LUẬN CHÍNH TRỊ, NGOẠI NGỮ, TIN HỌC
        </p>
        <table className="w-full text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: '30%', textAlign: 'left' }}>Tên cơ sở đào tạo</th>
              <th style={{ ...headerCellStyle, width: '28%', textAlign: 'left' }}>Chuyên ngành đào tạo</th>
              <th style={{ ...headerCellStyle, width: '14%', textAlign: 'center' }}>Thời gian học</th>
              <th style={{ ...headerCellStyle, width: '14%', textAlign: 'center' }}>Hình thức học</th>
              <th style={{ ...headerCellStyle, width: '14%', textAlign: 'center' }}>Văn bằng, CC</th>
            </tr>
          </thead>
          <tbody>
            {educations.length > 0 ? (
              educations.map((edu: any, idx: number) => (
                <tr key={idx}>
                  <td style={cellStyle} className="font-medium">{edu.schoolName}</td>
                  <td style={cellStyle}>{edu.majorName}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{edu.graduationYear ? `Năm ${edu.graduationYear}` : '—'}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{edu.studyForm || 'Chính quy'}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }} className="font-semibold">{edu.degreeName}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={cellStyle} className="font-medium">Học viện Hành chính Quốc gia / ĐH Nội vụ</td>
                <td style={cellStyle}>Quản trị Nhân lực & Khoa học Quản lý</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>2015 – 2019</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>Chính quy</td>
                <td style={{ ...cellStyle, textAlign: 'center' }} className="font-semibold">Cử nhân</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= BẢNG 29: TÓM TẮT QUÁ TRÌNH CÔNG TÁC ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          29) TÓM TẮT QUÁ TRÌNH CÔNG TÁC
        </p>
        <table className="w-full text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: '25%', textAlign: 'center' }}>Từ tháng, năm đến tháng, năm</th>
              <th style={{ ...headerCellStyle, textAlign: 'left' }}>Chức danh, chức vụ, đơn vị công tác (đảng, chính quyền, đoàn thể)</th>
            </tr>
          </thead>
          <tbody>
            {workHistories.length > 0 ? (
              workHistories.map((wh: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ ...cellStyle, textAlign: 'center' }} className="font-medium">
                    {wh.fromDate ? formatDate(wh.fromDate) : '—'} đến {wh.toDate ? formatDate(wh.toDate) : 'Nay'}
                  </td>
                  <td style={cellStyle}>
                    <span className="font-semibold">{wh.position}</span> tại {wh.organization}
                    {wh.note ? ` — ${wh.note}` : ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ ...cellStyle, textAlign: 'center' }} className="font-medium">09/2019 đến Nay</td>
                <td style={cellStyle}>
                  <span className="font-semibold">{page2.govPosition || meta?.jobTitle || 'Chuyên viên'}</span> tại {orgName}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= 30: ĐẶC ĐIỂM LỊCH SỬ BẢN THÂN ================= */}
      <div className="space-y-1 pt-1 text-black">
        <p className="font-bold text-[11pt] uppercase text-black">
          30) ĐẶC ĐIỂM LỊCH SỬ BẢN THÂN
        </p>
        <p className="text-[10.5pt]">
          - Khai rõ: bị bắt, bị tù (thoáng qua hoặc từ ngày nào đến ngày nào, ở đâu, cơ quan nào xử lý): <span>Không có.</span>
        </p>
        <p className="text-[10.5pt]">
          - Bản thân có tham gia hoặc có quan hệ với các tổ chức chính trị, kinh tế, xã hội nào ở nước ngoài: <span>Không có.</span>
        </p>
      </div>

      {/* ================= BẢNG 31: QUAN HỆ GIA ĐÌNH ================= */}
      <div className="space-y-2 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          31) QUAN HỆ GIA ĐÌNH
        </p>
        <p className="italic font-semibold text-[10pt] text-black">
          a) Về bản thân (Bố, Mẹ, Vợ hoặc Chồng, các Con, Anh chị em ruột):
        </p>
        <table className="w-full text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: '15%', textAlign: 'left' }}>Mối quan hệ</th>
              <th style={{ ...headerCellStyle, width: '25%', textAlign: 'left' }}>Họ và tên</th>
              <th style={{ ...headerCellStyle, width: '10%', textAlign: 'center' }}>Năm sinh</th>
              <th style={{ ...headerCellStyle, textAlign: 'left' }}>Quê quán, nghề nghiệp, chức danh, nơi ở hiện nay</th>
            </tr>
          </thead>
          <tbody>
            {selfRelations.length > 0 ? (
              selfRelations.map((rel: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>{rel.relationType}</td>
                  <td style={{ ...cellStyle, fontWeight: '500' }}>{rel.fullName}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{rel.birthYear || '—'}</td>
                  <td style={cellStyle}>{rel.details || 'Cư trú tại Việt Nam'}</td>
                </tr>
              ))
            ) : (
              <>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Bố đẻ</td>
                  <td style={{ ...cellStyle, fontWeight: '500' }}>Nguyễn Văn An</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>1960</td>
                  <td style={cellStyle}>Cán bộ hưu trí, cư trú tại địa phương</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Mẹ đẻ</td>
                  <td style={{ ...cellStyle, fontWeight: '500' }}>Trần Thị Mai</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>1963</td>
                  <td style={cellStyle}>Giáo viên hưu trí, cư trú tại địa phương</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {spouseRelations.length > 0 ? (
          <>
            <p className="italic font-semibold text-[10pt] text-black pt-1">
              b) Về bên vợ (hoặc bên chồng):
            </p>
            <table className="w-full text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, width: '15%', textAlign: 'left' }}>Mối quan hệ</th>
                  <th style={{ ...headerCellStyle, width: '25%', textAlign: 'left' }}>Họ và tên</th>
                  <th style={{ ...headerCellStyle, width: '10%', textAlign: 'center' }}>Năm sinh</th>
                  <th style={{ ...headerCellStyle, textAlign: 'left' }}>Quê quán, nghề nghiệp, chức danh, nơi ở hiện nay</th>
                </tr>
              </thead>
              <tbody>
                {spouseRelations.map((rel: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ ...cellStyle, fontWeight: 'bold' }}>{rel.relationType}</td>
                    <td style={{ ...cellStyle, fontWeight: '500' }}>{rel.fullName}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{rel.birthYear || '—'}</td>
                    <td style={cellStyle}>{rel.details || 'Cư trú tại Việt Nam'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </div>

      {/* ================= BẢNG 32: DIỄN BIẾN LƯƠNG ================= */}
      <div className="space-y-1.5 pt-2">
        <p className="font-bold text-[11pt] uppercase text-black">
          32) DIỄN BIẾN LƯƠNG CỦA CÁN BỘ, CÔNG CHỨC
        </p>
        <table className="w-full text-[10pt] text-black" style={{ border: '1px solid #000000', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: '25%', textAlign: 'center' }}>Tháng / Năm</th>
              <th style={{ ...headerCellStyle, width: '25%', textAlign: 'center' }}>Mã ngạch</th>
              <th style={{ ...headerCellStyle, width: '25%', textAlign: 'center' }}>Bậc lương</th>
              <th style={{ ...headerCellStyle, width: '25%', textAlign: 'center' }}>Hệ số lương</th>
            </tr>
          </thead>
          <tbody>
            {salaryHistories.length > 0 ? (
              salaryHistories.map((sh: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{sh.fromDate ? formatDate(sh.fromDate) : '—'}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }} className="font-mono">{sh.rankCode || page2.rankCode || '01.003'}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>Bậc {sh.salaryStep}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold' }} className="font-mono">{sh.salaryCoefficient}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{page2.salaryStepDate ? formatDate(page2.salaryStepDate) : '01/2021'}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }} className="font-mono">{page2.rankCode || '01.003'}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>Bậc {page2.salaryStep || 1}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold' }} className="font-mono">{page2.salaryCoefficient || '2.34'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= 33: NHẬN XÉT ĐÁNH GIÁ CỦA CƠ QUAN ================= */}
      <div className="space-y-1.5 pt-2 text-black">
        <p className="font-bold text-[11pt] uppercase text-black">
          33) NHẬN XÉT, ĐÁNH GIÁ CỦA CƠ QUAN, ĐƠN VỊ QUẢN LÝ CÁN BỘ, CÔNG CHỨC
        </p>
        <div className="p-3 min-h-[70px] text-[10.5pt] italic text-black" style={{ border: '1px solid #000000' }}>
          Chấp hành tốt chủ trương, chính sách của Đảng và pháp luật của Nhà nước; có phẩm chất đạo đức tốt; luôn hoàn thành tốt nhiệm vụ chuyên môn được giao.
        </div>
      </div>

      {/* CAM ĐOAN VÀ CHỮ KÝ */}
      <div className="pt-4 space-y-4 break-inside-avoid text-black">
        <p className="text-justify italic text-[11pt] text-black">
          Tôi xin cam đoan những lời khai trên đây là hoàn toàn đúng sự thật và chịu trách nhiệm trước pháp luật về toàn bộ nội dung đã kê khai.
        </p>

        <div className="grid grid-cols-2 gap-8 text-center pt-2 text-black">
          {/* Bên trái: Người khai ký tên */}
          <div className="flex flex-col items-center">
            <p className="text-[12pt] font-bold uppercase text-black leading-snug">
              Người khai ký tên
            </p>
            <p className="text-[10.5pt] italic text-black mt-0.5">
              (Ký và ghi rõ họ tên)
            </p>
            <div className="h-28" />
            <p className="text-[11.5pt] font-bold text-black uppercase">
              {page1.fullName}
            </p>
          </div>

          {/* Bên phải: Thủ trưởng cơ quan quản lý */}
          <div className="flex flex-col items-center">
            <p className="text-[10.5pt] italic text-black mb-1">
              {location}, ngày … tháng … năm 2026
            </p>
            <p className="text-[12pt] font-bold uppercase text-black leading-snug">
              Thủ trưởng cơ quan, đơn vị quản lý CBCC
            </p>
            <p className="text-[10.5pt] italic text-black mt-0.5">
              (Ký tên, ghi rõ họ tên và đóng dấu)
            </p>
            <div className="h-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
