import { BadRequestException, ConflictException, Injectable, Module, NotFoundException } from '@nestjs/common';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { dateKey } from '../../common/hr-time';

export class UpsertSalaryBandDto {
  @ApiProperty({ example: 'ENG-02' }) @IsString() @MinLength(2) @MaxLength(40) code!: string;
  @ApiProperty({ example: 'Kỹ sư phần mềm cấp 2' }) @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @ApiProperty({ example: 'Chuyên viên độc lập' }) @IsString() @MinLength(2) @MaxLength(120) levelTitle!: string;
  @ApiProperty() @IsNumber() @Min(1) minSalary!: number;
  @ApiProperty() @IsNumber() @Min(1) midSalary!: number;
  @ApiProperty() @IsNumber() @Min(1) maxSalary!: number;
  @ApiPropertyOptional({ enum: ['MONTHLY', 'DAILY', 'HOURLY'], default: 'MONTHLY' }) @IsOptional() @IsIn(['MONTHLY', 'DAILY', 'HOURLY']) compensationBasis?: 'MONTHLY' | 'DAILY' | 'HOURLY';
  @ApiPropertyOptional({ default: 12 }) @IsOptional() @IsInt() @Min(1) reviewCycleMonths?: number;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) jobTitles!: string[];
  @ApiProperty({ example: 'Tự xử lý các đầu việc chuyên môn; chất lượng được kiểm tra theo tiêu chí đã công bố.' }) @IsString() @MinLength(10) @MaxLength(4000) criteria!: string;
  @ApiProperty({ example: 'Khảo sát 5 doanh nghiệp cùng ngành trong quý 3/2026, đã được Tài chính và Giám đốc duyệt.' }) @IsString() @MinLength(10) @MaxLength(2000) benchmarkSource!: string;
  @ApiProperty() @IsDateString() effectiveFrom!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
}

@Injectable()
export class SalaryBandsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private async linkUnassignedProfilesToUniqueEffectiveBands() {
    const today = dateKey(new Date());
    const [bands, users] = await Promise.all([
      this.prisma.hrmsSalaryBand.findMany({ where: { status: 'ACTIVE', approvedAt: { not: null }, effectiveFrom: { lte: today }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }] }, select: { id: true, jobTitles: true } }),
      this.prisma.user.findMany({ where: { deletedAt: null, status: 'ACTIVE', employmentStatus: { in: ['ACTIVE', 'PROBATION'] }, jobTitle: { not: null } }, select: { id: true, jobTitle: true, salaryBandId: true } }),
    ]);
    const effectiveBandIds = new Set(bands.map((band) => band.id));
    const byBand = new Map<string, { salaryBandId: string; previousBandId: string | null; userIds: string[] }>();
    for (const user of users) {
      if (user.salaryBandId && effectiveBandIds.has(user.salaryBandId)) continue;
      const matches = bands.filter((band) => band.jobTitles.includes(user.jobTitle!));
      if (matches.length !== 1) continue;
      const key = `${matches[0].id}:${user.salaryBandId ?? 'none'}`;
      const group = byBand.get(key) ?? { salaryBandId: matches[0].id, previousBandId: user.salaryBandId, userIds: [] };
      group.userIds.push(user.id);
      byBand.set(key, group);
    }
    await this.prisma.$transaction([...byBand.values()].map((group) => this.prisma.user.updateMany({ where: { id: { in: group.userIds }, salaryBandId: group.previousBandId }, data: { salaryBandId: group.salaryBandId } })));
  }

  list() {
    return this.prisma.hrmsSalaryBand.findMany({
      include: { _count: { select: { employees: true, openings: true } } },
      orderBy: [{ code: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  private validate(dto: UpsertSalaryBandDto) {
    if (dto.minSalary > dto.midSalary || dto.midSalary > dto.maxSalary) throw new BadRequestException('Mức sàn phải nhỏ hơn hoặc bằng mức tham chiếu, và mức tham chiếu phải nhỏ hơn hoặc bằng mức trần');
    if (dto.effectiveTo && dateKey(dto.effectiveTo) < dateKey(dto.effectiveFrom)) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu hiệu lực');
    if (new Set(dto.jobTitles.map(title => title.trim().toLocaleLowerCase('vi'))).size !== dto.jobTitles.length) throw new BadRequestException('Chức danh áp dụng không được lặp');
  }

  async create(actor: AuthUser, dto: UpsertSalaryBandDto) {
    this.validate(dto);
    const result = await this.prisma.hrmsSalaryBand.create({ data: {
      ...dto,
      compensationBasis: dto.compensationBasis ?? 'MONTHLY',
      jobTitles: dto.jobTitles.map(title => title.trim()).filter(Boolean),
      effectiveFrom: dateKey(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? dateKey(dto.effectiveTo) : null,
      reviewCycleMonths: dto.reviewCycleMonths ?? 12,
      status: 'DRAFT',
      createdById: actor.id,
    } });
    await this.audit.log({ actorId: actor.id, action: 'SALARY_BAND_CREATED', entityType: 'HrmsSalaryBand', entityId: result.id, after: dto });
    return result;
  }

  async update(actor: AuthUser, id: string, dto: UpsertSalaryBandDto) {
    this.validate(dto);
    const current = await this.prisma.hrmsSalaryBand.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy khung lương');
    if (current.status !== 'DRAFT') throw new ConflictException('Khung đã được duyệt; hãy tạo phiên bản mới để giữ lịch sử');
    const result = await this.prisma.hrmsSalaryBand.update({ where: { id }, data: {
      ...dto,
      compensationBasis: dto.compensationBasis ?? 'MONTHLY',
      jobTitles: dto.jobTitles.map(title => title.trim()).filter(Boolean),
      effectiveFrom: dateKey(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? dateKey(dto.effectiveTo) : null,
      reviewCycleMonths: dto.reviewCycleMonths ?? 12,
    } });
    await this.audit.log({ actorId: actor.id, action: 'SALARY_BAND_UPDATED', entityType: 'HrmsSalaryBand', entityId: id, before: current, after: dto });
    return result;
  }

  async activate(actor: AuthUser, id: string) {
    const band = await this.prisma.hrmsSalaryBand.findUnique({ where: { id } });
    if (!band) throw new NotFoundException('Không tìm thấy khung lương');
    if (band.status !== 'DRAFT') throw new ConflictException('Chỉ được duyệt khung đang ở trạng thái nháp');
    if (band.createdById === actor.id) throw new ConflictException('Người lập khung lương không được tự phê duyệt');
    const overlap = await this.prisma.hrmsSalaryBand.findFirst({
      where: { code: band.code, status: 'ACTIVE', effectiveFrom: { lte: band.effectiveTo ?? new Date('9999-12-31') }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: band.effectiveFrom } }] },
    });
    if (overlap) throw new ConflictException('Thời gian hiệu lực bị trùng với phiên bản khung lương đã duyệt');
    const result = await this.prisma.hrmsSalaryBand.update({ where: { id }, data: { status: 'ACTIVE', approvedById: actor.id, approvedAt: new Date() } });
    await this.linkUnassignedProfilesToUniqueEffectiveBands();
    await this.audit.log({ actorId: actor.id, action: 'SALARY_BAND_APPROVED', entityType: 'HrmsSalaryBand', entityId: id });
    return result;
  }

  async deactivate(actor: AuthUser, id: string) {
    const band = await this.prisma.hrmsSalaryBand.findUnique({ where: { id } });
    if (!band) throw new NotFoundException('Không tìm thấy khung lương');
    if (band.status !== 'ACTIVE') throw new ConflictException('Chỉ được ngừng áp dụng khung đang hiệu lực');
    const result = await this.prisma.hrmsSalaryBand.update({ where: { id }, data: { status: 'INACTIVE' } });
    await this.audit.log({ actorId: actor.id, action: 'SALARY_BAND_DEACTIVATED', entityType: 'HrmsSalaryBand', entityId: id });
    return result;
  }
}

@ApiTags('HRMS - Khung lương doanh nghiệp')
@ApiBearerAuth()
@Controller('salary-bands')
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'HR_RECRUITER', 'BOD')
export class SalaryBandsController {
  constructor(private readonly service: SalaryBandsService) {}
  @Get() list() { return this.service.list(); }
  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post() create(@CurrentUser() actor: AuthUser, @Body() dto: UpsertSalaryBandDto) { return this.service.create(actor, dto); }
  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Patch(':id') update(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: UpsertSalaryBandDto) { return this.service.update(actor, id, dto); }
  @Roles('ADMIN', 'BOD')
  @Post(':id/approve') approve(@CurrentUser() actor: AuthUser, @Param('id') id: string) { return this.service.activate(actor, id); }
  @Roles('ADMIN', 'BOD')
  @Post(':id/deactivate') deactivate(@CurrentUser() actor: AuthUser, @Param('id') id: string) { return this.service.deactivate(actor, id); }
}

@Module({ controllers: [SalaryBandsController], providers: [SalaryBandsService], exports: [SalaryBandsService] })
export class SalaryBandsModule {}
