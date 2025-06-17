// frontend/src/hooks/useEnabledModules.ts
import { useEffect, useState } from 'react'

export function useEnabledModules() {
  const [modules, setModules] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const raw = localStorage.getItem('enabledModules')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setModules(parsed)
      } catch (e) {
        console.warn('解析模組設定失敗:', e)
      }
    }
  }, [])

  return modules
}
