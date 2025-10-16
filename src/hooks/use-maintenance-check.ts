import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { checkMaintenanceStatusClient } from '@/middleware/maintenance'

interface MaintenanceState {
  isChecking: boolean
  isMaintenanceMode: boolean
  lastChecked: Date | null
}

export function useMaintenanceCheck(companyCode: string, intervalMs: number = 30000) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [state, setState] = useState<MaintenanceState>({
    isChecking: false,
    isMaintenanceMode: false,
    lastChecked: null
  })

  // 檢查是否為後台或豁免路徑
  const isExemptRoute = useCallback(() => {
    const exemptPaths = ['/maintenance', '/dashboard', '/login', '/admin']
    return exemptPaths.some(path => pathname.startsWith(path))
  }, [pathname])

  // 執行維護狀態檢查
  const checkMaintenance = useCallback(async () => {
    if (isExemptRoute()) {
      return
    }

    setState(prev => ({ ...prev, isChecking: true }))

    try {
      const result = await checkMaintenanceStatusClient(companyCode)
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        isMaintenanceMode: result.isEnabled,
        lastChecked: new Date()
      }))

      // 如果檢測到維護模式，立即重導向
      if (result.isEnabled && result.redirectUrl) {
        router.push(result.redirectUrl)
      }
    } catch (error) {
      console.error('維護狀態檢查失敗:', error)
      setState(prev => ({
        ...prev,
        isChecking: false,
        lastChecked: new Date()
      }))
    }
  }, [companyCode, router, isExemptRoute])

  // 手動觸發檢查
  const forceCheck = useCallback(() => {
    checkMaintenance()
  }, [checkMaintenance])

  // 初始化和定期檢查
  useEffect(() => {
    if (isExemptRoute()) {
      return
    }

    // 立即執行一次檢查
    checkMaintenance()

    // 設定定期檢查
    const interval = setInterval(checkMaintenance, intervalMs)

    return () => clearInterval(interval)
  }, [checkMaintenance, intervalMs, isExemptRoute])

  // 當路徑變化時重新檢查
  useEffect(() => {
    if (!isExemptRoute()) {
      checkMaintenance()
    }
  }, [pathname, checkMaintenance, isExemptRoute])

  return {
    ...state,
    forceCheck,
    isExemptRoute: isExemptRoute()
  }
}

// 維護模式警告組件的 Hook
export function useMaintenanceWarning(companyCode: string) {
  const { isMaintenanceMode, isChecking, forceCheck } = useMaintenanceCheck(companyCode, 10000)
  
  return {
    shouldShowWarning: isMaintenanceMode,
    isChecking,
    onRetry: forceCheck
  }
}

// 全域維護狀態管理
let globalMaintenanceState: { [key: string]: boolean } = {}

export function setGlobalMaintenanceState(companyCode: string, isEnabled: boolean) {
  globalMaintenanceState[companyCode] = isEnabled
}

export function getGlobalMaintenanceState(companyCode: string): boolean {
  return globalMaintenanceState[companyCode] || false
}