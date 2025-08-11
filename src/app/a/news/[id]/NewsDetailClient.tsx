'use client'

import { useRouter } from 'next/navigation'

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

interface NewsDetailClientProps {
  newsData: NewsResponse
  companyCode?: string
}

export default function NewsDetailClient({ newsData, companyCode = 'a' }: NewsDetailClientProps) {
  const router = useRouter()

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

  const { news, relatedNews, prev, next } = newsData

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
              onClick={() => router.push(`/${companyCode}/news`)}
              className="hover:text-blue-600"
            >
              最新消息
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-800">{news.title}</span>
          </nav>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="news-article">
          {/* 文章標題 */}
          <header className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`category-badge ${news.category.toLowerCase()}`}>
                {getCategoryName(news.category)}
              </span>
              {news.is_featured && (
                <span className="featured-badge">
                  精選
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {news.title}
            </h1>
            <div className="flex items-center justify-between text-sm text-gray-600 border-b pb-4">
              <div className="flex items-center gap-4">
                <span>發布時間：{formatDate(news.publish_date)}</span>
                <span>瀏覽次數：{news.view_count}</span>
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
          {news.image_url && (
            <div className="mb-6">
              <img
                src={news.image_url.startsWith('http') ? news.image_url : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}${news.image_url}`}
                alt={news.title}
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* 文章摘要 */}
          {news.summary && (
            <div className="summary mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700 font-medium">{news.summary}</p>
            </div>
          )}

          {/* 文章內容 */}
          <div 
            className="content prose max-w-none"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </article>

        {/* 上一篇/下一篇導航 */}
        <nav className="navigation mt-8 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div className="prev-news">
              {prev && (
                <button
                  onClick={() => router.push(`/${companyCode}/news/${prev.id}`)}
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
                  onClick={() => router.push(`/${companyCode}/news/${next.id}`)}
                  className="nav-link next"
                >
                  <span className="nav-label">下一篇</span>
                  <span className="nav-title">{next.title}</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* 相關新聞 */}
        {relatedNews && relatedNews.length > 0 && (
          <section className="related-news mt-8 pt-6 border-t">
            <h3 className="text-xl font-bold mb-4">相關新聞</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedNews.map((item) => (
                <div
                  key={item.id}
                  className="related-item p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/${companyCode}/news/${item.id}`)}
                >
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(item.publish_date)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 返回按鈕 */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push(`/${companyCode}/news`)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回新聞列表
          </button>
        </div>
      </div>
    </div>
  )
}