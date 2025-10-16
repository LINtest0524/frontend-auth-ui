// 統一的 API Client
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
  }

  // 統一的 token 管理
  private getToken(tokenType: 'admin' | 'portal_a' | 'portal_b' = 'portal_a'): string | null {
    switch (tokenType) {
      case 'admin':
        return localStorage.getItem('token');
      case 'portal_a':
        return localStorage.getItem('portalToken_a');
      case 'portal_b':
        return localStorage.getItem('portalToken_b');
      default:
        return localStorage.getItem('portalToken_a');
    }
  }

  // 統一的請求頭管理
  private getHeaders(tokenType: 'admin' | 'portal_a' | 'portal_b' = 'portal_a'): HeadersInit {
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
    tokenType: 'admin' | 'portal_a' | 'portal_b' = 'portal_a'
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
      this.request('/api/public-checkin/activities', {}, 'portal_a'),

    // 獲取用戶簽到狀態（後端從JWT中取得用戶ID）
    getUserStatus: (activityId: number, userId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/status/${userId}`, {}, 'portal_a'),

    // 獲取活動獎勵配置
    getActivityRewards: (activityId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/rewards`, {}, 'portal_a'),

    // 新增：獲取合併的狀態和獎勵配置（後端從JWT中取得用戶ID）
    getUserStatusWithRewards: (activityId: number, userId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/status-with-rewards/${userId}`, {}, 'portal_a'),

    // 執行簽到（後端從JWT中取得用戶ID進行驗證）
    performCheckin: (activityId: number, userId: number) =>
      this.request(`/api/public-checkin/activities/${activityId}/perform`, {
        method: 'POST',
        body: JSON.stringify({ userId }), // 仍傳送但後端會驗證是否匹配
      }, 'portal_a'),
  };
}

// 導出單例實例
export const apiClient = new ApiClient();