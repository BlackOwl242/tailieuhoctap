/** @type {import('next').NextConfig} */

// Proxy /api/* về backend — trong Docker compose truyền API_PROXY_TARGET=http://api:3001,
// khi dev trên máy thật mặc định dùng http://127.0.0.1:3001.
const proxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:3001';

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
