// Token 驗證和自動登入記錄功能
import { getToken } from './useAuth'

export async function verifyTokenAndRecord(companyCode: string): Promise<boolean> {
  const token = getToken(companyCode)
  
  if (!token) {
    return false
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/verify-token?company=${companyCode}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      console.log('Token 驗證成功，已記錄登入紀錄:', data.message)
      return true
    } else {
      console.log('Token 驗證失敗，清除本地存儲')
      // Token 無效，清除本地存儲
      localStorage.removeItem(`portalToken_${companyCode}`)
      localStorage.removeItem(`portalUser_${companyCode}`)
      localStorage.removeItem(`enabledModules_${companyCode}`)
      return false
    }
  } catch (error) {
    console.error('Token 驗證請求失敗:', error)
    return false
  }
}

// 防重複調用的標記
const verificationFlags = new Map<string, boolean>()
const lastVerificationTime = new Map<string, number>()

export async function verifyTokenOnce(companyCode: string): Promise<boolean> {
  const key = `verification_${companyCode}`
  const now = Date.now()
  
  // 檢查 localStorage 中的用戶資料創建時間
  const userData = localStorage.getItem(`portalUser_${companyCode}`)
  if (userData) {
    try {
      const user = JSON.parse(userData)
      // 如果用戶資料是最近 5 分鐘內創建的，跳過驗證（可能是剛註冊）
      const tokenCreatedTime = localStorage.getItem(`tokenCreatedTime_${companyCode}`)
      if (!tokenCreatedTime) {
        // 第一次檢測，記錄當前時間並跳過驗證
        localStorage.setItem(`tokenCreatedTime_${companyCode}`, now.toString())
        console.log('Token 驗證跳過：首次檢測，可能是剛註冊或登入')
        return true
      }
      
      const createdTime = parseInt(tokenCreatedTime)
      if ((now - createdTime) < 5 * 60 * 1000) { // 5分鐘內
        console.log(`Token 驗證跳過：${Math.floor((now - createdTime) / 1000)}秒前剛創建的 token`)
        return true
      }
    } catch (error) {
      console.error('解析用戶資料失敗:', error)
    }
  }
  
  // 檢查是否在 30 分鐘內已經驗證過
  const lastTime = lastVerificationTime.get(key)
  if (lastTime && (now - lastTime) < 30 * 60 * 1000) { // 30分鐘
    console.log('Token 驗證跳過：30分鐘內已驗證過')
    return true
  }
  
  // 如果已經在驗證中，直接返回 true
  if (verificationFlags.get(key)) {
    return true
  }

  // 設置驗證標記
  verificationFlags.set(key, true)
  
  try {
    const result = await verifyTokenAndRecord(companyCode)
    if (result) {
      // 記錄成功驗證的時間
      lastVerificationTime.set(key, now)
    }
    return result
  } finally {
    // 清除驗證標記（延遲清除，避免重複調用）
    setTimeout(() => {
      verificationFlags.delete(key)
    }, 5000) // 5秒後清除標記
  }
}