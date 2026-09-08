'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, Check, Lock, Plus, Wallet } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { PAYROLL_STATUS_LABEL, vnd } from '@/lib/hr';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from '@/components/ui/primitives';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface PeriodRow {
  id: string; month: number; year: number;
  status: keyof typeof PAYROLL_STATUS_LABEL;
  calculatedAt: string | null; lockedAt: string | null;
  _count?: { payslips: number };
}
interface PayslipRow {
  id: string; periodId: string;
  workingDays: number; otHours: number;
  baseSalary: number; otAmount: number; insurance: number; incomeTax: number; netSalary: number;
  user?: { fullName: string; employeeCode: string | null; orgUnit?: { name: string } | null };
  period?: { month: number; year: number; status: string };
}

const STATUS_TONE: Record<string, string> = {
  OPEN: 'bg-slate-100 text-slate-700 border-slate-200 border',
  CALCULATED: 'bg-blue-50 text-blue-700 border-blue-200 border',
  REVIEWED: 'bg-amber-50 text-amber-800 border-amber-200 border',
  LOCKED: 'bg-emerald-50 text-emerald-700 border-emerald-200 border',
};

/** UC22–UC25 — Kỳ lương: Khóa công → Tính → Đối chiếu → Duyệt/Khóa → Phiếu lương. */
export default function PayrollPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  const isAdmin = roles.includes('ADMIN');
  const [tab, setTab] = useState<'mine' | 'periods'>('mine');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const periodsQ = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: async () => (await api.get<PeriodRow[]>('/payroll/periods')).data,
  });
  const myQ = useQuery({
    queryKey: ['payslips-mine'],
    queryFn: async () => (await api.get<PayslipRow[]>('/payroll/payslips/mine')).data,
  });
  const periodSlipsQ = useQuery({
    queryKey: ['payslips-period', selectedPeriod],
    queryFn: async () => (await api.get<PayslipRow[]>(`/payroll/periods/${selectedPeriod}/payslips`)).data,
    enabled: !!selectedPeriod,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payroll-periods'] });
    qc.invalidateQueries({ queryKey: ['payslips-period'] });
    qc.invalidateQueries({ queryKey: ['payslips-mine'] });
  };

  const createPeriod = useMutation({
    mutationFn: async () => api.post('/payroll/periods', { month: Number(form.month), year: Number(form.year) }),
    onSuccess: () => { toast('Đã tạo kỳ lương', 'success'); setCreateOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const act = useMutation({
    mutationFn: async (vars: { id: string; action: 'calculate' | 'review' | 'lock' }) =>
      api.post(`/payroll/periods/${vars.id}/${vars.action}`, {}),
    onSuccess: (_, v) => {
      toast(v.action === 'calculate' ? 'Đã tính bảng lương' : v.action === 'review' ? 'Đã đối chiếu — chờ duyệt' : 'Đã khóa kỳ lương (bất biến)', 'success');
      invalidate();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const periodColumns: DataColumn<PeriodRow>[] = [
    { key: 'label', header: 'Kỳ lương', sortable: true, sortValue: (r) => r.year * 100 + r.month, render: (r) => <span className="font-medium">{String(r.month).padStart(2, '0')}/{r.year}</span> },
    { key: 'status', header: 'Trạng thái', sortable: true, render: (r) => (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            r.status === 'LOCKED'
              ? 'bg-emerald-600'
              : r.status === 'REVIEWED'
              ? 'bg-blue-600'
              : 'bg-amber-600'
          }`}
        />
        {PAYROLL_STATUS_LABEL[r.status] ?? r.status}
      </span>
    ) },
    { key: 'count', header: 'Số phiếu', render: (r) => r._count?.payslips ?? 0 },
    {
      key: 'actions2', header: 'Quy trình', noPrint: true,
      render: (r) => (
        <span className="flex flex-wrap gap-1">
          {isHr && (r.status === 'OPEN' || r.status === 'CALCULATED') ? (
            <Button size="sm" variant="outline" onClick={() => act.mutate({ id: r.id, action: 'calculate' })}><Calculator className="h-3.5 w-3.5" /> Tính lương</Button>
          ) : null}
          {isHr && r.status === 'CALCULATED' ? (
            <Button size="sm" variant="outline" onClick={() => act.mutate({ id: r.id, action: 'review' })}><Check className="h-3.5 w-3.5" /> Đối chiếu</Button>
          ) : null}
          {isAdmin && r.status === 'REVIEWED' ? (
            <Button size="sm" variant="success" onClick={() => act.mutate({ id: r.id, action: 'lock' })}><Lock className="h-3.5 w-3.5" /> Duyệt & khóa</Button>
          ) : null}
        </span>
      ),
    },
  ];

  const slipColumns: DataColumn<PayslipRow>[] = [
    ...(tab === 'periods' && selectedPeriod ? [{
      key: 'user', header: 'Nhân viên', sortable: true,
      render: (r: PayslipRow) => (
        <span>
          <span className="block font-medium">{r.user?.fullName ?? '—'}</span>
          <span className="block text-xs text-muted-foreground">{r.user?.employeeCode ?? ''}</span>
        </span>
      ),
    } as DataColumn<PayslipRow>] : []),
    { key: 'period', header: 'Kỳ', sortable: true, sortValue: (r) => (r.period ? r.period.year * 100 + r.period.month : 0), render: (r) => (r.period ? `${String(r.period.month).padStart(2, '0')}/${r.period.year}` : '—') },
    { key: 'workingDays', header: 'Công', sortable: true },
    { key: 'baseSalary', header: 'Lương CB', sortable: true, render: (r) => vnd(r.baseSalary) },
    { key: 'otAmount', header: 'Tiền OT', render: (r) => vnd(r.otAmount) },
    { key: 'insurance', header: 'BHXH (10,5%)', render: (r) => vnd(r.insurance) },
    { key: 'incomeTax', header: 'Thuế TNCN', render: (r) => vnd(r.incomeTax) },
    { key: 'netSalary', header: 'Thực lĩnh', sortable: true, render: (r) => <span className="font-semibold text-primary">{vnd(r.netSalary)}</span> },
  ];

  const selectedPeriodRow = periodsQ.data?.find((p) => p.id === selectedPeriod);

  return (
    <>
      <PageHeader
        title="Lương"
        description="Chu trình kỳ lương: Khóa công → Tính → Đối chiếu → Duyệt & khóa bất biến → Phiếu lương điện tử."
        actions={
          isHr ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Tạo kỳ lương
            </Button>
          ) : null
        }
      />

      <div className="no-print mb-3 flex gap-2">
        <Button size="sm" variant={tab === 'mine' ? 'default' : 'outline'} onClick={() => setTab('mine')}>
          Phiếu lương của tôi
        </Button>
        {isHr ? (
          <Button size="sm" variant={tab === 'periods' ? 'default' : 'outline'} onClick={() => setTab('periods')}>
            Kỳ lương & bảng lương
          </Button>
        ) : null}
      </div>

      {tab === 'periods' ? (
        <div className="space-y-stack">
          <DataTable
            columns={periodColumns}
            rows={periodsQ.data ?? []}
            rowKey={(r) => r.id}
            loading={periodsQ.isLoading}
            exportFilename="danh-sach-ky-luong"
            printLabel="In danh sách kỳ lương"
            searchFields={(r) => [`${r.month}/${r.year}`]}
            emptyTitle="Chưa có kỳ lương nào"
            emptyHint="Tạo kỳ lương cho tháng cần chi trả."
          />
          {selectedPeriod ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Bảng lương {selectedPeriodRow ? `${String(selectedPeriodRow.month).padStart(2, '0')}/${selectedPeriodRow.year}` : ''}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedPeriod(null)}>
                    Đóng
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {periodSlipsQ.isLoading ? (
                  <Skeleton className="h-40" />
                ) : periodSlipsQ.isError ? (
                  <ErrorState message={errorMessage(periodSlipsQ.error)} onRetry={() => periodSlipsQ.refetch()} />
                ) : (
                  <div className="print-area">
                    <PrintFrame
                      title="BẢNG LƯƠNG THÁNG"
                      subtitle={
                        selectedPeriodRow
                          ? `Kỳ ${String(selectedPeriodRow.month).padStart(2, '0')}/${selectedPeriodRow.year} — ${PAYROLL_STATUS_LABEL[selectedPeriodRow.status] ?? ''}`
                          : ''
                      }
                    />
                    <DataTable
                      columns={slipColumns}
                      rows={periodSlipsQ.data ?? []}
                      rowKey={(r) => r.id}
                      exportFilename={`bang-luong-ky-${selectedPeriodRow?.month ?? ''}-${selectedPeriodRow?.year ?? ''}`}
                      printLabel="In bảng lương"
                      searchFields={(r) => [r.user?.fullName ?? '', r.user?.employeeCode ?? '']}
                      emptyTitle="Chưa tính lương cho kỳ này"
                    />
                    <PrintSignatureBlock leftTitle="Người lập biểu" middleTitle="Kế toán trưởng" rightTitle="Giám đốc duyệt chi" />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="print-area">
          <PrintFrame title="PHIẾU LƯƠNG CÁ NHÂN" />
          {myQ.isError ? (
            <ErrorState message={errorMessage(myQ.error)} onRetry={() => myQ.refetch()} />
          ) : (
            <DataTable
              columns={slipColumns}
              rows={myQ.data ?? []}
              rowKey={(r) => r.id}
              loading={myQ.isLoading}
              exportFilename="phieu-luong-cua-toi"
              printLabel="In phiếu lương"
              searchFields={(r) => [r.period ? `${r.period.month}/${r.period.year}` : '']}
              emptyTitle="Chưa có phiếu lương"
              emptyHint="Phiếu lương sẽ xuất hiện sau khi bộ phận tiền lương tính kỳ đầu tiên."
            />
          )}
          <PrintSignatureBlock leftTitle="Người nhận lương" middleTitle="Kế toán tiền lương" rightTitle="Trưởng phòng HC-NS" />
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Tạo kỳ lương" description="Kỳ lương theo tháng dương lịch. Sau khi khóa, bảng lương trở nên bất biến.">
        <form onSubmit={(e) => { e.preventDefault(); createPeriod.mutate(); }} className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Tháng *</Label>
            <Input required type="number" min={1} max={12} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Năm *</Label>
            <Input required type="number" min={2000} max={2100} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setCreateOpen(false)} pending={createPeriod.isPending} confirmLabel="Tạo kỳ" />
          </div>
        </form>
      </Modal>
    </>
  );
}
