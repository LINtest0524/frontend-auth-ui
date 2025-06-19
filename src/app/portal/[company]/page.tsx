'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'

export default function PortalCompanyPage() {
  const { company } = useParams()
  const { user } = useUserStore()
  const modules = useEnabledModules()

  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])

  const comp = typeof company === 'string' ? company : 'a'

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${comp}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBanners)
      .catch(() => setBanners([]))

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${comp}`)
      .then(res => res.ok ? res.json() : [])
      .then(setMarquees)
      .catch(() => setMarquees([]))
  }, [comp])

  const renderModule = useCallback((key: string, props: any = {}) => {
    const mod = modules.find((m) => m.key === key)
    if (!mod) return null
    const Comp = mod.Component
    return <Comp {...props} />
  }, [modules])

  return (
    <>
      <PortalHeaderBar />

      <div className="container mx-auto p-6 space-y-6">
        {user ? (
          <>
            {/* ✅ 已登入顯示模組 + 會員中心 */}
            {renderModule('marquee', { marquees })}

            <div className="border rounded p-4 bg-white shadow">
              <h1 className="text-xl font-bold mb-4">歡迎來到會員中心</h1>
              <p>這裡可以顯示你要的內容</p>
              <p className="text-sm text-gray-600 mt-4">🧑 使用者：{user.username}</p>
            </div>

            {renderModule('banner', { banners })}
            {renderModule('marquee', { marquees })}
          </>
        ) : (
          <>
            {/* ✅ 未登入也能看到的公開資訊 */}
            <Marquee />
            <BannerCarousel banners={banners} />
          </>
        )}
      </div>
    </>
  )

}
