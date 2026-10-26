'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Check, Eye, Pencil, Plus, Power } from 'lucide-react';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';
import { Button, Input, Select, Textarea } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/lib/auth-store';
import { isEnterpriseSector, useOrgConfig } from '@/lib/org-config';

interface SalaryBand {
  id: string;
  code: string;
  name: string;
  levelTitle: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  compensationBasis: 'MONTHLY' | 'DAILY' | 'HOURLY';
  reviewCycleMonths: number;
  jobTitles: string[];
  criteria: string;
  benchmarkSource: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  supersedesId?: string | null;
  approvedAt?: string | null;
  createdById?: string | null;
  _count?: { employees: number; openings: number };
}

type BandForm = {
  code: string; name: string; levelTitle: string; minSalary: string; midSalary: string; maxSalary: string; compensationBasis: 'MONTHLY' | 'DAILY' | 'HOURLY';
  reviewCycleMonths: string; jobTitles: string; criteria: string; benchmarkSource: string; effectiveFrom: string; effectiveTo: string;
};

const blankForm = (): BandForm => ({
  code: '', name: '', levelTitle: '', minSalary: '', midSalary: '', maxSalary: '', compensationBasis: 'MONTHLY', reviewCycleMonths: '12',
  jobTitles: '', criteria: '', benchmarkSource: '', effectiveFrom: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), effectiveTo: '',
});

const unitLabel = (basis: SalaryBand['compensationBasis']) => basis === 'HOURLY' ? 'giờ' : basis === 'DAILY' ? 'ngày công' : 'tháng';
const money = (amount: number, basis: SalaryBand['compensationBasis']) => `${Number(amount || 0).toLocaleString('vi-VN')} đ/${unitLabel(basis)}`;
const statusLabel: Record<SalaryBand['status'], string> = { DRAFT: 'Chờ duyệt', ACTIVE: 'Đã duyệt', INACTIVE: 'Ngừng áp dụng' };

export default function SalaryBandsPage() {
  const router = useRouter();
  const [orgConfig] = useOrgConfig();
  const isEnterprise = isEnterpriseSector(orgConfig);
  const qc = useQueryClient();
  const toast = useToast();
  const currentUser = useAuthStore(state => state.user);
  const roles = currentUser?.roles ?? [];
  const canManageDrafts = roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB'].includes(role));
  const canApproveBands = roles.some(role => ['ADMIN', 'KM_MANAGER', 'BOD'].includes(role));
  const canDeactivateBands = roles.some(role => ['ADMIN', 'BOD'].includes(role));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryBand | null>(null);
  const [amending, setAmending] = useState<SalaryBand | null>(null);
  const [detail, setDetail] = useState<SalaryBand | null>(null);
  const [decision, setDecision] = useState<{ band: SalaryBand; kind: 'approve' | 'deactivate' } | null>(null);
  const [form, setForm] = useState<BandForm>(blankForm);
  const [formError, setFormError] = useState('');
  const bands = useQuery<SalaryBand[]>({ queryKey: ['salary-bands'], queryFn: async () => (await api.get('/salary-bands')).data, enabled: isEnterprise });

  useEffect(() => { if (!isEnterprise) router.replace('/salary-ranks'); }, [isEnterprise, router]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.trim(), name: form.name.trim(), levelTitle: form.levelTitle.trim(),
        minSalary: Number(form.minSalary), midSalary: Number(form.midSalary), maxSalary: Number(form.maxSalary),
        compensationBasis: form.compensationBasis, reviewCycleMonths: Number(form.reviewCycleMonths),
        jobTitles: (form.jobTitles.includes(';') ? form.jobTitles.split(';') : form.jobTitles.split(',')).map(s => s.trim()).filter(Boolean),
        criteria: form.criteria.trim(), benchmarkSource: form.benchmarkSource.trim(), effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
      };
      if (payload.minSalary > payload.midSalary || payload.midSalary > payload.maxSalary) throw new Error('Mức lương phải theo thứ tự: thấp nhất ≤ tham chiếu ≤ cao nhất.');
      if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) throw new Error('Ngày kết thúc không được trước ngày bắt đầu hiệu lực.');
      return amending ? api.post('/salary-bands/' + amending.id + '/amend', payload) : editing ? api.patch('/salary-bands/' + editing.id, payload) : api.post('/salary-bands', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-bands'] }); setEditorOpen(false); setEditing(null); setAmending(null); setForm(blankForm()); toast('Đã lưu bản nháp. Phụ trách quản trị nhân sự (KM_MANAGER), Ban Giám đốc (BOD) hoặc Quản trị viên (ADMIN) khác người lập/sửa gần nhất cần duyệt trước khi dùng.', 'success'); },
    onError: error => { const message = error instanceof Error && !isAxiosError(error) ? error.message : errorMessage(error); setFormError(message); toast(message, 'error'); },
  });
  const applyDecision = useMutation({
    mutationFn: async () => api.post('/salary-bands/' + decision!.band.id + '/' + decision!.kind),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-bands'] }); setDecision(null); toast('Đã cập nhật trạng thái khung lương.', 'success'); },
    onError: error => toast(errorMessage(error), 'error'),
  });
  const change = (key: keyof BandForm, value: string) => setForm(current => ({ ...current, [key]: value }));
  const edit = (band?: SalaryBand, amendment = false) => {
    setDetail(null); setEditing(amendment ? null : band ?? null); setAmending(amendment ? band ?? null : null); setFormError(''); save.reset();
    setForm(band ? { code: band.code, name: band.name, levelTitle: band.levelTitle, minSalary: String(band.minSalary), midSalary: String(band.midSalary), maxSalary: String(band.maxSalary), compensationBasis: band.compensationBasis, reviewCycleMonths: String(band.reviewCycleMonths), jobTitles: band.jobTitles.join('; '), criteria: band.criteria, benchmarkSource: band.benchmarkSource, effectiveFrom: band.effectiveFrom.slice(0, 10), effectiveTo: band.effectiveTo?.slice(0, 10) ?? '' } : blankForm());
    if (band && amendment) {
      const today = blankForm().effectiveFrom;
      const start = new Date((band.effectiveFrom.slice(0, 10) > today ? band.effectiveFrom.slice(0, 10) : today) + 'T00:00:00Z');
      start.setUTCDate(start.getUTCDate() + 1);
      setForm(current => ({ ...current, effectiveFrom: start.toISOString().slice(0, 10) }));
    }
    setEditorOpen(true);
  };
  const review = (band: SalaryBand, kind: 'approve' | 'deactivate') => { applyDecision.reset(); setDetail(null); setDecision({ band, kind }); };
  const selfCreated = (band: SalaryBand) => Boolean(band.createdById && band.createdById === currentUser?.id);
  const successor = (band: SalaryBand) => bands.data?.find(item => item.supersedesId === band.id);
  const amend = (band: SalaryBand) => { const draft = successor(band); draft?.status === 'DRAFT' ? edit(draft) : edit(band, true); };
  const amendmentSource = amending ?? bands.data?.find(band => band.id === editing?.supersedesId);
  const minAmendmentDate = (() => {
    if (!amendmentSource) return undefined;
    const today = blankForm().effectiveFrom;
    const day = new Date((amendmentSource.effectiveFrom.slice(0, 10) > today ? amendmentSource.effectiveFrom.slice(0, 10) : today) + 'T00:00:00Z');
    day.setUTCDate(day.getUTCDate() + 1);
    return day.toISOString().slice(0, 10);
  })();
  const columns: DataColumn<SalaryBand>[] = [
    { key: 'name', header: 'Khung lương', minWidth: 180, sortable: true, render: band => <div className="space-y-1"><button className="text-left font-medium hover:underline" onClick={() => setDetail(band)}>{band.name}</button><p className="text-xs text-muted-foreground">{band.code} · {band.levelTitle}{band.supersedesId ? ' · Bản điều chỉnh' : ''}</p></div>, exportValue: band => band.code + ' · ' + band.name + ' · ' + band.levelTitle },
    { key: 'jobTitles', header: 'Vị trí áp dụng', minWidth: 160, render: band => <p className="line-clamp-2 text-sm" title={band.jobTitles.join('; ')}>{band.jobTitles.join('; ') || 'Chưa cập nhật'}</p>, exportValue: band => band.jobTitles.join('; ') },
    { key: 'midSalary', header: 'Mức lương', minWidth: 200, sortable: true, render: band => <div className="space-y-1 tabular-nums"><p className="whitespace-nowrap text-sm font-medium">{band.minSalary.toLocaleString('vi-VN')} – {band.maxSalary.toLocaleString('vi-VN')}</p><p className="text-xs text-muted-foreground">Tham chiếu {money(band.midSalary, band.compensationBasis)}</p></div>, exportValue: band => 'Thấp nhất ' + money(band.minSalary, band.compensationBasis) + '; tham chiếu ' + money(band.midSalary, band.compensationBasis) + '; cao nhất ' + money(band.maxSalary, band.compensationBasis) },
    { key: 'effectiveFrom', header: 'Hiệu lực', minWidth: 130, sortable: true, render: band => <div className="space-y-1 text-xs"><p>Từ {formatDate(band.effectiveFrom)}</p><p className="text-muted-foreground">{band.effectiveTo ? 'Đến ' + formatDate(band.effectiveTo) : 'Không giới hạn'}</p></div>, exportValue: band => formatDate(band.effectiveFrom) + (band.effectiveTo ? ' – ' + formatDate(band.effectiveTo) : '') },
    { key: 'status', header: 'Trạng thái', minWidth: 126, sortable: true, render: band => <span className="inline-flex items-center gap-1.5 text-xs"><span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + (band.status === 'ACTIVE' ? 'bg-emerald-600' : band.status === 'DRAFT' ? 'bg-amber-600' : 'bg-muted-foreground')} />{statusLabel[band.status]}</span>, exportValue: band => statusLabel[band.status] },
  ];

  return <div className="space-y-5 pb-12">
    <WorkspaceHeader title="Khung lương theo vị trí" description="Quản lý khoảng lương và căn cứ áp dụng cho từng nhóm công việc." breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Khung lương vị trí' }]} actions={canManageDrafts ? <Button size="sm" onClick={() => edit()}><Plus className="h-4 w-4" />Tạo khung lương</Button> : undefined} />
    <details className="no-print rounded-lg border border-border p-4 text-sm">
      <summary className="w-fit cursor-pointer font-medium">Cách lập và duyệt khung lương</summary>
      <div className="mt-3 space-y-2 leading-6 text-muted-foreground">
        <p><b>Người lập và sửa:</b> Chuyên viên C&amp;B (HR_CB), Cán bộ Quản trị Nhân sự (KM_MANAGER) hoặc Quản trị viên (ADMIN). Chọn <b>Tạo khung lương</b>, nhập vị trí, ba mức lương, ngày hiệu lực và căn cứ rồi <b>Lưu bản nháp</b>.</p>
        <p><b>Người duyệt thông thường:</b> Phụ trách quản trị nhân sự (KM_MANAGER), áp dụng cho cả khung mới và bản điều chỉnh. HR_CB lập hồ sơ, KM_MANAGER kiểm tra và duyệt; không cần chờ Ban Giám đốc duyệt thêm một bước. Ban Giám đốc (BOD) hoặc Quản trị viên (ADMIN) vẫn có quyền duyệt khi cần. Tài khoản vừa lập hoặc lưu sửa bản nháp gần nhất không được tự duyệt, kể cả có role ADMIN.</p>
        <p><b>Cách duyệt:</b> Đăng nhập tài khoản KM_MANAGER (hoặc BOD/ADMIN) khác người lập/sửa gần nhất → mở <b>Tiền lương → Khung lương vị trí</b> → lọc <b>Chờ duyệt</b> → chọn <b>⋮ → Xem chi tiết</b> để kiểm tra → <b>Duyệt khung lương → Xác nhận duyệt</b>. Nút duyệt bị khóa nếu bạn là người lập/sửa gần nhất; các role khác không có thao tác duyệt.</p>
        <p>Khung đã duyệt được giữ lịch sử. Muốn thay đổi, chọn <b>Điều chỉnh khung lương</b> trong menu hành động, sửa thông tin và lưu bản nháp. Nếu đã có bản chờ duyệt, chọn <b>Sửa bản điều chỉnh</b> để tiếp tục. Khi được duyệt, bản cũ tự kết thúc trước ngày bản mới có hiệu lực. Mức tham chiếu là căn cứ nội bộ, không tự trở thành mức lương hợp đồng.</p>
      </div>
    </details>
    {bands.isError ? <ErrorState message={errorMessage(bands.error)} onRetry={() => bands.refetch()} /> : <DataTable columns={columns} rows={bands.data ?? []} rowKey={band => band.id} loading={bands.isLoading} searchFields={band => [band.code, band.name, band.levelTitle, ...band.jobTitles]} filters={[
      { key: 'status', label: 'Trạng thái', value: band => band.status, options: Object.entries(statusLabel).map(([value, label]) => ({ value, label })) },
      { key: 'basis', label: 'Cách trả lương', value: band => band.compensationBasis, options: [{ value: 'MONTHLY', label: 'Theo tháng' }, { value: 'DAILY', label: 'Theo ngày công' }, { value: 'HOURLY', label: 'Theo giờ' }] },
    ]} exportFilename="khung-luong-vi-tri" emptyTitle="Chưa có khung lương" emptyHint={canManageDrafts ? 'Chọn Tạo khung lương để nhập căn cứ và khoảng lương của doanh nghiệp.' : 'Khung lương sẽ xuất hiện sau khi HR lập hồ sơ.'} actions={(band): RowActionItem[] => [
      { label: 'Xem chi tiết', icon: Eye, onSelect: () => setDetail(band) },
      { label: 'Sửa bản nháp', icon: Pencil, hidden: !canManageDrafts || band.status !== 'DRAFT', onSelect: () => edit(band) },
      { label: successor(band)?.status === 'DRAFT' ? 'Sửa bản điều chỉnh' : 'Điều chỉnh khung lương', icon: Pencil, hidden: !canManageDrafts || band.status !== 'ACTIVE' || Boolean(successor(band) && successor(band)?.status !== 'DRAFT'), onSelect: () => amend(band) },
      { label: 'Duyệt khung lương', icon: Check, hidden: !canApproveBands || band.status !== 'DRAFT', disabled: selfCreated(band), onSelect: () => review(band, 'approve') },
      { label: 'Ngừng áp dụng', icon: Power, hidden: !canDeactivateBands || band.status !== 'ACTIVE', onSelect: () => review(band, 'deactivate'), danger: true },
    ]} />}

    <Modal open={editorOpen} onOpenChange={open => { if (!save.isPending) setEditorOpen(open); }} title={amending ? 'Điều chỉnh khung lương' : editing ? 'Sửa bản nháp khung lương' : 'Tạo khung lương'} description="Lưu bản nháp để Phụ trách quản trị nhân sự (KM_MANAGER), Ban Giám đốc (BOD) hoặc Quản trị viên (ADMIN) khác người lập/sửa gần nhất phê duyệt." size="xl">
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); setFormError(''); save.mutate(); }}>
        {amendmentSource && <p className="rounded-md bg-muted p-3 text-sm leading-6">Điều chỉnh từ khung <b>{amendmentSource.code}</b>. Chọn ngày áp dụng từ ngày mai trở đi, sau ngày bắt đầu của bản gốc. Bản hiện tại được giữ đến khi bản điều chỉnh được duyệt; hệ thống tự kết thúc bản cũ trước ngày áp dụng mới. Lương hợp đồng của nhân viên không tự thay đổi.</p>}
        <fieldset disabled={save.isPending} className="space-y-5">
          <section className="space-y-3"><h3 className="text-sm font-semibold">Thông tin khung</h3><div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">Mã khung *<Input readOnly={Boolean(amendmentSource)} value={form.code} onChange={e => change('code', e.target.value)} minLength={2} maxLength={40} placeholder="VD: SALES-02" required /></label>
            <label className="space-y-1.5 text-sm">Tên khung *<Input value={form.name} onChange={e => change('name', e.target.value)} minLength={2} maxLength={120} placeholder="VD: Nhân viên kinh doanh độc lập" required /></label>
            <label className="space-y-1.5 text-sm">Cấp độ công việc *<Input value={form.levelTitle} onChange={e => change('levelTitle', e.target.value)} minLength={2} maxLength={120} placeholder="VD: Chuyên viên" required /></label>
            <label className="space-y-1.5 text-sm">Cách trả lương<Select value={form.compensationBasis} onChange={e => change('compensationBasis', e.target.value as BandForm['compensationBasis'])}><option value="MONTHLY">Theo tháng</option><option value="DAILY">Theo ngày công</option><option value="HOURLY">Theo giờ</option></Select></label>
          </div><label className="block space-y-1.5 text-sm">Chức danh thuộc khung *<Input value={form.jobTitles} onChange={e => change('jobTitles', e.target.value)} placeholder="VD: Nhân viên kinh doanh; Chuyên viên phát triển khách hàng" required /><span className="block text-xs text-muted-foreground">Ngăn cách các chức danh bằng dấu chấm phẩy.</span></label></section>
          <section className="space-y-3 border-t pt-4"><h3 className="text-sm font-semibold">Mức lương (đ/{unitLabel(form.compensationBasis)})</h3><div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm">Thấp nhất *<Input type="number" min={1} value={form.minSalary} onChange={e => change('minSalary', e.target.value)} required /></label>
            <label className="space-y-1.5 text-sm">Tham chiếu *<Input type="number" min={1} value={form.midSalary} onChange={e => change('midSalary', e.target.value)} required /></label>
            <label className="space-y-1.5 text-sm">Cao nhất *<Input type="number" min={1} value={form.maxSalary} onChange={e => change('maxSalary', e.target.value)} required /></label>
          </div></section>
          <section className="space-y-3 border-t pt-4"><h3 className="text-sm font-semibold">Hiệu lực và căn cứ</h3><div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm">Bắt đầu hiệu lực *<Input type="date" min={minAmendmentDate} max={amendmentSource?.effectiveTo?.slice(0, 10)} value={form.effectiveFrom} onChange={e => change('effectiveFrom', e.target.value)} required /></label>
            <label className="space-y-1.5 text-sm">Kết thúc hiệu lực<Input type="date" min={form.effectiveFrom} value={form.effectiveTo} onChange={e => change('effectiveTo', e.target.value)} /></label>
            <label className="space-y-1.5 text-sm">Rà soát sau (tháng) *<Input type="number" min={1} value={form.reviewCycleMonths} onChange={e => change('reviewCycleMonths', e.target.value)} required /></label>
          </div><label className="block space-y-1.5 text-sm">Việc/năng lực cần làm được *<Textarea value={form.criteria} onChange={e => change('criteria', e.target.value)} minLength={10} maxLength={4000} placeholder="Đầu ra, mức tự chủ và trách nhiệm cần có của vị trí." required /></label><label className="block space-y-1.5 text-sm">Căn cứ xây dựng mức lương *<Textarea value={form.benchmarkSource} onChange={e => change('benchmarkSource', e.target.value)} minLength={10} maxLength={2000} placeholder="Nguồn khảo sát, thời điểm, ngân sách hoặc căn cứ nội bộ đã duyệt." required /></label></section>
        </fieldset>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <ModalFooterActions onCancel={() => { if (!save.isPending) setEditorOpen(false); }} pending={save.isPending} confirmLabel="Lưu bản nháp" />
      </form>
    </Modal>

    <Modal open={Boolean(detail)} onOpenChange={open => !open && setDetail(null)} title="Chi tiết khung lương" size="lg">
      {detail && <div className="space-y-4 text-sm"><div><h3 className="font-semibold">{detail.name}</h3><p className="mt-1 text-muted-foreground">{detail.code} · {detail.levelTitle} · {statusLabel[detail.status]}</p></div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[['Thấp nhất', money(detail.minSalary, detail.compensationBasis)], ['Tham chiếu', money(detail.midSalary, detail.compensationBasis)], ['Cao nhất', money(detail.maxSalary, detail.compensationBasis)]].map(([label, value]) => <div key={label} className="space-y-1"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{value}</dd></div>)}</dl>
        <dl className="space-y-3 border-t pt-4">{[['Vị trí áp dụng', detail.jobTitles.join('; ') || 'Chưa cập nhật'], ['Hiệu lực', formatDate(detail.effectiveFrom) + (detail.effectiveTo ? ' – ' + formatDate(detail.effectiveTo) : ' · Không giới hạn')], ['Chu kỳ rà soát', detail.reviewCycleMonths + ' tháng'], ['Đang liên kết', (detail._count?.employees ?? 0) + ' nhân viên · ' + (detail._count?.openings ?? 0) + ' tin tuyển'], ['Việc/năng lực cần làm được', detail.criteria], ['Căn cứ xây dựng mức lương', detail.benchmarkSource]].map(([label, value]) => <div key={label} className="space-y-1"><dt className="font-medium">{label}</dt><dd className="whitespace-pre-wrap break-words leading-6 text-muted-foreground">{value}</dd></div>)}</dl>
        {detail.status === 'DRAFT' && <p className="text-muted-foreground">{selfCreated(detail) ? 'Bạn là người lập/sửa gần nhất; cần một tài khoản Phụ trách quản trị nhân sự (KM_MANAGER), Ban Giám đốc (BOD) hoặc Quản trị viên (ADMIN) khác phê duyệt khung này.' : 'Phụ trách quản trị nhân sự (KM_MANAGER), Ban Giám đốc (BOD) hoặc Quản trị viên (ADMIN) khác người lập/sửa gần nhất được duyệt khung này.'}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">{detail.status === 'DRAFT' && canManageDrafts && <Button variant="outline" onClick={() => edit(detail)}>Sửa bản nháp</Button>}{detail.status === 'DRAFT' && canApproveBands && !selfCreated(detail) && <Button onClick={() => review(detail, 'approve')}>Duyệt khung lương</Button>}{detail.status === 'ACTIVE' && canManageDrafts && (!successor(detail) || successor(detail)?.status === 'DRAFT') && <Button onClick={() => amend(detail)}>{successor(detail)?.status === 'DRAFT' ? 'Sửa bản điều chỉnh' : 'Điều chỉnh khung lương'}</Button>}{detail.status === 'ACTIVE' && canDeactivateBands && <Button variant="outline" onClick={() => review(detail, 'deactivate')}>Ngừng áp dụng</Button>}</div>
      </div>}
    </Modal>

    <Modal open={Boolean(decision)} onOpenChange={open => { if (!applyDecision.isPending && !open) setDecision(null); }} title={decision?.kind === 'approve' ? 'Duyệt khung lương' : 'Ngừng áp dụng khung lương'} size="md">
      {decision && <div className="space-y-3 text-sm"><p className="font-medium">{decision.band.code} · {decision.band.name}</p><p>{money(decision.band.minSalary, decision.band.compensationBasis)} – {money(decision.band.maxSalary, decision.band.compensationBasis)}</p><p className="text-muted-foreground">{decision.kind === 'approve' ? (decision.band.supersedesId ? 'Bản điều chỉnh có hiệu lực từ ' + formatDate(decision.band.effectiveFrom) + '. Bản cũ tự kết thúc vào ngày liền trước. Lương hợp đồng của nhân viên không tự thay đổi.' : 'Khung được phê duyệt làm căn cứ theo ngày hiệu lực đã khai báo.') : 'Khung ngừng được chọn cho hồ sơ mới; dữ liệu và liên kết hiện có vẫn được giữ để đối soát.'}</p>{applyDecision.isError && <p role="alert" className="text-destructive">{errorMessage(applyDecision.error)}</p>}<ModalFooterActions onCancel={() => { if (!applyDecision.isPending) setDecision(null); }} pending={applyDecision.isPending} onConfirm={() => applyDecision.mutate()} confirmVariant={decision.kind === 'approve' ? 'default' : 'destructive'} confirmLabel={decision.kind === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận ngừng áp dụng'} /></div>}
    </Modal>
  </div>;
}
