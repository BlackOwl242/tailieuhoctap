import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import configuration from '../../config/configuration';
import { IS_PUBLIC_KEY } from '../decorators';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu token xác thực');
    }
    try {
      const payload = await this.jwtService.verifyAsync(header.slice(7), {
        secret: configuration().jwtSecret,
      });
      const user = await this.prisma.user.findUnique({
        where: { id: String(payload.sub) },
        select: { id: true, email: true, fullName: true, status: true, deletedAt: true, employmentStatus: true, roles: { select: { roleCode: true } } },
      });
      if (!user || user.deletedAt || user.status !== 'ACTIVE' || ['RESIGNED', 'RETIRED'].includes(user.employmentStatus)) {
        throw new UnauthorizedException('Tài khoản không còn hiệu lực');
      }
      req.user = { id: user.id, email: user.email, fullName: user.fullName, roles: user.roles.map(r => r.roleCode) };
      return true;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}
