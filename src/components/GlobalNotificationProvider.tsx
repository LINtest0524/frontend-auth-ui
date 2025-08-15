'use client'

import { usePathname } from 'next/navigation'
import VerificationNotificationSimple from './VerificationNotificationSimple'

export default function GlobalNotificationProvider() {
  const pathname = usePathname()
  
  // 檢查是否在後台頁面（根據實際的路由結構）
  const isDashboard = pathname === '/dashboard' ||
                     pathname?.startsWith('/dashboard/') ||
                     pathname?.startsWith('/admin/') || 
                     pathname?.startsWith('/audit-log/') ||
                     pathname === '/users' ||
                     pathname?.startsWith('/users/') ||
                     pathname?.startsWith('/lucky-draw/') ||
                     pathname === '/back-menu' ||
                     pathname?.startsWith('/back-menu/')

  // 排除登入頁面和前台頁面
  const isLoginPage = pathname === '/login'
  const isPortalPage = pathname?.startsWith('/portal') || 
                      pathname?.startsWith('/a/') || 
                      pathname?.startsWith('/b/')

  if (!isDashboard || isLoginPage || isPortalPage) {
    return null
  }

  return <VerificationNotificationSimple />
}