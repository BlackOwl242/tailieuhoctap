'use client';

import * as React from 'react';
import { ChevronDown, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

export interface PrintExportDropdownProps {
  printLabel?: string;
  exportLabel?: string;
  onPrint?: () => void;
  onExportExcel?: () => void;
  className?: string;
}

/**
 * Nút dropdown hợp nhất In ấn & Xuất Excel:
 * Bấm nút hiển thị menu lựa chọn:
 * 1. In danh mục / báo cáo (hoặc lưu PDF)
 * 2. Xuất bảng tính Excel (.xlsx / .csv)
 */
export function PrintExportDropdown({
  printLabel = 'In danh mục',
  exportLabel = 'Xuất file Excel',
  onPrint = () => window.print(),
  onExportExcel,
  className,
}: PrintExportDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`no-print relative inline-block ${className ?? ''}`} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="gap-1.5 font-medium"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Printer className="h-4 w-4" />
        <span>{printLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-dropdown mt-1.5 w-48 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onPrint();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Printer className="h-4 w-4 text-primary" />
            <span>{printLabel}</span>
          </button>

          {onExportExcel ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onExportExcel();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-accent transition-colors border-t mt-1 pt-2"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{exportLabel}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Nút in đơn giản cho các trang chi tiết không có bảng dữ liệu xuất Excel */
export function PrintButton({ label = 'In phiếu', className }: { label?: string; className?: string }) {
  return (
    <Button variant="outline" size="sm" className={`no-print ${className ?? ''}`} onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> {label}
    </Button>
  );
}

/**
 * Khung tiêu đề báo cáo in chuẩn văn bản hành chính
 */
export function PrintFrame({
  title,
  subtitle,
  docNumber,
}: {
  title: string;
  subtitle?: string;
  docNumber?: string;
}) {
  const [printedAt, setPrintedAt] = React.useState<string>('');
  React.useEffect(() => setPrintedAt(new Date().toLocaleString('vi-VN')), []);

  return (
    <div className="print-only mb-6 text-black">
      {/* Header 2 cột chuẩn văn bản hành chính */}
      <div className="flex items-start justify-between border-b-2 border-black pb-3">
        <div className="text-left leading-snug">
          <p className="text-xs font-bold uppercase tracking-wide">CÔNG TY CỔ PHẦN PHẦN MỀM SAIGON TECHNOLOGY</p>
          <p className="text-[11px] text-gray-700">Hệ thống Thông tin Quản trị Nhân lực (HRMIS)</p>
          {docNumber ? <p className="mt-0.5 text-[11px] italic">Số: {docNumber}</p> : null}
        </div>
        <div className="text-right leading-snug">
          <p className="text-xs font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="text-[11px] font-semibold underline underline-offset-2">Độc lập – Tự do – Hạnh phúc</p>
          <p className="mt-1 text-[10px] text-gray-600">Thời điểm in: {printedAt}</p>
        </div>
      </div>

      {/* Tiêu đề văn bản */}
      <div className="my-5 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide text-black">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm font-medium text-gray-800">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/**
 * Khung chữ ký cuối trang văn bản in
 */
export function PrintSignatureBlock({
  leftTitle = 'Người lập biểu',
  middleTitle = 'Trưởng bộ phận',
  rightTitle = 'Giám đốc phê duyệt',
}: {
  leftTitle?: string;
  middleTitle?: string;
  rightTitle?: string;
}) {
  return (
    <div className="print-only mt-8 break-inside-avoid pt-4 text-xs text-black">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="font-bold uppercase">{leftTitle}</p>
          <p className="text-[10px] italic text-gray-600">(Ký và ghi rõ họ tên)</p>
          <div className="h-16" />
        </div>
        <div>
          <p className="font-bold uppercase">{middleTitle}</p>
          <p className="text-[10px] italic text-gray-600">(Ký và ghi rõ họ tên)</p>
          <div className="h-16" />
        </div>
        <div>
          <p className="font-bold uppercase">{rightTitle}</p>
          <p className="text-[10px] italic text-gray-600">(Ký, đóng dấu)</p>
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
