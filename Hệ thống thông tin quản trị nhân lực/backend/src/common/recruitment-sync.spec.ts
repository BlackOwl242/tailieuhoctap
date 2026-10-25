import { assertApplicantTransition, LEGACY_CANDIDATE_STAGE, syncLegacyCandidate } from './recruitment-sync';

describe('Canonical ATS and legacy candidate mirror', () => {
  it.each(['APPLIED', 'SCREENING', 'INTERVIEW_ROUND_1', 'INTERVIEW_ROUND_2', 'OFFER_SENT', 'HIRED', 'REJECTED'] as const)('mirrors %s to the legacy pipeline', async stage => {
    const db: any = { hrmsJobApplicant: { findUniqueOrThrow: jest.fn().mockResolvedValue({ stage, email: 'candidate@test', candidateName: 'Ứng viên', jobOpening: { requisitionId: 'req' } }) }, candidate: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    await syncLegacyCandidate(db, 'applicant'); expect(db.candidate.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { stage: LEGACY_CANDIDATE_STAGE[stage] } }));
  });
  it('creates a mirror when an applicant is entered directly in ATS', async () => {
    const db: any = { hrmsJobApplicant: { findUniqueOrThrow: jest.fn().mockResolvedValue({ stage: 'APPLIED', email: 'candidate@test', candidateName: 'Ứng viên', jobOpening: { requisitionId: 'req' } }) }, candidate: { updateMany: jest.fn().mockResolvedValue({ count: 0 }), create: jest.fn() } };
    await syncLegacyCandidate(db, 'applicant'); expect(db.candidate.create.mock.calls[0][0].data).toMatchObject({ email: 'candidate@test', fullName: 'Ứng viên', stage: 'NEW' });
  });
  it('rejects rewinding a hired/rejected applicant or skipping screening from the legacy API', () => {
    expect(() => assertApplicantTransition('HIRED', 'SCREENING')).toThrow(); expect(() => assertApplicantTransition('REJECTED', 'APPLIED')).toThrow(); expect(() => assertApplicantTransition('APPLIED', 'INTERVIEW_ROUND_1')).toThrow();
  });
});
