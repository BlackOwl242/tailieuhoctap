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
        <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chấm Công Hôm Nay</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Trực tuyến
            </span>
          </div>

          <div className="text-center py-2 space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono">
              {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Trụ sở chính · Chấm công qua hệ thống
            </p>
          </div>

          <button
            onClick={handleCheckIn}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
              isCheckedIn
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isCheckedIn ? (
              <>
                <LogOut className="h-4 w-4" />
                Check-Out Ra Về (Đã vào lúc {checkInTime})
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                1-Chạm Check-In Vào Ca
              </>
            )}
          </button>
        </div>

        {/* Leave Balance & Seniority Breakdown */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="font-bold text-foreground text-sm">Hạn Mức Phép Năm {new Date().getFullYear()}</h3>
              <p className="text-[11px] text-muted-foreground">Tuân thủ Điều 113, 114 Bộ luật Lao động 2019</p>
            </div>
            <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10">
              12 ngày cơ bản + 1 ngày thâm niên
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/20 p-3 rounded-xl">
              <span className="text-[11px] text-muted-foreground">Tổng ngày phép</span>
              <p className="text-xl font-bold text-foreground mt-0.5 font-mono">{myLeaveBalance?.total?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-xl">
              <span className="text-[11px] text-muted-foreground">Đã sử dụng</span>
              <p className="text-xl font-bold text-amber-700 mt-0.5 font-mono">{myLeaveBalance?.used?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-xl">
              <span className="text-[11px] text-muted-foreground">Còn lại khả dụng</span>
              <p className="text-xl font-bold text-emerald-700 mt-0.5 font-mono">{myLeaveBalance?.remaining?.toFixed(1) ?? '—'}</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/leave"
            className="flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs text-foreground">Xin Nghỉ Phép</span>
          </Link>

          <button
            onClick={() => setIsRegularizeModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs text-foreground">Giải Trình Chấm Công</span>
          </button>

          <Link
            href="/loans"
            className="flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs text-foreground">Vay Vốn Phúc Lợi</span>
          </Link>

          <Link
            href="/org-chart"
            className="flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center space-y-2 group"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs text-foreground">Sơ Đồ Đồng Nghiệp</span>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: My Assets & My Loans / Regularization History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Assets */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Laptop className="h-4 w-4 text-primary" />
              Tài Sản & Thiết Bị Được Cấp Phát
            </h3>
            <Link href="/assets" className="text-xs text-primary font-semibold hover:underline">
              Chi tiết
            </Link>
          </div>

          <div className="space-y-2">
            {(myAssets && myAssets.length > 0) ? myAssets.map((a, i) => (
              <div key={a.id || i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <p className="text-xs font-bold text-foreground">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Mã: {a.assetCode} · Loại: {a.category}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  Đang dùng
                </span>
              </div>
            )) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Chưa có tài sản nào được cấp phát
              </div>
            )}
          </div>
        </div>

        {/* My Regularization History */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Lịch Sử Giải Trình Chấm Công Gần Đây
            </h3>
            <button onClick={() => setIsRegularizeModalOpen(true)} className="text-xs text-primary font-semibold hover:underline">
              Gửi đơn mới
            </button>
          </div>

          <div className="space-y-2">
            {(myRegularizations && myRegularizations.length > 0) ? myRegularizations.map((reg, i) => (
              <div key={reg.id || i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Ngày công: {new Date(reg.workDate).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{reg.reason}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    reg.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {reg.status === 'APPROVED' ? 'Đã duyệt bù công' : 'Chờ duyệt'}
                </span>
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
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Đơn Giải Trình Bổ Sung Giờ Công</h3>
            <p className="text-xs text-muted-foreground">
              Giải trình lý do không thể chấm công đúng giờ để được quản lý duyệt bù công vào hệ thống.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Ngày làm việc cần giải trình</label>
              <input
                type="date"
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-semibold text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Giờ vào thực tế</label>
                <input
                  type="time"
                  value={regInTime}
                  onChange={(e) => setRegInTime(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-mono text-foreground outline-hidden focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Giờ ra thực tế</label>
                <input
                  type="time"
                  value={regOutTime}
                  onChange={(e) => setRegOutTime(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-mono text-foreground outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Lý do giải trình</label>
              <textarea
                rows={3}
                placeholder="VD: Quên quẹt thẻ do đi gặp khách hàng, lỗi thiết bị kiosk..."
                value={regReason}
                onChange={(e) => setRegReason(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRegularizeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
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
                className="px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Gửi Đơn Giải Trình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
