'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plane, Receipt, CreditCard, Plus, CheckCircle2,
  Calendar, Layers, Clock, DollarSign, ArrowRight, Check,
  X, Trash2, Printer, Eye, Filter, Search, LayoutGrid,
  List, FileText, AlertCircle, Building2, ChevronRight,
  TrendingUp, MapPin, User, Tag, Sparkles
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';
import { Button, Input, Label, Select } from '@/components/ui/primitives';

interface ExpenseItemDetail {
  item: string;
  amount: number;
  date?: string;
}

interface ExpenseClaim {
  id: string;
  userId: string;
  employeeName: string;
  travelRequestId?: string;
  title: string;
  category: string;
  totalAmount: number;
  approvedAmount?: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
  items?: ExpenseItemDetail[];
  receiptUrls?: string[];
  submittedAt?: string;
  createdAt?: string;
  approvedBy?: string;
}

interface TravelRequest {
  id: string;
  userId: string;
  employeeName: string;
  purpose: string;
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  returnDate: string;
  estimatedBudget: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt?: string;
}

interface EmployeeAdvance {
  id: string;
  userId: string;
  employeeName: string;
  amount: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
  disbursedAt?: string;
  createdAt?: string;
  travelRequestId?: string;
}

interface EmployeeOption {
  id: string;
  fullName: string;
  employeeCode?: string | null;
  jobTitle?: string | null;
  orgUnit?: { name: string } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  TRAVEL: 'Công tác & Đi lại',
  MEALS: 'Tiếp khách & Ăn uống',
  EQUIPMENT: 'Mua sắm & Thiết bị',
  ACCOMMODATION: 'Khách sạn & Lưu trú',
  OTHER: 'Chi phí khác',
};

const STATUS_BADGES: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  PENDING: { label: 'Chờ duyệt', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20' },
  APPROVED: { label: 'Đã duyệt', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20' },
  PAID: { label: 'Đã giải ngân', dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20' },
  REJECTED: { label: 'Từ chối', dot: 'bg-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20' },
  COMPLETED: { label: 'Hoàn tất', dot: 'bg-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-500/20' },
  DRAFT: { label: 'Bản nháp', dot: 'bg-muted-foreground', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  CANCELLED: { label: 'Đã hủy', dot: 'bg-muted-foreground', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

function formatSafeDate(dateStr?: string | Date | null): string {
  if (!dateStr) return new Date().toLocaleDateString('vi-VN');
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) {
    return new Date().toLocaleDateString('vi-VN');
  }
  return d.toLocaleDateString('vi-VN');
}

function formatVND(amount?: number): string {
  return (amount || 0).toLocaleString('vi-VN') + ' VND';
}

export default function ExpenseClaimsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'claims' | 'travel' | 'advances'>('claims');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals for Create
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

  // Modals for Detail / View
  const [detailClaim, setDetailClaim] = useState<ExpenseClaim | null>(null);
  const [detailTravel, setDetailTravel] = useState<TravelRequest | null>(null);
  const [detailAdvance, setDetailAdvance] = useState<EmployeeAdvance | null>(null);

  // Print state
  const [printDocument, setPrintDocument] = useState<{
    type: 'CLAIM' | 'TRAVEL' | 'ADVANCE';
    data: any;
  } | null>(null);

  // Form Claim State
  const [claimEmployee, setClaimEmployee] = useState('Nguyễn Văn An');
  const [claimTitle, setClaimTitle] = useState('Thanh quyết toán chi phí công tác');
  const [claimCategory, setClaimCategory] = useState('TRAVEL');
  const [claimItems, setClaimItems] = useState<ExpenseItemDetail[]>([
    { item: 'Vé máy bay khứ hồi (Vietnam Airlines)', amount: 3500000, date: '2026-09-10' },
    { item: 'Phòng khách sạn (3 đêm)', amount: 2000000, date: '2026-09-13' },
  ]);

  // Form Travel State
  const [travelEmployee, setTravelEmployee] = useState('Nguyễn Văn An');
  const [travelPurpose, setTravelPurpose] = useState('Khảo sát và triển khai dự án chi nhánh');
  const [fromLoc, setFromLoc] = useState('TP. Hồ Chí Minh');
  const [toLoc, setToLoc] = useState('TP. Đà Nẵng');
  const [depDate, setDepDate] = useState('2026-09-10');
  const [retDate, setRetDate] = useState('2026-09-14');
  const [estBudget, setEstBudget] = useState(12000000);
  const [travelNotes, setTravelNotes] = useState('Lịch trình gặp gỡ đối tác và kiểm tra hạ tầng kỹ thuật');

  // Form Advance State
  const [advEmployee, setAdvEmployee] = useState('Nguyễn Văn An');
  const [advPurpose, setAdvPurpose] = useState('Tạm ứng vé máy bay và công tác phí TP. Đà Nẵng');
  const [advAmount, setAdvAmount] = useState(8000000);

  // Queries
  const { data: claims = [], isLoading: isLoadingClaims } = useQuery<ExpenseClaim[]>({
    queryKey: ['hrms-expense-claims'],
    queryFn: async () => (await api.get('/hrms/expenses/claims')).data,
  });

  const { data: travels = [], isLoading: isLoadingTravels } = useQuery<TravelRequest[]>({
    queryKey: ['hrms-travel-requests'],
    queryFn: async () => (await api.get('/hrms/expenses/travel-requests')).data,
  });

  const { data: advances = [], isLoading: isLoadingAdvances } = useQuery<EmployeeAdvance[]>({
    queryKey: ['hrms-advances'],
    queryFn: async () => (await api.get('/hrms/expenses/advances')).data,
  });

  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ['hrms-employees-lookup'],
    queryFn: async () => {
      try {
        const res = await api.get('/hrms/employees');
        return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      } catch {
        return [];
      }
    },
  });

  // Calculate sum of claim items
  const calculatedClaimTotal = useMemo(() => {
    return claimItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [claimItems]);

  // Mutations: Claims
  const createClaimMutation = useMutation({
    mutationFn: async (payload: { employeeName: string; title: string; category: string; totalAmount: number; items: ExpenseItemDetail[] }) => {
      return (await api.post('/hrms/expenses/claims', {
        userId: 'system-user',
        ...payload,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-expense-claims'] });
      setIsClaimModalOpen(false);
      toast('Đã lập bảng kê thanh toán chi phí thành công', 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const updateClaimStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return (await api.patch(`/hrms/expenses/claims/${id}/status`, { status })).data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['hrms-expense-claims'] });
      if (detailClaim && detailClaim.id === v.id) {
        setDetailClaim((prev) => prev ? { ...prev, status: v.status as any } : null);
      }
      const label = STATUS_BADGES[v.status]?.label || v.status;
      toast(`Đã cập nhật trạng thái bảng kê thành: ${label}`, 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const deleteClaimMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/expenses/claims/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-expense-claims'] });
      setDetailClaim(null);
      toast('Đã xóa bảng kê chi phí', 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  // Mutations: Travel
  const createTravelMutation = useMutation({
    mutationFn: async (payload: {
      employeeName: string; purpose: string; fromLocation: string; toLocation: string;
      departureDate: string; returnDate: string; estimatedBudget: number; notes?: string;
    }) => {
      return (await api.post('/hrms/expenses/travel-requests', {
        userId: 'system-user',
        ...payload,
        departureDate: new Date(payload.departureDate).toISOString(),
        returnDate: new Date(payload.returnDate).toISOString(),
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-travel-requests'] });
      setIsTravelModalOpen(false);
      toast('Đã gửi đề xuất chuyến công tác thành công', 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const updateTravelStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return (await api.patch(`/hrms/expenses/travel-requests/${id}/status`, { status })).data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['hrms-travel-requests'] });
      if (detailTravel && detailTravel.id === v.id) {
        setDetailTravel((prev) => prev ? { ...prev, status: v.status as any } : null);
      }
      const label = STATUS_BADGES[v.status]?.label || v.status;
      toast(`Đã cập nhật trạng thái công tác: ${label}`, 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const deleteTravelMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/expenses/travel-requests/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-travel-requests'] });
      setDetailTravel(null);
      toast('Đã xóa đề xuất chuyến công tác', 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  // Mutations: Advances
  const createAdvanceMutation = useMutation({
    mutationFn: async (payload: { employeeName: string; purpose: string; amount: number }) => {
      return (await api.post('/hrms/expenses/advances', {
        userId: 'system-user',
        ...payload,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-advances'] });
      setIsAdvanceModalOpen(false);
      toast('Đã tạo đề xuất tạm ứng nhân viên thành công', 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const updateAdvanceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return (await api.patch(`/hrms/expenses/advances/${id}/status`, { status })).data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['hrms-advances'] });
      if (detailAdvance && detailAdvance.id === v.id) {
        setDetailAdvance((prev) => prev ? { ...prev, status: v.status as any } : null);
      }
      const label = STATUS_BADGES[v.status]?.label || v.status;
      toast(`Đã cập nhật trạng thái tạm ứng: ${label}`, 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const deleteAdvanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/expenses/advances/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-advances'] });
      setDetailAdvance(null);
      toast('Đã xóa đề xuất tạm ứng', 'success');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  if (isLoadingClaims || isLoadingTravels || isLoadingAdvances) {
    return <LoadingState text="Đang tải dữ liệu Công tác & Chi phí..." />;
  }

  // Filtered data
  const filteredClaims = claims.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const filteredTravels = travels.filter((t) => {
    const matchSearch =
      t.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredAdvances = advances.filter((a) => {
    const matchSearch =
      a.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Totals
  const totalClaimAmount = claims.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalAdvanceAmount = advances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const pendingApprovalsCount =
    claims.filter((c) => c.status === 'PENDING').length +
    travels.filter((t) => t.status === 'PENDING').length +
    advances.filter((a) => a.status === 'PENDING').length;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Claim Columns for DataTable
  const claimColumns: DataColumn<ExpenseClaim>[] = [
    {
      key: 'title',
      header: 'Tiêu đề / Khoản chi',
      sortable: true,
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-xs hover:text-primary cursor-pointer" onClick={() => setDetailClaim(r)}>
            {r.title}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> {r.employeeName}
          </p>
        </div>
      ),
      exportValue: (r) => `${r.title} - ${r.employeeName}`,
    },
    {
      key: 'category',
      header: 'Danh mục',
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-normal border border-border bg-muted/40 text-foreground">
          <Tag className="h-3 w-3" />
          {CATEGORY_LABELS[r.category] || r.category}
        </span>
      ),
      exportValue: (r) => CATEGORY_LABELS[r.category] || r.category,
    },
    {
      key: 'totalAmount',
      header: 'Số tiền quyết toán',
      sortable: true,
      render: (r) => (
        <span className="font-bold text-emerald-700 text-xs">
          {formatVND(r.totalAmount)}
        </span>
      ),
      exportValue: (r) => r.totalAmount,
    },
    {
      key: 'submittedAt',
      header: 'Ngày nộp',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatSafeDate(r.submittedAt || r.createdAt)}
        </span>
      ),
      exportValue: (r) => formatSafeDate(r.submittedAt || r.createdAt),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (r) => {
        const badge = STATUS_BADGES[r.status] || { label: r.status, dot: 'bg-muted-foreground' };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot || 'bg-muted-foreground'}`} />
            {badge.label}
          </span>
        );
      },
      exportValue: (r) => STATUS_BADGES[r.status]?.label || r.status,
    },
  ];

  // Travel Columns for DataTable
  const travelColumns: DataColumn<TravelRequest>[] = [
    {
      key: 'purpose',
      header: 'Mục đích chuyến đi',
      sortable: true,
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-xs hover:text-primary cursor-pointer" onClick={() => setDetailTravel(r)}>
            {r.purpose}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> {r.employeeName}
          </p>
        </div>
      ),
      exportValue: (r) => `${r.purpose} - ${r.employeeName}`,
    },
    {
      key: 'route',
      header: 'Hành trình',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <span className="font-medium">{r.fromLocation}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{r.toLocation}</span>
        </div>
      ),
      exportValue: (r) => `${r.fromLocation} -> ${r.toLocation}`,
    },
    {
      key: 'departureDate',
      header: 'Thời gian',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatSafeDate(r.departureDate)} - {formatSafeDate(r.returnDate)}
        </span>
      ),
      exportValue: (r) => `${formatSafeDate(r.departureDate)} - ${formatSafeDate(r.returnDate)}`,
    },
    {
      key: 'estimatedBudget',
      header: 'Dự toán',
      sortable: true,
      render: (r) => (
        <span className="font-bold text-foreground text-xs">
          {formatVND(r.estimatedBudget)}
        </span>
      ),
      exportValue: (r) => r.estimatedBudget,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (r) => {
        const badge = STATUS_BADGES[r.status] || { label: r.status, dot: 'bg-muted-foreground' };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot || 'bg-muted-foreground'}`} />
            {badge.label}
          </span>
        );
      },
      exportValue: (r) => STATUS_BADGES[r.status]?.label || r.status,
    },
  ];

  // Advance Columns for DataTable
  const advanceColumns: DataColumn<EmployeeAdvance>[] = [
    {
      key: 'purpose',
      header: 'Mục đích tạm ứng',
      sortable: true,
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-xs hover:text-primary cursor-pointer" onClick={() => setDetailAdvance(r)}>
            {r.purpose}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> {r.employeeName}
          </p>
        </div>
      ),
      exportValue: (r) => `${r.purpose} - ${r.employeeName}`,
    },
    {
      key: 'amount',
      header: 'Số tiền tạm ứng',
      sortable: true,
      render: (r) => (
        <span className="font-bold text-blue-700 text-xs">
          {formatVND(r.amount)}
        </span>
      ),
      exportValue: (r) => r.amount,
    },
    {
      key: 'createdAt',
      header: 'Ngày đề xuất',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatSafeDate(r.createdAt)}
        </span>
      ),
      exportValue: (r) => formatSafeDate(r.createdAt),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (r) => {
        const badge = STATUS_BADGES[r.status] || { label: r.status, dot: 'bg-muted-foreground' };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot || 'bg-muted-foreground'}`} />
            {badge.label}
          </span>
        );
      },
      exportValue: (r) => STATUS_BADGES[r.status]?.label || r.status,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Công tác phí"
        description="Đề xuất chuyến công tác, tạm ứng kinh phí, lập bảng kê thanh quyết toán chi phí."
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Công tác phí' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdvanceModalOpen(true)}
              className="gap-1.5"
            >
              <CreditCard className="h-3.5 w-3.5 text-blue-600" />
              Tạm Ứng Kinh Phí
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTravelModalOpen(true)}
              className="gap-1.5"
            >
              <Plane className="h-3.5 w-3.5 text-purple-600" />
              Đề Xuất Công Tác
            </Button>
            <Button
              size="sm"
              onClick={() => setIsClaimModalOpen(true)}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Lập Bảng Kê Chi Phí
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Tổng Chi Phí Đã Duyệt"
          value={`${(totalClaimAmount / 1_000_000).toFixed(1)} Tr VND`}
          subtitle="Quyết toán thực tế"
          icon={Receipt}
          colorScheme="emerald"
        />
        <NumberCard
          title="Tổng Tạm Ứng Đã Cấp"
          value={`${(totalAdvanceAmount / 1_000_000).toFixed(1)} Tr VND`}
          subtitle="Tạm ứng công tác phí"
          icon={CreditCard}
          colorScheme="blue"
        />
        <NumberCard
          title="Chuyến Công Tác"
          value={travels.length}
          subtitle="Đã lên kế hoạch"
          icon={Plane}
          colorScheme="purple"
        />
        <NumberCard
          title="Hồ Sơ Đang Chờ Duyệt"
          value={pendingApprovalsCount}
          subtitle="Cần phê duyệt & giải ngân"
          icon={CheckCircle2}
          colorScheme={pendingApprovalsCount > 0 ? 'amber' : 'emerald'}
          trend={pendingApprovalsCount === 0 ? { value: '100%', isPositive: true, label: 'hoàn tất' } : undefined}
        />
      </div>

      {/* Tabs & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('claims'); setSearchTerm(''); setStatusFilter('ALL'); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'claims'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Bảng Kê Thanh Toán Chi Phí ({claims.length})
          </button>
          <button
            onClick={() => { setActiveTab('travel'); setSearchTerm(''); setStatusFilter('ALL'); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'travel'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plane className="h-4 w-4" />
            Đơn Đề Xuất Công Tác ({travels.length})
          </button>
          <button
            onClick={() => { setActiveTab('advances'); setSearchTerm(''); setStatusFilter('ALL'); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'advances'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Tạm Ứng Nhân Viên ({advances.length})
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/50 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-all ${
              viewMode === 'cards' ? 'bg-card text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dạng thẻ trực quan"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Thẻ</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-all ${
              viewMode === 'table' ? 'bg-card text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dạng bảng chi tiết"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Bảng dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border border-border/70 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              activeTab === 'claims'
                ? 'Tìm theo khoản chi, nhân viên...'
                : activeTab === 'travel'
                ? 'Tìm theo chuyến đi, nhân viên, điểm đến...'
                : 'Tìm theo mục đích, nhân viên...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background text-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTab === 'claims' && (
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-[180px] text-xs"
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="TRAVEL">Công tác & Đi lại</option>
              <option value="MEALS">Tiếp khách & Ăn uống</option>
              <option value="EQUIPMENT">Mua sắm & Thiết bị</option>
              <option value="ACCOMMODATION">Khách sạn & Lưu trú</option>
              <option value="OTHER">Chi phí khác</option>
            </Select>
          )}

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[160px] text-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ phê duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PAID">Đã giải ngân</option>
            <option value="REJECTED">Từ chối</option>
            {activeTab === 'travel' && <option value="COMPLETED">Hoàn tất</option>}
          </Select>
        </div>
      </div>

      {/* TAB 1: CLAIMS CONTENT */}
      {activeTab === 'claims' && (
        viewMode === 'table' ? (
          <DataTable
            columns={claimColumns}
            rows={filteredClaims}
            rowKey={(r) => r.id}
            searchFields={(r) => [r.title, r.employeeName, r.category]}
            exportFilename="bang-ke-chi-phi"
            actions={(r) => [
              {
                label: 'Xem chi tiết & Hóa đơn',
                icon: Eye,
                onSelect: () => setDetailClaim(r),
              },
              {
                label: 'In Giấy đề nghị thanh toán',
                icon: Printer,
                onSelect: () => setPrintDocument({ type: 'CLAIM', data: r }),
              },
              'separator',
              {
                label: 'Phê duyệt thanh toán',
                icon: Check,
                hidden: r.status === 'APPROVED' || r.status === 'PAID',
                onSelect: () => updateClaimStatusMutation.mutate({ id: r.id, status: 'APPROVED' }),
              },
              {
                label: 'Xác nhận giải ngân / Chi tiền',
                icon: DollarSign,
                hidden: r.status === 'PAID',
                onSelect: () => updateClaimStatusMutation.mutate({ id: r.id, status: 'PAID' }),
              },
              {
                label: 'Từ chối thanh toán',
                icon: X,
                danger: true,
                hidden: r.status === 'REJECTED',
                onSelect: () => updateClaimStatusMutation.mutate({ id: r.id, status: 'REJECTED' }),
              },
              'separator',
              {
                label: 'Xóa hồ sơ bảng kê',
                icon: Trash2,
                danger: true,
                onSelect: () => {
                  if (window.confirm(`Bạn có chắc muốn xóa bảng kê "${r.title}"?`)) {
                    deleteClaimMutation.mutate(r.id);
                  }
                },
              },
            ]}
          />
        ) : (
          filteredClaims.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                title="Không tìm thấy bảng kê chi phí"
                hint="Chưa có hồ sơ thanh toán phù hợp với bộ lọc hiện tại."
              />
              <div className="flex justify-center">
                <Button size="sm" onClick={() => setIsClaimModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Lập bảng kê đầu tiên
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClaims.map((c) => {
                const badge = STATUS_BADGES[c.status] || { label: c.status, bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
                return (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="font-bold text-foreground text-sm hover:text-primary cursor-pointer transition-colors"
                            onClick={() => setDetailClaim(c)}
                          >
                            {c.title}
                          </h3>
                          <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                            <User className="h-3 w-3" /> {c.employeeName}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-normal border border-border bg-muted/40 text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-muted/25 p-3 rounded-md text-xs mt-3 border border-border">
                        <div>
                          <span className="text-muted-foreground text-xs block">Danh mục chi phí:</span>
                          <span className="font-semibold text-foreground">
                            {CATEGORY_LABELS[c.category] || c.category}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Số tiền quyết toán:</span>
                          <span className="font-extrabold text-emerald-700 text-sm">
                            {formatVND(c.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 flex justify-between items-center text-xs text-muted-foreground border-t border-border/40 mt-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Nộp ngày: <strong className="text-foreground font-medium">{formatSafeDate(c.submittedAt || c.createdAt)}</strong>
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                          Chứng từ hợp lệ
                        </span>
                      </div>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailClaim(c)}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Chi tiết</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrintDocument({ type: 'CLAIM', data: c })}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="In Giấy đề nghị thanh toán"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>In</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {c.status !== 'APPROVED' && c.status !== 'PAID' && (
                          <Button
                            size="sm"
                            onClick={() => updateClaimStatusMutation.mutate({ id: c.id, status: 'APPROVED' })}
                            className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Duyệt</span>
                          </Button>
                        )}
                        {c.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            onClick={() => updateClaimStatusMutation.mutate({ id: c.id, status: 'PAID' })}
                            className="h-7 text-xs px-2.5 gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Chi tiền</span>
                          </Button>
                        )}
                        {c.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateClaimStatusMutation.mutate({ id: c.id, status: 'REJECTED' })}
                            className="h-7 text-xs px-2 gap-1 text-rose-600 hover:bg-rose-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Từ chối</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Xóa bảng kê chi phí "${c.title}"?`)) {
                              deleteClaimMutation.mutate(c.id);
                            }
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                          title="Xóa hồ sơ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )
      )}

      {/* TAB 2: TRAVEL REQUESTS CONTENT */}
      {activeTab === 'travel' && (
        viewMode === 'table' ? (
          <DataTable
            columns={travelColumns}
            rows={filteredTravels}
            rowKey={(r) => r.id}
            searchFields={(r) => [r.purpose, r.employeeName, r.fromLocation, r.toLocation]}
            exportFilename="de-xuat-cong-tac"
            actions={(r) => [
              {
                label: 'Xem chi tiết lịch trình',
                icon: Eye,
                onSelect: () => setDetailTravel(r),
              },
              {
                label: 'In Giấy đi đường / Lệnh công tác',
                icon: Printer,
                onSelect: () => setPrintDocument({ type: 'TRAVEL', data: r }),
              },
              'separator',
              {
                label: 'Phê duyệt lịch trình',
                icon: Check,
                hidden: r.status === 'APPROVED' || r.status === 'COMPLETED',
                onSelect: () => updateTravelStatusMutation.mutate({ id: r.id, status: 'APPROVED' }),
              },
              {
                label: 'Đánh dấu Hoàn tất',
                icon: CheckCircle2,
                hidden: r.status === 'COMPLETED',
                onSelect: () => updateTravelStatusMutation.mutate({ id: r.id, status: 'COMPLETED' }),
              },
              {
                label: 'Từ chối đề xuất',
                icon: X,
                danger: true,
                hidden: r.status === 'REJECTED',
                onSelect: () => updateTravelStatusMutation.mutate({ id: r.id, status: 'REJECTED' }),
              },
              'separator',
              {
                label: 'Xóa đề xuất',
                icon: Trash2,
                danger: true,
                onSelect: () => {
                  if (window.confirm(`Xóa đề xuất công tác "${r.purpose}"?`)) {
                    deleteTravelMutation.mutate(r.id);
                  }
                },
              },
            ]}
          />
        ) : (
          filteredTravels.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                title="Không tìm thấy chuyến công tác"
                hint="Chưa có chuyến công tác nào theo bộ lọc tìm kiếm."
              />
              <div className="flex justify-center">
                <Button size="sm" onClick={() => setIsTravelModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Đề xuất chuyến công tác
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTravels.map((t) => {
                const badge = STATUS_BADGES[t.status] || { label: t.status, bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
                return (
                  <div
                    key={t.id}
                    className="rounded-lg border bg-card p-5 shadow-2xs hover:shadow-md transition-all space-y-3.5 border-border/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="font-bold text-foreground text-sm hover:text-primary cursor-pointer transition-colors"
                            onClick={() => setDetailTravel(t)}
                          >
                            {t.purpose}
                          </h3>
                          <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                            <User className="h-3 w-3" /> {t.employeeName}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-normal border border-border bg-muted/40 text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs bg-muted/30 p-2.5 rounded-md my-3 border border-border/40">
                        <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span className="font-semibold text-foreground">{t.fromLocation}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{t.toLocation}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-card p-2 rounded-md border border-border/40">
                        <div>
                          <span className="text-muted-foreground text-xs block">Lịch trình:</span>
                          <span className="font-medium text-foreground">
                            {formatSafeDate(t.departureDate)} - {formatSafeDate(t.returnDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Dự toán kinh phí:</span>
                          <span className="font-extrabold text-foreground text-sm">
                            {formatVND(t.estimatedBudget)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailTravel(t)}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Chi tiết</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrintDocument({ type: 'TRAVEL', data: t })}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="In Giấy đi đường"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>In</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {t.status !== 'APPROVED' && t.status !== 'COMPLETED' && (
                          <Button
                            size="sm"
                            onClick={() => updateTravelStatusMutation.mutate({ id: t.id, status: 'APPROVED' })}
                            className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Duyệt</span>
                          </Button>
                        )}
                        {t.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            onClick={() => updateTravelStatusMutation.mutate({ id: t.id, status: 'COMPLETED' })}
                            className="h-7 text-xs px-2.5 gap-1 bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Hoàn tất</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Xóa đề xuất công tác "${t.purpose}"?`)) {
                              deleteTravelMutation.mutate(t.id);
                            }
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                          title="Xóa đề xuất"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )
      )}

      {/* TAB 3: ADVANCES CONTENT */}
      {activeTab === 'advances' && (
        viewMode === 'table' ? (
          <DataTable
            columns={advanceColumns}
            rows={filteredAdvances}
            rowKey={(r) => r.id}
            searchFields={(r) => [r.purpose, r.employeeName]}
            exportFilename="tam-ung-nhan-vien"
            actions={(r) => [
              {
                label: 'Xem chi tiết tạm ứng',
                icon: Eye,
                onSelect: () => setDetailAdvance(r),
              },
              {
                label: 'In Phiếu chi tạm ứng',
                icon: Printer,
                onSelect: () => setPrintDocument({ type: 'ADVANCE', data: r }),
              },
              'separator',
              {
                label: 'Phê duyệt cấp tạm ứng',
                icon: Check,
                hidden: r.status === 'APPROVED' || r.status === 'PAID',
                onSelect: () => updateAdvanceStatusMutation.mutate({ id: r.id, status: 'APPROVED' }),
              },
              {
                label: 'Giải ngân / Chi tiền mặt/CK',
                icon: DollarSign,
                hidden: r.status === 'PAID',
                onSelect: () => updateAdvanceStatusMutation.mutate({ id: r.id, status: 'PAID' }),
              },
              {
                label: 'Từ chối tạm ứng',
                icon: X,
                danger: true,
                hidden: r.status === 'REJECTED',
                onSelect: () => updateAdvanceStatusMutation.mutate({ id: r.id, status: 'REJECTED' }),
              },
              'separator',
              {
                label: 'Xóa đề xuất',
                icon: Trash2,
                danger: true,
                onSelect: () => {
                  if (window.confirm(`Xóa đề xuất tạm ứng "${r.purpose}"?`)) {
                    deleteAdvanceMutation.mutate(r.id);
                  }
                },
              },
            ]}
          />
        ) : (
          filteredAdvances.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                title="Không tìm thấy đề xuất tạm ứng"
                hint="Chưa có nhân viên nào đề xuất tạm ứng kinh phí."
              />
              <div className="flex justify-center">
                <Button size="sm" onClick={() => setIsAdvanceModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Đề xuất tạm ứng kinh phí
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAdvances.map((a) => {
                const badge = STATUS_BADGES[a.status] || { label: a.status, bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-card p-5 shadow-2xs hover:shadow-md transition-all space-y-3.5 border-border/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="font-bold text-foreground text-sm hover:text-primary cursor-pointer transition-colors"
                            onClick={() => setDetailAdvance(a)}
                          >
                            {a.purpose}
                          </h3>
                          <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                            <User className="h-3 w-3" /> {a.employeeName}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-normal border border-border bg-muted/40 text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="bg-muted/25 p-3 rounded-md text-xs my-3 border border-border">
                        <span className="text-muted-foreground text-xs block">Số tiền tạm ứng kinh phí:</span>
                        <p className="text-lg font-bold text-foreground font-mono">
                          {formatVND(a.amount)}
                        </p>
                      </div>

                      <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Ngày tạo: {formatSafeDate(a.createdAt)}
                        </span>
                        {a.disbursedAt && (
                          <span className="text-emerald-700 font-medium">
                            Giải ngân: {formatSafeDate(a.disbursedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailAdvance(a)}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Chi tiết</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrintDocument({ type: 'ADVANCE', data: a })}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="In Phiếu chi tạm ứng"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>In</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {a.status !== 'APPROVED' && a.status !== 'PAID' && (
                          <Button
                            size="sm"
                            onClick={() => updateAdvanceStatusMutation.mutate({ id: a.id, status: 'APPROVED' })}
                            className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Duyệt</span>
                          </Button>
                        )}
                        {a.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            onClick={() => updateAdvanceStatusMutation.mutate({ id: a.id, status: 'PAID' })}
                            className="h-7 text-xs px-2.5 gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Chi tiền</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Xóa đề xuất tạm ứng "${a.purpose}"?`)) {
                              deleteAdvanceMutation.mutate(a.id);
                            }
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                          title="Xóa đề xuất"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )
      )}

      {/* MODAL 1: Lập Bảng Kê Chi Phí (Tích hợp thêm nhiều dòng hóa đơn chi tiết) */}
      <Modal
        open={isClaimModalOpen}
        onOpenChange={setIsClaimModalOpen}
        title="Lập Bảng Kê Thanh Toán Chi Phí"
        description="Lập bảng kê chi tiết các khoản chi phí phát sinh, đính kèm chứng từ thanh toán phục vụ kiểm toán nội bộ."
        size="lg"
      >
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Họ tên nhân sự đề nghị</Label>
              <Select
                value={claimEmployee}
                onChange={(e) => setClaimEmployee(e.target.value)}
                className="mt-1 w-full text-xs"
              >
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.fullName}>
                      {emp.fullName} {emp.jobTitle ? `(${emp.jobTitle})` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Nguyễn Văn An">Nguyễn Văn An</option>
                    <option value="Võ Tấn Phát">Võ Tấn Phát</option>
                    <option value="Trần Thị Mai">Trần Thị Mai</option>
                    <option value="Lê Hoàng Long">Lê Hoàng Long</option>
                  </>
                )}
              </Select>
            </div>

            <div>
              <Label>Danh mục chi phí</Label>
              <Select
                value={claimCategory}
                onChange={(e) => setClaimCategory(e.target.value)}
                className="mt-1 w-full text-xs"
              >
                <option value="TRAVEL">Công tác & Vé máy bay, Đi lại</option>
                <option value="ACCOMMODATION">Khách sạn & Lưu trú</option>
                <option value="MEALS">Tiếp khách & Ăn uống dự án</option>
                <option value="EQUIPMENT">Mua sắm thiết bị & Văn phòng phẩm</option>
                <option value="OTHER">Chi phí nghiệp vụ khác</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tiêu đề bảng kê thanh toán</Label>
            <Input
              value={claimTitle}
              onChange={(e) => setClaimTitle(e.target.value)}
              placeholder="VD: Thanh quyết toán công tác Đà Nẵng tháng 09/2026"
              className="mt-1 text-xs"
            />
          </div>

          {/* Dynamic Itemized Expenses Builder */}
          <div className="space-y-2 border rounded-md p-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                <Receipt className="h-3.5 w-3.5 text-primary" />
                Bảng kê danh mục chi tiết từng khoản
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setClaimItems([
                    ...claimItems,
                    { item: '', amount: 500000, date: new Date().toISOString().split('T')[0] },
                  ]);
                }}
                className="h-7 text-xs px-2 gap-1"
              >
                <Plus className="h-3 w-3" /> Thêm khoản chi
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {claimItems.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-card p-2 rounded-md border border-border/60">
                  <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder="Mô tả khoản chi (hóa đơn, vé...)"
                    value={it.item}
                    onChange={(e) => {
                      const newItems = [...claimItems];
                      newItems[idx].item = e.target.value;
                      setClaimItems(newItems);
                    }}
                    className="flex-1 rounded border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <input
                    type="date"
                    value={it.date || ''}
                    onChange={(e) => {
                      const newItems = [...claimItems];
                      newItems[idx].date = e.target.value;
                      setClaimItems(newItems);
                    }}
                    className="w-28 rounded border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <input
                    type="number"
                    value={it.amount}
                    onChange={(e) => {
                      const newItems = [...claimItems];
                      newItems[idx].amount = Number(e.target.value);
                      setClaimItems(newItems);
                    }}
                    className="w-32 rounded border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden text-right"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (claimItems.length > 1) {
                        setClaimItems(claimItems.filter((_, i) => i !== idx));
                      }
                    }}
                    className="text-muted-foreground hover:text-rose-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t font-semibold text-xs">
              <span>Tổng số tiền quyết toán:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {formatVND(calculatedClaimTotal)}
              </span>
            </div>
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => setIsClaimModalOpen(false)}
          onConfirm={() => {
            if (!claimTitle.trim()) {
              toast('Vui lòng nhập tiêu đề bảng kê', 'error');
              return;
            }
            createClaimMutation.mutate({
              employeeName: claimEmployee,
              title: claimTitle,
              category: claimCategory,
              totalAmount: calculatedClaimTotal,
              items: claimItems,
            });
          }}
          confirmLabel={createClaimMutation.isPending ? 'Đang lưu...' : 'Nộp Bảng Kê'}
          disabled={createClaimMutation.isPending}
        />
      </Modal>

      {/* MODAL 2: Đề Xuất Công Tác */}
      <Modal
        open={isTravelModalOpen}
        onOpenChange={setIsTravelModalOpen}
        title="Đề Xuất Kế Hoạch Chuyến Công Tác"
        description="Lập lịch trình công tác, dự toán kinh phí và trình cấp có thẩm quyền phê duyệt."
        size="md"
      >
        <div className="space-y-3.5 py-1">
          <div>
            <Label>Họ tên nhân sự công tác</Label>
            <Select
              value={travelEmployee}
              onChange={(e) => setTravelEmployee(e.target.value)}
              className="mt-1 w-full text-xs"
            >
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.fullName}>
                    {emp.fullName} {emp.jobTitle ? `(${emp.jobTitle})` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="Nguyễn Văn An">Nguyễn Văn An</option>
                  <option value="Võ Tấn Phát">Võ Tấn Phát</option>
                  <option value="Trần Thị Mai">Trần Thị Mai</option>
                </>
              )}
            </Select>
          </div>

          <div>
            <Label>Mục đích chuyến đi</Label>
            <Input
              value={travelPurpose}
              onChange={(e) => setTravelPurpose(e.target.value)}
              placeholder="VD: Khảo sát chi nhánh và chuyển giao công nghệ"
              className="mt-1 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Điểm xuất phát</Label>
              <Input
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Điểm đến</Label>
              <Input
                value={toLoc}
                onChange={(e) => setToLoc(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ngày khởi hành</Label>
              <Input
                type="date"
                value={depDate}
                onChange={(e) => setDepDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Ngày về</Label>
              <Input
                type="date"
                value={retDate}
                onChange={(e) => setRetDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label>Dự toán kinh phí (VND)</Label>
            <Input
              type="number"
              value={estBudget}
              onChange={(e) => setEstBudget(Number(e.target.value))}
              className="mt-1 text-xs font-bold text-purple-700"
            />
          </div>

          <div>
            <Label>Ghi chú lịch trình & nội dung công việc</Label>
            <textarea
              rows={2}
              value={travelNotes}
              onChange={(e) => setTravelNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden resize-none"
            />
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => setIsTravelModalOpen(false)}
          onConfirm={() => {
            if (!travelPurpose.trim()) {
              toast('Vui lòng nhập mục đích chuyến đi', 'error');
              return;
            }
            createTravelMutation.mutate({
              employeeName: travelEmployee,
              purpose: travelPurpose,
              fromLocation: fromLoc,
              toLocation: toLoc,
              departureDate: depDate,
              returnDate: retDate,
              estimatedBudget: estBudget,
              notes: travelNotes,
            });
          }}
          confirmLabel={createTravelMutation.isPending ? 'Đang lưu...' : 'Gửi Đề Xuất'}
          disabled={createTravelMutation.isPending}
        />
      </Modal>

      {/* MODAL 3: Đề Xuất Tạm Ứng */}
      <Modal
        open={isAdvanceModalOpen}
        onOpenChange={setIsAdvanceModalOpen}
        title="Đề Xuất Tạm Ứng Kinh Phí Nhân Viên"
        description="Lập phiếu đề xuất cấp tạm ứng tiền mặt hoặc chuyển khoản phục vụ công tác phí, dự án."
        size="md"
      >
        <div className="space-y-3.5 py-1">
          <div>
            <Label>Nhân sự đề nghị tạm ứng</Label>
            <Select
              value={advEmployee}
              onChange={(e) => setAdvEmployee(e.target.value)}
              className="mt-1 w-full text-xs"
            >
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.fullName}>
                    {emp.fullName} {emp.jobTitle ? `(${emp.jobTitle})` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="Nguyễn Văn An">Nguyễn Văn An</option>
                  <option value="Võ Tấn Phát">Võ Tấn Phát</option>
                  <option value="Trần Thị Mai">Trần Thị Mai</option>
                </>
              )}
            </Select>
          </div>

          <div>
            <Label>Lý do / Mục đích tạm ứng</Label>
            <Input
              value={advPurpose}
              onChange={(e) => setAdvPurpose(e.target.value)}
              placeholder="VD: Tạm ứng công tác phí và đặt phòng khách sạn"
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label>Số tiền tạm ứng (VND)</Label>
            <Input
              type="number"
              value={advAmount}
              onChange={(e) => setAdvAmount(Number(e.target.value))}
              className="mt-1 text-xs font-bold text-blue-700"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Bằng chữ: <strong>{(advAmount || 0).toLocaleString('vi-VN')} đồng</strong>
            </p>
          </div>
        </div>

        <ModalFooterActions
          onCancel={() => setIsAdvanceModalOpen(false)}
          onConfirm={() => {
            if (!advPurpose.trim() || advAmount <= 0) {
              toast('Vui lòng nhập lý do và số tiền hợp lệ', 'error');
              return;
            }
            createAdvanceMutation.mutate({
              employeeName: advEmployee,
              purpose: advPurpose,
              amount: advAmount,
            });
          }}
          confirmLabel={createAdvanceMutation.isPending ? 'Đang lưu...' : 'Gửi Đề Xuất Tạm Ứng'}
          disabled={createAdvanceMutation.isPending}
        />
      </Modal>

      {/* DETAIL MODAL: Bảng Kê Chi Phí */}
      {detailClaim && (
        <Modal
          open={!!detailClaim}
          onOpenChange={(open) => { if (!open) setDetailClaim(null); }}
          title="Chi Tiết Bảng Kê Thanh Toán Chi Phí"
          description={`Mã hồ sơ: #${detailClaim.id.slice(0, 8)} • Ngày nộp: ${formatSafeDate(detailClaim.submittedAt || detailClaim.createdAt)}`}
          size="lg"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-md border border-border/60">
              <div>
                <span className="text-muted-foreground block text-xs">Người đề nghị:</span>
                <span className="font-bold text-foreground text-sm">{detailClaim.employeeName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Danh mục:</span>
                <span className="font-semibold text-foreground">{CATEGORY_LABELS[detailClaim.category] || detailClaim.category}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Tổng số tiền:</span>
                <span className="font-extrabold text-foreground text-sm font-mono">{formatVND(detailClaim.totalAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Trạng thái:</span>
                {(() => {
                  const b = STATUS_BADGES[detailClaim.status] || { label: detailClaim.status, dot: 'bg-muted-foreground', bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-normal border border-border bg-muted/40 text-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
                      {b.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-primary" />
                Danh mục các khoản chi phí thanh quyết toán
              </h4>
              <div className="border rounded-md overflow-hidden bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b text-xs text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2 px-3">STT</th>
                      <th className="py-2 px-3">Nội dung chi</th>
                      <th className="py-2 px-3">Ngày phát sinh</th>
                      <th className="py-2 px-3 text-right">Số tiền (VND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {Array.isArray(detailClaim.items) && detailClaim.items.length > 0 ? (
                      detailClaim.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-foreground">{it.item}</td>
                          <td className="py-2 px-3 text-muted-foreground">{formatSafeDate(it.date || detailClaim.submittedAt)}</td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-700">{formatVND(it.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2 px-3 text-muted-foreground">1</td>
                        <td className="py-2 px-3 font-medium text-foreground">{detailClaim.title}</td>
                        <td className="py-2 px-3 text-muted-foreground">{formatSafeDate(detailClaim.submittedAt || detailClaim.createdAt)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-700">{formatVND(detailClaim.totalAmount)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t font-bold">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right">Tổng thanh toán:</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 text-sm">{formatVND(detailClaim.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Quick Actions Inside Modal */}
            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintDocument({ type: 'CLAIM', data: detailClaim })}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> In Giấy Đề Nghị Thanh Toán
              </Button>

              <div className="flex items-center gap-2">
                {detailClaim.status !== 'APPROVED' && detailClaim.status !== 'PAID' && (
                  <Button
                    size="sm"
                    onClick={() => updateClaimStatusMutation.mutate({ id: detailClaim.id, status: 'APPROVED' })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Phê Duyệt
                  </Button>
                )}
                {detailClaim.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => updateClaimStatusMutation.mutate({ id: detailClaim.id, status: 'PAID' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Giải Ngân / Chi Tiền
                  </Button>
                )}
                {detailClaim.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateClaimStatusMutation.mutate({ id: detailClaim.id, status: 'REJECTED' })}
                    className="text-rose-600 hover:bg-rose-50 gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Từ Chối
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Xác nhận xóa bảng kê "${detailClaim.title}"?`)) {
                      deleteClaimMutation.mutate(detailClaim.id);
                    }
                  }}
                  className="text-rose-600 hover:bg-rose-50"
                  title="Xóa hồ sơ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* DETAIL MODAL: Chuyến Công Tác */}
      {detailTravel && (
        <Modal
          open={!!detailTravel}
          onOpenChange={(open) => { if (!open) setDetailTravel(null); }}
          title="Chi Tiết Kế Hoạch Chuyến Công Tác"
          description={`Nhân sự: ${detailTravel.employeeName} • Hành trình: ${detailTravel.fromLocation} ➔ ${detailTravel.toLocation}`}
          size="md"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-2 bg-muted/20 p-3 rounded-md border border-border/60">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trạng thái:</span>
                {(() => {
                  const b = STATUS_BADGES[detailTravel.status] || { label: detailTravel.status, dot: 'bg-muted-foreground', bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-normal border border-border bg-muted/40 text-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
                      {b.label}
                    </span>
                  );
                })()}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mục đích:</span>
                <span className="font-bold text-foreground">{detailTravel.purpose}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Thời gian:</span>
                <span className="font-medium text-foreground">
                  {formatSafeDate(detailTravel.departureDate)} đến {formatSafeDate(detailTravel.returnDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dự toán kinh phí:</span>
                <span className="font-extrabold text-foreground text-sm">{formatVND(detailTravel.estimatedBudget)}</span>
              </div>
              {detailTravel.notes && (
                <div className="pt-2 border-t text-muted-foreground">
                  <span className="font-medium text-foreground block mb-0.5">Ghi chú:</span>
                  <p>{detailTravel.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintDocument({ type: 'TRAVEL', data: detailTravel })}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> In Giấy Đi Đường
              </Button>

              <div className="flex items-center gap-2">
                {detailTravel.status !== 'APPROVED' && detailTravel.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    onClick={() => updateTravelStatusMutation.mutate({ id: detailTravel.id, status: 'APPROVED' })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Duyệt Lịch Trình
                  </Button>
                )}
                {detailTravel.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => updateTravelStatusMutation.mutate({ id: detailTravel.id, status: 'COMPLETED' })}
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn Tất
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Xóa đề xuất chuyến công tác này?`)) {
                      deleteTravelMutation.mutate(detailTravel.id);
                    }
                  }}
                  className="text-rose-600 hover:bg-rose-50"
                  title="Xóa đề xuất"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* DETAIL MODAL: Tạm Ứng */}
      {detailAdvance && (
        <Modal
          open={!!detailAdvance}
          onOpenChange={(open) => { if (!open) setDetailAdvance(null); }}
          title="Chi Tiết Đề Xuất Tạm Ứng Nhân Viên"
          description={`Nhân sự: ${detailAdvance.employeeName}`}
          size="md"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-2.5 bg-muted/20 p-3 rounded-md border border-border/60">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trạng thái:</span>
                {(() => {
                  const b = STATUS_BADGES[detailAdvance.status] || { label: detailAdvance.status, dot: 'bg-muted-foreground', bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-normal border border-border bg-muted/40 text-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
                      {b.label}
                    </span>
                  );
                })()}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mục đích:</span>
                <span className="font-bold text-foreground">{detailAdvance.purpose}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tiền tạm ứng:</span>
                <span className="font-black text-blue-700 text-base">{formatVND(detailAdvance.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ngày đề xuất:</span>
                <span className="text-foreground">{formatSafeDate(detailAdvance.createdAt)}</span>
              </div>
              {detailAdvance.disbursedAt && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Ngày đã giải ngân:</span>
                  <span className="font-semibold">{formatSafeDate(detailAdvance.disbursedAt)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintDocument({ type: 'ADVANCE', data: detailAdvance })}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> In Phiếu Chi Tạm Ứng
              </Button>

              <div className="flex items-center gap-2">
                {detailAdvance.status !== 'APPROVED' && detailAdvance.status !== 'PAID' && (
                  <Button
                    size="sm"
                    onClick={() => updateAdvanceStatusMutation.mutate({ id: detailAdvance.id, status: 'APPROVED' })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Duyệt Cấp Tạm Ứng
                  </Button>
                )}
                {detailAdvance.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => updateAdvanceStatusMutation.mutate({ id: detailAdvance.id, status: 'PAID' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Chi Tiền / Giải Ngân
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Xóa đề xuất tạm ứng này?`)) {
                      deleteAdvanceMutation.mutate(detailAdvance.id);
                    }
                  }}
                  className="text-rose-600 hover:bg-rose-50"
                  title="Xóa đề xuất"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT PREVIEW / MODAL */}
      {printDocument && (
        <Modal
          open={!!printDocument}
          onOpenChange={(open) => { if (!open) setPrintDocument(null); }}
          title="In Chứng Từ Nghiệp Vụ Kế Toán"
          description="Biểu mẫu kế toán chuẩn hóa theo quy định tài chính doanh nghiệp và cơ quan nhà nước."
          size="lg"
        >
          <div
            className="bg-white text-black p-6 sm:p-10 rounded-sm border border-neutral-300 shadow-md mx-auto max-w-4xl leading-relaxed text-[12.5pt] print:p-0 print:border-0 print:shadow-none"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header Thể thức Văn bản Hành chính theo NĐ 30/2020/NĐ-CP */}
            <div className="flex justify-between items-start pb-4 border-b border-black">
              <div className="w-[45%] text-center leading-tight">
                <p className="font-normal text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  CÔNG TY CỔ PHẦN PHẦN MỀM SAIGON TECHNOLOGY
                </p>
                <p className="font-bold text-[11pt] sm:text-[12pt] uppercase tracking-tight text-black">
                  PHÒNG TÀI CHÍNH - KẾ TOÁN
                </p>
                <div className="w-28 border-b border-black mx-auto mt-1 mb-1.5" />
                <p className="text-[11pt] text-black">
                  Mã hồ sơ: {printDocument.data.id?.slice(0, 10).toUpperCase() || 'HD-2026'}
                </p>
              </div>

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

            {/* Document Content */}
            {printDocument.type === 'CLAIM' && (
              <div className="space-y-4 my-6">
                <div className="text-center py-2 space-y-1">
                  <h2 className="text-[14pt] sm:text-[15pt] font-bold uppercase tracking-wide text-black">
                    GIẤY ĐỀ NGHỊ THANH TOÁN TIỀN
                  </h2>
                  <p className="italic text-[11.5pt] text-neutral-800">
                    (Căn cứ Thông tư 200/2014/TT-BTC & Quy chế Tài chính nội bộ)
                  </p>
                </div>

                <div className="space-y-2 leading-relaxed text-[12pt] sm:text-[12.5pt] text-black">
                  <p>Kính gửi: <strong>Ban Giám đốc & Phòng Kế toán - Tài chính</strong></p>
                  <p>Họ và tên người đề nghị: <strong>{printDocument.data.employeeName}</strong></p>
                  <p>Nội dung thanh toán: <strong>{printDocument.data.title}</strong></p>
                  <p>Phân loại chi phí: <strong>{CATEGORY_LABELS[printDocument.data.category] || printDocument.data.category}</strong></p>
                  <p>Tổng số tiền đề nghị thanh toán: <strong className="text-[13pt]">{formatVND(printDocument.data.totalAmount)}</strong></p>
                </div>

                <div className="mt-4">
                  <p className="font-bold mb-2 text-[12pt]">Bảng kê chi tiết các chứng từ đính kèm:</p>
                  <table className="w-full border-collapse border border-black text-[11pt] sm:text-[11.5pt] text-black">
                    <thead>
                      <tr className="bg-neutral-100/70 border-b border-black">
                        <th className="border border-black p-2 text-center font-bold w-12">STT</th>
                        <th className="border border-black p-2 text-left font-bold">Nội dung chi</th>
                        <th className="border border-black p-2 text-center font-bold w-32">Ngày chứng từ</th>
                        <th className="border border-black p-2 text-right font-bold w-36">Số tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(printDocument.data.items) && printDocument.data.items.length > 0 ? (
                        printDocument.data.items.map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="border border-black p-2 text-center">{idx + 1}</td>
                            <td className="border border-black p-2">{it.item}</td>
                            <td className="border border-black p-2 text-center">{formatSafeDate(it.date)}</td>
                            <td className="border border-black p-2 text-right">{formatVND(it.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-black p-2 text-center">1</td>
                          <td className="border border-black p-2">{printDocument.data.title}</td>
                          <td className="border border-black p-2 text-center">{formatSafeDate(printDocument.data.submittedAt)}</td>
                          <td className="border border-black p-2 text-right">{formatVND(printDocument.data.totalAmount)}</td>
                        </tr>
                      )}
                      <tr className="font-bold bg-neutral-100/70 border-t-2 border-black">
                        <td colSpan={3} className="border border-black p-2 text-right">Tổng cộng thanh toán:</td>
                        <td className="border border-black p-2 text-right">{formatVND(printDocument.data.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {printDocument.type === 'TRAVEL' && (
              <div className="space-y-4 my-6">
                <div className="text-center py-2 space-y-1">
                  <h2 className="text-[14pt] sm:text-[15pt] font-bold uppercase tracking-wide text-black">
                    GIẤY ĐI ĐƯỜNG / LỆNH CÔNG TÁC
                  </h2>
                  <p className="italic text-[11.5pt] text-neutral-800">
                    Căn cứ kế hoạch công tác của Đơn vị năm {new Date().getFullYear()}
                  </p>
                </div>

                <div className="space-y-2 leading-relaxed text-[12pt] sm:text-[12.5pt] text-black">
                  <p>Cấp cho Ông/Bà: <strong>{printDocument.data.employeeName}</strong></p>
                  <p>Mục đích chuyến công tác: <strong>{printDocument.data.purpose}</strong></p>
                  <p>Lộ trình di chuyển: <strong>{printDocument.data.fromLocation} ➔ {printDocument.data.toLocation}</strong></p>
                  <p>Thời gian công tác: Từ ngày <strong>{formatSafeDate(printDocument.data.departureDate)}</strong> đến ngày <strong>{formatSafeDate(printDocument.data.returnDate)}</strong></p>
                  <p>Dự toán kinh phí được phê duyệt: <strong>{formatVND(printDocument.data.estimatedBudget)}</strong></p>
                  {printDocument.data.notes && <p>Ghi chú thực hiện: <em>{printDocument.data.notes}</em></p>}
                </div>
              </div>
            )}

            {printDocument.type === 'ADVANCE' && (
              <div className="space-y-4 my-6">
                <div className="text-center py-2 space-y-1">
                  <h2 className="text-[14pt] sm:text-[15pt] font-bold uppercase tracking-wide text-black">
                    GIẤY ĐỀ NGHỊ TẠM ỨNG KINH PHÍ
                  </h2>
                  <p className="italic text-[11.5pt] text-neutral-800">
                    (Ban hành theo Thông tư số 200/2014/TT-BTC)
                  </p>
                </div>

                <div className="space-y-2 leading-relaxed text-[12pt] sm:text-[12.5pt] text-black">
                  <p>Họ tên người nhận tạm ứng: <strong>{printDocument.data.employeeName}</strong></p>
                  <p>Lý do tạm ứng: <strong>{printDocument.data.purpose}</strong></p>
                  <p>Số tiền tạm ứng: <strong className="text-[13pt]">{formatVND(printDocument.data.amount)}</strong></p>
                  <p>Thời hạn thanh toán quyết toán: <strong>Trong vòng 07 ngày kể từ khi kết thúc công việc</strong></p>
                </div>
              </div>
            )}

            {/* Chữ ký 3 bên theo Nghị định 30 */}
            <div className="grid grid-cols-3 gap-4 text-center pt-8 pb-4 text-[11.5pt] sm:text-[12pt] text-black">
              <div>
                <p className="font-bold uppercase text-[11pt] sm:text-[11.5pt]">NGƯỜI ĐỀ NGHỊ</p>
                <p className="italic text-[10pt] text-neutral-600">(Ký và ghi rõ họ tên)</p>
                <div className="h-16 flex items-end justify-center font-bold text-black">
                  {printDocument.data.employeeName}
                </div>
              </div>
              <div>
                <p className="font-bold uppercase text-[11pt] sm:text-[11.5pt]">KẾ TOÁN TRƯỞNG</p>
                <p className="italic text-[10pt] text-neutral-600">(Ký và ghi rõ họ tên)</p>
                <div className="h-16 flex items-end justify-center font-bold text-black">
                  (Đã kiểm soát)
                </div>
              </div>
              <div>
                <p className="font-bold uppercase text-[11pt] sm:text-[11.5pt]">THỦ TRƯỞNG ĐƠN VỊ</p>
                <p className="italic text-[10pt] text-neutral-600">(Ký, đóng dấu)</p>
                <div className="h-16 flex items-end justify-center font-bold text-black">
                  (Đã duyệt chi)
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setPrintDocument(null)}>
              Đóng
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5 bg-primary text-primary-foreground">
              <Printer className="h-3.5 w-3.5" /> In Ngay (Print)
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
