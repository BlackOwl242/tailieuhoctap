'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Eye,
  FolderTree,
  Landmark,
  Pencil,
  Plus,
  Save,
  Table2,
  Trash2,
  TreePine,
  Users,
} from 'lucide-react';
import type { RowActionItem } from '@/components/ui/data-table';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Skeleton
} from '@/components/ui/primitives';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintExportDropdown, PrintFrame, PrintSignatureBlock } from '@/components/ui/print';
import { useOrgConfig, ORG_LEVEL_LABELS, type OrgPrintConfig, DEFAULT_ORG_CONFIG } from '@/lib/org-config';

interface TreeNode {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
  memberCount: number;
  totalMembers?: number;
  level?: number;
  levelLabel?: string;
  children: TreeNode[];
}

function getLevelLabel(level?: number, depth = 0): string {
  const lvl = level || depth + 1;
  switch (lvl) {
    case 1:
      return 'Cấp 1 · Đơn vị gốc';
    case 2:
      return 'Cấp 2 · Khối / Ban';
    case 3:
      return 'Cấp 3 · Phòng / TT';
    default:
      return 'Cấp 4 · Tổ / Nhóm';
  }
}

interface EmployeeLite {
  id: string;
  fullName: string;
  employeeCode: string | null;
  jobTitle: string | null;
  orgUnit?: { name: string } | null;
}

type ViewMode = 'tree' | 'table';

/**
 * KC03 — Quản lý cây cơ cấu tổ chức:
 * - Đủ nghiệp vụ: THÊM / SỬA / XÓA / XEM CHI TIẾT từng đơn vị;
 * - Hai chế độ hiển thị: Cây danh mục phân cấp và Bảng quản lý phẳng;
 * - Hỗ trợ in ấn chuẩn văn bản hành chính Nghị định 30/2020/NĐ-CP và xuất Excel.
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

  // Cấu hình Thông tin Cơ quan & Tiêu đề Văn bản In ấn
  const [orgConfig, setOrgConfig] = useOrgConfig();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [formOrgConfig, setFormOrgConfig] = useState<OrgPrintConfig>(orgConfig);

  useEffect(() => {
    setFormOrgConfig(orgConfig);
  }, [orgConfig]);

  const handleSaveOrgConfig = async () => {
    if (!formOrgConfig.orgName.trim()) {
      toast('Vui lòng nhập Tên Cơ quan / Đơn vị ban hành', 'error');
      return;
    }
    setOrgConfig(formOrgConfig);
    // Tự động đồng bộ tên cơ quan vào đơn vị gốc của hệ thống
    const roots = (q.data ?? []).filter((n) => !n.parentId);
    if (roots.length > 0) {
      try {
        await update.mutateAsync({ id: roots[0].id, name: formOrgConfig.orgName.trim() });
      } catch {
        // bỏ qua nếu lỗi mạng nhỏ
      }
    }
    invalidate();
    toast('Đã lưu thông tin Cơ quan & đồng bộ dữ liệu in ấn thành công', 'success');
  };

  const handleSyncRootName = async () => {
    if (!formOrgConfig.orgName.trim()) {
      toast('Vui lòng nhập Tên Cơ quan / Đơn vị trước khi đồng bộ', 'error');
      return;
    }
    const roots = (q.data ?? []).filter((n) => !n.parentId);
    if (roots.length > 0) {
      const root = roots[0];
      try {
        await update.mutateAsync({ id: root.id, name: formOrgConfig.orgName.trim() });
        toast(`Đã cập nhật Đơn vị gốc thành "${formOrgConfig.orgName.trim()}"`, 'success');
      } catch (err) {
        toast(errorMessage(err), 'error');
      }
    } else {
      try {
        await create.mutateAsync({ name: formOrgConfig.orgName.trim(), code: 'DVI_GOC' });
        toast(`Đã tạo Đơn vị gốc "${formOrgConfig.orgName.trim()}"`, 'success');
      } catch (err) {
        toast(errorMessage(err), 'error');
      }
    }
    setOrgConfig(formOrgConfig);
  };

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

  function expandAll() {
    const all = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        all.add(n.id);
        if (n.children) walk(n.children);
      }
    };
    walk(q.data ?? []);
    setExpanded(all);
  }

  function collapseAll() {
    setExpanded(new Set());
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

  /** Hàng nút icon inline — chỉ hiện khi hover trên dòng. */
  function nodeActions(node: TreeNode) {
    return (
      <span className="flex items-center gap-0.5">
        <button
          className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          title={`Thêm đơn vị con vào ${node.name}`}
          aria-label={`Thêm đơn vị con vào ${node.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setAddingTo(addingTo === node.id ? null : node.id);
            setAddForm({ name: '', code: '' });
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          title={`Sửa ${node.name}`}
          aria-label={`Sửa ${node.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setEditing(node);
            setEditForm({ name: node.name, parentId: node.parentId ?? '' });
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          title={`Xem chi tiết ${node.name}`}
          aria-label={`Xem chi tiết ${node.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setDetail(node);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title={`Xóa ${node.name}`}
          aria-label={`Xóa ${node.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setDeleting(node);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
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

  /** Chế độ 1 — Cây phân cấp chuẩn biên tập (editorial hierarchy), thanh lịch, không badge thừa thãi. */
  function renderTreeNode(node: TreeNode, depth = 0): React.ReactNode {
    const isOpen = expanded.has(node.id) || depth === 0;
    const hasChildren = node.children && node.children.length > 0;
    const nodeLevel = node.level || depth + 1;

    // Phân cấp kiểu chữ chuẩn mực, rõ ràng trên dưới
    const nameClass =
      nodeLevel === 1
        ? 'text-[14.5px] font-semibold text-slate-900 tracking-tight'
        : nodeLevel === 2
        ? 'text-[14px] font-medium text-slate-800'
        : nodeLevel === 3
        ? 'text-[13.5px] text-slate-700'
        : 'text-[13px] text-slate-600';

    return (
      <div key={node.id} className="relative">
        {/* Đường nhánh chỉ báo phân cấp thanh mảnh 1px */}
        {depth > 0 && (
          <div
            className="absolute top-0 bottom-0 border-l border-slate-200/90 pointer-events-none"
            style={{ left: (depth - 1) * 20 + 17 }}
          />
        )}
        <div
          className={`group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100/80 transition-colors duration-100 ${
            nodeLevel === 1 ? 'bg-slate-50/70 font-semibold mb-0.5' : ''
          }`}
          style={{ paddingLeft: depth * 20 + 6 }}
        >
          <button
            onClick={() => toggle(node.id)}
            className="rounded p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 shrink-0 transition-transform"
            aria-label="Mở/đóng nhánh"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                hasChildren && isOpen ? 'rotate-90 text-slate-700' : ''
              } ${hasChildren ? '' : 'opacity-0 pointer-events-none'}`}
            />
          </button>

          {/* Tên đơn vị */}
          <span className={nameClass}>{node.name}</span>

          {/* Mã đơn vị - Tối giản */}
          <span className="text-[11px] font-mono text-slate-400 font-normal shrink-0">
            {node.code}
          </span>

          {/* Quy mô nhân sự - Căn phải, số monospace nhẹ nhàng, không badge cồng kềnh */}
          <span className="ml-auto mr-3 text-xs font-mono text-slate-400 tabular-nums shrink-0">
            {node.totalMembers ?? node.memberCount}{' '}
            <span className="text-[11px] font-sans text-slate-400 font-normal">NV</span>
          </span>

          {/* Hành động: Chỉ hiện khi hover để màn hình luôn tĩnh lặng, sạch sẽ */}
          <span className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            {nodeActions(node)}
          </span>
        </div>
        {addingTo === node.id ? addFormInline(node.id) : null}
        {isOpen ? node.children.map((c) => renderTreeNode(c, depth + 1)) : null}
      </div>
    );
  }

  /** Chế độ 2 — Bảng phẳng thanh lịch. */
  const tableColumns: DataColumn<{ node: TreeNode; depth: number }>[] = [
    {
      key: 'name',
      header: 'Đơn vị',
      sortable: true,
      sortValue: (r) => r.node.name,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span
            className={
              r.depth === 0
                ? 'font-semibold text-slate-900'
                : r.depth === 1
                ? 'font-medium text-slate-800'
                : 'text-slate-700'
            }
            style={{ paddingLeft: r.depth * 16 }}
          >
            {r.depth > 0 && <span className="text-slate-400 mr-1.5 font-mono text-xs">└─</span>}
            {r.node.name}
          </span>
        </div>
      ),
      exportValue: (r) => `${'  '.repeat(r.depth)}${r.node.name}`,
    },
    {
      key: 'level',
      header: 'Cấp bậc',
      sortable: true,
      sortValue: (r) => r.node.level || r.depth + 1,
      render: (r) => (
        <span className="text-xs text-slate-500 font-medium">
          {r.node.levelLabel || getLevelLabel(r.node.level, r.depth)}
        </span>
      ),
      exportValue: (r) => r.node.levelLabel || `Cấp ${r.node.level || r.depth + 1}`,
    },
    {
      key: 'code',
      header: 'Mã',
      sortable: true,
      render: (r) => <span className="font-mono text-xs text-slate-500">{r.node.code}</span>,
    },
    {
      key: 'memberCount',
      header: 'Quy mô',
      sortable: true,
      sortValue: (r) => r.node.totalMembers ?? r.node.memberCount,
      render: (r) => (
        <span className="text-xs font-mono text-slate-700 tabular-nums">
          {r.node.totalMembers ?? r.node.memberCount} <span className="font-sans text-slate-400">NV</span>
        </span>
      ),
      exportValue: (r) => `${r.node.totalMembers ?? r.node.memberCount} NV`,
    },
    {
      key: 'parent',
      header: 'Đơn vị trực thuộc',
      render: (r) => (
        <span className="text-xs text-slate-500">
          {flat.find((f) => f.node.id === r.node.parentId)?.node.name ?? '— (Gốc Doanh nghiệp)'}
        </span>
      ),
      exportValue: (r) => flat.find((f) => f.node.id === r.node.parentId)?.node.name ?? 'Gốc',
    },
  ];

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;

  return (
    <>
      <PageHeader
        title="Cơ cấu tổ chức"
        description="Cây phòng ban là dữ liệu cấu hình — thêm, sửa, xóa, xem chi tiết theo dạng cây hoặc bảng."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isConfigOpen ? 'default' : 'outline'}
              onClick={() => setIsConfigOpen((v) => !v)}
              className="gap-1.5 text-xs font-semibold"
              title="Cấu hình thông tin cơ quan và tiêu đề in ấn chuẩn Nghị định 30"
            >
              <Building2 className="h-4 w-4" />
              <span>Cơ quan & In ấn</span>
            </Button>
            <div className="flex gap-1 rounded-xl border bg-card p-1 shadow-sm">
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
              printLabel="In danh mục cơ cấu tổ chức"
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

      {/* ================= KHỐI CẤU HÌNH THÔNG TIN CƠ QUAN / ĐƠN VỊ IN ẤN ================= */}
      <Card className="border-border/80 shadow-xs mb-6 no-print overflow-hidden">
        <CardHeader className="p-4 bg-muted/30 border-b border-border/60">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Thông tin Cơ quan, Đơn vị & Tiêu đề Văn bản In ấn</span>
                  <Badge variant="outline" className="text-[11px] font-normal bg-white">
                    Nghị định 30/2020/NĐ-CP
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Cấu hình Tên cơ quan chủ quản, Tên đơn vị và Phòng ban lập biểu được tự động đồng bộ lên tất cả các văn bản in ấn toàn hệ thống.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsConfigOpen((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {isConfigOpen ? 'Thu gọn' : 'Mở rộng cấu hình'}
                <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isConfigOpen && (
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Form nhập thông tin cấu hình - Bố cục rộng rãi toàn thẻ */}
            <div className="space-y-4">
              {/* 0. Lựa chọn Phân hệ Tổ chức & Chuẩn Sơ yếu lý lịch */}
              {/* 0. Lựa chọn Phân hệ Tổ chức & Chuẩn Sơ yếu lý lịch */}
              <div className="space-y-1.5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Mô hình Tổ chức & Chuẩn Sơ yếu lý lịch mặc định
                  </Label>
                  <span className="text-[11px] text-muted-foreground italic">
                    Quyết định định dạng mẫu in (Mẫu Nhà nước 2C-BNV vs Mẫu Doanh nghiệp tư nhân)
                  </span>
                </div>
                <Select
                  value={formOrgConfig.orgSector || 'state'}
                  onChange={(e) => {
                    const sector = e.target.value as any;
                    setFormOrgConfig({
                      ...formOrgConfig,
                      orgSector: sector,
                      orgLevel: sector === 'enterprise' ? 'DV_DNTN' : (formOrgConfig.orgLevel === 'DV_DNTN' ? 'DV_TINH' : formOrgConfig.orgLevel),
                    });
                  }}
                  className="h-9 w-full text-xs font-medium"
                >
                  <option value="state">Cơ quan Nhà nước / Đơn vị sự nghiệp công lập (Mẫu 2C-BNV/2008 của Bộ Nội vụ)</option>
                  <option value="enterprise">Doanh nghiệp tư nhân / Tập đoàn kinh tế (Mẫu Trích ngang người lao động)</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <Label className="text-xs font-semibold text-foreground">
                    1. Cơ quan chủ quản cấp trên (nếu có)
                  </Label>
                  <Input
                    value={formOrgConfig.parentOrgName}
                    onChange={(e) => setFormOrgConfig({ ...formOrgConfig, parentOrgName: e.target.value })}
                    placeholder="Ví dụ: BỘ NỘI VỤ, TẬP ĐOÀN..."
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dòng 1 góc trái (in hoa, chữ đứng)
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <Label className="text-xs font-semibold text-foreground">
                    2. Tên Cơ quan / Đơn vị ban hành văn bản (*)
                  </Label>
                  <Input
                    value={formOrgConfig.orgName}
                    onChange={(e) => setFormOrgConfig({ ...formOrgConfig, orgName: e.target.value })}
                    placeholder="Ví dụ: SỞ NỘI VỤ, TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP, CÔNG TY CỔ PHẦN..."
                    className="text-xs font-semibold"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dòng 2 góc trái (in hoa, chữ đứng, <strong>đậm</strong>)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    3. Cấp đơn vị hành chính
                  </Label>
                  <Select
                    value={formOrgConfig.orgLevel}
                    onChange={(e) => setFormOrgConfig({ ...formOrgConfig, orgLevel: e.target.value })}
                    className="text-xs"
                  >
                    {Object.entries(ORG_LEVEL_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Phân cấp theo danh mục quản lý</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    4. Phòng ban chuyên trách tham mưu
                  </Label>
                  <Input
                    value={formOrgConfig.deptName}
                    onChange={(e) => setFormOrgConfig({ ...formOrgConfig, deptName: e.target.value })}
                    placeholder="Ví dụ: PHÒNG TỔ CHỨC - CÁN BỘ..."
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Phòng ban lập biểu hoặc phụ trách</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    5. Địa danh ban hành văn bản
                  </Label>
                  <Input
                    value={formOrgConfig.location}
                    onChange={(e) => setFormOrgConfig({ ...formOrgConfig, location: e.target.value })}
                    placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh..."
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dòng ngày tháng năm góc phải
                  </p>
                </div>
              </div>

              {/* Các nút thao tác lưu & đồng bộ */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  className="gap-1.5 bg-primary text-primary-foreground text-xs shadow-xs"
                  onClick={handleSaveOrgConfig}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Lưu cấu hình cơ quan</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs text-slate-700 hover:bg-slate-50 border-slate-300"
                  onClick={handleSyncRootName}
                  title="Cập nhật tên Đơn vị cơ quan vào Node gốc của Sơ đồ tổ chức"
                >
                  <FolderTree className="h-3.5 w-3.5 text-blue-600" />
                  <span>Đồng bộ tên Đơn vị vào Gốc sơ đồ</span>
                </Button>
              </div>
            </div>

            {/* Live Preview góc in văn bản chuẩn Nghị định 30 - Đặt bên dưới với chiều rộng rộng rãi, không đè chữ */}
            <div className="pt-6 border-t border-border/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Xem trước góc văn bản in toàn hệ thống (Nghị định 30/2020/NĐ-CP)
                </Label>
                <span className="text-[11px] text-muted-foreground italic">
                  Tự động hiển thị tại phần đầu của mọi trang in, báo cáo, danh mục
                </span>
              </div>

              <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 font-times text-black shadow-xs select-none">
                {/* Header 2 cột cân xứng và rộng rãi */}
                <div className="grid grid-cols-2 gap-8 items-start text-center">
                  {/* Góc trái: Tên cơ quan */}
                  <div className="flex flex-col items-center leading-snug">
                    {formOrgConfig.parentOrgName ? (
                      <p className="text-[11pt] font-normal uppercase text-black tracking-tight">
                        {formOrgConfig.parentOrgName}
                      </p>
                    ) : null}
                    <p className="text-[11.5pt] font-bold uppercase text-black mt-0.5">
                      {formOrgConfig.orgName || 'TÊN CƠ QUAN / ĐƠN VỊ'}
                    </p>
                    {formOrgConfig.deptName ? (
                      <p className="text-[10pt] font-semibold uppercase text-slate-800 mt-0.5">
                        {formOrgConfig.deptName}
                      </p>
                    ) : null}
                    <div className="w-24 border-b border-black mt-1 mb-1.5" />
                    <p className="text-[10pt] italic text-slate-700">Số: .../BC-TCCB</p>
                  </div>

                  {/* Góc phải: Quốc hiệu */}
                  <div className="flex flex-col items-center leading-snug">
                    <p className="text-[11pt] font-bold uppercase text-black whitespace-nowrap">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM
                    </p>
                    <p className="text-[11.5pt] font-bold text-black mt-0.5 whitespace-nowrap">
                      Độc lập – Tự do – Hạnh phúc
                    </p>
                    <div className="w-28 border-b border-black mt-1 mb-1.5" />
                    <p className="text-[10.5pt] italic text-black whitespace-nowrap">
                      {formOrgConfig.location || 'Địa danh'}, ngày … tháng … năm 2026
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-dashed border-slate-200 text-center">
                  <p className="text-[12pt] font-bold uppercase text-black tracking-wide">
                    BÁO CÁO / DANH MỤC THAM CHIẾU
                  </p>
                  <p className="text-[10pt] italic text-slate-600 mt-0.5">
                    Tiêu đề biểu mẫu theo chuẩn hành chính
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="print-area font-times">
        <PrintFrame
          title="DANH MỤC CƠ CẤU TỔ CHỨC ĐƠN VỊ"
          subtitle={`${formOrgConfig.parentOrgName ? `${formOrgConfig.parentOrgName} · ` : ''}${formOrgConfig.orgName || 'CƠ QUAN / ĐƠN VỊ'} · Tổng số ${flat.length} đơn vị/phòng ban`}
          parentOrgName={formOrgConfig.parentOrgName}
          orgName={formOrgConfig.orgName}
          deptName={formOrgConfig.deptName}
          location={formOrgConfig.location}
          docNumber=".../BC-TCCB"
        />

        {/* Khung Bảng In Ấn Chuẩn Nghị định 30/2020/NĐ-CP */}
        <div className="print-only">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>STT</th>
                <th style={{ width: '14%' }}>MÃ ĐƠN VỊ</th>
                <th style={{ width: '48%' }}>TÊN ĐƠN VỊ / PHÒNG BAN</th>
                <th style={{ width: '22%' }}>ĐƠN VỊ TRỰC THUỘC</th>
                <th style={{ width: '10%' }}>NHÂN SỰ</th>
              </tr>
            </thead>
            <tbody>
              {flat.map(({ node, depth }, idx) => {
                const isRoot = depth === 0;
                const isLevel1 = depth === 1;
                const displayName = (isRoot && formOrgConfig.orgName?.trim() ? formOrgConfig.orgName.trim() : node.name).trim();
                const parentName = flat.find((f) => f.node.id === node.parentId)?.node.name?.trim();

                return (
                  <tr key={node.id}>
                    <td className="text-center font-mono">{idx + 1}</td>
                    <td className="text-center font-mono font-bold text-black">{node.code}</td>
                    <td className="text-left">
                      <span
                        className={
                          isRoot
                            ? 'font-bold uppercase text-black'
                            : isLevel1
                            ? 'font-bold text-black'
                            : 'font-normal text-black'
                        }
                      >
                        {displayName}
                      </span>
                    </td>
                    <td className="text-left">{parentName || ''}</td>
                    <td className="text-center font-semibold text-black">{node.memberCount}</td>
                  </tr>
                );
              })}
              {/* Dòng Tổng kết cuối bảng */}
              <tr className="font-bold">
                <td colSpan={4} className="text-center uppercase font-bold py-2">
                  TỔNG CỘNG ({flat.length} ĐƠN VỊ / PHÒNG BAN)
                </td>
                <td className="text-center font-bold">
                  {flat.reduce((sum, f) => sum + (f.node.memberCount || 0), 0)} người
                </td>
              </tr>
            </tbody>
          </table>
          <PrintSignatureBlock
            leftTitle="Người lập bảng"
            middleTitle={formOrgConfig.deptName ? `Trưởng ${formOrgConfig.deptName}` : 'Trưởng phòng Tổ chức - Cán bộ'}
            rightTitle="Thủ trưởng Cơ quan / Đơn vị"
            location={formOrgConfig.location}
          />
        </div>

        {/* Giao diện tương tác Web */}
        <div className="no-print space-y-4">
          {view === 'tree' ? (
            <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Sơ đồ phân cấp đơn vị
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({flat.length} đơn vị · {q.data?.reduce((sum, n) => sum + (n.totalMembers ?? n.memberCount ?? 0), 0) ?? 0} nhân sự)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={expandAll}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900 px-2"
                  >
                    Mở rộng tất cả
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={collapseAll}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900 px-2"
                  >
                    Thu gọn tất cả
                  </Button>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="py-1 space-y-0.5">{(q.data ?? []).map((n) => renderTreeNode(n))}</div>
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
