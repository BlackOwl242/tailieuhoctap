import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<{ user?: { id?: string; roles?: string[] }; originalUrl?: string }>();
    const { user } = req;
    const roles = user?.roles ?? [];
    if (required?.length && !required.some((r) => roles.includes(r))) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
    // The editable module matrix can restrict a role; explicit action and row
    // policies remain the upper bound, so prose cannot grant payroll deletion.
    if (!user || roles.includes('ADMIN')) return true;
    const url = req.originalUrl ?? '';
    if (/settings\/effective|field-tiers|\/auth\/|\/(?:my|mine|my-slips|my-loans|my-assets|my-balance)(?:[/?]|$)|attendance\/(?:check-in|face|biometric)|leave\/balance/.test(url)) return true;
    const groups: [RegExp, string][] = [
      [/personnel-reports/, 'REPORTS'], [/hrms\/(payroll|loans|expenses)/, 'PAYROLL'],
      [/attendance|overtime|leave|hrms\/shifts/, 'ATTENDANCE'], [/recruitment/, 'RECRUITMENT'],
      [/performance|hrms\/training/, 'PERFORMANCE'], [/personnel|employees|hrms\/(lifecycle|assets)/, 'EMPLOYEES'],
      [/admin|\/users|\/roles|\/audit/, 'SYSTEM'],
    ];
    const key = groups.find(([pattern]) => pattern.test(url))?.[1];
    if (key) {
      const matrix = await this.prisma.setting.findUnique({ where: { key: 'RBAC_PERMISSIONS_MATRIX' } });
      const rows = matrix?.value as unknown as { moduleKey: string; permissions: Record<string, unknown> }[] | undefined;
      const row = Array.isArray(rows) ? rows.find(r => r.moduleKey === key) : undefined;
      if (row && !roles.some(role => {
        const value = row.permissions?.[role];
        return typeof value === 'string' && Boolean(value.trim()) && !/^(?:-|—|không|none|deny)/i.test(value.trim());
      })) throw new ForbiddenException('Vai trò đã bị hạn chế tại ma trận quyền của phân hệ');
    }
    return true;
  }
}
