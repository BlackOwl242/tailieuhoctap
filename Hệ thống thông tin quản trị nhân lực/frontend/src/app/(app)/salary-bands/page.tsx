'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BriefcaseBusiness, Check, Pencil, Plus, RotateCcw } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/components/common/states';
import { Button, Card, Input, Select, Textarea } from '@/components/ui/primitives';
import { api, errorMessage } from '@/lib/api';
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
  approvedAt?: string | null;
  _count?: { employees: number; openings: number };
}

type BandForm = {
  code: string; name: string; levelTitle: string; minSalary: string; midSalary: string; maxSalary: string; compensationBasis: 'MONTHLY' | 'DAILY' | 'HOURLY';
  reviewCycleMonths: string; jobTitles: string; criteria: string; benchmarkSource: string; effectiveFrom: string; effectiveTo: string;
};

const blankForm = (): BandForm => ({
  code: '', name: '', levelTitle: '', minSalary: '', midSalary: '', maxSalary: '', compensationBasis: 'MONTHLY', reviewCycleMonths: '12',
  jobTitles: '', criteria: '', benchmarkSource: '', effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: '',
});

const unitLabel = (basis: SalaryBand['compensationBasis']) => basis === 'HOURLY' ? 'giờ' : basis === 'DAILY' ? 'ngày công' : 'tháng';
const money = (amount: number, basis: SalaryBand['compensationBasis']) => `${Number(amount || 0).toLocaleString('vi-VN')} đ/${unitLabel(basis)}`;
const statusLabel: Record<SalaryBand['status'], string> = { DRAFT: 'Chờ duyệt', ACTIVE: 'Đang áp dụng', INACTIVE: 'Ngừng áp dụng' };

export default function SalaryBandsPage() {
  const router = useRouter();
  const [orgConfig] = useOrgConfig();
  const isEnterprise = isEnterpriseSector(orgConfig);
  const qc = useQueryClient();
  const toast = useToast();
  const currentUser = useAuthStore(state => state.user);
  const roles = currentUser?.roles ?? [];

  useEffect(() => {
    if (!isEnterprise) router.replace('/salary-ranks');
  }, [isEnterprise, router]);
  const canManageDrafts = roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB'].includes(role));
  const canApproveBands = roles.some(role => ['ADMIN', 'BOD'].includes(role));
  const [editing, setEditing] = useState<SalaryBand | null>(null);
  const [form, setForm] = useState<BandForm>(blankForm);
  const bands = useQuery<SalaryBand[]>({ queryKey: ['salary-bands'], queryFn: async () => (await api.get('/salary-bands')).data });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.trim(), name: form.name.trim(), levelTitle: form.levelTitle.trim(),
        minSalary: Number(form.minSalary), midSalary: Number(form.midSalary), maxSalary: Number(form.maxSalary),
        compensationBasis: form.compensationBasis,
        reviewCycleMonths: Number(form.reviewCycleMonths), jobTitles: (form.jobTitles.includes(';') ? form.jobTitles.split(';') : form.jobTitles.split(',')).map(s => s.trim()).filter(Boolean),
        criteria: form.criteria.trim(), benchmarkSource: form.benchmarkSource.trim(), effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
      };
      return editing ? api.patch(`/salary-bands/${editing.id}`, payload) : api.post('/salary-bands', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-bands'] }); setEditing(null); setForm(blankForm()); toast('Đã lưu bản nháp khung lương. Ban Giám đốc cần duyệt trước khi dùng.', 'success'); },
    onError: e => toast(errorMessage(e), 'error'),
  });

  const activate = useMutation({
    mutationFn: (id: string) => api.post(`/salary-bands/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-bands'] }); toast('Đã duyệt khung lương.', 'success'); },
    onError: e => toast(errorMessage(e), 'error'),
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => api.post(`/salary-bands/${id}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-bands'] }); toast('Đã ngừng áp dụng khung lương.', 'success'); },
    onError: e => toast(errorMessage(e), 'error'),
  });

  const change = (key: keyof BandForm, value: string) => setForm(current => ({ ...current, [key]: value }));
  const edit = (band: SalaryBand) => {
    setEditing(band);
    setForm({ code: band.code, name: band.name, levelTitle: band.levelTitle, minSalary: String(band.minSalary), midSalary: String(band.midSalary), maxSalary: String(band.maxSalary), compensationBasis: band.compensationBasis, reviewCycleMonths: String(band.reviewCycleMonths), jobTitles: band.jobTitles.join('; '), criteria: band.criteria, benchmarkSource: band.benchmarkSource, effectiveFrom: band.effectiveFrom.slice(0, 10), effectiveTo: band.effectiveTo?.slice(0, 10) ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => { setEditing(null); setForm(blankForm()); };

  return <div className="space-y-5">
    <PageHeader title="Khung lương theo vị trí" description="Doanh nghiệp tự khảo sát, đề xuất khoảng lương; HR lập bản nháp và Ban Giám đốc duyệt trước khi sử dụng." />

    <Card className="space-y-2 border-primary/20 p-4 text-sm">
      <p className="font-semibold">Cách dùng</p>
      <p>Với mỗi nhóm công việc, nhập mức thấp nhất, mức tham chiếu và mức cao nhất theo đúng cách trả trong hợp đồng: tháng, ngày công hoặc giờ. Ghi rõ vị trí áp dụng, năng lực/kết quả cần có, nguồn tham khảo và ngày hiệu lực. Đây là chính sách nội bộ của doanh nghiệp, không phải mức lương mặc định của phần mềm.</p>
      <p className="text-muted-foreground">Cán bộ Nhân sự hoặc C&amp;B tạo và sửa bản nháp. Ban Giám đốc duyệt. Người lập không thể tự duyệt khung của mình; muốn thay đổi khung đã duyệt thì tạo phiên bản mới với ngày hiệu lực khác.</p>
    </Card>

    {canManageDrafts ? <Card className="space-y-4 p-4">
      <h2 className="flex items-center gap-2 font-semibold"><Plus className="h-4 w-4" />{editing ? 'Sửa bản nháp' : 'Tạo khung lương mới'}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm">Mã khung<Input value={form.code} onChange={e => change('code', e.target.value)} placeholder="VD: SALES-02" required /></label>
        <label className="space-y-1 text-sm">Tên khung<Input value={form.name} onChange={e => change('name', e.target.value)} placeholder="VD: Nhân viên kinh doanh độc lập" required /></label>
        <label className="space-y-1 text-sm">Cấp độ công việc<Input value={form.levelTitle} onChange={e => change('levelTitle', e.target.value)} placeholder="VD: Chuyên viên" required /></label>
        <label className="space-y-1 text-sm">Cách trả lương<Select value={form.compensationBasis} onChange={e => change('compensationBasis', e.target.value as BandForm['compensationBasis'])}><option value="MONTHLY">Theo tháng</option><option value="DAILY">Theo ngày công</option><option value="HOURLY">Theo giờ</option></Select></label>
        <label className="space-y-1 text-sm">Mức thấp nhất (đ/{unitLabel(form.compensationBasis)})<Input type="number" min={1} value={form.minSalary} onChange={e => change('minSalary', e.target.value)} required /></label>
        <label className="space-y-1 text-sm">Mức tham chiếu (đ/{unitLabel(form.compensationBasis)})<Input type="number" min={1} value={form.midSalary} onChange={e => change('midSalary', e.target.value)} required /></label>
        <label className="space-y-1 text-sm">Mức cao nhất (đ/{unitLabel(form.compensationBasis)})<Input type="number" min={1} value={form.maxSalary} onChange={e => change('maxSalary', e.target.value)} required /></label>
        <label className="space-y-1 text-sm">Rà soát lại sau (tháng)<Input type="number" min={1} value={form.reviewCycleMonths} onChange={e => change('reviewCycleMonths', e.target.value)} required /></label>
        <label className="space-y-1 text-sm">Ngày bắt đầu hiệu lực<Input type="date" value={form.effectiveFrom} onChange={e => change('effectiveFrom', e.target.value)} required /></label>
        <label className="space-y-1 text-sm">Ngày kết thúc hiệu lực (nếu có)<Input type="date" value={form.effectiveTo} onChange={e => change('effectiveTo', e.target.value)} /></label>
      </div>
      <label className="block space-y-1 text-sm">Chức danh thuộc khung (ngăn cách bằng dấu chấm phẩy)<Input value={form.jobTitles} onChange={e => change('jobTitles', e.target.value)} placeholder="VD: Nhân viên kinh doanh; Chuyên viên phát triển khách hàng" required /></label>
      <label className="block space-y-1 text-sm">Việc/năng lực cần làm được<Textarea value={form.criteria} onChange={e => change('criteria', e.target.value)} placeholder="Mô tả đầu ra, độ khó, mức tự chủ và trách nhiệm để xếp người vào khung." required /></label>
      <label className="block space-y-1 text-sm">Căn cứ xây dựng mức lương<Textarea value={form.benchmarkSource} onChange={e => change('benchmarkSource', e.target.value)} placeholder="Ghi nguồn khảo sát thị trường, thời điểm khảo sát, ngân sách đã được duyệt hoặc căn cứ nội bộ." required /></label>
      <div className="flex justify-end gap-2">
        {editing && <Button type="button" variant="outline" onClick={cancelEdit}><RotateCcw className="mr-1 h-4 w-4" />Hủy sửa</Button>}
        <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Đang lưu...' : 'Lưu bản nháp'}</Button>
      </div>
    </Card> : <Card className="p-4 text-sm text-muted-foreground">Bạn có quyền xem khung lương; quyền lập bản nháp thuộc Cán bộ Nhân sự/C&amp;B, còn quyền duyệt thuộc Ban Giám đốc.</Card>}

    {bands.isLoading ? <LoadingState text="Đang tải khung lương..." /> : bands.isError ? <ErrorState message={errorMessage(bands.error)} onRetry={() => bands.refetch()} /> : (bands.data ?? []).length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground"><BriefcaseBusiness className="mx-auto mb-2 h-6 w-6" />Chưa có khung lương. Hãy nhập căn cứ thật của doanh nghiệp ở biểu mẫu trên; phần mềm không tự điền mức lương mẫu.</Card> : <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1250px] border-collapse text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>{['Khung / cấp bậc','Vị trí áp dụng','Thấp nhất','Tham chiếu','Cao nhất','Hiệu lực / rà soát','Tiêu chí & căn cứ','Tình trạng','Thao tác'].map(h => <th key={h} className="px-3 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y">{bands.data!.map(band => <tr key={band.id} className="align-top hover:bg-muted/20">
      <td className="px-3 py-3"><div className="font-semibold">{band.name}</div><div className="mt-1 text-xs text-muted-foreground">{band.code} · {band.levelTitle} · theo {unitLabel(band.compensationBasis)}</div></td>
      <td className="max-w-[230px] px-3 py-3">{band.jobTitles.join('; ') || 'Chưa cập nhật'}</td><td className="whitespace-nowrap px-3 py-3">{money(band.minSalary, band.compensationBasis)}</td><td className="whitespace-nowrap px-3 py-3 font-semibold">{money(band.midSalary, band.compensationBasis)}</td><td className="whitespace-nowrap px-3 py-3">{money(band.maxSalary, band.compensationBasis)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-xs">Từ {band.effectiveFrom.slice(0, 10)}{band.effectiveTo ? ` đến ${band.effectiveTo.slice(0, 10)}` : ''}<div className="mt-1 text-muted-foreground">Rà soát mỗi {band.reviewCycleMonths} tháng</div><div className="text-muted-foreground">{band._count?.employees ?? 0} nhân viên · {band._count?.openings ?? 0} tin tuyển</div></td>
      <td className="max-w-[320px] px-3 py-3"><details><summary className="cursor-pointer font-medium">Xem tiêu chí và căn cứ</summary><p className="mt-2 whitespace-normal text-xs"><b>Tiêu chí:</b> {band.criteria}</p><p className="mt-2 whitespace-normal text-xs text-muted-foreground"><b>Căn cứ:</b> {band.benchmarkSource}</p></details></td>
      <td className="whitespace-nowrap px-3 py-3"><span className={`rounded px-2 py-1 text-xs ${band.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : band.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}>{statusLabel[band.status]}</span></td>
      <td className="px-3 py-3"><div className="flex flex-wrap gap-2">{band.status === 'DRAFT' && canManageDrafts && <Button size="sm" variant="outline" onClick={() => edit(band)}><Pencil className="mr-1 h-3.5 w-3.5" />Sửa</Button>}{band.status === 'DRAFT' && canApproveBands && <Button size="sm" onClick={() => activate.mutate(band.id)} disabled={activate.isPending}><Check className="mr-1 h-3.5 w-3.5" />Duyệt</Button>}{band.status === 'ACTIVE' && canApproveBands && <Button size="sm" variant="outline" onClick={() => deactivate.mutate(band.id)} disabled={deactivate.isPending}>Ngừng áp dụng</Button>}</div></td>
    </tr>)}</tbody></table></div>}
  </div>;
}
