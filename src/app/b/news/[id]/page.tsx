'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import '@/styles/pages/news.css'

type NewsDetail = {
  id: number
  title: string
  summary: string
  content: string
  image_url?: string
  publish_date: string
  view_count: number
  category: string
  is_featured: boolean
}

type RelatedNews = {
  id: number
  title: string
  publish_date: string
}

type NewsResponse = {
  news: NewsDetail
  relatedNews: RelatedNews[]
  prev?: RelatedNews
  next?: RelatedNews
}

export default function NewsDetailPageB() {
  const params = useParams()
  const router = useRouter()
  const [newsData, setNewsData] = useState<NewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const companyCode = 'b'
  const newsId = params.id

  useEffect(() => {
    if (!newsId) return

    let isCancelled = false

    const fetchNewsDetail = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/portal/news/${newsId}?company=${companyCode}`
        )
        
        if (response.ok && !isCancelled) {
          const data: NewsResponse = await response.json()
          setNewsData(data)
        } else if (!isCancelled) {
          setError('新聞不存在或已下架')
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch news detail:', error)
          setError('載入失敗，請稍後再試')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchNewsDetail()

    return () => {
      isCancelled = true
    }
  }, [newsId, companyCode])

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

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = newsData?.news.title || ''
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'line':
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          alert('連結已複製到剪貼簿')
        })
        break
    }
  }

  if (loading) {
    return (
      <>
        <PortalHeaderBar />
        <div className="news-detail-container">
          <div className="news-loading">
            <div className="news-loading-spinner"></div>
            <p className="news-loading-text">載入中...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !newsData) {
    return (
      <>
        <PortalHeaderBar />
        <div className="news-detail-container">
          <div className="news-empty">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/b/news')}
              className="news-search-btn"
            >
              返回新聞列表
            </button>
          </div>
        </div>
      </>
    )
  }

  const { news, relatedNews, prev, next } = newsData

  return (
    <>
      <PortalHeaderBar />
      
      <div className="news-detail-container">
        {/* 麵包屑 */}
        <nav className="news-breadcrumb">
          <button
            onClick={() => router.push('/b')}
          >
            首頁
          </button>
          <span className="mx-2">/</span>
          <button
            onClick={() => router.push('/b/news')}
          >
            最新消息
          </button>
          <span className="mx-2">/</span>
          <span>{news.title}</span>
        </nav>

        {/* 文章內容 */}
        <article className="news-detail-article">
          {/* 文章標題區 */}
          <div className="news-detail-header">
            <div className="news-item-badges">
              {news.is_featured && (
                <span className="news-badge news-badge-featured">置頂</span>
              )}
              <span className="news-badge news-badge-category">
                {getCategoryName(news.category)}
              </span>
            </div>
            <h1 className="news-detail-title">{news.title}</h1>
            <div className="news-detail-meta">
              <span>📅 {formatDate(news.publish_date)}</span>
              <span>👁 {news.view_count} 次瀏覽</span>
            </div>
          </div>

          {/* 文章圖片 */}
          {news.image_url && (
            <div className="news-detail-image">
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE}${news.image_url}`}
                alt={news.title}
              />
            </div>
          )}

          {/* 文章內容 */}
          <div className="news-detail-content">
            <div className="news-detail-summary">
              <h2>摘要</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{news.summary}</p>
            </div>

            {/* 文章內容 */}
            <div 
              className="news-detail-body"
              dangerouslySetInnerHTML={{ __html: news.content.replace(/\n/g, '<br>') }}
            />
          </div>

          {/* 分享按鈕 */}
          <div className="news-detail-share">
            <div className="news-detail-share-buttons">
              <span>分享：</span>
              <button
                onClick={() => handleShare('facebook')}
                className="news-share-btn facebook"
              >
                📘 Facebook
              </button>
              <button
                onClick={() => handleShare('line')}
                className="news-share-btn line"
              >
                💬 LINE
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="news-share-btn copy"
              >
                📋 複製連結
              </button>
            </div>
          </div>
        </article>

        {/* 上一篇/下一篇 */}
        {(prev || next) && (
          <div className="news-navigation">
            {prev && (
              <button
                onClick={() => router.push(`/b/news/${prev.id}`)}
                className="news-nav-btn"
              >
                <div className="news-nav-label">上一篇</div>
                <div className="news-nav-title">{prev.title}</div>
              </button>
            )}
            {next && (
              <button
                onClick={() => router.push(`/b/news/${next.id}`)}
                className="news-nav-btn next"
              >
                <div className="news-nav-label">下一篇</div>
                <div className="news-nav-title">{next.title}</div>
              </button>
            )}
          </div>
        )}

        {/* 相關文章 */}
        {relatedNews.length > 0 && (
          <div className="news-related">
            <h3 className="news-related-title">相關文章</h3>
            <div className="news-related-grid">
              {relatedNews.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/b/news/${item.id}`)}
                  className="news-related-item"
                >
                  <h4 className="news-related-item-title">{item.title}</h4>
                  <div className="news-related-item-date">{formatDate(item.publish_date)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 返回按鈕 */}
        <div className="news-back-btn">
          <button
            onClick={() => router.push('/b/news')}
          >
            返回新聞列表
          </button>
        </div>
      </div>
    </>
  )
}