'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock4, Eye, Plus, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE } from '@/lib/hr';
import { Badge, Button, Input, Label, Skeleton, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';

interface OvertimeRow {
  id: string; workDate: string; hours: number; reason: string;
  status: keyof typeof REQUEST_STATUS_LABEL; decisionNote: string | null;
  user?: { fullName: string; employeeCode: string | null; orgUnit?: { name: string } | null };
  approver?: { fullName: string } | null;
}

/** UC19 — Đăng ký làm thêm giờ: chưa duyệt thì không tính tiền. */
export default function OvertimePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OvertimeRow | null>(null);
  const [form, setForm] = useState({ workDate: '', hours: '', reason: '' });

  const mineQ = useQuery({
    queryKey: ['overtime-mine'],
    queryFn: async () => (await api.get<OvertimeRow[]>('/overtime/mine')).data,
  });
  const allQ = useQuery({
    queryKey: ['overtime-all'],
    queryFn: async () => (await api.get<OvertimeRow[]>('/overtime')).data,
    enabled: isHr && tab === 'all',
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['overtime-mine'] });
    qc.invalidateQueries({ queryKey: ['overtime-all'] });
  };

  const create = useMutation({
    mutationFn: async () => api.post('/overtime', { workDate: form.workDate, hours: Number(form.hours), reason: form.reason }),
    onSuccess: () => { toast('Đã gửi đăng ký làm thêm giờ', 'success'); setOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const decide = useMutation({
    mutationFn: async (vars: { id: string; approve: boolean }) =>
      api.post(`/overtime/${vars.id}/${vars.approve ? 'approve' : 'reject'}`, {}),
    onSuccess: (_, v) => { toast(v.approve ? 'Đã duyệt giờ làm thêm' : 'Đã từ chối', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<OvertimeRow>[] = [
    ...(tab === 'all' ? [{
      key: 'user', header: 'Nhân viên', sortable: true,
      render: (r: OvertimeRow) => r.user?.fullName ?? '—',
      exportValue: (r: OvertimeRow) => r.user?.fullName ?? '',
    } as DataColumn<OvertimeRow>] : []),
    { key: 'workDate', header: 'Ngày làm thêm', sortable: true, render: (r) => formatDate(r.workDate), exportValue: (r) => formatDate(r.workDate) },
    { key: 'hours', header: 'Số giờ', sortable: true },
    { key: 'reason', header: 'Lý do', render: (r) => <span className="line-clamp-2 max-w-[18rem]">{r.reason}</span> },
    {
      key: 'status', header: 'Trạng thái', sortable: true,
      render: (r) => <Badge className={REQUEST_STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status] ?? r.status}</Badge>,
      exportValue: (r) => REQUEST_STATUS_LABEL[r.status] ?? r.status,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Làm thêm giờ (Overtime)"
        description="Đăng ký và phê duyệt làm thêm giờ minh bạch — đảm bảo quyền lợi theo quy định và tự động kết nối bảng lương."
        breadcrumbs={[{ label: 'Ca kíp & Chấm công' }, { label: 'Làm thêm giờ' }]}
        actions={
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 shadow-2xs">
            <Plus className="h-3.5 w-3.5" /> Đăng ký làm thêm
          </Button>
        }
      />

      {isHr ? (
        <div className="no-print mb-3 flex gap-2">
          <Button size="sm" variant={tab === 'mine' ? 'default' : 'outline'} onClick={() => setTab('mine')}>Đơn của tôi</Button>
          <Button size="sm" variant={tab === 'all' ? 'default' : 'outline'} onClick={() => setTab('all')}>Toàn công ty</Button>
        </div>
      ) : null}

      {tab === 'mine' && mineQ.isError ? <ErrorState message={errorMessage(mineQ.error)} onRetry={() => mineQ.refetch()} /> : null}

      <DataTable
        columns={columns}
        rows={tab === 'all' ? (allQ.data ?? []) : (mineQ.data ?? [])}
        rowKey={(r) => r.id}
        loading={tab === 'all' ? allQ.isLoading : mineQ.isLoading}
        exportFilename="lam-them-gio"
        searchFields={(r) => [r.reason, r.user?.fullName ?? '']}
        filters={[{
          key: 'status', label: 'Trạng thái', value: (r) => r.status,
          options: Object.entries(REQUEST_STATUS_LABEL).map(([value, label]) => ({ value, label })),
        }]}
        emptyTitle="Chưa có đăng ký làm thêm giờ"
        actions={(r): RowActionItem[] => [
          // "Xem chi tiết" LUÔN có mặt — kebab không bao giờ trống (Mục 8)
          { label: 'Xem chi tiết đăng ký', icon: Eye, onSelect: () => setDetail(r) },
          ...(tab === 'all' && isHr && r.status === 'PENDING' ? [
            'separator' as const,
            { label: 'Duyệt giờ làm thêm', icon: Check, onSelect: () => decide.mutate({ id: r.id, approve: true }) },
            { label: 'Từ chối', icon: X, danger: true, onSelect: () => decide.mutate({ id: r.id, approve: false }) },
          ] : []),
        ]}
      />

      {/* Modal chi tiết đăng ký — đầy đủ lý do, giờ, kết quả duyệt */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title="Chi tiết đăng ký làm thêm giờ">
        {detail ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ...(detail.user ? [['Nhân viên', `${detail.user.fullName} ${detail.user.employeeCode ? `(${detail.user.employeeCode})` : ''}`]] : []),
              ['Ngày làm thêm', formatDate(detail.workDate)],
              ['Số giờ', String(detail.hours)],
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

      <Modal open={open} onOpenChange={setOpen} title="Đăng ký làm thêm giờ">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Ngày *</Label>
              <Input required type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Số giờ (0.5–12) *</Label>
              <Input required type="number" step="0.5" min={0.5} max={12} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Lý do *</Label>
            <Textarea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setOpen(false)} pending={create.isPending} confirmLabel="Gửi đăng ký" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
