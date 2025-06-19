'use client'

import { useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useRouter, useParams } from 'next/navigation'

export default function ChangePasswordPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const params = useParams()
  const companyCode = params.company

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('請填寫所有欄位')
      return
    }

    if (newPassword.length < 6) {
      setError('新密碼至少需 6 碼')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('新密碼與確認密碼不一致')
      return
    }

    try {
      const token = localStorage.getItem('portalToken')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '密碼修改失敗')
      }

      setSuccess('密碼修改成功！')
      setTimeout(() => {
        router.push(`/portal/${companyCode}/member`)
      }, 1500)
    } catch (err: any) {
      setError(err.message || '發生錯誤')
    }
  }

  if (!user) {
    return <div className="p-6 text-red-500">請先登入後再進行密碼修改</div>
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">修改密碼</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">舊密碼</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">新密碼</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">確認新密碼</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          送出修改
        </button>
      </form>
    </div>
  )
}
