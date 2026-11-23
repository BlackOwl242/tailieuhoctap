import {
  BadRequestException, ConflictException, HttpStatus, Injectable, Optional, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import { ChangePasswordDto, LoginDto } from './dto';
import { RuntimeSettingsService } from '../../common/services/runtime-settings.service';
import { FieldCryptoService } from '../../common/services/field-crypto.service';
import { AuditService } from '../../common/services/audit.service';
import {
  buildOtpAuthUri, generateBackupCodes, generateTotpSecret, hashBackupCode, verifyTotpCode,
} from '../../common/totp';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const REFRESH_TOKEN_BYTES = 48;
const HTTP_LOCKED = 423;

@Injectable()
export class AuthService {
  private readonly crypto: FieldCryptoService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly settings: RuntimeSettingsService,
    @Optional() fieldCrypto?: FieldCryptoService,
    @Optional() private readonly audit?: AuditService,
  ) {
    this.crypto = fieldCrypto ?? new FieldCryptoService();
  }

  /**
   * Đăng nhập: đối chiếu CSDL, đếm số lần sai, khóa tạm thời sau 5 lần sai và hỗ trợ bước 2FA nếu đã bật.
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
    if (user.status === 'DISABLED' || ['RESIGNED', 'RETIRED'].includes(user.employmentStatus)) {
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
      const maxAttempts = Number(await this.settings.get('LOGIN_MAX_ATTEMPTS', MAX_FAILED_ATTEMPTS));
      const lockMinutes = Number(await this.settings.get('LOCK_MINUTES', LOCK_MINUTES));
      const attempts = user.failedLoginAttempts + 1;
      const justLocked = attempts >= maxAttempts;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: justLocked ? 0 : attempts,
          lockedUntil: justLocked ? new Date(Date.now() + lockMinutes * 60_000) : null,
        },
      });
      throw new BusinessException(
        ErrorCodes.INVALID_CREDENTIALS,
        justLocked
          ? `Bạn đã nhập sai ${maxAttempts} lần liên tiếp — tài khoản bị khóa ${lockMinutes} phút`
          : 'Email hoặc mật khẩu không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.mfaEnabled && user.mfaSecretEnc) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      const mfaChallengeToken = await this.jwtService.signAsync(
        { sub: user.id, purpose: 'mfa' },
        { expiresIn: '5m' },
      );
      return { mfaRequired: true as const, mfaChallengeToken };
    }

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

  /** Bước 2 của đăng nhập MFA: kiểm tra mã TOTP 6 chữ số hoặc mã khôi phục dự phòng. */
  async verifyMfaLogin(challengeToken: string, code: string, ip?: string, userAgent?: string) {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; purpose?: string }>(challengeToken);
    } catch {
      throw new UnauthorizedException('Phiên xác thực 2FA đã hết hạn hoặc không hợp lệ');
    }
    if (!payload?.sub || payload.purpose !== 'mfa') {
      throw new UnauthorizedException('Token xác thực 2FA không hợp lệ');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
      include: { roles: { select: { roleCode: true } } },
    });
    if (!user || !user.mfaEnabled || !user.mfaSecretEnc) {
      throw new UnauthorizedException('Tài khoản không ở trạng thái sẵn sàng xác thực 2FA');
    }

    const secret = this.crypto.decryptString(user.mfaSecretEnc);
    let verified = verifyTotpCode(secret, code);
    let remainingBackups: string[] | undefined;

    if (!verified) {
      const codeHash = hashBackupCode(code);
      const existing = user.mfaBackupCodes ?? [];
      const idx = existing.indexOf(codeHash);
      if (idx >= 0) {
        verified = true;
        remainingBackups = existing.filter((_, i) => i !== idx);
      }
    }

    if (!verified) {
      throw new BusinessException(
        ErrorCodes.MFA_INVALID_CODE,
        'Mã xác thực 2FA hoặc mã dự phòng không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(remainingBackups !== undefined ? { mfaBackupCodes: remainingBackups } : {}),
      },
    });
    await this.audit?.log({
      actorId: user.id,
      action: 'MFA_LOGIN_VERIFIED',
      entityType: 'User',
      entityId: user.id,
      after: { usedBackupCode: remainingBackups !== undefined },
      ip,
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

  /** Khởi tạo bí mật TOTP (mã hóa AES-256-GCM trước khi lưu; chỉ kích hoạt sau khi người dùng xác nhận). */
  async setupMfa(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, email: true, mfaEnabled: true },
    });
    if (!user) throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    if (user.mfaEnabled) {
      throw new ConflictException('Tài khoản đã bật 2FA; hãy tắt 2FA hiện tại trước khi tạo khóa mới');
    }

    const secret = generateTotpSecret();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaSecretEnc: this.crypto.encryptString(secret) },
    });

    return {
      secret,
      issuer: 'HRMIS Pro',
      accountName: user.email,
      otpauthUrl: buildOtpAuthUri({ issuer: 'HRMIS Pro', accountName: user.email, secret }),
    };
  }

  /** Xác nhận mã TOTP lần đầu để kích hoạt 2FA và cấp 8 mã dự phòng một lần. */
  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, mfaEnabled: true, mfaSecretEnc: true },
    });
    if (!user) throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    if (user.mfaEnabled) throw new ConflictException('Tài khoản đã kích hoạt 2FA rồi');
    if (!user.mfaSecretEnc) {
      throw new BadRequestException('Vui lòng bấm thiết lập 2FA để tạo khóa bí mật trước');
    }

    const secret = this.crypto.decryptString(user.mfaSecretEnc);
    if (!verifyTotpCode(secret, code)) {
      throw new BusinessException(
        ErrorCodes.MFA_INVALID_CODE,
        'Mã xác thực 6 chữ số không đúng',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { plain, hashes } = generateBackupCodes(8);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaEnrolledAt: new Date(),
        mfaBackupCodes: hashes,
      },
    });
    await this.audit?.log({
      actorId: user.id,
      action: 'MFA_ENABLED',
      entityType: 'User',
      entityId: user.id,
    });

    return { enabled: true, backupCodes: plain };
  }

  /** Tắt 2FA sau khi xác minh mật khẩu hiện tại và mã TOTP / mã dự phòng. */
  async disableMfa(userId: string, currentPassword: string, code: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, passwordHash: true, mfaEnabled: true, mfaSecretEnc: true, mfaBackupCodes: true },
    });
    if (!user) throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    if (!user.mfaEnabled || !user.mfaSecretEnc) {
      throw new BusinessException(ErrorCodes.MFA_NOT_ENABLED, 'Tài khoản chưa bật 2FA', HttpStatus.BAD_REQUEST);
    }

    const secret = this.crypto.decryptString(user.mfaSecretEnc);
    const validTotp = verifyTotpCode(secret, code);
    const validBackup = (user.mfaBackupCodes ?? []).includes(hashBackupCode(code));
    if (!validTotp && !validBackup) {
      throw new BusinessException(
        ErrorCodes.MFA_INVALID_CODE,
        'Mã xác thực 2FA hoặc mã dự phòng không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        mfaSecretEnc: null,
        mfaBackupCodes: [],
        mfaEnrolledAt: null,
      },
    });
    await this.audit?.log({
      actorId: user.id,
      action: 'MFA_DISABLED',
      entityType: 'User',
      entityId: user.id,
    });

    return { enabled: false };
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
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Đăng xuất khỏi MỌI thiết bị: thu hồi toàn bộ refresh token còn hiệu lực của người dùng.
   */
  async logoutAll(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /** Đổi mật khẩu khởi tạo rồi thu hồi các phiên cũ trước khi cấp phiên mới. */
  async changePassword(userId: string, dto: ChangePasswordDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'ACTIVE' },
      include: { roles: { select: { roleCode: true } } },
    });
    if (!user) throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    return this.issueTokens(user.id, user.email, user.fullName, user.roles.map((r) => r.roleCode), ip, userAgent);
  }

  /** Hồ sơ an toàn của người dùng hiện tại (tự động giải mã số tài khoản, không trả passwordHash/mfaSecretEnc). */
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
      employeeCode: user.employeeCode,
      hireDate: user.hireDate,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
      employmentStatus: user.employmentStatus,
      bankAccount: this.crypto.decryptOptionalString(user.bankAccount) ?? null,
      bankName: user.bankName,
      taxDependentCount: user.taxDependentCount,
      jobTitle: user.jobTitle,
      expertise: user.expertise,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      orgUnit: user.orgUnit,
      faceConsentAt: user.faceConsentAt,
      mfaEnabled: Boolean(user.mfaEnabled),
      status: user.status,
      mustChangePassword: user.mustChangePassword,
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
