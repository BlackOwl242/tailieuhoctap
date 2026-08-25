'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { MonitorPlay, RefreshCw } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/primitives';

/**
 * Trang KIOSK điểm danh (UC26):
 * - Lấy token HMAC từ server và vẽ mã QR, tự xoay theo TTL (mặc định 30s);
 * - Nhân viên quét bằng điện thoại → mở /check-in?token=...;
 * - Nút "Giả lập quét" để demo khi không có điện thoại cùng mạng LAN
 *   (thao tác như thể chính người đang đăng nhập trên máy này quét mã).
 */
export default function KioskPage() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const currentToken = useRef<string | null>(null);
  const ttlRef = useRef(30);
  const [retryCount, setRetryCount] = useState(0);

  /** Lấy token mới từ server rồi render thành ảnh QR. */
  const rotate = useCallback(async () => {
    try {
      const res = await api.get<{ token: string; ttlSec: number }>('/attendance/kiosk/token');
      currentToken.current = res.data.token;
      ttlRef.current = res.data.ttlSec;
      setCountdown(res.data.ttlSec);
      const url = await QRCode.toDataURL(`${window.location.origin}/check-in?token=${encodeURIComponent(res.data.token)}`, {
        width: 320, margin: 2,
      });
      setDataUrl(url);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  // Xoay mã theo chu kỳ TTL; tự thử lại khi lỗi (Mục 2 — lỗi thân thiện)
  useEffect(() => {
    void rotate();
    const timer = setInterval(() => void rotate(), 30_000);
    const retry = setInterval(() => setRetryCount((c) => c + 1), 10_000);
    return () => {
      clearInterval(timer);
      clearInterval(retry);
    };
  }, [rotate, retryCount]);

  // Đồng hồ đếm ngược hiển thị cho người đứng trước kiosk
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : ttlRef.current)), 1000);
    return () => clearInterval(t);
  }, []);

  /** Giả lập quét: gửi chính token đang hiển thị lên server. */
  async function simulateScan() {
    if (!currentToken.current) return;
    try {
      const res = await api.post('/attendance/check-in', { method: 'QR', qrToken: currentToken.current });
      setLastResult(`Chấm công ${new Date().toLocaleTimeString('vi-VN')} ✓ (${res.data.punch === 'IN' ? 'VÀO' : 'RA'})`);
    } catch (e) {
      setLastResult(`Từ chối: ${errorMessage(e)}`);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-white">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <MonitorPlay className="h-6 w-6" /> Kiosk điểm danh
      </div>

      {/* Khung QR — viền đổi màu khi sắp hết hạn */}
      <div className={`rounded-3xl bg-white p-5 shadow-2xl transition-colors ${countdown <= 5 ? 'ring-4 ring-amber-400' : ''}`}>
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Mã QR điểm danh" width={280} height={280} />
        ) : (
          <div className="flex h-[280px] w-[280px] items-center justify-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-3xl font-bold tabular-nums">{countdown}s</p>
        <p className="mt-1 max-w-xs text-sm text-slate-300">
          Quét mã bằng camera điện thoại để chấm công. Mã tự thay đổi mỗi {ttlRef.current} giây — không thể chụp lại dùng.
        </p>
      </div>

      {lastResult ? (
        <p className="rounded-lg bg-white/10 px-4 py-2 text-sm" role="status">{lastResult}</p>
      ) : null}
      {error ? (
        <div className="flex max-w-sm flex-col items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-200" role="alert">
          <p>{error}</p>
          <p className="text-xs text-red-300/80">
            Hệ thống sẽ tự thử lại. Hãy bảo đảm đã tạo thiết bị chấm công loại “Kiosk QR” ở trang Quản trị → Thiết bị chấm công.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void rotate()}>Thử lại ngay</Button>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={simulateScan} disabled={!currentToken.current}>Giả lập quét (demo)</Button>
        <Link href="/dashboard">
          <Button variant="ghost" className="text-white hover:bg-white/10">← Về ứng dụng</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost" className="text-white hover:bg-white/10">Trang đăng nhập</Button>
        </Link>
      </div>
    </main>
  );
}
