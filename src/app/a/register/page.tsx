'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { useCartStore } from '@/hooks/use-cart-store-new'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import { useAgentContext } from '@/hooks/useAgentContext'
import { CsrfTokenManager } from '@/lib/csrf'
import './register.css'

export default function PortalRegisterPage() {
  const company = useCompanySlug()
  const router = useRouter()
  const { setUser } = useUserStore()
  const { agentCode: urlAgentCode, navigateWithAgent, getLinkWithAgent } = useAgentContext()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [agentCode, setAgentCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // 自動填入 URL 中的代理商代碼
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const agentParam = urlParams.get('agent')
      console.log('🎯 [Register A] URL agent param:', agentParam)
      if (agentParam) {
        // 通過 API 獲取真正的推廣代碼
        fetchAgentPromoCode(agentParam)
      }
    }
  }, [])

  // 獲取代理商的真正推廣代碼
  const fetchAgentPromoCode = async (subdomain: string) => {
    try {
      console.log('🔍 [Register A] Fetching promo code for:', subdomain)
      const response = await fetch(`/api/agents/verify-subdomain?companyCode=${company}&subdomain=${subdomain}`)
      if (response.ok) {
        const data = await response.json()
        const promoCode = data.promoCode
        console.log('✅ [Register A] Got promo code:', promoCode)
        setAgentCode(promoCode)
      } else {
        console.log('❌ [Register A] Failed to fetch promo code')
        setAgentCode(subdomain) // 備用：使用子網域名稱
      }
    } catch (error) {
      console.error('🚨 [Register A] Error fetching promo code:', error)
      setAgentCode(subdomain) // 備用：使用子網域名稱
    }
  }

  const handleSubmit = async () => {
    if (!username || !password) {
      setMessage('帳號與密碼為必填')
      return
    }

    if (!company) {
      setMessage('    無法辨識公司代碼')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      
      // 調試：顯示要發送的數據
      console.log('📤 [Register] Sending registration data:', {
        username,
        email,
        agent_code: agentCode,
        company,
        apiBase,
        fullUrl: `${apiBase}/portal/auth/register?company=${company}`
      });
      
      const headers = CsrfTokenManager.getHeaders();
      
      console.log('📤 [Register] Request headers:', headers);
      
      const res = await fetch(
        `${apiBase}/portal/auth/register?company=${company}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password, email, agent_code: agentCode }),
        }
      )

      console.log('🔍 [Register] Response status:', res.status);
      console.log('🔍 [Register] Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const responseText = await res.text();
        console.error('❌ [Register] Error response:', responseText);
        
        let errData;
        try {
          errData = JSON.parse(responseText);
        } catch {
          errData = { message: responseText || '註冊失敗' };
        }
        throw new Error(errData.message || '註冊失敗')
      }

      const data = await res.json()

      localStorage.setItem(`portalToken_${company}`, data.token)
      localStorage.setItem(`portalUser_${company}`, JSON.stringify(data.user))
      if (data.user.enabledModules) {
        localStorage.setItem(`enabledModules_${company}`, JSON.stringify(data.user.enabledModules))
      }

      setUser(data.user)

      // 刷新購物車以切換到用戶專屬購物車
      useCartStore.getState().refreshCart()

      const targetCompany = data.user.company?.code || company
      // 註冊成功後保持代理商上下文
      if (urlAgentCode) {
        navigateWithAgent(`/${targetCompany}?justRegistered=true`)
      } else {
        router.push(`/${targetCompany}?justRegistered=true`)
      }
    } catch (err: any) {
      setMessage(`    ${err.message || '發生錯誤'}`)
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
              placeholder={agentCode ? `推廣代碼: ${agentCode}` : "請輸入代理商推廣代碼（選填）"}
              value={agentCode}
              onChange={(e) => setAgentCode(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              style={agentCode ? { backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' } : {}}
            />
            <div className="input-hint">
              {agentCode && urlAgentCode
                ? `✅ 來自代理商 ${urlAgentCode} 的邀請連結，推廣代碼: ${agentCode}` 
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
          <a href={getLinkWithAgent(`/${company}/login`)} className="footer-link">
            已有帳戶？立即登入
          </a>
          <span style={{ margin: '0 1rem', color: '#e2e8f0' }}>|</span>
          <a href={getLinkWithAgent(`/${company}`)} className="footer-link">
            返回首頁
          </a>
        </div>
      </div>
    </div>
  )
}
