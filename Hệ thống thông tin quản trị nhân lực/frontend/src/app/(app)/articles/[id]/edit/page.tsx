'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Card, CardContent, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState } from '@/components/common/states';
import { ArticleForm } from '@/components/articles/article-form';
import type { ArticleDetail } from '@/lib/types';

/** Sửa bài viết → sinh PHIÊN BẢN MỚI (bản cũ bất biến). */
export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const q = useQuery({
    queryKey: ['article', params.id],
    queryFn: async () => (await api.get<ArticleDetail>(`/articles/${params.id}`)).data,
  });

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} />;
  const article = q.data!;

  if (!article.permissions.canEdit) {
    return <ErrorState message="Bạn không có quyền sửa bài viết này" />;
  }

  return (
    <>
      <PageHeader title="Chỉnh sửa bài viết" description={`Phiên bản hiện tại: v${article.versionNo} — bản cũ vẫn được giữ lại.`} />
      <Card>
        <CardContent className="p-4 sm:p-5">
          <ArticleForm
            initial={{
              title: article.title,
              summary: article.summary ?? '',
              contentMd: article.contentMd,
              changeNote: '',
            }}
            submitLabel="Lưu phiên bản mới"
            onSubmit={async (values) => {
              await api.patch(`/articles/${article.id}`, values);
              toast('Đã lưu phiên bản mới', 'success');
              router.push(`/articles/${article.id}`);
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
