import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Bảo vệ dữ liệu sinh trắc học theo Nghị định 13/2023/NĐ-CP:
 * - Vector khuôn mặt được mã hóa AES-256-GCM trước khi lưu;
 * - KHÔNG lưu ảnh gốc; log không bao giờ ghi nội dung vector;
 * - So khớp bằng cosine similarity trên vector đã giải mã trong RAM.
 */
@Injectable()
export class FaceCryptoService {
  private key(): Buffer {
    const raw = process.env.FACE_EMBEDDING_KEY || '';
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== 32) {
      throw new Error('FACE_EMBEDDING_KEY phải là base64 của 32 byte');
    }
    return buf;
  }

  /** Mã hóa vector float[] → chuỗi base64(iv|tag|ciphertext). */
  encryptEmbedding(vector: number[]): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const data = Buffer.from(new Float32Array(vector).buffer);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  /** Giải mã ngược chuỗi base64 → vector float[]. */
  decryptEmbedding(encrypted: string): number[] {
    const raw = Buffer.from(encrypted, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return Array.from(new Float32Array(decrypted.buffer, decrypted.byteOffset, decrypted.byteLength / 4));
  }

  /** Cosine similarity giữa hai vector cùng chiều. */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}
