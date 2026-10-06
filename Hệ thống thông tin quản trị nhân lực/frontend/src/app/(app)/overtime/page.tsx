'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock4, Eye, Plus, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE } from '@/lib/hr';
import { Button, Input, Label, Skeleton, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';

interface OvertimeRow {
  id: string; workDate: string; hours: number; nightHours?: number; dayCategory?: string; reason: string;
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
  const [form, setForm] = useState({ workDate: '', hours: '', nightHours: '0', dayCategory: 'WEEKDAY', reason: '' });

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
    mutationFn: async () => api.post('/overtime', { workDate: form.workDate, hours: Number(form.hours), nightHours: Number(form.nightHours), dayCategory: form.dayCategory, reason: form.reason }),
    onSuccess: () => { toast('Đã gửi đăng ký làm thêm giờ', 'success'); setOpen(false); setForm({ workDate: '', hours: '', nightHours: '0', dayCategory: 'WEEKDAY', reason: '' }); invalidate(); },
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
      render: (r: OvertimeRow) => r.user?.fullName ?? 'Chưa cập nhật',
      exportValue: (r: OvertimeRow) => r.user?.fullName ?? '',
    } as DataColumn<OvertimeRow>] : []),
    { key: 'workDate', header: 'Ngày làm thêm', sortable: true, render: (r) => formatDate(r.workDate), exportValue: (r) => formatDate(r.workDate) },
    { key: 'hours', header: 'Số giờ', sortable: true },
    { key: 'dayCategory', header: 'Loại ngày', render: (r) => r.dayCategory === 'PUBLIC_HOLIDAY' ? 'Lễ, Tết' : r.dayCategory === 'WEEKLY_REST' ? 'Nghỉ tuần' : 'Ngày thường' },
    { key: 'nightHours', header: 'Giờ ban đêm', render: (r) => r.nightHours ?? 0 },
    { key: 'reason', header: 'Lý do', render: (r) => <span className="line-clamp-2 max-w-[18rem]">{r.reason}</span> },
    {
      key: 'status', header: 'Trạng thái', sortable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              r.status === 'APPROVED'
                ? 'bg-emerald-600'
                : r.status === 'PENDING'
                ? 'bg-amber-600'
                : 'bg-rose-600'
            }`}
          />
          {REQUEST_STATUS_LABEL[r.status] ?? r.status}
        </span>
      ),
      exportValue: (r) => REQUEST_STATUS_LABEL[r.status] ?? r.status,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Làm thêm giờ"
        description="Đăng ký và phê duyệt làm thêm giờ minh bạch — đảm bảo quyền lợi theo quy định và tự động kết nối bảng lương."
        breadcrumbs={[{ label: 'Chấm công' }, { label: 'Làm thêm giờ' }]}
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
              ['Loại ngày', detail.dayCategory === 'PUBLIC_HOLIDAY' ? 'Lễ, Tết' : detail.dayCategory === 'WEEKLY_REST' ? 'Nghỉ tuần' : 'Ngày thường'],
              ['Giờ ban đêm', String(detail.nightHours ?? 0)],
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
            <div className="space-y-1.5"><Label>Số giờ (0.5–4) *</Label>
              <Input required type="number" step="0.5" min={0.5} max={4} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Loại ngày làm thêm</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.dayCategory} onChange={(e) => setForm({ ...form, dayCategory: e.target.value })}>
                <option value="WEEKDAY">Ngày làm việc bình thường</option><option value="WEEKLY_REST">Ngày nghỉ hằng tuần</option><option value="PUBLIC_HOLIDAY">Ngày lễ, Tết</option>
              </select></div>
            <div className="space-y-1.5"><Label>Số giờ làm ban đêm</Label>
              <Input type="number" step="0.5" min={0} max={Number(form.hours || 0)} value={form.nightHours} onChange={(e) => setForm({ ...form, nightHours: e.target.value })} /></div>
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
