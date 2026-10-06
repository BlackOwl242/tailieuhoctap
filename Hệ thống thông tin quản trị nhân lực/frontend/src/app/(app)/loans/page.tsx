'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Plus, CheckCircle2, Clock, Calculator,
  Filter, Search, ArrowRight, ShieldCheck, AlertCircle,
  TrendingDown, DollarSign, Wallet, FileText, Check, X,
  Printer, Eye, Sparkles, Sliders, Layers, ArrowUpRight,
  HelpCircle, RefreshCw, Calendar, Building2, User,
  ChevronRight, Laptop, HeartPulse, GraduationCap, Home,
  AlertTriangle, CheckCircle, Percent, LayoutGrid, Table as TableIcon,
  Bot, ShieldAlert, ArrowDownCircle, BadgeCheck
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { Button, Input, Select, Textarea } from '@/components/ui/primitives';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { Portal } from '@/components/ui/portal';
import { printDocumentElement } from '@/components/ui/print';
import { formatDate } from '@/lib/utils';
import { useOrgConfig } from '@/lib/org-config';

export interface LoanItem {
  id: string;
  userId: string;
  employeeName: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyEmi: number;
  totalRepaid: number;
  remainingAmount: number;
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'COMPLETED' | 'REJECTED';
  reason?: string;
  disbursedAt?: string;
  approverName?: string;
  payrollDeductionAuthorizedAt?: string | null;
  disbursementMethod?: 'CASH' | 'BANK' | null;
  disbursementReference?: string | null;
  createdAt: string;
}

interface EmployeeOption {
  id: string;
  fullName: string;
  employeeCode?: string;
  email?: string;
  orgUnit?: { name: string };
  jobTitle?: string;
}

// 4 gói vay mẫu dùng để minh họa giao diện; chưa phải chính sách doanh nghiệp.
// Gói, hạn mức và lãi suất bên dưới là dữ liệu minh họa, chưa phải chính sách doanh nghiệp.
const PRESET_PACKAGES = [
  {
    id: 'pkg-tech',
    title: 'Vay phúc lợi mua thiết bị làm việc',
    category: 'Vay phúc lợi mua thiết bị làm việc',
    icon: Laptop,
    badge: 'Gói minh họa',
    badgeColor: 'bg-muted text-foreground border-border',
    amount: 28000000,
    term: 12,
    rate: 0,
    highlight: 'Mức lãi và điều kiện cần chính sách doanh nghiệp phê duyệt.',
    description: 'Dành cho nhân sự chính thức cần nâng cấp máy trạm, laptop đồ họa hoặc trang thiết bị kỹ thuật phục vụ dự án.',
    eligibility: 'Điều kiện mẫu; chưa cấu hình chính sách thật.',
  },
  {
    id: 'pkg-emergency',
    title: 'Hỗ Trợ Khẩn Cấp Y Tế & Gia Đình',
    category: 'Hỗ trợ khẩn cấp y tế gia đình',
    icon: HeartPulse,
    badge: 'Gói minh họa',
    badgeColor: 'bg-muted text-foreground border-border',
    amount: 25000000,
    term: 10,
    rate: 0,
    highlight: 'Mức lãi và điều kiện cần chính sách doanh nghiệp phê duyệt.',
    description: 'Hỗ trợ tài chính đột xuất khi người lao động hoặc thân nhân trực hệ gặp biến cố sức khỏe, viện phí khẩn cấp.',
    eligibility: 'Điều kiện mẫu; chưa cấu hình chính sách thật.',
  },
  {
    id: 'pkg-education',
    title: 'Vay Học Tập & Nâng Cao Nghiệp Vụ',
    category: 'Vay học tập & nâng cao nghiệp vụ',
    icon: GraduationCap,
    badge: 'Gói minh họa',
    badgeColor: 'bg-muted text-foreground border-border',
    amount: 40000000,
    term: 20,
    rate: 2,
    highlight: 'Mức lãi và điều kiện cần chính sách doanh nghiệp phê duyệt.',
    description: 'Tài trợ học thạc sĩ, chứng chỉ nghề nghiệp quốc tế (PMP, CFA, AWS, ACCA, SHRM, DevOps...) phục vụ tổ chức.',
    eligibility: 'Điều kiện mẫu; chưa cấu hình chính sách thật.',
  },
  {
    id: 'pkg-housing',
    title: 'Phúc Lợi An Cư & Gắn Bó Thâm Niên',
    category: 'Phúc lợi an cư & Gắn bó thâm niên',
    icon: Home,
    badge: 'Gói minh họa',
    badgeColor: 'bg-muted text-foreground border-border',
    amount: 80000000,
    term: 36,
    rate: 3.5,
    highlight: 'Mức lãi và điều kiện cần chính sách doanh nghiệp phê duyệt.',
    description: 'Hỗ trợ người lao động sửa chữa nhà ở, trang trải phương tiện ổn định cuộc sống an tâm công tác lâu dài.',
    eligibility: 'Điều kiện mẫu; chưa cấu hình chính sách thật.',
  },
];

export default function LoansPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canDisburse = roles.some((role) => ['ADMIN', 'ACCOUNTANT'].includes(role));
  const [printConfig] = useOrgConfig();

  // Navigation View Mode & Filter
  const [activeTab, setActiveTab] = useState<'ledger' | 'pipeline' | 'simulator' | 'packages'>('ledger');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAiAdvisor, setShowAiAdvisor] = useState(true);

  // Modals & Drawers State
  const [isApplyWizardOpen, setIsApplyWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedDetailLoan, setSelectedDetailLoan] = useState<LoanItem | null>(null);
  const [isPrintLoanOpen, setIsPrintLoanOpen] = useState(false);
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [disbursementMethod, setDisbursementMethod] = useState<'CASH' | 'BANK'>('BANK');
  const [disbursementReference, setDisbursementReference] = useState('');
  const [repayLoanTarget, setRepayLoanTarget] = useState<LoanItem | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);

  // Form State (Đăng ký mới thông minh)
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetEmployeeName, setTargetEmployeeName] = useState<string>('');
  const [targetEstimatedSalary, setTargetEstimatedSalary] = useState<number>(25000000);
  const [loanType, setLoanType] = useState('Vay phúc lợi mua thiết bị làm việc');
  const [principalAmount, setPrincipalAmount] = useState(28000000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(0);
  const [reason, setReason] = useState('Nâng cấp máy trạm đồ họa phục vụ dự án công nghệ');
  const [payrollDeductionAuthorized, setPayrollDeductionAuthorized] = useState(false);

  // Simulator Studio State
  const [simAmount, setSimAmount] = useState(30000000);
  const [simMonths, setSimMonths] = useState(12);
  const [simSalary, setSimSalary] = useState(25000000);
  const [simRate, setSimRate] = useState(0);

  // Queries
  const { data: loans, isLoading, isError, error, refetch } = useQuery<LoanItem[]>({
    queryKey: ['hrms-loans'],
    queryFn: async () => (await api.get('/hrms/loans')).data,
  });

  const { data: employeeList } = useQuery<EmployeeOption[]>({
    queryKey: ['employees-for-loans'],
    queryFn: async () => (await api.get('/employees')).data,
  });

  // Mutations
  const applyMutation = useMutation({
    mutationFn: async (payload: {
      userId: string;
      employeeName: string;
      loanType: string;
      principalAmount: number;
      termMonths: number;
      interestRate: number;
      reason: string;
      payrollDeductionAuthorized: boolean;
    }) => {
      return (await api.post('/hrms/loans/apply', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-loans'] });
      setIsApplyWizardOpen(false);
      setWizardStep(1);
      setPayrollDeductionAuthorized(false);
      toast('Đã đăng ký khoản vay phúc lợi thành công', 'success');
    },
    onError: (err) => {
      toast(errorMessage(err), 'error');
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, decisionNote }: { id: string; status: 'APPROVED' | 'REJECTED'; decisionNote?: string }) => {
      return (await api.patch(`/hrms/loans/${id}/decide`, { status, decisionNote })).data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['hrms-loans'] });
      if (selectedDetailLoan && selectedDetailLoan.id === vars.id) {
        setSelectedDetailLoan((prev) => prev ? { ...prev, status: vars.status } : null);
      }
      toast(vars.status === 'APPROVED' ? 'Đã phê duyệt khoản vay; chờ kế toán ghi nhận giải ngân' : 'Đã từ chối khoản vay', 'success');
    },
    onError: (err) => {
      toast(errorMessage(err), 'error');
    },
  });

  const disburseMutation = useMutation({
    mutationFn: async ({ id, method, reference }: { id: string; method: 'CASH' | 'BANK'; reference: string }) =>
      (await api.patch(`/hrms/loans/${id}/disburse`, { method, reference })).data as LoanItem,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['hrms-loans'] });
      setSelectedDetailLoan(updated);
      setIsDisbursementModalOpen(false);
      setDisbursementReference('');
      toast('Đã ghi nhận giải ngân kèm mã chứng từ', 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const repayMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      return (await api.post(`/hrms/loans/${id}/repay`, { amount })).data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['hrms-loans'] });
      setRepayLoanTarget(null);
      if (selectedDetailLoan && selectedDetailLoan.id === updated.id) {
        setSelectedDetailLoan((prev) => prev ? { ...prev, remainingAmount: updated.remainingAmount, status: updated.status } : null);
      }
      toast('Đã ghi nhận thanh toán hoàn nợ thành công', 'success');
    },
    onError: (err) => {
      toast(errorMessage(err), 'error');
    },
  });

  // Simulator Calculations
  const simInterestTotal = simAmount * (simRate / 100) * (simMonths / 12);
  const simTotalPayable = simAmount + simInterestTotal;
  const simMonthly = Math.round(simTotalPayable / simMonths);
  const simDeductionPercent = Number(((simMonthly / simSalary) * 100).toFixed(1));
  const isWithinAvailableNet = simMonthly <= simSalary;

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return (loans ?? []).filter((l) => {
      const matchSearch =
        l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.loanType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.reason && l.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || l.loanType.includes(categoryFilter);

      return matchSearch && matchStatus && matchCategory;
    });
  }, [loans, searchTerm, statusFilter, categoryFilter]);

  // Aggregate Metrics & Compliance Audits
  const fundedLoans = (loans ?? []).filter((loan) => ['DISBURSED', 'COMPLETED'].includes(loan.status));
  const totalPrincipal = fundedLoans.reduce((acc, cur) => acc + cur.principalAmount, 0);
  const totalRemaining = fundedLoans.reduce((acc, cur) => acc + cur.remainingAmount, 0);
  const totalRepaidAll = fundedLoans.reduce((acc, cur) => acc + (cur.principalAmount - cur.remainingAmount), 0);
  const pendingLoans = (loans ?? []).filter((l) => l.status === 'PENDING');
  const approvedLoans = (loans ?? []).filter((l) => l.status === 'APPROVED');
  const activeLoans = (loans ?? []).filter((l) => l.status === 'DISBURSED');
  const completedLoans = (loans ?? []).filter((l) => l.status === 'COMPLETED');
  const monthlyEmiRunRate = activeLoans.reduce((acc, cur) => acc + cur.monthlyEmi, 0);

  // Chỉ để minh họa giao diện; chưa lấy hạn mức quỹ từ chính sách doanh nghiệp.
  const fundLimit = 2000000000;
  const fundUtilization = Math.min(100, Math.round((totalPrincipal / fundLimit) * 100));

  // Quick Preset Selector from Packages
  const applyPresetPackage = (pkg: typeof PRESET_PACKAGES[0]) => {
    setLoanType(pkg.category);
    setPrincipalAmount(pkg.amount);
    setTermMonths(pkg.term);
    setInterestRate(pkg.rate);
    setReason(`Đăng ký theo ${pkg.title}`);
    setWizardStep(2);
    setIsApplyWizardOpen(true);
  };

  // Open Repay Target Modal
  const openRepayDialog = (loan: LoanItem, defaultMode: 'emi' | 'half' | 'full') => {
    setRepayLoanTarget(loan);
    if (defaultMode === 'emi') {
      setRepayAmount(Math.min(loan.monthlyEmi, loan.remainingAmount));
    } else if (defaultMode === 'half') {
      setRepayAmount(Math.round(loan.remainingAmount / 2));
    } else {
      setRepayAmount(loan.remainingAmount);
    }
  };

  if (isLoading) return <LoadingState text="Đang đồng bộ dữ liệu sổ cái khoản vay & phúc lợi..." />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 pb-16">
      {/* Workspace Header Doanh Nghiệp Chuẩn */}
      <WorkspaceHeader
        title="Tạm ứng & Vay"
        description="Quản trị quỹ phúc lợi, thẩm định giải ngân và trích trừ lương định kỳ theo quy định."
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Tạm ứng & Vay' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('simulator')}
              className="text-xs h-9 gap-1.5 font-medium"
            >
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span>Studio Mô Phỏng</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setTargetUserId(user?.id ?? (employeeList?.[0]?.id ?? ''));
                setTargetEmployeeName(user?.fullName ?? (employeeList?.[0]?.fullName ?? ''));
                setWizardStep(1);
                setIsApplyWizardOpen(true);
              }}
              className="text-xs h-9 gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>Đăng Ký Vay Mới</span>
            </Button>
          </div>
        }
      />

      {/* Smart Fund Health & Executive Cockpit Ribbon */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-primary/70" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tình Trạng Quỹ Phúc Lợi Nhân Sự Doanh Nghiệp (Năm 2026)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {Math.round(totalPrincipal / 1000000)} Tr
              </span>
              <span className="text-xs text-muted-foreground">
                đã cấp trên tổng hạn ngạch <strong className="text-foreground">2.000 Tr VND</strong> ({fundUtilization}% dung lượng quỹ)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/40 border border-border">
              <ShieldCheck className="h-4 w-4 text-foreground" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Khấu trừ theo thỏa thuận</p>
                <p className="text-muted-foreground">Tối đa kỳ đến hạn, dư nợ và thực nhận khả dụng</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/40 border border-border">
              <Calendar className="h-4 w-4 text-foreground" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Kỳ hoàn nợ kế tiếp</p>
                <p className="text-muted-foreground">Theo lịch trả được duyệt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Hạn Mức Quỹ */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Sử dụng hạn mức minh họa 2 tỷ: {fundUtilization}%</span>
            <span>Còn theo giả định mẫu: {100 - fundUtilization}% ({Math.max(0, 2000 - Math.round(totalPrincipal / 1000000))} Tr)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${fundUtilization}%` }}
            />
          </div>
        </div>
      </div>

      {/* Automated Compliance & Rule Engine Box */}
      {showAiAdvisor && (
        <div className="rounded-lg border border-border bg-card p-4 shadow-xs relative overflow-hidden transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-muted text-foreground shrink-0 mt-0.5">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span>Rà soát hồ sơ vay và lịch trả</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">Cần thẩm định</span>
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pendingLoans.length > 0 ? (
                    <>
                      Có <strong className="text-foreground">{pendingLoans.length} hồ sơ chờ duyệt</strong>.
                      Cần xem từng hồ sơ, thỏa thuận/lịch trả, dư nợ, khả năng thanh toán và bằng chứng giải ngân trước khi duyệt.
                    </>
                  ) : (
                    <>
                      Không có hồ sơ chờ duyệt. Tổng kỳ trả dự kiến từ các khoản đang mở là <strong className="text-foreground">{monthlyEmiRunRate.toLocaleString('vi-VN')} đ</strong>; số này cần đối chiếu với lịch trả thực tế.
                    </>
                  )}
                </p>

                {pendingLoans.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('pipeline')}
                      className="h-8 text-xs font-medium"
                    >
                      <span>Xem chi tiết trên Pipeline Kanban</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAiAdvisor(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              title="Ẩn thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Tổng Gốc Cho Vay"
          value={`${Math.round(totalPrincipal / 1000000)} Tr`}
          subtitle={`${(loans ?? []).length} hồ sơ đã được tài trợ`}
          icon={Wallet}
        />
        <NumberCard
          title="Dư nợ các khoản đã giải ngân"
          value={`${Math.round(totalRemaining / 1000000)} Tr`}
          subtitle={`Đã thu hồi ${Math.round(totalRepaidAll / 1000000)} Tr (${totalPrincipal > 0 ? Math.round((totalRepaidAll / totalPrincipal) * 100) : 0}%)`}
          icon={TrendingDown}
        />
        <NumberCard
          title="Thu Hồi Qua Lương (EMI)"
          value={`${(monthlyEmiRunRate / 1000000).toFixed(1)} Tr`}
          subtitle={`${activeLoans.length} nhân sự khấu trừ tháng này`}
          icon={CreditCard}
        />
        <NumberCard
          title="Đơn Chờ Thẩm Định"
          value={pendingLoans.length}
          trend={
            pendingLoans.length > 0
              ? { value: pendingLoans.length, isPositive: false, label: `${pendingLoans.length} đơn mới` }
              : { value: 0, isPositive: true, label: 'Sạch hàng chờ' }
          }
          subtitle={pendingLoans.length > 0 ? 'Cần HR & Ban Giám đốc duyệt' : 'Tất cả hồ sơ đã duyệt xong'}
          icon={AlertCircle}
        />
      </div>

      {/* Tabs Chức Năng Chính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'ledger'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Sổ Cái & Danh Sách ({(loans ?? []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Pipeline Thẩm Định</span>
            {pendingLoans.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground border border-border font-medium">
                {pendingLoans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'simulator'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Studio Mô Phỏng Khấu Trừ</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'packages'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gói Phúc Lợi Ưu Đãi</span>
          </button>
        </div>

        {/* View Switcher Controls for Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden md:inline">Hiển thị:</span>
            <div className="flex items-center p-0.5 rounded-md bg-muted/60 border border-border">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-1.5 rounded-sm transition-all ${
                  displayMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dạng thẻ tương tác thông minh"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`p-1.5 rounded-sm transition-all ${
                  displayMode === 'table'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dạng bảng sổ cái chuẩn"
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SỔ CÁI & DANH SÁCH (SMART LEDGER - DUAL MODE)                      */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên nhân sự, loại vay, lý do..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-md bg-muted/40 p-1 border border-border">
                {[
                  { id: 'ALL', label: `Tất cả (${(loans ?? []).length})` },
                  { id: 'PENDING', label: `Chờ duyệt (${pendingLoans.length})` },
                  { id: 'APPROVED', label: `Đang thu hồi (${activeLoans.length})` },
                  { id: 'COMPLETED', label: `Đã hoàn tất (${completedLoans.length})` },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                      statusFilter === item.id
                        ? 'bg-card text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DẠNG THẺ TƯƠNG TÁC THÔNG MINH (INTERACTIVE CARD GRID) */}
          {displayMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLoans.map((loan) => {
                const totalTarget = Math.max(loan.principalAmount, (loan.totalRepaid || 0) + loan.remainingAmount);
                const repaidRatio = totalTarget > 0
                  ? Math.max(0, Math.min(100, Math.round(((loan.totalRepaid || (loan.principalAmount - loan.remainingAmount)) / totalTarget) * 100)))
                  : 0;

                return (
                  <div
                    key={loan.id}
                    className="rounded-lg border border-border bg-card p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header: Avatar & Status Badge */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                            {loan.employeeName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {loan.employeeName}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Ngày lập: {formatDate(loan.createdAt)}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border border-border bg-muted/40 text-foreground shrink-0">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              loan.status === 'APPROVED' || loan.status === 'DISBURSED'
                                ? 'bg-primary'
                                : loan.status === 'PENDING'
                                ? 'bg-muted-foreground'
                                : loan.status === 'COMPLETED'
                                ? 'bg-muted-foreground/60'
                                : 'bg-destructive'
                            }`}
                          />
                          {loan.status === 'APPROVED'
                            ? 'Đang thu hồi'
                            : loan.status === 'PENDING'
                            ? 'Chờ duyệt'
                            : loan.status === 'COMPLETED'
                            ? 'Đã tất toán'
                            : 'Từ chối'}
                        </span>
                      </div>

                      {/* Loan Info */}
                      <div className="py-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Mục đích:</span>
                          <span className="font-medium text-foreground text-right truncate max-w-[180px]" title={loan.loanType}>
                            {loan.loanType}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Gốc & Kỳ hạn:</span>
                          <span className="font-semibold text-foreground">
                            {loan.principalAmount.toLocaleString('vi-VN')} đ ({loan.termMonths} tháng)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Khấu trừ lương (EMI):</span>
                          <span className="font-bold text-primary">
                            {loan.monthlyEmi.toLocaleString('vi-VN')} đ/tháng
                          </span>
                        </div>

                        {/* Visual Repayment Meter */}
                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-muted-foreground">Đã thu: {repaidRatio}%</span>
                            <span className="text-foreground font-semibold">
                              Còn: {loan.remainingAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${repaidRatio}%` }}
                            />
                          </div>
                        </div>

                        {loan.reason && (
                          <p className="text-[11px] text-muted-foreground italic line-clamp-1 pt-1">
                            &quot;{loan.reason}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: 1-Click Actions */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDetailLoan(loan)}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Chi tiết</span>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        {loan.status === 'PENDING' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => decideMutation.mutate({ id: loan.id, status: 'APPROVED' })}
                              disabled={decideMutation.isPending}
                              className="h-8 text-xs font-medium gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decideMutation.mutate({ id: loan.id, status: 'REJECTED' })}
                              disabled={decideMutation.isPending}
                              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : loan.status === 'APPROVED' || loan.status === 'DISBURSED' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRepayDialog(loan, 'emi')}
                              className="h-8 text-xs gap-1 font-medium"
                              title="Thu hồi 1 kỳ lương"
                            >
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Trích 1 kỳ</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openRepayDialog(loan, 'full')}
                              className="h-8 text-xs gap-1 font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                              title="Tất toán toàn bộ nợ"
                            >
                              <span>Tất toán</span>
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                            <span>Đã hoàn tất</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLoans.length === 0 && (
                <div className="col-span-full py-12 text-center rounded-lg border border-dashed border-border bg-card">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Wallet className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Không tìm thấy khoản vay phù hợp</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Thử thay đổi từ khóa tìm kiếm hoặc bấm nút &apos;Đăng Ký Vay Mới&apos; để lập hồ sơ vay vốn.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DẠNG BẢNG SỔ CÁI CHUẨN (ENHANCED TABLE VIEW) */}
          {displayMode === 'table' && (
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-3 px-4">Nhân sự</th>
                      <th className="py-3 px-4">Gói vay & Mục đích</th>
                      <th className="py-3 px-4 text-right">Số tiền gốc</th>
                      <th className="py-3 px-4 text-center">Kỳ hạn</th>
                      <th className="py-3 px-4 text-right">Trừ lương (EMI/tháng)</th>
                      <th className="py-3 px-4">Tiến độ thu hồi nợ</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLoans.map((loan) => {
                      const totalTarget = Math.max(loan.principalAmount, (loan.totalRepaid || 0) + loan.remainingAmount);
                      const repaidRatio = totalTarget > 0
                        ? Math.max(0, Math.min(100, Math.round(((loan.totalRepaid || (loan.principalAmount - loan.remainingAmount)) / totalTarget) * 100)))
                        : 0;

                      return (
                        <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                {loan.employeeName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{loan.employeeName}</p>
                                <p className="text-[11px] text-muted-foreground">{formatDate(loan.createdAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-foreground">{loan.loanType}</p>
                            {loan.reason && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-[220px]" title={loan.reason}>
                                {loan.reason}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">
                            {loan.principalAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4 text-center text-muted-foreground">
                            {loan.termMonths} tháng
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            {loan.monthlyEmi.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{repaidRatio}%</span>
                                <span>Còn {Math.round(loan.remainingAmount / 1000000)} Tr</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${repaidRatio}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-muted/40 text-foreground">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  loan.status === 'APPROVED' || loan.status === 'DISBURSED'
                                    ? 'bg-primary'
                                    : loan.status === 'PENDING'
                                    ? 'bg-muted-foreground'
                                    : loan.status === 'COMPLETED'
                                    ? 'bg-muted-foreground/60'
                                    : 'bg-destructive'
                                }`}
                              />
                              {loan.status === 'APPROVED'
                                ? 'Đang thu hồi'
                                : loan.status === 'PENDING'
                                ? 'Chờ duyệt'
                                : loan.status === 'COMPLETED'
                                ? 'Đã tất toán'
                                : 'Từ chối'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDetailLoan(loan)}
                                className="h-7 text-xs px-2"
                                title="Xem chi tiết & lịch trình khấu trừ"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDetailLoan(loan);
                                  setIsPrintLoanOpen(true);
                                }}
                                className="h-7 text-xs px-2"
                                title="In thông tin hồ sơ vay nội bộ"
                              >
                                <Printer className="h-3 w-3" />
                              </Button>

                              {loan.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => decideMutation.mutate({ id: loan.id, status: 'APPROVED' })}
                                    className="h-7 text-xs px-2.5 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Duyệt</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decideMutation.mutate({ id: loan.id, status: 'REJECTED' })}
                                    className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}

                              {(loan.status === 'APPROVED' || loan.status === 'DISBURSED') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRepayDialog(loan, 'emi')}
                                  className="h-7 text-xs px-2 gap-1 font-medium"
                                >
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span>Thu nợ</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PIPELINE THẨM ĐỊNH (KANBAN 4 GIAI ĐOẠN)                           */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {[
            {
              id: 'PENDING',
              title: '1. Chờ Thẩm Định',
              color: 'border-border bg-card',
              badge: 'bg-muted-foreground',
              items: (loans ?? []).filter((l) => l.status === 'PENDING'),
            },
            {
              id: 'APPROVED',
              title: '2. Đang Trích Lương',
              color: 'border-border bg-card',
              badge: 'bg-primary',
              items: (loans ?? []).filter((l) => l.status === 'APPROVED' || l.status === 'DISBURSED'),
            },
            {
              id: 'COMPLETED',
              title: '3. Đã Hoàn Tất',
              color: 'border-border bg-card',
              badge: 'bg-muted-foreground',
              items: (loans ?? []).filter((l) => l.status === 'COMPLETED'),
            },
            {
              id: 'REJECTED',
              title: '4. Đã Từ Chối',
              color: 'border-border bg-card',
              badge: 'bg-destructive',
              items: (loans ?? []).filter((l) => l.status === 'REJECTED'),
            },
          ].map((column) => (
            <div
              key={column.id}
              className="rounded-lg border border-border bg-card p-3 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.badge}`} />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    {column.title}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {column.items.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[300px]">
                {column.items.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedDetailLoan(loan)}
                    className="p-3 rounded-md border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {loan.employeeName}
                      </p>
                      <span className="text-[11px] font-bold text-primary shrink-0">
                        {Math.round(loan.principalAmount / 1000000)} Tr
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {loan.loanType}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border/50">
                      <span>{loan.termMonths} tháng</span>
                      <span className="font-medium text-foreground">
                        {loan.monthlyEmi.toLocaleString('vi-VN')} đ/tháng
                      </span>
                    </div>

                    {column.id === 'PENDING' && (
                      <div className="pt-2 flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            decideMutation.mutate({ id: loan.id, status: 'APPROVED' });
                          }}
                          className="w-full h-7 text-[11px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Phê duyệt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            decideMutation.mutate({ id: loan.id, status: 'REJECTED' });
                          }}
                          className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {column.items.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground italic">
                    Không có hồ sơ nào
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDIO MÔ PHỎNG KHẤU TRỪ (INTERACTIVE SLIDER STUDIO)               */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-lg border border-border bg-card p-5 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <span>Bộ Điều Khiển Mô Phỏng Trả Góp Thông Minh</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kéo thanh trượt để so sánh khoản trả dự kiến với số thực nhận tham chiếu. Đây là công cụ mô phỏng, không phải kết luận pháp lý hoặc quyết định duyệt vay.
              </p>
            </div>

            {/* Slider 1: Số tiền vay */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-foreground">Số tiền vay dự kiến:</span>
                <span className="text-sm font-bold text-primary">
                  {simAmount.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <input
                type="range"
                min={5000000}
                max={100000000}
                step={5000000}
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <button onClick={() => setSimAmount(10000000)} className="hover:text-foreground">10M</button>
                <button onClick={() => setSimAmount(25000000)} className="hover:text-foreground">25M</button>
                <button onClick={() => setSimAmount(50000000)} className="hover:text-foreground">50M</button>
                <button onClick={() => setSimAmount(80000000)} className="hover:text-foreground">80M</button>
                <button onClick={() => setSimAmount(100000000)} className="hover:text-foreground">100M</button>
              </div>
            </div>

            {/* Slider 2: Thời hạn trả góp */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-foreground">Thời hạn trả góp (Tháng):</span>
                <span className="text-sm font-bold text-foreground">
                  {simMonths} tháng ({((simMonths / 12)).toFixed(1)} năm)
                </span>
              </div>
              <input
                type="range"
                min={6}
                max={36}
                step={3}
                value={simMonths}
                onChange={(e) => setSimMonths(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <button onClick={() => setSimMonths(6)} className="hover:text-foreground">6 Tháng</button>
                <button onClick={() => setSimMonths(12)} className="hover:text-foreground">12 Tháng</button>
                <button onClick={() => setSimMonths(18)} className="hover:text-foreground">18 Tháng</button>
                <button onClick={() => setSimMonths(24)} className="hover:text-foreground">24 Tháng</button>
                <button onClick={() => setSimMonths(36)} className="hover:text-foreground">36 Tháng</button>
              </div>
            </div>

            {/* Slider 3: Lương thực lĩnh */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-foreground">Lương thực lĩnh hàng tháng (Net Pay):</span>
                <span className="text-sm font-bold text-foreground">
                  {simSalary.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <input
                type="range"
                min={10000000}
                max={60000000}
                step={2000000}
                value={simSalary}
                onChange={(e) => setSimSalary(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                Số thực nhận ước tính chỉ dùng để thử khả năng trả nợ; Điều 102 BLLĐ không đặt trần 30% chung cho khoản vay.
              </p>
            </div>

            {/* Lãi suất */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="block text-xs font-semibold text-foreground">Lãi suất ưu đãi nội bộ:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '0%/năm (0% Lãi)', rate: 0, sub: 'Gói hỗ trợ công ty' },
                  { label: '2%/năm (Học tập)', rate: 2, sub: 'Đồng tài trợ bằng cấp' },
                  { label: '3.5%/năm (An cư)', rate: 3.5, sub: 'Phúc lợi thâm niên' },
                ].map((item) => (
                  <button
                    key={item.rate}
                    onClick={() => setSimRate(item.rate)}
                    className={`p-2.5 rounded-md border text-left transition-all ${
                      simRate === item.rate
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Convert to Real Application Button */}
            <div className="pt-3 border-t border-border flex justify-end">
              <Button
                onClick={() => {
                  setPrincipalAmount(simAmount);
                  setTermMonths(simMonths);
                  setInterestRate(simRate);
                  setTargetEstimatedSalary(simSalary);
                  setWizardStep(2);
                  setIsApplyWizardOpen(true);
                }}
                className="text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
              >
                <span>Tạo Hồ Sơ Vay Từ Kịch Bản Này</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Cột Kết Quả Tính Toán & Thước Đo An Toàn */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Chỉ Số Khấu Trừ & Sức Khỏe Tài Chính
                </h4>
                    <span className="text-xs font-semibold text-primary">Kịch bản tham khảo</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-muted/40 border border-border">
                  <p className="text-[11px] text-muted-foreground">Khấu trừ lương mỗi tháng (EMI):</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {simMonthly.toLocaleString('vi-VN')} đ
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Gốc: {Math.round(simAmount / simMonths).toLocaleString('vi-VN')} đ
                  </p>
                </div>

                <div className="p-3 rounded-md bg-muted/40 border border-border">
                  <p className="text-[11px] text-muted-foreground">Tỷ lệ chiếm trên thực lĩnh:</p>
                  <p className="text-lg font-bold mt-0.5 text-foreground">
                    {simDeductionPercent}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Tỷ lệ EMI so với thực nhận ước tính</p>
                </div>
              </div>

              {/* Thước đo an toàn trực quan */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Thước đo an toàn thu nhập:</span>
                  <span className={isWithinAvailableNet ? 'text-foreground' : 'text-destructive'}>
                    {isWithinAvailableNet ? '✓ EMI thấp hơn số tham chiếu' : '⚠️ EMI cao hơn số tham chiếu'}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                    isWithinAvailableNet ? 'bg-primary' : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(100, simDeductionPercent)}%` }}
                  />
                </div>
              </div>

              {/* Lời khuyên chính sách BLLĐ */}
              <div
                className={`p-3 rounded-md border text-xs leading-relaxed ${
                  isWithinAvailableNet
                    ? 'border-border bg-muted/40 text-foreground'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                }`}
              >
                {isWithinAvailableNet ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">EMI nằm trong số thực nhận tham chiếu</strong>
                      Kỳ trả dự tính {simMonthly.toLocaleString('vi-VN')} đ/tháng, chiếm {simDeductionPercent}% số thực nhận ước tính. Cần đối chiếu hợp đồng vay và các nghĩa vụ khác trước khi duyệt.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">EMI vượt số thực nhận tham chiếu</strong>
                      Kỳ trả dự tính chiếm {simDeductionPercent}% số thực nhận ước tính. Cần xem lại số vay, kỳ hạn và thỏa thuận trả nợ.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bảng xem trước lịch trình khấu trừ tạm tính */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Bảng Lịch Trình Khấu Trừ Dự Tính (6 Kỳ Đầu)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2">Kỳ</th>
                      <th className="py-2 text-right">Khấu trừ EMI</th>
                      <th className="py-2 text-right">Gốc trả</th>
                      <th className="py-2 text-right">Dư nợ còn lại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[1, 2, 3, 4, 5, 6].map((i) => {
                      const remain = Math.max(0, simAmount - i * (simAmount / simMonths));
                      return (
                        <tr key={i} className="text-foreground">
                          <td className="py-1.5 font-medium">Kỳ {i}</td>
                          <td className="py-1.5 text-right">{simMonthly.toLocaleString('vi-VN')} đ</td>
                          <td className="py-1.5 text-right">{Math.round(simAmount / simMonths).toLocaleString('vi-VN')} đ</td>
                          <td className="py-1.5 text-right text-muted-foreground">{Math.round(remain).toLocaleString('vi-VN')} đ</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GÓI VAY THAM KHẢO MINH HỌA                                      */}
      {/* ========================================================================= */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          Các gói, lãi suất, điều kiện và hạn mức dưới đây là giả định minh họa cho bài tập. Đây chưa phải chính sách phúc lợi đã được doanh nghiệp phê duyệt.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_PACKAGES.map((pkg) => {
            const IconComponent = pkg.icon;
            return (
              <div
                key={pkg.id}
                className="rounded-lg border border-border bg-card p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{pkg.title}</h4>
                        <p className="text-xs text-muted-foreground">{pkg.highlight}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${pkg.badgeColor}`}>
                      {pkg.badge}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Hạn mức tối đa</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{pkg.amount / 1000000} Triệu</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Kỳ hạn vay</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{pkg.term} tháng</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Lãi suất</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{pkg.rate}%/năm</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Điều kiện: {pkg.eligibility}</span>
                  </div>
                </div>

                <div className="pt-4 mt-2 flex items-center justify-between border-t border-border">
                  <div>
                    <span className="text-[11px] text-muted-foreground">Khấu trừ:</span>{' '}
                    <strong className="text-xs text-foreground">
                      ~{Math.round((pkg.amount * (1 + (pkg.rate / 100) * (pkg.term / 12))) / pkg.term).toLocaleString('vi-VN')} đ/tháng
                    </strong>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applyPresetPackage(pkg)}
                    className="text-xs h-8 font-semibold gap-1 bg-foreground text-background hover:bg-foreground/90"
                  >
                    <span>Đăng Ký Gói Này</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CHI TIẾT HỒ SƠ KHOẢN VAY & LỊCH TRÌNH KHẤU TRỪ                     */}
      {/* ========================================================================= */}
      <Modal
        open={Boolean(selectedDetailLoan && !isPrintLoanOpen && !isDisbursementModalOpen)}
        onOpenChange={(open) => {
          if (!open) setSelectedDetailLoan(null);
        }}
        title={`Hồ Sơ Khoản Vay Phúc Lợi — ${selectedDetailLoan?.employeeName || ''}`}
        description={`Mã hồ sơ: ${selectedDetailLoan?.id || ''}`}
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintLoanOpen(true)}
              className="gap-1.5 text-xs font-medium"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In thông tin hồ sơ nội bộ</span>
            </Button>

            <div className="flex items-center gap-2">
              {selectedDetailLoan?.status === 'APPROVED' && canDisburse && (
                <Button
                  size="sm"
                  onClick={() => setIsDisbursementModalOpen(true)}
                  className="text-xs"
                >
                  Ghi nhận giải ngân
                </Button>
              )}
              {selectedDetailLoan?.status === 'DISBURSED' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => selectedDetailLoan && openRepayDialog(selectedDetailLoan, 'emi')}
                    className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Trích thu hồi 1 kỳ</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedDetailLoan && openRepayDialog(selectedDetailLoan, 'full')}
                    className="text-xs"
                  >
                    <span>Tất toán toàn bộ</span>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetailLoan(null)}
                className="text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        }
      >
        {selectedDetailLoan && (
          <div className="space-y-4 text-xs">
            {/* 4 Chỉ số cốt lõi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-md bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground">Số tiền gốc:</p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {selectedDetailLoan.principalAmount.toLocaleString('vi-VN')} đ
                </p>
              </div>

              <div className="p-3 rounded-md bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground">Dư nợ còn lại:</p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {selectedDetailLoan.remainingAmount.toLocaleString('vi-VN')} đ
                </p>
              </div>

              <div className="p-3 rounded-md bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground">Trừ lương hàng tháng (EMI):</p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {selectedDetailLoan.monthlyEmi.toLocaleString('vi-VN')} đ
                </p>
              </div>

              <div className="p-3 rounded-md bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground">Kỳ hạn & Lãi suất:</p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {selectedDetailLoan.termMonths} tháng ({selectedDetailLoan.interestRate}%/năm)
                </p>
              </div>
            </div>

            {/* Mục đích & Lý do */}
            <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1">
              <p className="font-semibold text-foreground">Gói vay & Mục đích:</p>
              <p className="text-muted-foreground">{selectedDetailLoan.loanType}</p>
              {selectedDetailLoan.reason && (
                <p className="text-muted-foreground pt-1 border-t border-border/60 italic">
                  &quot;{selectedDetailLoan.reason}&quot;
                </p>
              )}
            </div>

            <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1">
              <p className="font-semibold text-foreground">Trạng thái & bằng chứng ghi nhận</p>
              <p className="text-muted-foreground">Trạng thái: {selectedDetailLoan.status}</p>
              {selectedDetailLoan.status === 'APPROVED' && <p className="text-muted-foreground">Đã duyệt hồ sơ; chưa được xem là đã giải ngân và chưa trích nợ.</p>}
              {selectedDetailLoan.status === 'DISBURSED' && <p className="text-muted-foreground">Giải ngân: {selectedDetailLoan.disbursementMethod === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt'} · Mã tham chiếu: {selectedDetailLoan.disbursementReference || 'Chưa có'}</p>}
              <p className="text-muted-foreground">Chấp thuận khấu trừ lương: {selectedDetailLoan.payrollDeductionAuthorizedAt ? formatDate(selectedDetailLoan.payrollDeductionAuthorizedAt) : 'Chưa ghi nhận'}</p>
            </div>

            {/* Bảng Lịch Trình Khấu Trừ Từng Kỳ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lịch dự kiến theo số tiền đã thu hồi ({selectedDetailLoan.termMonths} kỳ)
                </h4>
                <span className="text-[11px] text-muted-foreground">Ước tính; không phải lịch sử giao dịch lương</span>
              </div>

              <div className="rounded-md border border-border overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground sticky top-0">
                    <tr className="border-b border-border font-medium">
                      <th className="py-2 px-3">Kỳ</th>
                      <th className="py-2 px-3 text-right">Số tiền</th>
                      <th className="py-2 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Array.from({ length: selectedDetailLoan.termMonths }).map((_, index) => {
                      const periodNumber = index + 1;
                      const repaidMonths = Math.round(
                        (selectedDetailLoan.principalAmount - selectedDetailLoan.remainingAmount) /
                        (selectedDetailLoan.monthlyEmi || 1)
                      );
                      const isRepaid = periodNumber <= repaidMonths;

                      return (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium text-foreground">Kỳ {periodNumber}</td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {selectedDetailLoan.monthlyEmi.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isRepaid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-foreground font-medium">
                                <Check className="h-3 w-3 text-muted-foreground" />
                                <span>Ước tính đã thu hồi</span>
                              </span>
                            ) : periodNumber === repaidMonths + 1 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                <Clock className="h-3 w-3" />
                                <span>Kỳ ước tính tiếp theo</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Chưa ước tính đã thu</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal ghi nhận thực chi sau khi khoản vay được duyệt */}
      <Modal
        open={isDisbursementModalOpen}
        onOpenChange={setIsDisbursementModalOpen}
        title="Ghi nhận giải ngân khoản vay"
        description="Chỉ kế toán hoặc quản trị viên được ghi nhận. Nhập mã phiếu chi hoặc giao dịch ngân hàng để tra cứu đối chứng."
        size="md"
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p><strong>Người vay:</strong> {selectedDetailLoan?.employeeName}</p>
            <p><strong>Số tiền gốc:</strong> {selectedDetailLoan?.principalAmount.toLocaleString('vi-VN')} đ</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">Phương thức giải ngân</span>
            <Select value={disbursementMethod} onChange={(event) => setDisbursementMethod(event.target.value as 'CASH' | 'BANK')}>
              <option value="BANK">Chuyển khoản</option>
              <option value="CASH">Tiền mặt</option>
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">Mã chứng từ tham chiếu</span>
            <Input value={disbursementReference} onChange={(event) => setDisbursementReference(event.target.value)} maxLength={120} placeholder="Mã ủy nhiệm chi hoặc phiếu chi" />
            <span className="text-xs text-muted-foreground">Bài tập lưu mã tham chiếu; chưa đính kèm hoặc xác minh chứng từ ngân hàng/phiếu chi.</span>
          </label>
        </div>
        <ModalFooterActions
          onCancel={() => setIsDisbursementModalOpen(false)}
          confirmLabel="Ghi nhận giải ngân"
          onConfirm={() => selectedDetailLoan && disburseMutation.mutate({ id: selectedDetailLoan.id, method: disbursementMethod, reference: disbursementReference.trim() })}
          pending={disburseMutation.isPending}
          disabled={!selectedDetailLoan || selectedDetailLoan.status !== 'APPROVED' || !disbursementReference.trim()}
        />
      </Modal>

      {/* Bản in chỉ tổng hợp dữ liệu khoản vay đang lưu, không phải hợp đồng hoặc chứng từ pháp quy. */}
      <Modal
        open={isPrintLoanOpen}
        onOpenChange={(open) => setIsPrintLoanOpen(open)}
        title="Thông tin hồ sơ vay phúc lợi nội bộ"
        size="lg"
      >
        {selectedDetailLoan && (
          <div
            id="print-loan-contract-doc"
            className="print-area font-times bg-white text-black p-6 sm:p-10 rounded-sm border border-neutral-300 shadow-md mx-auto max-w-4xl leading-relaxed text-[13pt] print:p-0 print:border-0 print:shadow-none print:m-0 print:max-w-none"
          >
            <div className="flex justify-between items-start pb-4 border-b border-black">
              <div className="w-[48%] text-center leading-tight">
                <p className="font-bold text-[12pt] uppercase">{printConfig.orgName}</p>
                <p className="text-[11pt] uppercase">{printConfig.deptName}</p>
              </div>
              <div className="w-[52%] text-center leading-tight">
                <p className="font-bold text-[12pt] uppercase">TÀI LIỆU NỘI BỘ</p>
                <p className="text-[11pt]">Mã hồ sơ: {selectedDetailLoan.id}</p>
                <p className="text-[11pt] italic">{printConfig.location}, ngày in {new Date().toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            <div className="text-center my-6 space-y-2">
              <h1 className="text-[15pt] font-bold uppercase">TỔNG HỢP HỒ SƠ VAY PHÚC LỢI</h1>
              <p className="text-[11pt] italic">Bản thông tin nội bộ; không thay thế hợp đồng, chứng từ giải ngân hoặc bằng chứng ký nhận/chấp thuận điện tử.</p>
            </div>
            <div className="space-y-3 text-[12pt] leading-relaxed">
              <p><strong>Người vay:</strong> {selectedDetailLoan.employeeName} · Mã người dùng: {selectedDetailLoan.userId}</p>
              <p><strong>Loại vay:</strong> {selectedDetailLoan.loanType}</p>
              <p><strong>Lý do đã ghi nhận:</strong> {selectedDetailLoan.reason || 'Chưa ghi nhận'}</p>
              <p><strong>Trạng thái hiện tại:</strong> {selectedDetailLoan.status}</p>
              <p><strong>Ngày đăng ký:</strong> {new Date(selectedDetailLoan.createdAt).toLocaleString('vi-VN')}</p>
              <p><strong>Gốc khoản vay:</strong> {selectedDetailLoan.principalAmount.toLocaleString('vi-VN')} đồng</p>
              <p><strong>Lãi suất hồ sơ:</strong> {selectedDetailLoan.interestRate}%/năm · <strong>Thời hạn:</strong> {selectedDetailLoan.termMonths} tháng · <strong>Kỳ trả dự kiến:</strong> {selectedDetailLoan.monthlyEmi.toLocaleString('vi-VN')} đồng</p>
              <p><strong>Dư nợ còn lại:</strong> {selectedDetailLoan.remainingAmount.toLocaleString('vi-VN')} đồng</p>
              <p><strong>Chấp thuận khấu trừ qua lương:</strong> {selectedDetailLoan.payrollDeductionAuthorizedAt ? `Đã ghi nhận lúc ${new Date(selectedDetailLoan.payrollDeductionAuthorizedAt).toLocaleString('vi-VN')}` : 'Chưa ghi nhận'}</p>
              <p><strong>Giải ngân:</strong> {selectedDetailLoan.disbursedAt ? `${new Date(selectedDetailLoan.disbursedAt).toLocaleString('vi-VN')} · ${selectedDetailLoan.disbursementMethod === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt'} · Mã tham chiếu ${selectedDetailLoan.disbursementReference || 'chưa có'}` : 'Chưa ghi nhận giải ngân'}</p>
              <p className="pt-4 border-t border-black text-[10.5pt] italic">Thông tin được in từ dữ liệu đang lưu trong hệ thống. Mã tham chiếu chưa chứng minh việc ngân hàng đã chuyển tiền; kiểm tra chứng từ gốc trước khi sử dụng cho kế toán hoặc quyết toán.</p>
            </div>
          </div>
        )}
        <ModalFooterActions
          onCancel={() => setIsPrintLoanOpen(false)}
          cancelLabel="Đóng"
          confirmLabel="In thông tin nội bộ"
          onConfirm={() => printDocumentElement('print-loan-contract-doc')}
        />
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL TRÍCH NỢ NHANH & TẤT TOÁN SỚM                                       */}
      {/* ========================================================================= */}
      {repayLoanTarget && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setRepayLoanTarget(null)}
            />
            <div className="relative z-10 w-full max-w-md bg-card rounded-lg border border-border shadow-xl p-5 space-y-4 animate-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>Xác Nhận Thu Hồi Nợ / Tất Toán Sớm</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nhân sự: <strong>{repayLoanTarget.employeeName}</strong>
                </p>
              </div>
              <button onClick={() => setRepayLoanTarget(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dư nợ hiện tại:</span>
                <strong className="text-foreground">{repayLoanTarget.remainingAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Định mức khấu trừ hàng tháng (EMI):</span>
                <strong className="text-foreground">{repayLoanTarget.monthlyEmi.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>

            {/* Quick Amount Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Chọn mức thanh toán nhanh:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRepayAmount(Math.min(repayLoanTarget.monthlyEmi, repayLoanTarget.remainingAmount))}
                  className={`p-2 rounded-md border text-xs font-medium transition-colors ${
                    repayAmount === Math.min(repayLoanTarget.monthlyEmi, repayLoanTarget.remainingAmount)
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  1 Kỳ Lương
                </button>
                <button
                  type="button"
                  onClick={() => setRepayAmount(Math.round(repayLoanTarget.remainingAmount / 2))}
                  className={`p-2 rounded-md border text-xs font-medium transition-colors ${
                    repayAmount === Math.round(repayLoanTarget.remainingAmount / 2)
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  50% Dư Nợ
                </button>
                <button
                  type="button"
                  onClick={() => setRepayAmount(repayLoanTarget.remainingAmount)}
                  className={`p-2 rounded-md border text-xs font-medium transition-colors ${
                    repayAmount === repayLoanTarget.remainingAmount
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  Tất Toán 100%
                </button>
              </div>
            </div>

            {/* Input số tiền tùy chỉnh */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">Số tiền thanh toán xác nhận (VND):</label>
              <Input
                type="number"
                min={100000}
                max={repayLoanTarget.remainingAmount}
                value={repayAmount}
                onChange={(e) => setRepayAmount(Number(e.target.value))}
                className="text-xs h-9 font-bold"
              />
              <p className="text-[10px] text-muted-foreground">
                Sau thanh toán, dư nợ còn lại:{' '}
                <strong>{Math.max(0, repayLoanTarget.remainingAmount - repayAmount).toLocaleString('vi-VN')} đ</strong>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRepayLoanTarget(null)}
                className="text-xs h-9"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                disabled={repayMutation.isPending || repayAmount <= 0}
                onClick={() => {
                  repayMutation.mutate({
                    id: repayLoanTarget.id,
                    amount: repayAmount,
                  });
                }}
                className="text-xs h-9 font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{repayMutation.isPending ? 'Đang cập nhật...' : 'Xác Nhận Thu Nợ'}</span>
              </Button>
            </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* WIZARD ĐĂNG KÝ VAY PHÚC LỢI THÔNG MINH 3 BƯỚC                             */}
      {/* ========================================================================= */}
      {isApplyWizardOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsApplyWizardOpen(false)}
            />
            <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-lg border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 text-foreground">
            {/* Header & Steps Indicator */}
            <div className="pb-3 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span>Quy Trình Đăng Ký Khoản Vay Phúc Lợi (Bước {wizardStep}/3)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hệ thống tự động thẩm định điều kiện và bảo vệ thu nhập theo Bộ luật Lao động.
                  </p>
                </div>
                <button
                  onClick={() => setIsApplyWizardOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { step: 1, label: '1. Chọn Nhân Sự' },
                  { step: 2, label: '2. Phương Án Tài Chính' },
                  { step: 3, label: '3. Cam Kết & Gửi' },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`text-center py-1.5 rounded-md text-[11px] font-medium border ${
                      wizardStep === s.step
                        ? 'border-primary bg-primary text-primary-foreground'
                        : wizardStep > s.step
                        ? 'border-border bg-muted text-foreground'
                        : 'border-border bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* BƯỚC 1: CHỌN NHÂN SỰ & THẨM ĐỊNH TỰ ĐỘNG */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Người lao động đề nghị tạm ứng / vay vốn:
                  </label>
                  <Select
                    value={targetUserId}
                    onChange={(e) => {
                      const selected = (employeeList ?? []).find((emp) => emp.id === e.target.value);
                      setTargetUserId(e.target.value);
                      setTargetEmployeeName(selected?.fullName ?? '');
                    }}
                    className="w-full text-xs h-9"
                  >
                    <option value="">-- Chọn nhân sự từ danh bạ công ty --</option>
                    {(employeeList ?? []).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode || emp.email || 'Nhân sự'})
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Reference scenario; not a substitute for an approved loan assessment. */}
                <div className="p-3.5 rounded-md bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-foreground" />
                    <span>Số liệu tham khảo để mô phỏng:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-muted-foreground" htmlFor="loan-estimated-net">Thực nhận tham chiếu (chỉ mô phỏng):</label>
                      <Input id="loan-estimated-net" type="number" min={0} value={targetEstimatedSalary} onChange={(e) => setTargetEstimatedSalary(Number(e.target.value))} className="mt-1 h-8 text-xs" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                    Không xác minh được hợp đồng hay hạn mức quỹ từ dữ liệu mô phỏng này.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    disabled={!targetUserId}
                    onClick={() => setWizardStep(2)}
                    className="text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground"
                  >
                    <span>Tiếp tục: Chọn Gói Vay</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: CHỌN GÓI VAY & TINH CHỈNH PHƯƠNG ÁN TÀI CHÍNH */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">Gói phúc lợi / Mục đích vay:</label>
                  <Select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="w-full text-xs h-9"
                  >
                    <option value="Tạm ứng mua thiết bị làm việc & Laptop">Tạm ứng mua thiết bị làm việc & Laptop (0% Lãi)</option>
                    <option value="Hỗ trợ khẩn cấp y tế gia đình">Hỗ trợ khẩn cấp y tế gia đình (0% Lãi - Duyệt 24h)</option>
                    <option value="Vay học tập & nâng cao nghiệp vụ">Vay học tập & nâng cao nghiệp vụ (Ưu đãi 2%/năm)</option>
                    <option value="Phúc lợi an cư & Gắn bó thâm niên">Phúc lợi an cư & Gắn bó thâm niên (Ưu đãi 3.5%/năm)</option>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">Số tiền vay (VND):</label>
                    <Input
                      type="number"
                      step={1000000}
                      min={1000000}
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                      className="text-xs h-9 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">Kỳ hạn (Tháng):</label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Kết quả EMI tạm tính */}
                {(() => {
                  const interestTotal = principalAmount * (interestRate / 100) * (termMonths / 12);
                  const totalPayable = principalAmount + interestTotal;
                  const monthlyEmiCalc = Math.round(totalPayable / termMonths);
                  const deductionRatio = Number(((monthlyEmiCalc / targetEstimatedSalary) * 100).toFixed(1));
                  const isAffordable = monthlyEmiCalc <= Math.max(0, targetEstimatedSalary);

                  return (
                    <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Khấu trừ lương mỗi kỳ (EMI):</span>
                        <strong className="text-primary text-sm">{monthlyEmiCalc.toLocaleString('vi-VN')} đ/tháng</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tỷ lệ chiếm lương thực lĩnh:</span>
                        <span className={`font-semibold ${isAffordable ? 'text-foreground' : 'text-destructive'}`}>
                          {deductionRatio}% {isAffordable ? '(thấp hơn thực nhận tham chiếu)' : '(vượt thực nhận tham chiếu)'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWizardStep(1)}
                    className="text-xs h-9"
                  >
                    Quay lại
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setWizardStep(3)}
                    className="text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground"
                  >
                    <span>Tiếp tục: Xác Nhận</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: XÁC NHẬN LÝ DO & GỬI HỒ SƠ */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1.5 text-xs">
                  <p className="font-bold text-foreground">Tóm tắt đề xuất vay vốn:</p>
                  <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                    <span>Nhân sự đề nghị:</span>
                    <strong className="text-foreground">{targetEmployeeName}</strong>
                    <span>Khoản tiền đề nghị:</span>
                    <strong className="text-foreground">{principalAmount.toLocaleString('vi-VN')} đ</strong>
                    <span>Kỳ hạn trả góp:</span>
                    <strong className="text-foreground">{termMonths} tháng</strong>
                    <span>Gói áp dụng:</span>
                    <strong className="text-foreground truncate">{loanType}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Lý do & Cam kết người vay:
                  </label>
                  <Textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ghi rõ mục đích sử dụng vốn và thỏa thuận trả nợ..."
                    className="w-full text-xs"
                  />
                </div>

                <label className="flex items-start gap-2 rounded-md border border-border p-3 text-xs leading-relaxed">
                  <input type="checkbox" checked={payrollDeductionAuthorized} onChange={(e) => setPayrollDeductionAuthorized(e.target.checked)} className="mt-0.5" />
                  <span>Tôi đồng ý ghi nhận các khoản đến hạn qua bảng lương theo lịch trả đã thỏa thuận, tối đa trong phạm vi dư nợ và số thực nhận còn khả dụng. Mốc đồng ý này sẽ được lưu vào hồ sơ khoản vay.</span>
                </label>

                <div className="flex justify-between pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWizardStep(2)}
                    className="text-xs h-9"
                  >
                    Quay lại
                  </Button>
                  <Button
                    size="sm"
                    disabled={applyMutation.isPending || !targetUserId || !payrollDeductionAuthorized || targetEstimatedSalary <= 0}
                    onClick={() => {
                      applyMutation.mutate({
                        userId: targetUserId || (user?.id ?? ''),
                        employeeName: targetEmployeeName || (user?.fullName ?? ''),
                        loanType,
                        principalAmount,
                        termMonths,
                        interestRate,
                        reason,
                        payrollDeductionAuthorized,
                      });
                    }}
                    className="text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{applyMutation.isPending ? 'Đang gửi hồ sơ...' : 'Gửi Đăng Ký Khoản Vay'}</span>
                  </Button>
                </div>
              </div>
            )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
