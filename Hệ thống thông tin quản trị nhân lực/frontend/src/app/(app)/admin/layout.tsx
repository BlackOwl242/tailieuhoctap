'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage, isUnauthorized } from '@/lib/api';
import { LoadingBlock, ErrorState } from '@/components/common/states';
import type { MeProfile } from '@/lib/types';

/**
 * RBAC — chặn route phía frontend cho toàn bộ khu vực /admin/*:
 * - Chỉ tài khoản có vai trò ADMIN được vào;
 * - Tài khoản khác bị chuyển hướng về /dashboard (menu đã ẩn từ trước,
 *   lớp này chặn trường hợp gõ tay URL);
 * - Lớp chặn quyết định cuối cùng vẫn là guard phía API (@Roles('ADMIN')).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Dùng lại cache ['me'] mà (app)/layout.tsx đã tải → không gọi API lần 2
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<MeProfile>('/auth/me')).data,
    staleTime: 60_000,
    retry: false,
  });

  const isAdmin = !!meQuery.data?.roles?.includes('ADMIN');

  useEffect(() => {
    if (meQuery.isSuccess && !isAdmin) router.replace('/dashboard');
  }, [meQuery.isSuccess, isAdmin, router]);

  if (meQuery.isLoading) return <LoadingBlock label="Đang kiểm tra quyền truy cập…" />;
  if (meQuery.isError) {
    if (isUnauthorized(meQuery.error)) {
      return <LoadingBlock label="Phiên đăng nhập đã hết hạn — đang chuyển về trang đăng nhập…" />;
    }
    return (
      <div className="mx-auto max-w-lg px-4 pt-16">
        <ErrorState message={errorMessage(meQuery.error)} onRetry={() => meQuery.refetch()} />
      </div>
    );
  }
  if (!isAdmin) return <LoadingBlock label="Bạn không có quyền truy cập khu vực quản trị — đang chuyển hướng…" />;

  return <>{children}</>;
}
