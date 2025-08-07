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
  const searchParams = useSearchParams()

  const setUser = useUserStore((s) => s.setUser)
  const companyCode = 'a'

  // 檢查URL參數中的錯誤訊息
  useEffect(() => {
    const errorParam = searchParams.get('error')
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

      localStorage.setItem('portalToken', data.token)
      localStorage.setItem('portalUser', JSON.stringify(data.user))
      if (data.user.enabledModules) {
        localStorage.setItem('enabledModules', JSON.stringify(data.user.enabledModules))
      }

      setUser(data.user)

      // ✅ 動態導回該公司首頁
      window.location.href = `/${companyCode}`
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-xl font-bold mb-4">會員登入</h1>

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

      {/* Facebook 登入 */}
      <div className="mt-6 w-64">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或</span>
          </div>
        </div>

        <div className="mt-6">
          <div onClick={() => setError('')}>
            <FacebookLoginButton className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center" />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-500 mt-4 bg-red-100 border border-red-300 px-3 py-2 rounded shadow-sm">
          {error}
        </p>
      )}
    </div>
  )
}
