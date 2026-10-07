'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, SelectDialogContext } from '@/components/ui/primitives';

/**
 * Modal dùng chung (radix dialog) cho mọi form thêm/sửa/xem chi tiết.
 * Kích thước chuẩn: sm (form ngắn) | md (mặc định) | lg (form nhiều trường).
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
  const [selectDialogLayer, setSelectDialogLayer] = React.useState<HTMLElement | null>(null);
  const width = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  }[size];
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SelectDialogContext.Provider value={selectDialogLayer}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 no-print" />
        <DialogPrimitive.Content
          data-select-dialog="true"
          className={cn(
            'fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
            'flex max-h-[85dvh] flex-col overflow-visible rounded-xl border border-border bg-card p-6 shadow-2xl focus:outline-none animate-in zoom-in-95 duration-150 text-foreground',
            'print:static print:transform-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:border-0 print:shadow-none print:p-0 print:bg-transparent',
            width,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-3 no-print">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold leading-tight">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <button className="rounded-md p-1.5 hover:bg-accent" aria-label="Đóng">
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
          {footer ? <div className="mt-5 flex justify-end gap-2 no-print">{footer}</div> : null}
          <div ref={setSelectDialogLayer} className="pointer-events-none absolute inset-0 z-[120] overflow-visible" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      </SelectDialogContext.Provider>
    </DialogPrimitive.Root>
  );
}

export function ModalFooterActions({
  onCancel,
  confirmLabel = 'Lưu',
  cancelLabel = 'Hủy',
  pending,
  disabled,
  onConfirm,
  confirmVariant = 'default',
  className,
}: {
  onCancel: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  confirmVariant?: 'default' | 'destructive' | 'success';
  className?: string;
}) {
  return (
    <div className={cn('mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/50', className)}>
      <Button type="button" variant="outline" onClick={onCancel}>{cancelLabel}</Button>
      <Button type={onConfirm ? 'button' : 'submit'} variant={confirmVariant} disabled={disabled || pending} onClick={onConfirm}>
        {pending ? 'Đang lưu…' : confirmLabel}
      </Button>
    </div>
  );
}
