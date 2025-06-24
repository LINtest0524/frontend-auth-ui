/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // ← 修改成你後端實際網址與 port
      },
    ];
  },
};

module.exports = nextConfig;
