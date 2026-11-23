/** @type {import('next').NextConfig} */

// Proxy /api/* về backend — trong Docker compose truyền API_PROXY_TARGET=http://api:3001
const rawProxy = process.env.API_PROXY_TARGET || 'http://api:3001';
const proxyTarget = rawProxy.trim();

const nextConfig = {
  output: 'standalone', // đóng gói tối giản cho image Node nhỏ
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/regulations', destination: '/payroll-engine?tab=policy', permanent: true }];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: `${proxyTarget}/uploads/:path*` },
      { source: '/api/:path*', destination: `${proxyTarget}/api/:path*` },
    ];
  },
};

export default nextConfig;
