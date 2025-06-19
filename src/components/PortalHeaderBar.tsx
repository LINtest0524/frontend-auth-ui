'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PortalHeaderBar() {
  const { user, setUser } = useUserStore()
  const { company } = useParams()
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
  }

  const handleGoToMember = () => {
    router.push(`/portal/${company}/member`)
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
          <button
            onClick={handleGoToMember}
            className="hover:underline text-gray-700"
            title="查看會員中心"
          >
            👤 {user.username}
          </button>
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
