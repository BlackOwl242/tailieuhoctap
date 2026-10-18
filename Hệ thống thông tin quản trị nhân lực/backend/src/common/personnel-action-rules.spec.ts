import { endsEmployment, validatePersonnelPayload } from './personnel-action-rules';
describe('Vietnam enterprise personnel decisions', () => {
  const reason = 'Căn cứ hồ sơ và nội quy lao động';
  it('keeps removal from office separate from termination', () => {
    expect(() => validatePersonnelPayload('TRANSFER', { reason, subType: 'RELIEVAL', newJobTitle: 'Chuyên viên' }, true)).not.toThrow();
    expect(endsEmployment('TRANSFER', { subType: 'REMOVAL' })).toBe(false);
    expect(endsEmployment('DISCIPLINE', { subType: 'DISMISSAL' })).toBe(true);
    expect(() => validatePersonnelPayload('RESIGNATION', { reason, subType: 'RELIEVAL' })).toThrow();
  });
  it('rejects financial discipline and unsupported sanctions', () => {
    expect(() => validatePersonnelPayload('DISCIPLINE', { reason, subType: 'REPRIMAND', amount: 1 })).toThrow('Điều 127');
    expect(() => validatePersonnelPayload('DISCIPLINE', { reason, subType: 'CẢNH CÁO' })).toThrow('Điều 124');
    expect(() => validatePersonnelPayload('DISCIPLINE', { reason, subType: 'DEFER_RAISE', deferMonths: 7 })).toThrow();
  });
  it('requires a documented procedure before approving discipline', () => {
    expect(() => validatePersonnelPayload('DISCIPLINE', { reason, subType: 'REPRIMAND' }, true)).toThrow();
    expect(() => validatePersonnelPayload('DISCIPLINE', { reason, subType: 'REPRIMAND', decisionNo: '01/QD', legalBasis: reason, evidenceUrl: '/uploads/hearing.pdf', disciplinaryProcedureConfirmed: true }, true)).not.toThrow();
  });
});
