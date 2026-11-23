import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(secret: string): Buffer {
  const cleaned = secret.toUpperCase().replace(/[\s=-]+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error('Ký tự Base32 không hợp lệ trong khóa TOTP');
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Tạo khóa bí mật ngẫu nhiên 160-bit chuẩn RFC 6238 (Base32). */
export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(randomBytes(byteLength));
}

/** Tạo URI `otpauth://totp/...` tương thích Google Authenticator / Microsoft Authenticator / FreeOTP. */
export function buildOtpAuthUri(params: { issuer: string; accountName: string; secret: string }): string {
  const label = `${encodeURIComponent(params.issuer)}:${encodeURIComponent(params.accountName)}`;
  const qs = new URLSearchParams({
    secret: params.secret,
    issuer: params.issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${qs.toString()}`;
}

/** Sinh mã TOTP 6 chữ số theo bước thời gian 30s (RFC 6238 / RFC 4226). */
export function generateTotpCode(secret: string, timestampMs = Date.now(), periodSec = 30, digits = 6): string {
  const key = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / periodSec);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binCode % 10 ** digits).padStart(digits, '0');
}

/** Đối chiếu mã TOTP với cửa sổ trễ/sớm ±windowSteps (mặc định ±1 bước = ±30s) dùng constant-time compare. */
export function verifyTotpCode(
  secret: string,
  token: string,
  windowSteps = 1,
  timestampMs = Date.now(),
  periodSec = 30,
): boolean {
  const normalized = token.replace(/\s|-/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  const tokenBuf = Buffer.from(normalized, 'utf8');
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const candidate = generateTotpCode(secret, timestampMs + delta * periodSec * 1000, periodSec, 6);
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (candidateBuf.length === tokenBuf.length && timingSafeEqual(candidateBuf, tokenBuf)) {
      return true;
    }
  }
  return false;
}

export function hashBackupCode(code: string): string {
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return createHash('sha256').update(normalized).digest('hex');
}

/** Tạo bộ mã khôi phục dự phòng 1 lần (`XXXX-XXXX`) và bản băm SHA-256 tương ứng. */
export function generateBackupCodes(count = 8): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const hex = randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
    plain.push(formatted);
    hashes.push(hashBackupCode(formatted));
  }
  return { plain, hashes };
}
