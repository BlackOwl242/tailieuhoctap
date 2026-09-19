'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Input, Label, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState } from '@/components/common/states';

// Các khóa cấu hình cho phép chỉnh sửa trên UI
const EDITABLE = [
  { key: 'WORK_START', label: 'Giờ bắt đầu ca chuẩn' },
  { key: 'WORK_END', label: 'Giờ kết thúc ca chuẩn' },
  { key: 'FACE_THRESHOLD', label: 'Ngưỡng khớp khuôn mặt' },
  { key: 'REVIEW_DUE_DAYS', label: 'Hạn xử lý duyệt bài (ngày)' },
];

/** KC04 — Cấu hình tham số runtime kiểu THAMSO (không cài cứng mã nguồn). */
export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Record<string, unknown>>('/settings/effective')).data,
  });

  // Nạp giá trị hiện hành vào form khi dữ liệu về
  useEffect(() => {
    if (q.data) {
      const next: Record<string, string> = {};
      for (const { key } of EDITABLE) next[key] = String(q.data[key] ?? '');
      setValues(next);
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        payload[k] = /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v; // số hóa khi có thể
      }
      return api.patch('/admin/settings', { values: payload });
    },
    onSuccess: () => {
      toast('Đã lưu cấu hình', 'success');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;

  return (
    <>
      <PageHeader
        title="Cấu hình"
        description="Tham số vận hành hệ thống — thay đổi không cần triển khai lại mã nguồn."
        actions={
          <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
            <Save className="h-4 w-4" /> Lưu thay đổi
          </Button>
        }
      />
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          {EDITABLE.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`set-${key}`}>{label}</Label>
              <Input id={`set-${key}`} value={values[key] ?? ''}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
              <p className="text-xs text-muted-foreground">Khóa: {key}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
