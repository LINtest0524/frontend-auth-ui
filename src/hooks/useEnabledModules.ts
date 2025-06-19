import { useEffect, useState } from 'react'

export function useEnabledModules() {
  const [modules, setModules] = useState<string[]>([])

  useEffect(() => {
    const raw = localStorage.getItem('enabledModules')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setModules(parsed)
        }
      } catch (e) {
        console.warn('❌ enabledModules 無法解析：', e)
      }
    }
  }, [])

  return modules
}
