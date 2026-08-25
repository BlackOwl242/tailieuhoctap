'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Eye, PencilLine } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { EMPLOYMENT_STATUS_LABEL } from '@/lib/hr';
import { Badge } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface EmployeeRow {
  id: string;
  employeeCode: string | null;
  fullName: string;
  email: string;
  jobTitle: string | null;
  orgUnit?: { name: string } | null;
  hireDate: string | null;
  employmentStatus: keyof typeof EMPLOYMENT_STATUS_LABEL;
  baseSalary: number | null;
}

/** UC09 — Danh sách hồ sơ nhân sự: bảng đầy đủ tính năng (Mục 6 + 8). */
export default function EmployeesPage() {
  const router = useRouter();
  const q = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<EmployeeRow[]>('/employees')).data,
  });

  const columns: DataColumn<EmployeeRow>[] = [
    {
      key: 'employeeCode', header: 'Mã NV', sortable: true,
      render: (r) => r.employeeCode ?? '—',
    },
    {
      key: 'fullName', header: 'Họ tên', sortable: true,
      render: (r) => (
        <Link href={`/employees/${r.id}`} className="font-medium text-primary hover:underline">
          {r.fullName}
        </Link>
      ),
    },
    { key: 'jobTitle', header: 'Chức danh', sortable: true, render: (r) => r.jobTitle ?? '—' },
    { key: 'orgUnit', header: 'Đơn vị', render: (r) => r.orgUnit?.name ?? '—', exportValue: (r) => r.orgUnit?.name ?? '' },
    { key: 'hireDate', header: 'Ngày vào', sortable: true, render: (r) => (r.hireDate ? formatDate(r.hireDate) : '—'), exportValue: (r) => (r.hireDate ? formatDate(r.hireDate) : '') },
    {
      key: 'employmentStatus', header: 'Trạng thái', sortable: true,
      render: (r) => (
        <Badge className={r.employmentStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : r.employmentStatus === 'PROBATION' ? 'bg-amber-100 text-amber-800' : 'bg-secondary'}>
          {EMPLOYMENT_STATUS_LABEL[r.employmentStatus] ?? r.employmentStatus}
        </Badge>
      ),
      exportValue: (r) => EMPLOYMENT_STATUS_LABEL[r.employmentStatus] ?? r.employmentStatus,
    },
  ];

  return (
    <>
      <PageHeader
        title="Nhân sự"
        description="Hồ sơ nhân viên, hợp đồng lao động và văn bằng chứng chỉ — kho lưu trữ kép."
      />
      <div className="print-area">
        <PrintFrame title="DANH SÁCH NHÂN SỰ" subtitle={`Tổng cộng ${q.data?.length ?? 0} nhân viên`} />
        {q.isError ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={q.data ?? []}
            rowKey={(r) => r.id}
            loading={q.isLoading}
            exportFilename="danh-sach-nhan-su"
            printLabel="In danh sách"
            searchFields={(r) => [r.fullName, r.email, r.employeeCode ?? '', r.jobTitle ?? '', r.orgUnit?.name ?? '']}
            filters={[
              {
                key: 'status', label: 'Trạng thái',
                value: (r) => r.employmentStatus,
                options: Object.entries(EMPLOYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
              },
            ]}
            emptyTitle="Chưa có hồ sơ nhân sự"
            actions={(r): RowActionItem[] => [
              { label: 'Xem hồ sơ chi tiết', icon: Eye, onSelect: () => router.push(`/employees/${r.id}`) },
              { label: 'Sửa thông tin HR', icon: PencilLine, onSelect: () => router.push(`/employees/${r.id}`) },
            ]}
          />
        )}
        <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng HC-NS" rightTitle="Giám đốc điều hành" />
      </div>
    </>
  );
}
