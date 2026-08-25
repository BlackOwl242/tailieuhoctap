import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto';
import { CurrentUser, Public } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

function clientMeta(req: Request): { ip?: string; userAgent?: string } {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập — sai 5 lần liên tiếp sẽ bị khóa 15 phút (UC01)' })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const { ip, userAgent } = clientMeta(req);
    const tokens = await this.authService.login(dto, ip, userAgent);
    return { ...tokens, tokenType: 'Bearer' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi refresh token lấy cặp token mới (xoay vòng)' })
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    const { ip, userAgent } = clientMeta(req);
    return this.authService.refresh(dto.refreshToken, ip, userAgent);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Thu hồi refresh token' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất khỏi mọi thiết bị — thu hồi toàn bộ refresh token của người dùng' })
  async logoutAll(@CurrentUser() user: AuthUser): Promise<{ revoked: number }> {
    const revoked = await this.authService.logoutAll(user.id);
    return { revoked };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hồ sơ + vai trò của người dùng hiện tại' })
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }
}
