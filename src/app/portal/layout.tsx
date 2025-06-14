'use client'

import { useRouter } from 'next/navigation'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('portalToken') // ✅ 清除登入憑證
    router.push('/portal/login')           // ✅ 導回登入頁
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between items-center bg-gray-100 px-4 py-2 shadow">
        <h1 className="text-lg font-semibold">會員中心</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:underline"
        >
          登出
        </button>
      </header>
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}
