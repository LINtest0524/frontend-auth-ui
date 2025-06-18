'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type MarqueeItem = {
  id: number
  content: string
  isActive: boolean
  link?: string
}

export default function Marquee() {
  const { company } = useParams()
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<MarqueeItem[]>([])
  const [duration, setDuration] = useState(20) // 預設秒數
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!company || typeof company !== 'string') return

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${company}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: MarqueeItem[]) => {
        const activeItems = data.filter((m) => m.isActive)
        setItems(activeItems)
      })
      .catch((err) => {
        console.error('[Marquee] fetch error:', err)
        setItems([])
      })
  }, [company])

  useLayoutEffect(() => {
    // ✅ 根據實際內容寬度決定動畫時間（越寬跑越久）
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const contentWidth = contentRef.current.offsetWidth

      if (contentWidth > 0) {
        const baseSpeed = 80 // px/sec，越大越快
        const seconds = (contentWidth + containerWidth) / baseSpeed
        setDuration(seconds)
      }
    }
  }, [items])

  if (!mounted || items.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden whitespace-nowrap bg-yellow-100 text-yellow-800 py-2"
    >
      <div
        ref={contentRef}
        className="absolute left-0 top-0 flex animate-marquee"
        style={{
          animationDuration: `${duration}s`,
          animationDelay: '2s', // ✅ 延遲開始動畫 2 秒
        }}
      >
        {/* ✅ 內容區，複製兩次實現無縫滾動 */}
        {[...items, ...items].map((item, index) => (
          <span key={`${item.id}-${index}`} className="mx-8 inline-block">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {item.content}
              </a>
            ) : (
              item.content
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
