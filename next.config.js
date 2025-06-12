/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // ✅ 強制關掉 Turbopack，回到 Webpack
  },
}

module.exports = nextConfig
