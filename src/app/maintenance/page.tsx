'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import './maintenance.css'

const API_URL = process.env.NEXT_PUBLIC_API_BASE

interface MaintenanceInfo {
  isEnabled: boolean
  title?: string
  message?: string
  estimatedEndTime?: string
  contactInfo?: string
  backgroundColor?: string
  textColor?: string
}

export default function MaintenancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyCode = searchParams.get('company') || 'a'
  
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo>({
    isEnabled: true,
    title: '系統維護中',
    message: '系統正在進行維護升級，請稍後再試。',
    backgroundColor: '#1f2937',
    textColor: '#ffffff'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        // 根據 company code 獲取 company ID（這裡簡化處理）
        const companyId = companyCode === 'a' ? 1 : 2
        
        const response = await axios.get(`${API_URL}/maintenance/info/${companyId}`)
        const info = response.data
        
        if (!info.isEnabled) {
          // 如果維護模式已關閉，重導向到首頁
          router.replace(`/${companyCode}`)
          return
        }
        
        setMaintenanceInfo(info)
      } catch (error) {
        console.error('獲取維護資訊失敗:', error)
        // 如果 API 失敗，顯示預設維護頁面
      } finally {
        setLoading(false)
      }
    }

    checkMaintenanceStatus()
    
    // 每 30 秒檢查一次維護狀態
    const interval = setInterval(checkMaintenanceStatus, 30000)
    
    return () => clearInterval(interval)
  }, [companyCode, router])

  const formatEstimatedTime = (timeString?: string) => {
    if (!timeString) return null
    try {
      return new Date(timeString).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="maintenance-loading-page">
        <div className="maintenance-loading-spinner"></div>
        <p>載入中...</p>
      </div>
    )
  }

  return (
    <div 
      className="maintenance-page"
      style={{
        backgroundColor: maintenanceInfo.backgroundColor,
        color: maintenanceInfo.textColor
      }}
    >
      <div className="maintenance-content">
        {/* 維護圖示 */}
        <div className="maintenance-visual">
          <div className="maintenance-icon-large">🔧</div>
          <div className="maintenance-gears">
            <div className="gear gear-1">⚙️</div>
            <div className="gear gear-2">⚙️</div>
          </div>
        </div>

        {/* 主要內容 */}
        <div className="maintenance-main">
          <h1 className="maintenance-main-title">
            {maintenanceInfo.title}
          </h1>
          
          <p className="maintenance-main-message">
            {maintenanceInfo.message}
          </p>

          {/* 預計完成時間 */}
          {maintenanceInfo.estimatedEndTime && (
            <div className="maintenance-time-info">
              <div className="time-icon">⏰</div>
              <div className="time-content">
                <div className="time-label">預計完成時間</div>
                <div className="time-value">
                  {formatEstimatedTime(maintenanceInfo.estimatedEndTime)}
                </div>
              </div>
            </div>
          )}

          {/* 聯絡資訊 */}
          {maintenanceInfo.contactInfo && (
            <div className="maintenance-contact-info">
              <div className="contact-icon">📞</div>
              <div className="contact-content">
                <div className="contact-label">如有急事請聯繫</div>
                <div className="contact-value">
                  {maintenanceInfo.contactInfo}
                </div>
              </div>
            </div>
          )}

          {/* 提示訊息 */}
          <div className="maintenance-tips">
            <div className="tip-item">
              <span className="tip-icon">💡</span>
              <span className="tip-text">頁面將自動檢查維護狀態</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔄</span>
              <span className="tip-text">維護完成後將自動重導向</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">⏳</span>
              <span className="tip-text">感謝您的耐心等待</span>
            </div>
          </div>

          {/* 手動重新檢查按鈕 */}
          <div className="maintenance-actions">
            <button
              onClick={() => window.location.reload()}
              className="refresh-btn"
            >
              <span className="refresh-icon">🔄</span>
              重新檢查
            </button>
          </div>
        </div>

        {/* 裝飾元素 */}
        <div className="maintenance-decoration">
          <div className="decoration-dot dot-1"></div>
          <div className="decoration-dot dot-2"></div>
          <div className="decoration-dot dot-3"></div>
          <div className="decoration-line line-1"></div>
          <div className="decoration-line line-2"></div>
        </div>
      </div>

      {/* 背景動畫 */}
      <div className="maintenance-background">
        <div className="bg-particle particle-1"></div>
        <div className="bg-particle particle-2"></div>
        <div className="bg-particle particle-3"></div>
        <div className="bg-particle particle-4"></div>
      </div>
    </div>
  )
}