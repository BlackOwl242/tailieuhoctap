'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Card, CardContent } from '@/components/ui/primitives';
import { PageHeader } from '@/components/common/states';
import { ArticleForm } from '@/components/articles/article-form';

/** KC06 — Soạn bài viết mới trong Space (mặc định DRAFT). */
export default function NewArticlePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const toast = useToast();

  return (
    <>
      <PageHeader title="Soạn bài viết" description="Bài viết được lưu ở trạng thái Nháp — bạn chủ động trình duyệt sau." />
      <Card>
        <CardContent className="p-4 sm:p-5">
          <ArticleForm
            submitLabel="Lưu nháp"
            onSubmit={async (values) => {
              const created = await api.post(`/spaces/${params.slug}/articles`, values);
              toast('Đã lưu bài viết nháp', 'success');
              router.push(`/articles/${created.data.id}`);
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
