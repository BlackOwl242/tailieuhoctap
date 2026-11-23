'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, ShieldBan, ShieldCheck, UserCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Input, Label, Select } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface UserRow {
  id: string; email: string; employeeCode?: string | null; fullName: string; jobTitle: string | null;
  status: string; roles: string[]; mustChangePassword?: boolean;
  orgUnit?: { id: string; name: string } | null;
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Bị khóa', DISABLED: 'Vô hiệu hóa' };
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên Hệ thống',
  BOD: 'Ban Giám Đốc (Executive)',
  SHAREHOLDER: 'Cổ đông & Hội đồng Quản trị',
  KM_MANAGER: 'Cán bộ Quản trị Nhân sự',
  LINE_MANAGER: 'Quản lý / Trưởng bộ phận',
  HR_CB: 'Chuyên viên C&B (Lương & Phúc lợi)',
  ACCOUNTANT: 'Kế toán Doanh nghiệp & Thanh toán',
  HR_RECRUITER: 'Chuyên viên Tuyển dụng (Recruiter)',
  HR_TRAINER: 'Chuyên viên Đào tạo & Phát triển (L&D)',
  AUDITOR: 'Kiểm toán Nội bộ & Pháp chế',
  USER: 'Nhân viên (Cổng ESS)',
};

function toggleRoleList(list: string[], code: string, checked: boolean) {
  return checked ? Array.from(new Set([...list, code])) : list.filter((c) => c !== code);
}

function RoleCheckboxList({
  rolesList,
  selected,
  onChange,
  targetUserId,
  currentUserId,
  currentUserRoles,
  columns = 1,
  maxHeightClass = 'max-h-[260px]',
}: {
  rolesList: Array<{ code: string; name: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  targetUserId?: string | null;
  currentUserId?: string;
  currentUserRoles?: string[];
  columns?: 1 | 2;
  maxHeightClass?: string;
}) {
  return (
    <div
      className={`grid ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} ${maxHeightClass} gap-1.5 overflow-y-auto rounded-lg border border-border p-2`}
    >
      {rolesList.map((r) => {
        const checked = selected.includes(r.code);
        const lockSelfAdmin =
          r.code === 'ADMIN' &&
          Boolean(targetUserId) &&
          targetUserId === currentUserId &&
          Boolean(currentUserRoles?.includes('ADMIN'));
        return (
          <label
            key={r.code}
            className={`flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-xs transition-colors ${
              checked ? 'border-foreground bg-muted/40' : 'border-transparent hover:bg-muted/20'
            } ${lockSelfAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={lockSelfAdmin}
              onChange={(e) => onChange(toggleRoleList(selected, r.code, e.target.checked))}
              className="mt-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-foreground">{ROLE_LABEL[r.code] ?? r.name}</span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                {r.code}{lockSelfAdmin ? ' · Không thể tự gỡ khỏi tài khoản đang đăng nhập' : ''}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** KC02 — Quản lý người dùng: tạo tài khoản, gán nhiều vai trò, gán vai trò cho nhân sự. */
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '123', fullName: '', roleCodes: ['USER'] as string[] });
  const [showAssignEmployee, setShowAssignEmployee] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRoles, setAssignRoles] = useState<string[]>(['USER']);

  const q = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<{ items: UserRow[] }>('/users?limit=1000')).data.items,
  });

  const rolesQ = useQuery({
    queryKey: ['system-roles'],
    queryFn: async () => (await api.get<{ code: string; name: string }[]>('/roles')).data,
  });

  const rolesList = rolesQ.data ?? [
    { code: 'USER', name: 'Nhân viên (Cổng ESS)' },
    { code: 'LINE_MANAGER', name: 'Quản lý / Trưởng bộ phận' },
    { code: 'KM_MANAGER', name: 'Cán bộ Quản trị Nhân sự' },
    { code: 'HR_CB', name: 'Chuyên viên C&B (Lương & Phúc lợi)' },
    { code: 'ACCOUNTANT', name: 'Kế toán Doanh nghiệp & Thanh toán' },
    { code: 'HR_RECRUITER', name: 'Chuyên viên Tuyển dụng (Recruiter)' },
    { code: 'HR_TRAINER', name: 'Chuyên viên Đào tạo & Phát triển (L&D)' },
    { code: 'AUDITOR', name: 'Kiểm toán Nội bộ & Pháp chế' },
    { code: 'SHAREHOLDER', name: 'Cổ đông & Hội đồng Quản trị' },
    { code: 'BOD', name: 'Ban Giám Đốc (Executive)' },
    { code: 'ADMIN', name: 'Quản trị viên Hệ thống' },
  ];

  const create = useMutation({
    mutationFn: async () => {
      if (form.roleCodes.length === 0) throw new Error('Vui lòng chọn ít nhất 1 vai trò cho tài khoản');
      return api.post('/users', {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        roleCodes: form.roleCodes,
      });
    },
    onSuccess: () => {
      toast('Đã tạo tài khoản người dùng mới', 'success');
      setShowCreate(false);
      setForm({ email: '', password: '123', fullName: '', roleCodes: ['USER'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['system-roles'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => api.patch(`/users/${vars.id}`, { status: vars.status }),
    onSuccess: () => {
      toast('Đã cập nhật trạng thái', 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const requirePasswordChange = useMutation({
    mutationFn: async (id: string) => api.patch(`/users/${id}`, { mustChangePassword: true }),
    onSuccess: () => {
      toast('Đã yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo', 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const [roleModalUser, setRoleModalUser] = useState<UserRow | null>(null);
  const [roleModalValues, setRoleModalValues] = useState<string[]>(['USER']);

  const updateRole = useMutation({
    mutationFn: async (vars: { id: string; roleCodes: string[] }) =>
      api.patch(`/users/${vars.id}`, { roleCodes: vars.roleCodes }),
    onSuccess: () => {
      toast('Đã cập nhật vai trò phân quyền', 'success');
      setRoleModalUser(null);
      setShowAssignEmployee(false);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['system-roles'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<UserRow>[] = [
    { key: 'fullName', header: 'Người dùng', sortable: true, render: (u) => (
      <span>
        <span className="block font-medium">{u.fullName}</span>
        <span className="block text-xs text-muted-foreground">
          {u.employeeCode ? <span className="font-mono font-semibold text-foreground">{u.employeeCode}</span> : null}
          {u.employeeCode ? ' · ' : ''}{u.email}{u.jobTitle ? ` · ${u.jobTitle}` : ''}
        </span>
      </span>
    ) },
    { key: 'orgUnit', header: 'Đơn vị', sortable: true, sortValue: (u) => u.orgUnit?.name ?? '', render: (u) => u.orgUnit?.name ?? 'Chưa cập nhật' },
    { key: 'roles', header: 'Vai trò', render: (u) => (
      <span className="text-xs text-muted-foreground">
        {u.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ')}
      </span>
    ) },
    { key: 'status', header: 'Trạng thái', sortable: true, render: (u) => (
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
    ) },
    { key: 'passwordRotation', header: 'Mật khẩu', render: (u) => u.mustChangePassword
      ? <span className="text-xs font-medium text-amber-700">Cần đổi khi đăng nhập</span>
      : <span className="text-xs text-muted-foreground">Không có yêu cầu đổi</span> },
  ];

  const selectedAssignEmployee = (q.data ?? []).find((u) => u.id === assignUserId) ?? null;

  const openAssignEmployeeModal = () => {
    const first = (q.data ?? [])[0] ?? null;
    setAssignUserId(first?.id ?? '');
    setAssignRoles(first?.roles.length ? [...first.roles] : ['USER']);
    setShowAssignEmployee(true);
  };

  return (
    <>
      <PageHeader
        title="Tài khoản"
        description="Quản lý tài khoản người dùng và vai trò phân quyền."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={openAssignEmployeeModal} disabled={!q.data?.length}>
              <UserCheck className="h-4 w-4" /> Gán vai trò cho nhân sự
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Tạo tài khoản mới
            </Button>
          </div>
        }
      />

      <div className="print-area">
        <PrintFrame title="DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG" />
        {q.isError ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={q.data ?? []}
            rowKey={(u) => u.id}
            loading={q.isLoading}
            exportFilename="danh-sach-nguoi-dung"
            printLabel="In danh sách tài khoản"
            searchFields={(u) => [u.fullName, u.email, u.employeeCode ?? '', u.jobTitle ?? '', u.orgUnit?.name ?? '']}
            filters={[
              { key: 'status', label: 'Trạng thái', value: (u) => u.status, options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) },
              { key: 'role', label: 'Vai trò', value: (u) => u.roles[0] ?? '', matches: (u, v) => u.roles.includes(v), options: rolesList.map((r) => ({ value: r.code, label: ROLE_LABEL[r.code] ?? r.name })) },
              { key: 'passwordRotation', label: 'Mật khẩu', value: (u) => u.mustChangePassword ? 'required' : 'current', options: [{ value: 'required', label: 'Cần đổi khi đăng nhập' }, { value: 'current', label: 'Không có yêu cầu đổi' }] },
            ]}
            emptyTitle="Không tìm thấy người dùng nào"
            actions={(u): RowActionItem[] => [
              {
                label: 'Phân quyền vai trò',
                icon: ShieldCheck,
                onSelect: () => {
                  setRoleModalUser(u);
                  setRoleModalValues(u.roles.length ? [...u.roles] : ['USER']);
                },
              },
              !u.mustChangePassword
                ? { label: 'Yêu cầu đổi mật khẩu', icon: KeyRound, disabled: requirePasswordChange.isPending, onSelect: () => requirePasswordChange.mutate(u.id) }
                : { label: 'Đã yêu cầu đổi mật khẩu', icon: KeyRound, disabled: true, onSelect: () => undefined },
              u.status === 'ACTIVE'
                ? { label: 'Vô hiệu hóa tài khoản', icon: ShieldBan, danger: true, disabled: setStatus.isPending, onSelect: () => setStatus.mutate({ id: u.id, status: 'DISABLED' }) }
                : { label: 'Kích hoạt tài khoản', icon: ShieldCheck, disabled: setStatus.isPending, onSelect: () => setStatus.mutate({ id: u.id, status: 'ACTIVE' }) },
            ]}
          />
        )}
        <PrintSignatureBlock leftTitle="Quản trị viên lập bảng" middleTitle="Trưởng phòng CNTT" rightTitle="Giám đốc điều hành" />
      </div>

      {/* Modal Chỉnh sửa Phân quyền */}
      <Modal
        open={!!roleModalUser}
        onOpenChange={(open) => {
          if (!open) setRoleModalUser(null);
        }}
        title="Phân quyền Vai trò Tài khoản"
      >
        {roleModalUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (roleModalValues.length === 0) {
                toast('Vui lòng chọn ít nhất 1 vai trò hệ thống', 'error');
                return;
              }
              updateRole.mutate({ id: roleModalUser.id, roleCodes: roleModalValues });
            }}
            className="space-y-4"
          >
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1 text-xs">
              <div className="font-semibold text-foreground text-sm">{roleModalUser.fullName}</div>
              <div className="text-muted-foreground font-mono">
                {roleModalUser.employeeCode ? `${roleModalUser.employeeCode} · ` : ''}{roleModalUser.email}
              </div>
              <div className="text-muted-foreground">
                Đơn vị: <span className="text-foreground">{roleModalUser.orgUnit?.name ?? 'Chưa phân bổ'}</span>
                {roleModalUser.jobTitle ? ` · ${roleModalUser.jobTitle}` : ''}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Chọn các vai trò hệ thống *</Label>
                <span className="text-xs text-muted-foreground">Đã chọn {roleModalValues.length} vai trò</span>
              </div>
              <RoleCheckboxList
                rolesList={rolesList}
                selected={roleModalValues}
                onChange={setRoleModalValues}
                targetUserId={roleModalUser.id}
                currentUserId={currentUser?.id}
                currentUserRoles={currentUser?.roles}
              />
              {roleModalValues.length === 0 ? (
                <p className="text-xs text-rose-600">Tài khoản phải được gán tối thiểu 1 vai trò.</p>
              ) : null}
            </div>

            <ModalFooterActions
              onCancel={() => setRoleModalUser(null)}
              pending={updateRole.isPending}
              disabled={roleModalValues.length === 0}
              confirmLabel="Cập nhật vai trò"
            />
          </form>
        )}
      </Modal>

      <Modal
        open={showAssignEmployee}
        onOpenChange={setShowAssignEmployee}
        title="Gán vai trò cho nhân sự"
        description="Tìm chọn nhanh nhân sự trong hệ thống và cấu hình một hoặc nhiều vai trò truy cập."
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!assignUserId) {
              toast('Vui lòng chọn một nhân sự', 'error');
              return;
            }
            if (assignRoles.length === 0) {
              toast('Tài khoản phải có ít nhất 1 vai trò hệ thống', 'error');
              return;
            }
            updateRole.mutate({ id: assignUserId, roleCodes: assignRoles });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Chọn nhân sự / tài khoản *</Label>
            <Select
              searchable
              searchPlaceholder="Tìm theo họ tên, mã NV, email..."
              placeholder="Chọn nhân sự..."
              value={assignUserId}
              onChange={(e) => {
                const nextId = e.target.value;
                setAssignUserId(nextId);
                const found = (q.data ?? []).find((u) => u.id === nextId);
                setAssignRoles(found?.roles.length ? [...found.roles] : ['USER']);
              }}
            >
              {(q.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}{u.employeeCode ? ` (${u.employeeCode})` : ''} · {u.email}{u.orgUnit?.name ? ` · ${u.orgUnit.name}` : ''}
                </option>
              ))}
            </Select>
          </div>

          {selectedAssignEmployee ? (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1">
              <div className="font-semibold text-foreground">{selectedAssignEmployee.fullName}</div>
              <div className="font-mono text-muted-foreground">
                {selectedAssignEmployee.employeeCode ? `${selectedAssignEmployee.employeeCode} · ` : ''}{selectedAssignEmployee.email}
              </div>
              <div className="text-muted-foreground">
                Đơn vị: <span className="text-foreground">{selectedAssignEmployee.orgUnit?.name ?? 'Chưa phân bổ'}</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Vai trò hệ thống * (có thể chọn nhiều)</Label>
              <span className="text-xs text-muted-foreground">Đã chọn {assignRoles.length} vai trò</span>
            </div>
            <RoleCheckboxList
              rolesList={rolesList}
              selected={assignRoles}
              onChange={setAssignRoles}
              targetUserId={assignUserId}
              currentUserId={currentUser?.id}
              currentUserRoles={currentUser?.roles}
              columns={2}
              maxHeightClass="max-h-[240px]"
            />
            {assignRoles.length === 0 ? (
              <p className="text-xs text-rose-600">Tài khoản phải được gán tối thiểu 1 vai trò.</p>
            ) : null}
          </div>

          <ModalFooterActions
            onCancel={() => setShowAssignEmployee(false)}
            pending={updateRole.isPending}
            disabled={!assignUserId || assignRoles.length === 0}
            confirmLabel="Lưu phân quyền"
          />
        </form>
      </Modal>

      <Modal open={showCreate} onOpenChange={setShowCreate} title="Tạo tài khoản mới" description="Cấp tài khoản đăng nhập hệ thống và phân quyền vai trò truy cập.">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Họ tên *</Label>
            <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email *</Label>
            <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Mật khẩu khởi tạo *</Label>
            <Input required type="password" autoComplete="new-password" minLength={3} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="123" /></div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">Mật khẩu khởi tạo mặc định là 123. Quản trị viên có thể đổi riêng sau khi tạo tài khoản.</p>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Vai trò hệ thống * (có thể chọn nhiều)</Label>
              <span className="text-xs text-muted-foreground">Đã chọn {form.roleCodes.length}</span>
            </div>
            <RoleCheckboxList
              rolesList={rolesList}
              selected={form.roleCodes}
              onChange={(next) => setForm((prev) => ({ ...prev, roleCodes: next }))}
              columns={2}
              maxHeightClass="max-h-[210px]"
            />
            {form.roleCodes.length === 0 ? (
              <p className="text-xs text-rose-600">Vui lòng chọn ít nhất 1 vai trò.</p>
            ) : null}
          </div>
          <ModalFooterActions
            className="col-span-full"
            onCancel={() => setShowCreate(false)}
            pending={create.isPending}
            disabled={form.roleCodes.length === 0}
            confirmLabel="Tạo tài khoản mới"
          />
        </form>
      </Modal>
    </>
  );
}
