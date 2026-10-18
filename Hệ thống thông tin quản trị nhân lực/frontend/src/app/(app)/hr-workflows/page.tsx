'use client';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Input, Label, Select, Textarea } from '@/components/ui/primitives';
import { Modal, ModalFooterActions } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toaster';

type Row = Record<string, any>;
const names: Record<string, string> = {
  REQUESTED: 'Đề nghị mượn',
  APPROVED: 'Đã duyệt',
  BORROWED: 'Đang mượn',
  RETURN_REQUESTED: 'Đề nghị trả',
  RETURNED: 'Đã trả',
  REJECTED: 'Từ chối',
  SUBMITTED: 'Quản lý đã đánh giá',
  HR_VERIFIED: 'HR đã thẩm định',
  PENDING_REVIEW: 'Chờ thẩm định',
  REVIEWED: 'Đã thẩm định',
  CLOSED: 'Đã đóng',
  FINALIZED: 'Đã chốt',
  OPEN: 'Đang mở',
  PENDING: 'Chờ duyệt',
};

function toList(data: unknown): Row[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { items?: Row[] }).items)) {
    return (data as { items: Row[] }).items;
  }
  return [];
}

export default function HrWorkflowsPage() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const hr = roles.some((r) => ['ADMIN', 'KM_MANAGER', 'HR_CB'].includes(r));
  const bod = roles.some((r) => ['ADMIN', 'BOD'].includes(r));
  const finance = roles.some((r) => ['ADMIN', 'ACCOUNTANT'].includes(r));
  const recruiter = roles.some((r) => ['ADMIN', 'KM_MANAGER', 'HR_RECRUITER'].includes(r));
  const manager = roles.includes('LINE_MANAGER');
  const canReviewWorkflow = roles.some((r) => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD'].includes(r));

  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('loans');
  const [noteModal, setNoteModal] = useState<{
    title: string;
    label: string;
    url: string;
    method: string;
    payloadBuilder: (val: string) => Row;
  } | null>(null);
  const [noteValue, setNoteValue] = useState('');

  const useRows = (key: string, url: string, enabled = true) =>
    useQuery<Row[]>({
      queryKey: [key, url],
      queryFn: async () => toList((await api.get(url)).data),
      enabled,
    });

  const me = useQuery<Row>({
    queryKey: ['workflow-me'],
    queryFn: async () => (await api.get('/auth/me')).data,
  });
  const corrections = useRows(
    'workflow-corrections',
    canReviewWorkflow ? '/hrms/attendance-regularizations' : '/hrms/attendance-regularizations/my'
  );
  const loans = useRows('physical-loans', '/hr-workflows/record-loans');
  const probation = useRows('probation-reviews', '/hr-workflows/probation');
  const req = useRows('requisitions', '/recruitment/requisitions', recruiter || finance || bod || manager);
  const periods = useRows('attendance-periods', '/attendance-periods', hr || finance || bod);
  const tasks = useRows('onboarding-tasks', '/hrms/lifecycle/onboarding-tasks');
  const employees = useQuery<Row[]>({
    queryKey: ['workflow-employees'],
    queryFn: async () => toList((await api.get('/employees')).data),
    enabled: canReviewWorkflow,
    retry: false,
  });
  const orgs = useRows('workflow-orgs', '/org-units', recruiter || canReviewWorkflow);

  const employeeList = toList(employees.data);
  const correctionList = toList(corrections.data);
  const loanList = toList(loans.data);
  const probationList = toList(probation.data);
  const reqList = toList(req.data);
  const periodList = toList(periods.data);
  const taskList = toList(tasks.data);
  const orgList = toList(orgs.data);

  async function act(url: string, body: Row = {}, method = 'post') {
    setBusy(true);
    try {
      await api.request({ url, method, data: body, timeout: 180000 });
      await qc.invalidateQueries();
      toast('Đã cập nhật quy trình thành công', 'success');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  function openNotePrompt(title: string, label: string, url: string, method: string, payloadBuilder: (val: string) => Row) {
    setNoteValue('');
    setNoteModal({ title, label, url, method, payloadBuilder });
  }

  function values(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
  }

  const cls = 'rounded-lg border p-4 space-y-3';
  const field = 'space-y-1';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Quy trình & xác nhận</h1>
      <p className="text-sm text-muted-foreground">
        Mỗi bước ghi nhận người thực hiện. Phê duyệt phải độc lập với người đề xuất; quyết định nhân sự áp dụng theo ngày hiệu lực.
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          ['correction', 'Giải trình công'],
          ['bank', 'Ngân hàng & thuế'],
          ['loans', 'Mượn hồ sơ gốc'],
          ['probation', 'Thử việc'],
          ['onboarding', 'Hội nhập'],
          ...(recruiter || finance || bod || manager ? [['requisition', 'Chỉ tiêu tuyển dụng']] : []),
          ...(hr || finance || bod ? [['attendance', 'Chốt công']] : []),
        ].map(([id, name]) => (
          <Button key={id} variant={tab === id ? 'default' : 'outline'} onClick={() => setTab(id)}>
            {name}
          </Button>
        ))}
      </div>

      {tab === 'bank' && (
        <form
          className={cls}
          onSubmit={(e) => {
            const v = values(e);
            const changes: Row = {};
            for (const [k, label] of [
              ['bankAccount', 'Số tài khoản'],
              ['bankName', 'Ngân hàng'],
              ['taxDependentCount', 'Người phụ thuộc'],
            ]) {
              const newValue = k === 'taxDependentCount' ? Number(v[k]) : v[k];
              if (String(newValue) !== String(me.data?.[k] ?? ''))
                changes[k] = { label, oldValue: me.data?.[k] ?? null, newValue, tier: 2 };
            }
            void act('/profile-change-requests', { changes, reason: v.reason, attachmentUrls: [v.proof] });
          }}
        >
          <h2 className="font-medium">Đề nghị xác minh ngân hàng và người phụ thuộc</h2>
          <p className="text-sm">HR xét duyệt tại trang Đề xuất hồ sơ. Bảng lương chụp thông tin đã được xác minh tại thời điểm tính.</p>
          <label className="block space-y-1">
            <span>Số tài khoản</span>
            <Input name="bankAccount" defaultValue={me.data?.bankAccount ?? ''} required />
          </label>
          <label className="block space-y-1">
            <span>Ngân hàng</span>
            <Input name="bankName" defaultValue={me.data?.bankName ?? ''} required />
          </label>
          <label className="block space-y-1">
            <span>Số người phụ thuộc</span>
            <Input name="taxDependentCount" type="number" min={0} max={30} defaultValue={me.data?.taxDependentCount ?? 0} required />
          </label>
          <label className="block space-y-1">
            <span>Lý do</span>
            <Input name="reason" minLength={5} required />
          </label>
          <label className="block space-y-1">
            <span>Đường dẫn minh chứng</span>
            <Input name="proof" required />
          </label>
          <Button disabled={busy}>Gửi HR xác minh</Button>
        </form>
      )}

      {tab === 'correction' && (
        <>
          <form
            className={cls}
            onSubmit={(e) => {
              const v = values(e);
              void act('/hrms/attendance-regularizations', {
                ...v,
                userId: user?.id,
                employeeName: user?.fullName ?? '',
                requestedCheckIn: v.requestedCheckIn || undefined,
                requestedCheckOut: v.requestedCheckOut || undefined,
              });
            }}
          >
            <h2 className="font-medium">Đề nghị bổ sung công của mình</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span>Ngày làm việc</span>
                <Input name="workDate" type="date" required />
              </label>
              <label className="block space-y-1">
                <span>Giờ vào</span>
                <Input name="requestedCheckIn" type="time" />
              </label>
              <label className="block space-y-1">
                <span>Giờ ra</span>
                <Input name="requestedCheckOut" type="time" />
              </label>
              <label className="block space-y-1">
                <span>Lý do và minh chứng</span>
                <Textarea name="reason" minLength={5} required />
              </label>
            </div>
            <Button disabled={busy}>Gửi giải trình</Button>
          </form>
          {correctionList.map((c) => (
            <div className={cls} key={c.id}>
              <p className="font-medium">
                {c.employeeName} · {c.workDate?.slice(0, 10)} · {names[c.status] ?? c.status}
              </p>
              <p className="text-sm text-muted-foreground">
                {c.requestedCheckIn ?? 'Chưa cập nhật'} → {c.requestedCheckOut ?? 'Chưa cập nhật'} · {c.reason}
              </p>
              {canReviewWorkflow && c.status === 'PENDING' && c.userId !== user?.id && (
                <div className="flex gap-2">
                  {(['APPROVED', 'REJECTED'] as const).map((status) => (
                    <Button
                      key={status}
                      disabled={busy}
                      variant={status === 'APPROVED' ? 'default' : 'outline'}
                      onClick={() =>
                        openNotePrompt(
                          status === 'APPROVED' ? 'Duyệt giải trình công' : 'Từ chối giải trình công',
                          'Kết quả xác minh / ghi chú quyết định',
                          `/hrms/attendance-regularizations/${c.id}/decide`,
                          'patch',
                          (decisionNote) => ({ status, decisionNote })
                        )
                      }
                    >
                      {status === 'APPROVED' ? 'Duyệt công' : 'Từ chối'}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {tab === 'loans' && (
        <>
          <form
            className={cls}
            onSubmit={(e) => {
              const v = values(e);
              void act('/hr-workflows/record-loans', v);
            }}
          >
            <h2 className="font-medium">Đề nghị mượn bản gốc của mình</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className={field}>
                Mã hồ sơ
                <Input name="itemKey" required />
              </label>
              <label className={field}>
                Tên bản gốc
                <Input name="itemDescription" minLength={5} required />
              </label>
              <label className={field}>
                Hạn trả
                <Input name="dueDate" type="date" required />
              </label>
              <label className={field}>
                Lý do
                <Input name="reason" minLength={5} required />
              </label>
            </div>
            <Button disabled={busy}>Gửi đề nghị</Button>
          </form>
          {loans.isError && <p className="text-sm text-destructive">Không tải được hồ sơ: {errorMessage(loans.error)}</p>}
          {loanList.map((l) => (
            <div className={cls} key={l.id}>
              <p className="font-medium">
                {l.itemDescription} — {names[l.status] ?? l.status}
              </p>
              <p className="text-sm">
                {l.reason} · Hạn trả {l.dueDate?.slice(0, 10)}
              </p>
              <div className="flex gap-2">
                {canReviewWorkflow && l.userId !== user?.id && l.status === 'REQUESTED' && (
                  <>
                    <Button disabled={busy} onClick={() => act(`/hr-workflows/record-loans/${l.id}`, { status: 'APPROVED' }, 'patch')}>
                      Duyệt
                    </Button>
                    <Button variant="outline" disabled={busy} onClick={() => act(`/hr-workflows/record-loans/${l.id}`, { status: 'REJECTED' }, 'patch')}>
                      Từ chối
                    </Button>
                  </>
                )}
                {canReviewWorkflow && l.userId !== user?.id && ['APPROVED', 'RETURN_REQUESTED'].includes(l.status) && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      openNotePrompt(
                        l.status === 'APPROVED' ? 'Xác nhận giao bản gốc' : 'Xác nhận đã nhận lại bản gốc',
                        'Đường dẫn biên bản giao nhận',
                        `/hr-workflows/record-loans/${l.id}`,
                        'patch',
                        (evidenceUrl) => ({
                          status: l.status === 'APPROVED' ? 'BORROWED' : 'RETURNED',
                          evidenceUrl,
                        })
                      )
                    }
                  >
                    Xác nhận {l.status === 'APPROVED' ? 'giao bản gốc' : 'đã nhận lại'}
                  </Button>
                )}
                {l.userId === user?.id && l.status === 'BORROWED' && (
                  <Button disabled={busy} onClick={() => act(`/hr-workflows/record-loans/${l.id}`, { status: 'RETURN_REQUESTED' }, 'patch')}>
                    Đề nghị trả
                  </Button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'probation' && (
        <>
          {canReviewWorkflow && (
            <form
              className={cls}
              onSubmit={(e) => {
                const v = values(e);
                void act('/hr-workflows/probation', {
                  ...v,
                  score: Number(v.score),
                  contractSalary: Number(v.contractSalary),
                  contractEndDate: v.contractEndDate || undefined,
                });
              }}
            >
              <h2 className="font-medium">Quản lý đánh giá kết quả thử việc</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span>Nhân viên</span>
                  <Select name="userId" required>
                    <option value="">Chọn nhân viên</option>
                    {employeeList
                      .filter((u) => (!u.employmentStatus || u.employmentStatus === 'PROBATION') && u.id !== user?.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                  </Select>
                </label>
                <label className="block space-y-1">
                  <span>Điểm</span>
                  <Input name="score" type="number" min={0} max={100} required />
                </label>
                <label className="block space-y-1">
                  <span>Kết luận</span>
                  <Select name="recommendation">
                    <option value="PASS">Đạt</option>
                    <option value="FAIL">Không đạt</option>
                  </Select>
                </label>
                <label className="block space-y-1">
                  <span>Lương chính thức</span>
                  <Input name="contractSalary" type="number" min={1} required />
                </label>
                <label className="block space-y-1">
                  <span>Hợp đồng</span>
                  <Select name="contractType">
                    <option value="FIXED_TERM">Có thời hạn</option>
                    <option value="INDEFINITE">Không thời hạn</option>
                  </Select>
                </label>
                <label className="block space-y-1">
                  <span>Ngày hiệu lực</span>
                  <Input name="effectiveDate" type="date" required />
                </label>
                <label className="block space-y-1">
                  <span>Ngày kết thúc (nếu có thời hạn)</span>
                  <Input name="contractEndDate" type="date" />
                </label>
                <label className="block space-y-1">
                  <span>Minh chứng</span>
                  <Input name="evidenceUrl" required />
                </label>
              </div>
              <label className="block space-y-1">
                <span>Nhận xét</span>
                <Textarea name="assessment" minLength={10} required />
              </label>
              <Button disabled={busy}>Gửi HR thẩm định</Button>
            </form>
          )}
          {probationList.map((p) => {
            const isOwnProbation = Boolean(user?.id && (p.userId === user.id || p.reviewerId === user.id));
            return (
              <div className={cls} key={p.id}>
                <p className="font-medium">
                  {employeeList.find((u) => u.id === p.userId)?.fullName ?? p.employeeName ?? 'Đánh giá thử việc'} — {names[p.status] ?? p.status}
                </p>
                <p>
                  {p.score}/100 · {p.assessment}
                </p>
                <p className="text-sm">Hiệu lực: {p.effectiveDate?.slice(0, 10)}</p>
                {canReviewWorkflow && !isOwnProbation && (p.status === 'SUBMITTED' || p.status === 'HR_VERIFIED') && (
                  <div className="flex gap-2">
                    {(p.status === 'SUBMITTED' || p.recommendation === 'PASS') && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          openNotePrompt(
                            p.status === 'SUBMITTED' ? 'HR xác minh kết quả thử việc' : 'Phê duyệt ký hợp đồng chính thức',
                            'Ghi chú thẩm định / phê duyệt',
                            `/hr-workflows/probation/${p.id}`,
                            'patch',
                            (note) => ({ status: p.status === 'SUBMITTED' ? 'HR_VERIFIED' : 'APPROVED', note })
                          )
                        }
                      >
                        {p.status === 'SUBMITTED' ? 'HR xác minh' : 'Duyệt ký chính thức'}
                      </Button>
                    )}
                    {p.status === 'HR_VERIFIED' && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          openNotePrompt(
                            'Từ chối ký hợp đồng chính thức',
                            'Lý do không ký chính thức',
                            `/hr-workflows/probation/${p.id}`,
                            'patch',
                            (note) => ({ status: 'REJECTED', note })
                          )
                        }
                      >
                        Không ký chính thức
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === 'onboarding' && (
        <>
          <p className="text-sm">
            IT đặt mật khẩu và kích hoạt tài khoản tại trang Quản trị người dùng trước khi xác nhận. HR, hành chính và quản lý xác nhận phần việc của mình.
          </p>
          {taskList.map((t) => (
            <div key={t.id} className={cls}>
              <p>
                {t.employeeName} · {t.category}
              </p>
              <p className="font-medium">{t.title}</p>
              <p>{t.isCompleted ? 'Đã xác nhận' : 'Chờ xác nhận'}</p>
              {!t.isCompleted && t.userId !== user?.id && (
                <Button disabled={busy} onClick={() => act(`/hrms/lifecycle/onboarding-tasks/${t.id}/toggle`, {}, 'patch')}>
                  Xác nhận hoàn thành
                </Button>
              )}
            </div>
          ))}
        </>
      )}

      {tab === 'requisition' && (
        <>
          <form
            className={cls}
            onSubmit={(e) => {
              const v = values(e);
              void act('/recruitment/requisitions', {
                ...v,
                headcount: Number(v.headcount),
                budgetMonthly: Number(v.budgetMonthly),
                orgUnitId: v.orgUnitId || undefined,
              });
            }}
          >
            <h2 className="font-medium">Đề nghị chỉ tiêu và ngân sách</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span>Tên đề nghị</span>
                <Input name="title" required />
              </label>
              <label className="block space-y-1">
                <span>Vị trí</span>
                <Input name="position" required />
              </label>
              <label className="block space-y-1">
                <span>Số lượng</span>
                <Input name="headcount" type="number" min={1} required />
              </label>
              <label className="block space-y-1">
                <span>Tổng ngân sách lương / tháng</span>
                <Input name="budgetMonthly" type="number" min={1} required />
              </label>
              <label className="block space-y-1">
                <span>Đơn vị</span>
                <Select name="orgUnitId" required>
                  <option value="">Chọn đơn vị</option>
                  {orgList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block space-y-1">
                <span>Lý do</span>
                <Input name="reason" required />
              </label>
            </div>
            <Button disabled={busy}>Gửi thẩm định</Button>
          </form>
          {reqList.map((q) => (
            <div key={q.id} className={cls}>
              <p className="font-medium">
                {q.title} — {names[q.status] ?? q.status}
              </p>
              <p>
                {q.position} · {q.headcount} người · {q.budgetMonthly?.toLocaleString('vi-VN')} đ/tháng
              </p>
              <div className="flex gap-2">
                {q.status === 'PENDING_REVIEW' && q.requestedById !== user?.id && (
                  <>
                    {recruiter && !q.hrAssessedBy && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          openNotePrompt(
                            'HR thẩm định nhu cầu tuyển dụng',
                            'Kết quả thẩm định nhu cầu',
                            `/recruitment/requisitions/${q.id}/assess`,
                            'post',
                            (note) => ({ kind: 'HR', note })
                          )
                        }
                      >
                        HR thẩm định
                      </Button>
                    )}
                    {finance && !q.financeAssessedBy && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          openNotePrompt(
                            'Tài chính thẩm định ngân sách',
                            'Kết quả thẩm định ngân sách',
                            `/recruitment/requisitions/${q.id}/assess`,
                            'post',
                            (note) => ({ kind: 'FINANCE', note })
                          )
                        }
                      >
                        Tài chính thẩm định
                      </Button>
                    )}
                  </>
                )}
                {q.status === 'REVIEWED' && bod && q.requestedById !== user?.id && (
                  <Button disabled={busy} onClick={() => act(`/recruitment/requisitions/${q.id}/approve`)}>
                    Giám đốc phê duyệt
                  </Button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'attendance' && (
        <>
          <form
            className={cls}
            onSubmit={(e) => {
              const v = values(e);
              void act('/attendance-periods/finalize', { month: Number(v.month), year: Number(v.year) });
            }}
          >
            <h2 className="font-medium">Chốt công tháng đã kết thúc</h2>
            <p className="text-sm">Xử lý đơn giải trình và ngày thiếu cặp vào–ra trước khi chốt. Bảng lương lấy bản công đã chốt.</p>
            <div className="flex gap-3">
              <label className="block space-y-1">
                <span>Tháng</span>
                <Input name="month" type="number" min={1} max={12} required />
              </label>
              <label className="block space-y-1">
                <span>Năm</span>
                <Input name="year" type="number" min={2000} max={2100} defaultValue={new Date().getFullYear()} required />
              </label>
            </div>
            <Button disabled={busy}>Kiểm tra & chốt công</Button>
          </form>
          {periodList.map((p) => (
            <div className={cls} key={p.id}>
              <p>
                Tháng {p.month}/{p.year} — {names[p.status] ?? p.status} · phiên bản {p.version}
              </p>
              {(hr || bod) && p.status === 'FINALIZED' && (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    openNotePrompt(
                      'Mở lại kỳ công đã chốt',
                      'Lý do mở lại công (ít nhất 5 ký tự)',
                      `/attendance-periods/${p.id}/reopen`,
                      'post',
                      (reason) => ({ reason })
                    )
                  }
                >
                  Mở lại để điều chỉnh
                </Button>
              )}
            </div>
          ))}
        </>
      )}

      <Modal
        open={Boolean(noteModal)}
        onOpenChange={(open) => {
          if (!open) setNoteModal(null);
        }}
        title={noteModal?.title || 'Xác nhận thao tác'}
        size="md"
      >
        <div className="space-y-3 py-1">
          <Label>{noteModal?.label || 'Ghi chú xác nhận'} *</Label>
          <Textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Nhập nội dung xác minh / ghi chú quyết định..."
            rows={3}
          />
        </div>
        <ModalFooterActions
          onCancel={() => setNoteModal(null)}
          confirmLabel="Xác nhận"
          pending={busy}
          disabled={!noteValue.trim() || busy}
          onConfirm={() => {
            if (!noteModal || !noteValue.trim()) return;
            const { url, method, payloadBuilder } = noteModal;
            setNoteModal(null);
            void act(url, payloadBuilder(noteValue.trim()), method);
          }}
        />
      </Modal>
    </div>
  );
}

