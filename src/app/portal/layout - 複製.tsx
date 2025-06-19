'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname, useRouter } from 'next/navigation'

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, setUser, logout } = useUserStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const match = pathname.match(/^\/portal\/([^/]+)/)
    const company = match?.[1] || 'default'
    const isLoginPage = pathname === `/portal/${company}/login`

    const token = localStorage.getItem('portalToken')
    const userData = localStorage.getItem('portalUser')

    if (isLoginPage) {
      // ✅ 登入頁，不處理
      setHydrated(true)
      return
    }

    if (!token || !userData) {
      // ✅ 沒登入：導回該公司登入頁
      logout()
      router.push(`/portal/${company}/login`)
      return
    }

    try {
      const parsed = JSON.parse(userData)
      setUser(parsed)

      if (parsed.enabledModules) {
        localStorage.setItem('enabledModules', JSON.stringify(parsed.enabledModules))
      }
    } catch (e) {
      console.warn('❌ 無法解析 user', e)
      logout()
      router.push(`/portal/${company}/login`)
      return
    }

    setHydrated(true)
  }, [pathname, setUser, logout, router])

  if (!hydrated) {
    return <div className="p-4 text-gray-500">載入模組中...</div>
  }

  return <>{children}</>
}
