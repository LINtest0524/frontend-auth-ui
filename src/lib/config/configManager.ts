// 配置管理器 - 負責載入和管理公司配置

import type { CompanyConfig, ConfigValidationResult } from '@/types';

export class ConfigManager {
  private static instance: ConfigManager;
  private configCache = new Map<string, CompanyConfig>();
  private lastLoadTime = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分鐘快取

  // 單例模式 - 確保整個應用只有一個配置管理器
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 獲取公司配置
   * @param companyCode 公司代碼 (例如: 'a', 'b', 'casino1')
   * @returns 公司配置物件
   */
  async getCompanyConfig(companyCode: string): Promise<CompanyConfig> {
    try {
      // 1. 檢查快取是否有效
      if (this.isCacheValid(companyCode)) {
        console.log(`[ConfigManager] 使用快取配置: ${companyCode}`);
        return this.configCache.get(companyCode)!;
      }

      // 2. 載入配置檔案
      console.log(`[ConfigManager] 載入配置: ${companyCode}`);
      const config = await this.loadConfigFromFile(companyCode);

      // 3. 驗證配置
      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        console.error(`[ConfigManager] 配置驗證失敗: ${companyCode}`, validation.errors);
        throw new Error(`配置驗證失敗: ${validation.errors.join(', ')}`);
      }

      // 4. 合併預設值
      const completeConfig = this.mergeWithDefaults(config);

      // 5. 更新快取
      this.configCache.set(companyCode, completeConfig);
      this.lastLoadTime.set(companyCode, Date.now());

      console.log(`[ConfigManager] 配置載入成功: ${companyCode}`);
      return completeConfig;

    } catch (error) {
      console.error(`[ConfigManager] 載入配置失敗: ${companyCode}`, error);
      
      // 回退策略
      return this.handleLoadError(companyCode, error);
    }
  }

  /**
   * 從檔案載入配置
   */
  private async loadConfigFromFile(companyCode: string): Promise<Partial<CompanyConfig>> {
    try {
      // 嘗試載入公司專用配置
      const response = await fetch(`/config/companies/${companyCode}.json`);
      
      if (response.ok) {
        return await response.json();
      }

      // 如果沒有專用配置，載入預設配置
      console.warn(`[ConfigManager] 找不到 ${companyCode} 的配置，使用預設配置`);
      const defaultResponse = await fetch('/config/companies/default.json');
      
      if (defaultResponse.ok) {
        const defaultConfig = await defaultResponse.json();
        // 至少要設定正確的公司代碼
        return {
          ...defaultConfig,
          companyInfo: {
            ...defaultConfig.companyInfo,
            code: companyCode
          }
        };
      }

      throw new Error('無法載入任何配置檔案');

    } catch (error) {
      console.error('[ConfigManager] 檔案載入錯誤:', error);
      throw error;
    }
  }

  /**
   * 驗證配置格式
   */
  private validateConfig(config: Partial<CompanyConfig>): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本必要欄位檢查
    if (!config.companyInfo?.code) {
      errors.push('缺少公司代碼');
    }

    if (!config.companyInfo?.name) {
      errors.push('缺少公司名稱');
    }

    if (!config.branding?.primaryColor) {
      warnings.push('缺少主要顏色設定');
    }

    if (!config.pages?.homepage) {
      warnings.push('缺少首頁配置');
    }

    // 檢查模組配置
    if (config.modules?.optional?.soundEffects?.enabled && !config.modules.optional.soundEffects.sounds) {
      warnings.push('音效模組已啟用但缺少音效檔案設定');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 與預設配置合併
   */
  private mergeWithDefaults(config: Partial<CompanyConfig>): CompanyConfig {
    const defaultConfig = this.getDefaultConfig();
    
    // 深度合併配置
    return {
      ...defaultConfig,
      ...config,
      companyInfo: {
        ...defaultConfig.companyInfo,
        ...config.companyInfo
      },
      branding: {
        ...defaultConfig.branding,
        ...config.branding,
        logo: {
          ...defaultConfig.branding.logo,
          ...config.branding?.logo
        }
      },
      modules: {
        core: {
          ...defaultConfig.modules.core,
          ...config.modules?.core
        },
        optional: {
          ...defaultConfig.modules.optional,
          ...config.modules?.optional
        }
      },
      system: {
        ...defaultConfig.system,
        ...config.system
      }
    };
  }

  /**
   * 獲取預設配置
   */
  private getDefaultConfig(): CompanyConfig {
    return {
      companyInfo: {
        code: 'default',
        name: '預設娛樂城',
        domain: 'localhost',
        timezone: 'Asia/Taipei',
        currency: 'TWD',
        language: 'zh-TW'
      },
      branding: {
        theme: 'modern',
        primaryColor: '#1a202c',
        secondaryColor: '#2d3748',
        accentColor: '#f6e05e',
        logo: {
          main: '/logo/default-main.png',
          favicon: '/favicon.ico'
        },
        fonts: {
          primary: 'Inter, sans-serif',
          secondary: 'Roboto, sans-serif'
        }
      },
      layout: {
        type: 'standard',
        header: {
          style: 'fixed',
          showLogo: true,
          showNavigation: true,
          showUserInfo: true
        },
        sidebar: {
          enabled: true,
          position: 'left',
          collapsible: true
        },
        footer: {
          enabled: true,
          content: 'standard'
        }
      },
      modules: {
        core: {
          authentication: true,
          userProfile: true,
          wallet: true,
          gameHistory: true,
          notifications: true
        },
        optional: {}
      },
      pages: {
        homepage: {
          layout: 'standard',
          sections: [],
          meta: {
            title: '首頁',
            description: '歡迎來到娛樂城',
            keywords: ['娛樂城', '遊戲']
          },
          permissions: ['games_access'],
          responsive: {
            desktop: true,
            tablet: true,
            mobile: true
          }
        },
        games: {
          layout: 'standard',
          sections: [],
          meta: {
            title: '遊戲大廳',
            description: '精彩遊戲等你來挑戰',
            keywords: ['遊戲', '娛樂城']
          },
          permissions: ['games_access'],
          responsive: {
            desktop: true,
            tablet: true,
            mobile: true
          }
        },
        profile: {
          layout: 'standard',
          sections: [],
          meta: {
            title: '個人資料',
            description: '管理您的帳戶資訊',
            keywords: ['個人資料', '帳戶']
          },
          permissions: ['profile_management'],
          responsive: {
            desktop: true,
            tablet: true,
            mobile: true
          }
        },
        wallet: {
          layout: 'standard',
          sections: [],
          meta: {
            title: '錢包',
            description: '管理您的資金',
            keywords: ['錢包', '餘額']
          },
          permissions: ['wallet_management'],
          responsive: {
            desktop: true,
            tablet: true,
            mobile: true
          }
        },
        promotions: {
          layout: 'standard',
          sections: [],
          meta: {
            title: '優惠活動',
            description: '查看最新優惠活動',
            keywords: ['優惠', '活動']
          },
          permissions: ['promotion_view'],
          responsive: {
            desktop: true,
            tablet: true,
            mobile: true
          }
        },
        vip: {
          layout: 'standard',
          sections: [],
          meta: {
            title: 'VIP 專區',
            description: 'VIP 會員專屬服務',
            keywords: ['VIP', '會員']
          },
          permissions: ['games_access'],
          responsive: {
            desktop: true,
            tablet: true,
            mobile: true
          }
        }
      },
      games: {
        categories: [],
        featured: [],
        newGames: [],
        popularGames: [],
        jackpotGames: []
      },
      api: {
        baseUrl: '/api',
        timeout: 30000,
        retryAttempts: 3,
        rateLimits: {}
      },
      seo: {
        title: '預設娛樂城',
        description: '最佳的線上娛樂體驗',
        keywords: ['娛樂城', '線上遊戲'],
        ogImage: '/og-image.jpg'
      },
      system: {
        useNewArchitecture: false, // 預設使用舊架構
        enabledFeatures: [],
        maintenanceMode: false
      }
    };
  }

  /**
   * 檢查快取是否有效
   */
  private isCacheValid(companyCode: string): boolean {
    if (!this.configCache.has(companyCode)) {
      return false;
    }

    const lastLoad = this.lastLoadTime.get(companyCode) || 0;
    return (Date.now() - lastLoad) < this.CACHE_TTL;
  }

  /**
   * 處理載入錯誤的回退策略
   */
  private handleLoadError(companyCode: string, error: any): CompanyConfig {
    console.warn(`[ConfigManager] 配置載入失敗，使用回退策略: ${companyCode}`);
    
    // 檢查快取中是否有舊的配置
    if (this.configCache.has(companyCode)) {
      console.log(`[ConfigManager] 使用快取的舊配置: ${companyCode}`);
      return this.configCache.get(companyCode)!;
    }

    // 使用預設配置
    console.log(`[ConfigManager] 使用預設配置: ${companyCode}`);
    const defaultConfig = this.getDefaultConfig();
    defaultConfig.companyInfo.code = companyCode;
    defaultConfig.companyInfo.name = `${companyCode} 娛樂城`;
    
    return defaultConfig;
  }

  /**
   * 清除快取
   */
  clearCache(companyCode?: string): void {
    if (companyCode) {
      this.configCache.delete(companyCode);
      this.lastLoadTime.delete(companyCode);
      console.log(`[ConfigManager] 已清除 ${companyCode} 的快取`);
    } else {
      this.configCache.clear();
      this.lastLoadTime.clear();
      console.log('[ConfigManager] 已清除所有快取');
    }
  }

  /**
   * 獲取已載入的公司列表
   */
  getLoadedCompanies(): string[] {
    return Array.from(this.configCache.keys());
  }
}

// 匯出單例實例
export const configManager = ConfigManager.getInstance();