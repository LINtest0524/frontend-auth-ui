'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BannerCarousel from '@/components/BannerCarousel';

export default function PortalCompanyPage() {
  const { company } = useParams();
  const [banners, setBanners] = useState([]);
console.log('🚀 company param:', company);

  useEffect(() => {
    if (!company) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${company}`)
      .then(res => res.json())
      .then(data => setBanners(data))
      .catch(() => setBanners([]));
  }, [company]);

  return (
    <div className="container mx-auto p-6">
      <BannerCarousel banners={banners} />
    </div>
  );
}
