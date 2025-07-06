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

  const companyCode = 'a'




  useEffect(() => {
    const token = localStorage.getItem('portalToken')

    // ✅ banner：不需要登入，正常 fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBanners)
      .catch(() => setBanners([]))

    // ✅ marquee：根據登入狀態切換 API 與 header
    const marqueeApi = token
      ? `${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${companyCode}`
      : `${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/marquee?company=${companyCode}`

    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {}

    fetch(marqueeApi, { headers })
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
        <h1 className="text-xl font-bold mb-4">A首頁</h1>

        {user && (
          <div className="border rounded p-4 bg-white shadow">
            <p>這裡可以顯示你要的內容</p>
          </div>
        )}

        {renderModule('banner', { banners })}
        {renderModule('marquee', { marquees })}
      </div>
    </>
  )
}
