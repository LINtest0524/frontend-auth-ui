'use client'

import { useState, useEffect } from 'react'
import SunEditor from '@/components/SunEditor'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'
import '@/styles/pages/messages-admin.css'

interface Message {
  id: number
  title: string
  content: string
  senderId: number | null
  receiverId: number
  companyId: number
  isRead: boolean
  messageType: 'SYSTEM' | 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
  readAt: string | null
  sender?: {
    id: number
    username: string
    email: string
  }
  receiver: {
    id: number
    username: string
    email: string
  }
}

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface Tag {
  id: number
  name: string
  backgroundColor: string
  textColor: string
  shape: string
  isActive: boolean
}

export default function AdminMessagesPage() {
  const { user: currentUser } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // 分頁狀態
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [inputLimit, setInputLimit] = useState(limit)
  
  // 發送消息表單狀態
  const [receiverUsername, setReceiverUsername] = useState('')
  const [messageTitle, setMessageTitle] = useState('')
  const [messageContent, setMessageContent] = useState('')
  
  // 系統廣播表單狀態
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcastType, setBroadcastType] = useState<'GENERAL' | 'IMPORTANT' | 'MAINTENANCE' | 'NEW_MEMBER'>('GENERAL')
  const [sendToNewMembers, setSendToNewMembers] = useState<boolean | undefined>(undefined)
  const [validDays, setValidDays] = useState<number | undefined>(undefined)
  
  // 標籤群組發送狀態
  const [tagGroupTitle, setTagGroupTitle] = useState('')
  const [tagGroupContent, setTagGroupContent] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [sendingTagMessage, setSendingTagMessage] = useState(false)
  
  // 搜尋和篩選
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'SYSTEM' | 'USER' | 'ADMIN'>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'send' | 'broadcast' | 'tagGroup'>('list')
  
  // 時間篩選
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')

  // 消息操作相關狀態
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  // 檢查是否有系統廣播權限
  const canUseBroadcast = () => {
    if (!currentUser?.role) return false
    return ['AGENT_SUPPORT', 'AGENT_OWNER', 'SUPER_ADMIN'].includes(currentUser.role)
  }

  // 快速設定日期
  const quickSetDate = (type: string) => {
    const today = dayjs()
    let fromDate = ''
    let toDate = ''

    switch (type) {
      case 'today':
        fromDate = today.format('YYYY-MM-DD')
        toDate = today.format('YYYY-MM-DD')
        break
      case 'yesterday':
        const y = today.subtract(1, 'day')
        fromDate = y.format('YYYY-MM-DD')
        toDate = y.format('YYYY-MM-DD')
        break
      case '3days':
        fromDate = today.subtract(2, 'day').format('YYYY-MM-DD')
        toDate = today.format('YYYY-MM-DD')
        break
      case 'thisMonth':
        fromDate = today.startOf('month').format('YYYY-MM-DD')
        toDate = today.endOf('month').format('YYYY-MM-DD')
        break
      case 'lastMonth':
        const last = today.subtract(1, 'month')
        fromDate = last.startOf('month').format('YYYY-MM-DD')
        toDate = last.endOf('month').format('YYYY-MM-DD')
        break
    }

    setCreatedFrom(fromDate)
    setCreatedTo(toDate)
  }

  // 獲取標籤列表
  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('🏷️ 前端收到標籤數據:', data)
        setTags(data.tags || [])
        
        // 顯示調試信息
        if (data.debug) {
          console.log('📊 標籤統計:', {
            活躍標籤數量: data.debug.activeCount,
            總標籤數量: data.debug.totalCount,
            返回標籤數量: data.tags?.length || 0
          })
        }
      } else {
        console.error('獲取標籤列表失敗:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('獲取標籤列表失敗:', error)
    }
  }

  // 載入標籤列表
  useEffect(() => {
    if (canUseBroadcast()) {
      fetchTags()
    }
  }, [])

  // 當切換到標籤群組發送頁面時重新獲取標籤
  useEffect(() => {
    if (activeTab === 'tagGroup' && canUseBroadcast()) {
      fetchTags()
    }
  }, [activeTab])

  // 移除自動獲取用戶列表，改為手動輸入用戶名
  // useEffect(() => {
  //   fetchUsers()
  // }, [])

  const fetchMessages = async (useInitialFilter = false) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (filterType !== 'ALL') {
        params.append('messageType', filterType)
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      
      // 如果是初始載入，使用近3天的時間範圍，否則使用篩選條件中的時間
      if (useInitialFilter) {
        const today = dayjs()
        const threeDaysAgo = today.subtract(2, 'day').format('YYYY-MM-DD')
        const todayStr = today.format('YYYY-MM-DD')
        params.append('createdFrom', threeDaysAgo)
        params.append('createdTo', todayStr)
      } else {
        if (createdFrom) {
          params.append('createdFrom', createdFrom)
        }
        
        if (createdTo) {
          params.append('createdTo', createdTo)
        }
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.total || 0)
        setHasSearched(true)
      } else {
        console.error('API 錯誤:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('獲取消息失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 移除 fetchUsers 功能，改為直接輸入用戶名
  // const fetchUsers = async () => {
  //   try {
  //     const token = localStorage.getItem('token')
  //     const response = await fetch('/api/user?limit=1000', {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     })
  //     
  //     if (response.ok) {
  //       const data = await response.json()
  //       setUsers(data.data || data.users || [])
  //     } else {
  //       console.error('獲取用戶列表失敗:', response.status, response.statusText)
  //     }
  //   } catch (error) {
  //     console.error('獲取用戶列表失敗:', error)
  //   }
  // }

  const handleSearch = () => {
    setPage(1)
    fetchMessages()
  }

  const clearFilter = () => {
    setSearchTerm('')
    setFilterType('ALL')
    setCreatedFrom('')
    setCreatedTo('')
    setMessages([])
    setTotalPages(1)
    setTotalCount(0)
    setHasSearched(false)
    setPage(1)
  }

  const sendMessage = async () => {
    if (!receiverUsername.trim() || !messageTitle.trim() || !messageContent.trim()) {
      alert('請填寫所有必填欄位')
      return
    }

    setSendingMessage(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverUsername: receiverUsername,
          title: messageTitle,
          content: messageContent
        })
      })

      if (response.ok) {
        alert('消息發送成功！')
        setReceiverUsername('')
        setMessageTitle('')
        setMessageContent('')
        if (hasSearched) {
          fetchMessages()
        }
      } else {
        const error = await response.json()
        alert(`發送失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('發送消息失敗:', error)
      alert('發送消息失敗，請稍後再試')
    } finally {
      setSendingMessage(false)
    }
  }

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      alert('請填寫廣播標題和內容')
      return
    }

    setSendingMessage(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages/system-broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: broadcastTitle,
          content: broadcastContent,
          broadcastType: broadcastType,
          sendToNewMembers: sendToNewMembers,
          validDays: validDays
        })
      })

      if (response.ok) {
        alert('系統廣播發送成功！')
        setBroadcastTitle('')
        setBroadcastContent('')
        setBroadcastType('GENERAL')
        setSendToNewMembers(undefined)
        setValidDays(undefined)
        if (hasSearched) {
          fetchMessages()
        }
      } else {
        const error = await response.json()
        alert(`發送失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('發送廣播失敗:', error)
      alert('發送廣播失敗，請稍後再試')
    } finally {
      setSendingMessage(false)
    }
  }

  const sendTagGroupMessage = async () => {
    if (!tagGroupTitle.trim() || !tagGroupContent.trim()) {
      alert('請填寫標題和內容')
      return
    }

    if (selectedTagIds.length === 0) {
      alert('請選擇至少一個標籤')
      return
    }

    setSendingTagMessage(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages/send-by-tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: tagGroupTitle,
          content: tagGroupContent,
          tagIds: selectedTagIds
        })
      })

      if (response.ok) {
        alert('標籤群組消息發送成功！')
        setTagGroupTitle('')
        setTagGroupContent('')
        setSelectedTagIds([])
        if (hasSearched) {
          fetchMessages()
        }
      } else {
        const error = await response.json()
        alert(`發送失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('發送標籤群組消息失敗:', error)
      alert('發送標籤群組消息失敗，請稍後再試')
    } finally {
      setSendingTagMessage(false)
    }
  }

  // 消息操作函數
  const viewMessage = (message: Message) => {
    setSelectedMessage(message)
    setShowViewModal(true)
  }

  const editMessage = (message: Message) => {
    if (message.messageType !== 'SYSTEM') {
      alert('私信無法編輯，只有系統廣播可以編輯')
      return
    }
    setSelectedMessage(message)
    setEditTitle(message.title)
    setEditContent(message.content)
    setShowEditModal(true)
  }

  const deleteMessage = async (message: Message) => {
    if (!confirm(`確定要刪除這則消息嗎？\n標題：${message.title}`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages/${message.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('消息已刪除')
        if (hasSearched) {
          fetchMessages()
        }
      } else {
        const error = await response.json()
        alert(`刪除失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('刪除消息失敗:', error)
      alert('刪除消息失敗，請稍後再試')
    }
  }

  const saveEditMessage = async () => {
    if (!selectedMessage || !editTitle.trim() || !editContent.trim()) {
      alert('請填寫標題和內容')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages/${selectedMessage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent
        })
      })

      if (response.ok) {
        alert('消息已更新')
        setShowEditModal(false)
        setSelectedMessage(null)
        setEditTitle('')
        setEditContent('')
        if (hasSearched) {
          fetchMessages()
        }
      } else {
        const error = await response.json()
        alert(`更新失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('更新消息失敗:', error)
      alert('更新消息失敗，請稍後再試')
    }
  }

  // 篩選消息
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.receiver?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.receiver?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei', 
      hour12: false 
    })
  }

  const getMessageTypeText = (type: string) => {
    switch (type) {
      case 'SYSTEM': return '系統'
      case 'ADMIN': return '管理員'
      case 'USER': return '用戶'
      default: return type
    }
  }

  const getMessageTypeClass = (type: string) => {
    switch (type) {
      case 'SYSTEM': return 'b-btn-s3 b-btn-c3'
      case 'ADMIN': return 'b-btn-s3 b-btn-c4'
      case 'USER': return 'b-btn-s3 b-btn-c1'
      default: return 'b-btn-s3 b-btn-c1'
    }
  }

  // 分頁邏輯
  const renderPagination = () => {
    if (totalPages <= 1 || totalCount === 0) return null

    const pages: (number | string)[] = []

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      const start = Math.max(2, page - 2)
      const end = Math.min(totalPages - 1, page + 2)

      if (start > 2) {
        pages.push("...")
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          第 {page} 頁，共 {totalPages} 頁（總計 {totalCount} 筆資料）
        </div>

        <div className="pagination-buttons">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            ⬅️ 上一頁
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="pagination-btn" style={{cursor: "default"}}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`pagination-btn ${page === p ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            下一頁 ➡️
          </button>
        </div>
      </div>
    )
  }

  // 頁面載入時自動搜尋3日內資料
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true)
      fetchMessages(true) // 使用初始篩選條件
    }
  }, [])

  useEffect(() => {
    if (hasSearched) {
      fetchMessages()
    }
  }, [page, limit])

  return (
    <div className="messages-admin-container">
      
      {/* 標題和標籤切換 */}
      <div className="messages-header">
        <h1>站內信管理</h1>
        
        <div className="tab-navigation">
          <button 
            onClick={() => setActiveTab('list')} 
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          >
            📋 站內信列表
          </button>
          <button 
            onClick={() => setActiveTab('send')} 
            className={`tab-button ${activeTab === 'send' ? 'active' : ''}`}
          >
            ✉️ 發送私信
          </button>
          {canUseBroadcast() && (
            <button 
              onClick={() => setActiveTab('broadcast')} 
              className={`tab-button ${activeTab === 'broadcast' ? 'active' : ''}`}
            >
              📢 系統站內信
            </button>
          )}
          {canUseBroadcast() && (
            <button 
              onClick={() => setActiveTab('tagGroup')} 
              className={`tab-button ${activeTab === 'tagGroup' ? 'active' : ''}`}
            >
              🏷️ 標籤群組發送
            </button>
          )}
        </div>
      </div>

      {/* 消息列表標籤 */}
      {activeTab === 'list' && (
        <>
          {/* 篩選區域 */}
          <div className="filter-section">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="filter-toggle"
            >
              <span>🔍 篩選條件</span>
              <span className={`filter-arrow ${isFilterOpen ? "rotate" : ""}`}>▼</span>
            </button>

            {isFilterOpen && (
              <div className="filter-content">
                <div className="filter-grid">
                  <div className="form-group">
                    <label htmlFor="search-term" className="form-label">搜尋關鍵字</label>
                    <input 
                      type="text" 
                      placeholder="標題、內容、用戶名稱..." 
                      id="search-term" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="filter-type" className="form-label">消息類型</label>
                    <select 
                      id="filter-type" 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value as any)} 
                      className="form-select"
                    >
                      <option value="ALL">所有類型</option>
                      <option value="SYSTEM">系統消息</option>
                      <option value="ADMIN">管理員消息</option>
                      <option value="USER">用戶消息</option>
                    </select>
                  </div>

                  <div className="form-group date-range-group">
                    <label htmlFor="date-select-1" className="form-label">發送時間範圍</label>
                    <div className="date-inputs">
                      <input 
                        type="date" 
                        id="date-select-1" 
                        value={createdFrom} 
                        onChange={(e) => setCreatedFrom(e.target.value)} 
                        className="form-input" 
                      />
                      <span className="date-separator">至</span>
                      <input 
                        type="date" 
                        value={createdTo} 
                        onChange={(e) => setCreatedTo(e.target.value)} 
                        className="form-input" 
                      />
                    </div>
                    <div className="quick-date-buttons">
                      <button onClick={() => quickSetDate("today")} className="btn-quick-date">今日</button>
                      <button onClick={() => quickSetDate("yesterday")} className="btn-quick-date">昨日</button>
                      <button onClick={() => quickSetDate("3days")} className="btn-quick-date">近三日</button>
                      <button onClick={() => quickSetDate("thisMonth")} className="btn-quick-date">本月</button>
                      <button onClick={() => quickSetDate("lastMonth")} className="btn-quick-date">上月</button>
                    </div>
                  </div>
                </div>

                <div className="filter-actions">
                  <button onClick={handleSearch} className="btn-search">🔍 查詢</button>
                  <button onClick={clearFilter} className="btn-clear">🗑️ 清除</button>
                </div>
              </div>
            )}
          </div>

          {/* 載入中 */}
          {loading && (
            <div className="loading-spinner">
              <div>⏳ 載入中...</div>
            </div>
          )}

          {/* 消息列表 */}
          {!loading && hasSearched && (
            <div className="content-section">
              <div className="table-controls">
                <div className="pagination-control">
                  <label htmlFor="page-limit">每頁顯示：</label>
                  <input
                    type="number"
                    id="page-limit"
                    value={inputLimit}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) setInputLimit(val);
                    }}
                    min={1}
                    className="pagination-input"
                  />
                  <button
                    onClick={() => {
                      const validLimit = Math.max(1, inputLimit);
                      setLimit(validLimit);
                      setPage(1); // 重置到第一頁
                    }}
                    className="btn-search"
                  >
                    套用
                  </button>
                </div>
                <div className="pagination-info">
                  共 {totalCount} 筆資料
                </div>
              </div>

              <table className="modern-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>標題</th>
                    <th>內容預覽</th>
                    <th>類型</th>
                    <th>發送人</th>
                    <th>收件人</th>
                    <th>發送時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((message) => (
                    <tr key={message.id}>
                      <td>#{message.id}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          {message.title}
                        </div>
                      </td>
                      <td>
                        <div className="message-content">
                          {message.content.replace(/<[^>]*>/g, '')}
                        </div>
                      </td>
                      <td>
                        <span className={`message-type-badge ${
                          message.messageType === 'SYSTEM' ? 'type-system' :
                          message.messageType === 'ADMIN' ? 'type-admin' : 'type-user'
                        }`}>
                          {getMessageTypeText(message.messageType)}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        {message.sender ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>{message.sender.username}</div>
                            <div>{message.sender.email}</div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: '500', color: '#4f46e5' }}>系統</span>
                            {message.messageType === 'SYSTEM' && message.receiver?.username !== '所有會員' && (
                              <div style={{ fontSize: '10px', color: '#ef4444' }}>🏷️ 標籤群組</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {message.receiver?.username || '所有會員'}
                          </div>
                          {message.receiver?.email && <div>{message.receiver?.email}</div>}
                          {(!message.receiver || message.receiver?.username === '所有會員') && message.messageType === 'SYSTEM' && (
                            <div style={{ fontSize: '10px', color: '#10b981' }}>📢 全站廣播</div>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatDate(message.createdAt)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => viewMessage(message)}
                            className="btn-view"
                            title="查看詳情"
                          >
                            👁️ 查看
                          </button>
                          {message.messageType === 'SYSTEM' && (
                            <button 
                              onClick={() => editMessage(message)}
                              className="btn-edit"
                              title="編輯廣播"
                            >
                              ✏️ 編輯
                            </button>
                          )}
                          <button 
                            onClick={() => deleteMessage(message)}
                            className="btn-delete"
                            title="刪除消息"
                          >
                            🗑️ 刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && hasSearched && filteredMessages.length === 0 && (
                <div className="no-data">
                  <img src="/no-information.webp" alt="無資料" />
                  <p>查無符合條件的消息</p>
                </div>
              )}

              {renderPagination()}
            </div>
          )}
        </>
      )}

      {/* 發送消息標籤 */}
      {activeTab === 'send' && (
        <div className="form-section">
          <h2>發送消息給特定用戶</h2>
          <p>向指定用戶發送個人消息，支援富文本編輯功能</p>
          
          <div className="form-row">
            <label htmlFor="receiver-username">收件人帳號 *</label>
            <input
              type="text"
              id="receiver-username"
              value={receiverUsername}
              onChange={(e) => setReceiverUsername(e.target.value)}
              placeholder="請輸入收件人的帳號"
            />
          </div>
          
          <div className="form-row">
            <label htmlFor="message-title">消息標題 *</label>
            <input
              type="text"
              id="message-title"
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              placeholder="請輸入消息標題"
            />
          </div>
          
          <div className="form-row">
            <label htmlFor="message-content">消息內容 *</label>
            <div className="editor-wrapper">
              <SunEditor
                value={messageContent}
                onChange={(content) => setMessageContent(content)}
                placeholder="請輸入消息內容..."
                height="300px"
              />
              <div className="editor-hint">
                💡 提示：支援富文本編輯，可插入圖片、表格、連結等豐富內容
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              onClick={sendMessage} 
              disabled={sendingMessage}
              className="btn-primary"
            >
              {sendingMessage ? '⏳ 發送中...' : '✉️ 發送消息'}
            </button>
          </div>
        </div>
      )}

      {/* 系統廣播標籤 */}
      {activeTab === 'broadcast' && !canUseBroadcast() && (
        <div className="permission-notice">
          <h3>⚠️ 權限不足</h3>
          <p>系統廣播功能僅限以下角色使用：</p>
          <ul>
            <li>• 客服人員 (AGENT_SUPPORT)</li>
            <li>• 代理商老闆 (AGENT_OWNER)</li>
            <li>• 超級管理員 (SUPER_ADMIN)</li>
          </ul>
          <p>您目前的角色：<strong>{currentUser?.role || '未知'}</strong></p>
        </div>
      )}

      {/* 標籤群組發送標籤 */}
      {activeTab === 'tagGroup' && !canUseBroadcast() && (
        <div className="permission-notice">
          <h3>⚠️ 權限不足</h3>
          <p>標籤群組發送功能僅限以下角色使用：</p>
          <ul>
            <li>• 客服人員 (AGENT_SUPPORT)</li>
            <li>• 代理商老闆 (AGENT_OWNER)</li>
            <li>• 超級管理員 (SUPER_ADMIN)</li>
          </ul>
          <p>您目前的角色：<strong>{currentUser?.role || '未知'}</strong></p>
        </div>
      )}

      {activeTab === 'tagGroup' && canUseBroadcast() && (
        <div className="form-section">
          <h2>標籤群組發送</h2>
          <p>向擁有特定標籤的會員發送系統消息，支援多標籤選擇（客服人員、代理商老闆、超級管理員可使用）</p>
          
          <div className="form-row">
            <label htmlFor="tag-group-title">消息標題 *</label>
            <input
              type="text"
              id="tag-group-title"
              value={tagGroupTitle}
              onChange={(e) => setTagGroupTitle(e.target.value)}
              placeholder="請輸入消息標題"
            />
          </div>

          <div className="form-row">
            <label>選擇會員標籤 *</label>
            <div className="tag-selection-grid">
              {tags.length === 0 && (
                <p className="no-tags-message">目前沒有可用的標籤，請先到「標籤管理」新增標籤</p>
              )}
              {tags.map(tag => (
                <div key={tag.id} className="tag-checkbox-item">
                  <input
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.includes(tag.id)}
                    disabled={!tag.isActive}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTagIds([...selectedTagIds, tag.id])
                      } else {
                        setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))
                      }
                    }}
                  />
                  <label htmlFor={`tag-${tag.id}`} className="tag-label">
                    <span 
                      className={`tag-preview ${tag.shape} ${!tag.isActive ? 'inactive' : ''}`}
                      style={{ 
                        backgroundColor: tag.backgroundColor, 
                        color: tag.textColor,
                        opacity: tag.isActive ? 1 : 0.5
                      }}
                    >
                      {tag.name}
                      {!tag.isActive && <span style={{ fontSize: '10px' }}> (停用)</span>}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            {selectedTagIds.length > 0 && (
              <div className="selected-tags-info">
                已選擇 {selectedTagIds.length} 個標籤：
                {selectedTagIds.map(id => {
                  const tag = tags.find(t => t.id === id)
                  return tag ? (
                    <span 
                      key={id}
                      className={`selected-tag ${tag.shape}`}
                      style={{ 
                        backgroundColor: tag.backgroundColor, 
                        color: tag.textColor 
                      }}
                    >
                      {tag.name}
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
          
          <div className="form-row">
            <label htmlFor="tag-group-content">消息內容 *</label>
            <div className="editor-wrapper">
              <SunEditor
                value={tagGroupContent}
                onChange={(content) => setTagGroupContent(content)}
                placeholder="請輸入消息內容..."
                height="300px"
              />
              <div className="editor-hint">
                🏷️ 提示：此消息將發送給所有擁有選中標籤的會員
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              onClick={sendTagGroupMessage} 
              disabled={sendingTagMessage || selectedTagIds.length === 0}
              className="btn-tag-group"
            >
              {sendingTagMessage ? '⏳ 發送中...' : '🏷️ 發送標籤群組消息'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && canUseBroadcast() && (
        <div className="form-section">
          <h2>系統廣播消息</h2>
          <p>系統廣播支援多種類型和推送規則，可根據廣播性質決定是否補發給新會員（客服人員、代理商老闆、超級管理員可使用）</p>
          
          <div className="form-row">
            <label htmlFor="broadcast-title">廣播標題 *</label>
            <input
              type="text"
              id="broadcast-title"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="請輸入廣播標題"
            />
          </div>

          <div className="form-row">
            <label htmlFor="broadcast-type">廣播類型 *</label>
            <select
              id="broadcast-type"
              value={broadcastType}
              onChange={(e) => {
                const newType = e.target.value as 'GENERAL' | 'IMPORTANT' | 'MAINTENANCE' | 'NEW_MEMBER'
                setBroadcastType(newType)
                // 根據類型自動設定是否補發給新會員
                if (newType === 'IMPORTANT' || newType === 'MAINTENANCE' || newType === 'NEW_MEMBER') {
                  setSendToNewMembers(true)
                } else {
                  setSendToNewMembers(false)
                }
              }}
            >
              <option value="GENERAL">一般廣播 - 行銷、促銷、活動</option>
              <option value="IMPORTANT">重要廣播 - 制度變更、功能調整</option>
              <option value="MAINTENANCE">維護廣播 - 系統維護、服務中斷</option>
              <option value="NEW_MEMBER">新會員廣播 - 歡迎訊息、教學指引</option>
            </select>
          </div>

          <div className="form-row">
            <label>推送規則</label>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="send-to-new-members"
                checked={sendToNewMembers === true}
                onChange={(e) => setSendToNewMembers(e.target.checked)}
              />
              <label htmlFor="send-to-new-members">補發給新會員</label>
            </div>
            
            {(broadcastType === 'MAINTENANCE' || broadcastType === 'IMPORTANT') && (
              <div className="number-input-group">
                <label htmlFor="valid-days">有效天數（可選）：</label>
                <input
                  type="number"
                  id="valid-days"
                  min="1"
                  max="365"
                  value={validDays || ''}
                  onChange={(e) => setValidDays(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="例如：2（表示2天後新會員不再收到）"
                />
                <div className="editor-hint">
                  設定後，超過指定天數的新會員將不會收到此廣播。不設定則永久有效。
                </div>
              </div>
            )}
            
            <div className="editor-hint">
              {broadcastType === 'GENERAL' && '📢 一般廣播：發送當下的所有會員，不補發給新會員'}
              {broadcastType === 'IMPORTANT' && '⚠️ 重要廣播：所有會員（含新註冊），建議補發'}
              {broadcastType === 'MAINTENANCE' && '🔧 維護廣播：所有會員，建議補發（可設定有效期）'}
              {broadcastType === 'NEW_MEMBER' && '👋 新會員廣播：只給新註冊會員，自動補發'}
            </div>
          </div>
          
          <div className="form-row">
            <label htmlFor="broadcast-content">廣播內容 *</label>
            <div className="editor-wrapper">
              <SunEditor
                value={broadcastContent}
                onChange={(content) => setBroadcastContent(content)}
                placeholder="請輸入廣播內容..."
                height="300px"
              />
              <div className="editor-hint">
                📢 提示：系統廣播支援富文本編輯，將發送給所有用戶
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              onClick={sendBroadcast} 
              disabled={sendingMessage}
              className="btn-broadcast"
            >
              {sendingMessage ? '⏳ 發送中...' : '📢 發送系統廣播'}
            </button>
          </div>
        </div>
      )}

      {/* 查看消息模態框 */}
      {showViewModal && selectedMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📋 消息詳情</h3>
            
            <div className="modal-detail-item">
              <div className="modal-detail-label">ID：</div>
              <div className="modal-detail-value">#{selectedMessage.id}</div>
            </div>
            
            <div className="modal-detail-item">
              <div className="modal-detail-label">類型：</div>
              <div className="modal-detail-value">
                <span className={`message-type-badge ${
                  selectedMessage.messageType === 'SYSTEM' ? 'type-system' :
                  selectedMessage.messageType === 'ADMIN' ? 'type-admin' : 'type-user'
                }`}>
                  {getMessageTypeText(selectedMessage.messageType)}
                </span>
              </div>
            </div>
            
            <div className="modal-detail-item">
              <div className="modal-detail-label">標題：</div>
              <div className="modal-detail-value">{selectedMessage.title}</div>
            </div>
            
            <div className="modal-detail-item">
              <div className="modal-detail-label">發送人：</div>
              <div className="modal-detail-value">
                {selectedMessage.sender ? `${selectedMessage.sender.username} (${selectedMessage.sender.email})` : '系統'}
              </div>
            </div>
            
            <div className="modal-detail-item">
              <div className="modal-detail-label">收件人：</div>
              <div className="modal-detail-value">
                {selectedMessage.receiver?.email ? 
                  `${selectedMessage.receiver?.username} (${selectedMessage.receiver?.email})` : 
                  (selectedMessage.receiver?.username || '所有會員')
                }
              </div>
            </div>
            
            <div className="modal-detail-item">
              <div className="modal-detail-label">發送時間：</div>
              <div className="modal-detail-value">{formatDate(selectedMessage.createdAt)}</div>
            </div>
            
            <div className="modal-detail-item">
              <div className="modal-detail-label">內容：</div>
              <div className="modal-content-display" dangerouslySetInnerHTML={{ __html: selectedMessage.content }}>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowViewModal(false)}
                className="btn-secondary"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯消息模態框 */}
      {showEditModal && selectedMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>✏️ 編輯系統廣播</h3>
            
            <div className="form-row">
              <label htmlFor="edit-title">標題：</label>
              <input
                type="text"
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            
            <div className="form-row">
              <label htmlFor="edit-content">內容：</label>
              <div className="editor-wrapper">
                <SunEditor
                  value={editContent}
                  onChange={(content) => setEditContent(content)}
                  placeholder="請輸入消息內容..."
                  height="300px"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedMessage(null)
                  setEditTitle('')
                  setEditContent('')
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button 
                onClick={saveEditMessage}
                className="btn-primary"
              >
                💾 保存
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}