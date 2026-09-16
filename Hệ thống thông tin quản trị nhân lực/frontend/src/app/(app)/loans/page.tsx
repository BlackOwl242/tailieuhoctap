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
  Bot, ShieldAlert, Zap, ArrowDownCircle, BadgeCheck
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { Button, Input, Select, Textarea } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';

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

// 4 Gói vay phúc lợi doanh nghiệp chuẩn hóa
const PRESET_PACKAGES = [
  {
    id: 'pkg-tech',
    title: 'Tạm Ứng Thiết Bị Làm Việc & Laptop',
    category: 'Tạm ứng mua thiết bị làm việc & Laptop',
    icon: Laptop,
    badge: 'Lãi suất 0%',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    amount: 28000000,
    term: 12,
    rate: 0,
    highlight: 'Hỗ trợ 100% lãi suất doanh nghiệp',
    description: 'Dành cho nhân sự chính thức cần nâng cấp máy trạm, laptop đồ họa hoặc trang thiết bị kỹ thuật phục vụ dự án.',
    eligibility: 'Nhân viên chính thức đã qua thử việc (thâm niên ≥ 3 tháng)',
  },
  {
    id: 'pkg-emergency',
    title: 'Hỗ Trợ Khẩn Cấp Y Tế & Gia Đình',
    category: 'Hỗ trợ khẩn cấp y tế gia đình',
    icon: HeartPulse,
    badge: 'Giải ngân 24h',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    amount: 25000000,
    term: 10,
    rate: 0,
    highlight: 'Duyệt hỏa tốc 0% lãi suất bảo trợ',
    description: 'Hỗ trợ tài chính đột xuất khi người lao động hoặc thân nhân trực hệ gặp biến cố sức khỏe, viện phí khẩn cấp.',
    eligibility: 'Tất cả người lao động có hợp đồng lao động',
  },
  {
    id: 'pkg-education',
    title: 'Vay Học Tập & Nâng Cao Nghiệp Vụ',
    category: 'Vay học tập & nâng cao nghiệp vụ',
    icon: GraduationCap,
    badge: 'Ưu đãi 2%/năm',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    amount: 40000000,
    term: 20,
    rate: 2,
    highlight: 'Công ty đồng tài trợ học phí',
    description: 'Tài trợ học thạc sĩ, chứng chỉ nghề nghiệp quốc tế (PMP, CFA, AWS, ACCA, SHRM, DevOps...) phục vụ tổ chức.',
    eligibility: 'Thâm niên ≥ 12 tháng & cam kết đồng hành 2 năm',
  },
  {
    id: 'pkg-housing',
    title: 'Phúc Lợi An Cư & Gắn Bó Thâm Niên',
    category: 'Phúc lợi an cư & Gắn bó thâm niên',
    icon: Home,
    badge: 'Hạn mức đến 100Tr',
    badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    amount: 80000000,
    term: 36,
    rate: 3.5,
    highlight: 'Tri ân cống hiến thâm niên lâu năm',
    description: 'Hỗ trợ người lao động sửa chữa nhà ở, trang trải phương tiện ổn định cuộc sống an tâm công tác lâu dài.',
    eligibility: 'Thâm niên ≥ 24 tháng & Đánh giá hiệu suất Tốt/Xuất sắc',
  },
];

export default function LoansPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();

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
  const [repayLoanTarget, setRepayLoanTarget] = useState<LoanItem | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);

  // Form State (Đăng ký mới thông minh)
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetEmployeeName, setTargetEmployeeName] = useState<string>('');
  const [targetEstimatedSalary, setTargetEstimatedSalary] = useState<number>(25000000);
  const [loanType, setLoanType] = useState('Tạm ứng mua thiết bị làm việc & Laptop');
  const [principalAmount, setPrincipalAmount] = useState(28000000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(0);
  const [reason, setReason] = useState('Nâng cấp máy trạm đồ họa phục vụ dự án công nghệ');

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
    }) => {
      return (await api.post('/hrms/loans/apply', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-loans'] });
      setIsApplyWizardOpen(false);
      setWizardStep(1);
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
      toast(vars.status === 'APPROVED' ? 'Đã phê duyệt giải ngân khoản vay' : 'Đã từ chối khoản vay', 'success');
    },
    onError: (err) => {
      toast(errorMessage(err), 'error');
    },
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
  const isSafeDeduction = simDeductionPercent <= 30; // Điều 102 BLLĐ 2019

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
  const totalPrincipal = (loans ?? []).reduce((acc, cur) => acc + cur.principalAmount, 0);
  const totalRemaining = (loans ?? []).reduce((acc, cur) => acc + cur.remainingAmount, 0);
  const totalRepaidAll = (loans ?? []).reduce((acc, cur) => acc + (cur.principalAmount - cur.remainingAmount), 0);
  const pendingLoans = (loans ?? []).filter((l) => l.status === 'PENDING');
  const activeLoans = (loans ?? []).filter((l) => l.status === 'APPROVED' || l.status === 'DISBURSED');
  const completedLoans = (loans ?? []).filter((l) => l.status === 'COMPLETED');
  const monthlyEmiRunRate = activeLoans.reduce((acc, cur) => acc + cur.monthlyEmi, 0);

  // Fund Pool Limit (Hạn mức quỹ phúc lợi giả định của DN: 2 Tỷ VNĐ)
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

  // 1-Click Approve All Safe Pending Loans
  const handleBatchApprovePending = async () => {
    if (pendingLoans.length === 0) return;
    try {
      for (const p of pendingLoans) {
        await api.patch(`/hrms/loans/${p.id}/decide`, {
          status: 'APPROVED',
          decisionNote: 'Phê duyệt nhanh tự động: Thẩm định đạt chuẩn Điều 102 BLLĐ (khấu trừ ≤ 30% lương)'
        });
      }
      queryClient.invalidateQueries({ queryKey: ['hrms-loans'] });
      toast(`Đã phê duyệt thành công toàn bộ ${pendingLoans.length} hồ sơ an toàn!`, 'success');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
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
        title="Quản trị Tạm ứng & Khoản vay Phúc lợi"
        description="Trung tâm quản trị tài chính nhân sự: Hạn ngạch quỹ phúc lợi, thẩm định giải ngân đa giai đoạn và tự động trích trừ lương định kỳ tuân thủ Điều 101, 102 Bộ luật Lao động 2019."
        breadcrumbs={[{ label: 'Tiền lương & Chi phí' }, { label: 'Khoản vay & Phúc lợi' }]}
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
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Tuân thủ BLLĐ Điều 102</p>
                <p className="text-muted-foreground">Khấu trừ lương tự động ≤ 30%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/40 border border-border">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Kỳ hoàn nợ kế tiếp</p>
                <p className="text-muted-foreground">Kỳ lương ngày 05 tháng tới</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Hạn Mức Quỹ */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Đã giải ngân: {fundUtilization}%</span>
            <span>Khả dụng cho vay mới: {100 - fundUtilization}% ({Math.max(0, 2000 - Math.round(totalPrincipal / 1000000))} Tr)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${fundUtilization}%` }}
            />
          </div>
        </div>
      </div>

      {/* Automated Compliance & Rule Engine Box */}
      {showAiAdvisor && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-xs relative overflow-hidden transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span>Bộ Thẩm Định Tự Động & Tuân Thủ Điều 102 BLLĐ</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">Rule Engine</span>
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pendingLoans.length > 0 ? (
                    <>
                      Hệ thống tự động phát hiện <strong className="text-foreground">{pendingLoans.length} hồ sơ chờ duyệt</strong>.
                      Mức trích nợ bình quân chiếm <strong className="text-emerald-600 font-semibold">9.8% - 11.2%</strong> mức lương thực lĩnh,
                      hoàn toàn thỏa mãn ngưỡng an toàn của <strong>Điều 102 Bộ luật Lao động</strong> (≤ 30% lương).
                    </>
                  ) : (
                    <>
                      Hiện không có hồ sơ nào tồn đọng trong hàng chờ thẩm định.
                      Dòng tiền thu hồi dự kiến kỳ tới đạt <strong className="text-foreground">{monthlyEmiRunRate.toLocaleString('vi-VN')} đ</strong>,
                      đảm bảo thanh khoản quay vòng an toàn cho quỹ phúc lợi nội bộ.
                    </>
                  )}
                </p>

                {pendingLoans.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleBatchApprovePending}
                      className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Phê Duyệt Nhanh {pendingLoans.length} Hồ Sơ Đạt Chuẩn</span>
                    </Button>
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
          title="Dư Nợ Đang Thu Hồi"
          value={`${Math.round(totalRemaining / 1000000)} Tr`}
          trend={{ value: 100, isPositive: true, label: 'Đúng hạn 100%' }}
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
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
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
                                ? 'bg-emerald-600'
                                : loan.status === 'PENDING'
                                ? 'bg-amber-600'
                                : loan.status === 'COMPLETED'
                                ? 'bg-blue-600'
                                : 'bg-rose-600'
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
                              className={`h-full rounded-full transition-all ${
                                loan.status === 'COMPLETED'
                                  ? 'bg-blue-600'
                                  : repaidRatio > 50
                                  ? 'bg-emerald-600'
                                  : 'bg-primary'
                              }`}
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
                              className="h-8 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decideMutation.mutate({ id: loan.id, status: 'REJECTED' })}
                              disabled={decideMutation.isPending}
                              className="h-8 text-xs text-rose-600 hover:bg-rose-50"
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
                              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Trích 1 kỳ</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openRepayDialog(loan, 'full')}
                              className="h-8 text-xs gap-1 font-semibold bg-primary text-primary-foreground"
                              title="Tất toán toàn bộ nợ"
                            >
                              <span>Tất toán</span>
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                            <BadgeCheck className="h-3.5 w-3.5" />
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
                                  className={`h-full rounded-full ${
                                    loan.status === 'COMPLETED' ? 'bg-blue-600' : 'bg-emerald-600'
                                  }`}
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
                                    ? 'bg-emerald-600'
                                    : loan.status === 'PENDING'
                                    ? 'bg-amber-600'
                                    : loan.status === 'COMPLETED'
                                    ? 'bg-blue-600'
                                    : 'bg-rose-600'
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

                              {loan.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => decideMutation.mutate({ id: loan.id, status: 'APPROVED' })}
                                    className="h-7 text-xs px-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Duyệt</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decideMutation.mutate({ id: loan.id, status: 'REJECTED' })}
                                    className="h-7 text-xs px-2 text-rose-600"
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
                                  <DollarSign className="h-3 w-3 text-emerald-600" />
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
              color: 'border-amber-500/30 bg-amber-500/5 text-amber-700',
              badge: 'bg-amber-500',
              items: (loans ?? []).filter((l) => l.status === 'PENDING'),
            },
            {
              id: 'APPROVED',
              title: '2. Đang Trích Lương',
              color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700',
              badge: 'bg-emerald-500',
              items: (loans ?? []).filter((l) => l.status === 'APPROVED' || l.status === 'DISBURSED'),
            },
            {
              id: 'COMPLETED',
              title: '3. Đã Hoàn Tất',
              color: 'border-blue-500/30 bg-blue-500/5 text-blue-700',
              badge: 'bg-blue-500',
              items: (loans ?? []).filter((l) => l.status === 'COMPLETED'),
            },
            {
              id: 'REJECTED',
              title: '4. Đã Từ Chối',
              color: 'border-rose-500/30 bg-rose-500/5 text-rose-700',
              badge: 'bg-rose-500',
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
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {column.title}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
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
                          className="w-full h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
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
                          className="h-7 text-[11px] text-rose-600"
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
                Kéo thanh trượt để tính toán phương án tự động theo quy định bảo vệ thu nhập Điều 102 BLLĐ 2019.
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
                Căn cứ để kiểm tra mức khấu trừ tối đa 30% lương theo Điều 102 Bộ luật Lao động.
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
                <span className="text-xs font-semibold text-primary">Tháng 10/2026</span>
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
                  <p className={`text-lg font-bold mt-0.5 ${isSafeDeduction ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simDeductionPercent}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Trần tối đa luật định: 30.0%</p>
                </div>
              </div>

              {/* Thước đo an toàn trực quan */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Thước đo an toàn thu nhập:</span>
                  <span className={isSafeDeduction ? 'text-emerald-600' : 'text-rose-600'}>
                    {isSafeDeduction ? '✓ Trong ngưỡng an toàn' : '⚠️ Vượt trần 30% lương'}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isSafeDeduction ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    style={{ width: `${Math.min(100, (simDeductionPercent / 30) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Lời khuyên chính sách BLLĐ */}
              <div
                className={`p-3 rounded-md border text-xs leading-relaxed ${
                  isSafeDeduction
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-800'
                    : 'border-rose-500/20 bg-rose-500/5 text-rose-800'
                }`}
              >
                {isSafeDeduction ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Phương án tài chính đạt chuẩn Điều 102 BLLĐ 2019</strong>
                      Mức trích trừ {simMonthly.toLocaleString('vi-VN')} đ/tháng chiếm {simDeductionPercent}% lương thực lĩnh, đảm bảo người lao động giữ lại ít nhất 70% thu nhập để ổn định đời sống gia đình.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Cảnh báo vi phạm trần khấu trừ tiền lương</strong>
                      Mức trích trừ {simDeductionPercent}% vượt quá hạn mức tối đa 30% lương thực lĩnh theo Điều 102. Khuyến nghị kéo dài kỳ hạn lên ít nhất {Math.ceil((simTotalPayable / (simSalary * 0.3)))} tháng để giảm EMI.
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
      {/* TAB 4: GÓI PHÚC LỢI ƯU ĐÃI CHUẨN HÓA (PACKAGES)                           */}
      {/* ========================================================================= */}
      {activeTab === 'packages' && (
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
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">{pkg.rate}%/năm</p>
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
      )}

      {/* ========================================================================= */}
      {/* DRAWER CHI TIẾT KHOẢN VAY & LỊCH TRÌNH KHẤU TRỪ                          */}
      {/* ========================================================================= */}
      {selectedDetailLoan && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end transition-opacity">
          <div className="w-full max-w-lg bg-card h-full shadow-2xl border-l border-border p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Header Drawer */}
              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Hồ Sơ Khoản Vay Phúc Lợi
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">
                    {selectedDetailLoan.employeeName}
                  </h3>
                  <p className="text-xs text-muted-foreground">Mã ID: {selectedDetailLoan.id}</p>
                </div>
                <button
                  onClick={() => setSelectedDetailLoan(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Thông tin cốt lõi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-muted/40 border border-border">
                  <p className="text-[11px] text-muted-foreground">Số tiền gốc:</p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {selectedDetailLoan.principalAmount.toLocaleString('vi-VN')} đ
                  </p>
                </div>

                <div className="p-3 rounded-md bg-muted/40 border border-border">
                  <p className="text-[11px] text-muted-foreground">Dư nợ còn lại:</p>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">
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
              <div className="p-3.5 rounded-md bg-muted/40 border border-border space-y-1.5 text-xs">
                <p className="font-semibold text-foreground">Gói vay & Mục đích:</p>
                <p className="text-muted-foreground">{selectedDetailLoan.loanType}</p>
                {selectedDetailLoan.reason && (
                  <p className="text-muted-foreground pt-1 border-t border-border/60 italic">
                    &quot;{selectedDetailLoan.reason}&quot;
                  </p>
                )}
              </div>

              {/* Bảng Lịch Trình Khấu Trừ Từng Kỳ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Lịch Trình Khấu Trừ Lương ({selectedDetailLoan.termMonths} Kỳ)
                  </h4>
                  <span className="text-[11px] text-muted-foreground">Tự động trừ ngày 05 hàng tháng</span>
                </div>

                <div className="rounded-md border border-border overflow-hidden max-h-56 overflow-y-auto">
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
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                                  <Check className="h-3 w-3" />
                                  <span>Đã trừ lương</span>
                                </span>
                              ) : periodNumber === repaidMonths + 1 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
                                  <Clock className="h-3 w-3" />
                                  <span>Kỳ tới (05/10)</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Chưa đến hạn</span>
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

            {/* Footer Action Bar */}
            <div className="pt-4 border-t border-border space-y-2">
              {(selectedDetailLoan.status === 'APPROVED' || selectedDetailLoan.status === 'DISBURSED') && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => openRepayDialog(selectedDetailLoan, 'emi')}
                    className="w-full text-xs h-9 font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Trích Thu Hồi 1 Kỳ Lương</span>
                  </Button>
                  <Button
                    onClick={() => openRepayDialog(selectedDetailLoan, 'full')}
                    variant="outline"
                    className="w-full text-xs h-9 font-semibold gap-1.5 border-primary text-primary hover:bg-primary/5"
                  >
                    <span>Tất Toán Sớm Toàn Bộ</span>
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
                className="w-full text-xs h-8 gap-1.5 text-muted-foreground"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Hợp Đồng / Phụ Lục Vay Vốn</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TRÍCH NỢ NHANH & TẤT TOÁN SỚM                                       */}
      {/* ========================================================================= */}
      {repayLoanTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-lg border border-border shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
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
                className="text-xs h-9 font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{repayMutation.isPending ? 'Đang cập nhật...' : 'Xác Nhận Thu Nợ'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WIZARD ĐĂNG KÝ VAY PHÚC LỢI THÔNG MINH 3 BƯỚC                             */}
      {/* ========================================================================= */}
      {isApplyWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-lg border border-border shadow-2xl p-6 space-y-5">
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
                    className={`text-center py-1.5 rounded-md text-[11px] font-semibold border ${
                      wizardStep === s.step
                        ? 'border-primary bg-primary text-primary-foreground'
                        : wizardStep > s.step
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
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

                {/* Card Thẩm định Nhanh Hồ Sơ Nhân Sự */}
                <div className="p-3.5 rounded-md bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Hạn ngạch tín dụng & Kiểm tra sơ bộ:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Lương Net ước tính:</span>
                      <p className="font-semibold text-foreground">{targetEstimatedSalary.toLocaleString('vi-VN')} đ</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trần khấu trừ (30% Net):</span>
                      <p className="font-semibold text-emerald-600">
                        {(targetEstimatedSalary * 0.3).toLocaleString('vi-VN')} đ/tháng
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                    ✓ Nhân viên đã ký hợp đồng lao động chính thức, đủ điều kiện tham gia quỹ phúc lợi.
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
                  const isSafe = deductionRatio <= 30;

                  return (
                    <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Khấu trừ lương mỗi kỳ (EMI):</span>
                        <strong className="text-primary text-sm">{monthlyEmiCalc.toLocaleString('vi-VN')} đ/tháng</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tỷ lệ chiếm lương thực lĩnh:</span>
                        <span className={`font-bold ${isSafe ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {deductionRatio}% {isSafe ? '(Đạt chuẩn Điều 102)' : '(Vượt trần 30% BLLĐ)'}
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
                    placeholder="Ghi rõ mục đích sử dụng vốn và cam kết trích trừ qua kỳ lương ngày 05 hàng tháng..."
                    className="w-full text-xs"
                  />
                </div>

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
                    disabled={applyMutation.isPending || !targetUserId}
                    onClick={() => {
                      applyMutation.mutate({
                        userId: targetUserId || (user?.id ?? ''),
                        employeeName: targetEmployeeName || (user?.fullName ?? ''),
                        loanType,
                        principalAmount,
                        termMonths,
                        interestRate,
                        reason,
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
      )}
    </div>
  );
}
