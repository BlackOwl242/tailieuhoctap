import type { Config } from 'tailwindcss';

/**
 * Hệ thống thiết kế thống nhất toàn ứng dụng:
 * - Màu sắc qua CSS variables (chuẩn shadcn/ui) → dễ đổi theme;
 * - Spacing: chỉ dùng scale có sẵn của Tailwind, cấm giá trị tùy tiện;
 * - z-index: token cố định theo tầng (nội dung < sticky < dropdown < overlay
 *   < modal < toast) để triệt tiêu hoàn toàn lỗi chồng lớp.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /**
       * Token khoảng cách ngữ nghĩa (Mục 1 — chuẩn hóa spacing):
       * - card    : padding chuẩn BÊN TRONG thẻ (20px) — cấm p-2/p-3 tùy tiện;
       * - card-lg : padding thẻ lớn / thẻ nổi bật (24px);
       * - stack   : gap dọc GIỮA các khối trên một trang (20px);
       * - section : khoảng cách giữa các nhóm lớn (32px).
       * Mọi component dùng token này thay vì giá trị rời rạc để đồng bộ toàn hệ thống.
       */
      spacing: {
        card: '1.25rem',
        'card-lg': '1.5rem',
        stack: '1.25rem',
        section: '2rem',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Token z-index dùng chung — KHÔNG dùng số trực tiếp trong component
      zIndex: {
        content: '0',
        sticky: '10',
        dropdown: '20',
        overlay: '30',
        modal: '40',
        toast: '50',
      },
      fontFamily: {
        // Font hệ thống rõ ràng, đồng bộ mọi nền tảng (không tải font ngoài)
        sans: [
          'Inter',
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in 150ms ease-out' },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
