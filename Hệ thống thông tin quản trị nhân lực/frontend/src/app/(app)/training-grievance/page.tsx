'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap, MessageSquareWarning, Plus, CheckCircle2,
  Calendar, Layers, Clock, ShieldCheck, MapPin, Users, HelpCircle, X, BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge, Button } from '@/components/ui/primitives';

interface TrainingProgram {
  id: string;
  name: string;
  trainerName: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  description?: string;
  _count?: { feedbacks: number };
}

interface Grievance {
  id: string;
  userId: string;
  employeeName: string;
  subject: string;
  category: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  createdAt: string;
}

export default function TrainingGrievancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'training' | 'grievance'>('training');
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isProgramDetailModalOpen, setIsProgramDetailModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);

  // Form Training
  const [progName, setProgName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [location, setLocation] = useState('Phòng Đào tạo A1');
  const [startDate, setStartDate] = useState('2026-09-15');
  const [endDate, setEndDate] = useState('2026-09-16');

  // Form Grievance
  const [grievanceSubject, setGrievanceSubject] = useState('');
  const [grievanceCategory, setGrievanceCategory] = useState('WORK_ENVIRONMENT');
  const [grievanceDesc, setGrievanceDesc] = useState('');

  const { data: programs, isLoading: isLoadingPrograms } = useQuery<TrainingProgram[]>({
    queryKey: ['hrms-training-programs'],
    queryFn: async () => (await api.get('/hrms/training/programs')).data,
  });

  const { data: grievances, isLoading: isLoadingGrievances } = useQuery<Grievance[]>({
    queryKey: ['hrms-grievances'],
    queryFn: async () => (await api.get('/hrms/training/grievances')).data,
  });

  const createProgramMutation = useMutation({
    mutationFn: async (payload: { name: string; trainerName: string; location: string; startDate: string; endDate: string }) => {
      return (await api.post('/hrms/training/programs', {
        ...payload,
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-training-programs'] });
      setIsTrainingModalOpen(false);
      setProgName('');
    },
  });

  const createGrievanceMutation = useMutation({
    mutationFn: async (payload: { subject: string; category: string; description: string }) => {
      return (await api.post('/hrms/training/grievances', {
        userId: 'temp-user',
        employeeName: 'Nguyễn Văn An',
        ...payload,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-grievances'] });
      setIsGrievanceModalOpen(false);
      setGrievanceSubject('');
      setGrievanceDesc('');
    },
  });

  if (isLoadingPrograms || isLoadingGrievances) {
    return <LoadingState text="Đang tải dữ liệu Đào tạo & Khiếu nại..." />;
  }

  const activeProgramsCount = programs?.length ?? 0;
  const pendingGrievancesCount = grievances?.filter((g) => g.status === 'OPEN' || g.status === 'INVESTIGATING').length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Phát Triển Đào Tạo & Tiếp Nhận Khiếu Nại"
        description="Lập kế hoạch đào tạo phát triển năng lực nhân viên, theo dõi khảo sát chất lượng khóa học và cổng tiếp nhận xử lý khiếu nại minh bạch (Labor Code Compliance)."
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Đào tạo & Khiếu nại' }]}
        actions={
          <div className="flex gap-2">
            {activeTab === 'training' ? (
              <button
                onClick={() => setIsTrainingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Mở Khóa Đào Tạo Mới
              </button>
            ) : (
              <button
                onClick={() => setIsGrievanceModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Gửi Kiến Nghị Mới
              </button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Chương Trình Đào Tạo"
          value={activeProgramsCount}
          subtitle="Khóa học đang tổ chức"
          icon={GraduationCap}
          colorScheme="blue"
        />
        <NumberCard
          title="Kiến Nghị Đang Xử Lý"
          value={pendingGrievancesCount}
          subtitle="Cần giải quyết theo quy định"
          icon={MessageSquareWarning}
          colorScheme="amber"
        />
        <NumberCard
          title="Tỷ Lệ Tham Gia Khóa Học"
          value="94.2%"
          subtitle="Tỷ lệ chuyên cần đạt chuẩn"
          icon={ShieldCheck}
          colorScheme="emerald"
          trend={{ value: '+4.2%', isPositive: true }}
        />
        <NumberCard
          title="Đánh Giá Hài Lòng Khóa Học"
          value="4.9 / 5.0"
          subtitle="Khảo sát sau đào tạo"
          icon={CheckCircle2}
          colorScheme="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('training')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'training'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Chương Trình Đào Tạo ({programs?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('grievance')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'grievance'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquareWarning className="h-4 w-4" />
          Kiến Nghị & Khiếu Nại ({grievances?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Training */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs?.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProgram(p);
                setIsProgramDetailModalOpen(true);
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-blue-700 font-semibold mt-0.5">Giảng viên: {p.trainerName}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                    {p.maxParticipants} Học viên
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{p.location ?? 'Phòng Hội thảo trực tuyến'}</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs">
                  <span className="text-slate-500 text-[11px]">Thời gian diễn ra:</span>
                  <p className="font-medium text-slate-800">
                    {new Date(p.startDate).toLocaleDateString('vi-VN')} - {new Date(p.endDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Khảo sát phản hồi: <b className="text-slate-900">{p._count?.feedbacks ?? 0} lượt</b></span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProgram(p);
                    setIsProgramDetailModalOpen(true);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Xem danh sách →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Grievance */}
      {activeTab === 'grievance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grievances?.map((g) => (
            <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{g.subject}</h3>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">Người gửi: {g.employeeName}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    g.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : g.status === 'INVESTIGATING'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  {g.status === 'RESOLVED' ? 'Đã giải quyết' : g.status === 'INVESTIGATING' ? 'Đang điều tra' : 'Tiếp nhận mới'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{g.description}</p>

              {g.resolution && (
                <div className="bg-emerald-50/70 border border-emerald-300 p-2.5 rounded-xl text-xs">
                  <span className="font-bold text-emerald-800">Kết quả giải quyết:</span>
                  <p className="text-slate-700 mt-0.5">{g.resolution}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                Tiếp nhận ngày: {new Date(g.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL XEM CHI TIẾT CHƯƠNG TRÌNH ĐÀO TẠO ================= */}
      {isProgramDetailModalOpen && selectedProgram && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedProgram.name}</h3>
                <p className="text-xs text-blue-700 font-semibold mt-0.5">Giảng viên: {selectedProgram.trainerName}</p>
              </div>
              <button
                onClick={() => setIsProgramDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Địa điểm tổ chức:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedProgram.location ?? 'Hội trường trực tuyến'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Chỉ tiêu tham gia:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedProgram.maxParticipants} học viên</p>
              </div>
              <div className="col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Thời gian khóa học:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  Từ {new Date(selectedProgram.startDate).toLocaleDateString('vi-VN')} đến {new Date(selectedProgram.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-900 uppercase text-[11px]">Nội dung khóa học:</span>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                {selectedProgram.description || 'Chương trình đào tạo nâng cao năng lực chuyên môn, quy trình vận hành và kỹ năng chuyển đổi số cho nhân sự toàn công ty.'}
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProgramDetailModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Khóa Đào Tạo */}
      {isTrainingModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900">Tạo Chương Trình Đào Tạo Mới</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Tên khóa đào tạo</label>
                <input
                  type="text"
                  placeholder="VD: Khóa An toàn Thông tin & ISO 27001..."
                  value={progName}
                  onChange={(e) => setProgName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Giảng viên / Đơn vị đào tạo</label>
                <input
                  type="text"
                  placeholder="VD: Chuyên gia An ninh mạng..."
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Địa điểm / Phòng học</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-800">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTrainingModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={createProgramMutation.isPending || !progName || !trainerName}
                onClick={() =>
                  createProgramMutation.mutate({
                    name: progName,
                    trainerName,
                    location,
                    startDate,
                    endDate,
                  })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {createProgramMutation.isPending ? 'Đang tạo...' : 'Tạo Khóa Đào Tạo'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gửi Khiếu Nại */}
      {isGrievanceModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900">Gửi Ý Kiến & Khiếu Nại</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Tiêu đề kiến nghị</label>
                <input
                  type="text"
                  placeholder="VD: Đề xuất cải thiện ánh sáng văn phòng..."
                  value={grievanceSubject}
                  onChange={(e) => setGrievanceSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Nội dung chi tiết</label>
                <textarea
                  rows={4}
                  placeholder="Mô tả cụ thể sự việc, đề xuất hướng giải quyết..."
                  value={grievanceDesc}
                  onChange={(e) => setGrievanceDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGrievanceModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={createGrievanceMutation.isPending || !grievanceSubject || !grievanceDesc}
                onClick={() =>
                  createGrievanceMutation.mutate({
                    subject: grievanceSubject,
                    category: grievanceCategory,
                    description: grievanceDesc,
                  })
                }
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {createGrievanceMutation.isPending ? 'Đang gửi...' : 'Gửi Khiếu Nại'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
