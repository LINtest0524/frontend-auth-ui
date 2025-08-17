import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/*?*', // 禁止帶參數的頁面
          '/*/login',
          '/*/register',
          '/*/member',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/a/',
          '/b/',
          '/a/news/',
          '/b/news/',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}