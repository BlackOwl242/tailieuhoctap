import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { dateKey, DAY_MS, workDate } from '../hr-time';

/** Approved decisions are applied once, on their effective work date. */
@Injectable()
export class PersonnelEffectsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(PersonnelEffectsService.name);
  constructor(private readonly prisma: PrismaService) {}
  onModuleInit(): void {
    void this.applyDue().catch(error => this.logger.error(String(error)));
    this.timer = setInterval(() => void this.applyDue().catch(error => this.logger.error(String(error))), 60_000);
    this.timer.unref();
  }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }

  async applyDue(today: Date = workDate()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const due = await this.prisma.personnelAction.findMany({ where: { status: 'APPROVED', appliedAt: null, effectiveAt: { lte: today } }, orderBy: [{ effectiveAt: 'asc' }, { decidedAt: 'asc' }] });
      for (const candidate of due) { try { await this.prisma.$transaction(async tx => {
        const action = await tx.personnelAction.findUniqueOrThrow({ where: { id: candidate.id } });
        if (action.appliedAt || action.status !== 'APPROVED' || !action.effectiveAt || action.effectiveAt > today) return;
        const payload = action.payload as Record<string, unknown>;
        const user = await tx.user.findUniqueOrThrow({ where: { id: action.subjectId } });
        const actorId = action.decidedById ?? action.requestedById;
        if (action.type === 'RESIGNATION') {
          await tx.user.update({ where: { id: user.id }, data: { employmentStatus: 'RESIGNED', status: 'DISABLED' } });
          await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
          await tx.faceEmbedding.updateMany({ where: { userId: user.id, active: true }, data: { active: false } });
          await tx.contract.updateMany({ where: { userId: user.id, status: 'ACTIVE' }, data: { status: 'TERMINATED', endDate: action.effectiveAt } });
        }
        if (action.type === 'TRANSFER') {
          const orgUnitId = String(payload.newOrgUnitId);
          const unit = await tx.orgUnit.findUniqueOrThrow({ where: { id: orgUnitId } });
          const jobTitle = typeof payload.newJobTitle === 'string' && payload.newJobTitle.trim() ? payload.newJobTitle.trim() : user.jobTitle ?? 'Nhân viên';
          await tx.user.update({ where: { id: user.id }, data: { orgUnitId, jobTitle } });
          const profile = await tx.personnelComprehensiveProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, currentOrgDate: action.effectiveAt }, update: { currentOrgDate: action.effectiveAt } });
          await tx.personnelAppointment.updateMany({ where: { profileId: profile.id, isCurrent: true }, data: { isCurrent: false, expirationDate: new Date(action.effectiveAt.getTime() - DAY_MS) } });
          await tx.personnelAppointment.create({ data: { profileId: profile.id, orgUnitName: unit.name, positionTitle: jobTitle, effectiveDate: action.effectiveAt, isCurrent: true, decisionNo: String(payload.decisionNo ?? action.id), signer: actorId } });
        }
        if (action.type === 'SALARY_ADJUST') {
          const salary = Number(payload.newSalary);
          if (!Number.isFinite(salary) || salary < 0) throw new Error('Quyết định lương thiếu mức hợp lệ');
          const prior = await tx.contract.findFirst({ where: { userId: user.id, status: 'ACTIVE', startDate: { lte: action.effectiveAt } }, orderBy: { startDate: 'desc' } });
          await tx.user.update({ where: { id: user.id }, data: { baseSalary: salary, ...(typeof payload.salaryBandId === 'string' ? { salaryBandId: payload.salaryBandId } : {}) } });
          if (prior) {
            await tx.contract.update({ where: { id: prior.id }, data: { endDate: new Date(action.effectiveAt.getTime() - DAY_MS), status: 'EXPIRED' } });
            await tx.contract.create({ data: { userId: user.id, contractNo: `PL-${action.id}`, type: 'AMENDMENT', startDate: action.effectiveAt, baseSalary: salary, compensationBasis: prior.compensationBasis, insuranceSalary: Number(payload.insuranceSalary ?? prior.insuranceSalary ?? salary), createdById: actorId, note: `Phụ lục của ${prior.contractNo}` } });
          }
          const assignment = await tx.hrmsSalaryStructureAssignment.findFirst({ where: { userId: user.id, isActive: true }, orderBy: { fromDate: 'desc' } });
          if (assignment) {
            await tx.hrmsSalaryStructureAssignment.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } });
            await tx.hrmsSalaryStructureAssignment.create({ data: { userId: user.id, structureId: assignment.structureId, baseSalary: salary, fromDate: action.effectiveAt } });
          }
          const profile = await tx.personnelComprehensiveProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
          await tx.personnelSalaryHistory.updateMany({ where: { profileId: profile.id, toDate: null }, data: { toDate: new Date(action.effectiveAt.getTime() - DAY_MS) } });
          if (payload.rankProgression) await tx.personnelComprehensiveProfile.update({ where: { id: profile.id }, data: { salaryStep: Number(payload.nextStep), salaryCoefficient: Number(payload.nextCoefficient), salaryStepDate: action.effectiveAt, overGradePercent: Number(payload.overGradePercent ?? 0) } });
          await tx.personnelSalaryHistory.create({ data: { profileId: profile.id, rankCode: profile.rankCode, overGradeRate: Number(payload.overGradePercent ?? profile.overGradePercent ?? 0), step: Number(payload.nextStep ?? profile.salaryStep ?? 1), coefficient: Number(payload.nextCoefficient ?? profile.salaryCoefficient ?? 1), baseAmount: salary, fromDate: action.effectiveAt, decisionNo: action.id, signer: actorId } });
        }
        if (action.type === 'PROBATION_PASS') {
          const salary = Number(payload.newSalary);
          if (!Number.isFinite(salary) || salary <= 0) throw new Error('Thiếu mức lương chính thức');
          await tx.contract.updateMany({ where: { userId: user.id, type: 'PROBATION', status: 'ACTIVE' }, data: { status: 'EXPIRED', endDate: new Date(action.effectiveAt.getTime() - DAY_MS) } });
          await tx.contract.create({ data: { userId: user.id, contractNo: `CT-${action.id}`, type: payload.contractType === 'INDEFINITE' ? 'INDEFINITE' : 'FIXED_TERM', startDate: action.effectiveAt, endDate: payload.contractEndDate ? dateKey(String(payload.contractEndDate)) : null, baseSalary: salary, insuranceSalary: salary, createdById: actorId } });
          await tx.user.update({ where: { id: user.id }, data: { employmentStatus: 'ACTIVE', baseSalary: salary } });
          await tx.personnelComprehensiveProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, officialDate: action.effectiveAt }, update: { officialDate: action.effectiveAt } });
        }
        await tx.hrmsLifecycleEvent.updateMany({ where: { personnelActionId: action.id }, data: { status: 'COMPLETED' } });
        const changed = await tx.personnelAction.updateMany({ where: { id: action.id, appliedAt: null, status: 'APPROVED' }, data: { appliedAt: new Date() } });
        if (changed.count !== 1) throw new Error('Quyết định vừa được áp dụng bởi tiến trình khác');
        await tx.auditLog.create({ data: { actorId, action: 'PERSONNEL_ACTION_APPLIED', entityType: 'PersonnelAction', entityId: action.id, afterData: { effectiveAt: action.effectiveAt.toISOString(), type: action.type } } });
      }, { isolationLevel: 'Serializable' }); } catch (error) { this.logger.error(`Không thể áp dụng quyết định ${candidate.id}: ${String(error)}`); } }
    } finally { this.running = false; }
  }
}
