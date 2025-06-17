'use client'
import { useEffect, useState } from 'react'

export default function Marquee() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="bg-yellow-100 text-yellow-800 py-2 text-center animate-pulse">
      🚨 這是一個跑馬燈測試模組（可在後台開啟/關閉）
    </div>
  )
}
