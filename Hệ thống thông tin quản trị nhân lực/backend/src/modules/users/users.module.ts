import {
  Body, Controller, Delete, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs — mọi dữ liệu đầu vào đều được validate trước khi chạm vào service
// ---------------------------------------------------------------------------

class ListUsersQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsInt() limit?: number = 20;
}

class CreateUserDto {
  @ApiProperty() @IsEmail({}, { message: 'Email không hợp lệ' }) email!: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' }) password!: string;
  @ApiProperty() @IsString() @MaxLength(120) fullName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employeeCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() baseSalary?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() hireDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentStatus?: string;
  @ApiPropertyOptional({ enum: ['ADMIN', 'KM_MANAGER', 'USER'], isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(['ADMIN', 'KM_MANAGER', 'USER'], { each: true, message: 'Vai trò không hợp lệ' })
  roleCodes?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() expertise?: string[];
}

class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(8) password?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsIn(['ADMIN', 'KM_MANAGER', 'USER'], { each: true }) roleCodes?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() expertise?: string[];
}

// ---------------------------------------------------------------------------
// Service — toàn bộ nghiệp vụ quản lý người dùng (KC02)
// ---------------------------------------------------------------------------

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Danh sách người dùng có phân trang + tìm kiếm theo tên/email. */
  async list(q: ListUsersQueryDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));
    const where = {
      deletedAt: null,
      ...(q.query
        ? { OR: [{ fullName: { contains: q.query, mode: 'insensitive' as const } }, { email: { contains: q.query, mode: 'insensitive' as const } }] }
        : {}),
      ...(q.orgUnitId ? { orgUnitId: q.orgUnitId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { roles: { select: { roleCode: true } }, orgUnit: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map(({ passwordHash: _hash, ...u }) => ({ ...u, roles: u.roles.map((r) => r.roleCode) })),
      total,
      page,
      limit,
    };
  }

  /** Tạo người dùng mới kèm vai trò; mật khẩu được băm bcrypt cost 12. */
  async create(dto: CreateUserDto, actor: AuthUser, requestId?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) {
      throw new BusinessException(ErrorCodes.EMAIL_EXISTS, 'Email đã tồn tại trong hệ thống', HttpStatus.CONFLICT);
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const code = dto.employeeCode || `NV${Math.floor(1000 + Math.random() * 9000)}`;
    const roles = (dto.roleCodes && dto.roleCodes.length > 0) ? dto.roleCodes : ['USER'];
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        jobTitle: dto.jobTitle,
        orgUnitId: dto.orgUnitId,
        phone: dto.phone,
        employeeCode: code,
        baseSalary: dto.baseSalary,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
        employmentStatus: (dto.employmentStatus as never) || 'ACTIVE',
        expertise: dto.expertise ?? [],
        roles: { create: roles.map((roleCode) => ({ roleCode })) },
      },
      include: { roles: true },
    });
    await this.audit.log({ actorId: actor.id, action: 'USER_CREATED', entityType: 'User', entityId: user.id, after: { email: user.email, roles: dto.roleCodes }, requestId });
    return this.sanitize(user);
  }

  /** Cập nhật hồ sơ / vai / trạng thái / mật khẩu; ghi audit before–after. */
  async update(id: string, dto: UpdateUserDto, actor: AuthUser, requestId?: string) {
    const before = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: true },
    });
    if (!before) throw new NotFoundException('Không tìm thấy người dùng');

    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.jobTitle !== undefined) data.jobTitle = dto.jobTitle;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.orgUnitId !== undefined) data.orgUnitId = dto.orgUnitId;
    if (dto.expertise !== undefined) data.expertise = dto.expertise;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      if (dto.roleCodes) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({ data: dto.roleCodes.map((roleCode) => ({ userId: id, roleCode })) });
      }
      return tx.user.update({ where: { id }, data, include: { roles: true } });
    });

    // Khóa/vô hiệu hóa tài khoản → thu hồi toàn bộ phiên đăng nhập đang chạy
    if (dto.status && dto.status !== 'ACTIVE') {
      await this.prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    }

    const strip = (u: typeof before) => ({ id: u.id, email: u.email, status: u.status, roles: u.roles.map((r) => r.roleCode) });
    await this.audit.log({ actorId: actor.id, action: 'USER_UPDATED', entityType: 'User', entityId: id, before: strip(before), after: strip(user), requestId });
    return this.sanitize(user);
  }

  /** Xóa mềm người dùng + thu hồi phiên; dữ liệu lịch sử vẫn giữ nguyên. */
  async softDelete(id: string, actor: AuthUser, requestId?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'DISABLED' } }),
      this.prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.log({ actorId: actor.id, action: 'USER_DELETED', entityType: 'User', entityId: id, requestId });
    return { success: true };
  }

  /** Loại bỏ trường nhạy cảm trước khi trả ra ngoài API. */
  private sanitize(user: { passwordHash: string } & Record<string, unknown>) {
    const { passwordHash: _omit, roles, ...rest } = user as never as { passwordHash: string; roles: Array<{ roleCode: string }> };
    return { ...rest, roles: roles?.map((r) => r.roleCode) ?? [] };
  }
}

// ---------------------------------------------------------------------------
// Controller — chỉ ADMIN được quản lý người dùng (theo ma trận quyền)
// ---------------------------------------------------------------------------

@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() q: ListUsersQueryDto) {
    return this.usersService.list(q);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.softDelete(id, user);
  }
}

@Module({ controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}
