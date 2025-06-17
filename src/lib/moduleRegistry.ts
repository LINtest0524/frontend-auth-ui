import Marquee from '@/components/Marquee'
import BannerCarousel from '@/components/BannerCarousel'
import type { FC } from 'react'

interface ModuleDefinition {
  key: string
  Component: FC<any>
  position: 'top' | 'bottom' | 'custom'
}

export const moduleRegistry: ModuleDefinition[] = [
  {
    key: 'banner',
    Component: BannerCarousel,
    position: 'top',
  },
  {
    key: 'marquee',
    Component: Marquee,
    position: 'top',
  },
]
