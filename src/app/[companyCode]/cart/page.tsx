'use client'

import { useCartStore, ShippingMethod } from '@/hooks/use-cart-store-new'
import { useAgentContext } from '@/hooks/useAgentContext'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import './cart.css'

export default function CartPage() {
  const params = useParams()
  const companyCode = params.companyCode as string
  const { getLinkWithAgent } = useAgentContext()
  
  const { 
    items, 
    getTotalItems,
    getTotalPrice,
    updateQuantity, 
    removeItem, 
    clearCart,
    addItem,
    selectedShipping,
    shippingMethods,
    setSelectedShipping,
    setShippingMethods,
    getShippingFee
  } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  // 運送方式狀態
  const [loadingShipping, setLoadingShipping] = useState(true)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  
  // 優惠碼狀態
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const shippingFee = getShippingFee()
  
  // 計算優惠券折扣
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const discountedPrice = totalPrice - discountAmount
  const finalTotal = Math.max(0, discountedPrice) + shippingFee

  // 重複登入檢查
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      if (!token) {
        window.location.replace(getLinkWithAgent(`/${companyCode}/duplicate-login`))
        return
      }
    }
  }, [companyCode, getLinkWithAgent])

  // 獲取運送方式
  const fetchShippingMethods = async () => {
    try {
      const response = await fetch(`/api/portal/${companyCode}/shipping/methods?company=${companyCode}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setShippingMethods(result.data)
        } else {
          // 獲取運送方式失敗，靜默處理
          // 使用預設運送方式作為備用
          setShippingMethods([
            {
              id: 'store_pickup',
              name: '7-11超商取貨',
              fee: 60,
              freeThreshold: 399,
              description: '3-5個工作天到店'
            },
            {
              id: 'home_delivery',
              name: '宅配',
              fee: 210,
              freeThreshold: 999,
              description: '1-3個工作天送達'
            }
          ])
        }
      } else {
        // 獲取運送方式失敗，靜默處理
        // 使用預設運送方式作為備用
        setShippingMethods([
          {
            id: 'store_pickup',
            name: '7-11超商取貨',
            fee: 60,
            freeThreshold: 399,
            description: '3-5個工作天到店'
          }
        ])
      }
    } catch (error) {
      // 獲取運送方式失敗，靜默處理
      // 使用預設運送方式作為備用
      setShippingMethods([
        {
          id: 'store_pickup',
          name: '7-11超商取貨',
          fee: 60,
          freeThreshold: 399,
          description: '3-5個工作天到店'
        }
      ])
    } finally {
      setLoadingShipping(false)
    }
  }

  // 初始化獲取運送方式
  useEffect(() => {
    fetchShippingMethods()
    
    // 檢查是否有結帳錯誤訊息
    const errorMsg = sessionStorage.getItem('checkoutError')
    if (errorMsg) {
      setCheckoutError(errorMsg)
      sessionStorage.removeItem('checkoutError')
      
      // 移除購物車資料恢復邏輯，避免重複添加商品
      const cartDataStr = sessionStorage.getItem('checkoutCartData')
      if (cartDataStr) {
        // 直接清除，不恢復，因為用戶的購物車應該還在
        sessionStorage.removeItem('checkoutCartData')
      }
    }
  }, [])

  // 設定預設運送方式
  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingMethods[0].id)
    }
  }, [shippingMethods, selectedShipping, setSelectedShipping])

  // 除錯：監控購物車狀態變化
  useEffect(() => {
  }, [items, totalItems, totalPrice])

  // 驗證優惠碼
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('請輸入優惠碼')
      return
    }

    setCouponLoading(true)
    setCouponError('')
    
    try {
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/portal/coupons/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          amount: totalPrice
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.valid) {
          setAppliedCoupon({
            code: couponCode.trim(),
            discountAmount: result.discountAmount,
            finalAmount: result.finalAmount
          })
          setCouponError('')
        } else {
          setCouponError(result.message || '優惠碼無效')
          setAppliedCoupon(null)
        }
      } else {
        const error = await response.json()
        setCouponError(error.message || '驗證優惠碼失敗')
        setAppliedCoupon(null)
      }
    } catch (error) {
      // 驗證優惠碼失敗，靜默處理
      setCouponError('驗證優惠碼失敗，請稍後再試')
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  // 移除優惠碼
  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-content">
          <div className="cart-empty-icon">🛒</div>
          <h3 className="cart-empty-title">購物車是空的</h3>
          <p className="cart-empty-message">還沒有加入任何商品，快去挑選您喜歡的商品吧！</p>
          <a href={`/${companyCode}/products`} className="cart-empty-btn">
            開始購物
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      {/* 頁面頭部 */}
      <div className="cart-header">
        <div className="cart-header-content">
          <h1 className="cart-title">
            <span className="cart-title-icon">🛒</span>
            購物車
          </h1>
          <div className="cart-breadcrumb">
            <a href={`/${companyCode}`}>首頁</a>
            <span>›</span>
            <a href={`/${companyCode}/products`}>商品</a>
            <span>›</span>
            <span>購物車 ({totalItems} 件商品)</span>
          </div>
        </div>
      </div>

      {/* 錯誤訊息顯示 */}
      {checkoutError && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          margin: '20px 0',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>結帳失敗：</strong> {checkoutError}
        </div>
      )}

      <div className="cart-layout">
        {/* 左側：商品列表 */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h2>購物清單</h2>
            <button 
              onClick={clearCart}
              className="clear-cart-btn"
            >
              清空購物車
            </button>
          </div>

          <div className="cart-items">
            {items.map((item) => (
              <div key={`${item.id}-${item.variant?.id || 'no-variant'}`} className="cart-item">
                <div className="cart-item-image">
                  {item.thumbnail ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                      alt={item.name}
                    />
                  ) : (
                    <div className="cart-item-no-image">
                      📦
                    </div>
                  )}
                </div>

                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-sku">商品編號: {item.sku}</p>
                  
                  {item.variant && (
                    <div className="cart-item-variant">
                      <span className="variant-label">規格:</span>
                      <div className="variant-options">
                        {Object.entries(item.variant.options).map(([key, value]) => (
                          <span key={key} className="variant-option">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="cart-item-price">
                    NT$ {item.price.toLocaleString()}
                  </div>
                </div>

                <div className="cart-item-quantity">
                  <button 
                    onClick={() => updateQuantity(item.id, item.variant?.id, Math.max(1, item.quantity - 1))}
                    className="quantity-btn"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1
                      updateQuantity(item.id, item.variant?.id, Math.max(1, newQuantity))
                    }}
                    className="quantity-input"
                    min="1"
                  />
                  <button 
                    onClick={() => updateQuantity(item.id, item.variant?.id, item.quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  NT$ {(item.price * item.quantity).toLocaleString()}
                </div>

                <button 
                  onClick={() => removeItem(item.id, item.variant?.id)}
                  className="cart-item-remove"
                  title="移除商品"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：結帳區域 */}
        <div className="cart-summary-section">
          <div className="cart-summary">
            <h3 className="cart-summary-title">訂單摘要</h3>

            {/* 優惠碼區域 */}
            <div className="coupon-section">
              <h4 className="coupon-title">優惠碼</h4>
              {appliedCoupon ? (
                <div className="applied-coupon">
                  <div className="coupon-info">
                    <span className="coupon-code">{appliedCoupon.code}</span>
                    <span className="coupon-discount">-NT$ {discountAmount.toLocaleString()}</span>
                  </div>
                  <button onClick={removeCoupon} className="remove-coupon-btn">
                    移除
                  </button>
                </div>
              ) : (
                <div className="coupon-input-section">
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="輸入優惠碼"
                      className="coupon-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          validateCoupon()
                        }
                      }}
                    />
                    <button 
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="coupon-apply-btn"
                    >
                      {couponLoading ? '驗證中...' : '套用'}
                    </button>
                  </div>
                  {couponError && (
                    <div className="coupon-error">
                      {couponError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 運送方式選擇 */}
            <div className="shipping-section">
              <h4 className="shipping-title">運送方式</h4>
              {loadingShipping ? (
                <div className="shipping-loading">載入運送方式...</div>
              ) : (
                <div className="shipping-options">
                  {shippingMethods.map((method) => (
                    <label key={method.id} className="shipping-option">
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={selectedShipping === method.id}
                        onChange={() => setSelectedShipping(method.id)}
                        className="shipping-radio"
                      />
                      <div className="shipping-info">
                        <div className="shipping-name">{method.name}</div>
                        <div className="shipping-description">{method.description}</div>
                        <div className="shipping-fee">
                          {method.fee === 0 ? '免費' : 
                           totalPrice >= method.freeThreshold ? (
                             <span>
                               <span style={{ textDecoration: 'line-through', color: '#999' }}>
                                 NT$ {method.fee}
                               </span>
                               <span style={{ color: '#28a745', fontWeight: 'bold', marginLeft: '8px' }}>
                                 免運費
                               </span>
                             </span>
                           ) : `NT$ ${method.fee}`
                          }
                        </div>
                        {totalPrice < method.freeThreshold && method.freeThreshold > 0 && (
                          <div className="shipping-threshold">
                            再買 NT$ {(method.freeThreshold - totalPrice).toLocaleString()} 即享免運
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 價格明細 */}
            <div className="price-breakdown">
              <div className="price-row">
                <span>商品小計:</span>
                <span>NT$ {totalPrice.toLocaleString()}</span>
              </div>
              
              {appliedCoupon && (
                <div className="price-row discount">
                  <span>優惠折扣:</span>
                  <span>-NT$ {discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="price-row">
                <span>運費:</span>
                <span>
                  {shippingFee === 0 ? '免費' : `NT$ ${shippingFee.toLocaleString()}`}
                </span>
              </div>
              
              <div className="price-row total">
                <span>總計:</span>
                <span>NT$ {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* 結帳按鈕 */}
            <a 
              href={`/${companyCode}/checkout`}
              className="checkout-btn"
              onClick={() => {
                // 將優惠碼資訊存儲到 sessionStorage
                if (appliedCoupon) {
                  sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon))
                } else {
                  sessionStorage.removeItem('appliedCoupon')
                }
              }}
            >
              前往結帳
            </a>

            {/* 繼續購物 */}
            <a 
              href={`/${companyCode}/products`}
              className="continue-shopping-btn"
            >
              繼續購物
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}