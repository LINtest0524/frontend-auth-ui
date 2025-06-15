"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { User } from "@/types/user"

type SortKey = "id" | "created_at" | "last_login_at" | null
type SortDirection = "asc" | "desc" | null

const statusMap: Record<string, string> = {
  ACTIVE: "啟用",
  INACTIVE: "停用",
  BANNED: "封鎖",
}

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const searchParams = useSearchParams()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const isoDate = oneDayAgo.toISOString()
      const token = localStorage.getItem("token")

      const res = await fetch(
        `http://localhost:3001/user?from=${encodeURIComponent(isoDate)}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error("Fetch failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [limit])

  const getDeviceType = (userAgent?: string) => {
    if (!userAgent) return "-"
    return userAgent.toLowerCase().includes("mobile") ? "手機" : "電腦"
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection("desc")
    } else {
      if (sortDirection === "desc") setSortDirection("asc")
      else if (sortDirection === "asc") {
        setSortDirection(null)
        setSortKey(null)
      } else setSortDirection("desc")
    }
  }

  const getArrow = (key: SortKey) => {
    const isActive = sortKey === key
    const dir = isActive ? sortDirection : null
    return (
      <span
        className={`ml-1 text-xs ${isActive ? "text-black" : "text-gray-400"}`}
      >
        {dir === "asc" && "↑"}
        {dir === "desc" && "↓"}
        {!dir && "⇅"}
      </span>
    )
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0
    const getValue = (user: User) => {
      if (sortKey === "last_login_at" || sortKey === "created_at") {
        return user[sortKey] ? new Date(user[sortKey] as string).getTime() : 0
      }
      return (user[sortKey] as number) ?? 0
    }
    const aVal = getValue(a)
    const bVal = getValue(b)
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal
  })

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const token = localStorage.getItem("token")
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    await fetch(`http://localhost:3001/user/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchUsers()
  }

  const handleToggleBlacklist = async (userId: number, current: boolean) => {
    const token = localStorage.getItem("token")
    await fetch(`http://localhost:3001/user/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_blacklisted: !current }),
    })
    fetchUsers()
  }

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
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="border p-2 cursor-pointer" onClick={() => toggleSort("id")}>ID{getArrow("id")}</th>
              <th className="border p-2">帳號</th>
              <th className="border p-2">Email</th>
              <th className="border p-2 cursor-pointer" onClick={() => toggleSort("created_at")}>註冊時間{getArrow("created_at")}</th>
              <th className="border p-2">登入 IP</th>
              <th className="border p-2">登入平台</th>
              <th className="border p-2 cursor-pointer" onClick={() => toggleSort("last_login_at")}>登入時間{getArrow("last_login_at")}</th>
              <th className="border p-2">狀態</th>
              <th className="border p-2">黑名單</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id} className="text-center">
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.username}</td>
                <td className="border p-2">{user.email || "-"}</td>
                <td className="border p-2">{user.created_at ? new Date(user.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                <td className="border p-2">{user.last_login_ip || "-"}</td>
                <td className="border p-2">{user.last_login_platform ? getDeviceType(user.last_login_platform) : "-"}</td>
                <td className="border p-2">{user.last_login_at ? new Date(user.last_login_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    className={`px-2 py-1 rounded text-white ${user.status === "ACTIVE" ? "bg-green-600 hover:bg-green-700" : "bg-blue-500 hover:bg-blue-600"}`}
                  >
                    {user.status === "ACTIVE" ? "啟用" : "停用"}
                  </button>
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleToggleBlacklist(user.id, user.is_blacklisted)}
                    className={`px-2 py-1 rounded text-white ${user.is_blacklisted ? "bg-red-600 hover:bg-red-700" : "bg-gray-500 hover:bg-gray-600"}`}
                  >
                    {user.is_blacklisted ? "是" : "否"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
