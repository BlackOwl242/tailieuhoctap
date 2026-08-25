'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FileText, FolderOpen, Search, User } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Global search (Mục 7) — thanh tìm kiếm cố định trên header:
 * - Tìm nhanh NHÂN VIÊN + TÀI LIỆU + BÀI VIẾT song song (debounce 250ms);
 * - Kết quả phân nhóm theo loại, giới hạn 5 nhóm/khối;
 * - Điều hướng bàn phím: ↑/↓ di chuyển, Enter mở, Esc đóng.
 */
interface SearchHit {
  group: 'Nhân viên' | 'Tài liệu' | 'Bài viết';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [term, setTerm] = React.useState('');
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);
  // Panel kết quả được render qua createPortal vào document.body — nằm NGOÀI
  // boxRef, nên phải có ref riêng để outside-click không đóng nhầm panel trước
  // khi sự kiện click trên kết quả kịp chạy (lỗi "không bấm được kết quả").
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce tìm kiếm
  React.useEffect(() => {
    const q = term.trim();
    if (q.length < 2) { setHits([]); setOpen(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const [emps, docs, arts] = await Promise.all([
          api.get<Array<{ id: string; fullName: string; employeeCode: string | null; jobTitle: string | null }>>('/employees').then((r) => r.data).catch(() => []),
          api.get<Array<{ id: string; title: string; processArea: string | null }>>('/documents').then((r) => r.data).catch(() => []),
          api.get<{ items: Array<{ id: string; title: string; space: { name: string } }> }>('/search', { params: { q } }).then((r) => r.data.items).catch(() => []),
        ]);
        const ql = q.toLowerCase();
        const out: SearchHit[] = [];
        for (const e of emps) {
          if (out.filter((h) => h.group === 'Nhân viên').length >= 5) break;
          if (`${e.fullName} ${e.employeeCode ?? ''} ${e.jobTitle ?? ''}`.toLowerCase().includes(ql)) {
            out.push({ group: 'Nhân viên', icon: User, title: e.fullName, subtitle: `${e.employeeCode ?? ''}${e.jobTitle ? ` · ${e.jobTitle}` : ''}`, href: `/employees/${e.id}` });
          }
        }
        for (const d of docs) {
          if (out.filter((h) => h.group === 'Tài liệu').length >= 5) break;
          if (`${d.title} ${d.processArea ?? ''}`.toLowerCase().includes(ql)) {
            out.push({ group: 'Tài liệu', icon: FolderOpen, title: d.title, subtitle: d.processArea ?? 'Tài liệu nội bộ', href: '/documents' });
          }
        }
        for (const a of (arts ?? []).slice(0, 5)) {
          out.push({ group: 'Bài viết', icon: FileText, title: a.title, subtitle: a.space.name, href: `/articles/${a.id}` });
        }
        setHits(out);
        setActive(0);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term]);

  // Đóng khi click ngoài; phím tắt Ctrl/Cmd+K focus
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Bỏ qua nếu click bên trong ô tìm kiếm HOẶC trong panel kết quả (portal)
      if (boxRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || hits.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[active];
      if (hit) { setOpen(false); setTerm(''); router.push(hit.href); }
    } else if (e.key === 'Escape') setOpen(false);
  }

  let lastGroup = '';

  return (
    /* Giới hạn bề rộng thanh tìm kiếm (Mục 9) — không kéo dài hết topbar;
     * trong drawer mobile vẫn full-width nhờ w-full */
    <div ref={boxRef} className="relative min-w-0 w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Tìm nhân viên, tài liệu, bài viết…  (Ctrl+K)"
        aria-label="Tìm kiếm toàn hệ thống"
        className="h-9 w-full rounded-md border border-input bg-background/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open
        ? createPortal(
            <div
              ref={panelRef}
              style={{ top: boxRef.current ? boxRef.current.getBoundingClientRect().bottom + 6 : 0, left: boxRef.current ? boxRef.current.getBoundingClientRect().left : 0, width: boxRef.current ? boxRef.current.getBoundingClientRect().width : 384 }}
              className="fixed z-dropdown max-h-[24rem] overflow-y-auto rounded-lg border bg-card py-1 shadow-lg animate-fade-in"
              role="listbox"
            >
              {loading ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Đang tìm…</p>
              ) : hits.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy kết quả phù hợp.</p>
              ) : (
                hits.map((h, i) => {
                  const header = h.group !== lastGroup ? h.group : null;
                  lastGroup = h.group;
                  return (
                    <React.Fragment key={`${h.group}-${h.href}-${i}`}>
                      {header ? (
                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{header}</p>
                      ) : null}
                      <button
                        role="option"
                        aria-selected={i === active}
                        className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm', i === active ? 'bg-accent' : 'hover:bg-accent/60')}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => { setOpen(false); setTerm(''); router.push(h.href); }}
                      >
                        <h.icon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{h.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{h.subtitle}</span>
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
