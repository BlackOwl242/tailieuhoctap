'use client';

import * as React from 'react';
import { ChevronDown, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { useOrgConfig } from '@/lib/org-config';

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
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
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

export interface PrintFrameProps {
  title: string;
  subtitle?: string;
  docNumber?: string;
  orgName?: string;
  parentOrgName?: string;
  deptName?: string;
  location?: string;
  showDept?: boolean;
}

/**
 * Khung tiêu đề báo cáo in chuẩn văn bản hành chính (Nghị định 30/2020/NĐ-CP)
 */
export function PrintFrame({
  title,
  subtitle,
  docNumber,
  orgName,
  parentOrgName,
  deptName,
  location,
}: PrintFrameProps) {
  const [config] = useOrgConfig();
  const [printedAt, setPrintedAt] = React.useState<string>('');

  React.useEffect(() => {
    const d = new Date();
    setPrintedAt(`ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`);
  }, []);

  const displayParentOrg = (parentOrgName !== undefined ? parentOrgName : config.parentOrgName) || '';
  const displayOrg = (orgName !== undefined ? orgName : config.orgName) || 'CƠ QUAN / ĐƠN VỊ';
  const displayDept = (deptName !== undefined ? deptName : config.deptName) || '';
  const displayLocation = location || config.location || 'TP. Hồ Chí Minh';
  const displayDocNumber = docNumber || '.../BC-TCCB';

  return (
    <div className="print-only font-times text-black mb-5">
      {/* Header 2 cột chuẩn văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP) */}
      <div className="flex justify-between items-start gap-6 pb-2">
        {/* Bên trái: Tên cơ quan, tổ chức ban hành văn bản (12-13pt) */}
        <div className="text-center flex flex-col items-center shrink-0 max-w-[48%] leading-normal">
          {displayParentOrg ? (
            <p className="text-[11pt] sm:text-[11.5pt] font-normal uppercase tracking-tight text-black leading-tight">
              {displayParentOrg}
            </p>
          ) : null}
          <p className="text-[11.5pt] sm:text-[12pt] font-bold uppercase tracking-tight text-black mt-0.5 leading-tight">
            {displayOrg}
          </p>
          {displayDept ? (
            <p className="text-[10.5pt] sm:text-[11pt] font-semibold text-black uppercase mt-0.5 leading-tight">
              {displayDept}
            </p>
          ) : null}
          {/* Nét kẻ ngang dưới tên cơ quan/đơn vị: nét liền 1px, dài 1/3 đến 1/2 độ dài dòng chữ */}
          <div
            className="print-divider-line mt-1.5 mb-1.5"
            style={{ width: '45%', minWidth: '80px', maxWidth: '140px', borderTop: '1px solid #000000' }}
          />
          <p className="text-[10.5pt] sm:text-[11pt] italic text-black">
            Số: {displayDocNumber}
          </p>
        </div>

        {/* Bên phải: Quốc hiệu và Tiêu ngữ (12-14pt) */}
        <div className="flex flex-col items-center text-center shrink-0 max-w-[48%] leading-normal">
          <p className="text-[11.5pt] sm:text-[12pt] font-bold uppercase tracking-tight text-black leading-tight whitespace-nowrap">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM
          </p>
          <p className="text-[12pt] sm:text-[12.5pt] font-bold text-black mt-0.5 leading-tight whitespace-nowrap">
            Độc lập – Tự do – Hạnh phúc
          </p>
          {/* Nét kẻ ngang dưới Tiêu ngữ: nét liền 1px, dài bằng độ dài dòng chữ */}
          <div
            className="print-divider-line mt-1.5 mb-1.5"
            style={{ width: '60%', minWidth: '120px', maxWidth: '180px', borderTop: '1px solid #000000' }}
          />
          {/* Địa danh và Ngày tháng năm: Căn sát lề phải (13-14pt nghiêng) */}
          <p className="text-[11.5pt] sm:text-[12pt] italic text-black text-right w-full mt-0.5 whitespace-nowrap">
            {displayLocation}, {printedAt || 'ngày … tháng … năm 2026'}
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
export interface PrintSignatureBlockProps {
  leftTitle?: string;
  middleTitle?: string;
  rightTitle?: string;
  location?: string;
  showDate?: boolean;
}

export function PrintSignatureBlock({
  leftTitle,
  middleTitle,
  rightTitle,
  location,
  showDate = false,
}: PrintSignatureBlockProps) {
  const [config] = useOrgConfig();
  const [printedAt, setPrintedAt] = React.useState<string>('');

  React.useEffect(() => {
    if (!showDate) return;
    const d = new Date();
    setPrintedAt(`ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`);
  }, [showDate]);

  const title1 = leftTitle ?? config.signerTitle1 ?? 'Người lập biểu';
  const title2 = middleTitle ?? config.signerTitle2 ?? 'Trưởng phòng Tổ chức - Cán bộ';
  const title3 = rightTitle ?? config.signerTitle3 ?? 'Thủ trưởng Cơ quan / Đơn vị';
  const displayLocation = location || config.location || 'TP. Hồ Chí Minh';

  return (
    <div className="font-times print-only mt-8 break-inside-avoid pt-4 text-black">
      <div className="grid grid-cols-3 gap-4 text-center items-start">
        <div>
          <p className="text-[12pt] font-bold uppercase text-black leading-snug">{title1}</p>
          <p className="text-[11pt] italic text-black mt-1">(Ký, ghi rõ họ tên)</p>
          <div className="h-24" />
        </div>
        <div>
          <p className="text-[12pt] font-bold uppercase text-black leading-snug">{title2}</p>
          <p className="text-[11pt] italic text-black mt-1">(Ký, ghi rõ họ tên)</p>
          <div className="h-24" />
        </div>
        <div>
          {showDate ? (
            <p className="text-[11pt] italic text-black mb-1">
              {displayLocation}, {printedAt || 'ngày … tháng … năm 2026'}
            </p>
          ) : null}
          <p className="text-[12pt] font-bold uppercase text-black leading-snug">{title3}</p>
          <p className="text-[11pt] italic text-black mt-1">(Ký, ghi rõ họ tên và đóng dấu)</p>
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Hàm in ấn độc lập dành riêng cho các biểu mẫu modal hành chính:
 * Trích xuất nội dung văn bản sang một iframe A4 độc lập, cách ly hoàn toàn
 * khỏi các quy tắc CSS ẩn của web app, đảm bảo in ra trang giấy rõ nét 100% không bao giờ bị trắng trang.
 */
export function printDocumentElement(elementId: string) {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Văn Bản Hành Chính - In Ấn</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 20mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Times New Roman', Times, serif;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-size: 12.5pt;
            line-height: 1.45;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            margin: 12px 0;
            font-size: 11pt;
          }
          th, td {
            border: 1px solid #000000;
            padding: 6px 4px;
            color: #000000;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch {
        // ignore
      }
    }, 1500);
  }, 250);
}

