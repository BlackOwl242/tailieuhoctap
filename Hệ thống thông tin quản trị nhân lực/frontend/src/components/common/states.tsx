'use client';

import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/primitives';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { DOMAINS } from '@/lib/navigation';

/** Trạng thái rỗng thống nhất (danh sách trống, không kết quả…). */
export function EmptyState({
  title,
  hint,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  description?: string;
  icon?: typeof Inbox;
}) {
  const text = hint ?? description;
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/60" aria-hidden />
      <p className="font-medium">{title}</p>
      {text ? <p className="max-w-sm text-sm text-muted-foreground">{text}</p> : null}
    </div>
  );
}

/** Trạng thái lỗi có nút thử lại — hiển thị message an toàn từ backend. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Thử lại
        </Button>
      ) : null}
    </div>
  );
}

/** Spinner giữa khối — dùng cho loading từng vùng nội dung. */
export function LoadingBlock({ label = 'Đang tải…', text }: { label?: string; text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{text ?? label}</span>
    </div>
  );
}

export const LoadingState = LoadingBlock;

/**
 * Topcard tiêu đề trang — chuẩn khoảng cách toàn hệ thống (Mục 1):
 * luôn cách khối nội dung kế tiếp đúng một token `stack` (mb-stack).
 */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const domain = DOMAINS.find((d) =>
    d.folders.some((f) =>
      f.items.some((item) => {
        const base = item.href.split('?')[0];
        return pathname === base || pathname.startsWith(`${base}/`);
      }),
    ) || d.tags.some((t) => {
      const base = t.href.split('?')[0];
      return pathname === base || pathname.startsWith(`${base}/`);
    }),
  );
  const breadcrumbs =
    domain && domain.label !== title
      ? [{ label: domain.label }, { label: title }]
      : [{ label: title }];

  return (
    <WorkspaceHeader
      title={title}
      description={description}
      actions={actions}
      breadcrumbs={breadcrumbs}
      className="no-print"
    />
  );
}
