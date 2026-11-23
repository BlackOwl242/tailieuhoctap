'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Home, Users, Clock4, Wallet, FolderOpen,
  Search, PanelLeftClose, PanelLeft, Folder, FolderClosed,
  FileText, X, Bell, UserCircle2, LogOut, Menu, Tag,
} from 'lucide-react';
import { CommandPalette } from '@/components/layout/command-palette';
import { GlobalSearch } from '@/components/layout/global-search';
import { cn, matchesSearch } from '@/lib/utils';
import { useAuthStore, type AuthState } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { PageContainer } from './page-container';
import type { MeProfile } from '@/lib/types';
import { useOrgConfig } from '@/lib/org-config';
import { DOMAINS, getAvailableDomains, resolveDomainIdForRoute } from '@/lib/navigation';

/** Biểu tượng hình học tối giản 3 khối isometric (Tri-cube Geometric Logo). */
function GeometricCubeLogo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 2L19.5 5.2V11.5L14 14.7L8.5 11.5V5.2L14 2Z" fill="currentColor" />
      <path d="M14 2L19.5 5.2L14 8.4L8.5 5.2L14 2Z" fill="currentColor" opacity="0.9" />
      <path d="M8.5 5.2L14 8.4V14.7L8.5 11.5V5.2Z" fill="currentColor" opacity="0.75" />
      <path d="M14 8.4L19.5 5.2V11.5L14 14.7V8.4Z" fill="currentColor" opacity="0.6" />

      <path d="M7 13.5L12.5 16.7V23L7 26.2L1.5 23V16.7L7 13.5Z" fill="currentColor" />
      <path d="M7 13.5L12.5 16.7L7 19.9L1.5 16.7L7 13.5Z" fill="currentColor" opacity="0.9" />
      <path d="M1.5 16.7L7 19.9V26.2L1.5 23V16.7Z" fill="currentColor" opacity="0.75" />
      <path d="M7 19.9L12.5 16.7V23L7 26.2V19.9Z" fill="currentColor" opacity="0.6" />

      <path d="M21 13.5L26.5 16.7V23L21 26.2L15.5 23V16.7L21 13.5Z" fill="currentColor" />
      <path d="M21 13.5L26.5 16.7L21 19.9L15.5 16.7L21 13.5Z" fill="currentColor" opacity="0.9" />
      <path d="M15.5 16.7L21 19.9V26.2L15.5 23V16.7Z" fill="currentColor" opacity="0.75" />
      <path d="M21 19.9L26.5 16.7V23L21 26.2V19.9Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function AppShell({ profile, children }: { profile: MeProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const clear = useAuthStore((s: AuthState) => s.clear);
  const queryClient = useQueryClient();
  const [orgConfig] = useOrgConfig();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [subSidebarOpen, setSubSidebarOpen] = useState(true);
  const [subSidebarSearch, setSubSidebarSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders');

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'ws-general': true,
    'pers-records': true,
    'pers-movements': true,
    'time-attendance': true,
    'time-leave': true,
    'comp-payroll': true,
    'comp-benefits': true,
    'talent-recruitment': true,
    'talent-growth': true,
    'docs-vault': true,
    'docs-analytics': true,
    'admin-users': true,
    'admin-system': true,
  });

  const availableDomains = useMemo(
    () => getAvailableDomains(profile.roles, orgConfig),
    [profile.roles, orgConfig],
  );

  const activeDomainIdFromPath = useMemo(
    () => resolveDomainIdForRoute(availableDomains, pathname, searchParams),
    [availableDomains, pathname, searchParams],
  );

  const [selectedDomainId, setSelectedDomainId] = useState<string>(activeDomainIdFromPath);

  useEffect(() => {
    setSelectedDomainId(activeDomainIdFromPath);
  }, [activeDomainIdFromPath]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hrmis_subsidebar_open');
      if (saved !== null) {
        setSubSidebarOpen(saved === 'true');
      }
    } catch {
      // Ignored
    }
  }, []);

  // Phím tắt Ctrl+Shift+K mở bảng điều hướng chức năng nhanh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleSubSidebar = () => {
    const nextState = !subSidebarOpen;
    setSubSidebarOpen(nextState);
    try {
      localStorage.setItem('hrmis_subsidebar_open', String(nextState));
    } catch {
      // Ignored
    }
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  async function logout() {
    try {
      await api.post('/auth/logout', {}, { headers: { 'X-Auth-Transport': 'cookie' } });
    } catch {
      // Ignored
    }
    clear();
    await queryClient.cancelQueries();
    queryClient.clear();
    queryClient.removeQueries();
    window.location.replace('/login');
  }

  const activeDomain = useMemo(() => {
    return availableDomains.find((d) => d.id === selectedDomainId) || availableDomains[0] || DOMAINS[0];
  }, [availableDomains, selectedDomainId]);

  const isLinkActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      const params = new URLSearchParams(query);
      let match = true;
      params.forEach((v, k) => {
        if (searchParams.get(k) !== v) match = false;
      });
      return match;
    }
    const tab = searchParams.get('tab');
    if (href === '/payroll-engine') {
      return pathname === href && (!tab || tab === 'runs');
    }
    if (href === '/performance') {
      return pathname === href && (!tab || tab === 'goals' || tab === 'overview' || tab === 'calibration' || tab === 'cycles');
    }
    if (href === '/knowledge') {
      return pathname === href && (!tab || tab === 'spaces' || tab === 'search' || tab === 'experts');
    }
    if (href === '/employees') {
      return (pathname === href && tab !== 'approvals') || pathname.startsWith('/employees/');
    }
    if (href === '/hr-workflows') {
      return pathname === href && tab !== 'correction';
    }
    if (href === '/dashboard' || href === '/ess') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isSearchingAllDomains = subSidebarSearch.trim().length > 0;

  // Khi đang gõ tìm kiếm, tìm xuyên toàn bộ phân hệ mà người dùng có quyền (không dấu)
  const searchMatchedDomains = useMemo(() => {
    const q = subSidebarSearch.trim();
    if (!q) return [];
    return availableDomains
      .map((domain) => ({
        domain,
        items: domain.folders.flatMap((folder) =>
          folder.items
            .filter((item) =>
              matchesSearch(
                q,
                item.label,
                folder.label,
                domain.label,
                ...(item.keywords ?? []),
                ...(item.subItems?.map((sub) => sub.label) ?? []),
              ),
            )
            .map((item) => ({ ...item, folderLabel: folder.label })),
        ),
      }))
      .filter((entry) => entry.items.length > 0);
  }, [availableDomains, subSidebarSearch]);

  const matchedTagsAcrossDomains = useMemo(() => {
    const q = subSidebarSearch.trim();
    if (!q) {
      return activeDomain.tags.map((tag) => ({ ...tag, domainLabel: activeDomain.shortLabel }));
    }
    return availableDomains.flatMap((domain) =>
      domain.tags
        .filter((tag) => matchesSearch(q, tag.label, domain.label))
        .map((tag) => ({ ...tag, domainLabel: domain.shortLabel })),
    );
  }, [activeDomain, availableDomains, subSidebarSearch]);

  const hasEmployeeDirectory = profile?.roles?.some((r) =>
    ['ADMIN', 'KM_MANAGER', 'BOD', 'LINE_MANAGER', 'HR_CB', 'HR_RECRUITER', 'HR_TRAINER', 'AUDITOR'].includes(r),
  );
  const mobileBottomItems = [
    { href: '/dashboard', label: 'Tổng quan', icon: Home },
    { href: '/ess', label: 'Cá nhân', icon: UserCircle2 },
    { href: '/attendance', label: 'Chấm công', icon: Clock4 },
    { href: '/documents', label: 'Tài liệu', icon: FolderOpen },
    hasEmployeeDirectory
      ? { href: '/employees', label: 'Nhân sự', icon: Users }
      : { href: '/my-payslips', label: 'Phiếu lương', icon: Wallet },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased selection:bg-primary/20">
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} userRoles={profile?.roles || []} />

      {/* TIER 1: PRIMARY ICON RAIL */}
      <aside
        className="fixed inset-y-0 left-0 z-sidebar hidden w-[72px] flex-col items-center justify-between border-r border-border/60 bg-card py-3 md:flex"
        aria-label="Cột điều hướng phân hệ chính"
      >
        <div className="flex flex-col items-center">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring"
            title="HRMIS Pro — Bàn điều khiển trung tâm"
          >
            <GeometricCubeLogo className="h-6 w-6 text-foreground" />
          </Link>
        </div>

        <div className="my-auto flex flex-col items-center gap-1.5">
          {availableDomains.map((domain) => {
            const Icon = domain.icon;
            const isDomainActive = domain.id === activeDomain.id;

            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => {
                  setSelectedDomainId(domain.id);
                  setSubSidebarSearch('');
                  if (!subSidebarOpen) setSubSidebarOpen(true);
                }}
                aria-label={domain.label}
                title={domain.label}
                className={cn(
                  'group relative flex w-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring select-none',
                  isDomainActive
                    ? 'bg-muted/90 text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                <span className="max-w-[58px] truncate text-[10px] font-medium leading-none">
                  {domain.shortLabel}
                </span>

                {(!subSidebarOpen || domain.label !== domain.shortLabel) && (
                  <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-[80] whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl opacity-0 transition-opacity group-hover:opacity-100 border border-zinc-800">
                    {domain.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={toggleSubSidebar}
            title={subSidebarOpen ? 'Thu gọn cây phân mục' : 'Mở rộng cây phân mục'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring select-none"
          >
            <PanelLeft className={cn('h-4 w-4 transition-transform', !subSidebarOpen && 'rotate-180 text-primary')} />
          </button>

          <div className="h-px w-8 bg-border/60" />

          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring select-none"
            title={`Tài khoản: ${profile.fullName}`}
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      {/* TIER 2: SUB-SIDEBAR PANE */}
      <aside
        className={cn(
          'fixed inset-y-0 left-[72px] z-sidebar hidden flex-col border-r border-border/60 bg-card/95 backdrop-blur-xs transition-all duration-200 md:flex',
          subSidebarOpen ? 'w-64 opacity-100' : 'w-0 border-r-0 opacity-0 pointer-events-none overflow-hidden',
        )}
        aria-label="Cây thư mục chức năng"
      >
        <div className="flex h-full w-64 flex-col p-3.5 space-y-3">
          <div className="flex items-center justify-between pt-0.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[170px]" title={activeDomain.label}>
              {isSearchingAllDomains ? 'Tìm toàn hệ thống' : activeDomain.shortLabel}
            </h2>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={toggleSubSidebar}
                title="Thu gọn bảng điều hướng"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={subSidebarSearch}
              onChange={(e) => setSubSidebarSearch(e.target.value)}
              placeholder="Tìm chức năng mọi phân hệ..."
              aria-label="Tìm kiếm chức năng toàn hệ thống"
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-card border border-border/60 rounded-xl outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-border transition-all text-foreground placeholder:text-muted-foreground/70"
            />
            {subSidebarSearch && (
              <button
                type="button"
                onClick={() => setSubSidebarSearch('')}
                aria-label="Xóa tìm kiếm chức năng"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex rounded-xl bg-muted/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('folders')}
              className={cn(
                'flex-1 py-1 px-3 text-center rounded-lg font-medium transition-all text-xs outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none',
                activeTab === 'folders'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Chức năng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={cn(
                'flex-1 py-1 px-3 text-center rounded-lg font-medium transition-all text-xs outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none',
                activeTab === 'tags'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Thẻ & Phân loại
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            {activeTab === 'folders' ? (
              isSearchingAllDomains ? (
                <div className="space-y-3 pt-1">
                  {searchMatchedDomains.map(({ domain, items }) => (
                    <div key={domain.id} className="space-y-1">
                      <p className="px-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {domain.label}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const active = isLinkActive(item.href);
                          return (
                            <Link
                              key={`${domain.id}-${item.href}`}
                              href={item.href}
                              onClick={() => setSubSidebarSearch('')}
                              className={cn(
                                'flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors',
                                active
                                  ? 'bg-muted/90 text-foreground font-semibold shadow-xs'
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-foreground' : 'text-muted-foreground/70')} />
                                <span className="truncate">{item.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {searchMatchedDomains.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Không tìm thấy chức năng phù hợp.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {activeDomain.folders.map((folder) => {
                    const isOpen = openFolders[folder.id] ?? true;

                    return (
                      <div key={folder.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleFolder(folder.id)}
                          className="group flex w-full items-center justify-between py-1 px-1.5 rounded-lg text-xs font-semibold text-foreground/90 hover:bg-muted/50 transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 active:outline-none select-none"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isOpen ? (
                              <Folder className="h-4 w-4 shrink-0 fill-foreground text-foreground" />
                            ) : (
                              <FolderClosed className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate">{folder.label}</span>
                          </div>
                          {folder.count !== undefined && (
                            <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0 group-hover:bg-muted">
                              {folder.count}
                            </span>
                          )}
                        </button>

                        {isOpen && folder.items.length > 0 && (
                          <div className="relative ml-3 pl-3.5 border-l border-border/70 space-y-1 py-0.5 animate-in fade-in duration-150">
                            {folder.items.map((item) => {
                              const active = isLinkActive(item.href);

                              return (
                                <div key={item.href} className="relative space-y-0.5">
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -left-3.5 top-3.5 h-px w-2.5 bg-border/70"
                                  />
                                  <Link
                                    href={item.href}
                                    className={cn(
                                      'group relative flex items-center justify-between py-1 px-2 rounded-lg text-xs transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 active:outline-none select-none',
                                      active
                                        ? 'bg-muted/90 text-foreground font-semibold shadow-xs'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                    )}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileText className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-foreground' : 'text-muted-foreground/70')} />
                                      <span className="truncate">{item.label}</span>
                                    </div>
                                    {item.badge !== undefined && (
                                      <span className="shrink-0 pl-2 text-[10px] text-muted-foreground">
                                        {item.badge}
                                      </span>
                                    )}
                                  </Link>

                                  {item.subItems && (
                                    <div className="relative ml-2.5 pl-3 border-l border-border/50 space-y-0.5">
                                      {item.subItems.map((sub) => {
                                        const subActive = pathname === sub.href;
                                        return (
                                          <div key={sub.label} className="relative">
                                            <span
                                              aria-hidden="true"
                                              className="pointer-events-none absolute -left-3 top-2.5 h-px w-2 bg-border/50"
                                            />
                                            <Link
                                              href={sub.href}
                                              className={cn(
                                                'relative flex items-center justify-between py-0.5 px-2 rounded-md text-[11px] transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 active:outline-none select-none',
                                                subActive
                                                  ? 'text-foreground font-semibold bg-muted/60'
                                                  : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted/30',
                                              )}
                                            >
                                              <span className="truncate">{sub.label}</span>
                                              {sub.badge && (
                                                <span className="text-[9px] text-muted-foreground">{sub.badge}</span>
                                              )}
                                            </Link>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="space-y-1.5 pt-1">
                {matchedTagsAcrossDomains.map((tag) => (
                  <Link
                    key={`${tag.domainLabel}-${tag.id}`}
                    href={tag.href}
                    onClick={() => isSearchingAllDomains && setSubSidebarSearch('')}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 group-hover:text-foreground" />
                      <span className="font-medium truncate">{tag.label}</span>
                    </div>
                    {isSearchingAllDomains ? (
                      <span className="text-[10px] text-muted-foreground shrink-0">{tag.domainLabel}</span>
                    ) : tag.count !== undefined ? (
                      <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                        {tag.count}
                      </span>
                    ) : null}
                  </Link>
                ))}
                {matchedTagsAcrossDomains.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Không tìm thấy thẻ phù hợp.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* TOPBAR */}
      <header
        className={cn(
          'sticky top-0 z-sticky flex h-14 items-center justify-between border-b border-border/60 bg-card/80 px-4 backdrop-blur-md transition-all duration-200 sm:px-6',
          subSidebarOpen ? 'md:ml-[328px]' : 'md:ml-[72px]',
        )}
      >
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-1.5 hover:bg-accent md:hidden text-muted-foreground outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 md:hidden outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none">
            <GeometricCubeLogo className="h-5 w-5 text-foreground" />
            <span className="font-bold text-sm">HRMIS</span>
          </Link>

          {!subSidebarOpen && (
            <button
              onClick={() => setSubSidebarOpen(true)}
              title="Mở thanh điều hướng phụ"
              className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50 shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center px-4 max-w-xl mx-auto">
          <div className="flex w-full items-center gap-2">
            <GlobalSearch userRoles={profile?.roles || []} />
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="shrink-0 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Mở danh mục chức năng"
              title="Mở danh mục chức năng (Ctrl+Shift+K)"
            >
              Chức năng
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/notifications"
            className={cn(
              'rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none',
              isLinkActive('/notifications') && 'text-primary bg-primary/10',
            )}
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <div className="h-4 w-px bg-border mx-1" />

          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60 transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none"
            aria-label="Hồ sơ cá nhân"
          >
            <UserCircle2 className="h-6 w-6 text-muted-foreground/80" />
            <span className="hidden min-w-0 lg:block text-left">
              <span className="block max-w-[9rem] truncate text-xs font-semibold text-foreground leading-tight">
                {profile.fullName}
              </span>
              <span className="block text-[11px] leading-tight text-muted-foreground truncate">
                {profile.jobTitle ?? profile.email}
              </span>
            </span>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none"
            aria-label="Đăng xuất"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </header>

      {/* DRAWER MOBILE NAV */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-overlay md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
          <div
            className="absolute inset-y-0 left-0 w-80 max-w-[90%] overflow-y-auto bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GeometricCubeLogo className="h-6 w-6 text-foreground" />
                <span className="font-bold text-sm">HRMIS Pro</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Đóng menu"
                className="rounded-md p-1.5 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-3 space-y-2">
              <GlobalSearch userRoles={profile?.roles || []} onNavigate={() => setMobileNavOpen(false)} />
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setCommandPaletteOpen(true);
                }}
                className="w-full rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
              >
                Mở danh mục chức năng
              </button>
            </div>
            <div className="space-y-4">
              {availableDomains.map((domain) => (
                <div key={domain.id} className="space-y-1">
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {domain.label}
                  </p>
                  <div className="space-y-0.5">
                    {domain.folders
                      .flatMap((f) => f.items)
                      .map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                            isLinkActive(item.href)
                              ? 'bg-muted text-foreground font-semibold'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="pl-2 text-[10px] text-muted-foreground">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border/60 pt-3">
              <Link
                href="/profile"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs hover:bg-accent"
              >
                <UserCircle2 className="h-4 w-4" /> Hồ sơ cá nhân
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* WORKSPACE CANVAS */}
      <main
        className={cn(
          'overflow-x-clip min-h-[calc(100dvh-3.5rem)] transition-[padding] duration-200',
          subSidebarOpen ? 'md:pl-[328px]' : 'md:pl-[72px]',
        )}
      >
        <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 pb-20 md:pb-12">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed inset-x-0 bottom-0 z-sticky grid grid-cols-5 border-t border-border/60 bg-card/90 backdrop-blur-md md:hidden">
        {mobileBottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              isLinkActive(href) ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
