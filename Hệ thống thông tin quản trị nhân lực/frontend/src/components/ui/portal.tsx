'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

/**
 * Thành phần Portal chuẩn hóa cho toàn dự án:
 * - Đưa toàn bộ Modal / Dialog / Overlay ra ngoài cây DOM của trang và gắn trực tiếp vào document.body;
 * - Triệt tiêu 100% lỗi bị che khuất, bị cắt xén (clipping) bởi các container cha như <main overflow-x-clip>;
 * - Đảm bảo lớp phủ backdrop (bg-black/60) phủ kín 100% viewport từ đỉnh màn hình (top: 0) đến đáy màn hình,
 *   không bao giờ bị hở mép trên (top gap) do sticky header hay sidebar.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}
