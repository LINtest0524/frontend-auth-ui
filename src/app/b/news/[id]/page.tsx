import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import NewsDetailClient from './NewsDetailClient'
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

// 獲取新聞資料的伺服器端函數
async function getNewsData(newsId: string): Promise<NewsResponse | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api'
    const response = await fetch(
      `${apiBase}/portal/news/${newsId}?company=b`,
      { 
        cache: 'no-store', // 確保獲取最新資料
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch news data:', error)
    return null
  }
}

// 動態生成 metadata 用於 SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params
  const newsData = await getNewsData(id)
  
  if (!newsData) {
    return {
      title: '新聞不存在',
      description: '您要查看的新聞不存在或已下架',
    }
  }

  const { news } = newsData
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    title: `${news.title} | 代理商公司B`,
    description: news.summary || news.content.substring(0, 160),
    keywords: `新聞,${news.category},代理商公司B`,
    authors: [{ name: '代理商公司B' }],
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: news.title,
      description: news.summary || news.content.substring(0, 160),
      url: `${baseUrl}/b/news/${news.id}`,
      siteName: '代理商公司B',
      images: news.image_url ? [
        {
          url: news.image_url.startsWith('http') ? news.image_url : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}${news.image_url}`,
          width: 1200,
          height: 630,
          alt: news.title,
        }
      ] : [],
      locale: 'zh_TW',
      type: 'article',
      publishedTime: news.publish_date,
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description: news.summary || news.content.substring(0, 160),
      images: news.image_url ? [news.image_url.startsWith('http') ? news.image_url : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}${news.image_url}`] : [],
    },
    alternates: {
      canonical: `${baseUrl}/b/news/${news.id}`,
    },
  }
}

export default async function NewsDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const newsData = await getNewsData(id)
  
  if (!newsData) {
    notFound()
  }

  return (
    <>
      <PortalHeaderBar />
      <NewsDetailClient newsData={newsData} companyCode="b" />
    </>
  )
}