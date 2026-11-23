import { FieldCryptoService } from './field-crypto.service';

describe('FieldCryptoService', () => {
  const prevEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it('mã hóa và giải mã chuỗi PII khứ hồi với prefix enc:v1:', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const svc = new FieldCryptoService();

    const encrypted = svc.encryptString('079095001234');
    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain('079095001234');
    expect(svc.decryptString(encrypted)).toBe('079095001234');
  });

  it('tương thích ngược với plaintext cũ chưa mã hóa', () => {
    process.env.NODE_ENV = 'test';
    const svc = new FieldCryptoService();

    expect(svc.isEncrypted('1900123456')).toBe(false);
    expect(svc.decryptOptionalString('1900123456')).toBe('1900123456');
    expect(svc.maskSensitive('1900123456')).toBe('******3456');
    expect(svc.encryptOptionalString('   ')).toBeNull();
  });

  it('fail-fast trong production nếu thiếu DATA_ENCRYPTION_KEY hợp lệ', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATA_ENCRYPTION_KEY;
    delete process.env.FACE_EMBEDDING_KEY;
    const svc = new FieldCryptoService();

    expect(() => svc.encryptString('secret-value')).toThrow(/DATA_ENCRYPTION_KEY/);
  });
});
