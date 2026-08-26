import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gộp className an toàn với Tailwind (chuẩn shadcn/ui). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Định dạng ngày giờ tiếng Việt ngắn gọn. */
export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Nhãn tiếng Việt cho trạng thái bài viết. */
export const ARTICLE_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã lưu trữ',
};

/** Màu badge theo trạng thái bài viết. */
export const ARTICLE_STATUS_TONE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200 border',
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200 border',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200 border',
  ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200 border',
};

/** Nhãn trạng thái chấm công trong ngày. */
export const DAY_STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Đủ công',
  LATE: 'Đi muộn',
  EARLY_LEAVE: 'Về sớm',
  MISSING_PAIR: 'Thiếu giờ vào/ra',
  ON_LEAVE: 'Nghỉ phép',
  HOLIDAY: 'Ngày lễ',
};
