'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RATING_LABELS = ['', 'Kém', 'Yếu', 'Trung bình', 'Tốt', 'Xuất sắc'] as const;

/**
 * Đánh giá theo sao (Mục 6):
 * - Chế độ tương tác: hover đổi màu theo sao đang chỉ, click chọn, có nhãn
 *   mức điểm + hướng dẫn — dùng cho phỏng vấn/đánh giá ứng viên;
 * - Chế độ chỉ đọc: hiển thị sao đã đạt (đầy/đủ nửa/rỗng) kèm nhãn.
 */
export function StarRating({
  value,
  onChange,
  readOnly,
  size = 'md',
  showLabel = true,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const current = hover ?? value ?? 0;
  const px = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size];

  if (readOnly) {
    return (
      <span className="inline-flex items-center gap-1.5" aria-label={`Điểm ${value ?? 0}/5 — ${RATING_LABELS[value ?? 0]}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(px, i <= (value ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
        ))}
        {showLabel ? <span className="text-xs text-muted-foreground">{RATING_LABELS[value ?? 0] ?? '—'}</span> : null}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Chọn mức đánh giá 1 đến 5 sao">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} sao — ${RATING_LABELS[i]}`}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange?.(i)}
          >
            <Star className={cn(px, 'transition-colors', i <= current ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
          </button>
        ))}
        {showLabel ? (
          <span className={cn('ml-1 text-sm font-medium', current > 0 ? 'text-foreground' : 'text-muted-foreground')}>
            {current > 0 ? `${current}/5 · ${RATING_LABELS[current]}` : 'Chưa đánh giá'}
          </span>
        ) : null}
      </div>
      {!showLabel ? null : (
        <p className="text-xs text-muted-foreground">Di chuột lên sao và bấm để chọn mức điểm.</p>
      )}
    </div>
  );
}
