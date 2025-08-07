'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'

type FloatingAd = {
  id: number
  title: string
  link_url: string
  image_url?: string
  target_blank: boolean
  position: string
  status: string
  sort: number
}

export default function AgentAHomePage() {
  const { user } = useUserStore()
  const modules = useEnabledModules()

  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])
  const [floatingAds, setFloatingAds] = useState<FloatingAd[]>([])

  const companyCode = 'a'




  useEffect(() => {
    const token = localStorage.getItem('portalToken')

    // ✅ banner：不需要登入，正常 fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBanners)
      .catch(() => setBanners([]))

    // ✅ marquee：登入狀態使用認證端點，登出狀態使用公開端點
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${companyCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(setMarquees)
        .catch(() => setMarquees([]))
    } else {
      // 登出狀態下使用公開端點
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/marquee?company=${companyCode}`)
        .then(res => res.ok ? res.json() : [])
        .then(setMarquees)
        .catch(() => setMarquees([]))
    }

    // ✅ 浮動廣告：不需要登入，正常 fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/floating-ads?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setFloatingAds)
      .catch(() => setFloatingAds([]))
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

      <div>
        

        {user && (
          <div>
            {/* <p>這裡可以顯示你要的內容</p> */}
          </div>
        )}

        {renderModule('banner', { banners })}
        {renderModule('marquee', { marquees })}

        {/* 浮動廣告 */}
        {floatingAds.map((ad, index) => {
          // 計算同位置的廣告索引
          const samePositionAds = floatingAds.filter(item => item.position === ad.position)
          const positionIndex = samePositionAds.findIndex(item => item.id === ad.id)
          
          // 根據位置和索引計算偏移
          const getOffset = () => {
            const spacing = 90 // 每個廣告間距 90px
            const offset = positionIndex * spacing
            
            if (ad.position.includes('bottom')) {
              return { bottom: `${50 + offset}px` }
            } else {
              return { top: `${150 + offset}px` }
            }
          }
          
          return (
            <a
              key={ad.id}
              href={ad.link_url}
              target={ad.target_blank ? '_blank' : '_self'}
              className={`floating-ad floating-ad-${ad.position}`}
              title={ad.title}
              style={getOffset()}
            >
              {ad.image_url ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE}${ad.image_url}`}
                  alt={ad.title}
                  className="floating-ad-img"
                />
              ) : (
                ad.title
              )}
            </a>
          )
        })}
      </div>
    </>
  )
}
