'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './types';

/** Khóa localStorage của phiên đăng nhập — dùng khi xóa sạch phiên. */
const STORAGE_KEY = 'kms-auth';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: AuthUser) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

/**
 * Lưu phiên đăng nhập vào localStorage (persist).
 * Access token ngắn hạn 15 phút — interceptor sẽ tự refresh khi hết hạn.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (tokens, user) => set({ ...tokens, user }),
      setTokens: (tokens) => set(tokens),
      setUser: (user) => set({ user }),
      /**
       * Xóa phiên SẠCH (Mục 3): reset state + xóa hẳn key persist trong
       * localStorage để không còn dấu vết token của tài khoản cũ.
       */
      clear: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    { name: STORAGE_KEY },
  ),
);
