'use client';

import { useState } from 'react';
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
import { ComprehensivePersonnelModal } from '@/components/personnel/ComprehensivePersonnelModal';
import { ProfileChangeReviewQueue } from '@/components/personnel/ProfileChangeReviewQueue';

interface EmployeeRow {
  id: string;
  employeeCode: string | null;
  fullName: string;
  email: string;
  jobTitle: string | null;
  orgUnit?: { name: string } | null;
  hireDate: string | null;
  employmentStatus: keyof typeof EMPLOYMENT_STATUS_LABEL;
  baseSalary: number | null;
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
    orgUnit?: { name: string; code: string } | null;
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
  const initialTab = searchParams.get('tab') === 'civil-servant' ? 'civil-servant' : searchParams.get('tab') === 'approvals' ? 'approvals' : 'standard';
  const [activeTab, setActiveTab] = useState<'standard' | 'civil-servant' | 'approvals'>(initialTab);

  const qc = useQueryClient();
  const toast = useToast();

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

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Password@123',
    employeeCode: '',
    jobTitle: '',
    orgUnitId: '',
    employmentStatus: 'PROBATION',
    baseSalary: 12000000,
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
        baseSalary: Number(form.baseSalary) || undefined,
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
        baseSalary: 12000000,
        hireDate: new Date().toISOString().split('T')[0],
      });
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['personnel-profiles'] });
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
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {r.employeeCode ?? '—'}
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
    { key: 'jobTitle', header: 'Chức danh', sortable: true, className: 'w-[20%]', render: (r) => r.jobTitle ?? '—' },
    { key: 'orgUnit', header: 'Đơn vị công tác', className: 'w-[20%]', render: (r) => r.orgUnit?.name ?? '—', exportValue: (r) => r.orgUnit?.name ?? '' },
    { key: 'hireDate', header: 'Ngày vào', sortable: true, className: 'w-[13%] text-center', render: (r) => (r.hireDate ? formatDate(r.hireDate) : '—'), exportValue: (r) => (r.hireDate ? formatDate(r.hireDate) : '') },
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
          {r.user.employeeCode || '—'}
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
      exportValue: (r) => r.user.orgUnit?.name || '—',
      render: (r) => r.user.orgUnit?.name || '—',
    },
    {
      key: 'govPosition',
      header: 'Chức danh / Vị trí',
      className: 'w-[17%]',
      exportValue: (r) => r.govPosition || r.user.jobTitle || '—',
      render: (r) => r.govPosition || r.user.jobTitle || '—',
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
      exportValue: (r) => r.highestDegree || '—',
      render: (r) => r.highestDegree || '—',
    },
    {
      key: 'politicalTheory',
      header: 'Lý luận chính trị',
      className: 'w-[12%] text-center',
      exportValue: (r) => r.politicalTheory || 'Không',
      render: (r) => (
        <span className="text-xs text-foreground">
          {r.politicalTheory || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Danh sách & Hồ sơ Nhân sự"
        description="Quản lý toàn diện danh bạ nhân sự doanh nghiệp và hồ sơ lý lịch cán bộ, công chức, viên chức chuẩn Mẫu 2C-BNV."
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
          </div>
        }
      />

      {/* Chế độ xem: Danh sách Doanh nghiệp vs Hồ sơ Cán bộ Nhà nước */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setActiveTab('standard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'standard'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Danh sách Nhân sự (Chuẩn Doanh nghiệp)
          {qEmployees.data ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-foreground text-[10px]">
              {qEmployees.data.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('civil-servant')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'civil-servant'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Hồ sơ Cán bộ, Công chức, Viên chức (Mẫu 2C-BNV)
          {qProfiles.data ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-foreground text-[10px]">
              {qProfiles.data.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
          Xét duyệt Hồ sơ Cá nhân
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

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
                ]}
                emptyTitle="Chưa có hồ sơ nhân sự"
                actions={(r): RowActionItem[] => [
                  {
                    label: 'Xem chi tiết & Hợp đồng',
                    icon: Eye,
                    onSelect: () => router.push(`/employees/${r.id}`),
                  },
                  {
                    label: 'Khai báo hồ sơ chuyên sâu (2C)',
                    icon: FileText,
                    onSelect: () => {
                      setSelectedEditUserId(r.id);
                      setIsComprehensiveOpen(true);
                    },
                  },
                  {
                    label: 'Xem Sơ yếu lý lịch 4 trang',
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
        description="Khởi tạo tài khoản và hồ sơ nhân sự cơ bản vào hệ thống."
      >
        <div className="space-y-4 py-2">
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

          <div className="grid grid-cols-3 gap-3">
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
              <Label>Lương cơ bản (VNĐ)</Label>
              <Input
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
              />
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
