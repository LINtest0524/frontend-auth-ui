"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()
  const [bannerOpen, setBannerOpen] = useState(false)
  const [marqueeOpen, setMarqueeOpen] = useState(false)

  return (
    <aside className="w-60 h-screen bg-gray-900 text-white p-6 overflow-y-auto">
      <nav className="flex flex-col gap-4">
        
        <Link
          href="/dashboard"
          className={cn(
            "text-left px-3 py-2 rounded hover:bg-gray-700",
            pathname === "/dashboard" && "bg-gray-700"
          )}
        >
          🏠 Dashboard
        </Link>

        <Link
          href="/users"
          className={cn(
            "text-left px-3 py-2 rounded hover:bg-gray-700",
            pathname === "/users" && "bg-gray-700"
          )}
        >
          👥 用戶管理
        </Link>

        {/* ✅ 新增模組設定連結 */}
        <Link
          href="/admin/module"
          className={cn(
            "text-left px-3 py-2 rounded hover:bg-gray-700",
            pathname?.startsWith("/admin/module") &&
              !pathname.includes("/marquee") &&
              "bg-gray-700"
          )}
        >
          🔧 模組設定
        </Link>

        {/* Banner 管理項目 */}
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
                href="/admin/banner"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/banner" && "bg-gray-700"
                )}
              >
                📋 Banner 列表
              </Link>
              <Link
                href="/admin/banner/new"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/admin/banner/new" && "bg-gray-700"
                )}
              >
                ➤ 新增 Banner
              </Link>
            </div>
          )}
        </div>

        {/* Marquee 管理項目 */}
        <div>
          <button
            onClick={() => setMarqueeOpen(!marqueeOpen)}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 bg-gray-800"
          >
            📺 跑馬燈管理
          </button>
          {marqueeOpen && (
            <div className="ml-4 mt-2 flex flex-col gap-1">
              <Link
                href="/admin/marquee"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/admin/marquee" && "bg-gray-700"
                )}
              >
                📋 跑馬燈列表
              </Link>
              <Link
                href="/admin/marquee/new"
                className={cn(
                  "text-sm px-3 py-2 rounded hover:bg-gray-700",
                  pathname === "/admin/marquee/new" && "bg-gray-700"
                )}
              >
                ➤ 新增內容
              </Link>
            </div>
          )}
        </div>


      </nav>
    </aside>
  )
}
