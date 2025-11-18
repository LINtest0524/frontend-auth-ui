'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { useAgentContext } from '@/hooks/useAgentContext'
import { checkLoginByCompany } from '@/lib/duplicateLoginChecker'
import { CsrfTokenManager } from '@/lib/csrf'
import '../../a/login/login.css'

export default function DynamicCompanyLoginPage() {
  const router = useRouter()
  const params = useParams()
  const companyCode = params.companyCode as string
  const { setUser } = useUserStore()
  const { agentCode: urlAgentCode, navigateWithAgent, getLinkWithAgent } = useAgentContext()
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companyInfo, setCompanyInfo] = useState<any>(null)

  useEffect(() => {
    // 獲取公司登入方式配置
    const fetchCompanyConfig = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/company/code/${companyCode}/login-methods`)
        if (response.ok) {
          const data = await response.json()
          setCompanyInfo(data)
        }
      } catch (error) {
        console.error('Error fetching company config:', error)
      }
    }

    if (companyCode) {
      fetchCompanyConfig()
    }
  }, [companyCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/login?company=${companyCode}`, {
        method: 'POST',
        headers: CsrfTokenManager.getHeaders(),
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        
        // 儲存登入資訊
        console.log('✅ [Login] Saving login data:', {
          companyCode,
          tokenKey: `portalToken_${companyCode}`,
          userKey: `portalUser_${companyCode}`,
          user: data.user,
          token: data.token?.substring(0, 20) + '...' // 只顯示前20字符
        })
        
        // 延遲一點再存儲，確保資料正確寫入
        setTimeout(() => {
          localStorage.setItem(`portalToken_${companyCode}`, data.token)
          localStorage.setItem(`portalUser_${companyCode}`, JSON.stringify(data.user))
          localStorage.setItem(`tokenCreatedTime_${companyCode}`, Date.now().toString())
          
          if (data.user.enabledModules) {
            localStorage.setItem(`enabledModules_${companyCode}`, JSON.stringify(data.user.enabledModules))
          }

          console.log('📦 [Login] Data stored, checking localStorage:', {
            hasToken: !!localStorage.getItem(`portalToken_${companyCode}`),
            hasUser: !!localStorage.getItem(`portalUser_${companyCode}`),
            hasTime: !!localStorage.getItem(`tokenCreatedTime_${companyCode}`)
          })

          setUser(data.user)

          // 重導向到首頁，保持代理商上下文
          console.log('🔄 [Login] Redirecting to:', `/${companyCode}`)
          if (urlAgentCode) {
            navigateWithAgent(`/${companyCode}`)
          } else {
            router.push(`/${companyCode}`)
          }
        }, 100)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '登入失敗')
      }
    } catch (error) {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleFacebookLogin = () => {
    if (!companyInfo?.loginMethods?.includes('FACEBOOK')) {
      setError('此公司不支援 Facebook 登入')
      return
    }
    
    let facebookAuthUrl = `${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/facebook?companyCode=${companyCode}`
    if (urlAgentCode) {
      facebookAuthUrl += `&agent=${urlAgentCode}`
    }
    window.location.href = facebookAuthUrl
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!companyInfo) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>載入登入頁面...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">會員登入</h1>
          <p className="login-subtitle">請輸入您的帳號密碼</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {companyInfo.loginMethods?.includes('USERNAME_PASSWORD') && (
            <>
              <div className="input-group">
                <label className="input-label" htmlFor="username">帳號</label>
                <input
                  id="username"
                  type="text"
                  className="input-field"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="請輸入帳號"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="password">密碼</label>
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="請輸入密碼"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? '登入中...' : '登入'}
              </button>
            </>
          )}
        </form>

        {companyInfo.loginMethods?.includes('FACEBOOK') && (
          <div className="social-login">
            <div className="divider">
              <span>或</span>
            </div>
            
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="social-button facebook"
              disabled={loading}
            >
              <span>📘</span>
              使用 Facebook 登入
            </button>
          </div>
        )}

        <div className="login-footer">
          <p>
            還沒有帳號？
            <a href={getLinkWithAgent(`/${companyCode}/register`)} className="register-link">
              立即註冊
            </a>
          </p>
          <p className="company-code">
            公司代碼: <span>{companyCode}</span>
            {urlAgentCode && <><br />代理商: <span style={{ color: '#0ea5e9' }}>{urlAgentCode}</span></>}
          </p>
        </div>
      </div>
    </div>
  )
}