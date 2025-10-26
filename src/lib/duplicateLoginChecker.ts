/**
 * 重複登入檢查工具
 * 當檢測到token失效時，自動重定向到對應的重複登入通知頁面
 */

export interface DuplicateLoginConfig {
  tokenKey: string
  companyCode: string
  redirectPath: string
}

/**
 * 檢查重複登入狀態
 * @param config 配置選項
 * @returns 是否有效登入
 */
export async function checkDuplicateLogin(config: DuplicateLoginConfig): Promise<boolean> {
  if (typeof window === 'undefined') return true

  const token = localStorage.getItem(config.tokenKey)
  
  if (!token) {
    // Token不存在，重定向到重複登入頁面
    window.location.href = config.redirectPath
    return false
  }

  // 驗證 token 是否仍然有效
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/profile?company=${config.companyCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      // Token 無效，清除 localStorage 並重定向到登入頁面
      localStorage.removeItem(config.tokenKey)
      // 不重定向到重複登入頁面，而是重定向到登入頁面
      window.location.href = `/${config.companyCode}/login`
      return false
    }
    
    return true
  } catch (error) {
    // 網路錯誤或其他問題，清除 token 並重定向到登入頁面
    localStorage.removeItem(config.tokenKey)
    window.location.href = `/${config.companyCode}/login`
    return false
  }
}

/**
 * A公司重複登入檢查
 */
export async function checkCompanyALogin(): Promise<boolean> {
  return await checkDuplicateLogin({
    tokenKey: 'portalToken_a',
    companyCode: 'a',
    redirectPath: '/a/duplicate-login'
  })
}

/**
 * B公司重複登入檢查
 */
export async function checkCompanyBLogin(): Promise<boolean> {
  return await checkDuplicateLogin({
    tokenKey: 'portalToken_b',
    companyCode: 'b',
    redirectPath: '/b/duplicate-login'
  })
}

/**
 * 根據公司代碼自動選擇檢查方式
 * @param companyCode 公司代碼 (支援任意動態代碼)
 */
export async function checkLoginByCompany(companyCode: string): Promise<boolean> {
  // 使用動態配置，支援任意公司代碼
  return await checkDuplicateLogin({
    tokenKey: `portalToken_${companyCode}`,
    companyCode: companyCode,
    redirectPath: `/${companyCode}/duplicate-login`
  })
}

/**
 * 清除指定公司的token
 * @param companyCode 公司代碼
 */
export function clearCompanyToken(companyCode: string): void {
  if (typeof window === 'undefined') return
  
  const tokenKey = `portalToken_${companyCode}`
  localStorage.removeItem(tokenKey)
}

/**
 * React Hook - 用於在組件中檢查重複登入
 * @param companyCode 公司代碼
 * @param dependencies 依賴項數組，當依賴項改變時重新檢查
 */
export function useDuplicateLoginCheck(companyCode: string, dependencies: any[] = []) {
  if (typeof window !== 'undefined') {
    React.useEffect(() => {
      checkLoginByCompany(companyCode).catch(console.error)
    }, dependencies)
  }
}

// 為了相容性，這裡不引入React，而是提供一個簡單的useEffect替代
declare global {
  interface Window {
    React?: any
  }
}

// 如果環境中有React，則使用React的useEffect
const React = typeof window !== 'undefined' ? window.React : null