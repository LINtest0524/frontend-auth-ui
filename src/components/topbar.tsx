//   src/components/topbar.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Topbar() {
  const router = useRouter()
  const [username, setUsername] = useState("")
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

  return (
    <div className="flex justify-end items-center bg-gray-100 px-4 py-2 border-b">
      <span className="mr-4 text-sm text-gray-600">{username}</span>
      
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
