'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldBan, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Input, Label, Select, Badge } from '@/components/ui/primitives';
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
const ROLE_LABEL: Record<string, string> = { ADMIN: 'Quản trị viên', KM_MANAGER: 'Quản lý nội dung', USER: 'Nhân viên' };

/** KC02 — Quản lý người dùng: tạo mới, gán vai, khóa/mở tài khoản (Mục 6 — DataTable). */
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', roleCode: 'USER' });

  const q = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<{ items: UserRow[] }>('/users')).data.items,
  });

  const create = useMutation({
    mutationFn: async () =>
      api.post('/users', { email: form.email, password: form.password, fullName: form.fullName, roleCodes: [form.roleCode] }),
    onSuccess: () => {
      toast('Đã tạo người dùng', 'success');
      setShowCreate(false);
      setForm({ email: '', password: '', fullName: '', roleCode: 'USER' });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
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

  const columns: DataColumn<UserRow>[] = [
    { key: 'fullName', header: 'Người dùng', sortable: true, render: (u) => (
      <span>
        <span className="block font-medium">{u.fullName}</span>
        <span className="block text-xs text-muted-foreground">{u.email}{u.jobTitle ? ` · ${u.jobTitle}` : ''}</span>
      </span>
    ) },
    { key: 'orgUnit', header: 'Đơn vị', sortable: true, sortValue: (u) => u.orgUnit?.name ?? '', render: (u) => u.orgUnit?.name ?? '—' },
    { key: 'roles', header: 'Vai trò', render: (u) => (
      <span className="flex flex-wrap gap-1">
        {u.roles.map((r) => <Badge key={r} variant="secondary">{ROLE_LABEL[r] ?? r}</Badge>)}
      </span>
    ) },
    { key: 'status', header: 'Trạng thái', sortable: true, render: (u) => (
      <Badge variant={u.status === 'ACTIVE' ? 'success' : u.status === 'LOCKED' ? 'warning' : 'destructive'}>
        {STATUS_LABEL[u.status] ?? u.status}
      </Badge>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="Quản lý người dùng"
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
              u.status === 'ACTIVE'
                ? { label: 'Vô hiệu hóa tài khoản', icon: ShieldBan, danger: true, disabled: setStatus.isPending, onSelect: () => setStatus.mutate({ id: u.id, status: 'DISABLED' }) }
                : { label: 'Kích hoạt tài khoản', icon: ShieldCheck, disabled: setStatus.isPending, onSelect: () => setStatus.mutate({ id: u.id, status: 'ACTIVE' }) },
            ]}
          />
        )}
        <PrintSignatureBlock leftTitle="Quản trị viên lập bảng" middleTitle="Trưởng phòng CNTT" rightTitle="Giám đốc điều hành" />
      </div>

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
              <option value="USER">Nhân viên</option>
              <option value="KM_MANAGER">Quản lý nội dung</option>
              <option value="ADMIN">Quản trị viên</option>
            </Select></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setShowCreate(false)} pending={create.isPending} confirmLabel="Tạo tài khoản" />
          </div>
        </form>
      </Modal>
    </>
  );
}
