'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage, isUnauthorized } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingBlock, ErrorState } from '@/components/common/states';
import type { MeProfile } from '@/lib/types';

/**
 * Layout cho toàn bộ khu vực đã đăng nhập:
 * - Chưa có token → chuyển trang login;
 * - Có token → tải hồ sơ /auth/me để biết vai trò rồi render AppShell.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  /**
   * Chờ zustand persist rehydrate xong TRƯỚC khi quyết định redirect —
   * nếu không, F5 ở bất kỳ trang nào cũng bị đá về /login vì token chưa
   * kịp nạp từ localStorage ở lần render đầu (lỗi thật đã bị bắt được
   * bởi kiểm thử headless — Mục 5).
   */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Chỉ chạy phía client — SSR không có localStorage nên không đụng đến persist
    setHydrated(useAuthStore.persist.hasHydrated());
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  const meQuery = useQuery({
    queryKey: ['me'],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const res = await api.get<MeProfile>('/auth/me');
      setUser({
        id: res.data.id,
        email: res.data.email,
        fullName: res.data.fullName,
        roles: res.data.roles,
      });
      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (hydrated && !token) router.replace('/login');
  }, [hydrated, token, router]);

  /**
   * Token hết hạn/bị thu hồi (401/403 từ /auth/me) → TỰ ĐỘNG đăng xuất và
   * roll back về trang đăng nhập kèm ?next= để quay lại đúng trang cũ —
   * không để người dùng treo ở màn hình lỗi "Thử lại" vô nghĩa.
   * (Interceptor đã thử refresh trước đó; tới được đây nghĩa là refresh
   * cũng thất bại → phiên chết thật sự.)
   */
  const pathname = usePathname();
  useEffect(() => {
    if (meQuery.isError && isUnauthorized(meQuery.error)) {
      useAuthStore.getState().clear();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [meQuery.isError, meQuery.error, router, pathname]);

  if (!hydrated) return <LoadingBlock label="Đang khôi phục phiên đăng nhập…" />;
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
