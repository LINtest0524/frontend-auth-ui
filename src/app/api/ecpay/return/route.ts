import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const params: Record<string, string> = {}
    
    // 將 FormData 轉換為普通物件
    for (const [key, value] of body.entries()) {
      params[key] = value.toString()
    }

    console.log('綠界付款結果通知 (前端):', params)

    // 轉發到後端處理
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/ecpay/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    const result = await backendResponse.text()
    
    return new NextResponse(result, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  } catch (error) {
    console.error('處理綠界付款結果失敗:', error)
    return new NextResponse('0|系統錯誤', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
}