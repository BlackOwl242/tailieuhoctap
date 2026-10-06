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
 * Khung tiêu đề dùng chung cho báo cáo nội bộ; không xác nhận tuân thủ biểu mẫu pháp quy.
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
      {/* Header 2 cột tùy chọn cho báo cáo nội bộ */}
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
 * Khung chữ ký cuối trang cho tài liệu nội bộ (12-13pt).
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
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  // Keep the print document at the paper width so responsive layouts and
  // utility classes are evaluated as they would be on an A4 sheet.
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const pageStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'))
    .map((styleNode) => {
      const copy = styleNode.cloneNode(true) as HTMLElement;
      if (copy instanceof HTMLLinkElement && copy.href) {
        // Relative Next.js asset URLs must be absolute in the about:blank print frame.
        copy.href = copy.href;
      }
      return copy.outerHTML;
    })
    .join('\n');
  const htmlClass = document.documentElement.className;
  const bodyClass = document.body.className;
  const printRootId = elementId.replace(/[^a-zA-Z0-9_-]/g, '');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="vi" class="${htmlClass}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Văn Bản Hành Chính - In Ấn</title>
        ${pageStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            width: auto !important;
            min-width: 0 !important;
            max-width: none !important;
            background: #ffffff;
            color: #000000;
            font-size: 12.5pt;
            line-height: 1.45;
            font-family: 'Times New Roman', Times, serif !important;
          }
          body > #${printRootId} {
            min-height: 0 !important;
          }
          #${printRootId} {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 15mm 15mm 15mm 20mm !important;
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
          #${printRootId} * {
            font-family: 'Times New Roman', Times, serif !important;
            color: #000000;
          }
          #${printRootId} .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          #${printRootId} .grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          #${printRootId} .print-a4-compact {
            font-size: 10.5pt !important;
            line-height: 1.25 !important;
          }
          #${printRootId} .print-a4-compact .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
            padding: 0 !important;
            border-radius: 0 !important;
            border: 0 !important;
            margin: 0 !important;
          }
          #${printRootId} .print-a4-compact .border-b,
          #${printRootId} .print-a4-compact .border-t {
            border: 0 !important;
          }
          #${printRootId} .print-a4-compact .print-field {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          #${printRootId} .print-a4-compact .print-write-area {
            display: block;
            position: relative !important;
            width: 100%;
            border: 0 !important;
            background: transparent !important;
          }
          #${printRootId} .print-write-area-identity::after,
          #${printRootId} .print-write-area-response::before,
          #${printRootId} .print-write-area-response::after,
          #${printRootId} .print-score-slot,
          #${printRootId} .print-signature-rule {
            border-bottom: 0.75pt dotted #555555 !important;
          }
          #${printRootId} .print-write-area-identity::after,
          #${printRootId} .print-write-area-response::before,
          #${printRootId} .print-write-area-response::after {
            content: "" !important;
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
          }
          #${printRootId} .print-write-area-identity::after,
          #${printRootId} .print-write-area-response::after {
            bottom: 1mm !important;
          }
          #${printRootId} .print-write-area-response::before {
            bottom: 8mm !important;
          }
          #${printRootId} .print-score-slot {
            display: inline-block !important;
            height: 1em !important;
            vertical-align: baseline !important;
          }
          #${printRootId} .print-score-entry { white-space: nowrap !important; }
          #${printRootId} .print-score-slot-5 { width: 9mm !important; }
          #${printRootId} .print-score-slot-100 { width: 6mm !important; }
          #${printRootId} .print-score-slot-money { width: 8mm !important; }
          #${printRootId} .print-signature-rule {
            width: 45mm !important;
            max-width: 100% !important;
            height: 1px !important;
            margin: 0 auto !important;
          }
          #${printRootId} .print-a4-compact .print-signatures {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-top: 10pt !important;
          }
          #${printRootId} .print-a4-compact .space-y-1 > :not(:last-child),
          #${printRootId} .print-a4-compact .space-y-2 > :not(:last-child),
          #${printRootId} .print-a4-compact .space-y-3 > :not(:last-child),
          #${printRootId} .print-a4-compact .space-y-4 > :not(:last-child) {
            margin-block-end: 4pt !important;
          }
          #${printRootId} .print-a4-compact .text-xs {
            font-size: 9pt !important;
          }
          #${printRootId}.print-a4-clean-template div[class*="border"],
          #${printRootId}.print-a4-clean-template p[class*="border"] {
            border: 0 !important;
          }
          #${printRootId}.print-a4-clean-template hr {
            display: none !important;
          }
          #${printRootId}.print-a4-clean-template table {
            border: 0 !important;
          }
          #${printRootId}.print-a4-clean-template th,
          #${printRootId}.print-a4-clean-template td {
            border-top: 0 !important;
            border-bottom: 0 !important;
          }
          #${printRootId}.print-a4-clean-template th:first-child,
          #${printRootId}.print-a4-clean-template td:first-child {
            border-left: 0 !important;
          }
          #${printRootId}.print-a4-clean-template th:last-child,
          #${printRootId}.print-a4-clean-template td:last-child {
            border-right: 0 !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            margin: 12px 0;
            font-size: 11pt;
            table-layout: fixed;
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
      <body class="${bodyClass}">
        ${element.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  const printWindow = iframe.contentWindow;
  if (!printWindow) return;
  const removeFrame = () => {
    window.setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 500);
  };
  printWindow.addEventListener('afterprint', removeFrame, { once: true });
  const waitForStylesheet = (link: HTMLLinkElement) => new Promise<void>((resolve) => {
    if (link.sheet) {
      resolve();
      return;
    }
    const done = () => {
      window.clearTimeout(timeout);
      link.removeEventListener('load', done);
      link.removeEventListener('error', done);
      resolve();
    };
    const timeout = window.setTimeout(done, 5000);
    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
  });
  void Promise.all(Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]')).map(link => waitForStylesheet(link as HTMLLinkElement)))
    .then(() => printWindow.document.fonts.ready)
    .then(() => {
      printWindow.focus();
      printWindow.print();
    })
    .catch(removeFrame);
}

