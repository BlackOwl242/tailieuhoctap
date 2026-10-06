import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma.service';
import { HrAccessService } from '../services/hr-access.service';
import { HrmsPayrollController, HrmsPayrollService } from '../../modules/hrms-payroll/hrms-payroll.module';
import { HrmsLoansController, HrmsLoansService } from '../../modules/hrms-loans/hrms-loans.module';
import { PersonnelProfilesController, PersonnelProfilesService } from '../../modules/personnel-profiles/personnel-profiles.module';

describe('HR API authorization regressions (real controllers and guards)', () => {
  let app: INestApplication;
  let roles = ['USER'];
  const payroll = { listPayrollRuns: jest.fn().mockResolvedValue([]), createComponent: jest.fn(), deletePayrollRun: jest.fn(), listSlipsByUser: jest.fn().mockResolvedValue([]) };
  const loans = { getMyLoans: jest.fn().mockImplementation(async userId => ({ userId })), decide: jest.fn() };
  const profiles = { getProfile: jest.fn().mockImplementation(async userId => ({ userId })) };
  const db = { user: { findUnique: jest.fn().mockImplementation(async () => ({ id: 'employee', email: 'e@example.invalid', fullName: 'Employee', status: 'ACTIVE', employmentStatus: 'ACTIVE', deletedAt: null, roles: roles.map(roleCode => ({ roleCode })) })) }, setting: { findUnique: jest.fn().mockResolvedValue(null) } };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [HrmsPayrollController, HrmsLoansController, PersonnelProfilesController], providers: [
      { provide: PrismaService, useValue: db }, { provide: JwtService, useValue: { verifyAsync: async () => ({ sub: 'employee', roles: ['ADMIN'] }) } },
      HrAccessService, { provide: HrmsPayrollService, useValue: payroll }, { provide: HrmsLoansService, useValue: loans }, { provide: PersonnelProfilesService, useValue: profiles },
      { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: RolesGuard },
    ] }).compile();
    app = module.createNestApplication(); await app.init();
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => { roles = ['USER']; jest.clearAllMocks(); });
  it.each([['get', '/hrms/payroll/runs'], ['post', '/hrms/payroll/components'], ['delete', '/hrms/payroll/runs/run'], ['patch', '/hrms/loans/loan/decide']])('blocks a USER at %s %s despite an old ADMIN claim in their JWT', async (method, path) => {
    const response = await (request(app.getHttpServer()) as any)[method](path).set('Authorization', 'Bearer fixture').send({});
    expect(response.status).toBe(403);
  });
  it('my loans and payslips ignore a forged target-user query', async () => {
    expect((await request(app.getHttpServer()).get('/hrms/loans/my?userId=other').set('Authorization', 'Bearer fixture')).body.userId).toBe('employee');
    await request(app.getHttpServer()).get('/hrms/payroll/my-slips?userId=other').set('Authorization', 'Bearer fixture').expect(200);
    expect(payroll.listSlipsByUser).toHaveBeenCalledWith('employee');
  });
  it('blocks another employee profile and permits the owner', async () => {
    await request(app.getHttpServer()).get('/personnel-profiles/other').set('Authorization', 'Bearer fixture').expect(403);
    await request(app.getHttpServer()).get('/personnel-profiles/employee').set('Authorization', 'Bearer fixture').expect(200);
    expect(profiles.getProfile).toHaveBeenCalledTimes(1);
  });
  it('permits payroll specialists while rejecting revoked/disabled accounts', async () => {
    roles = ['ACCOUNTANT'];
    await request(app.getHttpServer()).get('/hrms/payroll/runs').set('Authorization', 'Bearer fixture').expect(200);
    db.user.findUnique.mockResolvedValueOnce({ status: 'DISABLED' });
    await request(app.getHttpServer()).get('/hrms/payroll/runs').set('Authorization', 'Bearer fixture').expect(401);
  });
  it('a module deny does not remove the right to read ones own payslips',async()=>{
    db.setting.findUnique.mockResolvedValueOnce({value:[{moduleKey:'PAYROLL',permissions:{USER:'Không'}}]} as any);
    await request(app.getHttpServer()).get('/hrms/payroll/my-slips').set('Authorization','Bearer fixture').expect(200);
  });

});
