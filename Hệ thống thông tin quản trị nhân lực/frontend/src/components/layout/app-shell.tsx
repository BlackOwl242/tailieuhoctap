'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft, BookOpenText, Briefcase, CalendarDays, ClipboardCheck, Clock4, FolderOpen,
  GraduationCap, LayoutDashboard, LogOut, Settings, ShieldCheck, UserCircle2,
  Users, Wallet, Bell, Menu, X, FileSpreadsheet, TrendingUp, FileText, Layers,
  ChevronDown, ChevronRight, UserCheck, Receipt, Target, Calculator, Timer, Building2,
  Network, CreditCard, Laptop, Search, Sparkles
} from 'lucide-react';
import { GlobalSearch } from '@/components/layout/global-search';
import { CommandPalette } from '@/components/layout/command-palette';
import { cn } from '@/lib/utils';
import { useAuthStore, type AuthState } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { PageContainer } from './page-container';
import type { MeProfile } from '@/lib/types';

/**
 * Điều hướng chính theo nhóm nghiệp vụ Quản trị Nhân lực Đa năng (Chuẩn Frappe HRMS & BLLĐ 2019)
 */
const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard; roles?: string[] }[] }[] = [
  {
    label: 'Cổng Tự Phục Vụ',
    items: [
      { href: '/ess', label: 'Bàn làm việc ESS', icon: UserCheck },
      { href: '/dashboard', label: 'Tổng quan Hệ thống', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Nhân sự & Cơ cấu',
    items: [
      { href: '/org-chart', label: 'Sơ đồ tổ chức động', icon: Network },
      { href: '/employees', label: 'Danh sách nhân sự', icon: Users },
      { href: '/personnel-profiles', label: 'Hồ sơ toàn diện (2C)', icon: FileText },
      { href: '/assets', label: 'Tài sản & Thiết bị', icon: Laptop },
      { href: '/lifecycle', label: 'Vòng đời & Quyết định', icon: ArrowRightLeft },
      { href: '/salary-ranks', label: 'Ngạch bậc lương', icon: Layers },
      { href: '/salary-progression', label: 'Nâng bậc lương', icon: TrendingUp, roles: ['ADMIN', 'KM_MANAGER'] },
    ],
  },
  {
    label: 'Ca kíp & Chấm công',
    items: [
      { href: '/shifts', label: 'Ca kíp & Bảng phân ca', icon: Clock4 },
      { href: '/attendance', label: 'Bảng chấm công', icon: ShieldCheck },
      { href: '/leave', label: 'Nghỉ phép (Điều 113)', icon: CalendarDays },
      { href: '/overtime', label: 'Làm thêm giờ (Điều 98)', icon: Timer },
    ],
  },
  {
    label: 'Tiền lương & Chi phí',
    items: [
      { href: '/payroll-engine', label: 'Bảng lương Tự động', icon: Calculator },
      { href: '/loans', label: 'Khoản vay & Tạm ứng', icon: CreditCard },
      { href: '/expense-claims', label: 'Công tác & Chi phí', icon: Receipt },
      { href: '/payroll', label: 'Lương truyền thống', icon: Wallet },
    ],
  },
  {
    label: 'Tuyển dụng & Hiệu suất',
    items: [
      { href: '/recruitment-ats', label: 'Tuyển dụng ATS Kanban', icon: Briefcase },
      { href: '/performance-360', label: 'Đánh giá 360 & KRA', icon: Target },
      { href: '/training-grievance', label: 'Đào tạo & Khiếu nại', icon: GraduationCap },
    ],
  },
  {
    label: 'Báo cáo & Tri thức',
    items: [
      { href: '/personnel-reports', label: 'Trung tâm báo cáo 2C', icon: FileSpreadsheet, roles: ['ADMIN', 'KM_MANAGER'] },
      { href: '/spaces', label: 'Không gian tri thức', icon: BookOpenText },
      { href: '/documents', label: 'Tài liệu nhân sự', icon: FolderOpen },
      { href: '/review', label: 'Phê duyệt tập trung', icon: ClipboardCheck },
    ],
  },
];

const ADMIN_NAV = [
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/org-units', label: 'Cơ cấu tổ chức' },
  { href: '/admin/attendance', label: 'Thiết bị chấm công' },
  { href: '/admin/settings', label: 'Cấu hình' },
  { href: '/admin/audit', label: 'Nhật ký kiểm toán' },
];

export function AppShell({ profile, children }: { profile: MeProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const clear = useAuthStore((s: AuthState) => s.clear);
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups((prev: Record<string, boolean>) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  async function logout() {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignored
    }
    clear();
    await queryClient.cancelQueries();
    queryClient.clear();
    queryClient.removeQueries();
    window.location.replace('/login');
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(({ roles }) => !roles || roles.some((r) => profile.roles.includes(r))),
    }))
    .filter((group) => group.items.length > 0);

  const renderNavGroup = (group: (typeof visibleGroups)[0]) => {
    const isCollapsed = !!collapsedGroups[group.label];
    return (
      <div key={group.label} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(group.label)}
          className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 rounded-md transition-colors"
        >
          <span className="flex items-center gap-1.5">
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
            )}
            {group.label}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
            {group.items.length}
          </span>
        </button>

        {!isCollapsed && (
          <div className="space-y-0.5 pl-1 animate-in fade-in duration-100">
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isActive(href)
                    ? 'bg-primary/10 text-primary font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive(href) ? 'text-primary' : 'text-muted-foreground/70')} />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const navLinks = (
    <nav className="flex flex-col gap-3">
      {visibleGroups.map((group) => renderNavGroup(group))}

      {profile.roles.includes('ADMIN') ? (
        <div className="space-y-0.5 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => toggleGroup('Quản trị')}
            className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 rounded-md transition-colors"
          >
            <span className="flex items-center gap-1.5">
              {collapsedGroups['Quản trị'] ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
              )}
              Quản trị hệ thống
            </span>
            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
              {ADMIN_NAV.length}
            </span>
          </button>

          {!collapsedGroups['Quản trị'] && (
            <div className="space-y-0.5 pl-1 animate-in fade-in duration-100">
              {ADMIN_NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isActive(href)
                      ? 'bg-primary/10 text-primary font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Universal Command Palette (Ctrl+K) */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* ================= SIDEBAR (≥md) ================= */}
      <aside className="fixed inset-y-0 left-0 z-sidebar hidden w-64 flex-col border-r border-border/60 bg-card md:flex">
        {/* Header Logo */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 bg-card">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-tight">HRMIS Pro</span>
              <span className="text-[10px] text-muted-foreground font-medium leading-tight">Quản trị Nhân lực VN</span>
            </div>
          </Link>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
            v16.0
          </span>
        </div>

        {/* Danh sách Menu cuộn mượt */}
        <div className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          {navLinks}
        </div>

        {/* Footer Sidebar */}
        <div className="border-t border-border/50 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/10">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground/80">Trực tuyến</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/70">BLLĐ 2019</span>
        </div>
      </aside>

      {/* ================= TOPBAR (sticky, mọi màn hình) ================= */}
      <header className="sticky top-0 z-sticky border-b border-border/60 bg-card/80 backdrop-blur-md md:pl-64">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button className="rounded-md p-1.5 hover:bg-accent md:hidden text-muted-foreground" onClick={() => setMobileNavOpen(true)} aria-label="Mở menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <Building2 className="h-5 w-5 text-foreground" />
            <span className="font-bold text-sm">HRMIS</span>
          </Link>

          {/* Tìm kiếm toàn hệ thống & Command Launcher */}
          <div className="hidden md:flex items-center max-w-md w-full mr-auto">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Tìm kiếm nhân viên, chức năng, tạo đơn từ...</span>
              </span>
              <kbd className="inline-flex items-center rounded border border-border/80 bg-card px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Cụm hành động phải: thông báo + hồ sơ */}
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/notifications"
              className={cn(
                'rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors',
                isActive('/notifications') && 'text-primary bg-primary/10',
              )}
              aria-label="Thông báo"
            >
              <Bell className="h-4 w-4" />
            </Link>

            <div className="h-4 w-px bg-border/60 mx-1" />

            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60 transition-colors"
              aria-label="Hồ sơ cá nhân"
            >
              <UserCircle2 className="h-6 w-6 text-muted-foreground/80" />
              <span className="hidden min-w-0 lg:block text-left">
                <span className="block max-w-[9rem] truncate text-xs font-semibold text-foreground leading-tight">{profile.fullName}</span>
                <span className="block text-[10px] leading-tight text-muted-foreground">{profile.jobTitle ?? profile.email}</span>
              </span>
            </Link>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= DRAWER mobile nav (overlay + panel) ================= */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-overlay md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-card p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="font-bold text-sm">HRMIS</span>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Đóng menu" className="rounded-md p-1.5 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-3 px-1">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  setCommandPaletteOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
              >
                <span>Tìm kiếm nhanh...</span>
                <kbd className="text-[10px] font-mono">⌘K</kbd>
              </button>
            </div>
            {navLinks}
            <Link href="/profile" onClick={() => setMobileNavOpen(false)} className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent">
              <Settings className="h-4 w-4" /> Hồ sơ cá nhân
            </Link>
          </div>
        </div>
      ) : null}

      {/* ================= NỘI DUNG ================= */}
      <main className="md:pl-64 overflow-x-clip min-h-[calc(100dvh-3.5rem)]">
        <div className="px-4 py-5 sm:px-6 lg:px-8 pb-20 md:pb-12">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>

      {/* ================= BOTTOM NAV (mobile) ================= */}
      <nav className="fixed inset-x-0 bottom-0 z-sticky grid grid-cols-5 border-t border-border/60 bg-card/90 backdrop-blur-md md:hidden">
        {[
          { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
          { href: '/org-chart', label: 'Tổ chức', icon: Network },
          { href: '/ess', label: 'Cá nhân', icon: UserCheck },
          { href: '/attendance', label: 'Chấm công', icon: ShieldCheck },
          { href: '/payroll-engine', label: 'Lương', icon: Calculator },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn('flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium', isActive(href) ? 'text-primary' : 'text-muted-foreground')}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
