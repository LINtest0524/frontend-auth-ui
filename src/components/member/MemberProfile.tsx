'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useEffect, useState } from 'react'
import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_BASE

type VerifyType = 'ID_CARD' | 'BANK_ACCOUNT'
type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE'

interface MemberProfileProps {
  onGoToIdVerification?: () => void
  onGoToBankVerification?: () => void
}

export default function MemberProfile({
  onGoToIdVerification,
  onGoToBankVerification,
}: MemberProfileProps) {
  const { user } = useUserStore()

  const [statusMap, setStatusMap] = useState<Record<VerifyType, VerifyStatus>>({
    ID_CARD: 'NONE',
    BANK_ACCOUNT: 'NONE',
  })

  const fetchStatus = async (type: VerifyType) => {
    const token = localStorage.getItem('portalToken')
    if (!token) return

    try {
      const res = await axios.get(`${API_URL}/api/id-verification/me?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log(`✅ ${type} 驗證資料：`, res.data)
      setStatusMap((prev) => ({ ...prev, [type]: res.data?.status || 'NONE' }))
    } catch (err: unknown) {
      const error = err as AxiosError
      if (error.response?.status === 404) {
        setStatusMap((prev) => ({ ...prev, [type]: 'NONE' }))
      } else {
        console.error(`❌ 取得 ${type} 驗證狀態失敗：`, err)
      }
    }
  }

  const handleDelete = async (type: VerifyType) => {
    const token = localStorage.getItem('portalToken')
    if (!token) return
    if (!confirm('確定要刪除驗證資料嗎？')) return

    try {
      await axios.delete(`${API_URL}/api/id-verification?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatusMap((prev) => ({ ...prev, [type]: 'NONE' }))
    } catch (err) {
      console.error(`❌ 刪除 ${type} 驗證失敗:`, err)
      alert('刪除失敗，請稍後再試')
    }
  }

  useEffect(() => {
    fetchStatus('ID_CARD')
    fetchStatus('BANK_ACCOUNT')
  }, [])

  const renderStatus = (
    type: VerifyType,
    label: string,
    onGo?: () => void
  ) => {
    const status = statusMap[type]

    return (
      <div>
        <span className="font-medium">{label}：</span>
        {status === 'NONE' && (
          <button
            className="text-blue-600 underline ml-2"
            onClick={onGo}
          >
            前往驗證
          </button>
        )}
        {status === 'PENDING' && (
          <span className="text-yellow-600 ml-2">等待驗證中</span>
        )}
        {status === 'APPROVED' && (
          <span className="text-green-600 ml-2">已驗證</span>
        )}
        {status === 'REJECTED' && (
          <>
            <span className="text-red-600 ml-2">驗證失敗</span>
            <button
              className="text-blue-600 underline ml-2"
              onClick={() => handleDelete(type)}
            >
              重新驗證
            </button>
          </>
        )}
      </div>
    )
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
        {renderStatus('ID_CARD', '身分證驗證', onGoToIdVerification)}
        {renderStatus('BANK_ACCOUNT', '銀行帳戶驗證', onGoToBankVerification)}
      </div>
    </div>
  )
}
