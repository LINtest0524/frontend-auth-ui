import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function DELETE(request: NextRequest, { params }: { params: { activityName: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/daily-checkin/activities/${encodeURIComponent(params.activityName)}?company_id=${companyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Daily checkin activity delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}