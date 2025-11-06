'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

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

interface FloatingAdsProps {
  companyCode: string
}

export default function FloatingAds({ companyCode }: FloatingAdsProps) {
  const [floatingAds, setFloatingAds] = useState<FloatingAd[]>([])
  const pathname = usePathname()

  // 檢查是否為登入或註冊頁面
  const isLoginOrRegisterPage = pathname?.includes('/login') || pathname?.includes('/register')

  // 🚀 動態路由網址處理函數
  const processDynamicUrl = (originalUrl: string): string => {
    // 如果是絕對網址（http/https），直接返回
    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return originalUrl
    }
    
    // 如果是相對路徑且以 / 開頭，組合動態路由
    if (originalUrl.startsWith('/') && !originalUrl.startsWith(`/${companyCode}`)) {
      // 移除開頭的 /，然後組合成動態路由格式
      const cleanPath = originalUrl.substring(1)
      return `/${companyCode}/${cleanPath}`
    }
    
    // 其他情況直接返回原網址
    return originalUrl
  }

  useEffect(() => {
    // 如果是登入或註冊頁面，不顯示浮動廣告
    if (isLoginOrRegisterPage) {
      setFloatingAds([])
      return
    }

    // 獲取浮動廣告資料
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/floating-ads?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setFloatingAds)
      .catch(() => setFloatingAds([]))
  }, [companyCode, isLoginOrRegisterPage])

  // 如果是登入或註冊頁面，不渲染任何內容
  if (isLoginOrRegisterPage) {
    return null
  }

  return (
    <>
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
            href={processDynamicUrl(ad.link_url)}
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
    </>
  )
}