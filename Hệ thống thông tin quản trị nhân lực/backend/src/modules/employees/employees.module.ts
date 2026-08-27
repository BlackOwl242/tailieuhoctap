import {
  BadRequestException, Body, Controller, Delete, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import {
  IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) employeeCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() hireDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['PROBATION', 'ACTIVE', 'RESIGNED', 'RETIRED']) employmentStatus?: 'PROBATION' | 'ACTIVE' | 'RESIGNED' | 'RETIRED';
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) baseSalary?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
}

class CreateContractDto {
  @ApiProperty() @IsString() @MaxLength(40) contractNo!: string;
  @ApiProperty() @IsEnum(['PROBATION', 'FIXED_TERM', 'INDEFINITE', 'INTERNSHIP']) type!: 'PROBATION' | 'FIXED_TERM' | 'INDEFINITE' | 'INTERNSHIP';
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiProperty() @IsNumber() @Min(0) baseSalary!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) insuranceSalary?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
  /** Bản mềm hợp đồng đính kèm: { name, mimeType, sizeBytes, dataBase64 } ≤ 8MB. */
  @ApiPropertyOptional() @IsOptional() @IsObject() file?: { name: string; mimeType: string; sizeBytes: number; dataBase64: string };
}

class UpdateContractDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(['ACTIVE', 'EXPIRED', 'TERMINATED']) status?: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) baseSalary?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

class CreateCertificateDto {
  @ApiProperty() @IsString() @MaxLength(160) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) certNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) issuedBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() issuedDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) storageSpot?: string;
  /** Bản scan văn bằng đính kèm: { name, mimeType, sizeBytes, dataBase64 } ≤ 8MB. */
  @ApiPropertyOptional() @IsOptional() @IsObject() file?: { name: string; mimeType: string; sizeBytes: number; dataBase64: string };
}

// ---------------------------------------------------------------------------
// Service — UC09 hồ sơ nhân viên, UC10 hợp đồng lao động, UC11 văn bằng chứng chỉ
// ---------------------------------------------------------------------------

const EMPLOYEE_SELECT = {
  id: true, email: true, fullName: true, employeeCode: true, hireDate: true,
  employmentStatus: true, baseSalary: true, birthDate: true, phone: true,
  address: true, jobTitle: true, status: true, orgUnitId: true,
  orgUnit: { select: { id: true, name: true, code: true } },
} as const;

// Bản rút gọn cho nhân viên thường — KHÔNG chứa lương (RBAC: dữ liệu
// lương/hợp đồng chỉ ADMIN + KM_MANAGER được xem).
const EMPLOYEE_SELECT_PUBLIC = {
  id: true, email: true, fullName: true, employeeCode: true, hireDate: true,
  employmentStatus: true, birthDate: true, phone: true,
  address: true, jobTitle: true, status: true, orgUnitId: true,
  orgUnit: { select: { id: true, name: true, code: true } },
} as const;

/** Nhân viên thường hay HR/quản trị? Dùng để chặn dữ liệu lương nhạy cảm. */
const isPrivilegedHr = (u: AuthUser) => u.roles.includes('ADMIN') || u.roles.includes('KM_MANAGER');

@Injectable()
export class EmployeesService {
  private readonly allowedExt = new Set(['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.md', '.txt']);
  private readonly maxBytes = 8 * 1024 * 1024;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  /** Lưu bản mềm đính kèm (base64) vào UPLOAD_DIR — trả về URL phục vụ tĩnh. */
  private async saveFile(file: { name: string; mimeType: string; sizeBytes: number; dataBase64: string }): Promise<{ fileUrl: string; fileName: string }> {
    const ext = extname(file.name).toLowerCase();
    if (!this.allowedExt.has(ext)) {
      throw new BusinessException(ErrorCodes.FILE_TYPE_NOT_ALLOWED, `Không cho phép tập tin ${ext || '(không có đuôi)'}`, HttpStatus.BAD_REQUEST);
    }
    const buffer = Buffer.from(file.dataBase64, 'base64');
    if (buffer.length === 0) throw new BadRequestException('Tập tin rỗng');
    if (buffer.length > this.maxBytes) {
      throw new BusinessException(ErrorCodes.FILE_TOO_LARGE, 'Tập tin vượt quá 8MB', HttpStatus.BAD_REQUEST);
    }
    const uploadDir = this.config.get<string>('uploadDir') ?? './uploads';
    const storageKey = `${randomUUID()}${ext}`;
    await writeFile(join(uploadDir, storageKey), buffer);
    return { fileUrl: `/uploads/${storageKey}`, fileName: file.name };
  }

  /**
   * Danh sách hồ sơ nhân sự (cho data table — client tự lọc/sắp xếp/phân trang).
   * RBAC: chỉ ADMIN/KM_MANAGER nhận trường baseSalary; nhân viên thường
   * nhận bản rút gọn không có lương.
   */
  async list(viewer: AuthUser) {
    const privileged = isPrivilegedHr(viewer);
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: privileged ? EMPLOYEE_SELECT : EMPLOYEE_SELECT_PUBLIC,
      orderBy: [{ employeeCode: 'asc' }, { fullName: 'asc' }],
    });
    return users;
  }

  /**
   * Hồ sơ chi tiết: thông tin + hợp đồng + văn bằng chứng chỉ (kho lưu trữ kép).
   * RBAC: hợp đồng lao động (chứa lương) chỉ trả cho ADMIN/KM_MANAGER.
   */
  async detail(id: string, viewer: AuthUser) {
    const privileged = isPrivilegedHr(viewer);
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...(privileged ? EMPLOYEE_SELECT : EMPLOYEE_SELECT_PUBLIC),
        bio: true, expertise: true,
        ...(privileged ? { contracts: { orderBy: { startDate: 'desc' as const } } } : {}),
        certificates: { orderBy: { createdAt: 'desc' } },
        leaveBalances: { orderBy: { year: 'desc' }, take: 1 },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    return user;
  }

  /** Cập nhật hồ sơ HR — mỗi thay đổi để lại dấu vết kiểm toán (tính pháp lý). */
  async updateProfile(id: string, dto: UpdateProfileDto, actor: AuthUser, requestId?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    if (dto.employeeCode && dto.employeeCode !== user.employeeCode) {
      const dup = await this.prisma.user.findUnique({ where: { employeeCode: dto.employeeCode } });
      if (dup) throw new BusinessException(ErrorCodes.CONFLICT, 'Mã nhân viên đã tồn tại', HttpStatus.CONFLICT);
    }
    const employeeCode = dto.employeeCode ?? user.employeeCode ?? (await this.suggestEmployeeCode());
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        employeeCode,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        employmentStatus: dto.employmentStatus,
        baseSalary: dto.baseSalary,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        phone: dto.phone,
        address: dto.address,
        jobTitle: dto.jobTitle,
        orgUnitId: dto.orgUnitId,
      },
      select: EMPLOYEE_SELECT,
    });
    await this.audit.log({
      actorId: actor.id, action: 'EMPLOYEE_PROFILE_UPDATED', entityType: 'User', entityId: id,
      before: { employmentStatus: user.employmentStatus, baseSalary: user.baseSalary },
      after: { employmentStatus: updated.employmentStatus, baseSalary: updated.baseSalary },
      requestId,
    });
    return updated;
  }

  /** Sinh mã nhân viên tự động NV0001, NV0002… khi chưa có. */
  private async suggestEmployeeCode(): Promise<string> {
    const count = await this.prisma.user.count({ where: { employeeCode: { not: null } } });
    let n = count + 1;
    // Đảm bảo không trùng dù có xóa rời rạc
    for (;;) {
      const code = `NV${String(n).padStart(4, '0')}`;
      const dup = await this.prisma.user.findUnique({ where: { employeeCode: code } });
      if (!dup) return code;
      n += 1;
    }
  }

  // ------------------------------------------------------------------ hợp đồng
  async createContract(userId: string, dto: CreateContractDto, actor: AuthUser, requestId?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    const dup = await this.prisma.contract.findUnique({ where: { contractNo: dto.contractNo } });
    if (dup) throw new BusinessException(ErrorCodes.CONFLICT, 'Số hợp đồng đã tồn tại', HttpStatus.CONFLICT);

    let fileMeta: { fileUrl: string; fileName: string } | undefined;
    if (dto.file) fileMeta = await this.saveFile(dto.file);
    const contract = await this.prisma.contract.create({
      data: {
        userId,
        contractNo: dto.contractNo,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        baseSalary: dto.baseSalary,
        insuranceSalary: dto.insuranceSalary,
        note: dto.note,
        fileUrl: fileMeta?.fileUrl,
        fileName: fileMeta?.fileName,
        createdById: actor.id,
      },
    });
    // Hợp đồng mới ACTIVE → đồng bộ lương cơ bản của hồ sơ (nguồn tính lương)
    if (contract.status === 'ACTIVE') {
      await this.prisma.user.update({ where: { id: userId }, data: { baseSalary: dto.baseSalary } });
    }
    await this.audit.log({
      actorId: actor.id, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: contract.id,
      after: { contractNo: contract.contractNo, type: contract.type }, requestId,
    });
    return contract;
  }

  async updateContract(userId: string, contractId: string, dto: UpdateContractDto, actor: AuthUser, requestId?: string) {
    const contract = await this.prisma.contract.findFirst({ where: { id: contractId, userId } });
    if (!contract) throw new NotFoundException('Không tìm thấy hợp đồng');
    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: dto.status,
        endDate: dto.endDate ? new Date(dto.endDate) : contract.endDate,
        baseSalary: dto.baseSalary,
        note: dto.note,
      },
    });
    if (dto.baseSalary !== undefined && updated.status === 'ACTIVE') {
      await this.prisma.user.update({ where: { id: userId }, data: { baseSalary: dto.baseSalary } });
    }
    await this.audit.log({
      actorId: actor.id, action: 'CONTRACT_UPDATED', entityType: 'Contract', entityId: contractId,
      after: { status: updated.status, baseSalary: updated.baseSalary }, requestId,
    });
    return updated;
  }

  // --------------------------------------------------------- văn bằng chứng chỉ
  async createCertificate(userId: string, dto: CreateCertificateDto, actor: AuthUser, requestId?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    let fileMeta: { fileUrl: string; fileName: string } | undefined;
    if (dto.file) fileMeta = await this.saveFile(dto.file);
    const cert = await this.prisma.certificate.create({
      data: {
        userId,
        name: dto.name,
        certNo: dto.certNo,
        issuedBy: dto.issuedBy,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        fileUrl: fileMeta?.fileUrl ?? dto.fileUrl,
        storageSpot: dto.storageSpot,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: 'CERTIFICATE_CREATED', entityType: 'Certificate', entityId: cert.id,
      after: { name: cert.name }, requestId,
    });
    return cert;
  }

  async deleteCertificate(userId: string, certId: string, actor: AuthUser, requestId?: string) {
    const cert = await this.prisma.certificate.findFirst({ where: { id: certId, userId } });
    if (!cert) throw new NotFoundException('Không tìm thấy văn bằng chứng chỉ');
    await this.prisma.certificate.delete({ where: { id: certId } });
    await this.audit.log({
      actorId: actor.id, action: 'CERTIFICATE_DELETED', entityType: 'Certificate', entityId: certId, requestId,
    });
    return { success: true };
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.detail(id, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto, @CurrentUser() user: AuthUser) {
    return this.service.updateProfile(id, dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post(':id/contracts')
  createContract(@Param('id') id: string, @Body() dto: CreateContractDto, @CurrentUser() user: AuthUser) {
    return this.service.createContract(id, dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Patch(':id/contracts/:contractId')
  updateContract(
    @Param('id') id: string, @Param('contractId') contractId: string,
    @Body() dto: UpdateContractDto, @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateContract(id, contractId, dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post(':id/certificates')
  createCertificate(@Param('id') id: string, @Body() dto: CreateCertificateDto, @CurrentUser() user: AuthUser) {
    return this.service.createCertificate(id, dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Delete(':id/certificates/:certId')
  deleteCertificate(
    @Param('id') id: string, @Param('certId') certId: string, @CurrentUser() user: AuthUser,
  ) {
    return this.service.deleteCertificate(id, certId, user);
  }
}

@Module({ controllers: [EmployeesController], providers: [EmployeesService] })
export class EmployeesModule {}
