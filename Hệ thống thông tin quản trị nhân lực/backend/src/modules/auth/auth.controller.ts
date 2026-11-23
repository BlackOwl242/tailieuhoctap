import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, MfaCodeDto, MfaDisableDto, MfaVerifyDto, RefreshDto } from './dto';
import { CurrentUser, Public } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

const REFRESH_COOKIE_NAME = 'hrmis_rt';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function clientMeta(req: Request): { ip?: string; userAgent?: string } {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
    userAgent: req.headers['user-agent'],
  };
}

function parseCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

function isCookieSecure(req: Request): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  return Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
}

function wantsCookieOnlyTransport(req: Request): boolean {
  return String(req.headers['x-auth-transport'] || '').toLowerCase() === 'cookie';
}

function setRefreshCookie(req: Request, res: Response, refreshToken: string): void {
  const days = Math.max(1, Number(process.env.REFRESH_EXPIRES_IN_DAYS || 7));
  const attrs = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`,
    'HttpOnly',
    'SameSite=Lax',
    `Path=${REFRESH_COOKIE_PATH}`,
    `Max-Age=${days * 86_400}`,
  ];
  if (isCookieSecure(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearRefreshCookie(req: Request, res: Response): void {
  const attrs = [
    `${REFRESH_COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Lax',
    `Path=${REFRESH_COOKIE_PATH}`,
    'Max-Age=0',
  ];
  if (isCookieSecure(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function respondWithSession(
  req: Request,
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  setRefreshCookie(req, res, tokens.refreshToken);
  if (wantsCookieOnlyTransport(req)) {
    return { accessToken: tokens.accessToken, tokenType: 'Bearer' };
  }
  return { ...tokens, tokenType: 'Bearer' };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập — sai 5 lần liên tiếp khóa 15 phút; hỗ trợ 2FA TOTP' })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { ip, userAgent } = clientMeta(req);
    const result = await this.authService.login(dto, ip, userAgent);
    if ('mfaRequired' in result) {
      return result;
    }
    return respondWithSession(req, res, result);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hoàn tất đăng nhập bước 2 bằng mã TOTP hoặc mã dự phòng' })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyMfa(@Body() dto: MfaVerifyDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { ip, userAgent } = clientMeta(req);
    const tokens = await this.authService.verifyMfaLogin(dto.challengeToken, dto.code, ip, userAgent);
    return respondWithSession(req, res, tokens);
  }

  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo khóa bí mật TOTP mới để liên kết ứng dụng Authenticator' })
  setupMfa(@CurrentUser() user: AuthUser) {
    return this.authService.setupMfa(user.id);
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xác nhận mã TOTP lần đầu để kích hoạt 2FA và nhận bộ mã dự phòng' })
  enableMfa(@CurrentUser() user: AuthUser, @Body() dto: MfaCodeDto) {
    return this.authService.enableMfa(user.id, dto.code);
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tắt 2FA sau khi xác minh mật khẩu và mã TOTP / mã dự phòng' })
  disableMfa(@CurrentUser() user: AuthUser, @Body() dto: MfaDisableDto) {
    return this.authService.disableMfa(user.id, dto.currentPassword, dto.code);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi refresh token (từ HttpOnly cookie hoặc body) lấy cặp token mới' })
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = parseCookie(req, REFRESH_COOKIE_NAME) || dto?.refreshToken;
    if (!token) {
      throw new BusinessException(
        ErrorCodes.INVALID_REFRESH_TOKEN,
        'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { ip, userAgent } = clientMeta(req);
    const tokens = await this.authService.refresh(token, ip, userAgent);
    return respondWithSession(req, res, tokens);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Thu hồi refresh token và xóa HttpOnly cookie' })
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = parseCookie(req, REFRESH_COOKIE_NAME) || dto?.refreshToken;
    if (token) {
      await this.authService.logout(token);
    }
    clearRefreshCookie(req, res);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất khỏi mọi thiết bị — thu hồi toàn bộ refresh token của người dùng' })
  async logoutAll(@CurrentUser() user: AuthUser, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ revoked: number }> {
    const revoked = await this.authService.logoutAll(user.id);
    clearRefreshCookie(req, res);
    return { revoked };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu khởi tạo và thu hồi các phiên cũ' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { ip, userAgent } = clientMeta(req);
    const tokens = await this.authService.changePassword(user.id, dto, ip, userAgent);
    return respondWithSession(req, res, tokens);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hồ sơ + vai trò của người dùng hiện tại' })
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }
}
