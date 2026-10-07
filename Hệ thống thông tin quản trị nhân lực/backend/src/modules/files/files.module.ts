import { ForbiddenException, Controller, Get, Injectable, Module, NotFoundException, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createReadStream, existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import type { Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { CurrentUser, Roles } from '../../common/decorators';
import { PrismaService } from '../../common/prisma.service';
import type { AuthUser } from '../../common/types/auth-user';
import { ArticlesModule } from '../articles/articles.module';
import { ArticlesService } from '../articles/articles.service';

const HR_ROLES = ['ADMIN', 'KM_MANAGER', 'HR_CB'];
const FILE_ROLES = ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'LINE_MANAGER', 'BOD', 'AUDITOR', 'USER'];
const MIME: Record<string, string> = {
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
};

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly articles: ArticlesService) {}

  async resolve(key: string, actor: AuthUser) {
    if (basename(key) !== key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{1,8}$/i.test(key)) {
      throw new NotFoundException('Không tìm thấy tập tin');
    }
    const url = `/uploads/${key}`;
    const roles = new Set(actor.roles);
    const isHr = HR_ROLES.some(role => roles.has(role));
    let originalName: string | null = null;
    let allowed = false;

    const publicDocument = await this.prisma.hrDocument.findFirst({ where: { fileUrl: url }, select: { fileName: true, status: true } });
    if (publicDocument) {
      originalName = publicDocument.fileName;
      allowed = publicDocument.status === 'PUBLISHED' || isHr;
    }
    if (!allowed) {
      const contract = await this.prisma.contract.findFirst({ where: { fileUrl: url }, select: { fileName: true, userId: true } });
      if (contract) { originalName = contract.fileName; allowed = isHr || contract.userId === actor.id; }
    }
    if (!allowed) {
      const certificate = await this.prisma.certificate.findFirst({ where: { fileUrl: url }, select: { userId: true, name: true } });
      if (certificate) { originalName = certificate.name; allowed = isHr || certificate.userId === actor.id; }
    }
    if (!allowed) {
      const claim = await this.prisma.hrmsExpenseClaim.findFirst({ where: { receiptUrls: { has: url } }, select: { userId: true, title: true } });
      if (claim) { originalName = claim.title; allowed = roles.has('ADMIN') || roles.has('ACCOUNTANT') || roles.has('KM_MANAGER') || claim.userId === actor.id; }
    }
    if (!allowed) {
      const enrollment = await this.prisma.hrmsTrainingEnrollment.findFirst({ where: { evidenceUrl: url }, select: { userId: true } });
      if (enrollment) { allowed = isHr || roles.has('HR_TRAINER') || enrollment.userId === actor.id; }
    }
    if (!allowed) {
      const loan = await this.prisma.physicalRecordLoan.findFirst({ where: { evidenceUrl: url }, select: { userId: true, itemDescription: true } });
      if (loan) { originalName = loan.itemDescription; allowed = isHr || loan.userId === actor.id; }
    }
    if (!allowed) {
      const probation = await this.prisma.probationReview.findFirst({ where: { evidenceUrl: url }, select: { userId: true, managerId: true } });
      if (probation) { allowed = isHr || roles.has('BOD') || probation.userId === actor.id || probation.managerId === actor.id; }
    }
    if (!allowed) {
      const attendanceEvidence = await this.prisma.hrmsAttendanceEvidence.findFirst({ where: { fileUrl: url }, select: { userId: true } });
      if (attendanceEvidence) { originalName = 'Chứng từ chấm công'; allowed = isHr || roles.has('ACCOUNTANT') || attendanceEvidence.userId === actor.id; }
    }
    if (!allowed) {
      const offer = await this.prisma.hrmsJobOffer.findFirst({ where: { acceptedEvidenceUrl: url }, select: { applicantId: true } });
      if (offer) { allowed = roles.has('ADMIN') || roles.has('HR_RECRUITER') || roles.has('KM_MANAGER'); }
    }
    if (!allowed) {
      const articleAttachment = await this.prisma.attachment.findFirst({ where: { storageKey: key }, select: { fileName: true } });
      if (articleAttachment) {
        await this.articles.assertCanReadAttachment(key, actor);
        originalName = articleAttachment.fileName;
        allowed = true;
      }
    }
    if (!allowed) throw new NotFoundException('Không tìm thấy tập tin');

    const root = this.config.get<string>('uploadDir') ?? './uploads';
    const absolute = join(root, key);
    if (!existsSync(absolute)) throw new NotFoundException('Không tìm thấy tập tin');
    return { absolute, originalName: originalName || key, contentType: MIME[extname(key).toLowerCase()] ?? 'application/octet-stream' };
  }
}

@ApiTags('protected files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Roles(...FILE_ROLES)
  @Get(':key')
  async download(@Param('key') key: string, @CurrentUser() actor: AuthUser, @Res() response: Response) {
    const file = await this.files.resolve(key, actor);
    const asciiName = file.originalName.replace(/[^\x20-\x7E]|["\\]/g, '_').slice(0, 150) || key;
    response.status(200);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    await pipeline(createReadStream(file.absolute), response);
  }
}

@Module({ imports: [ArticlesModule], controllers: [FilesController], providers: [FilesService] })
export class FilesModule {}
