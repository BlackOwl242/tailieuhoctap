'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpenText, Loader2, LogOut, QrCode } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui/primitives';
import type { AuthUser } from '@/lib/types';

// Tài khoản demo hiển thị ngay trên màn hình đăng nhập cho tiện trình diễn
const DEMO_ACCOUNTS = [
  { label: 'Quản trị viên', email: 'admin@demo.local', password: 'Admin@123' },
  { label: 'Quản lý nội dung', email: 'km.manager@demo.local', password: 'Manager@123' },
  { label: 'Trưởng nhóm Java', email: 'pm.java@demo.local', password: 'Pm@123456' },
  { label: 'Nhân viên mới', email: 'dev.fresher@demo.local', password: 'Fresher@123' },
];

/** Chỉ nhận đường dẫn nội bộ — chống open-redirect. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const currentUser = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const nextPath = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Bước 1: đổi credential lấy cặp token
      const tokens = (await api.post('/auth/login', { email, password })).data;
      // Bước 2: lấy hồ sơ đầy đủ kèm vai trò
      const me = await api.get<AuthUser>('/auth/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      setAuth(tokens, me.data);
      // Dọn sạch cache của tài khoản trước (nếu có) — chống lộ dữ liệu chéo tài khoản
      queryClient.clear();
      router.replace(nextPath);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /** Đăng xuất nhanh ngay trên trang login khi còn phiên cũ (đổi tài khoản). */
  function quickLogout() {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) void api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    clear();
    queryClient.clear();
  }

  function quickFill(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo + tên hệ thống */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpenText className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">HRMIS Pro</h1>
          <p className="text-sm text-muted-foreground">Hệ thống Thông tin Quản trị Nhân lực Toàn diện</p>
        </div>

        {/* Còn phiên đăng nhập cũ → cho đăng xuất ngay để đổi tài khoản (Mục 3) */}
        {currentUser ? (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm">
            <span className="min-w-0 truncate">
              Đang có phiên của <strong>{currentUser.fullName}</strong>
            </span>
            <Button size="sm" variant="outline" onClick={quickLogout}>
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </Button>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" type="email" autoComplete="username" required
                  placeholder="ten@congty.vn"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password" type="password" autoComplete="current-password" required
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Lỗi từ backend đã có cấu trúc → hiển thị trực tiếp an toàn */}
              {error ? (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Đăng nhập
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Đăng nhập nhanh bằng tài khoản demo — chỉ phục vụ trình diễn */}
        <div className="mt-5 space-y-2">
          <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
            Tài khoản demo (bấm để điền sẵn)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => quickFill(acc)}
                className="rounded-md border bg-card px-2 py-2 text-left text-xs hover:bg-accent"
              >
                <span className="block font-medium">{acc.label}</span>
                <span className="block truncate text-muted-foreground">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mục 2 — mở màn hình điểm danh ngay từ trang đăng nhập (không cần đăng nhập) */}
        <div className="mt-6 flex items-center justify-center gap-4 text-center text-xs text-muted-foreground">
          <Link href="/check-in?mode=qr" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground">
            <QrCode className="h-3.5 w-3.5" /> Mở màn hình Kiosk điểm danh (QR)
          </Link>
          <span aria-hidden>·</span>
          <Link href="/check-in?mode=face" className="underline underline-offset-2 hover:text-foreground">
            Điểm danh khuôn mặt
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  // useSearchParams cần Suspense boundary trong Next.js App Router
  return (
    <Suspense fallback={<main className="flex min-h-dvh items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>}>
      <LoginInner />
    </Suspense>
  );
}
