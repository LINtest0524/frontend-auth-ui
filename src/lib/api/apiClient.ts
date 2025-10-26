// 統一的 API Client
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
  }

  // 獲取當前公司代碼
  private getCurrentCompanyCode(): string {
    if (typeof window === 'undefined') return 'a'; // SSR 默認值
    
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    // 檢查是否為後台路由（dashboard）
    if (segments[0] === 'dashboard' || segments[0] === 'admin' || segments[0] === 'audit-log' || segments[0] === 'back-menu' || segments[0] === 'checkin' || segments[0] === 'lucky-draw' || segments[0] === 'reports' || segments[0] === 'users') {
      return 'admin';
    }
    
    // 前台路由，取第一個段落作為公司代碼
    return segments[0] || 'a';
  }

  // 統一的 token 管理
  private getToken(tokenType: 'admin' | 'portal' | 'auto' = 'auto'): string | null {
    if (tokenType === 'admin') {
      return localStorage.getItem('token');
    }
    
    if (tokenType === 'auto') {
      const companyCode = this.getCurrentCompanyCode();
      if (companyCode === 'admin') {
        return localStorage.getItem('token');
      }
      return localStorage.getItem(`portalToken_${companyCode}`);
    }
    
    // portal 類型，使用動態公司代碼
    const companyCode = this.getCurrentCompanyCode();
    return localStorage.getItem(`portalToken_${companyCode}`);
  }

  // 統一的請求頭管理
  private getHeaders(tokenType: 'admin' | 'portal' | 'auto' = 'auto'): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken(tokenType);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // 通用請求方法
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    tokenType: 'admin' | 'portal' | 'auto' = 'auto'
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(tokenType),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Daily Checkin 相關 API
  dailyCheckin = {
    // 獲取可用活動
    getAvailableActivities: () => 
      this.request('/api/public-checkin/activities', {}, 'portal'),

    // 獲取用戶簽到狀態（後端從JWT中取得用戶ID）
    getUserStatus: (activityId: number, userId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/status/${userId}`, {}, 'portal'),

    // 獲取活動獎勵配置
    getActivityRewards: (activityId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/rewards`, {}, 'portal'),

    // 新增：獲取合併的狀態和獎勵配置（後端從JWT中取得用戶ID）
    getUserStatusWithRewards: (activityId: number, userId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/status-with-rewards/${userId}`, {}, 'portal'),

    // 執行簽到（後端從JWT中取得用戶ID進行驗證）
    performCheckin: (activityId: number, userId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/perform`, {
        method: 'POST',
        body: JSON.stringify({ userId }), // 仍傳送但後端會驗證是否匹配
      }, 'portal'),
  };
}

// 導出單例實例
export const apiClient = new ApiClient();