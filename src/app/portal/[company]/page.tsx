'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useEnabledModules } from '@/lib/useEnabledModules'
import BannerCarousel from '@/components/BannerCarousel'

export default function PortalCompanyPage() {
  const { company } = useParams()
  const [banners, setBanners] = useState([])
  const modules = useEnabledModules()

  useEffect(() => {
    if (!company) return

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${company}`)
      .then((res) => res.json())
      .then((data) => setBanners(data))
      .catch(() => setBanners([]))
  }, [company])

  return (
    <div className="container mx-auto p-6 space-y-4">
      {/* Top 區塊 */}
      {modules
        .filter((m) => m.position === 'top')
        .map((mod) => {
          // Banner 元件支援 banners props
          if (mod.key === 'banner') {
            return <mod.Component key={mod.key} banners={banners} />
          }
          return <mod.Component key={mod.key} />
        })}

      {/* 中間自訂內容 */}
      <div className="border rounded p-4 bg-white shadow">
        <h1 className="text-xl font-bold mb-4">歡迎來到會員中心</h1>
        <p>這裡可以顯示你要的內容</p>
      </div>

      {/* Bottom 區塊 */}
      {modules
        .filter((m) => m.position === 'bottom')
        .map((mod) => <mod.Component key={mod.key} />)}
    </div>
  )
}
