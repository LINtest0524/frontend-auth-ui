'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FacebookSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')
    const companyCode = searchParams.get('company') // 從 URL 參數獲取公司代碼

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        
        // 儲存到 localStorage (使用公司代碼前綴)
        const targetCompanyCode = companyCode || user.company?.code || 'a'
        localStorage.setItem(`portalToken_${targetCompanyCode}`, token)
        localStorage.setItem(`portalUser_${targetCompanyCode}`, JSON.stringify(user))
        
        // 如果有enabledModules，也使用公司代碼前綴儲存
        if (user.enabledModules) {
          localStorage.setItem(`enabledModules_${targetCompanyCode}`, JSON.stringify(user.enabledModules))
        }
        
        // 根據用戶角色重定向
        if (user.role === 'SUPER_ADMIN' || user.role === 'GLOBAL_ADMIN' || 
            user.role === 'AGENT_OWNER' || user.role === 'AGENT_SUPPORT') {
          router.push('/dashboard')
        } else {
          // 一般用戶重定向到對應的公司頁面
          router.push(`/${targetCompanyCode}`)
        }
      } catch (error) {
        console.error('解析用戶資料失敗:', error)
        // 如果有公司代碼，重定向到對應的登入頁面
        const fallbackCompanyCode = companyCode || 'a'
        router.push(`/${fallbackCompanyCode}/login?error=facebook_login_failed`)
      }
    } else {
      // 如果有公司代碼，重定向到對應的登入頁面
      const fallbackCompanyCode = companyCode || 'a'
      router.push(`/${fallbackCompanyCode}/login?error=facebook_login_failed`)
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Facebook 登入處理中...</p>
      </div>
    </div>
  )
}