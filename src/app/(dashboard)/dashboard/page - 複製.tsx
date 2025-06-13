'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, logout } from '@/lib/useAuth'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.replace('/login')
    } else {
      setUser(u)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">🎉 歡迎 {user.username}！你是 {user.role}</h1>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-black text-white rounded shadow"
      >
        登出
      </button>
    </div>
  )
}
