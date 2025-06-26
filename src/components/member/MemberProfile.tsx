'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useEffect, useState } from 'react'
import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_BASE


interface MemberProfileProps {
  onGoToVerification?: () => void
}

export default function MemberProfile({ onGoToVerification }: MemberProfileProps) {
  const { user } = useUserStore()
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE'>('NONE')

  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem('portalToken')
      if (!token) return

      try {
        const res = await axios.get(`${API_URL}/api/id-verification/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
console.log('✅ 驗證資料：', res.data)
        setStatus(res.data?.status || 'NONE')
      } catch (err: unknown) {
        const error = err as AxiosError
        if (error.response?.status === 404) {
          setStatus('NONE')
        } else {
          console.error('❌ 取得驗證狀態失敗：', err)
        }
      }
    }

    fetchStatus()
  }, [])

  const handleDelete = async () => {
    const token = localStorage.getItem('portalToken')
    if (!token) return

    if (!confirm('確定要刪除驗證資料嗎？')) return

    try {
      await axios.delete(`${API_URL}/api/id-verification`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatus('NONE')
    } catch (err) {
      console.error('刪除失敗:', err)
      alert('刪除失敗，請稍後再試')
    }
  }

  if (!user) return <div className="text-gray-500">尚未登入</div>

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">個人基本資料</h2>
      <div className="space-y-2">
        <div>
          <span className="font-medium">帳號：</span>
          <span>{user.username || '（無）'}</span>
        </div>
        <div>
          <span className="font-medium">信箱：</span>
          <span>{user.email || '（無）'}</span>
        </div>
        <div>
          <span className="font-medium">角色：</span>
          <span>{user.role || '（無）'}</span>
        </div>
        <div>
          <span className="font-medium">身分證驗證：</span>
          {status === 'NONE' && (
            <button
              className="text-blue-600 underline ml-2"
              onClick={() => onGoToVerification?.()}

            >
              前往驗證
            </button>
          )}
          {status === 'PENDING' && <span className="text-yellow-600 ml-2">等待驗證中</span>}
          {status === 'APPROVED' && <span className="text-green-600 ml-2">已驗證</span>}
          {status === 'REJECTED' && (
            <>
              <span className="text-red-600 ml-2">驗證失敗</span>
              <button
                className="text-blue-600 underline ml-2"
                onClick={handleDelete}
              >
                重新驗證
              </button>
            </>
          )}
          
        </div>
      </div>
    </div>
  )
}
