'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Eye, Network, Pencil, Plus, Table2, Trash2, TreePine } from 'lucide-react';
import type { RowActionItem } from '@/components/ui/data-table';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Input, Label, Select, Skeleton } from '@/components/ui/primitives';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintButton, PrintFrame } from '@/components/ui/print';

interface TreeNode {
  id: string; name: string; code: string; parentId: string | null;
  sortOrder: number; memberCount: number; children: TreeNode[];
}
interface EmployeeLite {
  id: string; fullName: string; employeeCode: string | null;
  jobTitle: string | null; orgUnit?: { name: string } | null;
}

type ViewMode = 'tree' | 'chart' | 'table';

/**
 * KC03 — Quản lý cây cơ cấu tổ chức (Mục 7):
 * - Đủ nghiệp vụ: THÊM / SỬA / XÓA / XEM CHI TIẾT từng đơn vị;
 * - Ba chế độ hiển thị: Cây mở rộng, Sơ đồ tổ chức, Bảng quản lý;
 * - Nguyên lý "cây tổ chức là dữ liệu cấu hình" — không cần lập trình viên.
 */
export default function AdminOrgUnitsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [view, setView] = useState<ViewMode>('tree');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: '', code: '' });
  const [editing, setEditing] = useState<TreeNode | null>(null);
  const [editForm, setEditForm] = useState({ name: '', parentId: '' });
  const [deleting, setDeleting] = useState<TreeNode | null>(null);
  const [detail, setDetail] = useState<TreeNode | null>(null);

  const q = useQuery({
    queryKey: ['org-tree'],
    queryFn: async () => (await api.get<TreeNode[]>('/org-units/tree')).data,
  });
  const employeesQ = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<EmployeeLite[]>('/employees')).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['org-tree'] });

  const create = useMutation({
    mutationFn: async (vars: { name: string; code: string; parentId?: string }) => api.post('/org-units', vars),
    onSuccess: () => { toast('Đã thêm đơn vị', 'success'); setAddForm({ name: '', code: '' }); setAddingTo(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const update = useMutation({
    mutationFn: async (vars: { id: string; name: string; parentId?: string | null }) =>
      api.patch(`/org-units/${vars.id}`, { name: vars.name, parentId: vars.parentId || null }),
    onSuccess: () => { toast('Đã cập nhật đơn vị', 'success'); setEditing(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/org-units/${id}`),
    onSuccess: () => { toast('Đã xóa đơn vị', 'success'); setDeleting(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  /** Duyệt phẳng toàn bộ cây cho chế độ bảng + select chọn đơn vị cha. */
  const flat = useMemo(() => {
    const out: { node: TreeNode; depth: number }[] = [];
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const n of nodes) {
        out.push({ node: n, depth });
        walk(n.children, depth + 1);
      }
    };
    walk(q.data ?? [], 0);
    return out;
  }, [q.data]);

  const detailMembers = useMemo(() => {
    if (!detail) return [];
    return ((employeesQ.data ?? []) as EmployeeLite[]).filter((e) => e.orgUnit?.name === detail.name);
  }, [detail, employeesQ.data]);

  function toggle(id: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  /** Danh sách hành động dạng kebab menu — dùng cho chế độ Bảng (Mục 8). */
  function nodeActionItems(node: TreeNode): RowActionItem[] {
    return [
      { label: 'Thêm đơn vị con', icon: Plus, onSelect: () => { setAddingTo(addingTo === node.id ? null : node.id); setAddForm({ name: '', code: '' }); } },
      { label: 'Sửa tên / di chuyển', icon: Pencil, onSelect: () => { setEditing(node); setEditForm({ name: node.name, parentId: node.parentId ?? '' }); } },
      { label: 'Xem chi tiết', icon: Eye, onSelect: () => setDetail(node) },
      'separator',
      { label: 'Xóa đơn vị', icon: Trash2, danger: true, onSelect: () => setDeleting(node) },
    ];
  }

  /** Hàng nút icon inline — dùng cho chế độ Cây và Sơ đồ. */
  function nodeActions(node: TreeNode) {
    return (
      <span className="flex items-center gap-0.5">
        <button className="rounded p-1 text-primary hover:bg-primary/10" aria-label={`Thêm đơn vị con vào ${node.name}`}
          onClick={() => { setAddingTo(addingTo === node.id ? null : node.id); setAddForm({ name: '', code: '' }); }}>
          <Plus className="h-4 w-4" />
        </button>
        <button className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label={`Sửa ${node.name}`}
          onClick={() => { setEditing(node); setEditForm({ name: node.name, parentId: node.parentId ?? '' }); }}>
          <Pencil className="h-4 w-4" />
        </button>
        <button className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label={`Xem chi tiết ${node.name}`}
          onClick={() => setDetail(node)}>
          <Eye className="h-4 w-4" />
        </button>
        <button className="rounded p-1 text-destructive hover:bg-destructive/10" aria-label={`Xóa ${node.name}`}
          onClick={() => setDeleting(node)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
    );
  }

  /** Form thêm đơn vị con (inline trong chế độ cây). */
  function addFormInline(parentId: string) {
    return (
      <div className="mb-2 ml-8 flex flex-wrap items-end gap-2 rounded-md border bg-muted/40 p-card">
        <div className="space-y-1"><Label>Tên</Label>
          <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Mã</Label>
          <Input value={addForm.code} onChange={(e) => setAddForm({ ...addForm, code: e.target.value })} className="w-28" /></div>
        <Button size="sm" disabled={!addForm.name || !addForm.code || create.isPending}
          onClick={() => create.mutate({ ...addForm, parentId })}>
          Thêm
        </Button>
      </div>
    );
  }

  /** Chế độ 1 — Cây mở rộng. */
  function renderTreeNode(node: TreeNode, depth = 0): React.ReactNode {
    const isOpen = expanded.has(node.id) || depth === 0;
    return (
      <div key={node.id}>
        <div className="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent" style={{ paddingLeft: depth * 16 + 8 }}>
          <button onClick={() => toggle(node.id)} className="rounded p-0.5 hover:bg-muted" aria-label="Mở/đóng">
            <ChevronRight className={`h-4 w-4 transition-transform ${node.children.length && isOpen ? 'rotate-90' : ''} ${node.children.length ? '' : 'opacity-0'}`} />
          </button>
          <span className="text-sm font-medium">{node.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{node.code} · {node.memberCount} NV</span>
          <span className="ml-auto">{nodeActions(node)}</span>
        </div>
        {addingTo === node.id ? addFormInline(node.id) : null}
        {isOpen ? node.children.map((c) => renderTreeNode(c, depth + 1)) : null}
      </div>
    );
  }

  /**
   * Sơ đồ tổ chức — layout XẾP DỌC theo cấp, con tự xuống dòng bằng grid:
   * bề rộng luôn bó trong khung (không bao giờ bị khuyết khi xem web hay in A4).
   * `print` = true → bản in sạch không nút hành động (Mục 6).
   */
  function renderChartNode(node: TreeNode, print = false): React.ReactNode {
    return (
      <div key={node.id} className="flex w-full flex-col items-center">
        <div className={`rounded-lg border-2 border-primary/30 bg-card px-4 py-2 text-center ${print ? '' : 'z-content shadow-sm'}`}>
          <p className="text-sm font-semibold">{node.name}</p>
          <p className="text-xs text-muted-foreground">{node.code} · {node.memberCount} NV</p>
          {!print ? <div className="mt-1 flex justify-center">{nodeActions(node)}</div> : null}
        </div>
        {node.children.length > 0 ? (
          <>
            <div className="h-4 w-px bg-border" aria-hidden />
            <div className="grid w-full grid-cols-2 place-items-center gap-3 rounded-lg border border-dashed p-3 md:grid-cols-3 xl:grid-cols-4">
              {node.children.map((c) => renderChartNode(c, print))}
            </div>
          </>
        ) : null}
        {!print && addingTo === node.id ? addFormInline(node.id) : null}
      </div>
    );
  }

  /** Chế độ 3 — Bảng quản lý phẳng. */
  const tableColumns: DataColumn<{ node: TreeNode; depth: number }>[] = [
    { key: 'name', header: 'Đơn vị', sortable: true, sortValue: (r) => r.node.name,
      render: (r) => <span style={{ paddingLeft: r.depth * 16 }} className="font-medium">{r.depth > 0 ? '└ ' : ''}{r.node.name}</span> },
    { key: 'code', header: 'Mã', sortable: true, render: (r) => r.node.code },
    { key: 'memberCount', header: 'Số NV', sortable: true, render: (r) => r.node.memberCount },
    { key: 'parent', header: 'Đơn vị cha', render: (r) => flat.find((f) => f.node.id === r.node.parentId)?.node.name ?? '—' },
  ];

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;

  return (
    <>
      <PageHeader
        title="Cơ cấu tổ chức"
        description="Cây phòng ban là dữ liệu cấu hình — thêm, sửa, xóa, xem chi tiết ngay trên sơ đồ."
        actions={
          <>
            <div className="flex gap-1 rounded-md border bg-card p-1">
              <Button size="sm" variant={view === 'tree' ? 'secondary' : 'ghost'} onClick={() => setView('tree')}><TreePine className="h-4 w-4" /> Cây</Button>
              <Button size="sm" variant={view === 'chart' ? 'secondary' : 'ghost'} onClick={() => setView('chart')}><Network className="h-4 w-4" /> Sơ đồ</Button>
              <Button size="sm" variant={view === 'table' ? 'secondary' : 'ghost'} onClick={() => setView('table')}><Table2 className="h-4 w-4" /> Bảng</Button>
            </div>
            <PrintButton label="In sơ đồ" />
          </>
        }
      />

      <div className="print-area">
        <PrintFrame title="SƠ ĐỒ CƠ CẤU TỔ CHỨC" />

        {/* Mục 6 — bản in là TÀI LIỆU báo cáo: sơ đồ sạch (không nút bấm)
            + bảng tổng hợp; chế độ tương tác (Cây/Sơ đồ/Bảng) chỉ trên màn hình */}
        <div className="print-only">
          <div className="flex flex-col items-center gap-10 py-2">
            {(q.data ?? []).map((n) => renderChartNode(n, true))}
          </div>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr>
                <th>Đơn vị</th><th>Mã</th><th>Đơn vị cha</th><th>Số nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {flat.map(({ node, depth }) => (
                <tr key={node.id}>
                  <td>{depth > 0 ? `${'— '.repeat(depth)}${node.name}` : node.name}</td>
                  <td>{node.code}</td>
                  <td>{flat.find((f) => f.node.id === node.parentId)?.node.name ?? '—'}</td>
                  <td>{node.memberCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Card className="no-print">
          <CardContent>
            {view === 'tree' ? (
              <div className="py-1">{(q.data ?? []).map((n) => renderTreeNode(n))}</div>
            ) : view === 'chart' ? (
              // Sơ đồ xếp dọc theo cấp, con tự xuống dòng — không bao giờ
              // tràn ngang cả trên web lẫn bản in (Mục 6 + fix vỡ layout)
              <div className="w-full p-2">
                <div className="flex flex-col items-center gap-10">
                  {(q.data ?? []).map((n) => renderChartNode(n))}
                </div>
              </div>
            ) : (
              <DataTable
                columns={tableColumns}
                rows={flat}
                rowKey={(r) => r.node.id}
                searchFields={(r) => [r.node.name, r.node.code]}
                emptyTitle="Chưa có đơn vị nào"
                actions={(r) => nodeActionItems(r.node)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal sửa đơn vị */}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={`Sửa đơn vị: ${editing?.name ?? ''}`}>
        <form onSubmit={(e) => { e.preventDefault(); if (editing) update.mutate({ id: editing.id, name: editForm.name, parentId: editForm.parentId || null }); }} className="space-y-3">
          <div className="space-y-1.5"><Label>Tên đơn vị *</Label>
            <Input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Đơn vị cha</Label>
            <Select value={editForm.parentId} onChange={(e) => setEditForm({ ...editForm, parentId: e.target.value })}>
              <option value="">— Gốc (không có cha) —</option>
              {flat.filter((f) => f.node.id !== editing?.id).map((f) => (
                <option key={f.node.id} value={f.node.id}>{'— '.repeat(f.depth)}{f.node.name}</option>
              ))}
            </Select></div>
          <div className="flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setEditing(null)} pending={update.isPending} />
          </div>
        </form>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Xóa đơn vị: ${deleting?.name ?? ''}`} size="sm"
        description="Chỉ xóa được khi đơn vị không còn đơn vị con, nhân viên hay không gian nào gắn vào.">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>Hủy</Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>
            {remove.isPending ? 'Đang xóa…' : 'Xóa đơn vị'}
          </Button>
        </div>
      </Modal>

      {/* Modal chi tiết đơn vị */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.name ?? ''} size="lg"
        description={detail ? `Mã ${detail.code} · ${detail.memberCount} nhân viên` : undefined}>
        {detail ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs uppercase text-muted-foreground">Mã đơn vị</p><p className="font-medium">{detail.code}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Đơn vị cha</p>
                <p className="font-medium">{flat.find((f) => f.node.id === detail.parentId)?.node.name ?? '— (gốc)'}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Đơn vị con</p>
                <p className="font-medium">{detail.children.length}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Nhân viên hiện hữu</p>
                <p className="font-medium">{detail.memberCount}</p></div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nhân viên đang thuộc đơn vị</p>
              {detailMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có nhân viên nào.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {detailMembers.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="font-medium">{m.fullName}</span>
                      <span className="text-xs text-muted-foreground">{m.employeeCode ?? ''} {m.jobTitle ? `· ${m.jobTitle}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
