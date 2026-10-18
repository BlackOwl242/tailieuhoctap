'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpenText, Camera, Loader2, LogOut } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from '@/components/ui/primitives';
import type { AuthUser } from '@/lib/types';

const INITIAL_PASSWORD = '123';
const QUICK_ACCOUNTS = [
  { email: 'admin@demo.local', name: 'Nguyễn Hoàng Nam', role: 'Quản trị hệ thống' },
  { email: 'ceo@saigontechnology.vn', name: 'Trần Minh Hoàng', role: 'Tổng Giám đốc' },
  { email: 'chairman@saigontechnology.vn', name: 'Phạm Tiến Thành', role: 'Chủ tịch HĐQT' },
  { email: 'km.manager@demo.local', name: 'Dương Khánh Chi', role: 'Quản trị nhân sự' },
  { email: 'pm.java@demo.local', name: 'Lê Minh Tuấn', role: 'Quản lý trực tiếp' },
  { email: 'editor.qa@demo.local', name: 'Hồ Ngọc Sơn', role: 'Trưởng nhóm Kiểm thử' },
  { email: 'cb.demo@demo.local', name: 'Trần Thu Trang', role: 'Chuyên viên C&B' },
  { email: 'accountant.demo@demo.local', name: 'Nguyễn Thị Hồng', role: 'Kế toán' },
  { email: 'recruiter.demo@demo.local', name: 'Phạm Ngọc Mai', role: 'Tuyển dụng' },
  { email: 'trainer.demo@demo.local', name: 'Lê Hoàng Anh', role: 'Đào tạo' },
  { email: 'auditor.demo@demo.local', name: 'Vũ Minh Đức', role: 'Kiểm toán nội bộ' },
  { email: 'dev.fresher@demo.local', name: 'Đỗ Gia Hân', role: 'Nhân viên' },
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
  const [quickAccount, setQuickAccount] = useState('');
  const [passwordChangeSession, setPasswordChangeSession] = useState<{ accessToken: string; email: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Bước 1: đổi credential lấy cặp token
      const tokens = (await api.post('/auth/login', { email, password })).data;
      // Xóa phiên cũ trước khi tải hồ sơ, để interceptor không ghi đè token mới.
      quickLogout();
      // Bước 2: lấy hồ sơ đầy đủ kèm vai trò
      const me = await api.get<AuthUser>('/auth/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (me.data.mustChangePassword) {
        setPasswordChangeSession({ accessToken: tokens.accessToken, email: me.data.email });
        setPassword('');
        setError(null);
        return;
      }
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

  async function changeInitialPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordChangeSession) return;
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${passwordChangeSession.accessToken}` };
      const tokens = (await api.post('/auth/change-password', { currentPassword, newPassword }, { headers })).data;
      const me = await api.get<AuthUser>('/auth/me', { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
      setAuth(tokens, me.data);
      queryClient.clear();
      router.replace(nextPath);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
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
            <CardTitle>{passwordChangeSession ? 'Đổi mật khẩu khởi tạo' : 'Đăng nhập'}</CardTitle>
          </CardHeader>
          <CardContent>
            {passwordChangeSession ? (
              <form onSubmit={changeInitialPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground">Tài khoản <strong className="text-foreground">{passwordChangeSession.email}</strong> đang dùng mật khẩu khởi tạo. Hãy đổi mật khẩu để tiếp tục; mật khẩu mới cần ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                  <Input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Mật khẩu mới</Label>
                  <Input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Nhập lại mật khẩu mới</Label>
                  <Input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                {error ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Đổi mật khẩu và tiếp tục
                </Button>
                <Button type="button" variant="ghost" className="w-full" disabled={loading} onClick={() => { setPasswordChangeSession(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(null); }}>
                  Quay lại đăng nhập
                </Button>
              </form>
            ) : <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="quick-account">Chọn tài khoản đăng nhập nhanh</Label>
                <Select
                  id="quick-account"
                  value={quickAccount}
                  onChange={(e) => {
                    const account = QUICK_ACCOUNTS.find((item) => item.email === e.target.value);
                    setQuickAccount(e.target.value);
                    if (account) {
                      setEmail(account.email);
                      setPassword(INITIAL_PASSWORD);
                      setError(null);
                    }
                  }}
                >
                  <option value="">Chọn vai trò / tài khoản</option>
                  {QUICK_ACCOUNTS.map((account) => (
                    <option key={account.email} value={account.email}>
                      {account.role} — {account.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">Mật khẩu đăng nhập nhanh: <strong className="text-foreground">123</strong></p>
              </div>
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
            </form>}
          </CardContent>
        </Card>

        {/* Mục 2 — mở màn hình điểm danh ngay từ trang đăng nhập (không cần đăng nhập) */}
        <div className="mt-6 flex items-center justify-center gap-4 text-center text-xs text-muted-foreground">
          <Link href="/check-in" className="inline-flex items-center gap-1.5 underline underline-offset-2 hover:text-foreground">
            <Camera className="h-3.5 w-3.5" /> Điểm danh bằng khuôn mặt
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
