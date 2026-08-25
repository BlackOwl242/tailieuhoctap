'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, QrCode, Camera } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDateTime, DAY_STATUS_LABEL } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintExportDropdown, PrintFrame, PrintSignatureBlock } from '@/components/ui/print';
import type { AttendanceDayRow, AttendanceEventRow } from '@/lib/types';

/** KC23–KC26 — Trang chấm công cá nhân: điểm danh nhanh + lịch sử. */
export default function AttendancePage() {
  const qc = useQueryClient();
  const toast = useToast();

  const q = useQuery({
    queryKey: ['attendance-me'],
    queryFn: async () =>
      (await api.get<{ days: AttendanceDayRow[]; todayEvents: AttendanceEventRow[] }>('/attendance/me')).data,
  });

  const checkIn = useMutation({
    mutationFn: async () => api.post('/attendance/check-in', { method: 'WEB' }),
    onSuccess: (res) => {
      const d = res.data as { punch: string };
      toast(d.punch === 'IN' ? 'Đã ghi giờ VÀO ✓' : 'Đã ghi giờ RA ✓', 'success');
      qc.invalidateQueries({ queryKey: ['attendance-me'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const todayEvents = q.data?.todayEvents ?? [];
  const nextPunch = todayEvents.length % 2 === 0 ? 'IN' : 'OUT';

  return (
    <>
      <PageHeader
        title="Chấm công"
        description="Điểm danh đa nguồn: web, mã QR tại kiosk hoặc khuôn mặt."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/kiosk"><Button variant="outline" size="sm"><QrCode className="h-4 w-4" /> Kiosk QR</Button></Link>
            <Link href="/check-in?mode=face"><Button variant="outline" size="sm"><Camera className="h-4 w-4" /> Khuôn mặt</Button></Link>
            <PrintExportDropdown
              printLabel="In bảng công"
              exportLabel="Xuất bảng Excel"
              onExportExcel={() => {
                const cols = ['Ngày', 'Giờ vào', 'Giờ ra', 'Thời gian làm việc (phút)', 'Trạng thái'];
                const rows = (q.data?.days ?? []).map((d) => [
                  new Date(d.workDate).toLocaleDateString('vi-VN'),
                  d.firstInAt ? new Date(d.firstInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
                  d.lastOutAt ? new Date(d.lastOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
                  d.workedMinutes,
                  DAY_STATUS_LABEL[d.status] ?? d.status,
                ]);
                import('@/lib/export').then(({ exportRowsToExcel }) => {
                  exportRowsToExcel('bang-cham-cong-ca-nhan', cols, rows);
                });
              }}
            />
          </div>
        }
      />

      {/* Thẻ điểm danh nhanh (web) */}
      <Card className="mb-4">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">Lần chấm kế tiếp của bạn hôm nay</p>
          <Button size="lg" variant={nextPunch === 'IN' ? 'default' : 'secondary'}
            disabled={checkIn.isPending || q.isLoading}
            onClick={() => checkIn.mutate()}>
            {nextPunch === 'IN' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
            {nextPunch === 'IN' ? 'Chấm công VÀO' : 'Chấm công RA'}
          </Button>
          {todayEvents.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Đã có {todayEvents.length} lần chấm · Lần cuối {formatDateTime(todayEvents[todayEvents.length - 1].occurredAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Bảng công 14 ngày */}
      <div className="print-area">
        <PrintFrame title="BẢNG CHẤM CÔNG CÁ NHÂN" subtitle="Ghi nhận từ hệ thống máy chấm công, mã QR Kiosk & sinh trắc học khuôn mặt" />
        <Card className="no-print">
          <CardHeader><CardTitle>Bảng công gần đây</CardTitle></CardHeader>
          <CardContent>
            {q.isLoading ? (
              <Skeleton className="h-40" />
            ) : q.isError ? (
              <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
            ) : (q.data!.days.length === 0) ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu công. Hãy chạy bộ mô phỏng ở trang Quản trị → Thiết bị chấm công.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Ngày</th><th className="py-2 pr-3">Vào</th>
                      <th className="py-2 pr-3">Ra</th><th className="py-2 pr-3">Làm việc</th>
                      <th className="py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data!.days.map((d) => (
                      <tr key={d.workDate} className="border-b last:border-0">
                        <td className="py-2 pr-3">{new Date(d.workDate).toLocaleDateString('vi-VN')}</td>
                        <td className="py-2 pr-3">{d.firstInAt ? new Date(d.firstInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="py-2 pr-3">{d.lastOutAt ? new Date(d.lastOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="py-2 pr-3">{d.workedMinutes > 0 ? `${Math.floor(d.workedMinutes / 60)}h${d.workedMinutes % 60}'` : '—'}</td>
                        <td className="py-2">
                          <Badge className={cn(
                            d.status === 'PRESENT' && 'bg-emerald-100 text-emerald-800',
                            d.status === 'LATE' && 'bg-amber-100 text-amber-800',
                            d.status === 'MISSING_PAIR' && 'bg-red-100 text-red-800',
                            !['PRESENT', 'LATE', 'MISSING_PAIR'].includes(d.status) && 'bg-secondary',
                          )}>
                            {DAY_STATUS_LABEL[d.status] ?? d.status}
                            {d.lateMinutes > 0 ? ` +${d.lateMinutes}'` : ''}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Khung in tài liệu sạch */}
        {q.data?.days && q.data.days.length > 0 ? (
          <div className="print-only">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Ngày làm việc</th>
                  <th>Giờ vào</th>
                  <th>Giờ ra</th>
                  <th>Thời gian làm việc</th>
                  <th>Trạng thái chấm công</th>
                </tr>
              </thead>
              <tbody>
                {q.data.days.map((d) => (
                  <tr key={d.workDate}>
                    <td>{new Date(d.workDate).toLocaleDateString('vi-VN')}</td>
                    <td>{d.firstInAt ? new Date(d.firstInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{d.lastOutAt ? new Date(d.lastOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{d.workedMinutes > 0 ? `${Math.floor(d.workedMinutes / 60)} giờ ${d.workedMinutes % 60} phút` : '0 phút'}</td>
                    <td>{DAY_STATUS_LABEL[d.status] ?? d.status}{d.lateMinutes > 0 ? ` (Đi muộn ${d.lateMinutes}p)` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PrintSignatureBlock leftTitle="Người chấm công" middleTitle="Trưởng bộ phận" rightTitle="Trưởng phòng HC-NS" />
          </div>
        ) : null}
      </div>
    </>
  );
}
