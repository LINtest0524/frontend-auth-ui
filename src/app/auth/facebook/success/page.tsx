'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FacebookSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        
        // 儲存到 localStorage (使用一致的命名)
        localStorage.setItem('portalToken', token)
        localStorage.setItem('portalUser', JSON.stringify(user))
        
        // 根據用戶角色重定向
        if (user.role === 'SUPER_ADMIN' || user.role === 'GLOBAL_ADMIN' || 
            user.role === 'AGENT_OWNER' || user.role === 'AGENT_SUPPORT') {
          router.push('/dashboard')
        } else {
          // 一般用戶重定向到對應的公司頁面
          const companyCode = user.company?.code || 'a'
          router.push(`/${companyCode}`)
        }
      } catch (error) {
        console.error('解析用戶資料失敗:', error)
        router.push('/login?error=facebook_login_failed')
      }
    } else {
      router.push('/login?error=facebook_login_failed')
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