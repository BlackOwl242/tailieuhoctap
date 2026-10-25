import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';
import { RuntimeSettingsService } from '../../common/services/runtime-settings.service';
import { atClock, dateKey, workDate, VN_OFFSET, DAY_MS } from '../../common/hr-time';
import { ConflictException, HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import { FaceCryptoService } from './face-crypto.service';
import { QrTokenService } from './qr-token.service';
import type { AuthUser } from '../../common/types/auth-user';

const DEDUPE_WINDOW_MS = 2 * 60_000; // chặn chấm công trùng trong ±2 phút

@Injectable()
export class AttendanceService implements OnModuleInit, OnModuleDestroy {
  private autoSyncTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: SpaceAccessService,
    private readonly qrToken: QrTokenService,
    private readonly faceCrypto: FaceCryptoService,
    private readonly ledger: AttendanceLedgerService,
    private readonly settings: RuntimeSettingsService,
  ) {}

  onModuleInit() {
    void this.ledger.ensureAutoAttendanceUpToDate();
    this.autoSyncTimer = setInterval(() => {
      void this.ledger.ensureAutoAttendanceUpToDate();
    }, 30 * 60_000);
    this.autoSyncTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.autoSyncTimer) clearInterval(this.autoSyncTimer);
  }

  // ------------------------------------------------------------------ kiosk
  /**
   * Sinh token QR cho kiosk — route công khai (thiết bị kiosk không đăng nhập).
   * Tự cấp thiết bị kiosk mặc định khi chưa có nào (chống "mã QR không hiển thị"
   * trên cài đặt mới — Mục 4): kiosk demo luôn hoạt động ngay sau khi seed.
   */
  async kioskToken() {
    let device = await this.prisma.attendanceDevice.findFirst({
      where: { type: 'QR_KIOSK', status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    if (!device) {
      const owner = await this.prisma.user.findFirst({
        where: { deletedAt: null, roles: { some: { roleCode: 'ADMIN' } } },
        select: { id: true },
      });
      if (!owner) throw new BusinessException(ErrorCodes.NOT_FOUND, 'Chưa có kiosk QR nào được cấu hình', HttpStatus.NOT_FOUND);
      const secret = crypto.randomBytes(32).toString('hex');
      device = await this.prisma.attendanceDevice.create({
        data: {
          name: 'Kiosk mặc định (tự cấp)',
          type: 'QR_KIOSK',
          location: 'Sảnh chính',
          secretHash: crypto.createHash('sha256').update(secret).digest('hex'),
          createdById: owner.id,
        },
      });
    }
    if (!device.secretHash) {
      throw new BusinessException(ErrorCodes.NOT_FOUND, 'Kiosk chưa có khóa ký', HttpStatus.NOT_FOUND);
    }
    const ttlSec = Number(await this.settings.get('QR_TTL_SEC', Number(process.env.QR_TOKEN_TTL_SEC || 30)));
    // secretHash lưu bản băm — dùng chính nó làm khóa ký (không lưu plaintext)
    const { token, payload } = this.qrToken.issue(device.id, device.secretHash, ttlSec);
    await this.prisma.attendanceDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
    return { token, ttlSec, deviceId: device.id, issuedAt: payload.iat };
  }

  // --------------------------------------------------------------- check-in
  /**
   * Điểm danh đa nguồn (UC18 mở rộng):
   *  - QR   : xác minh token HMAC + TTL + jti one-time;
   *  - FACE : yêu cầu đồng thuận + so khớp cosine similarity với mẫu đã mã hóa;
   *  - WEB  : điểm danh trực tiếp trên web (fallback).
   * Sau đó ghi sự kiện thô (bất biến) và tổng hợp lại bảng công ngày.
   */
  async checkIn(
    user: AuthUser,
    dto: {
      method: 'QR' | 'FACE' | 'WEB';
      qrToken?: string;
      descriptor?: number[];
    },
  ) {
    let deviceId: string | null = null;

    if (dto.method === 'QR') {
      if (!dto.qrToken) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Thiếu mã QR');
      const result = await this.qrToken.verify(
        dto.qrToken,
        async (kid) => (await this.prisma.attendanceDevice.findUnique({ where: { id: kid } }))?.secretHash ?? null,
        Number(process.env.QR_TOKEN_TTL_SEC || 30) * 2,
      );
      if (!result.ok) {
        const reasonMap = { MALFORMED: 'Mã QR không hợp lệ', BAD_SIGNATURE: 'Mã QR không hợp lệ', EXPIRED: 'Mã QR đã hết hạn, vui lòng quét lại', REPLAY: 'Mã QR đã được sử dụng' } as const;
        throw new BusinessException(
          result.reason === 'EXPIRED' ? ErrorCodes.QR_TOKEN_EXPIRED : ErrorCodes.QR_TOKEN_INVALID,
          reasonMap[result.reason],
          HttpStatus.BAD_REQUEST,
        );
      }
      deviceId = result.payload.kid;
    }

    let maxSimilarity = 0;
    if (dto.method === 'FACE') {
      if (!dto.descriptor || dto.descriptor.length < 16) {
        throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Dữ liệu khuôn mặt không hợp lệ');
      }
      const me = await this.prisma.user.findUnique({ where: { id: user.id } });
      if (!me?.faceConsentAt) {
        throw new BusinessException(ErrorCodes.FACE_CONSENT_REQUIRED, 'Bạn chưa đồng ý thu thập dữ liệu sinh trắc học', HttpStatus.FORBIDDEN);
      }
      const embeddings = await this.prisma.faceEmbedding.findMany({ where: { userId: user.id, active: true } });
      if (embeddings.length === 0) {
        throw new BusinessException(ErrorCodes.FACE_NOT_ENROLLED, 'Bạn chưa đăng ký khuôn mặt', HttpStatus.BAD_REQUEST);
      }
      const threshold = Number(await this.settings.get('FACE_THRESHOLD', Number(process.env.FACE_MATCH_THRESHOLD || 0.95)));
      for (const row of embeddings) {
        const stored = this.faceCrypto.decryptEmbedding(row.encryptedData);
        const sim = FaceCryptoService.cosineSimilarity(stored, dto.descriptor!);
        if (sim > maxSimilarity) maxSimilarity = sim;
      }
      if (maxSimilarity < threshold) {
        throw new BusinessException(
          ErrorCodes.FACE_NOT_MATCHED,
          `Khuôn mặt không khớp (Độ tương đồng: ${(maxSimilarity * 100).toFixed(1)}% < ${(threshold * 100).toFixed(0)}%). Ngưỡng được cấu hình trong tham số hệ thống. Vui lòng căn chỉnh lại góc nhìn.`,
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    // Xác định loại lần chấm kế tiếp: số sự kiện thủ công hôm nay chẵn → VÀO, lẻ → RA
    const now = new Date();
    const dayStart = await this.ledger.dayForPunch(user.id, now);
    return this.prisma.$transaction(async tx => {
      await this.ledger.assertMutable(dayStart, tx);
      const todaysEvents = await tx.attendanceEvent.findMany({
        where: { userId: user.id, occurredAt: { gte: new Date(dayStart.getTime() - VN_OFFSET), lte: now } },
        orderBy: { occurredAt: 'asc' },
      });
      const todaysManualEvents = todaysEvents.filter(
        (e) => !(e.payload as { autoGenerated?: boolean } | null)?.autoGenerated,
      );
      const punchType = todaysManualEvents.length % 2 === 0 ? 'IN' : 'OUT';

      // Chống trùng: lần chấm thủ công trong 2 phút vừa qua bị từ chối
      const lastSame = todaysManualEvents[todaysManualEvents.length - 1];
      if (lastSame && now.getTime() - lastSame.occurredAt.getTime() < DEDUPE_WINDOW_MS) {
        throw new BusinessException(ErrorCodes.ALREADY_CHECKED_IN, 'Bạn vừa điểm danh rồi, thử lại sau ít phút', HttpStatus.CONFLICT);
      }

      await tx.attendanceEvent.create({
        data: {
          userId: user.id,
          deviceId,
          source: dto.method,
          occurredAt: now,
          payload: { punch: punchType, workDate: dayStart.toISOString().slice(0, 10) },
        },
      });
      const day = await this.ledger.recompute(user.id, dayStart, tx);

      return {
        punch: punchType,
        at: now.toISOString(),
        status: day.status,
        lateMinutes: day.lateMinutes,
        workedMinutes: day.workedMinutes,
        similarity: maxSimilarity > 0 ? Number(maxSimilarity.toFixed(4)) : undefined,
      };
    }, { isolationLevel: 'Serializable' });
  }

  // ------------------------------------------------------------------- face
  /** Đồng thuận thu thập dữ liệu sinh trắc học (bắt buộc trước khi đăng ký). */
  async giveFaceConsent(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { faceConsentAt: new Date() } });
    return { success: true };
  }

  /** Đăng ký 3–5 mẫu khuôn mặt; các mẫu cũ bị vô hiệu hóa. */
  async enrollFace(userId: string, descriptors: number[][]) {
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me?.faceConsentAt) {
      throw new BusinessException(ErrorCodes.FACE_CONSENT_REQUIRED, 'Cần đồng ý thu thập dữ liệu trước khi đăng ký', HttpStatus.FORBIDDEN);
    }
    if (descriptors.length < 3 || descriptors.length > 5) {
      throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Cần từ 3 đến 5 mẫu khuôn mặt');
    }
    const dim = descriptors[0].length;
    if (descriptors.some((d) => d.length !== dim)) {
      throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Các mẫu không cùng kích thước vector');
    }
    await this.prisma.faceEmbedding.updateMany({ where: { userId, active: true }, data: { active: false } });
    await this.prisma.faceEmbedding.createMany({
      data: descriptors.map((d) => ({
        userId,
        encryptedData: this.faceCrypto.encryptEmbedding(d),
        dimensions: dim,
      })),
    });
    return { success: true, samples: descriptors.length };
  }

  async listFaceEnrollments(userId: string) {
    const rows = await this.prisma.faceEmbedding.findMany({
      where: { userId, active: true },
      select: { id: true, dimensions: true, source: true, createdAt: true }, // KHÔNG trả vector
    });
    const consentAt = (await this.prisma.user.findUnique({ where: { id: userId }, select: { faceConsentAt: true } }))?.faceConsentAt;
    return { consentAt, samples: rows };
  }

  /** Lấy các vector mẫu đã đăng ký để hỗ trợ hiển thị độ khớp thời gian thực trên màn hình người dùng */
  async getFaceTemplates(userId: string) {
    const rows = await this.prisma.faceEmbedding.findMany({
      where: { userId, active: true, source: 'BROWSER' },
    });
    const templates = rows.map((r) => this.faceCrypto.decryptEmbedding(r.encryptedData));
    return { count: templates.length, templates, threshold: Number(await this.settings.get('FACE_THRESHOLD', Number(process.env.FACE_MATCH_THRESHOLD || 0.95))) };
  }

  /** Xóa mẫu khuôn mặt (quyền riêng tư — cũng là mục mặc định của handover). */
  async deleteFaceEnrollment(userId: string, embeddingId?: string) {
    await this.prisma.faceEmbedding.updateMany({
      where: { userId, ...(embeddingId ? { id: embeddingId } : {}), active: true },
      data: { active: false },
    });
    return { success: true };
  }

  // ---------------------------------------------------------------- devices
  async listDevices() {
    return this.prisma.attendanceDevice.findMany({
      select: { id: true, name: true, type: true, location: true, status: true, lastSeenAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Tạo thiết bị mới; khóa HMAC chỉ hiển thị MỘT lần lúc tạo/xoay. */
  async createDevice(dto: { name: string; type: 'QR_KIOSK' | 'MACHINE_WEBHOOK' | 'MACHINE_CSV' | 'SIMULATOR'; location?: string }, actor: AuthUser, requestId?: string) {
    const secret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const device = await this.prisma.attendanceDevice.create({
      data: { name: dto.name, type: dto.type, location: dto.location, secretHash, createdById: actor.id },
    });
    await this.audit.log({ actorId: actor.id, action: 'DEVICE_CREATED', entityType: 'AttendanceDevice', entityId: device.id, after: { name: dto.name, type: dto.type }, requestId });
    return { id: device.id, name: device.name, type: device.type, location: device.location, secret }; // secret hiển thị đúng một lần
  }

  async rotateDeviceSecret(id: string, actor: AuthUser, requestId?: string) {
    const secret = crypto.randomBytes(32).toString('hex');
    await this.prisma.attendanceDevice.update({
      where: { id },
      data: { secretHash: crypto.createHash('sha256').update(secret).digest('hex') },
    });
    await this.audit.log({ actorId: actor.id, action: 'DEVICE_SECRET_ROTATED', entityType: 'AttendanceDevice', entityId: id, requestId });
    return { secret };
  }

  /**
   * Webhook máy chấm công đẩy sự kiện vào đây.
   * Bảo mật: chữ ký HMAC-SHA256 trên RAW BODY đặt ở header `x-device-signature`.
   */
  async ingestWebhook(deviceId: string, rawBody: string, signature: string | undefined) {
    const device = await this.prisma.attendanceDevice.findUnique({ where: { id: deviceId } });
    if (!device || !device.secretHash || device.type !== 'MACHINE_WEBHOOK') {
      throw new BusinessException(ErrorCodes.NOT_FOUND, 'Thiết bị không tồn tại', HttpStatus.NOT_FOUND);
    }
    const expected = crypto.createHmac('sha256', device.secretHash).update(rawBody).digest('hex');
    if (!signature || !timingSafeEqualHex(expected, signature)) {
      throw new BusinessException(ErrorCodes.DEVICE_SIGNATURE_INVALID, 'Chữ ký thiết bị không hợp lệ', HttpStatus.UNAUTHORIZED);
    }
    let parsed: { events?: Array<{ email?: string; employeeCode?: string; occurredAt?: string }> };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new BusinessException(ErrorCodes.CSV_PARSE_ERROR, 'Payload không phải JSON hợp lệ');
    }
    return this.ingestRawEvents(parsed.events ?? [], device.id);
  }

  /** Import CSV xuất từ máy chấm công: cột email,occurred_at[,source]. */
  async importCsv(content: string, actor: AuthUser, requestId?: string) {
    let csvDevice = await this.prisma.attendanceDevice.findFirst({ where: { type: 'MACHINE_CSV' } });
    if (!csvDevice) {
      csvDevice = await this.prisma.attendanceDevice.create({
        data: { name: 'CSV Import', type: 'MACHINE_CSV', createdById: actor.id },
      });
    }
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const events: Array<{ email?: string; occurredAt?: string }> = [];
    for (const line of lines) {
      const [email, occurredAt] = line.split(',').map((s) => s?.trim());
      if (email && occurredAt) events.push({ email, occurredAt });
    }
    const result = await this.ingestRawEvents(events, csvDevice.id);
    await this.audit.log({ actorId: actor.id, action: 'ATTENDANCE_CSV_IMPORTED', entityType: 'AttendanceEvent', after: result, requestId });
    return result;
  }

  /** Điểm chung cho webhook + CSV: ánh xạ email → user, ghi sự kiện, tổng hợp đúng ngày phát sinh. */
  private async ingestRawEvents(events: Array<{ email?: string; employeeCode?: string; occurredAt?: string }>, deviceId: string) {
    let accepted = 0;
    let skipped = 0;
    const touchedUserDays = new Map<string, Set<string>>();

    for (const ev of events) {
      const occurredAt = ev.occurredAt ? new Date(ev.occurredAt) : null;
      if (!ev.email || !occurredAt || Number.isNaN(occurredAt.getTime())) {
        skipped++;
        continue;
      }
      const target = await this.prisma.user.findFirst({ where: { email: ev.email.toLowerCase(), deletedAt: null } });
      if (!target) {
        skipped++;
        continue;
      }
      const dayIso = startOfDay(occurredAt).toISOString();
      await this.prisma.attendanceEvent.create({
        data: { userId: target.id, deviceId, source: 'MACHINE', occurredAt, payload: { punch: guessPunch(occurredAt), workDate: dayIso.slice(0, 10) } },
      });
      const daySet = touchedUserDays.get(target.id) ?? new Set<string>();
      daySet.add(dayIso);
      touchedUserDays.set(target.id, daySet);
      accepted++;
    }
    // Chỉ tính lại đúng các ngày có sự kiện mới trong batch
    for (const [userId, uniqueDays] of touchedUserDays.entries()) {
      for (const iso of uniqueDays) {
        await this.recomputeDay(userId, new Date(iso));
      }
    }
    await this.prisma.attendanceDevice.update({ where: { id: deviceId }, data: { lastSeenAt: new Date() } });
    return { accepted, skipped };
  }

  /** Bộ mô phỏng thiết bị: sinh dữ liệu chấm công N ngày gần nhất để demo. */
  async runSimulator(days: number, actor: AuthUser, requestId?: string) {
    let simDevice = await this.prisma.attendanceDevice.findFirst({ where: { type: 'SIMULATOR' } });
    if (!simDevice) {
      simDevice = await this.prisma.attendanceDevice.create({
        data: { name: 'Simulator', type: 'SIMULATOR', createdById: actor.id },
      });
    }
    const users = await this.prisma.user.findMany({ where: { deletedAt: null, status: 'ACTIVE' }, select: { id: true } });
    const workStart = workMinutes(process.env.ATTENDANCE_WORK_START || '08:00');
    const workEnd = workMinutes(process.env.ATTENDANCE_WORK_END || '17:30');

    let created = 0;
    const base = startOfDay(new Date());
    for (let d = days; d >= 1; d--) {
      const date = new Date(base.getTime() - d * DAY_MS);
      const dow = date.getUTCDay();
      if (dow === 0 || dow === 6) continue; // bỏ cuối tuần

      for (const u of users) {
        const dayLower = new Date(date.getTime() - VN_OFFSET);
        const dayUpper = new Date(dayLower.getTime() + DAY_MS);
        const existing = await this.prisma.attendanceEvent.count({
          where: { userId: u.id, occurredAt: { gte: dayLower, lt: dayUpper } },
        });
        if (existing > 0) continue; // không nhân đôi dữ liệu mô phỏng

        const lateMin = Math.random() < 0.1 ? Math.floor(Math.random() * 12) : 0;
        const inAt = minuteToDate(date, workStart + lateMin);
        const outAt = minuteToDate(date, workEnd + 5 + Math.floor(Math.random() * 25));
        const dayText = date.toISOString().slice(0, 10);
        await this.prisma.attendanceEvent.createMany({
          data: [
            { userId: u.id, deviceId: simDevice.id, source: 'MACHINE', occurredAt: inAt, payload: { punch: 'IN', workDate: dayText, autoGenerated: true } },
            { userId: u.id, deviceId: simDevice.id, source: 'MACHINE', occurredAt: outAt, payload: { punch: 'OUT', workDate: dayText, autoGenerated: true } },
          ],
        });
        created += 2;
        await this.recomputeDay(u.id, date);
      }
    }
    await this.ledger.ensureAutoAttendanceUpToDate(undefined, true);
    await this.audit.log({ actorId: actor.id, action: 'SIMULATOR_RUN', entityType: 'AttendanceEvent', after: { created }, requestId });
    return { created, users: users.length, days };
  }

  /** Đồng bộ tự động bảng công của toàn bộ nhân viên đang làm việc tới ngày hiện tại. */
  async autoSyncNow(actor: AuthUser, requestId?: string) {
    if (process.env.ALLOW_DEMO_ATTENDANCE !== 'true' || !await this.settings.get('AUTO_ATTENDANCE_ENABLED', false)) throw new ConflictException('Tạo công mô phỏng chỉ dùng trong môi trường demo được bật riêng. Hãy ghi nhận chấm công thực hoặc gửi giải trình.');
    const res = await this.ledger.ensureAutoAttendanceUpToDate(undefined, true);
    await this.audit.log({ actorId: actor.id, action: 'ATTENDANCE_AUTO_SYNCED', entityType: 'AttendanceDay', after: res, requestId });
    return res;
  }

  // ------------------------------------------------------------------- days
  /** Bảng công cá nhân trong khoảng thời gian. */
  async myDays(userId: string, fromIso?: string, toIso?: string) {
    await this.ledger.ensureAutoAttendanceUpToDate();
    const to = toIso ? new Date(toIso) : new Date();
    const from = fromIso ? new Date(fromIso) : new Date(to.getTime() - 30 * 86_400_000);
    const days = await this.prisma.attendanceDay.findMany({
      where: { userId, workDate: { gte: startOfDay(from), lte: startOfDay(to) } },
      orderBy: { workDate: 'desc' },
    });
    const todayStart = startOfDay(new Date());
    const todayEvents = await this.prisma.attendanceEvent.findMany({
      where: { userId, occurredAt: { gte: new Date(todayStart.getTime() - VN_OFFSET) } },
      orderBy: { occurredAt: 'asc' },
    });
    return { days, todayEvents };
  }

  /** Bảng công toàn công ty một ngày — ADMIN/KM_MANAGER/HR_CB. */
  async companyDays(dateIso: string | undefined, query?: string, rawPage?: number, rawLimit?: number) {
    await this.ledger.ensureAutoAttendanceUpToDate();
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.min(100, Math.max(1, Number(rawLimit) || 50));
    const date = startOfDay(dateIso ? new Date(dateIso) : new Date());
    const where = {
      workDate: date,
      ...(query
        ? { user: { OR: [{ fullName: { contains: query, mode: 'insensitive' as const } }, { email: { contains: query, mode: 'insensitive' as const } }] } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendanceDay.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } },
        orderBy: [{ status: 'asc' }, { user: { fullName: 'asc' } }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendanceDay.count({ where }),
    ]);
    return { items, total, page, limit, date: date.toISOString() };
  }

  /** Hiệu chỉnh bảng công bởi ADMIN — luôn để lại vết (không sửa ngầm). */
  async correctDay(
    userId: string,
    dateIso: string,
    dto: { field: 'firstInAt' | 'lastOutAt' | 'status'; newValue: string; reason: string },
    admin: AuthUser,
    requestId?: string,
  ) {
    const date = dateKey(dateIso);
    await this.ledger.assertMutable(date);
    const before = await this.prisma.attendanceDay.findUnique({ where: { userId_workDate: { userId, workDate: date } } });
    if (dto.field !== 'status') atClock(date, dto.newValue);
    else if (!['PRESENT', 'LATE', 'EARLY_LEAVE', 'MISSING_PAIR', 'ON_LEAVE', 'HOLIDAY', 'ABSENT'].includes(dto.newValue)) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Trạng thái công không hợp lệ');
    const after = await this.prisma.$transaction(async tx => {
      await this.ledger.assertMutable(date, tx);
      await tx.attendanceCorrection.create({ data: { userId, workDate: date, field: dto.field, oldValue: before ? String(before[dto.field] ?? '') : null, newValue: dto.newValue, reason: dto.reason, correctedBy: admin.id } });
      return this.ledger.recompute(userId, date, tx);
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({ actorId: admin.id, action: 'ATTENDANCE_CORRECTED', entityType: 'AttendanceDay', entityId: `${userId}@${dateIso}`, before, after, requestId });
    return after;
  }

  // -------------------------------------------------------------- aggregation
  /**
   * Tổng hợp lại bảng công một ngày từ các sự kiện thô:
   * giờ vào/ra, phút đi muộn/về sớm, trạng thái (thiếu cặp > đi muộn > về sớm).
   */
  private async recomputeDay(userId: string, dayStart: Date) {
    return this.ledger.recompute(userId, dateKey(dayStart));
  }

}

// ---------------------------------------------------------------------------
// Helpers thuần chức năng (chuẩn hóa theo múi giờ Việt Nam UTC+7)
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date { return workDate(d); }

function minutesOfDay(d: Date): number {
  const vn = new Date(d.getTime() + VN_OFFSET);
  return vn.getUTCHours() * 60 + vn.getUTCMinutes();
}

function workMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minuteToDate(day: Date, minutes: number): Date {
  return new Date(dateKey(day).getTime() - VN_OFFSET + minutes * 60_000);
}

/** Suy đoán IN/OUT theo khung giờ Việt Nam khi dữ liệu máy không khai báo. */
function guessPunch(at: Date): 'IN' | 'OUT' {
  return minutesOfDay(at) < 12 * 60 ? 'IN' : 'OUT';
}

/** So sánh chuỗi hex bằng timing-safe. */
function timingSafeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
