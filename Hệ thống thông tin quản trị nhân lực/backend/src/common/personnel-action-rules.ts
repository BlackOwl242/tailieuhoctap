import { ConflictException } from '@nestjs/common';

export const DISCIPLINE_FORMS = ['REPRIMAND', 'DEFER_RAISE', 'DEMOTION', 'DISMISSAL'] as const;
export const POSITION_ACTIONS = ['TRANSFER', 'APPOINTMENT', 'RELIEVAL', 'REMOVAL'] as const;
export const DISCIPLINE_LABELS: Record<string, string> = {
  REPRIMAND: 'Khiển trách', DEFER_RAISE: 'Kéo dài thời hạn nâng lương', DEMOTION: 'Cách chức', DISMISSAL: 'Sa thải',
};

/** Labour discipline and corporate removal from office have different effects. */
export function validatePersonnelPayload(type: string, payload: Record<string, unknown>, approving = false): void {
  const reason = String(payload.reason ?? '').trim();
  if (reason.length < 10) throw new ConflictException('Cần lý do/căn cứ cụ thể, ít nhất 10 ký tự');
  if (type === 'AWARD' && (payload.amount !== undefined && (typeof payload.amount !== 'number' || !Number.isFinite(payload.amount) || payload.amount < 0))) {
    throw new ConflictException('Mức thưởng phải là số không âm');
  }
  if (type === 'RESIGNATION' && ['MIỄN NHIỆM', 'BÃI NHIỆM', 'RELIEVAL', 'REMOVAL'].includes(String(payload.subType))) {
    throw new ConflictException('Miễn nhiệm/bãi nhiệm chức vụ thuộc thay đổi chức vụ, không phải chấm dứt hợp đồng lao động');
  }
  if (type === 'TRANSFER') {
    const subType = String(payload.subType || 'TRANSFER');
    if (!(POSITION_ACTIONS as readonly string[]).includes(subType)) throw new ConflictException('Loại điều động/thay đổi chức vụ không hợp lệ');
    if (subType !== 'TRANSFER' && !String(payload.newJobTitle || '').trim()) throw new ConflictException('Cần ghi chức danh đảm nhiệm sau quyết định');
  }
  if (type !== 'DISCIPLINE') return;
  if (payload.amount !== undefined && payload.amount !== 0) throw new ConflictException('Không được phạt tiền/cắt lương thay xử lý kỷ luật lao động (Điều 127 Bộ luật Lao động)');
  const form = String(payload.subType);
  if (!(DISCIPLINE_FORMS as readonly string[]).includes(form)) throw new ConflictException('Kỷ luật lao động doanh nghiệp chỉ gồm khiển trách, kéo dài nâng lương, cách chức hoặc sa thải (Điều 124)');
  if (form === 'DEFER_RAISE' && (!Number.isInteger(payload.deferMonths) || Number(payload.deferMonths) < 1 || Number(payload.deferMonths) > 6)) {
    throw new ConflictException('Thời gian kéo dài nâng lương phải từ 1 đến 6 tháng');
  }
  if (form === 'DEMOTION' && !String(payload.newJobTitle || '').trim()) throw new ConflictException('Cần chức danh công việc sau cách chức');
  if (approving && (!String(payload.decisionNo || '').trim() || String(payload.legalBasis || '').trim().length < 10
    || !String(payload.evidenceUrl || '').trim() || payload.disciplinaryProcedureConfirmed !== true)) {
    throw new ConflictException('Cần số quyết định, căn cứ nội quy/pháp luật, hồ sơ minh chứng và xác nhận thủ tục Điều 122–125, Điều 70 Nghị định 145/2020 trước khi duyệt kỷ luật');
  }
}

export function endsEmployment(type: string, payload: Record<string, unknown>): boolean {
  return type === 'RESIGNATION' || (type === 'DISCIPLINE' && payload.subType === 'DISMISSAL');
}
