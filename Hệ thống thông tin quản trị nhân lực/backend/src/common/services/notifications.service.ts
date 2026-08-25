import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export interface NotifyInput {
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  linkPath?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget fan-out; deduplicates target ids and never throws. */
  async notify(input: NotifyInput): Promise<void> {
    const userIds = [...new Set(input.userIds)].filter(Boolean);
    if (userIds.length === 0) return;
    try {
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          linkPath: input.linkPath ?? null,
        })),
      });
    } catch {
      // Notifications are best-effort by design.
    }
  }
}
