import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; userId: string }> | { id: string; userId: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const { id, userId } = params;
    
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/checkin/activities/${id}/status/${userId}`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkin status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}