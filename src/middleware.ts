import { NextRequest, NextResponse } from 'next/server'
import { maintenanceMiddleware } from './middleware/maintenance'

export async function middleware(request: NextRequest) {
  // 執行維護模式檢查
  const maintenanceResponse = await maintenanceMiddleware(request)
  
  // 如果維護中間件返回重導向，直接返回
  if (maintenanceResponse.status === 307 || maintenanceResponse.status === 308) {
    return maintenanceResponse
  }
  
  // 🚀 路由統一處理 - 暫時停用重寫，讓 A、B 直接使用原路由
  // const { pathname } = request.nextUrl
  
  // 檢查是否為舊的靜態公司路由 (a/, b/)
  // const legacyCompanyMatch = pathname.match(/^\/([ab])($|\/.*$)/)
  
  // if (legacyCompanyMatch) {
  //   const companyCode = legacyCompanyMatch[1] // 'a' 或 'b'
  //   const remainingPath = legacyCompanyMatch[2] || '' // 後續路徑
    
  //   // 重寫到動態路由，但保持 URL 不變 (用戶看到的還是 /a/games)
  //   const newUrl = request.nextUrl.clone()
  //   newUrl.pathname = `/_company/${companyCode}${remainingPath}`
    
  //   console.log(`[Middleware] 路由重寫: ${pathname} → ${newUrl.pathname}`)
    
  //   return NextResponse.rewrite(newUrl)
  // }
  
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