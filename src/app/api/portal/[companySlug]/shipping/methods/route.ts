import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = params
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')

    const response = await fetch(
      `${BACKEND_URL}/portal/${companySlug}/shipping/methods?company=${company || companySlug}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || '獲取運送方式失敗' },
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