import { Injectable, Optional } from '@nestjs/common';
import { FieldCryptoService } from '../../common/services/field-crypto.service';

/**
 * Mã hóa mẫu khuôn mặt khi lưu trữ; ủy quyền quản lý khóa cho FieldCryptoService
 * (AES-256-GCM, fail-fast khi thiếu khóa trong production).
 */
@Injectable()
export class FaceCryptoService {
  private readonly cryptoService: FieldCryptoService;

  constructor(@Optional() fieldCrypto?: FieldCryptoService) {
    this.cryptoService = fieldCrypto ?? new FieldCryptoService();
  }

  /** Mã hóa vector float[] → chuỗi base64(iv|tag|ciphertext). */
  encryptEmbedding(vector: number[]): string {
    return this.cryptoService.encryptVector(vector);
  }

  /** Giải mã ngược chuỗi base64 → vector float[]. */
  decryptEmbedding(encrypted: string): number[] {
    return this.cryptoService.decryptVector(encrypted);
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
