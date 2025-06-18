// ✅ src/components/topbar.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Topbar() {
  const router = useRouter()
  const [username, setUsername] = useState("")

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

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <div className="flex justify-end items-center bg-gray-100 px-4 py-2 border-b">
      <span className="mr-4 text-sm text-gray-600">{username}</span>
      <button
        onClick={handleLogout}
        className="text-red-600 text-sm border border-red-600 px-2 py-1 rounded hover:bg-red-50"
      >
        登出
      </button>
    </div>
  )
}
