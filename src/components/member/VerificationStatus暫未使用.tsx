'use client'

import { useEffect, useState } from 'react'
import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_BASE

interface Props {
  type: 'ID_CARD' | 'BANK_ACCOUNT'
}

export default function VerificationStatus({ type }: Props) {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE'>('NONE')

  const typeLabel = type === 'ID_CARD' ? '身分證驗證' : '銀行帳戶驗證'

  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem('portalToken')
      if (!token) return

      try {
        const res = await axios.get(`${API_URL}/api/id-verification/me?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        console.log(`✅ ${typeLabel}：`, res.data)
        setStatus(res.data?.status || 'NONE')
      } catch (err: unknown) {
        const error = err as AxiosError
        if (error.response?.status === 404) {
          setStatus('NONE')
        } else {
          console.error(`❌ 取得 ${typeLabel} 狀態失敗：`, err)
        }
      }
    }

    fetchStatus()
  }, [type])

  const handleDelete = async () => {
    const token = localStorage.getItem('portalToken')
    if (!token) return

    if (!confirm(`確定要刪除 ${typeLabel} 資料嗎？`)) return

    try {
      await axios.delete(`${API_URL}/api/id-verification?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatus('NONE')
    } catch (err) {
      console.error('刪除失敗:', err)
      alert('刪除失敗，請稍後再試')
    }
  }

  return (
    <div>
      <span className="font-medium">{typeLabel}：</span>
      {status === 'NONE' && (
        <a
          className="text-blue-600 underline ml-2 cursor-pointer"
          href={type === 'ID_CARD' ? '/portal/[company]/member/id-verification' : '/portal/[company]/member/bank-verification'}
        >
          前往驗證
        </a>
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
  )
}
