import { ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { FieldCryptoService } from '../../common/services/field-crypto.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { toMoney, toMoneyOrNull } from '../../common/money';

/**
 * Quyền riêng tư & bảo vệ dữ liệu cá nhân theo chuẩn GDPR / Nghị định 13/2023/NĐ-CP:
 * - Xuất toàn bộ dữ liệu cá nhân (Data Portability / Right of Access);
 * - Rút đồng thuận sinh trắc học & xóa vĩnh viễn vector khuôn mặt (Right to Erasure);
 * - Ẩn danh hóa hồ sơ nhân sự đã nghỉ việc / nghỉ hưu (Data Retention);
 * - Mã hóa bổ sung hàng loạt dữ liệu PII cũ còn ở dạng plaintext trong CSDL.
 */
@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly crypto: FieldCryptoService,
  ) {}

  async exportMyData(userId: string) {
    const [user, profile, contracts, leaves, attendanceCount, payslips, faceCount, auditLogs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { orgUnit: { select: { id: true, name: true, code: true } }, roles: { select: { roleCode: true } } },
      }),
      this.prisma.personnelComprehensiveProfile.findUnique({
        where: { userId },
        include: { rank: true },
      }),
      this.prisma.contract.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }),
      this.prisma.leaveRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.attendanceDay.count({ where: { userId } }),
      this.prisma.hrmsPayrollSlip.findMany({
        where: { userId, payrollRun: { status: { in: ['APPROVED', 'LOCKED', 'PAID'] } } },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          id: true,
          payrollRun: { select: { periodName: true, fromDate: true, toDate: true, status: true } },
          baseSalary: true,
          grossPay: true,
          totalDeduction: true,
          netPay: true,
          currency: true,
          createdAt: true,
        },
      }),
      this.prisma.faceEmbedding.count({ where: { userId } }),
      this.prisma.auditLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, action: true, entityType: true, createdAt: true },
      }),
    ]);

    if (!user) throw new NotFoundException('Không tìm thấy tài khoản người dùng');

    await this.audit.log({
      actorId: userId,
      action: 'PRIVACY_DATA_EXPORTED',
      entityType: 'User',
      entityId: userId,
    });

    return {
      schemaVersion: 'GDPR-ND13-1.0',
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        employeeCode: user.employeeCode,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        birthDate: user.birthDate,
        hireDate: user.hireDate,
        jobTitle: user.jobTitle,
        orgUnit: user.orgUnit,
        roles: user.roles.map((r) => r.roleCode),
        bankName: user.bankName,
        bankAccount: this.crypto.decryptOptionalString(user.bankAccount) ?? null,
        taxDependentCount: user.taxDependentCount,
        taxResidency: user.taxResidency,
        minimumWageRegion: user.minimumWageRegion,
        mfaEnabled: user.mfaEnabled,
        faceConsentAt: user.faceConsentAt,
      },
      comprehensiveProfile: profile
        ? {
            idCardNo: this.crypto.decryptOptionalString(profile.idCardNo) ?? null,
            idCardIssueDate: profile.idCardIssueDate,
            idCardIssuePlace: profile.idCardIssuePlace,
            socialInsuranceNo: this.crypto.decryptOptionalString(profile.socialInsuranceNo) ?? null,
            permanentAddress: profile.permanentAddress,
            currentAddress: profile.currentAddress,
            hometown: profile.hometown,
            ethnicity: profile.ethnicity,
            religion: profile.religion,
            highestDegree: profile.highestDegree,
            rankName: profile.rank?.name ?? null,
          }
        : null,
      contracts: contracts.map((c) => ({
        contractNo: c.contractNo,
        type: c.type,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        baseSalary: toMoney(c.baseSalary),
        insuranceSalary: toMoneyOrNull(c.insuranceSalary),
        currency: c.currency,
      })),
      attendanceDaysRecorded: attendanceCount,
      biometricSamplesCount: faceCount,
      leaveRequests: leaves,
      payslips: payslips.map((s) => ({
        period: s.payrollRun.periodName,
        status: s.payrollRun.status,
        baseSalary: toMoney(s.baseSalary),
        grossPay: toMoney(s.grossPay),
        totalDeduction: toMoney(s.totalDeduction),
        netPay: toMoney(s.netPay),
        currency: s.currency,
        createdAt: s.createdAt,
      })),
      recentActivity: auditLogs.map((a) => ({
        id: a.id.toString(),
        action: a.action,
        entityType: a.entityType,
        createdAt: a.createdAt,
      })),
    };
  }

  /** Rút đồng thuận sinh trắc học và xóa cứng toàn bộ vector khuôn mặt đã lưu. */
  async withdrawBiometricConsent(userId: string) {
    const deletedCount = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.faceEmbedding.deleteMany({ where: { userId } });
      await tx.user.update({ where: { id: userId }, data: { faceConsentAt: null } });
      return removed.count;
    });
    await this.audit.log({
      actorId: userId,
      action: 'BIOMETRIC_CONSENT_WITHDRAWN',
      entityType: 'User',
      entityId: userId,
      after: { deletedEmbeddings: deletedCount },
    });
    return { success: true, deletedEmbeddings: deletedCount };
  }

  /** Ẩn danh hóa hồ sơ nhân sự đã thôi việc / nghỉ hưu (giữ lại số liệu kế toán-thuế bắt buộc). */
  async anonymizeTerminatedEmployee(userId: string, actor: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('Không tìm thấy nhân sự');
    if (!['RESIGNED', 'RETIRED'].includes(user.employmentStatus)) {
      throw new ConflictException('Chỉ được ẩn danh hóa nhân sự đã thôi việc hoặc nghỉ hưu');
    }

    const anonymizedName = `Nhân sự đã ẩn danh (${user.employeeCode || user.id.slice(0, 8)})`;
    await this.prisma.$transaction(async (tx) => {
      await tx.faceEmbedding.deleteMany({ where: { userId } });
      await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: anonymizedName,
          status: 'DISABLED',
          phone: null,
          address: null,
          birthDate: null,
          bankAccount: null,
          bankName: null,
          avatarUrl: null,
          bio: null,
          faceConsentAt: null,
          mfaEnabled: false,
          mfaSecretEnc: null,
          mfaBackupCodes: [],
        },
      });
      await tx.personnelComprehensiveProfile.updateMany({
        where: { userId },
        data: {
          aliasName: null,
          birthPlace: null,
          hometown: null,
          permanentAddress: null,
          currentAddress: null,
          idCardNo: null,
          idCardIssuePlace: null,
          socialInsuranceNo: null,
        },
      });
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'PRIVACY_DATA_ANONYMIZED',
      entityType: 'User',
      entityId: userId,
      after: { employeeCode: user.employeeCode },
    });
    return { success: true, anonymizedName };
  }

  /** Quét và mã hóa toàn bộ giá trị PII plaintext hiện có (chạy idempotent an toàn). */
  async backfillPiiEncryption(actor: AuthUser) {
    let encryptedUsers = 0;
    let encryptedProfiles = 0;
    let encryptedSlips = 0;

    const users = await this.prisma.user.findMany({
      where: { bankAccount: { not: null } },
      select: { id: true, bankAccount: true },
    });
    for (const u of users) {
      if (u.bankAccount && !this.crypto.isEncrypted(u.bankAccount)) {
        await this.prisma.user.update({
          where: { id: u.id },
          data: { bankAccount: this.crypto.encryptString(u.bankAccount) },
        });
        encryptedUsers += 1;
      }
    }

    const profiles = await this.prisma.personnelComprehensiveProfile.findMany({
      where: { OR: [{ idCardNo: { not: null } }, { socialInsuranceNo: { not: null } }] },
      select: { id: true, idCardNo: true, socialInsuranceNo: true },
    });
    for (const p of profiles) {
      const updates: Record<string, string> = {};
      if (p.idCardNo && !this.crypto.isEncrypted(p.idCardNo)) {
        updates.idCardNo = this.crypto.encryptString(p.idCardNo);
      }
      if (p.socialInsuranceNo && !this.crypto.isEncrypted(p.socialInsuranceNo)) {
        updates.socialInsuranceNo = this.crypto.encryptString(p.socialInsuranceNo);
      }
      if (Object.keys(updates).length > 0) {
        await this.prisma.personnelComprehensiveProfile.update({ where: { id: p.id }, data: updates });
        encryptedProfiles += 1;
      }
    }

    const slips = await this.prisma.hrmsPayrollSlip.findMany({
      where: { bankAccount: { not: null } },
      select: { id: true, bankAccount: true },
    });
    for (const s of slips) {
      if (s.bankAccount && !this.crypto.isEncrypted(s.bankAccount)) {
        await this.prisma.hrmsPayrollSlip.update({
          where: { id: s.id },
          data: { bankAccount: this.crypto.encryptString(s.bankAccount) },
        });
        encryptedSlips += 1;
      }
    }

    await this.audit.log({
      actorId: actor.id,
      action: 'PII_ENCRYPTION_BACKFILL',
      entityType: 'Privacy',
      after: { encryptedUsers, encryptedProfiles, encryptedSlips },
    });

    return { encryptedUsers, encryptedProfiles, encryptedSlips };
  }
}

@ApiTags('privacy')
@ApiBearerAuth()
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly service: PrivacyService) {}

  @Get('my-data')
  @ApiOperation({ summary: 'Xuất toàn bộ dữ liệu cá nhân theo chuẩn GDPR / NĐ 13/2023/NĐ-CP' })
  exportMyData(@CurrentUser() actor: AuthUser) {
    return this.service.exportMyData(actor.id);
  }

  @Post('face-consent/withdraw')
  @ApiOperation({ summary: 'Rút đồng thuận sinh trắc học & xóa vĩnh viễn toàn bộ vector khuôn mặt' })
  withdrawBiometricConsent(@CurrentUser() actor: AuthUser) {
    return this.service.withdrawBiometricConsent(actor.id);
  }

  @Roles('ADMIN')
  @Post('retention/anonymize/:userId')
  @ApiOperation({ summary: 'Ẩn danh hóa hồ sơ nhân sự đã thôi việc / nghỉ hưu' })
  anonymize(@Param('userId') userId: string, @CurrentUser() actor: AuthUser) {
    return this.service.anonymizeTerminatedEmployee(userId, actor);
  }

  @Roles('ADMIN')
  @Post('admin/encrypt-existing-pii')
  @ApiOperation({ summary: 'Mã hóa bổ sung AES-256-GCM cho dữ liệu CCCD, BHXH, STK ngân hàng hiện có' })
  backfill(@CurrentUser() actor: AuthUser) {
    return this.service.backfillPiiEncryption(actor);
  }
}

@Module({
  controllers: [PrivacyController],
  providers: [PrivacyService],
})
export class PrivacyModule {}
