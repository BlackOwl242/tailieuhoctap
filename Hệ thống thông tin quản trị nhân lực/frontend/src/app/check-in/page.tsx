'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Fingerprint,
  Info,
  Loader2,
  LogIn,
  QrCode,
  RefreshCw,
  Scan,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Badge, Button } from '@/components/ui/primitives';

/**
 * Trang xử lý kết quả quét QR trên điện thoại (/check-in?token=...)
 * và Cổng điểm danh / Đăng ký sinh trắc học khuôn mặt (/check-in?mode=face).
 *
 * Vector khuôn mặt 256 chiều (16x16 grayscale mean-centered) được mã hóa
 * AES-256-GCM bảo vệ sinh trắc học theo NĐ 13/2023/NĐ-CP.
 */

function isUnauthorized(e: unknown): boolean {
  return isAxiosError(e) && e.response?.status === 401;
}

function CheckInInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const mode = params.get('mode');

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN'));
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

  // QR state
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [qrMessage, setQrMessage] = useState('Đang xử lý…');
  const [qrPunchInfo, setQrPunchInfo] = useState<{ punch: string; time: string } | null>(null);

  // General auth state
  const [needLogin, setNeedLogin] = useState(false);

  // ---------------------------------------------------------- QR flow
  useEffect(() => {
    if (!token) return;
    setQrStatus('loading');
    api.post('/attendance/check-in', { method: 'QR', qrToken: token })
      .then((res) => {
        setQrStatus('ok');
        const punch = res.data?.punch === 'IN' ? 'GIỜ VÀO' : 'GIỜ RA';
        const time = new Date().toLocaleTimeString('vi-VN');
        setQrPunchInfo({ punch, time });
        setQrMessage(`Chấm công thành công (${punch}) lúc ${time}`);
      })
      .catch((e) => {
        setQrStatus('error');
        if (isUnauthorized(e)) {
          setNeedLogin(true);
          setQrMessage('Bạn chưa đăng nhập trên thiết bị này. Hãy đăng nhập rồi quét lại mã.');
        } else {
          setQrMessage(errorMessage(e));
        }
      });
  }, [token]);

  // --------------------------------------------------------- FACE flow
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [activeTab, setActiveTab] = useState<'VERIFY' | 'ENROLL'>('VERIFY');
  const [camOn, setCamOn] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [samples, setSamples] = useState<number[][]>([]);

  const [faceSubmitting, setFaceSubmitting] = useState(false);
  const [faceResult, setFaceResult] = useState<{
    ok: boolean;
    message: string;
    punch?: string;
    time?: string;
  } | null>(null);

  // Load face status from API
  const refreshFaceStatus = async () => {
    try {
      const res = await api.get('/attendance/face/enrollments');
      const hasConsent = !!res.data?.consentAt;
      const count = res.data?.samples?.length ?? 0;
      setConsent(hasConsent);
      setEnrolledCount(count);
      if (count === 0) {
        setActiveTab('ENROLL');
      } else {
        setActiveTab('VERIFY');
      }
    } catch (e) {
      if (isUnauthorized(e)) {
        setNeedLogin(true);
      } else {
        setConsent(false);
      }
    }
  };

  useEffect(() => {
    if (mode === 'face') {
      void refreshFaceStatus();
    }
    return () => {
      // Dừng camera khi rời trang
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [mode]);

  // Start webcam
  async function startCamera() {
    setCamLoading(true);
    setFaceResult(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamOn(true);
      }
    } catch (e) {
      setFaceResult({
        ok: false,
        message: `Không thể mở camera: ${errorMessage(e)}. Thiết bị có thể sử dụng chế độ chụp mô phỏng.`,
      });
    } finally {
      setCamLoading(false);
    }
  }

  // Stop webcam
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCamOn(false);
  }

  /**
   * Trích vector mô tả 256 chiều từ khung hình trung tâm (16x16 grayscale mean-centered).
   */
  function captureDescriptor(): number[] {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    if (!ctx || !video || video.videoWidth === 0 || !camOn) {
      // Fallback mô phỏng cho thiết bị không có camera
      const seed = samples.length * 0.05;
      const vec: number[] = [];
      for (let i = 0; i < 256; i++) {
        vec.push(Math.sin((i + 1) * 0.12 + seed));
      }
      const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
      return vec.map((v) => v - mean);
    }

    // Cắt ô vuông trung tâm của khung hình
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, 16, 16);
    const imgData = ctx.getImageData(0, 0, 16, 16).data;
    const vec: number[] = [];
    for (let i = 0; i < imgData.length; i += 4) {
      const gray = (0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]) / 255;
      vec.push(gray);
    }
    const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
    return vec.map((v) => v - mean);
  }

  // Chụp mẫu đăng ký (cần 3 mẫu)
  async function handleCaptureSample() {
    setFaceResult(null);
    try {
      const descriptor = captureDescriptor();
      const updated = [...samples, descriptor];
      setSamples(updated);

      if (updated.length >= 3) {
        setFaceSubmitting(true);
        await api.post('/attendance/face/enroll', { descriptors: updated });
        setFaceResult({
          ok: true,
          message: 'Đăng ký khuôn mặt thành công! Dữ liệu mẫu đã được mã hóa an toàn AES-256-GCM. Bạn có thể tiến hành điểm danh ngay.',
        });
        setSamples([]);
        setEnrolledCount(3);
        setActiveTab('VERIFY');
      } else {
        setFaceResult({
          ok: true,
          message: `Đã lưu mẫu ${updated.length}/3. Giữ nguyên vị trí hoặc đổi góc nhẹ rồi chụp tiếp mẫu tiếp theo…`,
        });
      }
    } catch (e) {
      if (isUnauthorized(e)) {
        setNeedLogin(true);
      }
      setFaceResult({ ok: false, message: errorMessage(e) });
    } finally {
      setFaceSubmitting(false);
    }
  }

  // Điểm danh khuôn mặt
  async function handleVerifyFace() {
    setFaceSubmitting(true);
    setFaceResult(null);
    try {
      const descriptor = captureDescriptor();
      const res = await api.post('/attendance/check-in', { method: 'FACE', descriptor });
      const punch = res.data?.punch === 'IN' ? 'GIỜ VÀO (CHECK-IN)' : 'GIỜ RA (CHECK-OUT)';
      const time = new Date().toLocaleTimeString('vi-VN');
      setFaceResult({
        ok: true,
        punch,
        time,
        message: `Xác thực thành công ✓ (${punch}) lúc ${time}`,
      });
    } catch (e) {
      if (isUnauthorized(e)) {
        setNeedLogin(true);
      }
      setFaceResult({ ok: false, message: errorMessage(e) });
    } finally {
      setFaceSubmitting(false);
    }
  }

  // Chấp thuận điều khoản sinh trắc học
  async function handleGiveConsent() {
    setFaceSubmitting(true);
    setFaceResult(null);
    try {
      await api.post('/attendance/face/consent');
      setConsent(true);
      void refreshFaceStatus();
    } catch (e) {
      if (isUnauthorized(e)) {
        setNeedLogin(true);
      } else {
        setFaceResult({ ok: false, message: errorMessage(e) });
      }
    } finally {
      setFaceSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      {/* ---------------- 1. Trang QR Scan Handler ---------------- */}
      {token ? (
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 rounded-2xl border bg-card p-8 text-center shadow-xl">
          {qrStatus === 'loading' ? (
            <>
              <Loader2 className="h-14 w-14 animate-spin text-primary" />
              <h2 className="text-xl font-bold">Đang xác thực mã QR…</h2>
              <p className="text-sm text-muted-foreground">Vui lòng đợi giây lát</p>
            </>
          ) : qrStatus === 'ok' ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Điểm danh thành công!</h2>
                <p className="mt-1 text-sm text-muted-foreground">{qrMessage}</p>
              </div>
              {qrPunchInfo ? (
                <div className="w-full rounded-xl border bg-muted/40 p-4 text-left">
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">Loại điểm danh:</span>
                    <span className="font-bold text-primary">{qrPunchInfo.punch}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">Thời gian ghi nhận:</span>
                    <span className="font-semibold text-foreground">{qrPunchInfo.time}</span>
                  </div>
                </div>
              ) : null}
              <Link href="/dashboard" className="w-full">
                <Button className="w-full">Về Bảng điều khiển</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-destructive">Không thể điểm danh</h2>
                <p className="mt-1 text-sm text-muted-foreground">{qrMessage}</p>
              </div>
              {needLogin ? (
                <Link href={`/login?next=${encodeURIComponent(`/check-in?token=${token}`)}`} className="w-full">
                  <Button className="w-full"><LogIn className="h-4 w-4" /> Đăng nhập ngay</Button>
                </Link>
              ) : (
                <Link href="/kiosk" className="w-full">
                  <Button variant="outline" className="w-full"><QrCode className="h-4 w-4" /> Quét lại mã QR tại Kiosk</Button>
                </Link>
              )}
            </>
          )}
        </div>
      ) : null}

      {/* ---------------- 2. Trang Cổng Điểm Danh Tổng Hợp ---------------- */}
      {!token && mode !== 'face' ? (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 rounded-3xl border bg-card p-8 sm:p-10 text-center shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <QrCode className="h-9 w-9" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-primary">HRMIS Biometric & QR System</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Cổng Điểm Danh Chấm Công</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Hệ thống KMS Saigon Technology hỗ trợ nhận diện khuôn mặt sinh trắc học, quét QR Kiosk và chấm công nhanh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2">
            <Link href="/check-in?mode=face" className="w-full">
              <div className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all text-left group cursor-pointer h-full">
                <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">Điểm danh khuôn mặt</h3>
                  <p className="text-xs text-muted-foreground mt-1">Xác thực sinh trắc học chuẩn AES-256-GCM qua webcam</p>
                </div>
              </div>
            </Link>

            <Link href="/kiosk" className="w-full">
              <div className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left group cursor-pointer h-full">
                <div className="p-3 rounded-xl bg-muted text-foreground">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">Màn hình Kiosk quét QR</h3>
                  <p className="text-xs text-muted-foreground mt-1">Mã QR động 30s tại cửa ra vào để quét bằng điện thoại</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="w-full border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                api.post('/attendance/check-in', { method: 'WEB' })
                  .then((res) => {
                    const punch = res.data?.punch === 'IN' ? 'GIỜ VÀO' : 'GIỜ RA';
                    alert(`Chấm công Web thành công (${punch}) lúc ${new Date().toLocaleTimeString('vi-VN')}`);
                  })
                  .catch((e) => {
                    if (isUnauthorized(e)) {
                      window.location.href = `/login?next=${encodeURIComponent('/check-in')}`;
                    } else {
                      alert(errorMessage(e));
                    }
                  });
              }}
            >
              <LogIn className="h-4 w-4" /> Chấm công trực tiếp từ Web
            </Button>
            <Link href="/dashboard" className="flex items-center gap-1 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Về ứng dụng
            </Link>
          </div>
        </div>
      ) : null}

      {/* ---------------- 3. Luồng Khuôn Mặt (mode=face) — Giao Diện Thiết Kế Mới Rộng Rãi ---------------- */}
      {!token && mode === 'face' ? (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Điểm danh khuôn mặt</h1>
                  <Badge variant="outline" className="text-[11px] font-normal border-primary/30 text-primary">
                    Sinh trắc học
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mã hóa AES-256-GCM · Tuân thủ Nghị định 13/2023/NĐ-CP
                </p>
              </div>
            </div>

            {/* Live Clock & Back link */}
            <div className="flex items-center gap-4 self-end sm:self-auto">
              <div className="text-right hidden sm:block">
                <p className="text-lg font-bold font-mono text-foreground">{currentTime || '--:--:--'}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentDate}</p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" /> Về trang chủ
                </Button>
              </Link>
            </div>
          </div>

          {/* Main Content Area */}
          {needLogin ? (
            <div className="rounded-3xl border bg-card p-12 text-center shadow-lg flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LogIn className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Yêu cầu đăng nhập</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Bạn cần đăng nhập tài khoản nhân viên để kích hoạt điểm danh và quản lý mẫu khuôn mặt.
                </p>
              </div>
              <Link href={`/login?next=${encodeURIComponent('/check-in?mode=face')}`} className="w-full mt-2">
                <Button className="w-full py-6 text-base font-semibold"><LogIn className="h-5 w-5" /> Đăng nhập ngay</Button>
              </Link>
            </div>
          ) : consent === false ? (
            <div className="rounded-3xl border bg-card p-8 sm:p-10 shadow-lg max-w-2xl mx-auto text-left space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-lg font-bold">Đồng thuận xử lý dữ liệu sinh trắc học</h3>
                  <p className="text-xs text-muted-foreground">Bảo vệ quyền riêng tư theo tiêu chuẩn ISO/IEC 27001 & NĐ 13/2023</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  1. Hệ thống chỉ trích xuất vector đặc trưng toán học (256 chiều, chuẩn ITU-R) từ khung hình trung tâm và tiến hành mã hóa bằng chuẩn <strong className="text-foreground">AES-256-GCM</strong>.
                </p>
                <p>
                  2. <strong className="text-foreground">Tuyệt đối không lưu trữ hình ảnh gốc</strong> của nhân viên dưới bất kỳ hình thức nào.
                </p>
                <p>
                  3. Dữ liệu khuôn mặt mã hóa chỉ phục vụ mục đích duy nhất là chấm công và sẽ tự động được thu hồi / hủy vĩnh viễn khi hoàn tất thủ tục bàn giao nghỉ việc.
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleGiveConsent}
                disabled={faceSubmitting}
                className="w-full py-6 text-base font-bold gap-2"
              >
                {faceSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Tôi đồng ý và bắt đầu sử dụng
              </Button>
            </div>
          ) : (
            /* Layout 2 cột rộng rãi: Bên trái Camera Viewfinder, Bên phải Bảng điều khiển & Thao tác */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ===================== CỘT TRÁI: CAMERA VIEWPORT (7 Cột) ===================== */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-slate-700/50 bg-slate-950 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      camOn ? 'opacity-100 scale-x-[-1]' : 'opacity-0'
                    }`}
                  />

                  {/* Corner Target Reticles (Cyber/Biometric Frame) */}
                  <div className="pointer-events-none absolute inset-4 border border-white/10 rounded-2xl flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="h-6 w-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                      <div className="h-6 w-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-6 w-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                      <div className="h-6 w-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                    </div>
                  </div>

                  {/* Biometric Oval Guide + Scanning Animation */}
                  {camOn ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="relative h-60 w-44 sm:h-72 sm:w-52 rounded-[50%] border-2 border-dashed border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center">
                        {/* Scanning beam line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-bounce" />
                        <div className="absolute -bottom-8 rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm border border-emerald-500/30">
                          Căn chỉnh khuôn mặt vào giữa khung
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Status Indicator (Top-Left) */}
                  <div className="absolute top-4 left-4 z-10">
                    {camOn ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        Camera HD Sẵn sàng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/80 border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Camera chưa kích hoạt
                      </span>
                    )}
                  </div>

                  {/* Camera Off Overlay View */}
                  {!camOn ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white/90 bg-slate-950/90 backdrop-blur-sm">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/50 shadow-inner">
                        <Camera className="h-10 w-10 text-primary" />
                      </div>
                      <div className="max-w-xs">
                        <h3 className="text-lg font-bold">Kích hoạt Camera để quét</h3>
                        <p className="text-xs text-white/60 mt-1">
                          Cho phép trình duyệt sử dụng webcam để nhận diện khuôn mặt sinh trắc học.
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={startCamera}
                        disabled={camLoading}
                        className="gap-2 px-6 py-6 text-base font-bold shadow-lg shadow-primary/25"
                      >
                        {camLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                        Bật Camera ngay
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Camera Quick Toolbar */}
                {camOn ? (
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" /> Giữ khuôn mặt ở cự ly 40–60cm, đủ ánh sáng
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={startCamera} className="gap-1 text-xs h-8">
                        <RefreshCw className="h-3.5 w-3.5" /> Làm mới
                      </Button>
                      <Button size="sm" variant="ghost" onClick={stopCamera} className="gap-1 text-xs h-8 text-destructive hover:bg-destructive/10">
                        <CameraOff className="h-3.5 w-3.5" /> Tắt Camera
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ===================== CỘT PHẢI: BẢNG ĐIỀU KHIỂN & ĐIỂM DANH (5 Cột) ===================== */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Tab Selector */}
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1.5 text-xs font-bold shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('VERIFY');
                      setFaceResult(null);
                      setSamples([]);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 transition-all ${
                      activeTab === 'VERIFY'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" /> Điểm danh
                    {enrolledCount > 0 ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Đã có mẫu
                      </span>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ENROLL');
                      setFaceResult(null);
                      setSamples([]);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 transition-all ${
                      activeTab === 'ENROLL'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Camera className="h-4 w-4" /> {enrolledCount > 0 ? 'Chụp lại mẫu' : 'Đăng ký mẫu'}
                  </button>
                </div>

                {/* Kết quả phản hồi (Success / Error Alert Banner) */}
                {faceResult ? (
                  <div
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      faceResult.ok
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 shadow-sm'
                        : 'border-destructive/40 bg-destructive/10 text-destructive shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {faceResult.ok ? (
                        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-sm">{faceResult.message}</p>
                        {faceResult.punch ? (
                          <div className="mt-2 rounded-xl bg-card/60 p-2.5 text-xs text-foreground border">
                            <p className="font-semibold text-primary">{faceResult.punch}</p>
                            <p className="text-muted-foreground mt-0.5">Thời gian ghi nhận: {faceResult.time}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* TAB 1: ĐIỂM DANH KHUÔN MẶT */}
                {activeTab === 'VERIFY' ? (
                  <div className="rounded-3xl border bg-card p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Chế độ điểm danh tức thì</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-muted-foreground">{currentTime}</span>
                    </div>

                    {enrolledCount === 0 ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200">
                        <p className="font-bold mb-1">Chưa có dữ liệu khuôn mặt</p>
                        Bạn chưa đăng ký mẫu khuôn mặt trên hệ thống. Hãy bấm sang tab <strong>Đăng ký mẫu</strong> để thực hiện 3 bước chụp mẫu.
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nhìn thẳng vào camera và nhấn nút bên dưới để hệ thống đối sánh đặc trưng khuôn mặt với dữ liệu đã đăng ký.
                      </p>
                    )}

                    <Button
                      size="lg"
                      variant="success"
                      disabled={faceSubmitting || enrolledCount === 0}
                      onClick={handleVerifyFace}
                      className="w-full py-7 text-base font-extrabold gap-2.5 shadow-lg shadow-emerald-500/20"
                    >
                      {faceSubmitting ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <UserCheck className="h-6 w-6" />
                      )}
                      Điểm danh khuôn mặt ngay
                    </Button>

                    {!camOn ? (
                      <p className="text-center text-[11px] text-muted-foreground">
                        💡 Nếu thiết bị không có camera, bạn có thể bấm <strong>Điểm danh khuôn mặt ngay</strong> để sử dụng chế độ chụp mô phỏng.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* TAB 2: ĐĂNG KÝ MẪU (3 BƯỚC) */}
                {activeTab === 'ENROLL' ? (
                  <div className="rounded-3xl border bg-card p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-sm font-semibold">Tiến độ chụp mẫu nhận diện</span>
                      <span className="text-xs font-extrabold text-primary">{samples.length}/3 mẫu</span>
                    </div>

                    {/* 3 Step Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { step: 1, title: 'Mẫu 1', sub: 'Nhìn thẳng' },
                        { step: 2, title: 'Mẫu 2', sub: 'Nghiêng nhẹ' },
                        { step: 3, title: 'Mẫu 3', sub: 'Góc khác' },
                      ].map((item) => {
                        const done = samples.length >= item.step;
                        const isCurrent = samples.length + 1 === item.step;
                        return (
                          <div
                            key={item.step}
                            className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                              done
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : isCurrent
                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                : 'border-muted bg-muted/50 text-muted-foreground opacity-50'
                            }`}
                          >
                            <span className="text-xs font-bold">{done ? `${item.title} ✓` : item.title}</span>
                            <span className="text-[10px] mt-0.5">{item.sub}</span>
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      size="lg"
                      disabled={faceSubmitting}
                      onClick={handleCaptureSample}
                      className="w-full py-7 text-base font-bold gap-2.5 shadow-lg shadow-primary/20"
                    >
                      {faceSubmitting ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6" />
                      )}
                      {samples.length === 0
                        ? 'Chụp Mẫu 1 (Nhìn thẳng)'
                        : samples.length === 1
                        ? 'Chụp Mẫu 2 (Nghiêng nhẹ)'
                        : 'Chụp Mẫu 3 & Hoàn tất'}
                    </Button>

                    {samples.length > 0 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSamples([])}
                        className="text-xs text-muted-foreground hover:text-destructive self-center"
                      >
                        Hủy & Chụp lại từ đầu
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {/* Quick Navigation Footer Links */}
                <div className="rounded-2xl border bg-card p-4 flex items-center justify-between text-xs text-muted-foreground">
                  <Link href="/profile" className="text-primary hover:underline font-medium">
                    Quản lý mẫu trong Hồ sơ
                  </Link>
                  <Link href="/attendance" className="text-primary hover:underline font-medium">
                    Xem lịch sử chấm công
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center p-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      }
    >
      <CheckInInner />
    </Suspense>
  );
}
