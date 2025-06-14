'use client'

import { useState } from 'react'

export default function PortalLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:3001/portal/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || '登入失敗')
      }

      const data = await res.json()
      localStorage.setItem('portalToken', data.token)

      // ✅ 登入成功後重新導向頁面，讓 layout 正確刷新
      window.location.href = '/portal'
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

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}
