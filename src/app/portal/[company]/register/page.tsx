'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'

export default function PortalRegisterPage() {
  const { company } = useParams()
  const router = useRouter()
  const { setUser } = useUserStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username || !password) {
      setMessage('帳號與密碼為必填')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`http://localhost:3001/portal/auth/register?company=${company}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || '註冊失敗')
      }

      const data = await res.json()

      // ✅ 寫入 localStorage
      localStorage.setItem('portalToken', data.token)
      localStorage.setItem('portalUser', JSON.stringify(data.user))
      if (data.user.enabledModules) {
        localStorage.setItem('enabledModules', JSON.stringify(data.user.enabledModules))
      }

      setUser(data.user)

      const targetCompany = data.user.company?.code || 'default'
      router.push(`/portal/${targetCompany}`)
    } catch (err: any) {
      setMessage(`❌ ${err.message || '發生錯誤'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded bg-white shadow">
      <h1 className="text-2xl font-bold mb-4">註冊頁面</h1>

      <input
        type="text"
        placeholder="帳號"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="密碼"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
      />
      <input
        type="email"
        placeholder="信箱（選填）"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 px-4 py-2 border rounded"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '註冊中...' : '註冊'}
      </button>

      {message && <p className="mt-4 text-sm text-center">{message}</p>}
    </div>
  )
}
