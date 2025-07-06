import { useEffect, useState } from 'react'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'

interface EnabledModule {
  key: string
  Component: React.FC<any>
}

const moduleRegistry: Record<string, React.FC<any>> = {
  banner: BannerCarousel,
  marquee: Marquee,
}

export function useEnabledModules(): EnabledModule[] {
  const [modules, setModules] = useState<EnabledModule[]>([])

  const loadModulesFromStorage = () => {
    const raw = localStorage.getItem('enabledModules')
    try {
      const parsed: string[] = JSON.parse(raw || '[]')
      const result: EnabledModule[] = parsed
        .filter((key) => key in moduleRegistry)
        .map((key) => ({
          key,
          Component: moduleRegistry[key],
        }))
      setModules(result)
    } catch (err) {
      console.warn('❌ 模組格式錯誤:', err)
      setModules([])
    }
  }

  useEffect(() => {
    loadModulesFromStorage()

    const handler = () => loadModulesFromStorage()
    window.addEventListener('enabled-modules-updated', handler)

    return () => {
      window.removeEventListener('enabled-modules-updated', handler)
    }
  }, [])

  return modules
}
