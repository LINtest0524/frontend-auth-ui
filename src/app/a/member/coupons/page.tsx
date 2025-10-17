'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'

interface CouponTemplate {
  id: number
  name: string
  type: 'PUBLIC' | 'BATCH'
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minAmount: number
  maxDiscount?: number
  validFrom: string
  validTo: string
  usageLimit?: number
  description?: string
  isActive: boolean
}

interface Coupon {
  id: number
  code: string
  assignedUserId?: number
  isUsed: boolean
  usedBy?: number
  usedAt?: string
  createdAt: string
  template: CouponTemplate
}

interface UserCoupons {
  available: Coupon[]
  used: Coupon[]
  expired: Coupon[]
}

export default function MyCouponsPage() {
  const { user } = useUserStore()
  const [coupons, setCoupons] = useState<UserCoupons>({
    available: [],
    used: [],
    expired: []
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'available' | 'used' | 'expired'>('available')

  // 獲取我的優惠碼
  const fetchMyCoupons = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const companyCode = window.location.pathname.split('/')[1]
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/portal/coupons/my-coupons`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCoupons(data)
      } else {
        console.error('獲取優惠碼失敗:', response.status)
      }
    } catch (error) {
      console.error('獲取優惠碼失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyCoupons()
  }, [user])

  // 複製優惠碼
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('優惠碼已複製到剪貼板')
    }).catch(() => {
      // 備用方案
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('優惠碼已複製到剪貼板')
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDiscountText = (template: CouponTemplate) => {
    if (template.discountType === 'PERCENTAGE') {
      return `${template.discountValue}% 折扣`
    } else {
      return `減 ${template.discountValue} 元`
    }
  }

  const CouponCard = ({ coupon, showUsedInfo = false }: { coupon: Coupon; showUsedInfo?: boolean }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{coupon.template.name}</h3>
          <div className="text-lg font-bold text-blue-600 mt-1">
            {getDiscountText(coupon.template)}
          </div>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          coupon.template.type === 'PUBLIC' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {coupon.template.type === 'PUBLIC' ? '公共' : '專屬'}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
            {coupon.code}
          </span>
          {!showUsedInfo && (
            <button
              onClick={() => copyToClipboard(coupon.code)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              複製
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>使用條件:</span>
          <span>
            {coupon.template.minAmount > 0 ? `消費滿 ${coupon.template.minAmount} 元` : '無限制'}
          </span>
        </div>
        
        {coupon.template.maxDiscount && coupon.template.discountType === 'PERCENTAGE' && (
          <div className="flex justify-between">
            <span>最高折扣:</span>
            <span>{coupon.template.maxDiscount} 元</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>有效期限:</span>
          <span className="text-right">
            <div>{formatDate(coupon.template.validFrom)}</div>
            <div className="text-xs text-gray-500">至 {formatDate(coupon.template.validTo)}</div>
          </span>
        </div>

        {showUsedInfo && coupon.usedAt && (
          <div className="flex justify-between">
            <span>使用時間:</span>
            <span>{formatDate(coupon.usedAt)}</span>
          </div>
        )}

        {coupon.template.description && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">{coupon.template.description}</p>
          </div>
        )}
      </div>
    </div>
  )

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">請先登入以查看您的優惠碼</p>
        </div>
      </div>
    )
  }

  const getTabCount = (tab: 'available' | 'used' | 'expired') => {
    return coupons[tab].length
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">我的優惠碼</h1>
        <p className="text-gray-600 mt-2">管理您的專屬優惠碼</p>
      </div>

      {/* 標籤導航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'available'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✅ 可使用
            {getTabCount('available') > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs rounded-full px-2 py-0.5">
                {getTabCount('available')}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('used')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'used'
                ? 'border-gray-500 text-gray-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 已使用
            {getTabCount('used') > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs rounded-full px-2 py-0.5">
                {getTabCount('used')}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'expired'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ❌ 已過期
            {getTabCount('expired') > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs rounded-full px-2 py-0.5">
                {getTabCount('expired')}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* 內容區域 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">載入中...</div>
        </div>
      ) : (
        <div>
          {/* 可使用的優惠碼 */}
          {activeTab === 'available' && (
            <div>
              {coupons.available.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coupons.available.map((coupon) => (
                    <CouponCard key={coupon.id} coupon={coupon} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎫</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暫無可用優惠碼</h3>
                  <p className="text-gray-500">關注我們的活動獲取專屬優惠碼</p>
                </div>
              )}
            </div>
          )}

          {/* 已使用的優惠碼 */}
          {activeTab === 'used' && (
            <div>
              {coupons.used.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coupons.used.map((coupon) => (
                    <div key={coupon.id} className="relative">
                      <CouponCard coupon={coupon} showUsedInfo={true} />
                      <div className="absolute top-2 right-2">
                        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                          已使用
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暫無使用記錄</h3>
                  <p className="text-gray-500">您還沒有使用過任何優惠碼</p>
                </div>
              )}
            </div>
          )}

          {/* 已過期的優惠碼 */}
          {activeTab === 'expired' && (
            <div>
              {coupons.expired.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coupons.expired.map((coupon) => (
                    <div key={coupon.id} className="relative opacity-60">
                      <CouponCard coupon={coupon} />
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                          已過期
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">⏰</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暫無過期優惠碼</h3>
                  <p className="text-gray-500">您的優惠碼都還在有效期內</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 使用說明 */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 使用說明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 在購物車頁面輸入優惠碼即可享受折扣</li>
          <li>• 每張優惠碼只能使用一次</li>
          <li>• 請在有效期限內使用，過期將無法使用</li>
          <li>• 部分優惠碼有最低消費限制，請注意使用條件</li>
        </ul>
      </div>
    </div>
  )
}