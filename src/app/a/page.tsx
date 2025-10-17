'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import { verifyTokenOnce } from '@/lib/tokenVerification'


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

export default function AgentAHomePage() {
  const { user } = useUserStore()
  const modules = useEnabledModules()

  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])

  const companyCode = 'a'




  useEffect(() => {
    const token = localStorage.getItem(`portalToken_${companyCode}`)
    const userData = localStorage.getItem(`portalUser_${companyCode}`)

    // 如果有 token 和用戶資料，驗證 token 並記錄登入紀錄
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        // 驗證 token 並記錄登入紀錄（防重複調用）
        verifyTokenOnce(companyCode).catch(error => {
          // Token 驗證失敗，靜默處理
        })
      } catch (error) {
        // 解析用戶資料失敗，靜默處理
      }
    }

    //   banner：不需要登入，正常 fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBanners)
      .catch(() => setBanners([]))

    //   marquee：登入狀態使用認證端點，登出狀態使用公開端點
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=${companyCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(setMarquees)
        .catch(() => setMarquees([]))
    } else {
      // 登出狀態下使用公開端點
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/marquee?company=${companyCode}`)
        .then(res => res.ok ? res.json() : [])
        .then(setMarquees)
        .catch(() => setMarquees([]))
    }


    //   最新消息：獲取最新4則新聞
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/news?company=${companyCode}&page=1&limit=4`)
      .then(res => res.ok ? res.json() : { data: [] })
      .then(data => setLatestNews(data.data || []))
      .catch(() => setLatestNews([]))
  }, [])







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

  const renderModule = useCallback((key: string, props: any = {}) => {
    const mod = modules.find((m) => m.key === key)
    if (!mod) return null
    const Comp = mod.Component
    return <Comp {...props} />
  }, [modules])

  return (
    <>

      <div>
        

        {user && (
          <div>
            {/* <p>這裡可以顯示你要的內容</p> */}
          </div>
        )}

        {renderModule('banner', { banners })}
        {renderModule('marquee', { marquees })}

        {/* 最新消息區塊 */}
        {latestNews.length > 0 && (
          <div style={{ 
            maxWidth: '1200px', 
            margin: '40px auto', 
            padding: '0 20px' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#333',
                margin: 0 
              }}>
                最新消息
              </h2>
              <a 
                href="/a/news"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                MORE+
              </a>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px' 
            }}>
              {latestNews.map((news) => (
                <a
                  key={news.id}
                  href={`/a/news/${news.id}`}
                  style={{
                    display: 'block',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {news.image_url && (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE}${news.image_url}`}
                      alt={news.title}
                      style={{
                        width: '100%',
                        height: '160px',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginBottom: '8px' 
                    }}>
                      {news.is_featured && (
                        <span style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          置頂
                        </span>
                      )}
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {getCategoryName(news.category)}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {news.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 12px 0',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {news.summary}
                    </p>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>📅 {formatDate(news.publish_date)}</span>
                      <span>👁 {news.view_count} 次瀏覽</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
