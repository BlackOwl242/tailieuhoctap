'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, Clock, Plus, Search, Filter, Users, ShieldCheck, CheckCircle2,
  Calendar, Layers, UserCheck, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge } from '@/components/ui/primitives';

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
  const [activeTab, setActiveTab] = useState<'roster' | 'types' | 'assignments'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Form state ca mới
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  // Form state phân ca
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');

  const { data: shiftTypes, isLoading: isLoadingTypes, isError: isErrorTypes } = useQuery<ShiftType[]>({
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

  const createTypeMutation = useMutation({
    mutationFn: async (payload: { name: string; startTime: string; endTime: string; color: string; description: string }) => {
      return (await api.post('/hrms/shifts/types', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-shift-types'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-roster'] });
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
    },
  });

  const assignShiftMutation = useMutation({
    mutationFn: async (payload: { userId: string; shiftTypeId: string; startDate: string }) => {
      return (await api.post('/hrms/shifts/assignments', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-roster'] });
      setIsAssignModalOpen(false);
    },
  });

  if (isLoadingTypes || isLoadingRoster) return <LoadingState text="Đang tải dữ liệu Ca kíp & Bảng phân ca..." />;
  if (isErrorTypes) return <ErrorState message="Không thể tải danh sách ca làm việc." />;

  const filteredUsers = rosterData?.users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản lý Ca kíp & Bảng phân ca"
        description="Định nghĩa loại ca làm việc, dung sai thời gian chấm công, ma trận phân ca tuần/tháng và tự động hóa theo dõi chuyên cần."
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Ca kíp & Bảng công' }]}
        actions={
          <>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors shadow-2xs"
            >
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Phân ca Nhân sự
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Ca Mới
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Loại Ca Hoạt Động"
          value={shiftTypes?.length ?? 0}
          subtitle="Ca chuẩn & ca xoay vòng"
          icon={Clock}
          colorScheme="blue"
        />
        <NumberCard
          title="Nhân Sự Đã Phân Ca"
          value={rosterData?.assignments.length ?? 0}
          subtitle="Áp dụng trong tháng"
          icon={Users}
          colorScheme="emerald"
          trend={{ value: '100%', isPositive: true, label: 'định biên' }}
        />
        <NumberCard
          title="Dung Sai Đi Trễ"
          value="15 phút"
          subtitle="Áp dụng ca hành chính"
          icon={CalendarDays}
          colorScheme="amber"
        />
        <NumberCard
          title="Tỷ Lệ Đúng Giờ"
          value="96.4%"
          subtitle="So với tuần trước"
          icon={ShieldCheck}
          colorScheme="purple"
          trend={{ value: '+2.1%', isPositive: true }}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'roster'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Ma Trận Phân Ca (Roster Matrix)
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'types'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Danh Mục Loại Ca ({shiftTypes?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Ma Trận Phân Ca */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm nhân viên theo tên, mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="info">Ca Hành chính</Badge>
              <Badge variant="success">Ca Sáng</Badge>
              <Badge variant="warning">Ca Chiều</Badge>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/40 border-b text-muted-foreground uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nhân sự</th>
                    <th className="py-3 px-3">Phòng ban</th>
                    <th className="py-3 px-3">Chức danh</th>
                    <th className="py-3 px-3 text-center">Thứ 2</th>
                    <th className="py-3 px-3 text-center">Thứ 3</th>
                    <th className="py-3 px-3 text-center">Thứ 4</th>
                    <th className="py-3 px-3 text-center">Thứ 5</th>
                    <th className="py-3 px-3 text-center">Thứ 6</th>
                    <th className="py-3 px-3 text-center">Thứ 7</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {u.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold leading-tight">{u.fullName}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{u.employeeCode ?? 'NV'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{u.orgUnit?.name ?? 'Ban Tổ chức'}</td>
                        <td className="py-3 px-3 text-muted-foreground">{u.jobTitle ?? 'Chuyên viên'}</td>
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, dIdx) => (
                          <td key={dIdx} className="py-3 px-2 text-center">
                            {dIdx < 5 ? (
                              <span className="inline-block rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200">
                                08:00 - 17:00
                              </span>
                            ) : (
                              <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500 border border-slate-200">
                                Nghỉ tuần
                              </span>
                            )}
                          </td>
                        ))}
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

      {/* Tab 2: Danh Mục Loại Ca */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shiftTypes?.map((st) => (
            <div key={st.id} className="rounded-xl border bg-card p-5 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-foreground text-sm">{st.name}</h3>
                </div>
                <Badge variant="success">
                  Hoạt động
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg text-xs">
                <div>
                  <p className="text-muted-foreground text-[11px]">Giờ bắt đầu</p>
                  <p className="font-bold text-foreground">{st.startTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Giờ kết thúc</p>
                  <p className="font-bold text-foreground">{st.endTime}</p>
                </div>
                <div className="mt-2">
                  <p className="text-muted-foreground text-[11px]">Dung sai đi trễ</p>
                  <p className="font-medium text-foreground">{st.lateToleranceMinutes} phút</p>
                </div>
                <div className="mt-2">
                  <p className="text-muted-foreground text-[11px]">Dung sai về sớm</p>
                  <p className="font-medium text-foreground">{st.earlyExitToleranceMinutes} phút</p>
                </div>
              </div>

              {st.description && <p className="text-xs text-muted-foreground leading-relaxed">{st.description}</p>}

              <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Tự động chấm công: <b>{st.enableAutoAttendance ? 'Bật' : 'Tắt'}</b></span>
                <span className="font-semibold text-primary">{st._count?.assignments ?? 0} nhân sự</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Ca Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Thêm Ca Làm Việc Mới</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Tên ca làm việc</label>
                <input
                  type="text"
                  placeholder="VD: Ca Sáng 1, Ca Xoay 2..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-foreground">Màu sắc nhận diện</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border bg-background px-2 py-1 cursor-pointer"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">Mô tả quy chuẩn</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú quy tắc chấm công..."
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={!name || createTypeMutation.isPending}
                onClick={() => createTypeMutation.mutate({ name, startTime, endTime, color, description })}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createTypeMutation.isPending ? 'Đang lưu...' : 'Lưu Ca Làm Việc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phân Ca */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground">Phân Ca Cho Nhân Sự</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Chọn Nhân sự</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {rosterData?.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.employeeCode ?? 'NV'}) - {u.jobTitle ?? 'Chuyên viên'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Chọn Ca Làm Việc</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                >
                  <option value="">-- Chọn ca --</option>
                  {shiftTypes?.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.startTime} - {st.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Ngày bắt đầu áp dụng</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-accent"
              >
                Hủy
              </button>
              <button
                disabled={!selectedUserId || !selectedShiftId || assignShiftMutation.isPending}
                onClick={() =>
                  assignShiftMutation.mutate({
                    userId: selectedUserId,
                    shiftTypeId: selectedShiftId,
                    startDate: new Date(startDate).toISOString(),
                  })
                }
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {assignShiftMutation.isPending ? 'Đang phân ca...' : 'Xác Nhận Phân Ca'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
