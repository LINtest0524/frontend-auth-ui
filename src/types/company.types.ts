// 公司配置型別定義

export interface CompanyConfig {
  // 基本資訊
  companyInfo: {
    code: string;
    name: string;
    domain: string;
    timezone: string;
    currency: string;
    language: string;
  };
  
  // 品牌設定
  branding: {
    theme: 'classic' | 'modern' | 'luxury' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logo: {
      main: string;
      favicon: string;
      loading?: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
  
  // 版面配置
  layout: {
    type: 'standard' | 'compact' | 'luxury' | 'mobile-first';
    header: {
      style: 'fixed' | 'static' | 'transparent';
      showLogo: boolean;
      showNavigation: boolean;
      showUserInfo: boolean;
    };
    sidebar: {
      enabled: boolean;
      position: 'left' | 'right';
      collapsible: boolean;
    };
    footer: {
      enabled: boolean;
      content: 'minimal' | 'standard' | 'extended';
    };
  };
  
  // 功能模組配置
  modules: {
    // 核心功能 (必需)
    core: {
      authentication: boolean;
      userProfile: boolean;
      wallet: boolean;
      gameHistory: boolean;
      notifications: boolean;
    };
    
    // 可選功能
    optional: {
      soundEffects?: SoundEffectsConfig;
      leaderboard?: LeaderboardConfig;
      liveChat?: LiveChatConfig;
      vipSystem?: VIPSystemConfig;
      tournament?: TournamentConfig;
      promotions?: PromotionConfig;
      achievements?: AchievementConfig;
    };
  };
  
  // 頁面配置
  pages: {
    homepage: PageConfig;
    games: PageConfig;
    profile: PageConfig;
    wallet: PageConfig;
    promotions: PageConfig;
    vip: PageConfig;
  };
  
  // 遊戲配置
  games: {
    categories: GameCategory[];
    featured: string[];
    newGames: string[];
    popularGames: string[];
    jackpotGames: string[];
  };
  
  // API 配置
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    rateLimits: {
      [endpoint: string]: number;
    };
  };
  
  // SEO 配置
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
  };
  
  // 系統控制
  system: {
    useNewArchitecture: boolean;
    enabledFeatures: string[];
    maintenanceMode: boolean;
  };
}

// 音效模組配置
export interface SoundEffectsConfig {
  enabled: boolean;
  volume: number; // 0-100
  sounds: {
    click: string;
    hover: string;
    win: string;
    lose: string;
    notification: string;
    background?: string;
  };
  backgroundMusic: {
    enabled: boolean;
    tracks: string[];
    shuffle: boolean;
    loop: boolean;
  };
}

// 排行榜模組配置
export interface LeaderboardConfig {
  enabled: boolean;
  position: 'homepage' | 'sidebar' | 'dedicated-page' | 'floating';
  updateInterval: number; // 秒
  categories: ('daily' | 'weekly' | 'monthly' | 'all-time')[];
  displayCount: number;
  showAvatars: boolean;
  showPrizes: boolean;
  autoRefresh: boolean;
}

// 即時客服配置
export interface LiveChatConfig {
  enabled: boolean;
  provider: 'internal' | 'crisp' | 'intercom' | 'zendesk';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoOpen: boolean;
  workingHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [day: string]: {
        start: string;
        end: string;
      };
    };
  };
}

// VIP 系統配置
export interface VIPSystemConfig {
  enabled: boolean;
  levels: VIPLevel[];
  benefits: VIPBenefit[];
  pointsSystem: {
    conversionRate: number; // 消費金額 : VIP 點數
    minimumBet: number;
    bonusMultiplier: number;
  };
  levelUpAnimation: boolean;
}

// VIP 等級
export interface VIPLevel {
  id: number;
  name: string;
  minPoints: number;
  color: string;
  icon: string;
}

// VIP 福利
export interface VIPBenefit {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  type: 'cashback' | 'bonus' | 'gift' | 'service';
  value: number | string;
}

// 錦標賽配置
export interface TournamentConfig {
  enabled: boolean;
  types: ('leaderboard' | 'elimination' | 'time-limited')[];
  maxParticipants: number;
  entryFee: {
    enabled: boolean;
    amount: number;
    currency: string;
  };
  prizes: {
    first: number;
    second: number;
    third: number;
    participation: number;
  };
}

// 促銷活動配置
export interface PromotionConfig {
  enabled: boolean;
  bannerPosition: 'top' | 'sidebar' | 'floating' | 'modal';
  autoShow: boolean;
  showFrequency: 'once' | 'daily' | 'weekly' | 'always';
  categories: ('welcome' | 'deposit' | 'cashback' | 'tournament' | 'seasonal')[];
}

// 成就系統配置
export interface AchievementConfig {
  enabled: boolean;
  categories: ('gaming' | 'social' | 'financial' | 'loyalty')[];
  showNotifications: boolean;
  rewardTypes: ('points' | 'badges' | 'cashback' | 'bonuses')[];
}

// 遊戲分類
export interface GameCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
  enabled: boolean;
  gameIds: string[];
}

// 時間範圍
export interface TimeRange {
  start: string;
  end: string;
  timezone?: string;
}

// 配置驗證結果
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 配置版本資訊
export interface ConfigVersion {
  version: string;
  timestamp: string;
  author: string;
  changelog: string;
  config: CompanyConfig;
}