import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ActivityType = 'STRICT_STREAK_7' | 'FLEX_CUMULATIVE' | 'DAILY_CALENDAR';

interface DayReward {
  dayIndex: number;
  rewardType: 'CASH' | 'POINTS' | 'COUPON' | 'ITEM';
  amount?: number;
  metaJson?: any;
}

interface Threshold {
  daysRequired: number;
  reward: {
    rewardType: 'CASH' | 'POINTS' | 'COUPON' | 'ITEM';
    amount?: number;
    metaJson?: any;
  };
}

interface ActivityFormData {
  title: string;
  activityType: ActivityType;
  days?: number;
  startDate: string;
  endDate: string;
  publishAt?: string;
  isEnabled: boolean;
  configJson?: any;
}

interface FormErrors {
  [key: string]: string;
}

interface CheckinStore {
  // 表單數據
  formData: ActivityFormData;
  dayRewards: DayReward[];
  thresholds: Threshold[];
  
  // UI 狀態
  errors: FormErrors;
  loading: boolean;
  
  // Actions
  setFormData: (data: Partial<ActivityFormData>) => void;
  setDayRewards: (rewards: DayReward[]) => void;
  setThresholds: (thresholds: Threshold[]) => void;
  setErrors: (errors: FormErrors) => void;
  setLoading: (loading: boolean) => void;
  
  // 重置
  resetForm: () => void;
  
  // 初始化（用於編輯模式）
  initializeForm: (data: any) => void;
  
  // 驗證
  validateForm: () => boolean;
}

const initialFormData: ActivityFormData = {
  title: '',
  activityType: 'STRICT_STREAK_7',
  days: undefined,
  startDate: '',
  endDate: '',
  publishAt: '',
  isEnabled: false,
  configJson: {},
};

export const useCheckinStore = create<CheckinStore>()(
  persist(
    (set, get) => ({
      // 初始狀態
      formData: initialFormData,
      dayRewards: [],
      thresholds: [],
      errors: {},
      loading: false,

      // Actions
      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setDayRewards: (rewards) =>
        set({ dayRewards: rewards }),

      setThresholds: (thresholds) =>
        set({ thresholds }),

      setErrors: (errors) =>
        set({ errors }),

      setLoading: (loading) =>
        set({ loading }),

      resetForm: () =>
        set({
          formData: initialFormData,
          dayRewards: [],
          thresholds: [],
          errors: {},
          loading: false,
        }),

      initializeForm: (data) => {
        const formData: ActivityFormData = {
          title: data.title || '',
          activityType: data.activityType || 'STRICT_STREAK_7',
          days: data.days,
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          publishAt: data.publishAt ? data.publishAt.split('T')[0] : '',
          isEnabled: data.isEnabled || false,
          configJson: data.configJson || {},
        };

        set({
          formData,
          dayRewards: data.dayRewards || [],
          thresholds: data.thresholds || [],
          errors: {},
        });
      },

      validateForm: () => {
        const { formData } = get();
        const errors: FormErrors = {};

        // 基本驗證
        if (!formData.title.trim()) {
          errors.title = '請輸入活動標題';
        }

        if (!formData.startDate) {
          errors.startDate = '請選擇開始日期';
        }

        if (!formData.endDate) {
          errors.endDate = '請選擇結束日期';
        }

        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
          errors.endDate = '結束日期不能早於開始日期';
        }

        if (formData.publishAt && formData.endDate && formData.publishAt > formData.endDate) {
          errors.publishAt = '預約上架時間不能晚於結束日期';
        }

        // 活動類型特定驗證
        const needsDays = ['STRICT_STREAK_7', 'DAILY_CALENDAR'].includes(formData.activityType);
        if (needsDays && !formData.days) {
          errors.days = '此活動類型需要設定天數';
        }

        if (formData.days && formData.days <= 0) {
          errors.days = '天數必須大於 0';
        }

        set({ errors });
        return Object.keys(errors).length === 0;
      },
    }),
    {
      name: 'checkin-form-storage',
      partialize: (state) => ({
        // 只持久化表單數據，不持久化 UI 狀態
        formData: state.formData,
        dayRewards: state.dayRewards,
        thresholds: state.thresholds,
      }),
    }
  )
);

// 輔助 hooks
export const useCheckinFormData = () => {
  const store = useCheckinStore();
  return {
    formData: store.formData,
    setFormData: store.setFormData,
  };
};

export const useCheckinRewards = () => {
  const store = useCheckinStore();
  return {
    dayRewards: store.dayRewards,
    thresholds: store.thresholds,
    setDayRewards: store.setDayRewards,
    setThresholds: store.setThresholds,
  };
};

export const useCheckinValidation = () => {
  const store = useCheckinStore();
  return {
    errors: store.errors,
    validateForm: store.validateForm,
    setErrors: store.setErrors,
  };
};