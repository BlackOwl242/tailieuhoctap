import { Prisma } from '@prisma/client';
import { isSupportedCurrency, normalizeDecimalsDeep, roundCurrency, toMoney, toMoneyOrNull } from './money';

describe('Money & ISO 4217 helper', () => {
  it('chuyển đổi Decimal / chuỗi / số an toàn và giữ làm tròn fixed-point HALF_UP', () => {
    expect(toMoney(new Prisma.Decimal('15500000.50'))).toBe(15500000.5);
    expect(toMoney(null, 0)).toBe(0);
    expect(toMoneyOrNull(null)).toBeNull();
    expect(roundCurrency('1000.5', 'VND')).toBe(1001);
    expect(roundCurrency('123.455', 'USD')).toBe(123.46);
    expect(isSupportedCurrency('vnd')).toBe(true);
    expect(isSupportedCurrency('ZZZ')).toBe(false);
  });

  it('normalizeDecimalsDeep chuyển toàn bộ Prisma.Decimal lồng nhau thành number', () => {
    const dt = new Date('2026-11-19T00:00:00.000Z');
    const out = normalizeDecimalsDeep({
      totalNetPay: new Prisma.Decimal('42000000.00'),
      slips: [{ grossPay: new Prisma.Decimal('21000000.25'), paidAt: dt }],
    });
    expect(out).toEqual({
      totalNetPay: 42000000,
      slips: [{ grossPay: 21000000.25, paidAt: dt }],
    });
  });
});
