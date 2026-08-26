import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser, AuthedRequest } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class CheckInDto {
  @IsIn(['QR', 'FACE', 'WEB', 'WINDOWS_HELLO', 'FACE_ID', 'BIOMETRIC_3D'])
  method!: 'QR' | 'FACE' | 'WEB' | 'WINDOWS_HELLO' | 'FACE_ID' | 'BIOMETRIC_3D';

  @IsOptional() @IsString() qrToken?: string;
  @IsOptional() @IsArray() descriptor?: number[];
  @IsOptional() @IsString() biometricCredentialId?: string;
  @IsOptional() @IsString() clientDataJSON?: string;
  @IsOptional() @IsString() signature?: string;
}

class EnrollFaceDto {
  @IsArray() descriptors!: number[][];
}

class EnrollBiometric3DDto {
  @IsString() credentialId!: string;
  @IsOptional() @IsString() clientDataJSON?: string;
  @IsOptional() @IsString() attestationObject?: string;
  @IsOptional() @IsString() source?: string;
}

class CreateDeviceDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsIn(['QR_KIOSK', 'MACHINE_WEBHOOK', 'MACHINE_CSV', 'SIMULATOR']) type!: 'QR_KIOSK' | 'MACHINE_WEBHOOK' | 'MACHINE_CSV' | 'SIMULATOR';
  @IsOptional() @IsString() location?: string;
}

class SimulatorDto {
  @IsOptional() @IsInt() days?: number = 14;
}

class CorrectionDto {
  @IsIn(['firstInAt', 'lastOutAt', 'status']) field!: 'firstInAt' | 'lastOutAt' | 'status';
  @IsString() @MaxLength(40) newValue!: string;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

// ---------------------------------------------------------------------------
// Controller — nhóm route chấm công (KC23–KC26)
// ---------------------------------------------------------------------------

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  // ------------------------------------------------------------- kiosk & scan
  /**
   * PUBLIC (Mục 2): kiosk là THIẾT BỊ đặt tại sảnh, không có người đăng nhập —
   * route phải mở để màn hình kiosk mở được ngay từ trang đăng nhập.
   * An toàn: token chỉ là chữ ký HMAC của thiết bị, TTL 30 giây, jti dùng một
   * lần; ghi giờ công vẫn bắt buộc JWT của nhân viên ở POST /check-in.
   */
  @Public()
  @Get('kiosk/token')
  @ApiOperation({ summary: 'Sinh token QR cho kiosk (xoay mỗi 30 giây) — công khai cho thiết bị kiosk' })
  kioskToken() {
    return this.service.kioskToken();
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Điểm danh bằng QR / khuôn mặt / web (UC18 mở rộng)' })
  checkIn(@CurrentUser() user: AuthUser, @Body() dto: CheckInDto) {
    return this.service.checkIn(user, dto);
  }

  // -------------------------------------------------------------------- face
  @Post('face/consent')
  giveConsent(@CurrentUser() user: AuthUser) {
    return this.service.giveFaceConsent(user.id);
  }

  @Get('face/enrollments')
  faceStatus(@CurrentUser() user: AuthUser) {
    return this.service.listFaceEnrollments(user.id);
  }

  @Get('face/templates')
  @ApiOperation({ summary: 'Lấy vector mẫu đăng ký phục vụ tính toán độ khớp thời gian thực trên UI' })
  faceTemplates(@CurrentUser() user: AuthUser) {
    return this.service.getFaceTemplates(user.id);
  }

  @Post('face/enroll')
  enroll(@CurrentUser() user: AuthUser, @Body() dto: EnrollFaceDto) {
    return this.service.enrollFace(user.id, dto.descriptors);
  }

  @Delete('face/enrollments')
  deleteEnrollment(@CurrentUser() user: AuthUser, @Query('id') id?: string) {
    return this.service.deleteFaceEnrollment(user.id, id);
  }

  // --------------------------------------------- 3D Biometrics / Windows Hello / FaceID
  @Get('biometric/challenge')
  @ApiOperation({ summary: 'Lấy cryptographic challenge cho WebAuthn Windows Hello 3D / Face ID' })
  biometricChallenge(@CurrentUser() user: AuthUser) {
    return this.service.getBiometricChallenge(user.id);
  }

  @Post('biometric/enroll')
  @ApiOperation({ summary: 'Đăng ký phần cứng sinh trắc học 3D (Windows Hello / Apple Face ID)' })
  enrollBiometric(@CurrentUser() user: AuthUser, @Body() dto: EnrollBiometric3DDto) {
    return this.service.enrollBiometric3D(user.id, dto);
  }

  // ------------------------------------------------------------------ my data
  @Get('me')
  myDays(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.myDays(user.id, from, to);
  }

  // ------------------------------------------------------------ admin routes
  @Roles('ADMIN', 'KM_MANAGER')
  @Get('days')
  companyDays(@Query('date') date?: string, @Query('q') q?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.companyDays(date, q, page, limit);
  }

  @Roles('ADMIN')
  @Post('days/:userId/:date/correction')
  correct(
    @Param('userId') userId: string,
    @Param('date') date: string,
    @Body() dto: CorrectionDto,
    @CurrentUser() user: AuthUser,
    @Req() req: AuthedRequest,
  ) {
    return this.service.correctDay(userId, date, dto, user, req.requestId);
  }

  @Roles('ADMIN')
  @Get('devices')
  devices() {
    return this.service.listDevices();
  }

  @Roles('ADMIN')
  @Post('devices')
  createDevice(@Body() dto: CreateDeviceDto, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.createDevice(dto, user, req.requestId);
  }

  @Roles('ADMIN')
  @Post('devices/:id/rotate-secret')
  rotateSecret(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.rotateDeviceSecret(id, user, req.requestId);
  }

  /** Import CSV — nhận text/csv thô trong body. */
  @Roles('ADMIN', 'KM_MANAGER')
  @Post('import/csv')
  async importCsv(@Req() req: Request & { rawBody?: Buffer }, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    await new Promise<void>((resolve) => req.on('end', resolve));
    const content = Buffer.concat(chunks).toString('utf8');
    if (!content.trim()) throw new BusinessException(ErrorCodes.CSV_PARSE_ERROR, 'Tệp CSV rỗng');
    const result = await this.service.importCsv(content, user);
    void res.status(HttpStatus.OK).json(result);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('simulator/run')
  simulate(@Body() dto: SimulatorDto, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.service.runSimulator(Math.min(60, Math.max(1, dto.days ?? 14)), user, req.requestId);
  }
}

/**
 * Webhook cho máy chấm công thật — PUBLIC nhưng bắt buộc chữ ký HMAC
 * trên RAW BODY (x-device-signature), xác minh trong service.
 */
@ApiTags('attendance')
@Controller('attendance/devices')
export class DeviceWebhookController {
  constructor(private readonly service: AttendanceService) {}

  @Public()
  @Post(':deviceId/events')
  @HttpCode(HttpStatus.OK)
  async ingest(
    @Param('deviceId') deviceId: string,
    @Req() req: Request & { rawBody?: Buffer },
    @Res() res: Response,
  ) {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    await new Promise<void>((resolve) => req.on('end', resolve));
    const raw = Buffer.concat(chunks).toString('utf8');
    const signature = (req.headers['x-device-signature'] as string) || '';
    const result = await this.service.ingestWebhook(deviceId, raw, signature);
    void res.status(HttpStatus.OK).json(result);
  }
}
