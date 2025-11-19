'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { useCartStore } from '@/hooks/use-cart-store-new'
import { useAgentContext } from '@/hooks/useAgentContext'
import { CsrfTokenManager } from '@/lib/csrf'
import '../../a/register/register.css'

export default function DynamicCompanyRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const companyCode = params.companyCode as string
  const { setUser } = useUserStore()
  const { agentCode: urlAgentCode, navigateWithAgent, getLinkWithAgent } = useAgentContext()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [agentCode, setAgentCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 確保組件已掛載
  useEffect(() => {
    setMounted(true)
  }, [])

  // 自動填入 URL 中的代理商代碼
  useEffect(() => {
    if (!mounted) return
    
    // 直接從 window.location 獲取參數，確保在客戶端正確執行
    const urlParams = new URLSearchParams(window.location.search)
    const agentParam = urlParams.get('agent')
    
    
    if (agentParam) {
      setAgentCode(agentParam)
    } else {
    }
  }, [mounted])

  // 備用：也監聽 useAgentContext 的變化
  useEffect(() => {
    if (urlAgentCode && !agentCode) {
      setAgentCode(urlAgentCode)
    }
  }, [urlAgentCode, agentCode])

  // 調試：監控代理商代碼的變化
  useEffect(() => {
  }, [agentCode, urlAgentCode])

  const handleSubmit = async () => {
    if (!username || !password) {
      setMessage('帳號與密碼為必填')
      return
    }

    if (!companyCode) {
      setMessage('無法辨識公司代碼')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      
      
      const res = await fetch(
        `${apiBase}/portal/auth/register?company=${companyCode}`,
        {
          method: 'POST',
          headers: CsrfTokenManager.getHeaders(),
          body: JSON.stringify({ username, password, email, agent_code: agentCode }),
        }
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || '註冊失敗')
      }

      const data = await res.json()

      localStorage.setItem(`portalToken_${companyCode}`, data.token)
      localStorage.setItem(`portalUser_${companyCode}`, JSON.stringify(data.user))
      if (data.user.enabledModules) {
        localStorage.setItem(`enabledModules_${companyCode}`, JSON.stringify(data.user.enabledModules))
      }

      setUser(data.user)

      // 刷新購物車以切換到用戶專屬購物車
      useCartStore.getState().refreshCart()

      const targetCompany = data.user.company?.code || companyCode
      // 註冊成功後保持代理商上下文
      if (urlAgentCode) {
        navigateWithAgent(`/${targetCompany}?justRegistered=true`)
      } else {
        router.push(`/${targetCompany}?justRegistered=true`)
      }
    } catch (err: any) {
      setMessage(`${err.message || '發生錯誤'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        {/* 頁面標題 */}
        <div className="register-header">
          <h1 className="register-title">會員註冊</h1>
          <p className="register-subtitle">加入我們，享受更好的購物體驗</p>
        </div>

        {/* 註冊表單 */}
        <div className="register-form">
          <div className="input-group">
            <label className="input-label">
              帳號 <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="請輸入您的帳號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="input-hint">帳號將作為您的登入識別</div>
          </div>
          
          <div className="input-group">
            <label className="input-label">
              密碼 <span className="required">*</span>
            </label>
            <input
              type="password"
              placeholder="請輸入您的密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="input-hint">密碼長度至少6個字元</div>
          </div>

          <div className="input-group">
            <label className="input-label">電子信箱</label>
            <input
              type="email"
              placeholder="請輸入您的電子信箱（選填）"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="input-hint">用於接收重要通知和優惠資訊</div>
          </div>

          <div className="input-group">
            <label className="input-label">代理商推廣代碼</label>
            <input
              type="text"
              placeholder={urlAgentCode ? `自動偵測: ${urlAgentCode}` : "請輸入代理商推廣代碼（選填）"}
              value={agentCode}
              onChange={(e) => setAgentCode(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              style={urlAgentCode ? { backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' } : {}}
            />
            <div className="input-hint">
              {urlAgentCode 
                ? `✅ 來自代理商 ${urlAgentCode} 的邀請連結，註冊後將成為其下線會員` 
                : '若無代理商代碼，將自動分配給預設代理商'
              }
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="register-button"
          >
            {loading ? '註冊中...' : '立即註冊'}
          </button>
        </div>

        {/* 訊息顯示 */}
        {message && (
          <div className={message.includes('成功') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        {/* 底部連結 */}
        <div className="register-footer">
          <a href={getLinkWithAgent(`/${companyCode}/login`)} className="footer-link">
            已有帳戶？立即登入
          </a>
          <span style={{ margin: '0 1rem', color: '#e2e8f0' }}>|</span>
          <a href={getLinkWithAgent(`/${companyCode}`)} className="footer-link">
            返回首頁
          </a>
        </div>
      </div>
    </div>
  )
}