'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type MarqueeItem = {
  id: number
  content: string
  isActive: boolean
  link?: string
  tag?: {
    id: number
    name: string
    backgroundColor: string
    textColor: string
  }
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
    <div className="f-marquee-bigbox">
      <div
        ref={containerRef}
        className="f-marquee-box"
      >
        <div
          ref={contentRef}
          className="f-marquee-con"
          style={{
            '--duration': `${duration}s`,
            animationDelay: '2s',
          } as React.CSSProperties}
        >
          {[...marquees, ...marquees].map((item, index) => (
            <span key={`${item.id}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.tag && (
                <span
                  style={{
                    backgroundColor: item.tag.backgroundColor,
                    color: item.tag.textColor,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.tag.name}
                </span>
              )}
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
    </div>
  )
}
