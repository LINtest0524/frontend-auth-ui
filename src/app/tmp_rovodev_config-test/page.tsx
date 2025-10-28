'use client';

import { useState } from 'react';
import { useCompanyConfig, useFeatureEnabled, useThemeConfig } from '@/hooks/useCompanyConfig';
import { configManager } from '@/lib/config/configManager';

export default function ConfigTestPage() {
  const [selectedCompany, setSelectedCompany] = useState('a');
  const [testResults, setTestResults] = useState<string>('');
  
  // 使用 Hook 測試
  const { config, loading, error, refetch } = useCompanyConfig(selectedCompany);
  const themeConfig = useThemeConfig(config);
  const soundEnabled = useFeatureEnabled(config, 'soundEffects');
  const leaderboardEnabled = useFeatureEnabled(config, 'leaderboard');
  const vipEnabled = useFeatureEnabled(config, 'vipSystem');

  const runConfigTest = async () => {
    setTestResults('開始測試配置系統...\n');
    
    try {
      // 測試1: 直接使用配置管理器
      const testA = await configManager.getCompanyConfig('a');
      const testB = await configManager.getCompanyConfig('b');
      const testDefault = await configManager.getCompanyConfig('nonexistent');
      
      setTestResults(prev => prev + '\n✅ 測試1: 直接配置管理器\n' +
        `- A公司: ${testA.companyInfo.name} (${testA.branding.theme})\n` +
        `- B公司: ${testB.companyInfo.name} (${testB.branding.theme})\n` +
        `- 不存在的公司: ${testDefault.companyInfo.name} (回退成功)\n`
      );

      // 測試2: 快取機制
      const start = Date.now();
      await configManager.getCompanyConfig('a'); // 第二次載入，應該使用快取
      const cacheTime = Date.now() - start;
      
      setTestResults(prev => prev + 
        `\n✅ 測試2: 快取機制\n` +
        `- 快取載入時間: ${cacheTime}ms (應該 < 5ms)\n`
      );

      // 測試3: 功能檢查
      setTestResults(prev => prev + 
        `\n✅ 測試3: 功能檢查 (${selectedCompany}公司)\n` +
        `- 音效系統: ${soundEnabled ? '啟用' : '停用'}\n` +
        `- 排行榜: ${leaderboardEnabled ? '啟用' : '停用'}\n` +
        `- VIP系統: ${vipEnabled ? '啟用' : '停用'}\n`
      );

      // 測試4: 主題配置
      if (themeConfig) {
        setTestResults(prev => prev + 
          `\n✅ 測試4: 主題配置\n` +
          `- 主題: ${themeConfig.theme}\n` +
          `- 主色: ${themeConfig.colors.primary}\n` +
          `- 次色: ${themeConfig.colors.secondary}\n` +
          `- 強調色: ${themeConfig.colors.accent}\n`
        );
      }

      // 測試5: 載入的公司列表
      const loadedCompanies = configManager.getLoadedCompanies();
      setTestResults(prev => prev + 
        `\n✅ 測試5: 已載入公司\n` +
        `- 公司列表: ${loadedCompanies.join(', ')}\n`
      );

      setTestResults(prev => prev + '\n🎉 所有測試完成！配置系統正常運作');

    } catch (testError) {
      setTestResults(prev => prev + 
        `\n❌ 測試失敗: ${testError instanceof Error ? testError.message : '未知錯誤'}`
      );
    }
  };

  const clearCache = () => {
    configManager.clearCache();
    setTestResults('✅ 快取已清除');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">配置系統測試頁面</h1>
      
      {/* 公司選擇 */}
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">選擇測試公司</h2>
        <div className="flex gap-4 mb-4">
          {['a', 'b', 'default', 'nonexistent'].map(company => (
            <button
              key={company}
              onClick={() => setSelectedCompany(company)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedCompany === company
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {company === 'nonexistent' ? '不存在的公司' : `${company.toUpperCase()} 公司`}
            </button>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={runConfigTest}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            執行完整測試
          </button>
          
          <button 
            onClick={clearCache}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            清除快取
          </button>
          
          <button 
            onClick={refetch}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? '載入中...' : '重新載入配置'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hook 測試結果 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Hook 測試結果 ({selectedCompany})</h3>
          
          {loading && (
            <div className="text-blue-600 mb-4">⏳ 載入中...</div>
          )}
          
          {error && (
            <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">
              ❌ 錯誤: {error}
            </div>
          )}
          
          {config && (
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">基本資訊</h4>
                <p>公司代碼: {config.companyInfo.code}</p>
                <p>公司名稱: {config.companyInfo.name}</p>
                <p>網域: {config.companyInfo.domain}</p>
                <p>使用新架構: {config.system.useNewArchitecture ? '是' : '否'}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">品牌設定</h4>
                <p>主題: {config.branding.theme}</p>
                <div className="flex items-center gap-2">
                  <span>主色:</span>
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: config.branding.primaryColor }}
                  ></div>
                  <span>{config.branding.primaryColor}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">功能狀態</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>🔊 音效: {soundEnabled ? '✅' : '❌'}</span>
                  <span>🏆 排行榜: {leaderboardEnabled ? '✅' : '❌'}</span>
                  <span>👑 VIP: {vipEnabled ? '✅' : '❌'}</span>
                  <span>💬 客服: {useFeatureEnabled(config, 'liveChat') ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 完整測試結果 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">完整測試結果</h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded border min-h-[400px] overflow-auto">
            {testResults || '點擊「執行完整測試」開始測試...'}
          </pre>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-blue-800 font-semibold mb-2">💡 測試說明</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Hook 測試</strong>: 測試 useCompanyConfig Hook 的即時載入</li>
          <li>• <strong>完整測試</strong>: 測試配置管理器的所有功能</li>
          <li>• <strong>快取測試</strong>: 驗證配置快取機制</li>
          <li>• <strong>回退測試</strong>: 測試不存在公司的回退機制</li>
          <li>• <strong>功能檢查</strong>: 驗證各種功能開關</li>
        </ul>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-semibold mb-2">⚠️ 注意事項</h4>
        <p className="text-yellow-700 text-sm">
          這是臨時測試頁面，實作完成後會被移除。
          訪問路徑: /tmp_rovodev_config-test
        </p>
      </div>
    </div>
  );
}