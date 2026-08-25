'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, FileText, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { CONTRACT_STATUS_LABEL, CONTRACT_TYPE_LABEL, EMPLOYMENT_STATUS_LABEL, vnd } from '@/lib/hr';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Skeleton, Textarea } from '@/components/ui/primitives';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintButton, PrintFrame } from '@/components/ui/print';

interface ContractRow {
  id: string; contractNo: string; type: keyof typeof CONTRACT_TYPE_LABEL;
  startDate: string; endDate: string | null; baseSalary: number;
  status: keyof typeof CONTRACT_STATUS_LABEL; note: string | null;
  fileUrl: string | null; fileName: string | null;
}
interface CertificateRow {
  id: string; name: string; certNo: string | null; issuedBy: string | null;
  issuedDate: string | null; expiryDate: string | null; fileUrl: string | null; storageSpot: string | null;
}
interface EmployeeDetail {
  id: string; employeeCode: string | null; fullName: string; email: string;
  jobTitle: string | null; orgUnit?: { name: string } | null;
  hireDate: string | null; employmentStatus: keyof typeof EMPLOYMENT_STATUS_LABEL;
  /** baseSalary + contracts chỉ có trong phản hồi khi viewer là ADMIN/KM_MANAGER (RBAC). */
  baseSalary?: number | null; birthDate: string | null; phone: string | null; address: string | null;
  bio: string | null; expertise: string[];
  contracts?: ContractRow[]; certificates: CertificateRow[];
  leaveBalances: { year: number; entitled: number; used: number }[];
}

/** UC09/UC10/UC11 — Hồ sơ chi tiết: tab thông tin, hợp đồng, văn bằng chứng chỉ. */
export default function EmployeeDetailPage() {
  // Next.js 14: params là object thường — dùng useParams() thay vì use(params)
  // (use() với object thường gây React error #438 "unsupported type")
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const toast = useToast();
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');

  const q = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get<EmployeeDetail>(`/employees/${id}`)).data,
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const [contractForm, setContractForm] = useState({ contractNo: '', type: 'FIXED_TERM', startDate: '', endDate: '', baseSalary: '', note: '' });
  const [certForm, setCertForm] = useState({ name: '', certNo: '', issuedBy: '', issuedDate: '', expiryDate: '', storageSpot: '' });
  const [contractFile, setContractFile] = useState<{ name: string; mimeType: string; sizeBytes: number; dataBase64: string } | null>(null);
  const [certFile, setCertFile] = useState<{ name: string; mimeType: string; sizeBytes: number; dataBase64: string } | null>(null);

  /** Đọc tập tin thành base64 để đính kèm bản mềm hợp đồng/văn bằng. */
  async function pickFile(f: File | null, set: (v: { name: string; mimeType: string; sizeBytes: number; dataBase64: string } | null) => void) {
    if (!f) { set(null); return; }
    if (f.size > 8 * 1024 * 1024) { toast('Tập tin vượt quá 8MB', 'error'); return; }
    const buf = await f.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    set({ name: f.name, mimeType: f.type || 'application/octet-stream', sizeBytes: f.size, dataBase64: btoa(binary) });
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['employee', id] });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {};
      if (profileForm.employeeCode) body.employeeCode = profileForm.employeeCode;
      if (profileForm.hireDate) body.hireDate = profileForm.hireDate;
      if (profileForm.employmentStatus) body.employmentStatus = profileForm.employmentStatus;
      if (profileForm.baseSalary) body.baseSalary = Number(profileForm.baseSalary);
      if (profileForm.phone) body.phone = profileForm.phone;
      if (profileForm.address) body.address = profileForm.address;
      if (profileForm.jobTitle) body.jobTitle = profileForm.jobTitle;
      return api.patch(`/employees/${id}/profile`, body);
    },
    onSuccess: () => { toast('Đã cập nhật hồ sơ', 'success'); setProfileOpen(false); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const createContract = useMutation({
    mutationFn: async () => api.post(`/employees/${id}/contracts`, {
      contractNo: contractForm.contractNo,
      type: contractForm.type,
      startDate: contractForm.startDate,
      endDate: contractForm.endDate || undefined,
      baseSalary: Number(contractForm.baseSalary),
      note: contractForm.note || undefined,
      file: contractFile ?? undefined,
    }),
    onSuccess: () => { toast('Đã tạo hợp đồng', 'success'); setContractOpen(false); setContractFile(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const createCert = useMutation({
    mutationFn: async () => api.post(`/employees/${id}/certificates`, {
      name: certForm.name,
      certNo: certForm.certNo || undefined,
      issuedBy: certForm.issuedBy || undefined,
      issuedDate: certForm.issuedDate || undefined,
      expiryDate: certForm.expiryDate || undefined,
      storageSpot: certForm.storageSpot || undefined,
      file: certFile ?? undefined,
    }),
    onSuccess: () => { toast('Đã thêm văn bằng chứng chỉ', 'success'); setCertOpen(false); setCertFile(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const deleteCert = useMutation({
    mutationFn: async (certId: string) => api.delete(`/employees/${id}/certificates/${certId}`),
    onSuccess: () => { toast('Đã xóa văn bằng', 'success'); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const emp = q.data;
  const balance = emp.leaveBalances[0];

  return (
    <>
      <PageHeader
        title={emp.fullName}
        description={`${emp.employeeCode ?? 'Chưa có mã NV'} · ${emp.jobTitle ?? '—'} · ${emp.orgUnit?.name ?? 'Chưa gắn đơn vị'}`}
        actions={
          <>
            <Link href="/employees"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Danh sách</Button></Link>
            {isHr ? <Button variant="outline" size="sm" onClick={() => { setProfileForm({}); setProfileOpen(true); }}>Sửa hồ sơ</Button> : null}
            <PrintButton label="In hồ sơ" />
          </>
        }
      />

      <div className="print-area space-y-stack">
        <PrintFrame title="PHIẾU HỒ SƠ NHÂN VIÊN" subtitle={`${emp.employeeCode ?? ''} — ${emp.fullName}`} />

        {/* Thông tin cá nhân */}
        <Card>
          <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {([
                ['Email', emp.email],
                ['Điện thoại', emp.phone ?? '—'],
                ['Ngày sinh', emp.birthDate ? formatDate(emp.birthDate) : '—'],
                ['Địa chỉ', emp.address ?? '—'],
                ['Ngày vào làm', emp.hireDate ? formatDate(emp.hireDate) : '—'],
                ['Trạng thái', EMPLOYMENT_STATUS_LABEL[emp.employmentStatus] ?? emp.employmentStatus],
                // RBAC: lương cơ bản chỉ hiển thị cho HR/Quản trị viên
                ...(isHr ? [['Lương cơ bản', vnd(emp.baseSalary)] as [string, string]] : []),
                ['Phép năm còn lại', balance ? `${balance.entitled - balance.used}/${balance.entitled} ngày (${balance.year})` : '—'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Hợp đồng lao động */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Hợp đồng lao động</CardTitle>
          </CardHeader>
          <CardContent>
            {!isHr ? (
              // RBAC: nhân viên thường không được xem hợp đồng (chứa lương)
              <p className="text-sm text-muted-foreground">Hợp đồng lao động chỉ hiển thị cho HR / Quản trị viên.</p>
            ) : (emp.contracts?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có hợp đồng nào.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Số HĐ</th><th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Hiệu lực</th><th className="px-3 py-2">Lương CB</th>
                      <th className="px-3 py-2">Trạng thái</th><th className="px-3 py-2">Bản mềm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.contracts?.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{c.contractNo}</td>
                        <td className="px-3 py-2">{CONTRACT_TYPE_LABEL[c.type] ?? c.type}</td>
                        <td className="px-3 py-2">{formatDate(c.startDate)}{c.endDate ? ` → ${formatDate(c.endDate)}` : ''}</td>
                        <td className="px-3 py-2">{vnd(c.baseSalary)}</td>
                        <td className="px-3 py-2">
                          <Badge className={c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary'}>
                            {CONTRACT_STATUS_LABEL[c.status] ?? c.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {c.fileUrl ? (
                            <a href={c.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Tải bản mềm</a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isHr ? (
              <Button size="sm" variant="outline" className="no-print mt-3" onClick={() => setContractOpen(true)}>
                <Plus className="h-4 w-4" /> Thêm hợp đồng
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {/* Văn bằng chứng chỉ — kho lưu trữ kép */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-4 w-4" /> Văn bằng – chứng chỉ</CardTitle>
          </CardHeader>
          <CardContent>
            {emp.certificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có văn bằng chứng chỉ nào.</p>
            ) : (
              <ul className="space-y-2">
                {emp.certificates.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {c.name} {c.certNo ? <span className="text-muted-foreground">· Số {c.certNo}</span> : null}
                        {c.fileUrl ? <a href={c.fileUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-primary hover:underline">[Tải bản scan]</a> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.issuedBy ?? '—'}{c.issuedDate ? ` · Cấp ${formatDate(c.issuedDate)}` : ''}
                        {c.expiryDate ? ` · Hết hạn ${formatDate(c.expiryDate)}` : ''}
                        {c.storageSpot ? ` · Vị trí tủ: ${c.storageSpot}` : ''}
                      </p>
                    </div>
                    {isHr ? (
                      <Button variant="ghost" size="sm" className="no-print" aria-label={`Xóa ${c.name}`} onClick={() => deleteCert.mutate(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {isHr ? (
              <Button size="sm" variant="outline" className="no-print mt-3" onClick={() => setCertOpen(true)}>
                <Plus className="h-4 w-4" /> Thêm văn bằng
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <Modal open={profileOpen} onOpenChange={setProfileOpen} title="Sửa hồ sơ nhân sự" size="lg">
        <form
          onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5"><Label>Mã NV</Label>
            <Input value={profileForm.employeeCode ?? emp.employeeCode ?? ''} onChange={(e) => setProfileForm({ ...profileForm, employeeCode: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Chức danh</Label>
            <Input value={profileForm.jobTitle ?? emp.jobTitle ?? ''} onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ngày vào làm</Label>
            <Input type="date" value={profileForm.hireDate ?? emp.hireDate?.slice(0, 10) ?? ''} onChange={(e) => setProfileForm({ ...profileForm, hireDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Trạng thái</Label>
            <Select value={profileForm.employmentStatus ?? emp.employmentStatus} onChange={(e) => setProfileForm({ ...profileForm, employmentStatus: e.target.value })}>
              {Object.entries(EMPLOYMENT_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select></div>
          <div className="space-y-1.5"><Label>Lương cơ bản (VND)</Label>
            <Input type="number" value={profileForm.baseSalary ?? emp.baseSalary ?? ''} onChange={(e) => setProfileForm({ ...profileForm, baseSalary: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Điện thoại</Label>
            <Input value={profileForm.phone ?? emp.phone ?? ''} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Địa chỉ</Label>
            <Input value={profileForm.address ?? emp.address ?? ''} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} /></div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setProfileOpen(false)} pending={updateProfile.isPending} />
          </div>
        </form>
      </Modal>

      <Modal open={contractOpen} onOpenChange={setContractOpen} title="Thêm hợp đồng lao động">
        <form
          onSubmit={(e) => { e.preventDefault(); createContract.mutate(); }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5"><Label>Số hợp đồng *</Label>
            <Input required value={contractForm.contractNo} onChange={(e) => setContractForm({ ...contractForm, contractNo: e.target.value })} placeholder="HDL-2026-001" /></div>
          <div className="space-y-1.5"><Label>Loại *</Label>
            <Select value={contractForm.type} onChange={(e) => setContractForm({ ...contractForm, type: e.target.value })}>
              {Object.entries(CONTRACT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select></div>
          <div className="space-y-1.5"><Label>Ngày hiệu lực *</Label>
            <Input required type="date" value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ngày hết hạn</Label>
            <Input type="date" value={contractForm.endDate} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Lương cơ bản (VND) *</Label>
            <Input required type="number" min={0} value={contractForm.baseSalary} onChange={(e) => setContractForm({ ...contractForm, baseSalary: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Ghi chú</Label>
            <Textarea className="min-h-[60px]" value={contractForm.note} onChange={(e) => setContractForm({ ...contractForm, note: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bản mềm hợp đồng (PDF/DOC/ảnh — tối đa 8MB)</Label>
            <input type="file" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm hover:file:bg-secondary/80"
              onChange={(e) => void pickFile(e.target.files?.[0] ?? null, setContractFile)} />
            {contractFile ? <p className="text-xs text-muted-foreground">Đã chọn: {contractFile.name}</p> : null}
          </div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setContractOpen(false)} pending={createContract.isPending} confirmLabel="Tạo hợp đồng" />
          </div>
        </form>
      </Modal>

      <Modal open={certOpen} onOpenChange={setCertOpen} title="Thêm văn bằng – chứng chỉ">
        <form
          onSubmit={(e) => { e.preventDefault(); createCert.mutate(); }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2"><Label>Tên văn bằng *</Label>
            <Input required value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Số hiệu</Label>
            <Input value={certForm.certNo} onChange={(e) => setCertForm({ ...certForm, certNo: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Nơi cấp</Label>
            <Input value={certForm.issuedBy} onChange={(e) => setCertForm({ ...certForm, issuedBy: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ngày cấp</Label>
            <Input type="date" value={certForm.issuedDate} onChange={(e) => setCertForm({ ...certForm, issuedDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ngày hết hạn</Label>
            <Input type="date" value={certForm.expiryDate} onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Vị trí tủ lưu trữ bản gốc</Label>
            <Input value={certForm.storageSpot} onChange={(e) => setCertForm({ ...certForm, storageSpot: e.target.value })} placeholder="VD: Tủ A2-03" /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bản scan văn bằng (PDF/ảnh — tối đa 8MB)</Label>
            <input type="file" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm hover:file:bg-secondary/80"
              onChange={(e) => void pickFile(e.target.files?.[0] ?? null, setCertFile)} />
            {certFile ? <p className="text-xs text-muted-foreground">Đã chọn: {certFile.name}</p> : null}
          </div>
          <div className="col-span-full flex justify-end gap-2">
            <ModalFooterActions onCancel={() => setCertOpen(false)} pending={createCert.isPending} confirmLabel="Thêm" />
          </div>
        </form>
      </Modal>
    </>
  );
}
