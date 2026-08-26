'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck, ArrowRightLeft, Award, UserMinus, Plus, CheckSquare,
  Square, Calendar, Layers, ShieldCheck, Clock, CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';

interface LifecycleEvent {
  id: string;
  userId: string;
  employeeName: string;
  type: 'ONBOARDING' | 'PROMOTION' | 'TRANSFER' | 'SEPARATION' | 'DISCIPLINARY';
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  title: string;
  decisionNo?: string;
  effectiveDate: string;
  notes?: string;
  createdAt: string;
}

interface OnboardingTask {
  id: string;
  title: string;
  category: string;
  assignee?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export default function LifecyclePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'events' | 'tasks'>('events');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Form event
  const [employeeName, setEmployeeName] = useState('');
  const [eventType, setEventType] = useState<LifecycleEvent['type']>('PROMOTION');
  const [title, setTitle] = useState('');
  const [decisionNo, setDecisionNo] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-09-01');

  const { data: events, isLoading: isLoadingEvents } = useQuery<LifecycleEvent[]>({
    queryKey: ['hrms-lifecycle-events'],
    queryFn: async () => (await api.get('/hrms/lifecycle/events')).data,
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<OnboardingTask[]>({
    queryKey: ['hrms-onboarding-tasks'],
    queryFn: async () => (await api.get('/hrms/lifecycle/onboarding-tasks')).data,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.patch(`/hrms/lifecycle/onboarding-tasks/${id}/toggle`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-onboarding-tasks'] });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (payload: { employeeName: string; type: LifecycleEvent['type']; title: string; decisionNo?: string; effectiveDate: string }) => {
      return (await api.post('/hrms/lifecycle/events', {
        userId: 'temp-user',
        ...payload,
        effectiveDate: new Date(payload.effectiveDate).toISOString(),
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-lifecycle-events'] });
      setIsEventModalOpen(false);
      setEmployeeName('');
      setTitle('');
    },
  });

  if (isLoadingEvents || isLoadingTasks) return <LoadingState text="Đang tải dữ liệu Vòng đời Nhân sự..." />;

  const completedTasks = tasks?.filter((t) => t.isCompleted).length ?? 0;
  const totalTasks = tasks?.length ?? 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Vòng đời Nhân sự & Quyết định Công tác"
        description="Quản lý quy trình tiếp nhận nhân sự mới (Onboarding Checklist), điều chuyển phòng ban, thăng chức bổ nhiệm, khen thưởng và thôi việc."
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Vòng đời công tác' }]}
        actions={
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Tạo Quyết Định Nhân Sự
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Tiếp Nhận Nhân Sự Mới"
          value={events?.filter((e) => e.type === 'ONBOARDING').length ?? 0}
          subtitle="Quy trình thử việc / tiếp nhận"
          icon={UserCheck}
          colorScheme="blue"
        />
        <NumberCard
          title="Thăng Chức / Bổ Nhiệm"
          value={events?.filter((e) => e.type === 'PROMOTION').length ?? 0}
          subtitle="Điều chỉnh ngạch bậc & chức vụ"
          icon={Award}
          colorScheme="purple"
        />
        <NumberCard
          title="Điều Chuyển Công Tác"
          value={events?.filter((e) => e.type === 'TRANSFER').length ?? 0}
          subtitle="Giữa các đơn vị / chi nhánh"
          icon={ArrowRightLeft}
          colorScheme="amber"
        />
        <NumberCard
          title="Tiến Độ Onboarding"
          value={`${progressPercent}%`}
          subtitle={`${completedTasks}/${totalTasks} nhiệm vụ hoàn tất`}
          icon={CheckCircle2}
          colorScheme="emerald"
          trend={{ value: `${completedTasks} xong`, isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'events'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Dòng Sự Kiện Quyết Định Nhân Sự ({events?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'tasks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Nhiệm Vụ Tiếp Nhận Onboarding ({tasks?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Dòng Sự Kiện */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((e) => (
                <div key={e.id} className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{e.title}</span>
                      </div>
                      <p className="text-xs text-primary font-semibold mt-0.5">{e.employeeName}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {e.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="text-muted-foreground text-[11px]">Loại sự kiện:</span>
                      <p className="font-bold text-foreground">{e.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Số quyết định:</span>
                      <p className="font-bold text-foreground">{e.decisionNo ?? 'QD-TCCB'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-[11px]">Ngày hiệu lực:</span>
                      <p className="font-medium text-foreground">{new Date(e.effectiveDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có sự kiện vòng đời nào"
              description="Bấm 'Tạo Quyết Định Nhân Sự' để ghi nhận sự kiện bổ nhiệm, điều chuyển hoặc thôi việc."
            />
          )}
        </div>
      )}

      {/* Tab 2: Onboarding Tasks */}
      {activeTab === 'tasks' && (
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-bold text-foreground text-sm">Checklist Tiếp Nhận Nhân Sự Mới</h3>
              <p className="text-xs text-muted-foreground">Tự động kích hoạt khi có nhân viên mới gia nhập tổ chức</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {completedTasks}/{totalTasks} Hoàn thành
            </span>
          </div>

          <div className="space-y-2">
            {tasks?.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTaskMutation.mutate(task.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  task.isCompleted
                    ? 'bg-emerald-50/60 border-emerald-300 text-slate-600'
                    : 'bg-card hover:bg-muted/40 border-border/80 text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.isCompleted ? (
                    <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className={`text-xs font-medium ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-muted-foreground">
                      Bộ phận: {task.category}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-muted-foreground font-medium">{task.assignee ?? 'Chuyên viên'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tạo Quyết Định */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Tạo Quyết Định Nhân Sự</h2>
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
                <label className="font-semibold text-foreground">Loại quyết định / sự kiện</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as LifecycleEvent['type'])}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                >
                  <option value="PROMOTION">Thăng chức / Bổ nhiệm</option>
                  <option value="TRANSFER">Điều chuyển công tác</option>
                  <option value="ONBOARDING">Tiếp nhận thử việc / chính thức</option>
                  <option value="SEPARATION">Bàn giao & Thôi việc</option>
                  <option value="DISCIPLINARY">Kỷ luật / Cảnh cáo</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-foreground">Tiêu đề quyết định</label>
                <input
                  type="text"
                  placeholder="VD: Quyết định bổ nhiệm Phó Giám đốc Trung tâm..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Số quyết định</label>
                  <input
                    type="text"
                    placeholder="QD-2026/099-BN"
                    value={decisionNo}
                    onChange={(e) => setDecisionNo(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Ngày hiệu lực</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={!employeeName || !title || createEventMutation.isPending}
                onClick={() => createEventMutation.mutate({ employeeName, type: eventType, title, decisionNo, effectiveDate })}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createEventMutation.isPending ? 'Đang lưu...' : 'Lưu Quyết Định'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
