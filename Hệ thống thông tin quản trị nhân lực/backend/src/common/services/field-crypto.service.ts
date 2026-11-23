import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ENC_PREFIX = 'enc:v1:';

/**
 * Dịch vụ mã hóa trường dữ liệu nhạy cảm cấp ứng dụng bằng AES-256-GCM:
 * - Dùng chung cho PII (`bankAccount`, `idCardNo`, `socialInsuranceNo`), bí mật TOTP (`mfaSecretEnc`)
 *   và vector sinh trắc học khuôn mặt.
 * - Môi trường production BẮT BUỘC cấu hình `DATA_ENCRYPTION_KEY` (hoặc `FACE_EMBEDDING_KEY`) >= 32 byte/ký tự;
 *   tuyệt đối không fallback về khóa cứng trên production.
 */
@Injectable()
export class FieldCryptoService {
  private readonly logger = new Logger(FieldCryptoService.name);
  private warnedDevFallback = false;

  private resolveKey(): Buffer {
    const raw = (process.env.DATA_ENCRYPTION_KEY || process.env.FACE_EMBEDDING_KEY || '').trim();
    if (raw) {
      const b64 = Buffer.from(raw, 'base64');
      if (b64.length === 32) return b64;
      if (raw.length >= 32) return createHash('sha256').update(raw).digest();
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'DATA_ENCRYPTION_KEY (hoặc FACE_EMBEDDING_KEY) chưa được cấu hình hợp lệ (yêu cầu >= 32 byte/ký tự) cho production.',
      );
    }

    const devSeed = (process.env.JWT_SECRET || '').trim() || 'hrmis-nonprod-ephemeral-dev-key-material';
    if (!this.warnedDevFallback && process.env.NODE_ENV !== 'test') {
      this.warnedDevFallback = true;
      this.logger.warn('Đang dùng khóa mã hóa dẫn xuất cục bộ cho môi trường phát triển; không dùng cho production.');
    }
    return createHash('sha256').update(devSeed).digest();
  }

  isEncrypted(value?: string | null): boolean {
    return typeof value === 'string' && value.startsWith(ENC_PREFIX);
  }

  /** Mã hóa chuỗi UTF-8 thành `enc:v1:<base64(iv|tag|ciphertext)>`. */
  encryptString(plaintext: string): string {
    if (this.isEncrypted(plaintext)) return plaintext;
    const key = this.resolveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENC_PREFIX}${Buffer.concat([iv, tag, encrypted]).toString('base64')}`;
  }

  /** Mã hóa chuỗi tùy chọn; giữ nguyên null/undefined, chuẩn hóa chuỗi rỗng thành null. */
  encryptOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return this.encryptString(trimmed);
  }

  /**
   * Giải mã chuỗi `enc:v1:...`. Nếu là dữ liệu plaintext cũ trước khi bật mã hóa
   * thì trả nguyên văn để tương thích ngược.
   */
  decryptString(value: string): string {
    if (!value || !this.isEncrypted(value)) return value;
    const raw = Buffer.from(value.slice(ENC_PREFIX.length), 'base64');
    if (raw.length < 28) {
      throw new Error('Dữ liệu mã hóa không hợp lệ (độ dài quá ngắn)');
    }
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.resolveKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  decryptOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined || value === null) return value;
    if (!value) return value;
    return this.decryptString(value);
  }

  /** Che dữ liệu nhạy cảm khi cần hiển thị rút gọn (VD: ****1234). */
  maskSensitive(value: string | null | undefined, visibleTail = 4): string | null {
    const plain = this.decryptOptionalString(value);
    if (!plain) return null;
    if (plain.length <= visibleTail) return '*'.repeat(plain.length);
    return `${'*'.repeat(Math.max(4, plain.length - visibleTail))}${plain.slice(-visibleTail)}`;
  }

  /** Mã hóa vector số thực (sinh trắc học) → `base64(iv|tag|ciphertext)`. */
  encryptVector(vector: number[]): string {
    const key = this.resolveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.from(new Float32Array(vector).buffer);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  /** Giải mã `base64(iv|tag|ciphertext)` → vector số thực. */
  decryptVector(encrypted: string): number[] {
    const raw = Buffer.from(encrypted, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.resolveKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return Array.from(new Float32Array(decrypted.buffer, decrypted.byteOffset, decrypted.byteLength / 4));
  }
}
