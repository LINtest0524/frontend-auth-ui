'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'

export default function MessageIcon() {
  const { user } = useUserStore()
  const company = useCompanySlug()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  // 獲取未讀消息數量
  const fetchUnreadCount = async () => {
    if (!user || !company) return

    try {
      const token = localStorage.getItem(`portalToken_${company}`)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/portal/messages/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('獲取未讀數量失敗:', error)
    }
  }

  // 點擊跳轉到消息中心
  const handleClick = () => {
    if (company) {
      router.push(`/${company}/messages`)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && company && mounted) {
      fetchUnreadCount()
      
      // 智能檢查頻率：根據頁面活躍度調整
      let checkInterval = 60000 // 預設60秒
      let lastActivityTime = Date.now()
      
      // 更新活躍時間
      const updateActivity = () => {
        lastActivityTime = Date.now()
      }
      
      // 智能檢查函數
      const smartCheck = () => {
        const timeSinceActivity = Date.now() - lastActivityTime
        
        // 如果用戶在5分鐘內有活動，使用較短間隔
        if (timeSinceActivity < 5 * 60 * 1000) {
          checkInterval = 30000 // 30秒
        } else {
          checkInterval = 120000 // 2分鐘
        }
        
        fetchUnreadCount()
      }
      
      // 設置智能定時器
      const interval = setInterval(smartCheck, checkInterval)
      
      // 監聽用戶活動
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      activityEvents.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true })
      })
      
      // 監聽頁面焦點事件，當用戶回到頁面時立即檢查
      const handleFocus = () => {
        updateActivity()
        fetchUnreadCount()
      }
      
      // 監聽頁面可見性變化
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          updateActivity()
          fetchUnreadCount()
        }
      }
      
      window.addEventListener('focus', handleFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', handleFocus)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        activityEvents.forEach(event => {
          document.removeEventListener(event, updateActivity)
        })
      }
    }
  }, [user, company, mounted])

  if (!mounted || !user) {
    return null
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'relative',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '8px'
      }}
      title="站內信"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'white'
        e.currentTarget.style.borderColor = '#d1d5db'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <Mail style={{ width: '20px', height: '20px', color: '#374151' }} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '12px',
          height: '12px',
          background: '#ef4444',
          border: '2px solid white',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }}></span>
      )}
    </button>
  )
}