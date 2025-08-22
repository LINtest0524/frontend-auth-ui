'use client'

import { useState, useEffect } from 'react'
import SunEditor from '@/components/SunEditor'
import { useUserStore } from '@/hooks/use-user-store'

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
  
  // 搜尋和篩選
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'SYSTEM' | 'USER' | 'ADMIN'>('ALL')
  const [filterRead, setFilterRead] = useState<'ALL' | 'read' | 'unread'>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'send' | 'broadcast'>('list')

  // 檢查是否有系統廣播權限
  const canUseBroadcast = () => {
    if (!currentUser?.role) return false
    return ['AGENT_SUPPORT', 'AGENT_OWNER', 'SUPER_ADMIN'].includes(currentUser.role)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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
      
      if (filterRead !== 'ALL') {
        params.append('isRead', filterRead === 'read' ? 'true' : 'false')
      }
      
      const response = await fetch(`/api/admin/messages?${params}`, {
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || data.users || [])
      } else {
        console.error('獲取用戶列表失敗:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('獲取用戶列表失敗:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchMessages()
  }

  const clearFilter = () => {
    setSearchTerm('')
    setFilterType('ALL')
    setFilterRead('ALL')
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
      const response = await fetch('/api/admin/messages/send', {
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
      const response = await fetch('/api/admin/messages/system-broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: broadcastTitle,
          content: broadcastContent
        })
      })

      if (response.ok) {
        alert('系統廣播發送成功！')
        setBroadcastTitle('')
        setBroadcastContent('')
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

  // 篩選消息
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.receiver.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.receiver.email.toLowerCase().includes(searchTerm.toLowerCase())
    
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
                  
                  <div className="b-form-group-2 fl4 w33 mb25">
                    <label htmlFor="filter-read">讀取狀態</label>
                    <select 
                      id="filter-read" 
                      value={filterRead} 
                      onChange={(e) => setFilterRead(e.target.value as any)} 
                      className="w60"
                    >
                      <option value="ALL">所有狀態</option>
                      <option value="read">已讀</option>
                      <option value="unread">未讀</option>
                    </select>
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
                      <th>狀態</th>
                      <th>發送時間</th>
                      <th>讀取時間</th>
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
                          {message.receiver.username} ({message.receiver.email})
                        </td>
                        <td>
                          <button className={`${message.isRead ? "b-btn-s3 b-btn-c4" : "b-btn-s3 b-btn-c3"}`}>
                            {message.isRead ? "已讀" : "未讀"}
                          </button>
                        </td>
                        <td>{formatDate(message.createdAt)}</td>
                        <td>{message.readAt ? formatDate(message.readAt) : '-'}</td>
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
            系統廣播將發送給所有用戶（客服人員、代理商老闆、超級管理員可使用）
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

    </div>
  )
}