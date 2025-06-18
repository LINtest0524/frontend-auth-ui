'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'

export default function PortalCompanyPage() {
  const { company } = useParams()
  const { user } = useUserStore()
  const modules = useEnabledModules()

  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])

  useEffect(() => {
    if (!company || typeof company !== 'string') return

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${company}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBanners)
      .catch(() => setBanners([]))

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${company}`)
      .then(res => res.ok ? res.json() : [])
      .then(setMarquees)
      .catch(() => setMarquees([]))
  }, [company])

  const renderModule = (key: string, props: any = {}) => {
    const mod = modules.find((m) => m.key === key)
    if (!mod) return null
    const Comp = mod.Component
    return <Comp {...props} />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">

      

      {/* ✅ 想要插入跑馬燈的地方 */}
      {renderModule('marquee', { marquees })}

      <div className="border rounded p-4 bg-white shadow">
        <h1 className="text-xl font-bold mb-4">歡迎來到會員中心</h1>
        <p>這裡可以顯示你要的內容</p>
        <p className="text-sm text-gray-600 mt-4">🧑 使用者：{user?.username}</p>
      </div>

      {/* ✅ 想要插入 banner 的位置 */}
      {renderModule('banner', { banners })}

      {/* ✅ 如果你要再插一次跑馬燈 */}
      {renderModule('marquee', { marquees })}
    </div>
  )
}
