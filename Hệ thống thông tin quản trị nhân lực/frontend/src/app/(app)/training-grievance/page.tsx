'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap, MessageSquareWarning, Plus, CheckCircle2,
  Calendar, Layers, Clock, ShieldCheck, MapPin, Users,
  Search, Filter, LayoutGrid, Table as TableIcon,
  Trash2, Edit3, Eye, Printer, AlertTriangle, ArrowRight,
  Sparkles, Check, X, FileText, Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge, Button, Input, Select, Textarea } from '@/components/ui/primitives';
import { DataTable, DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';
import { printDocumentElement } from '@/components/ui/print';

interface TrainingFeedback {
  id: string;
  userId: string;
  employeeName: string;
  rating: number;
  comments?: string;
  certificateIssued: boolean;
}

interface TrainingProgram {
  id: string;
  name: string;
  trainerName: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  description?: string;
  feedbacks?: TrainingFeedback[];
  _count?: { feedbacks: number };
}

interface Grievance {
  id: string;
  userId: string;
  employeeName: string;
  subject: string;
  category: 'WORK_ENVIRONMENT' | 'HARASSMENT' | 'COMPENSATION' | 'DISPUTE';
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

const CATEGORY_MAP: Record<string, { label: string; badgeColor: string }> = {
  WORK_ENVIRONMENT: { label: 'Môi trường làm việc', badgeColor: 'bg-muted text-muted-foreground border-border' },
  COMPENSATION: { label: 'Chế độ đãi ngộ & Lương', badgeColor: 'bg-muted text-muted-foreground border-border' },
  DISPUTE: { label: 'Tranh chấp nội bộ', badgeColor: 'bg-muted text-muted-foreground border-border' },
  HARASSMENT: { label: 'Quy tắc ứng xử', badgeColor: 'bg-muted text-muted-foreground border-border' },
};

export default function TrainingGrievancePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'training' | 'grievance'>('training');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [trainingStatusFilter, setTrainingStatusFilter] = useState('ALL');
  const [grievanceStatusFilter, setGrievanceStatusFilter] = useState('ALL');

  // Modals state
  const [isCreateProgramOpen, setIsCreateProgramOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isProgramDetailOpen, setIsProgramDetailOpen] = useState(false);
  const [isPrintCertOpen, setIsPrintCertOpen] = useState(false);

  const [isCreateGrievanceOpen, setIsCreateGrievanceOpen] = useState(false);
  const [resolvingGrievance, setResolvingGrievance] = useState<Grievance | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [isPrintGrievanceOpen, setIsPrintGrievanceOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);

  // Form Training
  const [progName, setProgName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [location, setLocation] = useState('Phòng Đào tạo A1');
  const [startDate, setStartDate] = useState('2026-09-20');
  const [endDate, setEndDate] = useState('2026-09-22');
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [progDesc, setProgDesc] = useState('');
  const [progStatus, setProgStatus] = useState<'UPCOMING' | 'ONGOING' | 'COMPLETED'>('UPCOMING');

  // Form Grievance
  const [grievanceUserId, setGrievanceUserId] = useState('');
  const [grievanceSubject, setGrievanceSubject] = useState('');
  const [grievanceCategory, setGrievanceCategory] = useState<'WORK_ENVIRONMENT' | 'HARASSMENT' | 'COMPENSATION' | 'DISPUTE'>('WORK_ENVIRONMENT');
  const [grievanceDesc, setGrievanceDesc] = useState('');

  const { data: employees = [] } = useQuery<{ id: string; fullName: string; employeeCode: string; orgUnit?: { name: string } }[]>({
    queryKey: ['employees-for-grievance'],
    queryFn: async () => (await api.get('/employees')).data,
  });

  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery<TrainingProgram[]>({
    queryKey: ['hrms-training-programs'],
    queryFn: async () => (await api.get('/hrms/training/programs')).data,
  });

  const { data: grievances = [], isLoading: isLoadingGrievances } = useQuery<Grievance[]>({
    queryKey: ['hrms-grievances'],
    queryFn: async () => (await api.get('/hrms/training/grievances')).data,
  });

  // Mutations Training
  const createProgramMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      trainerName: string;
      location: string;
      startDate: string;
      endDate: string;
      maxParticipants: number;
      description: string;
    }) => {
      return (await api.post('/hrms/training/programs', {
        ...payload,
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-training-programs'] });
      setIsCreateProgramOpen(false);
      resetProgramForm();
      toast('Tạo khóa đào tạo mới thành công!', 'success');
    },
    onError: () => toast('Lỗi khi tạo khóa đào tạo', 'error'),
  });

  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TrainingProgram> }) => {
      return (await api.patch(`/hrms/training/programs/${id}`, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-training-programs'] });
      setEditingProgram(null);
      toast('Cập nhật khóa đào tạo thành công!', 'success');
    },
    onError: () => toast('Lỗi khi cập nhật khóa đào tạo', 'error'),
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/training/programs/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-training-programs'] });
      toast('Đã xóa khóa đào tạo thành công!', 'success');
    },
    onError: () => toast('Không thể xóa khóa đào tạo', 'error'),
  });

  // Mutations Grievance
  const createGrievanceMutation = useMutation({
    mutationFn: async (payload: { userId: string; subject: string; category: string; description: string }) => {
      const activeUser = employees.find((e) => e.id === payload.userId) || employees[0];
      return (await api.post('/hrms/training/grievances', {
        userId: activeUser?.id || 'emp-default',
        employeeName: activeUser?.fullName || 'Cán bộ Nhân viên',
        subject: payload.subject,
        category: payload.category,
        description: payload.description,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-grievances'] });
      setIsCreateGrievanceOpen(false);
      resetGrievanceForm();
      toast('Đã ghi nhận ý kiến / khiếu nại của cán bộ nhân viên', 'success');
    },
    onError: () => toast('Lỗi khi gửi khiếu nại', 'error'),
  });

  const resolveGrievanceMutation = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      return (await api.patch(`/hrms/training/grievances/${id}/resolve`, { resolution })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-grievances'] });
      setResolvingGrievance(null);
      setResolutionText('');
      toast('Đã ghi nhận kết quả giải quyết khiếu nại!', 'success');
    },
    onError: () => toast('Lỗi khi giải quyết khiếu nại', 'error'),
  });

  const updateGrievanceStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution?: string }) => {
      return (await api.patch(`/hrms/training/grievances/${id}/status`, { status, resolution })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-grievances'] });
      setResolvingGrievance(null);
      setResolutionText('');
      toast('Cập nhật trạng thái xử lý khiếu nại thành công', 'success');
    },
    onError: () => toast('Lỗi khi cập nhật trạng thái khiếu nại', 'error'),
  });

  const deleteGrievanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/training/grievances/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-grievances'] });
      toast('Đã xóa khiếu nại thành công', 'success');
    },
    onError: () => toast('Không thể xóa khiếu nại', 'error'),
  });

  const resetProgramForm = () => {
    setProgName('');
    setTrainerName('');
    setLocation('Phòng Đào tạo A1');
    setStartDate('2026-09-20');
    setEndDate('2026-09-22');
    setMaxParticipants(30);
    setProgDesc('');
    setProgStatus('UPCOMING');
  };

  const openEditProgramModal = (p: TrainingProgram) => {
    setEditingProgram(p);
    setProgName(p.name);
    setTrainerName(p.trainerName);
    setLocation(p.location || 'Phòng Đào tạo A1');
    setStartDate(p.startDate.slice(0, 10));
    setEndDate(p.endDate.slice(0, 10));
    setMaxParticipants(p.maxParticipants);
    setProgDesc(p.description || '');
    setProgStatus(p.status || 'UPCOMING');
  };

  const resetGrievanceForm = () => {
    setGrievanceUserId(employees[0]?.id || '');
    setGrievanceSubject('');
    setGrievanceCategory('WORK_ENVIRONMENT');
    setGrievanceDesc('');
  };

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = trainingStatusFilter === 'ALL' || (p.status || 'UPCOMING') === trainingStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [programs, searchTerm, trainingStatusFilter]);

  // Filtered Grievances
  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      const matchSearch =
        g.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = grievanceStatusFilter === 'ALL' || g.status === grievanceStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [grievances, searchTerm, grievanceStatusFilter]);

  if (isLoadingPrograms || isLoadingGrievances) {
    return <LoadingState text="Đang tải dữ liệu Đào tạo & Khiếu nại..." />;
  }

  const activeProgramsCount = programs.length;
  const pendingGrievancesCount = grievances.filter((g) => g.status === 'OPEN' || g.status === 'INVESTIGATING').length;

  // Program Columns for DataTable
  const programColumns: DataColumn<TrainingProgram>[] = [
    {
      key: 'name',
      header: 'Chương trình đào tạo',
      sortable: true,
      render: (p: TrainingProgram) => (
        <div>
          <span className="font-medium text-xs text-foreground">{p.name}</span>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {p.location || 'Trực tuyến / Hội trường'}
          </p>
        </div>
      ),
    },
    {
      key: 'trainerName',
      header: 'Giảng viên',
      sortable: true,
      render: (p: TrainingProgram) => <span className="text-xs text-muted-foreground">{p.trainerName}</span>,
    },
    {
      key: 'dates',
      header: 'Thời gian',
      render: (p: TrainingProgram) => (
        <span className="text-xs text-muted-foreground font-mono">
          {new Date(p.startDate).toLocaleDateString('vi-VN')} - {new Date(p.endDate).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'maxParticipants',
      header: 'Học viên',
      sortable: true,
      render: (p: TrainingProgram) => (
        <span className="text-xs text-muted-foreground">
          {p.maxParticipants} người
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (p: TrainingProgram) => {
        const st = p.status || 'UPCOMING';
        const dotColor =
          st === 'COMPLETED' ? 'bg-primary' :
          st === 'ONGOING' ? 'bg-muted-foreground' :
          'bg-muted-foreground/60';
        const label = st === 'COMPLETED' ? 'Đã hoàn thành' : st === 'ONGOING' ? 'Đang diễn ra' : 'Sắp diễn ra';
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            {label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (p: TrainingProgram) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProgram(p);
              setIsProgramDetailOpen(true);
            }}
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            Chi tiết
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditProgramModal(p)}
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Bạn có chắc chắn muốn xóa khóa học "${p.name}"?`)) {
                deleteProgramMutation.mutate(p.id);
              }
            }}
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-rose-600"
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  // Grievance Columns for DataTable
  const grievanceColumns: DataColumn<Grievance>[] = [
    {
      key: 'subject',
      header: 'Kiến nghị / Khiếu nại',
      sortable: true,
      render: (g: Grievance) => (
        <div className="max-w-md">
          <p className="font-medium text-foreground text-xs leading-snug">{g.subject}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{g.description}</p>
        </div>
      ),
    },
    {
      key: 'employeeName',
      header: 'Người gửi',
      sortable: true,
      render: (g: Grievance) => <span className="text-xs text-foreground">{g.employeeName}</span>,
    },
    {
      key: 'category',
      header: 'Phân loại',
      sortable: true,
      render: (g: Grievance) => {
        const cat = CATEGORY_MAP[g.category] || { label: g.category };
        return (
          <span className="text-xs text-muted-foreground">
            {cat.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Tiến độ',
      sortable: true,
      render: (g: Grievance) => {
        const dotColor =
          g.status === 'RESOLVED' ? 'bg-primary' :
          g.status === 'INVESTIGATING' ? 'bg-muted-foreground' :
          g.status === 'DISMISSED' ? 'bg-destructive' :
          'bg-muted-foreground/60';
        const labels: Record<string, string> = {
          OPEN: 'Mới tiếp nhận',
          INVESTIGATING: 'Đang xử lý',
          RESOLVED: 'Đã giải quyết',
          DISMISSED: 'Bác bỏ',
        };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            {labels[g.status] || g.status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày gửi',
      sortable: true,
      render: (g: Grievance) => <span className="text-xs text-muted-foreground font-mono">{new Date(g.createdAt).toLocaleDateString('vi-VN')}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (g: Grievance) => (
        <div className="flex items-center justify-end gap-1">
          {g.status !== 'RESOLVED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResolvingGrievance(g);
                setResolutionText(g.resolution || '');
              }}
              className="text-xs px-2 h-7"
            >
              Giải quyết
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedGrievance(g);
              setIsPrintGrievanceOpen(true);
            }}
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            In
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Bạn có chắc chắn muốn xóa kiến nghị này?`)) {
                deleteGrievanceMutation.mutate(g.id);
              }
            }}
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-rose-600"
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      <WorkspaceHeader
        title="Đào tạo & Khiếu nại"
        description="Kế hoạch đào tạo phát triển năng lực và xử lý kiến nghị của nhân viên."
        breadcrumbs={[{ label: 'Phát triển' }, { label: 'Đào tạo & Khiếu nại' }]}
        actions={
          <div className="flex gap-2">
            {activeTab === 'training' ? (
              <Button
                size="sm"
                onClick={() => {
                  resetProgramForm();
                  setIsCreateProgramOpen(true);
                }}
                className="text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Mở khóa đào tạo
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsCreateGrievanceOpen(true)}
                className="text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Gửi kiến nghị
              </Button>
            )}
          </div>
        }
      />

      {/* Standard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Chương trình đào tạo"
          value={activeProgramsCount}
          subtitle="Khóa học đang & sắp tổ chức"
          icon={GraduationCap}
        />
        <NumberCard
          title="Kiến nghị cần xử lý"
          value={pendingGrievancesCount}
          subtitle="Chờ xác minh & thẩm định"
          icon={MessageSquareWarning}
        />
        <NumberCard
          title="Tỷ lệ tham gia"
          value="94.2%"
          subtitle="Chỉ tiêu hoàn thành mục tiêu"
          icon={Users}
        />
        <NumberCard
          title="Đánh giá hài lòng"
          value="4.9 / 5.0"
          subtitle="Khảo sát chất lượng đào tạo"
          icon={Star}
        />
      </div>

      {/* Main Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border text-sm">
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab('training');
              setSearchTerm('');
            }}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'training'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Chương trình đào tạo ({programs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('grievance');
              setSearchTerm('');
            }}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'grievance'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Kiến nghị & khiếu nại ({grievances.length})
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 pb-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dạng Bảng"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'cards'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dạng Thẻ"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={
              activeTab === 'training'
                ? 'Lọc khóa học, giảng viên, địa điểm...'
                : 'Lọc theo chủ đề, người gửi...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái:</span>
          {activeTab === 'training' ? (
            <Select
              value={trainingStatusFilter}
              onChange={(e) => setTrainingStatusFilter(e.target.value)}
              className="w-[160px] text-xs h-9"
            >
              <option value="ALL">Tất cả ({programs.length})</option>
              <option value="UPCOMING">Sắp tổ chức</option>
              <option value="ONGOING">Đang diễn ra</option>
              <option value="COMPLETED">Đã hoàn thành</option>
            </Select>
          ) : (
            <Select
              value={grievanceStatusFilter}
              onChange={(e) => setGrievanceStatusFilter(e.target.value)}
              className="w-[160px] text-xs h-9"
            >
              <option value="ALL">Tất cả ({grievances.length})</option>
              <option value="OPEN">Mới tiếp nhận</option>
              <option value="INVESTIGATING">Đang xử lý</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="DISMISSED">Bác bỏ</option>
            </Select>
          )}
        </div>
      </div>

      {/* ================= TAB 1: TRAINING PROGRAMS ================= */}
      {activeTab === 'training' && (
        <>
          {filteredPrograms.length === 0 ? (
            <EmptyState
              title="Không tìm thấy chương trình đào tạo phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bấm 'Mở Khóa Đào Tạo Mới' để bắt đầu kế hoạch học tập."
            />
          ) : viewMode === 'table' ? (
            <DataTable
              columns={programColumns}
              rows={filteredPrograms}
              rowKey={(p: TrainingProgram) => p.id}
              pageSize={10}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPrograms.map((p) => {
                const st = p.status || 'UPCOMING';
                const dotColor =
                  st === 'COMPLETED' ? 'bg-primary' :
                  st === 'ONGOING' ? 'bg-muted-foreground' :
                  'bg-muted-foreground/60';
                const statusLabel = st === 'COMPLETED' ? 'Đã hoàn thành' : st === 'ONGOING' ? 'Đang diễn ra' : 'Sắp diễn ra';

                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between shadow-xs hover:border-foreground/20 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            {statusLabel}
                          </span>
                          <h3 className="font-medium text-foreground text-xs mt-0.5 leading-snug">{p.name}</h3>
                          <p className="text-xs text-muted-foreground">GV: {p.trainerName}</p>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {p.maxParticipants} HV
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{p.location || 'Trực tuyến'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {new Date(p.startDate).toLocaleDateString('vi-VN')} - {new Date(p.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      {p.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-xs">
                        Khảo sát: <b className="text-foreground">{p._count?.feedbacks ?? 0}</b>
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProgram(p);
                            setIsProgramDetailOpen(true);
                          }}
                          className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                        >
                          Chi tiết
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditProgramModal(p)}
                          className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa khóa học "${p.name}"?`)) {
                              deleteProgramMutation.mutate(p.id);
                            }
                          }}
                          className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-rose-600"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: GRIEVANCES & LABOR CODE ================= */}
      {activeTab === 'grievance' && (
        <>
          {filteredGrievances.length === 0 ? (
            <EmptyState
              title="Không có kiến nghị hoặc khiếu nại nào"
              description="Hiện tại không có kiến nghị nào cần giải quyết theo bộ lọc hiện tại."
            />
          ) : viewMode === 'table' ? (
            <DataTable
              columns={grievanceColumns}
              rows={filteredGrievances}
              rowKey={(g: Grievance) => g.id}
              pageSize={10}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredGrievances.map((g) => {
                const cat = CATEGORY_MAP[g.category] || { label: g.category };
                const isPending = g.status === 'OPEN' || g.status === 'INVESTIGATING';
                const dotColor =
                  g.status === 'RESOLVED' ? 'bg-primary' :
                  g.status === 'INVESTIGATING' ? 'bg-muted-foreground' :
                  g.status === 'DISMISSED' ? 'bg-destructive' :
                  'bg-muted-foreground/60';
                const statusLabel =
                  g.status === 'RESOLVED' ? 'Đã giải quyết' :
                  g.status === 'INVESTIGATING' ? 'Đang xử lý' :
                  g.status === 'DISMISSED' ? 'Bác bỏ' :
                  'Mới tiếp nhận';

                return (
                  <div
                    key={g.id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between shadow-xs hover:border-foreground/20 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {cat.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                              {statusLabel}
                            </span>
                          </div>
                          <h3 className="font-medium text-foreground text-xs mt-1 leading-snug">{g.subject}</h3>
                          <p className="text-xs text-muted-foreground">Người gửi: {g.employeeName}</p>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-md border border-border">
                        {g.description}
                      </p>

                      {g.resolution && (
                        <div className="bg-muted/30 border border-border p-2.5 rounded-md text-xs space-y-1">
                          <span className="font-medium text-foreground flex items-center gap-1.5 text-xs">
                            Kết quả xử lý:
                          </span>
                          <p className="text-muted-foreground leading-relaxed text-xs">{g.resolution}</p>
                        </div>
                      )}
                    </div>

                    {/* Grievance Action Bar */}
                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {g.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateGrievanceStatusMutation.mutate({ id: g.id, status: 'INVESTIGATING' })}
                            className="text-xs px-2 h-7"
                          >
                            Chuyển xử lý
                          </Button>
                        )}
                        {isPending && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResolvingGrievance(g);
                              setResolutionText(g.resolution || '');
                            }}
                            className="text-xs px-2 h-7"
                          >
                            Giải quyết
                          </Button>
                        )}
                        {isPending && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const reason = prompt('Nhập lý do bác bỏ khiếu nại (theo quy chế công ty):');
                              if (reason) {
                                updateGrievanceStatusMutation.mutate({ id: g.id, status: 'DISMISSED', resolution: reason });
                              }
                            }}
                            className="text-xs px-2 h-7 text-muted-foreground hover:text-foreground"
                          >
                            Bác bỏ
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGrievance(g);
                            setIsPrintGrievanceOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          In
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa kiến nghị này?`)) {
                              deleteGrievanceMutation.mutate(g.id);
                            }
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ================= MODAL: TẠO / SỬA CHƯƠNG TRÌNH ĐÀO TẠO ================= */}
      <Modal
        open={isCreateProgramOpen || !!editingProgram}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateProgramOpen(false);
            setEditingProgram(null);
          }
        }}
        title={editingProgram ? 'Chỉnh Sửa Chương Trình Đào Tạo' : 'Mở Khóa Đào Tạo Mới'}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground">Tên khóa đào tạo *</label>
            <Input
              placeholder="VD: Nâng Cao Năng Lực Bảo Mật & Tiêu Chuẩn ISO 27001"
              value={progName}
              onChange={(e) => setProgName(e.target.value)}
              className="mt-1 h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">Giảng viên / Đơn vị đào tạo *</label>
              <Input
                placeholder="VD: TS. Nguyễn Hoàng Nam / Trung tâm Đào tạo Quốc tế"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Địa điểm tổ chức</label>
              <Input
                placeholder="VD: Phòng Đào tạo A1 / Microsoft Teams"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-foreground">Ngày bắt đầu *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Ngày kết thúc *</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Chỉ tiêu tối đa (Học viên)</label>
              <Input
                type="number"
                min={5}
                max={200}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="mt-1 h-9 text-xs"
              />
            </div>
          </div>

          {editingProgram && (
            <div>
              <label className="font-semibold text-foreground">Trạng thái khóa học</label>
              <Select
                value={progStatus}
                onChange={(e) => setProgStatus(e.target.value as TrainingProgram['status'])}
                className="mt-1 w-full text-xs h-9"
              >
                <option value="UPCOMING">Sắp tổ chức (Upcoming)</option>
                <option value="ONGOING">Đang diễn ra (Ongoing)</option>
                <option value="COMPLETED">Đã hoàn thành (Completed)</option>
              </Select>
            </div>
          )}

          <div>
            <label className="font-semibold text-foreground">Nội dung chi tiết & Mục tiêu đào tạo</label>
            <Textarea
              rows={4}
              placeholder="Mô tả mục tiêu khóa học, đề cương chuyên đề, quyền lợi chứng nhận sau khóa học..."
              value={progDesc}
              onChange={(e) => setProgDesc(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => {
            setIsCreateProgramOpen(false);
            setEditingProgram(null);
          }}
          confirmLabel={editingProgram ? 'Lưu Thay Đổi' : 'Tạo Khóa Đào Tạo'}
          onConfirm={() => {
            if (!progName || !trainerName) {
              toast('Vui lòng điền đầy đủ tên khóa học và giảng viên', 'error');
              return;
            }
            if (editingProgram) {
              updateProgramMutation.mutate({
                id: editingProgram.id,
                data: {
                  name: progName,
                  trainerName,
                  location,
                  startDate: new Date(startDate).toISOString(),
                  endDate: new Date(endDate).toISOString(),
                  maxParticipants,
                  description: progDesc,
                  status: progStatus,
                },
              });
            } else {
              createProgramMutation.mutate({
                name: progName,
                trainerName,
                location,
                startDate,
                endDate,
                maxParticipants,
                description: progDesc,
              });
            }
          }}
          disabled={createProgramMutation.isPending || updateProgramMutation.isPending}
        />
      </Modal>

      {/* ================= MODAL: XEM CHI TIẾT & HỌC VIÊN KHÓA HỌC ================= */}
      <Modal
        open={isProgramDetailOpen}
        onOpenChange={(open) => setIsProgramDetailOpen(open)}
        title={selectedProgram?.name || 'Chi Tiết Khóa Đào Tạo'}
        size="lg"
      >
        {selectedProgram && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-muted-foreground text-xs">Giảng viên:</span>
                <p className="font-bold text-foreground mt-0.5">{selectedProgram.trainerName}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-muted-foreground text-xs">Địa điểm:</span>
                <p className="font-bold text-foreground mt-0.5">{selectedProgram.location || 'Trực tuyến'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-muted-foreground text-xs">Quy mô:</span>
                <p className="font-bold text-foreground mt-0.5">{selectedProgram.maxParticipants} học viên</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-muted-foreground text-xs">Trạng thái:</span>
                <p className="font-bold text-primary mt-0.5">
                  {selectedProgram.status === 'COMPLETED' ? 'Đã hoàn thành' : selectedProgram.status === 'ONGOING' ? 'Đang diễn ra' : 'Sắp tổ chức'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-1">
              <span className="font-bold text-foreground uppercase text-xs">Thời gian diễn ra:</span>
              <p className="text-foreground">
                Từ ngày <b>{new Date(selectedProgram.startDate).toLocaleDateString('vi-VN')}</b> đến ngày{' '}
                <b>{new Date(selectedProgram.endDate).toLocaleDateString('vi-VN')}</b>
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-foreground uppercase text-xs">Đề cương & Mục tiêu đào tạo:</span>
              <p className="p-3 rounded-lg bg-muted/30 border border-border text-foreground leading-relaxed">
                {selectedProgram.description || 'Chương trình đào tạo nâng cao chuyên môn, quy chuẩn vận hành và bảo mật số theo kế hoạch phát triển nhân tài nội bộ.'}
              </p>
            </div>

            {/* Roster & Participant Survey Preview */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground uppercase text-xs">
                  Danh sách Học viên & Điểm danh mẫu ({Math.min(selectedProgram.maxParticipants, 5)} / {selectedProgram.maxParticipants})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrintCertOpen(true)}
                  className="gap-1.5 text-xs h-7"
                >
                  <Printer className="h-3 w-3" />
                  In Danh Sách & Chứng Chỉ
                </Button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="p-2.5">Học viên</th>
                      <th className="p-2.5">Mã NV</th>
                      <th className="p-2.5">Phòng ban</th>
                      <th className="p-2.5 text-center">Chuyên cần</th>
                      <th className="p-2.5 text-center">Khảo sát</th>
                      <th className="p-2.5 text-center">Chứng chỉ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employees.slice(0, 5).map((e, idx) => (
                      <tr key={e.id} className="hover:bg-muted/30">
                        <td className="p-2.5 font-medium text-foreground">{e.fullName}</td>
                        <td className="p-2.5 text-muted-foreground font-mono">{e.employeeCode || `NV000${idx + 1}`}</td>
                        <td className="p-2.5 text-muted-foreground">{e.orgUnit?.name || 'Phòng Kỹ thuật'}</td>
                        <td className="p-2.5 text-center font-medium text-foreground">100%</td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center text-foreground font-medium gap-0.5">
                            <Star className="h-3 w-3 fill-foreground/70 text-foreground/70" /> 5.0
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-muted border border-border px-2 py-0.5 rounded-md">
                            <Check className="h-3 w-3 text-muted-foreground" /> Đã cấp
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <ModalFooterActions
          onCancel={() => setIsProgramDetailOpen(false)}
          cancelLabel="Đóng"
          confirmLabel="Chỉnh Sửa Khóa Học"
          onConfirm={() => {
            if (selectedProgram) {
              setIsProgramDetailOpen(false);
              openEditProgramModal(selectedProgram);
            }
          }}
        />
      </Modal>

      {/* ================= MODAL: GIẢI QUYẾT KIẾN NGHỊ ================= */}
      <Modal
        open={!!resolvingGrievance}
        onOpenChange={(open) => {
          if (!open) setResolvingGrievance(null);
        }}
        title="Xử Lý & Giải Quyết Khiếu Nại Lao Động"
        size="md"
      >
        {resolvingGrievance && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="font-bold text-foreground">Người gửi: {resolvingGrievance.employeeName}</span>
              <p className="text-muted-foreground font-medium">Chủ đề: {resolvingGrievance.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">{resolvingGrievance.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">
                Kết quả xử lý & Căn cứ pháp lý (Bộ luật Lao động / Thỏa ước LĐTT) *
              </label>
              <Textarea
                rows={5}
                placeholder="Ghi nhận phương án khắc phục, thỏa thuận giữa người lao động và người sử dụng lao động, thời hạn hoàn thành các biện pháp cải thiện điều kiện làm việc..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>
        )}

        <ModalFooterActions
          onCancel={() => setResolvingGrievance(null)}
          confirmLabel="Lưu & Hoàn Tất Giải Quyết"
          onConfirm={() => {
            if (!resolutionText.trim()) {
              toast('Vui lòng nhập nội dung giải quyết kiến nghị', 'error');
              return;
            }
            if (resolvingGrievance) {
              resolveGrievanceMutation.mutate({
                id: resolvingGrievance.id,
                resolution: resolutionText,
              });
            }
          }}
          disabled={resolveGrievanceMutation.isPending}
        />
      </Modal>

      {/* ================= MODAL: GỬI KIẾN NGHỊ MỚI ================= */}
      <Modal
        open={isCreateGrievanceOpen}
        onOpenChange={(open) => setIsCreateGrievanceOpen(open)}
        title="Gửi Kiến Nghị & Khiếu Nại Lao Động"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground">Cán bộ / Nhân viên kiến nghị</label>
            <Select
              value={grievanceUserId}
              onChange={(e) => setGrievanceUserId(e.target.value)}
              className="mt-1 w-full text-xs h-9"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode || 'NV'}) - {e.orgUnit?.name || 'Phòng ban'}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="font-semibold text-foreground">Phân loại kiến nghị *</label>
            <Select
              value={grievanceCategory}
              onChange={(e) => setGrievanceCategory(e.target.value as Grievance['category'])}
              className="mt-1 w-full text-xs h-9"
            >
              <option value="WORK_ENVIRONMENT">Môi trường & Điều kiện làm việc</option>
              <option value="COMPENSATION">Chế độ đãi ngộ, tiền lương & bảo hiểm</option>
              <option value="DISPUTE">Tranh chấp phân công công tác & ca kíp</option>
              <option value="HARASSMENT">Văn hóa ứng xử & đạo đức công sở</option>
            </Select>
          </div>

          <div>
            <label className="font-semibold text-foreground">Chủ đề kiến nghị tóm tắt *</label>
            <Input
              placeholder="VD: Đề xuất nâng cấp màn hình làm việc và cải thiện ánh sáng văn phòng"
              value={grievanceSubject}
              onChange={(e) => setGrievanceSubject(e.target.value)}
              className="mt-1 h-9 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Nội dung chi tiết khiếu nại *</label>
            <Textarea
              rows={4}
              placeholder="Trình bày cụ thể sự việc, thời điểm phát sinh, các bằng chứng liên quan và nguyện vọng giải quyết..."
              value={grievanceDesc}
              onChange={(e) => setGrievanceDesc(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => setIsCreateGrievanceOpen(false)}
          confirmLabel="Gửi Kiến Nghị"
          onConfirm={() => {
            if (!grievanceSubject || !grievanceDesc) {
              toast('Vui lòng nhập đầy đủ tiêu đề và nội dung kiến nghị', 'error');
              return;
            }
            createGrievanceMutation.mutate({
              userId: grievanceUserId || employees[0]?.id || 'emp-default',
              subject: grievanceSubject,
              category: grievanceCategory,
              description: grievanceDesc,
            });
          }}
          disabled={createGrievanceMutation.isPending}
        />
      </Modal>

      {/* ================= MODAL IN: DANH SÁCH ĐÀO TẠO & CHỨNG CHỈ (CHUẨN NĐ 30/2020/NĐ-CP) ================= */}
      <Modal
        open={isPrintCertOpen}
        onOpenChange={(open) => setIsPrintCertOpen(open)}
        title="Biểu Mẫu In Chứng Nhận Đào Tạo (Chuẩn Nghị định 30/2020/NĐ-CP)"
        size="lg"
      >
        {selectedProgram && (
          <div
            id="print-training-cert-doc"
            className="print-area font-times bg-white text-black p-6 sm:p-10 rounded-sm border border-neutral-300 shadow-md mx-auto max-w-4xl leading-relaxed text-[13pt] print:p-0 print:border-0 print:shadow-none print:m-0 print:max-w-none"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header Thể thức Văn bản Hành chính theo NĐ 30/2020/NĐ-CP */}
            <div className="flex justify-between items-start pb-4 border-b border-black">
              {/* Bên trái: Tên cơ quan, tổ chức ban hành & Số văn bản */}
              <div className="w-[45%] text-center leading-tight">
                <p className="font-normal text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  TỔNG CÔNG TY CÔNG NGHỆ HRMIS
                </p>
                <p className="font-bold text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  HỘI ĐỒNG ĐÀO TẠO & PHÁT TRIỂN
                </p>
                <div className="w-28 border-b border-black mx-auto mt-1 mb-1.5" />
                <p className="text-[11pt] text-black">
                  Số: {selectedProgram.id?.slice(0, 4).toUpperCase() || '01'}/DS-HĐĐT
                </p>
              </div>

              {/* Bên phải: Quốc hiệu, Tiêu ngữ & Địa danh, ngày tháng năm */}
              <div className="w-[55%] text-center leading-tight">
                <p className="font-bold text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-[12pt] sm:text-[13pt] text-black">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-40 border-b-[1.5px] border-black mx-auto mt-1 mb-1.5" />
                <p className="text-[11.5pt] sm:text-[12pt] italic text-black">
                  Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </p>
              </div>
            </div>

            {/* Tiêu đề văn bản */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-[14pt] sm:text-[15pt] font-bold uppercase tracking-wide text-black">
                DANH SÁCH HỌC VIÊN HOÀN THÀNH CHƯƠNG TRÌNH ĐÀO TẠO
              </h1>
              <p className="text-[12.5pt] sm:text-[13pt] font-bold italic text-black">
                Khóa đào tạo: {selectedProgram.name}
              </p>
              <p className="text-[11.5pt] sm:text-[12pt] italic text-neutral-800">
                (Kèm theo Báo cáo nghiệm thu khóa học số 15/BC-HĐĐT ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()})
              </p>
            </div>

            {/* Thông tin chương trình đào tạo */}
            <div className="space-y-1.5 text-[12pt] sm:text-[12.5pt] leading-relaxed my-4 text-black">
              <p>
                <strong>1. Giảng viên phụ trách:</strong> {selectedProgram.trainerName}
              </p>
              <p>
                <strong>2. Địa điểm tổ chức:</strong> {selectedProgram.location || 'Hội trường Tầng 5 & Trực tuyến qua phòng học số'}
              </p>
              <p>
                <strong>3. Thời gian đào tạo:</strong> Từ ngày{' '}
                {new Date(selectedProgram.startDate).toLocaleDateString('vi-VN')} đến ngày{' '}
                {new Date(selectedProgram.endDate).toLocaleDateString('vi-VN')}
              </p>
              <p>
                <strong>4. Tổng số học viên tham gia và đạt chuẩn:</strong>{' '}
                {Math.min(selectedProgram.maxParticipants, 5)}/{selectedProgram.maxParticipants} cán bộ, nhân viên (Tỷ lệ hoàn thành: 100%).
              </p>
            </div>

            {/* Bảng danh sách học viên chuẩn Nghị định 30 */}
            <div className="my-5 overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[11pt] sm:text-[11.5pt] text-black">
                <thead>
                  <tr className="bg-neutral-100/70 border-b border-black">
                    <th className="border border-black p-2 text-center font-bold w-12">STT</th>
                    <th className="border border-black p-2 text-center font-bold w-24">Mã NV</th>
                    <th className="border border-black p-2 text-center font-bold">Họ và tên học viên</th>
                    <th className="border border-black p-2 text-center font-bold">Đơn vị công tác</th>
                    <th className="border border-black p-2 text-center font-bold w-24">Chuyên cần</th>
                    <th className="border border-black p-2 text-center font-bold w-28">Kết quả</th>
                    <th className="border border-black p-2 text-center font-bold w-24">Ký nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 5).map((e, idx) => (
                    <tr key={e.id}>
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2 text-center">{e.employeeCode || `NV000${idx + 1}`}</td>
                      <td className="border border-black p-2 font-bold">{e.fullName}</td>
                      <td className="border border-black p-2">{e.orgUnit?.name || 'Phòng Kỹ thuật'}</td>
                      <td className="border border-black p-2 text-center">100%</td>
                      <td className="border border-black p-2 text-center">Đạt (Cấp CC)</td>
                      <td className="border border-black p-2 text-center"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chữ ký & Nơi nhận theo Nghị định 30 */}
            <div className="grid grid-cols-2 gap-8 items-start pt-6 text-[12pt] text-black">
              {/* Nơi nhận theo NĐ 30 */}
              <div className="space-y-1 text-left">
                <p className="font-bold italic text-[11pt]">Nơi nhận:</p>
                <ul className="text-[10pt] leading-tight space-y-0.5 list-none pl-2 text-black">
                  <li>- Ban Tổng Giám đốc (để b/c);</li>
                  <li>- Phòng Nhân sự & Kế toán;</li>
                  <li>- Các đơn vị có học viên;</li>
                  <li>- Lưu: VT, HĐĐT.</li>
                </ul>
              </div>

              {/* Chữ ký người ban hành */}
              <div className="text-center space-y-1">
                <p className="font-bold uppercase text-[11.5pt] sm:text-[12pt]">TM. HỘI ĐỒNG ĐÀO TẠO</p>
                <p className="font-bold uppercase text-[11.5pt] sm:text-[12pt]">TRƯỞNG BAN</p>
                <p className="italic text-[10.5pt] text-neutral-600">(Ký, ghi rõ họ tên và đóng dấu)</p>
                <div className="h-16" />
                <p className="font-bold text-[12pt] uppercase">Trần Minh Hoàng</p>
              </div>
            </div>
          </div>
        )}

        <ModalFooterActions
          onCancel={() => setIsPrintCertOpen(false)}
          cancelLabel="Đóng"
          confirmLabel="In Báo Cáo & Danh Sách"
          onConfirm={() => printDocumentElement('print-training-cert-doc')}
        />
      </Modal>

      {/* ================= MODAL IN: BIÊN BẢN GIẢI QUYẾT KHIẾU NẠI (CHUẨN NĐ 30/2020/NĐ-CP) ================= */}
      <Modal
        open={isPrintGrievanceOpen}
        onOpenChange={(open) => setIsPrintGrievanceOpen(open)}
        title="Biên Bản Xử Lý Khiếu Nại Lao Động (Chuẩn Nghị định 30/2020/NĐ-CP)"
        size="lg"
      >
        {selectedGrievance && (
          <div
            id="print-grievance-doc"
            className="print-area font-times bg-white text-black p-6 sm:p-10 rounded-sm border border-neutral-300 shadow-md mx-auto max-w-4xl leading-relaxed text-[13pt] print:p-0 print:border-0 print:shadow-none print:m-0 print:max-w-none"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header Thể thức Văn bản Hành chính theo NĐ 30/2020/NĐ-CP */}
            <div className="flex justify-between items-start pb-4 border-b border-black">
              {/* Bên trái: Tên cơ quan, tổ chức ban hành & Số văn bản */}
              <div className="w-[45%] text-center leading-tight">
                <p className="font-normal text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  TỔNG CÔNG TY CÔNG NGHỆ HRMIS
                </p>
                <p className="font-bold text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  HỘI ĐỒNG ĐỐI THOẠI & GIẢI QUYẾT KN
                </p>
                <div className="w-28 border-b border-black mx-auto mt-1 mb-1.5" />
                <p className="text-[11pt] text-black">
                  Số: {selectedGrievance.id?.slice(0, 4).toUpperCase() || '01'}/BB-GQKNLĐ
                </p>
              </div>

              {/* Bên phải: Quốc hiệu, Tiêu ngữ & Địa danh, ngày tháng năm */}
              <div className="w-[55%] text-center leading-tight">
                <p className="font-bold text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-[12pt] sm:text-[13pt] text-black">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-40 border-b-[1.5px] border-black mx-auto mt-1 mb-1.5" />
                <p className="text-[11.5pt] sm:text-[12pt] italic text-black">
                  Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </p>
              </div>
            </div>

            {/* Tiêu đề biên bản */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-[14pt] sm:text-[15pt] font-bold uppercase tracking-wide text-black">
                BIÊN BẢN HỌP ĐỐI THOẠI & GIẢI QUYẾT KHIẾU NẠI LAO ĐỘNG
              </h1>
              <p className="text-[11.5pt] sm:text-[12pt] italic text-neutral-800">
                (Căn cứ quy định của Bộ luật Lao động số 45/2019/QH14 và Thỏa ước Lao động Tập thể)
              </p>
            </div>

            {/* Nội dung biên bản hành chính */}
            <div className="space-y-4 text-[12pt] sm:text-[12.5pt] leading-relaxed text-black">
              <p className="indent-6">
                Hôm nay, vào hồi {new Date().getHours()} giờ {new Date().getMinutes()} phút, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại Phòng họp số 1 — Trụ sở Tổng công ty HRMIS, Hội đồng đối thoại và giải quyết khiếu nại tiến hành phiên họp giải quyết khiếu nại lao động.
              </p>

              <div className="space-y-1.5">
                <p className="font-bold uppercase text-[12pt]">I. THÀNH PHẦN THAM DỰ:</p>
                <div className="pl-6 space-y-1">
                  <p><strong>1. Đại diện Người sử dụng lao động:</strong> Ông/Bà Trần Minh Hoàng — Giám đốc Điều hành.</p>
                  <p><strong>2. Đại diện Ban Chấp hành Công đoàn cơ sở:</strong> Chủ tịch Công đoàn cơ sở cùng các ủy viên.</p>
                  <p><strong>3. Người có đơn kiến nghị/khiếu nại:</strong> Ông/Bà <strong>{selectedGrievance.employeeName}</strong>.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold uppercase text-[12pt]">II. NỘI DUNG VÀ YÊU CẦU CỦA NGƯỜI LAO ĐỘNG:</p>
                <div className="pl-6 space-y-1">
                  <p><strong>- Tiêu đề kiến nghị:</strong> {selectedGrievance.subject}</p>
                  <p><strong>- Ngày tiếp nhận đơn:</strong> {new Date(selectedGrievance.createdAt).toLocaleDateString('vi-VN')}</p>
                  <p><strong>- Nội dung chi tiết:</strong></p>
                  <div className="p-3 bg-neutral-50 border border-black/40 rounded-sm text-black italic leading-relaxed">
                    &quot;{selectedGrievance.description}&quot;
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold uppercase text-[12pt]">III. KẾT QUẢ ĐỐI THOẠI VÀ BIỆN PHÁP GIẢI QUYẾT:</p>
                <div className="pl-6">
                  <p className="p-3 bg-neutral-50 border border-black/40 rounded-sm text-black leading-relaxed font-medium">
                    {selectedGrievance.resolution ||
                      'Hội đồng hòa giải cơ sở cùng Ban Chấp hành Công đoàn đã đối thoại trực tiếp, làm rõ các căn cứ pháp lý và thống nhất phương án xử lý bảo đảm quyền và lợi ích hợp pháp của người lao động theo đúng quy chế nội bộ.'}
                  </p>
                </div>
              </div>

              <p className="indent-6">
                Biên bản được lập thành 03 bản có giá trị pháp lý như nhau, đã được các bên đọc lại, thống nhất nội dung và cùng ký tên xác nhận dưới đây. Phiên họp kết thúc vào hồi {new Date().getHours() + 1} giờ 30 phút cùng ngày.
              </p>
            </div>

            {/* Chữ ký các bên theo Nghị định 30 */}
            <div className="grid grid-cols-3 gap-4 items-start pt-6 text-[11.5pt] sm:text-[12pt] text-black">
              <div className="text-center space-y-1">
                <p className="font-bold uppercase">NGƯỜI KHIẾU NẠI</p>
                <p className="italic text-[10.5pt] text-neutral-600">(Ký và ghi rõ họ tên)</p>
                <div className="h-16" />
                <p className="font-bold">{selectedGrievance.employeeName}</p>
              </div>

              <div className="text-center space-y-1">
                <p className="font-bold uppercase">ĐẠI DIỆN CÔNG ĐOÀN CƠ SỞ</p>
                <p className="italic text-[10.5pt] text-neutral-600">(Ký và ghi rõ họ tên)</p>
                <div className="h-16" />
                <p className="font-bold">Chủ tịch Công đoàn</p>
              </div>

              <div className="text-center space-y-1">
                <p className="font-bold uppercase">NGƯỜI SỬ DỤNG LAO ĐỘNG</p>
                <p className="italic text-[10.5pt] text-neutral-600">(Ký tên và đóng dấu)</p>
                <div className="h-16" />
                <p className="font-bold uppercase">Giám Đốc Nhân Sự</p>
              </div>
            </div>
          </div>
        )}

        <ModalFooterActions
          onCancel={() => setIsPrintGrievanceOpen(false)}
          cancelLabel="Đóng"
          confirmLabel="In Biên Bản Giải Quyết"
          onConfirm={() => printDocumentElement('print-grievance-doc')}
        />
      </Modal>
    </div>
  );
}
