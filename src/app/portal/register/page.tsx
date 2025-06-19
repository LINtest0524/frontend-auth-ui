'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function PortalRegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { company } = useParams()
  const companyCode = typeof company === 'string' ? company : 'default'

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch(`http://localhost:3001/portal/auth/register?company=${companyCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || '註冊失敗')
      }

      const data = await res.json()
      localStorage.setItem('portalToken', data.token)
      localStorage.setItem('portalUser', JSON.stringify(data.user))

      // ✅ 註冊成功後導向該公司首頁
      window.location.href = `/portal/${companyCode}`
    } catch (err: any) {
      setError(err.message || '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-xl font-bold mb-4">會員註冊</h1>

      <input
        type="text"
        placeholder="帳號"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border rounded px-4 py-2 mb-2 w-64"
      />
      <input
        type="email"
        placeholder="Email（可選）"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
        onClick={handleRegister}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '註冊中...' : '註冊'}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-600 mt-4">✅ 註冊成功，已自動登入</p>}
    </div>
  )
}
