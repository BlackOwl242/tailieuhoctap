'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers, Search, Eye, TrendingUp, CheckCircle2, ShieldAlert, Building2,
  Briefcase, RefreshCw, AlertTriangle, ArrowUpRight, Award, Calendar,
  Clock, User, Check, X,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, Card, Input } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';
import { useOrgConfig, isEnterpriseSector } from '@/lib/org-config';

interface PersonnelRankRow {
  code: string;
  name: string;
  groupCode: string;
  field: string | null;
  totalSteps: number;
  stepMonths: number;
  coefficients: number[];
}

interface EnterpriseSalaryBand {
  bandCode: string;
  bandName: string;
  levelTitle: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  reviewCycleMonths: number;
  roles: string;
  criteria: string;
}

interface ProgressionItem {
  userId: string;
  employeeCode: string;
  fullName: string;
  jobTitle: string;
  orgUnitName: string;
  rankCode: string;
  rankName: string;
  groupCode: string;
  currentStep: number;
  totalSteps: number;
  currentCoefficient: number;
  salaryStepDate: string;
  monthsHeld: number;
  requiredMonths: number;
  isOverdue: boolean;
  progressionType: 'STEP_PROMOTION' | 'OVER_GRADE_ALLOWANCE' | 'NONE';
  nextStep: number;
  nextCoefficient: number;
  currentOverGradePercent: number;
  suggestedOverGradePercent: number;
}

const ENTERPRISE_SALARY_BANDS: EnterpriseSalaryBand[] = [
  {
    bandCode: 'BAND-1',
    bandName: 'Bậc 1: Tập sự & Thực tập',
    levelTitle: 'Intern / Fresher / Trainee',
    minSalary: 6000000,
    midSalary: 8500000,
    maxSalary: 11000000,
    reviewCycleMonths: 6,
    roles: 'Thực tập sinh, Nhân viên thử việc, Kỹ sư mới tốt nghiệp',
    criteria: 'Hoàn thành thời gian thử việc, nắm vững quy trình cơ bản',
  },
  {
    bandCode: 'BAND-2',
    bandName: 'Bậc 2: Chuyên viên / Kỹ sư',
    levelTitle: 'Junior / Associate',
    minSalary: 12000000,
    midSalary: 17000000,
    maxSalary: 22000000,
    reviewCycleMonths: 12,
    roles: 'Chuyên viên Nhân sự, Kỹ sư Phần mềm, Kế toán viên, Chuyên viên Kinh doanh',
    criteria: 'Độc lập xử lý công việc chuyên môn, đạt KPI định kỳ',
  },
  {
    bandCode: 'BAND-3',
    bandName: 'Bậc 3: Chuyên viên chính',
    levelTitle: 'Senior Professional / Specialist',
    minSalary: 24000000,
    midSalary: 32000000,
    maxSalary: 40000000,
    reviewCycleMonths: 12,
    roles: 'Senior Developer, Chuyên viên C&B Cao cấp, Kế toán tổng hợp, Key Account Manager',
    criteria: 'Giải quyết bài toán phức tạp, cố vấn chuyên môn cho cấp dưới',
  },
  {
    bandCode: 'BAND-4',
    bandName: 'Bậc 4: Trưởng nhóm chuyên môn',
    levelTitle: 'Lead / Principal / Assistant Manager',
    minSalary: 42000000,
    midSalary: 52000000,
    maxSalary: 62000000,
    reviewCycleMonths: 12,
    roles: 'Tech Lead, Team Leader Tuyển dụng, Trưởng nhóm Kiểm soát Tài chính, Scrum Master',
    criteria: 'Lãnh đạo nhóm từ 5-15 nhân sự, chịu trách nhiệm KPI đầu ra của đội ngũ',
  },
  {
    bandCode: 'BAND-5',
    bandName: 'Bậc 5: Trưởng phòng / Quản lý cấp trung',
    levelTitle: 'Department Head / Manager',
    minSalary: 65000000,
    midSalary: 80000000,
    maxSalary: 95000000,
    reviewCycleMonths: 12,
    roles: 'Trưởng phòng Nhân sự, Giám đốc Dự án (PMO), Trưởng phòng Kinh doanh, Kế toán trưởng',
    criteria: 'Quản trị ngân sách phòng ban, hoạch định chiến lược chức năng, quản trị rủi ro',
  },
  {
    bandCode: 'BAND-6',
    bandName: 'Bậc 6: Giám đốc Khối & Điều hành',
    levelTitle: 'Director / C-Level Executive',
    minSalary: 100000000,
    midSalary: 135000000,
    maxSalary: 180000000,
    reviewCycleMonths: 12,
    roles: 'Giám đốc Khối Kỹ thuật (VP Delivery), Giám đốc Tài chính (CFO), Giám đốc Nhân sự (CHRO)',
    criteria: 'Chịu trách nhiệm P&L toàn khối, định hướng chiến lược doanh nghiệp',
  },
];

export default function SalaryRanksPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'progression' ? 'progression' : 'ranks';
  const [mainTab, setMainTab] = useState<'ranks' | 'progression'>(initialTab);

  const queryClient = useQueryClient();
  const [orgConfig] = useOrgConfig();
  const [viewMode, setViewMode] = useState<'state' | 'enterprise'>(() => {
    return isEnterpriseSector(orgConfig) ? 'enterprise' : 'state';
  });

  const [selectedRank, setSelectedRank] = useState<PersonnelRankRow | null>(null);
  const [selectedBand, setSelectedBand] = useState<EnterpriseSalaryBand | null>(null);

  // --- State & Query cho Tab Nâng bậc lương ---
  const [selectedPerson, setSelectedPerson] = useState<ProgressionItem | null>(null);
  const [approvalDecisionNo, setApprovalDecisionNo] = useState(`QĐ-NL/${new Date().getFullYear()}`);

  const qRanks = useQuery({
    queryKey: ['personnel-ranks'],
    queryFn: async () => (await api.get<PersonnelRankRow[]>('/personnel-ranks')).data,
    enabled: mainTab === 'ranks',
  });

  const qScan = useQuery({
    queryKey: ['salary-progression-scan'],
    queryFn: async () => {
      const res = await api.get('/personnel-ranks/progression/scan');
      return res.data;
    },
    enabled: mainTab === 'progression',
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/personnel-ranks/progression/apply', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-progression-scan'] });
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSelectedPerson(null);
      alert('Đã phê duyệt nâng bậc lương thành công!');
    },
    onError: (err) => {
      alert('Lỗi phê duyệt: ' + errorMessage(err));
    },
  });

  // --- Cột danh mục Ngạch bậc Nhà nước ---
  const stateColumns: DataColumn<PersonnelRankRow>[] = [
    {
      key: 'code',
      header: 'Mã ngạch',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {r.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Tên ngạch lương',
      sortable: true,
      render: (r) => (
        <div>
          <button
            onClick={() => setSelectedRank(r)}
            className="font-semibold text-slate-900 hover:text-primary text-left block"
          >
            {r.name}
          </button>
          <span className="text-xs text-muted-foreground">{r.field || 'Hành chính / Chuyên môn'}</span>
        </div>
      ),
    },
    {
      key: 'groupCode',
      header: 'Nhóm ngạch',
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
          Nhóm {r.groupCode}
        </span>
      ),
    },
    {
      key: 'totalSteps',
      header: 'Tổng số bậc',
      sortable: true,
      render: (r) => (
        <span className="text-xs font-semibold text-slate-700">
          {r.totalSteps} bậc
        </span>
      ),
    },
    {
      key: 'stepMonths',
      header: 'Thời gian nâng bậc',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-slate-600 font-medium">
          {r.stepMonths} tháng ({r.stepMonths / 12} năm)
        </span>
      ),
    },
    {
      key: 'coefficients',
      header: 'Dải hệ số (Khởi điểm - Trần)',
      render: (r) => (
        <div className="text-xs font-mono">
          <span className="text-slate-600">{r.coefficients[0]?.toFixed(2) || '—'}</span>
          <span className="text-slate-400 mx-1.5">➔</span>
          <span className="font-semibold text-emerald-700">
            {r.coefficients[r.coefficients.length - 1]?.toFixed(2) || '—'}
          </span>
        </div>
      ),
    },
  ];

  // --- Cột Thang bảng lương Doanh nghiệp ---
  const enterpriseColumns: DataColumn<EnterpriseSalaryBand>[] = [
    {
      key: 'bandCode',
      header: 'Mã bậc',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {r.bandCode}
        </span>
      ),
    },
    {
      key: 'bandName',
      header: 'Khung bậc chức danh',
      sortable: true,
      render: (r) => (
        <div>
          <button
            onClick={() => setSelectedBand(r)}
            className="font-semibold text-slate-900 hover:text-primary text-left block"
          >
            {r.bandName}
          </button>
          <span className="text-xs text-muted-foreground">{r.levelTitle}</span>
        </div>
      ),
    },
    {
      key: 'minSalary',
      header: 'Lương sàn (Min)',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs text-slate-700">
          {r.minSalary.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'midSalary',
      header: 'Lương chuẩn (Mid)',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-emerald-700">
          {r.midSalary.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'maxSalary',
      header: 'Lương trần (Max)',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs text-slate-700">
          {r.maxSalary.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'reviewCycleMonths',
      header: 'Chu kỳ xét lương',
      render: (r) => (
        <span className="text-xs font-medium text-slate-700">
          {r.reviewCycleMonths} tháng / lần
        </span>
      ),
    },
  ];

  // --- Cột Bảng Quét Nâng bậc Lương ---
  const allProgressionItems: ProgressionItem[] = [
    ...(qScan.data?.eligibleList || []),
    ...(qScan.data?.normalList || []),
  ];

  const progressionColumns: DataColumn<ProgressionItem>[] = [
    {
      key: 'employeeCode',
      header: 'Mã NV',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {r.employeeCode || '—'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Họ và tên',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-bold text-slate-900">{r.fullName}</div>
          <div className="text-xs text-muted-foreground">{r.jobTitle} • {r.orgUnitName}</div>
        </div>
      ),
    },
    {
      key: 'rank',
      header: 'Ngạch hiện tại',
      render: (r) => (
        <div>
          <div className="text-xs font-semibold text-foreground">
            {r.rankName}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            Bậc {r.currentStep}/{r.totalSteps} (HS: {r.currentCoefficient.toFixed(2)})
          </div>
        </div>
      ),
    },
    {
      key: 'stepDate',
      header: 'Ngày hưởng bậc',
      render: (r) => (
        <div>
          <div className="text-xs font-medium text-slate-800">{formatDate(r.salaryStepDate)}</div>
          <div className="text-[11px] text-muted-foreground">
            Đã giữ: <span className="font-semibold text-slate-700">{r.monthsHeld} tháng</span> / {r.requiredMonths} th
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Tình trạng nâng bậc',
      sortable: true,
      render: (r) => {
        if (r.progressionType === 'STEP_PROMOTION') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Đủ điều kiện nâng Bậc {r.nextStep} (HS: {r.nextCoefficient.toFixed(2)})
            </span>
          );
        }
        if (r.progressionType === 'OVER_GRADE_ALLOWANCE') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
              Đạt thâm niên vượt khung ({r.suggestedOverGradePercent}%)
            </span>
          );
        }
        return (
          <span className="text-xs text-muted-foreground">
            Chưa đến hạn (còn {r.requiredMonths - r.monthsHeld} tháng)
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Ngạch bậc & Nâng bậc Lương"
        description="Quản trị khung ngạch bậc lương tiêu chuẩn Nhà nước (NĐ 204/2004), Thang bảng lương Doanh nghiệp (BLLĐ 2019) và Tự động quét xét nâng bậc lương định kỳ."
        actions={
          mainTab === 'progression' ? (
            <Button
              onClick={() => qScan.refetch()}
              disabled={qScan.isFetching}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${qScan.isFetching ? 'animate-spin' : ''}`} />
              Quét lại danh sách
            </Button>
          ) : undefined
        }
      />

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3 mb-4">
        <button
          onClick={() => setMainTab('ranks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mainTab === 'ranks'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Thang bảng lương & Ngạch bậc
        </button>
        <button
          onClick={() => setMainTab('progression')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mainTab === 'progression'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Xét & Phê duyệt nâng bậc lương
          {qScan.data?.eligibleCount ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
              {qScan.data.eligibleCount}
            </span>
          ) : null}
        </button>
      </div>

      {mainTab === 'ranks' ? (
        <>
          {/* Dual Mode Switcher Tabs (Nhà nước vs Doanh nghiệp) */}
          <div className="flex items-center gap-2 pb-3 mb-4">
            <button
              onClick={() => setViewMode('state')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'state'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Cơ quan Nhà nước: 184 Ngạch bậc lương (Nghị định 204)
            </button>
            <button
              onClick={() => setViewMode('enterprise')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'enterprise'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Doanh nghiệp: Khung Thang bảng lương theo Vị trí (Job Bands)
            </button>
          </div>

          <div className="print-area">
            {viewMode === 'state' ? (
              <>
                <PrintFrame
                  title="DANH MỤC NGẠCH BẬC LƯƠNG TIÊU CHUẨN CÔNG CHỨC, VIÊN CHỨC (NĐ 204)"
                  subtitle={`Tổng số ${qRanks.data?.length || 0} ngạch bậc được cấu hình`}
                />

                {qRanks.isError ? (
                  <ErrorState message={errorMessage(qRanks.error)} onRetry={() => qRanks.refetch()} />
                ) : (
                  <DataTable
                    columns={stateColumns}
                    rows={qRanks.data || []}
                    rowKey={(r) => r.code}
                    loading={qRanks.isLoading}
                    exportFilename="danh-muc-ngach-bac-luong-nha-nuoc"
                    printLabel="In danh mục ngạch bậc"
                    searchFields={(r) => [r.code, r.name, r.groupCode, r.field || '']}
                    filters={[
                      {
                        key: 'groupCode',
                        label: 'Nhóm ngạch',
                        value: (r) => r.groupCode,
                        options: [
                          { value: 'A3', label: 'Nhóm A3 (Cao cấp: 6 bậc, 36 tháng)' },
                          { value: 'A2', label: 'Nhóm A2 (Chính: 8 bậc, 36 tháng)' },
                          { value: 'A1', label: 'Nhóm A1 (Chuyên viên/Kỹ sư: 9 bậc, 36 tháng)' },
                          { value: 'B', label: 'Nhóm B (Cán sự/Kỹ thuật viên: 12 bậc, 24 tháng)' },
                          { value: 'C', label: 'Nhóm C (Nhân viên/Phục vụ: 12 bậc, 24 tháng)' },
                        ],
                      },
                    ]}
                    emptyTitle="Chưa có dữ liệu ngạch bậc lương"
                    actions={(r): RowActionItem[] => [
                      {
                        label: 'Xem chi tiết các bậc hệ số',
                        icon: Eye,
                        onSelect: () => setSelectedRank(r),
                      },
                    ]}
                  />
                )}
                <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng TC-CB" rightTitle="Thủ trưởng đơn vị" />
              </>
            ) : (
              <>
                <PrintFrame
                  title="KHUNG THANG BẢNG LƯƠNG DOANH NGHIỆP THEO VỊ TRÍ VIỆC LÀM (BLLĐ 2019)"
                  subtitle="6 Khung Bậc Lương chuẩn hóa toàn hệ thống"
                />

                <DataTable
                  columns={enterpriseColumns}
                  rows={ENTERPRISE_SALARY_BANDS}
                  rowKey={(r) => r.bandCode}
                  exportFilename="thang-bang-luong-doanh-nghiep"
                  printLabel="In thang bảng lương doanh nghiệp"
                  searchFields={(r) => [r.bandCode, r.bandName, r.levelTitle, r.roles, r.criteria]}
                  emptyTitle="Chưa cấu hình thang bảng lương doanh nghiệp"
                  actions={(r): RowActionItem[] => [
                    {
                      label: 'Xem mô tả chi tiết & tiêu chuẩn',
                      icon: Eye,
                      onSelect: () => setSelectedBand(r),
                    },
                  ]}
                />
                <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Giám đốc Nhân sự (CHRO)" rightTitle="Tổng Giám Đốc" />
              </>
            )}
          </div>
        </>
      ) : (
        /* Tab Xét Nâng Bậc Lương */
        <>
          {/* KPI Cards Thống kê kết quả quét */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Tổng hồ sơ quét</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{qScan.data?.totalScanned || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Đã cấu hình ngạch bậc</div>
            </Card>
            <Card className="p-4 bg-emerald-50 border-emerald-200 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700 uppercase">Đủ điều kiện nâng bậc</div>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{qScan.data?.eligibleCount || 0}</div>
              <div className="text-xs text-emerald-600 mt-1">Đạt đủ 24/36 tháng giữ bậc</div>
            </Card>
            <Card className="p-4 bg-amber-50 border-amber-200 shadow-sm">
              <div className="text-xs font-semibold text-amber-700 uppercase">Quá hạn chưa duyệt</div>
              <div className="text-2xl font-bold text-amber-800 mt-1">{qScan.data?.overdueCount || 0}</div>
              <div className="text-xs text-amber-600 mt-1">Quá hạn &gt; 3 tháng</div>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-200 shadow-sm">
              <div className="text-xs font-semibold text-purple-700 uppercase">Kịch trần ngạch</div>
              <div className="text-2xl font-bold text-purple-800 mt-1">
                {allProgressionItems.filter((i) => i.currentStep >= i.totalSteps).length}
              </div>
              <div className="text-xs text-purple-600 mt-1">Hưởng thâm niên vượt khung</div>
            </Card>
          </div>

          <div className="print-area">
            <PrintFrame
              title="DANH SÁCH ĐỀ NGHỊ NÂNG BẬC LƯƠNG ĐỊNH KỲ"
              subtitle={`Quét ngày ${formatDate(new Date().toISOString())} — ${qScan.data?.eligibleCount || 0} trường hợp đủ điều kiện`}
            />

            {qScan.isError ? (
              <ErrorState message={errorMessage(qScan.error)} onRetry={() => qScan.refetch()} />
            ) : (
              <DataTable
                columns={progressionColumns}
                rows={allProgressionItems}
                rowKey={(r) => r.userId}
                loading={qScan.isLoading}
                exportFilename="danh-sach-de-nghi-nang-luong"
                printLabel="In danh sách nâng lương"
                searchFields={(r) => [r.fullName, r.employeeCode, r.rankName, r.jobTitle, r.orgUnitName]}
                filters={[
                  {
                    key: 'progression',
                    label: 'Trạng thái xét duyệt',
                    value: (r) => r.progressionType,
                    options: [
                      { value: 'STEP_PROMOTION', label: 'Đủ điều kiện nâng bậc liền kề' },
                      { value: 'OVER_GRADE_ALLOWANCE', label: 'Đạt thâm niên vượt khung' },
                      { value: 'NONE', label: 'Chưa đến hạn nâng bậc' },
                    ],
                  },
                ]}
                emptyTitle="Không có dữ liệu nâng bậc lương"
                actions={(r): RowActionItem[] => [
                  {
                    label: 'Phê duyệt nâng bậc / Vượt khung',
                    icon: CheckCircle2,
                    onSelect: () => setSelectedPerson(r),
                  },
                ]}
              />
            )}

            <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
          </div>
        </>
      )}

      {/* Modal Xem chi tiết ngạch lương Nhà nước */}
      {selectedRank && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedRank.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mã ngạch: <span className="font-mono font-semibold text-primary">{selectedRank.code}</span> • Nhóm: <span className="font-semibold">{selectedRank.groupCode}</span> • Lĩnh vực: <span className="font-semibold">{selectedRank.field || 'Hành chính'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRank(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Thời gian nâng bậc tiêu chuẩn: <span className="font-bold text-slate-900">{selectedRank.stepMonths} tháng</span> ({selectedRank.stepMonths / 12} năm/bậc).
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="p-2.5 text-center">Bậc lương</th>
                    {selectedRank.coefficients.map((_, idx) => (
                      <th key={idx} className="p-2.5 text-center">Bậc {idx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2.5 font-semibold text-slate-700 bg-slate-50 text-center">Hệ số</td>
                    {selectedRank.coefficients.map((coef, idx) => (
                      <td key={idx} className="p-2.5 text-center font-mono font-bold text-slate-900">
                        {coef.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-700 bg-slate-50 text-center">Mức lương (2.340.000đ)</td>
                    {selectedRank.coefficients.map((coef, idx) => (
                      <td key={idx} className="p-2.5 text-center font-mono text-[11px] text-emerald-700 font-medium">
                        {(coef * 2340000).toLocaleString('vi-VN')} đ
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedRank(null)}>Đóng</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Xem chi tiết Band Doanh nghiệp */}
      {selectedBand && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedBand.bandName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chức danh: <span className="font-semibold text-slate-800">{selectedBand.levelTitle}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedBand(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-slate-50 border">
              <div>
                <div className="text-[11px] text-muted-foreground">Min (Sàn)</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedBand.minSalary.toLocaleString('vi-VN')} đ</div>
              </div>
              <div className="border-x">
                <div className="text-[11px] text-emerald-700 font-semibold">Mid (Chuẩn)</div>
                <div className="text-xs font-bold text-emerald-700 mt-0.5">{selectedBand.midSalary.toLocaleString('vi-VN')} đ</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Max (Trần)</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedBand.maxSalary.toLocaleString('vi-VN')} đ</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Vị trí áp dụng điển hình:</span>
                <p className="text-slate-600 mt-0.5">{selectedBand.roles}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Tiêu chuẩn năng lực & đầu ra:</span>
                <p className="text-slate-600 mt-0.5">{selectedBand.criteria}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Chu kỳ rà soát điều chỉnh:</span>
                <p className="text-slate-600 mt-0.5">{selectedBand.reviewCycleMonths} tháng / lần</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedBand(null)}>Đóng</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Phê duyệt Nâng bậc Lương */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Phê duyệt Nâng bậc Lương</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nhân sự: <span className="font-semibold text-slate-800">{selectedPerson.fullName}</span> ({selectedPerson.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngạch lương:</span>
                <span className="font-bold text-slate-800">{selectedPerson.rankName} ({selectedPerson.rankCode})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bậc lương:</span>
                <span className="font-semibold">
                  Bậc {selectedPerson.currentStep} (HS {selectedPerson.currentCoefficient.toFixed(2)}) 
                  <span className="text-primary font-bold mx-1.5">➔</span> 
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Bậc {selectedPerson.nextStep} (HS {selectedPerson.nextCoefficient.toFixed(2)})
                  </span>
                </span>
              </div>
              {selectedPerson.progressionType === 'OVER_GRADE_ALLOWANCE' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phụ cấp thâm niên vượt khung:</span>
                  <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    {selectedPerson.suggestedOverGradePercent}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian đã giữ bậc:</span>
                <span className="font-semibold text-slate-700">{selectedPerson.monthsHeld} tháng / {selectedPerson.requiredMonths} tháng</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 mb-1 block">Số Quyết định nâng lương</label>
                <Input
                  value={approvalDecisionNo}
                  onChange={(e) => setApprovalDecisionNo(e.target.value)}
                  placeholder="Ví dụ: QĐ-NL/2026"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setSelectedPerson(null)}>
                Hủy
              </Button>
              <Button
                onClick={() =>
                  applyMutation.mutate({
                    userId: selectedPerson.userId,
                    nextStep: selectedPerson.nextStep,
                    nextCoefficient: selectedPerson.nextCoefficient,
                    overGradePercent: selectedPerson.suggestedOverGradePercent,
                    decisionNo: approvalDecisionNo,
                  })
                }
                disabled={applyMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {applyMutation.isPending ? 'Đang duyệt...' : 'Xác nhận Nâng bậc'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
