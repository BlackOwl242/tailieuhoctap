import { FaceCryptoService } from './face-crypto.service';

/** Mã hóa AES-256-GCM cho vector khuôn mặt + so khớp cosine similarity. */
describe('FaceCryptoService', () => {
  let svc: FaceCryptoService;

  beforeAll(() => {
    // Khóa 32 byte base64 cho môi trường test
    process.env.FACE_EMBEDDING_KEY = Buffer.alloc(32, 7).toString('base64');
    svc = new FaceCryptoService();
  });

  it('mã hóa rồi giải mã giữ nguyên vector', () => {
    const vector = [0.1, -0.2, 0.3, 0.4, 0.5];
    const encrypted = svc.encryptEmbedding(vector);
    expect(encrypted).not.toContain('0.1'); // không lưu plaintext
    expect(svc.decryptEmbedding(encrypted)).toEqual(expect.arrayContaining([expect.closeTo(0.1, 5)]));
  });

  it('hai lần mã hóa cùng vector ra ciphertext khác nhau (IV ngẫu nhiên)', () => {
    const v = [1, 2, 3];
    expect(svc.encryptEmbedding(v)).not.toBe(svc.encryptEmbedding(v));
  });

  it('cosine similarity: vector giống nhau ≈ 1, khác góc vuông ≈ 0', () => {
    expect(FaceCryptoService.cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(FaceCryptoService.cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});
