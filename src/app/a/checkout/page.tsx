'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/hooks/use-cart-store-new'
import { useUserStore } from '@/hooks/use-user-store'
import PortalHeaderBar from '@/components/PortalHeaderBar'
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

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()
  const selectedShippingMethod = getSelectedShippingMethod()
  const shippingFee = getShippingFee()
  const finalTotal = totalPrice + shippingFee

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
      window.location.href = '/a/cart'
    }
  }, [items, isProcessingPayment])

  // 如果沒有選擇運送方式，提示用戶回到購物車選擇
  useEffect(() => {
    if (items.length > 0 && !selectedShippingMethod && !isProcessingPayment) {
      alert('請先在購物車頁面選擇運送方式')
      window.location.href = '/a/cart'
    }
  }, [items.length, selectedShippingMethod, isProcessingPayment])

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

    try {
      // 調用後端 API 建立訂單
      const orderData = {
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.name,
          product_sku: item.sku,
          selected_specs: item.selectedSpecs || {},
          variant_id: item.variantId || null
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
        notes: shippingInfo.notes,
        company: 'a'
      }

      console.log('提交訂單:', orderData)

      // 確保用戶已登入
      if (!user) {
        alert('請先登入再進行結帳')
        window.location.href = '/a/login'
        return
      }

      const token = localStorage.getItem('portalToken_a')
      if (!token) {
        alert('登入狀態已過期，請重新登入')
        window.location.href = '/a/login'
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
        alert(`訂單提交成功！訂單編號：${result.order_number}`)
        window.location.href = '/a/orders'
      }

    } catch (error) {
      console.error('提交訂單失敗:', error)
      alert('提交訂單失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 處理綠界付款
  const handleEcpayPayment = async (orderId: number, paymentMethod: string) => {
    try {
      // 轉換付款方式
      let ecpayMethod = ''
      switch (paymentMethod) {
        case 'ecpay_credit':
          ecpayMethod = 'credit_card'
          break
        case 'ecpay_atm':
          ecpayMethod = 'atm'
          break
        case 'ecpay_cvs':
          ecpayMethod = 'cvs'
          break
        case 'ecpay_barcode':
          ecpayMethod = 'barcode'
          break
        default:
          ecpayMethod = 'all'
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/ecpay/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentMethod: ecpayMethod
        })
      })

      if (!response.ok) {
        throw new Error('建立綠界付款失敗')
      }

      const paymentResult = await response.json()

      if (paymentResult.success) {
        // 標記正在處理付款，防止 useEffect 重導向
        setIsProcessingPayment(true)
        
        // 將付款資料存到 sessionStorage，然後跳轉到專用的付款頁面
        sessionStorage.setItem('ecpayPaymentData', JSON.stringify(paymentResult.data))
        
        // 將購物車資料也暫存，以防付款失敗時可以恢復
        sessionStorage.setItem('checkoutCartData', JSON.stringify(items))
        
        // 清空購物車（在跳轉前清空，避免用戶返回時看到重複的商品）
        clearCart()
        
        // 短暫延遲後跳轉，確保狀態更新完成
        setTimeout(() => {
          window.location.href = '/a/ecpay-payment'
        }, 100)
      } else {
        throw new Error(paymentResult.message || '建立付款失敗')
      }
    } catch (error) {
      console.error('綠界付款處理失敗:', error)
      alert('付款處理失敗，請稍後再試')
    }
  }

  if (items.length === 0) {
    return null // 等待重導向
  }

  return (
    <>
      <PortalHeaderBar />
      <div className="checkout-container">
        {/* 結帳步驟指示器 */}
        <div className="checkout-steps">
          <div className="checkout-steps-content">
            <div className={`checkout-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">確認商品</div>
            </div>
            <div className="step-divider"></div>
            <div className={`checkout-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">收貨資訊</div>
            </div>
            <div className="step-divider"></div>
            <div className={`checkout-step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">付款方式</div>
            </div>
            <div className="step-divider"></div>
            <div className={`checkout-step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">完成訂單</div>
            </div>
          </div>
        </div>

        <div className="checkout-main">
          {/* 左側：表單區域 */}
          <div className="checkout-form-section">
            {/* 步驟 1: 確認商品 */}
            <div className="checkout-section">
              <h2 className="section-title">
                <span className="section-icon">📦</span>
                確認商品 ({totalItems} 件)
              </h2>
              <div className="order-items">
                {items.map((item) => (
                  <div key={item.id} className="order-item">
                    <div className="order-item-image">
                      {item.thumbnail ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                          alt={item.name}
                        />
                      ) : (
                        <div className="order-item-placeholder">📦</div>
                      )}
                    </div>
                    <div className="order-item-info">
                      <h4 className="order-item-name">{item.name}</h4>
                      <div className="order-item-meta">
                        <span>SKU: {item.sku}</span>
                        {item.category && <span>分類: {item.category.name}</span>}
                        {item.selectedSpecs && Object.keys(item.selectedSpecs).length > 0 && (
                          <div className="order-item-specs">
                            規格: {Object.entries(item.selectedSpecs).map(([key, value]) => `${key}:${value}`).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="order-item-quantity">
                      數量: {item.quantity}
                    </div>
                    <div className="order-item-price">
                      NT$ {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 步驟 2: 收貨資訊 */}
            <div className="checkout-section">
              <h2 className="section-title">
                <span className="section-icon">🚚</span>
                收貨資訊
              </h2>
              <div className="shipping-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">收件人姓名 *</label>
                    <input
                      type="text"
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => handleShippingInfoChange('fullName', e.target.value)}
                      placeholder="請輸入收件人姓名"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">聯絡電話 *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={shippingInfo.phone}
                      onChange={(e) => handleShippingInfoChange('phone', e.target.value)}
                      placeholder="請輸入聯絡電話"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">電子信箱 *</label>
                  <input
                    type="email"
                    id="email"
                    value={shippingInfo.email}
                    onChange={(e) => handleShippingInfoChange('email', e.target.value)}
                    placeholder="請輸入電子信箱"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">縣市 *</label>
                    <select
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => handleShippingInfoChange('city', e.target.value)}
                      required
                    >
                      <option value="">請選擇縣市</option>
                      <option value="台北市">台北市</option>
                      <option value="新北市">新北市</option>
                      <option value="桃園市">桃園市</option>
                      <option value="台中市">台中市</option>
                      <option value="台南市">台南市</option>
                      <option value="高雄市">高雄市</option>
                      <option value="基隆市">基隆市</option>
                      <option value="新竹市">新竹市</option>
                      <option value="嘉義市">嘉義市</option>
                      <option value="新竹縣">新竹縣</option>
                      <option value="苗栗縣">苗栗縣</option>
                      <option value="彰化縣">彰化縣</option>
                      <option value="南投縣">南投縣</option>
                      <option value="雲林縣">雲林縣</option>
                      <option value="嘉義縣">嘉義縣</option>
                      <option value="屏東縣">屏東縣</option>
                      <option value="宜蘭縣">宜蘭縣</option>
                      <option value="花蓮縣">花蓮縣</option>
                      <option value="台東縣">台東縣</option>
                      <option value="澎湖縣">澎湖縣</option>
                      <option value="金門縣">金門縣</option>
                      <option value="連江縣">連江縣</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="postalCode">郵遞區號 *</label>
                    <input
                      type="text"
                      id="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={(e) => handleShippingInfoChange('postalCode', e.target.value)}
                      placeholder="請輸入郵遞區號"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address">詳細地址 *</label>
                  <input
                    type="text"
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => handleShippingInfoChange('address', e.target.value)}
                    placeholder="請輸入詳細地址"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">備註</label>
                  <textarea
                    id="notes"
                    value={shippingInfo.notes}
                    onChange={(e) => handleShippingInfoChange('notes', e.target.value)}
                    placeholder="如有特殊需求請在此說明"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* 步驟 3: 付款方式 */}
            <div className="checkout-section">
              <h2 className="section-title">
                <span className="section-icon">💳</span>
                付款方式
              </h2>
              <div className="payment-methods">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`payment-method ${selectedPayment === method.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                    />
                    <div className="payment-method-content">
                      <div className="payment-method-icon">{method.icon}</div>
                      <div className="payment-method-info">
                        <div className="payment-method-name">{method.name}</div>
                        <div className="payment-method-description">{method.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 右側：訂單摘要 */}
          <div className="checkout-summary">
            <div className="summary-card">
              <h3 className="summary-title">訂單摘要</h3>
              
              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">商品數量</span>
                  <span className="summary-value">{totalItems} 件</span>
                </div>
                
                <div className="summary-row">
                  <span className="summary-label">商品小計</span>
                  <span className="summary-value">NT$ {totalPrice.toLocaleString()}</span>
                </div>
                
                <div className="summary-row">
                  <span className="summary-label">運送方式</span>
                  <span className="summary-value">
                    {selectedShippingMethod ? selectedShippingMethod.name : '未選擇'}
                  </span>
                </div>
                
                <div className="summary-row">
                  <span className="summary-label">運費</span>
                  <span className="summary-value">
                    {shippingFee === 0 ? '免運費' : `NT$ ${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-row summary-total">
                  <span className="summary-label">總計</span>
                  <span className="summary-value">NT$ {finalTotal.toLocaleString()}</span>
                </div>

                <button
                  className="checkout-submit-btn"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || !validateShippingInfo() || !selectedPayment}
                >
                  {isSubmitting ? '處理中...' : '確認訂購'}
                </button>

                <a href="/a/cart" className="back-to-cart">
                  返回購物車
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}