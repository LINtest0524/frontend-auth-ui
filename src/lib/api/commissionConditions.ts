import { 
  CommissionCondition, 
  CommissionConditionListResponse, 
  CommissionConditionQuery,
  CreateCommissionConditionDto,
  UpdateCommissionConditionDto 
} from '@/types/commission-condition';

// 專門給後台管理使用的 Token 獲取函數（與 admin-api.ts 一致）
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 嘗試多種可能的 token 存儲方式
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
  
  console.warn('⚠️ No admin token found');
  return null;
}

// 取得基礎配置
function getBaseConfig() {
  // 後台管理系統通常使用固定的 companyCode 或從設定取得
  const companyCode = localStorage.getItem('companyCode') || 'a'; // 預設值
  
  const adminToken = getAdminToken();
  
  if (!adminToken) {
    throw new Error('未找到授權令牌，請重新登入');
  }
  
  return {
    adminToken,
    companyCode,
    baseUrl: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001',
  };
}

// 通用請求包裝
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const { adminToken, companyCode, baseUrl } = getBaseConfig();
  
  const url = `${baseUrl}/companies/${companyCode}/commission-conditions${endpoint}`;
  
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `請求失敗 (${response.status})`;
    console.error(`❌ Commission Conditions API ${options.method || 'GET'} failed:`, response.status, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

// 占成條件 API 函數
export const commissionConditionsApi = {
  // 列表查詢
  async list(query: CommissionConditionQuery = {}): Promise<CommissionConditionListResponse> {
    const searchParams = new URLSearchParams();
    
    if (query.page) searchParams.set('page', query.page.toString());
    if (query.limit) searchParams.set('limit', query.limit.toString());
    if (query.keyword) searchParams.set('keyword', query.keyword);
    if (query.agentId) searchParams.set('agentId', query.agentId.toString());
    if (typeof query.isActive === 'boolean') {
      searchParams.set('isActive', query.isActive.toString());
    }

    const endpoint = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest<CommissionConditionListResponse>(endpoint);
  },

  // 取得單筆
  async get(id: string): Promise<CommissionCondition> {
    return apiRequest<CommissionCondition>(`/${id}`);
  },

  // 建立
  async create(payload: CreateCommissionConditionDto): Promise<CommissionCondition> {
    // 確保數值轉為字串避免浮點誤差
    const processedPayload = {
      ...payload,
      groups: payload.groups.map((group, index) => ({
        ...group,
        minNetRevenue: group.minNetRevenue?.toString() || '0',
        sharePercent: group.sharePercent.toString(),
        agentRemitPercent: group.agentRemitPercent.toString(),
        platformRefundRates: group.platformRefundRates?.map(rate => ({
          ...rate,
          refundPercent: rate.refundPercent.toString(),
        })),
        fixedCost: group.fixedCost ? {
          ...group.fixedCost,
          feeDeposit: group.fixedCost.feeDeposit?.toString() || '0',
          feeWithdraw: group.fixedCost.feeWithdraw?.toString() || '0',
          refundBudgetPercent: group.fixedCost.refundBudgetPercent?.toString() || '0',
          promoBudgetPercent: group.fixedCost.promoBudgetPercent?.toString() || '0',
          bonusBudgetPercent: group.fixedCost.bonusBudgetPercent?.toString() || '0',
        } : undefined,
      })),
    };

    return apiRequest<CommissionCondition>('', {
      method: 'POST',
      body: JSON.stringify(processedPayload),
    });
  },

  // 更新
  async update(id: string, payload: UpdateCommissionConditionDto): Promise<CommissionCondition> {
    // 同樣處理數值轉字串
    const processedPayload = {
      ...payload,
      groups: payload.groups?.map((group, index) => ({
        ...group,
        minNetRevenue: group.minNetRevenue?.toString() || '0',
        sharePercent: group.sharePercent?.toString() || '0',
        agentRemitPercent: group.agentRemitPercent?.toString() || '0',
        platformRefundRates: group.platformRefundRates?.map(rate => ({
          ...rate,
          refundPercent: rate.refundPercent.toString(),
        })),
        fixedCost: group.fixedCost ? {
          ...group.fixedCost,
          feeDeposit: group.fixedCost.feeDeposit?.toString() || '0',
          feeWithdraw: group.fixedCost.feeWithdraw?.toString() || '0',
          refundBudgetPercent: group.fixedCost.refundBudgetPercent?.toString() || '0',
          promoBudgetPercent: group.fixedCost.promoBudgetPercent?.toString() || '0',
          bonusBudgetPercent: group.fixedCost.bonusBudgetPercent?.toString() || '0',
        } : undefined,
      })),
    };

    return apiRequest<CommissionCondition>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(processedPayload),
    });
  },

  // 切換狀態
  async patchStatus(id: string, isActive: boolean): Promise<CommissionCondition> {
    return apiRequest<CommissionCondition>(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  // 刪除
  async remove(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/${id}`, {
      method: 'DELETE',
    });
  },
};