"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "🏠 Dashboard", href: "/dashboard" },
  { label: "👥 用戶管理", href: "/users" },
  { label: "🔧 模組設定", href: "/modules" },
  { label: "🚪 登出", href: "/logout" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 h-screen bg-gray-900 text-white p-6">
      <nav className="flex flex-col gap-4">
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
      </nav>
    </aside>
  )
}
