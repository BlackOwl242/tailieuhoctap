import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma.service';

/**
 * Unit test UC01 — Đăng nhập:
 * đúng mật khẩu → cấp token; sai → đếm lỗi; đủ 5 lần → khóa 15 phút.
 */
describe('AuthService (login lockout per UC01)', () => {
  let service: AuthService;
  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  };
  const jwtMock = { signAsync: jest.fn().mockResolvedValue('access-token') };

  const baseUser = {
    id: 'u1', email: 'pm@demo.local', fullName: 'PM', passwordHash: 'hashed',
    status: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null,
    roles: [{ roleCode: 'USER' }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
    process.env.REFRESH_EXPIRES_IN_DAYS = '7';
  });

  it('đăng nhập thành công → reset bộ đếm lỗi và trả về cặp token', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ ...baseUser });
    // bcrypt.compare thật với hash của 'Right@123'
    const bcrypt = require('bcryptjs');
    prismaMock.user.findFirst.mockResolvedValue({ ...baseUser, passwordHash: bcrypt.hashSync('Right@123', 4) });
    prismaMock.refreshToken.create.mockResolvedValue({});

    const result = await service.login({ email: 'pm@demo.local', password: 'Right@123' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(96); // 48 bytes hex
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
});
