'use client';

import { useState, useEffect } from 'react';
import BannerCarousel from '@/components/BannerCarousel';

export default function DebugAPage() {
  const [bannerData, setBannerData] = useState<any[]>([]);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const debugA = async () => {
      setDebugInfo('診斷 A 公司問題...\n');
      
      try {
        // 測試 Banner API
        const bannerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=a`);
        console.log('A 公司 Banner API 回應:', bannerResponse);
        
        if (bannerResponse.ok) {
          const banners = await bannerResponse.json();
          setBannerData(banners);
          setDebugInfo(prev => prev + `✅ Banner API 成功: ${banners.length} 筆資料\n`);
          setDebugInfo(prev => prev + `Banner 資料: ${JSON.stringify(banners, null, 2)}\n\n`);
        } else {
          setDebugInfo(prev => prev + `❌ Banner API 失敗: ${bannerResponse.status}\n`);
        }

        // 測試模組 API
        const moduleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=a`);
        console.log('A 公司模組 API 回應:', moduleResponse);
        
        if (moduleResponse.ok) {
          const modules = await moduleResponse.json();
          setEnabledModules(modules);
          setDebugInfo(prev => prev + `✅ 模組 API 成功: ${modules.join(', ')}\n`);
          setDebugInfo(prev => prev + `啟用模組: [${modules.join(', ')}]\n`);
          setDebugInfo(prev => prev + `包含 banner: ${modules.includes('banner') ? '✅' : '❌'}\n\n`);
        } else {
          setDebugInfo(prev => prev + `❌ 模組 API 失敗: ${moduleResponse.status}\n`);
        }

      } catch (error) {
        setDebugInfo(prev => prev + `💥 錯誤: ${error instanceof Error ? error.message : '未知錯誤'}\n`);
      }
    };

    debugA();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">A 公司 Banner 問題診斷</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 診斷結果 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔍 診斷資訊</h3>
          <pre className="text-sm bg-gray-50 p-4 rounded border max-h-96 overflow-auto whitespace-pre-wrap">
            {debugInfo || '載入中...'}
          </pre>
        </div>

        {/* 狀態摘要 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 A 公司狀態</h3>
          
          <div className="space-y-3">
            <div className="border rounded p-3">
              <h4 className="font-medium">Banner 狀態</h4>
              <p className="text-sm text-gray-600">數量: {bannerData.length}</p>
              <p className="text-sm text-gray-600">API 狀態: {bannerData.length > 0 ? '✅ 正常' : '❌ 無資料'}</p>
            </div>
            
            <div className="border rounded p-3">
              <h4 className="font-medium">模組狀態</h4>
              <p className="text-sm text-gray-600">啟用數量: {enabledModules.length}</p>
              <p className="text-sm text-gray-600">Banner 模組: {enabledModules.includes('banner') ? '✅ 啟用' : '❌ 未啟用'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 強制測試 Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">🧪 強制顯示 A 公司 Banner</h3>
        <p className="text-sm text-green-700 mb-4">
          無視模組狀態，直接使用 A 公司的 Banner 資料
        </p>
        
        {bannerData.length > 0 ? (
          <div>
            <h4 className="font-medium mb-2">A 公司真實 Banner (強制顯示)</h4>
            <BannerCarousel banners={bannerData} companyCode="a" />
          </div>
        ) : (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">等待 Banner 資料載入...</p>
          </div>
        )}
      </div>

      {/* 模組檢查建議 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">💡 可能的解決方案</h3>
        
        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-yellow-400 pl-3">
            <p><strong>如果 Banner 有資料但未顯示：</strong></p>
            <ul className="list-disc list-inside mt-1">
              <li>檢查 A 公司是否啟用 Banner 模組</li>
              <li>檢查資料庫 company_modules 表</li>
              <li>確認 A 公司的模組設定正確</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-blue-400 pl-3">
            <p><strong>SQL 檢查指令：</strong></p>
            <code className="block mt-1 text-xs bg-gray-100 p-2 rounded">
              SELECT * FROM company_modules WHERE "companyId" = 3 AND module_key = 'banner';
            </code>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-red-800 font-semibold mb-2">⚠️ 注意事項</h4>
        <p className="text-red-700 text-sm">
          這是臨時診斷頁面。訪問路徑: /tmp_rovodev_debug-a
        </p>
      </div>
    </div>
  );
}