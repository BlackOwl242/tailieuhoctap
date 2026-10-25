import { PersonnelEffectsService } from './personnel-effects.service';
describe('Effective personnel decisions',()=>{
 const today=new Date('2026-10-04T00:00:00Z');
 function setup(action:any){const tx:any={personnelAction:{findUniqueOrThrow:jest.fn().mockResolvedValue(action),updateMany:jest.fn().mockResolvedValue({count:1})},user:{findUniqueOrThrow:jest.fn().mockResolvedValue({id:'employee'}),update:jest.fn()},refreshToken:{updateMany:jest.fn()},faceEmbedding:{updateMany:jest.fn()},contract:{updateMany:jest.fn()},hrmsLifecycleEvent:{updateMany:jest.fn()},auditLog:{create:jest.fn()}};const db:any={personnelAction:{findMany:jest.fn().mockResolvedValue([action])},$transaction:jest.fn(async(fn:any)=>fn(tx))};return {service:new PersonnelEffectsService(db),tx,db};}
 const base={id:'decision',status:'APPROVED',type:'RESIGNATION',subjectId:'employee',requestedById:'hr',decidedById:'director',appliedAt:null,payload:{},effectiveAt:today};
 it('does not apply a future decision even if fetched by a stale worker',async()=>{const {service,tx}=setup({...base,effectiveAt:new Date('2026-11-01')});await service.applyDue(today);expect(tx.user.update).not.toHaveBeenCalled();expect(tx.auditLog.create).not.toHaveBeenCalled();});
 it('does not replay a decision already applied by another worker',async()=>{const {service,tx}=setup({...base,appliedAt:new Date()});await service.applyDue(today);expect(tx.user.update).not.toHaveBeenCalled();});
 it('revokes account, sessions and face templates together on resignation date',async()=>{const {service,tx}=setup(base);await service.applyDue(today);expect(tx.user.update).toHaveBeenCalledWith({where:{id:'employee'},data:{employmentStatus:'RESIGNED',status:'DISABLED'}});expect(tx.refreshToken.updateMany).toHaveBeenCalled();expect(tx.faceEmbedding.updateMany).toHaveBeenCalled();expect(tx.contract.updateMany).toHaveBeenCalled();expect(tx.personnelAction.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:{id:'decision',appliedAt:null,status:'APPROVED'}}));});
 it('preserves the original fixed-term agreement and its expiry when adding a salary amendment', async () => {
  const { service, tx } = setup({ ...base, type: 'SALARY_ADJUST', payload: { newSalary: 32_000_000 } });
  const root = { id: 'root', contractNo: 'CT-ROOT', type: 'FIXED_TERM', endDate: new Date('2026-12-31'), compensationBasis: 'MONTHLY', insuranceSalary: 30_000_000 };
  tx.contract.findFirst = jest.fn().mockResolvedValue(root); tx.contract.update = jest.fn(); tx.contract.create = jest.fn();
  tx.hrmsSalaryStructureAssignment = { findFirst: jest.fn().mockResolvedValue(null) };
  tx.personnelComprehensiveProfile = { upsert: jest.fn().mockResolvedValue({ id: 'profile' }) };
  tx.personnelSalaryHistory = { updateMany: jest.fn(), create: jest.fn() };
  await service.applyDue(today);
  expect(tx.contract.update).not.toHaveBeenCalled();
  expect(tx.contract.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'AMENDMENT', baseSalary: 32_000_000, endDate: root.endDate }) });
 });
 it('records an effective award in the personnel history exactly once', async () => {
  const { service, tx } = setup({ ...base, type: 'AWARD', payload: { decisionNo: 'QD-01', reason: 'Hoàn thành xuất sắc nhiệm vụ' } });
  tx.personnelComprehensiveProfile = { upsert: jest.fn().mockResolvedValue({ id: 'profile' }) };
  tx.personnelRewardDiscipline = { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() };
  await service.applyDue(today);
  expect(tx.personnelRewardDiscipline.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'REWARD', decisionNo: 'QD-01', profileId: 'profile' }) });
 });
 it('ends failed probation and revokes access on its approved effective date', async () => {
  const { service, tx } = setup({ ...base, type: 'PROBATION_FAIL', payload: { probationReviewId: 'review' } });
  await service.applyDue(today);
  expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'employee' }, data: { employmentStatus: 'RESIGNED', status: 'DISABLED' } });
  expect(tx.contract.updateMany).toHaveBeenCalled(); expect(tx.refreshToken.updateMany).toHaveBeenCalled();
 });
 it('applies promotion title, appointment and salary together and closes the prior allowance assignment', async () => {
  const { service, tx } = setup({ ...base, type: 'SALARY_ADJUST', payload: { salaryReason: 'PROMOTION', newJobTitle: 'Trưởng nhóm', newSalary: 35_000_000, salaryBandId: 'lead-band' } });
  tx.user.findUniqueOrThrow.mockResolvedValue({ id: 'employee', orgUnitId: 'unit' });
  tx.orgUnit = { findUniqueOrThrow: jest.fn().mockResolvedValue({ name: 'Kỹ thuật' }) };
  tx.contract.findFirst = jest.fn().mockResolvedValue({ id: 'contract', type: 'INDEFINITE', contractNo: 'CT', endDate: null }); tx.contract.create = jest.fn();
  tx.personnelComprehensiveProfile = { upsert: jest.fn().mockResolvedValue({ id: 'profile' }) };
  tx.personnelAppointment = { updateMany: jest.fn(), create: jest.fn() };
  tx.personnelSalaryHistory = { updateMany: jest.fn(), create: jest.fn() };
  tx.hrmsSalaryStructureAssignment = { findFirst: jest.fn().mockResolvedValue({ structureId: 'old' }), updateMany: jest.fn(), create: jest.fn() };
  await service.applyDue(today);
  expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'employee' }, data: { jobTitle: 'Trưởng nhóm', orgUnitId: 'unit' } });
  expect(tx.personnelAppointment.create.mock.calls[0][0].data).toMatchObject({ positionTitle: 'Trưởng nhóm', isCurrent: true });
  expect(tx.hrmsSalaryStructureAssignment.updateMany.mock.calls[0][0].data.toDate).toEqual(new Date('2026-10-03'));
  expect(tx.hrmsSalaryStructureAssignment.create).not.toHaveBeenCalled();
 });
});
