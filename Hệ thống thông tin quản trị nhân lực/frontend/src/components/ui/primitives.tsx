'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Ảnh đại diện: fallback chữ cái đầu khi chưa có ảnh. */
export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <AvatarPrimitive.Root className={cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full', className)}>
      {children}
    </AvatarPrimitive.Root>
  );
}
export function AvatarFallback({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <AvatarPrimitive.Fallback className={cn('flex h-full w-full items-center justify-center bg-muted text-xs font-medium', className)}>
      {children}
    </AvatarPrimitive.Fallback>
  );
}
export function AvatarImage({ src, alt }: { src: string; alt: string }) {
  return <AvatarPrimitive.Image src={src} alt={alt} className="aspect-square h-full w-full object-cover" />;
}

/* ============================================================================
 * Bộ primitive theo phong cách shadcn/ui — dùng chung toàn ứng dụng.
 * Quy ước: chỉ dùng spacing scale Tailwind (p-*, gap-*, space-*) và token
 * z-index từ tailwind.config; không bao giờ giá trị tùy tiện.
 * ========================================================================== */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-card hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[100px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />;
}

/**
 * Họ Card — chuẩn khoảng cách toàn hệ thống (Mục 1):
 * - CardHeader (topcard): p-card, đáy giảm còn pb-2/sm:pb-3 để tạo nhịp với nội dung;
 * - CardContent: p-card đầy đủ (đứng một mình vẫn có padding đủ), pt-2/sm:pt-3
 *   khi nằm dưới header → tổng khe hở header↔nội dung luôn 16/24px, không bao giờ "sát";
 * - CardFooter: p-card, không padding trên (nội dung đã có đáy).
 * KHÔNG override p-2/p-3 trong trang — nếu cần thẻ gọn dùng size="sm".
 */
export function Card({ className, size = 'md', ...props }: React.HTMLAttributes<HTMLDivElement> & { size?: 'md' | 'sm' }) {
  return <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', size === 'sm' && 'text-sm', className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-card pb-2 sm:pb-3', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold leading-tight tracking-tight', className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-card pt-2 sm:pt-3', className)} {...props} />;
}
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 p-card pt-0', className)} {...props} />;
}

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border shadow-2xs', {
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary border-primary/20',
      secondary: 'bg-slate-100 text-slate-700 border-slate-200',
      outline: 'border-slate-300 text-slate-700 bg-white',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-50 text-amber-800 border-amber-200',
      destructive: 'bg-rose-50 text-rose-700 border-rose-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn('h-px w-full bg-border', className)} />;
}

/** Select bọc thẻ native — đủ dùng, mobile-friendly, không cần radix. */
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
