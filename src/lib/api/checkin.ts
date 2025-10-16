// API 封裝層
const API_BASE = '/api/checkin';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

class CheckinApi {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    };
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 活動管理
  async getActivities(params: {
    activityType?: string;
    companyId?: number;
    isEnabled?: boolean;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      data: any[];
      page: number;
      pageSize: number;
      total: number;
    }>(`${API_BASE}/activities?${queryParams}`);
  }

  async getActivity(id: number) {
    return this.request<any>(`${API_BASE}/activities/${id}`);
  }

  async createActivity(data: any) {
    return this.request<any>(`${API_BASE}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActivity(id: number, data: any) {
    return this.request<any>(`${API_BASE}/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateActivityStatus(id: number, data: { isEnabled?: boolean; publishAt?: string }) {
    return this.request<any>(`${API_BASE}/activities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteActivity(id: number) {
    return this.request<{ message: string }>(`${API_BASE}/activities/${id}`, {
      method: 'DELETE',
    });
  }

  // 獎勵管理
  async getDayRewards(activityId: number) {
    return this.request<any[]>(`${API_BASE}/activities/${activityId}/day-rewards`);
  }

  async putDayRewards(activityId: number, dayRewards: any[]) {
    return this.request<any[]>(`${API_BASE}/activities/${activityId}/day-rewards`, {
      method: 'PUT',
      body: JSON.stringify({ dayRewards }),
    });
  }

  async putThresholds(activityId: number, thresholds: any[]) {
    return this.request<any>(`${API_BASE}/activities/${activityId}/thresholds`, {
      method: 'PUT',
      body: JSON.stringify({ thresholds }),
    });
  }

  // 模擬和進度
  async simulateNextStep(activityId: number, data: { userId: number; today: string }) {
    return this.request<any>(`${API_BASE}/activities/${activityId}/simulate/next-step`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserProgress(activityId: number, userId: number) {
    return this.request<any>(`${API_BASE}/activities/${activityId}/progress/${userId}`);
  }
}

export const checkinApi = new CheckinApi();