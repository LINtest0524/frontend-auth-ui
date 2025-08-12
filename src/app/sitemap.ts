import type { MetadataRoute } from 'next'

// Function to get all news
async function getAllNews() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api'
    
    // Get news for Agent A
    const responseA = await fetch(`${apiBase}/portal/news?company=a&limit=1000`, {
      cache: 'no-store'
    })
    const newsA = responseA.ok ? await responseA.json() : []
    
    // Get news for Agent B
    const responseB = await fetch(`${apiBase}/portal/news?company=b&limit=1000`, {
      cache: 'no-store'
    })
    const newsB = responseB.ok ? await responseB.json() : []
    
    return { newsA: newsA.data || [], newsB: newsB.data || [] }
  } catch (error) {
    console.error('Failed to fetch news for sitemap:', error)
    return { newsA: [], newsB: [] }
  }
}

// Function to get all articles
async function getAllArticles() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api'
    
    // Get articles for Agent A
    const responseA = await fetch(`${apiBase}/portal/articles?company=a&limit=1000`, {
      cache: 'no-store'
    })
    const articlesA = responseA.ok ? await responseA.json() : []
    
    // Get articles for Agent B
    const responseB = await fetch(`${apiBase}/portal/articles?company=b&limit=1000`, {
      cache: 'no-store'
    })
    const articlesB = responseB.ok ? await responseB.json() : []
    
    return { articlesA: articlesA.data || [], articlesB: articlesB.data || [] }
  } catch (error) {
    console.error('Failed to fetch articles for sitemap:', error)
    return { articlesA: [], articlesB: [] }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const { newsA, newsB } = await getAllNews()
  const { articlesA, articlesB } = await getAllArticles()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Agent A pages
    {
      url: `${baseUrl}/a`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/a/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/a/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/a/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/a/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/a/member`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Agent B pages
    {
      url: `${baseUrl}/b`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/b/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/b/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/b/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/b/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/b/member`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]
  
  // Agent A news pages
  const newsAPages: MetadataRoute.Sitemap = newsA.map((news: any) => {
    // 安全處理日期，避免無效日期值
    let lastModified = new Date()
    try {
      const dateValue = news.updatedAt || news.updated_at || news.createdAt || news.created_at || news.publish_date
      if (dateValue) {
        const parsedDate = new Date(dateValue)
        if (!isNaN(parsedDate.getTime())) {
          lastModified = parsedDate
        }
      }
    } catch (error) {
      console.warn(`Invalid date for news ${news.id}:`, error)
    }
    
    return {
      url: `${baseUrl}/a/news/${news.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })
  
  // Agent B news pages
  const newsBPages: MetadataRoute.Sitemap = newsB.map((news: any) => {
    // 安全處理日期，避免無效日期值
    let lastModified = new Date()
    try {
      const dateValue = news.updatedAt || news.updated_at || news.createdAt || news.created_at || news.publish_date
      if (dateValue) {
        const parsedDate = new Date(dateValue)
        if (!isNaN(parsedDate.getTime())) {
          lastModified = parsedDate
        }
      }
    } catch (error) {
      console.warn(`Invalid date for news ${news.id}:`, error)
    }
    
    return {
      url: `${baseUrl}/b/news/${news.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  // Agent A articles pages
  const articlesAPages: MetadataRoute.Sitemap = articlesA.map((article: any) => {
    // 安全處理日期，避免無效日期值
    let lastModified = new Date()
    try {
      const dateValue = article.updatedAt || article.updated_at || article.createdAt || article.created_at || article.publish_date
      if (dateValue) {
        const parsedDate = new Date(dateValue)
        if (!isNaN(parsedDate.getTime())) {
          lastModified = parsedDate
        }
      }
    } catch (error) {
      console.warn(`Invalid date for article ${article.id}:`, error)
    }
    
    return {
      url: `${baseUrl}/a/articles/${article.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  // Agent B articles pages
  const articlesBPages: MetadataRoute.Sitemap = articlesB.map((article: any) => {
    // 安全處理日期，避免無效日期值
    let lastModified = new Date()
    try {
      const dateValue = article.updatedAt || article.updated_at || article.createdAt || article.created_at || article.publish_date
      if (dateValue) {
        const parsedDate = new Date(dateValue)
        if (!isNaN(parsedDate.getTime())) {
          lastModified = parsedDate
        }
      }
    } catch (error) {
      console.warn(`Invalid date for article ${article.id}:`, error)
    }
    
    return {
      url: `${baseUrl}/b/articles/${article.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })
  
  return [...staticPages, ...newsAPages, ...newsBPages, ...articlesAPages, ...articlesBPages]
}