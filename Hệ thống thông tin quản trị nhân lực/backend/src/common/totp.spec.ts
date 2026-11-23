import { buildOtpAuthUri, generateBackupCodes, generateTotpCode, generateTotpSecret, hashBackupCode, verifyTotpCode } from './totp';

describe('TOTP helper (RFC 6238)', () => {
  it('sinh bí mật Base32, URI otpauth:// và xác thực đúng mã theo cửa sổ thời gian', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);

    const uri = buildOtpAuthUri({ issuer: 'HRMIS Pro', accountName: 'admin@demo.local', secret });
    expect(uri).toContain('otpauth://totp/HRMIS%20Pro:admin%40demo.local');
    expect(uri).toContain(`secret=${secret}`);

    const now = 1_760_000_000_000;
    const code = generateTotpCode(secret, now);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotpCode(secret, code, 1, now)).toBe(true);
    expect(verifyTotpCode(secret, code, 1, now + 30_000)).toBe(true);
    expect(verifyTotpCode(secret, '000000', 0, now)).toBe(code === '000000');
  });

  it('sinh bộ backup codes và đối chiếu SHA-256 nhất quán', () => {
    const { plain, hashes } = generateBackupCodes(8);
    expect(plain).toHaveLength(8);
    expect(hashes).toHaveLength(8);
    plain.forEach((code, idx) => {
      expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
      expect(hashBackupCode(code.toLowerCase().replace('-', ' '))).toBe(hashes[idx]);
    });
  });
});
