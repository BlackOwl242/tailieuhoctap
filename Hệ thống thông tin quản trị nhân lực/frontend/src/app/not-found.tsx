import Link from 'next/link';

/** Trang 404 thân thiện. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-lg font-semibold">Không tìm thấy trang</h1>
      <p className="text-sm text-muted-foreground">Đường dẫn không tồn tại hoặc đã bị di chuyển.</p>
      <Link href="/dashboard" className="text-sm text-primary underline underline-offset-2">← Về tổng quan</Link>
    </main>
  );
}
