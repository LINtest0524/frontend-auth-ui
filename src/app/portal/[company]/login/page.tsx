'use client'

import { useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useParams } from 'next/navigation'

export default function PortalLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setUser = useUserStore((s) => s.setUser)
  const params = useParams()
  const companyCode = params.company as string || 'default'

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`http://localhost:3001/portal/auth/login?company=${companyCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || '登入失敗')
      }

      const data = await res.json()

      localStorage.setItem('portalToken', data.token)
      localStorage.setItem('portalUser', JSON.stringify(data.user))
      setUser(data.user)

      const targetCompany = data.user.company?.code || 'default'
      console.log('✅ 登入成功，導向:', `/portal/${targetCompany}`)

      window.location.href = `/portal/${targetCompany}`
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

      {error && (
        <p className="text-red-500 mt-4 bg-red-100 border border-red-300 px-3 py-2 rounded shadow-sm">
          {error}
        </p>
      )}
    </div>
  )
}
