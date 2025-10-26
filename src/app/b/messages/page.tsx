'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useRouter } from 'next/navigation'
import MessageCenter from '@/components/message/MessageCenter'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import FloatingAds from '@/components/FloatingAds'

export default function MessagesPage() {
  const { user } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    // 檢查用戶是否已登入
    if (typeof window !== 'undefined') {
      // 動態獲取當前公司代碼的token
      const companyCode = window.location.pathname.split('/')[1] || 'b'
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      if (!token && !user) {
        router.push('/b/login')
        return
      }
    }
  }, [user, router])

  return (
    <>
      <PortalHeaderBar />
      <div style={{ paddingTop: '80px' }}>
        <MessageCenter />
      </div>
      <FloatingAds companyCode="b" />
    </>
  )
}