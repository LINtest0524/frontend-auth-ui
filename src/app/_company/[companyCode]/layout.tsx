'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { useCompanyConfig } from '@/hooks/useCompanyConfig'
import FloatingAds from '@/components/FloatingAds'
import PopupAnnouncement from '@/components/PopupAnnouncement'
import FloatingCustomerService from '@/components/FloatingCustomerService'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import { setupCompanyDynamicAuthInterceptor } from '@/lib/authInterceptor'

export default function UnifiedCompanyLayout({ children }: { children: React.ReactNode }) {
  const { setUser, user } = useUserStore()
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const [hydrated, setHydrated] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  
  // 🚀 獲取公司配置
  const companyCode = params.companyCode as string
  const { config, loading: configLoading, error: configError } = useCompanyConfig(companyCode)

  useEffect(() => {
    
    if (!companyCode) {
      console.error('[UnifiedLayout] 缺少公司代碼，重導向首頁')
      router.replace('/')
      return
    }

    // Setup auth interceptor for automatic session invalidation handling
    // 暫時禁用自動攔截器進行測試
    // setupCompanyDynamicAuthInterceptor(companyCode)
    
    const token = localStorage.getItem(`portalToken_${companyCode}`)
    const userData = localStorage.getItem(`portalUser_${companyCode}`)
    
    // 生成或獲取 sessionId
    let currentSessionId = localStorage.getItem(`sessionId_${companyCode}`)
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(`sessionId_${companyCode}`, currentSessionId)
    }
    setSessionId(currentSessionId)

    // 🎯 根據實際路徑處理公開路徑 (考慮到路由重寫)
    const actualPath = pathname.replace(`/_company/${companyCode}`, `/${companyCode}`)
    
    const publicPaths = [
      `/${companyCode}`, 
      `/${companyCode}/login`, 
      `/${companyCode}/register`,
      `/${companyCode}/duplicate-login`,
      `/${companyCode}/news`,
      `/${companyCode}/articles`,
      `/${companyCode}/products`,
      `/${companyCode}/promotions`
    ]
    
    // 檢查是否為公開頁面
    const isNewsPage = actualPath.startsWith(`/${companyCode}/news`)
    const isArticlePage = actualPath.startsWith(`/${companyCode}/articles`)
    const isProductPage = actualPath.startsWith(`/${companyCode}/products`)
    const isPromotionPage = actualPath.startsWith(`/${companyCode}/promotions`)
    const isPublicPage = publicPaths.includes(actualPath) || isNewsPage || isArticlePage || isProductPage || isPromotionPage

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        // 用戶資料解析成功
        setUser(parsed)

        if (parsed.enabledModules) {
          localStorage.setItem(`enabledModules_${companyCode}`, JSON.stringify(parsed.enabledModules))
        }
        
      } catch (err) {
        // 記錄詳細錯誤資訊
        console.error('❌ [UnifiedLayout] 用戶資料解析失敗:', {
          companyCode: companyCode,
          error: err,
          userData: userData,
          token: token?.substring(0, 20) + '...'
        })
        
        // 檢查是否為剛登入（5秒內），如果是則不清除資料
        const tokenCreatedTime = localStorage.getItem(`tokenCreatedTime_${companyCode}`)
        if (tokenCreatedTime) {
          const timeDiff = Date.now() - parseInt(tokenCreatedTime)
          if (timeDiff < 5000) { // 5秒內
            setHydrated(true)
            return
          }
        }
        
        // 無法解析登入資料，清除並重導向
        localStorage.removeItem(`portalToken_${companyCode}`)
        localStorage.removeItem(`portalUser_${companyCode}`)
        localStorage.removeItem(`enabledModules_${companyCode}`)
        router.replace(`/${companyCode}/login`)
        return
      }
    } else {
      // 未登入：清除殘留模組資料，然後打 API 抓回正確值
      localStorage.removeItem(`enabledModules_${companyCode}`)

      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=${companyCode}`)
        .then((res) => res.json())
        .then((enabled: string[]) => {
          localStorage.setItem(`enabledModules_${companyCode}`, JSON.stringify(enabled))
        })
        .catch((err) => {
          console.warn(`[UnifiedLayout] 載入模組失敗: ${companyCode}`, err)
        })

      if (!isPublicPage) {
        router.replace(`/${companyCode}/login`)
        return
      }
    }

    setHydrated(true)
  }, [pathname, setUser, router, companyCode])

  // 等待 hydration 和配置載入
  if (!hydrated || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {!hydrated ? '初始化中...' : '載入配置中...'}
          </p>
        </div>
      </div>
    )
  }

  // 配置載入錯誤
  if (configError) {
    console.error('[UnifiedLayout] 配置載入錯誤:', configError)
  }

  // 檢查是否為登入或註冊頁面，這些頁面不需要顯示 Header
  const actualPath = pathname.replace(`/_company/${companyCode}`, `/${companyCode}`)
  const isLoginPage = actualPath === `/${companyCode}/login`
  const isRegisterPage = actualPath === `/${companyCode}/register`
  const shouldShowHeader = !isLoginPage && !isRegisterPage


  return (
    <div 
      className="unified-company-layout"
      data-company={companyCode}
      data-theme={config?.branding?.theme || 'default'}
      style={{
        // 🎨 根據配置動態設定 CSS 變數
        '--primary-color': config?.branding?.primaryColor || '#1a202c',
        '--secondary-color': config?.branding?.secondaryColor || '#2d3748',
        '--accent-color': config?.branding?.accentColor || '#f6e05e',
      } as React.CSSProperties}
    >
      {shouldShowHeader && (
        <PortalHeaderBar 
          companyCode={companyCode} 
          key={companyCode}
          config={config}
        />
      )}
      <main className="main-content">
        {children}
      </main>
      
      {/* 🎯 根據配置顯示組件 */}
      {config?.modules?.optional?.promotions?.enabled && (
        <FloatingAds companyCode={companyCode} />
      )}
      
      <PopupAnnouncement companyCode={companyCode} />
      
      {config?.modules?.optional?.liveChat?.enabled && (
        <FloatingCustomerService companyCode={companyCode} />
      )}
    </div>
  )
}