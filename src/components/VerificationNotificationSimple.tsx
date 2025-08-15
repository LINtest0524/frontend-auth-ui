'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import '@/styles/notification.css'
import { getCurrentTaiwanTime, toTaiwanDisplayTime, getTimeDifference } from '@/lib/timeUtils'

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
  const [lastSoundTime, setLastSoundTime] = useState<string>('') // 初始化為空字串，避免 SSR 問題
  const [lastCheckTime, setLastCheckTime] = useState<string>('') // 暫時重置為空字串來測試
  const [isDismissed, setIsDismissed] = useState(false) // 新增：追蹤是否已被用戶關閉
  const [audioEnabled, setAudioEnabled] = useState(false) // 初始化為 false，避免 SSR 問題
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const processedNotificationIds = useRef<Set<string>>(new Set()) // 追蹤已處理的通知 ID
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
          // 優化：使用 Set 來提升查找效能
          const currentNotificationIds = new Set(data.notifications.map((n: NotificationData) => n.id))
          const lastNotificationIds = new Set(notifications.map((n: NotificationData) => n.id))
          
          // 優化：計算真正的新通知 ID（使用 Set 提升效能）
          const newIds = data.notifications
            .map((n: NotificationData) => n.id)
            .filter((id: string) => 
              !lastNotificationIds.has(id) && !processedNotificationIds.current.has(id)
            )
          
          // 只基於真正的新 ID 來判斷是否有新通知
          const hasNewNotifications = newIds.length > 0
          
          // 立即標記新通知為已處理，避免重複處理
          if (hasNewNotifications) {
            newIds.forEach((id: string) => processedNotificationIds.current.add(id))
          }
          
          // 先更新通知狀態，避免重複檢測
          setNotifications(data.notifications)
          
          // 只在有新通知時才記錄日誌
          if (hasNewNotifications && newIds.length > 0) {
            console.log('🔔 檢測到新驗證申請:', `新增 ID: ${newIds.join(', ')}`)
          }
          
          // 只有在有新通知時才顯示彈窗
          if (hasNewNotifications) {
            setIsVisible(true)
            setIsDismissed(false) // 重置關閉狀態，讓新通知可以顯示
            setLastCheckTime(data.notifications[0].timestamp)
            
            // 優化：一次性讀取 localStorage 值
            const lastClickTime = localStorage.getItem('lastClickTime') || ''
            const currentAudioSetting = localStorage.getItem('audioEnabled') === 'true'
            const currentTime = getCurrentTaiwanTime()
            
            // 優化：一次性計算時間差
            const timeSinceClick = lastClickTime ? 
              Math.abs(getTimeDifference(currentTime, lastClickTime)) : Infinity
            const recentlyClicked = timeSinceClick < 10 * 1000
            
            // 嚴格檢查音效播放條件 - 只有真正的新通知才播放音效
            const isNewNotification = newIds.length > 0 // 只有新的 ID 才算新通知
            const shouldPlaySound = audioRef.current && 
              currentAudioSetting && // 必須開啟音效（使用最新值）
              !recentlyClicked && // 剛點擊過不播放音效
              isNewNotification // 只有真正的新通知才播放音效
            
            // 設置彈窗顯示狀態（移到這裡確保一定會執行）
            setIsDismissed(false) // 有新通知時重置關閉狀態
            
            // 優化：只在開發環境或需要時輸出詳細日誌
            if (process.env.NODE_ENV === 'development' || shouldPlaySound) {
              console.log('🔍 音效播放檢查:', {
                audioRef: !!audioRef.current,
                audioEnabled,
                currentAudioSetting,
                recentlyClicked,
                newIds: newIds.length,
                shouldPlaySound,
                timeSinceClick: timeSinceClick / 1000
              })
            }
            
            if (shouldPlaySound) {
              console.log('🔊 準備播放音效 - 新通知 ID:', newIds.join(', '))
              
              // 嘗試播放音效
              const playAudio = async () => {
                try {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0
                    await audioRef.current.play()
                  }
                  console.log('🔊 驗證通知音效播放成功')
                } catch (err: any) {
                  console.warn('⚠️ 驗證通知音效播放失敗:', err.message)
                  
                  // 如果是用戶互動問題，提示用戶點擊頁面來啟用音效
                  if (err.name === 'NotAllowedError') {
                    console.log('💡 提示：請點擊頁面任意位置來啟用音效功能')
                  }
                }
              }
              
              playAudio()
              
              // 播放音效後更新 lastSoundTime（重用已計算的 currentTime）
              setLastSoundTime(currentTime)
              localStorage.setItem('lastSoundTime', currentTime)
              if (process.env.NODE_ENV === 'development') {
                console.log('🔊 已更新上次音效時間:', toTaiwanDisplayTime(currentTime))
              }
            } else if (process.env.NODE_ENV === 'development') {
              console.log('🔇 音效播放被跳過 - 條件不符合:', {
                audioRef: !!audioRef.current,
                currentAudioSetting,
                recentlyClicked,
                newIds: newIds.length
              })
            }

            // 更新最後檢查時間（移除重複設置）
            // setLastCheckTime 已在上面設置過了
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
    console.log('🔄 音效狀態已更新:', enabled ? 'ON' : 'OFF')
  }

  // 強制同步音效狀態
  const forceSyncAudioState = () => {
    const currentAudioSetting = localStorage.getItem('audioEnabled') === 'true'
    if (currentAudioSetting !== audioEnabled) {
      setAudioEnabled(currentAudioSetting)
      console.log('🔄 強制同步音效狀態:', currentAudioSetting ? 'ON' : 'OFF')
    }
  }

  // 測試音效播放
  const testAudio = () => {
    // 先強制同步狀態
    forceSyncAudioState()
    
    const currentAudioSetting = localStorage.getItem('audioEnabled') === 'true'
    console.log('🧪 測試音效播放:', {
      audioRef: !!audioRef.current,
      audioEnabled,
      currentAudioSetting,
      localStorage: localStorage.getItem('audioEnabled')
    })
    
    if (audioRef.current && currentAudioSetting) {
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


  // 啟用音效上下文（不改變音效開關狀態）
  const enableAudioContext = async () => {
    if (audioRef.current) {
      try {
        // 嘗試播放靜音音效來啟用音頻上下文，但不改變音效開關狀態
        const originalVolume = audioRef.current.volume
        audioRef.current.volume = 0
        await audioRef.current.play()
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.volume = originalVolume || 0.5
        
        console.log('🔊 音效上下文已啟用（不改變開關狀態）')
      } catch (err: any) {
        console.warn('⚠️ 音效上下文啟用失敗:', err.message)
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

    // 同步音效狀態和上次播放時間
    const currentAudioSetting = localStorage.getItem('audioEnabled') === 'true'
    const savedLastSoundTime = localStorage.getItem('lastSoundTime') || ''
    
    setAudioEnabled(currentAudioSetting)
    setLastSoundTime(savedLastSoundTime)
    
    // 優化：只在開發環境輸出初始化日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 初始化音效狀態:', currentAudioSetting ? 'ON' : 'OFF')
      console.log('🔄 初始化上次音效時間:', savedLastSoundTime ? toTaiwanDisplayTime(savedLastSoundTime) : '無')
      console.log('🚀 驗證通知組件已啟動，開始監聽通知...')
    }
    
    // 頁面載入時先獲取未讀通知
    fetchUnreadNotifications()

    // 每3分鐘輪詢一次，驗證申請沒有即時性要求
    const interval = setInterval(fetchUnreadNotifications, 180000)

    // 移除定期檢查，改用事件驅動的同步機制
    // const audioCheckInterval = setInterval(...) 不再需要

    // 添加點擊事件監聽器來啟用音效上下文（只執行一次）
    let audioContextEnabled = false
    const handleUserInteraction = () => {
      if (!audioContextEnabled) {
        enableAudioContext() // 只啟用音效上下文，不改變開關狀態
        audioContextEnabled = true
        console.log('🔊 音效上下文已啟用（一次性）')
        
        // 移除事件監聽器，避免重複執行
        document.removeEventListener('click', handleUserInteraction)
        document.removeEventListener('keydown', handleUserInteraction)
      }
    }

    // 總是添加監聽器，確保音頻上下文在需要時能被啟用
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)
    
    // 添加自定義事件監聽器來處理音效狀態變化
    const handleAudioToggle = () => {
      const currentSetting = localStorage.getItem('audioEnabled') === 'true'
      setAudioEnabled(currentSetting)
      console.log('🔄 自定義事件同步音效狀態:', currentSetting ? 'ON' : 'OFF')
    }
    window.addEventListener('audioToggle', handleAudioToggle)

    // 監聽 localStorage 變化（跨標籤頁）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'audioEnabled') {
        const newValue = e.newValue === 'true'
        setAudioEnabled(newValue)
        console.log('🔄 Storage 事件同步音效狀態:', newValue ? 'ON' : 'OFF')
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      // 移除 audioCheckInterval 清理，因為已經不使用輪詢
      // 用戶互動事件監聽器會在首次觸發後自動移除
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('audioToggle', handleAudioToggle)
    }
  }, []) // 空依賴陣列，確保只執行一次

  const handleNotificationClick = (notification: NotificationData) => {
    // 隱藏小彈窗（這樣下次有新申請時就會播放音效）
    setIsVisible(false)
    setIsDismissed(true) // 標記為已關閉
    
    // 設置標記防止頁面刷新時播放音效
    const currentTime = getCurrentTaiwanTime()
    setLastSoundTime(currentTime)
    localStorage.setItem('lastClickTime', currentTime)
    localStorage.setItem('lastSoundTime', currentTime)
    console.log('👆 點擊通知，已更新時間:', toTaiwanDisplayTime(currentTime))
    
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

  // 如果沒有通知或已關閉，不顯示任何內容
  if (!isVisible || notifications.length === 0 || isDismissed) {
    return null
  }

  const latestNotification = notifications[0]

  return (
    <>
      
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
    </>
  )
}