'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import { verifyTokenOnce } from '@/lib/tokenVerification'
import { useCompanyConfig, useFeatureEnabled, useThemeConfig } from '@/hooks/useCompanyConfig'
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
  
  // 🚀 配置系統整合
  const { config, loading: configLoading, error: configError } = useCompanyConfig(companyCode)
  const themeConfig = useThemeConfig(config)
  const soundEnabled = useFeatureEnabled(config, 'soundEffects')
  const leaderboardEnabled = useFeatureEnabled(config, 'leaderboard')
  const vipEnabled = useFeatureEnabled(config, 'vipSystem')
  const liveChatEnabled = useFeatureEnabled(config, 'liveChat')
  
  // 🔍 Debug logs - 簡化版
  // 用戶狀態檢查
  
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 修復時序競爭條件：添加延遲重試機制
    const loadPageData = () => {
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
    }

    // 立即執行一次
    loadPageData()

    // 如果沒有 token 但 URL 顯示已登入狀態，延遲重試
    const token = localStorage.getItem(`portalToken_${companyCode}`)
    if (!token && window.location.search.includes('justRegistered')) {
      console.log('🔄 檢測到註冊後跳轉，延遲重試載入...')
      setTimeout(loadPageData, 500) // 500ms 後重試
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
          <div></div>
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
      {/* 🚀 配置系統演示區塊 */}
      {config && (
        <div 
          className="config-demo-section"
          style={{
            background: `linear-gradient(135deg, ${config.branding.primaryColor}, ${config.branding.secondaryColor})`,
            color: 'white',
            padding: '2rem',
            marginBottom: '2rem'
          }}
        >
          <div className="container mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-2">
                🎉 歡迎來到 {config.companyInfo.name}
              </h1>
              <p className="text-xl opacity-90">
                配置系統已成功整合！以下是動態載入的配置效果
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 主題配置 */}
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-bold mb-2">🎨 主題配置</h3>
                <div className="space-y-2 text-sm">
                  <p>主題: {config.branding.theme}</p>
                  <div className="flex items-center gap-2">
                    <span>主色:</span>
                    <div 
                      className="w-4 h-4 rounded border border-white"
                      style={{ backgroundColor: config.branding.primaryColor }}
                    />
                    <span className="text-xs">{config.branding.primaryColor}</span>
                  </div>
                  <p>佈局: {config.layout.type}</p>
                </div>
              </div>
              
              {/* 功能狀態 */}
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-bold mb-2">🔧 功能狀態</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>🔊 音效:</span>
                    <span>{soundEnabled ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🏆 排行榜:</span>
                    <span>{leaderboardEnabled ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👑 VIP:</span>
                    <span>{vipEnabled ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💬 客服:</span>
                    <span>{liveChatEnabled ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
              
              {/* 系統資訊 */}
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-bold mb-2">⚙️ 系統資訊</h3>
                <div className="space-y-1 text-sm">
                  <p>公司代碼: {config.companyInfo.code}</p>
                  <p>貨幣: {config.companyInfo.currency}</p>
                  <p>時區: {config.companyInfo.timezone}</p>
                  <p>新架構: {config.system.useNewArchitecture ? '是' : '否'}</p>
                </div>
              </div>
              
              {/* VIP 系統 (如果啟用) */}
              {vipEnabled && config.modules.optional?.vipSystem && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <h3 className="font-bold mb-2">👑 VIP 系統</h3>
                  <div className="space-y-1 text-sm">
                    <p>等級數: {config.modules.optional.vipSystem.levels?.length || 0}</p>
                    <p>轉換率: 1:{config.modules.optional.vipSystem.pointsSystem?.conversionRate}</p>
                    <p>升級動畫: {config.modules.optional.vipSystem.levelUpAnimation ? '是' : '否'}</p>
                  </div>
                </div>
              )}
              
              {/* 音效系統 (如果啟用) */}
              {soundEnabled && config.modules.optional?.soundEffects && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <h3 className="font-bold mb-2">🔊 音效系統</h3>
                  <div className="space-y-1 text-sm">
                    <p>音量: {config.modules.optional.soundEffects.volume}%</p>
                    <p>背景音樂: {config.modules.optional.soundEffects.backgroundMusic?.enabled ? '是' : '否'}</p>
                    <p>音效檔案: {Object.keys(config.modules.optional.soundEffects.sounds || {}).length}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center mt-6">
              <p className="text-sm opacity-75">
                ✨ 這些資料都是從 <code>/config/companies/{companyCode}.json</code> 動態載入的
              </p>
            </div>
          </div>
        </div>
      )}
      
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