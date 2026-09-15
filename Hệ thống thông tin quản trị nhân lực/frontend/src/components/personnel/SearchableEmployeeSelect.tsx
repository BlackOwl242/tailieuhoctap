'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmployeeOption {
  id: string;
  fullName: string;
  employeeCode?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  email?: string | null;
  orgUnit?: { name: string } | null;
}

interface SearchableEmployeeSelectProps {
  employees: EmployeeOption[];
  value: string;
  onChange: (userId: string) => void;
  className?: string;
  placeholder?: string;
}

function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Combobox vừa tìm kiếm vừa dropdown chọn cán bộ nhân sự
 * Hỗ trợ gõ mã NV (CB16225, 16225...), họ tên có dấu hoặc không dấu, chức danh, phòng ban.
 */
export function SearchableEmployeeSelect({
  employees = [],
  value,
  onChange,
  className,
  placeholder = 'Chọn hoặc tìm kiếm cán bộ...',
}: SearchableEmployeeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpwards: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // SSR guard
  useEffect(() => { setMounted(true); }, []);

  // Tìm nhân viên hiện tại
  const selectedEmp = useMemo(
    () => employees.find((e) => e.id === value),
    [employees, value]
  );

  // Lọc danh sách nhân sự thông minh
  const filteredEmployees = useMemo(() => {
    const q = search.trim();
    if (!q) return employees;

    const cleanQ = removeAccents(q);
    return employees.filter((emp) => {
      const code = (emp.employeeCode || '').toLowerCase();
      const rawName = emp.fullName || '';
      const cleanName = removeAccents(rawName);
      const title = removeAccents(emp.jobTitle || emp.department || emp.orgUnit?.name || '');
      const email = (emp.email || '').toLowerCase();

      return (
        code.includes(cleanQ) ||
        cleanName.includes(cleanQ) ||
        title.includes(cleanQ) ||
        email.includes(cleanQ)
      );
    });
  }, [employees, search]);

  // Tính toạ độ fixed cho portal popover
  const computeCoords = React.useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(Math.max(r.width, 320), 500);
    const spaceBelow = window.innerHeight - r.bottom;
    const shouldOpenUp = spaceBelow < 300 && r.top > spaceBelow;
    const leftPos = Math.min(r.left, window.innerWidth - popoverWidth - 12);
    setCoords({
      top: shouldOpenUp ? r.top - 6 : r.bottom + 6,
      left: Math.max(4, leftPos),
      width: popoverWidth,
      openUpwards: shouldOpenUp,
    });
  }, []);

  // Khi mở: tính toạ độ, focus ô tìm kiếm
  useEffect(() => {
    if (isOpen) {
      computeCoords();
      setSearch('');
      setHighlightIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setCoords(null);
    }
  }, [isOpen, computeCoords]);

  // Tự động cuộn đến phần tử đang highlight
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-emp-item]');
      if (items[highlightIndex]) {
        (items[highlightIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex, isOpen]);

  // Bắt sự kiện click ra ngoài để đóng dropdown (kiểm tra cả portal popover)
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Tái tính toạ độ khi cuộn/resize
  useEffect(() => {
    if (!isOpen) return;
    function handleScrollOrResize() {
      computeCoords();
    }
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, computeCoords]);

  // Xử lý phím điều hướng (ArrowUp, ArrowDown, Enter, Escape)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filteredEmployees.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredEmployees.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEmployees[highlightIndex]) {
        onChange(filteredEmployees[highlightIndex].id);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  }

  // Label hiển thị của người đang chọn
  const displayLabel = useMemo(() => {
    if (!selectedEmp) return placeholder;
    const code = selectedEmp.employeeCode ? `[${selectedEmp.employeeCode}] ` : '';
    const cleanName = selectedEmp.fullName ? selectedEmp.fullName.replace(/\s*\([^)]*\)/g, '').trim() : '';
    const role = selectedEmp.jobTitle || selectedEmp.department || selectedEmp.orgUnit?.name || 'Chuyên viên';
    return `${code}${cleanName} — ${role}`;
  }, [selectedEmp, placeholder]);

  // Nội dung popover (render qua portal)
  const popoverContent = isOpen && coords ? (
    <div
      ref={popoverRef}
      className="bg-popover border border-border rounded-xl shadow-xl overflow-hidden font-sans animate-in fade-in-50 zoom-in-95 duration-100"
      style={{
        position: 'fixed',
        left: coords.left,
        width: coords.width,
        top: coords.openUpwards ? undefined : coords.top,
        bottom: coords.openUpwards ? window.innerHeight - coords.top : undefined,
        zIndex: 99999,
      }}
    >
      {/* Hộp gõ tìm kiếm */}
      <div className="p-2 border-b border-border/70 bg-muted/20">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlightIndex(0);
            }}
            placeholder="Tìm mã NV (16225), tên (Trọng), chức danh..."
            className="w-full h-8 pl-8 pr-7 text-xs bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium font-sans"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setHighlightIndex(0);
                inputRef.current?.focus();
              }}
              className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 px-1 font-medium font-sans">
          <span>{filteredEmployees.length} / {employees.length} cán bộ</span>
          <span className="hidden sm:inline text-[10px] text-muted-foreground/80">Nhấn ↑ ↓ để chọn, Enter xác nhận</span>
        </div>
      </div>

      {/* Danh sách cuộn các cán bộ */}
      <div ref={listRef} className="max-h-72 overflow-y-auto py-1 divide-y divide-border/20 font-sans">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp, idx) => {
            const isSelected = emp.id === value;
            const isHighlighted = idx === highlightIndex;
            const cleanName = (emp.fullName || '').replace(/\s*\([^)]*\)/g, '').trim();
            const role = emp.jobTitle || emp.department || emp.orgUnit?.name || 'Chuyên viên';

            return (
              <button
                key={emp.id}
                data-emp-item
                type="button"
                onClick={() => {
                  onChange(emp.id);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={cn(
                  'w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer font-sans',
                  isHighlighted && 'bg-muted/70',
                  isSelected && 'bg-primary/10 text-primary'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {emp.employeeCode && (
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/60 shrink-0">
                        [{emp.employeeCode}]
                      </span>
                    )}
                    <span className={cn('text-xs truncate', isSelected ? 'font-bold text-primary' : 'font-semibold text-foreground')}>
                      {cleanName}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {role} {emp.email ? `· ${emp.email}` : ''}
                  </div>
                </div>

                {isSelected && (
                  <div className="p-1 rounded-full bg-primary/20 text-primary shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="py-8 px-4 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Không tìm thấy cán bộ nào</p>
            <p className="text-[11px] mt-1">Không có kết quả khớp với từ khóa &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={cn('relative inline-block w-full max-w-[460px] text-xs font-sans', className)} onKeyDown={handleKeyDown}>
      {/* Nút bấm hiển thị Combobox Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={cn(
          'w-full h-8.5 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold text-foreground',
          'flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all',
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
        )}
      >
        <span className="truncate flex-1">{displayLabel}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-150', isOpen && 'rotate-180 text-primary')} />
      </button>

      {/* Menu tìm kiếm qua portal - thoát khỏi modal overflow */}
      {mounted && popoverContent ? createPortal(popoverContent, document.body) : null}
    </div>
  );
}
