'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useEnabledModules } from '@/lib/useEnabledModules'
import { verifyTokenOnce } from '@/lib/tokenVerification'
import { useCompanyConfig, useFeatureEnabled, useThemeConfig } from '@/hooks/useCompanyConfig'
import BannerCarousel from '@/components/BannerCarousel'
import Marquee from '@/components/Marquee'
import LatestNews from '@/components/LatestNews'
import './styles/index.css'

export default function AgentAHomePage() {
  const { user } = useUserStore()
  const modules = useEnabledModules()

  const [banners, setBanners] = useState<any[]>([])
  const [marquees, setMarquees] = useState<any[]>([])
  const companyCode = 'a'
  
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


  }, [])








  const renderModule = useCallback((key: string, props: any = {}) => {
    const mod = modules.find((m) => m.key === key)
    if (!mod) {
      // A 公司模組系統有問題，強制顯示 Banner 和 Marquee
      if (key === 'banner') {
        return <BannerCarousel {...props} />;
      }
      if (key === 'marquee') {
        return <Marquee {...props} />;
      }
      return null;
    }
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

        {renderModule('banner', { banners, companyCode })}
        {renderModule('marquee', { marquees, companyCode })}

        {/* 最新消息區塊 - 使用新的元件 */}
        <LatestNews companyCode={companyCode} limit={4} showMore={true} />

      </div>

      {/* 🚀 配置系統演示區塊 - 移至最下方 */}
      {config && (
        <div 
          style={{
            background: `linear-gradient(135deg, ${config.branding.primaryColor}, ${config.branding.secondaryColor})`,
            color: 'white',
            padding: '2rem',
            marginTop: '3rem'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                🎉 歡迎來到 {config.companyInfo.name}
              </h1>
              <p style={{ fontSize: '1.2rem', opacity: 0.9, margin: 0 }}>
                配置系統已成功整合！以下是動態載入的配置效果
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {/* 主題配置 */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', margin: '0 0 1rem 0' }}>🎨 主題配置</h3>
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
              
              {/* 功能狀態 */}
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
              
              {/* VIP 系統詳細 */}
              {vipEnabled && config.modules.optional?.vipSystem && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
                  <h3 style={{ fontWeight: 'bold', margin: '0 0 1rem 0' }}>👑 VIP 系統</h3>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <p>等級數: {config.modules.optional.vipSystem.levels?.length || 0}</p>
                    <p>轉換率: 1:{config.modules.optional.vipSystem.pointsSystem?.conversionRate}</p>
                    <p>升級動畫: {config.modules.optional.vipSystem.levelUpAnimation ? '是' : '否'}</p>
                  </div>
                </div>
              )}
              
              {/* 音效系統詳細 */}
              {soundEnabled && config.modules.optional?.soundEffects && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
                  <h3 style={{ fontWeight: 'bold', margin: '0 0 1rem 0' }}>🔊 音效系統</h3>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <p>音量: {config.modules.optional.soundEffects.volume}%</p>
                    <p>背景音樂: {config.modules.optional.soundEffects.backgroundMusic?.enabled ? '是' : '否'}</p>
                    <p>音效檔案: {Object.keys(config.modules.optional.soundEffects.sounds || {}).length}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ fontSize: '0.9rem', opacity: 0.75, margin: 0 }}>
                ✨ 這些資料都是從 <code>/config/companies/a.json</code> 動態載入的
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
