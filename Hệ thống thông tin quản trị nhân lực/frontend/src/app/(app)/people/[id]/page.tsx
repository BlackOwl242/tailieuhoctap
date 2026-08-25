'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, Badge, Card, CardContent, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';

interface ProfileView {
  id: string; fullName: string; email: string; jobTitle: string | null;
  expertise: string[]; bio: string | null;
  orgUnit?: { id: string; name: string } | null;
  isMe: boolean;
  articles: Array<{ id: string; title: string; publishedAt: string | null; viewCount: number; helpfulCount: number }>;
}

/** Hồ sơ chuyên môn chi tiết + bài viết đã xuất bản trong phạm vi được xem. */
export default function PersonProfilePage() {
  const params = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['person', params.id],
    queryFn: async () => (await api.get<ProfileView>(`/people/${params.id}`)).data,
  });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const p = q.data!;

  return (
    <>
      <PageHeader title={p.isMe ? 'Hồ sơ của tôi' : 'Hồ sơ chuyên môn'} />
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
          <Avatar className="h-16 w-16 border">
            <AvatarFallback>{initials(p.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{p.fullName}</p>
            <p className="text-sm text-muted-foreground">{p.jobTitle}{p.orgUnit ? ` · ${p.orgUnit.name}` : ''}</p>
            {p.bio ? <p className="mt-2 text-sm">{p.bio}</p> : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(p.expertise ?? []).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <p className="mb-3 font-semibold">Bài viết đã chia sẻ ({p.articles.length})</p>
          {p.articles.length === 0 ? (
            <EmptyState title="Chưa có bài viết nào hiển thị với bạn" />
          ) : (
            <ul className="space-y-2">
              {p.articles.map((a) => (
                <li key={a.id}>
                  <Link href={`/articles/${a.id}`} className="block rounded-md px-2 py-2 hover:bg-accent">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.publishedAt)} · {a.viewCount} lượt xem · {a.helpfulCount} hữu ích
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function initials(name: string): string {
  // Lấy chữ cái đầu của họ + tên (2 từ cuối)
  return name.split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}
