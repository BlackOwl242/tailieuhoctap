'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CheckCheck, ClipboardList, ArrowUpRight } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { Button, Card, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import type { NotificationItem } from '@/lib/types';

interface ActionItemsResponse {
  items: Array<{ key: string; title: string; description: string; count: number; href: string }>;
  total: number;
  roles: string[];
}

const roleNames: Record<string, string> = { ADMIN: 'Quản trị hệ thống', KM_MANAGER: 'Quản lý nhân sự', HR_CB: 'Nhân sự / C&B', LINE_MANAGER: 'Quản lý trực tiếp', BOD: 'Ban Giám đốc', ACCOUNTANT: 'Kế toán', HR_RECRUITER: 'Tuyển dụng', HR_TRAINER: 'Đào tạo', USER: 'Nhân viên' };

/** KC17 — Thông báo in-app: chưa đọc nổi bật, đánh dấu đã đọc từng mục/tất cả. */
export default function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<{ items: NotificationItem[]; unreadCount: number }>('/notifications', { params: { limit: 50 } })).data,
  });
  const actions = useQuery({
    queryKey: ['notifications', 'action-items'],
    queryFn: async () => (await api.get<ActionItemsResponse>('/notifications/action-items')).data,
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

      <Card className="mb-5 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">Việc cần tôi xử lý</h2><p className="text-xs text-muted-foreground">Tự lọc theo quyền và phạm vi phụ trách của tài khoản</p></div></div>
          {actions.data && <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{actions.data.total} việc</span>}
        </div>
        {actions.isLoading ? <div className="space-y-2 p-4"><Skeleton className="h-10" /><Skeleton className="h-10" /></div> : actions.isError ? <div className="p-4"><ErrorState message={errorMessage(actions.error)} onRetry={() => actions.refetch()} /></div> : actions.data!.items.length === 0 ? <p className="p-5 text-center text-sm text-muted-foreground">Hiện không có hồ sơ nào chờ bạn duyệt hoặc xử lý.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted/20 text-xs text-muted-foreground"><tr><th className="px-4 py-2 font-medium">Công việc</th><th className="px-4 py-2 font-medium">Chờ xử lý</th><th className="px-4 py-2 font-medium">Mở danh sách</th></tr></thead><tbody className="divide-y">{actions.data!.items.map(item => <tr key={item.key} className="hover:bg-muted/20"><td className="px-4 py-3"><p className="font-medium">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p></td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">{item.count}</span></td><td className="px-4 py-3"><Link className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={item.href}>Xem hồ sơ <ArrowUpRight className="h-4 w-4" /></Link></td></tr>)}</tbody></table></div>}
        {actions.data?.roles.length ? <p className="border-t px-4 py-2 text-xs text-muted-foreground">Thông báo theo vai trò: {Array.from(new Set(actions.data.roles.map(role => roleNames[role] ?? role))).join(' · ')}</p> : null}
      </Card>

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
