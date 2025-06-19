'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PortalHeaderBar() {
  const { user, setUser } = useUserStore()
  const { company } = useParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    // ✅ 清除登入資訊
    localStorage.removeItem('portalUser')
    localStorage.removeItem('portalToken')
    localStorage.removeItem('enabledModules')
    setUser(null)

    // ✅ ❌ 不導頁！讓使用者停留在當前頁面
    // 如果你希望跳回首頁也可改成：
    // window.location.href = `/portal/${company}`
  }

  if (!mounted) return null

  return (
    <div className="w-full bg-gray-100 py-2 px-4 text-sm flex justify-end gap-4 items-center">
      {!user ? (
        <>
          <a
            href={`/portal/${company}/login`}
            className="text-blue-600 hover:underline"
          >
            登入
          </a>
          <a
            href={`/portal/${company}/register`}
            className="text-blue-600 hover:underline"
          >
            註冊
          </a>
        </>
      ) : (
        <>
          <span>👤 {user.username}</span>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline"
          >
            登出
          </button>
        </>
      )}
    </div>
  )
}
