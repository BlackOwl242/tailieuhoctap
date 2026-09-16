'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, Clock, Plus, Search, Filter, Users, ShieldCheck, CheckCircle2,
  Calendar, Layers, UserCheck, ArrowRight, Trash2, Edit3, Eye, FileSpreadsheet,
  Check, X, Sparkles, FileText,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge, Button, Select } from '@/components/ui/primitives';
import { DataTable, DataColumn } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';

interface ShiftType {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  lateToleranceMinutes: number;
  earlyExitToleranceMinutes: number;
  color: string;
  enableAutoAttendance: boolean;
  description?: string;
  _count?: { assignments: number };
}

interface ShiftAssignment {
  id: string;
  userId: string;
  startDate: string;
  endDate?: string;
  status: string;
  shiftType: ShiftType;
}

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'roster' | 'types' | 'assignments'>('roster');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Quick cell assignment state
  const [cellAssignmentTarget, setCellAssignmentTarget] = useState<{
    userId: string;
    userName: string;
    dayLabel: string;
    dateStr: string;
  } | null>(null);
  const [cellSelectedShiftId, setCellSelectedShiftId] = useState<string>('');

  // Form state ca mới
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [lateTolerance, setLateTolerance] = useState(15);
  const [earlyExitTolerance, setEarlyExitTolerance] = useState(15);
  const [color, setColor] = useState('#3b82f6');
  const [enableAutoAttendance, setEnableAutoAttendance] = useState(true);
  const [description, setDescription] = useState('');

  // Form state phân ca
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');

  const { data: shiftTypes = [], isLoading: isLoadingTypes } = useQuery<ShiftType[]>({
    queryKey: ['hrms-shift-types'],
    queryFn: async () => (await api.get('/hrms/shifts/types')).data,
  });

  const { data: rosterData, isLoading: isLoadingRoster } = useQuery<{
    shiftTypes: ShiftType[];
    assignments: ShiftAssignment[];
    users: { id: string; fullName: string; employeeCode: string; jobTitle: string; orgUnit?: { name: string } }[];
  }>({
    queryKey: ['hrms-roster'],
    queryFn: async () => (await api.get('/hrms/shifts/roster')).data,
  });

  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery<ShiftAssignment[]>({
    queryKey: ['hrms-assignments'],
    queryFn: async () => (await api.get('/hrms/shifts/assignments')).data,
  });

  // Mutations
  const createTypeMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      startTime: string;
      endTime: string;
      lateToleranceMinutes: number;
      earlyExitToleranceMinutes: number;
      color: string;
      enableAutoAttendance: boolean;
      description?: string;
    }) => {
      return (await api.post('/hrms/shifts/types', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-shift-types'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-roster'] });
      setIsCreateModalOpen(false);
      resetTypeForm();
      toast('Tạo loại ca làm việc mới thành công', 'success');
    },
    onError: () => toast('Lỗi khi tạo ca làm việc', 'error'),
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShiftType> }) => {
      return (await api.patch(`/hrms/shifts/types/${id}`, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-shift-types'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-roster'] });
      setEditingShiftType(null);
      resetTypeForm();
      toast('Cập nhật ca làm việc thành công', 'success');
    },
    onError: () => toast('Lỗi khi cập nhật ca làm việc', 'error'),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/shifts/types/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-shift-types'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-roster'] });
      toast('Đã xóa loại ca làm việc thành công', 'success');
    },
    onError: () => toast('Không thể xóa loại ca đang có nhân sự phân công', 'error'),
  });

  const assignShiftMutation = useMutation({
    mutationFn: async (payload: { userId: string; shiftTypeId: string; startDate: string; endDate?: string }) => {
      return (await api.post('/hrms/shifts/assignments', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-roster'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-assignments'] });
      setIsAssignModalOpen(false);
      setCellAssignmentTarget(null);
      toast('Phân ca làm việc thành công', 'success');
    },
    onError: () => toast('Lỗi khi phân ca làm việc', 'error'),
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/shifts/assignments/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-roster'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-assignments'] });
      toast('Đã hủy phân ca thành công', 'success');
    },
    onError: () => toast('Lỗi khi hủy phân ca', 'error'),
  });

  const resetTypeForm = () => {
    setName('');
    setStartTime('08:00');
    setEndTime('17:00');
    setLateTolerance(15);
    setEarlyExitTolerance(15);
    setColor('#3b82f6');
    setEnableAutoAttendance(true);
    setDescription('');
  };

  const openEditTypeModal = (st: ShiftType) => {
    setEditingShiftType(st);
    setName(st.name);
    setStartTime(st.startTime);
    setEndTime(st.endTime);
    setLateTolerance(st.lateToleranceMinutes);
    setEarlyExitTolerance(st.earlyExitToleranceMinutes);
    setColor(st.color || '#3b82f6');
    setEnableAutoAttendance(st.enableAutoAttendance);
    setDescription(st.description || '');
  };

  if (isLoadingTypes || isLoadingRoster) {
    return <LoadingState text="Đang tải dữ liệu Ca kíp & Bảng phân ca..." />;
  }

  const filteredUsers = rosterData?.users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.orgUnit?.name && u.orgUnit.name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Column definitions for Shift Types
  const shiftTypeColumns: DataColumn<ShiftType>[] = [
    {
      key: 'name',
      header: 'Tên Ca Làm Việc',
      sortable: true,
      render: (st: ShiftType) => (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: st.color || '#3b82f6' }} />
          <div>
            <span className="font-semibold text-foreground text-xs">{st.name}</span>
            <p className="text-xs text-muted-foreground">{st.description || 'Ca làm việc tiêu chuẩn'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'hours',
      header: 'Thời Gian Làm Việc',
      render: (st: ShiftType) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {st.startTime} - {st.endTime}
        </span>
      ),
    },
    {
      key: 'tolerances',
      header: 'Dung Sai Đi Trễ / Về Sớm',
      render: (st: ShiftType) => (
        <span className="text-xs text-muted-foreground">
          Trễ: <b>{st.lateToleranceMinutes}p</b> • Sớm: <b>{st.earlyExitToleranceMinutes}p</b>
        </span>
      ),
    },
    {
      key: 'enableAutoAttendance',
      header: 'Tự Động Chấm Công',
      render: (st: ShiftType) => (
        <span className={`text-xs font-normal px-2 py-0.5 rounded-md border ${
          st.enableAutoAttendance
            ? 'bg-muted text-foreground border-border'
            : 'bg-muted text-muted-foreground border-border'
        }`}>
          {st.enableAutoAttendance ? 'Bật' : 'Tắt'}
        </span>
      ),
    },
    {
      key: 'assignments',
      header: 'Nhân Sự Áp Dụng',
      render: (st: ShiftType) => (
        <span className="text-xs font-semibold text-primary">
          {st._count?.assignments ?? 0} nhân sự
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      render: (st: ShiftType) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditTypeModal(st)}
            className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600"
            title="Sửa"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Bạn có chắc muốn xóa ca làm việc "${st.name}"?`)) {
                deleteTypeMutation.mutate(st.id);
              }
            }}
            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
            title="Xóa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // Column definitions for Assignments Log
  const assignmentColumns: DataColumn<ShiftAssignment>[] = [
    {
      key: 'userId',
      header: 'Nhân sự',
      render: (a: ShiftAssignment) => {
        const user = rosterData?.users.find((u) => u.id === a.userId);
        return (
          <div>
            <span className="font-medium text-xs text-foreground">{user?.fullName || a.userId}</span>
            <p className="text-xs text-muted-foreground">{user?.jobTitle || 'Cán bộ'} · {user?.orgUnit?.name || 'Phòng ban'}</p>
          </div>
        );
      },
    },
    {
      key: 'shiftType',
      header: 'Ca phân công',
      render: (a: ShiftAssignment) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-mono">
          <Clock className="h-3 w-3 text-muted-foreground" />
          {a.shiftType.name} ({a.shiftType.startTime} - {a.shiftType.endTime})
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Thời gian áp dụng',
      render: (a: ShiftAssignment) => (
        <span className="text-xs text-muted-foreground">
          Từ {new Date(a.startDate).toLocaleDateString('vi-VN')} {a.endDate ? `đến ${new Date(a.endDate).toLocaleDateString('vi-VN')}` : '(Vô thời hạn)'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: () => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Đang áp dụng
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (a: ShiftAssignment) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Bạn có chắc muốn hủy phân ca này?')) {
              deleteAssignmentMutation.mutate(a.id);
            }
          }}
          className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-rose-600"
        >
          Hủy phân ca
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      <WorkspaceHeader
        title="Quản Lý Ca Kíp & Bảng Phân Ca"
        description="Định nghĩa loại ca làm việc, dung sai thời gian chấm công, ma trận phân ca tuần/tháng và theo dõi chuyên cần."
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Ca kíp & Bảng công' }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs h-8"
            >
              <UserCheck className="h-3.5 w-3.5 mr-1" />
              Phân ca nhân sự
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetTypeForm();
                setIsCreateModalOpen(true);
              }}
              className="text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Thêm ca mới
            </Button>
          </div>
        }
      />

      {/* Minimalist Metrics Toolbar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg border border-border bg-card text-xs">
        <div>
          <span className="text-muted-foreground block text-xs">Loại ca hoạt động</span>
          <span className="text-base font-semibold text-foreground">{shiftTypes.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">Nhân sự đã phân ca</span>
          <span className="text-base font-semibold text-foreground">{rosterData?.assignments.length ?? 0}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">Dung sai đi trễ</span>
          <span className="text-base font-semibold text-foreground">15 phút</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">Tỷ lệ đúng giờ</span>
          <span className="text-base font-semibold text-foreground">96.4%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-sm">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'roster'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Ma trận phân ca tuần
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'types'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Danh mục ca ({shiftTypes.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Lịch sử phân ca ({assignments.length})
        </button>
      </div>

      {/* ================= TAB 1: MA TRẬN PHÂN CA TUẦN ================= */}
      {activeTab === 'roster' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Lọc nhân viên theo tên, mã NV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden"
              />
            </div>

            {/* Shift legend & Quick Export */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {shiftTypes.slice(0, 3).map((st) => (
                  <span key={st.id} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color || '#64748b' }} />
                    {st.name}
                  </span>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvContent =
                    'STT,Ma_NV,Ho_Va_Ten,Phong_Ban,Chuc_Danh,Thu_2,Thu_3,Thu_4,Thu_5,Thu_6,Thu_7,Chu_Nhat\n' +
                    (filteredUsers || []).map((u, idx) =>
                      `${idx + 1},${u.employeeCode || 'NV'},${u.fullName},${u.orgUnit?.name || 'Phong ban'},${u.jobTitle || 'Chuyen vien'},08:00-17:00,08:00-17:00,08:00-17:00,08:00-17:00,08:00-17:00,Nghi tuan,Nghi tuan`
                    ).join('\n');
                  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `Bang_Phan_Ca_Tuan_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast('Đã xuất ma trận phân ca tuần CSV', 'success');
                }}
                className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground"
              >
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                Xuất CSV
              </Button>
            </div>
          </div>

          {/* Clean Roster Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-medium">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Cán bộ / Nhân sự</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Phòng ban</th>
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((day, dIdx) => (
                      <th key={dIdx} className="py-2.5 px-2 text-center min-w-[95px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-xs text-foreground">{u.fullName}</span>
                          <p className="text-xs text-muted-foreground font-mono">{u.employeeCode || 'NV'} · {u.jobTitle || 'Chuyên viên'}</p>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{u.orgUnit?.name || 'Ban Tổ chức'}</td>

                        {/* 7 Days of the week — CLICK TO EDIT/CHANGE SHIFT */}
                        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((day, dIdx) => {
                          const isWeekend = dIdx >= 5;
                          return (
                            <td
                              key={dIdx}
                              onClick={() => {
                                setCellAssignmentTarget({
                                  userId: u.id,
                                  userName: u.fullName,
                                  dayLabel: day,
                                  dateStr: `2026-09-${String(15 + dIdx).padStart(2, '0')}`,
                                });
                                setCellSelectedShiftId(shiftTypes[0]?.id || '');
                              }}
                              className="py-2 px-1 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                              title={`Bấm để đổi ca: ${day} cho ${u.fullName}`}
                            >
                              {isWeekend ? (
                                <span className="text-xs text-muted-foreground">
                                  Nghỉ
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-foreground hover:underline">
                                  08:00 - 17:00
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy nhân viên phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DANH MỤC LOẠI CA ================= */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shiftTypes.map((st) => (
              <div key={st.id} className="rounded-lg border border-border bg-card p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: st.color || '#64748b' }} />
                    <h3 className="font-medium text-foreground text-xs">{st.name}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Hoạt động
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border py-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">Giờ làm việc</span>
                    <span className="font-mono text-xs text-foreground">{st.startTime} - {st.endTime}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Dung sai trễ/sớm</span>
                    <span className="text-xs text-foreground">{st.lateToleranceMinutes}p / {st.earlyExitToleranceMinutes}p</span>
                  </div>
                </div>

                {st.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{st.description}</p>}

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-xs">{st._count?.assignments ?? 0} nhân sự áp dụng</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditTypeModal(st)}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa ca làm việc "${st.name}"?`)) {
                          deleteTypeMutation.mutate(st.id);
                        }
                      }}
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: LỊCH SỬ & CHI TIẾT PHÂN CA ================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <DataTable
            columns={assignmentColumns}
            rows={assignments}
            rowKey={(a: ShiftAssignment) => a.id}
            pageSize={10}
            searchFields={(a: ShiftAssignment) => [a.shiftType.name, a.userId]}
          />
        </div>
      )}

      {/* ================= MODAL: TẠO / SỬA LOẠI CA ================= */}
      <Modal
        open={isCreateModalOpen || !!editingShiftType}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setEditingShiftType(null);
          }
        }}
        title={editingShiftType ? 'Chỉnh Sửa Ca Làm Việc' : 'Thêm Ca Làm Việc Mới'}
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground">Tên ca làm việc *</label>
            <input
              type="text"
              placeholder="VD: Ca Sáng 1, Ca Hành Chính, Ca Chiều..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">Giờ bắt đầu *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground font-mono focus:border-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Giờ kết thúc *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground font-mono focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">Dung sai đi trễ (phút)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={lateTolerance}
                onChange={(e) => setLateTolerance(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Dung sai về sớm (phút)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={earlyExitTolerance}
                onChange={(e) => setEarlyExitTolerance(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="font-semibold text-foreground">Màu hiển thị nhận diện</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 rounded border border-border p-0.5 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs">{color}</span>
              </div>
            </div>
            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={enableAutoAttendance}
                  onChange={(e) => setEnableAutoAttendance(e.target.checked)}
                  className="rounded border-border"
                />
                Tự động quét chấm công
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground">Mô tả quy chế ca</label>
            <textarea
              rows={3}
              placeholder="Ghi rõ điều kiện bàn giao, thời gian nghỉ giữa giờ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingShiftType(null);
          }}
          confirmLabel={editingShiftType ? 'Lưu Cập Nhật' : 'Tạo Loại Ca'}
          onConfirm={() => {
            if (!name) {
              toast('Vui lòng nhập tên ca làm việc', 'error');
              return;
            }
            if (editingShiftType) {
              updateTypeMutation.mutate({
                id: editingShiftType.id,
                data: {
                  name,
                  startTime,
                  endTime,
                  lateToleranceMinutes: lateTolerance,
                  earlyExitToleranceMinutes: earlyExitTolerance,
                  color,
                  enableAutoAttendance,
                  description,
                },
              });
            } else {
              createTypeMutation.mutate({
                name,
                startTime,
                endTime,
                lateToleranceMinutes: lateTolerance,
                earlyExitToleranceMinutes: earlyExitTolerance,
                color,
                enableAutoAttendance,
                description,
              });
            }
          }}
          disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
        />
      </Modal>

      {/* ================= MODAL: PHÂN CA NHÂN SỰ TOÀN DIỆN ================= */}
      <Modal
        open={isAssignModalOpen}
        onOpenChange={(open) => setIsAssignModalOpen(open)}
        title="Phân Ca Làm Việc Cho Nhân Sự"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground">Chọn Cán bộ / Nhân viên *</label>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1 w-full text-xs"
            >
              <option value="">-- Chọn nhân viên --</option>
              {rosterData?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.employeeCode || 'NV'}) - {u.orgUnit?.name || 'Phòng ban'}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="font-semibold text-foreground">Loại ca phân công *</label>
            <Select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="mt-1 w-full text-xs"
            >
              <option value="">-- Chọn loại ca --</option>
              {shiftTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.startTime} - {st.endTime})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">Ngày bắt đầu *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => setIsAssignModalOpen(false)}
          confirmLabel="Lưu & Phân Ca"
          onConfirm={() => {
            if (!selectedUserId || !selectedShiftId) {
              toast('Vui lòng chọn nhân sự và ca làm việc', 'error');
              return;
            }
            assignShiftMutation.mutate({
              userId: selectedUserId,
              shiftTypeId: selectedShiftId,
              startDate: new Date(startDate).toISOString(),
              endDate: endDate ? new Date(endDate).toISOString() : undefined,
            });
          }}
          disabled={assignShiftMutation.isPending}
        />
      </Modal>

      {/* ================= QUICK MODAL: ĐIỀU CHỈNH CA TẠI Ô MA TRẬN ================= */}
      <Modal
        open={!!cellAssignmentTarget}
        onOpenChange={(open) => {
          if (!open) setCellAssignmentTarget(null);
        }}
        title="Điều Chỉnh Ca Làm Việc Trong Ngày"
        size="sm"
      >
        {cellAssignmentTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1">
              <p className="font-bold text-foreground text-sm">{cellAssignmentTarget.userName}</p>
              <p className="text-muted-foreground">
                Ngày: <b>{cellAssignmentTarget.dayLabel}</b> ({cellAssignmentTarget.dateStr})
              </p>
            </div>

            <div>
              <label className="font-semibold text-foreground">Chọn ca làm việc áp dụng</label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {shiftTypes.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCellSelectedShiftId(st.id)}
                    className={`flex items-center justify-between p-2.5 rounded-md border transition-all text-left ${
                      cellSelectedShiftId === st.id
                        ? 'border-primary bg-primary/10 font-bold text-primary'
                        : 'border-border bg-card hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: st.color || '#3b82f6' }} />
                      <span>{st.name}</span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{st.startTime} - {st.endTime}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <ModalFooterActions
          onCancel={() => setCellAssignmentTarget(null)}
          confirmLabel="Cập Nhật Ca"
          onConfirm={() => {
            if (!cellAssignmentTarget || !cellSelectedShiftId) return;
            assignShiftMutation.mutate({
              userId: cellAssignmentTarget.userId,
              shiftTypeId: cellSelectedShiftId,
              startDate: new Date(cellAssignmentTarget.dateStr).toISOString(),
            });
          }}
          disabled={assignShiftMutation.isPending}
        />
      </Modal>
    </div>
  );
}
