'use client'

import { useUserStore } from '@/hooks/use-user-store'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'

type ModuleConfig = {
  key: string
  Component: any
  position: 'top' | 'bottom'
}

// ✅ 加上這段 → 定義 User 型別，讓 TS 知道有 enabledModules
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
      Component: Marquee,
      position: 'top',
    },
  }

  return Array.from(new Set(user.enabledModules)) // ✅ 避免重複 key
  .map((key: string) => configs[key])
  .filter(Boolean)

}
