'use client'

import { ReactNode, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useRouter, usePathname } from 'next/navigation'

export default function CompanyPortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser, logout } = useUserStore()

  useEffect(() => {
    const token = localStorage.getItem('portalToken')
    const userData = localStorage.getItem('portalUser')

    const match = pathname.match(/^\/portal\/([^/]+)/)
    const company = match?.[1] || 'default'

    if (!token) {
      logout()
      router.push(`/portal/${company}/login`)
      return
    }

    if (token && userData && !user) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)
        console.log('✅ user restored from localStorage', parsed)
      } catch (e) {
        console.warn('❌ 無法解析 user', e)
      }
    }
  }, [pathname, user, logout, setUser, router])

  return (
    <div>
      <main className="p-4">{children}</main>
    </div>
  )
}
