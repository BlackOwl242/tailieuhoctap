import { HrmsAssetsService } from './hrms-assets.module';

describe('Asset recovery for a departed employee', () => {
  function setup() {
    const db: any = { hrmsAssetAllocation: {
      findUnique: jest.fn().mockResolvedValue({ id: 'asset', status: 'PENDING_ACK', assignedUserId: 'departed', name: 'Laptop' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUniqueOrThrow: jest.fn().mockResolvedValue({ status: 'AVAILABLE' }),
    }, assetCustodyEvent: { create: jest.fn() } };
    db.$transaction = async (fn: any) => fn(db);
    return { db, service: new HrmsAssetsService(db, { log: jest.fn() } as any) };
  }
  it('recovers an unacknowledged allocation with documented verification without the employee logging in', async () => {
    const { db, service } = setup(); await service.returnAsset('hr', 'asset', 'Biên bản thu hồi BB-2026-01');
    expect(db.hrmsAssetAllocation.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'asset', status: 'PENDING_ACK' }, data: expect.objectContaining({ status: 'AVAILABLE', assignedUserId: null }) }));
    expect(db.assetCustodyEvent.create.mock.calls[0][0].data).toMatchObject({ userId: 'departed', actorId: 'hr', action: 'UNACKNOWLEDGED_RETURN' });
  });
  it('rejects an undocumented recovery of an unacknowledged allocation', async () => {
    const { db, service } = setup(); await expect(service.returnAsset('hr', 'asset')).rejects.toThrow('biên bản'); expect(db.hrmsAssetAllocation.updateMany).not.toHaveBeenCalled();
  });
});
