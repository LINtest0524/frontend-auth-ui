'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'

export default function MemberEditForm() {
  const { user, setUser } = useUserStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('信箱不得為空')
      return
    }

    try {
      const token = localStorage.getItem('portalToken')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/${user?.id}`, {

        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '更新失敗')
      }

      const updated = await res.json()

      // 更新 localStorage 與 zustand
      localStorage.setItem('portalUser', JSON.stringify(updated))
      setUser(updated)

      setSuccess('信箱更新成功！')
    } catch (err: any) {
      setError(err.message || '發生錯誤')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">信箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        儲存修改
      </button>
    </form>
  )
}
