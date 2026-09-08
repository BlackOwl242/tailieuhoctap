'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Layers, Search, Eye, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface PersonnelRankRow {
  code: string;
  name: string;
  groupCode: string;
  field: string | null;
  totalSteps: number;
  stepMonths: number;
  coefficients: number[];
}

export default function SalaryRanksPage() {
  const router = useRouter();
  const [selectedRank, setSelectedRank] = useState<PersonnelRankRow | null>(null);

  const qRanks = useQuery({
    queryKey: ['personnel-ranks'],
    queryFn: async () => (await api.get<PersonnelRankRow[]>('/personnel-ranks')).data,
  });

  const columns: DataColumn<PersonnelRankRow>[] = [
    {
      key: 'code',
      header: 'Mã ngạch',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {r.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Tên ngạch lương',
      sortable: true,
      render: (r) => (
        <div>
          <button
            onClick={() => setSelectedRank(r)}
            className="font-semibold text-slate-900 hover:text-primary text-left block"
          >
            {r.name}
          </button>
          <span className="text-xs text-muted-foreground">{r.field || 'Hành chính / Chuyên môn'}</span>
        </div>
      ),
    },
    {
      key: 'groupCode',
      header: 'Nhóm ngạch',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          Loại {r.groupCode}
        </span>
      ),
    },
    {
      key: 'totalSteps',
      header: 'Số bậc tối đa',
      sortable: true,
      render: (r) => <span className="font-semibold">{r.totalSteps} bậc</span>,
    },
    {
      key: 'stepMonths',
      header: 'Chu kỳ nâng bậc',
      sortable: true,
      render: (r) => (
        <span className="text-xs font-medium text-slate-700">
          {r.stepMonths} tháng ({Math.round(r.stepMonths / 12)} năm)
        </span>
      ),
    },
    {
      key: 'coefficientsRange',
      header: 'Khung hệ số lương',
      render: (r) => {
        const coefs = r.coefficients || [];
        if (coefs.length === 0) return '—';
        return (
          <span className="font-mono text-xs text-slate-800">
            {coefs[0]?.toFixed(2)} → {coefs[coefs.length - 1]?.toFixed(2)}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Danh mục Ngạch bậc & Thang bảng Lương"
        description="Hệ thống 184 ngạch bậc lương tiêu chuẩn (Loại A3, A2, A1, B, C) với chu kỳ nâng bậc 24/36 tháng và các hệ số bậc lương."
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/salary-progression')}
              className="flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4" /> Quét Nâng bậc Lương Tự động
            </Button>
          </div>
        }
      />

      <div className="print-area">
        <PrintFrame
          title="DANH MỤC NGẠCH BẬC LƯƠNG TIÊU CHUẨN"
          subtitle={`Tổng số ${qRanks.data?.length || 0} ngạch bậc được cấu hình`}
        />

        {qRanks.isError ? (
          <ErrorState message={errorMessage(qRanks.error)} onRetry={() => qRanks.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={qRanks.data || []}
            rowKey={(r) => r.code}
            loading={qRanks.isLoading}
            exportFilename="danh-muc-ngach-bac-luong"
            printLabel="In danh mục"
            searchFields={(r) => [r.code, r.name, r.groupCode, r.field || '']}
            filters={[
              {
                key: 'groupCode',
                label: 'Nhóm ngạch',
                value: (r) => r.groupCode,
                options: [
                  { value: 'A3', label: 'Nhóm A3 (Cao cấp: 6 bậc, 36 tháng)' },
                  { value: 'A2', label: 'Nhóm A2 (Chính: 8 bậc, 36 tháng)' },
                  { value: 'A1', label: 'Nhóm A1 (Chuyên viên/Kỹ sư: 9 bậc, 36 tháng)' },
                  { value: 'B', label: 'Nhóm B (Cán sự/Kỹ thuật viên: 12 bậc, 24 tháng)' },
                  { value: 'C', label: 'Nhóm C (Nhân viên/Phục vụ: 12 bậc, 24 tháng)' },
                ],
              },
            ]}
            emptyTitle="Chưa có dữ liệu ngạch bậc lương"
            actions={(r): RowActionItem[] => [
              {
                label: 'Xem chi tiết các bậc hệ số',
                icon: Eye,
                onSelect: () => setSelectedRank(r),
              },
            ]}
          />
        )}

        <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng TC-NS" rightTitle="Thủ trưởng đơn vị" />
      </div>

      {/* Modal Chi tiết Bậc Lương của Ngạch */}
      {selectedRank && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-2xl bg-white shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {selectedRank.code}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900">{selectedRank.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nhóm ngạch: <span className="font-semibold text-slate-700">Loại {selectedRank.groupCode}</span> • Lĩnh vực: {selectedRank.field || 'Hành chính'} • Chu kỳ giữ bậc: <span className="font-semibold text-primary">{selectedRank.stepMonths} tháng</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRank(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                Bảng phân bổ Hệ số Lương theo từng Bậc:
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {selectedRank.coefficients?.map((coef, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center hover:border-primary/50 transition"
                  >
                    <div className="text-[11px] font-semibold text-muted-foreground">BẬC {idx + 1}</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {Number(coef).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Quy chế Phụ cấp Thâm niên Vượt khung:
              </div>
              <p>
                Sau khi hưởng Bậc {selectedRank.totalSteps} đủ {selectedRank.stepMonths} tháng, cán bộ được tính hưởng 5% phụ cấp thâm niên vượt khung. Từ năm thứ 2 trở đi, mỗi năm cộng thêm 1%.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedRank(null)}>
                Đóng
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
