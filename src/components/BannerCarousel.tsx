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

type Props = {
  banners: Banner[]
}

export default function BannerCarousel({ banners }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const now = new Date()
  const activeBanners = banners.filter((b) =>
    b.status === 'ACTIVE' &&
    new Date(b.start_time) <= now &&
    new Date(b.end_time) >= now
  )

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

  return (
    <Swiper
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000 }}
      loop
      modules={[Pagination, Autoplay]}
      className="w-full"
    >
      {activeBanners.map((b) => (
        <SwiperSlide key={b.id}>
          <img
            src={getImageUrl(isMobile ? b.mobile_image_url : b.desktop_image_url)}
            alt={b.title}
            className="w-full object-cover max-h-[400px] rounded"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
