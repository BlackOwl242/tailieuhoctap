'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Plus, CheckCircle2, Clock, Calculator,
  Filter, Search, ArrowRight, ShieldCheck, AlertCircle,
  TrendingDown, DollarSign, Wallet, FileText, Check, X
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { useAuthStore } from '@/lib/auth-store';

interface LoanItem {
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

export default function LoansPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'calculator'>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [loanType, setLoanType] = useState('Tạm ứng mua thiết bị làm việc');
  const [principalAmount, setPrincipalAmount] = useState(24000000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(0);
  const [reason, setReason] = useState('Nâng cấp laptop trạm cấu hình cao cho dự án');

  // Simulator State
  const [simAmount, setSimAmount] = useState(30000000);
  const [simMonths, setSimMonths] = useState(12);
  const [simSalary, setSimSalary] = useState(25000000);

  const { data: loans, isLoading, isError, error, refetch } = useQuery<LoanItem[]>({
    queryKey: ['hrms-loans'],
    queryFn: async () => (await api.get('/hrms/loans')).data,
  });

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
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, decisionNote }: { id: string; status: 'APPROVED' | 'REJECTED'; decisionNote?: string }) => {
      return (await api.patch(`/hrms/loans/${id}/decide`, { status, decisionNote })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-loans'] });
    },
  });

  // Calculate Simulator Values
  const simMonthly = Math.round(simAmount / simMonths);
  const simDeductionPercent = ((simMonthly / simSalary) * 100).toFixed(1);
  const isSafeDeduction = Number(simDeductionPercent) <= 30; // Điều 102 BLLĐ 2019

  if (isLoading) return <LoadingState text="Đang tải danh sách khoản vay nhân viên..." />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const filteredLoans = (loans ?? []).filter(
    (l) =>
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.loanType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPrincipal = (loans ?? []).reduce((acc, cur) => acc + cur.principalAmount, 0);
  const totalRemaining = (loans ?? []).reduce((acc, cur) => acc + cur.remainingAmount, 0);
  const pendingCount = (loans ?? []).filter((l) => l.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản trị Tạm ứng & Khoản vay Phúc lợi"
        description="Quản lý chính sách cho vay phúc lợi nội bộ, phê duyệt giải ngân và khấu trừ tự động vào bảng lương định kỳ tuân thủ Điều 101, 102 Bộ luật Lao động 2019 (khấu trừ ≤ 30% lương thực lĩnh)."
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Khoản vay & Tạm ứng' }]}
        actions={
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Đăng Ký Vay Phúc Lợi
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NumberCard
          title="Tổng Gốc Cho Vay"
          value={`${(totalPrincipal / 1_000_000).toFixed(0)} Tr`}
          subtitle="Quỹ phúc lợi nhân viên"
          icon={Wallet}
        />
        <NumberCard
          title="Dư Nợ Còn Lại"
          value={`${(totalRemaining / 1_000_000).toFixed(0)} Tr`}
          subtitle="Đang thu hồi qua lương"
          icon={TrendingDown}
          trend={{ value: 'Đúng hạn 100%', isPositive: true }}
        />
        <NumberCard
          title="Khoản Đang Thu Hồi"
          value={String((loans ?? []).filter((l) => l.status === 'APPROVED').length)}
          subtitle="Tự trích EMI hàng tháng"
          icon={Clock}
        />
        <NumberCard
          title="Đơn Chờ Thẩm Định"
          value={String(pendingCount)}
          subtitle="Chờ HR / Giám đốc duyệt"
          icon={AlertCircle}
          trend={pendingCount > 0 ? { value: `${pendingCount} đơn`, isPositive: false } : undefined}
        />
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          Danh sách Khoản vay ({filteredLoans.length})
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'calculator'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Calculator className="h-3.5 w-3.5" />
          Mô phỏng Khấu trừ Lương (Điều 102 BLLĐ)
        </button>
      </div>

      {activeTab === 'all' ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo tên nhân viên, mục đích vay..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/80 bg-card text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Table of Loans */}
          {filteredLoans.length === 0 ? (
            <EmptyState
              title="Chưa có khoản vay nào"
              description="Hiện tại không có khoản vay hay đề xuất tạm ứng nào trong hệ thống."
            />
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Nhân sự</th>
                      <th className="py-3 px-4">Loại khoản vay</th>
                      <th className="py-3 px-4 text-right">Số tiền gốc</th>
                      <th className="py-3 px-4 text-center">Kỳ hạn</th>
                      <th className="py-3 px-4 text-right">Trừ lương/tháng (EMI)</th>
                      <th className="py-3 px-4 text-right">Dư nợ còn lại</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-foreground">
                    {filteredLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-semibold">{loan.employeeName}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{loan.loanType}</p>
                          {loan.reason && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{loan.reason}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {loan.principalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {loan.termMonths} tháng
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-primary">
                          {loan.monthlyEmi.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-muted-foreground">
                          {loan.remainingAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              loan.status === 'APPROVED' || loan.status === 'DISBURSED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : loan.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : loan.status === 'COMPLETED'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {loan.status === 'APPROVED'
                              ? 'Đang thu hồi'
                              : loan.status === 'PENDING'
                              ? 'Chờ duyệt'
                              : loan.status === 'COMPLETED'
                              ? 'Đã hoàn tất'
                              : 'Từ chối'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {loan.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => decideMutation.mutate({ id: loan.id, status: 'APPROVED' })}
                                className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                title="Phê duyệt giải ngân"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => decideMutation.mutate({ id: loan.id, status: 'REJECTED' })}
                                className="p-1 rounded-md bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                                title="Từ chối"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Loan Simulator Card */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Công Cụ Mô Phỏng Trả Góp
            </h3>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Số tiền vay (VND)</label>
              <input
                type="number"
                step={1000000}
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border bg-muted/20 text-sm font-bold text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Kỳ hạn trả góp (Tháng)</label>
              <select
                value={simMonths}
                onChange={(e) => setSimMonths(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border bg-muted/20 text-xs font-medium text-foreground outline-hidden focus:border-primary"
              >
                <option value={3}>3 tháng</option>
                <option value={6}>6 tháng</option>
                <option value={12}>12 tháng (1 năm)</option>
                <option value={24}>24 tháng (2 năm)</option>
                <option value={36}>36 tháng (3 năm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Lương thực lĩnh hàng tháng (VND)</label>
              <input
                type="number"
                step={1000000}
                value={simSalary}
                onChange={(e) => setSimSalary(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border bg-muted/20 text-sm font-bold text-foreground outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/30 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Kết Quả Khấu Trừ Dự Kiến
              </span>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs text-muted-foreground">Trừ vào lương mỗi tháng:</span>
                  <span className="text-base font-extrabold text-primary font-mono">
                    {simMonthly.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs text-muted-foreground">Tỷ lệ trên lương thực lĩnh:</span>
                  <span className={`text-sm font-bold ${isSafeDeduction ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simDeductionPercent}%
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                isSafeDeduction
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {isSafeDeduction
                    ? 'Hợp lệ theo Điều 102 Bộ luật Lao động 2019'
                    : 'Cảnh báo vi phạm Điều 102 BLLĐ 2019'}
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {isSafeDeduction
                    ? 'Mức khấu trừ không quá 30% tiền lương thực lĩnh, đảm bảo mức sống tối thiểu cho người lao động.'
                    : 'Mức khấu trừ vượt quá 30% lương. Vui lòng tăng số tháng trả góp để giảm mức đóng mỗi tháng.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đăng Ký Vay */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Đăng Ký Vay Vốn Phúc Lợi Nội Bộ</h3>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Mục đích / Loại khoản vay</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-medium text-foreground outline-hidden focus:border-primary"
              >
                <option value="Tạm ứng mua thiết bị làm việc">Tạm ứng mua thiết bị làm việc</option>
                <option value="Vay hỗ trợ nhà ở / phương tiện">Vay hỗ trợ nhà ở / phương tiện</option>
                <option value="Vay học tập & nâng cao nghiệp vụ">Vay học tập & nâng cao nghiệp vụ</option>
                <option value="Tạm ứng khẩn cấp gia đình">Tạm ứng khẩn cấp gia đình</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Số tiền vay (VND)</label>
              <input
                type="number"
                step={1000000}
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-bold text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Thời hạn trả góp</label>
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-medium text-foreground outline-hidden focus:border-primary"
              >
                <option value={6}>6 tháng (Trừ {(principalAmount / 6).toLocaleString('vi-VN')} đ/tháng)</option>
                <option value={12}>12 tháng (Trừ {(principalAmount / 12).toLocaleString('vi-VN')} đ/tháng)</option>
                <option value={24}>24 tháng (Trừ {(principalAmount / 24).toLocaleString('vi-VN')} đ/tháng)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Lý do & Cam kết</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  applyMutation.mutate({
                    userId: user?.id ?? 'demo-user',
                    employeeName: user?.fullName ?? 'Nhân viên Demo',
                    loanType,
                    principalAmount,
                    termMonths,
                    interestRate,
                    reason,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Gửi Hồ Sơ Vay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
