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
              <svg className="breadcrumb-separator" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button 
                onClick={handleBackToList}
                className="breadcrumb-link"
              >
                <svg className="breadcrumb-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                文章專區
              </button>
              <svg className="breadcrumb-separator" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button 
                onClick={handleCategoryClick}
                className="breadcrumb-link"
              >
                <svg className="breadcrumb-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {article.category.name}
              </button>
              <svg className="breadcrumb-separator" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="breadcrumb-current">{article.title}</span>
            </div>
          </nav>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="article-detail-container">
        <div className="article-detail-wrapper">
          {/* 主要文章內容 */}
          <main className="article-main-content">
            <article className="article-detail-card">
              {/* 文章標題區域 */}
              <header className="article-header">
                <div className="article-badges">
                  <span className={`category-badge ${article.category.slug || 'general'}`}>
                    <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {article.category.name}
                  </span>
                  {article.is_featured && (
                    <span className="featured-badge">
                      <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      精選文章
                    </span>
                  )}
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
                    <span className="share-label">分享文章</span>
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
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
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
              </header>

              {/* 文章圖片 */}
              {article.image_url && (
                <div className="article-image-container">
                  <img
                    src={article.image_url.startsWith('http') ? article.image_url : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}${article.image_url}`}
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
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
                />
              </div>
            </article>

            {/* 文章導航 */}
            {(prev || next) && (
              <nav className="article-navigation">
                <h3 className="nav-title">
                  <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  相關文章導航
                </h3>
                <div className="nav-links">
                  {prev && (
                    <button
                      onClick={() => router.push(`/${companyCode}/articles/${prev.id}`)}
                      className="nav-link prev"
                    >
                      <div className="nav-direction">
                        <svg className="nav-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>上一篇</span>
                      </div>
                      <span className="nav-article-title">{prev.title}</span>
                    </button>
                  )}
                  {next && (
                    <button
                      onClick={() => router.push(`/${companyCode}/articles/${next.id}`)}
                      className="nav-link next"
                    >
                      <div className="nav-direction">
                        <span>下一篇</span>
                        <svg className="nav-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <span className="nav-article-title">{next.title}</span>
                    </button>
                  )}
                </div>
              </nav>
            )}
          </main>

          {/* 側邊欄 */}
          <aside className="article-sidebar">
            {/* 相關文章 */}
            {relatedArticles && relatedArticles.length > 0 && (
              <section className="related-articles-section">
                <div className="section-header">
                  <h3 className="section-title">
                    <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    相關文章
                  </h3>
                  <span className="articles-count">{relatedArticles.length} 篇</span>
                </div>
                <div className="related-articles-list">
                  {relatedArticles.map((item, index) => (
                    <article
                      key={item.id}
                      className="related-article-item"
                      onClick={() => router.push(`/${companyCode}/articles/${item.id}`)}
                    >
                      <div className="related-item-number">{index + 1}</div>
                      <div className="related-item-content">
                        <h4 className="related-item-title">{item.title}</h4>
                        <div className="related-item-meta">
                          <span className="category-tag">{item.category.name}</span>
                          <div className="meta-date">
                            <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(item.publish_date)}</span>
                          </div>
                        </div>
                      </div>
                      <svg className="related-item-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </article>
                  ))}
                </div>
              </section>
            )}

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
          </aside>
        </div>
      </div>
    </div>
  )
}