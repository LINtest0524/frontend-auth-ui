'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('portalToken')
    setIsLoggedIn(!!token)
  }, [refreshKey]) // ✅ 每次 refreshKey 改變，就重新檢查 token

  const handleLogout = () => {
    localStorage.removeItem('portalToken')
    setRefreshKey((prev) => prev + 1) // ✅ 觸發 layout 重新渲染
    router.push('/portal/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between items-center bg-gray-100 px-4 py-2 shadow">
        <h1 className="text-lg font-semibold">會員中心</h1>

        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            登出
          </button>
        )}
      </header>

      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
