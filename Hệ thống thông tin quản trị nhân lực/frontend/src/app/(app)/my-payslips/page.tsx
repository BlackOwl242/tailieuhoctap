'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Wallet } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { LoadingState } from '@/components/common/states';

type Slip = {
  id: string;
  employeeName: string;
  employeeCode?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  workingDays: number;
  actualWorkDays: number;
  baseSalary: number;
  grossPay: number;
  totalDeduction: number;
  netPay: number;
  status: string;
  breakdown?: { earnings?: { name: string; amount: number; basisReference?: string | null }[]; deductions?: { name: string; amount: number; basisReference?: string | null }[] };
  payrollRun: { id: string; periodName: string; fromDate: string; toDate: string; status: string };
};

const money = (amount: number) => `${(amount || 0).toLocaleString('vi-VN')} đ`;
const statusName: Record<string, string> = { APPROVED: 'Đã duyệt', LOCKED: 'Đã khóa', PAID: 'Đã thanh toán' };

export default function MyPayslipsPage() {
  const { data: slips = [], isLoading, isError, refetch } = useQuery<Slip[]>({
    queryKey: ['my-payslips'],
    queryFn: async () => (await api.get('/hrms/payroll/my-slips')).data,
  });

  return <div className="space-y-6 pb-12">
    <WorkspaceHeader
      title="Phiếu lương của tôi"
      description="Các phiếu lương đã được duyệt của tài khoản đang đăng nhập."
      breadcrumbs={[{ label: 'Cổng Cá nhân', href: '/ess' }, { label: 'Phiếu lương' }]}
      actions={<Link href="/ess" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><ArrowLeft className="h-4 w-4" /> Về ESS</Link>}
    />

    {isLoading ? <LoadingState /> : isError ? <div className="rounded-lg border border-border p-6 text-sm">
      <p>Không tải được phiếu lương. Vui lòng thử lại.</p>
      <button className="mt-3 underline" onClick={() => void refetch()}>Tải lại</button>
    </div> : slips.length === 0 ? <div className="rounded-lg border border-border bg-card p-8 text-center">
      <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-semibold">Chưa có phiếu lương được công bố</p>
      <p className="mt-1 text-sm text-muted-foreground">Phiếu lương sẽ xuất hiện tại đây sau khi kỳ lương được duyệt.</p>
    </div> : <div className="space-y-4">{slips.map((slip) => <article key={slip.id} className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="font-semibold">{slip.payrollRun?.periodName || new Date(slip.payrollRun?.fromDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{slip.employeeName} · {slip.employeeCode || 'Chưa có mã NV'} · {slip.department || 'Chưa cập nhật đơn vị'}</p>
        </div>
        <span className="text-sm">{statusName[slip.status] || statusName[slip.payrollRun?.status] || 'Đã duyệt'}</span>
      </div>
      <div className="grid gap-4 py-4 sm:grid-cols-4">
        <div><p className="text-xs text-muted-foreground">Lương căn cứ</p><p className="mt-1 font-medium">{money(slip.baseSalary)}</p></div>
        <div><p className="text-xs text-muted-foreground">Tổng thu nhập</p><p className="mt-1 font-medium">{money(slip.grossPay)}</p></div>
        <div><p className="text-xs text-muted-foreground">Tổng khấu trừ</p><p className="mt-1 font-medium">{money(slip.totalDeduction)}</p></div>
        <div><p className="text-xs text-muted-foreground">Thực lĩnh</p><p className="mt-1 text-lg font-bold">{money(slip.netPay)}</p></div>
      </div>
      <p className="border-t border-border pt-3 text-sm text-muted-foreground">Ngày công hưởng lương: {slip.actualWorkDays}/{slip.workingDays} công</p>
      <details className="mt-4 border-t border-border pt-3">
        <summary className="cursor-pointer text-sm font-medium">Xem chi tiết khoản thu và khấu trừ</summary>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div><h3 className="mb-2 text-sm font-semibold">Các khoản thu nhập</h3>{(slip.breakdown?.earnings ?? []).length ? slip.breakdown!.earnings!.map((line, i) => <div key={i} className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm"><span>{line.name}<small className="mt-1 block text-xs text-muted-foreground">{line.basisReference || 'Phiếu cũ chưa lưu căn cứ cho khoản này'}</small></span><span className="shrink-0">{money(line.amount)}</span></div>) : <p className="text-sm text-muted-foreground">Không có chi tiết khoản thu.</p>}</div>
          <div><h3 className="mb-2 text-sm font-semibold">Các khoản khấu trừ</h3>{(slip.breakdown?.deductions ?? []).length ? slip.breakdown!.deductions!.map((line, i) => <div key={i} className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm"><span>{line.name}<small className="mt-1 block text-xs text-muted-foreground">{line.basisReference || 'Phiếu cũ chưa lưu căn cứ cho khoản này'}</small></span><span className="shrink-0">{money(line.amount)}</span></div>) : <p className="text-sm text-muted-foreground">Không có khoản khấu trừ.</p>}</div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Thực lĩnh = tổng thu nhập − tổng khấu trừ. Nếu số liệu ngày công hoặc khoản khấu trừ chưa đúng, liên hệ HR/Kế toán để đối soát.</p>
      </details>
      <div className="mt-4 flex justify-end"><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><Printer className="h-4 w-4" /> In trang</button></div>
    </article>)}</div>}
  </div>;
}
