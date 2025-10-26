'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import { verifyTokenOnce } from '@/lib/tokenVerification'
import '../../styles/pages/news.css'

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

export default function DynamicCompanyHomePage() {
  const params = useParams()
  const companyCode = params.companyCode as string
  const { user } = useUserStore()
  const modules = useEnabledModules()
  
  // 🔍 Debug logs - 簡化版
  // 用戶狀態檢查
  
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(`portalToken_${companyCode}`)
    const userData = localStorage.getItem(`portalUser_${companyCode}`)
    
    // 已移除敏感認證信息的日誌輸出

    // 如果有 token 和用戶資料，驗證 token 並記錄登入紀錄
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        verifyTokenOnce(companyCode).catch(error => {
          console.error('❌ Token verification failed:', error)
        })
      } catch (error) {
        console.error('❌ User data parse failed:', error)
      }
    }

    // 獲取公司資訊
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/company/code/${companyCode}/config`)
        
        if (response.ok) {
          const data = await response.json()
          setCompanyInfo(data)
        } else {
          console.error('Company not found:', companyCode)
        }
      } catch (error) {
        console.error('Error fetching company info:', error)
      } finally {
        setLoading(false)
      }
    }

    // 載入 Banner（不需要登入）
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${companyCode}`)
      .then(res => {
        if (res.ok) return res.json()
        throw new Error(`Banner API error: ${res.status}`)
      })
      .then(data => {
        console.log('🎌 [Banner] Data received:', data.length, 'items')
        setBanners(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('❌ Banner fetch error:', err)
        setBanners([])
      })

    // 載入跑馬燈（與原有 /a 頁面邏輯一致）
    if (token) {
      // 登入狀態使用認證端點
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${companyCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(setMarquees)
        .catch(() => setMarquees([]))
    } else {
      // 登出狀態使用公開端點
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/marquee?company=${companyCode}`)
        .then(res => res.ok ? res.json() : [])
        .then(setMarquees)
        .catch(() => setMarquees([]))
    }

    // 載入最新消息（與原有 /a 頁面邏輯一致）
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/news?company=${companyCode}&page=1&limit=4`)
      .then(res => res.ok ? res.json() : { data: [] })
      .then(data => setLatestNews(data.data || []))
      .catch(() => setLatestNews([]))

    if (companyCode) {
      fetchCompanyInfo()
    }
  }, [companyCode])

  // 模組渲染器
  const renderModule = useCallback((key: string, props: any = {}) => {
    const mod = modules.find((m) => m.key === key)
    if (!mod) {
      console.warn(`⚠️ Module "${key}" not found`)
      return null
    }
    
    try {
      const Comp = mod.Component
      return <Comp {...props} />
    } catch (error) {
      console.error(`❌ Error rendering module ${key}:`, error)
      return null
    }
  }, [modules])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (!companyInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">公司不存在</h1>
          <p className="text-gray-600">找不到代碼為 "{companyCode}" 的公司</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner 組件 */}
      {renderModule('banner', { banners })}
      
      {/* 跑馬燈組件 */}
      {renderModule('marquee', { marquees })}

      <div className="container mx-auto px-4 py-8">
        {/* 最新消息區塊 */}
        {latestNews.length > 0 && (
          <div className="news-section" style={{ marginTop: '2rem' }}>
            <h2 className="section-title" style={{ 
              textAlign: 'center', 
              marginBottom: '2rem',
              color: '#1e293b',
              fontSize: '1.75rem',
              fontWeight: '700'
            }}>📰 最新消息</h2>
            <div className="news-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '2rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {latestNews.slice(0, 3).map((news) => (
                <div key={news.id} className="news-card">
                  <div className="news-card-header">
                    {news.image_url && (
                      <div className="news-card-image">
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_BASE}${news.image_url}`} 
                          alt={news.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="image-overlay"></div>
                      </div>
                    )}
                  </div>
                  <div className="news-card-content">
                    <h3 className="news-card-title">{news.title}</h3>
                    <p className="news-card-summary">{news.summary}</p>
                    <div className="news-card-meta">
                      <span className="news-date">
                        {new Date(news.publish_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {latestNews.length > 3 && (
              <div className="news-more-section" style={{ 
                textAlign: 'center', 
                marginTop: '2rem' 
              }}>
                <a href={`/${companyCode}/news`} className="news-more-btn" style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  查看更多消息 →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}