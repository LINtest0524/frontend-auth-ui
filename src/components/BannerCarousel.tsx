'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

type Banner = {
  id: number;
  title: string;
  desktop_image_url: string;
  mobile_image_url: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Props = {
  banners: Banner[];
};

export default function BannerCarousel({ banners }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  const getImageUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return `${process.env.NEXT_PUBLIC_API_BASE}${url}`;
    }
  };

  const now = new Date();
  const activeBanners = banners.filter(
    (b) =>
      b.status === 'ACTIVE' &&
      new Date(b.start_time) <= now &&
      new Date(b.end_time) >= now
  );

  if (activeBanners.length === 0) {
    return <div className="text-center p-4">目前沒有上架的 Banner</div>;
  }

  return (
    <Swiper
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000 }}
      modules={[Pagination, Autoplay]}
      loop
      className="w-full"
    >
      {activeBanners.map((banner) => (
        <SwiperSlide key={banner.id}>
          <img
            src={getImageUrl(
              isMobile ? banner.mobile_image_url : banner.desktop_image_url
            )}
            alt={banner.title}
            className="w-full object-cover max-h-[400px] rounded"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
