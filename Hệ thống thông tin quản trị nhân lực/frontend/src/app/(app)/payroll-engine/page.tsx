'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calculator, Plus, Trash2, Edit3, Eye, Printer, FileText, Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { EmptyState, LoadingState } from '@/components/common/states';
import { Button, Select } from '@/components/ui/primitives';
import { DataTable, DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';

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
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'runs' | 'components' | 'structures'>('runs');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

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
          <p className="text-[11px] text-muted-foreground">{s.jobTitle || 'Chuyên viên'}</p>
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
      header: 'Tổng Gross',
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
        title="Quản Lý Bảng Lương"
        description="Tính toán bảng lương chu kỳ, khấu trừ bảo hiểm thuế và lập phiếu lương nhân sự."
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Bảng lương' }]}
        actions={
          <div className="flex gap-2">
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

      {/* Navigation Tabs (Minimalist border) */}
      <div className="flex border-b border-border text-sm">
        <button
          onClick={() => setActiveTab('runs')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'runs'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Bảng lương ({runs.length})
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'components'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Thành phần thu nhập & khấu trừ ({components.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'structures'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
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
                        <span className="font-mono text-[10px] text-muted-foreground">{c.code}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
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
                        <span className="font-mono text-[10px] text-muted-foreground">{c.code}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.description || 'Cấu trúc tiêu chuẩn'}</p>
                </div>
                <span className="text-muted-foreground text-[11px]">{s._count?.assignments ?? 0} nhân sự</span>
              </div>

              <div className="border-t border-border pt-2 space-y-1 text-[11px] text-muted-foreground">
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
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode || 'NV'})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-muted-foreground">Lương cơ bản (VND) *</label>
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
          confirmLabel="Lưu"
          onConfirm={() => {
            if (!assignUserId || !selectedStructureId) {
              toast('Vui lòng chọn nhân sự', 'error');
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

      {/* ================= MODAL: PHIẾU LƯƠNG ĐƠN GIẢN, CHUẨN KẾ TOÁN ================= */}
      <Modal
        open={isPayslipModalOpen}
        onOpenChange={(open) => setIsPayslipModalOpen(open)}
        title="Phiếu Lương Nhân Viên"
        size="lg"
      >
        {selectedSlip && (
          <div className="space-y-4 text-xs font-sans">
            {/* Header thông tin */}
            <div className="border-b border-border pb-3 flex justify-between items-start">
              <div>
                <p className="font-semibold text-foreground text-sm uppercase">PHIẾU LƯƠNG NHÂN SỰ</p>
                <p className="text-muted-foreground mt-0.5">{currentRun?.periodName || 'Kỳ lương hiện hành'}</p>
              </div>
              <div className="text-right text-muted-foreground">
                <p>Mã phiếu: <span className="font-mono text-foreground">{selectedSlip.id.slice(0, 8).toUpperCase()}</span></p>
              </div>
            </div>

            {/* Thông tin nhân viên */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
              <div>
                <span className="text-muted-foreground">Họ tên:</span>
                <p className="font-medium text-foreground">{selectedSlip.employeeName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Mã NV:</span>
                <p className="font-mono text-foreground">{selectedSlip.employeeCode || 'NV'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phòng ban:</span>
                <p className="text-foreground">{selectedSlip.department || 'Ban Tổ chức'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Chức danh:</span>
                <p className="text-foreground">{selectedSlip.jobTitle || 'Chuyên viên'}</p>
              </div>
            </div>

            {/* Bảng Chi Tiết Thu Nhập & Khấu Trừ (Đơn giản, 1px border) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-border pt-3">
              {/* Cột Thu Nhập */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground uppercase text-[11px] pb-1 border-b border-border">
                  I. Các khoản thu nhập
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lương cơ bản:</span>
                    <span className="font-mono">{selectedSlip.baseSalary.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phụ cấp ăn trưa:</span>
                    <span className="font-mono">730.000 đ</span>
                  </div>
                  {selectedSlip.grossPay - selectedSlip.baseSalary - 730000 > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phụ cấp khác:</span>
                      <span className="font-mono">
                        {(selectedSlip.grossPay - selectedSlip.baseSalary - 730000).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-border font-medium">
                    <span>Tổng Gross:</span>
                    <span className="font-mono">{selectedSlip.grossPay.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>

              {/* Cột Khấu Trừ */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground uppercase text-[11px] pb-1 border-b border-border">
                  II. Khoản khấu trừ
                </p>
                <div className="space-y-1.5">
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thuế TNCN:</span>
                    <span className="font-mono">
                      -{Math.max(0, selectedSlip.totalDeduction - Math.round(selectedSlip.baseSalary * 0.105)).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border font-medium">
                    <span>Tổng khấu trừ:</span>
                    <span className="font-mono">-{selectedSlip.totalDeduction.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thực Lĩnh (Clean, non-neon) */}
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border">
              <span className="font-medium text-foreground">Tổng thực lĩnh (Net Pay):</span>
              <span className="text-base font-semibold font-mono text-foreground">
                {selectedSlip.netPay.toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>
        )}

        <ModalFooterActions
          onCancel={() => setIsPayslipModalOpen(false)}
          cancelLabel="Đóng"
          confirmLabel="In phiếu lương"
          onConfirm={() => window.print()}
        />
      </Modal>
    </div>
  );
}
