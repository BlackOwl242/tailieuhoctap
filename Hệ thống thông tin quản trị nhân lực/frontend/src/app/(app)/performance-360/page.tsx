'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target, Award, MessageSquare, Star, Plus, CheckCircle2,
  Calendar, Layers, Sparkles, TrendingUp, Trash2, X, RefreshCw,
  Filter, User, Building2, Check, Award as Medal, ShieldAlert,
  ArrowRight, CheckCheck, FileSpreadsheet
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, Badge, Input, Select } from '@/components/ui/primitives';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/components/ui/toaster';

interface AppraisalCycle {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
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
  cycle?: AppraisalCycle;
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
  cycle?: AppraisalCycle;
}

interface EmployeeItem {
  id: string;
  fullName: string;
  employeeCode: string;
  jobTitle?: string;
  orgUnit?: { name: string };
}

export default function Performance360Page() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'goals' | 'reviews' | 'cycles'>('goals');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('ALL');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('ALL');

  // Modals
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Active items for modals
  const [selectedGoal, setSelectedGoal] = useState<AppraisalGoal | null>(null);

  // Form Cycle
  const [cycleForm, setCycleForm] = useState({
    name: 'Kỳ Đánh giá Hiệu suất & Năng lực 2026',
    year: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    description: 'Chu kỳ đánh giá năng lực, KRA/KPI và phản hồi 360 độ toàn diện toàn cơ quan/doanh nghiệp.',
  });

  // Form Goal
  const [goalForm, setGoalForm] = useState({
    cycleId: '',
    userId: '',
    employeeName: '',
    kraTitle: '',
    targetMetric: '',
    weightage: 25,
    description: '',
  });

  // Form Score
  const [selfScore, setSelfScore] = useState(90);
  const [managerScore, setManagerScore] = useState(95);

  // Form Review 360
  const [reviewForm, setReviewForm] = useState({
    cycleId: '',
    userId: '',
    reviewerName: 'Trần Minh Quang (Trưởng ban)',
    relationship: 'MANAGER',
    rating: 5,
    feedback: 'Tác phong làm việc chuyên nghiệp, có tinh thần trách nhiệm và hoàn thành tốt chỉ tiêu.',
  });

  // Form Sync Appraisal
  const [syncForm, setSyncForm] = useState({
    userId: '',
    year: 2026,
    classification: 'EXCELLENT' as 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY',
    comment: 'Hoàn thành xuất sắc nhiệm vụ theo kỳ đánh giá hiệu suất 360 độ',
    decisionNo: 'QĐ-ĐGCB/2026',
  });

  // Queries
  const { data: cycles = [], isLoading: isLoadingCycles } = useQuery<AppraisalCycle[]>({
    queryKey: ['hrms-performance-cycles'],
    queryFn: async () => (await api.get('/hrms/performance/cycles')).data,
  });

  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<AppraisalGoal[]>({
    queryKey: ['hrms-performance-goals', selectedCycleFilter, selectedEmpFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCycleFilter !== 'ALL') params.cycleId = selectedCycleFilter;
      if (selectedEmpFilter !== 'ALL') params.userId = selectedEmpFilter;
      return (await api.get('/hrms/performance/goals', { params })).data;
    },
  });

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<AppraisalReview[]>({
    queryKey: ['hrms-performance-reviews', selectedCycleFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCycleFilter !== 'ALL') params.cycleId = selectedCycleFilter;
      return (await api.get('/hrms/performance/reviews', { params })).data;
    },
  });

  const { data: employees = [] } = useQuery<EmployeeItem[]>({
    queryKey: ['employees-simple-list'],
    queryFn: async () => (await api.get('/employees')).data,
  });

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: async (payload: typeof cycleForm) => {
      return (await api.post('/hrms/performance/cycles', {
        name: payload.name,
        year: Number(payload.year),
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
        description: payload.description,
      })).data;
    },
    onSuccess: () => {
      toast('Đã khởi tạo kỳ đánh giá thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
      setIsCycleModalOpen(false);
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const toggleCycleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      return (await api.patch(`/hrms/performance/cycles/${id}`, { status: newStatus })).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật trạng thái chu kỳ đánh giá!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const deleteCycleMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/performance/cycles/${id}`)).data;
    },
    onSuccess: () => {
      toast('Đã xóa kỳ đánh giá!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-reviews'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const cycleId = goalForm.cycleId || cycles[0]?.id;
      if (!cycleId) throw new Error('Vui lòng chọn hoặc khởi tạo một kỳ đánh giá trước');
      if (!goalForm.userId) throw new Error('Vui lòng chọn nhân sự thực hiện');
      return (await api.post('/hrms/performance/goals', {
        cycleId,
        userId: goalForm.userId,
        employeeName: goalForm.employeeName,
        kraTitle: goalForm.kraTitle,
        targetMetric: goalForm.targetMetric,
        weightage: Number(goalForm.weightage) || 20,
        description: goalForm.description,
      })).data;
    },
    onSuccess: () => {
      toast('Đã thiết lập mục tiêu KRA thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      setIsGoalModalOpen(false);
      setGoalForm({
        cycleId: '',
        userId: '',
        employeeName: '',
        kraTitle: '',
        targetMetric: '',
        weightage: 25,
        description: '',
      });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const scoreGoalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGoal) return;
      return (await api.patch(`/hrms/performance/goals/${selectedGoal.id}/score`, {
        selfScore: Number(selfScore),
        managerScore: Number(managerScore),
      })).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật điểm đánh giá KRA!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      setIsScoreModalOpen(false);
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/performance/goals/${id}`)).data;
    },
    onSuccess: () => {
      toast('Đã xóa mục tiêu KRA!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const cycleId = reviewForm.cycleId || cycles[0]?.id;
      if (!cycleId) throw new Error('Vui lòng chọn kỳ đánh giá');
      if (!reviewForm.userId) throw new Error('Vui lòng chọn nhân sự được đánh giá');
      return (await api.post('/hrms/performance/reviews', {
        cycleId,
        userId: reviewForm.userId,
        reviewerName: reviewForm.reviewerName,
        relationship: reviewForm.relationship,
        rating: Number(reviewForm.rating),
        feedback: reviewForm.feedback,
      })).data;
    },
    onSuccess: () => {
      toast('Đã gửi đánh giá 360 độ thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-reviews'] });
      setIsReviewModalOpen(false);
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/performance/reviews/${id}`)).data;
    },
    onSuccess: () => {
      toast('Đã xóa đánh giá 360!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-reviews'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const syncAppraisalMutation = useMutation({
    mutationFn: async () => {
      if (!syncForm.userId) throw new Error('Vui lòng chọn nhân sự cần đồng bộ');
      return (await api.post('/hrms/performance/sync-appraisal', syncForm)).data;
    },
    onSuccess: () => {
      toast('Đã đồng bộ kết quả vào Hồ sơ Cán bộ (mục QT ĐGCB)!', 'success');
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      setIsSyncModalOpen(false);
    },
    onError: (err) => toast('Lỗi đồng bộ: ' + errorMessage(err), 'error'),
  });

  if (isLoadingCycles || isLoadingGoals || isLoadingReviews) {
    return <LoadingState text="Đang tải dữ liệu Đánh giá Hiệu suất 360..." />;
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Đánh giá KPI"
        description="Thiết lập mục tiêu KPI theo trọng số, quy trình tự đánh giá và phản hồi đa chiều."
        breadcrumbs={[{ label: 'Phát triển' }, { label: 'Đánh giá KPI' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCycleModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors shadow-2xs"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Khởi tạo chu kỳ
            </button>
            <button
              onClick={() => {
                if (cycles.length === 0) {
                  toast('Vui lòng tạo ít nhất 1 chu kỳ đánh giá trước!', 'error');
                  setIsCycleModalOpen(true);
                  return;
                }
                setIsReviewModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors shadow-2xs"
            >
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              Gửi phản hồi 360
            </button>
            <button
              onClick={() => {
                if (cycles.length === 0) {
                  toast('Vui lòng tạo ít nhất 1 chu kỳ đánh giá trước!', 'error');
                  setIsCycleModalOpen(true);
                  return;
                }
                setIsGoalModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Thiết lập mục tiêu KRA
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Kỳ Đánh Giá Hiện Tại"
          value={activeCycle?.name ?? 'Chưa có kỳ'}
          subtitle={activeCycle?.status === 'ACTIVE' ? 'Đang trong kỳ đánh giá' : 'Đã đóng kỳ'}
          icon={Calendar}
          colorScheme="blue"
        />
        <NumberCard
          title="Mục Tiêu KRA/KPI"
          value={goals.length}
          subtitle={`Đã giao cho nhân sự (${goals.filter(g => g.managerScore != null).length} đã chấm)`}
          icon={Target}
          colorScheme="purple"
        />
        <NumberCard
          title="Phản Hồi 360 Độ"
          value={reviews.length}
          subtitle="Từ cấp trên, đồng nghiệp & cấp dưới"
          icon={MessageSquare}
          colorScheme="emerald"
        />
        <NumberCard
          title="Điểm Đánh Giá TB"
          value={`${avgRating} / 5.0`}
          subtitle="Mức đánh giá tích lũy"
          icon={Star}
          colorScheme="amber"
          trend={{ value: '+0.2', isPositive: true, label: 'chu kỳ này' }}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/60 gap-4">
        <div className="flex border-b border-border/60 -mb-px space-x-1">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'goals'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="h-4 w-4" />
            Mục Tiêu KRA/KPI Theo Trọng Số ({goals.length})
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
            Phản Hồi Đánh Giá 360 Độ ({reviews.length})
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
            Chu Kỳ Đánh Giá ({cycles.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select
            value={selectedCycleFilter}
            onChange={(e) => setSelectedCycleFilter(e.target.value)}
            className="w-[180px] text-xs font-medium"
          >
            <option value="ALL">Tất cả chu kỳ</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </Select>
        </div>
      </div>

      {/* TAB 1: KRA GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card space-y-3">
              <Target className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-bold text-foreground">Chưa có mục tiêu KRA/KPI nào trong chu kỳ này</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Bấm nút &quot;Thiết Lập Mục Tiêu KRA&quot; để giao chỉ tiêu cụ thể, trọng số phần trăm và phương pháp đo lường cho cán bộ nhân viên.
              </p>
              <Button size="sm" onClick={() => setIsGoalModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Thiết Lập Mục Tiêu KRA Đầu Tiên
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((g) => (
                <div key={g.id} className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        {g.kraTitle}
                      </h3>
                      <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {g.employeeName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-border bg-muted/40 text-foreground">
                        Trọng số: {g.weightage}%
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Xóa mục tiêu KRA "${g.kraTitle}"?`)) {
                            deleteGoalMutation.mutate(g.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors opacity-80 hover:opacity-100"
                        title="Xóa mục tiêu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{g.description || 'Không có mô tả chi tiết'}</p>

                  <div className="bg-muted/20 p-2.5 rounded-lg text-xs space-y-1 border border-border/40">
                    <span className="text-muted-foreground text-xs font-medium">Chỉ số đo lường mục tiêu (Target Metric):</span>
                    <p className="font-bold text-foreground">{g.targetMetric || 'Chưa thiết lập'}</p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <div className="space-x-2">
                      <span>Tự chấm: <b>{g.selfScore != null ? `${g.selfScore}/100` : '—'}</b></span>
                      <span>•</span>
                      <span>Quản lý: <b className="text-emerald-700 font-bold">{g.managerScore != null ? `${g.managerScore}/100` : '—'}</b></span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGoal(g);
                        setSelfScore(g.selfScore ?? 90);
                        setManagerScore(g.managerScore ?? 95);
                        setIsScoreModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      <span>Chấm Điểm</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 360 REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card space-y-3">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-bold text-foreground">Chưa có phản hồi đánh giá 360 độ nào</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Bấm &quot;Gửi Phản Hồi 360&quot; để cấp trên, đồng nghiệp hoặc cấp dưới gửi nhận xét khách quan kèm xếp hạng sao.
              </p>
              <Button size="sm" onClick={() => setIsReviewModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Gửi Đánh Giá 360 Độ
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => {
                const relationMap: Record<string, { label: string; dot: string }> = {
                  MANAGER: { label: 'Cấp Quản lý', dot: 'bg-blue-600' },
                  PEER: { label: 'Đồng nghiệp', dot: 'bg-emerald-600' },
                  SUBORDINATE: { label: 'Cấp dưới', dot: 'bg-purple-600' },
                  SELF: { label: 'Tự đánh giá', dot: 'bg-amber-600' },
                };
                const rel = relationMap[r.relationship] || { label: r.relationship, dot: 'bg-muted-foreground' };

                return (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                          {r.reviewerName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${rel.dot}`} />
                            {rel.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={r.rating} readOnly size="sm" showLabel={false} />
                        <button
                          onClick={() => {
                            if (confirm('Xóa phản hồi 360 này?')) {
                              deleteReviewMutation.mutate(r.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-muted/15 p-3 rounded-lg border border-border/40">
                      <p className="text-xs text-muted-foreground italic leading-relaxed">&ldquo;{r.feedback}&rdquo;</p>
                    </div>

                    <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center">
                      <span>Thời điểm gửi: {new Date(r.submittedAt).toLocaleDateString('vi-VN')}</span>
                      <span className="font-semibold text-primary font-mono">{r.rating} / 5.0</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPRAISAL CYCLES */}
      {activeTab === 'cycles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Danh sách các Chu kỳ Đánh giá Hiệu suất Toàn diện
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsSyncModalOpen(true)}>
                <Medal className="w-4 h-4 mr-1.5 text-amber-500" />
                Đồng Bộ Kết Quả Vào Hồ Sơ Cán Bộ (QT ĐGCB)
              </Button>
              <Button size="sm" onClick={() => setIsCycleModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo chu kỳ mới
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cycles.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{c.name}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                      Năm đánh giá: <b className="text-foreground">{c.year}</b> • Từ {new Date(c.startDate).toLocaleDateString('vi-VN')} đến {new Date(c.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-normal text-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-muted-foreground'}`} />
                    {c.status === 'ACTIVE' ? 'Đang Mở (ACTIVE)' : 'Đã Đóng (CLOSED)'}
                  </span>
                </div>

                {c.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-lg text-xs">
                  <div>Mục tiêu KRA: <b className="text-primary font-bold">{c._count?.goals ?? 0}</b></div>
                  <div>Phản hồi 360: <b className="text-emerald-700 font-bold">{c._count?.reviews ?? 0}</b></div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newStatus = c.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
                        toggleCycleStatusMutation.mutate({ id: c.id, newStatus });
                      }}
                      className="font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {c.status === 'ACTIVE' ? 'Đóng chu kỳ' : 'Kích hoạt lại'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Xác nhận xóa chu kỳ "${c.name}" cùng toàn bộ mục tiêu và phản hồi liên quan?`)) {
                        deleteCycleMutation.mutate(c.id);
                      }
                    }}
                    className="text-destructive font-semibold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa chu kỳ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: KHỞI TẠO CHU KỲ MỚI */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Khởi Tạo Chu Kỳ Đánh Giá Mới
              </h3>
              <button onClick={() => setIsCycleModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Tên kỳ đánh giá:</label>
                <Input
                  value={cycleForm.name}
                  onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                  placeholder="VD: Kỳ Đánh giá Hiệu suất 2026..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-medium text-foreground block mb-1">Năm:</label>
                  <Input
                    type="number"
                    value={cycleForm.year}
                    onChange={(e) => setCycleForm({ ...cycleForm, year: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Từ ngày:</label>
                  <Input
                    type="date"
                    value={cycleForm.startDate}
                    onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Đến ngày:</label>
                  <Input
                    type="date"
                    value={cycleForm.endDate}
                    onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Mô tả hướng dẫn:</label>
                <textarea
                  value={cycleForm.description}
                  onChange={(e) => setCycleForm({ ...cycleForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  placeholder="Tiêu chí đánh giá, đối tượng tham gia..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsCycleModalOpen(false)}>Hủy</Button>
              <Button size="sm" onClick={() => createCycleMutation.mutate(cycleForm)} disabled={createCycleMutation.isPending}>
                {createCycleMutation.isPending ? 'Đang tạo...' : 'Khởi Tạo Chu Kỳ'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THIẾT LẬP MỤC TIÊU KRA */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Thiết Lập Mục Tiêu KRA/KPI Mới
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-foreground block mb-1">Chu kỳ đánh giá:</label>
                  <Select
                    value={goalForm.cycleId || cycles[0]?.id}
                    onChange={(e) => setGoalForm({ ...goalForm, cycleId: e.target.value })}
                    className="w-full text-xs"
                  >
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Trọng số (%):</label>
                  <Input
                    type="number"
                    min="5"
                    max="100"
                    value={goalForm.weightage}
                    onChange={(e) => setGoalForm({ ...goalForm, weightage: Number(e.target.value) })}
                    placeholder="VD: 25"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Chọn Nhân sự thực hiện (Cơ sở dữ liệu):</label>
                <Select
                  value={goalForm.userId}
                  onChange={(e) => {
                    const found = employees.find((emp) => emp.id === e.target.value);
                    setGoalForm({
                      ...goalForm,
                      userId: e.target.value,
                      employeeName: found ? found.fullName : '',
                    });
                  }}
                  searchable
                  searchPlaceholder="Tìm mã NV, họ tên cán bộ, chức danh..."
                  className="text-xs"
                >
                  <option value="">-- Chọn nhân sự từ hệ thống --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} {emp.jobTitle ? `- ${emp.jobTitle}` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Tiêu đề KRA / Chỉ tiêu nhiệm vụ:</label>
                <Input
                  value={goalForm.kraTitle}
                  onChange={(e) => setGoalForm({ ...goalForm, kraTitle: e.target.value })}
                  placeholder="VD: Tối ưu hóa hiệu năng hệ thống & Triển khai Module mới..."
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Chỉ số đo lường mục tiêu (Target Metric):</label>
                <Input
                  value={goalForm.targetMetric}
                  onChange={(e) => setGoalForm({ ...goalForm, targetMetric: e.target.value })}
                  placeholder="VD: Đạt SLA 99.9%, hoàn thành 100% tài liệu kiến trúc..."
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Mô tả chi tiết nhiệm vụ:</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground"
                  placeholder="Kế hoạch hành động, mốc thời gian hoàn thành cụ thể..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsGoalModalOpen(false)}>Hủy</Button>
              <Button size="sm" onClick={() => createGoalMutation.mutate()} disabled={createGoalMutation.isPending}>
                {createGoalMutation.isPending ? 'Đang lưu...' : 'Giao Mục Tiêu KRA'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CHẤM ĐIỂM KRA */}
      {isScoreModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Chấm Điểm Mục Tiêu KRA
              </h3>
              <button onClick={() => setIsScoreModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="font-bold text-foreground text-sm">{selectedGoal.kraTitle}</div>
                <div className="text-muted-foreground mt-0.5">Nhân sự: <b>{selectedGoal.employeeName}</b></div>
                <div className="text-xs text-primary font-bold mt-1">Trọng số: {selectedGoal.weightage}%</div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Điểm nhân sự tự chấm (Thang 100):</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={selfScore}
                  onChange={(e) => setSelfScore(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Điểm cấp quản lý đánh giá (Thang 100):</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={managerScore}
                  onChange={(e) => setManagerScore(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsScoreModalOpen(false)}>Hủy</Button>
              <Button size="sm" onClick={() => scoreGoalMutation.mutate()} disabled={scoreGoalMutation.isPending}>
                {scoreGoalMutation.isPending ? 'Đang lưu...' : 'Lưu Điểm Đánh Giá'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: GỬI PHẢN HỒI ĐÁNH GIÁ 360 */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Gửi Phản Hồi Đánh Giá 360 Độ
              </h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Kỳ đánh giá:</label>
                <Select
                  value={reviewForm.cycleId || cycles[0]?.id}
                  onChange={(e) => setReviewForm({ ...reviewForm, cycleId: e.target.value })}
                  className="w-full text-xs"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Nhân sự được đánh giá:</label>
                <Select
                  value={reviewForm.userId}
                  onChange={(e) => setReviewForm({ ...reviewForm, userId: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="">-- Chọn nhân sự từ hệ thống --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} [{emp.employeeCode}]
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-foreground block mb-1">Người đánh giá:</label>
                  <Input
                    value={reviewForm.reviewerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Mối quan hệ:</label>
                  <Select
                    value={reviewForm.relationship}
                    onChange={(e) => setReviewForm({ ...reviewForm, relationship: e.target.value })}
                    className="w-full text-xs"
                  >
                    <option value="MANAGER">Cấp Quản lý</option>
                    <option value="PEER">Đồng nghiệp</option>
                    <option value="SUBORDINATE">Cấp dưới</option>
                    <option value="SELF">Tự đánh giá</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Đánh giá sao (1 - 5 sao):</label>
                <div className="p-2 border rounded-lg bg-card flex items-center justify-between">
                  <StarRating
                    value={reviewForm.rating}
                    onChange={(val) => setReviewForm({ ...reviewForm, rating: val })}
                    size="md"
                    showLabel
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Ý kiến phản hồi & Nhận xét:</label>
                <textarea
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground"
                  placeholder="Góp ý cụ thể về năng lực, thái độ, tinh thần cộng tác..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>Hủy</Button>
              <Button size="sm" onClick={() => createReviewMutation.mutate()} disabled={createReviewMutation.isPending}>
                {createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi Đánh Giá'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ĐỒNG BỘ KẾT QUẢ VÀO HỒ SƠ CÁN BỘ (QT ĐGCB) */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-500" />
                Đồng Bộ Kết Quả Vào Hồ Sơ Cán Bộ (Mục 6. QT ĐGCB)
              </h3>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Chọn Nhân sự cần công nhận kết quả:</label>
                <Select
                  value={syncForm.userId}
                  onChange={(e) => setSyncForm({ ...syncForm, userId: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="">-- Chọn nhân sự từ hệ thống --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} [{emp.employeeCode}]
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-foreground block mb-1">Năm đánh giá:</label>
                  <Input
                    type="number"
                    value={syncForm.year}
                    onChange={(e) => setSyncForm({ ...syncForm, year: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">Xếp loại chất lượng:</label>
                  <Select
                    value={syncForm.classification}
                    onChange={(e: any) => setSyncForm({ ...syncForm, classification: e.target.value })}
                    className="w-full text-xs font-bold"
                  >
                    <option value="EXCELLENT">Hoàn thành xuất sắc</option>
                    <option value="GOOD">Hoàn thành tốt</option>
                    <option value="SATISFACTORY">Hoàn thành nhiệm vụ</option>
                    <option value="UNSATISFACTORY">Không hoàn thành</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Số quyết định công nhận (nếu có):</label>
                <Input
                  value={syncForm.decisionNo}
                  onChange={(e) => setSyncForm({ ...syncForm, decisionNo: e.target.value })}
                  placeholder="VD: QĐ-ĐGCB/2026"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Nhận xét kết quả đánh giá:</label>
                <textarea
                  value={syncForm.comment}
                  onChange={(e) => setSyncForm({ ...syncForm, comment: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsSyncModalOpen(false)}>Hủy</Button>
              <Button size="sm" onClick={() => syncAppraisalMutation.mutate()} disabled={syncAppraisalMutation.isPending}>
                {syncAppraisalMutation.isPending ? 'Đang ghi vào hồ sơ...' : 'Đồng Bộ Vào Hồ Sơ Gốc'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
