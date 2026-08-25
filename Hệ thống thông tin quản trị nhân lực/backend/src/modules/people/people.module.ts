import { Controller, Get, Injectable, Module, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

class PeopleQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsInt() limit?: number = 24;
}

/**
 * KC18 — Danh bạ chuyên môn ("ai biết gì"): hồ sơ tối giản + số bài viết
 * đã xuất bản, giúp định vị chuyên gia trước khi hỏi ngoài giờ.
 */
@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
  ) {}

  async directory(user: AuthUser, q: PeopleQueryDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(60, Math.max(1, q.limit ?? 24));
    const where = {
      deletedAt: null,
      status: 'ACTIVE' as const,
      ...(q.orgUnitId ? { orgUnitId: q.orgUnitId } : {}),
      ...(q.q
        ? {
            OR: [
              { fullName: { contains: q.q, mode: 'insensitive' as const } },
              { jobTitle: { contains: q.q, mode: 'insensitive' as const } },
              { expertise: { has: q.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, avatarUrl: true,
          jobTitle: true, expertise: true, bio: true,
          orgUnit: { select: { id: true, name: true } },
          _count: { select: { authoredArticles: { where: { status: 'PUBLISHED', deletedAt: null } } } },
        },
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    void user;
    return {
      items: items.map((u) => ({ ...u, publishedCount: u._count.authoredArticles, _count: undefined })),
      total, page, limit,
    };
  }

  /** Hồ sơ chi tiết + các bài viết PUBLISHED gần đây trong phạm vi được phép xem. */
  async profile(profileId: string, viewer: AuthUser) {
    const person = await this.prisma.user.findFirst({
      where: { id: profileId, deletedAt: null },
      select: {
        id: true, fullName: true, email: true, avatarUrl: true, jobTitle: true,
        expertise: true, bio: true, lastLoginAt: true,
        orgUnit: { select: { id: true, name: true } },
      },
    });
    if (!person) throw new NotFoundException('Không tìm thấy người dùng');

    const roles = await this.access.globalRoles(viewer.id);
    const privileged = this.access.isPrivileged(roles);
    const articles = await this.prisma.article.findMany({
      where: {
        authorId: profileId,
        status: 'PUBLISHED',
        deletedAt: null,
        // Lọc phạm vi Space ngay trong SQL (điều kiện visibility/membership)
        space: this.access.visibilityWhere(privileged, viewer.id),
      },
      select: { id: true, title: true, slug: true, publishedAt: true, viewCount: true, helpfulCount: true },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });
    return { ...person, isMe: profileId === viewer.id, articles };
  }
}

@ApiTags('people')
@ApiBearerAuth()
@Controller('people')
export class PeopleController {
  constructor(private readonly service: PeopleService) {}

  @Get()
  directory(@CurrentUser() user: AuthUser, @Query() q: PeopleQueryDto) {
    return this.service.directory(user, q);
  }

  @Get(':id')
  profile(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.profile(id, user);
  }
}

@Module({ controllers: [PeopleController], providers: [PeopleService] })
export class PeopleModule {}
