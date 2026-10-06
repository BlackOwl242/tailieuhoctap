'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  RefreshCw,
  UserCog,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Save,
  Lock,
  Sliders,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { HoverMarquee } from '@/components/ui/hover-marquee';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Badge,
  Textarea,
  Select,
} from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  status: string;
  roles: string[];
  orgUnit?: { id: string; name: string } | null;
}

interface RoleItem {
  code: string;
  name: string;
  description: string | null;
  userCount: number;
  isSystem: boolean;
}

interface RbacMatrixItem {
  moduleKey: string;
  moduleName: string;
  permissions: Record<string, string>;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Bị khóa',
  DISABLED: 'Vô hiệu hóa',
};

const COMMON_PERMISSION_PRESETS = [
  'Toàn quyền truy cập và điều hành hệ thống',
  'Toàn quyền tạo mới, sửa đổi, quản lý và phê duyệt',
  'Quản lý, phân ca, tổng hợp và chốt dữ liệu',
  'Chỉ xem, tra cứu và xuất báo cáo dữ liệu',
  'Tự phục vụ cá nhân (Điểm danh, đơn từ, phiếu lương)',
  'Chỉ xem hồ sơ và thông tin cá nhân',
  'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
];

const CRITICAL_PERMISSION_ROWS = [
  { moduleKey: 'PAYROLL_READ', moduleName: 'Lương · Xem kỳ và phiếu lương của nhân viên', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD'], note: 'Các vai trò này xem dữ liệu bảng lương toàn đơn vị; chỉ ADMIN/Kế toán thấy số tài khoản nhận lương, nhân viên dùng luồng phiếu lương cá nhân.' },
  { moduleKey: 'PAYROLL_CONFIG', moduleName: 'Lương · Sửa thành phần/cấu trúc và gán cấu trúc', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB'], note: 'Không bao gồm Kế toán; thay đổi mức lương cơ bản phải dựa trên quyết định nhân sự có hiệu lực.' },
  { moduleKey: 'PAYROLL_PROCESS', moduleName: 'Lương · Tạo và tính kỳ lương', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB'], note: 'Phải chốt công tháng trước; không tạo trùng kỳ.' },
  { moduleKey: 'PAYROLL_REVIEW', moduleName: 'Lương · Đối soát kỳ lương', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT'], note: 'Kế toán tham gia đối soát; người tính không được tự đối soát.' },
  { moduleKey: 'PAYROLL_APPROVE', moduleName: 'Lương · Phê duyệt và khóa kỳ', roles: ['ADMIN', 'BOD'], note: 'Chỉ sau khi kỳ đã đối soát và phê duyệt.' },
  { moduleKey: 'PAYROLL_PAY', moduleName: 'Lương · Xác nhận thanh toán', roles: ['ADMIN', 'ACCOUNTANT'], note: 'Chỉ thanh toán sau khi khóa kỳ và lưu mã giao dịch/chứng từ.' },
  { moduleKey: 'PERFORMANCE_GOAL', moduleName: 'Đánh giá · Tạo/giao mục tiêu', roles: ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER'], note: 'Trưởng nhóm chỉ được giao trong cùng đơn vị; nhân viên và BOD không tự tạo mục tiêu.' },
  { moduleKey: 'PERFORMANCE_SCORE', moduleName: 'Đánh giá · Tự chấm / chấm quản lý', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER'], note: 'Nhân viên chỉ tự chấm; quản lý chấm trong phạm vi được giao. HR Trainer và BOD không ghi điểm mục tiêu ở API.' },
  { moduleKey: 'PERFORMANCE_CYCLE', moduleName: 'Đánh giá · Tạo, sửa và xóa chu kỳ', roles: ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'BOD'], note: 'Quyền quản trị chu kỳ; nhân viên chỉ xem chu kỳ được áp dụng.' },
  { moduleKey: 'PERFORMANCE_PERSONAL', moduleName: 'Đánh giá · Tự đánh giá và nộp minh chứng', roles: ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER'], note: 'Đánh giá bản thân và minh chứng chỉ gắn với mục tiêu của chính tài khoản.' },
];

/**
 * KC02/RBAC — Quản lý phân quyền vai trò người dùng, thêm vai trò mới và cấu hình ma trận quyền hạn đồng bộ hệ thống.
 */
export default function RolesManagementPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'matrix'>('users');

  // Modal đổi vai trò người dùng
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('USER');

  // Modal thêm vai trò mới
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ code: '', name: '', description: '' });

  // Modal sửa vai trò
  const [editRoleItem, setEditRoleItem] = useState<RoleItem | null>(null);
  const [editRoleForm, setEditRoleForm] = useState({ name: '', description: '' });

  // Modal xác nhận xóa vai trò
  const [deleteRoleCode, setDeleteRoleCode] = useState<string | null>(null);

  // Chế độ chỉnh sửa ma trận quyền
  const [isEditingMatrix, setIsEditingMatrix] = useState(false);
  const [editableMatrix, setEditableMatrix] = useState<RbacMatrixItem[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareLeftId, setCompareLeftId] = useState('');
  const [compareRightId, setCompareRightId] = useState('');

  // 1. Query danh sách tài khoản
  const usersQ = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<{ items: UserRow[] }>('/users?limit=1000')).data.items,
  });

  // 2. Query danh sách vai trò
  const rolesQ = useQuery({
    queryKey: ['system-roles'],
    queryFn: async () => (await api.get<RoleItem[]>('/roles')).data,
  });

  // 3. Query ma trận phân quyền
  const matrixQ = useQuery({
    queryKey: ['rbac-matrix'],
    queryFn: async () => (await api.get<RbacMatrixItem[]>('/roles/matrix')).data,
  });

  const users = usersQ.data ?? [];
  const roles = useMemo(() => rolesQ.data ?? [], [rolesQ.data]);
  const matrix = matrixQ.data ?? [];
  const compareLeft = users.find((u) => u.id === compareLeftId) ?? users.find((u) => u.email === 'admin@demo.local') ?? users[0];
  const compareRight = users.find((u) => u.id === compareRightId) ?? users.find((u) => u.email === 'dev.fresher@demo.local') ?? users[1];

  const accountPermissionText = (account: UserRow | undefined, row: RbacMatrixItem) => {
    if (!account) return 'Chọn tài khoản để so sánh';
    const codes = account.roles.length ? account.roles : ['USER'];
    const values = Array.from(new Set(codes.map((code) => row.permissions?.[code]).filter((value): value is string => Boolean(value?.trim()))));
    if (!values.length) return 'Chưa cấu hình quyền cho vai trò này';
    const allowed = values.filter((value) => !/^(?:-|—|không|none|deny)/i.test(value.trim()));
    return (allowed.length ? allowed : values).join(' · ');
  };

  const accountHasAnyRole = (account: UserRow | undefined, roleCodes: string[]) =>
    Boolean(account && (account.roles.length ? account.roles : ['USER']).some((role) => roleCodes.includes(role)));

  const openCompareModal = () => {
    if (!compareLeftId) setCompareLeftId(users.find((u) => u.email === 'admin@demo.local')?.id ?? users[0]?.id ?? '');
    if (!compareRightId) setCompareRightId(users.find((u) => u.email === 'dev.fresher@demo.local')?.id ?? users[1]?.id ?? '');
    setIsCompareModalOpen(true);
  };

  // Bản đồ nhãn vai trò — Phân định rõ Quản trị viên Hệ thống CNTT, Ban Giám Đốc và Cổ đông
  const roleLabelMap = useMemo(() => {
    const map: Record<string, string> = {
      ADMIN: 'Quản trị viên Hệ thống CNTT (ADMIN)',
      BOD: 'Ban Giám Đốc Điều hành (BOD)',
      SHAREHOLDER: 'Cổ đông & Hội đồng Quản trị (SHAREHOLDER)',
      KM_MANAGER: 'Cán bộ Quản trị Nhân sự (KM_MANAGER)',
      LINE_MANAGER: 'Quản lý / Trưởng bộ phận (LINE_MANAGER)',
      HR_CB: 'Chuyên viên C&B (HR_CB)',
      ACCOUNTANT: 'Kế toán Doanh nghiệp (ACCOUNTANT)',
      HR_RECRUITER: 'Chuyên viên Tuyển dụng (HR_RECRUITER)',
      HR_TRAINER: 'Chuyên viên L&D (HR_TRAINER)',
      AUDITOR: 'Kiểm toán & Pháp chế (AUDITOR)',
      USER: 'Nhân viên (USER)',
    };
    for (const r of roles) {
      map[r.code] = `${r.name} (${r.code})`;
    }
    return map;
  }, [roles]);

  const getRoleBadgeStyle = (code: string) => {
    switch (code) {
      case 'ADMIN':
        return 'bg-foreground text-background border-foreground font-semibold';
      case 'BOD':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold';
      case 'SHAREHOLDER':
        return 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold';
      case 'KM_MANAGER':
        return 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium';
      case 'LINE_MANAGER':
        return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium';
      case 'HR_CB':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium';
      case 'ACCOUNTANT':
        return 'border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-medium';
      case 'HR_RECRUITER':
        return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium';
      case 'HR_TRAINER':
        return 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium';
      case 'AUDITOR':
        return 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-medium';
      default:
        return 'border-border text-muted-foreground bg-muted/20';
    }
  };

  // Mutation cập nhật vai trò người dùng
  const updateUserRoleMutation = useMutation({
    mutationFn: async (vars: { id: string; roleCodes: string[] }) => {
      return (await api.patch(`/users/${vars.id}`, { roleCodes: vars.roleCodes })).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật vai trò phân quyền tài khoản', 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['system-roles'] });
      setEditUser(null);
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Mutation thêm vai trò mới
  const createRoleMutation = useMutation({
    mutationFn: async (vars: { code: string; name: string; description?: string }) => {
      return (await api.post('/roles', vars)).data;
    },
    onSuccess: (data) => {
      toast(`Đã thêm vai trò "${data.name}" thành công`, 'success');
      qc.invalidateQueries({ queryKey: ['system-roles'] });
      setIsCreateRoleOpen(false);
      setNewRoleForm({ code: '', name: '', description: '' });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Mutation sửa vai trò
  const updateRoleMutation = useMutation({
    mutationFn: async (vars: { code: string; name: string; description?: string }) => {
      return (await api.patch(`/roles/${vars.code}`, { name: vars.name, description: vars.description })).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật thông tin vai trò', 'success');
      qc.invalidateQueries({ queryKey: ['system-roles'] });
      setEditRoleItem(null);
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Mutation xóa vai trò
  const deleteRoleMutation = useMutation({
    mutationFn: async (code: string) => {
      return (await api.delete(`/roles/${code}`)).data;
    },
    onSuccess: () => {
      toast('Đã xóa vai trò thành công', 'success');
      qc.invalidateQueries({ queryKey: ['system-roles'] });
      setDeleteRoleCode(null);
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Mutation lưu ma trận quyền
  const saveMatrixMutation = useMutation({
    mutationFn: async (newMatrix: RbacMatrixItem[]) => {
      return (await api.put('/roles/matrix', { matrix: newMatrix })).data;
    },
    onSuccess: () => {
      toast('Đã lưu cấu hình ma trận phân quyền thành công', 'success');
      qc.invalidateQueries({ queryKey: ['rbac-matrix'] });
      setIsEditingMatrix(false);
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Khởi tạo chỉnh sửa ma trận
  const handleStartEditMatrix = () => {
    setEditableMatrix(JSON.parse(JSON.stringify(matrix)));
    setIsEditingMatrix(true);
  };

  const handleUpdateMatrixCell = (moduleIdx: number, roleCode: string, value: string) => {
    setEditableMatrix((prev) => {
      const next = [...prev];
      next[moduleIdx] = {
        ...next[moduleIdx],
        permissions: {
          ...next[moduleIdx].permissions,
          [roleCode]: value,
        },
      };
      return next;
    });
  };

  // Cột bảng tài khoản
  const userColumns: DataColumn<UserRow>[] = [
    {
      key: 'fullName',
      header: 'Người dùng',
      sortable: true,
      render: (u) => (
        <span>
          <span className="block font-medium text-foreground">{u.fullName}</span>
          <span className="block text-xs text-muted-foreground font-mono">{u.email}</span>
        </span>
      ),
    },
    {
      key: 'orgUnit',
      header: 'Đơn vị / Phòng ban',
      sortable: true,
      sortValue: (u) => u.orgUnit?.name ?? '',
      render: (u) => <span className="text-xs text-muted-foreground">{u.orgUnit?.name ?? 'Chưa cập nhật'}</span>,
    },
    {
      key: 'jobTitle',
      header: 'Chức danh',
      sortable: true,
      render: (u) => <span className="text-xs text-foreground">{u.jobTitle ?? 'Chưa cập nhật'}</span>,
    },
    {
      key: 'roles',
      header: 'Vai trò hiện tại',
      sortable: true,
      sortValue: (u) => u.roles[0] ?? '',
      render: (u) => {
        const r = u.roles[0] ?? 'USER';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getRoleBadgeStyle(r)}`}
          >
            {roleLabelMap[r] ?? r}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              u.status === 'ACTIVE'
                ? 'bg-emerald-600'
                : u.status === 'LOCKED'
                ? 'bg-amber-600'
                : 'bg-rose-600'
            }`}
          />
          {STATUS_LABEL[u.status] ?? u.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (u) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setEditUser(u);
            setSelectedUserRole(u.roles[0] ?? 'USER');
          }}
        >
          <UserCog className="h-3.5 w-3.5" />
          Đổi vai trò
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản lý Phân quyền (RBAC)"
        description="Quản trị các vai trò trong hệ thống, tùy biến phân quyền theo phân hệ và gán vai trò trực tiếp cho người dùng."
        breadcrumbs={[
          { label: 'Cấu hình hệ thống', href: '/admin/settings' },
          { label: 'Phân quyền vai trò' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openCompareModal}
              className="gap-1.5 shadow-2xs"
            >
              <ShieldCheck className="h-4 w-4" /> So sánh quyền tài khoản
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateRoleOpen(true)}
              className="gap-1.5 shadow-2xs font-medium"
            >
              <Plus className="h-4 w-4" /> Thêm vai trò mới
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                usersQ.refetch();
                rolesQ.refetch();
                matrixQ.refetch();
              }}
              className="gap-1.5 shadow-2xs"
            >
              <RefreshCw className="h-4 w-4" /> Làm mới
            </Button>
          </div>
        }
      />

      {/* Thẻ Thống kê Tóm tắt Vai trò Chuẩn Hệ thống */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {roles.map((r) => (
          <Card key={r.code} className="border-border shadow-2xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground truncate pr-1">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{r.name}</span>
                </div>
                <Badge variant={r.isSystem ? 'secondary' : 'outline'} className="text-xs font-mono shrink-0">
                  {r.userCount} tài khoản
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px]">
                {r.description || 'Chưa thiết lập mô tả vai trò.'}
              </p>
              <div className="pt-2 border-t border-border/80 text-xs flex items-center justify-between">
                <span className="font-mono text-muted-foreground">{r.code}</span>
                {r.isSystem ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Hệ thống
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditRoleItem(r);
                        setEditRoleForm({ name: r.name, description: r.description || '' });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Sửa
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => setDeleteRoleCode(r.code)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Điều hướng Chuẩn Hệ thống */}
      <div className="flex border-b border-border text-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'users'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Phân quyền tài khoản ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'roles'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Danh mục vai trò ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'matrix'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Ma trận phân quyền 8 phân hệ (RBAC Matrix)
        </button>
      </div>

      {/* ================= TAB 1: DANH SÁCH TÀI KHOẢN & GÁN PHÂN QUYỀN ================= */}
      {activeTab === 'users' && (
        <div className="print-area">
          <PrintFrame title="DANH SÁCH PHÂN QUYỀN VAI TRÒ TÀI KHOẢN" subtitle={`Tổng cộng ${users.length} tài khoản`} />
          {usersQ.isError ? (
            <ErrorState message={errorMessage(usersQ.error)} onRetry={() => usersQ.refetch()} />
          ) : (
            <DataTable
              columns={userColumns}
              rows={users}
              rowKey={(u) => u.id}
              loading={usersQ.isLoading}
              exportFilename="danh-sach-phan-quyen-tai-khoan"
              printLabel="In danh sách phân quyền"
              searchFields={(u) => [u.fullName, u.email, u.jobTitle ?? '', u.orgUnit?.name ?? '']}
              filters={[
                {
                  key: 'role',
                  label: 'Vai trò',
                  value: (u) => u.roles[0] ?? 'USER',
                  options: roles.map((r) => ({ value: r.code, label: r.name })),
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  value: (u) => u.status,
                  options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
                },
              ]}
              emptyTitle="Không tìm thấy tài khoản phù hợp"
              actions={(u): RowActionItem[] => [
                {
                  label: 'Đổi vai trò phân quyền',
                  icon: ShieldCheck,
                  onSelect: () => {
                    setEditUser(u);
                    setSelectedUserRole(u.roles[0] ?? 'USER');
                  },
                },
              ]}
            />
          )}
          <PrintSignatureBlock />
        </div>
      )}

      {/* ================= TAB 2: DANH MỤC VAI TRÒ HỆ THỐNG ================= */}
      {activeTab === 'roles' && (
        <Card className="border-border shadow-2xs overflow-hidden">
          <CardHeader className="p-4 bg-muted/20 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Danh mục Vai trò Hệ thống ({roles.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Toàn bộ vai trò mặc định và vai trò tùy biến được khởi tạo trong cơ sở dữ liệu.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateRoleOpen(true)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Thêm vai trò
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-foreground">
                    <th className="py-3 px-4 w-[15%]">Mã vai trò</th>
                    <th className="py-3 px-4 w-[25%]">Tên vai trò</th>
                    <th className="py-3 px-4 w-[35%]">Mô tả nhiệm vụ & quyền hạn</th>
                    <th className="py-3 px-4 w-[12%] text-center">Số tài khoản</th>
                    <th className="py-3 px-4 w-[13%] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roles.map((r) => (
                    <tr key={r.code} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          {r.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {r.name}
                        {r.isSystem && (
                          <Badge variant="outline" className="ml-2 text-[10px] py-0">
                            Mặc định
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{r.description || 'Chưa cập nhật'}</td>
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {r.userCount}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.isSystem ? (
                          <span className="text-xs text-muted-foreground italic">Khóa hệ thống</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setEditRoleItem(r);
                                setEditRoleForm({ name: r.name, description: r.description || '' });
                              }}
                            >
                              <Edit2 className="h-3 w-3 mr-1" /> Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setDeleteRoleCode(r.code)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Xóa
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 3: MA TRẬN PHÂN QUYỀN NGHIỆP VỤ (RBAC MATRIX) ================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <Card className="border-border shadow-2xs overflow-hidden">
            <CardHeader className="p-4 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  Ma trận phân quyền 8 phân hệ nghiệp vụ (RBAC Matrix)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Quy định chi tiết quyền hạn truy cập của từng vai trò trên 8 phân hệ cốt lõi. Bấm &quot;Chỉnh sửa ma trận quyền&quot; để cấu hình trực tiếp. Bạn có thể cuộn ngang để duyệt toàn bộ 10 vai trò, rê chuột lên các ô hoặc mục danh sách để xem đầy đủ nội dung.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isEditingMatrix ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingMatrix(false)}
                      disabled={saveMatrixMutation.isPending}
                      className="gap-1.5 text-xs"
                    >
                      <X className="h-3.5 w-3.5" /> Hủy bỏ
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveMatrixMutation.mutate(editableMatrix)}
                      disabled={saveMatrixMutation.isPending}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saveMatrixMutation.isPending ? 'Đang lưu…' : 'Lưu cấu hình quyền'}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartEditMatrix}
                    className="gap-1.5 text-xs font-medium shadow-2xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                    Chỉnh sửa ma trận quyền
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto border-b border-border shadow-2xs relative">
                <table className="w-full text-xs text-left min-w-[3100px] border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 font-semibold text-foreground">
                      <th className="py-3.5 px-4 sticky left-0 z-30 bg-muted/95 backdrop-blur-xs font-semibold text-foreground border-r border-border shadow-[4px_0_10px_-2px_rgba(0,0,0,0.06)] w-[260px] min-w-[260px] max-w-[260px]">
                        Phân hệ chức năng
                      </th>
                      {roles.map((r) => (
                        <th
                          key={r.code}
                          className="py-3.5 px-4 font-semibold text-foreground w-[285px] min-w-[285px] max-w-[285px] border-r border-border/60 last:border-r-0"
                        >
                          <div className="font-semibold text-foreground text-xs leading-snug">{r.name}</div>
                          <span className="block font-mono text-[10px] text-muted-foreground font-normal mt-0.5">
                            ({r.code})
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(isEditingMatrix ? editableMatrix : matrix).map((row, idx) => (
                      <tr key={row.moduleKey || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 sticky left-0 z-20 bg-card font-medium text-foreground border-r border-border shadow-[4px_0_10px_-2px_rgba(0,0,0,0.06)] w-[260px] min-w-[260px] max-w-[260px] align-top">
                          <div className="font-semibold text-foreground text-xs leading-snug">{row.moduleName}</div>
                          <div className="font-mono text-[10px] text-muted-foreground mt-1">({row.moduleKey})</div>
                        </td>
                        {roles.map((r) => {
                          const currentVal =
                            (isEditingMatrix ? editableMatrix[idx]?.permissions : row.permissions)?.[r.code] ??
                            (r.code === 'ADMIN'
                              ? 'Toàn quyền truy cập và điều hành hệ thống'
                              : 'Chưa cấu hình quyền');

                          if (!isEditingMatrix) {
                            return (
                              <td
                                key={r.code}
                                className="py-3.5 px-4 text-muted-foreground align-top border-r border-border/50 last:border-r-0 w-[285px] min-w-[285px] max-w-[285px]"
                              >
                                <HoverMarquee
                                  text={currentVal}
                                  className={cn(
                                    'text-xs leading-relaxed py-0.5',
                                    r.code === 'ADMIN' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                                  )}
                                >
                                  {currentVal}
                                </HoverMarquee>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={r.code}
                              className="p-3 align-top border-r border-border/50 last:border-r-0 w-[285px] min-w-[285px] max-w-[285px]"
                            >
                              <div className="space-y-2 w-full">
                                <Input
                                  type="text"
                                  value={currentVal}
                                  onChange={(e) => handleUpdateMatrixCell(idx, r.code, e.target.value)}
                                  className="text-xs h-8.5 w-full bg-background"
                                  placeholder="Mô tả quyền hạn…"
                                />
                                <Select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleUpdateMatrixCell(idx, r.code, e.target.value);
                                    }
                                  }}
                                  className="text-xs h-8 text-muted-foreground w-full"
                                >
                                  <option value="">-- Mẫu quyền chuẩn --</option>
                                  {COMMON_PERMISSION_PRESETS.map((preset, pIdx) => (
                                    <option key={pIdx} value={preset}>
                                      {preset}
                                    </option>
                                  ))}
                                </Select>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= MODAL THÊM VAI TRÒ MỚI ================= */}
      <Modal
        open={isCreateRoleOpen}
        onOpenChange={(open) => {
          if (!open) setIsCreateRoleOpen(false);
        }}
        title="Thêm Vai trò Mới"
        description="Định nghĩa vai trò người dùng mới trong hệ thống quản trị nhân lực."
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createRoleMutation.mutate({
              code: newRoleForm.code,
              name: newRoleForm.name,
              description: newRoleForm.description || undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Mã vai trò (Code): *</Label>
            <Input
              required
              placeholder="VD: ACCOUNTANT, DEPT_HEAD, HR_STAFF"
              value={newRoleForm.code}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              className="font-mono uppercase text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Mã định danh duy nhất (A-Z, 0-9, gạch dưới), không dấu.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tên hiển thị vai trò: *</Label>
            <Input
              required
              placeholder="VD: Kế toán Tiền lương, Trưởng bộ phận"
              value={newRoleForm.name}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Mô tả phạm vi quyền hạn:</Label>
            <Textarea
              placeholder="Mô tả tóm tắt quyền hạn nghiệp vụ của vai trò này..."
              value={newRoleForm.description}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
              className="text-xs"
              rows={3}
            />
          </div>

          <ModalFooterActions
            onCancel={() => setIsCreateRoleOpen(false)}
            confirmLabel="Tạo vai trò"
            pending={createRoleMutation.isPending}
          />
        </form>
      </Modal>

      {/* ================= MODAL SỬA VAI TRÒ ================= */}
      <Modal
        open={!!editRoleItem}
        onOpenChange={(open) => {
          if (!open) setEditRoleItem(null);
        }}
        title="Chỉnh sửa Vai trò"
        description={`Cập nhật thông tin vai trò ${editRoleItem?.code}`}
        size="md"
      >
        {editRoleItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateRoleMutation.mutate({
                code: editRoleItem.code,
                name: editRoleForm.name,
                description: editRoleForm.description || undefined,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mã vai trò:</Label>
              <Input disabled value={editRoleItem.code} className="font-mono text-xs bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên hiển thị vai trò: *</Label>
              <Input
                required
                value={editRoleForm.name}
                onChange={(e) => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mô tả phạm vi quyền hạn:</Label>
              <Textarea
                value={editRoleForm.description}
                onChange={(e) => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
                className="text-xs"
                rows={3}
              />
            </div>

            <ModalFooterActions
              onCancel={() => setEditRoleItem(null)}
              confirmLabel="Lưu thay đổi"
              pending={updateRoleMutation.isPending}
            />
          </form>
        )}
      </Modal>

      {/* ================= MODAL XÁC NHẬN XÓA VAI TRÒ ================= */}
      <Modal
        open={!!deleteRoleCode}
        onOpenChange={(open) => {
          if (!open) setDeleteRoleCode(null);
        }}
        title="Xác nhận xóa vai trò"
        description="Thao tác này sẽ xóa vĩnh viễn vai trò khỏi hệ thống."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bạn có chắc chắn muốn xóa vai trò <span className="font-bold text-foreground font-mono">{deleteRoleCode}</span>?
            Hành động này không thể hoàn tác.
          </p>
          <ModalFooterActions
            onCancel={() => setDeleteRoleCode(null)}
            onConfirm={() => deleteRoleCode && deleteRoleMutation.mutate(deleteRoleCode)}
            confirmLabel="Xóa vai trò"
            confirmVariant="destructive"
            pending={deleteRoleMutation.isPending}
          />
        </div>
      </Modal>

      {/* ================= MODAL THAY ĐỔI VAI TRÒ PHÂN QUYỀN CHO NGƯỜI DÙNG ================= */}
      <Modal
        open={isCompareModalOpen}
        onOpenChange={setIsCompareModalOpen}
        title="So sánh quyền theo tài khoản"
        description="Chọn hai tài khoản để đối chiếu các quyền nghiệp vụ trọng yếu và mô tả quyền theo phân hệ."
        size="2xl"
        footer={<Button variant="outline" onClick={() => setIsCompareModalOpen(false)}>Đóng</Button>}
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {[{ label: 'Tài khoản thứ nhất', account: compareLeft, value: compareLeft?.id ?? '', setValue: setCompareLeftId },
              { label: 'Tài khoản thứ hai', account: compareRight, value: compareRight?.id ?? '', setValue: setCompareRightId }].map((item, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                <Label className="text-xs font-semibold">{item.label}</Label>
                <Select
                  value={item.value}
                  onChange={(event) => item.setValue(event.target.value)}
                  searchable
                  placeholder="Chọn tài khoản"
                  className="text-sm"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} · {user.email} · {user.roles.join(', ') || 'USER'}
                    </option>
                  ))}
                </Select>
                {item.account ? (
                  <div className="text-xs text-muted-foreground">
                    {item.account.fullName} · {item.account.orgUnit?.name ?? 'Chưa phân bổ đơn vị'} · {item.account.status === 'ACTIVE' ? 'Đang hoạt động' : STATUS_LABEL[item.account.status] ?? item.account.status}
                  </div>
                ) : <div className="text-xs text-muted-foreground">Đang tải danh sách tài khoản…</div>}
              </div>
            ))}
          </div>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
            Bảng quyền nghiệp vụ bên dưới phản ánh vai trò được khai báo trên API và giới hạn phạm vi dữ liệu. Ma trận mô tả phân hệ là cấu hình hiển thị; chỉnh sửa nội dung ma trận không tự cấp quyền cho endpoint.
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Lương và đánh giá · quyền trên API</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[900px] text-xs text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 font-semibold">Chức năng</th>
                    <th className="p-3 font-semibold">{compareLeft?.fullName ?? 'Tài khoản 1'}<span className="block font-normal text-muted-foreground">{compareLeft?.roles.join(', ') || 'Chưa cập nhật'}</span></th>
                    <th className="p-3 font-semibold">{compareRight?.fullName ?? 'Tài khoản 2'}<span className="block font-normal text-muted-foreground">{compareRight?.roles.join(', ') || 'Chưa cập nhật'}</span></th>
                    <th className="p-3 font-semibold">Điều kiện / phạm vi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CRITICAL_PERMISSION_ROWS.map((row) => (
                    <tr key={row.moduleKey} className="align-top">
                      <td className="p-3 font-medium">{row.moduleName}</td>
                      {[compareLeft, compareRight].map((account, index) => {
                        const permitted = accountHasAnyRole(account, row.roles);
                        return (
                          <td key={index} className="p-3">
                            <span className={cn('inline-flex rounded-full px-2 py-1 font-medium', permitted ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                              {permitted ? 'Có quyền theo vai trò' : 'Không có quyền'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-3 text-muted-foreground leading-relaxed">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">“Có quyền theo vai trò” vẫn chịu kiểm tra trạng thái kỳ, phân tách người lập/người duyệt và phạm vi đơn vị; đây không đồng nghĩa mọi bản ghi đều truy cập được.</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Quyền theo ma trận phân hệ</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[760px] text-xs text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 font-semibold">Phân hệ</th>
                    <th className="p-3 font-semibold">{compareLeft?.fullName ?? 'Tài khoản 1'}</th>
                    <th className="p-3 font-semibold">{compareRight?.fullName ?? 'Tài khoản 2'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matrix.map((row) => (
                    <tr key={row.moduleKey} className="align-top">
                      <td className="p-3 font-medium">{row.moduleName}<span className="block font-mono text-[10px] text-muted-foreground">{row.moduleKey}</span></td>
                      <td className="p-3 text-muted-foreground leading-relaxed">{accountPermissionText(compareLeft, row)}</td>
                      <td className="p-3 text-muted-foreground leading-relaxed">{accountPermissionText(compareRight, row)}</td>
                    </tr>
                  ))}
                  {!matrix.length && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Đang tải ma trận phân hệ…</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </Modal>

      {/* ================= MODAL THAY ĐỔI VAI TRÒ PHÂN QUYỀN CHO NGƯỜI DÙNG ================= */}
      <Modal
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
        title="Chỉnh sửa Vai trò & Phân quyền"
        description="Gán vai trò mới cho tài khoản người dùng trong cơ sở dữ liệu."
        size="md"
      >
        {editUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateUserRoleMutation.mutate({ id: editUser.id, roleCodes: [selectedUserRole] });
            }}
            className="space-y-4"
          >
            <div className="rounded-md bg-muted/40 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tài khoản:</span>
                <span className="font-semibold text-foreground">{editUser.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-foreground">{editUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đơn vị:</span>
                <span className="text-foreground">{editUser.orgUnit?.name ?? 'Chưa phân bổ'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Chọn vai trò phân quyền:</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {roles.map((role) => (
                  <label
                    key={role.code}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedUserRole === role.code
                        ? 'border-foreground bg-muted/40 font-medium'
                        : 'border-border hover:bg-muted/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleCode"
                      value={role.code}
                      checked={selectedUserRole === role.code}
                      onChange={(e) => setSelectedUserRole(e.target.value)}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>{role.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">({role.code})</span>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground leading-normal line-clamp-2">
                        {role.description || 'Chưa có mô tả.'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <ModalFooterActions
              onCancel={() => setEditUser(null)}
              confirmLabel="Lưu phân quyền"
              pending={updateUserRoleMutation.isPending}
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
