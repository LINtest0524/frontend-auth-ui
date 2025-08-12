'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [inputLimit, setInputLimit] = useState(10)

  const [limit, setLimit] = useState(10)

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCompanyId(user.companyId)
    }
  }, [])

  useEffect(() => {
    if (companyId) {
      fetchCategories()
      if (hasSearched) {
        fetchArticles()
      }
    }
  }, [companyId, currentPage, limit])

  // 頁面載入時自動搜尋
  useEffect(() => {
    if (!hasSearched && companyId) {
      setHasSearched(true)
      fetchArticles()
    }
  }, [companyId])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/company/${companyId}`,
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
        `${process.env.NEXT_PUBLIC_API_BASE}/articles/admin/company/${companyId}?${params}`,
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
    if (totalPages <= 1) return null

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
      <div className="fo5 w100 b-data-tables_munber mb15">
        <p>
          目前第 {currentPage} 頁，共 {totalPages} 頁（共 {totalCount} 筆資料）
        </p>

        <div className="tables_munber">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className=""
          >
            上一頁
          </button>

          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p as number)}
                className={`${
                  currentPage === p ? 'pagehover' : ''
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className=""
          >
            下一頁
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>文章管理</h1>

        <div className="b-ibox-s">
          <div className="w100 fo5 mb15">
            <div className="w50 fl4">
              <button
                onClick={() => router.push('/admin/articles/new')}
                className="b-btn-s2 b-btn-c4"
              >
                新增文章
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="b-search-btn w100"
          >
            篩選
            <span className={`i-arrow ${isFilterOpen ? "rotate" : ""}`}></span>
          </button>

          {isFilterOpen && (
            <>
              <div className="b-search-box fl1 w100 mt15">
                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="searchTerm">標題或內容</label>
                  <input 
                    type="text" 
                    placeholder="搜尋文章標題、摘要或內容..." 
                    id="searchTerm" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w60" 
                  />
                </div>

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="statusSelect">狀態</label>
                  <select 
                    id="statusSelect"
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w60"
                  >
                    <option value="">所有狀態</option>
                    <option value="ACTIVE">已發布</option>
                    <option value="INACTIVE">已下架</option>
                    <option value="DRAFT">草稿</option>
                  </select>
                </div>

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="categorySelect">分類</label>
                  <select 
                    id="categorySelect"
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w60"
                  >
                    <option value="">所有分類</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fl4 w100 b-btnbox">
                  <button onClick={handleSearch} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
                  <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && <p>載入中...</p>}

      {!loading && hasSearched && (
        <>
          <div className="b-ibox">
            <div className="b-ibox-s">
              <div className="w100 fo5 mb15">
                <div className="w50 fl4">
                  <label htmlFor="page11">每頁&nbsp;</label>
                  <input
                    type="number"
                    id="page11"
                    value={inputLimit}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      if (!isNaN(val)) setInputLimit(val)
                    }}
                    min={1}
                    className="txtbox1 mr20"
                  />
                  <button
                    onClick={() => {
                      const newLimit = inputLimit
                      setLimit(newLimit)
                      setCurrentPage(1)
                      setHasSearched(true)
                      
                      setTimeout(() => {
                        fetchArticles()
                      }, 100)
                    }}
                    className="b-btn-s3 b-btn-c4"
                  >
                    套用
                  </button>
                </div>
              </div>

              <table className="b-table-box admin-table mb15">
              <thead>
                <tr>
                  <th>標題</th>
                  <th>分類</th>
                  <th>狀態</th>
                  <th>發布時間</th>
                  <th>瀏覽次數</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="text-center">
                    <td>
                      <div className="text-left">
                        {article.is_featured && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mr-2">置頂</span>
                        )}
                        <div className="font-semibold">{article.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{article.summary}</div>
                      </div>
                    </td>
                    <td>{article.category?.name || '-'}</td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(article.status)}`}>
                        {getStatusText(article.status)}
                      </span>
                    </td>
                    <td>{new Date(article.publish_date).toLocaleDateString()}</td>
                    <td>{article.view_count}</td>
                    <td>
                      <button
                        onClick={() => router.push(`/admin/articles/edit/${article.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500">
                      暫無文章資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {renderPagination()}
          </div>
        </div>
        </>
      )}
    </div>
  )
}