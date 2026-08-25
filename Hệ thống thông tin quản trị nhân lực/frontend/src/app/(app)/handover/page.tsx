'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { Card, CardContent, Badge, Button, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import type { HandoverView } from '@/lib/types';

/**
 * KC20 — Chuyển giao tri thức khi nghỉ việc (mirror UC17):
 * đủ TẤT CẢ mục DONE mới được đóng checklist.
 */
export default function HandoverPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const meId = useAuthStore((s) => s.user?.id);
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isKm = roles.includes('KM_MANAGER') || roles.includes('ADMIN');

  const q = useQuery({
    queryKey: ['handovers'],
    queryFn: async () => (await api.get<HandoverView[]>('/handovers')).data,
  });

  const toggle = useMutation({
    mutationFn: async (vars: { id: string; itemId: string; done: boolean }) =>
      api.post(`/handovers/${vars.id}/items/${vars.itemId}/done`, { done: vars.done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['handovers'] }),
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const close = useMutation({
    mutationFn: async (id: string) => api.post(`/handovers/${id}/close`),
    onSuccess: () => {
      toast('Đã đóng checklist chuyển giao', 'success');
      qc.invalidateQueries({ queryKey: ['handovers'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  return (
    <>
      <PageHeader title="Bàn giao công việc" description="Checklist bắt buộc trước ngày nghỉ việc — thiếu một mục là chưa thể đóng." />
      {q.isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.length === 0 ? (
        <EmptyState title="Không có checklist bàn giao nào" hint="Bộ phận nhân sự tạo checklist khi có nhân viên nghỉ việc." />
      ) : (
        <div className="space-y-4">
          {q.data!.map((h) => {
            const canTick = isKm || h.owner.id === meId;
            return (
              <Card key={h.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{h.owner.fullName}</p>
                      <p className="text-xs text-muted-foreground">Ngày nghỉ dự kiến: {formatDate(h.leavingDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{h.done}/{h.total} hoàn thành</Badge>
                      <Badge className={h.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                        {h.status === 'CLOSED' ? 'Đã đóng' : 'Đang mở'}
                      </Badge>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {h.items.map((item) => {
                      const done = item.status === 'DONE';
                      return (
                        <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                            <span className={done ? 'truncate line-through opacity-60' : 'truncate'}>{item.title}</span>
                          </span>
                          {canTick && h.status === 'OPEN' ? (
                            <Button size="sm" variant="ghost"
                              onClick={() => toggle.mutate({ id: h.id, itemId: item.id, done: !done })}>
                              {done ? 'Bỏ xác nhận' : 'Xác nhận'}
                            </Button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  {isKm && h.status === 'OPEN' ? (
                    <Button size="sm" className="mt-3" disabled={h.done < h.total || close.isPending}
                      onClick={() => close.mutate(h.id)}>
                      <Lock className="h-4 w-4" /> Đóng checklist
                    </Button>
                  ) : null}
                  {isKm && h.status === 'OPEN' && h.done < h.total ? (
                    <p className="mt-1 text-xs text-muted-foreground">Cần hoàn thành tất cả các mục trước khi đóng.</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
