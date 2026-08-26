import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { SharedModule } from './common/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrgUnitsModule } from './modules/org-units/org-units.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PeopleModule } from './modules/people/people.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { LeaveModule } from './modules/leave/leave.module';
import { OvertimeModule } from './modules/overtime/overtime.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { TrainingModule } from './modules/training/training.module';
import { PersonnelActionsModule } from './modules/personnel-actions/personnel-actions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PersonnelProfilesModule } from './modules/personnel-profiles/personnel-profiles.module';
import { PersonnelRanksModule } from './modules/personnel-ranks/personnel-ranks.module';
import { PersonnelReportsModule } from './modules/personnel-reports/personnel-reports.module';
import { HrmsShiftsModule } from './modules/hrms-shifts/hrms-shifts.module';
import { HrmsPayrollModule } from './modules/hrms-payroll/hrms-payroll.module';
import { HrmsRecruitmentModule } from './modules/hrms-recruitment/hrms-recruitment.module';
import { HrmsLifecycleModule } from './modules/hrms-lifecycle/hrms-lifecycle.module';
import { HrmsPerformanceModule } from './modules/hrms-performance/hrms-performance.module';
import { HrmsExpensesModule } from './modules/hrms-expenses/hrms-expenses.module';
import { HrmsTrainingModule } from './modules/hrms-training/hrms-training.module';
import { HrmsLoansModule } from './modules/hrms-loans/hrms-loans.module';
import { HrmsAssetsModule } from './modules/hrms-assets/hrms-assets.module';
import { HrmsRegularizationModule } from './modules/hrms-regularization/hrms-regularization.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], cache: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    SharedModule,
    AuthModule,
    UsersModule,
    OrgUnitsModule,
    SpacesModule,
    ArticlesModule,
    CommentsModule,
    SearchModule,
    NotificationsModule,
    OnboardingModule,
    PeopleModule,
    AttendanceModule,
    DashboardModule,
    SettingsModule,
    AuditModule,
    HealthModule,
    EmployeesModule,
    LeaveModule,
    OvertimeModule,
    PayrollModule,
    RecruitmentModule,
    PerformanceModule,
    TrainingModule,
    PersonnelActionsModule,
    DocumentsModule,
    PersonnelProfilesModule,
    PersonnelRanksModule,
    PersonnelReportsModule,
    HrmsShiftsModule,
    HrmsPayrollModule,
    HrmsRecruitmentModule,
    HrmsLifecycleModule,
    HrmsPerformanceModule,
    HrmsExpensesModule,
    HrmsTrainingModule,
    HrmsLoansModule,
    HrmsAssetsModule,
    HrmsRegularizationModule,
  ],
})
export class AppModule {}

