'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Button, Badge } from '@/components/ui/primitives';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface AuditRow {
  id: number | string; action: string; entityType: string; entityId: string | null;
  createdAt: string; ip: string | null;
  prevHash?: string | null; entryHash?: string | null;
  actor?: { fullName: string; email: string } | null;
}

interface AuditVerifyResult {
  valid: boolean;
  totalRows: number;
  chainedRows: number;
  legacyRows: number;
  brokenAtId: string | null;
  reason?: string;
  latestHash: string | null;
  verifiedAt: string;
}

/** KC22 — Nhật ký kiểm toán append-only: chỉ tra cứu & kiểm chứng chuỗi băm SHA-256, không có thao tác ghi. */
export default function AdminAuditPage() {
  const q = useQuery({
    queryKey: ['audit'],
    queryFn: async () => (await api.get<{ items: AuditRow[] }>('/admin/audit-logs')).data.items,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => (await api.get<AuditVerifyResult>('/admin/audit-logs/verify')).data,
  });

  const columns: DataColumn<AuditRow>[] = [
    { key: 'createdAt', header: 'Thời điểm', sortable: true, render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span> },
    { key: 'actor', header: 'Người thực hiện', sortable: true, sortValue: (r) => r.actor?.fullName ?? '', render: (r) => r.actor?.fullName ?? 'Hệ thống' },
    { key: 'action', header: 'Hành động', sortable: true, render: (r) => <code className="text-xs font-mono font-medium text-foreground">{r.action}</code>, exportValue: (r) => r.action },
    { key: 'entityType', header: 'Đối tượng', sortable: true, render: (r) => (
      <span className="text-xs text-muted-foreground">{r.entityType}{r.entityId ? ` · ${r.entityId.slice(0, 8)}…` : ''}</span>
    ), exportValue: (r) => `${r.entityType} (${r.entityId ?? ''})` },
    {
      key: 'entryHash',
      header: 'Mã băm SHA-256',
      render: (r) =>
        r.entryHash ? (
          <code title={r.entryHash} className="font-mono text-[11px] text-muted-foreground">
            {r.entryHash.slice(0, 12)}…
          </code>
        ) : (
          <span className="text-xs text-muted-foreground">Bản ghi cũ (pre-SOX)</span>
        ),
      exportValue: (r) => r.entryHash ?? '',
    },
    { key: 'ip', header: 'IP', render: (r) => r.ip && !['-', '—', '–'].includes(r.ip.trim()) ? r.ip : 'Chưa cập nhật' },
  ];

  const verifyData = verifyMutation.data;

  return (
    <>
      <PageHeader
        title="Nhật ký"
        description="Bản ghi append-only khóa ở mức trigger PostgreSQL + chuỗi băm SHA-256 (SOX / ISO 27001)."
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate()}
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            {verifyMutation.isPending ? 'Đang kiểm chứng…' : 'Kiểm chứng chuỗi băm (SOX)'}
          </Button>
        }
      />

      {verifyMutation.isError ? (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {errorMessage(verifyMutation.error)}
        </div>
      ) : null}

      {verifyData ? (
        <div
          className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-xs ${
            verifyData.valid
              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {verifyData.valid ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            )}
            <div className="space-y-0.5">
              <p className="font-semibold">
                {verifyData.valid
                  ? 'Chuỗi kiểm toán toàn vẹn (Valid SHA-256 Hash Chain)'
                  : `Phát hiện bất thường tại bản ghi #${verifyData.brokenAtId ?? 'unknown'}`}
              </p>
              <p className="text-muted-foreground">
                Tổng {verifyData.totalRows} bản ghi · {verifyData.chainedRows} bản ghi có băm SHA-256 ·{' '}
                {verifyData.legacyRows} bản ghi cũ (pre-SOX)
                {verifyData.reason ? ` · Lý do: ${verifyData.reason}` : ''}
              </p>
              {verifyData.latestHash ? (
                <p className="font-mono text-[11px] text-muted-foreground">
                  Latest hash: {verifyData.latestHash.slice(0, 24)}… · Kiểm chứng lúc{' '}
                  {formatDateTime(verifyData.verifiedAt)}
                </p>
              ) : null}
            </div>
          </div>
          <span className={verifyData.valid ? 'shrink-0 text-emerald-700 dark:text-emerald-400' : 'shrink-0 text-destructive'}>
            <Badge variant={verifyData.valid ? 'default' : 'destructive'} style={{ fontWeight: 600 }}>
              {verifyData.valid ? 'SOX OK' : 'TAMPERED'}
            </Badge>
          </span>
        </div>
      ) : null}

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
            searchFields={(r) => [r.action, r.entityType, r.entryHash ?? '', r.actor?.fullName ?? '', r.actor?.email ?? '']}
            emptyTitle="Chưa có bản ghi nào"
          />
        )}
        <PrintSignatureBlock leftTitle="Cán bộ kiểm toán" middleTitle="Trưởng ban ATTT" rightTitle="Giám đốc điều hành" />
      </div>
    </>
  );
}
