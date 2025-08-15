'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import '@/styles/notification.css'

interface NotificationData {
  id: string
  type: string
  verificationId: number
  verificationType: 'ID_CARD' | 'BANK_ACCOUNT'
  username: string
  companyId?: number
  message: string
  timestamp: string
}

export default function VerificationNotificationSimple() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [lastSoundTime, setLastSoundTime] = useState<string>(() => {
    // 從 localStorage 讀取或設為空字串
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastSoundTime') || ''
    }
    return ''
  })
  const [lastCheckTime, setLastCheckTime] = useState<string>('') // 暫時重置為空字串來測試
  const [isDismissed, setIsDismissed] = useState(false) // 新增：追蹤是否已被用戶關閉
  const [audioEnabled, setAudioEnabled] = useState(() => {
    // 檢查 localStorage 中是否已啟用音效
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audioEnabled') === 'true'
    }
    return false
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const router = useRouter()

  // 獲取未讀通知
  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/notifications/unread-verifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.count > 0) {
          // 檢查是否有新通知（基於通知 ID 而不是時間戳）
          const currentNotificationIds = data.notifications.map((n: NotificationData) => n.id)
          const lastNotificationIds = notifications.map((n: NotificationData) => n.id)
          const hasNewNotifications = !lastCheckTime || 
            currentNotificationIds.some((id: string) => !lastNotificationIds.includes(id)) ||
            data.notifications.some((notif: NotificationData) => notif.timestamp > lastCheckTime)

          // 只在有新通知時才記錄日誌
          if (hasNewNotifications) {
            const newIds = currentNotificationIds.filter((id: string) => !lastNotificationIds.includes(id))
            console.log('🔔 檢測到新驗證申請:', newIds.length > 0 ? `新增 ID: ${newIds.join(', ')}` : '時間戳更新')
          }

          setNotifications(data.notifications)
          
          // 只有在有新通知時才顯示彈窗
          if (hasNewNotifications) {
            // 檢查是否需要播放音效
            const latestNotificationTime = data.notifications[0].timestamp
            const lastClickTime = localStorage.getItem('lastClickTime') || ''
            
            // 檢查是否剛點擊過（10秒內不播放音效，防止頁面刷新時誤播）
            const recentlyClicked = lastClickTime && 
              (new Date().getTime() - new Date(lastClickTime).getTime()) < 10 * 1000
            
            // 修改邏輯：只要有新通知且沒有剛點擊過就播放音效，不管小視窗是否顯示
            const timeCondition = !lastSoundTime || latestNotificationTime > lastSoundTime
            const shouldPlaySound = audioRef.current && audioEnabled && 
              !recentlyClicked && // 剛點擊過不播放音效
              timeCondition
            
            // 設置彈窗顯示狀態
            setIsVisible(true)
            setIsDismissed(false) // 有新通知時重置關閉狀態
            
            console.log('🔍 音效播放檢查:', {
              audioRef: !!audioRef.current,
              audioEnabled,
              isVisible,
              recentlyClicked,
              lastSoundTime,
              latestNotificationTime,
              lastClickTime,
              shouldPlaySound,
              timeCondition,
              timeSinceClick: lastClickTime ? (new Date().getTime() - new Date(lastClickTime).getTime()) / 1000 : 'N/A'
            })
            
            if (shouldPlaySound) {
              // 嘗試播放音效
              const playAudio = async () => {
                try {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0
                    await audioRef.current.play()
                  }
                  console.log('🔊 驗證通知音效播放成功')
                  setLastSoundTime(latestNotificationTime)
                  localStorage.setItem('lastSoundTime', latestNotificationTime)
                } catch (err: any) {
                  console.warn('⚠️ 驗證通知音效播放失敗:', err.message)
                  
                  // 如果是用戶互動問題，提示用戶點擊頁面來啟用音效
                  if (err.name === 'NotAllowedError') {
                    console.log('💡 提示：請點擊頁面任意位置來啟用音效功能')
                  }
                  
                  // 無論如何都更新時間戳，避免重複嘗試
                  setLastSoundTime(latestNotificationTime)
                }
              }
              
              playAudio()
            }

            // 更新最後檢查時間
            setLastCheckTime(latestNotificationTime)
          }
          // 注意：移除了 else 分支，不要在沒有新通知時自動隱藏小視窗
          // 小視窗應該只有在用戶點擊或手動關閉時才隱藏
        } else {
          setNotifications([])
          setIsVisible(false)
          setIsDismissed(false) // 沒有通知時重置關閉狀態
        }
      }
    } catch (error) {
      console.error('獲取未讀通知失敗:', error)
    }
  }

  // 更新音效啟用狀態
  const updateAudioEnabled = () => {
    const enabled = localStorage.getItem('audioEnabled') === 'true'
    setAudioEnabled(enabled)
  }

  // 測試音效播放
  const testAudio = () => {
    if (audioRef.current && audioEnabled) {
      console.log('測試播放音效...')
      audioRef.current.currentTime = 0
      audioRef.current.play().then(() => {
        console.log('音效播放成功')
      }).catch((err: any) => {
        console.log('音效播放失敗:', err)
      })
    } else {
      console.log('音效未啟用或音效物件不存在')
    }
  }


  // 啟用音效（需要用戶互動）
  const enableAudio = async () => {
    if (audioRef.current) {
      try {
        // 嘗試播放靜音音效來啟用音頻上下文
        const originalVolume = audioRef.current.volume
        audioRef.current.volume = 0
        await audioRef.current.play()
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.volume = originalVolume || 0.5
        
        // 只有在成功播放後才設置為已啟用
        if (!audioEnabled) {
          setAudioEnabled(true)
          localStorage.setItem('audioEnabled', 'true')
          console.log('🔊 音效已成功啟用')
        }
      } catch (err: any) {
        console.warn('⚠️ 音效啟用失敗:', err.message)
      }
    }
  }

  useEffect(() => {
    // 初始化音效
    audioRef.current = new Audio('/sounds/verification.mp3')
    audioRef.current.preload = 'auto'
    audioRef.current.volume = 0.5
    
    // 監聽音效載入錯誤
    audioRef.current.addEventListener('error', (e) => {
      console.error('驗證通知音效檔案載入失敗:', e)
    })

    // 頁面載入時先獲取未讀通知
    fetchUnreadNotifications()

    // 每180秒輪詢一次
    const interval = setInterval(fetchUnreadNotifications, 180000)

    // 添加點擊事件監聽器來啟用音效
    const handleUserInteraction = () => {
      enableAudio()
      // 不要移除監聽器，讓它持續監聽以確保音頻上下文保持啟用
    }

    // 總是添加監聽器，確保音頻上下文在需要時能被啟用
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)

    // 監聽 localStorage 變化
    const handleStorageChange = () => {
      updateAudioEnabled()
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [lastCheckTime, lastSoundTime, audioEnabled])

  const handleNotificationClick = (notification: NotificationData) => {
    // 隱藏小彈窗（這樣下次有新申請時就會播放音效）
    setIsVisible(false)
    setIsDismissed(true) // 標記為已關閉
    
    // 設置標記防止頁面刷新時播放音效
    const currentTime = new Date().toISOString()
    setLastSoundTime(currentTime)
    localStorage.setItem('lastClickTime', currentTime)
    
    // 如果已經在驗證頁面，強制刷新頁面
    if (window.location.pathname === '/admin/id-verification') {
      window.location.reload()
    } else {
      // 如果不在驗證頁面，跳轉過去
      router.push('/admin/id-verification')
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setIsDismissed(true) // 標記為已關閉
  }

  const getTypeText = (type: 'ID_CARD' | 'BANK_ACCOUNT') => {
    return type === 'ID_CARD' ? '身分證' : '銀行卡'
  }

  if (!isVisible || notifications.length === 0 || isDismissed) {
    return null
  }

  const latestNotification = notifications[0]

  return (
    <div 
      className="b-msgbox cursor-pointer" 
      onClick={() => handleNotificationClick(latestNotification)}
    >
        {/* 卡片頭部 */}
        <div className="b-msgbox-s">
          新驗證申請

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="b-msgbox-X"
          >✕
          </button>
        </div>
   
    </div>
  )
}