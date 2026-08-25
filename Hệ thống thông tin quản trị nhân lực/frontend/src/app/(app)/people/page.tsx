'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/lib/api';
import { Avatar, AvatarFallback, Badge, Card, CardContent, Input, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';

interface PersonRow {
  id: string; fullName: string; email: string; jobTitle: string | null;
  expertise: string[]; orgUnit?: { id: string; name: string } | null;
  publishedCount: number;
}

/** KC18 — Danh bạ chuyên môn: tìm "ai biết về X" theo tên/vị trí/lĩnh vực. */
export default function PeoplePage() {
  const [term, setTerm] = useState('');
  const q = useQuery({
    queryKey: ['people', term],
    queryFn: async () =>
      (await api.get<{ items: PersonRow[] }>('/people', { params: term ? { q: term } : {} })).data,
  });

  return (
    <>
      <PageHeader title="Tìm chuyên gia" description="Tìm đúng người biết trước khi mất thời gian tự mò." />
      <div className="mb-4 max-w-md">
        <Input placeholder="Tìm theo tên, chức danh hoặc lĩnh vực (VD: java)…" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.items.length === 0 ? (
        <EmptyState title="Không tìm thấy ai phù hợp" hint="Thử từ khóa khác, ví dụ tên công nghệ." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {q.data!.items.map((p) => (
            <Link key={p.id} href={`/people/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>{initials(p.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.jobTitle}{p.orgUnit ? ` · ${p.orgUnit.name}` : ''}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(p.expertise ?? []).slice(0, 3).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                      <Badge>{p.publishedCount} bài</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}
