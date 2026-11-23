'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, bootstrapSession, errorMessage, isUnauthorized } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingBlock, ErrorState } from '@/components/common/states';
import type { MeProfile } from '@/lib/types';

/**
 * Layout cho toàn bộ khu vực đã đăng nhập:
 * - Khi tải lại trang (F5), khôi phục access token trên RAM từ HttpOnly cookie;
 * - Chưa có token → chuyển trang login;
 * - Có token → tải hồ sơ /auth/me để biết vai trò rồi render AppShell.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const sessionBootstrapped = useAuthStore((s) => s.sessionBootstrapped);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!sessionBootstrapped) {
      void bootstrapSession();
    }
  }, [sessionBootstrapped]);

  const meQuery = useQuery({
    queryKey: ['me'],
    enabled: sessionBootstrapped && !!token,
    queryFn: async () => {
      const res = await api.get<MeProfile>('/auth/me');
      setUser({
        id: res.data.id,
        email: res.data.email,
        fullName: res.data.fullName,
        roles: res.data.roles,
        mfaEnabled: res.data.mfaEnabled,
      });
      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (sessionBootstrapped && !token) router.replace('/login');
  }, [sessionBootstrapped, token, router]);

  /**
   * Token hết hạn/bị thu hồi (401/403 từ /auth/me) → TỰ ĐỘNG đăng xuất và
   * roll back về trang đăng nhập kèm ?next= để quay lại đúng trang cũ —
   * không để người dùng treo ở màn hình lỗi "Thử lại" vô nghĩa.
   */
  const pathname = usePathname();
  useEffect(() => {
    if (meQuery.isError && isUnauthorized(meQuery.error)) {
      useAuthStore.getState().clear();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [meQuery.isError, meQuery.error, router, pathname]);

  if (!sessionBootstrapped) return <LoadingBlock label="Đang khôi phục phiên đăng nhập…" />;
  if (!token) return null;
  if (meQuery.isLoading) return <LoadingBlock label="Đang tải không gian làm việc…" />;
  if (meQuery.isError || !meQuery.data) {
    // Lỗi phiên (401/403) → đang chuyển về trang đăng nhập
    if (meQuery.isError && isUnauthorized(meQuery.error)) {
      return <LoadingBlock label="Phiên đăng nhập đã hết hạn — đang chuyển về trang đăng nhập…" />;
    }
    // Lỗi khác (mạng, máy chủ) → cho thử lại
    return (
      <div className="mx-auto max-w-lg px-4 pt-16">
        <ErrorState message={errorMessage(meQuery.error)} onRetry={() => meQuery.refetch()} />
      </div>
    );
  }

  return <AppShell profile={meQuery.data}>{children}</AppShell>;
}
