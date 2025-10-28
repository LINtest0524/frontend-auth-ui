import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ArticleDetailClient from './ArticleDetailClient'
import '@/styles/pages/articles.css'

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

// 獲取文章資料的伺服器端函數
async function getArticleData(articleId: string, companyCode: string): Promise<ArticleResponse | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'
    const response = await fetch(
      `${apiBase}/portal/articles/${articleId}?company=${companyCode}`,
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
    // 載入文章資料失敗，靜默處理
    return null
  }
}

// 動態生成 metadata 用於 SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string, companyCode: string }> 
}): Promise<Metadata> {
  const { id, companyCode } = await params
  const articleData = await getArticleData(id, companyCode)
  
  if (!articleData) {
    return {
      title: '文章不存在',
      description: '您要查看的文章不存在或已下架',
    }
  }

  const { article } = articleData
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    title: `${article.title} | ${companyCode.toUpperCase()} 公司`,
    description: article.summary || article.content.substring(0, 160),
    keywords: `文章,${article.category.name},${companyCode}公司`,
    authors: [{ name: `${companyCode.toUpperCase()} 公司` }],
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: article.title,
      description: article.summary || article.content.substring(0, 160),
      url: `${baseUrl}/${companyCode}/articles/${article.id}`,
      siteName: `${companyCode.toUpperCase()} 公司`,
      images: article.image_url ? [
        {
          url: article.image_url.startsWith('http') ? article.image_url : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}${article.image_url}`,
          width: 1200,
          height: 630,
          alt: article.title,
        }
      ] : [],
      locale: 'zh_TW',
      type: 'article',
      publishedTime: article.publish_date,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary || article.content.substring(0, 160),
      images: article.image_url ? [article.image_url.startsWith('http') ? article.image_url : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}${article.image_url}`] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${companyCode}/articles/${article.id}`,
    },
  }
}

export default async function DynamicArticleDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string, companyCode: string }> 
}) {
  const { id, companyCode } = await params
  const articleData = await getArticleData(id, companyCode)
  
  if (!articleData) {
    notFound()
  }

  return (
    <>
      <ArticleDetailClient articleData={articleData} companyCode={companyCode} />
    </>
  )
}