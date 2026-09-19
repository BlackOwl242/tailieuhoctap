'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Plus, RefreshCw } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, DAY_STATUS_LABEL } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState } from '@/components/common/states';

interface DeviceRow { id: string; name: string; type: string; location: string | null; status: string; lastSeenAt: string | null }
interface DayRow {
  userId: string; workDate: string; firstInAt: string | null; lastOutAt: string | null;
  lateMinutes: number; status: string;
  user: { id: string; fullName: string; email: string };
}

/** KC25–KC26 — Quản trị chấm công: thiết bị, mô phỏng, bảng công & hiệu chỉnh. */
export default function AdminAttendancePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deviceForm, setDeviceForm] = useState({ name: '', type: 'MACHINE_WEBHOOK' });
  const [lastSecret, setLastSecret] = useState<string | null>(null);
  const [correction, setCorrection] = useState<{ userId: string; date: string } | null>(null);
  const [corrValue, setCorrValue] = useState({ field: 'firstInAt', newValue: '08:00', reason: '' });

  const devicesQ = useQuery({
    queryKey: ['devices'],
    queryFn: async () => (await api.get<DeviceRow[]>('/attendance/devices')).data,
  });
  const daysQ = useQuery({
    queryKey: ['company-days', date],
    queryFn: async () =>
      (await api.get<{ items: DayRow[] }>('/attendance/days', { params: { date } })).data,
  });

  const createDevice = useMutation({
    mutationFn: async () => (await api.post('/attendance/devices', deviceForm)).data as { secret: string },
    onSuccess: (d) => {
      toast('Đã tạo thiết bị — khóa HMAC hiển thị một lần bên dưới', 'success');
      setLastSecret(d.secret);
      setDeviceForm({ name: '', type: 'MACHINE_WEBHOOK' });
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const simulate = useMutation({
    mutationFn: async () => api.post('/attendance/simulator/run', { days: 14 }),
    onSuccess: () => {
      toast('Đã sinh dữ liệu mô phỏng 14 ngày', 'success');
      qc.invalidateQueries();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const correct = useMutation({
    mutationFn: async () =>
      api.post(`/attendance/days/${correction!.userId}/${correction!.date}/correction`, corrValue),
    onSuccess: () => {
      toast('Đã hiệu chỉnh và ghi vết', 'success');
      setCorrection(null);
      qc.invalidateQueries({ queryKey: ['company-days'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  return (
    <>
      <PageHeader
        title="Máy chấm công"
        description="Kết nối máy chấm công qua webhook/CSV hoặc chạy bộ mô phỏng để có dữ liệu demo."
        actions={
          <Button size="sm" variant="outline" disabled={simulate.isPending} onClick={() => simulate.mutate()}>
            <Play className="h-4 w-4" /> Chạy mô phỏng 14 ngày
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Thiết bị */}
        <Card>
          <CardHeader><CardTitle>Thiết bị</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {devicesQ.isLoading ? <Skeleton className="h-24" /> : null}
            {(devicesQ.data ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{d.name}</span>
                  <span className="block text-xs text-muted-foreground">{d.type}{d.location ? ` · ${d.location}` : ''}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {d.status}
                </span>
              </div>
            ))}

            <div className="grid gap-2 border-t pt-3 sm:grid-cols-[1fr_170px_auto] sm:items-end">
              <div className="space-y-1"><Label>Tên thiết bị</Label>
                <Input value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Loại</Label>
                <Select value={deviceForm.type} onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}>
                  <option value="MACHINE_WEBHOOK">Máy (webhook)</option>
                  <option value="SIMULATOR">Mô phỏng</option>
                </Select></div>
              <Button disabled={!deviceForm.name || createDevice.isPending} onClick={() => createDevice.mutate()}>
                <Plus className="h-4 w-4" /> Thêm
              </Button>
            </div>

            {lastSecret ? (
              <p className="break-all rounded-md bg-muted p-2 text-xs">
                Khóa HMAC (chỉ hiện lần này): <code>{lastSecret}</code>
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Webhook endpoint: <code>{'POST /api/v1/attendance/devices/{deviceId}/events'}</code> với header <code>x-device-signature</code>.
            </p>
          </CardContent>
        </Card>

        {/* Bảng công toàn công ty theo ngày + hiệu chỉnh */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Bảng công theo ngày</CardTitle>
            <Input type="date" className="w-40" value={date} onChange={(e) => setDate(e.target.value)} />
          </CardHeader>
          <CardContent>
            {daysQ.isLoading ? <Skeleton className="h-48" /> : null}
            {daysQ.isError ? <ErrorState message={errorMessage(daysQ.error)} onRetry={() => daysQ.refetch()} /> : null}
            {daysQ.data && daysQ.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu cho ngày này.</p>
            ) : null}
            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {(daysQ.data?.items ?? []).map((d) => (
                <div key={d.userId} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{d.user.fullName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(d.workDate)} · {DAY_STATUS_LABEL[d.status] ?? d.status}
                      {d.lateMinutes > 0 ? ` (+${d.lateMinutes}')` : ''}
                    </span>
                  </span>
                  <Button size="sm" variant="ghost"
                    onClick={() => setCorrection({ userId: d.userId, date: d.workDate.slice(0, 10) })}>
                    <RefreshCw className="h-3.5 w-3.5" /> Hiệu chỉnh
                  </Button>
                </div>
              ))}
            </div>

            {/* Form hiệu chỉnh có lý do — mọi thay đổi để lại vết */}
            {correction ? (
              <div className="mt-3 space-y-2 rounded-md border bg-muted/40 p-3">
                <p className="text-sm font-medium">Hiệu chỉnh công ngày {formatDate(correction.date)}</p>
                <Select value={corrValue.field} onChange={(e) => setCorrValue({ ...corrValue, field: e.target.value })}>
                  <option value="firstInAt">Giờ vào</option>
                  <option value="lastOutAt">Giờ ra</option>
                  <option value="status">Trạng thái</option>
                </Select>
                <Input placeholder={corrValue.field === 'status' ? 'PRESENT / LATE / MISSING_PAIR' : 'HH:MM'}
                  value={corrValue.newValue}
                  onChange={(e) => setCorrValue({ ...corrValue, newValue: e.target.value })} />
                <Input placeholder="Lý do hiệu chỉnh (bắt buộc)"
                  value={corrValue.reason}
                  onChange={(e) => setCorrValue({ ...corrValue, reason: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={!corrValue.reason.trim() || correct.isPending} onClick={() => correct.mutate()}>
                    Áp dụng
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCorrection(null)}>Hủy</Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
