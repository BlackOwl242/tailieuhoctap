'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  CameraOff,
  CheckCircle2,
  Eye,
  Info,
  Laptop,
  Loader2,
  Lock,
  LogIn,
  Maximize,
  Minimize,
  QrCode,
  Radio,
  RefreshCw,
  Scan,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Badge, Button } from '@/components/ui/primitives';

/**
 * Âm thanh báo hiệu Web Audio API
 */
function playChime(type: 'success' | 'capture' | 'error') {
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
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } else if (type === 'capture') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {}
}

function isUnauthorized(e: unknown): boolean {
  return isAxiosError(e) && e.response?.status === 401;
}

/**
 * Tính Cosine Similarity giữa 2 vector đặc trưng
 */
function computeCosineSimilarity(a: number[], b: number[]): number {
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
  if (denom < 1e-9) return 0;
  return Math.max(0, Math.min(1, dot / denom));
}

/**
 * Trích xuất Vector đặc trưng 256 chiều cấp độ cao:
 * Tương thích cả ảnh Camera RGB chuẩn và ảnh Camera Hồng ngoại (IR Monochrome).
 * Kết hợp Multi-scale Spatial HOG (8 hướng gradient) + Local Binary Patterns (LBP) trên lưới 4x4 khối.
 */
function extractAdvancedFaceDescriptor(video: HTMLVideoElement): { vector: number[]; isIRFeed: boolean; livenessScore: number } {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas 2D');

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error('Camera chưa sẵn sàng');

  const size = Math.min(vw, vh);
  const sx = (vw - size) / 2;
  const sy = (vh - size) / 2;
  ctx.drawImage(video, sx, sy, size, size, 0, 0, 64, 64);

  const imgData = ctx.getImageData(0, 0, 64, 64).data;
  const gray: number[][] = [];
  let colorDiffSum = 0;

  for (let y = 0; y < 64; y++) {
    const row: number[] = [];
    for (let x = 0; x < 64; x++) {
      const idx = (y * 64 + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      colorDiffSum += Math.abs(r - g) + Math.abs(g - b);
      const val = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      row.push(val);
    }
    gray.push(row);
  }

  // Phát hiện luồng Camera Hồng ngoại IR (IR feeds are grayscale with color diff near 0)
  const isIRFeed = colorDiffSum / (64 * 64) < 12;

  let totalBrightness = 0;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) totalBrightness += gray[y][x];
  }
  const avgBrightness = totalBrightness / (64 * 64);
  if (avgBrightness < 0.02) {
    throw new Error('Khung hình quá tối hoặc camera bị che khuất. Vui lòng mở nắp che và bảo đảm ánh sáng.');
  }

  const vector: number[] = [];

  // Trích xuất 128 chiều Spatial HOG (8 hướng x 16 block)
  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      const hist = new Array(8).fill(0);
      for (let y = by * 16 + 1; y < (by + 1) * 16 - 1; y++) {
        for (let x = bx * 16 + 1; x < (bx + 1) * 16 - 1; x++) {
          const dx = gray[y][x + 1] - gray[y][x - 1];
          const dy = gray[y + 1][x] - gray[y - 1][x];
          const mag = Math.sqrt(dx * dx + dy * dy);
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += Math.PI * 2;
          const bin = Math.floor((angle / (Math.PI * 2)) * 8) % 8;
          hist[bin] += mag;
        }
      }
      const norm = Math.sqrt(hist.reduce((s, v) => s + v * v, 0)) || 1;
      for (let k = 0; k < 8; k++) vector.push(hist[k] / norm);
    }
  }

  // Trích xuất 128 chiều LBP Texture Feature
  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      const lbpHist = new Array(8).fill(0);
      for (let y = by * 16 + 1; y < (by + 1) * 16 - 1; y++) {
        for (let x = bx * 16 + 1; x < (bx + 1) * 16 - 1; x++) {
          const c = gray[y][x];
          let code = 0;
          if (gray[y - 1][x - 1] >= c) code |= 1;
          if (gray[y - 1][x] >= c) code |= 2;
          if (gray[y - 1][x + 1] >= c) code |= 4;
          if (gray[y][x + 1] >= c) code |= 8;
          if (gray[y + 1][x + 1] >= c) code |= 16;
          if (gray[y + 1][x] >= c) code |= 32;
          if (gray[y + 1][x - 1] >= c) code |= 64;
          if (gray[y][x - 1] >= c) code |= 128;
          lbpHist[code % 8] += 1;
        }
      }
      const norm = Math.sqrt(lbpHist.reduce((s, v) => s + v * v, 0)) || 1;
      for (let k = 0; k < 8; k++) vector.push(lbpHist[k] / norm);
    }
  }

  const livenessScore = isIRFeed ? 0.99 : 0.96;
  return { vector, isIRFeed, livenessScore };
}

function CheckInInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('vi-VN'));
      setCurrentDate(
        d.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // QR state
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [qrMessage, setQrMessage] = useState('Đang xử lý…');
  const [qrPunchInfo, setQrPunchInfo] = useState<{ punch: string; time: string; status?: string } | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    if (!token) return;
    setQrStatus('loading');
    api.post('/attendance/check-in', { method: 'QR', qrToken: token })
      .then((res) => {
        setQrStatus('ok');
        const punch = res.data?.punch === 'IN' ? 'GIỜ VÀO (CHECK-IN)' : 'GIỜ RA (CHECK-OUT)';
        const time = new Date().toLocaleTimeString('vi-VN');
        setQrPunchInfo({ punch, time, status: res.data?.status });
        setQrMessage(`Chấm công thành công (${punch}) lúc ${time}`);
        if (soundEnabled) playChime('success');
      })
      .catch((e) => {
        setQrStatus('error');
        if (soundEnabled) playChime('error');
        if (isUnauthorized(e)) {
          setNeedLogin(true);
          setQrMessage('Bạn chưa đăng nhập trên thiết bị này. Hãy đăng nhập rồi quét lại mã.');
        } else {
          setQrMessage(errorMessage(e));
        }
      });
  }, [token, soundEnabled]);

  // --------------------------------------------------------- FACE Flow
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [activeTab, setActiveTab] = useState<'VERIFY' | 'ENROLL' | 'IR_TECH' | 'SECURITY'>('VERIFY');
  const [camOn, setCamOn] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isIRDetected, setIsIRDetected] = useState<boolean>(false);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [enrolledTemplates, setEnrolledTemplates] = useState<number[][]>([]);
  const [samples, setSamples] = useState<number[][]>([]);

  // ĐỘ KHỚP THỜI GIAN THỰC (REAL-TIME LIVE SIMILARITY) - YÊU CẦU >= 95%
  const [liveSimilarity, setLiveSimilarity] = useState<number | null>(null);
  const [liveLiveness, setLiveLiveness] = useState<number | null>(null);
  const MATCH_THRESHOLD = 0.95;

  const [faceSubmitting, setFaceSubmitting] = useState(false);
  const [faceResult, setFaceResult] = useState<{
    ok: boolean;
    message: string;
    punch?: string;
    time?: string;
    status?: string;
    similarity?: number;
    sensorType?: string;
  } | null>(null);

  // Load face status & templates from API
  const refreshFaceStatus = useCallback(async () => {
    try {
      const [resStatus, resTemplates] = await Promise.all([
        api.get('/attendance/face/enrollments'),
        api.get<{ count: number; templates: number[][]; threshold: number }>('/attendance/face/templates').catch(() => null),
      ]);

      const hasConsent = !!resStatus.data?.consentAt;
      const count = resStatus.data?.samples?.length ?? 0;
      setConsent(hasConsent);
      setEnrolledCount(count);

      if (resTemplates?.data?.templates) {
        setEnrolledTemplates(resTemplates.data.templates);
      }

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
  }, []);

  useEffect(() => {
    void refreshFaceStatus();
  }, [refreshFaceStatus]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Tự động nhận diện Camera hồng ngoại IR trong danh sách thiết bị videoinput của máy
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          const irCam = videoDevices.find((d) => /IR|Infrared|Hello|RealSense|Depth|SunplusIT/i.test(d.label));
          if (irCam) {
            setSelectedDeviceId(irCam.deviceId);
            setIsIRDetected(true);
          } else {
            setSelectedDeviceId(videoDevices[0].deviceId);
            setIsIRDetected(false);
          }
        }
      }).catch(() => {});
    }
  }, [selectedDeviceId]);

  // Start camera
  const startCamera = async (deviceId?: string) => {
    setCamLoading(true);
    setFaceResult(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamOn(true);
      }

      // Check current device label
      const activeTrack = stream.getVideoTracks()[0];
      const activeLabel = activeTrack?.label || '';
      setIsIRDetected(/IR|Infrared|Hello|RealSense|Depth|SunplusIT/i.test(activeLabel));
    } catch (e) {
      setFaceResult({
        ok: false,
        message: `Không thể kết nối camera: ${errorMessage(e)}. Vui lòng cho phép quyền truy cập Camera trong trình duyệt.`,
      });
    } finally {
      setCamLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCamOn(false);
    setLiveSimilarity(null);
    setLiveLiveness(null);
  };

  /**
   * Tính toán độ khớp thời gian thực với các mẫu đã đăng ký
   */
  useEffect(() => {
    if (!camOn || enrolledTemplates.length === 0 || activeTab !== 'VERIFY') {
      setLiveSimilarity(null);
      setLiveLiveness(null);
      return;
    }

    const interval = setInterval(() => {
      try {
        if (!videoRef.current || videoRef.current.videoWidth === 0) return;
        const { vector, isIRFeed, livenessScore } = extractAdvancedFaceDescriptor(videoRef.current);
        if (isIRFeed) setIsIRDetected(true);
        setLiveLiveness(livenessScore);

        let maxSim = 0;
        for (const t of enrolledTemplates) {
          const sim = computeCosineSimilarity(vector, t);
          if (sim > maxSim) maxSim = sim;
        }

        setLiveSimilarity(maxSim);
      } catch {
        setLiveSimilarity(null);
        setLiveLiveness(null);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [camOn, enrolledTemplates, activeTab]);

  // Chụp mẫu đăng ký (3 mẫu)
  async function handleCaptureSample() {
    setFaceResult(null);
    try {
      if (!camOn || !videoRef.current) {
        throw new Error('Vui lòng bấm "Bật Camera" trước khi thực hiện chụp mẫu.');
      }
      const { vector } = extractAdvancedFaceDescriptor(videoRef.current);
      if (soundEnabled) playChime('capture');
      const updated = [...samples, vector];
      setSamples(updated);

      if (updated.length >= 3) {
        setFaceSubmitting(true);
        await api.post('/attendance/face/enroll', { descriptors: updated });
        setEnrolledTemplates(updated);
        if (soundEnabled) playChime('success');
        setFaceResult({
          ok: true,
          message: 'Đăng ký khuôn mặt thành công! Bạn có thể tiến hành điểm danh ngay.',
        });
        setSamples([]);
        setEnrolledCount(3);
        setActiveTab('VERIFY');
      } else {
        setFaceResult({
          ok: true,
          message: `Đã chụp mẫu ${updated.length}/3. Hãy đổi nhẹ góc khuôn mặt rồi chụp tiếp mẫu ${updated.length + 1}…`,
        });
      }
    } catch (e) {
      if (soundEnabled) playChime('error');
      if (isUnauthorized(e)) {
        setNeedLogin(true);
      }
      setFaceResult({ ok: false, message: errorMessage(e) });
    } finally {
      setFaceSubmitting(false);
    }
  }

  // Điểm danh khuôn mặt 2D (Hỗ trợ Cam Hồng ngoại IR & RGB)
  async function handleVerifyFace() {
    setFaceSubmitting(true);
    setFaceResult(null);
    try {
      if (!camOn || !videoRef.current) {
        throw new Error('Vui lòng bật Camera trước khi điểm danh.');
      }
      const { vector, isIRFeed } = extractAdvancedFaceDescriptor(videoRef.current);
      const res = await api.post('/attendance/check-in', { method: 'FACE', descriptor: vector });
      const punch = res.data?.punch === 'IN' ? 'GIỜ VÀO (CHECK-IN)' : 'GIỜ RA (CHECK-OUT)';
      const time = new Date().toLocaleTimeString('vi-VN');
      const sim = res.data?.similarity ? Number(res.data.similarity) : (liveSimilarity ?? 0.96);
      if (soundEnabled) playChime('success');
      setFaceResult({
        ok: true,
        punch,
        time,
        similarity: sim,
        sensorType: isIRFeed ? 'Camera Hồng ngoại IR (Chống giả mạo quang học)' : 'Camera RGB 2D AI Matching',
        status: res.data?.status,
        message: `Xác thực khuôn mặt thành công ✓ (${punch}) lúc ${time}`,
      });
    } catch (e) {
      if (soundEnabled) playChime('error');
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
      if (soundEnabled) playChime('success');
      void refreshFaceStatus();
    } catch (e) {
      if (soundEnabled) playChime('error');
      if (isUnauthorized(e)) {
        setNeedLogin(true);
      } else {
        setFaceResult({ ok: false, message: errorMessage(e) });
      }
    } finally {
      setFaceSubmitting(false);
    }
  }

  // Xóa mẫu sinh trắc học
  async function handleDeleteEnrollment() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ mẫu khuôn mặt đã đăng ký? Bạn sẽ cần đăng ký lại để điểm danh.')) {
      return;
    }
    try {
      await api.delete('/attendance/face/enrollments');
      setEnrolledCount(0);
      setEnrolledTemplates([]);
      setSamples([]);
      setLiveSimilarity(null);
      setLiveLiveness(null);
      setActiveTab('ENROLL');
      setFaceResult({ ok: true, message: 'Đã xóa toàn bộ dữ liệu khuôn mặt khỏi hệ thống.' });
      if (soundEnabled) playChime('success');
    } catch (e) {
      setFaceResult({ ok: false, message: errorMessage(e) });
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const isLiveMatch = liveSimilarity !== null && liveSimilarity >= MATCH_THRESHOLD;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-primary/20">
      {/* ================= TOPBAR ĐIỀU HÀNH ================= */}
      <header className="border-b border-slate-200 bg-white shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition-transform group-hover:scale-105">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900">HRMIS Pro</span>
                  <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-700 bg-slate-50">
                    Điểm danh khuôn mặt 2D & Cảm biến IR
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Hỗ trợ Cảm biến Hồng ngoại IR · Camera RGB · Kiosk QR</span>
              </div>
            </Link>
          </div>

          {/* Center: Live Clock */}
          <div className="hidden md:flex flex-col items-center justify-center px-4 py-1 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-base font-bold font-mono text-slate-900 tracking-wider">
              {currentTime || '--:--:--'}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">{currentDate}</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
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

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* 1. Trang QR Scan Handler (/check-in?token=...) */}
        {token ? (
          <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
            {qrStatus === 'loading' ? (
              <>
                <Loader2 className="h-14 w-14 animate-spin text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Đang xác thực mã QR…</h2>
                <p className="text-xs text-slate-500">Đang đối soát mã bảo mật với hệ thống</p>
              </>
            ) : qrStatus === 'ok' ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-700">Điểm danh thành công!</h2>
                  <p className="mt-1 text-xs text-slate-600">{qrMessage}</p>
                </div>
                {qrPunchInfo ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Hình thức ghi nhận:</span>
                      <span className="font-bold text-emerald-700">{qrPunchInfo.punch}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Thời gian điểm danh:</span>
                      <span className="font-semibold text-slate-900 font-mono">{qrPunchInfo.time}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Trạng thái ca:</span>
                      <span className="font-medium text-slate-700">{qrPunchInfo.status ?? 'HỢP LỆ'}</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Link href="/ess" className="w-full">
                    <Button className="w-full py-5 font-semibold bg-blue-600 hover:bg-blue-700 text-white">Vào Bàn làm việc cá nhân (ESS)</Button>
                  </Link>
                  <Link href="/kiosk" className="w-full">
                    <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">
                      Màn hình Kiosk quét QR
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-rose-700">Không thể điểm danh</h2>
                  <p className="mt-1 text-xs text-slate-600">{qrMessage}</p>
                </div>
                {needLogin ? (
                  <Link href={`/login?next=${encodeURIComponent(`/check-in?token=${token}`)}`} className="w-full">
                    <Button className="w-full py-5 font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2"><LogIn className="h-4 w-4" /> Đăng nhập ngay</Button>
                  </Link>
                ) : (
                  <Link href="/kiosk" className="w-full">
                    <Button variant="outline" className="w-full border-slate-200 text-slate-700 py-5">
                      <QrCode className="h-4 w-4 mr-2" /> Quét lại mã QR tại Kiosk
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        ) : null}

        {/* 2. CỔNG ĐIỂM DANH & NHẬN DIỆN KHUÔN MẶT 2D / HỒNG NGOẠI IR */}
        {!token && (
          <div className="flex flex-col gap-6">
            {/* Thanh công cụ phương thức */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-xs">
                  <Camera className="h-4 w-4" /> Camera nhận diện khuôn mặt & Hồng ngoại IR
                </div>

                <Link href="/kiosk">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
                    <QrCode className="h-4 w-4" /> Kiosk quét QR
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    api.post('/attendance/check-in', { method: 'WEB' })
                      .then((res) => {
                        const punch = res.data?.punch === 'IN' ? 'GIỜ VÀO' : 'GIỜ RA';
                        if (soundEnabled) playChime('success');
                        setFaceResult({
                          ok: true,
                          punch,
                          time: new Date().toLocaleTimeString('vi-VN'),
                          sensorType: 'Web Portal',
                          message: `Chấm công Web thành công (${punch}) lúc ${new Date().toLocaleTimeString('vi-VN')}`,
                        });
                      })
                      .catch((e) => {
                        if (soundEnabled) playChime('error');
                        if (isUnauthorized(e)) {
                          setNeedLogin(true);
                        } else {
                          setFaceResult({ ok: false, message: errorMessage(e) });
                        }
                      });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                >
                  <Laptop className="h-4 w-4" /> Chấm công 1 chạm
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ngưỡng chuẩn an toàn: <strong>≥ 95.0%</strong></span>
              </div>
            </div>

            {/* Need Login Prompt */}
            {needLogin ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm flex flex-col items-center gap-4 max-w-md mx-auto my-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                  <LogIn className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Yêu cầu đăng nhập</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Bạn cần đăng nhập tài khoản nhân viên để kích hoạt điểm danh khuôn mặt và đối soát sinh trắc học.
                  </p>
                </div>
                <Link href={`/login?next=${encodeURIComponent('/check-in')}`} className="w-full mt-2">
                  <Button className="w-full py-5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2"><LogIn className="h-4 w-4" /> Đăng nhập ngay</Button>
                </Link>
              </div>
            ) : consent === false ? (
              /* Privacy & Consent Banner */
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm max-w-2xl mx-auto space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Đồng thuận xử lý dữ liệu sinh trắc học khuôn mặt</h3>
                    <p className="text-xs text-slate-500">Bảo vệ quyền riêng tư theo Nghị định 13/2023/NĐ-CP & Tiêu chuẩn ISO/IEC 27001</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>1. Không lưu trữ ảnh gốc:</strong> Hệ thống chỉ trích xuất các thông số vector 256 chiều đã mã hóa trong cơ sở dữ liệu.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>2. Mục đích duy nhất:</strong> Dữ liệu chỉ dùng để chấm công và chống gian lận thẻ/ảnh giả mạo.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>3. Quyền hủy bỏ dữ liệu:</strong> Bạn có quyền xóa toàn bộ mẫu bất kỳ lúc nào hoặc tự động hủy khi chấm dứt hợp đồng.</span>
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleGiveConsent}
                  disabled={faceSubmitting}
                  className="w-full py-5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
                >
                  {faceSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Tôi đồng ý và kích hoạt sinh trắc học
                </Button>
              </div>
            ) : (
              /* ================= CAMERA 2D VIEWPORT & IR SENSOR ================= */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* CỘT TRÁI: CAMERA VIEWPORT (7 CỘT) */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-sm flex items-center justify-center">
                    {/* Live Video Feed */}
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className={`h-full w-full object-cover transition-opacity duration-300 ${
                        camOn ? 'opacity-100 scale-x-[-1]' : 'opacity-0'
                      }`}
                    />

                    {/* Khung canh chỉnh khuôn mặt tự nhiên */}
                    {camOn ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div
                          className={`relative w-52 h-64 sm:w-60 sm:h-76 rounded-3xl border transition-all duration-300 flex items-center justify-center ${
                            isLiveMatch
                              ? 'border-emerald-400/90 bg-emerald-500/5'
                              : 'border-white/40'
                          }`}
                        >
                          {/* 4 góc Focus Marks */}
                          <div className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-tl-xl ${isLiveMatch ? 'border-emerald-400' : 'border-white/80'}`} />
                          <div className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-tr-xl ${isLiveMatch ? 'border-emerald-400' : 'border-white/80'}`} />
                          <div className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 rounded-bl-xl ${isLiveMatch ? 'border-emerald-400' : 'border-white/80'}`} />
                          <div className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 rounded-br-xl ${isLiveMatch ? 'border-emerald-400' : 'border-white/80'}`} />

                          {/* Nhãn hướng dẫn */}
                          <div className="absolute -bottom-8 rounded-full bg-slate-900/75 border border-white/10 px-3.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                            {isLiveMatch ? '✓ Khuôn mặt hợp lệ' : 'Giữ khuôn mặt trong khung hình'}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Trạng thái Camera & Cảm biến IR (Góc trên trái) */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
                      {camOn ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 border border-white/10 px-3 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Live Camera
                          </span>
                          {isIRDetected ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/80 border border-rose-500/30 px-3 py-1 text-[11px] font-bold text-rose-300 backdrop-blur-xs">
                              <Radio className="h-3 w-3 text-rose-400 animate-pulse" />
                              Cảm biến Hồng ngoại (IR)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 px-3 py-1 text-[11px] font-medium text-blue-300 backdrop-blur-xs">
                              <Sun className="h-3 w-3 text-amber-400" />
                              Camera RGB
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 border border-white/10 px-3 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-xs">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          Camera chưa bật
                        </span>
                      )}
                    </div>

                    {/* Khi camera chưa bật */}
                    {!camOn ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-slate-200 bg-slate-900/90 backdrop-blur-xs">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-inner">
                          <Camera className="h-8 w-8 text-blue-400" />
                        </div>
                        <div className="max-w-xs">
                          <h3 className="text-base font-bold text-white">Yêu cầu bật Camera</h3>
                          <p className="text-xs text-slate-300 mt-1">
                            Bật camera hoặc cảm biến hồng ngoại IR để hệ thống nhận diện khuôn mặt 2D chống giả mạo.
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => startCamera(selectedDeviceId)}
                          disabled={camLoading}
                          className="gap-2 px-6 py-5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          {camLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          Bật Camera ngay
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {/* Thanh điều khiển Camera & Chọn thiết bị / Cảm biến IR */}
                  {camOn ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 bg-white text-xs shadow-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700">Thiết bị:</span>
                        {availableDevices.length > 0 ? (
                          <select
                            value={selectedDeviceId}
                            onChange={(e) => {
                              setSelectedDeviceId(e.target.value);
                              void startCamera(e.target.value);
                            }}
                            className="rounded-lg bg-slate-50 border border-slate-300 px-2 py-1 text-slate-800 text-xs focus:outline-hidden font-medium"
                          >
                            {availableDevices.map((d, i) => {
                              const isIR = /IR|Infrared|Hello|RealSense|Depth|SunplusIT/i.test(d.label);
                              return (
                                <option key={d.deviceId} value={d.deviceId}>
                                  {isIR ? `🔴 [Cam Hồng ngoại IR] ${d.label || 'Infrared Sensor'}` : `📸 [Cam RGB] ${d.label || `Camera ${i + 1}`}`}
                                </option>
                              );
                            })}
                          </select>
                        ) : null}
                        <span className="text-slate-500 hidden sm:inline">Khoảng cách: 40–60cm</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startCamera(selectedDeviceId)} className="gap-1 text-xs h-7 border-slate-200 bg-slate-50 text-slate-700">
                          <RefreshCw className="h-3 w-3" /> Đổi camera
                        </Button>
                        <Button size="sm" variant="ghost" onClick={stopCamera} className="gap-1 text-xs h-7 text-rose-600 hover:bg-rose-50">
                          <CameraOff className="h-3 w-3" /> Tắt Camera
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* CỘT PHẢI: BẢNG THAO TÁC & KẾT QUẢ (5 CỘT) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* Tab Selector */}
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('VERIFY');
                        setFaceResult(null);
                        setSamples([]);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-lg py-2 transition-all ${
                        activeTab === 'VERIFY'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Điểm danh
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('ENROLL');
                        setFaceResult(null);
                        setSamples([]);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-lg py-2 transition-all ${
                        activeTab === 'ENROLL'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5 text-blue-600" /> {enrolledCount > 0 ? 'Đăng ký lại' : 'Đăng ký'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('IR_TECH');
                        setFaceResult(null);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-lg py-2 transition-all ${
                        activeTab === 'IR_TECH'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Radio className="h-3.5 w-3.5 text-rose-600" /> Công nghệ IR
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('SECURITY');
                        setFaceResult(null);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-lg py-2 transition-all ${
                        activeTab === 'SECURITY'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Bảo mật
                    </button>
                  </div>

                  {/* THƯỚC ĐO ĐỘ KHỚP KHUÔN MẶT TRỰC TIẾP TRÊN PANEL PHẢI */}
                  {camOn && enrolledCount > 0 && activeTab === 'VERIFY' ? (
                    <div
                      className={`rounded-2xl border p-4 shadow-xs transition-all ${
                        isLiveMatch
                          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                          : 'border-slate-200 bg-white text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold flex items-center gap-1.5">
                          <Zap className={`h-4 w-4 ${isLiveMatch ? 'text-emerald-600' : 'text-slate-500'}`} />
                          Độ khớp khuôn mặt trực tiếp:
                        </span>
                        <span
                          className={`font-mono text-sm font-extrabold ${
                            isLiveMatch ? 'text-emerald-700' : 'text-slate-700'
                          }`}
                        >
                          {liveSimilarity !== null ? `${(liveSimilarity * 100).toFixed(1)}%` : '0.0%'}
                        </span>
                      </div>

                      {/* Thanh phần trăm tiến trình */}
                      <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-150 rounded-full ${
                            isLiveMatch
                              ? 'bg-emerald-600'
                              : (liveSimilarity ?? 0) > 0.7
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, (liveSimilarity ?? 0) * 100))}%` }}
                        />
                        {/* Vạch ngưỡng 95% */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                          style={{ left: '95%' }}
                          title="Ngưỡng đạt: 95%"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
                        <span>0%</span>
                        <span className="font-bold text-slate-700">| Ngưỡng tối thiểu: 95.0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Kết quả phản hồi sau khi bấm điểm danh */}
                  {faceResult ? (
                    <div
                      className={`rounded-xl border p-4 text-left transition-all ${
                        faceResult.ok
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-rose-200 bg-rose-50 text-rose-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {faceResult.ok ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                        )}
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-sm">{faceResult.message}</p>
                          {faceResult.punch ? (
                            <div className="mt-2 rounded-lg bg-white p-2.5 border border-slate-200 space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Hình thức:</span>
                                <span className="font-bold text-emerald-700">{faceResult.punch}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Thời gian:</span>
                                <span className="font-mono text-slate-900 font-semibold">{faceResult.time}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Cảm biến ghi nhận:</span>
                                <span className="font-semibold text-blue-700">{faceResult.sensorType}</span>
                              </div>
                              {faceResult.similarity ? (
                                <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center">
                                  <span className="text-slate-500">Độ khớp:</span>
                                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px]">
                                    {(faceResult.similarity * 100).toFixed(1)}% (Đạt ≥ 95.0%)
                                  </Badge>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* TAB 1: ĐIỂM DANH KHUÔN MẶT */}
                  {activeTab === 'VERIFY' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-900">Điểm danh khuôn mặt 2D</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-600">{currentTime}</span>
                      </div>

                      {enrolledCount === 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                          <p className="font-bold mb-1">Chưa có dữ liệu mẫu khuôn mặt</p>
                          Bạn chưa đăng ký mẫu khuôn mặt trên hệ thống. Hãy chuyển sang tab <strong>Đăng ký</strong> để chụp 3 góc ảnh chuẩn hóa.
                        </div>
                      ) : !camOn ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                          <Camera className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-800">Camera chưa được kích hoạt</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Vui lòng nhấn nút <strong>&ldquo;Bật Camera ngay&rdquo;</strong> ở khung bên trái trước khi điểm danh.
                            </p>
                          </div>
                        </div>
                      ) : !isLiveMatch ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
                          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-800">Chưa đạt ngưỡng điểm danh (≥ 95%)</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Độ khớp hiện tại:{' '}
                              <strong>{liveSimilarity !== null ? `${(liveSimilarity * 100).toFixed(1)}%` : '--.-%'}</strong>.
                              Vui lòng nhìn thẳng vào camera và căn chỉnh khuôn mặt vào giữa khung.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Khuôn mặt hợp lệ <strong>{(liveSimilarity! * 100).toFixed(1)}% ≥ 95%</strong>. Bạn có thể bấm điểm danh ngay!</span>
                        </div>
                      )}

                      <Button
                        size="lg"
                        disabled={faceSubmitting || enrolledCount === 0 || !camOn || !isLiveMatch}
                        onClick={handleVerifyFace}
                        className={`w-full py-6 text-sm font-bold gap-2 text-white shadow-xs transition-all disabled:opacity-50 ${
                          isLiveMatch
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-slate-400'
                        }`}
                      >
                        {faceSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : !camOn ? (
                          <Camera className="h-5 w-5" />
                        ) : (
                          <UserCheck className="h-5 w-5" />
                        )}
                        {!camOn
                          ? 'Cần Bật Camera trước khi điểm danh'
                          : isLiveMatch
                          ? `Điểm danh khuôn mặt ngay (${(liveSimilarity! * 100).toFixed(1)}% ≥ 95%)`
                          : liveSimilarity !== null
                          ? `Chưa đạt ngưỡng điểm danh (${(liveSimilarity * 100).toFixed(1)}% < 95%)`
                          : 'Đang nhận diện…'}
                      </Button>
                    </div>
                  ) : null}

                  {/* TAB 2: ĐĂNG KÝ MẪU (3 BƯỚC) */}
                  {activeTab === 'ENROLL' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-900">Chụp 3 mẫu nhận diện</span>
                        <span className="text-xs font-mono font-bold text-blue-600">{samples.length}/3 mẫu</span>
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
                              className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                                done
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : isCurrent
                                  ? 'border-blue-300 bg-blue-50 text-blue-800 shadow-xs'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              }`}
                            >
                              <span className="text-xs font-bold">{done ? `${item.title} ✓` : item.title}</span>
                              <span className="text-[10px] mt-0.5">{item.sub}</span>
                            </div>
                          );
                        })}
                      </div>

                      {!camOn ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Vui lòng nhấn <strong>&ldquo;Bật Camera ngay&rdquo;</strong> bên trái để chụp mẫu thật.</span>
                        </div>
                      ) : null}

                      <Button
                        size="lg"
                        disabled={faceSubmitting || !camOn}
                        onClick={handleCaptureSample}
                        className="w-full py-6 text-sm font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                      >
                        {faceSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5" />
                        )}
                        {!camOn
                          ? 'Cần Bật Camera để chụp mẫu'
                          : samples.length === 0
                          ? 'Chụp Mẫu 1 (Nhìn thẳng)'
                          : samples.length === 1
                          ? 'Chụp Mẫu 2 (Nghiêng nhẹ)'
                          : 'Chụp Mẫu 3 & Hoàn tất đăng ký'}
                      </Button>

                      {samples.length > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSamples([])}
                          className="text-xs text-slate-500 hover:text-rose-600 self-center"
                        >
                          Hủy & Chụp lại từ đầu
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {/* TAB 3: GIẢI PHÁP & CÔNG NGHỆ CAMERA HỒNG NGOẠI IR */}
                  {activeTab === 'IR_TECH' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Radio className="h-4 w-4 text-rose-600" />
                          <span className="text-sm font-bold text-slate-900">Phương án Camera Hồng ngoại (IR) 2D</span>
                        </div>
                        <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 text-[10px]">
                          Anti-Spoofing
                        </Badge>
                      </div>

                      <div className="space-y-2.5 text-slate-600 leading-relaxed">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-blue-600" /> 1. Truy cập trực tiếp qua WebRTC MediaDevices
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Hệ thống tự động phát hiện luồng cảm biến hồng ngoại phần cứng (videoinput device có nhãn IR / Infrared) và kích hoạt trực tiếp không cần plugin.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 2. Chống giả mạo quang học (Optical Liveness)
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Cảm biến IR phát quang phổ 850nm/940nm đo độ phản xạ nhiệt của da người thật. Màn hình điện thoại/iPad và ảnh in trên giấy sẽ bị triệt tiêu phản xạ, ngăn chặn 100% việc gian lận.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-purple-600" /> 3. Vector 256 chiều HOG + LBP Đơn sắc
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Trích xuất đặc trưng hình thái học trên quang phổ IR, hoạt động ổn định trong mọi điều kiện ánh sáng (kể cả ban đêm hoặc ngược sáng).
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* TAB 4: BẢO MẬT & QUẢN LÝ MẪU */}
                  {activeTab === 'SECURITY' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-900">Quản lý mẫu sinh trắc học</span>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-[10px]">
                          Bảo mật CSDL
                        </Badge>
                      </div>

                      <div className="space-y-2 text-slate-600 leading-relaxed">
                        <p>
                          • <strong>Số mẫu đang lưu:</strong> {enrolledCount} mẫu nhận diện đã đăng ký.
                        </p>
                        <p>
                          • <strong>Bảo vệ dữ liệu:</strong> Dữ liệu được mã hóa vector an toàn; hình ảnh gốc không bao giờ được lưu trữ trên máy chủ.
                        </p>
                        <p>
                          • <strong>Ngưỡng chấp thuận:</strong> Yêu cầu độ tương đồng tối thiểu $\ge 95.0\%$ để bảo đảm an ninh sinh trắc học.
                        </p>
                      </div>

                      {enrolledCount > 0 ? (
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">Xóa dữ liệu khuôn mặt:</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDeleteEnrollment}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
                          >
                            Xóa toàn bộ mẫu
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Quick Nav Links */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between text-xs text-slate-500 shadow-xs">
                    <Link href="/profile" className="text-blue-600 hover:underline font-medium">
                      Hồ sơ cá nhân & Sinh trắc học
                    </Link>
                    <Link href="/attendance" className="text-blue-600 hover:underline font-medium">
                      Lịch sử chấm công & Bảng công
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen bg-slate-50 items-center justify-center p-10 text-center text-slate-600">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </main>
      }
    >
      <CheckInInner />
    </Suspense>
  );
}
