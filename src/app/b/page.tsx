'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import { verifyTokenOnce } from '@/lib/tokenVerification'
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
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [floatingAds, setFloatingAds] = useState<FloatingAd[]>([])

  const companyCode = 'b' //   固定 company 為代理商 b

  useEffect(() => {
    const token = localStorage.getItem(`portalToken_${companyCode}`)
    const userData = localStorage.getItem(`portalUser_${companyCode}`)

    // 如果有 token 和用戶資料，驗證 token 並記錄登入紀錄
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        // 驗證 token 並記錄登入紀錄（防重複調用）
        verifyTokenOnce(companyCode).catch(error => {
          console.error('Token 驗證失敗:', error)
        })
      } catch (error) {
        console.error('解析用戶資料失敗:', error)
      }
    }

    //   獲取啟用的模組列表
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setEnabledModules)
      .catch(() => setEnabledModules([]))

    //   banner：不需要登入，正常 fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBanners)
      .catch(() => setBanners([]))

    //   marquee：登入狀態使用認證端點，登出狀態使用公開端點
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

    //   浮動廣告：不需要登入，正常 fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/floating-ads?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setFloatingAds)
      .catch(() => setFloatingAds([]))
  }, [])

  const renderModule = useCallback((key: string, props: any = {}) => {
    //   檢查模組是否啟用
    if (!enabledModules.includes(key)) return null
    
    const mod = modules.find((m) => m.key === key)
    if (!mod) return null
    const Comp = mod.Component
    return <Comp {...props} />
  }, [modules, enabledModules])

  return (
    <>
      <PortalHeaderBar />

      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-xl font-bold mb-4">B首頁</h1>

        {user && (
          <div className="border rounded p-4 bg-white shadow">
            <p>這裡可以顯示你要的內容</p>
          </div>
        )}

        {/*   直接顯示組件，不依賴模組系統 */}
        {enabledModules.includes('banner') && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Banner 輪播</h2>
            <BannerCarousel banners={banners} />
          </div>
        )}
        {enabledModules.includes('marquee') && (
          <div>
            <h2 className="text-lg font-semibold mb-2">跑馬燈</h2>
            <Marquee marquees={marquees} />
          </div>
        )}

        {/* 浮動廣告 */}
        {floatingAds.map((ad, index) => {
          // 計算同位置的廣告索引
          const samePositionAds = floatingAds.filter(item => item.position === ad.position)
          const positionIndex = samePositionAds.findIndex(item => item.id === ad.id)
          
          // 根據位置和索引計算偏移
          const getOffset = () => {
            const spacing = 80 // 每個廣告間距 80px
            const offset = positionIndex * spacing
            
            if (ad.position.includes('bottom')) {
              return { bottom: `${20 + offset}px` }
            } else {
              return { top: `${20 + offset}px` }
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
