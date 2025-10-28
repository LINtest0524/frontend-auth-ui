// 模組系統型別定義

import { ComponentType } from 'react';

// 模組基礎介面
export interface ModuleBase {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  dependencies: ModuleDependency[];
  permissions: string[];
}

// 模組依賴
export interface ModuleDependency {
  moduleId: string;
  version: string;
  required: boolean;
}

// 模組配置
export interface ModuleConfig {
  [key: string]: any;
}

// 模組載入結果
export interface ModuleLoadResult {
  success: boolean;
  component?: ComponentType;
  error?: string;
  fallback?: ComponentType;
}

// 模組註冊資訊
export interface ModuleRegistry {
  [moduleId: string]: {
    component: ComponentType;
    config: ModuleConfig;
    metadata: ModuleBase;
    loadedAt: Date;
    status: ModuleStatus;
  };
}

// 模組狀態
export type ModuleStatus = 
  | 'loading'
  | 'loaded'
  | 'error'
  | 'disabled'
  | 'fallback';

// 模組合約 (Module Contract)
export interface ModuleContract {
  // 輸入介面
  inputs: {
    props: Record<string, any>;
    config: ModuleConfig;
    context: ModuleContext;
  };
  
  // 輸出介面
  outputs: {
    events: ModuleEvent[];
    data: Record<string, any>;
    errors: ModuleError[];
  };
  
  // 回退方案
  fallback: {
    component: ComponentType;
    message: string;
    retryable: boolean;
  };
  
  // 生命週期
  lifecycle: {
    onMount?: (context: ModuleContext) => void;
    onUnmount?: (context: ModuleContext) => void;
    onError?: (error: ModuleError, context: ModuleContext) => void;
    onConfigChange?: (newConfig: ModuleConfig, context: ModuleContext) => void;
  };
}

// 模組上下文
export interface ModuleContext {
  companyCode: string;
  userRole: string;
  userPermissions: string[];
  currentPage: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  locale: string;
  theme: string;
}

// 模組事件
export interface ModuleEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
}

// 模組錯誤
export interface ModuleError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  timestamp: Date;
  context: any;
}

// 模組載入器配置
export interface ModuleLoaderConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableFallback: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
}

// 模組快取
export interface ModuleCache {
  [moduleId: string]: {
    component: ComponentType;
    timestamp: Date;
    ttl: number;
    hits: number;
  };
}

// 具體模組類型定義

// 音效模組
export interface SoundEffectsModule extends ModuleBase {
  config: {
    enabled: boolean;
    volume: number;
    sounds: Record<string, string>;
    backgroundMusic: {
      enabled: boolean;
      tracks: string[];
      shuffle: boolean;
      loop: boolean;
    };
  };
}

// 排行榜模組
export interface LeaderboardModule extends ModuleBase {
  config: {
    enabled: boolean;
    position: string;
    updateInterval: number;
    categories: string[];
    displayCount: number;
    showAvatars: boolean;
    showPrizes: boolean;
    autoRefresh: boolean;
  };
}

// 即時客服模組
export interface LiveChatModule extends ModuleBase {
  config: {
    enabled: boolean;
    provider: string;
    position: string;
    autoOpen: boolean;
    workingHours: {
      enabled: boolean;
      timezone: string;
      schedule: Record<string, { start: string; end: string }>;
    };
  };
}

// VIP 系統模組
export interface VIPSystemModule extends ModuleBase {
  config: {
    enabled: boolean;
    levels: Array<{
      id: number;
      name: string;
      minPoints: number;
      color: string;
      icon: string;
    }>;
    pointsSystem: {
      conversionRate: number;
      minimumBet: number;
      bonusMultiplier: number;
    };
    levelUpAnimation: boolean;
  };
}

// 錦標賽模組
export interface TournamentModule extends ModuleBase {
  config: {
    enabled: boolean;
    types: string[];
    maxParticipants: number;
    entryFee: {
      enabled: boolean;
      amount: number;
      currency: string;
    };
    prizes: Record<string, number>;
  };
}

// 成就系統模組
export interface AchievementModule extends ModuleBase {
  config: {
    enabled: boolean;
    categories: string[];
    showNotifications: boolean;
    rewardTypes: string[];
  };
}

// 模組工廠
export interface ModuleFactory {
  createModule(type: string, config: ModuleConfig): Promise<ComponentType>;
  validateModule(module: ModuleBase): boolean;
  registerModule(moduleId: string, module: ComponentType): void;
  unregisterModule(moduleId: string): void;
}

// 模組管理器
export interface ModuleManager {
  loadModule(moduleId: string, config: ModuleConfig): Promise<ModuleLoadResult>;
  unloadModule(moduleId: string): Promise<void>;
  reloadModule(moduleId: string): Promise<ModuleLoadResult>;
  getModule(moduleId: string): ComponentType | null;
  getModuleStatus(moduleId: string): ModuleStatus;
  getLoadedModules(): string[];
  clearCache(): void;
}

// 預設模組列表
export const DEFAULT_MODULES = {
  SOUND_EFFECTS: 'SoundEffects',
  LEADERBOARD: 'Leaderboard', 
  LIVE_CHAT: 'LiveChat',
  VIP_SYSTEM: 'VIPSystem',
  TOURNAMENT: 'Tournament',
  ACHIEVEMENT: 'Achievement',
  ANALYTICS: 'Analytics',
  NOTIFICATION: 'Notification'
} as const;

// 模組類型聯合
export type AvailableModules = typeof DEFAULT_MODULES[keyof typeof DEFAULT_MODULES];