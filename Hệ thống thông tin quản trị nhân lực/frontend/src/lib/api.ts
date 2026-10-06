'use client';

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from './auth-store';
import type { ApiErrorBody } from './types';

/**
 * Axios client dùng chung — baseURL tương đối `/api/v1` nên hoạt động cả khi
 * dev (Next rewrites) lẫn production (rewrite trong container web).
 * Tự động: gắn Bearer token → khi 401 thì refresh MỘT lần rồi thử lại.
 */
export const api = axios.create({ baseURL: '/api/v1', timeout: 20_000 });

// Cờ chống vòng lặp refresh: nhiều request 401 song song chỉ refresh một lần
let refreshing: Promise<string | null> | null = null;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    // Chỉ bỏ qua refresh với các endpoint xác thực thuần (login/refresh/logout);
    // /auth/me 401 do access token hết hạn → vẫn thử refresh rồi thử lại.
    const url = original?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh')
      || url.includes('/auth/logout');

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing = refreshing ?? doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh thất bại → đăng xuất và về trang login.
      // RIỆNG các trang công khai (kiosk, check-in QR/khuôn mặt, login) KHÔNG
      // bị đá về login — trang tự hiển thị lời mời đăng nhập thân thiện
      // (trước đây bấm "Điểm danh khuôn mặt" khi chưa đăng nhập bị giật ngược).
      useAuthStore.getState().clear();
      const PUBLIC_PATHS = ['/login', '/check-in'];
      const onPublicPage = typeof window !== 'undefined'
        && PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));
      if (typeof window !== 'undefined' && !onPublicPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Gọi /auth/refresh bằng refresh token hiện có; trả access token mới hoặc null. */
async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
    setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
    return res.data.accessToken as string;
  } catch {
    return null;
  }
}

/** Lỗi 401/403 → phiên không còn hợp lệ (hết hạn, bị thu hồi, bị khóa). */
export function isUnauthorized(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const s = error.response?.status;
    return s === 401 || s === 403;
  }
  return false;
}

/** Trích thông điệp lỗi thân thiện từ shape lỗi thống nhất của backend. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
    if (error.code === 'ECONNABORTED') return 'Hết thời gian chờ máy chủ';
    return 'Không thể kết nối máy chủ';
  }
  return 'Đã xảy ra lỗi không xác định';
}

/** Opens an attachment through the authenticated API; private uploads have no public static URL. */
export async function openProtectedFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith('/uploads/')) {
    const external = new URL(fileUrl, window.location.origin);
    if (external.protocol === 'https:' || external.protocol === 'http:') window.open(external.href, '_blank', 'noopener,noreferrer');
    return;
  }
  const key = fileUrl.slice('/uploads/'.length);
  const tab = window.open('about:blank', '_blank');
  if (tab) tab.opener = null;
  try {
    const response = await api.get(`/files/${encodeURIComponent(key)}`, { responseType: 'blob' });
    const objectUrl = URL.createObjectURL(response.data as Blob);
    if (tab) tab.location.href = objectUrl;
    else {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = key.split('.').slice(0, -1).join('.') || key;
      link.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    tab?.close();
    window.alert(errorMessage(error));
  }
}
