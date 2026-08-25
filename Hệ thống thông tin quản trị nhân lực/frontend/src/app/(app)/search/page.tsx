'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, Card, CardContent, Input, Skeleton } from '@/components/ui/primitives';
import { PageHeader, EmptyState } from '@/components/common/states';

interface SearchResult {
  items: Array<{
    id: string; title: string; summary: string | null;
    space: { name: string; slug: string }; authorName: string; publishedAt: string | null;
  }>;
}

/** KC12 — Tìm kiếm toàn văn: trang chủ của việc "cần tìm thì tìm ra". */
export default function SearchPage() {
  const [term, setTerm] = useState('');
  const [submitted, setSubmitted] = useState('');

  const q = useQuery({
    queryKey: ['search', submitted],
    enabled: submitted.length > 0,
    queryFn: async () =>
      (await api.get<SearchResult>('/search', { params: { q: submitted } })).data,
  });

  return (
    <>
      <PageHeader title="Tìm kiếm tri thức" description="Tìm theo tiêu đề, tóm tắt và nội dung bài viết đã xuất bản." />

      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(term.trim()); }}
        className="mb-5 flex gap-2"
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="VD: runbook java, chính sách phép năm…"
          aria-label="Từ khóa tìm kiếm"
        />
        <Button type="submit"><SearchIcon className="h-4 w-4" /> Tìm</Button>
      </form>

      {!submitted ? (
        <EmptyState title="Nhập từ khóa để bắt đầu" hint="Mẹo: tìm theo tên công nghệ, tên quy trình hoặc nội dung bên trong bài viết." />
      ) : q.isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : q.isError ? (
        <p role="alert" className="text-sm text-destructive">{errorMessage(q.error)}</p>
      ) : q.data!.items.length === 0 ? (
        <EmptyState title={`Không tìm thấy kết quả cho "${submitted}"`} hint="Thử từ khóa ngắn hơn hoặc không dấu." />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{q.data!.items.length} kết quả cho “{submitted}”</p>
          {q.data!.items.map((r) => (
            <Link key={r.id} href={`/articles/${r.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <p className="font-medium text-primary">{r.title}</p>
                  {r.summary ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.summary}</p> : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.space.name} · {r.authorName}{r.publishedAt ? ` · ${formatDate(r.publishedAt)}` : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
