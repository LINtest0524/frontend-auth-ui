'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'

export default function AgentAHomePage() {
  const { user } = useUserStore()
  const modules = useEnabledModules()

  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])

  const companyCode = 'b' // ✅ 固定 company 為代理商 b

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBanners)
      .catch(() => setBanners([]))

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setMarquees)
      .catch(() => setMarquees([]))
  }, [])

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
        <h1 className="text-xl font-bold mb-4">B首頁</h1>
        {user ? (
          <>
            <div className="border rounded p-4 bg-white shadow">
              <p>這裡可以顯示你要的內容</p>
            </div>

            {renderModule('banner', { banners })}
            {renderModule('marquee', { marquees })}
          </>
        ) : (
          <>
            <Marquee marquees={marquees} />
            <BannerCarousel banners={banners} />
          </>
        )}
      </div>
    </>
  )
}
