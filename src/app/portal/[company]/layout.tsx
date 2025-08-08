'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname } from 'next/navigation'

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  const { setUser } = useUserStore()
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // 從路徑獲取公司代碼 /portal/[company] -> company
    const segments = pathname.split('/')
    const companyCode = segments[2] || 'default' // /portal/a -> 'a'
    
    const token = localStorage.getItem(`portalToken_${companyCode}`)
    const userData = localStorage.getItem(`portalUser_${companyCode}`)

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)

        if (parsed.enabledModules) {
          localStorage.setItem(`enabledModules_${companyCode}`, JSON.stringify(parsed.enabledModules))
        }
      } catch (err) {
        console.warn('❌ 無法解析 user 資料', err)
      }
    }

    setHydrated(true)
  }, [pathname, setUser])

  if (!hydrated) return <div className="p-4 text-gray-500">載入模組中...</div>

  return (
    <div>
      {/* 主畫面 */}
      <div>{children}</div>
    </div>
  )
}
