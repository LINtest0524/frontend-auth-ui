'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import '@/styles/pages/news.css'



type NewsItem = {
  id: number
  title: string
  summary: string
  image_url?: string
  publish_date: string
  view_count: number
  category: string
  is_featured: boolean
}

type NewsResponse = {
  data: NewsItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function NewsListPage() {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const companyCode = 'a'
  const limit = 10

  const fetchNews = async (page: number = 1, search: string = '', category: string = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        company: companyCode,
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/news?${params}`)
      if (response.ok) {
        const data: NewsResponse = await response.json()
        setNews(data.data)
        setTotalPages(data.totalPages)
        setCurrentPage(data.page)
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews(currentPage, searchTerm, selectedCategory)
  }, [currentPage, searchTerm, selectedCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchNews(1, searchTerm, selectedCategory)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
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
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // 上一頁
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 mx-1 text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          上一頁
        </button>
      )
    }

    // 頁碼
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 border rounded ${
            i === currentPage
              ? 'bg-blue-500 text-white border-blue-500'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      )
    }

    // 下一頁
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 mx-1 text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          下一頁
        </button>
      )
    }

    return (
      <div className="flex justify-center items-center mt-8 mb-4">
        {pages}
      </div>
    )
  }

  return (
    <>
      <PortalHeaderBar />
      
      <div className="news-container">
        <h1 className="news-title">最新消息</h1>
        
        {/* 搜尋和篩選 */}
        <div className="news-search-section">
          <form onSubmit={handleSearch} className="news-search-form">
            <input
              type="text"
              placeholder="搜尋標題或內容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="news-search-input"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="news-search-select"
            >
              <option value="">所有分類</option>
              <option value="GENERAL">一般消息</option>
              <option value="ANNOUNCEMENT">重要公告</option>
              <option value="PROMOTION">優惠活動</option>
              <option value="UPDATE">系統更新</option>
            </select>
            <button
              type="submit"
              className="news-search-btn"
            >
              搜尋
            </button>
          </form>
        </div>

        {/* 新聞列表 */}
        {loading ? (
          <div className="news-loading">
            <div className="news-loading-spinner"></div>
            <p className="news-loading-text">載入中...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="news-empty">
            <p>目前沒有最新消息</p>
          </div>
        ) : (
          <div className="news-list">
            {news.map((item) => (
              <article
                key={item.id}
                className="news-item"
                onClick={() => router.push(`/a/news/${item.id}`)}
              >
                <div className="news-item-content">
                  {item.image_url && (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                      alt={item.title}
                      className="news-item-image"
                    />
                  )}
                  <div className="news-item-body">
                    <div className="news-item-badges">
                      {item.is_featured && (
                        <span className="news-badge news-badge-featured">置頂</span>
                      )}
                      <span className="news-badge news-badge-category">
                        {getCategoryName(item.category)}
                      </span>
                    </div>
                    <h2 className="news-item-title">
                      {item.title}
                    </h2>
                    <p className="news-item-summary" style={{ whiteSpace: 'pre-line' }}>{item.summary}</p>
                    <div className="news-item-meta">
                      <span>📅 {formatDate(item.publish_date)}</span>
                      <span>👁 {item.view_count} 次瀏覽</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 分頁 */}
        <div className="news-pagination">
          {renderPagination()}
        </div>
      </div>
    </>
  )
}