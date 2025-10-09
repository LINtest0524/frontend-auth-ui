//   src/components/topbar.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Topbar() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [balance, setBalance] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(() => {
    // 從 localStorage 讀取音效設定
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audioEnabled') === 'true'
    }
    return false
  })

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      try {
        const parsed = JSON.parse(user)
        setUsername(parsed.username)
        setBalance(parsed.balance || 0)
      } catch (err) {
        console.error("Failed to parse user from localStorage", err)
      }
    }
  }, [])

  const toggleAudio = () => {
    const newState = !audioEnabled
    setAudioEnabled(newState)
    localStorage.setItem('audioEnabled', newState.toString())
    console.log(`🔊 驗證通知音效已${newState ? '開啟' : '關閉'}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const handleRefreshBalance = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setBalance(userData.balance || 0)
        // 更新 localStorage 中的用戶資料
        const currentUser = localStorage.getItem("user")
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser)
          localStorage.setItem("user", JSON.stringify({ ...parsedUser, balance: userData.balance }))
        }
      }
    } catch (error) {
      console.error('刷新餘額失敗:', error)
    }
  }

  return (
    <div className="flex justify-end items-center bg-gray-100 px-4 py-2 border-b">
      <span className="mr-2 text-sm text-gray-600">{username}</span>
      <button 
        onClick={handleRefreshBalance}
        className="mr-4 px-2 py-1 bg-gray-200 border border-gray-300 rounded text-sm font-bold text-red-800 hover:bg-gray-300"
        title="點擊刷新餘額"
      >
        $ {balance.toLocaleString()}
      </button>
      
      {/* 音效開關 */}
      <div className="flex items-center mr-4">
        <span className="text-xs text-gray-500 mr-2">音效</span>
        <button
          onClick={toggleAudio}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            audioEnabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              audioEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-xs text-gray-500 ml-2">{audioEnabled ? 'ON' : 'OFF'}</span>
      </div>

      <button
        onClick={handleLogout}
        className="text-red-600 text-sm border border-red-600 px-2 py-1 rounded hover:bg-red-50"
      >
        登出
      </button>
    </div>
  )
}
