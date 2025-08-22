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
      const token = localStorage.getItem('portalToken_a')
      if (!token && !user) {
        router.push('/a/login')
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
      <FloatingAds companyCode="a" />
    </>
  )
}