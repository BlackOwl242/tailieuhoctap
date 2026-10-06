import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

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
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = `${Date.now()}`;
    const roles = ['ADMIN', 'USER', 'HR_CB', 'HR_RECRUITER', 'ACCOUNTANT', 'BOD'];
    for (const code of roles) await prisma.role.upsert({ where: { code }, create: { code, name: code }, update: {} });
    const org = await prisma.orgUnit.create({ data: { name: `E2E Unit ${suffix}`, code: `E2E-${suffix}` } });
    const passwordHash = await bcrypt.hash('E2e-Only-Password!2026', 4);
    const makeUser = async (roleCode: string, label: string, extra: Record<string, unknown> = {}) => prisma.user.create({
      data: {
        email: `${label}-${suffix}@example.test`, passwordHash, fullName: `E2E ${label}`,
        status: 'ACTIVE', employmentStatus: 'ACTIVE', orgUnitId: org.id,
        hireDate: new Date('2020-01-01T00:00:00.000Z'), roles: { create: { roleCode } },
        ...extra,
      },
    });
    const users = {
      ADMIN: await makeUser('ADMIN', 'admin'),
      USER: await makeUser('USER', 'employee', { employeeCode: `E2E-${suffix}`, baseSalary: 30_000_000, taxDependentCount: 1, minimumWageRegion: 'I' }),
      HR_CB: await makeUser('HR_CB', 'manager'),
      HR_RECRUITER: await makeUser('HR_RECRUITER', 'recruiter'),
      HR_RECRUITER_2: await makeUser('HR_RECRUITER', 'recruiter-2'),
      ACCOUNTANT: await makeUser('ACCOUNTANT', 'accountant'),
      BOD: await makeUser('BOD', 'bod'),
    };
    employee = { id: users.USER.id, fullName: users.USER.fullName };
    managerId = users.HR_CB.id;
    tokens = {};
    for (const [role, user] of Object.entries(users)) {
      const login = await request(app.getHttpServer()).post('/api/v1/auth/login')
        .send({ email: user.email, password: 'E2e-Only-Password!2026' }).expect(200);
      tokens[role] = login.body.accessToken;
    }
  }, 60_000);

  afterAll(async () => { await app?.close(); });

  it('writes and closes attendance, settles payroll, records asset receipt/refund, and tracks development evidence', async () => {
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
    } });
    const structure = await prisma.hrmsSalaryStructure.create({ data: { name: `E2E Salary ${Date.now()}` } });
    await prisma.hrmsSalaryStructureItem.create({ data: { structureId: structure.id, componentId: overtimeComponent.id, amount: 2_000_000 } });
    await prisma.hrmsSalaryStructureAssignment.create({ data: { userId: employee.id, structureId: structure.id, fromDate: from, baseSalary: 30_000_000 } });
    const run = await request(app.getHttpServer()).post('/api/v1/hrms/payroll/runs')
      .set('Authorization', `Bearer ${tokens.ACCOUNTANT}`)
      .send({ periodName: `E2E ${year}-${String(month).padStart(2, '0')}`, fromDate: from.toISOString(), toDate: end.toISOString() })
      .expect(201);
    expect(run.body.policySnapshot.version).toMatch(/^VN-PAYROLL-/);
    const employeeSlip = run.body.slips.find((slip: { userId: string }) => slip.userId === employee.id);
    expect(employeeSlip).toBeTruthy();
    expect(employeeSlip.breakdown.calculation.overtimeBasis.contractualMonthlyWage).toBe(32_000_000);
    expect(employeeSlip.breakdown.calculation.minimumWageReview).toMatchObject({ region: 'I', status: 'PASS', monthlyMinimum: 5_310_000, hourlyMinimum: 25_500 });
    const deduction = await prisma.payrollLoanDeduction.findFirst({ where: { payrollRunId: run.body.id, loanId: loan.body.id } });
    expect(deduction?.amount).toBe(loan.body.monthlyEmi);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/review`).set('Authorization', `Bearer ${tokens.ACCOUNTANT}`).send({}).expect(403);
    await request(app.getHttpServer()).post(`/api/v1/hrms/payroll/runs/${run.body.id}/review`).set('Authorization', `Bearer ${tokens.HR_CB}`).send({}).expect(201);
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

    const cycles = await Promise.all([1, 2].map((n) => prisma.hrmsAppraisalCycle.create({ data: {
      name: `E2E năng lực ${n} ${Date.now()}`, year, startDate: new Date(`${year}-01-01T00:00:00.000Z`), endDate: new Date(`${year}-12-31T00:00:00.000Z`), status: 'ACTIVE',
    } })));
    const competency = await Promise.all(cycles.map((cycle, index) => request(app.getHttpServer()).post('/api/v1/hrms/performance/competencies')
      .set('Authorization', `Bearer ${tokens.USER}`).send({ cycleId: cycle.id, userId: employee.id, competencyCode: 'PROBLEM_SOLVING', currentLevel: index + 2, targetLevel: 4, selfNotes: `Minh chứng công việc kỳ ${index + 1}: đã phân tích nguyên nhân và kiểm tra kết quả xử lý.` }).expect(201)));
    const reviewedCompetency = await request(app.getHttpServer()).post(`/api/v1/hrms/performance/competencies/${competency[0].body.id}/review`)
      .set('Authorization', `Bearer ${tokens.HR_CB}`).send({ managerLevel: 2, managerNotes: 'Đã đối chiếu kết quả xử lý sự cố và trao đổi với nhân viên trong kỳ.' }).expect(201);
    expect(reviewedCompetency.body.currentLevel).toBe(2);
    expect(reviewedCompetency.body.managerLevel).toBe(2);
    expect(reviewedCompetency.body.status).toBe('MANAGER_REVIEWED');
    const plan = await request(app.getHttpServer()).post('/api/v1/hrms/performance/development-plans').set('Authorization', `Bearer ${tokens.USER}`)
      .send({ cycleId: cycles[1].id, assessmentId: competency[1].body.id, userId: employee.id, competencyCode: 'PROBLEM_SOLVING', objective: 'Tự phân tích nguyên nhân và đề xuất giải pháp có kiểm chứng', successCriteria: 'Quản lý xác nhận giải pháp được thử nghiệm và có kết quả', actions: ['Học phương pháp phân tích nguyên nhân', 'Thực hành với tình huống thực tế'], dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }).expect(201);
    expect(plan.body.status).toBe('PROPOSED');
    const timeline = await request(app.getHttpServer()).get(`/api/v1/hrms/performance/competencies?userId=${employee.id}`).set('Authorization', `Bearer ${tokens.USER}`).expect(200);
    expect(timeline.body.filter((row: { competencyCode: string }) => row.competencyCode === 'PROBLEM_SOLVING')).toHaveLength(2);
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
});
