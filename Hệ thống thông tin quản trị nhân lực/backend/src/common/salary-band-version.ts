import { Prisma } from '@prisma/client';

/** Resolve the approved version for a date while preserving historical profile links. */
export async function salaryBandForDate(db: Prisma.TransactionClient, id: string | null | undefined, date: Date) {
  if (!id) return null;
  const selected = await db.hrmsSalaryBand.findUnique({ where: { id } });
  if (!selected) return null;
  if (selected.status === 'ACTIVE' && selected.effectiveFrom <= date && (!selected.effectiveTo || selected.effectiveTo >= date)) return selected;
  // A deliberately stopped band must not silently become active through another version.
  if (selected.status !== 'ACTIVE') return selected;
  return await db.hrmsSalaryBand.findFirst({ where: {
    code: selected.code, status: 'ACTIVE', approvedAt: { not: null }, effectiveFrom: { lte: date },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
  }, orderBy: { effectiveFrom: 'desc' } }) ?? selected;
}
