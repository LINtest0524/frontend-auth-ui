'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import '../../src/app/a/styles/index.css';


export default function PortalHeaderBar() {
  const { user, setUser } = useUserStore()
  const company = useCompanySlug() // ✅ 這行取得公司代碼
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // 從 localStorage 恢復用戶狀態
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('portalUser')
      if (savedUser && !user) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
        } catch (error) {
          console.error('解析用戶資料失敗:', error)
          localStorage.removeItem('portalUser')
          localStorage.removeItem('portalToken')
        }
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('portalUser')
    localStorage.removeItem('portalToken')
    localStorage.removeItem('enabledModules')
    setUser(null)

    router.push(`/${company}`) // ✅ 登出後回到首頁
  }

  const handleGoToMember = () => {
    router.push(`/${company}/member`) // ✅ 點會員去會員中心
  }

  if (!mounted) return null

  return (
    <>
      <div className="header-box fo5">
          <h1>A首頁</h1>
        {!user ? (
          <div className="fl6">
            <a href={`/${company}/register`} className="f-btn-2">註冊</a>
            <a href={`/${company}/login`} className="f-btn-1">登入</a>
          </div>
        ) : (
          <div className="fl6">
            <button onClick={handleGoToMember} className="usernamebox" title="查看會員中心">
              {user.username}
            </button>
            <button onClick={handleLogout} className="f-btn-2">登出</button>
          </div>
        )}
      </div>
    </>
  )
}
