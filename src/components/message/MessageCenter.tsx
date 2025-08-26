'use client'

import { useState, useEffect, useRef } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import { useRouter } from 'next/navigation'
import '../../styles/message-center.css'

interface Message {
  id: number | string  // 支援數字ID和字符串ID（系統廣播）
  title: string
  content: string
  isRead: boolean
  messageType: 'SYSTEM' | 'USER' | 'ADMIN'
  createdAt: string
  readAt?: string
  sender?: {
    id: number
    username: string
  }
}

interface MessageListResponse {
  messages: Message[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function MessageCenter() {
  const { user } = useUserStore()
  const company = useCompanySlug()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<(number | string)[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessageForModal, setSelectedMessageForModal] = useState<Message | null>(null)
  
  // 使用 ref 來追蹤最新的狀態值，避免閉包問題
  const activeTabRef = useRef(activeTab)
  const currentPageRef = useRef(currentPage)
  const isProcessingRef = useRef(false) // 追蹤是否正在處理刪除操作
  
  // 更新 ref 值
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])
  
  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  // 獲取消息列表
  const fetchMessages = async (isRead?: boolean, page = 1) => {
    console.log('🔄 fetchMessages 被調用:', { isRead, page, caller: new Error().stack?.split('\n')[2]?.trim() })
    if (!user || !company) return

    setLoading(true)
    try {
      const token = localStorage.getItem(`portalToken_${company}`)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (isRead !== undefined) {
        params.append('isRead', isRead.toString())
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE}/api/portal/messages?${params}`

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data: MessageListResponse = await response.json()
        console.log('📋 獲取到的消息列表:', {
          total: data.messages.length,
          messages: data.messages.map(msg => ({
            id: msg.id,
            type: typeof msg.id,
            title: msg.title,
            messageType: msg.messageType,
            isRead: msg.isRead,
            createdAt: msg.createdAt
          }))
        })
        setMessages(data.messages)
        setTotalPages(data.totalPages)
        setCurrentPage(data.page)
      }
    } catch (error) {
      console.error('獲取消息失敗:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // 標記為已讀
  const markAsRead = async (messageId: number | string) => {
    if (!user || !company) return

    try {
      const token = localStorage.getItem(`portalToken_${company}`)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/portal/messages/${messageId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        console.log('✅ 標記已讀成功:', messageId)
        // 更新本地狀態
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
        ))
        // 立即更新未讀數量
        await fetchUnreadCount()
        
        // 如果當前在未讀標籤頁，重新獲取消息列表以移除已讀消息
        if (activeTab === 'unread') {
          const isReadFilter = false
          await fetchMessages(isReadFilter, currentPage)
        }
      } else {
        console.error('標記已讀失敗:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('標記已讀失敗:', error)
    }
  }

  // 批量標記為已讀
  const markSelectedAsRead = async () => {
    if (!user || !company || selectedMessages.length === 0) return

    try {
      const token = localStorage.getItem(`portalToken_${company}`)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/portal/messages/batch/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageIds: selectedMessages }),
        }
      )

      if (response.ok) {
        setSelectedMessages([])
        fetchMessages(activeTab === 'unread' ? false : undefined, currentPage)
        fetchUnreadCount()
      }
    } catch (error) {
      console.error('批量標記已讀失敗:', error)
    }
  }

  // 刪除消息
  const deleteMessage = async (messageId: number | string) => {
    if (!user || !company) return

    console.log('🗑️ 準備刪除消息:', { messageId, type: typeof messageId })

    if (!confirm('確定要刪除這條消息嗎？')) {
      return
    }

    // 設置處理狀態，防止焦點事件干擾
    isProcessingRef.current = true

    try {
      const token = localStorage.getItem(`portalToken_${company}`)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/portal/messages/${messageId}`

      console.log('🌐 發送刪除請求:', { apiUrl, messageId })

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      console.log('📡 收到響應:', { status: response.status, ok: response.ok })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ 刪除響應結果:', result)
        
        if (result.message && result.message.includes('系統廣播已刪除')) {
          console.log('📢 系統廣播刪除成功:', result.message)
          alert(result.message)
          // 系統廣播刪除後，直接從列表中移除，不需要重新載入
          setMessages(prev => prev.filter(msg => msg.id !== messageId))
          await fetchUnreadCount()
        } else {
          console.log('💬 個人消息刪除成功')
          alert('刪除成功！')
          // 對於個人消息，直接從列表中移除，不需要重新載入
          setMessages(prev => prev.filter(msg => msg.id !== messageId))
          await fetchUnreadCount()
        }
      } else {
        const errorText = await response.text()
        console.error('❌ 刪除失敗響應:', errorText)
        alert(`刪除失敗: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('💥 刪除消息失敗:', error)
      alert('刪除失敗，請檢查網路連線')
    } finally {
      // 重置處理狀態
      setTimeout(() => {
        isProcessingRef.current = false
        console.log('✅ 刪除處理完成，重置狀態')
      }, 1000) // 延遲1秒重置，確保所有相關的焦點事件都處理完
    }
  }

  // 批量刪除
  const deleteSelectedMessages = async () => {
    if (!user || !company || selectedMessages.length === 0) {
      alert('請先選擇要刪除的消息')
      return
    }

    if (!confirm(`確定要刪除 ${selectedMessages.length} 條消息嗎？`)) {
      return
    }

    // 設置處理狀態，防止焦點事件干擾
    isProcessingRef.current = true

    try {
      const token = localStorage.getItem(`portalToken_${company}`)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/portal/messages/batch`

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds: selectedMessages }),
      })

      if (response.ok) {
        const result = await response.json()
        // 使用後端返回的訊息
        if (result.message) {
          alert(result.message)
        } else {
          alert('操作完成！')
        }
        
        // 直接從列表中移除已刪除的消息，不需要重新載入
        setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)))
        setSelectedMessages([])
        await fetchUnreadCount()
      } else {
        const errorText = await response.text()
        console.error('刪除失敗響應:', errorText)
        alert(`刪除失敗: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('批量刪除失敗:', error)
      alert('刪除失敗，請檢查網路連線')
    } finally {
      // 重置處理狀態
      setTimeout(() => {
        isProcessingRef.current = false
        console.log('✅ 批量刪除處理完成，重置狀態')
      }, 1000) // 延遲1秒重置，確保所有相關的焦點事件都處理完
    }
  }

  // 處理標籤切換
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSelectedMessages([])
    setSelectedMessageForModal(null)
    setCurrentPage(1)
    
    if (value === 'all') {
      fetchMessages(undefined, 1)
    } else if (value === 'unread') {
      fetchMessages(false, 1)
    } else if (value === 'read') {
      fetchMessages(true, 1)
    }
  }

  // 處理消息點擊，打開模態框
  const handleMessageClick = (messageId: number | string) => {
    const message = messages.find(msg => msg.id === messageId)
    if (message) {
      setSelectedMessageForModal(message)
      // 點擊時自動標記為已讀
      if (!message.isRead) {
        markAsRead(messageId)
      }
    }
  }

  // 關閉模態框
  const closeModal = () => {
    setSelectedMessageForModal(null)
  }

  // 處理鍵盤事件
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && selectedMessageForModal) {
      closeModal()
    }
  }

  // 添加鍵盤事件監聽
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedMessageForModal])

  // 處理消息選擇
  const handleMessageSelect = (messageId: number | string, checked: boolean) => {
    if (checked) {
      setSelectedMessages(prev => [...prev, messageId])
    } else {
      setSelectedMessages(prev => prev.filter(id => id !== messageId))
    }
  }

  // 全選/取消全選
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessages(messages.map(msg => msg.id))
    } else {
      setSelectedMessages([])
    }
  }

  // 獲取消息類型標籤
  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'SYSTEM':
        return <span className="message-badge system">系統</span>
      case 'ADMIN':
        return <span className="message-badge admin">管理員</span>
      default:
        return <span className="message-badge user">用戶</span>
    }
  }

  // 格式化時間
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW')
  }

  // 初始化效果 - 只在用戶和公司變化時執行
  useEffect(() => {
    if (user && company) {
      fetchMessages()
      fetchUnreadCount()
    }
  }, [user, company])

  // 設置事件監聽器 - 只在組件掛載時執行一次
  useEffect(() => {
    if (user && company) {
      // 設置定時器，只更新未讀數量，不干擾用戶操作
      const interval = setInterval(() => {
        // 只更新未讀數量，不重新載入消息列表
        fetchUnreadCount()
      }, 60000)
      
      // 監聽頁面焦點事件，當用戶回到頁面時才更新消息列表
      const handleFocus = () => {
        console.log('🔍 頁面焦點事件觸發, 是否正在處理:', isProcessingRef.current)
        
        // 如果正在處理刪除操作，忽略焦點事件
        if (isProcessingRef.current) {
          console.log('⏸️ 正在處理刪除操作，忽略焦點事件')
          return
        }
        
        // 只更新未讀數量，不重新載入消息列表，避免干擾用戶操作
        fetchUnreadCount()
      }
      
      // 監聽頁面可見性變化
      const handleVisibilityChange = () => {
        console.log('👁️ 頁面可見性變化:', !document.hidden ? '可見' : '隱藏')
        if (!document.hidden) {
          // 頁面變為可見時只更新未讀數量，避免干擾用戶操作
          fetchUnreadCount()
        }
      }
      
      window.addEventListener('focus', handleFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', handleFocus)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [user, company]) // 移除 activeTab 和 currentPage 依賴

  if (!user) {
    return <div className="p-4 text-center">請先登入</div>
  }

  return (
    <div className="message-center">
      <div className="message-container">
        {/* 頭部區域 */}
        <div className="message-header">
          <h1 className="message-title">
            <div className="message-icon">
              📧
            </div>
            站內信
            {unreadCount > 0 && (
              <div className="unread-badge">
                {unreadCount} 未讀
              </div>
            )}
          </h1>
        </div>

        {/* 標籤頁 */}
        <div className="message-tabs">
          <ul className="tabs-list">
            <li>
              <button 
                className={`tab-trigger ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                全部消息
              </button>
            </li>
            <li>
              <button 
                className={`tab-trigger ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => handleTabChange('unread')}
              >
                未讀 {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </li>
            <li>
              <button 
                className={`tab-trigger ${activeTab === 'read' ? 'active' : ''}`}
                onClick={() => handleTabChange('read')}
              >
                已讀
              </button>
            </li>
          </ul>
        </div>

        {/* 操作工具欄 */}
        <div className="message-toolbar">
          <button
            className="toolbar-btn"
            onClick={() => {
              const isReadFilter = activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined
              fetchMessages(isReadFilter, currentPage)
              fetchUnreadCount()
            }}
            disabled={loading}
            title="手動刷新消息列表和未讀數量"
          >
            🔄 {loading ? '刷新中...' : '刷新'}
          </button>
          
          {selectedMessages.length > 0 && (
            <>
              <button
                className="toolbar-btn primary"
                onClick={markSelectedAsRead}
              >
                📖 標記已讀 ({selectedMessages.length})
              </button>
              <button
                className="toolbar-btn danger"
                onClick={deleteSelectedMessages}
              >
                🗑️ 刪除 ({selectedMessages.length})
              </button>
            </>
          )}
        </div>

        {/* 內容區域 */}
        <div className="message-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner-large"></div>
              <p>載入中...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3 className="empty-title">
                {activeTab === 'unread' ? '沒有未讀消息' : '沒有消息'}
              </h3>
              <p className="empty-description">
                {activeTab === 'unread' ? '您已閱讀所有消息' : '暫時沒有任何消息'}
              </p>
            </div>
          ) : (
            <>
              {/* 全選控制 */}
              {messages.length > 0 && (
                <div className="select-all-control">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedMessages.length === messages.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span>
                    全選 ({selectedMessages.length}/{messages.length})
                  </span>
                </div>
              )}

              {/* 消息列表 */}
              <div className="message-list">
                {messages.map((message) => {
                  return (
                    <div
                      key={message.id}
                      className={`message-item ${!message.isRead ? 'unread' : ''}`}
                    >
                      <div className="message-row">
                        <input
                          type="checkbox"
                          className="checkbox message-checkbox"
                          checked={selectedMessages.includes(message.id)}
                          onChange={(e) => handleMessageSelect(message.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div 
                          className="message-body clickable"
                          onClick={() => handleMessageClick(message.id)}
                        >
                          <div className="message-header-row">
                            <h3 className={`message-subject ${message.isRead ? 'read' : 'unread'}`}>
                              {message.title}
                            </h3>
                            <div className="message-badges">
                              {getMessageTypeBadge(message.messageType)}
                              {!message.isRead && (
                                <span className="message-badge new">新</span>
                              )}
                            </div>
                          </div>
                          
                          <div 
                            className="message-preview"
                            dangerouslySetInnerHTML={{
                              __html: message.content.length > 100 
                                ? `${message.content.substring(0, 100)}...` 
                                : message.content
                            }}
                          />
                          
                          <div className="message-meta">
                            <div className="message-info">
                              {message.sender && (
                                <span>發送者: {message.sender.username}</span>
                              )}
                              <span>發送時間: {formatDate(message.createdAt)}</span>
                              {message.readAt && (
                                <span>已讀時間: {formatDate(message.readAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="message-actions">
                          <button
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMessage(message.id)
                            }}
                            title="刪除消息"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 分頁控制 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => {
                      const isReadFilter = activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined
                      fetchMessages(isReadFilter, currentPage - 1)
                    }}
                  >
                    ← 上一頁
                  </button>
                  <div className="pagination-info">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      const isReadFilter = activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined
                      fetchMessages(isReadFilter, currentPage + 1)
                    }}
                  >
                    下一頁 →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 消息詳情模態框 */}
      {selectedMessageForModal && (
        <div className="message-modal-overlay" onClick={closeModal}>
          <div className="message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="message-modal-header">
              <div className="modal-title-section">
                <h2 className="modal-title">{selectedMessageForModal.title}</h2>
                <div className="modal-badges">
                  {getMessageTypeBadge(selectedMessageForModal.messageType)}
                  {!selectedMessageForModal.isRead && (
                    <span className="message-badge new">新</span>
                  )}
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal} title="關閉 (ESC)">
                ✕
              </button>
            </div>
            
            <div className="message-modal-meta">
              {selectedMessageForModal.sender && (
                <div className="modal-meta-item">
                  <span className="meta-label">發送者:</span>
                  <span className="meta-value">{selectedMessageForModal.sender.username}</span>
                </div>
              )}
              <div className="modal-meta-item">
                <span className="meta-label">發送時間:</span>
                <span className="meta-value">{formatDate(selectedMessageForModal.createdAt)}</span>
              </div>
              {selectedMessageForModal.readAt && (
                <div className="modal-meta-item">
                  <span className="meta-label">已讀時間:</span>
                  <span className="meta-value">{formatDate(selectedMessageForModal.readAt)}</span>
                </div>
              )}
            </div>
            
            <div className="message-modal-content">
              <div 
                className="modal-content-text"
                dangerouslySetInnerHTML={{ __html: selectedMessageForModal.content }}
              />
            </div>
            
            <div className="message-modal-footer">
              <button 
                className="modal-btn modal-btn-danger"
                onClick={() => {
                  deleteMessage(selectedMessageForModal.id)
                  closeModal()
                }}
              >
                🗑️ 刪除消息
              </button>
              <button className="modal-btn modal-btn-primary" onClick={closeModal}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}