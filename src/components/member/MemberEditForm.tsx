'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname } from 'next/navigation'

export default function MemberEditForm() {
  const { user, setUser } = useUserStore()
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 從路徑獲取公司代碼
  const getCompanyCode = () => {
    const segments = pathname.split('/')
    return segments[1] // /a/member -> 'a', /b/member -> 'b'
  }
  
  const getToken = () => {
    const companyCode = getCompanyCode()
    return localStorage.getItem(`portalToken_${companyCode}`)
  }
  
  const updateUserInStorage = (updatedUser: any) => {
    const companyCode = getCompanyCode()
    localStorage.setItem(`portalUser_${companyCode}`, JSON.stringify(updatedUser))
  }

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
      const token = getToken()

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
      updateUserInStorage(updated)
      setUser(updated)

      setSuccess('信箱更新成功！')
    } catch (err: any) {
      setError(err.message || '發生錯誤')
    }
  }

  return (
    <div className="member-form-container">
      <div className="member-form-header">
        <h3 className="member-form-title">
          <div className="member-form-icon">✏️</div>
          修改個人資料
        </h3>
      </div>
      
      <div className="member-form-content">
        <form onSubmit={handleSubmit} className="member-form">
          <div className="member-form-group">
            <label className="member-form-label">信箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="member-form-input"
              placeholder="請輸入您的信箱地址"
            />
          </div>

          {error && <div className="member-form-message error">{error}</div>}
          {success && <div className="member-form-message success">{success}</div>}

          <button
            type="submit"
            className="member-form-button"
          >
            💾 儲存修改
          </button>
        </form>
      </div>
    </div>
  )
}
