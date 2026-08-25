'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Badge, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';

interface PendingItem {
  id: string; title: string; summary: string | null;
  space: { name: string; slug: string };
  author: { fullName: string };
  submittedAt: string; reviewDueAt: string | null;
}

/** KC11 — Hộp phê duyệt: bài chờ lâu nhất lên đầu, duyệt ngay tại chỗ. */
export default function ReviewPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const q = useQuery({
    queryKey: ['reviews-pending'],
    queryFn: async () => (await api.get<{ items: PendingItem[] }>('/reviews/pending')).data,
  });

  const act = useMutation<unknown, Error, { id: string; body: Record<string, string> }>({
    mutationFn: ({ id, body }) => api.post(`/articles/${id}/review`, body),
    onSuccess: () => {
      toast('Đã xử lý bản thảo', 'success');
      qc.invalidateQueries({ queryKey: ['reviews-pending'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  return (
    <>
      <PageHeader title="Phê duyệt" description="Bản thảo trong các không gian bạn quản lý — xử lý để không ùn tắc." />
      {q.isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.items.length === 0 ? (
        <EmptyState title="Không có bản thảo nào chờ bạn" hint="Khi có bài được trình duyệt, nó sẽ xuất hiện ở đây." />
      ) : (
        <div className="space-y-3">
          {q.data!.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/articles/${item.id}`} className="font-semibold hover:text-primary">{item.title}</Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.author.fullName} · {item.space.name} · Trình lúc {formatDateTime(item.submittedAt)}
                      {item.reviewDueAt ? ` · Hạn ${formatDateTime(item.reviewDueAt)}` : ''}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">Chờ duyệt</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="success" disabled={act.isPending}
                    onClick={() => act.mutate({ id: item.id, body: { action: 'APPROVE' } })}>
                    <CheckCircle2 className="h-4 w-4" /> Duyệt & xuất bản
                  </Button>
                  <Button size="sm" variant="secondary" disabled={act.isPending}
                    onClick={() => {
                      const comment = window.prompt('Ý kiến chỉnh sửa cho tác giả:');
                      if (!comment) return;
                      act.mutate({ id: item.id, body: { action: 'REQUEST_CHANGES', comment } });
                    }}>
                    Yêu cầu chỉnh sửa
                  </Button>
                  <Button size="sm" variant="destructive" disabled={act.isPending}
                    onClick={() => {
                      const comment = window.prompt('Lý do từ chối:');
                      if (!comment) return;
                      act.mutate({ id: item.id, body: { action: 'REJECT', comment } });
                    }}>
                    <XCircle className="h-4 w-4" /> Từ chối
                  </Button>
                  <Link href={`/articles/${item.id}`} className="self-center text-sm text-primary hover:underline">
                    Xem chi tiết →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
