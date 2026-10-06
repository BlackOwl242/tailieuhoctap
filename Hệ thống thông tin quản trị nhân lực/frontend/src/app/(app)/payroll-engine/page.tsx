'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calculator, Plus, Trash2, Edit3, Eye, Printer, FileText, Download,
  BookOpen, ShieldCheck, Percent, Clock, Award, Info, CheckCircle2, ChevronRight,
  Layers, Sliders, FileSpreadsheet, Sparkles, ArrowRight, ExternalLink, Save
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
  basisType: 'LAW' | 'COMPANY_POLICY' | 'CONTRACT' | 'SYSTEM' | 'UNVERIFIED';
  basisReference?: string | null;
}

interface SalaryStructure {
  id: string;
  name: string;
  payrollFrequency: string;
  jobTitle?: string | null;
  orgUnitId?: string | null;
  orgUnit?: { id: string; name: string } | null;
  salaryBandId?: string | null;
  salaryBand?: { id: string; code: string; name: string; minSalary: number; midSalary: number; maxSalary: number; compensationBasis: 'MONTHLY' | 'DAILY' | 'HOURLY' } | null;
  description?: string;
  positionEmployeeCount?: number;
  items: { id: string; amount: number; formula?: string; component: SalaryComponent }[];
  _count?: { assignments: number };
}

interface ApprovedPayrollBand {
  id: string;
  code: string;
  name: string;
  levelTitle: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  compensationBasis: 'MONTHLY' | 'DAILY' | 'HOURLY';
  effectiveFrom: string;
  effectiveTo: string | null;
  jobTitles: string[];
  employeeCount: number;
  withinRange: number;
  belowRange: number;
  aboveRange: number;
}

interface PayrollAssignmentTarget {
  id: string;
  fullName: string;
  employeeCode: string | null;
  jobTitle: string | null;
  salaryBandId: string | null;
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
      expectedCompensation?: number; earnedCompensation?: number; attendanceWageReduction?: number;
      minimumWageReview?: { region: string; contractualMonthlyWage: number; standardHours: number; monthlyMinimum: number | null; hourlyEquivalent: number; hourlyMinimum: number | null; monthlyBelowMinimum: boolean; hourlyBelowMinimum: boolean; status: 'PASS' | 'REVIEW' | 'UNCONFIGURED' };
      salaryBandReview?: { bands: { code: string; name: string; minSalary: number; midSalary: number; maxSalary: number; compensationBasis: string; status: string; days: number }[]; daysWithoutApprovedBand: number };
      overtimeBasis?: { contractualMonthlyWage: number; standardHours: number; hourlyRate: number };
      salarySource?: 'EMPLOYEE_ASSIGNMENT' | 'CONTRACT' | 'PROFILE_FALLBACK' | 'MIXED';
      salaryStructureSource?: 'EMPLOYEE_ASSIGNMENT' | 'POSITION_RULE' | 'MIXED' | 'NONE';
      salaryStructureName?: string | null;
      contractNo?: string | null;
      payRatesUsed?: { basis: string; rate: number }[];
      attendance?: { standardDays: number; paidDays: number; actualWorkDays: number; workedHours: number; scheduledHours: number; shortHours: number; lateDays: number; lateMinutes: number; earlyLeaveDays: number; earlyLeaveMinutes: number; absenceDays: number; paidLeaveDays: number; unpaidLeaveDays: number; socialInsuranceLeaveDays: number; missingPairDays: number };
      overtimeRequests?: { workDate: string; status: string; hours: number; nightHours: number; dayCategory: string; paid: boolean }[];
      approvedOvertime?: { workDate: string; hours: number; nightHours: number; category: string; hourlyRate: number; pay: number }[];
      attendanceDays?: { workDate: string; status: string; scheduledMinutes: number; workedMinutes: number; lateMinutes: number; earlyMinutes: number; leaveType?: string | null; paidLeave: boolean }[];
    };
    earnings?: { name: string; amount: number; basisReference?: string | null }[];
    deductions?: { name: string; amount: number; basisReference?: string | null }[];
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

interface PayrollPolicyForm {
  version: string; effectiveFrom: string; effectiveTo: string | null; basisReference: string;
  personalRelief: number; dependentRelief: number; taxBrackets: [number | null, number][];
  nonResidentTaxRate: number; overtimeExemptMode: 'ALL' | 'PREMIUM_ONLY' | 'TAXABLE'; nightWorkExemptMode: 'ALL' | 'PREMIUM_ONLY' | 'TAXABLE';
  employeeRates: { socialInsurance: number; healthInsurance: number; unemployment: number };
  employerRates: { socialInsurance: number; healthInsurance: number; unemployment: number; occupationalAccident: number; tradeUnionFund: number };
  bhxhCap: number; unemploymentCapByRegion: Record<string, number>; minimumWageByRegion: Record<string, number>; minimumHourlyWageByRegion?: Record<string, number>;
  overtimeRates: { weekday: number; weeklyRest: number; publicHoliday: number; nightAdditional: number; nightOvertimeFactor: number };
  maxMonthlyOvertimeHours: number; maxAnnualOvertimeHours: number; loanDeductionCapRate: number;
}

const SYSTEM_MANAGED_PAYROLL_CODES = new Set(['BASIC', 'BHXH', 'BHYT', 'BHTN', 'PIT']);

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

  const [activeTab, setActiveTab] = useState<'runs' | 'components' | 'structures' | 'policy'>('runs');
  const [policyDraft, setPolicyDraft] = useState<PayrollPolicyForm | null>(null);
  const [policySourceVersion, setPolicySourceVersion] = useState('');
  const [isNewPolicyVersion, setIsNewPolicyVersion] = useState(false);
  const canEditPayrollPolicy = userRoles.includes('ADMIN');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [payslipViewMode, setPayslipViewMode] = useState<'summary' | 'formula'>('summary');

  // Giữ tương thích liên kết cũ; quy chế và cấu hình hiện nằm trong tab chính sách.
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'regulations') {
      setActiveTab('policy');
      router.replace('/payroll-engine?tab=policy');
    } else if (tabParam === 'components' || tabParam === 'structures' || tabParam === 'runs' || tabParam === 'policy') {
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
  const [newStructureJobTitle, setNewStructureJobTitle] = useState('');
  const [newStructureOrgUnitId, setNewStructureOrgUnitId] = useState('');
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
  const [compAmount, setCompAmount] = useState(0);
  const [compDesc, setCompDesc] = useState('');
  const [compTax, setCompTax] = useState(true);
  const [compInsurance, setCompInsurance] = useState(false);
  const [compOvertime, setCompOvertime] = useState(false);
  const [compFormulaBased, setCompFormulaBased] = useState(false);
  const [compFormula, setCompFormula] = useState('');
  const [compBasisType, setCompBasisType] = useState<SalaryComponent['basisType']>('COMPANY_POLICY');
  const [compBasisReference, setCompBasisReference] = useState('');

  // Data Queries
  const { data: runs = [], isLoading: isLoadingRuns, isError: isRunsError, error: runsError, refetch: refetchRuns } = useQuery<PayrollRun[]>({
    queryKey: ['hrms-payroll-runs'],
    queryFn: async () => (await api.get('/hrms/payroll/runs')).data,
  });

  const { data: components = [], isLoading: isLoadingComps, isError: isComponentsError, error: componentsError, refetch: refetchComponents } = useQuery<SalaryComponent[]>({
    queryKey: ['hrms-salary-components'],
    queryFn: async () => (await api.get('/hrms/payroll/components')).data,
  });

  const { data: structures = [], isLoading: isLoadingStructs, isError: isStructuresError, error: structuresError, refetch: refetchStructures } = useQuery<SalaryStructure[]>({
    queryKey: ['hrms-salary-structures'],
    queryFn: async () => (await api.get('/hrms/payroll/structures')).data,
  });

  const { data: approvedBands = [], isLoading: isLoadingBands } = useQuery<ApprovedPayrollBand[]>({
    queryKey: ['hrms-approved-salary-bands'],
    queryFn: async () => (await api.get('/hrms/payroll/approved-bands')).data,
  });

  const { data: effectiveSettings } = useQuery<Record<string, unknown>>({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings/effective')).data,
  });
  const payrollPolicies = (Array.isArray(effectiveSettings?.PAYROLL_POLICIES) ? effectiveSettings.PAYROLL_POLICIES : []) as PayrollPolicyForm[];
  const [selectedPolicyVersion, setSelectedPolicyVersion] = useState('');
  useEffect(() => {
    if (!payrollPolicies.length) return;
    const policy = payrollPolicies.find((item) => item.version === selectedPolicyVersion) ?? payrollPolicies[payrollPolicies.length - 1];
    if (policy) {
      setSelectedPolicyVersion(policy.version);
      setPolicySourceVersion(policy.version);
      setPolicyDraft(structuredClone(policy));
      setIsNewPolicyVersion(false);
    }
  // Selection should reload the form when the policy list changes after a save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSettings?.PAYROLL_POLICIES]);
  const savePolicyMutation = useMutation({
    mutationFn: async () => {
      if (!policyDraft) throw new Error('Chưa có chính sách để lưu.');
      const draft = { ...policyDraft, effectiveTo: policyDraft.effectiveTo || null };
      let nextPolicies: PayrollPolicyForm[];
      if (isNewPolicyVersion) {
        const source = payrollPolicies.find((item) => item.version === policySourceVersion);
        if (!source) throw new Error('Không tìm thấy phiên bản gốc. Tải lại trang rồi thử lại.');
        if (draft.effectiveFrom <= source.effectiveFrom) throw new Error('Ngày hiệu lực của phiên bản mới phải sau ngày bắt đầu phiên bản gốc.');
        const previousDay = new Date(`${draft.effectiveFrom}T00:00:00`);
        previousDay.setDate(previousDay.getDate() - 1);
        nextPolicies = payrollPolicies.map((item) => item.version === source.version
          ? { ...item, effectiveTo: previousDay.toISOString().slice(0, 10) }
          : item);
        nextPolicies.push(draft);
      } else {
        nextPolicies = payrollPolicies.map((item) => item.version === policySourceVersion ? draft : item);
      }
      return api.patch('/admin/settings', { values: { PAYROLL_POLICIES: nextPolicies } });
    },
    onSuccess: () => {
      toast('Đã lưu chính sách lương. Kỳ lương đã tính trước đó không bị thay đổi.', 'success');
      if (isNewPolicyVersion && policyDraft) setSelectedPolicyVersion(policyDraft.version);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsNewPolicyVersion(false);
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const { data: assignmentTargets = [] } = useQuery<PayrollAssignmentTarget[]>({
    queryKey: ['payroll-structure-assignment-targets'],
    queryFn: async () => (await api.get('/hrms/payroll/assignment-targets')).data,
    enabled: canConfigurePayroll,
  });
  const payrollJobTitles = useMemo(() => Array.from(new Set(assignmentTargets.map((employee) => employee.jobTitle?.trim()).filter((title): title is string => Boolean(title)))).sort((a, b) => a.localeCompare(b, 'vi')), [assignmentTargets]);
  const payrollOrgUnits = useMemo(() => Array.from(new Map(assignmentTargets.filter((employee) => employee.orgUnit?.id).map((employee) => [employee.orgUnit!.id, employee.orgUnit!.name])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'vi')), [assignmentTargets]);

  const updatePolicy = <K extends keyof PayrollPolicyForm>(key: K, value: PayrollPolicyForm[K]) =>
    setPolicyDraft((current) => current ? { ...current, [key]: value } : current);
  const policyNumberField = (label: string, value: number, onChange: (value: number) => void, suffix = '₫', step = '1000') => (
    <label className="block space-y-1 text-xs"><span className="text-muted-foreground">{label}</span><div className="flex items-center gap-2"><input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-2 text-foreground" /><span className="text-muted-foreground">{suffix}</span></div></label>
  );
  const policyRateField = (label: string, value: number, onChange: (value: number) => void) =>
    policyNumberField(label, Number((value * 100).toFixed(4)), (next) => onChange(next / 100), '%', '0.01');

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
      isFormulaBased?: boolean;
      formula?: string;
      basisType: SalaryComponent['basisType'];
      basisReference: string;
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
      jobTitle: newStructureJobTitle || undefined,
      orgUnitId: newStructureOrgUnitId || undefined,
      payrollFrequency: 'MONTHLY',
      items: Object.entries(newStructureItems).map(([componentId, amount]) => ({ componentId, amount })),
    })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-structures'] });
      setIsStructureModalOpen(false);
      setNewStructureName('');
      setNewStructureDescription('');
      setNewStructureJobTitle('');
      setNewStructureOrgUnitId('');
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
    setCompAmount(0);
    setCompDesc('');
    setCompTax(true);
    setCompInsurance(false);
    setCompOvertime(false);
    setCompFormulaBased(false);
    setCompFormula('');
    setCompBasisType('COMPANY_POLICY');
    setCompBasisReference('');
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
    setCompFormulaBased(c.isFormulaBased);
    setCompFormula(c.formula || '');
    setCompBasisType(c.basisType || 'UNVERIFIED');
    setCompBasisReference(c.basisReference || '');
  };

  const transitionMutation = useMutation({
    mutationFn: async ({ id, action, payment }: { id: string; action: string; payment?: { paymentMethod: string; paymentReference: string } }) => (await api.post(`/hrms/payroll/runs/${id}/${action}`, payment)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hrms-payroll-runs'] }); toast('Đã cập nhật trạng thái kỳ lương', 'success'); },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  if (isLoadingRuns || isLoadingComps || isLoadingStructs || isLoadingBands) {
    return <LoadingState text="Đang tải dữ liệu..." />;
  }

  if (isRunsError || isComponentsError || isStructuresError) {
    const errors = [runsError, componentsError, structuresError].filter(Boolean) as unknown[];
    const forbidden = errors.some((error) => (error as { response?: { status?: number } })?.response?.status === 403);
    return <div className="space-y-5 pb-12">
      <WorkspaceHeader title="Bảng lương" description="Tính toán bảng lương chu kỳ, khấu trừ bảo hiểm thuế và lập phiếu lương nhân sự." breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Bảng lương' }]} />
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">{forbidden ? 'Tài khoản hiện tại chưa có quyền xem dữ liệu quản trị bảng lương.' : 'Không tải được dữ liệu bảng lương.'}</p>
        <p className="mt-1">{forbidden ? 'Dữ liệu không bị xóa. Hãy đăng nhập bằng tài khoản có vai trò HR, Kế toán hoặc Quản trị để xem các kỳ lương, thành phần và cấu trúc.' : 'Kiểm tra kết nối rồi thử tải lại dữ liệu.'}</p>
        <button className="mt-3 rounded-md border border-current px-3 py-1.5 font-medium" onClick={() => { void refetchRuns(); void refetchComponents(); void refetchStructures(); }}>Thử tải lại</button>
      </div>
    </div>;
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
          {s.breakdown?.calculation?.salaryBandReview?.bands.some((band) => band.status === 'BELOW_RANGE' || band.status === 'ABOVE_RANGE' || band.status === 'BASIS_MISMATCH') && <p className="text-[10px] text-amber-700">Lương hợp đồng cần đối chiếu khung vị trí đã duyệt</p>}
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
      key: 'attendanceWageReduction',
      header: 'Giảm do thiếu công',
      sortable: true,
      render: (s: PayrollSlip) => {
        const amount = s.breakdown?.calculation?.attendanceWageReduction;
        return <span className={`text-xs font-mono ${amount ? 'text-rose-700' : 'text-muted-foreground'}`}>
          {amount === undefined ? '—' : `${amount > 0 ? '−' : ''}${amount.toLocaleString('vi-VN')} đ`}
        </span>;
      },
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
            <Link href="/payroll-engine?tab=policy">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Chính sách lương
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
          Cấu trúc lương{structures.length > 0 ? ` (${structures.length})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-3 pb-2.5 pt-1 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'policy' ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <ShieldCheck className="w-4 h-4" /> Chính sách & quy tắc
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
              <div className="grid min-w-0 grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 text-xs 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-center">
                <div className="grid min-w-0 grid-cols-1 gap-3 2xl:grid-cols-[minmax(15rem,0.9fr)_minmax(0,1.7fr)] 2xl:items-center">
                  <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                    <span className="whitespace-nowrap text-muted-foreground">Kỳ lương:</span>
                    <Select
                      value={currentRun?.id || ''}
                      onChange={(e) => setSelectedRunId(e.target.value)}
                      className="min-w-0 w-full text-xs font-medium md:max-w-[340px]"
                    >
                      {runs.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.periodName} ({r.totalEmployees} nhân viên)
                        </option>
                      ))}
                    </Select>
                  </div>

                  {currentRun && (
                    <div className="grid min-w-0 grid-cols-2 gap-2 text-muted-foreground xl:grid-cols-3">
                      <div className="min-w-0 rounded-md bg-muted/30 px-2 py-1.5">
                        <span className="block">Nhân sự</span>
                        <b className="block whitespace-nowrap text-foreground">{currentRun.totalEmployees}</b>
                      </div>
                      <div className="min-w-0 rounded-md bg-muted/30 px-2 py-1.5">
                        <span className="block">Khấu trừ</span>
                        <b className="block whitespace-nowrap text-foreground">{currentRun.totalDeduction.toLocaleString('vi-VN')} đ</b>
                      </div>
                      <div className="col-span-2 min-w-0 rounded-md bg-muted/30 px-2 py-1.5 xl:col-span-1">
                        <span className="block">Tổng thực lĩnh</span>
                        <b className="block whitespace-nowrap font-mono text-foreground">{currentRun.totalNetPay.toLocaleString('vi-VN')} đ</b>
                      </div>
                    </div>
                  )}
                </div>

                {currentRun && (
                  <div className="flex min-w-0 flex-col gap-2 xl:items-end">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 xl:justify-end">
                      <span className="font-medium">{currentRun.status}</span>
                      {currentRun.status === 'PAID' && currentRun.paymentReference && (
                        <span className="max-w-full truncate text-xs text-muted-foreground" title={`Chứng từ: ${currentRun.paymentReference}`}>Chứng từ: {currentRun.paymentReference}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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
        <div className="space-y-4">
        <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Lương nền lấy từ hợp đồng/quyết định; BHXH, BHYT, BHTN và thuế TNCN do bảng lương tự tính. Khung vị trí đã duyệt chỉ quy định khoảng lương cơ bản; phụ cấp ăn trưa/chức vụ cần chính sách riêng, nên hiện chưa gán mức mặc định.</p>
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
                        {SYSTEM_MANAGED_PAYROLL_CODES.has(c.code) ? `Tính tự động · ${c.description || 'Theo hợp đồng/chính sách kỳ'}` : `${c.isTaxApplicable ? 'Tính thuế TNCN' : 'Miễn thuế'} · ${c.isInsuranceApplicable ? 'Tính đóng bảo hiểm' : 'Không tính đóng bảo hiểm'} · ${c.isOvertimeApplicable ? 'Tính đơn giá OT' : 'Không tính đơn giá OT'} · ${c.description || 'Khoản biến động theo cấu hình'}`}
                      </p>
                      <p className={`mt-1 text-xs ${c.basisReference ? 'text-muted-foreground' : 'font-medium text-amber-700'}`}>Căn cứ: {c.basisReference || 'Chưa khai báo văn bản / điều khoản'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5">
                      <span className="whitespace-nowrap font-mono text-xs text-foreground">
                        {SYSTEM_MANAGED_PAYROLL_CODES.has(c.code) ? 'Tự tính' : c.defaultAmount > 0 ? `Mặc định ${c.defaultAmount.toLocaleString('vi-VN')} đ` : 'Chưa đặt mức'}
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
                        {!SYSTEM_MANAGED_PAYROLL_CODES.has(c.code) && <Button
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
                        </Button>}
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
                      <p className={`mt-1 text-xs ${c.basisReference ? 'text-muted-foreground' : 'font-medium text-amber-700'}`}>Căn cứ: {c.basisReference || 'Chưa khai báo văn bản / điều khoản'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5">
                      <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {SYSTEM_MANAGED_PAYROLL_CODES.has(c.code) ? 'Tự tính' : c.defaultAmount > 0 ? `Mặc định ${c.defaultAmount.toLocaleString('vi-VN')} đ` : 'Chưa đặt mức'}
                      </span>
                      {canConfigurePayroll && <div className="flex items-center gap-1">
                        {!SYSTEM_MANAGED_PAYROLL_CODES.has(c.code) && <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditComponentModal(c)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          title="Sửa"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>}
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
        </div>
      )}

      {/* ================= TAB 3: CẤU TRÚC LƯƠNG ================= */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <h2 className="text-sm font-semibold">Cấu trúc thu nhập đang áp dụng</h2>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground">Cấu trúc theo khung đã duyệt được tự gắn cho người có chức danh/khung tương ứng. Lương cơ bản vẫn theo hợp đồng/quyết định; chỉ thêm phụ cấp hoặc thưởng khi có chính sách doanh nghiệp và căn cứ rõ ràng.</p>
            </div>
            {canConfigurePayroll ? <Button size="sm" onClick={() => {
              setNewStructureName('');
              setNewStructureDescription('');
              setNewStructureJobTitle('');
              setNewStructureOrgUnitId('');
              setNewStructureItems({});
              setIsStructureModalOpen(true);
            }}><Plus className="mr-1.5 h-4 w-4" />Tạo cấu trúc thu nhập</Button> : null}
          </div>
          <div id="salary-structures" className="scroll-mt-4">
            {structures.length === 0 ? <div className="rounded-lg border border-dashed p-4 text-sm"><p className="font-medium">Chưa có cấu trúc thu nhập nào</p><p className="mt-1 text-xs text-muted-foreground">Tạo cấu trúc trước, chọn thành phần và phạm vi áp dụng. Sau đó có thể gán riêng từng người hoặc tự áp dụng cho chức danh/đơn vị.</p></div> : null}
            {structures.length > 0 ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{structures.map((s) => {
              const appliesToEmployee = (employee: PayrollAssignmentTarget) =>
                s.salaryBandId ? employee.salaryBandId === s.salaryBandId
                  : Boolean(s.jobTitle || s.orgUnitId) && (!s.jobTitle || employee.jobTitle === s.jobTitle)
                    && (!s.orgUnitId || employee.orgUnit?.id === s.orgUnitId);
              const matched = assignmentTargets.filter((employee) => appliesToEmployee(employee) || employee.currentStructureName === s.name);
              return <div key={s.id} className="rounded-lg border border-border bg-card p-4 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-medium text-foreground">{s.name}</h3><p className="mt-0.5 text-muted-foreground">{s.description || 'Cấu trúc thu nhập'}</p>
                    <p className="mt-1 font-medium">{s.salaryBand ? `Theo khung ${s.salaryBand.code} · ${s.salaryBand.name}` : s.jobTitle ? `Chức danh: ${s.jobTitle}` : s.orgUnit ? `Mọi chức danh tại ${s.orgUnit.name}` : 'Chỉ áp dụng khi gán riêng'}{!s.salaryBand && s.jobTitle && s.orgUnit ? ` · ${s.orgUnit.name}` : !s.salaryBand && s.jobTitle ? ' · Mọi đơn vị' : ''}</p>
                  </div><span className="shrink-0 text-right text-muted-foreground">{s._count?.assignments ?? 0} gán riêng<br />{s.positionEmployeeCount ?? 0} tự áp dụng</span>
                </div>
                <div className="border-t border-border pt-2 space-y-1">{s.salaryBand ? <><div className="flex justify-between gap-3"><span>Lương cơ bản</span><span className="font-medium">Theo hợp đồng/quyết định cá nhân</span></div><div className="rounded bg-muted/50 p-2 text-muted-foreground">Khung tham chiếu {s.salaryBand.minSalary.toLocaleString('vi-VN')}–{s.salaryBand.maxSalary.toLocaleString('vi-VN')} đ/{s.salaryBand.compensationBasis === 'MONTHLY' ? 'tháng' : s.salaryBand.compensationBasis === 'DAILY' ? 'ngày' : 'giờ'}; mức giữa {s.salaryBand.midSalary.toLocaleString('vi-VN')} đ. Khung không tự cộng hoặc thay mức đã thỏa thuận.</div></> : null}{s.items.length ? s.items.map((item) => <div key={item.id} className="flex justify-between gap-3"><span>{item.component.name}</span><span className="font-mono">{item.formula && item.component.code === 'LUNCH_ALLOW' ? `${item.amount.toLocaleString('vi-VN')} đ × ngày công thực tế` : `${item.amount.toLocaleString('vi-VN')} đ/tháng`}</span></div>) : !s.salaryBand ? <p className="text-muted-foreground">Chưa cấu hình khoản thu nhập bổ sung.</p> : null}</div>
                <details className="border-t border-border pt-2"><summary className="cursor-pointer">Xem {matched.length} nhân sự trong phạm vi</summary><ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-muted-foreground">{matched.map((employee) => <li key={employee.id}>{employee.fullName} · {employee.jobTitle || 'Chưa có chức danh'} · {employee.orgUnit?.name || 'Chưa xếp đơn vị'}{employee.currentStructureName === s.name ? ' · Gán riêng' : ''}</li>)}</ul></details>
                {canConfigurePayroll ? <div className="border-t border-border pt-2 flex justify-end"><Button variant="outline" size="sm" onClick={() => { setSelectedStructureId(s.id); setIsAssignModalOpen(true); }} className="h-7 text-xs">Gán riêng cho nhân viên</Button></div> : null}
              </div>;
            })}</div> : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Khung lương vị trí đã được duyệt · mức tham chiếu</h2>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground">Dùng các khung đang hiệu lực tại thời điểm hiện tại. Lương thực trả vẫn lấy từ hợp đồng/quyết định cá nhân; hệ thống đối chiếu với khoảng đã duyệt và báo trường hợp cần rà soát, không tự ý đổi lương hợp đồng.</p>
            </div>
            <Link href="/salary-bands" className="text-xs font-medium underline underline-offset-2">Quản lý khung lương</Link>
          </div>
          {approvedBands.length === 0 ? <EmptyState title="Chưa có khung lương vị trí được duyệt đang hiệu lực" description="Khung nháp hoặc khung hết hiệu lực không được dùng để đối chiếu lương." /> : <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {approvedBands.map((band) => {
              const basis = band.compensationBasis === 'MONTHLY' ? 'tháng' : band.compensationBasis === 'DAILY' ? 'ngày' : 'giờ';
              return <div key={band.id} className="rounded-lg border border-border bg-card p-4 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-mono text-muted-foreground">{band.code}</p><h3 className="mt-1 font-semibold">{band.name}</h3><p className="mt-1 text-muted-foreground">{band.levelTitle}</p></div>
                  <span className="shrink-0 text-right text-muted-foreground">Hiệu lực từ {new Date(band.effectiveFrom).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-y border-border py-3">
                  <div><p className="text-muted-foreground">Sàn</p><p className="mt-1 font-mono font-medium">{band.minSalary.toLocaleString('vi-VN')} đ/{basis}</p></div>
                  <div><p className="text-muted-foreground">Mức tham chiếu</p><p className="mt-1 font-mono font-medium">{band.midSalary.toLocaleString('vi-VN')} đ/{basis}</p></div>
                  <div><p className="text-muted-foreground">Trần</p><p className="mt-1 font-mono font-medium">{band.maxSalary.toLocaleString('vi-VN')} đ/{basis}</p></div>
                </div>
                <p className="mt-3 text-muted-foreground">{band.jobTitles.length} chức danh · {band.employeeCount} nhân sự khớp · {band.withinRange} trong khoảng · {band.belowRange} dưới sàn{band.aboveRange ? ` · ${band.aboveRange} trên trần` : ''}</p>
                {band.belowRange > 0 || band.aboveRange > 0 ? <p className="mt-2 text-amber-700">Cần đối chiếu hợp đồng/quyết định cá nhân; khung tham chiếu không tự làm thay đổi mức lương đã ký.</p> : null}
              </div>;
            })}
          </div>}
        </div>
      )}

      {/* ================= TAB 4: CHÍNH SÁCH LƯƠNG ================= */}
      {activeTab === 'policy' && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div><h2 className="text-sm font-semibold">Chính sách lương theo ngày hiệu lực</h2><p className="mt-1 max-w-3xl text-xs text-muted-foreground">Cấu hình thuế, bảo hiểm, lương tối thiểu vùng, làm thêm giờ và căn cứ áp dụng. Mỗi kỳ lương đã tính giữ nguyên bản chính sách tại thời điểm tính.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {payrollPolicies.length > 0 ? <select aria-label="Phiên bản chính sách" value={selectedPolicyVersion} onChange={(event) => {
                const policy = payrollPolicies.find((item) => item.version === event.target.value);
                if (policy) { setSelectedPolicyVersion(policy.version); setPolicySourceVersion(policy.version); setPolicyDraft(structuredClone(policy)); setIsNewPolicyVersion(false); }
              }} className="h-9 max-w-[260px] rounded-md border border-border bg-background px-3 text-xs">
                {payrollPolicies.map((policy) => <option key={policy.version} value={policy.version}>{policy.version} · từ {policy.effectiveFrom}</option>)}
              </select> : null}
              {canEditPayrollPolicy && policyDraft && payrollPolicies.length > 0 ? <Button variant="outline" size="sm" onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                const current = payrollPolicies.find((item) => item.version === selectedPolicyVersion) ?? policyDraft;
                setPolicySourceVersion(current.version);
                setPolicyDraft({ ...structuredClone(current), version: `VN-PAYROLL-${today.slice(0, 7).replace('-', '.')}.NEW`, effectiveFrom: today, effectiveTo: null });
                setIsNewPolicyVersion(true);
              }}><Plus className="mr-1.5 h-4 w-4" />Tạo phiên bản mới</Button> : null}
            </div>
          </div>
          {!policyDraft ? <EmptyState title="Chưa có dữ liệu chính sách lương" description="Không tìm thấy PAYROLL_POLICIES trong cấu hình hệ thống." /> : <>
            {isNewPolicyVersion ? <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">Đang tạo phiên bản mới. Khi lưu, phiên bản gốc sẽ kết thúc vào ngày trước ngày hiệu lực mới; các kỳ lương đã tính không bị sửa.</div> : null}
            {!canEditPayrollPolicy ? <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">Bạn có thể xem chính sách. Chỉ tài khoản Quản trị viên được lưu thay đổi.</div> : null}
            <fieldset disabled={!canEditPayrollPolicy} className="space-y-4 disabled:opacity-90">
              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Hiệu lực và căn cứ</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1 text-xs"><span className="text-muted-foreground">Mã phiên bản</span><input value={policyDraft.version} onChange={(e) => updatePolicy('version', e.target.value)} className="w-full rounded-md border border-border bg-background px-2.5 py-2" /></label>
                  <label className="space-y-1 text-xs"><span className="text-muted-foreground">Có hiệu lực từ</span><input type="date" value={policyDraft.effectiveFrom} onChange={(e) => updatePolicy('effectiveFrom', e.target.value)} className="w-full rounded-md border border-border bg-background px-2.5 py-2" /></label>
                  <label className="space-y-1 text-xs"><span className="text-muted-foreground">Có hiệu lực đến (để trống nếu còn hiệu lực)</span><input type="date" value={policyDraft.effectiveTo ?? ''} onChange={(e) => updatePolicy('effectiveTo', e.target.value || null)} className="w-full rounded-md border border-border bg-background px-2.5 py-2" /></label>
                </div>
                <label className="block space-y-1 text-xs"><span className="text-muted-foreground">Căn cứ pháp lý / chính sách đãi ngộ doanh nghiệp</span><textarea rows={3} value={policyDraft.basisReference} onChange={(e) => updatePolicy('basisReference', e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" /></label>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Bảo hiểm và giới hạn đóng</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {policyRateField('NLĐ · BHXH', policyDraft.employeeRates.socialInsurance, (v) => updatePolicy('employeeRates', { ...policyDraft.employeeRates, socialInsurance: v }))}
                  {policyRateField('NLĐ · BHYT', policyDraft.employeeRates.healthInsurance, (v) => updatePolicy('employeeRates', { ...policyDraft.employeeRates, healthInsurance: v }))}
                  {policyRateField('NLĐ · BHTN', policyDraft.employeeRates.unemployment, (v) => updatePolicy('employeeRates', { ...policyDraft.employeeRates, unemployment: v }))}
                  {policyRateField('Doanh nghiệp · BHXH', policyDraft.employerRates.socialInsurance, (v) => updatePolicy('employerRates', { ...policyDraft.employerRates, socialInsurance: v }))}
                  {policyRateField('Doanh nghiệp · BHYT', policyDraft.employerRates.healthInsurance, (v) => updatePolicy('employerRates', { ...policyDraft.employerRates, healthInsurance: v }))}
                  {policyRateField('Doanh nghiệp · BHTN', policyDraft.employerRates.unemployment, (v) => updatePolicy('employerRates', { ...policyDraft.employerRates, unemployment: v }))}
                  {policyRateField('Tai nạn lao động · doanh nghiệp', policyDraft.employerRates.occupationalAccident, (v) => updatePolicy('employerRates', { ...policyDraft.employerRates, occupationalAccident: v }))}
                  {policyRateField('Kinh phí công đoàn · doanh nghiệp', policyDraft.employerRates.tradeUnionFund, (v) => updatePolicy('employerRates', { ...policyDraft.employerRates, tradeUnionFund: v }))}
                  {policyNumberField('Trần tiền lương đóng BHXH', policyDraft.bhxhCap, (v) => updatePolicy('bhxhCap', v))}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Thuế thu nhập cá nhân</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {policyNumberField('Giảm trừ bản thân', policyDraft.personalRelief, (v) => updatePolicy('personalRelief', v))}
                  {policyNumberField('Giảm trừ mỗi người phụ thuộc', policyDraft.dependentRelief, (v) => updatePolicy('dependentRelief', v))}
                  {policyRateField('Thuế suất cá nhân không cư trú', policyDraft.nonResidentTaxRate, (v) => updatePolicy('nonResidentTaxRate', v))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><p className="text-xs font-medium">Biểu thuế lũy tiến (ngưỡng trên của bậc · thuế suất)</p><Button variant="outline" size="sm" onClick={() => updatePolicy('taxBrackets', [...policyDraft.taxBrackets.slice(0, -1), [0, 0], [null, policyDraft.taxBrackets.at(-1)?.[1] ?? 0]])}><Plus className="mr-1 h-3.5 w-3.5" />Thêm bậc</Button></div>
                  {policyDraft.taxBrackets.map((bracket, index) => <div key={index} className="grid grid-cols-[1fr_120px_auto] items-end gap-2">
                    <label className="space-y-1 text-xs"><span className="text-muted-foreground">{bracket[0] === null ? 'Bậc cuối · không giới hạn' : `Ngưỡng bậc ${index + 1}`}</span><input type="number" min="0" disabled={bracket[0] === null} value={bracket[0] ?? ''} onChange={(e) => { const next = [...policyDraft.taxBrackets] as [number | null, number][]; next[index] = [e.target.value === '' ? null : Number(e.target.value), next[index][1]]; updatePolicy('taxBrackets', next); }} className="w-full rounded-md border border-border bg-background px-2.5 py-2 disabled:bg-muted" /></label>
                    {policyRateField(`Thuế suất bậc ${index + 1}`, bracket[1], (v) => { const next = [...policyDraft.taxBrackets] as [number | null, number][]; next[index] = [next[index][0], v]; updatePolicy('taxBrackets', next); })}
                    <Button variant="ghost" size="sm" disabled={policyDraft.taxBrackets.length <= 1} onClick={() => updatePolicy('taxBrackets', policyDraft.taxBrackets.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                  </div>)}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Lương tối thiểu và trần BHTN theo vùng</h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(['I', 'II', 'III', 'IV'] as const).map((region) => <div key={region} className="space-y-3 rounded-md border border-border p-3"><h4 className="text-xs font-semibold">Vùng {region}</h4>
                  {policyNumberField('Tối thiểu tháng', policyDraft.minimumWageByRegion[region] ?? 0, (v) => updatePolicy('minimumWageByRegion', { ...policyDraft.minimumWageByRegion, [region]: v }))}
                  {policyNumberField('Tối thiểu giờ', policyDraft.minimumHourlyWageByRegion?.[region] ?? 0, (v) => updatePolicy('minimumHourlyWageByRegion', { ...(policyDraft.minimumHourlyWageByRegion ?? {}), [region]: v }))}
                  {policyNumberField('Trần BHTN', policyDraft.unemploymentCapByRegion[region] ?? 0, (v) => updatePolicy('unemploymentCapByRegion', { ...policyDraft.unemploymentCapByRegion, [region]: v }))}
                </div>)}</div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Làm thêm giờ và khấu trừ</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {policyNumberField('OT ngày thường · hệ số', policyDraft.overtimeRates.weekday, (v) => updatePolicy('overtimeRates', { ...policyDraft.overtimeRates, weekday: v }), '×', '0.1')}
                  {policyNumberField('OT ngày nghỉ hằng tuần · hệ số', policyDraft.overtimeRates.weeklyRest, (v) => updatePolicy('overtimeRates', { ...policyDraft.overtimeRates, weeklyRest: v }), '×', '0.1')}
                  {policyNumberField('OT ngày lễ · hệ số', policyDraft.overtimeRates.publicHoliday, (v) => updatePolicy('overtimeRates', { ...policyDraft.overtimeRates, publicHoliday: v }), '×', '0.1')}
                  {policyNumberField('Cộng thêm làm ban đêm · hệ số', policyDraft.overtimeRates.nightAdditional, (v) => updatePolicy('overtimeRates', { ...policyDraft.overtimeRates, nightAdditional: v }), '×', '0.1')}
                  {policyNumberField('Giới hạn OT tháng', policyDraft.maxMonthlyOvertimeHours, (v) => updatePolicy('maxMonthlyOvertimeHours', v), 'giờ', '1')}
                  {policyNumberField('Giới hạn OT năm', policyDraft.maxAnnualOvertimeHours, (v) => updatePolicy('maxAnnualOvertimeHours', v), 'giờ', '1')}
                  {policyRateField('Trần khấu trừ khoản vay', policyDraft.loanDeductionCapRate, (v) => updatePolicy('loanDeductionCapRate', v))}
                </div>
              </section>
            </fieldset>
            {canEditPayrollPolicy ? <div className="flex justify-end"><Button disabled={savePolicyMutation.isPending || !policyDraft.version.trim() || !policyDraft.basisReference.trim()} onClick={() => savePolicyMutation.mutate()}><Save className="mr-1.5 h-4 w-4" />{savePolicyMutation.isPending ? 'Đang lưu…' : isNewPolicyVersion ? 'Lưu phiên bản mới' : 'Lưu chính sách'}</Button></div> : null}
          </>}
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
                disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-foreground focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-muted-foreground">Phân loại *</label>
              <Select
                value={compType}
                onChange={(e) => setCompType(e.target.value as 'EARNING' | 'DEDUCTION')}
                disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
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
              disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
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
                disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-foreground focus:outline-hidden"
              />
            </div>
            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                <input
                  type="checkbox"
                  checked={compTax}
                  onChange={(e) => setCompTax(e.target.checked)}
                  disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
                  className="rounded border-border"
                />
                Tính vào Thuế TNCN
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground mt-3">
                <input
                  type="checkbox"
                  checked={compInsurance}
                  onChange={(e) => setCompInsurance(e.target.checked)}
                  disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
                  className="rounded border-border"
                />
                Tính vào căn cứ bảo hiểm khi khoản này được thỏa thuận trả thường xuyên, ổn định
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground mt-3">
                <input
                  type="checkbox"
                  checked={compOvertime}
                  onChange={(e) => setCompOvertime(e.target.checked)}
                  disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
                  className="rounded border-border"
                />
                Tính vào tiền lương giờ làm căn cứ OT (lương theo công việc/chức danh, khoản trả thường xuyên)
              </label>
            </div>
          </div>

          {!editingComponent || !SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code) ? <div className="grid grid-cols-2 gap-3">
            <div className="text-muted-foreground">Cách tính khoản lương
              <label className="mt-2 flex items-center gap-2 text-foreground"><input type="checkbox" checked={compFormulaBased} onChange={(e) => setCompFormulaBased(e.target.checked)} /> Tính bằng công thức</label>
            </div>
            {compFormulaBased && <div><label className="text-muted-foreground">Công thức (ví dụ: baseSalary * 0.05)</label><input value={compFormula} onChange={(e) => setCompFormula(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-foreground" /></div>}
          </div> : <p className="rounded-md bg-muted/40 p-2 text-muted-foreground">Mức luật định được tính bởi bộ quy tắc lương có ngày hiệu lực; tại đây có thể quản lý và sửa căn cứ pháp lý.</p>}

          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-muted-foreground">Nguồn căn cứ *</label>
              <Select value={compBasisType} onChange={(e) => setCompBasisType(e.target.value as SalaryComponent['basisType'])} className="mt-1 w-full text-xs">
                <option value="LAW">Điều luật / quy định</option>
                <option value="COMPANY_POLICY">Chính sách đãi ngộ doanh nghiệp</option>
                <option value="CONTRACT">Hợp đồng / quyết định cá nhân</option>
                <option value="SYSTEM">Quy tắc hệ thống</option>
              </Select>
            </div>
            <div><label className="text-muted-foreground">Số văn bản, điều khoản hoặc mã chính sách *</label><input value={compBasisReference} onChange={(e) => setCompBasisReference(e.target.value)} placeholder="VD: Quy chế đãi ngộ C&B số ... / Điều ..." className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-foreground" /></div>
          </div>

          <div>
            <label className="text-muted-foreground">Ghi chú</label>
            <textarea
              rows={2}
              value={compDesc}
              onChange={(e) => setCompDesc(e.target.value)}
              disabled={!!editingComponent && SYSTEM_MANAGED_PAYROLL_CODES.has(editingComponent.code)}
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
                  isFormulaBased: compFormulaBased,
                  formula: compFormulaBased ? compFormula : undefined,
                  basisType: compBasisType,
                  basisReference: compBasisReference,
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
                isFormulaBased: compFormulaBased,
                formula: compFormulaBased ? compFormula : undefined,
                basisType: compBasisType,
                basisReference: compBasisReference,
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
        description="Mức lương nền lấy từ hợp đồng/quyết định. Chọn chức danh để tự áp dụng các thành phần; có thể giới hạn vào một đơn vị cụ thể. Gán trực tiếp cho cá nhân sẽ được ưu tiên hơn quy tắc chức danh."
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Chức danh (tùy chọn)</label>
              <Select value={newStructureJobTitle} onChange={(e) => setNewStructureJobTitle(e.target.value)} className="w-full text-sm">
                <option value="">Mọi chức danh / chưa chọn</option>
                {payrollJobTitles.map((title) => <option key={title} value={title}>{title}</option>)}
              </Select>
              <p className="text-xs text-muted-foreground">Chọn chức danh để áp dụng theo vị trí; để trống và chọn đơn vị sẽ áp dụng cho cả bộ phận.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Bộ phận / đơn vị (tùy chọn)</label>
              <Select value={newStructureOrgUnitId} onChange={(e) => setNewStructureOrgUnitId(e.target.value)} className="w-full text-sm">
                <option value="">Tất cả đơn vị</option>
                {payrollOrgUnits.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </Select>
              <p className="text-xs text-muted-foreground">Chọn đơn vị để áp dụng toàn bộ bộ phận; nếu đã chọn chức danh thì chỉ áp dụng chức danh đó trong đơn vị. Để trống cả hai trường, cấu trúc chỉ dùng khi gán riêng.</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold">Thành phần áp dụng</p>
            <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border">
              {components.filter((component) => !SYSTEM_MANAGED_PAYROLL_CODES.has(component.code)).map((component) => {
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
          disabled={!newStructureName.trim() || Object.keys(newStructureItems).length === 0 || Object.values(newStructureItems).some((amount) => !Number.isFinite(amount) || amount <= 0)}
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
        size="2xl"
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
                  {selectedSlip.breakdown?.calculation?.attendance ? (() => {
                    const attendance = selectedSlip.breakdown!.calculation!.attendance!;
                    const overtime = selectedSlip.breakdown!.calculation!.approvedOvertime ?? [];
                    const requests = selectedSlip.breakdown!.calculation!.overtimeRequests ?? [];
                    return <section className="rounded-md border border-border bg-background p-3 space-y-2">
                      <div className="flex flex-wrap justify-between gap-2"><b>Nguồn tính và đối soát ngày công</b><span>{selectedSlip.breakdown!.calculation!.salarySource === 'EMPLOYEE_ASSIGNMENT' ? 'Lương cơ bản theo gán riêng cho nhân sự' : selectedSlip.breakdown!.calculation!.salarySource === 'CONTRACT' ? 'Lương cơ bản theo hợp đồng hiệu lực' : selectedSlip.breakdown!.calculation!.salarySource === 'PROFILE_FALLBACK' ? 'Lương cơ bản lấy từ hồ sơ nhân sự — chưa có hợp đồng hiệu lực' : selectedSlip.breakdown!.calculation!.salarySource === 'MIXED' ? 'Có nhiều nguồn lương trong kỳ; xem chi tiết từng khoản' : 'Phiếu lịch sử chưa lưu thông tin nguồn lương'}</span></div>
                      <p>Cấu trúc phụ cấp: <b>{selectedSlip.breakdown!.calculation!.salaryStructureName || 'Không áp dụng'}</b> ({selectedSlip.breakdown!.calculation!.salaryStructureSource === 'EMPLOYEE_ASSIGNMENT' ? 'gán riêng' : selectedSlip.breakdown!.calculation!.salaryStructureSource === 'POSITION_RULE' ? 'theo chức danh / đơn vị' : selectedSlip.breakdown!.calculation!.salaryStructureSource === 'MIXED' ? 'thay đổi trong kỳ' : selectedSlip.breakdown!.calculation!.salaryStructureSource === 'NONE' ? 'chưa cấu hình' : 'phiếu lịch sử chưa lưu nguồn cấu trúc'}) · Hợp đồng: <b>{selectedSlip.breakdown!.calculation!.contractNo || (selectedSlip.breakdown!.calculation!.salarySource ? 'Không có hợp đồng hiệu lực' : 'Phiếu lịch sử chưa lưu mã hợp đồng')}</b></p>
                      {selectedSlip.breakdown!.calculation!.payRatesUsed?.length ? <p>Mức căn cứ: {selectedSlip.breakdown!.calculation!.payRatesUsed!.map((item) => `${item.rate.toLocaleString('vi-VN')} đ/${item.basis === 'DAILY' ? 'ngày' : item.basis === 'HOURLY' ? 'giờ' : 'tháng'}`).join(' · ')}. Số ở cột lương cơ bản là giá trị quy đổi theo kỳ để đối soát.</p> : null}
                      {(selectedSlip.breakdown!.calculation!.salaryBandReview?.bands ?? []).map((band) => <p key={band.code}>Khung {band.code} – {band.name}: {band.minSalary.toLocaleString('vi-VN')}–{band.maxSalary.toLocaleString('vi-VN')} đ/{band.compensationBasis === 'DAILY' ? 'ngày' : band.compensationBasis === 'HOURLY' ? 'giờ' : 'tháng'}; {band.status === 'IN_RANGE' ? 'lương căn cứ trong khoảng' : band.status === 'BELOW_RANGE' ? 'lương căn cứ dưới sàn, cần rà soát hợp đồng/quyết định' : band.status === 'ABOVE_RANGE' ? 'lương căn cứ trên trần, cần rà soát' : band.status === 'BASIS_MISMATCH' ? 'khác cơ sở trả lương, cần đối chiếu' : 'có thay đổi khung trong kỳ'} ({band.days} ngày).</p>)}
                      <p>Lịch chuẩn {attendance.standardDays} ngày / {attendance.scheduledHours} giờ; công hưởng lương {attendance.paidDays}; thời gian ghi nhận {attendance.workedHours} giờ; thiếu giờ {attendance.shortHours} giờ.</p>
                      {selectedSlip.breakdown!.calculation!.attendanceWageReduction !== undefined ? <p className="font-semibold">Thu nhập theo đủ lịch − thu nhập được hưởng theo công = giảm do thiếu công: {selectedSlip.breakdown!.calculation!.expectedCompensation?.toLocaleString('vi-VN')} đ − {selectedSlip.breakdown!.calculation!.earnedCompensation?.toLocaleString('vi-VN')} đ = <span className="text-rose-700">{selectedSlip.breakdown!.calculation!.attendanceWageReduction!.toLocaleString('vi-VN')} đ</span>. Con số này gồm lương căn cứ và các khoản thu nhập trong cấu trúc bị tính theo tỷ lệ công; thuế, bảo hiểm, OT và khấu trừ khác được tính riêng.</p> : null}
                      <p>Đi muộn {attendance.lateDays} ngày / {attendance.lateMinutes} phút; về sớm {attendance.earlyLeaveDays} ngày / {attendance.earlyLeaveMinutes} phút; vắng {attendance.absenceDays} ngày; phép năm hưởng lương {attendance.paidLeaveDays} ngày; nghỉ không lương {attendance.unpaidLeaveDays} ngày; nghỉ ốm/thai sản ghi nhận theo chế độ BHXH {attendance.socialInsuranceLeaveDays} ngày.</p>
                      {attendance.missingPairDays > 0 ? <p className="font-semibold text-rose-700">Có {attendance.missingPairDays} ngày thiếu cặp vào/ra cần đối soát.</p> : null}
                      {(selectedSlip.breakdown!.calculation!.attendanceDays ?? []).length > 0 ? <div className="max-h-64 overflow-auto"><table className="w-full text-left"><thead><tr><th>Ngày</th><th>Trạng thái</th><th>Giờ chuẩn</th><th>Giờ ghi nhận</th><th>Muộn / sớm</th></tr></thead><tbody>{selectedSlip.breakdown!.calculation!.attendanceDays!.map((day) => <tr key={day.workDate}><td>{day.workDate}</td><td>{day.status === 'ON_LEAVE' ? (day.leaveType === 'ANNUAL' ? 'Phép năm hưởng lương' : day.leaveType === 'UNPAID' ? 'Nghỉ không lương' : `${day.leaveType === 'SICK' ? 'Nghỉ ốm' : 'Thai sản'} · BHXH`) : day.status === 'HOLIDAY' ? 'Ngày lễ' : day.status === 'ABSENT' ? 'Vắng' : day.status === 'LATE' ? 'Đi muộn' : day.status === 'EARLY_LEAVE' ? 'Về sớm' : day.status === 'MISSING_PAIR' ? 'Thiếu cặp công' : 'Đủ công'}</td><td>{(day.scheduledMinutes / 60).toFixed(2)}</td><td>{(day.workedMinutes / 60).toFixed(2)}</td><td>{day.lateMinutes} / {day.earlyMinutes} phút</td></tr>)}</tbody></table></div> : null}
                      <p>OT đã duyệt: {overtime.reduce((sum, item) => sum + item.hours, 0)} giờ · Tiền OT {overtime.reduce((sum, item) => sum + item.pay, 0).toLocaleString('vi-VN')} đ. Yêu cầu OT đang chờ duyệt: {requests.filter((item) => item.status === 'PENDING').reduce((sum, item) => sum + item.hours, 0)} giờ; chưa được tính vào lương.</p>
                      {overtime.length > 0 ? <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Ngày</th><th>Loại ngày</th><th>Giờ</th><th>Giờ đêm</th><th>Đơn giá giờ</th><th className="text-right">Tiền OT</th></tr></thead><tbody>{overtime.map((item) => <tr key={`${item.workDate}-${item.category}`}><td>{item.workDate}</td><td>{item.category === 'PUBLIC_HOLIDAY' ? 'Lễ' : item.category === 'WEEKLY_REST' ? 'Nghỉ tuần' : 'Ngày thường'}</td><td>{item.hours}</td><td>{item.nightHours}</td><td>{item.hourlyRate.toLocaleString('vi-VN')} đ</td><td className="text-right">{item.pay.toLocaleString('vi-VN')} đ</td></tr>)}</tbody></table></div> : null}
                    </section>;
                  })() : null}
                  <p>Công được hưởng: {selectedSlip.actualWorkDays ?? 0}/{selectedSlip.workingDays ?? 0} ngày</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><b>Các khoản thu nhập</b>{(selectedSlip.breakdown?.earnings ?? []).map((line, i) => <div className="flex justify-between gap-3 border-b border-border/60 py-1" key={i}><span>{line.name}<small className="block text-muted-foreground">{line.basisReference || 'Phiếu cũ chưa lưu căn cứ'}</small></span><span className="shrink-0">{line.amount.toLocaleString('vi-VN')} đ</span></div>)}</div>
                    <div><b>Các khoản khấu trừ</b>{(selectedSlip.breakdown?.deductions ?? []).map((line, i) => <div className="flex justify-between gap-3 border-b border-border/60 py-1" key={i}><span>{line.name}<small className="block text-muted-foreground">{line.basisReference || 'Phiếu cũ chưa lưu căn cứ'}</small></span><span className="shrink-0">{line.amount.toLocaleString('vi-VN')} đ</span></div>)}</div>
                  </div>
                  {selectedSlip.breakdown?.calculation?.overtimeBasis && <p>Căn cứ OT: ({selectedSlip.breakdown.calculation.overtimeBasis.contractualMonthlyWage.toLocaleString('vi-VN')} đ/tháng ÷ {selectedSlip.breakdown.calculation.overtimeBasis.standardHours.toLocaleString('vi-VN')} giờ chuẩn) = {selectedSlip.breakdown.calculation.overtimeBasis.hourlyRate.toLocaleString('vi-VN')} đ/giờ. Cấu phần lương tính vào căn cứ OT được thiết lập trong danh mục thành phần lương.</p>}
                  {selectedSlip.breakdown?.calculation?.minimumWageReview?.status === 'REVIEW' && <div className="rounded-md border border-amber-400/60 bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
                    <b>Cần rà soát mức lương tối thiểu vùng {selectedSlip.breakdown.calculation.minimumWageReview.region}.</b>
                    {selectedSlip.breakdown.calculation.minimumWageReview.monthlyBelowMinimum && <p>Lương thỏa thuận đang tính ({selectedSlip.breakdown.calculation.minimumWageReview.contractualMonthlyWage.toLocaleString('vi-VN')} đ/tháng) thấp hơn mốc tháng {selectedSlip.breakdown.calculation.minimumWageReview.monthlyMinimum?.toLocaleString('vi-VN')} đ.</p>}
                    {selectedSlip.breakdown.calculation.minimumWageReview.hourlyBelowMinimum && <p>Quy đổi theo lịch chuẩn ({selectedSlip.breakdown.calculation.minimumWageReview.hourlyEquivalent.toLocaleString('vi-VN')} đ/giờ) thấp hơn mốc giờ {selectedSlip.breakdown.calculation.minimumWageReview.hourlyMinimum?.toLocaleString('vi-VN')} đ.</p>}
                    <p>Đối chiếu hình thức trả lương, thời giờ bình thường và hợp đồng trước khi duyệt; đây là cảnh báo, không tự chặn kỳ lương.</p>
                  </div>}
                  {selectedSlip.breakdown?.calculation?.salaryBandReview?.bands.some((band) => band.status !== 'IN_RANGE') ? <div className="border-y border-border py-3 text-xs"><b>Đối chiếu khung lương vị trí đã duyệt</b>{selectedSlip.breakdown?.calculation?.salaryBandReview?.bands.map((band) => <p key={band.code} className="mt-1">{band.code}: {band.minSalary.toLocaleString('vi-VN')}–{band.maxSalary.toLocaleString('vi-VN')} đ · {band.status === 'BELOW_RANGE' ? 'Mức hợp đồng dưới sàn' : band.status === 'ABOVE_RANGE' ? 'Mức hợp đồng trên trần' : band.status === 'BASIS_MISMATCH' ? 'Khác cơ sở trả lương' : 'Khung thay đổi trong kỳ'}. Hãy đối chiếu hồ sơ lương đã duyệt; bảng lương không tự thay đổi hợp đồng.</p>)}</div> : null}
                  {selectedSlip.breakdown?.calculation && <p>Thuế năm {selectedSlip.breakdown.calculation.year}: giảm trừ bản thân {selectedSlip.breakdown.calculation.personalRelief.toLocaleString('vi-VN')} đ; người phụ thuộc {selectedSlip.breakdown.calculation.dependentRelief.toLocaleString('vi-VN')} đ; thu nhập tính thuế {selectedSlip.breakdown.calculation.taxableIncome.toLocaleString('vi-VN')} đ.</p>}
                  <p className="font-bold">Thực lĩnh = {selectedSlip.grossPay.toLocaleString('vi-VN')} − {selectedSlip.totalDeduction.toLocaleString('vi-VN')} = {selectedSlip.netPay.toLocaleString('vi-VN')} đ</p>
                </div>

              </div>
            ) : (
              /* TAB: PHIẾU LƯƠNG CHUẨN IN ẤN (PRINTABLE DOC) */
              <div id="print-payslip-doc" className="print-area print-payslip space-y-3 text-xs font-sans">
                <style jsx global>{`
                  #print-payslip-doc {
                    box-sizing: border-box;
                    width: 210mm;
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 15mm 15mm 15mm 20mm;
                    background: #fff;
                    color: #000;
                    font-family: "Times New Roman", Times, serif;
                    font-size: 10pt;
                    line-height: 1.3;
                  }
                  #print-payslip-doc header { display: block; }
                  @media print {
                    #print-payslip-doc { width: 210mm !important; max-width: 210mm !important; margin: 0 !important; padding: 15mm 15mm 15mm 20mm !important; font-size: 10pt !important; line-height: 1.3 !important; }
                    #print-payslip-doc > header { display: block !important; visibility: visible !important; }
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
                    <tr><th>Mức căn cứ hợp đồng</th><td>{(selectedSlip.breakdown?.calculation?.payRatesUsed ?? []).map((item) => `${item.rate.toLocaleString('vi-VN')} VND/${item.basis === 'DAILY' ? 'ngày' : item.basis === 'HOURLY' ? 'giờ' : 'tháng'}`).join('; ') || `${selectedSlip.baseSalary.toLocaleString('vi-VN')} VND`}</td></tr>
                      <tr><th>Ngày công hưởng lương</th><td>{selectedSlip.actualWorkDays ?? 0}/{selectedSlip.workingDays ?? 0} công</td></tr>
                    {selectedSlip.breakdown?.calculation?.attendanceWageReduction !== undefined ? <tr><th>Giảm thu nhập do thiếu công</th><td>{selectedSlip.breakdown.calculation.attendanceWageReduction.toLocaleString('vi-VN')} VND</td></tr> : null}
                    </tbody>
                  </table>
                </section>

                {selectedSlip.breakdown?.calculation?.attendance ? <section className="payslip-section">
                  <h3 className="font-bold uppercase">Đối soát thời gian và làm thêm</h3>
                  <table><tbody>
                    <tr><th>Lịch chuẩn / giờ chuẩn</th><td>{selectedSlip.breakdown.calculation.attendance.standardDays} ngày / {selectedSlip.breakdown.calculation.attendance.scheduledHours} giờ</td></tr>
                    <tr><th>Giờ đã ghi nhận / thiếu giờ</th><td>{selectedSlip.breakdown.calculation.attendance.workedHours} giờ / {selectedSlip.breakdown.calculation.attendance.shortHours} giờ</td></tr>
                    <tr><th>Đi muộn / về sớm</th><td>{selectedSlip.breakdown.calculation.attendance.lateDays} ngày ({selectedSlip.breakdown.calculation.attendance.lateMinutes} phút) / {selectedSlip.breakdown.calculation.attendance.earlyLeaveDays} ngày ({selectedSlip.breakdown.calculation.attendance.earlyLeaveMinutes} phút)</td></tr>
                    <tr><th>Vắng / phép năm hưởng lương / nghỉ không lương</th><td>{selectedSlip.breakdown.calculation.attendance.absenceDays} / {selectedSlip.breakdown.calculation.attendance.paidLeaveDays} / {selectedSlip.breakdown.calculation.attendance.unpaidLeaveDays} ngày</td></tr>
                    <tr><th>Nghỉ ốm / thai sản</th><td>{selectedSlip.breakdown.calculation.attendance.socialInsuranceLeaveDays} ngày; đối soát theo hồ sơ chế độ BHXH</td></tr>
                    <tr><th>Làm thêm đã duyệt</th><td>{(selectedSlip.breakdown.calculation.approvedOvertime ?? []).map((ot) => `${ot.workDate}: ${ot.hours} giờ (${ot.category === 'PUBLIC_HOLIDAY' ? 'ngày lễ' : ot.category === 'WEEKLY_REST' ? 'nghỉ tuần' : 'ngày thường'})`).join('; ') || 'Không có'}</td></tr>
                  </tbody></table>
                </section> : null}

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
