'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, UserPlus, Star, ChevronRight, CheckCircle2,
  Calendar, Layers, Search, Mail, Phone, ArrowRight, Award, Plus, Sparkles,
  X, Clock, DollarSign, Users, Building2, FileText, Check, ShieldCheck,
  GripVertical, UserCheck, MoveRight, Info,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, Select } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toaster';

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
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'kanban' | 'openings'>('kanban');
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<JobOpening | null>(null);
  const [isOpeningDetailModalOpen, setIsOpeningDetailModalOpen] = useState(false);
  const [isApplicantDetailModalOpen, setIsApplicantDetailModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [filterOpeningId, setFilterOpeningId] = useState<string>('ALL');

  // Modal tạo tin tuyển dụng & tiếp nhận ứng viên
  const [isCreateOpeningModalOpen, setIsCreateOpeningModalOpen] = useState(false);
  const [isCreateApplicantModalOpen, setIsCreateApplicantModalOpen] = useState(false);

  // Form tạo tin tuyển dụng
  const [openingTitle, setOpeningTitle] = useState('');
  const [openingDept, setOpeningDept] = useState('Phòng Phát triển Phần mềm');
  const [openingDesignation, setOpeningDesignation] = useState('');
  const [openingVacancies, setOpeningVacancies] = useState(1);
  const [openingMinExp, setOpeningMinExp] = useState(1);
  const [openingSalary, setOpeningSalary] = useState('20.000.000 - 35.000.000 VND');
  const [openingClosingDate, setOpeningClosingDate] = useState('');
  const [openingDesc, setOpeningDesc] = useState('');
  const [openingReqs, setOpeningReqs] = useState('');

  // Form tiếp nhận ứng viên
  const [appJobOpeningId, setAppJobOpeningId] = useState('');
  const [appCandidateName, setAppCandidateName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appResumeUrl, setAppResumeUrl] = useState('');
  const [appNotes, setAppNotes] = useState('');

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

  const createOpeningMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      department?: string;
      designation?: string;
      vacancies: number;
      minExperience: number;
      salaryRange?: string;
      description: string;
      requirements?: string;
      closingDate?: string;
    }) => {
      return (await api.post('/hrms/recruitment/openings', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-job-openings'] });
      setIsCreateOpeningModalOpen(false);
      setOpeningTitle('');
      setOpeningDesignation('');
      setOpeningDesc('');
      setOpeningReqs('');
      toast('Đã đăng tin tuyển dụng mới thành công!', 'success');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const createApplicantMutation = useMutation({
    mutationFn: async (payload: {
      jobOpeningId: string;
      candidateName: string;
      email: string;
      phone?: string;
      resumeUrl?: string;
      notes?: string;
    }) => {
      return (await api.post('/hrms/recruitment/applicants', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-job-applicants'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-job-openings'] });
      setIsCreateApplicantModalOpen(false);
      setAppCandidateName('');
      setAppEmail('');
      setAppPhone('');
      setAppResumeUrl('');
      setAppNotes('');
      toast('Đã tiếp nhận hồ sơ ứng viên mới vào quy trình ATS!', 'success');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
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
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast('Đã tiếp nhận và chuyển đổi ứng viên thành Nhân sự chính thức thành công!', 'success');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
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
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (openings && openings.length > 0 && !appJobOpeningId) {
                  setAppJobOpeningId(openings[0].id);
                }
                setIsCreateApplicantModalOpen(true);
              }}
              className="text-xs flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Tiếp nhận ứng viên</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpeningModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Đăng tin tuyển dụng</span>
            </Button>
          </div>
        }
      />

      {/* Card Hướng dẫn luồng tuyển dụng cho người dùng */}
      <div className="rounded-xl border border-border/70 bg-card p-3 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Luồng tạo & quản trị tin tuyển dụng:</span>
            <span className="ml-1 text-muted-foreground">
              Bấm nút <b className="text-foreground">Đăng tin tuyển dụng</b> ở góc phải để tạo vị trí mới, hoặc chuyển sang tab <b className="text-foreground">Tin Tuyển Dụng</b> để quản lý danh sách và chỉ tiêu tuyển dụng.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateOpeningModalOpen(true)}
            className="text-xs h-7 px-2.5 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Đăng tin mới</span>
          </Button>
        </div>
      </div>

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
            <Select
              value={filterOpeningId}
              onChange={(e) => setFilterOpeningId(e.target.value)}
              className="w-[240px] text-xs font-medium"
            >
              <option value="ALL">Tất cả vị trí ({applicants?.length ?? 0})</option>
              {openings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} ({o._count?.applicants ?? 0})
                </option>
              ))}
            </Select>
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
                      <span className="text-xs font-bold text-foreground truncate">{col.label}</span>
                      <div className="flex items-center gap-1.5">
                        {col.key === 'APPLIED' && (
                          <button
                            type="button"
                            title="Tiếp nhận ứng viên mới"
                            onClick={() => {
                              if (filterOpeningId !== 'ALL') {
                                setAppJobOpeningId(filterOpeningId);
                              } else if (openings && openings.length > 0 && !appJobOpeningId) {
                                setAppJobOpeningId(openings[0].id);
                              }
                              setIsCreateApplicantModalOpen(true);
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                          className={`rounded-xl border-2 border-dashed p-6 text-center text-xs transition-colors flex flex-col items-center justify-center gap-2 min-h-[140px] ${
                            isOver
                              ? 'border-blue-500 bg-blue-100/50 text-blue-700 font-bold'
                              : 'border-slate-200 bg-white/40 text-slate-400'
                          }`}
                        >
                          {isOver ? (
                            <span>Thả vào {col.label}</span>
                          ) : col.key === 'APPLIED' ? (
                            <div className="space-y-2 text-center">
                              <p className="text-muted-foreground text-xs font-medium">Chưa có ứng viên mới</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (filterOpeningId !== 'ALL') {
                                    setAppJobOpeningId(filterOpeningId);
                                  } else if (openings && openings.length > 0 && !appJobOpeningId) {
                                    setAppJobOpeningId(openings[0].id);
                                  }
                                  setIsCreateApplicantModalOpen(true);
                                }}
                                className="text-xs h-7 px-2.5 flex items-center gap-1"
                              >
                                <UserPlus className="h-3 w-3" />
                                <span>Tiếp nhận hồ sơ</span>
                              </Button>
                            </div>
                          ) : (
                            <span>Kéo thả ứng viên vào đây</span>
                          )}
                        </div>
                      )}

                      {/* Drop indicator dưới cùng khi cột đã có thẻ */}
                      {isOver && colApps.length > 0 && (
                        <div className="rounded-xl border-2 border-dashed border-blue-400 bg-blue-100/40 p-2.5 text-center text-[11px] font-bold text-blue-700">
                          Thả vào {col.label}
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-foreground">Danh Sách Vị Trí Tuyển Dụng ({openings?.length ?? 0})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quản lý các vị trí việc làm đang mở, số lượng chỉ tiêu định biên và xem danh sách ứng viên theo từng đợt tuyển.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpeningModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs flex items-center gap-1.5 font-semibold self-start sm:self-auto shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Đăng tin tuyển dụng mới</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openings?.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  setSelectedOpening(o);
                  setIsOpeningDetailModalOpen(true);
                }}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-2xs space-y-3 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{o.title}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{o.department ?? 'Phòng Kỹ thuật'} • {o.designation}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full ${o.status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {o.status === 'OPEN' ? 'Đang tuyển' : o.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 border border-border/50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-muted-foreground text-[11px]">Chỉ tiêu:</span> <b className="text-foreground">{o.vacancies} người</b>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Kinh nghiệm:</span> <b className="text-foreground">{o.minExperience}+ năm</b>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-[11px]">Mức lương:</span> <b className="text-emerald-600">{o.salaryRange ?? 'Thỏa thuận'}</b>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{o.description}</p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Hồ sơ đã tiếp nhận: <b className="text-foreground">{o._count?.applicants ?? 0}</b></span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOpening(o);
                      setIsOpeningDetailModalOpen(true);
                    }}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            ))}

            {(!openings || openings.length === 0) && (
              <div className="col-span-2 p-8 rounded-2xl border border-dashed border-border/70 bg-card text-center space-y-3">
                <Briefcase className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-semibold text-foreground">Chưa có tin tuyển dụng nào</p>
                <p className="text-xs text-muted-foreground">Bấm nút bên dưới để tạo vị trí tuyển dụng đầu tiên của công ty.</p>
                <Button
                  size="sm"
                  onClick={() => setIsCreateOpeningModalOpen(true)}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tạo tin tuyển dụng ngay
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO TIN TUYỂN DỤNG MỚI (PORTAL) ================= */}
      {mounted && isCreateOpeningModalOpen && createPortal(
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsCreateOpeningModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> Đăng tin tuyển dụng mới
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tạo vị trí tuyển dụng để công bố chỉ tiêu và tiếp nhận hồ sơ ứng viên vào quy trình ATS.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpeningModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Tiêu đề tin tuyển dụng <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="VD: Kỹ sư Phần mềm Senior Full-Stack..."
                  value={openingTitle}
                  onChange={(e) => setOpeningTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Phòng ban / Đơn vị</label>
                  <input
                    type="text"
                    placeholder="VD: Phòng Phát triển Phần mềm..."
                    value={openingDept}
                    onChange={(e) => setOpeningDept(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Chức danh tuyển dụng</label>
                  <input
                    type="text"
                    placeholder="VD: Senior Software Engineer..."
                    value={openingDesignation}
                    onChange={(e) => setOpeningDesignation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Chỉ tiêu (Người)</label>
                  <input
                    type="number"
                    min={1}
                    value={openingVacancies}
                    onChange={(e) => setOpeningVacancies(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Kinh nghiệm tối thiểu (Năm)</label>
                  <input
                    type="number"
                    min={0}
                    value={openingMinExp}
                    onChange={(e) => setOpeningMinExp(Math.max(0, Number(e.target.value)))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Hạn nhận hồ sơ</label>
                  <input
                    type="date"
                    value={openingClosingDate}
                    onChange={(e) => setOpeningClosingDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Khung lương công bố</label>
                <input
                  type="text"
                  placeholder="VD: 25.000.000 - 45.000.000 VND hoặc Thỏa thuận"
                  value={openingSalary}
                  onChange={(e) => setOpeningSalary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Mô tả chi tiết công việc <span className="text-rose-500">*</span></label>
                <textarea
                  rows={3}
                  placeholder="Nêu trách nhiệm chính, phạm vi dự án, công nghệ sử dụng..."
                  value={openingDesc}
                  onChange={(e) => setOpeningDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Yêu cầu đối với ứng viên</label>
                <textarea
                  rows={2}
                  placeholder="Kỹ năng bắt buộc, trình độ học vấn, ngoại ngữ..."
                  value={openingReqs}
                  onChange={(e) => setOpeningReqs(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpeningModalOpen(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={!openingTitle.trim() || !openingDesc.trim() || createOpeningMutation.isPending}
                onClick={() =>
                  createOpeningMutation.mutate({
                    title: openingTitle.trim(),
                    department: openingDept.trim() || undefined,
                    designation: openingDesignation.trim() || undefined,
                    vacancies: Number(openingVacancies) || 1,
                    minExperience: Number(openingMinExp) || 0,
                    salaryRange: openingSalary.trim() || undefined,
                    description: openingDesc.trim(),
                    requirements: openingReqs.trim() || undefined,
                    closingDate: openingClosingDate ? new Date(openingClosingDate).toISOString() : undefined,
                  })
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {createOpeningMutation.isPending ? 'Đang tạo...' : 'Đăng tin tuyển dụng'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL TIẾP NHẬN ỨNG VIÊN MỚI (PORTAL) ================= */}
      {mounted && isCreateApplicantModalOpen && createPortal(
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsCreateApplicantModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" /> Tiếp nhận hồ sơ ứng viên
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Thêm ứng viên trực tiếp vào giai đoạn Ứng tuyển mới (APPLIED) của bảng Kanban ATS.
                </p>
              </div>
              <button
                onClick={() => setIsCreateApplicantModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Vị trí tuyển dụng ứng tuyển <span className="text-rose-500">*</span></label>
                <select
                  value={appJobOpeningId}
                  onChange={(e) => setAppJobOpeningId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                >
                  <option value="">-- Chọn vị trí tuyển dụng --</option>
                  {openings?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} ({o.department ?? 'Chung'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Họ và tên ứng viên <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn An"
                  value={appCandidateName}
                  onChange={(e) => setAppCandidateName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Địa chỉ Email <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    placeholder="candidate@example.com"
                    value={appEmail}
                    onChange={(e) => setAppEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={appPhone}
                    onChange={(e) => setAppPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Đường dẫn CV / Hồ sơ năng lực</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={appResumeUrl}
                  onChange={(e) => setAppResumeUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Ghi chú ban đầu (Nguồn kênh, điểm nhấn...)</label>
                <textarea
                  rows={2}
                  placeholder="VD: Ứng viên nộp qua LinkedIn, có chứng chỉ AWS Solution Architect..."
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateApplicantModalOpen(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={!appJobOpeningId || !appCandidateName.trim() || !appEmail.trim() || createApplicantMutation.isPending}
                onClick={() =>
                  createApplicantMutation.mutate({
                    jobOpeningId: appJobOpeningId,
                    candidateName: appCandidateName.trim(),
                    email: appEmail.trim(),
                    phone: appPhone.trim() || undefined,
                    resumeUrl: appResumeUrl.trim() || undefined,
                    notes: appNotes.trim() || undefined,
                  })
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {createApplicantMutation.isPending ? 'Đang tiếp nhận...' : 'Tiếp nhận ứng viên'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL XEM CHI TIẾT ỨNG VIÊN (PORTAL) ================= */}
      {mounted && isApplicantDetailModalOpen && selectedApplicant && createPortal(
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsApplicantDetailModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 text-foreground">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                  {selectedApplicant.candidateName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedApplicant.candidateName}</h3>
                  <p className="text-xs text-primary font-semibold">{selectedApplicant.jobOpening?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsApplicantDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Contact & Rating */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground">Email:</span>
                <p className="font-bold text-foreground">{selectedApplicant.email}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground">Điện thoại:</span>
                <p className="font-bold text-foreground">{selectedApplicant.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="col-span-2 p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground text-[11px] font-semibold">Điểm đánh giá ứng viên:</span>
                  <p className="text-sm font-extrabold text-foreground mt-0.5 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span>{selectedApplicant.rating} / 5.0</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium">Giai đoạn hiện tại:</span>
                  <Select
                    value={selectedApplicant.stage}
                    onChange={(e) => {
                      const newStage = e.target.value as JobApplicant['stage'];
                      updateStageMutation.mutate({ id: selectedApplicant.id, stage: newStage });
                      setSelectedApplicant({ ...selectedApplicant, stage: newStage });
                    }}
                    className="w-[200px] text-xs font-bold"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsInterviewModalOpen(true);
                  setIsApplicantDetailModalOpen(false);
                }}
                className="text-xs"
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
                className="text-xs"
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
        </div>,
        document.body
      )}

      {/* ================= MODAL XEM CHI TIẾT TIN TUYỂN DỤNG (PORTAL) ================= */}
      {mounted && isOpeningDetailModalOpen && selectedOpening && createPortal(
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpeningDetailModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 text-foreground">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/50 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{selectedOpening.title}</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedOpening.status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {selectedOpening.status === 'OPEN' ? 'Đang tuyển (OPEN)' : selectedOpening.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {selectedOpening.department ?? 'Phòng Nhân sự'} • Chức danh: {selectedOpening.designation}
                </p>
              </div>

              <button
                onClick={() => setIsOpeningDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" /> Chỉ tiêu tuyển dụng
                </span>
                <p className="text-base font-bold text-foreground mt-1">{selectedOpening.vacancies} nhân sự</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Mức lương công bố
                </span>
                <p className="text-base font-bold text-foreground mt-1">{selectedOpening.salaryRange ?? 'Thỏa thuận'}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-purple-600" /> Yêu cầu kinh nghiệm
                </span>
                <p className="text-base font-bold text-foreground mt-1">{selectedOpening.minExperience}+ năm</p>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Mô tả chi tiết công việc
              </h4>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-foreground leading-relaxed whitespace-pre-line">
                {selectedOpening.description}
              </div>
            </div>

            {/* Applicants applied */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Hồ sơ ứng viên ứng tuyển ({applicants?.filter((a) => a.jobOpeningId === selectedOpening.id).length ?? 0})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpeningId(selectedOpening.id);
                    setActiveTab('kanban');
                    setIsOpeningDetailModalOpen(false);
                  }}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Xem trên Bảng Kanban →
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(applicants?.filter((a) => a.jobOpeningId === selectedOpening.id) ?? []).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{app.candidateName}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          <span>{app.rating}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{app.email} {app.phone ? `· ${app.phone}` : ''}</p>
                    </div>

                    <span className="text-xs font-medium text-muted-foreground">
                      {STAGES.find((s) => s.key === app.stage)?.label ?? app.stage}
                    </span>
                  </div>
                ))}

                {(applicants?.filter((a) => a.jobOpeningId === selectedOpening.id).length ?? 0) === 0 && (
                  <div className="p-4 rounded-xl border border-dashed border-border/60 text-center text-muted-foreground">
                    Chưa có ứng viên nộp hồ sơ cho vị trí này.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpeningDetailModalOpen(false)}
                className="text-xs"
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
                className="text-xs font-semibold"
              >
                Lọc trên Bảng Kanban
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL CHẤM ĐIỂM PHỎNG VẤN (PORTAL) ================= */}
      {mounted && isInterviewModalOpen && selectedApplicant && createPortal(
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsInterviewModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between border-b border-border/50 pb-2">
              <div>
                <h2 className="text-base font-bold text-foreground">Chấm Điểm Phỏng Vấn (Scorecard)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ứng viên: <b className="text-foreground">{selectedApplicant.candidateName}</b>
                </p>
              </div>
              <button
                onClick={() => setIsInterviewModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Vòng phỏng vấn</label>
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Người phỏng vấn</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Điểm số đánh giá (Thang 100)</label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Nhận xét chi tiết & Đánh giá năng lực</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInterviewModalOpen(false)}
                className="text-xs"
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
                className="text-xs font-semibold disabled:opacity-50"
              >
                {addInterviewMutation.isPending ? 'Đang lưu...' : 'Lưu Đánh Giá Phỏng Vấn'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL GỬI OFFER (PORTAL) ================= */}
      {mounted && isOfferModalOpen && selectedApplicant && createPortal(
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOfferModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between border-b border-border/50 pb-2">
              <div>
                <h2 className="text-base font-bold text-foreground">Tạo Thư Mời Nhận Việc (Job Offer)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ứng viên: <b className="text-foreground">{selectedApplicant.candidateName}</b>
                </p>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Chức danh công việc</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Mức lương đề xuất (VND/tháng)</label>
                <input
                  type="number"
                  value={offeredSalary}
                  onChange={(e) => setOfferedSalary(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden font-bold text-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOfferModalOpen(false)}
                className="text-xs"
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {createOfferMutation.isPending ? 'Đang gửi...' : 'Gửi Thư Mời Nhận Việc'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
