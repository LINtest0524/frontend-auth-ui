'use client'

import { useParams } from 'next/navigation'
import '../../a/duplicate-login/duplicate-login.css'

export default function DynamicDuplicateLoginPage() {
  const params = useParams()
  const companyCode = params.companyCode as string

  const handleReload = () => {
    window.location.href = `/${companyCode}/login`
  }

  return (
    <div className="duplicate-login-container">
      <div className="duplicate-login-card">
        <div className="duplicate-login-icon">
          ⚠️
        </div>
        
        <h1 className="duplicate-login-title">
          重複登入檢測
        </h1>
        
        <p className="duplicate-login-message">
          您的帳號已在其他地方登入，為了保護您的帳戶安全，當前會話已被終止。
        </p>
        
        <div className="duplicate-login-details">
          <p>可能的原因：</p>
          <ul>
            <li>在其他裝置或瀏覽器登入</li>
            <li>分頁被其他人使用</li>
            <li>網路連線異常</li>
          </ul>
        </div>
        
        <button 
          onClick={handleReload}
          className="duplicate-login-button"
        >
          重新登入
        </button>
        
        <div className="duplicate-login-footer">
          <p>公司代碼: <span className="company-code">{companyCode}</span></p>
          <p className="security-note">
            如果您沒有在其他地方登入，請聯繫客服人員
          </p>
        </div>
      </div>
    </div>
  )
}