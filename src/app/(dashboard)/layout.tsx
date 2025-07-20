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
    <div className="bigbox">

      <Sidebar />


      <div className="b-right-box">


          {username ? (
            <div className="content-tabs">
              <span className="b-username">{username}</span>
              <button
                onClick={handleLogout}
              >
                登出
              </button>
            </div>
          ) : (
            <span className="">未登入</span>
          )}
      

        {/* 下方區域：頁面內容 */}
        <div className="b-right-bottom-box">
          {children}
        </div>



      </div>

    </div>
  )
}
