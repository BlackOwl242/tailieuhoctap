'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarDays, Check, Eye, Plus, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { LEAVE_TYPE_LABEL, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE } from '@/lib/hr';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Skeleton, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface LeaveRow {
  id: string; type: keyof typeof LEAVE_TYPE_LABEL;
  startDate: string; endDate: string; days: number; reason: string;
  status: keyof typeof REQUEST_STATUS_LABEL;
  decisionNote: string | null;
  user?: { fullName: string; employeeCode: string | null; orgUnit?: { name: string } | null };
  approver?: { fullName: string } | null;
}
interface Balance { year: number; entitled: number; used: number; pendingDays: number; remaining: number }

/** UC20 — Đăng ký nghỉ phép: kiểm quỹ trước khi trình, trừ quỹ ngay khi duyệt. */
export default function LeavePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<LeaveRow | null>(null);
  const [form, setForm] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });

  const balanceQ = useQuery({
    queryKey: ['leave-balance'],
    queryFn: async () => (await api.get<Balance>('/leave/balance')).data,
  });
  const mineQ = useQuery({
    queryKey: ['leave-mine'],
    queryFn: async () => (await api.get<LeaveRow[]>('/leave/mine')).data,
  });
  const allQ = useQuery({
    queryKey: ['leave-all'],
    queryFn: async () => (await api.get<LeaveRow[]>('/leave')).data,
    enabled: isHr && tab === 'all',
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['leave-mine'] });
    qc.invalidateQueries({ queryKey: ['leave-all'] });
    qc.invalidateQueries({ queryKey: ['leave-balance'] });
  };

  const create = useMutation({
    mutationFn: async () => api.post('/leave', form),
    onSuccess: () => { toast('Đã gửi đơn nghỉ phép — chờ duyệt', 'success'); setCreateOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const decide = useMutation({
    mutationFn: async (vars: { id: string; approve: boolean }) =>
      api.post(`/leave/${vars.id}/${vars.approve ? 'approve' : 'reject'}`, {}),
    onSuccess: (_, v) => { toast(v.approve ? 'Đã duyệt — quỹ phép đã trừ' : 'Đã từ chối đơn', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const cancel = useMutation({
    mutationFn: async (id: string) => api.post(`/leave/${id}/cancel`),
    onSuccess: () => { toast('Đã hủy đơn', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<LeaveRow>[] = [
    ...(tab === 'all' ? [{
      key: 'user', header: 'Nhân viên', sortable: true,
      render: (r: LeaveRow) => (
        <span>
          <span className="block font-medium">{r.user?.fullName ?? '—'}</span>
          <span className="block text-xs text-muted-foreground">{r.user?.employeeCode ?? ''} {r.user?.orgUnit ? `· ${r.user.orgUnit.name}` : ''}</span>
        </span>
      ),
      exportValue: (r: LeaveRow) => r.user?.fullName ?? '',
    } as DataColumn<LeaveRow>] : []),
    { key: 'type', header: 'Loại phép', sortable: true, render: (r) => LEAVE_TYPE_LABEL[r.type] ?? r.type, exportValue: (r) => LEAVE_TYPE_LABEL[r.type] ?? r.type },
    {
      key: 'startDate', header: 'Thời gian', sortable: true,
      render: (r) => `${formatDate(r.startDate)} → ${formatDate(r.endDate)}`,
      exportValue: (r) => `${formatDate(r.startDate)} → ${formatDate(r.endDate)}`,
    },
    { key: 'days', header: 'Số ngày', sortable: true },
    { key: 'reason', header: 'Lý do', render: (r) => <span className="line-clamp-2 max-w-[16rem]">{r.reason}</span> },
    {
      key: 'status', header: 'Trạng thái', sortable: true,
      render: (r) => <Badge className={REQUEST_STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status] ?? r.status}</Badge>,
      exportValue: (r) => REQUEST_STATUS_LABEL[r.status] ?? r.status,
    },
  ];

  const rows = tab === 'all' ? (allQ.data ?? []) : (mineQ.data ?? []);

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản trị Nghỉ phép"
        description="Quỹ phép minh bạch — phê duyệt là tự động trừ quỹ ngày và ghi nhận công phép vào bảng chấm công."
        breadcrumbs={[{ label: 'Ca kíp & Chấm công' }, { label: 'Nghỉ phép' }]}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 shadow-2xs">
            <Plus className="h-3.5 w-3.5" /> Tạo đơn nghỉ phép
          </Button>
        }
      />

      {/* Thẻ quỹ phép (topcard thống kê) */}
      <div className="mb-stack grid grid-cols-2 gap-3 sm:grid-cols-4">
        {balanceQ.isLoading ? (
          <><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></>
        ) : balanceQ.isError || !balanceQ.data ? (
          <div className="col-span-full"><ErrorState message={errorMessage(balanceQ.error)} onRetry={() => balanceQ.refetch()} /></div>
        ) : (
          <>
            <StatTile label="Phép năm được hưởng" value={`${balanceQ.data.entitled} ngày`} />
            <StatTile label="Đã sử dụng" value={`${balanceQ.data.used} ngày`} />
            <StatTile label="Đang chờ duyệt" value={`${balanceQ.data.pendingDays} ngày`} />
            <StatTile label="Còn lại" value={`${balanceQ.data.remaining} ngày`} highlight />
          </>
        )}
      </div>

      <div className="print-area">
        <PrintFrame title="DANH SÁCH ĐƠN NGHỈ PHÉP" subtitle={tab === 'all' ? 'Toàn công ty' : 'Cá nhân'} />
        {isHr ? (
          <div className="no-print mb-3 flex gap-2">
            <Button size="sm" variant={tab === 'mine' ? 'default' : 'outline'} onClick={() => setTab('mine')}>Đơn của tôi</Button>
            <Button size="sm" variant={tab === 'all' ? 'default' : 'outline'} onClick={() => setTab('all')}>Toàn công ty</Button>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={tab === 'all' ? allQ.isLoading : mineQ.isLoading}
          exportFilename="danh-sach-don-nghi-phep"
          printLabel="In danh sách"
          searchFields={(r) => [r.reason, r.user?.fullName ?? '', LEAVE_TYPE_LABEL[r.type] ?? '']}
          filters={[
            {
              key: 'status', label: 'Trạng thái',
              value: (r) => r.status,
              options: Object.entries(REQUEST_STATUS_LABEL).map(([value, label]) => ({ value, label })),
            },
            {
              key: 'type', label: 'Loại phép',
              value: (r) => r.type,
              options: Object.entries(LEAVE_TYPE_LABEL).map(([value, label]) => ({ value, label })),
            },
          ]}
          emptyTitle="Chưa có đơn nghỉ phép nào"
          emptyHint="Bấm “Tạo đơn nghỉ phép” để gửi đơn đầu tiên."
          actions={(r): RowActionItem[] => [
            { label: 'Xem chi tiết đơn', icon: Eye, onSelect: () => setDetail(r) },
            ...(tab === 'all' && isHr && r.status === 'PENDING' ? [
              'separator' as const,
              { label: 'Duyệt đơn (trừ quỹ ngay)', icon: Check, onSelect: () => decide.mutate({ id: r.id, approve: true }) },
              { label: 'Từ chối đơn', icon: X, danger: true, onSelect: () => decide.mutate({ id: r.id, approve: false }) },
            ] : tab === 'mine' && r.status === 'PENDING' ? [
              'separator' as const,
              { label: 'Hủy đơn', icon: Ban, danger: true, onSelect: () => cancel.mutate(r.id) },
            ] : []),
          ]}
        />
        <PrintSignatureBlock leftTitle="Người làm đơn" middleTitle="Trưởng bộ phận" rightTitle="Trưởng phòng HC-NS" />
      </div>

      {/* Modal chi tiết đơn — đầy đủ lý do, thời gian, kết quả duyệt */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title="Chi tiết đơn nghỉ phép">
        {detail ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ...(detail.user ? [['Nhân viên', `${detail.user.fullName} ${detail.user.employeeCode ? `(${detail.user.employeeCode})` : ''}`]] : []),
              ['Loại phép', LEAVE_TYPE_LABEL[detail.type] ?? detail.type],
              ['Từ ngày', formatDate(detail.startDate)],
              ['Đến ngày', formatDate(detail.endDate)],
              ['Số ngày làm việc', String(detail.days)],
              ['Trạng thái', REQUEST_STATUS_LABEL[detail.status] ?? detail.status],
              ...(detail.approver ? [['Người duyệt', detail.approver.fullName]] : []),
              ...(detail.decisionNote ? [['Ghi chú duyệt', detail.decisionNote]] : []),
            ].map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Lý do</dt>
              <dd className="font-medium">{detail.reason}</dd>
            </div>
          </dl>
        ) : null}
      </Modal>

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Tạo đơn nghỉ phép" description="Hệ thống kiểm tra quỹ phép trước khi gửi đơn.">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Loại phép *</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(LEAVE_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Từ ngày *</Label>
              <Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Đến ngày *</Label>
              <Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Lý do *</Label>
            <Textarea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setCreateOpen(false)} pending={create.isPending} confirmLabel="Gửi đơn" />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-card text-center ${highlight ? 'border-primary/40' : ''}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
