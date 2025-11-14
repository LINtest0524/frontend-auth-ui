'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'
import '@/styles/pages/users.css'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { toTaiwanDisplayTime, fromDatetimeLocalToTaiwan } from '@/lib/timeUtils'
import Pagination from '@/components/ui/Pagination'

type Article = {
  id: number
  title: string
  summary: string
  status: string
  categoryId: number
  category: {
    id: number
    name: string
    slug: string
  }
  view_count: number
  is_featured: boolean
  publish_date: string
  createdAt: string
}

type ArticleResponse = {
  data: Article[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const statusMap: Record<string, string> = {
  ACTIVE: "已發布",
  INACTIVE: "已下架", 
  DRAFT: "草稿",
}

export default function ArticlesPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [inputLimit, setInputLimit] = useState(20)
  const [limit, setLimit] = useState(20)
  
  // 發布時間篩選 (datetime-local 格式)
  const [publishFrom, setPublishFrom] = useState('')
  const [publishTo, setPublishTo] = useState('')

  useEffect(() => {
    if (user?.companyId) {
      fetchCategories()
      if (hasSearched) {
        fetchArticles()
      }
    }
  }, [user?.companyId, currentPage, limit])

  // 頁面載入時自動搜尋
  useEffect(() => {
    if (!hasSearched && user?.companyId) {
      setHasSearched(true)
      fetchArticles()
    }
  }, [user?.companyId])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/company/${user?.companyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        // 安全錯誤處理：不輸出敏感資訊
        if (response.status === 403) {
          alert('權限不足，無法存取文章分類')
        }
      }
    } catch (error) {
      // 安全錯誤處理：不輸出敏感資訊到控制台
      // 分類載入失敗時靜默處理，不影響主要功能
    }
  }

  const fetchArticles = async () => {
    setLoading(true)
    try {
      // 安全驗證分頁參數
      const validPage = Math.max(1, currentPage)
      const validLimit = Math.max(1, Math.min(1000, limit))
      
      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: validLimit.toString(),
      })
      
      // 安全的搜尋參數處理
      const sanitizedSearchTerm = searchTerm.trim()
      if (sanitizedSearchTerm && sanitizedSearchTerm.length <= 200) {
        // 移除潛在的特殊字符，只保留安全字符
        const safeSearchTerm = sanitizedSearchTerm.replace(/[<>'"&]/g, '')
        if (safeSearchTerm) {
          params.append('search', safeSearchTerm)
        }
      }
      
      // 驗證狀態參數
      const validStatuses = ['ACTIVE', 'INACTIVE', 'DRAFT']
      if (selectedStatus && validStatuses.includes(selectedStatus)) {
        params.append('status', selectedStatus)
      }
      
      // 驗證分類參數
      if (selectedCategory && /^\d+$/.test(selectedCategory)) {
        params.append('categoryId', selectedCategory)
      }
      
      // 發布時間範圍篩選
      if (publishFrom && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(publishFrom)) {
        const fromTime = fromDatetimeLocalToTaiwan(publishFrom, false)
        params.append('publishFrom', fromTime)
      }
      
      if (publishTo && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(publishTo)) {
        const toTime = fromDatetimeLocalToTaiwan(publishTo, true)
        params.append('publishTo', toTime)
      }

      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/articles/admin/company/${user?.companyId}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data: ArticleResponse = await response.json()
        setArticles(data.data)
        setTotalPages(data.totalPages)
        setTotalCount(data.total)
      } else {
        // 安全錯誤處理：根據狀態碼提供適當訊息
        if (response.status === 404) {
          alert('找不到文章資料')
        } else if (response.status === 403) {
          alert('權限不足，無法存取文章')
        } else {
          alert('載入文章失敗，請稍後再試')
        }
        setArticles([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (error) {
      // 安全錯誤處理：不輸出敏感資訊到控制台
      alert('載入失敗，請檢查網路連線後再試')
      setArticles([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這篇文章嗎？')) return

    try {
      const token = getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/articles/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        alert('文章刪除成功')
        fetchArticles()
      } else {
        // 安全錯誤處理：根據狀態碼提供適當訊息
        const statusMessage = response.status === 404 ? '找不到指定的文章' :
                             response.status === 403 ? '權限不足，無法刪除此文章' :
                             response.status === 409 ? '此文章正在使用中，無法刪除' :
                             '刪除失敗，請稍後再試'
        alert(statusMessage)
      }
    } catch (error) {
      // 安全錯誤處理：不輸出敏感資訊到控制台
      alert('刪除失敗，請檢查網路連線後再試')
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setHasSearched(true)
    setCurrentPage(1)
    await new Promise(resolve => setTimeout(resolve, 50))
    fetchArticles()
  }

  const clearFilter = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedCategory('')
    setPublishFrom('')
    setPublishTo('')
    setCurrentPage(1)
    setHasSearched(true)
    // 延遲執行以確保狀態更新完成
    setTimeout(() => {
      fetchArticles()
    }, 100)
  }

  // 快速設定發布時間 (datetime-local 格式)
  const quickSetPublishDate = (type: string) => {
    const today = dayjs()
    let fromDate = ''
    let toDate = ''

    switch (type) {
      case 'today':
        fromDate = today.startOf('day').format('YYYY-MM-DDTHH:mm')
        toDate = today.endOf('day').format('YYYY-MM-DDTHH:mm')
        break
      case 'yesterday':
        const y = today.subtract(1, 'day')
        fromDate = y.startOf('day').format('YYYY-MM-DDTHH:mm')
        toDate = y.endOf('day').format('YYYY-MM-DDTHH:mm')
        break
      case '3days':
        fromDate = today.subtract(2, 'day').startOf('day').format('YYYY-MM-DDTHH:mm')
        toDate = today.endOf('day').format('YYYY-MM-DDTHH:mm')
        break
      case 'thisMonth':
        fromDate = today.startOf('month').format('YYYY-MM-DDTHH:mm')
        toDate = today.endOf('month').format('YYYY-MM-DDTHH:mm')
        break
      case 'lastMonth':
        const last = today.subtract(1, 'month')
        fromDate = last.startOf('month').format('YYYY-MM-DDTHH:mm')
        toDate = last.endOf('month').format('YYYY-MM-DDTHH:mm')
        break
    }

    setPublishFrom(fromDate)
    setPublishTo(toDate)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '已發布'
      case 'INACTIVE': return '已下架'
      case 'DRAFT': return '草稿'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>📰 文章列表</h1>
        <div className="users-header-actions">
          <button
            onClick={() => router.push('/admin/articles/new')}
            className="btn-search"
          >
            ✨ 新增文章
          </button>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            📊 管理文章內容與發布狀態
          </div>
        </div>
      </div>

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
                <label htmlFor="search-term" className="form-label">標題或內容</label>
                <input 
                  type="text" 
                  id="search-term"
                  placeholder="搜尋文章標題、摘要或內容..." 
                  value={searchTerm} 
                  onChange={(e) => {
                    // 輸入長度和安全性限制
                    const value = e.target.value
                    if (value.length <= 200) {
                      // 即時過濾危險字符
                      const safeValue = value.replace(/[<>'"]/g, '')
                      setSearchTerm(safeValue)
                    }
                  }}
                  className="form-input" 
                  maxLength={200}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status-select" className="form-label">發布狀態</label>
                <select 
                  id="status-select" 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)} 
                  className="form-select"
                >
                  <option value="">所有狀態</option>
                  <option value="ACTIVE">✅ 已發布</option>
                  <option value="INACTIVE">❌ 已下架</option>
                  <option value="DRAFT">📝 草稿</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category-select" className="form-label">文章分類</label>
                <select 
                  id="category-select" 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)} 
                  className="form-select"
                >
                  <option value="">所有分類</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {/* 安全顯示：防止 XSS */}
                      {category.name?.replace(/<[^>]*>/g, '') || '未命名分類'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group date-range-group">
                <label className="form-label">發布時間範圍</label>
                <div className="date-inputs">
                  <DateTimePicker
                    value={publishFrom}
                    onChange={(value) => setPublishFrom(value)}
                    placeholder="開始時間"
                    className="form-input"
                  />
                  <span className="date-separator">至</span>
                  <DateTimePicker
                    value={publishTo}
                    onChange={(value) => setPublishTo(value)}
                    placeholder="結束時間"
                    className="form-input"
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetPublishDate("today")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetPublishDate("yesterday")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetPublishDate("3days")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetPublishDate("thisMonth")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetPublishDate("lastMonth")} className="btn-quick-date">上月</button>
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

      {!loading && hasSearched && (
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
                  setCurrentPage(1);
                  // 不需要手動調用 fetchArticles，useEffect 會自動觸發
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>
            <div className="pagination-info">
              共 {totalCount} 篇文章
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th className="w30">標題</th>
                <th>分類</th>
                <th>狀態</th>
                <th>發布時間</th>
                <th>瀏覽次數</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <div className="user-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {article.is_featured && (
                          <span className="featured-badge">
                            📌 置頂
                          </span>
                        )}
                        <div className="user-username">
                          {/* 安全顯示：防止 XSS */}
                          {article.title?.replace(/<[^>]*>/g, '') || '未命名'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      📂 {/* 安全顯示：防止 XSS */}
                      {article.category?.name?.replace(/<[^>]*>/g, '') || "未分類"}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      article.status === "ACTIVE" ? "status-active" : 
                      article.status === "DRAFT" ? "status-inactive" : 
                      article.status === "INACTIVE" ? "status-banned" : "status-inactive"
                    }`}>
                      {article.status === "ACTIVE" ? "✅ 已發布" : 
                       article.status === "DRAFT" ? "📝 草稿" : 
                       article.status === "INACTIVE" ? "❌ 已下架" : 
                       statusMap[article.status] || article.status}
                    </span>
                  </td>
                  <td>
                    <div className="login-info">
                      📅 {toTaiwanDisplayTime(article.publish_date)}
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      👁️ {article.view_count}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => router.push(`/admin/articles/edit/${article.id}`)}
                        className="btn-edit"
                        title="編輯文章"
                      >
                        ✏️ 編輯
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="btn-delete"
                        title="刪除文章"
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
          {!loading && hasSearched && articles.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的文章資料</p>
            </div>
          )}

          {/* 通用分頁元件 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={limit}
            onPageChange={handlePageChange}
            showPageSizeSelector={false}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}