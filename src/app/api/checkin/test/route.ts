import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Checkin API 路由測試成功',
    timestamp: new Date().toISOString()
  });
}