import { Injectable } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export interface QrTokenPayload {
  kid: string; // id của kiosk phát hành
  iat: number; // thời điểm phát (epoch giây)
  jti: string; // định danh dùng một lần — chống chụp ảnh tái sử dụng
}

/**
 * Token QR cho kiosk điểm danh (mục 4.5 Luồng 4 của thiết kế):
 * - Ký HMAC-SHA256 bằng khóa riêng của từng kiosk;
 * - TTL ngắn (30s phát / ≤60s chấp nhận);
 * - jti chỉ dùng MỘT lần nhờ bộ nhớ đệm có hạn đời → chặn hoàn toàn việc
 *   chụp ảnh màn hình rồi tái sử dụng mã.
 */
@Injectable()
export class QrTokenService {
  /** jti đã tiêu dùng → thời điểm hết hạn (epoch ms) */
  private readonly usedJtis = new Map<string, number>();

  issue(deviceId: string, secret: string, ttlSec: number): { token: string; payload: QrTokenPayload; ttlSec: number } {
    const payload: QrTokenPayload = { kid: deviceId, iat: Math.floor(Date.now() / 1000), jti: randomUUID() };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(body).digest('base64url');
    return { token: `${body}.${sig}`, payload, ttlSec };
  }

  /**
   * Xác minh token: chữ ký đúng, chưa quá hạn (≤ 2× chu kỳ xoay),
   * và jti chưa từng được dùng. Trả về payload hoặc null kèm lý do.
   */
  verify(token: string, getSecret: (deviceId: string) => Promise<string | null>, maxAgeSec: number): Promise<{ ok: true; payload: QrTokenPayload } | { ok: false; reason: 'MALFORMED' | 'BAD_SIGNATURE' | 'EXPIRED' | 'REPLAY' }> {
    return this.verifyInternal(token, getSecret, maxAgeSec);
  }

  private async verifyInternal(
    token: string,
    getSecret: (deviceId: string) => Promise<string | null>,
    maxAgeSec: number,
  ): Promise<{ ok: true; payload: QrTokenPayload } | { ok: false; reason: 'MALFORMED' | 'BAD_SIGNATURE' | 'EXPIRED' | 'REPLAY' }> {
    const dot = token.indexOf('.');
    if (dot <= 0) return { ok: false, reason: 'MALFORMED' };
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    let payload: QrTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as QrTokenPayload;
    } catch {
      return { ok: false, reason: 'MALFORMED' };
    }
    if (!payload.kid || !payload.jti || typeof payload.iat !== 'number') return { ok: false, reason: 'MALFORMED' };

    const secret = await getSecret(payload.kid);
    if (!secret) return { ok: false, reason: 'BAD_SIGNATURE' };

    // So sánh chữ ký bằng timingSafeEqual để tránh timing attack
    const expected = createHmac('sha256', secret).update(body).digest();
    const given = Buffer.from(sig, 'base64url');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return { ok: false, reason: 'BAD_SIGNATURE' };
    }
    if (Math.floor(Date.now() / 1000) - payload.iat > maxAgeSec) {
      this.sweep();
      return { ok: false, reason: 'EXPIRED' };
    }
    if (this.usedJtis.has(payload.jti)) {
      return { ok: false, reason: 'REPLAY' };
    }
    // Đánh dấu jti đã dùng, tự dọn sau khi quá hạn dài nhất
    this.usedJtis.set(payload.jti, Date.now() + maxAgeSec * 2000);
    this.sweep();
    return { ok: true, payload };
  }

  /** Dọn các jti đã hết hạn để bộ nhớ đệm không phình vô hạn. */
  private sweep(): void {
    const now = Date.now();
    for (const [jti, expiresAt] of this.usedJtis) {
      if (expiresAt < now) this.usedJtis.delete(jti);
    }
  }
}
