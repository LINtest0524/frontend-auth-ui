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

    const currentCompanyCode = pathname.split('/')[1] // a 或 b
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
          console.warn('⚠️ 公司代碼不符，強制清除登入資訊但保留模組設定')
          localStorage.removeItem('portalUser')
          localStorage.removeItem('portalToken')
          setUser(null)
          setHydrated(true)  // ⬅️ 這個很重要，不然會卡在「載入模組中」
          return
        }



      } catch (err) {
        console.warn('❌ 無法解析登入資料', err)
        localStorage.clear()
        router.replace(`/${currentCompanyCode}/login`)
        return
      }
    } else {
      // 沒登入 → 若不是公開頁，就導回 login
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
