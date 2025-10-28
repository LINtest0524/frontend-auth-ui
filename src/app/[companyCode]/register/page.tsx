'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { useCartStore } from '@/hooks/use-cart-store-new'
import { CsrfTokenManager } from '@/lib/csrf'
import '../../a/register/register.css'

export default function DynamicCompanyRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const companyCode = params.companyCode as string
  const { setUser } = useUserStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [agentCode, setAgentCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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
      router.push(`/${targetCompany}?justRegistered=true`) // 導回動態路由的首頁，添加註冊標記
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
              placeholder="請輸入代理商推廣代碼（選填）"
              value={agentCode}
              onChange={(e) => setAgentCode(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="input-hint">若無代理商代碼，將自動分配給預設代理商</div>
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
          <a href={`/${companyCode}/login`} className="footer-link">
            已有帳戶？立即登入
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