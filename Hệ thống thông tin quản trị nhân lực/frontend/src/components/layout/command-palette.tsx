'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Users, Calendar, Calculator, Briefcase, Target,
  Receipt, ShieldCheck, Clock4, FileSpreadsheet, Layers,
  CreditCard, Laptop, Network, CornerDownLeft, Sparkles, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  category: 'Điều hướng nhanh' | 'Thao tác nghiệp vụ' | 'Cổng cá nhân ESS';
  href: string;
  icon: typeof Search;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  { id: 'ess', title: 'Cổng Tự Phục Vụ (ESS) & Điểm danh', category: 'Cổng cá nhân ESS', href: '/ess', icon: Users, shortcut: 'G E' },
  { id: 'org-chart', title: 'Sơ đồ Tổ chức Động (Interactive Org Tree)', category: 'Điều hướng nhanh', href: '/org-chart', icon: Network, shortcut: 'G O' },
  { id: 'employees', title: 'Danh sách Nhân sự Toàn diện', category: 'Điều hướng nhanh', href: '/employees', icon: Users, shortcut: 'G N' },
  { id: 'shifts', title: 'Ca kíp & Bảng phân ca (Roster)', category: 'Điều hướng nhanh', href: '/shifts', icon: Clock4, shortcut: 'G S' },
  { id: 'attendance', title: 'Bảng Chấm công Thực tế', category: 'Điều hướng nhanh', href: '/attendance', icon: ShieldCheck },
  { id: 'payroll-engine', title: 'Bảng Lương Tự Động Đa Thành Phần & Xuất File Ngân Hàng', category: 'Điều hướng nhanh', href: '/payroll-engine', icon: Calculator, shortcut: 'G P' },
  { id: 'loans', title: 'Quản trị Tạm ứng / Khoản Vay Phúc lợi (Điều 102 BLLĐ)', category: 'Thao tác nghiệp vụ', href: '/loans', icon: CreditCard },
  { id: 'assets', title: 'Quản trị Cấp Phát & Thu Hồi Tài Sản (Biên bản)', category: 'Thao tác nghiệp vụ', href: '/assets', icon: Laptop },
  { id: 'recruitment-ats', title: 'Tuyển dụng ATS Kanban & 1-Click Onboard', category: 'Thao tác nghiệp vụ', href: '/recruitment-ats', icon: Briefcase },
  { id: 'performance-360', title: 'Đánh giá Hiệu suất 360 & KRA Goals', category: 'Thao tác nghiệp vụ', href: '/performance-360', icon: Target },
  { id: 'expense-claims', title: 'Công tác phí & Bảng kê Chi phí', category: 'Thao tác nghiệp vụ', href: '/expense-claims', icon: Receipt },
  { id: 'reports', title: 'Trung tâm Báo cáo Thống kê 2C / Biểu mẫu', category: 'Điều hướng nhanh', href: '/personnel-reports', icon: FileSpreadsheet },
  { id: 'salary-ranks', title: 'Bảng Ngạch Bậc Lương Nhà nước & Doanh nghiệp', category: 'Điều hướng nhanh', href: '/salary-ranks', icon: Layers },
  { id: 'leave', title: 'Đăng ký Xin Nghỉ Phép (Điều 113 BLLĐ)', category: 'Cổng cá nhân ESS', href: '/leave', icon: Calendar },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center pt-20 sm:pt-28 px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150" onClick={onClose} />

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-150 glass-card">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
          <Search className="h-4 w-4 text-primary shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Tìm tính năng, hồ sơ nhân sự, tạo đơn từ nhanh... (Ctrl + K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 [scrollbar-width:thin]">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Không tìm thấy lệnh hoặc trang nào khớp với &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      router.push(cmd.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                        : 'text-foreground hover:bg-muted/60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg',
                          isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="block truncate">{cmd.title}</span>
                        <span className={cn('text-[10px] block', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                          {cmd.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {cmd.shortcut && (
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.5 rounded',
                            isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted/80 text-muted-foreground'
                          )}
                        >
                          {cmd.shortcut}
                        </span>
                      )}
                      {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-primary-foreground/80" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-border/50 bg-muted/20 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><b>↑↓</b> Chọn</span>
            <span><b>Enter</b> Mở</span>
            <span><b>Esc</b> Đóng</span>
          </div>
          <span className="flex items-center gap-1 font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> HRMIS AI Navigation
          </span>
        </div>
      </div>
    </div>
  );
}
