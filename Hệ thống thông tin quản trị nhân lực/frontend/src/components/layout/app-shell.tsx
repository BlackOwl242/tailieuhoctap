'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft, BookOpenText, Briefcase, CalendarDays, ClipboardCheck, Clock4, FolderOpen,
  Gauge, GraduationCap, LayoutDashboard, LogOut, Search, Settings, ShieldCheck, UserCircle2,
  Users, Wallet, Bell, BookMarked, Menu, X,
} from 'lucide-react';
import { GlobalSearch } from '@/components/layout/global-search';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { PageContainer } from './page-container';
import type { MeProfile } from '@/lib/types';

/**
 * Điều hướng chính theo nhóm nghiệp vụ HRMIS (Mục 4 + Mục 5 — thuật ngữ chuẩn):
 * - "Chuyển giao tri thức" → "Bàn giao công việc";
 * - "Hộp duyệt" → "Phê duyệt"; "Chuyên gia" → "Tìm chuyên gia".
 */
/**
 * RBAC (Mục phân quyền): mỗi mục điều hướng có thể khai báo `roles` —
 * chỉ hiện với tài khoản có ít nhất một vai trò khớp. Không khai báo =
 * mọi người dùng đã đăng nhập đều thấy.
 */
const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard; roles?: string[] }[] }[] = [
  {
    label: 'Nhân sự',
    items: [
      { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { href: '/employees', label: 'Nhân sự', icon: Users },
      { href: '/attendance', label: 'Chấm công', icon: ShieldCheck },
      { href: '/leave', label: 'Nghỉ phép', icon: CalendarDays },
      { href: '/overtime', label: 'Làm thêm giờ', icon: Clock4 },
      { href: '/payroll', label: 'Lương', icon: Wallet },
      { href: '/performance', label: 'Đánh giá', icon: Gauge },
      { href: '/training', label: 'Đào tạo', icon: GraduationCap },
      { href: '/handover', label: 'Bàn giao công việc', icon: BookMarked },
      // API GET /personnel-actions chỉ dành cho ADMIN/KM_MANAGER → ẩn với nhân viên thường
      { href: '/personnel', label: 'Biến động nhân sự', icon: ArrowRightLeft, roles: ['ADMIN', 'KM_MANAGER'] },
    ],
  },
  {
    label: 'Tuyển dụng',
    items: [
      { href: '/recruitment', label: 'Tuyển dụng', icon: Briefcase },
    ],
  },
  {
    label: 'Cơ sở kiến thức',
    items: [
      { href: '/spaces', label: 'Không gian', icon: BookOpenText },
      { href: '/search', label: 'Tìm kiếm', icon: Search },
      { href: '/people', label: 'Tìm chuyên gia', icon: Users },
      { href: '/onboarding', label: 'Hội nhập', icon: GraduationCap },
      { href: '/documents', label: 'Tài liệu', icon: FolderOpen },
      { href: '/review', label: 'Phê duyệt', icon: ClipboardCheck },
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

/**
 * Khung ứng dụng responsive:
 * - Mobile (<md): Topbar sticky + BottomNav cố định đáy;
 * - ≥md: Sidebar cố định trái.
 * Tầng z-index dùng token: sticky header = z-sticky.
 */
export function AppShell({ profile, children }: { profile: MeProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /**
   * Đăng xuất SẠCH (Mục 3 — đăng xuất / đổi tài khoản):
   * 1) Thu hồi refresh token phía server (idempotent);
   * 2) Xóa token + user trong store VÀ key persist trong localStorage;
   * 3) Hủy request đang chạy + xóa toàn bộ cache React Query (chống lộ dữ liệu
   *    của tài khoản cũ cho tài khoản đăng nhập sau);
   * 4) Hard-reload về /login — full reload bảo đảm không còn state component cũ.
   */
  async function logout() {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // Server lỗi cũng vẫn xóa phiên cục bộ
    }
    clear();
    await queryClient.cancelQueries();
    queryClient.clear();
    queryClient.removeQueries();
    window.location.replace('/login');
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  /** Lọc mục điều hướng theo vai trò của tài khoản đang đăng nhập (RBAC). */
  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(({ roles }) => !roles || roles.some((r) => profile.roles.includes(r))),
    }))
    .filter((group) => group.items.length > 0);

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 mt-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
            {group.label}
          </p>
          {group.items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {/* Mục 9 — chỉ báo active dọc bên trái, chuẩn HRM quốc tế */}
              {isActive(href) ? <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-primary" aria-hidden /> : null}
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh">
      {/* ================= SIDEBAR (≥md) ================= */}
      <aside className="fixed inset-y-0 left-0 z-sticky hidden w-60 flex-col border-r bg-card px-3 py-4 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpenText className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight">HRMIS · STS</span>
        </Link>
        {navLinks}

        {/* Khu quản trị — chỉ ADMIN thấy */}
        {profile.roles.includes('ADMIN') ? (
          <>
            <p className="mt-6 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quản trị</p>
            <nav className="flex flex-col gap-1">
              {ADMIN_NAV.map(({ href, label }) => (
                <Link
                  key={href} href={href}
                  className={cn('rounded-md px-3 py-2 text-sm', isActive(href) ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent')}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </>
        ) : null}

        <div className="mt-auto pt-4">
          <Link href="/profile" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
            <UserCircle2 className="h-8 w-8 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{profile.fullName}</span>
              <span className="block truncate text-xs text-muted-foreground">{profile.jobTitle ?? profile.email}</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* ================= TOPBAR (sticky, mọi màn hình) ================= */}
      <header className="sticky top-0 z-sticky border-b bg-card/95 backdrop-blur md:pl-60">
        <div className="flex h-14 items-center gap-2 px-4">
          {/* Nút mở nav trên mobile */}
          <button className="rounded-md p-2 hover:bg-accent md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Mở menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <BookOpenText className="h-5 w-5 text-primary" />
            <span className="font-bold">HRMIS</span>
          </Link>

          {/* Mục 7 — tìm kiếm toàn hệ thống ngay trên header */}
          <div className="ml-4 hidden flex-1 justify-center md:flex">
            <GlobalSearch />
          </div>

          {/* Mục 9 — cụm hành động phải: thông báo + menu người dùng */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/notifications"
              className={cn('rounded-md p-2 hover:bg-accent', isActive('/notifications') && 'text-primary')}
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              aria-label="Hồ sơ cá nhân"
            >
              <UserCircle2 className="h-7 w-7 text-muted-foreground" />
              <span className="hidden min-w-0 lg:block">
                <span className="block max-w-[10rem] truncate text-sm font-medium leading-tight">{profile.fullName}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">{profile.jobTitle ?? profile.email}</span>
              </span>
            </Link>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-md p-2 text-sm hover:bg-accent" aria-label="Đăng xuất">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= DRAWER mobile nav (overlay + panel) ================= */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-overlay md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-card p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="font-bold">HRMIS · STS</span>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Đóng menu" className="rounded-md p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Mục 7 — tìm kiếm toàn hệ thống cả trên mobile (trong drawer) */}
            <div className="mb-3 px-1">
              <GlobalSearch />
            </div>
            {navLinks}
            {profile.roles.includes('ADMIN') ? (
              <>
                <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quản trị</p>
                <nav className="flex flex-col gap-1">
                  {ADMIN_NAV.map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setMobileNavOpen(false)}
                      className={cn('rounded-md px-3 py-2 text-sm', isActive(href) ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent')}>
                      {label}
                    </Link>
                  ))}
                </nav>
              </>
            ) : null}
            <Link href="/profile" onClick={() => setMobileNavOpen(false)} className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
              <Settings className="h-4 w-4" /> Hồ sơ cá nhân
            </Link>
          </div>
        </div>
      ) : null}

      {/* ================= NỘI DUNG ================= */}
      {/* overflow-x-clip: nội dung quá rộng (sơ đồ, bảng) cuộn trong khung
          riêng, không bao giờ giãn vỡ cả trang */}
      <main className="overflow-x-clip px-4 pb-24 pt-4 md:pb-10 md:pl-60 lg:pr-6">
        <PageContainer>{children}</PageContainer>
      </main>

      {/* ================= BOTTOM NAV (mobile) ================= */}
      <nav className="fixed inset-x-0 bottom-0 z-sticky grid grid-cols-5 border-t bg-card md:hidden">
        {[
          { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
          { href: '/employees', label: 'Nhân sự', icon: Users },
          { href: '/attendance', label: 'Chấm công', icon: ShieldCheck },
          { href: '/leave', label: 'Nghỉ phép', icon: CalendarDays },
          { href: '/payroll', label: 'Lương', icon: Wallet },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn('flex flex-col items-center gap-0.5 py-2 text-[11px]', isActive(href) ? 'text-primary' : 'text-muted-foreground')}>
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
