import { computeAuditEntryHash, verifyAuditChain } from './audit-hash';

describe('Audit hash chain (SOX/ISO 27001)', () => {
  it('xác thực chuỗi băm hợp lệ kể cả khi có bản ghi legacy phía trước', () => {
    const t1 = new Date('2026-11-19T01:00:00.123Z');
    const t2 = new Date('2026-11-19T01:01:00.456Z');
    const h1 = computeAuditEntryHash({
      prevHash: 'GENESIS',
      actorId: 'u1',
      action: 'SETTINGS_UPDATED',
      entityType: 'Setting',
      entityId: null,
      requestId: 'req-1',
      createdAt: t1,
    });
    const h2 = computeAuditEntryHash({
      prevHash: h1,
      actorId: 'u2',
      action: 'PAYROLL_APPROVED',
      entityType: 'HrmsPayrollRun',
      entityId: 'run-1',
      requestId: 'req-2',
      createdAt: t2,
    });

    const result = verifyAuditChain([
      { id: 1n, action: 'LEGACY_EVENT', entityType: 'User', createdAt: t1, entryHash: null },
      { id: 2n, prevHash: 'GENESIS', actorId: 'u1', action: 'SETTINGS_UPDATED', entityType: 'Setting', entityId: null, requestId: 'req-1', createdAt: t1, entryHash: h1 },
      { id: 3n, prevHash: h1, actorId: 'u2', action: 'PAYROLL_APPROVED', entityType: 'HrmsPayrollRun', entityId: 'run-1', requestId: 'req-2', createdAt: t2, entryHash: h2 },
    ]);

    expect(result.valid).toBe(true);
    expect(result.legacyRows).toBe(1);
    expect(result.chainedRows).toBe(2);
    expect(result.latestHash).toBe(h2);
  });

  it('phát hiện ngay khi bản ghi trong chuỗi bị chỉnh sửa trái phép', () => {
    const t1 = new Date('2026-11-19T01:00:00.123Z');
    const h1 = computeAuditEntryHash({
      prevHash: 'GENESIS',
      actorId: 'u1',
      action: 'ROLE_UPDATED',
      entityType: 'User',
      entityId: 'u2',
      requestId: null,
      createdAt: t1,
    });

    const tampered = verifyAuditChain([
      {
        id: 10n,
        prevHash: 'GENESIS',
        actorId: 'u1',
        action: 'TAMPERED_ACTION',
        entityType: 'User',
        entityId: 'u2',
        requestId: null,
        createdAt: t1,
        entryHash: h1,
      },
    ]);

    expect(tampered.valid).toBe(false);
    expect(tampered.brokenAtId).toBe('10');
  });
});
