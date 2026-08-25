import { Module } from '@nestjs/common';
import { AttendanceController, DeviceWebhookController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { QrTokenService } from './qr-token.service';
import { FaceCryptoService } from './face-crypto.service';

@Module({
  controllers: [AttendanceController, DeviceWebhookController],
  providers: [AttendanceService, QrTokenService, FaceCryptoService],
})
export class AttendanceModule {}
