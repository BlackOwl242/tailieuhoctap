import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma.service';
import { RuntimeSettingsService } from '../../common/services/runtime-settings.service';
import { FieldCryptoService } from '../../common/services/field-crypto.service';
import { generateTotpCode } from '../../common/totp';

/**
 * Unit test UC01 & MFA — Đăng nhập, khóa 15 phút sau 5 lần sai, và xác thực 2FA TOTP/mã dự phòng.
 */
describe('AuthService (login lockout & MFA per UC01 / OWASP)', () => {
  let service: AuthService;
  let fieldCrypto: FieldCryptoService;
  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  };
  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
    verifyAsync: jest.fn(),
  };

  const baseUser = {
    id: 'u1', email: 'pm@demo.local', fullName: 'PM', passwordHash: 'hashed',
    status: 'ACTIVE', employmentStatus: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null,
    mfaEnabled: false, mfaSecretEnc: null as string | null, mfaBackupCodes: [] as string[],
    roles: [{ roleCode: 'USER' }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.REFRESH_EXPIRES_IN_DAYS = '7';
    fieldCrypto = new FieldCryptoService();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: RuntimeSettingsService, useValue: { get: async (_key: string, fallback: unknown) => fallback } },
        { provide: FieldCryptoService, useValue: fieldCrypto },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('đăng nhập thành công → reset bộ đếm lỗi và trả về cặp token', async () => {
    const bcrypt = require('bcryptjs');
    prismaMock.user.findFirst.mockResolvedValue({ ...baseUser, passwordHash: bcrypt.hashSync('Right@123', 4) });
    prismaMock.refreshToken.create.mockResolvedValue({});

    const result = await service.login({ email: 'pm@demo.local', password: 'Right@123' });
    if ('mfaRequired' in result) throw new Error('Expected tokens without MFA');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(96);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: expect.objectContaining({ failedLoginAttempts: 0 }) }),
    );
  });

  it('sai mật khẩu lần đầu → tăng failedLoginAttempts lên 1', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ ...baseUser });
    await expect(service.login({ email: 'pm@demo.local', password: 'wrong' })).rejects.toThrow();
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failedLoginAttempts: 1, lockedUntil: null }) }),
    );
  });

  it('sai đủ 5 lần → khóa tài khoản 15 phút', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ ...baseUser, failedLoginAttempts: 4 });
    await expect(service.login({ email: 'pm@demo.local', password: 'wrong' })).rejects.toThrow(/khóa 15 phút/);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 0,
          lockedUntil: expect.any(Date),
        }),
      }),
    );
  });

  it('tài khoản đang bị khóa → từ chối ngay với mã ACCOUNT_LOCKED', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      ...baseUser,
      lockedUntil: new Date(Date.now() + 10 * 60_000),
    });
    await expect(service.login({ email: 'pm@demo.local', password: 'anything' })).rejects.toThrow(/tạm khóa/);
  });

  it('tài khoản bật 2FA → trả về mfaRequired trước khi cấp token, và cho phép xác nhận TOTP', async () => {
    const bcrypt = require('bcryptjs');
    const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    const secretEnc = fieldCrypto.encryptString(secret);
    const mfaUser = {
      ...baseUser,
      passwordHash: bcrypt.hashSync('Right@123', 4),
      mfaEnabled: true,
      mfaSecretEnc: secretEnc,
    };
    prismaMock.user.findFirst.mockResolvedValue(mfaUser);
    jwtMock.signAsync.mockResolvedValueOnce('challenge-jwt').mockResolvedValueOnce('full-access-jwt');
    jwtMock.verifyAsync.mockResolvedValueOnce({ sub: 'u1', purpose: 'mfa' });
    prismaMock.refreshToken.create.mockResolvedValue({});

    const step1 = await service.login({ email: 'pm@demo.local', password: 'Right@123' });
    expect(step1).toEqual({ mfaRequired: true, mfaChallengeToken: 'challenge-jwt' });

    const totp = generateTotpCode(secret);
    const step2 = await service.verifyMfaLogin('challenge-jwt', totp);
    expect(step2.accessToken).toBe('full-access-jwt');
    expect(step2.refreshToken).toHaveLength(96);
  });
});
