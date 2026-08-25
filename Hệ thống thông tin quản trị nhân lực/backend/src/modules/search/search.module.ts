import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

class SearchQueryDto {
  @ApiPropertyOptional() @IsString() @MinLength(1, { message: 'Vui lòng nhập từ khóa' }) q!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() spaceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tag?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsInt() limit?: number = 10;
}

interface SearchRow {
  id: string; title: string; slug: string; summary: string | null;
  space_id: string; space_name: string; space_slug: string;
  author_name: string; published_at: Date | null;
  rank: number; sim: number;
}

/**
 * KC12 — Tìm kiếm toàn văn ("cần tìm thì tìm ra").
 * PostgreSQL FTS ('simple' tsvector + websearch_to_tsquery) kết hợp pg_trgm
 * similarity trên tiêu đề để bắt cả từ con/không dấu.
 * Phạm vi: CHỈ bài PUBLISHED trong Space người dùng được nhìn thấy — lọc bằng SQL.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
  ) {}

  async search(user: AuthUser, q: SearchQueryDto) {
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(30, Math.max(1, q.limit ?? 10));
    const offset = (page - 1) * limit;

    // Các mảnh điều kiện tùy chọn được ghép an toàn bằng Prisma.sql (chống SQL injection)
    const spaceFilter = q.spaceId ? Prisma.sql`AND s.id = ${q.spaceId}` : Prisma.empty;
    const tagFilter = q.tag
      ? Prisma.sql`AND EXISTS (SELECT 1 FROM article_tags at JOIN tags t ON t.id = at.tag_id
                              WHERE at.article_id = a.id AND t.slug = ${q.tag})`
      : Prisma.empty;

    // Cột do Prisma sinh giữ tên camelCase → phải bọc ngoặc kép trong SQL thô
    const rows = await this.prisma.$queryRaw<SearchRow[]>`
      SELECT a.id, a.title, a.slug, a."summary",
             s.id AS space_id, s."name" AS space_name, s.slug AS space_slug,
             u."fullName" AS author_name, a."publishedAt",
             ts_rank(to_tsvector('simple', coalesce(a.title,'') || ' ' || coalesce(a."summary",'') || ' ' || coalesce(v."contentMd",'')),
                     websearch_to_tsquery('simple', ${q.q})) AS rank,
             similarity(a.title, ${q.q}) AS sim
      FROM articles a
      JOIN spaces s ON s.id = a."spaceId" AND s."deletedAt" IS NULL
      JOIN users u ON u.id = a."authorId"
      LEFT JOIN article_versions v ON v.id = a."currentVersionId"
      WHERE a.status = 'PUBLISHED' AND a."deletedAt" IS NULL
        AND (${privileged} OR s.visibility = 'PUBLIC'
             OR EXISTS (SELECT 1 FROM space_members m WHERE m."spaceId" = s.id AND m."userId" = ${user.id}))
        ${spaceFilter}
        ${tagFilter}
        AND (to_tsvector('simple', coalesce(a.title,'') || ' ' || coalesce(a."summary",'') || ' ' || coalesce(v."contentMd",''))
             @@ websearch_to_tsquery('simple', ${q.q})
             OR similarity(a.title, ${q.q}) > 0.2)
      ORDER BY rank DESC, sim DESC, a."publishedAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        summary: r.summary,
        space: { id: r.space_id, name: r.space_name, slug: r.space_slug },
        authorName: r.author_name,
        publishedAt: r.published_at,
        score: Number(r.rank) + Number(r.sim),
      })),
      page,
      limit,
    };
  }
}

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query() q: SearchQueryDto) {
    return this.service.search(user, q);
  }
}

@Module({ controllers: [SearchController], providers: [SearchService] })
export class SearchModule {}
