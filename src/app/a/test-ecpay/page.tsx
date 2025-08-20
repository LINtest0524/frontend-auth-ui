'use client'

import { useState } from 'react'
import PortalHeaderBar from '@/components/PortalHeaderBar'

export default function TestEcpayPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEcpayPayment = async (paymentMethod: string) => {
    setIsLoading(true)
    setResult(null)

    try {
      // 建立測試訂單
      const testOrderData = {
        items: [
          {
            product_id: 1,
            quantity: 1,
            price: 100,
            product_name: '測試商品',
            product_sku: 'TEST-001',
            selected_specs: {},
            variant_id: null
          }
        ],
        customer_name: '測試客戶',
        customer_phone: '0912345678',
        customer_email: 'test@example.com',
        shipping_address: '100 台北市中正區測試路123號',
        shipping_method_id: 'store_pickup',
        shipping_method_name: '7-11超商取貨',
        shipping_fee: 60,
        payment_method: paymentMethod,
        total_amount: 160,
        notes: '綠界金流測試訂單',
        company: 'a'
      }

      const token = localStorage.getItem('portalToken_a')
      if (!token) {
        alert('請先登入')
        return
      }

      // 建立訂單
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testOrderData)
      })

      if (!orderResponse.ok) {
        throw new Error('建立測試訂單失敗')
      }

      const orderResult = await orderResponse.json()
      console.log('測試訂單建立成功:', orderResult)

      // 建立綠界付款
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

      const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/ecpay/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderResult.id,
          paymentMethod: ecpayMethod
        })
      })

      if (!paymentResponse.ok) {
        throw new Error('建立綠界付款失敗')
      }

      const paymentResult = await paymentResponse.json()
      console.log('綠界付款建立成功:', paymentResult)

      if (paymentResult.success) {
        setResult({
          success: true,
          orderId: orderResult.id,
          orderNumber: orderResult.order_number,
          paymentData: paymentResult.data
        })
      } else {
        throw new Error(paymentResult.message || '建立付款失敗')
      }

    } catch (error) {
      console.error('測試失敗:', error)
      setResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const submitToEcpay = () => {
    if (!result?.success || !result?.paymentData) return

    // 將付款資料存到 sessionStorage，然後跳轉到專用的付款頁面
    sessionStorage.setItem('ecpayPaymentData', JSON.stringify(result.paymentData))
    window.location.href = '/a/ecpay-payment'
  }

  return (
    <>
      <PortalHeaderBar />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>綠界金流測試頁面</h1>
        
        <div style={{ marginBottom: '30px' }}>
          <h2>測試說明</h2>
          <p>此頁面用於測試綠界金流整合功能。點擊下方按鈕會建立測試訂單並產生綠界付款表單。</p>
          <p><strong>注意：</strong>這是測試環境，使用綠界提供的測試帳號和金鑰。</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2>測試付款方式</h2>
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <button 
              onClick={() => testEcpayPayment('ecpay_credit')}
              disabled={isLoading}
              style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              💳 測試信用卡付款
            </button>
            <button 
              onClick={() => testEcpayPayment('ecpay_atm')}
              disabled={isLoading}
              style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              🏧 測試 ATM 轉帳
            </button>
            <button 
              onClick={() => testEcpayPayment('ecpay_cvs')}
              disabled={isLoading}
              style={{ padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px' }}
            >
              🏪 測試超商代碼
            </button>
            <button 
              onClick={() => testEcpayPayment('ecpay_barcode')}
              disabled={isLoading}
              style={{ padding: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              📊 測試超商條碼
            </button>
            <button 
              onClick={() => testEcpayPayment('ecpay_all')}
              disabled={isLoading}
              style={{ padding: '10px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              🌐 測試所有付款方式
            </button>
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>建立測試訂單中...</p>
          </div>
        )}

        {result && (
          <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h2>測試結果</h2>
            {result.success ? (
              <div>
                <p style={{ color: 'green' }}>✅ 測試訂單建立成功！</p>
                <p><strong>訂單 ID:</strong> {result.orderId}</p>
                <p><strong>訂單編號:</strong> {result.orderNumber}</p>
                <p><strong>綠界 API URL:</strong> {result.paymentData.action}</p>
                
                <div style={{ marginTop: '20px' }}>
                  <h3>綠界付款參數</h3>
                  <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(result.paymentData.params, null, 2)}
                  </pre>
                </div>

                <button 
                  onClick={submitToEcpay}
                  style={{ 
                    marginTop: '20px', 
                    padding: '15px 30px', 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 前往綠界付款頁面
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: 'red' }}>❌ 測試失敗</p>
                <p><strong>錯誤訊息:</strong> {result.error}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h2>綠界測試卡號</h2>
          <p>在綠界測試環境中，您可以使用以下測試卡號：</p>
          <ul>
            <li><strong>信用卡號:</strong> 4311-9522-2222-2222</li>
            <li><strong>安全碼:</strong> 222</li>
            <li><strong>有效期限:</strong> 任何未來日期（例如：12/25）</li>
          </ul>
        </div>
      </div>
    </>
  )
}