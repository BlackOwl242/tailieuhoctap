import {
  Body, Controller, Delete, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../../common/services/notifications.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { CurrentUser } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class CreateCommentDto {
  @ApiProperty() @IsString() @MinLength(1, { message: 'Nội dung bình luận không được để trống' }) @MaxLength(2000) body!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isQuestion?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
}

class UpdateCommentDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) body!: string;
}

// ---------------------------------------------------------------------------
// Service — hỏi đáp / bình luận hai cấp trên bài viết (KC15)
// ---------------------------------------------------------------------------

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Danh sách bình luận phẳng (frontend tự dựng cây theo parentId). */
  async list(articleId: string, _user: AuthUser) {
    const rows = await this.prisma.comment.findMany({
      where: { articleId, deletedAt: null },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true, jobTitle: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((c) => ({
      id: c.id, parentId: c.parentId, body: c.body, isQuestion: c.isQuestion,
      resolvedAt: c.resolvedAt, createdAt: c.createdAt,
      author: c.author, mine: c.authorId === _user.id,
    }));
  }

  /** Tạo bình luận; nếu là câu hỏi thì báo cho tác giả bài viết trả lời. */
  async create(articleId: string, dto: CreateCommentDto, user: AuthUser) {
    const article = await this.loadArticle(articleId);
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({ where: { id: dto.parentId, articleId, deletedAt: null } });
      if (!parent) throw new NotFoundException('Bình luận cha không tồn tại');
    }
    const comment = await this.prisma.comment.create({
      data: {
        articleId, authorId: user.id, body: dto.body,
        isQuestion: dto.isQuestion ?? false, parentId: dto.parentId,
      },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    // Thông báo: tác giả bài + người được trả lời (trừ chính mình)
    const targets = [article.authorId];
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (parent) targets.push(parent.authorId);
    }
    await this.notifications.notify({
      userIds: targets.filter((t) => t !== user.id),
      type: 'COMMENT_ADDED',
      title: `${user.fullName} đã bình luận trong "${article.title}"`,
      linkPath: `/articles/${articleId}`,
    });
    return comment;
  }

  /** Sửa bình luận — chỉ tác giả của bình luận. */
  async update(commentId: string, dto: UpdateCommentDto, user: AuthUser) {
    const comment = await this.loadComment(commentId);
    if (comment.authorId !== user.id) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Chỉ tác giả bình luận mới được sửa', HttpStatus.FORBIDDEN);
    }
    return this.prisma.comment.update({ where: { id: commentId }, data: { body: dto.body } });
  }

  /** Đánh dấu câu hỏi đã được giải đáp — tác giả bài hoặc quản lý Space. */
  async resolve(commentId: string, user: AuthUser) {
    const comment = await this.loadComment(commentId);
    const article = await this.loadArticle(comment.articleId);
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);
    const memberRole = await this.access.memberRole(article.spaceId, user.id);
    const allowed = privileged || article.authorId === user.id || this.access.rank(memberRole) >= this.access.rank('MANAGER');
    if (!allowed) throw new BusinessException(ErrorCodes.FORBIDDEN, 'Không có quyền đánh dấu giải đáp', HttpStatus.FORBIDDEN);

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { resolvedAt: comment.resolvedAt ? null : new Date() }, // bật/tắt trạng thái
    });
  }

  /** Xóa mềm bình luận — tác giả hoặc quản lý Space trở lên. */
  async remove(commentId: string, user: AuthUser) {
    const comment = await this.loadComment(commentId);
    const article = await this.loadArticle(comment.articleId);
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);
    const memberRole = await this.access.memberRole(article.spaceId, user.id);
    const allowed = privileged || comment.authorId === user.id || this.access.rank(memberRole) >= this.access.rank('MANAGER');
    if (!allowed) throw new BusinessException(ErrorCodes.FORBIDDEN, 'Không có quyền xóa bình luận', HttpStatus.FORBIDDEN);

    await this.prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  private loadComment(id: string) {
    return this.prisma.comment.findFirst({ where: { id, deletedAt: null } })
      .then((c) => { if (!c) throw new NotFoundException('Không tìm thấy bình luận'); return c; });
  }

  private loadArticle(id: string) {
    return this.prisma.article.findFirst({ where: { OR: [{ id }, { slug: id }], deletedAt: null } })
      .then((a) => { if (!a) throw new NotFoundException('Không tìm thấy bài viết'); return a; });
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Get('articles/:articleId/comments')
  list(@Param('articleId') articleId: string, @CurrentUser() user: AuthUser) {
    return this.service.list(articleId, user);
  }

  @Post('articles/:articleId/comments')
  create(@Param('articleId') articleId: string, @Body() dto: CreateCommentDto, @CurrentUser() user: AuthUser) {
    return this.service.create(articleId, dto, user);
  }

  @Patch('comments/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Post('comments/:id/resolve')
  resolve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.resolve(id, user);
  }

  @Delete('comments/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user);
  }
}

@Module({ controllers: [CommentsController], providers: [CommentsService] })
export class CommentsModule {}
