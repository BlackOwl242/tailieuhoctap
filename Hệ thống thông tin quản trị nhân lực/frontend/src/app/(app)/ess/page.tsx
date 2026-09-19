'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, CheckCircle2, Clock, Calendar, FileText, Plane,
  CreditCard, HelpCircle, ArrowRight, ShieldCheck, Heart, Sparkles,
  MapPin, LogIn, LogOut, Laptop, AlertCircle, Plus, CalendarDays,
  Users, Check, X, Shield
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { LoadingState } from '@/components/common/states';
import { Badge, Button, Input, Textarea } from '@/components/ui/primitives';
import Link from 'next/link';

export default function EssPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  // Modal State Giải trình công
  const [isRegularizeModalOpen, setIsRegularizeModalOpen] = useState(false);
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regInTime, setRegInTime] = useState('08:30');
  const [regOutTime, setRegOutTime] = useState('17:30');
  const [regReason, setRegReason] = useState('Đi gặp khách hàng đối tác đầu giờ sáng');

  const { data: myRegularizations } = useQuery<{ id: string; workDate: string; reason: string; status: string }[]>({
    queryKey: ['my-regularizations'],
    queryFn: async () => (await api.get('/hrms/attendance-regularizations/my')).data,
  });

  const { data: myAssets } = useQuery<{ id: string; assetCode: string; name: string; category: string; assignedAt?: string }[]>({
    queryKey: ['my-assets'],
    queryFn: async () => (await api.get('/hrms/assets/my')).data,
  });

  const { data: myLoans } = useQuery<{ id: string; loanType: string; monthlyEmi: number; remainingAmount: number }[]>({
    queryKey: ['my-loans'],
    queryFn: async () => (await api.get('/hrms/loans/my')).data,
  });

  const { data: myLeaveBalance } = useQuery<{ total: number; used: number; remaining: number }>({
    queryKey: ['my-leave-balance'],
    queryFn: async () => (await api.get('/hrms/leave/my-balance')).data,
  });

  const checkInMutation = useMutation({
    mutationFn: async () => (await api.post('/hrms/attendance/check-in')).data,
    onSuccess: () => {
      setIsCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => (await api.post('/hrms/attendance/check-out')).data,
    onSuccess: () => {
      setIsCheckedIn(false);
      setCheckInTime(null);
    },
  });

  const regularizeMutation = useMutation({
    mutationFn: async (payload: {
      userId: string;
      employeeName: string;
      workDate: string;
      requestedCheckIn: string;
      requestedCheckOut: string;
      reason: string;
    }) => {
      return (await api.post('/hrms/attendance-regularizations', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-regularizations'] });
      setIsRegularizeModalOpen(false);
    },
  });

  const handleCheckIn = () => {
    if (isCheckedIn) {
      checkOutMutation.mutate();
    } else {
      checkInMutation.mutate();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title={`Xin chào, ${user?.fullName ?? 'Nhân viên'}`}
        description="Cổng Tự Phục Vụ Nhân Viên (ESS): Chấm công định vị, gửi đơn giải trình bổ sung công, tra cứu phép năm (Điều 113 BLLĐ), phiếu lương điện tử, tài sản được bàn giao và khoản vay phúc lợi."
        breadcrumbs={[{ label: 'Cổng Cá nhân' }, { label: 'Tự phục vụ ESS' }]}
        actions={
          <button
            onClick={() => setIsRegularizeModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors shadow-2xs"
          >
            <Clock className="h-3.5 w-3.5 text-primary" />
            Giải Trình Bổ Sung Công
          </button>
        }
      />

      {/* Quick Punch In / Out Card & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance Widget */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chấm Công Hôm Nay</span>
            <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Trực tuyến
            </span>
          </div>

          <div className="text-center py-2 space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono">
              {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Trụ sở chính · Chấm công qua hệ thống
            </p>
          </div>

          <button
            onClick={handleCheckIn}
            className={`w-full py-2.5 rounded-md font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
              isCheckedIn
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isCheckedIn ? (
              <>
                <LogOut className="h-4 w-4" />
                Điểm danh ra ca (Đã vào lúc {checkInTime})
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Điểm danh vào ca
              </>
            )}
          </button>
        </div>

        {/* Leave Balance & Seniority Breakdown */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Hạn Mức Phép Năm {new Date().getFullYear()}</h3>
              <p className="text-xs text-muted-foreground">Tuân thủ Điều 113, 114 Bộ luật Lao động 2019</p>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              12 ngày cơ bản + 1 ngày thâm niên
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/20 p-3 rounded-md border border-border">
              <span className="text-xs text-muted-foreground">Tổng ngày phép</span>
              <p className="text-xl font-bold text-foreground mt-0.5 font-mono">{myLeaveBalance?.total?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-md border border-border">
              <span className="text-xs text-muted-foreground">Đã sử dụng</span>
              <p className="text-xl font-bold text-foreground mt-0.5 font-mono">{myLeaveBalance?.used?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-md border border-border">
              <span className="text-xs text-muted-foreground">Còn lại khả dụng</span>
              <p className="text-xl font-bold text-foreground mt-0.5 font-mono">{myLeaveBalance?.remaining?.toFixed(1) ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs border-t border-border/40">
            <span className="text-muted-foreground">Phiếu lương gần nhất: <b>Tháng {String(new Date().getMonth() === 0 ? 12 : new Date().getMonth()).padStart(2, '0')}/{new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()}</b></span>
            <Link href="/payroll-engine" className="font-semibold text-primary hover:underline flex items-center gap-1">
              Xem Chi Tiết Phiếu Lương <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick ESS Action Grid */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
          Hành Động & Đơn Từ Trực Tuyến
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/profile"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xs text-foreground">Hồ Sơ & Phân Cấp</span>
          </Link>

          <Link
            href="/leave"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xs text-foreground">Xin Nghỉ Phép</span>
          </Link>

          <button
            onClick={() => setIsRegularizeModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xs text-foreground">Giải Trình Chấm Công</span>
          </button>

          <Link
            href="/loans"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xs text-foreground">Vay Vốn Phúc Lợi</span>
          </Link>

          <Link
            href="/org-chart"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xs text-foreground">Sơ Đồ Đồng Nghiệp</span>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: My Assets & My Loans / Regularization History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Assets */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Laptop className="h-4 w-4 text-primary" />
              Tài Sản & Thiết Bị Được Cấp Phát
            </h3>
            <Link href="/assets" className="text-xs text-primary font-semibold hover:underline">
              Chi tiết
            </Link>
          </div>

          <div className="space-y-2">
            {(myAssets && myAssets.length > 0) ? myAssets.map((a, i) => (
              <div key={a.id || i} className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">Mã: {a.assetCode} · Loại: {a.category}</p>
                </div>
                <Badge variant="outline" className="text-xs font-normal gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Đang dùng
                </Badge>
              </div>
            )) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Chưa có tài sản nào được cấp phát
              </div>
            )}
          </div>
        </div>

        {/* My Regularization History */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Lịch Sử Giải Trình Chấm Công Gần Đây
            </h3>
            <button onClick={() => setIsRegularizeModalOpen(true)} className="text-xs text-primary font-semibold hover:underline">
              Gửi đơn mới
            </button>
          </div>

          <div className="space-y-2">
            {(myRegularizations && myRegularizations.length > 0) ? myRegularizations.map((reg, i) => (
              <div key={reg.id || i} className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Ngày công: {new Date(reg.workDate).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{reg.reason}</p>
                </div>
                <Badge variant="outline" className="text-xs font-normal gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${reg.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {reg.status === 'APPROVED' ? 'Đã duyệt bù công' : 'Chờ duyệt'}
                </Badge>
              </div>
            )) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Chưa có đơn giải trình nào
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Giải Trình Bổ Sung Công */}
      {isRegularizeModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-foreground">Đơn Giải Trình Bổ Sung Giờ Công</h3>
            <p className="text-xs text-muted-foreground">
              Giải trình lý do không thể chấm công đúng giờ để được quản lý duyệt bù công vào hệ thống.
            </p>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Ngày làm việc cần giải trình</label>
              <Input
                type="date"
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Giờ vào thực tế</label>
                <Input
                  type="time"
                  value={regInTime}
                  onChange={(e) => setRegInTime(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Giờ ra thực tế</label>
                <Input
                  type="time"
                  value={regOutTime}
                  onChange={(e) => setRegOutTime(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Lý do giải trình</label>
              <Textarea
                rows={3}
                placeholder="VD: Quên quẹt thẻ do đi gặp khách hàng, lỗi thiết bị chấm công..."
                value={regReason}
                onChange={(e) => setRegReason(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRegularizeModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  regularizeMutation.mutate({
                    userId: user?.id ?? '',
                    employeeName: user?.fullName ?? '',
                    workDate: regDate,
                    requestedCheckIn: regInTime,
                    requestedCheckOut: regOutTime,
                    reason: regReason,
                  });
                }}
                disabled={!regReason}
              >
                Gửi Đơn Giải Trình
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
