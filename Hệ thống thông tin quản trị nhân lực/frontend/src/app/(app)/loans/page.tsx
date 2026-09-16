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
  AlertTriangle, CheckCircle, Percent
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
  orgUnit?: { name: string };
}

// 4 Gói vay phúc lợi tiêu chuẩn thiết kế sẵn
const PRESET_PACKAGES = [
  {
    id: 'pkg-tech',
    title: 'Tạm Ứng Thiết Bị Làm Việc & Laptop',
    category: 'Tạm ứng mua thiết bị làm việc',
    icon: Laptop,
    badge: 'Lãi suất 0%',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    amount: 25000000,
    term: 12,
    rate: 0,
    highlight: 'Hỗ trợ 100% lãi suất',
    description: 'Dành cho nhân sự chính thức cần nâng cấp máy trạm, laptop đồ họa hoặc trang thiết bị phục vụ công việc.',
    eligibility: 'Nhân viên chính thức đã qua thử việc',
  },
  {
    id: 'pkg-emergency',
    title: 'Hỗ Trợ Khẩn Cấp Y Tế & Gia Đình',
    category: 'Tạm ứng khẩn cấp gia đình',
    icon: HeartPulse,
    badge: 'Giải ngân 24h',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    amount: 30000000,
    term: 15,
    rate: 0,
    highlight: 'Duyệt hỏa tốc 0% lãi',
    description: 'Hỗ trợ tài chính đột xuất khi người lao động hoặc thân nhân trực hệ gặp biến cố sức khỏe, viện phí khẩn cấp.',
    eligibility: 'Tất cả người lao động có HĐLĐ',
  },
  {
    id: 'pkg-education',
    title: 'Học Tập Nâng Cao Nghiệp Vụ & Bằng Cấp',
    category: 'Vay học tập & nâng cao nghiệp vụ',
    icon: GraduationCap,
    badge: 'Ưu đãi 2%/năm',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    amount: 40000000,
    term: 24,
    rate: 2,
    highlight: 'Công ty đồng tài trợ',
    description: 'Tài trợ chi phí học thạc sĩ, chứng chỉ nghề nghiệp quốc tế (PMP, CFA, AWS, ACCA, DevOps...) phục vụ tổ chức.',
    eligibility: 'Thâm niên ≥ 12 tháng & cam kết gắn bó',
  },
  {
    id: 'pkg-housing',
    title: 'Phúc Lợi An Cư & Gắn Bó Thâm Niên',
    category: 'Vay hỗ trợ nhà ở / phương tiện',
    icon: Home,
    badge: 'Hạn mức đến 100Tr',
    badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    amount: 80000000,
    term: 36,
    rate: 3.5,
    highlight: 'Ưu đãi thâm niên cống hiến',
    description: 'Hỗ trợ người lao động sửa chữa nhà ở, mua sắm phương tiện ổn định cuộc sống an tâm công tác lâu dài.',
    eligibility: 'Thâm niên ≥ 24 tháng & Đánh giá Tốt',
  },
];

export default function LoansPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();

  // Navigation View Mode
  const [activeTab, setActiveTab] = useState<'ledger' | 'pipeline' | 'simulator' | 'packages'>('ledger');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedDetailLoan, setSelectedDetailLoan] = useState<LoanItem | null>(null);
  const [isRepayingLoan, setIsRepayingLoan] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);

  // Form State (Đăng ký mới)
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetEmployeeName, setTargetEmployeeName] = useState<string>('');
  const [loanType, setLoanType] = useState('Tạm ứng mua thiết bị làm việc');
  const [principalAmount, setPrincipalAmount] = useState(24000000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(0);
  const [reason, setReason] = useState('Nâng cấp laptop trạm cấu hình cao cho dự án');

  // Simulator State
  const [simAmount, setSimAmount] = useState(30000000);
  const [simMonths, setSimMonths] = useState(12);
  const [simSalary, setSimSalary] = useState(25000000);
  const [simRate, setSimRate] = useState(0);

  // Query Loans Data
  const { data: loans, isLoading, isError, error, refetch } = useQuery<LoanItem[]>({
    queryKey: ['hrms-loans'],
    queryFn: async () => (await api.get('/hrms/loans')).data,
  });

  // Query Employees for Dropdown
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
      setIsApplyModalOpen(false);
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
      setIsRepayingLoan(false);
      if (selectedDetailLoan) {
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

  // Aggregate Metrics
  const totalPrincipal = (loans ?? []).reduce((acc, cur) => acc + cur.principalAmount, 0);
  const totalRemaining = (loans ?? []).reduce((acc, cur) => acc + cur.remainingAmount, 0);
  const totalRepaidAll = (loans ?? []).reduce((acc, cur) => acc + (cur.principalAmount - cur.remainingAmount), 0);
  const pendingCount = (loans ?? []).filter((l) => l.status === 'PENDING').length;
  const activeLoans = (loans ?? []).filter((l) => l.status === 'APPROVED' || l.status === 'DISBURSED');
  const monthlyEmiRunRate = activeLoans.reduce((acc, cur) => acc + cur.monthlyEmi, 0);

  // Fund Pool Limit (Hạn mức quỹ phúc lợi giả định của DN)
  const fundLimit = 2000000000; // 2 Tỷ VND
  const fundUtilization = Math.min(100, Math.round((totalPrincipal / fundLimit) * 100));

  // Quick Preset Selector
  const applyPresetPackage = (pkg: typeof PRESET_PACKAGES[0]) => {
    setLoanType(pkg.category);
    setPrincipalAmount(pkg.amount);
    setTermMonths(pkg.term);
    setInterestRate(pkg.rate);
    setReason(`Đăng ký theo ${pkg.title}`);
    setIsApplyModalOpen(true);
  };

  if (isLoading) return <LoadingState text="Đang đồng bộ dữ liệu sổ cái khoản vay & phúc lợi..." />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 pb-16">
      {/* Workspace Header Chuẩn Doanh Nghiệp */}
      <WorkspaceHeader
        title="Quản trị Tạm ứng & Khoản vay Phúc lợi"
        description="Quản lý hạn ngạch quỹ phúc lợi tài chính nội bộ, thẩm định giải ngân và tự động trích trừ lương định kỳ tuân thủ Điều 101, 102 Bộ luật Lao động 2019 (khấu trừ tối đa ≤ 30% lương thực lĩnh)."
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
                setTargetUserId(user?.id ?? '');
                setTargetEmployeeName(user?.fullName ?? '');
                setIsApplyModalOpen(true);
              }}
              className="text-xs h-9 gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>Đăng Ký Vay Mới</span>
            </Button>
          </div>
        }
      />

      {/* Smart Fund Health & Executive Telemetry Ribbon */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tình Trạng Quỹ Phúc Lợi Nhân Sự Doanh Nghiệp (Năm 2026)
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-foreground">
                {(totalPrincipal / 1_000_000).toLocaleString('vi-VN')} Tr
              </span>
              <span className="text-xs text-muted-foreground">
                đã cấp trên tổng hạn ngạch <b className="text-foreground">{(fundLimit / 1_000_000).toLocaleString('vi-VN')} Tr VND</b> ({fundUtilization}% dung lượng quỹ)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Tuân thủ BLLĐ Điều 102</p>
                <p className="text-muted-foreground text-2xs">Khấu trừ lương tự động ≤ 30%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Kỳ hoàn nợ kế tiếp</p>
                <p className="text-muted-foreground text-2xs">Kỳ lương ngày 05 tháng tới</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Fund Meter */}
        <div className="mt-3.5 space-y-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-l-full"
              style={{ width: `${fundUtilization}%` }}
              title={`Đã giải ngân: ${fundUtilization}%`}
            />
            <div
              className="bg-emerald-500/80 h-full transition-all duration-500"
              style={{ width: `${Math.min(100 - fundUtilization, Math.round((totalRepaidAll / fundLimit) * 100))}%` }}
              title="Đã thu hồi quay vòng"
            />
          </div>
          <div className="flex justify-between text-2xs text-muted-foreground font-mono">
            <span>Đã giải ngân: {fundUtilization}%</span>
            <span>Khả dụng cho vay mới: {(100 - fundUtilization)}% ({( (fundLimit - totalRemaining) / 1_000_000).toFixed(0)} Tr)</span>
          </div>
        </div>
      </div>

      {/* 4 Smart KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NumberCard
          title="Tổng Gốc Cho Vay"
          value={`${(totalPrincipal / 1_000_000).toFixed(0)} Tr`}
          subtitle={`${(loans ?? []).length} hồ sơ đã được tài trợ`}
          icon={Wallet}
        />
        <NumberCard
          title="Dư Nợ Đang Thu Hồi"
          value={`${(totalRemaining / 1_000_000).toFixed(0)} Tr`}
          subtitle={`Đã thu hồi ${(totalRepaidAll / 1_000_000).toFixed(0)} Tr (${totalPrincipal ? Math.round((totalRepaidAll / totalPrincipal) * 100) : 0}%)`}
          icon={TrendingDown}
          trend={{ value: 'Đúng hạn 100%', isPositive: true }}
        />
        <NumberCard
          title="Thu Hồi Qua Lương (EMI)"
          value={`${(monthlyEmiRunRate / 1_000_000).toFixed(1)} Tr`}
          subtitle={`${activeLoans.length} nhân sự khấu trừ tháng này`}
          icon={CreditCard}
        />
        <NumberCard
          title="Đơn Chờ Thẩm Định"
          value={String(pendingCount)}
          subtitle={pendingCount > 0 ? "Cần HR & Ban Giám đốc duyệt" : "Tất cả hồ sơ đã duyệt xong"}
          icon={AlertCircle}
          trend={pendingCount > 0 ? { value: `${pendingCount} đơn mới`, isPositive: false } : { value: 'Sạch hàng chờ', isPositive: true }}
        />
      </div>

      {/* Smart Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'ledger'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Sổ Cái & Danh Sách ({filteredLoans.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'pipeline'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-blue-600" />
            <span>Pipeline Thẩm Định</span>
            {pendingCount > 0 && (
              <span className="h-4 px-1.5 rounded-full bg-amber-500/20 text-amber-700 text-2xs font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'simulator'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-600" />
            <span>Studio Mô Phỏng Khấu Trừ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'packages'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span>Gói Phúc Lợi Ưu Đãi</span>
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden lg:inline font-mono">
          HRMIS PRO · Quản lý tài chính cá nhân người lao động
        </span>
      </div>

      {/* ================= TAB 1: SỔ CÁI KHOẢN VAY (LEDGER & PROGRESS) ================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Quick Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo tên nhân sự, loại vay, lý do..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 h-9 rounded-md border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'PENDING', label: 'Chờ thẩm định' },
                { key: 'APPROVED', label: 'Đang thu hồi' },
                { key: 'COMPLETED', label: 'Đã hoàn tất' },
                { key: 'REJECTED', label: 'Đã từ chối' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setStatusFilter(pill.key)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium border ${
                    statusFilter === pill.key
                      ? 'bg-foreground text-background border-foreground font-semibold'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Table of Loans with Repayment Progress Bar */}
          {filteredLoans.length === 0 ? (
            <EmptyState
              title="Không tìm thấy khoản vay phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bấm nút 'Đăng Ký Vay Mới' để lập hồ sơ vay vốn đầu tiên."
            />
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
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
                  <tbody className="divide-y divide-border text-foreground">
                    {filteredLoans.map((loan) => {
                      const repaid = Math.max(0, loan.principalAmount - loan.remainingAmount);
                      const percent = loan.principalAmount > 0 ? Math.min(100, Math.round((repaid / loan.principalAmount) * 100)) : 0;

                      return (
                        <tr key={loan.id} className="hover:bg-muted/30 transition-colors group">
                          {/* Nhân viên */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                                {loan.employeeName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{loan.employeeName}</p>
                                <p className="text-2xs text-muted-foreground font-mono">
                                  {formatDate(loan.createdAt)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Gói vay */}
                          <td className="py-3 px-4">
                            <span className="inline-block font-medium text-foreground truncate max-w-xs">
                              {loan.loanType}
                            </span>
                            {loan.reason && (
                              <p className="text-2xs text-muted-foreground truncate max-w-xs mt-0.5">
                                {loan.reason}
                              </p>
                            )}
                          </td>

                          {/* Gốc vay */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            {loan.principalAmount.toLocaleString('vi-VN')} đ
                          </td>

                          {/* Kỳ hạn */}
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium text-2xs border border-border">
                              {loan.termMonths} tháng
                            </span>
                          </td>

                          {/* Khấu trừ tháng */}
                          <td className="py-3 px-4 text-right font-mono font-semibold text-primary">
                            {loan.monthlyEmi.toLocaleString('vi-VN')} đ
                          </td>

                          {/* Visual Repayment Progress Bar */}
                          <td className="py-3 px-4 min-w-[140px]">
                            <div className="space-y-1">
                              <div className="flex justify-between text-2xs font-mono">
                                <span className="font-semibold text-foreground">{percent}%</span>
                                <span className="text-muted-foreground">Còn {(loan.remainingAmount / 1_000_000).toFixed(1)} Tr</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    percent >= 100
                                      ? 'bg-blue-600'
                                      : percent > 0
                                      ? 'bg-emerald-600'
                                      : 'bg-muted-foreground/30'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Trạng thái */}
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

                          {/* Thao tác */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedDetailLoan(loan)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                title="Xem sổ khấu trừ lương & chi tiết"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>

                              {loan.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => decideMutation.mutate({ id: loan.id, status: 'APPROVED' })}
                                    className="h-7 px-2 bg-emerald-600 text-white hover:bg-emerald-700 text-2xs gap-1"
                                    title="Phê duyệt giải ngân"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Duyệt</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => decideMutation.mutate({ id: loan.id, status: 'REJECTED' })}
                                    className="h-7 px-2 text-destructive hover:bg-destructive/10 text-2xs"
                                    title="Từ chối"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}

                              {loan.status === 'APPROVED' && loan.remainingAmount > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDetailLoan(loan);
                                    setIsRepayingLoan(true);
                                    setRepayAmount(loan.monthlyEmi);
                                  }}
                                  className="h-7 px-2 text-2xs text-primary border-primary/20 hover:bg-primary/10 gap-1"
                                  title="Ghi nhận trả góp trước hạn"
                                >
                                  <DollarSign className="h-3 w-3" />
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

      {/* ================= TAB 2: PIPELINE THẨM ĐỊNH KANBAN ================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Cột 1: Chờ thẩm định */}
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>1. Chờ Thẩm Định</span>
                </div>
                <span className="text-2xs font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {loans?.filter((l) => l.status === 'PENDING').length || 0}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {loans?.filter((l) => l.status === 'PENDING').map((loan) => (
                  <div key={loan.id} className="rounded-md border border-border bg-muted/20 p-3 space-y-2 text-xs shadow-2xs hover:border-foreground/30 transition-all">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-foreground">{loan.employeeName}</span>
                      <span className="font-mono text-2xs text-muted-foreground">{formatDate(loan.createdAt)}</span>
                    </div>
                    <p className="text-2xs text-muted-foreground font-medium">{loan.loanType}</p>
                    <div className="flex items-baseline justify-between pt-1 border-t border-border/50 font-mono">
                      <span className="text-muted-foreground text-2xs">Số tiền vay:</span>
                      <span className="font-bold text-foreground">{loan.principalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono text-2xs">
                      <span className="text-muted-foreground">Trừ lương/tháng:</span>
                      <span className="font-bold text-primary">{loan.monthlyEmi.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex gap-1.5 pt-2">
                      <Button
                        size="sm"
                        onClick={() => decideMutation.mutate({ id: loan.id, status: 'APPROVED' })}
                        className="flex-1 h-7 text-2xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Phê Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decideMutation.mutate({ id: loan.id, status: 'REJECTED' })}
                        className="h-7 text-2xs text-destructive hover:bg-destructive/10 px-2"
                      >
                        Loại
                      </Button>
                    </div>
                  </div>
                ))}
                {(!loans || loans.filter((l) => l.status === 'PENDING').length === 0) && (
                  <div className="p-6 text-center text-2xs text-muted-foreground border border-dashed border-border rounded-md">
                    Không có hồ sơ nào chờ duyệt
                  </div>
                )}
              </div>
            </div>

            {/* Cột 2: Đang thu hồi qua lương */}
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>2. Đang Trích Lương</span>
                </div>
                <span className="text-2xs font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {loans?.filter((l) => l.status === 'APPROVED' || l.status === 'DISBURSED').length || 0}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {loans?.filter((l) => l.status === 'APPROVED' || l.status === 'DISBURSED').map((loan) => {
                  const percent = Math.min(100, Math.round(((loan.principalAmount - loan.remainingAmount) / loan.principalAmount) * 100));
                  return (
                    <div
                      key={loan.id}
                      onClick={() => setSelectedDetailLoan(loan)}
                      className="rounded-md border border-border bg-muted/20 p-3 space-y-2 text-xs shadow-2xs hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-foreground">{loan.employeeName}</span>
                        <span className="px-1.5 py-0.5 rounded text-2xs bg-emerald-500/10 text-emerald-700 font-bold">
                          {percent}%
                        </span>
                      </div>
                      <p className="text-2xs text-muted-foreground truncate">{loan.loanType}</p>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex items-baseline justify-between font-mono text-2xs pt-1">
                        <span className="text-muted-foreground">Dư nợ còn:</span>
                        <span className="font-bold text-foreground">{(loan.remainingAmount / 1_000_000).toFixed(1)} Tr</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột 3: Đã hoàn tất */}
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>3. Đã Hoàn Tất</span>
                </div>
                <span className="text-2xs font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {loans?.filter((l) => l.status === 'COMPLETED').length || 0}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {loans?.filter((l) => l.status === 'COMPLETED').map((loan) => (
                  <div key={loan.id} className="rounded-md border border-border bg-muted/10 p-3 space-y-1 text-xs opacity-80">
                    <span className="font-bold text-foreground">{loan.employeeName}</span>
                    <p className="text-2xs text-muted-foreground">{loan.loanType}</p>
                    <p className="text-2xs text-emerald-700 font-semibold font-mono pt-1">
                      ✓ Đã tất toán {(loan.principalAmount / 1_000_000).toFixed(0)} Tr
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 4: Bác bỏ / Từ chối */}
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>4. Đã Từ Chối</span>
                </div>
                <span className="text-2xs font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {loans?.filter((l) => l.status === 'REJECTED').length || 0}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {loans?.filter((l) => l.status === 'REJECTED').map((loan) => (
                  <div key={loan.id} className="rounded-md border border-border bg-muted/10 p-3 space-y-1 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{loan.employeeName}</span>
                    <p className="text-2xs">{loan.loanType}</p>
                    <span className="inline-block text-2xs text-rose-700 font-semibold">
                      Chưa đủ điều kiện thâm niên
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: STUDIO MÔ PHỎNG & DỰ BÁO TÀI CHÍNH ================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bộ điều khiển tương tác bên trái */}
          <div className="lg:col-span-6 rounded-lg border border-border bg-card p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Bộ Điều Khiển Mô Phỏng Trả Góp</h3>
                  <p className="text-xs text-muted-foreground">Tự động tính toán theo quy định bảo vệ thu nhập Điều 102 BLLĐ 2019</p>
                </div>
              </div>
            </div>

            {/* Slider 1: Số tiền vay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Số tiền vay dự kiến:</label>
                <span className="font-mono text-sm font-bold text-primary">
                  {simAmount.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <input
                type="range"
                min={5000000}
                max={100000000}
                step={1000000}
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-2 bg-muted rounded-lg"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[10000000, 20000000, 30000000, 50000000, 80000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSimAmount(amt)}
                    className="px-2 py-0.5 rounded text-2xs font-mono border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    {(amt / 1_000_000).toFixed(0)}M
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Kỳ hạn trả góp */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Thời hạn trả góp (Tháng):</label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {simMonths} tháng ({(simMonths / 12).toFixed(1)} năm)
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={36}
                step={3}
                value={simMonths}
                onChange={(e) => setSimMonths(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-2 bg-muted rounded-lg"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[6, 12, 18, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSimMonths(m)}
                    className={`px-2 py-0.5 rounded text-2xs font-mono border transition-colors ${
                      simMonths === m
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {m} Tháng
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 3: Mức lương thực lĩnh */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Lương thực lĩnh hàng tháng (Net Pay):</label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {simSalary.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <input
                type="range"
                min={10000000}
                max={60000000}
                step={1000000}
                value={simSalary}
                onChange={(e) => setSimSalary(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-2 bg-muted rounded-lg"
              />
              <p className="text-2xs text-muted-foreground">
                Căn cứ để kiểm tra mức khấu trừ tối đa 30% lương theo Điều 102 Bộ luật Lao động.
              </p>
            </div>

            {/* Tùy chọn lãi suất phúc lợi */}
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border text-xs">
              <div>
                <span className="font-semibold text-foreground block">Lãi suất ưu đãi nội bộ:</span>
                <span className="text-2xs text-muted-foreground">Gói phúc lợi công ty trợ giá</span>
              </div>
              <div className="flex items-center gap-2">
                {[0, 2, 3.5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSimRate(r)}
                    className={`px-2.5 py-1 rounded text-2xs font-mono font-bold border transition-colors ${
                      simRate === r
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {r}%/năm
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                setPrincipalAmount(simAmount);
                setTermMonths(simMonths);
                setInterestRate(simRate);
                setIsApplyModalOpen(true);
              }}
              className="w-full h-9 gap-1.5 text-xs font-semibold"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Đưa Thông Số Này Vào Đơn Vay</span>
            </Button>
          </div>

          {/* Bảng đồng hồ an toàn tài chính & Lịch trình bên phải */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Chỉ Số Khấu Trừ & Sức Khỏe Tài Chính</span>
                <span className="font-mono text-foreground font-bold">Tháng {new Date().getMonth() + 1}/2026</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-md bg-muted/40 border border-border space-y-0.5">
                  <span className="text-2xs text-muted-foreground block">Khấu trừ lương mỗi tháng (EMI):</span>
                  <span className="text-lg font-extrabold font-mono text-primary">
                    {simMonthly.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-2xs text-muted-foreground block">
                    Gồm gốc: {Math.round(simAmount / simMonths).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="p-3 rounded-md bg-muted/40 border border-border space-y-0.5">
                  <span className="text-2xs text-muted-foreground block">Tỷ lệ chiếm trên thực lĩnh:</span>
                  <span className={`text-lg font-extrabold font-mono ${isSafeDeduction ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simDeductionPercent}%
                  </span>
                  <span className="text-2xs text-muted-foreground block">
                    Trần tối đa luật định: 30.0%
                  </span>
                </div>
              </div>

              {/* Legal Meter Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-2xs font-semibold">
                  <span className="text-muted-foreground">Thước đo an toàn thu nhập:</span>
                  <span className={isSafeDeduction ? 'text-emerald-700' : 'text-rose-700'}>
                    {isSafeDeduction ? '✓ Trong ngưỡng an toàn' : '⚠️ Vượt trần 30% lương'}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      simDeductionPercent <= 20
                        ? 'bg-emerald-500'
                        : simDeductionPercent <= 30
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (simDeductionPercent / 30) * 100)}%` }}
                  />
                </div>
              </div>

              {/* System Recommendation */}
              <div
                className={`p-3 rounded-md border text-xs flex items-start gap-2.5 ${
                  isSafeDeduction
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-800'
                }`}
              >
                {isSafeDeduction ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold">
                    {isSafeDeduction
                      ? 'Phương án tài chính đạt chuẩn Điều 102 BLLĐ 2019'
                      : 'Cảnh báo vi phạm trần khấu trừ tiền lương'}
                  </p>
                  <p className="text-2xs opacity-90 leading-relaxed">
                    {isSafeDeduction
                      ? `Mức trích trừ ${simMonthly.toLocaleString('vi-VN')} đ/tháng chiếm ${simDeductionPercent}% lương thực lĩnh, đảm bảo người lao động giữ lại ít nhất 70% thu nhập để ổn định đời sống gia đình.`
                      : `Mức trích trừ chiếm ${simDeductionPercent}% lương, vượt trần 30% luật định. Khuyến nghị tăng kỳ hạn lên tối thiểu ${Math.ceil(simTotalPayable / (simSalary * 0.3))} tháng để đưa tỷ lệ về dưới 30%.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Bảng dự tính 5 kỳ trả nợ đầu tiên */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2 shadow-xs">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                Bảng Lịch Trình Khấu Trừ Dự Tính (6 Kỳ Đầu)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-2 px-2.5">Kỳ</th>
                      <th className="py-2 px-2.5 text-right">Khấu trừ EMI</th>
                      <th className="py-2 px-2.5 text-right">Gốc trả</th>
                      <th className="py-2 px-2.5 text-right">Dư nợ còn lại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {Array.from({ length: Math.min(6, simMonths) }).map((_, idx) => {
                      const installmentNum = idx + 1;
                      const emi = simMonthly;
                      const principalPaid = Math.round(simAmount / simMonths);
                      const remaining = Math.max(0, simAmount - principalPaid * installmentNum);

                      return (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-1.5 px-2.5 font-sans font-medium text-foreground">Kỳ {installmentNum}</td>
                          <td className="py-1.5 px-2.5 text-right text-primary font-semibold">{emi.toLocaleString('vi-VN')} đ</td>
                          <td className="py-1.5 px-2.5 text-right text-foreground">{principalPaid.toLocaleString('vi-VN')} đ</td>
                          <td className="py-1.5 px-2.5 text-right text-muted-foreground">{remaining.toLocaleString('vi-VN')} đ</td>
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

      {/* ================= TAB 4: DANH MỤC 4 GÓI VAY PHÚC LỢI THIẾT KẾ SẴN ================= */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_PACKAGES.map((pkg) => {
              const IconComp = pkg.icon;
              return (
                <div
                  key={pkg.id}
                  className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs hover:border-primary/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{pkg.title}</h4>
                          <p className="text-2xs text-muted-foreground">{pkg.highlight}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-2xs font-bold border ${pkg.badgeColor}`}>
                        {pkg.badge}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {pkg.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-md bg-muted/40 border border-border text-center text-xs font-mono">
                      <div>
                        <span className="text-2xs text-muted-foreground block font-sans">Hạn mức tối đa</span>
                        <span className="font-bold text-foreground">{(pkg.amount / 1_000_000).toFixed(0)} Triệu</span>
                      </div>
                      <div className="border-x border-border">
                        <span className="text-2xs text-muted-foreground block font-sans">Kỳ hạn vay</span>
                        <span className="font-bold text-foreground">{pkg.term} tháng</span>
                      </div>
                      <div>
                        <span className="text-2xs text-muted-foreground block font-sans">Lãi suất</span>
                        <span className="font-bold text-emerald-700">{pkg.rate}%/năm</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Điều kiện: {pkg.eligibility}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-primary">
                      Khấu trừ ~{Math.round(pkg.amount / pkg.term).toLocaleString('vi-VN')} đ/tháng
                    </span>
                    <Button
                      size="sm"
                      onClick={() => applyPresetPackage(pkg)}
                      className="text-xs h-8 gap-1 font-semibold"
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

      {/* ================= MODAL XEM CHI TIẾT KHOẢN VAY & SỔ THU HỒI ================= */}
      {selectedDetailLoan && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-xl overflow-hidden animate-in zoom-in-95 space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Sổ Chi Tiết Khoản Vay & Khấu Trừ</h3>
                  <p className="text-xs text-muted-foreground">
                    Mã hồ sơ: <span className="font-mono font-semibold text-foreground">{selectedDetailLoan.id.slice(0, 8)}</span> · Người vay: <b className="text-foreground">{selectedDetailLoan.employeeName}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDetailLoan(null);
                  setIsRepayingLoan(false);
                }}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thông tin tài chính chính */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center font-mono">
              <div className="p-2.5 rounded-md bg-muted/40 border border-border">
                <span className="text-2xs text-muted-foreground block font-sans">Gốc vay</span>
                <span className="font-bold text-foreground text-sm">{selectedDetailLoan.principalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="p-2.5 rounded-md bg-muted/40 border border-border">
                <span className="text-2xs text-muted-foreground block font-sans">Kỳ hạn</span>
                <span className="font-bold text-foreground text-sm">{selectedDetailLoan.termMonths} tháng</span>
              </div>
              <div className="p-2.5 rounded-md bg-muted/40 border border-border">
                <span className="text-2xs text-muted-foreground block font-sans">EMI mỗi tháng</span>
                <span className="font-bold text-primary text-sm">{selectedDetailLoan.monthlyEmi.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="p-2.5 rounded-md bg-muted/40 border border-border">
                <span className="text-2xs text-muted-foreground block font-sans">Dư nợ còn lại</span>
                <span className="font-bold text-emerald-700 text-sm">{selectedDetailLoan.remainingAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Form thu hồi sớm / nộp tiền trước hạn nếu mở */}
            {isRepayingLoan ? (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Thu Hồi Nợ Trực Tiếp / Tất Toán Sớm
                  </span>
                  <button
                    onClick={() => setIsRepayingLoan(false)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Hủy bỏ
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step={500000}
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(Number(e.target.value))}
                      className="h-9 text-xs font-mono font-bold"
                      placeholder="Nhập số tiền thu hồi..."
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={repayAmount <= 0 || repayMutation.isPending}
                    onClick={() => repayMutation.mutate({ id: selectedDetailLoan.id, amount: repayAmount })}
                    className="h-9 text-xs font-semibold gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{repayMutation.isPending ? 'Đang ghi nhận...' : 'Xác Nhận Thu Nợ'}</span>
                  </Button>
                </div>
                <p className="text-2xs text-muted-foreground">
                  Số tiền thanh toán sẽ được trừ trực tiếp vào dư nợ còn lại của hồ sơ này.
                </p>
              </div>
            ) : null}

            {/* Bảng lịch trình khấu trừ từng tháng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lịch Trình Khấu Trừ Bảng Lương (Amortization Schedule)
                </span>
                <span className="text-2xs text-muted-foreground">
                  Đã trả: {Math.round(selectedDetailLoan.principalAmount - selectedDetailLoan.remainingAmount).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="rounded-md border border-border overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Kỳ thứ</th>
                      <th className="py-2 px-3 text-right">Khấu trừ EMI</th>
                      <th className="py-2 px-3 text-right">Gốc thu hồi</th>
                      <th className="py-2 px-3 text-right">Dư nợ sau kỳ</th>
                      <th className="py-2 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {Array.from({ length: selectedDetailLoan.termMonths }).map((_, idx) => {
                      const kỳ = idx + 1;
                      const emi = selectedDetailLoan.monthlyEmi;
                      const principalPerPeriod = Math.round(selectedDetailLoan.principalAmount / selectedDetailLoan.termMonths);
                      const totalRepaidSoFar = selectedDetailLoan.principalAmount - selectedDetailLoan.remainingAmount;
                      const isPaid = totalRepaidSoFar >= principalPerPeriod * kỳ;
                      const remainingAfter = Math.max(0, selectedDetailLoan.principalAmount - principalPerPeriod * kỳ);

                      return (
                        <tr key={idx} className={isPaid ? 'bg-muted/20' : 'hover:bg-muted/30'}>
                          <td className="py-2 px-3 font-sans font-medium text-foreground">
                            Kỳ {kỳ}
                          </td>
                          <td className="py-2 px-3 text-right text-primary font-semibold">
                            {emi.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2 px-3 text-right text-foreground">
                            {principalPerPeriod.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2 px-3 text-right text-muted-foreground">
                            {remainingAfter.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700">
                                <CheckCircle className="h-3 w-3" /> Đã trích
                              </span>
                            ) : (
                              <span className="text-2xs text-muted-foreground">
                                Kỳ sắp tới
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs h-8 gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Khế Ước Nhận Nợ</span>
              </Button>

              <div className="flex items-center gap-2">
                {selectedDetailLoan.status === 'APPROVED' && selectedDetailLoan.remainingAmount > 0 && !isRepayingLoan && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsRepayingLoan(true);
                      setRepayAmount(selectedDetailLoan.monthlyEmi);
                    }}
                    className="text-xs h-8 gap-1.5 text-primary border-primary/30"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Thu Hồi Sớm</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDetailLoan(null);
                    setIsRepayingLoan(false);
                  }}
                  className="text-xs h-8"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ĐĂNG KÝ KHOẢN VAY MỚI ================= */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Lập Hồ Sơ Đăng Ký Vay Phúc Lợi</h3>
                <p className="text-xs text-muted-foreground">Hồ sơ sẽ được chuyển tới Phòng Nhân sự & Kế toán thẩm định</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chọn nhân sự thụ hưởng */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">Nhân sự thụ hưởng khoản vay *</label>
              <Select
                value={targetUserId}
                onChange={(e) => {
                  setTargetUserId(e.target.value);
                  const found = employeeList?.find((emp) => emp.id === e.target.value);
                  if (found) setTargetEmployeeName(found.fullName);
                }}
                className="w-full h-9 text-xs"
              >
                <option value="">-- Chọn nhân viên trong danh sách --</option>
                {employeeList?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} {emp.employeeCode ? `(${emp.employeeCode})` : ''} {emp.orgUnit?.name ? `· ${emp.orgUnit.name}` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Loại khoản vay */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">Mục đích / Gói vay phúc lợi</label>
              <Select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full h-9 text-xs"
              >
                <option value="Tạm ứng mua thiết bị làm việc">Tạm ứng mua thiết bị làm việc (Lãi 0%)</option>
                <option value="Tạm ứng khẩn cấp gia đình">Tạm ứng khẩn cấp gia đình (Lãi 0%)</option>
                <option value="Vay học tập & nâng cao nghiệp vụ">Vay học tập & nâng cao nghiệp vụ (Lãi 2%)</option>
                <option value="Vay hỗ trợ nhà ở / phương tiện">Vay hỗ trợ nhà ở / phương tiện (Lãi 3.5%)</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Số tiền */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Số tiền vay (VND) *</label>
                <Input
                  type="number"
                  step={1000000}
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                  className="w-full h-9 text-xs font-mono font-bold"
                />
              </div>

              {/* Kỳ hạn */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Kỳ hạn trả góp *</label>
                <Select
                  value={termMonths}
                  onChange={(e) => setTermMonths(Number(e.target.value))}
                  className="w-full h-9 text-xs"
                >
                  <option value={6}>6 tháng</option>
                  <option value={12}>12 tháng (1 năm)</option>
                  <option value={18}>18 tháng (1.5 năm)</option>
                  <option value={24}>24 tháng (2 năm)</option>
                  <option value={36}>36 tháng (3 năm)</option>
                </Select>
              </div>
            </div>

            {/* Smart Preview Box */}
            <div className="p-3 rounded-md bg-muted/40 border border-border text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Trích lương hàng tháng (EMI):</span>
                <span className="font-bold text-primary">
                  {Math.round(principalAmount / termMonths).toLocaleString('vi-VN')} VND/tháng
                </span>
              </div>
              <div className="flex justify-between text-2xs text-muted-foreground font-sans">
                <span>Tuân thủ Điều 102 BLLĐ 2019:</span>
                <span className="text-emerald-700 font-bold">Tự động khống chế trần ≤ 30% lương thực lĩnh</span>
              </div>
            </div>

            {/* Lý do */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">Lý do & Cam kết người vay</label>
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nêu rõ lý do vay và cam kết hoàn trả đầy đủ theo kỳ lương..."
                className="w-full text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-xs h-9"
              >
                Hủy bỏ
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
                className="text-xs h-9 font-semibold gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{applyMutation.isPending ? 'Đang gửi hồ sơ...' : 'Gửi Đăng Ký Vay'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
