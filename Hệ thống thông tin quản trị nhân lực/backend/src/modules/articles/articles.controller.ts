import {
  Body, Controller, createParamDecorator, ExecutionContext, Get, HttpCode, HttpStatus, Param,
  Patch, Post, Put, Query, Req, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as multer from 'multer';
import * as path from 'node:path';
import { ArticlesService, randomStorageName } from './articles.service';
import { CurrentUser } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser, AuthedRequest } from '../../common/types/auth-user';

/** Cấu trúc tệp do Multer gắn vào request (định nghĩa cục bộ, không phụ thuộc global type). */
interface MulterFile {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
}

/** Param decorator lấy tệp upload từ request. */
const UploadedFileCompat = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MulterFile | undefined =>
    (ctx.switchToHttp().getRequest() as { file?: MulterFile }).file,
);

// ---------------------------------------------------------------------------
// DTOs — validate toàn bộ đầu vào của nhóm bài viết & luồng duyệt
// ---------------------------------------------------------------------------

export class CreateArticleDto {
  @IsString() @MinLength(3, { message: 'Tiêu đề tối thiểu 3 ký tự' }) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(300) summary?: string;
  @IsString() @MinLength(1, { message: 'Nội dung không được để trống' }) contentMd!: string;
  @IsOptional() @IsString() @MaxLength(200) changeNote?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString({ each: true }) tagIds?: string[];
}

export class UpdateArticleDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(300) summary?: string;
  @IsOptional() @IsString() @MinLength(1) contentMd?: string;
  @IsOptional() @IsString() @MaxLength(200) changeNote?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString({ each: true }) tagIds?: string[];
}

export class ReviewArticleDto {
  @IsIn(['APPROVE', 'REQUEST_CHANGES', 'REJECT'], { message: 'Hành động duyệt không hợp lệ' })
  action!: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}

export class ListArticlesQueryDto {
  @IsOptional() @IsIn(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']) status?: string;
  @IsOptional() @IsInt() page?: number = 1;
  @IsOptional() @IsInt() limit?: number = 10;
}

// ---------------------------------------------------------------------------
// Controller — mọi route yêu cầu đăng nhập (guard toàn cục đã chặn trước)
// ---------------------------------------------------------------------------

@ApiTags('articles')
@ApiBearerAuth()
@Controller()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post('spaces/:spaceId/articles')
  @ApiOperation({ summary: 'Tạo bài viết DRAFT trong Space (KC06)' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: AuthUser,
    @Req() req: AuthedRequest,
  ) {
    return this.articlesService.create(spaceId, dto, user, req.requestId);
  }

  @Get('spaces/:spaceId/articles')
  @ApiOperation({ summary: 'Danh sách bài viết trong Space' })
  listInSpace(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: AuthUser,
    @Query() q: ListArticlesQueryDto,
  ) {
    return this.articlesService.listInSpace(spaceId, user, q);
  }

  @Get('reviews/pending')
  @ApiOperation({ summary: 'Hộp phê duyệt cá nhân (KC11)' })
  pending(@CurrentUser() user: AuthUser, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.articlesService.pendingForMe(user, page, limit);
  }

  @Get('articles/:idOrSlug')
  @ApiOperation({ summary: 'Chi tiết bài viết kèm quyền hạn hiệu lực' })
  detail(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user: AuthUser) {
    return this.articlesService.getDetail(idOrSlug, user);
  }

  @Patch('articles/:id')
  @ApiOperation({ summary: 'Sửa bài viết — sinh phiên bản mới, bản cũ bất biến (KC07)' })
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.articlesService.update(id, dto, user, req.requestId);
  }

  @Get('articles/:id/versions')
  @ApiOperation({ summary: 'Lịch sử phiên bản (bất biến)' })
  versions(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.articlesService.versions(id, user);
  }

  @Post('articles/:id/versions/:versionNo/restore')
  @ApiOperation({ summary: 'Khôi phục nội dung từ một phiên bản cũ' })
  restore(
    @Param('id') id: string,
    @Param('versionNo') versionNo: number,
    @CurrentUser() user: AuthUser,
    @Req() req: AuthedRequest,
  ) {
    return this.articlesService.restoreVersion(id, versionNo, user, req.requestId);
  }

  @Post('articles/:id/submit')
  @ApiOperation({ summary: 'Trình duyệt bản thảo (KC09)' })
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.articlesService.submit(id, user, req.requestId);
  }

  @Post('articles/:id/review')
  @ApiOperation({ summary: 'Thẩm định: duyệt / yêu cầu chỉnh sửa / từ chối (KC10)' })
  review(@Param('id') id: string, @Body() dto: ReviewArticleDto, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.articlesService.review(id, dto, user, req.requestId);
  }

  @Post('articles/:id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.articlesService.setArchived(id, true, user, req.requestId);
  }

  @Post('articles/:id/restore')
  unarchive(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() req: AuthedRequest) {
    return this.articlesService.setArchived(id, false, user, req.requestId);
  }

  @Post('articles/:id/reaction')
  @HttpCode(HttpStatus.OK)
  react(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.articlesService.toggleReaction(id, user);
  }

  @Post('articles/:id/view')
  @HttpCode(HttpStatus.OK)
  view(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.articlesService.trackView(id, user.id);
  }

  @Put('articles/:id/bookmark')
  bookmark(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.articlesService.toggleBookmark(id, user);
  }

  /** Upload tệp đính kèm — kiểm tra loại tệp bằng whitelist phần mở rộng. */
  @Post('articles/:id/attachments')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, process.env.UPLOAD_DIR || '/app/uploads'),
        filename: (_req, file, cb) => cb(null, randomStorageName(file.originalname)),
      }),
      limits: { fileSize: Number(process.env.UPLOAD_MAX_MB || 10) * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
        const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'md', 'txt', 'docx', 'xlsx', 'pptx'];
        if (!allowed.includes(ext)) {
          cb(new BusinessException(ErrorCodes.FILE_TYPE_NOT_ALLOWED, `Định dạng .${ext} không được phép`, HttpStatus.UNSUPPORTED_MEDIA_TYPE), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadAttachment(
    @Param('id') id: string,
    @UploadedFileCompat() file: MulterFile | undefined,
    @CurrentUser() user: AuthUser,
    @Req() req: AuthedRequest,
  ) {
    if (!file) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Vui lòng chọn tệp để tải lên');
    return this.articlesService.saveAttachment(id, file, user, req.requestId);
  }
}
