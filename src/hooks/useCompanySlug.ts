'use client'
import { useParams } from 'next/navigation'

export function useCompanySlug(): string | null {
  const params = useParams()

  // 優先檢查是否有 company 參數（用於 /portal/[company] 路由）
  if (typeof params === 'object' && 'company' in params) {
    return params.company as string
  }

  // 對於 /a 和 /b 路由，直接從 URL 路徑解析
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/([^\/]+)/)
    return match ? match[1] : null
  }

  return null
}