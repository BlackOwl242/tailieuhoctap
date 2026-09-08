'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Check, Plus, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { ACTION_TYPE_LABEL } from '@/lib/hr';
import { Button, Input, Label, Select, Textarea } from '@/components/ui/primitives';
import { Eye } from 'lucide-react';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface ActionRow {
  id: string; type: keyof typeof ACTION_TYPE_LABEL;
  payload: { reason?: string; effectiveDate?: string; newSalary?: number; newOrgUnitId?: string; amount?: number };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNote: string | null; decidedAt: string | null; createdAt: string;
  subject?: { fullName: string; employeeCode: string | null; orgUnit?: { name: string } | null };
  requester?: { fullName: string };
  decider?: { fullName: string } | null;
}

const TONE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};

/**
 * Biến động nhân sự — một bộ máy duyệt dùng chung cho 5 loại đề xuất
 * (thuyên chuyển / điều chỉnh lương / khen thưởng / kỷ luật / thôi việc).
 * Duyệt thôi việc → tự sinh checklist BÀN GIAO CÔNG VIỆC 4 xác nhận.
 */
export default function PersonnelActionsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isAdmin = roles.includes('ADMIN');
  const isManager = isAdmin || roles.includes('KM_MANAGER');
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ActionRow | null>(null);
  const [form, setForm] = useState({ type: 'RESIGNATION', subjectId: '', effectiveDate: '', reason: '', newSalary: '', amount: '' });

  const mineQ = useQuery({
    queryKey: ['actions-mine'],
    queryFn: async () => (await api.get<ActionRow[]>('/personnel-actions/mine')).data,
  });
  const allQ = useQuery({
    queryKey: ['actions-all'],
    queryFn: async () => (await api.get<ActionRow[]>('/personnel-actions')).data,
    enabled: isManager && tab === 'all',
  });
  const employeesQ = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<{ id: string; fullName: string; employeeCode: string | null }>('/employees')).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['actions-mine'] });
    qc.invalidateQueries({ queryKey: ['actions-all'] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { reason: form.reason };
      if (form.newSalary) payload.newSalary = Number(form.newSalary);
      if (form.amount) payload.amount = Number(form.amount);
      return api.post('/personnel-actions', {
        type: form.type,
        subjectId: form.subjectId,
        effectiveDate: form.effectiveDate || undefined,
        payload,
      });
    },
    onSuccess: () => {
      toast(form.type === 'RESIGNATION' ? 'Đã nộp đơn thôi việc — chờ duyệt' : 'Đã tạo đề xuất — chờ duyệt', 'success');
      setOpen(false); invalidate();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const decide = useMutation({
    mutationFn: async (vars: { id: string; approve: boolean }) =>
      api.post(`/personnel-actions/${vars.id}/${vars.approve ? 'approve' : 'reject'}`, {}),
    onSuccess: (_, v) => {
      toast(v.approve ? 'Đã duyệt — hiệu lực đã áp dụng' : 'Đã từ chối đề xuất', 'success');
      invalidate();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<ActionRow>[] = [
    { key: 'type', header: 'Loại', sortable: true, render: (r) => <span className="text-xs font-semibold text-foreground">{ACTION_TYPE_LABEL[r.type] ?? r.type}</span> },
    { key: 'subject', header: 'Nhân viên', sortable: true, render: (r) => (
      <span>
        <span className="block font-medium">{r.subject?.fullName ?? '—'}</span>
        <span className="block text-xs text-muted-foreground">{r.subject?.employeeCode ?? ''} {r.subject?.orgUnit ? `· ${r.subject.orgUnit.name}` : ''}</span>
      </span>
    ) },
    { key: 'reason', header: 'Nội dung', render: (r) => (
      <span className="line-clamp-2 max-w-[18rem] text-sm">
        {r.payload?.reason ?? '—'}
        {r.payload?.newSalary ? ` · Lương mới: ${r.payload.newSalary.toLocaleString('vi-VN')}đ` : ''}
        {r.payload?.amount ? ` · Mức: ${r.payload.amount.toLocaleString('vi-VN')}đ` : ''}
      </span>
    ) },
    { key: 'effectiveDate', header: 'Hiệu lực', sortable: true, sortValue: (r) => r.payload?.effectiveDate ?? r.createdAt, render: (r) => formatDate(r.payload?.effectiveDate ?? r.createdAt) },
    { key: 'status', header: 'Trạng thái', sortable: true, render: (r) => (
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
        {r.status === 'PENDING' ? 'Chờ duyệt' : r.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
      </span>
    ) },
    { key: 'decider', header: 'Người duyệt', render: (r) => r.decider?.fullName ?? '—' },
  ];

  return (
    <>
      <PageHeader
        title="Biến động nhân sự"
        description="Thuyên chuyển · Điều chỉnh lương · Khen thưởng – kỷ luật · Thôi việc — một luồng duyệt dùng chung."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Tạo đề xuất
          </Button>
        }
      />

      {isManager ? (
        <div className="no-print mb-3 flex gap-2">
          <Button size="sm" variant={tab === 'mine' ? 'default' : 'outline'} onClick={() => setTab('mine')}>Liên quan đến tôi</Button>
          <Button size="sm" variant={tab === 'all' ? 'default' : 'outline'} onClick={() => setTab('all')}>Toàn công ty</Button>
        </div>
      ) : null}

      <div className="print-area">
        <PrintFrame title="BÁO CÁO BIẾN ĐỘNG NHÂN SỰ" />
        {tab === 'all' && allQ.isError ? <ErrorState message={errorMessage(allQ.error)} onRetry={() => allQ.refetch()} /> : null}
        {tab === 'mine' && mineQ.isError ? <ErrorState message={errorMessage(mineQ.error)} onRetry={() => mineQ.refetch()} /> : null}
        <DataTable
          columns={columns}
          rows={tab === 'all' ? (allQ.data ?? []) : (mineQ.data ?? [])}
          rowKey={(r) => r.id}
          loading={tab === 'all' ? allQ.isLoading : mineQ.isLoading}
          exportFilename="danh-sach-bien-dong-nhan-su"
          printLabel="In báo cáo biến động"
          searchFields={(r) => [r.subject?.fullName ?? '', r.payload?.reason ?? '', ACTION_TYPE_LABEL[r.type] ?? '']}
          filters={[
            { key: 'type', label: 'Loại', value: (r) => r.type, options: Object.entries(ACTION_TYPE_LABEL).map(([value, label]) => ({ value, label })) },
            { key: 'status', label: 'Trạng thái', value: (r) => r.status, options: [
              { value: 'PENDING', label: 'Chờ duyệt' }, { value: 'APPROVED', label: 'Đã duyệt' }, { value: 'REJECTED', label: 'Đã từ chối' },
            ] },
          ]}
          emptyTitle="Chưa có đề xuất nào"
          emptyHint="Tạo đề xuất biến động nhân sự đầu tiên."
          actions={(r): RowActionItem[] => [
            { label: 'Xem chi tiết đề xuất', icon: Eye, onSelect: () => setDetail(r) },
            ...(isAdmin && r.status === 'PENDING' ? [
              'separator' as const,
              { label: 'Duyệt & áp dụng hiệu lực', icon: Check, onSelect: () => decide.mutate({ id: r.id, approve: true }) },
              { label: 'Từ chối đề xuất', icon: X, danger: true, onSelect: () => decide.mutate({ id: r.id, approve: false }) },
            ] : []),
          ]}
        />
        <PrintSignatureBlock leftTitle="Người lập đề xuất" middleTitle="Trưởng phòng HC-NS" rightTitle="Tổng Giám đốc" />
      </div>

      {/* Modal chi tiết đề xuất — xem đầy đủ nội dung, hiệu lực, ghi quyết định */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={`Chi tiết đề xuất: ${detail ? ACTION_TYPE_LABEL[detail.type] : ''}`} size="lg">
        {detail ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ['Nhân viên', `${detail.subject?.fullName ?? '—'} ${detail.subject?.employeeCode ? `(${detail.subject.employeeCode})` : ''}`],
              ['Người đề xuất', detail.requester?.fullName ?? '—'],
              ['Người duyệt', detail.decider?.fullName ?? '—'],
              ['Trạng thái', detail.status === 'PENDING' ? 'Chờ duyệt' : detail.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'],
              ['Ngày hiệu lực', formatDate(detail.payload?.effectiveDate ?? detail.createdAt)],
              ['Lý do / nội dung', detail.payload?.reason ?? '—'],
              ...(detail.payload?.newSalary ? [['Mức lương mới', `${Number(detail.payload.newSalary).toLocaleString('vi-VN')}đ`]] : []),
              ...(detail.payload?.amount ? [['Mức thưởng / khấu trừ', `${Number(detail.payload.amount).toLocaleString('vi-VN')}đ`]] : []),
              ...(detail.decisionNote ? [['Ghi chú duyệt', detail.decisionNote]] : []),
            ].map(([k, v]) => (
              <div key={k as string} className={k === 'Lý do / nội dung' || k === 'Ghi chú duyệt' ? 'sm:col-span-2' : ''}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Modal>

      <Modal open={open} onOpenChange={setOpen} title="Tạo đề xuất biến động nhân sự" size="lg"
        description="Duyệt thôi việc sẽ tự sinh checklist bàn giao công việc 4 xác nhận bắt buộc.">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Loại đề xuất *</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(ACTION_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select></div>
          <div className="space-y-1.5"><Label>Nhân viên liên quan *</Label>
            <Select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">— Chọn —</option>
              {((employeesQ.data ?? []) as Array<{ id: string; fullName: string; employeeCode: string | null }>).map((e2) => (
                <option key={e2.id} value={e2.id}>{e2.fullName} {e2.employeeCode ? `(${e2.employeeCode})` : ''}</option>
              ))}
            </Select></div>
          <div className="space-y-1.5"><Label>Ngày hiệu lực</Label>
            <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} /></div>
          {form.type === 'SALARY_ADJUST' ? (
            <div className="space-y-1.5"><Label>Mức lương mới (VND) *</Label>
              <Input required type="number" min={0} value={form.newSalary} onChange={(e) => setForm({ ...form, newSalary: e.target.value })} /></div>
          ) : null}
          {form.type === 'AWARD' || form.type === 'DISCIPLINE' ? (
            <div className="space-y-1.5"><Label>Mức thưởng / khấu trừ (VND)</Label>
              <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          ) : null}
          <div className="space-y-1.5 sm:col-span-2"><Label>Lý do / nội dung *</Label>
            <Textarea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setOpen(false)} pending={create.isPending} confirmLabel="Gửi đề xuất" />
          </div>
        </form>
      </Modal>
    </>
  );
}
