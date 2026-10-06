import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Injectable, Module, Param, Patch, Post } from '@nestjs/common';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { CurrentUser, Roles } from '../../common/decorators';
import { PrismaService } from '../../common/prisma.service';
import { HrAccessService, isHr } from '../../common/services/hr-access.service';
import { PersonnelEffectsService } from '../../common/services/personnel-effects.service';
import type { AuthUser } from '../../common/types/auth-user';
import { dateKey, workDate } from '../../common/hr-time';
import { Prisma } from '@prisma/client';

class BorrowDto {
  @IsString() itemKey!: string;
  @IsString() @MinLength(5) itemDescription!: string;
  @IsString() @MinLength(5) reason!: string;
  @IsDateString() dueDate!: string;
}
class BorrowTransitionDto {
  @IsIn(['APPROVED', 'REJECTED', 'BORROWED', 'RETURN_REQUESTED', 'RETURNED']) status!: string;
  @IsOptional() @IsString() evidenceUrl?: string;
}
class ProbationDto {
  @IsString() userId!: string;
  @IsNumber() @Min(0) @Max(100) score!: number;
  @IsString() @MinLength(10) assessment!: string;
  @IsString() @MinLength(1) evidenceUrl!: string;
  @IsIn(['PASS', 'FAIL']) recommendation!: string;
  @IsNumber() @Min(1) contractSalary!: number;
  @IsIn(['FIXED_TERM', 'INDEFINITE']) contractType!: 'FIXED_TERM' | 'INDEFINITE';
  @IsDateString() effectiveDate!: string;
  @IsOptional() @IsDateString() contractEndDate?: string;
}
class ProbationTransitionDto {
  @IsIn(['HR_VERIFIED', 'APPROVED', 'REJECTED']) status!: string;
  @IsString() @MinLength(3) note!: string;
}

@Injectable()
export class HrWorkflowsService {
  constructor(private readonly prisma: PrismaService, private readonly access: HrAccessService, private readonly effects: PersonnelEffectsService) {}
  private async assertProbationSalaryBand(db: PrismaService | Prisma.TransactionClient, userId: string, salary: number, effectiveDate: Date) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { salaryBandId: true, jobTitle: true } });
    const band = user?.salaryBandId ? await db.hrmsSalaryBand.findUnique({ where: { id: user.salaryBandId } }) : null;
    const date = dateKey(effectiveDate);
    const titleMatches = !band?.jobTitles.length || band.jobTitles.some(title => title.trim().toLocaleLowerCase('vi') === (user?.jobTitle ?? '').trim().toLocaleLowerCase('vi'));
    if (!band || band.status !== 'ACTIVE' || band.compensationBasis !== 'MONTHLY' || band.effectiveFrom > date || (band.effectiveTo && band.effectiveTo < date) || !titleMatches || salary < band.minSalary || salary > band.maxSalary) {
      throw new ConflictException('Mức lương chính thức phải nằm trong khung lương tháng đã duyệt, đúng chức danh và còn hiệu lực vào ngày nhận chính thức.');
    }
  }
  listLoans(actor: AuthUser) { return this.prisma.physicalRecordLoan.findMany({ where: isHr(actor) ? {} : { userId: actor.id }, orderBy: { createdAt: 'desc' } }); }
  async borrow(actor: AuthUser, dto: BorrowDto) {
    if (dateKey(dto.dueDate) < workDate()) throw new BadRequestException('Hạn trả không được trong quá khứ');
    return this.prisma.physicalRecordLoan.create({ data: { ...dto, userId: actor.id, itemKey: `${actor.id}:${dto.itemKey.trim()}`, dueDate: dateKey(dto.dueDate) } });
  }
  async borrowTransition(actor: AuthUser, id: string, dto: BorrowTransitionDto) {
    return this.prisma.$transaction(async tx => {
      const loan = await tx.physicalRecordLoan.findUniqueOrThrow({ where: { id } });
      const expected = { APPROVED: 'REQUESTED', REJECTED: 'REQUESTED', BORROWED: 'APPROVED', RETURN_REQUESTED: 'BORROWED', RETURNED: 'RETURN_REQUESTED' }[dto.status];
      if (loan.status !== expected) throw new ConflictException('Bước giao nhận hồ sơ không hợp lệ');
      if (dto.status === 'RETURN_REQUESTED') { if (actor.id !== loan.userId) throw new ForbiddenException('Chỉ người mượn được đề nghị trả'); }
      else if (!isHr(actor) || actor.id === loan.userId) throw new ForbiddenException('Phải do chuyên viên hồ sơ khác người mượn xác nhận');
      if (['BORROWED', 'RETURNED'].includes(dto.status) && !dto.evidenceUrl?.trim()) throw new BadRequestException('Cần biên bản giao nhận');
      if (dto.status === 'BORROWED' && await tx.physicalRecordLoan.count({ where: { itemKey: loan.itemKey, id: { not: id }, status: { in: ['BORROWED', 'RETURN_REQUESTED'] } } })) throw new ConflictException('Bản gốc đang được mượn');
      const result = await tx.physicalRecordLoan.update({ where: { id }, data: { status: dto.status, ...(dto.status === 'APPROVED' ? { approvedBy: actor.id } : {}), ...(dto.status === 'BORROWED' ? { issuedBy: actor.id, issuedAt: new Date() } : {}), ...(dto.status === 'RETURNED' ? { returnedBy: actor.id, returnedAt: new Date() } : {}), evidenceUrl: dto.evidenceUrl } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: `PHYSICAL_RECORD_${dto.status}`, entityType: 'PhysicalRecordLoan', entityId: id } });
      return result;
    }, { isolationLevel: 'Serializable' });
  }
  async listProbation(actor: AuthUser) {
    const scope = actor.roles.includes('LINE_MANAGER') && !isHr(actor) ? await this.access.reviewScope(actor) : null;
    const users = scope ? await this.prisma.user.findMany({ where: scope, select: { id: true } }) : [];
    return this.prisma.probationReview.findMany({ where: isHr(actor) || actor.roles.includes('BOD') ? {} : scope ? { userId: { in: users.map(u => u.id) } } : { userId: actor.id }, orderBy: { createdAt: 'desc' } });
  }
  async submitProbation(actor: AuthUser, dto: ProbationDto) {
    await this.access.assertReviewer(actor, dto.userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: dto.userId } });
    if (user.employmentStatus !== 'PROBATION') throw new ConflictException('Nhân viên không ở trạng thái thử việc');
    if (dto.recommendation === 'PASS') await this.assertProbationSalaryBand(this.prisma, user.id, dto.contractSalary, dateKey(dto.effectiveDate));
    if (dto.contractType === 'FIXED_TERM' && (!dto.contractEndDate || dateKey(dto.contractEndDate) <= dateKey(dto.effectiveDate))) throw new BadRequestException('Hợp đồng có thời hạn phải có ngày kết thúc hợp lệ');
    if (await this.prisma.probationReview.count({ where: { userId: dto.userId, status: { in: ['SUBMITTED', 'HR_VERIFIED', 'APPROVED'] } } })) throw new ConflictException('Đã có đánh giá thử việc đang xử lý/đã duyệt');
    return this.prisma.probationReview.create({ data: { ...dto, managerId: actor.id, effectiveDate: dateKey(dto.effectiveDate), contractEndDate: dto.contractEndDate ? dateKey(dto.contractEndDate) : null } });
  }
  async decideProbation(actor: AuthUser, id: string, dto: ProbationTransitionDto) {
    const result = await this.prisma.$transaction(async tx => {
      const review = await tx.probationReview.findUniqueOrThrow({ where: { id } });
      if (actor.id === review.managerId || actor.id === review.userId) throw new ForbiddenException('Không được tự thẩm định/phê duyệt');
      if (dto.status === 'HR_VERIFIED') {
        if (!isHr(actor) || review.status !== 'SUBMITTED') throw new ForbiddenException('Cần chuyên viên hồ sơ thẩm định sau quản lý');
      } else if (!actor.roles.some(role => ['ADMIN', 'BOD'].includes(role)) || review.status !== 'HR_VERIFIED' || actor.id === review.hrVerifiedBy) throw new ForbiddenException('Cần Giám đốc khác người thẩm định phê duyệt');
      if (dto.status === 'APPROVED' && review.recommendation !== 'PASS') throw new ConflictException('Không ký chính thức khi đề nghị thử việc không đạt');
      const updated = await tx.probationReview.update({ where: { id, status: review.status }, data: { status: dto.status, decisionNote: dto.note, ...(dto.status === 'HR_VERIFIED' ? { hrVerifiedBy: actor.id } : { decidedBy: actor.id }) } });
      if (dto.status === 'APPROVED') {
        await this.assertProbationSalaryBand(tx, review.userId, review.contractSalary, review.effectiveDate);
        await tx.personnelAction.create({ data: { type: 'PROBATION_PASS', subjectId: review.userId, requestedById: review.managerId, decidedById: actor.id, decidedAt: new Date(), status: 'APPROVED', effectiveAt: review.effectiveDate, payload: { probationReviewId: id, newSalary: review.contractSalary, contractType: review.contractType, contractEndDate: review.contractEndDate?.toISOString() ?? null } } });
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: `PROBATION_${dto.status}`, entityType: 'ProbationReview', entityId: id } });
      return updated;
    }, { isolationLevel: 'Serializable' });
    await this.effects.applyDue();
    return result;
  }
}

@Controller('hr-workflows')
export class HrWorkflowsController {
  constructor(private readonly service: HrWorkflowsService) {}
  @Get('record-loans') loans(@CurrentUser() actor: AuthUser) { return this.service.listLoans(actor); }
  @Post('record-loans') borrow(@CurrentUser() actor: AuthUser, @Body() dto: BorrowDto) { return this.service.borrow(actor, dto); }
  @Patch('record-loans/:id') loanStep(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: BorrowTransitionDto) { return this.service.borrowTransition(actor, id, dto); }
  @Get('probation') probation(@CurrentUser() actor: AuthUser) { return this.service.listProbation(actor); }
  @Roles('ADMIN', 'KM_MANAGER', 'LINE_MANAGER', 'HR_CB')
  @Post('probation') submit(@CurrentUser() actor: AuthUser, @Body() dto: ProbationDto) { return this.service.submitProbation(actor, dto); }
  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD')
  @Patch('probation/:id') decide(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: ProbationTransitionDto) { return this.service.decideProbation(actor, id, dto); }
}
@Module({ controllers: [HrWorkflowsController], providers: [HrWorkflowsService] })
export class HrWorkflowsModule {}
