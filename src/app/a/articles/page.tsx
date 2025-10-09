'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import '@/styles/pages/articles.css'

type ArticleItem = {
  id: number
  title: string
  summary: string
  image_url?: string
  publish_date: string
  view_count: number
  category: {
    id: number
    name: string
    slug: string
  }
  is_featured: boolean
}

type ArticleCategory = {
  id: number
  name: string
  slug: string
  description: string
}

type ArticleResponse = {
  data: ArticleItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ArticlesListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const companyCode = 'a'
  const limit = 10

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/articles/categories?company=${companyCode}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchArticles = async (page: number = 1, search: string = '', categoryId: string = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        company: companyCode,
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (search) params.append('search', search)
      if (categoryId) params.append('categoryId', categoryId)
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE}/portal/articles?${params}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data: ArticleResponse = await response.json()
        setArticles(data.data)
        setTotalPages(data.totalPages)
        setCurrentPage(data.page)
      } else {
        console.error('Failed to fetch articles')
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化載入
  useEffect(() => {
    fetchCategories()
    
    // 從 URL 參數讀取初始值
    const categoryIdFromUrl = searchParams.get('categoryId') || ''
    const pageFromUrl = parseInt(searchParams.get('page') || '1')
    
    setSelectedCategory(categoryIdFromUrl)
    setCurrentPage(pageFromUrl)
    fetchArticles(pageFromUrl, searchTerm, categoryIdFromUrl)
  }, [])

  // 當 URL 參數改變時同步狀態和數據
  useEffect(() => {
    const categoryIdFromUrl = searchParams.get('categoryId') || ''
    const pageFromUrl = parseInt(searchParams.get('page') || '1')
    
    // 同步狀態
    setSelectedCategory(categoryIdFromUrl)
    setCurrentPage(pageFromUrl)
    
    // 載入對應的數據
    fetchArticles(pageFromUrl, searchTerm, categoryIdFromUrl)
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchArticles(1, searchTerm, selectedCategory)
  }

  const handleCategoryChange = (categoryId: string) => {
    // 直接更新 URL，讓 useEffect 處理狀態和數據載入
    const newUrl = categoryId ? `/a/articles?categoryId=${categoryId}` : '/a/articles'
    router.replace(newUrl)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW')
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
          onClick={() => {
            const params = new URLSearchParams()
            if (selectedCategory) params.set('categoryId', selectedCategory)
            router.replace(`/a/articles?${params.toString()}`)
          }}
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
          onClick={() => {
            const params = new URLSearchParams()
            if (selectedCategory) params.set('categoryId', selectedCategory)
            if (i > 1) params.set('page', i.toString())
            router.replace(`/a/articles?${params.toString()}`)
          }}
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
          onClick={() => {
            const params = new URLSearchParams()
            if (selectedCategory) params.set('categoryId', selectedCategory)
            params.set('page', totalPages.toString())
            router.replace(`/a/articles?${params.toString()}`)
          }}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      )
    }

    return (
      <div className="pagination-container">
        <button
          onClick={() => {
            const prevPage = currentPage - 1
            const params = new URLSearchParams()
            if (selectedCategory) params.set('categoryId', selectedCategory)
            if (prevPage > 1) params.set('page', prevPage.toString())
            router.replace(`/a/articles?${params.toString()}`)
          }}
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
          onClick={() => {
            const nextPage = currentPage + 1
            const params = new URLSearchParams()
            if (selectedCategory) params.set('categoryId', selectedCategory)
            params.set('page', nextPage.toString())
            router.replace(`/a/articles?${params.toString()}`)
          }}
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
      
      <div className="articles-page">
        {/* 頁面標題區域 */}
        <div className="articles-hero">
          <div className="articles-hero-content">
            <h1 className="articles-hero-title">
              <span className="articles-hero-icon">📚</span>
              文章專區
            </h1>
            <p className="articles-hero-subtitle">深度閱讀，探索知識的無限可能</p>
          </div>
        </div>

        <div className="articles-container">
          {/* 分類導航區域 */}
          <div className="articles-categories">
            <div className="categories-header">
              <h2>文章分類</h2>
              <span className="articles-count">共 {articles.length} 篇文章</span>
            </div>
            <div className="categories-list">
              <button
                onClick={() => handleCategoryChange('')}
                className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
              >
                <svg className="category-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                全部分類
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id.toString())}
                  className={`category-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                >
                  <svg className="category-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 搜尋和篩選區域 */}
          <div className="articles-filters">
            <div className="articles-filters-header">
              <h2>搜尋文章</h2>
              <span className="filter-count">找到 {articles.length} 篇相關文章</span>
            </div>
            <form onSubmit={handleSearch} className="articles-search-form">
              <div className="search-input-group">
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋文章標題或內容..."
                  className="articles-search-input"
                />
              </div>
              <button type="submit" className="articles-search-btn">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜尋
              </button>
            </form>
          </div>

          {/* 文章列表 */}
          {loading ? (
            <div className="articles-loading">
              <div className="loading-animation">
                <div className="loading-spinner"></div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <p className="loading-text">正在載入精彩文章...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="articles-empty">
              <div className="empty-icon">📖</div>
              <h3>暫無文章</h3>
              <p>目前沒有符合條件的文章，請稍後再試或調整篩選條件</p>
            </div>
          ) : (
            <>
              {/* 置頂文章 */}
              {articles.filter(item => item.is_featured).length > 0 && (
                <div className="featured-articles-section">
                  <h3 className="section-title">
                    <span className="title-icon">⭐</span>
                    精選文章
                  </h3>
                  <div className="featured-articles-grid">
                    {articles.filter(item => item.is_featured).map((item) => (
                      <article
                        key={`featured-${item.id}`}
                        className="article-card featured"
                        onClick={() => router.push(`/a/articles/${item.id}`)}
                      >
                        <div className="article-card-header">
                          {item.image_url && (
                            <div className="article-card-image">
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                                alt={item.title}
                              />
                              <div className="image-overlay"></div>
                            </div>
                          )}
                          <div className="article-card-badges">
                            <span className="badge featured">精選</span>
                            <span className="badge category">{item.category.name}</span>
                          </div>
                        </div>
                        <div className="article-card-content">
                          <h4 className="article-card-title">{item.title}</h4>
                          <p className="article-card-summary">{item.summary}</p>
                          <div className="article-card-meta">
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

              {/* 一般文章 */}
              <div className="regular-articles-section">
                <h3 className="section-title">
                  <span className="title-icon">📄</span>
                  所有文章
                </h3>
                <div className="articles-grid">
                  {articles.map((item) => (
                    <article
                      key={item.id}
                      className="article-card"
                      onClick={() => router.push(`/a/articles/${item.id}`)}
                    >
                      <div className="article-card-header">
                        {item.image_url && (
                          <div className="article-card-image">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                              alt={item.title}
                            />
                            <div className="image-overlay"></div>
                          </div>
                        )}
                        <div className="article-card-badges">
                          {item.is_featured && <span className="badge featured">精選</span>}
                          <span className="badge category">{item.category.name}</span>
                        </div>
                      </div>
                      <div className="article-card-content">
                        <h4 className="article-card-title">{item.title}</h4>
                        <p className="article-card-summary">{item.summary}</p>
                        <div className="article-card-meta">
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