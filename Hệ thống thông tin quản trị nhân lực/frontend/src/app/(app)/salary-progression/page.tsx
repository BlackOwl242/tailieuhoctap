'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, Award, Calendar,
  ShieldAlert, Clock, User, Check, X,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, Card, Input } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface ProgressionItem {
  userId: string;
  employeeCode: string;
  fullName: string;
  jobTitle: string;
  orgUnitName: string;
  rankCode: string;
  rankName: string;
  groupCode: string;
  currentStep: number;
  totalSteps: number;
  currentCoefficient: number;
  salaryStepDate: string;
  monthsHeld: number;
  requiredMonths: number;
  isOverdue: boolean;
  progressionType: 'STEP_PROMOTION' | 'OVER_GRADE_ALLOWANCE' | 'NONE';
  nextStep: number;
  nextCoefficient: number;
  currentOverGradePercent: number;
  suggestedOverGradePercent: number;
}

export default function SalaryProgressionPage() {
  const queryClient = useQueryClient();
  const [selectedPerson, setSelectedPerson] = useState<ProgressionItem | null>(null);
  const [approvalDecisionNo, setApprovalDecisionNo] = useState(`QĐ-NL/${new Date().getFullYear()}`);

  const qScan = useQuery({
    queryKey: ['salary-progression-scan'],
    queryFn: async () => {
      const res = await api.get('/personnel-ranks/progression/scan');
      return res.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/personnel-ranks/progression/apply', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-progression-scan'] });
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      setSelectedPerson(null);
      alert('Đã phê duyệt nâng bậc lương thành công!');
    },
    onError: (err) => {
      alert('Lỗi phê duyệt: ' + errorMessage(err));
    },
  });

  const allItems: ProgressionItem[] = [
    ...(qScan.data?.eligibleList || []),
    ...(qScan.data?.normalList || []),
  ];

  const columns: DataColumn<ProgressionItem>[] = [
    {
      key: 'employeeCode',
      header: 'Mã NV',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {r.employeeCode || '—'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Họ và tên',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-bold text-slate-900">{r.fullName}</div>
          <div className="text-xs text-muted-foreground">{r.jobTitle} • {r.orgUnitName}</div>
        </div>
      ),
    },
    {
      key: 'rank',
      header: 'Ngạch hiện tại',
      render: (r) => (
        <div>
          <div className="text-xs font-semibold text-foreground">
            {r.rankName}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            Bậc {r.currentStep}/{r.totalSteps} (HS: {r.currentCoefficient.toFixed(2)})
          </div>
        </div>
      ),
    },
    {
      key: 'stepDate',
      header: 'Ngày hưởng bậc',
      render: (r) => (
        <div>
          <div className="text-xs font-medium text-slate-800">{formatDate(r.salaryStepDate)}</div>
          <div className="text-[11px] text-muted-foreground">
            Đã giữ: <span className="font-semibold text-slate-700">{r.monthsHeld} tháng</span> / {r.requiredMonths} th
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Tình trạng nâng bậc',
      sortable: true,
      render: (r) => {
        if (r.progressionType === 'STEP_PROMOTION') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Đủ điều kiện nâng Bậc {r.nextStep} (HS: {r.nextCoefficient.toFixed(2)})
            </span>
          );
        }
        if (r.progressionType === 'OVER_GRADE_ALLOWANCE') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
              Đạt thâm niên vượt khung ({r.suggestedOverGradePercent}%)
            </span>
          );
        }
        return (
          <span className="text-xs text-muted-foreground">
            Chưa đến hạn (còn {r.requiredMonths - r.monthsHeld} tháng)
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Quét & Tự động Nâng bậc Lương Định kỳ"
        description="Bộ máy quét tự động phát hiện nhân sự đạt đủ thời gian giữ bậc (36 tháng cho ngạch đại học, 24 tháng cho ngạch cán sự) và tính tỷ lệ thâm niên vượt khung."
        actions={
          <Button
            onClick={() => qScan.refetch()}
            disabled={qScan.isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${qScan.isFetching ? 'animate-spin' : ''}`} />
            Quét lại danh sách
          </Button>
        }
      />

      {/* KPI Cards Thống kê kết quả quét */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Tổng hồ sơ quét</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{qScan.data?.totalScanned || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Đã cấu hình ngạch bậc</div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 uppercase">Đủ điều kiện nâng bậc</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{qScan.data?.eligibleCount || 0}</div>
          <div className="text-xs text-emerald-600 mt-1">Đạt đủ 24/36 tháng giữ bậc</div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase">Quá hạn chưa duyệt</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{qScan.data?.overdueCount || 0}</div>
          <div className="text-xs text-amber-600 mt-1">Quá hạn {'>'} 3 tháng</div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-700 uppercase">Kịch trần ngạch</div>
          <div className="text-2xl font-bold text-purple-800 mt-1">
            {allItems.filter((i) => i.currentStep >= i.totalSteps).length}
          </div>
          <div className="text-xs text-purple-600 mt-1">Hưởng thâm niên vượt khung</div>
        </Card>
      </div>

      <div className="print-area">
        <PrintFrame
          title="DANH SÁCH ĐỀ NGHỊ NÂNG BẬC LƯƠNG ĐỊNH KỲ"
          subtitle={`Quét ngày ${formatDate(new Date().toISOString())} — ${qScan.data?.eligibleCount || 0} trường hợp đủ điều kiện`}
        />

        {qScan.isError ? (
          <ErrorState message={errorMessage(qScan.error)} onRetry={() => qScan.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={allItems}
            rowKey={(r) => r.userId}
            loading={qScan.isLoading}
            exportFilename="danh-sach-de-nghi-nang-luong"
            printLabel="In danh sách nâng lương"
            searchFields={(r) => [r.fullName, r.employeeCode, r.rankName, r.jobTitle, r.orgUnitName]}
            filters={[
              {
                key: 'progression',
                label: 'Trạng thái xét duyệt',
                value: (r) => r.progressionType,
                options: [
                  { value: 'STEP_PROMOTION', label: 'Đủ điều kiện nâng bậc liền kề' },
                  { value: 'OVER_GRADE_ALLOWANCE', label: 'Đạt thâm niên vượt khung' },
                  { value: 'NONE', label: 'Chưa đến hạn nâng bậc' },
                ],
              },
            ]}
            emptyTitle="Không có dữ liệu nâng bậc lương"
            actions={(r): RowActionItem[] => [
              {
                label: 'Phê duyệt nâng bậc / Vượt khung',
                icon: CheckCircle2,
                onSelect: () => setSelectedPerson(r),
              },
            ]}
          />
        )}

        <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
      </div>

      {/* Modal Phê duyệt Nâng bậc Lương */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Phê duyệt Nâng bậc Lương</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nhân sự: <span className="font-semibold text-slate-800">{selectedPerson.fullName}</span> ({selectedPerson.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngạch lương:</span>
                <span className="font-bold text-slate-800">{selectedPerson.rankName} ({selectedPerson.rankCode})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bậc lương:</span>
                <span className="font-semibold">
                  Bậc {selectedPerson.currentStep} (HS {selectedPerson.currentCoefficient.toFixed(2)}) 
                  <span className="text-primary font-bold mx-1.5">➔</span> 
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Bậc {selectedPerson.nextStep} (HS {selectedPerson.nextCoefficient.toFixed(2)})
                  </span>
                </span>
              </div>
              {selectedPerson.progressionType === 'OVER_GRADE_ALLOWANCE' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phụ cấp thâm niên vượt khung:</span>
                  <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    {selectedPerson.suggestedOverGradePercent}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian đã giữ bậc:</span>
                <span className="font-semibold text-slate-700">{selectedPerson.monthsHeld} tháng / {selectedPerson.requiredMonths} tháng</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 mb-1 block">Số Quyết định nâng lương</label>
                <Input
                  value={approvalDecisionNo}
                  onChange={(e) => setApprovalDecisionNo(e.target.value)}
                  placeholder="Ví dụ: QĐ-NL/2026"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setSelectedPerson(null)}>
                Hủy
              </Button>
              <Button
                onClick={() =>
                  applyMutation.mutate({
                    userId: selectedPerson.userId,
                    nextStep: selectedPerson.nextStep,
                    nextCoefficient: selectedPerson.nextCoefficient,
                    overGradePercent: selectedPerson.suggestedOverGradePercent,
                    decisionNo: approvalDecisionNo,
                  })
                }
                disabled={applyMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {applyMutation.isPending ? 'Đang duyệt...' : 'Xác nhận Nâng bậc'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
