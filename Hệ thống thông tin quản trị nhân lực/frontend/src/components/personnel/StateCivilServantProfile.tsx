'use client';

import React, { useState } from 'react';
import {
  Printer, ChevronLeft, ChevronRight, FileText, User,
  ZoomIn
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { OrgPrintConfig } from '@/lib/org-config';
import { SearchableEmployeeSelect } from './SearchableEmployeeSelect';
import { Select } from '@/components/ui/primitives';

interface StateCivilServantProfileProps {
  data: any;
  orgConfig: OrgPrintConfig;
  employees?: any[];
  currentUserId?: string;
  onSelectUser?: (id: string) => void;
  cvMode?: string;
  onSelectCvMode?: (mode: 'state' | 'enterprise') => void;
}

/**
 * MẪU IN SƠ YẾU LÝ LỊCH CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC (HUHA-HRM / BỘ NỘI VỤ)
 * Tự động đồng bộ theo Cấu hình Cơ cấu Tổ chức của Đơn vị & Thông tin Nhân sự
 */
export function StateCivilServantProfile({
  data,
  orgConfig,
  employees = [],
  currentUserId = '',
  onSelectUser,
  cvMode = 'state',
  onSelectCvMode,
}: StateCivilServantProfileProps) {
  // Trạng thái điều hướng trang (0: xem toàn bộ 5 trang liên tục, 1-5: xem từng trang đơn)
  const [currentPage, setCurrentPage] = useState<number>(0); 
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 90, 100, 115, 125

  if (!data) return null;

  const { page1 = {}, page2 = {}, page3 = {}, page4 = {}, meta = {} } = data;

  // Cấu hình Cơ quan / Đơn vị
  const parentOrg = (orgConfig?.parentOrgName || '').trim();
  const rawOrgName = (orgConfig?.orgName || '').trim();
  const orgName = rawOrgName && rawOrgName !== 'CƠ QUAN / ĐƠN VỊ QUẢN LÝ NHÂN LỰC'
    ? rawOrgName
    : 'CÔNG TY CỔ PHẦN SAIGON TECHNOLOGY';
  const directUnit = meta?.orgUnitName || page1?.department || orgConfig?.deptName || '';

  // Thông tin định danh cá nhân
  const rawFullName = (page1.fullName || meta.fullName || '').trim();
  const cleanFullName = rawFullName.replace(/\s*\([^)]*\)/g, '').trim();
  const fullName = cleanFullName.toUpperCase();
  const aliasName = page1.aliasName && page1.aliasName !== 'Không' ? page1.aliasName : '';
  const jobTitle = page2.govPosition || meta.jobTitle || 'Chuyên viên';
  const employeeCode = meta.employeeCode || page1.employeeCode || page1.idCardNo || 'NV0001';
  const profileCode = meta.employeeCode ? `0102.${meta.employeeCode}` : '0102.0000001';

  // Trang 1: Thông tin chung & Công tác & Lương
  const birthDate = page1.birthDate ? formatDate(page1.birthDate) : '';
  const gender = page1.gender || meta.gender || 'Nam';
  const idCardNo = page1.idCardNo || '';
  const idCardIssueDate = page1.idCardIssueDate ? formatDate(page1.idCardIssueDate) : '';
  const idCardIssuePlace = page1.idCardIssuePlace || '';
  const birthPlace = page1.birthPlace || '';
  const hometown = page1.hometown || '';
  const permanentAddress = page1.permanentAddress || '';
  const currentAddress = page1.currentAddress || '';
  const ethnicity = page1.ethnicity || 'Kinh';
  const religion = page1.religion || 'Không';
  const familyOrigin = page1.familyOrigin || 'Lao động';
  const maritalStatus = page1.maritalStatus || 'Đã kết hôn';
  const email = meta.email || page1.email || '';
  const phone = page1.phone || meta.phone || '';
  const workPhone = page1.workPhone || '';
  const homePhone = page1.homePhone || '';

  // Mục II: Công tác
  const hireDate = meta.hireDate ? formatDate(meta.hireDate) : (page1.hireDate ? formatDate(page1.hireDate) : '');
  const recruitDate = page1.recruitDate ? formatDate(page1.recruitDate) : hireDate;
  const recruitOrg = page1.recruitOrg || parentOrg || orgName;
  const recruitType = page1.recruitType || 'Tuyển dụng trực tiếp';
  const contractSignDate = page1.contractSignDate ? formatDate(page1.contractSignDate) : hireDate;
  const recruitJob = page1.recruitJob || 'Chuyên viên kỹ thuật';
  const recruitSource = page1.recruitSource || 'Đại học';
  const recruitPosition = meta.jobTitle || page1.jobTitle || 'Kỹ sư';
  const currentGovDate = page1.currentGovDate ? formatDate(page1.currentGovDate) : hireDate;
  const workField = page1.workField || 'Công nghệ thông tin';
  const mainJob = page1.mainJob || meta.jobTitle || 'Chuyên môn nghiệp vụ';

  // Mục III: Lương & Phụ cấp
  const rankCode = page1.rankCode || meta.salaryRankCode || '01003';
  const rankName = page1.rankName || meta.salaryRankName || 'Chuyên viên';
  const rankAppointDate = page1.rankAppointDate ? formatDate(page1.rankAppointDate) : hireDate;
  const salaryStep = page1.salaryStep || meta.salaryStep || '1';
  const salaryRate = `${page1.salaryRate || 100} %`;
  const salaryEffectiveDate = page1.salaryEffectiveDate ? formatDate(page1.salaryEffectiveDate) : hireDate;

  // Trang 2: Tiếp tục Lương, Đào tạo, Thông tin khác
  const nextSeniorityDate = page2.nextSeniorityDate ? formatDate(page2.nextSeniorityDate) : '';
  const overGradePercent = page2.overGradePercent ? `${page2.overGradePercent} %` : '0 %';
  const equivalentPosition = page2.equivalentPosition || jobTitle;
  const positionAllowance = page2.positionAllowance != null ? String(page2.positionAllowance) : '0.00';
  const positionAppointDate = page2.positionAppointDate ? formatDate(page2.positionAppointDate) : hireDate;
  const responsibilityAllowance = page2.responsibilityAllowance ? String(page2.responsibilityAllowance).replace('.', ',') : '';
  const socialInsuranceNo = page2.socialInsuranceNo || '';
  const socialInsuranceDate = page2.socialInsuranceDate ? formatDate(page2.socialInsuranceDate) : hireDate;

  // Mục IV: Đào tạo
  const generalEducation = page2.generalEducation || '12/12';
  const academicTitle = page2.academicTitle || '';
  const academicDate = page2.academicDate ? formatDate(page2.academicDate) : '';
  const politicalTheory = page2.politicalTheory || 'Sơ cấp';
  const stateManagement = page2.stateManagement || '';
  const economicManagement = page2.economicManagement || '';
  const foreignLanguage = page2.foreignLanguage || 'Tiếng Anh B2';
  const informaticsLevel = page2.informaticsLevel || 'Chuẩn CNTT cơ bản';

  // Mục V: Thông tin khác
  const unionJoinDate = page2.unionJoinDate ? formatDate(page2.unionJoinDate) : '';
  const unionPosition = page2.unionPosition || 'Đoàn viên';
  const partyJoinDate = page2.partyJoinDate ? formatDate(page2.partyJoinDate) : '';
  const partyOfficialDate = page2.partyOfficialDate ? formatDate(page2.partyOfficialDate) : '';
  const partyPosition = page2.partyPosition || '';
  const partyJoinPlace = page2.partyJoinPlace || '';
  const militaryRank = page2.militaryRank || '';
  const militaryPosition = page2.militaryPosition || '';
  const honorTitle = page2.honorTitle || '';
  const honorYear = page2.honorYear || '';
  const policyBeneficiary = page2.policyBeneficiary || 'Không thuộc diện ưu đãi chính sách';
  const healthStatus = page2.healthStatus || 'Loại 1 (Tốt)';
  const heightStr = page2.heightCm ? `${page2.heightCm} cm` : '—';
  const weightStr = page2.weightKg ? `${page2.weightKg} kg` : '—';
  const bloodType = page2.bloodType || 'O';

  // Trang 3 & 4: Khen thưởng, Kỷ luật, Lịch sử & Bảng quá trình
  const strengths = page3.strengths || (page4.strengths || 'Nghiên cứu chuyên môn, quản trị công việc');
  const longestJob = page3.longestJob || mainJob || jobTitle;
  const highestReward = page3.highestReward || (page4.rewardDisciplines?.[0]?.title || 'Chiến sĩ thi đua');
  const rewardDate = page3.rewardDate ? formatDate(page3.rewardDate) : (page4.rewardDisciplines?.[0]?.eventDate ? formatDate(page4.rewardDisciplines[0].eventDate) : '');
  const rewardDecisionNo = page3.rewardDecisionNo || (page4.rewardDisciplines?.[0]?.decisionNo || '');
  const rewardOrg = page3.rewardOrg || (page4.rewardDisciplines?.[0]?.grantAuthority || orgName);
  const rewardSigner = page3.rewardSigner || orgConfig?.signerTitle3 || 'Giám đốc';
  const highestDiscipline = page3.highestDiscipline || (page4.rewardDisciplines?.find((d: any) => d.type === 'DISCIPLINE')?.title || 'Không');

  // Danh sách Quá trình đào tạo
  const rawEducations = data.educations || data.page3?.educations || [];
  const educationsList = rawEducations.length > 0 ? rawEducations.map((e: any) => ({
    degree: e.degree || e.degreeType || 'Đại học',
    major: e.major || e.majorName || '—',
    type: e.type || e.studyMode || 'Chính quy',
    grade: e.grade || e.classification || 'Giỏi',
    country: e.country || 'Việt Nam',
    school: e.school || e.institutionName || '—',
    year: e.year || (e.graduationYear ? String(e.graduationYear) : ''),
  })) : (page2.highestDegree ? [
    { degree: page2.highestDegree, major: page2.majorName || '—', type: 'Chính quy', grade: 'Giỏi', country: 'Việt Nam', school: 'Đại học', year: '' }
  ] : []);

  // Danh sách Quá trình công tác
  const rawWork = data.workHistories || data.page3?.workHistories || [];
  const workList = rawWork.length > 0 ? rawWork.map((w: any) => ({
    from: formatDate(w.fromDate),
    to: w.toDate ? formatDate(w.toDate) : '',
    recruitJob: w.jobTitle || 'Chuyên viên',
    org: w.companyName || orgName,
    dept: w.department || directUnit,
    title: w.jobTitle || 'Chuyên viên',
  })) : [
    { from: hireDate || '', to: '', recruitJob: jobTitle, org: orgName, dept: directUnit, title: jobTitle }
  ];

  // Danh sách Diễn biến lương
  const rawSalary = data.salaryHistories || data.page3?.salaryHistories || [];
  const salaryList = rawSalary.length > 0 ? rawSalary.map((s: any) => ({
    from: formatDate(s.effectiveDate || s.fromDate),
    to: s.toDate ? formatDate(s.toDate) : '',
    code: s.rankCode || (s.rank?.code) || rankCode,
    rank: s.rankName || (s.rank?.name) || rankName,
    step: String(s.step || salaryStep),
    coeff: s.coefficient != null ? String(s.coefficient).replace('.', ',') : (page2.salaryCoefficient ? String(page2.salaryCoefficient).replace('.', ',') : '2,34'),
  })) : [
    { from: salaryEffectiveDate || hireDate || '', to: '', code: rankCode, rank: rankName, step: salaryStep, coeff: page2.salaryCoefficient ? String(page2.salaryCoefficient).replace('.', ',') : '2,34' }
  ];

  const selfFamList = data.page4?.selfRelations || data.familyRelations?.filter((f: any) => f.category === 'SELF' || (f.relationType !== 'SPOUSE_FAMILY' && f.relationType !== 'SPOUSE')) || [];
  const spouseFamList = data.page4?.spouseRelations || data.familyRelations?.filter((f: any) => f.category === 'SPOUSE' || f.relationType === 'SPOUSE_FAMILY' || f.relationType === 'SPOUSE') || [];

  const handlePrint = () => {
    window.print();
  };

  const pageTabs = [
    { id: 0, label: 'Toàn bộ 5 trang' },
    { id: 1, label: 'Bìa' },
    { id: 2, label: 'Trang 1' },
    { id: 3, label: 'Trang 2' },
    { id: 4, label: 'Trang 3' },
    { id: 5, label: 'Trang 4' },
  ];

  return (
    <div className="huha-preview-wrapper">
      {/* ========================================================================= */}
      {/* THANH ĐIỀU KHIỂN XEM BẢN IN HIỆN ĐẠI & ĐỒNG BỘ VỚI TOÀN BỘ HỆ THỐNG */}
      {/* ========================================================================= */}
      <div className="no-print bg-card border border-border/80 rounded-2xl shadow-sm p-4 mb-6 font-sans space-y-3">
        {/* Dòng 1: Chọn nhân sự, Định dạng & Nút In */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Chọn nhân viên: Vừa tìm kiếm vừa chọn dropdown */}
            {employees.length > 0 && onSelectUser && (
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <SearchableEmployeeSelect
                    employees={employees}
                    value={currentUserId}
                    onChange={onSelectUser}
                  />
                </div>
              </div>
            )}

            {/* Chọn định dạng biểu mẫu */}
            {onSelectCvMode && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <Select
                  value={cvMode}
                  onChange={(e) => onSelectCvMode(e.target.value as 'state' | 'enterprise')}
                  className="w-[280px] text-xs"
                >
                  <option value="state">Mẫu 2C-BNV/2008 (Cơ quan Nhà nước - 5 Trang)</option>
                  <option value="enterprise">Mẫu Doanh nghiệp tư nhân (Hồ sơ trích ngang)</option>
                </Select>
              </div>
            )}
          </div>

          {/* Nút In ấn chính */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg shadow-sm text-xs transition-all active:scale-[0.98] shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>In Bản Chuẩn / Xuất PDF (Ctrl + P)</span>
          </button>
        </div>

        {/* Dòng 2: Phân trang Segmented, Toggle Demo & Thu phóng Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Nhóm chọn trang */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-muted/60 p-1 rounded-xl gap-1 border border-border/40">
              {pageTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentPage(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === tab.id
                      ? 'bg-card text-foreground shadow-xs border border-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => (p === 0 ? 1 : Math.max(1, p - 1)))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border/50 hover:bg-muted text-muted-foreground disabled:opacity-30 transition-all"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => (p === 0 ? 2 : Math.min(5, p + 1)))}
                disabled={currentPage === 5}
                className="p-1.5 rounded-lg border border-border/50 hover:bg-muted text-muted-foreground disabled:opacity-30 transition-all"
                title="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Nhóm tùy chỉnh & Thu phóng */}
          <div className="flex items-center flex-wrap gap-2.5 ml-auto">
            {/* Thu phóng Zoom */}
            <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground">
              <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
              <Select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-[125px] text-xs"
              >
                <option value={75}>75%</option>
                <option value={90}>90%</option>
                <option value={100}>100% (A4 Chuẩn)</option>
                <option value={115}>115%</option>
                <option value={125}>125%</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VÙNG KHÔNG GIAN CANVAS XEM TRƯỚC BẢN IN HIỆN ĐẠI */}
      {/* ========================================================================= */}
      <div
        className="huha-canvas font-times text-black bg-slate-900/90 dark:bg-slate-950 p-4 sm:p-10 overflow-x-auto min-h-[900px] flex flex-col items-center gap-10 rounded-2xl border border-slate-800 shadow-inner"
        style={{
          transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
          transformOrigin: 'top center',
        }}
      >
        <style jsx global>{`
          .huha-canvas,
          .huha-canvas *,
          .huha-title,
          .huha-title *,
          .a4-sheet,
          .a4-sheet * {
            font-family: "Times New Roman", Times, "Liberation Serif", serif !important;
          }

          .huha-title {
            color: #000000 !important;
          }

          .a4-sheet {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            max-height: 297mm;
            background: #ffffff;
            color: #000000;
            box-sizing: border-box;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1);
            margin: 0 auto;
            position: relative;
            border-radius: 2px;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: always;
            break-after: page;
          }

          .a4-cover-sheet {
            padding: 12mm 15mm;
            box-sizing: border-box;
          }

          .a4-body-sheet {
            padding: 12mm 15mm 10mm 15mm;
            box-sizing: border-box;
            font-size: 13pt;
            line-height: 1.35;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: 10px;
          }

          .huha-double-frame {
            border: 3px double #000000 !important;
            outline: 1px solid #000000 !important;
            outline-offset: -6px;
            height: 100%;
            width: 100%;
            padding: 32px 40px 24px 40px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }

          .huha-grid-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11pt;
            font-family: "Times New Roman", Times, serif;
            line-height: 1.25;
          }

          .huha-grid-table th {
            border: 1px solid #000000;
            padding: 4px 4px;
            font-weight: bold;
            text-align: center;
            font-size: 11pt;
            color: #000000 !important;
            background-color: #fafafa;
          }

          .huha-grid-table td {
            border-left: 1px solid #000000;
            border-right: 1px solid #000000;
            border-top: 1px dotted #555555;
            border-bottom: 1px dotted #555555;
            padding: 3px 4px;
            font-size: 11pt;
            color: #000000;
          }

          .huha-grid-table tr:first-child td {
            border-top: 1px solid #000000;
          }

          .huha-grid-table tr:last-child td {
            border-bottom: 1px solid #000000;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 0mm !important;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 210mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .huha-canvas {
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
              min-height: 0 !important;
              display: block !important;
              gap: 0 !important;
            }
            .a4-sheet {
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .a4-cover-sheet {
              padding: 12mm 15mm !important;
            }
            .a4-body-sheet {
              padding: 12mm 15mm 10mm 15mm !important;
            }
            .huha-double-frame {
              height: 273mm !important;
              max-height: 273mm !important;
              box-sizing: border-box !important;
            }
          }
        `}</style>

        {/* ========================================================================= */}
        {/* 1. TRANG BÌA: LÝ LỊCH CÁN BỘ (CHUẨN THEO NGHỊ ĐỊNH & MẪU GỐC) */}
        {/* ========================================================================= */}
        {(currentPage === 0 || currentPage === 1) && (
          <div className="a4-sheet a4-cover-sheet text-[13pt] leading-normal">
            <div className="huha-double-frame">
              {/* Header Top Bìa */}
              <div className="pt-2">
                <div className="flex justify-between items-start gap-4 text-center">
                  {/* Góc trái: Cơ quan cấp trên / Cơ quan đơn vị */}
                  <div className="w-[44%] text-center leading-tight">
                    {parentOrg ? (
                      <>
                        <p className="font-bold text-[11.5pt] uppercase tracking-tight huha-title">
                          {parentOrg}
                        </p>
                        <p className="font-bold text-[11.5pt] uppercase tracking-tight huha-title mt-1">
                          {orgName}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-[12pt] uppercase tracking-tight huha-title">
                        {orgName}
                      </p>
                    )}
                    <div className="w-28 border-b border-black mx-auto mt-2" />
                  </div>

                  {/* Góc phải: Quốc hiệu, tiêu ngữ */}
                  <div className="w-[56%] text-center leading-tight">
                    <p className="font-bold text-[11.5pt] sm:text-[12pt] uppercase tracking-tight huha-title whitespace-nowrap">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM
                    </p>
                    <p className="font-bold text-[12.5pt] sm:text-[13pt] huha-title mt-1 whitespace-nowrap">
                      Độc lập - Tự do - Hạnh phúc
                    </p>
                    <div className="w-36 border-b border-black mx-auto mt-2" />
                  </div>
                </div>
              </div>

              {/* Khối Tiêu đề & Thông tin trung tâm bìa */}
              <div className="my-auto py-10 space-y-12">
                {/* Tiêu đề chính Bìa: LÝ LỊCH CÁN BỘ */}
                <div className="text-center">
                  <h1 className="text-[28pt] font-extrabold uppercase tracking-widest huha-title">
                    LÝ LỊCH CÁN BỘ
                  </h1>
                </div>

                {/* Khối thông tin trung tâm */}
                <div className="max-w-xl mx-auto space-y-5 text-[14pt] leading-relaxed pl-6">
                  <div className="grid grid-cols-12 gap-2 items-baseline">
                    <div className="col-span-5 text-left font-medium huha-title">
                      Họ và tên khai sinh:
                    </div>
                    <div className="col-span-7 font-bold uppercase text-[15pt] text-black tracking-wide">
                      {fullName}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-baseline">
                    <div className="col-span-5 text-left font-medium huha-title">
                      Tên thường gọi:
                    </div>
                    <div className="col-span-7 font-medium text-black">
                      {page1.aliasName || ''}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-baseline">
                    <div className="col-span-5 text-left font-medium huha-title">
                      Bí danh:
                    </div>
                    <div className="col-span-7 font-bold text-black">
                      {aliasName || '—'}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-baseline">
                    <div className="col-span-5 text-left font-medium huha-title">
                      Đơn vị công tác:
                    </div>
                    <div className="col-span-7 font-medium text-black">
                      {directUnit || orgName}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-baseline">
                    <div className="col-span-5 text-left font-medium huha-title">
                      Chức vụ/chức danh:
                    </div>
                    <div className="col-span-7 font-bold uppercase text-black">
                      {jobTitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Khối chân trang Bìa: Mã số bên phải */}
              <div className="pb-4">
                {/* Mã số góc phải */}
                <div className="flex justify-end pr-6">
                  <div className="space-y-1.5 text-[13pt]">
                    <div className="flex gap-4">
                      <span className="w-40 huha-title font-medium text-right">Mã số hồ sơ:</span>
                      <span className="font-bold text-black font-mono">{profileCode}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="w-40 huha-title font-medium text-right">Số hiệu công chức:</span>
                      <span className="font-bold text-black font-mono">{employeeCode}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TRANG 1/4: PHIẾU CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC (CHUẨN 13-14PT) */}
        {/* ========================================================================= */}
        {(currentPage === 0 || currentPage === 2) && (
          <div className="a4-sheet a4-body-sheet text-[12.5pt] leading-[1.32]">
            {/* Header Trang 1 */}
            <div className="text-center">
              <p className="font-bold text-[12pt] uppercase tracking-tight huha-title whitespace-nowrap">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM
              </p>
              <p className="font-bold text-[12.5pt] huha-title whitespace-nowrap">
                Độc lập - Tự do - Hạnh phúc
              </p>
              <div className="w-36 border-b border-black mx-auto mt-1 mb-1" />
              <h2 className="text-[14.5pt] font-extrabold uppercase tracking-wide huha-title">
                PHIẾU CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC
              </h2>
            </div>

            {/* Cơ quan quản lý */}
            <div className="space-y-0.5 text-[12.5pt]">
              {parentOrg ? (
                <>
                  <p>
                    <span className="huha-title font-medium">Cơ quan, đơn vị chủ quản: </span>
                    <span className="text-black font-semibold">{parentOrg}</span>
                  </p>
                  <p>
                    <span className="huha-title font-medium">Cơ quan, đơn vị quản lý trực tiếp: </span>
                    <span className="text-black font-semibold">{orgName}</span>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <span className="huha-title font-medium">Cơ quan, đơn vị chủ quản: </span>
                    <span className="text-black font-semibold">{orgName}</span>
                  </p>
                  <p>
                    <span className="huha-title font-medium">Cơ quan, đơn vị quản lý trực tiếp: </span>
                    <span className="text-black">{directUnit || '—'}</span>
                  </p>
                </>
              )}
            </div>

            {/* I. THÔNG TIN CHUNG */}
            <div>
              <p className="font-bold uppercase text-[13pt] huha-title mb-1">
                I. THÔNG TIN CHUNG:
              </p>

              <div className="flex gap-4 items-start">
                {/* Khung ảnh trắng viền đơn 3x4cm */}
                <div className="w-[3cm] h-[3.8cm] min-w-[3cm] border border-black flex items-center justify-center bg-white shrink-0 shadow-2xs">
                  <span className="text-[10pt] text-gray-400 italic">Ảnh 4x6</span>
                </div>

                {/* Thông tin bên phải ảnh */}
                <div className="flex-1 space-y-0.5 text-[12.5pt]">
                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <div className="col-span-5 huha-title font-medium">Họ và tên khai sinh:</div>
                    <div className="col-span-7 font-bold uppercase text-[13.5pt] text-black">
                      {fullName}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <div className="col-span-5 huha-title font-medium">Họ tên thường dùng:</div>
                    <div className="col-span-7 flex justify-between">
                      <span className="text-black font-medium">{page1.aliasName || ''}</span>
                      <span>
                        <span className="huha-title font-medium">Bí danh: </span>
                        <span className="font-bold text-black">{aliasName || '—'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <div className="col-span-5 huha-title font-medium">Sinh ngày:</div>
                    <div className="col-span-7 flex justify-between">
                      <span className="font-medium text-black">{birthDate || '—'}</span>
                      <span>
                        <span className="huha-title font-medium">Giới tính (nam, nữ): </span>
                        <span className="text-black font-medium">{gender}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <div className="col-span-5 huha-title font-medium">Số hiệu công chức, viên chức:</div>
                    <div className="col-span-7 font-bold text-black">{employeeCode}</div>
                  </div>

                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <div className="col-span-3 huha-title font-medium">Số CMTND:</div>
                    <div className="col-span-9 flex flex-wrap gap-x-2 text-[11.5pt]">
                      <span className="font-bold text-black">{idCardNo || '—'}</span>
                      <span className="huha-title font-medium">Ngày cấp:</span>
                      <span className="text-black">{idCardIssueDate || '—'}</span>
                      <span className="huha-title font-medium">Nơi cấp:</span>
                      <span className="text-black">{idCardIssuePlace || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin phía dưới ảnh */}
              <div className="space-y-0.5 mt-1 text-[12.5pt]">
                <div>
                  <span className="huha-title font-medium">Nơi sinh: </span>
                  <span className="text-black">{birthPlace || '—'}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Quê quán: </span>
                  <span className="ml-1">
                    -Theo ĐVHC trước đây: <span className="text-black">{hometown || '—'}</span>
                  </span>
                </div>
                <div className="pl-16">
                  -Theo ĐVHC hiện nay: <span className="text-black">{hometown || '—'}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Nơi đăng ký hộ khẩu thường trú: </span>
                  <span className="text-black">{permanentAddress || '—'}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Nơi ở hiện nay: </span>
                  <span className="text-black">{currentAddress || '—'}</span>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-3">
                    <span className="huha-title font-medium">Dân tộc: </span>
                    <span className="text-black">{ethnicity}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="huha-title font-medium">Tôn giáo: </span>
                    <span className="text-black">{religion}</span>
                  </div>
                  <div className="col-span-6">
                    <span className="huha-title font-medium">Thành phần xuất thân: </span>
                    <span className="text-black">{familyOrigin}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Tình trạng hôn nhân: </span>
                    <span className="text-black">{maritalStatus}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Địa chỉ email: </span>
                    <span className="text-black">{email || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-4">
                    <span className="huha-title font-medium">ĐT di động: </span>
                    <span className="text-black font-mono">{phone || '—'}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="huha-title font-medium">ĐT cơ quan: </span>
                    <span className="text-black font-mono">{workPhone || '—'}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="huha-title font-medium">ĐTNR: </span>
                    <span className="text-black font-mono">{homePhone || '—'}</span>
                  </div>
                </div>

                <div>
                  <span className="huha-title font-medium">Đại biểu: </span>
                  <span className="ml-2 font-mono">[ ]</span> <span className="huha-title">Quốc hội</span>
                  <span className="ml-4 font-mono font-bold">[X]</span> <span className="huha-title">HĐND cấp tỉnh</span>
                  <span className="ml-4 font-mono">[ ]</span> <span className="huha-title">HĐND cấp huyện</span>
                  <span className="ml-4 font-mono">[ ]</span> <span className="huha-title">HĐND cấp xã</span>
                </div>
              </div>
            </div>

            {/* II. CÔNG TÁC */}
            <div className="text-[12.5pt]">
              <p className="font-bold uppercase text-[13pt] huha-title mb-0.5">
                II. CÔNG TÁC:
              </p>

              <div className="space-y-0.5">
                <div>
                  <span className="huha-title font-medium">Ngày đầu tiên tham gia công tác: </span>
                  <span className="text-black font-medium">{hireDate || '—'}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Cơ quan công tác: </span>
                  <span className="text-black font-semibold">{orgName}</span>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Ngày tuyển dụng: </span>
                    <span className="text-black font-medium">{recruitDate || '—'}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Cơ quan tuyển dụng: </span>
                    <span className="text-black">{recruitOrg}</span>
                  </div>
                </div>

                <div>
                  <span className="huha-title font-medium">Hình thức tuyển dụng: </span>
                  <span className="ml-1 font-mono font-bold">{recruitType.includes('Thi') ? '[X]' : '[ ]'}</span> <span className="huha-title">Thi tuyển</span>
                  <span className="ml-4 font-mono">{recruitType.includes('Xét') ? '[X]' : '[ ]'}</span> <span className="huha-title">Xét tuyển</span>
                  <span className="ml-4 font-mono">{recruitType.includes('Tiếp') ? '[X]' : '[ ]'}</span> <span className="huha-title">Tiếp nhận từ nơi khác</span>
                  <span className="ml-4 font-mono">{recruitType.includes('Phân') ? '[X]' : '[ ]'}</span> <span className="huha-title">Phân công</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Ngày ký hợp đồng (hợp đồng lần đầu, thời vụ): </span>
                  <span className="text-black font-medium">{contractSignDate || '—'}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Nghề nghiệp khi được tuyển dụng: </span>
                  <span className="text-black">{recruitJob}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Nguồn tuyển dụng: </span>
                  <span className="text-black">{recruitSource}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Vị trí tuyển dụng: </span>
                  <span className="text-black font-semibold">{recruitPosition}</span>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Ngày vào cơ quan hiện nay: </span>
                    <span className="text-black font-medium">{currentGovDate || '—'}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Lĩnh vực công tác: </span>
                    <span className="text-black">{workField}</span>
                  </div>
                </div>

                <div>
                  <span className="huha-title font-medium">Công việc chính được giao: </span>
                  <span className="text-black font-semibold">{mainJob}</span>
                </div>
              </div>
            </div>

            {/* III. LƯƠNG, PHỤ CẤP */}
            <div className="text-[12.5pt]">
              <p className="font-bold uppercase text-[13pt] huha-title mb-0.5">
                III. LƯƠNG, PHỤ CẤP:
              </p>

              <div className="space-y-0.5">
                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Mã số ngạch: </span>
                    <span className="text-black font-bold font-mono">{rankCode}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Tên ngạch, chức danh: </span>
                    <span className="text-black font-bold">{rankName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Ngày bổ nhiệm vào ngạch, chức danh: </span>
                    <span className="text-black font-medium">{rankAppointDate || '—'}</span>
                  </div>
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Bậc lương hiện hưởng: </span>
                    <span className="text-black font-bold">{salaryStep}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Phần trăm hưởng bậc: </span>
                    <span className="text-black font-semibold">{salaryRate}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Ngày hưởng bậc lương hiện nay: </span>
                    <span className="text-black font-medium">{salaryEffectiveDate || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. TRANG 2/4: TIẾP TỤC LƯƠNG, ĐÀO TẠO & THÔNG TIN KHÁC (CHUẨN 13-14PT) */}
        {/* ========================================================================= */}
        {(currentPage === 0 || currentPage === 3) && (
          <div className="a4-sheet a4-body-sheet text-[12.5pt] leading-[1.32]">
            {/* Đầu Trang 2: Tiếp tục Mục III Lương & Phụ cấp */}
            <div className="space-y-0.5">
              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-7">
                  <span className="huha-title font-medium">Mốc thời gian tính phụ cấp TNVK lần sau: </span>
                  <span className="text-black font-medium">{nextSeniorityDate || '—'}</span>
                </div>
                <div className="col-span-5">
                  <span className="huha-title font-medium">Phụ cấp TNVK: </span>
                  <span className="text-black font-semibold">{overGradePercent}</span>
                </div>
              </div>

              <div>
                <span className="huha-title font-medium">Chức vụ theo đơn vị: </span>
                <span className="text-black font-bold uppercase">{jobTitle}</span>
              </div>

              <div>
                <span className="huha-title font-medium">Chức vụ tương đương theo NĐ204: </span>
                <span className="text-black font-bold">{equivalentPosition}</span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-4">
                  <span className="huha-title font-medium">Hệ số chức vụ: </span>
                  <span className="text-black font-bold font-mono">{positionAllowance}</span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Ngày bổ nhiệm: </span>
                  <span className="text-black font-medium">{positionAppointDate || '—'}</span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Phụ cấp khu vực: </span>
                  <span className="text-black"></span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-4">
                  <span className="huha-title font-medium">Phụ cấp trách nhiệm: </span>
                  <span className="text-black font-semibold">{responsibilityAllowance || '—'}</span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Phụ cấp kiêm nhiệm: </span>
                  <span className="text-black"></span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Phụ cấp khác: </span>
                  <span className="text-black"></span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-6">
                  <span className="huha-title font-medium">Số sổ BHXH: </span>
                  <span className="text-black font-mono font-medium">{socialInsuranceNo || '—'}</span>
                </div>
                <div className="col-span-6">
                  <span className="huha-title font-medium">Ngày cấp sổ BHXH: </span>
                  <span className="text-black font-medium">{socialInsuranceDate || '—'}</span>
                </div>
              </div>
            </div>

            {/* IV. ĐÀO TẠO, BỒI DƯỠNG */}
            <div>
              <p className="font-bold uppercase text-[13pt] huha-title mb-0.5">
                IV. ĐÀO TẠO, BỒI DƯỠNG:
              </p>

              <div className="space-y-0.5">
                <div>
                  <span className="huha-title font-medium">Trình độ học vấn phổ thông: </span>
                  <span className="text-black font-bold">{generalEducation}</span>
                  <span className="ml-8 font-mono">( [ ] Hệ bổ túc văn hóa )</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Trình độ chuyên môn:</span>
                </div>

                {/* BẢNG ĐÀO TẠO 7 CỘT */}
                <table className="huha-grid-table my-0.5">
                  <thead>
                    <tr>
                      <th style={{ width: '14%' }}>Trình độ</th>
                      <th style={{ width: '22%' }}>Chuyên ngành đào</th>
                      <th style={{ width: '12%' }}>Hình thức đào tạo</th>
                      <th style={{ width: '12%' }}>Tốt nghiệp loại</th>
                      <th style={{ width: '11%' }}>Nước đào tạo</th>
                      <th style={{ width: '19%' }}>Tên trường đào tạo</th>
                      <th style={{ width: '10%' }}>Tốt nghiệp năm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {educationsList.map((edu: any, i: number) => (
                      <tr key={i}>
                        <td className="text-center">{edu.degree}</td>
                        <td>{edu.major}</td>
                        <td className="text-center">{edu.type || 'Chính quy'}</td>
                        <td className="text-center">{edu.grade || 'Giỏi'}</td>
                        <td className="text-center">{edu.country || 'Việt Nam'}</td>
                        <td>{edu.school}</td>
                        <td className="text-center">{edu.year}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - educationsList.length) }).map((_, i) => (
                      <tr key={`empty-edu-${i}`}>
                        <td className="h-4">&nbsp;</td>
                        <td></td><td></td><td></td><td></td><td></td><td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-12 gap-1 pt-0.5">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Chức danh khoa học: </span>
                    <span className="text-black font-semibold">{academicTitle || '—'}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Ngày, tháng, năm phong: </span>
                    <span className="text-black font-medium">{academicDate || '—'}</span>
                  </div>
                </div>

                <div>
                  <span className="huha-title font-medium">Trình độ lý luận chính trị: </span>
                  <span className="text-black font-semibold">{politicalTheory}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Trình độ quản lý HCNN: </span>
                  <span className="text-black">{stateManagement || '—'}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Trình độ quản lý kinh tế: </span>
                  <span className="text-black">{economicManagement || '—'}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Trình độ ngoại ngữ: </span>
                  <span className="huha-title">Tiếng Anh: </span>
                  <span className="ml-4 huha-title font-medium">NN khác: </span>
                  <span className="text-black font-semibold">{foreignLanguage}</span>
                </div>
                <div className="pl-32">
                  <span className="huha-title font-medium">Tiếng dân tộc thiểu số: </span>
                </div>

                <div>
                  <span className="huha-title font-medium">Trình độ tin học: </span>
                  <span className="text-black font-semibold">{informaticsLevel}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Bồi dưỡng kiến thức an ninh, quốc phòng: </span>
                  <span className="ml-2 font-mono">[ ]</span> <span className="huha-title">An ninh</span>
                  <span className="ml-6 font-mono">[ ]</span> <span className="huha-title">Quốc phòng</span>
                </div>
              </div>
            </div>

            {/* V. THÔNG TIN KHÁC */}
            <div>
              <p className="font-bold uppercase text-[13pt] huha-title mb-0.5">
                V. THÔNG TIN KHÁC:
              </p>

              <div className="space-y-0.5">
                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Ngày vào Đoàn: </span>
                    <span className="text-black font-medium">{unionJoinDate || '—'}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Chức vụ Đoàn: </span>
                    <span className="text-black">{unionPosition}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Ngày vào Đảng: </span>
                    <span className="text-black font-medium">{partyJoinDate || '—'}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Ngày chính thức: </span>
                    <span className="text-black font-medium">{partyOfficialDate || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Chức vụ Đảng hiện nay: </span>
                    <span className="text-black font-semibold">{partyPosition || '—'}</span>
                  </div>
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Nơi kết nạp: </span>
                    <span className="text-black">{partyJoinPlace || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Ngày tham gia LLVT: </span>
                    <span className="text-black"></span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Ngày xuất ngũ: </span>
                    <span className="text-black"></span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Quân hàm cao nhất: </span>
                    <span className="text-black font-semibold">{militaryRank || '—'}</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Chức vụ cao nhất: </span>
                    <span className="text-black">{militaryPosition || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Danh hiệu NN phong tặng: </span>
                    <span className="text-black font-semibold">{honorTitle || '—'}</span>
                  </div>
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Năm phong tặng: </span>
                    <span className="text-black font-bold">{honorYear || '—'}</span>
                  </div>
                </div>

                <div>
                  <span className="huha-title font-medium">Đối tượng hưởng chính sách NN: </span>
                  <span className="text-black">{policyBeneficiary}</span>
                </div>

                <div>
                  <span className="huha-title font-medium">Tình trạng sức khỏe: </span>
                  <span className="text-black font-medium">{healthStatus}</span>
                  <span className="ml-3 huha-title font-medium">Chiều cao: </span>
                  <span className="text-black font-mono">{heightStr}</span>
                  <span className="ml-3 huha-title font-medium">Cân nặng: </span>
                  <span className="text-black font-mono">{weightStr}</span>
                  <span className="ml-3 huha-title font-medium">Nhóm máu: </span>
                  <span className="text-black font-bold">{bloodType}</span>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Thương binh loại: </span>
                    <span className="text-black">Không phải</span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Hình thức thương tật: </span>
                    <span className="text-black"></span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-5">
                    <span className="huha-title font-medium">Số sổ thương tật: </span>
                    <span className="text-black"></span>
                  </div>
                  <div className="col-span-7">
                    <span className="huha-title font-medium">Khuyết tật: </span>
                    <span className="text-black"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TRANG 3/4: KHEN THƯỞNG, LỊCH SỬ BẢN THÂN, GIA ĐÌNH (CHUẨN 13-14PT) */}
        {/* ========================================================================= */}
        {(currentPage === 0 || currentPage === 4) && (
          <div className="a4-sheet a4-body-sheet text-[12.5pt] leading-[1.32]">
            {/* Năng lực sở trường & Khen thưởng */}
            <div className="space-y-0.5">
              <div>
                <span className="huha-title font-medium">Năng lực sở trường: </span>
                <span className="text-black font-semibold">{strengths}</span>
              </div>

              <div>
                <span className="huha-title font-medium">Việc làm lâu nhất: </span>
                <span className="text-black font-semibold">{longestJob}</span>
              </div>

              <div>
                <span className="huha-title font-medium">Khen thưởng cao nhất: </span>
                <span className="text-black font-bold">{highestReward}</span>
                <span className="ml-6 huha-title font-medium">Ngày quyết định: </span>
                <span className="text-black font-medium">{rewardDate || '—'}</span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-4">
                  <span className="huha-title font-medium">Số quyết định: </span>
                  <span className="text-black font-bold">{rewardDecisionNo || '—'}</span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Cơ quan quyết định: </span>
                  <span className="text-black">{rewardOrg}</span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Người ký QĐ: </span>
                  <span className="text-black">{rewardSigner}</span>
                </div>
              </div>

              <div>
                <span className="huha-title font-medium">Kỷ luật cao nhất: </span>
                <span className="text-black font-medium ml-1">{highestDiscipline || 'Không'}</span>
                <span className="ml-10 huha-title font-medium">Ngày quyết định: </span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-4">
                  <span className="huha-title font-medium">Số quyết định: </span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Cơ quan quyết định: </span>
                </div>
                <div className="col-span-4">
                  <span className="huha-title font-medium">Người ký QĐ: </span>
                </div>
              </div>
            </div>

            {/* Đặc điểm lịch sử bản thân với các khoảng trống tự khai chuẩn */}
            <div>
              <p className="font-bold huha-title text-[13pt] mb-1">
                Đặc điểm lịch sử bản thân:
              </p>

              <div className="space-y-1.5 pl-1 text-justify text-[12.5pt]">
                <div>
                  <p className="huha-title">
                    - Khai rõ: Bị bắt, bị tù (từ ngày tháng năm nào đến ngày tháng năm nào, ở đâu), đã khai báo cho ai, những vấn đề gì?
                  </p>
                  <p className="text-black pl-4 min-h-[14px]">{page3.arrestRecord || ''}</p>
                </div>

                <div>
                  <p className="huha-title">
                    - Bản thân có làm việc trong chế độ cũ (Cơ quan, đơn vị nào, địa điểm, chức danh, chức vụ, thời gian làm việc)
                  </p>
                  <p className="text-black pl-4 min-h-[14px]">{page3.pastRegimeWork || ''}</p>
                </div>

                <div>
                  <p className="huha-title">
                    - Tham gia hoặc có quan hệ với các tổ chức chính trị, kinh tế, xã hội nào ở nước ngoài (Làm gì, tổ chức nào, đặt trụ sở ở đâu...)?
                  </p>
                  <p className="text-black pl-4 min-h-[14px]">{page3.foreignRelations || ''}</p>
                </div>

                <div>
                  <p className="huha-title">
                    - Có thân nhân (Cha, mẹ, vợ, chồng, con, anh chị em ruột) ở nước ngoài (Làm gì, địa chỉ...)?
                  </p>
                  <p className="text-black pl-4 min-h-[14px]">{page3.foreignRelatives || ''}</p>
                </div>
              </div>
            </div>

            {/* Quan hệ gia đình: a) Về bản thân */}
            <div>
              <p className="font-bold uppercase text-[13pt] huha-title mb-0.5">
                Quan hệ gia đình:
              </p>
              <p className="font-bold huha-title text-[12.5pt] mb-0.5">
                a) Về bản thân: Cha, Mẹ, Vợ (hoặc Chồng), các con, anh chị em ruột
              </p>

              <table className="huha-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '13%' }}>Mối quan hệ</th>
                    <th style={{ width: '23%' }}>Họ tên</th>
                    <th style={{ width: '10%' }}>Năm sinh</th>
                    <th>Quê quán, nghề nghiệp, chức danh, chức vụ, đơn vị công tác, học tập, nơi ở, thành viên các tổ chức chính trị-xã hội...</th>
                  </tr>
                </thead>
                <tbody>
                  {selfFamList.slice(0, 5).map((fam: any, idx: number) => (
                    <tr key={idx}>
                      <td className="text-center font-medium">{fam.relationship || fam.relationType}</td>
                      <td className="font-medium">{fam.fullName}</td>
                      <td className="text-center">{fam.birthYear}</td>
                      <td>{fam.details || fam.address || fam.workPlace}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - selfFamList.length) }).map((_, i) => (
                    <tr key={`empty-fam-a-${i}`}>
                      <td className="h-4">&nbsp;</td>
                      <td></td><td></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. TRANG 4/4: GIA ĐÌNH BÊN VỢ/CHỒNG, QUÁ TRÌNH CÔNG TÁC, LƯƠNG & KÝ TÊN (CHUẨN 13-14PT) */}
        {/* ========================================================================= */}
        {(currentPage === 0 || currentPage === 5) && (
          <div className="a4-sheet a4-body-sheet text-[12.5pt] leading-[1.32]">
            {/* b) Về bên Vợ (hoặc Chồng) */}
            <div>
              <p className="font-bold huha-title text-[12.5pt] mb-0.5">
                b) Về bên Vợ (hoặc Chồng): Cha, Mẹ, anh chị em ruột
              </p>

              <table className="huha-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '13%' }}>Mối quan hệ</th>
                    <th style={{ width: '23%' }}>Họ tên</th>
                    <th style={{ width: '10%' }}>Năm sinh</th>
                    <th>Quê quán, nghề nghiệp, chức danh, chức vụ, đơn vị công tác, học tập, nơi ở, thành viên các tổ chức chính trị-xã hội...</th>
                  </tr>
                </thead>
                <tbody>
                  {spouseFamList.slice(0, 4).map((fam: any, idx: number) => (
                    <tr key={idx}>
                      <td className="text-center font-medium">{fam.relationship || fam.relationType}</td>
                      <td className="font-medium">{fam.fullName}</td>
                      <td className="text-center">{fam.birthYear}</td>
                      <td>{fam.details || fam.address || fam.workPlace}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - spouseFamList.length) }).map((_, i) => (
                    <tr key={`empty-fam-b-${i}`}>
                      <td className="h-4">&nbsp;</td>
                      <td></td><td></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Diễn biến quá trình công tác */}
            <div>
              <p className="font-bold huha-title text-[12.5pt] mb-0.5">
                Diễn biến quá trình công tác:
              </p>

              <table className="huha-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Từ ngày</th>
                    <th style={{ width: '12%' }}>Đến ngày</th>
                    <th style={{ width: '19%' }}>Vị trí tuyển dụng</th>
                    <th style={{ width: '22%' }}>Đơn vị công tác</th>
                    <th style={{ width: '19%' }}>Phòng ban</th>
                    <th style={{ width: '16%' }}>Chức danh</th>
                  </tr>
                </thead>
                <tbody>
                  {workList.slice(0, 3).map((w: any, idx: number) => (
                    <tr key={idx}>
                      <td className="text-center font-medium">{w.from}</td>
                      <td className="text-center font-medium">{w.to}</td>
                      <td>{w.recruitJob}</td>
                      <td>{w.org}</td>
                      <td>{w.dept}</td>
                      <td>{w.title}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 2 - workList.length) }).map((_, i) => (
                    <tr key={`empty-work-${i}`}>
                      <td className="h-4">&nbsp;</td>
                      <td></td><td></td><td></td><td></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Diễn biến quá trình lương */}
            <div>
              <p className="font-bold huha-title text-[12.5pt] mb-0.5">
                Diễn biến quá trình lương
              </p>

              <table className="huha-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '13%' }}>Từ</th>
                    <th style={{ width: '13%' }}>Đến</th>
                    <th style={{ width: '13%' }}>Mã ngạch</th>
                    <th>Tên ngạch</th>
                    <th style={{ width: '9%' }}>Bậc</th>
                    <th style={{ width: '11%' }}>Hệ số</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryList.slice(0, 3).map((s: any, idx: number) => (
                    <tr key={idx}>
                      <td className="text-center font-medium">{s.from}</td>
                      <td className="text-center font-medium">{s.to}</td>
                      <td className="text-center font-mono">{s.code}</td>
                      <td>{s.rank}</td>
                      <td className="text-center font-semibold">{s.step}</td>
                      <td className="text-center font-bold font-mono">{s.coeff}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 2 - salaryList.length) }).map((_, i) => (
                    <tr key={`empty-sal-${i}`}>
                      <td className="h-4">&nbsp;</td>
                      <td></td><td></td><td></td><td></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dòng ngày tháng năm đứng 1 dòng riêng phía trên phần ký tên của 3 người */}
            <div className="flex justify-end text-right pr-6 pt-1">
              <p className="italic text-[12pt] huha-title">
                {orgConfig?.location || 'TP. Hồ Chí Minh'}, ngày ..... tháng ..... năm 20.....
              </p>
            </div>

            {/* Khối chữ ký 3 cột cuối trang 4 */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1 text-[12pt]">
              {/* Cột 1: Người khai */}
              <div className="flex flex-col items-center">
                <p className="font-bold huha-title text-[12.5pt]">{orgConfig?.signerTitle1 || 'Người khai'}</p>
                <p className="text-[11pt] huha-title leading-tight">Tôi xin cam đoan những lời khai trên là đúng sự thật</p>
                <p className="italic text-[10.5pt] huha-title mt-0.5">(Ký, ghi rõ họ tên)</p>
                <div className="h-14" />
              </div>

              {/* Cột 2: Xác nhận kiểm tra */}
              <div className="flex flex-col items-center">
                <p className="font-bold huha-title text-[12.5pt]">{orgConfig?.signerTitle2 || 'Xác nhận kiểm tra'}</p>
                <p className="text-[11pt] huha-title leading-tight">Cán bộ phụ trách công tác tổ chức cán bộ của đơn vị</p>
                <p className="italic text-[10.5pt] huha-title mt-0.5">(Ký, ghi rõ họ tên)</p>
                <div className="h-14" />
              </div>

              {/* Cột 3: Thủ trưởng cơ quan quản lý trực tiếp */}
              <div className="flex flex-col items-center">
                <p className="font-bold huha-title text-[12.5pt] leading-tight">{orgConfig?.signerTitle3 || 'Thủ trưởng cơ quan quản lý trực tiếp'}</p>
                <p className="italic text-[10.5pt] huha-title mt-0.5">(Ký tên, đóng dấu)</p>
                <div className="h-14" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


