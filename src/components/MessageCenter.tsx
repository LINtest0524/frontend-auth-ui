'use client'

import { useState, useEffect } from 'react'
import { useHybridMessage } from '@/hooks/use-hybrid-message'
import './MessageCenter.css'

interface MessageCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function MessageCenter({ isOpen, onClose }: MessageCenterProps) {
  const {
    loading,
    error,
    messageStats,
    broadcasts,
    personalMessages,
    fetchAllMessages,
    markBroadcastsAsRead,
    markPersonalMessageAsRead,
    clearError
  } = useHybridMessage()

  const [activeTab, setActiveTab] = useState<'all' | 'broadcasts' | 'personal'>('all')
  const [expandedBroadcast, setExpandedBroadcast] = useState<number | null>(null)
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null)

  // 當訊息中心打開時載入訊息
  useEffect(() => {
    if (isOpen) {
      fetchAllMessages()
    }
  }, [isOpen])

  // 處理廣播點擊
  const handleBroadcastClick = (broadcastId: number) => {
    if (expandedBroadcast === broadcastId) {
      setExpandedBroadcast(null)
    } else {
      setExpandedBroadcast(broadcastId)
    }
  }

  // 處理個人訊息點擊
  const handlePersonalMessageClick = async (messageId: number, isRead: boolean) => {
    if (expandedMessage === messageId) {
      setExpandedMessage(null)
    } else {
      setExpandedMessage(messageId)
      
      // 如果是未讀訊息，標記為已讀
      if (!isRead) {
        await markPersonalMessageAsRead(messageId)
      }
    }
  }

  // 標記所有廣播為已讀
  const handleMarkAllBroadcastsRead = async () => {
    const success = await markBroadcastsAsRead()
    if (success) {
      setExpandedBroadcast(null)
    }
  }

  // 獲取廣播類型的顯示文字和圖標
  const getBroadcastTypeInfo = (type: string) => {
    const typeMap = {
      'GENERAL': { text: '一般廣播', icon: '📢', color: '#3b82f6' },
      'IMPORTANT': { text: '重要廣播', icon: '🚨', color: '#ef4444' },
      'MAINTENANCE': { text: '維護廣播', icon: '🔧', color: '#f59e0b' },
      'NEW_MEMBER': { text: '新會員廣播', icon: '🎉', color: '#10b981' },
      // 向後兼容舊類型
      'URGENT': { text: '重要廣播', icon: '🚨', color: '#ef4444' },
      'PROMOTION': { text: '一般廣播', icon: '📢', color: '#3b82f6' }
    }
    return typeMap[type as keyof typeof typeMap] || typeMap.GENERAL
  }

  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return '剛剛'
    } else if (diffInHours < 24) {
      return `${diffInHours} 小時前`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} 天前`
    } else {
      return date.toLocaleDateString('zh-TW')
    }
  }

  if (!isOpen) return null

  return (
    <div className="message-center-overlay" onClick={onClose}>
      <div className="message-center" onClick={(e) => e.stopPropagation()}>
        {/* 標題列 */}
        <div className="message-center-header">
          <h3 className="message-center-title">
            <span className="message-center-icon">💬</span>
            訊息中心
            {messageStats.totalUnreadCount > 0 && (
              <span className="message-center-badge">{messageStats.totalUnreadCount}</span>
            )}
          </h3>
          <button className="message-center-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="message-center-error">
            <span>⚠️ {error}</span>
            <button onClick={clearError}>✕</button>
          </div>
        )}

        {/* 標籤頁 */}
        <div className="message-center-tabs">
          <button
            className={`message-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部
            {messageStats.totalUnreadCount > 0 && (
              <span className="tab-badge">{messageStats.totalUnreadCount}</span>
            )}
          </button>
          <button
            className={`message-tab ${activeTab === 'broadcasts' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcasts')}
          >
            系統廣播
            {messageStats.unreadBroadcastCount > 0 && (
              <span className="tab-badge">{messageStats.unreadBroadcastCount}</span>
            )}
          </button>
          <button
            className={`message-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            個人訊息
            {messageStats.unreadPersonalCount > 0 && (
              <span className="tab-badge">{messageStats.unreadPersonalCount}</span>
            )}
          </button>
        </div>

        {/* 內容區域 */}
        <div className="message-center-content">
          {loading && (
            <div className="message-center-loading">
              <div className="loading-spinner"></div>
              <span>載入中...</span>
            </div>
          )}

          {!loading && (
            <>
              {/* 系統廣播區域 */}
              {(activeTab === 'all' || activeTab === 'broadcasts') && broadcasts.length > 0 && (
                <div className="message-section">
                  <div className="message-section-header">
                    <h4>系統廣播</h4>
                    {broadcasts.length > 0 && (
                      <button 
                        className="mark-all-read-btn"
                        onClick={handleMarkAllBroadcastsRead}
                      >
                        全部標記已讀
                      </button>
                    )}
                  </div>
                  
                  <div className="message-list">
                    {broadcasts.map((broadcast) => {
                      const typeInfo = getBroadcastTypeInfo(broadcast.broadcastType)
                      const isExpanded = expandedBroadcast === broadcast.id
                      
                      return (
                        <div 
                          key={broadcast.id} 
                          className={`message-item broadcast-item ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => handleBroadcastClick(broadcast.id)}
                        >
                          <div className="message-item-header">
                            <div className="message-item-left">
                              <span 
                                className="broadcast-type-icon"
                                style={{ color: typeInfo.color }}
                              >
                                {typeInfo.icon}
                              </span>
                              <div className="message-item-info">
                                <h5 className="message-item-title">{broadcast.title}</h5>
                                <div className="message-item-meta">
                                  <span className="broadcast-type" style={{ color: typeInfo.color }}>
                                    {typeInfo.text}
                                  </span>
                                  <span className="message-time">
                                    {formatTime(broadcast.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="message-item-right">
                              <span className="unread-indicator"></span>
                              <span className="expand-icon">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="message-item-content">
                              <div className="message-content-text">
                                {broadcast.content}
                              </div>
                              {broadcast.sender && (
                                <div className="message-sender">
                                  發送者：{broadcast.sender.username}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 個人訊息區域 */}
              {(activeTab === 'all' || activeTab === 'personal') && (
                <div className="message-section">
                  <div className="message-section-header">
                    <h4>個人訊息</h4>
                  </div>
                  
                  {personalMessages.length === 0 ? (
                    <div className="empty-messages">
                      <span className="empty-icon">📭</span>
                      <p>暫無個人訊息</p>
                    </div>
                  ) : (
                    <div className="message-list">
                      {personalMessages.map((message) => {
                        const isExpanded = expandedMessage === message.id
                        
                        return (
                          <div 
                            key={message.id} 
                            className={`message-item personal-item ${isExpanded ? 'expanded' : ''} ${message.isRead ? 'read' : 'unread'}`}
                            onClick={() => handlePersonalMessageClick(message.id, message.isRead)}
                          >
                            <div className="message-item-header">
                              <div className="message-item-left">
                                <span className="personal-message-icon">
                                  {message.isRead ? '📧' : '📩'}
                                </span>
                                <div className="message-item-info">
                                  <h5 className="message-item-title">{message.title}</h5>
                                  <div className="message-item-meta">
                                    {message.sender && (
                                      <span className="message-sender-name">
                                        來自：{message.sender.username}
                                      </span>
                                    )}
                                    <span className="message-time">
                                      {formatTime(message.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="message-item-right">
                                {!message.isRead && <span className="unread-indicator"></span>}
                                <span className="expand-icon">
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="message-item-content">
                                <div className="message-content-text">
                                  {message.content}
                                </div>
                                {message.readAt && (
                                  <div className="message-read-time">
                                    已讀時間：{formatTime(message.readAt)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 空狀態 */}
              {!loading && 
               ((activeTab === 'broadcasts' && broadcasts.length === 0) ||
                (activeTab === 'all' && broadcasts.length === 0 && personalMessages.length === 0)) && (
                <div className="empty-messages">
                  <span className="empty-icon">📭</span>
                  <p>暫無訊息</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}