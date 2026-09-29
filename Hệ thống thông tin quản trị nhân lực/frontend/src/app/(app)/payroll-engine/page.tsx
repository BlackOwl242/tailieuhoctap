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
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { EmptyState, LoadingState } from '@/components/common/states';
import { Button, Select } from '@/components/ui/primitives';
import { DataTable, DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';
import { printDocumentElement } from '@/components/ui/print';

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
  userId?: string;
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const searchParams = useSearchParams();

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
  const [assignBaseSalary, setAssignBaseSalary] = useState(15000000);

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

  const { data: employees = [] } = useQuery<{ id: string; fullName: string; employeeCode: string; orgUnit?: { name: string } }[]>({
    queryKey: ['employees-for-payroll'],
    queryFn: async () => (await api.get('/employees')).data,
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

  const assignStructureMutation = useMutation({
    mutationFn: async (payload: { structureId: string; userId: string; baseSalary: number }) => {
      return (await api.post(`/hrms/payroll/structures/${payload.structureId}/assign`, {
        userId: payload.userId,
        baseSalary: payload.baseSalary,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-salary-structures'] });
      setIsAssignModalOpen(false);
      toast('Đã gán cấu trúc lương cho nhân sự', 'success');
    },
    onError: () => toast('Lỗi khi gán cấu trúc lương', 'error'),
  });

  const resetComponentForm = () => {
    setCompCode('');
    setCompName('');
    setCompType('EARNING');
    setCompAmount(1000000);
    setCompDesc('');
    setCompTax(true);
  };

  const openEditComponentModal = (c: SalaryComponent) => {
    setEditingComponent(c);
    setCompCode(c.code);
    setCompName(c.name);
    setCompType(c.type);
    setCompAmount(c.defaultAmount);
    setCompDesc(c.description || '');
    setCompTax(c.isTaxApplicable);
  };

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
      render: () => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Đã duyệt
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
    const csvContent =
      'STT,Ma_NV,Ho_Va_Ten,So_Tai_Khoan,Ngan_Hang,So_Tien_Thuc_Linh,Noi_Dung_Chuyen_Khoan\n' +
      (run.slips || []).map((s, idx) =>
        `${idx + 1},${s.employeeCode || 'NV'},${s.employeeName},1012345678,Vietcombank,${s.netPay},Chi tra luong ${run.periodName}`
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
            <Button
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
            </Button>
            <Button
              size="sm"
              onClick={() => setIsProcessModalOpen(true)}
              className="text-xs h-8"
            >
              <Calculator className="h-3.5 w-3.5 mr-1" />
              Tính bảng lương
            </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportBankCsv(currentRun)}
                      className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Xuất CSV ngân hàng
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa đợt lương "${currentRun.periodName}"?`)) {
                          deleteRunMutation.mutate(currentRun.id);
                        }
                      }}
                      className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      Xóa đợt này
                    </Button>
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
                  <div key={c.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.isTaxApplicable ? 'Tính thuế TNCN' : 'Miễn thuế'} · {c.description || 'Cố định'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-foreground">
                        +{c.defaultAmount.toLocaleString('vi-VN')} đ
                      </span>
                      <div className="flex items-center gap-1">
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
                      </div>
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
                  <div key={c.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.description || 'Khấu trừ theo quy định'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        -{c.defaultAmount.toLocaleString('vi-VN')} đ
                      </span>
                      <div className="flex items-center gap-1">
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
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CẤU TRÚC LƯƠNG ================= */}
      {activeTab === 'structures' && (
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

              <div className="border-t border-border pt-2 flex justify-end">
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
              </div>
            </div>
          ))}
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
              });
            }
          }}
          disabled={createCompMutation.isPending || updateCompMutation.isPending}
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
            <label className="text-muted-foreground">Chọn nhân viên *</label>
            <Select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="mt-1 w-full text-xs"
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-muted-foreground">Lương cơ bản gán (VND) *</label>
            <input
              type="number"
              step={500000}
              value={assignBaseSalary}
              onChange={(e) => setAssignBaseSalary(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-foreground focus:outline-hidden"
            />
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => setIsAssignModalOpen(false)}
          confirmLabel="Gán cấu trúc"
          onConfirm={() => {
            if (!assignUserId) {
              toast('Vui lòng chọn nhân viên', 'error');
              return;
            }
            assignStructureMutation.mutate({
              structureId: selectedStructureId,
              userId: assignUserId,
              baseSalary: assignBaseSalary,
            });
          }}
          disabled={assignStructureMutation.isPending}
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

                {(() => {
                  const base = selectedSlip.baseSalary;
                  const stdDays = selectedSlip.workingDays || 22;
                  const actDays = selectedSlip.actualWorkDays || 22;
                  const unpaid = Math.max(0, stdDays - actDays);
                  const dayRate = Math.round(base / stdDays);
                  const unpaidDeduct = Math.round(dayRate * unpaid);
                  const lunch = Math.round(35000 * actDays);
                  const responsibility = 1500000;
                  const gross = base + lunch + responsibility;
                  const ins = Math.round(base * 0.105);
                  const relief = 11000000;
                  const taxable = Math.max(0, gross - unpaidDeduct - ins - relief);
                  const pit = Math.round(taxable * 0.05);

                  return (
                    <div className="space-y-2.5 font-mono text-xs">
                      {/* Bước 1 */}
                      <div className="p-2.5 rounded bg-card border border-border/80 space-y-1">
                        <span className="font-sans font-bold text-foreground block text-xs">
                          Bước 1: Tính Đơn Giá Ngày Công & Trừ Lương Công Vắng
                        </span>
                        <div className="text-muted-foreground">
                          • Ngày công chuẩn: <b className="text-foreground">{stdDays} ngày</b> | Ngày công thực tế: <b className="text-foreground">{actDays} ngày</b>
                        </div>
                        <div className="text-muted-foreground">
                          • Số ngày nghỉ/vắng: <b className={unpaid > 0 ? 'text-rose-600 font-bold' : 'text-foreground'}>{unpaid} ngày</b>
                        </div>
                        <div className="text-muted-foreground">
                          • Đơn giá 1 ngày công = {base.toLocaleString('vi-VN')} đ / {stdDays} = <b className="text-foreground">{dayRate.toLocaleString('vi-VN')} đ/ngày</b>
                        </div>
                        <div className="text-foreground font-semibold">
                          ➔ Khấu trừ tiền lương = {dayRate.toLocaleString('vi-VN')} × {unpaid} ngày = <span className="text-rose-600">-{unpaidDeduct.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>

                      {/* Bước 2 */}
                      <div className="p-2.5 rounded bg-card border border-border/80 space-y-1">
                        <span className="font-sans font-bold text-foreground block text-xs">
                          Bước 2: Tính Các Khoản Phụ Cấp & Tổng Thu Nhập Trước Khấu Trừ
                        </span>
                        <div className="text-muted-foreground">
                          • Lương cơ bản theo hợp đồng: <b className="text-foreground">{base.toLocaleString('vi-VN')} đ</b>
                        </div>
                        <div className="text-muted-foreground">
                          • Phụ cấp ăn trưa theo công thực tế: 35.000 đ × {actDays} ngày = <b className="text-foreground">{lunch.toLocaleString('vi-VN')} đ</b>
                        </div>
                        <div className="text-muted-foreground">
                          • Phụ cấp trách nhiệm / nghiệp vụ: <b className="text-foreground">{responsibility.toLocaleString('vi-VN')} đ</b>
                        </div>
                        <div className="text-foreground font-semibold">
                          ➔ Tổng thu nhập trước khấu trừ = {base.toLocaleString('vi-VN')} + {lunch.toLocaleString('vi-VN')} + {responsibility.toLocaleString('vi-VN')} = <span className="text-primary">{gross.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>

                      {/* Bước 3 */}
                      <div className="p-2.5 rounded bg-card border border-border/80 space-y-1">
                        <span className="font-sans font-bold text-foreground block text-xs">
                          Bước 3: Trích Nộp Bảo Hiểm Bắt Buộc (10.5% Người Lao Động Đóng)
                        </span>
                        <div className="text-muted-foreground">
                          • Bảo hiểm Xã hội (8%): {base.toLocaleString('vi-VN')} × 8% = <b className="text-foreground">-{Math.round(base * 0.08).toLocaleString('vi-VN')} đ</b>
                        </div>
                        <div className="text-muted-foreground">
                          • Bảo hiểm Y tế (1.5%): {base.toLocaleString('vi-VN')} × 1.5% = <b className="text-foreground">-{Math.round(base * 0.015).toLocaleString('vi-VN')} đ</b>
                        </div>
                        <div className="text-muted-foreground">
                          • Bảo hiểm Thất nghiệp (1%): {base.toLocaleString('vi-VN')} × 1% = <b className="text-foreground">-{Math.round(base * 0.01).toLocaleString('vi-VN')} đ</b>
                        </div>
                        <div className="text-foreground font-semibold">
                          ➔ Tổng bảo hiểm người lao động trích nộp = <span className="text-rose-600">-{ins.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>

                      {/* Bước 4 */}
                      <div className="p-2.5 rounded bg-card border border-border/80 space-y-1">
                        <span className="font-sans font-bold text-foreground block text-xs">
                          Bước 4: Thu Nhập Tính Thuế & Thuế Thu Nhập Cá Nhân (TNCN)
                        </span>
                        <div className="text-muted-foreground">
                          • Giảm trừ gia cảnh bản thân: <b className="text-foreground">-11.000.000 đ/tháng</b>
                        </div>
                        <div className="text-muted-foreground">
                          • Thu nhập tính thuế = {gross.toLocaleString('vi-VN')} - {unpaidDeduct.toLocaleString('vi-VN')} (vắng) - {ins.toLocaleString('vi-VN')} (BH) - 11.000.000 = <b className="text-foreground">{taxable.toLocaleString('vi-VN')} đ</b>
                        </div>
                        <div className="text-foreground font-semibold">
                          ➔ Thuế TNCN (Bậc 1 thuế suất 5%) = {taxable > 0 ? `${taxable.toLocaleString('vi-VN')} × 5% = -${pit.toLocaleString('vi-VN')} đ` : '0 đ (Chưa đến ngưỡng chịu thuế)'}
                        </div>
                      </div>

                      {/* Bước 5 */}
                      <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-sans">
                        <div>
                          <span className="font-bold text-foreground text-sm block">Bước 5: Tiền Lương Thực Lĩnh</span>
                          <span className="text-2xs text-muted-foreground">Thực lĩnh = Tổng thu nhập ({gross.toLocaleString('vi-VN')} đ) - Tổng các khoản khấu trừ ({selectedSlip.totalDeduction.toLocaleString('vi-VN')} đ)</span>
                        </div>
                        <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          {selectedSlip.netPay.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* TAB: PHIẾU LƯƠNG CHUẨN IN ẤN (PRINTABLE DOC) */
              <div id="print-payslip-doc" className="print-area space-y-4 text-xs font-sans print:font-serif print:text-black print:p-0 print:border-0 print:m-0">
                {/* Header Tiêu Đề Doanh Nghiệp */}
                <div className="border-b-2 border-border pb-3 flex justify-between items-start">
                  <div>
                    <p className="font-bold text-foreground text-xs uppercase tracking-wider">CÔNG TY CỔ PHẦN CÔNG NGHỆ HRMIS PRO</p>
                    <p className="font-bold text-foreground text-base uppercase mt-1">PHIẾU LƯƠNG NHÂN VIÊN</p>
                    <p className="text-muted-foreground mt-0.5">{currentRun?.periodName || 'Kỳ lương hiện hành'}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p>Mã phiếu: <span className="font-mono text-foreground font-bold">{selectedSlip.id.slice(0, 8).toUpperCase()}</span></p>
                    <p className="text-2xs mt-1">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                {/* Thông tin nhân viên */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs py-2 bg-muted/20 px-3 rounded-md border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-2xs">Họ và tên:</span>
                    <p className="font-bold text-foreground">{selectedSlip.employeeName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">Mã nhân viên:</span>
                    <p className="font-mono font-medium text-foreground">{selectedSlip.employeeCode || 'NV'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">Phòng ban / Đơn vị:</span>
                    <p className="text-foreground">{selectedSlip.department || 'Văn phòng Trung tâm'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">Chức danh công việc:</span>
                    <p className="text-foreground">{selectedSlip.jobTitle || 'Chuyên viên'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">Ngày công chu kỳ:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedSlip.actualWorkDays ?? 22}/{selectedSlip.workingDays ?? 22} công
                      {(selectedSlip.workingDays ?? 22) - (selectedSlip.actualWorkDays ?? 22) > 0 && (
                        <span className="text-rose-600 font-semibold ml-1">
                          (-{(selectedSlip.workingDays ?? 22) - (selectedSlip.actualWorkDays ?? 22)}d)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Bảng Chi Tiết Thu Nhập & Khấu Trừ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-border pt-3">
                  {/* Cột Thu Nhập */}
                  <div className="space-y-2">
                    <p className="font-bold text-foreground uppercase text-xs pb-1 border-b border-border flex items-center justify-between">
                      <span>I. Các khoản thu nhập</span>
                      <span className="text-2xs font-normal text-muted-foreground">VND</span>
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lương cơ bản theo HĐLĐ:</span>
                        <span className="font-mono font-medium">{selectedSlip.baseSalary.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phụ cấp ăn trưa ({selectedSlip.actualWorkDays ?? 22} ngày):</span>
                        <span className="font-mono font-medium">
                          {(Math.round(35000 * (selectedSlip.actualWorkDays ?? 22))).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phụ cấp trách nhiệm / nghiệp vụ:</span>
                        <span className="font-mono font-medium">1.500.000 đ</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border font-bold text-foreground">
                        <span>TỔNG THU NHẬP TRƯỚC GIẢM TRỪ:</span>
                        <span className="font-mono text-primary font-bold">{selectedSlip.grossPay.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột Khấu Trừ */}
                  <div className="space-y-2">
                    <p className="font-bold text-foreground uppercase text-xs pb-1 border-b border-border flex items-center justify-between">
                      <span>II. Các khoản khấu trừ</span>
                      <span className="text-2xs font-normal text-muted-foreground">VND</span>
                    </p>
                    <div className="space-y-1.5">
                      {selectedSlip.breakdown?.deductions && selectedSlip.breakdown.deductions.length > 0 ? (
                        selectedSlip.breakdown.deductions.map((d, idx) => {
                          const isUnpaid = d.name.includes('Trừ công') || d.name.includes('nghỉ') || d.name.includes('vắng');
                          return (
                            <div key={idx} className="flex justify-between">
                              <span className={isUnpaid ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-muted-foreground'}>
                                {d.name}:
                              </span>
                              <span className={`font-mono ${isUnpaid ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                                -{d.amount.toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BHXH (8%):</span>
                            <span className="font-mono">-{Math.round(selectedSlip.baseSalary * 0.08).toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BHYT (1.5%):</span>
                            <span className="font-mono">-{Math.round(selectedSlip.baseSalary * 0.015).toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BHTN (1%):</span>
                            <span className="font-mono">-{Math.round(selectedSlip.baseSalary * 0.01).toLocaleString('vi-VN')} đ</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-1 border-t border-border font-bold text-foreground">
                        <span>TỔNG CÁC KHOẢN KHẤU TRỪ:</span>
                        <span className="font-mono text-rose-600 font-bold">-{selectedSlip.totalDeduction.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thực Lĩnh Cuối Cùng */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-primary/10 border-2 border-primary/20">
                  <div>
                    <span className="font-bold text-foreground text-sm block">SỐ TIỀN THỰC LĨNH:</span>
                    <span className="text-2xs text-muted-foreground">Đã bao gồm tất cả phụ cấp và trích nộp bảo hiểm, thuế theo quy định</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-primary">
                    {selectedSlip.netPay.toLocaleString('vi-VN')} VND
                  </span>
                </div>

                {/* Khối Ký Tên Chuẩn Kế Toán (Printable) */}
                <div className="pt-6 border-t border-border mt-4 grid grid-cols-3 text-center text-xs">
                  <div>
                    <p className="font-bold text-foreground">NGƯỜI LẬP BIỂU</p>
                    <p className="text-2xs text-muted-foreground italic">(Ký, ghi rõ họ tên)</p>
                    <div className="h-14" />
                    <p className="font-medium text-foreground">Bộ phận Tiền lương</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">KẾ TOÁN TRƯỞNG</p>
                    <p className="text-2xs text-muted-foreground italic">(Ký, ghi rõ họ tên)</p>
                    <div className="h-14" />
                    <p className="font-medium text-foreground">Phòng Kế toán Tài chính</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">GIÁM ĐỐC ĐƠN VỊ</p>
                    <p className="text-2xs text-muted-foreground italic">(Ký, đóng dấu)</p>
                    <div className="h-14" />
                    <p className="font-medium text-foreground">Ban Giám đốc</p>
                  </div>
                </div>
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
