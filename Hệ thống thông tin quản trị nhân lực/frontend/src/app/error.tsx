'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

/** Ranh giới lỗi toàn ứng dụng — không bao giờ để màn hình trắng. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h1 className="text-lg font-semibold">Đã xảy ra lỗi không mong muốn</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'Vui lòng thử lại. Nếu lỗi tiếp diễn, liên hệ quản trị viên.'}
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </main>
  );
}
