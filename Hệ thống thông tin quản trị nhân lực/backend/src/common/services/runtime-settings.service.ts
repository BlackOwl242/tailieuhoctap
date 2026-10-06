import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { effectiveHolidayCalendar } from './holiday-calendar';

@Injectable()
export class RuntimeSettingsService {
  constructor(private readonly prisma: PrismaService) {}
  async get<T>(key: string, fallback: T): Promise<T> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (key === 'HOLIDAYS') return effectiveHolidayCalendar(setting?.value ?? fallback) as T;
    return setting ? setting.value as T : fallback;
  }
}
