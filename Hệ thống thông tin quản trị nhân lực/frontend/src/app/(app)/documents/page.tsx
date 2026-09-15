'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Download, Eye, FileDown, FileText, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { DOCUMENT_CATEGORY_LABEL } from '@/lib/hr';
import { Button, Input, Label, Select, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';
import { MarkdownViewer } from '@/components/common/markdown-viewer';

interface DocumentRow {
  id: string; title: string;
  category: keyof typeof DOCUMENT_CATEGORY_LABEL;
  processArea: string | null; version: string; description: string | null;
  contentMd: string | null;
  fileUrl: string | null; fileName: string | null; fileSize: number | null;
  tags: string[]; updatedAt: string;
  uploader?: { fullName: string };
}

/** Tải nội dung markdown về máy dưới dạng tập tin .md (khi không có đính kèm). */
function downloadContentMd(doc: DocumentRow) {
  const blob = new Blob([doc.contentMd ?? ''], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `${doc.title}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Mục 8 — Kho tài liệu quy trình nhân sự: chính sách, biểu mẫu, quyết định, quy trình. */
export default function DocumentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DocumentRow | null>(null);
  const [form, setForm] = useState({ title: '', category: 'POLICY', processArea: '', version: '1.0', description: '', tags: '' });
  const [file, setFile] = useState<{ name: string; mimeType: string; sizeBytes: number; dataBase64: string } | null>(null);

  const q = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<DocumentRow[]>('/documents')).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['documents'] });

  const create = useMutation({
    mutationFn: async () => api.post('/documents', {
      title: form.title,
      category: form.category,
      processArea: form.processArea || undefined,
      version: form.version || undefined,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      file: file ?? undefined,
    }),
    onSuccess: () => { toast('Đã thêm tài liệu', 'success'); setOpen(false); setFile(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => { toast('Đã xóa tài liệu', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  async function pickFile(f: File | null) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast('Tập tin vượt quá 8MB', 'error'); return; }
    const buf = await f.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    setFile({ name: f.name, mimeType: f.type || 'application/octet-stream', sizeBytes: f.size, dataBase64: btoa(binary) });
  }

  const columns: DataColumn<DocumentRow>[] = [
    {
      key: 'title',
      header: 'Tài liệu',
      sortable: true,
      render: (r) => (
        <span>
          <span className="flex items-center gap-1.5 font-medium">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            {r.title}
          </span>
          <span className="block text-xs text-muted-foreground">
            Phiên bản {r.version} · {r.uploader?.fullName ?? ''} · {formatDate(r.updatedAt)}
          </span>
        </span>
      ),
      exportValue: (r) => `${r.title} (v${r.version})`,
    },
    {
      key: 'category',
      header: 'Danh mục',
      sortable: true,
      render: (r) => <span className="text-xs font-semibold text-foreground">{DOCUMENT_CATEGORY_LABEL[r.category] ?? r.category}</span>,
      exportValue: (r) => DOCUMENT_CATEGORY_LABEL[r.category] ?? r.category,
    },
    { key: 'processArea', header: 'Quy trình', sortable: true, render: (r) => r.processArea ?? '—' },
    {
      key: 'tags',
      header: 'Thẻ',
      noPrint: true,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.tags.length > 0 ? r.tags.join(', ') : '—'}
        </span>
      ),
    },
    {
      key: 'file',
      header: 'Xem / Tải',
      noPrint: true,
      render: (r) =>
        r.fileUrl ? (
          <a href={r.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <Download className="h-4 w-4" /> Tải xuống
          </a>
        ) : r.contentMd ? (
          <button type="button" onClick={() => setDetail(r)} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <FileText className="h-4 w-4" /> Nội dung số
          </button>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Kho Tài liệu Nhân sự"
        description="Lưu trữ chính sách, quy chế, biểu mẫu và quy trình quản trị nhân sự toàn công ty."
        actions={
          isHr ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Thêm tài liệu
            </Button>
          ) : null
        }
      />

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
          <span>
            Bạn cần tạo hoặc duyệt <strong>Quyết định biến động</strong> (Thuyên chuyển/Điều động, Bãi nhiệm/Kỷ luật, Thôi việc & Bàn giao)?
          </span>
        </div>
        <Link
          href="/personnel"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
        >
          Đi tới Quyết định & Biến động →
        </Link>
      </div>

      <div className="print-area">
        <PrintFrame title="DANH MỤC TÀI LIỆU QUẢN TRỊ NHÂN LỰC" />
        {q.isError ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={q.data ?? []}
            rowKey={(r) => r.id}
            loading={q.isLoading}
            exportFilename="danh-muc-tai-lieu"
            printLabel="In danh mục"
            searchFields={(r) => [r.title, r.description ?? '', r.processArea ?? '', r.tags.join(' ')]}
            filters={[
              {
                key: 'category',
                label: 'Danh mục',
                value: (r) => r.category,
                options: Object.entries(DOCUMENT_CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
              },
            ]}
            emptyTitle="Chưa có tài liệu nào"
            emptyHint="Thêm chính sách, biểu mẫu, quy trình để toàn công ty dùng chung một nguồn."
            actions={(r): RowActionItem[] => [
              { label: 'Xem chi tiết tài liệu', icon: Eye, onSelect: () => setDetail(r) },
              ...(r.fileUrl ? [{ label: 'Tải tập tin đính kèm', icon: Download, onSelect: () => window.open(r.fileUrl!, '_blank') }] : []),
              ...(r.contentMd ? [{ label: 'Tải nội dung (.md)', icon: FileDown, onSelect: () => downloadContentMd(r) }] : []),
              ...(isHr ? ['separator' as const, { label: 'Xóa tài liệu', icon: Trash2, danger: true, onSelect: () => remove.mutate(r.id) }] : []),
            ]}
          />
        )}
        <PrintSignatureBlock leftTitle="Người lập danh mục" middleTitle="Trưởng Ban Nhân sự" rightTitle="Giám đốc điều hành" />
      </div>

      {/* Modal chi tiết tài liệu — mô tả, phân loại, thẻ, tập tin */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.title ?? ''} size="lg">
        {detail ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Danh mục</dt>
              <dd className="font-medium">{DOCUMENT_CATEGORY_LABEL[detail.category] ?? detail.category}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Thuộc quy trình</dt>
              <dd className="font-medium">{detail.processArea ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phiên bản</dt>
              <dd className="font-medium">{detail.version}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Người đăng</dt>
              <dd className="font-medium">{detail.uploader?.fullName ?? '—'} · {formatDate(detail.updatedAt)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mô tả</dt>
              <dd className="font-medium">{detail.description ?? '—'}</dd>
            </div>
            {detail.tags.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Thẻ</dt>
                <dd className="font-medium">{detail.tags.join(', ')}</dd>
              </div>
            ) : null}
            {detail.fileUrl ? (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tập tin đính kèm</dt>
                <dd>
                  <a href={detail.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Download className="h-4 w-4" /> {detail.fileName} ({Math.ceil((detail.fileSize ?? 0) / 1024)} KB)
                  </a>
                </dd>
              </div>
            ) : null}
            {detail.contentMd ? (
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nội dung tài liệu</dt>
                  <Button size="sm" variant="outline" onClick={() => downloadContentMd(detail)}>
                    <FileDown className="h-4 w-4" /> Tải nội dung (.md)
                  </Button>
                </div>
                <dd className="rounded-md border p-3">
                  <MarkdownViewer content={detail.contentMd} />
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </Modal>

      <Modal open={open} onOpenChange={setOpen} title="Thêm tài liệu" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Tiêu đề *</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Danh mục *</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(DOCUMENT_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select></div>
          <div className="space-y-1.5"><Label>Thuộc quy trình</Label>
            <Input value={form.processArea} onChange={(e) => setForm({ ...form, processArea: e.target.value })} placeholder="tuyển dụng / chấm công / lương…" /></div>
          <div className="space-y-1.5"><Label>Phiên bản</Label>
            <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Thẻ (phân tách bằng dấu phẩy)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="nghỉ-phép, biểu-mẫu" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Mô tả</Label>
            <Textarea className="min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tập tin đính kèm (PDF/DOC/XLS/ảnh — tối đa 8MB)</Label>
            <input ref={fileRef} type="file" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm hover:file:bg-secondary/80"
              onChange={(e) => void pickFile(e.target.files?.[0] ?? null)} />
            {file ? <p className="text-xs text-muted-foreground">Đã chọn: {file.name} ({Math.ceil(file.sizeBytes / 1024)} KB)</p> : null}
          </div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setOpen(false)} pending={create.isPending} confirmLabel="Thêm tài liệu" />
          </div>
        </form>
      </Modal>
    </>
  );
}
