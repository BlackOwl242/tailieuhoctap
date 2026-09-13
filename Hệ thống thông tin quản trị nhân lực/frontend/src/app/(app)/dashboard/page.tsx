'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Clock4, Wallet, Briefcase, Target, Plane, GraduationCap,
  ChevronRight, Sparkles, FileSpreadsheet,
  ClipboardCheck, UserCheck, ArrowUpRight, Calculator, Receipt, ShieldCheck
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { LoadingBlock, ErrorState } from '@/components/common/states';
import type { DashboardStats } from '@/lib/types';

export default function FrappeHrmsDeskDashboard() {
  const { data: stats, isLoading, isError, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardStats>('/dashboard/stats')).data,
  });

  const { data: shiftTypes } = useQuery({
    queryKey: ['hrms-shift-types'],
    queryFn: async () => (await api.get('/hrms/shifts/types')).data,
  });

  const { data: payrollRuns } = useQuery({
    queryKey: ['hrms-payroll-runs'],
    queryFn: async () => (await api.get('/hrms/payroll/runs')).data,
  });

  const { data: applicants } = useQuery({
    queryKey: ['hrms-job-applicants'],
    queryFn: async () => (await api.get('/hrms/recruitment/applicants')).data,
  });

  if (isLoading) return <LoadingBlock label="Đang tải dữ liệu tổng quan..." />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const hr = stats?.hr;
  const latestRun = payrollRuns?.[0];
  const pendingTotal = (hr?.pendingLeave ?? 0) + (hr?.pendingOvertime ?? 0) + (hr?.pendingActions ?? 0);

  const workspaceCards = [
    {
      title: 'Nhân sự & Cơ cấu',
      subtitle: 'Employee & Org Structure',
      icon: Users,
      description: 'Sơ đồ tổ chức động, hồ sơ nhân sự, ngạch bậc lương, tài sản và quyết định biến động.',
      links: [
        { label: 'Sơ đồ Tổ chức Động (Interactive Tree)', href: '/org-chart' },
        { label: 'Danh sách Nhân sự Toàn diện', href: '/employees', count: hr?.totalEmployees },
        { label: 'Hồ sơ Nhân sự & Cán bộ', href: '/personnel-profiles' },
        { label: 'Quản trị Tài sản & Thiết bị', href: '/assets' },
        { label: 'Quyết định & Biến động Nhân sự', href: '/personnel' },
        { label: 'Ngạch bậc & Thang bảng lương', href: '/salary-ranks' },
      ],
    },
    {
      title: 'Ca kíp & Chấm công',
      subtitle: 'Shift & Attendance',
      icon: Clock4,
      description: 'Phân ca tuần/tháng, giám sát chuyên cần, tính bù giờ và quản lý hạn mức phép.',
      links: [
        { label: 'Ca làm việc & Ma trận Phân ca', href: '/shifts', count: shiftTypes?.length ?? 4 },
        { label: 'Bảng Chấm công Thực tế', href: '/attendance' },
        { label: 'Quản lý Đơn Nghỉ phép', href: '/leave', count: hr?.pendingLeave },
        { label: 'Đăng ký Làm thêm giờ / Trực ca', href: '/overtime', count: hr?.pendingOvertime },
        { label: 'Điểm danh Kiosk Trực tuyến', href: '/check-in' },
      ],
    },
    {
      title: 'Tiền lương & Chi phí',
      subtitle: 'Payroll & Compensation',
      icon: Calculator,
      description: 'Hệ thống tính lương tự động, thành phần thu nhập, cấu trúc lương và khoản vay phúc lợi.',
      links: [
        { label: 'Tiền lương & Bảng lương Tự động', href: '/payroll-engine' },
        { label: 'Quản trị Khoản Vay & Tạm ứng', href: '/loans' },
        { label: 'Xuất File Chi Lương Ngân Hàng', href: '/payroll-engine' },
        { label: 'Thành phần Lương (Thu nhập & Khấu trừ)', href: '/payroll-engine' },
        { label: 'Phiếu lương & Lịch sử chi trả', href: '/payroll' },
      ],
    },
    {
      title: 'Tuyển dụng ATS',
      subtitle: 'Recruitment & Pipeline',
      icon: Briefcase,
      description: 'Đăng tin tuyển dụng, pipeline Kanban 6 giai đoạn, scorecard và 1-Click Onboard.',
      links: [
        { label: 'Tuyển dụng ATS Kanban', href: '/recruitment-ats' },
        { label: 'Tin Tuyển dụng Đang mở', href: '/recruitment-ats' },
        { label: 'Hồ sơ Ứng viên Tuyển chọn', href: '/recruitment-ats', count: applicants?.length },
        { label: 'Bảng điểm Phỏng vấn (Scorecard)', href: '/recruitment-ats' },
        { label: 'Thư mời Nhận việc (Job Offer)', href: '/recruitment-ats' },
      ],
    },
    {
      title: 'Hiệu suất & 360',
      subtitle: 'Performance & KRA',
      icon: Target,
      description: 'Mục tiêu KRA/KPI theo trọng số %, tự đánh giá, quản lý chấm và phản hồi 360 độ.',
      links: [
        { label: 'Đánh giá 360 Độ Toàn diện', href: '/performance-360' },
        { label: 'Mục tiêu KPI Trọng số (KRA Goals)', href: '/performance-360' },
        { label: 'Phản hồi Đánh giá Đồng nghiệp', href: '/performance-360' },
        { label: 'Chu kỳ Đánh giá Hiệu suất', href: '/performance-360' },
      ],
    },
    {
      title: 'Công tác & Chi phí',
      subtitle: 'Expenses & Travel',
      icon: Receipt,
      description: 'Đề xuất công tác, tạm ứng kinh phí, bảng kê thanh toán chi phí kèm chứng từ.',
      links: [
        { label: 'Bảng kê Quyết toán Chi phí', href: '/expense-claims' },
        { label: 'Đơn Đề xuất Công tác', href: '/expense-claims' },
        { label: 'Tạm ứng Kinh phí Nhân viên', href: '/expense-claims' },
      ],
    },
    {
      title: 'Đào tạo & Khiếu nại',
      subtitle: 'Training & Grievance',
      icon: GraduationCap,
      description: 'Kế hoạch đào tạo nâng cao kỹ năng và kênh tiếp nhận khiếu nại minh bạch.',
      links: [
        { label: 'Chương trình Đào tạo Chuyên môn', href: '/training-grievance' },
        { label: 'Kiến nghị & Khiếu nại Nhân viên', href: '/training-grievance' },
        { label: 'Khảo sát Đánh giá Sau Đào tạo', href: '/training-grievance' },
      ],
    },
    {
      title: 'Báo cáo & Phê duyệt',
      subtitle: 'Reports & Governance',
      icon: FileSpreadsheet,
      description: 'Trung tâm báo cáo thống kê nhân sự, tổng hợp biến động lao động và nhật ký kiểm toán.',
      links: [
        { label: 'Trung tâm Báo cáo & Thống kê', href: '/personnel-reports' },
        { label: 'Quyết định & Biến động nhân sự', href: '/personnel', count: pendingTotal },
        { label: 'Tài liệu & Quy định Nội bộ', href: '/documents' },
        { label: 'Cơ cấu Tổ chức & Phòng ban', href: '/admin/org-units' },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <WorkspaceHeader
        title="Bàn làm việc Quản trị Nhân sự"
        description="Không gian điều hành quản trị nhân lực tích hợp toàn diện: Tuyển dụng ATS, Ca kíp, Chấm công, Tiền lương, Hiệu suất 360, Công tác phí và Đào tạo."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/ess"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors shadow-2xs"
            >
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Cổng Tự Phục Vụ (ESS)
            </Link>
            <Link
              href="/payroll-engine"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Calculator className="h-3.5 w-3.5" />
              Tính Lương Chu Kỳ
            </Link>
          </div>
        }
      />

      {/* 4 Number Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NumberCard
          title="Tổng Nhân sự"
          value={hr ? String(hr.totalEmployees) : '—'}
          subtitle="100% hồ sơ đã định danh"
          icon={Users}
        />
        <NumberCard
          title="Có mặt hôm nay"
          value={hr ? String(hr.presentToday) : '—'}
          subtitle={hr && hr.onLeaveToday > 0 ? `${hr.onLeaveToday} người nghỉ phép` : 'Tất cả đúng giờ'}
          icon={ShieldCheck}
          trend={hr ? { value: `${hr.totalEmployees > 0 ? ((hr.presentToday / hr.totalEmployees) * 100).toFixed(1) : 0}%`, isPositive: true, label: 'chuyên cần' } : undefined}
        />
        <NumberCard
          title="Quỹ lương chu kỳ"
          value={latestRun ? `${(latestRun.totalNetPay / 1_000_000).toFixed(1)} Tr` : '—'}
          subtitle="Bảng lương chu kỳ gần nhất"
          icon={Wallet}
        />
        <NumberCard
          title="Đơn từ chờ duyệt"
          value={String(pendingTotal)}
          subtitle={`${hr?.pendingLeave ?? 0} phép · ${hr?.pendingOvertime ?? 0} OT · ${hr?.pendingActions ?? 0} quyết định`}
          icon={ClipboardCheck}
          trend={pendingTotal > 0 ? { value: `${pendingTotal} đơn`, isPositive: false } : undefined}
        />
      </div>

      {/* Lối tắt nhanh */}
      <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border/40">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Lối tắt Thao tác Nhanh
          </span>
          <span className="text-[11px] text-muted-foreground/70">Truy cập tức thì</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Phân Ca Tuần', href: '/shifts', icon: Clock4 },
            { label: 'Tính Lương', href: '/payroll-engine', icon: Calculator },
            { label: 'Tuyển Dụng ATS', href: '/recruitment-ats', icon: Briefcase },
            { label: 'Đánh Giá 360', href: '/performance-360', icon: Target },
            { label: 'Công Tác Phí', href: '/expense-claims', icon: Receipt },
            { label: 'Báo Cáo 2C', href: '/personnel-reports', icon: FileSpreadsheet },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Link
                key={i}
                href={s.href}
                className="group flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/60 hover:border-border transition-all text-xs font-medium text-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="truncate">{s.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 8 Bento Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">
              Phân Hệ Quản Trị Nghiệp Vụ
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {workspaceCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 transition-all duration-150 ease-out hover:border-border hover:shadow-xs space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-border/40">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-xs leading-tight">{card.title}</h3>
                      <p className="text-[10px] text-muted-foreground/70 font-mono leading-tight">{card.subtitle}</p>
                    </div>
                  </div>

                  {/* DocType Links List */}
                  <div className="mt-2.5 space-y-0.5">
                    {card.links.map((link, lIdx) => (
                      <Link
                        key={lIdx}
                        href={link.href}
                        className="group flex items-center justify-between rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/40 group-hover:bg-foreground transition-colors" />
                          <span className="truncate group-hover:font-medium">{link.label}</span>
                        </span>

                        <div className="flex items-center gap-1 shrink-0 ml-1.5">
                          {link.count !== undefined && link.count > 0 && (
                            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                              {link.count}
                            </span>
                          )}
                          <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="text-[10px]">{card.links.length} chứng từ</span>
                  <Link
                    href={card.links[0].href}
                    className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-0.5 transition-colors"
                  >
                    Mở <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
