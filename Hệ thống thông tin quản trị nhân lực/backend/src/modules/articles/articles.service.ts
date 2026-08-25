import { HttpStatus, Injectable } from '@nestjs/common';
import { ArticleStatus, Prisma, ReviewAction, SpaceRole } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { NotificationsService } from '../../common/services/notifications.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// Loại tệp cho phép đính kèm (whitelist theo thiết kế — mục NFR bảo mật)
const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'md', 'txt', 'docx', 'xlsx', 'pptx']);

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------------------------------ create
  /** Tạo bài viết mới ở trạng thái DRAFT kèm phiên bản nội dung số 1. */
  async create(spaceId: string, dto: { title: string; summary?: string; contentMd: string; changeNote?: string; categoryId?: string; tagIds?: string[] }, user: AuthUser, requestId?: string) {
    await this.access.assertSpaceAccess(spaceId, user, 'CONTRIBUTOR');

    const slug = await this.uniqueSlug(spaceId, dto.title);
    const article = await this.prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          spaceId,
          authorId: user.id,
          title: dto.title,
          slug,
          summary: dto.summary,
          categoryId: dto.categoryId,
          status: 'DRAFT',
          tags: { create: (dto.tagIds ?? []).map((tagId) => ({ tagId })) },
        },
      });
      const version = await tx.articleVersion.create({
        data: { articleId: created.id, versionNo: 1, title: dto.title, contentMd: dto.contentMd, changeNote: dto.changeNote ?? 'Tạo ban đầu', authorId: user.id },
      });
      return tx.article.update({ where: { id: created.id }, data: { currentVersionId: version.id } });
    });

    await this.audit.log({ actorId: user.id, action: 'ARTICLE_CREATED', entityType: 'Article', entityId: article.id, after: { title: dto.title }, requestId });
    return this.getDetail(article.id, user);
  }

  // -------------------------------------------------------------------- list
  /** Danh sách bài viết trong Space; người thường chỉ thấy ĐÃ XUẤT BẢN + bài của mình. */
  async listInSpace(spaceId: string, user: AuthUser, q: { status?: string; page?: number; limit?: number }) {
    const { memberRole, privileged } = await this.access.assertSpaceAccess(spaceId, user);
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(50, Math.max(1, q.limit ?? 10));

    const canSeeAllDrafts = privileged || this.access.rank(memberRole) >= this.access.rank('EDITOR');
    const statusWhere = q.status ? { status: q.status as ArticleStatus } : {};
    const visibilityWhere = canSeeAllDrafts
      ? {}
      : { OR: [{ status: 'PUBLISHED' as const }, { authorId: user.id }] };

    const where: Prisma.ArticleWhereInput = { spaceId, deletedAt: null, ...statusWhere, ...visibilityWhere };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          currentVersion: { select: { id: true, versionNo: true, createdAt: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);
    return { items: items.map((a) => this.toListItem(a)), total, page, limit };
  }

  /** Hộp phê duyệt cá nhân: các bài đang chờ trong Space mình quản lý (KC11). */
  async pendingForMe(user: AuthUser, rawPage?: number, rawLimit?: number) {
    // Ép số an toàn vì tham số đến từ query string (có thể là chuỗi/undefined)
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.min(50, Math.max(1, Number(rawLimit) || 20));
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);

    const managedSpaces = await this.prisma.spaceMember.findMany({
      where: { userId: user.id, spaceRole: 'MANAGER' },
      select: { spaceId: true },
    });
    const where: Prisma.ArticleWhereInput = {
      status: 'PENDING_REVIEW',
      deletedAt: null,
      ...(privileged ? {} : { spaceId: { in: managedSpaces.map((m) => m.spaceId) } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: {
          space: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          reviews: { where: { action: 'SUBMIT' }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'asc' }, // bài chờ lâu nhất lên đầu — chống nghẽn hộp duyệt
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);
    return {
      items: items.map((a) => ({
        id: a.id, title: a.title, summary: a.summary, space: a.space, author: a.author,
        submittedAt: a.reviews[0]?.createdAt ?? a.updatedAt, reviewDueAt: a.reviewDueAt,
      })),
      total, page, limit,
    };
  }

  // ------------------------------------------------------------------ detail
  /** Chi tiết bài viết + quyền hạn hiệu lực của người xem tại thời điểm gọi. */
  async getDetail(idOrSlug: string, user: AuthUser) {
    const article = await this.prisma.article.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
      include: {
        space: { select: { id: true, name: true, slug: true, visibility: true } },
        author: { select: { id: true, fullName: true, avatarUrl: true, jobTitle: true } },
        currentVersion: true,
        versions: { select: { id: true, versionNo: true, changeNote: true, authorId: true, createdAt: true }, orderBy: { versionNo: 'desc' } },
        tags: { include: { tag: true } },
        category: true,
        reviews: { include: { reviewer: { select: { id: true, fullName: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
        _count: { select: { comments: { where: { deletedAt: null } }, reactions: true } },
      },
    });
    if (!article) throw new BusinessException(ErrorCodes.NOT_FOUND, 'Không tìm thấy bài viết', HttpStatus.NOT_FOUND);

    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);
    const memberRole = await this.access.memberRole(article.spaceId, user.id);

    // Kiểm soát truy cập: PUBLIC ai cũng đọc được bài đã xuất bản;
    // RESTRICTED/PRIVATE cần thành viên; bản nháp chỉ tác giả/EDITOR trở lên.
    const isPublished = article.status === 'PUBLISHED';
    const publicReadable = article.space.visibility === 'PUBLIC' && isPublished;
    if (!privileged && !memberRole && !publicReadable) {
      throw new BusinessException(ErrorCodes.SPACE_FORBIDDEN, 'Bạn không có quyền đọc bài viết này', HttpStatus.FORBIDDEN);
    }
    const editorPlus = privileged || this.access.rank(memberRole) >= this.access.rank('EDITOR');
    if (!isPublished && !privileged && article.authorId !== user.id && this.access.rank(memberRole) < this.access.rank('EDITOR')) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Bài viết chưa được xuất bản', HttpStatus.FORBIDDEN);
    }

    // Tệp đính kèm: truy vấn qua phiên bản vì FK nằm ở article_versions
    const files = await this.prisma.attachment.findMany({
      where: { version: { articleId: article.id } },
      orderBy: { createdAt: 'desc' },
    });
    const [myReaction, myBookmark] = await Promise.all([
      this.prisma.reaction.findUnique({ where: { articleId_userId: { articleId: article.id, userId: user.id } } }),
      this.prisma.bookmark.findUnique({ where: { userId_articleId: { userId: user.id, articleId: article.id } } }),
    ]);

    return {
      id: article.id,
      space: article.space,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      status: article.status,
      author: article.author,
      category: article.category,
      tags: article.tags.map((t) => t.tag),
      contentMd: article.currentVersion?.contentMd ?? '',
      versionNo: article.currentVersion?.versionNo ?? 0,
      versions: article.versions,
      timeline: article.reviews.map((r) => ({ action: r.action, comment: r.comment, at: r.createdAt, reviewer: r.reviewer })),
      // Tệp đính kèm gắn với các phiên bản của bài viết (không phải trực tiếp bài viết)
      attachments: files.map((f) => ({ id: f.id, fileName: f.fileName, url: `/uploads/${f.storageKey}`, sizeBytes: f.sizeBytes })),
      publishedAt: article.publishedAt,
      archivedAt: article.archivedAt,
      reviewDueAt: article.reviewDueAt,
      viewCount: article.viewCount,
      helpfulCount: article._count.reactions,
      commentCount: article._count.comments,
      myReaction: !!myReaction,
      myBookmark: !!myBookmark,
      permissions: {
        canEdit: privileged || article.authorId === user.id || editorPlus,
        canSubmit: privileged || article.authorId === user.id || editorPlus,
        canReview: privileged || this.access.rank(memberRole) >= this.access.rank('MANAGER'),
        canArchive: privileged || this.access.rank(memberRole) >= this.access.rank('MANAGER'),
      },
    };
  }

  // ------------------------------------------------------------------ update
  /**
   * Sửa bài viết = tạo PHIÊN BẢN MỚI (bản cũ bất biến — insight #12 của tài liệu).
   * Bài đã xuất bản vẫn giữ trạng thái PUBLISHED sau khi sửa.
   */
  async update(id: string, dto: { title?: string; summary?: string; contentMd?: string; changeNote?: string; categoryId?: string; tagIds?: string[] }, user: AuthUser, requestId?: string) {
    const article = await this.loadArticle(id);
    await this.assertCanEdit(article, user);
    if (article.status === 'ARCHIVED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Bài viết đã lưu trữ — hãy khôi phục trước khi sửa', HttpStatus.CONFLICT);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const last = await tx.articleVersion.aggregate({ where: { articleId: id }, _max: { versionNo: true } });
      const version = await tx.articleVersion.create({
        data: {
          articleId: id,
          versionNo: (last._max.versionNo ?? 0) + 1,
          title: dto.title ?? article.title,
          contentMd: dto.contentMd ?? article.currentVersion?.contentMd ?? '',
          changeNote: dto.changeNote ?? 'Cập nhật nội dung',
          authorId: user.id,
        },
      });
      return tx.article.update({
        where: { id },
        data: {
          title: dto.title ?? article.title,
          summary: dto.summary !== undefined ? dto.summary : article.summary,
          categoryId: dto.categoryId !== undefined ? dto.categoryId : article.categoryId,
          currentVersionId: version.id,
          ...(dto.tagIds ? { tags: { deleteMany: {}, create: dto.tagIds.map((tagId) => ({ tagId })) } } : {}),
        },
      });
    });
    await this.audit.log({ actorId: user.id, action: 'ARTICLE_UPDATED', entityType: 'Article', entityId: id, after: { versionNote: dto.changeNote }, requestId });
    void updated;
    return this.getDetail(id, user);
  }

  /** Lịch sử phiên bản — chỉ đọc, bất biến. */
  async versions(id: string, user: AuthUser) {
    const article = await this.loadArticle(id);
    await this.assertCanRead(article, user);
    return this.prisma.articleVersion.findMany({
      where: { articleId: article.id },
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { versionNo: 'desc' },
    });
  }

  /** Khôi phục nội dung một phiên bản cũ = tạo phiên bản mới sao chép nội dung đó. */
  async restoreVersion(id: string, versionNo: number, user: AuthUser, requestId?: string) {
    const article = await this.loadArticle(id);
    await this.assertCanEdit(article, user);
    const source = await this.prisma.articleVersion.findUnique({
      where: { articleId_versionNo: { articleId: article.id, versionNo } },
    });
    if (!source) throw new BusinessException(ErrorCodes.NOT_FOUND, 'Không tìm thấy phiên bản', HttpStatus.NOT_FOUND);

    await this.prisma.$transaction(async (tx) => {
      const last = await tx.articleVersion.aggregate({ where: { articleId: article.id }, _max: { versionNo: true } });
      const version = await tx.articleVersion.create({
        data: {
          articleId: article.id,
          versionNo: (last._max.versionNo ?? 0) + 1,
          title: source.title,
          contentMd: source.contentMd,
          changeNote: `Khôi phục từ phiên bản ${versionNo}`,
          authorId: user.id,
        },
      });
      await tx.article.update({ where: { id: article.id }, data: { title: source.title, currentVersionId: version.id } });
    });
    await this.audit.log({ actorId: user.id, action: 'ARTICLE_VERSION_RESTORED', entityType: 'Article', entityId: article.id, after: { restoredFrom: versionNo }, requestId });
    return this.getDetail(article.id, user);
  }

  // ---------------------------------------------------------------- workflow
  /** Trình duyệt bản thảo: DRAFT → PENDING_REVIEW (luồng ba tầng của tổ chức). */
  async submit(id: string, user: AuthUser, requestId?: string) {
    const article = await this.loadArticle(id);
    await this.assertCanEdit(article, user);
    if (article.status !== 'DRAFT') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, `Chỉ bài nháp mới có thể trình duyệt (trạng thái hiện tại: ${article.status})`, HttpStatus.CONFLICT);
    }
    await this.prisma.$transaction([
      this.prisma.article.update({ where: { id }, data: { status: 'PENDING_REVIEW', reviewDueAt: new Date(Date.now() + 7 * 86_400_000) } }),
      this.prisma.articleReview.create({ data: { articleId: id, reviewerId: user.id, action: 'SUBMIT' } }),
    ]);

    // Thông báo tới: quản lý Space + toàn bộ KM_MANAGER (hộp phê duyệt)
    const [managers, kms] = await Promise.all([
      this.prisma.spaceMember.findMany({ where: { spaceId: article.spaceId, spaceRole: 'MANAGER' }, select: { userId: true } }),
      this.prisma.userRole.findMany({ where: { roleCode: 'KM_MANAGER' }, select: { userId: true } }),
    ]);
    await this.notifications.notify({
      userIds: [...managers.map((m) => m.userId), ...kms.map((k) => k.userId)].filter((uid) => uid !== user.id),
      type: 'REVIEW_REQUESTED',
      title: 'Có bản thảo chờ bạn duyệt',
      body: article.title,
      linkPath: `/review`,
    });
    await this.audit.log({ actorId: user.id, action: 'ARTICLE_SUBMITTED', entityType: 'Article', entityId: id, requestId });
    return this.getDetail(id, user);
  }

  /** Thẩm định: duyệt / yêu cầu chỉnh sửa / từ chối — ghi vết từng bước (KC10). */
  async review(id: string, dto: { action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'; comment?: string }, user: AuthUser, requestId?: string) {
    const article = await this.loadArticle(id);
    const { memberRole, privileged } = await this.access.assertSpaceAccess(article.spaceId, user, 'MANAGER');
    void memberRole; void privileged;

    if (article.status !== 'PENDING_REVIEW') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Bài viết không ở trạng thái chờ duyệt', HttpStatus.CONFLICT);
    }
    if (dto.action === 'REQUEST_CHANGES' && !dto.comment) {
      throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Vui lòng nêu ý kiến khi yêu cầu chỉnh sửa');
    }

    const patch =
      dto.action === 'APPROVE' ? { status: 'PUBLISHED' as const, publishedAt: new Date(), archivedAt: null }
      : dto.action === 'REQUEST_CHANGES' ? { status: 'DRAFT' as const, reviewDueAt: null }
      : { status: 'ARCHIVED' as const, archivedAt: new Date(), reviewDueAt: null };

    await this.prisma.$transaction([
      this.prisma.article.update({ where: { id }, data: patch }),
      this.prisma.articleReview.create({
        data: { articleId: id, reviewerId: user.id, action: dto.action as ReviewAction, comment: dto.comment },
      }),
    ]);

    const label = dto.action === 'APPROVE' ? 'đã được duyệt và xuất bản' : dto.action === 'REQUEST_CHANGES' ? 'cần chỉnh sửa thêm' : 'bị từ chối';
    await this.notifications.notify({
      userIds: [article.authorId],
      type: 'REVIEW_RESULT',
      title: `Bài "${article.title}" ${label}`,
      body: dto.comment,
      linkPath: `/articles/${id}`,
    });
    await this.audit.log({ actorId: user.id, action: `ARTICLE_${dto.action}`, entityType: 'Article', entityId: id, after: { comment: dto.comment }, requestId });

    // Xuất bản thành công → báo cho người theo dõi Space
    if (dto.action === 'APPROVE') {
      const followers = await this.prisma.spaceFollow.findMany({ where: { spaceId: article.spaceId }, select: { userId: true } });
      await this.notifications.notify({
        userIds: followers.map((f) => f.userId),
        type: 'ARTICLE_PUBLISHED',
        title: `Bài mới trong Space: ${article.title}`,
        linkPath: `/articles/${id}`,
      });
    }
    return this.getDetail(id, user);
  }

  /** Lưu trữ / khôi phục bài viết (MANAGER Space trở lên). */
  async setArchived(id: string, archived: boolean, user: AuthUser, requestId?: string) {
    const article = await this.loadArticle(id);
    await this.access.assertSpaceAccess(article.spaceId, user, 'MANAGER');
    if (archived && article.status !== 'PUBLISHED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Chỉ bài đã xuất bản mới thể lưu trữ', HttpStatus.CONFLICT);
    }
    if (!archived && article.status !== 'ARCHIVED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Bài viết không ở trạng thái lưu trữ', HttpStatus.CONFLICT);
    }
    await this.prisma.article.update({
      where: { id },
      data: archived ? { status: 'ARCHIVED', archivedAt: new Date() } : { status: 'PUBLISHED', archivedAt: null },
    });
    await this.audit.log({ actorId: user.id, action: archived ? 'ARTICLE_ARCHIVED' : 'ARTICLE_RESTORED', entityType: 'Article', entityId: id, requestId });
    return this.getDetail(id, user);
  }

  // ------------------------------------------------------------- interaction
  /** Bật/tắt đánh giá "hữu ích" và đồng bộ bộ đếm nhanh trên bài viết. */
  async toggleReaction(id: string, user: AuthUser) {
    const key = { articleId_userId: { articleId: id, userId: user.id } };
    const existing = await this.prisma.reaction.findUnique({ where: key });
    if (existing) await this.prisma.reaction.delete({ where: key });
    else await this.prisma.reaction.create({ data: { articleId: id, userId: user.id } });
    const helpfulCount = await this.prisma.reaction.count({ where: { articleId: id } });
    await this.prisma.article.update({ where: { id }, data: { helpfulCount } });
    return { reacted: !existing, helpfulCount };
  }

  /** Ghi nhận lượt xem (thô + bộ đếm) — dùng cho dashboard "xem nhiều nhất". */
  async trackView(id: string, userId?: string) {
    try {
      await this.prisma.$transaction([
        this.prisma.articleView.create({ data: { articleId: id, userId: userId ?? null } }),
        this.prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
      ]);
    } catch {
      // Đếm lượt xem là best-effort, không để ảnh hưởng trải nghiệm đọc
    }
    return { success: true };
  }

  async toggleBookmark(id: string, user: AuthUser) {
    const key = { userId_articleId: { userId: user.id, articleId: id } };
    const existing = await this.prisma.bookmark.findUnique({ where: key });
    if (existing) {
      await this.prisma.bookmark.delete({ where: key });
      return { bookmarked: false };
    }
    await this.prisma.bookmark.create({ data: { userId: user.id, articleId: id } });
    return { bookmarked: true };
  }

  // ------------------------------------------------------------- attachments
  /** Lưu tệp đính kèm vào ổ đĩa (tên ngẫu nhiên) + ghi bản ghi CSDL. */
  async saveAttachment(articleId: string, file: { originalname: string; filename: string; mimetype: string; size: number }, user: AuthUser, requestId?: string) {
    const article = await this.loadArticle(articleId);
    await this.assertCanEdit(article, user);

    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      // Dọn dẹp tệp không hợp lệ ngay lập tức
      fs.unlink(path.join(process.env.UPLOAD_DIR || '/app/uploads', file.filename), () => undefined);
      throw new BusinessException(ErrorCodes.FILE_TYPE_NOT_ALLOWED, `Định dạng .${ext} không được phép`, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }
    const attachment = await this.prisma.attachment.create({
      data: {
        articleVersionId: article.currentVersionId,
        uploaderId: user.id,
        fileName: file.originalname,
        storageKey: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
    await this.audit.log({ actorId: user.id, action: 'ATTACHMENT_ADDED', entityType: 'Article', entityId: articleId, after: { fileName: file.originalname }, requestId });
    return { id: attachment.id, fileName: attachment.fileName, url: `/uploads/${attachment.storageKey}`, sizeBytes: attachment.sizeBytes };
  }

  // ------------------------------------------------------------------ helpers
  private loadArticle(idOrSlug: string) {
    return this.prisma.article.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
      include: { currentVersion: { select: { contentMd: true } } },
    }).then((a) => {
      if (!a) throw new BusinessException(ErrorCodes.NOT_FOUND, 'Không tìm thấy bài viết', HttpStatus.NOT_FOUND);
      return a;
    });
  }

  private async assertCanRead(article: { spaceId: string; status: ArticleStatus; authorId: string; space?: { visibility: string } }, user: AuthUser) {
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);
    const memberRole = await this.access.memberRole(article.spaceId, user.id);
    if (privileged || memberRole) return { privileged, memberRole };
    if (article.status === 'PUBLISHED') return { privileged, memberRole }; // Space PUBLIC cho đọc bài đã xuất bản
    throw new BusinessException(ErrorCodes.FORBIDDEN, 'Bạn không có quyền xem bài viết này', HttpStatus.FORBIDDEN);
  }

  private async assertCanEdit(article: { id: string; spaceId: string; authorId: string; status: ArticleStatus }, user: AuthUser) {
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);
    if (privileged || article.authorId === user.id) return;
    const memberRole = await this.access.memberRole(article.spaceId, user.id);
    if (this.access.rank(memberRole) >= this.access.rank(SpaceRole.EDITOR)) return;
    throw new BusinessException(ErrorCodes.FORBIDDEN, 'Bạn không có quyền sửa bài viết này', HttpStatus.FORBIDDEN);
  }

  private toListItem(a: {
    id: string; title: string; slug: string; summary: string | null; status: ArticleStatus;
    publishedAt: Date | null; updatedAt: Date; viewCount: number; helpfulCount: number;
    author: { id: string; fullName: string; avatarUrl: string | null };
    currentVersion: { versionNo: number } | null;
    _count: { comments: number; reactions: number };
  }) {
    return {
      id: a.id, title: a.title, slug: a.slug, summary: a.summary, status: a.status,
      author: a.author, versionNo: a.currentVersion?.versionNo ?? 0,
      publishedAt: a.publishedAt, updatedAt: a.updatedAt,
      viewCount: a.viewCount, helpfulCount: a.helpfulCount,
      commentCount: a._count.comments,
    };
  }

  /** Sinh slug duy nhất trong phạm vi Space (kiểm tra rồi thêm hậu tố khi trùng). */
  private async uniqueSlug(spaceId: string, title: string): Promise<string> {
    const base = title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'bai-viet';
    let slug = base;
    while (await this.prisma.article.findFirst({ where: { spaceId, slug } })) {
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return slug;
  }
}

// UUID dùng làm tên tệp lưu trữ (tránh path traversal + tên trùng)
export function randomStorageName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return `${randomUUID()}${ext}`;
}
