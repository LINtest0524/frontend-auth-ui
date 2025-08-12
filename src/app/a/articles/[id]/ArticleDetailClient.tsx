'use client'

import { useRouter } from 'next/navigation'
import '@/styles/pages/news.css'

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
    <div className="news-detail-container">
      {/* 麵包屑 */}
      <div className="breadcrumb">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-gray-600">
            <button 
              onClick={() => router.push(`/${companyCode}`)}
              className="hover:text-blue-600"
            >
              首頁
            </button>
            <span className="mx-2">/</span>
            <button 
              onClick={handleBackToList}
              className="hover:text-blue-600"
            >
              文章專區
            </button>
            <span className="mx-2">/</span>
            <button 
              onClick={handleCategoryClick}
              className="hover:text-blue-600"
            >
              {article.category.name}
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-800">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="news-article">
          {/* 文章標題 */}
          <header className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`category-badge ${article.category.slug || 'general'}`}>
                {article.category.name}
              </span>
              {article.is_featured && (
                <span className="featured-badge">
                  精選
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            <div className="flex items-center justify-between text-sm text-gray-600 border-b pb-4">
              <div className="flex items-center gap-4">
                <span>發布時間：{formatDate(article.publish_date)}</span>
                <span>瀏覽次數：{article.view_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>分享：</span>
                <button
                  onClick={() => handleShare('facebook')}
                  className="share-btn facebook"
                  title="分享到 Facebook"
                >
                  FB
                </button>
                <button
                  onClick={() => handleShare('line')}
                  className="share-btn line"
                  title="分享到 LINE"
                >
                  LINE
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="share-btn copy"
                  title="複製連結"
                >
                  複製
                </button>
              </div>
            </div>
          </header>

          {/* 文章圖片 */}
          {article.image_url && (
            <div className="mb-6">
              <img
                src={article.image_url.startsWith('http') ? article.image_url : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}${article.image_url}`}
                alt={article.title}
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* 文章摘要 */}
          {article.summary && (
            <div className="summary mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700 font-medium">{article.summary}</p>
            </div>
          )}

          {/* 文章內容 */}
          <div 
            className="content prose max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* 上一篇/下一篇導航 */}
        <nav className="navigation mt-8 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div className="prev-news">
              {prev && (
                <button
                  onClick={() => router.push(`/${companyCode}/articles/${prev.id}`)}
                  className="nav-link prev"
                >
                  <span className="nav-label">上一篇</span>
                  <span className="nav-title">{prev.title}</span>
                </button>
              )}
            </div>
            <div className="next-news">
              {next && (
                <button
                  onClick={() => router.push(`/${companyCode}/articles/${next.id}`)}
                  className="nav-link next"
                >
                  <span className="nav-label">下一篇</span>
                  <span className="nav-title">{next.title}</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* 相關文章 */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="related-news mt-8 pt-6 border-t">
            <h3 className="text-xl font-bold mb-4">相關文章</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedArticles.map((item) => (
                <div
                  key={item.id}
                  className="related-item p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/${companyCode}/articles/${item.id}`)}
                >
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="text-sm text-gray-600 flex justify-between">
                    <span>{item.category.name}</span>
                    <span>{formatDate(item.publish_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 返回按鈕 */}
        <div className="text-center mt-8">
          <button
            onClick={handleBackToList}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回文章列表
          </button>
        </div>
      </div>
    </div>
  )
}