import { create } from 'zustand';
import { 
  CommissionCondition, 
  CommissionConditionListItem, 
  CommissionConditionQuery,
  CreateCommissionConditionDto,
  UpdateCommissionConditionDto 
} from '@/types/commission-condition';
import { commissionConditionsApi } from '@/lib/api/commissionConditions';

interface CommissionConditionsState {
  // 狀態
  items: CommissionConditionListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  
  // 篩選條件
  filters: {
    page: number;
    limit: number;
    commissionPercentMin?: number;
    commissionPercentMax?: number;
    settlementCycle?: string;
    systemType?: string;
  };

  // Actions
  setFilters: (filters: Partial<CommissionConditionsState['filters']>) => void;
  fetchList: (query?: CommissionConditionQuery) => Promise<void>;
  getOne: (id: string) => Promise<CommissionCondition>;
  createOne: (payload: CreateCommissionConditionDto) => Promise<CommissionCondition>;
  updateOne: (id: string, payload: UpdateCommissionConditionDto) => Promise<CommissionCondition>;
  toggleStatus: (id: string, isActive: boolean) => Promise<void>;
  removeOne: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCommissionConditionsStore = create<CommissionConditionsState>((set, get) => ({
  // 初始狀態
  items: [],
  total: 0,
  loading: false,
  error: null,
  
  filters: {
    page: 1,
    limit: 50,
    commissionPercentMin: 0,
    commissionPercentMax: 100,
  },

  // 設定篩選條件
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    
    // 如果是換頁以外的篩選，重置到第一頁
    if ('commissionPercentMin' in newFilters || 'commissionPercentMax' in newFilters || 
        'settlementCycle' in newFilters || 'systemType' in newFilters) {
      updatedFilters.page = 1;
    }
    
    set({ filters: updatedFilters });
    
    // 移除自動重新載入，改為手動查詢
    // get().fetchList(updatedFilters);
  },

  // 載入列表
  fetchList: async (query) => {
    set({ loading: true, error: null });
    
    try {
      const queryParams = query || get().filters;
      const response = await commissionConditionsApi.list(queryParams);
      
      set({
        items: response.items,
        total: response.total,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '載入失敗',
      });
      throw error;
    }
  },

  // 取得單筆
  getOne: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const item = await commissionConditionsApi.get(id);
      set({ loading: false });
      return item;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '載入失敗',
      });
      throw error;
    }
  },

  // 建立
  createOne: async (payload) => {
    set({ loading: true, error: null });
    
    try {
      const newItem = await commissionConditionsApi.create(payload);
      set({ loading: false });
      
      // 成功後重新載入列表
      await get().fetchList();
      
      return newItem;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '建立失敗',
      });
      throw error;
    }
  },

  // 更新
  updateOne: async (id, payload) => {
    set({ loading: true, error: null });
    
    try {
      const updatedItem = await commissionConditionsApi.update(id, payload);
      set({ loading: false });
      
      // 成功後重新載入列表
      await get().fetchList();
      
      return updatedItem;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '更新失敗',
      });
      throw error;
    }
  },

  // 切換狀態
  toggleStatus: async (id, isActive) => {
    set({ loading: true, error: null });
    
    try {
      await commissionConditionsApi.patchStatus(id, isActive);
      set({ loading: false });
      
      // 成功後重新載入列表
      await get().fetchList();
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '狀態更新失敗',
      });
      throw error;
    }
  },

  // 刪除
  removeOne: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await commissionConditionsApi.remove(id);
      set({ loading: false });
      
      // 成功後重新載入列表
      await get().fetchList();
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '刪除失敗',
      });
      throw error;
    }
  },

  // 清除錯誤
  clearError: () => {
    set({ error: null });
  },
}));