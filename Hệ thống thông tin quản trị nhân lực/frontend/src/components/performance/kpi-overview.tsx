'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, Select } from '@/components/ui/primitives';
import { DataTable, type DataColumn } from '@/components/ui/data-table';
import { ErrorState, EmptyState } from '@/components/common/states';

type Stage = 'NO_GOALS' | 'INVALID_WEIGHT' | 'MISSING_EVIDENCE' | 'WAITING_SCORE' | 'NEEDS_SUPPORT' | 'COMPLETE';
interface OverviewRow {
  userId: string; employeeName: string; employeeCode: string | null;
  orgUnit: { id: string; name: string } | null;
  goalCount: number; scoredCount: number; evidenceCount: number; weight: number;
  score: number | null; stage: Stage; overdue: boolean;
}
const stages: Record<Stage, string> = {
  NO_GOALS: 'Chưa giao KPI', INVALID_WEIGHT: 'Cần sửa trọng số', MISSING_EVIDENCE: 'Thiếu minh chứng',
  WAITING_SCORE: 'Chờ quản lý chấm', NEEDS_SUPPORT: 'Cần hỗ trợ', COMPLETE: 'Đã đủ đánh giá',
};
const scoreText = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
const classification = (score: number) => score >= 90 ? 'Xuất sắc' : score >= 75 ? 'Tốt' : score >= 50 ? 'Hoàn thành' : 'Không hoàn thành';
function nextStep(row: OverviewRow) {
  if (row.stage === 'NO_GOALS') return 'Giao mục tiêu và thống nhất chỉ tiêu với nhân viên.';
  if (row.stage === 'INVALID_WEIGHT') return `Rà soát trọng số: hiện ${scoreText(row.weight)}%, cần đủ 100%.`;
  if (row.stage === 'MISSING_EVIDENCE') return `Còn ${row.goalCount - row.evidenceCount} KPI cần kết quả và minh chứng.`;
  if (row.stage === 'WAITING_SCORE') return `Còn ${row.goalCount - row.scoredCount} KPI cần quản lý đối chiếu và chấm.`;
  if (row.stage === 'NEEDS_SUPPORT') return 'Trao đổi nguyên nhân, thống nhất việc cải thiện và hạn rà soát.';
  return 'Rà soát kết quả và phản hồi trước khi đóng kỳ.';
}
function Progress({ value, total, label }: { value: number; total: number; label: string }) {
  return <div className="space-y-1"><div className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{value}/{total}</span></div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total || 1} aria-valuenow={value} className="h-1.5 overflow-hidden rounded-sm bg-muted"><div className="h-full bg-foreground/70" style={{ width: `${total ? value / total * 100 : 0}%` }} /></div></div>;
}

export function KpiOverview({ cycleId, accessKey, currentUserId, onOpenGoals }: {
  cycleId: string; accessKey: string[]; currentUserId?: string;
  onOpenGoals: (userId: string, cycleId: string, hasGoals: boolean) => void;
}) {
  const [unit, setUnit] = useState('ALL');
  const [stage, setStage] = useState('ALL');
  const query = useQuery<{ cycle: { id: string; name: string; endDate: string; status: string }; rows: OverviewRow[] }>({
    queryKey: ['hrms-performance-overview', ...accessKey, cycleId],
    queryFn: async () => (await api.get('/hrms/performance/overview', { params: { cycleId } })).data,
    enabled: Boolean(cycleId && currentUserId),
  });
  if (!cycleId) return <EmptyState title="Chưa có kỳ KPI doanh nghiệp" description="Tạo kỳ và xác định đối tượng để bắt đầu theo dõi." />;
  if (query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />;
  const allRows = query.data?.rows ?? [];
  const units = Array.from(new Map(allRows.filter(row => row.orgUnit).map(row => [row.orgUnit!.id, row.orgUnit!])).values());
  const effectiveUnit = units.some(item => item.id === unit) ? unit : 'ALL';
  const scopedRows = allRows.filter(row => effectiveUnit === 'ALL' || row.orgUnit?.id === effectiveUnit);
  const counts = (key: Stage) => scopedRows.filter(row => row.stage === key).length;
  const complete = scopedRows.filter(row => row.score !== null).length;
  const cards = [
    { title: 'Nhân sự trong phạm vi', value: scopedRows.length, filter: 'ALL', hint: 'Gồm cả người chưa được giao KPI' },
    { title: 'Chưa giao KPI', value: counts('NO_GOALS'), filter: 'NO_GOALS', hint: 'Cần thiết lập mục tiêu' },
    { title: 'Chưa đủ đánh giá', value: scopedRows.length - complete, filter: 'INCOMPLETE', hint: 'Thiếu mục tiêu, trọng số, minh chứng hoặc điểm' },
    { title: 'Cần hỗ trợ', value: counts('NEEDS_SUPPORT'), filter: 'NEEDS_SUPPORT', hint: 'Đã đủ căn cứ, tổng điểm dưới 50' },
  ];
  const rows = scopedRows.filter(row => stage === 'ALL' || (stage === 'INCOMPLETE' ? row.score === null : row.stage === stage));
  const columns: DataColumn<OverviewRow>[] = [
    { key: 'employeeName', header: 'Nhân viên', minWidth: 180, sortable: true, render: row => <div className="space-y-1"><p className="font-medium">{row.employeeName}</p><p className="text-xs text-muted-foreground">{[row.employeeCode, row.orgUnit?.name].filter(Boolean).join(' · ') || 'Chưa có đơn vị'}</p></div> },
    { key: 'goalCount', header: 'Tiến độ đánh giá', minWidth: 190, render: row => row.goalCount ? <div className="space-y-2"><Progress label="Có minh chứng" value={row.evidenceCount} total={row.goalCount} /><Progress label="Đã chấm điểm" value={row.scoredCount} total={row.goalCount} /></div> : <span className="text-sm text-muted-foreground">Chưa có mục tiêu</span>, exportValue: row => `${row.evidenceCount}/${row.goalCount} có minh chứng; ${row.scoredCount}/${row.goalCount} đã chấm; trọng số ${row.weight}%` },
    { key: 'score', header: 'Kết quả kỳ', minWidth: 145, sortable: true, sortValue: row => row.score ?? -1, render: row => <div className="space-y-1">{row.score === null ? <p className="text-sm text-muted-foreground">Chưa đủ căn cứ</p> : <><p className="font-medium tabular-nums">{scoreText(row.score)} / 100</p><p className="text-xs text-muted-foreground">{classification(row.score)}</p></>}</div>, exportValue: row => row.score === null ? 'Chưa đủ căn cứ' : `${scoreText(row.score)} / 100 · ${classification(row.score)}` },
    { key: 'stage', header: 'Việc cần xử lý', minWidth: 240, render: row => <div className="space-y-1"><p className="text-sm font-medium">{stages[row.stage]}</p><p className="text-xs leading-5 text-muted-foreground">{nextStep(row)}</p>{row.overdue && <p className="text-xs text-destructive">Đã qua ngày kết thúc kỳ</p>}</div>, exportValue: row => `${stages[row.stage]} · ${nextStep(row)}${row.overdue ? ' · Đã qua ngày kết thúc kỳ' : ''}` },
    { key: 'open', header: 'Thao tác', minWidth: 130, noPrint: true, render: row => <Button size="sm" variant="ghost" disabled={(!row.goalCount && (row.userId === currentUserId || query.data?.cycle.status !== 'ACTIVE'))} onClick={() => onOpenGoals(row.userId, cycleId, row.goalCount > 0)}>{row.goalCount ? 'Mở KPI' : row.userId === currentUserId ? 'Chờ người khác giao' : 'Giao mục tiêu'}<ArrowRight className="h-3.5 w-3.5" /></Button> },
  ];
  return <section className="space-y-5" aria-label="Tổng quan quản lý KPI">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Theo dõi nhân sự trong kỳ</h2><p className="mt-1 text-sm text-muted-foreground">{query.data?.cycle.name ?? 'Đang tải kỳ…'}{query.data && ` · Hạn kỳ ${formatDate(query.data.cycle.endDate)}`} · Chỉ dữ liệu trong quyền quản lý.</p></div><Select aria-label="Phòng ban trong tổng quan KPI" value={effectiveUnit} onChange={event => { setUnit(event.target.value); setStage('ALL'); }} className="w-full sm:w-60"><option value="ALL">Tất cả đơn vị trong phạm vi</option>{units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <button key={card.title} type="button" disabled={query.isLoading} aria-pressed={stage === card.filter} onClick={() => setStage(card.filter)} className={`rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/30 ${stage === card.filter ? 'border-foreground/50' : 'border-border'}`}><p className="text-sm text-muted-foreground">{card.title}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{query.isLoading ? '—' : card.value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{card.hint}</p></button>)}</div>
    <div className="rounded-lg border border-border p-4"><div className="mb-3 flex justify-between gap-3 text-sm"><span className="font-medium">Đã đủ dữ liệu đánh giá</span><span className="tabular-nums">{complete}/{scopedRows.length} người</span></div><div className="h-2 overflow-hidden rounded-sm bg-muted"><div className="h-full bg-foreground/70" style={{ width: `${scopedRows.length ? complete / scopedRows.length * 100 : 0}%` }} /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Cần đủ 100% trọng số, điểm chấm và minh chứng cho mọi KPI. Thiếu dữ liệu không được coi là 0 điểm. Thanh tiến độ thể hiện việc hoàn tất đánh giá, không phải tỷ lệ đạt chỉ tiêu.</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-medium">Danh sách cần theo dõi</h3><Select aria-label="Lọc việc cần xử lý KPI" value={stage} onChange={event => setStage(event.target.value)} className="w-full sm:w-64"><option value="ALL">Tất cả ({scopedRows.length})</option><option value="INCOMPLETE">Chưa đủ đánh giá ({scopedRows.length - complete})</option>{Object.entries(stages).map(([key, label]) => <option key={key} value={key}>{label} ({counts(key as Stage)})</option>)}</Select></div>
    <DataTable printTitle="Báo cáo theo dõi KPI nhân sự" printSubtitle={[query.data?.cycle.name, effectiveUnit === 'ALL' ? 'Tất cả đơn vị trong phạm vi quản lý' : units.find(item => item.id === effectiveUnit)?.name, stage === 'ALL' ? '' : stage === 'INCOMPLETE' ? 'Chưa đủ đánh giá' : stages[stage as Stage]].filter(Boolean).join(' · ')} columns={columns} rows={rows} rowKey={row => row.userId} loading={query.isLoading} searchFields={row => [row.employeeName, row.employeeCode ?? '', row.orgUnit?.name ?? '']} exportFilename="tong-quan-quan-ly-kpi" emptyTitle="Không có nhân sự phù hợp" emptyHint="Thử bỏ bộ lọc hoặc kiểm tra đối tượng tham gia kỳ." />
    <p className="text-xs leading-5 text-muted-foreground">Chọn một ô thống kê để lọc danh sách, rồi Mở KPI để xem minh chứng và xử lý. Với điểm thấp, quản lý cần phản hồi và thống nhất việc cải thiện; hệ thống chưa có luồng kế hoạch cải thiện riêng và không tự thay đổi lương.</p>
  </section>;
}
