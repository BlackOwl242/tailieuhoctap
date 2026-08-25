import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, SpaceRole, SpaceVisibility } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuthUser } from '../types/auth-user';
import { BusinessException, ErrorCodes } from '../errors/business.exception';

const RANK: Record<SpaceRole, number> = {
  VIEWER: 0,
  CONTRIBUTOR: 1,
  EDITOR: 2,
  MANAGER: 3,
};

/**
 * Implements the two-dimensional RBAC model from the design doc:
 *   global role (ADMIN / KM_MANAGER / USER)  ×  per-space role
 * KM_MANAGER and ADMIN are "privileged" and bypass space membership checks.
 */
@Injectable()
export class SpaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async globalRoles(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleCode: true },
    });
    return rows.map((r) => r.roleCode);
  }

  isPrivileged(roles: string[] = []): boolean {
    return roles.includes('ADMIN') || roles.includes('KM_MANAGER');
  }

  rank(role?: SpaceRole | null): number {
    return role ? RANK[role] : -1;
  }

  memberRole(spaceId: string, userId: string): Promise<SpaceRole | null> {
    return this.prisma.spaceMember
      .findUnique({ where: { spaceId_userId: { spaceId, userId } } })
      .then((m) => m?.spaceRole ?? null);
  }

  /** WHERE fragment limiting spaces to those the user may see. */
  visibilityWhere(privileged: boolean, userId: string): Prisma.SpaceWhereInput {
    if (privileged) return {};
    return {
      OR: [{ visibility: SpaceVisibility.PUBLIC }, { members: { some: { userId } } }],
    };
  }

  /**
   * Loads the space, verifies read access and (optionally) a minimum space role.
   * Returns everything the caller usually needs next.
   */
  async assertSpaceAccess(
    spaceId: string,
    user: AuthUser,
    min?: SpaceRole,
  ): Promise<{ space: NonNullable<Awaited<ReturnType<typeof this.loadSpace>>>; memberRole: SpaceRole | null; privileged: boolean }> {
    const roles = await this.globalRoles(user.id);
    const privileged = this.isPrivileged(roles);
    const space = await this.loadSpace(spaceId);
    if (!space) {
      throw new BusinessException(ErrorCodes.NOT_FOUND, 'Không tìm thấy Space', HttpStatus.NOT_FOUND);
    }
    const memberRole = await this.memberRole(spaceId, user.id);
    if (!privileged && !memberRole) {
      throw new BusinessException(
        ErrorCodes.SPACE_FORBIDDEN,
        'Bạn không có quyền truy cập Space này',
        HttpStatus.FORBIDDEN,
      );
    }
    if (min && !privileged && this.rank(memberRole) < this.rank(min)) {
      throw new BusinessException(
        ErrorCodes.SPACE_ROLE_REQUIRED,
        `Yêu cầu vai trò tối thiểu "${min}" trong Space`,
        HttpStatus.FORBIDDEN,
      );
    }
    return { space, memberRole, privileged };
  }

  private loadSpace(spaceId: string) {
    return this.prisma.space.findFirst({ where: { id: spaceId, deletedAt: null } });
  }
}
