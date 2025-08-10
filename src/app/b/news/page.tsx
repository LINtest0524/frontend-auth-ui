'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PortalHeaderBar from '@/components/PortalHeaderBar'

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

export default function NewsListPageB() {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const companyCode = 'b'
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">最新消息</h1>
        
        {/* 搜尋和篩選 */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="搜尋標題或內容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有分類</option>
              <option value="GENERAL">一般消息</option>
              <option value="ANNOUNCEMENT">重要公告</option>
              <option value="PROMOTION">優惠活動</option>
              <option value="UPDATE">系統更新</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              搜尋
            </button>
          </form>
        </div>

        {/* 新聞列表 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">目前沒有最新消息</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/b/news/${item.id}`)}
              >
                <div className="md:flex">
                  {item.image_url && (
                    <div className="md:w-1/3">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                        alt={item.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`p-6 ${item.image_url ? 'md:w-2/3' : 'w-full'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {item.is_featured && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">置頂</span>
                      )}
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {getCategoryName(item.category)}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900 hover:text-blue-600 transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">{item.summary}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
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
        {renderPagination()}
      </div>
    </>
  )
}