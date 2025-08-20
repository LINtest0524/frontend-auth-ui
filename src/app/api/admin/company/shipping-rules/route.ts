import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未提供認證令牌' },
        { status: 401 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/company/shipping-rules`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || '獲取運送規則失敗' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未提供認證令牌' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/company/shipping-rules`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || '更新運送規則失敗' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: '伺服器錯誤' },
      { status: 500 }
    )
  }
}