'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, ThumbsUp, MessageSquare, Plus, BookMarked } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, ARTICLE_STATUS_LABEL, ARTICLE_STATUS_TONE } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Card, CardContent, Select, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import type { ArticleListItem, SpaceSummary } from '@/lib/types';

interface SpaceDetail extends SpaceSummary {
  members: Array<{ id: string; fullName: string; spaceRole: string }>;
  myRole: string | null;
  following: boolean;
  canManage: boolean;
}

/** Trang một Space: danh sách bài viết + theo dõi + vào soạn bài. */
export default function SpaceDetailPage() {
  const params = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const meId = useAuthStore((s) => s.user?.id);
  const [status, setStatus] = useState('PUBLISHED');

  const spaceQ = useQuery({
    queryKey: ['space', params.slug],
    queryFn: async () => (await api.get<SpaceDetail>(`/spaces/${params.slug}`)).data,
  });

  const articlesQ = useQuery({
    queryKey: ['articles', spaceQ.data?.id, status],
    enabled: !!spaceQ.data,
    queryFn: async () =>
      (await api.get<{ items: ArticleListItem[] }>(`/spaces/${spaceQ.data!.id}/articles`, { params: { status } })).data,
  });

  const followMut = useMutation({
    mutationFn: async () => (await api.put(`/spaces/${spaceQ.data!.id}/follow`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['space', params.slug] }),
  });

  if (spaceQ.isLoading) return <Skeleton className="h-64" />;
  if (spaceQ.isError) return <ErrorState message={errorMessage(spaceQ.error)} onRetry={() => spaceQ.refetch()} />;
  const space = spaceQ.data!;

  return (
    <>
      <PageHeader
        title={space.name}
        description={space.description ?? undefined}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => followMut.mutate()}>
              <BookMarked className="h-4 w-4" /> {space.following ? 'Bỏ theo dõi' : 'Theo dõi'}
            </Button>
            {/* Soạn bài: thành viên CONTRIBUTOR trở lên (backend chặn lần hai) */}
            {(space.myRole && space.myRole !== 'VIEWER') || space.canManage ? (
              <Link href={`/spaces/${space.slug}/new`}>
                <Button size="sm"><Plus className="h-4 w-4" /> Soạn bài</Button>
              </Link>
            ) : null}
          </>
        }
      />

      {/* Bộ lọc trạng thái */}
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc theo trạng thái">
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="DRAFT">Nháp</option>
          <option value="PENDING_REVIEW">Chờ duyệt</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </Select>
      </div>

      {articlesQ.isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : articlesQ.isError ? (
        <ErrorState message={errorMessage(articlesQ.error)} onRetry={() => articlesQ.refetch()} />
      ) : articlesQ.data!.items.length === 0 ? (
        <EmptyState title="Chưa có bài viết ở trạng thái này" hint="Chọn trạng thái khác hoặc soạn bài mới." />
      ) : (
        <div className="space-y-3">
          {articlesQ.data!.items.map((a) => {
            // Người thường không thấy nút sửa bài của người khác
            const mineOrEditor = a.author.id === meId || space.canManage || ['MANAGER', 'EDITOR'].includes(space.myRole ?? '');
            return (
              <Card key={a.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link href={`/articles/${a.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-semibold hover:text-primary">{a.title}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{a.summary}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {a.author.fullName} · Cập nhật {formatDateTime(a.updatedAt)}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            a.status === 'PUBLISHED' ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        />
                        {ARTICLE_STATUS_LABEL[a.status]}
                      </span>
                      {mineOrEditor ? (
                        <Link href={`/articles/${a.id}/edit`} className="text-xs text-primary hover:underline">Sửa</Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{a.viewCount}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{a.helpfulCount}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{a.commentCount}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
