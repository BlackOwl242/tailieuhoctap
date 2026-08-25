import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import { LoginDto } from './dto';

// Tham số khóa tài khoản theo UC01 của tài liệu thiết kế:
// sai 5 lần liên tiếp → khóa 15 phút
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const REFRESH_TOKEN_BYTES = 48;
// HTTP 423 Locked không có sẵn trong enum HttpStatus của NestJS
const HTTP_LOCKED = 423;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng nhập: đối chiếu CSDL, đếm số lần sai và khóa tài khoản tạm thời.
   * Luôn trả về cùng một mã lỗi cho "email không tồn tại" và "sai mật khẩu"
   * để kẻ xấu không thể dò được email nào có thật.
   */
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
      include: { roles: { select: { roleCode: true } } },
    });

    if (!user) {
      throw new BusinessException(
        ErrorCodes.INVALID_CREDENTIALS,
        'Email hoặc mật khẩu không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.status === 'DISABLED') {
      throw new BusinessException(
        ErrorCodes.ACCOUNT_DISABLED,
        'Tài khoản đã bị vô hiệu hóa',
        HttpStatus.FORBIDDEN,
      );
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new BusinessException(
        ErrorCodes.ACCOUNT_LOCKED,
        `Tài khoản tạm khóa đến ${user.lockedUntil.toLocaleTimeString('vi-VN')}`,
        HTTP_LOCKED,
        { lockedUntil: user.lockedUntil },
      );
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      const attempts = user.failedLoginAttempts + 1;
      const justLocked = attempts >= MAX_FAILED_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: justLocked ? 0 : attempts,
          lockedUntil: justLocked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
      throw new BusinessException(
        ErrorCodes.INVALID_CREDENTIALS,
        justLocked
          ? `Bạn đã nhập sai ${MAX_FAILED_ATTEMPTS} lần liên tiếp — tài khoản bị khóa ${LOCK_MINUTES} phút`
          : 'Email hoặc mật khẩu không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Đăng nhập thành công: reset bộ đếm lỗi và ghi thời điểm đăng nhập gần nhất
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return this.issueTokens(
      user.id,
      user.email,
      user.fullName,
      user.roles.map((r) => r.roleCode),
      ip,
      userAgent,
    );
  }

  /** Xoay vòng refresh token: thu hồi token cũ, cấp cặp token mới. */
  async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    const tokenHash = sha256(refreshToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { roles: { select: { roleCode: true } } } } },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date() || row.user.deletedAt || row.user.status !== 'ACTIVE') {
      throw new BusinessException(
        ErrorCodes.INVALID_REFRESH_TOKEN,
        'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(
      row.user.id,
      row.user.email,
      row.user.fullName,
      row.user.roles.map((r) => r.roleCode),
      ip,
      userAgent,
    );
  }

  /** Đăng xuất: thu hồi refresh token (idempotent — luôn thành công). */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Đăng xuất khỏi MỌI thiết bị (Mục 3): thu hồi toàn bộ refresh token
   * còn hiệu lực của người dùng — access token đang sống sẽ tự hết hạn
   * trong vòng JWT_EXPIRES_IN (15 phút) vì không còn cách refresh nữa.
   */
  async logoutAll(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /** Hồ sơ an toàn của người dùng hiện tại (không bao giờ trả passwordHash). */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { select: { roleCode: true } },
        orgUnit: { select: { id: true, name: true, code: true } },
      },
    });
    if (!user || user.deletedAt) {
      throw new BusinessException(ErrorCodes.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
    }
    const roles = user.roles.map((r) => r.roleCode);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      jobTitle: user.jobTitle,
      expertise: user.expertise,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      orgUnit: user.orgUnit,
      faceConsentAt: user.faceConsentAt,
      status: user.status,
      roles,
      isAdminOrKm: roles.includes('ADMIN') || roles.includes('KM_MANAGER'),
    };
  }

  /** Cấp access token (ngắn hạn) + refresh token (lưu bản băm để thu hồi được). */
  private async issueTokens(
    userId: string,
    email: string,
    fullName: string | null,
    roles: string[],
    ip?: string,
    userAgent?: string,
  ) {
    // Access token chứa đủ định danh để guard không phải truy CSDL mỗi request
    const accessToken = await this.jwtService.signAsync({ sub: userId, email, fullName, roles });
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const days = Number(process.env.REFRESH_EXPIRES_IN_DAYS || 7);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + days * 86_400_000),
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
    return { accessToken, refreshToken };
  }
}

/** Băm một chiều SHA-256 — dùng để lưu refresh token thay vì lưu plaintext. */
function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
