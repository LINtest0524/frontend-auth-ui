// frontend/src/app/(dashboard)/layout.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) return
    try {
      const user = JSON.parse(stored)
      setUsername(user?.username || null)
    } catch (e) {
      console.error('解析登入者失敗', e)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* 頂部：登入者資訊 */}
        <div className="flex justify-end items-center bg-gray-100 px-6 py-3 text-sm text-gray-800 border-b">
          {username ? (
            <div className="flex items-center gap-4">
              <span className="font-medium">{username}</span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline"
              >
                登出
              </button>
            </div>
          ) : (
            <span className="text-gray-400">未登入</span>
          )}
        </div>

        {/* 下方區域：頁面內容 */}
        <div className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}
