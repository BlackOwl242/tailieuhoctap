'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Eye, FileText, PencilLine, Plus, Sparkles, Users, Award, ShieldCheck,
  Building2, GraduationCap, Printer, ArrowRightLeft,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { EMPLOYMENT_STATUS_LABEL } from '@/lib/hr';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';
import { Button, Input, Label, Select } from '@/components/ui/primitives';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/lib/auth-store';
import { ComprehensivePersonnelModal } from '@/components/personnel/ComprehensivePersonnelModal';
import { ProfileChangeReviewQueue } from '@/components/personnel/ProfileChangeReviewQueue';
import { isEnterpriseSector, useOrgConfig } from '@/lib/org-config';

interface EmployeeRow {
  id: string;
  employeeCode: string | null;
  fullName: string;
  email: string;
  jobTitle: string | null;
  orgUnit?: { id: string; name: string } | null;
  hireDate: string | null;
  employmentStatus: keyof typeof EMPLOYMENT_STATUS_LABEL;
  baseSalary: number | null;
  taxResidency?: 'RESIDENT' | 'NON_RESIDENT';
  minimumWageRegion?: 'I' | 'II' | 'III' | 'IV';
  taxDependentCount?: number;
}

interface ComprehensiveProfileRow {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    employeeCode: string | null;
    jobTitle: string | null;
    hireDate: string | null;
    orgUnit?: { id: string; name: string; code: string } | null;
  };
  gender: string | null;
  rankCode: string | null;
  rank?: { name: string; groupCode: string; totalSteps: number } | null;
  salaryStep: number | null;
  salaryCoefficient: number | null;
  highestDegree: string | null;
  politicalTheory: string | null;
  ethnicity: string | null;
  idCardNo: string | null;
  govPosition: string | null;
}

/** UC09 — Quản lý Nhân sự & Hồ sơ Cán bộ công chức tập trung. */
export default function EmployeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orgConfig] = useOrgConfig();
  const enterpriseMode = isEnterpriseSector(orgConfig);
  const initialTab = searchParams.get('tab') === 'civil-servant' ? 'civil-servant' : searchParams.get('tab') === 'approvals' ? 'approvals' : 'standard';
  const [activeTab, setActiveTab] = useState<'standard' | 'civil-servant' | 'approvals'>(initialTab);

  useEffect(() => {
    if (enterpriseMode && activeTab === 'civil-servant') setActiveTab('standard');
  }, [enterpriseMode, activeTab]);

  const qc = useQueryClient();
  const toast = useToast();
  const viewerRoles = useAuthStore((s) => s.user?.roles ?? []);
  const canEditTaxProfile = viewerRoles.some((role) => ['ADMIN', 'KM_MANAGER'].includes(role));

  const qPendingApprovals = useQuery({
    queryKey: ['profile-change-requests-count'],
    queryFn: async () => {
      const res = await api.get('/profile-change-requests?status=PENDING&limit=1');
      return (res.data?.pendingCount ?? 0) as number;
    },
  });
  const pendingCount = qPendingApprovals.data ?? 0;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isComprehensiveOpen, setIsComprehensiveOpen] = useState(false);
  const [selectedEditUserId, setSelectedEditUserId] = useState<string | null>(null);
  const [taxEdit, setTaxEdit] = useState<{ userId: string; fullName: string; taxResidency: 'RESIDENT' | 'NON_RESIDENT'; minimumWageRegion: 'I' | 'II' | 'III' | 'IV'; taxDependentCount: number } | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Password@123',
    employeeCode: '',
    jobTitle: '',
    orgUnitId: '',
    employmentStatus: 'PROBATION',
    hireDate: new Date().toISOString().split('T')[0],
  });

  // Query Danh sách nhân sự Doanh nghiệp
  const qEmployees = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<EmployeeRow[]>('/employees')).data,
    enabled: activeTab === 'standard',
  });

  // Query Danh sách Hồ sơ Cán bộ Công chức (111 trường)
  const qProfiles = useQuery({
    queryKey: ['personnel-profiles'],
    queryFn: async () => {
      const res = await api.get('/personnel-profiles?limit=100');
      return (res.data.items || res.data) as ComprehensiveProfileRow[];
    },
    enabled: activeTab === 'civil-servant',
  });

  const orgUnitsQ = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => (await api.get<{ id: string; name: string; code: string }[]>('/org-units')).data,
  });
  const employeeRows = qEmployees.data ?? [];
  const employeesWithOrgUnit = employeeRows.filter((employee) => Boolean(employee.orgUnit?.id)).length;

  const createEmployee = useMutation({
    mutationFn: async () => {
      return api.post('/users', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        employeeCode: form.employeeCode || undefined,
        jobTitle: form.jobTitle || undefined,
        orgUnitId: form.orgUnitId || undefined,
        employmentStatus: form.employmentStatus,
        hireDate: form.hireDate || undefined,
        roleCodes: ['USER'],
      });
    },
    onSuccess: () => {
      toast('Đã tiếp nhận và tạo hồ sơ nhân sự mới thành công!', 'success');
      setIsCreateOpen(false);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        password: 'Password@123',
        employeeCode: '',
        jobTitle: '',
        orgUnitId: '',
        employmentStatus: 'PROBATION',
        hireDate: new Date().toISOString().split('T')[0],
      });
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['personnel-profiles'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const saveTaxProfile = useMutation({
    mutationFn: async () => api.patch(`/employees/${taxEdit!.userId}/profile`, {
      taxResidency: taxEdit!.taxResidency,
      minimumWageRegion: taxEdit!.minimumWageRegion,
      taxDependentCount: taxEdit!.taxDependentCount,
    }),
    onSuccess: () => {
      toast('Đã cập nhật thông tin tính thuế và bảo hiểm', 'success');
      setTaxEdit(null);
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Cột Danh sách chuẩn Doanh nghiệp
  const standardColumns: DataColumn<EmployeeRow>[] = [
    {
      key: 'employeeCode',
      header: 'Mã NV',
      sortable: true,
      className: 'w-[12%] text-center font-mono',
      render: (r) => (
        <span className="font-mono text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
          {r.employeeCode ?? 'Chưa cập nhật'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Họ và tên',
      sortable: true,
      className: 'w-[22%]',
      exportValue: (r) => r.fullName,
      render: (r) => (
        <>
          <span className="font-semibold text-foreground hidden print:inline">{r.fullName}</span>
          <Link href={`/employees/${r.id}`} className="font-semibold text-primary hover:underline block no-print">
            {r.fullName}
          </Link>
          <span className="text-xs text-muted-foreground block no-print">{r.email}</span>
        </>
      ),
    },
    { key: 'jobTitle', header: 'Chức danh', sortable: true, className: 'w-[20%]', render: (r) => r.jobTitle ?? 'Chưa cập nhật' },
    { key: 'orgUnit', header: 'Đơn vị công tác', className: 'w-[20%]', render: (r) => r.orgUnit?.name ?? 'Chưa cập nhật', exportValue: (r) => r.orgUnit?.name ?? '' },
    { key: 'hireDate', header: 'Ngày vào', sortable: true, className: 'w-[13%] text-center', render: (r) => (r.hireDate ? formatDate(r.hireDate) : 'Chưa cập nhật'), exportValue: (r) => (r.hireDate ? formatDate(r.hireDate) : '') },
    {
      key: 'employmentStatus',
      header: 'Trạng thái',
      sortable: true,
      className: 'w-[13%]',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              r.employmentStatus === 'ACTIVE'
                ? 'bg-emerald-600'
                : r.employmentStatus === 'PROBATION'
                ? 'bg-amber-600'
                : 'bg-slate-400'
            }`}
          />
          {EMPLOYMENT_STATUS_LABEL[r.employmentStatus] ?? r.employmentStatus}
        </span>
      ),
      exportValue: (r) => EMPLOYMENT_STATUS_LABEL[r.employmentStatus] ?? r.employmentStatus,
    },
  ];

  // Cột Hồ sơ Cán bộ Công chức (Mẫu 2C)
  const civilServantColumns: DataColumn<ComprehensiveProfileRow>[] = [
    {
      key: 'employeeCode',
      header: 'Mã cán bộ',
      sortable: true,
      className: 'w-[10%] text-center',
      exportValue: (r) => r.user.employeeCode || '',
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {r.user.employeeCode || 'Chưa cập nhật'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Họ và tên',
      sortable: true,
      className: 'w-[18%]',
      exportValue: (r) => r.user.fullName,
      render: (r) => (
        <div>
          <span className="font-semibold text-foreground hidden print:inline">{r.user.fullName}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedEditUserId(r.userId);
              setIsComprehensiveOpen(true);
            }}
            className="font-semibold text-primary hover:underline text-left block no-print"
          >
            {r.user.fullName}
          </button>
          <span className="text-xs text-muted-foreground block no-print">{r.user.email}</span>
        </div>
      ),
    },
    {
      key: 'orgUnit',
      header: 'Đơn vị / Phòng ban',
      sortable: true,
      className: 'w-[18%]',
      exportValue: (r) => r.user.orgUnit?.name || 'Chưa cập nhật',
      render: (r) => r.user.orgUnit?.name || 'Chưa cập nhật',
    },
    {
      key: 'govPosition',
      header: 'Chức danh / Vị trí',
      className: 'w-[17%]',
      exportValue: (r) => r.govPosition || r.user.jobTitle || 'Chưa cập nhật',
      render: (r) => r.govPosition || r.user.jobTitle || 'Chưa cập nhật',
    },
    {
      key: 'rank',
      header: 'Ngạch bậc lương',
      className: 'w-[13%]',
      exportValue: (r) => (r.rank ? `${r.rank.name} (Bậc ${r.salaryStep}/${r.rank.totalSteps})` : 'Theo hợp đồng'),
      render: (r) =>
        r.rank ? (
          <div>
            <div className="font-semibold text-foreground text-xs">
              {r.rank.name}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5 no-print">
              Bậc {r.salaryStep}/{r.rank.totalSteps} (HS: {r.salaryCoefficient})
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Theo hợp đồng</span>
        ),
    },
    {
      key: 'highestDegree',
      header: 'Trình độ chuyên môn',
      className: 'w-[12%]',
      exportValue: (r) => r.highestDegree || 'Chưa cập nhật',
      render: (r) => r.highestDegree || 'Chưa cập nhật',
    },
    {
      key: 'politicalTheory',
      header: 'Lý luận chính trị',
      className: 'w-[12%] text-center',
      exportValue: (r) => r.politicalTheory || 'Không',
      render: (r) => (
        <span className="text-xs text-foreground">
          {r.politicalTheory || 'Chưa cập nhật'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Hồ sơ nhân sự"
        description={enterpriseMode
          ? 'Quản lý danh bạ nhân sự doanh nghiệp. Hồ sơ 2C khu vực công được ẩn trong chế độ này.'
          : 'Danh bạ là danh sách nhân sự gốc; hồ sơ 2C là phần thông tin công vụ bổ sung cho người đã khai báo, không phải một danh sách nhân viên khác.'}
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Hồ sơ nhân sự' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 shadow-2xs"
            >
              <Plus className="h-4 w-4" /> Tiếp nhận nhanh
            </Button>
            {!enterpriseMode ? (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedEditUserId(null);
                  setIsComprehensiveOpen(true);
                }}
                className="gap-1.5 shadow-2xs font-bold"
              >
                <FileText className="h-4 w-4 text-primary-foreground" /> Khai báo hồ sơ 2C (111 trường)
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Danh bạ là hồ sơ nhân sự gốc; hồ sơ 2C là phần bổ sung chỉ có ở khu vực công. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('standard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'standard'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          {enterpriseMode ? 'Danh bạ Nhân sự' : 'Danh bạ Nhân sự (toàn bộ)'}
          {qEmployees.data ? <span className="font-normal">({qEmployees.data.length})</span> : null}
        </button>

        {!enterpriseMode ? (
          <button
            onClick={() => setActiveTab('civil-servant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'civil-servant'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Hồ sơ công chức / viên chức 2C (bổ sung)
            {qProfiles.data ? <span className="font-normal">({qProfiles.data.length})</span> : null}
          </button>
        ) : null}

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
          Xét duyệt Hồ sơ Cá nhân
          {pendingCount > 0 && <span className="font-normal">({pendingCount} chờ duyệt)</span>}
        </button>
      </div>

      {activeTab === 'standard' && qEmployees.data ? (
        <p className="text-xs text-muted-foreground">
          {employeeRows.length} hồ sơ trong danh bạ · {employeesWithOrgUnit} đã gán đơn vị · {employeeRows.length - employeesWithOrgUnit} chưa gán đơn vị.
        </p>
      ) : null}

      <div className="print-area">
        {activeTab === 'standard' ? (
          <>
            <PrintFrame title="DANH SÁCH NHÂN SỰ" subtitle={`Tổng cộng ${qEmployees.data?.length ?? 0} nhân viên`} />
            {qEmployees.isError ? (
              <ErrorState message={errorMessage(qEmployees.error)} onRetry={() => qEmployees.refetch()} />
            ) : (
              <DataTable
                columns={standardColumns}
                rows={qEmployees.data ?? []}
                rowKey={(r) => r.id}
                loading={qEmployees.isLoading}
                exportFilename="danh-sach-nhan-su"
                printLabel="In danh sách"
                searchFields={(r) => [r.fullName, r.email, r.employeeCode ?? '', r.jobTitle ?? '', r.orgUnit?.name ?? '']}
                filters={[
                  {
                    key: 'status', label: 'Trạng thái',
                    value: (r) => r.employmentStatus,
                    options: Object.entries(EMPLOYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
                  },
                  {
                    key: 'orgUnitId', label: 'Đơn vị',
                    value: (r) => r.orgUnit?.id ?? 'UNASSIGNED',
                    options: [
                      ...((orgUnitsQ.data ?? []).map((unit: { id: string; name: string }) => ({ value: unit.id, label: unit.name }))),
                      { value: 'UNASSIGNED', label: 'Chưa gán đơn vị' },
                    ],
                  },
                ]}
                emptyTitle="Chưa có hồ sơ nhân sự"
                actions={(r): RowActionItem[] => [
                  {
                    label: 'Xem chi tiết & Hợp đồng',
                    icon: Eye,
                    onSelect: () => router.push(`/employees/${r.id}`),
                  },
                  ...(!enterpriseMode ? [{
                    label: 'Khai báo hồ sơ chuyên sâu (2C)',
                    icon: FileText,
                    onSelect: () => {
                      setSelectedEditUserId(r.id);
                      setIsComprehensiveOpen(true);
                    },
                  }] : []),
                  ...(canEditTaxProfile ? [{
                    label: 'Cập nhật cư trú thuế, vùng lương tối thiểu và người phụ thuộc',
                    icon: PencilLine,
                    onSelect: () => setTaxEdit({
                      userId: r.id,
                      fullName: r.fullName,
                      taxResidency: r.taxResidency ?? 'RESIDENT',
                      minimumWageRegion: r.minimumWageRegion ?? 'I',
                      taxDependentCount: r.taxDependentCount ?? 0,
                    }),
                  }] : []),
                  {
                    label: enterpriseMode ? 'In hồ sơ nhân sự' : 'Xem Sơ yếu lý lịch (bìa + 4 trang)',
                    icon: Printer,
                    onSelect: () => router.push(`/personnel-reports?userId=${r.id}`),
                  },
                  {
                    label: 'Ban hành quyết định (Thuyên chuyển, Bãi nhiệm, Thôi việc...)',
                    icon: ArrowRightLeft,
                    onSelect: () => router.push(`/personnel?createFor=${r.id}`),
                  },
                ]}
              />
            )}
            <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
          </>
        ) : activeTab === 'civil-servant' ? (
          <>
            <PrintFrame
              title="DANH SÁCH HỒ SƠ NHÂN SỰ TOÀN DIỆN (MẪU 2C-BNV)"
              subtitle={`Tổng số ${qProfiles.data?.length || 0} hồ sơ chuẩn hóa`}
            />
            {qProfiles.isError ? (
              <ErrorState message={errorMessage(qProfiles.error)} onRetry={() => qProfiles.refetch()} />
            ) : (
              <DataTable
                columns={civilServantColumns}
                rows={qProfiles.data || []}
                rowKey={(r) => r.id}
                loading={qProfiles.isLoading}
                exportFilename="ho-so-nhan-su-toan-dien"
                printLabel="In danh sách cán bộ"
                searchFields={(r) => [
                  r.user.fullName,
                  r.user.email,
                  r.user.employeeCode || '',
                  r.govPosition || '',
                  r.user.orgUnit?.name || '',
                  r.rank?.name || '',
                  r.highestDegree || '',
                ]}
                filters={[
                  {
                    key: 'orgUnitId',
                    label: 'Đơn vị',
                    value: (r) => r.user.orgUnit?.id ?? 'UNASSIGNED',
                    options: [
                      ...((orgUnitsQ.data ?? []).map((unit: { id: string; name: string }) => ({ value: unit.id, label: unit.name }))),
                      { value: 'UNASSIGNED', label: 'Chưa gán đơn vị' },
                    ],
                  },
                  {
                    key: 'groupCode',
                    label: 'Nhóm ngạch',
                    value: (r) => r.rank?.groupCode || 'Khác',
                    options: [
                      { value: 'A3', label: 'Nhóm A3 (Cao cấp)' },
                      { value: 'A2', label: 'Nhóm A2 (Chính)' },
                      { value: 'A1', label: 'Nhóm A1 (Chuyên viên/Kỹ sư)' },
                      { value: 'B', label: 'Nhóm B (Cán sự)' },
                      { value: 'C', label: 'Nhóm C (Nhân viên)' },
                      { value: 'Khác', label: 'Khác / HĐLĐ' },
                    ],
                  },
                ]}
                emptyTitle="Chưa có hồ sơ nhân sự toàn diện"
                actions={(r): RowActionItem[] => [
                  {
                    label: 'Khai báo & Chỉnh sửa hồ sơ chi tiết (2C)',
                    icon: PencilLine,
                    onSelect: () => {
                      setSelectedEditUserId(r.userId);
                      setIsComprehensiveOpen(true);
                    },
                  },
                  {
                    label: 'Xem Sơ yếu lý lịch 4 trang',
                    icon: Eye,
                    onSelect: () => router.push(`/personnel-reports?userId=${r.userId}`),
                  },
                  {
                    label: 'Hồ sơ chi tiết hợp đồng',
                    icon: Eye,
                    onSelect: () => router.push(`/employees/${r.userId}`),
                  },
                  {
                    label: 'Ban hành quyết định (Thuyên chuyển, Bãi nhiệm, Thôi việc...)',
                    icon: ArrowRightLeft,
                    onSelect: () => router.push(`/personnel?createFor=${r.userId}`),
                  },
                ]}
              />
            )}
            <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Cán bộ" rightTitle="Thủ trưởng đơn vị" />
          </>
        ) : (
          <div className="no-print">
            <ProfileChangeReviewQueue />
          </div>
        )}
      </div>

      {/* Modal Tiếp nhận nhanh nhân sự */}
      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Tiếp nhận nhân sự mới"
        description="Dùng để nhập hồ sơ nhân sự hiện có. Nhân sự mới tuyển phải đi qua phiếu tuyển, phỏng vấn, đề nghị tuyển dụng và offer đã duyệt. Lương được ghi nhận từ hợp đồng đã ký."
      >
        <div className="space-y-4 py-2">
          <p className="rounded-lg bg-muted p-3 text-sm">Với nhân sự mới tuyển, hãy hoàn tất quy trình tại mục <b>Tuyển dụng</b> rồi dùng chức năng chuyển ứng viên trúng tuyển thành hồ sơ nhân viên. Màn này chỉ dành cho nhập hồ sơ có sẵn hoặc cấp tài khoản nội bộ.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Họ và tên *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <Label>Mã nhân viên</Label>
              <Input
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                placeholder="NV-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email cơ quan *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="a.nguyen@congty.vn"
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phòng ban / Đơn vị</Label>
              <Select
                value={form.orgUnitId}
                onChange={(e) => setForm({ ...form, orgUnitId: e.target.value })}
              >
                <option value="">-- Chọn đơn vị --</option>
                {orgUnitsQ.data?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Chức danh công việc</Label>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                placeholder="Chuyên viên phát triển phần mềm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hình thức làm việc</Label>
              <Select
                value={form.employmentStatus}
                onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
              >
                <option value="PROBATION">Thử việc</option>
                <option value="ACTIVE">Chính thức</option>
              </Select>
            </div>
            <div>
              <Label>Ngày vào làm</Label>
              <Input
                type="date"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <ModalFooterActions
              onCancel={() => setIsCreateOpen(false)}
              onConfirm={() => createEmployee.mutate()}
              pending={createEmployee.isPending}
              confirmLabel="Hoàn tất tiếp nhận"
            />
          </div>
        </div>
      </Modal>

      <Modal open={!!taxEdit} onOpenChange={(open) => !open && setTaxEdit(null)} title="Thông tin khấu trừ và bảo hiểm" description={taxEdit?.fullName}>
        {taxEdit ? <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Nhập theo hồ sơ cư trú, nơi làm việc và giấy tờ người phụ thuộc đã được xác minh. Thông tin này được dùng trong lần tính lương tiếp theo.</p>
          <div className="space-y-1.5"><Label>Tình trạng cư trú thuế</Label><Select value={taxEdit.taxResidency} onChange={(e) => setTaxEdit({ ...taxEdit, taxResidency: e.target.value as 'RESIDENT' | 'NON_RESIDENT' })}><option value="RESIDENT">Cá nhân cư trú</option><option value="NON_RESIDENT">Cá nhân không cư trú</option></Select></div>
          <div className="space-y-1.5"><Label>Vùng lương tối thiểu tại nơi làm việc</Label><Select value={taxEdit.minimumWageRegion} onChange={(e) => setTaxEdit({ ...taxEdit, minimumWageRegion: e.target.value as 'I' | 'II' | 'III' | 'IV' })}><option value="I">Vùng I</option><option value="II">Vùng II</option><option value="III">Vùng III</option><option value="IV">Vùng IV</option></Select></div>
          <div className="space-y-1.5"><Label>Số người phụ thuộc đủ điều kiện</Label><Input type="number" min={0} max={20} value={taxEdit.taxDependentCount} onChange={(e) => setTaxEdit({ ...taxEdit, taxDependentCount: Number(e.target.value) })} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTaxEdit(null)}>Hủy</Button><Button onClick={() => saveTaxProfile.mutate()} disabled={saveTaxProfile.isPending}>Lưu thông tin</Button></div>
        </div> : null}
      </Modal>

      {/* Modal Khai báo hồ sơ chuyên sâu Mẫu 2C-BNV */}
      <ComprehensivePersonnelModal
        isOpen={isComprehensiveOpen}
        onClose={() => {
          setIsComprehensiveOpen(false);
          setSelectedEditUserId(null);
        }}
        userId={selectedEditUserId}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['employees'] });
          qc.invalidateQueries({ queryKey: ['personnel-profiles'] });
        }}
      />
    </div>
  );
}
