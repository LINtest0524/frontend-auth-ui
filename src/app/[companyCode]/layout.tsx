'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname, useRouter, useParams } from 'next/navigation'
import FloatingAds from '@/components/FloatingAds'
import PopupAnnouncement from '@/components/PopupAnnouncement'
import FloatingCustomerService from '@/components/FloatingCustomerService'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import { setupCompanyDynamicAuthInterceptor } from '@/lib/authInterceptor'

export default function DynamicCompanyPortalLayout({ children }: { children: React.ReactNode }) {
  const { setUser, user } = useUserStore()
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const [hydrated, setHydrated] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // 從動態路由獲取公司代碼
    const currentCompanyCode = params.companyCode as string
    
    if (!currentCompanyCode) {
      router.replace('/')
      return
    }

    // Setup auth interceptor for automatic session invalidation handling
    // 暫時禁用自動攔截器進行測試
    // setupCompanyDynamicAuthInterceptor(currentCompanyCode)
    
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
    
    // 檢查是否為公開頁面
    const isNewsPage = pathname.startsWith(`/${currentCompanyCode}/news`)
    const isArticlePage = pathname.startsWith(`/${currentCompanyCode}/articles`)
    const isProductPage = pathname.startsWith(`/${currentCompanyCode}/products`)
    const isPromotionPage = pathname.startsWith(`/${currentCompanyCode}/promotions`)
    const isPublicPage = publicPaths.includes(pathname) || isNewsPage || isArticlePage || isProductPage || isPromotionPage

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        // 用戶資料解析成功
        setUser(parsed)

        if (parsed.enabledModules) {
          localStorage.setItem(`enabledModules_${currentCompanyCode}`, JSON.stringify(parsed.enabledModules))
        }
      } catch (err) {
        // 記錄詳細錯誤資訊
        console.error('❌ [Layout] Failed to parse user data:', {
          companyCode: currentCompanyCode,
          error: err,
          userData: userData,
          token: token?.substring(0, 20) + '...'
        })
        
        // 檢查是否為剛登入（5秒內），如果是則不清除資料
        const tokenCreatedTime = localStorage.getItem(`tokenCreatedTime_${currentCompanyCode}`)
        if (tokenCreatedTime) {
          const timeDiff = Date.now() - parseInt(tokenCreatedTime)
          if (timeDiff < 5000) { // 5秒內
            console.log('⏰ [Layout] Recent login detected, skipping data cleanup')
            setHydrated(true)
            return
          }
        }
        
        // 無法解析登入資料，清除並重導向
        console.log('🧹 [Layout] Cleaning up invalid auth data')
        localStorage.removeItem(`portalToken_${currentCompanyCode}`)
        localStorage.removeItem(`portalUser_${currentCompanyCode}`)
        localStorage.removeItem(`enabledModules_${currentCompanyCode}`)
        router.replace(`/${currentCompanyCode}/login`)
        return
      }
    } else {
      // 未登入：清除殘留模組資料，然後打 API 抓回正確值
      localStorage.removeItem(`enabledModules_${currentCompanyCode}`)

      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=${currentCompanyCode}`)
        .then((res) => res.json())
        .then((enabled: string[]) => {
          localStorage.setItem(`enabledModules_${currentCompanyCode}`, JSON.stringify(enabled))
        })
        .catch((err) => {
          console.warn(`Failed to fetch modules for company: ${currentCompanyCode}`, err)
        })

      if (!isPublicPage) {
        router.replace(`/${currentCompanyCode}/login`)
        return
      }
    }

    setHydrated(true)
  }, [pathname, setUser, router, params.companyCode])

  if (!hydrated) return <div className="p-4 text-gray-500">載入模組中...</div>

  // 檢查是否為登入或註冊頁面，這些頁面不需要顯示 Header
  const currentCompanyCode = params.companyCode as string
  const isLoginPage = pathname === `/${currentCompanyCode}/login`
  const isRegisterPage = pathname === `/${currentCompanyCode}/register`
  const shouldShowHeader = !isLoginPage && !isRegisterPage

  return (
    <div className="dynamic-company-layout">
      {shouldShowHeader && <PortalHeaderBar companyCode={currentCompanyCode} key={currentCompanyCode} />}
      <main className="main-content">
        {children}
      </main>
      <FloatingAds companyCode={currentCompanyCode} />
      <PopupAnnouncement companyCode={currentCompanyCode} />
      <FloatingCustomerService companyCode={currentCompanyCode} />
    </div>
  )
}