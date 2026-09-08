'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, LogOut, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { MeProfile } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Avatar, AvatarFallback, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState } from '@/components/common/states';

interface FaceStatus {
  consentAt: string | null;
  samples: Array<{ id: string; dimensions: number; createdAt: string }>;
}

/** Hồ sơ cá nhân + quản lý dữ liệu sinh trắc học (đồng thuận/xóa mẫu). */
export default function ProfilePage() {
  const qc = useQueryClient();
  const toast = useToast();

  const faceQ = useQuery({
    queryKey: ['face-status'],
    queryFn: async () => (await api.get<FaceStatus>('/attendance/face/enrollments')).data,
  });

  const del = useMutation({
    mutationFn: async () => api.delete('/attendance/face/enrollments'),
    onSuccess: () => {
      toast('Đã xóa toàn bộ mẫu khuôn mặt', 'success');
      qc.invalidateQueries({ queryKey: ['face-status'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Hồ sơ mới nhất lấy trực tiếp từ /auth/me
  const meQ = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<MeProfile>('/auth/me')).data,
  });

  /** Mục 3 — đăng xuất khỏi MỌI thiết bị: thu hồi toàn bộ refresh token phía server. */
  const logoutAll = useMutation({
    mutationFn: async () => api.post<{ revoked: number }>('/auth/logout-all'),
    onSuccess: (res) => {
      toast(`Đã thu hồi ${res.data.revoked} phiên đăng nhập trên mọi thiết bị`, 'success');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  if (meQ.isLoading || !meQ.data) return <Skeleton className="h-64" />;
  const me = meQ.data;

  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{me.fullName?.split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join('')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-lg font-bold">{me.fullName}</p>
              <p className="text-sm text-muted-foreground">{me.jobTitle}{me.orgUnit ? ` · ${me.orgUnit.name}` : ''}</p>
              <p className="mt-1 text-sm">{me.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{me.roles.join(', ')}</span>
                {(me.expertise ?? []).length > 0 && (
                  <>
                    <span>·</span>
                    <span>{(me.expertise ?? []).join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dữ liệu sinh trắc học — quyền riêng tư là ưu tiên */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-4 w-4" /> Khuôn mặt & quyền riêng tư</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {faceQ.isLoading ? (
              <Skeleton className="h-16" />
            ) : faceQ.isError ? (
              <ErrorState message={errorMessage(faceQ.error)} />
            ) : (
              <>
                <p className="text-sm flex items-center gap-2">
                  Đồng thuận:{' '}
                  {faceQ.data!.consentAt ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Đã đồng ý lúc {formatDate(faceQ.data!.consentAt)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Chưa đồng ý
                    </span>
                  )}
                </p>
                <p className="text-sm">Mẫu đã đăng ký: <strong>{faceQ.data!.samples.length}</strong> (vector mã hóa AES-256-GCM)</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/check-in?mode=face"><Button size="sm" variant="outline">Đăng ký / Điểm danh</Button></Link>
                  {faceQ.data!.samples.length > 0 ? (
                    <Button size="sm" variant="destructive" onClick={() => del.mutate()}>
                      <Trash2 className="h-4 w-4" /> Xóa tất cả mẫu
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mẫu khuôn mặt sẽ tự động bị xóa khi checklist chuyển giao của bạn được hoàn tất.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Phiên đăng nhập & bảo mật (Mục 3) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LogOut className="h-4 w-4" /> Phiên đăng nhập & bảo mật</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted-foreground">
              Đăng xuất khỏi mọi thiết bị sẽ thu hồi toàn bộ phiên đăng nhập của bạn.
              Các thiết bị khác sẽ phải đăng nhập lại ở lần truy cập kế tiếp.
            </p>
            <Button variant="outline" disabled={logoutAll.isPending} onClick={() => logoutAll.mutate()}>
              <LogOut className="h-4 w-4" /> Đăng xuất khỏi mọi thiết bị
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

