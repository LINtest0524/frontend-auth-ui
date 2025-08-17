'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { useCartStore } from '@/hooks/use-cart-store-new'
import FacebookLoginButton from '@/components/FacebookLoginButton'
import './login.css'


export default function AgentLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enabledLoginMethods, setEnabledLoginMethods] = useState<string[]>(['USERNAME_PASSWORD', 'FACEBOOK'])
  const [loginMethodsLoading, setLoginMethodsLoading] = useState(true)
  const searchParams = useSearchParams()

  const setUser = useUserStore((s) => s.setUser)
  const companyCode = 'a'

  // 載入公司登入方式設定
  useEffect(() => {
    const fetchLoginMethods = async () => {
      try {
        const res = await fetch(`http://localhost:3001/company/code/${companyCode}/login-methods`)
        if (res.ok) {
          const data = await res.json()
          setEnabledLoginMethods(data.loginMethods || ['USERNAME_PASSWORD', 'FACEBOOK'])
        } else {
          console.warn('無法載入登入方式設定，使用預設值')
          setEnabledLoginMethods(['USERNAME_PASSWORD', 'FACEBOOK'])
        }
      } catch (error) {
        console.error('載入登入方式設定失敗:', error)
        setEnabledLoginMethods(['USERNAME_PASSWORD', 'FACEBOOK'])
      } finally {
        setLoginMethodsLoading(false)
      }
    }
    fetchLoginMethods()
  }, [companyCode])

  // 檢查URL參數中的錯誤訊息
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')
    
    if (errorParam) {
      switch (errorParam) {
        case 'facebook_cancelled':
          setError('Facebook 登入已取消')
          break
        case 'facebook_error':
          setError('Facebook 登入發生錯誤，請稍後再試')
          break
        case 'facebook_login_failed':
          setError('Facebook 登入失敗，請稍後再試')
          break
        case 'facebook_unauthorized':
          // 使用後端傳來的具體錯誤訊息
          setError(messageParam ? decodeURIComponent(messageParam) : '帳號權限不足，無法登入')
          break
        default:
          setError('登入發生錯誤')
      }
    }
  }, [searchParams])

  const handleLogin = async () => {
    if (!companyCode) {
      setError('無法取得公司代碼')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`http://localhost:3001/portal/auth/login?company=${companyCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || '登入失敗')
      }

      const data = await res.json()

      // 使用公司代碼作為鍵名前綴
      localStorage.setItem(`portalToken_${companyCode}`, data.token)
      localStorage.setItem(`portalUser_${companyCode}`, JSON.stringify(data.user))
      // 記錄登入時間，避免立即進行 token 驗證
      localStorage.setItem(`tokenCreatedTime_${companyCode}`, Date.now().toString())
      if (data.user.enabledModules) {
        localStorage.setItem(`enabledModules_${companyCode}`, JSON.stringify(data.user.enabledModules))
      }

      setUser(data.user)

      // 刷新購物車以切換到用戶專屬購物車
      useCartStore.getState().refreshCart()

      //   動態導回該公司首頁
      window.location.href = `/${companyCode}`
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  if (loginMethodsLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">載入中...</p>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* 頁面標題 */}
        <div className="login-header">
          <h1 className="login-title">會員登入</h1>
          <p className="login-subtitle">歡迎回來！請登入您的帳戶以繼續購物</p>
        </div>

        {/* 帳號密碼登入 */}
        {enabledLoginMethods.includes('USERNAME_PASSWORD') && (
          <div className="login-form">
            <div className="input-group">
              <label className="input-label">帳號</label>
              <input
                type="text"
                placeholder="請輸入您的帳號"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">密碼</label>
              <input
                type="password"
                placeholder="請輸入您的密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="login-button"
            >
              {loading ? '登入中...' : '立即登入'}
            </button>
          </div>
        )}

        {/* 第三方登入選項 */}
        {(enabledLoginMethods.includes('FACEBOOK') || enabledLoginMethods.includes('GOOGLE') || enabledLoginMethods.includes('LINE')) && (
          <>
            {enabledLoginMethods.includes('USERNAME_PASSWORD') && (
              <div className="divider">
                <span className="divider-text">或使用其他方式登入</span>
              </div>
            )}

            <div className="social-login">
              {/* Facebook 登入 */}
              {enabledLoginMethods.includes('FACEBOOK') && (
                <div onClick={() => setError('')}>
                  <FacebookLoginButton 
                    className="social-button facebook"
                    companyCode={companyCode}
                  />
                </div>
              )}

              {/* Google 登入 (預留) */}
              {enabledLoginMethods.includes('GOOGLE') && (
                <button className="social-button google">
                  <span>🔍</span>
                  使用 Google 登入 (開發中)
                </button>
              )}

              {/* LINE 登入 (預留) */}
              {enabledLoginMethods.includes('LINE') && (
                <button className="social-button line">
                  <span>💬</span>
                  使用 LINE 登入 (開發中)
                </button>
              )}
            </div>
          </>
        )}

        {/* 如果沒有啟用任何登入方式 */}
        {enabledLoginMethods.length === 0 && (
          <div className="warning-message">
            目前沒有可用的登入方式，請聯絡管理員。
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 底部連結 */}
        <div className="login-footer">
          <a href={`/${companyCode}/register`} className="footer-link">
            還沒有帳戶？立即註冊
          </a>
          <span style={{ margin: '0 1rem', color: '#e2e8f0' }}>|</span>
          <a href={`/${companyCode}`} className="footer-link">
            返回首頁
          </a>
        </div>
      </div>
    </div>
  )
}
