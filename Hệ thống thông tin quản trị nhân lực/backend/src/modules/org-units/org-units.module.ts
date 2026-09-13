import {
  Body, Controller, Delete, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class CreateOrgUnitDto {
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiProperty() @IsString() @MaxLength(40) code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}

class UpdateOrgUnitDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}

// ---------------------------------------------------------------------------
// Service — cây tổ chức là DỮ LIỆU cấu hình (nguyên lý cốt lõi của tài liệu)
// ---------------------------------------------------------------------------

interface TreeNode {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
  memberCount: number;
  totalMembers: number;
  level: number;
  levelLabel: string;
  children: TreeNode[];
}

@Injectable()
export class OrgUnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Trả về cây tổ chức dạng lồng nhau để frontend vẽ trực quan kèm cấp bậc và tổng số nhân sự đệ quy. */
  async tree(): Promise<TreeNode[]> {
    const units = await this.prisma.orgUnit.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { users: true } } },
    });
    const byId = new Map<string, TreeNode>();
    for (const u of units) {
      byId.set(u.id, {
        id: u.id,
        name: u.name,
        code: u.code,
        parentId: u.parentId,
        sortOrder: u.sortOrder,
        memberCount: u._count.users,
        totalMembers: u._count.users,
        level: 1,
        levelLabel: 'Cấp 1: Doanh nghiệp',
        children: [],
      });
    }
    const roots: TreeNode[] = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) byId.get(node.parentId)!.children.push(node);
      else roots.push(node);
    }

    const levelLabels = [
      '',
      'Cấp 1: Doanh nghiệp',
      'Cấp 2: Khối / Ban Điều hành',
      'Cấp 3: Phòng / Trung tâm',
      'Cấp 4: Tổ / Nhóm chuyên môn',
    ];

    function computeTotals(node: TreeNode, lvl: number): number {
      node.level = lvl;
      node.levelLabel = levelLabels[lvl] || `Cấp ${lvl}: Đơn vị trực thuộc`;
      let sum = node.memberCount;
      for (const child of node.children) {
        sum += computeTotals(child, lvl + 1);
      }
      node.totalMembers = sum;
      return sum;
    }

    for (const root of roots) {
      computeTotals(root, 1);
    }

    return roots;
  }

  /** Tạo đơn vị mới; tự tính đường dẫn materialized cho truy vấn con cháu. */
  async create(dto: CreateOrgUnitDto, actor: AuthUser, requestId?: string) {
    const exists = await this.prisma.orgUnit.findUnique({ where: { code: dto.code } });
    if (exists) throw new BusinessException(ErrorCodes.CONFLICT, 'Mã đơn vị đã tồn tại', HttpStatus.CONFLICT);

    let path = '/';
    if (dto.parentId) {
      const parent = await this.prisma.orgUnit.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Đơn vị cha không tồn tại');
      path = `${parent.path}${parent.id}/`;
    }
    const unit = await this.prisma.orgUnit.create({
      data: { name: dto.name, code: dto.code, parentId: dto.parentId, path, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log({ actorId: actor.id, action: 'ORG_UNIT_CREATED', entityType: 'OrgUnit', entityId: unit.id, after: { code: unit.code, name: unit.name }, requestId });
    return unit;
  }

  /** Đổi tên / di chuyển đơn vị; di chuyển phải tính lại path của cả cây con. */
  async update(id: string, dto: UpdateOrgUnitDto, actor: AuthUser, requestId?: string) {
    const unit = await this.prisma.orgUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Không tìm thấy đơn vị');

    let newPath = unit.path;
    if (dto.parentId !== undefined && dto.parentId !== unit.parentId) {
      if (dto.parentId === id) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Không thể chọn chính nó làm đơn vị cha');
      // Chặn di chuyển vào bên trong cây con của chính nó (tránh vòng lặp)
      if (dto.parentId && unit.path.includes(`/${dto.parentId}/`)) {
        throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Không thể di chuyển vào cây con của chính nó');
      }
      if (dto.parentId) {
        const parent = await this.prisma.orgUnit.findUnique({ where: { id: dto.parentId } });
        if (!parent) throw new NotFoundException('Đơn vị cha không tồn tại');
        newPath = `${parent.path}${parent.id}/`;
      } else {
        newPath = '/';
      }
    }

    await this.prisma.orgUnit.update({
      where: { id },
      data: { name: dto.name ?? unit.name, parentId: dto.parentId !== undefined ? dto.parentId : unit.parentId, path: newPath, sortOrder: dto.sortOrder ?? unit.sortOrder },
    });

    // Cập nhật đệ quy path cho toàn bộ cây con khi đơn vị bị di chuyển
    if (newPath !== unit.path) {
      const descendants = await this.prisma.orgUnit.findMany({ where: { path: { contains: `${unit.path}${id}/` } } });
      for (const d of descendants) {
        await this.prisma.orgUnit.update({
          where: { id: d.id },
          data: { path: d.path.replace(unit.path, newPath) },
        });
      }
    }

    await this.audit.log({ actorId: actor.id, action: 'ORG_UNIT_UPDATED', entityType: 'OrgUnit', entityId: id, requestId });
    return this.prisma.orgUnit.findUnique({ where: { id } });
  }

  /** Xóa đơn vị: chỉ cho phép khi không còn con, nhân viên hay Space gắn vào. */
  async remove(id: string, actor: AuthUser, requestId?: string) {
    const [children, users, spaces] = await Promise.all([
      this.prisma.orgUnit.count({ where: { parentId: id } }),
      this.prisma.user.count({ where: { orgUnitId: id, deletedAt: null } }),
      this.prisma.space.count({ where: { orgUnitId: id, deletedAt: null } }),
    ]);
    if (children > 0 || users > 0 || spaces > 0) {
      throw new BusinessException(
        ErrorCodes.CONFLICT,
        `Không thể xóa: còn ${children} đơn vị con, ${users} nhân viên, ${spaces} Space đang gắn vào`,
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.orgUnit.delete({ where: { id } });
    await this.audit.log({ actorId: actor.id, action: 'ORG_UNIT_DELETED', entityType: 'OrgUnit', entityId: id, requestId });
    return { success: true };
  }

  async findAll() {
    return this.prisma.orgUnit.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }
}

// ---------------------------------------------------------------------------
// Controller — xem cây: mọi người; ghi: chỉ ADMIN (KC03)
// ---------------------------------------------------------------------------

@ApiTags('org-units')
@ApiBearerAuth()
@Controller('org-units')
export class OrgUnitsController {
  constructor(private readonly service: OrgUnitsService) {}

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get('tree')
  tree() {
    return this.service.tree();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateOrgUnitDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrgUnitDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user);
  }
}

@Module({ controllers: [OrgUnitsController], providers: [OrgUnitsService] })
export class OrgUnitsModule {}
