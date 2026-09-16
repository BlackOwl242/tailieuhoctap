import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// Định nghĩa Phân cấp Mức độ Dữ liệu Nhân sự (Tiers)
// ---------------------------------------------------------------------------

export const TIER_1_SELF_SERVICE_FIELDS = new Set([
  'phone',
  'currentAddress',
  'avatarUrl',
  'bio',
  'expertise',
  'strengths',
  'workPhone',
  'homePhone',
]);

export const TIER_2_VERIFIED_FIELDS = new Set([
  'fullName',
  'aliasName',
  'gender',
  'birthDate',
  'birthPlace',
  'hometown',
  'permanentAddress',
  'idCardNo',
  'idCardIssueDate',
  'idCardIssuePlace',
  'ethnicity',
  'religion',
  'familyOrigin',
  'maritalStatus',
  'generalEducation',
  'highestDegree',
  'majorCode',
  'majorName',
  'academicTitle',
  'academicTitleDate',
  'politicalTheory',
  'stateManagement',
  'foreignLanguage',
  'informaticsLevel',
  'ethnicLanguage',
  'healthStatus',
  'heightCm',
  'weightKg',
  'bloodType',
  'socialInsuranceNo',
  'socialInsuranceDate',
]);

export const TIER_3_RESTRICTED_ORG_FIELDS = new Set([
  'employeeCode',
  'orgUnitId',
  'jobTitle',
  'govPosition',
  'mainDuty',
  'rankCode',
  'salaryStep',
  'salaryCoefficient',
  'salaryStepDate',
  'baseSalary',
  'overGradePercent',
  'positionAllowance',
  'otherAllowance',
  'recruitDate',
  'recruitOrg',
  'currentOrgDate',
  'officialDate',
  'employmentStatus',
  'unionJoinDate',
  'partyJoinDate',
  'partyOfficialDate',
  'partyPosition',
  'partyJoinPlace',
  'enlistmentDate',
  'dischargeDate',
  'militaryRank',
  'honorTitle',
  'woundedClass',
  'policyFamily',
  'longestJob',
  'historyNotes',
]);

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export class FieldChangeItemDto {
  @ApiProperty() label!: string;
  @ApiProperty() oldValue!: any;
  @ApiProperty() newValue!: any;
  @ApiPropertyOptional() tier?: number;
}

export class CreateProfileChangeRequestDto {
  @ApiProperty({ description: 'Danh sách các trường cần xin điều chỉnh: { [fieldName]: { label, oldValue, newValue, tier } }' })
  @IsObject()
  changes!: Record<string, FieldChangeItemDto>;

  @ApiProperty({ description: 'Lý do đề xuất điều chỉnh thông tin cá nhân', minLength: 5 })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Vui lòng cung cấp lý do đề xuất ít nhất 5 ký tự' })
  reason!: string;

  @ApiPropertyOptional({ description: 'Danh sách URL minh chứng (ảnh CCCD, văn bằng, chứng nhận...)', type: [String] })
  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

export class ReviewProfileChangeRequestDto {
  @ApiPropertyOptional({ description: 'Ghi chú thẩm định của Phòng Nhân sự / Ban Tổ chức' })
  @IsOptional()
  @IsString()
  reviewerNote?: string;
}

export class RejectProfileChangeRequestDto {
  @ApiProperty({ description: 'Lý do từ chối yêu cầu', minLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Vui lòng nêu rõ lý do từ chối' })
  reviewerNote!: string;
}

export class ListProfileChangeRequestsQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên nhân viên, email, mã nhân viên' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  limit?: number = 20;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ProfileChangeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Cán bộ/nhân viên tạo đề xuất thay đổi thông tin cá nhân. */
  async createRequest(userId: string, dto: CreateProfileChangeRequestDto) {
    if (!dto.changes || Object.keys(dto.changes).length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một trường thông tin cần điều chỉnh');
    }

    // Kiểm tra tính hợp lệ của các trường: CẤM TUYỆT ĐỐI trường Mức 3 (Tier 3)
    for (const fieldName of Object.keys(dto.changes)) {
      if (TIER_3_RESTRICTED_ORG_FIELDS.has(fieldName)) {
        throw new BadRequestException(
          `Trường [${dto.changes[fieldName]?.label || fieldName}] thuộc Mức 3 (Tổ chức quản lý) — Cán bộ/nhân viên không được tự đề xuất chỉnh sửa trực tiếp. Vui lòng liên hệ Ban Lãnh đạo hoặc theo quy trình biến động nhân sự.`,
        );
      }
    }

    const request = await this.prisma.profileChangeRequest.create({
      data: {
        userId,
        changes: dto.changes as any,
        reason: dto.reason.trim(),
        attachmentUrls: dto.attachmentUrls ?? [],
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            email: true,
            jobTitle: true,
            orgUnit: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    await this.audit.log({
      actorId: userId,
      action: 'CREATE_PROFILE_CHANGE_REQUEST',
      entityType: 'ProfileChangeRequest',
      entityId: request.id,
      after: { changedFields: Object.keys(dto.changes), reason: dto.reason },
    });

    return request;
  }

  /** Lấy danh sách đề xuất của chính cá nhân đăng nhập. */
  async listMyRequests(userId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED') {
    return this.prisma.profileChangeRequest.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** HR / Ban Tổ chức lấy danh sách toàn bộ đề xuất cần xét duyệt. */
  async listAllRequests(query: ListProfileChangeRequestsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.q) {
      where.user = {
        OR: [
          { fullName: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
          { employeeCode: { contains: query.q, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total, pendingCount] = await Promise.all([
      this.prisma.profileChangeRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              employeeCode: true,
              jobTitle: true,
              avatarUrl: true,
              orgUnit: { select: { id: true, name: true, code: true } },
            },
          },
          reviewer: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profileChangeRequest.count({ where }),
      this.prisma.profileChangeRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      items,
      total,
      pendingCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Lấy chi tiết 1 yêu cầu xét duyệt. */
  async getRequestDetail(id: string, viewer: AuthUser) {
    const req = await this.prisma.profileChangeRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
            jobTitle: true,
            avatarUrl: true,
            birthDate: true,
            phone: true,
            address: true,
            orgUnit: { select: { id: true, name: true, code: true } },
          },
        },
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu điều chỉnh thông tin');

    // Chỉ chính chủ hoặc HR/Admin được xem
    const isOwner = req.userId === viewer.id;
    const isHr = viewer.roles.includes('ADMIN') || viewer.roles.includes('KM_MANAGER');
    if (!isOwner && !isHr) {
      throw new ForbiddenException('Bạn không có quyền xem yêu cầu này');
    }

    return req;
  }

  /** HR / Ban Tổ chức Phê duyệt yêu cầu -> Tự động cập nhật dữ liệu vào User & Profile. */
  async approveRequest(id: string, dto: ReviewProfileChangeRequestDto, reviewer: AuthUser) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu điều chỉnh thông tin');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Yêu cầu đã ở trạng thái ${request.status}, không thể phê duyệt lại`);
    }

    const changes = (request.changes ?? {}) as unknown as Record<string, FieldChangeItemDto>;
    const userUpdates: Record<string, any> = {};
    const profileUpdates: Record<string, any> = {};

    // Phân loại các trường vào User vs PersonnelComprehensiveProfile
    for (const [key, item] of Object.entries(changes)) {
      const val = item.newValue;

      // Map trường User cơ bản
      if (key === 'fullName') userUpdates.fullName = val;
      if (key === 'phone') userUpdates.phone = val;
      if (key === 'currentAddress') {
        userUpdates.address = val;
        profileUpdates.currentAddress = val;
      }
      if (key === 'birthDate') {
        userUpdates.birthDate = val ? new Date(val) : null;
      }

      // Map trường PersonnelComprehensiveProfile
      const profileDateKeys = [
        'idCardIssueDate', 'socialInsuranceDate', 'academicTitleDate',
        'unionJoinDate', 'partyJoinDate', 'partyOfficialDate',
        'enlistmentDate', 'dischargeDate', 'recruitDate', 'currentOrgDate', 'officialDate',
      ];
      if (profileDateKeys.includes(key)) {
        profileUpdates[key] = val ? new Date(val) : null;
      } else if (key !== 'phone' && key !== 'currentAddress') {
        profileUpdates[key] = val;
      }
    }

    // Thực hiện cập nhật giao dịch
    await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật bảng User nếu có trường liên quan
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: request.userId },
          data: userUpdates,
        });
      }

      // 2. Cập nhật bảng PersonnelComprehensiveProfile
      if (Object.keys(profileUpdates).length > 0) {
        await tx.personnelComprehensiveProfile.upsert({
          where: { userId: request.userId },
          create: {
            userId: request.userId,
            ...profileUpdates,
          },
          update: profileUpdates,
        });
      }

      // 3. Cập nhật trạng thái ProfileChangeRequest -> APPROVED
      await tx.profileChangeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewerId: reviewer.id,
          reviewerNote: dto.reviewerNote || 'Đã kiểm tra minh chứng đối chiếu và phê duyệt hồ sơ',
          reviewedAt: new Date(),
        },
      });

      // 4. Tạo thông báo in-app cho nhân viên
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: 'Đề xuất cập nhật hồ sơ cá nhân đã được phê duyệt',
          body: `Phòng Tổ chức - Nhân sự đã phê duyệt đề xuất điều chỉnh thông tin cá nhân của bạn. Dữ liệu hồ sơ đã được cập nhật thành công.`,
          linkPath: '/profile',
        },
      });
    });

    await this.audit.log({
      actorId: reviewer.id,
      action: 'APPROVE_PROFILE_CHANGE_REQUEST',
      entityType: 'ProfileChangeRequest',
      entityId: id,
      after: {
        userId: request.userId,
        approvedFields: Object.keys(changes),
        reviewerNote: dto.reviewerNote,
      },
    });

    return { success: true, message: 'Đã phê duyệt đề xuất và tự động đồng bộ vào hồ sơ nhân sự' };
  }

  /** HR / Ban Tổ chức Từ chối yêu cầu kèm lý do. */
  async rejectRequest(id: string, dto: RejectProfileChangeRequestDto, reviewer: AuthUser) {
    const request = await this.prisma.profileChangeRequest.findUnique({ where: { id } });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu điều chỉnh thông tin');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Yêu cầu đã ở trạng thái ${request.status}, không thể từ chối`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.profileChangeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewerId: reviewer.id,
          reviewerNote: dto.reviewerNote,
          reviewedAt: new Date(),
        },
      });

      // Thông báo cho nhân viên lý do từ chối
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: 'Đề xuất cập nhật hồ sơ cá nhân bị từ chối',
          body: `Phòng Tổ chức - Nhân sự đã từ chối đề xuất của bạn với lý do: "${dto.reviewerNote}". Vui lòng kiểm tra lại giấy tờ minh chứng.`,
          linkPath: '/profile',
        },
      });
    });

    await this.audit.log({
      actorId: reviewer.id,
      action: 'REJECT_PROFILE_CHANGE_REQUEST',
      entityType: 'ProfileChangeRequest',
      entityId: id,
      after: {
        userId: request.userId,
        reviewerNote: dto.reviewerNote,
      },
    });

    return { success: true, message: 'Đã từ chối đề xuất điều chỉnh thông tin' };
  }

  /** Nhân viên tự hủy yêu cầu khi còn PENDING. */
  async cancelRequest(id: string, user: AuthUser) {
    const request = await this.prisma.profileChangeRequest.findUnique({ where: { id } });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu');
    if (request.userId !== user.id) {
      throw new ForbiddenException('Bạn không thể hủy yêu cầu của người khác');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy yêu cầu đang ở trạng thái chờ duyệt');
    }

    await this.prisma.profileChangeRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'CANCEL_PROFILE_CHANGE_REQUEST',
      entityType: 'ProfileChangeRequest',
      entityId: id,
    });

    return { success: true, message: 'Đã hủy yêu cầu thành công' };
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('Profile Change Requests — Đề xuất & Xét duyệt Thông tin Cá nhân')
@ApiBearerAuth()
@Controller('profile-change-requests')
export class ProfileChangeRequestsController {
  constructor(private readonly service: ProfileChangeRequestsService) {}

  @Post()
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProfileChangeRequestDto) {
    return this.service.createRequest(user.id, dto);
  }

  @Get('my')
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  listMy(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED',
  ) {
    return this.service.listMyRequests(user.id, status);
  }

  @Get()
  @Roles('ADMIN', 'KM_MANAGER')
  listAll(@Query() query: ListProfileChangeRequestsQueryDto) {
    return this.service.listAllRequests(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.getRequestDetail(id, user);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'KM_MANAGER')
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewProfileChangeRequestDto,
    @CurrentUser() reviewer: AuthUser,
  ) {
    return this.service.approveRequest(id, dto, reviewer);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'KM_MANAGER')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectProfileChangeRequestDto,
    @CurrentUser() reviewer: AuthUser,
  ) {
    return this.service.rejectRequest(id, dto, reviewer);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancelRequest(id, user);
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  controllers: [ProfileChangeRequestsController],
  providers: [ProfileChangeRequestsService],
  exports: [ProfileChangeRequestsService],
})
export class ProfileChangeRequestsModule {}
