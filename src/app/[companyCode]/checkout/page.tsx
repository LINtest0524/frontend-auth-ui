'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useCartStore } from '@/hooks/use-cart-store-new'
import { useUserStore } from '@/hooks/use-user-store'
import './checkout.css'

interface ShippingInfo {
  fullName: string
  phone: string
  email: string
  address: string
  city: string
  postalCode: string
  notes?: string
}

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: string
}

export default function CheckoutPage() {
  const params = useParams()
  const companyCode = params.companyCode as string
  
  const { 
    items, 
    getTotalItems, 
    getTotalPrice, 
    clearCart,
    getSelectedShippingMethod,
    getShippingFee
  } = useCartStore()
  const { user } = useUserStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  })
  
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()
  const selectedShippingMethod = getSelectedShippingMethod()
  const shippingFee = getShippingFee()
  
  // 計算優惠券折扣
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const discountedPrice = totalPrice - discountAmount
  const finalTotal = Math.max(0, discountedPrice) + shippingFee

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'ecpay_credit',
      name: '綠界信用卡',
      description: '透過綠界金流 - Visa、MasterCard、JCB',
      icon: '💳'
    },
    {
      id: 'ecpay_atm',
      name: 'ATM 轉帳',
      description: '透過綠界金流 - 虛擬帳號轉帳',
      icon: '🏧'
    },
    {
      id: 'ecpay_cvs',
      name: '超商代碼繳費',
      description: '透過綠界金流 - 7-11、全家、萊爾富',
      icon: '🏪'
    },
    {
      id: 'ecpay_barcode',
      name: '超商條碼繳費',
      description: '透過綠界金流 - 超商條碼繳費',
      icon: '📊'
    },
    {
      id: 'ecpay_all',
      name: '綠界所有付款方式',
      description: '讓客戶在綠界頁面選擇付款方式',
      icon: '🌐'
    },
    {
      id: 'cash_on_delivery',
      name: '貨到付款',
      description: '收貨時現金付款',
      icon: '💰'
    }
  ]

  // 標記是否正在處理付款，避免在付款過程中重導向
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // 如果購物車為空且不是在處理付款，重導向到購物車頁面
  useEffect(() => {
    if (items.length === 0 && !isProcessingPayment) {
      // 延遲檢查，避免在付款流程中誤觸發
      const timer = setTimeout(() => {
        if (items.length === 0 && !isProcessingPayment) {
          window.location.href = `/${companyCode}/cart`
        }
      }, 2000) // 延遲 2 秒

      return () => clearTimeout(timer)
    }
  }, [items, isProcessingPayment, companyCode])

  // 如果沒有選擇運送方式，提示用戶回到購物車選擇
  useEffect(() => {
    if (items.length > 0 && !selectedShippingMethod && !isProcessingPayment) {
      // 延遲檢查，避免在付款流程中誤觸發
      const timer = setTimeout(() => {
        if (items.length > 0 && !selectedShippingMethod && !isProcessingPayment) {
          alert('請先在購物車頁面選擇運送方式')
          window.location.href = `/${companyCode}/cart`
        }
      }, 2000) // 延遲 2 秒

      return () => clearTimeout(timer)
    }
  }, [items.length, selectedShippingMethod, isProcessingPayment, companyCode])

  // 從 sessionStorage 載入優惠碼資訊
  useEffect(() => {
    const savedCoupon = sessionStorage.getItem('appliedCoupon')
    if (savedCoupon) {
      try {
        const couponData = JSON.parse(savedCoupon)
        setAppliedCoupon(couponData)
      } catch (error) {
        console.error('解析優惠碼資料失敗:', error)
        sessionStorage.removeItem('appliedCoupon')
      }
    }
  }, [])

  const handleShippingInfoChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateShippingInfo = (): boolean => {
    const required = ['fullName', 'phone', 'email', 'address', 'city', 'postalCode']
    return required.every(field => shippingInfo[field as keyof ShippingInfo]?.trim())
  }

  // 處理綠界付款
  const handleEcpayPayment = async (orderId: number, paymentMethod: string) => {
    try {
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/ecpay/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentMethod: paymentMethod
        })
      })

      if (!response.ok) {
        throw new Error('建立綠界付款失敗')
      }

      const result = await response.json()
      console.log('綠界API回應:', result)

      if (result.success && result.data) {
        // 新格式：{success: true, data: {action: "...", params: {...}}}
        // 標記正在處理付款，防止 useEffect 重導向
        setIsProcessingPayment(true)
        
        // 將付款資料存到 sessionStorage，然後跳轉到專用的付款頁面
        sessionStorage.setItem('ecpayPaymentData', JSON.stringify(result.data))
        
        // 將購物車資料也暫存，以防付款失敗時可以恢復
        sessionStorage.setItem('checkoutCartData', JSON.stringify(items))
        
        // 清空購物車（在跳轉前清空，避免用戶返回時看到重複的商品）
        clearCart()
        sessionStorage.removeItem('appliedCoupon')
        
        // 短暫延遲後跳轉，確保狀態更新完成
        setTimeout(() => {
          window.location.href = `/${companyCode}/ecpay-payment`
        }, 100)
      } else if (result.form_html) {
        // 舊格式：直接包含 form_html（不要立即清空購物車）
        
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(result.form_html)
          newWindow.document.close()
        } else {
          document.body.innerHTML = result.form_html
        }
      } else if (result.payment_url) {
        // 如果有付款URL，直接跳轉（不要立即清空購物車）
        window.location.href = result.payment_url
      } else if (result.success === false) {
        // 如果綠界回傳失敗訊息
        throw new Error(result.message || '綠界付款建立失敗')
      } else {
        // 打印實際回應內容以便除錯
        console.error('綠界API回應格式:', result)
        throw new Error(`綠界付款回應格式不正確: ${JSON.stringify(result)}`)
      }
    } catch (error: any) {
      console.error('綠界付款失敗:', error)
      alert(`付款處理失敗: ${error.message}`)
    }
  }

  const handleSubmitOrder = async () => {
    if (!validateShippingInfo()) {
      alert('請填寫完整的收貨資訊')
      return
    }

    if (!selectedPayment) {
      alert('請選擇付款方式')
      return
    }

    setIsSubmitting(true)
    setIsProcessingPayment(true)

    try {
      // 如果有使用優惠券，先調用使用優惠券 API
      if (appliedCoupon) {
        const token = localStorage.getItem(`portalToken_${companyCode}`)
        const useCouponResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/portal/coupons/use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code: appliedCoupon.code,
            amount: totalPrice // 使用折扣前的金額
          })
        })

        if (!useCouponResponse.ok) {
          const error = await useCouponResponse.json()
          throw new Error(error.message || '優惠券使用失敗')
        }

        const useCouponResult = await useCouponResponse.json()
      }

      // 準備訂單資料 - 傳遞折扣後的總金額
      const orderData = {
        items: items.map(item => ({
          product_id: item.productId || item.id,  // 使用正確的 productId
          quantity: item.quantity,
          price: item.price,  // 使用原價（商品項目保持原價）
          product_name: item.name,
          product_sku: item.sku,
          selected_specs: item.variant?.options || {},  // 使用變體選項
          variant_id: item.variant?.id || undefined      // 變體ID
        })),
        customer_name: shippingInfo.fullName,
        customer_phone: shippingInfo.phone,
        customer_email: shippingInfo.email,
        shipping_address: `${shippingInfo.postalCode} ${shippingInfo.city} ${shippingInfo.address}`,
        shipping_method_id: selectedShippingMethod?.id,
        shipping_method_name: selectedShippingMethod?.name,
        shipping_fee: shippingFee,
        payment_method: selectedPayment,
        total_amount: finalTotal,
        notes: shippingInfo.notes || "",
        company: companyCode
      }


      // 呼叫後端API - 使用與A資料夾相同的路徑
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      if (!token) {
        alert('登入狀態已過期，請重新登入')
        window.location.href = `/${companyCode}/login`
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('訂單提交失敗')
      }

      const result = await response.json()

      // 檢查是否為綠界付款
      if (selectedPayment.startsWith('ecpay_')) {
        // 建立綠界付款
        await handleEcpayPayment(result.id, selectedPayment)
      } else {
        // 非綠界付款，直接完成
        clearCart()
        sessionStorage.removeItem('appliedCoupon')
        alert(`訂單提交成功！訂單編號：${result.order_number}`)
        window.location.href = `/${companyCode}/orders`
      }
    } catch (error: any) {
      console.error('結帳失敗:', error)
      
      // 區分不同類型的錯誤
      if (error.message.includes('綠界')) {
        // 綠界付款失敗，不跳轉，讓用戶可以重試或選擇其他付款方式
        alert(`付款處理失敗: ${error.message}\n\n請檢查網路連線或選擇其他付款方式`)
      } else {
        // 其他錯誤（如訂單建立失敗），跳轉回購物車
        alert(`結帳失敗: ${error.message}`)
        
        // 只有在訂單建立失敗時才恢復購物車資料
        if (!error.message.includes('付款')) {
          sessionStorage.setItem('checkoutError', error.message)
          // 不恢復購物車資料，避免數量異常
          // sessionStorage.setItem('checkoutCartData', JSON.stringify(items))
        }
        
        // 跳轉回購物車頁面
        window.location.href = `/${companyCode}/cart`
      }
    } finally {
      setIsSubmitting(false)
      setIsProcessingPayment(false)
    }
  }

  // 如果正在載入或購物車為空，顯示載入狀態
  if (items.length === 0) {
    return (
      <div className="checkout-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-container">
      {/* 頁面標題 */}
      <div className="checkout-header">
        <div className="checkout-header-content">
          <h1 className="checkout-title">
            <span className="checkout-title-icon">🛒</span>
            結帳
          </h1>
          <div className="checkout-breadcrumb">
            <a href={`/${companyCode}`}>首頁</a>
            <span>›</span>
            <a href={`/${companyCode}/products`}>商品</a>
            <span>›</span>
            <a href={`/${companyCode}/cart`}>購物車</a>
            <span>›</span>
            <span>結帳</span>
          </div>
        </div>
      </div>

      {/* 進度指示器 */}
      <div className="checkout-progress">
        <div className="progress-container">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-icon">1</div>
            <div className="step-label">填寫資料</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-icon">2</div>
            <div className="step-label">確認訂單</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-icon">3</div>
            <div className="step-label">完成付款</div>
          </div>
        </div>
      </div>

      <div className="checkout-layout">
        {/* 左側：結帳表單 */}
        <div className="checkout-form-section">
          {currentStep === 1 && (
            <div className="checkout-step">
              <h2 className="step-title">📦 收貨資訊</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">收件人姓名 *</label>
                  <input
                    type="text"
                    value={shippingInfo.fullName}
                    onChange={(e) => handleShippingInfoChange('fullName', e.target.value)}
                    className="form-input"
                    placeholder="請輸入收件人姓名"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">聯絡電話 *</label>
                  <input
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => handleShippingInfoChange('phone', e.target.value)}
                    className="form-input"
                    placeholder="請輸入聯絡電話"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">電子信箱 *</label>
                  <input
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => handleShippingInfoChange('email', e.target.value)}
                    className="form-input"
                    placeholder="請輸入電子信箱"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">城市 *</label>
                  <input
                    type="text"
                    value={shippingInfo.city}
                    onChange={(e) => handleShippingInfoChange('city', e.target.value)}
                    className="form-input"
                    placeholder="請輸入城市"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">郵遞區號 *</label>
                  <input
                    type="text"
                    value={shippingInfo.postalCode}
                    onChange={(e) => handleShippingInfoChange('postalCode', e.target.value)}
                    className="form-input"
                    placeholder="請輸入郵遞區號"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">詳細地址 *</label>
                  <input
                    type="text"
                    value={shippingInfo.address}
                    onChange={(e) => handleShippingInfoChange('address', e.target.value)}
                    className="form-input"
                    placeholder="請輸入詳細地址"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">備註</label>
                  <textarea
                    value={shippingInfo.notes}
                    onChange={(e) => handleShippingInfoChange('notes', e.target.value)}
                    className="form-textarea"
                    placeholder="有任何特殊需求請在此說明"
                    rows={3}
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!validateShippingInfo()}
                  className="next-step-btn"
                >
                  下一步：選擇付款方式
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="checkout-step">
              <h2 className="step-title">💳 付款方式</h2>
              
              <div className="payment-methods">
                {paymentMethods.map((method) => (
                  <label key={method.id} className="payment-method">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={() => setSelectedPayment(method.id)}
                      className="payment-radio"
                    />
                    <div className="payment-info">
                      <div className="payment-icon">{method.icon}</div>
                      <div className="payment-details">
                        <div className="payment-name">{method.name}</div>
                        <div className="payment-description">{method.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="step-actions">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="prev-step-btn"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={!selectedPayment || isSubmitting}
                  className="submit-order-btn"
                >
                  {isSubmitting ? '處理中...' : '確認並付款'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右側：訂單摘要 */}
        <div className="checkout-summary-section">
          <div className="checkout-summary">
            <h3 className="summary-title">訂單摘要</h3>

            {/* 商品列表 */}
            <div className="summary-items">
              {items.map((item) => (
                <div key={`${item.id}-${item.variant?.id || 'no-variant'}`} className="summary-item">
                  <div className="item-image">
                    {item.thumbnail ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                        alt={item.name}
                      />
                    ) : (
                      <div className="item-no-image">📦</div>
                    )}
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    {item.variant && (
                      <div className="item-variant">
                        {Object.entries(item.variant.options).map(([key, value]) => (
                          <span key={key}>{key}: {value}</span>
                        )).join(', ')}
                      </div>
                    )}
                    <div className="item-quantity">數量: {item.quantity}</div>
                  </div>
                  <div className="item-price">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* 運送資訊 */}
            {selectedShippingMethod && (
              <div className="summary-shipping">
                <h4>🚚 運送方式</h4>
                <div className="shipping-info">
                  <div className="shipping-name">{selectedShippingMethod.name}</div>
                  <div className="shipping-description">{selectedShippingMethod.description}</div>
                </div>
              </div>
            )}

            {/* 優惠碼資訊 */}
            {appliedCoupon && (
              <div className="summary-coupon">
                <h4>🎫 已套用優惠碼</h4>
                <div className="coupon-info">
                  <span className="coupon-code">{appliedCoupon.code}</span>
                  <span className="coupon-discount">-NT$ {discountAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* 價格明細 */}
            <div className="summary-pricing">
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

            {/* 安全保證 */}
            <div className="security-badges">
              <div className="security-badge">
                🔒 SSL 安全加密
              </div>
              <div className="security-badge">
                ✅ 綠界金流認證
              </div>
              <div className="security-badge">
                📞 24小時客服支援
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}