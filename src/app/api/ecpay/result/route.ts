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

    if (rtnCode === '1') {
      // 付款成功
      if (orderId) {
        console.log('付款成功，重定向到訂單頁面')
        const redirectUrl = `/a/orders?success=${encodeURIComponent('付款成功')}&orderId=${encodeURIComponent(orderId)}`
        console.log('重定向 URL:', redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl, request.url), 302)
      } else {
        console.error('付款成功但 orderId 為空')
        return NextResponse.redirect(new URL('/a/orders?error=訂單ID遺失', request.url), 302)
      }
    } else {
      // 付款失敗
      const rtnMsg = params.RtnMsg || '付款失敗'
      console.log('付款失敗:', rtnMsg)
      return NextResponse.redirect(new URL(`/a/orders?error=付款失敗&reason=${encodeURIComponent(rtnMsg)}`, request.url), 302)
    }
  } catch (error) {
    console.error('處理綠界付款結果頁面失敗:', error)
    return NextResponse.redirect(new URL('/a/orders?error=系統錯誤', request.url))
  }
}