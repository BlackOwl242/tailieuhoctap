import { Body, Controller, Get, Injectable, Module, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

// Khóa cấu hình runtime và giá trị mặc định (tham số kiểu THAMSO của tài liệu)
export const SETTING_DEFAULTS: Record<string, unknown> = {
  WORK_START: process.env.ATTENDANCE_WORK_START || '08:00',
  WORK_END: process.env.ATTENDANCE_WORK_END || '17:30',
  QR_TTL_SEC: Number(process.env.QR_TOKEN_TTL_SEC || 30),
  FACE_THRESHOLD: Number(process.env.FACE_MATCH_THRESHOLD || 0.55),
  REVIEW_DUE_DAYS: 7,
  LOGIN_MAX_ATTEMPTS: 5,
  LOCK_MINUTES: 15,
};

/** Đọc tham số hiệu lực: ưu tiên DB, rơi về mặc định từ env. */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async effective(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.setting.findMany();
    const merged: Record<string, unknown> = { ...SETTING_DEFAULTS };
    for (const row of rows) merged[row.key] = row.value;
    return merged;
  }

  async update(values: Record<string, unknown>, actor: AuthUser) {
    const allowed = new Set(Object.keys(SETTING_DEFAULTS));
    for (const [key, value] of Object.entries(values)) {
      if (!allowed.has(key)) continue; // bỏ qua khóa lạ — an toàn tuyệt đối
      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value: value as object, updatedBy: actor.id },
        update: { value: value as object, updatedBy: actor.id },
      });
    }
    await this.audit.log({ actorId: actor.id, action: 'SETTINGS_UPDATED', entityType: 'Setting', after: values });
    return this.effective();
  }
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller()
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  /** Giá trị hiệu lực — mọi người đăng nhập đều đọc được (dùng cho FE hiển thị). */
  @Get('settings/effective')
  effective() {
    return this.service.effective();
  }

  @Roles('ADMIN')
  @Patch('admin/settings')
  update(@Body() body: { values?: Record<string, unknown> }, @CurrentUser() user: AuthUser) {
    return this.service.update(body.values ?? {}, user);
  }
}

@Module({ controllers: [SettingsController], providers: [SettingsService], exports: [SettingsService] })
export class SettingsModule {}
