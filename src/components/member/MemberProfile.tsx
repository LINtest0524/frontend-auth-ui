'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_BASE

type VerifyType = 'ID_CARD' | 'BANK_ACCOUNT'
type VerifyStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'NONE'

interface MemberProfileProps {
  onGoToIdVerification?: () => void
  onGoToBankVerification?: () => void
}

export default function MemberProfile({
  onGoToIdVerification,
  onGoToBankVerification,
}: MemberProfileProps) {
  const { user } = useUserStore()
  const pathname = usePathname()
  
  // 從路徑獲取公司代碼
  const getCompanyCode = () => {
    const segments = pathname.split('/')
    return segments[1] // /a/member -> 'a', /b/member -> 'b'
  }
  
  const getToken = () => {
    const companyCode = getCompanyCode()
    return localStorage.getItem(`portalToken_${companyCode}`)
  }

  const [statusMap, setStatusMap] = useState<Record<VerifyType, VerifyStatus>>({
    ID_CARD: 'NONE',
    BANK_ACCOUNT: 'NONE',
  })

  const fetchStatus = async (type: VerifyType) => {
    const token = getToken()
    if (!token) return

    try {
      const res = await axios.get(`${API_URL}/api/id-verification/me?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatusMap((prev) => ({ ...prev, [type]: res.data?.status || 'NONE' }))
    } catch (err: unknown) {
      const error = err as AxiosError
      if (error.response?.status === 404) {
        // 404 是正常情況，表示用戶還沒有上傳過驗證資料
        setStatusMap((prev) => ({ ...prev, [type]: 'NONE' }))
      } else {
        // 取得驗證狀態失敗，靜默處理
      }
    }
  }

  const handleDelete = async (type: VerifyType) => {
    const token = getToken()
    if (!token) return
    if (!confirm('確定要刪除驗證資料嗎？')) return

    try {
      await axios.delete(`${API_URL}/api/id-verification?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatusMap((prev) => ({ ...prev, [type]: 'NONE' }))
    } catch (err) {
      // 刪除驗證失敗，靜默處理
      alert('刪除失敗，請稍後再試')
    }
  }

  useEffect(() => {
    fetchStatus('ID_CARD')
    fetchStatus('BANK_ACCOUNT')
  }, [])

  const getStatusIcon = (type: VerifyType) => {
    return type === 'ID_CARD' ? '🆔' : '🏦'
  }

  const renderStatus = (
    type: VerifyType,
    label: string,
    onGo?: () => void
  ) => {
    const status = statusMap[type]

    return (
      <div className="member-verification-item">
        <div className="member-verification-label">
          <div className="member-verification-icon">
            {getStatusIcon(type)}
          </div>
          {label}
        </div>
        <div className="member-verification-actions">
          {status === 'NONE' && (
            <>
              <span className="member-verification-status none">未驗證</span>
              <button
                className="member-verification-btn primary"
                onClick={onGo}
              >
                ✨ 前往驗證
              </button>
            </>
          )}
          {status === 'PENDING' && (
            <span className="member-verification-status pending">等待驗證中</span>
          )}
          {status === 'PROCESSING' && (
            <span className="member-verification-status processing">處理中</span>
          )}
          {status === 'APPROVED' && (
            <span className="member-verification-status approved">✅ 已驗證</span>
          )}
          {status === 'REJECTED' && (
            <>
              <span className="member-verification-status rejected">❌ 驗證失敗</span>
              <button
                className="member-verification-btn danger"
                onClick={() => handleDelete(type)}
              >
                🔄 重新驗證
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="member-not-logged-in">
        <div className="member-not-logged-in-icon">🔒</div>
        <div className="member-not-logged-in-text">尚未登入</div>
      </div>
    )
  }

  return (
    <div className="member-profile-card">
      <div className="member-profile-header">
        <h2 className="member-profile-title">
          <div className="member-profile-icon">👤</div>
          個人基本資料
        </h2>
      </div>
      
      <div className="member-profile-content">
        <div className="member-profile-info">
          <div className="member-info-item">
            <div className="member-info-label">帳號</div>
            <div className={`member-info-value ${!user.username ? 'member-info-empty' : ''}`}>
              {user.username || '（無）'}
            </div>
          </div>
          
          <div className="member-info-item">
            <div className="member-info-label">信箱</div>
            <div className={`member-info-value ${!user.email ? 'member-info-empty' : ''}`}>
              {user.email || '（無）'}
            </div>
          </div>
          
          <div className="member-info-item">
            <div className="member-info-label">角色</div>
            <div className={`member-info-value ${!user.role ? 'member-info-empty' : ''}`}>
              {user.role || '（無）'}
            </div>
          </div>
          
          {renderStatus('ID_CARD', '身分證驗證', onGoToIdVerification)}
          {renderStatus('BANK_ACCOUNT', '銀行帳戶驗證', onGoToBankVerification)}
        </div>
      </div>
    </div>
  )
}
