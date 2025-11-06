import { useCompanySlug } from '@/hooks/useCompanySlug';

// 重疊檢查請求介面
export interface OverlapCheckRequest {
  agentId: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  excludeId?: string; // 更新時排除自己
}

// 衝突條件介面
export interface ConflictCondition {
  id: string;
  name: string;
  agentId: number;
  agentName: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
}

// 重疊檢查回應
export interface OverlapCheckResponse {
  hasOverlap: boolean;
  conflicts?: ConflictCondition[];
  suggestions?: string[];
}

// 取得 API Token
function getApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const possibleKeys = [
    'portalToken',
    'portalToken_admin', 
    'adminToken',
    'token'
  ];
  
  for (const key of possibleKeys) {
    const token = localStorage.getItem(key);
    if (token) {
      console.log(`🔑 重疊檢查API使用 token key: ${key}`);
      return token;
    }
  }
  
  console.warn('⚠️ 重疊檢查API找不到授權 token');
  return null;
}

// 基礎 API 請求
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = getApiToken();
  if (!token) {
    throw new Error('未找到授權令牌，請重新登入');
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`🔍 重疊檢查API ${options.method || 'POST'}: ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `重疊檢查API請求失敗 (${response.status})`;
    console.error(`❌ 重疊檢查API失敗:`, response.status, errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log(`✅ 重疊檢查API成功:`, data);
  return data;
}

/**
 * 重疊檢查 API
 */
export const overlapCheckApi = {
  /**
   * 檢查重疊衝突
   */
  async checkOverlap(
    companySlug: string,
    request: OverlapCheckRequest
  ): Promise<OverlapCheckResponse> {
    // admin路由特殊處理 - 需要獲取真實的公司代碼
    if (companySlug === 'admin' || !companySlug) {
      console.log('🔧 Admin路由重疊檢查，需要獲取真實公司代碼');
      
      try {
        // 先獲取用戶的公司資訊
        const token = getApiToken();
        if (!token) {
          throw new Error('未找到授權令牌');
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
        const companiesResponse = await fetch(`${baseUrl}/agents/options/companies`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!companiesResponse.ok) {
          throw new Error('無法獲取公司資訊');
        }

        const companies = await companiesResponse.json();
        if (!companies || companies.length === 0) {
          throw new Error('未找到可用的公司');
        }

        // 使用第一個公司的code
        const realCompanyCode = companies[0].code;
        console.log(`✅ 獲取到真實公司代碼: ${realCompanyCode}`);
        
        return apiRequest<OverlapCheckResponse>(`/companies/${realCompanyCode}/commission-conditions/check-overlap`, {
          method: 'POST',
          body: JSON.stringify(request),
        });
        
      } catch (error) {
        console.error('❌ Admin路由重疊檢查失敗:', error);
        throw new Error(`Admin路由重疊檢查失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }
    
    return apiRequest<OverlapCheckResponse>(`/companies/${companySlug}/commission-conditions/check-overlap`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};