'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Eye, GraduationCap, LogOut, Plus } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { COURSE_STATUS_LABEL, ENROLLMENT_STATUS_LABEL } from '@/lib/hr';
import { Badge, Button, Input, Label, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface CourseRow {
  id: string; title: string; description: string | null;
  startDate: string; endDate: string; capacity: number | null;
  status: keyof typeof COURSE_STATUS_LABEL;
  enrollments?: { status: keyof typeof ENROLLMENT_STATUS_LABEL }[];
  _count?: { enrollments: number };
}

const TONE: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-amber-100 text-amber-800',
  DONE: 'bg-emerald-100 text-emerald-800',
};

/** Đào tạo & phát triển — khóa học, ghi danh tự phục vụ, theo dõi hoàn thành. */
export default function TrainingPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<CourseRow | null>(null);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', capacity: '' });

  const q = useQuery({
    queryKey: ['training-courses'],
    queryFn: async () => (await api.get<CourseRow[]>('/training/courses/mine')).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['training-courses'] });

  const create = useMutation({
    mutationFn: async () => api.post('/training/courses', {
      title: form.title,
      description: form.description || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      capacity: form.capacity ? Number(form.capacity) : undefined,
    }),
    onSuccess: () => { toast('Đã tạo khóa đào tạo', 'success'); setOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const enroll = useMutation({
    mutationFn: async (id: string) => api.post(`/training/courses/${id}/enroll`),
    onSuccess: () => { toast('Đã ghi danh khóa học', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const drop = useMutation({
    mutationFn: async (id: string) => api.post(`/training/courses/${id}/drop`),
    onSuccess: () => { toast('Đã rút khỏi khóa học', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<CourseRow>[] = [
    { key: 'title', header: 'Khóa học', sortable: true, render: (r) => (
      <span>
        <span className="block font-medium">{r.title}</span>
        <span className="block line-clamp-1 text-xs text-muted-foreground">{r.description ?? ''}</span>
      </span>
    ) },
    { key: 'startDate', header: 'Thời gian', sortable: true, render: (r) => (
      <span className="flex items-center gap-1 text-sm"><CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
        {formatDate(r.startDate)} → {formatDate(r.endDate)}
      </span>
    ) },
    { key: 'count', header: 'Ghi danh', render: (r) => `${r._count?.enrollments ?? 0}${r.capacity ? `/${r.capacity}` : ''}` },
    { key: 'status', header: 'Trạng thái', sortable: true, render: (r) => <Badge className={TONE[r.status]}>{COURSE_STATUS_LABEL[r.status] ?? r.status}</Badge>, exportValue: (r) => COURSE_STATUS_LABEL[r.status] ?? r.status },
    {
      key: 'mine',
      header: 'Của tôi',
      noPrint: true,
      render: (r) => (r.enrollments?.[0] ? <Badge variant="secondary">{ENROLLMENT_STATUS_LABEL[r.enrollments[0].status] ?? r.enrollments[0].status}</Badge> : '—'),
    },
  ];

  return (
    <>
      <PageHeader
        title="Đào tạo"
        description="Kế hoạch đào tạo cá nhân hóa — chủ động phát triển đội ngũ thay vì phản ứng bị động."
        actions={
          isHr ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Tạo khóa học
            </Button>
          ) : null
        }
      />

      <div className="print-area">
        <PrintFrame title="DANH SÁCH KHÓA ĐÀO TẠO" />
        {q.isError ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={q.data ?? []}
            rowKey={(r) => r.id}
            loading={q.isLoading}
            exportFilename="danh-sach-khoa-dao-tao"
            printLabel="In danh sách khóa học"
            searchFields={(r) => [r.title, r.description ?? '']}
            filters={[{ key: 'status', label: 'Trạng thái', value: (r) => r.status, options: Object.entries(COURSE_STATUS_LABEL).map(([value, label]) => ({ value, label })) }]}
            emptyTitle="Chưa có khóa đào tạo nào"
            actions={(r): RowActionItem[] => {
              const mine = r.enrollments?.[0];
              const items: RowActionItem[] = [{ label: 'Xem chi tiết khóa học', icon: Eye, onSelect: () => setDetail(r) }];
              if (mine?.status === 'ENROLLED') {
                items.push('separator', { label: 'Rút khỏi khóa học', icon: LogOut, danger: true, onSelect: () => drop.mutate(r.id) });
              } else if (!mine && r.status !== 'DONE') {
                items.push('separator', { label: 'Ghi danh khóa học', icon: GraduationCap, onSelect: () => enroll.mutate(r.id) });
              }
              return items;
            }}
          />
        )}
        <PrintSignatureBlock leftTitle="Người lập danh sách" middleTitle="Trưởng ban Đào tạo" rightTitle="Giám đốc điều hành" />
      </div>

      {/* Modal chi tiết khóa học */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.title ?? ''}>
        {detail ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mô tả</dt>
              <dd className="font-medium">{detail.description ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Thời gian</dt>
              <dd className="font-medium">{formatDate(detail.startDate)} → {formatDate(detail.endDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Số chỗ</dt>
              <dd className="font-medium">{detail.capacity ? `${detail._count?.enrollments ?? 0}/${detail.capacity}` : 'Không giới hạn'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</dt>
              <dd className="font-medium">{COURSE_STATUS_LABEL[detail.status] ?? detail.status}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Của tôi</dt>
              <dd className="font-medium">{detail.enrollments?.[0] ? ENROLLMENT_STATUS_LABEL[detail.enrollments[0].status] ?? detail.enrollments[0].status : 'Chưa ghi danh'}</dd>
            </div>
          </dl>
        ) : null}
      </Modal>

      <Modal open={open} onOpenChange={setOpen} title="Tạo khóa đào tạo">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Tên khóa *</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Mô tả</Label>
            <Textarea className="min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ngày bắt đầu *</Label>
            <Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ngày kết thúc *</Label>
            <Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Số chỗ tối đa</Label>
            <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setOpen(false)} pending={create.isPending} confirmLabel="Tạo khóa" />
          </div>
        </form>
      </Modal>
    </>
  );
}
