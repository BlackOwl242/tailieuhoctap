import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã vai trò không được để trống' })
  @MaxLength(40)
  @Matches(/^[A-Z0-9_]+$/, { message: 'Mã vai trò chỉ chứa chữ in hoa, số và dấu gạch dưới (A-Z, 0-9, _)' })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên vai trò không được để trống' })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export const DEFAULT_RBAC_MATRIX = [
  {
    moduleKey: 'ESS',
    moduleName: 'Cổng Tự Phục Vụ (ESS) & Bàn Làm Việc',
    permissions: {
      USER: 'Tự phục vụ cá nhân (Điểm danh, đơn từ, phiếu lương)',
      LINE_MANAGER: 'Quyền cá nhân + Phê duyệt đơn từ của nhân viên trực thuộc',
      HR_RECRUITER: 'Quyền cá nhân + Theo dõi tiếp nhận ứng viên mới',
      HR_CB: 'Quyền cá nhân + Tra cứu nhanh dữ liệu lương & đãi ngộ',
      ACCOUNTANT: 'Quyền cá nhân + Theo dõi chứng từ thanh toán',
      HR_TRAINER: 'Quyền cá nhân + Lộ trình đào tạo cá nhân',
      AUDITOR: 'Quyền cá nhân + Giám sát tuân thủ quy trình',
      BOD: 'Quyền cá nhân + Bảng điều khiển điều hành Ban Giám Đốc (CEO)',
      SHAREHOLDER: 'Xem Dashboard tổng quan & Báo cáo điều hành HĐQT / ĐHCĐ',
      KM_MANAGER: 'Đầy đủ quyền cá nhân + Bảng điều khiển quản lý nhân sự',
      ADMIN: 'Toàn quyền kỹ thuật CNTT (Cấu hình, RBAC, bảo mật hệ thống)',
    },
  },
  {
    moduleKey: 'EMPLOYEES',
    moduleName: 'Hồ Sơ Nhân Sự & Hợp Đồng Lao Động',
    permissions: {
      USER: 'Chỉ xem hồ sơ cá nhân của mình',
      LINE_MANAGER: 'Xem danh sách hồ sơ nhân viên trong bộ phận phụ trách',
      HR_RECRUITER: 'Tiếp nhận ứng viên trúng tuyển vào hồ sơ thử việc',
      HR_CB: 'Xem và quản lý hợp đồng lao động, mức lương đóng BHXH',
      ACCOUNTANT: 'Xem thông tin tài khoản ngân hàng và mã số thuế cá nhân',
      HR_TRAINER: 'Xem hồ sơ năng lực, bằng cấp và chứng chỉ chuyên môn',
      AUDITOR: 'Tra cứu hồ sơ nhân sự, rà soát tính pháp lý hợp đồng',
      BOD: 'Xem toàn bộ hồ sơ nhân sự và ký duyệt hợp đồng lao động',
      SHAREHOLDER: 'Xem cơ cấu tổ chức, định biên nhân sự và quy mô toàn công ty',
      KM_MANAGER: 'Toàn quyền tạo mới, sửa đổi, cập nhật hồ sơ và hợp đồng',
      ADMIN: 'Quản trị kỹ thuật CSDL nhân sự, phân bổ dữ liệu hệ thống',
    },
  },
  {
    moduleKey: 'ATTENDANCE',
    moduleName: 'Chấm Công, Phân Ca & Máy Điểm Danh',
    permissions: {
      USER: 'Điểm danh cá nhân, nộp giải trình công',
      LINE_MANAGER: 'Duyệt giải trình công, phân ca kíp cho nhóm trực thuộc',
      HR_RECRUITER: 'Không có quyền truy cập',
      HR_CB: 'Tổng hợp công tháng, đối soát OT để chuyển sang tính lương',
      ACCOUNTANT: 'Xem tổng hợp ngày công thực tế tính lương',
      HR_TRAINER: 'Không có quyền truy cập',
      AUDITOR: 'Kiểm tra dữ liệu chấm công và tuân thủ thời giờ làm việc',
      BOD: 'Xem thống kê tỷ lệ đi làm và làm thêm giờ toàn công ty',
      SHAREHOLDER: 'Xem báo cáo tỷ lệ chuyên cần và năng suất lao động cấp công ty',
      KM_MANAGER: 'Phân ca nhân viên, tổng hợp và chốt bảng công tháng',
      ADMIN: 'Cấu hình kết nối thiết bị máy chấm công, giám sát đồng bộ',
    },
  },
  {
    moduleKey: 'PAYROLL',
    moduleName: 'Vận Hành Tiền Lương & Khoản Vay',
    permissions: {
      USER: 'Chỉ xem phiếu lương cá nhân',
      LINE_MANAGER: 'Xem tổng hợp chi phí lương bộ phận (nếu được ủy quyền)',
      HR_RECRUITER: 'Không có quyền truy cập',
      HR_CB: 'Vận hành tính lương tự động, trích đóng BHXH, thuế TNCN',
      ACCOUNTANT: 'Đối soát bảng thanh toán, duyệt chi tạm ứng và công tác phí',
      HR_TRAINER: 'Không có quyền truy cập',
      AUDITOR: 'Kiểm toán tính chính xác công thức lương và khấu trừ thuế',
      BOD: 'Ký phê duyệt bảng lương tháng và quỹ phúc lợi công ty',
      SHAREHOLDER: 'Xem tổng hợp quỹ lương, chi phí nhân sự và báo cáo tài chính',
      KM_MANAGER: 'Tính lương tự động, kết xuất bảng thanh toán, duyệt vay',
      ADMIN: 'Cấu hình công thức lương, ngạch bậc và tham số hệ thống',
    },
  },
  {
    moduleKey: 'RECRUITMENT',
    moduleName: 'Tuyển Dụng ATS & Tiếp Nhận Nhân Sự',
    permissions: {
      USER: 'Không có quyền truy cập',
      LINE_MANAGER: 'Đề xuất nhu cầu tuyển dụng, tham gia phỏng vấn chuyên môn',
      HR_RECRUITER: 'Toàn quyền quản trị tin tuyển dụng, CV, lịch phỏng vấn và ATS',
      HR_CB: 'Đề xuất khung lương offer cho ứng viên',
      ACCOUNTANT: 'Không có quyền truy cập',
      HR_TRAINER: 'Tiếp nhận danh sách trúng tuyển để chuẩn bị đào tạo',
      AUDITOR: 'Giám sát tính minh bạch trong quy trình tuyển dụng',
      BOD: 'Phê duyệt chỉ tiêu tuyển dụng và chiến lược nhân sự',
      SHAREHOLDER: 'Xem kế hoạch định biên dài hạn và chiến lược thu hút nhân tài',
      KM_MANAGER: 'Quản lý tin tuyển dụng, hồ sơ ứng viên, lịch phỏng vấn',
      ADMIN: 'Quản trị kỹ thuật phân hệ ATS và luồng dữ liệu ứng viên',
    },
  },
  {
    moduleKey: 'PERFORMANCE',
    moduleName: 'Đánh Giá 360, Đào Tạo & Khiếu Nại',
    permissions: {
      USER: 'Tự đánh giá, đánh giá chéo, gửi khiếu nại',
      LINE_MANAGER: 'Giao KPI, đánh giá hiệu suất nhân viên bộ phận',
      HR_RECRUITER: 'Đánh giá năng lực ứng viên trong giai đoạn thử việc',
      HR_CB: 'Căn cứ kết quả KPI để tính thưởng hiệu suất',
      ACCOUNTANT: 'Không có quyền truy cập',
      HR_TRAINER: 'Quản trị ngân hàng khóa học, kế hoạch đào tạo và khảo sát',
      AUDITOR: 'Giám sát giải quyết khiếu nại và tuân thủ quy trình đánh giá',
      BOD: 'Phê duyệt khung KPI cấp công ty, kết quả khen thưởng/kỷ luật',
      SHAREHOLDER: 'Xem tổng quan kết quả thực hiện mục tiêu chiến lược (OKR/KPI)',
      KM_MANAGER: 'Quản trị chương trình đào tạo, tiếp nhận và giải quyết khiếu nại',
      ADMIN: 'Giám sát kỹ thuật và bảo mật kênh khiếu nại ẩn danh',
    },
  },
  {
    moduleKey: 'REPORTS',
    moduleName: 'Báo Cáo Nhân Lực & Thống Kê BLLĐ',
    permissions: {
      USER: 'Không có quyền truy cập',
      LINE_MANAGER: 'Báo cáo nhân sự và hiệu suất của bộ phận',
      HR_RECRUITER: 'Báo cáo hiệu quả kênh tuyển dụng, tỷ lệ tuyển thành công',
      HR_CB: 'Báo cáo chi phí tiền lương, bảo hiểm và biến động thu nhập',
      ACCOUNTANT: 'Báo cáo chi phí công tác phí và ngân sách nhân sự',
      HR_TRAINER: 'Báo cáo đào tạo, thời lượng và tỷ lệ hoàn thành khóa học',
      AUDITOR: 'Báo cáo kiểm toán tuân thủ BLLĐ, rủi ro pháp lý',
      BOD: 'Báo cáo điều hành quản trị cấp cao, Dashboard nhân lực tổng thể',
      SHAREHOLDER: 'Báo cáo thường niên ĐHCĐ, báo cáo ESG và kiểm toán nhân sự',
      KM_MANAGER: 'Xem và xuất các báo cáo mẫu 2C-BNV, biến động lao động',
      ADMIN: 'Toàn quyền xuất và giám sát tính toàn vẹn dữ liệu báo cáo',
    },
  },
  {
    moduleKey: 'SYSTEM',
    moduleName: 'Cấu Hình Hệ Thống, Phân Quyền & Tham Số',
    permissions: {
      USER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      LINE_MANAGER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      HR_RECRUITER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      HR_CB: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      ACCOUNTANT: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      HR_TRAINER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      AUDITOR: 'Tra cứu nhật ký kiểm toán hệ thống (Audit Logs)',
      BOD: 'Xem thông tin phiên bản và cấu hình vận hành chung',
      SHAREHOLDER: 'Xem báo cáo kiểm toán bảo mật và tuân thủ an toàn thông tin',
      KM_MANAGER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      ADMIN: 'Toàn quyền Quản trị viên Hệ thống: RBAC, Tham số, Nhật ký kiểm toán, Máy chấm công',
    },
  },
];

@ApiTags('roles')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Lấy danh sách tất cả các vai trò và số lượng người dùng */
  @Get()
  async listRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    return roles.map((r) => ({
      code: r.code,
      name: r.name,
      description: r.description,
      userCount: r._count.users,
      isSystem: ['ADMIN', 'KM_MANAGER', 'USER'].includes(r.code),
    }));
  }

  /** Thêm vai trò mới */
  @Post()
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthUser) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.role.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Mã vai trò "${code}" đã tồn tại trên hệ thống`);
    }

    const role = await this.prisma.role.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'ROLE_CREATED',
      entityType: 'Role',
      entityId: code,
      after: role,
    });

    return {
      ...role,
      userCount: 0,
      isSystem: false,
    };
  }

  /** Cập nhật tên, mô tả vai trò */
  @Patch(':code')
  async updateRole(
    @Param('code') code: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    const existing = await this.prisma.role.findUnique({ where: { code } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy vai trò "${code}"`);
    }

    const role = await this.prisma.role.update({
      where: { code },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'ROLE_UPDATED',
      entityType: 'Role',
      entityId: code,
      before: existing,
      after: role,
    });

    return role;
  }

  /** Xóa vai trò tùy biến (không cho phép xóa vai trò cốt lõi ADMIN, KM_MANAGER, USER) */
  @Delete(':code')
  async deleteRole(@Param('code') code: string, @CurrentUser() user: AuthUser) {
    if (['ADMIN', 'KM_MANAGER', 'USER'].includes(code)) {
      throw new BadRequestException('Không thể xóa các vai trò cốt lõi của hệ thống');
    }

    const existing = await this.prisma.role.findUnique({
      where: { code },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy vai trò "${code}"`);
    }

    if (existing._count.users > 0) {
      throw new BadRequestException(
        `Không thể xóa vai trò "${code}" vì đang có ${existing._count.users} tài khoản được gán vai trò này. Vui lòng chuyển đổi vai trò cho tài khoản trước khi xóa.`,
      );
    }

    await this.prisma.role.delete({ where: { code } });

    await this.audit.log({
      actorId: user.id,
      action: 'ROLE_DELETED',
      entityType: 'Role',
      entityId: code,
      before: existing,
    });

    return { success: true, message: `Đã xóa vai trò "${code}" thành công` };
  }

  /** Lấy ma trận phân quyền hiện hành */
  @Get('matrix')
  async getMatrix() {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'RBAC_PERMISSIONS_MATRIX' },
    });

    if (setting?.value && Array.isArray(setting.value)) {
      return setting.value;
    }
    return DEFAULT_RBAC_MATRIX;
  }

  /** Lưu cấu hình ma trận phân quyền */
  @Put('matrix')
  async saveMatrix(
    @Body() body: { matrix: typeof DEFAULT_RBAC_MATRIX },
    @CurrentUser() user: AuthUser,
  ) {
    if (!body.matrix || !Array.isArray(body.matrix)) {
      throw new BadRequestException('Dữ liệu ma trận phân quyền không hợp lệ');
    }

    await this.prisma.setting.upsert({
      where: { key: 'RBAC_PERMISSIONS_MATRIX' },
      create: {
        key: 'RBAC_PERMISSIONS_MATRIX',
        value: body.matrix as any,
        updatedBy: user.id,
      },
      update: {
        value: body.matrix as any,
        updatedBy: user.id,
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'RBAC_MATRIX_UPDATED',
      entityType: 'Setting',
      entityId: 'RBAC_PERMISSIONS_MATRIX',
      after: body.matrix,
    });

    return { success: true, matrix: body.matrix };
  }
}
