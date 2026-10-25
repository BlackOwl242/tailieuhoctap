'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock4, Eye, Plus, X } from 'lucide-react';
import { api, errorMessage, openProtectedFile } from '@/lib/api';
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
  id: string;
  userId?: string;
  workDate: string; hours: number; nightHours?: number; dayCategory?: string; reason: string;
  status: keyof typeof REQUEST_STATUS_LABEL; decisionNote: string | null;
  user?: { id?: string; fullName: string; employeeCode: string | null; orgUnit?: { name: string } | null };
  approver?: { fullName: string } | null;
  actualHours?: number | null; actualNightHours?: number | null; actualConfirmedAt?: string | null;
  actualNote?: string | null; actualEvidenceUrl?: string | null;
}

/** UC19 — Duyệt kế hoạch, đối soát thực làm rồi mới tính tiền. */
export default function OvertimePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const canReview = roles.some((r) => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD'].includes(r));
  const isHr = canReview;
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OvertimeRow | null>(null);
  const [actualRequest, setActualRequest] = useState<OvertimeRow | null>(null);
  const [actualForm, setActualForm] = useState({ actualHours: '', actualNightHours: '0', note: '', evidenceUrl: '' });
  const statusLabel = (r: OvertimeRow) => r.status === 'APPROVED' ? r.actualConfirmedAt ? 'Đã xác nhận thực làm' : 'Đã duyệt kế hoạch' : REQUEST_STATUS_LABEL[r.status] ?? r.status;
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const isOwn = (r: OvertimeRow) => r.userId === user?.id || r.user?.id === user?.id;
  const openActual = (r: OvertimeRow) => { setDetail(null); setActualRequest(r); setActualForm({ actualHours: '', actualNightHours: '0', note: '', evidenceUrl: '' }); };
  const [form, setForm] = useState({ workDate: '', hours: '', nightHours: '0', dayCategory: 'WEEKDAY', reason: '' });

  const mineQ = useQuery({
    queryKey: ['overtime-mine'],
    queryFn: async () => (await api.get<OvertimeRow[]>('/overtime/mine')).data,
  });
  const allQ = useQuery({
    queryKey: ['overtime-all'],
    queryFn: async () => (await api.get<OvertimeRow[]>('/overtime')).data,
    enabled: canReview && tab === 'all',
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
  const confirmActual = useMutation({
    mutationFn: async () => api.post(`/overtime/${actualRequest!.id}/confirm-actual`, { ...actualForm, actualHours: Number(actualForm.actualHours), actualNightHours: Number(actualForm.actualNightHours) }),
    onSuccess: () => { toast('Đã xác nhận số giờ thực làm để tính lương', 'success'); setActualRequest(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<OvertimeRow>[] = [
    ...(tab === 'all' ? [{
      key: 'user', header: 'Nhân viên', sortable: true,
      render: (r: OvertimeRow) => r.user?.fullName ?? 'Chưa cập nhật',
      exportValue: (r: OvertimeRow) => r.user?.fullName ?? '',
    } as DataColumn<OvertimeRow>] : []),
    { key: 'workDate', header: 'Ngày làm thêm', sortable: true, render: (r) => formatDate(r.workDate), exportValue: (r) => formatDate(r.workDate) },
    { key: 'hours', header: 'Giờ đăng ký', sortable: true },
    { key: 'actualHours', header: 'Giờ làm căn cứ trả', render: (r) => r.actualConfirmedAt ? r.actualHours ?? 0 : 'Chưa xác nhận' },
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
          {statusLabel(r)}
        </span>
      ),
      exportValue: statusLabel,
    },
    { key: 'nextAction', header: 'Việc tiếp theo', render: (r) => {
      if (r.status === 'APPROVED' && r.actualConfirmedAt) return <span className="text-xs text-muted-foreground">Đủ căn cứ OT, chờ tính kỳ lương</span>;
      if (r.status === 'APPROVED' && !r.actualConfirmedAt && canReview && !isOwn(r)) return <div className="space-y-1"><Button size="sm" variant="outline" disabled={r.workDate.slice(0, 10) >= todayKey} onClick={() => openActual(r)}>Xác nhận thực làm</Button>{r.workDate.slice(0, 10) >= todayKey && <p className="text-xs text-muted-foreground">Thực hiện sau ngày OT</p>}</div>;
      if (r.status === 'PENDING' && tab === 'all' && canReview && !isOwn(r)) return <Button size="sm" variant="outline" onClick={() => setDetail(r)}>Xem và duyệt kế hoạch</Button>;
      return <span className="text-xs text-muted-foreground">{r.status === 'PENDING' ? 'Chờ người có quyền duyệt' : r.status === 'APPROVED' ? 'Chờ người khác xác nhận thực làm' : 'Đã kết thúc xử lý'}</span>;
    } },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Làm thêm giờ"
        description="Duyệt kế hoạch, xác nhận số giờ thực làm và minh chứng trước khi tính tiền làm thêm."
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
          <Button size="sm" variant={tab === 'all' ? 'default' : 'outline'} onClick={() => setTab('all')}>Phạm vi quản lý</Button>
        </div>
      ) : null}

      {tab === 'mine' && mineQ.isError ? <ErrorState message={errorMessage(mineQ.error)} onRetry={() => mineQ.refetch()} /> : null}
      {tab === 'all' && allQ.isError ? <ErrorState message={errorMessage(allQ.error)} onRetry={() => allQ.refetch()} /> : null}

      <DataTable
        columns={columns}
        rows={tab === 'all' ? (allQ.data ?? []) : (mineQ.data ?? [])}
        rowKey={(r) => r.id}
        loading={tab === 'all' ? allQ.isLoading : mineQ.isLoading}
        exportFilename="lam-them-gio"
        searchFields={(r) => [r.reason, r.user?.fullName ?? '']}
        filters={[{
          key: 'status', label: 'Trạng thái', value: (r) => r.status === 'APPROVED' ? r.actualConfirmedAt ? 'CONFIRMED_ACTUAL' : 'APPROVED_PLAN' : r.status,
          options: [{ value: 'PENDING', label: 'Chờ duyệt kế hoạch' }, { value: 'APPROVED_PLAN', label: 'Chờ xác nhận thực làm' }, { value: 'CONFIRMED_ACTUAL', label: 'Đã xác nhận thực làm' }, { value: 'REJECTED', label: 'Từ chối' }],
        }]}
        emptyTitle="Chưa có đăng ký làm thêm giờ"
        actions={(r): RowActionItem[] => {
          const isOwnRequest = Boolean(user?.id && (r.userId === user.id || r.user?.id === user.id));
          return [
            // "Xem chi tiết" LUÔN có mặt — kebab không bao giờ trống (Mục 8)
            { label: 'Xem chi tiết đăng ký', icon: Eye, onSelect: () => setDetail(r) },
            ...(tab === 'all' && canReview && r.status === 'APPROVED' && !r.actualConfirmedAt && !isOwnRequest ? [
              { label: 'Xác nhận giờ thực làm', icon: Clock4, disabled: r.workDate.slice(0, 10) >= todayKey, onSelect: () => openActual(r) },
            ] : []),
            ...(tab === 'all' && canReview && r.status === 'PENDING' && !isOwnRequest ? [
              'separator' as const,
              { label: 'Duyệt giờ làm thêm', icon: Check, onSelect: () => decide.mutate({ id: r.id, approve: true }) },
              { label: 'Từ chối', icon: X, danger: true, onSelect: () => decide.mutate({ id: r.id, approve: false }) },
            ] : []),
          ];
        }}
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
              ['Trạng thái', statusLabel(detail)],
              ['Giờ thực làm đã xác nhận', detail.actualConfirmedAt ? String(detail.actualHours ?? 0) : 'Chưa xác nhận — chưa tính tiền OT'],
              ...(detail.actualNote ? [['Đối soát thực làm', detail.actualNote]] : []),
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
        {detail?.actualEvidenceUrl && <Button className="mt-3" variant="outline" size="sm" onClick={() => void openProtectedFile(detail.actualEvidenceUrl!).catch(error => toast(errorMessage(error), 'error'))}>Mở minh chứng thực làm</Button>}
        {detail && canReview && !isOwn(detail) && detail.status === 'PENDING' && <div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={decide.isPending} onClick={() => { decide.mutate({ id: detail.id, approve: false }); setDetail(null); }}>Từ chối kế hoạch</Button><Button disabled={decide.isPending} onClick={() => { decide.mutate({ id: detail.id, approve: true }); setDetail(null); }}>Duyệt kế hoạch</Button></div>}
        {detail && canReview && !isOwn(detail) && detail.status === 'APPROVED' && !detail.actualConfirmedAt && <div className="mt-4 flex justify-end"><Button disabled={detail.workDate.slice(0, 10) >= todayKey} onClick={() => openActual(detail)}>Xác nhận thực làm</Button></div>}
      </Modal>

      <Modal open={!!actualRequest} onOpenChange={(value) => !value && setActualRequest(null)} title="Xác nhận giờ làm thêm thực tế">
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); confirmActual.mutate(); }}>
          <p className="text-sm text-muted-foreground">{actualRequest?.user?.fullName} · {actualRequest && formatDate(actualRequest.workDate)} · tối đa {actualRequest?.hours} giờ đã duyệt. Xác nhận sau ngày làm thêm; nhập 0 nếu không thực hiện.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="ot-actual-hours">Giờ thực làm *</Label><Input id="ot-actual-hours" required type="number" min={0} max={actualRequest?.hours} step="0.25" value={actualForm.actualHours} onChange={e => setActualForm({ ...actualForm, actualHours: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ot-actual-night">Trong đó, giờ ban đêm *</Label><Input id="ot-actual-night" required type="number" min={0} max={Number(actualForm.actualHours || 0)} step="0.25" value={actualForm.actualNightHours} onChange={e => setActualForm({ ...actualForm, actualNightHours: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ot-proof">Đường dẫn minh chứng *</Label><Input id="ot-proof" required value={actualForm.evidenceUrl} onChange={e => setActualForm({ ...actualForm, evidenceUrl: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="ot-note">Kết quả đối soát *</Label><Textarea id="ot-note" required minLength={10} value={actualForm.note} onChange={e => setActualForm({ ...actualForm, note: e.target.value })} /></div>
          <ModalFooterActions onCancel={() => setActualRequest(null)} pending={confirmActual.isPending} confirmLabel="Xác nhận thực làm" />
        </form>
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
            <p className="text-sm text-muted-foreground">Loại ngày được xác định từ lịch ca và ngày lễ của nhân viên khi đối soát.</p>
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
