// 頁面配置型別定義

export interface PageConfig {
  layout: string; // 使用的版面配置
  sections: PageSection[];
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  permissions: string[]; // 需要的權限
  responsive: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
}

export interface PageSection {
  id: string;
  type: 'component' | 'module' | 'custom';
  component: string;
  props?: Record<string, any>;
  position: {
    order: number;
    grid?: {
      column: string;
      row: string;
    };
  };
  responsive: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  conditions?: {
    userLevel?: string[];
    gameStatus?: string[];
    timeRange?: TimeRange;
    userRole?: UserRole[];
  };
  style?: {
    className?: string;
    customCSS?: string;
  };
}

// 時間範圍 (重複定義，但為了類型完整性)
export interface TimeRange {
  start: string;
  end: string;
  timezone?: string;
}

// 用戶角色 (基於現有系統)
export type UserRole = 
  | 'USER' 
  | 'AGENT_SUPPORT' 
  | 'AGENT_LEVEL_4'
  | 'AGENT_LEVEL_3'
  | 'AGENT_LEVEL_2'
  | 'AGENT_LEVEL_1'
  | 'AGENT_OWNER'
  | 'GLOBAL_ADMIN' 
  | 'SUPER_ADMIN';

// 權限映射
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'SUPER_ADMIN': ['*'], // 所有權限
  
  'GLOBAL_ADMIN': [
    'company_management',
    'user_management', 
    'agent_management',
    'financial_reports',
    'system_settings',
    'audit_logs',
    'all_games',
    'all_promotions'
  ],
  
  'AGENT_LEVEL_1': [
    'agent_dashboard',
    'sub_agent_management',
    'member_management',
    'commission_reports',
    'financial_overview',
    'games_access'
  ],
  
  'AGENT_LEVEL_2': [
    'agent_dashboard',
    'sub_agent_management',
    'member_management',
    'commission_reports',
    'games_access'
  ],
  
  'AGENT_LEVEL_3': [
    'agent_dashboard',
    'sub_agent_management',
    'member_management',
    'basic_reports',
    'games_access'
  ],
  
  'AGENT_LEVEL_4': [
    'agent_dashboard',
    'member_management',
    'basic_reports',
    'games_access'
  ],
  
  'AGENT_OWNER': [
    'agent_dashboard',
    'sub_agent_management',
    'member_management',
    'commission_reports',
    'games_access'
  ],
  
  'AGENT_SUPPORT': [
    'customer_service',
    'user_profile_view',
    'basic_user_management',
    'chat_system',
    'ticket_management'
  ],
  
  'USER': [
    'profile_management',
    'games_access',
    'wallet_management',
    'promotion_view',
    'message_center',
    'customer_support'
  ]
};

// 頁面佈局類型
export type LayoutType = 
  | 'standard' 
  | 'compact' 
  | 'luxury' 
  | 'mobile-first';

// 元件類型
export type ComponentType = 
  | 'HeroBanner'
  | 'GameGrid'
  | 'Leaderboard'
  | 'UserProfile'
  | 'Wallet'
  | 'PromotionBanner'
  | 'NewsSection'
  | 'ContactInfo'
  | 'Navigation'
  | 'Footer';

// 模組類型
export type ModuleType = 
  | 'SoundEffects'
  | 'LiveChat'
  | 'VIPSystem'
  | 'Tournament'
  | 'Achievement'
  | 'Analytics';

// 頁面類型
export type PageType = 
  | 'homepage'
  | 'games'
  | 'profile'
  | 'wallet'
  | 'promotions'
  | 'vip'
  | 'news'
  | 'contact'
  | 'about';

// 響應式斷點
export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

// 預設響應式斷點
export const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1200px'
};