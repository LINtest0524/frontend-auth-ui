'use client'

import { useCartStore, ShippingMethod } from '@/hooks/use-cart-store-new'
import { useEffect, useState } from 'react'
import './cart.css'

export default function CartPage() {
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

  // 獲取運送方式
  const fetchShippingMethods = async () => {
    try {
      const companySlug = window.location.pathname.split('/')[1] // 從 URL 獲取公司代碼
      const response = await fetch(`/api/portal/${companySlug}/shipping/methods?company=${companySlug}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setShippingMethods(result.data)
        } else {
          console.error('獲取運送方式失敗:', result.message)
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
        console.error('獲取運送方式失敗')
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
      console.error('獲取運送方式失敗:', error)
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
      
      // 嘗試恢復購物車資料
      const cartDataStr = sessionStorage.getItem('checkoutCartData')
      if (cartDataStr) {
        try {
          const cartData = JSON.parse(cartDataStr)
          // 恢復購物車商品
          cartData.forEach((item: any) => {
            addItem(item)
          })
          sessionStorage.removeItem('checkoutCartData')
        } catch (err) {
          console.error('恢復購物車失敗:', err)
        }
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
    console.log('Cart page - Current state:', { items, totalItems, totalPrice })
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
      // 從 URL 路徑動態獲取公司代碼
      const companyCode = window.location.pathname.split('/')[1] || 'a'
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      console.log('🎫 購物車優惠碼驗證:', {
        companyCode,
        tokenExists: !!token,
        couponCode: couponCode.trim(),
        totalPrice,
        apiUrl: `${process.env.NEXT_PUBLIC_API_BASE}/api/portal/coupons/validate`
      })
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

      console.log('🎫 API 響應狀態:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('🎫 API 響應成功:', result)
        if (result.valid) {
          setAppliedCoupon({
            code: couponCode.trim(),
            discountAmount: result.discountAmount,
            finalAmount: result.finalAmount
          })
          setCouponError('')
        } else {
          console.log('🎫 優惠碼驗證失敗:', result.message)
          setCouponError(result.message || '優惠碼無效')
          setAppliedCoupon(null)
        }
      } else {
        const error = await response.json()
        console.log('🎫 API 響應錯誤:', error)
        setCouponError(error.message || '驗證優惠碼失敗')
        setAppliedCoupon(null)
      }
    } catch (error) {
      console.error('驗證優惠碼失敗:', error)
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
          <a href="/a/products" className="cart-empty-btn">
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
            <a href="/a">首頁</a>
            <span>›</span>
            <a href="/a/products">商品</a>
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
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #f5c6cb',
          margin: '20px auto',
          maxWidth: '1200px',
          position: 'relative'
        }}>
          <strong>⚠️ 結帳失敗：</strong>{checkoutError}
          <button 
            onClick={() => setCheckoutError(null)}
            style={{
              position: 'absolute',
              right: '15px',
              top: '15px',
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '20px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="關閉"
          >
            ×
          </button>
        </div>
      )}

      <div className="cart-main">
        {/* 購物車商品列表 */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h2 className="cart-items-title">商品清單</h2>
            <button onClick={clearCart} className="cart-clear-btn">
              清空購物車
            </button>
          </div>

          <div>
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                {/* 商品圖片 */}
                <div className="cart-item-image">
                  {item.thumbnail ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                      alt={item.name}
                    />
                  ) : (
                    <div className="cart-item-placeholder">📦</div>
                  )}
                </div>

                {/* 商品資訊 */}
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-meta">
                    <div className="cart-item-sku">SKU: {item.sku}</div>
                    {item.category && (
                      <div className="cart-item-category">
                        {item.category.name}
                      </div>
                    )}
                    {item.stock_quantity !== undefined && (
                      <div className="cart-item-stock">
                        庫存: {item.stock_quantity} 件
                      </div>
                    )}
                  </div>
                </div>

                {/* 數量控制 */}
                <div className="cart-quantity-control">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="cart-quantity-btn"
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1
                      const maxQuantity = item.stock_quantity || 999
                      if (newQuantity > maxQuantity) {
                        alert(`庫存不足！目前庫存：${item.stock_quantity} 件`)
                        return
                      }
                      updateQuantity(item.id, newQuantity)
                    }}
                    className="cart-quantity-display"
                    min="1"
                    max={item.stock_quantity || 999}
                  />
                  <button
                    onClick={() => {
                      const newQuantity = item.quantity + 1
                      const maxQuantity = item.stock_quantity || 999
                      if (newQuantity > maxQuantity) {
                        alert(`庫存不足！目前庫存：${item.stock_quantity} 件`)
                        return
                      }
                      updateQuantity(item.id, newQuantity)
                    }}
                    className="cart-quantity-btn"
                    disabled={item.quantity >= (item.stock_quantity || 999)}
                  >
                    +
                  </button>
                </div>

                {/* 價格 */}
                <div className="cart-item-price">
                  <div className="cart-item-total">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </div>
                  <div className="cart-item-unit-price">
                    單價: NT$ {item.price.toLocaleString()}
                  </div>
                </div>

                {/* 移除按鈕 */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="cart-remove-btn"
                  title="移除商品"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 訂單摘要 */}
        <div className="cart-summary">
          <div className="cart-summary-header">
            <h2 className="cart-summary-title">訂單摘要</h2>
          </div>
          
          <div className="cart-summary-content">
            <div className="cart-summary-row">
              <span className="cart-summary-label">商品數量</span>
              <span className="cart-summary-value">{totalItems} 件</span>
            </div>
            
            <div className="cart-summary-row">
              <span className="cart-summary-label">商品小計</span>
              <span className="cart-summary-value">NT$ {totalPrice.toLocaleString()}</span>
            </div>
            
            {/* 運送方式選擇 */}
            <div className="shipping-selection">
              <h3 className="shipping-title">選擇運送方式</h3>
              {loadingShipping ? (
                <div className="shipping-loading">
                  <p>載入運送方式中...</p>
                </div>
              ) : (
                <div className="shipping-methods">
                  {shippingMethods.map((method) => {
                  const isFreeShipping = totalPrice >= method.freeThreshold
                  return (
                    <label key={method.id} className="shipping-method">
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={selectedShipping === method.id}
                        onChange={(e) => setSelectedShipping(e.target.value)}
                        className="shipping-radio"
                      />
                      <div className="shipping-method-content">
                        <div className="shipping-method-header">
                          <span className="shipping-method-name">{method.name}</span>
                          <span className="shipping-method-fee">
                            {isFreeShipping ? (
                              <span className="free-shipping">免運費</span>
                            ) : (
                              <span className="shipping-fee">NT$ {method.fee}</span>
                            )}
                          </span>
                        </div>
                        <div className="shipping-method-details">
                          <span className="shipping-description">{method.description}</span>
                          {!isFreeShipping && (
                            <span className="shipping-threshold">
                              滿 NT$ {method.freeThreshold.toLocaleString()} 免運
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                  })}
                </div>
              )}
            </div>
            
            {/* 優惠碼輸入區域 */}
            <div className="coupon-section">
              <h3 className="coupon-title">🎫 優惠碼</h3>
              
              {appliedCoupon ? (
                <div className="applied-coupon">
                  <div className="applied-coupon-info">
                    <span className="coupon-code">已套用: {appliedCoupon.code}</span>
                    <span className="coupon-discount">-NT$ {appliedCoupon.discountAmount.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={removeCoupon}
                    className="remove-coupon-btn"
                    title="移除優惠碼"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="coupon-input-section">
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="請輸入優惠碼"
                      className="coupon-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          validateCoupon()
                        }
                      }}
                    />
                    <button 
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="apply-coupon-btn"
                    >
                      {couponLoading ? '驗證中...' : '套用'}
                    </button>
                  </div>
                  
                  {couponError && (
                    <div className="coupon-error">
                      ⚠️ {couponError}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 顯示優惠券折扣 */}
            {appliedCoupon && (
              <div className="cart-summary-row cart-discount-row">
                <span className="cart-summary-label">優惠券折扣</span>
                <span className="cart-summary-discount">-NT$ {discountAmount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="cart-summary-row">
              <span className="cart-summary-label">運費</span>
              <span className="cart-summary-value">
                {shippingFee === 0 ? (
                  <span className="free-shipping">免運費</span>
                ) : (
                  `NT$ ${shippingFee.toLocaleString()}`
                )}
              </span>
            </div>
            
            <div className="cart-summary-row cart-summary-total-row">
              <span className="cart-summary-label">總計</span>
              <span className="cart-summary-total">NT$ {finalTotal.toLocaleString()}</span>
            </div>

            <a 
              href="/a/checkout" 
              className="cart-checkout-btn"
              onClick={() => {
                // 將優惠碼資訊存儲到 sessionStorage
                if (appliedCoupon) {
                  sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon))
                } else {
                  sessionStorage.removeItem('appliedCoupon')
                }
              }}
            >
              立即結帳
            </a>
            
            <a href="/a/products" className="cart-continue-shopping">
              繼續購物
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}