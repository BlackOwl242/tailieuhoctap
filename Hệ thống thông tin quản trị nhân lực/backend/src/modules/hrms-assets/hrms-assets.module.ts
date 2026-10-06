import { ConflictException } from '@nestjs/common';
import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

export class CreateAssetDto {
  @ApiProperty({ example: 'AST-008' })
  @IsString()
  assetCode: string;

  @ApiProperty({ example: 'MacBook Pro 16 inch M3 Max' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: 'IT_EQUIPMENT' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'C02G12345678' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ default: 65000000 })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AllocateAssetDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  assignedUserId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  assignedEmployeeName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmAssetReceiptDto {
  @ApiProperty({ description: 'Xác nhận nhân viên đã nhận đúng tài sản' })
  @IsBoolean()
  accepted: boolean;

  @ApiProperty({ enum: ['NEW', 'EXCELLENT', 'GOOD', 'DAMAGED'] })
  @IsIn(['NEW', 'EXCELLENT', 'GOOD', 'DAMAGED'])
  condition: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

@Injectable()
export class HrmsAssetsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listAssets(status?: string, category?: string, assignedUserId?: string) {
    return this.prisma.hrmsAssetAllocation.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(assignedUserId ? { assignedUserId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(actorId: string, dto: CreateAssetDto) {
    const asset = await this.prisma.hrmsAssetAllocation.create({
      data: {
        assetCode: dto.assetCode,
        name: dto.name,
        category: dto.category ?? 'IT_EQUIPMENT',
        serialNumber: dto.serialNumber,
        value: dto.value ?? 0,
        notes: dto.notes,
        status: 'AVAILABLE',
      },
    });

    await this.audit.log({
      actorId,
      action: 'HRMS_ASSET_CREATE',
      targetType: 'HrmsAssetAllocation',
      targetId: asset.id,
      description: `Thêm tài sản mới: ${dto.name} (${dto.assetCode})`,
    });

    return asset;
  }

  async allocate(actorId: string, id: string, dto: AllocateAssetDto) {
    const asset = await this.prisma.hrmsAssetAllocation.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Không tìm thấy tài sản');

    const recipient = await this.prisma.user.findFirst({ where: { id: dto.assignedUserId, deletedAt: null, employmentStatus: { in: ['ACTIVE','PROBATION'] } } });
    if (!recipient) throw new ConflictException('Người nhận không còn làm việc');
    if (asset.status !== 'AVAILABLE') throw new ConflictException('Trạng thái tài sản không cho phép thao tác');
    const updated = await this.prisma.$transaction(async tx => {
    const changed = await tx.hrmsAssetAllocation.updateMany({
      where: { id, status: 'AVAILABLE' },
      data: {
        assignedUserId: dto.assignedUserId,
        assignedEmployeeName: recipient.fullName,
        allocatedDate: new Date(),
        status: 'PENDING_ACK',
        notes: dto.notes ?? asset.notes,
      },
    });

      if (changed.count !== 1) throw new ConflictException('Tài sản vừa được cập nhật bởi người khác');
      await tx.assetCustodyEvent.create({ data: { assetId: id, userId: dto.assignedUserId, actorId, action: 'ISSUE_PENDING_ACK', notes: dto.notes } });
      return tx.hrmsAssetAllocation.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: 'HRMS_ASSET_ALLOCATE',
      targetType: 'HrmsAssetAllocation',
      targetId: id,
      description: `Cấp phát tài sản ${asset.name} cho nhân viên ${dto.assignedEmployeeName}`,
    });

    return updated;
  }

  history(id: string) { return this.prisma.assetCustodyEvent.findMany({ where: { assetId: id }, orderBy: { at: 'desc' } }); }

  async acknowledgeReceipt(actor: AuthUser, id: string, dto: ConfirmAssetReceiptDto) {
    if (!dto.accepted) throw new ConflictException('Cần xác nhận đã nhận tài sản trước khi ghi nhận bàn giao');
    const asset = await this.prisma.hrmsAssetAllocation.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Không tìm thấy tài sản');
    if (asset.assignedUserId !== actor.id) throw new NotFoundException('Không tìm thấy bàn giao cần xác nhận');
    if (asset.status !== 'PENDING_ACK') throw new ConflictException('Bàn giao không còn chờ xác nhận');
    return this.prisma.$transaction(async tx => {
      const changed = await tx.hrmsAssetAllocation.updateMany({
        where: { id, assignedUserId: actor.id, status: 'PENDING_ACK' },
        data: { status: 'ALLOCATED', condition: dto.condition },
      });
      if (changed.count !== 1) throw new ConflictException('Bàn giao vừa được xử lý');
      await tx.assetCustodyEvent.create({ data: {
        assetId: id, userId: actor.id, actorId: actor.id, action: 'RECEIPT_ACK',
        acknowledgedAt: new Date(), notes: `Nhân viên xác nhận đã nhận; tình trạng: ${dto.condition}${dto.notes?.trim() ? `; ${dto.notes.trim()}` : ''}`,
      } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'HRMS_ASSET_RECEIPT_ACK', entityType: 'HrmsAssetAllocation', entityId: id } });
      return tx.hrmsAssetAllocation.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });
  }

  async returnAsset(actorId: string, id: string, notes?: string) {
    const asset = await this.prisma.hrmsAssetAllocation.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Không tìm thấy tài sản');

    if (asset.status !== 'ALLOCATED') throw new ConflictException('Chỉ tài sản đã được nhân viên xác nhận mới được thu hồi');
    const updated = await this.prisma.$transaction(async tx => {
    const changed = await tx.hrmsAssetAllocation.updateMany({
      where: { id, status: 'ALLOCATED' },
      data: {
        assignedUserId: null,
        assignedEmployeeName: null,
        returnedDate: new Date(),
        status: 'AVAILABLE',
        notes: notes ?? asset.notes,
      },
    });

      if (changed.count !== 1) throw new ConflictException('Tài sản vừa được cập nhật bởi người khác');
      await tx.assetCustodyEvent.create({ data: { assetId: id, userId: asset.assignedUserId!, actorId, action: 'RETURN', notes: notes } });
      return tx.hrmsAssetAllocation.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: 'HRMS_ASSET_RETURN',
      targetType: 'HrmsAssetAllocation',
      targetId: id,
      description: `Thu hồi tài sản ${asset.name} về kho`,
    });

    return updated;
  }
}

@ApiTags('HRMS - Asset Allocations')
@ApiBearerAuth()
@Controller('hrms/assets')
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
export class HrmsAssetsController {
  constructor(private readonly service: HrmsAssetsService) {}

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Get('my')
  myAssets(@CurrentUser() user: AuthUser) {
    return this.service.listAssets(undefined, undefined, user?.id);
  }

  @Get()
  listAssets(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('assignedUserId') assignedUserId?: string,
  ) {
    return this.service.listAssets(status, category, assignedUserId);
  }

  @Post()
  create(@Body() dto: CreateAssetDto, @CurrentUser() actor: AuthUser) {
    return this.service.create(actor.id, dto);
  }

  @Get(':id/history')
  history(@Param('id') id: string) { return this.service.history(id); }

  @Patch(':id/allocate')
  allocate(@Param('id') id: string, @Body() dto: AllocateAssetDto, @CurrentUser() actor: AuthUser) {
    return this.service.allocate(actor.id, id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'USER', 'LINE_MANAGER', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Post(':id/acknowledge')
  acknowledge(@Param('id') id: string, @Body() dto: ConfirmAssetReceiptDto, @CurrentUser() actor: AuthUser) {
    return this.service.acknowledgeReceipt(actor, id, dto);
  }

  @Patch(':id/return')
  returnAsset(@Param('id') id: string, @Body() body: { notes?: string }, @CurrentUser() actor: AuthUser) {
    return this.service.returnAsset(actor.id, id, body?.notes);
  }
}

@Module({
  controllers: [HrmsAssetsController],
  providers: [HrmsAssetsService],
  exports: [HrmsAssetsService],
})
export class HrmsAssetsModule {}
