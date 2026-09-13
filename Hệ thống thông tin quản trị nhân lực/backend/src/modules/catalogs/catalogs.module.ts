import {
  Body, Controller, Delete, Get, Injectable, Module,
  NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTO helpers
// ---------------------------------------------------------------------------

interface CreateItemDto {
  code: string;
  name: string;
  extra?: Record<string, unknown>;
  sortOrder?: number;
}

interface UpdateItemDto {
  code?: string;
  name?: string;
  extra?: Record<string, unknown>;
  sortOrder?: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class CatalogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Trả về toàn bộ cấu trúc groups → catalogs → items (phục vụ trang /admin/catalogs). */
  async findAll() {
    const groups = await this.prisma.masterCatalogGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        catalogs: {
          orderBy: { name: 'asc' },
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    return {
      groups: groups.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        catalogs: g.catalogs.map((c) => ({
          id: c.id,
          name: c.name,
          count: c.items.length,
          items: c.items.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            sortOrder: item.sortOrder,
            ...(item.extra as Record<string, unknown> ?? {}),
          })),
        })),
      })),
    };
  }

  /** Lấy danh sách item của 1 catalog cụ thể. */
  async findCatalogItems(catalogId: string, search?: string) {
    const catalog = await this.prisma.masterCatalog.findUnique({
      where: { id: catalogId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!catalog) throw new NotFoundException(`Không tìm thấy danh mục "${catalogId}"`);

    let items = catalog.items;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (it) => it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q),
      );
    }

    return {
      id: catalog.id,
      name: catalog.name,
      count: items.length,
      items: items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        sortOrder: item.sortOrder,
        ...(item.extra as Record<string, unknown> ?? {}),
      })),
    };
  }

  /** Thêm item mới vào 1 catalog. */
  async createItem(catalogId: string, dto: CreateItemDto, actor: AuthUser) {
    const catalog = await this.prisma.masterCatalog.findUnique({ where: { id: catalogId } });
    if (!catalog) throw new NotFoundException(`Không tìm thấy danh mục "${catalogId}"`);

    const item = await this.prisma.masterCatalogItem.create({
      data: {
        catalogId,
        code: dto.code.trim(),
        name: dto.name.trim(),
        extra: (dto.extra ?? undefined) as any,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'CATALOG_ITEM_CREATED',
      entityType: 'MasterCatalogItem',
      entityId: item.id,
      after: { catalogId, code: dto.code, name: dto.name },
    });

    return item;
  }

  /** Cập nhật item trong catalog. */
  async updateItem(itemId: string, dto: UpdateItemDto, actor: AuthUser) {
    const existing = await this.prisma.masterCatalogItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new NotFoundException(`Không tìm thấy mục "${itemId}"`);

    const updated = await this.prisma.masterCatalogItem.update({
      where: { id: itemId },
      data: {
        ...(dto.code !== undefined && { code: dto.code.trim() }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.extra !== undefined && { extra: dto.extra as any }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'CATALOG_ITEM_UPDATED',
      entityType: 'MasterCatalogItem',
      entityId: itemId,
      before: { code: existing.code, name: existing.name },
      after: { code: updated.code, name: updated.name },
    });

    return updated;
  }

  /** Xóa item khỏi catalog. */
  async deleteItem(itemId: string, actor: AuthUser) {
    const existing = await this.prisma.masterCatalogItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new NotFoundException(`Không tìm thấy mục "${itemId}"`);

    await this.prisma.masterCatalogItem.delete({ where: { id: itemId } });

    await this.audit.log({
      actorId: actor.id,
      action: 'CATALOG_ITEM_DELETED',
      entityType: 'MasterCatalogItem',
      entityId: itemId,
      before: { code: existing.code, name: existing.name, catalogId: existing.catalogId },
    });

    return { deleted: true };
  }

  /** Khôi phục toàn bộ danh mục về dữ liệu gốc (xóa hết → seed lại). */
  async resetToDefaults(actor: AuthUser) {
    // Xóa toàn bộ theo cascade: groups → catalogs → items
    await this.prisma.masterCatalogItem.deleteMany();
    await this.prisma.masterCatalog.deleteMany();
    await this.prisma.masterCatalogGroup.deleteMany();

    await this.audit.log({
      actorId: actor.id,
      action: 'CATALOGS_RESET_TO_DEFAULTS',
      entityType: 'MasterCatalogGroup',
    });

    return { reset: true, message: 'Vui lòng chạy lại seed để nạp dữ liệu gốc.' };
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('catalogs')
@ApiBearerAuth()
@Controller()
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}

  /** Trả toàn bộ cấu trúc danh mục (groups → catalogs → items). */
  @Get('admin/catalogs')
  findAll() {
    return this.service.findAll();
  }

  /** Lấy danh sách item của 1 catalog cụ thể. */
  @Get('admin/catalogs/:catalogId/items')
  findCatalogItems(
    @Param('catalogId') catalogId: string,
    @Query('search') search?: string,
  ) {
    return this.service.findCatalogItems(catalogId, search);
  }

  /** Thêm item mới vào catalog (chỉ ADMIN). */
  @Roles('ADMIN')
  @Post('admin/catalogs/:catalogId/items')
  createItem(
    @Param('catalogId') catalogId: string,
    @Body() dto: CreateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createItem(catalogId, dto, user);
  }

  /** Cập nhật item (chỉ ADMIN). */
  @Roles('ADMIN')
  @Patch('admin/catalogs/items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateItem(itemId, dto, user);
  }

  /** Xóa item (chỉ ADMIN). */
  @Roles('ADMIN')
  @Delete('admin/catalogs/items/:itemId')
  deleteItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.deleteItem(itemId, user);
  }

  /** Khôi phục danh mục về mặc định (chỉ ADMIN). */
  @Roles('ADMIN')
  @Post('admin/catalogs/reset')
  resetDefaults(@CurrentUser() user: AuthUser) {
    return this.service.resetToDefaults(user);
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  controllers: [CatalogsController],
  providers: [CatalogsService],
  exports: [CatalogsService],
})
export class CatalogsModule {}
