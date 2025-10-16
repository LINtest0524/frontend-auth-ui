import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

// 不受維護模式影響的路徑
const EXEMPT_PATHS = [
  '/maintenance',           // 維護頁面本身
  '/api/',                 // API 路由
  '/_next/',               // Next.js 內部資源
  '/favicon.ico',          // 網站圖標
  '/robots.txt',           // robots.txt
  '/sitemap.xml',          // sitemap
]

// 後台管理路徑（不受維護模式影響）
const ADMIN_PATHS = [
  '/dashboard',            // 後台首頁
  '/login',               // 後台登入頁
  '/admin',               // 後台管理
]

// 檢查路徑是否為豁免路徑
function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATHS.some(exemptPath => pathname.startsWith(exemptPath))
}

// 檢查路徑是否為後台路徑
function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(adminPath => pathname.startsWith(adminPath))
}

// 從路徑獲取公司代碼
function getCompanyCodeFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  // 檢查是否為有效的公司代碼（a, b, c 等）
  if (firstSegment && /^[a-z]$/.test(firstSegment)) {
    return firstSegment
  }
  
  return 'a' // 預設公司代碼
}

// 獲取公司ID（簡化映射）
function getCompanyId(companyCode: string): number {
  const mapping: Record<string, number> = {
    'a': 1,
    'b': 2,
    'c': 3,
  }
  return mapping[companyCode] || 1
}

// 檢查維護狀態
async function checkMaintenanceStatus(companyId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/maintenance/status/${companyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 設定超時時間
      signal: AbortSignal.timeout(3000),
    })
    
    if (!response.ok) {
      console.warn(`維護狀態檢查失敗: ${response.status}`)
      return false // API 失敗時預設為非維護模式
    }
    
    const data = await response.json()
    return data.isEnabled || false
  } catch (error) {
    console.warn('維護狀態檢查錯誤:', error)
    return false // 發生錯誤時預設為非維護模式
  }
}

export async function maintenanceMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 跳過豁免路徑
  if (isExemptPath(pathname)) {
    return NextResponse.next()
  }
  
  // 跳過後台路徑
  if (isAdminPath(pathname)) {
    return NextResponse.next()
  }
  
  // 獲取公司代碼和ID
  const companyCode = getCompanyCodeFromPath(pathname)
  const companyId = getCompanyId(companyCode)
  
  try {
    // 檢查維護狀態
    const isMaintenanceMode = await checkMaintenanceStatus(companyId)
    
    if (isMaintenanceMode) {
      // 如果處於維護模式，重導向到維護頁面
      const maintenanceUrl = new URL('/maintenance', request.url)
      maintenanceUrl.searchParams.set('company', companyCode)
      
      return NextResponse.redirect(maintenanceUrl)
    }
  } catch (error) {
    console.error('維護中間件錯誤:', error)
    // 發生錯誤時繼續正常流程
  }
  
  return NextResponse.next()
}

// 維護模式檢查的客戶端版本（用於前端組件）
export async function checkMaintenanceStatusClient(companyCode: string): Promise<{
  isEnabled: boolean
  redirectUrl?: string
}> {
  try {
    const companyId = getCompanyId(companyCode)
    const response = await fetch(`${API_URL}/maintenance/status/${companyId}`)
    
    if (!response.ok) {
      return { isEnabled: false }
    }
    
    const data = await response.json()
    
    if (data.isEnabled) {
      return {
        isEnabled: true,
        redirectUrl: `/maintenance?company=${companyCode}`
      }
    }
    
    return { isEnabled: false }
  } catch (error) {
    console.warn('客戶端維護狀態檢查失敗:', error)
    return { isEnabled: false }
  }
}