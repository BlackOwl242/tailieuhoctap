'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

/**
 * In ấn dùng chung (Mục 8):
 * - `PrintButton`: nút gọi window.print() — đặt trong PageHeader actions;
 * - `PrintFrame`: khung tiêu đề phiếu chỉ HIỂN KHI IN (logo công ty, tên phiếu,
 *   thời điểm in, người in) — đặt đầu tiên bên trong .print-area.
 */
export function PrintButton({ label = 'In phiếu', className }: { label?: string; className?: string }) {
  return (
    <Button variant="outline" size="sm" className={`no-print ${className ?? ''}`} onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> {label}
    </Button>
  );
}

export function PrintFrame({ title, subtitle }: { title: string; subtitle?: string }) {
  const [printedAt, setPrintedAt] = React.useState<string>('');
  React.useEffect(() => setPrintedAt(new Date().toLocaleString('vi-VN')), []);
  return (
    <div className="print-only mb-4 border-b pb-3 text-center">
      <p className="text-base font-bold uppercase tracking-wide">CÔNG TY CỔ PHẦN PHẦN MỀM SAIGON TECHNOLOGY</p>
      <p className="mt-1 text-lg font-bold">{title}</p>
      {subtitle ? <p className="text-sm">{subtitle}</p> : null}
      <p className="mt-1 text-xs text-slate-500">Thời điểm in: {printedAt}</p>
    </div>
  );
}
