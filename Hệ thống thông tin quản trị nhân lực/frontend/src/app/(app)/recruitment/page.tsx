'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Check, Eye, Pencil, Plus, Users, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { CANDIDATE_STAGE_LABEL, REQUISITION_STATUS_LABEL } from '@/lib/hr';
import { Badge, Button, Input, Label, Select, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { StarRating } from '@/components/ui/star-rating';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface RequisitionRow {
  id: string; title: string; position: string; headcount: number; reason: string | null;
  status: keyof typeof REQUISITION_STATUS_LABEL;
  requester?: { fullName: string };
  _count?: { candidates: number };
}
interface CandidateRow {
  id: string; fullName: string; email: string | null; phone: string | null;
  source: string | null; stage: keyof typeof CANDIDATE_STAGE_LABEL;
  rating: number | null; notes: string | null;
  requisition?: { id: string; title: string } | null;
}

const REQ_TONE: Record<string, string> = {
  DRAFT: 'bg-secondary',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  CLOSED: 'bg-secondary',
};

/** QP1 — Tuyển dụng: phiếu đề xuất → duyệt → danh sách ứng viên đa kênh. */
export default function RecruitmentPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  const [tab, setTab] = useState<'candidates' | 'requisitions'>('candidates');
  const [reqOpen, setReqOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);
  const [reqForm, setReqForm] = useState({ title: '', position: '', headcount: '1', reason: '' });
  const [candForm, setCandForm] = useState({ fullName: '', email: '', phone: '', source: '', requisitionId: '', notes: '' });
  // Mục 6 — cập nhật ứng viên kèm đánh giá sao tương tác
  const [editing, setEditing] = useState<CandidateRow | null>(null);
  const [editReadOnly, setEditReadOnly] = useState(false);
  const [editForm, setEditForm] = useState<{ stage: string; rating: number | null; notes: string }>({ stage: 'NEW', rating: null, notes: '' });

  const reqQ = useQuery({
    queryKey: ['requisitions'],
    queryFn: async () => (await api.get<RequisitionRow[]>('/recruitment/requisitions')).data,
  });
  const candQ = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => (await api.get<CandidateRow[]>('/recruitment/candidates')).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['requisitions'] });
    qc.invalidateQueries({ queryKey: ['candidates'] });
  };

  const createReq = useMutation({
    mutationFn: async () => api.post('/recruitment/requisitions', {
      title: reqForm.title, position: reqForm.position, headcount: Number(reqForm.headcount), reason: reqForm.reason || undefined,
    }),
    onSuccess: () => { toast('Đã gửi phiếu đề xuất tuyển dụng — chờ thẩm định', 'success'); setReqOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const decideReq = useMutation({
    mutationFn: async (vars: { id: string; approve: boolean }) =>
      api.post(`/recruitment/requisitions/${vars.id}/${vars.approve ? 'approve' : 'reject'}`, {}),
    onSuccess: (_, v) => { toast(v.approve ? 'Đã duyệt chỉ tiêu — mở kế hoạch tuyển' : 'Đã từ chối phiếu', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const closeReq = useMutation({
    mutationFn: async (id: string) => api.post(`/recruitment/requisitions/${id}/close`, {}),
    onSuccess: () => { toast('Đã đóng phiếu tuyển', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const createCand = useMutation({
    mutationFn: async () => api.post('/recruitment/candidates', {
      fullName: candForm.fullName,
      email: candForm.email || undefined,
      phone: candForm.phone || undefined,
      source: candForm.source || undefined,
      requisitionId: candForm.requisitionId || undefined,
      notes: candForm.notes || undefined,
    }),
    onSuccess: () => { toast('Đã thêm ứng viên mới', 'success'); setCandOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const moveStage = useMutation({
    mutationFn: async (vars: { id: string; stage: string }) => api.patch(`/recruitment/candidates/${vars.id}`, { stage: vars.stage }),
    onSuccess: () => invalidate(),
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const updateCandidate = useMutation({
    mutationFn: async () => api.patch(`/recruitment/candidates/${editing!.id}`, {
      stage: editForm.stage,
      rating: editForm.rating ?? undefined,
      notes: editForm.notes || undefined,
    }),
    onSuccess: () => { toast('Đã cập nhật ứng viên', 'success'); setEditing(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const reqColumns: DataColumn<RequisitionRow>[] = [
    { key: 'title', header: 'Phiếu đề xuất', sortable: true, render: (r) => (
      <span>
        <span className="block font-medium">{r.title}</span>
        <span className="block text-xs text-muted-foreground">{r.position} · {r.headcount} suất · {r.requester?.fullName ?? ''}</span>
      </span>
    ) },
    { key: 'status', header: 'Trạng thái', sortable: true, render: (r) => <Badge className={REQ_TONE[r.status]}>{REQUISITION_STATUS_LABEL[r.status] ?? r.status}</Badge> },
    { key: 'candidates', header: 'Ứng viên', render: (r) => r._count?.candidates ?? 0 },
  ];

  const candColumns: DataColumn<CandidateRow>[] = [
    { key: 'fullName', header: 'Ứng viên', sortable: true, render: (r) => (
      <span>
        <span className="block font-medium">{r.fullName}</span>
        <span className="block text-xs text-muted-foreground">{r.email ?? ''} {r.phone ? `· ${r.phone}` : ''}</span>
      </span>
    ) },
    { key: 'source', header: 'Kênh', sortable: true, render: (r) => r.source ?? '—' },
    { key: 'requisition', header: 'Chỉ tiêu', render: (r) => r.requisition?.title ?? '—' },
    { key: 'rating', header: 'Điểm phỏng vấn', sortable: true, render: (r) => <StarRating value={r.rating} readOnly size="sm" /> },
    {
      key: 'stage', header: 'Giai đoạn', sortable: true,
      render: (r) => (
        <>
          {/* Mục 6 — bản in chỉ in CHỮ, không in control web (dropdown) */}
          <span className="no-print">
            <Select
              value={r.stage}
              disabled={r.stage === 'HIRED' || r.stage === 'REJECTED'}
              onChange={(e) => moveStage.mutate({ id: r.id, stage: e.target.value })}
              className="h-8 w-auto text-xs"
              aria-label={`Chuyển giai đoạn ${r.fullName}`}
            >
              {Object.entries(CANDIDATE_STAGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </span>
          <span className="print-only">{CANDIDATE_STAGE_LABEL[r.stage] ?? r.stage}</span>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Tuyển dụng"
        description="Từ phiếu đề xuất của trưởng nhóm → thẩm định & duyệt → danh sách ứng viên từ đa kênh."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setReqOpen(true)}><Plus className="h-4 w-4" /> Đề xuất tuyển</Button>
            {isHr ? <Button size="sm" variant="outline" onClick={() => setCandOpen(true)}><Users className="h-4 w-4" /> Thêm ứng viên</Button> : null}
          </div>
        }
      />

      <div className="no-print mb-3 flex gap-2">
        <Button size="sm" variant={tab === 'candidates' ? 'default' : 'outline'} onClick={() => setTab('candidates')}>Danh sách ứng viên</Button>
        <Button size="sm" variant={tab === 'requisitions' ? 'default' : 'outline'} onClick={() => setTab('requisitions')}>Phiếu đề xuất</Button>
      </div>

      <div className="print-area">
        <PrintFrame title="BÁO CÁO TUYỂN DỤNG" subtitle={tab === 'candidates' ? 'Danh sách ứng viên' : 'Phiếu đề xuất tuyển dụng'} />
        {tab === 'candidates' ? (
          candQ.isError ? <ErrorState message={errorMessage(candQ.error)} onRetry={() => candQ.refetch()} /> : (
            <DataTable
              columns={candColumns}
              rows={candQ.data ?? []}
              rowKey={(r) => r.id}
              loading={candQ.isLoading}
              exportFilename="danh-sach-ung-vien"
              printLabel="In danh sách ứng viên"
              searchFields={(r) => [r.fullName, r.email ?? '', r.source ?? '', r.requisition?.title ?? '']}
              filters={[
                { key: 'stage', label: 'Giai đoạn', value: (r) => r.stage, options: Object.entries(CANDIDATE_STAGE_LABEL).map(([value, label]) => ({ value, label })) },
              ]}
              emptyTitle="Chưa có ứng viên nào"
              emptyHint="Thêm ứng viên từ các kênh tuyển dụng: LinkedIn, VietnamWorks, giới thiệu nội bộ…"
              actions={(r): RowActionItem[] => (isHr ? [
                {
                  label: 'Cập nhật ứng viên',
                  icon: Pencil,
                  onSelect: () => { setEditing(r); setEditReadOnly(false); setEditForm({ stage: r.stage, rating: r.rating ?? null, notes: r.notes ?? '' }); },
                },
              ] : [
                // Người thường: xem chi tiết hồ sơ ứng viên (chỉ đọc) — kebab không trống
                {
                  label: 'Xem chi tiết ứng viên',
                  icon: Eye,
                  onSelect: () => { setEditing(r); setEditReadOnly(true); setEditForm({ stage: r.stage, rating: r.rating ?? null, notes: r.notes ?? '' }); },
                },
              ])}
            />
          )
        ) : (
          reqQ.isError ? <ErrorState message={errorMessage(reqQ.error)} onRetry={() => reqQ.refetch()} /> : (
            <DataTable
              columns={reqColumns}
              rows={reqQ.data ?? []}
              rowKey={(r) => r.id}
              loading={reqQ.isLoading}
              exportFilename="phieu-tuyen-dung"
              printLabel="In phiếu đề xuất tuyển dụng"
              searchFields={(r) => [r.title, r.position, r.requester?.fullName ?? '']}
              filters={[{ key: 'status', label: 'Trạng thái', value: (r) => r.status, options: Object.entries(REQUISITION_STATUS_LABEL).map(([value, label]) => ({ value, label })) }]}
              emptyTitle="Chưa có phiếu đề xuất nào"
              actions={(r): RowActionItem[] => {
                if (!isHr) return [];
                if (r.status === 'PENDING_REVIEW') {
                  return [
                    { label: 'Duyệt chỉ tiêu', icon: Check, onSelect: () => decideReq.mutate({ id: r.id, approve: true }) },
                    { label: 'Từ chối phiếu', icon: X, danger: true, onSelect: () => decideReq.mutate({ id: r.id, approve: false }) },
                  ];
                }
                if (r.status === 'APPROVED') {
                  return [{ label: 'Đóng phiếu (đủ chỉ tiêu)', icon: X, onSelect: () => closeReq.mutate(r.id) }];
                }
                return [];
              }}
            />
          )
        )}
        <PrintSignatureBlock leftTitle="Người lập báo cáo" middleTitle="Trưởng phòng HC-NS" rightTitle="Giám đốc điều hành" />
      </div>

      <Modal open={reqOpen} onOpenChange={setReqOpen} title="Lập phiếu đề xuất tuyển dụng" description="UC04 — phiếu sẽ chuyển sang chờ thẩm định của bộ phận nhân sự.">
        <form onSubmit={(e) => { e.preventDefault(); createReq.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label>Tiêu đề *</Label>
            <Input required value={reqForm.title} onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })} placeholder="Tuyển 2 Lập trình viên Flutter" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Vị trí *</Label>
              <Input required value={reqForm.position} onChange={(e) => setReqForm({ ...reqForm, position: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Số lượng *</Label>
              <Input required type="number" min={1} value={reqForm.headcount} onChange={(e) => setReqForm({ ...reqForm, headcount: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Lý do tuyển</Label>
            <Textarea value={reqForm.reason} onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setReqOpen(false)} pending={createReq.isPending} confirmLabel="Gửi phiếu" />
          </div>
        </form>
      </Modal>

      <Modal open={candOpen} onOpenChange={setCandOpen} title="Thêm ứng viên" description="Hồ sơ trực tuyến và trực tiếp đều nhập chung một nơi.">
        <form onSubmit={(e) => { e.preventDefault(); createCand.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Họ tên *</Label>
            <Input required value={candForm.fullName} onChange={(e) => setCandForm({ ...candForm, fullName: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label>
            <Input type="email" value={candForm.email} onChange={(e) => setCandForm({ ...candForm, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Điện thoại</Label>
            <Input value={candForm.phone} onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Kênh tuyển</Label>
            <Input value={candForm.source} onChange={(e) => setCandForm({ ...candForm, source: e.target.value })} placeholder="LinkedIn / VietnamWorks / Giới thiệu…" /></div>
          <div className="space-y-1.5"><Label>Chỉ tiêu</Label>
            <Select value={candForm.requisitionId} onChange={(e) => setCandForm({ ...candForm, requisitionId: e.target.value })}>
              <option value="">— Không gắn —</option>
              {(reqQ.data ?? []).filter((r) => r.status === 'APPROVED').map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </Select></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setCandOpen(false)} pending={createCand.isPending} confirmLabel="Thêm" />
          </div>
        </form>
      </Modal>

      {/* Mục 6 — cập nhật ứng viên: giai đoạn + đánh giá sao tương tác + ghi chú */}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}
        title={`${editReadOnly ? 'Chi tiết ứng viên' : 'Cập nhật ứng viên'}: ${editing?.fullName ?? ''}`}>
        <form onSubmit={(e) => { e.preventDefault(); if (!editReadOnly) updateCandidate.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Giai đoạn tuyển *</Label>
            <Select disabled={editReadOnly} value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}>
              {Object.entries(CANDIDATE_STAGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Điểm phỏng vấn</Label>
            <StarRating value={editForm.rating} onChange={editReadOnly ? undefined : (v) => setEditForm({ ...editForm, rating: v })} />
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú đánh giá</Label>
            <Textarea disabled={editReadOnly} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Nhận xét chuyên môn, thái độ, kết quả vòng phỏng vấn…" />
          </div>
          <div className="flex justify-end gap-2">
            {editReadOnly ? (
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Đóng</Button>
            ) : (
              <ModalFooterActions onCancel={() => setEditing(null)} pending={updateCandidate.isPending} confirmLabel="Lưu" />
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}
