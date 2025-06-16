"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "🏠 Dashboard", href: "/dashboard" },
  { label: "👥 用戶管理", href: "/users" },
  { label: "🔧 模組設定", href: "/modules" },
  // ✅ 已經寫在右上角，不需要這裡登出
  // { label: "🚪 登出", href: "/logout" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [bannerOpen, setBannerOpen] = useState(false)

  return (
    <aside className="w-60 h-screen bg-gray-900 text-white p-6 overflow-y-auto">
      <nav className="flex flex-col gap-4">

        {/* 導覽項目 */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-left px-3 py-2 rounded hover:bg-gray-700",
              pathname?.startsWith(item.href) && "bg-gray-700"
            )}
          >
            {item.label}
          </Link>
        ))}

        {/* Banner 管理項目（可展開） */}
        <div>
          <button
            onClick={() => setBannerOpen(!bannerOpen)}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 bg-gray-800"
          >
            📁 Banner 管理
          </button>
          {bannerOpen && (
            <div className="ml-4 mt-2 flex flex-col gap-1">
              <Link
                href="/banner"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/banner" && "bg-gray-700"
                )}
              >
                📋 Banner 列表
              </Link>
              <Link
                href="/banner/new"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/banner/new" && "bg-gray-700"
                )}
              >
                ➤ 新增 Banner
              </Link>
            </div>
          )}
        </div>

      </nav>
    </aside>
  )
}
