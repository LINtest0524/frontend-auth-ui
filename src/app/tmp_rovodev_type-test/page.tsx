'use client';

import { useState } from 'react';
import type { CompanyConfig, ModuleStatus, ThemeType } from '@/types';

// 測試頁面 - 驗證型別定義是否正確
export default function TypeTestPage() {
  const [testResult, setTestResult] = useState<string>('準備測試...');

  const runTypeTest = () => {
    try {
      // 測試 CompanyConfig 型別
      const testConfig: Partial<CompanyConfig> = {
        companyInfo: {
          code: 'test',
          name: '測試娛樂城',
          domain: 'test.casino.com',
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
            main: '/logo/test-main.png',
            favicon: '/logo/test-favicon.ico'
          },
          fonts: {
            primary: 'Inter',
            secondary: 'Roboto'
          }
        },
        system: {
          useNewArchitecture: true,
          enabledFeatures: ['leaderboard', 'soundEffects'],
          maintenanceMode: false
        }
      };

      // 測試 ModuleStatus 型別
      const moduleStatuses: ModuleStatus[] = ['loading', 'loaded', 'error', 'disabled', 'fallback'];

      // 測試 ThemeType 型別
      const themes: ThemeType[] = ['classic', 'modern', 'luxury', 'dark', 'light'];

      setTestResult(`✅ 型別測試通過！
      
配置測試：
- 公司代碼: ${testConfig.companyInfo?.code}
- 公司名稱: ${testConfig.companyInfo?.name}
- 使用新架構: ${testConfig.system?.useNewArchitecture}

模組狀態: ${moduleStatuses.join(', ')}

可用主題: ${themes.join(', ')}

✨ 所有型別定義正確載入！`);

    } catch (error) {
      setTestResult(`❌ 型別測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">型別定義測試頁面</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">測試說明</h2>
        <p className="text-gray-700 mb-4">
          這個頁面用來測試新建立的型別定義是否正確。
          點擊下方按鈕來執行測試。
        </p>
        
        <button 
          onClick={runTypeTest}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
        >
          執行型別測試
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">測試結果</h3>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded border">
          {testResult}
        </pre>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-semibold mb-2">⚠️ 注意事項</h4>
        <p className="text-yellow-700 text-sm">
          這是臨時測試頁面，實作完成後會被移除。
          訪問路徑: /tmp_rovodev_type-test
        </p>
      </div>
    </div>
  );
}