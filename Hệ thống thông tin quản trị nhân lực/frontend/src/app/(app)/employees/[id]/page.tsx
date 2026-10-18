'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, FileText, Plus, Printer, Trash2, ArrowRightLeft } from 'lucide-react';
import { api, errorMessage, openProtectedFile } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { CONTRACT_STATUS_LABEL, CONTRACT_TYPE_LABEL, EMPLOYMENT_STATUS_LABEL, vnd } from '@/lib/hr';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Skeleton, Textarea } from '@/components/ui/primitives';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { PageHeader, ErrorState } from '@/components/common/states';

interface ContractRow {
  id: string; contractNo: string; type: keyof typeof CONTRACT_TYPE_LABEL;
  startDate: string; endDate: string | null; baseSalary: number; compensationBasis: 'MONTHLY' | 'DAILY' | 'HOURLY';
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
  comprehensiveProfile?: { verificationStatus?: string; verifiedAt?: string | null; dataSource?: string } | null;
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
  const viewer = useAuthStore((s) => s.user);
  const roles = viewer?.roles ?? [];
  const isHr = roles.includes('ADMIN') || roles.includes('KM_MANAGER');

  const q = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get<EmployeeDetail>(`/employees/${id}`)).data,
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const [contractForm, setContractForm] = useState({ contractNo: '', type: 'FIXED_TERM', startDate: '', endDate: '', baseSalary: '', compensationBasis: 'MONTHLY', note: '' });
  const [certForm, setCertForm] = useState({ name: '', certNo: '', issuedBy: '', issuedDate: '', expiryDate: '', storageSpot: '' });
  const [contractFile, setContractFile] = useState<{ name: string; mimeType: string; sizeBytes: number; dataBase64: string } | null>(null);
  const [replacementContractFile, setReplacementContractFile] = useState<{ name: string; mimeType: string; sizeBytes: number; dataBase64: string } | null>(null);
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
      if (profileForm.phone) body.phone = profileForm.phone;
      if (profileForm.address) body.address = profileForm.address;
      if (profileForm.birthDate) body.birthDate = profileForm.birthDate;
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
      compensationBasis: contractForm.compensationBasis,
      note: contractForm.note || undefined,
      file: contractFile ?? undefined,
    }),
    onSuccess: () => { toast('Đã tạo hợp đồng', 'success'); setContractOpen(false); setContractFile(null); invalidate(); },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const uploadContractCopy = useMutation({
    mutationFn: async ({ contractId, file }: { contractId: string; file: { name: string; mimeType: string; sizeBytes: number; dataBase64: string } }) =>
      api.patch(`/employees/${id}/contracts/${contractId}`, { file }),
    onSuccess: () => { toast('Đã lưu bản mềm hợp đồng', 'success'); setReplacementContractFile(null); invalidate(); },
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
  const selectedContract = emp.contracts?.find((contract) => contract.id === selectedContractId) ?? null;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const activeContract = (emp.contracts ?? []).find((contract) => contract.status === 'ACTIVE'
    && contract.startDate.slice(0, 10) <= today && (!contract.endDate || contract.endDate.slice(0, 10) >= today));
  const canViewContracts = isHr || emp.id === viewer?.id;
  const balance = emp.leaveBalances[0];
  const missingProfileFields = [
    !emp.phone ? 'số điện thoại' : null,
    !emp.birthDate ? 'ngày sinh' : null,
    !emp.address ? 'địa chỉ liên hệ' : null,
  ].filter((field): field is string => Boolean(field));
  const hasNoActiveContract = canViewContracts && !activeContract;

  return (
    <>
      <PageHeader
        title={emp.fullName}
        description={`${emp.employeeCode ?? 'Chưa có mã NV'} · ${emp.jobTitle ?? 'Chưa cập nhật'} · ${emp.orgUnit?.name ?? 'Chưa gắn đơn vị'}`}
        actions={
          <>
            <Link href="/employees"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Danh sách</Button></Link>
            {isHr ? <Button variant="outline" size="sm" onClick={() => { setProfileForm({}); setProfileOpen(true); }}>Sửa thông tin liên hệ</Button> : null}
            {isHr ? <Link href={`/personnel?createFor=${id}&type=TRANSFER`}><Button variant="outline" size="sm"><ArrowRightLeft className="h-4 w-4" /> Đề xuất đổi đơn vị/chức danh</Button></Link> : null}
            <Link href={`/personnel-reports?userId=${id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Printer className="h-4 w-4" /> In lý lịch cá nhân
              </Button>
            </Link>
          </>
        }
      />

      <div className="space-y-stack">

        {/* Thông tin cá nhân */}
        <Card>
          <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {([
                ['Email', emp.email],
                ['Điện thoại', emp.phone?.trim() || 'Chưa cập nhật'],
                ['Ngày sinh', emp.birthDate ? formatDate(emp.birthDate) : 'Chưa cập nhật'],
                ['Xác minh hồ sơ', emp.comprehensiveProfile?.verificationStatus === 'VERIFIED' ? `Đã xác minh${emp.comprehensiveProfile.verifiedAt ? ` · ${formatDate(emp.comprehensiveProfile.verifiedAt)}` : ''}` : 'Chưa xác minh'],
                ['Địa chỉ', emp.address?.trim() || 'Chưa cập nhật'],
                ['Ngày vào làm', emp.hireDate ? formatDate(emp.hireDate) : 'Chưa cập nhật'],
                ['Trạng thái', EMPLOYMENT_STATUS_LABEL[emp.employmentStatus] ?? emp.employmentStatus],
                ...(canViewContracts ? [['Lương theo hợp đồng', activeContract ? `${vnd(activeContract.baseSalary)} / ${activeContract.compensationBasis === 'HOURLY' ? 'giờ' : activeContract.compensationBasis === 'DAILY' ? 'ngày' : 'tháng'}` : isHr && emp.baseSalary != null ? `${vnd(emp.baseSalary)} · Mức trong hồ sơ, chưa có hợp đồng hiệu lực` : 'Chưa có hợp đồng hiệu lực'] as [string, string]] : []),
                ['Phép năm còn lại', balance ? `${balance.entitled - balance.used}/${balance.entitled} ngày (${balance.year})` : 'Chưa cập nhật'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {isHr && (missingProfileFields.length > 0 || hasNoActiveContract) ? (
          <Card>
            <CardHeader><CardTitle>Thông tin cần đối chiếu và bổ sung</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {missingProfileFields.length > 0 ? (
                <p className="text-muted-foreground">Chưa có {missingProfileFields.join(', ')} trong hồ sơ hiện hành. Hãy lấy thông tin từ nhân viên hoặc hồ sơ gốc trước khi lưu.</p>
              ) : null}
              {hasNoActiveContract ? (
                <p className="text-muted-foreground">Chưa có hợp đồng hiệu lực để xác nhận mức lương. Không dùng mức lương trong hồ sơ thay cho điều khoản hợp đồng.</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {missingProfileFields.length > 0 ? <Button size="sm" variant="outline" onClick={() => { setProfileForm({}); setProfileOpen(true); }}>Cập nhật thông tin cá nhân</Button> : null}
                {hasNoActiveContract ? <Button size="sm" variant="outline" onClick={() => setContractOpen(true)}>Bổ sung hợp đồng đã đối chiếu</Button> : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Hợp đồng lao động */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Hợp đồng lao động</CardTitle>
          </CardHeader>
          <CardContent>
            {!canViewContracts ? (
              <p className="text-sm text-muted-foreground">Hợp đồng và mức lương chỉ hiển thị cho chính nhân viên đó hoặc HR có thẩm quyền.</p>
            ) : (emp.contracts?.length ?? 0) === 0 ? (
              <div className="space-y-2 rounded-md border border-dashed p-3 text-sm">
                <p className="font-medium">Chưa có hợp đồng được lưu cho nhân viên này.</p>
                <p className="text-muted-foreground">Mức lương trong hồ sơ chỉ để tham khảo, chưa đủ căn cứ tính lương theo hợp đồng. Chỉ thêm hợp đồng khi đã đối chiếu số hợp đồng, loại hợp đồng, ngày hiệu lực, mức lương và bản đã ký hoặc quyết định có thẩm quyền.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Số HĐ</th><th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Hiệu lực</th><th className="px-3 py-2">Lương CB</th>
                      <th className="px-3 py-2">Trạng thái</th><th className="px-3 py-2">Hợp đồng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.contracts?.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{c.contractNo}</td>
                        <td className="px-3 py-2">{CONTRACT_TYPE_LABEL[c.type] ?? c.type}</td>
                        <td className="px-3 py-2">{formatDate(c.startDate)}{c.endDate ? ` → ${formatDate(c.endDate)}` : ''}</td>
                        <td className="px-3 py-2">{vnd(c.baseSalary)} / {c.compensationBasis === 'HOURLY' ? 'giờ' : c.compensationBasis === 'DAILY' ? 'ngày' : 'tháng'}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                c.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'
                              }`}
                            />
                            {CONTRACT_STATUS_LABEL[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <button type="button" onClick={() => setSelectedContractId(c.id)} className="text-xs font-medium text-primary hover:underline">Xem chi tiết</button>
                            {c.fileUrl ? <button type="button" onClick={() => void openProtectedFile(c.fileUrl!)} className="text-xs text-primary hover:underline">Mở bản mềm</button> : <span className="text-xs text-muted-foreground">Chưa có tệp</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {emp.contracts?.some((contract) => contract.status === 'DRAFT') ? (
              <p className="mt-2 text-xs text-muted-foreground">Một số thông tin hợp đồng được ghi nhận từ hồ sơ hiện có và đang chờ HR đối chiếu với bản đã ký. Chỉ hợp đồng đã xác minh mới được dùng làm căn cứ tính lương.</p>
            ) : null}
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
              <p className="text-sm text-muted-foreground">Chưa có văn bằng/chứng chỉ được lưu. Bổ sung khi nhân viên cung cấp hồ sơ; đây không phải dữ liệu có thể tự suy ra từ thông tin hiện có.</p>
            ) : (
              <ul className="space-y-2">
                {emp.certificates.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {c.name} {c.certNo ? <span className="text-muted-foreground">· Số {c.certNo}</span> : null}
                        {c.fileUrl ? <button type="button" onClick={() => void openProtectedFile(c.fileUrl!)} className="no-print ml-2 text-xs text-primary hover:underline">[Tải bản scan]</button> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.issuedBy ?? 'Chưa cập nhật'}{c.issuedDate ? ` · Cấp ${formatDate(c.issuedDate)}` : ''}
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
      <Modal open={Boolean(selectedContract)} onOpenChange={(open) => { if (!open) { setSelectedContractId(null); setReplacementContractFile(null); } }} title={selectedContract ? `Hợp đồng ${selectedContract.contractNo}` : 'Chi tiết hợp đồng'} size="lg">
        {selectedContract ? (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Người lao động</dt><dd className="font-medium">{emp.fullName} · {emp.employeeCode ?? 'Chưa có mã nhân viên'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Loại hợp đồng</dt><dd className="font-medium">{CONTRACT_TYPE_LABEL[selectedContract.type] ?? selectedContract.type}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Ngày hiệu lực</dt><dd className="font-medium">{formatDate(selectedContract.startDate)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Ngày hết hạn</dt><dd className="font-medium">{selectedContract.endDate ? formatDate(selectedContract.endDate) : 'Không xác định thời hạn'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Lương theo hợp đồng</dt><dd className="font-medium">{vnd(selectedContract.baseSalary)} / {selectedContract.compensationBasis === 'HOURLY' ? 'giờ' : selectedContract.compensationBasis === 'DAILY' ? 'ngày' : 'tháng'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Trạng thái</dt><dd className="font-medium">{CONTRACT_STATUS_LABEL[selectedContract.status] ?? selectedContract.status}</dd></div>
              {selectedContract.note ? <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Ghi chú hồ sơ</dt><dd className="whitespace-pre-wrap">{selectedContract.note}</dd></div> : null}
            </dl>
            {selectedContract.status === 'DRAFT' ? <p className="border-t pt-3 text-xs text-muted-foreground">Hồ sơ này chưa được HR xác nhận hiệu lực. Cần đối chiếu số hợp đồng, điều khoản và bản đã ký trước khi dùng làm căn cứ tính lương.</p> : null}
            <div className="border-t pt-3">
              <p className="font-medium">Bản mềm hợp đồng</p>
              {selectedContract.fileUrl ? (
                <button type="button" onClick={() => void openProtectedFile(selectedContract.fileUrl!)} className="mt-1 inline-flex items-center gap-1.5 text-primary hover:underline"><FileText className="h-4 w-4" />Mở {selectedContract.fileName || 'tệp hợp đồng'}</button>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Chưa có bản mềm được lưu cho hồ sơ này.</p>
              )}
              {isHr ? (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="space-y-1 text-xs"><span className="block text-muted-foreground">Tải bản đã ký lên (PDF, DOC, DOCX hoặc ảnh; tối đa 8MB)</span>
                    <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => void pickFile(e.target.files?.[0] ?? null, setReplacementContractFile)} className="block max-w-full text-xs" />
                  </label>
                  {replacementContractFile ? <Button size="sm" disabled={uploadContractCopy.isPending} onClick={() => uploadContractCopy.mutate({ contractId: selectedContract.id, file: replacementContractFile })}>Lưu bản mềm</Button> : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={profileOpen} onOpenChange={setProfileOpen} title="Sửa thông tin liên hệ" size="lg">
        <form
          onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5"><Label>Mã NV</Label>
            <Input value={profileForm.employeeCode ?? emp.employeeCode ?? ''} onChange={(e) => setProfileForm({ ...profileForm, employeeCode: e.target.value })} /></div>
          <p className="sm:col-span-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">Chức danh, đơn vị, ngày vào làm và tình trạng công tác được cập nhật theo quyết định đã duyệt hoặc quy trình tuyển dụng/thử việc.</p>
          <div className="space-y-1.5"><Label>Điện thoại</Label>
            <Input value={profileForm.phone ?? emp.phone ?? ''} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ngày sinh</Label>
            <Input type="date" value={profileForm.birthDate ?? (emp.birthDate ? emp.birthDate.slice(0, 10) : '')} onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })} /></div>
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
          <div className="space-y-1.5"><Label>Cách trả lương *</Label>
            <Select value={contractForm.compensationBasis} onChange={(e) => setContractForm({ ...contractForm, compensationBasis: e.target.value })}>
              <option value="MONTHLY">Theo tháng</option><option value="DAILY">Theo ngày công</option><option value="HOURLY">Theo giờ</option>
            </Select></div>
          <div className="space-y-1.5"><Label>Mức trả theo đơn vị đã chọn (VND) *</Label>
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
