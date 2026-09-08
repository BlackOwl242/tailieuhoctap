import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: 'Hệ thống Quản trị Nhân lực Toàn diện (HRMIS Pro)', template: '%s · HRMIS Pro' },
  description: 'Hệ thống thông tin quản trị nhân lực và hồ sơ cán bộ áp dụng cho cơ quan nhà nước, đơn vị sự nghiệp và doanh nghiệp',
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
