'use client'

import { useRouter } from 'next/navigation'
import '@/styles/pages/articles.css'
import { sanitizeHtml } from '@/lib/sanitize'

type ArticleDetail = {
  id: number
  title: string
  summary: string
  content: string
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

type RelatedArticle = {
  id: number
  title: string
  publish_date: string
  category: {
    name: string
  }
}

type ArticleResponse = {
  article: ArticleDetail
  relatedArticles: RelatedArticle[]
  prev?: RelatedArticle
  next?: RelatedArticle
}

interface ArticleDetailClientProps {
  articleData: ArticleResponse
  companyCode: string
}

export default function ArticleDetailClient({ articleData, companyCode }: ArticleDetailClientProps) {
  const router = useRouter()
  const { article, relatedArticles, prev, next } = articleData

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

  const handleBackToList = () => {
    router.push(`/${companyCode}/articles`)
  }

  const handleCategoryClick = () => {
    router.push(`/${companyCode}/articles?categoryId=${article.category.id}`)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = article.title || ''
    
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

  return (
    <div className="article-detail-page">
      {/* 英雄區域背景 */}
      <div className="article-detail-hero">
        <div className="hero-background"></div>
        <div className="hero-content">
          {/* 麵包屑導航 */}
          <nav className="breadcrumb-nav">
            <div className="breadcrumb-container">
              <button 
                onClick={() => router.push(`/${companyCode}`)}
                className="breadcrumb-link"
              >
                <svg className="breadcrumb-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                首頁
              </button>
              <span className="breadcrumb-separator">/</span>
              <button 
                onClick={handleBackToList}
                className="breadcrumb-link"
              >
                <svg className="breadcrumb-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                文章專區
              </button>
              <span className="breadcrumb-separator">/</span>
              <button 
                onClick={handleCategoryClick}
                className="breadcrumb-link"
              >
                <svg className="breadcrumb-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {article.category.name}
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{article.title}</span>
            </div>
          </nav>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="article-detail-container">
        <div className="article-detail-wrapper">
          {/* 主要文章內容 */}
          <div className="article-main-content">
            <div className="article-detail-card">
              {/* 文章標題區域 */}
              <div className="article-header">
                <div className="article-badges">
                  <span className="category-badge general">{article.category.name}</span>
                  {article.is_featured && <span className="featured-badge">精選</span>}
                </div>
                
                <h1 className="article-title">{article.title}</h1>
                
                <div className="article-meta">
                  <div className="meta-info">
                    <div className="meta-item">
                      <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(article.publish_date)}</span>
                    </div>
                    <div className="meta-item">
                      <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{article.view_count} 次瀏覽</span>
                    </div>
                  </div>
                  
                  <div className="share-section">
                    <span className="share-label">分享:</span>
                    <div className="share-buttons">
                      <button 
                        onClick={() => handleShare('facebook')}
                        className="share-btn facebook"
                        title="分享到 Facebook"
                      >
                        <svg className="share-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleShare('line')}
                        className="share-btn line"
                        title="分享到 LINE"
                      >
                        <svg className="share-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleShare('copy')}
                        className="share-btn copy"
                        title="複製連結"
                      >
                        <svg className="share-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 文章圖片 */}
              {article.image_url && (
                <div className="article-image-container">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${article.image_url}`}
                    alt={article.title}
                    className="article-image"
                  />
                  <div className="image-overlay"></div>
                </div>
              )}

              {/* 文章摘要 */}
              {article.summary && (
                <div className="article-summary">
                  <div className="summary-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="summary-content">
                    <h3>文章摘要</h3>
                    <p>{article.summary}</p>
                  </div>
                </div>
              )}

              {/* 文章內容 */}
              <div className="article-content">
                <div 
                  className="content-body"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(article.content)
                  }}
                />
              </div>
            </div>

            {/* 文章導航 */}
            {(prev || next) && (
              <div className="article-navigation">
                <div className="nav-title">
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  文章導航
                </div>
                <div className="nav-links">
                  {prev && (
                    <button 
                      onClick={() => router.push(`/${companyCode}/articles/${prev.id}`)}
                      className="nav-link prev"
                    >
                      <div className="nav-direction">
                        <svg className="nav-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        上一篇
                      </div>
                      <div className="nav-article-title">{prev.title}</div>
                    </button>
                  )}
                  {next && (
                    <button 
                      onClick={() => router.push(`/${companyCode}/articles/${next.id}`)}
                      className="nav-link next"
                    >
                      <div className="nav-direction">
                        下一篇
                        <svg className="nav-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                      <div className="nav-article-title">{next.title}</div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 側邊欄 */}
          <aside className="article-sidebar">
            {/* 返回按鈕 */}
            <div className="back-to-list">
              <button 
                onClick={handleBackToList}
                className="back-btn"
              >
                <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回文章列表
              </button>
            </div>

            {/* 相關文章 */}
            {relatedArticles.length > 0 && (
              <div className="related-articles-section">
                <div className="section-header">
                  <h3 className="section-title">
                    <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    相關文章
                  </h3>
                  <span className="articles-count">{relatedArticles.length}</span>
                </div>
                <div className="related-articles-list">
                  {relatedArticles.map((relatedArticle, index) => (
                    <div
                      key={relatedArticle.id}
                      onClick={() => router.push(`/${companyCode}/articles/${relatedArticle.id}`)}
                      className="related-article-item"
                    >
                      <div className="related-item-number">{index + 1}</div>
                      <div className="related-item-content">
                        <div className="related-item-title">{relatedArticle.title}</div>
                        <div className="related-item-meta">
                          <span className="category-tag">{relatedArticle.category.name}</span>
                          <div className="meta-date">
                            <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(relatedArticle.publish_date)}
                          </div>
                        </div>
                      </div>
                      <svg className="related-item-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* 返回頂部按鈕 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="back-to-top-btn"
        title="返回頂部"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  )
}