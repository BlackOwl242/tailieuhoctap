'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Fingerprint,
  Info,
  Maximize,
  Minimize,
  MonitorPlay,
  QrCode,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Badge, Button } from '@/components/ui/primitives';

/**
 * Âm thanh báo hiệu Web Audio API
 */
function playKioskChime(type: 'success' | 'error') {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08); // A5
      gain2.gain.setValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.4);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {}
}

interface RecentPunch {
  id: string;
  name: string;
  punch: 'IN' | 'OUT';
  time: string;
}

export default function KioskPage() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    ok: boolean;
    message: string;
    punch?: 'IN' | 'OUT';
    time?: string;
  } | null>(null);

  const [recentPunches, setRecentPunches] = useState<RecentPunch[]>([
    { id: '1', name: 'Nguyễn Văn An', punch: 'IN', time: '08:28:15' },
    { id: '2', name: 'Trần Thị Bích', punch: 'IN', time: '08:29:40' },
  ]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentToken = useRef<string | null>(null);
  const ttlRef = useRef(30);
  const [retryCount, setRetryCount] = useState(0);

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  /** Lấy token mới từ server rồi render thành ảnh QR */
  const rotate = useCallback(async () => {
    try {
      const res = await api.get<{ token: string; ttlSec: number }>('/attendance/kiosk/token');
      currentToken.current = res.data.token;
      ttlRef.current = res.data.ttlSec;
      setCountdown(res.data.ttlSec);
      const url = await QRCode.toDataURL(
        `${window.location.origin}/check-in?token=${encodeURIComponent(res.data.token)}`,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        },
      );
      setDataUrl(url);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  // Xoay mã theo chu kỳ TTL
  useEffect(() => {
    void rotate();
    const timer = setInterval(() => void rotate(), 30_000);
    const retry = setInterval(() => setRetryCount((c) => c + 1), 10_000);
    return () => {
      clearInterval(timer);
      clearInterval(retry);
    };
  }, [rotate, retryCount]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : ttlRef.current)), 1000);
    return () => clearInterval(t);
  }, []);

  /** Giả lập quét (demo khi không có điện thoại) */
  async function simulateScan() {
    if (!currentToken.current) return;
    try {
      const res = await api.post('/attendance/check-in', { method: 'QR', qrToken: currentToken.current });
      const punchType: 'IN' | 'OUT' = res.data.punch === 'IN' ? 'IN' : 'OUT';
      const timeStr = new Date().toLocaleTimeString('vi-VN');
      if (soundEnabled) playKioskChime('success');
      setLastResult({
        ok: true,
        message: `Chấm công thành công (${punchType === 'IN' ? 'GIỜ VÀO' : 'GIỜ RA'}) lúc ${timeStr}`,
        punch: punchType,
        time: timeStr,
      });

      // Thêm vào danh sách gần đây
      setRecentPunches((prev) => [
        {
          id: String(Date.now()),
          name: 'Bạn (Người dùng hiện tại)',
          punch: punchType,
          time: timeStr,
        },
        ...prev.slice(0, 4),
      ]);
    } catch (e) {
      if (soundEnabled) playKioskChime('error');
      setLastResult({
        ok: false,
        message: `Từ chối chấm công: ${errorMessage(e)}`,
      });
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-primary/20">
      {/* ================= HEADER KIOSK ================= */}
      <header className="border-b border-slate-200 bg-white shadow-xs px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <MonitorPlay className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kiosk Điểm Danh Điện Tử</h1>
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px] font-semibold">
                  Trạm Sảnh Chính
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Mã QR động HMAC · Tự động đổi mỗi 30 giây chống chụp lại màn hình</p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="flex flex-col items-end">
            <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
              {currentTime || '--:--:--'}
            </span>
            <span className="text-[11px] text-slate-500 capitalize">{currentDate}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              title={soundEnabled ? 'Tắt âm thanh Kiosk' : 'Bật âm thanh Kiosk'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Toàn màn hình Kiosk"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs">
                <ArrowLeft className="h-4 w-4" /> Về ứng dụng
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ================= BODY KIOSK (2 Cột Chuẩn Sáng) ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: MÃ QR ĐỘNG + BẢNG ĐIỀU KHIỂN (7 Cột) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-4">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col items-center gap-6">
            {/* Header info bar bên trong card (Không dùng absolute tránh lỗi z-index) */}
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700">Mã QR đang hoạt động</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-600 font-medium">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Tự động làm mới sau: <strong className="font-mono text-slate-900 font-bold">{countdown}s</strong></span>
              </div>
            </div>

            {/* Khung chứa ảnh QR */}
            <div
              className={`rounded-2xl border-2 p-4 transition-all duration-300 bg-white ${
                countdown <= 5
                  ? 'border-amber-400 shadow-md ring-4 ring-amber-100'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dataUrl} alt="Mã QR Kiosk điểm danh" width={260} height={260} className="rounded-lg block" />
              ) : (
                <div className="flex h-[260px] w-[260px] flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Đang tạo mã bảo mật…</span>
                </div>
              )}
            </div>

            {/* Hướng dẫn quét */}
            <div className="text-center max-w-md">
              <h2 className="text-base font-bold text-slate-900">Quét mã bằng Camera điện thoại</h2>
              <p className="text-xs text-slate-500 mt-1">
                Sử dụng Camera trên điện thoại cá nhân hoặc ứng dụng Zalo để quét mã và hoàn tất điểm danh tự động trong 1 giây.
              </p>
            </div>

            {/* Thanh thao tác */}
            <div className="flex items-center gap-3 w-full max-w-md">
              <Button
                variant="default"
                onClick={simulateScan}
                disabled={!currentToken.current}
                className="flex-1 py-5 font-semibold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <UserCheck className="h-4 w-4 mr-2" /> Giả lập quét (Thử nghiệm)
              </Button>
              <Button
                variant="outline"
                onClick={() => void rotate()}
                className="py-5 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs px-4"
                title="Làm mới mã QR ngay"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Thông báo lỗi nếu có */}
            {error ? (
              <div className="w-full rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 text-center">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* CỘT PHẢI: BẢNG TIN KIOSK & LỊCH SỬ GẦN ĐÂY (5 Cột) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Banner chuyển sang nhận diện khuôn mặt */}
          <Link href="/check-in?mode=face" className="group block">
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 transition-all flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-xs">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-blue-900 group-hover:text-blue-700 transition-colors">
                    Điểm danh nhận diện khuôn mặt
                  </h3>
                  <p className="text-xs text-blue-600/80">Kích hoạt Webcam nhận diện sinh trắc học AES-256</p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-blue-600 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Banner kết quả phản hồi */}
          {lastResult ? (
            <div
              className={`rounded-2xl border p-4 transition-all text-xs ${
                lastResult.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastResult.ok ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-sm">{lastResult.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Bảng danh sách lượt chấm công gần nhất */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">Lượt chấm công gần nhất</span>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50 text-[10px]">
                Hôm nay
              </Badge>
            </div>

            <div className="space-y-2">
              {recentPunches.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Giờ ghi nhận: {item.time}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] font-semibold ${
                      item.punch === 'IN'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-amber-200 text-amber-700 bg-amber-50'
                    }`}
                  >
                    {item.punch === 'IN' ? 'GIỜ VÀO' : 'GIỜ RA'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Hướng dẫn 3 bước */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2 shadow-xs">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Quy trình chấm công:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500">
              <li>Mở ứng dụng Máy ảnh hoặc Zalo trên điện thoại.</li>
              <li>Hướng camera về phía mã QR đang hiển thị trên màn hình.</li>
              <li>Bấm vào thông báo liên kết để hoàn tất chấm công.</li>
            </ol>
          </div>
        </div>
      </main>

      {/* ================= FOOTER KIOSK ================= */}
      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Kiosk Trực tuyến · Kết nối CSDL Postgres an toàn</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-blue-600 transition-colors">Đăng nhập tài khoản</Link>
          <Link href="/check-in?mode=face" className="hover:text-blue-600 transition-colors">Nhận diện khuôn mặt</Link>
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Quản trị HRMIS</Link>
        </div>
      </footer>
    </div>
  );
}
