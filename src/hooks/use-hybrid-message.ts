'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from './use-user-store'
import { useCompanySlug } from './useCompanySlug'

// 類型定義
interface SystemBroadcast {
  id: number
  title: string
  content: string
  broadcastType: 'GENERAL' | 'URGENT' | 'MAINTENANCE' | 'PROMOTION'
  targetAudience: 'ALL' | 'VIP' | 'NEW_USERS'
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  sender?: {
    id: number
    username: string
  }
}

interface PersonalMessage {
  id: number
  title: string
  content: string
  isRead: boolean
  createdAt: string
  readAt: string | null
  sender?: {
    id: number
    username: string
  }
}

interface MessageStats {
  unreadBroadcastCount: number
  unreadPersonalCount: number
  totalUnreadCount: number
}

interface MessageListResponse {
  broadcasts: SystemBroadcast[]
  personalMessages: PersonalMessage[]
  unreadBroadcastCount: number
  unreadPersonalCount: number
}

// Hook
export const useHybridMessage = () => {
  const user = useUserStore((state) => state.user)
  const companySlug = useCompanySlug()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 狀態
  const [messageStats, setMessageStats] = useState<MessageStats>({
    unreadBroadcastCount: 0,
    unreadPersonalCount: 0,
    totalUnreadCount: 0
  })
  
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([])
  const [personalMessages, setPersonalMessages] = useState<PersonalMessage[]>([])

  // API 基礎配置
  const getAuthHeaders = () => {
    if (!companySlug) {
      console.warn('⚠️ Company slug not available for token retrieval')
      return {
        'Content-Type': 'application/json',
        'Authorization': ''
      }
    }
    
    const token = localStorage.getItem(`portalToken_${companySlug}`)
    console.log(`🔑 Token retrieval for company ${companySlug}:`, token ? '有 token' : '沒有 token')
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${url}`, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error('API call failed:', err)
      throw err
    }
  }

  // ==================== 會員端功能 ====================

  /**
   * 獲取訊息統計
   */
  const fetchMessageStats = async () => {
    if (!user || !companySlug) return

    try {
      setLoading(true)
      const response = await apiCall(`/api/portal/${companySlug}/messages/unread-count`)
      
      // 直接使用返回的數據結構
      setMessageStats({
        unreadBroadcastCount: response.broadcasts || 0,
        unreadPersonalCount: response.personal || 0,
        totalUnreadCount: response.total || 0
      })
    } catch (err) {
      setError('獲取訊息統計失敗')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 獲取所有訊息（廣播 + 個人）
   */
  const fetchAllMessages = async (page = 1, limit = 20) => {
    if (!user || !companySlug) return

    try {
      setLoading(true)
      const response = await apiCall(`/api/portal/${companySlug}/messages?page=${page}&per_page=${limit}`)
      
      // 處理新的回應格式
      const allMessages = response.messages || []
      const broadcastMessages = allMessages.filter(msg => msg.type === 'broadcast')
      const personalMessages = allMessages.filter(msg => msg.type === 'personal')
      
      setBroadcasts(broadcastMessages)
      setPersonalMessages(personalMessages)
      setMessageStats({
        unreadBroadcastCount: broadcastMessages.filter(msg => !msg.is_read).length,
        unreadPersonalCount: personalMessages.filter(msg => !msg.is_read).length,
        totalUnreadCount: response.unread_count || 0
      })
    } catch (err) {
      setError('獲取訊息列表失敗')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 獲取未讀廣播
   */
  const fetchUnreadBroadcasts = async () => {
    if (!user || !companySlug) return

    try {
      const response = await apiCall(`/api/portal/${companySlug}/messages`)
      
      // 從所有訊息中篩選未讀廣播
      const allMessages = response.messages || []
      const unreadBroadcasts = allMessages.filter(msg => msg.type === 'broadcast' && !msg.is_read)
      
      setBroadcasts(unreadBroadcasts)
      return unreadBroadcasts
    } catch (err) {
      setError('獲取未讀廣播失敗')
      console.error(err)
    }
  }

  /**
   * 標記廣播為已讀
   */
  const markBroadcastsAsRead = async () => {
    if (!user || !companySlug) return

    try {
      // 獲取所有未讀廣播的ID
      const allMessages = await apiCall(`/api/portal/${companySlug}/messages`)
      const unreadBroadcastIds = allMessages.messages
        .filter(msg => msg.type === 'broadcast' && !msg.is_read)
        .map(msg => msg.id)

      if (unreadBroadcastIds.length === 0) return true

      // 批量標記為已讀
      await apiCall(`/api/portal/${companySlug}/messages/batch/read`, {
        method: 'PUT',
        body: JSON.stringify({ messageIds: unreadBroadcastIds })
      })
      
      // 更新本地狀態
      setBroadcasts([])
      setMessageStats(prev => ({
        ...prev,
        unreadBroadcastCount: 0,
        totalUnreadCount: prev.unreadPersonalCount
      }))
      return true
    } catch (err) {
      setError('標記廣播已讀失敗')
      console.error(err)
      return false
    }
  }

  /**
   * 獲取個人訊息
   */
  const fetchPersonalMessages = async (page = 1, limit = 20) => {
    if (!user || !companySlug) return

    try {
      const response = await apiCall(`/api/portal/${companySlug}/messages?page=${page}&per_page=${limit}`)
      
      // 從所有訊息中篩選個人訊息
      const allMessages = response.messages || []
      const personalMsgs = allMessages.filter(msg => msg.type === 'personal')
      const unreadPersonalCount = personalMsgs.filter(msg => !msg.is_read).length
      
      setPersonalMessages(personalMsgs)
      setMessageStats(prev => ({
        ...prev,
        unreadPersonalCount: unreadPersonalCount,
        totalUnreadCount: prev.unreadBroadcastCount + unreadPersonalCount
      }))
      return { messages: personalMsgs, unreadCount: unreadPersonalCount }
    } catch (err) {
      setError('獲取個人訊息失敗')
      console.error(err)
    }
  }

  /**
   * 標記個人訊息為已讀
   */
  const markPersonalMessageAsRead = async (messageId: number) => {
    if (!user || !companySlug) return

    try {
      const response = await apiCall(`/api/portal/${companySlug}/messages/${messageId}/read`, {
        method: 'PUT'
      })
      
      if (response.success) {
        // 更新本地狀態
        setPersonalMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        )
        
        // 更新未讀數量
        setMessageStats(prev => ({
          ...prev,
          unreadPersonalCount: Math.max(0, prev.unreadPersonalCount - 1),
          totalUnreadCount: Math.max(0, prev.totalUnreadCount - 1)
        }))
        
        return true
      }
    } catch (err) {
      setError('標記訊息已讀失敗')
      console.error(err)
      return false
    }
  }

  /**
   * 發送個人訊息
   */
  const sendPersonalMessage = async (receiverId: number, title: string, content: string) => {
    if (!user || !companySlug) return

    try {
      setLoading(true)
      const response = await apiCall(`/api/portal/${companySlug}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          receiverId,
          title,
          content
        })
      })
      
      if (response.success) {
        return response.data
      }
    } catch (err) {
      setError('發送訊息失敗')
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * 更新登入時間
   */
  const updateLoginTime = async () => {
    if (!user) return

    try {
      // 登錄時間更新可能需要不同的端點，這裡先註釋掉
      // await apiCall('/messages/update-login-time', {
      //   method: 'POST'
      // })
    } catch (err) {
      console.error('更新登入時間失敗:', err)
    }
  }

  // ==================== 自動功能 ====================

  // 會員登入時自動更新登入時間和獲取訊息統計
  useEffect(() => {
    if (user) {
      updateLoginTime()
      fetchMessageStats()
    }
  }, [user])

  // 定期檢查新訊息（每5分鐘）
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchMessageStats()
    }, 5 * 60 * 1000) // 5分鐘

    return () => clearInterval(interval)
  }, [user])

  return {
    // 狀態
    loading,
    error,
    messageStats,
    broadcasts,
    personalMessages,
    
    // 方法
    fetchMessageStats,
    fetchAllMessages,
    fetchUnreadBroadcasts,
    markBroadcastsAsRead,
    fetchPersonalMessages,
    markPersonalMessageAsRead,
    sendPersonalMessage,
    updateLoginTime,
    
    // 工具方法
    clearError: () => setError(null),
    hasUnreadMessages: messageStats.totalUnreadCount > 0
  }
}