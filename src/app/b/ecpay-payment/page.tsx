'use client'

import { useEffect, useState } from 'react'
import EcpayForm from './EcpayForm'

export default function EcpayPaymentPageB() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)

  useEffect(() => {
    // 從 sessionStorage 取得付款資料
    const paymentDataStr = sessionStorage.getItem('ecpayPaymentData')
    
    if (!paymentDataStr) {
      setError('找不到付款資料，請重新下單')
      setIsLoading(false)
      return
    }

    try {
      const data = JSON.parse(paymentDataStr)
      
      // 清除 sessionStorage 中的付款資料
      sessionStorage.removeItem('ecpayPaymentData')
      
      // 設定付款資料，這會觸發表單渲染和自動提交
      setPaymentData(data)
      setIsLoading(false)
      
    } catch (err) {
      console.error('解析付款資料失敗:', err)
      setError('付款資料格式錯誤，請重新下單')
      setIsLoading(false)
    }
  }, [])

  // 如果有付款資料，渲染表單並自動提交
  if (paymentData) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <div className="spinner"></div>
          <h1 style={{ marginBottom: '10px' }}>正在跳轉到綠界付款頁面</h1>
          <p style={{ color: '#6c757d' }}>請稍候，系統正在為您準備安全的付款環境...</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          maxWidth: '400px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#495057' }}>付款注意事項</h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#6c757d',
            lineHeight: '1.6'
          }}>
            <li>請勿關閉此頁面或重新整理</li>
            <li>付款完成後會自動返回訂單頁面</li>
            <li>如遇問題請聯繫客服</li>
          </ul>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            .spinner {
              width: 50px;
              height: 50px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #007bff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />

        {/* 綠界付款表單 */}
        <EcpayForm action={paymentData.action} params={paymentData.params} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>付款處理失敗</h1>
        <p style={{ marginBottom: '30px', fontSize: '16px' }}>{error}</p>
        <div>
          <a 
            href="/b/cart" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              marginRight: '10px'
            }}
          >
            返回購物車
          </a>
          <a 
            href="/b/orders" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            查看訂單
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <div className="spinner"></div>
        <h1 style={{ marginBottom: '10px' }}>正在載入付款資料</h1>
        <p style={{ color: '#6c757d' }}>請稍候...</p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  )
}