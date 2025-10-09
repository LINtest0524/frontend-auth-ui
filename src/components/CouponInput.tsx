'use client'

import { useState } from 'react'

interface CouponInputProps {
  onApplyCoupon: (code: string) => Promise<{
    success: boolean
    message?: string
    discountAmount?: number
    finalAmount?: number
  }>
  onRemoveCoupon: () => void
  appliedCoupon?: {
    code: string
    discountAmount: number
  }
  totalAmount: number
  disabled?: boolean
}

export default function CouponInput({
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
  totalAmount,
  disabled = false
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage({ type: 'error', text: '請輸入優惠碼' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await onApplyCoupon(couponCode.trim().toUpperCase())
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `優惠碼套用成功！折扣 ${result.discountAmount} 元` 
        })
        setCouponCode('')
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || '優惠碼套用失敗' 
        })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '網路錯誤，請稍後再試' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    onRemoveCoupon()
    setMessage(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon()
    }
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-3">優惠碼</h3>
      
      {appliedCoupon ? (
        // 已套用優惠碼的狀態
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
            <div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span className="font-mono font-bold text-green-800">
                  {appliedCoupon.code}
                </span>
              </div>
              <div className="text-sm text-green-600 mt-1">
                已折扣 {appliedCoupon.discountAmount} 元
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-600 hover:text-red-800 text-sm"
              disabled={disabled}
            >
              移除
            </button>
          </div>
        </div>
      ) : (
        // 輸入優惠碼的狀態
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="請輸入優惠碼"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              disabled={disabled || loading}
              maxLength={20}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={disabled || loading || !couponCode.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '驗證中...' : '套用'}
            </button>
          </div>

          {/* 快速套用我的優惠碼按鈕 */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => window.open('/a/member/coupons', '_blank')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              📋 查看我的優惠碼
            </button>
            <div className="text-sm text-gray-500">
              消費金額：{totalAmount} 元
            </div>
          </div>
        </div>
      )}

      {/* 訊息顯示 */}
      {message && (
        <div className={`mt-3 p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 使用提醒 */}
      {!appliedCoupon && (
        <div className="mt-3 text-xs text-gray-500">
          💡 提醒：優惠碼不區分大小寫，每張優惠碼只能使用一次
        </div>
      )}
    </div>
  )
}