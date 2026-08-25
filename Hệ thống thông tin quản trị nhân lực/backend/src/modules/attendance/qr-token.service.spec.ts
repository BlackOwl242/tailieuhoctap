import { QrTokenService } from './qr-token.service';

/**
 * Unit test bảo mật token QR kiosk:
 * chữ ký HMAC đúng → hợp lệ; hết hạn / tái sử dụng / khóa sai → từ chối.
 */
describe('QrTokenService', () => {
  let svc: QrTokenService;
  const SECRET = 'kiosk-secret-for-tests';
  const getSecret = async (kid: string) => (kid === 'kiosk-1' ? SECRET : null);

  beforeEach(() => {
    svc = new QrTokenService();
  });

  it('phát và xác minh token hợp lệ', async () => {
    const { token } = svc.issue('kiosk-1', SECRET, 30);
    const result = await svc.verify(token, getSecret, 60);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload.kid).toBe('kiosk-1');
  });

  it('token ký bằng khóa khác → BAD_SIGNATURE', async () => {
    const { token } = svc.issue('kiosk-1', 'another-secret', 30);
    const result = await svc.verify(token, getSecret, 60);
    expect(result).toEqual({ ok: false, reason: 'BAD_SIGNATURE' });
  });

  it('token quá hạn → EXPIRED', async () => {
    // Tự ký một token với iat đã cũ 120 giây (chữ ký hợp lệ, chỉ hết hạn)
    const crypto = require('node:crypto');
    const body = Buffer.from(
      JSON.stringify({ kid: 'kiosk-1', iat: Math.floor(Date.now() / 1000) - 120, jti: 'expired-jti' }),
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    const result = await svc.verify(`${body}.${sig}`, getSecret, 60);
    expect(result).toEqual({ ok: false, reason: 'EXPIRED' });
  });

  it('jti chỉ dùng được MỘT lần (chống replay)', async () => {
    const { token } = svc.issue('kiosk-1', SECRET, 30);
    const first = await svc.verify(token, getSecret, 60);
    const second = await svc.verify(token, getSecret, 60);
    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, reason: 'REPLAY' });
  });

  it('deviceId không tồn tại → BAD_SIGNATURE', async () => {
    const { token } = svc.issue('ghost-kiosk', SECRET, 30);
    const result = await svc.verify(token, getSecret, 60);
    expect(result).toEqual({ ok: false, reason: 'BAD_SIGNATURE' });
  });
});
