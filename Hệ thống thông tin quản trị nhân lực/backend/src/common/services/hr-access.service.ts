import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { AuthUser } from '../types/auth-user';

export const HR_ROLES = ['ADMIN', 'KM_MANAGER', 'HR_CB'];
export const PAYROLL_ROLES = [...HR_ROLES, 'ACCOUNTANT'];
export const isHr = (actor: AuthUser): boolean => actor.roles.some(r => HR_ROLES.includes(r));

@Injectable()
export class HrAccessService {
  constructor(private readonly prisma: PrismaService) {}

  assertOwnOrHr(actor: AuthUser, userId: string): void {
    if (actor.id !== userId && !isHr(actor)) throw new ForbiddenException('Chỉ được truy cập hồ sơ cá nhân hoặc hồ sơ thuộc quyền quản lý');
  }

  async assertReviewer(actor: AuthUser, userId: string): Promise<void> {
    if (actor.id === userId) throw new ForbiddenException('Không được tự phê duyệt đề xuất của mình');
    if (isHr(actor) || actor.roles.includes('BOD')) return;
    if (!actor.roles.includes('LINE_MANAGER')) throw new ForbiddenException('Không có quyền phê duyệt');
    const users = await this.prisma.user.findMany({
      where: { id: { in: [actor.id, userId] }, deletedAt: null },
      select: { id: true, orgUnitId: true },
    });
    const manager = users.find(u => u.id === actor.id);
    const employee = users.find(u => u.id === userId);
    if (!manager || !employee) throw new NotFoundException('Không tìm thấy nhân sự');
    if (!manager.orgUnitId || manager.orgUnitId !== employee.orgUnitId) throw new ForbiddenException('Chỉ được duyệt nhân viên trong bộ phận phụ trách');
  }

  async reviewScope(actor: AuthUser): Promise<{ orgUnitId?: string }> {
    if (isHr(actor) || actor.roles.includes('BOD')) return {};
    const user = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { orgUnitId: true } });
    if (!actor.roles.includes('LINE_MANAGER') || !user?.orgUnitId) throw new ForbiddenException('Không có phạm vi quản lý');
    return { orgUnitId: user.orgUnitId };
  }
}
