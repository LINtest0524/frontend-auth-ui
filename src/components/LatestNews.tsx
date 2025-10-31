'use client'

import { useEffect, useState } from 'react'
import './LatestNews.css'

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

interface LatestNewsProps {
  companyCode: string
  limit?: number
  showMore?: boolean
}

export default function LatestNews({ 
  companyCode, 
  limit = 4, 
  showMore = true 
}: LatestNewsProps) {
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/portal/news?company=${companyCode}&page=1&limit=${limit}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setLatestNews(data.data || [])
        } else {
          setLatestNews([])
        }
      } catch (error) {
        console.error('獲取最新消息失敗:', error)
        console.error('API URL:', `${process.env.NEXT_PUBLIC_API_BASE}/portal/news?company=${companyCode}&page=1&limit=${limit}`)
        setLatestNews([])
      } finally {
        setLoading(false)
      }
    }

    fetchLatestNews()
  }, [companyCode, limit])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

  if (loading) {
    return (
      <div className="latest-news-container">
        <div className="latest-news-loading">
          <div className="loading-spinner"></div>
          <p>載入最新消息中...</p>
        </div>
      </div>
    )
  }

  // 為了調試，即使沒有新聞也顯示一個佔位符
  if (latestNews.length === 0) {
    return (
      <div className="latest-news-container">
        <div className="latest-news-header">
          <h2 className="latest-news-title">最新消息</h2>
          {showMore && (
            <a 
              href={`/${companyCode}/news`}
              className="latest-news-more-btn"
            >
              MORE+
            </a>
          )}
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <p>🔍 目前沒有最新消息</p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
            API 請求: {process.env.NEXT_PUBLIC_API_BASE}/portal/news?company={companyCode}&limit={limit}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="latest-news-container">
      <div className="latest-news-header">
        <h2 className="latest-news-title">最新消息</h2>
        {showMore && (
          <a 
            href={`/${companyCode}/news`}
            className="latest-news-more-btn"
          >
            MORE+
          </a>
        )}
      </div>
      
      <div className="latest-news-grid">
        {latestNews.map((news) => (
          <a
            key={news.id}
            href={`/${companyCode}/news/${news.id}`}
            className="latest-news-card"
          >
            {news.image_url && (
              <div className="latest-news-image">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE}${news.image_url}`}
                  alt={news.title}
                />
              </div>
            )}
            <div className="latest-news-content">
              <div className="latest-news-tags">
                {news.is_featured && (
                  <span className="latest-news-tag featured">
                    置頂
                  </span>
                )}
                <span className="latest-news-tag category">
                  {getCategoryName(news.category)}
                </span>
              </div>
              <h3 className="latest-news-card-title">
                {news.title}
              </h3>
              <p className="latest-news-summary">
                {news.summary}
              </p>
              <div className="latest-news-meta">
                <span className="latest-news-date">
                  📅 {formatDate(news.publish_date)}
                </span>
                <span className="latest-news-views">
                  👁 {news.view_count} 次瀏覽
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}