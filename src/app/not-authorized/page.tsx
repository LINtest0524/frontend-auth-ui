'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NotAuthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    // 5秒後自動跳轉到首頁
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fef3f2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }

  const cardStyle = {
    maxWidth: '400px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: '32px',
    textAlign: 'center' as const
  }

  const iconContainerStyle = {
    margin: '0 auto 24px',
    width: '80px',
    height: '80px',
    backgroundColor: '#fecaca',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '16px'
  }

  const messageStyle = {
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.6'
  }

  const buttonPrimaryStyle = {
    width: '100%',
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: '500',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background-color 0.2s'
  }

  const buttonSecondaryStyle = {
    width: '100%',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontWeight: '500',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }

  const hintStyle = {
    fontSize: '14px',
    color: '#9ca3af',
    marginTop: '24px'
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* 圖示 */}
        <div style={iconContainerStyle}>
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#dc2626" 
            strokeWidth="2"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* 標題 */}
        <h1 style={titleStyle}>
          🚫 存取被拒絕
        </h1>

        {/* 訊息 */}
        <p style={messageStyle}>
          很抱歉，您沒有權限存取此頁面。<br />
          請聯繫系統管理員以獲得相關權限。
        </p>

        {/* 按鈕組 */}
        <div>
          <button
            style={buttonPrimaryStyle}
            onClick={() => router.push('/dashboard')}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            🏠 返回首頁
          </button>
          
          <button
            style={buttonSecondaryStyle}
            onClick={() => router.back()}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          >
            ⬅️ 返回上一頁
          </button>
        </div>

        {/* 自動跳轉提示 */}
        <p style={hintStyle}>
          💡 5秒後將自動跳轉到首頁
        </p>
      </div>
    </div>
  )
}
