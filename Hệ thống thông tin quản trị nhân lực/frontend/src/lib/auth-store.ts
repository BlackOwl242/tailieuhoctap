'use client';

import { create } from 'zustand';
import type { AuthUser } from './types';

/** Khóa localStorage cũ từng lưu token — xóa sạch khi đăng xuất / khởi tạo để nâng chuẩn OWASP. */
const LEGACY_STORAGE_KEY = 'kms-auth';

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  sessionBootstrapped: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  markBootstrapped: () => void;
  clear: () => void;
}

/**
 * Lưu access token và hồ sơ người dùng CHỈ TRONG BỘ NHỚ (in-memory).
 * Refresh token được giữ hoàn toàn trong HttpOnly cookie `hrmis_rt` — không lưu JWT vào localStorage.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  sessionBootstrapped: false,
  setAuth: (accessToken, user) => set({ accessToken, user, sessionBootstrapped: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  markBootstrapped: () => set({ sessionBootstrapped: true }),
  clear: () => {
    set({ accessToken: null, user: null, sessionBootstrapped: true });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Ignored
      }
    }
  },
}));
