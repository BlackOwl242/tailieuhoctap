'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft, Check, Plus, X, Eye, ClipboardCheck, Circle, CheckCircle2,
  Lock, ArrowUpRight,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { ACTION_TYPE_LABEL } from '@/lib/hr';
import { Button, Card, CardContent, Input, Label, Select, Skeleton, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';
import type { HandoverView } from '@/lib/types';

interface ActionRow {
  id: string;
  type: keyof typeof ACTION_TYPE_LABEL;
  payload: { reason?: string; effectiveDate?: string; newSalary?: number; newOrgUnitId?: string; amount?: number };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  subject?: { fullName: string; employeeCode: string | null; orgUnit?: { name: string } | null };
  requester?: { fullName: string };
  decider?: { fullName: string } | null;
}

export default function PersonnelActionsPage() {
  const searchParams = useSearchParams();
  const initialMainTab = searchParams.get('tab') === 'handover' ? 'handover' : 'actions';
  const [mainTab, setMainTab] = useState<'actions' | 'handover'>(initialMainTab);

  const qc = useQueryClient();
  const toast = useToast();
  const meId = useAuthStore((s) => s.user?.id);
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isAdmin = roles.includes('ADMIN');
  const isManager = isAdmin || roles.includes('KM_MANAGER');

  // Subtab trong tab Quyết định: mine vs all
  const [actionSubTab, setActionSubTab] = useState<'mine' | 'all'>('mine');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ActionRow | null>(null);
  const [approvalPrompt, setApprovalPrompt] = useState<{ id: string; subjectName: string } | null>(null);
  const [fallbackOrgUnitId, setFallbackOrgUnitId] = useState('');
  const [form, setForm] = useState({
    type: 'RESIGNATION',
    subjectId: '',
    effectiveDate: '',
    reason: '',
    newSalary: '',
    amount: '',
    newOrgUnitId: '',
  });

  // Queries cho Quyết định biến động
  const mineQ = useQuery({
    queryKey: ['actions-mine'],
    queryFn: async () => (await api.get<ActionRow[]>('/personnel-actions/mine')).data,
    enabled: mainTab === 'actions',
  });
  const allQ = useQuery({
    queryKey: ['actions-all'],
    queryFn: async () => (await api.get<ActionRow[]>('/personnel-actions')).data,
    enabled: isManager && mainTab === 'actions' && actionSubTab === 'all',
  });
  const employeesQ = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<{ id: string; fullName: string; employeeCode: string | null; orgUnit?: { id: string; name: string } | null }[]>('/employees')).data,
  });
  const orgUnitsQ = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => (await api.get<{ id: string; name: string; code: string }[]>('/org-units')).data,
  });

  // Queries cho Bàn giao nghỉ việc
  const handoverQ = useQuery({
    queryKey: ['handovers'],
    queryFn: async () => (await api.get<HandoverView[]>('/handovers')).data,
    enabled: mainTab === 'handover',
  });

  const orgUnitMap = new Map((orgUnitsQ.data ?? []).map((u) => [u.id, u.name]));
  const selectedSubject = (employeesQ.data ?? []).find((e) => e.id === form.subjectId);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['actions-mine'] });
    qc.invalidateQueries({ queryKey: ['actions-all'] });
    qc.invalidateQueries({ queryKey: ['employees'] });
    qc.invalidateQueries({ queryKey: ['handovers'] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { reason: form.reason };
      if (form.newSalary) payload.newSalary = Number(form.newSalary);
      if (form.amount) payload.amount = Number(form.amount);
      if (form.type === 'TRANSFER') {
        if (!form.newOrgUnitId) throw new Error('Vui lòng chọn đơn vị chuyển đến');
        payload.newOrgUnitId = form.newOrgUnitId;
      }
      return api.post('/personnel-actions', {
        type: form.type,
        subjectId: form.subjectId,
        effectiveDate: form.effectiveDate || undefined,
        payload,
      });
    },
    onSuccess: () => {
      toast(form.type === 'RESIGNATION' ? 'Đã nộp đơn thôi việc — chờ duyệt' : 'Đã tạo đề xuất — chờ duyệt', 'success');
      setOpen(false);
      setForm({ type: 'RESIGNATION', subjectId: '', effectiveDate: '', reason: '', newSalary: '', amount: '', newOrgUnitId: '' });
      invalidate();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const decide = useMutation({
    mutationFn: async (vars: { id: string; approve: boolean; newOrgUnitId?: string }) =>
      api.post(`/personnel-actions/${vars.id}/${vars.approve ? 'approve' : 'reject'}`, {
        newOrgUnitId: vars.newOrgUnitId || undefined,
      }),
    onSuccess: (_, v) => {
      toast(v.approve ? 'Đã duyệt — hiệu lực đã áp dụng' : 'Đã từ chối đề xuất', 'success');
      setApprovalPrompt(null);
      invalidate();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Mutations cho Bàn giao
  const toggleHandoverItem = useMutation({
    mutationFn: async (vars: { id: string; itemId: string; done: boolean }) =>
      api.post(`/handovers/${vars.id}/items/${vars.itemId}/done`, { done: vars.done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['handovers'] }),
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const closeHandover = useMutation({
    mutationFn: async (id: string) => api.post(`/handovers/${id}/close`),
    onSuccess: () => {
      toast('Đã đóng checklist chuyển giao', 'success');
      qc.invalidateQueries({ queryKey: ['handovers'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<ActionRow>[] = [
    { key: 'type', header: 'Loại', sortable: true, render: (r) => <span className="text-xs font-semibold text-foreground">{ACTION_TYPE_LABEL[r.type] ?? r.type}</span> },
    {
      key: 'subject', header: 'Nhân viên', sortable: true, render: (r) => (
        <span>
          <span className="block font-medium">{r.subject?.fullName ?? '—'}</span>
          <span className="block text-xs text-muted-foreground">{r.subject?.employeeCode ?? ''} {r.subject?.orgUnit ? `· ${r.subject.orgUnit.name}` : ''}</span>
        </span>
      ),
    },
    {
      key: 'reason', header: 'Nội dung', render: (r) => {
        const targetUnitName = r.payload?.newOrgUnitId ? (orgUnitMap.get(r.payload.newOrgUnitId) ?? r.payload.newOrgUnitId) : null;
        return (
          <span className="line-clamp-2 max-w-[20rem] text-sm">
            {r.type === 'TRANSFER' && targetUnitName ? (
              <span className="block font-medium text-primary text-xs mb-0.5">→ Chuyển đến: {targetUnitName}</span>
            ) : null}
            <span>{r.payload?.reason ?? '—'}</span>
            {r.payload?.newSalary ? ` · Lương mới: ${r.payload.newSalary.toLocaleString('vi-VN')}đ` : ''}
            {r.payload?.amount ? ` · Mức: ${r.payload.amount.toLocaleString('vi-VN')}đ` : ''}
          </span>
        );
      },
    },
    { key: 'effectiveDate', header: 'Hiệu lực', sortable: true, sortValue: (r) => r.payload?.effectiveDate ?? r.createdAt, render: (r) => formatDate(r.payload?.effectiveDate ?? r.createdAt) },
    {
      key: 'status', header: 'Trạng thái', sortable: true, render: (r) => (
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
      ),
    },
    { key: 'decider', header: 'Người duyệt', render: (r) => r.decider?.fullName ?? '—' },
  ];

  return (
    <>
      <PageHeader
        title="Quyết định & Biến động Nhân sự"
        description="Thuyên chuyển · Điều chỉnh lương · Khen thưởng – kỷ luật · Thôi việc & Bàn giao công việc."
        actions={
          mainTab === 'actions' ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Tạo quyết định / đề xuất
            </Button>
          ) : undefined
        }
      />

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3 mb-4">
        <button
          onClick={() => setMainTab('actions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mainTab === 'actions'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Đề xuất & Quyết định biến động
        </button>
        <button
          onClick={() => setMainTab('handover')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mainTab === 'handover'
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          Thủ tục bàn giao công việc & Nghỉ việc
          {handoverQ.data ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
              {handoverQ.data.filter((h) => h.status === 'OPEN').length}
            </span>
          ) : null}
        </button>
      </div>

      {mainTab === 'actions' ? (
        <>
          {isManager ? (
            <div className="no-print mb-3 flex gap-2">
              <Button size="sm" variant={actionSubTab === 'mine' ? 'default' : 'outline'} onClick={() => setActionSubTab('mine')}>Liên quan đến tôi</Button>
              <Button size="sm" variant={actionSubTab === 'all' ? 'default' : 'outline'} onClick={() => setActionSubTab('all')}>Toàn công ty</Button>
            </div>
          ) : null}

          <div className="print-area">
            <PrintFrame title="BÁO CÁO BIẾN ĐỘNG NHÂN SỰ" />
            {actionSubTab === 'all' && allQ.isError ? <ErrorState message={errorMessage(allQ.error)} onRetry={() => allQ.refetch()} /> : null}
            {actionSubTab === 'mine' && mineQ.isError ? <ErrorState message={errorMessage(mineQ.error)} onRetry={() => mineQ.refetch()} /> : null}
            <DataTable
              columns={columns}
              rows={actionSubTab === 'all' ? (allQ.data ?? []) : (mineQ.data ?? [])}
              rowKey={(r) => r.id}
              loading={actionSubTab === 'all' ? allQ.isLoading : mineQ.isLoading}
              exportFilename="danh-sach-bien-dong-nhan-su"
              printLabel="In báo cáo biến động"
              searchFields={(r) => [r.subject?.fullName ?? '', r.payload?.reason ?? '', ACTION_TYPE_LABEL[r.type] ?? '']}
              filters={[
                { key: 'type', label: 'Loại', value: (r) => r.type, options: Object.entries(ACTION_TYPE_LABEL).map(([value, label]) => ({ value, label })) },
                {
                  key: 'status', label: 'Trạng thái', value: (r) => r.status, options: [
                    { value: 'PENDING', label: 'Chờ duyệt' }, { value: 'APPROVED', label: 'Đã duyệt' }, { value: 'REJECTED', label: 'Đã từ chối' },
                  ],
                },
              ]}
              emptyTitle="Chưa có đề xuất nào"
              emptyHint="Tạo đề xuất biến động nhân sự đầu tiên."
              actions={(r): RowActionItem[] => [
                { label: 'Xem chi tiết đề xuất', icon: Eye, onSelect: () => setDetail(r) },
                ...(isAdmin && r.status === 'PENDING' ? [
                  'separator' as const,
                  {
                    label: 'Duyệt & áp dụng hiệu lực',
                    icon: Check,
                    onSelect: () => {
                      if (r.type === 'TRANSFER' && !r.payload?.newOrgUnitId) {
                        setApprovalPrompt({ id: r.id, subjectName: r.subject?.fullName ?? 'Nhân sự' });
                        setFallbackOrgUnitId('');
                        return;
                      }
                      decide.mutate({ id: r.id, approve: true });
                    },
                  },
                  { label: 'Từ chối đề xuất', icon: X, danger: true, onSelect: () => decide.mutate({ id: r.id, approve: false }) },
                ] : []),
              ]}
            />
            <PrintSignatureBlock leftTitle="Người lập đề xuất" middleTitle="Trưởng phòng HC-NS" rightTitle="Tổng Giám đốc" />
          </div>
        </>
      ) : (
        /* Tab Thủ tục bàn giao nghỉ việc */
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border">
            Checklist bắt buộc trước ngày nghỉ việc — liên thông với quyết định thôi việc và quy trình thu hồi tài sản. Đủ tất cả các mục xác nhận mới có thể đóng checklist.
          </div>

          {handoverQ.isLoading ? (
            <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
          ) : handoverQ.isError ? (
            <ErrorState message={errorMessage(handoverQ.error)} onRetry={() => handoverQ.refetch()} />
          ) : (handoverQ.data?.length ?? 0) === 0 ? (
            <EmptyState title="Không có checklist bàn giao nào" hint="Checklist bàn giao sẽ tự động được tạo khi có quyết định thôi việc được duyệt." />
          ) : (
            <div className="space-y-4">
              {handoverQ.data!.map((h) => {
                const canTick = isManager || h.owner.id === meId;
                return (
                  <Card key={h.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-base text-foreground">{h.owner.fullName}</p>
                          <p className="text-xs text-muted-foreground">Ngày nghỉ việc dự kiến: {formatDate(h.leavingDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-foreground bg-muted px-2 py-1 rounded">
                            {h.done}/{h.total} hoàn thành
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <span className={`h-2 w-2 rounded-full ${h.status === 'CLOSED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {h.status === 'CLOSED' ? 'Đã hoàn tất bàn giao' : 'Đang xử lý bàn giao'}
                          </span>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2">
                        {h.items.map((item) => {
                          const done = item.status === 'DONE';
                          return (
                            <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border bg-slate-50/50 dark:bg-muted/30 px-3.5 py-2.5 text-sm">
                              <span className="flex min-w-0 items-center gap-2">
                                {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                <span className={done ? 'truncate line-through text-muted-foreground' : 'truncate font-medium'}>{item.title}</span>
                                {item.title.toLowerCase().includes('tài sản') ? (
                                  <Link
                                    href="/assets"
                                    className="no-print inline-flex items-center gap-0.5 text-xs text-primary font-medium hover:underline shrink-0 ml-2"
                                  >
                                    Thu hồi tại kho tài sản <ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                ) : null}
                              </span>
                              {canTick && h.status === 'OPEN' ? (
                                <Button
                                  size="sm"
                                  variant={done ? 'outline' : 'default'}
                                  onClick={() => toggleHandoverItem.mutate({ id: h.id, itemId: item.id, done: !done })}
                                >
                                  {done ? 'Hủy xác nhận' : 'Xác nhận xong'}
                                </Button>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>

                      {isManager && h.status === 'OPEN' ? (
                        <div className="mt-4 pt-3 border-t flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {h.done < h.total ? 'Yêu cầu hoàn thành tất cả các mục trước khi đóng checklist.' : 'Tất cả các mục đã hoàn tất. Có thể kết thúc thủ tục bàn giao.'}
                          </p>
                          <Button
                            size="sm"
                            disabled={h.done < h.total || closeHandover.isPending}
                            onClick={() => closeHandover.mutate(h.id)}
                            className="flex items-center gap-1.5"
                          >
                            <Lock className="h-4 w-4" /> Đóng checklist & Hoàn tất thủ tục
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết đề xuất */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={`Chi tiết đề xuất: ${detail ? ACTION_TYPE_LABEL[detail.type] : ''}`} size="lg">
        {detail ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ['Nhân viên', `${detail.subject?.fullName ?? '—'} ${detail.subject?.employeeCode ? `(${detail.subject.employeeCode})` : ''}`],
                ['Người đề xuất', detail.requester?.fullName ?? '—'],
                ['Người duyệt', detail.decider?.fullName ?? '—'],
                ['Trạng thái', detail.status === 'PENDING' ? 'Chờ duyệt' : detail.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'],
                ['Ngày hiệu lực', formatDate(detail.payload?.effectiveDate ?? detail.createdAt)],
                ['Lý do / nội dung', detail.payload?.reason ?? '—'],
                ...(detail.type === 'TRANSFER' ? [
                  ['Đơn vị hiện tại', detail.subject?.orgUnit?.name ?? '—'],
                  ['Đơn vị chuyển đến', detail.payload?.newOrgUnitId ? (orgUnitMap.get(detail.payload.newOrgUnitId) ?? detail.payload.newOrgUnitId) : 'Chưa chọn'],
                ] : []),
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

            {detail.type === 'RESIGNATION' && detail.status === 'APPROVED' ? (
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Quy trình bàn giao công việc & thu hồi tài sản đã được tự động kích hoạt.</span>
                <button
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    setMainTab('handover');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Xem checklist bàn giao →
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Modal tạo đề xuất biến động nhân sự */}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Tạo đề xuất biến động nhân sự"
        size="lg"
        description="Thuyên chuyển, điều chỉnh lương, khen thưởng, kỷ luật hoặc thôi việc — liên thông trực tiếp với hồ sơ nhân sự."
      >
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Loại đề xuất *</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(ACTION_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select></div>
          <div className="space-y-1.5"><Label>Nhân viên liên quan *</Label>
            <Select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">— Chọn nhân viên —</option>
              {((employeesQ.data ?? []) as Array<{ id: string; fullName: string; employeeCode: string | null }>).map((e2) => (
                <option key={e2.id} value={e2.id}>{e2.fullName} {e2.employeeCode ? `(${e2.employeeCode})` : ''}</option>
              ))}
            </Select></div>

          {selectedSubject ? (
            <div className="sm:col-span-2 text-xs bg-muted/40 p-2.5 rounded-xl border border-border/60 text-muted-foreground flex items-center justify-between">
              <span>Đơn vị công tác hiện tại:</span>
              <span className="font-bold text-foreground">{selectedSubject.orgUnit?.name ?? 'Chưa phân bổ phòng ban'}</span>
            </div>
          ) : null}

          {form.type === 'TRANSFER' ? (
            <div className="space-y-1.5 sm:col-span-2"><Label>Đơn vị mới (chuyển đến) *</Label>
              <Select required value={form.newOrgUnitId} onChange={(e) => setForm({ ...form, newOrgUnitId: e.target.value })}>
                <option value="">— Chọn đơn vị / phòng ban tiếp nhận —</option>
                {(orgUnitsQ.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </Select>
            </div>
          ) : null}

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

      {/* Modal bổ sung đơn vị tiếp nhận khi duyệt thuyên chuyển cũ thiếu newOrgUnitId */}
      <Modal
        open={!!approvalPrompt}
        onOpenChange={(o) => !o && setApprovalPrompt(null)}
        title="Chọn đơn vị tiếp nhận để hoàn tất phê duyệt"
        description={`Đề xuất thuyên chuyển của ${approvalPrompt?.subjectName ?? 'nhân sự'} cần chỉ định đơn vị chuyển đến trước khi ban hành hiệu lực.`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (approvalPrompt) {
              if (!fallbackOrgUnitId) {
                toast('Vui lòng chọn đơn vị chuyển đến', 'error');
                return;
              }
              decide.mutate({ id: approvalPrompt.id, approve: true, newOrgUnitId: fallbackOrgUnitId });
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Đơn vị mới (chuyển đến) *</Label>
            <Select required value={fallbackOrgUnitId} onChange={(e) => setFallbackOrgUnitId(e.target.value)}>
              <option value="">— Chọn phòng ban / khối tiếp nhận —</option>
              {(orgUnitsQ.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ModalFooterActions
              onCancel={() => setApprovalPrompt(null)}
              pending={decide.isPending}
              confirmLabel="Xác nhận & Duyệt quyết định"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
