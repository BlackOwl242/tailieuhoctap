'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FolderTree,
  LayoutGrid,
  Network,
  Pencil,
  Plus,
  Table2,
  Trash2,
  TreePine,
  Users,
} from 'lucide-react';
import type { RowActionItem } from '@/components/ui/data-table';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Input, Label, Select, Skeleton } from '@/components/ui/primitives';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintExportDropdown, PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface TreeNode {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
  memberCount: number;
  children: TreeNode[];
}

interface EmployeeLite {
  id: string;
  fullName: string;
  employeeCode: string | null;
  jobTitle: string | null;
  orgUnit?: { name: string } | null;
}

type ViewMode = 'tree' | 'chart' | 'table';

/**
 * Thành phần vẽ Cây sơ đồ tổ chức phân cấp chuẩn trực quan
 */
function OrgChartBranch({
  node,
  depth,
  onAddChild,
  onEdit,
  onDetail,
  onDelete,
  print = false,
}: {
  node: TreeNode;
  depth: number;
  onAddChild: (node: TreeNode) => void;
  onEdit: (node: TreeNode) => void;
  onDetail: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  print?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  // Phân cấp viền và điểm nhấn thanh lịch
  const depthStyles = [
    'border-blue-600 bg-white text-slate-900 ring-2 ring-blue-500/20 shadow-md', // Ban Giám Đốc (Level 0)
    'border-emerald-500 bg-white text-slate-900 shadow-md', // Khối / Ban (Level 1)
    'border-amber-500 bg-white text-slate-900 shadow-sm', // Trung tâm / Phòng (Level 2)
    'border-slate-300 bg-white text-slate-900 shadow-sm', // Nhóm / Tổ (Level 3+)
  ];
  const cardStyle = depthStyles[Math.min(depth, depthStyles.length - 1)];

  return (
    <div className="flex flex-col items-center select-none">
      {/* Node Card */}
      <div
        className={`group relative flex min-w-[220px] max-w-[260px] flex-col rounded-2xl border-2 p-3.5 text-center transition-all duration-150 hover:shadow-lg ${cardStyle}`}
      >
        <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-100">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-800">
            {node.code}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
            <Users className="h-3 w-3" /> {node.memberCount} NV
          </span>
        </div>

        <h4 className="mt-2 font-bold text-sm leading-snug break-words text-slate-900 min-h-[2.5rem] flex items-center justify-center">
          {node.name}
        </h4>

        {/* Nút thao tác (ẩn khi in) */}
        {!print ? (
          <div className="mt-2.5 flex items-center justify-center gap-1 border-t border-border/60 pt-2 transition-opacity">
            <button
              type="button"
              onClick={() => onAddChild(node)}
              className="rounded-lg p-1.5 hover:bg-primary/10 text-primary transition-colors"
              title="Thêm đơn vị con"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="rounded-lg p-1.5 hover:bg-muted text-foreground transition-colors"
              title="Sửa tên / đơn vị cha"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDetail(node)}
              className="rounded-lg p-1.5 hover:bg-muted text-foreground transition-colors"
              title="Xem danh sách nhân viên"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(node)}
              className="rounded-lg p-1.5 hover:bg-rose-50 text-rose-600 transition-colors"
              title="Xóa đơn vị"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {/* Nút thu gọn / mở rộng */}
        {hasChildren && !print ? (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card text-foreground px-2 py-0.5 text-[10px] font-bold shadow-xs hover:bg-accent transition-transform z-10"
            title={collapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}
          >
            {collapsed ? `+${node.children.length}` : '−'}
          </button>
        ) : null}
      </div>

      {/* Nhánh con với đường nối thanh lịch */}
      {hasChildren && (!collapsed || print) ? (
        <div className="flex flex-col items-center">
          {/* Đường dọc từ cha xuống thanh ngang */}
          <div className="h-6 w-0.5 bg-border" />

          {/* Khung chứa các con */}
          <div className="relative flex justify-center gap-6 pt-6">
            {/* Thanh ngang kết nối */}
            {node.children.length > 1 ? (
              <div
                className="absolute top-0 h-0.5 bg-border"
                style={{
                  left: `calc(${100 / (node.children.length * 2)}%)`,
                  right: `calc(${100 / (node.children.length * 2)}%)`,
                }}
              />
            ) : null}

            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Đường dọc từ thanh ngang xuống con */}
                <div className="absolute -top-6 h-6 w-0.5 bg-border" />
                <OrgChartBranch
                  node={child}
                  depth={depth + 1}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDetail={onDetail}
                  onDelete={onDelete}
                  print={print}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * KC03 — Quản lý cây cơ cấu tổ chức (Mục 7):
 * - Đủ nghiệp vụ: THÊM / SỬA / XÓA / XEM CHI TIẾT từng đơn vị;
 * - Ba chế độ hiển thị: Cây mở rộng, Sơ đồ tổ chức phân cấp, Bảng quản lý phẳng;
 * - Hỗ trợ in ấn chuẩn văn bản và xuất Excel.
 */
export default function AdminOrgUnitsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [view, setView] = useState<ViewMode>('chart');
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
    onSuccess: () => {
      toast('Đã thêm đơn vị', 'success');
      setAddForm({ name: '', code: '' });
      setAddingTo(null);
      invalidate();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const update = useMutation({
    mutationFn: async (vars: { id: string; name: string; parentId?: string | null }) =>
      api.patch(`/org-units/${vars.id}`, { name: vars.name, parentId: vars.parentId || null }),
    onSuccess: () => {
      toast('Đã cập nhật đơn vị', 'success');
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/org-units/${id}`),
    onSuccess: () => {
      toast('Đã xóa đơn vị', 'success');
      setDeleting(null);
      invalidate();
    },
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Danh sách hành động dạng kebab menu — dùng cho chế độ Bảng. */
  function nodeActionItems(node: TreeNode): RowActionItem[] {
    return [
      {
        label: 'Thêm đơn vị con',
        icon: Plus,
        onSelect: () => {
          setAddingTo(addingTo === node.id ? null : node.id);
          setAddForm({ name: '', code: '' });
        },
      },
      {
        label: 'Sửa tên / di chuyển',
        icon: Pencil,
        onSelect: () => {
          setEditing(node);
          setEditForm({ name: node.name, parentId: node.parentId ?? '' });
        },
      },
      { label: 'Xem chi tiết', icon: Eye, onSelect: () => setDetail(node) },
      'separator',
      { label: 'Xóa đơn vị', icon: Trash2, danger: true, onSelect: () => setDeleting(node) },
    ];
  }

  /** Hàng nút icon inline — dùng cho chế độ Cây. */
  function nodeActions(node: TreeNode) {
    return (
      <span className="flex items-center gap-0.5">
        <button
          className="rounded p-1 text-primary hover:bg-primary/10"
          aria-label={`Thêm đơn vị con vào ${node.name}`}
          onClick={() => {
            setAddingTo(addingTo === node.id ? null : node.id);
            setAddForm({ name: '', code: '' });
          }}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label={`Sửa ${node.name}`}
          onClick={() => {
            setEditing(node);
            setEditForm({ name: node.name, parentId: node.parentId ?? '' });
          }}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label={`Xem chi tiết ${node.name}`}
          onClick={() => setDetail(node)}
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          className="rounded p-1 text-destructive hover:bg-destructive/10"
          aria-label={`Xóa ${node.name}`}
          onClick={() => setDeleting(node)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
    );
  }

  /** Form thêm đơn vị con (inline). */
  function addFormInline(parentId: string) {
    return (
      <div className="mb-2 ml-8 flex flex-wrap items-end gap-2 rounded-xl border bg-muted/40 p-3">
        <div className="space-y-1">
          <Label>Tên đơn vị</Label>
          <Input
            value={addForm.name}
            placeholder="Ví dụ: Tổ Phát triển Mobile"
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Mã</Label>
          <Input
            value={addForm.code}
            placeholder="DEV-MOB"
            onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
            className="w-28 uppercase"
          />
        </div>
        <Button
          size="sm"
          disabled={!addForm.name || !addForm.code || create.isPending}
          onClick={() => create.mutate({ ...addForm, parentId })}
        >
          Thêm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAddingTo(null)}>
          Hủy
        </Button>
      </div>
    );
  }

  /** Chế độ 1 — Cây danh mục mở rộng. */
  function renderTreeNode(node: TreeNode, depth = 0): React.ReactNode {
    const isOpen = expanded.has(node.id) || depth === 0;
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent/60 transition-colors"
          style={{ paddingLeft: depth * 20 + 8 }}
        >
          <button
            onClick={() => toggle(node.id)}
            className="rounded p-1 hover:bg-muted"
            aria-label="Mở/đóng nhánh"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${
                node.children.length && isOpen ? 'rotate-90 text-primary' : ''
              } ${node.children.length ? '' : 'opacity-0'}`}
            />
          </button>
          <span className="text-sm font-semibold text-foreground">{node.name}</span>
          <span className="text-xs font-mono rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            {node.code}
          </span>
          <span className="text-xs text-muted-foreground">{node.memberCount} nhân viên</span>
          <span className="ml-auto">{nodeActions(node)}</span>
        </div>
        {addingTo === node.id ? addFormInline(node.id) : null}
        {isOpen ? node.children.map((c) => renderTreeNode(c, depth + 1)) : null}
      </div>
    );
  }

  /** Chế độ 3 — Bảng quản lý phẳng. */
  const tableColumns: DataColumn<{ node: TreeNode; depth: number }>[] = [
    {
      key: 'name',
      header: 'Đơn vị',
      sortable: true,
      sortValue: (r) => r.node.name,
      render: (r) => (
        <span style={{ paddingLeft: r.depth * 20 }} className="font-semibold text-foreground">
          {r.depth > 0 ? '└── ' : ''}
          {r.node.name}
        </span>
      ),
      exportValue: (r) => `${'  '.repeat(r.depth)}${r.node.name}`,
    },
    { key: 'code', header: 'Mã đơn vị', sortable: true, render: (r) => r.node.code },
    { key: 'memberCount', header: 'Số nhân viên', sortable: true, render: (r) => `${r.node.memberCount} NV` },
    {
      key: 'parent',
      header: 'Đơn vị trực thuộc',
      render: (r) => flat.find((f) => f.node.id === r.node.parentId)?.node.name ?? '— (Gốc)',
      exportValue: (r) => flat.find((f) => f.node.id === r.node.parentId)?.node.name ?? 'Gốc',
    },
  ];

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;

  return (
    <>
      <PageHeader
        title="Cơ cấu tổ chức"
        description="Cây phòng ban là dữ liệu cấu hình — thêm, sửa, xóa, xem chi tiết ngay trên sơ đồ."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-xl border bg-card p-1 shadow-sm">
              <Button
                size="sm"
                variant={view === 'chart' ? 'secondary' : 'ghost'}
                onClick={() => setView('chart')}
                className="gap-1.5 text-xs font-semibold"
              >
                <Network className="h-4 w-4 text-primary" /> Sơ đồ
              </Button>
              <Button
                size="sm"
                variant={view === 'tree' ? 'secondary' : 'ghost'}
                onClick={() => setView('tree')}
                className="gap-1.5 text-xs font-semibold"
              >
                <TreePine className="h-4 w-4" /> Cây
              </Button>
              <Button
                size="sm"
                variant={view === 'table' ? 'secondary' : 'ghost'}
                onClick={() => setView('table')}
                className="gap-1.5 text-xs font-semibold"
              >
                <Table2 className="h-4 w-4" /> Bảng
              </Button>
            </div>
            <PrintExportDropdown
              printLabel="In sơ đồ tổ chức"
              exportLabel="Xuất bảng Excel"
              onExportExcel={() => {
                // Xuất danh sách đơn vị ra Excel
                const cols = ['Tên đơn vị', 'Mã đơn vị', 'Số nhân viên', 'Đơn vị trực thuộc'];
                const rows = flat.map((f) => [
                  `${'  '.repeat(f.depth)}${f.node.name}`,
                  f.node.code,
                  f.node.memberCount,
                  flat.find((p) => p.node.id === f.node.parentId)?.node.name ?? 'Gốc',
                ]);
                import('@/lib/export').then(({ exportRowsToExcel }) => {
                  exportRowsToExcel('co-cau-to-chuc', cols, rows);
                });
              }}
            />
          </div>
        }
      />

      <div className="print-area">
        <PrintFrame
          title="DANH MỤC CƠ CẤU TỔ CHỨC CÔNG TY"
          subtitle={`Công ty Cổ phần Phần mềm Saigon Technology · Tổng số ${flat.length} đơn vị`}
        />

        {/* Khung Bảng In Ấn Chuẩn Nghị định 30 (In dạng bảng cấu trúc thư mục phân cấp) */}
        <div className="print-only">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>MÃ ĐƠN VỊ</th>
                <th style={{ width: '45%' }}>TÊN ĐƠN VỊ / PHÒNG BAN (CẤU TRÚC PHÂN CẤP)</th>
                <th style={{ width: '28%' }}>ĐƠN VỊ CẤP TRÊN</th>
                <th style={{ width: '15%' }}>NHÂN SỰ (NS)</th>
              </tr>
            </thead>
            <tbody>
              {flat.map(({ node, depth }) => (
                <tr key={node.id}>
                  <td className="text-center font-mono">{node.code}</td>
                  <td>
                    <span style={{ paddingLeft: `${depth * 18}px` }} className="inline-block">
                      {depth > 0 ? '├─ ' : '• '}
                      {node.name}
                    </span>
                  </td>
                  <td>{flat.find((f) => f.node.id === node.parentId)?.node.name ?? '— (Cấp cao nhất)'}</td>
                  <td className="text-center font-semibold">{node.memberCount} người</td>
                </tr>
              ))}
            </tbody>
          </table>
          <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
        </div>

        {/* Giao diện tương tác Web */}
        <div className="no-print space-y-4">
          {view === 'chart' ? (
            <div className="w-full overflow-x-auto rounded-3xl border bg-card/60 p-8 sm:p-12 shadow-sm">
              <div className="min-w-max flex flex-col items-center mx-auto gap-8">
                {(q.data ?? []).map((n) => (
                  <OrgChartBranch
                    key={n.id}
                    node={n}
                    depth={0}
                    onAddChild={(node) => {
                      setAddingTo(node.id);
                      setAddForm({ name: '', code: '' });
                    }}
                    onEdit={(node) => {
                      setEditing(node);
                      setEditForm({ name: node.name, parentId: node.parentId ?? '' });
                    }}
                    onDetail={(node) => setDetail(node)}
                    onDelete={(node) => setDeleting(node)}
                    print={false}
                  />
                ))}
              </div>
            </div>
          ) : view === 'tree' ? (
            <Card className="rounded-3xl shadow-sm">
              <CardContent className="p-6">
                <div className="py-1">{(q.data ?? []).map((n) => renderTreeNode(n))}</div>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={tableColumns}
              rows={flat}
              rowKey={(r) => r.node.id}
              searchFields={(r) => [r.node.name, r.node.code]}
              emptyTitle="Chưa có đơn vị nào"
              actions={(r) => nodeActionItems(r.node)}
              exportFilename="co-cau-to-chuc"
              printLabel="In danh sách đơn vị"
            />
          )}
        </div>
      </div>

      {/* Modal thêm đơn vị con */}
      <Modal
        open={!!addingTo}
        onOpenChange={(o) => !o && setAddingTo(null)}
        title={`Thêm đơn vị trực thuộc: ${flat.find((f) => f.node.id === addingTo)?.node.name ?? ''}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (addingTo) create.mutate({ ...addForm, parentId: addingTo });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Tên đơn vị *</Label>
            <Input
              required
              placeholder="Ví dụ: Nhóm Phát triển React Native"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mã đơn vị *</Label>
            <Input
              required
              placeholder="DEV-RN"
              value={addForm.code}
              onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
              className="uppercase font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ModalFooterActions onCancel={() => setAddingTo(null)} pending={create.isPending} confirmLabel="Thêm mới" />
          </div>
        </form>
      </Modal>

      {/* Modal sửa đơn vị */}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={`Sửa đơn vị: ${editing?.name ?? ''}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editing)
              update.mutate({ id: editing.id, name: editForm.name, parentId: editForm.parentId || null });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>Tên đơn vị *</Label>
            <Input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Đơn vị trực thuộc cấp trên</Label>
            <Select
              value={editForm.parentId}
              onChange={(e) => setEditForm({ ...editForm, parentId: e.target.value })}
            >
              <option value="">— Gốc (không có cấp trên) —</option>
              {flat
                .filter((f) => f.node.id !== editing?.id)
                .map((f) => (
                  <option key={f.node.id} value={f.node.id}>
                    {'— '.repeat(f.depth)}
                    {f.node.name}
                  </option>
                ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ModalFooterActions onCancel={() => setEditing(null)} pending={update.isPending} confirmLabel="Lưu thay đổi" />
          </div>
        </form>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Xóa đơn vị: ${deleting?.name ?? ''}`}
        size="sm"
        description="Chỉ xóa được khi đơn vị không còn đơn vị con hoặc nhân viên trực thuộc."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => deleting && remove.mutate(deleting.id)}
          >
            {remove.isPending ? 'Đang xóa…' : 'Xóa đơn vị'}
          </Button>
        </div>
      </Modal>

      {/* Modal chi tiết đơn vị */}
      <Modal
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.name ?? ''}
        size="lg"
        description={detail ? `Mã ${detail.code} · ${detail.memberCount} nhân viên` : undefined}
      >
        {detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 border">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Mã đơn vị</p>
                <p className="font-bold text-primary font-mono mt-0.5">{detail.code}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Đơn vị cấp trên</p>
                <p className="font-medium mt-0.5">
                  {flat.find((f) => f.node.id === detail.parentId)?.node.name ?? '— (Gốc)'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Đơn vị con</p>
                <p className="font-bold mt-0.5">{detail.children.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Nhân sự hiện hữu</p>
                <p className="font-bold text-emerald-700 mt-0.5">
                  {detail.memberCount} NV
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Danh sách nhân sự thuộc đơn vị ({detailMembers.length})
              </p>
              {detailMembers.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
                  Chưa có nhân viên nào được phân bổ vào đơn vị này.
                </div>
              ) : (
                <ul className="divide-y rounded-2xl border bg-card max-h-64 overflow-y-auto">
                  {detailMembers.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/30">
                      <span className="font-medium text-foreground">{m.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.employeeCode ? <span className="font-mono">{m.employeeCode} · </span> : ''}
                        {m.jobTitle ?? 'Nhân viên'}
                      </span>
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
