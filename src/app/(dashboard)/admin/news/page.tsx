'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'
import "@/styles/pages/messages-admin.css"

type NewsItem = {
  id: number
  title: string
  summary: string
  category: string
  status: string
  publish_date: string
  view_count: number
  is_featured: boolean
  createdAt: string
}

type NewsResponse = {
  data: NewsItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminNewsPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // 分頁相關
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [inputLimit, setInputLimit] = useState(20)
  
  // 搜尋篩選相關
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const fetchNewsWithParams = async (customLimit?: number, customPage?: number) => {
    const currentLimit = Number(customLimit || limit)
    const currentPage = Number(customPage || page)
    
    // 強化分頁參數驗證
    if (!Number.isFinite(currentLimit) || !Number.isFinite(currentPage) || !user?.companyId) {
      return
    }
    
    // 分頁參數範圍限制
    if (currentLimit < 1 || currentLimit > 1000) {
      alert('每頁顯示數量必須在 1-1000 之間')
      return
    }
    
    if (currentPage < 1) {
      alert('頁碼必須大於 0')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
      })
      
      // 安全的搜尋參數處理
      const sanitizedSearchTerm = searchTerm.trim()
      if (sanitizedSearchTerm && sanitizedSearchTerm.length <= 100) {
        // 移除潛在的特殊字符，只保留安全字符
        const safeSearchTerm = sanitizedSearchTerm.replace(/[<>'"&]/g, '')
        if (safeSearchTerm) {
          params.append('search', safeSearchTerm)
        }
      }
      
      // 驗證狀態參數
      const validStatuses = ['ACTIVE', 'INACTIVE', 'DRAFT', 'published', 'draft', 'archived']
      if (selectedStatus && validStatuses.includes(selectedStatus)) {
        params.append('status', selectedStatus)
      }
      
      // 驗證分類參數
      const validCategories = ['GENERAL', 'ANNOUNCEMENT', 'PROMOTION', 'UPDATE', 'announcement', 'news', 'event', 'promotion']
      if (selectedCategory && validCategories.includes(selectedCategory)) {
        params.append('category', selectedCategory)
      }
      
      // 驗證日期格式
      if (createdFrom && /^\d{4}-\d{2}-\d{2}$/.test(createdFrom)) {
        params.append('createdFrom', createdFrom + ' 00:00:00')
      }
      if (createdTo && /^\d{4}-\d{2}-\d{2}$/.test(createdTo)) {
        params.append('createdTo', createdTo + ' 23:59:59')
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/news/admin/company/${user.companyId}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: NewsResponse = await response.json()

      if (result.data && Array.isArray(result.data)) {
        setNews(result.data)
        setTotalCount(result.total || 0)
        setTotalPages(result.totalPages || 1)
        setPage(result.page || 1)
        setLimit(result.limit || 20)
      } else {
        setNews([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (error) {
      // 安全錯誤處理：不輸出敏感資訊到控制台
      setNews([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchNews = () => fetchNewsWithParams(limit, page)

  const handleSearch = () => {
    setPage(1)
    setHasSearched(true)
    fetchNewsWithParams(limit, 1)
  }

  const clearFilter = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedCategory('')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
    setHasSearched(true)
    setTimeout(() => {
      fetchNewsWithParams(limit, 1)
    }, 100)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這則消息嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('刪除成功')
        fetchNews()
      } else {
        // 安全錯誤處理：根據狀態碼提供適當訊息
        const statusMessage = response.status === 404 ? '找不到指定的消息' :
                             response.status === 403 ? '權限不足，無法刪除此消息' :
                             '刪除失敗，請稍後再試'
        alert(statusMessage)
      }
    } catch (error) {
      // 安全錯誤處理：不輸出敏感資訊到控制台
      alert('刪除失敗，請檢查網路連線後再試')
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    return dayjs(dateString).format('YYYY-MM-DD HH:mm')
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'ACTIVE': <span className="status-badge status-active">✅ 已發布</span>,
      'INACTIVE': <span className="status-badge status-inactive">❌ 未發布</span>,
      'DRAFT': <span className="status-badge status-inactive">📝 草稿</span>,
      'published': <span className="status-badge status-active">✅ 已發布</span>,
      'draft': <span className="status-badge status-inactive">📝 草稿</span>,
      'archived': <span className="status-badge status-inactive">📦 已封存</span>,
    }
    return statusMap[status as keyof typeof statusMap] || <span className="status-badge">{status}</span>
  }

  const getCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'GENERAL': '一般消息',
      'ANNOUNCEMENT': '重要公告',
      'PROMOTION': '優惠活動',
      'UPDATE': '系統更新',
      'announcement': '公告',
      'news': '新聞',
      'event': '活動',
      'promotion': '優惠',
    }
    return categoryMap[category] || category
  }

  // 分頁邏輯 - 從 messages 頁面複製
  const renderPagination = () => {
    if (totalPages <= 1 || totalCount === 0) return null

    const pages: (number | string)[] = []

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      const start = Math.max(2, Number(page) - 2)
      const end = Math.min(totalPages - 1, Number(page) + 2)

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
            disabled={Number(page) === 1}
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
                className={`pagination-btn ${Number(page) === p ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={Number(page) === totalPages}
            className="pagination-btn"
          >
            下一頁 ➡️
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (hasSearched) {
      fetchNewsWithParams(limit, page)
    }
  }, [page, limit])

  // 頁面載入時自動搜尋所有資料
  useEffect(() => {
    if (!hasSearched && user?.companyId) {
      setHasSearched(true)
      fetchNews()
    }
  }, [user?.companyId])

  const quickSetDate = (period: string) => {
    const today = dayjs()
    let from = ''
    let to = ''

    switch (period) {
      case 'all':
        from = ''
        to = ''
        break
      case 'today':
        from = to = today.format('YYYY-MM-DD')
        break
      case 'yesterday':
        from = to = today.subtract(1, 'day').format('YYYY-MM-DD')
        break
      case '3days':
        from = today.subtract(3, 'day').format('YYYY-MM-DD')
        to = today.format('YYYY-MM-DD')
        break
      case 'thisMonth':
        from = today.startOf('month').format('YYYY-MM-DD')
        to = today.format('YYYY-MM-DD')
        break
      case 'lastMonth':
        from = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
        to = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
        break
    }

    setCreatedFrom(from)
    setCreatedTo(to)
  }

  return (
    <div className="messages-admin-container">
      {/* 頁面標題區域 */}
      <div className="messages-header">
        <h1>📰 最新消息管理</h1>
        <div className="header-actions">
          <button 
            onClick={() => router.push('/admin/news/new')} 
            className="btn-primary"
          >
            ➕ 新增消息
          </button>
        </div>
      </div>

      {/* 搜尋篩選區域 */}
      <div className="filter-section">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="filter-toggle"
        >
          <span>🔍 搜尋篩選</span>
          <span className={`filter-arrow ${isFilterOpen ? 'rotate' : ''}`}>
            ▼
          </span>
        </button>

        {isFilterOpen && (
          <div className="filter-content">
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="search-input" className="form-label">🔍 關鍵字搜尋</label>
                <input
                  type="text"
                  id="search-input"
                  placeholder="搜尋標題或內容..."
                  value={searchTerm}
                  onChange={(e) => {
                    // 輸入長度限制
                    const value = e.target.value
                    if (value.length <= 100) {
                      setSearchTerm(value)
                    }
                  }}
                  className="form-input"
                  maxLength={100}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status-select" className="form-label">📊 狀態</label>
                <select
                  id="status-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="">全部狀態</option>
                  <option value="ACTIVE">已發布</option>
                  <option value="INACTIVE">未發布</option>
                  <option value="DRAFT">草稿</option>
                  <option value="published">已發布</option>
                  <option value="draft">草稿</option>
                  <option value="archived">已封存</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category-select" className="form-label">📂 分類</label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-input"
                >
                  <option value="">全部分類</option>
                  <option value="GENERAL">一般消息</option>
                  <option value="ANNOUNCEMENT">重要公告</option>
                  <option value="PROMOTION">優惠活動</option>
                  <option value="UPDATE">系統更新</option>
                  <option value="announcement">公告</option>
                  <option value="news">新聞</option>
                  <option value="event">活動</option>
                  <option value="promotion">優惠</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group date-range-group">
                <label htmlFor="created-date-from" className="form-label">📅 建立時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    id="created-date-from"
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
                  <button onClick={() => quickSetDate("all")} className="btn-quick-date">全部</button>
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

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {!loading && (
        <div className="content-section">
          {/* 表格控制區域 */}
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
                  // 強化分頁驗證
                  const validLimit = Math.max(1, Math.min(1000, inputLimit));
                  if (inputLimit !== validLimit) {
                    alert('每頁顯示數量已調整為有效範圍 (1-1000)')
                    setInputLimit(validLimit)
                  }
                  setLimit(validLimit);
                  setPage(1);
                  setHasSearched(true);
                  setTimeout(() => {
                    fetchNewsWithParams(validLimit, 1);
                  }, 100);
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

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th className="w30">消息資訊</th>
                <th>分類</th>
                <th>狀態</th>
                <th>發布資訊</th>
                <th>統計</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-username">
                        {item.is_featured && (
                          <span className="role-badge role-super-admin" style={{ marginRight: '8px', fontSize: '10px' }}>
                            📌 置頂
                          </span>
                        )}
                        {/* 安全顯示：防止 XSS */}
                        {item.title?.replace(/<[^>]*>/g, '') || '未命名'}
                      </div>
                      <div className="user-id" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {/* 安全顯示：防止 XSS */}
                        {item.summary?.replace(/<[^>]*>/g, '') || '無摘要'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge role-agent-support">
                      {getCategoryName(item.category)}
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(item.status)}
                  </td>
                  <td>
                    <div className="login-info">
                      <div>🕒 {formatDateTime(item.publish_date)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        📅 {formatDateTime(item.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="created-by">
                      👁️ {item.view_count} 次瀏覽
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => router.push(`/admin/news/edit/${item.id}`)}
                        className="btn-edit"
                        title="編輯消息"
                      >
                        ✏️ 編輯
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item.id)}
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

          {/* 無資料顯示 */}
          {!loading && hasSearched && news.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的最新消息</p>
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("");
                  setSelectedCategory("");
                  clearFilter();
                }}
                className="btn-search"
                style={{ marginTop: '16px' }}
              >
                🔄 顯示全部消息
              </button>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  )
}