'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, CheckCircle2, MessageSquarePlus, Plus, Sparkles, TrendingUp, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/hr';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, Textarea } from '@/components/ui/primitives';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/common/states';

interface AppraisalReviewItem {
  id: string;
  cycleId: string;
  userId: string;
  reviewerId: string | null;
  reviewerName: string;
  relationship: 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE';
  rating: number;
  feedback: string;
  submittedAt: string;
  employeeName?: string;
  employeeCode?: string | null;
  orgUnitName?: string | null;
}

interface DevelopmentPlanItem {
  id: string;
  cycleId: string;
  userId: string;
  competencyCode: string;
  objective: string;
  successCriteria: string;
  actions: string[];
  dueDate: string;
  status: 'PROPOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  resultLevel: number | null;
  employeeNotes: string | null;
  managerNotes: string | null;
  completedAt: string | null;
  employeeName?: string;
  employeeCode?: string | null;
  orgUnitName?: string | null;
}

interface EmployeeLite {
  id: string;
  fullName: string;
  employeeCode: string | null;
  orgUnit?: { name: string } | null;
}

interface CycleLite {
  id: string;
  name: string;
  status: string;
  organizationSector?: string;
}

interface OverviewRowLite {
  userId: string;
  employeeName: string;
  employeeCode: string | null;
  orgUnit: { name: string } | null;
  score: number | null;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  SELF: 'Tự đánh giá',
  MANAGER: 'Quản lý đánh giá',
  PEER: 'Đồng nghiệp (360°)',
  SUBORDINATE: 'Cấp dưới góp ý',
};

const PIP_STATUS_LABEL: Record<string, string> = {
  PROPOSED: 'Đề xuất',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export function Kpi360PipPanel({
  cycle,
  currentUserId,
  employees,
  canManagePip,
  canProposeAward,
}: {
  cycle: CycleLite | undefined;
  currentUserId: string;
  employees: EmployeeLite[];
  canManagePip: boolean;
  canProposeAward: boolean;
}) {
  const qc = useQueryClient();
  const toast = useToast();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    userId: currentUserId,
    relationship: 'SELF' as 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE',
    rating: '85',
    feedback: '',
  });

  const [pipModalOpen, setPipModalOpen] = useState(false);
  const [pipForm, setPipForm] = useState({
    userId: '',
    competencyCode: 'KPI_GAP',
    objective: '',
    successCriteria: '',
    actionsText: '',
    dueDate: '',
    managerNotes: '',
  });

  const [pipNoteModal, setPipNoteModal] = useState<{
    plan: DevelopmentPlanItem;
    isSubject: boolean;
    nextStatus: 'PROPOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes: string;
    resultLevel: string;
  } | null>(null);

  const [awardModalUser, setAwardModalUser] = useState<OverviewRowLite | null>(null);
  const [awardAmount, setAwardAmount] = useState('2000000');
  const [awardReason, setAwardReason] = useState('');

  const cycleId = cycle?.id ?? '';

  const directoryQ = useQuery({
    queryKey: ['kpi-people-directory'],
    queryFn: async () =>
      (await api.get<{ items: EmployeeLite[] }>('/people', { params: { limit: 60 } })).data.items,
    enabled: employees.length === 0,
    retry: false,
  });

  const selectableEmployees = employees.length > 0 ? employees : (directoryQ.data ?? []);

  const reviewsQ = useQuery({
    queryKey: ['hrms-performance-reviews', cycleId],
    queryFn: async () =>
      (await api.get<AppraisalReviewItem[]>('/hrms/performance/reviews', { params: { cycleId } })).data,
    enabled: Boolean(cycleId),
  });

  const plansQ = useQuery({
    queryKey: ['hrms-performance-development-plans', cycleId],
    queryFn: async () =>
      (await api.get<DevelopmentPlanItem[]>('/hrms/performance/development-plans', { params: { cycleId } })).data,
    enabled: Boolean(cycleId),
  });

  const overviewQ = useQuery<{ rows: OverviewRowLite[] }>({
    queryKey: ['hrms-performance-overview-award', cycleId],
    queryFn: async () => (await api.get('/hrms/performance/overview', { params: { cycleId } })).data,
    enabled: Boolean(cycleId && canProposeAward && cycle?.organizationSector === 'enterprise'),
    retry: false,
  });

  const submitReview = useMutation({
    mutationFn: async () =>
      (
        await api.post('/hrms/performance/reviews', {
          cycleId,
          userId: reviewForm.relationship === 'SELF' ? currentUserId : reviewForm.userId,
          relationship: reviewForm.relationship,
          rating: Number(reviewForm.rating),
          feedback: reviewForm.feedback.trim(),
        })
      ).data,
    onSuccess: () => {
      toast('Đã lưu phản hồi đánh giá 360°', 'success');
      setReviewModalOpen(false);
      setReviewForm((prev) => ({ ...prev, feedback: '' }));
      qc.invalidateQueries({ queryKey: ['hrms-performance-reviews', cycleId] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const createPip = useMutation({
    mutationFn: async () =>
      (
        await api.post('/hrms/performance/development-plans', {
          cycleId,
          userId: pipForm.userId,
          competencyCode: pipForm.competencyCode.trim() || 'KPI_GAP',
          objective: pipForm.objective.trim(),
          successCriteria: pipForm.successCriteria.trim(),
          actions: pipForm.actionsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          dueDate: pipForm.dueDate,
          managerNotes: pipForm.managerNotes.trim() || undefined,
        })
      ).data,
    onSuccess: () => {
      toast('Đã lập Kế hoạch cải thiện / phát triển (PIP)', 'success');
      setPipModalOpen(false);
      setPipForm({
        userId: '',
        competencyCode: 'KPI_GAP',
        objective: '',
        successCriteria: '',
        actionsText: '',
        dueDate: '',
        managerNotes: '',
      });
      qc.invalidateQueries({ queryKey: ['hrms-performance-development-plans', cycleId] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const updatePip = useMutation({
    mutationFn: async () => {
      if (!pipNoteModal) return null;
      const payload = pipNoteModal.isSubject
        ? {
            status: pipNoteModal.nextStatus,
            employeeNotes: pipNoteModal.notes.trim(),
          }
        : {
            status: pipNoteModal.nextStatus,
            managerNotes: pipNoteModal.notes.trim(),
            resultLevel: pipNoteModal.nextStatus === 'COMPLETED' ? Number(pipNoteModal.resultLevel) : undefined,
          };
      return (await api.patch(`/hrms/performance/development-plans/${pipNoteModal.plan.id}`, payload)).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật trạng thái kế hoạch PIP', 'success');
      setPipNoteModal(null);
      qc.invalidateQueries({ queryKey: ['hrms-performance-development-plans', cycleId] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const proposeAward = useMutation({
    mutationFn: async () => {
      if (!awardModalUser) return null;
      return (
        await api.post('/hrms/performance/propose-award', {
          cycleId,
          userId: awardModalUser.userId,
          amount: Number(awardAmount),
          reason: awardReason.trim(),
        })
      ).data;
    },
    onSuccess: () => {
      toast('Đã gửi đề xuất khen thưởng KPI vào luồng duyệt Quyết định nhân sự', 'success');
      setAwardModalUser(null);
      setAwardReason('');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const reviewStatsByType = useMemo(() => {
    const groups: Record<string, { count: number; total: number }> = {};
    for (const r of reviewsQ.data ?? []) {
      const g = groups[r.relationship] ?? { count: 0, total: 0 };
      g.count += 1;
      g.total += r.rating;
      groups[r.relationship] = g;
    }
    return groups;
  }, [reviewsQ.data]);

  const eligibleForAward = useMemo(() => {
    return (overviewQ.data?.rows ?? []).filter(
      (r) => r.score !== null && r.score >= 75 && r.userId !== currentUserId,
    );
  }, [overviewQ.data?.rows, currentUserId]);

  if (!cycle) {
    return <EmptyState title="Chưa có chu kỳ đánh giá KPI" description="Hãy tạo hoặc chọn một chu kỳ KPI để dùng tính năng 360°, PIP và đề xuất thưởng." />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Tự đánh giá & Phản hồi 360° */}
      <Card>
        <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Tự đánh giá &amp; Phản hồi 360° — {cycle.name}
            </CardTitle>
            <CardDescription>
              Tổng hợp nhận xét đa chiều từ bản thân (SELF), quản lý (MANAGER), đồng nghiệp (PEER) và cấp dưới (SUBORDINATE).
            </CardDescription>
          </div>
          {cycle.status === 'ACTIVE' && (
            <Button
              size="sm"
              onClick={() => {
                setReviewForm({
                  userId: currentUserId,
                  relationship: 'SELF',
                  rating: '85',
                  feedback: '',
                });
                setReviewModalOpen(true);
              }}
            >
              <MessageSquarePlus className="h-4 w-4" /> Gửi đánh giá 360°
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['SELF', 'MANAGER', 'PEER', 'SUBORDINATE'] as const).map((rel) => {
              const stat = reviewStatsByType[rel];
              const avg = stat && stat.count > 0 ? Math.round((stat.total / stat.count) * 10) / 10 : null;
              return (
                <div key={rel} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">{RELATIONSHIP_LABELS[rel]}</p>
                  <p className="mt-1 text-lg font-bold font-mono">{avg !== null ? `${avg}/100` : '—'}</p>
                  <p className="text-[11px] text-muted-foreground">{stat?.count ?? 0} lượt phản hồi</p>
                </div>
              );
            })}
          </div>

          {reviewsQ.isLoading ? (
            <LoadingBlock label="Đang tải danh sách đánh giá 360°…" />
          ) : reviewsQ.isError ? (
            <ErrorState message={errorMessage(reviewsQ.error)} onRetry={() => reviewsQ.refetch()} />
          ) : !reviewsQ.data?.length ? (
            <p className="text-xs text-muted-foreground">Chưa có bản đánh giá 360° nào trong chu kỳ này.</p>
          ) : (
            <div className="space-y-2.5">
              {reviewsQ.data.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{r.employeeName || r.userId}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-muted-foreground">
                        <Badge variant="secondary" style={{ fontWeight: 500 }}>
                          {RELATIONSHIP_LABELS[r.relationship] ?? r.relationship}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-muted-foreground">
                        Người đánh giá: <strong className="text-foreground">{r.reviewerName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">
                        <Badge variant="default" className="font-mono" style={{ fontWeight: 600 }}>
                          {r.rating} / 100
                        </Badge>
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-[11px] text-muted-foreground">{formatDateTime(r.submittedAt)}</span>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground leading-relaxed">{r.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Kế hoạch cải thiện & phát triển (PIP) */}
      <Card>
        <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Kế hoạch Cải thiện &amp; Phát triển (PIP)
            </CardTitle>
            <CardDescription>
              Theo dõi mục tiêu khắc phục điểm yếu sau kỳ đánh giá; nhân sự cập nhật tiến độ thực hiện, quản lý/HR nghiệm thu hoàn thành.
            </CardDescription>
          </div>
          {canManagePip && (
            <Button size="sm" variant="outline" onClick={() => setPipModalOpen(true)}>
              <Plus className="h-4 w-4" /> Lập kế hoạch PIP
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {plansQ.isLoading ? (
            <LoadingBlock label="Đang tải kế hoạch PIP…" />
          ) : plansQ.isError ? (
            <ErrorState message={errorMessage(plansQ.error)} onRetry={() => plansQ.refetch()} />
          ) : !plansQ.data?.length ? (
            <p className="text-xs text-muted-foreground">Chưa có kế hoạch PIP nào được giao trong chu kỳ này.</p>
          ) : (
            plansQ.data.map((plan) => {
              const isSubject = plan.userId === currentUserId;
              return (
                <div key={plan.id} className="rounded-lg border border-border p-4 text-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{plan.employeeName}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="font-mono text-muted-foreground">{plan.competencyCode}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span
                        className={
                          plan.status === 'COMPLETED'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : plan.status === 'CANCELLED'
                              ? 'text-destructive'
                              : 'text-amber-700 dark:text-amber-400'
                        }
                      >
                        <Badge
                          variant={
                            plan.status === 'COMPLETED'
                              ? 'default'
                              : plan.status === 'CANCELLED'
                                ? 'destructive'
                                : 'secondary'
                          }
                          style={{ fontWeight: 500 }}
                        >
                          {PIP_STATUS_LABEL[plan.status] ?? plan.status}
                        </Badge>
                      </span>
                    </div>
                    <span className="text-muted-foreground">Hạn hoàn thành: {formatDate(plan.dueDate)}</span>
                  </div>

                  <div>
                    <p className="font-medium text-foreground">Mục tiêu: {plan.objective}</p>
                    <p className="mt-1 text-muted-foreground">Tiêu chí đạt: {plan.successCriteria}</p>
                  </div>

                  {Array.isArray(plan.actions) && plan.actions.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                      {plan.actions.map((act, idx) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ul>
                  )}

                  {plan.employeeNotes && (
                    <p className="rounded bg-muted/40 px-2.5 py-1.5 text-muted-foreground">
                      <strong className="text-foreground">Ghi chú nhân sự:</strong> {plan.employeeNotes}
                    </p>
                  )}
                  {plan.managerNotes && (
                    <p className="rounded bg-primary/5 px-2.5 py-1.5 text-muted-foreground">
                      <strong className="text-foreground">Nhận xét quản lý:</strong> {plan.managerNotes}
                      {plan.resultLevel ? ` (Mức đạt: ${plan.resultLevel}/5)` : ''}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {isSubject && plan.status === 'PROPOSED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPipNoteModal({
                            plan,
                            isSubject: true,
                            nextStatus: 'IN_PROGRESS',
                            notes: plan.employeeNotes ?? '',
                            resultLevel: '3',
                          })
                        }
                      >
                        Bắt đầu thực hiện &amp; ghi chú
                      </Button>
                    )}
                    {!isSubject && canManagePip && ['PROPOSED', 'IN_PROGRESS'].includes(plan.status) && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            setPipNoteModal({
                              plan,
                              isSubject: false,
                              nextStatus: 'COMPLETED',
                              notes: plan.managerNotes ?? '',
                              resultLevel: String(plan.resultLevel ?? 4),
                            })
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Nghiệm thu hoàn thành
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setPipNoteModal({
                              plan,
                              isSubject: false,
                              nextStatus: 'CANCELLED',
                              notes: plan.managerNotes ?? '',
                              resultLevel: '3',
                            })
                          }
                        >
                          Hủy kế hoạch
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 3. Đề xuất khen thưởng KPI -> Quyết định Nhân sự -> Bảng lương */}
      {canProposeAward && cycle.organizationSector === 'enterprise' && (
        <Card>
          <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-primary" />
                Đề xuất Khen thưởng Hiệu suất KPI
              </CardTitle>
              <CardDescription>
                Sau khi khóa kỳ KPI (`COMPLETED`), đề xuất thưởng cho nhân sự đạt từ 75/100 trở lên để chuyển vào luồng duyệt Quyết định &amp; hạch toán vào kỳ lương.
              </CardDescription>
            </div>
            <Link
              href="/personnel"
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Mở Quyết định Nhân sự →
            </Link>
          </CardHeader>
          <CardContent>
            {cycle.status !== 'COMPLETED' ? (
              <p className="text-xs text-muted-foreground">
                Kỳ đánh giá hiện đang ở trạng thái <strong>{cycle.status}</strong>. Hãy hoàn tất chấm điểm và đóng kỳ (<code>COMPLETED</code>) tại tab Chu kỳ để mở đề xuất khen thưởng.
              </p>
            ) : eligibleForAward.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có nhân sự nào trong phạm vi đạt từ 75/100 trở lên trong kỳ này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nhân sự</th>
                      <th className="py-2 pr-3">Đơn vị</th>
                      <th className="py-2 pr-3 text-right">Điểm KPI kỳ</th>
                      <th className="py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleForAward.map((row) => (
                      <tr key={row.userId} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">
                          {row.employeeName} <span className="text-muted-foreground">({row.employeeCode ?? '—'})</span>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.orgUnit?.name ?? '—'}</td>
                        <td className="py-2 pr-3 text-right font-mono font-semibold text-emerald-600">{row.score} / 100</td>
                        <td className="py-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAwardModalUser(row);
                              setAwardAmount('2000000');
                              setAwardReason(`Đạt ${row.score}/100 điểm trong kỳ ${cycle.name}`);
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Đề xuất thưởng
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal gửi đánh giá 360° */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Gửi đánh giá 360° / Tự đánh giá"
        description={`Kỳ: ${cycle.name}`}
      >
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label>Vai trò đánh giá</Label>
            <Select
              value={reviewForm.relationship}
              onChange={(e) => {
                const rel = e.target.value as 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE';
                setReviewForm((prev) => ({
                  ...prev,
                  relationship: rel,
                  userId: rel === 'SELF' ? currentUserId : prev.userId === currentUserId ? '' : prev.userId,
                }));
              }}
            >
              <option value="SELF">Tự đánh giá (bản thân)</option>
              <option value="PEER">Đồng nghiệp (360°)</option>
              <option value="SUBORDINATE">Cấp dưới góp ý</option>
              {canManagePip && <option value="MANAGER">Quản lý đánh giá</option>}
            </Select>
          </div>

          {reviewForm.relationship !== 'SELF' && (
            <div className="space-y-1.5">
              <Label>Nhân sự được đánh giá</Label>
              <Select
                value={reviewForm.userId}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, userId: e.target.value }))}
              >
                <option value="">Chọn nhân sự…</option>
                {selectableEmployees
                  .filter((emp) => emp.id !== currentUserId)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                    </option>
                  ))}
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Điểm đánh giá (0 – 100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nhận xét &amp; dẫn chứng cụ thể (tối thiểu 10 ký tự)</Label>
            <Textarea
              rows={4}
              value={reviewForm.feedback}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, feedback: e.target.value }))}
              placeholder="Ghi rõ điểm mạnh, đóng góp nổi bật và khía cạnh cần cải thiện trong kỳ..."
            />
          </div>
        </div>
        <ModalFooterActions
          onCancel={() => setReviewModalOpen(false)}
          cancelLabel="Đóng"
          onConfirm={() => submitReview.mutate()}
          confirmLabel="Gửi phản hồi"
          pending={submitReview.isPending}
          disabled={
            reviewForm.feedback.trim().length < 10 ||
            (reviewForm.relationship !== 'SELF' && !reviewForm.userId)
          }
        />
      </Modal>

      {/* Modal tạo PIP */}
      <Modal open={pipModalOpen} onOpenChange={setPipModalOpen} title="Lập Kế hoạch Cải thiện / Phát triển (PIP)">
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label>Nhân sự áp dụng *</Label>
            <Select value={pipForm.userId} onChange={(e) => setPipForm((prev) => ({ ...prev, userId: e.target.value }))}>
              <option value="">Chọn nhân sự…</option>
              {selectableEmployees
                .filter((emp) => emp.id !== currentUserId)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                  </option>
                ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mã năng lực / nhóm KPI</Label>
              <Input
                value={pipForm.competencyCode}
                onChange={(e) => setPipForm((prev) => ({ ...prev, competencyCode: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hạn hoàn thành *</Label>
              <Input
                type="date"
                value={pipForm.dueDate}
                onChange={(e) => setPipForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mục tiêu cải thiện *</Label>
            <Input
              value={pipForm.objective}
              onChange={(e) => setPipForm((prev) => ({ ...prev, objective: e.target.value }))}
              placeholder="VD: Nâng tỷ lệ hoàn thành Sprint đạt >= 90%"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tiêu chí nghiệm thu thành công *</Label>
            <Input
              value={pipForm.successCriteria}
              onChange={(e) => setPipForm((prev) => ({ ...prev, successCriteria: e.target.value }))}
              placeholder="VD: Hoàn thành 3/3 module đúng hạn, không phát sinh lỗi nghiêm trọng"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Các hành động cụ thể (mỗi dòng 1 hành động)</Label>
            <Textarea
              rows={3}
              value={pipForm.actionsText}
              onChange={(e) => setPipForm((prev) => ({ ...prev, actionsText: e.target.value }))}
              placeholder={'Review code 1:1 hàng tuần với Tech Lead\nHoàn thành khóa học kiểm thử tự động'}
            />
          </div>
        </div>
        <ModalFooterActions
          onCancel={() => setPipModalOpen(false)}
          onConfirm={() => createPip.mutate()}
          confirmLabel="Giao kế hoạch PIP"
          pending={createPip.isPending}
          disabled={
            !pipForm.userId ||
            pipForm.objective.trim().length < 5 ||
            pipForm.successCriteria.trim().length < 5 ||
            !pipForm.dueDate
          }
        />
      </Modal>

      {/* Modal cập nhật / nghiệm thu PIP */}
      <Modal
        open={Boolean(pipNoteModal)}
        onOpenChange={(open) => !open && setPipNoteModal(null)}
        title={
          pipNoteModal?.isSubject
            ? 'Cập nhật tiến độ thực hiện PIP'
            : pipNoteModal?.nextStatus === 'COMPLETED'
              ? 'Nghiệm thu hoàn thành PIP'
              : 'Hủy kế hoạch PIP'
        }
      >
        {pipNoteModal && (
          <div className="space-y-3 text-xs">
            <p className="font-medium text-foreground">{pipNoteModal.plan.objective}</p>
            {!pipNoteModal.isSubject && pipNoteModal.nextStatus === 'COMPLETED' && (
              <div className="space-y-1.5">
                <Label>Mức độ đạt (1 – 5)</Label>
                <Select
                  value={pipNoteModal.resultLevel}
                  onChange={(e) => setPipNoteModal((prev) => (prev ? { ...prev, resultLevel: e.target.value } : null))}
                >
                  {[1, 2, 3, 4, 5].map((lv) => (
                    <option key={lv} value={String(lv)}>
                      Mức {lv} / 5
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{pipNoteModal.isSubject ? 'Báo cáo tiến độ của bạn' : 'Nhận xét của quản lý'}</Label>
              <Textarea
                rows={4}
                value={pipNoteModal.notes}
                onChange={(e) => setPipNoteModal((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
              />
            </div>
          </div>
        )}
        <ModalFooterActions
          onCancel={() => setPipNoteModal(null)}
          cancelLabel="Đóng"
          onConfirm={() => updatePip.mutate()}
          confirmLabel="Xác nhận"
          pending={updatePip.isPending}
        />
      </Modal>

      {/* Modal đề xuất thưởng KPI */}
      <Modal
        open={Boolean(awardModalUser)}
        onOpenChange={(open) => !open && setAwardModalUser(null)}
        title="Đề xuất Khen thưởng từ Kết quả KPI"
        description={
          awardModalUser
            ? `${awardModalUser.employeeName} · Điểm KPI ${awardModalUser.score}/100`
            : undefined
        }
      >
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label>Số tiền thưởng đề xuất (VND, tối thiểu 100.000 đ)</Label>
            <Input
              type="number"
              min={100000}
              step={100000}
              value={awardAmount}
              onChange={(e) => setAwardAmount(e.target.value)}
            />
            <p className="text-muted-foreground">Hiển thị: {formatCurrency(Number(awardAmount) || 0)}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Lý do &amp; căn cứ đề xuất (tối thiểu 10 ký tự)</Label>
            <Textarea rows={3} value={awardReason} onChange={(e) => setAwardReason(e.target.value)} />
          </div>
        </div>
        <ModalFooterActions
          onCancel={() => setAwardModalUser(null)}
          onConfirm={() => proposeAward.mutate()}
          confirmLabel="Gửi đề xuất khen thưởng"
          pending={proposeAward.isPending}
          disabled={Number(awardAmount) < 100000 || awardReason.trim().length < 10}
        />
      </Modal>
    </div>
  );
}
