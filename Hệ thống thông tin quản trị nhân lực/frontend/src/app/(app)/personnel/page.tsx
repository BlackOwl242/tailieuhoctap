'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft, Check, Plus, X, Eye, ClipboardCheck, Circle, CheckCircle2,
  Lock, ArrowUpRight, ChevronDown, Clock4,
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
  subjectId?: string;
  payload: { reason?: string; effectiveDate?: string; newSalary?: number; newOrgUnitId?: string; amount?: number; subType?: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  subject?: { id?: string; fullName: string; employeeCode: string | null; orgUnit?: { name: string } | null };
  requester?: { fullName: string };
  decider?: { fullName: string } | null;
}

export default function PersonnelActionsPage() {
  const searchParams = useSearchParams();
  const createForParam = searchParams.get('createFor');
  const typeParam = searchParams.get('type');
  const [isHandoverExpanded, setIsHandoverExpanded] = useState(true);

  const qc = useQueryClient();
  const toast = useToast();
  const meId = useAuthStore((s) => s.user?.id);
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isAdmin = roles.includes('ADMIN');
  const isManager = isAdmin || roles.includes('KM_MANAGER');

  // Subtab trong Quyết định: mine vs all
  const [actionSubTab, setActionSubTab] = useState<'mine' | 'all'>('mine');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ActionRow | null>(null);
  const [approvalPrompt, setApprovalPrompt] = useState<{ id: string; subjectName: string } | null>(null);
  const [fallbackOrgUnitId, setFallbackOrgUnitId] = useState('');
  const [form, setForm] = useState({
    type: 'TRANSFER',
    subType: 'BÃI NHIỆM',
    subjectId: '',
    effectiveDate: '',
    reason: '',
    newSalary: '',
    amount: '',
    newOrgUnitId: '',
  });

  useEffect(() => {
    if (createForParam) {
      setForm((prev) => ({
        ...prev,
        subjectId: createForParam,
        type: typeParam || prev.type || 'TRANSFER',
      }));
      setOpen(true);
    }
  }, [createForParam, typeParam]);

  // Queries cho Quyết định biến động
  const mineQ = useQuery({
    queryKey: ['actions-mine'],
    queryFn: async () => (await api.get<ActionRow[]>('/personnel-actions/mine')).data,
  });
  const allQ = useQuery({
    queryKey: ['actions-all'],
    queryFn: async () => (await api.get<ActionRow[]>('/personnel-actions')).data,
    enabled: isManager && actionSubTab === 'all',
  });
  const employeesQ = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<{ id: string; fullName: string; employeeCode: string | null; orgUnit?: { id: string; name: string } | null }[]>('/employees')).data,
  });
  const orgUnitsQ = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => (await api.get<{ id: string; name: string; code: string }[]>('/org-units')).data,
  });

  // Queries cho Bàn giao (nạp để hiển thị tích hợp trong popup chi tiết và cột bảng)
  const handoverQ = useQuery({
    queryKey: ['handovers'],
    queryFn: async () => (await api.get<HandoverView[]>('/handovers')).data,
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
      const finalReason = form.type === 'DISCIPLINE' && form.subType
        ? `[${form.subType}] ${form.reason}`
        : form.reason;
      const payload: Record<string, unknown> = { reason: finalReason, subType: form.subType };
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
      setForm({ type: 'TRANSFER', subType: 'BÃI NHIỆM', subjectId: '', effectiveDate: '', reason: '', newSalary: '', amount: '', newOrgUnitId: '' });
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
      toast('Đã đóng checklist bàn giao', 'success');
      qc.invalidateQueries({ queryKey: ['handovers'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<ActionRow>[] = [
    {
      key: 'type',
      header: 'Loại quyết định',
      sortable: true,
      render: (r) => <span className="text-xs font-medium text-foreground">{ACTION_TYPE_LABEL[r.type] ?? r.type}</span>,
    },
    {
      key: 'subject',
      header: 'Nhân sự',
      sortable: true,
      render: (r) => (
        <span>
          <span className="block font-medium text-foreground">{r.subject?.fullName ?? '—'}</span>
          <span className="block text-xs text-muted-foreground">{r.subject?.employeeCode ?? ''} {r.subject?.orgUnit ? `· ${r.subject.orgUnit.name}` : ''}</span>
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Nội dung / Chi tiết',
      render: (r) => {
        const targetUnitName = r.payload?.newOrgUnitId ? (orgUnitMap.get(r.payload.newOrgUnitId) ?? r.payload.newOrgUnitId) : null;
        return (
          <span className="line-clamp-2 max-w-[20rem] text-xs text-muted-foreground">
            {r.type === 'TRANSFER' && targetUnitName ? (
              <span className="block font-medium text-foreground text-xs mb-0.5">→ Chuyển đến: {targetUnitName}</span>
            ) : null}
            <span>{r.payload?.reason ?? '—'}</span>
            {r.payload?.newSalary ? ` · Lương mới: ${r.payload.newSalary.toLocaleString('vi-VN')}đ` : ''}
            {r.payload?.amount ? ` · Mức: ${r.payload.amount.toLocaleString('vi-VN')}đ` : ''}
          </span>
        );
      },
    },
    {
      key: 'effectiveDate',
      header: 'Hiệu lực',
      sortable: true,
      sortValue: (r) => r.payload?.effectiveDate ?? r.createdAt,
      render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.payload?.effectiveDate ?? r.createdAt)}</span>,
    },
    {
      key: 'handover',
      header: 'Thủ tục bàn giao',
      render: (r) => {
        const subId = r.subjectId || r.subject?.id;
        const h = (handoverQ.data ?? []).find((x) => x.owner.id === subId);
        if (h) {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDetail(r);
                setIsHandoverExpanded(true);
              }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Bấm xem chi tiết & checklist bàn giao"
            >
              {h.status === 'CLOSED' ? (
                <>
                  <Check className="h-3 w-3 text-muted-foreground" />
                  <span>Đã hoàn tất</span>
                </>
              ) : (
                <>
                  <Clock4 className="h-3 w-3 text-muted-foreground" />
                  <span>Tiến độ {h.done}/{h.total}</span>
                </>
              )}
            </button>
          );
        }
        if (r.type === 'RESIGNATION') {
          return (
            <span className="text-xs text-muted-foreground">
              {r.status === 'PENDING' ? 'Chờ duyệt' : 'Chưa tạo'}
            </span>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              r.status === 'APPROVED'
                ? 'bg-foreground/70'
                : r.status === 'PENDING'
                ? 'bg-amber-600'
                : 'bg-destructive'
            }`}
          />
          {r.status === 'PENDING' ? 'Chờ duyệt' : r.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
        </span>
      ),
    },
    {
      key: 'decider',
      header: 'Người duyệt',
      render: (r) => <span className="text-xs text-muted-foreground">{r.decider?.fullName ?? '—'}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Biến động nhân sự"
        description="Quản lý các quyết định thuyên chuyển, điều động, bãi nhiệm, kỷ luật, thôi việc và nâng ngạch lương."
        actions={
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Tạo quyết định
          </Button>
        }
      />

      {isManager ? (
        <div className="no-print mb-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setActionSubTab('mine')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              actionSubTab === 'mine'
                ? 'bg-muted text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Liên quan đến tôi
          </button>
          <button
            type="button"
            onClick={() => setActionSubTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              actionSubTab === 'all'
                ? 'bg-muted text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Toàn công ty
          </button>
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
                {
                  label: 'Xem chi tiết & Thủ tục bàn giao',
                  icon: Eye,
                  onSelect: () => {
                    setDetail(r);
                    setIsHandoverExpanded(true);
                  },
                },
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
          </div>

      {/* Modal chi tiết đề xuất & Thủ tục bàn giao tích hợp */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={`Chi tiết: ${detail ? ACTION_TYPE_LABEL[detail.type] : ''}`} size="lg">
        {detail ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2 bg-muted/20 p-3.5 rounded-lg border border-border/60">
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
                  <dd className="font-medium text-foreground text-xs mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>

            {/* PHẦN MỞ RỘNG: THỦ TỤC BÀN GIAO CÔNG VIỆC & THU HỒI TÀI SẢN */}
            <div className="pt-2 border-t border-border/70">
              {(() => {
                const subId = detail.subjectId || detail.subject?.id;
                const handover = (handoverQ.data ?? []).find(
                  (h) => h.owner.id === subId || (detail.subject?.fullName && h.owner.fullName === detail.subject.fullName)
                );

                return (
                  <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
                    {/* Thanh tiêu đề có nút bấm Mở rộng / Thu gọn */}
                    <button
                      type="button"
                      onClick={() => setIsHandoverExpanded(!isHandoverExpanded)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-xs text-foreground">
                          Thủ tục bàn giao công việc & Thu hồi tài sản
                        </span>
                        {handover ? (
                          <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                            {handover.status === 'CLOSED' ? 'Đã hoàn tất' : `${handover.done}/${handover.total} mục`}
                          </span>
                        ) : detail.type === 'RESIGNATION' && detail.status === 'PENDING' ? (
                          <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                            Chờ duyệt quyết định
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{isHandoverExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isHandoverExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Nội dung checklist khi mở rộng */}
                    {isHandoverExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-border space-y-2.5 bg-muted/10">
                        {handover ? (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground py-1">
                              <span>
                                Nhân sự: <strong className="text-foreground font-medium">{handover.owner.fullName}</strong>
                                {handover.leavingDate ? ` · Ngày nghỉ việc: ${formatDate(handover.leavingDate)}` : ''}
                              </span>
                              <span>
                                Trạng thái: {handover.status === 'CLOSED' ? 'Đã đóng bàn giao' : 'Đang xử lý'}
                              </span>
                            </div>

                            <ul className="space-y-1.5">
                              {handover.items.map((item) => {
                                const done = item.status === 'DONE';
                                const canTick = isManager || handover.owner.id === meId;
                                return (
                                  <li
                                    key={item.id}
                                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs"
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      {done ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground/70" />
                                      ) : (
                                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      )}
                                      <span
                                        className={
                                          done
                                            ? 'line-through text-muted-foreground'
                                            : 'text-foreground'
                                        }
                                      >
                                        {item.title}
                                      </span>
                                      {item.title.toLowerCase().includes('tài sản') ? (
                                        <Link
                                          href="/assets"
                                          target="_blank"
                                          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground hover:underline shrink-0 ml-1.5"
                                        >
                                          Kho tài sản <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                      ) : null}
                                    </div>
                                    {canTick && handover.status === 'OPEN' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          toggleHandoverItem.mutate({
                                            id: handover.id,
                                            itemId: item.id,
                                            done: !done,
                                          })
                                        }
                                        className="h-7 text-xs px-2 shrink-0"
                                      >
                                        {done ? 'Hủy' : 'Xác nhận'}
                                      </Button>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>

                            {isManager && handover.status === 'OPEN' ? (
                              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60">
                                <span className="text-xs text-muted-foreground">
                                  {handover.done < handover.total
                                    ? 'Cần xác nhận đủ tất cả các mục để đóng thủ tục.'
                                    : 'Đã hoàn tất tất cả các mục.'}
                                </span>
                                <Button
                                  size="sm"
                                  disabled={handover.done < handover.total || closeHandover.isPending}
                                  onClick={() => closeHandover.mutate(handover.id)}
                                  className="gap-1.5 h-7 text-xs"
                                >
                                  <Lock className="h-3.5 w-3.5" /> Hoàn tất bàn giao
                                </Button>
                              </div>
                            ) : null}
                          </>
                        ) : detail.type === 'RESIGNATION' && detail.status === 'PENDING' ? (
                          <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border border-border/60 flex items-start gap-2">
                            <Clock4 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span>
                              Quyết định thôi việc này đang chờ duyệt. Sau khi lãnh đạo phê duyệt, hệ thống sẽ tự động tạo checklist bàn giao và thu hồi tài sản.
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/50">
                            Quyết định này không có thủ tục thôi việc bắt buộc. Nếu cần thu hồi hoặc cấp phát thiết bị, vui lòng thực hiện tại trang <Link href="/assets" className="underline hover:text-foreground">Tài sản & Thiết bị</Link>.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal tạo đề xuất / quyết định biến động nhân sự */}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Tạo Quyết định / Đề xuất Biến động Nhân sự"
        size="lg"
        description="Ban hành quyết định Thuyên chuyển/Điều động · Kỷ luật/Bãi nhiệm · Thôi việc · Nâng ngạch bậc · Khen thưởng liên thông với hồ sơ nhân sự."
      >
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Loại quyết định / đề xuất *</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="TRANSFER">Thuyên chuyển · Điều động · Luân chuyển phòng ban</option>
              <option value="DISCIPLINE">Kỷ luật · Bãi nhiệm · Cách chức · Cảnh cáo</option>
              <option value="RESIGNATION">Thôi việc · Nghỉ hưu · Miễn nhiệm chức vụ</option>
              <option value="SALARY_ADJUST">Điều chỉnh lương · Nâng ngạch bậc</option>
              <option value="AWARD">Khen thưởng · Biểu dương thành tích</option>
            </Select>
          </div>

          {form.type === 'DISCIPLINE' ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Hình thức kỷ luật / bãi nhiệm cụ thể *</Label>
              <Select
                value={form.subType}
                onChange={(e) => setForm({ ...form, subType: e.target.value })}
              >
                <option value="BÃI NHIỆM">Bãi nhiệm chức vụ / Cách chức</option>
                <option value="CẢNH CÁO">Cảnh cáo toàn đơn vị</option>
                <option value="KHIỂN TRÁCH">Khiển trách bằng văn bản</option>
                <option value="KHÁC">Hình thức kỷ luật khác</option>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nhân sự chịu tác động quyết định *</Label>
            <Select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">— Chọn nhân viên —</option>
              {((employeesQ.data ?? []) as Array<{ id: string; fullName: string; employeeCode: string | null }>).map((e2) => (
                <option key={e2.id} value={e2.id}>{e2.fullName} {e2.employeeCode ? `(${e2.employeeCode})` : ''}</option>
              ))}
            </Select>
          </div>

          {selectedSubject ? (
            <div className="sm:col-span-2 text-xs bg-muted/40 p-2.5 rounded-md border border-border/60 text-muted-foreground flex items-center justify-between">
              <span>Đơn vị công tác hiện tại:</span>
              <span className="font-bold text-foreground">{selectedSubject.orgUnit?.name ?? 'Chưa phân bổ phòng ban'}</span>
            </div>
          ) : null}

          {form.type === 'TRANSFER' ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Đơn vị mới (chuyển đến / tiếp nhận) *</Label>
              <Select required value={form.newOrgUnitId} onChange={(e) => setForm({ ...form, newOrgUnitId: e.target.value })}>
                <option value="">— Chọn đơn vị / phòng ban tiếp nhận —</option>
                {(orgUnitsQ.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </Select>
            </div>
          ) : null}

          {form.type === 'RESIGNATION' ? (
            <div className="sm:col-span-2 text-xs bg-muted/40 text-foreground p-3 rounded-md border border-border">
              💡 <strong>Lưu ý nghiệp vụ:</strong> Khi quyết định thôi việc được duyệt, hệ thống sẽ <strong>tự động kích hoạt Thủ tục bàn giao 5 bước</strong> (công việc, tài sản, tài khoản, quyết toán) và liên thông với phân hệ Thu hồi thiết bị.
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Ngày hiệu lực áp dụng</Label>
            <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
          </div>

          {form.type === 'SALARY_ADJUST' ? (
            <div className="space-y-1.5">
              <Label>Mức lương mới (VND) *</Label>
              <Input required type="number" min={0} value={form.newSalary} onChange={(e) => setForm({ ...form, newSalary: e.target.value })} />
            </div>
          ) : null}

          {form.type === 'AWARD' || form.type === 'DISCIPLINE' ? (
            <div className="space-y-1.5">
              <Label>Mức thưởng / khấu trừ (VND)</Label>
              <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          ) : null}

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Lý do / căn cứ ban hành quyết định *</Label>
            <Textarea
              required
              placeholder="VD: Căn cứ nhu cầu nhân lực / Quyết định kỷ luật số 12... / Theo đơn xin thôi việc"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div className="col-span-full flex justify-end gap-2 pt-2 border-t">
            <ModalFooterActions onCancel={() => setOpen(false)} pending={create.isPending} confirmLabel="Ban hành / Gửi đề xuất" />
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
