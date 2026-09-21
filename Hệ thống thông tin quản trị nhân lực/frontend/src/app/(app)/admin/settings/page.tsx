'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Save, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
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
        title="Cấu hình hệ thống"
        description="Tham số vận hành hệ thống và quản trị phân quyền vai trò người dùng (RBAC)."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Quản lý phân quyền vai trò
            </Link>
            <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
              <Save className="h-4 w-4" /> Lưu thay đổi
            </Button>
          </div>
        }
      />

      {/* Khối Lối tắt nhanh tới Quản lý Phân quyền */}
      <Card className="border-border shadow-2xs mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Quản lý Phân quyền & Ma trận Vai trò (RBAC)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thiết lập quyền hạn cho các vai trò (Quản trị viên, Cán bộ Nhân sự, Nhân viên) và gán phân quyền theo tài khoản người dùng.
              </p>
            </div>
          </div>
          <Link
            href="/admin/roles"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Mở Quản lý Phân quyền
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
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
