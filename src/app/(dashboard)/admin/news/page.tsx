'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'

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
  const [createdFrom, setCreatedFrom] = useState(() => {
    const today = dayjs()
    return today.subtract(7, 'day').format('YYYY-MM-DD')
  })
  const [createdTo, setCreatedTo] = useState(() => {
    const today = dayjs()
    return today.format('YYYY-MM-DD')
  })
  const [hasSearched, setHasSearched] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const fetchNewsWithParams = async (customLimit?: number, customPage?: number) => {
    const currentLimit = customLimit || limit
    const currentPage = customPage || page
    
    if (!Number.isFinite(currentLimit) || !Number.isFinite(currentPage) || !user?.companyId) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
      })
      
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedCategory) params.append('category', selectedCategory)
      if (createdFrom) params.append('createdFrom', createdFrom + ' 00:00:00')
      if (createdTo) params.append('createdTo', createdTo + ' 23:59:59')
      
      console.log('發送搜尋請求:', params.toString())
      console.log('前端用戶資訊:', {
        user: user,
        userCompanyId: user.companyId,
        userCompany: user.company
      })
      
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
      console.log('API 回應:', result)

      if (result.data && Array.isArray(result.data)) {
        setNews(result.data)
        setTotalPages(result.totalPages || 1)
        setTotalCount(result.total || 0)
      } else {
        setNews([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
      setNews([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchNews = async () => {
    return fetchNewsWithParams()
  }

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
        fromDate = today.subtract(3, 'day').format('YYYY-MM-DD')
        toDate = today.format('YYYY-MM-DD')
        break
      case 'thisMonth':
        fromDate = today.startOf('month').format('YYYY-MM-DD')
        toDate = today.format('YYYY-MM-DD')
        break
      case 'lastMonth':
        const lastMonth = today.subtract(1, 'month')
        fromDate = lastMonth.startOf('month').format('YYYY-MM-DD')
        toDate = lastMonth.endOf('month').format('YYYY-MM-DD')
        break
    }

    setCreatedFrom(fromDate)
    setCreatedTo(toDate)
  }

  const handleSearch = async () => {
    setHasSearched(true)
    setPage(1)
    await new Promise(resolve => setTimeout(resolve, 50))
    fetchNews()
  }

  const clearFilter = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedCategory('')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這則新聞嗎？')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        fetchNews()
      }
    } catch (error) {
      console.error('Failed to delete news:', error)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW')
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'ACTIVE': '已發布',
      'INACTIVE': '未發布', 
      'DRAFT': '草稿',
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'GENERAL': '一般消息',
      'ANNOUNCEMENT': '重要公告',
      'PROMOTION': '優惠活動',
      'UPDATE': '系統更新',
    }
    return categoryMap[category] || category
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

      const start = Math.max(2, page - 2)
      const end = Math.min(totalPages - 1, page + 2)

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
            p === '...' ? (
              <span key={`ellipsis-${idx}`}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`${
                  page === p ? 'pagehover' : ''
                }`}
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
    if (hasSearched) fetchNews()
  }, [limit, page])

  // 頁面載入時自動搜尋近7日資料
  useEffect(() => {
    if (!hasSearched && user?.companyId) {
      setHasSearched(true)
      fetchNews()
    }
  }, [user?.companyId])

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>最新消息管理</h1>

        <div className="b-ibox-s">
          <div className="w100 fo5 mb15">
            <div className="w50 fl4">
              <button
                onClick={() => router.push('/admin/news/new')}
                className="b-btn-s2 b-btn-c4"
              >
                新增消息
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
                    placeholder="搜尋標題或內容..." 
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
                    <option value="INACTIVE">未發布</option>
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
                    <option value="GENERAL">一般消息</option>
                    <option value="ANNOUNCEMENT">重要公告</option>
                    <option value="PROMOTION">優惠活動</option>
                    <option value="UPDATE">系統更新</option>
                  </select>
                </div>

                <div className="w100 fd1 mb25">
                  <div className="b-form-group-2 fl4 w100 mb10">
                    <label htmlFor="date-select-1">發布時間</label>
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
                      setPage(1)
                      setHasSearched(true)
                      
                      setTimeout(() => {
                        fetchNewsWithParams(newLimit, 1)
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
                  {news.map((item) => (
                    <tr key={item.id} className="text-center">
                      <td>
                        <div className="text-left">
                          {item.is_featured && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mr-2">置頂</span>
                          )}
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">{item.summary}</div>
                        </div>
                      </td>
                      <td>{getCategoryName(item.category)}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{formatDateTime(item.publish_date)}</td>
                      <td>{item.view_count}</td>
                      <td>
                        <button
                          onClick={() => router.push(`/admin/news/edit/${item.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {news.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500">
                        暫無最新消息
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