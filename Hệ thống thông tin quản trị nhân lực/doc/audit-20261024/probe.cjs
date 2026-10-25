/* Read-only business-rule probes. Execute: node doc/audit-20261024/probe.cjs
 * Extracts actual service methods through TypeScript AST. Uses in-memory database
 * doubles and exception stubs; does not start Nest, run HTTP guards, or access a DB.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
class BusinessError extends Error {}
class CodedBusinessError extends Error { constructor(code, message) { super(message); this.code = code; } }
const context = vm.createContext({
  console, process, Date, Map, Set,
  ConflictException: BusinessError, BadRequestException: BusinessError,
  ForbiddenException: BusinessError, NotFoundException: BusinessError,
  BusinessException: CodedBusinessError, ErrorCodes: {}, HttpStatus: {},
  ClaimStatus: Object.fromEntries(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'].map(s => [s, s])),
});
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS };
function helpers(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions }).outputText;
  const output = {};
  context.exports = output;
  context.require = (id) => {
    if (id === '@nestjs/common') return { BadRequestException: BusinessError, ConflictException: BusinessError };
    throw new Error(`Unexpected dependency: ${id}`);
  };
  vm.runInContext(`(function(exports, require) {\n${compiled}\n})(exports, require);`, context, { filename: file });
  Object.assign(context, output);
}
helpers('backend/src/common/hr-time.ts');
helpers('backend/src/common/payroll-calculator.ts');
helpers('backend/src/common/personnel-action-rules.ts');
function service(file, name, methods) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const cls = source.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === name);
  assert(cls, name);
  const selected = cls.members.filter(n => ts.isConstructorDeclaration(n)
    || ts.isPropertyDeclaration(n)
    || ts.isMethodDeclaration(n) && methods.includes(n.name.getText(source)));
  const functions = source.statements.filter(ts.isFunctionDeclaration).map(n => n.getText(source)).join('\n');
  const text = `${functions}\nclass ${name} {\n${selected.map(n => n.getText(source)).join('\n')}\n}\nglobalThis.${name} = ${name};`;
  vm.runInContext(ts.transpileModule(text, { compilerOptions }).outputText, context, { filename: file });
  return context[name];
}
const Payroll = service('backend/src/modules/hrms-payroll/hrms-payroll.module.ts', 'HrmsPayrollService', ['cancelPayrollRunForRecalculation', 'calculatePayrollRun', 'transition']);
const Leave = service('backend/src/modules/leave/leave.module.ts', 'LeaveService', ['ensureBalance', 'create']);
const Expenses = service('backend/src/modules/hrms-expenses/hrms-expenses.module.ts', 'HrmsExpensesService', ['deleteClaim', 'statusPermission']);
const Assets = service('backend/src/modules/hrms-assets/hrms-assets.module.ts', 'HrmsAssetsService', ['returnAsset']);
const Ledger = service('backend/src/common/services/attendance-ledger.service.ts', 'AttendanceLedgerService', ['runAutoAttendanceSync']);
context.ROLES_KEY = 'roles';
const Guard = service('backend/src/common/guards/roles.guard.ts', 'RolesGuard', ['canActivate']);
const audit = { log: async () => {} };
const settings = { get: async (key, fallback) => fallback };
function database(models) {
  const db = { ...models, auditLog: { create: async () => ({}) } };
  db.$transaction = async fn => fn(db);
  return db;
}
const results = [];
async function probe(id, title, run) {
  try { results.push({ id, title, reproduced: true, evidence: await run() }); }
  catch (error) { results.push({ id, title, reproduced: false, error: error.stack }); process.exitCode = 1; }
}
(async () => {
  await probe('P01', 'Paid payroll can be cancelled without reversing payment', async () => {
    const run = { id: 'run', status: 'PAID', paymentReference: 'BANK-ALREADY-PAID' };
    const db = database({ hrmsPayrollRun: {
      findUnique: async () => run,
      updateMany: async args => { Object.assign(run, args.data); return { count: 1 }; },
    }, payrollLoanDeduction: { count: async () => 0 }, hrmsPayrollSlip: { updateMany: async () => ({ count: 1 }) } });
    await new Payroll(db, audit, settings, {}).cancelPayrollRunForRecalculation('hr', 'run');
    assert.equal(run.status, 'CANCELLED');
    assert.equal(run.paymentReference, 'BANK-ALREADY-PAID');
    return { status: run.status, paymentReference: run.paymentReference };
  });
  await probe('P02', 'A midmonth new hire blocks the payroll calculation before their hire date', async () => {
    const db = database({
      attendancePeriod: { findUnique: async () => ({ id: 'period', status: 'FINALIZED', snapshot: [{ userId: 'new-hire', workDate: '2026-10-15', status: 'PRESENT', workedMinutes: 480 }] }) },
      setting: { findUnique: async () => ({ value: { orgSector: 'enterprise' } }) },
      hrmsPayrollRun: { findFirst: async () => null, create: async () => ({ id: 'run' }) },
      user: { findMany: async () => [{ id: 'new-hire', fullName: 'New hire', hireDate: new Date('2026-10-15'), baseSalary: 20000000 }] },
      hrmsSalaryStructure: { findMany: async () => [] }, hrmsSalaryBand: { findMany: async () => [] },
      hrmsShiftAssignment: { findMany: async () => [] }, hrmsSalaryStructureAssignment: { findMany: async () => [] },
      contract: { findMany: async () => [{ id: 'contract', status: 'ACTIVE', type: 'INDEFINITE', startDate: new Date('2026-10-15'), endDate: null, baseSalary: 20000000, compensationBasis: 'MONTHLY' }] },
      personnelAction: { findMany: async () => [] },
    });
    let error;
    try { await new Payroll(db, audit, settings, {}).calculatePayrollRun('hr', { fromDate: '2026-10-01', toDate: '2026-10-31', periodName: 'October' }); }
    catch (caught) { error = caught; }
    assert(error);
    assert.match(error.message, /2026-10-01/);
    assert.match(error.message, /hợp đồng/);
    return error.message;
  });
  await probe('P03', 'Processed payroll can be reviewed while its attendance period is open', async () => {
    const run = { id: 'run', status: 'PROCESSED', processedBy: 'hr', attendancePeriodId: 'reopened-period' };
    let attendanceReads = 0;
    const db = database({
      hrmsPayrollRun: { findUnique: async () => run, findUniqueOrThrow: async () => run, updateMany: async args => { Object.assign(run, args.data); return { count: 1 }; } },
      attendancePeriod: { findUnique: async () => { attendanceReads++; return { status: 'OPEN', version: 2 }; } },
    });
    await new Payroll(db, audit, settings, {}).transition('accountant', 'run', 'REVIEWED');
    assert.equal(run.status, 'REVIEWED'); assert.equal(attendanceReads, 0);
    return { payrollStatus: run.status, attendanceReads };
  });
  await probe('P04', 'Saturday leave is rejected without reading the employee shift', async () => {
    let shiftReads = 0;
    const db = database({ leaveRequest: { findFirst: async () => null }, hrmsShiftAssignment: { findMany: async () => { shiftReads++; return [{ workDays: [1, 2, 3, 4, 5, 6] }]; } } });
    let error;
    try { await new Leave(db, audit, { assertMutable: async () => {} }, {}, settings).create({ type: 'UNPAID', startDate: '2026-10-24', endDate: '2026-10-24', reason: 'Saturday shift' }, { id: 'employee' }); }
    catch (caught) { error = caught; }
    assert(error); assert.match(error.message, /không có ngày làm việc/); assert.equal(shiftReads, 0);
    return { error: error.message, shiftReads };
  });
  await probe('P05', 'December new hire receives a full 12-day initial balance', async () => {
    const db = database({ user: { findUnique: async () => ({ hireDate: new Date('2026-12-15') }) }, leaveBalance: { findUnique: async () => null, upsert: async args => args.create } });
    const balance = await new Leave(db, audit, {}, {}, settings).ensureBalance('employee', 2026);
    assert.equal(balance.entitled, 12); return balance;
  });
  await probe('P06', 'Expense deletion does not check the owner or actor role', async () => {
    let deleted = false;
    const claim = { id: 'victim-claim', userId: 'victim', status: 'SUBMITTED', title: 'Victim expense' };
    const db = database({ hrmsExpenseClaim: { findUnique: async () => claim, delete: async () => { deleted = true; return claim; } } });
    await new Expenses(db, audit).deleteClaim('unrelated-user', claim.id);
    assert(deleted); return { actor: 'unrelated-user', owner: claim.userId, deleted };
  });
  await probe('P07', 'Asset awaiting acknowledgement cannot be returned', async () => {
    const db = database({ hrmsAssetAllocation: { findUnique: async () => ({ id: 'asset', status: 'PENDING_ACK', assignedUserId: 'resigned-user' }) } });
    let error;
    try { await new Assets(db, audit).returnAsset('hr', 'asset'); } catch (caught) { error = caught; }
    assert(error); assert.match(error.message, /xác nhận/); return error.message;
  });
  await probe('P08', 'A line manager can approve expenses without any organizational scope check', async () => {
    let userLookups = 0;
    const db = database({ userRole: { findMany: async () => [{ roleCode: 'LINE_MANAGER' }] }, user: { findUnique: async () => { userLookups++; return null; } } });
    await new Expenses(db, audit).statusPermission('unrelated-manager', 'APPROVED', 'SUBMITTED', 'employee-in-another-team');
    assert.equal(userLookups, 0); return { authorized: true, userLookups };
  });
  await probe('P09', 'Automatic sync overwrites absence despite disabled auto attendance on the shift', async () => {
    const generated = [], updates = [];
    const day = new Date('2026-10-01');
    const db = database({
      attendancePeriod: { findMany: async () => [] }, hrmsPayrollRun: { findMany: async () => [] },
      user: { findMany: async () => [{ id: 'employee', hireDate: day }] },
      hrmsShiftAssignment: { findMany: async () => [{ userId: 'employee', startDate: day, endDate: null, workDays: [1, 2, 3, 4, 5], shiftType: { startTime: '08:00', endTime: '17:30', lateToleranceMinutes: 15, enableAutoAttendance: false } }] },
      attendanceDay: { findMany: async () => [{ userId: 'employee', workDate: day, status: 'ABSENT', workedMinutes: 0, eventCount: 0 }], createMany: async () => ({}), update: async args => { updates.push(args); return {}; } },
      leaveRequest: { findMany: async () => [] }, hrmsAttendanceRegularization: { findMany: async () => [] }, attendanceCorrection: { findMany: async () => [] },
      attendanceDevice: { findFirst: async () => ({ id: 'simulator' }) },
      attendanceEvent: { createMany: async args => { generated.push(...args.data); return {}; } },
    });
    const result = await new Ledger(db, settings).runAutoAttendanceSync(day, '2026-10-01');
    assert.equal(generated.length, 2); assert.equal(updates[0].data.status, 'PRESENT');
    return { ...result, enableAutoAttendance: false, before: 'ABSENT', after: updates[0].data.status, firstIn: generated[0].occurredAt.toISOString(), lastOut: generated[1].occurredAt.toISOString() };
  });
  await probe('P10', 'Read-only payroll permission prose does not prevent expense DELETE', async () => {
    const reflector = { getAllAndOverride: () => ['ADMIN', 'USER', 'ACCOUNTANT'] };
    const db = { setting: { findUnique: async () => ({ value: [{ moduleKey: 'PAYROLL', permissions: { USER: 'Chỉ xem phiếu lương cá nhân' } }] }) } };
    const request = { method: 'DELETE', originalUrl: '/hrms/expenses/claims/victim-claim', user: { id: 'unrelated-user', roles: ['USER'] } };
    const execution = { getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => request }) };
    const allowed = await new Guard(reflector, db).canActivate(execution);
    assert.equal(allowed, true);
    return { method: request.method, permission: 'Chỉ xem phiếu lương cá nhân', allowed };
  });
  const report = { timestamp: new Date().toISOString(), method: 'Actual methods extracted from TypeScript source; in-memory database doubles; no HTTP or real DB', total: results.length, reproduced: results.filter(r => r.reproduced).length, results };
  fs.writeFileSync(path.join(__dirname, 'probe-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})();
