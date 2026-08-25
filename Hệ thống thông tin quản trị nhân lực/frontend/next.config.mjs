/** @type {import('next').NextConfig} */

// Proxy /api/* về backend — trong Docker dùng tên service `api`,
// khi dev trên máy thật dùng localhost:3001 (đổi qua env API_PROXY_TARGET).
const proxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001';

const nextConfig = {
  output: 'standalone', // đóng gói tối giản cho image Node nhỏ
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: `${proxyTarget}/uploads/:path*` },
      { source: '/api/:path*', destination: `${proxyTarget}/api/:path*` },
    ];
  },
};

export default nextConfig;
