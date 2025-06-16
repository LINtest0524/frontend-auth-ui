'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

type Banner = {
  id: number
  title: string
  desktop_image_url: string
  mobile_image_url: string
  start_time: string
  end_time: string
  status: string
}

const API_BASE = 'http://localhost:3001'

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/banners`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error('無法取得 banner 資料')

        const data: Banner[] = await res.json()
        const active = data.filter(b => b.status === 'ACTIVE')
        setBanners(active)
      } catch (err) {
        console.error('Banner 載入失敗', err)
      }
    }

    const updateDevice = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    fetchBanners()
    updateDevice()
    window.addEventListener('resize', updateDevice)

    return () => window.removeEventListener('resize', updateDevice)
  }, [])

  const getImageUrl = (url: string) => {
    try {
        const parsed = new URL(url); // 是完整 URL 就直接用
        return parsed.href;
    } catch {
        return `${API_BASE}${url}`; // 是相對路徑才補主機
    }
    }



  if (banners.length === 0) {
    return <div className="text-center p-4">目前沒有上架的 Banner</div>
  }

  return (
    <Swiper
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000 }}
      modules={[Pagination, Autoplay]}
      loop
      className="w-full"
    >
      {banners.map(banner => (
        <SwiperSlide key={banner.id}>
          <img
            src={getImageUrl(isMobile ? banner.mobile_image_url : banner.desktop_image_url)}
            alt={banner.title}
            className="w-full object-cover max-h-[400px] rounded"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
