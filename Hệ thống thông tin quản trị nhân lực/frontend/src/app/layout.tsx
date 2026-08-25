import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: 'HRMIS Saigon Technology', template: '%s · HRMIS' },
  description: 'Hệ thống thông tin quản trị nhân lực — Saigon Technology',
};

// Mobile-first: viewport chuẩn cho thiết bị di động
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
