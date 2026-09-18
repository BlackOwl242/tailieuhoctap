import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators';
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

    const updated = await this.prisma.hrmsAssetAllocation.update({
      where: { id },
      data: {
        assignedUserId: dto.assignedUserId,
        assignedEmployeeName: dto.assignedEmployeeName,
        allocatedDate: new Date(),
        status: 'ALLOCATED',
        notes: dto.notes ?? asset.notes,
      },
    });

    await this.audit.log({
      actorId,
      action: 'HRMS_ASSET_ALLOCATE',
      targetType: 'HrmsAssetAllocation',
      targetId: id,
      description: `Cấp phát tài sản ${asset.name} cho nhân viên ${dto.assignedEmployeeName}`,
    });

    return updated;
  }

  async returnAsset(actorId: string, id: string, notes?: string) {
    const asset = await this.prisma.hrmsAssetAllocation.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Không tìm thấy tài sản');

    const updated = await this.prisma.hrmsAssetAllocation.update({
      where: { id },
      data: {
        assignedUserId: null,
        assignedEmployeeName: null,
        returnedDate: new Date(),
        status: 'AVAILABLE',
        notes: notes ?? asset.notes,
      },
    });

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
export class HrmsAssetsController {
  constructor(private readonly service: HrmsAssetsService) {}

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
  create(@Body() dto: CreateAssetDto) {
    return this.service.create('system', dto);
  }

  @Patch(':id/allocate')
  allocate(@Param('id') id: string, @Body() dto: AllocateAssetDto) {
    return this.service.allocate('system', id, dto);
  }

  @Patch(':id/return')
  returnAsset(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.service.returnAsset('system', id, body?.notes);
  }
}

@Module({
  controllers: [HrmsAssetsController],
  providers: [HrmsAssetsService],
  exports: [HrmsAssetsService],
})
export class HrmsAssetsModule {}
