'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getUser, getToken, logout, setUser as setUserAuth } from '@/lib/useAuth'
import { logoutWithRecord } from '@/lib/logout'
import { useCartStore } from '@/hooks/use-cart-store-new'
import MenuRenderer from './menu/MenuRenderer'
import MessageIcon from './message/MessageIcon'
import { CompanyConfig } from '@/types'
import '../../src/styles/components/menu.css'


interface PortalHeaderBarProps {
  companyCode?: string
  config?: any
}

export default function PortalHeaderBar({ companyCode, config }: PortalHeaderBarProps = {}) {
  const { user, setUser } = useUserStore()
  const company = companyCode || useCompanySlug() //   優先使用傳入的公司代碼
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [logo, setLogo] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 使用 ref 來追蹤刷新狀態，避免閉包問題
  const isRefreshingRef = useRef(false)
  
  // 購物車狀態
  const { getTotalItems, getTotalPrice, refreshCart } = useCartStore()

  const fetchLogo = async (companyCode: string) => {
    // 獲取logo
    
    try {
      const logoUrl = `${process.env.NEXT_PUBLIC_API_BASE}/portal/logo?company=${companyCode}`
      // 從API獲取logo
      
      const response = await fetch(logoUrl)
      // API回應正常
      
      if (response.ok) {
        const responseText = await response.text()
        
        // 檢查回應是否為空
        if (!responseText || responseText.trim() === '') {
          console.log('⚠️ [PortalHeaderBar] Logo API returned empty response')
          return
        }
        
        try {
          const logoData = JSON.parse(responseText)
          // 檢查是否為空物件或無效的logo資料
          if (logoData && logoData.id && logoData.image_url) {
            // Logo資料接收成功
            setLogo(logoData)
          } else {
            console.log('⚠️ [PortalHeaderBar] No valid logo data found for company:', companyCode)
            setLogo(null)
          }
        } catch (jsonError) {
          console.error('💥 [PortalHeaderBar] Invalid JSON in logo response:', responseText)
        }
      } else {
        const errorText = await response.text()
        console.log('❌ [PortalHeaderBar] Logo API failed:', errorText)
      }
    } catch (error) {
      console.error('💥 [PortalHeaderBar] Error fetching logo:', error)
    }
  }

  // 定義餘額刷新函數（使用 ref 避免閉包問題）
  const handleRefreshBalance = useCallback(async (isAutoRefresh = false) => {
    // 使用 ref 檢查是否正在刷新
    if (isRefreshingRef.current || !company) return
    
    isRefreshingRef.current = true
    setIsRefreshing(true)
    
    try {
      const token = getToken(company)
      if (!token) {
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/profile?company=${company}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        
        // 🔒 驗證回傳資料的合法性
        if (typeof userData.balance !== 'number' || userData.balance < 0 || userData.balance > 10000000) {
          return
        }

        // 獲取當前用戶資料
        const currentUser = getUser(company)
        if (currentUser) {
          const updatedUser = { ...currentUser, balance: userData.balance }
          setUser(updatedUser)
          // 🔒 重要：不再將餘額存入 localStorage，只存基本用戶資料
          const userForStorage = { ...updatedUser }
          delete userForStorage.balance // 移除餘額欄位
          setUserAuth(userForStorage, company)
        }
      }
    } catch (error) {
      // 靜默處理錯誤
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
    }
  }, [company, setUser])

  useEffect(() => {
    setMounted(true)
  }, [])

  // 取得公司 ID
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (company) {
        try {
          // 動態獲取公司 ID
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/company/code/${company}/config`)
          
          if (response.ok) {
            const companyData = await response.json()
            
            if (companyData.id) {
              setCompanyId(companyData.id)
              // 獲取公司 LOGO
              fetchLogo(company)
            }
          } else {
            // 如果動態獲取失敗，回退到硬編碼映射（向後兼容）
            const companyMap: { [key: string]: number } = {
              'a': 1,
              'b': 2,
            }
            
            const id = companyMap[company]
            if (id) {
              setCompanyId(id)
              fetchLogo(company)
            }
          }
        } catch (error) {
          console.error('Error fetching company ID:', error)
          // 錯誤時也回退到硬編碼映射
          const companyMap: { [key: string]: number } = {
            'a': 1,
            'b': 2,
          }
          
          const id = companyMap[company]
          if (id) {
            setCompanyId(id)
            fetchLogo(company)
          }
        }
      }
    }

    fetchCompanyId()
  }, [company])

  useEffect(() => {
    // 從 localStorage 恢復用戶狀態，使用公司代碼
    if (typeof window !== 'undefined' && company && !user) {
      const savedUser = getUser(company)
      if (savedUser) {
        try {
          // 🔒 不從 localStorage 載入餘額，設為 null 表示需要從 API 撈取
          const userWithoutBalance = { ...savedUser, balance: null }
          setUser(userWithoutBalance)
          // 用戶登入時刷新購物車
          refreshCart()
        } catch (error) {
          console.error('解析用戶資料失敗:', error)
          logout(company)
        }
      }
    }
  }, [company, user, setUser, refreshCart])

  // 專門負責撈取餘額的 useEffect
  useEffect(() => {
    // 當用戶存在且餘額為 null 時，自動撈取餘額
    if (user && user.balance === null && company) {
      handleRefreshBalance(true)
    }
  }, [user?.balance, company, handleRefreshBalance])

  // 頁面載入時強制刷新餘額（只執行一次）
  useEffect(() => {
    if (mounted && user && company) {
      // 延遲一點確保組件完全載入
      const timer = setTimeout(() => {
        handleRefreshBalance(true)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [mounted, user?.id, company, handleRefreshBalance])
  
  // 監聽路由變化，確保每次頁面切換都刷新餘額（但要防止過度刷新）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (user && company) {
      // 延遲執行，避免頻繁觸發
      timeoutId = setTimeout(() => {
        handleRefreshBalance(true)
      }, 200)
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [pathname])

  const handleLogout = async () => {
    if (company) {
      // 使用新的登出功能，會記錄登出紀錄
      await logoutWithRecord(company)
      setUser(null)
      // 登出時刷新購物車（切換到訪客模式）
      refreshCart()
      router.push(`/${company}`) //   登出後回到首頁
    }
  }

  const handleGoToMember = () => {
    router.push(`/${company}/member`) //   點會員去會員中心
  }

  if (!mounted) return null

  return (
    <>
      {/* LOGO 區塊 */}
      {(() => {
        // Logo渲染檢查
        
        if (!logo) {
          return (
            <div style={{ 
              position: 'fixed', 
              top: '25px', 
              left: '45px', 
              zIndex: 1000, 
              color: 'red', 
              fontSize: '12px',
              background: 'rgba(255,255,255,0.9)',
              padding: '5px'
            }}>
            </div>
          )
        }
        
        return (
          <div className="f-logo" style={{
            position: 'fixed',
            top: '25px',
            left: '45px',
            zIndex: 1000,
          }}>
            <img
              src={`${process.env.NEXT_PUBLIC_API_BASE}${logo.image_url}`}
              alt={logo.title || 'Company Logo'}
              style={{
                maxWidth: '120px',
                maxHeight: '60px',
                objectFit: 'contain'
              }}
              onLoad={() => {}} // Logo載入成功
              onError={(e) => console.error('❌ [PortalHeaderBar] Logo image failed to load:', e)}
            />
          </div>
        )
      })()}

      <div className="header-box fo5">
        <div className="header-left">
          <h1></h1>
          {companyId && <MenuRenderer companyId={companyId} />}
        </div>
        {!user ? (
          <div className="fl6">
            {/* 購物車圖標 (未登入用戶) */}
            <a 
              href={`/${company}/cart`} 
              className="cart-icon" 
              title={`購物車 (${getTotalItems()} 件商品)`}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px',
                marginRight: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#495057',
                fontSize: '18px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef'
                e.currentTarget.style.borderColor = '#adb5bd'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
                e.currentTarget.style.borderColor = '#dee2e6'
              }}
            >
              🛒
              {getTotalItems() > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
            </a>
            
            <a href={`/${company}/register`} className="f-btn-2">註冊</a>
            <a href={`/${company}/login`} className="f-btn-1">登入</a>
          </div>
        ) : (
          <div className="fl6">
            <MessageIcon />
            
            {/* 購物車圖標 */}
            <a 
              href={`/${company}/cart`} 
              className="cart-icon" 
              title={`購物車 (${getTotalItems()} 件商品)`}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px',
                marginLeft: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#495057',
                fontSize: '18px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef'
                e.currentTarget.style.borderColor = '#adb5bd'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
                e.currentTarget.style.borderColor = '#dee2e6'
              }}
            >
              🛒
              {getTotalItems() > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
            </a>
            
            <button onClick={handleGoToMember} className="usernamebox" title="查看會員中心">
              {user.username}
            </button>
            <button 
              onClick={handleRefreshBalance} 
              className="balance-box" 
              title="點擊刷新餘額"
              disabled={isRefreshing}
              style={{ 
                marginLeft: '4px', 
                padding: '4px 8px', 
                backgroundColor: isRefreshing ? '#e5e7eb' : '#f3f4f6', 
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                color: isRefreshing ? '#6b7280' : '#991b1b', 
                fontWeight: 'bold',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                opacity: isRefreshing ? 0.7 : 1
              }}
            >
              {isRefreshing ? '刷新中...' : 
               user.balance === null ? '載入中...' : 
               `$ ${user.balance?.toLocaleString() || '0'}`}
            </button>
            <button onClick={handleLogout} className="f-btn-2">登出</button>
          </div>
        )}
      </div>
    </>
  )
}
