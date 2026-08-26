import {
  Controller, Get, Injectable, Module, NotFoundException, Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { Roles } from '../../common/decorators';

@Injectable()
export class PersonnelReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Xuất dữ liệu Sơ yếu lý lịch chuẩn 4 trang (111 trường thông tin).
   * Cung cấp dữ liệu có cấu trúc phục vụ render bản in A4 / PDF Vector.
   */
  async get2cProfileData(userId: string) {
    const profile = await this.prisma.personnelComprehensiveProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            employeeCode: true,
            hireDate: true,
            employmentStatus: true,
            birthDate: true,
            phone: true,
            address: true,
            jobTitle: true,
            avatarUrl: true,
            orgUnit: { select: { id: true, name: true, code: true } },
          },
        },
        rank: true,
        salaryHistories: { orderBy: { fromDate: 'asc' }, include: { rank: true } },
        appointments: { orderBy: { effectiveDate: 'asc' } },
        educations: { orderBy: { graduationYear: 'asc' } },
        workHistories: { orderBy: { fromDate: 'asc' } },
        rewardDisciplines: { orderBy: { eventDate: 'asc' } },
        familyRelations: { orderBy: { relationType: 'asc' } },
        appraisals: { orderBy: { year: 'desc' } },
        socialActivities: { orderBy: { fromDate: 'asc' } },
      },
    });

    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ nhân sự');

    // Chia nhóm quan hệ gia đình (Bản thân vs Bên Vợ/Chồng)
    const selfRelations = profile.familyRelations.filter((r) => r.category === 'SELF');
    const spouseRelations = profile.familyRelations.filter((r) => r.category === 'SPOUSE');

    return {
      title: 'SƠ YẾU LÝ LỊCH NHÂN SỰ TOÀN DIỆN',
      meta: {
        employeeCode: profile.user.employeeCode,
        fullName: profile.user.fullName,
        jobTitle: profile.user.jobTitle,
        orgUnitName: profile.user.orgUnit?.name,
        exportedAt: new Date().toISOString(),
      },
      page1: {
        sectionTitle: 'I. THÔNG TIN CÁ NHÂN & LÝ LỊCH',
        fullName: profile.user.fullName,
        aliasName: profile.aliasName || 'Không',
        gender: profile.gender || 'Nam',
        birthDate: profile.user.birthDate,
        birthPlace: profile.birthPlace,
        hometown: profile.hometown,
        permanentAddress: profile.permanentAddress || profile.user.address,
        currentAddress: profile.currentAddress || profile.user.address,
        idCardNo: profile.idCardNo,
        idCardIssueDate: profile.idCardIssueDate,
        idCardIssuePlace: profile.idCardIssuePlace,
        ethnicity: profile.ethnicity || 'Kinh',
        religion: profile.religion || 'Không',
        familyOrigin: profile.familyOrigin || 'Viên chức',
        priorJob: profile.priorJob,
      },
      page2: {
        sectionTitle: 'II. TUYỂN DỤNG, NGẠCH BẬC & TRÌNH ĐỘ',
        recruitDate: profile.recruitDate || profile.user.hireDate,
        recruitOrg: profile.recruitOrg,
        currentOrgDate: profile.currentOrgDate,
        officialDate: profile.officialDate,
        govPosition: profile.govPosition || profile.user.jobTitle,
        mainDuty: profile.mainDuty,
        rankCode: profile.rankCode,
        rankName: profile.rank?.name,
        salaryStep: profile.salaryStep,
        totalSteps: profile.rank?.totalSteps || 9,
        salaryCoefficient: profile.salaryCoefficient,
        salaryStepDate: profile.salaryStepDate,
        overGradePercent: profile.overGradePercent || 0,
        positionAllowance: profile.positionAllowance || 0,
        otherAllowance: profile.otherAllowance || 0,
        socialInsuranceNo: profile.socialInsuranceNo,
        generalEducation: profile.generalEducation || '12/12',
        highestDegree: profile.highestDegree,
        majorName: profile.majorName,
        academicTitle: profile.academicTitle,
        politicalTheory: profile.politicalTheory || 'Không',
        stateManagement: profile.stateManagement,
        foreignLanguage: profile.foreignLanguage,
        informaticsLevel: profile.informaticsLevel,
        unionJoinDate: profile.unionJoinDate,
        partyJoinDate: profile.partyJoinDate,
        partyOfficialDate: profile.partyOfficialDate,
        enlistmentDate: profile.enlistmentDate,
        dischargeDate: profile.dischargeDate,
        militaryRank: profile.militaryRank,
        healthStatus: profile.healthStatus || 'Tốt',
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bloodType: profile.bloodType,
      },
      page3: {
        sectionTitle: 'III. QUÁ TRÌNH ĐÀO TẠO & CÔNG TÁC',
        educations: profile.educations,
        workHistories: profile.workHistories,
        appointments: profile.appointments,
        salaryHistories: profile.salaryHistories,
      },
      page4: {
        sectionTitle: 'IV. QUAN HỆ GIA ĐÌNH, KHEN THƯỞNG, KỶ LUẬT & ĐÁNH GIÁ',
        selfRelations,
        spouseRelations,
        rewardDisciplines: profile.rewardDisciplines,
        appraisals: profile.appraisals,
        socialActivities: profile.socialActivities,
        strengths: profile.strengths,
        historyNotes: profile.historyNotes,
      },
    };
  }

  /**
   * BÁO CÁO THỐNG KÊ BIỂU 01: CƠ CẤU ĐỘ TUỔI THEO NGẠCH BẬC LƯƠNG
   * - Ma trận các ngạch lương x 6 nhóm tuổi: [<30, 30-39, 40-49, 50-54, 55-59, >=60].
   */
  async getAgeByRankReport() {
    const ranks = await this.prisma.personnelRank.findMany({ orderBy: [{ groupCode: 'asc' }, { code: 'asc' }] });
    const profiles = await this.prisma.personnelComprehensiveProfile.findMany({
      include: {
        user: { select: { birthDate: true } },
        rank: true,
      },
    });

    const nowYear = new Date().getFullYear();

    const rankMap: Record<string, { rank: any; ageGroups: Record<string, { male: number; female: number; total: number }>; total: number }> = {};

    for (const r of ranks) {
      rankMap[r.code] = {
        rank: r,
        total: 0,
        ageGroups: {
          under30: { male: 0, female: 0, total: 0 },
          age30to39: { male: 0, female: 0, total: 0 },
          age40to49: { male: 0, female: 0, total: 0 },
          age50to54: { male: 0, female: 0, total: 0 },
          age55to59: { male: 0, female: 0, total: 0 },
          above60: { male: 0, female: 0, total: 0 },
        },
      };
    }

    for (const p of profiles) {
      if (!p.rankCode || !rankMap[p.rankCode]) continue;

      let age = 35; // Tuổi mặc định nếu chưa cập nhật ngày sinh
      if (p.user.birthDate) {
        age = nowYear - new Date(p.user.birthDate).getFullYear();
      }

      const isFemale = p.gender?.toLowerCase() === 'nữ';
      const targetRank = rankMap[p.rankCode];
      targetRank.total++;

      let groupKey = 'age30to39';
      if (age < 30) groupKey = 'under30';
      else if (age <= 39) groupKey = 'age30to39';
      else if (age <= 49) groupKey = 'age40to49';
      else if (age <= 54) groupKey = 'age50to54';
      else if (age <= 59) groupKey = 'age55to59';
      else groupKey = 'above60';

      targetRank.ageGroups[groupKey].total++;
      if (isFemale) targetRank.ageGroups[groupKey].female++;
      else targetRank.ageGroups[groupKey].male++;
    }

    return {
      reportTitle: 'BÁO CÁO THỐNG KÊ CƠ CẤU ĐỘ TUỔI THEO NGẠCH LƯƠNG (BIỂU 01)',
      generatedAt: new Date().toISOString(),
      rows: Object.values(rankMap).filter((r) => r.total > 0 || ranks.length <= 15),
    };
  }

  /**
   * BÁO CÁO THỐNG KÊ BIỂU 02: TRÌNH ĐỘ NGOẠI NGỮ & TIN HỌC THEO CHỨC DANH / NGẠCH
   */
  async getLanguageReport() {
    const profiles = await this.prisma.personnelComprehensiveProfile.findMany({
      include: {
        user: { select: { fullName: true, employeeCode: true, jobTitle: true, orgUnit: true } },
        rank: true,
      },
    });

    const languageBreakdown: Record<string, number> = {};
    const itBreakdown: Record<string, number> = {};

    for (const p of profiles) {
      const lang = p.foreignLanguage || 'Chưa cập nhật';
      languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;

      const it = p.informaticsLevel || 'Cơ bản';
      itBreakdown[it] = (itBreakdown[it] || 0) + 1;
    }

    return {
      reportTitle: 'BÁO CÁO THỐNG KÊ TRÌNH ĐỘ NGOẠI NGỮ & TIN HỌC (BIỂU 02)',
      generatedAt: new Date().toISOString(),
      totalPersonnel: profiles.length,
      languageBreakdown,
      itBreakdown,
      items: profiles.map((p) => ({
        employeeCode: p.user.employeeCode,
        fullName: p.user.fullName,
        jobTitle: p.user.jobTitle,
        orgUnitName: p.user.orgUnit?.name,
        rankName: p.rank?.name,
        foreignLanguage: p.foreignLanguage || '—',
        informaticsLevel: p.informaticsLevel || '—',
        ethnicLanguage: p.ethnicLanguage || '—',
      })),
    };
  }

  /**
   * BÁO CÁO THỐNG KÊ BIỂU 03: TRÌNH ĐỘ CHUYÊN MÔN & LÝ LUẬN CHÍNH TRỊ THEO ĐƠN VỊ
   */
  async getEducationByUnitReport() {
    const orgUnits = await this.prisma.orgUnit.findMany({ orderBy: { code: 'asc' } });
    const profiles = await this.prisma.personnelComprehensiveProfile.findMany({
      include: {
        user: { select: { orgUnitId: true, fullName: true, employeeCode: true } },
      },
    });

    const unitMap: Record<string, any> = {};

    for (const u of orgUnits) {
      unitMap[u.id] = {
        orgUnitId: u.id,
        orgUnitName: u.name,
        orgUnitCode: u.code,
        total: 0,
        doctorate: 0, // Tiến sĩ
        master: 0,    // Thạc sĩ
        bachelor: 0,  // Đại học / Cử nhân / Kỹ sư
        college: 0,   // Cao đẳng
        intermediate: 0, // Trung cấp
        polHigh: 0,   // Lý luận chính trị Cao cấp / Cử nhân LLCT
        polMid: 0,    // Lý luận chính trị Trung cấp
        polBasic: 0,  // Sơ cấp / Không
      };
    }

    for (const p of profiles) {
      const uId = p.user.orgUnitId;
      if (!uId || !unitMap[uId]) continue;

      const target = unitMap[uId];
      target.total++;

      const deg = (p.highestDegree || '').toLowerCase();
      if (deg.includes('tiến sĩ') || deg.includes('ts')) target.doctorate++;
      else if (deg.includes('thạc sĩ') || deg.includes('ths') || deg.includes('master')) target.master++;
      else if (deg.includes('đại học') || deg.includes('cử nhân') || deg.includes('kỹ sư')) target.bachelor++;
      else if (deg.includes('cao đẳng')) target.college++;
      else target.intermediate++;

      const pol = (p.politicalTheory || '').toLowerCase();
      if (pol.includes('cao cấp') || pol.includes('cử nhân')) target.polHigh++;
      else if (pol.includes('trung cấp')) target.polMid++;
      else target.polBasic++;
    }

    return {
      reportTitle: 'BÁO CÁO THỐNG KÊ TRÌNH ĐỘ CHUYÊN MÔN & LÝ LUẬN CHÍNH TRỊ THEO ĐƠN VỊ (BIỂU 03)',
      generatedAt: new Date().toISOString(),
      rows: Object.values(unitMap),
    };
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('Personnel Reports & Documents — Báo cáo & Mẫu biểu')
@ApiBearerAuth()
@Controller('personnel-reports')
export class PersonnelReportsController {
  constructor(private readonly service: PersonnelReportsService) {}

  @Get('2c-profile/:userId')
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  get2cProfile(@Param('userId') userId: string) {
    return this.service.get2cProfileData(userId);
  }

  @Get('bieu-01-age-rank')
  @Roles('ADMIN', 'KM_MANAGER')
  getAgeByRank() {
    return this.service.getAgeByRankReport();
  }

  @Get('bieu-02-languages')
  @Roles('ADMIN', 'KM_MANAGER')
  getLanguages() {
    return this.service.getLanguageReport();
  }

  @Get('bieu-03-education-unit')
  @Roles('ADMIN', 'KM_MANAGER')
  getEducationByUnit() {
    return this.service.getEducationByUnitReport();
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  controllers: [PersonnelReportsController],
  providers: [PersonnelReportsService],
  exports: [PersonnelReportsService],
})
export class PersonnelReportsModule {}
