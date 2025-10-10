'use client'

import { useState } from 'react'
import MemberProfile from '@/components/member/MemberProfile'
import MemberWalletHistory from '@/components/member/MemberWalletHistory'
import MemberPasswordForm from '@/components/member/MemberPasswordForm'
import MemberEditForm from '@/components/member/MemberEditForm'
import MemberOrders from '@/components/member/MemberOrders'
import MemberCoupons from '@/components/member/MemberCoupons'
import MemberFavorites from '@/components/member/MemberFavorites'
import IdVerification from '@/app/a/member/id-verification/page'
import BankVerification from '@/app/a/member/bank-verification/page'
import '../../../styles/pages/member.css'




export default function MemberPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'edit' | 'id-verification' | 'bank-verification' | 'wallet-history' | 'orders' | 'coupons' | 'favorites'>('profile')

  const getTabTitle = () => {
    const titles = {
      'profile': '個人資料',
      'password': '修改密碼',
      'edit': '修改個人資料',
      'id-verification': '身分證驗證',
      'bank-verification': '銀行帳戶驗證',
      'wallet-history': '錢包紀錄',
      'orders': '我的訂單',
      'coupons': '優惠券',
      'favorites': '我的最愛'
    }
    return titles[tab]
  }

  const getTabIcon = (tabName: string) => {
    const icons = {
      'profile': '👤',
      'password': '🔒',
      'edit': '✏️',
      'id-verification': '🆔',
      'bank-verification': '🏦',
      'wallet-history': '💰',
      'orders': '📋',
      'coupons': '🎫',
      'favorites': '❤️'
    }
    return icons[tabName as keyof typeof icons]
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
              <a href="/a">首頁</a>
              <span>›</span>
              <span>會員中心</span>
              <span>›</span>
              <span>{getTabTitle()}</span>
            </div>
          </div>

          {/* 主要內容 */}
          <div className="member-main">
            {/* 左側導航 */}
            <aside className="member-sidebar">
              <nav className="member-nav-list">
                {/* 會員中心選單分組 */}
                <div className="member-nav-group">
                  <div className="member-nav-group-header">
                    <span className="member-nav-group-icon">👤</span>
                    會員中心選單
                  </div>
                  <div className="member-nav-group-items">
                    <button
                      onClick={() => setTab('profile')}
                      className={`member-nav-item ${tab === 'profile' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('profile')}</span>
                      個人資料
                    </button>
                    <button
                      onClick={() => setTab('edit')}
                      className={`member-nav-item ${tab === 'edit' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('edit')}</span>
                      修改個人資料
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
                      身分證驗證
                    </button>
                    <button
                      onClick={() => setTab('bank-verification')}
                      className={`member-nav-item ${tab === 'bank-verification' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('bank-verification')}</span>
                      銀行帳戶驗證
                    </button>
                    <button
                      onClick={() => setTab('wallet-history')}
                      className={`member-nav-item ${tab === 'wallet-history' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('wallet-history')}</span>
                      錢包紀錄
                    </button>
                  </div>
                </div>

                {/* 購物功能選單分組 */}
                <div className="member-nav-group">
                  <div className="member-nav-group-header">
                    <span className="member-nav-group-icon">🛒</span>
                    購物功能選單
                  </div>
                  <div className="member-nav-group-items">
                    <button
                      onClick={() => setTab('orders')}
                      className={`member-nav-item ${tab === 'orders' ? 'active' : ''}`}
                    >
                      <span className="member-nav-icon">{getTabIcon('orders')}</span>
                      我的訂單
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
