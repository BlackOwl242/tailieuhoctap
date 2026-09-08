'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Card, CardContent, Button, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import type { OnboardingAssignmentView } from '@/lib/types';

/** KC19 — Lộ trình hội nhập của tôi: tick từng bài đọc bắt buộc. */
export default function OnboardingPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const q = useQuery({
    queryKey: ['onboarding-my'],
    queryFn: async () => (await api.get<OnboardingAssignmentView[]>('/onboarding/my')).data,
  });

  const complete = useMutation({
    mutationFn: async (vars: { assignmentId: string; itemId: string }) =>
      api.post(`/onboarding/assignments/${vars.assignmentId}/items/${vars.itemId}/complete`),
    onSuccess: () => {
      toast('Đã đánh dấu hoàn thành', 'success');
      qc.invalidateQueries({ queryKey: ['onboarding-my'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  return (
    <>
      <PageHeader title="Lộ trình hội nhập" description="Các bài đọc bắt buộc cho nhân viên mới — hoàn thành để sẵn sàng vào dự án." />
      {q.isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.length === 0 ? (
        <EmptyState title="Bạn chưa được giao lộ trình nào" hint="Bộ phận nhân sự sẽ giao lộ trình đọc phù hợp với vị trí của bạn." />
      ) : (
        <div className="space-y-4">
          {q.data!.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{a.path.title}</p>
                  <div className="flex items-center gap-2">
                    {a.dueDate ? <span className="text-xs text-muted-foreground">Hạn {formatDate(a.dueDate)}</span> : null}
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                      {a.progressPercent}%
                    </span>
                  </div>
                </div>
                {/* Thanh tiến độ */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${a.progressPercent}%` }} />
                </div>

                <ul className="mt-3 space-y-1.5">
                  {a.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                      <Link href={`/articles/${item.article.id}`} className="flex min-w-0 items-center gap-2 text-sm hover:text-primary">
                        {item.completed
                          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className={item.completed ? 'truncate line-through opacity-60' : 'truncate'}>{item.article.title}</span>
                      </Link>
                      {!item.completed ? (
                        <Button size="sm" variant="ghost"
                          onClick={() => complete.mutate({ assignmentId: a.id, itemId: item.id })}>
                          Đã đọc
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
