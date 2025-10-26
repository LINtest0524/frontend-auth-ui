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
      if (!token) {
        setUnreadCount(0)
        return
      }

      // 檢查是否為剛登入（30秒內），如果是則跳過檢查避免干擾
      const tokenCreatedTime = localStorage.getItem(`tokenCreatedTime_${company}`)
      if (tokenCreatedTime) {
        const timeDiff = Date.now() - parseInt(tokenCreatedTime)
        if (timeDiff < 30000) { // 30秒內
          // 跳過檢查
          setUnreadCount(0)
          return
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/portal/${company}/messages/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      ).catch(() => ({ ok: false, status: 500 })) // 靜默處理網路錯誤

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      } else if (response.status === 401 || response.status === 500) {
        // Token 無效或會話失效，但要更謹慎地處理
        // API錯誤，靜默處理
        
        // 檢查是否為剛登入，如果是則不清除token
        if (tokenCreatedTime) {
          const timeDiff = Date.now() - parseInt(tokenCreatedTime)
          if (timeDiff < 60000) { // 1分鐘內
            // 最近登入，不清除認證資料
            setUnreadCount(0)
            return
          }
        }
        
        try {
          const errorData = await response.json()
          if (errorData.message?.includes('Session invalid') || 
              errorData.message?.includes('被踢下線') ||
              errorData.message?.includes('會話已失效')) {
            // 只有明確的會話失效錯誤才清除token
            localStorage.removeItem(`portalToken_${company}`)
            localStorage.removeItem(`portalUser_${company}`)
            localStorage.removeItem(`enabledModules_${company}`)
            localStorage.removeItem(`sessionId_${company}`)
            localStorage.removeItem(`tokenCreatedTime_${company}`)
            window.location.href = `/${company}/duplicate-login`
            return
          }
        } catch (parseError) {
          // 解析錯誤，靜默處理
        }
        setUnreadCount(0)
      }
    } catch (error) {
      // 網路錯誤等，不輸出錯誤日誌避免刷屏
      setUnreadCount(0)
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
      // 延遲一點再開始檢查，給登入過程更多時間
      setTimeout(() => {
        fetchUnreadCount()
      }, 2000) // 延遲2秒
      
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