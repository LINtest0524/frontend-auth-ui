'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type MarqueeItem = {
  id: number
  content: string
  isActive: boolean
  link?: string
}

type Props = {
  marquees: MarqueeItem[]
}

export default function Marquee({ marquees = [] }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [duration, setDuration] = useState<number>(20)

  useLayoutEffect(() => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const contentWidth = contentRef.current.offsetWidth
      const baseSpeed = 80 // px/sec
      const seconds = (contentWidth + containerWidth) / baseSpeed
      setDuration(seconds)
    }
  }, [marquees])

  if (!marquees || marquees.length === 0) return null

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
          animationDelay: '2s',
        }}
      >
        {[...marquees, ...marquees].map((item, index) => (
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
