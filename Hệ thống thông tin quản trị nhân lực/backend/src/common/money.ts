import { Prisma } from '@prisma/client';

export interface IsoCurrencyMeta {
  code: string;
  decimals: number;
  symbol: string;
  label: string;
}

/** Danh mục tiền tệ chuẩn ISO 4217 được hệ thống hỗ trợ. */
export const ISO_CURRENCIES: Record<string, IsoCurrencyMeta> = {
  VND: { code: 'VND', decimals: 0, symbol: '₫', label: 'VND — Việt Nam Đồng' },
  USD: { code: 'USD', decimals: 2, symbol: '$', label: 'USD — Đô la Mỹ' },
  EUR: { code: 'EUR', decimals: 2, symbol: '€', label: 'EUR — Euro' },
  SGD: { code: 'SGD', decimals: 2, symbol: 'S$', label: 'SGD — Đô la Singapore' },
  GBP: { code: 'GBP', decimals: 2, symbol: '£', label: 'GBP — Bảng Anh' },
  JPY: { code: 'JPY', decimals: 0, symbol: '¥', label: 'JPY — Yên Nhật' },
};

export function isSupportedCurrency(code: string | null | undefined): boolean {
  if (!code) return false;
  return Object.prototype.hasOwnProperty.call(ISO_CURRENCIES, code.trim().toUpperCase());
}

/** Chuyển an toàn giá trị Decimal/số/chuỗi từ CSDL sang number để tính toán/JSON API. */
export function toMoney(value: Prisma.Decimal | number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    const parsed = value.toNumber();
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function toMoneyOrNull(value: Prisma.Decimal | number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = toMoney(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Làm tròn cố định (fixed-point HALF_UP) theo chuẩn chữ số thập phân ISO 4217 bằng Prisma.Decimal. */
export function roundCurrency(value: Prisma.Decimal | number | string, currency = 'VND'): number {
  const meta = ISO_CURRENCIES[currency.toUpperCase()] ?? ISO_CURRENCIES.VND;
  const dec = new Prisma.Decimal(typeof value === 'number' ? value.toString() : value);
  return dec.toDecimalPlaces(meta.decimals, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

/** Chuyển đệ quy mọi instance Prisma.Decimal trong response thành number để giữ nguyên contract JSON. */
export function normalizeDecimalsDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (Prisma.Decimal.isDecimal(value)) {
    return (value as Prisma.Decimal).toNumber() as unknown as T;
  }
  if (value instanceof Date || Buffer.isBuffer(value) || value instanceof RegExp) return value;
  if (seen.has(value as object)) return value;
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => normalizeDecimalsDeep(item, seen)) as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = normalizeDecimalsDeep(v, seen);
  }
  return out as T;
}
