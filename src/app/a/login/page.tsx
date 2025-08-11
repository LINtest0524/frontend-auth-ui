'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import FacebookLoginButton from '@/components/FacebookLoginButton'


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
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p>載入中...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-xl font-bold mb-4">會員登入</h1>

      {/* 帳號密碼登入 */}
      {enabledLoginMethods.includes('USERNAME_PASSWORD') && (
        <>
          <input
            type="text"
            placeholder="帳號"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded px-4 py-2 mb-2 w-64"
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded px-4 py-2 mb-4 w-64"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </>
      )}

      {/* 第三方登入選項 */}
      {(enabledLoginMethods.includes('FACEBOOK') || enabledLoginMethods.includes('GOOGLE') || enabledLoginMethods.includes('LINE')) && (
        <div className="mt-6 w-64">
          {enabledLoginMethods.includes('USERNAME_PASSWORD') && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {/* Facebook 登入 */}
            {enabledLoginMethods.includes('FACEBOOK') && (
              <div onClick={() => setError('')}>
                <FacebookLoginButton 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
                  companyCode={companyCode}
                />
              </div>
            )}

            {/* Google 登入 (預留) */}
            {enabledLoginMethods.includes('GOOGLE') && (
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center">
                <span className="mr-2">預覽</span>
                使用 Google 登入 (開發中)
              </button>
            )}

            {/* LINE 登入 (預留) */}
            {enabledLoginMethods.includes('LINE') && (
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center">
                <span className="mr-2">💬</span>
                使用 LINE 登入 (開發中)
              </button>
            )}
          </div>
        </div>
      )}

      {/* 如果沒有啟用任何登入方式 */}
      {enabledLoginMethods.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-yellow-800">目前沒有可用的登入方式，請聯絡管理員。</p>
        </div>
      )}

      {error && (
        <p className="text-red-500 mt-4 bg-red-100 border border-red-300 px-3 py-2 rounded shadow-sm">
          {error}
        </p>
      )}
    </div>
  )
}
