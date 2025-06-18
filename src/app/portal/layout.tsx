'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser, logout } = useUserStore()

  const isLoginPage = pathname.match(/^\/portal\/[^/]+\/login$/)

  useEffect(() => {
    const token = localStorage.getItem('portalToken')
    const userData = localStorage.getItem('portalUser')

    if (isLoginPage) return

    if (!token) {
      logout()
      return
    }

    if (token && userData && !user) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)
      } catch (e) {
        console.warn('❌ JSON parse failed', e)
      }
    }
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  )
}
