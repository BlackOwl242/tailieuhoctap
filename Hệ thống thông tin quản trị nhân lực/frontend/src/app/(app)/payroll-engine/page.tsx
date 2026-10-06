'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calculator, Plus, Trash2, Edit3, Eye, Printer, FileText, Download,
  BookOpen, ShieldCheck, Percent, Clock, Award, Info, CheckCircle2, ChevronRight,
  Layers, Sliders, FileSpreadsheet, Sparkles, ArrowRight, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { EmptyState, LoadingState } from '@/components/common/states';
import { Button, Select } from '@/components/ui/primitives';
import { DataTable, DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';
import { printDocumentElement } from '@/components/ui/print';
import { useOrgConfig } from '@/lib/org-config';

interface SalaryComponent {
  id: string;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  isTaxApplicable: boolean;
  isInsuranceApplicable: boolean;
  isOvertimeApplicable: boolean;
  isFormulaBased: boolean;
  formula?: string;
  defaultAmount: number;
  description?: string;
}

interface SalaryStructure {
  id: string;
  name: string;
  payrollFrequency: string;
  description?: string;
  items: { id: string; amount: number; formula?: string; component: SalaryComponent }[];
  _count?: { assignments: number };
}

interface PayrollAssignmentTarget {
  id: string;
  fullName: string;
  employeeCode: string | null;
  jobTitle: string | null;
  baseSalary: number | null;
  orgUnit?: { id: string; name: string } | null;
  currentStructureName: string | null;
  hasPayrollBasis: boolean;
}

interface PayrollSlip {
  id: string;
  userId?: string;
  bankAccount?: string;
  bankName?: string;
  employeeName: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  workingDays?: number;
  actualWorkDays?: number;
  baseSalary: number;
  grossPay: number;
  totalDeduction: number;
  netPay: number;
  breakdown?: {
    calculation?: {
      personalRelief: number; dependentRelief: number; taxableIncome: number; year: number; paidDays: number; standardDays: number;
      minimumWageReview?: { region: string; contractualMonthlyWage: number; standardHours: number; monthlyMinimum: number | null; hourlyEquivalent: number; hourlyMinimum: number | null; monthlyBelowMinimum: boolean; hourlyBelowMinimum: boolean; status: 'PASS' | 'REVIEW' | 'UNCONFIGURED' };
      overtimeBasis?: { contractualMonthlyWage: number; standardHours: number; hourlyRate: number };
    };
    earnings?: { name: string; amount: number }[];
    deductions?: { name: string; amount: number }[];
  };
  status: string;
}

interface PayrollRun {
  id: string;
  periodName: string;
  fromDate: string;
  toDate: string;
  status: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeduction: number;
  totalNetPay: number;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
  slips?: PayrollSlip[];
}

export default function PayrollEnginePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.roles ?? [];
  const canConfigurePayroll = userRoles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB'].includes(role));
  const canProcessPayroll = userRoles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB'].includes(role));
  const canDeletePayrollRun = userRoles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB'].includes(role));
  const queryClient = useQueryClient();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [orgConfig] = useOrgConfig();

  const [activeTab, setActiveTab] = useState<'runs' | 'components' | 'structures'>('runs');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [payslipViewMode, setPayslipViewMode] = useState<'summary' | 'formula'>('summary');

  // Lắng nghe URL query parameter ?tab=regulations -> Chuyển hướng sang trang độc lập /regulations
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'regulations') {
      router.replace('/regulations');
    } else if (tabParam === 'components' || tabParam === 'structures' || tabParam === 'runs') {
      setActiveTab(tabParam);
    }
  }, [searchParams, router]);

  // Modals state
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignOrgUnitFilter, setAssignOrgUnitFilter] = useState('ALL');
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [newStructureName, setNewStructureName] = useState('');
  const [newStructureDescription, setNewStructureDescription] = useState('');
  const [newStructureItems, setNewStructureItems] = useState<Record<string, number>>({});

  // Form xử lý bảng lương
  const now = new Date();
  const curMonth = String(now.getMonth() + 1).padStart(2, '0');
  const curYear = now.getFullYear();
  const [periodName, setPeriodName] = useState(`Bảng Lương Tháng ${curMonth}/${curYear}`);
  const [fromDate, setFromDate] = useState(`${curYear}-${curMonth}-01`);
  const lastDay = new Date(curYear, now.getMonth() + 1, 0).getDate();
  const [toDate, setToDate] = useState(`${curYear}-${curMonth}-${lastDay}`);

  // Form thành phần lương
  const [compCode, setCompCode] = useState('');
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');
  const [compAmount, setCompAmount] = useState(1000000);
  const [compDesc, setCompDesc] = useState('');
  const [compTax, setCompTax] = useState(true);
  const [compInsurance, setCompInsurance] = useState(false);
  const [compOvertime, setCompOvertime] = useState(false);

  // Data Queries
  const { data: runs = [], isLoading: isLoadingRuns } = useQuery<PayrollRun[]>({
    queryKey: ['hrms-payroll-runs'],
    queryFn: async () => (await api.get('/hrms/payroll/runs')).data,
  });

  const { data: components = [], isLoading: isLoadingComps } = useQuery<SalaryComponent[]>({
    queryKey: ['hrms-salary-components'],
    queryFn: async () => (await api.get('/hrms/payroll/components')).data,
  });

  const { data: structures = [], isLoading: isLoadingStructs } = useQuery<SalaryStructure[]>({
    queryKey: ['hrms-salary-structures'],
    queryFn: async () => (await api.get('/hrms/payroll/structures')).data,
  });

  const { data: assignmentTargets = [] } = useQuery<PayrollAssignmentTarget[]>({
    queryKey: ['payroll-structure-assignment-targets'],
    queryFn: async () => (await api.get('/hrms/payroll/assignment-targets')).data,
    enabled: canConfigurePayroll,
  });

  const currentRun = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    if (selectedRunId) {
      return runs.find((r) => r.id === selectedRunId) || runs[0];
    }
    return runs[0];
  }, [runs, selectedRunId]);

  // Mutations
  const createRunMutation = useMutation({
    mutationFn: async (payload: { periodName: string; fromDate: string; toDate: string }) => {
      return (await api.post('/hrms/payroll/runs', {
        periodName: payload.periodName,
        fromDate: new Date(payload.fromDate).toISOString(),
        toDate: new Date(payload.toDate).toISOString(),
      })).data;
    },
    onSuccess: (data: PayrollRun) => {
      queryClient.invalidateQueries({ queryKey: ['hrms-payroll-runs'] });
      setIsProcessModalOpen(false);
      setSelectedRunId(data.id);
      toast(`Đã xử lý bảng lương ${data.periodName}`, 'success');
    },
    onError: () => toast('Lỗi khi xử lý bảng lương', 'error'),
  });

  const deleteRunMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/payroll/runs/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-payroll-runs'] });
      setSelectedRunId(null);
      toast('Đã xóa bảng lương', 'success');
    },
    onError: () => toast('Không thể xóa bảng lương', 'error'),
  });

  const createCompMutation = useMutation({
    mutationFn: async (payload: {
      code: string;
      name: string;
      type: 'EARNING' | 'DEDUCTION';
      defaultAmount: number;
      description?: string;
      isTaxApplicable?: boolean;
      isInsuranceApplicable?: boolean;
      isOvertimeApplicable?: boolean;
    }) => {
      return (await api.post('/hrms/payroll/components', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-components'] });
      setIsComponentModalOpen(false);
      resetComponentForm();
      toast('Đã thêm thành phần lương', 'success');
    },
    onError: () => toast('Lỗi khi thêm thành phần lương', 'error'),
  });

  const updateCompMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SalaryComponent> }) => {
      return (await api.patch(`/hrms/payroll/components/${id}`, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-components'] });
      setEditingComponent(null);
      resetComponentForm();
      toast('Đã cập nhật thành phần lương', 'success');
    },
    onError: () => toast('Lỗi khi cập nhật thành phần lương', 'error'),
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/payroll/components/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-components'] });
      toast('Đã xóa thành phần lương', 'success');
    },
    onError: () => toast('Không thể xóa thành phần lương này', 'error'),
  });

  const createStructureMutation = useMutation({
    mutationFn: async () => (await api.post('/hrms/payroll/structures', {
      name: newStructureName.trim(),
      description: newStructureDescription.trim() || undefined,
      payrollFrequency: 'MONTHLY',
      items: Object.entries(newStructureItems).map(([componentId, amount]) => ({ componentId, amount })),
    })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-structures'] });
      setIsStructureModalOpen(false);
      setNewStructureName('');
      setNewStructureDescription('');
      setNewStructureItems({});
      toast('Đã tạo cấu trúc lương', 'success');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const assignStructureMutation = useMutation({
    mutationFn: async (payload: { structureId: string; userId: string }) => {
      return (await api.post(`/hrms/payroll/structures/${payload.structureId}/assign`, {
        userId: payload.userId,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-structures'] });
      setIsAssignModalOpen(false);
      toast('Đã gán cấu trúc lương cho nhân sự', 'success');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const resetComponentForm = () => {
    setCompCode('');
    setCompName('');
    setCompType('EARNING');
    setCompAmount(1000000);
    setCompDesc('');
    setCompTax(true);
    setCompInsurance(false);
    setCompOvertime(false);
  };

  const openEditComponentModal = (c: SalaryComponent) => {
    setEditingComponent(c);
    setCompCode(c.code);
    setCompName(c.name);
    setCompType(c.type);
    setCompAmount(c.defaultAmount);
    setCompDesc(c.description || '');
    setCompTax(c.isTaxApplicable);
    setCompInsurance(c.isInsuranceApplicable ?? false);
    setCompOvertime(c.isOvertimeApplicable ?? false);
  };

  const transitionMutation = useMutation({
    mutationFn: async ({ id, action, payment }: { id: string; action: string; payment?: { paymentMethod: string; paymentReference: string } }) => (await api.post(`/hrms/payroll/runs/${id}/${action}`, payment)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hrms-payroll-runs'] }); toast('Đã cập nhật trạng thái kỳ lương', 'success'); },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  if (isLoadingRuns || isLoadingComps || isLoadingStructs) {
    return <LoadingState text="Đang tải dữ liệu..." />;
  }

  // Columns for Slips DataTable (Minimalist, subtle typography)
  const slipColumns: DataColumn<PayrollSlip>[] = [
    {
      key: 'employeeCode',
      header: 'Mã NV',
      sortable: true,
      render: (s: PayrollSlip) => <span className="font-mono text-xs text-muted-foreground">{s.employeeCode || 'NV'}</span>,
    },
    {
      key: 'employeeName',
      header: 'Nhân sự',
      sortable: true,
      render: (s: PayrollSlip) => (
        <div>
          <span className="font-medium text-xs text-foreground">{s.employeeName}</span>
          <p className="text-xs text-muted-foreground">{s.jobTitle || 'Chuyên viên'}</p>
          {s.breakdown?.calculation?.minimumWageReview?.status === 'REVIEW' && <p className="text-[10px] text-amber-600">Cần rà soát mức lương tối thiểu</p>}
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Phòng ban',
      sortable: true,
      render: (s: PayrollSlip) => <span className="text-xs text-muted-foreground">{s.department || 'Ban Tổ chức'}</span>,
    },
    {
      key: 'actualWorkDays',
      header: 'Ngày công',
      sortable: true,
      render: (s: PayrollSlip) => {
        const actual = s.actualWorkDays ?? 22;
        const standard = s.workingDays ?? 22;
        const isFull = actual >= standard;
        return (
          <div className="text-xs">
            <span className={`font-mono font-medium ${isFull ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {actual}/{standard} công
            </span>
            {!isFull && (
              <span className="block text-[10px] text-rose-500 font-mono">
                Thiếu {standard - actual} ngày
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'baseSalary',
      header: 'Lương cơ bản',
      sortable: true,
      render: (s: PayrollSlip) => (
        <span className="text-xs font-mono text-foreground">
          {s.baseSalary.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'grossPay',
      header: 'Tổng thu nhập gộp',
      sortable: true,
      render: (s: PayrollSlip) => (
        <span className="text-xs font-mono text-foreground">
          {s.grossPay.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'totalDeduction',
      header: 'Khấu trừ',
      sortable: true,
      render: (s: PayrollSlip) => (
        <span className="text-xs font-mono text-muted-foreground">
          -{s.totalDeduction.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'netPay',
      header: 'Thực lĩnh',
      sortable: true,
      render: (s: PayrollSlip) => (
        <span className="text-xs font-mono font-semibold text-foreground">
          {s.netPay.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (s: PayrollSlip) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {s.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s: PayrollSlip) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedSlip(s);
            setIsPayslipModalOpen(true);
          }}
          className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
        >
          Xem phiếu
        </Button>
      ),
    },
  ];



  const exportBankCsv = (run: PayrollRun) => {
    if (!['LOCKED', 'PAID'].includes(run.status)) { toast('Chỉ xuất kỳ đã khóa', 'error'); return; }
    if (run.slips?.some(slip => !slip.bankAccount || !slip.bankName)) { toast('Cần bổ sung tài khoản ngân hàng đã xác minh cho mọi nhân viên trước khi xuất', 'error'); return; }
    const escapeCsv = (value: unknown) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
    const csvContent =
      'STT,Ma_NV,Ho_Va_Ten,So_Tai_Khoan,Ngan_Hang,So_Tien_Thuc_Linh,Noi_Dung_Chuyen_Khoan\n' +
      (run.slips || []).map((s, idx) =>
        [idx + 1, s.employeeCode, s.employeeName, s.bankAccount, s.bankName, s.netPay, `Chi tra luong ${run.periodName}`].map(escapeCsv).join(',')
      ).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_Ke_Chi_Luong_${run.periodName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Đã xuất file bảng kê chi lương ngân hàng CSV', 'success');
  };

  return (
    <div className="space-y-5 pb-12">
      <WorkspaceHeader
        title="Bảng lương"
        description="Tính toán bảng lương chu kỳ, khấu trừ bảo hiểm thuế và lập phiếu lương nhân sự."
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Bảng lương' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/regulations">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Sổ tay Quy ước C&amp;B
              </Button>
            </Link>
            <Link href="/payroll-guide">
              <Button variant="outline" size="sm" className="text-xs h-8">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Cách tính lương
              </Button>
            </Link>
            {canConfigurePayroll && <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetComponentForm();
                setIsComponentModalOpen(true);
              }}
              className="text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Thành phần lương
            </Button>}
            {canProcessPayroll && <Button
              size="sm"
              onClick={() => setIsProcessModalOpen(true)}
              className="text-xs h-8"
            >
              <Calculator className="h-3.5 w-3.5 mr-1" />
              Tính bảng lương
            </Button>}
          </div>
        }
      />

      {/* Navigation Tabs (Đồng bộ chuẩn hệ thống) */}
      <div className="flex border-b border-border text-xs sm:text-sm font-medium overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('runs')}
          className={`flex items-center gap-2 px-3 pb-2.5 pt-1 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'runs'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Kỳ bảng lương ({runs.length})
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-2 px-3 pb-2.5 pt-1 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'components'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          Thành phần lương ({components.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-2 px-3 pb-2.5 pt-1 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'structures'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Cấu trúc lương ({structures.length})
        </button>
      </div>

      {/* ================= TAB 1: CHU KỲ BẢNG LƯƠNG & DANH SÁCH PHIẾU LƯƠNG ================= */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          {runs.length === 0 ? (
            <EmptyState
              title="Chưa có đợt lương nào"
              description="Bấm 'Tính bảng lương' để bắt đầu tạo bảng lương chu kỳ mới."
            />
          ) : (
            <>
              {/* Minimalist Run Selector & Summary Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Kỳ lương:</span>
                    <Select
                      value={currentRun?.id || ''}
                      onChange={(e) => setSelectedRunId(e.target.value)}
                      className="w-[240px] text-xs font-medium"
                    >
                      {runs.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.periodName} ({r.totalEmployees} nhân viên)
                        </option>
                      ))}
                    </Select>
                  </div>

                  {currentRun && (
                    <div className="flex items-center gap-3 text-muted-foreground border-l border-border pl-3">
                      <span>Nhân sự: <b className="text-foreground">{currentRun.totalEmployees}</b></span>
                      <span>Khấu trừ: <b className="text-foreground">{currentRun.totalDeduction.toLocaleString('vi-VN')} đ</b></span>
                      <span>Tổng thực lĩnh: <b className="text-foreground font-mono">{currentRun.totalNetPay.toLocaleString('vi-VN')} đ</b></span>
                    </div>
                  )}
                </div>

                {currentRun && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentRun.status}</span>
                    {currentRun.status === 'PAID' && currentRun.paymentReference && (
                      <span className="text-xs text-muted-foreground">Chứng từ: {currentRun.paymentReference}</span>
                    )}
                    {[
                      { status: 'PROCESSED', action: 'review', label: 'Đối soát', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT'] },
                      { status: 'REVIEWED', action: 'approve', label: 'Phê duyệt', roles: ['ADMIN', 'BOD'] },
                      { status: 'APPROVED', action: 'lock', label: 'Khóa kỳ', roles: ['ADMIN', 'BOD'] },
                      { status: 'LOCKED', action: 'pay', label: 'Xác nhận thanh toán', roles: ['ADMIN', 'ACCOUNTANT'] },
                    ].filter(step => step.status === currentRun.status && user?.roles?.some(role => step.roles.includes(role))).map(step => <Button key={step.action} size="sm" disabled={transitionMutation.isPending} onClick={() => {
                      if (step.action === 'pay') {
                        const paymentMethod = window.prompt('Chọn hình thức: BANK_TRANSFER, CASH hoặc OTHER', 'BANK_TRANSFER');
                        if (!paymentMethod || !['BANK_TRANSFER', 'CASH', 'OTHER'].includes(paymentMethod.trim().toUpperCase())) {
                          toast('Hình thức thanh toán không hợp lệ', 'error');
                          return;
                        }
                        const paymentReference = window.prompt('Nhập mã giao dịch chuyển khoản hoặc số chứng từ chi:');
                        if (!paymentReference?.trim()) return;
                        transitionMutation.mutate({ id: currentRun.id, action: step.action, payment: { paymentMethod: paymentMethod.trim().toUpperCase(), paymentReference: paymentReference.trim() } });
                      } else transitionMutation.mutate({ id: currentRun.id, action: step.action });
                    }}>{step.label}</Button>)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportBankCsv(currentRun)}
                      className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Xuất CSV ngân hàng
                    </Button>
                    {canDeletePayrollRun && <Button
                      variant="ghost"
                      size="sm"
                      disabled={!['DRAFT', 'PROCESSED'].includes(currentRun.status)}
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa đợt lương "${currentRun.periodName}"?`)) {
                          deleteRunMutation.mutate(currentRun.id);
                        }
                      }}
                      className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      Xóa đợt này
                    </Button>}
                  </div>
                )}
              </div>

              {/* Slips DataTable (Single search box, clean rows) */}
              {currentRun && (
                <div className="space-y-2">
                  <DataTable
                    columns={slipColumns}
                    rows={currentRun.slips || []}
                    rowKey={(s: PayrollSlip) => s.id}
                    pageSize={10}
                    searchFields={(s: PayrollSlip) => [s.employeeName, s.employeeCode || '', s.department || '']}
                    filters={[
                      {
                        key: 'department',
                        label: 'Phòng ban',
                        value: (slip) => slip.department || 'UNASSIGNED',
                        options: Array.from(new Set((currentRun.slips ?? []).map((slip) => slip.department || 'UNASSIGNED')))
                          .sort((a, b) => a.localeCompare(b, 'vi'))
                          .map((department) => ({ value: department, label: department === 'UNASSIGNED' ? 'Chưa xếp đơn vị' : department })),
                      },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= TAB 2: THÀNH PHẦN LƯƠNG ================= */}
      {activeTab === 'components' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Khoản Thu Nhập */}
          <div className="space-y-3">
            <div className="pb-1 border-b border-border">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Khoản thu nhập (Earnings)
              </span>
            </div>

            <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
              {components
                .filter((c) => c.type === 'EARNING')
                .map((c) => (
                  <div key={c.id} className="p-3 flex items-start justify-between gap-4 text-xs hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.isTaxApplicable ? 'Tính thuế TNCN' : 'Miễn thuế'} · {c.isInsuranceApplicable ? 'Tính đóng bảo hiểm' : 'Không tính đóng bảo hiểm'} · {c.isOvertimeApplicable ? 'Tính đơn giá OT' : 'Không tính đơn giá OT'} · {c.description || 'Cố định'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5">
                      <span className="whitespace-nowrap font-mono text-xs text-foreground">
                        +{c.defaultAmount.toLocaleString('vi-VN')} đ
                      </span>
                      {canConfigurePayroll && <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditComponentModal(c)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          title="Sửa"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa thành phần lương "${c.name}"?`)) {
                              deleteCompMutation.mutate(c.id);
                            }
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600"
                          title="Xóa"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Khoản Khấu Trừ */}
          <div className="space-y-3">
            <div className="pb-1 border-b border-border">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Khoản khấu trừ (Deductions)
              </span>
            </div>

            <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
              {components
                .filter((c) => c.type === 'DEDUCTION')
                .map((c) => (
                  <div key={c.id} className="p-3 flex items-start justify-between gap-4 text-xs hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.description || 'Khấu trừ theo quy định'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5">
                      <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        -{c.defaultAmount.toLocaleString('vi-VN')} đ
                      </span>
                      {canConfigurePayroll && <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditComponentModal(c)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          title="Sửa"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa thành phần lương "${c.name}"?`)) {
                              deleteCompMutation.mutate(c.id);
                            }
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600"
                          title="Xóa"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CẤU TRÚC LƯƠNG ================= */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-3xl text-xs text-muted-foreground">Cấu trúc xác định các khoản áp dụng theo vị trí/nhóm nhân sự. Mức lương cơ bản lấy từ hồ sơ hợp đồng hoặc quyết định lương đã có hiệu lực khi gán.</p>
            {canConfigurePayroll ? <Button size="sm" onClick={() => {
              setNewStructureName('');
              setNewStructureDescription('');
              setNewStructureItems({});
              setIsStructureModalOpen(true);
            }}><Plus className="mr-1.5 h-4 w-4" />Tạo cấu trúc lương</Button> : null}
          </div>
          {structures.length === 0 ? <EmptyState title="Chưa có cấu trúc lương" description="Tạo cấu trúc từ các thành phần lương hiện có, sau đó gán cho nhân sự phù hợp." /> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4 space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{s.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description || 'Cấu trúc tiêu chuẩn'}</p>
                </div>
                <span className="text-muted-foreground text-xs">{s._count?.assignments ?? 0} nhân sự</span>
              </div>

              <div className="border-t border-border pt-2 space-y-1 text-xs text-muted-foreground">
                {s.items && s.items.length > 0 ? (
                  s.items.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{it.component.name}</span>
                      <span className="font-mono text-foreground">{it.amount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))
                ) : (
                  <p className="italic">Lương cơ bản + Phụ cấp ăn trưa</p>
                )}
              </div>

              {canConfigurePayroll && <div className="border-t border-border pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStructureId(s.id);
                    setIsAssignModalOpen(true);
                  }}
                  className="h-7 text-xs"
                >
                  Gán nhân sự
                </Button>
              </div>}
            </div>
          ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: TÍNH BẢNG LƯƠNG ================= */}
      <Modal
        open={isProcessModalOpen}
        onOpenChange={(open) => setIsProcessModalOpen(open)}
        title="Tính Bảng Lương Chu Kỳ"
        size="md"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-muted-foreground">Tên chu kỳ bảng lương *</label>
            <input
              type="text"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground">Từ ngày *</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-muted-foreground">Đến ngày *</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => setIsProcessModalOpen(false)}
          confirmLabel="Tính toán"
          onConfirm={() => {
            if (!periodName) {
              toast('Vui lòng nhập tên kỳ lương', 'error');
              return;
            }
            createRunMutation.mutate({ periodName, fromDate, toDate });
          }}
          disabled={createRunMutation.isPending}
        />
      </Modal>

      {/* ================= MODAL: TẠO / SỬA THÀNH PHẦN ================= */}
      <Modal
        open={isComponentModalOpen || !!editingComponent}
        onOpenChange={(open) => {
          if (!open) {
            setIsComponentModalOpen(false);
            setEditingComponent(null);
          }
        }}
        title={editingComponent ? 'Sửa Thành Phần Lương' : 'Thêm Thành Phần Lương'}
        size="md"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground">Mã thành phần *</label>
              <input
                type="text"
                placeholder="VD: ALLOWANCE_SKILL"
                value={compCode}
                onChange={(e) => setCompCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-foreground focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-muted-foreground">Phân loại *</label>
              <Select
                value={compType}
                onChange={(e) => setCompType(e.target.value as 'EARNING' | 'DEDUCTION')}
                className="mt-1 w-full text-xs"
              >
                <option value="EARNING">Thu nhập</option>
                <option value="DEDUCTION">Khấu trừ</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground">Tên thành phần *</label>
            <input
              type="text"
              placeholder="VD: Phụ cấp trách nhiệm"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-muted-foreground">Số tiền mặc định (VND)</label>
              <input
                type="number"
                step={50000}
                value={compAmount}
                onChange={(e) => setCompAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-foreground focus:outline-hidden"
              />
            </div>
            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                <input
                  type="checkbox"
                  checked={compTax}
                  onChange={(e) => setCompTax(e.target.checked)}
                  className="rounded border-border"
                />
                Tính vào Thuế TNCN
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground mt-3">
                <input
                  type="checkbox"
                  checked={compInsurance}
                  onChange={(e) => setCompInsurance(e.target.checked)}
                  className="rounded border-border"
                />
                Tính vào căn cứ bảo hiểm khi khoản này được thỏa thuận trả thường xuyên, ổn định
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground mt-3">
                <input
                  type="checkbox"
                  checked={compOvertime}
                  onChange={(e) => setCompOvertime(e.target.checked)}
                  className="rounded border-border"
                />
                Tính vào tiền lương giờ làm căn cứ OT (lương theo công việc/chức danh, khoản trả thường xuyên)
              </label>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground">Ghi chú</label>
            <textarea
              rows={2}
              value={compDesc}
              onChange={(e) => setCompDesc(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-hidden"
            />
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => {
            setIsComponentModalOpen(false);
            setEditingComponent(null);
          }}
          confirmLabel={editingComponent ? 'Lưu' : 'Thêm'}
          onConfirm={() => {
            if (!compCode || !compName) {
              toast('Vui lòng nhập mã và tên thành phần', 'error');
              return;
            }
            if (editingComponent) {
              updateCompMutation.mutate({
                id: editingComponent.id,
                data: {
                  code: compCode,
                  name: compName,
                  type: compType,
                  defaultAmount: compAmount,
                  description: compDesc,
                  isTaxApplicable: compTax,
                  isInsuranceApplicable: compInsurance,
                  isOvertimeApplicable: compOvertime,
                },
              });
            } else {
              createCompMutation.mutate({
                code: compCode,
                name: compName,
                type: compType,
                defaultAmount: compAmount,
                description: compDesc,
                isTaxApplicable: compTax,
                isInsuranceApplicable: compInsurance,
                isOvertimeApplicable: compOvertime,
              });
            }
          }}
          disabled={createCompMutation.isPending || updateCompMutation.isPending}
        />
      </Modal>

      {/* ================= MODAL: TẠO CẤU TRÚC LƯƠNG ================= */}
      <Modal
        open={isStructureModalOpen}
        onOpenChange={setIsStructureModalOpen}
        title="Tạo cấu trúc lương"
        description="Chọn các thành phần áp dụng và thiết lập số tiền mặc định. Mức thực trả vẫn được tính theo hồ sơ nhân sự và dữ liệu kỳ lương."
        size="lg"
      >
        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Tên cấu trúc *</label>
            <input className="w-full rounded-md border border-border bg-background px-3 py-2" value={newStructureName} onChange={(e) => setNewStructureName(e.target.value)} placeholder="Ví dụ: Nhân viên kinh doanh" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Mô tả / nhóm áp dụng</label>
            <input className="w-full rounded-md border border-border bg-background px-3 py-2" value={newStructureDescription} onChange={(e) => setNewStructureDescription(e.target.value)} placeholder="Ví dụ: Khối kinh doanh, lương tháng" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold">Thành phần áp dụng</p>
            <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border">
              {components.map((component) => {
                const included = Object.prototype.hasOwnProperty.call(newStructureItems, component.id);
                return <label key={component.id} className="flex items-center gap-3 p-3 text-xs hover:bg-muted/30">
                  <input type="checkbox" checked={included} onChange={(e) => setNewStructureItems((current) => {
                    const next = { ...current };
                    if (e.target.checked) next[component.id] = component.defaultAmount;
                    else delete next[component.id];
                    return next;
                  })} />
                  <span className="min-w-0 flex-1"><b>{component.name}</b><span className="ml-2 font-mono text-muted-foreground">{component.code}</span><span className="mt-0.5 block text-muted-foreground">{component.type === 'EARNING' ? 'Thu nhập' : 'Khấu trừ'} · {component.description || 'Theo cấu hình'}</span></span>
                  {included ? <input aria-label={`Số tiền ${component.name}`} type="number" min={0} step={1000} value={newStructureItems[component.id]} onChange={(e) => setNewStructureItems((current) => ({ ...current, [component.id]: Number(e.target.value) }))} onClick={(e) => e.stopPropagation()} className="w-36 rounded-md border border-border bg-background px-2 py-1 text-right font-mono" /> : <span className="w-36 text-right text-muted-foreground">Bỏ qua</span>}
                </label>;
              })}
            </div>
          </div>
        </div>
        <ModalFooterActions
          onCancel={() => setIsStructureModalOpen(false)}
          confirmLabel="Tạo cấu trúc"
          pending={createStructureMutation.isPending}
          disabled={!newStructureName.trim() || Object.keys(newStructureItems).length === 0}
          onConfirm={() => createStructureMutation.mutate()}
        />
      </Modal>

      {/* ================= MODAL: GÁN CẤU TRÚC ================= */}
      <Modal
        open={isAssignModalOpen}
        onOpenChange={(open) => setIsAssignModalOpen(open)}
        title="Gán Cấu Trúc Lương Cho Nhân Sự"
        size="md"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-muted-foreground">Lọc theo phòng ban</label>
            <Select
              value={assignOrgUnitFilter}
              onChange={(e) => {
                setAssignOrgUnitFilter(e.target.value);
                setAssignUserId('');
              }}
              className="mt-1 w-full text-xs"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {Array.from(new Map(assignmentTargets.filter((employee) => employee.orgUnit?.id).map((employee) => [employee.orgUnit!.id, employee.orgUnit!.name])).entries())
                .sort((a, b) => a[1].localeCompare(b[1], 'vi'))
                .map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              <option value="UNASSIGNED">Chưa xếp đơn vị</option>
            </Select>
          </div>
          <div>
            <label className="text-muted-foreground">Chọn nhân viên *</label>
            <Select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="mt-1 w-full text-xs"
              searchable
              searchPlaceholder="Tìm theo tên, mã nhân viên, phòng ban"
            >
              <option value="">-- Chọn nhân viên --</option>
              {assignmentTargets.filter((employee) => assignOrgUnitFilter === 'ALL' || (employee.orgUnit?.id ?? 'UNASSIGNED') === assignOrgUnitFilter).map((employee) => (
                <option key={employee.id} value={employee.id} disabled={!employee.hasPayrollBasis}>
                  {employee.fullName} ({employee.employeeCode || 'Chưa có mã'}) · {employee.orgUnit?.name || 'Chưa xếp đơn vị'}{employee.currentStructureName ? ` · Đang dùng: ${employee.currentStructureName}` : ''}{employee.hasPayrollBasis ? '' : ' · Chưa có lương căn cứ'}
                </option>
              ))}
            </Select>
          </div>
          {assignUserId ? (() => {
            const employee = assignmentTargets.find((target) => target.id === assignUserId);
            if (!employee) return null;
            return <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p><b>{employee.fullName}</b> · {employee.jobTitle || 'Chưa có chức danh'} · {employee.orgUnit?.name || 'Chưa xếp đơn vị'}</p>
              <p className="mt-1">Lương căn cứ lấy từ hồ sơ: <b>{Number(employee.baseSalary || 0).toLocaleString('vi-VN')} VND</b></p>
              {employee.currentStructureName ? <p className="mt-1 text-amber-700">Đang áp dụng “{employee.currentStructureName}”; gán cấu trúc mới sẽ thay cấu trúc đang hoạt động.</p> : null}
            </div>;
          })() : <p className="text-xs text-muted-foreground">Chọn nhân sự đang hoạt động có mức lương căn cứ đã được ghi nhận.</p>}
        </div>

        <ModalFooterActions
          onCancel={() => setIsAssignModalOpen(false)}
          confirmLabel="Gán cấu trúc"
          onConfirm={() => {
            const employee = assignmentTargets.find((target) => target.id === assignUserId);
            if (!employee) {
              toast('Vui lòng chọn nhân viên', 'error');
              return;
            }
            if (!employee.hasPayrollBasis) {
              toast('Nhân sự chưa có lương căn cứ trong hồ sơ', 'error');
              return;
            }
            if (employee.currentStructureName && !window.confirm(`Thay cấu trúc “${employee.currentStructureName}” bằng cấu trúc mới cho ${employee.fullName}?`)) return;
            assignStructureMutation.mutate({
              structureId: selectedStructureId,
              userId: assignUserId,
            });
          }}
          disabled={assignStructureMutation.isPending || !assignmentTargets.some((employee) => employee.id === assignUserId && employee.hasPayrollBasis)}
        />
      </Modal>

      {/* ================= MODAL: XEM PHIẾU LƯƠNG CHI TIẾT ================= */}
      <Modal
        open={isPayslipModalOpen}
        onOpenChange={(open) => setIsPayslipModalOpen(open)}
        title="Chi Tiết Phiếu Lương Cán Bộ Nhân Viên"
        size="lg"
      >
        {selectedSlip && (
          <div className="space-y-4 text-xs font-sans">
            {/* Chế độ xem: Tóm tắt hoặc Giải trình công thức */}
            <div className="flex items-center justify-between border-b border-border pb-2 no-print">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayslipViewMode('summary')}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                    payslipViewMode === 'summary'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Phiếu Lương Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setPayslipViewMode('formula')}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                    payslipViewMode === 'formula'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Giải Trình Công Thức Chi Tiết
                </button>
              </div>
              <span className="text-2xs text-muted-foreground font-mono">
                Mã phiếu: {selectedSlip.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            {/* TAB: GIẢI TRÌNH CÔNG THỨC CHI TIẾT */}
            {payslipViewMode === 'formula' ? (
              <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
                <div className="border-b border-border pb-2">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-primary" />
                    BẢNG GIẢI TRÌNH BƯỚC TÍNH LƯƠNG CHI TIẾT (FORMULA BREAKDOWN)
                  </h4>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    Cán bộ: <b className="text-foreground">{selectedSlip.employeeName}</b> ({selectedSlip.employeeCode || 'NV'}) • Vị trí: {selectedSlip.jobTitle || 'Chuyên viên'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <p>Công được hưởng: {selectedSlip.actualWorkDays ?? 0}/{selectedSlip.workingDays ?? 0} ngày</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><b>Các khoản thu nhập</b>{(selectedSlip.breakdown?.earnings ?? []).map((line, i) => <div className="flex justify-between py-1" key={i}><span>{line.name}</span><span>{line.amount.toLocaleString('vi-VN')} đ</span></div>)}</div>
                    <div><b>Các khoản khấu trừ</b>{(selectedSlip.breakdown?.deductions ?? []).map((line, i) => <div className="flex justify-between py-1" key={i}><span>{line.name}</span><span>{line.amount.toLocaleString('vi-VN')} đ</span></div>)}</div>
                  </div>
                  {selectedSlip.breakdown?.calculation?.overtimeBasis && <p>Căn cứ OT: ({selectedSlip.breakdown.calculation.overtimeBasis.contractualMonthlyWage.toLocaleString('vi-VN')} đ/tháng ÷ {selectedSlip.breakdown.calculation.overtimeBasis.standardHours.toLocaleString('vi-VN')} giờ chuẩn) = {selectedSlip.breakdown.calculation.overtimeBasis.hourlyRate.toLocaleString('vi-VN')} đ/giờ. Cấu phần lương tính vào căn cứ OT được thiết lập trong danh mục thành phần lương.</p>}
                  {selectedSlip.breakdown?.calculation?.minimumWageReview?.status === 'REVIEW' && <div className="rounded-md border border-amber-400/60 bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
                    <b>Cần rà soát mức lương tối thiểu vùng {selectedSlip.breakdown.calculation.minimumWageReview.region}.</b>
                    {selectedSlip.breakdown.calculation.minimumWageReview.monthlyBelowMinimum && <p>Lương thỏa thuận đang tính ({selectedSlip.breakdown.calculation.minimumWageReview.contractualMonthlyWage.toLocaleString('vi-VN')} đ/tháng) thấp hơn mốc tháng {selectedSlip.breakdown.calculation.minimumWageReview.monthlyMinimum?.toLocaleString('vi-VN')} đ.</p>}
                    {selectedSlip.breakdown.calculation.minimumWageReview.hourlyBelowMinimum && <p>Quy đổi theo lịch chuẩn ({selectedSlip.breakdown.calculation.minimumWageReview.hourlyEquivalent.toLocaleString('vi-VN')} đ/giờ) thấp hơn mốc giờ {selectedSlip.breakdown.calculation.minimumWageReview.hourlyMinimum?.toLocaleString('vi-VN')} đ.</p>}
                    <p>Đối chiếu hình thức trả lương, thời giờ bình thường và hợp đồng trước khi duyệt; đây là cảnh báo, không tự chặn kỳ lương.</p>
                  </div>}
                  {selectedSlip.breakdown?.calculation && <p>Thuế năm {selectedSlip.breakdown.calculation.year}: giảm trừ bản thân {selectedSlip.breakdown.calculation.personalRelief.toLocaleString('vi-VN')} đ; người phụ thuộc {selectedSlip.breakdown.calculation.dependentRelief.toLocaleString('vi-VN')} đ; thu nhập tính thuế {selectedSlip.breakdown.calculation.taxableIncome.toLocaleString('vi-VN')} đ.</p>}
                  <p className="font-bold">Thực lĩnh = {selectedSlip.grossPay.toLocaleString('vi-VN')} − {selectedSlip.totalDeduction.toLocaleString('vi-VN')} = {selectedSlip.netPay.toLocaleString('vi-VN')} đ</p>
                </div>

              </div>
            ) : (
              /* TAB: PHIẾU LƯƠNG CHUẨN IN ẤN (PRINTABLE DOC) */
              <div id="print-payslip-doc" className="print-area print-payslip space-y-3 text-xs font-sans">
                <style jsx global>{`
                  @media print {
                    #print-payslip-doc { padding: 14mm 16mm !important; font-size: 10pt !important; line-height: 1.3 !important; }
                    #print-payslip-doc table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; margin: 2mm 0 4mm !important; }
                    #print-payslip-doc th, #print-payslip-doc td { padding: 2mm 2.5mm !important; border-bottom: 1px solid #777 !important; vertical-align: top !important; word-break: normal !important; overflow-wrap: anywhere !important; }
                    #print-payslip-doc th { text-align: left !important; border-top: 1px solid #111 !important; border-bottom: 1px solid #111 !important; }
                    #print-payslip-doc .amount { text-align: right !important; white-space: nowrap !important; }
                    #print-payslip-doc .payslip-total { border-top: 1px solid #111 !important; font-weight: bold !important; }
                    #print-payslip-doc .payslip-section { break-inside: avoid; page-break-inside: avoid; }
                  }
                `}</style>
                <header className="text-center pb-3">
                  <p className="font-bold uppercase tracking-wide">{orgConfig.orgName || 'Tên doanh nghiệp / đơn vị'}</p>
                  <h2 className="mt-1 text-lg font-bold uppercase">PHIẾU LƯƠNG NHÂN VIÊN</h2>
                  <p className="mt-1">{currentRun?.periodName || 'Kỳ lương hiện hành'}</p>
                  <p className="mt-1 text-xs">Mã phiếu: <b className="font-mono">{selectedSlip.id.slice(0, 8).toUpperCase()}</b> · Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                </header>

                <section className="payslip-section">
                  <h3 className="font-bold uppercase">Thông tin người lao động</h3>
                  <table>
                    <tbody>
                      <tr><th>Họ và tên</th><td>{selectedSlip.employeeName}</td></tr>
                      <tr><th>Mã nhân viên</th><td>{selectedSlip.employeeCode || 'Chưa cập nhật'}</td></tr>
                      <tr><th>Phòng ban / đơn vị</th><td>{selectedSlip.department || 'Chưa cập nhật'}</td></tr>
                      <tr><th>Chức danh công việc</th><td>{selectedSlip.jobTitle || 'Chưa cập nhật'}</td></tr>
                      <tr><th>Ngày công hưởng lương</th><td>{selectedSlip.actualWorkDays ?? 0}/{selectedSlip.workingDays ?? 0} công</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="payslip-section">
                  <h3 className="font-bold uppercase">I. Các khoản thu nhập (VND)</h3>
                  <table>
                    <thead><tr><th style={{ width: '12%' }}>STT</th><th>Khoản thu nhập</th><th className="amount" style={{ width: '25%' }}>Số tiền</th></tr></thead>
                    <tbody>
                      {(selectedSlip.breakdown?.earnings ?? []).map((line, i) => <tr key={`earning-${i}`}><td>{i + 1}</td><td>{line.name}</td><td className="amount">{line.amount.toLocaleString('vi-VN')}</td></tr>)}
                      <tr className="payslip-total"><td colSpan={2}>Tổng thu nhập trước khấu trừ</td><td className="amount">{selectedSlip.grossPay.toLocaleString('vi-VN')}</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="payslip-section">
                  <h3 className="font-bold uppercase">II. Các khoản khấu trừ (VND)</h3>
                  <table>
                    <thead><tr><th style={{ width: '12%' }}>STT</th><th>Khoản khấu trừ</th><th className="amount" style={{ width: '25%' }}>Số tiền</th></tr></thead>
                    <tbody>
                      {(selectedSlip.breakdown?.deductions ?? []).length > 0 ? selectedSlip.breakdown?.deductions?.map((line, i) => <tr key={`deduction-${i}`}><td>{i + 1}</td><td>{line.name}</td><td className="amount">{line.amount.toLocaleString('vi-VN')}</td></tr>) : <tr><td colSpan={3}>Không có khoản khấu trừ được ghi nhận.</td></tr>}
                      <tr className="payslip-total"><td colSpan={2}>Tổng khấu trừ</td><td className="amount">{selectedSlip.totalDeduction.toLocaleString('vi-VN')}</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="payslip-section border-y border-black py-3">
                  <p className="font-bold uppercase">Số tiền thực lĩnh</p>
                  <p className="mt-1 text-lg font-bold">{selectedSlip.netPay.toLocaleString('vi-VN')} VND</p>
                  <p className="mt-1 text-xs">Thực lĩnh = tổng thu nhập − tổng khấu trừ.</p>
                </section>

                <footer className="grid grid-cols-3 gap-3 pt-5 text-center">
                  <div><p className="font-bold uppercase">Người lập</p><p className="italic">(Ký, ghi rõ họ tên)</p><div className="h-16" /></div>
                  <div><p className="font-bold uppercase">Kế toán trưởng</p><p className="italic">(Ký, ghi rõ họ tên)</p><div className="h-16" /></div>
                  <div><p className="font-bold uppercase">Người duyệt</p><p className="italic">(Ký, ghi rõ họ tên)</p><div className="h-16" /></div>
                </footer>
              </div>
            )}
          </div>
        )}

        <ModalFooterActions
          onCancel={() => setIsPayslipModalOpen(false)}
          cancelLabel="Đóng"
          confirmLabel="In phiếu lương"
          onConfirm={() => printDocumentElement('print-payslip-doc')}
        />
      </Modal>
    </div>
  );
}
