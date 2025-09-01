'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'
import '@/styles/pages/users.css'

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
      }
    } catch (error) {
      console.error('獲取分類失敗:', error)
    }
  }

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedCategory) params.append('categoryId', selectedCategory)

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
        console.error('獲取文章失敗')
      }
    } catch (error) {
      console.error('獲取文章錯誤:', error)
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
        alert('文章刪除失敗')
      }
    } catch (error) {
      console.error('刪除文章錯誤:', error)
      alert('文章刪除失敗')
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
    setCurrentPage(1)
    setArticles([])
    setTotalPages(1)
    setTotalCount(0)
    setHasSearched(false)
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

  const renderPagination = () => {
    if (totalPages <= 1 || totalCount === 0) return null

    const pages = []

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      const start = Math.max(2, currentPage - 2)
      const end = Math.min(totalPages - 1, currentPage + 2)

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          第 {currentPage} 頁，共 {totalPages} 頁（總計 {totalCount} 筆資料）
        </div>

        <div className="pagination-buttons">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ⬅️ 上一頁
          </button>

          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="pagination-btn" style={{cursor: "default"}}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p as number)}
                className={`pagination-btn ${currentPage === p ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            下一頁 ➡️
          </button>
        </div>
      </div>
    )
  }

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
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="form-input" 
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
                      {category.name}
                    </option>
                  ))}
                </select>
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
                  const validLimit = Math.max(1, inputLimit);
                  setLimit(validLimit);
                  setCurrentPage(1);
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
                        <div className="user-username">{article.title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      📂 {article.category?.name || "未分類"}
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
                      📅 {dayjs(article.publish_date).format('YYYY/MM/DD')}
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

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  )
}