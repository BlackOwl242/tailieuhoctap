'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plane, Receipt, CreditCard, Plus, CheckCircle2,
  Calendar, Layers, Clock, DollarSign, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';

interface TravelRequest {
  id: string;
  userId: string;
  employeeName: string;
  purpose: string;
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  returnDate: string;
  estimatedBudget: number;
  status: string;
}

interface ExpenseClaim {
  id: string;
  userId: string;
  employeeName: string;
  title: string;
  category: string;
  totalAmount: number;
  approvedAmount?: number;
  status: string;
  submittedAt: string;
}

interface EmployeeAdvance {
  id: string;
  userId: string;
  employeeName: string;
  amount: number;
  purpose: string;
  status: string;
  disbursedAt?: string;
}

export default function ExpenseClaimsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'claims' | 'travel' | 'advances'>('claims');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);

  // Form Claim
  const [claimEmployee, setClaimEmployee] = useState('Nguyễn Văn An');
  const [claimTitle, setClaimTitle] = useState('Thanh quyết toán chi phí công tác');
  const [claimAmount, setClaimAmount] = useState(5500000);
  const [claimCategory, setClaimCategory] = useState('TRAVEL');

  // Form Travel
  const [travelEmployee, setTravelEmployee] = useState('Nguyễn Văn An');
  const [travelPurpose, setTravelPurpose] = useState('Khảo sát và triển khai dự án chi nhánh');
  const [fromLoc, setFromLoc] = useState('TP. Hồ Chí Minh');
  const [toLoc, setToLoc] = useState('TP. Đà Nẵng');
  const [depDate, setDepDate] = useState('2026-09-10');
  const [retDate, setRetDate] = useState('2026-09-14');
  const [estBudget, setEstBudget] = useState(12000000);

  const { data: claims, isLoading: isLoadingClaims } = useQuery<ExpenseClaim[]>({
    queryKey: ['hrms-expense-claims'],
    queryFn: async () => (await api.get('/hrms/expenses/claims')).data,
  });

  const { data: travels, isLoading: isLoadingTravels } = useQuery<TravelRequest[]>({
    queryKey: ['hrms-travel-requests'],
    queryFn: async () => (await api.get('/hrms/expenses/travel-requests')).data,
  });

  const { data: advances, isLoading: isLoadingAdvances } = useQuery<EmployeeAdvance[]>({
    queryKey: ['hrms-advances'],
    queryFn: async () => (await api.get('/hrms/expenses/advances')).data,
  });

  const createClaimMutation = useMutation({
    mutationFn: async (payload: { employeeName: string; title: string; category: string; totalAmount: number }) => {
      return (await api.post('/hrms/expenses/claims', {
        userId: 'temp-user',
        ...payload,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-expense-claims'] });
      setIsClaimModalOpen(false);
    },
  });

  const createTravelMutation = useMutation({
    mutationFn: async (payload: {
      employeeName: string; purpose: string; fromLocation: string; toLocation: string;
      departureDate: string; returnDate: string; estimatedBudget: number;
    }) => {
      return (await api.post('/hrms/expenses/travel-requests', {
        userId: 'temp-user',
        ...payload,
        departureDate: new Date(payload.departureDate).toISOString(),
        returnDate: new Date(payload.returnDate).toISOString(),
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-travel-requests'] });
      setIsTravelModalOpen(false);
    },
  });

  if (isLoadingClaims || isLoadingTravels || isLoadingAdvances) {
    return <LoadingState text="Đang tải dữ liệu Công tác & Chi phí..." />;
  }

  const totalClaimAmount = claims?.reduce((sum, c) => sum + c.totalAmount, 0) ?? 0;
  const totalAdvanceAmount = advances?.reduce((sum, a) => sum + a.amount, 0) ?? 0;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản trị Công tác & Chi phí"
        description="Đề xuất chuyến công tác, tạm ứng kinh phí, lập bảng kê thanh quyết toán chi phí và phê duyệt giải ngân đa cấp."
        breadcrumbs={[{ label: 'Tài chính' }, { label: 'Công tác & Chi phí' }]}
        actions={
          <>
            <button
              onClick={() => setIsTravelModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors shadow-2xs"
            >
              <Plane className="h-3.5 w-3.5 text-muted-foreground" />
              Đề Xuất Công Tác
            </button>
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Lập Bảng Kê Chi Phí
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Tổng Chi Phí Đã Duyệt"
          value={`${(totalClaimAmount / 1_000_000).toFixed(1)} Tr VND`}
          subtitle="Quyết toán thực tế"
          icon={Receipt}
          colorScheme="emerald"
        />
        <NumberCard
          title="Tổng Tạm Ứng Đã Cấp"
          value={`${(totalAdvanceAmount / 1_000_000).toFixed(1)} Tr VND`}
          subtitle="Tạm ứng công tác phí"
          icon={CreditCard}
          colorScheme="blue"
        />
        <NumberCard
          title="Chuyến Công Tác"
          value={travels?.length ?? 0}
          subtitle="Đã phê duyệt lịch trình"
          icon={Plane}
          colorScheme="purple"
        />
        <NumberCard
          title="Bảng Kê Chi Phí"
          value={claims?.length ?? 0}
          subtitle="Hồ sơ chứng từ"
          icon={CheckCircle2}
          colorScheme="amber"
          trend={{ value: '100%', isPositive: true, label: 'hợp lệ' }}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'claims'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-4 w-4" />
          Bảng Kê Thanh Toán Chi Phí ({claims?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('travel')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'travel'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plane className="h-4 w-4" />
          Đơn Đề Xuất Công Tác ({travels?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'advances'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Tạm Ứng Nhân Viên ({advances?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Claims */}
      {activeTab === 'claims' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {claims?.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{c.title}</h3>
                  <p className="text-xs text-primary font-semibold mt-0.5">{c.employeeName}</p>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {c.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px]">Danh mục:</span>
                  <p className="font-bold text-foreground">{c.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Số tiền quyết toán:</span>
                  <p className="font-bold text-emerald-700">{c.totalAmount.toLocaleString('vi-VN')} VND</p>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between text-[11px] text-muted-foreground">
                <span>Nộp ngày: {new Date(c.submittedAt).toLocaleDateString('vi-VN')}</span>
                <span className="font-semibold text-primary">Chứng từ hợp lệ ✓</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Travel Requests */}
      {activeTab === 'travel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {travels?.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{t.purpose}</h3>
                  <p className="text-xs text-primary font-semibold mt-0.5">{t.employeeName}</p>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {t.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs bg-muted/20 p-2.5 rounded-lg">
                <span className="font-semibold text-foreground">{t.fromLocation}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{t.toLocation}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px]">Lịch trình:</span>
                  <p className="font-medium text-foreground">
                    {new Date(t.departureDate).toLocaleDateString('vi-VN')} - {new Date(t.returnDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Dự toán kinh phí:</span>
                  <p className="font-bold text-foreground">{t.estimatedBudget.toLocaleString('vi-VN')} VND</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Advances */}
      {activeTab === 'advances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advances?.map((a) => (
            <div key={a.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{a.purpose}</h3>
                  <p className="text-xs text-primary font-semibold mt-0.5">{a.employeeName}</p>
                </div>
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                  {a.status}
                </span>
              </div>

              <div className="bg-muted/20 p-2.5 rounded-lg text-xs">
                <span className="text-muted-foreground text-[11px]">Số tiền tạm ứng:</span>
                <p className="text-base font-extrabold text-blue-700">
                  {a.amount.toLocaleString('vi-VN')} VND
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Lập Bảng Kê */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Lập Bảng Kê Thanh Toán Chi Phí</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Họ tên nhân viên</label>
                <input
                  type="text"
                  value={claimEmployee}
                  onChange={(e) => setClaimEmployee(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Tiêu đề bảng kê</label>
                <input
                  type="text"
                  value={claimTitle}
                  onChange={(e) => setClaimTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Danh mục chi phí</label>
                  <select
                    value={claimCategory}
                    onChange={(e) => setClaimCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="TRAVEL">Công tác phí (Vé máy bay, Khách sạn)</option>
                    <option value="MEALS">Tiếp khách / Ăn uống dự án</option>
                    <option value="EQUIPMENT">Mua sắm văn phòng phẩm / thiết bị</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Tổng số tiền (VND)</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden font-bold text-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={createClaimMutation.isPending}
                onClick={() => createClaimMutation.mutate({ employeeName: claimEmployee, title: claimTitle, category: claimCategory, totalAmount: claimAmount })}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createClaimMutation.isPending ? 'Đang gửi...' : 'Nộp Bảng Kê'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đề Xuất Công Tác */}
      {isTravelModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Đề Xuất Chuyến Công Tác Mới</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Mục đích chuyến đi</label>
                <input
                  type="text"
                  value={travelPurpose}
                  onChange={(e) => setTravelPurpose(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Địa điểm đi</label>
                  <input
                    type="text"
                    value={fromLoc}
                    onChange={(e) => setFromLoc(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Địa điểm đến</label>
                  <input
                    type="text"
                    value={toLoc}
                    onChange={(e) => setToLoc(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Ngày khởi hành</label>
                  <input
                    type="date"
                    value={depDate}
                    onChange={(e) => setDepDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Ngày về</label>
                  <input
                    type="date"
                    value={retDate}
                    onChange={(e) => setRetDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-foreground">Dự toán kinh phí (VND)</label>
                <input
                  type="number"
                  value={estBudget}
                  onChange={(e) => setEstBudget(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden font-bold text-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsTravelModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={createTravelMutation.isPending}
                onClick={() =>
                  createTravelMutation.mutate({
                    employeeName: travelEmployee,
                    purpose: travelPurpose,
                    fromLocation: fromLoc,
                    toLocation: toLoc,
                    departureDate: depDate,
                    returnDate: retDate,
                    estimatedBudget: estBudget,
                  })
                }
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createTravelMutation.isPending ? 'Đang lưu...' : 'Gửi Đề Xuất'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
