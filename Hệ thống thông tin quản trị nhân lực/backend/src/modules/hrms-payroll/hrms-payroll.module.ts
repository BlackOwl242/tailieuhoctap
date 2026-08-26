import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { SalaryComponentType, PayrollRunStatus } from '@prisma/client';

export class CreateComponentDto {
  @ApiProperty({ example: 'ALLOWANCE_SKILL' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Phụ cấp Kỹ năng Chuyên môn' })
  @IsString()
  name: string;

  @ApiProperty({ enum: SalaryComponentType, default: SalaryComponentType.EARNING })
  @IsEnum(SalaryComponentType)
  type: SalaryComponentType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTaxApplicable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFormulaBased?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  defaultAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateStructureDto {
  @ApiProperty({ example: 'Cấu trúc Lương Kỹ sư Cao cấp' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: 'MONTHLY' })
  @IsOptional()
  @IsString()
  payrollFrequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: Array })
  @IsOptional()
  @IsArray()
  items?: { componentId: string; amount: number; formula?: string }[];
}

export class CreatePayrollRunDto {
  @ApiProperty({ example: 'Bảng Lương Tháng 08/2026' })
  @IsString()
  periodName: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ example: '2026-08-31T00:00:00.000Z' })
  @IsDateString()
  toDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

@Injectable()
export class HrmsPayrollService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listComponents() {
    return this.prisma.hrmsSalaryComponent.findMany({ orderBy: { type: 'asc' } });
  }

  async createComponent(actorId: string, dto: CreateComponentDto) {
    const res = await this.prisma.hrmsSalaryComponent.create({ data: dto });
    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsSalaryComponent',
      targetId: res.id,
      description: `Tạo thành phần lương: [${dto.code}] ${dto.name}`,
    });
    return res;
  }

  async listStructures() {
    return this.prisma.hrmsSalaryStructure.findMany({
      include: {
        items: { include: { component: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStructure(actorId: string, dto: CreateStructureDto) {
    const res = await this.prisma.hrmsSalaryStructure.create({
      data: {
        name: dto.name,
        payrollFrequency: dto.payrollFrequency ?? 'MONTHLY',
        description: dto.description,
        items: dto.items && dto.items.length > 0 ? {
          create: dto.items.map((item) => ({
            componentId: item.componentId,
            amount: item.amount,
            formula: item.formula,
          })),
        } : undefined,
      },
      include: { items: { include: { component: true } } },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsSalaryStructure',
      targetId: res.id,
      description: `Tạo cấu trúc lương: ${dto.name}`,
    });
    return res;
  }

  async assignStructure(actorId: string, structureId: string, userId: string, baseSalary: number) {
    const structure = await this.prisma.hrmsSalaryStructure.findUnique({ where: { id: structureId } });
    if (!structure) throw new NotFoundException('Không tìm thấy cấu trúc lương');

    await this.prisma.hrmsSalaryStructureAssignment.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const res = await this.prisma.hrmsSalaryStructureAssignment.create({
      data: {
        userId,
        structureId,
        baseSalary,
        fromDate: new Date(),
        isActive: true,
      },
      include: { structure: true },
    });

    await this.audit.log({
      actorId,
      action: 'ASSIGN_SALARY_STRUCTURE',
      targetType: 'HrmsSalaryStructureAssignment',
      targetId: res.id,
      description: `Gán cấu trúc lương ${structure.name} cho nhân sự ${userId} (Lương cơ bản: ${baseSalary.toLocaleString('vi-VN')} VND)`,
    });
    return res;
  }

  async listPayrollRuns() {
    return this.prisma.hrmsPayrollRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { slips: true } } },
    });
  }

  async createPayrollRun(actorId: string, dto: CreatePayrollRunDto) {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, fullName: true, employeeCode: true, jobTitle: true, baseSalary: true,
        orgUnit: { select: { name: true } },
      },
    });

    const run = await this.prisma.hrmsPayrollRun.create({
      data: {
        periodName: dto.periodName,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        status: PayrollRunStatus.PROCESSED,
        notes: dto.notes,
        processedBy: actorId,
        processedAt: new Date(),
      },
    });

    let totalGross = 0;
    let totalDeduction = 0;
    let totalNet = 0;

    for (const u of users) {
      const base = u.baseSalary || 15000000;
      const lunch = 730000;
      const gross = base + lunch;
      const bhxh = Math.round(base * 0.08);
      const bhyt = Math.round(base * 0.015);
      const bhtn = Math.round(base * 0.01);
      const taxable = Math.max(0, gross - lunch - 11000000);
      const pit = Math.round(taxable * 0.05);
      const deduction = bhxh + bhyt + bhtn + pit;
      const net = gross - deduction;

      totalGross += gross;
      totalDeduction += deduction;
      totalNet += net;

      await this.prisma.hrmsPayrollSlip.create({
        data: {
          payrollRunId: run.id,
          userId: u.id,
          employeeName: u.fullName,
          employeeCode: u.employeeCode,
          department: u.orgUnit?.name ?? 'Chưa phân bổ',
          jobTitle: u.jobTitle ?? 'Nhân viên',
          baseSalary: base,
          grossPay: gross,
          totalDeduction: deduction,
          netPay: net,
          breakdown: {
            earnings: [
              { name: 'Lương Cơ bản', amount: base },
              { name: 'Phụ cấp Ăn trưa (Miễn thuế)', amount: lunch },
            ],
            deductions: [
              { name: 'Bảo hiểm Xã hội (8%)', amount: bhxh },
              { name: 'Bảo hiểm Y tế (1.5%)', amount: bhyt },
              { name: 'Bảo hiểm Thất nghiệp (1%)', amount: bhtn },
              { name: 'Thuế Thu nhập Cá nhân (TNCN)', amount: pit },
            ],
          },
          status: 'APPROVED',
        },
      });
    }

    const updatedRun = await this.prisma.hrmsPayrollRun.update({
      where: { id: run.id },
      data: {
        totalEmployees: users.length,
        totalGrossPay: totalGross,
        totalDeduction,
        totalNetPay: totalNet,
      },
      include: { slips: true },
    });

    await this.audit.log({
      actorId,
      action: 'PROCESS_PAYROLL',
      targetType: 'HrmsPayrollRun',
      targetId: run.id,
      description: `Xử lý bảng lương ${dto.periodName} cho ${users.length} nhân viên (Tổng thực lĩnh: ${totalNet.toLocaleString('vi-VN')} VND)`,
    });

    return updatedRun;
  }

  async getSlip(id: string) {
    const slip = await this.prisma.hrmsPayrollSlip.findUnique({
      where: { id },
      include: { payrollRun: true },
    });
    if (!slip) throw new NotFoundException('Không tìm thấy phiếu lương');
    return slip;
  }

  async listSlipsByUser(userId: string) {
    return this.prisma.hrmsPayrollSlip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { payrollRun: true },
    });
  }
}

@ApiTags('HRMS - Payroll & Compensation')
@ApiBearerAuth()
@Controller('hrms/payroll')
export class HrmsPayrollController {
  constructor(private readonly service: HrmsPayrollService) {}

  @Get('components')
  listComponents() {
    return this.service.listComponents();
  }

  @Post('components')
  createComponent(@Body() dto: CreateComponentDto) {
    return this.service.createComponent('system', dto);
  }

  @Get('structures')
  listStructures() {
    return this.service.listStructures();
  }

  @Post('structures')
  createStructure(@Body() dto: CreateStructureDto) {
    return this.service.createStructure('system', dto);
  }

  @Post('structures/:id/assign')
  assign(@Param('id') id: string, @Body() body: { userId: string; baseSalary: number }) {
    return this.service.assignStructure('system', id, body.userId, body.baseSalary);
  }

  @Get('runs')
  listRuns() {
    return this.service.listPayrollRuns();
  }

  @Post('runs')
  createRun(@Body() dto: CreatePayrollRunDto) {
    return this.service.createPayrollRun('system', dto);
  }

  @Get('slips/:id')
  getSlip(@Param('id') id: string) {
    return this.service.getSlip(id);
  }

  @Get('my-slips')
  mySlips(@Query('userId') userId: string) {
    return this.service.listSlipsByUser(userId);
  }
}

@Module({
  controllers: [HrmsPayrollController],
  providers: [HrmsPayrollService],
  exports: [HrmsPayrollService],
})
export class HrmsPayrollModule {}
