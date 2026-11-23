'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FolderOpen, Search, User, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { getSearchableNavItems } from '@/lib/navigation';
import { useOrgConfig } from '@/lib/org-config';
import { cn, matchesSearch } from '@/lib/utils';

interface SearchHit {
  group: 'Chức năng' | 'Nhân viên' | 'Tài liệu' | 'Tri thức';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
}

interface GlobalKnowledgeHit {
  id: string;
  title: string;
  summary?: string | null;
  space?: { name?: string | null } | null;
  authorName?: string | null;
}

interface GlobalEmployeeRow {
  id: string;
  fullName: string;
  employeeCode: string | null;
  email?: string | null;
  jobTitle: string | null;
  orgUnit?: { name?: string | null } | null;
}

interface GlobalDocumentRow {
  id: string;
  title: string;
  description?: string | null;
  processArea: string | null;
  tags?: string[];
}

const EMPLOYEE_DIRECTORY_ROLES = [
  'ADMIN', 'KM_MANAGER', 'BOD', 'LINE_MANAGER', 'HR_CB', 'HR_RECRUITER', 'HR_TRAINER', 'AUDITOR',
];

/**
 * Global search trên topbar: tìm đồng thời Chức năng/Trang + Nhân viên + Tài liệu (hỗ trợ gõ tiếng Việt không dấu).
 */
export function GlobalSearch({ userRoles: propRoles, onNavigate }: { userRoles?: string[]; onNavigate?: () => void }) {
  const router = useRouter();
  const storeRoles = useAuthStore((s) => s.user?.roles ?? []);
  const userRoles = propRoles ?? storeRoles;
  const [orgConfig] = useOrgConfig();
  const canViewEmployees = userRoles.some((r) => EMPLOYEE_DIRECTORY_ROLES.includes(r));

  const [term, setTerm] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const boxRef = React.useRef<HTMLDivElement>(null);
  // Panel kết quả render qua portal nên giữ ref riêng để click không bị outside-click đóng sớm.
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const q = term.trim();
  const shouldFetchData = open || q.length >= 2;

  const employeesQuery = useQuery({
    queryKey: ['global-search-employees'],
    queryFn: async () => (await api.get<GlobalEmployeeRow[]>('/employees')).data,
    enabled: canViewEmployees && shouldFetchData,
    staleTime: 60_000,
    retry: false,
  });

  const documentsQuery = useQuery({
    queryKey: ['global-search-documents'],
    queryFn: async () => (await api.get<GlobalDocumentRow[]>('/documents')).data,
    enabled: shouldFetchData,
    staleTime: 60_000,
    retry: false,
  });

  const knowledgeQuery = useQuery({
    queryKey: ['global-search-knowledge', q],
    queryFn: async () => (await api.get<{ items: GlobalKnowledgeHit[] }>('/search', { params: { q, limit: 5 } })).data.items,
    enabled: q.length >= 2,
    staleTime: 30_000,
    retry: false,
  });

  const navItems = React.useMemo(
    () => getSearchableNavItems(userRoles, orgConfig),
    [userRoles, orgConfig],
  );

  const hits = React.useMemo<SearchHit[]>(() => {
    if (q.length < 1) return [];
    const out: SearchHit[] = [];

    // 1. Chức năng / Trang (tức thì từ registry, gõ từ 1 ký tự)
    let navCount = 0;
    for (const item of navItems) {
      if (navCount >= 6) break;
      if (matchesSearch(q, item.label, item.domainLabel, item.folderLabel, ...item.keywords)) {
        out.push({
          group: 'Chức năng',
          icon: item.icon,
          title: item.label,
          subtitle: `${item.domainLabel} › ${item.folderLabel}`,
          href: item.href,
        });
        navCount += 1;
      }
    }

    if (q.length >= 2) {
      // 2. Nhân viên (lọc không dấu xuyên họ tên, mã NV, email, chức danh, đơn vị)
      if (canViewEmployees) {
        let empCount = 0;
        for (const e of employeesQuery.data ?? []) {
          if (empCount >= 6) break;
          if (matchesSearch(q, e.fullName, e.employeeCode, e.email, e.jobTitle, e.orgUnit?.name)) {
            out.push({
              group: 'Nhân viên',
              icon: User,
              title: e.fullName,
              subtitle: [e.employeeCode, e.jobTitle, e.orgUnit?.name].filter(Boolean).join(' · ') || (e.email ?? ''),
              href: `/employees/${e.id}`,
            });
            empCount += 1;
          }
        }
      }

      // 3. Tài liệu (lọc không dấu xuyên tiêu đề, quy trình, mô tả, thẻ)
      let docCount = 0;
      for (const d of documentsQuery.data ?? []) {
        if (docCount >= 5) break;
        if (matchesSearch(q, d.title, d.processArea, d.description, ...(d.tags ?? []))) {
          out.push({
            group: 'Tài liệu',
            icon: FolderOpen,
            title: d.title,
            subtitle: d.processArea ?? 'Tài liệu nội bộ',
            href: `/documents?document=${d.id}`,
          });
          docCount += 1;
        }
      }

      // 4. Tri thức (KMS Full-Text Search trên PostgreSQL)
      for (const k of (knowledgeQuery.data ?? []).slice(0, 5)) {
        out.push({
          group: 'Tri thức',
          icon: BookOpen,
          title: k.title,
          subtitle: [k.space?.name, k.authorName].filter(Boolean).join(' · ') || 'Cổng tri thức KMS',
          href: `/knowledge?article=${k.id}`,
        });
      }
    }

    return out;
  }, [q, navItems, canViewEmployees, employeesQuery.data, documentsQuery.data, knowledgeQuery.data]);

  React.useEffect(() => {
    setActive(0);
    if (q.length >= 1) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [q]);

  // Đóng khi click ngoài; phím tắt Ctrl/Cmd+K focus ô tìm kiếm
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (boxRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function navigateTo(href: string) {
    setOpen(false);
    setTerm('');
    router.push(href);
    onNavigate?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || hits.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[active];
      if (hit) navigateTo(hit.href);
    }
  }

  const loading =
    q.length >= 2 &&
    (employeesQuery.isFetching || documentsQuery.isFetching || knowledgeQuery.isFetching) &&
    hits.length === 0;
  let lastGroup = '';
  const boxRect = typeof window !== 'undefined' && open ? boxRef.current?.getBoundingClientRect() : null;

  return (
    <div ref={boxRef} className="relative min-w-0 w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => q.length >= 1 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Tìm chức năng, nhân viên, tài liệu…  (Ctrl+K)"
        aria-label="Tìm kiếm toàn hệ thống"
        className="h-9 w-full rounded-md border border-input bg-background/60 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {term ? (
        <button
          type="button"
          onClick={() => { setTerm(''); setOpen(false); inputRef.current?.focus(); }}
          aria-label="Xóa từ khóa"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {open
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                top: boxRect ? boxRect.bottom + 6 : 56,
                left: boxRect ? boxRect.left : 16,
                width: boxRect ? boxRect.width : 384,
              }}
              className="fixed z-dropdown max-h-[26rem] overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-xl animate-fade-in"
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
                        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{header}</p>
                      ) : null}
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm', i === active ? 'bg-accent' : 'hover:bg-accent/60')}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => navigateTo(h.href)}
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
