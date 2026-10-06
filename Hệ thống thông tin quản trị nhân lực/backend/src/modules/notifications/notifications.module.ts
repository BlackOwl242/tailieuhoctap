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

  /** Trả về số việc còn chờ mà tài khoản này có quyền xử lý; không trả dữ liệu hồ sơ nhạy cảm. */
  @Get('action-items')
  async actionItems(@CurrentUser() user: AuthUser) {
    const roles = new Set(user.roles ?? []);
    const isHr = ['ADMIN', 'KM_MANAGER', 'HR_CB'].some((role) => roles.has(role));
    const isManager = roles.has('LINE_MANAGER');
    const isDirector = roles.has('BOD') || roles.has('ADMIN');
    const orgUser = isManager && !isHr && !roles.has('BOD')
      ? await this.prisma.user.findUnique({ where: { id: user.id }, select: { orgUnitId: true } })
      : null;
    const scopedUserIds = isManager && !isHr && !roles.has('BOD')
      ? orgUser?.orgUnitId
        ? (await this.prisma.user.findMany({ where: { orgUnitId: orgUser.orgUnitId, id: { not: user.id } }, select: { id: true } })).map((item) => item.id)
        : []
      : null;
    const scopedUser = isManager && !isHr && !roles.has('BOD')
      ? { user: { orgUnitId: orgUser?.orgUnitId ?? '__NO_ORG_UNIT__' } }
      : {};
    const items: Array<{ key: string; title: string; description: string; count: number; href: string }> = [];
    const add = (key: string, title: string, description: string, count: number, href: string) => {
      if (count > 0) items.push({ key, title, description, count, href });
    };

    if (isHr || isManager || roles.has('BOD')) {
      const [leave, overtime, regularizations] = await Promise.all([
        this.prisma.leaveRequest.count({ where: { status: 'PENDING', userId: { not: user.id }, ...scopedUser } }),
        this.prisma.overtimeRequest.count({ where: { status: 'PENDING', userId: { not: user.id }, ...scopedUser } }),
        (isHr || isManager) ? this.prisma.hrmsAttendanceRegularization.count({ where: { status: 'PENDING', userId: scopedUserIds ? { in: scopedUserIds } : { not: user.id } } }) : Promise.resolve(0),
      ]);
      add('leave', 'Đơn nghỉ phép chờ duyệt', 'Các đơn trong phạm vi bạn phụ trách.', leave, '/leave');
      add('overtime', 'Đề nghị làm thêm giờ chờ duyệt', 'Các đề nghị trong phạm vi bạn phụ trách.', overtime, '/overtime');
      add('attendance', 'Giải trình chấm công chờ duyệt', 'Yêu cầu bổ sung hoặc điều chỉnh công.', regularizations, '/attendance');
    }
    if (isDirector) {
      const [bands, payroll] = await Promise.all([
        this.prisma.hrmsSalaryBand.count({ where: { status: 'DRAFT', createdById: { not: user.id } } }),
        this.prisma.hrmsPayrollRun.count({ where: { status: 'REVIEWED' } }),
      ]);
      add('salary-bands', 'Khung lương chờ phê duyệt', 'Bản nháp do nhân sự trình Ban Giám đốc.', bands, '/salary-bands');
      add('payroll', 'Kỳ lương chờ duyệt', 'Kiểm tra bảng lương đã được nhân sự rà soát.', payroll, '/payroll-engine');
    }
    if (roles.has('ACCOUNTANT') || roles.has('ADMIN')) {
      const expensePayments = await this.prisma.hrmsExpenseClaim.count({ where: { status: 'APPROVED', userId: { not: user.id } } });
      add('expense-payments', 'Khoản chi chờ thanh toán', 'Các khoản đã duyệt cần kế toán ghi nhận thanh toán.', expensePayments, '/expense-claims');
    }
    return { items, total: items.reduce((sum, item) => sum + item.count, 0), roles: user.roles ?? [] };
  }

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
