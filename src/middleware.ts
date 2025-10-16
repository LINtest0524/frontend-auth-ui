import { NextRequest, NextResponse } from 'next/server'
import { maintenanceMiddleware } from './middleware/maintenance'

export async function middleware(request: NextRequest) {
  // 執行維護模式檢查
  const maintenanceResponse = await maintenanceMiddleware(request)
  
  // 如果維護中間件返回重導向，直接返回
  if (maintenanceResponse.status === 307 || maintenanceResponse.status === 308) {
    return maintenanceResponse
  }
  
  // 可以在這裡添加其他中間件邏輯
  // 例如：驗證、日誌記錄等
  
  return NextResponse.next()
}

// 配置中間件適用的路徑
export const config = {
  matcher: [
    /*
     * 匹配所有路徑除了：
     * - api 路由 (以 /api/ 開頭)
     * - _next/static (靜態資源)
     * - _next/image (圖片優化)
     * - favicon.ico
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}