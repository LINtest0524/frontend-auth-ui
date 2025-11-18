'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAgentContext() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // 獲取當前的代理商代碼
  const agentCode = searchParams.get('agent')
  
  // 創建保持代理商上下文的導航函數
  const navigateWithAgent = useCallback((path: string) => {
    if (agentCode) {
      // 如果有代理商上下文，添加 agent 參數
      const url = new URL(path, window.location.origin)
      url.searchParams.set('agent', agentCode)
      router.push(url.pathname + url.search)
    } else {
      // 沒有代理商上下文，正常導航
      router.push(path)
    }
  }, [agentCode, router])
  
  // 創建保持代理商上下文的連結 URL
  const getLinkWithAgent = useCallback((path: string) => {
    if (agentCode) {
      const url = new URL(path, window.location.origin)
      url.searchParams.set('agent', agentCode)
      return url.pathname + url.search
    }
    return path
  }, [agentCode])
  
  return {
    agentCode,
    navigateWithAgent,
    getLinkWithAgent,
    hasAgent: !!agentCode
  }
}