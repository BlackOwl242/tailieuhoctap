'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldBan, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Input, Label, Select } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface UserRow {
  id: string; email: string; fullName: string; jobTitle: string | null;
  status: string; roles: string[];
  orgUnit?: { id: string; name: string } | null;
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Bị khóa', DISABLED: 'Vô hiệu hóa' };
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên Hệ thống',
  BOD: 'Ban Giám Đốc (Executive)',
  KM_MANAGER: 'Cán bộ Quản trị Nhân sự',
  LINE_MANAGER: 'Quản lý / Trưởng bộ phận',
  HR_CB: 'Chuyên viên C&B (Lương & Phúc lợi)',
  ACCOUNTANT: 'Kế toán Doanh nghiệp & Thanh toán',
  HR_RECRUITER: 'Chuyên viên Tuyển dụng (Recruiter)',
  HR_TRAINER: 'Chuyên viên Đào tạo & Phát triển (L&D)',
  AUDITOR: 'Kiểm toán Nội bộ & Pháp chế',
  USER: 'Nhân viên (Cổng ESS)',
};

/** KC02 — Quản lý người dùng: tạo mới, gán vai, khóa/mở tài khoản (Mục 6 — DataTable). */
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', roleCode: 'USER', jobTitle: '', orgUnitId: '' });

  const q = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<{ items: UserRow[] }>('/users?limit=1000')).data.items,
  });

  const orgUnitsQ = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => (await api.get<{ id: string; name: string; code: string }[]>('/org-units')).data,
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
    { code: 'BOD', name: 'Ban Giám Đốc (Executive)' },
    { code: 'ADMIN', name: 'Quản trị viên Hệ thống' },
  ];

  const create = useMutation({
    mutationFn: async () =>
      api.post('/users', {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        jobTitle: form.jobTitle || undefined,
        orgUnitId: form.orgUnitId || undefined,
        roleCodes: [form.roleCode],
      }),
    onSuccess: () => {
      toast('Đã tạo người dùng', 'success');
      setShowCreate(false);
      setForm({ email: '', password: '', fullName: '', roleCode: 'USER', jobTitle: '', orgUnitId: '' });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
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

  const [roleModalUser, setRoleModalUser] = useState<UserRow | null>(null);
  const [roleModalValue, setRoleModalValue] = useState<string>('USER');

  const updateRole = useMutation({
    mutationFn: async (vars: { id: string; roleCodes: string[] }) =>
      api.patch(`/users/${vars.id}`, { roleCodes: vars.roleCodes }),
    onSuccess: () => {
      toast('Đã cập nhật vai trò phân quyền', 'success');
      setRoleModalUser(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const columns: DataColumn<UserRow>[] = [
    { key: 'fullName', header: 'Người dùng', sortable: true, render: (u) => (
      <span>
        <span className="block font-medium">{u.fullName}</span>
        <span className="block text-xs text-muted-foreground">{u.email}{u.jobTitle ? ` · ${u.jobTitle}` : ''}</span>
      </span>
    ) },
    { key: 'orgUnit', header: 'Đơn vị', sortable: true, sortValue: (u) => u.orgUnit?.name ?? '', render: (u) => u.orgUnit?.name ?? '—' },
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
  ];

  return (
    <>
      <PageHeader
        title="Tài khoản"
        description="Quản lý tài khoản người dùng và vai trò phân quyền."
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Thêm người dùng
          </Button>
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
            searchFields={(u) => [u.fullName, u.email, u.jobTitle ?? '', u.orgUnit?.name ?? '']}
            filters={[
              { key: 'status', label: 'Trạng thái', value: (u) => u.status, options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) },
              { key: 'role', label: 'Vai trò', value: (u) => u.roles[0] ?? '', options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })) },
            ]}
            emptyTitle="Không tìm thấy người dùng nào"
            actions={(u): RowActionItem[] => [
              {
                label: 'Phân quyền vai trò',
                icon: ShieldCheck,
                onSelect: () => {
                  setRoleModalUser(u);
                  setRoleModalValue(u.roles[0] ?? 'USER');
                },
              },
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
              updateRole.mutate({ id: roleModalUser.id, roleCodes: [roleModalValue] });
            }}
            className="space-y-4"
          >
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1 text-xs">
              <div className="font-semibold text-foreground text-sm">{roleModalUser.fullName}</div>
              <div className="text-muted-foreground font-mono">{roleModalUser.email}</div>
              <div className="text-muted-foreground">
                Đơn vị: <span className="text-foreground">{roleModalUser.orgUnit?.name ?? 'Chưa phân bổ'}</span>
                {roleModalUser.jobTitle ? ` · ${roleModalUser.jobTitle}` : ''}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-role-select">Chọn vai trò hệ thống *</Label>
              <Select
                id="user-role-select"
                value={roleModalValue}
                onChange={(e) => setRoleModalValue(e.target.value)}
              >
                {rolesList.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <ModalFooterActions
                onCancel={() => setRoleModalUser(null)}
                pending={updateRole.isPending}
                confirmLabel="Cập nhật vai trò"
              />
            </div>
          </form>
        )}
      </Modal>

      <Modal open={showCreate} onOpenChange={setShowCreate} title="Thêm người dùng">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Họ tên *</Label>
            <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email *</Label>
            <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Mật khẩu khởi tạo *</Label>
            <Input required type="text" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="tối thiểu 8 ký tự" /></div>
          <div className="space-y-1.5"><Label>Vai trò</Label>
            <Select value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value })}>
              {rolesList.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </Select></div>
          <div className="space-y-1.5"><Label>Đơn vị công tác</Label>
            <Select value={form.orgUnitId} onChange={(e) => setForm({ ...form, orgUnitId: e.target.value })}>
              <option value="">— Chưa phân bổ —</option>
              {(orgUnitsQ.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
              ))}
            </Select></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Chức danh / Vị trí</Label>
            <Input placeholder="VD: Chuyên viên Phân tích nghiệp vụ" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setShowCreate(false)} pending={create.isPending} confirmLabel="Tạo tài khoản" />
          </div>
        </form>
      </Modal>
    </>
  );
}
