'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import { useCompanyConfig } from '@/hooks/useCompanyConfig'
import 'swiper/css'
import 'swiper/css/pagination'
import '@/styles/components/banner-carousel.css'




type Banner = {
  id: number
  title: string
  desktop_image_url: string
  mobile_image_url: string
  start_time: string
  end_time: string
  status: string
}

type Props = {
  banners: Banner[]
  companyCode?: string
}

export default function BannerCarousel({ banners, companyCode }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  
  // 🚀 配置系統整合
  const { config } = useCompanyConfig(companyCode || 'default')

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 正確處理時區轉換問題
  const now = new Date()
  const nowTaiwanString = now.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }) // 格式: "YYYY-MM-DD HH:mm:ss"
  
  const activeBanners = banners.filter((b) => {
    if (b.status !== 'ACTIVE') return false
    
    // 正確處理 UTC 時間轉換為台灣時間
    const startTimeUtc = new Date(b.start_time)
    const endTimeUtc = new Date(b.end_time)
    
    // 轉換為台灣時間字串
    const startTimeTaiwan = startTimeUtc.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' })
    const endTimeTaiwan = endTimeUtc.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' })
    
    // 簡化 debug 資訊
    const isActive = startTimeTaiwan <= nowTaiwanString && endTimeTaiwan >= nowTaiwanString
    
    return isActive
  })

  const getImageUrl = (url: string) => {
    if (!url) return ''
    try {
      return new URL(url).href
    } catch {
      return `${process.env.NEXT_PUBLIC_API_BASE}${url}`
    }
  }

  if (activeBanners.length === 0) {
    return <div className="text-center p-4">目前沒有上架的 Banner</div>
  }

  // 🎨 根據配置決定輪播設定
  const getSwiperConfig = () => {
    const defaultConfig = {
      delay: 5000,
      showPagination: true,
      autoplay: true
    };

    // 從配置中獲取輪播設定 (未來可擴展)
    return {
      delay: defaultConfig.delay,
      showPagination: defaultConfig.showPagination,
      autoplay: defaultConfig.autoplay && activeBanners.length > 1
    };
  };

  const swiperConfig = getSwiperConfig();

  // 🎨 動態樣式
  const getCarouselStyle = () => {
    if (!config) return {};
    
    return {
      '--primary-color': config.branding.primaryColor,
      '--secondary-color': config.branding.secondaryColor,
      '--accent-color': config.branding.accentColor,
    } as React.CSSProperties;
  };

  return (
    <div 
      className="banner-carousel-container"
      style={getCarouselStyle()}
      data-theme={config?.branding?.theme || 'default'}
      data-company={companyCode}
    >
      <Swiper
        pagination={swiperConfig.showPagination ? { clickable: true } : false}
        autoplay={swiperConfig.autoplay ? { delay: swiperConfig.delay } : false}
        loop={activeBanners.length > 1}
        modules={[Pagination, Autoplay]}
        className="banner-swiper"
        style={{
          '--swiper-pagination-color': config?.branding?.primaryColor || '#667eea',
          '--swiper-pagination-bullet-inactive-color': 'rgba(255,255,255,0.5)',
        } as React.CSSProperties}
      >
        {activeBanners.map((b) => (
          <SwiperSlide key={b.id}>
            <div className="banner-slide">
              <img
                src={getImageUrl(isMobile ? b.mobile_image_url : b.desktop_image_url)}
                alt={b.title}
                className="banner-image"
                loading="lazy"
              />
              
              {/* 🚀 配置系統演示：顯示公司主題色彩的裝飾 */}
              {config && (
                <div 
                  className="banner-overlay"
                  style={{
                    background: `linear-gradient(45deg, ${config.branding.primaryColor}20, ${config.branding.secondaryColor}20)`,
                  }}
                >
                  <div className="banner-theme-indicator">
                    {config.companyInfo.name} | {config.branding.theme}
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
