'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname, useRouter } from 'next/navigation'

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  const { setUser } = useUserStore()
  const pathname = usePathname()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('portalToken')
    const userData = localStorage.getItem('portalUser')

    const currentCompanyCode = pathname.split('/')[1]
    const publicPaths = [`/${currentCompanyCode}`, `/${currentCompanyCode}/login`, `/${currentCompanyCode}/register`]
    const isPublicPage = publicPaths.includes(pathname)

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)

        if (parsed.enabledModules) {
          localStorage.setItem('enabledModules', JSON.stringify(parsed.enabledModules))
        }

        const userCompanyCode = parsed?.company?.code
        if (userCompanyCode !== currentCompanyCode) {
          console.warn('⚠️ 公司代碼不符，強制清除登入資訊與模組設定')
          localStorage.removeItem('portalUser')
          localStorage.removeItem('portalToken')
          localStorage.removeItem('enabledModules')
          setUser(null)
          setHydrated(true)
          return
        }
      } catch (err) {
        console.warn('❌ 無法解析登入資料', err)
        localStorage.clear()
        router.replace(`/${currentCompanyCode}/login`)
        return
      }
    } else {
      // ✅ 未登入：清除殘留模組資料，然後打 API 抓回正確值
      localStorage.removeItem('enabledModules')

      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=${currentCompanyCode}`)
        .then((res) => res.json())
        .then((enabled: string[]) => {
          localStorage.setItem('enabledModules', JSON.stringify(enabled))
        })

      if (!isPublicPage) {
        router.replace(`/${currentCompanyCode}/login`)
        return
      }
    }

    setHydrated(true)
  }, [pathname, setUser, router])

  if (!hydrated) return <div className="p-4 text-gray-500">載入模組中...</div>

  return <>{children}</>
}
