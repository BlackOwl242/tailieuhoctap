import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

/**
 * KC21 — Bảng điều khiển theo vai: số liệu tổng hợp thời gian thực,
 * phạm vi dữ liệu giới hạn theo quyền nhìn thấy của từng người.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
  ) {}

  async stats(user: AuthUser) {
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);

    // Hộp phê duyệt của tôi: bài PENDING_REVIEW trong Space mình quản lý
    const managed = await this.prisma.spaceMember.findMany({
      where: { userId: user.id, spaceRole: 'MANAGER' }, select: { spaceId: true },
    });
    const pendingReviews = await this.prisma.article.count({
      where: {
        status: 'PENDING_REVIEW', deletedAt: null,
        ...(privileged ? {} : { spaceId: { in: managed.map((m) => m.spaceId) } }),
      },
    });

    // Onboarding của tôi còn bao nhiêu mục bắt buộc chưa xong
    const assignments = await this.prisma.onboardingAssignment.findMany({
      where: { userId: user.id, status: 'IN_PROGRESS' },
      include: { path: { include: { items: { where: { isRequired: true } } } }, progress: true },
    });
    let pendingOnboardingItems = 0;
    for (const a of assignments) {
      const doneIds = new Set(a.progress.map((p) => p.itemId));
      pendingOnboardingItems += a.path.items.filter((i) => !doneIds.has(i.id)).length;
    }

    // Chấm công hôm nay + 7 ngày gần nhất
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(todayStart.getTime() - 6 * 86_400_000);
    const [todayAttendance, weekDays] = await Promise.all([
      this.prisma.attendanceDay.findUnique({
        where: { userId_workDate: { userId: user.id, workDate: todayStart } },
      }),
      this.prisma.attendanceDay.findMany({
        where: { userId: user.id, workDate: { gte: weekAgo } },
        orderBy: { workDate: 'asc' },
      }),
    ]);

    // Thống kê nội dung — chỉ đếm trong Space được phép nhìn thấy
    const visibility = this.access.visibilityWhere(privileged, user.id);
    const [publishedCount, pendingReviewCount, myDrafts] = await Promise.all([
      this.prisma.article.count({ where: { status: 'PUBLISHED', deletedAt: null, space: visibility } }),
      this.prisma.article.count({ where: { status: 'PENDING_REVIEW', deletedAt: null, space: visibility } }),
      this.prisma.article.count({ where: { authorId: user.id, status: 'DRAFT', deletedAt: null } }),
    ]);

    const topArticles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, space: visibility },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: { id: true, title: true, viewCount: true, helpfulCount: true },
    });
    const recentArticles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, space: visibility },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, publishedAt: true,
        author: { select: { fullName: true } },
        space: { select: { name: true, slug: true } },
      },
    });

    // --- Số liệu HRMIS (Mục 9 — dashboard chuẩn quản trị nhân sự) ---
    const [totalEmployees, presentToday, onLeaveToday, pendingLeave, pendingOvertime, pendingActions, latestPeriod] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } } }),
      this.prisma.attendanceDay.count({ where: { workDate: todayStart, status: { in: ['PRESENT', 'LATE', 'EARLY_LEAVE'] } } }),
      this.prisma.attendanceDay.count({ where: { workDate: todayStart, status: 'ON_LEAVE' } }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.overtimeRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.personnelAction.count({ where: { status: 'PENDING' } }),
      this.prisma.payrollPeriod.findFirst({ orderBy: [{ year: 'desc' }, { month: 'desc' }], select: { month: true, year: true, status: true } }),
    ]);

    return {
      me: { pendingReviews, pendingOnboardingItems, todayAttendance },
      content: { publishedCount, pendingReviewCount, myDrafts },
      attendanceWeek: weekDays.map((d) => ({ date: d.workDate, status: d.status, lateMinutes: d.lateMinutes })),
      topArticles,
      recentArticles,
      hr: {
        totalEmployees,
        presentToday,
        onLeaveToday,
        pendingLeave,
        pendingOvertime,
        pendingActions,
        latestPeriod,
      },
    };
  }
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.service.stats(user);
  }
}

@Module({ controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
