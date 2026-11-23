'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock4,
  FileWarning,
  Info,
  Printer,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/hr';
import { formatDate, formatDateTime } from '@/lib/utils';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState, LoadingBlock } from '@/components/common/states';
import { NumberCard } from '@/components/common/number-card';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from '@/components/ui/primitives';
import { PrintFrame } from '@/components/ui/print';

interface DssAnalyticsResponse {
  generatedAt: string;
  horizonMonths: number;
  orgSector: 'enterprise' | 'state';
  workforce: {
    totalActive: number;
    probationCount: number;
    resignedCount: number;
    retiredCount: number;
    avgTenureMonths: number;
    exitsInWindow: number;
    turnoverRatePct: number;
    byOrgUnit: Array<{ orgUnitId: string; orgUnitName: string; activeCount: number; probationCount: number }>;
    monthlyMovement: Array<{ month: string; hires: number; exits: number }>;
  };
  payroll: {
    monthlyTrend: Array<{
      id: string;
      periodName: string;
      month: string;
      status: string;
      totalEmployees: number;
      totalGrossPay: number;
      totalDeduction: number;
      totalNetPay: number;
      employerTotalCost: number;
    }>;
    byDepartment: Array<{ department: string; employees: number; totalGrossPay: number; totalNetPay: number }>;
    salaryBandCompliance: { inRange: number; belowRange: number; aboveRange: number; unmapped: number };
  };
  performance: {
    cycleId: string | null;
    cycleName: string | null;
    status: string | null;
    totalParticipants: number;
    completedCount: number;
    averageScore: number | null;
    distribution: {
      EXCELLENT: number;
      GOOD: number;
      SATISFACTORY: number;
      UNSATISFACTORY: number;
      INCOMPLETE: number;
    };
  };
  recruitment: {
    openingsCount: number;
    totalVacancies: number;
    totalApplicants: number;
    byStage: Record<string, number>;
    offersSent: number;
    offersAccepted: number;
    offerAcceptanceRatePct: number | null;
    avgTimeToHireDays: number | null;
  };
  alerts: {
    expiringContracts: Array<{
      userId: string;
      fullName: string;
      employeeCode: string | null;
      contractNo: string;
      endDate: string;
      daysLeft: number;
    }>;
    probationDue: Array<{
      userId: string;
      fullName: string;
      employeeCode: string | null;
      hireDate: string;
      daysInProbation: number;
    }>;
    highOvertime: Array<{
      userId: string;
      fullName: string;
      employeeCode: string | null;
      monthHours: number;
      yearHours: number;
    }>;
    outOfBandSalaries: Array<{
      userId: string;
      fullName: string;
      employeeCode: string | null;
      salary: number;
      bandCode: string;
      minSalary: number;
      maxSalary: number;
      status: 'BELOW_RANGE' | 'ABOVE_RANGE';
    }>;
    lowKpiPerformers: Array<{
      userId: string;
      fullName: string;
      employeeCode: string | null;
      score: number;
      orgUnitName: string | null;
    }>;
  };
  recommendations: Array<{
    severity: 'HIGH' | 'MEDIUM' | 'INFO';
    category: string;
    title: string;
    detail: string;
    actionHref: string;
    actionLabel: string;
  }>;
}

interface OrgUnitOption {
  id: string;
  name: string;
  code: string;
}

type AlertTab = 'contracts' | 'probation' | 'overtime' | 'bands' | 'kpi';

const RECRUITMENT_STAGE_LABELS: Array<{ key: string; label: string }> = [
  { key: 'APPLIED', label: 'Ứng tuyển' },
  { key: 'SCREENING', label: 'Sàng lọc' },
  { key: 'INTERVIEW_ROUND_1', label: 'Phỏng vấn V1' },
  { key: 'INTERVIEW_ROUND_2', label: 'Phỏng vấn V2' },
  { key: 'OFFER_SENT', label: 'Đã gửi Offer' },
  { key: 'HIRED', label: 'Đã nhận việc' },
  { key: 'REJECTED', label: 'Không phù hợp' },
];

function compactMoney(value: number): string {
  if (!value) return '0 đ';
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} tỷ`;
  }
  return `${(value / 1_000_000).toFixed(1)} tr`;
}

export default function AnalyticsDssPage() {
  const [orgUnitId, setOrgUnitId] = useState('');
  const [months, setMonths] = useState('6');
  const [alertTab, setAlertTab] = useState<AlertTab>('contracts');

  const orgUnitsQ = useQuery({
    queryKey: ['analytics-org-units'],
    queryFn: async () => (await api.get<OrgUnitOption[]>('/org-units')).data,
  });

  const analyticsQ = useQuery({
    queryKey: ['dashboard-analytics', orgUnitId, months],
    queryFn: async () =>
      (
        await api.get<DssAnalyticsResponse>('/dashboard/analytics', {
          params: { ...(orgUnitId ? { orgUnitId } : {}), months },
        })
      ).data,
  });

  const data = analyticsQ.data;

  const totalAlerts = useMemo(() => {
    if (!data) return 0;
    const a = data.alerts;
    return (
      a.expiringContracts.length +
      a.probationDue.length +
      a.highOvertime.length +
      a.outOfBandSalaries.length +
      a.lowKpiPerformers.length
    );
  }, [data]);

  const latestPayroll = data?.payroll.monthlyTrend[data.payroll.monthlyTrend.length - 1];
  const maxMovement = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.workforce.monthlyMovement.flatMap((m) => [m.hires, m.exits]));
  }, [data]);
  const maxPayroll = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.payroll.monthlyTrend.flatMap((r) => [r.employerTotalCost, r.totalNetPay]));
  }, [data]);
  const maxDeptPayroll = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.payroll.byDepartment.map((d) => d.totalGrossPay));
  }, [data]);

  if (analyticsQ.isLoading) return <LoadingBlock label="Đang tổng hợp dữ liệu phân tích DSS từ PostgreSQL…" />;
  if (analyticsQ.isError) return <ErrorState message={errorMessage(analyticsQ.error)} onRetry={() => analyticsQ.refetch()} />;
  if (!data) return null;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Phân tích & Hỗ trợ ra quyết định (DSS)"
        description="Phân tích tổng hợp theo thời gian thực từ dữ liệu PostgreSQL: biến động nhân sự, quỹ lương, KPI, phễu tuyển dụng và cảnh báo rủi ro vận hành."
        breadcrumbs={[{ label: 'Báo cáo & Tri thức' }, { label: 'Phân tích & Ra quyết định (DSS)' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Select
              aria-label="Lọc đơn vị"
              value={orgUnitId}
              onChange={(e) => setOrgUnitId(e.target.value)}
              className="w-48 text-xs"
            >
              <option value="">Toàn bộ đơn vị</option>
              {(orgUnitsQ.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} — {u.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Chu kỳ quan sát"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-32 text-xs"
            >
              <option value="3">3 tháng gần nhất</option>
              <option value="6">6 tháng gần nhất</option>
              <option value="12">12 tháng gần nhất</option>
            </Select>
            <Button size="sm" variant="outline" onClick={() => analyticsQ.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> In báo cáo
            </Button>
          </div>
        }
      />

      <div className="print-area space-y-6">
        <PrintFrame
          title="BÁO CÁO PHÂN TÍCH & HỖ TRỢ RA QUYẾT ĐỊNH NHÂN LỰC (DSS)"
          subtitle={`Cập nhật lúc ${formatDateTime(data.generatedAt)} · Khung quan sát ${data.horizonMonths} tháng`}
        />

        {/* 4 KPI Tổng hợp điều hành */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <NumberCard
            title="Nhân sự hoạt động & Turnover"
            value={`${data.workforce.totalActive} người`}
            subtitle={`Thâm niên TB ${data.workforce.avgTenureMonths} tháng · ${data.workforce.probationCount} thử việc · ${data.workforce.exitsInWindow} nghỉ (${data.horizonMonths}T)`}
            icon={Users}
            trend={{
              value: `${data.workforce.turnoverRatePct}% turnover`,
              isPositive: data.workforce.turnoverRatePct < 10,
            }}
          />
          <NumberCard
            title="Quỹ lương & Chi phí NSDLĐ"
            value={latestPayroll ? compactMoney(latestPayroll.totalNetPay) : 'Chưa có kỳ lương'}
            subtitle={
              latestPayroll
                ? `${latestPayroll.periodName} · Tổng chi NSDLĐ ${compactMoney(latestPayroll.employerTotalCost)}`
                : 'Chưa có kỳ lương hợp lệ'
            }
            icon={Wallet}
          />
          <NumberCard
            title="Điểm KPI kỳ gần nhất"
            value={data.performance.averageScore !== null ? `${data.performance.averageScore} / 100` : 'Chưa có điểm'}
            subtitle={
              data.performance.cycleName
                ? `${data.performance.cycleName} · ${data.performance.completedCount}/${data.performance.totalParticipants} hoàn tất`
                : 'Chưa có chu kỳ đánh giá'
            }
            icon={Target}
          />
          <NumberCard
            title="Cảnh báo sớm & Tuyển dụng"
            value={`${totalAlerts} cảnh báo`}
            subtitle={`Tuyển dụng: ${data.recruitment.openingsCount} tin mở · ${
              data.recruitment.offerAcceptanceRatePct !== null ? `${data.recruitment.offerAcceptanceRatePct}% nhận Offer` : 'chưa có Offer'
            }${data.recruitment.avgTimeToHireDays !== null ? ` · TB ${data.recruitment.avgTimeToHireDays} ngày` : ''}`}
            icon={ShieldAlert}
            trend={{
              value: totalAlerts > 0 ? `${totalAlerts} mục cần xử lý` : 'Ổn định',
              isPositive: totalAlerts === 0,
            }}
          />
        </div>

        {/* Khuyến nghị điều hành dựa trên quy tắc */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Khuyến nghị điều hành theo ngưỡng thực tế
            </CardTitle>
            <CardDescription>
              Sinh tự động từ dữ liệu vi phạm ngưỡng luật lao động, khung lương, KPI và biến động nhân sự trong CSDL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.recommendations.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Chưa phát hiện rủi ro vượt ngưỡng (OT, hợp đồng sắp hết hạn, thử việc trễ hạn, lương ngoài khung, KPI yếu).</span>
              </div>
            ) : (
              data.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 text-xs ${
                    rec.severity === 'HIGH'
                      ? 'border-destructive/40 bg-destructive/5'
                      : rec.severity === 'MEDIUM'
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {rec.severity === 'HIGH' ? (
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : rec.severity === 'MEDIUM' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{rec.title}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className={rec.severity === 'HIGH' ? 'text-destructive' : 'text-muted-foreground'}>
                          <Badge variant={rec.severity === 'HIGH' ? 'destructive' : 'secondary'} style={{ fontWeight: 500 }}>
                            {rec.category}
                          </Badge>
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{rec.detail}</p>
                    </div>
                  </div>
                  <Link
                    href={rec.actionHref}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    {rec.actionLabel} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Trung tâm Cảnh báo sớm */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="h-4 w-4 text-primary" />
              Trung tâm Cảnh báo sớm chi tiết
            </CardTitle>
            <div className="flex flex-wrap gap-1.5 pt-2 no-print">
              {[
                { key: 'contracts', label: `HĐ sắp hết hạn (${data.alerts.expiringContracts.length})` },
                { key: 'probation', label: `Thử việc quá 45 ngày (${data.alerts.probationDue.length})` },
                { key: 'overtime', label: `OT tiệm cận trần (${data.alerts.highOvertime.length})` },
                { key: 'bands', label: `Lương ngoài khung (${data.alerts.outOfBandSalaries.length})` },
                { key: 'kpi', label: `KPI < 50 điểm (${data.alerts.lowKpiPerformers.length})` },
              ].map((t) => (
                <Button
                  key={t.key}
                  size="sm"
                  variant={alertTab === t.key ? 'default' : 'outline'}
                  onClick={() => setAlertTab(t.key as AlertTab)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {alertTab === 'contracts' && (
              data.alerts.expiringContracts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Không có hợp đồng nào hết hạn trong 60 ngày tới.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nhân sự</th>
                      <th className="py-2 pr-3">Số hợp đồng</th>
                      <th className="py-2 pr-3">Ngày hết hạn</th>
                      <th className="py-2 text-right">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alerts.expiringContracts.map((c) => (
                      <tr key={c.contractNo} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">
                          <Link href={`/employees/${c.userId}`} className="hover:underline">
                            {c.fullName}
                          </Link>{' '}
                          <span className="text-muted-foreground">({c.employeeCode ?? '—'})</span>
                        </td>
                        <td className="py-2 pr-3 font-mono">{c.contractNo}</td>
                        <td className="py-2 pr-3">{formatDate(c.endDate)}</td>
                        <td className="py-2 text-right font-semibold text-amber-600">{c.daysLeft} ngày</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {alertTab === 'probation' && (
              data.alerts.probationDue.length === 0 ? (
                <p className="text-xs text-muted-foreground">Không có nhân sự thử việc nào quá 45 ngày chưa duyệt đánh giá.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nhân sự</th>
                      <th className="py-2 pr-3">Ngày nhận việc</th>
                      <th className="py-2 text-right">Số ngày thử việc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alerts.probationDue.map((p) => (
                      <tr key={p.userId} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">
                          <Link href={`/employees/${p.userId}`} className="hover:underline">
                            {p.fullName}
                          </Link>{' '}
                          <span className="text-muted-foreground">({p.employeeCode ?? '—'})</span>
                        </td>
                        <td className="py-2 pr-3">{formatDate(p.hireDate)}</td>
                        <td className="py-2 text-right font-semibold text-amber-600">{p.daysInProbation} ngày</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {alertTab === 'overtime' && (
              data.alerts.highOvertime.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có nhân sự nào vượt 80% trần OT tháng (32h) hoặc năm (160h).</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nhân sự</th>
                      <th className="py-2 pr-3 text-right">Giờ OT tháng này (trần 40h)</th>
                      <th className="py-2 text-right">Giờ OT năm nay (trần 200h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alerts.highOvertime.map((ot) => (
                      <tr key={ot.userId} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">
                          {ot.fullName} <span className="text-muted-foreground">({ot.employeeCode ?? '—'})</span>
                        </td>
                        <td className="py-2 pr-3 text-right font-mono font-semibold text-destructive">{ot.monthHours}h</td>
                        <td className="py-2 text-right font-mono font-semibold">{ot.yearHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {alertTab === 'bands' && (
              data.alerts.outOfBandSalaries.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Tất cả nhân sự đã gắn khung lương đều nằm trong dải lương đã duyệt ({data.payroll.salaryBandCompliance.inRange} đạt chuẩn).
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nhân sự</th>
                      <th className="py-2 pr-3">Khung lương</th>
                      <th className="py-2 pr-3 text-right">Mức hiện tại</th>
                      <th className="py-2 pr-3 text-right">Dải chuẩn (Min – Max)</th>
                      <th className="py-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alerts.outOfBandSalaries.map((b) => (
                      <tr key={b.userId} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">
                          <Link href={`/employees/${b.userId}`} className="hover:underline">
                            {b.fullName}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 font-mono">{b.bandCode}</td>
                        <td className="py-2 pr-3 text-right font-mono">{formatCurrency(b.salary)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-muted-foreground">
                          {compactMoney(b.minSalary)} – {compactMoney(b.maxSalary)}
                        </td>
                        <td className="py-2 text-right">
                          <span className={b.status === 'BELOW_RANGE' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}>
                            <Badge variant={b.status === 'BELOW_RANGE' ? 'destructive' : 'secondary'} style={{ fontWeight: 500 }}>
                              {b.status === 'BELOW_RANGE' ? 'Dưới min' : 'Vượt max'}
                            </Badge>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {alertTab === 'kpi' && (
              data.alerts.lowKpiPerformers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Không có nhân sự nào có điểm KPI hoàn tất dưới 50/100 trong kỳ gần nhất.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nhân sự</th>
                      <th className="py-2 pr-3">Đơn vị</th>
                      <th className="py-2 text-right">Điểm KPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alerts.lowKpiPerformers.map((k) => (
                      <tr key={k.userId} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">
                          {k.fullName} <span className="text-muted-foreground">({k.employeeCode ?? '—'})</span>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{k.orgUnitName ?? '—'}</td>
                        <td className="py-2 text-right font-mono font-semibold text-destructive">{k.score} / 100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </CardContent>
        </Card>

        {/* Hàng biểu đồ 1: Quỹ lương & Phòng ban */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                Xu hướng Quỹ lương &amp; Tổng chi phí NSDLĐ theo kỳ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.payroll.monthlyTrend.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có kỳ lương hợp lệ trong khoảng thời gian đã chọn.</p>
              ) : (
                data.payroll.monthlyTrend.map((run) => (
                  <div key={run.id} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {run.periodName} ({run.totalEmployees} NV · {run.status})
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Thực lĩnh {compactMoney(run.totalNetPay)} · Tổng chi {compactMoney(run.employerTotalCost)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full overflow-hidden rounded bg-muted">
                        <div
                          className="h-full bg-primary/80"
                          style={{ width: `${Math.min(100, (run.employerTotalCost / maxPayroll) * 100)}%` }}
                        />
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                        <div
                          className="h-full bg-emerald-600/80"
                          style={{ width: `${Math.min(100, (run.totalNetPay / maxPayroll) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs bg-primary/80" /> Tổng chi phí NSDLĐ
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs bg-emerald-600/80" /> Thực lĩnh chi trả NLĐ
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Wallet className="h-4 w-4 text-primary" />
                Phân bổ Quỹ lương kỳ gần nhất theo Đơn vị &amp; Tuân thủ Khung lương
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded border border-border p-2">
                  <p className="text-muted-foreground">Trong khung</p>
                  <p className="mt-1 text-base font-bold text-emerald-600">{data.payroll.salaryBandCompliance.inRange}</p>
                </div>
                <div className="rounded border border-border p-2">
                  <p className="text-muted-foreground">Dưới min</p>
                  <p className="mt-1 text-base font-bold text-destructive">{data.payroll.salaryBandCompliance.belowRange}</p>
                </div>
                <div className="rounded border border-border p-2">
                  <p className="text-muted-foreground">Vượt max</p>
                  <p className="mt-1 text-base font-bold text-amber-600">{data.payroll.salaryBandCompliance.aboveRange}</p>
                </div>
                <div className="rounded border border-border p-2">
                  <p className="text-muted-foreground">Chưa gắn khung</p>
                  <p className="mt-1 text-base font-bold">{data.payroll.salaryBandCompliance.unmapped}</p>
                </div>
              </div>

              <div className="space-y-2">
                {data.payroll.byDepartment.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có dữ liệu chi tiết theo đơn vị.</p>
                ) : (
                  data.payroll.byDepartment.slice(0, 7).map((dept) => (
                    <div key={dept.department} className="space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-medium">
                          {dept.department} ({dept.employees} NV)
                        </span>
                        <span className="font-mono">{compactMoney(dept.totalGrossPay)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full bg-foreground/75"
                          style={{ width: `${Math.min(100, (dept.totalGrossPay / maxDeptPayroll) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hàng biểu đồ 2: Biến động nhân sự + KPI & Tuyển dụng */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Clock4 className="h-4 w-4 text-primary" />
                Biến động Nhân sự (Tuyển mới vs Nghỉ việc)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.workforce.monthlyMovement.map((m) => (
                <div key={m.month} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-mono font-medium">{m.month}</span>
                    <span className="text-muted-foreground">
                      Tuyển mới: <strong className="text-emerald-600">{m.hires}</strong> · Nghỉ việc:{' '}
                      <strong className="text-destructive">{m.exits}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-2 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-emerald-600/80"
                        style={{ width: `${Math.min(100, (m.hires / maxMovement) * 100)}%` }}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-destructive/80"
                        style={{ width: `${Math.min(100, (m.exits / maxMovement) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-primary" />
                Phân bổ Kết quả KPI &amp; Phễu Tuyển dụng ATS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Phân bổ KPI ({data.performance.cycleName ?? 'Chưa có chu kỳ'})
                </p>
                {[
                  { label: 'Xuất sắc', count: data.performance.distribution.EXCELLENT, color: 'bg-emerald-600' },
                  { label: 'Tốt', count: data.performance.distribution.GOOD, color: 'bg-primary' },
                  { label: 'Hoàn thành', count: data.performance.distribution.SATISFACTORY, color: 'bg-amber-500' },
                  { label: 'Không đạt', count: data.performance.distribution.UNSATISFACTORY, color: 'bg-destructive' },
                  { label: 'Chưa hoàn tất', count: data.performance.distribution.INCOMPLETE, color: 'bg-muted-foreground/50' },
                ].map((item) => {
                  const pct = data.performance.totalParticipants > 0
                    ? Math.round((item.count / data.performance.totalParticipants) * 100)
                    : 0;
                  return (
                    <div key={item.label} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>{item.label}</span>
                        <span className="font-mono">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-muted">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-semibold text-foreground">
                  Phễu Ứng viên ATS ({data.recruitment.totalApplicants} hồ sơ · {data.recruitment.totalVacancies} chỉ tiêu đang mở)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                  {RECRUITMENT_STAGE_LABELS.map((s) => (
                    <div key={s.key} className="rounded border border-border bg-muted/20 p-2">
                      <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
                      <p className="mt-0.5 text-sm font-bold font-mono">{data.recruitment.byStage[s.key] ?? 0}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
