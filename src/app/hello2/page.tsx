'use client'

import Marquee from '@/components/Marquee'
import { isModuleEnabled } from '@/lib/moduleChecker'

export default function Hello2Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Hello2 模組測試頁</h1>

      {isModuleEnabled('marquee') && (
        <Marquee />
      )}

      <div className="mt-4">
        <p>這是 hello2 測試頁面，你可以根據不同代理商登入後測試是否顯示跑馬燈。</p>
      </div>
    </div>
  )
}
