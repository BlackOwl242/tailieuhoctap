import { Controller, Get, HttpCode, HttpStatus, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

class ListNotificationsQuery {
  @IsOptional() @IsInt() page?: number = 1;
  @IsOptional() @IsInt() limit?: number = 20;
  @IsOptional() unread?: string; // "1" → chỉ lấy chưa đọc
}

/**
 * KC17 — Thông báo in-app: danh sách, đánh dấu đã đọc một mục hoặc tất cả.
 * Việc TẠO thông báo nằm ở NotificationsService (global), module này chỉ đọc.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() q: ListNotificationsQuery) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(50, Math.max(1, q.limit ?? 20));
    const where = { userId: user.id, ...(q.unread === '1' ? { readAt: null } : {}) };
    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);
    return { items, total, unreadCount, page, limit };
  }

  @Patch(':id/read')
  async readOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    // Chỉ cho phép đánh dấu thông báo CỦA CHÍNH MÌNH
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async readAll(@CurrentUser() user: AuthUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}

@Module({ controllers: [NotificationsController] })
export class NotificationsModule {}
