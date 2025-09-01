'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import '@/styles/pages/users.css'

type ArticleCategory = {
  id: number
  name: string
  slug: string
  description: string
  status: string
  sort: number
  companyId: number
  createdAt: string
  updatedAt: string
}

type SortKey = 'id' | 'name' | 'sort' | 'createdAt' | null
type SortDirection = 'asc' | 'desc' | null

export default function ArticleCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  
  // 分頁狀態
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [inputLimit, setInputLimit] = useState(limit)
  
  // 排序狀態
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // 時間篩選
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')

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

  // 排序功能
  const sortCategories = (data: ArticleCategory[]) => {
    if (!sortKey || !sortDirection) return data
    return [...data].sort((a, b) => {
      const getValue = (category: ArticleCategory) => {
        if (sortKey === 'createdAt') {
          return new Date(category[sortKey]).getTime()
        }
        return category[sortKey] as any
      }
      const aVal = getValue(a)
      const bVal = getValue(b)
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  // 切換排序
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('desc')
    } else {
      if (sortDirection === 'desc') setSortDirection('asc')
      else if (sortDirection === 'asc') {
        setSortDirection(null)
        setSortKey(null)
      } else setSortDirection('desc')
    }
  }

  // 排序圖標
  const getArrow = (key: SortKey) => {
    const isActive = sortKey === key
    const dir = isActive ? sortDirection : null

    const getIcon = () => {
      if (dir === 'asc') return <img src="/icon/i-sort-2.svg" alt="升冪" className="i-sort" />
      if (dir === 'desc') return <img src="/icon/i-sort-1.svg" alt="降冪" className="i-sort" />
      return <img src="/icon/i-sort-0.svg" alt="未排序" className="i-sort" />
    }

    return (
      <span className={`${isActive}`}>
        {getIcon()}
      </span>
    )
  }

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCompanyId(user.companyId)
    }
  }, [])

  useEffect(() => {
    if (hasSearched) fetchCategories()
  }, [limit, page])

  useEffect(() => {
    setCategories((prev) => sortCategories(prev))
  }, [sortKey, sortDirection])

  // 頁面載入時自動搜尋
  useEffect(() => {
    if (!hasSearched && companyId) {
      setHasSearched(true)
      fetchCategories()
    }
  }, [companyId])

  const fetchCategories = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedStatus) params.append('status', selectedStatus)
      if (createdFrom) params.append('createdFrom', createdFrom + ' 00:00:00')
      if (createdTo) params.append('createdTo', createdTo + ' 23:59:59')
      
      params.append('limit', limit.toString())
      params.append('page', page.toString())
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/company/${companyId}?${params}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        // 假設 API 返回分頁數據，如果沒有則模擬
        if (Array.isArray(result)) {
          setCategories(sortCategories(result))
          setTotalCount(result.length)
          setTotalPages(1)
        } else {
          setCategories(sortCategories(result.data || result))
          setTotalPages(result.totalPages || 1)
          setTotalCount(result.totalCount || result.total || 0)
        }
      } else {
        console.error('獲取分類失敗')
        setCategories([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('獲取分類錯誤:', error)
      setCategories([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setHasSearched(true)
    setPage(1)
    fetchCategories()
  }

  const clearFilter = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setCreatedFrom('')
    setCreatedTo('')
    setCategories([])
    setTotalPages(1)
    setTotalCount(0)
    setHasSearched(false)
  }

  // 分頁渲染
  const renderPagination = () => {
    if (totalPages <= 1 || totalCount === 0) return null

    const pages = []

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

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個分類嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        alert('分類刪除成功')
        fetchCategories()
      } else {
        alert('分類刪除失敗')
      }
    } catch (error) {
      console.error('刪除分類錯誤:', error)
      alert('分類刪除失敗')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '啟用'
      case 'INACTIVE': return '停用'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>📂 文章分類管理</h1>
        <div className="users-header-actions">
          <button
            onClick={() => router.push('/admin/article-categories/new')}
            className="btn-search"
          >
            ➕ 新增分類
          </button>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            📊 管理文章分類與狀態
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
                <label htmlFor="search-term" className="form-label">分類名稱</label>
                <input 
                  type="text" 
                  id="search-term"
                  placeholder="請輸入分類名稱" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="status-select" className="form-label">狀態</label>
                <select 
                  id="status-select" 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="ACTIVE">✅ 啟用</option>
                  <option value="INACTIVE">⏸️ 停用</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group date-range-group">
                <label htmlFor="created-date-from" className="form-label">建立時間範圍</label>
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

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")}>
                  ID <span className={`sort-icon ${sortKey === "id" ? "active" : ""}`}>{getArrow("id")}</span>
                </th>
                <th onClick={() => toggleSort("name")}>
                  分類名稱 <span className={`sort-icon ${sortKey === "name" ? "active" : ""}`}>{getArrow("name")}</span>
                </th>
                <th>代碼</th>
                <th>描述</th>
                <th>狀態</th>
                <th onClick={() => toggleSort("sort")}>
                  排序 <span className={`sort-icon ${sortKey === "sort" ? "active" : ""}`}>{getArrow("sort")}</span>
                </th>
                <th onClick={() => toggleSort("createdAt")}>
                  建立時間 <span className={`sort-icon ${sortKey === "createdAt" ? "active" : ""}`}>{getArrow("createdAt")}</span>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>#{category.id}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-username">{category.name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      🏷️ {category.slug}
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      📝 {category.description || '無描述'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-toggle ${category.status === "ACTIVE" ? "status-active" : "status-inactive"}`}>
                      {category.status === "ACTIVE" ? "✅ 啟用" : "⏸️ 停用"}
                    </span>
                  </td>
                  <td>
                    <div className="login-info">
                      🔢 {category.sort}
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      📅 {new Date(category.createdAt).toLocaleString("zh-TW", { 
                        timeZone: "Asia/Taipei", 
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => router.push(`/admin/article-categories/${category.id}/edit`)}
                        className="btn-edit"
                        title="編輯分類"
                      >
                        ✏️ 編輯
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="btn-delete"
                        title="刪除分類"
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
          {!loading && hasSearched && categories.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的分類資料</p>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  )
}