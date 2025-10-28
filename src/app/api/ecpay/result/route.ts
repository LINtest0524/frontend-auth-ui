import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const params: Record<string, string> = {}
    
    // 將 FormData 轉換為普通物件
    for (const [key, value] of body.entries()) {
      params[key] = value.toString()
    }

    console.log('綠界付款結果頁面 (前端):', params)

    // 先通知後端更新訂單狀態（不等待回應，避免阻塞重定向）
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/ecpay/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }).catch(error => {
      console.error('通知後端更新訂單狀態失敗:', error)
    })

    // 直接在前端處理重定向
    // 驗證基本參數
    const rtnCode = params.RtnCode
    const orderId = params.CustomField1
    
    console.log('RtnCode:', rtnCode, 'OrderId:', orderId)

    // 從訂單資料中提取公司代碼（最可靠的方法）
    let companyCode = 'a' // 預設值
    
    if (orderId) {
      try {
        // 呼叫後端 API 取得訂單的公司代碼
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'
        const orderResponse = await fetch(`${backendUrl}/portal/orders/${orderId}/company`)
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          if (orderData.company) {
            companyCode = orderData.company
            console.log('從訂單資料取得公司代碼:', companyCode)
          }
        }
      } catch (error) {
        console.error('無法取得訂單資料:', error)
      }
    }
    
    // 備用方案：從 referer 中提取
    if (companyCode === 'a') {
      const referer = request.headers.get('referer') || ''
      if (referer) {
        const refererUrl = new URL(referer)
        const pathSegments = refererUrl.pathname.split('/').filter(segment => segment)
        if (pathSegments.length > 0 && pathSegments[0] !== 'api' && pathSegments[0].length <= 10) {
          companyCode = pathSegments[0]
        }
      }
    }
    
    console.log('最終確定的公司代碼:', companyCode)

    if (rtnCode === '1') {
      // 付款成功
      if (orderId) {
        console.log('付款成功，重定向到訂單頁面')
        const redirectUrl = `/${companyCode}/orders?success=${encodeURIComponent('付款成功')}&orderId=${encodeURIComponent(orderId)}`
        console.log('重定向 URL:', redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl, request.url), 302)
      } else {
        console.error('付款成功但 orderId 為空')
        return NextResponse.redirect(new URL(`/${companyCode}/orders?error=訂單ID遺失`, request.url), 302)
      }
    } else {
      // 付款失敗
      const rtnMsg = params.RtnMsg || '付款失敗'
      console.log('付款失敗:', rtnMsg)
      return NextResponse.redirect(new URL(`/${companyCode}/orders?error=付款失敗&reason=${encodeURIComponent(rtnMsg)}`, request.url), 302)
    }
  } catch (error) {
    console.error('處理綠界付款結果頁面失敗:', error)
    // 錯誤情況下也嘗試提取公司代碼
    const url = new URL(request.url)
    const referer = request.headers.get('referer') || ''
    let companyCode = 'a' // 預設值
    
    if (referer) {
      const refererUrl = new URL(referer)
      const pathSegments = refererUrl.pathname.split('/').filter(segment => segment)
      if (pathSegments.length > 0 && pathSegments[0] !== 'api' && pathSegments[0].length <= 10) {
        companyCode = pathSegments[0]
      }
    }
    
    return NextResponse.redirect(new URL(`/${companyCode}/orders?error=系統錯誤`, request.url))
  }
}