'use client';

import { cn } from '@/lib/utils';

/**
 * Container chuẩn cho MỌI trang (Mục 6 — đồng bộ chiều rộng):
 * - max-w-7xl căn giữa trong vùng còn lại sau sidebar — đủ rộng cho data table;
 * - padding ngang px-4 (mobile) → sm:px-6 (desktop);
 * - khoảng cách dọc py-stack thống nhất.
 * Mọi trang bọc nội dung bằng component này thay vì tự set width.
 */
export function PageContainer({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn('mx-auto w-full', wide ? 'max-w-[96rem]' : 'max-w-7xl', 'px-0 sm:px-2 lg:px-4', className)}>
      {children}
    </div>
  );
}
