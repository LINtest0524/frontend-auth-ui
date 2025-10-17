'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FacebookSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const companyCode = searchParams.get('company') || 'a' // 從 URL 參數獲取公司代碼

    // 從後端API安全地獲取Facebook登入資料
    const fetchLoginData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/facebook/get-login-data`, {
          method: 'GET',
          credentials: 'include', // 包含session cookie
        })
        
        const result = await response.json()
        
        if (result.success && result.data) {
          const { token, user, company } = result.data
          
          // 儲存到 localStorage (使用公司代碼前綴)
          const targetCompanyCode = company || user.company?.code || companyCode
          localStorage.setItem(`portalToken_${targetCompanyCode}`, token)
          localStorage.setItem(`portalUser_${targetCompanyCode}`, JSON.stringify(user))
          // 記錄登入時間，避免立即進行 token 驗證
          localStorage.setItem(`tokenCreatedTime_${targetCompanyCode}`, Date.now().toString())
          
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
        } else {
          // 登入資料獲取失敗
          router.push(`/${companyCode}/login?error=facebook_login_failed`)
        }
      } catch (error) {
        console.error('獲取Facebook登入資料失敗:', error)
        router.push(`/${companyCode}/login?error=facebook_login_failed`)
      }
    }

    fetchLoginData()
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