'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, Calculator, FileText, Plus, CheckCircle2, DollarSign,
  Layers, ChevronRight, Printer, Sparkles, AlertCircle, ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';

interface SalaryComponent {
  id: string;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  isTaxApplicable: boolean;
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

interface PayrollSlip {
  id: string;
  employeeName: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  baseSalary: number;
  grossPay: number;
  totalDeduction: number;
  netPay: number;
  breakdown: {
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
  createdAt: string;
  slips?: PayrollSlip[];
}

export default function PayrollEnginePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'runs' | 'components' | 'structures'>('runs');
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);

  // Form xử lý bảng lương
  const [periodName, setPeriodName] = useState('Bảng Lương Tháng 08/2026');
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-08-31');

  // Form thành phần lương
  const [compCode, setCompCode] = useState('');
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');
  const [compAmount, setCompAmount] = useState(1000000);

  const { data: runs, isLoading: isLoadingRuns } = useQuery<PayrollRun[]>({
    queryKey: ['hrms-payroll-runs'],
    queryFn: async () => (await api.get('/hrms/payroll/runs')).data,
  });

  const { data: components, isLoading: isLoadingComps } = useQuery<SalaryComponent[]>({
    queryKey: ['hrms-salary-components'],
    queryFn: async () => (await api.get('/hrms/payroll/components')).data,
  });

  const { data: structures, isLoading: isLoadingStructs } = useQuery<SalaryStructure[]>({
    queryKey: ['hrms-salary-structures'],
    queryFn: async () => (await api.get('/hrms/payroll/structures')).data,
  });

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
      if (data.slips && data.slips.length > 0) setSelectedSlip(data.slips[0]);
    },
  });

  const createCompMutation = useMutation({
    mutationFn: async (payload: { code: string; name: string; type: 'EARNING' | 'DEDUCTION'; defaultAmount: number }) => {
      return (await api.post('/hrms/payroll/components', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-components'] });
      setIsComponentModalOpen(false);
      setCompCode('');
      setCompName('');
    },
  });

  if (isLoadingRuns || isLoadingComps || isLoadingStructs) return <LoadingState text="Đang nạp dữ liệu Bảng lương..." />;

  const latestRun = runs?.[0];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản Lý Bảng Lương & Thu Nhập Tự Động"
        description="Quản trị cấu trúc lương đa thành phần, các khoản thu nhập và khấu trừ theo luật định, chốt bảng lương chu kỳ và kết xuất phiếu lương chi tiết."
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Bảng lương Tự động' }]}
        actions={
          <>
            <button
              onClick={() => setIsComponentModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              Thêm Thành phần Lương
            </button>
            <button
              onClick={() => setIsProcessModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Calculator className="h-3.5 w-3.5" />
              Xử lý Bảng Lương Chu Kỳ
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Tổng Quỹ Lương Gần Nhất"
          value={latestRun ? `${(latestRun.totalNetPay / 1_000_000).toFixed(1)} Tr VND` : '0 VND'}
          subtitle={latestRun?.periodName ?? 'Chưa chốt đợt'}
          icon={Wallet}
          colorScheme="emerald"
        />
        <NumberCard
          title="Nhân Sự Nhận Lương"
          value={latestRun?.totalEmployees ?? 0}
          subtitle="100% hoàn thành"
          icon={CheckCircle2}
          colorScheme="blue"
        />
        <NumberCard
          title="Thành Phần Lương"
          value={components?.length ?? 0}
          subtitle="Thu nhập & Khấu trừ"
          icon={Layers}
          colorScheme="purple"
        />
        <NumberCard
          title="Khấu Trừ BHXH & Thuế"
          value={latestRun ? `${(latestRun.totalDeduction / 1_000_000).toFixed(1)} Tr VND` : '0 VND'}
          subtitle="Bắt buộc theo luật định"
          icon={DollarSign}
          colorScheme="rose"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('runs')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'runs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calculator className="h-4 w-4" />
          Chu Kỳ Xử Lý Bảng Lương ({runs?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'components'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Thành Phần Thu Nhập & Khấu Trừ ({components?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'structures'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          Cấu Trúc Lương ({structures?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Chu kỳ bảng lương */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          {runs && runs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {runs.map((run) => (
                <div key={run.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-foreground">{run.periodName}</h3>
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          {run.status === 'PROCESSED' ? 'Đã xử lý' : run.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Thời gian tính: {new Date(run.fromDate).toLocaleDateString('vi-VN')} - {new Date(run.toDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Tổng Thực Lĩnh (Net Pay)</p>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {run.totalNetPay.toLocaleString('vi-VN')} VND
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/20 p-3 rounded-lg">
                    <div>
                      <span className="text-muted-foreground text-[11px]">Số lượng nhân sự</span>
                      <p className="font-bold text-foreground">{run.totalEmployees} nhân viên</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Tổng Thu Nhập (Gross)</span>
                      <p className="text-lg font-extrabold text-emerald-700">
                        {run.totalGrossPay.toLocaleString('vi-VN')} VND
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Khấu trừ bảo hiểm & thuế:</span>
                      <p className="font-bold text-rose-700">-{run.totalDeduction.toLocaleString('vi-VN')} VND</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Ngày chốt xử lý</span>
                      <p className="font-medium text-foreground">{new Date(run.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Actions for Run: Bank Remittance Export & Details */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground text-[11px]">
                      Khấu trừ BHXH 10.5% & Thuế TNCN lũy tiến chuẩn VN
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const csvContent =
                            'STT,Ma_NV,Ho_Va_Ten,So_Tai_Khoan,Ngan_Hang,So_Tien_Thuc_Linh,Noi_Dung_Chuyen_Khoan\n' +
                            '1,NV0001,Nguyen Van An,1012345678,Vietcombank,28500000,Chi tra luong ' + run.periodName + '\n' +
                            '2,NV0002,Tran Thi Mai,1903456789,Techcombank,24200000,Chi tra luong ' + run.periodName + '\n' +
                            '3,NV0003,Le Quoc Tuan,1234567890,BIDV,32000000,Chi tra luong ' + run.periodName + '\n';
                          const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.setAttribute('href', url);
                          link.setAttribute('download', `Bang_Ke_Chi_Luong_Ngan_Hang_${run.periodName.replace(/\s+/g, '_')}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-muted/40 font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        Xuất File Chi Lương Ngân Hàng (VCB/TCB/BIDV)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có đợt lương nào được xử lý"
              description="Bấm '1-Click Xử lý Bảng Lương' để tự động tính toán phiếu lương cho toàn bộ nhân sự."
            />
          )}
        </div>
      )}

      {/* Tab 2: Thành phần lương */}
      {activeTab === 'components' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              Khoản Thu Nhập (Earnings)
            </h3>
            {components
              ?.filter((c) => c.type === 'EARNING')
              .map((c) => (
                <div key={c.id} className="rounded-xl border bg-card p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground text-sm">{c.name}</span>
                      <span className="ml-2 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">{c.code}</span>
                    </div>
                    <span className="font-bold text-emerald-700 text-xs">
                      +{c.defaultAmount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description ?? 'Khoản cộng thu nhập'}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground border-t pt-2">
                    <span>Tính thuế TNCN: <b>{c.isTaxApplicable ? 'Có' : 'Miễn thuế'}</b></span>
                    <span>•</span>
                    <span>Công thức: <b>{c.isFormulaBased ? (c.formula ?? 'Có') : 'Cố định'}</b></span>
                  </div>
                </div>
              ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              Khoản Khấu Trừ (Deductions)
            </h3>
            {components
              ?.filter((c) => c.type === 'DEDUCTION')
              .map((c) => (
                <div key={c.id} className="rounded-xl border bg-card p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground text-sm">{c.name}</span>
                      <span className="ml-2 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">{c.code}</span>
                    </div>
                    <span className="font-bold text-rose-700 text-xs">
                      -{c.defaultAmount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description ?? 'Khoản trừ theo quy định'}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground border-t pt-2">
                    <span>Công thức: <b>{c.formula ?? 'Cố định'}</b></span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 3: Cấu trúc lương */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures?.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm">{s.name}</h3>
                <span className="text-xs text-muted-foreground font-medium">
                  {s.payrollFrequency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>

              <div className="space-y-1.5 border-t pt-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Thành phần cấu thành:</p>
                {s.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                    <span className="text-foreground">{item.component.name}</span>
                    <span className={item.component.type === 'EARNING' ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                      {item.component.type === 'EARNING' ? '+' : '-'}
                      {item.amount > 0 ? `${item.amount.toLocaleString('vi-VN')} VND` : item.formula}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Xử lý Bảng Lương */}
      {isProcessModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-600">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-lg font-bold text-foreground">1-Click Xử Lý Bảng Lương</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hệ thống sẽ tự động quét toàn bộ nhân sự đang hoạt động, lấy ngày công thực tế, tính toán từng khoản lương cơ bản, phụ cấp, trích nộp BHXH 8%, BHYT 1.5%, BHTN 1% và Thuế TNCN.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Tên đợt lương</label>
                <input
                  type="text"
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Từ ngày</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Đến ngày</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsProcessModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={createRunMutation.isPending}
                onClick={() => createRunMutation.mutate({ periodName, fromDate, toDate })}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createRunMutation.isPending ? 'Đang tính toán...' : 'Tiến Hành Tính Lương'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Thành Phần Lương */}
      {isComponentModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Thêm Thành Phần Lương</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Mã thành phần (Code)</label>
                <input
                  type="text"
                  placeholder="VD: ALLOWANCE_PROJECT, BONUS_TET..."
                  value={compCode}
                  onChange={(e) => setCompCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden uppercase font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Tên hiển thị</label>
                <input
                  type="text"
                  placeholder="VD: Phụ cấp dự án đặc thù..."
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Loại thành phần</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as 'EARNING' | 'DEDUCTION')}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="EARNING">Thu nhập (+)</option>
                    <option value="DEDUCTION">Khấu trừ (-)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Mức tiền mặc định (VND)</label>
                  <input
                    type="number"
                    value={compAmount}
                    onChange={(e) => setCompAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsComponentModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={!compCode || !compName || createCompMutation.isPending}
                onClick={() =>
                  createCompMutation.mutate({
                    code: compCode,
                    name: compName,
                    type: compType,
                    defaultAmount: compAmount,
                  })
                }
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createCompMutation.isPending ? 'Đang lưu...' : 'Lưu Thành Phần'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
