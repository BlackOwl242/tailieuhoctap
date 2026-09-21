'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface HoverMarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  speed?: number; // Tốc độ trượt (pixels per second), mặc định 40px/s
  children?: React.ReactNode;
}

/**
 * Component hiển thị văn bản có tính năng Hover Marquee:
 * - Trạng thái bình thường: Hiển thị gọn gàng với dấu 3 chấm (...) nếu vượt quá ô chứa.
 * - Khi rê chuột (Hover): Nếu văn bản dài hơn ô chứa, tự động kích hoạt animation trượt êm ái
 *   sang trái để người dùng đọc trọn vẹn toàn bộ câu/dòng chữ.
 * - Khi rời chuột: Trở về vị trí đầu tức thì với dấu 3 chấm.
 */
export function HoverMarquee({
  text,
  className,
  speed = 40,
  children,
  ...props
}: HoverMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(3.5);

  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const contentWidth = contentRef.current.scrollWidth;

    if (contentWidth > containerWidth + 2) {
      const diff = contentWidth - containerWidth + 12; // 12px buffer để đọc trọn vẹn chữ cuối
      setIsOverflowing(true);
      setDistance(diff);
      setDuration(Math.max(2.5, diff / speed));
    } else {
      setIsOverflowing(false);
      setDistance(0);
    }
  }, [speed]);

  useEffect(() => {
    calculateOverflow();
    window.addEventListener('resize', calculateOverflow);
    return () => window.removeEventListener('resize', calculateOverflow);
  }, [text, calculateOverflow]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={calculateOverflow}
      className={cn('hover-marquee-wrapper relative overflow-hidden min-w-0 select-none', className)}
      title={text}
      style={
        isOverflowing
          ? ({
              '--marquee-dist': `-${distance}px`,
              '--marquee-dur': `${duration}s`,
            } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      <span
        ref={contentRef}
        className="hover-marquee-inner"
        data-overflow={isOverflowing ? 'true' : 'false'}
      >
        {children || text}
      </span>
    </div>
  );
}
