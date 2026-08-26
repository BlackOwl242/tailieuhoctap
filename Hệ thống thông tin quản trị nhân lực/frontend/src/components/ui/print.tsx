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
          className="absolute right-0 z-dropdown mt-1.5 w-48 rounded-lg border border-border bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
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
  React.useEffect(() => {
    const d = new Date();
    setPrintedAt(`ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`);
  }, []);

  return (
    <div className="print-only font-times text-black mb-5">
      {/* Header 2 cột chuẩn văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP) */}
      <div className="grid grid-cols-2 gap-6 items-start pb-2">
        {/* Bên trái: Tên cơ quan, tổ chức ban hành văn bản (12-13pt) */}
        <div className="text-center flex flex-col items-center">
          <p className="text-[12pt] font-bold uppercase tracking-tight text-black leading-tight">
            CÔNG TY CP PHẦN MỀM SAIGON TECHNOLOGY
          </p>
          <p className="text-[11.5pt] font-bold text-black uppercase mt-1 leading-tight">
            HỆ THỐNG QUẢN TRỊ NHÂN LỰC (HRMIS)
          </p>
          {/* Nét kẻ ngang dưới tên cơ quan: nét liền 1px, dài 1/3 đến 1/2 độ dài dòng chữ */}
          <div className="w-28 border-b border-black mt-1.5 mb-1.5" />
          {docNumber ? <p className="text-[11pt] italic text-black">Số: {docNumber}</p> : null}
        </div>

        {/* Bên phải: Quốc hiệu và Tiêu ngữ (12-14pt) */}
        <div className="flex flex-col items-end">
          <div className="text-center flex flex-col items-center w-full">
            <p className="text-[12.5pt] font-bold uppercase tracking-tight text-black leading-tight">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-[13pt] font-bold text-black mt-1 leading-tight">
              Độc lập – Tự do – Hạnh phúc
            </p>
            {/* Nét kẻ ngang dưới Tiêu ngữ: nét liền 1px, dài bằng độ dài dòng chữ */}
            <div className="w-40 border-b border-black mt-1.5 mb-1.5" />
          </div>
          {/* Địa danh và Ngày tháng năm: Căn sát lề phải (13-14pt nghiêng) */}
          <p className="text-[12.5pt] italic text-black text-right w-full mt-1">
            TP. Hồ Chí Minh, {printedAt || 'ngày … tháng … năm 2026'}
          </p>
        </div>
      </div>

      {/* Tiêu đề văn bản (15-16pt đậm) */}
      <div className="my-5 text-center">
        <h1 className="text-[16pt] font-bold uppercase tracking-wide text-black leading-snug">{title}</h1>
        {subtitle ? <p className="mt-1 text-[12pt] italic text-black">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/**
 * Khung chữ ký cuối trang văn bản in chuẩn Nghị định 30 (12-13pt)
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
    <div className="font-times print-only mt-8 break-inside-avoid pt-4 text-black">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[12pt] font-bold uppercase text-black leading-snug">{leftTitle}</p>
          <p className="text-[11pt] italic text-black mt-0.5">(Ký và ghi rõ họ tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="text-[12pt] font-bold uppercase text-black leading-snug">{middleTitle}</p>
          <p className="text-[11pt] italic text-black mt-0.5">(Ký và ghi rõ họ tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="text-[12pt] font-bold uppercase text-black leading-snug">{rightTitle}</p>
          <p className="text-[11pt] italic text-black mt-0.5">(Ký, đóng dấu)</p>
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
