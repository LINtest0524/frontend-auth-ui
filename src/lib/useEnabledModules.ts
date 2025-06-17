'use client'

import { useEffect, useState } from 'react'
import { moduleRegistry } from './moduleRegistry'

export function useEnabledModules() {
  const [modules, setModules] = useState<typeof moduleRegistry>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = localStorage.getItem('enabledModules')
    const enabled = raw ? JSON.parse(raw) : {}

    const activeModules = moduleRegistry.filter((m) => enabled[m.key])
    setModules(activeModules)
  }, [])

  return modules
}
