"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

interface User {
  id: number
  username: string
  email: string
  created_at: string
  status: string
}

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log("✅ useEffect triggered")  
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const isoDate = oneDayAgo.toISOString()

        const token = localStorage.getItem("token")

        console.log("🔑 token 是：", token) // ✅ 新增
      console.log("📡 API URL：", `http://localhost:3001/user?from=${isoDate}&limit=${limit}`) // ✅ 新增

        const res = await fetch(
          `http://localhost:3001/user?from=${encodeURIComponent(isoDate)}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!res.ok) {
          throw new Error("無法取得使用者資料：" + res.status)
        }

        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.error("Fetch failed", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [limit])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">👥 使用者列表</h1>

      <div className="mb-4 flex items-center gap-2">
        <label>每頁顯示筆數：</label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border rounded px-2 py-1 w-20"
        />
        <span className="text-sm text-gray-500">預設查詢近 1 日內新增會員</span>
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">ID</th>
              <th className="border p-2">帳號</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">註冊時間</th>
              <th className="border p-2">狀態</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(users) && users.map((user) => (
              <tr key={user.id} className="text-sm text-center">
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.username}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.created_at}</td>
                <td className="border p-2">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
