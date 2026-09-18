'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Home, Users, Clock4, Wallet, Briefcase, FolderOpen, Settings,
  Search, Plus, PanelLeftClose, PanelLeft, Folder, FolderClosed,
  FileText, ChevronRight, ChevronDown, Check, X, Bell, UserCircle2,
  LogOut, Menu, ArrowRightLeft, Building2, Sparkles, Tag, Filter,
  ShieldCheck, Layers, Network, Laptop, CalendarDays, Timer,
  Calculator, CreditCard, Receipt, Target, GraduationCap, FileSpreadsheet
} from 'lucide-react';
import { CommandPalette } from '@/components/layout/command-palette';
import { cn } from '@/lib/utils';
import { useAuthStore, type AuthState } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { PageContainer } from './page-container';
import type { MeProfile } from '@/lib/types';

/**
 * Biểu tượng hình học tối giản 3 khối isometric (Tri-cube Geometric Logo)
 * Chuẩn xác theo ảnh tham chiếu giao diện người dùng cung cấp.
 */
function GeometricCubeLogo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Khối lập phương phía trên (Top Cube) */}
      <path d="M14 2L19.5 5.2V11.5L14 14.7L8.5 11.5V5.2L14 2Z" fill="currentColor" />
      <path d="M14 2L19.5 5.2L14 8.4L8.5 5.2L14 2Z" fill="currentColor" opacity="0.9" />
      <path d="M8.5 5.2L14 8.4V14.7L8.5 11.5V5.2Z" fill="currentColor" opacity="0.75" />
      <path d="M14 8.4L19.5 5.2V11.5L14 14.7V8.4Z" fill="currentColor" opacity="0.6" />

      {/* Khối lập phương góc dưới bên trái (Bottom-Left Cube) */}
      <path d="M7 13.5L12.5 16.7V23L7 26.2L1.5 23V16.7L7 13.5Z" fill="currentColor" />
      <path d="M7 13.5L12.5 16.7L7 19.9L1.5 16.7L7 13.5Z" fill="currentColor" opacity="0.9" />
      <path d="M1.5 16.7L7 19.9V26.2L1.5 23V16.7Z" fill="currentColor" opacity="0.75" />
      <path d="M7 19.9L12.5 16.7V23L7 26.2V19.9Z" fill="currentColor" opacity="0.6" />

      {/* Khối lập phương góc dưới bên phải (Bottom-Right Cube) */}
      <path d="M21 13.5L26.5 16.7V23L21 26.2L15.5 23V16.7L21 13.5Z" fill="currentColor" />
      <path d="M21 13.5L26.5 16.7L21 19.9L15.5 16.7L21 13.5Z" fill="currentColor" opacity="0.9" />
      <path d="M15.5 16.7L21 19.9V26.2L15.5 23V16.7Z" fill="currentColor" opacity="0.75" />
      <path d="M21 19.9L26.5 16.7V23L21 26.2V19.9Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

interface TreeItem {
  href: string;
  label: string;
  badge?: string | number;
  roles?: string[];
  subItems?: { href: string; label: string; badge?: string | number }[];
}

interface NavFolder {
  id: string;
  label: string;
  count?: number;
  items: TreeItem[];
}

interface NavDomain {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  folders: NavFolder[];
  tags: { id: string; label: string; count: number; href: string }[];
}

/**
 * Cấu trúc phân hệ Dual-Tier chuẩn hóa (Frappe HRMS & BLLĐ 2019)
 */
const DOMAINS: NavDomain[] = [
  {
    id: 'workspace',
    label: 'Tổng quan',
    shortLabel: 'Tổng quan',
    icon: Home,
    folders: [
      {
        id: 'ws-general',
        label: 'Bàn làm việc',
        count: 4,
        items: [
          { href: '/dashboard', label: 'Tổng quan', badge: 'KPI' },
          { href: '/ess', label: 'Cổng nhân viên', badge: 'Chính' },
          { href: '/notifications', label: 'Thông báo', badge: 3 },
          { href: '/profile', label: 'Hồ sơ cá nhân' },
        ],
      },
    ],
    tags: [
      { id: 'tag-daily', label: '#Hàng ngày', count: 5, href: '/ess' },
      { id: 'tag-requests', label: '#Đơn từ', count: 2, href: '/ess' },
      { id: 'tag-alerts', label: '#Thông báo', count: 3, href: '/notifications' },
    ],
  },
  {
    id: 'personnel',
    label: 'Nhân sự',
    shortLabel: 'Nhân sự',
    icon: Users,
    folders: [
      {
        id: 'pers-records',
        label: 'Hồ sơ',
        count: 185,
        items: [
          { href: '/employees', label: 'Hồ sơ nhân sự', badge: 128 },
          { href: '/org-chart', label: 'Sơ đồ tổ chức' },
          { href: '/assets', label: 'Tài sản', badge: 45 },
        ],
      },
      {
        id: 'pers-movements',
        label: 'Chế độ',
        count: 13,
        items: [
          { href: '/personnel', label: 'Biến động nhân sự', badge: 8 },
          { href: '/salary-ranks', label: 'Ngạch bậc lương', badge: 5 },
        ],
      },
    ],
    tags: [
      { id: 'tag-active', label: '#Đang làm việc', count: 110, href: '/employees' },
      { id: 'tag-probation', label: '#Thử việc', count: 18, href: '/employees' },
      { id: 'tag-contract', label: '#Hợp đồng', count: 45, href: '/personnel' },
      { id: 'tag-assets', label: '#Tài sản', count: 12, href: '/assets' },
    ],
  },
  {
    id: 'time',
    label: 'Chấm công',
    shortLabel: 'Chấm công',
    icon: Clock4,
    folders: [
      {
        id: 'time-attendance',
        label: 'Điểm danh',
        count: 2,
        items: [
          { href: '/attendance', label: 'Bảng chấm công', badge: 'Hôm nay' },
          { href: '/shifts', label: 'Ca làm việc', badge: 4 },
        ],
      },
      {
        id: 'time-leave',
        label: 'Đơn từ',
        count: 5,
        items: [
          { href: '/leave', label: 'Nghỉ phép', badge: 3 },
          { href: '/overtime', label: 'Làm thêm giờ', badge: 2 },
        ],
      },
    ],
    tags: [
      { id: 'tag-today', label: '#Điểm danh hôm nay', count: 98, href: '/attendance' },
      { id: 'tag-pending-leave', label: '#Phép chờ duyệt', count: 3, href: '/leave' },
      { id: 'tag-ot', label: '#Làm thêm giờ', count: 2, href: '/overtime' },
    ],
  },
  {
    id: 'compensation',
    label: 'Tiền lương',
    shortLabel: 'Tiền lương',
    icon: Wallet,
    folders: [
      {
        id: 'comp-payroll',
        label: 'Bảng lương',
        count: 1,
        items: [
          { href: '/payroll-engine', label: 'Bảng lương', badge: 'Kỳ mới' },
        ],
      },
      {
        id: 'comp-benefits',
        label: 'Phúc lợi',
        count: 5,
        items: [
          { href: '/loans', label: 'Tạm ứng & Vay', badge: 5 },
          { href: '/expense-claims', label: 'Công tác phí', badge: 4 },
        ],
      },
    ],
    tags: [
      { id: 'tag-nd30', label: '#Khoản vay', count: 5, href: '/loans' },
      { id: 'tag-payroll-run', label: '#Bảng tính lương', count: 1, href: '/payroll-engine' },
      { id: 'tag-expense-pending', label: '#Công tác phí', count: 4, href: '/expense-claims' },
    ],
  },
  {
    id: 'talent',
    label: 'Phát triển',
    shortLabel: 'Phát triển',
    icon: Briefcase,
    folders: [
      {
        id: 'talent-recruitment',
        label: 'Tuyển dụng',
        count: 9,
        items: [
          { href: '/recruitment-ats', label: 'Tuyển dụng', badge: 9 },
        ],
      },
      {
        id: 'talent-growth',
        label: 'Nhân tài',
        count: 2,
        items: [
          { href: '/performance-360', label: 'Đánh giá KPI', badge: 'Đợt 1' },
          { href: '/training-grievance', label: 'Đào tạo & Khiếu nại', badge: 2 },
        ],
      },
    ],
    tags: [
      { id: 'tag-ats-interview', label: '#Lịch phỏng vấn', count: 6, href: '/recruitment-ats' },
      { id: 'tag-kpi-q3', label: '#Đánh giá KPI', count: 1, href: '/performance-360' },
      { id: 'tag-cert', label: '#Đào tạo', count: 2, href: '/training-grievance' },
    ],
  },
  {
    id: 'reports-docs',
    label: 'Báo cáo',
    shortLabel: 'Báo cáo',
    icon: FolderOpen,
    folders: [
      {
        id: 'docs-vault',
        label: 'Tài liệu',
        count: 24,
        items: [
          { href: '/documents', label: 'Kho tài liệu', badge: 24 },
        ],
      },
      {
        id: 'docs-analytics',
        label: 'Báo cáo',
        count: 1,
        items: [
          { href: '/personnel-reports', label: 'Báo cáo nhân sự', badge: 'BLLĐ', roles: ['ADMIN', 'KM_MANAGER'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-templates', label: '#Mẫu văn bản', count: 12, href: '/documents' },
      { id: 'tag-labor-report', label: '#Báo cáo định kỳ', count: 4, href: '/personnel-reports' },
    ],
  },
  {
    id: 'admin',
    label: 'Quản trị',
    shortLabel: 'Quản trị',
    icon: Settings,
    roles: ['ADMIN'],
    folders: [
      {
        id: 'admin-users',
        label: 'Phân quyền',
        count: 2,
        items: [
          { href: '/admin/users', label: 'Tài khoản' },
          { href: '/admin/org-units', label: 'Đơn vị phòng ban' },
        ],
      },
      {
        id: 'admin-system',
        label: 'Hệ thống',
        count: 4,
        items: [
          { href: '/admin/catalogs', label: 'Danh mục gốc' },
          { href: '/admin/attendance', label: 'Máy chấm công' },
          { href: '/admin/settings', label: 'Cấu hình' },
          { href: '/admin/audit', label: 'Nhật ký' },
        ],
      },
    ],
    tags: [
      { id: 'tag-user-accounts', label: '#Tài khoản quản trị', count: 3, href: '/admin/users' },
      { id: 'tag-devices', label: '#Máy chấm công', count: 2, href: '/admin/attendance' },
      { id: 'tag-catalogs', label: '#Tham số hệ thống', count: 8, href: '/admin/catalogs' },
    ],
  },
];

export function AppShell({ profile, children }: { profile: MeProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clear = useAuthStore((s: AuthState) => s.clear);
  const queryClient = useQueryClient();

  // Mobile nav state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Sub-sidebar toggle (mở/thu gọn cột thứ 2)
  const [subSidebarOpen, setSubSidebarOpen] = useState(true);

  // Search filter bên trong Sub-sidebar
  const [subSidebarSearch, setSubSidebarSearch] = useState('');

  // Tab switch giữa "Folders" và "Tags" bên trong Sub-sidebar
  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders');

  // Trạng thái đóng/mở từng Folder trong cây
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

  // Tự động suy ra Domain đang active dựa trên pathname
  const activeDomainIdFromPath = useMemo(() => {
    for (const domain of DOMAINS) {
      for (const folder of domain.folders) {
        for (const item of folder.items) {
          if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
            return domain.id;
          }
          if (item.subItems) {
            for (const sub of item.subItems) {
              if (pathname === sub.href) return domain.id;
            }
          }
        }
      }
    }
    return 'workspace';
  }, [pathname]);

  const [selectedDomainId, setSelectedDomainId] = useState<string>(activeDomainIdFromPath);

  // Khi pathname thay đổi, cập nhật selectedDomainId theo trang đang xem
  useEffect(() => {
    setSelectedDomainId(activeDomainIdFromPath);
  }, [activeDomainIdFromPath]);

  // Khôi phục trạng thái sub-sidebar từ localStorage nếu có
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

  // Lọc các domain theo quyền vai trò (roles)
  const availableDomains = useMemo(() => {
    return DOMAINS.filter((d) => {
      if (!d.roles) return true;
      return d.roles.some((r) => profile.roles.includes(r));
    });
  }, [profile.roles]);

  const activeDomain = useMemo(() => {
    return availableDomains.find((d) => d.id === selectedDomainId) || availableDomains[0] || DOMAINS[0];
  }, [availableDomains, selectedDomainId]);

  const isLinkActive = (href: string) => {
    if (href === '/dashboard' || href === '/ess') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Lọc items trong sub-sidebar theo ô tìm kiếm
  const filteredFolders = useMemo(() => {
    if (!subSidebarSearch.trim()) return activeDomain.folders;
    const q = subSidebarSearch.toLowerCase().trim();
    return activeDomain.folders
      .map((folder) => {
        const matchingItems = folder.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.subItems?.some((sub) => sub.label.toLowerCase().includes(q))
        );
        return {
          ...folder,
          items: matchingItems,
        };
      })
      .filter((folder) => folder.items.length > 0 || folder.label.toLowerCase().includes(q));
  }, [activeDomain, subSidebarSearch]);

  const filteredTags = useMemo(() => {
    if (!subSidebarSearch.trim()) return activeDomain.tags;
    const q = subSidebarSearch.toLowerCase().trim();
    return activeDomain.tags.filter((t) => t.label.toLowerCase().includes(q));
  }, [activeDomain, subSidebarSearch]);

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Universal Command Palette (Ctrl+K) */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* ========================================================================= */}
      {/* TIER 1: PRIMARY ICON RAIL (Cột icon mỏng bên trái: w-16 = 64px)            */}
      {/* ========================================================================= */}
      <aside
        className="fixed inset-y-0 left-0 z-sidebar hidden w-16 flex-col items-center justify-between border-r border-border/60 bg-card py-3 md:flex"
        aria-label="Cột điều hướng phân hệ chính"
      >
        {/* Top: Logo hình học tối giản */}
        <div className="flex flex-col items-center">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:opacity-80 transition-opacity"
            title="HRMIS Pro — Bàn điều khiển trung tâm"
          >
            <GeometricCubeLogo className="h-6 w-6 text-foreground" />
          </Link>
        </div>

        {/* Middle: Icon phân hệ chính CĂN CHÍNH GIỮA CHIỀU CAO SIDEBAR */}
        <div className="my-auto flex flex-col items-center gap-2">
          {availableDomains.map((domain) => {
            const Icon = domain.icon;
            const isDomainActive = domain.id === activeDomain.id;

            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => {
                  setSelectedDomainId(domain.id);
                  // Nếu đang đóng sub-sidebar thì bấm vào icon sẽ tự động mở ra
                  if (!subSidebarOpen) setSubSidebarOpen(true);
                }}
                aria-label={domain.label}
                className={cn(
                  'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none',
                  isDomainActive
                    ? 'bg-muted/90 text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 transition-transform group-hover:scale-105" />

                {/* Tooltip chỉ hiển thị khi thanh phụ đã thu gọn (đóng), với nền tối tương phản rõ nét */}
                {!subSidebarOpen && (
                  <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-[80] whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl opacity-0 transition-opacity group-hover:opacity-100 border border-zinc-800">
                    {domain.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom: Profile & Đăng xuất */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={toggleSubSidebar}
            title={subSidebarOpen ? 'Thu gọn cây phân mục' : 'Mở rộng cây phân mục'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none"
          >
            <PanelLeft className={cn('h-4 w-4 transition-transform', !subSidebarOpen && 'rotate-180 text-primary')} />
          </button>

          <div className="h-px w-8 bg-border/60" />

          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none"
            title={`Tài khoản: ${profile.fullName}`}
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* TIER 2: SUB-SIDEBAR PANE (Bảng cây thư mục phân nhánh: w-64 = 256px)        */}
      {/* ========================================================================= */}
      <aside
        className={cn(
          'fixed inset-y-0 left-16 z-sidebar hidden flex-col border-r border-border/60 bg-card/95 backdrop-blur-xs transition-all duration-200 md:flex',
          subSidebarOpen ? 'w-64 opacity-100' : 'w-0 border-r-0 opacity-0 pointer-events-none overflow-hidden'
        )}
        aria-label="Cây thư mục chức năng"
      >
        <div className="flex h-full w-64 flex-col p-3.5 space-y-3">
          {/* Header Sub-Sidebar: Tên phân hệ + Nút '+' & Nút thu gọn */}
          <div className="flex items-center justify-between pt-0.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[170px]" title={activeDomain.label}>
              {activeDomain.shortLabel}
            </h2>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={toggleSubSidebar}
                title="Thu gọn bảng điều hướng"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none focus:outline-none"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Ô tìm kiếm bo tròn với kính lúp */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={subSidebarSearch}
              onChange={(e) => setSubSidebarSearch(e.target.value)}
              placeholder="Tìm kiếm chức năng..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-card border border-border/60 rounded-xl outline-none focus:border-border transition-all text-foreground placeholder:text-muted-foreground/70"
            />
            {subSidebarSearch && (
              <button
                onClick={() => setSubSidebarSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Segmented Pill Tabs: Folders | Tags */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('folders')}
              className={cn(
                'flex-1 py-1 px-3 text-center rounded-lg font-medium transition-all text-xs outline-none focus:outline-none',
                activeTab === 'folders'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Chức năng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={cn(
                'flex-1 py-1 px-3 text-center rounded-lg font-medium transition-all text-xs outline-none focus:outline-none',
                activeTab === 'tags'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Thẻ & Phân loại
            </button>
          </div>

          {/* Danh sách phân nhánh cây (Tree View) hoặc Tags */}
          <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            {activeTab === 'folders' ? (
              <div className="space-y-3 pt-1">
                {filteredFolders.map((folder) => {
                  const isOpen = openFolders[folder.id] ?? true;

                  return (
                    <div key={folder.id} className="space-y-1">
                      {/* Thư mục cha (Parent Folder) */}
                      <button
                        type="button"
                        onClick={() => toggleFolder(folder.id)}
                        className="group flex w-full items-center justify-between py-1 px-1.5 rounded-lg text-xs font-semibold text-foreground/90 hover:bg-muted/50 transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none"
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

                      {/* Các mục con kết nối bằng đường kẻ nhánh cây (Tree Lines) */}
                      {isOpen && folder.items.length > 0 && (
                        <div className="relative ml-3 pl-3.5 border-l border-border/70 space-y-1 py-0.5 animate-in fade-in duration-150">
                          {folder.items.map((item) => {
                            const active = isLinkActive(item.href);

                            return (
                              <div key={item.href} className="relative space-y-0.5">
                                {/* Đường kẻ nhánh cây ngang độc lập, tách rời Link để không bị trình duyệt vẽ viền focus méo mó */}
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute -left-3.5 top-3.5 h-px w-2.5 bg-border/70"
                                />
                                <Link
                                  href={item.href}
                                  className={cn(
                                    'group relative flex items-center justify-between py-1 px-2 rounded-lg text-xs transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none',
                                    active
                                      ? 'bg-muted/90 text-foreground font-semibold shadow-xs'
                                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                  )}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-foreground' : 'text-muted-foreground/70')} />
                                    <span className="truncate">{item.label}</span>
                                  </div>
                                  {item.badge !== undefined && (
                                    <span
                                      className={cn(
                                        'rounded-full px-1.5 py-0.2 text-[10px] font-medium shrink-0',
                                        active
                                          ? 'bg-muted-foreground/15 text-foreground font-medium'
                                          : 'bg-muted/80 text-muted-foreground'
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </Link>

                                {/* Nhánh con cấp 3 (Sub-items) */}
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
                                              'relative flex items-center justify-between py-0.5 px-2 rounded-md text-[11px] transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none',
                                              subActive
                                                ? 'text-foreground font-semibold bg-muted/60'
                                                : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted/30'
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

                {filteredFolders.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Không tìm thấy mục phù hợp.
                  </p>
                )}
              </div>
            ) : (
              /* TAB: TAGS & PHÂN LOẠI */
              <div className="space-y-1.5 pt-1">
                {filteredTags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={tag.href}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground" />
                      <span className="font-medium">{tag.label}</span>
                    </div>
                    <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {tag.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* TOPBAR (Sticky trên toàn màn hình, đệm thích ứng theo trạng thái Sidebar) */}
      {/* ========================================================================= */}
      <header
        className={cn(
          'sticky top-0 z-sticky border-b border-border/60 bg-card/80 backdrop-blur-md transition-all duration-200',
          subSidebarOpen ? 'md:ml-[320px]' : 'md:ml-16'
        )}
      >
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger button */}
          <button
            className="rounded-md p-1.5 hover:bg-accent md:hidden text-muted-foreground"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo thu nhỏ trên Mobile */}
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <GeometricCubeLogo className="h-5 w-5 text-foreground" />
            <span className="font-bold text-sm">HRMIS</span>
          </Link>

          {/* Nút mở lại thanh phụ khi đang thu gọn (Desktop) */}
          {!subSidebarOpen && (
            <button
              onClick={() => setSubSidebarOpen(true)}
              title="Mở thanh điều hướng phụ"
              className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50 shrink-0"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}

          {/* Thanh tìm kiếm đặt chính giữa Topbar */}
          <div className="hidden md:flex flex-1 items-center justify-center px-4 max-w-xl mx-auto">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex w-full max-w-md items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Tìm kiếm nhân viên, chức năng, tạo đơn từ...</span>
              </span>
              <kbd className="inline-flex items-center rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
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
                isLinkActive('/notifications') && 'text-primary bg-primary/10'
              )}
              aria-label="Thông báo"
            >
              <Bell className="h-4 w-4" />
            </Link>

            <div className="h-4 w-px bg-border mx-1" />

            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60 transition-colors"
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
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* DRAWER MOBILE NAV (Menu trượt toàn diện trên điện thoại)                  */}
      {/* ========================================================================= */}
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

            <div className="mb-3">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  setCommandPaletteOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
              >
                <span>Tìm kiếm nhanh...</span>
                <kbd className="text-xs font-mono">⌘K</kbd>
              </button>
            </div>

            <div className="space-y-4">
              {availableDomains.map((domain) => (
                <div key={domain.id} className="space-y-1">
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {domain.label}
                  </p>
                  <div className="space-y-0.5">
                    {domain.folders.flatMap((f) => f.items).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                          isLinkActive(item.href)
                            ? 'bg-muted text-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
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

      {/* ========================================================================= */}
      {/* VÙNG NỘI DUNG CHÍNH (Workspace Canvas Frame)                              */}
      {/* ========================================================================= */}
      <main
        className={cn(
          'overflow-x-clip min-h-[calc(100dvh-3.5rem)] transition-[padding] duration-200',
          subSidebarOpen ? 'md:pl-[320px]' : 'md:pl-16'
        )}
      >
        <div className="px-4 py-5 sm:px-6 lg:px-8 pb-20 md:pb-12">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM NAV (Thanh điều hướng nhanh phía đáy trên điện thoại)              */}
      {/* ========================================================================= */}
      <nav className="fixed inset-x-0 bottom-0 z-sticky grid grid-cols-5 border-t border-border/60 bg-card/90 backdrop-blur-md md:hidden">
        {[
          { href: '/dashboard', label: 'Tổng quan', icon: Home },
          { href: '/employees', label: 'Nhân sự', icon: Users },
          { href: '/ess', label: 'Cá nhân', icon: UserCircle2 },
          { href: '/attendance', label: 'Chấm công', icon: Clock4 },
          { href: '/loans', label: 'Khoản vay', icon: Wallet },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              isLinkActive(href) ? 'text-primary' : 'text-muted-foreground'
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
