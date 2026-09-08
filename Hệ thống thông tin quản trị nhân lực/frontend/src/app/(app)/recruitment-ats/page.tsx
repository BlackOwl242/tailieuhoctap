'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, UserPlus, Star, ChevronRight, CheckCircle2,
  Calendar, Layers, Search, Mail, Phone, ArrowRight, Award, Plus, Sparkles,
  X, Clock, DollarSign, Users, Building2, FileText, Check, ShieldCheck,
  GripVertical, UserCheck, MoveRight, Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button } from '@/components/ui/primitives';

interface JobOpening {
  id: string;
  title: string;
  department?: string;
  designation?: string;
  vacancies: number;
  minExperience: number;
  salaryRange?: string;
  description: string;
  status: string;
  _count?: { applicants: number };
}

interface InterviewRound {
  id: string;
  roundName: string;
  interviewerName: string;
  score?: number;
  recommendation: string;
  feedback?: string;
}

interface JobOffer {
  id: string;
  designation: string;
  offeredSalary: number;
  status: string;
}

interface JobApplicant {
  id: string;
  jobOpeningId: string;
  candidateName: string;
  email: string;
  phone?: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW_ROUND_1' | 'INTERVIEW_ROUND_2' | 'OFFER_SENT' | 'HIRED' | 'REJECTED';
  rating: number;
  notes?: string;
  jobOpening: JobOpening;
  interviews: InterviewRound[];
  offers: JobOffer[];
}

const STAGES: { key: JobApplicant['stage']; label: string; bgClass: string; textClass: string; borderClass: string }[] = [
  { key: 'APPLIED', label: 'Ứng tuyển mới', bgClass: 'bg-slate-100', textClass: 'text-slate-800', borderClass: 'border-slate-300' },
  { key: 'SCREENING', label: 'Sơ loại hồ sơ', bgClass: 'bg-blue-50', textClass: 'text-blue-800', borderClass: 'border-blue-300' },
  { key: 'INTERVIEW_ROUND_1', label: 'Phỏng vấn V1 (Kỹ thuật)', bgClass: 'bg-purple-50', textClass: 'text-purple-800', borderClass: 'border-purple-300' },
  { key: 'INTERVIEW_ROUND_2', label: 'Phỏng vấn V2 (Văn hóa/HR)', bgClass: 'bg-amber-50', textClass: 'text-amber-900', borderClass: 'border-amber-300' },
  { key: 'OFFER_SENT', label: 'Đã gửi Thư mời (Offer)', bgClass: 'bg-cyan-50', textClass: 'text-cyan-800', borderClass: 'border-cyan-300' },
  { key: 'HIRED', label: 'Tuyển dụng thành công', bgClass: 'bg-emerald-50', textClass: 'text-emerald-800', borderClass: 'border-emerald-300' },
];

export default function RecruitmentAtsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'kanban' | 'openings'>('kanban');
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<JobOpening | null>(null);
  const [isOpeningDetailModalOpen, setIsOpeningDetailModalOpen] = useState(false);
  const [isApplicantDetailModalOpen, setIsApplicantDetailModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [filterOpeningId, setFilterOpeningId] = useState<string>('ALL');

  // Drag and Drop States & Refs
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<JobApplicant['stage'] | null>(null);
  const draggedApplicantIdRef = React.useRef<string | null>(null);
  const isDraggingActiveRef = React.useRef(false);

  // Form phỏng vấn
  const [roundName, setRoundName] = useState('Phỏng vấn Kỹ thuật Chuyên sâu');
  const [interviewerName, setInterviewerName] = useState('Trần Minh Hoàng (Tech Lead)');
  const [score, setScore] = useState(90);
  const [feedback, setFeedback] = useState('Ứng viên trả lời lưu loát các câu hỏi kiến trúc và giải thuật.');

  // Form offer
  const [offeredSalary, setOfferedSalary] = useState(32000000);
  const [designation, setDesignation] = useState('Senior Software Engineer');

  const { data: openings, isLoading: isLoadingOpenings } = useQuery<JobOpening[]>({
    queryKey: ['hrms-job-openings'],
    queryFn: async () => (await api.get('/hrms/recruitment/openings')).data,
  });

  const { data: applicants, isLoading: isLoadingApps } = useQuery<JobApplicant[]>({
    queryKey: ['hrms-job-applicants'],
    queryFn: async () => (await api.get('/hrms/recruitment/applicants')).data,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: JobApplicant['stage'] }) => {
      return (await api.patch(`/hrms/recruitment/applicants/${id}/stage`, { stage })).data;
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['hrms-job-applicants'] });
      const previous = queryClient.getQueryData<JobApplicant[]>(['hrms-job-applicants']);
      queryClient.setQueryData<JobApplicant[]>(['hrms-job-applicants'], (old) => {
        if (!old) return old;
        return old.map((a) => (a.id === id ? { ...a, stage } : a));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['hrms-job-applicants'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-job-applicants'] });
    },
  });

  const addInterviewMutation = useMutation({
    mutationFn: async (payload: { applicantId: string; roundName: string; interviewerName: string; score: number; feedback: string; scheduledAt: string }) => {
      return (await api.post('/hrms/recruitment/interviews', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-job-applicants'] });
      setIsInterviewModalOpen(false);
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: async (payload: { applicantId: string; designation: string; offeredSalary: number; joiningDate: string }) => {
      return (await api.post('/hrms/recruitment/offers', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-job-applicants'] });
      setIsOfferModalOpen(false);
    },
  });

  const convertToEmployeeMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      return (await api.post(`/hrms/recruitment/applicants/${applicantId}/convert-to-employee`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-job-applicants'] });
      alert('Đã 1-Click chuyển đổi thành công ứng viên thành Nhân viên chính thức!');
    },
  });

  if (isLoadingOpenings || isLoadingApps) return <LoadingState text="Đang tải Đường ống Tuyển dụng ATS..." />;

  const filteredApplicants = filterOpeningId === 'ALL'
    ? (applicants ?? [])
    : (applicants ?? []).filter((a) => a.jobOpeningId === filterOpeningId);

  const hiredCount = applicants?.filter((a) => a.stage === 'HIRED').length ?? 0;
  const inInterviewCount = applicants?.filter((a) => a.stage.includes('INTERVIEW')).length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản trị Tuyển dụng ATS"
        description="Đăng tin tuyển dụng, trực quan hóa tiến độ ứng viên bằng bảng Kanban kéo thả, quản lý bảng điểm phỏng vấn và chuyển đổi ứng viên trúng tuyển thành nhân viên chính thức."
        breadcrumbs={[{ label: 'Tuyển dụng' }, { label: 'ATS Pipeline' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Vị Trí Đang Tuyển"
          value={openings?.filter((o) => o.status === 'OPEN').length ?? 0}
          subtitle="Tổng chỉ tiêu tuyển dụng"
          icon={Briefcase}
          colorScheme="blue"
        />
        <NumberCard
          title="Tổng Hồ Sơ Ứng Viên"
          value={applicants?.length ?? 0}
          subtitle="Tiếp nhận qua pipeline"
          icon={UserPlus}
          colorScheme="purple"
        />
        <NumberCard
          title="Đang Phỏng Vấn (V1/V2)"
          value={inInterviewCount}
          subtitle="Đang đánh giá năng lực"
          icon={Star}
          colorScheme="amber"
        />
        <NumberCard
          title="Tuyển Dụng Thành Công"
          value={hiredCount}
          subtitle="Đã tạo hồ sơ nhân viên"
          icon={CheckCircle2}
          colorScheme="emerald"
          trend={{ value: '100%', isPositive: true, label: 'hoàn tất' }}
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="flex border-b border-transparent">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'kanban'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" />
            Bảng Tuyển Dụng Kanban ({applicants?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('openings')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'openings'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Tin Tuyển Dụng ({openings?.length ?? 0})
          </button>
        </div>

        {activeTab === 'kanban' && openings && openings.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Lọc theo vị trí:</span>
            <select
              value={filterOpeningId}
              onChange={(e) => setFilterOpeningId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-800 font-medium text-xs shadow-2xs focus:outline-hidden"
            >
              <option value="ALL">Tất cả vị trí ({applicants?.length ?? 0})</option>
              {openings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} ({o._count?.applicants ?? 0})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Kanban Board với Kéo Thả (Drag & Drop) */}
      {activeTab === 'kanban' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Kéo thả thẻ ứng viên giữa các cột để chuyển giai đoạn tuyển dụng.</span>
            </span>
            {draggedAppId && (
              <span className="text-blue-600 font-bold animate-pulse">
                Đang di chuyển ứng viên… Thả vào cột mong muốn
              </span>
            )}
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1200px] items-start">
              {STAGES.map((col) => {
                const colApps = filteredApplicants.filter((a) => a.stage === col.key);
                const isOver = dragOverCol === col.key;

                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverCol !== col.key) setDragOverCol(col.key);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragOverCol(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const appId = e.dataTransfer.getData('text/plain') || draggedApplicantIdRef.current || draggedAppId;
                      if (appId) {
                        updateStageMutation.mutate({ id: appId, stage: col.key });
                      }
                      setDragOverCol(null);
                      setDraggedAppId(null);
                      draggedApplicantIdRef.current = null;
                    }}
                    className={`flex-1 rounded-2xl border p-3 min-w-[210px] space-y-3 transition-colors ${
                      isOver
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-400/40 shadow-sm'
                        : 'border-slate-200 bg-slate-50/70 shadow-2xs'
                    }`}
                  >
                    {/* Header Cột */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{col.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                          isOver
                            ? 'bg-blue-600 text-white border-blue-600'
                            : `${col.bgClass} ${col.textClass} ${col.borderClass}`
                        }`}
                      >
                        {colApps.length}
                      </span>
                    </div>

                    {/* Danh sách thẻ ứng viên */}
                    <div className="space-y-2.5 min-h-[140px]">
                      {colApps.map((app) => {
                        const isDragging = draggedAppId === app.id;

                        return (
                          <div
                            key={app.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', app.id);
                              e.dataTransfer.effectAllowed = 'move';
                              draggedApplicantIdRef.current = app.id;
                              isDraggingActiveRef.current = true;
                              setDraggedAppId(app.id);
                            }}
                            onDragEnd={() => {
                              setDraggedAppId(null);
                              setDragOverCol(null);
                              draggedApplicantIdRef.current = null;
                              setTimeout(() => {
                                isDraggingActiveRef.current = false;
                              }, 150);
                            }}
                            onClick={() => {
                              if (isDraggingActiveRef.current) return;
                              setSelectedApplicant(app);
                              setIsApplicantDetailModalOpen(true);
                            }}
                            className={`group rounded-xl border bg-white p-3.5 shadow-2xs space-y-2.5 transition-all select-none cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-400 ${
                              isDragging
                                ? 'opacity-40 border-blue-400 bg-blue-50/30'
                                : 'border-slate-200'
                            }`}
                          >
                            {/* Grip Icon & Name */}
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                <h4 className="font-bold text-slate-900 text-xs truncate">{app.candidateName}</h4>
                              </div>
                              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                                <span>{app.rating}</span>
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-blue-700 line-clamp-1">{app.jobOpening?.title}</p>

                            <div className="space-y-0.5 text-[10px] text-slate-500">
                              <p className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 text-slate-400 shrink-0" /> <span className="truncate">{app.email}</span></p>
                              {app.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400 shrink-0" /> <span>{app.phone}</span></p>}
                            </div>

                            {/* Quick action buttons */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1">
                              {col.key === 'SCREENING' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStageMutation.mutate({ id: app.id, stage: 'INTERVIEW_ROUND_1' });
                                  }}
                                  className="text-[10px] font-bold text-blue-700 hover:underline"
                                >
                                  Vào Vòng 1 →
                                </button>
                              )}
                              {col.key === 'INTERVIEW_ROUND_1' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApplicant(app);
                                    setIsInterviewModalOpen(true);
                                  }}
                                  className="text-[10px] font-bold text-purple-700 hover:underline"
                                >
                                  Chấm điểm V1
                                </button>
                              )}
                              {col.key === 'INTERVIEW_ROUND_2' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApplicant(app);
                                    setIsOfferModalOpen(true);
                                  }}
                                  className="text-[10px] font-bold text-cyan-700 hover:underline"
                                >
                                  Gửi Offer →
                                </button>
                              )}
                              {col.key === 'OFFER_SENT' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    convertToEmployeeMutation.mutate(app.id);
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  1-Click Nhận việc
                                </button>
                              )}
                              {col.key === 'HIRED' && (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                  <CheckCircle2 className="h-3 w-3" /> Đã vào làm
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Dropzone khi cột trống */}
                      {colApps.length === 0 && (
                        <div
                          className={`rounded-xl border-2 border-dashed p-6 text-center text-xs transition-colors flex flex-col items-center justify-center gap-1 min-h-[140px] ${
                            isOver
                              ? 'border-blue-500 bg-blue-100/50 text-blue-700 font-bold'
                              : 'border-slate-200 bg-white/40 text-slate-400'
                          }`}
                        >
                          {isOver ? (
                            <span>+ Thả vào {col.label}</span>
                          ) : (
                            <span>Kéo thả ứng viên vào đây</span>
                          )}
                        </div>
                      )}

                      {/* Drop indicator dưới cùng khi cột đã có thẻ */}
                      {isOver && colApps.length > 0 && (
                        <div className="rounded-xl border-2 border-dashed border-blue-400 bg-blue-100/40 p-2.5 text-center text-[11px] font-bold text-blue-700">
                          + Thả vào {col.label}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tin tuyển dụng (Job Openings) */}
      {activeTab === 'openings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {openings?.map((o) => (
            <div
              key={o.id}
              onClick={() => {
                setSelectedOpening(o);
                setIsOpeningDetailModalOpen(true);
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{o.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{o.department ?? 'Phòng Kỹ thuật'} • {o.designation}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${o.status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {o.status === 'OPEN' ? 'Đang tuyển' : o.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <div>
                    <span className="text-slate-500 text-[11px]">Chỉ tiêu:</span> <b className="text-slate-800">{o.vacancies} người</b>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Kinh nghiệm:</span> <b className="text-slate-800">{o.minExperience}+ năm</b>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 text-[11px]">Mức lương:</span> <b className="text-emerald-700">{o.salaryRange ?? 'Thỏa thuận'}</b>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{o.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Hồ sơ đã tiếp nhận: <b className="text-slate-900">{o._count?.applicants ?? 0}</b></span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOpening(o);
                    setIsOpeningDetailModalOpen(true);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  Xem chi tiết →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL XEM CHI TIẾT ỨNG VIÊN ================= */}
      {isApplicantDetailModalOpen && selectedApplicant && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-sm">
                  {selectedApplicant.candidateName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedApplicant.candidateName}</h3>
                  <p className="text-xs text-blue-700 font-semibold">{selectedApplicant.jobOpening?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsApplicantDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Contact & Rating */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500">Email:</span>
                <p className="font-bold text-slate-900">{selectedApplicant.email}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500">Điện thoại:</span>
                <p className="font-bold text-slate-900">{selectedApplicant.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="col-span-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-amber-800 text-[11px] font-semibold">Điểm đánh giá ứng viên:</span>
                  <p className="text-sm font-extrabold text-amber-900 mt-0.5 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span>{selectedApplicant.rating} / 5.0</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs font-medium">Giai đoạn hiện tại:</span>
                  <select
                    value={selectedApplicant.stage}
                    onChange={(e) => {
                      const newStage = e.target.value as JobApplicant['stage'];
                      updateStageMutation.mutate({ id: selectedApplicant.id, stage: newStage });
                      setSelectedApplicant({ ...selectedApplicant, stage: newStage });
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-800 font-bold text-xs shadow-2xs focus:outline-hidden"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsInterviewModalOpen(true);
                  setIsApplicantDetailModalOpen(false);
                }}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs"
              >
                Chấm điểm phỏng vấn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOfferModalOpen(true);
                  setIsApplicantDetailModalOpen(false);
                }}
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 text-xs"
              >
                Tạo Thư Mời (Offer)
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  convertToEmployeeMutation.mutate(selectedApplicant.id);
                  setIsApplicantDetailModalOpen(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                1-Click Nhận việc
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM CHI TIẾT TIN TUYỂN DỤNG ================= */}
      {isOpeningDetailModalOpen && selectedOpening && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedOpening.title}</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedOpening.status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {selectedOpening.status === 'OPEN' ? 'Đang tuyển (OPEN)' : selectedOpening.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedOpening.department ?? 'Phòng Nhân sự'} • Chức danh: {selectedOpening.designation}
                </p>
              </div>

              <button
                onClick={() => setIsOpeningDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Chỉ tiêu tuyển dụng
                </span>
                <p className="text-base font-bold text-blue-950 mt-1">{selectedOpening.vacancies} nhân sự</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Mức lương công bố
                </span>
                <p className="text-base font-bold text-emerald-950 mt-1">{selectedOpening.salaryRange ?? 'Thỏa thuận'}</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-[11px] text-purple-600 font-medium flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" /> Yêu cầu kinh nghiệm
                </span>
                <p className="text-base font-bold text-purple-950 mt-1">{selectedOpening.minExperience}+ năm</p>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" /> Mô tả chi tiết công việc
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedOpening.description}
              </div>
            </div>

            {/* Applicants applied */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-600" /> Hồ sơ ứng viên ứng tuyển ({applicants?.filter((a) => a.jobOpeningId === selectedOpening.id).length ?? 0})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpeningId(selectedOpening.id);
                    setActiveTab('kanban');
                    setIsOpeningDetailModalOpen(false);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Xem trên Bảng Kanban →
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(applicants?.filter((a) => a.jobOpeningId === selectedOpening.id) ?? []).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{app.candidateName}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          <span>{app.rating}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{app.email} {app.phone ? `· ${app.phone}` : ''}</p>
                    </div>

                    <span className="text-xs font-medium text-muted-foreground">
                      {STAGES.find((s) => s.key === app.stage)?.label ?? app.stage}
                    </span>
                  </div>
                ))}

                {(applicants?.filter((a) => a.jobOpeningId === selectedOpening.id).length ?? 0) === 0 && (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                    Chưa có ứng viên nộp hồ sơ cho vị trí này.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpeningDetailModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs"
              >
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setFilterOpeningId(selectedOpening.id);
                  setActiveTab('kanban');
                  setIsOpeningDetailModalOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Lọc trên Bảng Kanban
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chấm Điểm Phỏng Vấn */}
      {isInterviewModalOpen && selectedApplicant && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900">Chấm Điểm Phỏng Vấn (Scorecard)</h2>
            <p className="text-xs text-slate-500">
              Ứng viên: <b className="text-slate-900">{selectedApplicant.candidateName}</b> — Vị trí: <b className="text-blue-700">{selectedApplicant.jobOpening?.title}</b>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Vòng phỏng vấn</label>
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Người phỏng vấn</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Điểm số đánh giá (Thang 100)</label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Nhận xét chi tiết & Đánh giá năng lực</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInterviewModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={addInterviewMutation.isPending}
                onClick={() =>
                  addInterviewMutation.mutate({
                    applicantId: selectedApplicant.id,
                    roundName,
                    interviewerName,
                    score,
                    feedback,
                    scheduledAt: new Date().toISOString(),
                  })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {addInterviewMutation.isPending ? 'Đang lưu...' : 'Lưu Đánh Giá Phỏng Vấn'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gửi Offer */}
      {isOfferModalOpen && selectedApplicant && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900">Tạo Thư Mời Nhận Việc (Job Offer)</h2>
            <p className="text-xs text-slate-500">
              Ứng viên: <b className="text-slate-900">{selectedApplicant.candidateName}</b>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Chức danh công việc</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Mức lương đề xuất (VND/tháng)</label>
                <input
                  type="number"
                  value={offeredSalary}
                  onChange={(e) => setOfferedSalary(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden font-bold text-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOfferModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={createOfferMutation.isPending}
                onClick={() =>
                  createOfferMutation.mutate({
                    applicantId: selectedApplicant.id,
                    designation,
                    offeredSalary,
                    joiningDate: new Date().toISOString(),
                  })
                }
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {createOfferMutation.isPending ? 'Đang gửi...' : 'Gửi Thư Mời Nhận Việc'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
