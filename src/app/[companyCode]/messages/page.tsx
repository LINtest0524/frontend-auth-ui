'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useRouter, useParams } from 'next/navigation'
import MessageCenter from '@/components/message/MessageCenter'
import FloatingAds from '@/components/FloatingAds'

export default function DynamicMessagesPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const params = useParams()
  const companyCode = params.companyCode as string

  useEffect(() => {
    // 檢查用戶是否已登入
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      if (!token && !user) {
        router.push(`/${companyCode}/login`)
        return
      }
    }
  }, [user, router, companyCode])

  return (
    <>
      <div style={{ paddingTop: '80px' }}>
        <MessageCenter />
      </div>
      <FloatingAds companyCode={companyCode} />
    </>
  )
}