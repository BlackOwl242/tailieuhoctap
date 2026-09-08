'use client';

import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface AuditRow {
  id: number; action: string; entityType: string; entityId: string | null;
  createdAt: string; ip: string | null;
  actor?: { fullName: string; email: string } | null;
}

/** KC22 — Nhật ký kiểm toán append-only: chỉ tra cứu, không có thao tác ghi. */
export default function AdminAuditPage() {
  const q = useQuery({
    queryKey: ['audit'],
    queryFn: async () => (await api.get<{ items: AuditRow[] }>('/admin/audit-logs')).data.items,
  });

  const columns: DataColumn<AuditRow>[] = [
    { key: 'createdAt', header: 'Thời điểm', sortable: true, render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span> },
    { key: 'actor', header: 'Người thực hiện', sortable: true, sortValue: (r) => r.actor?.fullName ?? '', render: (r) => r.actor?.fullName ?? 'Hệ thống' },
    { key: 'action', header: 'Hành động', sortable: true, render: (r) => <code className="text-xs font-mono font-medium text-foreground">{r.action}</code>, exportValue: (r) => r.action },
    { key: 'entityType', header: 'Đối tượng', sortable: true, render: (r) => (
      <span className="text-xs text-muted-foreground">{r.entityType}{r.entityId ? ` · ${r.entityId.slice(0, 8)}…` : ''}</span>
    ), exportValue: (r) => `${r.entityType} (${r.entityId ?? ''})` },
    { key: 'ip', header: 'IP', render: (r) => r.ip ?? '—' },
  ];

  return (
    <>
      <PageHeader
        title="Nhật ký kiểm toán"
        description="Bản ghi chỉ thêm, không sửa/xóa — truy vết mọi thao tác quan trọng."
      />
      <div className="print-area">
        <PrintFrame title="NHẬT KÝ KIỂM TOÁN HỆ THỐNG" />
        {q.isError ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={q.data ?? []}
            rowKey={(r) => String(r.id)}
            loading={q.isLoading}
            exportFilename="nhat-ky-kiem-toan"
            printLabel="In nhật ký kiểm toán"
            pageSize={20}
            searchFields={(r) => [r.action, r.entityType, r.actor?.fullName ?? '', r.actor?.email ?? '']}
            emptyTitle="Chưa có bản ghi nào"
          />
        )}
        <PrintSignatureBlock leftTitle="Cán bộ kiểm toán" middleTitle="Trưởng ban ATTT" rightTitle="Giám đốc điều hành" />
      </div>
    </>
  );
}
