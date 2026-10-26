import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { setupTestApp } from './setup-app';

const RUN = process.env.RUN_E2E === '1';
(RUN ? describe : describe.skip)('HRMS database-backed workflows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: Record<string, string>;
  let employee: { id: string; fullName: string };
  let managerId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupTestApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = `${Date.now()}`;
    const roles = ['ADMIN', 'USER', 'KM_MANAGER', 'HR_CB', 'HR_RECRUITER', 'ACCOUNTANT', 'BOD', 'LINE_MANAGER', 'AUDITOR'];
    for (const code of roles) await prisma.role.upsert({ where: { code }, create: { code, name: code }, update: {} });
    const org = await prisma.orgUnit.create({ data: { name: `E2E Unit ${suffix}`, code: `E2E-${suffix}` } });
    const passwordHash = await bcrypt.hash('E2e-Only-Password!2026', 4);
    const makeUser = async (roleCode: string, label: string, extra: Record<string, unknown> = {}) => prisma.user.create({
      data: {
        email: `${label}-${suffix}@example.test`, passwordHash, fullName: `E2E ${label}`,
        status: 'ACTIVE', employmentStatus: 'ACTIVE', orgUnitId: org.id,
        hireDate: new Date(roleCode === 'USER' ? '2020-01-01T00:00:00.000Z' : '2030-01-01T00:00:00.000Z'), roles: { create: { roleCode } },
        ...extra,
      },
    });
    const users = {
      ADMIN: await makeUser('ADMIN', 'admin'),
      USER: await makeUser('USER', 'employee', { employeeCode: `E2E-${suffix}`, baseSalary: 30_000_000, taxDependentCount: 1, minimumWageRegion: 'I', bankAccount: '990000000001', bankName: 'E2E Bank' }),
      HR_CB: await makeUser('HR_CB', 'manager'),
      KM_MANAGER: await makeUser('KM_MANAGER', 'hr-lead'),
      HR_RECRUITER: await makeUser('HR_RECRUITER', 'recruiter'),
      HR_RECRUITER_2: await makeUser('HR_RECRUITER', 'recruiter-2'),
      ACCOUNTANT: await makeUser('ACCOUNTANT', 'accountant'),
      BOD: await makeUser('BOD', 'bod'),
      LINE_MANAGER: await makeUser('LINE_MANAGER', 'line-manager'),
      AUDITOR: await makeUser('AUDITOR', 'auditor'),
    };
    employee = { id: users.USER.id, fullName: users.USER.fullName };
    await prisma.contract.create({ data: { userId: employee.id, contractNo: `E2E-BASE-${suffix}`, type: 'INDEFINITE', startDate: new Date('2020-01-01'), baseSalary: 30_000_000, createdById: users.HR_CB.id } });
    managerId = users.HR_CB.id;
    tokens = {};
    for (const [role, user] of Object.entries(users)) {
      const login = await request(app.getHttpServer()).post('/api/v1/auth/login')
        .send({ email: user.email, password: 'E2e-Only-Password!2026' }).expect(200);
      tokens[role] = login.body.accessToken;
    }
  }, 60_000);

  afterAll(async () => { await app?.close(); });

  it('lets KM_MANAGER approve salary bands and amendments while enforcing separation of duties', async () => {
    const payload = { code: `KM-${Date.now()}`, name: 'Khung phân quyền nhân sự', levelTitle: 'Chuyên viên', minSalary: 10_000_000, midSalary: 15_000_000, maxSalary: 20_000_000, jobTitles: ['Chuyên viên phân quyền'], criteria: 'Đáp ứng các tiêu chí chuyên môn đã công bố.', benchmarkSource: 'Căn cứ ngân sách nội bộ đã phê duyệt.', effectiveFrom: '2026-01-01' };
    const post = (path: string, role: string, body = {}) => request(app.getHttpServer()).post(`/api/v1/salary-bands${path}`).set('Authorization', `Bearer ${tokens[role]}`).send(body);
    const band = await post('', 'HR_CB', payload).expect(201);
    for (const role of ['HR_CB', 'HR_RECRUITER', 'ACCOUNTANT', 'USER']) await post(`/${band.body.id}/approve`, role).expect(403);
    const items = await request(app.getHttpServer()).get('/api/v1/notifications/action-items').set('Authorization', `Bearer ${tokens.KM_MANAGER}`).expect(200);
    expect(items.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'salary-bands', count: expect.any(Number) })]));
    expect(items.body.items.some((item: { key: string }) => item.key === 'payroll')).toBe(false);
    await post(`/${band.body.id}/approve`, 'KM_MANAGER').expect(201);
    await post(`/${band.body.id}/deactivate`, 'KM_MANAGER').expect(403);
    const from = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    const amendment = await post(`/${band.body.id}/amend`, 'HR_CB', { ...payload, effectiveFrom: from }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/salary-bands/${amendment.body.id}`).set('Authorization', `Bearer ${tokens.KM_MANAGER}`).send({ ...payload, effectiveFrom: from, midSalary: 16_000_000 }).expect(200);
    await post(`/${amendment.body.id}/approve`, 'KM_MANAGER').expect(409);
    const selfCreated = await post('', 'KM_MANAGER', { ...payload, code: `SELF-${Date.now()}` }).expect(201);
    await post(`/${selfCreated.body.id}/approve`, 'KM_MANAGER').expect(409);
    // Another authorized reviewer can approve the edited amendment without a BOD-only step.
    await post(`/${amendment.body.id}/approve`, 'ADMIN').expect(201);
    const ownItems = await request(app.getHttpServer()).get('/api/v1/notifications/action-items').set('Authorization', `Bearer ${tokens.KM_MANAGER}`).expect(200);
    expect(ownItems.body.items.some((item: { key: string }) => item.key === 'salary-bands')).toBe(false);
  });

  it('amends approved salary bands without rewriting history or overlapping effective versions', async () => {
    const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
    const payload = { code: `AMEND-${Date.now()}`, name: 'Khung kiểm thử điều chỉnh', levelTitle: 'Chuyên viên', minSalary: 10_000_000, midSalary: 15_000_000, maxSalary: 20_000_000, jobTitles: ['Chuyên viên kiểm thử điều chỉnh'], criteria: 'Đáp ứng các tiêu chí chuyên môn đã công bố.', benchmarkSource: 'Ngân sách và khảo sát nội bộ đã được phê duyệt.', effectiveFrom: day(-2) };
    const post = (url: string, role: string, body = {}) => request(app.getHttpServer()).post(`/api/v1/salary-bands${url}`).set('Authorization', `Bearer ${tokens[role]}`).send(body);
    const original = await post('', 'HR_CB', payload).expect(201);
    const id = original.body.id;
    await post(`/${id}/approve`, 'BOD').expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/salary-bands/${id}`).set('Authorization', `Bearer ${tokens.ADMIN}`).send(payload).expect(409);
    const amendment = { ...payload, midSalary: 18_000_000, maxSalary: 25_000_000, effectiveFrom: day(3) };
    await post(`/${id}/amend`, 'HR_RECRUITER', amendment).expect(403);
    await post(`/${id}/amend`, 'ADMIN', { ...amendment, effectiveFrom: day(-1) }).expect(400);
    await post(`/${id}/amend`, 'ADMIN', { ...amendment, code: 'DIFFERENT' }).expect(400);
    const attempts = await Promise.all([post(`/${id}/amend`, 'ADMIN', amendment), post(`/${id}/amend`, 'ADMIN', amendment)]);
    expect(attempts.map(response => response.status).sort()).toEqual([201, 409]);
    const draft = attempts.find(response => response.status === 201)!.body;
    expect(draft).toMatchObject({ supersedesId: id, status: 'DRAFT', midSalary: 18_000_000 });
    expect(await prisma.hrmsSalaryBand.findUnique({ where: { id } })).toMatchObject({ effectiveTo: null, midSalary: 15_000_000 });
    await post(`/${draft.id}/approve`, 'ADMIN').expect(409);
    // A conflicting approved interval must roll the whole approval back.
    const conflict = await prisma.hrmsSalaryBand.create({ data: { ...payload, effectiveFrom: new Date(day(4)), status: 'ACTIVE', createdById: managerId, approvedById: managerId, approvedAt: new Date() } });
    await post(`/${draft.id}/approve`, 'BOD').expect(409);
    expect((await prisma.hrmsSalaryBand.findUniqueOrThrow({ where: { id } })).effectiveTo).toBeNull();
    expect((await prisma.hrmsSalaryBand.findUniqueOrThrow({ where: { id: draft.id } })).status).toBe('DRAFT');
    await prisma.hrmsSalaryBand.delete({ where: { id: conflict.id } });
    await post(`/${draft.id}/approve`, 'BOD').expect(201);
    expect((await prisma.hrmsSalaryBand.findUniqueOrThrow({ where: { id } })).effectiveTo?.toISOString().slice(0, 10)).toBe(day(2));
    await post(`/${draft.id}/approve`, 'BOD').expect(409);
    // A profile retains its historical link while queries select the effective version.
    const user = await prisma.user.create({ data: { email: `amend-${Date.now()}@example.test`, fullName: 'Kiểm thử phiên bản khung', passwordHash: 'fixture', salaryBandId: id, baseSalary: 15_000_000, jobTitle: payload.jobTitles[0] } });
    const before = await request(app.getHttpServer()).get(`/api/v1/employees/${user.id}/compensation-basis?effectiveDate=${day(1)}`).set('Authorization', `Bearer ${tokens.HR_CB}`).expect(200);
    const after = await request(app.getHttpServer()).get(`/api/v1/employees/${user.id}/compensation-basis?effectiveDate=${day(3)}`).set('Authorization', `Bearer ${tokens.HR_CB}`).expect(200);
    expect(before.body.salaryBandId).toBe(id);
    expect(after.body.salaryBandId).toBe(draft.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).baseSalary).toBe(15_000_000);
  });

  it('isolates expense ownership, delegated creation and line-manager scope', async () => {
    const stamp = Date.now();
    const org = await prisma.orgUnit.create({ data: { code: `OTHER-${stamp}`, name: 'Đơn vị khác' } });
    const target = await prisma.user.create({ data: { email: `other-${stamp}@example.test`, passwordHash: 'fixture', fullName: 'Nhân viên ngoài đơn vị', orgUnitId: org.id, hireDate: new Date('2030-01-01'), employmentStatus: 'ACTIVE', roles: { create: { roleCode: 'USER' } } } });
    const travelPayload = { userId: target.id, employeeName: target.fullName, purpose: 'Đề xuất ngoài đơn vị', fromLocation: 'Văn phòng', toLocation: 'Khách hàng', departureDate: '2026-10-20', returnDate: '2026-10-21', estimatedBudget: 100_000 };
    const travel = await request(app.getHttpServer()).post('/api/v1/hrms/expenses/travel-requests').set('Authorization', `Bearer ${tokens.HR_CB}`).send(travelPayload).expect(201);
    const claimPayload = { userId: target.id, employeeName: target.fullName, title: 'Chi phí ngoài đơn vị', totalAmount: 100, items: [{ item: 'Taxi', amount: 100 }] };
    const claim = await request(app.getHttpServer()).post('/api/v1/hrms/expenses/claims').set('Authorization', `Bearer ${tokens.HR_CB}`).send(claimPayload).expect(201);
    const advance = await request(app.getHttpServer()).post('/api/v1/hrms/expenses/advances').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ userId: target.id, employeeName: target.fullName, purpose: 'Đề xuất tạm ứng', amount: 100 }).expect(201);
    for (const token of [tokens.USER, tokens.LINE_MANAGER]) {
      for (const resource of ['claims', 'travel-requests', 'advances']) {
        const response = await request(app.getHttpServer()).get(`/api/v1/hrms/expenses/${resource}`).set('Authorization', `Bearer ${token}`).expect(200);
        expect(response.body.some((record: any) => record.userId === target.id)).toBe(false);
        await request(app.getHttpServer()).get(`/api/v1/hrms/expenses/${resource}?userId=${target.id}`).set('Authorization', `Bearer ${token}`).expect(403);
      }
      await request(app.getHttpServer()).post('/api/v1/hrms/expenses/claims').set('Authorization', `Bearer ${token}`).send(claimPayload).expect(403);
      await request(app.getHttpServer()).post('/api/v1/hrms/expenses/travel-requests').set('Authorization', `Bearer ${token}`).send(travelPayload).expect(403);
      await request(app.getHttpServer()).delete(`/api/v1/hrms/expenses/claims/${claim.body.id}`).set('Authorization', `Bearer ${token}`).expect(403);
      await request(app.getHttpServer()).delete(`/api/v1/hrms/expenses/travel-requests/${travel.body.id}`).set('Authorization', `Bearer ${token}`).expect(403);
      await request(app.getHttpServer()).delete(`/api/v1/hrms/expenses/advances/${advance.body.id}`).set('Authorization', `Bearer ${token}`).expect(403);
    }
    await request(app.getHttpServer()).patch(`/api/v1/hrms/expenses/travel-requests/${travel.body.id}/status`).set('Authorization', `Bearer ${tokens.LINE_MANAGER}`).send({ status: 'APPROVED' }).expect(403);
    await request(app.getHttpServer()).get('/api/v1/hrms/expenses/claims').set('Authorization', `Bearer ${tokens.AUDITOR}`).expect(200);
    await request(app.getHttpServer()).post('/api/v1/hrms/expenses/travel-requests').set('Authorization', `Bearer ${tokens.AUDITOR}`).send(travelPayload).expect(403);
  });

  it('rejects payroll review after attendance is reopened and finalized at a new version', async () => {
    const period = await prisma.attendancePeriod.create({ data: { month: 1, year: 2019, status: 'FINALIZED', version: 1, snapshot: [] } });
    const run = await prisma.hrmsPayrollRun.create({ data: { periodName: 'Stale attendance fixture', fromDate: new Date('2019-01-01'), toDate: new Date('2019-01-31'), status: 'PROCESSED', processedBy: managerId, attendancePeriodId: period.id } });
    await prisma.auditLog.create({ data: { actorId: managerId, action: 'PAYROLL_CALCULATED', entityType: 'HrmsPayrollRun', entityId: run.id, afterData: { attendancePeriodId: period.id, attendanceVersion: 1 } } });
    const migration = readFileSync(join(__dirname, '../prisma/migrations/20261025000000_payroll_attendance_version/migration.sql'), 'utf8');
    await prisma.$executeRawUnsafe(migration.slice(migration.indexOf('UPDATE')));
    expect((await prisma.hrmsPayrollRun.findUniqueOrThrow({ where: { id: run.id } })).attendanceVersion).toBe(1);
    await request(app.getHttpServer()).post(`/api/v1/attendance-periods/${period.id}/reopen`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ reason: 'Đối chiếu dữ liệu công' }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.id}/review`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({}).expect(409);
    await request(app.getHttpServer()).post('/api/v1/attendance-periods/finalize').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ month: 1, year: 2019 }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.id}/review`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({}).expect(409);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.id}/cancel-for-recalculation`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({}).expect(201);
  });

  it('backfills missing and stale legacy candidate mirrors idempotently', async () => {
    const requisition = await prisma.jobRequisition.create({ data: { title: 'Backfill migration', position: 'Kỹ sư', requestedById: managerId } });
    const opening = await prisma.hrmsJobOpening.create({ data: { requisitionId: requisition.id, title: requisition.title, description: 'Migration fixture' } });
    await prisma.hrmsJobApplicant.createMany({ data: [
      { jobOpeningId: opening.id, candidateName: 'Stale mirror', email: 'stale@example.test', stage: 'HIRED' },
      { jobOpeningId: opening.id, candidateName: 'Missing mirror', email: 'missing@example.test', stage: 'SCREENING' },
    ] });
    await prisma.candidate.create({ data: { requisitionId: requisition.id, fullName: 'Stale mirror', email: 'STALE@example.test', stage: 'NEW' } });
    const migration = readFileSync(join(__dirname, '../prisma/migrations/20261024000000_practical_hr_workflows/migration.sql'), 'utf8');
    const statements = migration.slice(migration.indexOf('-- Reconcile existing mirrors')).split(';').map(sql => sql.trim()).filter(Boolean);
    for (let repeat = 0; repeat < 2; repeat++) for (const sql of statements) await prisma.$executeRawUnsafe(sql);
    const mirrors = await prisma.candidate.findMany({ where: { requisitionId: requisition.id } });
    expect(mirrors).toHaveLength(2);
    expect(mirrors.find(candidate => candidate.email?.toLowerCase() === 'stale@example.test')?.stage).toBe('HIRED');
    expect(mirrors.find(candidate => candidate.email === 'missing@example.test')?.stage).toBe('SCREENING');
  });

  it('settles attendance/payroll, assets/expenses, evidence-based KPI and recruitment', async () => {
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const month = from.getUTCMonth() + 1;
    const year = from.getUTCFullYear();
    const end = new Date(Date.UTC(year, month, 0));
    const workDay = new Date(from);
    while ([0, 6].includes(workDay.getUTCDay())) workDay.setUTCDate(workDay.getUTCDate() + 1);
    const workDate = workDay.toISOString().slice(0, 10);

    await request(app.getHttpServer()).post('/api/v1/hrms/loans/apply')
      .set('Authorization', `Bearer ${tokens.USER}`)
      .send({ userId: employee.id, employeeName: employee.fullName, loanType: 'E2E vay', principalAmount: 1_000_000, termMonths: 12, interestRate: 0 })
      .expect(400);
    const loan = await request(app.getHttpServer()).post('/api/v1/hrms/loans/apply')
      .set('Authorization', `Bearer ${tokens.USER}`)
      .send({ userId: employee.id, employeeName: employee.fullName, loanType: 'E2E vay', principalAmount: 1_000_000, termMonths: 12, interestRate: 0, payrollDeductionAuthorized: true })
      .expect(201);
    expect(loan.body.payrollDeductionAuthorizedAt).toBeTruthy();
    expect(loan.body.deductionConsentVersion).toBe('salary-deduction-v1');
    await request(app.getHttpServer()).patch(`/api/v1/hrms/loans/${loan.body.id}/decide`)
      .set('Authorization', `Bearer ${tokens.HR_CB}`).send({ status: 'APPROVED', decisionNote: 'Đã rà soát hồ sơ E2E' }).expect(200);
    const approvedDeduction = await request(app.getHttpServer()).get(`/api/v1/hrms/loans/${loan.body.id}/safe-deduction?netPay=20000000`)
      .set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).expect(200);
    expect(approvedDeduction.body.allowedDeduction).toBe(0);
    const disbursedLoan = await request(app.getHttpServer()).patch(`/api/v1/hrms/loans/${loan.body.id}/disburse`)
      .set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({ method: 'BANK', reference: 'E2E-BANK-REF-001' }).expect(200);
    expect(disbursedLoan.body.status).toBe('DISBURSED');
    expect(disbursedLoan.body.disbursementReference).toBe('E2E-BANK-REF-001');
    // Backdate only the isolated E2E fixture so it is eligible for the previous-month payroll period.
    await prisma.hrmsEmployeeLoan.update({ where: { id: loan.body.id }, data: { disbursedAt: new Date(from.getTime() - 86_400_000), payrollDeductionAuthorizedAt: new Date(from.getTime() - 172_800_000) } });

    // Simulate a clock device having recorded only the morning punch; the employee then files a real correction.
    await prisma.attendanceEvent.create({ data: {
      userId: employee.id, source: 'MACHINE', occurredAt: new Date(`${workDate}T01:00:00.000Z`),
      payload: { punch: 'IN', workDate },
    } });
    const correction = await request(app.getHttpServer()).post('/api/v1/hrms/attendance-regularizations')
      .set('Authorization', `Bearer ${tokens.USER}`)
      .send({ userId: employee.id, employeeName: employee.fullName, workDate, requestedCheckIn: '08:00', requestedCheckOut: '17:30', reason: 'Máy chấm công không ghi nhận lượt ra sau khi hoàn thành ca làm việc.' })
      .expect(201);
    expect(correction.body.status).toBe('PENDING');
    await request(app.getHttpServer()).patch(`/api/v1/hrms/attendance-regularizations/${correction.body.id}/decide`)
      .set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ status: 'APPROVED', decisionNote: 'Đã đối chiếu bảng trực.' }).expect(200);
    const day = await prisma.attendanceDay.findUnique({ where: { userId_workDate: { userId: employee.id, workDate: workDay } } });
    expect(day?.status).toBe('PRESENT');
    expect(day?.workedMinutes).toBe(480);

    const period = await request(app.getHttpServer()).post('/api/v1/attendance-periods/finalize')
      .set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({ month, year }).expect(201);
    expect(period.body.status).toBe('FINALIZED');
    const overtimeComponent = await prisma.hrmsSalaryComponent.create({ data: {
      code: `E2E_OT_BASE_${Date.now()}`, name: 'Phụ cấp chức vụ E2E', type: 'EARNING', defaultAmount: 2_000_000,
      isTaxApplicable: true, isOvertimeApplicable: true,
      basisType: 'COMPANY_POLICY', basisReference: 'Quy chế lương mô phỏng phục vụ kiểm thử E2E',
    } });
    const structure = await prisma.hrmsSalaryStructure.create({ data: { name: `E2E Salary ${Date.now()}` } });
    await prisma.hrmsSalaryStructureItem.create({ data: { structureId: structure.id, componentId: overtimeComponent.id, amount: 2_000_000 } });
    await prisma.hrmsSalaryStructureAssignment.create({ data: { userId: employee.id, structureId: structure.id, fromDate: from, baseSalary: 30_000_000 } });
    const run = await request(app.getHttpServer()).post('/api/v1/hrms/payroll/runs')
      .set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ periodName: `E2E ${year}-${String(month).padStart(2, '0')}`, fromDate: from.toISOString(), toDate: end.toISOString() })
      .expect(201);
    expect(run.body.policySnapshot.version).toMatch(/^VN-PAYROLL-/);
    const employeeSlip = run.body.slips.find((slip: { userId: string }) => slip.userId === employee.id);
    expect(employeeSlip).toBeTruthy();
    expect(employeeSlip.breakdown.calculation.overtimeBasis.contractualMonthlyWage).toBe(32_000_000);
    expect(employeeSlip.breakdown.calculation.minimumWageReview).toMatchObject({ region: 'I', status: 'PASS', monthlyMinimum: 5_310_000, hourlyMinimum: 25_500 });
    const deduction = await prisma.payrollLoanDeduction.findFirst({ where: { payrollRunId: run.body.id, loanId: loan.body.id } });
    expect(deduction?.amount).toBe(loan.body.monthlyEmi);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/review`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({}).expect(403);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/review`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({}).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/approve`).set('Authorization', `Bearer ${tokens.BOD}`).send({}).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/lock`).set('Authorization', `Bearer ${tokens.BOD}`).send({}).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/pay`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({}).expect(400);
    const unpaidLoan = await prisma.hrmsEmployeeLoan.findUniqueOrThrow({ where: { id: loan.body.id } });
    expect(unpaidLoan.remainingAmount).toBe(loan.body.remainingAmount);
    const paid = await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/pay`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({ paymentMethod: 'BANK_TRANSFER', paymentReference: 'E2E-SETTLEMENT-001' }).expect(201);
    expect(paid.body.status).toBe('PAID');
    expect(paid.body.paymentReference).toBe('E2E-SETTLEMENT-001');
    expect(paid.body.paymentMethod).toBe('BANK_TRANSFER');
    expect(paid.body.paidAt).toBeTruthy();
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/cancel-for-recalculation`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({}).expect(409);
    expect((await prisma.hrmsPayrollRun.findUniqueOrThrow({ where: { id: run.body.id } })).status).toBe('PAID');
    const repaidLoan = await prisma.hrmsEmployeeLoan.findUniqueOrThrow({ where: { id: loan.body.id } });
    expect(repaidLoan.remainingAmount).toBe(loan.body.remainingAmount - loan.body.monthlyEmi);
    const payslips = await request(app.getHttpServer()).get('/api/v1/hrms/payroll/my-slips').set('Authorization', `Bearer ${tokens.USER}`).expect(200);
    expect(payslips.body.some((slip: { payrollRunId: string }) => slip.payrollRunId === run.body.id)).toBe(true);

    const asset = await request(app.getHttpServer()).post('/api/v1/hrms/assets').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ assetCode: `E2E-${Date.now()}`, name: 'Thiết bị E2E', category: 'IT_EQUIPMENT', value: 5_000_000 }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/assets/${asset.body.id}/allocate`).set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ assignedUserId: employee.id, assignedEmployeeName: employee.fullName }).expect(200);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/assets/${asset.body.id}/return`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({}).expect(409);
    await request(app.getHttpServer()).post(`/api/v1/hrms/assets/${asset.body.id}/acknowledge`).set('Authorization', `Bearer ${tokens.USER}`)
      .send({ accepted: true, condition: 'GOOD' }).expect(201);
    const receiptEvent = await prisma.assetCustodyEvent.findFirst({ where: { assetId: asset.body.id, action: 'RECEIPT_ACK' } });
    expect(receiptEvent?.acknowledgedAt).toBeTruthy();

    const travel = await request(app.getHttpServer()).post('/api/v1/hrms/expenses/travel-requests').set('Authorization', `Bearer ${tokens.ACCOUNTANT}`)
      .send({ userId: employee.id, employeeName: employee.fullName, purpose: 'E2E công tác', fromLocation: 'Hà Nội', toLocation: 'Đà Nẵng', departureDate: from.toISOString(), returnDate: end.toISOString(), estimatedBudget: 100_000 }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/expenses/travel-requests/${travel.body.id}/status`).set('Authorization', `Bearer ${tokens.ADMIN}`).send({ status: 'APPROVED' }).expect(200);
    const advance = await request(app.getHttpServer()).post('/api/v1/hrms/expenses/advances').set('Authorization', `Bearer ${tokens.ACCOUNTANT}`)
      .send({ userId: employee.id, employeeName: employee.fullName, travelRequestId: travel.body.id, amount: 100_000, purpose: 'Tạm ứng E2E' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/expenses/advances/${advance.body.id}/status`).set('Authorization', `Bearer ${tokens.ADMIN}`).send({ status: 'APPROVED' }).expect(200);
      const disbursed = await request(app.getHttpServer()).patch(`/api/v1/hrms/expenses/advances/${advance.body.id}/status`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({ status: 'PAID', paymentMethod: 'CASH' }).expect(200);
      expect(disbursed.body.paymentMethod).toBe('CASH');
    const claim = await request(app.getHttpServer()).post('/api/v1/hrms/expenses/claims').set('Authorization', `Bearer ${tokens.ACCOUNTANT}`)
      .send({ userId: employee.id, employeeName: employee.fullName, travelRequestId: travel.body.id, title: 'Chi phí E2E', totalAmount: 40_000, items: [{ item: 'Ăn uống', amount: 40_000, date: workDate }] }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/expenses/claims/${claim.body.id}/status`).set('Authorization', `Bearer ${tokens.ADMIN}`).send({ status: 'APPROVED' }).expect(200);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/expenses/claims/${claim.body.id}/status`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({ status: 'PAID' }).expect(200);
    const closed = await request(app.getHttpServer()).post(`/api/v1/hrms/expenses/travel-requests/${travel.body.id}/close-settlement`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({}).expect(201);
    expect(closed.body.advanceRefundDue).toBe(60_000);
    const half = await request(app.getHttpServer()).post(`/api/v1/hrms/expenses/travel-requests/${travel.body.id}/record-refund`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({ amount: 25_000, note: 'E2E lần một' }).expect(201);
    expect(half.body.refundStatus).toBe('PARTIAL');
    const repaid = await request(app.getHttpServer()).post(`/api/v1/hrms/expenses/travel-requests/${travel.body.id}/record-refund`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({ amount: 35_000, note: 'E2E tất toán' }).expect(201);
    expect(repaid.body.refundStatus).toBe('REPAID');

    const cycle = await prisma.hrmsAppraisalCycle.create({ data: { name: `E2E KPI ${Date.now()}`, year, startDate: new Date(`${year}-01-01`), endDate: new Date(`${year}-12-31`), status: 'ACTIVE' } });
    const assigned = await request(app.getHttpServer()).post('/api/v1/hrms/performance/goals').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ cycleId: cycle.id, userId: employee.id, kraTitle: 'Tỷ lệ hồ sơ đúng hạn', description: 'Tổng hợp theo sổ công việc đã được nghiệm thu trong kỳ', targetMetric: 'Ít nhất 100 hồ sơ được nghiệm thu', weightage: 100, measurementMode: 'HIGHER_BETTER', targetValue: 100, measurementUnit: 'hồ sơ' }).expect(201);
    expect(assigned.body.createdCount).toBe(1);
    const goal = await prisma.hrmsAppraisalGoal.findFirstOrThrow({ where: { cycleId: cycle.id, userId: employee.id } });
    await request(app.getHttpServer()).patch(`/api/v1/hrms/performance/goals/${goal.id}/score`).set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ actualValue: 80, scoreRationale: 'Đối chiếu 80 hồ sơ nghiệm thu trên mục tiêu 100 hồ sơ.' }).expect(409);
    await request(app.getHttpServer()).post(`/api/v1/hrms/performance/goals/${goal.id}/evidence`).set('Authorization', `Bearer ${tokens.USER}`)
      .send({ description: 'Sổ công việc ghi nhận 80 hồ sơ đã được nghiệm thu', metricValue: '80 hồ sơ', evidenceUrl: 'https://example.test/kpi-evidence.pdf' }).expect(201);
    const scored = await request(app.getHttpServer()).patch(`/api/v1/hrms/performance/goals/${goal.id}/score`).set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ actualValue: 80, managerScore: 100, scoreRationale: 'Đối chiếu 80 hồ sơ nghiệm thu trên mục tiêu 100 hồ sơ.' }).expect(200);
    expect(scored.body.finalScore).toBe(80);
    expect(scored.body.actualValue).toBe(80);
    await request(app.getHttpServer()).post('/api/v1/personnel-actions').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ type: 'DISCIPLINE', subjectId: employee.id, payload: { reason: 'Kiểm tra chặn khấu trừ kỷ luật', subType: 'REPRIMAND', amount: 100000 } }).expect(409);
    expect(managerId).toBeTruthy();

    const effectiveFrom = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const band = await request(app.getHttpServer()).post('/api/v1/salary-bands').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ code: `ENG-E2E-${Date.now()}`, name: 'Kỹ sư phần mềm E2E', levelTitle: 'Kỹ sư', minSalary: 25_000_000, midSalary: 30_000_000, maxSalary: 35_000_000, jobTitles: ['Kỹ sư phần mềm'], criteria: 'Tự thực hiện các nhiệm vụ chuyên môn theo tiêu chuẩn nhóm và có thể giải thích cách làm.', benchmarkSource: 'Dữ liệu thử nghiệm phục vụ kiểm tra quy trình, không dùng làm khung lương thật.', effectiveFrom })
      .expect(201);
    await request(app.getHttpServer()).post(`/api/v1/salary-bands/${band.body.id}/approve`).set('Authorization', `Bearer ${tokens.BOD}`).send({}).expect(201);

    const requisition = await request(app.getHttpServer()).post('/api/v1/recruitment/requisitions').set('Authorization', `Bearer ${tokens.HR_RECRUITER}`)
      .send({ budgetMonthly: 35_000_000, orgUnitId: (await prisma.user.findUniqueOrThrow({ where: { id: managerId } })).orgUnitId, title: 'Bổ sung kỹ sư phần mềm E2E', position: 'Kỹ sư phần mềm', headcount: 1, reason: 'Bổ sung nhân sự để đáp ứng khối lượng dự án đã được phê duyệt.' }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/recruitment/requisitions/${requisition.body.id}/assess`).set('Authorization', `Bearer ${tokens.HR_RECRUITER_2}`)
      .send({ kind: 'HR', note: 'Nhu cầu, chức danh và tiêu chí vị trí đã được rà soát.' }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/recruitment/requisitions/${requisition.body.id}/assess`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`)
      .send({ kind: 'FINANCE', note: 'Ngân sách tháng phù hợp với kế hoạch nhân sự được giao.' }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/recruitment/requisitions/${requisition.body.id}/approve`).set('Authorization', `Bearer ${tokens.BOD}`).send({ note: 'Đã duyệt chỉ tiêu và ngân sách.' }).expect(201);
    const opening = await request(app.getHttpServer()).post('/api/v1/hrms/recruitment/openings').set('Authorization', `Bearer ${tokens.HR_RECRUITER}`)
      .send({ requisitionId: requisition.body.id, title: 'Kỹ sư phần mềm E2E', department: 'Sản phẩm', designation: 'Kỹ sư phần mềm', vacancies: 1, description: 'Phát triển và duy trì các chức năng sản phẩm.', requirements: 'Có kinh nghiệm phát triển phần mềm và biết kiểm thử kết quả công việc.', salaryBandId: band.body.id, minimumInterviewRounds: 1, probationDays: 60 }).expect(201);
    const applicant = await request(app.getHttpServer()).post('/api/v1/hrms/recruitment/applicants').set('Authorization', `Bearer ${tokens.HR_RECRUITER}`)
      .send({ jobOpeningId: opening.body.id, candidateName: 'Ứng viên E2E', email: `candidate-${Date.now()}@example.test`, notes: 'Hồ sơ ứng viên phục vụ kiểm tra quy trình.' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/recruitment/applicants/${applicant.body.id}/stage`).set('Authorization', `Bearer ${tokens.HR_RECRUITER}`).send({ stage: 'SCREENING' }).expect(200);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/recruitment/applicants/${applicant.body.id}/stage`).set('Authorization', `Bearer ${tokens.HR_RECRUITER}`).send({ stage: 'INTERVIEW_ROUND_1' }).expect(200);
    await request(app.getHttpServer()).post('/api/v1/hrms/recruitment/interviews').set('Authorization', `Bearer ${tokens.HR_RECRUITER}`)
      .send({ applicantId: applicant.body.id, roundName: 'Phỏng vấn vòng 1', interviewerName: 'Quản lý chuyên môn', scheduledAt: new Date().toISOString(), score: 85, recommendation: 'HIRE', feedback: 'Ứng viên đáp ứng tiêu chí chuyên môn và có ví dụ thực tế phù hợp.' }).expect(201);
    const joiningDate = new Date(Date.now() + 14 * 86_400_000).toISOString();
    const offer = await request(app.getHttpServer()).post('/api/v1/hrms/recruitment/offers').set('Authorization', `Bearer ${tokens.HR_RECRUITER}`)
      .send({ applicantId: applicant.body.id, designation: 'Kỹ sư phần mềm', offeredSalary: 36_000_000, joiningDate }).expect(409);
    expect(offer.body.message).toContain('khung');
    const validOffer = await request(app.getHttpServer()).post('/api/v1/hrms/recruitment/offers').set('Authorization', `Bearer ${tokens.HR_RECRUITER}`)
      .send({ applicantId: applicant.body.id, designation: 'Kỹ sư phần mềm', offeredSalary: 30_000_000, joiningDate }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/recruitment/offers/${validOffer.body.id}/respond`).set('Authorization', `Bearer ${tokens.HR_RECRUITER}`)
      .send({ accepted: true, evidenceUrl: 'https://example.test/offer-accepted.pdf' }).expect(200);
    const hired = await request(app.getHttpServer()).post(`/api/v1/hrms/recruitment/applicants/${applicant.body.id}/convert-to-employee`).set('Authorization', `Bearer ${tokens.HR_RECRUITER}`).send({}).expect(201);
    const probationContract = await prisma.contract.findFirst({ where: { userId: hired.body.id, status: 'ACTIVE' } });
    expect(hired.body.employmentStatus).toBe('PROBATION');
    expect(probationContract).toMatchObject({ type: 'PROBATION', baseSalary: 30_000_000, compensationBasis: 'MONTHLY' });
    const salaryEffectiveDate = new Date(Date.now() + 25 * 86_400_000).toISOString().slice(0, 10);
    const monthlyTerms = await request(app.getHttpServer()).get(`/api/v1/employees/${hired.body.id}/compensation-basis?effectiveDate=${salaryEffectiveDate}`).set('Authorization', `Bearer ${tokens.HR_CB}`).expect(200);
    expect(monthlyTerms.body).toMatchObject({ compensationBasis: 'MONTHLY', salaryBandId: band.body.id, hasActiveContract: true });
    expect(await prisma.hrmsOnboardingTask.count({ where: { userId: hired.body.id } })).toBeGreaterThanOrEqual(4);
    await request(app.getHttpServer()).post('/api/v1/personnel-actions').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ type: 'SALARY_ADJUST', subjectId: hired.body.id, effectiveDate: salaryEffectiveDate, payload: { newSalary: 36_000_000, reason: 'Điều chỉnh theo kết quả thử việc và phạm vi trách nhiệm mới.', salaryReason: 'MERIT' } }).expect(409);
    const salaryProposal = await request(app.getHttpServer()).post('/api/v1/personnel-actions').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ type: 'SALARY_ADJUST', subjectId: hired.body.id, effectiveDate: salaryEffectiveDate, payload: { newSalary: 32_000_000, reason: 'Điều chỉnh theo kết quả thử việc và phạm vi trách nhiệm mới.', salaryReason: 'MERIT' } }).expect(201);
    expect(salaryProposal.body.payload.salaryBandId).toBe(band.body.id);
    expect(salaryProposal.body.status).toBe('PENDING');

    const hourlyBand = await request(app.getHttpServer()).post('/api/v1/salary-bands').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ code: `HOURLY-E2E-${Date.now()}`, name: 'Nhân viên hỗ trợ theo giờ E2E', levelTitle: 'Nhân viên', minSalary: 120_000, midSalary: 150_000, maxSalary: 200_000, compensationBasis: 'HOURLY', jobTitles: ['Nhân viên hỗ trợ theo giờ'], criteria: 'Hoàn thành ca hỗ trợ theo quy trình và bàn giao đầy đủ cho ca tiếp theo.', benchmarkSource: 'Dữ liệu thử nghiệm phục vụ kiểm tra đơn vị trả lương.', effectiveFrom })
      .expect(201);
    await request(app.getHttpServer()).post(`/api/v1/salary-bands/${hourlyBand.body.id}/approve`).set('Authorization', `Bearer ${tokens.BOD}`).send({}).expect(201);
    const hourlyEmployee = await prisma.user.create({ data: {
      email: `hourly-${Date.now()}@example.test`, passwordHash: await bcrypt.hash('E2e-Only-Password!2026', 4), fullName: 'E2E Nhân viên theo giờ',
      status: 'ACTIVE', employmentStatus: 'ACTIVE', jobTitle: 'Nhân viên hỗ trợ theo giờ', salaryBandId: hourlyBand.body.id, baseSalary: 150_000,
      hireDate: new Date(effectiveFrom),
      orgUnitId: (await prisma.user.findUniqueOrThrow({ where: { id: managerId } })).orgUnitId, roles: { create: { roleCode: 'USER' } },
    } });
    await prisma.contract.create({ data: { userId: hourlyEmployee.id, contractNo: `E2E-HOURLY-${Date.now()}`, type: 'INDEFINITE', startDate: new Date(`${effectiveFrom}T00:00:00.000Z`), baseSalary: 150_000, compensationBasis: 'HOURLY', createdById: managerId } });
    const hourlyTerms = await request(app.getHttpServer()).get(`/api/v1/employees/${hourlyEmployee.id}/compensation-basis`).set('Authorization', `Bearer ${tokens.HR_CB}`).expect(200);
    expect(hourlyTerms.body.compensationBasis).toBe('HOURLY');
    const hourlyEffectiveDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await request(app.getHttpServer()).post('/api/v1/personnel-actions').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ type: 'SALARY_ADJUST', subjectId: hourlyEmployee.id, effectiveDate: hourlyEffectiveDate, payload: { newSalary: 180_000, salaryBandId: band.body.id, reason: 'Điều chỉnh đơn giá theo phạm vi công việc được giao.', salaryReason: 'MARKET_ALIGNMENT' } }).expect(409);
    const hourlyProposal = await request(app.getHttpServer()).post('/api/v1/personnel-actions').set('Authorization', `Bearer ${tokens.HR_CB}`)
      .send({ type: 'SALARY_ADJUST', subjectId: hourlyEmployee.id, effectiveDate: hourlyEffectiveDate, payload: { newSalary: 180_000, salaryBandId: hourlyBand.body.id, reason: 'Điều chỉnh đơn giá theo phạm vi công việc được giao.', salaryReason: 'MARKET_ALIGNMENT' } }).expect(201);
    expect(hourlyProposal.body.payload.salaryBandId).toBe(hourlyBand.body.id);
  }, 120_000);

  it('handles midmonth payroll, actual OT, Saturday leave, travel, promotion, failed probation and KPI coverage', async () => {
    await prisma.setting.upsert({ where: { key: 'AUTO_ATTENDANCE_ENABLED' }, create: { key: 'AUTO_ATTENDANCE_ENABLED', value: false }, update: { value: false } });
    const stamp = Date.now();
    const manager = await prisma.user.findUniqueOrThrow({ where: { id: managerId } });
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
    const end = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0));
    const hire = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 15));
    const iso = (date: Date) => date.toISOString().slice(0, 10);
    const saturday = new Date(hire); while (saturday.getUTCDay() !== 6) saturday.setUTCDate(saturday.getUTCDate() + 1);
    const tripDate = new Date(hire); tripDate.setUTCDate(tripDate.getUTCDate() + 1); while ([0, 6].includes(tripDate.getUTCDay())) tripDate.setUTCDate(tripDate.getUTCDate() + 1);
    const otDate = new Date(tripDate); otDate.setUTCDate(otDate.getUTCDate() + 1);
    const passwordHash = await bcrypt.hash('E2e-Only-Password!2026', 4);
    const mid = await prisma.user.create({ data: { email: `mid-${stamp}@example.test`, passwordHash, fullName: 'E2E Vào giữa tháng', status: 'ACTIVE', employmentStatus: 'ACTIVE', hireDate: hire, baseSalary: 30_000_000, orgUnitId: manager.orgUnitId, roles: { create: { roleCode: 'USER' } } } });
    await prisma.contract.create({ data: { userId: mid.id, contractNo: `MID-${stamp}`, type: 'INDEFINITE', startDate: hire, baseSalary: 30_000_000, createdById: managerId } });
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: mid.email, password: 'E2e-Only-Password!2026' }).expect(200);
    const midToken = login.body.accessToken;
    const shift = await request(app.getHttpServer()).post('/api/v1/hrms/shifts/types').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ name: 'E2E Ca thứ Hai–thứ Bảy', startTime: '08:00', endTime: '17:30' }).expect(201);
    await request(app.getHttpServer()).post('/api/v1/hrms/shifts/assignments').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ userId: mid.id, shiftTypeId: shift.body.id, startDate: iso(from), endDate: iso(end), workDays: [1, 2, 3, 4, 5, 6] }).expect(201);
    const leave = await request(app.getHttpServer()).post('/api/v1/leave').set('Authorization', `Bearer ${midToken}`).send({ type: 'ANNUAL', startDate: iso(saturday), endDate: iso(saturday), reason: 'Nghỉ việc gia đình vào ngày ca thứ Bảy' }).expect(201);
    expect(leave.body.days).toBe(1); expect(leave.body.chargedDates).toEqual([iso(saturday)]);
    await request(app.getHttpServer()).post(`/api/v1/leave/${leave.body.id}/approve`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({}).expect(201);
    const balance = await request(app.getHttpServer()).get(`/api/v1/leave/balance?year=${from.getUTCFullYear()}`).set('Authorization', `Bearer ${midToken}`).expect(200);
    expect(balance.body.entitled).toBeLessThan(12);

    const trip = await request(app.getHttpServer()).post('/api/v1/hrms/expenses/travel-requests').set('Authorization', `Bearer ${midToken}`).send({ userId: mid.id, employeeName: mid.fullName, purpose: 'Công tác có xác nhận thực hiện', fromLocation: 'Văn phòng', toLocation: 'Khách hàng', departureDate: iso(tripDate), returnDate: iso(tripDate), estimatedBudget: 100_000 }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/expenses/travel-requests/${trip.body.id}/status`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ status: 'APPROVED' }).expect(200);
    expect(await prisma.attendanceDay.findUnique({ where: { userId_workDate: { userId: mid.id, workDate: tripDate } } })).toBeNull();
    const options = await request(app.getHttpServer()).get(`/api/v1/hrms/expenses/travel-requests/${trip.body.id}/attendance-options`).set('Authorization', `Bearer ${tokens.HR_CB}`).expect(200);
    expect(options.body.days).toEqual([{ date: iso(tripDate), confirmed: false, canConfirm: true, reason: '' }]);
    await request(app.getHttpServer()).post(`/api/v1/hrms/expenses/travel-requests/${trip.body.id}/confirm-attendance`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ workDates: [iso(tripDate)], evidenceUrl: 'https://example.test/trip-report.pdf' }).expect(201);
    expect((await prisma.attendanceDay.findUniqueOrThrow({ where: { userId_workDate: { userId: mid.id, workDate: tripDate } } })).status).toBe('BUSINESS_TRIP');

    const ot = await request(app.getHttpServer()).post('/api/v1/overtime').set('Authorization', `Bearer ${midToken}`).send({ workDate: iso(otDate), hours: 4, nightHours: 0, dayCategory: 'PUBLIC_HOLIDAY', reason: 'Kế hoạch hoàn tất công việc khách hàng' }).expect(201);
    expect(ot.body.dayCategory).toBe('WEEKDAY');
    await request(app.getHttpServer()).post(`/api/v1/overtime/${ot.body.id}/approve`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({}).expect(201);
    expect((await prisma.overtimeRequest.findUniqueOrThrow({ where: { id: ot.body.id } })).actualConfirmedAt).toBeNull();
    await request(app.getHttpServer()).post('/api/v1/attendance-periods/finalize').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ month: from.getUTCMonth() + 1, year: from.getUTCFullYear() }).expect(409);
    await request(app.getHttpServer()).post(`/api/v1/overtime/${ot.body.id}/confirm-actual`).set('Authorization', `Bearer ${midToken}`).send({ actualHours: 2, actualNightHours: 0, note: 'Đã hoàn thành công việc', evidenceUrl: 'https://example.test/ot.pdf' }).expect(403);
    await request(app.getHttpServer()).post(`/api/v1/overtime/${ot.body.id}/confirm-actual`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ actualHours: 2, actualNightHours: 0, note: 'Đối chiếu báo cáo chỉ thực hiện hai giờ', evidenceUrl: 'https://example.test/ot.pdf' }).expect(201);
    await request(app.getHttpServer()).post('/api/v1/attendance-periods/finalize').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ month: from.getUTCMonth() + 1, year: from.getUTCFullYear() }).expect(201);
    const run = await request(app.getHttpServer()).post('/api/v1/hrms/payroll/runs').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ periodName: 'E2E Giữa tháng', fromDate: iso(from), toDate: iso(end) }).expect(201);
    const slip = run.body.slips.find((item: any) => item.userId === mid.id);
    expect(slip.actualWorkDays).toBe(2); expect(slip.breakdown.calculation.approvedOvertime[0].hours).toBe(2); expect(slip.netPay).toBeGreaterThan(0);
    const attendanceEvidence = await request(app.getHttpServer()).get(`/api/v1/hrms/payroll/slips/${slip.id}/attendance`).set('Authorization', `Bearer ${tokens.HR_CB}`).expect(200);
    expect(attendanceEvidence.body.source).toBe('PAYROLL_SNAPSHOT');
    expect(attendanceEvidence.body.days.find((day: any) => day.workDate.startsWith(iso(tripDate))).travelRequests[0].purpose).toBe('Công tác có xác nhận thực hiện');

    const cycle = await request(app.getHttpServer()).post('/api/v1/hrms/performance/cycles').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ name: 'E2E Kiểm tra đủ đối tượng', year: now.getUTCFullYear(), startDate: `${now.getUTCFullYear()}-01-01`, endDate: `${now.getUTCFullYear()}-12-31`, participantIds: [employee.id, mid.id] }).expect(201);
    await request(app.getHttpServer()).post('/api/v1/hrms/performance/goals').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ cycleId: cycle.body.id, userId: mid.id, kraTitle: 'Hoàn tất công việc', description: 'Đối chiếu toàn bộ biên bản nghiệm thu công việc', targetMetric: 'Đạt mục tiêu công việc', weightage: 100 }).expect(201);
    const goal = await prisma.hrmsAppraisalGoal.findFirstOrThrow({ where: { cycleId: cycle.body.id, userId: mid.id } });
    await request(app.getHttpServer()).post(`/api/v1/hrms/performance/goals/${goal.id}/evidence`).set('Authorization', `Bearer ${midToken}`).send({ description: 'Báo cáo công việc đã nghiệm thu đầy đủ', evidenceUrl: 'https://example.test/kpi.pdf' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/performance/goals/${goal.id}/score`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ managerScore: 90, scoreRationale: 'Đã đối chiếu mục tiêu và báo cáo nghiệm thu' }).expect(200);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/performance/cycles/${cycle.body.id}`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ status: 'COMPLETED' }).expect(409);

    const band = await request(app.getHttpServer()).post('/api/v1/salary-bands').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ code: `LEAD-${stamp}`, name: 'Trưởng nhóm E2E', levelTitle: 'Trưởng nhóm', minSalary: 30_000_000, midSalary: 35_000_000, maxSalary: 40_000_000, jobTitles: ['Trưởng nhóm E2E'], criteria: 'Đủ năng lực điều phối và hướng dẫn nhóm', benchmarkSource: 'Dữ liệu E2E kiểm tra quyết định bổ nhiệm', effectiveFrom: iso(new Date(now.getTime() - 86_400_000)) }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/salary-bands/${band.body.id}/approve`).set('Authorization', `Bearer ${tokens.BOD}`).send({}).expect(201);
    const promotion = await request(app.getHttpServer()).post('/api/v1/personnel-actions').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ type: 'SALARY_ADJUST', subjectId: employee.id, payload: { newSalary: 35_000_000, salaryReason: 'PROMOTION', newJobTitle: 'Trưởng nhóm E2E', salaryBandId: band.body.id, reason: 'Bổ nhiệm theo năng lực và nhu cầu tổ chức' } }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/personnel-actions/${promotion.body.id}/approve`).set('Authorization', `Bearer ${tokens.BOD}`).send({}).expect(201);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: employee.id } })).jobTitle).toBe('Trưởng nhóm E2E');
    expect(await prisma.personnelAppointment.count({ where: { profile: { userId: employee.id }, isCurrent: true, positionTitle: 'Trưởng nhóm E2E' } })).toBe(1);

    const failed = await prisma.user.create({ data: { email: `failed-${stamp}@example.test`, passwordHash, fullName: 'E2E Thử việc không đạt', employmentStatus: 'PROBATION', hireDate: new Date(now.getTime() - 30 * 86_400_000), orgUnitId: manager.orgUnitId, roles: { create: { roleCode: 'USER' } } } });
    await prisma.contract.create({ data: { userId: failed.id, contractNo: `TV-FAIL-${stamp}`, type: 'PROBATION', startDate: failed.hireDate!, baseSalary: 10_000_000, createdById: managerId } });
    const asset = await request(app.getHttpServer()).post('/api/v1/hrms/assets').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ assetCode: `PENDING-${stamp}`, name: 'Laptop chưa ký nhận' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hrms/assets/${asset.body.id}/allocate`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ assignedUserId: failed.id, assignedEmployeeName: failed.fullName }).expect(200);
    const review = await request(app.getHttpServer()).post('/api/v1/hr-workflows/probation').set('Authorization', `Bearer ${tokens.HR_CB}`).send({ userId: failed.id, score: 30, assessment: 'Không đáp ứng các mục tiêu thử việc được giao', evidenceUrl: 'https://example.test/probation.pdf', recommendation: 'FAIL', effectiveDate: iso(now) }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/hr-workflows/probation/${review.body.id}`).set('Authorization', `Bearer ${tokens.ADMIN}`).send({ status: 'HR_VERIFIED', note: 'Đã kiểm tra minh chứng đánh giá' }).expect(200);
    await request(app.getHttpServer()).patch(`/api/v1/hr-workflows/probation/${review.body.id}`).set('Authorization', `Bearer ${tokens.BOD}`).send({ status: 'APPROVED', note: 'Phê duyệt kết luận không đạt' }).expect(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: failed.id } })).status).toBe('DISABLED');
    await request(app.getHttpServer()).patch(`/api/v1/hrms/assets/${asset.body.id}/return`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({ notes: 'Biên bản thu hồi thiết bị chưa ký nhận E2E' }).expect(200);
    expect((await prisma.hrmsAssetAllocation.findUniqueOrThrow({ where: { id: asset.body.id } })).status).toBe('AVAILABLE');
    const candidate = await prisma.hrmsJobApplicant.findFirstOrThrow({ where: { stage: 'HIRED' }, include: { jobOpening: true } });
    expect((await prisma.candidate.findFirstOrThrow({ where: { requisitionId: candidate.jobOpening.requisitionId, email: { equals: candidate.email, mode: 'insensitive' } } })).stage).toBe('HIRED');
  }, 120_000);
});
