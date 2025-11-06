import { useCompanySlug } from '@/hooks/useCompanySlug';

// 預覽請求介面
export interface PreviewCommissionRequest {
  registrations: number;
  activeMembers: number;
  validBets: number;
  netRevenue: number;
  period?: string;
  agentId?: number;
  platformCode?: string;
}

// 匹配的條件組
export interface MatchedGroup {
  groupIndex: number;
  groupName: string;
  conditions: {
    minRegistrations: number;
    minActiveMembers: number;
    minValidBets: number;
    minNetRevenue: number;
    requireNegativeProfit: boolean;
  };
}

// 平台退水
export interface PlatformRefund {
  platformCode: string;
  platformName: string;
  refundRate: number;
  refundAmount: number;
}

// 計算結果
export interface CalculationResult {
  sharePercent: number;
  agentRemitPercent: number;
  platformRefunds: PlatformRefund[];
  fixedCost?: number;
  totalCommission: number;
  netAmount: number;
}

// 預覽結果
export interface PreviewResult {
  success: boolean;
  matchedGroup?: MatchedGroup;
  calculation?: CalculationResult;
  preview?: string;
  reason?: string;
  message?: string;
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
      return token;
    }
  }
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
    const errorMessage = errorData.message || `預覽API請求失敗 (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * 佣金預覽 API
 */
export const commissionPreviewApi = {
  /**
   * 試算現有條件
   */
  async previewExisting(
    companySlug: string,
    conditionId: string,
    request: PreviewCommissionRequest
  ): Promise<PreviewResult> {
    // admin路由特殊處理 - 需要獲取真實的公司代碼
    if (companySlug === 'admin' || !companySlug) {
      
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
        
        return apiRequest<PreviewResult>(`/companies/${realCompanyCode}/commission-conditions/${conditionId}/preview`, {
          method: 'POST',
          body: JSON.stringify(request),
        });
        
      } catch (error) {
        throw new Error(`Admin路由試算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }
    
    return apiRequest<PreviewResult>(`/companies/${companySlug}/commission-conditions/${conditionId}/preview`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * 試算表單條件 (新建時使用)
   */
  async previewForm(
    companySlug: string,
    condition: any,
    request: PreviewCommissionRequest
  ): Promise<PreviewResult> {
    const body = { condition, preview: request };
    
    // admin路由特殊處理 - 需要獲取真實的公司代碼
    if (companySlug === 'admin' || !companySlug) {
      
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
        
        return apiRequest<PreviewResult>(`/companies/${realCompanyCode}/commission-conditions/preview`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        
      } catch (error) {
        throw new Error(`Admin路由試算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }
    
    return apiRequest<PreviewResult>(`/companies/${companySlug}/commission-conditions/preview`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};