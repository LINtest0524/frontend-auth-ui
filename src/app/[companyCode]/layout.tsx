'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { useAgentContext } from '@/hooks/useAgentContext'
import { useCompanyConfig } from '@/hooks/useCompanyConfig'
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
  const { getLinkWithAgent } = useAgentContext()
  const [hydrated, setHydrated] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  
  // 🚀 整合配置系統
  const companyCode = params.companyCode as string
  const { config, loading: configLoading, error: configError } = useCompanyConfig(companyCode)
  
  // 檢查是否來自代理商子網域
  const [agentCode, setAgentCode] = useState<string | null>(null)
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const agentParam = urlParams.get('agent')
    setAgentCode(agentParam)
  }, [pathname])

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
    
    // 檢查是否為代理商子網域頁面 (格式: /a/subdomain 或 /b/subdomain)
    const agentSubdomainPattern = new RegExp(`^/${currentCompanyCode}/[a-zA-Z0-9_-]+(/.*)?$`)
    const isAgentSubdomainPage = agentSubdomainPattern.test(pathname)
    
    const isPublicPage = publicPaths.includes(pathname) || isNewsPage || isArticlePage || isProductPage || isPromotionPage || isAgentSubdomainPage

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
        // 直接從當前 URL 獲取代理商參數
        const currentSearch = window.location.search
        const loginUrl = `/${currentCompanyCode}/login${currentSearch}`
        window.location.replace(loginUrl)
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
        // 直接從當前 URL 獲取代理商參數
        const currentSearch = window.location.search
        const loginUrl = `/${currentCompanyCode}/login${currentSearch}`
        window.location.replace(loginUrl)
        return
      }
    }

    setHydrated(true)
  }, [pathname, setUser, router, params.companyCode])

  // 等待 hydration 和配置載入
  if (!hydrated || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {!hydrated ? '初始化中...' : '載入配置中...'}
          </p>
          {configError && (
            <p className="mt-1 text-red-500 text-sm">
              配置載入失敗: {configError}
            </p>
          )}
        </div>
      </div>
    )
  }

  // 檢查是否為登入或註冊頁面，這些頁面不需要顯示 Header
  const currentCompanyCode = params.companyCode as string
  const isLoginPage = pathname === `/${currentCompanyCode}/login`
  const isRegisterPage = pathname === `/${currentCompanyCode}/register`
  const shouldShowHeader = !isLoginPage && !isRegisterPage

  console.log(`[Layout] 渲染配置化佈局:`, {
    companyCode: currentCompanyCode,
    configLoaded: !!config,
    theme: config?.branding?.theme,
    useNewArchitecture: config?.system?.useNewArchitecture
  })

  return (
    <div 
      className="dynamic-company-layout"
      data-company={currentCompanyCode}
      data-theme={config?.branding?.theme || 'default'}
      data-new-architecture={config?.system?.useNewArchitecture || false}
      style={{
        // 🎨 根據配置動態設定 CSS 變數
        '--primary-color': config?.branding?.primaryColor || '#1a202c',
        '--secondary-color': config?.branding?.secondaryColor || '#2d3748',
        '--accent-color': config?.branding?.accentColor || '#f6e05e',
        '--layout-type': config?.layout?.type || 'standard',
        // 為代理商標識條添加頂部間距
        ...(agentCode && { paddingTop: '28px' })
      } as React.CSSProperties}
    >
      {/* 代理商標識條 */}
      {agentCode && (
        <div style={{ 
          backgroundColor: '#007bff', 
          color: 'white',
          padding: '4px 10px', 
          fontSize: '12px',
          textAlign: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          🏢 {agentCode} 代理商專屬頁面
        </div>
      )}

      {/* 🎯 配置系統狀態指示器 */}
      {config && (
        <div className="fixed top-0 right-0 z-50 bg-green-500 text-white px-3 py-1 text-xs"
             style={{ top: agentCode ? '28px' : '0px' }}>
          ✅ {currentCompanyCode.toUpperCase()} | {config.branding.theme} | 
          {config.system.useNewArchitecture ? '新架構' : '舊架構'}
        </div>
      )}
      
      {shouldShowHeader && (
        <PortalHeaderBar 
          companyCode={currentCompanyCode} 
          config={config}
          key={currentCompanyCode} 
        />
      )}
      
      <main className="main-content">
        {children}
      </main>
      
      {/* 🎯 根據配置條件渲染組件 */}
      {config?.modules?.optional?.promotions?.enabled && (
        <FloatingAds companyCode={currentCompanyCode} />
      )}
      
      <PopupAnnouncement companyCode={currentCompanyCode} />
      
      {config?.modules?.optional?.liveChat?.enabled && (
        <FloatingCustomerService companyCode={currentCompanyCode} />
      )}
      
      {/* 🎵 音效系統 */}
      {config?.modules?.optional?.soundEffects?.enabled && (
        <div id="sound-system" data-volume={config.modules.optional.soundEffects.volume}>
          {/* 音效系統將在這裡初始化 */}
        </div>
      )}
    </div>
  )
}