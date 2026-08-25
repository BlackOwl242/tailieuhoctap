'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Gauge, Plus, Send } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { PERF_STATUS_LABEL } from '@/lib/hr';
import { Badge, Button, Input, Label, Select, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintButton, PrintFrame } from '@/components/ui/print';

interface ReviewRow {
  id: string; period: string; score: number | null;
  strengths: string | null; improvements: string | null; comment: string | null;
  status: keyof typeof PERF_STATUS_LABEL;
  createdAt: string;
  user?: { fullName: string; employeeCode: string | null };
  reviewer?: { fullName: string };
}

const TONE: Record<string, string> = {
  DRAFT: 'bg-secondary',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  ACKNOWLEDGED: 'bg-emerald-100 text-emerald-800',
};

/** Đánh giá hiệu suất theo chu kỳ 6 tháng — cơ sở cho tăng lương định kỳ (QP5). */
export default function PerformancePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  const [tab, setTab] = useState<'mine' | 'team'>('mine');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', period: `${new Date().getFullYear()}-H2`, score: '', strengths: '', improvements: '', comment: '' });

  const mineQ = useQuery({
    queryKey: ['perf-mine'],
    queryFn: async () => (await api.get<{ received: ReviewRow[]; given: ReviewRow[] }>('/performance/mine')).data,
  });
  const teamQ = useQuery({
    queryKey: ['perf-team'],
    queryFn: async () => (await api.get<ReviewRow[]>('/performance/team')).data,
    enabled: isHr && tab === 'team',
  });
  const employeesQ = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<{ id: string; fullName: string; employeeCode: string | null }>('/employees')).data,
    enabled: isHr,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['perf-mine'] });
    qc.invalidateQueries({ queryKey: ['perf-team'] });
  };

  const create = useMutation({
    mutationFn: async () => api.post('/performance', {
      userId: form.userId, period: form.period,
      score: form.score ? Number(form.score) : undefined,
      strengths: form.strengths || undefined,
      improvements: form.improvements || undefined,
      comment: form.comment || undefined,
    }),
    onSuccess: () => { toast('Đã tạo phiếu đánh giá', 'success'); setOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const submit = useMutation({
    mutationFn: async (id: string) => api.post(`/performance/${id}/submit`, {}),
    onSuccess: () => { toast('Đã nộp phiếu đánh giá', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const acknowledge = useMutation({
    mutationFn: async (id: string) => api.post(`/performance/${id}/acknowledge`, {}),
    onSuccess: () => { toast('Đã xác nhận kết quả đánh giá', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<ReviewRow>[] = [
    ...(tab === 'team' ? [{
      key: 'user', header: 'Nhân viên', sortable: true,
      render: (r: ReviewRow) => r.user?.fullName ?? '—',
    } as DataColumn<ReviewRow>] : [{
      key: 'reviewer', header: 'Người đánh giá', sortable: true,
      render: (r: ReviewRow) => r.reviewer?.fullName ?? '—',
    } as DataColumn<ReviewRow>]),
    { key: 'period', header: 'Kỳ đánh giá', sortable: true },
    { key: 'score', header: 'Điểm (0–100)', sortable: true, render: (r) => (r.score != null ? <span className="font-semibold">{r.score}</span> : '—') },
    { key: 'strengths', header: 'Điểm mạnh', render: (r) => <span className="line-clamp-2 max-w-[16rem] text-sm">{r.strengths ?? '—'}</span> },
    { key: 'improvements', header: 'Cần cải thiện', render: (r) => <span className="line-clamp-2 max-w-[16rem] text-sm">{r.improvements ?? '—'}</span> },
    { key: 'status', header: 'Trạng thái', sortable: true, render: (r) => <Badge className={TONE[r.status]}>{PERF_STATUS_LABEL[r.status] ?? r.status}</Badge> },
  ];

  const rows = tab === 'team' ? (teamQ.data ?? []) : [...(mineQ.data?.received ?? []), ...(mineQ.data?.given ?? [])];

  return (
    <>
      <PageHeader
        title="Đánh giá hiệu suất"
        description="Chu kỳ 6 tháng/lần — kết quả là căn cứ cho tăng lương định kỳ và kế hoạch phát triển."
        actions={
          <>
            {isHr ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Tạo phiếu đánh giá</Button> : null}
            <PrintButton label="In báo cáo" />
          </>
        }
      />

      {isHr ? (
        <div className="no-print mb-3 flex gap-2">
          <Button size="sm" variant={tab === 'mine' ? 'default' : 'outline'} onClick={() => setTab('mine')}>Của tôi</Button>
          <Button size="sm" variant={tab === 'team' ? 'default' : 'outline'} onClick={() => setTab('team')}>Toàn công ty</Button>
        </div>
      ) : null}

      <div className="print-area">
        <PrintFrame title="BÁO CÁO ĐÁNH GIÁ HIỆU SUẤT" subtitle={tab === 'team' ? 'Toàn công ty' : 'Cá nhân'} />
        {tab === 'team' && teamQ.isError ? <ErrorState message={errorMessage(teamQ.error)} onRetry={() => teamQ.refetch()} /> : null}
        {tab === 'mine' && mineQ.isError ? <ErrorState message={errorMessage(mineQ.error)} onRetry={() => mineQ.refetch()} /> : null}
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={tab === 'team' ? teamQ.isLoading : mineQ.isLoading}
          exportFilename="danh-gia-hieu-suat"
          searchFields={(r) => [r.period, r.user?.fullName ?? '', r.reviewer?.fullName ?? '', r.strengths ?? '']}
          filters={[{ key: 'status', label: 'Trạng thái', value: (r) => r.status, options: Object.entries(PERF_STATUS_LABEL).map(([value, label]) => ({ value, label })) }]}
          emptyTitle="Chưa có phiếu đánh giá nào"
          actions={(r): RowActionItem[] => {
            // Mục 5 — nộp phiếu: đúng người đánh giá (so id, không so tên)
            if (tab === 'team' && isHr && r.status === 'DRAFT') {
              return [{ label: 'Nộp phiếu đánh giá', icon: Send, onSelect: () => submit.mutate(r.id) }];
            }
            if (tab === 'mine' && r.status === 'SUBMITTED' && mineQ.data?.received.some((x) => x.id === r.id)) {
              return [{ label: 'Xác nhận đã đọc kết quả', icon: Check, onSelect: () => acknowledge.mutate(r.id) }];
            }
            return [];
          }}
        />
      </div>

      <Modal open={open} onOpenChange={setOpen} title="Tạo phiếu đánh giá hiệu suất">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Nhân viên *</Label>
            <Select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">— Chọn nhân viên —</option>
              {((employeesQ.data ?? []) as Array<{ id: string; fullName: string; employeeCode: string | null }>).map((e2) => (
                <option key={e2.id} value={e2.id}>{e2.fullName} {e2.employeeCode ? `(${e2.employeeCode})` : ''}</option>
              ))}
            </Select></div>
          <div className="space-y-1.5"><Label>Kỳ đánh giá *</Label>
            <Input required value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2026-H2" /></div>
          <div className="space-y-1.5"><Label>Điểm tổng (0–100)</Label>
            <Input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Điểm mạnh</Label>
            <Textarea className="min-h-[60px]" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Cần cải thiện</Label>
            <Textarea className="min-h-[60px]" value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} /></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setOpen(false)} pending={create.isPending} confirmLabel="Tạo phiếu" />
          </div>
        </form>
      </Modal>
    </>
  );
}
