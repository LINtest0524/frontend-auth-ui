'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import { verifyTokenOnce } from '@/lib/tokenVerification'
import { useCompanyConfig, useFeatureEnabled, useThemeConfig } from '@/hooks/useCompanyConfig'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'


export default function AgentAHomePage() {
  const { user } = useUserStore()
  const modules = useEnabledModules()

  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])
  const [enabledModules, setEnabledModules] = useState<string[]>([])

  const companyCode = 'b' //   固定 company 為代理商 b
  
  // 🚀 配置系統整合
  const { config, loading: configLoading, error: configError } = useCompanyConfig(companyCode)
  const themeConfig = useThemeConfig(config)
  const soundEnabled = useFeatureEnabled(config, 'soundEffects')
  const leaderboardEnabled = useFeatureEnabled(config, 'leaderboard')
  const vipEnabled = useFeatureEnabled(config, 'vipSystem')
  const liveChatEnabled = useFeatureEnabled(config, 'liveChat')

  useEffect(() => {
    const token = localStorage.getItem(`portalToken_${companyCode}`)
    const userData = localStorage.getItem(`portalUser_${companyCode}`)

    // 如果有 token 和用戶資料，驗證 token 並記錄登入紀錄
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        // 驗證 token 並記錄登入紀錄（防重複調用）
        verifyTokenOnce(companyCode).catch(error => {
          console.error('Token 驗證失敗:', error)
        })
      } catch (error) {
        console.error('解析用戶資料失敗:', error)
      }
    }

    //   獲取啟用的模組列表
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=${companyCode}`)
      .then(res => res.ok ? res.json() : [])
      .then(setEnabledModules)
      .catch(() => setEnabledModules([]))

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

  }, [])

  const renderModule = useCallback((key: string, props: any = {}) => {
    //   檢查模組是否啟用
    if (!enabledModules.includes(key)) return null
    
    const mod = modules.find((m) => m.key === key)
    if (!mod) return null
    const Comp = mod.Component
    return <Comp {...props} />
  }, [modules, enabledModules])

  return (
    <>
      {/* 🚀 配置系統演示區塊 - B 公司版本 */}
      {config && (
        <div 
          style={{
            background: `linear-gradient(135deg, ${config.branding.primaryColor}, ${config.branding.secondaryColor})`,
            color: 'white',
            padding: '2rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                🎉 歡迎來到 {config.companyInfo.name}
              </h1>
              <p style={{ fontSize: '1.2rem', opacity: 0.9, margin: 0 }}>
                簡潔快速的遊戲體驗 - 配置系統已整合
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {/* 主題配置 */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 1rem 0' }}>🎨 主題配置</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p>主題: {config.branding.theme}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    <span>主色:</span>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '2px', 
                      border: '1px solid white',
                      backgroundColor: config.branding.primaryColor 
                    }} />
                    <span style={{ fontSize: '0.8rem' }}>{config.branding.primaryColor}</span>
                  </div>
                  <p>佈局: {config.layout.type}</p>
                </div>
              </div>
              
              {/* 功能狀態 - 顯示 B 公司的簡潔功能 */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 1rem 0' }}>🔧 功能狀態</h3>
                <div style={{ fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span>🔊 音效:</span>
                    <span>{soundEnabled ? '✅' : '❌'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span>🏆 排行榜:</span>
                    <span>{leaderboardEnabled ? '✅' : '❌'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span>👑 VIP:</span>
                    <span>{vipEnabled ? '✅' : '❌'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span>💬 客服:</span>
                    <span>{liveChatEnabled ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
              
              {/* B 公司的簡潔特色 */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 1rem 0' }}>⚡ 簡潔特色</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p>側邊欄: {config.layout.sidebar?.enabled ? '啟用' : '停用'}</p>
                  <p>頁腳: {config.layout.footer?.content}</p>
                  <p>專注於: 快速遊戲體驗</p>
                </div>
              </div>
              
              {/* 客服系統 (B 公司有啟用) */}
              {liveChatEnabled && config.modules.optional?.liveChat && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
                  <h3 style={{ fontWeight: 'bold', margin: '0 0 1rem 0' }}>💬 客服系統</h3>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <p>供應商: {config.modules.optional.liveChat.provider}</p>
                    <p>位置: {config.modules.optional.liveChat.position}</p>
                    <p>自動開啟: {config.modules.optional.liveChat.autoOpen ? '是' : '否'}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ fontSize: '0.9rem', opacity: 0.75, margin: 0 }}>
                ✨ 這些資料都是從 <code>/config/companies/b.json</code> 動態載入的
              </p>
            </div>
          </div>
        </div>
      )}
      
      <PortalHeaderBar />

      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-xl font-bold mb-4">B首頁</h1>

        {user && (
          <div className="border rounded p-4 bg-white shadow">
            <p>這裡可以顯示你要的內容</p>
          </div>
        )}

        {/*   直接顯示組件，不依賴模組系統 */}
        {enabledModules.includes('banner') && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Banner 輪播</h2>
            <BannerCarousel banners={banners} companyCode={companyCode} />
          </div>
        )}
        {enabledModules.includes('marquee') && (
          <div>
            <h2 className="text-lg font-semibold mb-2">跑馬燈</h2>
            <Marquee marquees={marquees} />
          </div>
        )}

        
      </div>

    </>
  )
}
