'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from './use-user-store'

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
    const token = localStorage.getItem('token')
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
    if (!user) return

    try {
      setLoading(true)
      const response = await apiCall('/messages/stats')
      
      if (response.success) {
        setMessageStats(response.data)
      }
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
    if (!user) return

    try {
      setLoading(true)
      const response = await apiCall(`/messages/my-messages?page=${page}&limit=${limit}`)
      
      if (response.success) {
        setBroadcasts(response.data.broadcasts)
        setPersonalMessages(response.data.personalMessages)
        setMessageStats({
          unreadBroadcastCount: response.data.unreadBroadcastCount,
          unreadPersonalCount: response.data.unreadPersonalCount,
          totalUnreadCount: response.data.unreadBroadcastCount + response.data.unreadPersonalCount
        })
      }
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
    if (!user) return

    try {
      const response = await apiCall('/messages/unread-broadcasts')
      
      if (response.success) {
        setBroadcasts(response.data)
        return response.data
      }
    } catch (err) {
      setError('獲取未讀廣播失敗')
      console.error(err)
    }
  }

  /**
   * 標記廣播為已讀
   */
  const markBroadcastsAsRead = async () => {
    if (!user) return

    try {
      const response = await apiCall('/messages/broadcasts/mark-read', {
        method: 'PUT'
      })
      
      if (response.success) {
        // 更新本地狀態
        setBroadcasts([])
        setMessageStats(prev => ({
          ...prev,
          unreadBroadcastCount: 0,
          totalUnreadCount: prev.unreadPersonalCount
        }))
        return true
      }
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
    if (!user) return

    try {
      const response = await apiCall(`/messages/personal?page=${page}&limit=${limit}`)
      
      if (response.success) {
        setPersonalMessages(response.data.messages)
        setMessageStats(prev => ({
          ...prev,
          unreadPersonalCount: response.data.unreadCount,
          totalUnreadCount: prev.unreadBroadcastCount + response.data.unreadCount
        }))
        return response.data
      }
    } catch (err) {
      setError('獲取個人訊息失敗')
      console.error(err)
    }
  }

  /**
   * 標記個人訊息為已讀
   */
  const markPersonalMessageAsRead = async (messageId: number) => {
    if (!user) return

    try {
      const response = await apiCall(`/messages/personal/${messageId}/read`, {
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
    if (!user) return

    try {
      setLoading(true)
      const response = await apiCall('/messages/personal', {
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
      await apiCall('/messages/update-login-time', {
        method: 'POST'
      })
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