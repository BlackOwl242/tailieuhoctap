import { ConflictException, ForbiddenException, Patch, Query } from '@nestjs/common';
import {
  BadRequestException, Body, Controller, Delete, Get, HttpStatus, Injectable, Module,
  NotFoundException, Param, Post, Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

const CATEGORIES = ['POLICY', 'FORM', 'DECISION', 'PROCESS', 'REPORT', 'OTHER'] as const;

class CreateDocumentDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiProperty() @IsEnum(CATEGORIES) category!: (typeof CATEGORIES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) processArea?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) version?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentMd?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  /** Tập tin đính kèm: { name, mimeType, sizeBytes, dataBase64 } — tối đa 8MB. */
  @ApiPropertyOptional() @IsOptional() @IsObject() file?: { name: string; mimeType: string; sizeBytes: number; dataBase64: string };
}

/**
 * Mục 8 — Kho tài liệu quy trình nhân sự: chính sách, biểu mẫu, quyết định,
 * quy trình nghiệp vụ, báo cáo. Lưu metadata trong DB, tập tin lưu UPLOAD_DIR
 * (đã được phục vụ tĩnh tại /uploads) kèm tên ngẫu nhiên chống đè.
 */
@Injectable()
export class DocumentsService {
  private readonly allowedExt = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.md', '.txt', '.csv']);
  private readonly maxBytes = 8 * 1024 * 1024;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  list(category?: string, processArea?: string, actor?: AuthUser, q?: string) {
    return this.prisma.hrDocument.findMany({
      where: {
        ...(actor?.roles.some(role => ['ADMIN','KM_MANAGER'].includes(role)) ? { status: { not: 'ARCHIVED' } } : { status: 'PUBLISHED' }),
        ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { contentMd: { contains: q, mode: 'insensitive' as const } }, { description: { contains: q, mode: 'insensitive' as const } }, { tags: { has: q } }] } : {}),
        ...(category ? { category: category as never } : {}),
        ...(processArea ? { processArea } : {}),
      },
      include: { uploader: { select: { fullName: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string, actor?: AuthUser) {
    const doc = await this.prisma.hrDocument.findUnique({
      where: { id },
      include: { uploader: { select: { fullName: true } } },
    });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');
    if (doc.status !== 'PUBLISHED' && !actor?.roles.some(role => ['ADMIN','KM_MANAGER'].includes(role))) throw new ForbiddenException('Tài liệu chưa được công bố');
    return doc;
  }

  private async saveFile(file: NonNullable<CreateDocumentDto['file']>): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    const ext = extname(file.name).toLowerCase();
    if (!this.allowedExt.has(ext)) {
      throw new BusinessException(ErrorCodes.FILE_TYPE_NOT_ALLOWED, `Không cho phép tập tin ${ext || '(không có đuôi)'}`, HttpStatus.BAD_REQUEST);
    }
    const buffer = Buffer.from(file.dataBase64, 'base64');
    if (buffer.length === 0) throw new BadRequestException('Tập tin rỗng');
    if (buffer.length > this.maxBytes) {
      throw new BusinessException(ErrorCodes.FILE_TOO_LARGE, 'Tập tin vượt quá 8MB', HttpStatus.BAD_REQUEST);
    }
    const uploadDir = this.config.get<string>('uploadDir') ?? './uploads';
    const storageKey = `${randomUUID()}${ext}`;
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, storageKey), buffer);
    return { fileUrl: `/uploads/${storageKey}`, fileName: file.name, fileSize: buffer.length };
  }

  async create(dto: CreateDocumentDto, actor: AuthUser, requestId?: string) {
    let fileMeta: { fileUrl: string; fileName: string; fileSize: number } | undefined;
    if (dto.file) fileMeta = await this.saveFile(dto.file);

    const doc = await this.prisma.hrDocument.create({
      data: {
        title: dto.title,
        category: dto.category,
        processArea: dto.processArea,
        version: dto.version ?? '1.0',
        description: dto.description,
        contentMd: dto.contentMd,
        tags: dto.tags ?? [],
        fileUrl: fileMeta?.fileUrl,
        fileName: fileMeta?.fileName,
        fileSize: fileMeta?.fileSize,
        uploadedById: actor.id,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: 'HR_DOCUMENT_CREATED', entityType: 'HrDocument', entityId: doc.id,
      after: { title: dto.title, category: dto.category }, requestId,
    });
    return doc;
  }

  async update(id: string, dto: CreateDocumentDto, actor: AuthUser, requestId?: string) {
    const doc = await this.prisma.hrDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');
    let fileMeta: { fileUrl: string; fileName: string; fileSize: number } | undefined;
    if (dto.file) fileMeta = await this.saveFile(dto.file);

    return this.prisma.$transaction(async tx => {
    const current = await tx.hrDocument.findUniqueOrThrow({ where: { id } });
    if (current.status === 'ARCHIVED') throw new ConflictException('Tài liệu đã lưu trữ');
    const revision = await tx.hrDocumentRevision.count({ where: { documentId: id } });
    await tx.hrDocumentRevision.create({ data: { documentId: id, revision: revision + 1, snapshot: JSON.parse(JSON.stringify(current)), createdBy: actor.id } });
    const updated = await tx.hrDocument.update({
      where: { id },
      data: {
        status: 'DRAFT', reviewedBy: null,
        title: dto.title,
        category: dto.category,
        processArea: dto.processArea,
        version: String(revision + 2),
        description: dto.description,
        contentMd: dto.contentMd,
        tags: dto.tags ?? doc.tags,
        ...(fileMeta ?? {}),
      },
    });
    await tx.auditLog.create({ data: { actorId: actor.id, action: 'HR_DOCUMENT_UPDATED', entityType: 'HrDocument', entityId: id, requestId } });
    return updated;
    }, { isolationLevel: 'Serializable' });
  }

  history(id: string) { return this.prisma.hrDocumentRevision.findMany({ where: { documentId: id }, orderBy: { revision: 'desc' } }); }
  async publish(id: string, actor: AuthUser) {
    return this.prisma.$transaction(async tx => {
      const doc = await tx.hrDocument.findUniqueOrThrow({ where: { id } });
      const last = await tx.hrDocumentRevision.findFirst({ where: { documentId: id }, orderBy: { revision: 'desc' } });
      if (doc.status !== 'DRAFT') throw new ConflictException('Chỉ công bố bản nháp');
      if (actor.id === (last?.createdBy ?? doc.uploadedById)) throw new ForbiddenException('Người biên soạn không được tự công bố');
      if (!doc.contentMd?.trim() && !doc.fileUrl) throw new ConflictException('Cần nội dung hoặc tập tin trước khi công bố');
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'HR_DOCUMENT_PUBLISHED', entityType: 'HrDocument', entityId: id } });
      return tx.hrDocument.update({ where: { id }, data: { status: 'PUBLISHED', reviewedBy: actor.id } });
    }, { isolationLevel: 'Serializable' });
  }

  async remove(id: string, actor: AuthUser, requestId?: string) {
    const doc = await this.prisma.hrDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');
    await this.prisma.hrDocument.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await this.audit.log({
      actorId: actor.id, action: 'HR_DOCUMENT_DELETED', entityType: 'HrDocument', entityId: id, requestId,
    });
    return { success: true };
  }
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  list(@CurrentUser() actor: AuthUser, @Query('category') category?: string, @Query('processArea') processArea?: string, @Query('q') q?: string) {
    return this.service.list(category, processArea, actor, q);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.get(id, actor);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Get(':id/history') history(@Param('id') id: string) { return this.service.history(id); }
  @Roles('ADMIN', 'KM_MANAGER')
  @Post(':id/publish') publish(@Param('id') id: string, @CurrentUser() actor: AuthUser) { return this.service.publish(id, actor); }
  @Roles('ADMIN', 'KM_MANAGER')
  @Post()
  create(@Body() dto: CreateDocumentDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateDocumentDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user);
  }
}

@Module({ controllers: [DocumentsController], providers: [DocumentsService] })
export class DocumentsModule {}
