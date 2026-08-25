'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, EyeOff, Lock, Plus } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import {
  Button, Card, CardContent, Input, Label, Select, Textarea, Badge, Skeleton,
} from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import type { SpaceSummary } from '@/lib/types';

const VIS_ICON = { PUBLIC: Globe, RESTRICTED: EyeOff, PRIVATE: Lock } as const;
const VIS_LABEL = { PUBLIC: 'Công khai', RESTRICTED: 'Hạn chế', PRIVATE: 'Riêng tư' } as const;

/** KC05/KC13 — Danh sách Space + tạo Space mới (KM_MANAGER/ADMIN). */
export default function SpacesPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const canCreate = roles.includes('KM_MANAGER') || roles.includes('ADMIN');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', visibility: 'PUBLIC' });

  const q = useQuery({
    queryKey: ['spaces'],
    queryFn: async () => (await api.get<{ items: SpaceSummary[] }>('/spaces')).data,
  });

  const createMut = useMutation({
    mutationFn: async () => (await api.post('/spaces', form)).data,
    onSuccess: () => {
      toast('Đã tạo không gian mới', 'success');
      setShowCreate(false);
      setForm({ name: '', description: '', visibility: 'PUBLIC' });
      qc.invalidateQueries({ queryKey: ['spaces'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  return (
    <>
      <PageHeader
        title="Không gian tri thức"
        description="Mỗi không gian gắn với một phòng ban hoặc chủ đề — cây tổ chức là dữ liệu cấu hình."
        actions={
          canCreate ? (
            <Button onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-4 w-4" /> Tạo không gian
            </Button>
          ) : null
        }
      />

      {/* Form tạo không gian — hiện/ẩn bằng nút ở trên */}
      {showCreate && canCreate ? (
        <Card className="mb-4">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="sp-name">Tên không gian</Label>
              <Input id="sp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Nhóm .NET — Đà Nẵng" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-vis">Phạm vi</Label>
              <Select id="sp-vis" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                <option value="PUBLIC">Công khai</option>
                <option value="RESTRICTED">Hạn chế (thành viên)</option>
                <option value="PRIVATE">Riêng tư</option>
              </Select>
            </div>
            <Button disabled={!form.name.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
              Tạo ngay
            </Button>
            <div className="sm:col-span-3">
              <Label htmlFor="sp-desc">Mô tả ngắn</Label>
              <Textarea id="sp-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Không gian này chứa những tài liệu, quy trình gì?" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Danh sách không gian */}
      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.items.length === 0 ? (
        <EmptyState title="Bạn chưa thấy không gian nào" hint="Không gian riêng tư chỉ hiển thị khi bạn là thành viên." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {q.data!.items.map((s) => {
            const VisIcon = VIS_ICON[s.visibility];
            return (
              <Link key={s.id} href={`/spaces/${s.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: s.color }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{s.name}</p>
                        <p className="mt-0.5 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="gap-1"><VisIcon className="h-3 w-3" />{VIS_LABEL[s.visibility]}</Badge>
                      <Badge variant="secondary">{s.publishedCount} bài</Badge>
                      <Badge variant="secondary">{s.memberCount} thành viên</Badge>
                      {s.myRole ? <Badge>Vai: {s.myRole.toLowerCase()}</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
