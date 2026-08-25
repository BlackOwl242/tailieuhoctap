'use client';

import * as React from 'react';
import { create } from 'zustand';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  title: string;
  variant: ToastVariant;
}

interface ToastStore {
  items: ToastItem[];
  push: (title: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

/** Store thông báo ngắn (toast) — tầng z cao nhất theo token z-index. */
export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (title, variant = 'info') => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, title, variant }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Hook tiện dụng trong các trang: const toast = useToast(); toast('Đã lưu','success') */
export function useToast() {
  return useToastStore((s) => s.push);
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  info: <Info className="h-4 w-4 text-primary" />,
};

export function Toaster() {
  const { items, dismiss } = useToastStore();
  return (
    // z-toast: tầng cao nhất — luôn nổi trên modal/overlay
    <div className="pointer-events-none fixed inset-x-0 bottom-16 sm:bottom-6 sm:right-4 sm:left-auto z-toast flex flex-col gap-2 px-4 sm:px-0">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-md border bg-card px-3 py-2.5 text-left text-sm shadow-lg animate-fade-in',
            t.variant === 'error' && 'border-destructive/40',
          )}
        >
          {ICONS[t.variant]}
          <span>{t.title}</span>
        </button>
      ))}
    </div>
  );
}
