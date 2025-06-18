import { FC } from 'react'
import React from 'react'

import { useUserStore } from '@/hooks/use-user-store'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'

type ModuleConfig = {
  key: string
  Component: FC<any>  // ✅ 重點在這
  position: 'top' | 'bottom'
}

type User = {
  enabledModules?: string[]
}

export function useEnabledModules(): ModuleConfig[] {
  const { user } = useUserStore() as { user: User | null }

  if (!user?.enabledModules) return []

  const configs: Record<string, ModuleConfig> = {
    banner: {
      key: 'banner',
      Component: BannerCarousel,
      position: 'top',
    },
    marquee: {
      key: 'marquee',
      Component: () => {
        return <Marquee />
      },
      position: 'top',
    },
  }

  return Array.from(new Set(user.enabledModules))
    .map((key: string) => configs[key])
    .filter(Boolean)
}
