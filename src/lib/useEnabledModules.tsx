import { FC } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'

type ModuleConfig = {
  key: string
  Component: FC<any>
  position: 'top' | 'bottom'
}

export function useEnabledModules(): ModuleConfig[] {
  const { user } = useUserStore()

  const configs: Record<string, ModuleConfig> = {
    banner: {
      key: 'banner',
      Component: BannerCarousel,
      position: 'top',
    },
    marquee: {
      key: 'marquee',
      Component: Marquee,
      position: 'top',
    },
  }

  const enabled = user?.enabledModules?.length
    ? user.enabledModules
    : ['banner', 'marquee'] // ✅ 未登入時的預設模組

  return Array.from(new Set(enabled))
    .map((key) => configs[key])
    .filter(Boolean)
}
