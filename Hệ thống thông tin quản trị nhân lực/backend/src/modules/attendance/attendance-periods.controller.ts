import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../common/prisma.service';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';

class ClosePeriodDto { @IsInt() @Min(1) @Max(12) month!: number; @IsInt() @Min(2000) @Max(2100) year!: number; }
class ReopenDto { @IsString() @MinLength(5) reason!: string; }

@ApiTags('attendance periods')
@ApiBearerAuth()
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT')
@Controller('attendance-periods')
export class AttendancePeriodsController {
  constructor(private readonly prisma: PrismaService, private readonly ledger: AttendanceLedgerService) {}
  @Get()
  list() { return this.prisma.attendancePeriod.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] }); }
  @Post('finalize')
  finalize(@Body() dto: ClosePeriodDto, @CurrentUser() actor: AuthUser) { return this.ledger.finalize(dto.month, dto.year, actor.id); }
  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post(':id/reopen')
  reopen(@Param('id') id: string, @Body() dto: ReopenDto, @CurrentUser() actor: AuthUser) { return this.ledger.reopen(id, dto.reason, actor.id); }
}
