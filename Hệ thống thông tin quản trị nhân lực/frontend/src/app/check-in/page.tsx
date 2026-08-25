'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { Camera, CameraOff, CheckCircle2, Loader2, LogIn, QrCode } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/primitives';

/**
 * Trang xử lý kết quả quét QR trên điện thoại (/check-in?token=...)
 * và luồng điểm danh khuôn mặt (/check-in?mode=face).
 *
 * Lưu ý trung thực về khuôn mặt: bản demo dùng "vector mô tả ảnh" rút gọn
 * (16×16 mức xám) thay vì model AI đầy đủ — đủ để trình diễn cơ chế
 * đăng ký/so khớp/mã hóa; model thật là hướng phát triển (doc/KMS_PLAN.md mục 10).
 */
/** Lỗi 401 → người dùng chưa đăng nhập trên máy quét mã (điện thoại cá nhân). */
function isUnauthorized(e: unknown): boolean {
  return isAxiosError(e) && e.response?.status === 401;
}

function CheckInInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const mode = params.get('mode');

  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('Đang xử lý…');
  const [needLogin, setNeedLogin] = useState(false);

  // ---------------------------------------------------------- QR flow
  useEffect(() => {
    if (!token) return;
    api.post('/attendance/check-in', { method: 'QR', qrToken: token })
      .then((res) => {
        setStatus('ok');
        setMessage(`Chấm công ${new Date().toLocaleTimeString('vi-VN')} ✓ (${res.data.punch === 'IN' ? 'GIỜ VÀO' : 'GIỜ RA'})`);
      })
      .catch((e) => {
        setStatus('error');
        // Mục 2 — lỗi thân thiện: máy quét mã chưa đăng nhập → mời đăng nhập rồi quay lại
        if (isUnauthorized(e)) {
          setNeedLogin(true);
          setMessage('Bạn chưa đăng nhập trên thiết bị này. Hãy đăng nhập rồi quét lại mã để ghi giờ công.');
        } else {
          setMessage(errorMessage(e));
        }
      });
  }, [token]);

  // --------------------------------------------------------- FACE flow
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camOn, setCamOn] = useState(false);
  const [samples, setSamples] = useState<number[][]>([]);
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    if (mode !== 'face') return;
    api.get('/attendance/face/enrollments')
      .then((r) => setConsent(!!r.data.consentAt))
      .catch((e) => {
        setConsent(false);
        // Chưa đăng nhập → hiển thị lời mời đăng nhập thay vì luồng đồng thuận
        if (isUnauthorized(e)) setNeedLogin(true);
      });
  }, [mode]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamOn(true);
      }
    } catch (e) {
      setStatus('error');
      setMessage(`Không mở được camera: ${errorMessage(e)}`);
    }
  }

  /** Trích vector mô tả 256 chiều từ khung hình (grayscale 16×16 block mean). */
  function captureDescriptor(): number[] {
    const video = videoRef.current!;
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, 16, 16);
    const data = ctx.getImageData(0, 0, 16, 16).data;
    const vec: number[] = [];
    for (let i = 0; i < data.length; i += 4) vec.push(data[i] / 255); // kênh đỏ ~ độ sáng
    const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
    return vec.map((v) => v - mean); // trừ trung bình để bớt phụ thuộc ánh sáng
  }

  async function enroll() {
    try {
      const all = [...samples, captureDescriptor()];
      setSamples(all);
      if (all.length >= 3) {
        await api.post('/attendance/face/enroll', { descriptors: all });
        setStatus('ok');
        setMessage('Đăng ký khuôn mặt thành công ✓ Hãy dùng "Điểm danh" ở dưới.');
      } else {
        setMessage(`Đã chụp ${all.length}/3 mẫu — tiếp tục nhìn thẳng camera…`);
      }
    } catch (e) {
      setStatus('error');
      if (isUnauthorized(e)) setNeedLogin(true);
      setMessage(errorMessage(e));
    }
  }

  async function verifyFace() {
    try {
      const descriptor = captureDescriptor();
      const res = await api.post('/attendance/check-in', { method: 'FACE', descriptor });
      setStatus('ok');
      setMessage(`Chấm công ${new Date().toLocaleTimeString('vi-VN')} ✓ (${res.data.punch === 'IN' ? 'VÀO' : 'RA'})`);
    } catch (e) {
      setStatus('error');
      if (isUnauthorized(e)) setNeedLogin(true);
      setMessage(errorMessage(e));
    }
  }

  async function giveConsent() {
    try {
      await api.post('/attendance/face/consent');
      setConsent(true);
    } catch (e) {
      if (isUnauthorized(e)) setNeedLogin(true);
      else setMessage(errorMessage(e));
    }
  }

  // ------------------------------------------------------------- render
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {/* Vào /check-in trực tiếp (không có mã QR, không chọn khuôn mặt)
          → hướng dẫn các kênh điểm danh thay vì trang chết (Mục 5) */}
      {status === 'idle' && !token && mode !== 'face' ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <QrCode className="h-10 w-10 text-primary" />
          <h1 className="text-lg font-bold">Điểm danh đa kênh</h1>
          <p className="text-sm text-muted-foreground">
            Trang này xử lý mã quét từ Kiosk. Hãy chọn một kênh điểm danh:
          </p>
          <div className="flex w-full flex-col gap-2">
            <Link href="/kiosk" className="w-full"><Button variant="outline" className="w-full"><QrCode className="h-4 w-4" /> Mở Kiosk quét mã QR</Button></Link>
            <Link href="/check-in?mode=face" className="w-full"><Button variant="outline" className="w-full"><Camera className="h-4 w-4" /> Điểm danh khuôn mặt</Button></Link>
            <Button
              className="w-full"
              onClick={() => {
                api.post('/attendance/check-in', { method: 'WEB' })
                  .then((res) => {
                    setStatus('ok');
                    setMessage(`Chấm công ${new Date().toLocaleTimeString('vi-VN')} ✓ (${res.data.punch === 'IN' ? 'GIỜ VÀO' : 'GIỜ RA'})`);
                  })
                  .catch((e) => {
                    setStatus('error');
                    if (isUnauthorized(e)) setNeedLogin(true);
                    setMessage(errorMessage(e));
                  });
              }}
            >
              <LogIn className="h-4 w-4" /> Chấm công bằng web ngay
            </Button>
          </div>
          {needLogin ? (
            <Link href="/login" className="text-sm text-primary underline underline-offset-2">Đăng nhập để ghi giờ công →</Link>
          ) : null}
        </div>
      ) : null}

      {token || status !== 'idle' ? (
        <>
          {status === 'ok' ? <CheckCircle2 className="h-16 w-16 text-success" /> : status === 'error' ? null : <Loader2 className="h-12 w-12 animate-spin text-primary" />}
          <p className={`text-lg font-medium ${status === 'error' ? 'text-destructive' : ''}`} role="status">{message}</p>
          {needLogin ? (
            <Link
              href={`/login?next=${encodeURIComponent(`/check-in?token=${token ?? ''}`)}`}
              className="inline-flex"
            >
              <Button><LogIn className="h-4 w-4" /> Đăng nhập để ghi giờ công</Button>
            </Link>
          ) : null}
          <Link href="/dashboard" className="text-sm text-primary underline underline-offset-2">← Về ứng dụng</Link>
        </>
      ) : null}

      {/* ---------------- Luồng khuôn mặt ---------------- */}
      {!token && mode === 'face' ? (
        <>
          <Camera className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-bold">Điểm danh khuôn mặt</h1>

          {/* Chưa đăng nhập → mời đăng nhập rồi quay lại đúng màn này */}
          {needLogin ? (
            <>
              <p className="max-w-sm text-sm text-muted-foreground">
                Bạn cần đăng nhập để đăng ký và điểm danh khuôn mặt.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent('/check-in?mode=face')}`}
                className="inline-flex"
              >
                <Button><LogIn className="h-4 w-4" /> Đăng nhập</Button>
              </Link>
            </>
          ) : consent === false ? (
            <>
              <p className="max-w-sm text-sm text-muted-foreground">
                Để dùng tính năng này, bạn cần đồng ý cho hệ thống thu thập vector đặc trưng khuôn mặt
                (dữ liệu được mã hóa AES-256-GCM, không lưu ảnh gốc — tuân thủ NĐ 13/2023/NĐ-CP).
              </p>
              <Button onClick={giveConsent}>Tôi đồng ý</Button>
            </>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-xl border bg-black" style={{ width: 240, height: 180 }}>
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                {!camOn ? (
                  <button onClick={startCamera} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                    <CameraOff className="h-8 w-8" /> Bật camera
                  </button>
                ) : null}
              </div>

              {samples.length > 0 && samples.length < 3 ? (
                <p className="text-sm">Đã chụp {samples.length}/3 mẫu đăng ký…</p>
              ) : null}

              <div className="flex flex-wrap justify-center gap-2">
                {consent && camOn && samples.length < 3 ? (
                  <Button onClick={enroll}>Chụp mẫu ({samples.length}/3)</Button>
                ) : null}
                {consent && camOn && samples.length >= 3 ? (
                  <Button variant="success" onClick={verifyFace}>Điểm danh ngay</Button>
                ) : null}
                <Link href="/profile" className="self-center text-sm text-primary underline underline-offset-2">Quản lý mẫu đã đăng ký</Link>
              </div>
            </>
          )}

          <Link href="/dashboard" className="text-sm text-muted-foreground underline underline-offset-2">← Về ứng dụng</Link>
        </>
      ) : null}
    </main>
  );
}

export default function CheckInPage() {
  // useSearchParams cần Suspense boundary trong Next.js App Router
  return (
    <Suspense fallback={<main className="p-10 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></main>}>
      <CheckInInner />
    </Suspense>
  );
}
