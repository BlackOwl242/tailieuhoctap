import { Module } from '@nestjs/common';
import { AttendanceController, DeviceWebhookController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { QrTokenService } from './qr-token.service';
import { FaceCryptoService } from './face-crypto.service';
import { AttendancePeriodsController } from './attendance-periods.controller';

@Module({
  controllers: [AttendanceController, DeviceWebhookController, AttendancePeriodsController],
  providers: [AttendanceService, QrTokenService, FaceCryptoService],
})
export class AttendanceModule {}
