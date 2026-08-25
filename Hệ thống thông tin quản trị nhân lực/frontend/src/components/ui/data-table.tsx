'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet, MoreVertical, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportRowsToExcel } from '@/lib/export';
import { Button, Input, Select, Skeleton } from '@/components/ui/primitives';
import { EmptyState } from '@/components/common/states';

/* ============================================================================
 * DataTable dùng chung (Mục 6 + Mục 8) — bảng quản lý đầy đủ tính năng:
 * - Tìm kiếm nhanh, bộ lọc dropdown, sắp xếp theo cột, phân trang;
 * - Hành động theo dòng: NÚT 3 CHẤM (kebab) mở dropdown portal — không bao
 *   giờ bị cắt bởi overflow của bảng, không bao giờ mất nút hành động.
 * ========================================================================== */

/** Một hành động của dòng; 'separator' để vẽ đường kẻ phân nhóm trong menu. */
export type RowActionItem = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
} | 'separator';

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;
  noPrint?: boolean;
  /** Giá trị xuất Excel (mặc định: trường thô theo key) — dùng cho cột render phức tạp. */
  exportValue?: (row: T) => string | number;
}

export interface DataFilterDef<T> {
  key: string;
  label: string;
  value: (row: T) => string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  searchFields?: (row: T) => string[];
  filters?: DataFilterDef<T>[];
  /** Trả về danh sách hành động của dòng — hiển thị trong menu 3 chấm. */
  actions?: (row: T) => RowActionItem[];
  actionsHeader?: string;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  toolbarExtra?: React.ReactNode;
  className?: string;
  /** Đặt để hiện nút "Xuất Excel" — xuất toàn bộ dòng đang lọc/sắp xếp. */
  exportFilename?: string;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

/** Ô 3 chấm + dropdown portal (fixed positioning — không bị overflow cắt). */
function ActionsCell({ items, rowLabel }: { items: RowActionItem[]; rowLabel: string }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const visible = items.filter((it): it is Exclude<RowActionItem, 'separator'> => it !== 'separator' && !it.hidden);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuW = 220;
      const menuH = 40 * Math.min(visible.length, 6) + 16;
      const top = r.bottom + 6 + menuH > window.innerHeight ? Math.max(8, r.top - menuH - 6) : r.bottom + 6;
      const left = r.right + menuW > window.innerWidth ? Math.max(8, r.right - menuW) : r.right - menuW;
      setPos({ top, left });
    }
    setOpen((v) => !v);
  }

  // Đóng khi cuộn/click ngoài/Escape — dropdown luôn hiển thị đủ (portal ra body)
  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  // Không có hành động nào khả dụng → hiển thị gạch ngang thay vì nút rỗng
  if (visible.length === 0 && !items.includes('separator')) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={`Hành động cho ${rowLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          open && 'bg-accent text-foreground',
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-dropdown min-w-[13rem] overflow-hidden rounded-lg border bg-card py-1 shadow-lg animate-fade-in"
            >
              {items.map((it, i) =>
                it === 'separator' ? (
                  <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-border" />
                ) : it.hidden ? null : (
                  <button
                    key={it.label}
                    role="menuitem"
                    disabled={it.disabled}
                    onClick={() => { setOpen(false); it.onSelect(); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50',
                      it.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground',
                    )}
                  >
                    {it.icon ? <it.icon className="h-4 w-4 shrink-0" /> : null}
                    {it.label}
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchFields,
  filters = [],
  actions,
  actionsHeader = 'Hành động',
  pageSize: initialPageSize = 10,
  loading,
  emptyTitle = 'Chưa có dữ liệu',
  emptyHint,
  toolbarExtra,
  className,
  exportFilename,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const filtered = React.useMemo(() => {
    let out = rows;
    const q = search.trim().toLowerCase();
    if (q && searchFields) {
      out = out.filter((r) => searchFields(r).some((v) => v?.toLowerCase().includes(q)));
    }
    for (const f of filters) {
      const v = filterValues[f.key];
      if (v) out = out.filter((r) => f.value(r) === v);
    }
    return out;
  }, [rows, search, searchFields, filters, filterValues]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const get = (r: T) => (col.sortValue ? col.sortValue(r) : (r as Record<string, unknown>)[col.key]);
    return [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va;
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'vi');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => setPage(1), [search, filterValues, pageSize]);

  function toggleSort(col: DataColumn<T>) {
    if (!col.sortable) return;
    setSort((s) => {
      if (!s || s.key !== col.key) return { key: col.key, dir: 'asc' };
      if (s.dir === 'asc') return { key: col.key, dir: 'desc' };
      return null;
    });
  }

  const hasToolbar = searchFields || filters.length > 0 || toolbarExtra || exportFilename;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ------------------------- Thanh công cụ ------------------------- */}
      {hasToolbar ? (
        <div className="no-print flex flex-col gap-2 lg:flex-row lg:items-center">
          {searchFields ? (
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm…"
                className="pl-9"
                aria-label="Tìm kiếm trong bảng"
              />
            </div>
          ) : null}
          {filters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              {filters.map((f) => (
                <Select
                  key={f.key}
                  value={filterValues[f.key] ?? ''}
                  onChange={(e) => setFilterValues((s) => ({ ...s, [f.key]: e.target.value }))}
                  className="h-9 w-auto min-w-[10rem] text-xs"
                  aria-label={`Lọc theo ${f.label}`}
                >
                  <option value="">{f.label}: Tất cả</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2 lg:ml-auto">
            {toolbarExtra}
            {exportFilename ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportRowsToExcel(
                    exportFilename,
                    columns.map((c) => c.header),
                    sorted.map((r) => columns.map((c) => {
                      if (c.exportValue) return c.exportValue(r);
                      const raw = (r as Record<string, unknown>)[c.key];
                      return raw == null ? '' : (raw as string | number);
                    })),
                  )
                }
              >
                <FileSpreadsheet className="h-4 w-4" /> Xuất Excel
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* --------------------------------- Bảng --------------------------------- */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className={cn('whitespace-nowrap px-3 py-2.5 font-semibold first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5', c.noPrint && 'no-print', c.className)}>
                  {c.sortable ? (
                    <button type="button" onClick={() => toggleSort(c)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
              {actions ? <th className="no-print w-12 whitespace-nowrap px-3 py-2.5 text-center font-semibold">{actionsHeader}</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-2.5">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="p-0">
                  <EmptyState title={emptyTitle} hint={emptyHint} />
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={rowKey(row)} className="border-b transition-colors last:border-0 hover:bg-accent/40">
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-3 py-2.5 align-middle first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5', c.noPrint && 'no-print', c.className)}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                    </td>
                  ))}
                  {actions ? (
                    <td className="no-print px-3 py-2 text-center">
                      <ActionsCell items={actions(row)} rowLabel={`dòng ${(row as Record<string, unknown>).id ?? ''}`} />
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------- Phân trang ------------------------------- */}
      <div className="no-print flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span>Hiển thị {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} / {sorted.length} dòng</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-8 w-auto text-xs"
            aria-label="Số dòng mỗi trang"
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} dòng/trang</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Trang trước">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[5rem] text-center text-xs">Trang {safePage}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Trang sau">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
