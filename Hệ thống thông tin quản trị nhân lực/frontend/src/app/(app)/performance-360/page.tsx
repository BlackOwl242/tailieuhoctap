'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target, Award, MessageSquare, Star, Plus, CheckCircle2,
  Calendar, Layers, Sparkles, TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';

interface AppraisalCycle {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
  _count?: { goals: number; reviews: number };
}

interface AppraisalGoal {
  id: string;
  cycleId: string;
  userId: string;
  employeeName: string;
  kraTitle: string;
  description: string;
  weightage: number;
  targetMetric: string;
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  status: string;
}

interface AppraisalReview {
  id: string;
  cycleId: string;
  userId: string;
  reviewerName: string;
  relationship: string;
  rating: number;
  feedback: string;
  submittedAt: string;
}

export default function Performance360Page() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews' | 'cycles'>('goals');
  const [selectedGoal, setSelectedGoal] = useState<AppraisalGoal | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Form chấm điểm
  const [selfScore, setSelfScore] = useState(90);
  const [managerScore, setManagerScore] = useState(95);

  // Form tạo goal
  const [employeeName, setEmployeeName] = useState('');
  const [kraTitle, setKraTitle] = useState('');
  const [targetMetric, setTargetMetric] = useState('');
  const [weightage, setWeightage] = useState(25);
  const [description, setDescription] = useState('');

  const { data: cycles, isLoading: isLoadingCycles } = useQuery<AppraisalCycle[]>({
    queryKey: ['hrms-performance-cycles'],
    queryFn: async () => (await api.get('/hrms/performance/cycles')).data,
  });

  const { data: goals, isLoading: isLoadingGoals } = useQuery<AppraisalGoal[]>({
    queryKey: ['hrms-performance-goals'],
    queryFn: async () => (await api.get('/hrms/performance/goals')).data,
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery<AppraisalReview[]>({
    queryKey: ['hrms-performance-reviews'],
    queryFn: async () => (await api.get('/hrms/performance/reviews')).data,
  });

  const scoreGoalMutation = useMutation({
    mutationFn: async ({ id, selfScore, managerScore }: { id: string; selfScore: number; managerScore: number }) => {
      return (await api.patch(`/hrms/performance/goals/${id}/score`, { selfScore, managerScore })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      setIsScoreModalOpen(false);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (payload: { employeeName: string; kraTitle: string; targetMetric: string; weightage: number; description: string }) => {
      const cycleId = cycles?.[0]?.id ?? 'default-cycle';
      return (await api.post('/hrms/performance/goals', {
        cycleId,
        userId: 'temp-user',
        ...payload,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      setIsGoalModalOpen(false);
      setEmployeeName('');
      setKraTitle('');
    },
  });

  if (isLoadingCycles || isLoadingGoals || isLoadingReviews) {
    return <LoadingState text="Đang tải dữ liệu Đánh giá Hiệu suất 360..." />;
  }

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản trị Hiệu suất & Đánh giá 360 Độ"
        description="Thiết lập mục tiêu KRA/KPI theo trọng số phần trăm, quy trình tự đánh giá và quản lý chấm điểm minh bạch, kết hợp phản hồi 360 độ đa chiều."
        breadcrumbs={[{ label: 'Hiệu suất' }, { label: 'Đánh giá 360' }]}
        actions={
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Thiết Lập Mục Tiêu KRA
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Kỳ Đánh Giá Hiện Tại"
          value={cycles?.[0]?.name ?? '2026'}
          subtitle="Đang trong kỳ đánh giá"
          icon={Calendar}
          colorScheme="blue"
        />
        <NumberCard
          title="Mục Tiêu KRA/KPI"
          value={goals?.length ?? 0}
          subtitle="Đã gán cho nhân sự"
          icon={Target}
          colorScheme="purple"
        />
        <NumberCard
          title="Phản Hồi 360 Độ"
          value={reviews?.length ?? 0}
          subtitle="Từ đồng nghiệp & cấp quản lý"
          icon={MessageSquare}
          colorScheme="emerald"
        />
        <NumberCard
          title="Điểm Đánh Giá TB"
          value={`${avgRating} / 5.0`}
          subtitle="Xuất sắc toàn diện"
          icon={Star}
          colorScheme="amber"
          trend={{ value: '+0.3', isPositive: true, label: 'kỳ trước' }}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'goals'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="h-4 w-4" />
          Mục Tiêu KRA/KPI Theo Trọng Số ({goals?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Phản Hồi Đánh Giá 360 Độ ({reviews?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'cycles'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Chu Kỳ Đánh Giá ({cycles?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: KRA Goals */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals?.map((g) => (
            <div key={g.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{g.kraTitle}</h3>
                  <p className="text-xs text-primary font-semibold mt-0.5">{g.employeeName}</p>
                </div>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                  Trọng số: {g.weightage}%
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>

              <div className="bg-muted/20 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-muted-foreground text-[11px]">Chỉ số đo lường mục tiêu:</span>
                <p className="font-bold text-foreground">{g.targetMetric}</p>
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <div className="space-x-2">
                  <span>Tự chấm: <b>{g.selfScore ?? '-'}/100</b></span>
                  <span>•</span>
                  <span>Quản lý: <b className="text-emerald-700 font-bold">{g.managerScore ?? '-'}/100</b></span>
                </div>
                <button
                  onClick={() => {
                    setSelectedGoal(g);
                    setSelfScore(g.selfScore ?? 90);
                    setManagerScore(g.managerScore ?? 95);
                    setIsScoreModalOpen(true);
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Chấm Điểm →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: 360 Reviews */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews?.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-sm">{r.reviewerName}</h4>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    Quan hệ: {r.relationship}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-xs">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                  <span>{r.rating} / 5.0</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic leading-relaxed">&ldquo;{r.feedback}&rdquo;</p>

              <div className="pt-2 border-t text-[11px] text-muted-foreground">
                Gửi lúc: {new Date(r.submittedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Appraisal Cycles */}
      {activeTab === 'cycles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cycles?.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm">{c.name}</h3>
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {c.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Năm đánh giá: <b>{c.year}</b> • Từ {new Date(c.startDate).toLocaleDateString('vi-VN')} đến {new Date(c.endDate).toLocaleDateString('vi-VN')}
              </div>
              <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span>Mục tiêu KRA: <b>{c._count?.goals ?? 0}</b></span>
                <span>Phản hồi 360: <b>{c._count?.reviews ?? 0}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Chấm Điểm Mục Tiêu */}
      {isScoreModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Chấm Điểm Mục Tiêu KRA/KPI</h2>
            <p className="text-xs text-muted-foreground">
              Mục tiêu: <b>{selectedGoal.kraTitle}</b> — Nhân viên: <b>{selectedGoal.employeeName}</b>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Điểm Nhân viên Tự Chấm (Thang 100)</label>
                <input
                  type="number"
                  value={selfScore}
                  onChange={(e) => setSelfScore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Điểm Quản lý Trực tiếp Đánh Giá (Thang 100)</label>
                <input
                  type="number"
                  value={managerScore}
                  onChange={(e) => setManagerScore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden font-bold text-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={scoreGoalMutation.isPending}
                onClick={() => scoreGoalMutation.mutate({ id: selectedGoal.id, selfScore, managerScore })}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {scoreGoalMutation.isPending ? 'Đang lưu...' : 'Lưu Điểm Đánh Giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Goal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Thiết Lập Mục Tiêu KRA/KPI Mới</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Tên nhân viên áp dụng</label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn An..."
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Tiêu đề KRA / Mục tiêu trọng yếu</label>
                <input
                  type="text"
                  placeholder="VD: Tối ưu hiệu năng kiến trúc & đạt SLA 99.9%..."
                  value={kraTitle}
                  onChange={(e) => setKraTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Trọng số (%)</label>
                  <input
                    type="number"
                    value={weightage}
                    onChange={(e) => setWeightage(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Chỉ số đo lường (Target Metric)</label>
                  <input
                    type="text"
                    placeholder="VD: SLA 99.9%, Độ bao phủ 90%..."
                    value={targetMetric}
                    onChange={(e) => setTargetMetric(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-foreground">Mô tả hành động cụ thể</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chi tiết kế hoạch triển khai..."
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={!employeeName || !kraTitle || createGoalMutation.isPending}
                onClick={() => createGoalMutation.mutate({ employeeName, kraTitle, targetMetric, weightage, description })}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createGoalMutation.isPending ? 'Đang lưu...' : 'Lưu Mục Tiêu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
