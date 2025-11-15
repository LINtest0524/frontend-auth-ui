import { adminApiGet } from '../admin-api';

export interface CommissionConditionAuditLog {
  id: string;
  createdAt: string;
  operator: string;
  operatorRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetName: string;
  changes: Record<string, any>;
  metadata?: {
    ip: string;
    platform: string;
    target: string;
  };
}

export interface CommissionConditionAuditLogQuery {
  page?: number;
  limit?: number;
  targetId?: string; // 特定分潤方案的ID
  startDate?: string;
  endDate?: string;
  action?: string;
  operator?: string;
}

export interface CommissionConditionAuditLogListResponse {
  items: CommissionConditionAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const commissionConditionAuditLogsApi = {
  // 查詢分潤管理操作記錄
  async list(query: CommissionConditionAuditLogQuery = {}): Promise<CommissionConditionAuditLogListResponse> {
    const searchParams = new URLSearchParams();
    
    if (query.page) searchParams.set('page', query.page.toString());
    if (query.limit) searchParams.set('limit', query.limit.toString());
    
    if (query.targetId) searchParams.set('targetId', query.targetId);
    if (query.startDate) searchParams.set('startDate', query.startDate);
    if (query.endDate) searchParams.set('endDate', query.endDate);
    if (query.action) searchParams.set('action', query.action);
    if (query.operator) searchParams.set('operator', query.operator);

    const endpoint = `/audit-log/commission-conditions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return adminApiGet<CommissionConditionAuditLogListResponse>(endpoint);
  },

  // 格式化操作類型顯示
  formatAction(action: string): string {
    const actionMap: Record<string, string> = {
      'CREATE': '新增',
      'UPDATE': '編輯', 
      'DELETE': '刪除'
    };
    return actionMap[action] || action;
  },

  // 格式化變更內容顯示
  formatChanges(changes: Record<string, any>): string {
    const items = [];
    
    for (const [key, value] of Object.entries(changes)) {
      const fieldName = this.getFieldDisplayName(key);
      
      if (key === 'gameRebateRates' && typeof value === 'object' && value !== null) {
        // 特別處理遊戲返水比例
        const gameItems = [];
        for (const [gameType, gameChange] of Object.entries(value)) {
          const gameTypeName = this.getGameTypeName(gameType);
          if (typeof gameChange === 'object' && gameChange !== null && 'from' in gameChange && 'to' in gameChange) {
            gameItems.push(`${gameTypeName}: ${gameChange.from}% → ${gameChange.to}%`);
          }
        }
        if (gameItems.length > 0) {
          items.push(`遊戲返水比例(${gameItems.join(', ')})`);
        }
      } else if (typeof value === 'object' && value !== null && 'from' in value && 'to' in value) {
        items.push(`${fieldName}: ${this.formatFieldValue(key, value.from)} → ${this.formatFieldValue(key, value.to)}`);
      } else {
        items.push(`${fieldName}: ${this.formatFieldValue(key, value)}`);
      }
    }
    
    return items.join(', ');
  },

  // 獲取欄位顯示名稱
  getFieldDisplayName(field: string): string {
    const fieldMap: Record<string, string> = {
      'name': '方案名稱',
      'agentId': '代理商',
      'commissionPercent': '代理占成比例(%)',
      'systemType': '分潤制度',
      'agentLevel': '代理級別',
      'settlementCycle': '結算週期',
      'isActive': '狀態',
      'method': '計算方法',
      'gameRebateRates': '遊戲返水比例'
    };
    return fieldMap[field] || field;
  },

  // 獲取遊戲類型顯示名稱
  getGameTypeName(gameType: string): string {
    const gameTypeMap: Record<string, string> = {
      'live': '真人',
      'slot': '電子',
      'sport': '體育',
      'lottery': '彩票',
      'card': '棋牌',
      'fishing': '捕魚'
    };
    return gameTypeMap[gameType] || gameType;
  },

  // 格式化欄位值顯示
  formatFieldValue(field: string, value: any): string {
    if (value === null || value === undefined) {
      return '無';
    }
    
    switch (field) {
      case 'agentId':
        return value === 0 || value === '0' ? '任意代理商' : `代理商 ${value}`;
      
      case 'systemType':
        const systemTypeMap: Record<string, string> = {
          'COMMISSION': '占成制',
          'REBATE': '返水制'
        };
        return systemTypeMap[value] || value;
      
      case 'settlementCycle':
        const settlementMap: Record<string, string> = {
          'WEEKLY': '週結',
          'MONTHLY': '月結'
        };
        return settlementMap[value] || value;
      
      case 'isActive':
        return value ? '啟用' : '停用';
      
      case 'commissionPercent':
        return `${value}%`;
      
      default:
        return String(value);
    }
  }
};