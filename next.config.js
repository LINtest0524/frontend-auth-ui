/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // 後端 API proxy
      },
    ];
  },
  images: {
    domains: ['localhost'], // ✅ 允許顯示 http://localhost:* 的圖片
  },
};

module.exports = nextConfig;
