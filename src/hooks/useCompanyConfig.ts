// 使用公司配置的 React Hook

'use client';

import { useEffect, useState } from 'react';
import { configManager } from '@/lib/config/configManager';
import type { CompanyConfig } from '@/types';

interface UseCompanyConfigResult {
  config: CompanyConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 獲取公司配置的 Hook
 * @param companyCode 公司代碼
 * @returns 配置狀態和方法
 */
export function useCompanyConfig(companyCode: string): UseCompanyConfigResult {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    if (!companyCode) {
      setError('公司代碼不能為空');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const companyConfig = await configManager.getCompanyConfig(companyCode);
      setConfig(companyConfig);
      
      console.log(`[useCompanyConfig] 載入配置成功: ${companyCode}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入配置失敗';
      setError(errorMessage);
      setConfig(null);
      
      console.error(`[useCompanyConfig] 載入配置失敗: ${companyCode}`, err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    // 清除快取並重新載入
    configManager.clearCache(companyCode);
    await loadConfig();
  };

  useEffect(() => {
    loadConfig();
  }, [companyCode]);

  return {
    config,
    loading,
    error,
    refetch
  };
}

/**
 * 檢查特定功能是否啟用
 * @param config 公司配置
 * @param feature 功能名稱
 * @returns 是否啟用
 */
export function useFeatureEnabled(config: CompanyConfig | null, feature: string): boolean {
  if (!config) return false;
  
  // 檢查系統功能開關
  if (config.system.enabledFeatures.includes(feature)) {
    return true;
  }

  // 檢查模組配置
  const moduleConfig = config.modules.optional;
  
  switch (feature) {
    case 'soundEffects':
      return moduleConfig.soundEffects?.enabled || false;
    case 'leaderboard':
      return moduleConfig.leaderboard?.enabled || false;
    case 'liveChat':
      return moduleConfig.liveChat?.enabled || false;
    case 'vipSystem':
      return moduleConfig.vipSystem?.enabled || false;
    case 'tournament':
      return moduleConfig.tournament?.enabled || false;
    case 'promotions':
      return moduleConfig.promotions?.enabled || false;
    case 'achievements':
      return moduleConfig.achievements?.enabled || false;
    default:
      return false;
  }
}

/**
 * 獲取主題相關配置
 * @param config 公司配置
 * @returns 主題配置
 */
export function useThemeConfig(config: CompanyConfig | null) {
  if (!config) return null;

  return {
    theme: config.branding.theme,
    colors: {
      primary: config.branding.primaryColor,
      secondary: config.branding.secondaryColor,
      accent: config.branding.accentColor
    },
    fonts: config.branding.fonts,
    layout: config.layout
  };
}

/**
 * 獲取 SEO 配置
 * @param config 公司配置
 * @param pageType 頁面類型
 * @returns SEO 配置
 */
export function useSEOConfig(config: CompanyConfig | null, pageType?: string) {
  if (!config) return null;

  const baseSEO = config.seo;
  
  if (pageType && config.pages[pageType as keyof typeof config.pages]) {
    const pageConfig = config.pages[pageType as keyof typeof config.pages];
    return {
      title: pageConfig.meta.title,
      description: pageConfig.meta.description,
      keywords: pageConfig.meta.keywords,
      ogImage: baseSEO.ogImage
    };
  }

  return baseSEO;
}