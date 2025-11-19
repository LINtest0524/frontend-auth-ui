'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname, useRouter } from 'next/navigation'
import { useAgentContext } from '@/hooks/useAgentContext'
import FloatingAds from '@/components/FloatingAds'
import PopupAnnouncement from '@/components/PopupAnnouncement'
import FloatingCustomerService from '@/components/FloatingCustomerService'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import { setupCompanyAAuthInterceptor } from '@/lib/authInterceptor'

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  const { setUser, user } = useUserStore()
  const pathname = usePathname()
  const router = useRouter()
  const { getLinkWithAgent } = useAgentContext()
  const [hydrated, setHydrated] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // Setup auth interceptor for automatic session invalidation handling
    setupCompanyAAuthInterceptor()
    
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
      `/${currentCompanyCode}/duplicate-login`,
      `/${currentCompanyCode}/news`,
      `/${currentCompanyCode}/articles`,
      `/${currentCompanyCode}/products`,
      `/${currentCompanyCode}/promotions`
    ]
    
    // 檢查是否為新聞相關頁面（包含新聞詳細頁面）
    const isNewsPage = pathname.startsWith(`/${currentCompanyCode}/news`)
    // 檢查是否為文章相關頁面（包含文章詳細頁面）
    const isArticlePage = pathname.startsWith(`/${currentCompanyCode}/articles`)
    // 檢查是否為產品相關頁面（包含產品詳細頁面）
    const isProductPage = pathname.startsWith(`/${currentCompanyCode}/products`)
    // 檢查是否為優惠活動相關頁面（包含優惠活動詳細頁面）
    const isPromotionPage = pathname.startsWith(`/${currentCompanyCode}/promotions`)
    const isPublicPage = publicPaths.includes(pathname) || isNewsPage || isArticlePage || isProductPage || isPromotionPage

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)

        if (parsed.enabledModules) {
          localStorage.setItem(`enabledModules_${currentCompanyCode}`, JSON.stringify(parsed.enabledModules))
        }

        // 不再需要檢查公司代碼，因為已經用公司代碼作為鍵名前綴
      } catch (err) {
        // 無法解析登入資料，靜默處理
        localStorage.removeItem(`portalToken_${currentCompanyCode}`)
        localStorage.removeItem(`portalUser_${currentCompanyCode}`)
        localStorage.removeItem(`enabledModules_${currentCompanyCode}`)
        // 直接從當前 URL 獲取代理商參數
        const currentSearch = window.location.search
        const loginUrl = `/${currentCompanyCode}/login${currentSearch}`
        window.location.replace(loginUrl)
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
        // 直接從當前 URL 獲取代理商參數
        const currentSearch = window.location.search
        const loginUrl = `/${currentCompanyCode}/login${currentSearch}`
        window.location.replace(loginUrl)
        return
      }
    }

    setHydrated(true)
  }, [pathname, setUser, router])

  if (!hydrated) return null

  // 檢查是否為登入或註冊頁面，這些頁面不需要顯示 Header
  const currentCompanyCode = pathname.split('/')[1]
  const isLoginPage = pathname === `/${currentCompanyCode}/login`
  const isRegisterPage = pathname === `/${currentCompanyCode}/register`
  const shouldShowHeader = !isLoginPage && !isRegisterPage

  return (
    <>
      {shouldShowHeader && <PortalHeaderBar />}
      {children}
      <FloatingAds companyCode="a" />
      <PopupAnnouncement companyCode="a" />
      <FloatingCustomerService companyCode="a" />
    </>
  )
}
