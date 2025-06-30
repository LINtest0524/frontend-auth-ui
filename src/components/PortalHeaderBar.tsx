'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PortalHeaderBar() {
  const { user, setUser } = useUserStore()
  const company = useCompanySlug() // ✅ 這行取得公司代碼
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    <div className="w-full bg-gray-100 py-2 px-4 text-sm flex justify-end gap-4 items-center">
      {!user ? (
        <>
          <a href={`/${company}/login`} className="text-blue-600 hover:underline">登入</a>
          <a href={`/${company}/register`} className="text-blue-600 hover:underline">註冊</a>
        </>
      ) : (
        <>
          <button onClick={handleGoToMember} className="hover:underline text-gray-700" title="查看會員中心">
            👤 {user.username}
          </button>
          <button onClick={handleLogout} className="text-red-600 hover:underline">登出</button>
        </>
      )}
    </div>
  )
}
