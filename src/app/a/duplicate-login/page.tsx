'use client'

import { useRouter } from 'next/navigation'
import './duplicate-login.css'

export default function DuplicateLoginPage() {
  const router = useRouter()

  const handleBackToLogin = () => {
    // 清除當前的 token 和相關數據
    localStorage.removeItem('portalToken_a')
    localStorage.removeItem('portalUser_a')
    localStorage.removeItem('enabledModules_a')
    localStorage.removeItem('sessionId_a')
    localStorage.removeItem('tokenCreatedTime_a')
    // 跳轉到登入頁面
    router.push('/a/login')
  }

  return (
    <div className="duplicate-login-page">
      <div className="duplicate-login-content">
        {/* 警告圖示 */}
        <div className="duplicate-login-visual">
          <div className="warning-icon-large">⚠️</div>
          <div className="warning-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>

        {/* 主要內容 */}
        <div className="duplicate-login-main">
          <h1 className="duplicate-login-title">
            重複登入檢測
          </h1>
          
          <p className="duplicate-login-message">
            您的帳號已在其他地方登入，為了保護您的帳號安全，目前的登入狀態已失效。
          </p>

          {/* 說明訊息 */}
          <div className="duplicate-login-info">
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span className="info-text">系統偵測到重複登入行為</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🛡️</span>
              <span className="info-text">為保護帳號安全已自動登出</span>
            </div>
            <div className="info-item">
              <span className="info-icon">👤</span>
              <span className="info-text">請重新登入以繼續使用</span>
            </div>
          </div>

          {/* 返回登入按鈕 */}
          <div className="duplicate-login-actions">
            <button
              onClick={handleBackToLogin}
              className="login-btn"
            >
              <span className="login-icon">🔑</span>
              返回登入頁面
            </button>
          </div>
        </div>

        {/* 裝飾元素 */}
        <div className="duplicate-login-decoration">
          <div className="decoration-dot dot-1"></div>
          <div className="decoration-dot dot-2"></div>
          <div className="decoration-dot dot-3"></div>
          <div className="decoration-line line-1"></div>
          <div className="decoration-line line-2"></div>
        </div>
      </div>

      {/* 背景動畫 */}
      <div className="duplicate-login-background">
        <div className="bg-particle particle-1"></div>
        <div className="bg-particle particle-2"></div>
        <div className="bg-particle particle-3"></div>
        <div className="bg-particle particle-4"></div>
      </div>
    </div>
  )
}