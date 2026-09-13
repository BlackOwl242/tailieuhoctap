import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean, IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString,
} from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export class UpdateComprehensiveProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() aliasName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() birthPlace?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hometown?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() permanentAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currentAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() idCardNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() idCardIssueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() idCardIssuePlace?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ethnicity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() religion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() familyOrigin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priorJob?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() recruitDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recruitOrg?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() currentOrgDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() officialDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() govPosition?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mainDuty?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() rankCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salaryStep?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salaryCoefficient?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() salaryStepDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() overGradePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() positionAllowance?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() otherAllowance?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() socialInsuranceNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() socialInsuranceDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() generalEducation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() highestDegree?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() majorCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() majorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() academicTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() academicTitleDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() politicalTheory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stateManagement?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() foreignLanguage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() informaticsLevel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ethnicLanguage?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() unionJoinDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() partyJoinDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() partyOfficialDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partyPosition?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partyJoinPlace?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() enlistmentDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dischargeDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() militaryRank?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() honorTitle?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() healthStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() heightCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() weightKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bloodType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() woundedClass?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() policyFamily?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() strengths?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() longestJob?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() historyNotes?: Record<string, any>;
}

export class CreateSalaryHistoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() rankCode?: string;
  @ApiProperty() @IsNumber() step!: number;
  @ApiProperty() @IsNumber() coefficient!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() overGradeRate?: number;
  @ApiProperty() @IsDateString() fromDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decisionNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() decisionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signer?: string;
}

export class CreateAppointmentDto {
  @ApiProperty() @IsString() positionTitle!: string;
  @ApiProperty() @IsString() orgUnitName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentName?: string;
  @ApiProperty() @IsDateString() effectiveDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expirationDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decisionNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() decisionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signer?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCurrent?: boolean;
}

export class CreateEducationDto {
  @ApiProperty() @IsString() schoolName!: string;
  @ApiProperty() @IsString() majorName!: string;
  @ApiProperty() @IsString() degreeName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() studyForm?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() graduationYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() ranking?: string;
}

export class CreateWorkHistoryDto {
  @ApiProperty() @IsDateString() fromDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
  @ApiProperty() @IsString() position!: string;
  @ApiProperty() @IsString() unitName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referencePerson?: string;
}

export class CreateRewardDisciplineDto {
  @ApiProperty() @IsEnum(['REWARD', 'DISCIPLINE']) type!: 'REWARD' | 'DISCIPLINE';
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsDateString() eventDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decisionNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuingAuthority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class CreateFamilyRelationDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(['SELF', 'SPOUSE']) category?: 'SELF' | 'SPOUSE';
  @ApiProperty() @IsString() relationType!: string;
  @ApiProperty() @IsString() fullName!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() birthYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() details?: string;
}

export class CreateAppraisalDto {
  @ApiProperty() @IsNumber() year!: number;
  @ApiProperty() @IsEnum(['EXCELLENT', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY']) classification!: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY';
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decisionNo?: string;
}

export class CreateSocialActivityDto {
  @ApiProperty() @IsDateString() fromDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
  @ApiProperty() @IsString() organizationName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() positionTitle?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class PersonnelProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Lấy danh sách hồ sơ toàn diện (hỗ trợ phân trang, tìm kiếm, lọc ngạch/đơn vị). */
  async listProfiles(query: { q?: string; orgUnitId?: string; rankCode?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.orgUnitId) where.user = { orgUnitId: query.orgUnitId };
    if (query.rankCode) where.rankCode = query.rankCode;
    if (query.q) {
      where.OR = [
        { user: { fullName: { contains: query.q, mode: 'insensitive' } } },
        { user: { email: { contains: query.q, mode: 'insensitive' } } },
        { user: { employeeCode: { contains: query.q, mode: 'insensitive' } } },
        { idCardNo: { contains: query.q, mode: 'insensitive' } },
        { govPosition: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.personnelComprehensiveProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              employeeCode: true,
              hireDate: true,
              employmentStatus: true,
              jobTitle: true,
              avatarUrl: true,
              orgUnit: { select: { id: true, name: true, code: true } },
            },
          },
          rank: true,
        },
        orderBy: { user: { employeeCode: 'asc' } },
      }),
      this.prisma.personnelComprehensiveProfile.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Lấy chi tiết hồ sơ toàn diện và đầy đủ 8 bảng quá trình con. */
  async getProfile(userIdOrProfileId: string) {
    const profile = await this.prisma.personnelComprehensiveProfile.findFirst({
      where: {
        OR: [{ id: userIdOrProfileId }, { userId: userIdOrProfileId }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            employeeCode: true,
            hireDate: true,
            employmentStatus: true,
            birthDate: true,
            phone: true,
            address: true,
            jobTitle: true,
            avatarUrl: true,
            orgUnit: { select: { id: true, name: true, code: true } },
          },
        },
        rank: true,
        salaryHistories: { orderBy: { fromDate: 'desc' }, include: { rank: true } },
        appointments: { orderBy: { effectiveDate: 'desc' } },
        educations: { orderBy: { graduationYear: 'desc' } },
        workHistories: { orderBy: { fromDate: 'desc' } },
        rewardDisciplines: { orderBy: { eventDate: 'desc' } },
        familyRelations: { orderBy: { relationType: 'asc' } },
        appraisals: { orderBy: { year: 'desc' } },
        socialActivities: { orderBy: { fromDate: 'desc' } },
      },
    });

    if (!profile) {
      // Nếu chưa có profile nhưng user tồn tại -> tự động tạo profile rỗng ban đầu
      const user = await this.prisma.user.findUnique({ where: { id: userIdOrProfileId } });
      if (!user) throw new NotFoundException('Không tìm thấy thông tin nhân sự');

      const created = await this.prisma.personnelComprehensiveProfile.create({
        data: {
          userId: user.id,
          gender: user.fullName.includes('Thị') || user.fullName.includes('Nữ') ? 'Nữ' : 'Nam',
          currentAddress: user.address,
          recruitDate: user.hireDate,
          govPosition: user.jobTitle,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true, employeeCode: true, hireDate: true, jobTitle: true, orgUnit: true } },
          rank: true,
          salaryHistories: true,
          appointments: true,
          educations: true,
          workHistories: true,
          rewardDisciplines: true,
          familyRelations: true,
          appraisals: true,
          socialActivities: true,
        },
      });
      return created;
    }

    return profile;
  }

  /** Cập nhật thông tin hồ sơ toàn diện (111 trường). */
  async updateProfile(userId: string, dto: UpdateComprehensiveProfileDto, actor: AuthUser) {
    let profile = await this.prisma.personnelComprehensiveProfile.findUnique({ where: { userId } });

    const data: any = { ...dto };
    if (dto.recruitDate) data.recruitDate = new Date(dto.recruitDate);
    if (dto.currentOrgDate) data.currentOrgDate = new Date(dto.currentOrgDate);
    if (dto.officialDate) data.officialDate = new Date(dto.officialDate);
    if (dto.salaryStepDate) data.salaryStepDate = new Date(dto.salaryStepDate);
    if (dto.socialInsuranceDate) data.socialInsuranceDate = new Date(dto.socialInsuranceDate);
    if (dto.academicTitleDate) data.academicTitleDate = new Date(dto.academicTitleDate);
    if (dto.unionJoinDate) data.unionJoinDate = new Date(dto.unionJoinDate);
    if (dto.partyJoinDate) data.partyJoinDate = new Date(dto.partyJoinDate);
    if (dto.partyOfficialDate) data.partyOfficialDate = new Date(dto.partyOfficialDate);
    if (dto.enlistmentDate) data.enlistmentDate = new Date(dto.enlistmentDate);
    if (dto.dischargeDate) data.dischargeDate = new Date(dto.dischargeDate);
    if (dto.idCardIssueDate) data.idCardIssueDate = new Date(dto.idCardIssueDate);

    if (!profile) {
      profile = await this.prisma.personnelComprehensiveProfile.create({
        data: { userId, ...data },
      });
    } else {
      profile = await this.prisma.personnelComprehensiveProfile.update({
        where: { id: profile.id },
        data,
      });
    }

    await this.audit.log({
      actorId: actor.id,
      action: 'UPDATE_COMPREHENSIVE_PROFILE',
      entityType: 'PersonnelComprehensiveProfile',
      entityId: profile.id,
      after: { userId, updatedFields: Object.keys(dto) },
    });

    return this.getProfile(userId);
  }

  private async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.personnelComprehensiveProfile.findUnique({ where: { userId } });
    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Người dùng không tồn tại');
      profile = await this.prisma.personnelComprehensiveProfile.create({ data: { userId } });
    }
    return profile;
  }

  // --- Quản lý 8 Quá trình con ---

  async addSalaryHistory(userId: string, dto: CreateSalaryHistoryDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelSalaryHistory.create({
      data: {
        profileId: profile.id,
        rankCode: dto.rankCode,
        step: dto.step,
        coefficient: dto.coefficient,
        overGradeRate: dto.overGradeRate ?? 0,
        fromDate: new Date(dto.fromDate),
        toDate: dto.toDate ? new Date(dto.toDate) : null,
        decisionNo: dto.decisionNo,
        decisionDate: dto.decisionDate ? new Date(dto.decisionDate) : null,
        signer: dto.signer,
      },
      include: { rank: true },
    });
  }

  async deleteSalaryHistory(id: string) {
    return this.prisma.personnelSalaryHistory.delete({ where: { id } });
  }

  async addAppointment(userId: string, dto: CreateAppointmentDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelAppointment.create({
      data: {
        profileId: profile.id,
        positionTitle: dto.positionTitle,
        orgUnitName: dto.orgUnitName,
        departmentName: dto.departmentName,
        effectiveDate: new Date(dto.effectiveDate),
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        decisionNo: dto.decisionNo,
        decisionDate: dto.decisionDate ? new Date(dto.decisionDate) : null,
        signer: dto.signer,
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  async deleteAppointment(id: string) {
    return this.prisma.personnelAppointment.delete({ where: { id } });
  }

  async addEducation(userId: string, dto: CreateEducationDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelEducation.create({
      data: {
        profileId: profile.id,
        schoolName: dto.schoolName,
        majorName: dto.majorName,
        degreeName: dto.degreeName,
        studyForm: dto.studyForm || 'Chính quy',
        fromDate: dto.fromDate ? new Date(dto.fromDate) : null,
        toDate: dto.toDate ? new Date(dto.toDate) : null,
        graduationYear: dto.graduationYear,
        ranking: dto.ranking,
      },
    });
  }

  async deleteEducation(id: string) {
    return this.prisma.personnelEducation.delete({ where: { id } });
  }

  async addWorkHistory(userId: string, dto: CreateWorkHistoryDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelWorkHistory.create({
      data: {
        profileId: profile.id,
        fromDate: new Date(dto.fromDate),
        toDate: dto.toDate ? new Date(dto.toDate) : null,
        position: dto.position,
        unitName: dto.unitName,
        departmentName: dto.departmentName,
        referencePerson: dto.referencePerson,
      },
    });
  }

  async deleteWorkHistory(id: string) {
    return this.prisma.personnelWorkHistory.delete({ where: { id } });
  }

  async addRewardDiscipline(userId: string, dto: CreateRewardDisciplineDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelRewardDiscipline.create({
      data: {
        profileId: profile.id,
        type: dto.type,
        title: dto.title,
        eventDate: new Date(dto.eventDate),
        decisionNo: dto.decisionNo,
        issuingAuthority: dto.issuingAuthority,
        reason: dto.reason,
      },
    });
  }

  async deleteRewardDiscipline(id: string) {
    return this.prisma.personnelRewardDiscipline.delete({ where: { id } });
  }

  async addFamilyRelation(userId: string, dto: CreateFamilyRelationDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelFamilyRelation.create({
      data: {
        profileId: profile.id,
        category: dto.category || 'SELF',
        relationType: dto.relationType,
        fullName: dto.fullName,
        birthYear: dto.birthYear,
        details: dto.details,
      },
    });
  }

  async deleteFamilyRelation(id: string) {
    return this.prisma.personnelFamilyRelation.delete({ where: { id } });
  }

  async addAppraisal(userId: string, dto: CreateAppraisalDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelAppraisal.create({
      data: {
        profileId: profile.id,
        year: dto.year,
        classification: dto.classification,
        comment: dto.comment,
        decisionNo: dto.decisionNo,
      },
    });
  }

  async deleteAppraisal(id: string) {
    return this.prisma.personnelAppraisal.delete({ where: { id } });
  }

  async addSocialActivity(userId: string, dto: CreateSocialActivityDto) {
    const profile = await this.getOrCreateProfile(userId);

    return this.prisma.personnelSocialActivity.create({
      data: {
        profileId: profile.id,
        fromDate: new Date(dto.fromDate),
        toDate: dto.toDate ? new Date(dto.toDate) : null,
        organizationName: dto.organizationName,
        positionTitle: dto.positionTitle,
      },
    });
  }

  async deleteSocialActivity(id: string) {
    return this.prisma.personnelSocialActivity.delete({ where: { id } });
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('Personnel Profiles — Hồ sơ Nhân sự Toàn diện')
@ApiBearerAuth()
@Controller('personnel-profiles')
export class PersonnelProfilesController {
  constructor(private readonly service: PersonnelProfilesService) {}

  @Get()
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  list(@Query() query: { q?: string; orgUnitId?: string; rankCode?: string; page?: number; limit?: number }) {
    return this.service.listProfiles(query);
  }

  @Get(':userId')
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  getOne(@Param('userId') userId: string) {
    return this.service.getProfile(userId);
  }

  @Patch(':userId')
  @Put(':userId')
  @Roles('ADMIN', 'KM_MANAGER')
  update(
    @Param('userId') userId: string,
    @Body() dto: UpdateComprehensiveProfileDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.service.updateProfile(userId, dto, actor);
  }

  // --- Endpoints 8 Quá trình con ---

  @Post(':userId/salary-histories')
  @Roles('ADMIN', 'KM_MANAGER')
  addSalaryHistory(@Param('userId') userId: string, @Body() dto: CreateSalaryHistoryDto) {
    return this.service.addSalaryHistory(userId, dto);
  }

  @Delete(':userId/salary-histories/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteSalaryHistory(@Param('id') id: string) {
    return this.service.deleteSalaryHistory(id);
  }

  @Post(':userId/appointments')
  @Roles('ADMIN', 'KM_MANAGER')
  addAppointment(@Param('userId') userId: string, @Body() dto: CreateAppointmentDto) {
    return this.service.addAppointment(userId, dto);
  }

  @Delete(':userId/appointments/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteAppointment(@Param('id') id: string) {
    return this.service.deleteAppointment(id);
  }

  @Post(':userId/educations')
  @Roles('ADMIN', 'KM_MANAGER')
  addEducation(@Param('userId') userId: string, @Body() dto: CreateEducationDto) {
    return this.service.addEducation(userId, dto);
  }

  @Delete(':userId/educations/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteEducation(@Param('id') id: string) {
    return this.service.deleteEducation(id);
  }

  @Post(':userId/work-histories')
  @Roles('ADMIN', 'KM_MANAGER')
  addWorkHistory(@Param('userId') userId: string, @Body() dto: CreateWorkHistoryDto) {
    return this.service.addWorkHistory(userId, dto);
  }

  @Delete(':userId/work-histories/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteWorkHistory(@Param('id') id: string) {
    return this.service.deleteWorkHistory(id);
  }

  @Post(':userId/rewards-disciplines')
  @Roles('ADMIN', 'KM_MANAGER')
  addRewardDiscipline(@Param('userId') userId: string, @Body() dto: CreateRewardDisciplineDto) {
    return this.service.addRewardDiscipline(userId, dto);
  }

  @Delete(':userId/rewards-disciplines/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteRewardDiscipline(@Param('id') id: string) {
    return this.service.deleteRewardDiscipline(id);
  }

  @Post(':userId/family-relations')
  @Roles('ADMIN', 'KM_MANAGER')
  addFamilyRelation(@Param('userId') userId: string, @Body() dto: CreateFamilyRelationDto) {
    return this.service.addFamilyRelation(userId, dto);
  }

  @Delete(':userId/family-relations/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteFamilyRelation(@Param('id') id: string) {
    return this.service.deleteFamilyRelation(id);
  }

  @Post(':userId/appraisals')
  @Roles('ADMIN', 'KM_MANAGER')
  addAppraisal(@Param('userId') userId: string, @Body() dto: CreateAppraisalDto) {
    return this.service.addAppraisal(userId, dto);
  }

  @Delete(':userId/appraisals/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteAppraisal(@Param('id') id: string) {
    return this.service.deleteAppraisal(id);
  }

  @Post(':userId/social-activities')
  @Roles('ADMIN', 'KM_MANAGER')
  addSocialActivity(@Param('userId') userId: string, @Body() dto: CreateSocialActivityDto) {
    return this.service.addSocialActivity(userId, dto);
  }

  @Delete(':userId/social-activities/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteSocialActivity(@Param('id') id: string) {
    return this.service.deleteSocialActivity(id);
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  controllers: [PersonnelProfilesController],
  providers: [PersonnelProfilesService],
  exports: [PersonnelProfilesService],
})
export class PersonnelProfilesModule {}
