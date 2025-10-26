'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCompanySlug } from '@/hooks/useCompanySlug'
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
  const companySlug = useCompanySlug()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const limit = 10

  const fetchNews = async (page: number = 1, search: string = '', category: string = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        company: companySlug,
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE}/portal/news?${params}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data: NewsResponse = await response.json()
        setNews(data.data)
        setTotalPages(data.totalPages)
        setCurrentPage(Number(data.page))
      }
    } catch (error) {
      // 靜默處理錯誤
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
    const maxVisiblePages = 7
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // 第一頁
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        )
      }
    }

    // 頁碼範圍
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      )
    }

    // 最後一頁
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        )
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      )
    }

    return (
      <div className="pagination-container">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-nav-btn"
        >
          <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一頁
        </button>
        
        <div className="pagination-numbers">
          {pages}
        </div>
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-nav-btn"
        >
          下一頁
          <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <>
      
      <div className="news-page">
        {/* 頁面標題區域 */}
        <div className="news-hero">
          <div className="news-hero-content">
            <h1 className="news-hero-title">
              <span className="news-hero-icon">📰</span>
              最新消息
            </h1>
            <p className="news-hero-subtitle">掌握第一手資訊，不錯過任何重要消息</p>
          </div>
        </div>

        <div className="news-container">
          {/* 搜尋和篩選區域 */}
          <div className="news-filters">
            <div className="news-filters-header">
              <h2>篩選條件</h2>
              <span className="news-count">共 {news.length} 則消息</span>
            </div>
            <form onSubmit={handleSearch} className="news-search-form">
              <div className="search-input-group">
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜尋標題或內容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="news-search-input"
                />
              </div>
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
              <button type="submit" className="news-search-btn">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜尋
              </button>
            </form>
          </div>

          {/* 新聞列表 */}
          {loading ? (
            <div className="news-loading">
              <div className="loading-animation">
                <div className="loading-spinner"></div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <p className="loading-text">正在載入最新消息...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="news-empty">
              <div className="empty-icon">📭</div>
              <h3>暫無消息</h3>
              <p>目前沒有符合條件的最新消息，請稍後再試或調整篩選條件</p>
            </div>
          ) : (
            <>
              {/* 置頂新聞 */}
              {news.filter(item => item.is_featured).length > 0 && (
                <div className="featured-news-section">
                  <h3 className="section-title">
                    <span className="title-icon">📌</span>
                    置頂消息
                  </h3>
                  <div className="featured-news-grid">
                    {news.filter(item => item.is_featured).map((item) => (
                      <article
                        key={`featured-${item.id}`}
                        className="news-card featured"
                        onClick={() => router.push(`/${companySlug}/news/${item.id}`)}
                      >
                        <div className="news-card-header">
                          {item.image_url && (
                            <div className="news-card-image">
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                                alt={item.title}
                              />
                              <div className="image-overlay"></div>
                            </div>
                          )}
                          <div className="news-card-badges">
                            <span className="badge featured">置頂</span>
                            <span className="badge category">{getCategoryName(item.category)}</span>
                          </div>
                        </div>
                        <div className="news-card-content">
                          <h4 className="news-card-title">{item.title}</h4>
                          <p className="news-card-summary">{item.summary}</p>
                          <div className="news-card-meta">
                            <span className="meta-item">
                              <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(item.publish_date)}
                            </span>
                            <span className="meta-item">
                              <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {item.view_count}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* 一般新聞 */}
              <div className="regular-news-section">
                <h3 className="section-title">
                  <span className="title-icon">📄</span>
                  所有消息
                </h3>
                <div className="news-grid">
                  {news.map((item) => (
                    <article
                      key={item.id}
                      className="news-card"
                      onClick={() => router.push(`/${companySlug}/news/${item.id}`)}
                    >
                      <div className="news-card-header">
                        {item.image_url && (
                          <div className="news-card-image">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                              alt={item.title}
                            />
                            <div className="image-overlay"></div>
                          </div>
                        )}
                        <div className="news-card-badges">
                          {item.is_featured && <span className="badge featured">置頂</span>}
                          <span className="badge category">{getCategoryName(item.category)}</span>
                        </div>
                      </div>
                      <div className="news-card-content">
                        <h4 className="news-card-title">{item.title}</h4>
                        <p className="news-card-summary">{item.summary}</p>
                        <div className="news-card-meta">
                          <span className="meta-item">
                            <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(item.publish_date)}
                          </span>
                          <span className="meta-item">
                            <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {item.view_count}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 分頁 */}
          {renderPagination()}
        </div>
      </div>
    </>
  )
}