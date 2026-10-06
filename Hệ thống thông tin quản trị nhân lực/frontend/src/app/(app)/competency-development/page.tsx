'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, BookOpenCheck, CheckCircle2, ClipboardList, Plus, Target } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/ui/toaster';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { Button, Input, Label, Select, Textarea } from '@/components/ui/primitives';

type Cycle = { id: string; name: string; year: number; status: string; startDate: string; endDate: string };
type Employee = { id: string; fullName: string; employeeCode: string | null };
type Assessment = {
  id: string; cycleId: string; userId: string; competencyCode: string; competencyName: string;
  currentLevel: number; managerLevel: number | null; targetLevel: number | null; selfNotes: string | null;
  evidenceUrl: string | null; managerNotes: string | null; managerEvidenceUrl: string | null; status: string;
  cycle: Cycle;
};
type CompetencyStandard = { id: string; code: string; name: string; description: string; applicableJobTitles: string[]; behavioralAnchors: string[] };
type Plan = {
  id: string; cycleId: string; userId: string; assessmentId: string | null; competencyCode: string;
  objective: string; successCriteria: string; actions: string[]; dueDate: string; status: string;
  evidence: { url: string; note?: string; submittedAt: string }[]; resultLevel: number | null; managerNotes: string | null;
};
type Goal = { id: string; kraTitle: string; targetMetric: string; evidences: { id: string; description: string; metricValue: string | null; evidenceUrl: string | null; createdAt: string }[] };
const levels = ['Chưa đánh giá', '1 · Cơ bản', '2 · Đang hình thành', '3 · Đạt yêu cầu', '4 · Thành thạo', '5 · Chuyên sâu'];
const card = 'rounded-xl border bg-card p-4 space-y-3';

export default function CompetencyDevelopmentPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const user = useAuthStore(s => s.user);
  const manager = Boolean(user?.roles.some(r => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'HR_TRAINER', 'LINE_MANAGER', 'BOD'].includes(r)));
  const [userId, setUserId] = useState(user?.id ?? '');
  const [cycleId, setCycleId] = useState('');
  const [form, setForm] = useState({ competencyCode: '', currentLevel: '1', targetLevel: '3', selfNotes: '', evidenceUrl: '' });
  const [standardForm, setStandardForm] = useState({ code: '', name: '', description: '', applicableJobTitles: '', behavioralAnchors: ['', '', '', '', ''] });
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { managerLevel: string; managerNotes: string; managerEvidenceUrl: string }>>({});
  const [planForm, setPlanForm] = useState({ assessmentId: '', objective: '', successCriteria: '', actions: '', dueDate: '' });

  const cycles = useQuery<Cycle[]>({ queryKey: ['hrms-performance-cycles'], queryFn: async () => (await api.get('/hrms/performance/cycles')).data });
  const employees = useQuery<Employee[]>({ queryKey: ['employees-competency'], queryFn: async () => (await api.get('/employees')).data, enabled: manager });
  const assessments = useQuery<Assessment[]>({ queryKey: ['hrms-competencies', userId], queryFn: async () => (await api.get('/hrms/performance/competencies', { params: { userId } })).data, enabled: Boolean(userId) });
  const standards = useQuery<CompetencyStandard[]>({ queryKey: ['hrms-competency-standards'], queryFn: async () => (await api.get('/hrms/performance/competency-standards')).data });
  const plans = useQuery<Plan[]>({ queryKey: ['hrms-development-plans', userId], queryFn: async () => (await api.get('/hrms/performance/development-plans', { params: { userId } })).data, enabled: Boolean(userId) });
  const goals = useQuery<Goal[]>({ queryKey: ['hrms-performance-goals-evidence', cycleId, userId], queryFn: async () => (await api.get('/hrms/performance/goals', { params: { cycleId, userId } })).data, enabled: Boolean(cycleId && userId) });
  const timeline = useMemo(() => [...(assessments.data ?? [])].sort((a,b) => a.cycle.startDate.localeCompare(b.cycle.startDate)), [assessments.data]);
  const timelineCycles = Array.from(new Map(timeline.map(a => [a.cycleId, a.cycle])).values());
  const timelineCompetencyCodes = Array.from(new Set(timeline.map(a => a.competencyCode)));
  useEffect(() => { if (!userId && user?.id) setUserId(user.id); }, [user?.id, userId]);
  useEffect(() => { if (!cycleId && cycles.data?.length) setCycleId(cycles.data.find(c => c.status === 'ACTIVE')?.id ?? cycles.data[0].id); }, [cycles.data, cycleId]);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['hrms-competencies', userId] });
    qc.invalidateQueries({ queryKey: ['hrms-development-plans', userId] });
    qc.invalidateQueries({ queryKey: ['hrms-performance-goals-evidence', cycleId, userId] });
  };
  const reportError = (e: unknown) => toast(errorMessage(e), 'error');
  const canManageStandards = Boolean(user?.roles.some(r => ['ADMIN', 'HR_TRAINER', 'HR_CB', 'BOD'].includes(r)));
  const selectedStandard = standards.data?.find(s => s.code === form.competencyCode);
  useEffect(() => { if (!form.competencyCode && standards.data?.length) setForm(prev => ({ ...prev, competencyCode: standards.data![0].code })); }, [standards.data, form.competencyCode]);

  const assess = useMutation({
    mutationFn: async () => api.post('/hrms/performance/competencies', { cycleId, userId, competencyCode: form.competencyCode, currentLevel: Number(form.currentLevel), targetLevel: Number(form.targetLevel), selfNotes: form.selfNotes, evidenceUrl: form.evidenceUrl || undefined }),
    onSuccess: () => { toast('Đã lưu đánh giá năng lực theo kỳ', 'success'); invalidate(); }, onError: reportError,
  });
  const review = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: { managerLevel: string; managerNotes: string; managerEvidenceUrl: string } }) => api.post(`/hrms/performance/competencies/${id}/review`, { managerLevel: Number(draft.managerLevel), managerNotes: draft.managerNotes, managerEvidenceUrl: draft.managerEvidenceUrl || undefined }),
    onSuccess: () => { toast('Đã lưu thẩm định của quản lý', 'success'); invalidate(); }, onError: reportError,
  });
  const createStandard = useMutation({
    mutationFn: async () => api.post('/hrms/performance/competency-standards', {
      code: standardForm.code.trim().toUpperCase(), name: standardForm.name, description: standardForm.description,
      applicableJobTitles: standardForm.applicableJobTitles.split('\n').map(s => s.trim()).filter(Boolean), behavioralAnchors: standardForm.behavioralAnchors,
    }),
    onSuccess: () => { toast('Đã thêm chuẩn năng lực', 'success'); setStandardForm({ code: '', name: '', description: '', applicableJobTitles: '', behavioralAnchors: ['', '', '', '', ''] }); qc.invalidateQueries({ queryKey: ['hrms-competency-standards'] }); }, onError: reportError,
  });
  const deactivateStandard = useMutation({
    mutationFn: async (id: string) => api.delete(`/hrms/performance/competency-standards/${id}`),
    onSuccess: () => { toast('Đã ngừng áp dụng chuẩn năng lực', 'success'); qc.invalidateQueries({ queryKey: ['hrms-competency-standards'] }); }, onError: reportError,
  });
  const createPlan = useMutation({
    mutationFn: async () => api.post('/hrms/performance/development-plans', {
      cycleId, userId, assessmentId: planForm.assessmentId || undefined,
      competencyCode: form.competencyCode || (assessments.data ?? []).find(a => a.id === planForm.assessmentId)?.competencyCode,
      objective: planForm.objective, successCriteria: planForm.successCriteria,
      actions: planForm.actions.split('\n').map(s => s.trim()).filter(Boolean), dueDate: planForm.dueDate,
    }),
    onSuccess: () => { toast('Đã lập kế hoạch phát triển', 'success'); setPlanForm({ assessmentId: '', objective: '', successCriteria: '', actions: '', dueDate: '' }); invalidate(); }, onError: reportError,
  });
  const updatePlan = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`/hrms/performance/development-plans/${id}`, body),
    onSuccess: () => { toast('Đã cập nhật kế hoạch', 'success'); invalidate(); }, onError: reportError,
  });
  const addGoalEvidence = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { description: string; metricValue?: string; evidenceUrl?: string } }) => api.post(`/hrms/performance/goals/${id}/evidence`, body),
    onSuccess: () => { toast('Đã lưu minh chứng KPI', 'success'); invalidate(); }, onError: reportError,
  });

  return <div className="space-y-5 pb-12">
    <WorkspaceHeader title="Năng lực & phát triển" description="Theo dõi mức năng lực qua nhiều kỳ, lưu minh chứng KPI và biến khoảng trống năng lực thành kế hoạch có mốc kiểm chứng." breadcrumbs={[{ label: 'Đánh giá & Đào tạo', href: '/performance-360' }, { label: 'Năng lực & phát triển' }]} />

    {canManageStandards && <details className={card}>
      <summary className="cursor-pointer font-semibold">Quản lý chuẩn năng lực</summary>
      <p className="text-sm text-muted-foreground">Mỗi chuẩn có 5 mô tả hành vi quan sát được. Chuẩn đã tạo không sửa đè lịch sử; nếu chính sách thay đổi, tạo mã phiên bản mới và ngừng chuẩn cũ.</p>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); createStandard.mutate(); }}>
        <div className="grid gap-3 sm:grid-cols-2"><div><Label>Mã chuẩn</Label><Input required minLength={2} value={standardForm.code} onChange={e => setStandardForm({ ...standardForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_.-]/g, '_') })} placeholder="VD: CUSTOMER_SERVICE"/></div><div><Label>Tên năng lực</Label><Input required minLength={2} value={standardForm.name} onChange={e => setStandardForm({ ...standardForm, name: e.target.value })}/></div></div>
        <div><Label>Mục đích và phạm vi</Label><Textarea required minLength={10} value={standardForm.description} onChange={e => setStandardForm({ ...standardForm, description: e.target.value })}/></div>
        <div><Label>Chức danh áp dụng (mỗi dòng một chức danh, để trống nếu dùng chung)</Label><Textarea value={standardForm.applicableJobTitles} onChange={e => setStandardForm({ ...standardForm, applicableJobTitles: e.target.value })}/></div>
        <div className="grid gap-3 md:grid-cols-2">{standardForm.behavioralAnchors.map((anchor, index) => <div key={index}><Label>Mức {index + 1} · {levels[index + 1].split(' · ')[1]}</Label><Textarea required minLength={10} value={anchor} onChange={e => setStandardForm({ ...standardForm, behavioralAnchors: standardForm.behavioralAnchors.map((a, i) => i === index ? e.target.value : a) })} placeholder="Mô tả hành vi nhìn thấy được trong công việc"/></div>)}</div>
        <Button disabled={createStandard.isPending}>Thêm chuẩn năng lực</Button>
      </form>
      <div className="space-y-2 border-t pt-3">{standards.data?.map(s => <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><div><b>{s.name}</b> · {s.code}<p className="text-muted-foreground">{s.description}{s.applicableJobTitles.length ? ` · Áp dụng: ${s.applicableJobTitles.join(', ')}` : ' · Dùng chung'}</p></div><Button size="sm" variant="outline" disabled={deactivateStandard.isPending} onClick={() => deactivateStandard.mutate(s.id)}>Ngừng áp dụng</Button></div>)}</div>
    </details>}

    <section className={card}>
      <div className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary"/>Nhân sự và kỳ đánh giá</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Nhân sự</Label>{manager ? <Select value={userId} onChange={e => setUserId(e.target.value)}><option value={user?.id}>{user?.fullName} (tôi)</option>{employees.data?.filter(e => e.id !== user?.id).map(e => <option key={e.id} value={e.id}>{e.fullName} {e.employeeCode ? `(${e.employeeCode})` : ''}</option>)}</Select> : <p className="mt-2 text-sm">{user?.fullName}</p>}</div>
        <div><Label>Kỳ đang làm việc</Label><Select value={cycleId} onChange={e => setCycleId(e.target.value)}><option value="">Chọn kỳ đánh giá</option>{cycles.data?.map(c => <option key={c.id} value={c.id}>{c.name} · {c.status === 'ACTIVE' ? 'đang mở' : 'đã khóa'}</option>)}</Select></div>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      {userId === user?.id ? <form className={card} onSubmit={e => { e.preventDefault(); assess.mutate(); }}>
        <h2 className="flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-primary"/>Tự đánh giá</h2>
        <p className="text-sm text-muted-foreground">Chọn chuẩn áp dụng cho công việc, đọc mô tả hành vi rồi chọn mức gần nhất. Quản lý sẽ ghi thẩm định riêng; phần tự đánh giá được giữ nguyên.</p>
        <div><Label>Chuẩn năng lực</Label><Select required value={form.competencyCode} onChange={e => setForm({ ...form, competencyCode: e.target.value })}><option value="">Chọn năng lực</option>{standards.data?.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}</Select></div>
        {selectedStandard && <p className="rounded-lg bg-muted p-3 text-sm">{selectedStandard.description}{selectedStandard.applicableJobTitles.length > 0 && <span className="block text-muted-foreground">Chức danh: {selectedStandard.applicableJobTitles.join(', ')}</span>}</p>}
        <div className="grid gap-3 sm:grid-cols-2"><div><Label>Mức hiện tại (1–5)</Label><Select value={form.currentLevel} onChange={e => setForm({ ...form, currentLevel: e.target.value })}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{levels[n]}</option>)}</Select></div><div><Label>Mức muốn đạt tiếp theo</Label><Select value={form.targetLevel} onChange={e => setForm({ ...form, targetLevel: e.target.value })}>{[1,2,3,4,5].filter(n => n >= Number(form.currentLevel)).map(n => <option key={n} value={n}>{levels[n]}</option>)}</Select></div></div>
        {selectedStandard && <div className="rounded-lg border-l-4 border-primary bg-muted p-3 text-sm"><b>Mô tả của mức {form.currentLevel}:</b><p>{selectedStandard.behavioralAnchors[Number(form.currentLevel) - 1]}</p></div>}
        <div><Label>Ví dụ công việc làm căn cứ (ít nhất 20 ký tự)</Label><Textarea required minLength={20} maxLength={2000} value={form.selfNotes} onChange={e => setForm({ ...form, selfNotes: e.target.value })} placeholder="Nêu tình huống, việc bạn đã làm và kết quả cụ thể"/></div>
        <div><Label>Liên kết minh chứng (nếu có)</Label><Input type="url" value={form.evidenceUrl} onChange={e => setForm({ ...form, evidenceUrl: e.target.value })} placeholder="https://..."/></div>
        <Button disabled={!cycleId || !userId || !form.competencyCode || cycles.data?.find(c => c.id === cycleId)?.status !== 'ACTIVE' || assess.isPending || !standards.data?.length}><Plus className="mr-1 h-4 w-4"/>Lưu tự đánh giá</Button>
      </form> : <div className={card}><h2 className="font-semibold">Đang xem hồ sơ của nhân sự khác</h2><p className="text-sm text-muted-foreground">Phần tự đánh giá do chính nhân viên lập. Quản lý sử dụng phần thẩm định bên dưới.</p></div>}

      <form className={card} onSubmit={e => { e.preventDefault(); createPlan.mutate(); }}>
        <h2 className="flex items-center gap-2 font-semibold"><BookOpenCheck className="h-4 w-4 text-primary"/>Kế hoạch cải thiện năng lực</h2>
        <div><Label>Liên kết đánh giá</Label><Select value={planForm.assessmentId} onChange={e => { const a = assessments.data?.find(x => x.id === e.target.value); setPlanForm({ ...planForm, assessmentId: e.target.value }); if (a) setForm({ ...form, competencyCode: a.competencyCode }); }}><option value="">Chọn năng lực đã đánh giá</option>{assessments.data?.filter(a => a.cycleId === cycleId).map(a => <option key={a.id} value={a.id}>{a.competencyName} · mức {a.currentLevel} → {a.targetLevel ?? 'chưa đặt'}</option>)}</Select></div>
        <div><Label>Mục tiêu cải thiện</Label><Input required minLength={5} value={planForm.objective} onChange={e => setPlanForm({ ...planForm, objective: e.target.value })} placeholder="Tự thực hiện phân tích và trình bày một bộ dữ liệu"/></div>
        <div><Label>Tiêu chí đạt</Label><Input required minLength={5} value={planForm.successCriteria} onChange={e => setPlanForm({ ...planForm, successCriteria: e.target.value })} placeholder="Báo cáo được quản lý xác nhận theo rubric"/></div>
        <div><Label>Các hoạt động (mỗi dòng một việc)</Label><Textarea required value={planForm.actions} onChange={e => setPlanForm({ ...planForm, actions: e.target.value })} placeholder={'Học mô-đun ...\nThực hành trên ...\nNhận phản hồi từ ...'}/></div>
        <div><Label>Hạn hoàn thành</Label><Input required type="date" value={planForm.dueDate} onChange={e => setPlanForm({ ...planForm, dueDate: e.target.value })}/></div>
        <Button disabled={!cycleId || !planForm.assessmentId || createPlan.isPending}><Plus className="mr-1 h-4 w-4"/>Tạo kế hoạch</Button>
      </form>
    </section>

    <section className={card}>
      <h2 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary"/>Tiến triển qua các kỳ</h2>
      {timeline.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Năng lực</th>{timelineCycles.map(c => <th key={c.id} className="p-2">{c.name}</th>)}</tr></thead><tbody>{timelineCompetencyCodes.map(code => <tr key={code} className="border-b"><th className="p-2 text-left">{timeline.find(a => a.competencyCode === code)?.competencyName}</th>{timelineCycles.map(c => { const a = timeline.find(x => x.competencyCode === code && x.cycleId === c.id); return <td key={c.id} className="p-2">{a ? <span title={a.selfNotes ?? ''}>Tự {a.currentLevel}/5{a.managerLevel ? ` · QL ${a.managerLevel}/5` : ''}{a.targetLevel ? ` · mục tiêu ${a.targetLevel}` : ''}</span> : 'Chưa cập nhật'}</td>; })}</tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">Chưa có đánh giá năng lực ở các kỳ đang xem.</p>}
    </section>

    {manager && userId !== user?.id && <section className={card}>
      <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary"/>Quản lý thẩm định</h2>
      <p className="text-sm text-muted-foreground">Đọc ví dụ nhân viên cung cấp, đối chiếu mô tả hành vi cùng thang điểm và ghi căn cứ cho mức thẩm định. Hai mức điểm được lưu riêng để trao đổi khi có chênh lệch.</p>
      {!cycleId ? <p className="text-sm text-muted-foreground">Chọn kỳ đánh giá.</p> : assessments.data?.filter(a => a.cycleId === cycleId).length ? assessments.data.filter(a => a.cycleId === cycleId).map(a => {
        const draft = reviewDrafts[a.id] ?? { managerLevel: String(a.currentLevel), managerNotes: '', managerEvidenceUrl: '' };
        const standard = standards.data?.find(s => s.code === a.competencyCode);
        return <div key={a.id} className="space-y-3 rounded-lg border p-3">
          <div><b>{a.competencyName}</b><p className="text-sm">Nhân viên tự chấm: {a.currentLevel}/5 · mục tiêu {a.targetLevel ?? 'chưa đặt'}</p><p className="mt-1 text-sm text-muted-foreground">Căn cứ: {a.selfNotes}</p>{a.evidenceUrl && <a className="text-sm text-primary underline" href={a.evidenceUrl} target="_blank" rel="noreferrer">Mở minh chứng nhân viên</a>}</div>
          {a.status === 'MANAGER_REVIEWED' ? <div className="rounded-lg bg-muted p-3 text-sm"><b>Quản lý đã thẩm định: {a.managerLevel}/5</b><p>{a.managerNotes}</p>{a.managerEvidenceUrl && <a className="text-primary underline" href={a.managerEvidenceUrl} target="_blank" rel="noreferrer">Mở minh chứng thẩm định</a>}</div> : <form className="space-y-3 border-t pt-3" onSubmit={e => { e.preventDefault(); review.mutate({ id: a.id, draft }); }}>
            <div><Label>Mức quản lý xác nhận (1–5)</Label><Select value={draft.managerLevel} onChange={e => setReviewDrafts({ ...reviewDrafts, [a.id]: { ...draft, managerLevel: e.target.value } })}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{levels[n]}</option>)}</Select></div>
            {standard && <div className="rounded-lg bg-muted p-3 text-sm"><b>Hành vi ở mức {draft.managerLevel}:</b><p>{standard.behavioralAnchors[Number(draft.managerLevel) - 1]}</p></div>}
            <div><Label>Căn cứ thẩm định (ít nhất 20 ký tự)</Label><Textarea required minLength={20} maxLength={2000} value={draft.managerNotes} onChange={e => setReviewDrafts({ ...reviewDrafts, [a.id]: { ...draft, managerNotes: e.target.value } })} placeholder="Nêu hành vi quan sát được, ví dụ và lý do mức điểm phù hợp"/></div>
            <div><Label>Liên kết minh chứng của quản lý (nếu có)</Label><Input type="url" value={draft.managerEvidenceUrl} onChange={e => setReviewDrafts({ ...reviewDrafts, [a.id]: { ...draft, managerEvidenceUrl: e.target.value } })}/></div>
            <Button disabled={review.isPending || cycles.data?.find(c => c.id === cycleId)?.status !== 'ACTIVE'}>Lưu thẩm định</Button>
          </form>}
        </div>;
      }) : <p className="text-sm text-muted-foreground">Nhân viên chưa gửi tự đánh giá trong kỳ này.</p>}
    </section>}

    <section className={card}>
      <h2 className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary"/>Minh chứng KPI</h2>
      {!cycleId ? <p className="text-sm text-muted-foreground">Chọn kỳ để xem các mục tiêu KPI.</p> : goals.data?.length ? goals.data.map(goal => <div key={goal.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{goal.kraTitle}</b><p className="text-xs text-muted-foreground">{goal.targetMetric}</p></div><Button size="sm" variant="outline" disabled={cycles.data?.find(c => c.id === cycleId)?.status !== 'ACTIVE'} onClick={() => { const description = prompt('Mô tả kết quả hoặc minh chứng'); if (!description) return; const metricValue = prompt('Giá trị đo được (nếu có)') || undefined; const evidenceUrl = prompt('Liên kết đến minh chứng (nếu có)') || undefined; addGoalEvidence.mutate({ id: goal.id, body: { description, metricValue, evidenceUrl } }); }}>Thêm minh chứng</Button></div>{goal.evidences?.map(e => <p className="mt-2 border-t pt-2 text-xs" key={e.id}>{new Date(e.createdAt).toLocaleDateString('vi-VN')} · {e.description}{e.metricValue ? ` · ${e.metricValue}` : ''}</p>)}</div>) : <p className="text-sm text-muted-foreground">Chưa có mục tiêu KPI trong kỳ này.</p>}
    </section>

    <section className={card}>
      <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary"/>Kế hoạch đang theo dõi</h2>
      {plans.data?.length ? plans.data.map(plan => <div key={plan.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><b>{plan.objective}</b><p className="text-xs text-muted-foreground">{plan.competencyCode} · hạn {new Date(`${plan.dueDate.slice(0,10)}T00:00:00`).toLocaleDateString('vi-VN')} · {plan.status}</p><p className="mt-1 text-sm">Tiêu chí: {plan.successCriteria}</p><p className="text-xs text-muted-foreground">Việc cần làm: {plan.actions.join(' · ')}</p></div><div className="flex gap-2">{plan.status === 'PROPOSED' && plan.userId === user?.id && <Button size="sm" variant="outline" onClick={() => updatePlan.mutate({ id: plan.id, body: { status: 'IN_PROGRESS' } })}>Bắt đầu</Button>}{['PROPOSED','IN_PROGRESS'].includes(plan.status) && <Button size="sm" variant="outline" onClick={() => { const evidenceUrl = prompt('Liên kết minh chứng (nếu chưa tải tệp lên)'); const evidenceNote = prompt('Mô tả minh chứng'); updatePlan.mutate({ id: plan.id, body: { ...(evidenceUrl ? { evidenceUrl } : {}), evidenceNote, ...(plan.status === 'PROPOSED' && plan.userId === user?.id ? { status: 'IN_PROGRESS' } : {}) } }); }}>Cập nhật tiến độ</Button>}{manager && plan.userId !== user?.id && plan.status === 'IN_PROGRESS' && <Button size="sm" onClick={() => { const resultLevel = Number(prompt('Mức năng lực sau cải thiện (1–5)')); if (resultLevel >= 1 && resultLevel <= 5) updatePlan.mutate({ id: plan.id, body: { status: 'COMPLETED', resultLevel, managerNotes: prompt('Nhận xét thẩm định kết quả') || '' } }); }}>Xác nhận kết quả</Button>}</div></div>{plan.evidence?.map((e,i) => <p className="mt-2 border-t pt-2 text-xs" key={`${plan.id}-${i}`}>{new Date(e.submittedAt).toLocaleDateString('vi-VN')} · {e.note || e.url} {e.url ? <a className="text-primary underline" href={e.url} target="_blank" rel="noreferrer">Mở</a> : null}</p>)}</div>) : <p className="text-sm text-muted-foreground">Chưa có kế hoạch phát triển cho nhân sự này.</p>}
    </section>
  </div>;
}
