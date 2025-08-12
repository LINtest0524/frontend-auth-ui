'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import '@/styles/pages/news.css'

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
      console.log('API 請求:', { page, search, categoryId, url })
      
      const response = await fetch(url)
      if (response.ok) {
        const data: ArticleResponse = await response.json()
        console.log('API 回應:', data)
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

  useEffect(() => {
    fetchCategories()
    
    // 從 URL 參數讀取 categoryId
    const categoryIdFromUrl = searchParams.get('categoryId')
    if (categoryIdFromUrl && categoryIdFromUrl !== selectedCategory) {
      setSelectedCategory(categoryIdFromUrl)
      fetchArticles(1, searchTerm, categoryIdFromUrl)
    } else {
      fetchArticles(currentPage, searchTerm, selectedCategory)
    }
  }, [currentPage, searchParams])

  // 當 selectedCategory 改變時，更新 URL
  useEffect(() => {
    const categoryIdFromUrl = searchParams.get('categoryId')
    if (selectedCategory !== (categoryIdFromUrl || '')) {
      const newUrl = selectedCategory 
        ? `/a/articles?categoryId=${selectedCategory}`
        : '/a/articles'
      router.replace(newUrl)
    }
  }, [selectedCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchArticles(1, searchTerm, selectedCategory)
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
    fetchArticles(1, searchTerm, categoryId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW')
  }

  const renderPagination = () => {
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
          onClick={() => setCurrentPage(currentPage - 1)}
          className="news-pagination-btn"
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
          onClick={() => setCurrentPage(i)}
          className={`news-pagination-btn ${currentPage === i ? 'active' : ''}`}
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
          onClick={() => setCurrentPage(currentPage + 1)}
          className="news-pagination-btn"
        >
          下一頁
        </button>
      )
    }

    return pages
  }

  return (
    <>
      <PortalHeaderBar />
      <div className="news-container">
        <h1 className="news-title">文章專區</h1>
        
        {/* 分類導航 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === '' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全部分類
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id.toString())}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id.toString()
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 搜尋區域 */}
        <div className="news-search-section">
          <form onSubmit={handleSearch} className="news-search-form">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋文章標題或內容..."
              className="news-search-input"
            />
            <button type="submit" className="news-search-btn">
              搜尋
            </button>
          </form>
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div className="news-loading">
            <div className="news-loading-spinner"></div>
            <p className="news-loading-text">載入中...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="news-empty">
            <p>目前沒有文章</p>
          </div>
        ) : (
          <div className="news-list">
            {articles.map((item) => (
              <article
                key={item.id}
                className="news-item"
                onClick={() => router.push(`/a/articles/${item.id}`)}
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
                        {item.category.name}
                      </span>
                    </div>
                    <h2 className="news-item-title">
                      {item.title}
                    </h2>
                    <p className="news-item-summary" style={{ whiteSpace: 'pre-line' }}>
                      {item.summary}
                    </p>
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