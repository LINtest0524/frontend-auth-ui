
'use client'

import BannerCarousel from '@/components/BannerCarousel'

export default function HomePage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">歡迎來到我們的網站</h1>
      <BannerCarousel />
    </main>
  )
}