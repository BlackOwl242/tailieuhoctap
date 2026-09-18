'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet, FileText, Printer, Download, Users, Award, GraduationCap,
  Building, CheckCircle2, ChevronRight, Search, Globe, BookOpen, User
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge, Button, Card, Input, Select } from '@/components/ui/primitives';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock, PrintExportDropdown } from '@/components/ui/print';
import { exportRowsToExcel } from '@/lib/export';
import { useOrgConfig, isEnterpriseSector } from '@/lib/org-config';
import { StateCivilServantProfile } from '@/components/personnel/StateCivilServantProfile';
import { EnterprisePersonnelProfile } from '@/components/personnel/EnterprisePersonnelProfile';
import { SearchableEmployeeSelect } from '@/components/personnel/SearchableEmployeeSelect';

export default function PersonnelReportsPage() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const [orgConfig] = useOrgConfig();
  const [activeReport, setActiveReport] = useState<'2c' | 'bieu01' | 'bieu02' | 'bieu03'>('2c');
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || '');
  const [cvMode, setCvMode] = useState<'state' | 'enterprise'>('state');

  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
      setActiveReport('2c');
    }
  }, [initialUserId]);

  // Lấy danh sách nhân viên để chọn in sơ yếu lý lịch 4 trang
  const qEmployees = useQuery({
    queryKey: ['employees-for-report'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return (res.data?.items || res.data || []) as any[];
    },
  });

  // Tự động chọn người đầu tiên nếu chưa chọn
  const employees = qEmployees.data || [];
  const currentUserId = selectedUserId || (employees.length > 0 ? employees[0].id : '');

  // Query dữ liệu Sơ yếu lý lịch 4 trang
  const q2c = useQuery({
    queryKey: ['report-2c', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const res = await api.get(`/personnel-reports/2c-profile/${currentUserId}`);
      return res.data;
    },
    enabled: activeReport === '2c' && !!currentUserId,
  });

  // Query Biểu 01: Tuổi x Ngạch
  const qBieu01 = useQuery({
    queryKey: ['report-bieu-01'],
    queryFn: async () => (await api.get('/personnel-reports/bieu-01-age-rank')).data,
    enabled: activeReport === 'bieu01',
  });

  // Query Biểu 02: Ngoại ngữ
  const qBieu02 = useQuery({
    queryKey: ['report-bieu-02'],
    queryFn: async () => (await api.get('/personnel-reports/bieu-02-languages')).data,
    enabled: activeReport === 'bieu02',
  });

  // Query Biểu 03: Trình độ x Đơn vị
  const qBieu03 = useQuery({
    queryKey: ['report-bieu-03'],
    queryFn: async () => (await api.get('/personnel-reports/bieu-03-education-unit')).data,
    enabled: activeReport === 'bieu03',
  });

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Báo cáo nhân sự"
        description="Mẫu biểu báo cáo nhân lực chuẩn hóa: Sơ yếu lý lịch (Mẫu 2C-BNV), Thống kê Độ tuổi theo Ngạch bậc (Biểu 01), Ngoại ngữ (Biểu 02) và Chuyên môn (Biểu 03)."
        breadcrumbs={[{ label: 'Báo cáo' }, { label: 'Báo cáo nhân sự' }]}
      />

      {/* Tabs Chọn Báo cáo */}
      <div className="flex border-b border-border/60 gap-2 mb-6 overflow-x-auto pb-1 no-print">
        {[
          { id: '2c', label: '1. Sơ yếu Lý lịch (2C-BNV & Doanh nghiệp)', icon: FileText },
          { id: 'bieu01', label: '2. Biểu 01: Độ tuổi × Ngạch bậc', icon: Award },
          { id: 'bieu02', label: '3. Biểu 02: Ngoại ngữ & Tin học', icon: Globe },
          { id: 'bieu03', label: '4. Biểu 03: Trình độ CM & LLCT × Đơn vị', icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                active
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground bg-card border border-border/60 hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BÁO CÁO 1: SƠ YẾU LÝ LỊCH KÉP (NHÀ NƯỚC 2C-BNV / 2008 & DOANH NGHIỆP TƯ NHÂN) */}
      {activeReport === '2c' && (
        <div className="space-y-6">
          {/* Vùng Bản In Sơ Yếu Lý Lịch Chuẩn A4 */}
          <div className="print-area max-w-6xl mx-auto text-black">
            {q2c.isLoading ? (
              <div className="text-center py-20 text-muted-foreground font-sans bg-card border border-border rounded-lg shadow-xs">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="font-semibold text-sm">Đang nạp dữ liệu hồ sơ lý lịch toàn diện...</p>
              </div>
            ) : q2c.data ? (
              cvMode === 'state' ? (
                <StateCivilServantProfile
                  data={q2c.data}
                  orgConfig={orgConfig}
                  employees={employees}
                  currentUserId={currentUserId}
                  onSelectUser={setSelectedUserId}
                  cvMode={cvMode}
                  onSelectCvMode={setCvMode}
                />
              ) : (
                <div className="space-y-4">
                  {/* Toolbar cho chế độ Doanh nghiệp */}
                  <div className="no-print bg-card border border-border rounded-lg shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3 font-sans">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">Nhân sự:</span>
                        <SearchableEmployeeSelect
                          employees={employees}
                          value={currentUserId}
                          onChange={setSelectedUserId}
                          className="min-w-[280px]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">Định dạng:</span>
                        <Select
                          value={cvMode}
                          onChange={(e) => setCvMode(e.target.value as 'state' | 'enterprise')}
                          className="w-[280px] text-xs"
                        >
                          <option value="state">Mẫu 2C-BNV/2008 (Cơ quan Nhà nước - Trọn bộ 5 trang)</option>
                          <option value="enterprise">Mẫu Doanh nghiệp tư nhân (Hồ sơ trích ngang)</option>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> In Bản Chuẩn (Ctrl + P)
                    </Button>
                  </div>

                  <div className="bg-muted/80 p-4 sm:p-10 rounded-lg shadow-inner border border-border flex justify-center">
                    <div className="bg-card border border-border rounded-lg p-6 sm:p-10 shadow-xl w-full max-w-4xl">
                      <EnterprisePersonnelProfile data={q2c.data} orgConfig={orgConfig} />
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-20 text-muted-foreground font-sans bg-card border border-border rounded-lg">
                Chưa có dữ liệu hồ sơ nhân sự được chọn.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BÁO CÁO 2: BIỂU 01 - ĐỘ TUỔI X NGẠCH */}
      {activeReport === 'bieu01' && (
        <div className="print-area font-times space-y-4">
          <PrintFrame
            title="THỐNG KÊ CƠ CẤU ĐỘ TUỔI THEO NGẠCH BẬC LƯƠNG"
            subtitle={`Biểu 01 — Xuất ngày ${formatDate(new Date().toISOString())}`}
          />
          <Card className="p-5 bg-card border border-border shadow-xs overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[11pt]">
              <thead>
                <tr className="bg-muted/60 text-foreground text-center font-bold">
                  <th className="border border-border p-2 text-left" rowSpan={2}>Tên ngạch lương</th>
                  <th className="border border-border p-2" rowSpan={2}>Mã ngạch</th>
                  <th className="border border-border p-2" rowSpan={2}>Tổng số</th>
                  <th className="border border-border p-1.5" colSpan={2}>Dưới 30 tuổi</th>
                  <th className="border border-border p-1.5" colSpan={2}>30 - 39 tuổi</th>
                  <th className="border border-border p-1.5" colSpan={2}>40 - 49 tuổi</th>
                  <th className="border border-border p-1.5" colSpan={2}>50 - 54 tuổi</th>
                  <th className="border border-border p-1.5" colSpan={2}>55 - 59 tuổi</th>
                  <th className="border border-border p-1.5" colSpan={2}>Từ 60 tuổi</th>
                </tr>
                <tr className="bg-muted/40 text-foreground text-[10pt]">
                  <th className="border border-border p-1">Nam</th>
                  <th className="border border-border p-1">Nữ</th>
                  <th className="border border-border p-1">Nam</th>
                  <th className="border border-border p-1">Nữ</th>
                  <th className="border border-border p-1">Nam</th>
                  <th className="border border-border p-1">Nữ</th>
                  <th className="border border-border p-1">Nam</th>
                  <th className="border border-border p-1">Nữ</th>
                  <th className="border border-border p-1">Nam</th>
                  <th className="border border-border p-1">Nữ</th>
                  <th className="border border-border p-1">Nam</th>
                  <th className="border border-border p-1">Nữ</th>
                </tr>
              </thead>
              <tbody>
                {qBieu01.isLoading ? (
                  <tr><td colSpan={15} className="text-center py-6 text-muted-foreground">Đang tổng hợp số liệu...</td></tr>
                ) : (
                  qBieu01.data?.rows?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 text-center">
                      <td className="border border-border p-2 text-left font-medium text-foreground">{row.rank.name}</td>
                      <td className="border border-border p-2 font-bold">{row.rank.code}</td>
                      <td className="border border-border p-2 font-bold bg-muted/30">{row.total}</td>
                      <td className="border border-black p-1">{row.ageGroups.under30.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.under30.female || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.ageGroups.age30to39.male || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.ageGroups.age30to39.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age40to49.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age40to49.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age50to54.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age50to54.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age55to59.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age55to59.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.above60.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.above60.female || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
          <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
        </div>
      )}

      {/* BÁO CÁO 3: BIỂU 02 - NGOẠI NGỮ & TIN HỌC */}
      {activeReport === 'bieu02' && (
        <div className="print-area font-times space-y-4">
          <PrintFrame
            title="THỐNG KÊ TRÌNH ĐỘ NGOẠI NGỮ & TIN HỌC"
            subtitle={`Biểu 02 — Tổng số ${qBieu02.data?.totalPersonnel || 0} nhân sự`}
          />
          <Card className="p-5 bg-card border border-border shadow-xs overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[11pt]">
              <thead>
                <tr className="bg-muted/60 text-foreground font-bold">
                  <th className="border border-border p-2 text-center w-12">STT</th>
                  <th className="border border-border p-2 text-left w-24">Mã NV</th>
                  <th className="border border-border p-2 text-left">Họ và tên</th>
                  <th className="border border-border p-2 text-left">Đơn vị / Phòng ban</th>
                  <th className="border border-border p-2 text-left">Ngạch lương</th>
                  <th className="border border-border p-2 text-left">Trình độ Ngoại ngữ</th>
                  <th className="border border-border p-2 text-left">Trình độ Tin học</th>
                </tr>
              </thead>
              <tbody>
                {qBieu02.isLoading ? (
                  <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Đang tổng hợp số liệu...</td></tr>
                ) : (
                  qBieu02.data?.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="border border-border p-2 text-center">{idx + 1}</td>
                      <td className="border border-border p-2 font-bold">{item.employeeCode || '—'}</td>
                      <td className="border border-black p-2 font-bold">{item.fullName}</td>
                      <td className="border border-black p-2">{item.orgUnitName || '—'}</td>
                      <td className="border border-black p-2">{item.rankName || 'Theo HĐLĐ'}</td>
                      <td className="border border-black p-2 font-medium">{item.foreignLanguage}</td>
                      <td className="border border-black p-2 font-medium">{item.informaticsLevel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
          <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
        </div>
      )}

      {/* BÁO CÁO 4: BIỂU 03 - TRÌNH ĐỘ CHUYÊN MÔN & LLCT X ĐƠN VỊ */}
      {activeReport === 'bieu03' && (
        <div className="print-area font-times space-y-4">
          <PrintFrame
            title="THỐNG KÊ TRÌNH ĐỘ CHUYÊN MÔN & LÝ LUẬN CHÍNH TRỊ THEO ĐƠN VỊ"
            subtitle={`Biểu 03 — Xuất ngày ${formatDate(new Date().toISOString())}`}
          />
          <Card className="p-5 bg-card border border-border shadow-xs overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[11pt]">
              <thead>
                <tr className="bg-muted/60 text-foreground text-center font-bold">
                  <th className="border border-border p-2 text-left" rowSpan={2}>Đơn vị / Phòng ban</th>
                  <th className="border border-border p-2" rowSpan={2}>Tổng số</th>
                  <th className="border border-border p-1.5" colSpan={4}>Trình độ Chuyên môn</th>
                  <th className="border border-border p-1.5" colSpan={3}>Lý luận Chính trị</th>
                </tr>
                <tr className="bg-muted/40 text-foreground text-[10pt]">
                  <th className="border border-border p-1">Tiến sĩ</th>
                  <th className="border border-border p-1">Thạc sĩ</th>
                  <th className="border border-border p-1">Đại học</th>
                  <th className="border border-border p-1">Cao đẳng/TC</th>
                  <th className="border border-border p-1">Cao cấp</th>
                  <th className="border border-border p-1">Trung cấp</th>
                  <th className="border border-border p-1">Sơ cấp/Không</th>
                </tr>
              </thead>
              <tbody>
                {qBieu03.isLoading ? (
                  <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">Đang tổng hợp số liệu...</td></tr>
                ) : (
                  qBieu03.data?.rows?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 text-center">
                      <td className="border border-border p-2 text-left font-bold text-foreground">{row.orgUnitName}</td>
                      <td className="border border-border p-2 font-bold bg-muted/30">{row.total}</td>
                      <td className="border border-black p-1 font-semibold">{row.doctorate || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.master || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.bachelor || '—'}</td>
                      <td className="border border-black p-1">{row.college + row.intermediate || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.polHigh || '—'}</td>
                      <td className="border border-black p-1">{row.polMid || '—'}</td>
                      <td className="border border-black p-1">{row.polBasic || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
          <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
        </div>
      )}
    </div>
  );
}
