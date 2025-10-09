'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import '@/styles/pages/member-coupons.css'

interface Coupon {
  id: number
  code: string
  template: {
    id: number
    name: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
    minAmount: number
    maxDiscount?: number
    validFrom: string
    validTo: string
    description?: string
  }
  isUsed: boolean
  usedAt?: string
  assignedUserId: number
  createdAt: string
}

export default function MemberCoupons() {
  const { user } = useUserStore()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'used' | 'expired'>('available')

  // 獲取我的優惠券
  const fetchMyCoupons = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const companyCode = user.company?.code || 'a'
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      console.log('🔍 優惠券查詢 - CompanyCode:', companyCode)
      console.log('🔍 優惠券查詢 - Token存在:', !!token)
      console.log('🔍 優惠券查詢 - 用戶ID:', user?.id)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/portal/coupons/my-coupons`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('🔍 優惠券查詢 - Response Status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        setCoupons(data)
      } else {
        console.error('獲取優惠券失敗:', response.status)
      }
    } catch (error) {
      console.error('獲取優惠券失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyCoupons()
  }, [user])

  // 檢查優惠券是否過期
  const isExpired = (validTo: string) => {
    return new Date() > new Date(validTo)
  }

  // 過濾優惠券
  const filteredCoupons = coupons.filter(coupon => {
    switch (activeFilter) {
      case 'available':
        return !coupon.isUsed && !isExpired(coupon.template.validTo)
      case 'used':
        return coupon.isUsed
      case 'expired':
        return !coupon.isUsed && isExpired(coupon.template.validTo)
      default:
        return true
    }
  })

  // 複製優惠碼
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('優惠碼已複製到剪貼板！')
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 獲取優惠券狀態
  const getCouponStatus = (coupon: Coupon) => {
    if (coupon.isUsed) {
      return { text: '已使用', class: 'used', icon: '✅' }
    }
    if (isExpired(coupon.template.validTo)) {
      return { text: '已過期', class: 'expired', icon: '⏰' }
    }
    return { text: '可使用', class: 'available', icon: '🎫' }
  }

  // 獲取折扣顯示文字
  const getDiscountText = (template: any) => {
    if (template.discountType === 'PERCENTAGE') {
      return `${template.discountValue}% 折扣`
    } else {
      return `減 $${template.discountValue} 元`
    }
  }

  if (loading) {
    return (
      <div className="member-coupons-loading">
        <div className="loading-spinner">
          <span>🎫</span>
          <p>載入優惠券中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="member-coupons">
      {/* 篩選標籤 */}
      <div className="coupon-filters">
        <button
          onClick={() => setActiveFilter('available')}
          className={`filter-btn ${activeFilter === 'available' ? 'active' : ''}`}
        >
          🎫 可使用 ({coupons.filter(c => !c.isUsed && !isExpired(c.template.validTo)).length})
        </button>
        <button
          onClick={() => setActiveFilter('used')}
          className={`filter-btn ${activeFilter === 'used' ? 'active' : ''}`}
        >
          ✅ 已使用 ({coupons.filter(c => c.isUsed).length})
        </button>
        <button
          onClick={() => setActiveFilter('expired')}
          className={`filter-btn ${activeFilter === 'expired' ? 'active' : ''}`}
        >
          ⏰ 已過期 ({coupons.filter(c => !c.isUsed && isExpired(c.template.validTo)).length})
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
        >
          📋 全部 ({coupons.length})
        </button>
      </div>

      {/* 優惠券列表 */}
      <div className="coupons-list">
        {filteredCoupons.length === 0 ? (
          <div className="no-coupons">
            <div className="no-coupons-icon">🎫</div>
            <h3>暫無優惠券</h3>
            <p>
              {activeFilter === 'available' && '您目前沒有可使用的優惠券'}
              {activeFilter === 'used' && '您尚未使用過任何優惠券'}
              {activeFilter === 'expired' && '您沒有過期的優惠券'}
              {activeFilter === 'all' && '您還沒有任何優惠券，快去探索更多優惠吧！'}
            </p>
          </div>
        ) : (
          filteredCoupons.map(coupon => {
            const status = getCouponStatus(coupon)
            return (
              <div key={coupon.id} className={`coupon-card ${status.class}`}>
                <div className="coupon-left">
                  <div className="coupon-discount">
                    <div className="discount-value">
                      {getDiscountText(coupon.template)}
                    </div>
                    <div className="discount-type">
                      {coupon.template.discountType === 'PERCENTAGE' ? '折扣' : '現金券'}
                    </div>
                  </div>
                </div>
                
                <div className="coupon-center">
                  <div className="coupon-title">{coupon.template.name}</div>
                  
                  <div className="coupon-conditions">
                    {coupon.template.minAmount > 0 && (
                      <span className="condition">💰 消費滿 ${coupon.template.minAmount}</span>
                    )}
                    {coupon.template.maxDiscount && (
                      <span className="condition">🏆 最高減 ${coupon.template.maxDiscount}</span>
                    )}
                  </div>
                  
                  <div className="coupon-validity">
                    📅 有效期：{formatDate(coupon.template.validFrom)} ~ {formatDate(coupon.template.validTo)}
                  </div>
                  
                  {coupon.template.description && (
                    <div className="coupon-description">
                      📝 {coupon.template.description}
                    </div>
                  )}
                </div>
                
                <div className="coupon-right">
                  <div className={`coupon-status ${status.class}`}>
                    <span className="status-icon">{status.icon}</span>
                    <span className="status-text">{status.text}</span>
                  </div>
                  
                  <div className="coupon-code">
                    <div className="code-label">優惠碼</div>
                    <div className="code-value">{coupon.code}</div>
                  </div>
                  
                  {status.class === 'available' && (
                    <button 
                      className="copy-btn"
                      onClick={() => handleCopyCode(coupon.code)}
                    >
                      📋 複製代碼
                    </button>
                  )}
                  
                  {coupon.isUsed && coupon.usedAt && (
                    <div className="used-time">
                      使用時間：{formatDate(coupon.usedAt)}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {/* 使用說明 */}
      <div className="coupon-help">
        <h4>💡 使用說明</h4>
        <ul>
          <li>點擊「複製代碼」按鈕可快速複製優惠碼</li>
          <li>在結帳時輸入優惠碼即可享受折扣</li>
          <li>每張優惠券只能使用一次</li>
          <li>請注意優惠券的使用條件和有效期限</li>
        </ul>
      </div>
    </div>
  )
}