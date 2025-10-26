'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { useParams, useRouter } from 'next/navigation'
import MemberProfile from '@/components/member/MemberProfile'
import MemberWalletHistory from '@/components/member/MemberWalletHistory'
import MemberPasswordForm from '@/components/member/MemberPasswordForm'
import MemberEditForm from '@/components/member/MemberEditForm'
import MemberOrders from '@/components/member/MemberOrders'
import MemberCoupons from '@/components/member/MemberCoupons'
import MemberFavorites from '@/components/member/MemberFavorites'
import IdVerification from './id-verification/page'
import BankVerification from './bank-verification/page'
import '../../../styles/pages/member.css'

export default function DynamicMemberPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'edit' | 'id-verification' | 'bank-verification' | 'wallet-history' | 'orders' | 'coupons' | 'favorites'>('profile')
  const [isVerifying, setIsVerifying] = useState(true)
  const { user, setUser, logout } = useUserStore()
  const params = useParams()
  const router = useRouter()
  const companyCode = params.companyCode as string

  // 驗證Token是否有效
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      
      if (!token) {
        // 沒有Token，清除用戶狀態並導向登入頁
        logout()
        router.push(`/${companyCode}/login`)
        return
      }

      try {
        // 使用正確的API端點驗證Token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/profile?company=${companyCode}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })

        if (!response.ok) {
          // Token無效，清除所有相關數據
          localStorage.removeItem(`portalToken_${companyCode}`)
          localStorage.removeItem(`portalUser_${companyCode}`)
          localStorage.removeItem(`enabledModules_${companyCode}`)
          localStorage.removeItem(`sessionId_${companyCode}`)
          logout()
          router.push(`/${companyCode}/login`)
          return
        }

        const userData = await response.json()
        setUser(userData)
        setIsVerifying(false)

      } catch (error) {
        console.error('Token驗證失敗:', error)
        // 網路錯誤或其他問題，清除數據
        localStorage.removeItem(`portalToken_${companyCode}`)
        localStorage.removeItem(`portalUser_${companyCode}`)
        localStorage.removeItem(`enabledModules_${companyCode}`)
        localStorage.removeItem(`sessionId_${companyCode}`)
        logout()
        router.push(`/${companyCode}/login`)
      }
    }

    verifyToken()
  }, [companyCode, logout, router, setUser])

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">驗證中...</div>
      </div>
    )
  }

  if (!user) {
    return null // 重定向中
  }

  // 獲取分頁標題的函數
  const getTabTitle = () => {
    const titles: Record<string, string> = {
      'profile': '會員資料',
      'edit': '編輯資料',
      'password': '修改密碼',
      'id-verification': '身分驗證',
      'bank-verification': '銀行驗證',
      'wallet-history': '錢包明細',
      'orders': '訂單記錄',
      'coupons': '優惠券',
      'favorites': '我的最愛'
    }
    return titles[tab] || '會員中心'
  }

  // 獲取分頁圖標的函數
  const getTabIcon = (tabName: string) => {
    const icons: Record<string, string> = {
      'profile': '📋',
      'edit': '✏️',
      'password': '🔐',
      'id-verification': '🆔',
      'bank-verification': '🏦',
      'wallet-history': '💰',
      'orders': '📦',
      'coupons': '🎫',
      'favorites': '❤️'
    }
    return icons[tabName] || '📄'
  }

  return (
    <>
      <div className="member-container">
        <div className="member-wrapper">
          {/* 頁面標題 */}
          <div className="member-header">
            <h1 className="member-title">
              <span className="member-title-icon">👨‍💼</span>
              會員中心
            </h1>
            <div className="member-breadcrumb">
              <span>首頁</span>
              <span className="member-breadcrumb-separator">/</span>
              <span>會員中心</span>
              <span className="member-breadcrumb-separator">/</span>
              <span className="member-breadcrumb-current">{getTabTitle()}</span>
            </div>
          </div>

          <div className="member-main">
            {/* 左側導航 */}
            <aside className="member-sidebar">
              <nav className="member-nav-list">
                {/* 會員中心選單分組 */}
                <div className="member-nav-group">
                  <div className="member-nav-group-header">
                    <span className="member-nav-group-icon">👤</span>
                    <span className="member-nav-group-title">個人資料</span>
                  </div>
                  <div className="member-nav-group-items">
                    <button
                      onClick={() => setTab('profile')}
                      className={`member-nav-item ${tab === 'profile' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('profile')}</span>
                      會員資料
                    </button>
                    <button
                      onClick={() => setTab('edit')}
                      className={`member-nav-item ${tab === 'edit' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('edit')}</span>
                      編輯資料
                    </button>
                    <button
                      onClick={() => setTab('password')}
                      className={`member-nav-item ${tab === 'password' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('password')}</span>
                      修改密碼
                    </button>
                    <button
                      onClick={() => setTab('id-verification')}
                      className={`member-nav-item ${tab === 'id-verification' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('id-verification')}</span>
                      身分驗證
                    </button>
                    <button
                      onClick={() => setTab('bank-verification')}
                      className={`member-nav-item ${tab === 'bank-verification' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('bank-verification')}</span>
                      銀行驗證
                    </button>
                    <button
                      onClick={() => setTab('wallet-history')}
                      className={`member-nav-item ${tab === 'wallet-history' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('wallet-history')}</span>
                      錢包明細
                    </button>
                  </div>
                </div>

                {/* 訂單與服務選單分組 */}
                <div className="member-nav-group">
                  <div className="member-nav-group-header">
                    <span className="member-nav-group-icon">🛒</span>
                    <span className="member-nav-group-title">訂單與服務</span>
                  </div>
                  <div className="member-nav-group-items">
                    <button
                      onClick={() => setTab('orders')}
                      className={`member-nav-item ${tab === 'orders' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('orders')}</span>
                      訂單記錄
                    </button>
                    <button
                      onClick={() => setTab('coupons')}
                      className={`member-nav-item ${tab === 'coupons' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('coupons')}</span>
                      優惠券
                    </button>
                    <button
                      onClick={() => setTab('favorites')}
                      className={`member-nav-item ${tab === 'favorites' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('favorites')}</span>
                      我的最愛
                    </button>
                  </div>
                </div>
              </nav>
            </aside>

            {/* 右側內容 */}
            <main className="member-content">
              <h2 className="member-content-title">{getTabTitle()}</h2>

              {tab === 'profile' && (
                <MemberProfile
                  onGoToIdVerification={() => setTab('id-verification')}
                  onGoToBankVerification={() => setTab('bank-verification')}
                />
              )}

              {tab === 'password' && <MemberPasswordForm />}
              {tab === 'edit' && <MemberEditForm />}
              {tab === 'id-verification' && <IdVerification />}
              {tab === 'bank-verification' && <BankVerification />}
              {tab === 'wallet-history' && <MemberWalletHistory />}
              {tab === 'orders' && <MemberOrders />}
              {tab === 'coupons' && <MemberCoupons />}
              {tab === 'favorites' && <MemberFavorites />}
            </main>
          </div>

          
        </div>
      </div>
    </>
  )
}