import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const { id } = params;
    
    return NextResponse.json({ 
      message: `測試活動 ${id} 的路由成功`,
      activityId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Route error',
      details: error.message 
    }, { status: 500 });
  }
}