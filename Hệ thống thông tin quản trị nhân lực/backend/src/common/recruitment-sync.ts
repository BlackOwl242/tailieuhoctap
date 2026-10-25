import { ConflictException } from '@nestjs/common';
import { ApplicantStage, CandidateStage, Prisma } from '@prisma/client';

export const APPLICANT_TRANSITIONS: Record<ApplicantStage, ApplicantStage[]> = {
  APPLIED: ['SCREENING', 'REJECTED'], SCREENING: ['INTERVIEW_ROUND_1', 'REJECTED'],
  INTERVIEW_ROUND_1: ['INTERVIEW_ROUND_2', 'REJECTED'], INTERVIEW_ROUND_2: ['REJECTED'],
  OFFER_SENT: ['REJECTED'], HIRED: [], REJECTED: [],
};
export const LEGACY_CANDIDATE_STAGE: Record<ApplicantStage, CandidateStage> = {
  APPLIED: 'NEW', SCREENING: 'SCREENING', INTERVIEW_ROUND_1: 'INTERVIEW', INTERVIEW_ROUND_2: 'INTERVIEW',
  OFFER_SENT: 'OFFER', HIRED: 'HIRED', REJECTED: 'REJECTED',
};

/** ATS owns the pipeline; the legacy table remains a transactional mirror. */
export async function syncLegacyCandidate(db: Prisma.TransactionClient, applicantId: string) {
  const app = await db.hrmsJobApplicant.findUniqueOrThrow({ where: { id: applicantId }, include: { jobOpening: true } });
  if (app.jobOpening.requisitionId) {
    const mirrored = await db.candidate.updateMany({
      where: { requisitionId: app.jobOpening.requisitionId, email: { equals: app.email, mode: 'insensitive' } },
      data: { stage: LEGACY_CANDIDATE_STAGE[app.stage] },
    });
    if (!mirrored.count) await db.candidate.create({ data: {
      requisitionId: app.jobOpening.requisitionId, email: app.email, fullName: app.candidateName,
      phone: app.phone, stage: LEGACY_CANDIDATE_STAGE[app.stage],
    } });
  }
}

export function assertApplicantTransition(current: ApplicantStage, next: ApplicantStage) {
  if (current !== next && !APPLICANT_TRANSITIONS[current]?.includes(next)) throw new ConflictException('Chuyển giai đoạn tại Tuyển dụng ATS theo đúng quy trình; không được quay lại hoặc bỏ bước');
}
