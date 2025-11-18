import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyCode = searchParams.get('companyCode');
    const subdomain = searchParams.get('subdomain');

    if (!companyCode || !subdomain) {
      return NextResponse.json(
        { error: 'Missing companyCode or subdomain' },
        { status: 400 }
      );
    }

    // 調用後端 API 來驗證代理商子網域
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log(`[API] 調用後端: ${backendUrl}/public/agents/verify-subdomain?companyCode=${companyCode}&subdomain=${subdomain}`);
    
    const response = await fetch(
      `${backendUrl}/public/agents/verify-subdomain?companyCode=${companyCode}&subdomain=${subdomain}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[API] 後端回應狀態: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] 後端錯誤 (${response.status}):`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent subdomain not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const agentData = await response.json();
    console.log('[API] 後端回應數據:', agentData);

    return NextResponse.json({
      id: agentData.id,
      displayName: agentData.agent_name || agentData.displayName,
      agentLevel: agentData.agent_level,
      status: agentData.status,
      frontendUrl: agentData.frontend_url,
      companyId: agentData.company_id,
      promoCode: agentData.login_account // 真正的推廣代碼
    });

  } catch (error) {
    console.error('[API] Error verifying agent subdomain:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}