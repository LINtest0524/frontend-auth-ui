'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname, useRouter } from 'next/navigation'
import FloatingAds from '@/components/FloatingAds'
import PopupAnnouncement from '@/components/PopupAnnouncement'

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  const { setUser, user } = useUserStore()
  const pathname = usePathname()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    const currentCompanyCode = pathname.split('/')[1]
    const token = localStorage.getItem(`portalToken_${currentCompanyCode}`)
    const userData = localStorage.getItem(`portalUser_${currentCompanyCode}`)
    
    // 生成或獲取 sessionId
    let currentSessionId = localStorage.getItem(`sessionId_${currentCompanyCode}`)
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(`sessionId_${currentCompanyCode}`, currentSessionId)
    }
    setSessionId(currentSessionId)

    const publicPaths = [
      `/${currentCompanyCode}`, 
      `/${currentCompanyCode}/login`, 
      `/${currentCompanyCode}/register`,
      `/${currentCompanyCode}/news`,
      `/${currentCompanyCode}/articles`
    ]
    
    // 檢查是否為新聞相關頁面（包含新聞詳細頁面）
    const isNewsPage = pathname.startsWith(`/${currentCompanyCode}/news`)
    // 檢查是否為文章相關頁面（包含文章詳細頁面）
    const isArticlePage = pathname.startsWith(`/${currentCompanyCode}/articles`)
    const isPublicPage = publicPaths.includes(pathname) || isNewsPage || isArticlePage

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)

        if (parsed.enabledModules) {
          localStorage.setItem(`enabledModules_${currentCompanyCode}`, JSON.stringify(parsed.enabledModules))
        }

        // 不再需要檢查公司代碼，因為已經用公司代碼作為鍵名前綴
      } catch (err) {
        console.warn('    無法解析登入資料', err)
        localStorage.removeItem(`portalToken_${currentCompanyCode}`)
        localStorage.removeItem(`portalUser_${currentCompanyCode}`)
        localStorage.removeItem(`enabledModules_${currentCompanyCode}`)
        router.replace(`/${currentCompanyCode}/login`)
        return
      }
    } else {
      //   未登入：清除殘留模組資料，然後打 API 抓回正確值
      localStorage.removeItem(`enabledModules_${currentCompanyCode}`)

      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=${currentCompanyCode}`)
        .then((res) => res.json())
        .then((enabled: string[]) => {
          localStorage.setItem(`enabledModules_${currentCompanyCode}`, JSON.stringify(enabled))
        })

      if (!isPublicPage) {
        router.replace(`/${currentCompanyCode}/login`)
        return
      }
    }

    setHydrated(true)
  }, [pathname, setUser, router])

  if (!hydrated) return <div className="p-4 text-gray-500">載入模組中...</div>

  return (
    <>
      {children}
      <FloatingAds companyCode="b" />
      <PopupAnnouncement companyCode="b" />
    </>
  )
}
