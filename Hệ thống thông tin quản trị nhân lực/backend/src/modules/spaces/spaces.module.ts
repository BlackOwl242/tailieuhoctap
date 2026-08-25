import {
  Body, Controller, Delete, Get, HttpStatus, Injectable, Module,
  NotFoundException, Param, Patch, Post, Put, Query, Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser, AuthedRequest } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class ListSpacesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsInt() limit?: number = 50;
}

class CreateSpaceDto {
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiProperty({ enum: ['PUBLIC', 'RESTRICTED', 'PRIVATE'] })
  @IsIn(['PUBLIC', 'RESTRICTED', 'PRIVATE']) visibility!: 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
}

class UpdateSpaceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['PUBLIC', 'RESTRICTED', 'PRIVATE']) visibility?: 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
}

class AddMemberDto {
  @ApiProperty() @IsString() userId!: string;
  @ApiProperty({ enum: ['MANAGER', 'EDITOR', 'CONTRIBUTOR', 'VIEWER'] })
  @IsIn(['MANAGER', 'EDITOR', 'CONTRIBUTOR', 'VIEWER']) spaceRole!: 'MANAGER' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Chuyển tên Space thành slug URL an toàn; giữ ký tự tiếng Việt có dấu. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Service — quản lý Space và thành viên theo Space (KC05)
// ---------------------------------------------------------------------------

@Injectable()
export class SpacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
    private readonly audit: AuditService,
  ) {}

  /** Danh sách Space mà người dùng hiện tại được nhìn thấy (lọc ngay trong SQL). */
  async list(userId: string, q: ListSpacesQueryDto) {
    const roles = await this.access.globalRoles(userId);
    const privileged = this.access.isPrivileged(roles);
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 50));

    const where = {
      deletedAt: null,
      ...this.access.visibilityWhere(privileged, userId),
      ...(q.q ? { name: { contains: q.q, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.space.findMany({
        where,
        include: {
          _count: { select: { articles: { where: { status: 'PUBLISHED', deletedAt: null } }, members: true } },
          members: { where: { userId }, select: { spaceRole: true } },
          orgUnit: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.space.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id, slug: s.slug, name: s.name, description: s.description,
        icon: s.icon, color: s.color, visibility: s.visibility,
        orgUnit: s.orgUnit,
        publishedCount: s._count.articles,
        memberCount: s._count.members,
        myRole: s.members[0]?.spaceRole ?? null,
        createdAt: s.createdAt,
      })),
      total, page, limit,
    };
  }

  /** Tạo Space mới; người tạo tự động thành MANAGER của Space đó. */
  async create(dto: CreateSpaceDto, actor: AuthUser, requestId?: string) {
    let slug = slugify(dto.name) || 'space';
    // Đảm bảo slug duy nhất: thêm hậu số ngắn khi trùng
    if (await this.prisma.space.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const space = await this.prisma.$transaction(async (tx) => {
      const created = await tx.space.create({
        data: {
          slug, name: dto.name, description: dto.description, icon: dto.icon ?? 'book-open',
          color: dto.color ?? '#2563eb', visibility: dto.visibility,
          orgUnitId: dto.orgUnitId, parentId: dto.parentId, createdBy: actor.id,
        },
      });
      await tx.spaceMember.create({
        data: { spaceId: created.id, userId: actor.id, spaceRole: 'MANAGER' },
      });
      return created;
    });
    await this.audit.log({ actorId: actor.id, action: 'SPACE_CREATED', entityType: 'Space', entityId: space.id, after: { slug, visibility: dto.visibility }, requestId });
    return space;
  }

  /** Chi tiết Space + danh sách thành viên (chỉ người được đọc mới thấy). */
  async detail(slugOrId: string, user: AuthUser) {
    const space = await this.prisma.space.findFirst({
      where: { OR: [{ id: slugOrId }, { slug: slugOrId }], deletedAt: null },
      include: {
        members: { include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true, jobTitle: true } } } },
        orgUnit: { select: { id: true, name: true } },
        _count: { select: { articles: { where: { status: 'PUBLISHED', deletedAt: null } } } },
      },
    });
    if (!space) throw new NotFoundException('Không tìm thấy Space');

    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);
    const memberRole = await this.access.memberRole(space.id, user.id);
    if (!privileged && !memberRole && space.visibility === 'PRIVATE') {
      // PRIVATE: không phải thành viên thì "không tồn tại" trên hệ thống
      throw new NotFoundException('Không tìm thấy Space');
    }
    const following = !!(await this.prisma.spaceFollow.findUnique({
      where: { userId_spaceId: { userId: user.id, spaceId: space.id } },
    }));

    return {
      id: space.id, slug: space.slug, name: space.name, description: space.description,
      icon: space.icon, color: space.color, visibility: space.visibility, orgUnit: space.orgUnit,
      publishedCount: space._count.articles, myRole: memberRole, isPrivileged: privileged,
      following,
      canManage: privileged || memberRole === 'MANAGER',
      members: space.members.map((m) => ({ ...m.user, spaceRole: m.spaceRole, joinedAt: m.createdAt })),
    };
  }

  /** Cập nhật thông tin Space — yêu cầu MANAGER của Space hoặc vai toàn cục. */
  async update(id: string, dto: UpdateSpaceDto, actor: AuthUser, requestId?: string) {
    await this.access.assertSpaceAccess(id, actor, 'MANAGER');
    const space = await this.prisma.space.update({ where: { id }, data: dto });
    await this.audit.log({ actorId: actor.id, action: 'SPACE_UPDATED', entityType: 'Space', entityId: id, after: dto, requestId });
    return space;
  }

  /** Xóa mềm Space — chỉ KM_MANAGER/ADMIN (theo ma trận quyền phụ lục A). */
  async remove(id: string, actor: AuthUser, requestId?: string) {
    const roles = await this.access.globalRoles(actor.id);
    if (!roles.includes('ADMIN') && !roles.includes('KM_MANAGER')) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Chỉ Quản trị viên được xóa Space', HttpStatus.FORBIDDEN);
    }
    await this.prisma.space.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ actorId: actor.id, action: 'SPACE_DELETED', entityType: 'Space', entityId: id, requestId });
    return { success: true };
  }

  /** Thêm thành viên vào Space với vai cụ thể. */
  async addMember(spaceId: string, dto: AddMemberDto, actor: AuthUser, requestId?: string) {
    await this.access.assertSpaceAccess(spaceId, actor, 'MANAGER');
    const target = await this.prisma.user.findFirst({ where: { id: dto.userId, deletedAt: null } });
    if (!target) throw new NotFoundException('Không tìm thấy người dùng');
    await this.prisma.spaceMember.upsert({
      where: { spaceId_userId: { spaceId, userId: dto.userId } },
      create: { spaceId, userId: dto.userId, spaceRole: dto.spaceRole },
      update: { spaceRole: dto.spaceRole },
    });
    await this.audit.log({ actorId: actor.id, action: 'SPACE_MEMBER_ADDED', entityType: 'Space', entityId: spaceId, after: dto, requestId });
    return { success: true };
  }

  /** Xóa thành viên khỏi Space. */
  async removeMember(spaceId: string, memberId: string, actor: AuthUser, requestId?: string) {
    await this.access.assertSpaceAccess(spaceId, actor, 'MANAGER');
    await this.prisma.spaceMember.deleteMany({ where: { spaceId, userId: memberId } });
    await this.audit.log({ actorId: actor.id, action: 'SPACE_MEMBER_REMOVED', entityType: 'Space', entityId: spaceId, after: { memberId }, requestId });
    return { success: true };
  }

  /** Bật/tắt theo dõi Space — nguồn phát thông báo "bài viết mới". */
  async toggleFollow(spaceId: string, user: AuthUser) {
    await this.access.assertSpaceAccess(spaceId, user);
    const key = { userId_spaceId: { userId: user.id, spaceId } };
    const existing = await this.prisma.spaceFollow.findUnique({ where: key });
    if (existing) {
      await this.prisma.spaceFollow.delete({ where: key });
      return { following: false };
    }
    await this.prisma.spaceFollow.create({ data: { userId: user.id, spaceId } });
    return { following: true };
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('spaces')
@ApiBearerAuth()
@Controller('spaces')
export class SpacesController {
  constructor(private readonly service: SpacesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ListSpacesQueryDto) {
    return this.service.list(user.id, q);
  }

  @Roles('KM_MANAGER', 'ADMIN')
  @Post()
  create(@Body() dto: CreateSpaceDto, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.create(dto, user, req.requestId);
  }

  @Get(':idOrSlug')
  detail(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user: AuthUser) {
    return this.service.detail(idOrSlug, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSpaceDto, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.update(id, dto, user, req.requestId);
  }

  @Roles('KM_MANAGER', 'ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.remove(id, user, req.requestId);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.addMember(id, dto, user, req.requestId);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.removeMember(id, userId, user, req.requestId);
  }

  @Put(':id/follow')
  follow(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.toggleFollow(id, user);
  }
}

@Module({ controllers: [SpacesController], providers: [SpacesService] })
export class SpacesModule {}
