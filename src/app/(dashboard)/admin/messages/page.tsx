'use client'

import { useState, useEffect } from 'react'
import SunEditor from '@/components/SunEditor'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'

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

export default function AdminMessagesPage() {
  const { user: currentUser } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
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
  
  // 搜尋和篩選
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'SYSTEM' | 'USER' | 'ADMIN'>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'send' | 'broadcast'>('list')
  
  // 時間篩選
  const [createdFrom, setCreatedFrom] = useState(() => {
    const today = dayjs()
    return today.subtract(2, 'day').format('YYYY-MM-DD')
  })
  const [createdTo, setCreatedTo] = useState(() => {
    const today = dayjs()
    return today.format('YYYY-MM-DD')
  })

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

  // 移除自動獲取用戶列表，改為手動輸入用戶名
  // useEffect(() => {
  //   fetchUsers()
  // }, [])

  const fetchMessages = async () => {
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
      
      if (createdFrom) {
        params.append('createdFrom', createdFrom)
      }
      
      if (createdTo) {
        params.append('createdTo', createdTo)
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
    if (totalPages <= 1) return null

    const pages: (number | string)[] = []
    const showPages = 5

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return (
      <div className="fo5 w100 b-data-tables_munber mb15">
        <p>
          目前第 {page} 頁，共 {totalPages} 頁（共 {totalCount} 筆資料）
        </p>

        <div className="tables_munber">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className=""
          >
            上一頁
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`${page === p ? "pagehover" : ""}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className=""
          >
            下一頁
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (hasSearched) {
      fetchMessages()
    }
  }, [page, limit])

  return (
    <div className="b-bigbox-all w100">
      
      {/* 標題和標籤切換 */}
      <div className="b-ibox mb30">
        <h1>消息管理</h1>
        
        <div className="b-ibox-s">
          <div className="fl4 w100 mb20">
            <button 
              onClick={() => setActiveTab('list')} 
              className={`b-btn-s2 mr10 ${activeTab === 'list' ? 'b-btn-c4' : 'b-btn-c1'}`}
            >
              消息列表
            </button>
            <button 
              onClick={() => setActiveTab('send')} 
              className={`b-btn-s2 mr10 ${activeTab === 'send' ? 'b-btn-c4' : 'b-btn-c1'}`}
            >
              發送消息
            </button>
            {canUseBroadcast() && (
              <button 
                onClick={() => setActiveTab('broadcast')} 
                className={`b-btn-s2 ${activeTab === 'broadcast' ? 'b-btn-c4' : 'b-btn-c1'}`}
              >
                系統廣播
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表標籤 */}
      {activeTab === 'list' && (
        <>
          {/* 篩選區域 */}
          <div className="b-ibox mb30">
            <div className="b-ibox-s">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="b-search-btn w100"
              >
                篩選
                <span className={`i-arrow ${isFilterOpen ? "rotate" : ""}`}></span>
              </button>

              {isFilterOpen && (
                <div className="b-search-box fl1 w100 mt15">
                  <div className="b-form-group-2 fl4 w33 mb25">
                    <label htmlFor="search-term">搜尋</label>
                    <input 
                      type="text" 
                      placeholder="標題、內容、用戶..." 
                      id="search-term" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="w60" 
                    />
                  </div>

                  <div className="b-form-group-2 fl4 w33 mb25">
                    <label htmlFor="filter-type">消息類型</label>
                    <select 
                      id="filter-type" 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value as any)} 
                      className="w60"
                    >
                      <option value="ALL">所有類型</option>
                      <option value="SYSTEM">系統消息</option>
                      <option value="ADMIN">管理員消息</option>
                      <option value="USER">用戶消息</option>
                    </select>
                  </div>

                  <div className="w50 fd1 mb25">
                    <div className="b-form-group-2 fl4 w100 mb10">
                      <label htmlFor="date-select-1">發送時間</label>
                      <div className="w70 fl4">
                        <input 
                          type="date" 
                          id="date-select-1" 
                          value={createdFrom} 
                          onChange={(e) => setCreatedFrom(e.target.value)} 
                          className="date-select flex1" 
                        />
                        <span className="dateto">到</span>
                        <input 
                          type="date" 
                          value={createdTo} 
                          onChange={(e) => setCreatedTo(e.target.value)} 
                          className="date-select flex1" 
                        />
                      </div>
                    </div>

                    <div className="b-form-group-2 w100 fl4">
                      <div className="b-date-fast fl4 w70 ml132">
                        <button onClick={() => quickSetDate("today")}>今日</button>
                        <button onClick={() => quickSetDate("yesterday")}>昨日</button>
                        <button onClick={() => quickSetDate("3days")}>近三日</button>
                        <button onClick={() => quickSetDate("thisMonth")}>本月</button>
                        <button onClick={() => quickSetDate("lastMonth")}>上月</button>
                      </div>
                    </div>
                  </div>

                  <div className="fl4 w100 b-btnbox">
                    <button onClick={handleSearch} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
                    <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 載入中 */}
          {loading && <p>載入中...</p>}

          {/* 消息列表 */}
          {!loading && hasSearched && (
            <div className="b-ibox">
              <div className="b-ibox-s">
                <div className="w100 fo5 mb15">
                  <div className="w50 fl4">
                    <label htmlFor="page-limit">每頁&nbsp;</label>
                    <input
                      type="number"
                      id="page-limit"
                      value={inputLimit}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val)) setInputLimit(val);
                      }}
                      min={1}
                      className="txtbox1 mr20"
                    />
                    <button
                      onClick={() => {
                        const validLimit = Math.max(1, inputLimit);
                        setLimit(validLimit);
                      }}
                      className="ml10 b-btn-s2 b-btn-c4"
                    >
                      顯示筆數
                    </button>
                  </div>
                </div>

                <table className="b-table-box admin-table mb15">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>標題</th>
                      <th>內容</th>
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
                        <td>{message.id}</td>
                        <td>{message.title}</td>
                        <td>
                          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {message.content}
                          </div>
                        </td>
                        <td>
                          <button className={getMessageTypeClass(message.messageType)}>
                            {getMessageTypeText(message.messageType)}
                          </button>
                        </td>
                        <td>
                          {message.sender ? `${message.sender.username} (${message.sender.email})` : '系統'}
                        </td>
                        <td>
                          {message.receiver.email ? 
                            `${message.receiver.username} (${message.receiver.email})` : 
                            message.receiver.username
                          }
                        </td>
                        <td>{formatDate(message.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => viewMessage(message)}
                              className="b-btn-s3 b-btn-c1"
                              title="查看詳情"
                            >
                              查看
                            </button>
                            {message.messageType === 'SYSTEM' && (
                              <button 
                                onClick={() => editMessage(message)}
                                className="b-btn-s3 b-btn-c4"
                                title="編輯廣播"
                              >
                                編輯
                              </button>
                            )}
                            <button 
                              onClick={() => deleteMessage(message)}
                              className="b-btn-s3 b-btn-c2"
                              title="刪除消息"
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!loading && hasSearched && filteredMessages.length === 0 && (
                  <div className="b-no-information w100 fd5">
                    <img src="/no-information.webp" alt="無資料" className="mb25" />
                    <p>查無資料</p>
                  </div>
                )}

                {renderPagination()}
              </div>
            </div>
          )}
        </>
      )}

      {/* 發送消息標籤 */}
      {activeTab === 'send' && (
        <div className="b-ibox">
          <h2>發送消息給特定用戶</h2>
          <div className="b-ibox-s">
            <div className="b-search-box fl1 w100">
              <div className="b-form-group-2 fl4 w100 mb25">
                <label htmlFor="receiver-username">收件人帳號 *</label>
                <input
                  type="text"
                  id="receiver-username"
                  value={receiverUsername}
                  onChange={(e) => setReceiverUsername(e.target.value)}
                  placeholder="請輸入收件人的帳號"
                  className="w60"
                />
              </div>
              
              <div className="b-form-group-2 fl4 w100 mb25">
                <label htmlFor="message-title">消息標題 *</label>
                <input
                  type="text"
                  id="message-title"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="請輸入消息標題"
                  className="w60"
                />
              </div>
              
              <div className="b-form-group-2 fl4 w100 mb25">
                <label htmlFor="message-content">消息內容 *</label>
                <div style={{ width: '60%' }}>
                  <div className="suneditor-wrapper txtbox-9">
                    <SunEditor
                      value={messageContent}
                      onChange={(content) => setMessageContent(content)}
                      placeholder="請輸入消息內容..."
                      height="300px"
                    />
                  </div>
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    提示：支援富文本編輯，可插入圖片、表格、連結等豐富內容
                  </small>
                </div>
              </div>
              
              <div className="fl4 w100 b-btnbox">
                <button 
                  onClick={sendMessage} 
                  disabled={sendingMessage}
                  className="b-btn-s2 b-btn-c4"
                >
                  {sendingMessage ? '發送中...' : '發送消息'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 系統廣播標籤 */}
      {activeTab === 'broadcast' && !canUseBroadcast() && (
        <div className="b-ibox">
          <div className="b-ibox-s">
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: '#fff3cd', 
              borderRadius: '8px', 
              border: '1px solid #ffc107' 
            }}>
              <h3 style={{ color: '#856404', marginBottom: '15px' }}>⚠️ 權限不足</h3>
              <p style={{ color: '#856404', fontSize: '16px', marginBottom: '10px' }}>
                系統廣播功能僅限以下角色使用：
              </p>
              <ul style={{ 
                color: '#856404', 
                fontSize: '14px', 
                listStyle: 'none', 
                padding: 0,
                margin: '15px 0'
              }}>
                <li>• 客服人員 (AGENT_SUPPORT)</li>
                <li>• 代理商老闆 (AGENT_OWNER)</li>
                <li>• 超級管理員 (SUPER_ADMIN)</li>
              </ul>
              <p style={{ color: '#856404', fontSize: '14px' }}>
                您目前的角色：{currentUser?.role || '未知'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && canUseBroadcast() && (
        <div className="b-ibox">
          <h2>系統廣播消息</h2>
          <p className="mb20" style={{ color: '#666' }}>
            系統廣播支援多種類型和推送規則，可根據廣播性質決定是否補發給新會員（客服人員、代理商老闆、超級管理員可使用）
          </p>
          <div className="b-ibox-s">
            <div className="b-search-box fl1 w100">
              <div className="b-form-group-2 fl4 w100 mb25">
                <label htmlFor="broadcast-title">廣播標題 *</label>
                <input
                  type="text"
                  id="broadcast-title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="請輸入廣播標題"
                  className="w60"
                />
              </div>

              <div className="b-form-group-2 fl4 w100 mb25">
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
                  className="w60"
                >
                  <option value="GENERAL">一般廣播 - 行銷、促銷、活動</option>
                  <option value="IMPORTANT">重要廣播 - 制度變更、功能調整</option>
                  <option value="MAINTENANCE">維護廣播 - 系統維護、服務中斷</option>
                  <option value="NEW_MEMBER">新會員廣播 - 歡迎訊息、教學指引</option>
                </select>
              </div>

              <div className="b-form-group-2 fl4 w100 mb25">
                <label>推送規則</label>
                <div style={{ width: '60%' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={sendToNewMembers === true}
                      onChange={(e) => setSendToNewMembers(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    補發給新會員
                  </label>
                  
                  {(broadcastType === 'MAINTENANCE' || broadcastType === 'IMPORTANT') && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        有效天數（可選）：
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={validDays || ''}
                        onChange={(e) => setValidDays(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="例如：2（表示2天後新會員不再收到）"
                        style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
                      />
                      <small style={{ color: '#666', display: 'block' }}>
                        設定後，超過指定天數的新會員將不會收到此廣播。不設定則永久有效。
                      </small>
                    </div>
                  )}
                  
                  <small style={{ color: '#666', display: 'block' }}>
                    {broadcastType === 'GENERAL' && '一般廣播：發送當下的所有會員，不補發給新會員'}
                    {broadcastType === 'IMPORTANT' && '重要廣播：所有會員（含新註冊），建議補發'}
                    {broadcastType === 'MAINTENANCE' && '維護廣播：所有會員，建議補發（可設定有效期）'}
                    {broadcastType === 'NEW_MEMBER' && '新會員廣播：只給新註冊會員，自動補發'}
                  </small>
                </div>
              </div>
              
              <div className="b-form-group-2 fl4 w100 mb25">
                <label htmlFor="broadcast-content">廣播內容 *</label>
                <div style={{ width: '60%' }}>
                  <div className="suneditor-wrapper txtbox-9">
                    <SunEditor
                      value={broadcastContent}
                      onChange={(content) => setBroadcastContent(content)}
                      placeholder="請輸入廣播內容..."
                      height="300px"
                    />
                  </div>
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    提示：系統廣播支援富文本編輯，將發送給所有用戶
                  </small>
                </div>
              </div>
              
              <div className="fl4 w100 b-btnbox">
                <button 
                  onClick={sendBroadcast} 
                  disabled={sendingMessage}
                  className="b-btn-s2 b-btn-c3"
                >
                  {sendingMessage ? '發送中...' : '發送系統廣播'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看消息模態框 */}
      {showViewModal && selectedMessage && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '80%',
            maxHeight: '80%',
            overflow: 'auto',
            minWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              消息詳情
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>ID：</strong>{selectedMessage.id}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>類型：</strong>
              <span className={getMessageTypeClass(selectedMessage.messageType)} style={{ marginLeft: '10px' }}>
                {getMessageTypeText(selectedMessage.messageType)}
              </span>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>標題：</strong>{selectedMessage.title}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>發送人：</strong>
              {selectedMessage.sender ? `${selectedMessage.sender.username} (${selectedMessage.sender.email})` : '系統'}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>收件人：</strong>
              {selectedMessage.receiver.email ? 
                `${selectedMessage.receiver.username} (${selectedMessage.receiver.email})` : 
                selectedMessage.receiver.username
              }
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>發送時間：</strong>{formatDate(selectedMessage.createdAt)}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <strong>內容：</strong>
              <div style={{ 
                marginTop: '10px', 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                backgroundColor: '#f9f9f9',
                minHeight: '100px'
              }} dangerouslySetInnerHTML={{ __html: selectedMessage.content }}>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <button 
                onClick={() => setShowViewModal(false)}
                className="b-btn-s2 b-btn-c1"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯消息模態框 */}
      {showEditModal && selectedMessage && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '80%',
            maxHeight: '80%',
            overflow: 'auto',
            minWidth: '600px'
          }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              編輯系統廣播
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                標題：
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                內容：
              </label>
              <div className="suneditor-wrapper txtbox-9">
                <SunEditor
                  value={editContent}
                  onChange={(content) => setEditContent(content)}
                  placeholder="請輸入消息內容..."
                  height="300px"
                />
              </div>
            </div>
            
            <div style={{ textAlign: 'right', gap: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedMessage(null)
                  setEditTitle('')
                  setEditContent('')
                }}
                className="b-btn-s2 b-btn-c1"
              >
                取消
              </button>
              <button 
                onClick={saveEditMessage}
                className="b-btn-s2 b-btn-c4"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}