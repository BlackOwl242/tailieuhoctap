'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, CalendarCheck, ClipboardCheck, Eye, GraduationCap, LogIn,
  ThumbsUp, UserRound, Users, Wallet, XCircle,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, DAY_STATUS_LABEL } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@/components/ui/primitives';
import { PageHeader, ErrorState, EmptyState } from '@/components/common/states';
import type { DashboardStats } from '@/lib/types';

/** KC21 — Bảng điều khiển chuẩn quản trị nhân sự: số liệu HR thời gian thực + việc của tôi. */
export default function DashboardPage() {
  const fullName = useAuthStore((s) => s.user?.fullName);
  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardStats>('/dashboard/stats')).data,
  });

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const stats = q.data!;
  const hr = stats.hr;
  const pendingTotal = (hr?.pendingLeave ?? 0) + (hr?.pendingOvertime ?? 0) + (hr?.pendingActions ?? 0);

  return (
    <>
      {/* Lời chào theo buổi + ngày — chuẩn HRM quốc tế */}
      <div className="mb-stack">
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}{fullName ? `, ${fullName.split(/\s+/).slice(-2).join(' ')}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{today} — tổng quan nhân sự và việc cần xử lý của bạn.</p>
      </div>

      {/* Hàng 1 — Số liệu nhân sự thời gian thực */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <HrStatTile
          icon={Users} tone="blue" label="Tổng nhân sự đang làm việc"
          value={hr ? String(hr.totalEmployees) : '—'}
          hint={hr ? `${hr.totalEmployees - hr.presentToday - hr.onLeaveToday} chưa chấm công hôm nay` : ''}
          href="/employees"
        />
        <HrStatTile
          icon={CalendarCheck} tone="green" label="Đi làm hôm nay"
          value={hr ? String(hr.presentToday) : '—'}
          hint={hr && hr.onLeaveToday > 0 ? `${hr.onLeaveToday} người nghỉ phép` : 'Không có người nghỉ phép'}
          href="/attendance"
        />
        <HrStatTile
          icon={Wallet} tone="amber" label="Kỳ lương gần nhất"
          value={hr?.latestPeriod ? `${String(hr.latestPeriod.month).padStart(2, '0')}/${hr.latestPeriod.year}` : '—'}
          hint={hr?.latestPeriod ? { OPEN: 'Đang mở kỳ', CALCULATED: 'Đã tính lương', REVIEWED: 'Chờ duyệt', LOCKED: 'Đã khóa chi trả' }[hr.latestPeriod.status] ?? '' : ''}
          href="/payroll"
        />
        <HrStatTile
          icon={ClipboardCheck} tone={pendingTotal > 0 ? 'red' : 'green'} label="Đơn chờ xử lý"
          value={String(pendingTotal)}
          hint={hr ? `${hr.pendingLeave} nghỉ phép · ${hr.pendingOvertime} làm thêm · ${hr.pendingActions} biến động` : ''}
          href="/personnel"
        />
      </div>

      {/* Hàng 2 — Việc của tôi */}
      <div className="mt-stack grid grid-cols-1 gap-3 sm:grid-cols-3">
        <WorkCard href="/review" icon={ClipboardCheck} label="Bài chờ bạn duyệt" value={stats.me.pendingReviews} tone="amber" />
        <WorkCard href="/onboarding" icon={GraduationCap} label="Mục hội nhập còn lại" value={stats.me.pendingOnboardingItems} tone="blue" />
        <WorkCard
          href="/attendance"
          icon={Eye}
          label="Chấm công hôm nay"
          value={stats.me.todayAttendance ? DAY_STATUS_LABEL[stats.me.todayAttendance.status] ?? stats.me.todayAttendance.status : 'Chưa điểm danh'}
          tone={(stats.me.todayAttendance?.lateMinutes ?? 0) > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="mt-stack grid gap-4 lg:grid-cols-2">
        {/* Xem nhiều nhất */}
        <Card>
          <CardHeader><CardTitle>Nội dung xem nhiều nhất</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.topArticles.length === 0 ? (
              <EmptyState title="Chưa có bài viết nào" hint="Hãy tạo bài viết đầu tiên trong một không gian." />
            ) : (
              stats.topArticles.map((a) => (
                <Link key={a.id} href={`/articles/${a.id}`} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent">
                  <span className="min-w-0 truncate pr-2">{a.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{a.viewCount}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{a.helpfulCount}</span>
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Mới xuất bản */}
        <Card>
          <CardHeader><CardTitle>Mới xuất bản</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.recentArticles.length === 0 ? (
              <EmptyState title="Chưa có bài viết nào" />
            ) : (
              stats.recentArticles.map((a) => (
                <Link key={a.id} href={`/articles/${a.id}`} className="block rounded-md px-2 py-2 hover:bg-accent">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.author.fullName} · {a.space.name} · {formatDateTime(a.publishedAt)}
                  </p>
                </Link>
              ))
            )}
            <Link href="/spaces" className="inline-flex items-center gap-1 px-2 pt-1 text-sm text-primary hover:underline">
              Duyệt theo không gian <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tuần chấm công của tôi */}
      <Card className="mt-stack">
        <CardHeader><CardTitle>Chấm công 7 ngày của tôi</CardTitle></CardHeader>
        <CardContent>
          {stats.attendanceWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu — điểm danh hoặc chạy bộ mô phỏng để có dữ liệu.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.attendanceWeek.map((d) => (
                <Badge key={d.date} variant="secondary" className="px-2.5 py-1">
                  {new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} · {DAY_STATUS_LABEL[d.status] ?? d.status}
                  {d.lateMinutes > 0 ? ` (+${d.lateMinutes}')` : ''}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/** Thẻ số liệu HR — icon màu + giá trị lớn + mô tả + liên kết nhanh. */
function HrStatTile({ icon: Icon, tone, label, value, hint, href }: {
  icon: typeof Users; tone: 'blue' | 'green' | 'amber' | 'red';
  label: string; value: string; hint?: string; href: string;
}) {
  const tones = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <Link href={href} className="group">
      <div className="flex h-full flex-col justify-between rounded-lg border bg-card p-card shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <p className="mt-3 text-2xl font-bold leading-tight">{value}</p>
        <p className="text-sm font-medium text-foreground/80">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Link>
  );
}

function WorkCard({ href, icon: Icon, label, value, tone }: {
  href: string; icon: typeof LogIn; label: string; value: number | string; tone: 'amber' | 'blue' | 'green' | 'red';
}) {
  const tones = {
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
  };
  const icons = { amber: ClipboardCheck, blue: GraduationCap, green: UserRound, red: XCircle };
  void icons;
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-card">
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-xl font-bold leading-tight">{value}</span>
            <span className="block text-xs text-muted-foreground">{label}</span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
