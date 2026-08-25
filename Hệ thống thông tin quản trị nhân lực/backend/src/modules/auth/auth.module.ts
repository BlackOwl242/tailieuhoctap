import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import configuration from '../../config/configuration';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      global: false,
      secret: configuration().jwtSecret,
      signOptions: { expiresIn: configuration().jwtExpiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Global guard chain: throttling → JWT → role metadata
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
