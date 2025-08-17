// 登出功能
import { logout as clearAuth } from './useAuth'
import { useCartStore } from '@/hooks/use-cart-store-new'

export async function logoutWithRecord(companyCode: string): Promise<boolean> {
  const token = localStorage.getItem(`portalToken_${companyCode}`)
  
  if (!token) {
    // 沒有 token，直接清除本地存儲
    clearAuth(companyCode)
    return true
  }

  try {
    // 調用後端登出 API 記錄登出行為
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/logout?company=${companyCode}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.ok) {
      console.log('登出成功，已記錄登出紀錄')
    } else {
      console.warn('登出 API 調用失敗，但仍會清除本地存儲')
    }
  } catch (error) {
    console.error('登出請求失敗:', error)
  } finally {
    // 無論 API 是否成功，都清除本地存儲
    clearAuth(companyCode)
    // 清除 token 創建時間和其他相關資料
    localStorage.removeItem(`tokenCreatedTime_${companyCode}`)
    localStorage.removeItem(`enabledModules_${companyCode}`)
    
    // 刷新購物車以切換到訪客模式
    useCartStore.getState().refreshCart()
  }

  return true
}