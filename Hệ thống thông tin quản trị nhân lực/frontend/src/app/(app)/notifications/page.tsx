'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CheckCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { Button, Card, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import type { NotificationItem } from '@/lib/types';

/** KC17 — Thông báo in-app: chưa đọc nổi bật, đánh dấu đã đọc từng mục/tất cả. */
export default function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<{ items: NotificationItem[]; unreadCount: number }>('/notifications', { params: { limit: 50 } })).data,
  });

  const readAll = useMutation({
    mutationFn: async () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readOne = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <>
      <PageHeader
        title="Thông báo"
        description={q.data ? `${q.data.unreadCount} chưa đọc` : undefined}
        actions={
          q.data && q.data.unreadCount > 0 ? (
            <Button size="sm" variant="outline" onClick={() => readAll.mutate()}>
              <CheckCheck className="h-4 w-4" /> Đánh dấu tất cả
            </Button>
          ) : null
        }
      />

      {q.isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.items.length === 0 ? (
        <EmptyState title="Chưa có thông báo nào" icon={BellRing} hint="Thông báo duyệt, bình luận và bài mới sẽ hiện ở đây." />
      ) : (
        <div className="space-y-2">
          {q.data!.items.map((n) => {
            const inner = (
              <Card className={cn('p-4 transition-colors', !n.readAt && 'border-primary/40 bg-primary/5')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn('truncate text-sm', !n.readAt && 'font-semibold')}>{n.title}</p>
                    {n.body ? <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.readAt ? (
                    <button
                      onClick={(e) => { e.preventDefault(); readOne.mutate(n.id); }}
                      className="shrink-0 rounded-md px-2 py-1 text-xs text-primary hover:bg-accent"
                    >
                      Đã đọc
                    </button>
                  ) : null}
                </div>
              </Card>
            );
            // Có link → bọc bằng Link để điều hướng tới đúng bài/việc
            return n.linkPath ? (
              <Link key={n.id} href={n.linkPath} className="block">{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </>
  );
}
